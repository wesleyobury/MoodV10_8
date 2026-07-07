"""
Admin Analytics Module
Advanced analytics endpoints for the admin panel including:
- Funnel analysis
- Retention cohorts
- User search and timeline

All analytics exclude internal users (is_internal=true) by default.
Use include_internal=true to include them.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Set
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import logging
from collections import defaultdict

from product_pricing import (
    price_for_plan,
    monthly_price_for_plan,
    STORE_COMMISSION_RATE,
)

logger = logging.getLogger(__name__)


async def get_internal_user_ids(db: AsyncIOMotorDatabase) -> Set[str]:
    """Get set of internal user IDs to exclude from analytics."""
    internal_users = await db.users.find(
        {"is_internal": True},
        {"_id": 1}
    ).to_list(1000)
    return {str(u["_id"]) for u in internal_users}


async def get_funnel_analysis(
    db: AsyncIOMotorDatabase,
    start_date: datetime,
    end_date: datetime,
    steps: Optional[List[str]] = None,
    include_users: bool = False,
    limit_users: int = 100,
    include_internal: bool = False
) -> Dict[str, Any]:
    """
    Get funnel analysis with conversion rates between steps.
    
    Default funnel steps:
    1. app_session_start (or app_opened)
    2. mood_selected (user engaged with workout builder)
    3. workout_started
    4. workout_completed
    5. post_created
    
    Returns conversion rates and optionally user lists for each step.
    Excludes internal users by default (include_internal=False).
    """
    try:
        # Get internal user IDs to exclude
        excluded_user_ids = set()
        if not include_internal:
            excluded_user_ids = await get_internal_user_ids(db)
        
        # Default funnel steps if not provided
        if not steps:
            steps = [
                "app_session_start",
                "mood_selected",
                "workout_started",
                "workout_completed",
                "post_created"
            ]
        
        # Base filter
        base_filter = {
            "timestamp": {"$gte": start_date, "$lte": end_date},
        }
        if excluded_user_ids:
            base_filter["user_id"] = {"$nin": list(excluded_user_ids)}
        
        funnel_data = []
        previous_users = None
        
        for i, step in enumerate(steps):
            # Get unique users who completed this step.
            # Tokens support an optional ":<n>" suffix to split events that
            # share one event_type by metadata.step — e.g.
            # "onboarding_step_completed:3" → onboarding funnel step 3.
            event_type = step
            meta_step = None
            if ":" in step:
                candidate, _, suffix = step.partition(":")
                try:
                    meta_step = int(suffix)
                    event_type = candidate
                except ValueError:
                    meta_step = None
            step_filter = {**base_filter, "event_type": event_type}
            if meta_step is not None:
                step_filter["metadata.step"] = meta_step
            
            # For registration, check users collection
            if step in ["user_registered", "signup"]:
                user_filter = {"created_at": {"$gte": start_date, "$lte": end_date}}
                if not include_internal:
                    user_filter["is_internal"] = {"$ne": True}
                users_cursor = db.users.find(user_filter, {"_id": 1})
                user_ids = set()
                async for user in users_cursor:
                    user_ids.add(str(user["_id"]))
            else:
                user_ids_list = await db.user_events.distinct("user_id", step_filter)
                user_ids = set(uid for uid in user_ids_list if uid not in excluded_user_ids)
            
            # Calculate conversion from previous step
            if i == 0:
                conversion_rate = 100.0
                dropoff_rate = 0.0
                converted_users = user_ids
                dropped_users = set()
            else:
                if previous_users and len(previous_users) > 0:
                    converted_users = user_ids & previous_users
                    dropped_users = previous_users - user_ids
                    conversion_rate = round((len(converted_users) / len(previous_users)) * 100, 2)
                    dropoff_rate = round(100 - conversion_rate, 2)
                else:
                    converted_users = set()
                    dropped_users = set()
                    conversion_rate = 0.0
                    dropoff_rate = 100.0
            
            step_data = {
                "step": step,
                "step_index": i,
                "step_label": _get_step_label(step),
                "unique_users": len(user_ids),
                "converted_users": len(converted_users) if i > 0 else len(user_ids),
                "dropped_users": len(dropped_users),
                "conversion_rate": conversion_rate,
                "dropoff_rate": dropoff_rate,
            }
            
            # Include user samples if requested
            if include_users:
                # Get user details for converted users (limited)
                converted_sample = list(converted_users)[:limit_users] if i > 0 else list(user_ids)[:limit_users]
                dropped_sample = list(dropped_users)[:limit_users]
                
                step_data["converted_user_ids"] = converted_sample
                step_data["dropped_user_ids"] = dropped_sample
            
            funnel_data.append(step_data)
            previous_users = user_ids
        
        # Calculate overall funnel conversion
        if funnel_data and len(funnel_data) >= 2:
            overall_conversion = round(
                (funnel_data[-1]["unique_users"] / funnel_data[0]["unique_users"]) * 100, 2
            ) if funnel_data[0]["unique_users"] > 0 else 0
        else:
            overall_conversion = 0
        
        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "steps": funnel_data,
            "overall_conversion": overall_conversion,
            "total_entry_users": funnel_data[0]["unique_users"] if funnel_data else 0,
            "total_completed_users": funnel_data[-1]["unique_users"] if funnel_data else 0,
        }
        
    except Exception as e:
        logger.error(f"Error getting funnel analysis: {e}")
        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "steps": [],
            "overall_conversion": 0,
            "error": str(e)
        }


# ── Onboarding funnel ────────────────────────────────────────────────────────
# Onboarding runs BEFORE signup, so most events are guest events keyed by
# device_id (no user_id). A participant is de-duplicated across the guest→auth
# boundary by coalescing user_id → merged_to_user_id → device_id.
_ONB_PARTICIPANT = {
    "$ifNull": ["$user_id", {"$ifNull": ["$merged_to_user_id", "$device_id"]}]
}

# Ordered funnel. Each entry: (event_type, meta_field, meta_value, label).
# meta_field disambiguates multi-purpose events (step number / reveal stage).
_ONB_STEPS = [
    ("onboarding_step_viewed", "metadata.step", 0, "Intro"),
    ("onboarding_step_viewed", "metadata.step", 1, "Mood"),
    ("onboarding_step_viewed", "metadata.step", 2, "Primary goal"),
    ("onboarding_step_viewed", "metadata.step", 3, "Fitness level"),
    ("onboarding_step_viewed", "metadata.step", 4, "Biggest barrier"),
    ("onboarding_step_viewed", "metadata.step", 5, "Workout length"),
    ("onboarding_step_viewed", "metadata.step", 6, "Social proof"),
    ("onboarding_step_viewed", "metadata.step", 7, "Name"),
    ("reveal_screen_viewed", "metadata.stage", "loading", "Reveal — building"),
    ("reveal_screen_viewed", "metadata.stage", "payoff", "Reveal — payoff"),
    ("onboarding_completed", None, None, "Onboarding complete"),
]

# Question steps that carry a breakdownable `answer`.
_ONB_QUESTIONS = [
    (1, "Mood"),
    (2, "Primary goal"),
    (3, "Fitness level"),
    (4, "Biggest barrier"),
    (5, "Workout length"),
]

_ONB_STEP_LABELS = {
    0: "Intro", 1: "Mood", 2: "Primary goal", 3: "Fitness level",
    4: "Biggest barrier", 5: "Workout length", 6: "Social proof", 7: "Name",
}


async def _onb_participants(db, base_match, event_type, meta_field=None, meta_value=None):
    """Distinct participant keys who fired `event_type` (with optional metadata)."""
    match = {**base_match, "event_type": event_type}
    if meta_field is not None:
        match[meta_field] = meta_value
    pipeline = [
        {"$match": match},
        {"$group": {"_id": _ONB_PARTICIPANT}},
    ]
    docs = await db.user_events.aggregate(pipeline).to_list(length=200000)
    return {d["_id"] for d in docs if d["_id"] is not None}


async def get_onboarding_analytics(
    db: AsyncIOMotorDatabase,
    start_date: datetime,
    end_date: datetime,
    include_internal: bool = False,
) -> Dict[str, Any]:
    """Full-transparency onboarding funnel: step-by-step conversion + dropoff,
    time per step, per-question answer distributions, reveal CTA engagement,
    abandonment, and guest-vs-auth split. Counts guests (pre-login) correctly."""
    try:
        excluded = set()
        if not include_internal:
            excluded = await get_internal_user_ids(db)

        base_match: Dict[str, Any] = {"timestamp": {"$gte": start_date, "$lte": end_date}}
        if excluded:
            # Guest events have no user_id → `$nin` still matches them (null).
            base_match["user_id"] = {"$nin": list(excluded)}

        # 1) Step funnel — unique participants per step + step→step conversion.
        step_sets = []
        for event_type, meta_field, meta_value, label in _ONB_STEPS:
            ppl = await _onb_participants(db, base_match, event_type, meta_field, meta_value)
            step_sets.append((label, event_type, meta_value, ppl))

        # "Entered onboarding" = anyone who saw intro OR the first question.
        entry_set: set = set()
        if step_sets:
            entry_set |= step_sets[0][3]
            if len(step_sets) > 1:
                entry_set |= step_sets[1][3]
        entry_count = len(entry_set)

        funnel = []
        prev = None
        for i, (label, event_type, meta_value, ppl) in enumerate(step_sets):
            n = len(ppl)
            if i == 0 or not prev:
                converted, dropped, step_conv, step_drop = n, 0, 100.0, 0.0
            else:
                converted = len(ppl & prev)
                dropped = len(prev - ppl)
                step_conv = round(converted / len(prev) * 100, 1) if prev else 0.0
                step_drop = round(100 - step_conv, 1)
            funnel.append({
                "step": f"{event_type}:{meta_value}" if meta_value is not None else event_type,
                "step_index": i,
                "label": label,
                "unique": n,
                "converted": converted,
                "dropped": dropped,
                "step_conversion": step_conv,
                "step_dropoff": step_drop,
                "pct_of_entry": round(n / entry_count * 100, 1) if entry_count else 0.0,
            })
            prev = ppl

        completed_count = len(step_sets[-1][3]) if step_sets else 0
        overall_completion = round(completed_count / entry_count * 100, 1) if entry_count else 0.0

        # 2) Median + average time per step (onboarding_step_completed.time_spent_ms).
        time_docs = await db.user_events.aggregate([
            {"$match": {**base_match, "event_type": "onboarding_step_completed",
                        "metadata.time_spent_ms": {"$gt": 0}}},
            {"$group": {"_id": "$metadata.step",
                        "times": {"$push": "$metadata.time_spent_ms"},
                        "count": {"$sum": 1}}},
        ]).to_list(length=100)
        timing = []
        for d in time_docs:
            times = sorted(t for t in d.get("times", []) if isinstance(t, (int, float)) and t > 0)
            if not times:
                continue
            mid = len(times) // 2
            median = times[mid] if len(times) % 2 else (times[mid - 1] + times[mid]) / 2
            timing.append({
                "step": d["_id"],
                "label": _ONB_STEP_LABELS.get(d["_id"], f"Step {d['_id']}"),
                "median_ms": round(median),
                "avg_ms": round(sum(times) / len(times)),
                "samples": d["count"],
            })
        timing.sort(key=lambda x: (x["step"] is None, x["step"]))

        # 3) Answer distribution per question step.
        answers = []
        for step_num, q_label in _ONB_QUESTIONS:
            docs = await db.user_events.aggregate([
                {"$match": {**base_match, "event_type": "onboarding_step_completed",
                            "metadata.step": step_num,
                            "metadata.answer": {"$exists": True, "$ne": None}}},
                {"$group": {"_id": "$metadata.answer", "ppl": {"$addToSet": _ONB_PARTICIPANT}}},
            ]).to_list(length=300)
            options = [{"answer": str(d["_id"]),
                        "count": len([p for p in d["ppl"] if p is not None])} for d in docs]
            options.sort(key=lambda x: -x["count"])
            total = sum(o["count"] for o in options)
            for o in options:
                o["pct"] = round(o["count"] / total * 100, 1) if total else 0.0
            answers.append({"step": step_num, "question": q_label, "total": total, "options": options})

        # 4) Reveal CTA engagement (the conversion action on the payoff screen).
        cta_docs = await db.user_events.aggregate([
            {"$match": {**base_match, "event_type": "reveal_cta_tapped"}},
            {"$group": {"_id": "$metadata.cta", "count": {"$sum": 1}}},
        ]).to_list(length=50)
        reveal_ctas = [{"cta": str(d["_id"] or "unknown"), "count": d["count"]} for d in cta_docs]
        reveal_ctas.sort(key=lambda x: -x["count"])

        # 5) Explicit abandonment by step.
        ab_docs = await db.user_events.aggregate([
            {"$match": {**base_match, "event_type": "onboarding_abandoned"}},
            {"$group": {"_id": "$metadata.step", "ppl": {"$addToSet": _ONB_PARTICIPANT}}},
        ]).to_list(length=100)
        abandonment = [{"step": d["_id"], "label": _ONB_STEP_LABELS.get(d["_id"], f"Step {d['_id']}"),
                        "count": len([p for p in d["ppl"] if p is not None])} for d in ab_docs]
        abandonment.sort(key=lambda x: (x["step"] is None, x["step"]))

        # 6) Guest vs auth at entry (auth = already logged in on entry; rare pre-signup).
        first_event, first_field, first_value = _ONB_STEPS[0][0], _ONB_STEPS[0][1], _ONB_STEPS[0][2]
        auth_match: Dict[str, Any] = {
            "timestamp": {"$gte": start_date, "$lte": end_date},
            "event_type": first_event,
            "user_id": {"$exists": True, "$ne": None},
        }
        if first_field:
            auth_match[first_field] = first_value
        auth_ids = await db.user_events.distinct("user_id", auth_match)
        auth_entries = len([u for u in auth_ids if u and u not in excluded])
        # entry_set already includes step 1; recompute auth against the same union
        # is overkill — report entry-screen auth vs the rest as guest.
        guest_entries = max(0, entry_count - auth_entries)

        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "entry_participants": entry_count,
            "completed_participants": completed_count,
            "overall_completion_rate": overall_completion,
            "guest_entries": guest_entries,
            "auth_entries": auth_entries,
            "funnel": funnel,
            "timing": timing,
            "answers": answers,
            "reveal_ctas": reveal_ctas,
            "abandonment": abandonment,
        }
    except Exception as e:
        logger.error(f"Error getting onboarding analytics: {e}")
        return {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "entry_participants": 0,
            "completed_participants": 0,
            "overall_completion_rate": 0,
            "guest_entries": 0,
            "auth_entries": 0,
            "funnel": [],
            "timing": [],
            "answers": [],
            "reveal_ctas": [],
            "abandonment": [],
            "error": str(e),
        }


# ── Monetization / paywall funnel ────────────────────────────────────────────
async def get_monetization_analytics(
    db: AsyncIOMotorDatabase,
    start_date: datetime,
    end_date: datetime,
    include_internal: bool = False,
) -> Dict[str, Any]:
    """Paywall + subscription analytics: the paywall funnel (viewed → plan
    selected → purchase started → purchased), conversion by paywall stage and by
    trigger, revenue, trials, founding-modal claim rate, plan mix, and churn."""
    try:
        excluded = set()
        if not include_internal:
            excluded = await get_internal_user_ids(db)
        base_match: Dict[str, Any] = {"timestamp": {"$gte": start_date, "$lte": end_date}}
        if excluded:
            base_match["user_id"] = {"$nin": list(excluded)}

        async def _count(ev: str) -> int:
            return await db.user_events.count_documents({**base_match, "event_type": ev})

        # Funnel — MOOD V2 monetization events (participants de-duped guest→auth).
        viewed = await _onb_participants(db, base_match, "paywall_viewed")
        selected = await _onb_participants(db, base_match, "plan_selected")
        initiated = await _onb_participants(db, base_match, "purchase_initiated")
        completed = await _onb_participants(db, base_match, "purchase_completed")

        funnel_defs = [
            ("Paywall viewed", viewed),
            ("Plan selected", selected),
            ("Purchase started", initiated),
            ("Purchased", completed),
        ]
        funnel = []
        prev = None
        for i, (label, s) in enumerate(funnel_defs):
            n = len(s)
            if i == 0 or not prev:
                converted, step_conv = n, 100.0
            else:
                converted = len(s & prev)
                step_conv = round(converted / len(prev) * 100, 1) if prev else 0.0
            funnel.append({
                "label": label,
                "unique": n,
                "converted": converted,
                "step_conversion": step_conv,
                "pct_of_top": round(n / len(viewed) * 100, 1) if viewed else 0.0,
            })
            prev = s

        viewed_n, completed_n = len(viewed), len(completed)
        overall_conv = round(completed_n / viewed_n * 100, 1) if viewed_n else 0.0

        # Revenue — client `purchase_completed` events do NOT carry
        # `metadata.revenue_usd` (only server-side `subscription_started` does),
        # so we price each purchase from its `metadata.plan_id` via the shared
        # SKU→price map (product_pricing.py). Real money only: exclude free-trial
        # starts (is_trial) and comped accounts (is_comp), and de-dupe repeat /
        # duplicate purchase_completed events to one per (participant, plan).
        paid_match = {
            **base_match,
            "event_type": "purchase_completed",
            "metadata.is_trial": {"$ne": True},
            "metadata.is_comp": {"$ne": True},
        }
        paid_docs = await db.user_events.aggregate([
            {"$match": paid_match},
            {"$group": {"_id": {"p": _ONB_PARTICIPANT, "plan": "$metadata.plan_id"}}},
            {"$group": {"_id": "$_id.plan", "count": {"$sum": 1},
                        "buyers": {"$addToSet": "$_id.p"}}},
        ]).to_list(100)
        total_revenue = round(sum(price_for_plan(d["_id"]) * d["count"] for d in paid_docs), 2)
        paying_customers = len({p for d in paid_docs for p in d["buyers"] if p is not None})
        # Net revenue = gross minus the App/Play store commission (see
        # product_pricing.STORE_COMMISSION_RATE).
        net_revenue = round(total_revenue * (1.0 - STORE_COMMISSION_RATE), 2)

        # MRR — monthly-recurring revenue from the CURRENT active paid subscriber
        # base (a live snapshot, independent of the selected date range). Annual
        # plans are normalised to a monthly figure. Excludes trials/comps/internal.
        mrr_docs = await db.users.aggregate([
            {"$match": {"subscription.status": "active",
                        "is_comp": {"$ne": True}, "is_internal": {"$ne": True}}},
            {"$group": {"_id": "$subscription.product_id", "count": {"$sum": 1}}},
        ]).to_list(50)
        active_subscribers = sum(d["count"] for d in mrr_docs)
        mrr = round(sum(monthly_price_for_plan(d["_id"]) * d["count"] for d in mrr_docs), 2)
        arr = round(mrr * 12, 2)

        trials = await _onb_participants(db, base_match, "trial_started")

        # Conversion by paywall stage (#1/#2/#3): of people who saw that stage,
        # how many purchased?
        by_stage = []
        for stage in (1, 2, 3):
            v = await _onb_participants(db, base_match, "paywall_viewed", "metadata.stage", stage)
            d = await _onb_participants(db, base_match, "paywall_dismissed", "metadata.stage", stage)
            purchased = len(v & completed)
            by_stage.append({
                "stage": stage,
                "viewed": len(v),
                "dismissed": len(d),
                "purchased": purchased,
                "conversion": round(purchased / len(v) * 100, 1) if v else 0.0,
            })

        # Conversion by trigger — what moment drove the paywall, and did it convert?
        trig_docs = await db.user_events.aggregate([
            {"$match": {**base_match, "event_type": "paywall_viewed"}},
            {"$group": {
                "_id": {"$ifNull": ["$metadata.trigger", "$metadata.trigger_source"]},
                "ppl": {"$addToSet": _ONB_PARTICIPANT},
            }},
        ]).to_list(200)
        by_trigger = []
        for d in trig_docs:
            viewers = {p for p in d["ppl"] if p is not None}
            purchased = len(viewers & completed)
            by_trigger.append({
                "trigger": str(d["_id"] or "unknown"),
                "viewed": len(viewers),
                "purchased": purchased,
                "conversion": round(purchased / len(viewers) * 100, 1) if viewers else 0.0,
            })
        by_trigger.sort(key=lambda x: -x["viewed"])
        by_trigger = by_trigger[:12]

        # Plan mix — unique paying customers + priced revenue per plan (same
        # de-duped, paid-only basis as total revenue above).
        plan_mix = sorted(
            [{"plan": str(d["_id"] or "unknown"), "count": d["count"],
              "revenue_usd": round(price_for_plan(d["_id"]) * d["count"], 2)}
             for d in paid_docs],
            key=lambda x: -x["revenue_usd"],
        )

        # Founding-member modal claim rate.
        # The app fires several event-name variants for the same founding-member
        # surface, so union them all. `founding_member_offer_shown` (the primary
        # shown event from analytics.ts) was previously missing from the shown
        # set, which let claim_rate exceed 100%.
        f_shown = await _onb_participants(db, base_match, "founding_modal_shown")
        f_shown |= await _onb_participants(db, base_match, "founding_member_modal_shown")
        f_shown |= await _onb_participants(db, base_match, "founding_member_offer_shown")
        f_claimed = await _onb_participants(db, base_match, "founding_modal_claimed")
        f_claimed |= await _onb_participants(db, base_match, "founding_member_claimed")
        f_dismissed = await _onb_participants(db, base_match, "founding_modal_dismissed")
        f_dismissed |= await _onb_participants(db, base_match, "founding_member_dismissed")
        # A claimer was, by definition, shown the offer — guarantees rate ≤ 100%
        # even if their shown-event is out of range or under a legacy name.
        f_shown |= f_claimed

        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "store_commission_rate": STORE_COMMISSION_RATE,
            "headline": {
                "paywall_viewers": viewed_n,
                "purchasers": completed_n,
                "paying_customers": paying_customers,
                "conversion_rate": overall_conv,
                "revenue_usd": total_revenue,
                "net_revenue_usd": net_revenue,
                "mrr_usd": mrr,
                "arr_usd": arr,
                "active_subscribers": active_subscribers,
                "trials_started": len(trials),
                "founding_claim_rate": round(len(f_claimed) / len(f_shown) * 100, 1) if f_shown else 0.0,
            },
            "funnel": funnel,
            "by_stage": by_stage,
            "by_trigger": by_trigger,
            "plan_mix": plan_mix,
            "founding": {
                "shown": len(f_shown),
                "claimed": len(f_claimed),
                "dismissed": len(f_dismissed),
                "claim_rate": round(len(f_claimed) / len(f_shown) * 100, 1) if f_shown else 0.0,
            },
            "churn": {
                "trial_cancelled": await _count("trial_cancelled"),
                "subscription_lapsed": await _count("subscription_lapsed"),
                "purchase_failed": await _count("purchase_failed"),
            },
        }
    except Exception as e:
        logger.error(f"Error getting monetization analytics: {e}")
        return {
            "start_date": start_date.isoformat() if start_date else None,
            "end_date": end_date.isoformat() if end_date else None,
            "store_commission_rate": STORE_COMMISSION_RATE,
            "headline": {"paywall_viewers": 0, "purchasers": 0, "paying_customers": 0,
                         "conversion_rate": 0, "revenue_usd": 0, "net_revenue_usd": 0,
                         "mrr_usd": 0, "arr_usd": 0, "active_subscribers": 0,
                         "trials_started": 0, "founding_claim_rate": 0},
            "funnel": [], "by_stage": [], "by_trigger": [], "plan_mix": [],
            "founding": {"shown": 0, "claimed": 0, "dismissed": 0, "claim_rate": 0},
            "churn": {"trial_cancelled": 0, "subscription_lapsed": 0, "purchase_failed": 0},
            "error": str(e),
        }


def _get_step_label(step: str) -> str:
    """Get human-readable label for funnel step"""
    labels = {
        "app_session_start": "App Opened",
        "app_opened": "App Opened",
        "user_registered": "Signed Up",
        "signup": "Signed Up",
        "mood_selected": "Selected Mood/Goal",
        "equipment_selected": "Selected Equipment",
        "difficulty_selected": "Selected Difficulty",
        "workout_started": "Started Workout",
        "workout_completed": "Completed Workout",
        "post_created": "Created Post",
        "try_workout_clicked": "Clicked Try Workout",
        "workout_added_to_cart": "Added to Cart",
        "featured_workout_clicked": "Clicked Featured",
        "featured_workout_started": "Started Featured",
        "featured_workout_completed": "Completed Featured",
    }
    return labels.get(step, step.replace("_", " ").title())


async def get_retention_cohorts(
    db: AsyncIOMotorDatabase,
    start_date: datetime,
    end_date: datetime,
    cohort_period: str = "week",  # "day", "week", "month"
    retention_window: int = 28,  # days to track retention
    include_internal: bool = False
) -> Dict[str, Any]:
    """
    Get retention cohort analysis.
    
    Groups users by signup date (cohort) and tracks their return activity
    over the retention window.
    
    Returns:
    - Cohort labels
    - Retention percentages for D1, D7, D14, D28 (or custom window)
    - Heatmap data for visualization
    
    Excludes internal users by default (include_internal=False).
    """
    try:
        # Build user filter
        user_filter = {"created_at": {"$gte": start_date, "$lte": end_date}}
        if not include_internal:
            user_filter["is_internal"] = {"$ne": True}
        
        # Get all users who signed up in the date range
        users = await db.users.find(
            user_filter,
            {"_id": 1, "created_at": 1, "username": 1}
        ).to_list(100000)
        
        if not users:
            return {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "cohort_period": cohort_period,
                "retention_window": retention_window,
                "cohorts": [],
                "retention_days": [],
                "heatmap_data": [],
                "include_internal": include_internal,
            }
        
        # Group users into cohorts
        cohorts = defaultdict(list)
        
        for user in users:
            user_id = str(user["_id"])
            signup_date = user.get("created_at")
            
            if not signup_date:
                continue
            
            # Determine cohort key based on period
            if cohort_period == "day":
                cohort_key = signup_date.strftime("%Y-%m-%d")
            elif cohort_period == "week":
                # Start of week (Monday)
                week_start = signup_date - timedelta(days=signup_date.weekday())
                cohort_key = week_start.strftime("%Y-%m-%d")
            else:  # month
                cohort_key = signup_date.strftime("%Y-%m")
            
            cohorts[cohort_key].append({
                "user_id": user_id,
                "signup_date": signup_date
            })
        
        # Define retention days to track
        if retention_window <= 7:
            retention_days = list(range(1, retention_window + 1))
        elif retention_window <= 14:
            retention_days = [1, 3, 7] + list(range(8, retention_window + 1, 2))
        else:
            retention_days = [1, 3, 7, 14, 21, 28][:min(6, (retention_window // 7) + 2)]
        
        # Calculate retention for each cohort
        cohort_results = []
        heatmap_data = []
        
        for cohort_key in sorted(cohorts.keys()):
            cohort_users = cohorts[cohort_key]
            cohort_size = len(cohort_users)
            
            if cohort_size == 0:
                continue
            
            cohort_retention = {
                "cohort": cohort_key,
                "cohort_label": _format_cohort_label(cohort_key, cohort_period),
                "cohort_size": cohort_size,
                "retention": {}
            }
            
            for day in retention_days:
                retained_count = 0
                
                for user_data in cohort_users:
                    user_id = user_data["user_id"]
                    signup_date = user_data["signup_date"]
                    
                    # Calculate the retention day window
                    day_start = signup_date + timedelta(days=day)
                    day_end = day_start + timedelta(days=1)
                    
                    # Check if user had any activity on that day
                    activity = await db.user_events.find_one({
                        "user_id": user_id,
                        "timestamp": {"$gte": day_start, "$lt": day_end}
                    })
                    
                    if activity:
                        retained_count += 1
                
                retention_pct = round((retained_count / cohort_size) * 100, 1)
                cohort_retention["retention"][f"D{day}"] = {
                    "retained": retained_count,
                    "percentage": retention_pct
                }
                
                # Add to heatmap data
                heatmap_data.append({
                    "cohort": cohort_key,
                    "day": f"D{day}",
                    "value": retention_pct
                })
            
            cohort_results.append(cohort_retention)
        
        # Calculate average retention across all cohorts
        avg_retention = {}
        for day in retention_days:
            day_key = f"D{day}"
            values = [c["retention"].get(day_key, {}).get("percentage", 0) for c in cohort_results]
            avg_retention[day_key] = round(sum(values) / len(values), 1) if values else 0
        
        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "cohort_period": cohort_period,
            "retention_window": retention_window,
            "retention_days": [f"D{d}" for d in retention_days],
            "cohorts": cohort_results,
            "average_retention": avg_retention,
            "heatmap_data": heatmap_data,
            "total_users": sum(c["cohort_size"] for c in cohort_results),
        }
        
    except Exception as e:
        logger.error(f"Error getting retention cohorts: {e}")
        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "cohort_period": cohort_period,
            "retention_window": retention_window,
            "cohorts": [],
            "error": str(e)
        }


def _format_cohort_label(cohort_key: str, period: str) -> str:
    """Format cohort key into human-readable label"""
    try:
        if period == "month":
            dt = datetime.strptime(cohort_key, "%Y-%m")
            return dt.strftime("%b %Y")
        else:
            dt = datetime.strptime(cohort_key, "%Y-%m-%d")
            if period == "week":
                return f"Week of {dt.strftime('%b %d')}"
            return dt.strftime("%b %d")
    except:
        return cohort_key


async def search_users(
    db: AsyncIOMotorDatabase,
    query: str,
    limit: int = 50,
    skip: int = 0
) -> Dict[str, Any]:
    """
    Search users by email, username, or user_id.
    Returns user details with activity summary.
    """
    try:
        if not query or len(query) < 2:
            return {"users": [], "total": 0, "query": query}
        
        # Build search filter
        search_filter = {
            "$or": [
                {"username": {"$regex": query, "$options": "i"}},
                {"email": {"$regex": query, "$options": "i"}},
            ]
        }
        
        # Also try to match by ObjectId if query looks like one
        if len(query) == 24:
            try:
                search_filter["$or"].append({"_id": ObjectId(query)})
            except:
                pass
        
        # Get matching users
        users_cursor = db.users.find(search_filter).skip(skip).limit(limit).sort("created_at", -1)
        users = await users_cursor.to_list(limit)
        
        total = await db.users.count_documents(search_filter)
        
        # Enrich with activity data
        enriched_users = []
        for user in users:
            user_id = str(user["_id"])
            
            # Get activity counts (last 30 days)
            thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
            
            sessions = await db.user_events.count_documents({
                "user_id": user_id,
                "event_type": "app_session_start",
                "timestamp": {"$gte": thirty_days_ago}
            })
            
            workouts_started = await db.user_events.count_documents({
                "user_id": user_id,
                "event_type": "workout_started",
                "timestamp": {"$gte": thirty_days_ago}
            })
            
            workouts_completed = await db.user_events.count_documents({
                "user_id": user_id,
                "event_type": "workout_completed",
                "timestamp": {"$gte": thirty_days_ago}
            })
            
            posts = await db.user_events.count_documents({
                "user_id": user_id,
                "event_type": "post_created",
                "timestamp": {"$gte": thirty_days_ago}
            })
            
            # Get last active
            last_event = await db.user_events.find_one(
                {"user_id": user_id},
                sort=[("timestamp", -1)]
            )
            
            # Get login info
            auth_meta = user.get("auth_metadata", {})
            
            enriched_users.append({
                "user_id": user_id,
                "username": user.get("username", ""),
                "email": user.get("email", ""),
                "name": user.get("name", ""),
                "avatar": user.get("avatar", ""),
                "created_at": user.get("created_at").isoformat() if user.get("created_at") else None,
                "last_active": last_event["timestamp"].isoformat() if last_event else None,
                "is_admin": user.get("is_admin", False),
                "auth_provider": auth_meta.get("login_methods", ["unknown"])[0] if auth_meta.get("login_methods") else "unknown",
                "total_logins": auth_meta.get("total_logins", 0),
                "activity_30d": {
                    "sessions": sessions,
                    "workouts_started": workouts_started,
                    "workouts_completed": workouts_completed,
                    "posts": posts,
                },
                "followers_count": user.get("followers_count", 0),
                "following_count": user.get("following_count", 0),
                "current_streak": user.get("current_streak", 0),
            })
        
        return {
            "users": enriched_users,
            "total": total,
            "query": query,
            "limit": limit,
            "skip": skip,
        }
        
    except Exception as e:
        logger.error(f"Error searching users: {e}")
        return {"users": [], "total": 0, "query": query, "error": str(e)}


async def get_user_timeline(
    db: AsyncIOMotorDatabase,
    user_id: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 200,
    event_types: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Get detailed event timeline for a specific user.
    Includes all events with metadata, grouped by day.
    """
    try:
        # Validate user exists
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
        except:
            user = await db.users.find_one({"user_id": user_id})
        
        if not user:
            return {"user_id": user_id, "events": [], "error": "User not found"}
        
        # Build query
        query = {"user_id": user_id}
        
        if start_date or end_date:
            query["timestamp"] = {}
            if start_date:
                query["timestamp"]["$gte"] = start_date
            if end_date:
                query["timestamp"]["$lte"] = end_date
        
        if event_types:
            query["event_type"] = {"$in": event_types}
        
        # Get events
        events_cursor = db.user_events.find(query).sort("timestamp", -1).limit(limit)
        events = await events_cursor.to_list(limit)
        
        # Format events
        formatted_events = []
        events_by_day = defaultdict(list)
        
        for event in events:
            formatted = {
                "event_id": str(event["_id"]),
                "event_type": event["event_type"],
                "event_label": _get_step_label(event["event_type"]),
                "category": event.get("event_category", "other"),
                "timestamp": event["timestamp"].isoformat(),
                "metadata": event.get("metadata", {}),
            }
            formatted_events.append(formatted)
            
            # Group by day
            day_key = event["timestamp"].strftime("%Y-%m-%d")
            events_by_day[day_key].append(formatted)
        
        # Get user summary
        user_summary = {
            "user_id": user_id,
            "username": user.get("username", ""),
            "email": user.get("email", ""),
            "name": user.get("name", ""),
            "avatar": user.get("avatar", ""),
            "created_at": user.get("created_at").isoformat() if user.get("created_at") else None,
            "is_admin": user.get("is_admin", False),
            "current_streak": user.get("current_streak", 0),
            "total_workouts": user.get("total_workouts", 0),
        }
        
        # Get login history
        login_history = await db.login_events.find(
            {"user_id": user_id}
        ).sort("timestamp", -1).limit(10).to_list(10)
        
        formatted_logins = [
            {
                "timestamp": l["timestamp"].isoformat(),
                "method": l.get("login_method", "unknown"),
                "success": l.get("success", True),
                "ip_address": l.get("ip_address"),
                "device_info": l.get("device_info"),
            }
            for l in login_history
        ]
        
        # Get sessions
        active_sessions = await db.user_sessions.find(
            {"user_id": user_id, "is_active": True}
        ).sort("last_activity", -1).limit(5).to_list(5)
        
        formatted_sessions = [
            {
                "created_at": s["created_at"].isoformat(),
                "last_activity": s["last_activity"].isoformat(),
                "device_type": s.get("device_type", "unknown"),
                "login_method": s.get("login_method", "unknown"),
            }
            for s in active_sessions
        ]
        
        return {
            "user": user_summary,
            "events": formatted_events,
            "events_by_day": dict(events_by_day),
            "total_events": len(formatted_events),
            "login_history": formatted_logins,
            "active_sessions": formatted_sessions,
            "date_range": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None,
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting user timeline: {e}")
        return {"user_id": user_id, "events": [], "error": str(e)}


async def get_comparison_stats(
    db: AsyncIOMotorDatabase,
    current_start: datetime,
    current_end: datetime,
    previous_start: datetime,
    previous_end: datetime,
    include_internal: bool = False
) -> Dict[str, Any]:
    """
    Get comparison stats between two periods for KPI cards.
    Returns current values, previous values, and percentage change.
    Excludes internal users by default.
    """
    try:
        # Get internal user IDs to exclude
        excluded_user_ids = set()
        if not include_internal:
            excluded_user_ids = await get_internal_user_ids(db)
        
        exclude_filter = {}
        if excluded_user_ids:
            exclude_filter = {"user_id": {"$nin": list(excluded_user_ids)}}
        
        async def count_events(event_type: str, start: datetime, end: datetime) -> int:
            query = {
                "event_type": event_type,
                "timestamp": {"$gte": start, "$lte": end},
            }
            if excluded_user_ids:
                query["user_id"] = {"$nin": list(excluded_user_ids)}
            return await db.user_events.count_documents(query)
        
        async def count_unique_users(event_type: str, start: datetime, end: datetime) -> int:
            query = {
                "event_type": event_type,
                "timestamp": {"$gte": start, "$lte": end},
            }
            if excluded_user_ids:
                query["user_id"] = {"$nin": list(excluded_user_ids)}
            users = await db.user_events.distinct("user_id", query)
            return len([u for u in users if u not in excluded_user_ids])
        
        async def count_active_users(start: datetime, end: datetime) -> int:
            query = {"timestamp": {"$gte": start, "$lte": end}}
            if excluded_user_ids:
                query["user_id"] = {"$nin": list(excluded_user_ids)}
            users = await db.user_events.distinct("user_id", query)
            return len([u for u in users if u not in excluded_user_ids])
        
        async def count_new_users(start: datetime, end: datetime) -> int:
            query = {"created_at": {"$gte": start, "$lte": end}}
            if not include_internal:
                query["is_internal"] = {"$ne": True}
            return await db.users.count_documents(query)
        
        # Calculate metrics for both periods
        metrics = {}
        
        # DAU (Daily Active Users) - average per day in period
        current_days = max(1, (current_end - current_start).days)
        previous_days = max(1, (previous_end - previous_start).days)
        
        current_active = await count_active_users(current_start, current_end)
        previous_active = await count_active_users(previous_start, previous_end)
        
        metrics["active_users"] = _calc_change(current_active, previous_active)
        metrics["dau_avg"] = _calc_change(
            round(current_active / current_days, 1),
            round(previous_active / previous_days, 1)
        )
        
        # New users
        current_new = await count_new_users(current_start, current_end)
        previous_new = await count_new_users(previous_start, previous_end)
        metrics["new_users"] = _calc_change(current_new, previous_new)
        
        # Workouts
        current_started = await count_events("workout_started", current_start, current_end)
        previous_started = await count_events("workout_started", previous_start, previous_end)
        metrics["workouts_started"] = _calc_change(current_started, previous_started)
        
        current_completed = await count_events("workout_completed", current_start, current_end)
        previous_completed = await count_events("workout_completed", previous_start, previous_end)
        metrics["workouts_completed"] = _calc_change(current_completed, previous_completed)
        
        # Completion rate
        current_rate = round((current_completed / current_started * 100), 1) if current_started > 0 else 0
        previous_rate = round((previous_completed / previous_started * 100), 1) if previous_started > 0 else 0
        metrics["completion_rate"] = _calc_change(current_rate, previous_rate, is_percentage=True)
        
        # Posts
        current_posts = await count_events("post_created", current_start, current_end)
        previous_posts = await count_events("post_created", previous_start, previous_end)
        metrics["posts_created"] = _calc_change(current_posts, previous_posts)
        
        # Social engagement
        current_likes = await count_events("post_liked", current_start, current_end)
        previous_likes = await count_events("post_liked", previous_start, previous_end)
        metrics["likes"] = _calc_change(current_likes, previous_likes)
        
        current_comments = await count_events("post_commented", current_start, current_end)
        previous_comments = await count_events("post_commented", previous_start, previous_end)
        metrics["comments"] = _calc_change(current_comments, previous_comments)
        
        current_follows = await count_events("user_followed", current_start, current_end)
        previous_follows = await count_events("user_followed", previous_start, previous_end)
        metrics["follows"] = _calc_change(current_follows, previous_follows)
        
        # Notification clicks (proxy for IG shares / push CTR)
        current_notif = await count_events("notification_clicked", current_start, current_end)
        previous_notif = await count_events("notification_clicked", previous_start, previous_end)
        metrics["notification_clicks"] = _calc_change(current_notif, previous_notif)
        
        # App sessions
        current_sessions = await count_events("app_session_start", current_start, current_end)
        previous_sessions = await count_events("app_session_start", previous_start, previous_end)
        metrics["app_sessions"] = _calc_change(current_sessions, previous_sessions)
        
        return {
            "current_period": {
                "start": current_start.isoformat(),
                "end": current_end.isoformat(),
            },
            "previous_period": {
                "start": previous_start.isoformat(),
                "end": previous_end.isoformat(),
            },
            "metrics": metrics
        }
        
    except Exception as e:
        logger.error(f"Error getting comparison stats: {e}")
        return {"metrics": {}, "error": str(e)}


def _calc_change(current: float, previous: float, is_percentage: bool = False) -> Dict[str, Any]:
    """Calculate change between two values"""
    if previous == 0:
        change_pct = 100 if current > 0 else 0
    else:
        change_pct = round(((current - previous) / previous) * 100, 1)
    
    return {
        "current": current,
        "previous": previous,
        "change": round(current - previous, 2),
        "change_pct": change_pct,
        "trend": "up" if change_pct > 0 else ("down" if change_pct < 0 else "flat"),
        "is_percentage": is_percentage,
    }


async def get_engagement_metrics(
    db: AsyncIOMotorDatabase,
    include_internal: bool = False
) -> Dict[str, Any]:
    """
    Get WAU, MAU, and DAU/MAU stickiness metrics.
    Uses app_session_start as the primary activity event.
    Excludes internal users by default.
    """
    try:
        now = datetime.now(timezone.utc)
        
        # Get internal user IDs to exclude
        excluded_user_ids = set()
        if not include_internal:
            excluded_user_ids = await get_internal_user_ids(db)
        
        # Define time windows
        day_ago = now - timedelta(days=1)
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # Build query filter
        def build_query(event_type: str, since: datetime) -> dict:
            query = {
                "event_type": event_type,
                "timestamp": {"$gte": since},
            }
            if excluded_user_ids:
                query["user_id"] = {"$nin": list(excluded_user_ids)}
            return query
        
        # DAU - unique users with app_session_start today
        dau_users = await db.user_events.distinct("user_id", build_query("app_session_start", day_ago))
        dau = len([u for u in dau_users if u not in excluded_user_ids])
        
        # WAU - unique users with app_session_start in last 7 days
        wau_users = await db.user_events.distinct("user_id", build_query("app_session_start", week_ago))
        wau = len([u for u in wau_users if u not in excluded_user_ids])
        
        # MAU - unique users with app_session_start in last 30 days
        mau_users = await db.user_events.distinct("user_id", build_query("app_session_start", month_ago))
        mau = len([u for u in mau_users if u not in excluded_user_ids])
        
        # DAU/MAU stickiness
        stickiness = round((dau / mau * 100), 1) if mau > 0 else 0
        
        # WAU/MAU ratio
        wau_mau_ratio = round((wau / mau * 100), 1) if mau > 0 else 0
        
        return {
            "dau": dau,
            "wau": wau,
            "mau": mau,
            "stickiness_dau_mau": stickiness,
            "wau_mau_ratio": wau_mau_ratio,
            "computed_at": now.isoformat(),
            "note": "Primary event: app_session_start",
            "include_internal": include_internal,
        }
        
    except Exception as e:
        logger.error(f"Error getting engagement metrics: {e}")
        return {
            "dau": 0,
            "wau": 0,
            "mau": 0,
            "stickiness_dau_mau": 0,
            "wau_mau_ratio": 0,
            "error": str(e)
        }
