"""Unit tests for subscription product ID mapping and Apple status resolution."""

from datetime import datetime, timezone, timedelta
from types import SimpleNamespace

from apple_transaction_verifier import subscription_status_from_apple_fields
import subscriptions
from subscriptions import (
    PRODUCT_ANNUAL,
    PRODUCT_MONTHLY,
    PRODUCT_FOUNDING_ANNUAL,
    PRODUCT_ANNUAL_PAID,
    PRODUCT_MONTHLY_PAID,
    _reconcile_from_payload,
    app_account_token_for_user_id,
    analytics_source_for,
    normalize_product_id,
    plan_for_product,
    subscription_status_for,
)


def test_plan_for_product_canonical_ids():
    assert plan_for_product("com.mood.subscription.monthly") == "monthly"
    assert plan_for_product("com.mood.subscription.annual") == "annual"
    assert plan_for_product("com.mood.subscription.monthly.paid") == "monthly"
    assert plan_for_product("com.mood.subscription.annual.paid") == "annual"
    assert plan_for_product("com.mood.subscription.founding_annual") == "founding_annual"


def test_plan_for_product_trims_whitespace():
    assert plan_for_product(" com.mood.subscription.monthly ") == "monthly"


def test_plan_for_product_rejects_unknown_and_legacy():
    assert plan_for_product("mood_premium_monthly") is None
    assert plan_for_product("unknown.sku") is None


def test_normalize_product_id():
    assert normalize_product_id(" com.mood.subscription.monthly ") == PRODUCT_MONTHLY
    assert normalize_product_id(None) == ""


def test_paid_product_constants():
    assert PRODUCT_MONTHLY_PAID == "com.mood.subscription.monthly.paid"
    assert PRODUCT_ANNUAL_PAID == "com.mood.subscription.annual.paid"


def test_app_account_token_for_user_id_is_stable_uuid():
    token = app_account_token_for_user_id("64b7f0f00000000000000001")
    assert token == app_account_token_for_user_id("64b7f0f00000000000000001")
    assert token == "00000000-64b7-50f0-8000-000000000001"
    assert app_account_token_for_user_id("not-an-object-id") is None


def test_subscription_status_for_lapsed():
    past = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
    assert subscription_status_for(past) == "lapsed"


def test_subscription_status_from_apple_free_trial():
    future = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    assert subscription_status_from_apple_fields({
        "expiration_date": future,
        "offer_discount_type": "FREE_TRIAL",
    }) == "in_trial"


def test_subscription_status_from_apple_paid_renewal():
    """Sandbox paid cycles are short — must not be classified as trial."""
    future = (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
    assert subscription_status_from_apple_fields({
        "expiration_date": future,
        "offer_type": None,
        "offer_discount_type": None,
        "price": 999,
    }) == "active"


def test_subscription_status_from_apple_intro_zero_price():
    future = (datetime.now(timezone.utc) + timedelta(minutes=3)).isoformat()
    assert subscription_status_from_apple_fields({
        "expiration_date": future,
        "offer_type": 1,
        "offer_discount_type": None,
        "price": 0,
    }) == "in_trial"


def test_android_platform_routes_to_google_purchase_token_verifier(monkeypatch):
    calls = []

    def fake_resolver(purchase_token, *, fallback_product_id=None):
        calls.append((purchase_token, fallback_product_id))
        return "active", {
            "product_id": fallback_product_id,
            "transaction_id": "GPA.1234",
            "original_transaction_id": purchase_token,
            "purchase_date": "2026-07-04T00:00:00Z",
            "expiration_date": "2026-08-04T00:00:00Z",
        }

    monkeypatch.setattr(subscriptions, "resolve_subscription_from_purchase_token", fake_resolver)
    payload = SimpleNamespace(
        platform="google",
        signed_payload="play-purchase-token",
        product_id=PRODUCT_MONTHLY,
        app_account_token="00000000-64b7-50f0-8000-000000000001",
    )

    status, fields = _reconcile_from_payload(payload)

    assert status == "active"
    assert fields["transaction_id"] == "GPA.1234"
    assert fields["original_transaction_id"] == "play-purchase-token"
    assert fields["app_account_token"] == "00000000-64b7-50f0-8000-000000000001"
    assert calls == [("play-purchase-token", PRODUCT_MONTHLY)]


def test_analytics_source_for_android_aliases():
    assert analytics_source_for("google") == "google"
    assert analytics_source_for("android") == "google"
    assert analytics_source_for("play") == "google"
    assert analytics_source_for("ios") == "apple"
