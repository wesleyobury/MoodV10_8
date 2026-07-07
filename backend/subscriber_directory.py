"""
Subscriber Directory (admin)
============================

A named, filterable list of everyone who has ever entered the subscription
system — active payers, free-trial users, comped accounts, and lapsed/churned
subscribers — with the money each one represents.

This is the "who paid" companion to the aggregate Monetization dashboard
(which only shows counts). It reads the same source of truth the app uses for
entitlement:

* `entitlement.has_full_access` / status semantics — active | in_trial | lapsed
* `product_pricing` — SKU → USD list price, net (post-commission), and MRR

Derived status per user (what the row/filters use):
    active  → status == "active"  and not past expiration  (real paying customer)
    trial   → status == "in_trial" and not past expiration  (free trial, $0 so far)
    comp    → is_comp == True                               (admin-granted free)
    lapsed  → had a subscription but no longer entitled     (churned / expired)

Users who never subscribed and aren't comped are excluded.
Internal/staff users (is_internal) are excluded unless include_internal=True.
"""
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorDatabase
import logging

from entitlement import _parse_dt
from product_pricing import (
    price_for_plan,
    net_price_for_plan,
    monthly_price_for_plan,
    PRODUCT_ANNUAL,
    PRODUCT_ANNUAL_PAID,
    PRODUCT_MONTHLY,
    PRODUCT_MONTHLY_PAID,
    PRODUCT_FOUNDING_ANNUAL,
)

logger = logging.getLogger(__name__)


def plan_for_product(product_id: Optional[str]) -> Optional[str]:
    """SKU → human plan name. Mirrors subscriptions.plan_for_product without the import."""
    pid = (product_id or "").strip()
    if pid in (PRODUCT_ANNUAL, PRODUCT_ANNUAL_PAID):
        return "annual"
    if pid in (PRODUCT_MONTHLY, PRODUCT_MONTHLY_PAID):
        return "monthly"
    if pid == PRODUCT_FOUNDING_ANNUAL:
        return "founding_annual"
    return None

# Derived statuses that mean "currently has full access".
ENTITLED_STATUSES = ("active", "trial", "comp")


def _iso(value) -> Optional[str]:
    """Coerce a datetime or ISO string to an ISO string, else None."""
    if not value:
        return None
    if isinstance(value, datetime):
        dt = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
        return dt.isoformat()
    if isinstance(value, str):
        return value
    return None


def _classify(user: Dict[str, Any]) -> Optional[str]:
    """Map a raw user doc to a derived subscriber status (or None if never a subscriber)."""
    sub = user.get("subscription") or {}
    status = sub.get("status")
    exp = _parse_dt(sub.get("expiration_date"))
    now = datetime.now(timezone.utc)
    in_window = (exp is None) or (now < exp)

    # Comp accounts (admin-granted lifetime free access) take precedence.
    if user.get("is_comp"):
        return "comp"
    if status == "active" and in_window:
        return "active"
    if status == "in_trial" and in_window:
        return "trial"
    # Had subscription history but no longer entitled → churned/expired.
    if sub.get("product_id") or status:
        return "lapsed"
    return None


def _build_row(user: Dict[str, Any], derived: str) -> Dict[str, Any]:
    sub = user.get("subscription") or {}
    product_id = sub.get("product_id")
    # Only real paying customers contribute recurring revenue.
    mrr = monthly_price_for_plan(product_id) if derived == "active" else 0.0
    return {
        "user_id": str(user["_id"]),
        "username": user.get("username", ""),
        "email": user.get("email", ""),
        "avatar": user.get("avatar") or user.get("avatar_url") or "",
        "status": derived,                         # active | trial | comp | lapsed
        "raw_status": sub.get("status"),           # underlying subscription.status
        "plan": sub.get("plan") or plan_for_product(product_id or ""),
        "product_id": product_id,
        "price_usd": round(price_for_plan(product_id), 2),
        "net_price_usd": round(net_price_for_plan(product_id), 2),
        "mrr_usd": round(mrr, 2),
        "purchase_date": _iso(sub.get("purchase_date")),
        "expiration_date": _iso(sub.get("expiration_date")),
        "last_validated_at": _iso(sub.get("last_validated_at")),
        "founding_member": bool(user.get("founding_member")) or bool(user.get("founding_pricing_claimed")),
        "is_comp": bool(user.get("is_comp")),
        "platform": sub.get("platform") or "—",
        "created_at": _iso(user.get("created_at")),
    }


def _summarize(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    active = [r for r in rows if r["status"] == "active"]
    summary = {
        "total": len(rows),
        "active": len(active),
        "trial": sum(1 for r in rows if r["status"] == "trial"),
        "comp": sum(1 for r in rows if r["status"] == "comp"),
        "lapsed": sum(1 for r in rows if r["status"] == "lapsed"),
        "founding_members": sum(1 for r in rows if r["founding_member"]),
        "active_annual": sum(1 for r in active if r["plan"] in ("annual", "founding_annual")),
        "active_monthly": sum(1 for r in active if r["plan"] == "monthly"),
        # Recurring revenue from real payers (trials/comps excluded).
        "mrr_usd": round(sum(r["mrr_usd"] for r in active), 2),
        "net_mrr_usd": round(sum(r["mrr_usd"] for r in active) * (1 - 0.15), 2),
    }
    return summary


async def get_subscribers_directory(
    db: AsyncIOMotorDatabase,
    status: str = "all",
    limit: int = 200,
    skip: int = 0,
    include_internal: bool = False,
    search: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Return a paginated, named list of subscribers plus a summary.

    Args:
        status: "all" | "active" | "trial" | "comp" | "lapsed" (filters the rows,
                but the summary always reflects the full universe).
        limit / skip: pagination over the (filtered) rows.
        include_internal: include is_internal staff accounts (default False).
        search: optional case-insensitive match on username or email.
    """
    try:
        # Internal/staff exclusion set.
        excluded_ids = set()
        if not include_internal:
            internal = await db.users.find({"is_internal": True}, {"_id": 1}).to_list(5000)
            excluded_ids = {str(u["_id"]) for u in internal}

        # Universe: anyone with subscription history or a comp grant.
        universe = {
            "$or": [
                {"subscription.status": {"$exists": True, "$ne": None}},
                {"subscription.product_id": {"$exists": True, "$ne": None}},
                {"is_comp": True},
            ]
        }
        if search and len(search) >= 2:
            universe = {
                "$and": [
                    universe,
                    {
                        "$or": [
                            {"username": {"$regex": search, "$options": "i"}},
                            {"email": {"$regex": search, "$options": "i"}},
                        ]
                    },
                ]
            }

        projection = {
            "subscription": 1,
            "username": 1,
            "email": 1,
            "avatar": 1,
            "avatar_url": 1,
            "created_at": 1,
            "is_comp": 1,
            "is_internal": 1,
            "founding_member": 1,
            "founding_pricing_claimed": 1,
        }

        users = await db.users.find(universe, projection).to_list(length=20000)

        rows: List[Dict[str, Any]] = []
        for user in users:
            if str(user["_id"]) in excluded_ids:
                continue
            derived = _classify(user)
            if derived is None:
                continue
            rows.append(_build_row(user, derived))

        # Summary reflects the whole universe (all statuses), before pagination.
        summary = _summarize(rows)

        # Apply the status filter for the returned page.
        if status and status != "all":
            rows = [r for r in rows if r["status"] == status]

        # Most recently purchased first; rows without a date sink to the bottom.
        rows.sort(key=lambda r: r.get("purchase_date") or "", reverse=True)

        total_filtered = len(rows)
        page = rows[skip : skip + limit]

        return {
            "summary": summary,
            "subscribers": page,
            "total": total_filtered,
            "status": status,
            "limit": limit,
            "skip": skip,
        }

    except Exception as e:
        logger.error(f"Error building subscriber directory: {e}")
        return {
            "summary": _summarize([]),
            "subscribers": [],
            "total": 0,
            "status": status,
            "limit": limit,
            "skip": skip,
            "error": str(e),
        }
