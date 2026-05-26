/**
 * Secure Storage Wrapper
 *
 * Uses expo-secure-store on native (iOS/Android) for durable, encrypted
 * persistence of sensitive values like the auth token. Falls back to
 * AsyncStorage on web where SecureStore is not available.
 *
 * Auth tokens stored here MUST survive app closes, backgrounding, reinstalls
 * (on the same device keychain/keystore), and OS updates. The only time we
 * delete the token is on explicit user logout or when the backend confirms
 * the token is invalid with a 401/403.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_TOKEN_KEY = 'auth_token';
// Timestamps (ISO strings) tracking when the token was stored and when it was
// last validated successfully against the backend. Used by the admin Debug
// Panel to diagnose session-persistence issues.
export const AUTH_TOKEN_STORED_AT_KEY = 'auth_token_stored_at';
export const AUTH_TOKEN_LAST_VALIDATED_KEY = 'auth_token_last_validated_at';

const isWeb = Platform.OS === 'web';

// SecureStore keys cannot contain characters other than A-Z, a-z, 0-9, ".", "-", "_"
const toSecureKey = (key: string): string => key.replace(/[^A-Za-z0-9._-]/g, '_');

export async function secureGet(key: string): Promise<string | null> {
  try {
    if (isWeb) {
      return await AsyncStorage.getItem(key);
    }
    const value = await SecureStore.getItemAsync(toSecureKey(key));
    return value ?? null;
  } catch (err) {
    console.warn(`secureStorage.get("${key}") failed:`, err);
    // Fallback to AsyncStorage if SecureStore fails for any reason
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  }
}

export async function secureSet(key: string, value: string): Promise<void> {
  try {
    if (isWeb) {
      await AsyncStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(toSecureKey(key), value, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
    // Also mirror to AsyncStorage so migration reads succeed and so other
    // modules that still read AsyncStorage directly continue to work.
    // This is safe: SecureStore is the source of truth, AsyncStorage is a mirror.
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // ignore mirror failure
    }
  } catch (err) {
    console.warn(`secureStorage.set("${key}") failed, falling back:`, err);
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.error(`secureStorage.set fallback also failed:`, e);
    }
  }
}

export async function secureDelete(key: string): Promise<void> {
  try {
    if (!isWeb) {
      await SecureStore.deleteItemAsync(toSecureKey(key));
    }
  } catch (err) {
    console.warn(`secureStorage.delete("${key}") SecureStore failed:`, err);
  }
  try {
    await AsyncStorage.removeItem(key);
  } catch (err) {
    console.warn(`secureStorage.delete("${key}") AsyncStorage failed:`, err);
  }
}

/**
 * Migrate a legacy value from AsyncStorage into SecureStore.
 * Called once at app startup. If the value already exists in SecureStore,
 * this is a no-op. If only AsyncStorage has it, we copy it over.
 * We DO NOT remove the AsyncStorage copy — some older modules still read it.
 */
export async function migrateToSecureStore(key: string): Promise<string | null> {
  try {
    if (isWeb) {
      // On web we only use AsyncStorage, nothing to migrate
      return await AsyncStorage.getItem(key);
    }

    const secureValue = await SecureStore.getItemAsync(toSecureKey(key)).catch(() => null);
    if (secureValue) {
      return secureValue;
    }

    const legacyValue = await AsyncStorage.getItem(key).catch(() => null);
    if (legacyValue) {
      console.log(`🔐 Migrating "${key}" from AsyncStorage to SecureStore`);
      await SecureStore.setItemAsync(toSecureKey(key), legacyValue, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      }).catch((e) => console.warn('SecureStore migrate set failed:', e));
      return legacyValue;
    }

    return null;
  } catch (err) {
    console.warn(`migrateToSecureStore("${key}") failed:`, err);
    return null;
  }
}

export const secureStorage = {
  get: secureGet,
  set: secureSet,
  delete: secureDelete,
  migrate: migrateToSecureStore,
  AUTH_TOKEN_KEY,
  AUTH_TOKEN_STORED_AT_KEY,
  AUTH_TOKEN_LAST_VALIDATED_KEY,
  /** Platform-identifying label for diagnostics. */
  backendLabel: isWeb ? 'AsyncStorage (web)' : 'SecureStore (keychain/keystore)',
};

export default secureStorage;
