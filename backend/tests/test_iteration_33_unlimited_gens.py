"""Iteration 33: Verify unlimited Build-for-Me generations + guest blocking
+ GET /api/user-workouts serialization.

Run with the public preview URL so we cover the same path the mobile app uses.
"""
import os
import time
import requests
import pytest

# Frontend points at this preview URL via EXPO_PUBLIC_API_URL. Strip trailing slash.
BASE_URL = os.environ.get(
    "EXPO_PUBLIC_BACKEND_URL", "https://wearable-stats-hub.preview.emergentagent.com"
).rstrip("/")
API = f"{BASE_URL}/api"


def _register():
    ts = int(time.time() * 1000)
    payload = {
        "username": f"iter33_{ts}",
        "email": f"iter33_{ts}@example.com",
        "password": "TestPass1234567",
        "name": "Iter33 Tester",
    }
    r = requests.post(f"{API}/auth/register", json=payload, timeout=20)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    body = r.json()
    return body["token"], body.get("user_id") or body.get("user", {}).get("id")


def _headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def _sweat_payload(intensity="intermediate"):
    return {
        "carts": [
            {
                "id": "s1",
                "workouts": [
                    {
                        "name": "Burpees",
                        "duration": "10 min",
                        "equipment": "None",
                        "description": "",
                        "imageUrl": "",
                    }
                ],
                "totalDuration": 10,
                "intensity": intensity,
                "moodCard": "I want to sweat",
                "workoutType": "Sweat",
            }
        ],
        "moodCard": "I want to sweat",
        "intensity": intensity,
        "selectedMuscleGroups": [],
    }


# ---------- GET /api/user-workouts ----------
def test_user_workouts_returns_200_with_serialized_fields():
    token, _ = _register()
    h = _headers(token)

    log_body = {
        "workout_id": "iter33_hiit",
        "mood_category": "sweat",
        "calories_burned": 320,
        "session_steps": 1500,
        "duration_actual": 1200,
        "avg_heart_rate": 142,
        "max_heart_rate": 165,
        "session_hrv_sdnn": 65.5,
    }
    p = requests.post(f"{API}/user-workouts", json=log_body, headers=h, timeout=20)
    assert p.status_code == 200, f"POST user-workouts -> {p.status_code} {p.text}"

    r = requests.get(f"{API}/user-workouts?limit=10", headers=h, timeout=20)
    assert r.status_code == 200, f"GET user-workouts -> {r.status_code} {r.text}"
    data = r.json()
    assert isinstance(data, list) and len(data) >= 1
    item = data[0]
    assert isinstance(item.get("id"), str), f"missing string id: {item}"
    assert "_id" not in item, "raw ObjectId _id should not leak"
    assert item["calories_burned"] == 320
    assert item["session_steps"] == 1500
    assert item["avg_heart_rate"] == 142
    assert item["max_heart_rate"] == 165
    assert item["session_hrv_sdnn"] == 65.5
    assert isinstance(item.get("completed_at"), str), "completed_at must be ISO string"


# ---------- Unlimited generations + skip ----------
def test_choose_for_me_usage_returns_999_can_generate_true():
    token, _ = _register()
    r = requests.get(f"{API}/choose-for-me/usage", headers=_headers(token), timeout=15)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("remaining_uses") == 999, j
    assert j.get("can_generate") is True, j


def test_choose_for_me_generate_six_in_a_row_all_200():
    token, _ = _register()
    statuses = []
    for i in range(6):
        r = requests.post(
            f"{API}/choose-for-me/generate",
            headers=_headers(token),
            json=_sweat_payload(),
            timeout=20,
        )
        statuses.append(r.status_code)
        if r.status_code == 200:
            assert r.json().get("remaining_uses") == 999
    assert all(s == 200 for s in statuses), f"expected all 200, got {statuses}"


def test_choose_for_me_skip_ping_returns_200():
    token, _ = _register()
    skip = {"carts": [], "moodCard": "I want to sweat", "intensity": "skip"}
    r = requests.post(
        f"{API}/choose-for-me/generate", headers=_headers(token), json=skip, timeout=15
    )
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("skipped") is True
    assert j.get("remaining_uses") == 999


# ---------- Guests blocked ----------
def test_choose_for_me_usage_blocks_guest():
    r = requests.get(f"{API}/choose-for-me/usage", timeout=15)
    assert r.status_code in (401, 403), f"expected 401/403, got {r.status_code} {r.text}"


def test_choose_for_me_generate_blocks_guest():
    r = requests.post(f"{API}/choose-for-me/generate", json=_sweat_payload(), timeout=15)
    assert r.status_code in (401, 403), f"expected 401/403, got {r.status_code} {r.text}"


# ---------- Regression: auth + posts feed + like/comment ----------
def test_auth_login_after_register():
    ts = int(time.time() * 1000)
    payload = {
        "username": f"iter33login_{ts}",
        "email": f"iter33login_{ts}@example.com",
        "password": "TestPass1234567",
        "name": "Login Tester",
    }
    rr = requests.post(f"{API}/auth/register", json=payload, timeout=20)
    assert rr.status_code == 200, rr.text
    lr = requests.post(
        f"{API}/auth/login",
        json={"username": payload["username"], "password": payload["password"]},
        timeout=20,
    )
    assert lr.status_code == 200, lr.text
    assert "token" in lr.json()


def test_posts_feed_reachable():
    # Public/global feed lives at /api/posts (typed as a paginated list).
    token, _ = _register()
    r = requests.get(f"{API}/posts?limit=5", headers=_headers(token), timeout=20)
    assert r.status_code == 200, f"posts feed -> {r.status_code} {r.text}"
    body = r.json()
    assert isinstance(body, (list, dict))


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
