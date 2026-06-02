"""
MOOD V2 Phase 1 — Event Tracking Expansion — Independent re-verification.

Coverage:
  - BACKEND 1e auth events: user_registered / login_failure / login_success / logout
    all land in user_events with event_category='auth'.
  - BACKEND 1b subscription_started: /subscription/validate writes
    subscription_started to user_events (category=monetization) with
    metadata.plan_id / .revenue_usd / .source='apple', and NOTHING is written
    to the legacy analytics_events collection.
  - BACKEND 1b Apple webhook GATE: unsigned/garbage payloads → HTTP 200,
    {ok:true, verified:false}, audit doc in apple_webhook_events with
    verified:false, and ZERO new subscription_* docs in user_events
    attributable to the webhook (we check metadata.notification_type).
  - Catalog: confirms several client-side EVENT_TYPES from POST
    /api/analytics/track land in user_events with the correct category.
"""
import asyncio
import os
import time
from typing import Any, Dict, Optional

import pytest
import requests
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")

BASE_URL = "http://localhost:8001/api"
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]


# ───────────────────────── Fixtures ─────────────────────────
@pytest.fixture(scope="session")
def session_id() -> str:
    return str(int(time.time() * 1000))


@pytest.fixture(scope="session")
def http() -> requests.Session:
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def db():
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]


def _run(coro):
    return asyncio.get_event_loop().run_until_complete(coro)


@pytest.fixture(scope="session")
def registered_user(http, session_id) -> Dict[str, Any]:
    """Register a fresh user; returns dict with token+user_id+username+password."""
    username = f"p1v2_{session_id}"
    email = f"{username}@example.com"
    password = "TestPass1234567$"
    r = http.post(f"{BASE_URL}/auth/register", json={
        "username": username, "email": email, "password": password,
        "name": "P1 V2 Tester", "terms_accepted": True,
    }, timeout=30)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text[:300]}"
    body = r.json()
    assert "token" in body and "user_id" in body
    return {
        "token": body["token"], "user_id": body["user_id"],
        "username": username, "email": email, "password": password,
    }


# ───────────────────────── Helpers ─────────────────────────
async def _find_event(db, user_id: str, event_type: str) -> Optional[Dict[str, Any]]:
    return await db.user_events.find_one(
        {"user_id": user_id, "event_type": event_type},
        sort=[("timestamp", -1)],
    )


# ─────────────────── 1e — Auth events ───────────────────
class TestAuthEvents:
    def test_user_registered_is_auth(self, db, registered_user):
        # small wait so motor sees the write
        time.sleep(0.4)
        doc = _run(_find_event(db, registered_user["user_id"], "user_registered"))
        assert doc is not None, "user_registered missing in user_events"
        assert doc.get("event_category") == "auth"

    def test_login_failure_then_success(self, http, db, registered_user):
        u = registered_user
        r_fail = http.post(f"{BASE_URL}/auth/login",
                           json={"username": u["username"], "password": "WRONG_PASSWORD"},
                           timeout=15)
        assert r_fail.status_code in (400, 401, 403)
        r_ok = http.post(f"{BASE_URL}/auth/login",
                         json={"username": u["username"], "password": u["password"]},
                         timeout=15)
        assert r_ok.status_code == 200, r_ok.text[:200]
        # capture login session token for logout test
        u["session_token"] = r_ok.json().get("token") or u["token"]

        time.sleep(0.4)
        fail_doc = _run(_find_event(db, u["user_id"], "login_failure"))
        ok_doc = _run(_find_event(db, u["user_id"], "login_success"))
        assert fail_doc and fail_doc.get("event_category") == "auth", f"login_failure missing/bad: {fail_doc}"
        assert ok_doc and ok_doc.get("event_category") == "auth", f"login_success missing/bad: {ok_doc}"

    def test_logout_tracked(self, http, db, registered_user):
        u = registered_user
        token = u.get("session_token") or u["token"]
        r = http.post(f"{BASE_URL}/auth/logout",
                      headers={"Authorization": f"Bearer {token}"}, timeout=15)
        assert r.status_code == 200, r.text[:200]
        time.sleep(0.4)
        doc = _run(_find_event(db, u["user_id"], "logout"))
        assert doc is not None, "logout event missing in user_events"
        assert doc.get("event_category") == "auth"


# ─────────────── Catalog spot-check via /analytics/track ───────────────
CATALOG_PROBES = [
    ("paywall_dismissed", "monetization"),
    ("plan_selected", "monetization"),
    ("purchase_initiated", "monetization"),
    ("restore_purchases_clicked", "monetization"),
    ("founding_member_offer_shown", "monetization"),
    ("workout_generation_started", "workout"),
    ("workout_generation_completed", "workout"),
    ("workout_previewed", "workout"),
    ("workout_regenerated", "workout"),
]


class TestEventCatalog:
    @pytest.fixture(scope="class")
    def fresh_user(self, http, session_id):
        username = f"p1v2c_{session_id}"
        r = http.post(f"{BASE_URL}/auth/register", json={
            "username": username, "email": f"{username}@example.com",
            "password": "TestPass1234567$", "name": "Catalog", "terms_accepted": True,
        }, timeout=30)
        assert r.status_code == 200, r.text[:200]
        b = r.json()
        return {"token": b["token"], "user_id": b["user_id"]}

    @pytest.mark.parametrize("event_type,category", CATALOG_PROBES)
    def test_catalog_event(self, http, db, fresh_user, event_type, category):
        r = http.post(f"{BASE_URL}/analytics/track",
                      headers={"Authorization": f"Bearer {fresh_user['token']}"},
                      json={"event_type": event_type,
                            "metadata": {"smoke": True}},
                      timeout=15)
        assert r.status_code == 200, r.text[:200]
        time.sleep(0.2)
        doc = _run(_find_event(db, fresh_user["user_id"], event_type))
        assert doc is not None, f"{event_type} missing from user_events"
        assert doc.get("event_category") == category, (
            f"{event_type} category={doc.get('event_category')} expected {category}"
        )


# ─────────────── 1b — subscription_started via /subscription/validate ───────────────
class TestSubscriptionValidate:
    def test_subscription_started_lands_in_user_events_only(self, http, db, session_id):
        # fresh user (logged in)
        username = f"p1v2s_{session_id}"
        r_reg = http.post(f"{BASE_URL}/auth/register", json={
            "username": username, "email": f"{username}@example.com",
            "password": "TestPass1234567$", "name": "Sub Tester", "terms_accepted": True,
        }, timeout=30)
        assert r_reg.status_code == 200
        token = r_reg.json()["token"]
        user_id = r_reg.json()["user_id"]

        # snapshot analytics_events count BEFORE
        legacy_before = _run(db.analytics_events.count_documents({"user_id": user_id})) \
            if _run(db.list_collection_names()).__contains__("analytics_events") else 0

        r = http.post(f"{BASE_URL}/subscription/validate",
                      headers={"Authorization": f"Bearer {token}"},
                      json={
                          "signed_payload": "dummy.unverified.jws",
                          "product_id": "mood_premium_yearly",
                          "transaction_id": f"TX_{session_id}",
                          "original_transaction_id": f"OTX_{session_id}",
                          "purchase_date": "2026-01-01T00:00:00Z",
                          "expiration_date": "2027-01-01T00:00:00Z",
                      }, timeout=20)
        # Endpoint should succeed in this env (StoreKit not strictly verified here)
        assert r.status_code == 200, f"/subscription/validate non-200: {r.status_code} {r.text[:200]}"
        body = r.json()
        assert body.get("ok") is True
        assert body.get("plan") == "annual"

        time.sleep(0.5)
        doc = _run(_find_event(db, user_id, "subscription_started"))
        assert doc is not None, "subscription_started missing from user_events"
        assert doc.get("event_category") == "monetization"
        md = doc.get("metadata") or {}
        assert md.get("plan_id") == "mood_premium_yearly"
        assert md.get("source") == "apple"
        assert md.get("revenue_usd") == 79.0

        # CRITICAL: no new write to legacy analytics_events for this user
        legacy_after = _run(db.analytics_events.count_documents({"user_id": user_id})) \
            if "analytics_events" in _run(db.list_collection_names()) else 0
        assert legacy_after == legacy_before, (
            f"analytics_events grew from {legacy_before} -> {legacy_after} for user {user_id} "
            "— legacy collection must NOT be written anymore"
        )


# ─────────────── 1b — Apple webhook GATE ───────────────
class TestAppleWebhookGate:
    def test_unsigned_payload_dropped(self, http, db):
        before_spoof = _run(db.user_events.count_documents({
            "event_type": {"$in": [
                "subscription_started", "subscription_renewed",
                "subscription_cancelled", "subscription_expired",
                "subscription_refunded",
            ]},
            "metadata.notification_type": {"$exists": True},
        }))

        r1 = http.post(f"{BASE_URL}/subscription/webhooks/apple",
                       json={"signedPayload": "not.a.jws"}, timeout=15)
        assert r1.status_code == 200, r1.text[:200]
        b1 = r1.json()
        assert b1.get("ok") is True
        assert b1.get("verified") is False, f"unsigned must be verified=false, got {b1}"

        r2 = http.post(f"{BASE_URL}/subscription/webhooks/apple",
                       json={}, timeout=15)
        assert r2.status_code == 200
        b2 = r2.json()
        assert b2.get("ok") is True
        assert b2.get("verified") is False

        time.sleep(0.4)
        # Audit collection should record verified:False
        dropped = _run(db.apple_webhook_events.count_documents({"verified": False}))
        assert dropped >= 1, "apple_webhook_events should have at least one verified=False audit"

        # And NO new spoofed subscription_* events from webhook
        after_spoof = _run(db.user_events.count_documents({
            "event_type": {"$in": [
                "subscription_started", "subscription_renewed",
                "subscription_cancelled", "subscription_expired",
                "subscription_refunded",
            ]},
            "metadata.notification_type": {"$exists": True},
        }))
        assert after_spoof == before_spoof, (
            f"webhook gate leak — spoofed subscription_* events grew from "
            f"{before_spoof} -> {after_spoof}"
        )
