/**
 * Session Plan invariants: every rule the compiler promises, checked against the envelope it came from.
 * Used by compile.test.ts over the committed fixtures and by scripts/sweep.ts over a full production-path dump.
 * Returns human-readable violations (empty = the plan executes the workout exactly as the rest contract says).
 */
import type { V3Workout } from '../v3Api';
import type { SessionPlan, SessionStep } from './types';

const RESTLIKE = new Set(['rest', 'recovery', 'transition']);

export function checkPlan(w: V3Workout, plan: SessionPlan): string[] {
  const errs: string[] = [];
  const err = (m: string) => errs.push(`${w.workout_id}: ${m}`);
  const S = plan.steps;

  if (!S.length || S[S.length - 1].type !== 'finish') err('plan must end with finish');
  if (plan.workSteps < 1) err('no main work steps');
  if (new Set(S.map((s) => s.id)).size !== S.length) err('duplicate step ids');

  // no back-to-back recovery of any kind; no recovery right before a Ready card or at a block end
  for (let i = 1; i < S.length; i++) {
    const a = S[i - 1], b = S[i];
    if (RESTLIKE.has(a.type) && RESTLIKE.has(b.type) && a.section === b.section) err(`consecutive ${a.type} → ${b.type} at ${a.id}`);
    if (RESTLIKE.has(a.type) && a.section !== b.section) err(`${a.type} at the end of a block (${a.id})`);
    if (a.type === 'transition' && b.type !== 'work' && !(a.labels.phase === 'Switch' && b.type === 'emom_minute')) err(`transition not followed by work (${a.id})`);
  }

  for (const st of S) {
    if ((st.type === 'work' || st.type === 'timed_work' || st.type === 'emom_minute') && !(st.target && st.target.text)) err(`empty target at ${st.id}`);
    if (st.advance === 'timer' && !(st.durationSec && st.durationSec > 0)) err(`timer step without duration ${st.id}`);
  }

  // warm-up / cool-down
  const hasWu = !!(w.warmup && ((w.warmup.items && w.warmup.items.length) || w.warmup.guidance));
  if (hasWu !== plan.sections.some((s) => s.kind === 'warmup')) err('warm-up presence mismatch');
  if (plan.sections.some((s) => s.kind === 'cooldown')) err('cool-down compiled (removed from the Guided Session, Oct 2026)');

  const blockSecs = plan.sections.filter((s) => s.kind === 'block');
  if (blockSecs.length !== w.blocks.length) err('block count mismatch');

  blockSecs.forEach((sec, bi) => {
    const b = [...w.blocks].sort((x, y) => (x.sequence ?? 0) - (y.sequence ?? 0))[bi];
    const st = S.filter((x) => x.section === sec.index);
    const works = st.filter((x) => x.type === 'work' || x.type === 'timed_work' || x.type === 'emom_minute');
    const rests = st.filter((x) => x.type === 'rest');
    const recs = st.filter((x) => x.type === 'recovery');
    const trans = st.filter((x) => x.type === 'transition');
    const readies = st.filter((x) => x.type === 'ready');
    const rest = b.rest!;
    const tag = `${b.block_id}(${b.structure}/${rest?.kind})`;
    if (!rest) { err(`${tag} missing rest contract`); return; }
    const clock = rest.kind === 'interval' || rest.kind === 'emom' || rest.kind === 'continuous';
    if (clock !== (readies.length === 1 && st[0].type === 'ready')) err(`${tag} Ready card rule`);
    if (!clock && readies.length) err(`${tag} unexpected Ready`);
    // the row rest_sec is used only by between_sets
    const usesRow = (x: SessionStep) => x.rest?.source === 'set';
    if (rest.kind !== 'between_sets' && rests.some(usesRow)) err(`${tag} grouped block used a row rest`);
    // full-recovery label comes only from the structured flag
    for (const r of rests) if (r.rest!.fullRecovery !== !!rest.full_recovery) err(`${tag} full_recovery label mismatch`);
    for (const r of recs) if (r.rest!.fullRecovery) err(`${tag} interval recovery labelled full recovery`);
    const items = b.items;
    const perSideTime = (i: number) => items[i].prescription.kind === 'time' && items[i].prescription.per_side && !!items[i].prescription.seconds;
    const stepsPerSet = (i: number) => (perSideTime(i) ? 2 : 1);

    switch (rest.kind) {
      case 'between_sets': {
        let expWork = 0, expRest = 0;
        items.forEach((it, i) => {
          const sets = it.prescription.sets ?? b.rounds ?? 1;
          expWork += sets * stepsPerSet(i);
          const r = it.prescription.rest_sec ?? 0;
          const isLastItem = i === items.length - 1;
          if (r > 0) expRest += isLastItem ? sets - 1 : sets;
          // scheme targets
          const sch = it.prescription.reps_scheme;
          if (Array.isArray(sch) && it.prescription.kind === 'reps') {
            works.filter((x) => x.itemIndex === i).forEach((x) => { if (x.target!.reps !== sch[(x.set ?? 1) - 1]) err(`${tag} set ${x.set} target ${x.target!.reps} != scheme ${sch[(x.set ?? 1) - 1]}`); });
          }
        });
        if (works.length !== expWork) err(`${tag} work ${works.length} != ${expWork}`);
        if (rests.length !== expRest) err(`${tag} rests ${rests.length} != ${expRest}`);
        for (const r of rests) {
          const prev = S[r.index - 1];
          if (prev.type !== 'work') err(`${tag} rest not after a set`);
          else if (r.durationSec !== items[prev.itemIndex!].prescription.rest_sec) err(`${tag} rest ${r.durationSec} != row rest_sec`);
        }
        if (trans.length || recs.length) err(`${tag} unexpected transition/recovery`);
        break;
      }
      case 'after_pair':
      case 'after_round': {
        const R = b.rounds ?? 1;
        if (rests.length !== (rest.seconds ? R - 1 : 0)) err(`${tag} round rests ${rests.length} != ${R - 1}`);
        for (const r of rests) if (r.durationSec !== rest.seconds) err(`${tag} rest ${r.durationSec} != block seconds ${rest.seconds}`);
        for (const t of trans) if (t.durationSec !== rest.transition_sec) err(`${tag} transition ${t.durationSec} != ${rest.transition_sec}`);
        for (let r = 1; r <= R; r++) {
          const inRound = items.map((it, i) => ({ it, i })).filter(({ it }) => {
            const rs = it.prescription.direction_fields?.rounds;
            return it.role === 'anchor' || !Array.isArray(rs) || rs.includes(r);
          });
          const rw = works.filter((x) => x.round === r);
          const expect = inRound.reduce((n, { i }) => n + stepsPerSet(i), 0);
          if (rw.length !== expect) err(`${tag} round ${r} work ${rw.length} != ${expect}`);
          const order = [...new Set(rw.map((x) => x.itemIndex))];
          if (order.join(',') !== inRound.map((x) => x.i).join(',')) err(`${tag} round ${r} order ${order} != ${inRound.map((x) => x.i)}`);
          const anchor = items.findIndex((it) => it.role === 'anchor');
          if (anchor >= 0 && rw[0]?.itemIndex !== anchor) err(`${tag} round ${r} does not start with the anchor`);
          const rt = trans.filter((x) => x.round === r).length;
          if (rt !== (rest.transition_sec ? inRound.length - 1 : 0)) err(`${tag} round ${r} transitions ${rt}`);
          // the round rest sits right after the round's last station
          const rr = rests.find((x) => x.round === r);
          if (rr && S[rr.index - 1] !== rw[rw.length - 1]) err(`${tag} round ${r} rest not after the last station`);
        }
        if (recs.length) err(`${tag} unexpected recovery`);
        break;
      }
      case 'interval': {
        const iv = b.interval ?? {};
        const rec = rest.recovery_sec ?? iv.recovery_sec ?? 0;
        if (Array.isArray(iv.steps_sec) && iv.steps_sec.length) {
          if (works.map((x) => x.durationSec).join(',') !== iv.steps_sec.join(',')) err(`${tag} pyramid steps`);
          if (recs.length !== (rec ? iv.steps_sec.length - 1 : 0)) err(`${tag} pyramid recoveries`);
          break;
        }
        const R = b.rounds ?? iv.rounds ?? 1;
        const W = rest.work_sec!;
        for (const x of works) if (x.durationSec !== W) err(`${tag} bout ${x.durationSec} != work_sec ${W}`);
        if (b.structure === 'timed_circuit') {
          const n = items.length;
          if (works.length !== R * n) err(`${tag} stations ${works.length} != ${R * n}`);
          if (recs.length !== R * n - 1) err(`${tag} recoveries ${recs.length} != ${R * n - 1}`);
          const roundRests = recs.filter((x) => x.rest!.source === 'round_interval');
          if (roundRests.length !== R - 1) err(`${tag} round rests ${roundRests.length}`);
          for (const x of roundRests) if (x.durationSec !== rec + (rest.seconds ?? 0)) err(`${tag} round rest ${x.durationSec} != ${rec}+${rest.seconds}`);
          for (const x of recs.filter((y) => y.rest!.source === 'interval')) if (x.durationSec !== rec) err(`${tag} station recovery ${x.durationSec}`);
          // D1: the station's own dose must agree with the block
          for (const it of items) if (it.prescription.seconds !== W) err(`${tag} D1 station ${it.exercise.name} ${it.prescription.seconds}s != work_sec ${W}`);
        } else {
          if (works.length !== R) err(`${tag} bouts ${works.length} != ${R}`);
          if (recs.length !== (rec ? R - 1 : 0)) err(`${tag} recoveries ${recs.length} != ${R - 1}`);
          for (const x of recs) if (x.durationSec !== rec) err(`${tag} recovery ${x.durationSec} != ${rec}`);
        }
        if (rests.length || trans.length) err(`${tag} unexpected rest/transition`);
        break;
      }
      case 'emom': {
        const M = b.interval?.minutes ?? 0;
        if (works.length !== M || works.some((x) => x.type !== 'emom_minute' || x.durationSec !== 60)) err(`${tag} emom minutes ${works.length} != ${M}`);
        works.forEach((x, k) => { if (x.itemIndex !== k % items.length) err(`${tag} emom station order`); });
        if (rests.length || recs.length) err(`${tag} emom has rest steps`);
        // one 15 s switch before every minute but the first (founder pass, Oct 2026)
        if (trans.length !== Math.max(0, M - 1) || trans.some((t) => t.durationSec !== 15 || t.labels.phase !== 'Switch')) err(`${tag} emom switches ${trans.length} != ${M - 1}`);
        break;
      }
      case 'continuous': {
        if (works.length !== 1 || works[0].durationSec !== items[0].prescription.seconds) err(`${tag} continuous`);
        if (rests.length || recs.length || trans.length) err(`${tag} continuous has rest steps`);
        break;
      }
      case 'self_paced': {
        const rungs = Math.max(...items.map((it) => (Array.isArray(it.prescription.reps_scheme) ? it.prescription.reps_scheme.length : 1)));
        if (works.length !== rungs * items.length) err(`${tag} ladder work ${works.length}`);
        works.forEach((x) => {
          const sch = items[x.itemIndex!].prescription.reps_scheme as any;
          if (Array.isArray(sch) && x.target!.reps !== sch[(x.round ?? 1) - 1]) err(`${tag} ladder rung target`);
        });
        if (rests.length || recs.length || trans.length) err(`${tag} ladder has timers`);
        break;
      }
      default:
        err(`${tag} unknown rest kind`);
    }
  });
  return errs;
}
