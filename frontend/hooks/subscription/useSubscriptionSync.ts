import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { useAuth } from '../../contexts/AuthContext';
import { listenForSubscriptionUpdates, syncSubscriptionOnAppOpen } from './subscriptionSync';

/**
 * Reconcile StoreKit entitlements with the backend on app open / foreground.
 * Server state is refreshed via refreshSubscriptionState() — the single SoT path.
 */
export function useSubscriptionSync() {
  const { token, refreshSubscriptionState } = useAuth();
  const syncingRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  const tokenRef = useRef(token);
  const refreshRef = useRef(refreshSubscriptionState);

  tokenRef.current = token;
  refreshRef.current = refreshSubscriptionState;

  const runSync = useCallback(async (force = false) => {
    const currentToken = tokenRef.current;
    if (!currentToken || syncingRef.current) return;
    syncingRef.current = true;
    try {
      const { skipped } = await syncSubscriptionOnAppOpen(currentToken, { force });
      if (skipped) return;
      await refreshRef.current();
    } catch (err) {
      console.error('[IAP] subscription sync failed', err);
    } finally {
      syncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    runSync(false);
  }, [token, runSync]);

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

  useEffect(() => {
    if (!token) return () => {};

    return listenForSubscriptionUpdates(token, async () => {
      await refreshRef.current();
    });
  }, [token]);

  return { syncSubscription: runSync };
}

/** Mount inside <SubscriptionProvider> — runs app-open / foreground IAP sync. */
export function SubscriptionSyncRunner() {
  useSubscriptionSync();
  return null;
}
