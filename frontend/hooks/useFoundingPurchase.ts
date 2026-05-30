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
import { apiFetch } from '../utils/api';
import { Analytics } from '../utils/analytics';
import {
  FOUNDING_PRODUCT_ID,
  isStoreKitAvailable,
  purchase as storeKitPurchase,
} from '../modules/mood-storekit/src';

export type FoundingClaimResult = 'success' | 'cancelled' | 'error' | 'ineligible';

export function useFoundingPurchase() {
  const { token, refreshEntitlement } = useAuth();
  const { setStatus } = useSubscription();

  const claimFounding = useCallback(
    async (triggerSource: string): Promise<FoundingClaimResult> => {
      Analytics.foundingModalClaimed(token, { trigger_source: triggerSource });

      // 1) Reserve the founding SKU server-side.
      const claim = await apiFetch<{ sku_id: string }>('/api/me/claim-founding', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!claim.ok || !claim.data?.sku_id) {
        return 'ineligible';
      }
      const sku = claim.data.sku_id || FOUNDING_PRODUCT_ID;

      // 2) Purchase. Web/Expo Go: optimistic.
      if (!isStoreKitAvailable()) {
        setStatus('active');
        await refreshEntitlement();
        return 'success';
      }

      try {
        const result = await storeKitPurchase(sku);
        if (result.status === 'success') {
          if (token) {
            await apiFetch('/api/subscription/validate', {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                signed_payload: result.signedPayload,
                product_id: result.productID,
                transaction_id: result.transactionID,
                original_transaction_id: result.originalTransactionID,
                purchase_date: result.purchaseDate,
                expiration_date: result.expirationDate,
              }),
            }).catch(() => {});
          }
          Analytics.subscriptionPurchased(token, {
            plan: 'annual',
            trigger_source: triggerSource,
          });
          setStatus('active');
          await refreshEntitlement();
          return 'success';
        }
        if (result.status === 'cancelled') return 'cancelled';
        return 'error';
      } catch (e) {
        console.error('Founding purchase failed', e);
        return 'error';
      }
    },
    [token, refreshEntitlement, setStatus]
  );

  return { claimFounding };
}
