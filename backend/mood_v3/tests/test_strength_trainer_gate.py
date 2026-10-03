"""Final pre-launch Strength trainer-quality pass (Oct 2026): regressions for the eight founder-reported issues and the
Trainer Coherence Gate over a broad production-path matrix."""
import itertools, collections
import pytest
from mood_v3.qa import strength_trainer_qa as Q
from mood_v3.engines.strength import trainer_gate as TG, audit_engine as AE

EX = AE.EX


def _ids(env): return [it['exercise']['id'] for b in env['workout']['blocks'] for it in b['items']]


def test_trainer_gate_green_on_full_matrix():
    R = Q.run()
    assert R['all_green'], {k: v[:2] for k, v in R['examples'].items()}
    assert R['amped_variant_share'].get('top_backoff', 0) < 0.3          # issue 4: Top Set no longer dominates Amped
    assert set(R['assisted_by_level']) <= {'beginner'}                   # issue 6


@pytest.mark.parametrize('i', range(12))
def test_glutes_abs_leads_with_a_glute_lift(i):   # issue 1
    raw, env, st, res, nctx = Q.build(i, target=['glutes', 'core'], exp=Q.LEVELS[i % 3], dur=(30, 60)[i % 2], states=Q.SINGLE[i % 6])
    lead = EX[env['workout']['blocks'][0]['items'][0]['exercise']['id']]
    assert AE.roll(lead['pm0']) == 'glutes' and lead['cls'] != 'integrated' and not lead['combo']


def test_role_labels_follow_the_workout():   # issue 2
    raw, env, st, res, nctx = Q.build(3, archetype='strength_arms')
    assert 'secondary' not in {b['type'] for b in env['workout']['blocks']}
    raw, env, st, res, nctx = Q.build(3, target=['glutes', 'core'])
    assert {b['type'] for b in env['workout']['blocks']} <= {'target', 'main', 'finisher'}


def test_hinge_and_full_body_accessories_are_relevant():   # issues 3 + 5
    for i, st in itertools.product(range(8), Q.SINGLE):
        for a in ('strength_lower_hinge', 'strength_full_body'):
            raw, env, s, res, nctx = Q.build(i, archetype=a, states=st)
            for r in res['rows']:
                if r['cls'] in ('accessory', 'extra'):
                    m = AE.roll(EX[r['eid']]['pm0'])
                    if a == 'strength_lower_hinge': assert m in ('hamstrings', 'glutes', 'spinal_erectors', 'hip_abductors', 'calves'), r['eid']
                    assert r['eid'] not in TG.LOW_VALUE, r['eid']
            if a == 'strength_lower_hinge':
                assert all(f['eid'] not in ('suitcase_carry', 'farmer_carry') for f in res.get('fin_rows', []))


def test_eccentric_naming():   # issue 7
    seen = 0
    for i in range(40):
        raw, env, st, res, nctx = Q.build(i, archetype='strength_arms', exp='intermediate', states=[['low_energy'], ['stressed'], []][i % 3])
        for b in env['workout']['blocks']:
            for it in b['items']:
                t = (it['prescription']['display'] or '') + ' ' + (it['prescription'].get('load_guidance') or '')
                assert '3 s eccentric' not in t and '3 s lowering' not in t and '3-second lowering' not in t
                seen += 'ccentric' in t
    assert seen


def test_arms_straight_sets_grouped_by_muscle():   # issue 8
    for i in range(30):
        raw, env, st, res, nctx = Q.build(i, archetype='strength_arms', dur=60, exp=Q.LEVELS[i % 3], states=Q.SINGLE[i % 6])
        assert not [c for c, d in TG.check(res, nctx) if c == 'sequencing']


def test_no_method_on_a_top_set():
    for i in range(40):
        raw, env, st, res, nctx = Q.build(i, archetype='strength_upper_push', states=['amped'], exp='advanced', goal='build_strength')
        p = next((r for r in res['rows'] if r['cls'] == 'primary_compound'), None)
        assert not (p and p.get('scheme') and p.get('method'))


def test_upper_pull_main_lift_variety():   # pre-freeze addition: any legitimate heavy back lift can lead, rotated by recency
    pats = collections.Counter(); leads = collections.Counter()
    for i in range(90):
        raw, env, st, res, nctx = Q.build(i, archetype='strength_upper_pull', exp=('intermediate', 'advanced')[i % 2], goal=Q.GOALS[i % 6], states=Q.SINGLE[i % 6])
        e = EX[res['W']['primary_pull']]; pats[e['pat']] += 1; leads[e['id']] += 1
        assert e['id'] not in ('inverted_row', 'assisted_pull_up_machine') and e['cls'] != 'isolation'
    assert min(pats.values()) >= 0.3 * sum(pats.values())          # neither rows nor vertical pulls dominate
    assert len(leads) >= 6 and max(leads.values()) <= 0.35 * sum(leads.values())
    hist = []; prev = None
    for k in range(8):   # no lead repeats in back-to-back Upper Pull sessions
        raw, env, st, res, nctx = Q.build(200 + k, archetype='strength_upper_pull', exp='intermediate', hist=hist)
        assert res['W']['primary_pull'] != prev; prev = res['W']['primary_pull']; hist.append(dict(st['history_record'], completed_at='x'))
