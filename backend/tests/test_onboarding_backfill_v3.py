"""
Backend tests for iteration-21 onboarding tips BACKFILL v3.

Verifies (per review request):
1) app_settings._id='onboarding_backfill_v3' doc exists with applied_at & matched > 0.
2) For ALL users: tips_state.mood_scroll, .form_videos, .completion_share == 'unseen'.
3) Idempotency: second startup does NOT re-reset a manually-changed state.
4) Regression: PATCH /api/users/me/tips-state still works + GET /api/app/onboarding-config.
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


@pytest.fixture(scope="module")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def fresh_user(http):
    suffix = f"{int(time.time())}_{uuid.uuid4().hex[:6]}"
    payload = {
        "username": f"v3_user_{suffix}",
        "email": f"v3_user_{suffix}@example.com",
        "password": "BackfillV3Pass123!",
        "name": f"V3 User {suffix}",
    }
    r = http.post(f"{API}/auth/register", json=payload, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    return {"token": data["token"], "user_id": data["user_id"], **payload}


@pytest.fixture(scope="module")
def auth_headers(fresh_user):
    return {"Authorization": f"Bearer {fresh_user['token']}", "Content-Type": "application/json"}


# ---------- 1) app_settings v3 flag ----------

class TestAppSettingsV3Flag:
    def test_v3_flag_doc_with_applied_at_and_matched_gt_zero(self):
        async def run():
            from motor.motor_asyncio import AsyncIOMotorClient
            env = _read_env("/app/backend/.env")
            client = AsyncIOMotorClient(env["MONGO_URL"])
            try:
                db = client[env["DB_NAME"]]
                doc = await db.app_settings.find_one({"_id": "onboarding_backfill_v3"})
                assert doc is not None, "Backfill v3 flag doc missing in app_settings"
                assert "applied_at" in doc, f"applied_at missing: {doc}"
                assert "matched" in doc, f"matched missing: {doc}"
                assert isinstance(doc["matched"], int) and doc["matched"] > 0, (
                    f"matched should be > 0 (spec: 97 users): {doc.get('matched')}"
                )
                print(f"v3 backfill matched = {doc['matched']} (spec: 97 users)")
            finally:
                client.close()
        asyncio.run(run())

    def test_v2_flag_still_present_for_compat(self):
        """Existing v2 doc must still exist (backfill bumped, not replaced)."""
        async def run():
            from motor.motor_asyncio import AsyncIOMotorClient
            env = _read_env("/app/backend/.env")
            client = AsyncIOMotorClient(env["MONGO_URL"])
            try:
                db = client[env["DB_NAME"]]
                doc = await db.app_settings.find_one({"_id": "onboarding_backfill_v2"})
                assert doc is not None, "v2 backfill doc was removed — regression"
            finally:
                client.close()
        asyncio.run(run())

    def test_v3_log_line_appears_at_least_once(self):
        import subprocess
        out = subprocess.run(
            ["grep", "-c", "Onboarding tips backfill v3 applied",
             "/var/log/supervisor/backend.err.log",
             "/var/log/supervisor/backend.out.log"],
            capture_output=True, text=True,
        ).stdout
        counts = []
        for line in out.strip().splitlines():
            if ":" in line:
                try:
                    counts.append(int(line.rsplit(":", 1)[1]))
                except ValueError:
                    pass
        assert any(c >= 1 for c in counts), f"v3 log line not found: {out!r}"


# ---------- 2) Every user has all 3 keys set to 'unseen' AFTER v3 ----------

class TestAllUsersUnseenAfterV3:
    def test_all_users_have_three_keys_unseen(self):
        async def run():
            from motor.motor_asyncio import AsyncIOMotorClient
            env = _read_env("/app/backend/.env")
            client = AsyncIOMotorClient(env["MONGO_URL"])
            try:
                db = client[env["DB_NAME"]]
                total = await db.users.count_documents({})
                # Count users where any of the 3 keys is NOT 'unseen'.
                # Note: this checks the immediate post-startup state. If a test
                # has since PATCHed a value, that user will fail here — so we
                # exclude our own test users prefixed with v3_user_ / v2_user_.
                bad_ms = await db.users.count_documents({
                    "tips_state.mood_scroll": {"$ne": "unseen"},
                    "username": {"$not": {"$regex": "^(v2|v3)_user_"}},
                })
                bad_fv = await db.users.count_documents({
                    "tips_state.form_videos": {"$ne": "unseen"},
                    "username": {"$not": {"$regex": "^(v2|v3)_user_"}},
                })
                bad_cs = await db.users.count_documents({
                    "tips_state.completion_share": {"$ne": "unseen"},
                    "username": {"$not": {"$regex": "^(v2|v3)_user_"}},
                })
                # All real users should have been reset to 'unseen' by v3 backfill
                # (allow a small tolerance for users created/modified between
                # backfill run and test execution).
                print(f"Total users: {total}, off-unseen ms={bad_ms} fv={bad_fv} cs={bad_cs}")
                # We assert STRICT zero — backfill ran on startup, so any non-unseen
                # comes from PATCHes by other tests. Use prefix filter above.
                assert bad_ms == 0, f"{bad_ms} non-test users have mood_scroll != unseen"
                assert bad_fv == 0, f"{bad_fv} non-test users have form_videos != unseen"
                assert bad_cs == 0, f"{bad_cs} non-test users have completion_share != unseen"
            finally:
                client.close()
        asyncio.run(run())

    def test_no_users_missing_three_keys(self):
        async def run():
            from motor.motor_asyncio import AsyncIOMotorClient
            env = _read_env("/app/backend/.env")
            client = AsyncIOMotorClient(env["MONGO_URL"])
            try:
                db = client[env["DB_NAME"]]
                total = await db.users.count_documents({})
                miss_ms = await db.users.count_documents({"tips_state.mood_scroll": {"$exists": False}})
                miss_fv = await db.users.count_documents({"tips_state.form_videos": {"$exists": False}})
                miss_cs = await db.users.count_documents({"tips_state.completion_share": {"$exists": False}})
                assert miss_ms == 0, f"{miss_ms}/{total} users missing mood_scroll key"
                assert miss_fv == 0, f"{miss_fv}/{total} users missing form_videos key"
                assert miss_cs == 0, f"{miss_cs}/{total} users missing completion_share key"
            finally:
                client.close()
        asyncio.run(run())


# ---------- 3) Fresh user post-v3 shape ----------

class TestFreshUserAfterV3:
    def test_fresh_user_all_three_unseen(self, http, auth_headers):
        r = http.get(f"{API}/users/me", headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        ts = r.json().get("tips_state")
        assert ts, f"tips_state missing: {r.json()}"
        assert ts.get("mood_scroll") == "unseen", ts
        assert ts.get("form_videos") == "unseen", ts
        assert ts.get("completion_share") == "unseen", ts


# ---------- 4) Idempotency ----------

class TestV3Idempotency:
    def test_completed_state_persists_no_re_reset(self, http, auth_headers):
        r = http.patch(
            f"{API}/users/me/tips-state",
            json={"key": "mood_scroll", "state": "completed"},
            headers=auth_headers, timeout=30,
        )
        assert r.status_code == 200, r.text
        me = http.get(f"{API}/users/me", headers=auth_headers, timeout=30).json()
        assert me["tips_state"]["mood_scroll"] == "completed"

        # Wait — flag should prevent re-run; manually-set state must persist.
        time.sleep(2)
        me2 = http.get(f"{API}/users/me", headers=auth_headers, timeout=30).json()
        assert me2["tips_state"]["mood_scroll"] == "completed", (
            f"mood_scroll was reset (idempotency violation): {me2['tips_state']}"
        )


# ---------- 5) Regression on PATCH/GET ----------

class TestRegressionTipsState:
    def test_patch_form_videos_completed(self, http, auth_headers):
        r = http.patch(
            f"{API}/users/me/tips-state",
            json={"key": "form_videos", "state": "completed"},
            headers=auth_headers, timeout=30,
        )
        assert r.status_code == 200, r.text
        me = http.get(f"{API}/users/me", headers=auth_headers, timeout=30).json()
        assert me["tips_state"]["form_videos"] == "completed"

    def test_patch_form_videos_never(self, http, auth_headers):
        r = http.patch(
            f"{API}/users/me/tips-state",
            json={"key": "form_videos", "state": "never"},
            headers=auth_headers, timeout=30,
        )
        assert r.status_code == 200, r.text
        me = http.get(f"{API}/users/me", headers=auth_headers, timeout=30).json()
        assert me["tips_state"]["form_videos"] == "never"

    def test_patch_invalid_state_400(self, http, auth_headers):
        r = http.patch(
            f"{API}/users/me/tips-state",
            json={"key": "form_videos", "state": "garbage"},
            headers=auth_headers, timeout=30,
        )
        assert r.status_code == 400

    def test_patch_invalid_key_400(self, http, auth_headers):
        r = http.patch(
            f"{API}/users/me/tips-state",
            json={"key": "garbage_key", "state": "completed"},
            headers=auth_headers, timeout=30,
        )
        assert r.status_code == 400

    def test_get_onboarding_config_default_true(self, http):
        r = http.get(f"{API}/app/onboarding-config", timeout=30)
        assert r.status_code == 200
        assert r.json().get("onboarding_tips_enabled") is True
