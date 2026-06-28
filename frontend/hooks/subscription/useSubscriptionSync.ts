import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAuth } from '../../contexts/AuthContext';
import { useSubscription, type SubscriptionStatus } from '../../contexts/SubscriptionContext';
import { mapServerStatusToLocal } from './mapSubscriptionStatus';
import type { SubscriptionSyncResponse } from './subscriptionApi';
import { listenForSubscriptionUpdates, syncSubscriptionOnAppOpen } from './subscriptionSync';

function applySyncResponse(
  response: SubscriptionSyncResponse | null | undefined,
  setStatus: (status: SubscriptionStatus) => void,
) {
  if (!response?.status) return;
  const mapped = mapServerStatusToLocal(response.status);
  if (mapped) {
    setStatus(mapped);
  }
}

/**
 * Reconcile StoreKit entitlements with the backend on app open / foreground.
 * Updates SubscriptionContext status and refreshes server entitlement.
 */
export function useSubscriptionSync() {
  const { token, refreshEntitlement, refreshUser } = useAuth();
  const { setStatus } = useSubscription();
  const syncingRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  const runSync = useCallback(
    async (force = false) => {
      if (!token || syncingRef.current) return;
      syncingRef.current = true;
      try {
        const { response } = await syncSubscriptionOnAppOpen(token, { force });
        applySyncResponse(response, setStatus);
        await refreshEntitlement();
        await refreshUser();
      } catch (err) {
        console.error('[IAP] subscription sync failed', err);
      } finally {
        syncingRef.current = false;
      }
    },
    [token, setStatus, refreshEntitlement, refreshUser],
  );

  // Cold start + login
  useEffect(() => {
    if (!token) return;
    runSync(false);
  }, [token, runSync]);

  // Foreground
  useEffect(() => {
    if (!token) return;

    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      const wasBackground = appStateRef.current.match(/inactive|background/);
      appStateRef.current = nextState;
      if (wasBackground && nextState === 'active') {
        runSync(false);
      }
    });

    return () => sub.remove();
  }, [token, runSync]);

  // Renewals / trial conversions while app is open
  useEffect(() => {
    if (!token) return () => {};

    return listenForSubscriptionUpdates(token, async (response) => {
      applySyncResponse(response, setStatus);
      await refreshEntitlement();
      await refreshUser();
    });
  }, [token, setStatus, refreshEntitlement, refreshUser]);

  return { syncSubscription: runSync };
}

/** Mount inside <SubscriptionProvider> — runs app-open / foreground IAP sync. */
export function SubscriptionSyncRunner() {
  useSubscriptionSync();
  return null;
}
