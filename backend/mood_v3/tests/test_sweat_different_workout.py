"""Founder pass 3 regression: Sweat Different Workout must give a genuinely different workout on every tap.

Before the fix the V3 Sweat context always passed swap=0 and an empty displayed chain to the frozen ranker, so a pinned Sweat
type (Engine / Circuit / Hybrid) often rebuilt the same session (112 adjacent identical sessions in the founder audit).
Each case: generate + 7 consecutive Different Workout taps. Invariants: no two adjacent sessions identical, a pinned type stays
pinned, States / duration never change, budgets hold (estimated minutes inside the frozen band), and at least 5 of the 8 sessions
are unique (Engine is one machine per session, so its combinations are finite; the others must be at least 7 of 8).
"""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from mood_v3.router import build_v3_router
from mood_v3.tests.test_router import _DB

# The same envelope the frozen engine produced before this fix (the frozen validator still runs on every build; this only guards drift).
BAND = {30: (22, 32), 60: (34, 62)}


@pytest.fixture(scope='module')
def client():
    db = _DB(); app = FastAPI()
    app.include_router(build_v3_router(db, lambda: 'user_sweat_swap'), prefix='/api')
    return TestClient(app)


def _sig(w):
    return (w['archetype']['id'],
            tuple((b.get('structure'),) + tuple(it['exercise']['id'] + ':' + it['prescription']['display'] for it in b['items']) for b in w['blocks']))


def _ids(w): return {it['exercise']['id'] for b in w['blocks'] for it in b['items']}


CASES = [(arch, states, dur) for arch in (None, 'sweat_engine', 'sweat_circuit', 'sweat_hybrid')
         for states in ([], ['amped'], ['low_energy']) for dur in (30, 60)]


@pytest.mark.parametrize('arch,states,dur', CASES, ids=lambda v: str(v))
def test_sweat_different_workout_varies(client, arch, states, dur):
    body = {'direction': 'sweat', 'states': states, 'soreness': [], 'duration': dur, 'date': '2026-10-05', 'persist': True}
    if arch: body['archetype'] = arch
    r = client.post('/api/v3/workouts/generate', json=body); assert r.status_code == 200, r.text
    w = r.json()['workout']; seq = [w]
    for _ in range(7):
        r = client.post(f"/api/v3/workouts/{w['workout_id']}/swap-workout", json={}); assert r.status_code == 200, r.text
        w = r.json()['workout']; assert w, r.json().get('conflict'); seq.append(w)
    sigs = [_sig(x) for x in seq]
    for a, b in zip(sigs, sigs[1:]): assert a != b, f'adjacent identical session: {a}'
    unique = len(set(sigs))
    assert unique >= (5 if arch == 'sweat_engine' else 7), f'only {unique}/8 unique'
    for x in seq:
        assert x['states'] == states, x['states']
        assert x['duration']['requested_minutes'] == dur
        lo, hi = BAND[dur]; assert lo <= x['duration']['estimated_minutes'] <= hi, x['duration']
        if arch: assert x['archetype']['id'] == arch
    if arch in ('sweat_circuit', 'sweat_hybrid'):
        over = [len(_ids(a) & _ids(b)) / max(1, len(_ids(b))) for a, b in zip(seq, seq[1:])]
        assert max(over) <= 0.5, over


def test_sweat_rebuild_is_deterministic_after_swaps(client):
    """The replayed chain must be deterministic: swapping an exercise after several Different Workout taps rebuilds the stored
    workout (fingerprint check in _rebuild) instead of raising Outdated."""
    body = {'direction': 'sweat', 'archetype': 'sweat_circuit', 'states': [], 'soreness': [], 'duration': 60, 'date': '2026-10-06', 'persist': True}
    w = client.post('/api/v3/workouts/generate', json=body).json()['workout']
    for _ in range(4): w = client.post(f"/api/v3/workouts/{w['workout_id']}/swap-workout", json={}).json()['workout']
    item = next(it for b in w['blocks'] for it in b['items'] if it['swap']['swappable'])
    r = client.post(f"/api/v3/workouts/{w['workout_id']}/swap-exercise", json={'item_id': item['item_id']})
    assert r.status_code == 200, r.text
