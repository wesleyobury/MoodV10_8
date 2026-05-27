"""Tests for GET /api/users/me/home-summary endpoint and mood event aggregation."""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("EXPO_BACKEND_URL") or os.environ.get("EXPO_PUBLIC_BACKEND_URL") or "https://mood-cutover-1.preview.emergentagent.com"
BASE_URL = BASE_URL.rstrip("/")

PASSWORD = "TestPass12345678"  # 16 chars


@pytest.fixture(scope="module")
def fresh_user():
    """Register a fresh user and return JWT token + user_id."""
    suffix = str(int(time.time() * 1000))
    payload = {
        "username": f"home_{suffix}",
        "email": f"home_{suffix}@example.com",
        "password": PASSWORD,
        "name": "Home Summary Test User",
    }
    r = requests.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=30)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    body = r.json()
    assert "token" in body and "user_id" in body
    return {"token": body["token"], "user_id": body["user_id"], "payload": payload}


# ---------- Auth requirement ----------

class TestAuthRequirement:
    def test_no_auth_returns_401_or_403(self):
        r = requests.get(f"{BASE_URL}/api/users/me/home-summary", timeout=15)
        # FastAPI HTTPBearer w/o auth typically returns 403; some configs 401
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}: {r.text}"

    def test_invalid_token_rejected(self):
        r = requests.get(
            f"{BASE_URL}/api/users/me/home-summary",
            headers={"Authorization": "Bearer not-a-real-token"},
            timeout=15,
        )
        assert r.status_code in (401, 403)


# ---------- Fresh user shape ----------

class TestFreshUserShape:
    def test_fresh_user_returns_empty_counts_and_null_calories(self, fresh_user):
        headers = {"Authorization": f"Bearer {fresh_user['token']}"}
        r = requests.get(f"{BASE_URL}/api/users/me/home-summary", headers=headers, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, dict)
        assert "weekly_mood_counts" in data
        assert "last_workout_calories" in data
        assert isinstance(data["weekly_mood_counts"], dict)
        # Fresh user: no mood events
        assert data["weekly_mood_counts"] == {}, f"Expected empty dict, got {data['weekly_mood_counts']}"
        assert data["last_workout_calories"] is None


# ---------- Mood aggregation ----------

class TestMoodAggregation:
    def test_mood_selected_events_aggregated_by_category(self, fresh_user):
        headers = {"Authorization": f"Bearer {fresh_user['token']}"}

        # Post 3 sweat events
        for _ in range(3):
            r = requests.post(
                f"{BASE_URL}/api/analytics/track",
                headers=headers,
                json={"event_type": "mood_selected", "metadata": {"mood_category": "sweat"}},
                timeout=15,
            )
            assert r.status_code == 200, r.text

        # Post 2 muscle events
        for _ in range(2):
            r = requests.post(
                f"{BASE_URL}/api/analytics/track",
                headers=headers,
                json={"event_type": "mood_selected", "metadata": {"mood_category": "muscle"}},
                timeout=15,
            )
            assert r.status_code == 200

        # Query home-summary
        r = requests.get(f"{BASE_URL}/api/users/me/home-summary", headers=headers, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        counts = data["weekly_mood_counts"]
        assert counts.get("sweat") == 3, f"expected 3 sweat, got {counts}"
        assert counts.get("muscle") == 2, f"expected 2 muscle, got {counts}"

    def test_trend_threshold_exceeds_5(self, fresh_user):
        """Verify the >5 trend threshold logic: push sweat to >5 cumulative."""
        headers = {"Authorization": f"Bearer {fresh_user['token']}"}
        # Currently sweat = 3. Add 4 more = 7 (>5)
        for _ in range(4):
            requests.post(
                f"{BASE_URL}/api/analytics/track",
                headers=headers,
                json={"event_type": "mood_selected", "metadata": {"mood_category": "sweat"}},
                timeout=15,
            )

        r = requests.get(f"{BASE_URL}/api/users/me/home-summary", headers=headers, timeout=15)
        assert r.status_code == 200
        counts = r.json()["weekly_mood_counts"]
        assert counts.get("sweat", 0) >= 6, f"expected sweat >5, got {counts}"


# ---------- Response types ----------

class TestResponseTypes:
    def test_counts_are_integers(self, fresh_user):
        headers = {"Authorization": f"Bearer {fresh_user['token']}"}
        r = requests.get(f"{BASE_URL}/api/users/me/home-summary", headers=headers, timeout=15)
        data = r.json()
        for k, v in data["weekly_mood_counts"].items():
            assert isinstance(k, str)
            assert isinstance(v, int)
