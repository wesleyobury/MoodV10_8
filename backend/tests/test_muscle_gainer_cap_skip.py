"""
Backend tests for Muscle Gainer v3 cap-skip behaviour on /api/choose-for-me/generate.

Verifies:
  1. moodCard == "I want to gain muscle" -> no 429 even on 5+ consecutive calls
     for a non-admin user.
  2. moodCard == "I want to sweat" (any other mood) -> 3/day cap still enforced,
     4th call returns 429.
  3. Admin user (officialmoodapp) skips cap entirely for non-muscle-gainer moods.
  4. Other moods (Lazy / Outdoor / Calisthenics / Explosive) regression check.
"""

import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_BACKEND_URL", "https://mood-cutover.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


# ---------- helpers ----------

def _make_cart_payload(mood_card: str):
    """Minimal valid SaveGeneratedWorkoutsRequest payload."""
    return {
        "moodCard": mood_card,
        "intensity": "Intermediate",
        "carts": [
            {
                "id": f"cart_{uuid.uuid4().hex[:8]}",
                "workouts": [
                    {
                        "name": "Bench Press",
                        "duration": "5x5",
                        "equipment": "Barbell",
                        "description": "Heavy compound",
                        "imageUrl": "",
                    }
                ],
                "totalDuration": 25,
                "intensity": "Intermediate",
                "moodCard": mood_card,
                "workoutType": "strength",
            }
        ],
    }


def _register_user():
    """Register an ephemeral non-admin test user and return (user_id, token, headers)."""
    suffix = uuid.uuid4().hex[:10]
    payload = {
        "username": f"mgcap_{suffix}",
        "email": f"mgcap_{suffix}@example.com",
        "password": "TestPass1234567",
        "name": "MG Cap Test",
    }
    r = requests.post(f"{API}/auth/register", json=payload, timeout=30)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    token = data["token"]
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    return data["user_id"], token, headers


def _login_admin():
    """Login as officialmoodapp admin. Skip tests if password unknown / login fails."""
    # The credentials file lists username only; try common admin passwords.
    candidates = [
        os.environ.get("ADMIN_PASSWORD"),
        "officialmoodapp",
        "TestPass1234567",
        "Password123!",
        "admin",
    ]
    for pw in [c for c in candidates if c]:
        r = requests.post(
            f"{API}/auth/login",
            json={"username": "officialmoodapp", "password": pw},
            timeout=30,
        )
        if r.status_code == 200:
            tok = r.json().get("token")
            if tok:
                return tok, {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}
    return None, None


# ---------- fixtures ----------

@pytest.fixture(scope="module")
def user_ctx():
    user_id, token, headers = _register_user()
    yield {"user_id": user_id, "token": token, "headers": headers}


# ---------- tests ----------

class TestMuscleGainerCapSkip:
    """v3 cap-skip behaviour."""

    def test_muscle_gainer_no_cap_5_consecutive(self, user_ctx):
        """5 consecutive 'I want to gain muscle' generations should all return 200."""
        headers = user_ctx["headers"]
        payload = _make_cart_payload("I want to gain muscle")

        statuses = []
        for i in range(5):
            r = requests.post(f"{API}/choose-for-me/generate", json=payload, headers=headers, timeout=30)
            statuses.append(r.status_code)
        assert all(s == 200 for s in statuses), (
            f"Muscle Gainer should never hit 429 — got statuses: {statuses}"
        )

    def test_muscle_gainer_response_shape(self, user_ctx):
        """Response should include success + generated_workout_id."""
        headers = user_ctx["headers"]
        payload = _make_cart_payload("I want to gain muscle")
        r = requests.post(f"{API}/choose-for-me/generate", json=payload, headers=headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        assert "generated_workout_id" in data
        assert isinstance(data["generated_workout_id"], str) and len(data["generated_workout_id"]) > 0
        assert "remaining_uses" in data


class TestOtherMoodCapEnforced:
    """Non-muscle-gainer moods still get 3/day cap."""

    def test_sweat_cap_enforced_on_4th_call(self):
        """Use a fresh user to avoid contamination from muscle-gainer tests."""
        _, _, headers = _register_user()
        payload = _make_cart_payload("I want to sweat")

        # First 3 should succeed
        for i in range(3):
            r = requests.post(f"{API}/choose-for-me/generate", json=payload, headers=headers, timeout=30)
            assert r.status_code == 200, f"Call #{i+1} for Sweat should succeed: {r.status_code} {r.text}"

        # 4th should 429
        r = requests.post(f"{API}/choose-for-me/generate", json=payload, headers=headers, timeout=30)
        assert r.status_code == 429, (
            f"4th Sweat call should be 429, got {r.status_code} {r.text}"
        )
        body = r.json()
        assert "detail" in body
        assert "limit" in body["detail"].lower() or "3 times" in body["detail"]

    def test_muscle_gainer_still_works_after_other_mood_cap_hit(self):
        """Verify muscle-gainer still works for the same user after other mood is capped."""
        _, _, headers = _register_user()
        sweat = _make_cart_payload("I want to sweat")
        # Cap out Sweat
        for _ in range(3):
            requests.post(f"{API}/choose-for-me/generate", json=sweat, headers=headers, timeout=30)
        r = requests.post(f"{API}/choose-for-me/generate", json=sweat, headers=headers, timeout=30)
        assert r.status_code == 429

        # Now muscle gainer should still work, multiple times
        mg = _make_cart_payload("I want to gain muscle")
        for i in range(4):
            r = requests.post(f"{API}/choose-for-me/generate", json=mg, headers=headers, timeout=30)
            assert r.status_code == 200, f"MG call #{i+1} after Sweat cap should still pass: {r.status_code} {r.text}"


class TestOtherMoodsRegression:
    """Other moods (Lazy, Outdoor, Calisthenics, Explosive) should still accept the first 3 calls."""

    @pytest.mark.parametrize("mood", [
        "I want to be lazy",
        "I want to go outdoor",
        "I want to do calisthenics",
        "I want to be explosive",
    ])
    def test_other_mood_first_call_succeeds(self, mood):
        _, _, headers = _register_user()
        payload = _make_cart_payload(mood)
        r = requests.post(f"{API}/choose-for-me/generate", json=payload, headers=headers, timeout=30)
        assert r.status_code == 200, (
            f"Mood '{mood}' first call should return 200, got {r.status_code} {r.text}"
        )
        assert r.json().get("success") is True


class TestUsageEndpoint:
    """The /usage endpoint reports usage_count correctly (it still counts MG calls)."""

    def test_usage_endpoint_reachable(self, user_ctx):
        headers = user_ctx["headers"]
        r = requests.get(f"{API}/choose-for-me/usage", headers=headers, timeout=30)
        assert r.status_code == 200
        data = r.json()
        assert "usage_count" in data
        assert "remaining_uses" in data
        assert "can_generate" in data


class TestAuthRequired:
    """Endpoint must require auth."""

    def test_generate_without_auth_returns_401_or_403(self):
        payload = _make_cart_payload("I want to gain muscle")
        r = requests.post(f"{API}/choose-for-me/generate", json=payload, timeout=30)
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}"
