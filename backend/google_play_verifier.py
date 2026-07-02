"""
Verify Google Play subscription purchases and parse Real-time Developer
Notifications (RTDN).

This is the Android counterpart to `apple_transaction_verifier.py` +
`apple_webhook_verifier.py`. The crucial difference (see the Android-Parity
plan §2.3): Google Play does NOT hand the client a self-verifiable signed
payload. The Android app only receives an opaque `purchaseToken`. This module
calls the Google Play Developer API (`purchases.subscriptionsv2.get`) with a
service-account credential — Google's server is the source of truth.

Fail-closed: if the service-account credential is missing or the API client
cannot be constructed, verification raises, so entitlement is never granted
from an unverified state.

Env config
----------
* GOOGLE_PLAY_SERVICE_ACCOUNT_JSON  — the service-account key as a raw JSON
                                      string (preferred for secret managers).
* GOOGLE_PLAY_SERVICE_ACCOUNT_FILE  — OR a path to the key file.
* GOOGLE_PLAY_PACKAGE_NAME          — defaults to com.official.moodapp.
* GOOGLE_PLAY_TRIAL_OFFER_IDS       — optional comma-separated offerIds that
                                      represent the free trial (used to detect
                                      in_trial vs active). If unset, any offer
                                      tagged/ided with "trial" is treated as a
                                      trial.
"""

from __future__ import annotations

import base64
import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# Lazy imports so a missing dependency never crashes app startup; the verifier
# simply fails closed until the libraries + creds are present. (google-auth and
# google-api-python-client are already in requirements.txt.)
try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    _LIB_AVAILABLE = True
except Exception as _e:  # pragma: no cover - defensive
    service_account = None  # type: ignore
    build = None  # type: ignore
    _LIB_AVAILABLE = False
    logger.warning("google-api-python-client not importable: %s", _e)


_ANDROIDPUBLISHER_SCOPE = "https://www.googleapis.com/auth/androidpublisher"
_DEFAULT_PACKAGE = "com.official.moodapp"

_service = None
_service_built = False


class GooglePlayVerificationError(Exception):
    """Raised for fail-closed conditions (missing creds / API failure)."""


# ── RTDN notificationType (int) → our monetization analytics event ──────────
# https://developer.android.com/google/play/billing/rtdn-reference
_RTDN_EVENT_MAP: Dict[int, str] = {
    1: "subscription_renewed",    # SUBSCRIPTION_RECOVERED
    2: "subscription_renewed",    # SUBSCRIPTION_RENEWED
    3: "subscription_cancelled",  # SUBSCRIPTION_CANCELED (auto-renew off; active until expiry)
    4: "subscription_started",    # SUBSCRIPTION_PURCHASED
    7: "subscription_renewed",    # SUBSCRIPTION_RESTARTED
    12: "subscription_refunded",  # SUBSCRIPTION_REVOKED (refund / chargeback)
    13: "subscription_expired",   # SUBSCRIPTION_EXPIRED
    # 5 ON_HOLD, 6 IN_GRACE_PERIOD, 8 PRICE_CHANGE_CONFIRMED, 9 DEFERRED,
    # 10 PAUSED, 11 PAUSE_SCHEDULE_CHANGED → verified but not part of the funnel.
}


def package_name() -> str:
    return os.environ.get("GOOGLE_PLAY_PACKAGE_NAME", _DEFAULT_PACKAGE)


def _load_credentials():
    """Load the service-account credential from JSON string or file, else None."""
    raw = os.environ.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON", "").strip()
    path = os.environ.get("GOOGLE_PLAY_SERVICE_ACCOUNT_FILE", "").strip()
    info: Optional[Dict[str, Any]] = None
    if raw:
        try:
            info = json.loads(raw)
        except json.JSONDecodeError as e:
            raise GooglePlayVerificationError(f"GOOGLE_PLAY_SERVICE_ACCOUNT_JSON invalid: {e}")
    elif path:
        if not os.path.isfile(path):
            raise GooglePlayVerificationError(f"service-account file not found: {path}")
        with open(path, "r", encoding="utf-8") as fh:
            info = json.load(fh)
    if info is None:
        return None
    return service_account.Credentials.from_service_account_info(
        info, scopes=[_ANDROIDPUBLISHER_SCOPE]
    )


def get_play_service():
    """Build (once) and return the androidpublisher service, or None if it
    cannot be constructed. Cached so we fail closed without retrying every
    request."""
    global _service, _service_built
    if _service_built:
        return _service
    _service_built = True

    if not _LIB_AVAILABLE:
        _service = None
        return None
    try:
        creds = _load_credentials()
        if creds is None:
            logger.warning(
                "Google Play service-account not configured — Play verifier "
                "disabled (fail-closed). Android entitlement stays dormant."
            )
            _service = None
            return None
        _service = build("androidpublisher", "v3", credentials=creds, cache_discovery=False)
        logger.info("✅ Google Play verifier ready (package=%s)", package_name())
    except Exception as e:
        logger.error("Google Play verifier construction failed (fail-closed): %s", e)
        _service = None
    return _service


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_rfc3339(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except Exception:
        return None


def _is_expired(expiry_iso: Optional[str]) -> bool:
    exp = _parse_rfc3339(expiry_iso)
    return exp is not None and exp < _now()


def _trial_offer_ids() -> List[str]:
    raw = os.environ.get("GOOGLE_PLAY_TRIAL_OFFER_IDS", "")
    return [x.strip() for x in raw.split(",") if x.strip()]


def _line_item_is_trial(offer_details: Dict[str, Any]) -> bool:
    """Best-effort free-trial detection from a lineItem's offerDetails.

    Google's subscriptionsv2 response has no explicit "isTrial" flag, so we
    read offer metadata (mirroring how the Apple path reads offer fields rather
    than inferring from date deltas): match a configured trial offerId, or fall
    back to an offer whose id/tags contain "trial".
    """
    if not offer_details:
        return False
    offer_id = offer_details.get("offerId") or ""
    configured = _trial_offer_ids()
    if configured:
        return offer_id in configured
    tags = [str(t).lower() for t in (offer_details.get("offerTags") or [])]
    return "trial" in offer_id.lower() or any("trial" in t for t in tags)


def subscription_status_from_google_fields(purchase: Dict[str, Any]) -> str:
    """Derive MOOD status ('active' | 'in_trial' | 'lapsed') from a verified
    SubscriptionPurchaseV2 resource."""
    state = purchase.get("subscriptionState")
    line_items = purchase.get("lineItems") or []
    # Overall expiry = latest lineItem expiry.
    expiry_isos = [li.get("expiryTime") for li in line_items if li.get("expiryTime")]
    latest_expiry = max(expiry_isos) if expiry_isos else None

    # Hard time check first — expired by clock is always lapsed.
    if latest_expiry and _is_expired(latest_expiry):
        return "lapsed"

    entitled_states = {
        "SUBSCRIPTION_STATE_ACTIVE",
        "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
        # Canceled = auto-renew off but still entitled until expiry.
        "SUBSCRIPTION_STATE_CANCELED",
    }
    if state in entitled_states:
        is_trial = any(_line_item_is_trial(li.get("offerDetails") or {}) for li in line_items)
        return "in_trial" if is_trial else "active"

    # ON_HOLD / PAUSED / EXPIRED / PENDING / UNSPECIFIED → no access.
    return "lapsed"


def verify_and_decode_purchase(purchase_token: str, product_id: Optional[str] = None) -> Dict[str, Any]:
    """Call purchases.subscriptionsv2.get and return canonical fields.

    Mirrors `apple_transaction_verifier.verify_and_decode_transaction`. Raises
    GooglePlayVerificationError when the verifier is unavailable or the API
    call fails."""
    service = get_play_service()
    if service is None:
        raise GooglePlayVerificationError("Google Play verifier unavailable")

    try:
        resource = (
            service.purchases()
            .subscriptionsv2()
            .get(packageName=package_name(), token=purchase_token)
            .execute()
        )
    except Exception as e:
        raise GooglePlayVerificationError(str(e)) from e

    line_items = resource.get("lineItems") or []
    first = line_items[0] if line_items else {}
    resolved_product_id = first.get("productId") or product_id
    expiry_isos = [li.get("expiryTime") for li in line_items if li.get("expiryTime")]
    latest_expiry = max(expiry_isos) if expiry_isos else None
    order_id = (
        resource.get("latestOrderId")
        or first.get("latestSuccessfulOrderId")
    )

    return {
        "product_id": resolved_product_id,
        # Play's closest analogue to Apple's transaction id is the order id.
        "transaction_id": order_id,
        # The purchase token is the stable per-subscription handle the backend
        # keys on (analogous to Apple's originalTransactionId).
        "original_transaction_id": purchase_token,
        "purchase_date": resource.get("startTime"),
        "expiration_date": latest_expiry,
        "subscription_state": resource.get("subscriptionState"),
        "acknowledgement_state": resource.get("acknowledgementState"),
        "test_purchase": bool(resource.get("testPurchase")),
        "_raw": resource,
    }


def resolve_subscription_from_purchase_token(
    purchase_token: Optional[str],
    *,
    fallback_product_id: Optional[str] = None,
) -> Tuple[str, Dict[str, Optional[str]]]:
    """Resolve status + canonical fields from a Play purchase token.

    Symmetric with `apple_transaction_verifier.resolve_subscription_from_receipt`.
    On verify failure there is NO safe fallback (unlike Apple, the client gives
    us no signed data at all), so we surface 'lapsed' with the token echoed
    back — access is only granted when Google confirms it.
    """
    if not purchase_token:
        return "lapsed", {
            "product_id": fallback_product_id,
            "transaction_id": None,
            "original_transaction_id": None,
            "purchase_date": None,
            "expiration_date": None,
        }
    try:
        decoded = verify_and_decode_purchase(purchase_token, fallback_product_id)
        status = subscription_status_from_google_fields(decoded["_raw"])
        return status, {
            "product_id": decoded.get("product_id") or fallback_product_id,
            "transaction_id": decoded.get("transaction_id"),
            "original_transaction_id": decoded.get("original_transaction_id"),
            "purchase_date": decoded.get("purchase_date"),
            "expiration_date": decoded.get("expiration_date"),
        }
    except GooglePlayVerificationError as e:
        logger.warning("Google Play verify failed — no access granted: %s", e)
        return "lapsed", {
            "product_id": fallback_product_id,
            "transaction_id": None,
            "original_transaction_id": purchase_token,
            "purchase_date": None,
            "expiration_date": None,
        }


# ── RTDN (Real-time Developer Notifications) ────────────────────────────────
def parse_rtdn_message(body: Dict[str, Any]) -> Dict[str, Any]:
    """Decode a Pub/Sub push envelope into a DeveloperNotification.

    Pub/Sub push shape:
      { "message": { "data": <base64 JSON>, "messageId": "..." },
        "subscription": "..." }

    The decoded data is a DeveloperNotification:
      { version, packageName, eventTimeMillis,
        subscriptionNotification: { version, notificationType, purchaseToken,
                                    subscriptionId } }

    Raises GooglePlayVerificationError on a malformed / empty envelope so the
    caller can drop it (fail-closed) rather than emit an unverified event.
    """
    message = (body or {}).get("message") or {}
    message_id = message.get("messageId") or message.get("message_id")
    data_b64 = message.get("data")
    if not data_b64:
        raise GooglePlayVerificationError("RTDN envelope missing message.data")
    try:
        decoded = json.loads(base64.b64decode(data_b64).decode("utf-8"))
    except Exception as e:
        raise GooglePlayVerificationError(f"RTDN data not decodable: {e}")

    sub_note = decoded.get("subscriptionNotification") or {}
    return {
        "message_id": message_id,
        "package_name": decoded.get("packageName"),
        "event_time_millis": decoded.get("eventTimeMillis"),
        "notification_type": sub_note.get("notificationType"),
        "purchase_token": sub_note.get("purchaseToken"),
        "subscription_id": sub_note.get("subscriptionId"),
        # A test publish from the Play Console has no subscriptionNotification.
        "is_test_notification": "testNotification" in decoded,
        "_raw": decoded,
    }


def event_for_google(notification_type: Optional[int]) -> Optional[str]:
    """Resolve an RTDN notificationType to one of our monetization events, or
    None if it isn't part of the funnel."""
    if notification_type is None:
        return None
    try:
        return _RTDN_EVENT_MAP.get(int(notification_type))
    except (TypeError, ValueError):
        return None
