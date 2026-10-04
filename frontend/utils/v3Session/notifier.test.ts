/**
 * F3 timer notice: authorized vs unauthorized (never prompts), background timer, extension, skip, pause, foreground and
 * completion cancellation, one notice at a time.
 * Run: node --import tsx --test utils/v3Session/notifier.test.ts
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { V3Workout } from '../v3Api';
import { compile } from './compile';
import { currentStep, initialState, reduce } from './engine';
import { timerNotice } from './record';
import { NoticeApi, createTimerNotifier } from './notifier';

const FIX: { tag: string; workout: V3Workout }[] = JSON.parse(readFileSync(join(__dirname, '__fixtures__', 'envelopes.json'), 'utf8'));
const T0 = 1_800_000_000_000, S = 1000;

function fakeApi(allowed: boolean) {
  const scheduled = new Map<string, any>();
  let n = 0, prompts = 0;
  const api: NoticeApi & { prompts: () => number } = {
    isAllowed: async () => allowed,
    schedule: async (x) => { const id = `n${++n}`; scheduled.set(id, x); return id; },
    cancel: async (id) => { scheduled.delete(id); },
    listOurs: async () => [...scheduled.keys()],
    prompts: () => prompts,
  };
  return { api, scheduled };
}

function restingState() {
  const f = FIX.find((x) => x.workout.direction === 'strength' && x.workout.blocks.some((b) => b.structure === 'straight' && (b.items[0].prescription.rest_sec ?? 0) >= 60 && b.items[0].prescription.kind === 'reps'))!;
  const w = f.workout;
  const p = compile(w);
  let s = initialState(p, T0);
  for (let g = 0; g < 200 && !(currentStep(p, s).type === 'work' && (p.sections[currentStep(p, s).section].items[currentStep(p, s).itemIndex!]?.prescription.rest_sec ?? 0) >= 60 && currentStep(p, s).set === 1); g++) {
    s = reduce(p, s, { type: currentStep(p, s).type === 'checklist' ? 'complete' : 'skip' }, T0);
  }
  s = reduce(p, s, { type: 'complete' }, T0); // now resting
  assert.equal(currentStep(p, s).type, 'rest');
  return { p, s, w };
}

test('already authorized: one notice at rest end; replaced, not stacked', async () => {
  const { api, scheduled } = fakeApi(true);
  const N = createTimerNotifier(api);
  const { p, s } = restingState();
  const end = T0 + (currentStep(p, s).durationSec! * S);
  assert.equal(await N.schedule(timerNotice(p, s, T0 + S), 'w1', T0 + S), true);
  assert.equal(scheduled.size, 1);
  assert.equal([...scheduled.values()][0].at, end);
  assert.equal([...scheduled.values()][0].data.type, 'v3_session_timer');
  // extension while (re)backgrounding: the notice moves, still one
  const ext = reduce(p, s, { type: 'add_time', seconds: 30 }, T0 + 2 * S);
  await N.schedule(timerNotice(p, ext, T0 + 2 * S), 'w1', T0 + 2 * S);
  assert.equal(scheduled.size, 1);
  assert.equal([...scheduled.values()][0].at, end + 30 * S);
});

test('unauthorized: nothing scheduled, no prompt, timers unaffected', async () => {
  const { api, scheduled } = fakeApi(false);
  const N = createTimerNotifier(api);
  const { p, s } = restingState();
  assert.equal(await N.schedule(timerNotice(p, s, T0 + S), 'w1', T0 + S), false);
  assert.equal(scheduled.size, 0);
  assert.equal(api.prompts(), 0);
});

test('skip, pause, foreground, completion: the notice is cancelled', async () => {
  const { api, scheduled } = fakeApi(true);
  const N = createTimerNotifier(api);
  const { p, s } = restingState();
  await N.schedule(timerNotice(p, s, T0 + S), 'w1', T0 + S);
  await N.schedule(timerNotice(p, reduce(p, s, { type: 'skip' }, T0 + 2 * S), T0 + 2 * S), 'w1', T0 + 2 * S);
  assert.equal(scheduled.size, 0, 'skip');
  await N.schedule(timerNotice(p, s, T0 + S), 'w1', T0 + S);
  await N.schedule(timerNotice(p, reduce(p, s, { type: 'pause' }, T0 + 2 * S), T0 + 2 * S), 'w1', T0 + 2 * S);
  assert.equal(scheduled.size, 0, 'pause');
  await N.schedule(timerNotice(p, s, T0 + S), 'w1', T0 + S);
  await N.cancel(); // foreground / completion / end / leave
  assert.equal(scheduled.size, 0, 'foreground');
  // stale notices from a killed process are cleared too
  await api.schedule({ title: 'x', body: 'y', at: T0 + 99 * S, data: { type: 'v3_session_timer' } });
  await N.cancel();
  assert.equal(scheduled.size, 0, 'stale');
});

test('a user-paced step (waiting for a set) schedules nothing', async () => {
  const { api, scheduled } = fakeApi(true);
  const N = createTimerNotifier(api);
  const { p, s } = restingState();
  const waiting = reduce(p, s, { type: 'skip' }, T0 + S);
  assert.equal(currentStep(p, waiting).type, 'work');
  assert.equal(await N.schedule(timerNotice(p, waiting, T0 + 2 * S), 'w1', T0 + 2 * S), false);
  assert.equal(scheduled.size, 0);
});
