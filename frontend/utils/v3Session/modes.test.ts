/**
 * Guided ↔ Overview over one SessionState: navigation never completes, completed sets / logs / timers survive switching,
 * clock blocks can only start from Ready, ontap holds, cool-down + Finish merge, coaching lines and semantic position.
 * Run: node --import tsx --test utils/v3Session/modes.test.ts
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { V3Block, V3Envelope, V3Workout } from '../v3Api';
import { compile } from './compile';
import { SessionState, canFinish, currentStep, finishState, initialState, itemEntryStep, reduce, remainingMs, resolve, stepEndAt } from './engine';
import { overviewModel } from './overview';
import { edgePlan, effortChipOf, methodOf, stepView } from './viewModel';
import { exerciseCues } from '../v3ExerciseCues';
import { V3_EXERCISE_THUMBS } from '../v3ExerciseThumbs';
import { coachLine, position, structureExplanation, toneOf, whereAmI } from './coach';
import { newRecord, restore, upsertLog, withState } from './record';
import { parseRecord } from './record';
import type { SessionPlan } from './types';

const FIX: { tag: string; workout: V3Workout }[] = JSON.parse(readFileSync(join(__dirname, '__fixtures__', 'envelopes.json'), 'utf8'));
const find = (pred: (w: V3Workout, b: V3Block) => boolean) => {
  for (const f of FIX) for (const b of f.workout.blocks) if (pred(f.workout, b)) return { w: f.workout, b };
  throw new Error('no fixture');
};
const env = (w: V3Workout): V3Envelope => ({ schema_version: 'v3.0', status: 'ok', outcome: 'valid', conflict: null, workout: w });
const T0 = 1_800_000_000_000, S = 1000;
const cur = (p: SessionPlan, s: SessionState) => currentStep(p, s);
function atBlock(p: SessionPlan, w: V3Workout, b: V3Block): SessionState {
  let s = initialState(p, T0);
  const sec = p.sections.filter((x) => x.kind === 'block')[w.blocks.indexOf(b)];
  while (cur(p, s).section < sec.index) s = reduce(p, s, { type: 'skip_block' }, T0);
  return s;
}

/* ---------------------------------------------------------------- Overview: navigation vs completion */

test('Overview: jumping around never completes or skips anything; the cursor lands on the next open set', () => {
  const { w } = find((w) => w.direction === 'strength' && w.blocks.length >= 3);
  const p = compile(w);
  let s = initialState(p, T0);
  const m0 = overviewModel(p, s, w);
  const lastRow = m0.blocks[m0.blocks.length - 1].rows[0];
  s = reduce(p, s, { type: 'jump', index: lastRow.entryStep! }, T0);
  assert.equal(cur(p, s).itemIndex, lastRow.itemIndex);
  assert.equal(cur(p, s).section, lastRow.sectionIndex);
  assert.deepEqual(Object.keys(s.status), []);
  assert.equal(s.stepStartedAt, null);
  // back to the first exercise, still nothing completed
  const first = m0.blocks[0].rows[0];
  s = reduce(p, s, { type: 'jump', index: first.entryStep! }, T0);
  assert.equal(cur(p, s).index, first.entryStep);
  assert.deepEqual(Object.keys(s.status), []);
  assert.equal(overviewModel(p, s, w).blocks[0].rows[0].state, 'current');
});

test('Overview: complete sets from the sheet; Guided opens at the next set; back in Overview the count is right', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'straight' && (b.items[0].prescription.sets ?? 0) >= 4 && b.items[0].prescription.kind === 'reps');
  const p = compile(w);
  let s = atBlock(p, w, b);
  const bi = w.blocks.indexOf(b);
  let m = overviewModel(p, s, w);
  const row = m.blocks[bi].rows[0];
  assert.equal(row.setsTotal, b.items[0].prescription.sets);
  // two sets from Overview (no rest timer is started: self-paced)
  s = reduce(p, s, { type: 'complete_step', index: row.nextOpen! }, T0);
  assert.equal(cur(p, s).type, 'rest'); // it was the current step, so the normal rest follows (Guided semantics)
  s = reduce(p, s, { type: 'skip' }, T0 + S); // Overview presents no rest; skipping it lands on set 2
  m = overviewModel(p, s, w);
  const row2 = m.blocks[bi].rows[0];
  assert.equal(row2.setsDone, 1);
  s = reduce(p, s, { type: 'complete_step', index: row2.nextOpen! }, T0 + 2 * S);
  s = reduce(p, s, { type: 'skip' }, T0 + 3 * S);
  m = overviewModel(p, s, w);
  assert.equal(m.blocks[bi].rows[0].progress, `2 / ${b.items[0].prescription.sets}`);
  // Guided view of the same state: Set 3 of N
  assert.equal(cur(p, s).set, 3);
  assert.equal(position(p, s).local?.includes('Set 3 of'), true);
  // marking a set on a different exercise leaves the cursor alone and starts no timer
  const other = m.blocks.find((x) => x.sectionIndex !== m.blocks[bi].sectionIndex && !x.clock)!.rows[0];
  const before = s.cursor;
  s = reduce(p, s, { type: 'complete_step', index: other.nextOpen! }, T0 + 4 * S);
  assert.equal(s.cursor, before);
  assert.equal(s.stepStartedAt, null);
  assert.equal(overviewModel(p, s, w).blocks.find((x) => x.sectionIndex === other.sectionIndex)!.rows[0].setsDone, 1);
  // undo
  s = reduce(p, s, { type: 'uncomplete_step', index: other.nextOpen! }, T0 + 5 * S);
  assert.equal(overviewModel(p, s, w).blocks.find((x) => x.sectionIndex === other.sectionIndex)!.rows[0].setsDone, 0);
});

test('switching mid-rest keeps the timer; switching mid-interval keeps the clock; logs survive; force-close restores the mode', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'straight' && (b.items[0].prescription.rest_sec ?? 0) >= 60 && b.items[0].prescription.kind === 'reps');
  const { record, plan: p } = newRecord(env(w), T0, '2026-10-05', 's1', 'overview');
  let s = atBlock(p, w, b);
  let r = upsertLog(record, b.items[0].item_id, { set: 1, load: 135, unit: 'lb', reps: 5 });
  s = reduce(p, s, { type: 'complete' }, T0);
  const end = stepEndAt(p, s)!;
  // "switching modes" is only a flag on the record; the engine state is untouched
  r = { ...withState(r, p, s, T0 + 5 * S), mode: 'guided' };
  assert.equal(stepEndAt(p, r.state), end);
  r = { ...r, mode: 'overview' };
  assert.equal(remainingMs(p, r.state, T0 + 20 * S), end - (T0 + 20 * S));
  assert.equal(r.logs[b.items[0].item_id][0].load, 135);
  // force-close and restore: same mode, same timer
  const back = parseRecord(JSON.stringify(r))!;
  assert.equal(back.mode, 'overview');
  const rs = restore(back, T0 + 30 * S);
  assert.equal(remainingMs(rs.plan, rs.state, T0 + 30 * S), end - (T0 + 30 * S));
  assert.equal(rs.exact, true);
});

test('an active interval keeps running while Overview is shown; Overview cannot start a clock block except from Ready', () => {
  const { w, b } = find((w, b) => b.structure === 'intervals' && b.rest!.kind === 'interval' && (b.rounds ?? 0) >= 4);
  const p = compile(w);
  const bi = w.blocks.indexOf(b);
  let s = atBlock(p, w, b);
  const m = overviewModel(p, s, w);
  assert.equal(m.blocks[bi].clock, true);
  // jumping "into" a clock block lands on its Ready card, clock not started
  const bout = p.steps.find((x) => x.section === m.blocks[bi].sectionIndex && x.type === 'timed_work')!;
  s = reduce(p, s, { type: 'jump', index: bout.index }, T0);
  assert.equal(cur(p, s).type, 'ready');
  assert.equal(s.stepStartedAt, null);
  // Start guided timer = the Ready tap; the clock then runs in real time whatever mode is shown
  s = reduce(p, s, { type: 'complete' }, T0);
  const W = b.rest!.work_sec!, E = b.rest!.recovery_sec!;
  s = resolve(p, s, T0 + (W + E + 5) * S);
  assert.equal(cur(p, s).labels.position, `Interval 2 of ${b.rounds}`);
  assert.equal(overviewModel(p, s, w).blocks[bi].clockProgress!.done, 1);
  // complete_step on a bout is ignored (bouts belong to the clock)
  const s2 = reduce(p, s, { type: 'complete_step', index: bout.index }, T0 + (W + E + 6) * S);
  assert.equal(s2.status[bout.id], 'done'); // already done by the clock; unchanged
});

test('itemEntryStep: next open set of an exercise; all done → its first set', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'straight' && (b.items[0].prescription.sets ?? 0) >= 2);
  const p = compile(w);
  let s = atBlock(p, w, b);
  const sec = cur(p, s).section;
  const e0 = itemEntryStep(p, s, sec, 0)!;
  assert.equal(p.steps[e0].set, 1);
  s = reduce(p, s, { type: 'complete_step', index: e0 }, T0);
  assert.equal(p.steps[itemEntryStep(p, s, sec, 0)!].set, 2);
});

/* ---------------------------------------------------------------- tap burden: ontap holds, cool-down + finish */

test('a timed station right after a tapped station starts on that tap; after a rest or a restore it waits', () => {
  const { w, b } = find((w, b) => b.structure === 'circuit' && b.rest!.kind === 'after_round' && b.items.some((i, k) => k > 0 && i.prescription.kind === 'time' && !!i.prescription.seconds) && b.items[0].prescription.kind !== 'time');
  const p = compile(w);
  let s = atBlock(p, w, b);
  const k = b.items.findIndex((i, j) => j > 0 && i.prescription.kind === 'time');
  while (!(cur(p, s).type === 'work' && cur(p, s).itemIndex === k)) s = reduce(p, s, { type: 'complete' }, T0);
  assert.equal(cur(p, s).timerStart, 'ontap');
  assert.notEqual(s.stepStartedAt, null); // started by the tap on the previous station
  // restored from a saved record: never running
  const saved = { ...s, stepStartedAt: null };
  const again = resolve(p, saved, T0 + S);
  assert.equal(again.stepStartedAt, null);
  // the first station of a round is never ontap
  const firstStation = p.steps.find((x) => x.section === cur(p, s).section && x.type === 'work' && x.itemIndex === 0)!;
  assert.notEqual(firstStation.timerStart, 'ontap');
});

test('a straight-set hold after a rest still waits for Start (no accidental timer)', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'straight' && b.items[0].prescription.kind === 'time' && (b.items[0].prescription.sets ?? 0) >= 2);
  const p = compile(w);
  let s = atBlock(p, w, b);
  s = reduce(p, s, { type: 'start_timer' }, T0);
  s = resolve(p, s, T0 + (b.items[0].prescription.seconds! + b.items[0].prescription.rest_sec! + 5) * S);
  assert.equal(cur(p, s).set, 2);
  assert.equal(s.stepStartedAt, null);
});

test('no cool-down screen (founder pass, Oct 2026): the last block is followed by Finish, even when the workout has cool-down guidance', () => {
  const { w } = find((w, b) => !!w.cooldown?.guidance && w.direction === 'sweat' && b.structure === 'circuit');
  const p = compile(w);
  assert.ok(!p.sections.some((x) => x.kind === 'cooldown'));
  const lastBlock = p.sections.filter((x) => x.kind === 'block').slice(-1)[0];
  assert.equal(p.steps[lastBlock.lastStep + 1].type, 'finish');
  // without any main work, Finish is not offered
  let none = initialState(p, T0);
  while (cur(p, none).type !== 'finish') none = reduce(p, none, { type: 'skip_block' }, T0);
  assert.equal(canFinish(p, none), false);
});

/* ---------------------------------------------------------------- coaching + position */

test('coaching: structure explanation once, heavy first set, last set, rest pacing, State tone', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'superset' && w.blocks.some((x) => x.type === 'main' && !!x.rest!.full_recovery && (x.items[0].prescription.sets ?? 0) >= 3));
  const p = compile(w);
  const main = w.blocks.find((x) => x.type === 'main' && !!x.rest!.full_recovery)!;
  let s = atBlock(p, w, main);
  const seen: string[] = [];
  const line1 = coachLine({ plan: p, state: s, now: T0, states: [], seen });
  assert.match(line1!.text, /Brace hard/);
  s = reduce(p, s, { type: 'complete' }, T0);
  const restLine = coachLine({ plan: p, state: s, now: T0 + S, states: [], seen });
  assert.match(restLine!.text, /Don't chase the clock/);
  const late = coachLine({ plan: p, state: s, now: stepEndAt(p, s)! - 8 * S, states: [], seen, loggedLoad: '135 lb' });
  assert.match(late!.text, /^Get set\. 135 lb/);
  // stressed tone changes the rest line
  assert.match(coachLine({ plan: p, state: s, now: T0 + S, states: ['stressed'], seen })!.text, /breathing/);
  assert.equal(toneOf(['amped']), 'assertive');
  // superset explanation once
  let ss = atBlock(p, w, b);
  const ex = coachLine({ plan: p, state: ss, now: T0, states: [], seen });
  assert.equal(ex!.kind, 'structure');
  assert.match(ex!.text, /^Superset/);
  const after = coachLine({ plan: p, state: ss, now: T0, states: [], seen: [ex!.key!] });
  assert.notEqual(after?.kind, 'structure');
  // last set of an exercise
  let ls = atBlock(p, w, main);
  const sets = main.items[0].prescription.sets!;
  for (let k = 1; k < sets; k++) { ls = reduce(p, ls, { type: 'complete' }, T0); ls = reduce(p, ls, { type: 'skip' }, T0); }
  assert.match(coachLine({ plan: p, state: ls, now: T0, states: [], seen })!.text, /Last one/);
});

test('coaching: every structure has an explanation; intervals and EMOM pacing', () => {
  for (const key of ['superset', 'circuit', 'anchor_circuit', 'timed_circuit', 'emom', 'intervals', 'continuous', 'pyramid', 'ladder']) {
    const f = FIX.find((x) => x.workout.blocks.some((bb) => bb.structure === key && (key !== 'superset' || x.workout.direction === 'strength')));
    if (!f) continue;
    const p = compile(f.workout);
    const sec = p.sections.find((x) => x.structure === key)!;
    assert.ok(structureExplanation(sec, p.direction), key);
  }
  const { w, b } = find((w, b) => b.structure === 'intervals' && b.rest!.kind === 'interval' && (b.rounds ?? 0) >= 3);
  const p = compile(w);
  let s = reduce(p, atBlock(p, w, b), { type: 'complete' }, T0);
  const W = b.rest!.work_sec!, E = b.rest!.recovery_sec!;
  s = resolve(p, s, T0 + (W + 2) * S);
  assert.equal(cur(p, s).type, 'recovery');
  assert.match(coachLine({ plan: p, state: s, now: T0 + (W + 2) * S, states: [], seen: ['intervals'] })!.text, /breathing/);
  assert.match(coachLine({ plan: p, state: s, now: T0 + (W + E - 5) * S, states: [], seen: ['intervals'] })!.text, /Next effort in \d+ seconds|Last effort/);
});

test('semantic position per structure', () => {
  const st = find((w, b) => w.direction === 'strength' && b.structure === 'straight' && b.items.length === 1 && (b.items[0].prescription.sets ?? 0) >= 3);
  const p = compile(st.w);
  const s = atBlock(p, st.w, st.b);
  const pos = position(p, s);
  assert.match(pos.block, /^BLOCK \d+ OF \d+$/);
  assert.match(pos.local!, /^Set 1 of \d+$/);
  assert.deepEqual(pos.dots, { total: st.b.items[0].prescription.sets, done: 0 });
  const c = find((w, b) => b.structure === 'circuit' && b.rest!.kind === 'after_round');
  const pc = compile(c.w);
  assert.match(position(pc, atBlock(pc, c.w, c.b)).local!, /^Round 1 of \d+ · Station 1 of \d+$/);
  const e = find((w, b) => b.structure === 'emom');
  const pe = compile(e.w);
  assert.match(position(pe, reduce(pe, atBlock(pe, e.w, e.b), { type: 'complete' }, T0)).local!, /^Minute 1 of \d+$/);
});

/* ---------------------------------------------------------------- post-workout additions */

test('after: only real numbers are sent, never estimates; retry rules; wearable overlap window', async () => {
  const { afterPayload, newAfter, shouldSendAfter, withAfter } = await import('./record');
  const { afterFromWearable, overlaps, wearableAvailable } = await import('./wearable');
  const { w } = find((w) => w.direction === 'strength');
  const { record } = newRecord(env(w), T0, '2026-10-05', 's1');
  const done = { ...record, status: 'completed' as const };
  assert.equal(shouldSendAfter(done, T0, 'screen'), false); // nothing entered
  const a = withAfter(done, { fit_rating: 'just_right' }, T0);
  assert.deepEqual(afterPayload(a.after!), { fit_rating: 'just_right' });
  assert.equal(shouldSendAfter(a, T0, 'screen'), true);
  assert.equal(shouldSendAfter({ ...a, status: 'completing' }, T0, 'screen'), false); // only after the completion itself
  const m = withAfter(a, afterFromWearable({ calories: 310, avg_heart_rate: 142, max_heart_rate: null, steps: null, hrv_sdnn: null, workout_minutes: 40, matched_workout: true }), T0);
  assert.deepEqual(afterPayload(m.after!), { fit_rating: 'just_right', calories: 310, avg_heart_rate: 142, metrics_source: 'wearable' });
  assert.equal(JSON.stringify(newAfter(T0)).includes('"calories":null'), true);
  assert.equal(overlaps('2026-10-05T12:00:00Z', '2026-10-05T12:40:00Z', '2026-10-05T12:05:00Z', '2026-10-05T12:50:00Z'), true);
  assert.equal(overlaps('2026-10-05T09:00:00Z', '2026-10-05T09:40:00Z', '2026-10-05T12:05:00Z', '2026-10-05T12:50:00Z'), false);
  assert.equal(wearableAvailable(), false); // no native module here: a first-class state, nothing throws
});

/* ---------------------------------------------------------------- founder review: where am I */

test('whereAmI: block role + muscles + set + what is left; a rest describes the set it leads to; the finish empties it', () => {
  const { w } = find((w, b) => w.direction === 'strength' && b.type === 'main' && b.structure === 'straight' && (b.items[0].prescription.sets ?? 0) >= 3);
  const p = compile(w);
  const types = w.blocks.map((b) => b.type);
  let s = initialState(p, T0);
  // to the first main set
  while (cur(p, s).type !== 'work') s = reduce(p, s, { type: 'complete' }, T0);
  const a = whereAmI(p, s, T0, types);
  assert.equal(a.role, 'MAIN LIFT');
  assert.ok(a.muscles && a.muscles.length > 0, 'muscles from the exercise');
  assert.equal(a.exercise, w.blocks[0].items[0].exercise.name);
  assert.match(a.local ?? '', /^(Exercise \d of \d · )?Set 1 of \d/);
  assert.equal(a.block?.n, 1);
  assert.equal(a.segments.length, w.blocks.length);
  assert.ok(a.segments[0].current && a.segments[0].done === 0);
  const setsAtStart = a.left.sets;
  assert.ok(setsAtStart > 0 && a.left.minutes > 0 && a.left.exercises === w.blocks.reduce((n, b) => n + b.items.length, 0));
  // complete set 1 -> rest: the strip already reads Set 2, one set fewer left, same exercise
  s = reduce(p, s, { type: 'complete' }, T0 + 30 * S);
  assert.equal(cur(p, s).type, 'rest');
  const r = whereAmI(p, s, T0 + 31 * S, types);
  assert.match(r.local ?? '', /Set 2 of \d/);
  assert.equal(r.exercise, a.exercise);
  assert.equal(r.left.sets, setsAtStart - 1);
  assert.equal(r.dots?.done, 1);
  assert.ok(r.segments[0].done > 0 && r.segments[0].done < 1);
  // skip to the end: nothing left
  let guard = 0;
  while (cur(p, s).type !== 'finish' && guard++ < 50) s = reduce(p, s, { type: 'skip_block' }, T0 + 40 * S);
  const f = whereAmI(p, s, T0 + 41 * S, types);
  assert.equal(f.role, 'FINISH');
  assert.equal(f.left.sets, 0);
  assert.equal(f.left.exercises, 0);
});

test('whereAmI: clock blocks count intervals as exercises left, not sets; role comes from the block type', () => {
  const { w, b } = find((w, b) => w.direction === 'sweat' && b.structure === 'timed_circuit');
  const p = compile(w);
  const types = w.blocks.map((x) => x.type);
  const s = atBlock(p, w, b);
  const a = whereAmI(p, s, T0, types);
  assert.equal(a.role, 'PRIMARY');
  assert.ok(a.left.exercises >= b.items.length);
  assert.equal(a.left.sets, p.steps.filter((x) => x.type === 'work' && x.index >= s.cursor && x.side !== 'right').length);
});

/* ---------------------------------------------------------------- founder review round 3 */

test('All sets done: the remaining sets of the exercise count as done, its rests are not run, the next exercise is up', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'straight' && (b.items[0].prescription.sets ?? 0) >= 3 && !b.rest?.full_recovery && w.blocks[w.blocks.indexOf(b) + 1]?.structure === 'straight');
  const p = compile(w);
  let s = atBlock(p, w, b);
  while (cur(p, s).type !== 'work') s = reduce(p, s, { type: 'complete' }, T0);
  const first = cur(p, s);
  assert.equal(first.itemIndex, 0);
  s = reduce(p, s, { type: 'complete' }, T0 + 30 * S); // set 1 done -> rest
  s = reduce(p, s, { type: 'skip' }, T0 + 40 * S); // to set 2
  assert.equal(cur(p, s).set, 2);
  s = reduce(p, s, { type: 'complete_exercise' }, T0 + 50 * S);
  const mine = p.steps.filter((x) => x.section === first.section && x.itemIndex === 0);
  assert.ok(mine.filter((x) => x.type === 'work').every((x) => s.status[x.id] === 'done'), 'every set of the exercise is done');
  assert.ok(mine.filter((x) => x.type === 'rest').every((x) => s.status[x.id] === 'skipped' || s.status[x.id] === 'done'), 'no rest of it is left to run');
  const nx = cur(p, s);
  assert.equal(nx.section, first.section + 1, 'the next exercise (next block) is up');
  assert.equal(nx.type, 'work');
  assert.equal(s.stepStartedAt, null, 'nothing is counting down');
});

test('Superset: the move to A2 shows A2 itself (Complete set), the group strip names both members and the round; complete then complete lands on the rest', () => {
  const { w, b } = find((w, b) => b.structure === 'superset' && b.items.length === 2 && !!b.rest?.transition_sec);
  const p = compile(w);
  const types = w.blocks.map((x) => x.type);
  let s = atBlock(p, w, b);
  while (cur(p, s).type !== 'work') s = reduce(p, s, { type: 'complete' }, T0);
  s = reduce(p, s, { type: 'complete' }, T0 + 20 * S); // A1 done -> transition
  assert.equal(cur(p, s).type, 'transition');
  const v = stepView(p, s, T0 + 21 * S, { blockTypes: types });
  assert.ok(v.transitionToWork && v.transitionToWork.itemIndex === 1, 'the transition leads to A2');
  assert.equal(v.primary, 'Complete set');
  assert.equal(v.item?.item_id, b.items[1].item_id, 'the screen is A2');
  assert.equal(v.where.group?.kind, 'superset');
  assert.deepEqual(v.where.group!.items.map((g) => [g.marker, g.active, g.done]), [['A1', false, true], ['A2', true, false]]);
  assert.equal(v.where.local, 'Round 1 of 3'.replace('3', String(b.rounds)));
  s = reduce(p, s, { type: 'complete' }, T0 + 22 * S);
  s = reduce(p, s, { type: 'complete' }, T0 + 40 * S);
  assert.equal(cur(p, s).type, 'rest', 'after A2 the pair rest runs');
  const r = stepView(p, s, T0 + 41 * S, { blockTypes: types });
  assert.equal(r.where.local, `Round 2 of ${b.rounds}`);
  assert.deepEqual(r.where.group!.items.map((g) => [g.marker, g.active, g.done]), [['A1', true, false], ['A2', false, false]]);
});

test('Circuit: the group strip lists the stations in order; the local line is the round only', () => {
  const { w, b } = find((w, b) => b.structure === 'circuit' && b.items.length >= 3);
  const p = compile(w);
  let s = atBlock(p, w, b);
  while (cur(p, s).type !== 'work') s = reduce(p, s, { type: 'complete' }, T0);
  const v = stepView(p, s, T0, {});
  assert.equal(v.where.group?.kind, 'circuit');
  assert.equal(v.where.group!.items.length, b.items.length);
  assert.deepEqual(v.where.group!.items.map((g) => g.marker), b.items.map((_, i) => String(i + 1)));
  assert.match(v.where.local ?? '', /^Round 1 of \d+$/);
  assert.equal(v.setsLeftInExercise, 0, 'All sets done is not offered inside a circuit');
});

test('Warm-up screen: Strength guidance reads into cardio (your choice) · mobility · ramp-up sets of the first lift; Athletic lists its own items', () => {
  const ws = FIX.find((f) => f.workout.direction === 'strength' && /ramp-up sets of/.test(f.workout.warmup?.guidance ?? ''))!.workout;
  const p = compile(ws);
  const ep = edgePlan(p, p.sections[0]);
  assert.equal(ep.rows.length, 3);
  assert.equal(ep.rows[0].label, 'Easy cardio');
  assert.ok(ep.rows[0].choice && ep.choiceNote && /your call/.test(ep.choiceNote), 'unprescribed cardio is said to be the athlete\'s choice');
  assert.equal(ep.rows[1].label, 'Mobility');
  assert.equal(ep.rows[2].label, 'Ramp-up sets');
  assert.ok(ep.rows[2].name && ws.warmup!.guidance!.includes(ep.rows[2].name), 'the ramp-up lift is the one the guidance names');
  assert.ok(ep.rows[2].item, 'the lift resolves to its item (thumbnail)');
  const wa = FIX.find((f) => f.workout.direction === 'athletic' && (f.workout.warmup?.items.length ?? 0) > 0)!.workout;
  const pa = compile(wa);
  const ea = edgePlan(pa, pa.sections[0]);
  assert.equal(ea.rows.length, wa.warmup!.items.length);
  assert.equal(ea.choiceNote, null);
});

/* ---------------------------------------------------------------- founder review round 5 */

test('Set screen: effort is a chip (2 RIR / RPE), the set method is a chip (1.5 reps), two cues on every exercise', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'straight' && typeof b.items[0].prescription.rir === 'number');
  const p = compile(w);
  let s = atBlock(p, w, b);
  while (cur(p, s).type !== 'work') s = reduce(p, s, { type: 'complete' }, T0);
  const v = stepView(p, s, T0, {});
  assert.equal(v.effortChip?.label, `${b.items[0].prescription.rir} RIR`);
  assert.match(v.effortChip!.body, /in reserve/i);
  assert.equal(v.cues.length, 2, `two cues for ${b.items[0].exercise.id}`);
  assert.ok(v.cues.every((c) => c.length >= 10));
  // every library exercise has two cues
  for (const id of Object.keys(V3_EXERCISE_THUMBS)) assert.equal(exerciseCues({ exercise: { id }, cues: [] }).length, 2, id);
  // the set method comes from the prescription display
  assert.equal(methodOf('4 × 8–10 · 1.5 reps')?.label, '1.5 reps');
  assert.equal(methodOf('3 × 10 · 3 s eccentric')?.label, '3 s eccentric');
  assert.match(methodOf('3 × 10 · 3 s eccentric')!.body, /3-second/);
  assert.equal(methodOf('3 × 12 · drop set on the final set')?.label, 'Drop set · last set');
  assert.equal(methodOf('4 × 6'), null);
  assert.equal(effortChipOf(null, [7, 8])?.label, 'RPE 7–8');
  // bodyweight scaling becomes the first cue
  const sc = exerciseCues({ exercise: { id: 'pull_up' }, cues: [], prescription: { scaling: { short: 'Scale assistance or load', detail: 'Make it fit you. Too hard: use a band. Too easy: add weight with a belt. Pick the version that lets you land in the rep range.' } } });
  assert.equal(sc[0], 'Too hard: use a band. Too easy: add weight with a belt.');
  assert.equal(sc.length, 2);
});

/* ---------------------------------------------------------------- founder review 6 */

test('Last set: the primary reads Finish workout; one tap counts the set, closes the cool-down as skipped and can finish', async () => {
  const { isLastWork, finishFromLast, tally } = await import('./engine');
  let tested = 0;
  for (const dir of ['strength', 'sweat', 'athletic'] as const) {
    // a workout whose last piece of work is a user-paced set (a clock block ends by its clock: covered by auto-finish)
    const f = FIX.find((x) => {
      if (x.workout.direction !== dir || !x.workout.cooldown?.guidance) return false;
      const steps = compile(x.workout).steps.filter((st) => st.countsAsWork);
      return steps.length > 0 && steps[steps.length - 1].type === 'work';
    });
    if (!f) continue;
    const p = compile(f.workout);
    let s = initialState(p, T0);
    // walk with Complete / Start until the last user-paced work step
    let guard = 0;
    while (!isLastWork(p, s) && guard++ < 500) {
      const st = cur(p, s);
      if (st.type === 'finish') break;
      s = reduce(p, s, st.type === 'work' && st.durationSec && s.stepStartedAt == null ? { type: 'start_timer' } : st.type === 'emom_minute' || st.type === 'timed_work' || st.type === 'recovery' ? { type: 'skip' } : { type: 'complete' }, T0 + guard * S);
    }
    assert.ok(isLastWork(p, s), `${dir}: reached the last set`);
    const v = stepView(p, s, T0 + 999 * S, { canFinish: canFinish(p, s) });
    if (!(v.step.durationSec && s.stepStartedAt == null)) assert.equal(v.primary, 'Finish workout', `${dir}: last set button`);
    assert.equal(v.lastWork, true);
    const before = tally(p, s).workDone;
    const fin = finishFromLast(p, s, T0 + 1000 * S);
    assert.equal(cur(p, fin).type, 'finish');
    assert.ok(canFinish(p, fin));
    assert.equal(tally(p, fin).workDone, before + 1, `${dir}: the last set counts`);
    const cd = p.steps.find((x) => x.type === 'checklist' && p.sections[x.section].kind === 'cooldown');
    if (cd) assert.equal(fin.status[cd.id], 'skipped', `${dir}: the cool-down is closed as skipped, not done`);
    tested++;
  }
  assert.ok(tested >= 2, `directions covered: ${tested}`);
});

test('Not the last set: the button still reads Complete set and isLastWork is false', async () => {
  const { isLastWork } = await import('./engine');
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'straight' && (b.items[0].prescription.sets ?? 0) >= 3 && b.items[0].prescription.kind === 'reps');
  const p = compile(w);
  const s = atBlock(p, w, b);
  assert.equal(isLastWork(p, s), false);
  assert.notEqual(stepView(p, s, T0).primary, 'Finish workout');
});

test('Heart-rate overlay: always offered; the curve peaks at the real peak and averages near the real avg; without numbers it is a dim outline', async () => {
  const { heartRateCurve } = await import('./heartCurve');
  {
    const c = heartRateCurve(132, 171, 's_abc');
    assert.equal(c.real, true);
    assert.equal(Math.max(...c.points), 171);
    const mean = c.points.reduce((a: number, b: number) => a + b, 0) / c.points.length;
    assert.ok(Math.abs(mean - 132) <= 4, `mean ${mean}`);
    assert.deepEqual(heartRateCurve(132, 171, 's_abc').points, c.points, 'deterministic per session');
    assert.equal(heartRateCurve(null, null, 's_abc').real, false);
  }
});

/* ---------------------------------------------------------------- founder review 6b: coaching, rests, timers */

test('Coaching: every library exercise has setup / form / efficiency / fatigue; the two lines on screen never repeat; they change across sets', async () => {
  const { V3_COACHING, sameCue, cuePhase } = await import('../v3ExerciseCues');
  for (const id of Object.keys(V3_EXERCISE_THUMBS)) {
    const c = V3_COACHING[id];
    assert.ok(c && c.setup && c.form && c.efficiency && c.fatigue, `coaching for ${id}`);
    for (const line of [c.setup, c.form, c.efficiency, c.fatigue]) assert.ok(!/[—–]/.test(line), `no dashes: ${id}`);
    const first = exerciseCues({ exercise: { id }, cues: [] }, 2, 'first');
    const mid = exerciseCues({ exercise: { id }, cues: [] }, 2, 'middle');
    const last = exerciseCues({ exercise: { id }, cues: [] }, 2, 'last');
    for (const pair of [first, mid, last]) { assert.equal(pair.length, 2, id); assert.ok(!sameCue(pair[0], pair[1]), `${id}: ${pair.join(' | ')}`); }
    assert.notDeepEqual(first, last, `${id}: last set reads differently from the first`);
    assert.ok(/^Last (reps|seconds):/.test(last[0]), `${id}: last set leads with what breaks down`);
  }
  assert.deepEqual([cuePhase(0, 4), cuePhase(1, 4), cuePhase(2, 4), cuePhase(3, 4), cuePhase(0, 1)], ['first', 'middle', 'middle', 'last', 'first']);
  // the founder's example: hip thrust never shows two "upper back on the bench" lines
  const ht = exerciseCues({ exercise: { id: 'barbell_hip_thrust' }, cues: ['Upper back on the bench, feet flat.'] }, 2, 'first');
  assert.equal(ht.filter((x) => /bench/i.test(x)).length <= 1, true, ht.join(' | '));
  // timed work says seconds, not reps
  const plank = exerciseCues({ exercise: { id: Object.keys(V3_COACHING).find((k) => /plank/.test(k))! }, cues: [] }, 2, 'last', true);
  assert.ok(plank[0].startsWith('Last seconds:'), plank[0]);
});

test('Guided cues follow the set: set 1 setup, middle sets form + efficiency, last set the fatigue line; a rest previews the next set', async () => {
  const { cuesFor } = await import('./viewModel');
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'straight' && (b.items[0].prescription.sets ?? 0) >= 3 && b.items[0].prescription.kind === 'reps');
  const p = compile(w);
  let s = atBlock(p, w, b);
  const sets: string[][] = [];
  const it = cur(p, s).itemIndex, sec = cur(p, s).section;
  let rested: string | null = null;
  for (let guard = 0; guard < 40 && cur(p, s).itemIndex === it && cur(p, s).section === sec; guard++) {
    const st = cur(p, s);
    if (st.type === 'work') sets.push(stepView(p, s, T0).cues);
    if (st.type === 'rest' && rested == null) rested = stepView(p, s, T0).restCue;
    s = reduce(p, s, { type: 'complete' }, T0);
  }
  assert.ok(sets.length >= 3);
  assert.notDeepEqual(sets[0], sets[1]);
  assert.ok(/^Last (reps|seconds):/.test(sets[sets.length - 1][0]), sets[sets.length - 1][0]);
  assert.equal(rested, sets[1][0], 'the rest previews the first cue of the next set');
  assert.equal(cuesFor(p, null).length, 0);
});

test('Every rest: primary Start now; -15 s takes time off, never below zero', async () => {
  const { w, b } = find((w, b) => b.structure === 'straight' && (b.items[0].prescription.sets ?? 0) >= 2 && b.items[0].prescription.kind === 'reps');
  const p = compile(w);
  let s = atBlock(p, w, b);
  s = reduce(p, s, { type: 'complete' }, T0);
  assert.equal(cur(p, s).type, 'rest');
  assert.equal(stepView(p, s, T0).primary, 'Start now');
  const before = remainingMs(p, s, T0)!;
  const less = reduce(p, s, { type: 'add_time', seconds: -15 }, T0);
  assert.equal(remainingMs(p, less, T0), Math.max(0, before - 15000));
  const zero = reduce(p, reduce(p, reduce(p, s, { type: 'add_time', seconds: -30 }, T0), { type: 'add_time', seconds: -30 }, T0), { type: 'add_time', seconds: -30 }, T0);
  assert.ok((zero.extraSec) >= -(cur(p, s).durationSec ?? 0));
  for (const f of FIX.slice(0, 60)) {
    const pp = compile(f.workout);
    for (const st of pp.steps.filter((x) => x.type === 'rest')) {
      const ss = { ...initialState(pp, T0), cursor: st.index, stepStartedAt: T0 };
      assert.equal(stepView(pp, ss, T0).primary, 'Start now', `${f.tag} rest`);
    }
  }
});

test('Superset: All sets done finishes the whole group (both exercises, every round), no rests run; the group card says how', () => {
  const { w, b } = find((w, b) => b.structure === 'superset' && b.items.length === 2 && (b.items[0].prescription.sets ?? 0) >= 2);
  const p = compile(w);
  let s = atBlock(p, w, b);
  const v = stepView(p, s, T0);
  assert.equal(v.where.group?.kind, 'superset');
  assert.deepEqual(v.allDone?.scope, 'block');
  assert.ok(/go straight to A2/.test(v.where.group!.how), v.where.group!.how);
  assert.ok(v.where.group!.items.every((x) => !!x.rx));
  const sec = cur(p, s).section;
  s = reduce(p, s, { type: 'complete_block' }, T0);
  assert.notEqual(cur(p, s).section, sec);
  const steps = p.steps.filter((x) => x.section === sec);
  assert.ok(steps.filter((x) => x.countsAsWork).every((x) => s.status[x.id] === 'done'));
  assert.ok(steps.filter((x) => x.type === 'rest' || x.type === 'transition').every((x) => s.status[x.id] === 'skipped'));
});
