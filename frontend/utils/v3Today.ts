/**
 * MOOD V3 — small per-user local memory for Home.
 *
 *  • last explicitly used Direction (Home preselection; never touches the
 *    Training Profile's training_preference)
 *  • today's generated workout (id + request signature + last envelope) so
 *    leaving Home and coming back reopens it instead of regenerating, and the
 *    Overview can render instantly before GET /api/v3/workouts/{id} refreshes.
 *
 * The server stays the source of truth for the workout itself.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { V3Direction, V3Envelope, V3GenerateRequest } from './v3Api';

const LAST_DIR_KEY = (uid: string) => `@mood_v3_last_direction_v1:${uid}`;
const TODAY_KEY = (uid: string) => `@mood_v3_today_v1:${uid}`;

export interface V3TodayEntry {
  date: string;
  workout_id: string;
  signature: string;
  request: V3GenerateRequest;
  envelope: V3Envelope;
  saved_at: string;
}

export async function readLastDirection(uid: string): Promise<V3Direction | null> {
  try {
    const v = await AsyncStorage.getItem(LAST_DIR_KEY(uid));
    return v === 'strength' || v === 'sweat' || v === 'athletic' ? v : null;
  } catch {
    return null;
  }
}

export async function writeLastDirection(uid: string, d: V3Direction): Promise<void> {
  try { await AsyncStorage.setItem(LAST_DIR_KEY(uid), d); } catch { /* ignore */ }
}

export async function readToday(uid: string, date: string): Promise<V3TodayEntry | null> {
  try {
    const raw = await AsyncStorage.getItem(TODAY_KEY(uid));
    if (!raw) return null;
    const e = JSON.parse(raw) as V3TodayEntry;
    return e.date === date && e.workout_id ? e : null;
  } catch {
    return null;
  }
}

export async function writeToday(uid: string, entry: V3TodayEntry): Promise<void> {
  try { await AsyncStorage.setItem(TODAY_KEY(uid), JSON.stringify(entry)); } catch { /* ignore */ }
}

/** Keep the cached envelope current after a swap or refresh (same workout id only). */
export async function updateTodayEnvelope(uid: string, envelope: V3Envelope): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(TODAY_KEY(uid));
    if (!raw) return;
    const e = JSON.parse(raw) as V3TodayEntry;
    if (envelope.workout?.workout_id && envelope.workout.workout_id === e.workout_id) {
      await AsyncStorage.setItem(TODAY_KEY(uid), JSON.stringify({ ...e, envelope, saved_at: new Date().toISOString() }));
    }
  } catch { /* ignore */ }
}

/** Cached envelope for a workout id, if it is today's. */
export async function readCachedEnvelope(uid: string, workoutId: string): Promise<V3Envelope | null> {
  try {
    const raw = await AsyncStorage.getItem(TODAY_KEY(uid));
    if (!raw) return null;
    const e = JSON.parse(raw) as V3TodayEntry;
    return e.workout_id === workoutId ? e.envelope : null;
  } catch {
    return null;
  }
}
