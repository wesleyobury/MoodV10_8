/**
 * MOOD V2 — direct trial purchase (Phase 4.1a).
 *
 * The 'Start 7-Day Free Trial' CTA must go STRAIGHT to StoreKit (Apple's
 * native sheet) — it must NOT open MOOD's PaywallModal. This hook performs
 * that purchase against the monthly SKU (7-day trial, then $9.99/mo).
 *
 * Web/Expo Go (no native StoreKit): optimistic local flip so QA can proceed.
 */
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { apiFetch } from '../utils/api';
import { Analytics } from '../utils/analytics';
import {
  MONTHLY_PRODUCT_ID,
  isStoreKitAvailable,
  purchase as storeKitPurchase,
} from '../modules/mood-storekit/src';

export type TrialResult = 'success' | 'cancelled' | 'error';

export function useTrialPurchase() {
  const { token, refreshEntitlement } = useAuth();
  const { setStatus } = useSubscription();

  const startTrial = useCallback(
    async (triggerSource: string): Promise<TrialResult> => {
      Analytics.trialStarted(token, { plan: 'monthly', trigger_source: triggerSource });

      if (!isStoreKitAvailable()) {
        // Web/Expo Go QA path — optimistic trial.
        setStatus('in_trial');
        await refreshEntitlement();
        return 'success';
      }

      try {
        const result = await storeKitPurchase(MONTHLY_PRODUCT_ID);
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
                trigger_source: triggerSource,
              }),
            }).catch(() => {});
          }
          Analytics.subscriptionPurchased(token, { plan: 'monthly', trigger_source: triggerSource });
          setStatus('active');
          await refreshEntitlement();
          return 'success';
        }
        if (result.status === 'cancelled') return 'cancelled';
        return 'error';
      } catch (e) {
        console.error('Trial purchase failed', e);
        return 'error';
      }
    },
    [token, refreshEntitlement, setStatus]
  );

  return { startTrial };
}
