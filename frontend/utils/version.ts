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
    // Prefer the NATIVE binary build number (CFBundleVersion on iOS,
    // versionCode on Android). This is what a forced-update gate must key on:
    // only an App Store / Play Store update can change the binary, whereas an
    // OTA update ships a JS bundle whose embedded app.json build number can
    // lag the installed binary. Reading expoConfig here would let an OTA make
    // the app under-report its build and lock itself out of the app.
    const native = Constants.nativeBuildVersion;
    if (native != null && String(native).trim() !== '') {
      const n = parseInt(String(native), 10);
      if (Number.isFinite(n)) return n;
    }

    // Fallback: JS/expoConfig value (e.g. Expo Go / dev client where the
    // native build version is null).
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
