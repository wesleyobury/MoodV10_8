"""Unit tests for v3_tracking (server events + user milestones). In-memory Mongo (mongomock-motor), no server needed."""
import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone

import pytest
from bson import ObjectId

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
mongomock_motor = pytest.importorskip("mongomock_motor")

import v3_tracking as T  # noqa: E402


def run(coro):
    return asyncio.run(coro)


def fresh_db():
    return mongomock_motor.AsyncMongoMockClient()["t"]


def test_milestone_mapping():
    assert T.milestone_for_event("v3_workout_generated", {"status": "ok"}) == "first_workout_generated_at"
    assert T.milestone_for_event("v3_workout_generated", {"status": "conflict"}) is None
    assert T.milestone_for_event("workout_completed", {}) == "first_workout_completed_at"
    assert T.milestone_for_event("paywall_viewed", {}) == "first_paywall_at"
    assert T.milestone_for_event("purchase_completed", {"is_trial": True}) == "trial_started_at"
    assert T.milestone_for_event("purchase_completed", {"is_trial": False}) == "first_paid_at"
    assert T.milestone_for_event("subscription_started", {"plan_id": "com.mood.subscription.annual"}) == "trial_started_at"
    assert T.milestone_for_event("subscription_started", {"plan_id": "com.mood.subscription.founding_annual"}) == "first_paid_at"
    assert T.milestone_for_event("subscription_renewed", {}) == "first_paid_at"
    assert T.milestone_for_event("v3_home_viewed", {}) is None


def test_stamp_milestone_only_once():
    db = fresh_db()
    uid = ObjectId()

    async def go():
        await db.users.insert_one({"_id": uid})
        t1 = datetime(2026, 10, 1, tzinfo=timezone.utc)
        assert await T.stamp_milestone(db, str(uid), "first_paywall_at", t1) is True
        assert await T.stamp_milestone(db, str(uid), "first_paywall_at", t1 + timedelta(days=1)) is False
        u = await db.users.find_one({"_id": uid})
        return u["milestones"]["first_paywall_at"].replace(tzinfo=timezone.utc)

    assert run(go()) == datetime(2026, 10, 1, tzinfo=timezone.utc)


def test_classify_start_attempt():
    # brand new user
    a, up = T.classify_start_attempt({}, "v3:w1", True, "first_workout")
    assert a == "first" and up["first_workout_started_key"] == "v3:w1"
    ms = {"first_workout_started_at": datetime.now(timezone.utc), "first_workout_started_key": "v3:w1"}
    # same workout again
    assert T.classify_start_attempt(ms, "v3:w1", True, "same_workout")[0] == "repeat_first"
    # a different workout = the workout #2 attempt, blocked or allowed
    a, up = T.classify_start_attempt(ms, "v3:w2", False, "second_workout")
    assert a == "second_plus" and up == {"second_workout_attempted_at": True}
    # V2 veteran without milestones is never a "first" start
    assert T.classify_start_attempt({}, "v3:w9", True, "entitled", workouts_completed=12)[0] == "second_plus"
    assert T.classify_start_attempt({}, None, True, "first_workout", legacy=True)[0] == "legacy"


def test_record_start_gate_flow(monkeypatch):
    db = fresh_db()
    uid = ObjectId()
    events = []

    async def fake_track(db_, user_id, event_type, md):
        events.append((event_type, md))

    monkeypatch.setattr(T, "track_server_event", fake_track)

    async def go():
        await db.users.insert_one({"_id": uid, "workouts_count": 0})
        u = await db.users.find_one({"_id": uid})
        await T.record_start_gate(db, u, str(uid), 200, {"outcome": "first_workout", "reason": "none", "free_workouts_remaining": 0}, "w1", "v3")
        u = await db.users.find_one({"_id": uid})
        await T.record_start_gate(db, u, str(uid), 402, {"detail": {"outcome": "second_workout", "reason": "none"}}, "w2", "v3")
        await T.record_start_gate(db, u, str(uid), 404, "User not found", "w3", "v3")  # ignored
        return await db.users.find_one({"_id": uid})

    u = run(go())
    assert "first_workout_started_at" in u["milestones"] and u["milestones"]["first_workout_started_key"] == "v3:w1"
    assert "second_workout_attempted_at" in u["milestones"]
    assert [e[0] for e in events] == ["workout_start_gate", "workout_start_gate"]
    assert events[0][1]["attempt"] == "first" and events[0][1]["allowed"] is True
    assert events[1][1]["attempt"] == "second_plus" and events[1][1]["allowed"] is False


def test_track_user_event_stamps_milestones():
    import user_analytics
    db = fresh_db()
    uid = ObjectId()

    async def go():
        await db.users.insert_one({"_id": uid})
        await user_analytics.track_user_event(db, str(uid), "workout_completed", {"source": "v3"})
        await user_analytics.track_user_event(db, str(uid), "v3_home_viewed", {})
        return await db.users.find_one({"_id": uid}), await db.user_events.count_documents({})

    u, n = run(go())
    assert n == 2
    assert set(u["milestones"]) == {"first_workout_completed_at"}


def test_backfill_milestones_idempotent():
    db = fresh_db()
    uid = ObjectId()
    t0 = datetime(2026, 6, 1, tzinfo=timezone.utc)

    async def go():
        await db.users.insert_one({"_id": uid, "training_profile": {"completed_at": t0 + timedelta(days=30)}})
        await db.user_events.insert_many([
            {"user_id": str(uid), "event_type": "workout_started", "timestamp": t0 + timedelta(days=2), "metadata": {}},
            {"user_id": str(uid), "event_type": "workout_started", "timestamp": t0, "metadata": {}},
            {"user_id": str(uid), "event_type": "workout_completed", "timestamp": t0 + timedelta(hours=1), "metadata": {}},
            {"user_id": "guest_ios_1", "event_type": "paywall_viewed", "timestamp": t0, "metadata": {}},
        ])
        c1 = await T.backfill_milestones(db)
        c2 = await T.backfill_milestones(db)
        return c1, c2, await db.users.find_one({"_id": uid})

    c1, c2, u = run(go())
    ms = u["milestones"]
    assert ms["first_workout_started_at"].replace(tzinfo=timezone.utc) == t0
    assert ms["second_workout_attempted_at"].replace(tzinfo=timezone.utc) == t0 + timedelta(days=2)
    assert "v3_onboarded_at" in ms and "first_paywall_at" not in ms
    assert c1["first_workout_completed_at"] == 1 and sum(c2.values()) == 0
