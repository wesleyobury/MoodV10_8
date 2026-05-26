#!/usr/bin/env python3
"""
audit_post_authors.py — READ-ONLY audit of post→author integrity in the prod DB.

WHY THIS IS AN AUDIT, NOT A BACKFILL
-------------------------------------
In backend/server.py the feed/profile post pipelines hydrate the embedded
`post.author` sub-document **at read time** via a $lookup against `users`
(line 7679–7686), with normalization that handles both string and ObjectId
`author_id`. So writing an embedded author sub-doc to disk would denormalize
data that the application already de-references live.

What we DO need to know before pointing the new backend at prod Mongo:

1. Posts whose `author_id` doesn't resolve to any user (orphaned posts).
   These vanish from feeds silently because the pipeline uses `$unwind: "$author"`.
   Usually desired behaviour after account deletion, but you want the count.

2. Posts missing `author_id` entirely. The startup migration
   `_migrate_posts_author_id` already handles these — this script just reports
   the count so you know how much that migration will move.

3. Users referenced by posts but missing one of the strict fields required by
   the `UserResponse` Pydantic model (lines 7716–7726):
     - username  (strict)
     - email     (strict)
     - created_at (strict)
   If any of these are missing on a user referenced by a post, the feed loop
   will 500 when it tries to serialize.

USAGE
-----
    MONGO_URL="<prod>" DB_NAME=mood_app python scripts/audit_post_authors.py

    # Print sample IDs of each broken case (default is just counts):
    MONGO_URL="<prod>" DB_NAME=mood_app python scripts/audit_post_authors.py --samples 10

SAFETY
------
This script never writes. Safe to run against prod at any time, including while
the live backend is serving traffic.
"""
from __future__ import annotations

import argparse
import os
import sys
from typing import Any

try:
    from bson import ObjectId
    from pymongo import MongoClient
except ImportError:
    print("ERROR: pymongo not installed. `pip install pymongo` first.", file=sys.stderr)
    sys.exit(2)

STRICT_USER_FIELDS = ("username", "email", "created_at")


def _to_oid(value: Any) -> ObjectId | None:
    """Mirror the server's `_author_oid` normalization."""
    if isinstance(value, ObjectId):
        return value
    if isinstance(value, str):
        try:
            return ObjectId(value)
        except Exception:
            return None
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--samples", type=int, default=5, help="How many sample post IDs to print per category (default 5).")
    args = parser.parse_args()

    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url:
        print("ERROR: MONGO_URL environment variable is required.", file=sys.stderr)
        return 2
    if not db_name:
        print("ERROR: DB_NAME environment variable is required.", file=sys.stderr)
        return 2

    print("=== audit_post_authors (read-only) ===")
    print(f"DB    : {db_name}")
    print()

    client: MongoClient = MongoClient(mongo_url)
    try:
        db = client[db_name]
        posts = db.posts
        users = db.users

        total_posts = posts.estimated_document_count()
        print(f"Total posts: {total_posts}")

        # 1) Posts missing author_id
        missing_author_id = list(
            posts.find(
                {"$or": [{"author_id": {"$exists": False}}, {"author_id": None}]},
                {"_id": 1, "caption": 1, "created_at": 1},
            ).limit(max(args.samples, 1) * 50)
        )
        n_missing_author_id = posts.count_documents(
            {"$or": [{"author_id": {"$exists": False}}, {"author_id": None}]}
        )
        print()
        print(f"[1] Posts with no author_id      : {n_missing_author_id}")
        print("    -> the startup migration `_migrate_posts_author_id` will attempt to fix these.")
        for s in missing_author_id[: args.samples]:
            print(f"    sample _id={s['_id']} created_at={s.get('created_at')}")

        # 2) Orphaned posts (author_id present but doesn't resolve to a user)
        # Strategy: stream all distinct author_ids from posts, normalize, check users in batch.
        print()
        print("[2] Scanning for orphan posts (author_id with no matching user)...")
        author_ids_in_posts = posts.distinct("author_id")
        author_oids = [oid for oid in (_to_oid(a) for a in author_ids_in_posts) if oid is not None]
        existing_user_oids = set(
            doc["_id"] for doc in users.find({"_id": {"$in": author_oids}}, {"_id": 1})
        )
        orphan_oids = [oid for oid in author_oids if oid not in existing_user_oids]
        n_orphan = posts.count_documents(
            {
                "$expr": {
                    "$in": [
                        {
                            "$cond": [
                                {"$eq": [{"$type": "$author_id"}, "string"]},
                                {"$toObjectId": "$author_id"},
                                "$author_id",
                            ]
                        },
                        orphan_oids if orphan_oids else [ObjectId("000000000000000000000000")],
                    ]
                }
            }
        ) if orphan_oids else 0
        print(f"    orphan author_ids referenced : {len(orphan_oids)}")
        print(f"    posts pointing at them       : {n_orphan}")
        print("    -> these vanish silently from feeds via $unwind on $author. Usually fine after account deletion.")
        for oid in orphan_oids[: args.samples]:
            sample_post = posts.find_one({"author_id": oid}, {"_id": 1, "created_at": 1})
            print(f"    sample post _id={sample_post['_id']!s} orphan_author_id={oid!s}")

        # 3) Referenced users missing strict fields
        print()
        print("[3] Users referenced by posts but missing strict UserResponse fields...")
        for field in STRICT_USER_FIELDS:
            q = {
                "_id": {"$in": list(existing_user_oids)},
                "$or": [{field: {"$exists": False}}, {field: None}],
            }
            if field != "created_at":
                # `""`(empty string) also counts as missing for text fields
                q["$or"].append({field: ""})
            n = users.count_documents(q)
            print(f"    referenced users missing `{field}` : {n}")
            if n:
                for s in users.find(q, {"_id": 1, "username": 1, "email": 1}).limit(args.samples):
                    print(f"        sample user _id={s['_id']!s} username={s.get('username')!r} email={s.get('email')!r}")

        print()
        print("Audit complete. No writes performed.")
        return 0
    finally:
        client.close()


if __name__ == "__main__":
    sys.exit(main())
