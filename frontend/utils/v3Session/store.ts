/**
 * MOOD V3 Guided Session: durable storage for the one session record per user (AsyncStorage).
 *
 *   @mood_v3_session_v1:<uid>      SessionRecord (record.ts): envelope, engine state, logs, completion intent
 *   @mood_v3_weight_unit_v1:<uid>  'lb' | 'kg' (F2: remembered locally, lb by default)
 *
 * Written on every session transition (never on timer ticks). Writes are serialized per key so a slow write can never land
 * after a newer one. A stale active record (12 h idle) is turned into `abandoned` when it is read.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SessionMode, SessionRecord, WeightUnit, expireIfStale, parseRecord } from './record';

const SESSION_KEY = (uid: string) => `@mood_v3_session_v1:${uid}`;
const UNIT_KEY = (uid: string) => `@mood_v3_weight_unit_v1:${uid}`;
const MODE_KEY = (uid: string) => `@mood_v3_session_mode_v1:${uid}`;

const queues = new Map<string, Promise<unknown>>();
function serialized<T>(key: string, job: () => Promise<T>): Promise<T> {
  const prev = queues.get(key) ?? Promise.resolve();
  const next = prev.catch(() => undefined).then(job);
  queues.set(key, next);
  return next;
}

/** The stored record (stale active sessions come back as `abandoned`, with `expiredNow` so the caller can log it once). */
export async function readSession(uid: string, now = Date.now()): Promise<{ record: SessionRecord | null; expiredNow: boolean }> {
  return serialized(SESSION_KEY(uid), async () => {
    let raw: string | null = null;
    try {
      raw = await AsyncStorage.getItem(SESSION_KEY(uid));
    } catch {
      return { record: null, expiredNow: false };
    }
    const r = parseRecord(raw);
    if (!r) return { record: null, expiredNow: false };
    const e = expireIfStale(r, now);
    if (e !== r) {
      try { await AsyncStorage.setItem(SESSION_KEY(uid), JSON.stringify(e)); } catch { /* ignore */ }
      return { record: e, expiredNow: true };
    }
    return { record: r, expiredNow: false };
  });
}

export function writeSession(uid: string, record: SessionRecord): Promise<void> {
  return serialized(SESSION_KEY(uid), async () => {
    try { await AsyncStorage.setItem(SESSION_KEY(uid), JSON.stringify(record)); } catch { /* storage full / unavailable: the session keeps running in memory */ }
  });
}

/** Read-modify-write under the same queue (used by background completion retries). */
export function updateSession(uid: string, fn: (r: SessionRecord | null) => SessionRecord | null): Promise<SessionRecord | null> {
  return serialized(SESSION_KEY(uid), async () => {
    let cur: SessionRecord | null = null;
    try { cur = parseRecord(await AsyncStorage.getItem(SESSION_KEY(uid))); } catch { /* ignore */ }
    const next = fn(cur);
    if (next && next !== cur) {
      try { await AsyncStorage.setItem(SESSION_KEY(uid), JSON.stringify(next)); } catch { /* ignore */ }
    }
    return next;
  });
}

export async function readWeightUnit(uid: string): Promise<WeightUnit> {
  try {
    const v = await AsyncStorage.getItem(UNIT_KEY(uid));
    return v === 'kg' ? 'kg' : 'lb';
  } catch {
    return 'lb';
  }
}

export async function writeWeightUnit(uid: string, unit: WeightUnit): Promise<void> {
  try { await AsyncStorage.setItem(UNIT_KEY(uid), unit); } catch { /* ignore */ }
}

/** The athlete's most recent session mode (Guided by default); the next session starts in it. */
export async function readPreferredMode(uid: string): Promise<SessionMode> {
  try {
    return (await AsyncStorage.getItem(MODE_KEY(uid))) === 'overview' ? 'overview' : 'guided';
  } catch {
    return 'guided';
  }
}

export async function writePreferredMode(uid: string, mode: SessionMode): Promise<void> {
  try { await AsyncStorage.setItem(MODE_KEY(uid), mode); } catch { /* ignore */ }
}
