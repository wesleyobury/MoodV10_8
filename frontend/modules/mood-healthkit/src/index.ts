/**
 * mood-healthkit — RN bridge to the native HealthKit module.
 *
 * Surface area is intentionally tiny: two methods. The RN layer (HealthContext)
 * handles all persistence, sync indicator state, and analytics — this file
 * only forwards to native.
 *
 * On non-iOS / Expo Go / unsupported builds the native module is absent;
 * we return safe defaults so callers never crash.
 */
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

export type HealthAuthorizationStatus =
  | 'unavailable'
  | 'notDetermined'
  | 'determined';

/**
 * The heart-rate-variability metric this platform actually reports.
 * iOS/HealthKit → SDNN. Android/Health Connect → RMSSD. These are DIFFERENT
 * measures and are not numerically interchangeable, so any HRV number must be
 * labelled with the right metric name. The value is still carried in the
 * `heartRateVariabilitySDNN` field for API compatibility across platforms.
 */
export const HRV_METRIC: 'SDNN' | 'RMSSD' =
  Platform.OS === 'android' ? 'RMSSD' : 'SDNN';

/** User-facing name of the OS health data source, for UI copy. */
export const HEALTH_SOURCE_NAME: string =
  Platform.OS === 'android' ? 'Health Connect' : 'Apple Health';

export interface BiometricSnapshot {
  /** Most recent resting heart rate within last 7 days, in BPM. */
  restingHeartRate: number | null;
  /** Most recent HRV SDNN within last 7 days, in milliseconds. */
  heartRateVariabilitySDNN: number | null;
  /** Total asleep duration for last night (6pm yesterday → 11am today), in minutes. */
  asleepDurationMinutes: number | null;
  /** Yesterday's active energy burned, in kcal. */
  activeEnergyBurnedKcal: number | null;
  /** Yesterday's total step count. */
  stepCount: number | null;
  /** ISO-8601 timestamp of when this snapshot was assembled. */
  lastSyncedAt: string;
}

interface NativeModuleShape {
  isHealthDataAvailable: boolean;
  getAuthorizationStatus(): Promise<HealthAuthorizationStatus>;
  requestPermissions(): Promise<{ granted: boolean; reason: string }>;
  fetchSnapshot(): Promise<BiometricSnapshot | null>;
  startHeartRateStream(): Promise<boolean>;
  stopHeartRateStream(): Promise<boolean>;
  fetchSessionMetrics(startISO: string, endISO: string): Promise<SessionMetrics | null>;
  fetchMostRecentWorkout(): Promise<RecentWorkout | null>;
  addListener(eventName: string, listener: (...args: any[]) => void): { remove: () => void };
}

export interface LiveHeartRateSample {
  bpm: number;
  timestamp: string;
}

/** The user's most recent HKWorkout (Watch or any Health source). */
export interface RecentWorkout {
  startISO: string;
  endISO: string;
  /** Workout duration in seconds. */
  durationSec: number;
  activeEnergyKcal: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
}

/** Session-window aggregates returned by `fetchSessionMetrics`. */
export interface SessionMetrics {
  /** Active energy burned during the session window, in kcal. */
  activeEnergyKcal: number | null;
  /** Step count recorded during the session window. */
  stepCount: number | null;
  /** Most-recent HRV SDNN sample (ms) within the session window. */
  heartRateVariabilitySDNN: number | null;
}

const native = requireOptionalNativeModule<NativeModuleShape>('MoodHealthKit');

/** Raw probe values for the in-app diagnostics card on the wearable-data
 *  screen. Lets us tell apart "module wasn't compiled into this build" from
 *  "module loaded but iOS reports HealthKit unavailable on this device". */
export const getHealthKitDiagnostics = () => ({
  platformOS: Platform.OS,
  nativeModuleRegistered: !!native,
  isHealthDataAvailable: native?.isHealthDataAvailable ?? null,
});

/** True if native health data is reachable from this build. False in Expo Go / web.
 *  iOS → HealthKit; Android → Health Connect (isHealthDataAvailable is true only
 *  when the Health Connect SDK reports SDK_AVAILABLE on the device). */
export const isHealthKitAvailable = (): boolean => {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return false;
  return !!native && native.isHealthDataAvailable === true;
};

export const getAuthorizationStatus = async (): Promise<HealthAuthorizationStatus> => {
  if (!native) return 'unavailable';
  try {
    return await native.getAuthorizationStatus();
  } catch {
    return 'unavailable';
  }
};

export const requestPermissions = async (): Promise<{ granted: boolean; reason: string }> => {
  if (!native) return { granted: false, reason: 'unavailable' };
  try {
    return await native.requestPermissions();
  } catch (err: any) {
    return { granted: false, reason: err?.message ?? 'unknown' };
  }
};

export const fetchSnapshot = async (): Promise<BiometricSnapshot | null> => {
  if (!native) return null;
  try {
    return await native.fetchSnapshot();
  } catch {
    return null;
  }
};

/** Query HealthKit for session-window aggregates between two ISO timestamps.
 *  Returns calories (active energy), step count, and HRV most-recent sample.
 *  Returns null on non-iOS / no-permission / no-data conditions. */
export const fetchSessionMetrics = async (
  startISO: string,
  endISO: string,
): Promise<SessionMetrics | null> => {
  if (!native) return null;
  try {
    return await native.fetchSessionMetrics(startISO, endISO);
  } catch {
    return null;
  }
};

/** Query the user's most recent HKWorkout (e.g. an Apple Watch workout) and its
 *  actuals — real calories, duration, and avg/max heart rate. Lets past or
 *  Watch-recorded workouts surface real numbers. Null on non-iOS / no data. */
export const fetchMostRecentWorkout = async (): Promise<RecentWorkout | null> => {
  if (!native) return null;
  try {
    return await native.fetchMostRecentWorkout();
  } catch {
    return null;
  }
};

/** Begin streaming live HR samples. The returned subscription removes the
 *  listener AND stops the native query — always call it when the session ends. */
export const subscribeHeartRateStream = async (
  listener: (sample: LiveHeartRateSample) => void,
): Promise<{ remove: () => Promise<void> }> => {
  if (!native) {
    return { remove: async () => {} };
  }
  const sub = native.addListener('onHeartRateSample', (event: any) => {
    if (event && typeof event.bpm === 'number' && typeof event.timestamp === 'string') {
      listener({ bpm: event.bpm, timestamp: event.timestamp });
    }
  });
  try {
    await native.startHeartRateStream();
  } catch {
    // start failed — listener will simply never fire; remove() is still safe
  }
  return {
    remove: async () => {
      try {
        sub.remove();
      } catch {
        // ignore
      }
      try {
        await native.stopHeartRateStream();
      } catch {
        // ignore
      }
    },
  };
};
