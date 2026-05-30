"""
MOOD V2 — one-time migration: set the 14-day founding window expiry on all
users already marked `founding_member = true`.

The founding cohort itself was already locked before this script runs (the
created_at cutoff has passed). This script does NOT add anyone new to
`founding_member` — it only stamps `founding_window_expires_at` so the V2
founding-offer modal can show the correct countdown, and persists the
`v2_launch_date` to `app_config`.

Idempotent: re-running does NOT move the expiry once set (matches only docs
where `founding_window_expires_at` is unset/null).

Usage:
    cd /app/backend && python scripts/migrate_founding_window.py            # dry-run
    cd /app/backend && python scripts/migrate_founding_window.py --commit   # apply
"""
import asyncio
import os
import sys
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
load_dotenv()

from motor.motor_asyncio import AsyncIOMotorClient

WINDOW_DAYS = 14


async def migrate(commit: bool):
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ.get("DB_NAME", "mood_app")]

    launch_date = datetime.now(timezone.utc)
    window_expires = launch_date + timedelta(days=WINDOW_DAYS)

    total_founding = await db.users.count_documents({"founding_member": True})
    needs_window = await db.users.count_documents({
        "founding_member": True,
        "$or": [
            {"founding_window_expires_at": {"$exists": False}},
            {"founding_window_expires_at": None},
        ],
    })

    print("=" * 60)
    print("MOOD V2 — Founding window migration")
    print("=" * 60)
    print(f"  founding_member == true            : {total_founding}")
    print(f"  ...still needing window expiry set : {needs_window}")
    print(f"  launch_date                        : {launch_date.isoformat()}")
    print(f"  window_expires (+{WINDOW_DAYS}d)            : {window_expires.isoformat()}")
    print("=" * 60)
    print(">>> Verify the founding_member count matches expectations BEFORE committing.")

    if not commit:
        print("\nDRY RUN — no changes written. Re-run with --commit to apply.")
        client.close()
        return

    result = await db.users.update_many(
        {
            "founding_member": True,
            "$or": [
                {"founding_window_expires_at": {"$exists": False}},
                {"founding_window_expires_at": None},
            ],
        },
        {"$set": {
            "founding_window_expires_at": window_expires,
            "founding_pricing_claimed": False,
        }},
    )

    await db.app_config.update_one(
        {"_id": "app_config"},
        {"$set": {"v2_launch_date": launch_date}},
        upsert=True,
    )

    print(f"\n✅ Set founding window on {result.modified_count} users.")
    print(f"✅ v2_launch_date persisted to app_config: {launch_date.isoformat()}")
    print(f"   Window expires: {window_expires.isoformat()}")
    client.close()


if __name__ == "__main__":
    commit = "--commit" in sys.argv
    asyncio.run(migrate(commit))
