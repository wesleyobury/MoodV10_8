#!/usr/bin/env python3
"""
paywall_gate_analysis.py — READ-ONLY analysis for the Hard Paywall #3 gate decision.

Answers three questions:
  1. Workout ordinal funnel — of users who complete workout 1, how many reach 2 and 3?
  2. Exploration hypothesis — how long do first sessions ACTUALLY last?
  3. Paywall conversion by trigger source.

Run this ON the host where the backend runs (MONGO_URL points at localhost there).

    cd /app/backend            # or wherever server.py lives
    python3 paywall_gate_analysis.py

Options:
    --days N        Limit to events in the last N days (default: all time)
    --json out.json Also write raw results to a JSON file
    --include-internal   Include is_internal staff accounts (default: excluded)

This script performs ONLY find/aggregate/count operations. It never writes.
"""

import argparse
import json
import os
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

try:
    from pymongo import MongoClient
except ImportError:
    sys.exit("pymongo not found. Run this inside the backend venv (pymongo is already a dependency).")


# ---------------------------------------------------------------- helpers

def load_env(path=".env"):
    """Minimal .env reader so we don't depend on python-dotenv being importable."""
    env = {}
    if not os.path.exists(path):
        return env
    with open(path) as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            env[key.strip()] = val.strip().strip('"').strip("'")
    return env


def pct(numerator, denominator):
    return (100.0 * numerator / denominator) if denominator else 0.0


def percentile(sorted_values, p):
    """Linear-interpolated percentile. p in 0..100. Assumes sorted input."""
    if not sorted_values:
        return None
    if len(sorted_values) == 1:
        return sorted_values[0]
    k = (len(sorted_values) - 1) * (p / 100.0)
    lo, hi = int(k), min(int(k) + 1, len(sorted_values) - 1)
    if lo == hi:
        return sorted_values[lo]
    return sorted_values[lo] + (sorted_values[hi] - sorted_values[lo]) * (k - lo)


def fmt_secs(s):
    if s is None:
        return "n/a"
    return f"{s/60:.1f} min ({int(s)}s)"


def header(title):
    print()
    print("=" * 72)
    print(title)
    print("=" * 72)


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--days", type=int, default=0, help="limit to last N days (0 = all time)")
    ap.add_argument("--json", dest="json_out", default=None, help="write raw results to this JSON file")
    ap.add_argument("--include-internal", action="store_true", help="include is_internal staff accounts")
    ap.add_argument("--env", default=".env", help="path to backend .env (default: ./.env)")
    args = ap.parse_args()

    env = load_env(args.env)
    mongo_url = os.environ.get("MONGO_URL") or env.get("MONGO_URL") or "mongodb://localhost:27017"
    db_name = os.environ.get("DB_NAME") or env.get("DB_NAME") or "test_database"

    safe_url = mongo_url
    if "@" in safe_url:
        scheme, _, rest = safe_url.partition("://")
        safe_url = f"{scheme}://<redacted>@{rest.split('@', 1)[1]}"
    print(f"Connecting to {safe_url}  db={db_name}")

    client = MongoClient(mongo_url, serverSelectionTimeoutMS=8000)
    db = client[db_name]
    client.admin.command("ping")

    results = {"db": db_name, "generated_at": datetime.now(timezone.utc).isoformat()}

    # ---- time window -------------------------------------------------
    time_filter = {}
    if args.days > 0:
        cutoff = datetime.now(timezone.utc) - timedelta(days=args.days)
        time_filter = {"timestamp": {"$gte": cutoff}}
        print(f"Window: last {args.days} days (since {cutoff.date()})")
    else:
        print("Window: all time")
    results["window_days"] = args.days or None

    # ---- internal users ----------------------------------------------
    internal_ids = set()
    if not args.include_internal:
        internal_ids = {str(u["_id"]) for u in db.users.find({"is_internal": True}, {"_id": 1})}
        print(f"Excluding {len(internal_ids)} internal/staff account(s)")
    results["internal_excluded"] = len(internal_ids)

    def not_internal(uid):
        return uid and uid not in internal_ids

    # =================================================================
    # 1. WORKOUT ORDINAL FUNNEL
    # =================================================================
    header("1. WORKOUT ORDINAL FUNNEL — do users come back for workout 2?")

    def counts_by_user(event_type):
        pipeline = [
            {"$match": {"event_type": event_type, "user_id": {"$ne": None}, **time_filter}},
            {"$group": {"_id": "$user_id", "n": {"$sum": 1}}},
        ]
        out = {}
        for row in db.user_events.aggregate(pipeline, allowDiskUse=True):
            uid = str(row["_id"])
            if not_internal(uid):
                out[uid] = row["n"]
        return out

    started = counts_by_user("workout_started")
    completed = counts_by_user("workout_completed")

    # Cross-check against the authoritative workout log collection.
    log_pipeline = [{"$group": {"_id": "$user_id", "n": {"$sum": 1}}}]
    logged = {}
    for row in db.user_workouts.aggregate(log_pipeline, allowDiskUse=True):
        uid = str(row["_id"]) if row["_id"] else None
        if not_internal(uid):
            logged[uid] = row["n"]

    def ladder(counts, label):
        total = len(counts)
        rungs = {}
        for n in (1, 2, 3, 4, 5):
            rungs[n] = sum(1 for v in counts.values() if v >= n)
        print(f"\n  {label}  (users with at least N)")
        base = rungs.get(1, 0)
        prev = None
        for n in (1, 2, 3, 4, 5):
            c = rungs[n]
            step = f"   step: {pct(c, prev):5.1f}% of prev" if prev else ""
            print(f"    >= {n}: {c:6d} users  ({pct(c, base):5.1f}% of those with >=1){step}")
            prev = c
        return {"total_users": total, "rungs": rungs}

    results["started"] = ladder(started, "workout_started")
    results["completed"] = ladder(completed, "workout_completed (event stream)")
    results["logged"] = ladder(logged, "user_workouts rows (authoritative log)")

    # The true "attempted workout 2" signal: a user blocked by the hard paywall
    # may never emit a second workout_started, because the gate fires on the
    # Start tap. Count them via the paywall event instead.
    hard_trigger = "start_workout_after_free_session"
    blocked_users = set()
    for row in db.user_events.aggregate([
        {"$match": {"event_type": "paywall_viewed",
                    "metadata.trigger_source": hard_trigger, **time_filter}},
        {"$group": {"_id": "$user_id"}},
    ], allowDiskUse=True):
        uid = str(row["_id"]) if row["_id"] else None
        if not_internal(uid):
            blocked_users.add(uid)

    one_plus = {u for u, v in completed.items() if v >= 1}
    two_plus_started = {u for u, v in started.items() if v >= 2}
    attempted_w2 = (two_plus_started | blocked_users) & one_plus if one_plus else set()

    print(f"\n  Users who completed >=1 workout:                {len(one_plus):6d}")
    print(f"  ...who hit the hard paywall (blocked at W2):    {len(blocked_users & one_plus):6d}"
          f"  ({pct(len(blocked_users & one_plus), len(one_plus)):.1f}%)")
    print(f"  ...who attempted W2 at all (start OR blocked):  {len(attempted_w2):6d}"
          f"  ({pct(len(attempted_w2), len(one_plus)):.1f}%)")
    print("\n  ^ This last number is the reach cost of moving the gate to workout 3:")
    print("    it is the population that currently sees the hard wall.")

    results["hard_paywall"] = {
        "completed_1_plus": len(one_plus),
        "blocked_at_w2": len(blocked_users & one_plus),
        "attempted_w2": len(attempted_w2),
    }

    # =================================================================
    # 2. EXPLORATION HYPOTHESIS — real elapsed time on first sessions
    # =================================================================
    header("2. EXPLORATION HYPOTHESIS — how long do first sessions really last?")
    print("  Source: user_events.workout_session_completed.metadata.duration_seconds")
    print("  (This is real elapsed time. Note that user_workouts.duration_actual is")
    print("   NOT elapsed — it is populated with the workout's PLANNED length.)")

    first_session = {}
    all_sessions = defaultdict(list)
    for ev in db.user_events.find(
        {"event_type": "workout_session_completed", **time_filter},
        {"user_id": 1, "timestamp": 1, "metadata.duration_seconds": 1},
    ).sort("timestamp", 1):
        uid = str(ev.get("user_id")) if ev.get("user_id") else None
        if not not_internal(uid):
            continue
        secs = (ev.get("metadata") or {}).get("duration_seconds")
        if secs is None:
            continue
        try:
            secs = float(secs)
        except (TypeError, ValueError):
            continue
        all_sessions[uid].append(secs)
        if uid not in first_session:
            first_session[uid] = secs

    def duration_report(values, label):
        vals = sorted(values)
        if not vals:
            print(f"\n  {label}: no data")
            return None
        print(f"\n  {label}  (n={len(vals)})")
        for p in (10, 25, 50, 75, 90):
            print(f"    p{p:<3d} {fmt_secs(percentile(vals, p))}")
        print(f"    mean {fmt_secs(sum(vals)/len(vals))}")
        for thresh, name in ((60, "1 min"), (120, "2 min"), (300, "5 min"), (600, "10 min")):
            c = sum(1 for v in vals if v < thresh)
            print(f"    under {name:<7s} {c:6d}  ({pct(c, len(vals)):5.1f}%)")
        return {
            "n": len(vals),
            "p10": percentile(vals, 10), "p25": percentile(vals, 25),
            "p50": percentile(vals, 50), "p75": percentile(vals, 75),
            "p90": percentile(vals, 90),
            "mean": sum(vals) / len(vals),
            "under_60s": sum(1 for v in vals if v < 60),
            "under_120s": sum(1 for v in vals if v < 120),
            "under_300s": sum(1 for v in vals if v < 300),
        }

    results["first_session_seconds"] = duration_report(
        list(first_session.values()), "FIRST session per user")
    second_sessions = [v[1] for v in all_sessions.values() if len(v) > 1]
    results["second_session_seconds"] = duration_report(
        second_sessions, "SECOND session per user")
    results["all_session_seconds"] = duration_report(
        [s for v in all_sessions.values() for s in v], "ALL sessions")

    # Planned duration, for the elapsed-vs-planned ratio.
    planned = []
    for ev in db.user_events.find(
        {"event_type": "workout_completed", **time_filter},
        {"user_id": 1, "metadata.duration_minutes": 1},
    ):
        uid = str(ev.get("user_id")) if ev.get("user_id") else None
        if not not_internal(uid):
            continue
        mins = (ev.get("metadata") or {}).get("duration_minutes")
        if mins:
            try:
                planned.append(float(mins) * 60)
            except (TypeError, ValueError):
                pass
    if planned and results.get("first_session_seconds"):
        med_planned = percentile(sorted(planned), 50)
        med_actual = results["first_session_seconds"]["p50"]
        print(f"\n  Median PLANNED workout length: {fmt_secs(med_planned)}")
        print(f"  Median ACTUAL first session:   {fmt_secs(med_actual)}")
        if med_planned:
            ratio = med_actual / med_planned
            print(f"  Ratio actual/planned:          {ratio:.2f}")
            print("\n  READ: ratio well under ~0.5 supports the exploration hypothesis")
            print("        (people 'complete' workouts without training).")
            print("        Ratio near or above 1.0 means first sessions are real workouts.")
            results["median_planned_seconds"] = med_planned
            results["actual_to_planned_ratio"] = ratio

    # =================================================================
    # 3. PAYWALL CONVERSION BY TRIGGER SOURCE
    # =================================================================
    header("3. PAYWALL CONVERSION BY TRIGGER SOURCE")

    def by_trigger(event_type):
        users = defaultdict(set)
        events = Counter()
        for ev in db.user_events.find(
            {"event_type": event_type, **time_filter},
            {"user_id": 1, "metadata.trigger_source": 1},
        ):
            uid = str(ev.get("user_id")) if ev.get("user_id") else None
            if not not_internal(uid):
                continue
            trig = (ev.get("metadata") or {}).get("trigger_source") or "unknown"
            users[trig].add(uid)
            events[trig] += 1
        return {t: {"users": len(u), "events": events[t]} for t, u in users.items()}

    views = by_trigger("paywall_viewed")
    trials = by_trigger("trial_started")
    purchases = by_trigger("purchase_completed")
    purchases_alt = by_trigger("subscription_purchased")
    for t, v in purchases_alt.items():
        purchases.setdefault(t, {"users": 0, "events": 0})
        purchases[t]["users"] += v["users"]
        purchases[t]["events"] += v["events"]

    print(f"\n  {'trigger_source':<42} {'viewed':>8} {'trial':>8} {'paid':>8} {'v→t':>7}")
    print("  " + "-" * 76)
    for trig in sorted(set(views) | set(trials) | set(purchases)):
        v = views.get(trig, {}).get("users", 0)
        t = trials.get(trig, {}).get("users", 0)
        p = purchases.get(trig, {}).get("users", 0)
        print(f"  {trig[:42]:<42} {v:>8} {t:>8} {p:>8} {pct(t, v):>6.1f}%")
    results["paywall"] = {"viewed": views, "trial_started": trials, "purchased": purchases}

    print("\n  READ: compare the hard-gate row (start_workout_after_free_session)")
    print("        against the soft rows. If the hard gate converts far better,")
    print("        keeping it early is worth more than the extra free workout.")

    # =================================================================
    # 4. CURRENT WALL POPULATION
    # =================================================================
    header("4. WHERE USERS SIT AGAINST THE FREE ALLOWANCE")
    dist = Counter()
    for u in db.users.find({}, {"free_workouts_used": 1, "is_internal": 1}):
        if not args.include_internal and u.get("is_internal"):
            continue
        dist[int(u.get("free_workouts_used") or 0)] += 1
    total_users = sum(dist.values())
    print(f"\n  free_workouts_used distribution (n={total_users} users)")
    for k in sorted(dist)[:10]:
        print(f"    {k}: {dist[k]:6d}  ({pct(dist[k], total_users):5.1f}%)")
    results["free_workouts_used_distribution"] = dict(dist)
    print("\n  With FREE_WORKOUT_ALLOWANCE = 1, everyone at >= 1 is currently walled.")
    print("  Bumping the allowance to 2 hands a free workout back to all of them.")

    if args.json_out:
        with open(args.json_out, "w") as fh:
            json.dump(results, fh, indent=2, default=str)
        print(f"\nRaw results written to {args.json_out}")

    print("\nDone. No writes were performed.\n")


if __name__ == "__main__":
    main()
