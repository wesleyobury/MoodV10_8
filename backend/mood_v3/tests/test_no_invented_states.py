"""Founder edit pass regression: MOOD's Pick never invents a State.

State comes only from the user's explicit selection for the request. No States in -> no States on the workout, in its
explanation or in its "You told MOOD" pills, including after Different Workout (swap-workout) and Swap Exercise.
Covers all three Directions and MOOD's Pick / explicit type / Target. Read-only against the frozen engines.
"""
import re
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from mood_v3.router import build_v3_router
from mood_v3.tests.test_router import _DB

STATE_WORDS = re.compile(r"\b(irritat\w*|amped|low on energy|low energy|stressed|bored|sore)\b", re.I)


@pytest.fixture()
def client():
    db = _DB(); app = FastAPI()
    app.include_router(build_v3_router(db, lambda: 'user_no_state'), prefix='/api')
    return TestClient(app)


def _assert_no_state(w, where):
    assert w['states'] == [], f'{where}: states {w["states"]}'
    assert w['soreness']['regions'] == [], where
    text = ' '.join(l['text'] for l in w['built_for_today'])
    today = w.get('today') or {}
    text += ' ' + ' '.join(today.get('told') or []) + ' ' + str((today.get('teaser') or {}).get('text') or '')
    m = STATE_WORDS.search(text)
    assert not m, f'{where}: state word "{m.group(0) if m else ""}" in: {text[:300]}'


REQUESTS = [
    dict(direction='strength'), dict(direction='strength', duration=30), dict(direction='strength', archetype='strength_upper_push'),
    dict(direction='strength', target=['chest', 'back', 'shoulders']),
    dict(direction='sweat'), dict(direction='sweat', archetype='sweat_hybrid'),
    dict(direction='athletic'), dict(direction='athletic', archetype='athletic_power', duration=30),
]


@pytest.mark.parametrize('req', REQUESTS, ids=lambda r: '-'.join(str(v) for v in r.values()))
def test_no_states_in_no_states_out_through_different_workout(client, req):
    for date in ('2026-10-01', '2026-10-02'):
        body = {'states': [], 'soreness': [], 'duration': 60, 'date': date, 'persist': True, **req}
        r = client.post('/api/v3/workouts/generate', json=body)
        assert r.status_code == 200, r.text
        w = r.json()['workout']
        _assert_no_state(w, f'generate {body}')
        for k in range(3):
            w2 = client.post(f"/api/v3/workouts/{w['workout_id']}/swap-workout").json().get('workout')
            if not w2: break
            _assert_no_state(w2, f'different workout #{k + 1} {body}')
        item = next((i for b in w['blocks'] for i in b['items'] if (i.get('swap') or {}).get('swappable')), None)
        if item:
            w3 = client.post(f"/api/v3/workouts/{w['workout_id']}/swap-exercise", json=dict(item_id=item['item_id'])).json().get('workout')
            if w3: _assert_no_state(w3, f'swap exercise {body}')
