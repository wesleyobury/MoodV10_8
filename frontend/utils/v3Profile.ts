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

/* ------------------------------------------------------------------ values */

export type TrainingPreference = 'lifting' | 'conditioning' | 'athletic' | 'mix';
export type V3Goal =
  | 'build_strength'
  | 'lose_weight_conditioning'
  | 'build_muscle'
  | 'improve_athleticism'
  | 'feel_better_reduce_stress'
  | 'stay_consistent';
export type Experience = 'beginner' | 'intermediate' | 'advanced';
export type TrainingFrequency = '1-2' | '3-4' | '5+';
export type Barrier = 'time' | 'low_energy' | 'motivation' | 'dont_know' | 'boredom';
export type Direction = 'strength' | 'sweat' | 'athletic';
export type ProfileSource = 'onboarding_v3' | 'reonboarding_v3' | 'user_edit';
/** new = signup funnel; upgrade = existing user's first V3 open; edit = Settings. */
export type V3FunnelMode = 'new' | 'upgrade' | 'edit';

export interface TrainingProfile {
  training_preference?: TrainingPreference;
  goal?: V3Goal;
  experience?: Experience;
  training_frequency?: TrainingFrequency;
  biggest_barrier?: Barrier;
  default_duration?: 30 | 60;
  default_equipment?: 'commercial_gym' | 'free_weight_limited' | 'minimal';
  profile_source?: ProfileSource;
  completed_at?: string;
  updated_at?: string;
}

export interface TrainingProfileResponse {
  profile: TrainingProfile;
  complete: boolean;
  default_direction: Direction;
  version: number;
}

export const DEFAULT_DURATION = 60 as const;
export const DEFAULT_EQUIPMENT = 'commercial_gym' as const;

/* ------------------------------------------------------------------ labels */
// Same labels on the funnel and (Phase 2) the Home screen.

export const PREFERENCE_OPTIONS: { id: TrainingPreference; label: string; description: string }[] = [
  { id: 'lifting', label: 'Strength Training', description: 'Lifting. Sets, reps, getting stronger.' },
  { id: 'conditioning', label: 'Conditioning / Sweat', description: 'Circuits, intervals, engine work.' },
  { id: 'athletic', label: 'Athletic Training', description: 'Jumps, sprints, throws. Power and speed.' },
  { id: 'mix', label: 'Mix of Everything', description: 'A little of all three.' },
];
export const GOAL_OPTIONS: { id: V3Goal; label: string }[] = [
  { id: 'build_strength', label: 'Build Strength' },
  { id: 'lose_weight_conditioning', label: 'Sweat / Burn Fat' },
  { id: 'build_muscle', label: 'Improve Physique' },
  { id: 'improve_athleticism', label: 'Improve Athleticism' },
  { id: 'feel_better_reduce_stress', label: 'Feel Better / Reduce Stress' },
  { id: 'stay_consistent', label: 'Stay Consistent' },
];
export const EXPERIENCE_OPTIONS: { id: Experience; label: string; description: string }[] = [
  { id: 'beginner', label: 'Beginner', description: 'Still learning the fundamentals.' },
  { id: 'intermediate', label: 'Intermediate', description: 'Comfortable with most gym movements.' },
  { id: 'advanced', label: 'Advanced', description: 'Years of serious, structured training.' },
];
export const FREQUENCY_OPTIONS: { id: TrainingFrequency; label: string; description: string }[] = [
  { id: '1-2', label: '1–2 days a week', description: 'Getting it in when I can.' },
  { id: '3-4', label: '3–4 days a week', description: 'A steady routine.' },
  { id: '5+', label: '5+ days a week', description: 'Training is part of my week.' },
];
export const BARRIER_OPTIONS: { id: Barrier; label: string; description: string }[] = [
  { id: 'time', label: 'Time', description: "I'm always short on it." },
  { id: 'low_energy', label: 'Low energy', description: "I'm wiped by the time I get to it." },
  { id: 'motivation', label: 'Motivation', description: 'I struggle to get started.' },
  { id: 'dont_know', label: "Don't know what to do", description: 'I freeze on the plan.' },
  { id: 'boredom', label: 'Boredom', description: 'Same workouts, every time.' },
];

const labelOf = <T extends string>(opts: { id: T; label: string }[], id?: T) => opts.find((o) => o.id === id)?.label ?? '';
export const preferenceLabel = (v?: TrainingPreference) => labelOf(PREFERENCE_OPTIONS, v);
export const goalLabel = (v?: V3Goal) => labelOf(GOAL_OPTIONS, v);
export const experienceLabel = (v?: Experience) => labelOf(EXPERIENCE_OPTIONS, v);
export const frequencyLabel = (v?: TrainingFrequency) => (v ? `${v.replace('-', '–')} days / week` : '');
export const barrierLabel = (v?: Barrier) =>
  ({ time: 'Time', low_energy: 'Low energy', motivation: 'Motivation', dont_know: 'Knowing what to do', boredom: 'Boredom' } as const)[v as Barrier] ?? '';
export const DIRECTION_LABEL: Record<Direction, string> = { strength: 'Strength', sweat: 'Sweat', athletic: 'Athletic' };

/**
 * Default Direction for the Home card. Mirrors the backend rule
 * (mood_v3.normalize.resolve_direction): training preference, then goal, then
 * Strength. The server also returns `default_direction`; prefer that when you
 * have it — this local copy is for rendering before the round-trip lands.
 */
export function defaultDirectionFor(p: TrainingProfile): Direction {
  if (p.training_preference === 'lifting') return 'strength';
  if (p.training_preference === 'conditioning') return 'sweat';
  if (p.training_preference === 'athletic') return 'athletic';
  if (p.goal === 'lose_weight_conditioning') return 'sweat';
  if (p.goal === 'improve_athleticism') return 'athletic';
  return 'strength';
}

export function isProfileComplete(p?: TrainingProfile | null): boolean {
  return !!p && !!p.training_preference && !!p.goal && !!p.experience && !!p.training_frequency && !!p.biggest_barrier;
}

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
