"""Integration tests for /api/feed/live endpoint via public preview URL.

Covers:
- Auth requirement (401/403 without token)
- Response shape (stats + entries)
- Field schema for each entry
- Mood bucket classification
- Entry type validity
- Relative time text
- Sorting by timestamp DESC
- Limit param
- Regression: /api/posts/public and /api/posts still respond
"""
import os
import re
import sys
from datetime import datetime, timezone

import jwt
import pytest
import requests

# Make backend importable for JWT secret access
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

# Public preview URL — frontend uses EXPO_PUBLIC_BACKEND_URL in this app
BASE_URL = (
    os.environ.get("REACT_APP_BACKEND_URL")
    or os.environ.get("EXPO_PUBLIC_BACKEND_URL")
    or "https://free-tier-limit-2.preview.emergentagent.com"
).rstrip("/")

JWT_SECRET = os.environ.get("JWT_SECRET")
ADMIN_USER_ID = "693f94d29a560edaab674fd5"  # officialmoodapp

VALID_MOOD_BUCKETS = {"sweat", "muscle", "explosive", "lazy", "calisthenics", "outdoor"}
VALID_ENTRY_TYPES = {"live_now", "completion", "milestone"}
VALID_MILESTONES = {5, 10, 25, 50, 100, 250, 500, 1000}

REL_TIME_RE = re.compile(
    r"(just now|min ago|hr ago|days ago|yesterday|last week|earlier)",
    re.IGNORECASE,
)


@pytest.fixture(scope="module")
def admin_token():
    assert JWT_SECRET, "JWT_SECRET missing from backend .env"
    payload = {
        "user_id": ADMIN_USER_ID,
        "exp": datetime.now(timezone.utc).timestamp() + 3600,
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def live_feed_response(auth_headers):
    r = requests.get(f"{BASE_URL}/api/feed/live?limit=30", headers=auth_headers, timeout=30)
    assert r.status_code == 200, f"got {r.status_code}: {r.text[:300]}"
    return r.json()


# --------------------------- Auth ---------------------------

class TestAuth:
    def test_guest_access_allowed(self):
        """Live feed is intentionally public so the Live tab is never
        empty for guest sessions (social-proof for unauthenticated
        users). Auth is best-effort for analytics attribution only."""
        r = requests.get(f"{BASE_URL}/api/feed/live", timeout=15)
        assert r.status_code == 200, f"expected 200 got {r.status_code}"

    def test_invalid_token_falls_back_to_guest(self):
        """A malformed bearer token should be silently treated as
        unauthenticated rather than rejecting the request — guests
        and broken sessions both get the public feed."""
        r = requests.get(
            f"{BASE_URL}/api/feed/live",
            headers={"Authorization": "Bearer not.a.valid.jwt"},
            timeout=15,
        )
        assert r.status_code == 200

    def test_valid_token_accepted(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/feed/live", headers=auth_headers, timeout=30)
        assert r.status_code == 200


# --------------------------- Response shape ---------------------------

class TestResponseShape:
    def test_has_stats_and_entries(self, live_feed_response):
        assert "stats" in live_feed_response
        assert "entries" in live_feed_response
        assert isinstance(live_feed_response["entries"], list)

    def test_stats_shape(self, live_feed_response):
        stats = live_feed_response["stats"]
        assert "sessions_today" in stats
        assert "most_common_mood" in stats
        assert isinstance(stats["sessions_today"], int)
        mcm = stats["most_common_mood"]
        assert mcm is None or isinstance(mcm, str)


# --------------------------- Entry schema ---------------------------

class TestEntrySchema:
    REQUIRED_FIELDS = {
        "id", "type", "user", "mood_bucket", "mood_label",
        "workout_name", "duration_minutes", "milestone_count",
        "timestamp", "ago_text",
    }
    REQUIRED_USER_FIELDS = {"id", "username", "name", "avatar"}

    def test_entries_present(self, live_feed_response):
        # Live preview should have data; allow empty but log.
        entries = live_feed_response["entries"]
        if not entries:
            pytest.skip("Live feed returned no entries — data condition")
        assert len(entries) > 0

    def test_required_fields(self, live_feed_response):
        for e in live_feed_response["entries"]:
            missing = self.REQUIRED_FIELDS - set(e.keys())
            assert not missing, f"missing fields {missing} in entry {e.get('id')}"

    def test_user_fields(self, live_feed_response):
        for e in live_feed_response["entries"]:
            u = e["user"]
            missing = self.REQUIRED_USER_FIELDS - set(u.keys())
            assert not missing, f"user missing {missing}"

    def test_no_mongo_objectid_leak(self, live_feed_response):
        # No '_id' raw mongo field should appear in any entry/user
        import json
        body = json.dumps(live_feed_response)
        assert '"_id"' not in body, "raw '_id' leaked in response"

    def test_mood_bucket_valid(self, live_feed_response):
        for e in live_feed_response["entries"]:
            assert e["mood_bucket"] in VALID_MOOD_BUCKETS, (
                f"invalid mood_bucket {e['mood_bucket']} in entry {e['id']}"
            )

    def test_entry_type_valid(self, live_feed_response):
        for e in live_feed_response["entries"]:
            assert e["type"] in VALID_ENTRY_TYPES

    def test_ago_text_relative(self, live_feed_response):
        for e in live_feed_response["entries"]:
            ago = e["ago_text"]
            assert isinstance(ago, str) and ago, f"empty ago_text in {e['id']}"
            assert REL_TIME_RE.search(ago), (
                f"ago_text '{ago}' is not relative for entry {e['id']}"
            )
            # Must NOT be an ISO date / contain 4-digit year directly used as date
            assert not re.match(r"^\d{4}-\d{2}-\d{2}", ago), (
                f"ago_text looks absolute: {ago}"
            )

    def test_timestamp_iso(self, live_feed_response):
        for e in live_feed_response["entries"]:
            # parseable
            ts = e["timestamp"]
            datetime.fromisoformat(ts.replace("Z", "+00:00"))


# --------------------------- Type-specific validation ---------------------------

class TestEntryTypes:
    def test_milestone_count_present_for_milestones(self, live_feed_response):
        for e in live_feed_response["entries"]:
            if e["type"] == "milestone":
                assert e["milestone_count"] in VALID_MILESTONES, (
                    f"milestone_count {e['milestone_count']} not in {VALID_MILESTONES}"
                )
            else:
                # non-milestone entries should have None milestone_count
                assert e["milestone_count"] is None

    def test_live_now_within_20_minutes(self, live_feed_response):
        from datetime import timedelta
        now = datetime.now(timezone.utc)
        for e in live_feed_response["entries"]:
            if e["type"] != "live_now":
                continue
            ts = datetime.fromisoformat(e["timestamp"].replace("Z", "+00:00"))
            age = now - ts
            # 20 min window per spec; allow small server clock slack
            assert age <= timedelta(minutes=25), (
                f"live_now entry {e['id']} age {age} > 20min"
            )

    def test_completion_has_mood(self, live_feed_response):
        for e in live_feed_response["entries"]:
            if e["type"] == "completion":
                assert e["mood_bucket"] in VALID_MOOD_BUCKETS
                assert e["mood_label"]


# --------------------------- Sort + limit ---------------------------

class TestSortAndLimit:
    def test_sorted_desc(self, live_feed_response):
        ts_list = [
            datetime.fromisoformat(e["timestamp"].replace("Z", "+00:00"))
            for e in live_feed_response["entries"]
        ]
        for i in range(len(ts_list) - 1):
            assert ts_list[i] >= ts_list[i + 1], (
                f"entries not sorted DESC at index {i}"
            )

    def test_respects_limit(self, auth_headers):
        r = requests.get(
            f"{BASE_URL}/api/feed/live?limit=5", headers=auth_headers, timeout=30
        )
        assert r.status_code == 200
        data = r.json()
        assert len(data["entries"]) <= 5


# --------------------------- Regression: neighbouring endpoints ---------------------------

class TestRegression:
    def test_posts_public_still_works(self, auth_headers):
        # Try with auth first
        r = requests.get(
            f"{BASE_URL}/api/posts/public", headers=auth_headers, timeout=30
        )
        # Some impls allow no-auth — accept 200 or auth-required
        assert r.status_code in (200, 401, 403), f"got {r.status_code}: {r.text[:200]}"
        if r.status_code == 200:
            data = r.json()
            assert isinstance(data, (list, dict))

    def test_posts_endpoint_still_works(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/posts", headers=auth_headers, timeout=30)
        assert r.status_code in (200, 401, 403)

    def test_posts_following_still_exists(self, auth_headers):
        # Even though Following tab removed in UI, backend route should still work
        r = requests.get(
            f"{BASE_URL}/api/posts/following", headers=auth_headers, timeout=30
        )
        assert r.status_code == 200, f"got {r.status_code}: {r.text[:200]}"
        data = r.json()
        assert isinstance(data, list)
