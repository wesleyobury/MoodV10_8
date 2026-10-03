/**
 * MOOD V3 Guided Session: what the screen says right now. Pure (tested), so the React layer only lays things out.
 *
 * Everything is derived from the Session Plan + SessionState. Coaching copy (cues, load guidance, quality stop, block
 * instructions) is displayed as copy; no timing or label logic reads prose. "Full recovery" comes only from rest.full_recovery.
 */
import type { V3Item } from '../v3Api';
import { TRAINING_TERMS, TermId, plainEffortFromPrescription } from '../v3PlainLanguage';
import { cuePhase, exerciseCues } from '../v3ExerciseCues';
import { fmtSeconds } from './compile';
import { SessionState, currentStep, isLastWork, isLive, nextLiveStep, nextWorkStep, remainingMs, sinceEnteredMs } from './engine';
import { CoachLine, Position, WhereAmI, coachLine, position, whereAmI } from './coach';
import type { V3State } from '../v3Api';
import type { SessionPlan, SessionSection, SessionStep } from './types';

export type Phase = 'work' | 'easy' | 'rest' | 'full' | 'move' | 'round_rest' | 'steady' | 'emom_rest' | 'none';

export interface StepView {
  step: SessionStep;
  section: SessionSection;
  item: V3Item | null;
  /** "SET 2 OF 4" / "ROUND 2 OF 4 · STATION 3 OF 5" */
  eyebrow: string;
  /** A1 / A2 / ANCHOR tag when the step belongs to a pair or anchor circuit */
  tag: string | null;
  title: string;
  target: string | null;
  effort: string | null;
  /** the effort as a tappable chip beside the target: "2 RIR" / "RPE 8", with what it means */
  effortChip: { label: string; title: string; body: string } | null;
  /** a set method the prescription carries beside the reps ("1.5 reps", "3 s eccentric", "paused reps", "drop set on the final set"), with what it means */
  method: { label: string; title: string; body: string } | null;
  cue: string | null;
  /** up to two coaching cues for the exercise on screen (the next one during a transition) */
  cues: string[];
  guidance: string | null;
  qualityStop: string | null;
  scaling: { short: string; detail: string } | null;
  phase: Phase;
  phaseLabel: string | null;
  timer: { remainingMs: number; totalMs: number; running: boolean } | null;
  /** "Next: Full recovery 2:30, then Set 3 of 4" */
  nextLine: string | null;
  /** The next work step's card on rest / transition screens */
  upNext: { eyebrow: string; title: string; target: string | null; item: V3Item | null; qualityStop: string | null } | null;
  /** first set of a new user-paced block: time since the previous block ended (the athlete breathes, no fake timer) */
  sinceLastMs: number | null;
  primary: string | null;
  canAddTime: boolean;
  emomDoneEarly: boolean;
  /** Layer 2 coaching (coach.ts), null when the moment needs nothing */
  coach: CoachLine | null;
  /** semantic position for the top of the screen */
  pos: Position;
  /** founder review: block role, muscles, set, what's left; on a rest it describes the set being rested for */
  where: WhereAmI;
  /** the exercise the screen is about: the current one, or the next one during a rest / transition */
  focusItem: V3Item | null;
  /** open sets of this exercise from here on (this one included); "All sets done" is offered when > 1 */
  setsLeftInExercise: number;
  /** a transition that leads to a set of the same block: the next set's screen is shown, the move countdown is a line */
  transitionToWork: SessionStep | null;
  /** "All sets done" (founder review 6c): a straight-set exercise finishes its own sets; a superset / circuit finishes the
   *  whole group (every round of every exercise). Offered while more than one set is open; no confirmation. */
  allDone: { scope: 'exercise' | 'block'; left: number } | null;
  /** during a rest / transition: the first cue of the set it leads to (that set's own phase) */
  restCue: string | null;
  /** the step in hand is the workout's last set: the primary reads Finish workout and finishing happens on that tap */
  lastWork: boolean;
}

export interface ViewOpts {
  states?: V3State[];
  /** structure explanations already shown (record.coachSeen) */
  seen?: string[];
  loggedLoad?: string | null;
  /** cool-down + Finish merge: when true and the step is the cool-down checklist, the primary reads Finish workout */
  canFinish?: boolean;
  /** workout.blocks[].type, for the block role label */
  blockTypes?: (string | null | undefined)[];
}

export function itemOf(plan: SessionPlan, st: SessionStep | null): V3Item | null {
  if (!st || st.itemIndex == null) return null;
  return plan.sections[st.section]?.items[st.itemIndex] ?? null;
}

const EFFORT_WORDS = /left in the tank|\bRIR\b|\bRPE\b|reps? in reserve|to failure/i;

/** Load guidance as coaching copy: without the scaling detail (shown on demand) and without the effort sentence when the
 *  effort line already says it. Display only; nothing here drives timing. */
function guidanceCopy(guidance: string | null | undefined, it: V3Item, effortShown: boolean): string | null {
  if (!guidance) return null;
  const d = it.prescription.scaling?.detail;
  let g = d ? guidance.replace(d, '').trim() : guidance.trim();
  g = g.replace(/\s*Make it fit you\.?\s*$/i, '');
  const parts = g.split(/(?<=[.;])\s+/).map((x) => x.trim()).filter(Boolean);
  const keep = effortShown ? parts.map((x) => x.split(/;\s*/).filter((y) => !EFFORT_WORDS.test(y)).join('; ')).filter(Boolean) : parts;
  const out = keep.join(' ').replace(/\s{2,}/g, ' ').replace(/[;,\s]+$/, '').trim();
  if (!out) return null;
  return /[.!?]$/.test(out) ? out : out;
}

/** "2 RIR" / "RPE 7–8" beside the target, with the plain-language definition for the tooltip. */
export function effortChipOf(rir: number | null | undefined, rpe: unknown): StepView['effortChip'] {
  if (typeof rir === 'number') {
    const def = TRAINING_TERMS.rir;
    if (rir <= 0) return { label: '0 RIR', title: '0 RIR · to failure', body: `${def.definition} 0 in reserve means the last set goes to failure: stop only when the next rep would not happen.` };
    return { label: `${rir} RIR`, title: `${rir} RIR · ${rir} ${rir === 1 ? 'rep' : 'reps'} in reserve`, body: `${def.definition} Here: stop each set when you could still do about ${rir} more good ${rir === 1 ? 'rep' : 'reps'}. If you are sure you had 5 left, go heavier next set; if you failed, go lighter.` };
  }
  const r = Array.isArray(rpe) && rpe.length === 2 ? (rpe[0] === rpe[1] ? String(rpe[0]) : `${rpe[0]}–${rpe[1]}`) : typeof rpe === 'number' ? String(rpe) : null;
  if (!r) return null;
  return { label: `RPE ${r}`, title: `RPE ${r}`, body: `${TRAINING_TERMS.rpe.definition} Aim for ${r} on this one.` };
}

const METHODS: { re: RegExp; label: string; title: string; body: string }[] = [
  { re: /1\.5 reps/i, label: '1.5 reps', title: '1.5 reps', body: 'Full rep, then a half rep from the stretched (bottom) position, then back to the top. That whole thing is one rep. More time where the muscle is longest; go a little lighter than usual.' },
  { re: /(\d+)\s*s eccentric/i, label: '$1 s eccentric', title: 'Slow eccentric', body: 'Lower for a slow $1-second count on every rep, then lift at normal speed. The lowering is the work; do not rush it on the last reps.' },
  { re: /paused reps?/i, label: 'Paused', title: 'Paused reps', body: 'Pause for 1–2 seconds at the hardest point of the rep (usually the bottom) with tension on, then drive. No bounce, no relaxing in the pause.' },
  { re: /drop set/i, label: 'Drop set · last set', title: 'Drop set on the final set', body: 'Final set only: reach the target reps, immediately cut the load by about 20–30 % and keep going to about the same effort. One drop is enough.' },
  { re: /rest-?pause/i, label: 'Rest-pause · last set', title: 'Rest-pause on the final set', body: 'Final set only: reach the target reps, rack it, rest 15–20 seconds, then squeeze out more reps at the same load. Once or twice, then done.' },
  { re: /tempo/i, label: 'Tempo', title: 'Tempo reps', body: 'Follow the tempo in the exercise details: slow where it says slow, fast where it says fast. The clock on each rep is the point.' },
];

/** A set method named in the prescription display ("4 × 8–10 · 1.5 reps"), with a tooltip. */
export function methodOf(display: string | null | undefined, guidance?: string | null): StepView['method'] {
  const suffix = display && display.includes('·') ? display.split('·').slice(1).join('·') : '';
  const hay = suffix || '';
  for (const m of METHODS) {
    const hit = m.re.exec(hay);
    if (hit) {
      const sub = (t: string) => t.replace('$1', hit[1] ?? '');
      return { label: sub(m.label), title: sub(m.title), body: sub(m.body) };
    }
  }
  void guidance;
  return null;
}

function eyebrowOf(st: SessionStep): string {
  const parts = [st.labels.position, st.type === 'emom_minute' || st.labels.group?.startsWith('Station') || st.labels.group?.startsWith('Exercise') ? st.labels.group : null];
  if (st.side) parts.push(st.side === 'left' ? 'Left side' : 'Right side');
  return parts.filter(Boolean).join(' · ').toUpperCase();
}

function tagOf(st: SessionStep): string | null {
  const g = st.labels.group;
  if (!g) return null;
  if (/^[A-Z]\d$/.test(g)) return g;
  if (g === 'Anchor') return 'ANCHOR';
  return null;
}

function describe(plan: SessionPlan, st: SessionStep | null): string {
  if (!st) return '';
  const sec = plan.sections[st.section];
  const it = itemOf(plan, st);
  switch (st.type) {
    case 'finish': return 'Finish';
    case 'checklist': return sec.title;
    case 'ready': return `${sec.label} · ${sec.title}`;
    case 'rest': return `${st.rest?.fullRecovery ? 'Full recovery' : 'Rest'} ${fmtSeconds(st.durationSec ?? 0)}`;
    case 'transition': return `Move ${fmtSeconds(st.durationSec ?? 0)}`;
    case 'recovery': return `${st.labels.phase === 'ROUND REST' ? 'Round rest' : 'Easy'} ${fmtSeconds(st.durationSec ?? 0)}`;
    default: {
      const pos = [tagOf(st), st.labels.group && !tagOf(st) && st.labels.group !== 'Anchor' ? st.labels.group : null].filter(Boolean)[0] ?? st.labels.position;
      return [pos, it?.exercise.name].filter(Boolean).join(' · ');
    }
  }
}

/** Ready card line for a clock block, from the rest contract only. */
export function clockSummary(sec: SessionSection): string {
  const r = sec.rest;
  if (!r) return '';
  const iv = sec.interval;
  const items = sec.items;
  switch (r.kind) {
    case 'interval': {
      if (iv?.steps_sec?.length) return `Pyramid ${iv.steps_sec.map(fmtSeconds).join(' · ')} · ${fmtSeconds(r.recovery_sec ?? 0)} easy between`;
      if (sec.structure === 'timed_circuit')
        return `${sec.rounds} rounds · ${fmtSeconds(r.work_sec ?? 0)} on, ${fmtSeconds(r.recovery_sec ?? 0)} easy per station` + (r.seconds ? ` · +${fmtSeconds(r.seconds)} between rounds` : '');
      return `${sec.rounds ?? iv?.rounds ?? ''} × ${fmtSeconds(r.work_sec ?? 0)} work · ${fmtSeconds(r.recovery_sec ?? 0)} easy`;
    }
    case 'emom':
    {
      const M = iv?.minutes ?? (sec.rounds ?? 1) * Math.max(1, items.length);
      const R = Math.ceil(M / Math.max(1, items.length));
      return items.length > 1 && R > 1 ? `EMOM · ${M} min · ${R} rounds of ${items.length} stations` : `EMOM · ${M} min`;
    }
    case 'continuous':
      return `${fmtSeconds(items[0]?.prescription.seconds ?? 0)} steady, no programmed recovery`;
    default:
      return '';
  }
}

/**
 * The cues for a set change as the athlete moves through the exercise (founder review 6): which set of this exercise the
 * step is (a per-side right counts with its left; circuit rounds count like sets), and whether it is a timed effort.
 */
export function cuesFor(plan: SessionPlan, st: SessionStep | null): string[] {
  const it = itemOf(plan, st);
  if (!st || !it) return [];
  const mine = plan.steps.filter((x) => x.section === st.section && x.countsAsWork && x.itemIndex === st.itemIndex && x.side !== 'right');
  const idx = Math.max(0, mine.filter((x) => x.index <= st.index).length - 1);
  const timed = !!st.durationSec || st.type === 'timed_work';
  return exerciseCues(it, 2, cuePhase(idx, mine.length), timed);
}

export function stepView(plan: SessionPlan, s: SessionState, now: number, opts: ViewOpts = {}): StepView {
  const st = currentStep(plan, s);
  const sec = plan.sections[st.section];
  const it = itemOf(plan, st);
  const rx = it?.prescription;
  const effort = rx ? plainEffortFromPrescription(rx.rir, rx.rpe)?.text ?? null : null;
  const effortChip = rx ? effortChipOf(rx.rir, rx.rpe) : null;
  const method = rx ? methodOf(rx.display, rx.load_guidance) : null;
  const rem = remainingMs(plan, s, now);
  // The ring is scaled to the step's planned length, so −15 s / +15 s / +30 s visibly move it (founder pass, Oct 2026). Time
  // added beyond the planned length keeps the ring full until the countdown is back inside it.
  const planned = st.durationSec ? st.durationSec * 1000 : 0;
  const totalMs = planned ? Math.max(planned, rem ?? 0) : 0;
  const timer = st.durationSec && (rem != null || st.type === 'work' || st.type === 'emom_minute') ? { remainingMs: rem ?? totalMs, totalMs, running: rem != null && s.pausedAt == null } : null;

  let phase: Phase = 'none';
  let phaseLabel: string | null = null;
  if (st.type === 'rest') { phase = st.rest?.fullRecovery ? 'full' : 'rest'; phaseLabel = st.rest?.fullRecovery ? 'FULL RECOVERY' : 'REST'; }
  else if (st.type === 'transition') { phase = 'move'; phaseLabel = st.labels.phase === 'Switch' ? 'NEXT MINUTE IN' : 'MOVE TO'; }
  else if (st.type === 'recovery') { phase = st.labels.phase === 'ROUND REST' ? 'round_rest' : 'easy'; phaseLabel = st.labels.phase === 'ROUND REST' ? 'ROUND REST' : 'EASY'; }
  else if (st.type === 'timed_work') { phase = sec.restKind === 'continuous' ? 'steady' : 'work'; phaseLabel = sec.restKind === 'continuous' ? 'STEADY' : 'WORK'; }
  else if (st.type === 'emom_minute') {
    const early = s.status[st.id] === 'done';
    phase = early ? 'emom_rest' : 'work';
    phaseLabel = early ? 'REST' : s.stepStartedAt == null ? 'READY' : 'WORK';
  }

  // Next line / up-next card, previewed as if the current step is completed (its rest only exists once the set is done)
  const ahead: SessionState = st.type === 'finish' ? s : { ...s, status: { ...s.status, [st.id]: s.status[st.id] ?? 'done' } };
  const nx = nextLiveStep(plan, ahead);
  const nw = nextWorkStep(plan, ahead);
  // one short phrase (founder review: essentials only): "Then rest 2:00" · "Then A2 · Skull Crusher" · "Then easy 20 s, then Interval 2 of 8"
  let nextLine: string | null = null;
  if (nx) {
    const after = nextWorkStep(plan, ahead, nx.index);
    const lower = (x: string) => x.replace(/^(Rest|Full recovery|Easy|Round rest|Move)/, (m) => m.toLowerCase());
    if (nx.type === 'rest') nextLine = `Then ${lower(describe(plan, nx))}`;
    else if (nx.type === 'transition') nextLine = `Then ${after ? describe(plan, after) : lower(describe(plan, nx))}`;
    else if (nx.type === 'recovery') nextLine = `Then ${lower(describe(plan, nx))}${after ? `, then ${describe(plan, after)}` : ''}`;
    else nextLine = `Then ${describe(plan, nx)}`;
  }
  // EMOM (founder pass, Oct 2026): the next minute's exercise is never previewed; it appears when its minute comes up
  const upTarget = st.type === 'rest' || st.type === 'transition' || st.type === 'recovery' ? nw : null;
  const upItem = itemOf(plan, upTarget);
  const upNext = upTarget
    ? {
        eyebrow: upTarget.type === 'ready' ? plan.sections[upTarget.section].label.toUpperCase() : upTarget.type === 'finish' ? 'FINISH' : eyebrowOf(upTarget),
        title: upItem?.exercise.name ?? (upTarget.type === 'finish' ? 'Last one done' : plan.sections[upTarget.section].title),
        target: upTarget.target?.text ?? null,
        item: upItem,
        qualityStop: upItem?.quality_stop ?? null,
      }
    : null;

  // "since last set": first live user-paced work of a block reached from a previous block
  let sinceLastMs: number | null = null;
  if (st.type === 'work' && s.stepStartedAt == null) {
    let j = st.index - 1;
    while (j >= 0 && !s.status[plan.steps[j].id] && !isLive(plan, s, j)) j--;
    if (j >= 0 && plan.steps[j].section !== st.section && plan.sections[plan.steps[j].section]?.kind === 'block') sinceLastMs = sinceEnteredMs(s, now);
  }

  const where = whereAmI(plan, s, now, opts.blockTypes);

  const workLabel = (x: SessionStep, started: boolean) => (x.durationSec && !started ? `Start ${fmtSeconds(x.durationSec)}` : sec.restKind === 'between_sets' || sec.restKind === 'after_pair' ? 'Complete set' : 'Done');
  const transitionToWork = st.type === 'transition' && nw && nw.type === 'work' && nw.section === st.section && nw.itemIndex != null ? nw : null;
  const setsLeftInExercise = st.type === 'work' && st.itemIndex != null && sec.restKind === 'between_sets' ? plan.steps.filter((x) => x.section === st.section && x.type === 'work' && x.itemIndex === st.itemIndex && x.index >= st.index && x.side !== 'right' && !s.status[x.id]).length : 0;

  // the last set of the workout: its button finishes the workout (no "That's the workout" screen after it)
  const lastWork = (st.type === 'work' || !!transitionToWork) && isLastWork(plan, s);
  let primary: string | null = null;
  switch (st.type) {
    case 'work': primary = lastWork && (!st.durationSec || s.stepStartedAt != null) ? 'Finish workout' : workLabel(st, s.stepStartedAt != null); break;
    case 'ready': primary = 'Start'; break;
    case 'checklist': primary = sec.kind === 'warmup' ? 'Start workout' : opts.canFinish ? 'Finish workout' : 'Done'; break;
    // every rest ends the same way (founder review 6): Start now
    case 'rest': primary = 'Start now'; break;
    case 'transition': primary = transitionToWork ? (lastWork && !transitionToWork.durationSec ? 'Finish workout' : workLabel(transitionToWork, false)) : 'Start now'; break;
    case 'recovery': primary = st.labels.phase === 'ROUND REST' ? 'Start now' : null; break;
    // EMOM: no Done; the minute runs out on its own, the next one waits for Start
    case 'emom_minute': primary = s.stepStartedAt == null && !s.status[st.id] ? 'Start' : null; break;
    case 'finish': primary = 'Finish workout'; break;
    default: primary = null;
  }

  return {
    step: st,
    section: sec,
    item: it,
    eyebrow: st.type === 'work' || st.type === 'timed_work' || st.type === 'emom_minute' || st.type === 'recovery' ? eyebrowOf(st) : sec.label.toUpperCase(),
    tag: tagOf(st),
    title: it?.exercise.name ?? sec.title,
    target: st.target?.text ?? null,
    effort,
    effortChip,
    method,
    cue: it?.cues?.[0] ?? null,
    // the set on screen: during a move to the partner (superset) that is the next set
    cues: cuesFor(plan, transitionToWork ?? (it ? st : null)),
    guidance: it ? guidanceCopy(rx?.load_guidance, it, !!effort) : null,
    qualityStop: it?.quality_stop ?? null,
    scaling: rx?.scaling ? { short: rx.scaling.short, detail: rx.scaling.detail } : null,
    phase,
    phaseLabel,
    timer,
    nextLine,
    upNext,
    sinceLastMs,
    primary,
    // +15 / +30 on rest and transitions only; a clock block keeps its prescribed rhythm
    canAddTime: (st.type === 'rest' || st.type === 'transition') && s.stepStartedAt != null,
    emomDoneEarly: st.type === 'emom_minute' && s.status[st.id] === 'done',
    coach: coachLine({ plan, state: s, now, states: opts.states, seen: opts.seen ?? [], loggedLoad: opts.loggedLoad ?? null }),
    pos: position(plan, s),
    where,
    focusItem: (st.type === 'rest' || st.type === 'transition') && upItem ? upItem : it,
    setsLeftInExercise,
    transitionToWork,
    lastWork,
    allDone: (() => {
      const onSet = st.type === 'work' || !!transitionToWork;
      if (!onSet || sec.kind !== 'block' || sec.clock) return null;
      if (sec.restKind === 'between_sets') return setsLeftInExercise > 1 ? { scope: 'exercise' as const, left: setsLeftInExercise } : null;
      if (sec.items.length < 2) return null;
      const left = plan.steps.filter((x) => x.section === st.section && x.countsAsWork && x.index >= st.index && x.side !== 'right' && !s.status[x.id]).length;
      return left > 1 ? { scope: 'block' as const, left } : null;
    })(),
    restCue: (st.type === 'rest' || st.type === 'transition') && !transitionToWork && nw && nw.type === 'work' ? cuesFor(plan, nw)[0] ?? null : null,
  };
}

/* ------------------------------------------------------------------ warm-up / cool-down screen (founder review) */

export interface EdgeRow {
  key: string;
  /** "Easy cardio" / "Mobility" / "Ramp-up sets" / an Athletic warm-up component */
  label: string;
  /** "3–5 min" / "2 × 10" / "2–3 lighter sets" */
  rx: string | null;
  /** the exercise, when one is named (thumbnail + details) */
  item: V3Item | null;
  name: string | null;
  /** one plain line of what to do; the "your choice" note for unprescribed cardio */
  note: string | null;
  /** true when MOOD leaves the modality to the athlete on purpose */
  choice: boolean;
}

export interface EdgePlan {
  title: string;
  minutes: number | null;
  rows: EdgeRow[];
  /** the section guidance when nothing structured could be read from it */
  fallback: string | null;
  /** the intentional-choice note, shown once under the list */
  choiceNote: string | null;
}

const CHOICE = 'Cardio is your call on purpose: bike, rower, ski erg, treadmill, jump rope or a brisk walk. Anything easy that gets you warm.';

function musclesOfFirstBlock(plan: SessionPlan): string | null {
  const b = plan.sections.find((x) => x.kind === 'block');
  const n = new Map<string, number>();
  for (const it of b?.items ?? []) for (const m of (it.exercise.display_muscles ?? it.exercise.primary_muscles) ?? []) n.set(m, (n.get(m) ?? 0) + 1);
  const top = [...n.entries()].sort((a, c) => c[1] - a[1]).slice(0, 3).map(([m]) => m.replace(/_/g, ' '));
  return top.length ? top.join(', ') : null;
}

function findItem(plan: SessionPlan, name: string): V3Item | null {
  for (const sec of plan.sections) for (const it of sec.items) if (it.exercise.name.toLowerCase() === name.toLowerCase()) return it;
  return null;
}

/** What the warm-up / cool-down screen lists. Read from the section (Athletic items, or the guidance sentence); nothing invented. */
export function edgePlan(plan: SessionPlan, sec: SessionSection): EdgePlan {
  const minutes = sec.minutes != null ? Math.round(sec.minutes) : null;
  if (sec.kind === 'cooldown') {
    return {
      title: 'Cool-down', minutes, fallback: null, choiceNote: null,
      rows: [{ key: 'cd', label: 'Bring it down', rx: minutes ? `${minutes} min` : null, item: null, name: null, note: sec.guidance ?? 'Easy movement, then slow your breathing down.', choice: true }],
    };
  }
  // Athletic: MOOD's own list (raise · mobility · primer · rehearsal)
  if (sec.warmupItems.length) {
    return {
      title: 'Warm-up', minutes, fallback: null, choiceNote: null,
      rows: sec.warmupItems.map((x, i) => ({ key: `w${i}`, label: x.component_label ?? 'Warm-up', rx: x.prescription_text ?? null, item: x.exercise ? ({ item_id: `warmup-${i}`, exercise: x.exercise, prescription: { kind: 'reps', sets: null, reps: null, per_side: false, seconds: null, distance_m: null, calories: null, rest_sec: null, rir: null, rpe: null, load_guidance: null, display: x.prescription_text ?? '' }, cues: [], quality_stop: null, swap: null, progression: null } as V3Item) : null, name: x.name, note: null, choice: false })),
    };
  }
  const g = (sec.guidance ?? '').trim();
  const rows: EdgeRow[] = [];
  // Strength: "5-8 min: easy cardio and mobility, then 2-3 lighter ramp-up sets of X."
  let m = /^(\d+)\s*-\s*(\d+)\s*min:\s*easy cardio and mobility,\s*then\s*(\d+)\s*-\s*(\d+)\s*lighter ramp-up sets of (.+?)\.?$/i.exec(g);
  if (m) {
    const lo = +m[1], hi = +m[2];
    const cardio = `${Math.max(2, lo - 2)}–${Math.max(3, hi - 3)} min`;
    const mob = `${Math.min(2, lo)}–3 min`;
    const lift = findItem(plan, m[5]);
    const ms = musclesOfFirstBlock(plan);
    rows.push({ key: 'cardio', label: 'Easy cardio', rx: cardio, item: null, name: null, note: 'Any machine or a brisk walk, conversational pace.', choice: true });
    rows.push({ key: 'mobility', label: 'Mobility', rx: mob, item: null, name: null, note: ms ? `Open up what you're about to train: ${ms}.` : 'Open up what you\'re about to train.', choice: false });
    rows.push({ key: 'ramp', label: 'Ramp-up sets', rx: `${m[3]}–${m[4]} lighter sets`, item: lift, name: m[5], note: 'Lighter loads, building toward your first working set. These don\'t count as sets.', choice: false });
    return { title: 'Warm-up', minutes, rows, fallback: null, choiceNote: CHOICE };
  }
  // Sweat: "6 min: easy cardio building to a moderate pace, plus a few reps of the first stations."
  m = /^(\d+)\s*min:\s*easy cardio building to a moderate pace,\s*plus a few reps of the first stations\.?$/i.exec(g);
  if (m) {
    const first = plan.sections.find((x) => x.kind === 'block');
    rows.push({ key: 'cardio', label: 'Easy cardio, building', rx: `${Math.max(2, +m[1] - 2)}–${m[1]} min`, item: null, name: null, note: 'Start easy, finish at a moderate pace you could hold for a while.', choice: true });
    for (const it of (first?.items ?? []).slice(0, 3)) rows.push({ key: `st-${it.item_id}`, label: 'Rehearse', rx: 'a few easy reps', item: it, name: it.exercise.name, note: null, choice: false });
    return { title: 'Warm-up', minutes, rows, fallback: null, choiceNote: CHOICE };
  }
  return { title: 'Warm-up', minutes, rows, fallback: g || null, choiceNote: /cardio/i.test(g) ? CHOICE : null };
}
