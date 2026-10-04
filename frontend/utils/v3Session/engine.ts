/**
 * MOOD V3 Guided Session: the session engine. Pure, React-free, timestamp-based.
 *
 * SessionState stores a cursor, timestamps and step statuses. It never stores a countdown value: a timer's remaining time is
 * always `start + duration + extra + pausedInStep − now`. `resolve(plan, state, now)` walks forward through every timer step
 * that has already ended (the app was backgrounded, the phone was locked, the app was killed) and stops at the first step
 * that needs the athlete. A chained timer starts at the previous timer's expected end, not at "now", so intervals never drift.
 *
 * Rules:
 *   • user-paced work never starts by itself; after a rest ends the athlete lands on the next set, waiting
 *   • clock blocks (intervals, timed circuits, EMOM, continuous) only start from their Ready card, then run in real time
 *     (backgrounding does not pause them; only Pause does). EMOM: a minute always runs to its end (no Done), then a 15 s
 *     switch, then the next minute starts by itself
 *   • a rest / recovery is dropped when the set before it was skipped or no work remains after it in the block, and a
 *     transition is dropped when its next item was skipped, so skipping never produces a double or trailing rest
 */
import type { SessionPlan, SessionStep } from './types';

export type StepStatus = 'done' | 'skipped';

export interface SessionState {
  cursor: number;
  /** When the current step's timer started (auto timers on entry; manual holds on tap). null = not running. */
  stepStartedAt: number | null;
  /** When the current step became current (the "since last set" count-up). */
  enteredAt: number;
  /** +15 / +30 s added to the current rest. */
  extraSec: number;
  /** Paused time inside the current timer. */
  stepPausedMs: number;
  pausedAt: number | null;
  /** Total paused time for the workout (elapsed time excludes it). */
  pausedMs: number;
  startedAt: number;
  status: Record<string, StepStatus>;
}

const REST_LIKE = new Set(['rest', 'recovery', 'transition']);
const MAX_WALK = 5000;

export function initialState(plan: SessionPlan, now: number): SessionState {
  const s: SessionState = { cursor: 0, stepStartedAt: null, enteredAt: now, extraSec: 0, stepPausedMs: 0, pausedAt: null, pausedMs: 0, startedAt: now, status: {} };
  const first = firstLive(plan, s, 0);
  return enter(plan, s, first, now, 'jump');
}

export function currentStep(plan: SessionPlan, s: SessionState): SessionStep {
  return plan.steps[Math.min(Math.max(0, s.cursor), plan.steps.length - 1)];
}

/** The clock the engine reads: frozen while paused. */
function clockNow(s: SessionState, now: number): number {
  return s.pausedAt != null ? s.pausedAt : now;
}

export function stepEndAt(plan: SessionPlan, s: SessionState): number | null {
  const st = currentStep(plan, s);
  if (s.stepStartedAt == null || !st.durationSec) return null;
  return s.stepStartedAt + (st.durationSec + s.extraSec) * 1000 + s.stepPausedMs;
}

export function remainingMs(plan: SessionPlan, s: SessionState, now: number): number | null {
  const end = stepEndAt(plan, s);
  if (end == null) return null;
  return Math.max(0, end - clockNow(s, now));
}

export function elapsedMs(s: SessionState, now: number): number {
  return Math.max(0, clockNow(s, now) - s.startedAt - s.pausedMs);
}

/** Time since the current step became current (paused time excluded only while paused). */
export function sinceEnteredMs(s: SessionState, now: number): number {
  return Math.max(0, clockNow(s, now) - s.enteredAt);
}

/* ------------------------------------------------------------------ liveness */

function nearestWorkBefore(plan: SessionPlan, i: number): SessionStep | null {
  const sec = plan.steps[i].section;
  for (let j = i - 1; j >= 0 && plan.steps[j].section === sec; j--) if (plan.steps[j].countsAsWork) return plan.steps[j];
  return null;
}

function workRemainsAfter(plan: SessionPlan, s: SessionState, i: number): boolean {
  const sec = plan.steps[i].section;
  for (let j = i + 1; j < plan.steps.length && plan.steps[j].section === sec && plan.steps[j].type !== 'finish'; j++) {
    if (plan.steps[j].countsAsWork && !s.status[plan.steps[j].id]) return true;
  }
  return false;
}

export function isLive(plan: SessionPlan, s: SessionState, i: number): boolean {
  const st = plan.steps[i];
  if (!st) return false;
  if (st.type === 'finish') return true;
  if (s.status[st.id]) return false;
  if (st.type === 'transition') {
    const nx = plan.steps[i + 1];
    return !!nx && nx.section === st.section && !s.status[nx.id];
  }
  if (st.type === 'rest' || st.type === 'recovery') {
    const prev = nearestWorkBefore(plan, i);
    if (prev && s.status[prev.id] !== 'done') return false;
    return workRemainsAfter(plan, s, i);
  }
  return true;
}

function firstLive(plan: SessionPlan, s: SessionState, from: number): number {
  for (let j = from; j < plan.steps.length; j++) if (isLive(plan, s, j)) return j;
  return plan.steps.length - 1;
}

export type EnterCause = 'tap' | 'timer' | 'jump';

/**
 * Enter step j at time `at`. Timer steps start on entry (tap or timer). A work step's countdown starts by the rule in
 * SessionStep.timerStart: auto (always), ontap (only when the athlete's tap brought them here), manual (never). A jump
 * (Overview navigation, Back, restore) never starts anything.
 */
function enter(plan: SessionPlan, s: SessionState, j: number, at: number, cause: EnterCause): SessionState {
  const st = plan.steps[j];
  const auto =
    cause !== 'jump' && (st.advance === 'timer' || (st.type === 'work' && (st.timerStart === 'auto' || (st.timerStart === 'ontap' && cause === 'tap'))));
  return { ...s, cursor: j, enteredAt: at, extraSec: 0, stepPausedMs: 0, stepStartedAt: auto && st.durationSec ? at : null };
}

function advanceFrom(plan: SessionPlan, s: SessionState, at: number, cause: EnterCause = 'tap'): SessionState {
  const j = firstLive(plan, s, s.cursor + 1);
  return enter(plan, s, j, at, cause);
}

/** The step a jump lands on: a user step. Inside a clock block, that block's Ready card (the clock never starts by itself). */
export function jumpTarget(plan: SessionPlan, s: SessionState, index: number): number {
  const st = plan.steps[Math.min(Math.max(0, index), plan.steps.length - 1)];
  const sec = plan.sections[st.section];
  if (sec?.clock && st.type !== 'finish') return sec.firstStep;
  if (st.type === 'rest' || st.type === 'recovery' || st.type === 'transition') {
    for (let j = st.index + 1; j < plan.steps.length; j++) if (plan.steps[j].advance === 'user' && plan.steps[j].section === st.section) return j;
  }
  return st.index;
}

/** The next unfinished work step of an item in a section (the step Overview makes current), or its first step when all done. */
export function itemEntryStep(plan: SessionPlan, s: SessionState, section: number, itemIndex: number): number | null {
  const mine = plan.steps.filter((x) => x.section === section && x.countsAsWork && x.itemIndex === itemIndex);
  if (!mine.length) return null;
  const open = mine.find((x) => !s.status[x.id]);
  return (open ?? mine[0]).index;
}

function mark(s: SessionState, id: string, v: StepStatus): SessionState {
  return { ...s, status: { ...s.status, [id]: v } };
}

/* ------------------------------------------------------------------ resolve */

/** Catch up: complete every timer that has ended by `now`, chaining each next timer from the previous expected end. */
export function resolve(plan: SessionPlan, state: SessionState, now: number): SessionState {
  let s = state;
  if (s.pausedAt != null) return s;
  // a restored cursor may point at a step that is no longer live
  // (a running timer stays current even when marked: an EMOM minute tapped Done early waits for its boundary)
  if (s.stepStartedAt == null && !isLive(plan, s, s.cursor)) s = enter(plan, s, firstLive(plan, s, s.cursor), now, 'jump');
  for (let guard = 0; guard < MAX_WALK; guard++) {
    const st = currentStep(plan, s);
    const end = stepEndAt(plan, s);
    if (end == null || now < end) break;
    s = mark(s, st.id, s.status[st.id] ?? 'done');
    s = advanceFrom(plan, s, end, 'timer');
  }
  return s;
}

/* ------------------------------------------------------------------ actions */

export type SessionAction =
  | { type: 'complete' }
  | { type: 'start_timer' }
  | { type: 'skip' }
  | { type: 'skip_exercise' }
  /** "All sets done": the athlete did the rest of this exercise's sets on their own; they count as done, their rests are not run. */
  | { type: 'complete_exercise' }
  | { type: 'skip_block' }
  | { type: 'back' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'add_time'; seconds: -30 | -15 | 15 | 30 }
  | { type: 'complete_block' }
  /** Overview navigation: make a step current without completing or skipping anything (never starts a clock). */
  | { type: 'jump'; index: number }
  /** Overview tracking: mark one work step done where it stands (its rest is not started; the cursor only moves if it was there). */
  | { type: 'complete_step'; index: number }
  /** Overview tracking: undo a completed / skipped work step. */
  | { type: 'uncomplete_step'; index: number };

export function reduce(plan: SessionPlan, state: SessionState, action: SessionAction, now: number): SessionState {
  if (action.type === 'resume') {
    if (state.pausedAt == null) return state;
    const d = Math.max(0, now - state.pausedAt);
    return resolve(plan, { ...state, pausedAt: null, pausedMs: state.pausedMs + d, stepPausedMs: state.stepStartedAt != null ? state.stepPausedMs + d : state.stepPausedMs }, now);
  }
  let s = resolve(plan, state, now);
  if (action.type === 'pause') return s.pausedAt != null ? s : { ...s, pausedAt: now };
  if (s.pausedAt != null) return s; // everything else waits for Resume
  const st = currentStep(plan, s);
  switch (action.type) {
    case 'complete': {
      if (st.type === 'finish') return s;
      if (st.type === 'emom_minute') return mark(s, st.id, 'done'); // "rest until next minute"; the minute boundary advances
      if (REST_LIKE.has(st.type)) return advanceFrom(plan, mark(s, st.id, 'skipped'), now); // Start now / I'm ready
      return advanceFrom(plan, mark(s, st.id, 'done'), now);
    }
    case 'start_timer':
      if ((st.type === 'work' || st.type === 'emom_minute') && st.durationSec && s.stepStartedAt == null) return { ...s, stepStartedAt: now, stepPausedMs: 0 };
      return s;
    case 'skip':
      if (st.type === 'finish') return s;
      return advanceFrom(plan, mark(s, st.id, 'skipped'), now);
    case 'skip_exercise': {
      if (st.itemIndex == null || st.type === 'finish') return advanceFrom(plan, mark(s, st.id, 'skipped'), now);
      let n = s;
      for (let j = s.cursor; j < plan.steps.length && plan.steps[j].section === st.section; j++) {
        const x = plan.steps[j];
        if (x.countsAsWork && x.itemIndex === st.itemIndex && !n.status[x.id]) n = mark(n, x.id, 'skipped');
      }
      if (!n.status[st.id]) n = mark(n, st.id, 'skipped');
      return advanceFrom(plan, n, now);
    }
    case 'complete_exercise': {
      if (st.itemIndex == null || st.type === 'finish') return s;
      let n = s;
      for (let j = s.cursor; j < plan.steps.length && plan.steps[j].section === st.section; j++) {
        const x = plan.steps[j];
        if (n.status[x.id]) continue;
        if (x.countsAsWork && x.itemIndex === st.itemIndex) n = mark(n, x.id, 'done');
        else if ((x.type === 'rest' || x.type === 'transition') && x.itemIndex === st.itemIndex) n = mark(n, x.id, 'skipped');
      }
      if (!n.status[st.id]) n = mark(n, st.id, st.countsAsWork ? 'done' : 'skipped');
      return advanceFrom(plan, n, now);
    }
    case 'complete_block': {
      // "All sets done" on a superset / circuit (founder review 6c): every open set of every exercise in the block counts as
      // done, the block's rests and moves are not run, the next block is up
      if (st.type === 'finish' || plan.sections[st.section]?.kind !== 'block') return s;
      let n = s;
      for (let j = plan.sections[st.section].firstStep; j < plan.steps.length && plan.steps[j].section === st.section && plan.steps[j].type !== 'finish'; j++) {
        const x = plan.steps[j];
        if (n.status[x.id]) continue;
        n = mark(n, x.id, x.countsAsWork ? 'done' : 'skipped');
      }
      return advanceFrom(plan, n, now);
    }
    case 'skip_block': {
      if (st.type === 'finish') return s;
      let n = s;
      for (let j = s.cursor; j < plan.steps.length && plan.steps[j].section === st.section && plan.steps[j].type !== 'finish'; j++) {
        if (!n.status[plan.steps[j].id]) n = mark(n, plan.steps[j].id, 'skipped');
      }
      return advanceFrom(plan, n, now);
    }
    case 'add_time':
      // +15 / +30 and (founder review 6) −15 / −30; taking off more than is left simply ends the rest on the next tick
      if (REST_LIKE.has(st.type) && s.stepStartedAt != null) return { ...s, extraSec: Math.max(-(st.durationSec ?? 0), s.extraSec + action.seconds) };
      return s;
    case 'back': {
      const target = backTarget(plan, s);
      if (target == null) return s;
      const status = { ...s.status };
      for (let j = target; j < plan.steps.length; j++) delete status[plan.steps[j].id];
      return enter(plan, { ...s, status }, target, now, 'jump');
    }
    case 'jump': {
      const j = jumpTarget(plan, s, action.index);
      if (j === s.cursor) return s;
      return enter(plan, s, j, now, 'jump');
    }
    case 'complete_step': {
      const x = plan.steps[action.index];
      if (!x || !x.countsAsWork || s.status[x.id] === 'done') return s;
      if (action.index === s.cursor) return reduce(plan, s, { type: 'complete' }, now);
      return mark(s, x.id, 'done');
    }
    case 'uncomplete_step': {
      const x = plan.steps[action.index];
      if (!x || !x.countsAsWork || !s.status[x.id]) return s;
      const status = { ...s.status };
      delete status[x.id];
      const n = { ...s, status };
      // if the cursor now sits on something that only made sense after that step (its rest), move back onto the step
      return action.index < s.cursor && !isLive(plan, n, s.cursor) ? enter(plan, n, action.index, now, 'jump') : n;
    }
    default:
      return s;
  }
}

/** Where Back goes: the previous set / checklist; inside (or right after) a clock block, that block's Ready card. */
export function backTarget(plan: SessionPlan, s: SessionState): number | null {
  const st = currentStep(plan, s);
  const sec = plan.sections[st.section];
  if (st.type !== 'finish' && sec?.clock && s.cursor > sec.firstStep) return sec.firstStep;
  for (let j = s.cursor - 1; j >= 0; j--) {
    const x = plan.steps[j];
    if (x.type === 'work' || x.type === 'checklist' || x.type === 'ready' || x.type === 'timed_work' || x.type === 'emom_minute') {
      const xs = plan.sections[x.section];
      if (xs?.clock) return xs.firstStep;
      // the right side of a per-side hold goes back to its left side
      if (x.side === 'right' && plan.steps[j - 1]?.side === 'left') return j - 1;
      return j;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ queries */

export function hasMainWork(plan: SessionPlan, s: SessionState): boolean {
  return plan.steps.some((x) => x.countsAsWork && s.status[x.id] === 'done');
}

/**
 * F5: the end is reached (skips allowed) and at least one main-block work step was actually completed. The cool-down
 * checklist counts as the end: its Done and Finish would otherwise be two taps for one intent (finishing marks it done).
 */
export function canFinish(plan: SessionPlan, s: SessionState): boolean {
  const st = currentStep(plan, s);
  const atEnd = st.type === 'finish' || (st.type === 'checklist' && plan.sections[st.section]?.kind === 'cooldown' && plan.steps[st.index + 1]?.type === 'finish');
  return atEnd && hasMainWork(plan, s);
}

/**
 * The step in hand is the last piece of work: once it is done, no work step is left anywhere after it (founder review 6:
 * the final set's button reads Finish workout, there is no separate "That's the workout" screen). A transition counts as
 * the set it leads to. Clock steps finish by their clock, so they are not "last user-paced work".
 */
export function isLastWork(plan: SessionPlan, s: SessionState): boolean {
  const st = currentStep(plan, s);
  const target = st.type === 'transition' ? plan.steps[st.index + 1] : st;
  if (!target || target.type !== 'work' || !target.countsAsWork) return false;
  for (let j = target.index + 1; j < plan.steps.length; j++) {
    const x = plan.steps[j];
    if (x.countsAsWork && !s.status[x.id]) return false;
  }
  return true;
}

/**
 * One tap from the last set to a finished workout: the set in hand counts as done (a transition before it is skipped), and
 * whatever is left after it (the cool-down, a trailing rest) is closed as skipped (never done) before landing on Finish.
 * The caller still checks canFinish() (F5) on the result.
 */
export function finishFromLast(plan: SessionPlan, state: SessionState, now: number): SessionState {
  let s = resolve(plan, state, now);
  const st = currentStep(plan, s);
  if (st.type === 'transition') {
    s = mark(s, st.id, 'skipped');
    const nx = plan.steps[st.index + 1];
    if (nx?.countsAsWork && !s.status[nx.id]) s = mark(s, nx.id, 'done');
  } else if (st.countsAsWork && !s.status[st.id]) s = mark(s, st.id, 'done');
  const fin = plan.steps.length - 1;
  for (let j = s.cursor; j < fin; j++) if (!s.status[plan.steps[j].id]) s = mark(s, plan.steps[j].id, 'skipped');
  return enter(plan, s, fin, now, 'jump');
}

/** Finish from wherever canFinish() is true: completes a trailing cool-down checklist first. */
export function finishState(plan: SessionPlan, s: SessionState, now: number): SessionState {
  const st = currentStep(plan, s);
  return st.type === 'checklist' ? reduce(plan, s, { type: 'complete' }, now) : s;
}

export function nextWorkStep(plan: SessionPlan, s: SessionState, from = s.cursor): SessionStep | null {
  for (let j = from + 1; j < plan.steps.length; j++) {
    const x = plan.steps[j];
    if (!isLive(plan, s, j)) continue;
    if (x.type === 'work' || x.type === 'timed_work' || x.type === 'emom_minute' || x.type === 'ready' || x.type === 'checklist' || x.type === 'finish') return x;
  }
  return null;
}

/** The step right after the current one (rest, transition or work). */
export function nextLiveStep(plan: SessionPlan, s: SessionState): SessionStep | null {
  for (let j = s.cursor + 1; j < plan.steps.length; j++) if (isLive(plan, s, j)) return plan.steps[j];
  return null;
}

export interface Progress {
  fraction: number;
  /** per block section: fraction of its estimated time already behind the athlete */
  sections: { index: number; weight: number; done: number }[];
}

export function progress(plan: SessionPlan, s: SessionState): Progress {
  const cur = currentStep(plan, s);
  const secs = plan.sections.map((sec) => {
    const steps = plan.steps.filter((x) => x.section === sec.index && x.type !== 'finish');
    let done: number;
    if (cur.type === 'finish' || sec.index < cur.section) done = 1;
    else if (sec.index > cur.section) done = 0;
    else {
      const w = (x: SessionStep) => (x.type === 'work' ? x.durationSec ?? 40 : x.durationSec ?? 0);
      const total = steps.reduce((n, x) => n + w(x), 0) || 1;
      const behind = steps.filter((x) => x.index < s.cursor || !!s.status[x.id]).reduce((n, x) => n + w(x), 0);
      done = Math.min(1, behind / total);
    }
    return { index: sec.index, weight: Math.max(1, sec.estSec), done };
  });
  const tw = secs.reduce((n, x) => n + x.weight, 0) || 1;
  return { fraction: secs.reduce((n, x) => n + x.weight * x.done, 0) / tw, sections: secs };
}

/** Counts for completion / analytics. */
export function tally(plan: SessionPlan, s: SessionState) {
  let done = 0, skipped = 0, sets = 0, bouts = 0;
  for (const x of plan.steps) {
    if (!x.countsAsWork) continue;
    if (s.status[x.id] === 'done') {
      done++;
      if (x.type === 'work' && x.side !== 'right') sets++;
      if (x.type === 'timed_work' || x.type === 'emom_minute') bouts++;
    } else if (s.status[x.id] === 'skipped') skipped++;
  }
  const blocksTouched = new Set(plan.steps.filter((x) => x.countsAsWork && s.status[x.id] === 'done').map((x) => x.section)).size;
  return { workDone: done, workSkipped: skipped, workTotal: plan.workSteps, setsDone: sets, boutsDone: bouts, blocksTouched };
}

/**
 * The next moment the athlete is needed, if the timers run on without them: walks the current timer chain to the first
 * user step. Used for a single background notification (never a queue of interval alerts).
 */
export function nextUserMoment(plan: SessionPlan, state: SessionState, now: number): { at: number; lastTimer: SessionStep; next: SessionStep } | null {
  let s = resolve(plan, state, now);
  if (s.pausedAt != null) return null;
  let end = stepEndAt(plan, s);
  if (end == null) return null;
  for (let guard = 0; guard < MAX_WALK; guard++) {
    const st = currentStep(plan, s);
    const e = stepEndAt(plan, s);
    if (e == null) return null;
    s = advanceFrom(plan, mark(s, st.id, 'done'), e);
    end = e;
    const nx = currentStep(plan, s);
    if (s.stepStartedAt == null) return { at: end, lastTimer: st, next: nx };
  }
  return null;
}
