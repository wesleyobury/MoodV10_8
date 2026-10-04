"""One free workout per ISO week, claimed at START; paywall on starting a second one that week (Oct 2026).

Covers entitlement.start_decision (pure) and start_gate.gate_workout_start (claim
writes) against the in-memory Motor stand-in used by the V3 completion tests.
"""
import asyncio
from datetime import datetime, timedelta, timezone

import entitlement as E
from start_gate import gate_workout_start
from mood_v3.tests.test_v3_completion import _Col

T0 = datetime(2026, 10, 5, 12, 0, tzinfo=timezone.utc)


class _DB:
    def __init__(self):
        self.users = _Col(); self.v3_workouts = _Col()


def _db(user=None):
    db = _DB()
    db.users.docs.append({'_id': 'u1', **(user or {})})
    return db


def _start(db, wid, now=T0, source='v3', admin=False):
    async def load():
        return await db.users.find_one({'_id': 'u1'})
    return asyncio.run(gate_workout_start(db, {'_id': 'u1'}, 'u1', load, admin, wid, source if wid else None, now=now))


def _claim(db):
    return db.users.docs[0].get(E.FIRST_FREE_WORKOUT_FIELD)


ACTIVE = {'subscription': {'status': 'active', 'expiration_date': '2099-01-01T00:00:00+00:00'}}
LAPSED = {'subscription': {'status': 'active', 'expiration_date': '2020-01-01T00:00:00+00:00'}}


def test_first_start_is_free_and_claimed_server_side():
    db = _db()
    st, body = _start(db, 'A')
    assert st == 200 and body['outcome'] == 'first_workout' and body['free_workouts_remaining'] == 0
    assert _claim(db)['key'] == 'v3:A'


def test_reopening_or_resuming_the_first_workout_never_counts_as_a_second():
    db = _db()
    _start(db, 'A')
    for later in (timedelta(minutes=1), timedelta(hours=3), timedelta(days=3)):
        st, body = _start(db, 'A', now=T0 + later)
        assert st == 200 and body['outcome'] == 'same_workout'
    assert _claim(db)['key'] == 'v3:A'


def test_second_workout_start_hits_the_paywall():
    db = _db()
    _start(db, 'A')
    st, body = _start(db, 'B', now=T0 + timedelta(hours=2))
    assert st == 402
    assert body['detail']['error'] == 'payment_required' and body['detail']['trigger'] == 'start_workout_after_free_session'
    assert body['detail']['outcome'] == 'second_workout' and _claim(db)['key'] == 'v3:A'


def test_switching_right_after_an_accidental_start_moves_the_claim():
    db = _db()
    _start(db, 'A')
    st, body = _start(db, 'B', now=T0 + timedelta(minutes=5))
    assert st == 200 and body['outcome'] == 'switch_grace'
    assert _claim(db)['key'] == 'v3:B' and _claim(db)['moved_count'] == 1
    # A is now workout #2
    st, _ = _start(db, 'A', now=T0 + timedelta(hours=1))
    assert st == 402


def test_no_switch_grace_once_the_first_workout_was_completed():
    db = _db()
    _start(db, 'A')
    db.v3_workouts.docs.append({'_id': 'A', 'user_id': 'u1', 'status': 'completed'})
    st, _ = _start(db, 'B', now=T0 + timedelta(minutes=2))
    assert st == 402


def test_entitled_users_bypass_and_lapsed_users_hit_the_gate():
    db = _db(ACTIVE)
    for i, wid in enumerate(['A', 'B', 'C']):
        st, body = _start(db, wid, now=T0 + timedelta(hours=i))
        assert st == 200 and body['outcome'] == 'entitled' and body['free_workouts_remaining'] is None
    assert _claim(db)['key'] == 'v3:A'   # the first start is still recorded
    db.users.docs[0].update(LAPSED)
    assert _start(db, 'D', now=T0 + timedelta(days=2))[0] == 402
    assert _start(db, 'A', now=T0 + timedelta(days=2))[0] == 200   # their first workout stays reopenable


def test_admin_always_passes():
    db = _db({E.FIRST_FREE_WORKOUT_FIELD: E.first_workout_claim_doc('v3:A', 'v3', T0)})
    st, body = _start(db, 'B', now=T0 + timedelta(days=1), admin=True)
    assert st == 200 and body['outcome'] == 'entitled'


def test_legacy_keyless_starts_share_one_session_window():
    db = _db()
    assert _start(db, None)[1]['outcome'] == 'first_workout'
    assert _claim(db)['key'] == E.LEGACY_KEY
    assert _start(db, None, now=T0 + timedelta(minutes=50))[0] == 200     # V2 calls the gate again on Complete
    assert _start(db, None, now=T0 + timedelta(hours=5))[0] == 402
    assert _start(db, 'X', now=T0 + timedelta(hours=5))[0] == 402


def test_entitlement_helpers_follow_the_claim():
    now = datetime.now(timezone.utc)
    u = {}
    assert E.free_workouts_remaining(u) == 1 and E.can_start_workout(u)
    u[E.FIRST_FREE_WORKOUT_FIELD] = E.first_workout_claim_doc('v3:A', 'v3', now)
    assert E.free_workouts_remaining(u) == 0 and not E.can_start_workout(u)
    assert E.can_start_workout({**u, **ACTIVE})
    # a claim from an earlier week is stale: the allowance is back
    u[E.FIRST_FREE_WORKOUT_FIELD] = E.first_workout_claim_doc('v3:A', 'v3', now - timedelta(days=8))
    assert E.free_workouts_remaining(u) == 1 and E.can_start_workout(u)


def test_the_free_workout_comes_back_every_monday():
    db = _db()
    _start(db, 'A')                                               # Monday: free
    assert _start(db, 'B', now=T0 + timedelta(days=4))[0] == 402  # Friday, same week: paywall
    st, body = _start(db, 'B', now=T0 + timedelta(days=7))        # next Monday: free again
    assert st == 200 and body['outcome'] == 'first_workout' and _claim(db)['key'] == 'v3:B'
    assert _start(db, 'C', now=T0 + timedelta(days=8))[0] == 402
    assert body['free_workouts_reset_at'] is not None


def test_pure_decision_table():
    claim = {E.FIRST_FREE_WORKOUT_FIELD: E.first_workout_claim_doc('v3:A', 'v3', T0)}
    d = lambda user, key, mins, done=False: E.start_decision(user, False, key, claimed_completed=done, now=T0 + timedelta(minutes=mins))
    assert d({}, 'v3:A', 0) == (True, 'first_workout')
    assert d(claim, 'v3:A', 3_000) == (True, 'same_workout')
    assert d(claim, 'v3:B', 7 * 24 * 60) == (True, 'first_workout')   # next week
    assert d(claim, 'v3:B', 14) == (True, 'switch_grace')
    assert d(claim, 'v3:B', 16) == (False, 'second_workout')
    assert d(claim, 'v3:B', 1, done=True) == (False, 'second_workout')
