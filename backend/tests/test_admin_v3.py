"""admin_v3 against a hand-counted seeded dataset (in-memory Mongo). Every expected number below is counted by hand
from the seed, so these tests double as the dashboard's verification pass."""
import os
import sys
from datetime import datetime, timedelta, timezone

import pytest
from bson import ObjectId

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
mongomock_motor = pytest.importorskip("mongomock_motor")
from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import admin_v3  # noqa: E402

NOW = datetime.now(timezone.utc).replace(tzinfo=None)  # stored like Mongo stores it: naive UTC
D = lambda days, minutes=0: NOW - timedelta(days=days) + timedelta(minutes=minutes)  # noqa: E731
A, B, C, I = (ObjectId() for _ in range(4))
W2 = "start_workout_after_free_session"


def ev(uid, t, ts, **md):
    return {"user_id": str(uid), "event_type": t, "timestamp": ts, "metadata": md}


def wk(wid, uid, created, direction, minutes, states=(), status="generated", swap=0, done_at=None):
    return {"_id": wid, "user_id": str(uid), "created_at": created, "status": status, "completed_at": done_at,
            "duration_actual": 52 if status == "completed" else None,
            "envelope": {"workout": {"direction": direction, "archetype": {"id": "x", "name": "X"}, "states": list(states),
                                     "duration": {"requested_minutes": minutes, "estimated_minutes": minutes - 5},
                                     "target": {"mode": "moods_pick", "label": "MOOD's Pick"}, "selection_source": "moods_pick",
                                     "swap_count": swap,
                                     "blocks": [{"items": [{"exercise": {"id": "ex_squat", "name": "Back Squat"}}]}]}}}


async def seed(db):
    await db.users.insert_many([
        {"_id": A, "username": "anna", "created_at": D(5), "training_profile": {"completed_at": D(5), "goal": "build_muscle", "experience": "intermediate"},
         "milestones": {"v3_onboarded_at": D(5), "first_workout_generated_at": D(5), "first_workout_started_at": D(4),
                        "first_workout_completed_at": D(4), "second_workout_attempted_at": D(2), "first_paywall_at": D(2),
                        "trial_started_at": D(2)}},
        {"_id": B, "username": "ben", "created_at": D(3), "training_profile": {"completed_at": D(3), "goal": "lose_fat"},
         "milestones": {"v3_onboarded_at": D(3), "first_workout_generated_at": D(3), "first_workout_started_at": D(3)}},
        {"_id": C, "username": "carl_v2", "created_at": D(200), "workouts_count": 40},
        {"_id": I, "username": "tester", "created_at": D(2), "is_internal": True, "training_profile": {"completed_at": D(2)},
         "milestones": {"first_workout_completed_at": D(1)}},
    ])
    await db.user_events.insert_many([
        ev(A, "onboarding_step_viewed", D(5), question="intro", app_line="v3"),
        ev(A, "onboarding_step_viewed", D(5, 1), question="first_name", app_line="v3"),
        ev(A, "onboarding_step_viewed", D(5, 2), question="goal", app_line="v3", funnel_version="v3"),
        ev(A, "reveal_screen_viewed", D(5, 3), app_line="v3"),
        ev(A, "onboarding_completed", D(5, 4), app_line="v3"),
        ev(A, "v3_home_viewed", D(5, 5), app_line="v3"),
        ev(A, "workout_started", D(4), source="v3", app_line="v3"),
        ev(A, "workout_completed", D(4, 50), source="v3", v3_workout_id="A1"),
        ev(A, "workout_start_gate", D(4), allowed=True, attempt="first", workout_id="A1", has_full_access=False, source="v3"),
        ev(A, "workout_start_gate", D(2), allowed=False, attempt="second_plus", workout_id="A2", has_full_access=False, source="v3"),
        ev(A, "paywall_viewed", D(2, 1), trigger_source=W2, app_line="v3"),
        ev(A, "plan_selected", D(2, 2), plan="annual", app_line="v3"),
        ev(A, "purchase_completed", D(2, 3), is_trial=True, app_line="v3"),
        ev(A, "subscription_started", D(2, 3), plan_id="com.mood.subscription.annual", revenue_usd=79.0, source="apple"),
        ev(B, "onboarding_step_viewed", D(3), question="intro", app_line="v3"),
        ev(B, "onboarding_step_viewed", D(3, 1), question="goal", app_line="v3"),
        ev(B, "v3_home_viewed", D(3, 2), app_line="v3"),
        ev(B, "workout_started", D(3), source="v3", app_line="v3"),
        ev(B, "workout_start_gate", D(3), allowed=True, attempt="first", workout_id="B1", has_full_access=False, source="v3"),
        ev(B, "v3_swap_exercise_result", D(3), workout_id="B1", result="swapped", **{"from": "ex_squat"}),
        ev(B, "v3_workout_generated", D(3), status="ok", generation_ms=800),
        ev(B, "v3_workout_generated", D(3), status="conflict", conflict_code="sore_target", generation_ms=200),
        ev(C, "workout_started", D(1)),
        ev(C, "workout_completed", D(1, 40)),
        ev(C, "subscription_renewed", D(1), plan_id="com.mood.subscription.monthly", revenue_usd=9.99, source="apple"),
        ev(I, "workout_completed", D(1), source="v3"),
        ev(I, "workout_started", D(1), source="v3", app_line="v3"),
    ])
    await db.v3_workouts.insert_many([
        wk("A1", A, D(4, -10), "strength", 60, ["stressed"], "completed", swap=1, done_at=D(4, 50)),
        wk("A2", A, D(2, -5), "sweat", 30),
        wk("B1", B, D(3), "athletic", 60),
        wk("I1", I, D(1), "strength", 60, status="completed"),
    ])
    day = lambda n: (NOW - timedelta(days=n)).replace(hour=0, minute=0, second=0, microsecond=0)  # noqa: E731
    await db.daily_activity.insert_many(
        [{"user_id": str(A), "date": day(n)} for n in (5, 4, 2)] + [{"user_id": str(B), "date": day(3)}]
        + [{"user_id": str(C), "date": day(1)}] + [{"user_id": str(I), "date": day(1)}])


@pytest.fixture(scope="module")
def client():
    import asyncio
    db = mongomock_motor.AsyncMongoMockClient()["admin_v3_test"]
    asyncio.run(seed(db))
    app = FastAPI()
    app.include_router(admin_v3.build_admin_v3_router(db, lambda: "admin"), prefix="/api")
    with TestClient(app) as c:
        yield c


def cards(payload, key="cards"):
    return {c["key"]: c for c in payload[key]}


def test_pulse_blended_and_v3(client):
    p = client.get("/api/analytics/admin/v3/pulse").json()
    c = cards(p)
    assert c["signups"]["value"] == 2                  # A, B (C too old, I internal)
    assert c["workouts_completed"]["value"] == 2       # A (V3) + C (V2)
    assert c["workouts_started"]["value"] == 3         # A, B, C
    assert c["workouts_generated"]["value"] == 3       # A1, A2, B1 (I1 internal)
    assert c["trials"]["value"] == 1                   # A
    assert c["revenue"]["value"] == 9.99               # C renewal; A's trial start is $0
    assert c["active_users"]["value"] == 3             # A, B, C
    v = cards(client.get("/api/analytics/admin/v3/pulse?version=v3").json())
    assert v["workouts_completed"]["value"] == 1       # A only
    assert v["workouts_started"]["value"] == 2
    assert v["revenue"]["value"] == 0                  # C is not a V3 user
    assert v["active_users"]["value"] == 2
    inc = cards(client.get("/api/analytics/admin/v3/pulse?include_internal=true").json())
    assert inc["workouts_completed"]["value"] == 3 and inc["workouts_generated"]["value"] == 4


def test_activation_funnel(client):
    a = client.get("/api/analytics/admin/v3/activation").json()
    steps = [(s["key"], s["users"]) for s in a["funnel"]["steps"]]
    assert steps == [("signup", 2), ("onb:intro", 2), ("onb:first_name", 1), ("onb:goal", 2), ("profile", 2), ("reveal", 1),
                     ("onboarding_completed", 1), ("home", 2), ("first_generated", 2), ("first_started", 2), ("first_completed", 1)]
    assert [s["users"] for s in a["continuation"]["steps"]] == [1, 1, 1, 1, 1]
    r = cards(a, "rates")
    assert r["first_completion_rate"]["value"] == 50.0 and r["w2_attempt_rate"]["value"] == 100.0
    assert {row["segment"] for row in a["splits"]["goal"]} == {"build muscle", "lose fat"}


def test_workouts_quality(client):
    w = client.get("/api/analytics/admin/v3/workouts").json()
    k = cards(w, "key_cards")
    assert k["gen_to_start"]["value"] == 66.7          # A1, B1 of A1, A2, B1
    assert k["start_to_complete"]["value"] == 50.0     # A1 of A1, B1
    assert k["swap_rate"]["value"] == 33.3             # B1
    assert k["different_rate"]["value"] == 33.3        # A1 swap_count
    assert w["generation"]["by_status"] == {"ok": 1, "conflict": 1}
    assert w["top_swapped_out"][0] == {"id": "ex_squat", "name": "Back Squat", "count": 1}
    dirs = {r["segment"]: r["generated"] for r in w["breakdowns"]["direction"]}
    assert dirs == {"Strength": 1, "Sweat": 1, "Athletic": 1}


def test_revenue_w2_funnel(client):
    r = client.get("/api/analytics/admin/v3/revenue").json()
    assert [s["users"] for s in r["w2_funnel"]["steps"]] == [1, 1, 1, 1, 1, 0]
    assert cards(r, "headline")["revenue"]["value"] == 9.99


def test_retention_and_users(client):
    t = client.get("/api/analytics/admin/v3/retention").json()
    h = cards(t, "headline")
    assert h["w2_attempt"]["value"] == 100.0 and h["return_after_1"]["value"] == 100.0
    u = client.get("/api/analytics/admin/v3/users").json()
    st = {x["username"]: x["stage"] for x in u["users"]}
    assert st == {"anna": "Returned", "ben": "Onboarded", "carl_v2": "Onboarding"}
    d = client.get(f"/api/analytics/admin/v3/users/{A}").json()
    assert d["v3_summary"] == {"generated": 2, "started": 1, "completed": 1, "states_used": [{"state": "stressed", "count": 1}]}
