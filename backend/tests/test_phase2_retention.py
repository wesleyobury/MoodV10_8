"""
MOOD V2 — Phase 2 retention engine end-to-end test.

Exercises the server-side streak + comeback logic through the real
/api/analytics/track endpoint by pre-seeding rt_* state on the user doc to
simulate prior days (since we can't time-travel UTC days in a live test).

Run:  cd /app/backend && python tests/test_phase2_retention.py
"""
import os
import sys
import json
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone, timedelta

from dotenv import load_dotenv
load_dotenv()

from pymongo import MongoClient
from bson import ObjectId

BASE = "http://localhost:8001/api"
mc = MongoClient(os.environ["MONGO_URL"])
db = mc[os.environ.get("DB_NAME", "mood_app")]
PASS, FAIL = [], []


def ok(name, cond, extra=""):
    (PASS if cond else FAIL).append(name)
    print(f"  {'✅' if cond else '❌'} {name}" + (f" — {extra}" if extra else ""))


def call(method, path, token=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + path, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or "{}")
        except Exception:
            return e.code, {}


def register():
    sid = int(time.time() * 1000)
    u = f"p2rt_{sid}"
    s, b = call("POST", "/auth/register", body={
        "username": u, "email": f"{u}@example.com",
        "password": "TestPass1234567$", "name": "P2 RT", "terms_accepted": True,
    })
    assert s == 200, f"register failed {s} {b}"
    return b["token"], b["user_id"]


def day(offset=0):
    return (datetime.now(timezone.utc) + timedelta(days=offset)).strftime("%Y-%m-%d")


def latest(user_id, event_type):
    return db.user_events.find_one(
        {"user_id": user_id, "event_type": event_type}, sort=[("timestamp", -1)]
    )


def fire_completion(token):
    return call("POST", "/analytics/track", token,
                {"event_type": "workout_completed", "metadata": {"smoke": True}})


def main():
    created = []
    try:
        # ── 1. streak_extended on consecutive day ──
        token, uid = register()
        created.append(uid)
        # Seed: last workout yesterday, current=2
        db.users.update_one({"_id": ObjectId(uid)}, {"$set": {
            "rt_streak_current": 2, "rt_streak_longest": 2,
            "rt_streak_last_day": day(-1), "rt_last_active_day": day(-1),
        }})
        s, _ = fire_completion(token)
        ok("track 200", s == 200)
        time.sleep(0.4)
        ext = latest(uid, "streak_extended")
        ok("streak_extended fired", ext is not None)
        ok("new_streak == 3", (ext or {}).get("metadata", {}).get("new_streak") == 3, str(ext and ext.get("metadata")))
        ok("streak_extended category=retention", (ext or {}).get("event_category") == "retention")
        ms = latest(uid, "streak_milestone_reached")
        ok("milestone(3) fired", ms is not None and ms.get("metadata", {}).get("milestone") == 3)
        u = db.users.find_one({"_id": ObjectId(uid)})
        ok("rt_streak_current persisted = 3", u.get("rt_streak_current") == 3, str(u.get("rt_streak_current")))

        # ── 2. idempotent within same day (no double count) ──
        s, _ = fire_completion(token)
        time.sleep(0.3)
        cnt = db.user_events.count_documents({"user_id": uid, "event_type": "streak_extended"})
        ok("same-day completion does not re-fire streak_extended", cnt == 1, f"count={cnt}")

        # ── 3. streak_broken after a gap ──
        token2, uid2 = register()
        created.append(uid2)
        db.users.update_one({"_id": ObjectId(uid2)}, {"$set": {
            "rt_streak_current": 5, "rt_streak_longest": 5,
            "rt_streak_last_day": day(-4), "rt_last_active_day": day(-4),
        }})
        fire_completion(token2)
        time.sleep(0.4)
        brk = latest(uid2, "streak_broken")
        ok("streak_broken fired after gap", brk is not None)
        ok("previous_streak == 5", (brk or {}).get("metadata", {}).get("previous_streak") == 5)
        ext2 = latest(uid2, "streak_extended")
        ok("new streak resets to 1", (ext2 or {}).get("metadata", {}).get("new_streak") == 1)

        # ── 4. comeback_after_lapse on session start ──
        token3, uid3 = register()
        created.append(uid3)
        db.users.update_one({"_id": ObjectId(uid3)}, {"$set": {
            "rt_streak_current": 3, "rt_streak_longest": 3,
            "rt_streak_last_day": day(-10), "rt_last_active_day": day(-10),
        }})
        call("POST", "/analytics/track", token3,
             {"event_type": "app_session_start", "metadata": {}})
        time.sleep(0.4)
        cb = latest(uid3, "comeback_after_lapse")
        ok("comeback_after_lapse fired", cb is not None)
        ok("days_inactive == 10", (cb or {}).get("metadata", {}).get("days_inactive") == 10, str(cb and cb.get("metadata")))
        ok("comeback category=retention", (cb or {}).get("event_category") == "retention")
        lapse_brk = latest(uid3, "streak_broken")
        ok("lapse breaks streak", lapse_brk is not None and lapse_brk.get("metadata", {}).get("source") == "lapse")

        # ── 5. recent session (no lapse) does NOT fire comeback ──
        token4, uid4 = register()
        created.append(uid4)
        db.users.update_one({"_id": ObjectId(uid4)}, {"$set": {"rt_last_active_day": day(-2)}})
        call("POST", "/analytics/track", token4,
             {"event_type": "app_session_start", "metadata": {}})
        time.sleep(0.3)
        ok("no comeback for 2-day gap", latest(uid4, "comeback_after_lapse") is None)

        # ── 6. catalog categorization spot-checks ──
        token5, uid5 = register()
        created.append(uid5)
        for et, cat in [("paywall_cta_tapped", "monetization"),
                        ("founding_banner_shown", "monetization"),
                        ("tip_shown", "onboarding"),
                        ("onboarding_completed", "onboarding"),
                        ("notification_opened", "notification"),
                        ("share_completed", "sharing"),
                        ("mood_intro_viewed", "workout")]:
            call("POST", "/analytics/track", token5, {"event_type": et, "metadata": {}})
        time.sleep(0.4)
        for et, cat in [("paywall_cta_tapped", "monetization"),
                        ("founding_banner_shown", "monetization"),
                        ("tip_shown", "onboarding"),
                        ("onboarding_completed", "onboarding"),
                        ("notification_opened", "notification"),
                        ("share_completed", "sharing"),
                        ("mood_intro_viewed", "workout")]:
            d = latest(uid5, et)
            ok(f"{et} -> {cat}", d is not None and d.get("event_category") == cat,
               str(d and d.get("event_category")))

    finally:
        for uid in created:
            db.users.delete_one({"_id": ObjectId(uid)})
            db.user_events.delete_many({"user_id": uid})

    print(f"\n==== {len(PASS)} passed, {len(FAIL)} failed ====")
    if FAIL:
        print("FAILED:", FAIL)
        sys.exit(1)


if __name__ == "__main__":
    main()
