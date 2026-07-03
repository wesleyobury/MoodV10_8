#!/usr/bin/env python3
"""
Verify a MOOD user's subscription state after a TestFlight sandbox purchase.

This is the Part 3 companion to the StoreKit SKU cutover. After each of the 4
sandbox purchase tests on a real device / TestFlight build, run this against the
SAME database the backend uses to confirm the user document + user_events landed
in the expected state with the NEW reverse-DNS SKUs.

The 4 sandbox scenarios and what to expect:
  1. monthly         -> subscription.product_id is monthly trial or paid SKU, plan == monthly
  2. annual          -> subscription.product_id is annual trial or paid SKU, plan == annual
  3. founding_annual -> subscription.product_id == com.mood.subscription.founding_annual, plan == founding_annual,
                        founding_pricing_claimed == True
  4. restore         -> same state as the originally purchased SKU is re-applied (idempotent);
                        last_validated_at refreshes, no duplicate corruption.

IMPORTANT: Run against the SAME database the (production) backend connects to.
  - Locally:    reads MONGO_URL / DB_NAME from backend/.env
  - Production: export the production MONGO_URL / DB_NAME first, e.g.
      MONGO_URL='mongodb+srv://...' DB_NAME='mood_prod' \
        python scripts/verify_sandbox_purchase.py -i someone@mood.app --expect monthly

Usage:
  python scripts/verify_sandbox_purchase.py -i officialmoodapp
  python scripts/verify_sandbox_purchase.py -i someone@mood.app --expect annual
  python scripts/verify_sandbox_purchase.py -i someone@mood.app --expect founding_annual
"""
import argparse
import asyncio
import os
import re

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

# Canonical, post-cutover reverse-DNS SKUs (must mirror backend/server.py).
PRODUCT_ANNUAL = "com.mood.subscription.annual"
PRODUCT_MONTHLY = "com.mood.subscription.monthly"
PRODUCT_ANNUAL_PAID = "com.mood.subscription.annual.paid"
PRODUCT_MONTHLY_PAID = "com.mood.subscription.monthly.paid"
PRODUCT_FOUNDING_ANNUAL = "com.mood.subscription.founding_annual"

PLAN_TO_SKU = {
    "monthly": PRODUCT_MONTHLY,
    "annual": PRODUCT_ANNUAL,
    "founding_annual": PRODUCT_FOUNDING_ANNUAL,
}

PLAN_TO_ALLOWED_SKUS = {
    "monthly": {PRODUCT_MONTHLY, PRODUCT_MONTHLY_PAID},
    "annual": {PRODUCT_ANNUAL, PRODUCT_ANNUAL_PAID},
    "founding_annual": {PRODUCT_FOUNDING_ANNUAL},
}

# Old strings that MUST never appear post-cutover.
LEGACY_SKUS = {
    "mood_premium_yearly",
    "mood_premium_monthly",
    "mood_premium_founding_annual",
}

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"


def ok(label: str, passed: bool, extra: str = "") -> bool:
    mark = f"{GREEN}PASS{RESET}" if passed else f"{RED}FAIL{RESET}"
    print(f"  [{mark}] {label}" + (f"  ({extra})" if extra else ""))
    return passed


async def main() -> int:
    parser = argparse.ArgumentParser(description="Verify MOOD sandbox purchase DB state.")
    parser.add_argument("-i", "--identifier", required=True,
                        help="Username OR email of the account that made the purchase.")
    parser.add_argument("--expect", choices=list(PLAN_TO_SKU.keys()), default=None,
                        help="Expected plan for this sandbox test. If set, assertions run.")
    args = parser.parse_args()

    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        print("ERROR: MONGO_URL and DB_NAME must be set (backend/.env or env vars).")
        return 1

    safe = re.sub(r"://[^@]*@", "://***:***@", mongo_url)
    print(f"Connecting to: {safe}  (db: {db_name})\n")

    client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=8000)
    db = client[db_name]

    ident = args.identifier.strip()
    escaped = re.escape(ident)
    user = await db.users.find_one({
        "$or": [
            {"username": {"$regex": f"^{escaped}$", "$options": "i"}},
            {"email": {"$regex": f"^{escaped}$", "$options": "i"}},
        ]
    })
    if not user:
        print(f"ERROR: No user found for identifier '{ident}'.")
        return 1

    uid = str(user["_id"])
    sub = user.get("subscription", {}) or {}
    print(f"User: {user.get('username') or user.get('email')}  (_id={uid})")
    print("-" * 60)
    print("subscription.status            :", sub.get("status"))
    print("subscription.plan              :", sub.get("plan"))
    print("subscription.product_id        :", sub.get("product_id"))
    print("subscription.transaction_id    :", sub.get("transaction_id"))
    print("subscription.original_txn_id   :", sub.get("original_transaction_id"))
    print("subscription.purchase_date     :", sub.get("purchase_date"))
    print("subscription.expiration_date   :", sub.get("expiration_date"))
    print("subscription.last_validated_at :", sub.get("last_validated_at"))
    print("founding_pricing_claimed       :", user.get("founding_pricing_claimed"))
    print("founding_pricing_claimed_at    :", user.get("founding_pricing_claimed_at"))
    print("is_comp                        :", user.get("is_comp"))
    print("-" * 60)

    # Most-recent subscription lifecycle events for this user.
    print("Recent subscription_started events (user_events):")
    cursor = db.user_events.find(
        {"user_id": uid, "event_name": "subscription_started"}
    ).sort("created_at", -1).limit(5)
    events = await cursor.to_list(length=5)
    if not events:
        # Some installs key user_events by ObjectId — try that too.
        cursor = db.user_events.find(
            {"event_name": "subscription_started"}
        ).sort("created_at", -1).limit(5)
        events = [e for e in await cursor.to_list(length=50)
                  if str(e.get("user_id")) == uid][:5]
    if not events:
        print(f"  {YELLOW}(none found){RESET}")
    for e in events:
        md = e.get("metadata", {}) or {}
        print(f"  - {e.get('created_at')}  plan_id={md.get('plan_id')}  "
              f"plan={md.get('plan')}  revenue_usd={md.get('revenue_usd')}  "
              f"category={e.get('event_category')}")
    print("-" * 60)

    all_pass = True

    # Hard guard: no legacy SKU may ever appear on the user doc.
    sub_sku = sub.get("product_id")
    legacy_present = sub_sku in LEGACY_SKUS
    all_pass &= ok("no legacy SKU on subscription.product_id",
                   not legacy_present, extra=str(sub_sku) if legacy_present else "")

    if args.expect:
        expected_skus = PLAN_TO_ALLOWED_SKUS[args.expect]
        print(f"\nAsserting expected plan = '{args.expect}'  (SKUs {sorted(expected_skus)}):")
        all_pass &= ok("subscription.plan matches", sub.get("plan") == args.expect,
                       extra=f"got '{sub.get('plan')}'")
        all_pass &= ok("subscription.product_id matches allowed SKU",
                       sub.get("product_id") in expected_skus,
                       extra=f"got '{sub.get('product_id')}'")
        all_pass &= ok("subscription.status is active/in_trial",
                       sub.get("status") in ("active", "in_trial"),
                       extra=f"got '{sub.get('status')}'")
        all_pass &= ok("transaction_id present", bool(sub.get("transaction_id")))
        all_pass &= ok("original_transaction_id present",
                       bool(sub.get("original_transaction_id")))
        if args.expect == "founding_annual":
            all_pass &= ok("founding_pricing_claimed == True",
                           user.get("founding_pricing_claimed") is True)
        # A subscription_started event should exist with the matching SKU.
        match_evt = any((e.get("metadata", {}) or {}).get("plan_id") in expected_skus
                        for e in events)
        all_pass &= ok("subscription_started event with matching plan_id exists",
                       match_evt)

    print("\n" + ("=" * 60))
    if all_pass:
        print(f"{GREEN}RESULT: ALL CHECKS PASSED{RESET}")
    else:
        print(f"{RED}RESULT: ONE OR MORE CHECKS FAILED{RESET}")
    print("=" * 60)

    client.close()
    return 0 if all_pass else 2


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
