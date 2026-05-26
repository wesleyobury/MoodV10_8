/**
 * Persisted workout sessions — last N kept locally with HR samples + stats.
 *
 * Lives in the same AsyncStorage tier as healthStorage (snapshot/onboarding).
 * Keeping the most recent 20 sessions is plenty for the recap UX and bounds
 * the on-disk footprint to ~200KB worst case (a 60-min session at 5s cadence
 * is ~720 samples × ~50 bytes ≈ 36KB).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HeartRateSample, HeartRateStats } from './heartRateZones';

const KEY = '@mood_workout_sessions_v1';
const AGE_KEY = '@mood_user_age_v1';
const MAX_SESSIONS = 20;

export interface WorkoutSession {
  id: string;
  startedAt: string;
  endedAt: string;
  workoutType: string;
  heartRateSamples: HeartRateSample[];
  stats: HeartRateStats | null;
}

export async function loadSessions(): Promise<WorkoutSession[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WorkoutSession[]) : [];
  } catch {
    return [];
  }
}

export async function appendSession(session: WorkoutSession): Promise<void> {
  try {
    const existing = await loadSessions();
    const next = [session, ...existing].slice(0, MAX_SESSIONS);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // fail silently
  }
}

export async function loadUserAge(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(AGE_KEY);
    if (!raw) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export async function saveUserAge(age: number): Promise<void> {
  try {
    await AsyncStorage.setItem(AGE_KEY, String(Math.round(age)));
  } catch {
    // ignore
  }
}
