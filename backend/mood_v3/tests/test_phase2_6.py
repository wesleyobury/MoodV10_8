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


CONFIRMATION = ('You picked', 'You chose')


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


# ------------------------------------------------------------------ Phase 2.6 addendum: Difficulty (= session experience)
from mood_v3.engines.athletic import adapter as AA


def profile_experience(api):
    return api.db.users.docs[0]['training_profile']['experience']


@pytest.fixture()
def api_int(api):
    api.db.users.docs[0]['training_profile']['experience'] = 'intermediate'
    return api


def post(api, **kw):
    r = api.post('/api/v3/workouts/generate', json=kw); assert r.status_code == 200, r.text
    env = r.json(); assert env['status'] == 'ok', env.get('conflict'); return env


def test_difficulty_defaults_to_profile_and_override_is_today_only(api_int):
    env = post(api_int, **app_request('strength'))
    assert env['workout']['experience'] == 'intermediate' and 'experience' in env['profile_defaults_applied']
    for lvl in ('beginner', 'advanced'):
        env = post(api_int, **dict(app_request('strength'), experience=lvl))
        assert env['workout']['experience'] == lvl and 'experience' not in env['profile_defaults_applied']
        assert profile_experience(api_int) == 'intermediate'            # the Training Profile is never written
    env = post(api_int, **app_request('strength'))                     # a fresh request defaults back to the profile
    assert env['workout']['experience'] == 'intermediate'


@pytest.mark.parametrize('arch', ['strength_upper_push', 'strength_lower_squat', 'strength_full_body', None])
def test_strength_beginner_rules_enforced(api_int, arch):
    env = post(api_int, **dict(app_request('strength', archetype=arch), experience='beginner'))
    ex = [AE.EX[i] for i in ids(env['workout'])]
    assert all(e['skill'] == 'beginner' and e['cx'] <= AE.CAP['beginner'] for e in ex)
    line = next(l for l in env['workout']['built_for_today'] if l['code'] == 'difficulty')
    assert line['kind'] == 'adaptation' and line['text'].startswith('Beginner difficulty')


@pytest.mark.parametrize('arch', ['athletic_power', 'athletic_speed_agility', 'athletic_full_body'])
@pytest.mark.parametrize('day', ['2026-09-26', '2026-09-27', '2026-09-28'])
def test_athletic_beginner_safety_rules(api_int, arch, day):
    env = post(api_int, **dict(app_request('athletic', archetype=arch), experience='beginner', date=day))
    w = env['workout']; ex = [AA.EX[i] for i in ids(w)]
    assert all(e['impact'] != 'high' for e in ex)
    assert all(e['skill'] == 'beginner' for e in ex)
    assert not any(AA.G.quality(e) in ('olympic', 'loaded_jump') for e in ex)
    assert not any(b['structure'] == 'repeats' for b in w['blocks'])
    assert next(l for l in w['built_for_today'] if l['code'] == 'difficulty')['kind'] == 'adaptation'


def test_athletic_advanced_keeps_complex_power_available(api_int):
    seen = set()
    for day in ('2026-09-26', '2026-09-27', '2026-09-28', '2026-09-29'):
        w = post(api_int, **dict(app_request('athletic', archetype='athletic_power'), experience='advanced', date=day))['workout']
        seen |= {i for i in ids(w) if AA.EX[i]['skill'] == 'advanced' or AA.EX[i]['impact'] == 'high' or AA.EX[i]['cx'] > 3}
    assert seen                                                         # advanced-only movements reach real sessions
    w = post(api_int, **dict(app_request('athletic', archetype='athletic_power'), experience='intermediate'))['workout']
    assert not any(AA.EX[i]['impact'] == 'high' for i in ids(w))


def test_sweat_difficulty_changes_dosing(api_int):
    def rest(lvl):
        w = post(api_int, **dict(app_request('sweat', archetype='sweat_circuit'), experience=lvl))['workout']
        return w['blocks'][0].get('rest_between_rounds_sec'), next(l for l in w['built_for_today'] if l['code'] == 'difficulty')
    rb, lb = rest('beginner'); ra, la = rest('advanced')
    assert rb and ra and rb > ra
    assert lb['text'].startswith('Beginner dosing') and la['text'].startswith('Advanced dosing')


# ------------------------------------------------------------------ Phase 2.6 addendum: Built for Today on every workout
GRID = [dict(direction=d, **kw) for d in ('strength', 'sweat', 'athletic') for kw in (dict(), dict(states=['amped']), dict(states=['stressed']))] + [
    dict(direction='strength', target=['chest']), dict(direction='strength', target=['back', 'core']),
    dict(direction='sweat', archetype='sweat_hybrid'), dict(direction='athletic', archetype='athletic_power')]


@pytest.mark.parametrize('kw', GRID)
def test_built_for_today_always_rich_ordered_and_truthful(api_int, kw):
    w = gen(api_int, **kw)
    lines = w['built_for_today']
    assert 3 <= len(lines) <= explain.MAX_LINES
    ranks = [explain.KIND_RANK[l['kind']] for l in lines]
    assert ranks == sorted(ranks)                                       # adaptation, then decision, then context
    for l in lines:
        t = l['text'].lower()
        assert not explain.lint(l['text'])
        assert not any(x in t for x in ('rep range', 'hypertrophy', 'you picked', 'you chose'))
        if l['code'] == 'goal':
            assert l['kind'] == 'context'
    if kw.get('states'):
        assert lines[0]['kind'] == 'adaptation'
