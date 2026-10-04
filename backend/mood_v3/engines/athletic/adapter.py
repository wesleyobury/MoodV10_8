"""Production adapter for the rebuilt Athletic engine (V3 Athletic rebuild).

build() -> athletic_core.generate (primary quality + structure blueprint, low-rep power dosing with full recovery, athletic
strength, impact / intent budget, State ownership, State Satisfaction gate + whole-session Coherence) -> independent
athletic_validate -> shared formatter. The Reference Generator v1 adapter is kept byte-for-byte as adapter_legacy_v1.py
(and athletic_gen.py / sk5.py stay on disk) for the before / after comparison.

Exercise-level swap: same block, same role, same athletic quality and movement kind (power), same pattern (strength) or
same purpose (support), no higher impact or skill, dose rebuilt by the same dosing rules with the block's sets kept; the
whole session is re-accounted and re-validated.
"""
from __future__ import annotations
import copy, hashlib, threading
from . import athletic_core as C, athletic_validate as V
from . import athletic_gen as G          # library quality lookups used by service / progression (read only)
from .lib3 import avail

LOCK = threading.RLock()
EX = C.EX
SLOT_ID = {'primary': 'primary_power', 'contrast_strength': 'contrast_strength', 'contrast_power': 'contrast_power', 'secondary': 'secondary_quality',
           'tertiary': 'tertiary_quality', 'strength': 'athletic_strength', 'support': 'support', 'finisher': 'finisher'}


class Conflict(Exception):
    def __init__(self, code, message, options, detail=None):
        super().__init__(message); self.code = code; self.message = message; self.options = options; self.detail = detail


def history_for_engine(records):
    """Newest first. Records built by the rebuilt engine carry `native`; older V3 records fall back to their exercise ids."""
    out = []
    for r in reversed(list(records)):
        if r.get('direction') != 'athletic': continue
        nat = r.get('native')
        if nat: out.append(dict(nat))
        else: out.append(dict(ids=list(r.get('exercise_ids') or []), swaps=[EX[i]['swap'] for i in r.get('exercise_ids') or [] if i in EX and EX[i]['swap']]))
    return out


DECISION_CODES = {'state_ownership', 'sore_reroute', 'candidate_selected', 'state_gate', 'state_coherence_repair', 'budget_repair', 'duration_trim',
                  'prep_extended', 'structure_relabelled', 'exercise_swapped'}


def build(nctx, history_records, swap=0):
    with LOCK:
        history = history_for_engine(history_records)
        try:
            out = C.generate(nctx, history, swap)
        except C.Fail as f:
            msg = str(f)
            if msg.startswith('sore_terminal'):
                raise Conflict('sore_target_conflict', 'Speed + Plyo needs your legs, and they are sore today.', ['moods_pick', 'change_archetype', 'switch_direction'], detail=msg)
            if msg.startswith('sore_equipment'):
                raise Conflict('equipment_insufficient', 'With sore legs and this equipment there is not enough worthwhile upper-body Athletic work today.',
                               ['switch_direction', 'change_equipment', 'moods_pick'], detail=msg)
            raise Conflict('cannot_build', 'This Athletic session cannot be built with the current setup.', ['moods_pick', 'change_equipment', 'switch_direction'], detail=msg)
        bad = V.fails(out['sess'], out['wu'], out['ctx'], out['ctx']['states'])
        if bad:
            raise Conflict('generation_failed', 'We could not build a valid Athletic session.', ['swap_workout', 'moods_pick'], detail=[list(map(str, b)) for b in bad])
        return _result(nctx, out, history)


def _requested_without_soreness(nctx, out):
    ctx = dict(out['ctx'], sore=frozenset(), displayed=[])
    c = C.candidates(ctx, C.resolve_states(ctx['states'], ctx['lv'], ctx['dur'], ctx['goal']))
    return c[0][0] if c else out['sess']['arch']


def _result(nctx, out, history):
    from ... import athletic_why as AWY
    sess = out['sess']; ctx = out['ctx']
    legs_sore = bool(ctx['sore'] & C.LOWER)
    requested = nctx.get('archetype') or out.get('requested') or sess['arch']
    rerouted = bool(out.get('rerouted'))
    if legs_sore and not nctx.get('archetype'):
        requested = _requested_without_soreness(nctx, out); rerouted = True
    if nctx.get('archetype') and nctx.get('archetype') != nctx.get('resolved_archetype'): mode = 'explicit'
    else: mode = 'pick'
    ids = [x['id'] for b in sess['blocks'] for x in b['items']]
    res = dict(status='ok', direction='athletic', archetype=sess['arch'], requested_archetype=requested, rerouted=rerouted, mode=mode, w=out,
               log=out['log'], relaxations=[], estimated_minutes=float(out['A']['est']), sore_override=[],
               history_record=dict(direction='athletic', archetype=sess['arch'], exercise_ids=ids, native=C.history_record(out)),
               target_muscles=list(ctx['target']), expressions={s: [k for k, _ in out['realized'].get(s, [])] for s in ctx['states']})
    res['decisions'] = [l for l in out['log'] if isinstance(l, dict) and l.get('reason_code') in DECISION_CODES]
    res['athletic_summary'] = summary(out)
    res['personalization'] = AWY.contract(nctx, out, history, res)
    return res


def summary(out):
    sess = out['sess']; A = out['A']
    qs = C.session_qualities(sess); sec = qs[1] if len(qs) > 1 else None; ter = qs[2] if len(qs) > 2 else None
    L = C.limits(out['ctx']['lv'], out['ctx']['dur'], out['d'])
    acc = {k: A[k] for k in ('n_items', 'n_explosive', 'explosive_sets', 'contacts', 'high_contacts', 'sprint_exposures', 'sprint_m', 'sled_efforts', 'sled_m', 'accel_efforts', 'throws',
                             'olympic_sets', 'high_skill', 'unilateral_explosive_sets', 'strength_sets', 'support_sets', 'intent_load', 'est', 'wu_min',
                             'ath_cost', 'tier_a', 'n_athletic', 'n_athletic_strength', 'n_support')}
    return dict(primary_quality=sess['pq'], primary_quality_label=C.QUALITY_LABEL[sess['pq']], secondary_quality=sec,
                secondary_quality_label=C.QUALITY_LABEL.get(sec) if sec else None, tertiary_quality=ter, athletic_qualities=qs,
                tertiary_quality_label=C.QUALITY_LABEL.get(ter) if ter else None, structure=sess['structure'], structure_label=C.STRUCTURE_LABEL[sess['structure']],
                accounting=acc, limits={k: L[k] for k in ('contacts', 'accel_efforts', 'explosive_sets', 'intent_load', 'n_explosive', 'ath_cost', 'tier_a')},
                state_gate={s: bool(v['satisfied']) for s, v in out['verdict'].items()}, coherence={s: bool(v['coherent']) for s, v in out['verdict'].items()},
                realized={s: [d for _, d in r] for s, r in out['realized'].items()},
                trainer_gate=dict(issues=list(out.get('gate') or [])), composition=sess.get('mode'))


# ------------------------------------------------------------------ exercise-level swap
KIND_GROUP = {'jump': 'jump', 'loaded_jump': 'jump', 'combo': 'jump', 'bound': 'bound', 'hop': 'hop', 'elastic': 'elastic', 'drop': 'elastic', 'lateral': 'lateral',
              'sprint': 'sprint', 'sled': 'sprint', 'throw': 'throw', 'slam': 'throw', 'rot_throw': 'throw', 'landmine_rot': 'landmine_rot',
              'upper': 'upper', 'olympic': 'lift', 'explosive_lift': 'lift', 'swing': 'lift',
              'uni_jump': 'unilateral_jump', 'pop': 'unilateral_jump', 'muscle_up': 'upper', 'speed_strength': 'speed_strength'}
IMPACT_RANK = {'low': 0, 'moderate': 1, 'high': 2}
PAT_GROUP = {'lower_bilateral': 'squat', 'hinge': 'hinge', 'hinge_uni': 'hinge', 'hip_thrust': 'hinge', 'unilateral': 'single_leg', 'lateral_uni': 'single_leg',
             'upper_pull': 'pull', 'upper_push': 'push', 'upper_push_v': 'push'}


def swap_candidates(out, bi, ii, excluded):
    sess = out['sess']; ctx = out['ctx']; d = out['d']
    x = sess['blocks'][bi]['items'][ii]; e_old = EX[x['id']]
    used = [y['id'] for b in sess['blocks'] for y in b['items'] if y['id'] != x['id']]
    seed = f"{ctx['seed']}|swap|{bi}|{ii}|{len(excluded)}"
    ok = lambda i: i not in excluded and i != x['id'] and i not in used and not any(EX[u]['swap'] and EX[u]['swap'] == EX[i]['swap'] for u in used)
    if x['cls'] == 'power':
        grp = KIND_GROUP.get(x['kind'])
        pool = [i for i in C.power_pool(ctx, x['quality']) if KIND_GROUP.get(C.kind_of(i)) == grp and ok(i)
                and IMPACT_RANK[EX[i]['impact']] <= IMPACT_RANK[e_old['impact']] and EX[i]['cx'] <= max(e_old['cx'], 2)]
        if x['role'] == 'contrast_power': pool = [i for i in pool if C.kind_of(i) in ('jump', 'throw', 'upper')]
        if x['role'] in ('secondary', 'tertiary'): pool = [i for i in pool if C.TIER_COST[C.tier(i, x['role'])] <= C.TIER_COST[C.tier(x['id'], x['role'])]]
        tier1 = C.rank_power(ctx, d, pool, 'secondary' if x['role'] in ('secondary', 'tertiary') else 'primary', used, seed)
        # tier 2: the same movement family in a neighbouring quality (a jump for a jump, a sprint start for a sprint start), never higher impact or skill
        NEIGH = {'vertical_power': ['horizontal_power'], 'horizontal_power': ['vertical_power'], 'acceleration': [],
                 'upper_power': ['total_body_power'], 'rotational_power': ['upper_power'], 'total_body_power': ['upper_power'], 'elastic_reactive': ['vertical_power']}
        pool2 = [i for q2 in NEIGH.get(x['quality'], []) for i in C.power_pool(ctx, q2) if KIND_GROUP.get(C.kind_of(i)) == grp and ok(i)
                 and IMPACT_RANK[EX[i]['impact']] <= IMPACT_RANK[e_old['impact']] and EX[i]['cx'] <= max(e_old['cx'], 2) and i not in tier1]
        if x['role'] == 'contrast_power': pool2 = []
        pool3 = []
        if x['role'] in ('secondary', 'tertiary'):   # a further athletic element may become another element of the same or lower cost, never a bigger one
            have_k = {y['kind'] for b in sess['blocks'] for y in b['items'] if y['cls'] == 'power' and y['id'] != x['id']}
            old_t = C.TIER_COST[C.tier(x['id'], 'tertiary')]
            for q3 in C.QUALITY_LABEL:
                pool3 += [i for i in C.power_pool(ctx, q3) if ok(i) and i not in tier1 and i not in pool2 and C.kind_of(i) not in have_k | {'olympic'}
                          and C.TIER_COST[C.tier(i, 'tertiary')] <= old_t and EX[i]['cx'] <= max(e_old['cx'], 2)
                          and IMPACT_RANK[EX[i]['impact']] <= IMPACT_RANK[e_old['impact']]]
        allc = tier1 + C.rank_power(ctx, d, pool2, 'secondary', used, seed) + C.rank_power(ctx, d, pool3, 'secondary', used, seed + '|t3')
        if x['role'] in ('secondary', 'tertiary'):      # never a costlier athletic element than the one it replaces
            allc = [i for i in allc if C.TIER_COST[C.tier(i, x['role'])] <= C.TIER_COST[C.tier(x['id'], x['role'])]]
        return allc
    if x['cls'] == 'strength':
        same = [i for i in C.strength_pool(ctx, {x['pattern']}) if ok(i)]
        grp = [i for i in C.strength_pool(ctx, {p for p, g in PAT_GROUP.items() if g == PAT_GROUP[x['pattern']]}) if ok(i) and i not in same]
        region = C.LOWER_PAT if x['pattern'] in C.LOWER_PAT else C.UPPER_PAT
        other = [i for i in C.strength_pool(ctx, region) if ok(i) and i not in same and i not in grp] if x['role'] != 'contrast_strength' else []
        return C.rank_strength(ctx, d, same, used, seed, 'swap') + C.rank_strength(ctx, d, grp, used, seed, 'swap2') + C.rank_strength(ctx, d, other, used, seed, 'swap3')
    if x['cls'] == 'support':
        same = [i for i in C.support_pool(ctx, {x['kind']}) if ok(i)]
        other = [i for k in C.SUPPORT_PLAN.get(sess['pq'], []) if k != x['kind'] for i in C.support_pool(ctx, {k}) if ok(i) and i not in same]
        return same + other
    if x['cls'] == 'finisher':
        return [i for i in ('sled_push',) if i in EX and ok(i) and avail(EX[i], ctx['preset']) and not C.region_blocked(EX[i], ctx['sore'])]
    return []


def _replace(out, bi, ii, new_id):
    o2 = dict(out); sess = copy.deepcopy(out['sess']); o2['sess'] = sess
    ctx = out['ctx']; d = out['d']; b = sess['blocks'][bi]; x = b['items'][ii]
    lv, dur, goal = ctx['lv'], ctx['dur'], ctx['goal']
    if x['cls'] == 'power':
        dz = C.power_dose(new_id, lv, x['role'] if x['role'] in ('secondary', 'tertiary') else ('contrast' if x['role'] == 'contrast_power' else 'primary'), d, dur)
        dz['sets'] = x['sets']
        if x['role'] == 'contrast_power': dz['rest'] = max(dz['rest'], x['rest'])
        nx = C.P(new_id, x['role'], dz)
        if b['structure'] == 'straight': b['rest_rounds'] = nx['rest']
    elif x['cls'] == 'strength':
        slot = x.get('slot') or ('A' if (ii == 0 and b['role'] == 'strength') else 'B')
        dz = C.strength_dose(new_id, lv, slot, goal, d, dur, contrast=x['role'] == 'contrast_strength'); dz['sets'] = x['sets']
        nx = C.ST(new_id, x['role'], dz, C.strength_pattern(new_id))
        if x.get('slot'): nx['slot'] = x['slot']
    elif x['cls'] == 'support':
        dz = C.support_dose(new_id, lv, goal); dz['sets'] = x['sets']; nx = C.SU(new_id, dz)
    else:
        nx = dict(x, id=new_id, kind='sled_finisher')
    b['items'][ii] = nx
    if b['role'] == 'tertiary': b['quality'] = nx['quality']
    if b['role'] == 'support': b['purpose'] = nx['kind']; b['why'] = C.SUPPORT_WHY[nx['kind']]
    if sess['primary_id'] == x['id']: sess['primary_id'] = new_id
    sess['used'] = [new_id if i == x['id'] else i for i in sess['used']]
    o2['A'] = C.account(sess, out['wu'], lv)
    return o2


def swap_exercise(nctx, history_records, swap, res, bi, ii, excluded):
    """bi: block index, ii: item index inside the block."""
    with LOCK:
        out = res['w']; ctx = out['ctx']
        x = out['sess']['blocks'][bi]['items'][ii]
        for new_id in swap_candidates(out, bi, ii, set(excluded)):
            o2 = _replace(out, bi, ii, new_id)
            if C.violations(o2['A'], ctx['lv'], ctx['dur'], out['d'], o2['sess']['structure'] == 'contrast'): continue
            if o2['A']['est'] > C.WINDOW[ctx['dur']][1]: continue          # a swap never pushes the session past its time window
            if V.fails(o2['sess'], o2['wu'], ctx, ctx['states']): continue
            o2['log'] = out['log'] + [dict(reason_code='exercise_swapped', role=x['role'], **{'from': x['id'], 'to': new_id})]
            res2 = dict(res, w=o2, log=o2['log'], estimated_minutes=float(o2['A']['est']))
            res2['decisions'] = list(res.get('decisions', [])) + [o2['log'][-1]]
            ids = [y['id'] for b in o2['sess']['blocks'] for y in b['items']]
            res2['history_record'] = dict(res['history_record'], exercise_ids=ids, native=C.history_record(o2))
            res2['athletic_summary'] = summary(o2)
            return res2
        raise Conflict('no_alternative', 'No other exercise fits this part of the session today.', [])


def fingerprint(res):
    s = res['w']['sess']
    return hashlib.sha256(repr((s['arch'], s['structure'], s['pq'], [(b['role'], [(x['id'], x['sets'], x.get('reps'), x['rest']) for x in b['items']]) for b in s['blocks']],
                                res['w']['wu'])).encode()).hexdigest()[:16]
