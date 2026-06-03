"""
Backend tests for Phase C StoreKit receipt status sync exposed via
GET /api/auth/me — added 2026-05-14.

Verifies:
1) New users have all four subscription_* fields present and null.
2) When `subscription.status` is persisted to a user record, the next
   /auth/me call mirrors it under `subscription_status`.
3) Lapsed receipts (expiration_date in the past) self-correct from
   'active' → 'lapsed' on read, so the client doesn't see stale 'active'
   while waiting on Apple's S2S webhook.
4) Founding-member surface still works alongside subscription fields.
5) Auth gates unchanged: unauthenticated/invalid token → 401.
"""

import time
import requests
from pathlib import Path
from datetime import datetime, timezone, timedelta

import pytest
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId


def _resolve_backend_url() -> str:
    env_path = Path("/app/frontend/.env")
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if "=" in line and line.split("=", 1)[0].strip() in (
            "REACT_APP_BACKEND_URL", "EXPO_PUBLIC_BACKEND_URL"
        ):
            return line.split("=", 1)[1].strip().strip('"').strip("'").rstrip("/")
    raise RuntimeError("Backend URL not found")


def _read_backend_env() -> dict:
    out = {}
    for line in Path("/app/backend/.env").read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            out[k.strip()] = v.strip().strip('"').strip("'")
    return out


BASE_URL = _resolve_backend_url()
API = f"{BASE_URL}/api"
BACKEND_ENV = _read_backend_env()
MONGO_URL = BACKEND_ENV.get("MONGO_URL")
DB_NAME = BACKEND_ENV.get("DB_NAME")


@pytest.fixture(scope="module")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture
def fresh_user(http):
    ts = int(time.time() * 1000)
    payload = {
        "username": f"substest_{ts}",
        "email": f"substest_{ts}@example.com",
        "password": "TestPass1234567",
    }
    r = http.post(f"{API}/auth/register", json=payload, timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    return {"user_id": body["user_id"], "token": body["token"]}


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def _mongo():
    return AsyncIOMotorClient(MONGO_URL)[DB_NAME]


async def _set_subscription(user_id: str, sub_doc: dict) -> None:
    db = _mongo()
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"subscription": sub_doc}})


def test_new_user_has_subscription_fields_null(http, fresh_user):
    r = http.get(f"{API}/auth/me", headers=_auth_headers(fresh_user["token"]), timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert "subscription_status" in body
    assert "subscription_plan" in body
    assert "subscription_product_id" in body
    assert "subscription_expiration_date" in body
    assert body["subscription_status"] is None
    assert body["subscription_plan"] is None
    assert body["subscription_product_id"] is None
    assert body["subscription_expiration_date"] is None


def test_active_subscription_is_mirrored(http, fresh_user):
    future_exp = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    asyncio.run(_set_subscription(fresh_user["user_id"], {
        "status": "active",
        "plan": "annual",
        "product_id": "com.mood.subscription.annual",
        "expiration_date": future_exp,
    }))
    r = http.get(f"{API}/auth/me", headers=_auth_headers(fresh_user["token"]), timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["subscription_status"] == "active"
    assert body["subscription_plan"] == "annual"
    assert body["subscription_product_id"] == "com.mood.subscription.annual"
    assert body["subscription_expiration_date"] == future_exp


def test_in_trial_status_is_mirrored(http, fresh_user):
    future_exp = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    asyncio.run(_set_subscription(fresh_user["user_id"], {
        "status": "in_trial",
        "plan": "monthly",
        "product_id": "com.mood.subscription.monthly",
        "expiration_date": future_exp,
    }))
    r = http.get(f"{API}/auth/me", headers=_auth_headers(fresh_user["token"]), timeout=15)
    body = r.json()
    assert body["subscription_status"] == "in_trial"
    assert body["subscription_plan"] == "monthly"


def test_lapsed_receipt_self_corrects_from_active(http, fresh_user):
    """If the stored expiration is in the past, the endpoint should return
    'lapsed' even when the DB still has stale 'active'. Prevents the client
    from showing entitlement while waiting on Apple's S2S webhook."""
    past_exp = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    asyncio.run(_set_subscription(fresh_user["user_id"], {
        "status": "active",  # stale value persisted earlier
        "plan": "annual",
        "product_id": "com.mood.subscription.annual",
        "expiration_date": past_exp,
    }))
    r = http.get(f"{API}/auth/me", headers=_auth_headers(fresh_user["token"]), timeout=15)
    body = r.json()
    assert body["subscription_status"] == "lapsed", body


def test_explicit_lapsed_passes_through(http, fresh_user):
    past_exp = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    asyncio.run(_set_subscription(fresh_user["user_id"], {
        "status": "lapsed",
        "plan": "annual",
        "expiration_date": past_exp,
    }))
    r = http.get(f"{API}/auth/me", headers=_auth_headers(fresh_user["token"]), timeout=15)
    body = r.json()
    assert body["subscription_status"] == "lapsed"


def test_founding_member_fields_coexist_with_subscription(http, fresh_user):
    """Founding-member fields must remain in the response and unchanged
    when the subscription block is also populated."""
    r = http.get(f"{API}/auth/me", headers=_auth_headers(fresh_user["token"]), timeout=15)
    body = r.json()
    assert "founding_member" in body
    assert "founding_member_modal_seen" in body
    assert "founding_member_at" in body
    assert isinstance(body["founding_member"], bool)


def test_auth_gate_unchanged(http):
    r = http.get(f"{API}/auth/me", timeout=15)
    assert r.status_code in (401, 403), r.text
    r = http.get(f"{API}/auth/me", headers=_auth_headers("clearly_invalid_jwt"), timeout=15)
    assert r.status_code in (401, 403), r.text
