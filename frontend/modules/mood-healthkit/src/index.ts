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
}

const native = requireOptionalNativeModule<NativeModuleShape>('MoodHealthKit');

/** True if HealthKit is reachable from this build. False in Expo Go / non-iOS. */
export const isHealthKitAvailable = (): boolean => {
  if (Platform.OS !== 'ios') return false;
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
