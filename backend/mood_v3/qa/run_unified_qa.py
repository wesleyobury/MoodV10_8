"""MOOD V3 unified production-path QA (integration boundaries, not a re-audit of frozen Direction rules).

Runs the real service path (normalize -> Direction adapter -> frozen generator -> frozen validator -> formatter ->
explanations / cues / progression) and checks what integration could break:
  A grid        Direction x State sets x duration x experience x equipment x Target / archetype
  B history     multi-session sequences with completion records (rotation, continuity, recency, no failures)
  C swaps       every item of sampled workouts swapped; Swap Workout chains
  D conflicts   the designed explicit outcomes
  E progression exact-exercise load logic
  F negative    intentionally bad workouts are caught by the frozen validators
  G determinism identical input -> identical output
Usage: python -m mood_v3.qa.run_unified_qa [out.json]
"""
from __future__ import annotations
import copy, itertools, json, sys, time
from collections import Counter, defaultdict
from .. import service as S, normalize as N, explain
from ..engines.strength import adapter as SA
from ..engines.sweat import adapter as WA, sweat_gen as SG, sweat_validate as SV
from ..engines.athletic import adapter as AA, athletic_gen as AG, sk5

STATE_SETS = [[], ['low_energy'], ['stressed'], ['bored'], ['irritated'], ['amped'], ['sore'],
              ['bored', 'stressed'], ['low_energy', 'amped'], ['irritated', 'low_energy'], ['irritated', 'stressed'], ['bored', 'amped'],
              ['sore', 'amped'], ['low_energy', 'stressed'], ['irritated', 'amped'], ['low_energy', 'bored', 'stressed'], ['irritated', 'amped', 'bored'],
              ['sore', 'low_energy', 'amped']]
SORE_FOR_STATE = {'strength': ['shoulders'], 'sweat': ['legs'], 'athletic': ['chest']}
EQUIP = ['commercial_gym', 'free_weight_limited', 'minimal']
EXPS = ['beginner', 'intermediate', 'advanced']
TARGETS = {
    'strength': [dict(), dict(archetype='strength_upper_push'), dict(archetype='strength_upper_pull'), dict(archetype='strength_upper_mixed'),
                 dict(archetype='strength_arms'), dict(archetype='strength_lower_squat'), dict(archetype='strength_lower_hinge'),
                 dict(archetype='strength_glutes_legs'), dict(archetype='strength_full_body'), dict(archetype='strength_core'),
                 dict(target=['chest', 'triceps']), dict(target=['back', 'biceps']), dict(target=['shoulders']), dict(target=['calves']),
                 dict(target=['quads', 'hamstrings']), dict(target='full_body')],
    'sweat': [dict(), dict(archetype='sweat_engine'), dict(archetype='sweat_circuit'), dict(archetype='sweat_hybrid'), dict(target=['quads', 'glutes']),
              dict(target='full_body')],
    'athletic': [dict(), dict(archetype='athletic_power'), dict(archetype='athletic_speed_agility'), dict(archetype='athletic_full_body')],
}
KNOWN_CONFLICTS = {'sore_target_conflict', 'equipment_insufficient', 'cannot_build'}
STRUCTURES = {'strength': {'straight', 'superset', 'circuit', 'pyramid', 'ladder', 'finisher'},
              'sweat': {'continuous', 'intervals', 'timed_circuit', 'pyramid', 'anchor_circuit', 'circuit', 'emom', 'ladder', 'finisher'},
              'athletic': {'exposure', 'repeats', 'straight'}}

def ex_meta(direction, eid):
    E = {'strength': SA.EX, 'sweat': SG.EX, 'athletic': AG.EX}[direction]
    return E.get(eid)

def check_envelope(env, raw, fails, tag):
    def bad(msg): fails.append(dict(tag=tag, input=raw, fail=msg))
    for k in ('schema_version', 'status', 'outcome', 'workout', 'conflict'):
        if k not in env: bad(f'missing {k}')
    if env['status'] == 'conflict':
        c = env['conflict']
        if c['code'] not in KNOWN_CONFLICTS: bad(f"unexpected conflict {c['code']}: {c['message']} {c.get('adjustments')}")
        if not c['options'] and c['code'] != 'no_alternative': bad('conflict without options')
        return
    w = env['workout']; d = w['direction']
    ctx = N.normalize(raw, 'qa')
    if w['direction'] != ctx.direction: bad('direction changed')
    if not w['blocks']: bad('no blocks')
    for b in w['blocks']:
        if b['structure'] not in STRUCTURES[d]: bad(f"structure {b['structure']} not allowed in {d}")
        for it in b['items']:
            rx = it['prescription']; e = ex_meta(d, it['exercise']['id'])
            if e is None: bad(f"unknown exercise {it['exercise']['id']}"); continue
            if not rx.get('display'): bad(f"no display for {e['id']}")
            # soreness hard constraint (explicit-Target override excepted)
            sore = set(ctx.sore_muscles) - set(w['soreness']['trained_anyway'])
            if sore and (set(e['prim']) & sore or {N.MUSCLE_PARENT.get(m, m) for m in e['prim']} & sore):
                if not (d == 'strength' and any(a.get('reason_code') == 'sore_override_by_explicit_target' for a in w['adjustments'])):
                    bad(f"sore primary {e['id']} {sorted(set(e['prim']) & sore)}")
            # Direction identity
            if d == 'strength':
                if e['mod'] not in ('resistance', 'bodyweight'): bad(f"strength modality {e['id']} {e['mod']}")
                if rx['kind'] == 'reps' and rx['rir'] is None: bad(f"strength reps without RIR {e['id']}")
            if d == 'athletic':
                if e['eq'] == 'treadmill': bad('treadmill in Athletic')
                if (rx.get('distance_m') or 0) > 10 and AG.quality(e) in ('acceleration', 'sled', 'decel'): bad(f"acceleration > 10 m {e['id']}")
                if it['role'] in ('px', 'sx', 'sx2') and not it['quality_stop']: bad(f"no quality-stop cue {e['id']}")
            if d == 'sweat' and rx['kind'] == 'reps' and rx.get('reps') and e['role'].startswith('resistance') and rx['reps'] > 20: bad('SC2 rep ceiling')
    # State behavior stays Direction-specific (spot invariants from each frozen contract)
    structs = {b['structure'] for b in w['blocks']}; st_ = set(ctx.states)
    if d == 'strength':
        if 'low_energy' in st_ and structs - {'straight'}: bad(f'Strength Low Energy structures {structs}')
        if 'stressed' in st_ and structs & {'circuit', 'pyramid', 'ladder'}: bad(f'Strength Stressed structures {structs}')
        if not st_ - {'sore'} and ctx.duration == 60 and structs != {'straight'}: bad(f'Strength Normal 60 structures {structs}')
        if ctx.experience == 'beginner' and 'circuit' in structs: bad('Strength beginner circuit')
    if d == 'sweat' and 'low_energy' in st_ and any(b['type'] == 'finisher' for b in w['blocks']): bad('Sweat Low Energy finisher')
    if d == 'athletic':
        roles = [it['role'] for b in w['blocks'] for it in b['items']]
        if 'qc' in roles and ('low_energy' in st_ or ctx.experience == 'beginner' or ctx.duration == 30): bad('Athletic QC where frozen rules forbid it')
        if ctx.duration == 30 and 'sx2' in roles: bad('Athletic 30 with third exposure')
    if d == 'athletic':
        wu = w['warmup']['items']
        if not 2 <= len(wu) <= 4: bad(f'athletic warm-up {len(wu)} items')
        if any(it['role'] not in ('px', 'sx', 'sx2', 'qc', 'ps') for b in w['blocks'] for it in b['items']): bad('athletic trunk / unknown slot')
    # explanations
    lines = [l['text'] for l in w['built_for_today']]
    for t in lines:
        if explain.lint(t): bad(f'banned word in explanation: {t}')
    if len(lines) > 5: bad('too many explanation lines')
    for s in ctx.states:
        if s == 'sore': continue
        if not any(l['code'] in ('state_' + s, 'state_pair') for l in w['built_for_today']): bad(f'no explanation for State {s}')
    if ctx.sore_regions and not any(l['code'].startswith('sore') for l in w['built_for_today']): bad('no soreness explanation')
    # duration honesty
    est = w['duration']['estimated_minutes']; cap = {('strength', 60): 60, ('strength', 30): 35, ('sweat', 60): 56, ('sweat', 30): 30, ('athletic', 60): 55, ('athletic', 30): 30}[(d, ctx.duration)]
    if est > cap: bad(f'estimated {est} min over {cap}')
    if w['outcome'] if False else env['outcome'] == 'rerouted' and not w['requested_archetype']: bad('reroute without requested archetype')

def composition_ids(env):
    return sorted(it['exercise']['id'] for b in env['workout']['blocks'] for it in b['items'])

def engine_ids(direction, state_env_raw):
    return None

def run(out_path=None):
    R = {}; t0 = time.time(); fails = []
    # ------------------------------------------------------------------ A grid
    grid = Counter(); outcomes = defaultdict(Counter); conflicts = defaultdict(Counter); n = 0; relax = Counter(); est = defaultdict(list)
    for d in ('strength', 'sweat', 'athletic'):
        for tgt, st, dur, exp, eq in itertools.product(TARGETS[d], STATE_SETS, (30, 60), EXPS, EQUIP):
            raw = dict(direction=d, states=[s for s in st if s != 'sore'], duration=dur, experience=exp, equipment=eq, date='2026-10-01', **tgt)
            if 'sore' in st: raw['soreness'] = SORE_FOR_STATE[d]
            try:
                env, state = S.generate_workout(raw, f'grid{n % 7}')
            except Exception as ex:
                fails.append(dict(tag='A', input=raw, fail=f'EXCEPTION {type(ex).__name__}: {ex}')); continue
            n += 1; grid[d] += 1
            outcomes[d][env['outcome']] += 1
            if env['status'] == 'conflict':
                conflicts[d][f"{env['conflict']['code']} | {eq}"] += 1
                if not tgt and 'sore' not in st: fails.append(dict(tag='A', input=raw, fail="MOOD's Pick conflict without soreness"))
            else:
                for r_ in env['workout']['relaxations']: relax[f'{d}:{r_}'] += 1
                est[f"{d} {dur} {exp}"].append(env['workout']['duration']['estimated_minutes'])
            check_envelope(env, raw, fails, 'A')
            if env['status'] == 'ok' and composition_ids(env) != sorted(state['history_record']['exercise_ids']):
                fails.append(dict(tag='A', input=raw, fail='formatter changed composition'))
    R['A_grid'] = dict(builds=n, by_direction=dict(grid), outcomes={k: dict(v) for k, v in outcomes.items()}, conflicts={k: dict(v) for k, v in conflicts.items()},
                       relaxations=dict(relax), estimated_minutes={k: dict(min=min(v), mean=round(sum(v) / len(v), 1), max=max(v)) for k, v in sorted(est.items())},
                       failures=len([f for f in fails if f['tag'] == 'A']))
    # commercial gym must never conflict except the designed soreness cases
    R['A_commercial_unexpected_conflicts'] = sum(v for d_, c in conflicts.items() for k, v in c.items() if k.endswith('commercial_gym') and not k.startswith('sore_target_conflict'))
    # ------------------------------------------------------------------ B history
    hist_out = {}
    for d, reqs in (('strength', [dict()]), ('sweat', [dict()]), ('athletic', [dict()]), ('strength', [dict(archetype='strength_upper_push')])):
        H = []; P = []; seq = []
        for day in range(8):
            raw = dict(direction=d, duration=60, date=f'2026-10-{day + 1:02d}', **reqs[0])
            env, state = S.generate_workout(raw, 'hist_user', H, P)
            if env['status'] != 'ok': fails.append(dict(tag='B', input=raw, fail='history build failed')); break
            check_envelope(env, raw, fails, 'B')
            w = env['workout']; seq.append((w['archetype']['id'], [it['exercise']['id'] for b in w['blocks'] for it in b['items']]))
            H.append(dict(state['history_record'], completed_at=raw['date']))
            P.append(dict(completed_at=raw['date'], entries={}))
        key = f"{d}:{reqs[0].get('archetype', 'moods_pick')}"
        overlaps = [len(set(seq[i][1]) & set(seq[i - 1][1])) / max(1, len(seq[i][1])) for i in range(1, len(seq))]
        hist_out[key] = dict(archetypes=[a for a, _ in seq], primaries=[ids[0] for _, ids in seq], mean_overlap_with_previous=round(sum(overlaps) / len(overlaps), 2),
                             distinct_exercises=len({x for _, ids in seq for x in ids}))
    R['B_history'] = hist_out
    # ------------------------------------------------------------------ C swaps
    sw = Counter(); sw_fail = []
    samples = [dict(direction='strength', archetype=a) for a in N.ARCHETYPES['strength'] if a != 'strength_custom_target'] + \
              [dict(direction='strength', target=['shoulders']), dict(direction='strength', states=['amped']), dict(direction='strength', states=['irritated']),
               dict(direction='strength', states=['bored', 'stressed'], archetype='strength_upper_mixed'),
               dict(direction='sweat', archetype='sweat_engine'), dict(direction='sweat', archetype='sweat_circuit'), dict(direction='sweat', archetype='sweat_hybrid'),
               dict(direction='sweat', states=['amped']), dict(direction='sweat', target=['chest', 'triceps'], duration=30),
               dict(direction='athletic', archetype='athletic_power'), dict(direction='athletic', archetype='athletic_speed_agility'),
               dict(direction='athletic', archetype='athletic_full_body', experience='advanced', states=['amped']), dict(direction='athletic', experience='beginner'),
               dict(direction='strength', soreness=['chest'], archetype='strength_upper_pull'), dict(direction='sweat', soreness=['legs']),
               dict(direction='athletic', soreness=['legs'])]
    for raw in samples:
        raw = dict(raw, date='2026-10-01')
        env, state = S.generate_workout(raw, 'swapper')
        if env['status'] != 'ok': sw_fail.append(dict(input=raw, fail='base conflict')); continue
        d = env['workout']['direction']; arch = env['workout']['archetype']['id']
        for b in env['workout']['blocks']:
            for it in b['items']:
                env2, st2 = S.swap_exercise(state, env, it['item_id'])
                if env2['status'] == 'conflict':
                    sw['no_alternative' if env2['conflict']['code'] == 'no_alternative' else 'other_conflict'] += 1
                    if env2['conflict']['code'] != 'no_alternative': sw_fail.append(dict(input=raw, item=it['item_id'], fail=env2['conflict']))
                    continue
                w2 = env2['workout']
                new = next((x for bb in w2['blocks'] for x in bb['items'] if x['exercise']['id'] == env2['workout']['swapped_item']['to']), None)
                checks = []
                checks.append(('same_direction', w2['direction'] == d)); checks.append(('same_archetype', w2['archetype']['id'] == arch))
                checks.append(('changed', env2['workout']['swapped_item']['to'] not in (None, it['exercise']['id'])))
                checks.append(('new_present', new is not None))
                if new is not None:
                    if d == 'strength': checks.append(('same_slot', new['slot_id'] == it['slot_id']))
                    if d == 'athletic': checks.append(('same_slot', new['role'] == it['role']))
                    if d == 'sweat':
                        eo, en = SG.EX[it['exercise']['id']], SG.EX[new['exercise']['id']]
                        checks.append(('same_role', eo['role'] == en['role']))
                    if d == 'strength' and it['prescription']['direction_fields'].get('slot_class') == 'primary_compound':
                        checks.append(('primary_stays_compound', SA.EX[new['exercise']['id']]['cls'] != 'isolation'))
                check_envelope(env2, raw, fails, 'C')
                bad = [c for c, ok in checks if not ok]
                if bad: sw_fail.append(dict(input=raw, item=it['item_id'], fail=bad))
                else: sw['ok'] += 1
                # swap the same item again: must not return to the first exercise
                if st2:
                    it2 = next(x for bb in w2['blocks'] for x in bb['items'] if x['item_id'] == it['item_id'])
                    env3, _ = S.swap_exercise(st2, env2, it2['item_id'])
                    if env3['status'] == 'ok':
                        if env3['workout']['swapped_item']['to'] == it['exercise']['id']: sw_fail.append(dict(input=raw, item=it['item_id'], fail='second swap returned the original'))
                        else: sw['second_swap_ok'] += 1
        # Swap Workout chain
        e1, s1 = S.swap_workout(state, env)
        if e1['status'] == 'ok':
            e2, s2 = S.swap_workout(s1, e1)
            check_envelope(e1, raw, fails, 'C');
            if e2['status'] == 'ok': check_envelope(e2, raw, fails, 'C')
            sw['swap_workout_ok'] += 1
            if composition_ids(e1) == composition_ids(env) and d != 'athletic': sw['swap_workout_identical'] += 1
            if d == 'strength' and raw.get('archetype') and e1['workout']['archetype']['id'] != env['workout']['archetype']['id']: sw_fail.append(dict(input=raw, fail='swap workout changed Strength archetype'))
    R['C_swaps'] = dict(counts=dict(sw), failures=sw_fail)
    # ------------------------------------------------------------------ D conflicts (designed outcomes)
    D = {}
    def outcome(raw):
        env, _ = S.generate_workout(dict(raw, date='2026-10-01'), 'conf'); return env
    cases = {
        'athletic_speed_sore_legs': (dict(direction='athletic', archetype='athletic_speed_agility', soreness=['legs']), 'conflict:sore_target_conflict'),
        'athletic_pick_sore_legs_reroutes': (dict(direction='athletic', soreness=['legs']), 'ok'),
        'athletic_bodyweight_sore_legs': (dict(direction='athletic', soreness=['legs'], equipment='minimal'), 'conflict:equipment_insufficient'),
        'strength_pick_sore_quads_reroutes': (dict(direction='strength', archetype=None, soreness=['quads'], goal='build_strength'), 'rerouted'),
        'strength_explicit_chest_sore_chest_trains': (dict(direction='strength', target=['chest'], soreness=['chest']), 'ok'),
        'strength_explicit_back_sore_arms_shoulders': (dict(direction='strength', target=['back', 'biceps'], soreness=['arms', 'shoulders', 'lower_back']), 'any'),
        'sweat_engine_sore_legs': (dict(direction='sweat', archetype='sweat_engine', soreness=['legs']), 'any'),
        'sweat_hybrid_minimal': (dict(direction='sweat', archetype='sweat_hybrid', equipment='minimal'), 'conflict:equipment_insufficient'),
        'strength_minimal_full_body': (dict(direction='strength', archetype='strength_full_body', equipment='minimal'), 'any'),
        'invalid_duration_45': (dict(direction='strength', duration=45), 'input_error'),
        'four_states': (dict(direction='strength', states=['bored', 'stressed', 'amped', 'irritated']), 'input_error'),
        'athletic_muscle_target': (dict(direction='athletic', target=['chest']), 'input_error'),
    }
    for k, (raw, exp) in cases.items():
        try:
            env = outcome(raw)
            got = 'conflict:' + env['conflict']['code'] if env['status'] == 'conflict' else ('rerouted' if env['outcome'] == 'rerouted' else 'ok')
            D[k] = dict(expected=exp, got=got, detail=(env['conflict']['message'] if env['status'] == 'conflict' else
                                                      f"{env['workout']['archetype']['name']} ({env['outcome']}); " + ' | '.join(l['text'] for l in env['workout']['built_for_today'])),
                        options=[o['label'] for o in env['conflict']['options']] if env['status'] == 'conflict' else None)
        except N.InputError as e:
            got = 'input_error'; D[k] = dict(expected=exp, got=got, detail=e.message)
        ok = exp == 'any' or got == exp or (exp == 'ok' and got in ('ok', 'rerouted')) or (exp == 'rerouted' and got == 'rerouted')
        D[k]['pass'] = ok
        if not ok: fails.append(dict(tag='D', input=raw, fail=f'expected {exp} got {got}'))
    R['D_conflicts'] = D
    # ------------------------------------------------------------------ E progression
    E = {}
    env, st = S.generate_workout(dict(direction='strength', archetype='strength_lower_squat', date='2026-10-01'), 'prog')
    items = [it for b in env['workout']['blocks'] for it in b['items']]
    main = items[0]; reps = int(main['prescription']['reps'])
    from ..progression import entries_from_performance
    perf_hit = entries_from_performance(env['workout'], [dict(item_id=main['item_id'], sets=[dict(reps=reps, load=100, unit='kg')] * main['prescription']['sets'])])
    perf_miss = entries_from_performance(env['workout'], [dict(item_id=main['item_id'], sets=[dict(reps=reps, load=100, unit='kg'), dict(reps=reps - 2, load=100, unit='kg')])])
    H = [dict(st['history_record'], completed_at='2026-10-01')]
    e_hit, _ = S.generate_workout(dict(direction='strength', archetype='strength_lower_squat', date='2026-10-04'), 'prog', H, [dict(completed_at='2026-10-01', entries=perf_hit)])
    e_miss, _ = S.generate_workout(dict(direction='strength', archetype='strength_lower_squat', date='2026-10-04'), 'prog', H, [dict(completed_at='2026-10-01', entries=perf_miss)])
    e_le, _ = S.generate_workout(dict(direction='strength', archetype='strength_lower_squat', states=['low_energy'], date='2026-10-04'), 'prog', H, [dict(completed_at='2026-10-01', entries=perf_hit)])
    def prog_of(e, eid): return next((it['progression'] for b in e['workout']['blocks'] for it in b['items'] if it['exercise']['id'] == eid), 'absent')
    E['strength_hit_all_reps'] = prog_of(e_hit, main['exercise']['id'])
    E['strength_missed_reps'] = prog_of(e_miss, main['exercise']['id'])
    E['strength_low_energy_today'] = prog_of(e_le, main['exercise']['id'])
    E['strength_unseen_exercise_has_no_load'] = all(it['progression'] is None for b in e_hit['workout']['blocks'] for it in b['items'] if it['exercise']['id'] != main['exercise']['id'])
    ok = (isinstance(E['strength_hit_all_reps'], dict) and E['strength_hit_all_reps']['suggestion'] and E['strength_hit_all_reps']['suggestion']['action'] == 'increase'
          and E['strength_missed_reps']['suggestion']['action'] == 'hold' and (E['strength_low_energy_today'] == 'absent' or E['strength_low_energy_today']['suggestion']['action'] == 'hold')
          and E['strength_unseen_exercise_has_no_load'])
    # Sweat: resistance load reused, never progressed; Athletic loaded exposure: reference only
    sw_env, sw_st = S.generate_workout(dict(direction='sweat', archetype='sweat_circuit', date='2026-10-01'), 'prog2')
    res_items = [it for b in sw_env['workout']['blocks'] for it in b['items'] if it['prescription']['direction_fields'].get('progression') == 'reuse_load']
    if res_items:
        pe = entries_from_performance(sw_env['workout'], [dict(item_id=res_items[0]['item_id'], sets=[dict(reps=12, load=16, unit='kg')] * 3)])
        e2, _ = S.generate_workout(dict(direction='sweat', archetype='sweat_circuit', date='2026-10-01'), 'prog2', [], [dict(completed_at='x', entries=pe)])
        E['sweat_resistance'] = prog_of(e2, res_items[0]['exercise']['id'])
        ok = ok and (E['sweat_resistance'] == 'absent' or E['sweat_resistance']['suggestion'] is None)
    E['pass'] = bool(ok)
    if not ok: fails.append(dict(tag='E', fail='progression rules'))
    R['E_progression'] = E
    # ------------------------------------------------------------------ F negative (validators still catch bad workouts)
    F_ = {}
    env, st = S.generate_workout(dict(direction='strength', archetype='strength_upper_push', date='2026-10-01'), 'neg')
    nctx = S.engine_ctx(N.normalize(dict(direction='strength', archetype='strength_upper_push', date='2026-10-01'), 'neg'))
    res = SA.build(nctx, [])
    sc = SA._sc(nctx, [], 0)
    bad = dict(outcome='VALID BUILD', archetype=res['archetype'], requested=res['archetype'], workout=dict(res['W'], primary_press='barbell_back_squat'), log=[])
    F_['strength_wrong_slot_exercise_caught'] = bool(SA._validate(bad, res['archetype'], sc, 60, SA.ctx_for(res['archetype']), res['rows'], res['st_blocks']))
    sc_sore = dict(sc, sore={'chest'})
    F_['strength_sore_primary_caught'] = bool(SA._validate(dict(bad, workout=res['W']), res['archetype'], sc_sore, 60, SA.ctx_for(res['archetype']), res['rows'], res['st_blocks']))
    w = SG.generate(dict(duration=60, experience='intermediate')); w2 = copy.deepcopy(w); w2['blocks'][0]['round_rest'] = 600
    F_['sweat_long_passive_rest_caught'] = any(not ok and not n_.startswith('SOFT') for n_, ok, _ in SV.validate(w2))
    w3 = copy.deepcopy(w); w3['blocks'] = w3['blocks'][::-1]
    F_['sweat_primary_not_first_caught'] = any(not ok for n_, ok, _ in SV.validate(w3))
    aw = AG.build('athletic_power', 'intermediate', 60, 'athletic_commercial_default', [], set(), seed='neg')
    aw2 = copy.deepcopy(aw); aw2['items'][0] = dict(aw2['items'][0], reps=12, rest=30)
    F_['athletic_type_a_overdose_caught'] = bool(AA.recheck(aw2, dict(equipment='athletic_commercial_default', duration=60, experience='intermediate', states=[], sore=set()))['fails'])
    aw3 = copy.deepcopy(aw); aw3['items'][0] = dict(aw3['items'][0], id='treadmill_run') if 'treadmill_run' in AG.EX else aw3['items'][0]
    F_['athletic_treadmill_caught'] = bool(AA.recheck(aw3, dict(equipment='athletic_commercial_default', duration=60, experience='intermediate', states=[], sore=set()))['fails'])
    F_['pass'] = all(v for k, v in F_.items() if k != 'pass')
    if not F_['pass']: fails.append(dict(tag='F', fail=F_))
    R['F_negative'] = F_
    # ------------------------------------------------------------------ G determinism
    G_ = []
    for raw in [dict(direction='strength', states=['bored']), dict(direction='sweat', states=['irritated', 'low_energy']), dict(direction='athletic', states=['amped'])]:
        raw['date'] = '2026-10-01'
        a, _ = S.generate_workout(raw, 'det', workout_id='x'); b, _ = S.generate_workout(raw, 'det', workout_id='x')
        for e_ in (a, b): e_['workout']['created_at'] = None
        G_.append(json.dumps(a, sort_keys=True, default=str) == json.dumps(b, sort_keys=True, default=str))
    R['G_determinism'] = dict(identical=sum(G_), cases=len(G_))
    if not all(G_): fails.append(dict(tag='G', fail='non-deterministic'))
    R['failures'] = fails[:3000]; R['failure_count'] = len(fails)
    R['all_green'] = not fails; R['seconds'] = round(time.time() - t0, 1)
    if out_path: json.dump(R, open(out_path, 'w'), indent=1, default=str)
    return R

if __name__ == '__main__':
    R = run(sys.argv[1] if len(sys.argv) > 1 else None)
    print(json.dumps({k: v for k, v in R.items() if k not in ('failures',)}, indent=1, default=str)[:6000])
    print('FAILURES', R['failure_count'])
    for f in R['failures'][:40]: print(' ', json.dumps(f, default=str)[:400])
