import AsyncStorage from '@react-native-async-storage/async-storage';

import { SUBSCRIPTION_LAST_SYNC_KEY, SUBSCRIPTION_SYNC_INTERVAL_MS } from './constants';

export async function shouldSyncSubscription(force = false): Promise<boolean> {
  if (force) return true;
  try {
    const raw = await AsyncStorage.getItem(SUBSCRIPTION_LAST_SYNC_KEY);
    if (!raw) return true;
    const lastSyncAt = Number(raw);
    if (!Number.isFinite(lastSyncAt)) return true;
    return Date.now() - lastSyncAt >= SUBSCRIPTION_SYNC_INTERVAL_MS;
  } catch {
    return true;
  }
}

export async function markSubscriptionSynced(): Promise<void> {
  try {
    await AsyncStorage.setItem(SUBSCRIPTION_LAST_SYNC_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}
