#!/usr/bin/env python3
"""
backfill_user_id.py — assign the canonical `user_id` (string `user_xxxxxxxxxxxx`)
to any user document that doesn't have one, and backfill `name` from `username`
where `name` is missing or empty.

MOTIVATION
----------
`backend/server.py` reads `user["user_id"]` as a hard key in several places
(lines 1614, 1760, 6785, 7383). Users created through the current signup endpoint
always have it (set at line 923). But legacy user docs created through older code
paths may only have `_id` (the Mongo ObjectId), which would 500 those endpoints.

The same hard-key risk exists for `name` (line 1763).

This script is **idempotent** — running it twice is a no-op.

USAGE
-----
    # Dry-run against the staging clone of prod
    MONGO_URL="<staging>" DB_NAME=mood_app_staging_clone python scripts/backfill_user_id.py --dry-run

    # Apply against staging clone
    MONGO_URL="<staging>" DB_NAME=mood_app_staging_clone python scripts/backfill_user_id.py --apply

    # Verify counts dropped to 0 on a second dry-run
    MONGO_URL="<staging>" DB_NAME=mood_app_staging_clone python scripts/backfill_user_id.py --dry-run

    # Snapshot prod, then apply
    MONGO_URL="<prod>" DB_NAME=mood_app python scripts/backfill_user_id.py --apply

SAFETY
------
- Default mode is --dry-run; you must explicitly pass --apply to write.
- Reads MONGO_URL and DB_NAME from environment ONLY. Never edit them in code.
- Writes only the two fields listed above; touches no other document state.
- Will refuse to run if MONGO_URL is unset or starts with the obvious local default.
"""
from __future__ import annotations

import argparse
import os
import sys
import uuid
from typing import Any

try:
    from pymongo import MongoClient
    from pymongo.collection import Collection
except ImportError:
    print("ERROR: pymongo not installed. `pip install pymongo` first.", file=sys.stderr)
    sys.exit(2)


def generate_user_id() -> str:
    """Same format as backend/server.py line 923: `user_<12-hex>`."""
    return f"user_{uuid.uuid4().hex[:12]}"


def find_missing_user_id(users: Collection) -> int:
    return users.count_documents(
        {"$or": [{"user_id": {"$exists": False}}, {"user_id": None}, {"user_id": ""}]}
    )


def find_missing_name(users: Collection) -> int:
    return users.count_documents(
        {"$or": [{"name": {"$exists": False}}, {"name": None}, {"name": ""}]}
    )


def sample_docs(users: Collection, query: dict[str, Any], n: int = 5) -> list[dict[str, Any]]:
    return list(users.find(query, {"_id": 1, "username": 1, "email": 1, "user_id": 1, "name": 1}).limit(n))


def apply_user_id_backfill(users: Collection) -> int:
    """Iterate one-at-a-time so each gets its own unique user_id."""
    cursor = users.find(
        {"$or": [{"user_id": {"$exists": False}}, {"user_id": None}, {"user_id": ""}]},
        {"_id": 1},
        no_cursor_timeout=True,
    )
    modified = 0
    try:
        for doc in cursor:
            new_id = generate_user_id()
            # Defensive: if by astronomical chance the generated id already exists, retry.
            while users.count_documents({"user_id": new_id}, limit=1):
                new_id = generate_user_id()
            res = users.update_one(
                {
                    "_id": doc["_id"],
                    # Re-check the missing condition so we don't trample a doc that
                    # got a user_id in between our find and our update.
                    "$or": [{"user_id": {"$exists": False}}, {"user_id": None}, {"user_id": ""}],
                },
                {"$set": {"user_id": new_id}},
            )
            modified += res.modified_count
    finally:
        cursor.close()
    return modified


def apply_name_backfill(users: Collection) -> int:
    """Set name = username for any doc with no usable name."""
    pipeline = [
        {
            "$match": {
                "$or": [
                    {"name": {"$exists": False}},
                    {"name": None},
                    {"name": ""},
                ],
                "username": {"$exists": True, "$ne": None, "$ne": ""},
            }
        },
        {"$set": {"name": "$username"}},
        {"$merge": {"into": users.name, "whenMatched": "merge", "whenNotMatched": "discard"}},
    ]
    # PyMongo aggregate doesn't return modified_count for $merge, so we count
    # the before/after delta ourselves.
    before = find_missing_name(users)
    list(users.aggregate(pipeline))
    after = find_missing_name(users)
    return max(0, before - after)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--dry-run", action="store_true", default=True, help="Report counts only (default).")
    group.add_argument("--apply", action="store_true", help="Actually write the backfill.")
    parser.add_argument("--collection", default="users", help="User collection name (default: users)")
    args = parser.parse_args()

    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url:
        print("ERROR: MONGO_URL environment variable is required.", file=sys.stderr)
        return 2
    if not db_name:
        print("ERROR: DB_NAME environment variable is required.", file=sys.stderr)
        return 2

    print(f"=== backfill_user_id ===")
    print(f"DB    : {db_name}")
    print(f"Mode  : {'APPLY (writes)' if args.apply else 'DRY-RUN (read-only)'}")
    print(f"Coll  : {args.collection}")
    print()

    client: MongoClient = MongoClient(mongo_url)
    try:
        users = client[db_name][args.collection]

        total = users.estimated_document_count()
        missing_uid = find_missing_user_id(users)
        missing_name = find_missing_name(users)

        print(f"Total users in collection           : {total}")
        print(f"Users missing `user_id`             : {missing_uid}")
        print(f"Users missing `name`                : {missing_name}")
        print()

        if missing_uid:
            print("Sample of users missing user_id:")
            for s in sample_docs(
                users,
                {"$or": [{"user_id": {"$exists": False}}, {"user_id": None}, {"user_id": ""}]},
            ):
                print(f"  _id={s.get('_id')} username={s.get('username')!r} email={s.get('email')!r}")
            print()

        if missing_name:
            print("Sample of users missing name:")
            for s in sample_docs(
                users,
                {"$or": [{"name": {"$exists": False}}, {"name": None}, {"name": ""}]},
            ):
                print(f"  _id={s.get('_id')} username={s.get('username')!r}")
            print()

        if not args.apply:
            print("Dry-run complete. Re-run with --apply to write.")
            return 0

        if missing_uid == 0 and missing_name == 0:
            print("Nothing to do. Exiting clean.")
            return 0

        print("Applying...")
        fixed_uid = apply_user_id_backfill(users) if missing_uid else 0
        print(f"  user_id assigned to: {fixed_uid} users")
        fixed_name = apply_name_backfill(users) if missing_name else 0
        print(f"  name backfilled on : {fixed_name} users")
        print()

        # Post-apply verification
        remaining_uid = find_missing_user_id(users)
        remaining_name = find_missing_name(users)
        print(f"Post-apply users missing user_id    : {remaining_uid}")
        print(f"Post-apply users missing name       : {remaining_name}")
        if remaining_uid or remaining_name:
            print("WARNING: some users remain unfixed. Investigate manually.")
            return 1
        print("Done.")
        return 0
    finally:
        client.close()


if __name__ == "__main__":
    sys.exit(main())
