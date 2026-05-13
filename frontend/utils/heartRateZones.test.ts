import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  ageToMaxHR,
  computeHeartRateStats,
  samplesToBpmSeries,
  zoneForBpm,
  type HeartRateSample,
} from './heartRateZones';

test('ageToMaxHR — simple 220-age', () => {
  assert.equal(ageToMaxHR(30), 190);
  assert.equal(ageToMaxHR(45.4), 175);
});

test('ageToMaxHR — clamped to floor', () => {
  assert.equal(ageToMaxHR(150), 120);
});

test('zoneForBpm — boundaries', () => {
  const max = 200;
  assert.equal(zoneForBpm(100, max), 0); // 50% → Z1
  assert.equal(zoneForBpm(125, max), 1); // 62.5% → Z2
  assert.equal(zoneForBpm(145, max), 2); // 72.5% → Z3
  assert.equal(zoneForBpm(165, max), 3); // 82.5% → Z4
  assert.equal(zoneForBpm(185, max), 4); // 92.5% → Z5
});

test('returns null for empty', () => {
  assert.equal(computeHeartRateStats([], 30), null);
});

test('returns null when no positive bpm', () => {
  const samples: HeartRateSample[] = [
    { bpm: 0, timestamp: new Date().toISOString() },
    { bpm: -1, timestamp: new Date().toISOString() },
  ];
  assert.equal(computeHeartRateStats(samples, 30), null);
});

test('avg / max / min from samples', () => {
  const t = (s: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, s)).toISOString();
  const samples: HeartRateSample[] = [
    { bpm: 100, timestamp: t(0) },
    { bpm: 150, timestamp: t(5) },
    { bpm: 200, timestamp: t(10) },
  ];
  const stats = computeHeartRateStats(samples, 30);
  assert.ok(stats);
  assert.equal(stats!.avgHR, 150);
  assert.equal(stats!.maxHR, 200);
  assert.equal(stats!.minHR, 100);
});

test('time-in-zones credits each gap to the earlier sample', () => {
  const max = 200; // age 20 → maxHR 200
  const t = (s: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, s)).toISOString();
  // 10s at 100bpm (50% → Z1), then 10s at 155bpm (77.5% → Z3), then a final
  // 155bpm sample (credited FALLBACK_GAP_SEC = 5s since there's no next sample).
  const samples: HeartRateSample[] = [
    { bpm: 100, timestamp: t(0) },
    { bpm: 155, timestamp: t(10) },
    { bpm: 155, timestamp: t(20) },
  ];
  const stats = computeHeartRateStats(samples, 20);
  assert.ok(stats);
  assert.equal(stats!.ageDerivedMaxHR, max);
  assert.equal(stats!.timeInZones[0], 10); // Z1
  assert.equal(stats!.timeInZones[2], 15); // Z3 = 10s gap + 5s fallback
});

test('clamps pathological gaps to 60s', () => {
  const t = (s: number) => new Date(Date.UTC(2026, 0, 1, 0, 0, s)).toISOString();
  const samples: HeartRateSample[] = [
    { bpm: 110, timestamp: t(0) },
    // 10-minute gap (e.g., user walked away from the phone)
    { bpm: 110, timestamp: t(600) },
  ];
  const stats = computeHeartRateStats(samples, 30);
  assert.ok(stats);
  // First sample's gap should be clamped to 60, second uses fallback 5.
  assert.equal(stats!.timeInZones[0], 65);
});

test('samplesToBpmSeries strips junk', () => {
  const t = new Date().toISOString();
  const samples: HeartRateSample[] = [
    { bpm: 100, timestamp: t },
    { bpm: 0, timestamp: t },
    { bpm: NaN, timestamp: t },
    { bpm: 150, timestamp: t },
  ];
  assert.deepEqual(samplesToBpmSeries(samples), [100, 150]);
});
