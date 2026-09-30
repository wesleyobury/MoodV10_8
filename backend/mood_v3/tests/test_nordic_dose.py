"""Founder pass 4: Nordic Hamstring Curl dosing.

It was prescribed like any bodyweight accessory (2–4 x 12–15). A Nordic is a near-maximal eccentric, so it now takes 4–6
controlled reps with at least 1 rep in reserve (bands.EXERCISE_DOSE), inside the existing class bands: sets, rest and State
levers are unchanged. Nothing else moves: other hamstring isolations, other bodyweight rows, Athletic and Sweat.
"""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from mood_v3.router import build_v3_router
from mood_v3.tests.test_router import _DB
from mood_v3.engines.strength import bands as B, adapter as SA


@pytest.fixture(scope='module')
def client():
    db = _DB(); app = FastAPI()
    app.include_router(build_v3_router(db, lambda: 'user_nordic'), prefix='/api')
    return TestClient(app)


def _rows(c, **kw):
    body = {'direction': 'strength', 'soreness': [], 'duration': 60, 'persist': False, 'goal': 'build_strength', **kw}
    w = c.post('/api/v3/workouts/generate', json=body).json().get('workout')
    return [(b, it) for b in (w or {}).get('blocks', []) for it in b['items']]


@pytest.mark.parametrize('states', [[], ['low_energy'], ['amped'], ['stressed', 'bored']])
def test_nordic_is_low_rep_and_never_to_failure(client, states):
    seen = 0
    for day in range(1, 15):
        for req in (dict(target=['hamstrings']), dict(target=['hamstrings', 'glutes']), dict(archetype='strength_lower_hinge')):
            for b, it in _rows(client, experience='advanced', states=states, date=f'2026-10-{day:02d}', **req):
                if it['exercise']['id'] != 'nordic_curl': continue
                seen += 1; rx = it['prescription']
                assert rx['reps'] == '4–6', rx
                assert rx['rir'] >= 1, rx
                assert 2 <= rx['sets'] <= 4, rx
                assert rx['scaling']['kind'] == 'bodyweight_leverage'
                assert 'Make it fit you' in rx['load_guidance']
    assert seen > 0


def test_nordic_stays_an_advanced_movement(client):
    for exp in ('beginner', 'intermediate'):
        for day in range(1, 15):
            for b, it in _rows(client, experience=exp, states=[], date=f'2026-10-{day:02d}', target=['hamstrings']):
                assert it['exercise']['id'] != 'nordic_curl'


def test_other_bodyweight_and_hamstring_rows_are_unchanged():
    assert set(B.EXERCISE_DOSE) == {'nordic_curl'}
    for eid in ('slider_hamstring_curl', 'reverse_nordic', 'sissy_squat', 'single_leg_glute_bridge'):
        assert B.rep_text(SA.EX[eid], 'accessory', 'advanced', 0.5)[0].startswith('12–15'), eid
    assert B.rep_text(SA.EX['nordic_curl'], 'accessory', 'advanced', 0.5)[0] == '4–6'
    for eid in ('lying_leg_curl', 'seated_leg_curl'):
        if eid in SA.EX: assert B.rep_text(SA.EX[eid], 'accessory', 'advanced', 0.5)[0] != '4–6'
    assert B.rir_floor('slider_hamstring_curl') is None and B.rir_floor('nordic_curl') == 1
