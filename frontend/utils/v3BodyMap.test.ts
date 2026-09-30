/**
 * Soreness body map (founder pass 3). Run: node --import tsx --test utils/v3BodyMap.test.ts   (or yarn test:v3-bodymap)
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  BODY_MAP_REGIONS,
  BODY_SPOTS,
  BodyFigure,
  BodySide,
  hiddenOn,
  hitRegion,
  sidesFor,
  toMapRegions,
  toggleRegion,
} from './v3BodyMap';
import { buildRequest, initialInputs } from './v3HomeModel';

const FIGS: BodyFigure[] = ['female', 'male'];
const SIDES: BodySide[] = ['front', 'back'];

test('the founder list of areas, no generic Arms or Legs', () => {
  assert.deepEqual(
    BODY_MAP_REGIONS.map((r) => r.id).sort(),
    ['biceps', 'calves', 'chest', 'core', 'glutes', 'hamstrings', 'lower_back', 'quads', 'shoulders', 'triceps', 'upper_back'],
  );
});

test('tapping the middle of every drawn area selects that area, on every figure and side', () => {
  for (const f of FIGS) for (const s of SIDES) for (const sp of BODY_SPOTS[f][s]) assert.equal(hitRegion(f, s, sp.cx, sp.cy), sp.region, `${f} ${s} ${sp.region}`);
});

test('taps off the body select nothing', () => {
  for (const f of FIGS) for (const s of SIDES) {
    assert.equal(hitRegion(f, s, 3, 3), null);
    assert.equal(hitRegion(f, s, 97, 60), null);
    assert.equal(hitRegion(f, s, 50, 5), null); // head
  }
});

test('every area is reachable on the view where it lives', () => {
  for (const f of FIGS) {
    for (const r of ['chest', 'biceps', 'core', 'quads'] as const) assert.deepEqual(sidesFor(f, r), ['front'], `${f} ${r}`);
    for (const r of ['triceps', 'upper_back', 'lower_back', 'glutes', 'hamstrings'] as const) assert.deepEqual(sidesFor(f, r), ['back'], `${f} ${r}`);
    for (const r of ['shoulders', 'calves'] as const) assert.deepEqual(sidesFor(f, r), ['front', 'back'], `${f} ${r}`);
  }
});

test('older broad selections open as exactly what they meant', () => {
  assert.deepEqual(toMapRegions(['legs']), ['glutes', 'quads', 'hamstrings', 'calves']);
  assert.deepEqual(toMapRegions(['arms', 'chest']), ['chest', 'biceps', 'triceps']);
  assert.deepEqual(toMapRegions(['back']), ['upper_back', 'lower_back']);
});

test('toggle, multiple areas, and the other-view count', () => {
  let sel = toggleRegion([], 'calves');
  sel = toggleRegion(sel, 'biceps');
  sel = toggleRegion(sel, 'glutes');
  assert.deepEqual(sel, ['biceps', 'glutes', 'calves']);
  assert.equal(hiddenOn('female', 'front', sel), 1); // glutes only on the back
  assert.equal(hiddenOn('female', 'back', sel), 1); // biceps only on the front
  assert.deepEqual(toggleRegion(sel, 'glutes'), ['biceps', 'calves']);
});

test('the request carries the precise areas the user tapped (no broadening)', () => {
  const req = buildRequest({ ...initialInputs('strength', { states: ['sore'] }), soreness: ['biceps', 'triceps', 'calves', 'hamstrings'] }, '2026-10-01');
  assert.deepEqual(req.soreness, ['biceps', 'triceps', 'calves', 'hamstrings']);
  assert.deepEqual(req.states, ['sore']);
});
