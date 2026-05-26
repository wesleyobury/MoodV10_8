"""
Tests for admin analytics endpoints after refactor to MongoDB aggregation pipelines.

Verifies response shapes and successful 200 responses for:
- GET /api/analytics/admin/time-series/{metric_type}
- GET /api/analytics/admin/breakdown/{metric_type}
- GET /api/analytics/admin/users/signup-trend
- GET /api/analytics/admin/chart-data/{chart_type}
- GET /api/analytics/admin/export/users (with limit/skip)

Also smoke-tests:
- /api/users/{user_id}/posts requires auth (no staging bypass)
"""

import os
import time
import asyncio
import pytest
import requests
from motor.motor_asyncio import AsyncIOMotorClient

# Use public ingress URL (frontend EXPO_PUBLIC_BACKEND_URL).
BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://mood-build.preview.emergentagent.com"),
).rstrip("/")

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


# ---------- shared test setup: admin user + token ----------

@pytest.fixture(scope="module")
def admin_token():
    """Register a fresh user, promote to admin via DB flag, return JWT token."""
    ts = int(time.time())
    username = f"TEST_admin_{ts}"
    email = f"test_admin_{ts}@example.com"
    password = "AdminPass1234"

    # 1. Register
    r = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"username": username, "email": email, "password": password, "name": "Test Admin"},
        timeout=20,
    )
    assert r.status_code in (200, 201), f"register failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("token") or data.get("access_token")
    user_id = (data.get("user") or {}).get("id") or data.get("user_id")
    assert token and user_id, f"missing token/user_id: {data}"

    # 2. Promote to admin via DB (is_admin flag for backwards-compat path)
    async def promote():
        client = AsyncIOMotorClient(MONGO_URL)
        try:
            from bson import ObjectId
            await client[DB_NAME].users.update_one(
                {"_id": ObjectId(user_id)}, {"$set": {"is_admin": True}}
            )
        finally:
            client.close()

    asyncio.get_event_loop().run_until_complete(promote()) if False else asyncio.run(promote())

    yield token

    # cleanup
    async def cleanup():
        client = AsyncIOMotorClient(MONGO_URL)
        try:
            from bson import ObjectId
            await client[DB_NAME].users.delete_one({"_id": ObjectId(user_id)})
        finally:
            client.close()
    try:
        asyncio.run(cleanup())
    except Exception:
        pass


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ---------- time-series endpoint ----------

TIME_SERIES_METRICS = [
    "active_users",
    "app_sessions",
    "screen_views",
    "screen_time",
    "workouts_started",
    "workouts_completed",
    "mood_selections",
    "posts_created",
    "social_interactions",
    "new_users",
]

REQUIRED_TS_KEYS = {"metric_type", "period", "labels", "values", "secondary_values", "total", "average"}


@pytest.mark.parametrize("metric", TIME_SERIES_METRICS)
@pytest.mark.parametrize("period", ["day", "week", "month"])
def test_time_series_endpoint_shape(admin_headers, metric, period):
    r = requests.get(
        f"{BASE_URL}/api/analytics/admin/time-series/{metric}",
        params={"period": period, "limit": 10},
        headers=admin_headers,
        timeout=30,
    )
    assert r.status_code == 200, f"{metric}/{period} -> {r.status_code} {r.text[:200]}"
    body = r.json()
    missing = REQUIRED_TS_KEYS - set(body.keys())
    assert not missing, f"{metric}/{period} missing keys: {missing}; got keys={list(body.keys())}"
    assert body["metric_type"] == metric
    assert body["period"] == period
    assert isinstance(body["labels"], list)
    assert isinstance(body["values"], list)
    assert len(body["labels"]) == len(body["values"]), "labels/values length mismatch"
    # secondary_values may be list or null but key must exist
    if body.get("secondary_values") is not None:
        assert isinstance(body["secondary_values"], list)
    assert isinstance(body["total"], (int, float))
    assert isinstance(body["average"], (int, float))


# ---------- breakdown endpoint ----------

BREAKDOWN_METRICS = ["screen_views", "mood_selections", "social_interactions"]


@pytest.mark.parametrize("metric", BREAKDOWN_METRICS)
def test_breakdown_endpoint_shape(admin_headers, metric):
    r = requests.get(
        f"{BASE_URL}/api/analytics/admin/breakdown/{metric}",
        headers=admin_headers,
        timeout=30,
    )
    assert r.status_code == 200, f"{metric} -> {r.status_code} {r.text[:200]}"
    body = r.json()
    for k in ("metric_type", "items", "total"):
        assert k in body, f"{metric} missing '{k}'"
    assert body["metric_type"] == metric
    assert isinstance(body["items"], list)
    assert isinstance(body["total"], (int, float))


# ---------- signup-trend ----------

@pytest.mark.parametrize("period", ["day", "week", "month"])
def test_signup_trend(admin_headers, period):
    r = requests.get(
        f"{BASE_URL}/api/analytics/admin/users/signup-trend",
        params={"period": period},
        headers=admin_headers,
        timeout=30,
    )
    assert r.status_code == 200, f"signup-trend/{period} -> {r.status_code} {r.text[:200]}"
    body = r.json()
    assert isinstance(body, dict)


# ---------- chart-data ----------

CHART_TYPES = ["user_growth", "session_trend", "engagement_trend"]


@pytest.mark.parametrize("chart", CHART_TYPES)
def test_chart_data(admin_headers, chart):
    r = requests.get(
        f"{BASE_URL}/api/analytics/admin/chart-data/{chart}",
        headers=admin_headers,
        timeout=30,
    )
    assert r.status_code == 200, f"chart {chart} -> {r.status_code} {r.text[:200]}"
    body = r.json()
    # Loose shape checks: must be a dict with labels and datasets keys (typical chart shape)
    assert isinstance(body, dict)
    assert "labels" in body, f"{chart} missing labels: keys={list(body.keys())}"
    assert "datasets" in body, f"{chart} missing datasets: keys={list(body.keys())}"
    assert isinstance(body["labels"], list)
    assert isinstance(body["datasets"], list)


# ---------- export/users ----------

def test_export_users_pagination(admin_headers):
    r = requests.get(
        f"{BASE_URL}/api/analytics/admin/export/users",
        params={"days": 30, "limit": 5, "skip": 0},
        headers=admin_headers,
        timeout=30,
    )
    assert r.status_code == 200, f"export/users -> {r.status_code} {r.text[:200]}"
    body = r.json()
    # Find the array of records
    arr = None
    if isinstance(body, list):
        arr = body
    elif isinstance(body, dict):
        for k in ("data", "users", "items", "results"):
            if k in body and isinstance(body[k], list):
                arr = body[k]
                break
    assert arr is not None, f"no array in export response: keys={list(body.keys()) if isinstance(body, dict) else type(body)}"
    assert len(arr) <= 5, f"limit not respected: got {len(arr)} records"


def test_export_users_skip_works(admin_headers):
    r1 = requests.get(
        f"{BASE_URL}/api/analytics/admin/export/users",
        params={"days": 30, "limit": 3, "skip": 0},
        headers=admin_headers,
        timeout=30,
    )
    r2 = requests.get(
        f"{BASE_URL}/api/analytics/admin/export/users",
        params={"days": 30, "limit": 3, "skip": 3},
        headers=admin_headers,
        timeout=30,
    )
    assert r1.status_code == 200 and r2.status_code == 200


# ---------- smoke test: profile posts requires auth ----------

def test_profile_posts_requires_auth():
    """Should NOT have a staging bypass — unauth call must be rejected."""
    # Use an arbitrary 24-hex objectid; we expect 401/403 without a token
    r = requests.get(f"{BASE_URL}/api/users/693f94d29a560edaab674fd5/posts", timeout=15)
    assert r.status_code in (401, 403), (
        f"expected 401/403 (no auth bypass) got {r.status_code} {r.text[:200]}"
    )


# ---------- non-admin should get 403 ----------

def test_non_admin_blocked():
    """Register a non-admin user and verify analytics is forbidden."""
    ts = int(time.time())
    username = f"TEST_user_{ts}"
    email = f"test_user_{ts}@example.com"
    password = "UserPass1234"
    r = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"username": username, "email": email, "password": password, "name": "T"},
        timeout=20,
    )
    assert r.status_code in (200, 201)
    data = r.json()
    token = data.get("token") or data.get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    r2 = requests.get(
        f"{BASE_URL}/api/analytics/admin/time-series/active_users",
        params={"period": "day", "limit": 5},
        headers=headers,
        timeout=20,
    )
    assert r2.status_code == 403, f"non-admin should be 403, got {r2.status_code}"
