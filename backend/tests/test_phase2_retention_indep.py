"""
Independent verification (T1 agent) of Phase 2 retention engine + Phase 1
regression. Different test surface than the canonical test_phase2_retention.py,
written from scratch to cross-check the implementation.

Run:  cd /app/backend && python -m pytest tests/test_phase2_retention_indep.py -v
"""
import os
import time
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta

import pytest
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import ObjectId

load_dotenv("/app/backend/.env")

BASE = "http://localhost:8001/api"
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]


def _http(method, path, token=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or "{}")
        except Exception:
            return e.code, {}


def _utc_day(offset=0):
    return (datetime.now(timezone.utc) + timedelta(days=offset)).strftime("%Y-%m-%d")


@pytest.fixture(scope="module")
def mongo():
    mc = MongoClient(MONGO_URL)
    db = mc[DB_NAME]
    yield db
    mc.close()


@pytest.fixture
def fresh_user(mongo):
    """Register a fresh user and yield (token, uid). Cleanup user_events + user."""
    created = []

    def _make():
        sid = int(time.time() * 1_000_000)
        u = f"indrt_{sid}"
        s, b = _http("POST", "/auth/register", body={
            "username": u, "email": f"{u}@example.com",
            "password": "TestPass1234567$", "name": "Indep RT", "terms_accepted": True,
        })
        assert s == 200, f"register failed {s} {b}"
        created.append(b["user_id"])
        return b["token"], b["user_id"]

    yield _make

    for uid in created:
        try:
            mongo.users.delete_one({"_id": ObjectId(uid)})
        except Exception:
            pass
        mongo.user_events.delete_many({"user_id": uid})


def _latest(mongo, uid, et):
    return mongo.user_events.find_one({"user_id": uid, "event_type": et}, sort=[("timestamp", -1)])


# ─────────────── Retention engine ───────────────

class TestRetentionStreaks:

    def test_first_ever_workout_emits_streak_extended_new(self, fresh_user, mongo):
        token, uid = fresh_user()
        s, _ = _http("POST", "/analytics/track", token, {"event_type": "workout_completed", "metadata": {}})
        assert s == 200
        time.sleep(0.4)
        ev = _latest(mongo, uid, "streak_extended")
        assert ev is not None, "streak_extended must fire on first workout"
        md = ev.get("metadata") or {}
        assert md.get("new_streak") == 1
        assert md.get("is_new_streak") is True
        assert ev.get("event_category") == "retention"
        u = mongo.users.find_one({"_id": ObjectId(uid)})
        assert u.get("rt_streak_current") == 1
        assert u.get("rt_streak_last_day") == _utc_day(0)

    @pytest.mark.parametrize("milestone", [3, 7, 14, 30])
    def test_milestones(self, fresh_user, mongo, milestone):
        token, uid = fresh_user()
        # Seed: yesterday count = milestone-1
        mongo.users.update_one({"_id": ObjectId(uid)}, {"$set": {
            "rt_streak_current": milestone - 1,
            "rt_streak_longest": milestone - 1,
            "rt_streak_last_day": _utc_day(-1),
            "rt_last_active_day": _utc_day(-1),
        }})
        _http("POST", "/analytics/track", token, {"event_type": "workout_completed", "metadata": {}})
        time.sleep(0.4)
        ext = _latest(mongo, uid, "streak_extended")
        assert ext and ext["metadata"]["new_streak"] == milestone
        ms = _latest(mongo, uid, "streak_milestone_reached")
        assert ms is not None, f"milestone {milestone} must fire"
        assert ms["metadata"]["milestone"] == milestone
        assert ms.get("event_category") == "retention"

    def test_no_milestone_for_non_milestone_day(self, fresh_user, mongo):
        # day 4 — not a milestone
        token, uid = fresh_user()
        mongo.users.update_one({"_id": ObjectId(uid)}, {"$set": {
            "rt_streak_current": 3, "rt_streak_longest": 3,
            "rt_streak_last_day": _utc_day(-1), "rt_last_active_day": _utc_day(-1),
        }})
        _http("POST", "/analytics/track", token, {"event_type": "workout_completed", "metadata": {}})
        time.sleep(0.3)
        ext = _latest(mongo, uid, "streak_extended")
        assert ext and ext["metadata"]["new_streak"] == 4
        assert _latest(mongo, uid, "streak_milestone_reached") is None

    def test_idempotent_same_day(self, fresh_user, mongo):
        token, uid = fresh_user()
        for _ in range(3):
            _http("POST", "/analytics/track", token, {"event_type": "workout_completed", "metadata": {}})
        time.sleep(0.4)
        cnt = mongo.user_events.count_documents({"user_id": uid, "event_type": "streak_extended"})
        assert cnt == 1, f"expected 1 streak_extended on same day, got {cnt}"
        # rt_streak should still be 1
        u = mongo.users.find_one({"_id": ObjectId(uid)})
        assert u.get("rt_streak_current") == 1

    def test_streak_broken_after_gap(self, fresh_user, mongo):
        token, uid = fresh_user()
        mongo.users.update_one({"_id": ObjectId(uid)}, {"$set": {
            "rt_streak_current": 5, "rt_streak_longest": 5,
            "rt_streak_last_day": _utc_day(-4), "rt_last_active_day": _utc_day(-4),
        }})
        _http("POST", "/analytics/track", token, {"event_type": "workout_completed", "metadata": {}})
        time.sleep(0.4)
        brk = _latest(mongo, uid, "streak_broken")
        assert brk is not None
        assert brk["metadata"]["previous_streak"] == 5
        assert brk["metadata"]["source"] == "missed_day"
        assert brk.get("event_category") == "retention"
        ext = _latest(mongo, uid, "streak_extended")
        assert ext and ext["metadata"]["new_streak"] == 1
        assert ext["metadata"]["is_new_streak"] is True

    def test_workout_session_completed_alias_advances_streak(self, fresh_user, mongo):
        """retention.WORKOUT_COMPLETION_EVENTS includes workout_session_completed."""
        token, uid = fresh_user()
        _http("POST", "/analytics/track", token, {"event_type": "workout_session_completed", "metadata": {}})
        time.sleep(0.4)
        ext = _latest(mongo, uid, "streak_extended")
        assert ext is not None, "workout_session_completed should also advance the streak"
        assert ext["metadata"]["new_streak"] == 1


class TestComeback:

    def test_comeback_after_7_day_lapse(self, fresh_user, mongo):
        token, uid = fresh_user()
        mongo.users.update_one({"_id": ObjectId(uid)}, {"$set": {
            "rt_streak_current": 4, "rt_streak_longest": 4,
            "rt_streak_last_day": _utc_day(-7), "rt_last_active_day": _utc_day(-7),
        }})
        _http("POST", "/analytics/track", token, {"event_type": "app_session_start", "metadata": {}})
        time.sleep(0.4)
        cb = _latest(mongo, uid, "comeback_after_lapse")
        assert cb is not None
        assert cb["metadata"]["days_inactive"] == 7
        assert cb.get("event_category") == "retention"
        brk = _latest(mongo, uid, "streak_broken")
        assert brk is not None and brk["metadata"]["source"] == "lapse"
        assert brk["metadata"]["previous_streak"] == 4
        u = mongo.users.find_one({"_id": ObjectId(uid)})
        assert u.get("rt_streak_current") == 0
        assert u.get("rt_last_active_day") == _utc_day(0)

    def test_no_comeback_under_lapse_threshold(self, fresh_user, mongo):
        token, uid = fresh_user()
        mongo.users.update_one({"_id": ObjectId(uid)}, {"$set": {"rt_last_active_day": _utc_day(-6)}})
        _http("POST", "/analytics/track", token, {"event_type": "app_session_start", "metadata": {}})
        time.sleep(0.3)
        assert _latest(mongo, uid, "comeback_after_lapse") is None

    def test_session_start_updates_last_active_no_lapse(self, fresh_user, mongo):
        token, uid = fresh_user()
        _http("POST", "/analytics/track", token, {"event_type": "app_session_start", "metadata": {}})
        time.sleep(0.3)
        u = mongo.users.find_one({"_id": ObjectId(uid)})
        assert u.get("rt_last_active_day") == _utc_day(0)
        assert _latest(mongo, uid, "comeback_after_lapse") is None


# ─────────────── Catalog categorization ───────────────

CATALOG = [
    ("paywall_cta_tapped", "monetization"),
    ("founding_banner_shown", "monetization"),
    ("mood_intro_viewed", "workout"),
    ("tip_shown", "onboarding"),
    ("onboarding_completed", "onboarding"),
    ("health_permission_granted", "onboarding"),
    ("notification_opened", "notification"),
    ("share_completed", "sharing"),
]


class TestCatalog:

    @pytest.mark.parametrize("event_type,category", CATALOG)
    def test_event_category(self, fresh_user, mongo, event_type, category):
        token, uid = fresh_user()
        s, _ = _http("POST", "/analytics/track", token, {"event_type": event_type, "metadata": {}})
        assert s == 200
        time.sleep(0.3)
        ev = _latest(mongo, uid, event_type)
        assert ev is not None, f"{event_type} not written to user_events"
        assert ev.get("event_category") == category, f"{event_type} got {ev.get('event_category')} expected {category}"


# ─────────────── Regression: Phase 1 ───────────────

class TestPhase1Regression:

    def test_register_emits_user_registered_auth(self, fresh_user, mongo):
        _, uid = fresh_user()
        # registration was just performed by fixture
        # wait briefly for async write
        for _ in range(10):
            ev = _latest(mongo, uid, "user_registered")
            if ev:
                break
            time.sleep(0.2)
        assert ev is not None
        assert ev.get("event_category") == "auth"

    def test_subscription_validate_emits_started_no_legacy(self, fresh_user, mongo):
        token, uid = fresh_user()
        # Use a deliberately invalid receipt — endpoint should still record
        # a 'subscription_started' tracking event (per current implementation
        # comment) OR at minimum not write to legacy analytics_events.
        body = {"receipt_data": "FAKE_RECEIPT", "product_id": "mood.yearly.39", "transaction_id": f"tx_{int(time.time()*1000)}"}
        s, _ = _http("POST", "/subscription/validate", token, body)
        # Status may be 200 (valid mock path) or 400/422; we only assert no legacy write.
        time.sleep(0.4)
        legacy_cnt = mongo.analytics_events.count_documents({"user_id": uid}) if "analytics_events" in mongo.list_collection_names() else 0
        assert legacy_cnt == 0, f"legacy analytics_events should NOT be written, found {legacy_cnt}"
        # If status was 200, verify subscription_started was tracked w/ correct category
        if s == 200:
            ev = _latest(mongo, uid, "subscription_started")
            assert ev is not None
            assert ev.get("event_category") == "monetization"

    def test_apple_webhook_unsigned_gate(self, mongo):
        # Snapshot pre-state — any subscription_* events that might match
        before = mongo.user_events.count_documents({"event_type": {"$regex": "^subscription_"}, "metadata.notification_type": {"$exists": True}})
        s, b = _http("POST", "/subscription/webhooks/apple", body={"signedPayload": "garbage"})
        assert s == 200, f"webhook gate must return 200, got {s} {b}"
        assert b.get("ok") is True
        assert b.get("verified") is False
        time.sleep(0.3)
        after = mongo.user_events.count_documents({"event_type": {"$regex": "^subscription_"}, "metadata.notification_type": {"$exists": True}})
        assert after == before, f"unsigned webhook must NOT write subscription_* events (before={before} after={after})"


# ─────────────── Health ───────────────

def test_health():
    s, b = _http("GET", "/health")
    assert s == 200 and b.get("status") == "healthy"
