import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  fetchSnapshot as nativeFetchSnapshot,
  getAuthorizationStatus as nativeGetStatus,
  isHealthKitAvailable,
  requestPermissions as nativeRequestPermissions,
  type BiometricSnapshot,
  type HealthAuthorizationStatus,
} from '../modules/mood-healthkit/src';
import {
  loadSnapshot,
  saveSnapshot,
} from '../utils/healthStorage';
import { useAuth } from './AuthContext';
import { Analytics } from '../utils/analytics';

interface HealthContextValue {
  /** True if this build/platform can talk to HealthKit at all. */
  available: boolean;
  /** Permission state from HealthKit (see native module for caveats). */
  status: HealthAuthorizationStatus;
  /** Latest persisted snapshot. */
  snapshot: BiometricSnapshot | null;
  /** ISO timestamp of the most recent successful fetch, or null. */
  lastSyncedAt: string | null;
  /** True while a refresh is in flight. */
  isRefreshing: boolean;
  /** Trigger the iOS permission sheet. Returns whether the request succeeded. */
  requestPermissions: () => Promise<boolean>;
  /** Re-read all 5 metrics from HealthKit and persist. Fails silently. */
  refresh: (opts?: { silent?: boolean }) => Promise<void>;
}

const HealthContext = createContext<HealthContextValue | undefined>(undefined);

interface ProviderProps {
  children: ReactNode;
}

export function HealthProvider({ children }: ProviderProps) {
  const { token } = useAuth();
  const [available] = useState<boolean>(() => isHealthKitAvailable());
  const [status, setStatus] = useState<HealthAuthorizationStatus>(
    available ? 'notDetermined' : 'unavailable',
  );
  const [snapshot, setSnapshot] = useState<BiometricSnapshot | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const appState = useRef(AppState.currentState);
  const tokenRef = useRef<string | null>(null);
  tokenRef.current = token;

  // Hydrate from disk and probe status on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [persisted, currentStatus] = await Promise.all([
        loadSnapshot(),
        available ? nativeGetStatus() : Promise.resolve<HealthAuthorizationStatus>('unavailable'),
      ]);
      if (cancelled) return;
      if (persisted) {
        setSnapshot(persisted);
        setLastSyncedAt(persisted.lastSyncedAt);
      }
      setStatus(currentStatus);
    })();
    return () => {
      cancelled = true;
    };
  }, [available]);

  const refresh = useCallback(
    async ({ silent = true }: { silent?: boolean } = {}) => {
      if (!available) return;
      // We optimistically attempt the fetch even when status === 'notDetermined'
      // because the native call will simply return null fields if denied. This
      // keeps the API symmetric and the indicator silent on denial.
      if (!silent) setIsRefreshing(true);
      try {
        const next = await nativeFetchSnapshot();
        if (!next) return;
        setSnapshot(next);
        setLastSyncedAt(next.lastSyncedAt);
        await saveSnapshot(next);
        if (tokenRef.current) {
          Analytics.healthSnapshotRefreshed(tokenRef.current, {});
        }
      } catch {
        // fail silently — spec says never nag
      } finally {
        if (!silent) setIsRefreshing(false);
      }
    },
    [available],
  );

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!available) return false;
    if (tokenRef.current) {
      Analytics.healthPermissionPrompted(tokenRef.current, {});
    }
    const result = await nativeRequestPermissions();
    const nextStatus = await nativeGetStatus();
    setStatus(nextStatus);

    if (tokenRef.current) {
      if (result.granted) {
        Analytics.healthPermissionGranted(tokenRef.current, {});
      } else {
        Analytics.healthPermissionDenied(tokenRef.current, {
          reason: result.reason,
        });
      }
    }

    // Fire a refresh immediately after a successful grant so the indicator
    // can show "Synced just now".
    if (result.granted) {
      refresh({ silent: true });
    }
    return result.granted;
  }, [available, refresh]);

  // App-foreground refresh.
  useEffect(() => {
    if (!available) return;
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        refresh({ silent: true });
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [available, refresh]);

  // One refresh after first successful hydrate if we already have permission.
  useEffect(() => {
    if (!available) return;
    if (status === 'determined') {
      refresh({ silent: true });
    }
  }, [available, status, refresh]);

  const value = useMemo<HealthContextValue>(
    () => ({
      available,
      status,
      snapshot,
      lastSyncedAt,
      isRefreshing,
      requestPermissions,
      refresh,
    }),
    [available, status, snapshot, lastSyncedAt, isRefreshing, requestPermissions, refresh],
  );

  return <HealthContext.Provider value={value}>{children}</HealthContext.Provider>;
}

export function useHealth(): HealthContextValue {
  const ctx = useContext(HealthContext);
  if (!ctx) {
    throw new Error('useHealth must be used inside HealthProvider');
  }
  return ctx;
}
