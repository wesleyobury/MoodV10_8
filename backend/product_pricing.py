"""
Single source of truth for SKU → USD list price.

Shared by subscription reconciliation (`subscriptions.py`) and admin revenue
analytics (`admin_analytics.py`, `server.py`) so the numbers can never drift
apart. Client `purchase_completed` events do NOT carry `metadata.revenue_usd`
— only server-side `subscription_started` does — so revenue dashboards price
purchases from `metadata.plan_id` using this map instead.
"""

from __future__ import annotations

from typing import Optional

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

# Display prices (USD) per SKU — gross list price for funnel/revenue analytics.
PRODUCT_PRICE_USD = {
    PRODUCT_ANNUAL: 79.0,
    PRODUCT_MONTHLY: 9.99,
    PRODUCT_ANNUAL_PAID: 79.0,
    PRODUCT_MONTHLY_PAID: 9.99,
    PRODUCT_FOUNDING_ANNUAL: 39.0,
}

# Billing period per SKU, in months — used to normalise annual plans to MRR.
PRODUCT_PERIOD_MONTHS = {
    PRODUCT_ANNUAL: 12,
    PRODUCT_MONTHLY: 1,
    PRODUCT_ANNUAL_PAID: 12,
    PRODUCT_MONTHLY_PAID: 1,
    PRODUCT_FOUNDING_ANNUAL: 12,
}

# App/Play store commission taken off the top. Apple & Google both charge 15%
# under their Small Business Programs (developers under ~$1M/yr) and 30% above
# that threshold. Change this ONE constant if MOOD crosses $1M/yr.
STORE_COMMISSION_RATE = 0.15


def price_for_plan(plan_id: Optional[str]) -> float:
    """USD list price for a SKU. Returns 0.0 for unknown or missing plan ids."""
    if not plan_id:
        return 0.0
    return float(PRODUCT_PRICE_USD.get(plan_id, 0.0))


def net_price_for_plan(plan_id: Optional[str]) -> float:
    """List price after the store's commission (developer take-home)."""
    return round(price_for_plan(plan_id) * (1.0 - STORE_COMMISSION_RATE), 4)


def monthly_price_for_plan(plan_id: Optional[str]) -> float:
    """Gross price normalised to a monthly figure (annual ÷ 12) for MRR."""
    if not plan_id:
        return 0.0
    months = PRODUCT_PERIOD_MONTHS.get(plan_id, 1) or 1
    return price_for_plan(plan_id) / months
