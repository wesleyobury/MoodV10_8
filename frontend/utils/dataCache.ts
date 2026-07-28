/**
 * dataCache — Phase 3 stale-while-revalidate helper.
 *
 * Screens render instantly from the last-known data while a fresh copy
 * loads in the background. On poor connections the user sees content
 * immediately instead of a spinner (or a freeze).
 *
 * Best-effort by design: cache read/write failures are silently ignored —
 * the network path continues to work exactly as before.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@mood_cache_v1:';

/** Max age before cached data is considered too stale to show (7 days). */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: T; cachedAt: number };
    if (!parsed || typeof parsed.cachedAt !== 'number') return null;
    if (Date.now() - parsed.cachedAt > MAX_AGE_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeCache(key: string, data: unknown): void {
  // Fire-and-forget — callers never wait on cache writes.
  AsyncStorage.setItem(
    PREFIX + key,
    JSON.stringify({ data, cachedAt: Date.now() })
  ).catch(() => {});
}

export async function clearCache(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFIX + key);
  } catch {}
}
