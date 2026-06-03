"""
MOOD V2 — Phase 2 backend smoke test (founding member system).

Run:  cd /app/backend && python tests/test_v2_phase2.py
Mints JWTs directly. Sets app_config.v2_launch_date for the duration of the
test and removes it afterward so the global founding window is not left open.
"""
import os
import sys
import json
import time
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
load_dotenv()

import jwt as _jwt
from pymongo import MongoClient
from bson import ObjectId

BASE = "http://localhost:8001/api"
JWT_SECRET = os.environ["JWT_SECRET"]
mc = MongoClient(os.environ["MONGO_URL"])
db = mc[os.environ.get("DB_NAME", "mood_app")]
PASS, FAIL = [], []


def ok(name, cond, extra=""):
    (PASS if cond else FAIL).append(name)
    print(f"  {'✅' if cond else '❌'} {name}" + (f" — {extra}" if extra else ""))


def token_for(uid):
    return _jwt.encode({"user_id": str(uid), "exp": time.time() + 3600}, JWT_SECRET, algorithm="HS256")


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


def mk_user(founding, expires=None, claimed=False):
    now = datetime.now(timezone.utc)
    doc = {
        "username": f"v2p2_{int(time.time()*1000)}_{founding}",
        "email": f"v2p2_{int(time.time()*1000000)}@example.com",
        "created_at": now,
        "subscription": {"status": "none"},
        "founding_member": founding,
        "founding_pricing_claimed": claimed,
    }
    if expires:
        doc["founding_window_expires_at"] = expires
    return db.users.insert_one(doc).inserted_id


def main():
    prev_launch = (db.app_config.find_one({"_id": "app_config"}) or {}).get("v2_launch_date")
    launch = datetime.now(timezone.utc)
    window_expires = launch + timedelta(days=14)
    # Open the global founding window for the test.
    db.app_config.update_one({"_id": "app_config"}, {"$set": {"v2_launch_date": launch}}, upsert=True)

    founder = mk_user(True, window_expires)
    nonfounder = mk_user(False)
    claimed_founder = mk_user(True, window_expires, claimed=True)
    created = [founder, nonfounder, claimed_founder]

    try:
        ft, nt, ct = token_for(founder), token_for(nonfounder), token_for(claimed_founder)

        # Eligible founder
        s, b = call("GET", "/me/entitlement", ft)
        ok("founder entitlement 200", s == 200, str(s))
        ok("founder is_founding_member true", b.get("is_founding_member") is True)
        ok("founder window_active true", b.get("founding_window_active") is True, json.dumps(b))
        ok("founder NO free access (V2 semantic)", b.get("has_full_access") is False, b.get("reason"))
        ok("founder window_expires present", bool(b.get("founding_window_expires_at")))

        # Claim → returns founding SKU
        s, b = call("POST", "/me/claim-founding", ft)
        ok("claim-founding 200", s == 200, str(s))
        ok("claim returns founding SKU", b.get("sku_id") == "com.mood.subscription.founding_annual", json.dumps(b))

        # Simulate StoreKit purchase validate of the founding SKU
        s, b = call("POST", "/subscription/validate", ft, {
            "signed_payload": "test", "product_id": "com.mood.subscription.founding_annual",
            "transaction_id": "t1", "expiration_date": (launch + timedelta(days=365)).isoformat(),
        })
        ok("founding purchase validate 200", s == 200, json.dumps(b))
        ok("plan == founding_annual", b.get("plan") == "founding_annual", b.get("plan"))

        # After purchase: full access + claimed
        s, b = call("GET", "/me/entitlement", ft)
        ok("post-purchase has_full_access true", b.get("has_full_access") is True, json.dumps(b))
        ok("post-purchase pricing_claimed true", b.get("founding_pricing_claimed") is True)
        ok("post-purchase window_active false", b.get("founding_window_active") is False)

        # Claim again → 403
        s, b = call("POST", "/me/claim-founding", ft)
        ok("re-claim returns 403", s == 403, str(s))

        # Non-founder claim → 403
        s, b = call("POST", "/me/claim-founding", nt)
        ok("non-founder claim 403", s == 403, str(s))
        s, b = call("GET", "/me/entitlement", nt)
        ok("non-founder is_founding_member false", b.get("is_founding_member") is False)

        # Already-claimed founder claim → 403
        s, b = call("POST", "/me/claim-founding", ct)
        ok("claimed founder claim 403", s == 403, str(s))

        # Window closed → claim 403
        db.app_config.update_one({"_id": "app_config"},
                                 {"$set": {"v2_launch_date": launch - timedelta(days=20)}})
        fresh = mk_user(True, launch - timedelta(days=6))
        created.append(fresh)
        s, b = call("POST", "/me/claim-founding", token_for(fresh))
        ok("closed-window claim 403", s == 403, str(s))
        s, b = call("GET", "/me/entitlement", token_for(fresh))
        ok("closed-window window_active false", b.get("founding_window_active") is False)

    finally:
        for uid in created:
            db.users.delete_one({"_id": uid})
        # Restore previous v2_launch_date (or remove if it wasn't set).
        if prev_launch is not None:
            db.app_config.update_one({"_id": "app_config"}, {"$set": {"v2_launch_date": prev_launch}})
        else:
            db.app_config.update_one({"_id": "app_config"}, {"$unset": {"v2_launch_date": ""}})

    print(f"\n==== {len(PASS)} passed, {len(FAIL)} failed ====")
    if FAIL:
        print("FAILED:", FAIL)
        sys.exit(1)


if __name__ == "__main__":
    main()
