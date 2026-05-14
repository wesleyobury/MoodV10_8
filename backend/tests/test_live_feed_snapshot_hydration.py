"""End-to-end regression test for "Try this workout" on the Live tab.

Reproduces the user-reported bug where tapping a Live Feed completion card
failed to populate the cart with the original athlete's exercises.

Verifies the full chain:
  1. POST /api/workout-snapshots — server persists a snapshot with the
     workout-session field names (`workoutName`, `workoutTitle`,
     `moodCategory`, etc.).
  2. POST /api/analytics/track (event_type=workout_completed) with
     metadata.workout_snapshot_id — server stores it on the event.
  3. GET /api/feed/live — server surfaces the same workout_snapshot_id
     on the completion entry (so the client can call hydration).
  4. GET /api/workout-snapshots/{id} — server returns the persisted
     workouts list, including the original snapshot field names.

The frontend mapper in `components/LiveFeed.tsx::handleCardPress` is
responsible for transforming those workout-session field names into the
`WorkoutItem` shape that `CartContext.addToCart` expects
(`name`/`workoutType`/`moodCard`/`id`). This test guarantees the
underlying server data is intact so that mapper has something to work on.
"""

import os
import time
import uuid
import requests

BASE_URL = (
    os.environ.get("EXPO_PUBLIC_BACKEND_URL")
    or os.environ.get("REACT_APP_BACKEND_URL")
    or "http://localhost:8001"
).rstrip("/")


def _register_user():
    ts = int(time.time() * 1000)
    username = f"livehyd_{ts}_{uuid.uuid4().hex[:6]}"
    body = {
        "username": username,
        "email": f"{username}@example.com",
        "password": "TestPass1234567",
        "name": "Live Hydration Tester",
        "terms_accepted": True,
    }
    r = requests.post(f"{BASE_URL}/api/auth/register", json=body, timeout=20)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    return r.json()["token"]


def _snapshot_payload():
    return {
        "workouts": [
            {
                "workoutTitle": "Push-ups",
                "workoutName": "Push-ups",
                "equipment": "Bodyweight",
                "duration": "5 min",
                "difficulty": "beginner",
                "moodCategory": "Sweat",
                "imageUrl": "https://example.com/pushups.jpg",
                "description": "Classic upper-body builder.",
                "battlePlan": "3x12 with 60s rest.",
                "intensityReason": "Moderate",
                "moodTips": [],
            },
            {
                "workoutTitle": "Squats",
                "workoutName": "Squats",
                "equipment": "Bodyweight",
                "duration": "5 min",
                "difficulty": "beginner",
                "moodCategory": "Sweat",
                "imageUrl": "https://example.com/squats.jpg",
                "description": "Foundational lower-body strength.",
                "battlePlan": "3x15 with 60s rest.",
                "intensityReason": "Moderate",
                "moodTips": [],
            },
        ],
        "total_duration": 10,
        "mood_category": "Sweat",
    }


def test_live_feed_snapshot_hydration_flow():
    token = _register_user()
    h = {"Authorization": f"Bearer {token}"}

    # 1. Persist snapshot
    snap_resp = requests.post(
        f"{BASE_URL}/api/workout-snapshots",
        headers=h, json=_snapshot_payload(), timeout=20,
    )
    assert snap_resp.status_code == 200, snap_resp.text
    snap_id = snap_resp.json()["id"]
    assert snap_id and isinstance(snap_id, str)

    # 2. Fire workout_completed event with the snapshot_id in metadata
    ev_resp = requests.post(
        f"{BASE_URL}/api/analytics/track",
        headers=h,
        json={
            "event_type": "workout_completed",
            "metadata": {
                "mood_category": "Sweat",
                "difficulty": "beginner",
                "equipment": "Bodyweight",
                "duration_minutes": 10,
                "exercises_completed": 2,
                "workout_snapshot_id": snap_id,
                "workout_name": "Sweat session",
            },
        },
        timeout=20,
    )
    assert ev_resp.status_code == 200, ev_resp.text

    # 3. Live feed should surface our entry with the snapshot id
    feed_resp = requests.get(f"{BASE_URL}/api/feed/live?limit=50", timeout=20)
    assert feed_resp.status_code == 200, feed_resp.text
    entries = feed_resp.json().get("entries", [])
    matches = [e for e in entries if e.get("workout_snapshot_id") == snap_id]
    assert matches, (
        f"snapshot {snap_id} not surfaced in live feed; "
        f"found {len(entries)} entries"
    )
    entry = matches[0]
    assert entry["type"] == "completion"
    assert entry["mood_bucket"] == "sweat"
    assert entry["duration_minutes"] == 10

    # 4. Hydration endpoint returns the persisted workouts
    hyd_resp = requests.get(
        f"{BASE_URL}/api/workout-snapshots/{snap_id}",
        timeout=20,
    )
    assert hyd_resp.status_code == 200, hyd_resp.text
    body = hyd_resp.json()
    assert body["id"] == snap_id
    workouts = body.get("workouts", [])
    assert len(workouts) == 2

    # Verify the field shape the frontend mapper expects to receive.
    # Snapshot stores workout-session keys, NOT cart-item keys.
    w0 = workouts[0]
    assert "workoutName" in w0 or "workoutTitle" in w0, (
        "snapshot must contain workoutName/workoutTitle for client mapper"
    )
    assert "equipment" in w0
    assert "duration" in w0
    assert "difficulty" in w0
    assert "imageUrl" in w0
    assert "battlePlan" in w0
    # Sanity: the cart-shape keys are NOT present — confirms the mapper
    # in LiveFeed.handleCardPress is the right place to do the rename.
    assert "name" not in w0
    assert "workoutType" not in w0
    assert "moodCard" not in w0


def test_single_workout_snapshot_round_trip():
    """Single-workout paths (e.g. "I'm feeling lazy" → body part →
    one exercise) used to skip snapshot creation, leaving the Live
    Feed entry with no workout_snapshot_id and forcing viewers back
    to mood sub-selection. Verifies the snapshot endpoint accepts the
    1-workout payload that `workout-guidance.tsx`'s single-workout
    branch now posts."""
    token = _register_user()
    h = {"Authorization": f"Bearer {token}"}

    single = {
        "workouts": [
            {
                "workoutTitle": "Gentle Movement",
                "workoutName": "Gentle Movement",
                "equipment": "Bodyweight",
                "duration": "15 min",
                "difficulty": "beginner",
                "moodCategory": "I'm feeling lazy - Lower Body",
                "imageUrl": "https://example.com/lazy.jpg",
                "description": "Easy recovery flow.",
                "battlePlan": "Light stretch + slow squats.",
                "intensityReason": "Recovery",
                "moodTips": [],
            },
        ],
        "total_duration": 15,
        "mood_category": "I'm feeling lazy - Lower Body",
    }
    snap_resp = requests.post(
        f"{BASE_URL}/api/workout-snapshots",
        headers=h, json=single, timeout=20,
    )
    assert snap_resp.status_code == 200, snap_resp.text
    snap_id = snap_resp.json()["id"]

    # Fire the analytics event the single-workout branch fires
    ev_resp = requests.post(
        f"{BASE_URL}/api/analytics/track",
        headers=h,
        json={
            "event_type": "workout_completed",
            "metadata": {
                "mood_category": "I'm feeling lazy - Lower Body",
                "difficulty": "beginner",
                "equipment": "Bodyweight",
                "duration_minutes": 15,
                "exercises_completed": 1,
                "workout_snapshot_id": snap_id,
            },
        },
        timeout=20,
    )
    assert ev_resp.status_code == 200, ev_resp.text

    # Live feed should now route this to the lazy bucket (not muscle)
    # AND surface the snapshot id so the client can hydrate.
    feed_resp = requests.get(f"{BASE_URL}/api/feed/live?limit=50", timeout=20)
    assert feed_resp.status_code == 200
    entries = feed_resp.json().get("entries", [])
    matches = [e for e in entries if e.get("workout_snapshot_id") == snap_id]
    assert matches, f"single-workout snapshot {snap_id} not surfaced"
    assert matches[0]["mood_bucket"] == "lazy", (
        f"expected lazy bucket, got {matches[0]['mood_bucket']}"
    )
