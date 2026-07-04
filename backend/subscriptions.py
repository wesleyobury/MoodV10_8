"""
MOOD V2 — Subscription & IAP routes.

StoreKit purchase reconciliation, paywall trigger attribution, Apple S2S
webhooks, and founding-member SKU claim. Wired into server.py via
`build_subscriptions_router()` so this module stays decoupled from the
monolithic server import graph.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable, Dict, Optional

import httpx

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from apple_transaction_verifier import resolve_subscription_from_receipt
from google_play_verifier import resolve_subscription_from_purchase_token

logger = logging.getLogger(__name__)


def _is_google_platform(platform: Optional[str]) -> bool:
    """True when a validate/sync request originated on Android/Google Play."""
    return (platform or "").strip().lower() in ("google", "android", "play")

# ── App Store Connect product identifiers ───────────────────────────────────
PRODUCT_ANNUAL = "com.mood.subscription.annual"
PRODUCT_MONTHLY = "com.mood.subscription.monthly"
PRODUCT_ANNUAL_PAID = "com.mood.subscription.annual.paid"
PRODUCT_MONTHLY_PAID = "com.mood.subscription.monthly.paid"
PRODUCT_FOUNDING_ANNUAL = "com.mood.subscription.founding_annual"

ALL_PRODUCT_IDS = (
    PRODUCT_ANNUAL,
    PRODUCT_MONTHLY,
    PRODUCT_ANNUAL_PAID,
    PRODUCT_MONTHLY_PAID,
    PRODUCT_FOUNDING_ANNUAL,
)

# Display prices (USD) per SKU — gross list price for funnel analytics.
PRODUCT_PRICE_USD = {
    PRODUCT_ANNUAL: 79.0,
    PRODUCT_MONTHLY: 9.99,
    PRODUCT_ANNUAL_PAID: 79.0,
    PRODUCT_MONTHLY_PAID: 9.99,
    PRODUCT_FOUNDING_ANNUAL: 39.0,
}


# ── New-subscription Discord alert ──────────────────────────────────────────
# Set DISCORD_SUBS_WEBHOOK_URL in the backend env to a Discord channel webhook
# (Server Settings → Integrations → Webhooks → Copy Webhook URL). When unset,
# this is a no-op, so it is safe to deploy before the env var exists.
DISCORD_SUBS_WEBHOOK_ENV = "DISCORD_SUBS_WEBHOOK_URL"


def _fmt_usd(value: Optional[float]) -> str:
    try:
        return f"${float(value):,.2f}"
    except (TypeError, ValueError):
        return "n/a"


async def notify_new_subscription_discord(
    db,
    *,
    user_id: str,
    product_id: Optional[str],
    plan: Optional[str],
    revenue_usd: Optional[float],
    source: str,
    txn_key: Optional[str],
) -> None:
    """Fire a one-time Discord ping for a NEW subscription. Never raises.

    Deduped on the subscription's transaction identity (Apple
    original_transaction_id / Google purchase token) via an atomic insert into
    `sub_notify_log`, so the app-validate path (which re-fires on every launch)
    and the Apple/Google server webhooks never double-notify the same sale.
    """
    webhook_url = os.environ.get(DISCORD_SUBS_WEBHOOK_ENV)
    if not webhook_url:
        return
    try:
        key = txn_key or f"{user_id}:{product_id}"
        # Atomic dedupe: the first writer wins; a duplicate _id means we've
        # already pinged for this subscription, so skip silently.
        try:
            await db.sub_notify_log.insert_one({
                "_id": key,
                "user_id": user_id,
                "product_id": product_id,
                "source": source,
                "created_at": datetime.now(timezone.utc),
            })
        except Exception:
            return

        plan_label = plan or product_id or "subscription"
        content = (
            "💸 **New MOOD subscription**\n"
            f"• Plan: **{plan_label}**\n"
            f"• Revenue: **{_fmt_usd(revenue_usd)}**\n"
            f"• Source: {source}\n"
            f"• User: `{user_id}`"
        )
        async with httpx.AsyncClient(timeout=8.0) as client:
            await client.post(webhook_url, json={"content": content})
    except Exception as e:
        logger.warning(f"Discord subscription notify failed: {e}")


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
    app_account_token: Optional[str] = None
    # 'apple'/'ios' (default) or 'google'/'android'. On Android the client sends
    # the opaque Play purchaseToken in `signed_payload`; the backend verifies it
    # against the Play Developer API rather than an offline signature.
    platform: Optional[str] = "apple"


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
    app_account_token: Optional[str] = None
    platform: Optional[str] = "apple"


# ── Catalog helpers (exported for tests/scripts) ──────────────────────────
def normalize_product_id(product_id: Optional[str]) -> str:
    return (product_id or "").strip()


def plan_for_product(product_id: str) -> Optional[str]:
    normalized = normalize_product_id(product_id)
    if normalized in (PRODUCT_ANNUAL, PRODUCT_ANNUAL_PAID):
        return "annual"
    if normalized in (PRODUCT_MONTHLY, PRODUCT_MONTHLY_PAID):
        return "monthly"
    if normalized == PRODUCT_FOUNDING_ANNUAL:
        return "founding_annual"
    return None


def subscription_status_for(expiration_iso: Optional[str]) -> str:
    """Returns 'active' | 'lapsed' based on expiration (fallback when JWS unavailable)."""
    if not expiration_iso:
        return "active"
    try:
        exp = datetime.fromisoformat(expiration_iso.replace("Z", "+00:00"))
    except Exception:
        return "active"
    if exp < datetime.now(timezone.utc):
        return "lapsed"
    return "active"


def _reconcile_from_payload(payload) -> tuple[str, Dict[str, Optional[str]]]:
    """Status + canonical fields from a verified receipt/token (source of truth).

    Routes by `payload.platform`:
      • Apple  → verify the StoreKit2 JWS offline.
      • Google → verify the Play purchaseToken (carried in `signed_payload`)
                 against the Play Developer API.
    """
    if _is_google_platform(getattr(payload, "platform", None)):
        return resolve_subscription_from_purchase_token(
            getattr(payload, "signed_payload", None),
            fallback_product_id=getattr(payload, "product_id", None),
        )
    status, fields = resolve_subscription_from_receipt(
        payload.signed_payload,
        fallback_product_id=getattr(payload, "product_id", None),
        fallback_transaction_id=getattr(payload, "transaction_id", None),
        fallback_original_transaction_id=getattr(payload, "original_transaction_id", None),
        fallback_purchase_date=getattr(payload, "purchase_date", None),
        fallback_expiration_date=getattr(payload, "expiration_date", None),
    )
    fields["app_account_token"] = (
        fields.get("app_account_token") or getattr(payload, "app_account_token", None)
    )
    return status, fields


def analytics_source_for(platform: Optional[str]) -> str:
    """Analytics `source` tag for a validate/sync/webhook event."""
    return "google" if _is_google_platform(platform) else "apple"


def user_can_claim_founding(user: dict, window_open: bool) -> bool:
    """Per-user eligibility to claim the locked founding deal."""
    if not user or not user.get("founding_member"):
        return False
    if user.get("founding_pricing_claimed"):
        return False
    return bool(window_open)


def app_account_token_for_user_id(user_id: str) -> Optional[str]:
    """Mirror frontend appAccountToken generation for Mongo ObjectId user ids."""
    hex_id = (user_id or "").strip().lower()
    if len(hex_id) != 24 or any(c not in "0123456789abcdef" for c in hex_id):
        return None
    chars = list(f"00000000{hex_id}")
    chars[12] = "5"
    chars[16] = format((int(chars[16], 16) & 0x3) | 0x8, "x")
    raw = "".join(chars)
    return f"{raw[0:8]}-{raw[8:12]}-{raw[12:16]}-{raw[16:20]}-{raw[20:32]}"


async def assert_apple_transaction_account_allowed(
    db,
    current_user_id: str,
    payload,
    apple_fields: Dict[str, Optional[str]],
) -> None:
    """Prevent one Apple subscription from silently unlocking another profile."""
    if _is_google_platform(getattr(payload, "platform", None)):
        return

    incoming_token = (
        apple_fields.get("app_account_token") or getattr(payload, "app_account_token", None)
    )
    expected_token = app_account_token_for_user_id(current_user_id)
    if incoming_token and expected_token and incoming_token.lower() != expected_token.lower():
        raise HTTPException(
            status_code=403,
            detail={
                "error": "subscription_belongs_to_different_account",
                "message": "This Apple subscription is linked to a different MOOD profile.",
            },
        )

    original_transaction_id = (
        apple_fields.get("original_transaction_id")
        or getattr(payload, "original_transaction_id", None)
    )
    if not original_transaction_id:
        return

    existing = await db.users.find_one(
        {
            "subscription.original_transaction_id": original_transaction_id,
            "_id": {"$ne": ObjectId(current_user_id)},
        },
        {"_id": 1},
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "subscription_already_linked",
                "message": "This Apple subscription is already linked to another MOOD profile.",
            },
        )


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
    app_account_token: Optional[str],
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
    if app_account_token:
        update_doc["subscription.app_account_token"] = app_account_token

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
        status_value, apple_fields = _reconcile_from_payload(payload)
        await assert_apple_transaction_account_allowed(db, current_user_id, payload, apple_fields)
        product_id = normalize_product_id(apple_fields.get("product_id") or payload.product_id)
        plan = plan_for_product(product_id)
        if not plan:
            logger.warning(
                "subscription/validate: unknown product_id=%r (known: %s)",
                product_id,
                ", ".join(ALL_PRODUCT_IDS),
            )
            raise HTTPException(status_code=400, detail=f"Unknown product {product_id}")

        trigger_source = await _persist_subscription_record(
            db,
            current_user_id,
            product_id=product_id,
            plan=plan,
            status=status_value,
            transaction_id=apple_fields.get("transaction_id"),
            original_transaction_id=apple_fields.get("original_transaction_id"),
            purchase_date=apple_fields.get("purchase_date"),
            expiration_date=apple_fields.get("expiration_date"),
            app_account_token=apple_fields.get("app_account_token"),
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
                    "source": analytics_source_for(payload.platform),
                    "trigger_source": trigger_source,
                    "origin": "server_validate",
                    "is_comp": bool(flags_user.get("is_comp", False)),
                    "is_internal": bool(flags_user.get("is_internal", False)),
                    "is_founding_member": bool(flags_user.get("founding_member", False)),
                },
            )
        except Exception as e:
            logger.error(f"subscription_started analytics insert failed: {e}")

        await notify_new_subscription_discord(
            db,
            user_id=current_user_id,
            product_id=product_id,
            plan=plan,
            revenue_usd=PRODUCT_PRICE_USD.get(product_id),
            source=analytics_source_for(payload.platform),
            txn_key=apple_fields.get("original_transaction_id") or apple_fields.get("transaction_id"),
        )

        return {
            "ok": True,
            "status": status_value,
            "plan": plan,
            "product_id": product_id,
            "has_full_access": status_value in ("active", "in_trial"),
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

        status_value, apple_fields = _reconcile_from_payload(payload)
        await assert_apple_transaction_account_allowed(db, current_user_id, payload, apple_fields)
        product_id = normalize_product_id(apple_fields.get("product_id") or payload.product_id)
        plan = plan_for_product(product_id)
        if not plan:
            logger.warning(
                "subscription/sync: unknown product_id=%r (known: %s)",
                product_id,
                ", ".join(ALL_PRODUCT_IDS),
            )
            raise HTTPException(status_code=400, detail=f"Unknown product {product_id}")

        await _persist_subscription_record(
            db,
            current_user_id,
            product_id=product_id,
            plan=plan,
            status=status_value,
            transaction_id=apple_fields.get("transaction_id"),
            original_transaction_id=apple_fields.get("original_transaction_id"),
            purchase_date=apple_fields.get("purchase_date"),
            expiration_date=apple_fields.get("expiration_date"),
            app_account_token=apple_fields.get("app_account_token"),
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

        if event_type == "subscription_started":
            await notify_new_subscription_discord(
                db,
                user_id=user_id,
                product_id=webhook_product_id,
                plan=metadata.get("plan"),
                revenue_usd=metadata.get("revenue_usd"),
                source="apple",
                txn_key=original_transaction_id,
            )
        return {"ok": True, "verified": True, "event": event_type, "user_matched": True}

    @router.post("/subscription/webhooks/google")
    async def google_subscription_webhook(request: Request):
        """Google Play Real-time Developer Notifications (RTDN) endpoint.

        Google delivers subscription lifecycle changes (renewals, cancels,
        expiries, refunds) via Cloud Pub/Sub push. This mirrors the Apple S2S
        webhook: fail-closed, dedupe on messageId, re-fetch the authoritative
        state from the Play Developer API (never trust the notification alone),
        persist the user's subscription doc, and emit the SAME analytics events
        the Apple path emits so the funnel is store-agnostic.
        """
        from google_play_verifier import (
            parse_rtdn_message,
            event_for_google,
            resolve_subscription_from_purchase_token,
            GooglePlayVerificationError,
        )

        try:
            body = await request.json()
        except Exception:
            body = {}

        now = datetime.now(timezone.utc)

        try:
            note = parse_rtdn_message(body)
        except GooglePlayVerificationError as e:
            logger.warning(f"🚫 Google RTDN DROPPED (unparseable): {e}")
            try:
                await db.google_rtdn_events.insert_one({
                    "received_at": now,
                    "verified": False,
                    "drop_reason": str(e),
                })
            except Exception as persist_err:
                logger.error(f"Google RTDN audit persistence failed: {persist_err}")
            # 200 so Pub/Sub does not redeliver an un-actionable message.
            return {"ok": True, "verified": False}

        # A test publish from the Play Console carries no subscriptionNotification.
        if note.get("is_test_notification"):
            logger.info("📩 Google RTDN test notification received")
            return {"ok": True, "verified": True, "test": True}

        message_id = note.get("message_id")
        purchase_token = note.get("purchase_token")
        product_id = normalize_product_id(note.get("subscription_id"))
        notification_type = note.get("notification_type")

        # Dedupe on Pub/Sub messageId (at-least-once delivery).
        already = None
        if message_id:
            already = await db.google_rtdn_events.find_one(
                {"message_id": message_id, "verified": True}
            )

        # Re-fetch authoritative truth from Google (source of truth).
        status_value, gfields = resolve_subscription_from_purchase_token(
            purchase_token, fallback_product_id=product_id
        )
        resolved_product_id = normalize_product_id(gfields.get("product_id") or product_id)
        plan = plan_for_product(resolved_product_id)

        try:
            await db.google_rtdn_events.update_one(
                {"message_id": message_id} if message_id else {"_temp_id": str(now)},
                {"$set": {
                    "received_at": now,
                    "verified": True,
                    "notification_type": notification_type,
                    "purchase_token": purchase_token,
                    "product_id": resolved_product_id,
                    "resolved_status": status_value,
                }},
                upsert=True,
            )
        except Exception as e:
            logger.error(f"Google RTDN verified-audit persistence failed: {e}")

        if already:
            return {"ok": True, "verified": True, "duplicate": True}

        # Match the user by the stable purchase token (stored as
        # original_transaction_id on Android validate/sync).
        user = None
        if purchase_token:
            user = await db.users.find_one(
                {"subscription.original_transaction_id": purchase_token},
                {"subscription": 1, "is_comp": 1, "is_internal": 1, "founding_member": 1},
            )
        if not user:
            logger.warning(
                "Google RTDN: verified but no user for purchaseToken; event skipped."
            )
            return {"ok": True, "verified": True, "user_matched": False}

        user_id = str(user["_id"])

        # Keep the persisted subscription doc in sync with Google's truth.
        if plan:
            await _persist_subscription_record(
                db,
                user_id,
                product_id=resolved_product_id,
                plan=plan,
                status=status_value,
                transaction_id=gfields.get("transaction_id"),
                original_transaction_id=gfields.get("original_transaction_id") or purchase_token,
                purchase_date=gfields.get("purchase_date"),
                expiration_date=gfields.get("expiration_date"),
                app_account_token=None,
                consume_trigger=False,
            )

        event_type = event_for_google(notification_type)
        if not event_type:
            return {"ok": True, "verified": True, "event": None}

        metadata: Dict[str, Any] = {
            "plan_id": resolved_product_id,
            "plan": plan,
            "source": "google",
            "notification_type": notification_type,
            "is_comp": bool(user.get("is_comp", False)),
            "is_internal": bool(user.get("is_internal", False)),
            "is_founding_member": bool(user.get("founding_member", False)),
        }
        if event_type in ("subscription_started", "subscription_renewed"):
            metadata["revenue_usd"] = PRODUCT_PRICE_USD.get(resolved_product_id)
        if event_type == "subscription_renewed":
            prior = await db.user_events.count_documents(
                {"user_id": user_id, "event_type": "subscription_renewed"}
            )
            metadata["renewal_count"] = prior + 1
        if event_type == "subscription_refunded":
            price = PRODUCT_PRICE_USD.get(resolved_product_id)
            metadata["revenue_usd"] = (-price) if price is not None else None

        await track_user_event(db, user_id, event_type, metadata)
        logger.info(f"✅ Google RTDN emitted {event_type} for user {user_id}")

        if event_type == "subscription_started":
            await notify_new_subscription_discord(
                db,
                user_id=user_id,
                product_id=resolved_product_id,
                plan=plan,
                revenue_usd=metadata.get("revenue_usd"),
                source="google",
                txn_key=purchase_token,
            )
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
