"""
Acquisition funnel — Downloads → Signups → Free trials → Paid subscribers.

Stitches the store download numbers (store_metrics, iOS + Android) on top of the
in-app signup/trial/purchase events so you can see the whole journey and where it
leaks, plus the split between "trial → paid" and "straight to paid".

Data sources
------------
Downloads : store_metrics collection (App Store Connect + Google Play).  Anonymous
            aggregate counts — they can't be tied to a user, so the
            Download→Signup step is a rate, not a same-user cohort.
Signups   : users.created_at within the range (internal accounts excluded).
Trials    : distinct users firing `trial_started` in the range.
Paid      : distinct users firing a real `purchase_completed` (is_trial != true,
            is_comp != true) in the range.

Trial-vs-direct split: of the paid users, those who have EVER started a trial are
counted as trial→paid; the rest as straight-to-paid.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Set

from motor.motor_asyncio import AsyncIOMotorDatabase

from admin_analytics import get_internal_user_ids
import store_metrics

logger = logging.getLogger(__name__)

PAID_MATCH_EXTRA = {"metadata.is_trial": {"$ne": True}, "metadata.is_comp": {"$ne": True}}


def _pct(numer: float, denom: float) -> float:
    return round(numer / denom * 100, 1) if denom else 0.0


async def _distinct_users(db, event_type, start, end, excluded: Set[str], extra: Dict[str, Any] | None = None) -> Set[str]:
    q: Dict[str, Any] = {"event_type": event_type, "timestamp": {"$gte": start, "$lte": end}}
    if extra:
        q.update(extra)
    if excluded:
        q["user_id"] = {"$nin": list(excluded)}
    users = await db.user_events.distinct("user_id", q)
    return {u for u in users if u and u not in excluded}


async def get_acquisition_funnel(
    db: AsyncIOMotorDatabase,
    start_date: datetime,
    end_date: datetime,
    include_internal: bool = False,
) -> Dict[str, Any]:
    """Build the Download → Signup → Trial → Paid funnel for the date range."""
    try:
        excluded: Set[str] = set()
        if not include_internal:
            excluded = await get_internal_user_ids(db)

        # ── Top of funnel: downloads (stored, iOS + Android) ────────────────
        downloads = await store_metrics.get_downloads_in_range(db, start_date, end_date)
        downloads_total = downloads["total"]

        # ── Signups (users created in range) ────────────────────────────────
        signup_filter: Dict[str, Any] = {"created_at": {"$gte": start_date, "$lte": end_date}}
        if not include_internal:
            signup_filter["is_internal"] = {"$ne": True}
        signups = await db.users.count_documents(signup_filter)

        # ── Trials + paid (distinct users, from events) ─────────────────────
        trial_users = await _distinct_users(db, "trial_started", start_date, end_date, excluded)
        paid_users = await _distinct_users(db, "purchase_completed", start_date, end_date, excluded, PAID_MATCH_EXTRA)

        # ── Trial-vs-direct split: has the paid user ever started a trial? ──
        ever_trial = set(await db.user_events.distinct("user_id", {"event_type": "trial_started"}))
        trial_converted = {u for u in paid_users if u in ever_trial}
        direct_paid = paid_users - trial_converted

        trials_n, paid_n = len(trial_users), len(paid_users)
        tconv_n, direct_n = len(trial_converted), len(direct_paid)

        stages: List[Dict[str, Any]] = [
            {"key": "downloads", "label": "Downloads", "value": downloads_total,
             "from_prev_pct": 100.0, "pct_of_top": 100.0},
            {"key": "signups", "label": "Signups", "value": signups,
             "from_prev_pct": _pct(signups, downloads_total),
             "pct_of_top": _pct(signups, downloads_total)},
            {"key": "trials", "label": "Free trials", "value": trials_n,
             "from_prev_pct": _pct(trials_n, signups),
             "pct_of_top": _pct(trials_n, downloads_total)},
            {"key": "paid", "label": "Paid subscribers", "value": paid_n,
             "from_prev_pct": _pct(paid_n, trials_n),
             "pct_of_top": _pct(paid_n, downloads_total)},
        ]

        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "stages": stages,
            "downloads": downloads,  # breakdown + series + config/status
            "conversions": {
                "download_to_signup": _pct(signups, downloads_total),
                "signup_to_trial": _pct(trials_n, signups),
                "trial_to_paid": _pct(tconv_n, trials_n),      # of trials, how many became paid
                "signup_to_paid": _pct(paid_n, signups),
                "download_to_paid": _pct(paid_n, downloads_total),
            },
            "paid_split": {
                "trial_converted": tconv_n,
                "direct": direct_n,
                "trial_converted_pct": _pct(tconv_n, paid_n),
                "direct_pct": _pct(direct_n, paid_n),
            },
            "counts": {"downloads": downloads_total, "signups": signups, "trials": trials_n, "paid": paid_n},
            "notes": [
                "Downloads are anonymous store aggregates, so Download→Signup is a rate, not a same-user cohort.",
                "App Store day boundaries (Apple/Google timezones) differ slightly from in-app UTC signup timestamps.",
                "Trial→paid counts paid users who ever started a trial; the rest are straight-to-paid.",
            ],
        }
    except Exception as e:
        logger.error(f"Error building acquisition funnel: {e}")
        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "stages": [],
            "downloads": {"total": 0, "by_platform": {}, "series": [], "configured": {}, "status": {}},
            "conversions": {},
            "paid_split": {},
            "counts": {},
            "error": str(e),
        }
