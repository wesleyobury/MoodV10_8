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
  fetchMostRecentWorkout,
  fetchSessionMetrics,
  fetchSnapshot as nativeFetchSnapshot,
  getAuthorizationStatus as nativeGetStatus,
  isHealthKitAvailable,
  requestPermissions as nativeRequestPermissions,
  type BiometricSnapshot,
  type HealthAuthorizationStatus,
} from '../modules/mood-healthkit/src';

/** Retrospective metrics from the user's most recent HKWorkout. Held in
 *  context so a sync performed ANYWHERE (achievement card, wearable-data,
 *  settings) is instantly reflected everywhere else. */
export interface LastWorkoutMetrics {
  calories: number | null;
  minutes: number | null;
  avgHr: number | null;
  maxHr: number | null;
  steps: number | null;
  hrv: number | null;
  endISO: string;
}
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
  /** Most recent HKWorkout metrics from the last `syncLastWorkout` call. */
  lastWorkoutMetrics: LastWorkoutMetrics | null;
  /** True while a last-workout sync is in flight. */
  isSyncingWorkout: boolean;
  /** Pull the most recent HKWorkout (any age) + steps/HRV over its window.
   *  Also refreshes the daily snapshot so home/settings update together. */
  syncLastWorkout: () => Promise<LastWorkoutMetrics | null>;
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

  const [lastWorkoutMetrics, setLastWorkoutMetrics] = useState<LastWorkoutMetrics | null>(null);
  const [isSyncingWorkout, setIsSyncingWorkout] = useState(false);

  const syncLastWorkout = useCallback(async (): Promise<LastWorkoutMetrics | null> => {
    if (!available) return null;
    setIsSyncingWorkout(true);
    try {
      const w = await fetchMostRecentWorkout();
      if (!w) return null;
      let steps: number | null = null;
      let hrv: number | null = null;
      try {
        const wm = await fetchSessionMetrics(w.startISO, w.endISO);
        if (wm) {
          steps = wm.stepCount;
          hrv = wm.heartRateVariabilitySDNN;
        }
      } catch { /* partial data is fine */ }
      const m: LastWorkoutMetrics = {
        calories: w.activeEnergyKcal != null && w.activeEnergyKcal > 0 ? Math.round(w.activeEnergyKcal) : null,
        minutes: w.durationSec && w.durationSec > 0 ? Math.max(1, Math.round(w.durationSec / 60)) : null,
        avgHr: w.avgHeartRate != null && w.avgHeartRate > 0 ? Math.round(w.avgHeartRate) : null,
        maxHr: w.maxHeartRate != null && w.maxHeartRate > 0 ? Math.round(w.maxHeartRate) : null,
        steps: steps != null ? Math.round(steps) : null,
        hrv: hrv != null ? Math.round(hrv) : null,
        endISO: w.endISO,
      };
      setLastWorkoutMetrics(m);
      // Daily snapshot follows so home + settings tiles update in lockstep.
      refresh({ silent: true });
      return m;
    } catch {
      return null;
    } finally {
      setIsSyncingWorkout(false);
    }
  }, [available, refresh]);

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

  // Fresh snapshot on mount — do not gate on authorizationStatus; Apple often
  // reports read-only grants as notDetermined even after the user allowed access.
  useEffect(() => {
    if (!available) return;
    refresh({ silent: true });
  }, [available, refresh]);

  const value = useMemo<HealthContextValue>(
    () => ({
      available,
      status,
      snapshot,
      lastSyncedAt,
      isRefreshing,
      requestPermissions,
      refresh,
      lastWorkoutMetrics,
      isSyncingWorkout,
      syncLastWorkout,
    }),
    [available, status, snapshot, lastSyncedAt, isRefreshing, requestPermissions, refresh, lastWorkoutMetrics, isSyncingWorkout, syncLastWorkout],
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
