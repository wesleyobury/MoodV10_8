"""
MOOD V2 — Achievement badges (server side).

Two jobs:
  1. `get_achievement_state` — the single source of truth the client reads to
     evaluate every badge (GET /api/achievements/state). Pure read/aggregate.
  2. Server-authoritative badges — badges the client can't compute for itself,
     currently `inspiring_others` ("someone copied your workout"). Awarded here
     and emitted as a `badge_earned` event so it shows on the public Live feed
     AND is tracked, consistent with every other event.

Client-detected badges emit their own `badge_earned` events from the app; this
module only emits for the server-authoritative ones (never double-emits).
"""
from datetime import datetime, timezone, timedelta
from typing import Optional
from bson import ObjectId
import logging

from user_analytics import track_user_event

logger = logging.getLogger(__name__)

WORKOUT_COMPLETION_EVENTS = ["workout_completed"]

# Server-authoritative badge catalog (label/icon/category mirror the client
# definitions in frontend/constants/achievements.ts).
SERVER_BADGE_META = {
    "inspiring_others": {
        "label": "Inspiring others",
        "icon": "people",
        "category": "social",
    },
}

# Keyword → mood bucket (mirrors the Live-feed classifier closely enough for
# the "all moods" badge; 6 canonical buckets).
_MOOD_BUCKETS = {
    "sweat": ("sweat", "burn", "fat", "cardio"),
    "muscle": ("muscle", "gain", "build", "strength"),
    "explosive": ("explos", "power", "athlet"),
    "lazy": ("lazy", "light", "recover", "chill", "easy"),
    "calisthenics": ("calisthenic", "bodyweight", "body weight"),
    "outdoor": ("outdoor", "outside", "run"),
}


def _bucket_for_mood(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    low = str(raw).lower()
    for bucket, keys in _MOOD_BUCKETS.items():
        if any(k in low for k in keys):
            return bucket
    return None


def _normalize_difficulty(raw: Optional[str]) -> Optional[str]:
    if not raw:
        return None
    low = str(raw).lower()
    if any(k in low for k in ("hard", "advanced", "intense", "elite")):
        return "hard"
    if any(k in low for k in ("medium", "intermediate", "moderate")):
        return "medium"
    if any(k in low for k in ("easy", "beginner", "light", "lazy")):
        return "easy"
    return "medium"


async def _find_user(db, user_id: str) -> Optional[dict]:
    try:
        if len(user_id) == 24:
            return await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        pass
    return None


async def get_achievement_state(db, user_id: str) -> dict:
    """Aggregate every signal the client needs to evaluate badges."""
    user = await _find_user(db, user_id)
    user = user or {}

    total_workouts = int(user.get("workouts_count", 0) or 0)
    active_streak = int(user.get("current_streak", 0) or 0)
    workout_streak = int(user.get("rt_streak_current", 0) or 0)
    workout_streak_best = int(user.get("rt_streak_longest", 0) or 0)
    server_badges = list(user.get("server_badges", []) or [])

    now = datetime.now(timezone.utc)
    since = now - timedelta(days=14)
    day7_cutoff = now - timedelta(days=7)

    hard_workouts = 0
    difficulties: set = set()
    moods: set = set()
    days7: set = set()
    days14: set = set()

    cursor = db.user_events.find(
        {
            "user_id": user_id,
            "event_type": {"$in": WORKOUT_COMPLETION_EVENTS},
        },
        {"metadata": 1, "timestamp": 1},
    )
    async for ev in cursor:
        meta = ev.get("metadata") or {}
        diff = _normalize_difficulty(meta.get("difficulty"))
        if diff:
            difficulties.add(diff)
            if diff == "hard":
                hard_workouts += 1
        bucket = _bucket_for_mood(meta.get("mood_category"))
        if bucket:
            moods.add(bucket)
        ts = ev.get("timestamp")
        if isinstance(ts, datetime):
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            if ts >= since:
                day_key = ts.strftime("%Y-%m-%d")
                days14.add(day_key)
                if ts >= day7_cutoff:
                    days7.add(day_key)

    posts_count = 0
    try:
        posts_count = await db.posts.count_documents({"author_id": ObjectId(user_id)})
    except Exception:
        posts_count = 0

    return {
        "total_workouts": total_workouts,
        "active_streak": active_streak,
        "workout_streak": workout_streak,
        "workout_streak_best": workout_streak_best,
        "workout_days_last_7": len(days7),
        "workout_days_last_14": len(days14),
        "moods_tried": len(moods),
        "difficulties_tried": len(difficulties),
        "hard_workouts": hard_workouts,
        "posts_count": posts_count,
        "server_badges": server_badges,
    }


async def award_server_badge(db, user_id: str, badge_id: str) -> bool:
    """Idempotently award a server-authoritative badge and emit its event.

    Returns True if newly awarded, False if the user already had it."""
    meta = SERVER_BADGE_META.get(badge_id)
    if not meta:
        logger.warning(f"award_server_badge: unknown badge {badge_id}")
        return False

    user = await _find_user(db, user_id)
    if not user:
        return False
    if badge_id in (user.get("server_badges", []) or []):
        return False

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$addToSet": {"server_badges": badge_id}},
    )

    await track_user_event(
        db,
        user_id,
        "badge_earned",
        {
            "badge_id": badge_id,
            "badge_label": meta["label"],
            "badge_icon": meta["icon"],
            "badge_category": meta["category"],
            "server_awarded": True,
        },
    )
    logger.info(f"🏅 Awarded server badge '{badge_id}' to user {user_id}")
    return True


async def handle_workout_copied(db, actor_id: str, snapshot_id: str) -> None:
    """When `actor_id` copies a workout from snapshot `snapshot_id`, credit the
    original author with the `inspiring_others` badge (once)."""
    if not snapshot_id:
        return
    try:
        snapshot = await db.workout_snapshots.find_one({"_id": ObjectId(snapshot_id)})
    except Exception:
        snapshot = None
    if not snapshot:
        return
    owner_id = str(snapshot.get("user_id") or "")
    if not owner_id or owner_id == str(actor_id):
        return  # can't inspire yourself
    try:
        await award_server_badge(db, owner_id, "inspiring_others")
    except Exception as e:
        logger.error(f"handle_workout_copied award error: {e}")
