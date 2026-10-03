"""
MOOD V3 tracking integrity (Oct 2026 relaunch).

Three jobs, all best-effort (tracking never breaks a request):

1. Server-side events that must not depend on the client (opt-out, offline, old builds):
     v3_workout_generated   POST /api/v3/workouts/generate (persisted requests only; live Home previews are not counted)
     workout_start_gate     POST /api/workouts/start, allowed or blocked (the workout #2 paywall)
   Both go through user_analytics.track_user_event, so they land in user_events like every other event.

2. User milestones, stamped once on users.milestones.<field> the first time the matching event happens, so the
   admin can answer activation questions without replaying each user's event history:
     v3_onboarded_at, first_workout_generated_at, first_workout_started_at, first_workout_completed_at,
     second_workout_attempted_at, first_paywall_at, trial_started_at, first_paid_at
   stamp_milestones() is called from track_user_event for every event, so client and server events both count.

3. backfill_milestones(): rebuild milestones from the existing event history (run once at launch, idempotent).
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

from bson import ObjectId

logger = logging.getLogger(__name__)

MILESTONE_FIELDS = (
    "v3_onboarded_at",
    "first_workout_generated_at",
    "first_workout_started_at",
    "first_workout_completed_at",
    "second_workout_attempted_at",
    "first_paywall_at",
    "trial_started_at",
    "first_paid_at",
)

# SKUs sold without a free trial: a subscription_started on one of these is a paid start.
PAID_NO_TRIAL_SKUS = {
    "com.mood.subscription.annual.paid",
    "com.mood.subscription.monthly.paid",
    "com.mood.subscription.founding_annual",
}


def milestone_for_event(event_type: str, md: Optional[dict]) -> Optional[str]:
    """Which milestone (if any) an event marks. Pure, so it is unit-tested directly."""
    md = md or {}
    if event_type == "v3_training_profile_saved":
        return "v3_onboarded_at" if md.get("saved", True) else None
    if event_type == "v3_workout_generated":
        return "first_workout_generated_at" if md.get("status") == "ok" else None
    if event_type == "workout_generated":  # V2 Choose For Me
        return "first_workout_generated_at"
    if event_type == "workout_started":
        return "first_workout_started_at"
    if event_type == "workout_completed":
        return "first_workout_completed_at"
    if event_type == "paywall_viewed":
        return "first_paywall_at"
    if event_type == "purchase_completed":
        return "trial_started_at" if md.get("is_trial") else "first_paid_at"
    if event_type == "subscription_started":
        plan = md.get("plan_id") or md.get("plan")
        return "first_paid_at" if plan in PAID_NO_TRIAL_SKUS else "trial_started_at"
    if event_type == "subscription_renewed":  # first renewal after a trial = first paid period
        return "first_paid_at"
    return None


async def stamp_milestone(db, user_id: str, field: str, ts: Optional[datetime] = None, extra: Optional[dict] = None) -> bool:
    """Set users.milestones.<field> only if it is not set yet. Returns True when this call stamped it."""
    if field not in MILESTONE_FIELDS:
        return False
    try:
        oid = ObjectId(user_id)
    except Exception:
        return False
    ts = ts or datetime.now(timezone.utc)
    update: Dict[str, Any] = {f"milestones.{field}": ts}
    for k, v in (extra or {}).items():
        update[f"milestones.{k}"] = v
    try:
        res = await db.users.update_one({"_id": oid, f"milestones.{field}": {"$exists": False}}, {"$set": update})
        return bool(getattr(res, "modified_count", 0))
    except Exception as e:  # never let a milestone write break event tracking
        logger.warning(f"milestone {field} for {user_id} failed: {e}")
        return False


async def stamp_milestones(db, user_id: str, event_type: str, md: Optional[dict], ts: Optional[datetime] = None) -> None:
    field = milestone_for_event(event_type, md)
    if field:
        await stamp_milestone(db, user_id, field, ts)


async def track_server_event(db, user_id: str, event_type: str, md: Optional[dict] = None) -> None:
    """Server-originated V3 event: same pipeline as POST /api/analytics/track (incl. milestones)."""
    try:
        from user_analytics import track_user_event
        payload = {"source": "v3", "app_line": "v3", "origin": "server", **(md or {})}
        await track_user_event(db, user_id, event_type, payload)
    except Exception as e:
        logger.error(f"server event {event_type} for {user_id} failed: {e}")


# ───────────────────────────────────────────── workout #2 start gate

def classify_start_attempt(milestones: Optional[dict], key: Optional[str], allowed: bool, outcome: Optional[str],
                           workouts_completed: int = 0, legacy: bool = False) -> Tuple[str, Dict[str, Any]]:
    """How a start attempt relates to the user's history.

    Returns (attempt, milestone updates):
      first         first workout this account has ever started (stamps first_workout_started_at + its key)
      repeat_first  the same first workout started again (reopen / restart)
      second_plus   any other workout after the first one (stamps second_workout_attempted_at once)
      legacy        a V2 build with no workout id
    A user with completed workouts but no milestone yet (pre-backfill V2 history) is never treated as a first start.
    """
    ms = milestones or {}
    if legacy:
        return "legacy", {}
    first_at = ms.get("first_workout_started_at")
    first_key = ms.get("first_workout_started_key")
    if not first_at and not workouts_completed:
        return ("first", {"first_workout_started_at": True, "first_workout_started_key": key}) if allowed else ("first", {})
    if outcome == "same_workout" or (first_key and key == first_key):
        return "repeat_first", {}
    return "second_plus", {"second_workout_attempted_at": True}


async def record_start_gate(db, user: dict, user_id: str, status_code: int, payload: dict,
                            workout_id: Optional[str], source: Optional[str]) -> None:
    """Called by POST /api/workouts/start after the gate decided. Writes milestones + workout_start_gate."""
    if status_code not in (200, 402):
        return
    try:
        allowed = status_code == 200
        detail = (payload if allowed else payload.get("detail")) or {}
        if not isinstance(detail, dict):
            detail = {}
        outcome = detail.get("outcome")
        legacy = not workout_id
        key = f"{source or 'v3'}:{workout_id}" if workout_id else None
        attempt, updates = classify_start_attempt(
            user.get("milestones"), key, allowed, outcome, int(user.get("workouts_count") or 0), legacy,
        )
        now = datetime.now(timezone.utc)
        if updates.get("first_workout_started_at"):
            await stamp_milestone(db, user_id, "first_workout_started_at", now, {"first_workout_started_key": key})
        if updates.get("second_workout_attempted_at"):
            await stamp_milestone(db, user_id, "second_workout_attempted_at", now)
        await track_server_event(db, user_id, "workout_start_gate", {
            "allowed": allowed,
            "outcome": outcome,
            "reason": detail.get("reason"),
            "has_full_access": detail.get("has_full_access"),
            "free_workouts_remaining": detail.get("free_workouts_remaining"),
            "attempt": attempt,
            "is_first_ever_start": attempt == "first",
            "workouts_completed_before": int(user.get("workouts_count") or 0),
            "workout_id": workout_id,
            "start_source": source or ("legacy" if legacy else "v3"),
            "is_internal": bool(user.get("is_internal", False)),
            "is_comp": bool(user.get("is_comp", False)),
        })
    except Exception as e:
        logger.error(f"record_start_gate failed for {user_id}: {e}")


# ───────────────────────────────────────────── backfill

_BACKFILL_EVENTS = (
    "v3_training_profile_saved", "workout_generated", "v3_workout_generated", "workout_started",
    "workout_completed", "paywall_viewed", "purchase_completed",
    "subscription_started", "subscription_renewed",
)


async def backfill_milestones(db, dry_run: bool = False) -> Dict[str, int]:
    """Stamp missing milestones from history. Idempotent: an existing milestone is never moved."""
    firsts: Dict[Tuple[str, str], datetime] = {}
    cursor = db.user_events.find(
        {"event_type": {"$in": list(_BACKFILL_EVENTS)}, "user_id": {"$exists": True}},
        {"user_id": 1, "event_type": 1, "metadata": 1, "timestamp": 1},
    )
    async for ev in cursor:
        uid, ts = ev.get("user_id"), ev.get("timestamp")
        if not uid or not ts or str(uid).startswith("guest_"):
            continue
        field = milestone_for_event(ev.get("event_type"), ev.get("metadata"))
        if not field:
            continue
        k = (str(uid), field)
        if k not in firsts or ts < firsts[k]:
            firsts[k] = ts
    # V3 onboarding also lives on the training profile itself.
    async for u in db.users.find({"training_profile.completed_at": {"$exists": True}}, {"training_profile.completed_at": 1}):
        k = (str(u["_id"]), "v3_onboarded_at")
        ts = (u.get("training_profile") or {}).get("completed_at")
        if ts and (k not in firsts or ts < firsts[k]):
            firsts[k] = ts
    # second workout attempt: a second distinct workout start in history
    starts: Dict[str, list] = {}
    async for ev in db.user_events.find({"event_type": "workout_started"}, {"user_id": 1, "timestamp": 1}).sort("timestamp", 1):
        uid = str(ev.get("user_id") or "")
        if uid and not uid.startswith("guest_") and ev.get("timestamp"):
            starts.setdefault(uid, []).append(ev["timestamp"])
    for uid, ts_list in starts.items():
        if len(ts_list) >= 2:
            firsts.setdefault((uid, "second_workout_attempted_at"), ts_list[1])

    counts: Dict[str, int] = {f: 0 for f in MILESTONE_FIELDS}
    for (uid, field), ts in firsts.items():
        if dry_run:
            counts[field] += 1
        elif await stamp_milestone(db, uid, field, ts):
            counts[field] += 1
    return counts


__all__ = [
    "MILESTONE_FIELDS", "milestone_for_event", "stamp_milestone", "stamp_milestones", "track_server_event",
    "classify_start_attempt", "record_start_gate", "backfill_milestones",
]
