"""
MOOD V2 — Subscription & IAP routes.

StoreKit purchase reconciliation, paywall trigger attribution, Apple S2S
webhooks, and founding-member SKU claim. Wired into server.py via
`build_subscriptions_router()` so this module stays decoupled from the
monolithic server import graph.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable, Dict, Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# ── App Store Connect product identifiers ───────────────────────────────────
PRODUCT_ANNUAL = "com.mood.subscription.annual"
PRODUCT_MONTHLY = "com.mood.subscription.monthly"
PRODUCT_FOUNDING_ANNUAL = "com.mood.subscription.founding_annual"

ALL_PRODUCT_IDS = (
    PRODUCT_ANNUAL,
    PRODUCT_MONTHLY,
    PRODUCT_FOUNDING_ANNUAL,
)

# Display prices (USD) per SKU — gross list price for funnel analytics.
PRODUCT_PRICE_USD = {
    PRODUCT_ANNUAL: 79.0,
    PRODUCT_MONTHLY: 9.99,
    PRODUCT_FOUNDING_ANNUAL: 39.0,
}


# ── Pydantic models ───────────────────────────────────────────────────────
class SubscriptionTriggerRecord(BaseModel):
    """
    Phase B paid-launch — paywall trigger attribution payload.
    `trigger` is one of: start_workout_after_free_session, generate_after_cap,
    recap_footer_cta, locked_premium_feature, settings_subscribe, unknown.
    """
    trigger: str
    plan: Optional[str] = None  # 'annual' | 'monthly' | None at trigger time


class SubscriptionValidateRequest(BaseModel):
    """
    Phase C — Foreground purchase reconciliation. The native StoreKit2
    layer hands us the signed JWS from `Product.purchase()` (or from a
    `Transaction.updates` event for renewals).
    """
    signed_payload: str
    product_id: str
    transaction_id: Optional[str] = None
    original_transaction_id: Optional[str] = None
    purchase_date: Optional[str] = None
    expiration_date: Optional[str] = None
    status_hint: Optional[str] = None  # client-inferred: in_trial | active


class SubscriptionSyncRequest(BaseModel):
    """
    App-open receipt sync. When `has_active_entitlement` is true the client
    forwards the latest StoreKit entitlement JWS; when false the device has
    no active subscription and we mark any prior subscription lapsed.
    """
    has_active_entitlement: bool = True
    signed_payload: Optional[str] = None
    product_id: Optional[str] = None
    transaction_id: Optional[str] = None
    original_transaction_id: Optional[str] = None
    purchase_date: Optional[str] = None
    expiration_date: Optional[str] = None
    status_hint: Optional[str] = None


# ── Catalog helpers (exported for tests/scripts) ──────────────────────────
def normalize_product_id(product_id: Optional[str]) -> str:
    return (product_id or "").strip()


def plan_for_product(product_id: str) -> Optional[str]:
    normalized = normalize_product_id(product_id)
    if normalized == PRODUCT_ANNUAL:
        return "annual"
    if normalized == PRODUCT_MONTHLY:
        return "monthly"
    if normalized == PRODUCT_FOUNDING_ANNUAL:
        return "founding_annual"
    return None


def subscription_status_for(expiration_iso: Optional[str]) -> str:
    """
    Returns 'active' | 'lapsed' based on the expiration date.
    Trial vs paid distinction is approximated client-side.
    """
    if not expiration_iso:
        return "active"
    try:
        exp = datetime.fromisoformat(expiration_iso.replace("Z", "+00:00"))
    except Exception:
        return "active"
    if exp < datetime.now(timezone.utc):
        return "lapsed"
    return "active"


def resolve_subscription_status(
    expiration_iso: Optional[str],
    status_hint: Optional[str] = None,
) -> str:
    """Combine expiration check with optional client trial/active hint."""
    if subscription_status_for(expiration_iso) == "lapsed":
        return "lapsed"
    if status_hint in ("in_trial", "active"):
        return status_hint
    return subscription_status_for(expiration_iso)


def user_can_claim_founding(user: dict, window_open: bool) -> bool:
    """Per-user eligibility to claim the locked founding deal."""
    if not user or not user.get("founding_member"):
        return False
    if user.get("founding_pricing_claimed"):
        return False
    return bool(window_open)


# Backward-compatible aliases used by existing tests.
_normalize_product_id = normalize_product_id
_plan_for_product = plan_for_product
_subscription_status_for = subscription_status_for


async def _persist_subscription_record(
    db,
    user_id: str,
    *,
    product_id: str,
    plan: str,
    status: str,
    transaction_id: Optional[str],
    original_transaction_id: Optional[str],
    purchase_date: Optional[str],
    expiration_date: Optional[str],
    consume_trigger: bool,
) -> Optional[str]:
    user = await db.users.find_one({"_id": ObjectId(user_id)}, {"subscription": 1})
    trigger_source = (user or {}).get("subscription", {}).get("last_trigger_source")

    update_doc: Dict[str, Any] = {
        "subscription.status": status,
        "subscription.plan": plan,
        "subscription.product_id": product_id,
        "subscription.transaction_id": transaction_id,
        "subscription.original_transaction_id": original_transaction_id,
        "subscription.last_validated_at": datetime.now(timezone.utc),
        "subscription.last_synced_at": datetime.now(timezone.utc),
    }
    if purchase_date:
        update_doc["subscription.purchase_date"] = purchase_date
    if expiration_date:
        update_doc["subscription.expiration_date"] = expiration_date

    update_ops: Dict[str, Any] = {"$set": update_doc}
    if consume_trigger:
        update_ops["$unset"] = {"subscription.last_trigger_source": ""}

    await db.users.update_one({"_id": ObjectId(user_id)}, update_ops)

    if product_id == PRODUCT_FOUNDING_ANNUAL:
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {
                "founding_pricing_claimed": True,
                "founding_pricing_claimed_at": datetime.now(timezone.utc),
            }},
        )

    return trigger_source


# ── Router factory ────────────────────────────────────────────────────────
def build_subscriptions_router(
    db,
    get_current_user,
    track_user_event,
    is_founding_window_open: Callable[[], Awaitable[bool]],
) -> APIRouter:
    """Build subscription/IAP routes. Dependencies are injected from server.py."""
    router = APIRouter(tags=["subscriptions"])

    @router.post("/subscription/record-trigger")
    async def record_subscription_trigger(
        payload: SubscriptionTriggerRecord,
        current_user_id: str = Depends(get_current_user),
    ):
        await db.users.update_one(
            {"_id": ObjectId(current_user_id)},
            {
                "$set": {
                    "subscription.last_trigger_source": payload.trigger,
                    "subscription.last_trigger_plan": payload.plan,
                    "subscription.last_trigger_at": datetime.now(timezone.utc),
                }
            },
        )
        return {"ok": True}

    @router.post("/subscription/validate")
    async def validate_subscription_transaction(
        payload: SubscriptionValidateRequest,
        current_user_id: str = Depends(get_current_user),
    ):
        plan = plan_for_product(payload.product_id)
        if not plan:
            logger.warning(
                "subscription/validate: unknown product_id=%r (known: %s)",
                payload.product_id,
                ", ".join(ALL_PRODUCT_IDS),
            )
            raise HTTPException(status_code=400, detail=f"Unknown product {payload.product_id}")

        product_id = normalize_product_id(payload.product_id)
        status_value = resolve_subscription_status(
            payload.expiration_date,
            payload.status_hint,
        )

        trigger_source = await _persist_subscription_record(
            db,
            current_user_id,
            product_id=product_id,
            plan=plan,
            status=status_value,
            transaction_id=payload.transaction_id,
            original_transaction_id=payload.original_transaction_id,
            purchase_date=payload.purchase_date,
            expiration_date=payload.expiration_date,
            consume_trigger=True,
        )

        try:
            flags_user = await db.users.find_one(
                {"_id": ObjectId(current_user_id)},
                {"is_comp": 1, "is_internal": 1, "founding_member": 1},
            ) or {}
            await track_user_event(
                db,
                current_user_id,
                "subscription_started",
                {
                    "plan_id": product_id,
                    "plan": plan,
                    "revenue_usd": PRODUCT_PRICE_USD.get(product_id),
                    "source": "apple",
                    "trigger_source": trigger_source,
                    "origin": "server_validate",
                    "is_comp": bool(flags_user.get("is_comp", False)),
                    "is_internal": bool(flags_user.get("is_internal", False)),
                    "is_founding_member": bool(flags_user.get("founding_member", False)),
                },
            )
        except Exception as e:
            logger.error(f"subscription_started analytics insert failed: {e}")

        return {
            "ok": True,
            "status": status_value,
            "plan": plan,
            "trigger_source": trigger_source,
        }

    @router.post("/subscription/sync")
    async def sync_subscription_state(
        payload: SubscriptionSyncRequest,
        current_user_id: str = Depends(get_current_user),
    ):
        """
        App-open reconciliation. Re-validates the latest StoreKit entitlement
        or marks the subscription lapsed when the device has no active IAP.
        Does not consume paywall attribution or emit purchase analytics.
        """
        if not payload.has_active_entitlement:
            user = await db.users.find_one(
                {"_id": ObjectId(current_user_id)},
                {"subscription": 1},
            )
            sub = (user or {}).get("subscription") or {}
            prior_status = sub.get("status")
            now = datetime.now(timezone.utc)

            if prior_status in ("active", "in_trial"):
                await db.users.update_one(
                    {"_id": ObjectId(current_user_id)},
                    {"$set": {
                        "subscription.status": "lapsed",
                        "subscription.last_synced_at": now,
                        "subscription.last_validated_at": now,
                    }},
                )
                return {
                    "ok": True,
                    "status": "lapsed",
                    "plan": sub.get("plan"),
                    "has_full_access": False,
                }

            await db.users.update_one(
                {"_id": ObjectId(current_user_id)},
                {"$set": {"subscription.last_synced_at": now}},
            )
            return {
                "ok": True,
                "status": prior_status or "none",
                "plan": sub.get("plan"),
                "has_full_access": False,
            }

        if not payload.product_id or not payload.signed_payload:
            raise HTTPException(
                status_code=400,
                detail="product_id and signed_payload required when has_active_entitlement is true",
            )

        plan = plan_for_product(payload.product_id)
        if not plan:
            logger.warning(
                "subscription/sync: unknown product_id=%r (known: %s)",
                payload.product_id,
                ", ".join(ALL_PRODUCT_IDS),
            )
            raise HTTPException(status_code=400, detail=f"Unknown product {payload.product_id}")

        product_id = normalize_product_id(payload.product_id)
        status_value = resolve_subscription_status(
            payload.expiration_date,
            payload.status_hint,
        )

        await _persist_subscription_record(
            db,
            current_user_id,
            product_id=product_id,
            plan=plan,
            status=status_value,
            transaction_id=payload.transaction_id,
            original_transaction_id=payload.original_transaction_id,
            purchase_date=payload.purchase_date,
            expiration_date=payload.expiration_date,
            consume_trigger=False,
        )

        has_access = status_value in ("active", "in_trial")
        return {
            "ok": True,
            "status": status_value,
            "plan": plan,
            "has_full_access": has_access,
        }

    @router.post("/subscription/webhooks/apple")
    async def apple_subscription_webhook(request: Request):
        from apple_webhook_verifier import (
            verify_and_parse,
            event_for,
            VerificationException,
            WebhookVerificationError,
        )

        try:
            body = await request.json()
        except Exception:
            body = {}

        signed_payload = body.get("signedPayload") if isinstance(body, dict) else None
        now = datetime.now(timezone.utc)

        try:
            if not signed_payload or not isinstance(signed_payload, str):
                raise WebhookVerificationError("missing signedPayload")
            parsed = verify_and_parse(signed_payload)
        except (VerificationException, WebhookVerificationError) as e:
            logger.warning(f"🚫 Apple webhook DROPPED (verification failed): {e}")
            try:
                await db.apple_webhook_events.insert_one({
                    "received_at": now,
                    "verified": False,
                    "drop_reason": str(e),
                    "payload_keys": list(body.keys()) if isinstance(body, dict) else None,
                })
            except Exception as persist_err:
                logger.error(f"Apple webhook audit persistence failed: {persist_err}")
            return {"ok": True, "verified": False}

        notification_type = parsed.get("notification_type")
        subtype = parsed.get("subtype")
        notification_uuid = parsed.get("notification_uuid")
        original_transaction_id = parsed.get("original_transaction_id")
        webhook_product_id = parsed.get("product_id")
        logger.info(
            f"📩 Apple S2S VERIFIED: type={notification_type} subtype={subtype} "
            f"uuid={notification_uuid}"
        )

        already = None
        if notification_uuid:
            already = await db.apple_webhook_events.find_one(
                {"notification_uuid": notification_uuid, "verified": True}
            )

        try:
            await db.apple_webhook_events.update_one(
                {"notification_uuid": notification_uuid} if notification_uuid else {"_temp_id": str(now)},
                {"$set": {
                    "received_at": now,
                    "verified": True,
                    "notification_type": notification_type,
                    "subtype": subtype,
                    "original_transaction_id": original_transaction_id,
                    "product_id": webhook_product_id,
                }},
                upsert=True,
            )
        except Exception as e:
            logger.error(f"Apple webhook verified-audit persistence failed: {e}")

        if already:
            return {"ok": True, "verified": True, "duplicate": True}

        event_type = event_for(notification_type, subtype)
        if not event_type:
            return {"ok": True, "verified": True, "event": None}

        user = None
        if original_transaction_id:
            user = await db.users.find_one(
                {"subscription.original_transaction_id": original_transaction_id},
                {"subscription": 1, "is_comp": 1, "is_internal": 1, "founding_member": 1},
            )
        if not user:
            logger.warning(
                f"Apple webhook: verified {event_type} but no user for "
                f"originalTransactionId={original_transaction_id}; event skipped."
            )
            return {"ok": True, "verified": True, "event": event_type, "user_matched": False}

        user_id = str(user["_id"])
        sub = user.get("subscription") or {}

        metadata: Dict[str, Any] = {
            "plan_id": webhook_product_id,
            "plan": plan_for_product(webhook_product_id) if webhook_product_id else None,
            "source": "apple",
            "notification_type": notification_type,
            "subtype": subtype,
            "is_comp": bool(user.get("is_comp", False)),
            "is_internal": bool(user.get("is_internal", False)),
            "is_founding_member": bool(user.get("founding_member", False)),
        }

        if event_type in ("subscription_started", "subscription_renewed"):
            metadata["revenue_usd"] = PRODUCT_PRICE_USD.get(webhook_product_id)
        if event_type == "subscription_renewed":
            prior = await db.user_events.count_documents(
                {"user_id": user_id, "event_type": "subscription_renewed"}
            )
            metadata["renewal_count"] = prior + 1
        if event_type == "subscription_cancelled":
            purchase_ms = parsed.get("purchase_date_ms") or sub.get("purchase_date_ms")
            if isinstance(purchase_ms, (int, float)):
                metadata["days_active"] = max(
                    0, int((now.timestamp() * 1000 - purchase_ms) / 86_400_000)
                )
            else:
                metadata["days_active"] = None
        if event_type == "subscription_expired":
            if subtype in ("BILLING_RETRY", "PRICE_INCREASE"):
                metadata["reason"] = "payment_failed"
            else:
                metadata["reason"] = "user_cancelled"
        if event_type == "subscription_refunded":
            price = PRODUCT_PRICE_USD.get(webhook_product_id)
            metadata["revenue_usd"] = (-price) if price is not None else None

        await track_user_event(db, user_id, event_type, metadata)
        logger.info(f"✅ Apple webhook emitted {event_type} for user {user_id}")
        return {"ok": True, "verified": True, "event": event_type, "user_matched": True}

    @router.post("/me/claim-founding")
    async def claim_founding_pricing(current_user_id: str = Depends(get_current_user)):
        user = await db.users.find_one({"_id": ObjectId(current_user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        window_open = await is_founding_window_open()
        if not user_can_claim_founding(user, window_open):
            raise HTTPException(status_code=403, detail="founding_window_closed_or_already_claimed")

        await db.users.update_one(
            {"_id": ObjectId(current_user_id)},
            {"$set": {
                "founding_locked_price_id": PRODUCT_FOUNDING_ANNUAL,
                "founding_claim_initiated_at": datetime.now(timezone.utc),
            }},
        )

        expires = user.get("founding_window_expires_at")
        return {
            "sku_id": PRODUCT_FOUNDING_ANNUAL,
            "price_display": "$39/year",
            "founding_window_expires_at": expires.isoformat() if isinstance(expires, datetime) else expires,
        }

    return router
