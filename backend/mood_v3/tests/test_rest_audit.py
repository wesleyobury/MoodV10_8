"""Founder rest audit: rest serves the stimulus, never the clock; grouped rest is said once; every block states when the
timer starts (block `rest` contract for Guided Session)."""
import itertools, re
import pytest
from mood_v3 import service
from mood_v3.engines.strength import bands as B

STATES = [[], ['low_energy'], ['amped'], ['stressed'], ['bored'], ['irritated'], ['low_energy', 'stressed'], ['irritated', 'stressed']]
S_ARCH = ['strength_upper_push', 'strength_upper_pull', 'strength_lower_squat', 'strength_lower_hinge', 'strength_glutes_legs',
          'strength_full_body', 'strength_arms', 'strength_core', ('T', ['chest']), ('T', ['back', 'core'])]


def gen(**kw):
    user = kw.pop('_u', 'rest_audit')
    env, _ = service.generate_workout(dict(dict(soreness=[], goal='build_muscle', training_frequency='3-4'), **kw), user)
    return env


def strength_grid():
    for a, dur, exp, st, d in itertools.product(S_ARCH, [60, 30], ['beginner', 'intermediate', 'advanced'], STATES, ['2026-10-05', '2026-10-13']):
        req = dict(direction='strength', duration=dur, experience=exp, states=st, date=d)
        if isinstance(a, tuple): req['target'] = a[1]
        else: req['archetype'] = a
        env = gen(**req)
        if env['status'] == 'ok': yield req, env['workout']


def top(txt):
    n = [int(x) for x in re.findall(r'\d+', str(txt))]
    return max(n) if n else None


def test_strength_rest_rules():
    n = 0
    for req, w in strength_grid():
        for b in w['blocks']:
            assert b['rest'] and b['rest']['kind']
            for it in b['items']:
                rx = it['prescription']; cls = rx['direction_fields'].get('slot_class'); rest = rx['rest_sec']
                if b['structure'] in ('superset', 'circuit'):
                    assert rest is None and b['rest']['kind'] in ('after_pair', 'after_round') and b['rest']['seconds'] <= 120
                    continue
                n += 1
                assert rest is not None and b['rest']['kind'] == 'between_sets'
                if cls == 'accessory': assert rest <= 90, (req, it['exercise']['name'], rest)
                elif cls == 'extra': assert rest <= 60
                elif cls == 'secondary_compound': assert rest <= 120, (req, it['exercise']['name'], rest)
                elif cls == 'primary_compound':
                    heavy_scheme = rx.get('reps_scheme') and min(rx['reps_scheme']) <= 6
                    if rest > 120: assert heavy_scheme or (top(rx['reps']) or 99) <= 6, (req, it['exercise']['name'], rx['display'], rest)
                    assert rest <= 180
                    if rest > 150: assert it['exercise']['equipment'] in ('barbell', 'trap_bar'), (req, it['exercise']['name'], rest)
                    if rest >= 150: assert b['rest']['full_recovery']
    assert n > 1000


def test_rest_is_never_used_as_duration_filler():
    cap = {}
    orig = service._finish
    def spy(ctx, res, *a, **k): cap['log'] = res.get('log', []); return orig(ctx, res, *a, **k)
    service._finish = spy
    try:
        for req, w in strength_grid():
            codes = [(l.get('reason_code'), l.get('action'), l.get('repair')) for l in cap['log'] if isinstance(l, dict)]
            assert ('duration_backfill', 'rest_extended', None) not in codes
            assert not any(c[2] == 'extend_rest' for c in codes)
    finally:
        service._finish = orig


def test_founder_case_dumbbell_bench_top_set():
    """Top set + back-off Dumbbell Bench Press ('4 × 7', shown at 3:30 before the audit)."""
    env = gen(direction='strength', archetype='strength_upper_push', duration=30, experience='intermediate', states=[], date='2026-10-13', _u='u')
    for b in env['workout']['blocks']:
        for it in b['items']:
            if it['exercise']['id'] == 'db_bench_press': assert it['prescription']['rest_sec'] <= 150
    row = dict(cls='primary_compound', eid='db_bench_press', reps='6–8', kind='reps', why='', pos=dict(rest=0.75))
    assert B.rest_for(row, 'intermediate') <= 120


def test_bands_and_heavy_exception():
    assert B.band('primary_compound', 'intermediate')['rest'] == (90, 150)
    assert B.band('secondary_compound', 'intermediate')['rest'] == (75, 120)
    heavy = dict(cls='primary_compound', eid='barbell_bench_press', reps='4–6', kind='reps', why='', pos=dict(rest=1.0))
    assert B.heavy_low_rep(heavy, 'intermediate') and B.rest_for(heavy, 'intermediate') == 180
    assert not B.heavy_low_rep(heavy, 'beginner')
    light = dict(heavy, reps='8–10'); assert B.rest_for(light, 'intermediate') == 120


@pytest.mark.parametrize('arch', ['athletic_power', 'athletic_speed_agility', 'athletic_full_body'])
def test_athletic_rest_contract(arch):
    for exp, st, d in itertools.product(['beginner', 'intermediate', 'advanced'], [[], ['amped'], ['low_energy']], ['2026-10-05', '2026-10-06']):
        w = gen(direction='athletic', archetype=arch, duration=60, experience=exp, states=st, date=d)['workout']
        for b in w['blocks']:
            r = b['rest']; assert r['kind'] in ('between_sets', 'after_pair')
            rests = [it['prescription']['rest_sec'] for it in b['items'] if it['prescription']['rest_sec']] + ([r['seconds']] if r['seconds'] else [])
            if b['type'] == 'strength': assert max(rests) <= 120
            if b['type'] in ('primary', 'secondary') and max(rests) >= 150: assert r['full_recovery'] and r['reason'] == 'power'
            if r['kind'] == 'after_pair': assert all(it['prescription']['rest_sec'] is None for it in b['items'])


@pytest.mark.parametrize('arch', ['sweat_circuit', 'sweat_engine', 'sweat_hybrid'])
def test_sweat_rest_contract(arch):
    for dur, st, d in itertools.product([60, 30], [[], ['amped'], ['stressed'], ['irritated']], ['2026-10-05', '2026-10-06']):
        w = gen(direction='sweat', archetype=arch, duration=dur, experience='intermediate', states=st, date=d)['workout']
        for b in w['blocks']:
            r = b['rest']; s = b['structure']
            if s in ('circuit', 'anchor_circuit'): assert r['kind'] == 'after_round' and r['seconds'] == b['rest_between_rounds_sec']
            if s in ('intervals', 'finisher') and b['interval'] and b['interval'].get('work_sec'):
                assert r['kind'] == 'interval' and r['recovery_sec'] == b['interval']['recovery_sec']
                assert all(it['prescription']['rest_sec'] is None for it in b['items'])     # the block owns the recovery
            if s == 'emom': assert r['kind'] == 'emom'
            if s == 'continuous': assert r['kind'] == 'continuous'
