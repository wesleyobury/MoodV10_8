"""
MOOD V2 — Event Tracking Phase 2: Retention engine (server-side).

Computes workout-completion streaks and lapse/comeback signals, emitting
retention events into `user_events`. All retention events are server-side and
reliable (no client involvement), so the funnel can't be skewed by dropped
client beacons.

State is stored on the user document under DEDICATED fields prefixed `rt_` so
it never disturbs the activity-based `current_streak` shown in the UI:

  - rt_streak_current      int    consecutive workout-completion days
  - rt_streak_longest      int    best-ever workout-completion streak
  - rt_streak_last_day     str    'YYYY-MM-DD' (UTC) last day counted
  - rt_last_active_day     str    'YYYY-MM-DD' (UTC) last app_session_start day

Emitted events (event_category='retention'):
  - streak_extended           { new_streak, is_new_streak, source }
  - streak_milestone_reached  { milestone, source }      # 3 / 7 / 14 / 30
  - streak_broken             { previous_streak, source }
  - comeback_after_lapse      { days_inactive }
"""
from datetime import datetime, timezone, timedelta
from typing import Awaitable, Callable, Optional
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)

MILESTONES = [3, 7, 14, 30]
LAPSE_DAYS = 7

# Any of these completion events advances the workout streak.
WORKOUT_COMPLETION_EVENTS = {
    "workout_completed",
    "workout_session_completed",
    "featured_workout_completed",
}
# Events that mark a "the user opened the app today" signal for comeback detection.
#
# V2.1: `app_session_start` alone was wrong. It has exactly ONE emitter
# (contexts/AuthContext.tsx, in the stored-token restore path) and fires only on
# a COLD start with an already-valid token — not on fresh login, not on signup,
# and not on foreground/resume. The AppState listener emits `app_opened`
# instead. So a user who left the app backgrounded for two weeks and resumed it
# never produced a session-start event: comeback_after_lapse never fired,
# lapse-based streak_broken never fired, and rt_last_active_day went stale.
SESSION_START_EVENTS = {"app_session_start", "app_opened"}

EmitFn = Callable[[str, dict], Awaitable[None]]


def _utc_day(dt: Optional[datetime] = None) -> str:
    dt = dt or datetime.now(timezone.utc)
    return dt.strftime("%Y-%m-%d")


def _day_to_dt(day: str) -> datetime:
    return datetime.strptime(day, "%Y-%m-%d").replace(tzinfo=timezone.utc)


async def _resolve_user(db, user_id: str):
    """Match the same id semantics the rest of server.py uses."""
    try:
        u = await db.users.find_one({"_id": ObjectId(user_id)})
        if u:
            return u
    except Exception:
        pass
    return await db.users.find_one({"user_id": user_id})


async def _update_user(db, user: dict, fields: dict) -> None:
    if "user_id" in user and user.get("user_id"):
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": fields})
    else:
        await db.users.update_one({"_id": user["_id"]}, {"$set": fields})


async def process_workout_completion(db, user_id: str, emit: EmitFn) -> None:
    """
    Recompute the workout-completion streak when a completion event lands and
    emit the appropriate retention events. Idempotent within a UTC day.
    """
    try:
        user = await _resolve_user(db, user_id)
        if not user:
            return

        today = _utc_day()
        last_day = user.get("rt_streak_last_day")
        current = int(user.get("rt_streak_current", 0) or 0)
        longest = int(user.get("rt_streak_longest", 0) or 0)

        # Already counted a completion today → no streak change (idempotent).
        if last_day == today:
            # Still keep last-active fresh.
            if user.get("rt_last_active_day") != today:
                await _update_user(db, user, {"rt_last_active_day": today})
            return

        broke_from = 0
        is_new_streak = False

        if not last_day:
            new_streak = 1
            is_new_streak = True
        else:
            delta = (_day_to_dt(today) - _day_to_dt(last_day)).days
            if delta == 1:
                new_streak = current + 1
            elif delta > 1:
                if current >= 1:
                    broke_from = current
                new_streak = 1
                is_new_streak = True
            else:
                # delta <= 0: clock skew / dup — guard, do nothing.
                return

        new_longest = max(longest, new_streak)
        await _update_user(db, user, {
            "rt_streak_current": new_streak,
            "rt_streak_longest": new_longest,
            "rt_streak_last_day": today,
            "rt_last_active_day": today,
        })

        if broke_from:
            await emit("streak_broken", {"previous_streak": broke_from, "source": "missed_day"})
        await emit("streak_extended", {
            "new_streak": new_streak,
            "is_new_streak": is_new_streak,
            "source": "workout_completed",
        })
        if new_streak in MILESTONES:
            await emit("streak_milestone_reached", {"milestone": new_streak, "source": "workout_completed"})

    except Exception as e:  # never block the tracking path
        logger.error(f"retention.process_workout_completion error: {e}")


async def process_session_start(db, user_id: str, emit: EmitFn) -> None:
    """
    On app_session_start, detect a comeback after >=LAPSE_DAYS of inactivity and
    break any stale streak. Updates rt_last_active_day.
    """
    try:
        user = await _resolve_user(db, user_id)
        if not user:
            return

        today = _utc_day()
        last_active = user.get("rt_last_active_day")

        if last_active and last_active != today:
            days_inactive = (_day_to_dt(today) - _day_to_dt(last_active)).days
            if days_inactive >= LAPSE_DAYS:
                await emit("comeback_after_lapse", {"days_inactive": days_inactive})
                cur = int(user.get("rt_streak_current", 0) or 0)
                if cur >= 1:
                    await emit("streak_broken", {"previous_streak": cur, "source": "lapse"})
                    await _update_user(db, user, {"rt_streak_current": 0})

        if last_active != today:
            await _update_user(db, user, {"rt_last_active_day": today})

    except Exception as e:
        logger.error(f"retention.process_session_start error: {e}")


async def process_retention_for_event(db, user_id: str, event_type: str, emit: EmitFn) -> None:
    """Single entry point called from the /analytics/track endpoint."""
    if event_type in WORKOUT_COMPLETION_EVENTS:
        await process_workout_completion(db, user_id, emit)
    elif event_type in SESSION_START_EVENTS:
        await process_session_start(db, user_id, emit)
