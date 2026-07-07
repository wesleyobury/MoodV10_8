"""
Google Play — install reports client (downloads / installs).

Google Play does not expose install counts through the Android Publisher API.
They live as monthly CSV "statistics" files in the developer's Cloud Storage
reporting bucket:

    gs://<bucket>/stats/installs/installs_<package>_YYYYMM_overview.csv

We read those blobs with the SAME service account already used for purchase
verification (google_play_verifier), via the Cloud Storage JSON API — so no new
heavy dependency (google-cloud-storage) is required, just google-auth + requests
which are already installed. The service account must have read access to the
reporting bucket (Play Console → Download reports → Statistics shows the
gs:// URI; grant the SA "Storage Object Viewer").

Configuration (environment variables)
-------------------------------------
GOOGLE_PLAY_REPORTS_BUCKET   The reporting bucket id, e.g. pubsite_prod_1234567890
                             (with or without the gs:// prefix).  *Required for Google.*
GOOGLE_PLAY_SERVICE_ACCOUNT_JSON / _FILE   Reused from purchase verification.
GOOGLE_PLAY_PACKAGE_NAME     Defaults to com.official.moodapp.

The "downloads" figure used at the top of the funnel is **Daily User Installs**
(unique users installing for the first time that day) — the closest analog to
Apple's first-time App Units.
"""
from __future__ import annotations

import os
import json
import logging
from datetime import date, datetime, timezone
from typing import Dict, Optional
from urllib.parse import quote

import requests

logger = logging.getLogger(__name__)

try:  # google-auth is already a dependency (see requirements.txt)
    from google.oauth2 import service_account
    from google.auth.transport.requests import AuthorizedSession
except Exception:  # pragma: no cover
    service_account = None
    AuthorizedSession = None

_DEFAULT_PACKAGE = "com.official.moodapp"
_STORAGE_READ_SCOPE = "https://www.googleapis.com/auth/devstorage.read_only"
_STORAGE_MEDIA_URL = "https://storage.googleapis.com/storage/v1/b/{bucket}/o/{obj}?alt=media"


class NotConfigured(RuntimeError):
    """Raised when required Google Play reporting config is absent."""


def package_name() -> str:
    return os.environ.get("GOOGLE_PLAY_PACKAGE_NAME", _DEFAULT_PACKAGE)


def _bucket() -> str:
    return os.environ.get("GOOGLE_PLAY_REPORTS_BUCKET", "").strip().replace("gs://", "").strip("/")


def _service_account_info() -> Optional[dict]:
    raw = os.environ.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", "").strip()
    path = os.environ.get("GOOGLE_PLAY_SERVICE_ACCOUNT_FILE", "").strip()
    if raw:
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return None
    if path and os.path.exists(path):
        with open(path) as fh:
            return json.load(fh)
    return None


def is_configured() -> bool:
    return bool(_bucket() and _service_account_info() and service_account is not None)


def config_status() -> Dict[str, object]:
    return {
        "platform": "google",
        "package": package_name(),
        "has_bucket": bool(_bucket()),
        "has_service_account": bool(_service_account_info()),
        "lib_available": service_account is not None,
        "configured": is_configured(),
    }


def parse_installs_overview_csv(text: str) -> Dict[str, Dict[str, int]]:
    """
    Parse an 'installs_<package>_YYYYMM_overview.csv' into {date_iso: metrics}.

    metrics = {'daily_user_installs', 'daily_device_installs'}.
    Pure function (decoded text in) so it is unit-testable without GCS.
    Locates columns by header name; tolerant of column-order changes.
    """
    out: Dict[str, Dict[str, int]] = {}
    lines = [ln for ln in text.replace("\r\n", "\n").splitlines() if ln.strip()]
    if not lines:
        return out
    header = [h.strip().strip('"') for h in lines[0].split(",")]

    def col(*names: str) -> Optional[int]:
        for name in names:
            for i, h in enumerate(header):
                if h.lower() == name.lower():
                    return i
        return None

    date_idx = col("Date")
    user_idx = col("Daily User Installs")
    device_idx = col("Daily Device Installs")
    if date_idx is None:
        logger.warning("GP installs CSV missing Date column; header=%s", header)
        return out

    def _int(cells, idx) -> int:
        if idx is None or idx >= len(cells):
            return 0
        try:
            return int(float(cells[idx].strip().strip('"') or "0"))
        except ValueError:
            return 0

    for line in lines[1:]:
        cells = line.split(",")
        raw_date = cells[date_idx].strip().strip('"') if date_idx < len(cells) else ""
        iso = _normalize_date(raw_date)
        if not iso:
            continue
        out[iso] = {
            "daily_user_installs": _int(cells, user_idx),
            "daily_device_installs": _int(cells, device_idx),
        }
    return out


def _normalize_date(raw: str) -> Optional[str]:
    """Google Play uses YYYY-MM-DD; be tolerant of a couple of formats."""
    raw = (raw or "").strip()
    for fmt in ("%Y-%m-%d", "%m/%d/%y", "%m/%d/%Y", "%b %d, %Y"):
        try:
            return datetime.strptime(raw, fmt).date().isoformat()
        except ValueError:
            continue
    return None


def _authed_session():
    info = _service_account_info()
    if not info or service_account is None:
        raise NotConfigured("Google Play service account not available")
    creds = service_account.Credentials.from_service_account_info(info, scopes=[_STORAGE_READ_SCOPE])
    return AuthorizedSession(creds)


def _fetch_overview_text(year: int, month: int, timeout: float = 30.0) -> Optional[str]:
    """Download + decode the monthly installs overview CSV (UTF-16). None if 404."""
    bucket = _bucket()
    obj = f"stats/installs/installs_{package_name()}_{year:04d}{month:02d}_overview.csv"
    url = _STORAGE_MEDIA_URL.format(bucket=quote(bucket, safe=""), obj=quote(obj, safe=""))
    session = _authed_session()
    resp = session.get(url, timeout=timeout)
    if resp.status_code == 404:
        logger.info("GP: no installs report for %04d-%02d (%s)", year, month, obj)
        return None
    resp.raise_for_status()
    # Play statistics CSVs are UTF-16 with a BOM.
    return resp.content.decode("utf-16")


async def get_downloads_for_date(report_date: date, timeout: float = 30.0) -> Optional[Dict[str, int]]:
    """
    Return {'downloads', 'device_installs', 'date', 'platform'} for one date,
    or None if the month's report isn't available. Raises NotConfigured if creds
    are absent. Network call is wrapped in a thread (google-auth is sync).
    """
    if not is_configured():
        raise NotConfigured("Google Play reporting is not configured")

    import asyncio

    text = await asyncio.to_thread(_fetch_overview_text, report_date.year, report_date.month, timeout)
    if text is None:
        return None
    by_day = parse_installs_overview_csv(text)
    row = by_day.get(report_date.isoformat())
    if row is None:
        return None
    return {
        "downloads": row["daily_user_installs"],
        "device_installs": row["daily_device_installs"],
        "date": report_date.isoformat(),
        "platform": "google",
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }
