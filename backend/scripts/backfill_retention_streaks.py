"""
MOOD V2 — Phase 2 retention backfill.

Computes each user's workout-completion streak state from their `user_events`
history and writes it to the dedicated `rt_*` fields so the live retention
engine (retention.py) extends/breaks streaks correctly going forward.

Idempotent: re-running recomputes from history and overwrites the rt_* fields.
Does NOT emit any retention events (we don't want to spam historical events).
Does NOT touch the activity-based `current_streak` shown in the UI.

Run:
  cd /app/backend && python scripts/backfill_retention_streaks.py
  cd /app/backend && python scripts/backfill_retention_streaks.py --dry-run
"""
import os
import sys
import asyncio
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv("/app/backend/.env")

from motor.motor_asyncio import AsyncIOMotorClient  # noqa: E402
from retention import WORKOUT_COMPLETION_EVENTS, MILESTONES  # noqa: E402

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ.get("DB_NAME", "mood_app")

DRY_RUN = "--dry-run" in sys.argv


def _utc_day(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%d")


def _streak_from_days(days: set) -> tuple:
    """
    Given a set of 'YYYY-MM-DD' workout days, return
    (current_streak, longest_streak, last_day) where current_streak is the run
    ending on the most-recent workout day (the engine breaks it on the next
    completion if that day is stale).
    """
    if not days:
        return 0, 0, None

    sorted_days = sorted(datetime.strptime(d, "%Y-%m-%d").date() for d in days)

    longest = 1
    run = 1
    for i in range(1, len(sorted_days)):
        if (sorted_days[i] - sorted_days[i - 1]).days == 1:
            run += 1
        else:
            run = 1
        longest = max(longest, run)

    # current = run ending at the most recent day
    current = 1
    for i in range(len(sorted_days) - 1, 0, -1):
        if (sorted_days[i] - sorted_days[i - 1]).days == 1:
            current += 1
        else:
            break

    last_day = sorted_days[-1].strftime("%Y-%m-%d")
    return current, longest, last_day


async def main():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # Distinct users that have at least one completion event.
    user_ids = await db.user_events.distinct(
        "user_id", {"event_type": {"$in": list(WORKOUT_COMPLETION_EVENTS)}}
    )
    user_ids = [u for u in user_ids if u]
    print(f"Found {len(user_ids)} users with workout-completion history")

    updated = 0
    milestone_counts = {m: 0 for m in MILESTONES}

    for uid in user_ids:
        cursor = db.user_events.find(
            {"user_id": uid, "event_type": {"$in": list(WORKOUT_COMPLETION_EVENTS)}},
            {"timestamp": 1},
        )
        days = set()
        last_active = None
        async for ev in cursor:
            ts = ev.get("timestamp")
            if not isinstance(ts, datetime):
                continue
            days.add(_utc_day(ts))
            if last_active is None or ts > last_active:
                last_active = ts

        current, longest, last_day = _streak_from_days(days)
        if longest in milestone_counts:
            milestone_counts[longest] += 1

        # rt_last_active_day: most recent ANY-event day (better signal for comeback).
        last_evt = await db.user_events.find_one(
            {"user_id": uid}, sort=[("timestamp", -1)], projection={"timestamp": 1}
        )
        rt_last_active = (
            _utc_day(last_evt["timestamp"])
            if last_evt and isinstance(last_evt.get("timestamp"), datetime)
            else last_day
        )

        fields = {
            "rt_streak_current": current,
            "rt_streak_longest": longest,
            "rt_streak_last_day": last_day,
            "rt_last_active_day": rt_last_active,
        }

        if DRY_RUN:
            continue

        # Match either id form.
        from bson import ObjectId
        try:
            res = await db.users.update_one({"_id": ObjectId(uid)}, {"$set": fields})
            if res.matched_count == 0:
                await db.users.update_one({"user_id": uid}, {"$set": fields})
        except Exception:
            await db.users.update_one({"user_id": uid}, {"$set": fields})
        updated += 1

    print(f"{'[DRY-RUN] would update' if DRY_RUN else 'Updated'} {updated} users")
    print(f"Longest-streak distribution at milestones: {milestone_counts}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
