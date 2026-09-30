/**
 * Today-cache model (H1): multi-build day, primary build, v1 migration, envelope refresh.
 * Run: node --import tsx --test utils/v3TodayModel.test.ts   (or yarn test:v3-today)
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  MAX_TODAY_ENTRIES,
  V3TodayEntry,
  emptyDay,
  findBySignature,
  findByWorkoutId,
  parseDay,
  primaryEntry,
  upsertEntry,
  withEnvelope,
} from './v3TodayModel';

const D = '2026-09-28';
const entry = (sig: string, id: string, source?: 'build' | 'quick_start', version = 1): V3TodayEntry => ({
  date: D,
  workout_id: id,
  signature: sig,
  request: { direction: 'strength', states: [], soreness: [], duration: 60, date: D, persist: true },
  envelope: { schema_version: 'v3.0', status: 'ok', outcome: 'valid', conflict: null, workout: { workout_id: id, version } as any },
  saved_at: 'x',
  source,
});

test('a build becomes the primary; a quick start never replaces it', () => {
  let day = upsertEntry(emptyDay(D), entry('A', 'w1'));
  day = upsertEntry(day, entry('Q', 'w2', 'quick_start'));
  assert.equal(primaryEntry(day)?.workout_id, 'w1');
  assert.equal(findBySignature(day, 'Q')?.workout_id, 'w2');
  day = upsertEntry(day, entry('B', 'w3'));
  assert.equal(primaryEntry(day)?.workout_id, 'w3');
  assert.equal(day.entries.length, 3);
});

test('same signature replaces its entry instead of duplicating', () => {
  let day = upsertEntry(emptyDay(D), entry('A', 'w1'));
  day = upsertEntry(day, entry('A', 'w9'));
  assert.equal(day.entries.length, 1);
  assert.equal(findBySignature(day, 'A')?.workout_id, 'w9');
});

test('a pre-H1 single-entry (v1) cache is never surfaced as today\'s workout', () => {
  const v1 = JSON.stringify({ ...entry('A', 'w1'), request: { ...entry('A', 'w1').request, states: ['irritated'] } });
  const day = parseDay(v1, D);
  assert.equal(primaryEntry(day), null);
  assert.equal(day.entries.length, 0);
});

test('another day reads as empty', () => {
  const day = upsertEntry(emptyDay(D), entry('A', 'w1'));
  assert.equal(parseDay(JSON.stringify(day), '2026-09-29').entries.length, 0);
  assert.equal(parseDay('not json', D).entries.length, 0);
  assert.equal(parseDay(null, D).entries.length, 0);
});

test('capacity keeps the primary', () => {
  let day = upsertEntry(emptyDay(D), entry('P', 'wp'));
  for (let i = 0; i < MAX_TODAY_ENTRIES + 3; i++) day = upsertEntry(day, entry(`Q${i}`, `wq${i}`, 'quick_start'));
  assert.equal(day.entries.length, MAX_TODAY_ENTRIES);
  assert.equal(primaryEntry(day)?.workout_id, 'wp');
});

test('envelope refresh updates the matching workout and never goes backwards', () => {
  let day = upsertEntry(emptyDay(D), entry('A', 'w1', 'build', 2));
  const newer = entry('A', 'w1', 'build', 3).envelope;
  day = withEnvelope(day, newer);
  assert.equal(findByWorkoutId(day, 'w1')?.envelope.workout?.version, 3);
  const older = entry('A', 'w1', 'build', 1).envelope;
  day = withEnvelope(day, older);
  assert.equal(findByWorkoutId(day, 'w1')?.envelope.workout?.version, 3);
});
