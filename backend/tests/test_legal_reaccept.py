"""
Backend tests for the App Store Compliance ToS version-bump system
added 2026-05-14.

Covers:
  GET  /api/legal/active-version       (public)
  GET  /api/legal/needs-reaccept       (auth required)
  POST /api/users/me/accept-terms      (auth required; bumps both
                                        terms_accepted_at AND
                                        acknowledged_terms_at)
"""

import time
import asyncio
import requests
from pathlib import Path
from bson import ObjectId
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import pytest


def _resolve_backend_url() -> str:
    env_path = Path("/app/frontend/.env")
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if "=" in line and line.split("=", 1)[0].strip() in (
            "REACT_APP_BACKEND_URL",
            "EXPO_PUBLIC_BACKEND_URL",
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
ENV = _read_backend_env()
MONGO_URL = ENV["MONGO_URL"]
DB_NAME = ENV["DB_NAME"]


@pytest.fixture(scope="module")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture
def fresh_user(http):
    ts = int(time.time() * 1000)
    r = http.post(
        f"{API}/auth/register",
        json={
            "username": f"legalt_{ts}",
            "email": f"legalt_{ts}@example.com",
            "password": "TestPass1234567",
        },
        timeout=15,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    return {"user_id": body["user_id"], "token": body["token"]}


def _hdr(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def _mongo():
    return AsyncIOMotorClient(MONGO_URL)[DB_NAME]


async def _patch_user(user_id: str, fields: dict) -> None:
    db = _mongo()
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": fields})


def test_active_version_is_public(http):
    r = http.get(f"{API}/legal/active-version", timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert isinstance(body.get("terms_version"), str) and body["terms_version"]
    assert isinstance(body.get("privacy_version"), str) and body["privacy_version"]


def test_needs_reaccept_requires_auth(http):
    r = http.get(f"{API}/legal/needs-reaccept", timeout=15)
    assert r.status_code in (401, 403), r.text


def test_fresh_user_does_not_need_reaccept(http, fresh_user):
    """A user who just registered has the current version stamped on them."""
    r = http.get(f"{API}/legal/needs-reaccept", headers=_hdr(fresh_user["token"]), timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["needs_reaccept"] is False
    assert body["user_version"] == body["current_version"]
    assert body["terms_accepted_at"] is not None
    assert body["acknowledged_terms_at"] is not None


def test_stale_user_version_triggers_reaccept(http, fresh_user):
    """Set the user's stamped version to an older string; the endpoint
    must flip needs_reaccept to True."""
    asyncio.run(
        _patch_user(
            fresh_user["user_id"],
            {"terms_accepted_version": "1999-01-01"},
        )
    )
    r = http.get(f"{API}/legal/needs-reaccept", headers=_hdr(fresh_user["token"]), timeout=15)
    body = r.json()
    assert body["needs_reaccept"] is True
    assert body["user_version"] == "1999-01-01"
    assert body["current_version"] != "1999-01-01"


def test_accept_terms_clears_reaccept_and_bumps_both_audit_fields(http, fresh_user):
    """After POSTing accept-terms, needs_reaccept must be False and BOTH
    terms_accepted_at AND acknowledged_terms_at must be freshly stamped."""
    # First make it stale
    asyncio.run(
        _patch_user(
            fresh_user["user_id"],
            {"terms_accepted_version": "1999-01-01", "acknowledged_terms_at": None},
        )
    )
    pre = http.get(f"{API}/legal/needs-reaccept", headers=_hdr(fresh_user["token"]), timeout=15).json()
    assert pre["needs_reaccept"] is True
    assert pre["acknowledged_terms_at"] is None

    r = http.post(f"{API}/users/me/accept-terms", headers=_hdr(fresh_user["token"]), timeout=15)
    assert r.status_code == 200, r.text

    post = http.get(f"{API}/legal/needs-reaccept", headers=_hdr(fresh_user["token"]), timeout=15).json()
    assert post["needs_reaccept"] is False
    assert post["user_version"] == post["current_version"]
    assert post["terms_accepted_at"] is not None
    assert post["acknowledged_terms_at"] is not None  # ← the new field is stamped


def test_user_with_no_version_field_needs_reaccept(http, fresh_user):
    """An older account that predates the version field entirely (None)
    must surface the sheet."""
    asyncio.run(
        _patch_user(
            fresh_user["user_id"],
            {"terms_accepted_version": None},
        )
    )
    r = http.get(f"{API}/legal/needs-reaccept", headers=_hdr(fresh_user["token"]), timeout=15)
    body = r.json()
    assert body["needs_reaccept"] is True
    assert body["user_version"] is None
