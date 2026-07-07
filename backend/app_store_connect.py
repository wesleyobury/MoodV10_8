"""
App Store Connect — Sales Reports client (downloads / App Units).

Pulls the DAILY / SALES / SUMMARY report from the App Store Connect API and
extracts first-time downloads ("App Units"), redownloads, and updates so the
acquisition funnel has a real top-of-funnel number for iOS.

Auth: ES256 JWT signed with the App Store Connect API private key (.p8).
Docs: https://developer.apple.com/documentation/appstoreconnectapi/download_sales_and_trends_reports

Configuration (environment variables)
-------------------------------------
ASC_KEY_ID          Key ID for the .p8 (defaults to F8FY9GALTH — the key in the
                    project folder — but override if you rotate keys).
ASC_ISSUER_ID       Issuer ID (UUID) from App Store Connect → Users and Access →
                    Integrations → App Store Connect API.  *Required.*
ASC_VENDOR_NUMBER   8-digit vendor number from App Store Connect → Payments and
                    Financial Reports (top-left).  *Required.*
ASC_PRIVATE_KEY     The full PEM contents of the .p8 (-----BEGIN PRIVATE KEY----- …).
ASC_PRIVATE_KEY_PATH  …or a filesystem path to the .p8 file. One of the two is required.

If the required config is missing, callers get NotConfigured and the funnel
simply shows iOS downloads as unavailable (the rest still works).
"""
from __future__ import annotations

import gzip
import io
import os
import time
import logging
from datetime import date, datetime, timezone
from typing import Dict, Optional

import httpx
import jwt  # PyJWT

logger = logging.getLogger(__name__)

ASC_API_BASE = "https://api.appstoreconnect.apple.com/v1/salesReports"
ASC_AUDIENCE = "appstoreconnect-v1"
_DEFAULT_KEY_ID = "F8FY9GALTH"  # the AuthKey_F8FY9GALTH.p8 shipped in the project folder


class NotConfigured(RuntimeError):
    """Raised when required App Store Connect env config is absent."""


# ── Product Type Identifier classification ──────────────────────────────────
# Apple's Sales report reports Units against a "Product Type Identifier" (PTI).
# There is no single canonical published table, so we classify by the documented
# prefixes. First-time app downloads (what App Analytics calls "App Units") are
# the "1*" / "F1" family; "3*"/"7*" are updates; "IA*"/"FI*" are in-app purchases.
def classify_product_type(pti: str) -> str:
    """Return 'download' | 'redownload' | 'update' | 'iap' | 'other'."""
    p = (pti or "").strip().upper()
    if not p:
        return "other"
    # In-app purchases (subscriptions/consumables) — never a download.
    if p.startswith("IA") or p.startswith("FI"):
        return "iap"
    # Updates.
    if p.startswith("3") or p.startswith("7"):
        return "update"
    # Redownloads (same app, new device / re-install).
    if p in ("1R", "1RF") or p.endswith("R"):
        return "redownload"
    # First-time downloads / App Units: the 1* and F1 families.
    if p.startswith("1") or p == "F1" or p.startswith("F1"):
        return "download"
    return "other"


def parse_sales_report(tsv_text: str) -> Dict[str, int]:
    """
    Parse a decompressed Sales report (TSV) into unit counts.

    Returns {'downloads', 'redownloads', 'updates', 'iap_units', 'other', 'total_units'}.
    'downloads' is the first-time App Units figure used at the top of the funnel.
    Robust to column-order changes: locates columns by header name.
    """
    counts = {"downloads": 0, "redownloads": 0, "updates": 0, "iap_units": 0, "other": 0, "total_units": 0}
    lines = [ln for ln in tsv_text.splitlines() if ln.strip()]
    if not lines:
        return counts

    header = [h.strip() for h in lines[0].split("\t")]

    def col(*names: str) -> Optional[int]:
        for name in names:
            for i, h in enumerate(header):
                if h.lower() == name.lower():
                    return i
        return None

    pti_idx = col("Product Type Identifier")
    units_idx = col("Units")
    if pti_idx is None or units_idx is None:
        logger.warning("ASC sales report missing expected columns; header=%s", header)
        return counts

    bucket_map = {
        "download": "downloads",
        "redownload": "redownloads",
        "update": "updates",
        "iap": "iap_units",
        "other": "other",
    }
    for line in lines[1:]:
        cells = line.split("\t")
        if len(cells) <= max(pti_idx, units_idx):
            continue
        try:
            units = int(float(cells[units_idx].strip() or "0"))
        except ValueError:
            continue
        kind = classify_product_type(cells[pti_idx])
        counts[bucket_map[kind]] += units
        counts["total_units"] += units
    return counts


# ── Configuration + auth ────────────────────────────────────────────────────
def _private_key_pem() -> Optional[str]:
    pem = os.environ.get("ASC_PRIVATE_KEY", "").strip()
    if pem:
        return pem.replace("\\n", "\n")
    path = os.environ.get("ASC_PRIVATE_KEY_PATH", "").strip()
    if path and os.path.exists(path):
        with open(path, "r") as fh:
            return fh.read()
    return None


def config_status() -> Dict[str, object]:
    """Non-secret snapshot of whether iOS reporting is configured."""
    return {
        "platform": "apple",
        "key_id": os.environ.get("ASC_KEY_ID", _DEFAULT_KEY_ID),
        "has_issuer_id": bool(os.environ.get("ASC_ISSUER_ID", "").strip()),
        "has_vendor_number": bool(os.environ.get("ASC_VENDOR_NUMBER", "").strip()),
        "has_private_key": bool(_private_key_pem()),
        "configured": is_configured(),
    }


def is_configured() -> bool:
    return bool(
        os.environ.get("ASC_ISSUER_ID", "").strip()
        and os.environ.get("ASC_VENDOR_NUMBER", "").strip()
        and _private_key_pem()
    )


def _build_jwt() -> str:
    issuer_id = os.environ.get("ASC_ISSUER_ID", "").strip()
    key_id = os.environ.get("ASC_KEY_ID", _DEFAULT_KEY_ID).strip()
    pem = _private_key_pem()
    if not (issuer_id and key_id and pem):
        raise NotConfigured("ASC_ISSUER_ID, ASC_KEY_ID and a private key are required")
    now = int(time.time())
    payload = {"iss": issuer_id, "iat": now, "exp": now + 60 * 15, "aud": ASC_AUDIENCE}
    return jwt.encode(payload, pem, algorithm="ES256", headers={"kid": key_id, "typ": "JWT"})


async def get_downloads_for_date(report_date: date, timeout: float = 30.0) -> Optional[Dict[str, int]]:
    """
    Fetch + parse the DAILY SALES SUMMARY report for one date.

    Returns the unit-count dict (see parse_sales_report) plus 'date'/'platform',
    or None if Apple has no report for that date yet (HTTP 404 — normal for the
    current/most-recent day). Raises NotConfigured if creds are absent.
    """
    if not is_configured():
        raise NotConfigured("App Store Connect reporting is not configured")

    vendor = os.environ.get("ASC_VENDOR_NUMBER", "").strip()
    params = {
        "filter[frequency]": "DAILY",
        "filter[reportType]": "SALES",
        "filter[reportSubType]": "SUMMARY",
        "filter[vendorNumber]": vendor,
        "filter[reportDate]": report_date.isoformat(),
        "filter[version]": "1_0",
    }
    headers = {"Authorization": f"Bearer {_build_jwt()}", "Accept": "application/a-gzip"}

    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.get(ASC_API_BASE, params=params, headers=headers)

    if resp.status_code == 404:
        logger.info("ASC: no sales report yet for %s", report_date.isoformat())
        return None
    if resp.status_code == 401:
        raise NotConfigured("App Store Connect rejected the JWT (401) — check Key ID / Issuer ID / .p8")
    resp.raise_for_status()

    try:
        tsv = gzip.GzipFile(fileobj=io.BytesIO(resp.content)).read().decode("utf-8", errors="replace")
    except OSError:
        # Some error bodies aren't gzipped.
        tsv = resp.content.decode("utf-8", errors="replace")

    counts = parse_sales_report(tsv)
    counts["date"] = report_date.isoformat()
    counts["platform"] = "apple"
    counts["fetched_at"] = datetime.now(timezone.utc).isoformat()
    return counts
