"""
Apple App Store Server Notifications V2 — signature verification gate.

MOOD V2 Phase 1 (1b). This module is the SECURITY BOUNDARY for the
`/subscription/webhooks/apple` endpoint. Subscription-lifecycle analytics
events (subscription_renewed / _cancelled / _expired / _refunded /
_started) must ONLY be emitted for notifications whose JWS signature
verifies against Apple's certificate chain (x5c → Apple Root CA G2/G3).

Per the verified integration playbook we use Apple's official
`app-store-server-library` (`SignedDataVerifier`). A payload that fails
verification raises `VerificationException`, which the caller treats as
"drop" — it is NOT recorded as an analytics event.

Fail-closed: if the verifier cannot be constructed (missing certs / config),
`verify_and_parse()` raises, so nothing is ever emitted from an unverified
or misconfigured state.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Lazy imports so a missing dependency never crashes app startup; the gate
# simply fails closed (drops everything) until the library is present.
try:
    from appstoreserverlibrary.signed_data_verifier import (
        SignedDataVerifier,
        VerificationException,
    )
    from appstoreserverlibrary.models.Environment import Environment
    _LIB_AVAILABLE = True
except Exception as _e:  # pragma: no cover - defensive
    SignedDataVerifier = None  # type: ignore
    Environment = None  # type: ignore

    class VerificationException(Exception):  # type: ignore
        """Fallback when the Apple library is unavailable."""

    _LIB_AVAILABLE = False
    logger.warning("app-store-server-library not importable: %s", _e)


class WebhookVerificationError(Exception):
    """Raised for fail-closed conditions (missing payload, verifier not
    constructed). Distinct from the library's `VerificationException`, which
    we let propagate for genuine signature/chain failures. The webhook handler
    treats BOTH as 'drop — do not emit an event'."""


_CERTS_DIR = Path(__file__).parent / "certs" / "apple"

# Map Apple notificationType → our analytics event_type (category=monetization).
# Only these types produce an event; everything else is verified-but-ignored.
_NOTIFICATION_EVENT_MAP = {
    "SUBSCRIBED": "subscription_started",
    "DID_RENEW": "subscription_renewed",
    "EXPIRED": "subscription_expired",
    "REFUND": "subscription_refunded",
    # DID_CHANGE_RENEWAL_STATUS is resolved by subtype (see event_for()).
}

_verifier: Optional["SignedDataVerifier"] = None
_verifier_built = False


def _load_root_certificates() -> List[bytes]:
    if not _CERTS_DIR.exists():
        raise RuntimeError(f"Apple certs directory missing: {_CERTS_DIR}")
    certs: List[bytes] = []
    for path in sorted(_CERTS_DIR.glob("*.cer")):
        if path.is_file():
            certs.append(path.read_bytes())
    if not certs:
        raise RuntimeError(f"No Apple root certificates (*.cer) in {_CERTS_DIR}")
    return certs


def get_verifier() -> Optional["SignedDataVerifier"]:
    """Build (once) and return the SignedDataVerifier, or None if it cannot
    be constructed. Construction failures are logged and cached as None so we
    fail closed without retrying on every request."""
    global _verifier, _verifier_built
    if _verifier_built:
        return _verifier
    _verifier_built = True

    if not _LIB_AVAILABLE:
        _verifier = None
        return None

    try:
        root_certs = _load_root_certificates()
        env_name = os.environ.get("APPLE_WEBHOOK_ENVIRONMENT", "PRODUCTION").upper()
        environment = (
            Environment.SANDBOX if env_name == "SANDBOX" else Environment.PRODUCTION
        )
        bundle_id = os.environ.get("APPLE_BUNDLE_ID", "com.official.moodapp")
        app_apple_id_raw = os.environ.get("APPLE_APP_APPLE_ID", "").strip()
        app_apple_id = int(app_apple_id_raw) if app_apple_id_raw.isdigit() else None
        # Online OCSP/CRL revocation checks. Defaults on for production safety.
        enable_online = os.environ.get(
            "APPLE_WEBHOOK_ONLINE_CHECKS", "true"
        ).lower() not in ("false", "0", "no")

        # Production verification requires app_apple_id; without it the library
        # cannot fully verify, so fail closed rather than half-verify.
        if environment == Environment.PRODUCTION and app_apple_id is None:
            logger.warning(
                "APPLE_APP_APPLE_ID not set — Apple webhook verifier disabled "
                "(fail-closed) until configured. Lifecycle events stay dormant."
            )
            _verifier = None
            return None

        _verifier = SignedDataVerifier(
            root_certs, enable_online, environment, bundle_id, app_apple_id
        )
        logger.info(
            "✅ Apple webhook verifier ready (env=%s, bundle=%s, online_checks=%s)",
            env_name, bundle_id, enable_online,
        )
    except Exception as e:
        logger.error("Apple webhook verifier construction failed (fail-closed): %s", e)
        _verifier = None
    return _verifier


def _as_str(value: Any) -> Optional[str]:
    """Coerce enum/str to its string value."""
    if value is None:
        return None
    if isinstance(value, str):
        return value
    coerced = getattr(value, "value", value)
    return coerced if isinstance(coerced, str) else str(coerced)


def event_for(notification_type: Optional[str], subtype: Optional[str]) -> Optional[str]:
    """Resolve a verified notification to one of our monetization events, or
    None if this notification type isn't part of the funnel."""
    if not notification_type:
        return None
    if notification_type == "DID_CHANGE_RENEWAL_STATUS":
        # Auto-renew turned OFF = the user cancelled (still active until expiry).
        if subtype == "AUTO_RENEW_DISABLED":
            return "subscription_cancelled"
        return None
    return _NOTIFICATION_EVENT_MAP.get(notification_type)


def verify_and_parse(signed_payload: str) -> Dict[str, Any]:
    """Verify the JWS and parse the fields we need.

    Raises VerificationException if the signature/chain is invalid OR if the
    verifier could not be constructed (fail-closed). The caller MUST treat any
    exception as "drop — do not emit an event".
    """
    verifier = get_verifier()
    if verifier is None:
        raise WebhookVerificationError(
            "Apple webhook verifier unavailable (fail-closed); payload dropped."
        )

    # Raises VerificationException on bad signature / untrusted chain / wrong
    # bundle id / wrong environment.
    decoded = verifier.verify_and_decode_notification(signed_payload)

    notification_type = _as_str(getattr(decoded, "notificationType", None))
    subtype = _as_str(getattr(decoded, "subtype", None))
    notification_uuid = getattr(decoded, "notificationUUID", None)
    data = getattr(decoded, "data", None)

    original_transaction_id = None
    transaction_id = None
    product_id = None
    expires_date_ms = None
    purchase_date_ms = None
    environment = None

    if data is not None:
        environment = _as_str(getattr(data, "environment", None))
        signed_tx = getattr(data, "signedTransactionInfo", None)
        if signed_tx:
            try:
                tx = verifier.verify_and_decode_signed_transaction(signed_tx)
                original_transaction_id = getattr(tx, "originalTransactionId", None)
                transaction_id = getattr(tx, "transactionId", None)
                product_id = getattr(tx, "productId", None)
                expires_date_ms = getattr(tx, "expiresDate", None)
                purchase_date_ms = getattr(tx, "purchaseDate", None)
            except VerificationException:
                raise
            except Exception as e:  # malformed transaction info
                logger.error("Apple transaction decode failed: %s", e)

    return {
        "verified": True,
        "notification_type": notification_type,
        "subtype": subtype,
        "notification_uuid": notification_uuid,
        "original_transaction_id": original_transaction_id,
        "transaction_id": transaction_id,
        "product_id": product_id,
        "expires_date_ms": expires_date_ms,
        "purchase_date_ms": purchase_date_ms,
        "environment": environment,
    }
