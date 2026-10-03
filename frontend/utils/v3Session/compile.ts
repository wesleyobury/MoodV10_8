/**
 * MOOD V3 Guided Session: the session compiler.
 *
 * compile(workout) turns a finalized V3 workout into a SessionPlan. Pure, deterministic, React-free, versioned.
 *
 * Timing comes only from structured fields: `block.rest` (the authoritative rest contract), `prescription.rest_sec` (rest after
 * one set of that row, between_sets only), `block.rounds`, `block.interval`, `prescription.sets / seconds / reps_scheme`.
 * Nothing here reads `display`, `instructions` or any other prose for timing. The rules per `rest.kind`:
 *
 *   between_sets  set → rest(row.rest_sec) → set …; no rest after the last set of the last item
 *   after_pair    per round: A1 → transition(transition_sec) → A2 → rest(rest.seconds); no rest after the final round
 *   after_round   per round: stations (anchor first; anchor-circuit stations only in their listed rounds) → rest(rest.seconds)
 *   interval      Ready → WORK(work_sec) / EASY(recovery_sec) …, nothing after the last bout;
 *                 timed_circuit: recovery after each station, and at a round end the round rest is recovery_sec + rest.seconds
 *                 (the frozen Sweat engine accounts both: sweat_core.py block time for rotating intervals);
 *                 pyramid: steps of interval.steps_sec with recovery_sec between
 *   emom          Ready → interval.minutes × one-minute steps, station = items[(m - 1) % n]; each minute runs out on its
 *                 own (no Done), then a 15 s switch (transition), then the next minute starts by itself
 *   continuous    Ready → one timed effort of prescription.seconds
 *   self_paced    per rung of reps_scheme: each item once; no timers
 */
import type { V3Block, V3Item, V3Workout } from '../v3Api';
import type { RestSource, SessionPlan, SessionSection, SessionStep, StepTarget, StepType } from './types';

export const COMPILER_VERSION = 1;

/** Founder pass, Oct 2026: no post-workout cool-down screen. Kept as a switch so it can come back without a rewrite. */
const INCLUDE_COOLDOWN = false;

/** Progress-bar weight of one user-paced set (seconds). Proportions only; never a timer. */
const EST_SET_SEC = 40;

const CLOCK_KINDS = new Set(['interval', 'emom', 'continuous']);

/** EMOM: the switch window between one minute and the next (the next minute starts by itself when it ends). */
export const EMOM_SWITCH_SEC = 15;

/* ------------------------------------------------------------------ formatting helpers (structured fields only) */

export function fmtSeconds(s: number): string {
  const n = Math.round(s);
  if (n < 60) return `${n} s`;
  const m = Math.floor(n / 60);
  const r = n % 60;
  return r === 0 ? `${m} min` : `${m}:${String(r).padStart(2, '0')}`;
}

export function fmtClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

const RANGE_ONLY = /^\s*\d+(\s*[–-]\s*\d+)?\s*$/;

function schemeValue(it: V3Item, set: number | null): number | string | null {
  const sch = it.prescription.reps_scheme;
  if (Array.isArray(sch) && set != null && set >= 1 && set <= sch.length) return sch[set - 1] as number;
  return it.prescription.reps ?? null;
}

/** The per-set target. `seconds` overrides the row's value for clock bouts (the block's work_sec is authoritative). */
export function targetFor(it: V3Item, set: number | null, round: number | null, seconds?: number | null): StepTarget {
  const rx = it.prescription;
  const perSide = !!rx.per_side;
  const side = perSide ? ' / side' : '';
  const base = { reps: null as number | string | null, seconds: null as number | null, distance_m: rx.distance_m ?? null, calories: rx.calories ?? null, perSide };
  // Hybrid anchors whose dose changes by round carry the per-round doses as a structured list.
  const roundDoses = rx.direction_fields?.round_doses;
  if (Array.isArray(roundDoses) && round != null && roundDoses[round - 1]) {
    return { ...base, kind: rx.kind, text: String(roundDoses[round - 1]), reps: rx.reps ?? null, seconds: rx.seconds ?? null };
  }
  switch (rx.kind) {
    case 'reps': {
      const v = schemeValue(it, set);
      let text = '';
      if (typeof v === 'number') text = `${v} ${v === 1 ? 'rep' : 'reps'}${side}`;
      else if (typeof v === 'string' && v.trim()) text = RANGE_ONLY.test(v) ? `${v.trim()} reps${side}` : `${v.trim()}${side && !/side/i.test(v) ? side : ''}`;
      return { ...base, kind: 'reps', text, reps: v };
    }
    case 'time': {
      const sec = seconds ?? rx.seconds ?? null;
      const range = seconds == null && typeof rx.reps === 'string' && RANGE_ONLY.test(rx.reps) && /[–-]/.test(rx.reps);
      const text = range ? `${String(rx.reps).trim()} sec${side}` : sec != null ? `${fmtSeconds(sec)}${side}` : '';
      return { ...base, kind: 'time', text, seconds: sec };
    }
    case 'distance': {
      const r = rx.reps;
      const text = typeof r === 'string' && /\d/.test(r) && /\bm\b/.test(r) ? r.trim() : rx.distance_m != null ? `${rx.distance_m} m${side}` : '';
      return { ...base, kind: 'distance', text };
    }
    case 'calories':
      return { ...base, kind: 'calories', text: rx.calories != null ? `${rx.calories} cal${side}` : '' };
    default:
      return { ...base, kind: (rx as any).kind, text: '' };
  }
}

function fingerprintOf(steps: SessionStep[]): string {
  let h = 5381;
  const s = steps.map((x) => `${x.id}|${x.durationSec ?? ''}`).join(';');
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${COMPILER_VERSION}-${steps.length}-${(h >>> 0).toString(36)}`;
}

/* ------------------------------------------------------------------ compiler */

interface Draft extends Omit<SessionStep, 'index'> {}

export function compile(workout: V3Workout): SessionPlan {
  const sections: SessionSection[] = [];
  const steps: Draft[] = [];
  const blocks = [...(workout.blocks ?? [])].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0));
  const blockCount = blocks.length;
  const usedIds = new Set<string>();
  const secId = (raw: string) => {
    let id = raw || 'b';
    let n = 2;
    while (usedIds.has(id)) id = `${raw}_${n++}`;
    usedIds.add(id);
    return id;
  };

  const push = (d: Draft) => steps.push(d);
  let pairLetters = 0; // same lettering as the Cart (utils/v3CartFormat.cartBlocks): A, B, C … per grouped superset

  const blank = (section: number, sid: string, type: StepType, phase: string, o: Partial<Draft> = {}): Draft => ({
    id: `${sid}:r${o.round ?? 0}:i${o.itemIndex ?? 0}:s${o.set ?? 0}:${phase}`,
    type,
    advance: type === 'work' || type === 'ready' || type === 'checklist' || type === 'finish' ? 'user' : 'timer',
    section,
    round: null,
    rounds: null,
    itemIndex: null,
    set: null,
    sets: null,
    side: null,
    durationSec: null,
    timerStart: null,
    target: null,
    labels: { position: '', group: null, phase: null },
    rest: null,
    countsAsWork: false,
    ...o,
  });

  /* ---------------- warm-up */
  const wu = workout.warmup;
  if (wu && ((wu.items && wu.items.length) || wu.guidance)) {
    const s = sections.length;
    const sid = secId('warmup');
    sections.push(section(s, sid, 'warmup', { title: 'Warm-up', label: 'Warm-up', warmupItems: wu.items ?? [], guidance: wu.guidance ?? null, minutes: wu.minutes ?? null, estSec: Math.round((wu.minutes ?? 5) * 60) }));
    push(blank(s, sid, 'checklist', 'check', { labels: { position: 'Warm-up', group: null, phase: null } }));
  }

  /* ---------------- main blocks */
  blocks.forEach((b, bi) => {
    const s = sections.length;
    const sid = secId(b.block_id || `b${b.sequence ?? bi + 1}`);
    const kind = b.rest?.kind ?? 'between_sets';
    const sec = section(s, sid, 'block', {
      blockNumber: bi + 1,
      blockCount,
      title: b.title,
      label: `Block ${bi + 1} of ${blockCount}`,
      structure: b.structure,
      restKind: kind,
      rest: b.rest ?? null,
      interval: b.interval ?? null,
      rounds: b.rounds ?? null,
      items: b.items,
      guidance: b.instructions ?? null,
      clock: CLOCK_KINDS.has(kind),
    });
    sections.push(sec);
    const start = steps.length;
    const letter = b.structure === 'superset' && b.items.length > 1 ? String.fromCharCode(65 + (pairLetters++ % 26)) : 'A';
    compileBlock(b, s, sid, sec.label, letter, blank, push);
    sec.estSec = steps.slice(start).reduce((n, x) => n + estOf(x), 0);
  });

  /* ---------------- cool-down: not part of the Guided Session (founder pass, Oct 2026). The last set finishes the
     workout; the workout's cool-down guidance stays on the envelope (Cart) but no screen is compiled for it. */
  const cd = INCLUDE_COOLDOWN ? workout.cooldown : null;
  if (cd && cd.guidance) {
    const s = sections.length;
    const sid = secId('cooldown');
    sections.push(section(s, sid, 'cooldown', { title: 'Cool-down', label: 'Cool-down', guidance: cd.guidance, minutes: cd.minutes ?? null, estSec: Math.round((cd.minutes ?? 3) * 60) }));
    push(blank(s, sid, 'checklist', 'check', { labels: { position: 'Cool-down', group: null, phase: null } }));
  }

  /* ---------------- finish */
  const lastSection = Math.max(0, sections.length - 1);
  push(blank(lastSection, 'finish', 'finish', 'finish', { labels: { position: 'Finish', group: null, phase: null } }));

  const out: SessionStep[] = steps.map((d, index) => ({ ...d, index }));
  // section boundaries
  sections.forEach((sct) => {
    const idx = out.filter((x) => x.section === sct.index && x.type !== 'finish').map((x) => x.index);
    sct.firstStep = idx.length ? idx[0] : out.length - 1;
    sct.lastStep = idx.length ? idx[idx.length - 1] : out.length - 1;
  });
  const ids = new Set<string>();
  for (const st of out) {
    if (ids.has(st.id)) throw new Error(`v3Session.compile: duplicate step id ${st.id}`);
    ids.add(st.id);
  }
  return {
    compilerVersion: COMPILER_VERSION,
    workoutId: workout.workout_id ?? '',
    workoutVersion: workout.version ?? 1,
    direction: workout.direction,
    fingerprint: fingerprintOf(out),
    sections,
    steps: out,
    totalEstSec: sections.reduce((n, x) => n + x.estSec, 0),
    workSteps: out.filter((x) => x.countsAsWork).length,
  };
}

function section(index: number, id: string, kind: SessionSection['kind'], o: Partial<SessionSection>): SessionSection {
  return {
    id,
    kind,
    blockNumber: null,
    blockCount: 0,
    title: '',
    label: '',
    structure: kind,
    restKind: null,
    rest: null,
    interval: null,
    rounds: null,
    items: [],
    warmupItems: [],
    guidance: null,
    minutes: null,
    clock: false,
    firstStep: 0,
    lastStep: 0,
    estSec: 0,
    ...o,
    index,
  } as SessionSection & { index: number };
}

/** Estimated seconds of one step (progress / "time left" only; never drives timing). */
export function estStepSec(x: Pick<SessionStep, 'type' | 'durationSec'>): number {
  return estOf(x as Draft);
}

function estOf(x: Pick<Draft, 'type' | 'durationSec'>): number {
  if (x.type === 'work') return x.durationSec ?? EST_SET_SEC;
  if (x.type === 'ready' || x.type === 'checklist' || x.type === 'finish') return 0;
  return x.durationSec ?? 0;
}

type Blank = (section: number, sid: string, type: StepType, phase: string, o?: Partial<Draft>) => Draft;

function compileBlock(b: V3Block, s: number, sid: string, label: string, letter: string, blank: Blank, push: (d: Draft) => void) {
  const rest = b.rest;
  const kind = rest?.kind ?? 'between_sets';
  const items = b.items ?? [];
  const full = !!rest?.full_recovery;
  const reason = (rest?.reason ?? null) as 'power' | 'heavy' | null;
  const restMeta = (source: RestSource) => ({ fullRecovery: source === 'interval' || source === 'round_interval' ? false : full, reason: full ? reason : null, source });

  /** One user-paced work step (a time hold becomes a manual countdown; a per-side hold becomes two chained halves). */
  const work = (it: V3Item, i: number, set: number | null, sets: number | null, o: Partial<Draft>, start: 'manual' | 'ontap' = 'manual') => {
    const rx = it.prescription;
    const base: Partial<Draft> = { itemIndex: i, set, sets, countsAsWork: true, ...o };
    if (rx.kind === 'time' && rx.seconds) {
      if (rx.per_side) {
        push(blank(s, sid, 'work', 'work-L', { ...base, side: 'left', durationSec: rx.seconds, timerStart: start, target: targetFor(it, set, o.round ?? null), labels: { ...(o.labels as any), phase: 'Left side' } }));
        push(blank(s, sid, 'work', 'work-R', { ...base, side: 'right', durationSec: rx.seconds, timerStart: 'auto', target: targetFor(it, set, o.round ?? null), labels: { ...(o.labels as any), phase: 'Right side' } }));
        return;
      }
      push(blank(s, sid, 'work', 'work', { ...base, durationSec: rx.seconds, timerStart: start, target: targetFor(it, set, o.round ?? null) }));
      return;
    }
    push(blank(s, sid, 'work', 'work', { ...base, target: targetFor(it, set, o.round ?? null) }));
  };

  const ready = () => push(blank(s, sid, 'ready', 'ready', { labels: { position: label, group: null, phase: null } }));

  switch (kind) {
    case 'after_pair':
    case 'after_round': {
      const R = b.rounds ?? items[0]?.prescription.sets ?? 1;
      const trans = rest?.transition_sec ?? 0;
      for (let r = 1; r <= R; r++) {
        const inRound = items
          .map((it, i) => ({ it, i }))
          .filter(({ it }) => {
            const rs = it.prescription.direction_fields?.rounds;
            return it.role === 'anchor' || !Array.isArray(rs) || rs.includes(r);
          });
        inRound.forEach(({ it, i }, k) => {
          const group =
            kind === 'after_pair'
              ? `${letter}${k + 1}`
              : it.role === 'anchor'
                ? 'Anchor'
                : `Station ${k + 1} of ${inRound.length}`;
          // a timed station right after a tapped station starts on that tap (no transition in between); never after a timer
          work(it, i, r, R, { round: r, rounds: R, labels: { position: `Round ${r} of ${R}`, group, phase: null } }, k > 0 && !(trans > 0) ? 'ontap' : 'manual');
          if (k < inRound.length - 1 && trans > 0) {
            const nx = inRound[k + 1];
            push(blank(s, sid, 'transition', `trans${k + 1}`, { round: r, rounds: R, itemIndex: nx.i, durationSec: trans, target: targetFor(nx.it, r, r), labels: { position: `Round ${r} of ${R}`, group: null, phase: 'Move' } }));
          }
        });
        if (r < R && rest?.seconds) {
          push(blank(s, sid, 'rest', 'rest', { round: r, rounds: R, durationSec: rest.seconds, rest: restMeta(kind === 'after_pair' ? 'pair' : 'round'), labels: { position: `After round ${r} of ${R}`, group: null, phase: 'Rest' } }));
        }
      }
      return;
    }

    case 'interval': {
      const iv = b.interval ?? {};
      const rec = rest?.recovery_sec ?? iv.recovery_sec ?? 0;
      ready();
      if (Array.isArray(iv.steps_sec) && iv.steps_sec.length) {
        const st = iv.steps_sec;
        const it = items[0];
        st.forEach((sec, k) => {
          push(blank(s, sid, 'timed_work', 'work', { itemIndex: 0, set: k + 1, sets: st.length, durationSec: sec, target: targetFor(it, null, null, sec), countsAsWork: true, labels: { position: `Step ${k + 1} of ${st.length}`, group: null, phase: 'WORK' } }));
          if (k < st.length - 1 && rec > 0)
            push(blank(s, sid, 'recovery', 'rec', { set: k + 1, sets: st.length, durationSec: rec, rest: restMeta('interval'), labels: { position: `Step ${k + 1} of ${st.length}`, group: null, phase: 'EASY' } }));
        });
        return;
      }
      const R = b.rounds ?? iv.rounds ?? items[0]?.prescription.sets ?? 1;
      const W = rest?.work_sec ?? iv.work_sec ?? items[0]?.prescription.seconds ?? 0;
      if (b.structure === 'timed_circuit') {
        const roundRest = rest?.seconds ?? 0;
        const n = items.length;
        for (let r = 1; r <= R; r++) {
          items.forEach((it, i) => {
            push(blank(s, sid, 'timed_work', 'work', { round: r, rounds: R, itemIndex: i, set: r, sets: R, durationSec: W, target: targetFor(it, r, r, W), countsAsWork: true, labels: { position: `Round ${r} of ${R}`, group: `Station ${i + 1} of ${n}`, phase: 'WORK' } }));
            const lastOverall = r === R && i === n - 1;
            if (lastOverall) return;
            const roundEnd = i === n - 1;
            const dur = rec + (roundEnd ? roundRest : 0);
            if (dur > 0)
              push(blank(s, sid, 'recovery', roundEnd ? 'roundrest' : 'rec', { round: r, rounds: R, itemIndex: i, set: r, sets: R, durationSec: dur, rest: restMeta(roundEnd ? 'round_interval' : 'interval'), labels: { position: `Round ${r} of ${R}`, group: roundEnd ? null : `Station ${i + 1} of ${n}`, phase: roundEnd ? 'ROUND REST' : 'EASY' } }));
          });
        }
        return;
      }
      // intervals / finisher: one bout per round; alternate items if more than one is listed
      const n = Math.max(1, items.length);
      for (let r = 1; r <= R; r++) {
        const i = (r - 1) % n;
        push(blank(s, sid, 'timed_work', 'work', { round: r, rounds: R, itemIndex: i, set: r, sets: R, durationSec: W, target: targetFor(items[i], r, r, W), countsAsWork: true, labels: { position: `Interval ${r} of ${R}`, group: n > 1 ? items[i].exercise.name : null, phase: 'WORK' } }));
        if (r < R && rec > 0)
          push(blank(s, sid, 'recovery', 'rec', { round: r, rounds: R, itemIndex: i, set: r, sets: R, durationSec: rec, rest: restMeta('interval'), labels: { position: `Interval ${r} of ${R}`, group: null, phase: 'EASY' } }));
      }
      return;
    }

    case 'emom': {
      const n = Math.max(1, items.length);
      const M = b.interval?.minutes ?? (b.rounds ?? 1) * n;
      ready();
      for (let m = 1; m <= M; m++) {
        const i = (m - 1) % n;
        // founder pass, Oct 2026: 15 s to switch stations between minutes (the next minute starts by itself; Pause / +time for more)
        if (m > 1) push(blank(s, sid, 'transition', 'switch', { round: Math.ceil(m / n), rounds: Math.ceil(M / n), itemIndex: i, set: m, sets: M, durationSec: EMOM_SWITCH_SEC, target: targetFor(items[i], null, null), labels: { position: `Minute ${m} of ${M}`, group: `Station ${i + 1} of ${n}`, phase: 'Switch' } }));
        push(blank(s, sid, 'emom_minute', 'emom', { round: Math.ceil(m / n), rounds: Math.ceil(M / n), itemIndex: i, set: m, sets: M, durationSec: 60, target: targetFor(items[i], null, null), countsAsWork: true, labels: { position: `Minute ${m} of ${M}`, group: `Station ${i + 1} of ${n}`, phase: 'WORK' } }));
      }
      return;
    }

    case 'continuous': {
      const it = items[0];
      if (!it) return;
      ready();
      const sec = it.prescription.seconds ?? 0;
      push(blank(s, sid, 'timed_work', 'work', { itemIndex: 0, set: 1, sets: 1, durationSec: sec, target: targetFor(it, null, null, sec), countsAsWork: true, labels: { position: `${fmtSeconds(sec)} steady`, group: null, phase: 'STEADY' } }));
      return;
    }

    case 'self_paced': {
      const rungs = Math.max(0, ...items.map((it) => (Array.isArray(it.prescription.reps_scheme) ? it.prescription.reps_scheme.length : 1)));
      for (let k = 1; k <= rungs; k++) {
        items.forEach((it, i) => {
          work(it, i, k, rungs, { round: k, rounds: rungs, labels: { position: `Rung ${k} of ${rungs}`, group: items.length > 1 ? `Exercise ${i + 1} of ${items.length}` : null, phase: null } });
        });
      }
      return;
    }

    case 'between_sets':
    default: {
      items.forEach((it, i) => {
        const sets = it.prescription.sets ?? b.rounds ?? 1;
        for (let set = 1; set <= sets; set++) {
          work(it, i, set, sets, { labels: { position: `Set ${set} of ${sets}`, group: items.length > 1 ? it.exercise.name : null, phase: null } });
          const isLast = i === items.length - 1 && set === sets;
          const r = it.prescription.rest_sec;
          if (!isLast && r && r > 0) {
            push(blank(s, sid, 'rest', 'rest', { itemIndex: i, set, sets, durationSec: r, rest: restMeta('set'), labels: { position: `After set ${set} of ${sets}`, group: null, phase: 'Rest' } }));
          }
        }
      });
      return;
    }
  }
}
