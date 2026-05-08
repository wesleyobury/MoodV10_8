"""
Backend tests for the new-user onboarding tips system.

Coverage:
1) GET  /api/app/onboarding-config            (public)
2) POST /api/auth/register                    (initializes tips_state)
3) GET  /api/users/me                         (returns tips_state, with lazy default for legacy users)
4) PATCH /api/users/me/tips-state             (validates key/state, persists, mood_scroll forbids 'never', auth required)
5) Regression: POST /api/users/me/avatar-base64 still reachable
"""

import os
import time
import uuid
import pytest
import requests
from pathlib import Path

# Resolve backend URL from frontend/.env (Expo / React Native uses EXPO_PUBLIC_BACKEND_URL)
def _resolve_backend_url() -> str:
    env_path = Path("/app/frontend/.env")
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                if k.strip() in ("REACT_APP_BACKEND_URL", "EXPO_PUBLIC_BACKEND_URL"):
                    return v.strip().strip('"').strip("'").rstrip("/")
    raise RuntimeError("Backend URL not found in /app/frontend/.env")


BASE_URL = _resolve_backend_url()
API = f"{BASE_URL}/api"


# ---------------------- Fixtures ----------------------

@pytest.fixture(scope="module")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def fresh_user(http):
    """Create a fresh user via /api/auth/register and return (token, user_id, username, email)."""
    suffix = f"{int(time.time())}_{uuid.uuid4().hex[:6]}"
    payload = {
        "username": f"tips_user_{suffix}",
        "email": f"tips_user_{suffix}@example.com",
        "password": "TipsTestPass123!",
        "name": f"Tips User {suffix}",
    }
    r = http.post(f"{API}/auth/register", json=payload, timeout=30)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data and "user_id" in data, f"register returned no token/user_id: {data}"
    return {
        "token": data["token"],
        "user_id": data["user_id"],
        "username": payload["username"],
        "email": payload["email"],
        "password": payload["password"],
    }


@pytest.fixture(scope="module")
def auth_headers(fresh_user):
    return {
        "Authorization": f"Bearer {fresh_user['token']}",
        "Content-Type": "application/json",
    }


# ---------------------- 1) Public onboarding-config ----------------------

class TestOnboardingConfig:
    def test_get_onboarding_config_no_auth_required(self, http):
        # Brand-new requests session, no auth
        r = http.get(f"{API}/app/onboarding-config", timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "onboarding_tips_enabled" in body
        assert isinstance(body["onboarding_tips_enabled"], bool)
        # default-true contract
        assert body["onboarding_tips_enabled"] is True

    def test_get_onboarding_config_does_not_leak_mongo_id(self, http):
        r = http.get(f"{API}/app/onboarding-config", timeout=30)
        assert r.status_code == 200
        assert "_id" not in r.json()


# ---------------------- 2) Register initializes tips_state ----------------------

class TestRegisterInitializesTipsState:
    def test_register_succeeds_and_me_has_all_tip_keys_unseen(self, http, fresh_user):
        headers = {"Authorization": f"Bearer {fresh_user['token']}"}
        r = http.get(f"{API}/users/me", headers=headers, timeout=30)
        assert r.status_code == 200, r.text
        me = r.json()
        assert "tips_state" in me, f"tips_state missing: {me}"
        ts = me["tips_state"]
        assert isinstance(ts, dict)
        for k in ("mood_scroll", "form_videos", "completion_share"):
            assert k in ts, f"key {k} missing from tips_state: {ts}"
            assert ts[k] == "unseen", f"{k} should default to 'unseen', got {ts[k]}"


# ---------------------- 3) /users/me lazy default for legacy users ----------------------

class TestUsersMeTipsStateShape:
    def test_me_always_returns_three_tip_keys(self, http, auth_headers):
        # Proxy for legacy-user lazy default: shape is always present.
        r = http.get(f"{API}/users/me", headers=auth_headers, timeout=30)
        assert r.status_code == 200
        ts = r.json().get("tips_state")
        assert ts is not None
        assert set(ts.keys()) >= {"mood_scroll", "form_videos", "completion_share"}

    def test_me_does_not_leak_password_or_mongo_id_field(self, http, auth_headers):
        r = http.get(f"{API}/users/me", headers=auth_headers, timeout=30)
        assert r.status_code == 200
        body = r.json()
        assert "password" not in body
        # response uses "id" (str) — not Mongo's "_id"
        assert "_id" not in body
        assert "id" in body and isinstance(body["id"], str)


# ---------------------- 4) PATCH /users/me/tips-state ----------------------

class TestPatchTipsState:
    # Happy paths

    def test_patch_mood_scroll_completed(self, http, auth_headers):
        r = http.patch(
            f"{API}/users/me/tips-state",
            json={"key": "mood_scroll", "state": "completed"},
            headers=auth_headers,
            timeout=30,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body == {"key": "mood_scroll", "state": "completed"}

        # Verify persistence and that other keys are untouched
        me = http.get(f"{API}/users/me", headers=auth_headers, timeout=30).json()
        ts = me["tips_state"]
        assert ts["mood_scroll"] == "completed"
        assert ts["form_videos"] == "unseen"
        assert ts["completion_share"] == "unseen"

    def test_patch_form_videos_never_allowed(self, http, auth_headers):
        r = http.patch(
            f"{API}/users/me/tips-state",
            json={"key": "form_videos", "state": "never"},
            headers=auth_headers,
            timeout=30,
        )
        assert r.status_code == 200, r.text
        assert r.json() == {"key": "form_videos", "state": "never"}

        me = http.get(f"{API}/users/me", headers=auth_headers, timeout=30).json()
        assert me["tips_state"]["form_videos"] == "never"
        # mood_scroll from previous test must still be 'completed'
        assert me["tips_state"]["mood_scroll"] == "completed"

    def test_patch_completion_share_never_allowed(self, http, auth_headers):
        r = http.patch(
            f"{API}/users/me/tips-state",
            json={"key": "completion_share", "state": "never"},
            headers=auth_headers,
            timeout=30,
        )
        assert r.status_code == 200, r.text
        assert r.json() == {"key": "completion_share", "state": "never"}

        me = http.get(f"{API}/users/me", headers=auth_headers, timeout=30).json()
        assert me["tips_state"]["completion_share"] == "never"

    def test_patch_dismissed_state_persists(self, http, auth_headers):
        # form_videos was 'never' — set to 'dismissed' to confirm overwrite works for valid states
        r = http.patch(
            f"{API}/users/me/tips-state",
            json={"key": "form_videos", "state": "dismissed"},
            headers=auth_headers,
            timeout=30,
        )
        assert r.status_code == 200
        me = http.get(f"{API}/users/me", headers=auth_headers, timeout=30).json()
        assert me["tips_state"]["form_videos"] == "dismissed"

    # Negative paths

    def test_patch_mood_scroll_never_rejected(self, http, auth_headers):
        r = http.patch(
            f"{API}/users/me/tips-state",
            json={"key": "mood_scroll", "state": "never"},
            headers=auth_headers,
            timeout=30,
        )
        assert r.status_code == 400, r.text
        # mood_scroll should NOT have been changed
        me = http.get(f"{API}/users/me", headers=auth_headers, timeout=30).json()
        assert me["tips_state"]["mood_scroll"] == "completed"

    @pytest.mark.parametrize("bad_key", ["mood_scrool", "MoodScroll", "", "random_tip", "completion-share"])
    def test_patch_invalid_key_returns_400(self, http, auth_headers, bad_key):
        r = http.patch(
            f"{API}/users/me/tips-state",
            json={"key": bad_key, "state": "completed"},
            headers=auth_headers,
            timeout=30,
        )
        assert r.status_code == 400, f"key={bad_key!r} -> {r.status_code} {r.text}"

    @pytest.mark.parametrize("bad_state", ["seen", "DONE", "", "complete", "skipped", "Never"])
    def test_patch_invalid_state_returns_400(self, http, auth_headers, bad_state):
        r = http.patch(
            f"{API}/users/me/tips-state",
            json={"key": "form_videos", "state": bad_state},
            headers=auth_headers,
            timeout=30,
        )
        assert r.status_code == 400, f"state={bad_state!r} -> {r.status_code} {r.text}"

    def test_patch_missing_fields_returns_422(self, http, auth_headers):
        # FastAPI/Pydantic validation -> 422 for missing required fields
        r = http.patch(
            f"{API}/users/me/tips-state",
            json={"key": "mood_scroll"},  # missing state
            headers=auth_headers,
            timeout=30,
        )
        assert r.status_code in (400, 422), r.text

    def test_patch_without_auth_rejected(self, http):
        r = http.patch(
            f"{API}/users/me/tips-state",
            json={"key": "mood_scroll", "state": "completed"},
            timeout=30,
        )
        assert r.status_code in (401, 403), r.text

    def test_patch_with_invalid_token_rejected(self, http):
        r = http.patch(
            f"{API}/users/me/tips-state",
            json={"key": "mood_scroll", "state": "completed"},
            headers={"Authorization": "Bearer not-a-valid-jwt", "Content-Type": "application/json"},
            timeout=30,
        )
        assert r.status_code in (401, 403), r.text

    def test_patch_isolation_between_keys(self, http, auth_headers):
        """Updating one key must not affect the other two."""
        # Snapshot
        before = http.get(f"{API}/users/me", headers=auth_headers, timeout=30).json()["tips_state"]

        # Flip completion_share -> dismissed
        r = http.patch(
            f"{API}/users/me/tips-state",
            json={"key": "completion_share", "state": "dismissed"},
            headers=auth_headers,
            timeout=30,
        )
        assert r.status_code == 200

        after = http.get(f"{API}/users/me", headers=auth_headers, timeout=30).json()["tips_state"]
        assert after["completion_share"] == "dismissed"
        assert after["mood_scroll"] == before["mood_scroll"]
        assert after["form_videos"] == before["form_videos"]


# ---------------------- 5) Regression: avatar-base64 reachable ----------------------

class TestAvatarBase64Regression:
    def test_avatar_base64_endpoint_exists_and_requires_auth(self, http):
        # No body, no auth -> must NOT 404 (endpoint must exist) and must require auth
        r = http.post(f"{API}/users/me/avatar-base64", json={}, timeout=30)
        # Could be 401/403 (auth) or 422 (body validation runs before auth in some setups).
        assert r.status_code != 404, "avatar-base64 endpoint missing (regression!)"
        assert r.status_code in (401, 403, 422), f"unexpected status: {r.status_code} {r.text}"

    def test_avatar_base64_with_auth_does_not_500_on_validation(self, http, auth_headers):
        # Empty body with auth -> 422 (Pydantic) or 400 — must not 500
        r = http.post(f"{API}/users/me/avatar-base64", json={}, headers=auth_headers, timeout=30)
        assert r.status_code != 404
        assert r.status_code < 500, f"Endpoint 5xx with empty body: {r.status_code} {r.text}"
