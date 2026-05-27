"""Regression tests for /api/choose-for-me/generate cap + skip-ping handling.

Covers (per iteration_26 brief):
 - Skip-pings (intensity='skip') are telemetry-only and DO NOT count toward
   the 3/day cap for any mood.
 - Muscle Gainer (mood='I want to gain muscle') generations are uncapped
   (HTTP 200 forever).
 - Non-MG moods retain the 3/day cap (4th non-MG returns HTTP 429).
 - Mixed scenario: per brief, '3 MG gens then 1 Sweat gen should pass — MG
   calls don't count for the cap'. This is currently FAILING (MG inserts into
   choose_for_me_usage and burns the Sweat cap).
"""
import os
import time
import requests
import pytest

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://mood-cutover.preview.emergentagent.com").rstrip("/")


def _register():
    ts = int(time.time() * 1000)
    u = {
        "username": f"capskip_{ts}",
        "email": f"capskip_{ts}@example.com",
        "password": "TestPass1234567",
    }
    r = requests.post(f"{BASE_URL}/api/auth/register", json=u, timeout=20)
    assert r.status_code == 200, r.text
    return r.json()["token"]


def _headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def _mg_payload():
    return {
        "carts": [{"id": "c1",
                   "workouts": [{"name": "Bench", "duration": "10 min", "equipment": "Barbell",
                                 "description": "", "imageUrl": ""}],
                   "totalDuration": 10, "intensity": "intermediate",
                   "moodCard": "I want to gain muscle", "workoutType": "Muscle Building"}],
        "moodCard": "I want to gain muscle",
        "intensity": "intermediate",
        "selectedMuscleGroups": ["Chest"],
    }


def _sweat_payload():
    return {
        "carts": [{"id": "s1",
                   "workouts": [{"name": "Burpees", "duration": "10 min", "equipment": "None",
                                 "description": "", "imageUrl": ""}],
                   "totalDuration": 10, "intensity": "intermediate",
                   "moodCard": "I want to sweat", "workoutType": "Sweat"}],
        "moodCard": "I want to sweat",
        "intensity": "intermediate",
        "selectedMuscleGroups": [],
    }


def _skip_payload(mood="I want to sweat"):
    return {"carts": [], "moodCard": mood, "intensity": "skip"}


def test_skip_pings_are_telemetry_only():
    """10 skip-pings must NOT decrement remaining_uses."""
    token = _register()
    for i in range(10):
        r = requests.post(f"{BASE_URL}/api/choose-for-me/generate",
                          headers=_headers(token), json=_skip_payload(), timeout=15)
        assert r.status_code == 200, f"skip {i} -> {r.text}"
        j = r.json()
        assert j.get("skipped") is True
        assert j.get("remaining_uses") == 3, f"skip burned cap on iter {i}: {j}"


def test_sweat_cap_unchanged_after_skips():
    """After 10 skip-pings, user still has full 3/day Sweat budget."""
    token = _register()
    for _ in range(10):
        requests.post(f"{BASE_URL}/api/choose-for-me/generate",
                      headers=_headers(token), json=_skip_payload(), timeout=15)
    statuses = []
    for _ in range(4):
        r = requests.post(f"{BASE_URL}/api/choose-for-me/generate",
                          headers=_headers(token), json=_sweat_payload(), timeout=15)
        statuses.append(r.status_code)
    assert statuses == [200, 200, 200, 429], f"Expected 3x200 + 429, got {statuses}"


def test_muscle_gainer_uncapped_4_consecutive_gens():
    """4 consecutive MG generations should all return HTTP 200 (no daily cap)."""
    token = _register()
    statuses = []
    for _ in range(4):
        r = requests.post(f"{BASE_URL}/api/choose-for-me/generate",
                          headers=_headers(token), json=_mg_payload(), timeout=15)
        statuses.append(r.status_code)
    assert all(s == 200 for s in statuses), f"MG gens 429'd: {statuses}"


def test_mg_generations_do_not_burn_sweat_cap():
    """Per iteration_26 brief: 3 MG gens then 1 Sweat gen should PASS — MG
    calls shouldn't count toward the cap.

    NOTE: This currently FAILS on the live backend — MG gens insert into
    choose_for_me_usage and the Sweat call 429s on the first attempt after 3
    MG gens. Test asserts the intended behaviour to surface the regression.
    """
    token = _register()
    for i in range(3):
        r = requests.post(f"{BASE_URL}/api/choose-for-me/generate",
                          headers=_headers(token), json=_mg_payload(), timeout=15)
        assert r.status_code == 200, f"MG gen {i} -> {r.text}"
    r = requests.post(f"{BASE_URL}/api/choose-for-me/generate",
                      headers=_headers(token), json=_sweat_payload(), timeout=15)
    assert r.status_code == 200, (
        f"Sweat gen after 3 MG gens returned {r.status_code} ({r.text}). "
        "MG calls are burning the Sweat cap — backend bug."
    )
