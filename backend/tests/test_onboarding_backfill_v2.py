"""
Backend tests for the iteration-19 onboarding tips BACKFILL v2.

Verifies (per review request):
1) app_settings._id='onboarding_backfill_v2' exists with applied_at and matched count > 0.
2) For ALL existing users, tips_state.mood_scroll, tips_state.form_videos, tips_state.completion_share
   are present (post-v2) — fresh registers default to 'unseen'.
3) Idempotency: a manually-set 'completed' value persists (no second-run reset).
4) Regression: PATCH /api/users/me/tips-state still works.
"""

import time
import uuid
import asyncio
import pytest
import requests
from pathlib import Path


def _resolve_backend_url() -> str:
    env_path = Path("/app/frontend/.env")
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if "=" in line and line.split("=", 1)[0].strip() in (
            "REACT_APP_BACKEND_URL", "EXPO_PUBLIC_BACKEND_URL"
        ):
            return line.split("=", 1)[1].strip().strip('"').strip("'").rstrip("/")
    raise RuntimeError("Backend URL not found")


BASE_URL = _resolve_backend_url()
API = f"{BASE_URL}/api"


def _read_env(path: str) -> dict:
    env = {}
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env


# ---------------------- Fixtures ----------------------

@pytest.fixture(scope="module")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def fresh_user(http):
    suffix = f"{int(time.time())}_{uuid.uuid4().hex[:6]}"
    payload = {
        "username": f"v2_user_{suffix}",
        "email": f"v2_user_{suffix}@example.com",
        "password": "BackfillV2Pass123!",
        "name": f"V2 User {suffix}",
    }
    r = http.post(f"{API}/auth/register", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    return {"token": data["token"], "user_id": data["user_id"], **payload}


@pytest.fixture(scope="module")
def auth_headers(fresh_user):
    return {"Authorization": f"Bearer {fresh_user['token']}", "Content-Type": "application/json"}


# ---------------------- 1) app_settings v2 flag ----------------------

class TestAppSettingsV2Flag:
    def test_v2_flag_exists_with_matched_count_and_applied_at(self):
        async def run():
            from motor.motor_asyncio import AsyncIOMotorClient
            env = _read_env("/app/backend/.env")
            client = AsyncIOMotorClient(env["MONGO_URL"])
            try:
                db = client[env["DB_NAME"]]
                doc = await db.app_settings.find_one({"_id": "onboarding_backfill_v2"})
                assert doc is not None, "Backfill v2 flag doc missing in app_settings"
                assert "applied_at" in doc, f"applied_at missing: {doc}"
                assert "matched" in doc, f"matched missing: {doc}"
                assert isinstance(doc["matched"], int) and doc["matched"] > 0, (
                    f"matched should be > 0 (spec: 91 users): {doc.get('matched')}"
                )
                print(f"v2 backfill matched = {doc['matched']} (spec mentioned 91)")
            finally:
                client.close()

        asyncio.run(run())

    def test_all_users_have_three_tip_keys(self):
        """Post-v2: every user doc has tips_state.mood_scroll, .form_videos, .completion_share."""
        async def run():
            from motor.motor_asyncio import AsyncIOMotorClient
            env = _read_env("/app/backend/.env")
            client = AsyncIOMotorClient(env["MONGO_URL"])
            try:
                db = client[env["DB_NAME"]]
                total = await db.users.count_documents({})
                missing_ms = await db.users.count_documents({"tips_state.mood_scroll": {"$exists": False}})
                missing_fv = await db.users.count_documents({"tips_state.form_videos": {"$exists": False}})
                missing_cs = await db.users.count_documents({"tips_state.completion_share": {"$exists": False}})
                assert missing_ms == 0, f"{missing_ms}/{total} users missing tips_state.mood_scroll"
                assert missing_fv == 0, f"{missing_fv}/{total} users missing tips_state.form_videos"
                assert missing_cs == 0, f"{missing_cs}/{total} users missing tips_state.completion_share"
            finally:
                client.close()

        asyncio.run(run())

    def test_v2_log_line_appears_at_least_once(self):
        import subprocess
        out = subprocess.run(
            ["grep", "-c", "Onboarding tips backfill v2 applied",
             "/var/log/supervisor/backend.err.log",
             "/var/log/supervisor/backend.out.log"],
            capture_output=True, text=True
        ).stdout
        # At least one of the files has >=1 occurrence.
        counts = []
        for line in out.strip().splitlines():
            if ":" in line:
                try:
                    counts.append(int(line.rsplit(":", 1)[1]))
                except ValueError:
                    pass
        assert any(c >= 1 for c in counts), f"v2 log line not found: {out!r}"


# ---------------------- 2) Fresh user state shape ----------------------

class TestFreshUserAfterV2:
    def test_fresh_user_has_all_three_keys_unseen(self, http, auth_headers):
        r = http.get(f"{API}/users/me", headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        ts = r.json().get("tips_state")
        assert ts, f"tips_state missing: {r.json()}"
        assert ts.get("mood_scroll") == "unseen", f"mood_scroll != unseen: {ts}"
        assert ts.get("form_videos") == "unseen", f"form_videos != unseen: {ts}"
        assert ts.get("completion_share") == "unseen", f"completion_share != unseen: {ts}"


# ---------------------- 3) Idempotency ----------------------

class TestV2Idempotency:
    def test_completed_state_persists_no_re_reset(self, http, auth_headers):
        # Set form_videos -> completed
        r = http.patch(
            f"{API}/users/me/tips-state",
            json={"key": "form_videos", "state": "completed"},
            headers=auth_headers, timeout=30,
        )
        assert r.status_code == 200, r.text

        me = http.get(f"{API}/users/me", headers=auth_headers, timeout=30).json()
        assert me["tips_state"]["form_videos"] == "completed"

        # Wait briefly — if v2 backfill flag is in place, no more backfills run.
        time.sleep(2)
        me2 = http.get(f"{API}/users/me", headers=auth_headers, timeout=30).json()
        assert me2["tips_state"]["form_videos"] == "completed", (
            f"form_videos was reset (idempotency violation): {me2['tips_state']}"
        )


# ---------------------- 4) Regression: PATCH/GET tips-state ----------------------

class TestRegressionTipsStatePatch:
    def test_patch_completion_share_completed(self, http, auth_headers):
        r = http.patch(
            f"{API}/users/me/tips-state",
            json={"key": "completion_share", "state": "completed"},
            headers=auth_headers, timeout=30,
        )
        assert r.status_code == 200, r.text
        me = http.get(f"{API}/users/me", headers=auth_headers, timeout=30).json()
        assert me["tips_state"]["completion_share"] == "completed"

    def test_patch_completion_share_never(self, http, auth_headers):
        r = http.patch(
            f"{API}/users/me/tips-state",
            json={"key": "completion_share", "state": "never"},
            headers=auth_headers, timeout=30,
        )
        assert r.status_code == 200, r.text
        me = http.get(f"{API}/users/me", headers=auth_headers, timeout=30).json()
        assert me["tips_state"]["completion_share"] == "never"

    def test_patch_invalid_key_400(self, http, auth_headers):
        r = http.patch(
            f"{API}/users/me/tips-state",
            json={"key": "garbage_key", "state": "completed"},
            headers=auth_headers, timeout=30,
        )
        assert r.status_code == 400

    def test_onboarding_config_default_true(self, http):
        r = http.get(f"{API}/app/onboarding-config", timeout=30)
        assert r.status_code == 200
        assert r.json().get("onboarding_tips_enabled") is True
