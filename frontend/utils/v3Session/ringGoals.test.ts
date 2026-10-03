import { test } from 'node:test';
import assert from 'node:assert/strict';
import { caloriesGoal, heartIntensity, minutesGoal, sessionIntensity, workIntensity } from './ringGoals';

test('minutes goal is the requested length, 60 by default', () => {
  assert.equal(minutesGoal(30), 30);
  assert.equal(minutesGoal(null), 60);
});

test('calories goal scales with Direction and length', () => {
  assert.equal(caloriesGoal('strength', 60), 360);
  assert.equal(caloriesGoal('sweat', 60), 540);
  assert.equal(caloriesGoal('athletic', 30), 240);
  assert.equal(caloriesGoal('unknown', 60), 420);
});

test('heart intensity maps the 50-85% HRmax band to 0-100', () => {
  assert.equal(heartIntensity(95), 0);
  assert.equal(heartIntensity(162), 100);
  assert.equal(heartIntensity(130), 53);
  assert.equal(heartIntensity(null), null);
  // a peak above 190 raises HRmax
  assert.ok(heartIntensity(150, 200)! < heartIntensity(150, 170)!);
});

test('work intensity: full session at plan pace = 85, skips pull down, faster pushes up', () => {
  assert.equal(workIntensity({ workDone: 20, workTotal: 20, minutes: 60, goalMinutes: 60 }), 85);
  assert.equal(workIntensity({ workDone: 10, workTotal: 20, minutes: 60, goalMinutes: 60 }), 43);
  assert.equal(workIntensity({ workDone: 20, workTotal: 20, minutes: 52, goalMinutes: 60 }), 98);
  assert.equal(workIntensity({ workDone: 0, workTotal: 20, minutes: 5, goalMinutes: 60 }), null);
});

test('heart rate wins over work when present', () => {
  assert.deepEqual(sessionIntensity({ avgHr: 130, workDone: 20, workTotal: 20, minutes: 60, goalMinutes: 60 }), { value: 53, source: 'heart' });
  assert.deepEqual(sessionIntensity({ workDone: 20, workTotal: 20, minutes: 60, goalMinutes: 60 }), { value: 85, source: 'work' });
  assert.equal(sessionIntensity({}), null);
});
