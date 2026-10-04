"""FastAPI routes for MOOD V3 workouts (mounted under /api/v3).

POST /api/v3/workouts/generate          unified generation (Strength / Sweat / Athletic)
GET  /api/v3/workouts/{id}              latest version of a generated workout
POST /api/v3/workouts/{id}/swap-exercise   exercise-level swap (same slot purpose, revalidated)
POST /api/v3/workouts/{id}/swap-workout    Swap Workout (same inputs, swap_count + 1)
POST /api/v3/workouts/{id}/complete        completion + per-set performance (history / progression source); idempotent,
                                           records the workout exactly once (see completion.py)
POST /api/v3/workouts/{id}/repeat          a fresh, un-completed copy of a workout (Saved Workouts: do it again), same plan
POST /api/v3/workouts/{id}/after           post-workout additions on a completed workout: fit rating, real metrics (idempotent $set)
GET  /api/v3/workouts/history           completed V3 workouts (summaries)
GET  /api/v3/workouts/{id}/bft          Built for Today progress: validated text so far + status (polled by the Cart while it writes)
GET  /api/v3/version                    engine phase + source fingerprint of the running process (no auth; dev stale-code check)

Collection: db.v3_workouts. Engine calls run in a worker thread (CPU-bound, engine-internal locks serialize them).
"""
from __future__ import annotations
import asyncio, datetime as _dt, json, logging, re, time, uuid as _uuid
from typing import List, Optional, Literal, Union
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from . import service, normalize as N, build_info
from .bft import llm as bft_llm
from .profile_defaults import apply_profile_defaults

log = logging.getLogger('mood_v3')
HISTORY_WINDOW = 30
BFT_RECENT = 8          # Built for Today: how many of the user's recent messages the copy layer avoids echoing
BFT_STALE_S = 20        # a 'writing' Built for Today older than this (process restart, lost task) settles on what it has
_BFT_TASKS = {}         # workout_id -> running background writer in this process (strong refs; a newer job cancels the older)

class GenerateBody(BaseModel):
    model_config = ConfigDict(extra='forbid')
    direction: Optional[Literal['strength', 'sweat', 'athletic']] = None
    states: List[str] = Field(default_factory=list, max_length=6)
    target: Optional[Union[List[str], str]] = None
    archetype: Optional[str] = None
    duration: int = 60
    experience: Literal['beginner', 'intermediate', 'advanced'] = 'intermediate'
    goal: Optional[str] = None
    equipment: str = 'commercial_gym'
    soreness: List[str] = Field(default_factory=list)
    training_frequency: Optional[str] = None
    training_preference: Optional[str] = None
    date: Optional[str] = None            # the user's local date (YYYY-MM-DD); seeds same-day determinism
    persist: bool = True                  # false = live preview (home card), not stored, not swappable

class SwapExerciseBody(BaseModel):
    model_config = ConfigDict(extra='forbid')
    item_id: str
    reason: Optional[Literal['dont_have', 'dont_like', 'too_hard', 'other']] = None

class SetLog(BaseModel):
    reps: Optional[int] = None
    load: Optional[float] = None
    unit: Optional[Literal['kg', 'lb']] = None
    seconds: Optional[int] = None
    distance_m: Optional[int] = None
    calories: Optional[int] = None

class ItemLog(BaseModel):
    item_id: Optional[str] = None
    exercise_id: Optional[str] = None
    sets: List[SetLog] = Field(default_factory=list)

class AfterBody(BaseModel):
    """Post-workout additions (Guided Session completion flow). Every field optional; only real numbers are sent (a wearable
    read or an athlete's edit, never an estimate). Applied with $set to the completed V3 workout and mirrored onto its
    user_workouts row, so a retry is harmless."""
    model_config = ConfigDict(extra='forbid')
    fit_rating: Optional[Literal['too_easy', 'just_right', 'too_much']] = None
    mood_after: Optional[str] = None
    calories: Optional[int] = Field(default=None, ge=0, le=5000)
    avg_heart_rate: Optional[int] = Field(default=None, ge=30, le=250)
    max_heart_rate: Optional[int] = Field(default=None, ge=30, le=250)
    steps: Optional[int] = Field(default=None, ge=0, le=100000)
    hrv_sdnn: Optional[float] = Field(default=None, ge=0, le=500)
    duration_actual: Optional[int] = Field(default=None, ge=1, le=600)
    metrics_source: Optional[Literal['wearable', 'edited']] = None

class CompleteBody(BaseModel):
    model_config = ConfigDict(extra='forbid')
    performance: List[ItemLog] = Field(default_factory=list)
    fit_rating: Optional[Literal['too_easy', 'just_right', 'too_much']] = None
    mood_after: Optional[str] = None
    duration_actual: Optional[int] = None
    # Guided Session (all optional; stored with the completion for analytics and support)
    started_at: Optional[str] = None
    completed_steps: Optional[int] = None
    total_steps: Optional[int] = None
    local_date: Optional[str] = None
    client_session_id: Optional[str] = Field(default=None, max_length=80)


# ------------------------------------------------------------------ media (reuse db.exercises video / thumbnail / cues)
_ABBR = [(r'\bdb\b', 'dumbbell'), (r'\bkb\b', 'kettlebell'), (r'\bbb\b', 'barbell'), (r'\bez\b', 'ez'), (r'\brdl\b', 'romanian deadlift')]

def _utc_iso(t):
    """Mongo hands back naive UTC datetimes; send them with their offset so the app never reads them as local time."""
    if t is None:
        return None
    if getattr(t, 'tzinfo', None) is None:
        t = t.replace(tzinfo=_dt.timezone.utc)
    return t.isoformat()

def norm_name(s):
    s = (s or '').lower().replace('&', ' and ')
    s = re.sub(r'[^a-z0-9 ]+', ' ', s)
    for a, b in _ABBR: s = re.sub(a, b, s)
    words = [w[:-1] if len(w) > 3 and w.endswith('s') and not w.endswith('ss') else w for w in s.split()]
    return ' '.join(words)

class MediaIndex:
    def __init__(self): self.idx = {}; self.t = 0.0
    async def get(self, db):
        if time.time() - self.t < 600 and self.idx: return self.idx
        idx = {}
        async for d in db.exercises.find({}, {'name': 1, 'aliases': 1, 'video_url': 1, 'thumbnail_url': 1, 'cues': 1, 'mistakes': 1}):
            for n in [d.get('name')] + list(d.get('aliases') or []):
                k = norm_name(n)
                if k and k not in idx: idx[k] = d
        self.idx, self.t = idx, time.time(); return idx
MEDIA = MediaIndex()

def attach_media(env, idx):
    wk = env.get('workout')
    if not wk: return env
    refs = [it['exercise'] for b in wk['blocks'] for it in b['items']] + [x['exercise'] for x in (wk['warmup'] or {}).get('items', []) if x.get('exercise')]
    items = [it for b in wk['blocks'] for it in b['items']]
    for ex in refs:
        d = idx.get(norm_name(ex['name'])) or idx.get(norm_name(ex['id'].replace('_', ' ')))
        if d and (d.get('video_url') or d.get('thumbnail_url')):
            ex['media'] = dict(video_url=d.get('video_url') or None, thumbnail_url=d.get('thumbnail_url') or None, library_id=str(d.get('_id')))
    for it in items:
        d = idx.get(norm_name(it['exercise']['name']))
        if not it['cues'] and d and d.get('cues'): it['cues'] = list(d['cues'])[:3]
        # Exercise Details (Guided Session layer 3): common mistakes from the library when it has them; optional, never required
        if d and d.get('mistakes') and not it.get('mistakes'): it['mistakes'] = [m for m in list(d['mistakes'])[:3] if isinstance(m, str) and m.strip()]
    return env


def build_v3_router(db, get_current_user, completion_hooks=None):
    """completion_hooks: mood_v3.completion.CompletionHooks from server.py (counts, free allowance, workout_completed event).
    Without hooks /complete only records the V3 completion itself."""
    r = APIRouter(prefix='/v3', tags=['v3-workouts'])
    col = db.v3_workouts

    async def _history(user_id):
        docs = await col.find({'user_id': user_id, 'status': 'completed'}, {'state.history_record': 1, 'completed_at': 1, 'performance_entries': 1}) \
                        .sort('completed_at', -1).limit(HISTORY_WINDOW).to_list(HISTORY_WINDOW)
        docs.reverse()
        hist = [dict(d['state']['history_record'], completed_at=_utc_iso(d['completed_at']) if d.get('completed_at') else None) for d in docs if d.get('state')]
        perf = [dict(completed_at=_utc_iso(d['completed_at']) if d.get('completed_at') else None, entries=d.get('performance_entries') or {}) for d in docs]
        return hist, perf

    async def _recent_bft(user_id):
        """The user's most recent Built for Today messages, newest first (the copy layer steers away from them)."""
        try:
            docs = await col.find({'user_id': user_id, 'envelope.workout.today.blurb': {'$exists': True}, 'envelope.workout.today.blurb_pending': {'$ne': True}},
                                  {'envelope.workout.today.blurb': 1}) \
                            .sort('created_at', -1).limit(BFT_RECENT).to_list(BFT_RECENT)
            return [d['envelope']['workout']['today']['blurb'] for d in docs if d.get('envelope')]
        except Exception as e:
            log.warning(f'v3 recent built-for-today lookup skipped: {e}')
            return []

    def _bft_prepare(env, persist=True):
        """Built for Today, hybrid streaming (Oct 2026). The workout never waits for the LLM: the composer copy is stored as
        the fallback and, when the writer is enabled, the envelope is marked blurb_pending with a job id so the Cart shows a
        writing state and polls GET /bft. Returns the job (id + server-only brief) to start after the workout is saved, or
        None. Always drops the server-only brief from the envelope."""
        meta = env.pop('_bft', None) or {}
        if not persist or env.get('status') != 'ok' or not meta.get('brief') or meta.get('keep') or not bft_llm.enabled():
            if env.get('workout') and env['workout'].get('today') and not meta.get('keep'):
                env['workout']['today']['blurb_pending'] = False
            return None
        job = _uuid.uuid4().hex[:12]
        today = env['workout']['today']
        today['blurb_pending'] = True; today['bft_job'] = job
        return dict(job=job, meta=meta)

    def _bft_doc(job):
        now = _dt.datetime.now(_dt.timezone.utc)
        return dict(job=job, status='writing', text='', started_at=now, updated_at=now) if job else None

    async def _bft_run(workout_id, user_id, job, meta):
        q = {'_id': workout_id, 'bft.job': job}
        async def publish(text):
            await col.update_one(q, {'$set': {'bft.status': 'streaming', 'bft.text': text, 'bft.updated_at': _dt.datetime.now(_dt.timezone.utc)}})
        try:
            text, used, m = await bft_llm.stream(meta, publish)
        except asyncio.CancelledError:
            log.info(f"bft stream cancelled workout={workout_id} job={job} (superseded)")
            raise
        except Exception as e:   # stream() does not raise; this is belt and braces so the job always settles
            text, used, m = None, [], dict(outcome='fallback', reason=f'error: {e!r}'[:200])
        now = _dt.datetime.now(_dt.timezone.utc)
        upd = {'bft.status': 'done' if text else 'fallback', 'bft.text': text or '', 'bft.metrics': m, 'bft.updated_at': now,
               'envelope.workout.today.blurb_pending': False}
        if text:
            upd['envelope.workout.today.blurb'] = text
            upd['envelope.workout.today.blurb_meta'] = dict(source='llm', frame=None, facts=used)
        try:
            await col.update_one(q, {'$set': upd})
        except Exception as e:
            log.warning(f'bft stream persist failed workout={workout_id}: {e}')
        log.info('bft stream ' + json.dumps(dict(workout=workout_id, user=user_id, job=job, **{k: v for k, v in m.items() if k not in ('rejected',)}), default=str)
                 + (f" rejected={[(r['idx'], r['problems'][:2]) for r in m.get('rejected', [])]}" if m.get('rejected') else ''))

    def _bft_start(workout_id, user_id, spec):
        if not spec: return
        old = _BFT_TASKS.pop(workout_id, None)
        if old and not old.done(): old.cancel()
        t = asyncio.create_task(_bft_run(workout_id, user_id, spec['job'], spec['meta']))
        _BFT_TASKS[workout_id] = t
        t.add_done_callback(lambda task, wid=workout_id: _BFT_TASKS.pop(wid, None) if _BFT_TASKS.get(wid) is task else None)

    async def _bft_settle(d):
        """A Built for Today job that never finished (process restart) settles on its validated text, or the composer copy."""
        b = d.get('bft') or {}
        today = ((d.get('envelope') or {}).get('workout') or {}).get('today') or {}
        if not today.get('blurb_pending') or b.get('status') in ('done', 'fallback'): return d
        started = b.get('started_at')
        if started and started.tzinfo is None: started = started.replace(tzinfo=_dt.timezone.utc)
        if started and (_dt.datetime.now(_dt.timezone.utc) - started).total_seconds() < BFT_STALE_S: return d
        text = (b.get('text') or '').strip()
        upd = {'bft.status': 'done' if text else 'fallback', 'bft.metrics': dict(outcome='partial' if text else 'fallback', reason='stale'),
               'envelope.workout.today.blurb_pending': False}
        if text:
            upd['envelope.workout.today.blurb'] = text
            upd['envelope.workout.today.blurb_meta'] = dict(source='llm', frame=None, facts=[])
            today['blurb'] = text
        today['blurb_pending'] = False
        d.setdefault('bft', {})['status'] = upd['bft.status']
        try: await col.update_one({'_id': d['_id'], 'bft.job': b.get('job')}, {'$set': upd})
        except Exception as e: log.warning(f'bft settle failed: {e}')
        log.info(f"bft stream settled stale workout={d['_id']} job={b.get('job')} -> {upd['bft.status']}")
        return d

    async def _training_profile(user_id):
        try:
            from bson import ObjectId
            doc = await db.users.find_one({'_id': ObjectId(user_id)}, {'training_profile': 1})
        except Exception:
            return None
        return (doc or {}).get('training_profile')

    async def _finish(env):
        env.pop('_bft', None)
        try: attach_media(env, await MEDIA.get(db))
        except Exception as e: log.warning(f'v3 media enrichment skipped: {e}')
        return env

    async def _load(workout_id, user_id):
        d = await col.find_one({'_id': workout_id})
        if not d: raise HTTPException(404, 'Workout not found')
        if d['user_id'] != user_id: raise HTTPException(403, 'Not your workout')
        return d

    def _trace(kind, user_id, env, req=None):
        # One compact line per generation: what was asked and what was built. Makes stale-process or wrong-route bugs obvious.
        w = env.get('workout') or {}
        items = [it['exercise']['id'] for b in w.get('blocks', []) for it in b['items']]
        ask = '' if req is None else f" ask=dir:{req.get('direction')} target:{req.get('target')} type:{req.get('archetype')} states:{req.get('states')} dur:{req.get('duration')}"
        log.info(f"v3 {kind} user={user_id} engine={build_info.ENGINE_PHASE}/{build_info.ENGINE_BUILD}{ask} -> "
                 f"{env.get('status')} {w.get('archetype', {}).get('id')} src={w.get('selection_source')} swap={w.get('swap_count')} n={len(items)}")

    async def _track_generated(user_id, raw, persist, t0, env=None, status=None, conflict_code=None):
        # Server-side v3_workout_generated (v3_tracking.py): counts conflicts and failures, which never reach v3_workouts.
        # Live Home previews (persist=False) re-generate on every chip tap, so only real Build requests are tracked.
        if not persist:
            return
        try:
            from v3_tracking import track_server_event
            w = (env or {}).get('workout') or {}
            await track_server_event(db, user_id, 'v3_workout_generated', {
                'status': status or (env or {}).get('status'),
                'conflict_code': conflict_code or ((env or {}).get('conflict') or {}).get('code'),
                'direction': w.get('direction') or raw.get('direction'),
                'states': list(raw.get('states') or []),
                'target': raw.get('target'),
                'duration': raw.get('duration'),
                'archetype': (w.get('archetype') or {}).get('id') or raw.get('archetype'),
                'selection_source': w.get('selection_source'),
                'v3_workout_id': w.get('workout_id'),
                'exercise_count': sum(len(b.get('items') or []) for b in (w.get('blocks') or [])),
                'estimated_minutes': (w.get('duration') or {}).get('estimated_minutes'),
                'generation_ms': int((time.perf_counter() - t0) * 1000),
                'engine_build': getattr(build_info, 'ENGINE_BUILD', None),
            })
        except Exception as e:
            log.warning(f'v3_workout_generated tracking failed: {e}')

    @r.get('/version')
    async def version():
        return dict(build_info.info(), schema_version=service.F.SCHEMA_VERSION)

    @r.post('/workouts/generate')
    async def generate(body: GenerateBody, user_id: str = Depends(get_current_user)):
        hist, perf = await _history(user_id)
        recent = await _recent_bft(user_id)
        # Persistent inputs: explicit request value > users.training_profile > backend default.
        profile = await _training_profile(user_id)
        raw, applied = apply_profile_defaults(body.model_dump(exclude={'persist'}), body.model_fields_set, profile)
        t0 = time.perf_counter()
        try:
            env, state = await asyncio.to_thread(lambda: service.generate_workout(raw, user_id, hist, perf, recent_bft=recent))
        except N.InputError as e:
            await _track_generated(user_id, raw, body.persist, t0, status='invalid', conflict_code=f'input:{e.field}')
            raise HTTPException(422, dict(field=e.field, message=e.message))
        except Exception:
            await _track_generated(user_id, raw, body.persist, t0, status='error')
            raise
        await _track_generated(user_id, raw, body.persist, t0, env=env)
        spec = _bft_prepare(env, persist=body.persist)
        if env['status'] == 'ok' and body.persist:
            now = _dt.datetime.now(_dt.timezone.utc)
            await col.insert_one({'_id': env['workout']['workout_id'], 'user_id': user_id, 'status': 'generated', 'created_at': now, 'updated_at': now,
                                  'state': state, 'envelope': env, 'bft': _bft_doc(spec and spec['job'])})
            _bft_start(env['workout']['workout_id'], user_id, spec)
        elif env['status'] == 'ok':
            env['workout']['workout_id'] = None
        if env['status'] != 'ok': log.info(f"v3 conflict {env['conflict']['code']} for {user_id}: {raw}")
        env['profile_defaults_applied'] = applied
        _trace('generate', user_id, env, raw)
        return await _finish(env)

    @r.get('/workouts/history')
    async def history(limit: int = 20, user_id: str = Depends(get_current_user)):
        docs = await col.find({'user_id': user_id, 'status': 'completed'}).sort('completed_at', -1).limit(min(limit, 100)).to_list(100)
        out = []
        for d in docs:
            w = d['envelope']['workout']
            out.append(dict(workout_id=d['_id'], completed_at=_utc_iso(d['completed_at']), direction=w['direction'], archetype=w['archetype'],
                            states=w['states'], duration=w['duration'], fit_rating=d.get('fit_rating'), mood_after=d.get('mood_after'),
                            exercises=[it['exercise']['name'] for b in w['blocks'] for it in b['items']]))
        return {'workouts': out, 'count': len(out)}

    @r.get('/workouts/{workout_id}')
    async def get_one(workout_id: str, user_id: str = Depends(get_current_user)):
        d = await _bft_settle(await _load(workout_id, user_id))
        return await _finish(d['envelope'])

    @r.get('/workouts/{workout_id}/bft')
    async def bft_progress(workout_id: str, user_id: str = Depends(get_current_user)):
        """Built for Today progress. text is only ever validated, complete sentences. status: writing (nothing yet) |
        streaming (text growing) | done (text is final) | fallback (show blurb, the composer copy). job ties the answer to the
        envelope the Cart is showing (a Different Workout starts a new job)."""
        d = await _bft_settle(await _load(workout_id, user_id))
        b = d.get('bft') or {}
        today = ((d.get('envelope') or {}).get('workout') or {}).get('today') or {}
        status = b.get('status') or ('fallback' if not today.get('blurb_pending') else 'writing')
        return dict(job=b.get('job'), status=status, text=b.get('text') or '', blurb=today.get('blurb'), pending=bool(today.get('blurb_pending')))

    @r.post('/workouts/{workout_id}/swap-exercise')
    async def swap_ex(workout_id: str, body: SwapExerciseBody, user_id: str = Depends(get_current_user)):
        d = await _load(workout_id, user_id)
        if d['status'] == 'completed': raise HTTPException(409, 'Workout already completed')
        _, perf = await _history(user_id)
        try:
            env, state = await asyncio.to_thread(service.swap_exercise, d['state'], d['envelope'], body.item_id, perf, await _recent_bft(user_id))
        except service.NotFound:
            raise HTTPException(404, 'Item not found or not swappable')
        except service.Outdated:
            raise HTTPException(409, dict(code='workout_outdated', message='This workout was built by an earlier generator version. Generate a new one.'))
        spec = _bft_prepare(env)
        if state:
            sets = {'state': state, 'envelope': env, 'updated_at': _dt.datetime.now(_dt.timezone.utc)}
            if spec: sets['bft'] = _bft_doc(spec['job'])
            await col.update_one({'_id': workout_id}, {'$set': sets,
                                                        '$push': {'swap_events': dict(env['workout']['swapped_item'], reason=body.reason, at=_dt.datetime.now(_dt.timezone.utc))}})
            _bft_start(workout_id, user_id, spec)
        return await _finish(env)

    @r.post('/workouts/{workout_id}/swap-workout')
    async def swap_wk(workout_id: str, user_id: str = Depends(get_current_user)):
        d = await _load(workout_id, user_id)
        if d['status'] == 'completed': raise HTTPException(409, 'Workout already completed')
        _, perf = await _history(user_id)
        env, state = await asyncio.to_thread(service.swap_workout, d['state'], d['envelope'], perf, await _recent_bft(user_id))
        spec = _bft_prepare(env)
        if state:
            sets = {'state': state, 'envelope': env, 'updated_at': _dt.datetime.now(_dt.timezone.utc)}
            sets['bft'] = _bft_doc(spec['job']) if spec else dict(status='fallback', text='', job=None)
            await col.update_one({'_id': workout_id}, {'$set': sets})
            _bft_start(workout_id, user_id, spec)
        _trace('swap-workout', user_id, env)
        return await _finish(env)

    @r.post('/workouts/{workout_id}/after')
    async def after(workout_id: str, body: AfterBody, user_id: str = Depends(get_current_user)):
        from .completion import apply_after
        d = await _load(workout_id, user_id)
        if d['status'] != 'completed': raise HTTPException(409, 'Workout is not completed')
        return await apply_after(db, workout_id, user_id, body.model_dump(exclude_none=True))

    @r.post('/workouts/{workout_id}/repeat')
    async def repeat(workout_id: str, user_id: str = Depends(get_current_user)):
        """Saved Workouts (founder pass, Oct 2026): the same plan under a new workout id with status 'generated', so it can be
        started, swapped and completed again (the original keeps its completion and history). The engine state is copied, so
        swaps behave exactly as on the original."""
        import uuid, copy
        d = await _load(workout_id, user_id)
        new_id = uuid.uuid4().hex
        env = copy.deepcopy(d['envelope'])
        if env.get('workout'): env['workout']['workout_id'] = new_id
        now = _dt.datetime.now(_dt.timezone.utc)
        await col.insert_one({'_id': new_id, 'user_id': user_id, 'status': 'generated', 'created_at': now, 'updated_at': now,
                              'state': copy.deepcopy(d.get('state')), 'envelope': env, 'repeat_of': workout_id})
        log.info(f"v3 repeat user={user_id} {workout_id} -> {new_id}")
        return await _finish(env)

    @r.post('/workouts/{workout_id}/complete')
    async def complete(workout_id: str, body: CompleteBody, user_id: str = Depends(get_current_user)):
        from .progression import entries_from_performance
        from .completion import complete_workout
        await _load(workout_id, user_id)
        return await complete_workout(db, workout_id, user_id, body, completion_hooks, entries_from_performance)

    return r
