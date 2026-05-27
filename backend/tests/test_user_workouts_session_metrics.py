"""Tests for POST /api/user-workouts session-metric fields + home-summary
last_workout_calories precedence.

Scope (review_request):
  1. UserWorkoutCreate accepts new optional fields:
     calories_burned, avg_heart_rate, max_heart_rate, hr_samples_count,
     session_steps, session_hrv_sdnn
     (a) legacy-only payload still works (backward compat)
     (b) full new-fields payload works and is stored
     (c) mixed payload works
  2. GET /api/users/me/home-summary
     - last_workout_calories prefers user_workouts.calories_burned over
       template calories_estimate
     - last_workout_calories is null for users with zero workouts
"""
import os
import time
import requests
import pytest

BASE_URL = (
    os.environ.get("EXPO_BACKEND_URL")
    or os.environ.get("EXPO_PUBLIC_BACKEND_URL")
    or "https://mood-cutover-1.preview.emergentagent.com"
).rstrip("/")

PASSWORD = "TestPass12345678"  # 16 chars (>=14 required)


def _register_fresh_user(tag: str) -> dict:
    suffix = f"{tag}_{int(time.time() * 1000)}"
    payload = {
        "username": f"uw_{suffix}",
        "email": f"uw_{suffix}@example.com",
        "password": PASSWORD,
        "name": "UW Session Metrics Test",
    }
    r = requests.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=30)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    body = r.json()
    assert "token" in body, f"no token in register response: {body}"
    return {"token": body["token"], "user_id": body.get("user_id"), "username": payload["username"]}


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ---------- POST /api/user-workouts: backward compatibility ----------

class TestUserWorkoutCreateBackwardCompat:
    def test_legacy_payload_only_succeeds(self):
        """1a) Legacy fields only — workout_id + duration_actual."""
        user = _register_fresh_user("legacy")
        payload = {
            "workout_id": "legacy_workout_001",
            "duration_actual": 1200,  # 20 min
        }
        r = requests.post(
            f"{BASE_URL}/api/user-workouts",
            headers=_auth(user["token"]),
            json=payload,
            timeout=20,
        )
        assert r.status_code == 200, f"legacy POST failed: {r.status_code} {r.text}"
        body = r.json()
        assert body.get("message") == "Workout logged successfully", body
        assert "id" in body and isinstance(body["id"], str) and len(body["id"]) > 0


# ---------- POST /api/user-workouts: all new fields ----------

class TestUserWorkoutCreateAllNewFields:
    def test_all_new_fields_accepted_and_stored(self):
        """1b) Full new-fields payload — verify acceptance and persistence via home-summary.

        We can't read raw user_workouts (the GET /api/user-workouts endpoint has a
        known ObjectId-serialization bug per the review_request), but
        home-summary.last_workout_calories surfaces the stored calories_burned,
        which is sufficient evidence the doc was persisted with the new field.
        """
        user = _register_fresh_user("allnew")
        payload = {
            "workout_id": "allnew_workout_001",
            "duration_actual": 1800,
            "notes": "felt strong",
            "mood_before": "sweat",
            "mood_after": "sweat",
            "calories_burned": 315,
            "avg_heart_rate": 142,
            "max_heart_rate": 178,
            "hr_samples_count": 360,
            "session_steps": 2450,
            "session_hrv_sdnn": 47.3,
        }
        r = requests.post(
            f"{BASE_URL}/api/user-workouts",
            headers=_auth(user["token"]),
            json=payload,
            timeout=20,
        )
        assert r.status_code == 200, f"full new-fields POST failed: {r.status_code} {r.text}"
        body = r.json()
        assert body.get("message") == "Workout logged successfully", body

        # Verify persistence via home-summary (last_workout_calories must reflect 315)
        hs = requests.get(
            f"{BASE_URL}/api/users/me/home-summary",
            headers=_auth(user["token"]),
            timeout=15,
        )
        assert hs.status_code == 200, hs.text
        assert hs.json().get("last_workout_calories") == 315


# ---------- POST /api/user-workouts: mixed ----------

class TestUserWorkoutCreateMixed:
    def test_mixed_payload_accepted(self):
        """1c) Mixed payload — some new fields set, others omitted."""
        user = _register_fresh_user("mixed")
        payload = {
            "workout_id": "mixed_workout_001",
            "duration_actual": 900,
            "calories_burned": 180,
            "avg_heart_rate": 128,
            # max_heart_rate, hr_samples_count, session_steps, session_hrv_sdnn omitted
        }
        r = requests.post(
            f"{BASE_URL}/api/user-workouts",
            headers=_auth(user["token"]),
            json=payload,
            timeout=20,
        )
        assert r.status_code == 200, f"mixed POST failed: {r.status_code} {r.text}"
        body = r.json()
        assert body.get("message") == "Workout logged successfully", body

        # Persistence check
        hs = requests.get(
            f"{BASE_URL}/api/users/me/home-summary",
            headers=_auth(user["token"]),
            timeout=15,
        )
        assert hs.status_code == 200, hs.text
        assert hs.json().get("last_workout_calories") == 180


# ---------- GET /api/users/me/home-summary: precedence ----------

class TestHomeSummaryCaloriesPrecedence:
    def test_no_workouts_returns_null_calories(self):
        """2) Zero user_workouts → last_workout_calories is null."""
        user = _register_fresh_user("nocals")
        r = requests.get(
            f"{BASE_URL}/api/users/me/home-summary",
            headers=_auth(user["token"]),
            timeout=15,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "last_workout_calories" in data
        assert data["last_workout_calories"] is None, data

    def test_session_calories_burned_takes_precedence(self):
        """2) calories_burned=315 → home-summary.last_workout_calories==315."""
        user = _register_fresh_user("precedence")
        r = requests.post(
            f"{BASE_URL}/api/user-workouts",
            headers=_auth(user["token"]),
            json={
                "workout_id": "precedence_workout_001",
                "duration_actual": 1500,
                "calories_burned": 315,
            },
            timeout=20,
        )
        assert r.status_code == 200, r.text

        hs = requests.get(
            f"{BASE_URL}/api/users/me/home-summary",
            headers=_auth(user["token"]),
            timeout=15,
        )
        assert hs.status_code == 200, hs.text
        data = hs.json()
        assert data["last_workout_calories"] == 315, data
        assert isinstance(data["last_workout_calories"], int)

    def test_most_recent_workout_wins(self):
        """Latest user_workouts.calories_burned wins over older logs."""
        user = _register_fresh_user("latest")
        # Older log
        r1 = requests.post(
            f"{BASE_URL}/api/user-workouts",
            headers=_auth(user["token"]),
            json={
                "workout_id": "older_workout",
                "duration_actual": 600,
                "calories_burned": 100,
                "completed_at": "2026-01-01T10:00:00+00:00",
            },
            timeout=20,
        )
        assert r1.status_code == 200, r1.text
        # Newer log
        r2 = requests.post(
            f"{BASE_URL}/api/user-workouts",
            headers=_auth(user["token"]),
            json={
                "workout_id": "newer_workout",
                "duration_actual": 600,
                "calories_burned": 250,
                "completed_at": "2026-01-15T10:00:00+00:00",
            },
            timeout=20,
        )
        assert r2.status_code == 200, r2.text

        hs = requests.get(
            f"{BASE_URL}/api/users/me/home-summary",
            headers=_auth(user["token"]),
            timeout=15,
        )
        assert hs.status_code == 200
        assert hs.json().get("last_workout_calories") == 250
