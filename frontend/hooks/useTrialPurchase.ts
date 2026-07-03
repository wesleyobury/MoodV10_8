/**
 * MOOD V2 — direct trial purchase (Phase 4.1a).
 *
 * The 'Start 7-Day Free Trial' CTA must go STRAIGHT to StoreKit (Apple's
 * native sheet) — it must NOT open MOOD's PaywallModal. Apple decides
 * introductory-offer eligibility; MOOD never pre-labels trial vs paid.
 *
 * Web/Expo Go (no native StoreKit): DEV-only optimistic flip so QA can
 * proceed; production returns an error rather than granting access.
 */
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { validateSubscriptionTransaction } from './subscription/subscriptionApi';
import { Analytics } from '../utils/analytics';
import {
  MONTHLY_TRIAL_PRODUCT_ID,
  appAccountTokenForUserId,
  isStoreKitAvailable,
  purchase as storeKitPurchase,
} from '../modules/mood-storekit/src';

export type TrialResult = 'success' | 'cancelled' | 'error';

export function useTrialPurchase() {
  const { token, user, refreshSubscriptionState } = useAuth();
  const { setStatus } = useSubscription();

  const startTrial = useCallback(
    async (triggerSource: string): Promise<TrialResult> => {
      Analytics.trialStarted(token, { plan: 'monthly', trigger_source: triggerSource });

      if (!isStoreKitAvailable()) {
        // DEV/QA convenience only (web preview / Expo Go). In production we
        // must NOT grant a trial without a real StoreKit/Play transaction —
        // return an error so the caller surfaces it instead of unlocking.
        if (__DEV__) {
          setStatus('in_trial');
          await refreshSubscriptionState();
          return 'success';
        }
        return 'error';
      }

      try {
        const result = await storeKitPurchase(
          MONTHLY_TRIAL_PRODUCT_ID,
          appAccountTokenForUserId(user?.id),
        );
        if (result.status === 'success') {
          if (token) {
            await validateSubscriptionTransaction(token, result, {
              trigger_source: triggerSource,
            });
            await refreshSubscriptionState();
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
    [token, user?.id, refreshSubscriptionState, setStatus]
  );

  return { startTrial };
}
