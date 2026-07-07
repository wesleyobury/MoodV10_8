"""
Store metrics — daily downloads/installs per platform.

Persists one document per (date, platform) in the `store_metrics` collection so
the acquisition funnel has a stable, queryable top-of-funnel number that doesn't
require hitting Apple/Google on every dashboard load.

    { date: "2026-07-04", platform: "apple", downloads: 206,
      redownloads: 12, updates: 40, raw: {...}, updated_at: <dt> }

`sync_store_metrics` pulls the last N days from both stores and upserts them.
Each platform degrades independently: if Apple is configured but Google isn't
(or vice-versa), the configured one still syncs.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta, date
from typing import Any, Dict, List, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase

import app_store_connect as asc
import google_play_reports as gpr

logger = logging.getLogger(__name__)

COLLECTION = "store_metrics"
PLATFORMS = ("apple", "google")


async def ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    await db[COLLECTION].create_index([("date", 1), ("platform", 1)], unique=True, name="date_platform_uniq")


async def upsert_daily(
    db: AsyncIOMotorDatabase,
    platform: str,
    date_iso: str,
    downloads: int,
    extra: Optional[Dict[str, Any]] = None,
) -> None:
    doc = {"downloads": int(downloads or 0), "updated_at": datetime.now(timezone.utc)}
    if extra:
        doc.update(extra)
    await db[COLLECTION].update_one(
        {"date": date_iso, "platform": platform},
        {"$set": doc, "$setOnInsert": {"date": date_iso, "platform": platform}},
        upsert=True,
    )


def _platform_status() -> Dict[str, Dict[str, object]]:
    return {"apple": asc.config_status(), "google": gpr.config_status()}


async def sync_store_metrics(db: AsyncIOMotorDatabase, days: int = 7) -> Dict[str, Any]:
    """
    Pull the last `days` days (ending yesterday — Apple's same-day report isn't
    ready) from each configured store and upsert them. Never raises; returns a
    per-day/per-platform report of what synced, was skipped, or errored.
    """
    today = datetime.now(timezone.utc).date()
    dates = [today - timedelta(days=n) for n in range(1, max(1, days) + 1)]

    fetchers = {"apple": asc, "google": gpr}
    result: Dict[str, Any] = {
        "synced": [],
        "skipped": {"apple": 0, "google": 0},
        "errors": [],
        "configured": {p: fetchers[p].is_configured() for p in PLATFORMS},
        "ran_at": datetime.now(timezone.utc).isoformat(),
    }

    for platform, mod in fetchers.items():
        if not mod.is_configured():
            result["skipped"][platform] = len(dates)
            continue
        for d in dates:
            try:
                data = await mod.get_downloads_for_date(d)
            except mod.NotConfigured:
                result["skipped"][platform] += 1
                continue
            except Exception as e:  # network / auth / parse — log and continue
                result["errors"].append({"platform": platform, "date": d.isoformat(), "error": str(e)})
                logger.warning("store sync %s %s failed: %s", platform, d.isoformat(), e)
                continue
            if data is None:
                continue  # no report for that day yet
            extra = {k: v for k, v in data.items() if k not in ("downloads", "date", "platform")}
            await upsert_daily(db, platform, d.isoformat(), data["downloads"], extra)
            result["synced"].append({"platform": platform, "date": d.isoformat(), "downloads": data["downloads"]})

    return result


async def get_downloads_in_range(
    db: AsyncIOMotorDatabase,
    start_date: datetime,
    end_date: datetime,
) -> Dict[str, Any]:
    """
    Aggregate stored downloads within [start, end] (inclusive by day).

    Returns total, per-platform totals, a daily series, coverage info, and the
    live config status so the UI can tell "0 downloads" apart from "not synced".
    """
    start_iso = start_date.date().isoformat() if isinstance(start_date, datetime) else str(start_date)
    end_iso = end_date.date().isoformat() if isinstance(end_date, datetime) else str(end_date)

    docs = await db[COLLECTION].find(
        {"date": {"$gte": start_iso, "$lte": end_iso}}
    ).to_list(length=10000)

    by_platform = {p: 0 for p in PLATFORMS}
    series_map: Dict[str, Dict[str, int]] = {}
    for doc in docs:
        p = doc.get("platform")
        dl = int(doc.get("downloads", 0) or 0)
        if p in by_platform:
            by_platform[p] += dl
        day = series_map.setdefault(doc["date"], {"apple": 0, "google": 0})
        if p in day:
            day[p] = dl

    series = [
        {"date": d, "apple": series_map[d].get("apple", 0), "google": series_map[d].get("google", 0),
         "total": series_map[d].get("apple", 0) + series_map[d].get("google", 0)}
        for d in sorted(series_map)
    ]
    total = sum(by_platform.values())
    last = await db[COLLECTION].find_one(sort=[("date", -1)])

    return {
        "total": total,
        "by_platform": by_platform,
        "series": series,
        "days_with_data": len(series_map),
        "configured": {p: (asc if p == "apple" else gpr).is_configured() for p in PLATFORMS},
        "status": _platform_status(),
        "last_synced_date": last.get("date") if last else None,
    }
