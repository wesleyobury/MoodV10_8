/**
 * MOOD V2 — founding claim + purchase flow (Phase 2).
 *
 * Shared by FoundingOfferModal, FoundingBanner, and the reveal-payoff
 * founding variant. Steps:
 *   1. POST /api/me/claim-founding  (validates eligibility, locks the SKU)
 *   2. StoreKit purchase with the returned founding SKU
 *   3. POST /api/subscription/validate  (server marks founding_pricing_claimed)
 *   4. refreshEntitlement() so the app reflects full access immediately
 *
 * On web/Expo Go (no native StoreKit) we optimistically flip local state so
 * QA can proceed; the real iOS build hits Apple's sheet.
 */
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { mapServerStatusToLocal } from './subscription/mapSubscriptionStatus';
import { validateSubscriptionTransaction } from './subscription/subscriptionApi';
import { apiFetch } from '../utils/api';
import { Analytics } from '../utils/analytics';
import {
  FOUNDING_PRODUCT_ID,
  isStoreKitAvailable,
  purchase as storeKitPurchase,
} from '../modules/mood-storekit/src';

export type FoundingClaimResult = 'success' | 'cancelled' | 'error' | 'ineligible';

export function useFoundingPurchase() {
  const { token, refreshEntitlement, refreshUser } = useAuth();
  const { setStatus } = useSubscription();

  const claimFounding = useCallback(
    async (triggerSource: string): Promise<FoundingClaimResult> => {
      Analytics.foundingModalClaimed(token, { trigger_source: triggerSource });

      console.log('[IAP] POST /api/me/claim-founding — starting');
      const claim = await apiFetch<{ sku_id: string }>('/api/me/claim-founding', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!claim.ok || !claim.data?.sku_id) {
        console.error('[IAP] POST /api/me/claim-founding — FAILED', claim.status, claim.error);
        return 'ineligible';
      }
      console.log('[IAP] POST /api/me/claim-founding — OK', claim.status, { sku_id: claim.data.sku_id });
      const sku = claim.data.sku_id || FOUNDING_PRODUCT_ID;

      Analytics.purchaseInitiated(token, { plan_id: sku });

      if (!isStoreKitAvailable()) {
        Analytics.foundingMemberClaimed(token, { revenue_usd: 39 });
        Analytics.purchaseCompleted(token, { plan_id: sku, revenue_usd: 39, is_trial: false });
        setStatus('active');
        await refreshEntitlement();
        return 'success';
      }

      try {
        const result = await storeKitPurchase(sku);
        if (result.status === 'success') {
          if (token) {
            const validateRes = await validateSubscriptionTransaction(token, result, {
              trigger_source: triggerSource,
              status_hint: 'active',
            });
            const mapped = mapServerStatusToLocal(validateRes.data?.status);
            setStatus(mapped ?? 'active');
            await refreshEntitlement();
            await refreshUser();
          } else {
            setStatus('active');
          }
          Analytics.subscriptionPurchased(token, {
            plan: 'annual',
            trigger_source: triggerSource,
          });
          Analytics.foundingMemberClaimed(token, { revenue_usd: 39 });
          Analytics.purchaseCompleted(token, {
            plan_id: result.productID,
            revenue_usd: 39,
            is_trial: false,
          });
          return 'success';
        }
        if (result.status === 'cancelled') {
          Analytics.purchaseFailed(token, { plan_id: sku, failure_reason: 'user_cancelled' });
          return 'cancelled';
        }
        Analytics.purchaseFailed(token, { plan_id: sku, failure_reason: 'unknown' });
        return 'error';
      } catch (e) {
        console.error('Founding purchase failed', e);
        Analytics.purchaseFailed(token, { plan_id: sku, failure_reason: 'unknown' });
        return 'error';
      }
    },
    [token, refreshEntitlement, refreshUser, setStatus]
  );

  return { claimFounding };
}
