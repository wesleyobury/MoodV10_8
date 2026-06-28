"""
Verify StoreKit 2 transaction JWS payloads and derive subscription status.

The client forwards `signedPayload` from `Product.purchase()` /
`Transaction.currentEntitlements`. We verify against Apple's certificate
chain and read offer metadata — never infer trial vs paid from date deltas.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Tuple

from apple_webhook_verifier import VerificationException, _as_str, get_verifier

logger = logging.getLogger(__name__)


class TransactionVerificationError(Exception):
    """Raised when the transaction JWS cannot be verified."""


def _ms_to_iso(ms: Any) -> Optional[str]:
    if ms is None:
        return None
    try:
        return datetime.fromtimestamp(int(ms) / 1000, tz=timezone.utc).isoformat()
    except (TypeError, ValueError, OSError):
        return None


def _is_expired(expiration_iso: Optional[str]) -> bool:
    if not expiration_iso:
        return False
    try:
        exp = datetime.fromisoformat(expiration_iso.replace("Z", "+00:00"))
        return exp < datetime.now(timezone.utc)
    except Exception:
        return False


def subscription_status_from_apple_fields(tx: Dict[str, Any]) -> str:
    """
    Derive MOOD status from verified Apple transaction fields.

    Uses offerDiscountType / offerType from the JWS — not purchase/expiry deltas.
    """
    expiration_iso = tx.get("expiration_date")
    if _is_expired(expiration_iso):
        return "lapsed"

    offer_discount = tx.get("offer_discount_type")
    if offer_discount == "FREE_TRIAL":
        return "in_trial"

    offer_type = tx.get("offer_type")
    price = tx.get("price")
    # Introductory offer with zero price and no explicit discount type.
    if offer_type == 1 and price == 0:
        return "in_trial"

    return "active"


def verify_and_decode_transaction(signed_payload: str) -> Dict[str, Any]:
    """Verify a StoreKit2 transaction JWS and return canonical fields."""
    verifier = get_verifier()
    if verifier is None:
        raise TransactionVerificationError("Apple transaction verifier unavailable")

    try:
        tx = verifier.verify_and_decode_signed_transaction(signed_payload)
    except VerificationException:
        raise
    except Exception as e:
        raise TransactionVerificationError(str(e)) from e

    offer_type_raw = getattr(tx, "offerType", None)
    offer_type = int(offer_type_raw) if offer_type_raw is not None else None
    price_raw = getattr(tx, "price", None)
    price = int(price_raw) if price_raw is not None else None

    return {
        "product_id": getattr(tx, "productId", None),
        "transaction_id": getattr(tx, "transactionId", None),
        "original_transaction_id": getattr(tx, "originalTransactionId", None),
        "purchase_date": _ms_to_iso(getattr(tx, "purchaseDate", None)),
        "expiration_date": _ms_to_iso(getattr(tx, "expiresDate", None)),
        "offer_type": offer_type,
        "offer_discount_type": _as_str(getattr(tx, "offerDiscountType", None)),
        "price": price,
        "environment": _as_str(getattr(tx, "environment", None)),
    }


def resolve_subscription_from_receipt(
    signed_payload: Optional[str],
    *,
    fallback_product_id: Optional[str] = None,
    fallback_transaction_id: Optional[str] = None,
    fallback_original_transaction_id: Optional[str] = None,
    fallback_purchase_date: Optional[str] = None,
    fallback_expiration_date: Optional[str] = None,
) -> Tuple[str, Dict[str, Optional[str]]]:
    """
    Resolve subscription status and canonical transaction fields.

    On verified JWS: status + dates come from Apple.
    On verify failure: expiration-only fallback → active | lapsed (never in_trial).
    """
    if signed_payload:
        try:
            apple = verify_and_decode_transaction(signed_payload)
            status = subscription_status_from_apple_fields(apple)
            fields = {
                "product_id": apple.get("product_id") or fallback_product_id,
                "transaction_id": apple.get("transaction_id") or fallback_transaction_id,
                "original_transaction_id": (
                    apple.get("original_transaction_id") or fallback_original_transaction_id
                ),
                "purchase_date": apple.get("purchase_date") or fallback_purchase_date,
                "expiration_date": apple.get("expiration_date") or fallback_expiration_date,
            }
            return status, fields
        except (TransactionVerificationError, VerificationException) as e:
            logger.warning(
                "Apple transaction JWS verify failed — expiration-only fallback: %s", e
            )

    expiration_iso = fallback_expiration_date
    status = "lapsed" if _is_expired(expiration_iso) else "active"
    return status, {
        "product_id": fallback_product_id,
        "transaction_id": fallback_transaction_id,
        "original_transaction_id": fallback_original_transaction_id,
        "purchase_date": fallback_purchase_date,
        "expiration_date": fallback_expiration_date,
    }
