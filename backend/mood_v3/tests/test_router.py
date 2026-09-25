"""HTTP-level tests of the V3 router with an in-memory stand-in for Motor (no Mongo needed)."""
import copy
import pytest
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient
from mood_v3.router import build_v3_router, norm_name

class _Cursor:
    def __init__(self, docs): self.docs = docs
    def sort(self, key, direction): self.docs.sort(key=lambda d: d.get(key), reverse=direction < 0); return self
    def limit(self, n): self.docs = self.docs[:n]; return self
    async def to_list(self, n): return [copy.deepcopy(d) for d in self.docs[:n]]
    def __aiter__(self): self._it = iter(self.docs); return self
    async def __anext__(self):
        try: return next(self._it)
        except StopIteration: raise StopAsyncIteration

class _Col:
    def __init__(self): self.docs = []
    def _match(self, d, q): return all(d.get(k) == v for k, v in q.items())
    def find(self, q=None, proj=None): return _Cursor([d for d in self.docs if self._match(d, q or {})])
    async def find_one(self, q, proj=None): return copy.deepcopy(next((d for d in self.docs if self._match(d, q)), None))
    async def insert_one(self, d): self.docs.append(copy.deepcopy(d))
    async def update_one(self, q, u):
        class _R:
            def __init__(self, n): self.matched_count = n; self.modified_count = n
        for d in self.docs:
            if self._match(d, q):
                d.update(copy.deepcopy(u.get('$set', {})))
                for k, v in u.get('$push', {}).items(): d.setdefault(k, []).append(copy.deepcopy(v))
                return _R(1)
        return _R(0)

class _DB:
    def __init__(self):
        self.v3_workouts = _Col(); self.exercises = _Col()
        self.exercises.docs.append(dict(_id='lib1', name='Barbell Back Squat', aliases=['Back Squat'], video_url='https://v/squat.mp4', thumbnail_url='https://t/squat.jpg',
                                        cues=['Brace', 'Knees out', 'Drive up']))

@pytest.fixture()
def client():
    db = _DB(); app = FastAPI()
    user = {'id': 'user_a'}
    def current_user(): return user['id']
    app.include_router(build_v3_router(db, current_user), prefix='/api')
    c = TestClient(app); c.db = db; c.user = user
    return c

def test_generate_swap_complete_history_progression(client):
    r = client.post('/api/v3/workouts/generate', json=dict(direction='strength', archetype='strength_lower_squat', states=['amped'], duration=60, date='2026-10-01'))
    assert r.status_code == 200, r.text
    env = r.json(); w = env['workout']; assert env['status'] == 'ok' and w['workout_id']
    assert w['direction'] == 'strength' and w['blocks'] and w['built_for_today']
    first = w['blocks'][0]['items'][0]
    # swap an exercise
    r2 = client.post(f"/api/v3/workouts/{w['workout_id']}/swap-exercise", json=dict(item_id=first['item_id'], reason='dont_have'))
    assert r2.status_code == 200, r2.text
    w2 = r2.json()['workout']; assert w2['version'] == 2 and w2['swapped_item']['from'] == first['exercise']['id']
    assert w2['swapped_item']['to'] != first['exercise']['id']
    # GET returns the latest version
    assert client.get(f"/api/v3/workouts/{w['workout_id']}").json()['workout']['version'] == 2
    # Swap Workout keeps Direction + archetype
    r3 = client.post(f"/api/v3/workouts/{w['workout_id']}/swap-workout"); w3 = r3.json()['workout']
    assert w3['archetype']['id'] == 'strength_lower_squat' and w3['swap_count'] == 1
    # complete with a performance log on the main lift
    main = w3['blocks'][0]['items'][0]; reps = int(main['prescription']['reps'])
    r4 = client.post(f"/api/v3/workouts/{w['workout_id']}/complete",
                     json=dict(performance=[dict(item_id=main['item_id'], sets=[dict(reps=reps, load=100, unit='kg')] * main['prescription']['sets'])], fit_rating='just_right'))
    assert r4.status_code == 200 and r4.json()['logged_exercises'] == 1
    assert client.post(f"/api/v3/workouts/{w['workout_id']}/swap-exercise", json=dict(item_id=main['item_id'])).status_code == 409
    h = client.get('/api/v3/workouts/history').json(); assert h['count'] == 1
    # next session of the same archetype: protected primary continuity + exact-exercise load progression
    r5 = client.post('/api/v3/workouts/generate', json=dict(direction='strength', archetype='strength_lower_squat', duration=60, date='2026-10-04'))
    w5 = r5.json()['workout']; it = next(i for b in w5['blocks'] for i in b['items'] if i['exercise']['id'] == main['exercise']['id'])
    assert it['progression'] and it['progression']['suggestion']['action'] == 'increase'
    others = [i for b in w5['blocks'] for i in b['items'] if i['exercise']['id'] != main['exercise']['id']]
    assert all(i['progression'] is None for i in others)

def test_media_enrichment_and_conflict_and_validation(client):
    env = client.post('/api/v3/workouts/generate', json=dict(direction='athletic', archetype='athletic_speed_agility', soreness=['legs'])).json()
    assert env['status'] == 'conflict' and env['conflict']['code'] == 'sore_target_conflict' and env['conflict']['options']
    assert client.post('/api/v3/workouts/generate', json=dict(direction='strength', duration=45)).status_code == 422
    assert client.post('/api/v3/workouts/generate', json=dict(direction='strength', states=['bored', 'stressed', 'amped', 'irritated'])).status_code == 422
    assert client.post('/api/v3/workouts/generate', json=dict(direction='strength', bogus=1)).status_code == 422
    env = client.post('/api/v3/workouts/generate', json=dict(direction='strength', target=['quads'], experience='advanced', date='2026-10-02')).json()
    names = [i['exercise']['name'] for b in env['workout']['blocks'] for i in b['items']]
    squat = [i for b in env['workout']['blocks'] for i in b['items'] if i['exercise']['name'] == 'Barbell Back Squat']
    if squat: assert squat[0]['exercise']['media']['video_url'] == 'https://v/squat.mp4'
    assert norm_name('DB Bulgarian Split Squats') == norm_name('Dumbbell Bulgarian Split Squat')

def test_preview_is_not_persisted_and_ownership(client):
    env = client.post('/api/v3/workouts/generate', json=dict(direction='sweat', persist=False)).json()
    assert env['workout']['workout_id'] is None and not client.db.v3_workouts.docs
    env = client.post('/api/v3/workouts/generate', json=dict(direction='sweat')).json(); wid = env['workout']['workout_id']
    client.user['id'] = 'someone_else'
    assert client.get(f'/api/v3/workouts/{wid}').status_code == 403

@pytest.mark.parametrize('direction', ['strength', 'sweat', 'athletic'])
def test_every_item_swappable_or_explicit(client, direction):
    env = client.post('/api/v3/workouts/generate', json=dict(direction=direction, date='2026-10-03')).json(); wid = env['workout']['workout_id']
    for b in env['workout']['blocks']:
        for it in b['items']:
            r = client.post(f'/api/v3/workouts/{wid}/swap-exercise', json=dict(item_id=it['item_id']))
            assert r.status_code == 200
            body = r.json(); assert body['status'] == 'ok' or body['conflict']['code'] == 'no_alternative'
            assert body['workout']['direction'] == direction
