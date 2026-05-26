/**
 * HealthKit local persistence.
 *
 * Mirrors the existing MOOD pattern (AsyncStorage-backed; same pattern used by
 * analytics, notifications, drafts, etc.). We never persist a snapshot to the
 * backend — biometric data stays on-device.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BiometricSnapshot } from '../modules/mood-healthkit/src';

const SNAPSHOT_KEY = '@mood_health_snapshot_v1';
const ONBOARDING_DONE_KEY = '@mood_health_onboarding_done_v1';
const DISCLAIMER_ACK_KEY = '@mood_medical_disclaimer_acknowledged_v1';

export async function loadSnapshot(): Promise<BiometricSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
    return raw ? (JSON.parse(raw) as BiometricSnapshot) : null;
  } catch {
    return null;
  }
}

export async function saveSnapshot(snapshot: BiometricSnapshot): Promise<void> {
  try {
    await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // fail silently — snapshots are best-effort
  }
}

export async function clearSnapshot(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SNAPSHOT_KEY);
  } catch {
    // ignore
  }
}

export async function isHealthOnboardingComplete(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_DONE_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setHealthOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_DONE_KEY, 'true');
  } catch {
    // ignore
  }
}

export async function isMedicalDisclaimerAcknowledged(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(DISCLAIMER_ACK_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setMedicalDisclaimerAcknowledged(): Promise<void> {
  try {
    await AsyncStorage.setItem(DISCLAIMER_ACK_KEY, 'true');
  } catch {
    // ignore
  }
}
