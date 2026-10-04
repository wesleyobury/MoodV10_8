"""MOOD V3 unified production generation service.

    generate_workout(user_context) :
        normalize context -> resolve Direction -> shared rules (States, soreness, equipment, duration)
        -> Direction generator (frozen) -> Direction validator (frozen) -> shared formatter -> app-facing workout

Pure functions over (input, history); persistence lives in router.py. Every returned workout has passed its Direction's
frozen validator(s); anything that cannot be built is returned as an explicit conflict, never as a degraded workout.
"""
from __future__ import annotations
import datetime as _dt, uuid
from . import normalize as N, formatter as F, explain, progression, render, exercise_meta, bft
from .engines.strength import adapter as SA
from .engines.sweat import adapter as WA
from .engines.athletic import adapter as AA

ENGINE_VERSION = 'strength-frozen-v4 (gate+coherence+core-focus+strategy+trainer-coherence-gate on wa17/et12/lib11) | sweat-frozen-v6 (budget+shapes+gate+coherence+contract+work-floor+trainer-coherence-gate; no standalone steady state) | athletic-frozen-v7 (quality+blueprints+impact/intent budget+gate+coherence+contract; no agility drills; Olympic derivatives; identity pass: athletic movement budget + cost tiers, no carries, muscle-ups, explicit athletic variants; truthful sprint / sled accounting; final pre-launch pass: loaded-power Power, archetype composition, strength-form variety, performance roles, trainer coherence gate; composition pass: sprint as a sprinkle in standard gyms, chosen session compositions, athletic-leaning support; sequencing pass: demand order + Primer, cart phases, athletic core only, velocity strength)'
ADAPTERS = {'strength': SA, 'sweat': WA, 'athletic': AA}
CONFLICT_TYPES = (SA.Conflict, WA.Conflict, AA.Conflict)
RENDER = {'strength': render.format_strength, 'sweat': render.format_sweat, 'athletic': render.format_athletic}
OPTION_LABELS = {'change_target': 'Change Target', 'moods_pick': "Let MOOD pick", 'change_equipment': 'Change equipment',
                 'change_archetype': 'Pick another session type', 'swap_workout': 'Try another version', 'cancel': 'Cancel'}

def now_iso(): return _dt.datetime.now(_dt.timezone.utc).isoformat()

def engine_ctx(ctx: N.Context, resolved_archetype=None):
    # Strength resolves MOOD's Pick through resolved_archetype (keeps pick semantics: soreness reroute, rotation log).
    # Sweat / Athletic have no pick hook, so a MOOD's Pick rotated by Different Workout is passed as their archetype.
    arch = ctx.archetype or (resolved_archetype if ctx.direction != 'strength' else None)
    return dict(direction=ctx.direction, states=list(ctx.states), duration=ctx.duration, experience=ctx.experience, goal=ctx.goal,
                frequency=ctx.frequency, equipment=N.PRESETS[ctx.preset][ctx.direction], sore=set(ctx.sore_muscles),
                target_mode=ctx.target_mode, target_muscles=tuple(ctx.target_muscles), archetype=arch,
                user=ctx.user_key, date=ctx.date, resolved_archetype=resolved_archetype)

def selection_source(ctx: N.Context):
    """Who chose the session type: 'target' (muscles / Full Body), 'user_selected' (explicit archetype) or 'moods_pick'.
    Carried explicitly (never inferred from the generated output) so Different Workout knows what it may change."""
    if ctx.target_mode in ('explicit', 'full_body'): return 'target'
    if ctx.archetype: return 'user_selected'
    return 'moods_pick'

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

def _finish(ctx, res, history_records, perf_history, workout_id, version, source=None, recent_bft=()):
    res = dict(res, selection_source=source or selection_source(ctx))
    warm, blocks, cool = RENDER[ctx.direction](res, engine_ctx(ctx))
    exercise_meta.apply_scaling(blocks, ctx.direction)     # founder pass 3: scalable bodyweight guidance (presentation only)
    F.attach_rest_contract(blocks, ctx.direction)          # founder rest audit: when the timer starts, how long, full recovery
    aq = (lambda eid: AA.G.quality(AA.EX[eid]) if eid in AA.EX else None) if ctx.direction == 'athletic' else None
    progression.attach(ctx.direction, blocks, perf_history, ctx.states, aq)
    res = dict(res, warmup=warm, blocks=blocks, cooldown=cool, adjustments=_adjustments(res))
    lines = explain.build_lines(ctx, res, history_records)
    env = F.envelope_ok(workout_id=workout_id, version=version, ctx=ctx, res=res, built_for_today=lines, created_at=now_iso(),
                        today=explain.today_block(ctx, res, lines))
    # Built for Today blurb (Oct 2026 quality pass): composed from the FINISHED workout + trace; never alters the workout.
    blurb, brief = bft.build(ctx, res, env['workout'], history_records, recent_bft)
    env['workout']['today']['blurb'] = blurb['text']
    env['workout']['today']['blurb_meta'] = {k: blurb[k] for k in ('source', 'frame', 'facts')}
    env['_bft'] = dict(brief=brief.to_dict() if brief else None, composer=blurb, recent=list(recent_bft or []))   # server-only: the router pops it before saving / returning
    return env

def _adjustments(res):
    out = []
    for l in res.get('log', []):
        if isinstance(l, dict): out.append({k: (v if isinstance(v, (str, int, float, bool, type(None))) else str(v)) for k, v in l.items()})
        else: out.append(dict(reason_code='log', detail=str(l)))
    return out[:60]

def generate_workout(raw, user_key, history_records=(), perf_history=(), *, workout_id=None, recent_bft=()):
    """-> (envelope, state). history_records: completed V3 workouts oldest -> newest (history_record dicts).
    state carries what a later swap needs to rebuild this exact workout deterministically."""
    history_records = list(history_records)
    ctx = N.normalize(raw, user_key, [h.get('direction') for h in history_records])
    return _generate(ctx, history_records, list(perf_history), workout_id=workout_id, recent_bft=recent_bft)

def _generate(ctx, history_records, perf_history, *, workout_id=None, resolved_archetype=None, version=1, source=None, extra_log=None, recent_bft=()):
    ad = ADAPTERS[ctx.direction]; nctx = engine_ctx(ctx, resolved_archetype)
    workout_id = workout_id or uuid.uuid4().hex
    source = source or selection_source(ctx)
    try:
        res = ad.build(nctx, history_records, ctx.swap_count)
    except CONFLICT_TYPES as c:
        return F.envelope_conflict(ctx, conflict_payload(ctx, c), adjustments=_detail(c)), None
    if extra_log: res = dict(res, log=list(extra_log) + list(res.get('log', [])))
    env = _finish(ctx, res, history_records, perf_history, workout_id, version, source, recent_bft)
    if ctx.direction == 'strength' and res.get('mode') == 'pick': rarch = res['requested_archetype']
    elif ctx.direction != 'strength' and source == 'moods_pick' and resolved_archetype: rarch = resolved_archetype
    else: rarch = None
    state = dict(request=ctx.public(), user_key=ctx.user_key, history_snapshot=history_records, swap_count=ctx.swap_count,
                 exercise_swaps=[], resolved_archetype=rarch, selection_source=source,
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
    if 'block_index' in ref:   # rebuilt Athletic: blocks can hold two items (strength pair, contrast pair)
        bi = ref['block_index']; ii = [x['id'] for x in res['w']['sess']['blocks'][bi]['items']].index(ref['exercise_id'])
        return ad.swap_exercise(nctx, state['history_snapshot'], state['swap_count'], res, bi, ii, excluded)
    return ad.swap_exercise(nctx, state['history_snapshot'], state['swap_count'], res, ref['item_index'], excluded)

def swap_exercise(state, envelope, item_id, perf_history=(), recent_bft=()):
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
    else: ref = dict(block_index=bi, exercise_id=eid)
    prior = [s for s in state['exercise_swaps'] if s['item_id'] == item_id]
    excluded = set(prior[-1]['excluded']) if prior else set()
    excluded |= {eid}
    try:
        res2 = _apply_swap(ctx.direction, ad, nctx, state, res, ref, excluded)
    except CONFLICT_TYPES as c:
        return dict(F.envelope_conflict(ctx, conflict_payload(ctx, c)), workout=wk), None
    new_eid = next((l['to'] for l in reversed(res2['log']) if isinstance(l, dict) and l.get('reason_code') == 'exercise_swapped'), None)
    if ctx.direction in ('sweat', 'athletic'): ref = dict(block_index=bi, exercise_id=eid)
    state2 = dict(state, exercise_swaps=state['exercise_swaps'] + [dict(item_id=item_id, ref=ref, excluded=sorted(excluded), **{'from': eid, 'to': new_eid})],
                  fingerprint=ad.fingerprint(res2), history_record=res2['history_record'])
    env = _finish(ctx, res2, state['history_snapshot'], list(perf_history), wk['workout_id'], wk['version'] + 1, state.get('selection_source'), recent_bft)
    env['workout']['swapped_item'] = dict(item_id=item_id, **{'from': eid, 'to': new_eid})
    # one exercise changed: keep the copy the user already read unless it names the exercise that just left
    old = (wk.get('today') or {}).get('blurb'); old_name = it['exercise']['name']
    if old and old_name not in old:
        env['workout']['today']['blurb'] = old; env['workout']['today']['blurb_meta'] = (wk.get('today') or {}).get('blurb_meta')
        env['_bft']['keep'] = True
    return env, state2

def pick_rotation(ctx):
    """Archetypes MOOD's Pick may move to on Different Workout, in the Direction's own rotation order."""
    if ctx.direction == 'strength':
        rot = SA.rotation_for(ctx.goal, ctx.frequency)
        return rot + [a for a in SA.QE.ROTATION if a not in rot and a not in ('strength_core', 'strength_custom_target')]
    return list(N.ARCHETYPES[ctx.direction])

def swap_workout(state, envelope, perf_history=(), recent_bft=()):
    """Different Workout. Same Direction / Target / duration / States / soreness / equipment; swap_count + 1.
    Phase 2.5: when MOOD picked the session type, Different Workout may move to another eligible archetype (rotation order,
    skipping ones already shown in this chain and any that cannot be built today). A user-selected archetype or a Target is kept
    and the workout changes inside it."""
    ctx = ctx_from_state(state); ctx.swap_count = state['swap_count'] + 1
    source = state.get('selection_source') or selection_source(ctx)
    wid = envelope['workout']['workout_id'] if envelope.get('workout') else None
    version = (envelope['workout']['version'] + 1) if envelope.get('workout') else 1
    cur = (envelope.get('workout') or {}).get('archetype', {}).get('id') or state.get('history_record', {}).get('archetype')
    on_screen = ((envelope.get('workout') or {}).get('today') or {}).get('blurb')
    recent = ([on_screen] if on_screen else []) + [r for r in (recent_bft or []) if r and r != on_screen]
    chain = list(state.get('archetype_chain') or ([cur] if cur else []))
    if source == 'moods_pick' and cur:
        rot = pick_rotation(ctx)
        start = rot.index(cur) + 1 if cur in rot else 0
        ordered = rot[start:] + rot[:start]
        fresh = [a for a in ordered if a not in chain] or [a for a in ordered if a != cur]
        for alt in fresh:
            env, st2 = _generate(ctx, state['history_snapshot'], list(perf_history), workout_id=wid, resolved_archetype=alt, version=version, source=source,
                                 extra_log=[{'reason_code': 'moods_pick_rotated', 'from': cur, 'to': alt}], recent_bft=recent)
            if st2 and env['workout']['archetype']['id'] != cur:
                st2['history_snapshot'] = state['history_snapshot']
                st2['archetype_chain'] = (chain + [env['workout']['archetype']['id']])[-12:]
                return env, st2
    env, st2 = _generate(ctx, state['history_snapshot'], list(perf_history), workout_id=wid,
                         resolved_archetype=state.get('resolved_archetype'), version=version, source=source, recent_bft=recent)
    if st2:
        st2['history_snapshot'] = state['history_snapshot']
        st2['archetype_chain'] = (chain + [env['workout']['archetype']['id']])[-12:]
        before = {it['exercise']['id'] for b in (envelope.get('workout') or {}).get('blocks', []) for it in b['items']}
        after = [it['exercise']['id'] for b in env['workout']['blocks'] for it in b['items']]
        if before and after:
            k = sum(1 for x in after if x not in before)
            env['workout']['built_for_today'].insert(0, dict(code='different_workout',
                text=f"A different {env['workout']['archetype']['name']} session: {k} of {len(after)} exercises changed."))
            env['workout']['built_for_today'] = env['workout']['built_for_today'][:explain.MAX_LINES]
    return env, st2
