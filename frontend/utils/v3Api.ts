/**
 * MOOD V3 — /api/v3 client.
 *
 * The only place the app talks to the V3 generator. Types mirror
 * backend/mood_v3/CONTRACT.md (schema v3.0). Nothing here decides anything
 * about a workout: the server builds, explains, swaps and resolves conflicts;
 * the client sends inputs and renders the envelope it gets back.
 */
import { apiFetch, ApiResponse } from './api';

declare const __DEV__: boolean;

/* ------------------------------------------------------------------ inputs */

export type V3Direction = 'strength' | 'sweat' | 'athletic';
export type V3State = 'low_energy' | 'bored' | 'irritated' | 'sore' | 'amped' | 'stressed';
export type V3SoreRegion = 'legs' | 'chest' | 'back' | 'upper_back' | 'lower_back' | 'shoulders' | 'arms' | 'core';
export type V3Equipment = 'commercial_gym' | 'free_weight_limited' | 'minimal';
/** Session Difficulty (user-facing) = the V3 `experience` input. */
export type V3Experience = 'beginner' | 'intermediate' | 'advanced';

/** Exactly what POST /api/v3/workouts/generate receives. Profile fields
 *  (goal, experience, frequency, equipment) are omitted on purpose: the server
 *  fills them from users.training_profile (Phase 1 fallback). */
export interface V3GenerateRequest {
  direction: V3Direction;
  states: V3State[];
  soreness: V3SoreRegion[];
  target?: string[] | 'full_body';
  archetype?: string;
  duration: 30 | 60;
  equipment?: V3Equipment;
  /** Today's Difficulty override only. Omitted = the server uses training_profile.experience (never written back). */
  experience?: V3Experience;
  date: string;
  persist: boolean;
}

/* ------------------------------------------------------------------ envelope */

export interface V3Media {
  video_url?: string | null;
  thumbnail_url?: string | null;
  library_id?: string | null;
}

export interface V3Exercise {
  id: string;
  name: string;
  equipment?: string;
  equipment_label?: string;
  primary_muscles?: string[];
  media: V3Media | null;
}

export interface V3Prescription {
  kind: 'reps' | 'time' | 'distance' | 'calories';
  sets: number | null;
  reps: number | string | null;
  reps_scheme?: unknown;
  per_side: boolean;
  seconds: number | null;
  distance_m: number | null;
  calories: number | null;
  rest_sec: number | null;
  rir: number | null;
  rpe: number | [number, number] | null;
  load_guidance: string | null;
  display: string;
  direction_fields?: Record<string, any> | null;
}

export interface V3Progression {
  reference?: Record<string, any>;
  suggestion?: Record<string, any>;
  text?: string | null;
}

export interface V3Item {
  item_id: string;
  slot_id?: string;
  role?: string | null;
  exercise: V3Exercise;
  prescription: V3Prescription;
  cues: string[];
  quality_stop: string | null;
  swap: { swappable: boolean } | null;
  progression: V3Progression | null;
}

export interface V3Interval {
  work_sec?: number;
  recovery_sec?: number;
  rounds?: number;
  rest_between_rounds_sec?: number;
  alternate?: boolean;
  steps_sec?: number[];
  minutes?: number;
}

export interface V3Block {
  block_id: string;
  sequence: number;
  type: string;
  structure: string;
  title: string;
  rounds: number | null;
  rest_between_items_sec: number | null;
  rest_between_rounds_sec: number | null;
  interval: V3Interval | null;
  effort: { rpe?: [number, number] } | null;
  instructions: string | null;
  est_minutes: number | null;
  items: V3Item[];
}

export interface V3WarmupItem {
  component?: string;
  component_label?: string;
  exercise?: V3Exercise | null;
  name: string;
  prescription_text?: string | null;
}

export interface V3BuiltLine {
  code: string;
  text: string;
  /** Phase 2.6: adaptation (an input changed the output) | decision (a choice MOOD made) | context (true, explanatory). */
  kind?: 'adaptation' | 'decision' | 'context';
}

export interface V3Workout {
  workout_id: string | null;
  version: number;
  created_at?: string;
  direction: V3Direction;
  direction_name: string;
  archetype: { id: string; name: string };
  requested_archetype: { id: string; name: string } | null;
  target: { mode: 'moods_pick' | 'explicit' | 'full_body' | 'archetype'; muscles: string[]; label: string };
  duration: { requested_minutes: number; estimated_minutes: number; display: string };
  experience: string;
  states: V3State[];
  soreness: { regions: string[]; muscles: string[]; trained_anyway: string[] };
  equipment: { preset: V3Equipment; label: string };
  swap_count: number;
  built_for_today: V3BuiltLine[];
  warmup: { minutes: number; items: V3WarmupItem[]; guidance: string | null } | null;
  blocks: V3Block[];
  cooldown: { minutes: number; guidance: string | null } | null;
  relaxations: unknown[];
  adjustments: unknown[];
  swapped_item?: { item_id: string; from: string; to: string };
  /** Phase 2.5: who chose the session type. Different Workout may change the archetype only for 'moods_pick'. */
  selection_source?: 'moods_pick' | 'user_selected' | 'target' | null;
  /** Phase 2.5 Built for Today header: what the user told MOOD and what MOOD chose. */
  today?: {
    told: string[];
    chose: string;
    chosen_by: string;
    /** Phase 2.6: the one adaptation worth showing on the Preview; null when there is nothing meaningful to say. */
    teaser?: { code: string; title: string; text: string } | null;
  } | null;
}

export interface V3ConflictOption {
  action: string;
  label: string;
  /** Fields to re-send to /generate. null = open the relevant picker. */
  patch: Record<string, any> | null;
}

export interface V3Conflict {
  code: 'sore_target_conflict' | 'equipment_insufficient' | 'cannot_build' | 'no_alternative' | 'generation_failed' | string;
  message: string;
  options: V3ConflictOption[];
  adjustments?: unknown[];
}

export type V3Outcome = 'valid' | 'valid_with_relaxation' | 'rerouted' | 'conflict';

/** Engine identity of the process that built an envelope (Phase 2.6). */
export interface V3Engine {
  phase: string;
  build: string;
}

/** The engine phase this app build expects. A backend reporting anything else is running other code. */
export const EXPECTED_ENGINE_PHASE = '2.6';

export interface V3Envelope {
  schema_version: string;
  engine?: V3Engine;
  status: 'ok' | 'conflict';
  outcome: V3Outcome;
  conflict: V3Conflict | null;
  workout: V3Workout | null;
  profile_defaults_applied?: Record<string, unknown>;
}

/* ------------------------------------------------------------------ results */

export type V3ErrorKind = 'network' | 'invalid' | 'not_found' | 'completed' | 'outdated' | 'server';

export interface V3Error {
  kind: V3ErrorKind;
  message: string;
  field?: string;
  status: number;
}

export type V3Result = { ok: true; envelope: V3Envelope } | { ok: false; error: V3Error };

const GENERATE_TIMEOUT_MS = 30000; // cold imports on a fresh server can take a few seconds

function toError(res: ApiResponse<any>): V3Error {
  if (res.isNetworkError) {
    return { kind: 'network', status: 0, message: "Couldn't reach MOOD. Check your connection and try again." };
  }
  const raw: any = res.error;
  const detail = typeof raw === 'object' && raw !== null ? raw : null;
  if (res.status === 422) {
    // Our own validation errors are {field, message}; pydantic's are a list.
    const field = detail && !Array.isArray(detail) ? detail.field : undefined;
    const message = detail && !Array.isArray(detail) ? detail.message : undefined;
    return { kind: 'invalid', status: 422, field, message: message || "That combination isn't supported. Adjust your choices and try again." };
  }
  if (res.status === 404) return { kind: 'not_found', status: 404, message: "This workout isn't available anymore." };
  if (res.status === 409) {
    if (detail?.code === 'workout_outdated') {
      return { kind: 'outdated', status: 409, message: detail.message || 'This workout was built by an earlier version. Build a new one.' };
    }
    return { kind: 'completed', status: 409, message: 'This workout is already complete.' };
  }
  return { kind: 'server', status: res.status, message: 'Something went wrong building your workout. Try again.' };
}

async function call(path: string, token: string, init: { method?: string; body?: unknown; timeoutMs?: number } = {}): Promise<V3Result> {
  const res = await apiFetch<V3Envelope>(path, {
    method: init.method ?? 'GET',
    headers: { Authorization: `Bearer ${token}` },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    timeoutMs: init.timeoutMs,
  });
  if (res.ok && res.data && (res.data as V3Envelope).schema_version) {
    devTrace(path, init.body, res.data);
    return { ok: true, envelope: res.data };
  }
  if (res.ok) return { ok: false, error: { kind: 'server', status: res.status, message: 'Unexpected response from MOOD. Try again.' } };
  return { ok: false, error: toError(res) };
}

/** Dev builds only: one compact line per V3 call, so request/response mismatches are visible in the Metro log. */
function devTrace(path: string, body: unknown, env: V3Envelope) {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  const b = (body ?? {}) as Partial<V3GenerateRequest>;
  const w = env.workout;
  const ask = body ? ` ask=${b.direction ?? ''} target=${JSON.stringify(b.target ?? null)} type=${b.archetype ?? '-'} states=${(b.states ?? []).join(',')} dur=${b.duration ?? ''}` : '';
  const got = w
    ? `${w.archetype.id} src=${w.selection_source ?? 'MISSING'} swap=${w.swap_count} n=${w.blocks.reduce((n, x) => n + x.items.length, 0)}`
    : `conflict ${env.conflict?.code}`;
  // eslint-disable-next-line no-console
  console.log(`[v3] ${path.replace('/api/v3/workouts', '')}${ask} -> ${got} engine=${env.engine ? `${env.engine.phase}/${env.engine.build}` : 'MISSING (old backend process)'}`);
}

/* ------------------------------------------------------------------ endpoints */

/** GET /api/v3/version: engine identity of the running backend process (used by dev builds to catch stale code). */
export async function getV3Version(token: string | null): Promise<{ engine_phase: string; engine_build: string; started_at: string } | null> {
  const res = await apiFetch<any>('/api/v3/version', { method: 'GET', headers: token ? { Authorization: `Bearer ${token}` } : {}, timeoutMs: 6000 });
  return res.ok && res.data && res.data.engine_phase ? res.data : null;
}

export function generateV3Workout(token: string, req: V3GenerateRequest): Promise<V3Result> {
  return call('/api/v3/workouts/generate', token, { method: 'POST', body: req, timeoutMs: GENERATE_TIMEOUT_MS });
}

export function getV3Workout(token: string, workoutId: string): Promise<V3Result> {
  return call(`/api/v3/workouts/${encodeURIComponent(workoutId)}`, token);
}

export function swapV3Exercise(
  token: string,
  workoutId: string,
  itemId: string,
  reason?: 'dont_have' | 'dont_like' | 'too_hard' | 'other',
): Promise<V3Result> {
  return call(`/api/v3/workouts/${encodeURIComponent(workoutId)}/swap-exercise`, token, {
    method: 'POST',
    body: reason ? { item_id: itemId, reason } : { item_id: itemId },
    timeoutMs: GENERATE_TIMEOUT_MS,
  });
}

export function swapV3Workout(token: string, workoutId: string): Promise<V3Result> {
  return call(`/api/v3/workouts/${encodeURIComponent(workoutId)}/swap-workout`, token, {
    method: 'POST',
    timeoutMs: GENERATE_TIMEOUT_MS,
  });
}

/* ------------------------------------------------------------------ helpers */

/** The user's LOCAL calendar date (YYYY-MM-DD). Seeds same-day determinism. */
export function localDateISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
