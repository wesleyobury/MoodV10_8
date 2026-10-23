"""FastAPI routes for the MOOD V3 Specialty Workout Generator (mounted under /api/v3/specialty).

Independent generator: never imports engines/strength/core.py, engines/sweat/*, engines/athletic/*, or
mood_v3.service / mood_v3.normalize.normalize(). Shares only what mood_v3/README.md's own module table already
calls shared: formatter.py's builders (via engines/specialty/render.py), and router.py's media-enrichment helpers
(attach_media / MEDIA), reused here exactly as the existing v3 router uses them -- no changes to either.

GET  /api/v3/specialty/presets                 the 18 presets (id, name, equipment, target, default/eligible flavors)
POST /api/v3/specialty/generate                 generate a specialty workout
GET  /api/v3/specialty/{id}                     latest envelope
POST /api/v3/specialty/{id}/swap-exercise       {"exercise_id": "..."} -> new envelope, or 409 no_alternative
POST /api/v3/specialty/{id}/swap-complex        {"block_index": N} -> swap an assembled-complex block
POST /api/v3/specialty/{id}/complete            {"performance": [...], "fit_rating", "duration_actual", ...} -- same
                                                 shape/contract as POST /api/v3/workouts/{id}/complete (mood_v3.completion.
                                                 complete_workout, reused here with col=db.specialty_workouts and
                                                 source='specialty'): records performance, runs the SAME completion_hooks
                                                 as the Strength/Sweat/Athletic Directions (user_workouts row, workouts_
                                                 count + weekly free-workout allowance, canonical workout_completed event
                                                 for streaks/achievements) -- per product decision, a specialty workout
                                                 counts the same as a Direction workout.
POST /api/v3/specialty/{id}/after               post-workout additions on a completed specialty workout: fit rating,
                                                 real metrics (mood_v3.completion.apply_after, same contract as
                                                 POST /api/v3/workouts/{id}/after).

Collection: db.specialty_workouts (separate from db.v3_workouts -- no shared document shape, no risk of touching the
frozen Directions' own stored history). completion.py's effects/after helpers are shared, generic code (outside
engines/strength|sweat|athletic/), parametrized by collection + source tag -- reusing them is not a frozen-engine edit.
"""
from __future__ import annotations
import datetime as _dt, logging, uuid as _uuid
from typing import Optional, Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ConfigDict

from .engines.specialty import blueprints as BP, adapter as SPA, render as SR, catalog as CAT
from .router import attach_media, MEDIA, _utc_iso, AfterBody, ItemLog
from .completion import complete_workout, apply_after
from .progression import entries_from_performance

log = logging.getLogger('mood_v3.specialty')


class SpecialtyGenerateBody(BaseModel):
    model_config = ConfigDict(extra='forbid')
    preset_id: str
    flavor: Optional[str] = None
    experience: Literal['beginner', 'intermediate', 'advanced'] = 'intermediate'
    duration: Literal[30, 60] = 60
    persist: bool = True


class SwapExerciseBody(BaseModel):
    model_config = ConfigDict(extra='forbid')
    exercise_id: str


class SwapComplexBody(BaseModel):
    model_config = ConfigDict(extra='forbid')
    block_index: int = Field(ge=0)


class SpecialtyCompleteBody(BaseModel):
    """Same shape as mood_v3.router.CompleteBody (the Direction completion body) -- kept as its own class (not an
    import) only because specialty's Guided Session wiring is new and this makes its exact accepted shape explicit
    at the point a client reads this router, same values and types otherwise."""
    model_config = ConfigDict(extra='forbid')
    performance: list[ItemLog] = Field(default_factory=list)
    fit_rating: Optional[Literal['too_easy', 'just_right', 'too_much']] = None
    mood_after: Optional[str] = None
    duration_actual: Optional[int] = None
    started_at: Optional[str] = None
    completed_steps: Optional[int] = None
    total_steps: Optional[int] = None
    local_date: Optional[str] = None
    client_session_id: Optional[str] = Field(default=None, max_length=80)


def build_specialty_router(db, get_current_user, completion_hooks=None):
    """completion_hooks: mood_v3.completion.CompletionHooks from server.py -- the SAME instance passed to
    build_v3_router, reused here so a specialty completion runs identical side effects (counters, weekly free-
    workout allowance, workout_completed event) to a Direction completion. Without hooks (tests, older mounts)
    /complete only records the completion itself, same fallback as build_v3_router."""
    r = APIRouter(prefix='/v3/specialty', tags=['v3-specialty'])
    col = db.specialty_workouts

    @r.get('/presets')
    async def list_presets():
        out = []
        for pid, p in BP.PRESETS.items():
            out.append(dict(id=pid, name=BP.PRESET_NAMES[pid], equipment=p['equipment'],
                             equipment_label=BP.EQUIPMENT_PROFILES[p['equipment']]['label'], target=p['target'],
                             default_flavor=p['default'], default_flavor_name=BP.FLAVORS[p['default']]['name'],
                             eligible_flavors=[dict(id=f, name=BP.FLAVORS[f]['name']) for f in BP.eligible_flavors(pid)]))
        return dict(presets=out)

    async def _finish(env, res, user_id, nctx, workout_id, version=1):
        env.setdefault('workout', {})
        try:
            attach_media(env, await MEDIA.get(db))
        except Exception as e:
            log.warning(f'specialty media enrichment skipped: {e}')
        doc = dict(_id=workout_id, user_id=user_id, envelope=env, res=res, nctx=nctx, version=version,
                   created_at=_dt.datetime.now(_dt.timezone.utc))
        if nctx.get('persist', True):
            await col.replace_one({'_id': workout_id}, doc, upsert=True)
        return env

    @r.post('/generate')
    async def generate(body: SpecialtyGenerateBody, user_id: str = Depends(get_current_user)):
        if body.preset_id not in BP.PRESETS:
            raise HTTPException(422, dict(field='preset_id', message=f'Unknown preset "{body.preset_id}". See GET /presets.'))
        if body.flavor and body.flavor not in BP.eligible_flavors(body.preset_id):
            raise HTTPException(422, dict(field='flavor', message=f'"{body.flavor}" is not eligible for "{body.preset_id}".',
                                           eligible=BP.eligible_flavors(body.preset_id)))
        workout_id = _uuid.uuid4().hex
        try:
            env, res = SR.generate(preset_id=body.preset_id, flavor=body.flavor, experience=body.experience,
                                    duration=body.duration, user_key=user_id, date=_dt.date.today().isoformat(),
                                    equipment_label=BP.EQUIPMENT_PROFILES[BP.PRESETS[body.preset_id]['equipment']]['label'],
                                    production_only=True, workout_id=workout_id, adapter_module=SPA)
        except SPA.Conflict as c:
            raise HTTPException(409, dict(code=c.code, message=c.message, detail=c.detail))
        nctx = dict(preset_id=body.preset_id, flavor=env['workout']['specialty']['flavor'], experience=body.experience,
                    duration=body.duration, user=user_id, date=_dt.date.today().isoformat(), persist=body.persist,
                    production_only=True)
        return await _finish(env, res, user_id, nctx, workout_id)

    async def _load(workout_id, user_id):
        d = await col.find_one({'_id': workout_id})
        if not d: raise HTTPException(404, 'Specialty workout not found')
        if d['user_id'] != user_id: raise HTTPException(403, 'Not your workout')
        return d

    @r.get('/{workout_id}')
    async def get_workout(workout_id: str, user_id: str = Depends(get_current_user)):
        d = await _load(workout_id, user_id)
        env = d['envelope']
        try: attach_media(env, await MEDIA.get(db))
        except Exception as e: log.warning(f'specialty media enrichment skipped: {e}')
        return env

    @r.post('/{workout_id}/swap-exercise')
    async def swap_exercise(workout_id: str, body: SwapExerciseBody, user_id: str = Depends(get_current_user)):
        d = await _load(workout_id, user_id)
        nctx = d['nctx']; res = d['res']
        try:
            res2 = SPA.swap_exercise(nctx, res, body.exercise_id)
        except SPA.Conflict as c:
            raise HTTPException(409, dict(code=c.code, message=c.message))
        env2 = SR.format_envelope(res2, nctx, workout_id=workout_id)
        env2['workout']['version'] = d['version'] + 1
        return await _finish(env2, res2, user_id, nctx, workout_id, version=d['version'] + 1)

    @r.post('/{workout_id}/swap-complex')
    async def swap_complex(workout_id: str, body: SwapComplexBody, user_id: str = Depends(get_current_user)):
        d = await _load(workout_id, user_id)
        nctx = d['nctx']; res = d['res']
        if body.block_index >= len(res['blocks_raw']):
            raise HTTPException(422, dict(field='block_index', message='Out of range.'))
        try:
            res2 = SPA.swap_complex(nctx, res, body.block_index)
        except SPA.Conflict as c:
            raise HTTPException(409, dict(code=c.code, message=c.message))
        env2 = SR.format_envelope(res2, nctx, workout_id=workout_id)
        env2['workout']['version'] = d['version'] + 1
        return await _finish(env2, res2, user_id, nctx, workout_id, version=d['version'] + 1)

    @r.post('/{workout_id}/complete')
    async def complete(workout_id: str, body: SpecialtyCompleteBody, user_id: str = Depends(get_current_user)):
        await _load(workout_id, user_id)
        return await complete_workout(db, workout_id, user_id, body, completion_hooks, entries_from_performance,
                                       col=col, source='specialty')

    @r.post('/{workout_id}/after')
    async def after(workout_id: str, body: AfterBody, user_id: str = Depends(get_current_user)):
        d = await _load(workout_id, user_id)
        if d['status'] != 'completed':
            raise HTTPException(409, 'Workout is not completed')
        return await apply_after(db, workout_id, user_id, body.model_dump(exclude_none=True), col=col)

    return r
