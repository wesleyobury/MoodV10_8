"""Unit tests for subscription product ID mapping (validate endpoint)."""

from subscriptions import (
    PRODUCT_ANNUAL,
    PRODUCT_MONTHLY,
    PRODUCT_FOUNDING_ANNUAL,
    normalize_product_id,
    plan_for_product,
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
