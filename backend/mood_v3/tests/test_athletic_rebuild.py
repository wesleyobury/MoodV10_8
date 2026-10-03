"""V3 Athletic rebuild: the programming invariants that define Athletic (quality and intent over fatigue)."""
import itertools
import pytest
from mood_v3 import service as S, normalize as N
from mood_v3.engines.athletic import athletic_core as C, athletic_validate as V

SORE = {'legs': {'quads', 'hamstrings', 'glutes', 'calves'}, 'shoulders': {'shoulders', 'front_delts', 'side_delts', 'rear_delts'}, 'lower_back': {'spinal_erectors'}}


def nctx(**kw):
    return dict(direction='athletic', states=kw.get('states', []), duration=kw.get('dur', 60), experience=kw.get('lv', 'intermediate'), goal=kw.get('goal', 'stay_consistent'),
                equipment=kw.get('eq', 'athletic_commercial_default'), sore=SORE.get(kw.get('sore'), set()), target_mode=kw.get('tm', 'moods_pick'),
                target_muscles=tuple(kw.get('target', ())), archetype=kw.get('arch'), user=kw.get('user', 'u'), date=kw.get('date', '2026-10-01'))


GRID = list(itertools.product(['beginner', 'intermediate', 'advanced'], [30, 60], ['athletic_commercial_default', 'free_weight_limited'],
                              [[], ['low_energy'], ['bored'], ['irritated'], ['amped'], ['stressed'], ['low_energy', 'amped'], ['bored', 'stressed']],
                              [None, 'athletic_power', 'athletic_speed_agility', 'athletic_full_body']))


def _all():
    for lv, dur, eq, st, arch in GRID:
        yield (lv, dur, eq, st, arch), C.generate(nctx(lv=lv, dur=dur, eq=eq, states=st, arch=arch), [])


def test_validator_green_and_invariants_on_grid():
    bad = []
    for key, o in _all():
        lv, dur, eq, st, arch = key
        f = V.fails(o['sess'], o['wu'], o['ctx'], st)
        if f: bad.append((key, f)); continue
        blocks = o['sess']['blocks']; its = [x for b in blocks for x in b['items']]
        # power first, never under fatigue
        assert blocks[0]['role'] == 'primary' or (blocks[0]['role'] == 'primer' and blocks[1]['role'] == 'primary'), key   # sequencing pass: optional Primer
        seen_strength = False
        for b in blocks:
            if b['role'] in ('strength', 'support', 'finisher'): seen_strength = True
            if b['role'] in ('primary', 'secondary', 'tertiary'): assert not seen_strength, key
        # low-rep power, never a hypertrophy prescription
        for x in its:
            if x['cls'] == 'power': assert x['reps'] <= (10 if x['id'] == 'pogo_hop' else 8), (key, x['id'], x['reps'])
        # advanced is not more exercises
        assert len(its) <= (5 if dur == 60 else 3) + (1 if any(b['role'] == 'finisher' for b in blocks) else 0), key
        # beginner: no Olympic lifts or high impact
        if lv == 'beginner': assert not any(x['kind'] in ('olympic', 'drop') or C.EX[x['id']]['impact'] == 'high' for x in its), key
    assert not bad, bad[:5]


def test_state_coherence_rules_hold():
    for key, o in _all():
        lv, dur, eq, st, arch = key; A = o['A']; its = [x for b in o['sess']['blocks'] for x in b['items']]
        if 'low_energy' in st:
            pw = [x for x in its if x['cls'] == 'power']
            assert (A['n_explosive'] <= 1 or (A['n_explosive'] == 2 and any(x['kind'] in C.THROW_KINDS for x in pw))) and not A['finisher'] and A['olympic_sets'] == 0, key
        if 'stressed' in st:
            assert not any(x['kind'] in ('drop', 'elastic') for x in its) and o['sess']['structure'] != 'contrast', key
        if 'irritated' in st:
            assert all(C.EX[x['id']]['cx'] <= 3 for x in its), key
        if st in (['amped'], ['irritated']):
            assert not A['finisher'], key                                    # Amped / Irritated never earn a finisher
            ref = o['ref']      # the same candidate and seed built without States
            if ref:   # same amount of strength / support work; Amped may add at most one small athletic element (richer composition), never volume elsewhere
                # final pre-launch pass: a session with 3 athletic movements carries a second strength support (4 -> 1), so strength may
                # differ from the same-seed reference only when the athletic count does, and the total session never grows by more than one item
                extra_st = 3 if A['n_explosive'] < ref['n_explosive'] else 0
                assert A['n_items'] <= ref['n_items'] + 1 and A['strength_sets'] <= ref['strength_sets'] + extra_st and A['support_sets'] <= ref['support_sets'] + 3, key
                assert A['explosive_sets'] <= C.limits(lv, dur)['explosive_sets'], key


def test_state_gate_rate():
    tot = ok = 0
    for key, o in _all():
        for s, v in o['verdict'].items():
            tot += 1; ok += bool(v['satisfied'] and v['coherent'])
    assert tot and ok / tot >= 0.95, ok / tot


def test_soreness_reroutes_safely():
    for lv, dur in itertools.product(['beginner', 'intermediate', 'advanced'], [30, 60]):
        o = C.generate(nctx(lv=lv, dur=dur, sore='legs'), [])
        assert o['sess']['pq'] in C.UPPER_Q
        assert not any(x['cls'] == 'power' and x['kind'] in C.JUMP_KINDS | C.SPRINT_KINDS for b in o['sess']['blocks'] for x in b['items'])
        o = C.generate(nctx(lv=lv, dur=dur, sore='lower_back'), [])
        for x in (x for b in o['sess']['blocks'] for x in b['items']):
            assert not (C.STRENGTH.get(x['id']) in ('hinge', 'lower_bilateral') and C.EX[x['id']]['eq'] not in ('bodyweight', 'bands') and x['id'] != 'goblet_squat'), x['id']
            assert x['kind'] not in ('olympic', 'explosive_lift', 'swing', 'landmine_rot'), x['id']
        o = C.generate(nctx(lv=lv, dur=dur, sore='shoulders'), [])
        assert o['sess']['pq'] not in C.UPPER_Q


def test_speed_agility_with_sore_legs_is_a_conflict():
    env, _ = S.generate_workout(dict(direction='athletic', archetype='athletic_speed_agility', soreness=['legs'], date='2026-10-01'), 'u')
    assert env['status'] == 'conflict' and env['conflict']['code'] == 'sore_target_conflict'


def test_target_shapes_support_not_identity():
    env, _ = S.generate_workout(dict(direction='athletic', target=['chest', 'triceps'], date='2026-10-01'), 'u')
    w = env['workout']; assert env['status'] == 'ok'
    assert w['athletic']['primary_quality'] in C.QUALITY_LABEL
    assert w['blocks'][0]['type'] == 'primary'
    prim_muscles = {m for b in w['blocks'] for it in b['items'] for m in it['exercise']['primary_muscles']}
    assert prim_muscles & {'chest', 'triceps'}
    with pytest.raises(N.InputError):
        N.normalize(dict(direction='athletic', target=['chest'], archetype='athletic_power'), 'u')


def test_history_rotates_primary_quality_and_exercise():
    hist = []; seen_q = []; seen_p = []
    for k in range(5):
        env, st = S.generate_workout(dict(direction='athletic', experience='intermediate', duration=60, date=f'2026-10-{k + 1:02d}'), 'hist_user', hist)
        seen_q.append(env['workout']['athletic']['primary_quality']); seen_p.append(env['workout']['blocks'][0]['items'][-1]['exercise']['id'])
        hist.append(st['history_record'])
    assert len(set(seen_q)) >= 3 and len(set(seen_p)) >= 4
    assert all(a != b for a, b in zip(seen_p, seen_p[1:]))


def test_different_workout_changes_quality_or_primary():
    for raw in (dict(direction='athletic'), dict(direction='athletic', archetype='athletic_power'), dict(direction='athletic', target=['quads', 'glutes'])):
        env, st = S.generate_workout(dict(raw, date='2026-10-01'), 'dw')
        env2, st2 = S.swap_workout(st, env)
        a, b = env['workout'], env2['workout']
        assert (a['athletic']['primary_quality'], a['blocks'][0]['items'][-1]['exercise']['id']) != (b['athletic']['primary_quality'], b['blocks'][0]['items'][-1]['exercise']['id'])
        if raw.get('archetype'): assert b['archetype']['id'] == raw['archetype']


def test_swap_preserves_role_quality_and_pattern():
    env, st = S.generate_workout(dict(direction='athletic', experience='advanced', duration=60, date='2026-10-01'), 'sw')
    for b in env['workout']['blocks']:
        for it in b['items']:
            e2, s2 = S.swap_exercise(st, env, it['item_id'])
            if e2['status'] != 'ok': assert e2['conflict']['code'] == 'no_alternative'; continue
            new = next(x for bb in e2['workout']['blocks'] for x in bb['items'] if x['item_id'] == it['item_id'])
            assert new['exercise']['id'] != it['exercise']['id'] and new['role'] == it['role']
            df0, df1 = it['prescription']['direction_fields'], new['prescription']['direction_fields']
            assert df0['type'] == df1['type']
            if df0['type'] == 'power':
                from mood_v3.engines.athletic.adapter import KIND_GROUP
                if it.get('role') not in ('secondary', 'tertiary'):   # a further athletic element may become another element of the same or lower cost tier
                    assert KIND_GROUP[df0['kind']] == KIND_GROUP[df1['kind']], (df0['kind'], df1['kind'])
                else: assert 'ABC'.index(df1['cost_tier']) >= 'ABC'.index(df0['cost_tier'])
                assert {'low': 0, 'moderate': 1, 'high': 2}[df1['impact']] <= {'low': 0, 'moderate': 1, 'high': 2}[df0['impact']]
            assert new['prescription']['sets'] == it['prescription']['sets']


def test_determinism():
    raw = dict(direction='athletic', states=['amped'], experience='advanced', date='2026-10-01')
    a, _ = S.generate_workout(raw, 'det'); b, _ = S.generate_workout(raw, 'det')
    strip = lambda e: [(bl['title'], [(i['exercise']['id'], i['prescription']['display']) for i in bl['items']]) for bl in e['workout']['blocks']]
    assert strip(a) == strip(b)


def test_built_for_today_claims_map_to_realized_changes():
    for st in (['low_energy'], ['amped'], ['irritated'], ['stressed'], ['bored'], ['low_energy', 'amped']):
        env, _ = S.generate_workout(dict(direction='athletic', states=st, date='2026-10-01'), 'bft')
        line = next(l for l in env['workout']['built_for_today'] if l['code'] in ('state_' + st[0], 'state_pair'))
        kinds = {tuple(c) for c in line.get('claims') or []}
        realized = env['workout']['athletic']['realized']
        for c in kinds:
            if c[0] == 'state' and c[2] != 'limited': assert realized.get(c[1]), (st, c)


DRILLS = {'sprint_to_stick', 'backpedal_to_stick', 'lateral_shuffle_stick', 'short_shuttle', 'pro_agility_shuttle', 'cut_and_go', 'carioca', 'crossover_sprint',
          'shuffle_crossover_sprint', 'dot_drill', 'line_hops', 'high_knees'}


def test_no_agility_or_footwork_drills_anywhere():
    assert 'change_of_direction' not in C.QUALITY_LABEL and 'agility_strength' not in C.STRUCTURE_LABEL
    assert not DRILLS & set(C.POWER)
    for key, o in _all():
        ids = {x['id'] for b in o['sess']['blocks'] for x in b['items']} | {i for _, i, *_ in o['wu']}
        assert not ids & DRILLS, (key, ids & DRILLS)


OLY = {'hang_power_clean', 'power_snatch', 'split_jerk', 'push_press', 'hang_high_pull', 'db_hang_power_clean', 'db_snatch', 'kb_snatch', 'hang_clean_to_box_knee_drive'}


def test_olympic_representation_and_rules():
    n = {'beginner': [0, 0], 'intermediate': [0, 0], 'advanced': [0, 0]}
    for lv, goal, k in itertools.product(['beginner', 'intermediate', 'advanced'], ['improve_athleticism', 'build_strength', 'stay_consistent'], range(25)):
        o = C.generate(nctx(lv=lv, goal=goal, user=f'oly{k}'), [])
        its = [x for b in o['sess']['blocks'] for x in b['items']]
        oly = [x for x in its if x['id'] in OLY]
        n[lv][0] += 1; n[lv][1] += bool(oly)
        for x in oly:
            assert any(b['role'] in ('primary', 'secondary', 'tertiary') and x in b['items'] for b in o['sess']['blocks'])   # fresh: before any strength work
            if x['kind'] == 'olympic': assert o['sess']['blocks'][0]['items'][-1]['id'] == x['id']                          # barbell Olympic lifts lead the session
            assert x['reps'] <= 3 and x['rest'] >= 90
        assert o['A']['n_explosive'] <= 4
    assert n['beginner'][1] == 0
    assert 0.10 <= n['intermediate'][1] / n['intermediate'][0] <= 0.45, n
    assert 0.20 <= n['advanced'][1] / n['advanced'][0] <= 0.60, n
    for st in (['low_energy'], ['low_energy', 'amped']):
        for k in range(20):
            o = C.generate(nctx(lv='advanced', goal='build_strength', states=st, user=f'le{k}'), [])
            assert not any(x['id'] in OLY for b in o['sess']['blocks'] for x in b['items'])


def test_identity_athletic_movements_dominate():
    """Identity pass: athletic movements (by exercise identity) are the bulk of a 60-minute session; strength is support."""
    from collections import defaultdict
    per = defaultdict(list)
    CARRY = {'farmer_carry', 'suitcase_carry', 'front_rack_carry', 'overhead_carry'}
    for lv in ('beginner', 'intermediate', 'advanced'):
        for goal in ('improve_athleticism', 'build_strength', 'build_muscle', 'stay_consistent', 'lose_weight_conditioning'):
            for u in range(8):
                env, _ = S.generate_workout(dict(direction='athletic', experience=lv, duration=60, goal=goal, states=[], date='2026-10-12'), f'idn{u}')
                its = [it for b in env['workout']['blocks'] for it in b['items']]
                cat = [it['prescription']['direction_fields']['category'] for it in its]
                a = cat.count('ATHLETIC'); per[lv].append(a)
                assert a >= len(cat) - a, (lv, goal, cat)                      # strength + support never outnumber athletic work
                assert not {it['exercise']['id'] for it in its} & CARRY          # no carries in Athletic
                for it, c in zip(its, cat):                                     # a normal strength exercise is never counted as athletic
                    if it['exercise']['id'] in C.STRENGTH: assert c != 'ATHLETIC', it['exercise']['id']
                if lv == 'beginner': assert a <= 3 and not any(it['exercise']['id'] in OLY for it in its)
    mean = {lv: sum(v) / len(v) for lv, v in per.items()}
    assert 2.0 <= mean['beginner'] <= 2.6 and mean['intermediate'] >= 2.7 and mean['advanced'] >= 3.0, mean
    assert sum(a >= 4 for a in per['advanced']) / len(per['advanced']) >= 0.2, per['advanced']
