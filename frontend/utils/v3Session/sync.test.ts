/**
 * Completion delivery: intent persisted before sending, one request in flight, offline queue + backoff, duplicate taps,
 * server idempotency, terminal errors.
 * Run: node --import tsx --test utils/v3Session/sync.test.ts
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { V3Workout } from '../v3Api';
import { compile } from './compile';
import { initialState, reduce, currentStep } from './engine';
import { SessionRecord, buildCompletion, newRecord, withState } from './record';
import { syncCompletion, SyncDeps } from './sync';

const FIX: { tag: string; workout: V3Workout }[] = JSON.parse(readFileSync(join(__dirname, '__fixtures__', 'envelopes.json'), 'utf8'));
const T0 = 1_800_000_000_000;

function completingRecord(): SessionRecord {
  const w = FIX.find((f) => f.workout.direction === 'strength')!.workout;
  const { record, plan } = newRecord({ schema_version: 'v3.0', status: 'ok', outcome: 'valid', conflict: null, workout: w }, T0, '2026-10-05', 's1');
  let s = initialState(plan, T0);
  let did = false;
  for (let g = 0; g < 3000 && currentStep(plan, s).type !== 'finish'; g++) {
    const st = currentStep(plan, s);
    s = reduce(plan, s, !did && st.type === 'work' ? { type: 'complete' } : { type: 'skip_block' }, T0);
    if (st.type === 'work') did = true;
  }
  const r = withState(record, plan, s, T0);
  return { ...r, status: 'completing', completion: buildCompletion(r, plan, s, T0 + 45 * 60000, '2026-10-05') };
}

function harness(initial: SessionRecord, responses: any[]) {
  let stored: SessionRecord | null = initial;
  let t = T0;
  const sent: any[] = [];
  const deps: SyncDeps = {
    now: () => t,
    update: async (_uid, fn) => { const n = fn(stored); stored = n; return n; },
    send: async (_tok, id, body) => {
      sent.push({ id, body });
      await new Promise((r) => setTimeout(r, 5));
      return responses.shift();
    },
  };
  return { deps, sent, get: () => stored, tick: (ms: number) => (t += ms) };
}

const OK = (status = 'completed') => ({ ok: true, result: { status, workout_id: 'w', completed_at: '2026-10-05T13:00:00Z', logged_exercises: 0, duration_actual: 45, streak: { current: 3 }, access: { has_full_access: false, consumed_free_workout: true, free_workouts_remaining: 0, free_workouts_reset_at: 'x' } } });
const OFFLINE = { ok: false, retryable: true, status: 0, message: 'offline' };

test('online: one request, record becomes completed with streak and access', async () => {
  const h = harness(completingRecord(), [OK()]);
  const out = await syncCompletion('u', 'tok', 'screen', h.deps);
  assert.equal(out.kind, 'synced');
  assert.equal(h.get()!.status, 'completed');
  assert.deepEqual(h.get()!.completion!.streak, { current: 3 });
  assert.equal(h.get()!.completion!.access!.free_used_this_week, true);
  assert.equal(h.sent.length, 1);
  assert.equal(h.sent[0].body.client_session_id, 's1');
  // already synced: nothing more is sent on any trigger
  assert.equal((await syncCompletion('u', 'tok', 'foreground', h.deps)).kind, 'skipped');
  assert.equal(h.sent.length, 1);
});

test('duplicate taps while a request is in flight send once', async () => {
  const h = harness(completingRecord(), [OK(), OK('already_completed')]);
  const [a, b, c] = await Promise.all([1, 2, 3].map(() => syncCompletion('u', 'tok', 'screen', h.deps)));
  assert.equal(h.sent.length, 1);
  assert.ok([a, b, c].every((x) => x.kind === 'synced'));
});

test('offline: intent kept, backoff respected, foreground retries, server duplicate treated as success', async () => {
  const h = harness(completingRecord(), [OFFLINE, OK('already_completed')]);
  assert.equal((await syncCompletion('u', 'tok', 'screen', h.deps)).kind, 'failed');
  assert.equal(h.get()!.status, 'completing');
  assert.equal(h.get()!.completion!.attempts, 1);
  h.tick(10_000);
  assert.equal((await syncCompletion('u', 'tok', 'timer', h.deps)).kind, 'skipped'); // backoff (30 s) not reached
  const out = await syncCompletion('u', 'tok', 'foreground', h.deps);
  assert.equal(out.kind, 'synced');
  assert.equal(h.get()!.status, 'completed');
  assert.equal(h.get()!.completion!.alreadyCompleted, true);
  assert.equal(h.sent.length, 2);
  assert.deepEqual(h.sent[0].body, h.sent[1].body); // the same persisted payload every time
});

test('a non-retryable error stops retries but keeps the intent', async () => {
  const h = harness(completingRecord(), [{ ok: false, retryable: false, status: 404, message: 'gone' }]);
  await syncCompletion('u', 'tok', 'screen', h.deps);
  assert.equal(h.get()!.completion!.terminal, true);
  assert.equal((await syncCompletion('u', 'tok', 'foreground', h.deps)).kind, 'skipped');
});

test('ended-early / abandoned sessions never send a completion', async () => {
  const r = completingRecord();
  for (const status of ['ended_early', 'abandoned', 'active'] as const) {
    const h = harness({ ...r, status }, [OK()]);
    assert.equal((await syncCompletion('u', 'tok', 'foreground', h.deps)).kind, 'skipped');
    assert.equal(h.sent.length, 0);
  }
});
