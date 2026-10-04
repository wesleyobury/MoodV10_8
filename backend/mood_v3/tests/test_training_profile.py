"""V3 Training Profile: GET/PUT round-trip, enum validation, and /api/v3 generation fallback
(explicit request value > users.training_profile > backend default). Uses the in-memory Mongo stand-in."""
import os, sys
import pytest
from bson import ObjectId
from fastapi import FastAPI
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))   # backend/ (training_profile.py)
from training_profile import build_training_profile_router, is_complete  # noqa: E402
from mood_v3.router import build_v3_router  # noqa: E402
from mood_v3.profile_defaults import apply_profile_defaults  # noqa: E402
from mood_v3.tests.test_router import _DB, _Col  # noqa: E402

UID = ObjectId()

@pytest.fixture()
def client():
    db = _DB(); db.users = _Col(); db.users.docs.append({'_id': UID, 'username': 'wes', 'email': 'w@x.com', 'workouts_count': 7})
    app = FastAPI()
    uid = str(UID)
    def current_user(): return uid
    app.include_router(build_training_profile_router(db, current_user), prefix='/api')
    app.include_router(build_v3_router(db, current_user), prefix='/api')
    c = TestClient(app); c.db = db
    return c

FULL = dict(training_preference='mix', goal='build_muscle', experience='advanced', training_frequency='5+', biggest_barrier='boredom',
            profile_source='onboarding_v3')

def test_empty_profile_defaults(client):
    r = client.get('/api/users/me/training-profile').json()
    assert r['complete'] is False and r['profile']['default_duration'] == 60 and r['profile']['default_equipment'] == 'commercial_gym'
    assert r['default_direction'] == 'strength'

def test_put_get_roundtrip_and_account_untouched(client):
    r = client.put('/api/users/me/training-profile', json=FULL)
    assert r.status_code == 200, r.text
    body = r.json(); p = body['profile']
    assert body['complete'] and p['completed_at'] and p['updated_at'] and p['default_duration'] == 60 and p['default_equipment'] == 'commercial_gym'
    assert body['default_direction'] == 'strength'           # mix + build_muscle -> Strength (same rule /api/v3 uses)
    g = client.get('/api/users/me/training-profile').json()
    assert {k: g['profile'][k] for k in FULL} == FULL and g['complete']
    user = client.db.users.docs[0]
    assert user['username'] == 'wes' and user['workouts_count'] == 7          # account data untouched
    # partial update keeps the rest and the original completion time
    first_completed = g['profile']['completed_at']
    r2 = client.put('/api/users/me/training-profile', json=dict(goal='lose_weight_conditioning', profile_source='user_edit')).json()
    assert r2['profile']['experience'] == 'advanced' and r2['profile']['completed_at'] == first_completed
    assert r2['default_direction'] == 'sweat'                  # mix + lose_weight_conditioning -> Sweat

@pytest.mark.parametrize('bad', [dict(goal='lose_weight'), dict(experience='athletic'), dict(training_frequency='2-4'),
                                 dict(biggest_barrier='bored'), dict(default_duration=45), dict(default_equipment='home'),
                                 dict(states=['bored']), dict(training_preference='muscle'), {}])
def test_enum_validation(client, bad):
    assert client.put('/api/users/me/training-profile', json=bad).status_code == 422

def test_incomplete_profile_not_complete(client):
    client.put('/api/users/me/training-profile', json=dict(goal='build_strength'))
    assert client.get('/api/users/me/training-profile').json()['complete'] is False
    assert not is_complete({'goal': 'x'})

def test_generation_uses_profile_when_omitted(client):
    client.put('/api/users/me/training-profile', json=dict(FULL, training_preference='athletic', goal='improve_athleticism', experience='beginner',
                                                           default_duration=30, default_equipment='free_weight_limited'))
    env = client.post('/api/v3/workouts/generate', json=dict(date='2026-10-01')).json()
    w = env['workout']
    assert w['direction'] == 'athletic' and w['experience'] == 'beginner' and w['duration']['requested_minutes'] == 30
    assert w['equipment']['preset'] == 'free_weight_limited'
    assert set(env['profile_defaults_applied']) == {'goal', 'experience', 'training_frequency', 'training_preference', 'equipment', 'duration'}

def test_explicit_request_overrides_profile(client):
    client.put('/api/users/me/training-profile', json=dict(FULL, experience='beginner', default_duration=30))
    env = client.post('/api/v3/workouts/generate', json=dict(direction='sweat', experience='advanced', duration=60, equipment='commercial_gym',
                                                             date='2026-10-01')).json()
    w = env['workout']
    assert w['direction'] == 'sweat' and w['experience'] == 'advanced' and w['duration']['requested_minutes'] == 60
    assert 'experience' not in env['profile_defaults_applied'] and 'duration' not in env['profile_defaults_applied']
    assert 'goal' in env['profile_defaults_applied']

def test_no_profile_uses_backend_defaults(client):
    env = client.post('/api/v3/workouts/generate', json=dict(date='2026-10-01')).json()
    w = env['workout']
    assert env['profile_defaults_applied'] == [] and w['experience'] == 'intermediate' and w['duration']['requested_minutes'] == 60
    assert w['equipment']['preset'] == 'commercial_gym' and w['direction'] == 'strength'

def test_profile_equals_explicit_generation():
    """Filling from the profile produces exactly the request an explicit client would send (generator input identical)."""
    prof = dict(goal='build_strength', experience='advanced', training_frequency='1-2', training_preference='lifting',
                default_equipment='minimal', default_duration=30)
    raw = dict(direction=None, states=['bored'], target=None, archetype=None, duration=60, experience='intermediate', goal=None,
               equipment='commercial_gym', soreness=[], training_frequency=None, training_preference=None, date='2026-10-01')
    filled, applied = apply_profile_defaults(raw, {'states', 'date'}, prof)
    explicit = dict(raw, goal='build_strength', experience='advanced', training_frequency='1-2', training_preference='lifting',
                    equipment='minimal', duration=30)
    assert filled == explicit and len(applied) == 6
    from mood_v3 import service as S
    a, _ = S.generate_workout(filled, 'u', workout_id='x'); b, _ = S.generate_workout(explicit, 'u', workout_id='x')
    a['workout']['created_at'] = b['workout']['created_at'] = None
    assert a == b
