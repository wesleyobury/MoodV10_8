/**
 * MOOD V2 — founding claim + purchase flow (Phase 2).
 */
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { validateSubscriptionTransaction } from './subscription/subscriptionApi';
import { apiFetch } from '../utils/api';
import { Analytics } from '../utils/analytics';
import {
  FOUNDING_PRODUCT_ID,
  appAccountTokenForUserId,
  isStoreKitAvailable,
  purchase as storeKitPurchase,
} from '../modules/mood-storekit/src';

export type FoundingClaimResult = 'success' | 'cancelled' | 'error' | 'ineligible';

export function useFoundingPurchase() {
  const { token, user, refreshSubscriptionState } = useAuth();
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
        // DEV/QA convenience only (web preview / Expo Go). In production we must
        // NOT grant founding access without a real transaction — return an error
        // so the caller surfaces it instead of unlocking the app for free.
        if (__DEV__) {
          Analytics.foundingMemberClaimed(token, { revenue_usd: 39 });
          Analytics.purchaseCompleted(token, { plan_id: sku, revenue_usd: 39, is_trial: false });
          setStatus('active');
          await refreshSubscriptionState();
          return 'success';
        }
        Analytics.purchaseFailed(token, { plan_id: sku, failure_reason: 'unknown' });
        return 'error';
      }

      try {
        const result = await storeKitPurchase(sku, appAccountTokenForUserId(user?.id));
        if (result.status === 'success') {
          if (token) {
            await validateSubscriptionTransaction(token, result, {
              trigger_source: triggerSource,
            });
            await refreshSubscriptionState();
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
    [token, user?.id, refreshSubscriptionState, setStatus]
  );

  return { claimFounding };
}
