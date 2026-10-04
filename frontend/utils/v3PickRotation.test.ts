/**
 * Build's MOOD's Pick rotator shows only session types the resolver can actually pick.
 * Run: node --import tsx --test utils/v3PickRotation.test.ts
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { moodsPickRotation } from './v3HomeModel';

test('strength follows the backend rotation by frequency', () => {
  assert.deepEqual(moodsPickRotation('strength', 'build_strength', '1-2'), ['Full Body']);
  assert.deepEqual(moodsPickRotation('strength', 'build_strength', '3-4'), ['Lower Body: Squat', 'Upper Pull', 'Upper Push', 'Glutes + Legs', 'Upper Body']);
  const five = moodsPickRotation('strength', 'build_muscle', '5+');
  assert.ok(five.includes('Lower Body: Hinge') && five.includes('Arms') && five.length === 7);
});

test('sweat and athletic rotate all their session types', () => {
  assert.deepEqual(moodsPickRotation('sweat', null, '1-2'), ['Circuit', 'Engine', 'Hybrid']);
  assert.deepEqual(moodsPickRotation('athletic', null, null), ['Power', 'Speed + Plyo', 'Full-Body Athlete']);
});
