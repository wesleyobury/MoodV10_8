"""Sweat Trainer Coherence Gate (final pre-launch trainer pass, Oct 2026).

A small deterministic check on the FINISHED Sweat session, after the Direction validator has passed. It does not build or score
workouts. It asks the yes/no questions a good trainer would ask on sight and returns the ones that fail:

  underfilled            programmed work clearly below the minimum meaningful work for the selected duration
  generic_steady_state   a standalone steady-state main block, or a steady flush long enough to be a second steady session
  weak_stimulus          too few active minutes for a real conditioning session
  excessive_hard_work    hard (RPE 8+) minutes or all-out blocks above the level ceiling; RPE 9 for a beginner
  excessive_impact       impact contacts above the level ceiling
  engine_volume          engine minutes above the level ceiling
  redundant              the same exercise family twice, or the same machine in two blocks
  station_complexity     too many stations in one block or too many distinct stations
  state_mismatch         a State's non-negotiable broken (Low Energy at RPE 9, Stressed with a countdown structure or all-out work)
  state_overload         more than two special elements stacked (finisher + changing structure + ladder complement ...)
  target_thin            an explicit Target muscle without a station that trains it as a primary mover
  level_mismatch         beginner given a complex structure or several systemically demanding stations
  low_value_exercise     two or more filler stations carrying a non-beginner main circuit
  pattern_overload       three or more pressing stations in one block (unless the Target is a pressing muscle)

Production use (adapter): a build that fails the gate is re-rolled with a salted seed (up to 3 tries); the attempt with the fewest
issues ships and the issues are logged (never a conflict for the user). QA asserts zero.
"""
from __future__ import annotations
from collections import Counter
from . import sweat_core as C
from .sweat_data import roll

EX = C.EX
WORK_TOLERANCE = 2.0                         # minutes below the work floor before the gate calls it underfilled
ACTIVE_MIN = {30: 8.0, 60: 18.0}             # active (moving) minutes for a real conditioning stimulus
FILLER = {'glute_bridge', 'dead_bug', 'plank', 'waiter_carry', 'reverse_crunch', 'decline_sit_up'}
SPECIAL_STRUCT = {'pyramid', 'emom', 'ladder'}
SMALL_MUSCLES = {'biceps', 'triceps', 'forearms', 'calves'}
CONSTRAINED_PRESETS = {'db_bodyweight_only', 'db_bench_only', 'free_weight_limited'}


_is_press = C.is_press


def _rolled(e): return {roll(m) for m in e['prim']} | set(e['prim'])


def check(res, nctx):
    """res: the adapter result (res['w'] is the block workout). -> list of (code, detail). Empty = a good trainer signs off."""
    w = res['w']; blocks = w['blocks']; exp = w['experience']; dur = w['duration']; aid = w['archetype_id']
    states = set(w['states']); out = []
    if not blocks: return [('empty', '')]
    B = C.budget(blocks, aid, dur, exp); L = C.limits(exp, dur); p = blocks[0]

    # ---- the selected duration is a real expectation
    work = C.work_minutes(blocks, exp); floor = C.work_floor(blocks, dur, exp)
    # no cardio machine in the setup (minimal / free-weight presets) + a beginner or Low Energy: bodyweight drivers are all jumping
    # patterns, so the impact ceiling caps the session; the gate allows for that (logged as a known library gap)
    constrained = nctx.get('equipment') in CONSTRAINED_PRESETS and (exp == 'beginner' or 'low_energy' in states)
    sore = bool(nctx.get('sore'))          # soreness legitimately narrows the menu (machines, stations, balance); judged with the same allowance
    if constrained or sore: floor -= {30: 2.5, 60: 6.0}[dur]
    if work < floor - WORK_TOLERANCE: out.append(('underfilled', f'{work:.1f} min of work vs floor {floor:.1f}'))
    if w['est_minutes'] < C.BAND[dur][0] - 2: out.append(('underfilled', f"{w['est_minutes']} min elapsed for a {dur}-minute session"))

    # ---- no generic "just do cardio"
    if p['structure'] == 'continuous': out.append(('generic_steady_state', f"{EX[p['items_e'][0]['id']]['name']} continuous as the main block"))
    for b in blocks[1:]:
        if b['structure'] == 'continuous' and b['duration_s'] > C.STEADY_COMP_MAX_MIN * 60: out.append(('generic_steady_state', f"{b['duration_s'] // 60} min steady flush"))

    # ---- enough stimulus, not too much
    act_need = ACTIVE_MIN[dur] * (0.85 if exp == 'beginner' else 1.0) * (0.85 if constrained else 1.0)
    if B['active_min'] < act_need: out.append(('weak_stimulus', f"{B['active_min']} active min (need {act_need:.0f})"))
    if B['hard_min'] > L['hard_min'] + 0.5 and B['hard_share'] > L['hard_share']: out.append(('excessive_hard_work', f"{B['hard_min']} min at RPE 8+"))
    if B['very_hard_blocks'] > L['very_hard']: out.append(('excessive_hard_work', f"{B['very_hard_blocks']} all-out blocks"))
    if exp == 'beginner' and any(b['rpe'][1] > 8 for b in blocks): out.append(('excessive_hard_work', 'RPE 9 for a beginner'))
    if B['impact_contacts'] > L['impact_contacts'] and not constrained: out.append(('excessive_impact', f"{B['impact_contacts']} contacts"))   # bodyweight-only drivers are all jumps
    if B['engine_min'] > L['engine_min'] + 0.6: out.append(('engine_volume', f"{B['engine_min']} engine min"))

    # ---- every station earns its place
    fams = Counter(e['swap'] for b in blocks for e in b['items_e'])
    dup = [f for f, n in fams.items() if n > 1]
    if dup: out.append(('redundant', ','.join(sorted(dup))))
    eng = [e['id'] for b in blocks for e in b['items_e'] if e['role'] == 'engine']
    if len(eng) != len(set(eng)): out.append(('redundant', 'same machine in two blocks'))
    for b in blocks:
        n = len({e['id'] for e in b['items_e']})
        if n > 5: out.append(('station_complexity', f"{n} stations in {b['slot']}"))
    if B['stations'] > L['stations']: out.append(('station_complexity', f"{B['stations']} distinct stations"))
    tgt = {m for m in (nctx.get('target_muscles') or ())} if nctx.get('target_mode') == 'explicit' else set()
    main_st = [e for e in p['items_e'] if e['role'] != 'engine' and not (_rolled(e) & tgt)]
    if exp != 'beginner' and 'low_energy' not in states and not sore and sum(1 for e in main_st if e['id'] in FILLER) >= 2:
        out.append(('low_value_exercise', ','.join(e['id'] for e in main_st if e['id'] in FILLER)))

    # ---- balance: three overhead / pressing stations in one block (Squat-to-Press + Push Press + Wall Ball)
    for b in blocks:
        pr = [e['id'] for e in b['items_e'] if _is_press(e)]
        if len(pr) >= 3 and not sore and not ({'shoulders', 'triceps', 'chest'} & tgt): out.append(('pattern_overload', f"{len(pr)} pressing stations in {b['slot']}: {','.join(pr)}"))

    # ---- State shapes the session, never overwhelms or contradicts it
    if 'low_energy' in states and any(b['rpe'][1] >= 9 for b in blocks if b['structure'] != 'finisher'): out.append(('state_mismatch', 'Low Energy with an RPE 9 block'))
    if 'low_energy' in states and B['finisher']: out.append(('state_mismatch', 'Low Energy with a finisher'))
    if 'stressed' in states and 'amped' not in states and (p['structure'] in ('emom', 'ladder') or B['finisher']): out.append(('state_mismatch', 'Stressed with a countdown structure or all-out finisher'))
    if 'stressed' in states and not ({'amped', 'irritated'} & states):
        busy = [e['id'] for b in blocks for e in b['items_e'] if e['role'] != 'engine' and (e['cx'] >= 3 or (e['pat'] == 'jump' and e['sysd'] >= 4))]
        if busy: out.append(('state_mismatch', f"Stressed with complex / chaotic stations: {','.join(busy)}"))
    special = B['finisher'] + (p['structure'] in SPECIAL_STRUCT or p.get('shape') == 'ladder_hybrid') + sum(1 for b in blocks[1:] if b['structure'] in SPECIAL_STRUCT)
    if special > 2: out.append(('state_overload', f'{special} special elements'))

    # ---- an explicit Target is visibly trained
    if nctx.get('target_mode') == 'explicit':
        st = [e for b in blocks for e in b['items_e'] if e['role'] != 'engine']
        for m in nctx.get('target_muscles') or ():
            if m == 'full_body': continue
            small = m in SMALL_MUSCLES          # a small muscle is trained as a secondary mover in compound conditioning work
            secondary_ok = small or constrained    # a constrained setup may only reach a muscle as a secondary mover
            if not any(m in _rolled(e) or (secondary_ok and m in ({roll(x) for x in e['sec']} | set(e['sec']))) for e in st): out.append(('target_thin', m))

    # ---- level
    if exp == 'beginner':
        if p['structure'] in SPECIAL_STRUCT or p.get('shape') == 'ladder_hybrid': out.append(('level_mismatch', f"{p['structure']} for a beginner"))
        if len(B['demanding']) > 2: out.append(('level_mismatch', f"{len(B['demanding'])} systemically demanding stations"))
    return out
