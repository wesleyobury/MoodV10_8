"""Production adapter for the frozen Strength engine (WA v17 / ET v12 / SD v5 / Library v11).

Pipeline (identical to the frozen founder-pack path gen_pack3):
  generate() -> prescribe() -> build_blocks() -> validate() + validate_blocks()   [frozen]
Additions that the frozen reference did not implement, each built only from frozen rules:
  * MOOD's Pick archetype resolver (WA COLD START deterministic resolver + completed-history rotation).
  * Explicit Target routing (WA TARGET ROUTING, exact set match, else Custom Target).
  * Custom Target production path (compose_custom + PRESCRIPTION BANDS target_block rows, straight sets).
  * Multi-State (2-3 States): SD v5 MULTI-STATE ARBITRATION via the frozen resolve_dials; with 0 or 1 State the frozen
    single-State path runs unchanged (the multi-State hooks delegate to the original functions).
  * Exercise-level swap: the slot's own frozen candidate pool and ranking, re-checked against every composition
    constraint and both frozen validators.
"""
from __future__ import annotations
import hashlib, threading
from . import audit_engine as AE, qa_engine as QE, prescription as PR, structure as ST
from ..state_rules import resolve_dials

LOCK = threading.RLock()
EX = AE.EX
_MODS = (AE, QE, PR, ST)

# ------------------------------------------------------------------ multi-State hooks (delegate when <= 1 State)
_orig_hard_ok = AE.hard_ok
_orig_pred = AE.pred_score
_orig_slot_active = AE.slot_active
for _d in (-1, 0, 1):
    AE.STATE_CAP[f'_cap{_d}'] = _d          # shared dict object (imported by reference into every engine module)

def _multi(sc): return len(sc.get('states') or ()) > 1
def _hard_ok(e, sc):
    if not _multi(sc): return _orig_hard_ok(e, sc)
    return _orig_hard_ok(e, dict(sc, state=f"_cap{sc['_dials']['cap_delta']}"))
def _pred_score(e, sc, sel, aid, slot):
    if not _multi(sc): return _orig_pred(e, sc, sel, aid, slot)
    st = sc['states']; s = 0; base = dict(sc, sore=set())
    for x in st:
        v = _orig_pred(e, dict(base, state=x), sel, aid, slot)
        if x == 'stressed' and 'bored' in st:          # SD named row Bored + Stressed: Bored owns exercise originality,
            v -= (1 if e['nov'] <= 2 else 0)            # Stressed keeps only its structure / station predictability term
        if x in ('irritated', 'amped') and 'low_energy' in st and e['sysd'] > 4:
            v = 0                                        # SD step 4: Low Energy constrains systemic cost before output (Sweat F.1 guard)
        s += v
    if sc.get('sore') and (set(e['sec']) & sc['sore']): s -= 5
    return s
def _slot_active(s, sc):
    if not _multi(sc): return _orig_slot_active(s, sc)
    d = sc['_dials']; return s.get('cond') != 'state_bored_amped' or d['NS'] >= 1 or d['X'] >= 1
for _m in _MODS:
    for _n, _f in (('hard_ok', _hard_ok), ('pred_score', _pred_score), ('slot_active', _slot_active)):
        if hasattr(_m, _n): setattr(_m, _n, _f)

STRUCTURE_PRECEDENCE = ('low_energy', 'stressed', 'irritated', 'bored_amped', 'amped', 'bored')
def resolve_states(states, duration, experience):
    """-> (frozen_state, states_for_engine, dials or None). Multi path only when >= 2 non-sore States or Sore + Amped (named row)."""
    ns = [s for s in states if s != 'sore']
    multi = len(ns) >= 2 or ('sore' in states and 'amped' in ns)
    if not multi: return (ns[0] if ns else None), [], None
    d = resolve_dials(list(states), duration, experience)
    d = dict(d, cap_delta=max(-1, min(1, d['C'])))
    for k in STRUCTURE_PRECEDENCE:
        if k == 'bored_amped':
            if 'bored' in ns and 'amped' in ns: return 'bored', ns, d
        elif k in ns: return k, ns, d
    return None, ns, d

# ------------------------------------------------------------------ equipment
def equipment(spec):
    if spec[0] == 'frozen': return set(getattr(AE, spec[1])), set(AE.FULL_SPACE)
    return set(spec[1]), set(spec[2])

# ------------------------------------------------------------------ Target routing (WA TARGET ROUTING, sole authority)
ROUTING = {frozenset(k.split('+')): v for k, v in {
    'chest': 'strength_upper_push', 'chest+triceps': 'strength_upper_push', 'chest+shoulders': 'strength_upper_push',
    'shoulders+triceps': 'strength_upper_push', 'chest+shoulders+triceps': 'strength_upper_push',
    'back': 'strength_upper_pull', 'back+biceps': 'strength_upper_pull',
    'biceps': 'strength_arms', 'triceps': 'strength_arms', 'biceps+triceps': 'strength_arms', 'biceps+triceps+shoulders': 'strength_arms',
    'chest+back': 'strength_upper_mixed', 'chest+back+biceps': 'strength_upper_mixed', 'chest+back+triceps': 'strength_upper_mixed',
    'chest+back+shoulders': 'strength_upper_mixed', 'core': 'strength_core', 'quads': 'strength_lower_squat', 'hamstrings': 'strength_lower_hinge',
    'glutes': 'strength_glutes_legs', 'quads+glutes': 'strength_glutes_legs', 'hamstrings+glutes': 'strength_lower_hinge',
    'quads+hamstrings+glutes': 'strength_glutes_legs'}.items()}
def route_target(muscles):
    return ROUTING.get(frozenset(muscles), 'strength_custom_target')

# ------------------------------------------------------------------ MOOD's Pick (WA COLD START deterministic resolver)
GOAL_ROTATION = {
    'build_strength': ['strength_lower_squat', 'strength_upper_pull', 'strength_upper_push', 'strength_glutes_legs', 'strength_upper_mixed'],
    'build_muscle': ['strength_upper_pull', 'strength_lower_squat', 'strength_upper_push', 'strength_glutes_legs', 'strength_upper_mixed'],
    'improve_athleticism': ['strength_lower_squat', 'strength_upper_pull', 'strength_glutes_legs', 'strength_upper_push', 'strength_upper_mixed'],
}
DEFAULT_ROTATION = ['strength_glutes_legs', 'strength_upper_pull', 'strength_upper_push', 'strength_lower_squat', 'strength_upper_mixed']
LOWER = {'strength_lower_squat', 'strength_glutes_legs', 'strength_lower_hinge'}
def rotation_for(goal, frequency):
    if frequency == '1-2': return ['strength_full_body']
    rot = list(GOAL_ROTATION.get(goal, DEFAULT_ROTATION))
    if frequency == '5+':
        lows = [i for i, a in enumerate(rot) if a in LOWER]
        rot.insert(lows[1] + 1, 'strength_lower_hinge'); rot.append('strength_arms')
    return rot
def moods_pick(goal, frequency, history):
    """First archetype of the goal-ordered rotation not yet completed; when all are completed, the least recently completed
    (wrap); list order breaks ties. Soreness is handled afterwards by the frozen S1 dependency / RR reroute."""
    rot = rotation_for(goal, frequency)
    last = {h['archetype']: i for i, h in enumerate(history)}
    never = [a for a in rot if a not in last]
    if never: return never[0], 'cold_start_rotation'
    return min(rot, key=lambda a: (last[a], rot.index(a))), 'history_rotation'

# ------------------------------------------------------------------ helpers
def ctx_for(aid, target_muscles=None, mode='pick'):
    if aid == 'strength_custom_target': return {'target': set(target_muscles or ())}
    c = QE.ctx_for(aid)
    if mode == 'explicit' and target_muscles: c = dict(c, target=set(target_muscles))
    return c
def history_for_engine(records):
    return [dict(archetype=r['archetype'], exercises=list(r.get('exercise_ids', [])), slots=dict(r.get('slots') or {}))
            for r in records if r.get('direction') == 'strength' and r.get('archetype')]

class Conflict(Exception):
    def __init__(self, code, message, options, detail=None):
        super().__init__(message); self.code = code; self.message = message; self.options = options; self.detail = detail

# ------------------------------------------------------------------ core build
def _sc(nctx, history, swap=0, date_salt=''):
    eq, sp = equipment(nctx['equipment'])
    frozen_state, states, dials = resolve_states(nctx['states'], nctx['duration'], nctx['experience'])
    sc = dict(exp=nctx['experience'], equip=eq, space=sp, state=frozen_state, sore=set(nctx['sore']), history=history,
              swap=swap, user=nctx['user'], date=nctx['date'] + date_salt)
    if dials is not None: sc['states'] = states; sc['_dials'] = dials
    return sc

def _fin_planned(a, W, sc, dur, ctx, seed):
    if sc.get('state') != 'amped' or dur != 60: return False
    if sc.get('_dials') is not None and sc['_dials']['X'] < 1: return False
    return ST.burnout_candidate(a, W, sc, ctx, seed) is not None

def _prescribe(a, W, dur, sc, log, fin):
    d = sc.get('_dials')
    if d is None: return PR.prescribe(a, W, dur, sc.get('state'), log, finisher_planned=fin)
    key = f"_multi|{d['V']}|{d['E']}|{d['X']}|{d['NS']}|{d['ESCOPE']}"
    p1 = d['ESCOPE'] == 'p1' and d['E'] >= 1
    PR.DIALS[key] = dict(volume=max(-1, min(1, d['V'])), effort=0 if p1 else (1 if d['E'] >= 1 else 0),
                         extras=d['X'], structure_novelty=d['NS'])
    rows, events = PR.prescribe(a, W, dur, key, log, finisher_planned=fin)
    if p1 and rows:
        r = min(rows, key=lambda r: r['prio'])
        r['rir'] = max(r['rir'] - 1, 1 if r['cls'] in ('primary_compound', 'secondary_compound', 'target_block') else 0)
        events.append({'reason_code': 'dial_effort', 'value': 1, 'scope': 'priority_1', 'slot': r['slot'],
                       'operation': 'target RIR lowered by 1 on the Priority-1 slot only (SD named row)'})
    events.insert(0, {'reason_code': 'dials_resolved', 'detail': {k: d[k] for k in ('V', 'E', 'NE', 'NS', 'C', 'X', 'ESCOPE', 'pair')},
                      'states': list(sc['states']), 'structure_state': sc.get('state')})
    return rows, events

def _validate(payload, aid_req, sc, dur, ctx, rows, blocks, swapped=False):
    vsc = sc if sc.get('_dials') is None else dict(sc, state=f"_cap{sc['_dials']['cap_delta']}")
    checks = QE.validate(payload, aid_req, vsc, dur, ctx, payload['outcome'])
    if sc.get('_dials') is not None:   # restate the Arms conditional-slot check with the resolved dials
        checks = [c for c in checks if c[0] != 'arms_compound_conditional']
        if payload['archetype'] == 'strength_arms':
            d = sc['_dials']; cc = payload['workout'].get('compound_combination')
            checks.append(('arms_compound_conditional', cc is None or d['NS'] >= 1 or d['X'] >= 1, 'resolved dials'))
    checks += ST.validate_blocks(payload['archetype'], blocks, rows, sc, dur)
    if swapped:
        subst = {l.get('slot') for l in payload['log'] if l.get('reason_code') == 'sore_substitution'}
        checks += [c for c in composition_checks(payload['archetype'], payload['workout'], sc, ctx) if c[2].split(':')[0] not in subst]
    return [c for c in checks if not c[1]]

def composition_checks(aid, W, sc, ctx):
    """Every slot still satisfies its frozen composition constraint given the slots before it (used after swaps)."""
    if aid in ('strength_core', 'strength_custom_target'): return []
    out = []; sel = {}
    for s in AE.SLOTS[aid]:                       # evaluate in skeleton order, as compose() does
        slot = s['slot']
        if slot not in W: continue
        e = EX[W[slot]]
        out.append(('composition_constraint', AE.CON(aid, slot, e, sel, ctx), f'{slot}:{e["id"]}'))
        sel[slot] = e
    return out

def build(nctx, history_records, swap=0):
    """-> result dict (status ok) or raises Conflict. nctx: plain dict from the service layer."""
    with LOCK:
        history = history_for_engine(history_records)
        dur = nctx['duration']
        # ---- resolve archetype + mode
        if nctx['target_mode'] == 'explicit':
            aid = nctx['archetype'] or route_target(nctx['target_muscles']); mode = 'explicit'; why = 'explicit_target'
        elif nctx['target_mode'] == 'full_body':
            aid, mode, why = 'strength_full_body', 'explicit', 'explicit_full_body'
        elif nctx['archetype']:
            aid, mode, why = nctx['archetype'], 'explicit', 'explicit_archetype'
        else:
            aid, why = nctx.get('resolved_archetype') or moods_pick(nctx['goal'], nctx['frequency'], history)[0], 'moods_pick'; mode = 'pick'
        if aid == 'strength_custom_target':
            return _build_custom(nctx, list(nctx['target_muscles']), swap)
        last_err = None
        for attempt, salt in enumerate(('', '#r1', '#r2')):
            sc = _sc(nctx, history, swap, salt)
            ctx = ctx_for(aid, nctx['target_muscles'], mode)
            payload = QE.generate(aid, sc, dur, ctx, mode)
            oc = payload['outcome']
            if oc == 'VALID TERMINAL CONFLICT':
                raise Conflict('sore_target_conflict', 'Your sore areas block a credible session for this Target today.',
                               ['change_target', 'moods_pick', 'switch_direction', 'cancel'], detail=payload['log'])
            if oc == 'ACTUAL GENERATOR FAILURE' and mode == 'pick' and not nctx.get('_no_skip'):
                # MOOD's Pick optimizes (same principle as Sweat archetype_skipped_equipment): an archetype the user's equipment
                # cannot build is skipped for the next archetype in the rotation; explicit choices still surface the conflict.
                rot = rotation_for(nctx['goal'], nctx['frequency']); rot = rot + [a for a in QE.ROTATION if a not in rot]
                for alt in rot[rot.index(aid) + 1:] + rot[:rot.index(aid)] if aid in rot else rot:
                    try:
                        out = build(dict(nctx, resolved_archetype=alt, _no_skip=True), history_records, swap)
                    except Conflict:
                        continue
                    out['log'] = [{'reason_code': 'archetype_skipped_equipment', 'detail': aid, 'to': alt}] + out['log']
                    out['requested_archetype'] = alt; out['skipped_archetype'] = aid
                    return out
            if oc == 'ACTUAL GENERATOR FAILURE':
                raise Conflict('cannot_build', 'This Strength session cannot be built with the current equipment, level and soreness.',
                               ['change_target', 'moods_pick', 'change_equipment', 'switch_direction'], detail=payload['log'])
            a = payload['archetype']; W = payload['workout']
            ctx2 = ctx if a == aid else ctx_for(a)
            seed = f"{sc['user']}|{sc['date']}"
            fin = _fin_planned(a, W, sc, dur, ctx2, seed)
            rows, events = _prescribe(a, W, dur, sc, payload['log'], fin)
            blocks, slog, fin_rows = ST.build_blocks(a, rows, sc, dur, ctx2, W, seed)
            bad = _validate(payload, aid, sc, dur, ctx, rows, blocks)
            if not bad:
                return _result(nctx, aid, a, mode, why, sc, ctx2, payload, rows, events, blocks, slog, fin_rows, attempt)
            last_err = bad
        raise Conflict('generation_failed', 'We could not build a valid session for this combination.', ['swap_workout', 'moods_pick'],
                       detail=[list(map(str, c)) for c in last_err])

RELAX_CODES = ('relaxation_a_swap_family_distinctness', 'bridge_relaxed_beginner_constrained_state', 'upper_class_fallback',
               'duration_underfill_accepted', 'sore_substitution', 'sore_secondary_retained', 'archetype_skipped_equipment')
def _relaxations(log):
    out = []
    for l in log:
        code = l.get('reason_code'); det = str(l.get('detail', ''))
        for r in RELAX_CODES:
            if r == code or det.startswith(r): out.append(r)
    return sorted(set(out))

def _result(nctx, aid_req, a, mode, why, sc, ctx, payload, rows, events, blocks, slog, fin_rows, attempt):
    W = payload['workout']; log = list(payload['log']) + events + slog
    if attempt: log.append({'reason_code': 'validator_retry', 'attempt': attempt})
    minutes = ST.est_minutes_blocks(blocks, nctx['duration'])
    ov = sorted({m for l in payload['log'] if l.get('reason_code') == 'sore_override_by_explicit_target' for m in l.get('muscles', [])})
    return dict(status='ok', direction='strength', archetype=a, requested_archetype=aid_req, rerouted=(payload['outcome'] == 'VALID ADAPTIVE REROUTE'),
                mode=mode, pick_reason=why, W=dict(W), rows=rows, st_blocks=blocks, fin_rows=fin_rows, log=log,
                relaxations=_relaxations(log), estimated_minutes=float(minutes), sore_override=ov,
                sets=QE.est_sets(a, W, nctx['duration']), structure=slog[0]['pattern'] if slog else 'straight',
                frozen_state=sc.get('state'), dials=sc.get('_dials'),
                history_record=dict(direction='strength', archetype=a, exercise_ids=list(W.values()) + [r['eid'] for r in fin_rows], slots=dict(W)),
                target_muscles=sorted(ctx.get('target') or []) if mode == 'explicit' else [])

# ------------------------------------------------------------------ Custom Target (explicit fallback archetype)
def _build_custom(nctx, targets, swap):
    dur = nctx['duration']
    sc = _sc(nctx, [], swap)
    sc2, ov = QE.custom_sore_override(targets, sc)
    order, blocks, widths, fails, multi = AE.compose_custom(targets, sc2, dur)
    if fails:
        sore_caused = bool(sc.get('sore')) and not AE.compose_custom(targets, dict(sc2, sore=set()), dur)[3]
        raise Conflict('sore_target_conflict' if sore_caused else 'cannot_build',
                       'Not enough safe options for this Target with your equipment and level today.',
                       ['change_target', 'moods_pick', 'change_equipment'], detail={'empty_targets': fails})
    if sum(len(blocks[m]) for m in order) < 2:
        # integration guard: a one-exercise "session" is not a worthwhile Custom Target workout; surface it instead of shipping it
        raise Conflict('cannot_build', 'There are not enough options for this Target with your equipment and level to build a real session.',
                       ['change_target', 'moods_pick', 'change_equipment'], detail={'exercises_found': sum(len(blocks[m]) for m in order)})
    d = sc.get('_dials') or {}
    st = sc.get('state'); vol = d.get('V', {'low_energy': -1, 'amped': 1}.get(st, 0)); eff = 1 if d.get('E', 1 if st in ('irritated', 'amped') else 0) >= 1 else 0
    rows = []; slot_names = ['target_block_a', 'target_block_b', 'target_block_c']
    base_sets = QE.SETS_BY_CLASS[dur]['target_block']; lo, hi = QE.BAND[dur]
    for bi, m in enumerate(order):
        for j, e in enumerate(blocks[m]):
            reps, why = PR.rep_target(e, 'target_block'); rest, rir = PR.rest_rir(e, 'target_block', eff)
            rows.append(dict(slot=f'{slot_names[bi]}#{len(rows)}', role=f'{m} block', cls='target_block', eid=e['id'], name=e['name'], sets=base_sets, reps=reps,
                             why=why, rest=rest, rir=rir, bandmax=3, inc='required' if j == 0 else 'default', prio=bi * 10 + j, protected=False, muscle=m, first=(j == 0)))
    events = []
    while sum(r['sets'] for r in rows) > hi:          # PROGRESSION + OUTPUT C6: trim lowest-priority non-first work first
        c = [r for r in reversed(rows) if not r['first'] and r['sets'] > 2]
        if not c: break
        c[0]['sets'] -= 1; events.append({'reason_code': 'duration_trim', 'slot': c[0]['slot'], 'exercise': c[0]['eid']})
    if vol == -1:
        c = [r for r in reversed(rows) if r['sets'] > 2 and not r['first']] or [r for r in reversed(rows) if r['sets'] > 2]
        if c: c[0]['sets'] -= 1; events.append({'reason_code': 'dial_volume', 'value': -1, 'slot': c[0]['slot']})
    if vol == 1 and dur == 60:
        c = [r for r in rows if not r['first'] and r['sets'] < r['bandmax']]
        if c and sum(r['sets'] for r in rows) < hi: c[0]['sets'] += 1; events.append({'reason_code': 'dial_volume', 'value': 1, 'slot': c[0]['slot']})
    if eff: events.append({'reason_code': 'dial_effort', 'value': 1})
    for r in rows:                                     # under the band floor: use the target_block band maximum (3) before accepting underfill
        if sum(x['sets'] for x in rows) >= lo: break
        if r['sets'] < r['bandmax'] and vol != -1: r['sets'] = r['bandmax']; events.append({'reason_code': 'duration_backfill', 'slot': r['slot'], 'sets': r['sets']})
    total = sum(r['sets'] for r in rows)
    if total < lo: events.append({'reason_code': 'duration_underfill_accepted', 'working_sets': total, 'band': [lo, hi],
                                  'detail': 'Custom Target block sizes are fixed (WA v7.1); no filler added'})
    # frozen CT checks (restated from the Strength QA harness)
    ids = [r['eid'] for r in rows]; cap = max(1, min(5, AE.CAP[sc['exp']] + AE.STATE_CAP.get(sc.get('state') if not sc.get('_dials') else f"_cap{sc['_dials']['cap_delta']}", 0)))
    bad = []
    if len(set(ids)) != len(ids): bad.append('no_duplicate_exercise_id')
    for r in rows:
        e = EX[r['eid']]
        if AE.RANK[e['skill']] > AE.RANK[sc['exp']]: bad.append(('skill', e['id']))
        if e['cx'] > cap: bad.append(('complexity', e['id']))
        if e['eq'] not in sc['equip'] or any(q not in sc['equip'] for q in e['req']): bad.append(('equipment', e['id']))
        if AE.roll(e['prim'][0]) != r['muscle']: bad.append(('block_target_honesty', e['id']))
        if set(e['prim']) & sc2['sore']: bad.append(('sore_primary', e['id']))
    if bad: raise Conflict('generation_failed', 'We could not build a valid Custom Target session.', ['change_target', 'moods_pick'], detail=bad)
    st_blocks = []
    for i, r in enumerate(rows, 1):
        st_blocks.append(ST.straight(r, f'B{i}', 'Custom Target: straight sets')); st_blocks[-1]['sequence_index'] = i
    log = [{'reason_code': 'custom_target', 'targets': targets, 'block_order': order}] + events
    if ov: log.append({'reason_code': 'sore_override_by_explicit_target', 'muscles': ov})
    W = {r['slot']: r['eid'] for r in rows}
    return dict(status='ok', direction='strength', archetype='strength_custom_target', requested_archetype='strength_custom_target', rerouted=False,
                mode='explicit', pick_reason='explicit_target', W=W, rows=rows, st_blocks=st_blocks, fin_rows=[], log=log,
                relaxations=_relaxations(log), estimated_minutes=float(ST.est_minutes_blocks(st_blocks, dur)), sore_override=ov,
                sets=total, structure='straight', frozen_state=sc.get('state'), dials=sc.get('_dials'),
                history_record=dict(direction='strength', archetype='strength_custom_target', exercise_ids=ids, slots={}),
                target_muscles=list(targets), custom_order=order)

# ------------------------------------------------------------------ exercise-level swap
def swap_exercise(nctx, history_records, swap, res, slot, excluded):
    """Replace one slot's exercise with the best-ranked alternative from the same slot pool (same Direction, archetype,
    slot purpose, Target, State, soreness, equipment and experience), avoiding every exercise already shown for that slot.
    Returns a new result or raises Conflict('no_alternative')."""
    with LOCK:
        a = res['archetype']; dur = nctx['duration']
        if a == 'strength_custom_target': return _swap_custom(nctx, res, slot, excluded)
        history = history_for_engine(history_records)
        sc = _sc(nctx, history, swap)
        sc['swap'] = max(1, swap + 1); sc['displayed'] = dict(res['W'])       # rank 5 swap penalty against the displayed composition
        ctx = ctx_for(a, res['target_muscles'], res['mode']) if a == res['requested_archetype'] else ctx_for(a)
        W = dict(res['W']); seed = f"{nctx['user']}|{nctx['date']}"
        if slot == 'finisher':
            return _swap_finisher(nctx, res, sc, ctx, excluded, seed)
        if slot not in W: raise Conflict('no_alternative', 'That exercise cannot be swapped.', [])
        others = {k: EX[v] for k, v in W.items() if k != slot}
        # ATD pairs (WA v14/v15): the first exposure and its depth partner may share a family when profile-distinct, so the
        # partner is left out of the family filter here; the frozen ATD profile check in validate() still applies.
        partner = {p[0]: p[1] for p in AE.ATD_PAIRS.get(a, [])}      # first exposure -> depth slot (depth slots already allow reuse)
        fam_others = {k: e for k, e in others.items() if k != partner.get(slot)}
        cands = [c for c in AE.candidates(a, slot, sc, fam_others, ctx) if c[0]['id'] not in excluded and c[0]['id'] not in set(W.values())]
        ranked = QE.rank(cands, sc, others, a, slot, ctx)
        for e, v, b in ranked:
            W2 = dict(W); W2[slot] = e['id']
            payload = dict(outcome='VALID BUILD' if not res['rerouted'] else 'VALID ADAPTIVE REROUTE', archetype=a, requested=res['requested_archetype'],
                           workout=W2, log=[l for l in res['log'] if isinstance(l, dict)])
            fin = _fin_planned(a, W2, dict(sc, swap=swap), dur, ctx, seed)
            rows, events = _prescribe(a, W2, dur, dict(sc, swap=swap), payload['log'], fin)
            blocks, slog, fin_rows = ST.build_blocks(a, rows, dict(sc, swap=swap), dur, ctx, W2, seed)
            bad = _validate(dict(payload, outcome='VALID BUILD'), a, dict(sc, swap=0), dur, ctx, rows, blocks, swapped=True)
            bad = [b for b in bad if b[0] not in ('outcome_class', 'reroute_log')]
            if bad: continue
            out = dict(res); out.update(W=W2, rows=rows, st_blocks=blocks, fin_rows=fin_rows, estimated_minutes=float(ST.est_minutes_blocks(blocks, dur)),
                                        sets=QE.est_sets(a, W2, dur), structure=slog[0]['pattern'] if slog else 'straight')
            out['log'] = res['log'] + [{'reason_code': 'exercise_swapped', 'slot': slot, 'from': W[slot], 'to': e['id'],
                                        'protected': (a, slot) in AE.PROTECTED}]
            out['history_record'] = dict(res['history_record'], exercise_ids=list(W2.values()) + [r['eid'] for r in fin_rows], slots=dict(W2))
            return out
        raise Conflict('no_alternative', 'No other exercise fits this slot with your equipment, level and soreness today.', [])

def _swap_finisher(nctx, res, sc, ctx, excluded, seed):
    a = res['archetype']; dur = nctx['duration']; W = dict(res['W'])
    fake = dict(W); fake.update({f'_x{i}': x for i, x in enumerate(excluded)})
    st_ = sc.get('state')
    fe = ST.burnout_candidate(a, fake, sc, ctx, seed) if st_ == 'amped' else ST.forceful_candidate(a, fake, sc, seed)
    if not fe: raise Conflict('no_alternative', 'No other finisher fits today.', [])
    blocks = [dict(b) for b in res['st_blocks']]
    if not blocks or blocks[-1]['structure_id'] != 'finisher': raise Conflict('no_alternative', 'That exercise cannot be swapped.', [])
    fb = dict(blocks[-1]); it = dict(fb['items'][0]); old = it['exercise_id']
    it.update(exercise_id=fe['id'], name=fe['name'])
    if st_ == 'irritated':
        it['reps'] = {'kettlebell_swing': '15', 'db_clean_to_press': '8', 'kb_clean_and_press': '6/side', 'db_snatch': '6/side', 'sled_push': '20 m',
                      'farmer_carry': '30 m', 'suitcase_carry': '25 m/side'}.get(fe['id'], '12')
    else: it['reps'] = '20' if fe['pm0'] != 'calves' else '25'
    fb['items'] = [it]; blocks[-1] = fb
    bad = [c for c in ST.validate_blocks(a, blocks, res['rows'], sc, dur) if not c[1]]
    if bad: raise Conflict('no_alternative', 'No other finisher fits today.', [])
    out = dict(res); out['st_blocks'] = blocks
    out['fin_rows'] = [dict(res['fin_rows'][0], eid=fe['id'], name=fe['name'], reps=it['reps'])]
    out['log'] = res['log'] + [{'reason_code': 'exercise_swapped', 'slot': 'finisher', 'from': old, 'to': fe['id']}]
    out['history_record'] = dict(res['history_record'], exercise_ids=list(W.values()) + [fe['id']])
    return out

def _swap_custom(nctx, res, slot, excluded):
    rows = [dict(r) for r in res['rows']]
    k = int(slot.split('#')[1]); r = rows[k]; m = r['muscle']
    sc = _sc(nctx, [], 0); sc2, ov = QE.custom_sore_override(list(res['target_muscles']), sc)
    used = {x['eid'] for x in rows}; fams = {EX[x['eid']]['swap'] for i, x in enumerate(rows) if i != k}
    pool = [EX[eid] for eid, v, c, b in AE.ELIG[('strength_custom_target', 'target_block_a')] if AE.hard_ok(EX[eid], sc2)]
    cands = [e for e in pool if AE.roll(e['prim'][0]) == m and e['id'] not in used and e['id'] not in excluded
             and (e['cls'] == EX[r['eid']]['cls'] or not r['first']) and (len(res['target_muscles']) == 1 or e['swap'] not in fams)]
    cands.sort(key=lambda e: (-AE.pred_score(e, sc2, {}, 'strength_custom_target', 'target_block_a'), e['swap'] in fams, e['id']))
    if not cands: raise Conflict('no_alternative', 'No other exercise fits this Target block today.', [])
    e = cands[0]; old = r['eid']
    reps, why = PR.rep_target(e, 'target_block'); rest, rir = PR.rest_rir(e, 'target_block', 1 if any(x.get('reason_code') == 'dial_effort' for x in res['log']) else 0)
    r.update(eid=e['id'], name=e['name'], reps=reps, why=why, rest=rest, rir=rir); rows[k] = r
    st_blocks = []
    for i, rr in enumerate(rows, 1):
        st_blocks.append(ST.straight(rr, f'B{i}', 'Custom Target: straight sets')); st_blocks[-1]['sequence_index'] = i
    W = {x['slot']: x['eid'] for x in rows}
    out = dict(res); out.update(rows=rows, st_blocks=st_blocks, W=W)
    out['log'] = res['log'] + [{'reason_code': 'exercise_swapped', 'slot': slot, 'from': old, 'to': e['id']}]
    out['history_record'] = dict(res['history_record'], exercise_ids=[x['eid'] for x in rows])
    return out

def fingerprint(res):
    return hashlib.sha256(repr((res['archetype'], sorted(res['W'].items()), [(b['structure_id'], [i['exercise_id'] for i in b['items']]) for b in res['st_blocks']])).encode()).hexdigest()[:16]
