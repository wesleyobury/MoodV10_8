/**
 * useStorePrices — live subscription prices from StoreKit / Play Billing.
 *
 * Apple (App Store Review Guideline 3.1.2 / 2.3.x) expects the price shown in
 * the paywall UI to match the price the native purchase sheet charges, in the
 * user's own currency. Hardcoded strings drift from App Store Connect and
 * break in non-USD storefronts, so we fetch the real product metadata via
 * `getProducts()` and expose ready-to-render strings.
 *
 * Everything is optional: on web / Expo Go / a cold store cache the hook
 * returns `loaded: false` and callers fall back to their pinned constants,
 * so the paywall always renders a price.
 */
import { useEffect, useState } from 'react';
import {
  MONTHLY_PAID_PRODUCT_ID,
  MONTHLY_TRIAL_PRODUCT_ID,
  YEARLY_PAID_PRODUCT_ID,
  YEARLY_TRIAL_PRODUCT_ID,
  getProducts,
  isStoreKitAvailable,
} from '../modules/mood-storekit/src';

export interface StorePrices {
  /** True once real product metadata has loaded from the store. */
  loaded: boolean;
  /** Raw localized period price, e.g. "$9.99". */
  monthlyDisplay?: string;
  /** Raw localized period price, e.g. "$79.99". */
  annualDisplay?: string;
  /** Annual price ÷ 12, localized, e.g. "$6.67". */
  annualPerMonthDisplay?: string;
  /** Whole-number savings of annual vs 12× monthly, e.g. 33. */
  annualSavingsPct?: number;
  currencyCode?: string | null;
}

/** Format a number as currency, falling back to a plain 2-dp string. */
function formatCurrency(amount: number, currencyCode: string | null | undefined): string {
  if (currencyCode) {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currencyCode,
      }).format(amount);
    } catch {
      // Intl unavailable / bad currency code — fall through.
    }
  }
  return amount.toFixed(2);
}

export function useStorePrices(): StorePrices {
  const [prices, setPrices] = useState<StorePrices>({ loaded: false });

  useEffect(() => {
    let cancelled = false;
    if (!isStoreKitAvailable()) return;

    (async () => {
      try {
        const products = await getProducts([
          MONTHLY_PAID_PRODUCT_ID,
          YEARLY_PAID_PRODUCT_ID,
          MONTHLY_TRIAL_PRODUCT_ID,
          YEARLY_TRIAL_PRODUCT_ID,
        ]);
        if (cancelled || products.length === 0) return;

        const monthly =
          products.find((p) => p.productID === MONTHLY_PAID_PRODUCT_ID) ??
          products.find((p) => p.productID === MONTHLY_TRIAL_PRODUCT_ID);
        const annual =
          products.find((p) => p.productID === YEARLY_PAID_PRODUCT_ID) ??
          products.find((p) => p.productID === YEARLY_TRIAL_PRODUCT_ID);

        const next: StorePrices = {
          loaded: true,
          monthlyDisplay: monthly?.displayPrice,
          annualDisplay: annual?.displayPrice,
          currencyCode: annual?.currencyCode ?? monthly?.currencyCode ?? null,
        };

        if (annual?.priceDecimal) {
          const perMonth = annual.priceDecimal / 12;
          next.annualPerMonthDisplay = formatCurrency(perMonth, next.currencyCode);
          if (monthly?.priceDecimal) {
            const pct = Math.round((1 - perMonth / monthly.priceDecimal) * 100);
            if (pct > 0) next.annualSavingsPct = pct;
          }
        }

        setPrices(next);
      } catch {
        // Leave loaded:false — callers keep their fallback labels.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return prices;
}
