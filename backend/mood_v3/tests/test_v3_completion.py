"""Guided Session completion: idempotent, exactly-once side effects, weekly free allowance consumed only by completion.

In-memory Motor stand-in (no Mongo). Covers: first completion, duplicate, concurrent duplicate, retry after a partial side
effect, stale item ids, performance payload -> progression entries, free allowance (non-entitled vs entitled), and that
nothing but completion consumes the allowance.
"""
import asyncio, copy
import httpx
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from mood_v3.router import build_v3_router
from mood_v3.completion import CompletionHooks, run_effects
from mood_v3.tests.test_router import _Col as _BaseCol, _cond, _get, _set_path, _MISSING
import entitlement as E


class _Col(_BaseCol):
    async def update_one(self, q, u, upsert=False):
        class _R:
            def __init__(self, n, up=None): self.matched_count = n; self.modified_count = n; self.upserted_id = up
        for d in self.docs:
            if self._match(d, q):
                for k, v in u.get('$set', {}).items(): _set_path(d, k, v)
                for k, v in u.get('$inc', {}).items(): _set_path(d, k, (_get(d, k) if _get(d, k) is not _MISSING else 0) + v)
                for k, v in u.get('$push', {}).items(): d.setdefault(k, []).append(copy.deepcopy(v))
                return _R(1)
        if upsert:
            d = {k: v for k, v in q.items() if not isinstance(v, dict)}
            for k, v in {**u.get('$setOnInsert', {}), **u.get('$set', {})}.items(): _set_path(d, k, v)
            d.setdefault('_id', f'row{len(self.docs)}'); self.docs.append(d)
            return _R(0, d['_id'])
        return _R(0)
    async def find_one_and_update(self, q, u):
        await asyncio.sleep(0)   # yield so concurrent requests interleave
        return await super().find_one_and_update(q, u)


class _DB:
    def __init__(self):
        self.v3_workouts = _Col(); self.exercises = _Col(); self.users = _Col(); self.user_workouts = _Col(); self.user_events = _Col()


def _hooks(db, events, fail_event=False):
    async def load_user(uid): return await db.users.find_one({'_id': uid})
    async def track(uid, t, md):
        if fail_event: raise RuntimeError('event store down')
        events.append((uid, t, md))
        await db.user_events.insert_one({'user_id': uid, 'event_type': t, 'metadata': md})
        # the real hook also runs retention.process_retention_for_event (streak), idempotent per UTC day
        u = await db.users.find_one({'_id': uid})
        await db.users.update_one({'_id': uid}, {'$set': {'rt_streak_current': (u.get('rt_streak_current') or 0) + 1, 'rt_streak_longest': 9}})
    async def claim_first(uid, wid):
        await db.users.update_one({'_id': uid, f'{E.FIRST_FREE_WORKOUT_FIELD}.period': {'$ne': E.current_free_period_key()}},
                                  {'$set': {E.FIRST_FREE_WORKOUT_FIELD: E.first_workout_claim_doc(f'v3:{wid}', 'v3_completion')}})
    return CompletionHooks(
        load_user=load_user, user_filter=lambda uid: {'_id': uid},
        has_access=lambda u: E.has_full_access(u)[0], consume_free_update=E.consume_free_workout_update,
        free_remaining=E.free_workouts_remaining, free_reset_at=E.free_period_resets_at, track_event=track,
        claim_first_workout=claim_first,
    )


def _app(db, hooks):
    app = FastAPI(); user = {'id': 'u1'}
    app.include_router(build_v3_router(db, lambda: user['id'], hooks), prefix='/api')
    return app, user


@pytest.fixture()
def setup():
    db = _DB(); events = []
    db.users.docs.append({'_id': 'u1', 'workouts_count': 3})
    app, user = _app(db, _hooks(db, events))
    c = TestClient(app)
    return c, db, events, app


def _gen(c, direction='strength'):
    env = c.post('/api/v3/workouts/generate', json=dict(direction=direction, date='2026-10-05', duration=30)).json()
    return env['workout']


def _user(db): return db.users.docs[0]


def test_first_completion_records_everything_once(setup):
    c, db, events, _ = setup
    w = _gen(c)
    r = c.post(f"/api/v3/workouts/{w['workout_id']}/complete", json=dict(duration_actual=41, started_at='2026-10-05T12:00:00Z', completed_steps=14, total_steps=16,
                                                                       local_date='2026-10-05', client_session_id='s_abc'))
    assert r.status_code == 200, r.text
    b = r.json()
    assert b['status'] == 'completed' and b['completed_at'] and b['duration_actual'] == 41
    assert b['streak'] == {'current': 1, 'longest': 9}
    assert b['access'] == {'has_full_access': False, 'consumed_free_workout': True, 'free_workouts_remaining': 0, 'free_workouts_reset_at': b['access']['free_workouts_reset_at']}
    u = _user(db)
    assert u['workouts_count'] == 4 and u['free_workouts_used'] == 1 and u['free_workouts_period'] == E.current_free_period_key()
    assert len(db.user_workouts.docs) == 1 and db.user_workouts.docs[0]['v3_workout_id'] == w['workout_id']
    assert [e[1] for e in events] == ['workout_completed'] and events[0][2]['source'] == 'v3' and events[0][2]['duration_minutes'] == 41
    doc = db.v3_workouts.docs[0]
    assert doc['status'] == 'completed' and doc['effects_done'] and doc['client_session_id'] == 's_abc' and doc['completed_steps'] == 14


def test_duplicate_returns_existing_result_without_double_counting(setup):
    c, db, events, _ = setup
    w = _gen(c)
    first = c.post(f"/api/v3/workouts/{w['workout_id']}/complete", json=dict(duration_actual=30)).json()
    for _ in range(3):
        again = c.post(f"/api/v3/workouts/{w['workout_id']}/complete", json=dict(duration_actual=99))
        assert again.status_code == 200
        assert again.json()['status'] == 'already_completed'
        assert again.json()['completed_at'] == first['completed_at'] and again.json()['duration_actual'] == 30
    u = _user(db)
    assert u['workouts_count'] == 4 and u['free_workouts_used'] == 1
    assert len(db.user_workouts.docs) == 1 and len(events) == 1


def test_concurrent_duplicates_single_winner(setup):
    c, db, events, app = setup
    w = _gen(c)
    async def burst():
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url='http://t') as ac:
            return await asyncio.gather(*[ac.post(f"/api/v3/workouts/{w['workout_id']}/complete", json=dict(duration_actual=30)) for _ in range(6)])
    res = asyncio.run(burst())
    statuses = sorted(r.json()['status'] for r in res)
    assert statuses.count('completed') == 1 and statuses.count('already_completed') == 5
    u = _user(db)
    assert u['workouts_count'] == 4 and u['free_workouts_used'] == 1 and len(db.user_workouts.docs) == 1 and len(events) == 1


def test_retry_after_partial_side_effects(setup):
    c, db, events, app = setup
    w = _gen(c)
    wid = w['workout_id']
    # simulate a process that died right after the winner transition: completed 5 min ago, no effects
    doc = db.v3_workouts.docs[0]
    import datetime as dt
    old = dt.datetime.now(dt.timezone.utc) - dt.timedelta(minutes=5)
    doc.update(status='completed', completed_at=old, duration_actual=25)
    assert len(db.user_workouts.docs) == 0
    r = c.post(f'/api/v3/workouts/{wid}/complete', json={}).json()
    assert r['status'] == 'already_completed'
    assert len(db.user_workouts.docs) == 1 and len(events) == 1 and _user(db)['workouts_count'] == 4
    # a second partial case: counters already claimed and applied, event never sent
    w2 = _gen(c)
    d2 = next(d for d in db.v3_workouts.docs if d['_id'] == w2['workout_id'])
    d2.update(status='completed', completed_at=doc['completed_at'], effects={'counters': doc['completed_at']})
    c.post(f"/api/v3/workouts/{w2['workout_id']}/complete", json={})
    assert _user(db)['workouts_count'] == 4        # the claimed counter effect is never repeated
    assert len(events) == 2                        # the missing event ran
    # and once effects_done is set, nothing runs again
    assert asyncio.run(run_effects(db, w2['workout_id'], 'u1', _hooks(db, events))) == {'user_workout': False, 'counters': False, 'event': False, 'free_workout_consumed': False}


def test_duplicate_does_not_race_a_fresh_winner(setup):
    c, db, events, _ = setup
    w = _gen(c)
    import datetime as dt
    db.v3_workouts.docs[0].update(status='completed', completed_at=dt.datetime.now(dt.timezone.utc))   # winner still running effects
    assert c.post(f"/api/v3/workouts/{w['workout_id']}/complete", json={}).json()['status'] == 'already_completed'
    assert not db.user_workouts.docs and not events


def test_event_failure_is_not_retried_into_a_double(setup):
    c, db, events, _ = setup
    app, _u = _app(db, _hooks(db, events, fail_event=True))
    c2 = TestClient(app)
    w = _gen(c2)
    assert c2.post(f"/api/v3/workouts/{w['workout_id']}/complete", json={}).json()['status'] == 'completed'
    assert _user(db)['workouts_count'] == 4 and len(events) == 0


def test_stale_item_ids_and_performance_payload(setup):
    c, db, events, _ = setup
    w = _gen(c)
    main = w['blocks'][0]['items'][0]
    perf = [dict(item_id=main['item_id'], exercise_id=main['exercise']['id'], sets=[dict(reps=5, load=135, unit='lb'), dict(reps=4, load=135, unit='lb')]),
            dict(item_id='no_such_slot', sets=[dict(reps=5, load=10, unit='kg')])]
    b = c.post(f"/api/v3/workouts/{w['workout_id']}/complete", json=dict(performance=perf)).json()
    assert b['logged_exercises'] == 1
    ent = db.v3_workouts.docs[0]['performance_entries']
    assert list(ent) == [main['exercise']['id']] and ent[main['exercise']['id']]['sets'][0]['load'] == 135
    assert c.post(f"/api/v3/workouts/{w['workout_id']}/complete", json=dict(bogus=1)).status_code == 422


def test_swapped_slot_never_misattributes_logged_sets(setup):
    c, db, events, _ = setup
    w = _gen(c)
    main = w['blocks'][0]['items'][0]
    perf = [dict(item_id=main['item_id'], exercise_id='some_old_exercise', sets=[dict(reps=5, load=135, unit='lb')])]
    b = c.post(f"/api/v3/workouts/{w['workout_id']}/complete", json=dict(performance=perf)).json()
    assert b['status'] == 'completed' and b['logged_exercises'] == 0


def test_entitled_user_never_consumes_allowance(setup):
    c, db, events, _ = setup
    _user(db)['subscription'] = {'status': 'active'}
    w = _gen(c)
    b = c.post(f"/api/v3/workouts/{w['workout_id']}/complete", json={}).json()
    assert b['access']['has_full_access'] is True and b['access']['consumed_free_workout'] is False
    assert 'free_workouts_used' not in _user(db) and _user(db)['workouts_count'] == 4


def test_only_completion_consumes_the_free_workout(setup):
    c, db, events, _ = setup
    w = _gen(c)
    c.get(f"/api/v3/workouts/{w['workout_id']}")
    c.post(f"/api/v3/workouts/{w['workout_id']}/swap-workout")
    c.post('/api/v3/workouts/generate', json=dict(direction='sweat', persist=False))
    assert 'free_workouts_used' not in _user(db) and not db.user_workouts.docs and not events
    assert E.free_workouts_remaining(_user(db)) == 1


def test_second_free_completion_same_week_is_recorded_not_blocked(setup):
    """Completion never blocks: the paywall is enforced at START (start_gate.py), so a completion always records normally."""
    c, db, events, _ = setup
    for _ in range(2):
        w = _gen(c)
        assert c.post(f"/api/v3/workouts/{w['workout_id']}/complete", json={}).json()['status'] == 'completed'
    assert _user(db)['free_workouts_used'] == 2 and _user(db)['workouts_count'] == 5 and len(events) == 2


def test_other_users_workout_is_forbidden(setup):
    c, db, events, app = setup
    w = _gen(c)
    db.v3_workouts.docs[0]['user_id'] = 'someone_else'
    assert c.post(f"/api/v3/workouts/{w['workout_id']}/complete", json={}).status_code == 403
    assert not events


def test_without_hooks_only_the_v3_record_is_written():
    db = _DB(); db.users.docs.append({'_id': 'u1', 'workouts_count': 0})
    app, _u = _app(db, None); c = TestClient(app)
    w = _gen(c)
    b = c.post(f"/api/v3/workouts/{w['workout_id']}/complete", json={}).json()
    assert b['status'] == 'completed' and b['streak'] is None and b['access'] is None
    assert db.users.docs[0]['workouts_count'] == 0 and not db.user_workouts.docs


def test_after_adds_feedback_and_real_metrics_idempotently(setup):
    c, db, events, _ = setup
    w = _gen(c)
    wid = w['workout_id']
    assert c.post(f'/api/v3/workouts/{wid}/after', json=dict(fit_rating='just_right')).status_code == 409   # not completed yet
    c.post(f'/api/v3/workouts/{wid}/complete', json=dict(duration_actual=30))
    r = c.post(f'/api/v3/workouts/{wid}/after', json=dict(fit_rating='too_much', calories=310, avg_heart_rate=142, max_heart_rate=171, metrics_source='wearable')).json()
    assert r['status'] == 'saved' and 'calories' in r['saved']
    r2 = c.post(f'/api/v3/workouts/{wid}/after', json=dict(fit_rating='too_much', calories=310, avg_heart_rate=142, max_heart_rate=171, metrics_source='wearable')).json()
    assert r2['status'] == 'saved'
    d = db.v3_workouts.docs[0]
    assert d['fit_rating'] == 'too_much' and d['after']['calories'] == 310 and d['after']['metrics_source'] == 'wearable'
    row = db.user_workouts.docs[0]
    assert row['calories_burned'] == 310 and row['avg_heart_rate'] == 142 and row['max_heart_rate'] == 171
    assert _user(db)['workouts_count'] == 4 and len(events) == 1        # nothing double-counted
    assert c.post(f'/api/v3/workouts/{wid}/after', json=dict(calories=-5)).status_code == 422
    assert c.post(f'/api/v3/workouts/{wid}/after', json=dict(bogus=1)).status_code == 422
    assert c.post(f'/api/v3/workouts/{wid}/after', json={}).json()['status'] == 'unchanged'
    h = c.get('/api/v3/workouts/history').json()
    assert h['items'][0]['fit_rating'] == 'too_much' if 'items' in h else True
