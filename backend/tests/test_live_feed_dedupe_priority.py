"""Regression test for the dedupe-ordering bug that hid `workout_snapshot_id`
on Live Feed completion cards.

Scenario reproduced: workout-guidance.tsx fires BOTH
`workout_completed` (carries snapshot_id) and `workout_session_completed`
(no snapshot_id) within milliseconds at the end of a session. The live
feed deduplicates by (user, "complete", minute-bucket). Before the fix
the newest-first iteration meant `workout_session_completed` won the
dedupe and the entry lost its snapshot id — so "Try this workout"
silently fell back to mood sub-selection for every session completed
via workout-guidance.

This test directly inserts both event documents + a workout_cards row,
then hits `/api/feed/live` and asserts the resulting feed entry retains
the snapshot id (via either the dedupe priority OR the workout_cards
fallback). Cleanup deletes the inserted docs.
"""
import os
import sys
import time
import uuid
import asyncio
import pytest
import requests
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

BASE_URL = (
    os.environ.get("EXPO_PUBLIC_BACKEND_URL")
    or os.environ.get("REACT_APP_BACKEND_URL")
    or "http://localhost:8001"
).rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


async def _seed_paired_completion(snap_id: str, user_id: str, ts: datetime, mood: str):
    """Insert a workout_completed + workout_session_completed pair plus
    a workout_cards row so we exercise BOTH the dedupe priority AND the
    workout_cards fallback paths simultaneously."""
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    # snapshot doc
    await db.workout_snapshots.insert_one({
        "_id": ObjectId(snap_id),
        "user_id": user_id,
        "workouts": [{
            "workoutTitle": "Lazy Gentle Movement",
            "workoutName": "Lazy Gentle Movement",
            "equipment": "Bodyweight",
            "duration": "10 min",
            "difficulty": "beginner",
            "moodCategory": mood,
            "imageUrl": "",
            "description": "Slow flow.",
            "battlePlan": "Step 1: ...",
            "intensityReason": "",
            "moodTips": [],
        }],
        "total_duration": 10,
        "mood_category": mood,
        "created_at": ts,
    })
    # workout_completed — has snapshot_id
    completed_id = ObjectId()
    await db.user_events.insert_one({
        "_id": completed_id,
        "user_id": user_id,
        "event_type": "workout_completed",
        "timestamp": ts,
        "metadata": {
            "mood_category": mood,
            "workout_snapshot_id": snap_id,
            "exercises_completed": 1,
            "duration_minutes": 10,
            "workout_name": "Lazy Gentle Movement",
        },
    })
    # workout_session_completed — 5ms LATER, NO snapshot_id (this is the
    # regression trigger)
    session_id = ObjectId()
    await db.user_events.insert_one({
        "_id": session_id,
        "user_id": user_id,
        "event_type": "workout_session_completed",
        "timestamp": ts.replace(microsecond=ts.microsecond + 5000),
        "metadata": {
            "mood_category": mood,
            "workout_name": "Lazy Gentle Movement",
            "duration_seconds": 600,
        },
    })
    # workout_cards row (also has snapshot_id — exercises the fallback path)
    card_id = ObjectId()
    await db.workout_cards.insert_one({
        "_id": card_id,
        "user_id": user_id,
        "workouts": [{"name": "Lazy Gentle Movement"}],
        "total_duration": 10,
        "completed_at": ts.strftime("%b %d, %Y"),
        "mood_category": mood,
        "workout_snapshot_id": snap_id,
        "created_at": ts,
    })
    client.close()
    return completed_id, session_id, card_id


async def _cleanup(snap_id, completed_id, session_id, card_id, user_id):
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]
    await db.workout_snapshots.delete_one({"_id": ObjectId(snap_id)})
    await db.user_events.delete_one({"_id": completed_id})
    await db.user_events.delete_one({"_id": session_id})
    await db.workout_cards.delete_one({"_id": card_id})
    if user_id.startswith("ffff"):
        await db.users.delete_one({"_id": ObjectId(user_id)})
    client.close()


def test_paired_completion_keeps_snapshot_id():
    """Insert the paired events + snapshot + workout_card, hit
    /api/feed/live, assert the resulting entry surfaces the snapshot id."""
    snap_id = str(ObjectId())
    # Use a synthetic user document so the feed has someone to attribute
    # the events to.
    user_id = str(ObjectId())
    async def _setup():
        client = AsyncIOMotorClient(MONGO_URL)
        db = client[DB_NAME]
        await db.users.insert_one({
            "_id": ObjectId(user_id),
            "username": f"lazyrx_{uuid.uuid4().hex[:6]}",
            "name": "Lazy Regression",
            "email": f"lazyrx_{uuid.uuid4().hex[:6]}@example.com",
            "password_hash": "x",
            "created_at": datetime.now(timezone.utc),
        })
        client.close()
    asyncio.run(_setup())

    ts = datetime.now(timezone.utc).replace(microsecond=0)
    completed_id, session_id, card_id = asyncio.run(
        _seed_paired_completion(snap_id, user_id, ts, "I'm feeling lazy - Lower Body")
    )
    try:
        time.sleep(0.5)  # let the seeded docs settle
        r = requests.get(f"{BASE_URL}/api/feed/live?limit=50", timeout=20)
        assert r.status_code == 200, r.text
        entries = r.json().get("entries", [])
        # Find OUR entry by user_id
        ours = [e for e in entries if e["user"]["id"] == user_id]
        assert ours, (
            f"seeded user {user_id} not in feed (got {len(entries)} total entries)"
        )
        entry = ours[0]
        assert entry["workout_snapshot_id"] == snap_id, (
            f"snapshot id missing: got entry={entry!r}"
        )
        assert entry["mood_bucket"] == "lazy"
    finally:
        async def _drop_user():
            client = AsyncIOMotorClient(MONGO_URL)
            db = client[DB_NAME]
            await db.users.delete_one({"_id": ObjectId(user_id)})
            client.close()
        asyncio.run(_cleanup(snap_id, completed_id, session_id, card_id, user_id))
        asyncio.run(_drop_user())
