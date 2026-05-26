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
