"""Quick test: verify GET /api/user-workouts returns 200 with serialized metrics."""
import time
import requests

BASE = "http://localhost:8001/api"


def test_get_user_workouts_serialization():
    ts = int(time.time() * 1000)
    username = f"wktest_{ts}"
    email = f"{username}@example.com"
    password = "TestPass1234567"

    # Register
    reg = requests.post(f"{BASE}/auth/register", json={
        "username": username,
        "email": email,
        "password": password,
        "name": "Workout Tester",
    })
    assert reg.status_code == 200, f"register failed: {reg.status_code} {reg.text}"
    token = reg.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Log a workout with session-actual metrics
    payload = {
        "workout_id": "test_hiit_001",
        "mood_category": "sweat",
        "calories_burned": 320,
        "session_steps": 1500,
        "duration_actual": 1200,
        "avg_heart_rate": 142,
        "max_heart_rate": 165,
        "session_hrv_sdnn": 65.5,
    }
    post = requests.post(f"{BASE}/user-workouts", json=payload, headers=headers)
    assert post.status_code == 200, f"log workout failed: {post.status_code} {post.text}"

    # Fetch workouts — this previously 500'd on ObjectId serialization
    res = requests.get(f"{BASE}/user-workouts?limit=10", headers=headers)
    assert res.status_code == 200, f"get workouts failed: {res.status_code} {res.text}"
    data = res.json()
    assert isinstance(data, list) and len(data) >= 1, f"expected list with items, got {data}"

    item = data[0]
    assert "id" in item and isinstance(item["id"], str), "id missing / not str"
    assert item["calories_burned"] == 320
    assert item["session_steps"] == 1500
    assert item["avg_heart_rate"] == 142
    assert item["session_hrv_sdnn"] == 65.5
    # completed_at should be JSON-safe string
    assert isinstance(item.get("completed_at"), str)
    print("PASS: GET /api/user-workouts returns serialized metrics ->", item)


if __name__ == "__main__":
    test_get_user_workouts_serialization()
