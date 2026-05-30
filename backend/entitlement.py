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

from datetime import datetime, timezone
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


# Free workout allowance for non-entitled users.
FREE_WORKOUT_ALLOWANCE = 1


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
    return int(user.get("free_workouts_used", 0) or 0) < FREE_WORKOUT_ALLOWANCE


def can_start_workout(user: dict, is_admin: bool = False) -> bool:
    """
    Workout *start* gate — the load-bearing paywall enforcement point.

    Full-access users: unlimited. Non-entitled users: first
    FREE_WORKOUT_ALLOWANCE free, then blocked (Hard Paywall #3).
    `free_workouts_used` is incremented server-side on workout completion.
    """
    has_access, _ = has_full_access(user, is_admin)
    if has_access:
        return True
    return int(user.get("free_workouts_used", 0) or 0) < FREE_WORKOUT_ALLOWANCE


def free_workouts_remaining(user: dict) -> int:
    """Remaining free workouts for a non-entitled user (never negative)."""
    return max(0, FREE_WORKOUT_ALLOWANCE - int(user.get("free_workouts_used", 0) or 0))
