/**
 * MOOD V3 Guided Session: normalized Session Plan types.
 *
 *   V3 envelope ──compile()──▶ SessionPlan ──(SessionState, now)──▶ player
 *
 * The plan is a pure function of the workout (see compile.ts). It is an ordered list of steps; every step keeps its parent
 * structure (section → round → item → set / side) so pairs, rounds and circuits stay explicit for the UI. The player never
 * reads the raw envelope to decide timing.
 */
import type { V3Direction, V3Interval, V3Item, V3RestContract, V3WarmupItem } from '../v3Api';

export type SectionKind = 'warmup' | 'block' | 'cooldown';

/**
 * user   : the athlete advances (Complete set / Done / Start / Continue)
 * timer  : the clock advances when the step's duration elapses (the athlete may also skip)
 */
export type Advance = 'user' | 'timer';

export type StepType =
  | 'checklist'   // warm-up / cool-down guidance or Athletic warm-up list (user)
  | 'ready'       // the card before a clock block; Start starts the clock (user)
  | 'work'        // a set / station / rung (user; a time hold carries a manual-start timer)
  | 'timed_work'  // interval bout, timed-circuit station, pyramid step, continuous effort (timer)
  | 'emom_minute' // one EMOM minute; station = items[(m - 1) % n] (timer; Done early is allowed)
  | 'transition'  // transition_sec between items inside a round (timer)
  | 'rest'        // between_sets / after_pair / after_round rest (timer)
  | 'recovery'    // interval recovery, timed-circuit round rest (timer)
  | 'finish';     // end of the plan; Finish workout is explicit (user)

export type RestSource = 'set' | 'pair' | 'round' | 'interval' | 'round_interval';

export interface StepTarget {
  kind: 'reps' | 'time' | 'distance' | 'calories';
  /** Human text for the per-set target, e.g. "7 reps", "30–60 sec", "40 m / side", "12 cal", "0:45". */
  text: string;
  reps: number | string | null;
  seconds: number | null;
  distance_m: number | null;
  calories: number | null;
  perSide: boolean;
}

export interface SessionStep {
  /** Stable, deterministic id: `${sectionId}:r${round}:i${item}:s${set}:${phase}`. */
  id: string;
  index: number;
  type: StepType;
  advance: Advance;
  section: number;            // index into plan.sections
  round: number | null;       // 1-based
  rounds: number | null;
  itemIndex: number | null;   // index into the block's items
  set: number | null;         // 1-based set / rung / minute / interval number
  sets: number | null;
  side: 'left' | 'right' | null;
  /** Timer steps: the duration. Work steps with a time target: the manual-start countdown. */
  durationSec: number | null;
  /**
   * How a work step's countdown starts. manual: the athlete taps Start (a plank after a rest, the first hold of a block);
   * auto: chained from the previous step even during catch-up (the right side of a per-side hold); ontap: starts only when the
   * athlete's own tap brought them here (a timed station right after the previous station in a circuit round), never after a
   * timer, a restore or a jump. Timer steps (rest, transition, recovery, clock work) always start on entry.
   */
  timerStart: 'auto' | 'manual' | 'ontap' | null;
  target: StepTarget | null;
  labels: { position: string; group: string | null; phase: string | null };
  rest: { fullRecovery: boolean; reason: 'power' | 'heavy' | null; source: RestSource } | null;
  /** A main-block work step (sets the F5 completion guard and progress). */
  countsAsWork: boolean;
}

export interface SessionSection {
  index: number;
  id: string;
  kind: SectionKind;
  /** 1-based block number among blocks (null for warm-up / cool-down). */
  blockNumber: number | null;
  blockCount: number;
  title: string;
  label: string;              // "Block 2 of 4" / "Warm-up" / "Cool-down"
  structure: string;
  restKind: V3RestContract['kind'] | null;
  rest: V3RestContract | null;
  interval: V3Interval | null;
  rounds: number | null;
  items: V3Item[];
  warmupItems: V3WarmupItem[];
  guidance: string | null;    // warm-up / cool-down guidance or block instructions (coaching copy only)
  minutes: number | null;
  /** true when the block is driven by a clock (interval / emom / continuous). */
  clock: boolean;
  firstStep: number;
  lastStep: number;
  estSec: number;             // progress-bar proportions only
}

export interface SessionPlan {
  compilerVersion: number;
  workoutId: string;
  workoutVersion: number;
  direction: V3Direction;
  fingerprint: string;
  sections: SessionSection[];
  steps: SessionStep[];
  totalEstSec: number;
  workSteps: number;
}
