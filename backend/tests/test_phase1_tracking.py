"""Phase 1 tracking smoke test — run directly: python tests/test_phase1_tracking.py
Verifies: auth events (user_registered/login_success/login_failure), a
monetization client event lands with event_category, and the Apple webhook
GATE drops an unsigned payload (no analytics event)."""
import asyncio
import os
import sys
import time

import httpx
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()
BASE = "http://localhost:8001/api"


async def main() -> int:
    mongo = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = mongo[os.environ["DB_NAME"]]
    ok = True
    suffix = str(int(time.time()))
    username = f"p1trk_{suffix}"
    email = f"{username}@test.io"
    password = "TestPass123$"

    async with httpx.AsyncClient(timeout=30) as c:
        # 1) Register
        r = await c.post(f"{BASE}/auth/register", json={
            "username": username, "email": email, "password": password,
            "name": "P1 Track", "terms_accepted": True,
        })
        print("register:", r.status_code)
        if r.status_code != 200:
            print("  body:", r.text[:300]); return 1
        token = r.json()["token"]
        user_id = r.json()["user_id"]

        # 2) login failure (wrong pw) then success
        await c.post(f"{BASE}/auth/login", json={"username": username, "password": "WRONG"})
        await c.post(f"{BASE}/auth/login", json={"username": username, "password": password})

        # 3) monetization client event
        await c.post(f"{BASE}/analytics/track",
                     headers={"Authorization": f"Bearer {token}"},
                     json={"event_type": "paywall_viewed",
                           "metadata": {"stage": 1, "trigger": "manual", "is_founding_window": False}})

        # 4) GATE: unsigned webhook payload must be dropped (no event)
        gate = await c.post(f"{BASE}/subscription/webhooks/apple",
                            json={"signedPayload": "not.a.real.jws"})
        print("gate response:", gate.status_code, gate.json())
        if gate.json().get("verified") is not False:
            print("  ❌ gate did NOT report verified=False"); ok = False

        # garbage with no signedPayload at all
        gate2 = await c.post(f"{BASE}/subscription/webhooks/apple", json={"foo": "bar"})
        print("gate2 response:", gate2.status_code, gate2.json())

    await asyncio.sleep(0.5)

    # ── Verify in user_events ────────────────────────────────────────────
    async def cat(event_type):
        doc = await db.user_events.find_one({"user_id": user_id, "event_type": event_type})
        return doc.get("event_category") if doc else None

    checks = {
        "user_registered": "auth",
        "login_success": "auth",
        "login_failure": "auth",
        "paywall_viewed": "monetization",
    }
    for et, expected in checks.items():
        got = await cat(et)
        status = "✅" if got == expected else "❌"
        if got != expected:
            ok = False
        print(f"{status} {et}: category={got} (expected {expected})")

    # The unsigned webhook must NOT have created any subscription_* analytics event
    spoof_count = await db.user_events.count_documents(
        {"event_type": {"$in": ["subscription_started", "subscription_renewed",
                                 "subscription_cancelled", "subscription_expired",
                                 "subscription_refunded"]},
         "metadata.notification_type": {"$exists": True}}
    )
    # There should be an audit record marked verified:False
    dropped = await db.apple_webhook_events.count_documents({"verified": False})
    print(f"   audit verified=False records: {dropped} (should be >=1)")
    print(f"   spoofed subscription events from webhook: {spoof_count} (should be 0)")
    if spoof_count != 0:
        ok = False

    print("\nRESULT:", "PASS ✅" if ok else "FAIL ❌")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
