"""Seed fake workout activity events for the Live tab in preview/test environments.

Usage:
    python /app/scripts/seed_live_feed.py [--clear] [--count N]

By default, generates ~40 events spread across the last 48 hours:
  - 5 workout_started events within the last 20 minutes (LIVE NOW)
  - 15 completion events within the last 6 hours
  - 15 completion events between 6h and 48h
  - 5 events in the 2-7 day range (will surface as "yesterday" / "X days ago")

Also bumps 2-3 users' workouts_count to milestone thresholds so milestone
cards appear.
"""
import asyncio
import os
import random
import sys
from datetime import datetime, timezone, timedelta

from dotenv import load_dotenv
load_dotenv('/app/backend/.env')
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

SEED_TAG = "live_feed_seed_v1"

MOOD_PRESETS = [
    {"mood": "Sweat / burn fat", "names": ["HIIT - Tabata", "Sprint Intervals", "Hill & Sprint", "Burpee Burner"], "equipment": ["Bodyweight", "Treadmill"]},
    {"mood": "Muscle Gainer - Back & Bis Volume", "names": ["Pull Day", "Lat Builder", "Curl Pyramid", "Row Volume"], "equipment": ["Barbell", "Dumbbells", "Cable"]},
    {"mood": "Build Explosion - Power Lifting", "names": ["Box Jumps", "Power Cleans", "Plyo Push", "Med Ball Slam"], "equipment": ["Barbell", "Plyo Box"]},
    {"mood": "Calisthenics - Pulls & Dips", "names": ["Bar Skills", "Dip Volume", "Front Lever Hold", "Muscle-Up Prep"], "equipment": ["Pull-up Bar", "Bodyweight"]},
    {"mood": "Get Outside - Hill Workout", "names": ["Trail Run", "Hill Repeat", "Stair Climb", "Outdoor Loop"], "equipment": ["Bodyweight"]},
    {"mood": "I'm feeling lazy", "names": ["Couch Stretch", "Easy Mobility", "Wake-Up Flow"], "equipment": ["Bodyweight"]},
]

DIFFICULTIES = ["beginner", "intermediate", "advanced"]


async def main():
    args = sys.argv[1:]
    do_clear = "--clear" in args

    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]

    if do_clear:
        res = await db.user_events.delete_many({"metadata.seed_tag": SEED_TAG})
        await db.users.update_many({"workouts_count_seed_backup": {"$exists": True}},
                                   [{"$set": {"workouts_count": "$workouts_count_seed_backup"}},
                                    {"$unset": "workouts_count_seed_backup"}])
        print(f"Cleared {res.deleted_count} seeded events; restored milestone backups.")
        client.close()
        return

    # Pick real users (not just admin) to spread activity across
    users = await db.users.find({}, {"_id": 1, "username": 1, "name": 1}).limit(40).to_list(40)
    if len(users) < 3:
        print("Not enough users in DB to seed varied activity.")
        client.close()
        return

    print(f"Found {len(users)} candidate users.")

    now = datetime.now(timezone.utc)

    def rand_mood():
        return random.choice(MOOD_PRESETS)

    events_to_insert = []

    # ---- 1) LIVE NOW (5 events, last 20 min) ----
    for i in range(5):
        u = random.choice(users)
        m = rand_mood()
        ts = now - timedelta(minutes=random.randint(1, 18))
        events_to_insert.append({
            "user_id": str(u["_id"]),
            "event_type": "workout_started",
            "event_category": "workout",
            "metadata": {
                "mood_category": m["mood"],
                "workout_name": random.choice(m["names"]),
                "difficulty": random.choice(DIFFICULTIES),
                "equipment": random.choice(m["equipment"]),
                "seed_tag": SEED_TAG,
            },
            "timestamp": ts,
            "session_id": None,
        })

    # ---- 2) Completions within last 6 hours (15 events) ----
    for i in range(15):
        u = random.choice(users)
        m = rand_mood()
        ts = now - timedelta(minutes=random.randint(20, 6 * 60))
        wname = random.choice(m["names"])
        events_to_insert.append({
            "user_id": str(u["_id"]),
            "event_type": "workout_session_completed",
            "event_category": "workout",
            "metadata": {
                "mood_category": m["mood"],
                "workout_name": wname,
                "difficulty": random.choice(DIFFICULTIES),
                "equipment": random.choice(m["equipment"]),
                "duration_seconds": random.randint(8, 35) * 60,
                "duration_minutes": random.randint(8, 35),
                "seed_tag": SEED_TAG,
            },
            "timestamp": ts,
            "session_id": None,
        })

    # ---- 3) Completions 6h-48h ago (15 events) ----
    for i in range(15):
        u = random.choice(users)
        m = rand_mood()
        ts = now - timedelta(hours=random.uniform(6, 48))
        events_to_insert.append({
            "user_id": str(u["_id"]),
            "event_type": "workout_completed",
            "event_category": "workout",
            "metadata": {
                "mood_category": m["mood"],
                "workout_name": random.choice(m["names"]),
                "difficulty": random.choice(DIFFICULTIES),
                "equipment": random.choice(m["equipment"]),
                "duration_minutes": random.randint(8, 45),
                "exercises_completed": random.randint(2, 6),
                "seed_tag": SEED_TAG,
            },
            "timestamp": ts,
            "session_id": None,
        })

    # ---- 4) A few older entries (2-7 days) for the soft fallback ----
    for i in range(5):
        u = random.choice(users)
        m = rand_mood()
        ts = now - timedelta(days=random.uniform(2, 7))
        events_to_insert.append({
            "user_id": str(u["_id"]),
            "event_type": "workout_completed",
            "event_category": "workout",
            "metadata": {
                "mood_category": m["mood"],
                "workout_name": random.choice(m["names"]),
                "difficulty": random.choice(DIFFICULTIES),
                "equipment": random.choice(m["equipment"]),
                "duration_minutes": random.randint(8, 45),
                "exercises_completed": random.randint(2, 6),
                "seed_tag": SEED_TAG,
            },
            "timestamp": ts,
            "session_id": None,
        })

    res = await db.user_events.insert_many(events_to_insert)
    print(f"Inserted {len(res.inserted_ids)} seeded user_events.")

    # ---- 5) Milestone setup: bump 3 random users to milestone counts ----
    milestone_targets = [5, 25, 100]
    chosen = random.sample(users, k=min(3, len(users)))
    for u, target in zip(chosen, milestone_targets):
        # back up original count and set to milestone
        existing = await db.users.find_one({"_id": u["_id"]}, {"workouts_count": 1})
        original = existing.get("workouts_count", 0) if existing else 0
        await db.users.update_one(
            {"_id": u["_id"]},
            {"$set": {
                "workouts_count": target,
                "workouts_count_seed_backup": original,
            }},
        )
        # ensure they have a recent workout_completed so milestone branch picks them up
        await db.user_events.insert_one({
            "user_id": str(u["_id"]),
            "event_type": "workout_completed",
            "event_category": "workout",
            "metadata": {
                "mood_category": "Muscle Gainer - Back & Bis Volume",
                "workout_name": "Milestone Workout",
                "difficulty": "intermediate",
                "duration_minutes": 25,
                "exercises_completed": 4,
                "seed_tag": SEED_TAG,
            },
            "timestamp": now - timedelta(minutes=random.randint(30, 240)),
            "session_id": None,
        })
        print(f"  Milestone: {u.get('username') or u['_id']} bumped to {target} (was {original})")

    client.close()
    print("✅ Seeding complete.")


if __name__ == "__main__":
    asyncio.run(main())
