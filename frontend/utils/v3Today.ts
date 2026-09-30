/**
 * MOOD V3 — small per-user local memory for Home.
 *
 *  • last explicitly used Direction (Build preselection + Home hero imagery; never touches the Training Profile)
 *  • today's builds (H1): every workout generated today, keyed by request signature, so the same inputs reopen the
 *    same workout and a future Quick Start never overwrites the primary daily build. See utils/v3TodayModel.ts.
 *  • today's State chips (H1): the Home hero's "How are you showing up?" selection, kept for the day only.
 *
 * The server stays the source of truth for the workout itself.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { V3Direction, V3Envelope, V3SoreRegion, V3State } from './v3Api';
import {
  V3TodayDay,
  V3TodayEntry,
  emptyDay,
  findBySignature,
  findByWorkoutId,
  parseDay,
  primaryEntry,
  upsertEntry,
  withEnvelope,
} from './v3TodayModel';

export type { V3TodayEntry, V3TodayDay } from './v3TodayModel';

const LAST_DIR_KEY = (uid: string) => `@mood_v3_last_direction_v1:${uid}`;
/** v2 holds the whole day. The pre-H1 v1 key (`@mood_v3_today_v1`) is deliberately ignored (see v3TodayModel.parseDay). */
const TODAY_KEY = (uid: string) => `@mood_v3_today_v2:${uid}`;
const DAY_STATES_KEY = (uid: string) => `@mood_v3_day_states_v1:${uid}`;

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

/* ------------------------------------------------------------------ today's builds */

export async function readTodayDay(uid: string, date: string): Promise<V3TodayDay> {
  try {
    return parseDay(await AsyncStorage.getItem(TODAY_KEY(uid)), date);
  } catch {
    return emptyDay(date);
  }
}

async function writeDay(uid: string, day: V3TodayDay): Promise<void> {
  try { await AsyncStorage.setItem(TODAY_KEY(uid), JSON.stringify(day)); } catch { /* ignore */ }
}

/** The Home hero's workout for today (latest build from the Build screen), or null. */
export async function readToday(uid: string, date: string): Promise<V3TodayEntry | null> {
  return primaryEntry(await readTodayDay(uid, date));
}

/** Today's build for this exact request, if one exists (reopen instead of regenerating). */
export async function readTodayBySignature(uid: string, date: string, signature: string): Promise<V3TodayEntry | null> {
  return findBySignature(await readTodayDay(uid, date), signature);
}

export async function writeToday(uid: string, entry: V3TodayEntry): Promise<void> {
  const day = await readTodayDay(uid, entry.date);
  await writeDay(uid, upsertEntry(day, entry));
}

/** Keep the cached envelope current after a swap or refresh (same workout id only, never an older version). */
export async function updateTodayEnvelope(uid: string, envelope: V3Envelope): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(TODAY_KEY(uid));
    if (!raw) return;
    const day = JSON.parse(raw) as V3TodayDay;
    const next = withEnvelope(parseDay(raw, day.date), envelope);
    await writeDay(uid, next);
  } catch { /* ignore */ }
}

/** Cached envelope for a workout id, if it is one of today's builds. */
export async function readCachedEnvelope(uid: string, workoutId: string): Promise<V3Envelope | null> {
  try {
    const raw = await AsyncStorage.getItem(TODAY_KEY(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const day = parseDay(raw, parsed.date);
    return findByWorkoutId(day, workoutId)?.envelope ?? null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ today's State chips */

export interface V3DayStates {
  date: string;
  states: V3State[];
  soreness: V3SoreRegion[];
  /** true once the user (or the first-visit prefill) set them; distinguishes "none today" from "not chosen yet". */
  set: boolean;
}

export async function readDayStates(uid: string, date: string): Promise<V3DayStates> {
  try {
    const raw = await AsyncStorage.getItem(DAY_STATES_KEY(uid));
    const v = raw ? (JSON.parse(raw) as V3DayStates) : null;
    if (v && v.date === date && Array.isArray(v.states)) {
      return { date, states: v.states, soreness: Array.isArray(v.soreness) ? v.soreness : [], set: !!v.set };
    }
  } catch { /* ignore */ }
  return { date, states: [], soreness: [], set: false };
}

export async function writeDayStates(uid: string, v: V3DayStates): Promise<void> {
  try { await AsyncStorage.setItem(DAY_STATES_KEY(uid), JSON.stringify({ ...v, set: true })); } catch { /* ignore */ }
}
