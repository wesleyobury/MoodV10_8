/**
 * Three-branch coverage for the cart-hero resolver.
 *
 * Run:
 *   cd /app/frontend && node --import tsx --test utils/cartHero.test.ts
 * Or (preferred via package.json script):
 *   yarn test:cart-hero
 *
 * Branches under test:
 *   1. featured-carousel WITH heroImageUrl → uses cartMeta.heroImageUrl
 *   2. featured-carousel MISSING heroImageUrl → resolver falls back AND
 *      isFeaturedHeroBroken() returns true (triggers console.error in UI)
 *   3. source !== 'featured-carousel' → falls back to cartItems[0].imageUrl
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { resolveCartHeroImage, isFeaturedHeroBroken } from './cartHero';

const FIRST_ITEM = { imageUrl: 'https://cdn.example.com/exercise-1.jpg' };
const HERO_URL = 'https://cdn.example.com/featured-hero.png';

test('branch 1 — featured-carousel WITH heroImageUrl uses heroImageUrl', () => {
  const meta = {
    source: 'featured-carousel' as const,
    heroImageUrl: HERO_URL,
    title: 'Outdoor - Park to Peak',
  };
  assert.equal(resolveCartHeroImage(meta, FIRST_ITEM), HERO_URL);
  assert.equal(isFeaturedHeroBroken(meta), false);
});

test('branch 2 — featured-carousel MISSING heroImageUrl falls back AND flags broken', () => {
  // empty string
  const metaEmpty = {
    source: 'featured-carousel' as const,
    heroImageUrl: '',
    title: 'Outdoor - Park to Peak',
  };
  assert.equal(resolveCartHeroImage(metaEmpty, FIRST_ITEM), FIRST_ITEM.imageUrl);
  assert.equal(isFeaturedHeroBroken(metaEmpty), true);

  // undefined
  const metaUndef = {
    source: 'featured-carousel' as const,
    title: 'Outdoor - Park to Peak',
  };
  assert.equal(resolveCartHeroImage(metaUndef, FIRST_ITEM), FIRST_ITEM.imageUrl);
  assert.equal(isFeaturedHeroBroken(metaUndef), true);
});

test('branch 3 — non-featured source falls back to first-exercise imageUrl', () => {
  // custom cart
  const customMeta = { source: 'custom' as const };
  assert.equal(resolveCartHeroImage(customMeta, FIRST_ITEM), FIRST_ITEM.imageUrl);
  assert.equal(isFeaturedHeroBroken(customMeta), false);

  // build_for_me cart
  const buildMeta = { source: 'build_for_me' as const };
  assert.equal(resolveCartHeroImage(buildMeta, FIRST_ITEM), FIRST_ITEM.imageUrl);
  assert.equal(isFeaturedHeroBroken(buildMeta), false);

  // null meta (no meta at all)
  assert.equal(resolveCartHeroImage(null, FIRST_ITEM), FIRST_ITEM.imageUrl);
  assert.equal(isFeaturedHeroBroken(null), false);

  // empty cart (no first item, no meta) — undefined is acceptable
  assert.equal(resolveCartHeroImage(null, undefined), undefined);
});

test('edge — featured-carousel with hero present must beat a non-empty first item', () => {
  // Regression guard: this is the exact bug we kept hitting in V1/V2.
  // If this ever flips, V3 is broken.
  const meta = {
    source: 'featured-carousel' as const,
    heroImageUrl: HERO_URL,
  };
  const someExerciseImage = { imageUrl: 'https://cdn.example.com/some-other.jpg' };
  assert.equal(resolveCartHeroImage(meta, someExerciseImage), HERO_URL);
  assert.notEqual(
    resolveCartHeroImage(meta, someExerciseImage),
    someExerciseImage.imageUrl,
  );
});

/* ---------------------------------------------------------------- V3 hero (H2) */
import { resolveV3CartHero, V3_REMOTE_HEROES } from './cartHero';

const v3 = (over: Record<string, any> = {}) => ({ direction: 'strength', archetype: { id: 'strength_upper_pull' }, target: { mode: 'moods_pick', muscles: [] }, blocks: [], ...over });

test('V3 hero 1 — archetype image wins', () => {
  const r = resolveV3CartHero(v3());
  assert.equal(r.reason, 'archetype');
  assert.deepEqual(r.source, { kind: 'remote', uri: V3_REMOTE_HEROES.back_biceps });
});

test('V3 hero 2 — Custom Target uses the target image', () => {
  const r = resolveV3CartHero(v3({ archetype: { id: 'strength_custom_target' }, target: { mode: 'explicit', muscles: ['hamstrings', 'glutes'] } }));
  assert.equal(r.reason, 'target');
  assert.deepEqual(r.source, { kind: 'remote', uri: V3_REMOTE_HEROES.glutes_legs });
});

test('V3 hero 3 — unknown archetype, no target: never an exercise video thumbnail, Direction image instead', () => {
  const blocks = [{ items: [{ exercise: { media: null } }, { exercise: { media: { thumbnail_url: 'https://t/x.jpg' } } }] }];
  const r = resolveV3CartHero(v3({ archetype: { id: 'strength_future' }, blocks }));
  assert.equal(r.reason, 'direction');
  assert.notDeepEqual(r.source, { kind: 'remote', uri: 'https://t/x.jpg' });
});

test('V3 hero 4 — nothing else: Direction fallback', () => {
  const r = resolveV3CartHero(v3({ direction: 'sweat', archetype: { id: 'sweat_future' } }));
  assert.equal(r.reason, 'direction');
  assert.deepEqual(r.source, { kind: 'remote', uri: V3_REMOTE_HEROES.hiit });
});

test('V3 hero — every shipped archetype has an image', () => {
  for (const id of ['strength_upper_push', 'strength_upper_pull', 'strength_upper_mixed', 'strength_arms', 'strength_lower_squat', 'strength_lower_hinge',
    'strength_glutes_legs', 'strength_full_body', 'sweat_engine', 'sweat_circuit', 'sweat_hybrid', 'athletic_power', 'athletic_speed_agility', 'athletic_full_body']) {
    assert.equal(resolveV3CartHero(v3({ archetype: { id } })).reason, 'archetype', id);
  }
});
