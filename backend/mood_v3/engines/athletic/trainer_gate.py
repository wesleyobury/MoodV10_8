"""Athletic Trainer Coherence Gate (final pre-launch pass).

A small deterministic read of the FINISHED session, asking what a good strength and conditioning coach would ask:
"why is this programmed this way?". It complements the independent validator (which enforces hard safety / dosing
invariants) with trainer-quality checks:

  athletic_insufficient   too little meaningful athletic work for the level, duration and State
  power_unloaded          an intermediate / advanced Power day with no meaningful loaded explosive movement (when the
                          equipment offers one)
  low_level_dominant      low-level throws / low jumps carrying the session (more than one Tier C element, or a Tier C primary
                          for a trained athlete on a normal day)
  sequencing              a barbell Olympic lift that does not lead, a Tier A explosive lift after two other athletic blocks,
                          lower-cost work ahead of higher-cost, or strength before power
  redundant               two athletic movements that are variations of one another
  complexity              movement complexity above what the level / State allows
  strength_heavy          ordinary strength work outweighing the athletic work
  identity:<code>         the session does not express its archetype (Speed + Plyo without two speed / plyo elements,
                          Full-Body Athlete missing lower- or upper-body athletic work, a Power day led by a throw)

The generator tries its next candidate when the gate finds issues and ships the candidate with the fewest issues.
"""
from __future__ import annotations
from . import athletic_core as C

EX = C.EX


def check(sess, ctx, d):
    """-> list of issue codes (empty = coherent)."""
    lv, dur = ctx['lv'], ctx['dur']
    arch = sess['arch']; blocks = sess['blocks']
    le = 'low_energy' in d['prefer']; stressed = bool(d['simple']); legs_sore = bool(ctx['sore'] & C.LOWER)
    pw = [x for b in blocks for x in b['items'] if x['cls'] == 'power']
    st = [x for b in blocks for x in b['items'] if x['cls'] == 'strength' and b['role'] == 'strength']
    tiers = [C.tier(x['id'], x['role']) for x in pw]
    n_ath = len(pw); n_ab = sum(t != 'C' for t in tiers); n_c = sum(t == 'C' for t in tiers)
    issues = []
    # ---- enough meaningful athletic work (scaled for beginners, Low Energy, soreness)
    if le: need_n, need_ab = (2 if dur == 60 else 1), 1
    elif legs_sore: need_n, need_ab = 2, 1
    elif lv == 'beginner': need_n, need_ab = 2, 1
    elif dur == 60: need_n, need_ab = 3, 2
    else: need_n, need_ab = 2, 1
    if n_ath < need_n or n_ab < need_ab: issues.append(f'athletic_insufficient:{n_ath}/{n_ab}')
    # ---- Power carries loaded power when the level, State and equipment allow it
    if C.loaded_need(ctx, d, arch) == 2 and not any(C.is_major_loaded(x['id']) for x in pw):
        avail = [i for q in C.QUALITY_LABEL for i in C.power_pool(ctx, q) if C.is_major_loaded(i) and EX[i]['cx'] <= d['cx_cap']]
        if avail: issues.append('power_unloaded')
    # ---- low-level work does not carry the session
    prim = C.PB(sess)['items'][-1] if blocks else None
    if n_c > 1 and not legs_sore and not (le and lv == 'beginner'): issues.append('low_level_dominant:tier_c_x' + str(n_c))
    if prim is not None and lv != 'beginner' and not le and not legs_sore and C.tier(prim['id'], prim['role']) == 'C': issues.append('low_level_dominant:primary')
    # ---- sequencing: highest cost first; an Olympic / Tier A lift never after two other athletic blocks
    ath_blocks = [b for b in blocks if b['role'] in ('primary', 'secondary', 'tertiary')]      # a Primer never counts as a lead
    for n, b in enumerate(ath_blocks):
        x = b['items'][-1]
        if (n >= 1 and x['kind'] == 'olympic') or (n >= 2 and x['kind'] in C.OLY_KINDS and C.tier(x['id'], x['role']) == 'A'): issues.append(f"sequencing:{x['id']}_late")
    seq = [C.demand(b['items'][-1]) for b in blocks if b['role'] in ('secondary', 'tertiary')]
    if seq != sorted(seq): issues.append('sequencing:demand_order')
    if any(b['role'] in ('strength', 'support', 'finisher') for b in blocks[:1]): issues.append('sequencing:strength_first')
    # ---- composition pass: sprinting is a sprinkle, never two sprint variations in one session
    if sum(x['kind'] == 'sprint' for x in pw) > 1: issues.append('sprint_heavy')
    # ---- redundancy
    ids = [x['id'] for x in pw]
    groups = [C.REDUNDANT.get(i) for i in ids if C.REDUNDANT.get(i)]
    if len(groups) != len(set(groups)): issues.append('redundant:variation')
    kq = [(x['kind'], x['quality']) for x in pw]
    if len(kq) != len(set(kq)): issues.append('redundant:same_kind_quality')
    # ---- complexity for the level / State
    cap = min(C.CX_CAP[lv], d['cx_cap'])
    if any(EX[x['id']]['cx'] > cap for x in pw): issues.append('complexity')
    # ---- ordinary strength does not outweigh the athletic work
    if len(st) > max(n_ath, 1) or (lv != 'beginner' and sum(x['sets'] for x in st) > sum(x['sets'] for x in pw) + 2): issues.append('strength_heavy')
    # ---- archetype identity (the brief: a coach could tell the session type without its title)
    for g in C.composition_gaps(ctx, d, arch, pw):
        if g != 'loaded': issues.append('identity:' + g)
    if arch == 'athletic_power' and prim is not None and prim['kind'] in C.THROW_KINDS and lv != 'beginner' and not le and not legs_sore:
        issues.append('identity:power_throw_led')
    if arch == 'athletic_speed_agility' and prim is not None and prim['kind'] not in C.SPEED_PLYO_KINDS and not legs_sore:
        issues.append('identity:speed_not_led_by_speed_plyo')
    return issues
