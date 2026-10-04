/**
 * MOOD V3 Guided Session: the coaching layer. Small, deterministic, context-aware; never an LLM, never a paragraph.
 *
 *   Layer 1 (always, on the step itself)   name · target · effort · one cue     (viewModel.ts)
 *   Layer 2 (this file)                     one short contextual line when it matters, with State tone
 *   Layer 3 (Exercise Details)              setup, cues, mistakes, effort, scaling, quality stop, demo
 *
 * Lines come from workout structure, position and timers only. They repeat only where the moment repeats (a rest is a rest);
 * per-set chatter is avoided: a set gets a line only when it is the first of a block, the last of an exercise, heavy, or
 * explosive. Structure explanations are shown once per structure per session (record.coachSeen).
 */
import type { V3State } from '../v3Api';
import { estStepSec, fmtSeconds } from './compile';
import { SessionState, currentStep, nextWorkStep, remainingMs } from './engine';
import type { SessionPlan, SessionSection, SessionStep } from './types';

export type Tone = 'neutral' | 'controlled' | 'supportive' | 'assertive' | 'direct';

/** State tone: Stressed → controlled, Low Energy → supportive / efficient, Amped → assertive, Irritated → direct. */
export function toneOf(states: V3State[] | undefined): Tone {
  const s = new Set(states ?? []);
  if (s.has('stressed')) return 'controlled';
  if (s.has('low_energy')) return 'supportive';
  if (s.has('irritated')) return 'direct';
  if (s.has('amped')) return 'assertive';
  return 'neutral';
}

export interface CoachLine {
  text: string;
  /** structure: an explanation shown once; pacing: changes with the clock; context: a moment (heavy, last set, new block) */
  kind: 'structure' | 'pacing' | 'context';
  /** key for the once-only rule (structure explanations) */
  key?: string;
}

/* ------------------------------------------------------------------ structure explanations (once per structure) */

export function structureKey(sec: SessionSection, direction: string): string | null {
  if (sec.kind !== 'block') return null;
  const s = sec.structure;
  if (s === 'superset') return direction === 'athletic' && sec.items.some((i) => !!i.quality_stop) ? 'contrast' : 'superset';
  if (['circuit', 'anchor_circuit', 'timed_circuit', 'emom', 'intervals', 'continuous', 'pyramid', 'ladder'].includes(s)) return s;
  return null;
}

export function structureExplanation(sec: SessionSection, direction: string): string | null {
  const r = sec.rest;
  const rounds = sec.rounds ?? 1;
  switch (structureKey(sec, direction)) {
    case 'superset':
      return `Superset · ${rounds} rounds. Finish A1, move straight to A2, then take the full rest.`;
    case 'contrast':
      return `Contrast pair · ${rounds} rounds. Heavy strength first, then the explosive move while you're primed. Keep the power work sharp.`;
    case 'circuit':
      return `Circuit · ${rounds} rounds. Every station in order, then rest. That's one round.`;
    case 'anchor_circuit':
      return `Hybrid · ${rounds} rounds. The anchor opens every round, then the stations. Rest after the last station.`;
    case 'timed_circuit':
      return `Timed circuit. ${fmtSeconds(r?.work_sec ?? 0)} on, ${fmtSeconds(r?.recovery_sec ?? 0)} easy, station to station. The clock runs it; you keep moving.`;
    case 'emom':
      return `${sec.interval?.minutes ?? ''}-minute EMOM. Do the reps, then rest out the minute. You get 15 s to switch stations before the next minute starts; pause if you need longer.`;
    case 'intervals':
      return 'Push during WORK. Use EASY to recover enough to repeat the effort.';
    case 'continuous':
      return 'One steady effort. Settle into a pace you can hold the whole way.';
    case 'pyramid':
      return 'The efforts climb, then come back down. Hold the same output on every step.';
    case 'ladder':
      return 'The reps drop each rung. Move through it at your own pace, quality first.';
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ the line for right now */

export interface CoachContext {
  plan: SessionPlan;
  state: SessionState;
  now: number;
  states: V3State[] | undefined;
  seen: string[];
  /** the load logged on the previous set of this exercise, if any (for "same weight") */
  loggedLoad?: string | null;
}

export function coachLine(ctx: CoachContext): CoachLine | null {
  const { plan, state: s, now, seen } = ctx;
  const st = currentStep(plan, s);
  const sec = plan.sections[st.section];
  const tone = toneOf(ctx.states);
  const item = st.itemIndex != null ? sec.items[st.itemIndex] : null;
  const rem = remainingMs(plan, s, now);
  const remS = rem == null ? null : Math.ceil(rem / 1000);

  // 1. structure explanation, once, at the block's first live moment (Ready card or first work step)
  const key = structureKey(sec, plan.direction);
  if (key && !seen.includes(key) && (st.type === 'ready' || (st.index === firstWorkIndex(plan, sec) && (st.type === 'work')))) {
    const text = structureExplanation(sec, plan.direction);
    if (text) return { text, kind: 'structure', key };
  }

  switch (st.type) {
    case 'rest': {
      const full = !!st.rest?.fullRecovery;
      if (remS != null && remS <= 12) {
        const nx = nextWorkStep(plan, s);
        const tgt = nx?.target?.text ? (ctx.loggedLoad ? `${ctx.loggedLoad}, ${nx.target.text}` : nx.target.text) : null;
        return { text: tgt ? `Get set. ${cap(tgt)}.` : 'Get set.', kind: 'pacing' };
      }
      if (full) return { text: pick(tone, {
        neutral: "Don't chase the clock. Start when you're ready to produce another strong set.",
        controlled: 'Full recovery. Let the breathing settle before the next set.',
        supportive: "Take the full rest. Quality over speed today.",
        assertive: "Recover completely. The next set should be as good as the first.",
        direct: "Full rest. Then put everything into the next set.",
      }), kind: 'pacing' };
      return { text: pick(tone, {
        neutral: "Breathe. You've got time.",
        controlled: 'Slow breaths. Nothing here is rushed.',
        supportive: "Easy breathing. You're doing the work.",
        assertive: 'Shake it out. Stay switched on.',
        direct: 'Breathe. Reset. Go again.',
      }), kind: 'pacing' };
    }
    case 'transition': {
      if (st.labels.phase === 'Switch') return { text: 'Get to the next station. The minute starts on its own; pause if you need longer.', kind: 'pacing' };
      const nx = nextWorkStep(plan, s);
      const nxItem = nx?.itemIndex != null ? plan.sections[nx.section].items[nx.itemIndex] : null;
      if (nxItem?.quality_stop) return { text: 'Move over and reset. Every rep of the next one should be fast.', kind: 'context' };
      return { text: 'Move straight over. Set up, then go.', kind: 'context' };
    }
    case 'recovery': {
      if (remS != null && remS <= 10) {
        const nx = nextWorkStep(plan, s);
        return { text: nx && nx.set === nx.sets ? 'Last effort. Finish strong.' : `Next effort in ${remS} seconds.`, kind: 'pacing' };
      }
      if (st.labels.phase === 'ROUND REST') return { text: `Round ${st.round} done. Walk it off; the next round starts on the clock.`, kind: 'pacing' };
      return { text: 'Get your breathing under control before the next effort.', kind: 'pacing' };
    }
    case 'timed_work': {
      if (st.set != null && st.sets != null && st.set === st.sets && st.sets > 1) return { text: 'Last one. Empty the tank.', kind: 'context' };
      if (sec.restKind === 'continuous') return { text: pick(tone, { neutral: 'Find a rhythm you can hold. Steady beats fast.', controlled: 'Even pace, even breathing.', supportive: 'Steady and comfortable is the goal.', assertive: 'Hold a strong, even pace.', direct: 'Lock in. Hold it.' }), kind: 'context' };
      if (st.set === 1) return { text: pick(tone, { neutral: 'Pace the first one so the last one looks the same.', controlled: 'Controlled effort. Repeatable.', supportive: 'Start under control; build into it.', assertive: 'Attack it, but keep it repeatable.', direct: 'Go hard. Keep it clean.' }), kind: 'context' };
      return null;
    }
    case 'emom_minute': {
      if (s.status[st.id] === 'done') return { text: 'Recover. Be ready at the top of the minute.', kind: 'pacing' };
      if (s.stepStartedAt == null) return null;
      if (remS != null && remS <= 5 && st.set != null && st.sets != null && st.set < st.sets) return { text: 'Minute almost up. 15 s to switch, then the next one starts.', kind: 'pacing' };
      return null;
    }
    case 'work': {
      if (!item) return null;
      const power = !!item.quality_stop;
      const heavy = !!sec.rest?.full_recovery && sec.restKind === 'between_sets';
      const last = st.set != null && st.sets != null && st.set === st.sets && st.sets > 1 && (sec.restKind === 'between_sets');
      const first = st.index === firstWorkIndex(plan, sec);
      const circuit = sec.restKind === 'after_round';
      if (circuit && st.round != null && st.rounds != null && st.round > 1 && st.labels.group?.startsWith('Station 1')) {
        return { text: st.round === st.rounds ? `Round ${st.round} of ${st.rounds}. Last round: same technique as the first.` : `Round ${st.round} of ${st.rounds}. Keep the pace repeatable.`, kind: 'context' };
      }
      if (power && (first || st.set === 1)) return { text: 'Every rep should be fast. Stop the set the moment your power drops.', kind: 'context' };
      if (heavy && st.set === 1) return { text: pick(tone, { neutral: 'Take your time here. Brace hard before every rep.', controlled: 'No rush. Brace, then move with intent.', supportive: 'Warm into it. Brace hard, own each rep.', assertive: 'Brace hard. Move it with intent.', direct: 'Brace. Drive. Nothing sloppy.' }), kind: 'context' };
      if (last) return { text: 'Last one. Match the quality of your first set.', kind: 'context' };
      if (circuit && st.round === 1 && st.labels.group?.startsWith('Station 1')) return { text: 'Stay moving, but never let technique fall apart.', kind: 'context' };
      return null;
    }
    case 'ready':
      return null;
    default:
      return null;
  }
}

function firstWorkIndex(plan: SessionPlan, sec: SessionSection): number {
  const f = plan.steps.find((x) => x.section === sec.index && x.countsAsWork);
  return f ? f.index : -1;
}

function pick(tone: Tone, m: Record<Tone, string>): string {
  return m[tone] ?? m.neutral;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Semantic position for the top of the screen. */
export interface Position {
  /** "BLOCK 2 OF 4" / "WARM-UP" / "FINISH" */
  block: string;
  /** "Main lift" */
  title: string;
  /** "Exercise 3 of 6 · Set 2 of 4" / "Round 2 of 4 · Station 3 of 5" / "Interval 5 of 8" / "Minute 7 of 24" */
  local: string | null;
  /** dots for the local unit (sets / intervals / minutes / rounds): total and done */
  dots: { total: number; done: number } | null;
}

export function position(plan: SessionPlan, s: SessionState): Position {
  const st = currentStep(plan, s);
  const sec = plan.sections[st.section];
  if (st.type === 'finish') return { block: 'FINISH', title: '', local: null, dots: null };
  const block = sec.kind === 'block' ? `BLOCK ${sec.blockNumber} OF ${sec.blockCount}` : sec.label.toUpperCase();
  if (sec.kind !== 'block') return { block, title: '', local: null, dots: null };
  const items = sec.items.length;
  const exerciseNo = st.itemIndex != null ? st.itemIndex + 1 : null;
  const doneSets = (i: number | null) => (i == null ? 0 : plan.steps.filter((x) => x.section === sec.index && x.countsAsWork && x.itemIndex === i && x.side !== 'right' && s.status[x.id] === 'done').length);
  switch (sec.restKind) {
    case 'between_sets': {
      const ex = exerciseNo != null && items > 1 ? `Exercise ${exerciseNo} of ${items}` : null;
      const set = st.sets ? `Set ${st.set ?? doneSets(st.itemIndex) + 1} of ${st.sets}` : null;
      return { block, title: sec.title, local: [ex, set].filter(Boolean).join(' · ') || null, dots: st.sets ? { total: st.sets, done: doneSets(st.itemIndex) } : null };
    }
    case 'after_pair':
    case 'after_round': {
      const station = st.labels.group && !/^[A-Z]\d$/.test(st.labels.group) && st.labels.group !== 'Anchor' ? st.labels.group : st.labels.group ? st.labels.group : null;
      return { block, title: sec.title, local: [st.round ? `Round ${st.round} of ${st.rounds}` : null, station].filter(Boolean).join(' · ') || null, dots: st.rounds ? { total: st.rounds, done: Math.max(0, (st.round ?? 1) - 1) } : null };
    }
    case 'interval': {
      const lbl = st.labels.position;
      return { block, title: sec.title, local: [lbl, st.labels.group].filter(Boolean).join(' · ') || null, dots: st.sets ? { total: st.sets, done: Math.max(0, (st.set ?? 1) - 1) } : null };
    }
    case 'emom':
      return { block, title: sec.title, local: st.labels.position, dots: st.sets && st.sets <= 30 ? { total: st.sets, done: Math.max(0, (st.set ?? 1) - 1) } : null };
    case 'continuous':
      return { block, title: sec.title, local: null, dots: null };
    case 'self_paced':
      return { block, title: sec.title, local: [st.labels.position, st.labels.group].filter(Boolean).join(' · ') || null, dots: st.rounds ? { total: st.rounds, done: Math.max(0, (st.round ?? 1) - 1) } : null };
    default:
      return { block, title: sec.title, local: null, dots: null };
  }
}

/** Overall completion across the whole workout (Overview): main work steps done / total. */
export function overall(plan: SessionPlan, s: SessionState): { done: number; total: number; skipped: number } {
  let done = 0, skipped = 0;
  for (const x of plan.steps) {
    if (!x.countsAsWork) continue;
    if (s.status[x.id] === 'done') done++;
    else if (s.status[x.id] === 'skipped') skipped++;
  }
  return { done, total: plan.workSteps, skipped };
}

export type { SessionStep };

/* ------------------------------------------------------------------ where am I (founder review: immediate position) */

/** Programming role of a block, by Direction (matches the Cart's ROLE_LABEL). */
const ROLE: Record<string, Record<string, string>> = {
  strength: { main: 'Main lift', secondary: 'Secondary', target: 'Target', accessory: 'Accessory', finisher: 'Finisher' },
  sweat: { primary: 'Primary', complement: 'Complement', finisher: 'Finisher' },
  athletic: { primer: 'Primer', primary: 'Primary', secondary: 'Secondary', strength: 'Athletic strength', support: 'Support', finisher: 'Finisher', repeats: 'Repeats' },
};

const pretty = (m: string) => m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export interface WhereAmI {
  /** "MAIN LIFT" / "ACCESSORY" / "WARM-UP" / "COOL-DOWN" / "FINISH" */
  role: string;
  /** "Chest · Triceps" from the exercise's primary muscles (null outside blocks) */
  muscles: string | null;
  /** 1-based block number and count (null outside blocks) */
  block: { n: number; of: number } | null;
  /** the exercise the athlete is on (or about to be on, during a rest) */
  exercise: string | null;
  /** "Set 2 of 4" / "Round 3 of 4 · Station 2" / "Interval 5 of 8" / "Minute 7 of 12" */
  local: string | null;
  dots: { total: number; done: number } | null;
  /** what is left in the whole workout */
  left: { sets: number; exercises: number; minutes: number };
  /** one segment per block: fraction done, whether it is the current one */
  segments: { key: string; label: string; done: number; current: boolean; touched: boolean }[];
  /** the step this position describes (the next work step during a rest) */
  stepIndex: number;
  /** grouped work (superset / circuit / hybrid): every exercise of the round, the one in hand lit, the ones done ticked */
  group: {
    kind: 'superset' | 'circuit' | 'hybrid' | 'emom';
    round: number | null;
    rounds: number | null;
    /** one plain sentence: how the group is done ("Do A1, then go straight to A2. Rest after A2.") */
    how: string;
    items: { marker: string; name: string; rx: string | null; active: boolean; done: boolean }[];
  } | null;
}

/** The step the athlete should be looking at: on a rest / transition, the set they are resting for. */
function focusStep(plan: SessionPlan, s: SessionState): SessionStep {
  const st = currentStep(plan, s);
  if (st.type === 'rest' || st.type === 'transition' || st.type === 'recovery') {
    const nw = nextWorkStep(plan, s);
    if (nw && nw.type !== 'ready' && nw.type !== 'finish' && plan.sections[nw.section]?.kind === 'block') return nw;
  }
  return st;
}

export function whereAmI(plan: SessionPlan, s: SessionState, now: number, blockTypes?: (string | null | undefined)[]): WhereAmI {
  const st = focusStep(plan, s);
  const sec = plan.sections[st.section];
  const isWork = (x: SessionStep) => x.countsAsWork || (x.type === 'work' && plan.sections[x.section]?.kind === 'block');
  const open = (x: SessionStep) => s.status[x.id] !== 'done' && s.status[x.id] !== 'skipped';
  // what is left: open work steps (one per set, not per side), exercises with any open work, estimated seconds from the cursor on
  const cur = currentStep(plan, s);
  let sets = 0, secs = 0;
  const openItems = new Set<string>();
  for (const x of plan.steps) {
    if (x.index < cur.index) continue;
    if (x.index === cur.index && s.status[x.id]) continue;
    if (x.type === 'work' && open(x) && x.side !== 'right') sets++;
    if ((x.type === 'work' || x.type === 'timed_work' || x.type === 'emom_minute') && open(x) && x.itemIndex != null && plan.sections[x.section]?.kind === 'block') openItems.add(`${x.section}:${x.itemIndex}`);
    if (open(x) && x.type !== 'checklist' && x.type !== 'ready' && x.type !== 'finish') {
      if (x.index === cur.index && s.stepStartedAt != null && x.durationSec) secs += Math.max(0, (remainingMs(plan, s, now) ?? 0) / 1000);
      else secs += estStepSec(x);
    }
  }
  // cool-down minutes (a checklist has no steps to estimate)
  const cd = plan.sections.find((x) => x.kind === 'cooldown');
  if (cd && cur.section <= cd.index && (cur.section < cd.index || !s.status[plan.steps[cd.firstStep]?.id])) secs += cd.estSec;
  const left = { sets, exercises: openItems.size, minutes: Math.max(0, Math.round(secs / 60)) };

  const segments = plan.sections.filter((x) => x.kind === 'block').map((b) => {
    const steps = plan.steps.filter((x) => x.section === b.index && isWork(x));
    const done = steps.filter((x) => !open(x)).length;
    return { key: b.id, label: b.title, done: steps.length ? done / steps.length : 0, current: b.index === sec.index, touched: done > 0 };
  });

  if (st.type === 'finish') return { role: 'FINISH', muscles: null, block: null, exercise: null, local: null, dots: null, left, segments, stepIndex: st.index, group: null };
  if (sec.kind !== 'block') return { role: sec.title.toUpperCase(), muscles: null, block: null, exercise: null, local: null, dots: null, left, segments, stepIndex: st.index, group: null };

  // grouped work: the round's exercises in order
  let group: WhereAmI['group'] = null;
  // EMOM with more than one station is a circuit on the clock: the card shows the round and which station is this minute's
  const kind: 'superset' | 'circuit' | 'hybrid' | 'emom' | null = sec.structure === 'superset' && sec.items.length > 1 ? 'superset' : sec.structure === 'anchor_circuit' ? 'hybrid' : sec.structure === 'circuit' || sec.structure === 'timed_circuit' ? 'circuit' : sec.restKind === 'emom' && sec.items.length > 1 ? 'emom' : null;
  if (kind && st.round != null) {
    const r = st.round;
    const stepsOf = (i: number) => plan.steps.filter((x) => x.section === sec.index && x.itemIndex === i && x.round === r && (x.type === 'work' || x.type === 'timed_work' || x.type === 'emom_minute'));
    const markerOf = (i: number) => {
      const w0 = stepsOf(i)[0];
      const g = w0?.labels.group ?? null;
      return g && /^[A-Z]\d$/.test(g) ? g : g === 'Anchor' ? 'ANCHOR' : String(i + 1);
    };
    group = {
      kind, round: r, rounds: st.rounds, how: '',
      items: sec.items.map((it, i) => {
        const mine = stepsOf(i);
        return { marker: markerOf(i), name: it.exercise.name, rx: mine[0]?.target?.text ?? it.prescription.display ?? null, active: i === st.itemIndex, done: mine.length > 0 && mine.every((x) => s.status[x.id] === 'done' || s.status[x.id] === 'skipped') };
      }),
    };
    // hybrid stations that are not in this round drop out
    group.items = group.items.filter((_, i) => stepsOf(i).length > 0);
    const ms = group.items.map((x) => x.marker);
    const lastM = ms[ms.length - 1];
    group.how = kind === 'superset'
      ? (ms.length === 2 ? `Do ${ms[0]}, then go straight to ${ms[1]}. No rest between; rest after ${lastM}.` : `Do ${ms.join(', ')} back to back. Rest after ${lastM}.`)
      : kind === 'emom'
        ? 'One station per minute, in order. Do the reps, rest out the minute. Then the next round starts at station 1.'
      : kind === 'hybrid'
        ? 'The anchor first, then each station in order. Rest at the end of the round.'
        : sec.clock ? 'Each station in order on the clock.' : 'Each station in order, moving straight to the next. Rest after the last one.';
  }

  const type = blockTypes?.[sec.blockNumber! - 1] ?? null;
  const role = (type && ROLE[plan.direction]?.[type]) ?? sec.title;
  const it = st.itemIndex != null ? sec.items[st.itemIndex] : null;
  // Athletic: the performance role ("Total-Body Power", "Plyometric" ...) instead of muscle labels (final pre-launch pass)
  const pr = plan.direction === 'athletic' ? it?.prescription?.direction_fields?.performance_role : null;
  const ms = typeof pr === 'string' && pr ? [pr] : plan.direction === 'athletic' ? [] : ((it?.exercise.display_muscles ?? it?.exercise.primary_muscles) ?? []).slice(0, 2).map(pretty);
  // local position for the focused step (a rest looks at the set it leads to); the exercise index is dropped, the hero says it
  const posFor = position(plan, { ...s, cursor: st.index, stepStartedAt: null });
  let local = posFor.local ? posFor.local.replace(/^Exercise \d+ of \d+ · /, '') : null;
  // the group strip names the station / pair member; the local line keeps only the round
  if (group && local) local = local.replace(/ · (Station \d+ of \d+|[A-Z]\d|Anchor)$/, '');
  return {
    role: role.toUpperCase(),
    muscles: ms.length ? ms.join(' · ') : null,
    block: sec.blockNumber ? { n: sec.blockNumber, of: sec.blockCount } : null,
    exercise: it?.exercise.name ?? null,
    local,
    dots: posFor.dots,
    left,
    segments,
    stepIndex: st.index,
    group,
  };
}
