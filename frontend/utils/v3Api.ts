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
/** Soreness areas. The body map sends the precise ones (muscle ids the API accepts directly); legs / back / arms / lower_body
 *  are the older broad regions, still accepted and still read from earlier builds. */
export type V3SoreRegion =
  | 'chest' | 'shoulders' | 'biceps' | 'triceps' | 'core' | 'upper_back' | 'lower_back' | 'glutes' | 'quads' | 'hamstrings' | 'calves'
  | 'legs' | 'lower_body' | 'back' | 'arms';
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
  /** Today's goal override only (Build -> What do you want to hit?). Omitted = training_profile.goal (never written back). */
  goal?: 'build_strength' | 'lose_weight_conditioning' | 'build_muscle' | 'improve_athleticism' | 'feel_better_reduce_stress' | 'stay_consistent';
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
  /** What the app labels the exercise with (backend founder map: a burpee is "Full Body, Cardio", not "Quads"); primary_muscles drives logic. */
  display_muscles?: string[];
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
  /** Founder pass 3: scalable bodyweight strength rows (pull-ups, dips, push-ups ...). Presentation only; the effort target is in rir. */
  scaling?: { kind: 'bodyweight_adjustable' | 'bodyweight_leverage'; short: string; detail: string } | null;
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
  /** Exercise Details (Guided Session): common mistakes from the exercise library when it has them. Optional. */
  mistakes?: string[] | null;
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
  /** Athletic (sequencing / presentation pass): the session phase this block belongs to ("primer" | "power" | "strength" |
   *  "finish") and its label for this workout ("Primer", "Power", "Speed & Plyo", "Plyometrics", "Athletic Strength", ...). */
  phase?: string | null;
  phase_label?: string | null;
  performance_roles?: string[] | null;
  /** Rest contract (founder rest audit): when the timer starts, for how long, and whether it is full recovery. */
  rest?: V3RestContract | null;
}

/**
 * kind: between_sets (after every set; each row's prescription.rest_sec) | after_pair (after A1 + A2; seconds) |
 * after_round (after the last station; seconds) | interval (work_sec / recovery_sec) | emom | continuous | self_paced.
 * In grouped work rows carry no rest of their own, so nothing is described twice.
 */
export interface V3RestContract {
  kind: 'between_sets' | 'after_pair' | 'after_round' | 'interval' | 'emom' | 'continuous' | 'self_paced';
  seconds: number | null;
  transition_sec: number | null;
  work_sec?: number | null;
  recovery_sec?: number | null;
  full_recovery: boolean;
  reason?: 'power' | 'heavy' | null;
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
    /** Built for Today copy (Oct 2026): one finished 2-3 sentence explanation, written server-side from the verified story brief. */
    blurb?: string | null;
    blurb_meta?: { source: 'composer' | 'llm' | 'fallback'; frame: string | null; facts: string[] } | null;
    /** Hybrid streaming (Oct 2026): true while the server is still writing the message. `blurb` then holds the fallback copy and
     *  must not be shown yet; the Cart polls getV3Bft until it settles. */
    blurb_pending?: boolean;
    /** The writing job this envelope belongs to (a Different Workout starts a new one). */
    bft_job?: string | null;
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
export const EXPECTED_ENGINE_PHASE = '3.9-athletic-sequencing-pass';

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

/** One completed V3 workout, newest first (GET /api/v3/workouts/history). */
export interface V3HistoryItem {
  workout_id: string;
  completed_at: string;
  direction: V3Direction;
  archetype: { id: string; name: string };
  states: V3State[];
}

/** Completed V3 workouts, newest first. Empty on any failure (history only personalizes; it never blocks Home). */
export async function getV3History(token: string, limit = 10): Promise<V3HistoryItem[]> {
  const res = await apiFetch<any>(`/api/v3/workouts/history?limit=${limit}`, { method: 'GET', headers: { Authorization: `Bearer ${token}` }, timeoutMs: 8000 });
  return res.ok && res.data && Array.isArray(res.data.workouts) ? (res.data.workouts as V3HistoryItem[]) : [];
}

/** Built for Today progress while the server writes it. `text` only ever holds validated, complete sentences.
 *  writing: nothing yet · streaming: text is growing · done: text is final · fallback: show `blurb`. null on any failure. */
export interface V3BftProgress {
  job: string | null;
  status: 'writing' | 'streaming' | 'done' | 'fallback';
  text: string;
  blurb: string | null;
  pending: boolean;
}

/** 'stop' = the server refused (auth / not found): stop polling and show the fallback copy. null = transient, try again. */
export async function getV3Bft(token: string, workoutId: string): Promise<V3BftProgress | 'stop' | null> {
  const res = await apiFetch<any>(`/api/v3/workouts/${encodeURIComponent(workoutId)}/bft`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: 4000,
    retries: 0, // the poller is its own retry loop
  });
  if (res.ok && res.data && typeof res.data.status === 'string') return res.data as V3BftProgress;
  return [401, 403, 404].includes(res.status) ? 'stop' : null;
}

export function generateV3Workout(token: string, req: V3GenerateRequest): Promise<V3Result> {
  return call('/api/v3/workouts/generate', token, { method: 'POST', body: req, timeoutMs: GENERATE_TIMEOUT_MS });
}

/** A fresh, un-completed copy of a workout (Saved Workouts: do it again). Same plan, new workout id. */
export function repeatV3Workout(token: string, workoutId: string): Promise<V3Result> {
  return call(`/api/v3/workouts/${encodeURIComponent(workoutId)}/repeat`, token, { method: 'POST' });
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

/* ------------------------------------------------------------------ completion (Guided Session) */

export interface V3CompletionBody {
  performance: { item_id: string; exercise_id?: string; sets: { reps: number | null; load: number; unit: 'lb' | 'kg' }[] }[];
  duration_actual: number;
  started_at?: string;
  completed_steps?: number;
  total_steps?: number;
  local_date?: string;
  client_session_id?: string;
}

export interface V3CompletionResult {
  status: 'completed' | 'already_completed';
  workout_id: string;
  completed_at: string | null;
  logged_exercises: number;
  duration_actual: number | null;
  streak: { current: number; longest?: number } | null;
  /** Monetization extension point: access after this completion (the server decides nothing about paywalls here). */
  access: { has_full_access: boolean; consumed_free_workout: boolean; free_workouts_remaining: number | null; free_workouts_reset_at: string | null } | null;
}

/**
 * POST /api/v3/workouts/{id}/complete. Idempotent on the server: a repeat returns status 'already_completed' with the stored
 * result (never an error), so the client may retry freely. `retryable` = keep the intent and try again later.
 */
export async function completeV3Workout(
  token: string,
  workoutId: string,
  body: V3CompletionBody,
): Promise<{ ok: true; result: V3CompletionResult } | { ok: false; retryable: boolean; status: number; message: string }> {
  const res = await apiFetch<V3CompletionResult>(`/api/v3/workouts/${encodeURIComponent(workoutId)}/complete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    timeoutMs: 20000,
  });
  if (res.ok && res.data && (res.data as any).status) return { ok: true, result: res.data };
  if (res.isNetworkError) return { ok: false, retryable: true, status: 0, message: 'offline' };
  // 401 (token refresh), 408/429/5xx: try again later. 403/404/422: the request itself cannot succeed.
  const retryable = res.status === 401 || res.status === 408 || res.status === 429 || res.status >= 500 || !res.status;
  return { ok: false, retryable, status: res.status, message: typeof res.error === 'string' ? res.error : `HTTP ${res.status}` };
}

export interface V3AfterBody {
  fit_rating?: 'too_easy' | 'just_right' | 'too_much';
  mood_after?: string;
  calories?: number;
  avg_heart_rate?: number;
  max_heart_rate?: number;
  steps?: number;
  hrv_sdnn?: number;
  duration_actual?: number;
  metrics_source?: 'wearable' | 'edited';
}

/** POST /api/v3/workouts/{id}/after: feedback and real metrics on a completed workout. Idempotent $set; safe to retry. */
export async function afterV3Workout(token: string, workoutId: string, body: V3AfterBody): Promise<{ ok: true } | { ok: false; retryable: boolean; status: number }> {
  const res = await apiFetch<any>(`/api/v3/workouts/${encodeURIComponent(workoutId)}/after`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
    timeoutMs: 15000,
  });
  if (res.ok) return { ok: true };
  if (res.isNetworkError) return { ok: false, retryable: true, status: 0 };
  return { ok: false, retryable: res.status === 401 || res.status === 408 || res.status === 429 || res.status >= 500 || !res.status, status: res.status };
}

/* ------------------------------------------------------------------ helpers */

/** The user's LOCAL calendar date (YYYY-MM-DD). Seeds same-day determinism. */
export function localDateISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
