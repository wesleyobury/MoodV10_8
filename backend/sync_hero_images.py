"""
Sync featured-workout hero images from seed_data.py into MongoDB.

Why this exists
---------------
The auto-seed routine only fires on TITLE mismatches. If we change a hero
image but keep the title (the common case), nothing happens at startup and
the carousel keeps showing the stale image. Pushing the sync into the
startup path eliminates the one-off `python sync_hero_images.py` ritual.

Idempotent: only PATCHes documents whose `heroImageUrl` actually differs.

Usage:
  - CLI: `python sync_hero_images.py`
  - Programmatic: `await sync_featured_hero_images(db)`
"""
import asyncio
import logging
import os
import sys
from typing import Tuple

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

sys.path.insert(0, os.path.dirname(__file__))
from seed_data import PREVIEW_FEATURED_WORKOUTS  # noqa: E402


logger = logging.getLogger(__name__)


async def sync_featured_hero_images(
    db: AsyncIOMotorDatabase,
) -> Tuple[int, int]:
    """
    Push current `heroImageUrl` values from PREVIEW_FEATURED_WORKOUTS into
    the live featured_workouts docs (matched by title). Only PATCHes where
    the stored value differs from the seed value.

    Returns: (workouts_checked, workouts_updated)
    """
    checked = 0
    updated = 0
    for w in PREVIEW_FEATURED_WORKOUTS:
        title = w.get("title")
        hero = w.get("heroImageUrl")
        if not title or not hero:
            continue
        checked += 1
        existing = await db.featured_workouts.find_one(
            {"title": title}, {"heroImageUrl": 1}
        )
        if not existing:
            continue
        if existing.get("heroImageUrl") == hero:
            continue
        result = await db.featured_workouts.update_one(
            {"title": title},
            {"$set": {"heroImageUrl": hero, "imageUrl": hero, "image_url": hero}},
        )
        if result.modified_count:
            updated += 1
            logger.info(f"hero-sync: updated '{title}'")
    if updated:
        logger.info(f"hero-sync: {updated}/{checked} workouts updated")
    else:
        logger.info(f"hero-sync: {checked} workouts checked, all in sync")
    return checked, updated


async def _cli_main() -> None:
    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    checked, updated = await sync_featured_hero_images(db)
    print(f"Checked {checked} workout(s). Updated {updated}.")
    client.close()


if __name__ == "__main__":
    asyncio.run(_cli_main())
