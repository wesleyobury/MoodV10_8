"""
MOOD V2 — Phase 1 backend smoke test (standalone, run directly).

Exercises the entitlement system, free-workout cap, comp accounts, and the
forced-update config endpoints. Mints JWTs directly (via JWT_SECRET) so we can
hit admin-only endpoints without needing the admin password.

Run:  cd /app/backend && python tests/test_v2_phase1.py
"""
import os
import sys
import json
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone

from dotenv import load_dotenv
load_dotenv()

import jwt as _jwt
from pymongo import MongoClient
from bson import ObjectId

BASE = "http://localhost:8001/api"
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"

mc = MongoClient(os.environ["MONGO_URL"])
db = mc[os.environ.get("DB_NAME", "mood_app")]

PASS, FAIL = [], []


def ok(name, cond, extra=""):
    (PASS if cond else FAIL).append(name)
    print(f"  {'✅' if cond else '❌'} {name}" + (f" — {extra}" if extra else ""))


def token_for(user_id: str) -> str:
    return _jwt.encode(
        {"user_id": str(user_id), "exp": time.time() + 3600},
        JWT_SECRET, algorithm=JWT_ALG,
    )


def call(method, path, token=None, body=None):
    url = BASE + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
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
    except Exception as e:
        return 0, {"error": str(e)}


def main():
    # --- find an admin user (allowlist = officialmoodapp); create a
    #     throwaway one for the test if it doesn't exist in this DB --------
    admin = db.users.find_one({"username": "officialmoodapp"})
    created_admin = False
    if not admin:
        ares = db.users.insert_one({
            "username": "officialmoodapp",
            "email": "officialmoodapp@example.com",
            "name": "MOOD Admin (test)",
            "created_at": datetime.now(timezone.utc),
            "subscription": {"status": "none"},
        })
        admin = db.users.find_one({"_id": ares.inserted_id})
        created_admin = True
        print("(created temporary officialmoodapp admin for test)")
    admin_token = token_for(admin["_id"])
    admin_id_to_cleanup = admin["_id"] if created_admin else None

    # Create a fresh throwaway user with no subscription.
    email = f"v2phase1_{int(time.time()*1000)}@example.com"
    res = db.users.insert_one({
        "username": email.split("@")[0],
        "email": email,
        "name": "V2 Phase1",
        "created_at": datetime.now(timezone.utc),
        "subscription": {"status": "none"},
        "workouts_count": 0,
    })
    uid = res.inserted_id
    utoken = token_for(uid)
    print(f"\nTest user: {email} ({uid})")

    try:
        # 1) Public config (no auth)
        s, b = call("GET", "/config")
        ok("GET /api/config returns 200 (no auth)", s == 200, str(s))
        ok("config has update_check_enabled key", "update_check_enabled" in b)

        # 2) Entitlement — fresh non-sub user has no access, 1 free remaining
        s, b = call("GET", "/me/entitlement", utoken)
        ok("GET /api/me/entitlement 200", s == 200, str(s))
        ok("fresh user has_full_access == false", b.get("has_full_access") is False, json.dumps(b))
        ok("fresh user free_workouts_remaining == 1", b.get("free_workouts_remaining") == 1, str(b.get("free_workouts_remaining")))
        ok("reason == none", b.get("reason") == "none", b.get("reason"))

        # 3) Workout start gate — first start allowed
        s, b = call("POST", "/workouts/start", utoken)
        ok("first /workouts/start allowed (200)", s == 200, str(s))

        # 4) Simulate workout completion → consumes free allowance
        db.users.update_one({"_id": uid}, {"$inc": {"free_workouts_used": 1}})
        s, b = call("GET", "/me/entitlement", utoken)
        ok("after 1 completion free_remaining == 0", b.get("free_workouts_remaining") == 0, str(b.get("free_workouts_remaining")))
        s, b = call("POST", "/workouts/start", utoken)
        ok("second /workouts/start blocked (402)", s == 402, str(s))
        ok("402 carries payment_required trigger",
           isinstance(b.get("detail"), dict) and b["detail"].get("error") == "payment_required",
           json.dumps(b))

        # 5) Comp grant (admin) by email → user gains full access
        s, b = call("POST", f"/admin/users/{email}/comp", admin_token)
        ok("admin grant_comp by email 200/ok", s == 200 and b.get("ok") is True, json.dumps(b))
        s, b = call("GET", "/me/entitlement", utoken)
        ok("comp user has_full_access == true", b.get("has_full_access") is True, json.dumps(b))
        ok("comp user reason == comp", b.get("reason") == "comp", b.get("reason"))
        # comp user can start workout again despite used free allowance
        s, b = call("POST", "/workouts/start", utoken)
        ok("comp user /workouts/start allowed (200)", s == 200, str(s))

        # 6) Comp list includes the user
        s, b = call("GET", "/admin/comp-users", admin_token)
        emails = [u.get("email") for u in b.get("users", [])]
        ok("comp-users list includes user", email in emails, str(len(emails)))

        # 7) Revoke → access removed
        s, b = call("DELETE", f"/admin/users/{email}/comp", admin_token)
        ok("admin revoke_comp 200/ok", s == 200 and b.get("ok") is True, json.dumps(b))
        s, b = call("GET", "/me/entitlement", utoken)
        ok("after revoke has_full_access == false", b.get("has_full_access") is False, json.dumps(b))

        # 8) Admin requires auth — no token → 403/401
        s, b = call("POST", f"/admin/users/{email}/comp")
        ok("grant_comp without auth rejected", s in (401, 403), str(s))

        # 9) App config update (admin) round-trips, then reset
        s, b = call("PUT", "/admin/config", admin_token, {
            "min_supported_build_ios": 999, "update_check_enabled": True,
            "force_update_message": "Phase1 test",
        })
        ok("admin PUT /admin/config 200/ok", s == 200 and b.get("ok") is True, json.dumps(b))
        s, b = call("GET", "/config")
        ok("config reflects min build 999", b.get("min_supported_build_ios") == 999, str(b.get("min_supported_build_ios")))
        ok("config update_check_enabled true", b.get("update_check_enabled") is True)
        # reset to safe defaults
        call("PUT", "/admin/config", admin_token, {
            "min_supported_build_ios": 0, "min_supported_build_android": 0,
            "latest_build_ios": 0, "latest_build_android": 0,
            "update_check_enabled": False, "force_update_message": "",
        })
        s, b = call("GET", "/config")
        ok("config reset (checks disabled)", b.get("update_check_enabled") is False)

    finally:
        # cleanup throwaway user (+ temp admin if we created one)
        db.users.delete_one({"_id": uid})
        if admin_id_to_cleanup is not None:
            db.users.delete_one({"_id": admin_id_to_cleanup})

    print(f"\n==== {len(PASS)} passed, {len(FAIL)} failed ====")
    if FAIL:
        print("FAILED:", FAIL)
        sys.exit(1)


if __name__ == "__main__":
    main()
