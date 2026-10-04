"""
MOOD V3 founder dashboard API (Oct 2026 relaunch).  Mounted at /api/analytics/admin/v3/*, admin only.

One endpoint per admin page; every response is self-describing (each card carries its own note), so the
dashboard never has to guess what a number counts.

  GET  /pulse            How is MOOD doing right now?
  GET  /activation       Do new users reach their first finished workout, and what happens after?
  GET  /workouts         Is the generator producing workouts people start and finish?  (V3 only)
  GET  /retention        Do people come back?
  GET  /revenue          Does the workout #2 gate convert?
  GET  /users            User list with lifecycle stage + V3 status
  GET  /users/{id}       One user: milestones, profile, V3 workouts, lifecycle
  POST /backfill-milestones   Rebuild users.milestones from event history (idempotent)

Shared query params: start, end (YYYY-MM-DD, America/Chicago days, end inclusive), version (all | v3),
include_internal (default false).

Data rules (see the admin spec doc):
  - Blended by default: users, active users, workouts started/completed, revenue and retention count V2 + V3.
  - version=v3 keeps V3 users (training profile / V3 onboarding milestone / any event with app_line=v3) and
    V3 events (app_line=v3, source=v3, or a v3_* event type).
  - V3-only metrics (generation, States, Directions, Cart, Guided Session, the workout #2 gate, V3 onboarding)
    are tagged v3_only and ignore the toggle.
  - Internal / test accounts (users.is_internal) are excluded unless include_internal=true.
  - Metrics built on events added for the relaunch report tracking_since (first event seen).
"""
from __future__ import annotations

import logging
import statistics
import time
from collections import Counter, defaultdict
from datetime import date, datetime, time as dtime, timedelta, timezone
from typing import Any, Callable, Dict, Iterable, List, Optional, Set, Tuple
from zoneinfo import ZoneInfo

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query

logger = logging.getLogger(__name__)

CT = ZoneInfo("America/Chicago")
UTC = timezone.utc

PAID_NO_TRIAL_SKUS = {
    "com.mood.subscription.annual.paid",
    "com.mood.subscription.monthly.paid",
    "com.mood.subscription.founding_annual",
}
PLAN_LABELS = {
    "com.mood.subscription.monthly": "Monthly",
    "com.mood.subscription.monthly.paid": "Monthly",
    "com.mood.subscription.annual": "Annual",
    "com.mood.subscription.annual.paid": "Annual",
    "com.mood.subscription.founding_annual": "Founding Member",
}
V3_EVENT_OR = [{"metadata.app_line": "v3"}, {"metadata.source": "v3"}, {"event_type": {"$regex": "^v3_"}}]
PAYWALL_TRIGGER_W2 = "start_workout_after_free_session"


# ───────────────────────────────────────────────────────────── time helpers

def _utc(ts: Any) -> Optional[datetime]:
    """Mongo returns naive UTC datetimes; make every timestamp tz-aware UTC."""
    if ts is None:
        return None
    if isinstance(ts, str):
        try:
            ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        except ValueError:
            return None
    if not isinstance(ts, datetime):
        return None
    return ts.replace(tzinfo=UTC) if ts.tzinfo is None else ts.astimezone(UTC)


def _day(ts: Any) -> Optional[str]:
    t = _utc(ts)
    return t.astimezone(CT).date().isoformat() if t else None


def N(dt: Optional[datetime]) -> Optional[datetime]:
    """Naive UTC for Mongo queries (pymongo reads naive as UTC; keeps in-memory test doubles happy too)."""
    return dt.astimezone(UTC).replace(tzinfo=None) if isinstance(dt, datetime) and dt.tzinfo else dt


def parse_range(start: Optional[str], end: Optional[str], default_days: int) -> Tuple[datetime, datetime]:
    """[s, e) in UTC from inclusive CT calendar days. Defaults to the last `default_days` days including today."""
    today = datetime.now(CT).date()
    try:
        e_day = date.fromisoformat(end[:10]) if end else today
        s_day = date.fromisoformat(start[:10]) if start else e_day - timedelta(days=default_days - 1)
    except ValueError:
        raise HTTPException(400, "start / end must be YYYY-MM-DD")
    if s_day > e_day:
        s_day, e_day = e_day, s_day
    s = datetime.combine(s_day, dtime.min, CT).astimezone(UTC)
    e = datetime.combine(e_day + timedelta(days=1), dtime.min, CT).astimezone(UTC)
    return s, e


def prev_range(s: datetime, e: datetime) -> Tuple[datetime, datetime]:
    return s - (e - s), s


def day_keys(s: datetime, e: datetime) -> List[str]:
    d, last, out = s.astimezone(CT).date(), (e - timedelta(seconds=1)).astimezone(CT).date(), []
    while d <= last:
        out.append(d.isoformat())
        d += timedelta(days=1)
    return out


def series(stamps: Iterable[Any], s: datetime, e: datetime, distinct_by: Optional[Iterable[Any]] = None) -> List[Dict[str, Any]]:
    keys = day_keys(s, e)
    if distinct_by is None:
        c = Counter(_day(t) for t in stamps)
        return [{"date": k, "value": c.get(k, 0)} for k in keys]
    seen: Dict[str, Set[Any]] = defaultdict(set)
    for t, who in zip(stamps, distinct_by):
        seen[_day(t)].add(who)
    return [{"date": k, "value": len(seen.get(k, ()))} for k in keys]


def pct(n: float, d: float) -> Optional[float]:
    return round(100.0 * n / d, 1) if d else None


def change(cur: Optional[float], prev: Optional[float]) -> Optional[float]:
    if cur is None or prev is None or prev == 0:
        return None
    return round(100.0 * (cur - prev) / prev, 1)


def median(xs: List[float]) -> Optional[float]:
    xs = [x for x in xs if x is not None]
    return round(statistics.median(xs), 1) if xs else None


def card(key: str, label: str, value: Any, *, prev: Any = None, note: str, fmt: str = "int",
         spark: Optional[List[Dict[str, Any]]] = None, v3_only: bool = False, tracking_since: Optional[str] = None,
         today: Any = None) -> Dict[str, Any]:
    return {
        "key": key, "label": label, "value": value, "prev": prev, "change_pct": change(value, prev) if fmt != "pct" else
        (round(value - prev, 1) if value is not None and prev is not None else None),
        "fmt": fmt, "note": note, "series": spark, "v3_only": v3_only, "tracking_since": tracking_since, "today": today,
    }


def funnel(steps: List[Tuple[str, str, int]], note: str = "") -> Dict[str, Any]:
    out, top, prev = [], (steps[0][2] if steps else 0), None
    for key, label, n in steps:
        out.append({
            "key": key, "label": label, "users": n,
            "pct_of_top": pct(n, top),
            "step_conversion": pct(n, prev) if prev is not None else None,
            "drop": (prev - n) if prev is not None else None,
        })
        prev = n
    return {"steps": out, "note": note}


# ───────────────────────────────────────────────────────────── the router

def build_admin_v3_router(db, require_admin: Callable) -> APIRouter:
    r = APIRouter(prefix="/analytics/admin/v3", tags=["admin-v3"])
    cache: Dict[str, Tuple[float, Any]] = {}

    async def cached(key: str, ttl: float, fn):
        hit = cache.get(key)
        if hit and time.time() - hit[0] < ttl:
            return hit[1]
        val = await fn()
        cache[key] = (time.time(), val)
        return val

    async def internal_ids() -> Set[str]:
        async def load():
            try:
                from admin_analytics import get_internal_user_ids
                ids = await get_internal_user_ids(db)
            except Exception:
                ids = {str(u["_id"]) async for u in db.users.find({"is_internal": True}, {"_id": 1})}
            try:
                from user_analytics import EXCLUDED_USER_IDS
                ids = set(ids) | set(EXCLUDED_USER_IDS)
            except Exception:
                pass
            return set(ids)
        return await cached("internal", 60, load)

    async def v3_user_ids() -> Set[str]:
        async def load():
            ids = {str(u["_id"]) async for u in db.users.find(
                {"$or": [{"training_profile.completed_at": {"$exists": True}}, {"milestones.v3_onboarded_at": {"$exists": True}}]},
                {"_id": 1})}
            try:
                ids |= {str(x) for x in await db.user_events.distinct("user_id", {"metadata.app_line": "v3"}) if x}
            except Exception:
                pass
            return ids
        return await cached("v3users", 120, load)

    async def scope(version: str, include_internal: bool):
        """(excluded ids, keep(user_id) predicate) for user-level filtering."""
        excl = set() if include_internal else await internal_ids()
        v3 = await v3_user_ids() if version == "v3" else None

        def keep(uid: Any) -> bool:
            u = str(uid or "")
            if not u or u.startswith("guest_") or u in excl:
                return False
            return v3 is None or u in v3
        return excl, keep

    async def events(types: List[str], s: Optional[datetime], e: Optional[datetime], excl: Set[str],
                     extra: Optional[dict] = None, v3_events: bool = False, fields: Optional[dict] = None) -> List[dict]:
        q: Dict[str, Any] = {"event_type": {"$in": types} if len(types) > 1 else types[0]}
        if s is not None or e is not None:
            q["timestamp"] = {k: v for k, v in (("$gte", N(s)), ("$lt", N(e))) if v is not None}
        if excl:
            q["user_id"] = {"$nin": list(excl)}
        if v3_events:
            q["$or"] = V3_EVENT_OR
        if extra:
            q.update(extra)
        proj = fields or {"user_id": 1, "event_type": 1, "timestamp": 1, "metadata": 1}
        return await db.user_events.find(q, proj).to_list(None)

    async def tracking_since(event_type: str) -> Optional[str]:
        async def load():
            d = await db.user_events.find_one({"event_type": event_type}, {"timestamp": 1}, sort=[("timestamp", 1)])
            return _day(d["timestamp"]) if d else None
        return await cached(f"since:{event_type}", 300, load)

    def is_v3_event(ev: dict) -> bool:
        md = ev.get("metadata") or {}
        return md.get("app_line") == "v3" or md.get("source") == "v3" or str(ev.get("event_type", "")).startswith("v3_")

    async def users_by_ids(ids: Iterable[str], fields: dict) -> Dict[str, dict]:
        oids = []
        for i in ids:
            try:
                oids.append(ObjectId(i))
            except Exception:
                pass
        out: Dict[str, dict] = {}
        for k in range(0, len(oids), 2000):
            async for u in db.users.find({"_id": {"$in": oids[k:k + 2000]}}, fields):
                out[str(u["_id"])] = u
        return out

    def revenue_of(evs: List[dict]) -> float:
        total = 0.0
        for ev in evs:
            md = ev.get("metadata") or {}
            amt = md.get("revenue_usd")
            if amt is None:
                continue
            t = ev.get("event_type")
            if t == "subscription_started" and (md.get("plan_id") or md.get("plan")) not in PAID_NO_TRIAL_SKUS:
                continue  # a trial start: $0 until it renews
            total += float(amt)
        return round(total, 2)

    REVENUE_TYPES = ["subscription_started", "subscription_renewed", "subscription_refunded"]

    # ─────────────────────────────────────────────── PULSE
    @r.get("/pulse")
    async def pulse(start: Optional[str] = None, end: Optional[str] = None, version: str = "all",
                    include_internal: bool = False, _: str = Depends(require_admin)):
        s, e = parse_range(start, end, 7)
        ps, pe = prev_range(s, e)
        excl, keep = await scope(version, include_internal)
        v3 = version == "v3"
        today_s = datetime.combine(datetime.now(CT).date(), dtime.min, CT).astimezone(UTC)
        now = datetime.now(UTC)

        def split(evs, lo, hi, pred=lambda ev: True):
            return [ev for ev in evs if lo <= _utc(ev["timestamp"]) < hi and keep(ev.get("user_id")) and pred(ev)]

        # one read for the event-based cards across current + previous period
        wanted = ["workout_started", "workout_completed", "subscription_started", "subscription_renewed",
                  "subscription_refunded", "v3_workout_generated", "v3_completion_failed"]
        evs = await events(wanted, ps, e, excl)
        by_type: Dict[str, List[dict]] = defaultdict(list)
        for ev in evs:
            by_type[ev["event_type"]].append(ev)
        vpred = (lambda ev: is_v3_event(ev)) if v3 else (lambda ev: True)

        # active users: daily_activity (one row per user per UTC day with any event)
        act = await db.daily_activity.find({"date": {"$gte": N(ps) - timedelta(days=1), "$lt": N(e)}},
                                           {"user_id": 1, "date": 1}).to_list(None)
        act = [a for a in act if keep(a.get("user_id"))]
        cur_act = [a for a in act if s <= _utc(a["date"]) + timedelta(hours=12) < e]
        prev_act = [a for a in act if ps <= _utc(a["date"]) + timedelta(hours=12) < pe]
        today_active = len({str(x) for x in await db.user_events.distinct(
            "user_id", {"timestamp": {"$gte": N(today_s)}, **({"user_id": {"$nin": list(excl)}} if excl else {})}) if keep(x)})

        # generated workouts (persisted V3 workouts are the ground truth, history included)
        gen_docs = await db.v3_workouts.find({"created_at": {"$gte": N(ps), "$lt": N(e)}}, {"user_id": 1, "created_at": 1}).to_list(None)
        gen_docs = [d for d in gen_docs if keep(d.get("user_id"))]
        gen_cur = [d for d in gen_docs if s <= _utc(d["created_at"]) < e]
        gen_prev = [d for d in gen_docs if ps <= _utc(d["created_at"]) < pe]

        started_cur, started_prev = split(by_type["workout_started"], s, e, vpred), split(by_type["workout_started"], ps, pe, vpred)
        done_cur, done_prev = split(by_type["workout_completed"], s, e, vpred), split(by_type["workout_completed"], ps, pe, vpred)

        # signups
        sign = await db.users.find({"created_at": {"$gte": N(ps), "$lt": N(e)}}, {"created_at": 1}).to_list(None)
        sign = [u for u in sign if keep(str(u["_id"]))]
        sign_cur = [u for u in sign if s <= _utc(u["created_at"]) < e]
        sign_prev = [u for u in sign if ps <= _utc(u["created_at"]) < pe]

        # trials / first paid (milestones; run the backfill once so history is included)
        async def ms_in(field, lo, hi):
            docs = await db.users.find({f"milestones.{field}": {"$gte": N(lo), "$lt": N(hi)}}, {f"milestones.{field}": 1}).to_list(None)
            return [d for d in docs if keep(str(d["_id"]))]
        trials_all = await ms_in("trial_started_at", ps, e)
        paid_all = await ms_in("first_paid_at", ps, e)
        tr_cur = [d for d in trials_all if s <= _utc(d["milestones"]["trial_started_at"]) < e]
        pd_cur = [d for d in paid_all if s <= _utc(d["milestones"]["first_paid_at"]) < e]

        rev = by_type["subscription_started"] + by_type["subscription_renewed"] + by_type["subscription_refunded"]
        rev_cur, rev_prev = split(rev, s, e), split(rev, ps, pe)  # store events carry no app_line: V3 = V3 users (keep)

        def today_count(lst, field="timestamp"):
            return sum(1 for x in lst if _utc(x[field]) >= today_s)

        vnote = " V3 toggle: V3 builds only." if v3 else " Includes V2 and V3."
        cards = [
            card("active_users", "Active users", len({a["user_id"] for a in cur_act}), prev=len({a["user_id"] for a in prev_act}),
                 today=today_active, spark=series([a["date"] + timedelta(hours=12) for a in cur_act], s, e, [a["user_id"] for a in cur_act]),
                 note="Distinct people who did anything in the app in the period. Daily bars use UTC days." + vnote),
            card("workouts_generated", "Workouts generated", len(gen_cur), prev=len(gen_prev), today=today_count(gen_cur, "created_at"),
                 spark=series([d["created_at"] for d in gen_cur], s, e), v3_only=True,
                 note="V3 workouts built from Build or a Home card and saved. Live Home previews are not counted."),
            card("workouts_started", "Workouts started", len(started_cur), prev=len(started_prev), today=today_count(started_cur),
                 spark=series([x["timestamp"] for x in started_cur], s, e),
                 note="Sessions started (V3 Guided Session and the V2 player). Client event, so it misses users who opted out of analytics." + vnote),
            card("workouts_completed", "Workouts completed", len(done_cur), prev=len(done_prev), today=today_count(done_cur),
                 spark=series([x["timestamp"] for x in done_cur], s, e),
                 note="Finished workouts. V3 completions are written by the server, so they are never missed." + vnote),
            card("signups", "New signups", len(sign_cur), prev=len(sign_prev), today=today_count(sign_cur, "created_at"),
                 spark=series([u["created_at"] for u in sign_cur], s, e),
                 note="Accounts created." + (" V3 toggle: people who used the V3 app." if v3 else "")),
            card("trials", "Trials started", len(tr_cur), prev=len([d for d in trials_all if ps <= _utc(d["milestones"]["trial_started_at"]) < pe]),
                 spark=series([d["milestones"]["trial_started_at"] for d in tr_cur], s, e),
                 note="People whose first free trial began in the period (store-confirmed purchase, not a button tap)."),
            card("paid", "Paid conversions", len(pd_cur), prev=len([d for d in paid_all if ps <= _utc(d["milestones"]["first_paid_at"]) < pe]),
                 spark=series([d["milestones"]["first_paid_at"] for d in pd_cur], s, e),
                 note="People who paid for the first time: a trial converting, or a plan bought without a trial."),
            card("revenue", "Revenue (gross)", revenue_of(rev_cur), prev=revenue_of(rev_prev), fmt="usd",
                 note="List price of paid starts and renewals minus refunds, from Apple / Google server events. Before store commission. App Store Connect is the source of truth for payouts."),
        ]

        # alerts
        alerts = []
        day_ago = now - timedelta(hours=24)
        g24 = [ev for ev in by_type["v3_workout_generated"] if _utc(ev["timestamp"]) >= day_ago and keep(ev.get("user_id"))]
        bad = [ev for ev in g24 if (ev.get("metadata") or {}).get("status") != "ok"]
        if g24 and len(bad) / len(g24) >= 0.10 and len(bad) >= 3:
            codes = Counter((ev.get("metadata") or {}).get("conflict_code") or (ev.get("metadata") or {}).get("status") for ev in bad)
            alerts.append({"level": "warning", "title": f"{len(bad)} of {len(g24)} generations failed or conflicted in the last 24h",
                           "detail": ", ".join(f"{k}: {v}" for k, v in codes.most_common(3))})
        cf = [ev for ev in by_type["v3_completion_failed"] if _utc(ev["timestamp"]) >= day_ago and keep(ev.get("user_id"))]
        if cf:
            alerts.append({"level": "critical" if len(cf) >= 5 else "warning",
                           "title": f"{len(cf)} workout completion request(s) failed in the last 24h",
                           "detail": "The app retries queued completions; repeated failures mean streaks and history may be missing."})
        last = await db.user_events.find_one({}, {"timestamp": 1}, sort=[("timestamp", -1)])
        last_ts = _utc(last["timestamp"]) if last else None
        fresh_min = round((now - last_ts).total_seconds() / 60) if last_ts else None
        if fresh_min is None or fresh_min > 120:
            alerts.append({"level": "warning", "title": "No events received recently",
                           "detail": f"Last event {fresh_min} minutes ago." if fresh_min is not None else "No events found."})
        return {
            "range": {"start": s.isoformat(), "end": e.isoformat(), "prev_start": ps.isoformat()},
            "version": version, "cards": cards, "alerts": alerts,
            "freshness": {"last_event_at": last_ts.isoformat() if last_ts else None, "minutes_ago": fresh_min},
        }

    # ─────────────────────────────────────────────── ACTIVATION
    ONB_EXTRA_STEPS = {"first_name", "first_name_skipped"}

    def is_v3_onboarding(ev: dict) -> bool:
        md = ev.get("metadata") or {}
        return (md.get("app_line") == "v3" or md.get("funnel_version") == "v3"
                or str(md.get("funnel_design", "")).startswith("v3") or md.get("question") in ONB_EXTRA_STEPS)

    def step_label(q: str) -> str:
        names = {"intro": "Intro", "first_name": "Name", "training_preference": "Training preference", "goal": "Goal",
                 "experience": "Experience", "training_frequency": "Frequency", "biggest_barrier": "Barrier"}
        return names.get(q, q.replace("_", " ").capitalize())

    @r.get("/activation")
    async def activation(start: Optional[str] = None, end: Optional[str] = None, version: str = "all",
                         include_internal: bool = False, _: str = Depends(require_admin)):
        s, e = parse_range(start, end, 30)
        excl, keep = await scope(version, include_internal)
        cohort_docs = await db.users.find(
            {"created_at": {"$gte": N(s), "$lt": N(e)}},
            {"created_at": 1, "milestones": 1, "training_profile.completed_at": 1, "training_profile.goal": 1,
             "training_profile.experience": 1}).to_list(None)
        cohort = {str(u["_id"]): u for u in cohort_docs if keep(str(u["_id"]))}
        ids = list(cohort)
        if not ids:
            return {"range": {"start": s.isoformat(), "end": e.isoformat()}, "cohort_size": 0,
                    "funnel": funnel([]), "continuation": funnel([]), "timing": [], "rates": [], "splits": {},
                    "note": "No signups in this range."}

        evq = {"user_id": {"$in": ids}, "event_type": {"$in": [
            "onboarding_step_viewed", "reveal_screen_viewed", "onboarding_completed", "v3_home_viewed"]}}
        evs = await db.user_events.find(evq, {"user_id": 1, "event_type": 1, "timestamp": 1, "metadata": 1}).to_list(None)

        # Onboarding steps, ordered as people actually move through them (median offset from their first step),
        # so the funnel follows the production flow without hard-coding question counts.
        first_onb: Dict[str, datetime] = {}
        step_users: Dict[str, Set[str]] = defaultdict(set)
        step_offsets: Dict[str, List[float]] = defaultdict(list)
        onb = [ev for ev in evs if ev["event_type"] == "onboarding_step_viewed" and is_v3_onboarding(ev)]
        for ev in onb:
            t, u = _utc(ev["timestamp"]), str(ev["user_id"])
            if u not in first_onb or t < first_onb[u]:
                first_onb[u] = t
        for ev in onb:
            md = ev.get("metadata") or {}
            q = md.get("question") or f"step {md.get('step')}"
            if q == "first_name_skipped":
                q = "first_name"
            u = str(ev["user_id"])
            if u not in step_users[q]:
                step_offsets[q].append((_utc(ev["timestamp"]) - first_onb[u]).total_seconds())
            step_users[q].add(u)
        min_users = max(1, int(0.03 * len(ids)))
        onb_steps = sorted([q for q in step_users if len(step_users[q]) >= min_users], key=lambda q: statistics.median(step_offsets[q]))

        def has(ev_type):
            return {str(ev["user_id"]) for ev in evs if ev["event_type"] == ev_type}

        def ms(u, f):
            return _utc(((cohort[u].get("milestones") or {}).get(f)))

        profile = {u for u in ids if ms(u, "v3_onboarded_at") or (cohort[u].get("training_profile") or {}).get("completed_at")}
        gen_users = {u for u in ids if ms(u, "first_workout_generated_at")}
        # users who generated before the server event existed: fall back to their saved V3 workouts
        async for d in db.v3_workouts.find({"user_id": {"$in": ids}}, {"user_id": 1}):
            gen_users.add(str(d["user_id"]))
        start_users = {u for u in ids if ms(u, "first_workout_started_at")}
        done_users = {u for u in ids if ms(u, "first_workout_completed_at")}

        steps = [("signup", "Signed up", len(ids))]
        steps += [(f"onb:{q}", step_label(q), len(step_users[q])) for q in onb_steps]
        steps += [
            ("profile", "Training profile saved", len(profile)),
            ("reveal", "Profile reveal viewed", len(has("reveal_screen_viewed"))),
            ("onboarding_completed", "Onboarding completed", len(has("onboarding_completed"))),
            ("home", "Reached Home", len(has("v3_home_viewed"))),
            ("first_generated", "First workout generated", len(gen_users)),
            ("first_started", "First workout started", len(start_users)),
            ("first_completed", "First workout completed", len(done_users)),
        ]

        # continuation: what first completers do next
        act = await db.daily_activity.find({"user_id": {"$in": list(done_users)}}, {"user_id": 1, "date": 1}).to_list(None)
        active_days: Dict[str, Set[date]] = defaultdict(set)
        for a in act:
            active_days[str(a["user_id"])].add(_utc(a["date"]).date())
        returned = {u for u in done_users if any(d > ms(u, "first_workout_completed_at").date() for d in active_days.get(u, ()))}
        # nested: each step is a subset of the one before (trying workout #2 means they came back)
        w2 = {u for u in done_users if ms(u, "second_workout_attempted_at")}
        returned |= w2
        paywall = {u for u in w2 if ms(u, "first_paywall_at")}
        trial = {u for u in paywall if ms(u, "trial_started_at") or ms(u, "first_paid_at")}
        cont = [("first_completed", "First workout completed", len(done_users)), ("returned", "Came back another day", len(returned)),
                ("w2_attempt", "Tried to start workout #2", len(w2)), ("paywall", "Saw the paywall", len(paywall)),
                ("trial", "Started a trial or paid", len(trial))]

        def hours_to(f):
            out = []
            for u in ids:
                t, c = ms(u, f), _utc(cohort[u].get("created_at"))
                if t and c and t >= c:
                    out.append((t - c).total_seconds() / 3600)
            return median(out)

        timing = [
            {"key": "to_generated", "label": "Signup to first generated workout", "median_hours": hours_to("first_workout_generated_at")},
            {"key": "to_started", "label": "Signup to first start", "median_hours": hours_to("first_workout_started_at")},
            {"key": "to_completed", "label": "Signup to first completion", "median_hours": hours_to("first_workout_completed_at")},
        ]
        rates = [
            card("first_completion_rate", "First-workout completion", pct(len(done_users), len(start_users)), fmt="pct",
                 note="Of people who started a first workout, the share who finished it."),
            card("return_rate", "Return after workout #1", pct(len(returned), len(done_users)), fmt="pct",
                 note="Of first completers, the share active again on a later day."),
            card("w2_attempt_rate", "Workout #2 attempt rate", pct(len(w2), len(done_users)), fmt="pct",
                 note="Of first completers, the share who tried to start another workout. The key V3 habit signal.",
                 tracking_since=await tracking_since("workout_start_gate")),
        ]

        # splits: goal, experience, first direction
        first_dir: Dict[str, Tuple[datetime, str]] = {}
        async for d in db.v3_workouts.find({"user_id": {"$in": ids}}, {"user_id": 1, "created_at": 1, "envelope.workout.direction": 1}):
            u, t = str(d["user_id"]), _utc(d.get("created_at"))
            dirn = (((d.get("envelope") or {}).get("workout") or {}).get("direction"))
            if t and dirn and (u not in first_dir or t < first_dir[u][0]):
                first_dir[u] = (t, dirn)

        def split_by(fn) -> List[Dict[str, Any]]:
            groups: Dict[str, List[str]] = defaultdict(list)
            for u in ids:
                groups[fn(u) or "Not set"].append(u)
            rows = []
            for k, us in groups.items():
                us_set = set(us)
                rows.append({"segment": str(k).replace("_", " "), "users": len(us),
                             "first_completed_pct": pct(len(us_set & done_users), len(us)),
                             "returned_pct": pct(len(us_set & returned), len(us_set & done_users)),
                             "w2_attempt_pct": pct(len(us_set & w2), len(us_set & done_users))})
            return sorted(rows, key=lambda x: -x["users"])

        return {
            "range": {"start": s.isoformat(), "end": e.isoformat()}, "version": version, "cohort_size": len(ids),
            "funnel": funnel(steps, "People who signed up in the range, and how far each got. Onboarding steps are ordered the way people actually move through them."),
            "continuation": funnel(cont, "Of those who finished their first workout: did they come back and try another?"),
            "timing": timing, "rates": rates,
            "splits": {
                "goal": split_by(lambda u: (cohort[u].get("training_profile") or {}).get("goal")),
                "experience": split_by(lambda u: (cohort[u].get("training_profile") or {}).get("experience")),
                "first_direction": split_by(lambda u: (first_dir.get(u) or (None, None))[1]),
            },
        }

    # ─────────────────────────────────────────────── WORKOUTS (V3 only)
    @r.get("/workouts")
    async def workouts(start: Optional[str] = None, end: Optional[str] = None, version: str = "all",
                       include_internal: bool = False, _: str = Depends(require_admin)):
        s, e = parse_range(start, end, 30)
        excl, keep = await scope("all", include_internal)  # V3-only page: the version toggle does not apply
        docs = await db.v3_workouts.find({"created_at": {"$gte": N(s), "$lt": N(e)}}, {
            "user_id": 1, "created_at": 1, "status": 1, "duration_actual": 1, "fit_rating": 1, "completed_steps": 1,
            "total_steps": 1, "envelope.workout.direction": 1, "envelope.workout.archetype": 1, "envelope.workout.target": 1,
            "envelope.workout.duration": 1, "envelope.workout.states": 1, "envelope.workout.selection_source": 1,
            "envelope.workout.swap_count": 1, "envelope.workout.blocks.items.exercise.id": 1,
            "envelope.workout.blocks.items.exercise.name": 1}).to_list(None)
        docs = [d for d in docs if keep(d.get("user_id"))]
        wid = {str(d["_id"]) for d in docs}
        names: Dict[str, str] = {}
        for d in docs:
            for b in (((d.get("envelope") or {}).get("workout") or {}).get("blocks") or []):
                for it in b.get("items") or []:
                    ex = it.get("exercise") or {}
                    if ex.get("id"):
                        names.setdefault(ex["id"], ex.get("name") or ex["id"])

        # events about these workouts (window runs a week past the range so late starts / finishes count)
        sess = await events(["workout_start_gate", "v3_workout_started", "v3_swap_exercise_result", "v3_swap_workout_result",
                             "v3_step_skipped", "v3_workout_ended_early", "v3_session_mode", "v3_workout_completed"],
                            s, e + timedelta(days=7), excl)
        started: Set[str] = set()
        ex_swapped_w: Set[str] = set()
        swapped_out: Counter = Counter()
        skipped: Counter = Counter()
        ended_block: Counter = Counter()
        ended_w: Set[str] = set()
        modes: Counter = Counter()
        start_modes: Counter = Counter()
        for ev in sess:
            md, t = ev.get("metadata") or {}, ev["event_type"]
            w = str(md.get("workout_id") or "")
            if w not in wid:
                continue
            if (t == "workout_start_gate" and md.get("allowed")) or t == "v3_workout_started":
                started.add(w)
                if t == "v3_workout_started" and md.get("mode"):
                    start_modes[md["mode"]] += 1
            elif t == "v3_swap_exercise_result" and md.get("result") == "swapped":
                ex_swapped_w.add(w)
                if md.get("from"):
                    swapped_out[md["from"]] += 1
            elif t == "v3_step_skipped" and md.get("scope") == "exercise" and md.get("exercise"):
                skipped[md["exercise"]] += 1
            elif t == "v3_workout_ended_early" and md.get("reason") == "user":
                ended_w.add(w)
                ended_block[f"Block {md.get('block')}" if md.get("block") is not None else "Unknown"] += 1
            elif t == "v3_session_mode" and md.get("mode"):
                modes[md["mode"]] += 1
        completed = {str(d["_id"]) for d in docs if d.get("status") == "completed"}
        started |= completed  # a finished workout was started, even if its start event was lost
        diff_w = {str(d["_id"]) for d in docs if (((d.get("envelope") or {}).get("workout") or {}).get("swap_count") or 0) > 0}

        def W(d):
            return ((d.get("envelope") or {}).get("workout") or {})

        def row(label: str, ds: List[dict]) -> Dict[str, Any]:
            ids_ = {str(d["_id"]) for d in ds}
            st, cp = ids_ & started, ids_ & completed
            return {"segment": label, "generated": len(ids_), "started_pct": pct(len(st), len(ids_)),
                    "completed_pct": pct(len(cp), len(st)), "swap_pct": pct(len(ids_ & ex_swapped_w), len(ids_)),
                    "different_pct": pct(len(ids_ & diff_w), len(ids_))}

        def breakdown(keyfn, multi=False) -> List[Dict[str, Any]]:
            g: Dict[str, List[dict]] = defaultdict(list)
            for d in docs:
                ks = keyfn(d)
                for k in (ks if multi else [ks]):
                    g[str(k) if k not in (None, "") else "None"].append(d)
            return sorted([row(k, v) for k, v in g.items()], key=lambda x: -x["generated"])

        def combo(d):
            st = sorted(W(d).get("states") or [])
            return " + ".join(x.replace("_", " ") for x in st) if st else "No State"

        # generation requests incl. conflicts / failures (server event, relaunch onward)
        gens = await events(["v3_workout_generated"], s, e, excl)
        gstat = Counter((ev.get("metadata") or {}).get("status") for ev in gens)
        codes = Counter((ev.get("metadata") or {}).get("conflict_code") for ev in gens if (ev.get("metadata") or {}).get("status") != "ok")
        ms_list = sorted((ev.get("metadata") or {}).get("generation_ms") or 0 for ev in gens if (ev.get("metadata") or {}).get("generation_ms"))
        since_gen = await tracking_since("v3_workout_generated")

        # planned vs actual minutes for finished sessions
        by_len: Dict[str, Dict[str, List[float]]] = defaultdict(lambda: {"planned": [], "actual": []})
        fit = Counter()
        for d in docs:
            if d.get("status") != "completed":
                continue
            dur = W(d).get("duration") or {}
            k = f"{dur.get('requested_minutes')} min" if dur.get("requested_minutes") else "Unknown"
            if dur.get("estimated_minutes") is not None:
                by_len[k]["planned"].append(float(dur["estimated_minutes"]))
            if d.get("duration_actual") is not None:
                by_len[k]["actual"].append(float(d["duration_actual"]))
            if d.get("fit_rating") is not None:
                fit[str(d["fit_rating"])] += 1

        n_gen, n_st, n_cp = len(wid), len(started), len(completed)
        key_cards = [
            card("gen_to_start", "Generated → Started", pct(n_st, n_gen), fmt="pct", v3_only=True,
                 note="Share of generated workouts that were started. Low means people don't like what they're shown."),
            card("start_to_complete", "Started → Completed", pct(n_cp, n_st), fmt="pct", v3_only=True,
                 note="Share of started workouts that were finished (server-confirmed completions)."),
            card("swap_rate", "Exercise swap rate", pct(len(ex_swapped_w), n_gen), fmt="pct", v3_only=True,
                 note="Share of generated workouts where at least one exercise was swapped in the Cart."),
            card("different_rate", "Different Workout rate", pct(len(diff_w), n_gen), fmt="pct", v3_only=True,
                 note="Share of generated workouts replaced with Different Workout at least once (server count)."),
        ]
        volume = [
            card("generated", "Generated", n_gen, v3_only=True, note="Saved V3 workouts created in the range."),
            card("started", "Started", n_st, v3_only=True, note="Of those, started (start gate, session start, or completed)."),
            card("completed", "Completed", n_cp, v3_only=True, note="Of those, completed."),
            card("ended_early", "Ended early", len(ended_w), v3_only=True, note="Sessions the athlete ended with End workout."),
            card("gen_success", "Generation success", pct(gstat.get("ok", 0), sum(gstat.values())), fmt="pct", v3_only=True,
                 tracking_since=since_gen, note="Share of Build requests that produced a workout (vs a conflict or error)."),
            card("gen_p50", "Median generation time", (ms_list[len(ms_list) // 2] / 1000) if ms_list else None, fmt="sec",
                 v3_only=True, tracking_since=since_gen, note="Server time to build a workout."),
        ]
        top = lambda c: [{"id": k, "name": names.get(k, k), "count": v} for k, v in c.most_common(10)]
        return {
            "range": {"start": s.isoformat(), "end": e.isoformat()},
            "key_cards": key_cards, "volume": volume,
            "funnel": funnel([("generated", "Generated", n_gen), ("started", "Started", n_st), ("completed", "Completed", n_cp)],
                             "V3 workouts generated in the range, and how many were started and finished."),
            "breakdowns": {
                "direction": breakdown(lambda d: (W(d).get("direction") or "").capitalize() or None),
                "duration": breakdown(lambda d: f"{(W(d).get('duration') or {}).get('requested_minutes')} min"),
                "state": breakdown(lambda d: [x.replace("_", " ").capitalize() for x in (W(d).get("states") or [])] or ["No State"], multi=True),
                "state_combo": breakdown(combo)[:15],
                "target": breakdown(lambda d: (W(d).get("target") or {}).get("label") or (W(d).get("target") or {}).get("mode")),
                "selection": breakdown(lambda d: {"moods_pick": "MOOD's Pick", "user_selected": "User picked type",
                                                  "target": "User picked target"}.get(W(d).get("selection_source"), W(d).get("selection_source"))),
            },
            "generation": {"tracking_since": since_gen, "requests": sum(gstat.values()), "by_status": dict(gstat),
                           "conflicts": [{"code": k or "unknown", "count": v} for k, v in codes.most_common(10)],
                           "p50_ms": ms_list[len(ms_list) // 2] if ms_list else None,
                           "p95_ms": ms_list[int(len(ms_list) * 0.95)] if ms_list else None},
            "top_swapped_out": top(swapped_out), "top_skipped": top(skipped),
            "ended_early_by_block": [{"block": k, "count": v} for k, v in sorted(ended_block.items())],
            "duration_fit": [{"length": k, "planned_median": median(v["planned"]), "actual_median": median(v["actual"]),
                              "sessions": len(v["actual"])} for k, v in sorted(by_len.items())],
            "session_mode": {"initial": dict(start_modes), "switches": dict(modes)},
            "fit_rating": dict(fit),
        }

    # ─────────────────────────────────────────────── RETENTION
    def week_start(d: date) -> date:
        return d - timedelta(days=d.weekday())

    @r.get("/retention")
    async def retention(start: Optional[str] = None, end: Optional[str] = None, version: str = "all",
                        include_internal: bool = False, weeks: int = Query(12, ge=4, le=26), _: str = Depends(require_admin)):
        s, e = parse_range(start, end, 90)
        excl, keep = await scope(version, include_internal)
        today = datetime.now(UTC).date()

        users = await db.users.find({"created_at": {"$gte": N(s), "$lt": N(e)}}, {"created_at": 1, "milestones": 1}).to_list(None)
        users = [u for u in users if keep(str(u["_id"]))]
        uids = [str(u["_id"]) for u in users]
        signup = {str(u["_id"]): _utc(u["created_at"]).date() for u in users}

        act_rows = await db.daily_activity.find({"user_id": {"$in": uids}}, {"user_id": 1, "date": 1}).to_list(None)
        days: Dict[str, Set[date]] = defaultdict(set)
        for a in act_rows:
            days[str(a["user_id"])].add(_utc(a["date"]).date())

        def dn(n: int) -> Dict[str, Any]:
            eligible = [u for u in uids if signup[u] + timedelta(days=n) <= today]
            hit = [u for u in eligible if signup[u] + timedelta(days=n) in days.get(u, ())]
            return {"day": n, "rate": pct(len(hit), len(eligible)), "eligible": len(eligible)}

        # weekly cohorts: share of each signup week active in week k after signup
        cohorts: Dict[date, List[str]] = defaultdict(list)
        for u in uids:
            cohorts[week_start(signup[u])].append(u)
        heat = []
        for wk in sorted(cohorts)[-weeks:]:
            members = cohorts[wk]
            cells = []
            for k in range(0, weeks):
                lo = wk + timedelta(weeks=k)
                if lo > today:
                    break
                hi = lo + timedelta(days=7)
                n_act = sum(1 for u in members if any(lo <= d < hi for d in days.get(u, ())))
                cells.append({"week": k, "rate": pct(n_act, len(members)), "active": n_act})
            heat.append({"cohort": wk.isoformat(), "size": len(members), "weeks": cells})

        # weekly workouts per active user (whole user base, last `weeks` weeks)
        w0 = week_start(today) - timedelta(weeks=weeks - 1)
        w0dt = datetime.combine(w0, dtime.min, UTC)
        comp = await events(["workout_completed"], w0dt, None, excl, v3_events=(version == "v3"), fields={"user_id": 1, "timestamp": 1})
        comp = [c for c in comp if keep(c.get("user_id"))]
        all_act = await db.daily_activity.find({"date": {"$gte": N(w0dt)}}, {"user_id": 1, "date": 1}).to_list(None)
        all_act = [a for a in all_act if keep(a.get("user_id"))]
        wpu = []
        for k in range(weeks):
            lo = w0 + timedelta(weeks=k)
            hi = lo + timedelta(days=7)
            wau = {a["user_id"] for a in all_act if lo <= _utc(a["date"]).date() < hi}
            wc = sum(1 for c in comp if lo <= _utc(c["timestamp"]).date() < hi)
            wpu.append({"week": lo.isoformat(), "active_users": len(wau), "workouts": wc,
                        "per_active_user": round(wc / len(wau), 2) if wau else None})

        # resurrected: active in the range after 14+ quiet days, with earlier history
        rng_act = [a for a in all_act if s.date() <= _utc(a["date"]).date() < e.date()]
        first_in: Dict[str, date] = {}
        for a in rng_act:
            u, d = a["user_id"], _utc(a["date"]).date()
            if u not in first_in or d < first_in[u]:
                first_in[u] = d
        resurrected = 0
        if first_in:
            prior = await db.daily_activity.find({"user_id": {"$in": list(first_in)}, "date": {"$lt": N(s)}}, {"user_id": 1, "date": 1}).to_list(None)
            last_before: Dict[str, date] = {}
            for a in prior:
                u, d = a["user_id"], _utc(a["date"]).date()
                last_before[u] = max(d, last_before.get(u, d))
            resurrected = sum(1 for u, d in first_in.items() if u in last_before and (d - last_before[u]).days >= 14)

        # V3 habit signals: of first completers in the range
        fc = await db.users.find({"milestones.first_workout_completed_at": {"$gte": N(s), "$lt": N(e)}}, {"milestones": 1}).to_list(None)
        fc = [u for u in fc if keep(str(u["_id"]))]
        fc_ids = [str(u["_id"]) for u in fc]
        fc_act = await db.daily_activity.find({"user_id": {"$in": fc_ids}}, {"user_id": 1, "date": 1}).to_list(None)
        fdays: Dict[str, Set[date]] = defaultdict(set)
        for a in fc_act:
            fdays[str(a["user_id"])].add(_utc(a["date"]).date())
        returned = sum(1 for u in fc if (u.get("milestones") or {}).get("second_workout_attempted_at")
                       or any(d > _utc(u["milestones"]["first_workout_completed_at"]).date() for d in fdays.get(str(u["_id"]), ())))
        attempted = sum(1 for u in fc if (u.get("milestones") or {}).get("second_workout_attempted_at"))
        cnt = Counter()
        if fc_ids:
            async for c in db.user_events.find({"event_type": "workout_completed", "user_id": {"$in": fc_ids}}, {"user_id": 1}):
                cnt[c["user_id"]] += 1
        second_done = sum(1 for u in fc_ids if cnt.get(u, 0) >= 2)

        # streaks among people active in the last 30 days
        recent = {a["user_id"] for a in all_act if _utc(a["date"]).date() >= today - timedelta(days=30)}
        streak_docs = await users_by_ids(recent, {"rt_streak_current": 1})
        buckets = [("0", 0, 0), ("1 day", 1, 1), ("2–3", 2, 3), ("4–6", 4, 6), ("7–13", 7, 13), ("14+", 14, 10 ** 6)]
        sd = Counter()
        for u in streak_docs.values():
            v = int(u.get("rt_streak_current") or 0)
            for lab, lo, hi in buckets:
                if lo <= v <= hi:
                    sd[lab] += 1
                    break

        vnote = " V3 users only." if version == "v3" else " V2 and V3 users."
        return {
            "range": {"start": s.isoformat(), "end": e.isoformat()}, "version": version,
            "headline": [
                card("d1", "D1 retention", dn(1)["rate"], fmt="pct", note="Of signups in the range old enough to measure, the share active the day after signing up." + vnote),
                card("d7", "D7 retention", dn(7)["rate"], fmt="pct", note="Active exactly 7 days after signup." + vnote),
                card("d30", "D30 retention", dn(30)["rate"], fmt="pct", note="Active exactly 30 days after signup." + vnote),
                card("w2_attempt", "First completers who try workout #2", pct(attempted, len(fc)), fmt="pct", v3_only=True,
                     tracking_since=await tracking_since("workout_start_gate"),
                     note="The key V3 habit signal: of people who finished a first workout in the range, the share who tried to start another."),
                card("return_after_1", "Return after workout #1", pct(returned, len(fc)), fmt="pct",
                     note="Of first completers in the range, the share active again on a later day."),
                card("second_completed", "Finished a second workout", pct(second_done, len(fc)), fmt="pct",
                     note="Of first completers in the range, the share with two or more completed workouts so far."),
                card("resurrected", "Resurrected users", resurrected,
                     note="Active in the range after 14 or more quiet days, with earlier history."),
            ],
            "curve": [dn(n) for n in (1, 3, 7, 14, 30)],
            "cohorts": heat,
            "workouts_per_active_user": wpu,
            "streaks": [{"bucket": lab, "users": sd.get(lab, 0)} for lab, _, _ in buckets],
            "note": "Active = did anything in the app that day (UTC days). Cohorts are signup weeks starting Monday.",
        }

    # ─────────────────────────────────────────────── REVENUE
    @r.get("/revenue")
    async def revenue(start: Optional[str] = None, end: Optional[str] = None, version: str = "all",
                      include_internal: bool = False, _: str = Depends(require_admin)):
        s, e = parse_range(start, end, 30)
        excl, keep = await scope(version, include_internal)
        evs = await events(["workout_start_gate", "paywall_viewed", "plan_selected", "purchase_completed", "subscription_started",
                            "subscription_renewed", "subscription_refunded", "subscription_expired", "subscription_cancelled",
                            "founding_banner_shown", "founding_banner_claim_tapped", "founding_modal_shown", "founding_member_modal_shown",
                            "founding_modal_claimed", "founding_member_claimed", "founding_modal_dismissed", "founding_member_modal_dismissed"],
                           s, e, excl)
        evs = [ev for ev in evs if keep(ev.get("user_id"))]
        by: Dict[str, List[dict]] = defaultdict(list)
        for ev in evs:
            by[ev["event_type"]].append(ev)
        users_of = lambda lst, pred=lambda md: True: {str(ev["user_id"]) for ev in lst if pred(ev.get("metadata") or {})}

        attempt = users_of(by["workout_start_gate"], lambda md: md.get("attempt") == "second_plus" and not md.get("has_full_access"))
        gated = attempt & users_of(by["workout_start_gate"], lambda md: md.get("allowed") is False)
        trig = lambda md: (md.get("trigger_source") or md.get("trigger")) == PAYWALL_TRIGGER_W2
        viewed = gated & users_of(by["paywall_viewed"], trig)
        selected = viewed & users_of(by["plan_selected"])
        ms_docs = await users_by_ids(gated, {"milestones": 1})

        def ms_in(u, f):
            t = _utc(((ms_docs.get(u) or {}).get("milestones") or {}).get(f))
            return bool(t and t >= s)
        trial = {u for u in viewed if ms_in(u, "trial_started_at") or ms_in(u, "first_paid_at")}
        paid = {u for u in viewed if ms_in(u, "first_paid_at")}
        w2 = funnel([("attempt", "Tried to start workout #2", len(attempt)), ("gate", "Hit the gate", len(gated)),
                     ("paywall", "Saw the paywall", len(viewed)), ("plan", "Selected a plan", len(selected)),
                     ("trial", "Started a trial", len(trial)), ("paid", "Paid", len(paid))],
                    "Free users in the range who tried to start a second workout, step by step. Each step is a subset of the one above. "
                    "Paid includes trials that have already converted.")

        # every paywall trigger, for comparison
        trig_rows = []
        pv: Dict[str, Set[str]] = defaultdict(set)
        for ev in by["paywall_viewed"]:
            md = ev.get("metadata") or {}
            pv[md.get("trigger_source") or md.get("trigger") or "unknown"].add(str(ev["user_id"]))
        all_viewers = set().union(*pv.values()) if pv else set()
        vdocs = await users_by_ids(all_viewers, {"milestones": 1})
        conv = {u for u, d in vdocs.items() if any(_utc((d.get("milestones") or {}).get(f)) and _utc((d.get("milestones") or {}).get(f)) >= s
                                                   for f in ("trial_started_at", "first_paid_at"))}
        for k, us in sorted(pv.items(), key=lambda x: -len(x[1])):
            trig_rows.append({"trigger": k, "viewers": len(us), "converted": len(us & conv), "conversion": pct(len(us & conv), len(us))})

        # subscribers right now (derived status, same logic as the Subscribers screen)
        plans: Counter = Counter()
        trials_now: Counter = Counter()
        mrr = 0.0
        try:
            from admin_analytics import count_subscribers_by_derived_status
            from product_pricing import monthly_price_for_plan
            subs = await count_subscribers_by_derived_status(db, include_internal=include_internal)
            for d in subs.get("active", []):
                if not keep(str(d["_id"])):
                    continue
                pid = (d.get("subscription") or {}).get("product_id")
                plans[PLAN_LABELS.get(pid, pid or "Unknown")] += 1
                mrr += monthly_price_for_plan(pid)
            for d in subs.get("trial", []):
                if keep(str(d["_id"])):
                    pid = (d.get("subscription") or {}).get("product_id")
                    trials_now[PLAN_LABELS.get(pid, pid or "Unknown")] += 1
        except Exception as ex:
            logger.warning(f"subscriber counts failed: {ex}")

        # trial -> paid among trials old enough to have converted (7-day trial + a day of grace)
        tq = {"milestones.trial_started_at": {"$gte": N(s - timedelta(days=60)), "$lt": N(datetime.now(UTC) - timedelta(days=8))}}
        tdocs = [d for d in await db.users.find(tq, {"milestones": 1}).to_list(None) if keep(str(d["_id"]))]
        t2p = pct(sum(1 for d in tdocs if (d.get("milestones") or {}).get("first_paid_at")), len(tdocs))

        rev = by["subscription_started"] + by["subscription_renewed"] + by["subscription_refunded"]
        paid_starts = [ev for ev in by["subscription_started"] if ((ev.get("metadata") or {}).get("plan_id")) in PAID_NO_TRIAL_SKUS]
        mix: Counter = Counter()
        for ev in paid_starts + by["subscription_renewed"]:
            pid = (ev.get("metadata") or {}).get("plan_id")
            mix[PLAN_LABELS.get(pid, pid or "Unknown")] += 1
        f_shown = users_of(by["founding_modal_shown"] + by["founding_member_modal_shown"])
        f_claimed = users_of(by["founding_modal_claimed"] + by["founding_member_claimed"])
        b_shown = users_of(by["founding_banner_shown"])
        b_tap = users_of(by["founding_banner_claim_tapped"])
        cancels = len(by["subscription_cancelled"]) + len(by["subscription_expired"])

        return {
            "range": {"start": s.isoformat(), "end": e.isoformat()}, "version": version,
            "headline": [
                card("revenue", "Revenue (gross)", revenue_of(rev), fmt="usd",
                     note="List price of paid starts and renewals minus refunds, from store server events, before commission."),
                card("mrr", "MRR", round(mrr, 2), fmt="usd",
                     note="Active paid subscribers right now, annual plans divided by 12. Trials not included."),
                card("active_subs", "Active subscribers", sum(plans.values()), note="Paying right now (derived status, not the raw store flag)."),
                card("in_trial", "In trial now", sum(trials_now.values()), note="People inside a free trial right now."),
                card("trial_to_paid", "Trial → paid", t2p, fmt="pct",
                     note="Of trials started in the 60 days before the range end that are old enough to have converted, the share that paid."),
                card("churn", "Cancellations + expiries", cancels, note="Store cancel and expiry notifications in the range."),
            ],
            "w2_funnel": w2,
            "w2_tracking_since": await tracking_since("workout_start_gate"),
            "by_trigger": trig_rows[:12],
            "plans_active": [{"plan": k, "subscribers": v} for k, v in plans.most_common()],
            "plans_trial": [{"plan": k, "trials": v} for k, v in trials_now.most_common()],
            "plan_mix_paid_events": [{"plan": k, "count": v} for k, v in mix.most_common()],
            "founding": {"modal_shown": len(f_shown), "modal_claimed": len(f_claimed), "modal_claim_rate": pct(len(f_claimed), len(f_shown)),
                         "banner_shown": len(b_shown), "banner_tapped": len(b_tap), "banner_tap_rate": pct(len(b_tap), len(b_shown))},
            "note": "Founding Member is its own plan. App Store Connect remains the source of truth for payouts.",
        }

    # ─────────────────────────────────────────────── USERS + LIFECYCLE
    STAGES = ["Onboarding", "Onboarded", "Activated", "Returned", "Habit", "At risk", "Lapsed"]

    def lifecycle(u: dict, recent: List[datetime], now: datetime) -> str:
        """Onboarding (no V3 profile) > Onboarded (profile, no finished workout) > Activated (first workout done) >
        Returned (tried another workout after the first) > Habit (2+ workouts in the last 7 days).
        At risk = no workout in 14 days, Lapsed = none in 30 (only for people who have finished one). Paying is separate."""
        ms = u.get("milestones") or {}
        first = _utc(ms.get("first_workout_completed_at"))
        if not first:
            has_profile = ms.get("v3_onboarded_at") or (u.get("training_profile") or {}).get("completed_at")
            return "Onboarded" if has_profile else "Onboarding"
        last = max(recent) if recent else first
        gap = (now - last).days
        if gap >= 30:
            return "Lapsed"
        if gap >= 14:
            return "At risk"
        if sum(1 for t in recent if (now - t).days < 7) >= 2:
            return "Habit"
        w2 = _utc(ms.get("second_workout_attempted_at"))
        return "Returned" if (w2 and w2 >= first) or len(recent) >= 2 else "Activated"

    def sub_state(u: dict) -> Optional[str]:
        try:
            from subscriber_directory import _classify
            return _classify(u)
        except Exception:
            return None

    async def recent_workouts(ids: Optional[List[str]] = None) -> Dict[str, List[datetime]]:
        q: Dict[str, Any] = {"event_type": "workout_completed", "timestamp": {"$gte": N(datetime.now(UTC) - timedelta(days=30))}}
        if ids is not None:
            q["user_id"] = {"$in": ids}
        out: Dict[str, List[datetime]] = defaultdict(list)
        async for ev in db.user_events.find(q, {"user_id": 1, "timestamp": 1}):
            out[str(ev["user_id"])].append(_utc(ev["timestamp"]))
        return out

    USER_FIELDS = {"username": 1, "email": 1, "name": 1, "created_at": 1, "milestones": 1, "training_profile": 1, "subscription": 1,
                   "is_comp": 1, "is_internal": 1, "founding_member": 1, "workouts_count": 1, "rt_streak_current": 1}

    @r.get("/users")
    async def users_list(q: Optional[str] = None, stage: Optional[str] = None, paying: Optional[bool] = None,
                         version: str = "all", include_internal: bool = False, limit: int = Query(50, le=500), skip: int = 0,
                         _: str = Depends(require_admin)):
        excl, keep = await scope(version, include_internal)
        filt: Dict[str, Any] = {}
        if q:
            import re
            rx = {"$regex": re.escape(q.strip()), "$options": "i"}
            ors: List[dict] = [{"username": rx}, {"email": rx}, {"name": rx}]
            try:
                ors.append({"_id": ObjectId(q.strip())})
            except Exception:
                pass
            filt["$or"] = ors
        docs = [u for u in await db.users.find(filt, USER_FIELDS).to_list(None) if keep(str(u["_id"]))]
        rw = await recent_workouts()
        now = datetime.now(UTC)
        v3ids = await v3_user_ids()
        rows = []
        for u in docs:
            uid = str(u["_id"])
            st = lifecycle(u, rw.get(uid, []), now)
            ss = sub_state(u)
            rows.append({
                "user_id": uid, "username": u.get("username"), "email": u.get("email"), "name": u.get("name"),
                "created_at": _utc(u.get("created_at")).isoformat() if _utc(u.get("created_at")) else None,
                "stage": st, "subscription": ss, "paying": ss == "active", "is_v3": uid in v3ids,
                "is_comp": bool(u.get("is_comp")), "is_internal": bool(u.get("is_internal")),
                "founding_member": bool(u.get("founding_member")), "workouts_count": int(u.get("workouts_count") or 0),
                "last_workout_at": max(rw[uid]).isoformat() if rw.get(uid) else None,
                "goal": (u.get("training_profile") or {}).get("goal"), "experience": (u.get("training_profile") or {}).get("experience"),
            })
        stage_counts = Counter(r_["stage"] for r_ in rows)
        if stage:
            rows = [r_ for r_ in rows if r_["stage"] == stage]
        if paying is not None:
            rows = [r_ for r_ in rows if r_["paying"] == paying]
        rows.sort(key=lambda r_: (r_["last_workout_at"] or "", r_["created_at"] or ""), reverse=True)
        return {"total": len(rows), "users": rows[skip:skip + limit],
                "stages": [{"stage": k, "users": stage_counts.get(k, 0)} for k in STAGES],
                "paying": sum(1 for r_ in rows if r_["paying"]),
                "note": "Lifecycle: Onboarding (no V3 profile), Onboarded (profile, no finished workout), Activated (first workout done), "
                        "Returned (tried another), Habit (2+ workouts in 7 days), At risk (none in 14 days), Lapsed (none in 30). Paying is shown separately."}

    @r.get("/users/{user_id}")
    async def user_detail(user_id: str, _: str = Depends(require_admin)):
        try:
            u = await db.users.find_one({"_id": ObjectId(user_id)}, USER_FIELDS)
        except Exception:
            u = None
        if not u:
            raise HTTPException(404, "User not found")
        uid = str(u["_id"])
        rw = await recent_workouts([uid])
        ws = await db.v3_workouts.find({"user_id": uid}, {
            "created_at": 1, "status": 1, "completed_at": 1, "duration_actual": 1, "fit_rating": 1, "mood_after": 1,
            "envelope.workout.direction": 1, "envelope.workout.archetype": 1, "envelope.workout.duration": 1,
            "envelope.workout.states": 1, "envelope.workout.target": 1, "envelope.workout.swap_count": 1,
            "envelope.workout.selection_source": 1}).sort("created_at", -1).to_list(200)
        started = set()
        async for ev in db.user_events.find({"user_id": uid, "event_type": {"$in": ["workout_start_gate", "v3_workout_started"]}}, {"metadata": 1, "event_type": 1}):
            md = ev.get("metadata") or {}
            if ev["event_type"] == "v3_workout_started" or md.get("allowed"):
                started.add(str(md.get("workout_id")))
        states = Counter()
        rows = []
        for d in ws:
            w = (d.get("envelope") or {}).get("workout") or {}
            for st in w.get("states") or []:
                states[st] += 1
            rows.append({
                "workout_id": str(d["_id"]), "created_at": _utc(d.get("created_at")).isoformat() if _utc(d.get("created_at")) else None,
                "direction": w.get("direction"), "archetype": (w.get("archetype") or {}).get("name"),
                "requested_minutes": (w.get("duration") or {}).get("requested_minutes"),
                "estimated_minutes": (w.get("duration") or {}).get("estimated_minutes"),
                "states": w.get("states") or [], "target": (w.get("target") or {}).get("label"),
                "different_workout_count": w.get("swap_count") or 0,
                "started": str(d["_id"]) in started or d.get("status") == "completed",
                "status": d.get("status"), "completed_at": _utc(d.get("completed_at")).isoformat() if _utc(d.get("completed_at")) else None,
                "duration_actual": d.get("duration_actual"), "fit_rating": d.get("fit_rating"),
            })
        ms = {k: (_utc(v).isoformat() if _utc(v) else v) for k, v in (u.get("milestones") or {}).items()}
        tp = dict(u.get("training_profile") or {})
        for k, v in list(tp.items()):
            if isinstance(v, datetime):
                tp[k] = _utc(v).isoformat()
        sub = dict(u.get("subscription") or {})
        return {
            "user_id": uid, "username": u.get("username"), "email": u.get("email"), "name": u.get("name"),
            "created_at": _utc(u.get("created_at")).isoformat() if _utc(u.get("created_at")) else None,
            "stage": lifecycle(u, rw.get(uid, []), datetime.now(UTC)), "subscription_state": sub_state(u),
            "subscription": {"product_id": sub.get("product_id"), "plan": PLAN_LABELS.get(sub.get("product_id")), "status": sub.get("status"),
                             "expiration_date": str(sub.get("expiration_date")) if sub.get("expiration_date") else None},
            "is_v3": uid in await v3_user_ids(), "is_comp": bool(u.get("is_comp")), "is_internal": bool(u.get("is_internal")),
            "founding_member": bool(u.get("founding_member")), "workouts_count": int(u.get("workouts_count") or 0),
            "streak": int(u.get("rt_streak_current") or 0), "milestones": ms, "training_profile": tp,
            "v3_summary": {"generated": len(rows), "started": sum(1 for x in rows if x["started"]),
                           "completed": sum(1 for x in rows if x["status"] == "completed"),
                           "states_used": [{"state": k, "count": v} for k, v in states.most_common()]},
            "v3_workouts": rows,
        }

    @r.post("/users/{user_id}/internal")
    async def set_internal(user_id: str, value: bool = True, admin_id: str = Depends(require_admin)):
        """Flag / unflag a test account. Internal accounts are left out of every dashboard number by default."""
        try:
            oid = ObjectId(user_id)
        except Exception:
            raise HTTPException(400, "Bad user id")
        res = await db.users.update_one({"_id": oid}, {"$set": {"is_internal": bool(value)}})
        if not res.matched_count:
            raise HTTPException(404, "User not found")
        cache.clear()
        return {"ok": True, "user_id": user_id, "is_internal": bool(value)}

    TRACKED = [("workout_start_gate", "Workout start gate (server)"), ("v3_workout_generated", "Workout generated (server)"),
               ("explore_viewed", "Explore viewed"), ("workout_completed", "Workout completed (server for V3)"),
               ("v3_workout_started", "Guided Session started"), ("v3_cart_viewed", "Cart viewed"), ("v3_home_viewed", "Home viewed"),
               ("onboarding_step_viewed", "Onboarding step viewed"), ("paywall_viewed", "Paywall viewed")]

    @r.get("/tracking-health")
    async def tracking_health(_: str = Depends(require_admin)):
        """Is each launch-critical event arriving? First seen, last seen, last-7-day volume, and V3 build share."""
        week = N(datetime.now(UTC) - timedelta(days=7))
        rows = []
        for t, label in TRACKED:
            first = await db.user_events.find_one({"event_type": t}, {"timestamp": 1}, sort=[("timestamp", 1)])
            last = await db.user_events.find_one({"event_type": t}, {"timestamp": 1}, sort=[("timestamp", -1)])
            n7 = await db.user_events.count_documents({"event_type": t, "timestamp": {"$gte": week}})
            v3n = await db.user_events.count_documents({"event_type": t, "timestamp": {"$gte": week}, "$or": V3_EVENT_OR})
            rows.append({"event": t, "label": label, "first_seen": _day(first["timestamp"]) if first else None,
                         "last_seen": _utc(last["timestamp"]).isoformat() if last else None, "last_7d": n7, "v3_share_pct": pct(v3n, n7)})
        ms_users = await db.users.count_documents({"milestones": {"$exists": True}})
        internal = await db.users.count_documents({"is_internal": True})
        builds = Counter()
        async for ev in db.user_events.find({"timestamp": {"$gte": week}, "metadata.app_version": {"$exists": True}}, {"metadata.app_version": 1}).limit(20000):
            builds[str((ev.get("metadata") or {}).get("app_version"))] += 1
        return {"events": rows, "users_with_milestones": ms_users, "internal_accounts": internal,
                "app_versions_7d": [{"version": k, "events": v} for k, v in builds.most_common(8)]}

    @r.post("/backfill-milestones")
    async def backfill(dry_run: bool = False, _: str = Depends(require_admin)):
        from v3_tracking import backfill_milestones
        counts = await backfill_milestones(db, dry_run=dry_run)
        cache.clear()
        return {"dry_run": dry_run, "stamped": counts}

    return r
