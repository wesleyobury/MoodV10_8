/**
 * MOOD V3 Guided Session: the persisted session record and everything derived from it (pure; storage lives in store.ts).
 *
 * One record per user (`@mood_v3_session_v1:<uid>`), one active session at a time. The record carries the exact envelope
 * being executed so a session resumes offline, plus the engine state (cursor, timestamps, step statuses), optional weight
 * logs and the completion intent / retry state.
 */
import type { V3Direction, V3Envelope, V3Item } from '../v3Api';
import { COMPILER_VERSION, compile } from './compile';
import { SessionState, currentStep, initialState, nextUserMoment, resolve, tally } from './engine';
import type { SessionPlan, SessionStep } from './types';

export const SESSION_SCHEMA = 1;
/** An active session untouched for this long is abandoned (not completed, nothing recorded server-side). */
export const STALE_MS = 12 * 60 * 60 * 1000;

export type SessionStatus = 'active' | 'completing' | 'completed' | 'ended_early' | 'abandoned';
export type WeightUnit = 'lb' | 'kg';
/** Two views over one session: Guided (MOOD coaches every step) and Overview (the plan in front of you, train independently). */
export type SessionMode = 'guided' | 'overview';
export type FitRating = 'too_easy' | 'just_right' | 'too_much';

/** Post-workout additions (feedback, real metrics), sent after completion with the same retry discipline; idempotent $set. */
export interface AfterIntent {
  fit_rating: FitRating | null;
  calories: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  steps: number | null;
  hrv_sdnn: number | null;
  duration_actual: number | null;
  /** where the numbers came from: 'wearable' (HealthKit / Health Connect), 'edited' (the athlete typed), null */
  source: 'wearable' | 'edited' | null;
  dirty: boolean;
  attempts: number;
  nextAttemptAt: number;
  syncedAt: number | null;
}

export interface SetLog {
  set: number;
  load: number;
  unit: WeightUnit;
  reps: number | null;
}

export interface CompletionIntent {
  requestedAt: number;
  localDate: string;
  payload: CompletionPayload;
  attempts: number;
  lastAttemptAt: number | null;
  nextAttemptAt: number;
  lastError: string | null;
  /** set once the server acknowledged (first completion or already completed) */
  serverCompletedAt: string | null;
  alreadyCompleted: boolean;
  streak: { current: number; longest?: number } | null;
  /** Monetization extension point: what the server says about access after this completion (see V3 completion docs). */
  access: { entitled: boolean; free_used_this_week: boolean; free_remaining: number | null } | null;
  /** 4xx the client cannot fix (e.g. not found); kept for support, no more retries. */
  terminal: boolean;
}

export interface CompletionPayload {
  performance: { item_id: string; exercise_id: string; sets: { reps: number | null; load: number; unit: WeightUnit }[] }[];
  duration_actual: number;
  started_at: string;
  completed_steps: number;
  total_steps: number;
  local_date: string;
  client_session_id: string;
}

export interface SessionRecord {
  schema: number;
  sessionId: string;
  compilerVersion: number;
  fingerprint: string;
  workoutId: string;
  workoutVersion: number;
  direction: V3Direction;
  title: string;
  envelope: V3Envelope;
  status: SessionStatus;
  startedAt: number;
  lastActiveAt: number;
  localDateStarted: string;
  cursorStepId: string;
  sectionId: string;
  state: SessionState;
  logs: Record<string, SetLog[]>;
  completion: CompletionIntent | null;
  /** The mode the athlete was last in for this session (restored on relaunch). */
  mode: SessionMode;
  /** Structure explanations already shown this session (one per structure). */
  coachSeen: string[];
  after: AfterIntent | null;
  endedAt: number | null;
  endReason: 'ended_early' | 'expired' | 'replaced' | null;
}

export function newSessionId(now: number, rand: () => number = Math.random): string {
  return `s_${now.toString(36)}_${Math.floor(rand() * 1e9).toString(36)}`;
}

export function newRecord(envelope: V3Envelope, now: number, localDate: string, sessionId: string, mode: SessionMode = 'guided'): { record: SessionRecord; plan: SessionPlan; state: SessionState } {
  const w = envelope.workout!;
  const plan = compile(w);
  const state = initialState(plan, now);
  const st = currentStep(plan, state);
  const record: SessionRecord = {
    schema: SESSION_SCHEMA,
    sessionId,
    compilerVersion: COMPILER_VERSION,
    fingerprint: plan.fingerprint,
    workoutId: w.workout_id ?? '',
    workoutVersion: w.version,
    direction: w.direction,
    title: w.archetype?.name ?? w.direction_name,
    envelope,
    status: 'active',
    startedAt: now,
    lastActiveAt: now,
    localDateStarted: localDate,
    cursorStepId: st.id,
    sectionId: plan.sections[st.section]?.id ?? '',
    state,
    logs: {},
    completion: null,
    mode,
    coachSeen: [],
    after: null,
    endedAt: null,
    endReason: null,
  };
  return { record, plan, state };
}

/** Save the engine state into the record (called on every transition, never on ticks). */
export function withState(record: SessionRecord, plan: SessionPlan, state: SessionState, now: number): SessionRecord {
  const st = currentStep(plan, state);
  return { ...record, state, cursorStepId: st.id, sectionId: plan.sections[st.section]?.id ?? '', lastActiveAt: now };
}

/**
 * Recompile the stored envelope and rebuild the state. Same fingerprint → exact restore (then resolve() catches up timers).
 * Different fingerprint (an app update changed the compiler) → the same step id if it still exists, otherwise the start of the
 * same block; statuses are kept for ids that still exist. Never throws on a bad cursor.
 */
export function restore(record: SessionRecord, now: number): { plan: SessionPlan; state: SessionState; exact: boolean } {
  const plan = compile(record.envelope.workout!);
  if (plan.fingerprint === record.fingerprint && record.state && record.state.cursor < plan.steps.length) {
    return { plan, state: resolve(plan, record.state, now), exact: true };
  }
  const ids = new Set(plan.steps.map((s) => s.id));
  const status: SessionState['status'] = {};
  for (const [k, v] of Object.entries(record.state?.status ?? {})) if (ids.has(k)) status[k] = v;
  let cursor = plan.steps.findIndex((s) => s.id === record.cursorStepId);
  if (cursor < 0) {
    const sec = plan.sections.find((s) => s.id === record.sectionId);
    cursor = sec ? sec.firstStep : 0;
    for (let j = cursor; j < plan.steps.length; j++) delete status[plan.steps[j].id];
  }
  const base = record.state ?? initialState(plan, now);
  const state: SessionState = {
    ...base,
    cursor,
    status,
    stepStartedAt: null,
    stepPausedMs: 0,
    extraSec: 0,
    enteredAt: now,
    pausedAt: base.pausedAt ?? null,
  };
  return { plan, state: resolve(plan, state, now), exact: false };
}

export function isStale(record: SessionRecord, now: number): boolean {
  return record.status === 'active' && now - record.lastActiveAt > STALE_MS;
}

export function expireIfStale(record: SessionRecord, now: number): SessionRecord {
  return isStale(record, now) ? { ...record, status: 'abandoned', endedAt: now, endReason: 'expired' } : record;
}

export function endEarly(record: SessionRecord, now: number, reason: 'ended_early' | 'replaced' = 'ended_early'): SessionRecord {
  return { ...record, status: 'ended_early', endedAt: now, endReason: reason };
}

/** Parse a stored record; tolerant of records written before later fields existed. */
export function parseRecord(raw: string | null): SessionRecord | null {
  if (!raw) return null;
  try {
    const r = JSON.parse(raw) as SessionRecord;
    if (!r || r.schema !== SESSION_SCHEMA || !r.envelope?.workout || !r.state || !r.workoutId) return null;
    // fields added after the first records were written
    return { ...r, mode: r.mode === 'overview' ? 'overview' : 'guided', coachSeen: Array.isArray(r.coachSeen) ? r.coachSeen : [], after: r.after ?? null, logs: r.logs ?? {} };
  } catch {
    return null;
  }
}


/* ------------------------------------------------------------------ Home */

export type HomeSession =
  | { mode: 'continue'; workoutId: string; title: string; direction: V3Direction; label: string; elapsedMin: number }
  | { mode: 'done'; workoutId: string; title: string; direction: V3Direction; minutes: number; syncing: boolean }
  | null;

/** Home precedence: Continue (an active, non-stale session) > Done (completed or awaiting sync today) > nothing. */
export function homeSession(record: SessionRecord | null, todayLocal: string, now: number): HomeSession {
  if (!record) return null;
  if (record.status === 'active' && !isStale(record, now)) {
    let label = '';
    try {
      const plan = compile(record.envelope.workout!);
      const st = currentStep(plan, record.state);
      label = plan.sections[st.section]?.label ?? '';
    } catch { /* label is cosmetic */ }
    const elapsed = Math.max(0, (record.state.pausedAt ?? record.lastActiveAt) - record.state.startedAt - record.state.pausedMs);
    return { mode: 'continue', workoutId: record.workoutId, title: record.title, direction: record.direction, label, elapsedMin: Math.round(elapsed / 60000) };
  }
  if ((record.status === 'completing' || record.status === 'completed') && record.completion?.localDate === todayLocal) {
    return {
      mode: 'done',
      workoutId: record.workoutId,
      title: record.title,
      direction: record.direction,
      minutes: record.completion.payload.duration_actual,
      syncing: record.status === 'completing',
    };
  }
  return null;
}

/* ------------------------------------------------------------------ optional weight logging (F2) */

const NO_LOAD_EQUIPMENT = new Set([
  'bodyweight', 'pullup_bar', 'dip_station', 'bands', 'captains_chair', 'ab_wheel', 'suspension_trainer', 'box', 'med_ball',
  'slam_ball', 'sled', 'bench', 'back_extension_bench',
]);

/** Weight logging is offered only on loaded reps work: Strength, and Athletic strength / support rows. Never Sweat or power. */
export function isLoadLoggable(direction: V3Direction, item: V3Item): boolean {
  const rx = item.prescription;
  if (rx.kind !== 'reps') return false;
  if (rx.scaling) return false;
  if (NO_LOAD_EQUIPMENT.has(item.exercise.equipment ?? '')) return false;
  if (direction === 'strength') return true;
  if (direction === 'athletic') {
    const t = rx.direction_fields?.type;
    return t === 'strength' || t === 'support';
  }
  return false;
}

/** The progression line's suggested (or last) load, only when it is in the athlete's unit. Never auto-logged. */
export function suggestedLoad(item: V3Item, unit: WeightUnit): number | null {
  const p: any = item.progression;
  const sug = p?.suggestion;
  if (sug && typeof sug.load === 'number' && sug.unit === unit) return sug.load;
  const ref = p?.reference;
  if (ref && typeof ref.load === 'number' && ref.unit === unit) return ref.load;
  return null;
}

/** Reps shown with the weight: the set's target (scheme value, single number, or the low end of a range). */
export function defaultReps(step: SessionStep | null, logs: SetLog[] | undefined): number | null {
  const prev = logs && logs.length ? logs[logs.length - 1] : null;
  const r = step?.target?.reps;
  if (typeof r === 'number') return r;
  if (typeof r === 'string') {
    const m = r.match(/\d+/);
    if (m) return prev?.reps ?? parseInt(m[0], 10);
  }
  return prev?.reps ?? null;
}

/** Carry-forward: the previous set's logged load for this item (the athlete confirms it by completing the set). */
export function carriedLoad(logs: SetLog[] | undefined, unit: WeightUnit): number | null {
  const prev = logs && logs.length ? logs[logs.length - 1] : null;
  return prev && prev.unit === unit ? prev.load : null;
}

export function upsertLog(record: SessionRecord, itemId: string, log: SetLog): SessionRecord {
  const cur = (record.logs[itemId] ?? []).filter((l) => l.set !== log.set);
  const next = [...cur, log].sort((a, b) => a.set - b.set);
  return { ...record, logs: { ...record.logs, [itemId]: next } };
}

export function removeLog(record: SessionRecord, itemId: string, set: number): SessionRecord {
  const cur = (record.logs[itemId] ?? []).filter((l) => l.set !== set);
  const logs = { ...record.logs };
  if (cur.length) logs[itemId] = cur;
  else delete logs[itemId];
  return { ...record, logs };
}

/** Only logs the athlete entered or confirmed, only for sets actually completed, only valid loads. */
export function performanceFromLogs(plan: SessionPlan, state: SessionState, logs: Record<string, SetLog[]>): CompletionPayload['performance'] {
  const out: CompletionPayload['performance'] = [];
  for (const sec of plan.sections) {
    if (sec.kind !== 'block') continue;
    sec.items.forEach((it, i) => {
      const ls = logs[it.item_id];
      if (!ls || !ls.length) return;
      const doneSets = new Set(plan.steps.filter((x) => x.section === sec.index && x.type === 'work' && x.itemIndex === i && state.status[x.id] === 'done').map((x) => x.set));
      const sets = ls.filter((l) => doneSets.has(l.set) && Number.isFinite(l.load) && l.load > 0).map((l) => ({ reps: l.reps, load: l.load, unit: l.unit }));
      if (sets.length) out.push({ item_id: it.item_id, exercise_id: it.exercise.id, sets });
    });
  }
  return out;
}

export function buildCompletion(record: SessionRecord, plan: SessionPlan, state: SessionState, now: number, localDate: string): CompletionIntent {
  const t = tally(plan, state);
  const elapsed = Math.max(0, now - state.startedAt - state.pausedMs - (state.pausedAt != null ? now - state.pausedAt : 0));
  const payload: CompletionPayload = {
    performance: performanceFromLogs(plan, state, record.logs),
    duration_actual: Math.max(1, Math.round(elapsed / 60000)),
    started_at: new Date(state.startedAt).toISOString(),
    completed_steps: t.workDone,
    total_steps: t.workTotal,
    local_date: localDate,
    client_session_id: record.sessionId,
  };
  return { requestedAt: now, localDate, payload, attempts: 0, lastAttemptAt: null, nextAttemptAt: now, lastError: null, serverCompletedAt: null, alreadyCompleted: false, streak: null, access: null, terminal: false };
}

/** Controlled backoff: 30 s, 2 min, 10 min, 30 min, then hourly. Foreground / Home focus retry immediately. */
export const RETRY_DELAYS_MS = [30_000, 120_000, 600_000, 1_800_000, 3_600_000];

export function afterFailure(c: CompletionIntent, now: number, error: string, terminal = false): CompletionIntent {
  const attempts = c.attempts + 1;
  return { ...c, attempts, lastAttemptAt: now, lastError: error, terminal, nextAttemptAt: now + RETRY_DELAYS_MS[Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1)] };
}

export function shouldRetry(record: SessionRecord | null, now: number, trigger: 'timer' | 'foreground' | 'home' | 'screen'): boolean {
  if (!record || record.status !== 'completing' || !record.completion || record.completion.terminal) return false;
  if (trigger === 'timer') return now >= record.completion.nextAttemptAt;
  return true;
}

/* ------------------------------------------------------------------ background notification (F3) */

export interface TimerNotice {
  at: number;
  title: string;
  body: string;
}

/** One local notification for the next moment the athlete is needed, or null (short, paused, nothing running). */
export function timerNotice(plan: SessionPlan, state: SessionState, now: number): TimerNotice | null {
  const m = nextUserMoment(plan, state, now);
  if (!m || m.at - now < 5000) return null;
  const { lastTimer: lt, next } = m;
  const sec = plan.sections[next.section];
  const item = next.itemIndex != null ? sec?.items[next.itemIndex] : null;
  const name = item?.exercise.name ?? sec?.title ?? '';
  if (next.type === 'finish') return { at: m.at, title: 'Workout done', body: 'Open MOOD to finish and save it.' };
  const crossed = next.section !== lt.section;
  if (lt.type === 'rest') return { at: m.at, title: 'Rest over', body: [next.labels.position, name].filter(Boolean).join(' · ') + ' is ready.' };
  if (lt.type === 'transition') return { at: m.at, title: 'Time to move', body: `${name} is next.` };
  if (lt.type === 'work') return { at: m.at, title: 'Time', body: `${name}: ${next.labels.position}.` };
  if (crossed) return { at: m.at, title: `${plan.sections[lt.section]?.title || 'Block'} complete`, body: name ? `Up next: ${name}.` : 'Open MOOD for what is next.' };
  return { at: m.at, title: 'Timer done', body: name ? `${name} is next.` : 'Open MOOD for what is next.' };
}

/* ------------------------------------------------------------------ post-workout additions */

export function newAfter(now: number): AfterIntent {
  return { fit_rating: null, calories: null, avg_heart_rate: null, max_heart_rate: null, steps: null, hrv_sdnn: null, duration_actual: null, source: null, dirty: false, attempts: 0, nextAttemptAt: now, syncedAt: null };
}

export function withAfter(record: SessionRecord, patch: Partial<AfterIntent>, now: number): SessionRecord {
  const cur = record.after ?? newAfter(now);
  return { ...record, after: { ...cur, ...patch, dirty: true, nextAttemptAt: now } };
}

/** What the server receives: only fields the athlete or the wearable actually set. Never an invented number. */
export function afterPayload(a: AfterIntent): Record<string, any> {
  const out: Record<string, any> = {};
  for (const k of ['fit_rating', 'calories', 'avg_heart_rate', 'max_heart_rate', 'steps', 'hrv_sdnn', 'duration_actual'] as const) {
    if (a[k] != null) out[k] = a[k];
  }
  if (a.source) out.metrics_source = a.source;
  return out;
}

export function shouldSendAfter(record: SessionRecord | null, now: number, trigger: 'timer' | 'foreground' | 'home' | 'screen'): boolean {
  if (!record || record.status !== 'completed' || !record.after || !record.after.dirty) return false;
  if (Object.keys(afterPayload(record.after)).length === 0) return false;
  return trigger !== 'timer' || now >= record.after.nextAttemptAt;
}
