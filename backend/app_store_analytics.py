"""
App Store Connect — Analytics Reports client (the "App Analytics" downloads number).

Why this file exists
---------------------
`app_store_connect.py` reads the **Sales and Trends Reports** API ("App Units").
That feed stopped producing data for MOOD on **2026-06-22** — every day since
has 404'd with no error (confirmed by direct sync tests). The timing lines up
with the Apple Developer account's individual -> organization migration
(D-U-N-S / binding-authority paperwork, see memory). Sales/Trends reports are
tied to the Paid Apps Agreement, which goes inactive mid-migration even though
the app itself keeps shipping and App Analytics keeps working — App Analytics
is NOT gated by the Paid Apps Agreement, which is exactly why Wes can see
"68 First-Time Downloads, Sep 17-Oct 16" in the App Store Connect UI while our
Sales-Reports-based sync shows 0 for the same window.

This module reads that same number from its real source: the **Analytics
Reports API** (`/v1/analyticsReportRequests` -> reports -> instances ->
segments), report category APP_STORE_ENGAGEMENT, report "App Store Downloads".
That's the dataset backing the App Analytics tab in App Store Connect, so once
wired up its numbers should match what Wes sees on screen there.

Important Apple-side constraints (cannot be engineered around):
  - An app needs an ONGOING analyticsReportRequest before any instances exist.
    The first request has to be created once; Apple then starts producing
    daily report instances going forward (and backfills a short window, not
    full history). So the first sync after this ships may come back nearly
    empty — that's Apple's processing lag, not a bug here. Expect same-day
    freshness only a few days after the first successful request.
  - Only one ONGOING request per (app, per report-category tree) is allowed.
    We look for an existing one before creating a new one.
  - Segment URLs are pre-signed (no Authorization header) and expire quickly
    -- fetch them promptly after listing, don't cache the URL itself.

Configuration (environment variables)
--------------------------------------
Reuses ASC_KEY_ID / ASC_ISSUER_ID / ASC_VENDOR_NUMBER* / ASC_PRIVATE_KEY(_PATH)
from app_store_connect.py (*vendor number not needed here, app id is).
ASC_APP_ID   The app's App Store Connect numeric id. Defaults to MOOD's id
             (6756556024, from frontend/eas.json `submit.production.ascAppId`)
             but can be overridden.
"""
from __future__ import annotations

import csv
import gzip
import io
import logging
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional

import httpx

from app_store_connect import (  # reuse auth + config, don't duplicate it
    NotConfigured,
    _build_jwt,
    is_configured as _sales_is_configured,
)
import os

logger = logging.getLogger(__name__)

ASC_API_V1 = "https://api.appstoreconnect.apple.com/v1"
_DEFAULT_APP_ID = "6756556024"  # frontend/eas.json submit.production.ascAppId (MOOD)
REPORT_NAME = "App Store Downloads"
REPORT_CATEGORY = "APP_STORE_ENGAGEMENT"


def app_id() -> str:
    return os.environ.get("ASC_APP_ID", "").strip() or _DEFAULT_APP_ID


def is_configured() -> bool:
    # Same credentials as Sales Reports; just need the app id too (has a default).
    return _sales_is_configured()


def config_status() -> Dict[str, object]:
    return {
        "platform": "apple_analytics",
        "app_id": app_id(),
        "configured": is_configured(),
        "note": "Reads the same App Analytics 'Downloads' number shown in App Store Connect's Analytics tab "
                "(not the Sales/Trends feed, which has been empty since 2026-06-22).",
    }


async def _get(client: httpx.AsyncClient, url: str, params: Optional[dict] = None) -> dict:
    headers = {"Authorization": f"Bearer {_build_jwt()}"}
    resp = await client.get(url, params=params, headers=headers, timeout=30.0)
    resp.raise_for_status()
    return resp.json()


async def _post(client: httpx.AsyncClient, url: str, body: dict) -> dict:
    headers = {"Authorization": f"Bearer {_build_jwt()}", "Content-Type": "application/json"}
    resp = await client.post(url, json=body, headers=headers, timeout=30.0)
    resp.raise_for_status()
    return resp.json()


async def _ensure_ongoing_request(client: httpx.AsyncClient) -> str:
    """Return the id of an ONGOING analyticsReportRequest for the app, creating one if absent."""
    aid = app_id()
    existing = await _get(client, f"{ASC_API_V1}/apps/{aid}/analyticsReportRequests",
                          params={"filter[accessType]": "ONGOING"})
    for row in existing.get("data", []):
        if (row.get("attributes") or {}).get("accessType") == "ONGOING":
            return row["id"]
    created = await _post(client, f"{ASC_API_V1}/analyticsReportRequests", {
        "data": {
            "type": "analyticsReportRequests",
            "attributes": {"accessType": "ONGOING"},
            "relationships": {"app": {"data": {"type": "apps", "id": aid}}},
        }
    })
    logger.info("app_store_analytics: created ONGOING analyticsReportRequest %s for app %s — "
                "Apple needs a few days to start producing instances", created["data"]["id"], aid)
    return created["data"]["id"]


async def _find_downloads_report_id(client: httpx.AsyncClient, request_id: str) -> Optional[str]:
    data = await _get(client, f"{ASC_API_V1}/analyticsReportRequests/{request_id}/reports",
                      params={"filter[category]": REPORT_CATEGORY})
    for row in data.get("data", []):
        if (row.get("attributes") or {}).get("name") == REPORT_NAME:
            return row["id"]
    return None


async def _list_daily_instances(client: httpx.AsyncClient, report_id: str) -> List[dict]:
    data = await _get(client, f"{ASC_API_V1}/analyticsReports/{report_id}/instances",
                      params={"filter[granularity]": "DAILY"})
    return data.get("data", [])


async def _segment_urls(client: httpx.AsyncClient, instance_id: str) -> List[str]:
    data = await _get(client, f"{ASC_API_V1}/analyticsReportInstances/{instance_id}/segments")
    return [row["attributes"]["url"] for row in data.get("data", []) if (row.get("attributes") or {}).get("url")]


def _parse_downloads_csv(raw: bytes) -> Dict[str, int]:
    """Gunzip + parse one 'App Store Downloads' segment into {date_iso: first_time_download_count}."""
    try:
        text = gzip.GzipFile(fileobj=io.BytesIO(raw)).read().decode("utf-8", errors="replace")
    except OSError:
        text = raw.decode("utf-8", errors="replace")
    out: Dict[str, int] = {}
    reader = csv.DictReader(io.StringIO(text), delimiter="\t")
    for row in reader:
        # Column names per Apple's Analytics Reports schema; tolerate minor naming drift.
        dl_type = (row.get("Download Type") or row.get("Event") or "").strip()
        if dl_type and dl_type != "First-Time Download":
            continue  # Redownload / Auto-Download rows excluded — we want first-time only, like the screenshot
        day = (row.get("Date") or "").strip()
        counts_raw = (row.get("Counts") or row.get("Count") or "0").strip()
        if not day:
            continue
        try:
            d_iso = datetime.strptime(day, "%Y-%m-%d").date().isoformat()
        except ValueError:
            d_iso = day  # already ISO in some report versions
        try:
            n = int(float(counts_raw or "0"))
        except ValueError:
            n = 0
        out[d_iso] = out.get(d_iso, 0) + n
    return out


async def fetch_recent_first_time_downloads(days: int = 45) -> Dict[str, Any]:
    """
    Walk the ONGOING App Store Downloads report's recent DAILY instances and
    return {date_iso: first_time_downloads}. Creates the ONGOING request if one
    doesn't exist yet (first call after this ships); returns an explanatory
    status instead of raising so callers can surface it cleanly.
    """
    if not is_configured():
        raise NotConfigured("App Store Connect reporting is not configured")

    async with httpx.AsyncClient() as client:
        request_id = await _ensure_ongoing_request(client)
        report_id = await _find_downloads_report_id(client, request_id)
        if not report_id:
            return {
                "by_date": {}, "status": "pending",
                "note": "ONGOING analytics report request exists but Apple hasn't generated the "
                        "'App Store Downloads' report yet — this can take a few days after first setup.",
            }
        instances = await _list_daily_instances(client, report_id)
        if not instances:
            return {"by_date": {}, "status": "pending",
                    "note": "Report exists but has no DAILY instances yet — check back in a day or two."}

        by_date: Dict[str, int] = {}
        # Newest first; cap how many instances we pull per call to keep this fast.
        for inst in sorted(instances, key=lambda r: (r.get("attributes") or {}).get("processingDate") or "",
                           reverse=True)[:days]:
            try:
                urls = await _segment_urls(client, inst["id"])
            except Exception as e:
                logger.warning("app_store_analytics: segments for instance %s failed: %s", inst["id"], e)
                continue
            for url in urls:
                try:
                    r = await client.get(url, timeout=60.0)  # pre-signed; no auth header
                    r.raise_for_status()
                except Exception as e:
                    logger.warning("app_store_analytics: segment download failed: %s", e)
                    continue
                day_counts = _parse_downloads_csv(r.content)
                for d, n in day_counts.items():
                    by_date[d] = by_date.get(d, 0) + n

        return {"by_date": by_date, "status": "ok", "fetched_at": datetime.now(timezone.utc).isoformat()}
