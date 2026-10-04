"""Trainer Coherence Gate (final pre-launch pass, Oct 2026).

A small deterministic check that runs on the FINISHED Strength session, after every validator has passed. It does not build or
score workouts. It asks a handful of yes/no questions a good trainer would ask on sight, and returns the ones that fail:

  lead_off_target       the first exercise does not obviously belong to what was asked for (Clean to Press leading Glutes + Abs)
  identity_unclear      too little of the session trains the archetype's own muscles (a Hinge day that is half core work)
  coverage_gap          Full Body without a press, a pull or a lower-body lift; an explicit Target with too little direct work
  low_value_exercise    a niche / filler accessory occupying one of the few accessory slots
  sequencing            an isolation before a compound for the same muscle; Arms bouncing biceps / triceps in straight sets
  redundant             the same exercise family twice in a non-depth role
  state_overload        more than two "special" elements stacked (scheme + method + device + finisher) or a method on a top set
  level_mismatch        an assisted machine for an intermediate / advanced lifter
  label_mismatch        a block heading that does not describe the exercises in it

Production use (adapter): an archetype build that fails the gate is re-rolled with the existing salt retries; if every attempt
fails, the attempt with the fewest issues ships and the issues are logged (never a conflict for the user). QA asserts zero.
"""
from __future__ import annotations
from collections import Counter
from . import audit_engine as AE

EX = AE.EX
BEGINNER_ONLY = {'assisted_pull_up_machine', 'assisted_dip_triceps'}
IDENTITY = {   # archetype -> muscles the session is about (rolled lead muscle), and the minimum share of working sets on them
    'strength_upper_push': ({'chest', 'shoulders', 'triceps'}, 0.75),
    'strength_upper_pull': ({'back', 'biceps', 'shoulders', 'forearms'}, 0.75),
    'strength_upper_mixed': ({'chest', 'back', 'shoulders', 'biceps', 'triceps'}, 0.8),
    'strength_arms': ({'biceps', 'triceps', 'shoulders', 'forearms'}, 0.8),
    'strength_lower_squat': ({'quads', 'glutes', 'hamstrings', 'calves', 'hip_adductors', 'hip_abductors'}, 0.8),
    'strength_lower_hinge': ({'hamstrings', 'glutes', 'spinal_erectors', 'hip_abductors'}, 0.8),
    'strength_glutes_legs': ({'glutes', 'quads', 'hamstrings', 'hip_abductors', 'calves'}, 0.8),
}
LEAD = {   # archetype -> predicate on the first (main) lift
    'strength_upper_push': lambda e: e['pat'] in AE.PUSH,
    'strength_upper_pull': lambda e: e['pat'] in AE.PULL,
    'strength_upper_mixed': lambda e: e['pat'] in AE.PUSH | AE.PULL,
    'strength_lower_squat': lambda e: e['pat'] in ('squat', 'lunge'),
    'strength_lower_hinge': lambda e: e['pat'] == 'hinge',
    'strength_glutes_legs': lambda e: AE.roll(e['pm0']) == 'glutes',
    'strength_full_body': lambda e: AE.region(e['prim'][0]) == 'lower' and e['cls'] != 'isolation',
    'strength_arms': lambda e: AE.roll(e['pm0']) in ('biceps', 'triceps') or e['cls'] != 'isolation',
}
LOW_VALUE = {'band_pull_apart', 'plate_front_raise', 'cable_front_raise', 'copenhagen_plank', 'mountain_climber', 'banded_lateral_walk',
             'side_lying_hip_abduction', 'cable_hip_adduction', 'hip_adduction_machine'}
FILLER_BY_ARCH = {   # rolled lead muscles that never belong in this archetype's accessory work
    'strength_lower_hinge': {'core', 'hip_adductors', 'quads', 'forearms'},
    'strength_lower_squat': {'core', 'forearms'},
    'strength_glutes_legs': {'core', 'forearms'},
    'strength_upper_push': {'core', 'back', 'biceps'},
    'strength_upper_pull': {'core', 'chest', 'triceps'},
    'strength_full_body': {'hip_adductors', 'hip_abductors', 'forearms'},
}


def _m(eid): return AE.roll(EX[eid]['pm0'])


def block_role(aid, b, brows):
    """The role a block plays in THIS workout (the cart heading), separate from the slot taxonomy that built it.
    Arms: the lead curl and lead extension (and a bridge lift) are the main work. Custom Target: every block is Target work named for
    its muscle; a single-muscle session's lead compound is the main lift. Core: direct trunk work is the Target, the loaded bracing
    lifts around it are strength work. -> (type, title)"""
    if b['structure_id'] == 'finisher': return 'finisher', 'Finisher'
    r = brows[0]; cls = r.get('cls', 'accessory')
    if aid == 'strength_arms':
        t = 'main' if any(x['slot'] in ('compound_combination', 'biceps_exercise', 'triceps_exercise') for x in brows) else 'accessory'
        return t, {'main': 'Main lift', 'accessory': 'Accessory'}[t]
    if aid == 'strength_custom_target':
        if cls == 'primary_compound': return 'main', 'Main lift'
        m = r.get('muscle') or EX[r['eid']]['pm0']
        return 'target', m.replace('_', ' ').title()
    if aid == 'strength_core':
        if AE.roll(EX[r['eid']]['pm0']) != 'core': return 'secondary', 'Strength'   # a loaded bracing lift (Z-Press, Goblet Squat) is strength work
        return 'target', 'Core'
    t = {'primary_compound': 'main', 'secondary_compound': 'secondary', 'accessory': 'accessory', 'extra': 'accessory'}.get(cls, 'accessory')
    return t, {'main': 'Main lift', 'secondary': 'Strength', 'accessory': 'Accessory'}[t]


def check(res, nctx):
    """-> list of (code, detail). Empty list = a good trainer would sign off on this session as built."""
    aid = res['archetype']; rows = res['rows']; blocks = res['st_blocks']; fin = (res.get('fin_rows') or [None])[0]
    exp = nctx['experience']; out = []
    byslot = {r['slot']: r for r in rows}
    order = [byslot[it['slot']] for b in blocks for it in b['items'] if it['slot'] in byslot]
    if not order: return [('empty', '')]
    explicit = set(res.get('target_muscles') or ()) if res.get('mode') == 'explicit' else set()
    sets_by = Counter()
    for r in rows: sets_by[_m(r['eid'])] += r['sets']
    total = sum(sets_by.values()) or 1

    # ---- lead movement matches the request
    lead = EX[order[0]['eid']]
    if aid == 'strength_custom_target':
        tg = set(res.get('target_muscles') or ())
        if _m(lead['id']) not in tg or lead['cls'] == 'integrated' or lead['combo']: out.append(('lead_off_target', lead['id']))
        for m in tg:   # every named muscle gets direct, meaningful work
            direct = [r for r in rows if _m(r['eid']) == m]
            need = 2 if (nctx['duration'] == 30 and len(tg) >= 2) or len(tg) >= 3 else 3
            if sum(r['sets'] for r in direct) < need: out.append(('coverage_gap', f'{m}: {sum(r["sets"] for r in direct)} direct sets'))
    elif aid in LEAD and not LEAD[aid](lead):
        out.append(('lead_off_target', lead['id']))

    # ---- archetype identity
    if aid in IDENTITY:
        focus, share = IDENTITY[aid]; focus = focus | explicit
        on = sum(v for m, v in sets_by.items() if m in focus)
        if on / total < share: out.append(('identity_unclear', f'{on}/{total} sets on {sorted(focus)}'))
    if aid == 'strength_full_body':
        pats = set()
        for r in rows: pats |= {EX[r['eid']]['pat']} | set(EX[r['eid']].get('comps') or ())
        regions = {AE.region(m) for r in rows for m in EX[r['eid']]['prim']}
        sore = {AE.roll(m) for m in (nctx.get('sore') or ())}   # a sore region legitimately leaves its pattern out
        if not pats & AE.PUSH and not sore & {'chest', 'shoulders', 'triceps'}: out.append(('coverage_gap', 'Full Body without a press'))
        if not pats & AE.PULL and not sore & {'back', 'biceps'}: out.append(('coverage_gap', 'Full Body without a pull'))
        if 'lower' not in regions and not sore & {'quads', 'glutes', 'hamstrings'}: out.append(('coverage_gap', 'Full Body without lower-body work'))

    # ---- every exercise earns its place
    for r in rows:
        m = _m(r['eid'])
        if m in explicit: continue
        if r['eid'] in LOW_VALUE: out.append(('low_value_exercise', r['eid']))
        elif r['cls'] in ('accessory', 'extra') and m in FILLER_BY_ARCH.get(aid, ()): out.append(('low_value_exercise', f"{r['eid']} ({m} on {aid})"))

    # ---- sequencing
    if aid not in ('strength_core',):
        for i, r in enumerate(order):
            e = EX[r['eid']]
            if e['cls'] == 'isolation': continue
            if r['cls'] not in ('primary_compound', 'secondary_compound'): continue    # a bodyweight compound used as an accessory may come late
            early = [x for x in order[:i] if EX[x['eid']]['cls'] == 'isolation' and _m(x['eid']) == AE.roll(e['pm0'])]
            if early and aid != 'strength_arms': out.append(('sequencing', f"{early[0]['eid']} before {r['eid']}"))
    if aid == 'strength_arms':
        straight_bt = [_m(byslot[b['items'][0]['slot']]['eid']) for b in blocks if b['structure_id'] == 'straight' and b['items'][0]['slot'] in byslot]
        straight_bt = [m for m in straight_bt if m in ('biceps', 'triceps')]
        switches = sum(1 for a, b in zip(straight_bt, straight_bt[1:]) if a != b)
        if switches > 1: out.append(('sequencing', f'Arms bounces biceps/triceps: {straight_bt}'))

    # ---- redundancy (a family twice outside the designed depth slots)
    fam = Counter(EX[r['eid']]['swap'] for r in rows if not r['slot'].endswith('_depth') and r['slot'] not in ('ancillary_depth', 'optional_extra_burnout'))
    dup = [f for f, n in fam.items() if n > 1]
    if dup and aid not in ('strength_custom_target', 'strength_core'): out.append(('redundant', ','.join(dup)))

    # ---- State / programming devices do not overwhelm the session
    prim = next((r for r in rows if r['cls'] == 'primary_compound'), None)
    special = (1 if prim and prim.get('scheme') else 0) + sum(1 for r in rows if r.get('method')) + sum(1 for b in blocks if b['structure_id'] in ('pyramid', 'ladder')) + (1 if fin else 0)
    if special > (3 if 'bored' in (nctx.get('states') or ()) else 2): out.append(('state_overload', f'{special} special elements'))
    if prim and prim.get('scheme') and prim.get('method'): out.append(('state_overload', f"{prim['method']['id']} on a top set"))

    # ---- experience
    if exp != 'beginner':
        for r in rows + ([fin] if fin else []):
            if r['eid'] in BEGINNER_ONLY: out.append(('level_mismatch', r['eid']))

    # ---- labels describe contents
    for b in blocks:
        br = [byslot[it['slot']] for it in b['items'] if it['slot'] in byslot]
        if not br: continue
        t, title = block_role(aid, b, br)
        if t == 'target' and aid == 'strength_custom_target' and b['structure_id'] == 'straight' and title.lower().replace(' ', '_') != _m(br[0]['eid']):
            out.append(('label_mismatch', f"{title} block holds {br[0]['eid']}"))
        if t == 'target' and title == 'Core' and any(_m(x['eid']) != 'core' for x in br):
            out.append(('label_mismatch', f"Core block holds {[x['eid'] for x in br if _m(x['eid']) != 'core']}"))
        if t == 'main' and aid not in ('strength_arms',) and all(EX[x['eid']]['cls'] == 'isolation' for x in br):
            out.append(('label_mismatch', f"Main lift block holds isolation {br[0]['eid']}"))
    return out
