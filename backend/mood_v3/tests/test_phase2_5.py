"""Phase 2.5 founder refinements: role-weighted Custom Target, Core last, single-muscle routing, Different Workout
(Custom Target variation, protected primary, MOOD's Pick archetype rotation), Sweat Hybrid as one block, Built for Today."""
import pytest
from mood_v3 import service, explain
from mood_v3.engines.strength import audit_engine as AE, adapter as SA
from mood_v3.engines.sweat import sweat_gen as SG

DATE = '2026-10-05'


def gen(**kw):
    env, st = service.generate_workout(dict(dict(duration=60, date=DATE), **kw), 'qa_user')
    assert env['status'] == 'ok', env.get('conflict')
    return env, st


def items(env):
    return [it for b in env['workout']['blocks'] for it in b['items']]


def muscles_of(env):
    """First primary muscle (rolled) of every item, in session order (finishers excluded: a finisher is an optional device, not Target allocation)."""
    return [AE.roll(AE.EX[it['exercise']['id']]['prim'][0]) for b in env['workout']['blocks'] if b['type'] != 'finisher' for it in b['items']]


def sets(env):
    return sum(it['prescription']['sets'] or 0 for it in items(env))


# ------------------------------------------------------------------ Custom Target: single muscle
@pytest.mark.parametrize('m', ['chest', 'back', 'shoulders', 'quads', 'hamstrings', 'glutes', 'calves'])
def test_single_major_is_custom_and_only_that_muscle(m):
    env, _ = gen(direction='strength', target=[m])
    assert env['workout']['archetype']['id'] == 'strength_custom_target'
    assert set(muscles_of(env)) == {m}                       # no unrelated muscles added
    n = len([it for b in env['workout']['blocks'] if b['type'] != 'finisher' for it in b['items']])
    assert n == 4 or (m == 'calves' and n >= 3)              # core rebuild: major target 4 with a compound lead (calves: thin, distinct pool)
    # founder rest audit: rest is no longer used as filler, so a Target session may honestly finish at 45+ (timing.WINDOW[60])
    # final pre-launch pass: the lead is now the most muscle-specific compound (Hip Thrust for Glutes), which can land a little shorter
    assert 42 <= env['workout']['duration']['estimated_minutes'] <= 62 or m == 'calves'


@pytest.mark.parametrize('m', ['biceps', 'triceps'])
def test_single_minor_is_custom_with_four(m):
    env, _ = gen(direction='strength', target=[m])
    assert env['workout']['archetype']['id'] == 'strength_custom_target'
    assert set(muscles_of(env)) == {m} and len([it for b in env['workout']['blocks'] if b['type'] != 'finisher' for it in b['items']]) == 4


def test_removed_routes_documented():
    for m in ('chest', 'back', 'quads', 'hamstrings', 'glutes', 'biceps', 'triceps'):
        assert SA.route_target([m]) == 'strength_custom_target' and m in SA.ROUTING_REMOVED_PHASE_2_5
    assert SA.route_target(['core']) == 'strength_core'


@pytest.mark.parametrize('tgt,aid', [(['chest', 'triceps'], 'strength_upper_push'), (['back', 'biceps'], 'strength_upper_pull'),
                                     (['glutes', 'hamstrings'], 'strength_lower_hinge'), (['quads', 'glutes'], 'strength_glutes_legs')])
def test_multi_muscle_archetype_routes_unchanged(tgt, aid):
    env, _ = gen(direction='strength', target=tgt)
    assert env['workout']['archetype']['id'] == aid


# ------------------------------------------------------------------ Custom Target: allocation + Core
@pytest.mark.parametrize('tgt,dur,expect', [
    (['back', 'core'], 60, {'back': 3, 'core': 2}), (['back', 'core'], 30, {'back': 2, 'core': 1}),
    (['chest', 'core'], 60, {'chest': 3, 'core': 2}), (['quads', 'core'], 60, {'quads': 3, 'core': 2}),
    (['biceps', 'core'], 60, {'biceps': 2, 'core': 2}), (['chest', 'back', 'core'], 60, {'chest': 2, 'back': 2, 'core': 2}),
    (['shoulders', 'biceps'], 60, {'shoulders': 3, 'biceps': 2})])
def test_role_allocation_core_last_direct_core(tgt, dur, expect):
    env, _ = gen(direction='strength', target=tgt, duration=dur)
    ms = muscles_of(env)
    for m, n in expect.items():
        assert ms.count(m) == n, (m, ms)
    if 'core' in tgt:
        k = ms.index('core')
        assert all(x == 'core' for x in ms[k:])              # Core is the last block
        core_items = [it for it in items(env) if AE.roll(AE.EX[it['exercise']['id']]['prim'][0]) == 'core']
        assert all(AE.EX[it['exercise']['id']]['cls'] == 'isolation' for it in core_items)   # direct trunk work, no carry
    assert env['workout']['duration']['estimated_minutes'] <= dur + 4


def test_major_before_minor_order():
    env, _ = gen(direction='strength', target=['biceps', 'shoulders'])
    ms = muscles_of(env)
    assert ms.index('shoulders') < ms.index('biceps')


# ------------------------------------------------------------------ Different Workout
def changed(a, b):
    ids_a = [it['exercise']['id'] for it in items(a)]
    ids_b = [it['exercise']['id'] for it in items(b)]
    return sum(1 for x in ids_b if x not in ids_a) / len(ids_b), ids_a == ids_b


@pytest.mark.parametrize('tgt', [['back', 'core'], ['chest'], ['shoulders'], ['chest', 'back', 'core']])
def test_custom_target_different_workout(tgt):
    env, st = gen(direction='strength', target=tgt)
    for _ in range(3):
        env2, st2 = service.swap_workout(st, env)
        assert env2['status'] == 'ok'
        ratio, same = changed(env, env2)
        assert not same and ratio >= 0.5, (tgt, ratio)
        assert set(muscles_of(env2)) == set(tgt)
        if 'core' in tgt:
            ms = muscles_of(env2); assert all(x == 'core' for x in ms[ms.index('core'):])
        env, st = env2, st2


def test_explicit_archetype_stays_and_primary_may_change():
    env, st = gen(direction='strength', archetype='strength_lower_squat')
    first = items(env)[0]['exercise']['id']; primaries = {first}
    for _ in range(3):
        env2, st2 = service.swap_workout(st, env)
        assert env2['workout']['archetype']['id'] == 'strength_lower_squat'
        assert env2['workout']['selection_source'] == 'user_selected'
        ratio, same = changed(env, env2)
        assert not same and ratio >= 0.5
        primaries.add(items(env2)[0]['exercise']['id'])
        env, st = env2, st2
    assert len(primaries) >= 2                                 # the protected primary moved at least once


@pytest.mark.parametrize('direction', ['strength', 'sweat', 'athletic'])
def test_moods_pick_different_workout_rotates_archetype(direction):
    env, st = gen(direction=direction)
    assert env['workout']['selection_source'] == 'moods_pick'
    seen = [env['workout']['archetype']['id']]
    for _ in range(2):
        env2, st2 = service.swap_workout(st, env)
        assert env2['status'] == 'ok' and env2['workout']['archetype']['id'] != seen[-1]
        assert env2['workout']['selection_source'] == 'moods_pick'
        seen.append(env2['workout']['archetype']['id']); env, st = env2, st2
    assert len(set(seen)) == 3


def test_moods_pick_rotation_respects_soreness():
    env, st = gen(direction='strength', states=['sore'], soreness=['legs'])
    for _ in range(3):
        env, st = service.swap_workout(st, env)
        assert env['workout']['archetype']['id'] not in ('strength_lower_squat', 'strength_lower_hinge', 'strength_glutes_legs')


def test_exercise_swap_after_rotation_still_rebuilds():
    env, st = gen(direction='strength')
    env, st = service.swap_workout(st, env)
    it = items(env)[1]
    env2, st2 = service.swap_exercise(st, env, it['item_id'])
    assert env2['status'] == 'ok' and env2['workout']['swapped_item']['from'] == it['exercise']['id']


# ------------------------------------------------------------------ Sweat Hybrid
@pytest.mark.parametrize('exp', ['beginner', 'intermediate', 'advanced'])
@pytest.mark.parametrize('dur', [30, 60])
@pytest.mark.parametrize('states', [[], ['low_energy'], ['stressed'], ['amped'], ['irritated']])
def test_hybrid_is_one_coherent_block(exp, dur, states):
    env, _ = gen(direction='sweat', archetype='sweat_hybrid', experience=exp, duration=dur, states=states)
    w = env['workout']; titles = [b['title'] for b in w['blocks']]
    assert w['blocks'][0]['structure'] == 'anchor_circuit'
    # Sweat rebuild: the Hybrid block carries the session; a short complement may join it when the block cannot fill the hour
    assert len(w['blocks']) <= 3
    assert w['duration']['estimated_minutes'] <= dur + 1
    if dur == 30: assert len(w['blocks']) <= 2


# ------------------------------------------------------------------ Built for Today
def test_built_for_today_is_specific_and_honest():
    env, _ = gen(direction='strength', target=['back', 'core'], states=['amped'])
    codes = {l['code'] for l in env['workout']['built_for_today']}
    assert {'allocation', 'state_amped'} <= codes                    # Phase 2.6: Core-last folded into the allocation line
    assert 'Core saved for the end' in next(l['text'] for l in env['workout']['built_for_today'] if l['code'] == 'allocation')
    assert env['workout']['today']['chose'].startswith('Custom Strength')
    for l in env['workout']['built_for_today']: assert not explain.lint(l['text'])
    env, _ = gen(direction='strength', target=['chest'])
    # Phase 2.6 addendum: the goal may appear as context on a Target session, never as a claim that it drove the build
    for l in env['workout']['built_for_today']:
        if l['code'] == 'goal': assert l['kind'] == 'context' and 'rotation' not in l['text'] and 'because' not in l['text'].lower()


def test_different_workout_explained():
    env, st = gen(direction='strength')
    env2, _ = service.swap_workout(st, env)
    assert env2['workout']['built_for_today'][0]['code'] == 'rotation_swap'
    env, st = gen(direction='strength', archetype='strength_upper_pull')
    env2, _ = service.swap_workout(st, env)
    assert env2['workout']['built_for_today'][0]['code'] == 'different_workout'
