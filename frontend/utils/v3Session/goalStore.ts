/**
 * The athlete's own ring goals (founder pass, Oct 2026), saved on this phone.
 *
 *   minutes   null = match the workout's chosen length (the default); a number = a fixed goal every session
 *   calories  null = automatic (scales with the minutes goal and the Direction); a number = a fixed goal every session
 *
 * Read through resolveRingGoals() so the card always has a goal to fill even before anything is saved.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RingGoalPrefs { minutes: number | null; calories: number | null }
const KEY = 'mood.v3.ringGoals.v1';
const EMPTY: RingGoalPrefs = { minutes: null, calories: null };

export const MINUTES_RANGE = { min: 10, max: 180, step: 5 };
export const CALORIES_RANGE = { min: 50, max: 2000, step: 25 };

const clean = (v: unknown, r: { min: number; max: number }) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(r.min, Math.min(r.max, Math.round(v))) : null);

export async function loadRingGoals(): Promise<RingGoalPrefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const j = JSON.parse(raw);
    return { minutes: clean(j?.minutes, MINUTES_RANGE), calories: clean(j?.calories, CALORIES_RANGE) };
  } catch {
    return EMPTY;
  }
}

export async function saveRingGoals(g: RingGoalPrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ minutes: clean(g.minutes, MINUTES_RANGE), calories: clean(g.calories, CALORIES_RANGE) }));
  } catch { /* best effort */ }
}

/** The goals the card fills toward: the athlete's own where set, otherwise the workout's defaults (auto calories follow
 *  the minutes goal, so raising minutes raises the automatic calories goal with it). */
export function resolveRingGoals(prefs: RingGoalPrefs, auto: { minutes: number; calories: number }): { minutes: number; calories: number } {
  const minutes = prefs.minutes ?? auto.minutes;
  const calories = prefs.calories ?? Math.max(CALORIES_RANGE.min, Math.round((auto.calories * (minutes / Math.max(1, auto.minutes))) / 10) * 10);
  return { minutes, calories };
}
