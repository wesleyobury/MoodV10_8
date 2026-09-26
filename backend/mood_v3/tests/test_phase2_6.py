"""Phase 2.6 native-flow stabilization: the production HTTP path the app uses (request exactly as the app's request builder
sends it -> /api/v3 router -> persistence -> GET), engine identity for stale-process detection, live Hybrid structure and
the refined Built for Today / Preview teaser."""
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from mood_v3.router import build_v3_router
from mood_v3 import build_info, explain
from mood_v3.engines.strength import audit_engine as AE
from mood_v3.tests.test_router import _DB, _Col

DATE = '2026-09-26'
PROFILE = dict(training_preference='mix', goal='build_muscle', experience='intermediate', training_frequency='3-4', default_equipment='commercial_gym')


@pytest.fixture()
def api():
    from bson import ObjectId
    uid = ObjectId()
    db = _DB(); db.users = _Col(); db.users.docs.append({'_id': uid, 'training_profile': PROFILE})
    app = FastAPI(); app.include_router(build_v3_router(db, lambda: str(uid)), prefix='/api')
    c = TestClient(app); c.db = db
    return c


def app_request(direction, states=(), soreness=(), target=None, archetype=None, duration=60):
    """Exactly the JSON utils/v3HomeModel.buildRequest produces (no profile fields, target/archetype only when set)."""
    req = dict(direction=direction, states=list(states), soreness=list(soreness), duration=duration, date=DATE, persist=True)
    if target is not None: req['target'] = target
    if archetype: req['archetype'] = archetype
    return req


def gen(api, **kw):
    r = api.post('/api/v3/workouts/generate', json=app_request(**kw)); assert r.status_code == 200, r.text
    env = r.json(); assert env['status'] == 'ok', env.get('conflict'); return env['workout']


def ids(w): return [it['exercise']['id'] for b in w['blocks'] for it in b['items']]
def muscles(w): return [AE.roll(AE.EX[i]['prim'][0]) for i in ids(w)]


def test_version_endpoint_and_envelope_engine(api):
    v = api.get('/api/v3/version').json()
    assert v['engine_phase'] == build_info.ENGINE_PHASE and v['engine_build'] == build_info.ENGINE_BUILD and v['schema_version']
    r = api.post('/api/v3/workouts/generate', json=app_request('strength')).json()
    assert r['engine'] == dict(phase=build_info.ENGINE_PHASE, build=build_info.ENGINE_BUILD)


@pytest.mark.parametrize('m', ['chest', 'back', 'quads', 'hamstrings', 'glutes'])
def test_single_target_production_path(api, m):
    req = app_request('strength', target=[m])
    assert 'archetype' not in req
    w = gen(api, direction='strength', target=[m])
    assert w['archetype']['id'] == 'strength_custom_target' and w['selection_source'] == 'target'
    assert w['target']['mode'] == 'explicit' and w['target']['muscles'] == [m]
    assert set(muscles(w)) == {m}                     # every movement is classified as that muscle's work (no triceps / arms slots)
    assert api.get(f"/api/v3/workouts/{w['workout_id']}").json()['workout']['archetype']['id'] == 'strength_custom_target'


def test_chest_has_no_triceps_work(api):
    w = gen(api, direction='strength', target=['chest'])
    assert not any(AE.roll(AE.EX[i]['prim'][0]) == 'triceps' for i in ids(w))
    assert not any('triceps' in it['exercise']['name'].lower() for b in w['blocks'] for it in b['items'])


@pytest.mark.parametrize('tgt', [['chest'], ['back', 'core'], ['glutes']])
def test_custom_target_different_workout_http(api, tgt):
    w = gen(api, direction='strength', target=tgt); wid = w['workout_id']; seen = [ids(w)]
    for k in range(1, 4):
        r = api.post(f'/api/v3/workouts/{wid}/swap-workout'); assert r.status_code == 200
        env = r.json(); assert env['status'] == 'ok'
        w2 = env['workout']
        assert w2['workout_id'] == wid and w2['swap_count'] == k and w2['selection_source'] == 'target'
        assert ids(w2) != seen[-1]
        assert sum(1 for x in ids(w2) if x not in seen[-1]) / len(ids(w2)) >= 0.5
        assert set(muscles(w2)) == set(tgt)
        # persistence: GET returns exactly what Different Workout returned (the app reopens / Details reads this)
        assert ids(api.get(f'/api/v3/workouts/{wid}').json()['workout']) == ids(w2)
        seen.append(ids(w2))


def test_explicit_type_and_moods_pick_http(api):
    w = gen(api, direction='strength', archetype='strength_lower_squat')
    w2 = api.post(f"/api/v3/workouts/{w['workout_id']}/swap-workout").json()['workout']
    assert w2['archetype']['id'] == 'strength_lower_squat' and w2['selection_source'] == 'user_selected'
    assert sum(1 for x in ids(w2) if x not in ids(w)) / len(ids(w2)) >= 0.5
    for d in ('strength', 'sweat', 'athletic'):
        w = gen(api, direction=d)
        w2 = api.post(f"/api/v3/workouts/{w['workout_id']}/swap-workout").json()['workout']
        assert w['selection_source'] == 'moods_pick' and w2['archetype']['id'] != w['archetype']['id']
        assert w2['built_for_today'][0]['code'] == 'rotation_swap'


@pytest.mark.parametrize('states,dur', [([], 60), (['irritated'], 60), (['amped'], 60), (['stressed'], 60), ([], 30)])
def test_live_hybrid_structure(api, states, dur):
    w = gen(api, direction='sweat', archetype='sweat_hybrid', states=states, duration=dur)
    titles = [b['title'] for b in w['blocks']]
    assert w['blocks'][0]['structure'] == 'anchor_circuit' and 'Complement' not in titles
    assert set(titles) <= {'Hybrid', 'Finisher'}
    assert sum(len(b['items']) for b in w['blocks']) <= 8
    assert w['duration']['estimated_minutes'] <= (46.5 if dur == 60 else 28.5)


CONFIRMATION = ('You picked', 'You chose', 'Your first ')


@pytest.mark.parametrize('kw', [dict(direction='sweat', archetype='sweat_hybrid'), dict(direction='athletic', archetype='athletic_power'),
                                dict(direction='strength', target=['chest']), dict(direction='strength'), dict(direction='strength', target=['back', 'core'])])
def test_built_for_today_has_no_confirmations(api, kw):
    w = gen(api, **kw)
    assert len(w['built_for_today']) <= explain.MAX_LINES
    assert not any(l['text'].startswith(CONFIRMATION) for l in w['built_for_today']), w['built_for_today']
    for l in w['built_for_today']: assert not explain.lint(l['text'])


def test_teaser_only_when_meaningful(api):
    assert gen(api, direction='sweat', archetype='sweat_hybrid')['today']['teaser'] is None
    assert gen(api, direction='strength', target=['chest'])['today']['teaser'] is None
    t = gen(api, direction='strength', states=['amped'])['today']['teaser']
    assert t['title'] == 'Built for your Amped state' and t['text']
    t = gen(api, direction='strength', target=['back', 'core'])['today']['teaser']
    assert t['title'] == 'Built around Back + Core' and 'Core saved for the end' in t['text']
    t = gen(api, direction='strength', states=['sore'], soreness=['legs'])['today']['teaser']
    assert t['title'].startswith('Built around sore')
