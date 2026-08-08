"""
MOOD V2 — Server-side entitlement (Phase 1, Backend Foundation).

THE single source of truth for "does this user have full access?".

Design notes
------------
* Operates on the raw Mongo user *dict* (this codebase stores/queries users
  as dicts, not Pydantic models).
* The admin check lives in server.py (`is_admin_effective_sync`). To keep this
  module dependency-free (server.py imports this file, so this file must NOT
  import server.py — circular), callers pass the precomputed `is_admin` bool.
* V2 semantic shift (locked decision): `founding_member = True` is an
  *eligibility flag for the founding discount*, NOT a free-access grant.
  has_full_access() therefore deliberately ignores `founding_member`.
* The ONLY entitlement paths in V2 are: admin/internal, comp account,
  active paid subscription, active free trial.
"""

from datetime import date, datetime, timedelta, timezone
from enum import Enum


class EntitlementReason(str, Enum):
    SUBSCRIPTION = "subscription"
    TRIAL = "trial"
    COMP = "comp"
    ADMIN = "admin"
    FOUNDING_LIFETIME = "founding_lifetime"  # reserved for future, not used in v2
    NONE = "none"


def _parse_dt(value):
    """Coerce a datetime or ISO string into a tz-aware datetime, else None."""
    if not value:
        return None
    if isinstance(value, datetime):
        return value if value.tzinfo else value.replace(tzinfo=timezone.utc)
    if isinstance(value, str):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except Exception:
            return None
    return None


def has_full_access(user: dict, is_admin: bool = False) -> tuple[bool, EntitlementReason]:
    """
    THE source of truth for entitlement.

    Returns (bool, EntitlementReason) so callers can log analytics attribution.

    NOTE: founding_member is intentionally NOT an access path in V2.
    """
    if not user:
        return False, EntitlementReason.NONE

    # Admin / internal users always pass.
    if is_admin or user.get("is_internal"):
        return True, EntitlementReason.ADMIN

    # Comp accounts (admin-granted lifetime free access).
    if user.get("is_comp"):
        return True, EntitlementReason.COMP

    # Subscription state is stored under the `subscription` sub-document.
    sub = user.get("subscription") or {}
    status = sub.get("status")
    exp = _parse_dt(sub.get("expiration_date"))
    now = datetime.now(timezone.utc)

    # Active paid subscription.
    if status == "active":
        if exp is None or now < exp:
            return True, EntitlementReason.SUBSCRIPTION

    # Active free trial.
    if status == "in_trial":
        if exp is None or now < exp:
            return True, EntitlementReason.TRIAL

    return False, EntitlementReason.NONE


# ── Free workout allowance for non-entitled users ─────────────────────────
# V2.1 (2026-07-29): the allowance is PER ISO WEEK, not per lifetime.
#
# Why this changed: `free_workouts_used` was a monotonic counter with no reset
# anywhere in the codebase, so the free tier was "one workout, ever". A habit
# app cannot produce a habit under that rule — a non-converting user is
# permanently unable to use the core verb after day 1, which is a structural
# cap on D7/D28 retention. Weekly reset preserves conversion pressure (they
# still hit a wall on workout #2) while keeping the return visit alive.
#
# Migration note: existing users carry `free_workouts_used >= 1` and NO
# `free_workouts_period` field. Because the period key won't match, they are
# treated as having 0 used this week — i.e. every currently locked-out free
# user is unlocked the moment this deploys. That is intended.
FREE_WORKOUT_ALLOWANCE = 1

# Mongo field holding the ISO-week key the counter belongs to, e.g. "2026-W31".
FREE_WORKOUT_PERIOD_FIELD = "free_workouts_period"


def current_free_period_key(now: datetime | None = None) -> str:
    """ISO year-week key for the allowance window, e.g. "2026-W31".

    Weeks are ISO (Monday-anchored) in UTC. Using the ISO calendar rather than
    a rolling 7-day window means the reset is predictable — the user can be
    told "resets Monday" — and it matches how the retention cohorts are
    bucketed in admin_analytics.py.
    """
    d = (now or datetime.now(timezone.utc)).date()
    iso_year, iso_week, _ = d.isocalendar()
    return f"{iso_year}-W{iso_week:02d}"


def free_period_resets_at(now: datetime | None = None) -> datetime:
    """UTC datetime of the next allowance reset (upcoming Monday 00:00 UTC).

    Exposed to the client so the paywall can say when the next free workout
    unlocks instead of reading as a permanent wall.
    """
    n = now or datetime.now(timezone.utc)
    # isoweekday(): Monday == 1 ... Sunday == 7. Days until next Monday.
    days_ahead = 8 - n.isoweekday()
    if days_ahead > 7:
        days_ahead -= 7
    next_monday = (n + timedelta(days=days_ahead)).date()
    return datetime(next_monday.year, next_monday.month, next_monday.day, tzinfo=timezone.utc)


def free_workouts_used_this_period(user: dict, now: datetime | None = None) -> int:
    """Free workouts consumed inside the CURRENT allowance window.

    A stored counter from an earlier week (or a legacy row with no period
    field at all) reads as 0 — that is the reset. Nothing is written here;
    the counter is rewritten lazily on the next completion.
    """
    if not user:
        return 0
    stored_period = user.get(FREE_WORKOUT_PERIOD_FIELD) or ""
    if stored_period != current_free_period_key(now):
        return 0
    return int(user.get("free_workouts_used", 0) or 0)


def consume_free_workout_update(user: dict, now: datetime | None = None) -> dict:
    """Mongo update doc that books one free workout against the current week.

    Increments inside the same week; resets to 1 when the stored period is
    stale. Callers already hold the user dict, so this stays a pure function.
    """
    period = current_free_period_key(now)
    if (user.get(FREE_WORKOUT_PERIOD_FIELD) or "") == period:
        return {"$inc": {"free_workouts_used": 1}}
    return {"$set": {"free_workouts_used": 1, FREE_WORKOUT_PERIOD_FIELD: period}}


def can_generate_workout(user: dict, is_admin: bool = False) -> bool:
    """
    Workout *generation* gate.

    Product decision (2026-05-14, reaffirmed in V2 spec Phase 4.5):
    generation is UNLIMITED for everyone — the cap is on STARTING workouts,
    not generating/previewing them. This helper is kept (and returns the
    spec-defined free-allowance logic) so a generation cap can be reinstated
    later without touching call sites, but it is NOT currently wired to the
    generation endpoint.
    """
    has_access, _ = has_full_access(user, is_admin)
    if has_access:
        return True
    return free_workouts_used_this_period(user) < FREE_WORKOUT_ALLOWANCE


def can_start_workout(user: dict, is_admin: bool = False) -> bool:
    """
    Workout *start* gate — the load-bearing paywall enforcement point.

    Full-access users: unlimited. Non-entitled users: FREE_WORKOUT_ALLOWANCE
    per ISO week, then blocked (Hard Paywall #3) until the week rolls over.
    The counter is booked server-side on workout completion via
    `consume_free_workout_update`.
    """
    has_access, _ = has_full_access(user, is_admin)
    if has_access:
        return True
    return free_workouts_used_this_period(user) < FREE_WORKOUT_ALLOWANCE


def free_workouts_remaining(user: dict) -> int:
    """Remaining free workouts in the current week (never negative)."""
    return max(0, FREE_WORKOUT_ALLOWANCE - free_workouts_used_this_period(user))


def subscription_mirror_for_client(user: dict) -> dict:
    """
    Persisted subscription doc mirrored for the client (same self-correction
    as GET /auth/me). Keeps entitlement + status in one server response.
    """
    sub = user.get("subscription") or {}
    raw_status = sub.get("status")
    expiration_iso = sub.get("expiration_date")
    if raw_status in ("active", "in_trial") and expiration_iso:
        exp = _parse_dt(expiration_iso)
        if exp is not None and exp < datetime.now(timezone.utc):
            raw_status = "lapsed"
    return {
        "subscription_status": raw_status,
        "subscription_plan": sub.get("plan"),
        "subscription_product_id": sub.get("product_id"),
        "subscription_expiration_date": expiration_iso,
    }
