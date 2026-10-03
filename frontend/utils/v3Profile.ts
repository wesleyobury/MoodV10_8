/**
 * MOOD V3 — Training Profile (client side).
 *
 * "Onboarding tells MOOD who you are as an athlete. Home tells MOOD how you are
 * today." This module owns the first half: the persistent training profile,
 * its labels, its server round-trip, the completion marker that keeps existing
 * users from being re-onboarded twice, and the one-time first-Home handoff that
 * Phase 2 (V3 Home / workout creation) consumes.
 *
 * Server: GET/PUT /api/users/me/training-profile (users.training_profile).
 * The server is the source of truth; AsyncStorage only caches the completion
 * marker and the first-Home handoff.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authFetch } from './api';

/* ------------------------------------------------------------------ flags */

/**
 * V3 onboarding + upgrade re-onboarding on/off. On this branch V3 is the
 * onboarding. Flip to false to fall back to the V2 funnel (step-1-mood …) in a
 * dev build; V2 workout flows are untouched either way.
 */
export const V3_ONBOARDING_ENABLED = true;

/**
 * V3 Home (Workouts tab): Today's Workout builder -> /api/v3 -> Overview.
 * false = the V2 Workouts home (mood cards) renders instead. Guests always get
 * V2, since /api/v3 needs an account.
 */
export const V3_HOME_ENABLED = true;

export * from './v3ProfileOptions';
import { DEFAULT_DURATION, DEFAULT_EQUIPMENT, defaultDirectionFor } from './v3ProfileOptions';
import type { Barrier, Direction, TrainingProfile, TrainingProfileResponse, V3FunnelMode } from './v3ProfileOptions';

/* ------------------------------------------------------------------ server */

export async function fetchTrainingProfile(token: string): Promise<TrainingProfileResponse | null> {
  const res = await authFetch<TrainingProfileResponse>('/api/users/me/training-profile', token);
  return res.ok ? res.data : null;
}

export async function saveTrainingProfile(
  token: string,
  profile: TrainingProfile,
): Promise<TrainingProfileResponse | null> {
  const body: Record<string, unknown> = {};
  (['training_preference', 'goal', 'experience', 'training_frequency', 'biggest_barrier', 'profile_source'] as const).forEach((k) => {
    if (profile[k] !== undefined) body[k] = profile[k];
  });
  const res = await authFetch<TrainingProfileResponse>('/api/users/me/training-profile', token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.ok ? res.data : null;
}

/* ------------------------------------------------------------------ completion marker */

const DONE_KEY = (uid: string) => `@mood_v3_profile_done_v1:${uid}`;

export async function markV3ProfileDone(userId: string): Promise<void> {
  try { await AsyncStorage.setItem(DONE_KEY(userId), new Date().toISOString()); } catch { /* ignore */ }
}
export async function isV3ProfileDoneLocally(userId: string): Promise<boolean> {
  try { return !!(await AsyncStorage.getItem(DONE_KEY(userId))); } catch { return false; }
}
export async function clearV3ProfileDone(userId: string): Promise<void> {
  try { await AsyncStorage.removeItem(DONE_KEY(userId)); } catch { /* ignore */ }
}

/* ------------------------------------------------------------------ first-session prefill */

export interface FirstSessionPrefill {
  /** States to show pre-selected (and removable) the first time only. */
  states: ('low_energy' | 'bored')[];
  /** Surface the 30-minute option prominently; the persistent default stays 60. */
  suggest_duration: 30 | null;
  /** Lead with MOOD's Pick / "just start" presentation. */
  emphasize_moods_pick: boolean;
  /** Stable key for Phase 2 copy. */
  copy_key: Barrier;
}

/** Barrier -> first V3 Home session only. Never persisted as a daily State. */
export function barrierPrefill(barrier?: Barrier): FirstSessionPrefill | null {
  switch (barrier) {
    case 'low_energy': return { states: ['low_energy'], suggest_duration: null, emphasize_moods_pick: false, copy_key: barrier };
    case 'boredom': return { states: ['bored'], suggest_duration: null, emphasize_moods_pick: false, copy_key: barrier };
    case 'time': return { states: [], suggest_duration: 30, emphasize_moods_pick: false, copy_key: barrier };
    case 'dont_know': return { states: [], suggest_duration: null, emphasize_moods_pick: true, copy_key: barrier };
    case 'motivation': return { states: [], suggest_duration: null, emphasize_moods_pick: true, copy_key: barrier };
    default: return null;
  }
}

/* ------------------------------------------------------------------ first-Home handoff (Phase 2 consumes) */

export interface FirstHomeHandoff {
  version: 1;
  pending: boolean;
  created_at: string;
  mode: V3FunnelMode;
  default_direction: Direction;
  default_duration: 60 | 30;
  default_equipment: 'commercial_gym' | 'free_weight_limited' | 'minimal';
  profile: TrainingProfile;
  prefill: FirstSessionPrefill | null;
  /** Set by the profile reveal CTA ("Build my first workout"): Home opens Build once, then clears it. */
  launch_build?: boolean;
}

const HANDOFF_KEY = (uid: string) => `@mood_v3_first_home_v1:${uid}`;

export async function writeFirstHomeHandoff(
  userId: string,
  profile: TrainingProfile,
  mode: V3FunnelMode,
  serverDefaultDirection?: Direction,
): Promise<void> {
  const h: FirstHomeHandoff = {
    version: 1,
    pending: true,
    created_at: new Date().toISOString(),
    mode,
    default_direction: serverDefaultDirection ?? defaultDirectionFor(profile),
    default_duration: (profile.default_duration ?? DEFAULT_DURATION) as 60 | 30,
    default_equipment: profile.default_equipment ?? DEFAULT_EQUIPMENT,
    profile,
    prefill: barrierPrefill(profile.biggest_barrier),
  };
  try { await AsyncStorage.setItem(HANDOFF_KEY(userId), JSON.stringify(h)); } catch { /* ignore */ }
}

/** Phase 2: read on V3 Home mount. `pending` true = this is the first V3 Home visit. */
export async function readFirstHomeHandoff(userId: string): Promise<FirstHomeHandoff | null> {
  try {
    const raw = await AsyncStorage.getItem(HANDOFF_KEY(userId));
    return raw ? (JSON.parse(raw) as FirstHomeHandoff) : null;
  } catch {
    return null;
  }
}

/**
 * Phase 2: call once the first V3 workout has been generated (or the user
 * dismisses the prefill). After this the prefill never applies again, so an
 * onboarding barrier never becomes a standing daily State.
 */
export async function consumeFirstHomeHandoff(userId: string): Promise<void> {
  try {
    const h = await readFirstHomeHandoff(userId);
    if (h) await AsyncStorage.setItem(HANDOFF_KEY(userId), JSON.stringify({ ...h, pending: false, prefill: null }));
  } catch { /* ignore */ }
}

/** Reveal CTA: Home (which sits under Build in the stack) opens Build on arrival, once. */
export async function requestFirstBuildLaunch(userId: string): Promise<void> {
  try {
    const h = await readFirstHomeHandoff(userId);
    if (h) await AsyncStorage.setItem(HANDOFF_KEY(userId), JSON.stringify({ ...h, launch_build: true }));
  } catch { /* ignore */ }
}

/** Home: consume the one-time Build launch. Returns true when Home should open Build now. */
export async function takeFirstBuildLaunch(userId: string): Promise<boolean> {
  try {
    const h = await readFirstHomeHandoff(userId);
    if (!h?.launch_build) return false;
    await AsyncStorage.setItem(HANDOFF_KEY(userId), JSON.stringify({ ...h, launch_build: false }));
    return true;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ first-workout activation window */

/**
 * From the profile reveal until the first V3 workout is finished (or 24 h pass), auxiliary prompts (wearables connect,
 * the founding-offer modal) wait, so nothing stands between onboarding and workout #1. Device-local by design: it only
 * orders prompts, it never decides access.
 */
const FIRST_WORKOUT_PENDING_KEY = (uid: string) => `@mood_v3_first_workout_pending_v1:${uid}`;
const FIRST_WORKOUT_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function markFirstWorkoutPending(userId: string): Promise<void> {
  try { await AsyncStorage.setItem(FIRST_WORKOUT_PENDING_KEY(userId), String(Date.now())); } catch { /* ignore */ }
}
export async function clearFirstWorkoutPending(userId: string): Promise<void> {
  try { await AsyncStorage.removeItem(FIRST_WORKOUT_PENDING_KEY(userId)); } catch { /* ignore */ }
}
export async function isFirstWorkoutPending(userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  try {
    const raw = await AsyncStorage.getItem(FIRST_WORKOUT_PENDING_KEY(userId));
    if (!raw) return false;
    const at = Number(raw);
    return Number.isFinite(at) && Date.now() - at < FIRST_WORKOUT_WINDOW_MS;
  } catch {
    return false;
  }
}
