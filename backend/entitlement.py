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


# ── Weekly free workout, gated at START (Oct 2026, V3 launch) ─────────────
# Product rule: each ISO week (Monday 00:00 UTC reset, same window as above) a
# non-entitled user gets ONE free workout, and it is fully usable. STARTING a
# second, different workout in the same week requires full access (subscription /
# trial / comp / admin). For a new user that means: workout #1 free, paywall on
# starting workout #2; next week they get one more free workout.
#
# What counts as a start: an explicit start of a specific workout, identified by
# a stable key ("v3:<workout_id>"). The week's free start is CLAIMED on the user
# doc ({key, period, ...}) the first time a start is allowed that week, so it is
# server-side and survives reinstall / relogin. Re-starting the SAME key in the
# same week (reopening, resuming, relaunching, restarting after an accidental
# exit) is always allowed. Generating, previewing, swapping, editing the cart and
# browsing never call the gate. A claim from an earlier week is simply stale.
#
# Grace: a claimed-but-not-completed workout can be swapped for a different one
# within FIRST_WORKOUT_SWITCH_GRACE_SEC of the claim (tapped Start on the wrong
# workout, ended it right away, built another).
FIRST_FREE_WORKOUT_FIELD = "first_free_workout"   # {key, period, source, started_at, moved_count}
FIRST_WORKOUT_SWITCH_GRACE_SEC = 15 * 60
# Key-less starts come only from the legacy V2 players, which call the gate on
# Start AND on Complete with no workout identity. They share one claim key and are
# treated as the same session for this long after the claim.
LEGACY_KEY = "v2:legacy"
LEGACY_SESSION_WINDOW_SEC = 4 * 60 * 60


def first_free_workout(user: dict, now: datetime | None = None) -> dict | None:
    """This week's free-workout claim, or None (never claimed, or claimed in an earlier week)."""
    claim = (user or {}).get(FIRST_FREE_WORKOUT_FIELD)
    if not (isinstance(claim, dict) and claim.get("key")):
        return None
    if claim.get("period") != current_free_period_key(now):
        return None
    return claim


def start_decision(
    user: dict,
    is_admin: bool,
    key: str | None,
    *,
    claimed_completed: bool = False,
    now: datetime | None = None,
) -> tuple[bool, str]:
    """Pure decision for "may this user START this workout?".

    Returns (allowed, outcome). outcome is one of:
      entitled         full access; this week's first start is still recorded
      first_workout    no claim this week: this start becomes the week's free workout
      same_workout     re-start of this week's claimed workout (reopen / resume / restart)
      switch_grace     claim moves to this workout (old one never completed, <15 min)
      second_workout   blocked: a second workout this week without access
    """
    n = now or datetime.now(timezone.utc)
    k = key or LEGACY_KEY
    access, _ = has_full_access(user, is_admin)
    claim = first_free_workout(user, n)
    if access:
        return True, "entitled"
    if claim is None:
        return True, "first_workout"
    if claim.get("key") == k:
        if k != LEGACY_KEY:
            return True, "same_workout"
        started = _parse_dt(claim.get("started_at"))
        if started is not None and (n - started).total_seconds() <= LEGACY_SESSION_WINDOW_SEC:
            return True, "same_workout"
        return False, "second_workout"
    started = _parse_dt(claim.get("started_at"))
    if (
        not claimed_completed
        and started is not None
        and (n - started).total_seconds() <= FIRST_WORKOUT_SWITCH_GRACE_SEC
    ):
        return True, "switch_grace"
    return False, "second_workout"


def first_workout_claim_doc(key: str | None, source: str, now: datetime | None = None, moved_count: int = 0) -> dict:
    n = now or datetime.now(timezone.utc)
    return {
        "key": key or LEGACY_KEY,
        "period": current_free_period_key(n),
        "source": source,
        "started_at": n,
        "moved_count": moved_count,
    }


def can_start_workout(user: dict, is_admin: bool = False) -> bool:
    """Coarse start check without a workout identity: entitled, or this week's
    free workout has not been claimed yet. The keyed gate (start_decision)
    is what POST /api/workouts/start enforces."""
    has_access, _ = has_full_access(user, is_admin)
    if has_access:
        return True
    return first_free_workout(user) is None


def free_workouts_remaining(user: dict) -> int:
    """1 until this week's free workout has been started, then 0 until Monday."""
    return 0 if first_free_workout(user) is not None else 1


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
