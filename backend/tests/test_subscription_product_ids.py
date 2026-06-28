"""Unit tests for subscription product ID mapping and Apple status resolution."""

from datetime import datetime, timezone, timedelta

from apple_transaction_verifier import subscription_status_from_apple_fields
from subscriptions import (
    PRODUCT_ANNUAL,
    PRODUCT_MONTHLY,
    PRODUCT_FOUNDING_ANNUAL,
    normalize_product_id,
    plan_for_product,
    subscription_status_for,
)


def test_plan_for_product_canonical_ids():
    assert plan_for_product("com.mood.subscription.monthly") == "monthly"
    assert plan_for_product("com.mood.subscription.annual") == "annual"
    assert plan_for_product("com.mood.subscription.founding_annual") == "founding_annual"


def test_plan_for_product_trims_whitespace():
    assert plan_for_product(" com.mood.subscription.monthly ") == "monthly"


def test_plan_for_product_rejects_unknown_and_legacy():
    assert plan_for_product("mood_premium_monthly") is None
    assert plan_for_product("unknown.sku") is None


def test_normalize_product_id():
    assert normalize_product_id(" com.mood.subscription.monthly ") == PRODUCT_MONTHLY
    assert normalize_product_id(None) == ""


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
