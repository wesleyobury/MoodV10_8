"""
One-off script: push the v3 hero image URLs from seed_data.py into the existing
featured_workouts MongoDB documents. The auto-seed at startup only fires when
titles mismatch, so an image-only refresh needs an explicit push.

Run:
    cd /app/backend && python sync_hero_images.py
"""
import asyncio
import os
import sys

from motor.motor_asyncio import AsyncIOMotorClient

sys.path.insert(0, os.path.dirname(__file__))
from seed_data import PREVIEW_FEATURED_WORKOUTS  # noqa: E402


async def main() -> None:
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    updated = 0
    for w in PREVIEW_FEATURED_WORKOUTS:
        title = w["title"]
        hero = w.get("heroImageUrl")
        if not hero:
            continue
        result = await db.featured_workouts.update_one(
            {"title": title},
            {"$set": {"heroImageUrl": hero, "imageUrl": hero, "image_url": hero}},
        )
        marker = "✅" if result.modified_count else "·"
        print(f"  {marker} {title}: matched={result.matched_count} modified={result.modified_count}")
        if result.modified_count:
            updated += 1

    print(f"\nUpdated {updated} workout(s).")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
