"""Independent Athletic validator (V3 Athletic rebuild).

Re-reads the finished session and checks the Athletic invariants without trusting the generator's own bookkeeping:
order (highest intent first, no power under fatigue), low-rep power dosing, recovery that preserves intent, impact /
sprint / intent budgets by level, level gates, equipment and soreness, structure identity, finisher rules and duration.
Returns a list of (check, ok, detail). Any failed check is a hard failure (the adapter turns it into a conflict; QA counts it).
"""
from __future__ import annotations
from . import athletic_core as C
from .lib3 import avail

EX = C.EX
ROLE_ORDER = ['primer', 'primary', 'secondary', 'tertiary', 'strength', 'support', 'finisher']
MAX_REPS = {'uni_jump': 3, 'pop': 4, 'muscle_up': 3, 'speed_strength': 3, 'jump': 5, 'loaded_jump': 5, 'combo': 3, 'bound': 6, 'hop': 4, 'elastic': 10, 'drop': 4, 'lateral': 4, 'sprint': 1, 'sled': 1,
            'throw': 6, 'slam': 6, 'rot_throw': 5, 'landmine_rot': 5, 'upper': 5, 'olympic': 4, 'explosive_lift': 3, 'swing': 10}
MIN_REST = {'uni_jump': 75, 'pop': 60, 'muscle_up': 90, 'speed_strength': 75, 'jump': 60, 'loaded_jump': 90, 'combo': 90, 'bound': 90, 'hop': 60, 'elastic': 45, 'drop': 90, 'lateral': 60, 'sprint': 60,
            'sled': 75, 'throw': 45, 'slam': 45, 'rot_throw': 45, 'landmine_rot': 60, 'upper': 60, 'olympic': 90, 'explosive_lift': 90, 'swing': 60}
EST_BAND = {60: (28, 58), 30: (17, 31)}


def validate(sess, wu, ctx, states=()):
    R = []
    def chk(name, ok, detail=''): R.append((name, bool(ok), detail))
    lv, dur, pre, sore = ctx['lv'], ctx['dur'], ctx['preset'], ctx['sore']
    blocks = sess['blocks']; roles = [b['role'] for b in blocks]
    its = [x for b in blocks for x in b['items']]
    # ---- order: highest intent first; power never after strength / support / finisher
    # sequencing pass: an optional low-fatigue Primer (potentiation) may precede the primary; nothing else may
    chk('one_primary_first', roles and roles.count('primary') == 1 and roles.count('primer') <= 1 and (roles[0] == 'primary' or (roles[0] == 'primer' and roles[1] == 'primary')), roles)
    chk('role_order', roles == sorted(roles, key=ROLE_ORDER.index), roles)
    late_power = [x['id'] for b in blocks if b['role'] in ('strength', 'support', 'finisher') for x in b['items'] if x['cls'] == 'power']
    chk('no_power_under_fatigue', not late_power, late_power)
    chk('secondary_max_one', roles.count('secondary') <= 1 and roles.count('tertiary') <= (2 if 'secondary' in roles else 0), roles)
    ter = [x for b in blocks if b['role'] == 'tertiary' for x in b['items']]
    chk('further_athletic_dose', all(x['sets'] <= (4 if x['kind'] in C.SPRINT_KINDS | {'speed_strength'} else 3) and x['kind'] != 'olympic' for x in ter), [(x['id'], x['sets']) for x in ter])
    # highest cost first: after the primary, athletic elements run A before B before C
    # sequencing pass: after the lead, athletic work runs in order of performance demand (loaded / high-velocity, ballistic /
    # plyometric, velocity-strength), and never ahead of a higher-demand element
    seq = [C.demand(b['items'][-1]) for b in blocks if b['role'] in ('secondary', 'tertiary')]
    chk('athletic_cost_order', seq == sorted(seq), seq)
    prim_x = C.PB(sess)['items'][-1] if blocks else None
    if prim_x is not None and sess['structure'] != 'contrast' and sess['arch'] != 'athletic_speed_agility':
        chk('demand_lead', not seq or C.demand(prim_x) <= seq[0], (prim_x['id'], seq))
    pr = [x for b in blocks if b['role'] == 'primer' for x in b['items']]
    chk('primer_low_fatigue', all(x['sets'] <= 2 and x['reps'] <= 6 and x['kind'] in C.PRIMER_KINDS for x in pr), [x['id'] for x in pr])
    chk('no_carries', not any(x['id'] in ('farmer_carry', 'suitcase_carry', 'front_rack_carry', 'overhead_carry') for x in its), [x['id'] for x in its])
    # ---- power dosing + recovery
    for x in its:
        if x['cls'] != 'power': continue
        k = x['kind']
        chk(f"power_reps:{x['id']}", x['reps'] <= MAX_REPS.get(k, 5), f"{x['reps']} reps")
        chk(f"power_rest:{x['id']}", x['rest'] >= MIN_REST.get(k, 60), f"{x['rest']} s")
        per_set = x['work_s']
        chk(f"work_rest_ratio:{x['id']}", x['rest'] >= (2 if k in C.THROW_KINDS else 3) * min(per_set, 30), f"{per_set:.0f} s work / {x['rest']} s rest")
        chk(f"power_sets:{x['id']}", 2 <= x['sets'] <= (8 if k in ('sprint', 'sled') else 6), x['sets'])
        if k == 'sprint': chk(f"sprint_distance:{x['id']}", (x.get('distance_m') or 0) <= 10, x.get('distance_m'))
        e = EX[x['id']]; mlv = C.POWER[x['id']][2]
        chk(f"level_gate:{x['id']}", C.level_ok(e, lv, mlv), (e['cx'], e['skill'], e['impact']))
    for x in its:
        if x['cls'] == 'strength':
            chk(f"strength_dose:{x['id']}", 3 <= x['reps'] <= 10 and 1 <= x['rir'] <= 4 and x['rest'] >= 45 and 2 <= x['sets'] <= 5, (x['sets'], x['reps'], x['rir'], x['rest']))
            chk(f"strength_level:{x['id']}", C.level_ok(EX[x['id']], lv), EX[x['id']]['cx'])
    # ---- availability + soreness + duplicates
    for x in its:
        e = EX[x['id']]
        chk(f"equipment:{x['id']}", avail(e, pre), (e['eq'], e['space']))
        chk(f"soreness:{x['id']}", not C.region_blocked(e, sore), sorted(sore))
    ids = [x['id'] for x in its]
    chk('no_duplicates', len(ids) == len(set(ids)), ids)
    fams = [EX[i]['swap'] for i in ids if EX[i]['swap']]
    chk('no_duplicate_family', len(fams) == len(set(fams)), fams)
    # ---- budgets (recomputed from items)
    A = C.account(sess, wu, lv)
    L = C.limits(lv, dur)
    for k in ('contacts', 'high_contacts', 'accel_efforts', 'explosive_sets', 'intent_load', 'olympic_sets', 'high_skill', 'strength_sets', 'ath_cost', 'tier_a'):
        chk(f'budget_{k}', A[k] <= L[k], f"{A[k]} / {L[k]}")
    nexp = A['n_explosive'] - (1 if sess['structure'] == 'contrast' else 0)
    chk('budget_n_explosive', nexp <= L['n_explosive'], f"{A['n_explosive']} / {L['n_explosive']}")
    n_main = sum(1 for b in blocks if b['role'] != 'finisher' for _ in b['items'])
    chk('exercise_count', (2 <= n_main <= 5) if dur == 60 else (2 <= n_main <= 3), n_main)
    # ---- athletic strength present (the support for the power work)
    has_strength = any(x['cls'] == 'strength' for x in its)
    # composition pass: an athletic-volume session (4 athletic movements + trunk / stability support) needs no traditional strength lift
    n_pw = sum(x['cls'] == 'power' for x in its)
    volume_ok = dur == 60 and (n_pw >= 4 or (n_pw >= 3 and any(x['cls'] == 'support' for x in its)))
    chk('athletic_strength_present', has_strength or volume_ok, roles)
    # ---- structure identity
    s = sess['structure']; pblk = C.PB(sess) if blocks else None; prim = pblk['items'][-1] if blocks else None
    if prim:
        pk = prim['kind']
        if s == 'speed_strength': chk('identity_speed', pk in ('sprint', 'sled'), pk)
        if s == 'jump_throw': chk('identity_jump_throw', pk in C.JUMP_KINDS and any(b['role'] in ('secondary', 'tertiary') and b['items'][0]['kind'] in C.THROW_KINDS | {'landmine_rot', 'upper'} for b in blocks), pk)
        if s == 'contrast': chk('identity_contrast', pblk['structure'] == 'contrast' and pblk['items'][0]['cls'] == 'strength' and prim['cls'] == 'power', pblk['structure'])
        if s == 'athletic_mixed': chk('identity_mixed', any(b['role'] == 'secondary' for b in blocks), roles)
    # ---- finisher rules
    fin = [b for b in blocks if b['role'] == 'finisher']
    chk('finisher_rules', not fin or (len(fin) == 1 and dur == 60 and lv != 'beginner' and fin[0]['items'][0]['kind'] in ('sled_finisher',)
                                     and not set(states) & {'low_energy', 'amped', 'irritated', 'stressed'}), [b['items'][0]['id'] for b in fin])
    # ---- duration: a training window, not a quota
    lo, hi = EST_BAND[dur]
    if 'low_energy' in states and dur == 60: lo = 25          # a Low Energy hour may legitimately be short (fewer movements, fewer sets)
    chk('duration_window', lo <= A['est'] <= hi, A['est'])
    # ---- warm-up
    comps = [c for c, *_ in wu]
    chk('warmup_shape', comps.count('raise') == 1 and 2 <= len(wu) <= 6, comps)
    return R


def fails(sess, wu, ctx, states=()):
    return [(n, d) for n, ok, d in validate(sess, wu, ctx, states) if not ok]
