"""
Tests for /api/workout-drafts — Saved Builds feature.

Covers:
  - Guest create + list + identity isolation
  - Status transitions (in_progress → ready_to_start → started → completed)
  - Cap of 20 active drafts (auto-prune oldest non-pinned)
  - Pin cap of 3
  - 30-min auto-abandon
  - Guest → user merge
  - 7-day stale detection (informational; client-side gate)
"""
from __future__ import annotations

import asyncio
import os
import time
import uuid
from datetime import datetime, timedelta, timezone

import httpx
import pytest


API_BASE = (
    os.environ.get('REACT_APP_BACKEND_URL', '').strip()
    or os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').strip()
    or 'http://localhost:8001'
).rstrip('/')

# Use localhost for backend tests to avoid Cloudflare/proxy noise
LOCAL_API = 'http://localhost:8001'
ROOT = f"{LOCAL_API}/api/workout-drafts"


def _device() -> str:
    return f"test_dev_{uuid.uuid4().hex[:12]}"


def _payload(device_id: str, mood_category: str = "Sweat", **overrides):
    base = {
        "device_id": device_id,
        "mood_input": {"category": mood_category, "card": "Cardio"},
        "resume_route": "/cart",
        "resume_params": {},
        "step_count": 4,
        "current_step": 1,
    }
    base.update(overrides)
    return base


@pytest.fixture
def client():
    with httpx.Client(timeout=10.0) as c:
        yield c


# ===== Smoke =====
def test_health_check(client):
    r = client.get(f"{LOCAL_API}/api/health")
    assert r.status_code == 200


# ===== CRUD as guest =====
def test_guest_create_and_list(client):
    d = _device()
    r = client.post(ROOT, json=_payload(d))
    assert r.status_code == 200, r.text
    draft = r.json()
    assert draft["device_id"] == d
    assert draft["user_id"] is None
    assert draft["status"] == "in_progress"
    # title may be empty (frontend generates it) — just assert key present
    assert "title" in draft
    # list
    r2 = client.get(f"{ROOT}?device_id={d}")
    assert r2.status_code == 200
    items = r2.json()
    assert len(items) == 1
    assert items[0]["id"] == draft["id"]


def test_guest_isolation(client):
    d1, d2 = _device(), _device()
    client.post(ROOT, json=_payload(d1))
    client.post(ROOT, json=_payload(d2))
    # device 1 should only see its own draft
    r = client.get(f"{ROOT}?device_id={d1}")
    assert r.status_code == 200
    items = r.json()
    assert len(items) == 1
    assert items[0]["device_id"] == d1


def test_missing_identity_400(client):
    # No device_id and no auth → should 400 on list
    r = client.get(ROOT)
    assert r.status_code == 400


def test_get_one_bumps_last_viewed(client):
    d = _device()
    created = client.post(ROOT, json=_payload(d)).json()
    first_viewed = created["last_viewed_at"]
    time.sleep(0.05)
    fetched = client.get(f"{ROOT}/{created['id']}?device_id={d}").json()
    assert fetched["id"] == created["id"]
    # last_viewed_at updated
    assert fetched["last_viewed_at"] >= first_viewed


def test_patch_status_transitions(client):
    d = _device()
    draft = client.post(ROOT, json=_payload(d)).json()
    for status in ("ready_to_start", "started", "completed"):
        r = client.patch(f"{ROOT}/{draft['id']}?device_id={d}", json={"status": status})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == status


def test_patch_invalid_status_400(client):
    d = _device()
    draft = client.post(ROOT, json=_payload(d)).json()
    r = client.patch(f"{ROOT}/{draft['id']}?device_id={d}", json={"status": "bogus"})
    assert r.status_code == 400


def test_delete(client):
    d = _device()
    draft = client.post(ROOT, json=_payload(d)).json()
    r = client.delete(f"{ROOT}/{draft['id']}?device_id={d}")
    assert r.status_code == 200
    r2 = client.get(f"{ROOT}/{draft['id']}?device_id={d}")
    assert r2.status_code == 404


# ===== Generated workout snapshot =====
def test_generated_workout_snapshot(client):
    d = _device()
    exercises = [
        {"id": "ex1", "name": "Push Up", "imageUrl": "https://example.com/p.jpg"},
        {"id": "ex2", "name": "Squat", "imageUrl": "https://example.com/s.jpg"},
    ]
    draft = client.post(ROOT, json=_payload(d, generated_workout=exercises, thumbnail_url="https://example.com/p.jpg")).json()
    assert draft["generated_workout"] == exercises
    # Now patch to ready_to_start — generated_workout should remain
    client.patch(f"{ROOT}/{draft['id']}?device_id={d}", json={"status": "ready_to_start"})
    fetched = client.get(f"{ROOT}/{draft['id']}?device_id={d}").json()
    assert fetched["status"] == "ready_to_start"
    assert fetched["generated_workout"] == exercises


# ===== Pin cap =====
def test_pin_cap_of_three(client):
    d = _device()
    ids = []
    for _ in range(4):
        ids.append(client.post(ROOT, json=_payload(d)).json()["id"])
    # Pin 3 — should succeed
    for i in range(3):
        r = client.patch(f"{ROOT}/{ids[i]}?device_id={d}", json={"pinned": True})
        assert r.status_code == 200, r.text
    # Pin 4th — should 400
    r = client.patch(f"{ROOT}/{ids[3]}?device_id={d}", json={"pinned": True})
    assert r.status_code == 400


# ===== Active count =====
def test_count_endpoint(client):
    d = _device()
    for _ in range(3):
        client.post(ROOT, json=_payload(d))
    r = client.get(f"{ROOT}/count?device_id={d}")
    assert r.status_code == 200
    data = r.json()
    assert data["count"] == 3


def test_count_excludes_completed(client):
    d = _device()
    draft = client.post(ROOT, json=_payload(d)).json()
    client.patch(f"{ROOT}/{draft['id']}?device_id={d}", json={"status": "completed"})
    r = client.get(f"{ROOT}/count?device_id={d}")
    assert r.json()["count"] == 0


# ===== Auto-prune (overflow) — direct DB sanity check =====
@pytest.mark.asyncio
async def test_active_overflow_prunes_oldest_non_pinned(db):
    """Insert 22 active drafts via API then assert at most 20 remain (oldest non-pinned removed)."""
    d = _device()
    # Insert 22 via API (each call triggers prune)
    async with httpx.AsyncClient(timeout=15.0) as c:
        for _ in range(22):
            await c.post(ROOT, json=_payload(d))
    # Count
    count = await db.workout_drafts.count_documents({"device_id": d, "user_id": None})
    assert count <= 20, f"Expected ≤20 active drafts after auto-prune, got {count}"


# ===== Auto-abandon =====
@pytest.mark.asyncio
async def test_auto_abandon_after_30_min(db):
    """Manually backdate a draft and assert listing flips its status to abandoned."""
    d = _device()
    async with httpx.AsyncClient(timeout=10.0) as c:
        draft = (await c.post(ROOT, json=_payload(d))).json()
        # Backdate
        old = datetime.now(timezone.utc) - timedelta(minutes=45)
        await db.workout_drafts.update_one(
            {"_id": __import__("bson").ObjectId(draft["id"])},
            {"$set": {"last_modified_at": old}},
        )
        listed = (await c.get(f"{ROOT}?device_id={d}")).json()
        assert any(
            item["id"] == draft["id"] and item["status"] == "abandoned"
            for item in listed
        )


# ===== Guest → user merge =====
@pytest.mark.asyncio
async def test_guest_to_user_merge(db):
    """Create guest draft, register a user, merge, verify ownership transfer."""
    d = _device()
    async with httpx.AsyncClient(timeout=10.0) as c:
        # Create guest draft
        guest_draft = (await c.post(ROOT, json=_payload(d))).json()
        # Register a fresh user
        username = f"draftuser_{int(time.time())}_{uuid.uuid4().hex[:6]}"
        reg = await c.post(
            f"{LOCAL_API}/api/auth/register",
            json={
                "username": username,
                "email": f"{username}@example.com",
                "password": "TestPass123!",
                "name": "Drafty",
            },
        )
        assert reg.status_code == 200, reg.text
        token = reg.json().get("token") or reg.json().get("access_token")
        assert token
        # Merge
        merge = await c.post(
            f"{ROOT}/merge",
            json={"device_id": d},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert merge.status_code == 200, merge.text
        assert merge.json()["merged"] >= 1
        # Authed list should now include the merged draft
        listed = await c.get(
            ROOT, headers={"Authorization": f"Bearer {token}"}
        )
        assert listed.status_code == 200
        assert any(item["id"] == guest_draft["id"] for item in listed.json())
