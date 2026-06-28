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
import { mapServerStatusToLocal } from './subscription/mapSubscriptionStatus';
import { validateSubscriptionTransaction } from './subscription/subscriptionApi';
import { Analytics } from '../utils/analytics';
import {
  MONTHLY_PRODUCT_ID,
  isStoreKitAvailable,
  purchase as storeKitPurchase,
} from '../modules/mood-storekit/src';

export type TrialResult = 'success' | 'cancelled' | 'error';

export function useTrialPurchase() {
  const { token, refreshEntitlement, refreshUser } = useAuth();
  const { setStatus } = useSubscription();

  const startTrial = useCallback(
    async (triggerSource: string): Promise<TrialResult> => {
      Analytics.trialStarted(token, { plan: 'monthly', trigger_source: triggerSource });

      if (!isStoreKitAvailable()) {
        setStatus('in_trial');
        await refreshEntitlement();
        return 'success';
      }

      try {
        const result = await storeKitPurchase(MONTHLY_PRODUCT_ID);
        if (result.status === 'success') {
          if (token) {
            const validateRes = await validateSubscriptionTransaction(token, result, {
              trigger_source: triggerSource,
              status_hint: 'in_trial',
            });
            const mapped = mapServerStatusToLocal(validateRes.data?.status);
            setStatus(mapped ?? 'in_trial');
            await refreshEntitlement();
            await refreshUser();
          } else {
            setStatus('in_trial');
          }
          Analytics.subscriptionPurchased(token, { plan: 'monthly', trigger_source: triggerSource });
          return 'success';
        }
        if (result.status === 'cancelled') return 'cancelled';
        return 'error';
      } catch (e) {
        console.error('Trial purchase failed', e);
        return 'error';
      }
    },
    [token, refreshEntitlement, refreshUser, setStatus]
  );

  return { startTrial };
}
