"""Sweat rebuild (V3): workload budget, Hybrid anchor regression, duration windows, State gate truthfulness. Production path."""
import itertools, pytest
from mood_v3 import service as S, normalize as N
from mood_v3.engines.sweat import adapter as A, sweat_core as C

def nctx(raw, user='qa'):
    return S.engine_ctx(N.normalize(raw, user, []))

def gen(raw, user='qa', hist=()):
    env, st = S.generate_workout(raw, user, list(hist), [])
    return env, st

BASE = dict(direction='sweat', goal='lose_weight_conditioning', equipment='commercial_gym', date='2026-10-11')


def test_legacy_hybrid_pathology_is_gone():
    """The frozen v4 Hybrid produced 7 x 800 m row (5.6 km, anchor share ~68%) for Amped / advanced / 60. The rebuild must not."""
    from mood_v3.engines.sweat import adapter_legacy_v4 as L
    raw = dict(BASE, states=['amped'], duration=60, experience='advanced', archetype='sweat_hybrid')
    legacy = L.build(nctx(raw, 'u1'), [])['w']
    anchor = next(b for b in legacy['blocks'] if b.get('anchor'))
    legacy_m = anchor['anchor_dose']['value'] * (anchor.get('rounds') or len(anchor.get('round_stations', [])))
    assert legacy_m >= 5000            # documents the pathology this test guards against
    for user in ('u1', 'u2', 'u3', 'u4', 'u5'):
        res = A.build(nctx(raw, user), [])
        B = res['budget']; L_ = C.limits('advanced', 60)
        eng_m = sum(v for k, v in B['engine'].items() if k.endswith('distance'))
        assert B['anchor_share'] is None or B['anchor_share'] <= L_['anchor_share'] + 0.005, B
        assert eng_m <= 5000, B        # final trainer pass: the 60-minute work floor adds a round; 5 x ~900 m spread over a 55-minute hybrid, never 7 x 800 m in one block
        assert B['engine_min'] <= L_['engine_min'] + 0.6, B
        assert 45 <= res['estimated_minutes'] <= 60.5


@pytest.mark.parametrize('arch', ['sweat_engine', 'sweat_circuit', 'sweat_hybrid'])
@pytest.mark.parametrize('dur', [30, 60])
@pytest.mark.parametrize('exp', ['beginner', 'intermediate', 'advanced'])
def test_budget_holds_and_duration_in_window(arch, dur, exp):
    lo = {30: 20, 60: 36}[dur]; hi = {30: 31, 60: 60.5}[dur]      # duration is an available window, not a work quota
    for states in ([], ['low_energy'], ['bored'], ['irritated'], ['amped'], ['stressed'], ['amped', 'stressed'], ['low_energy', 'amped']):
        env, st = gen(dict(BASE, states=states, duration=dur, experience=exp, archetype=arch), 'u1')
        assert env['status'] == 'ok', (states, env.get('conflict'))
        est = env['workout']['duration']['estimated_minutes']
        assert lo <= est <= hi, (states, est)


def test_hybrid_anchor_share_across_states():
    for states, exp in itertools.product(([], ['amped'], ['irritated'], ['bored']), ('intermediate', 'advanced')):
        res = A.build(nctx(dict(BASE, states=states, duration=60, experience=exp, archetype='sweat_hybrid'), 'u2'), [])
        B = res['budget']
        assert B['anchor_share'] is not None and B['anchor_share'] <= 0.485, (states, exp, B['anchor_share'])
        assert B['engine_share'] <= 0.85 and B['engine_min'] <= 34.5


def test_gate_claims_are_backed():
    """Every State the explanation claims as realized must be realized in the finished session (adapter gate)."""
    for states in (['low_energy'], ['amped'], ['bored', 'stressed'], ['irritated', 'low_energy'], ['amped', 'bored']):
        for arch in ('sweat_engine', 'sweat_circuit', 'sweat_hybrid'):
            res = A.build(nctx(dict(BASE, states=states, duration=60, experience='intermediate', archetype=arch), 'u3'), [])
            for s, ok in res['state_gate'].items():
                yielded = any(l.get('reason_code') == 'state_gate_yielded' and l.get('state') == s for l in res['log'])
                assert ok or yielded or any(l.get('reason_code') == 'state_gate_exhausted' and l.get('state') == s for l in res['log']), (states, arch, s)
            assert all(v['passed'] for v in res['coherence'].values()), (states, arch, res['coherence'])


def test_beginner_rules():
    for arch in ('sweat_engine', 'sweat_circuit', 'sweat_hybrid'):
        for states in ([], ['amped'], ['irritated']):
            res = A.build(nctx(dict(BASE, states=states, duration=60, experience='beginner', archetype=arch), 'u4'), [])
            for b in res['w']['blocks']:
                assert b['rpe'][1] <= 8, (arch, states, b['rpe'])
                assert b['structure'] != 'finisher'
                it = b.get('interval_target')
                if b['structure'] == 'intervals' and it and not it.get('rotate'): assert it['recovery'] >= it['work']
            assert res['budget']['very_hard_blocks'] == 0


def test_secondary_elements_earn_their_place():
    """Never main + complement + finisher; no finisher after a hard main block; a complement beside a substantial main block only to reach the work floor."""
    for arch in ('sweat_engine', 'sweat_circuit', 'sweat_hybrid'):
        for exp in ('intermediate', 'advanced'):
            for states in ([], ['amped'], ['irritated'], ['bored'], ['amped', 'bored']):
                for user in ('u1', 'u2', 'u3'):
                    res = A.build(nctx(dict(BASE, states=states, duration=60, experience=exp, archetype=arch), user), [])
                    bl = res['w']['blocks']; p = bl[0]
                    has_comp = any(b['slot'] == 'complementary_block' for b in bl); has_fin = any(b['structure'] == 'finisher' for b in bl)
                    assert not (has_comp and has_fin), (arch, exp, states, user)
                    if p['rpe'][0] >= 8 or p['rpe'][1] >= 9: assert not has_fin, (arch, exp, states, user)
                    lab = next((l['label'] for l in res['log'] if l.get('reason_code') == 'primary_block_completeness'), None)
                    assert lab in ('insufficient', 'sufficient', 'substantial')
                    # final trainer pass: a complement beside a substantial main block only when the main block alone is below the work floor
                    if lab == 'substantial' and has_comp and bl[1].get('comp_type') != 'closer':
                        assert C.block_minutes(p, exp) < C.work_floor([p], 60, exp), (arch, exp, states, user)
