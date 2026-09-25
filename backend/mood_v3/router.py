"""FastAPI routes for MOOD V3 workouts (mounted under /api/v3).

POST /api/v3/workouts/generate          unified generation (Strength / Sweat / Athletic)
GET  /api/v3/workouts/{id}              latest version of a generated workout
POST /api/v3/workouts/{id}/swap-exercise   exercise-level swap (same slot purpose, revalidated)
POST /api/v3/workouts/{id}/swap-workout    Swap Workout (same inputs, swap_count + 1)
POST /api/v3/workouts/{id}/complete        completion + per-set performance (history / progression source)
GET  /api/v3/workouts/history           completed V3 workouts (summaries)

Collection: db.v3_workouts. Engine calls run in a worker thread (CPU-bound, engine-internal locks serialize them).
"""
from __future__ import annotations
import asyncio, datetime as _dt, logging, re, time
from typing import List, Optional, Literal, Union
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from . import service, normalize as N

log = logging.getLogger('mood_v3')
HISTORY_WINDOW = 30

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

class CompleteBody(BaseModel):
    model_config = ConfigDict(extra='forbid')
    performance: List[ItemLog] = Field(default_factory=list)
    fit_rating: Optional[Literal['too_easy', 'just_right', 'too_much']] = None
    mood_after: Optional[str] = None
    duration_actual: Optional[int] = None


# ------------------------------------------------------------------ media (reuse db.exercises video / thumbnail / cues)
_ABBR = [(r'\bdb\b', 'dumbbell'), (r'\bkb\b', 'kettlebell'), (r'\bbb\b', 'barbell'), (r'\bez\b', 'ez'), (r'\brdl\b', 'romanian deadlift')]
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
        async for d in db.exercises.find({}, {'name': 1, 'aliases': 1, 'video_url': 1, 'thumbnail_url': 1, 'cues': 1}):
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
        if not it['cues']:
            d = idx.get(norm_name(it['exercise']['name']))
            if d and d.get('cues'): it['cues'] = list(d['cues'])[:3]
    return env


def build_v3_router(db, get_current_user):
    r = APIRouter(prefix='/v3', tags=['v3-workouts'])
    col = db.v3_workouts

    async def _history(user_id):
        docs = await col.find({'user_id': user_id, 'status': 'completed'}, {'state.history_record': 1, 'completed_at': 1, 'performance_entries': 1}) \
                        .sort('completed_at', -1).limit(HISTORY_WINDOW).to_list(HISTORY_WINDOW)
        docs.reverse()
        hist = [dict(d['state']['history_record'], completed_at=d['completed_at'].isoformat() if d.get('completed_at') else None) for d in docs if d.get('state')]
        perf = [dict(completed_at=d['completed_at'].isoformat() if d.get('completed_at') else None, entries=d.get('performance_entries') or {}) for d in docs]
        return hist, perf

    async def _finish(env):
        try: attach_media(env, await MEDIA.get(db))
        except Exception as e: log.warning(f'v3 media enrichment skipped: {e}')
        return env

    async def _load(workout_id, user_id):
        d = await col.find_one({'_id': workout_id})
        if not d: raise HTTPException(404, 'Workout not found')
        if d['user_id'] != user_id: raise HTTPException(403, 'Not your workout')
        return d

    @r.post('/workouts/generate')
    async def generate(body: GenerateBody, user_id: str = Depends(get_current_user)):
        hist, perf = await _history(user_id)
        raw = body.model_dump(exclude={'persist'})
        try:
            env, state = await asyncio.to_thread(service.generate_workout, raw, user_id, hist, perf)
        except N.InputError as e:
            raise HTTPException(422, dict(field=e.field, message=e.message))
        if env['status'] == 'ok' and body.persist:
            now = _dt.datetime.now(_dt.timezone.utc)
            await col.insert_one({'_id': env['workout']['workout_id'], 'user_id': user_id, 'status': 'generated', 'created_at': now, 'updated_at': now,
                                  'state': state, 'envelope': env})
        elif env['status'] == 'ok':
            env['workout']['workout_id'] = None
        if env['status'] != 'ok': log.info(f"v3 conflict {env['conflict']['code']} for {user_id}: {raw}")
        return await _finish(env)

    @r.get('/workouts/history')
    async def history(limit: int = 20, user_id: str = Depends(get_current_user)):
        docs = await col.find({'user_id': user_id, 'status': 'completed'}).sort('completed_at', -1).limit(min(limit, 100)).to_list(100)
        out = []
        for d in docs:
            w = d['envelope']['workout']
            out.append(dict(workout_id=d['_id'], completed_at=d['completed_at'].isoformat(), direction=w['direction'], archetype=w['archetype'],
                            states=w['states'], duration=w['duration'], fit_rating=d.get('fit_rating'), mood_after=d.get('mood_after'),
                            exercises=[it['exercise']['name'] for b in w['blocks'] for it in b['items']]))
        return {'workouts': out, 'count': len(out)}

    @r.get('/workouts/{workout_id}')
    async def get_one(workout_id: str, user_id: str = Depends(get_current_user)):
        d = await _load(workout_id, user_id)
        return await _finish(d['envelope'])

    @r.post('/workouts/{workout_id}/swap-exercise')
    async def swap_ex(workout_id: str, body: SwapExerciseBody, user_id: str = Depends(get_current_user)):
        d = await _load(workout_id, user_id)
        if d['status'] == 'completed': raise HTTPException(409, 'Workout already completed')
        _, perf = await _history(user_id)
        try:
            env, state = await asyncio.to_thread(service.swap_exercise, d['state'], d['envelope'], body.item_id, perf)
        except service.NotFound:
            raise HTTPException(404, 'Item not found or not swappable')
        except service.Outdated:
            raise HTTPException(409, dict(code='workout_outdated', message='This workout was built by an earlier generator version. Generate a new one.'))
        if state:
            await col.update_one({'_id': workout_id}, {'$set': {'state': state, 'envelope': env, 'updated_at': _dt.datetime.now(_dt.timezone.utc)},
                                                        '$push': {'swap_events': dict(env['workout']['swapped_item'], reason=body.reason, at=_dt.datetime.now(_dt.timezone.utc))}})
        return await _finish(env)

    @r.post('/workouts/{workout_id}/swap-workout')
    async def swap_wk(workout_id: str, user_id: str = Depends(get_current_user)):
        d = await _load(workout_id, user_id)
        if d['status'] == 'completed': raise HTTPException(409, 'Workout already completed')
        _, perf = await _history(user_id)
        env, state = await asyncio.to_thread(service.swap_workout, d['state'], d['envelope'], perf)
        if state:
            await col.update_one({'_id': workout_id}, {'$set': {'state': state, 'envelope': env, 'updated_at': _dt.datetime.now(_dt.timezone.utc)}})
        return await _finish(env)

    @r.post('/workouts/{workout_id}/complete')
    async def complete(workout_id: str, body: CompleteBody, user_id: str = Depends(get_current_user)):
        from .progression import entries_from_performance
        d = await _load(workout_id, user_id)
        if d['status'] == 'completed': return {'message': 'Already completed', 'workout_id': workout_id}
        entries = entries_from_performance(d['envelope']['workout'], [p.model_dump() for p in body.performance])
        now = _dt.datetime.now(_dt.timezone.utc)
        await col.update_one({'_id': workout_id}, {'$set': {'status': 'completed', 'completed_at': now, 'updated_at': now, 'performance_entries': entries,
                                                            'fit_rating': body.fit_rating, 'mood_after': body.mood_after, 'duration_actual': body.duration_actual}})
        return {'message': 'Workout completed', 'workout_id': workout_id, 'logged_exercises': len(entries)}

    return r
