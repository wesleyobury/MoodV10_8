/**
 * MOOD V2 — running build-number helpers (Phase 1.2 forced-update).
 *
 * Reads the build number baked into the binary via expo-constants. iOS uses
 * `ios.buildNumber` (string), Android uses `android.versionCode` (number).
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function getRunningBuildNumber(): number {
  try {
    if (Platform.OS === 'ios') {
      const raw = Constants.expoConfig?.ios?.buildNumber ?? '0';
      const n = parseInt(String(raw), 10);
      return Number.isFinite(n) ? n : 0;
    }
    if (Platform.OS === 'android') {
      const code = Constants.expoConfig?.android?.versionCode ?? 0;
      return typeof code === 'number' ? code : parseInt(String(code), 10) || 0;
    }
  } catch {
    // fall through
  }
  return 0;
}

export function getAppVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}
