"""Athletic final pre-launch trainer pass: composition, loaded power, archetype identity, strength-form variety, performance
roles and the Athletic Trainer Coherence Gate, on real production-path workouts."""
import collections, itertools
from mood_v3 import service as S
from mood_v3.engines.athletic import athletic_core as C, trainer_gate as TG
from mood_v3.qa import athletic_prelaunch_qa as Q

LV2 = ('intermediate', 'advanced')


def _build(raw, key):
    env, _ = S.generate_workout(dict(direction='athletic', equipment='commercial_gym', goal='improve_athleticism', **raw), key)
    assert env['status'] == 'ok', (raw, env.get('conflict'))
    return env['workout']


def _facts(raw, key):
    r = dict(direction='athletic', equipment='commercial_gym', goal='improve_athleticism', **raw)
    env, _ = S.generate_workout(r, key)
    return env, Q.facts(r, env)


def test_power_always_carries_loaded_power_for_trained_lifters():
    for lv, dur, day in itertools.product(LV2, (30, 60), ('2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08')):
        for st in ([], ['amped'], ['bored'], ['irritated'], ['stressed']):
            env, f = _facts(dict(experience=lv, duration=dur, archetype='athletic_power', states=st, date=day), f'p{lv}{dur}{day}{st}')
            assert f['n_loaded'] >= 1 and any(C.is_major_loaded(i) for i in f['ids']), (lv, dur, st, f['ids'])


def test_normal_trained_60_minute_sessions_are_athletic_first():
    for arch, lv, day in itertools.product(('athletic_power', 'athletic_speed_agility', 'athletic_full_body', None), LV2, ('2026-10-05', '2026-10-06', '2026-10-07')):
        raw = dict(experience=lv, duration=60, date=day, **({'archetype': arch} if arch else {}))
        env, f = _facts(raw, f'a{arch}{lv}{day}')
        assert f['n_ath'] >= 3 and f['n_ab'] >= 2, (raw, f['ids'])
        assert f['n_strength'] < f['n_ath'], (raw, f['ids'])          # strength supports, never defines


def test_archetype_identity():
    for lv, day in itertools.product(LV2, ('2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08')):
        _, f = _facts(dict(experience=lv, duration=60, archetype='athletic_speed_agility', date=day), f's{lv}{day}')
        assert f['n_lower'] >= 2 and f['kinds'][0] in C.SPEED_PLYO_KINDS and f['n_throw'] <= 1, f['ids']
        _, f = _facts(dict(experience=lv, duration=60, archetype='athletic_full_body', date=day), f'f{lv}{day}')
        assert f['n_lower'] >= 1 and f['n_upper_rot'] >= 1, f['ids']


def test_strength_support_is_not_a_superset_template():
    forms = collections.Counter()
    for arch, lv, dur, day in itertools.product(('athletic_power', 'athletic_speed_agility', 'athletic_full_body', None), C.LV, (60,), ('2026-10-05', '2026-10-06', '2026-10-07')):
        w = _build(dict(experience=lv, duration=dur, date=day, **({'archetype': arch} if arch else {})), f'g{arch}{lv}{day}')
        for b in w['blocks']:
            if b['type'] != 'strength': continue
            st = [it for it in b['items'] if it['prescription']['direction_fields'].get('category') == 'ATHLETIC_STRENGTH']
            if b['structure'] == 'superset' and len(st) == 2:
                forms['superset'] += 1
                pats = [it['prescription']['direction_fields'].get('pattern') for it in st]
                assert not all(p in C.LOWER_PAT for p in pats), pats               # two leg lifts are never alternated
            else: forms['straight'] += 1
    assert forms['straight'] > 2 * forms['superset'], forms


def test_performance_roles_replace_muscle_labels():
    for arch, lv, day in itertools.product(('athletic_power', 'athletic_speed_agility', 'athletic_full_body'), C.LV, ('2026-10-05', '2026-10-06')):
        w = _build(dict(experience=lv, duration=60, archetype=arch, date=day), f'r{arch}{lv}{day}')
        for b in w['blocks']:
            assert b.get('performance_roles'), b['title']
            for it in b['items']:
                assert it['prescription']['direction_fields'].get('performance_role') in C.PERFORMANCE_ROLES, it['exercise']['id']
    assert C.performance_role(dict(id='landmine_rotational_punch', cls='power')) == 'Rotational Power'
    assert C.performance_role(dict(id='mb_scoop_toss', cls='power')) == 'Total-Body Power'
    assert C.performance_role(dict(id='hang_power_clean', cls='power')) == 'Total-Body Power'
    assert C.performance_role(dict(id='push_press', cls='power')) == 'Upper-Body Power'
    assert C.performance_role(dict(id='trap_bar_jump', cls='power')) == 'Lower-Body Power'
    assert C.performance_role(dict(id='falling_start_sprint', cls='power')) == 'Acceleration'


def test_trainer_gate_clean_on_quick_matrix():
    bad = []; n = 0
    for k, raw in enumerate(Q.cases(quick=True)):
        r, env = Q.build(raw, f'qa{k}')
        if env['status'] != 'ok': continue
        n += 1
        if env['workout']['athletic']['trainer_gate']['issues']: bad.append((raw, env['workout']['athletic']['trainer_gate']['issues']))
    assert n and len(bad) <= 0.01 * n, bad[:5]


def test_gate_catches_an_underpowered_power_session():
    o = C.generate(dict(direction='athletic', states=[], duration=60, experience='advanced', goal='improve_athleticism', equipment='athletic_commercial_default',
                        sore=set(), target_mode='moods_pick', target_muscles=(), archetype='athletic_power', user='g', date='2026-10-05'), [])
    sess = dict(o['sess'], blocks=[b for b in o['sess']['blocks'] if not any(C.is_major_loaded(x['id']) for x in b['items'] if x['cls'] == 'power')])
    if sess['blocks'] and sess['blocks'][0]['role'] == 'primary':
        assert 'power_unloaded' in TG.check(sess, o['ctx'], o['d'])


# ------------------------------------------------------------------ composition pass (sprint frequency, composition variety, athletic support)
def _matrix_facts(levels=('intermediate', 'advanced'), dur=60):
    out = []
    for arch, lv, day in itertools.product(('athletic_power', 'athletic_speed_agility', 'athletic_full_body', None), levels, ['2026-11-%02d' % d for d in range(1, 9)]):
        raw = dict(experience=lv, duration=dur, date=day, **({'archetype': arch} if arch else {}))
        env, f = _facts(raw, f'm{arch}{lv}{day}')
        out.append((raw, env, f))
    return out


def test_sprints_are_a_sprinkle_in_a_standard_gym():
    rows = _matrix_facts()
    n = len(rows); sp = sum(f['n_sprint'] >= 1 for _, _, f in rows)
    assert sp <= 0.2 * n, (sp, n)
    assert all(f['n_sprint'] <= 1 for _, _, f in rows)
    speed = [f for raw, _, f in rows if raw.get('archetype') == 'athletic_speed_agility']
    assert sum(f['n_sprint'] >= 1 for f in speed) <= 0.35 * len(speed)


def test_sprint_space_restores_sprinting():
    o = [C.generate(dict(direction='athletic', states=[], duration=60, experience='advanced', goal='improve_athleticism', equipment='athletic_commercial_default',
                         sore=set(), target_mode='moods_pick', target_muscles=(), archetype='athletic_speed_agility', user=f'sp{k}', date='2026-10-05', sprint_space=sp), [])
         for k in range(30) for sp in (False, True)]
    n_std = sum(any(x['kind'] == 'sprint' for b in g['sess']['blocks'] for x in b['items']) for g in o[0::2])
    n_turf = sum(any(x['kind'] == 'sprint' for b in g['sess']['blocks'] for x in b['items']) for g in o[1::2])
    assert n_turf > n_std


def test_composition_is_not_a_template():
    rows = _matrix_facts()
    lifts = collections.Counter(min(f['n_strength'], 2) for _, _, f in rows)
    n = len(rows)
    for k in (0, 1, 2): assert lifts[k] >= 0.08 * n, lifts            # every shape occurs
    assert max(lifts.values()) <= 0.65 * n, lifts                       # none dominates
    modes = collections.Counter(f['mode'] for _, _, f in rows)
    assert len([m for m in C.MODES if modes[m] >= 0.08 * n]) >= 3, modes


def test_lone_support_lift_leans_athletic():
    rows = _matrix_facts()
    lone = [it['exercise']['id'] for raw, env, f in rows if f['n_strength'] == 1 for b in env['workout']['blocks'] if b['type'] == 'strength'
            for it in b['items'] if it['exercise']['id'] in C.STRENGTH]
    assert lone and sum(i in C.ATHLETIC_LEAN for i in lone) >= 0.8 * len(lone)


def test_athletic_volume_sessions_validate_without_a_lift():
    rows = _matrix_facts()
    vol = [(raw, env) for raw, env, f in rows if f['n_strength'] == 0]
    assert vol
    for raw, env in vol:
        types = [b['type'] for b in env['workout']['blocks']]
        # sequencing pass: trunk work only when the session has no forceful rotational element already; otherwise 4 athletic movements
        n_ath = sum(t in ('primer', 'primary', 'secondary') for t in types)
        assert ('support' in types and n_ath >= 3) or n_ath >= 4, (raw, types)


# ------------------------------------------------------------------ sequencing / presentation pass
def test_sessions_run_in_order_of_performance_demand():
    for raw, env, f in _matrix_facts(levels=('beginner', 'intermediate', 'advanced')):
        w = env['workout']; blocks = w['blocks']
        ath = [b for b in blocks if b['type'] in ('primary', 'secondary')]
        dem = [C.demand(dict(id=b['items'][-1]['exercise']['id'], kind=C.kind_of(b['items'][-1]['exercise']['id']))) for b in ath]
        if raw.get('archetype') != 'athletic_speed_agility' and w['athletic']['structure'] != 'contrast':
            assert dem == sorted(dem), (raw, [b['items'][-1]['exercise']['id'] for b in ath], dem)
        types = [b['type'] for b in blocks]
        if 'primer' in types:
            assert types[0] == 'primer' and types[1] == 'primary'
            px = blocks[0]['items'][0]['prescription']; assert px['sets'] <= 2 and px['reps'] <= 6
            lead = blocks[1]['items'][-1]['exercise']['id']; assert C.is_loaded(lead) or C.kind_of(lead) in C.OLY_KINDS


def test_cart_phases_are_few_and_ordered():
    order = {'primer': 0, 'power': 1, 'strength': 2, 'finish': 3}
    for raw, env, f in _matrix_facts(levels=('beginner', 'intermediate', 'advanced')):
        ph = [b['phase'] for b in env['workout']['blocks']]
        assert ph == sorted(ph, key=order.get), (raw, ph)
        assert len([p for p in dict.fromkeys(ph) if p != 'finish']) <= 3
        assert all(b.get('phase_label') for b in env['workout']['blocks'])


def test_no_passive_core_and_velocity_lifts():
    for raw, env, f in _matrix_facts(levels=('beginner', 'intermediate', 'advanced')):
        for b in env['workout']['blocks']:
            for it in b['items']:
                i = it['exercise']['id']; df = it['prescription']['direction_fields']
                assert i not in ('dead_bug', 'side_plank', 'copenhagen_plank'), (raw, i)
                if df.get('category') == 'ATHLETIC_STRENGTH' and df.get('performance_role') == 'Velocity Strength':
                    assert df.get('context_tag') == 'For velocity' and it['prescription']['reps'] <= 6 and it['prescription']['rir'] >= 2, (raw, i, it['prescription'])
                    assert any(k in (it['prescription']['load_guidance'] or '') for k in ('fast as you can', 'high as you can')), it['prescription']['load_guidance']


def test_athletic_strength_slot_rotates_and_uses_jump_squats():
    lifts = collections.Counter()
    for raw, env, f in _matrix_facts(levels=('intermediate', 'advanced')):
        for b in env['workout']['blocks']:
            if b['type'] != 'strength': continue
            for it in b['items']:
                if it['prescription']['direction_fields'].get('category') == 'ATHLETIC_STRENGTH': lifts[it['exercise']['id']] += 1
    tot = sum(lifts.values())
    assert tot and max(lifts.values()) <= 0.25 * tot, lifts.most_common(5)        # no single lift owns the slot
    assert lifts['trap_bar_jump'] + lifts['db_jump_squat'] >= 0.08 * tot, lifts.most_common(8)
    assert not lifts['trap_bar_deadlift'] and not lifts['barbell_back_squat']
