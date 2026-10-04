/**
 * Session engine + record: timer lifecycle (foreground, background, pause, skip, +time, chained drift), persistence (exact
 * restore, fingerprint mismatch, stale), completion guard, weight logging honesty, notifications.
 * Run: node --import tsx --test utils/v3Session/engine.test.ts
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { V3Block, V3Envelope, V3Workout } from '../v3Api';
import { compile } from './compile';
import { SessionState, canFinish, currentStep, elapsedMs, initialState, reduce, remainingMs, resolve, stepEndAt } from './engine';
import {
  STALE_MS, buildCompletion, carriedLoad, defaultReps, endEarly, expireIfStale, homeSession, isLoadLoggable, newRecord, performanceFromLogs,
  restore, shouldRetry, afterFailure, timerNotice, upsertLog, withState,
} from './record';
import type { SessionPlan } from './types';

const FIX: { tag: string; workout: V3Workout }[] = JSON.parse(readFileSync(join(__dirname, '__fixtures__', 'envelopes.json'), 'utf8'));
const find = (pred: (w: V3Workout, b: V3Block) => boolean) => {
  for (const f of FIX) for (const b of f.workout.blocks) if (pred(f.workout, b)) return { w: f.workout, b };
  throw new Error('no fixture');
};
const env = (w: V3Workout): V3Envelope => ({ schema_version: 'v3.0', status: 'ok', outcome: 'valid', conflict: null, workout: w });
const T0 = 1_800_000_000_000;
const S = 1000;

/** Jump the cursor to the first step of block b (skipping everything before), for focused scenarios. */
function atBlock(plan: SessionPlan, w: V3Workout, b: V3Block, now = T0): SessionState {
  let s = initialState(plan, now);
  const sec = plan.sections.filter((x) => x.kind === 'block')[w.blocks.indexOf(b)];
  while (currentStep(plan, s).section < sec.index) s = reduce(plan, s, { type: 'skip_block' }, now);
  return s;
}
const cur = (p: SessionPlan, s: SessionState) => currentStep(p, s);

/* ---------------------------------------------------------------- straight sets */

test('straight sets: complete → rest counts down from timestamps → lands on the next set waiting (never auto-starts)', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'straight' && b.items[0].prescription.kind === 'reps' && (b.items[0].prescription.sets ?? 0) >= 3);
  const p = compile(w);
  let s = atBlock(p, w, b);
  assert.equal(cur(p, s).type, 'work');
  assert.equal(s.stepStartedAt, null);
  s = reduce(p, s, { type: 'complete' }, T0 + 30 * S);
  assert.equal(cur(p, s).type, 'rest');
  const R = b.items[0].prescription.rest_sec!;
  assert.equal(remainingMs(p, s, T0 + 40 * S), (R - 10) * S);
  // backgrounded well past the rest
  s = resolve(p, s, T0 + (30 + R + 500) * S);
  assert.equal(cur(p, s).type, 'work');
  assert.equal(cur(p, s).set, 2);
  assert.equal(s.stepStartedAt, null);
  assert.equal(s.enteredAt, T0 + (30 + R) * S); // entered when the rest actually ended
});

test('skip rest, +15/+30, pause freezes the countdown and elapsed time', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'straight' && (b.items[0].prescription.rest_sec ?? 0) >= 60 && b.items[0].prescription.kind === 'reps');
  const p = compile(w);
  let s = reduce(p, atBlock(p, w, b), { type: 'complete' }, T0);
  const R = b.items[0].prescription.rest_sec!;
  s = reduce(p, s, { type: 'add_time', seconds: 30 }, T0 + 5 * S);
  s = reduce(p, s, { type: 'add_time', seconds: 15 }, T0 + 6 * S);
  assert.equal(stepEndAt(p, s), T0 + (R + 45) * S);
  s = reduce(p, s, { type: 'pause' }, T0 + 10 * S);
  const frozen = remainingMs(p, s, T0 + 10 * S);
  assert.equal(remainingMs(p, s, T0 + 999 * S), frozen);
  assert.equal(resolve(p, s, T0 + 9999 * S).cursor, s.cursor); // paused: nothing advances
  const el = elapsedMs(s, T0 + 500 * S);
  s = reduce(p, s, { type: 'resume' }, T0 + 110 * S);
  assert.equal(remainingMs(p, s, T0 + 110 * S), frozen);
  assert.equal(elapsedMs(s, T0 + 110 * S), el);
  s = reduce(p, s, { type: 'skip' }, T0 + 111 * S);
  assert.equal(cur(p, s).type, 'work');
  assert.equal(s.status[p.steps[s.cursor - 1].id], 'skipped');
});

test('the last set of a block goes straight to the next block (no trailing rest)', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'straight' && w.blocks.indexOf(b) < w.blocks.length - 1 && b.items[0].prescription.kind === 'reps');
  const p = compile(w);
  let s = atBlock(p, w, b);
  const sets = b.items[0].prescription.sets!;
  for (let k = 0; k < sets; k++) {
    s = reduce(p, s, { type: 'complete' }, T0);
    if (k < sets - 1) s = reduce(p, s, { type: 'skip' }, T0);
  }
  assert.ok(cur(p, s).type === 'finish' || cur(p, s).section !== p.steps[s.cursor - 1].section); // left the block
  assert.notEqual(cur(p, s).type, 'rest');
});

test('skipping a set drops its following rest; skip exercise never produces a double rest', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'superset' && b.items.every((i) => i.prescription.kind === 'reps'));
  const p = compile(w);
  let s = atBlock(p, w, b);
  s = reduce(p, s, { type: 'complete' }, T0); // A1
  assert.equal(cur(p, s).type, 'transition');
  s = reduce(p, s, { type: 'complete' }, T0 + 5 * S); // "I'm ready"
  assert.equal(cur(p, s).labels.group?.slice(1), '2');
  s = reduce(p, s, { type: 'skip_exercise' }, T0 + 6 * S); // skip A2 for the rest of the block
  // round 1 rest is dropped (A2 skipped); next is A1 round 2 with no transition after it
  assert.equal(cur(p, s).type, 'work');
  assert.equal(cur(p, s).round, 2);
  s = reduce(p, s, { type: 'complete' }, T0 + 7 * S);
  assert.notEqual(cur(p, s).type, 'transition');
});

test('back undoes the last set', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'straight' && b.items[0].prescription.kind === 'reps');
  const p = compile(w);
  let s = atBlock(p, w, b);
  const first = s.cursor;
  s = reduce(p, s, { type: 'complete' }, T0);
  s = reduce(p, s, { type: 'back' }, T0 + S);
  assert.equal(s.cursor, first);
  assert.equal(s.status[p.steps[first].id], undefined);
  assert.equal(s.stepStartedAt, null);
});

/* ---------------------------------------------------------------- holds */

test('time hold: manual start, then the per-side chain and rest run by themselves', () => {
  const w: any = JSON.parse(JSON.stringify(find((w, b) => w.direction === 'strength' && b.structure === 'straight').w));
  w.blocks[0].items = [{ ...w.blocks[0].items[0], prescription: { ...w.blocks[0].items[0].prescription, kind: 'time', seconds: 30, reps: '15–30', per_side: true, sets: 2, rest_sec: 45, reps_scheme: null } }];
  w.blocks[0].rest = { kind: 'between_sets', seconds: null, transition_sec: null, full_recovery: false, reason: null };
  const p = compile(w);
  let s = atBlock(p, w, w.blocks[0]);
  assert.equal(cur(p, s).side, 'left');
  assert.equal(resolve(p, s, T0 + 999 * S).cursor, s.cursor); // never starts on its own
  s = reduce(p, s, { type: 'start_timer' }, T0);
  s = resolve(p, s, T0 + 30 * S + 40 * S); // left ends at 30, right runs 30..60, rest 60..105
  assert.equal(cur(p, s).type, 'rest');
  assert.equal(remainingMs(p, s, T0 + 70 * S), 35 * S);
  s = resolve(p, s, T0 + 200 * S);
  assert.equal(cur(p, s).side, 'left');
  assert.equal(cur(p, s).set, 2);
  assert.equal(s.stepStartedAt, null);
});

/* ---------------------------------------------------------------- clock blocks */

test('intervals: Ready gates the clock; chained bouts use expected ends (no drift) through a long background', () => {
  const { w, b } = find((w, b) => b.structure === 'intervals' && b.rest!.kind === 'interval' && (b.rounds ?? 0) >= 6);
  const p = compile(w);
  let s = atBlock(p, w, b);
  assert.equal(cur(p, s).type, 'ready');
  assert.equal(resolve(p, s, T0 + 3600 * S).cursor, s.cursor); // Ready never starts itself
  const W = b.rest!.work_sec!, E = b.rest!.recovery_sec!;
  s = reduce(p, s, { type: 'complete' }, T0);
  // many small foreground resolves with jitter, vs one big jump: same position, same remaining time
  let a = s;
  for (let t = 0; t < (W + E) * 3 + 7; t += 0.37) a = resolve(p, a, T0 + Math.round(t * S));
  const at = T0 + ((W + E) * 3 + 7) * S;
  const bb = resolve(p, s, at);
  assert.equal(a.cursor, bb.cursor);
  assert.equal(remainingMs(p, a, at), remainingMs(p, bb, at));
  assert.equal(cur(p, bb).labels.position, `Interval 4 of ${b.rounds}`);
  assert.equal(cur(p, bb).type, 'timed_work');
  assert.equal(remainingMs(p, bb, at), (W - 7) * S);
  // the whole block elapses while locked: land after it, waiting
  const end = resolve(p, s, T0 + ((W + E) * b.rounds! + 999) * S);
  assert.ok(cur(p, end).type === 'finish' || cur(p, end).section !== cur(p, s).section); // the block is over
});

test('EMOM: each minute runs out on its own, then a 15 s switch, then the next minute starts by itself (founder pass, Oct 2026)', () => {
  const { w, b } = find((w, b) => b.structure === 'emom' && b.items.length > 1);
  const p = compile(w);
  let s = reduce(p, atBlock(p, w, b), { type: 'complete' }, T0); // Ready → minute 1, running
  assert.equal(cur(p, s).labels.position.startsWith('Minute 1'), true);
  assert.equal(remainingMs(p, s, T0 + 20 * S), 40 * S);
  s = resolve(p, s, T0 + 60 * S); // the switch to minute 2's station
  assert.equal(cur(p, s).type, 'transition');
  assert.equal(cur(p, s).itemIndex, 1);
  assert.equal(remainingMs(p, s, T0 + 60 * S), 15 * S);
  s = reduce(p, s, { type: 'pause' }, T0 + 65 * S); // more switching time
  s = reduce(p, s, { type: 'resume' }, T0 + 125 * S);
  assert.equal(remainingMs(p, s, T0 + 125 * S), 10 * S);
  s = resolve(p, s, T0 + 135 * S); // minute 2 starts by itself
  assert.equal(cur(p, s).type, 'emom_minute');
  assert.equal(cur(p, s).labels.position.startsWith('Minute 2'), true);
  assert.equal(remainingMs(p, s, T0 + 135 * S), 60 * S);
  s = resolve(p, s, T0 + (135 + 75 + 75) * S); // background: minutes and switches chain on expected ends
  assert.equal(cur(p, s).labels.position.startsWith('Minute 4'), true);
  assert.equal(cur(p, s).type, 'emom_minute');
});

test('timed circuit: station recovery and stacked round rest in real time', () => {
  const { w, b } = find((w, b) => b.structure === 'timed_circuit');
  const p = compile(w);
  const n = b.items.length, W = b.rest!.work_sec!, E = b.rest!.recovery_sec!, RR = b.rest!.seconds!;
  let s = reduce(p, atBlock(p, w, b), { type: 'complete' }, T0);
  const roundTime = n * W + (n - 1) * E;
  s = resolve(p, s, T0 + (roundTime + 1) * S);
  assert.equal(cur(p, s).labels.phase, 'ROUND REST');
  assert.equal(remainingMs(p, s, T0 + (roundTime + 1) * S), (E + RR - 1) * S);
  s = resolve(p, s, T0 + (roundTime + E + RR) * S);
  assert.equal(cur(p, s).labels.position, `Round 2 of ${b.rounds}`);
  assert.equal(cur(p, s).labels.group, `Station 1 of ${n}`);
});

test('continuous: one timer; skip block leaves it', () => {
  const { w, b } = find((w, b) => b.structure === 'continuous');
  const p = compile(w);
  let s = reduce(p, atBlock(p, w, b), { type: 'complete' }, T0);
  assert.equal(cur(p, s).type, 'timed_work');
  assert.equal(remainingMs(p, s, T0 + 60 * S), (b.items[0].prescription.seconds! - 60) * S);
  s = reduce(p, s, { type: 'skip_block' }, T0 + 61 * S);
  assert.ok(cur(p, s).type === 'finish' || cur(p, s).section !== p.steps[s.cursor - 1].section); // left the block
});

/* ---------------------------------------------------------------- completion guard (F5) */

function runToEnd(p: SessionPlan, s: SessionState, doFirst: boolean): SessionState {
  let n = s, first = doFirst;
  for (let g = 0; g < 5000 && cur(p, n).type !== 'finish'; g++) {
    const st = cur(p, n);
    if (first && st.countsAsWork && st.type === 'work') { n = reduce(p, n, { type: 'complete' }, T0); first = false; continue; }
    n = reduce(p, n, { type: 'skip_block' }, T0);
  }
  return n;
}

test('finish: skips allowed, one main set is enough; zero main work cannot finish; reaching the end never completes by itself', () => {
  const { w } = find((w) => w.direction === 'strength');
  const p = compile(w);
  const none = runToEnd(p, initialState(p, T0), false);
  assert.equal(cur(p, none).type, 'finish');
  assert.equal(canFinish(p, none), false);
  const one = runToEnd(p, initialState(p, T0), true);
  assert.equal(canFinish(p, one), true);
  // nothing is "completed" by arriving: the record stays active until an explicit Finish builds the completion
  const { record } = newRecord(env(w), T0, '2026-10-05', 's1');
  const r2 = withState(record, p, one, T0);
  assert.equal(r2.status, 'active');
  assert.equal(r2.completion, null);
});

/* ---------------------------------------------------------------- persistence */

test('exact restore after force-close, including a timer that ended while the app was closed', () => {
  const { w, b } = find((w, b) => w.direction === 'athletic' && b.structure === 'superset' && b.type === 'primary');
  const { record, plan } = newRecord(env(w), T0, '2026-10-05', 's1');
  let s = atBlock(plan, w, b);
  s = reduce(plan, s, { type: 'complete' }, T0); // heavy set → 45 s transition
  const saved = JSON.parse(JSON.stringify(withState(record, plan, s, T0)));
  const early = restore(saved, T0 + 10 * S);
  assert.equal(early.exact, true);
  assert.equal(cur(early.plan, early.state).type, 'transition');
  assert.equal(remainingMs(early.plan, early.state, T0 + 10 * S), 35 * S);
  const late = restore(saved, T0 + 600 * S);
  assert.equal(cur(late.plan, late.state).type, 'work'); // the explosive partner, waiting
  assert.ok(late.plan.sections[cur(late.plan, late.state).section].items[cur(late.plan, late.state).itemIndex!].quality_stop);
});

test('fingerprint mismatch: same step id if it exists, else the start of the same block', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'straight' && w.blocks.indexOf(b) > 0 && b.items[0].prescription.kind === 'reps');
  const { record, plan } = newRecord(env(w), T0, '2026-10-05', 's1');
  let s = reduce(plan, atBlock(plan, w, b), { type: 'complete' }, T0);
  s = reduce(plan, s, { type: 'skip' }, T0);
  const saved = { ...withState(record, plan, s, T0), fingerprint: 'old-compiler' };
  const r = restore(saved, T0 + S);
  assert.equal(r.exact, false);
  assert.equal(cur(r.plan, r.state).id, saved.cursorStepId);
  const gone = restore({ ...saved, cursorStepId: 'no-such-step' }, T0 + S);
  assert.equal(gone.plan.sections[cur(gone.plan, gone.state).section].id, saved.sectionId);
  assert.equal(cur(gone.plan, gone.state).index, gone.plan.sections[cur(gone.plan, gone.state).section].firstStep);
});

test('offline restore needs nothing but the stored record (envelope inside)', () => {
  const { w } = find((w) => w.direction === 'sweat');
  const { record, plan, state } = newRecord(env(w), T0, '2026-10-05', 's1');
  const blob = JSON.stringify(withState(record, plan, state, T0));
  const r = restore(JSON.parse(blob), T0 + 5 * S);
  assert.equal(r.plan.fingerprint, record.fingerprint);
});

test('stale 12-hour session is abandoned; Home precedence continue > done', () => {
  const { w } = find((w) => w.direction === 'strength');
  const { record, plan, state } = newRecord(env(w), T0, '2026-10-05', 's1');
  assert.equal(homeSession(record, '2026-10-05', T0 + S)?.mode, 'continue');
  assert.equal(expireIfStale(record, T0 + STALE_MS - S).status, 'active');
  const ex = expireIfStale(record, T0 + STALE_MS + S);
  assert.equal(ex.status, 'abandoned');
  assert.equal(homeSession(ex, '2026-10-05', T0 + STALE_MS + S), null);
  const ended = endEarly(record, T0 + S);
  assert.equal(homeSession(ended, '2026-10-05', T0 + S), null);
  const c = { ...record, status: 'completing' as const, completion: buildCompletion(record, plan, state, T0 + 50 * 60 * S, '2026-10-05') };
  assert.deepEqual([homeSession(c, '2026-10-05', T0)?.mode, (homeSession(c, '2026-10-05', T0) as any).syncing], ['done', true]);
  assert.equal(homeSession({ ...c, status: 'completed' }, '2026-10-06', T0), null); // Done is for today only
});

test('completion retry: backoff on failure, immediate on foreground / Home; nothing after server ack', () => {
  const { w } = find((w) => w.direction === 'strength');
  const { record, plan, state } = newRecord(env(w), T0, '2026-10-05', 's1');
  let c = buildCompletion(record, plan, state, T0, '2026-10-05');
  const r = { ...record, status: 'completing' as const, completion: c };
  assert.equal(shouldRetry(r, T0, 'timer'), true);
  c = afterFailure(c, T0, 'network');
  const r2 = { ...r, completion: c };
  assert.equal(shouldRetry(r2, T0 + 10 * S, 'timer'), false);
  assert.equal(shouldRetry(r2, T0 + 31 * S, 'timer'), true);
  assert.equal(shouldRetry(r2, T0 + 10 * S, 'foreground'), true);
  assert.equal(shouldRetry({ ...r2, status: 'completed' }, T0 + 99 * S, 'foreground'), false);
  c = afterFailure(afterFailure(c, T0, 'x'), T0, 'y');
  assert.equal(c.nextAttemptAt - T0, 600_000);
});

/* ---------------------------------------------------------------- weight logging (F2) */

test('logging is offered only on loaded Strength / Athletic strength rows', () => {
  const s = find((w, b) => w.direction === 'strength' && b.items[0].exercise.equipment === 'barbell' && b.items[0].prescription.kind === 'reps');
  assert.equal(isLoadLoggable('strength', s.b.items[0]), true);
  const sc = find((w, b) => b.items.some((i) => !!i.prescription.scaling));
  assert.equal(isLoadLoggable(sc.w.direction, sc.b.items.find((i) => !!i.prescription.scaling)!), false);
  const pw = find((w, b) => w.direction === 'athletic' && !!b.items[0].quality_stop);
  assert.equal(isLoadLoggable('athletic', pw.b.items[0]), false);
  const ast = find((w, b) => w.direction === 'athletic' && b.type === 'strength' && b.items[0].exercise.equipment === 'barbell');
  assert.equal(isLoadLoggable('athletic', ast.b.items[0]), true);
  const sw = find((w, b) => w.direction === 'sweat' && b.items.some((i) => i.exercise.equipment === 'dumbbells'));
  assert.equal(isLoadLoggable('sweat', sw.b.items.find((i) => i.exercise.equipment === 'dumbbells')!), false);
});

test('untouched logging sends no performance; only completed sets with real loads are sent', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'straight' && (b.items[0].prescription.sets ?? 0) >= 3 && isLoadLoggable('strength', b.items[0]));
  const { record, plan } = newRecord(env(w), T0, '2026-10-05', 's1');
  let s = atBlock(plan, w, b);
  s = reduce(plan, s, { type: 'complete' }, T0);
  s = reduce(plan, s, { type: 'skip' }, T0);
  s = reduce(plan, s, { type: 'complete' }, T0);
  // never touched: nothing
  assert.deepEqual(performanceFromLogs(plan, s, record.logs), []);
  assert.deepEqual(buildCompletion(record, plan, s, T0 + 60 * S, '2026-10-05').payload.performance, []);
  // set 1 logged, set 2 logged, set 3 logged but never completed, a zero load: only 1 and 2 go out
  const id = b.items[0].item_id;
  let r = upsertLog(record, id, { set: 1, load: 135, unit: 'lb', reps: 5 });
  r = upsertLog(r, id, { set: 2, load: 135, unit: 'lb', reps: 4 });
  r = upsertLog(r, id, { set: 3, load: 140, unit: 'lb', reps: 5 });
  assert.equal(carriedLoad(r.logs[id], 'lb'), 140);
  assert.equal(carriedLoad(r.logs[id], 'kg'), null);
  const perf = performanceFromLogs(plan, s, r.logs);
  assert.deepEqual(perf, [{ item_id: id, exercise_id: b.items[0].exercise.id, sets: [{ reps: 5, load: 135, unit: 'lb' }, { reps: 4, load: 135, unit: 'lb' }] }]);
  const zero = upsertLog(record, id, { set: 1, load: 0, unit: 'lb', reps: 5 });
  assert.deepEqual(performanceFromLogs(plan, s, zero.logs), []);
});

test('default reps: scheme value, single number, low end of a range, previous logged reps', () => {
  assert.equal(defaultReps({ target: { reps: 7 } } as any, undefined), 7);
  assert.equal(defaultReps({ target: { reps: '8–10' } } as any, undefined), 8);
  assert.equal(defaultReps({ target: { reps: '8–10' } } as any, [{ set: 1, load: 50, unit: 'lb', reps: 10 }]), 10);
});

/* ---------------------------------------------------------------- notifications (F3) */

test('notification: one notice for the next moment the athlete is needed; none while paused or for a user step', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'straight' && (b.items[0].prescription.rest_sec ?? 0) >= 60 && b.items[0].prescription.kind === 'reps' && (b.items[0].prescription.sets ?? 0) >= 2);
  const p = compile(w);
  let s = atBlock(p, w, b);
  assert.equal(timerNotice(p, s, T0), null); // waiting for a set: nothing to schedule
  s = reduce(p, s, { type: 'complete' }, T0);
  const R = b.items[0].prescription.rest_sec!;
  const n = timerNotice(p, s, T0 + S)!;
  assert.equal(n.at, T0 + R * S);
  assert.equal(n.title, 'Rest over');
  assert.match(n.body, /Set 2 of/);
  // extension moves it; pause removes it; skip removes it
  const ext = reduce(p, s, { type: 'add_time', seconds: 30 }, T0 + 2 * S);
  assert.equal(timerNotice(p, ext, T0 + 2 * S)!.at, T0 + (R + 30) * S);
  assert.equal(timerNotice(p, reduce(p, s, { type: 'pause' }, T0 + 3 * S), T0 + 3 * S), null);
  assert.equal(timerNotice(p, reduce(p, s, { type: 'skip' }, T0 + 3 * S), T0 + 3 * S), null);
  // under 5 s left: not worth a notification
  assert.equal(timerNotice(p, s, T0 + (R - 3) * S), null);
});

test('notification: an interval block schedules one notice at the block end, not one per bout', () => {
  const { w, b } = find((w, b) => b.structure === 'intervals' && (b.rounds ?? 0) >= 6 && w.blocks.indexOf(b) < w.blocks.length - 1);
  const p = compile(w);
  const s = reduce(p, atBlock(p, w, b), { type: 'complete' }, T0);
  const W = b.rest!.work_sec!, E = b.rest!.recovery_sec!, R = b.rounds!;
  const n = timerNotice(p, s, T0 + S)!;
  assert.equal(n.at, T0 + (R * W + (R - 1) * E) * S);
  assert.match(n.title, /complete/);
});
