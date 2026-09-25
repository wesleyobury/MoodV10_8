"""MOOD V3 unified production generation service.

    generate_workout(user_context) :
        normalize context -> resolve Direction -> shared rules (States, soreness, equipment, duration)
        -> Direction generator (frozen) -> Direction validator (frozen) -> shared formatter -> app-facing workout

Pure functions over (input, history); persistence lives in router.py. Every returned workout has passed its Direction's
frozen validator(s); anything that cannot be built is returned as an explicit conflict, never as a degraded workout.
"""
from __future__ import annotations
import datetime as _dt, uuid
from . import normalize as N, formatter as F, explain, progression, render
from .engines.strength import adapter as SA
from .engines.sweat import adapter as WA
from .engines.athletic import adapter as AA

ENGINE_VERSION = 'strength-v6+wa17/et12 | sweat-final-v4 | athletic-v1'
ADAPTERS = {'strength': SA, 'sweat': WA, 'athletic': AA}
CONFLICT_TYPES = (SA.Conflict, WA.Conflict, AA.Conflict)
RENDER = {'strength': render.format_strength, 'sweat': render.format_sweat, 'athletic': render.format_athletic}
OPTION_LABELS = {'change_target': 'Change Target', 'moods_pick': "Let MOOD pick", 'change_equipment': 'Change equipment',
                 'change_archetype': 'Pick another session type', 'swap_workout': 'Try another version', 'cancel': 'Cancel'}

def now_iso(): return _dt.datetime.now(_dt.timezone.utc).isoformat()

def engine_ctx(ctx: N.Context, resolved_archetype=None):
    return dict(direction=ctx.direction, states=list(ctx.states), duration=ctx.duration, experience=ctx.experience, goal=ctx.goal,
                frequency=ctx.frequency, equipment=N.PRESETS[ctx.preset][ctx.direction], sore=set(ctx.sore_muscles),
                target_mode=ctx.target_mode, target_muscles=tuple(ctx.target_muscles), archetype=ctx.archetype,
                user=ctx.user_key, date=ctx.date, resolved_archetype=resolved_archetype)

def conflict_payload(ctx, c):
    opts = []
    for o in c.options:
        if o == 'switch_direction':
            for d in N.DIRECTIONS:
                if d != ctx.direction: opts.append(dict(action='switch_direction', label=f'Try {F.DIRECTION_NAMES[d]}', patch=dict(direction=d, target=None, archetype=None)))
        elif o == 'change_equipment':
            if ctx.preset != 'commercial_gym': opts.append(dict(action='change_equipment', label='Use full gym equipment', patch=dict(equipment='commercial_gym')))
        elif o == 'moods_pick':
            if ctx.target_mode != 'moods_pick' or ctx.archetype: opts.append(dict(action='moods_pick', label=OPTION_LABELS[o], patch=dict(target=None, archetype=None)))
        elif o == 'change_target': opts.append(dict(action='change_target', label=OPTION_LABELS[o], patch=None))
        elif o == 'change_archetype': opts.append(dict(action='change_archetype', label=OPTION_LABELS[o], patch=dict(archetype=None)))
        else: opts.append(dict(action=o, label=OPTION_LABELS.get(o, o), patch=None))
    return dict(code=c.code, message=c.message, options=opts)

def _finish(ctx, res, history_records, perf_history, workout_id, version):
    warm, blocks, cool = RENDER[ctx.direction](res, engine_ctx(ctx))
    aq = (lambda eid: AA.G.quality(AA.EX[eid]) if eid in AA.EX else None) if ctx.direction == 'athletic' else None
    progression.attach(ctx.direction, blocks, perf_history, ctx.states, aq)
    res = dict(res, warmup=warm, blocks=blocks, cooldown=cool, adjustments=_adjustments(res))
    lines = explain.build_lines(ctx, res, history_records)
    return F.envelope_ok(workout_id=workout_id, version=version, ctx=ctx, res=res, built_for_today=lines, created_at=now_iso())

def _adjustments(res):
    out = []
    for l in res.get('log', []):
        if isinstance(l, dict): out.append({k: (v if isinstance(v, (str, int, float, bool, type(None))) else str(v)) for k, v in l.items()})
        else: out.append(dict(reason_code='log', detail=str(l)))
    return out[:60]

def generate_workout(raw, user_key, history_records=(), perf_history=(), *, workout_id=None):
    """-> (envelope, state). history_records: completed V3 workouts oldest -> newest (history_record dicts).
    state carries what a later swap needs to rebuild this exact workout deterministically."""
    history_records = list(history_records)
    ctx = N.normalize(raw, user_key, [h.get('direction') for h in history_records])
    return _generate(ctx, history_records, list(perf_history), workout_id=workout_id)

def _generate(ctx, history_records, perf_history, *, workout_id=None, resolved_archetype=None, version=1):
    ad = ADAPTERS[ctx.direction]; nctx = engine_ctx(ctx, resolved_archetype)
    workout_id = workout_id or uuid.uuid4().hex
    try:
        res = ad.build(nctx, history_records, ctx.swap_count)
    except CONFLICT_TYPES as c:
        return F.envelope_conflict(ctx, conflict_payload(ctx, c), adjustments=_detail(c)), None
    env = _finish(ctx, res, history_records, perf_history, workout_id, version)
    state = dict(request=ctx.public(), user_key=ctx.user_key, history_snapshot=history_records, swap_count=ctx.swap_count,
                 exercise_swaps=[], resolved_archetype=res['requested_archetype'] if ctx.direction == 'strength' and res.get('mode') == 'pick' else None,
                 fingerprint=ad.fingerprint(res), base_fingerprint=ad.fingerprint(res), history_record=res['history_record'], engine_version=ENGINE_VERSION)
    return env, state

def _detail(c):
    d = c.detail
    if isinstance(d, list): return [x if isinstance(x, dict) else dict(detail=str(x)) for x in d][:30]
    return [dict(detail=str(d))] if d else []

def ctx_from_state(state):
    r = dict(state['request']); t = r.pop('target'); r['soreness'] = r['soreness']
    raw = dict(r, target=('full_body' if t['mode'] == 'full_body' else (t['muscles'] or None)), equipment=r['equipment'])
    return N.normalize(raw, state['user_key'])

def _rebuild(state):
    """Deterministically rebuild the stored workout (inputs + history snapshot + swap chain + exercise swaps)."""
    ctx = ctx_from_state(state); ad = ADAPTERS[ctx.direction]
    nctx = engine_ctx(ctx, state.get('resolved_archetype'))
    res = ad.build(nctx, state['history_snapshot'], state['swap_count'])
    if ad.fingerprint(res) != state['base_fingerprint']: raise Outdated()
    for sw in state['exercise_swaps']:
        res = _apply_swap(ctx.direction, ad, nctx, state, res, sw['ref'], set(sw['excluded']))
    if ad.fingerprint(res) != state['fingerprint']: raise Outdated()
    return ctx, ad, nctx, res

class Outdated(Exception): pass
class NotFound(Exception): pass

def _apply_swap(direction, ad, nctx, state, res, ref, excluded):
    if direction == 'strength': return ad.swap_exercise(nctx, state['history_snapshot'], state['swap_count'], res, ref['slot'], excluded)
    if direction == 'sweat':
        bi = ref['block_index']; ii = [e['id'] for e in res['w']['blocks'][bi]['items_e']].index(ref['exercise_id'])
        return ad.swap_exercise(nctx, state['history_snapshot'], state['swap_count'], res, bi, ii, excluded)
    return ad.swap_exercise(nctx, state['history_snapshot'], state['swap_count'], res, ref['item_index'], excluded)

def swap_exercise(state, envelope, item_id, perf_history=()):
    """Exercise-level swap. -> (envelope, new_state). Conflict envelope (workout unchanged) when no alternative exists."""
    ctx, ad, nctx, res = _rebuild(state)
    wk = envelope['workout']
    loc = next(((bi, it) for bi, b in enumerate(wk['blocks']) for it in b['items'] if it['item_id'] == item_id), None)
    if loc is None: raise NotFound(item_id)
    bi, it = loc
    if not it['swap']['swappable']: raise NotFound(item_id)
    eid = it['exercise']['id']
    if ctx.direction == 'strength': ref = dict(slot=it['slot_id'])
    elif ctx.direction == 'sweat': ref = dict(block_index=bi, exercise_id=eid)
    else: ref = dict(item_index=bi)
    prior = [s for s in state['exercise_swaps'] if s['item_id'] == item_id]
    excluded = set(prior[-1]['excluded']) if prior else set()
    excluded |= {eid}
    try:
        res2 = _apply_swap(ctx.direction, ad, nctx, state, res, ref, excluded)
    except CONFLICT_TYPES as c:
        return dict(F.envelope_conflict(ctx, conflict_payload(ctx, c)), workout=wk), None
    new_eid = next((l['to'] for l in reversed(res2['log']) if isinstance(l, dict) and l.get('reason_code') == 'exercise_swapped'), None)
    if ctx.direction == 'sweat': ref = dict(block_index=bi, exercise_id=eid)
    state2 = dict(state, exercise_swaps=state['exercise_swaps'] + [dict(item_id=item_id, ref=ref, excluded=sorted(excluded), **{'from': eid, 'to': new_eid})],
                  fingerprint=ad.fingerprint(res2), history_record=res2['history_record'])
    env = _finish(ctx, res2, state['history_snapshot'], list(perf_history), wk['workout_id'], wk['version'] + 1)
    env['workout']['swapped_item'] = dict(item_id=item_id, **{'from': eid, 'to': new_eid})
    return env, state2

def swap_workout(state, envelope, perf_history=()):
    """Swap Workout: same Direction / Target / duration / States / soreness / equipment; swap_count + 1 (frozen SW1 / Sweat / Athletic chains)."""
    ctx = ctx_from_state(state); ctx.swap_count = state['swap_count'] + 1
    env, st2 = _generate(ctx, state['history_snapshot'], list(perf_history), workout_id=envelope['workout']['workout_id'] if envelope.get('workout') else None,
                         resolved_archetype=state.get('resolved_archetype'), version=(envelope['workout']['version'] + 1) if envelope.get('workout') else 1)
    if st2: st2['history_snapshot'] = state['history_snapshot']
    return env, st2
