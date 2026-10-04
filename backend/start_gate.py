"""
Workout START gate — one free workout per ISO week, paywall on STARTING a second one.

POST /api/workouts/start (server.py) delegates here. The decision itself is
the pure `entitlement.start_decision`; this module adds the Mongo side:

  * resolves the workout key ("v3:<workout_id>", or the legacy V2 key when the
    caller sends no workout id),
  * looks up whether a previously claimed V3 workout was completed (that ends
    the switch-grace window),
  * writes / moves the `first_free_workout` claim ATOMICALLY, so two concurrent
    starts of two different workouts cannot both become "the free one".

Nothing here is called by generation, preview, swap, cart edits, browsing or
session resume: only by an explicit Start.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Callable

from entitlement import (
    FIRST_FREE_WORKOUT_FIELD,
    LEGACY_KEY,
    current_free_period_key,
    first_free_workout,
    first_workout_claim_doc,
    free_period_resets_at,
    has_full_access,
    start_decision,
)


def workout_key(workout_id: str | None, source: str | None) -> str | None:
    wid = (workout_id or "").strip()
    if not wid:
        return None
    src = (source or "v3").strip().lower() or "v3"
    return f"{src}:{wid}"


async def _claimed_completed(db, user_id: str, claim: dict | None) -> bool:
    """True when the claimed first workout is a V3 workout that was completed."""
    if not claim:
        return False
    key = str(claim.get("key") or "")
    if not key.startswith("v3:"):
        return False
    try:
        doc = await db.v3_workouts.find_one({"_id": key[3:], "user_id": user_id}, {"status": 1})
    except Exception:
        return False
    return bool(doc and doc.get("status") == "completed")


async def gate_workout_start(
    db,
    user_filter: dict,
    user_id: str,
    load_user: Callable[[], Any],
    is_admin: bool,
    workout_id: str | None,
    source: str | None,
    now: datetime | None = None,
) -> tuple[int, dict]:
    """Returns (http_status, body). 200 = may start, 402 = paywall."""
    n = now or datetime.now(timezone.utc)
    key = workout_key(workout_id, source)
    src = (source or ("v3" if key else "v2")).lower()

    for _attempt in range(3):
        user = await load_user()
        if not user:
            return 404, {"detail": "User not found"}
        claim = first_free_workout(user, n)
        completed = await _claimed_completed(db, user_id, claim)
        allowed, outcome = start_decision(user, is_admin, key, claimed_completed=completed, now=n)
        access, reason = has_full_access(user, is_admin)

        if allowed and claim is None:
            # first start this week (entitled or not): claim it, atomically. `$ne` on the period also matches a
            # missing claim, so this covers "never claimed" and "claimed in an earlier week".
            res = await db.users.update_one(
                {**user_filter, f"{FIRST_FREE_WORKOUT_FIELD}.period": {"$ne": current_free_period_key(n)}},
                {"$set": {FIRST_FREE_WORKOUT_FIELD: first_workout_claim_doc(key, src, n)}},
            )
            if getattr(res, "modified_count", 0) == 0 and getattr(res, "matched_count", 0) == 0:
                continue  # someone else claimed concurrently: decide again
        elif allowed and outcome == "switch_grace":
            res = await db.users.update_one(
                {**user_filter, f"{FIRST_FREE_WORKOUT_FIELD}.key": claim.get("key")},
                {"$set": {FIRST_FREE_WORKOUT_FIELD: first_workout_claim_doc(
                    key, src, n, moved_count=int(claim.get("moved_count") or 0) + 1)}},
            )
            if getattr(res, "matched_count", 0) == 0:
                continue

        if not allowed:
            return 402, {"detail": {
                "error": "payment_required",
                "trigger": "start_workout_after_free_session",
                "outcome": outcome,
                "has_full_access": access,
                "reason": reason.value,
                "free_workouts_remaining": 0,
                "free_workouts_reset_at": free_period_resets_at(n).isoformat(),
                "first_workout_key": (claim or {}).get("key"),
            }}

        fresh = await load_user() or user
        return 200, {
            "ok": True,
            "can_start": True,
            "outcome": outcome,
            "has_full_access": access,
            "reason": reason.value,
            "free_workouts_remaining": None if access else (0 if first_free_workout(fresh, n) else 1),
            "free_workouts_reset_at": None if access else free_period_resets_at(n).isoformat(),
            "first_workout_key": (first_free_workout(fresh, n) or {}).get("key"),
        }
    # contention never settled: fail closed only for the paywall case, which we cannot prove; allow
    return 200, {"ok": True, "can_start": True, "outcome": "contention"}


__all__ = ["gate_workout_start", "workout_key", "LEGACY_KEY"]
