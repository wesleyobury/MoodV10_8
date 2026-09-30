"""Custom Target allocation accounting: `custom_target.allocation` must describe the workout actually delivered (after the
reconciler, State repairs and any post-repair duration trim). Accounting only; no programming is asserted here."""
import itertools
from collections import defaultdict
from mood_v3 import service
from mood_v3.engines.strength import audit_engine as AE

TARGETS = [['chest'], ['back'], ['quads', 'hamstrings'], ['chest', 'back'], ['back', 'core'], ['shoulders', 'biceps', 'triceps'], ['glutes', 'hamstrings', 'core']]
STATES = [[], ['low_energy'], ['stressed'], ['bored', 'stressed'], ['low_energy', 'stressed'], ['amped'], ['irritated', 'stressed']]


def _run(req, user):
    cap = {}
    orig = service._finish
    def spy(ctx, res, *a, **k):
        cap['log'] = res.get('log', []); return orig(ctx, res, *a, **k)
    service._finish = spy
    try:
        env, _ = service.generate_workout(dict(dict(soreness=[], goal='build_muscle', training_frequency='3-4'), **req), user)
    finally:
        service._finish = orig
    return env, cap.get('log', [])


def test_allocation_matches_delivered_workout():
    checked = 0
    for tgt, dur, exp, st, user in itertools.product(TARGETS, [60, 30], ['beginner', 'intermediate', 'advanced'], STATES, ['grid6', 'ct_alloc']):
        req = dict(direction='strength', duration=dur, experience=exp, states=st, target=tgt, date='2026-10-05')
        env, log = _run(req, user)
        if env['status'] != 'ok': continue
        ct = next((l for l in log if isinstance(l, dict) and l.get('reason_code') == 'custom_target'), None)
        if ct is None: continue          # this Target routed to a named archetype (e.g. Chest -> Upper Push); no Custom Target allocation
        assert ct.get('allocation'), req
        sets, exs = defaultdict(int), defaultdict(int)
        for b in env['workout']['blocks']:
            if b['structure'] == 'finisher': continue
            for it in b['items']:
                m = AE.roll(it['exercise']['primary_muscles'][0])
                sets[m] += it['prescription']['sets'] or 0; exs[m] += 1
        for m, a in ct['allocation'].items():
            assert a['sets'] == sets[m], (req, user, m, a, dict(sets))
            assert a['exercises'] == exs[m], (req, user, m, a, dict(exs))
        assert set(sets) <= set(ct['allocation']), (req, dict(sets), ct['allocation'])
        checked += 1
    assert checked > 300


def test_founder_case_grid6_quads_hamstrings():
    """The case the rest audit flagged: 30-min bored+stressed quads+hamstrings, trimmed after the Stressed repair."""
    env, log = _run(dict(direction='strength', duration=30, experience='intermediate', states=['bored', 'stressed'], target=['quads', 'hamstrings'], date='2026-10-05'), 'grid6')
    ct = next(l for l in log if isinstance(l, dict) and l.get('reason_code') == 'custom_target')
    delivered = sum(it['prescription']['sets'] for b in env['workout']['blocks'] if b['structure'] != 'finisher' for it in b['items'])
    assert sum(a['sets'] for a in ct['allocation'].values()) == delivered
