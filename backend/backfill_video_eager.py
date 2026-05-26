#!/usr/bin/env python3
"""
Phase 1 — Backfill: eager HLS + 720p MP4 + tall poster for existing
Cloudinary videos referenced by `posts.media_urls`.

This pre-warms the SAME derived URLs that the React Native client requests
at render time via /app/frontend/utils/cloudinaryVideo.ts. Once Cloudinary
finishes the async eager job, every cold view becomes a CDN cache hit.

Usage
-----
  # Always dry-run first to see the cost / count:
  python3 backfill_video_eager.py --dry-run

  # Backfill only recent + popular videos:
  python3 backfill_video_eager.py --days 30 --min-likes 1 --limit 500

  # Backfill everything (do not run without checking the dry-run number):
  python3 backfill_video_eager.py --limit 999999

  # Re-run after a partial backfill — skips public_ids already recorded
  # in `video_eager_status` collection (populated by the webhook):
  python3 backfill_video_eager.py --skip-completed

Flags
-----
  --dry-run            Don't call Cloudinary; just count + print the first 5 URLs.
  --limit N            Max number of videos to process (default 100).
  --days N             Only posts created in the last N days.
  --min-likes N        Only posts with at least N likes.
  --skip-completed     Skip public_ids already in video_eager_status.
  --sleep MS           Sleep between API calls (default 250ms = ~4 req/s).
  --batch-size N       Internal pagination size (default 200).

Notes
-----
- This script uses `cloudinary.uploader.explicit()` with `eager_async=True`,
  which returns immediately. The actual transcode happens server-side at
  Cloudinary. Completion is reported to the webhook configured by
  CLOUDINARY_EAGER_WEBHOOK_URL (if set).
- Transformation credit cost: ~3 transformations per video (HLS + 720p MP4 +
  720w poster). For 1000 videos, expect ~3000 transformations. Check your
  Cloudinary plan before running on the full set.
- This script is idempotent. Cloudinary returns the same derived URL whether
  it already exists or needs to be generated. Already-derived assets do NOT
  consume new transformation credits, but the `explicit()` API call itself
  still hits Cloudinary; use `--skip-completed` to avoid that on re-runs.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import re
import sys
import time
from datetime import datetime, timedelta, timezone
from typing import Optional

import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Load /app/backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True,
)

# Mirrors server.py:VIDEO_EAGER_TRANSFORMS
EAGER_TRANSFORMS = [
    "f_m3u8,q_auto,vc_h264,w_1920,h_1080,c_limit",
    "f_mp4,q_auto,vc_h264,w_1280,h_720,c_limit",
    "f_auto,q_auto,vc_h264,w_1280,h_720,c_limit",
    "so_1,f_jpg,q_auto,w_720",
]

VIDEO_URL_RE = re.compile(
    r"https?://res\.cloudinary\.com/([^/]+)/video/upload/(?:[^/]+/)*?(?:v\d+/)?([^?\s]+?)\.(?:mp4|mov|m4v|webm)",
    re.IGNORECASE,
)


def extract_public_id(url: str) -> Optional[str]:
    """
    Extract the Cloudinary public_id from a video delivery URL.
    Strips any transformation segments, version prefix, and extension.
    """
    if not url or "cloudinary.com" not in url or "/video/upload/" not in url:
        return None

    try:
        # Path after /video/upload/
        after = url.split("/video/upload/", 1)[1]
        # Drop the querystring if any
        after = after.split("?", 1)[0]
        # Walk segments, dropping transformation segments + version
        parts = after.split("/")
        i = 0
        while i < len(parts):
            seg = parts[i]
            if re.match(r"^v\d+$", seg):
                i += 1
                break
            if (
                "," in seg
                or seg.startswith(("c_", "w_", "h_", "q_", "f_", "so_", "vc_", "br_", "fl_", "sp_"))
            ):
                i += 1
                continue
            break
        public_path = "/".join(parts[i:])
        # Strip extension
        public_path = re.sub(r"\.(mp4|mov|m4v|webm|m3u8)$", "", public_path, flags=re.IGNORECASE)
        return public_path or None
    except Exception:
        return None


def queue_eager(public_id: str, webhook_url: str = "") -> dict:
    """Fire async eager transcodes for a public_id. Returns the API response."""
    kwargs = {
        "type": "upload",
        "resource_type": "video",
        "eager": [{"raw_transformation": t} for t in EAGER_TRANSFORMS],
        "eager_async": True,
    }
    if webhook_url:
        kwargs["eager_notification_url"] = webhook_url
    return cloudinary.uploader.explicit(public_id, **kwargs)


async def iter_video_posts(db, days: Optional[int], min_likes: int, batch_size: int):
    """Yield candidate (post_id, public_id) tuples ordered by created_at desc."""
    query: dict = {
        "media_urls": {"$regex": r"cloudinary\.com/.+/video/upload/", "$options": "i"},
    }
    if min_likes > 0:
        query["likes_count"] = {"$gte": min_likes}
    if days is not None:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        query["created_at"] = {"$gte": cutoff}

    cursor = db.posts.find(query, {"_id": 1, "media_urls": 1}).sort("created_at", -1)
    seen: set[str] = set()
    async for post in cursor.batch_size(batch_size):
        for url in post.get("media_urls", []) or []:
            public_id = extract_public_id(url)
            if not public_id or public_id in seen:
                continue
            seen.add(public_id)
            yield str(post["_id"]), public_id


async def already_completed(db, public_id: str) -> bool:
    doc = await db.video_eager_status.find_one(
        {"public_id": public_id}, {"_id": 1}
    )
    return doc is not None


async def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--days", type=int, default=None, help="Only posts within last N days")
    parser.add_argument("--min-likes", type=int, default=0)
    parser.add_argument("--skip-completed", action="store_true")
    parser.add_argument("--sleep", type=int, default=250, help="ms between Cloudinary API calls")
    parser.add_argument("--batch-size", type=int, default=200)
    args = parser.parse_args()

    mongo_url = os.environ["MONGO_URL"]
    db_name = os.environ["DB_NAME"]
    webhook_url = os.environ.get("CLOUDINARY_EAGER_WEBHOOK_URL", "").strip()

    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

    print(f"→ DB: {db_name}")
    print(f"→ Webhook: {webhook_url or '(not configured — completion not tracked)'}")
    print(f"→ Filters: days={args.days} min_likes={args.min_likes} limit={args.limit} skip_completed={args.skip_completed}")
    print(f"→ Eager transforms ({len(EAGER_TRANSFORMS)}):")
    for t in EAGER_TRANSFORMS:
        print(f"    • {t}")
    print()

    processed = 0
    queued = 0
    skipped_completed = 0
    errors = 0
    samples: list[str] = []

    start = time.time()

    async for post_id, public_id in iter_video_posts(
        db, args.days, args.min_likes, args.batch_size
    ):
        if processed >= args.limit:
            break
        processed += 1

        if args.skip_completed and await already_completed(db, public_id):
            skipped_completed += 1
            continue

        if len(samples) < 5:
            samples.append(public_id)

        if args.dry_run:
            continue

        try:
            queue_eager(public_id, webhook_url)
            queued += 1
        except Exception as e:
            errors += 1
            print(f"  ✗ {public_id} — {e}")

        # Throttle
        if args.sleep > 0:
            await asyncio.sleep(args.sleep / 1000.0)

        if queued and queued % 25 == 0:
            print(f"  …queued {queued} so far ({time.time() - start:.1f}s)")

    elapsed = time.time() - start
    print()
    print("=" * 60)
    print(f"Processed:         {processed}")
    print(f"Queued:            {queued}")
    print(f"Skipped (done):    {skipped_completed}")
    print(f"Errors:            {errors}")
    print(f"Elapsed:           {elapsed:.1f}s")
    print(f"Est. transforms:   {queued * len(EAGER_TRANSFORMS)} ({len(EAGER_TRANSFORMS)} per video)")
    print()
    print("Sample public_ids:")
    for s in samples:
        print(f"  • {s}")
    if args.dry_run:
        print()
        print("⚠️  Dry-run only. Re-run without --dry-run to actually queue transcodes.")

    client.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(130)
