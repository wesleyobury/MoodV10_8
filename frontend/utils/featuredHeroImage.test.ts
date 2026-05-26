/**
 * Unit tests for the featured-workout hero image resolver.
 *
 * Run:
 *   cd /app/frontend && node --import tsx --test utils/featuredHeroImage.test.ts
 * Or:
 *   yarn test:featured-hero
 *
 * Branches under test:
 *   1. workout.image present → uses workout.image (priority)
 *   2. workout.image missing, exercises[0].imageUrl present → falls back
 *   3. Both missing → returns undefined
 *   4. Whitespace-only hero → falls back (treated as missing)
 *   5. Empty exercises array → returns undefined
 *   6. Null workout → falls back to exercises
 *   7. isFeaturedHeroFallback returns correct boolean per branch
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { resolveFeaturedHeroImage, isFeaturedHeroFallback } from './featuredHeroImage';

const HERO = 'https://cdn.example.com/featured-hero.png';
const EX1 = { imageUrl: 'https://cdn.example.com/exercise-1.jpg' };
const EX2 = { imageUrl: 'https://cdn.example.com/exercise-2.jpg' };

test('branch 1 — workout.image present, takes priority over exercises', () => {
  assert.equal(resolveFeaturedHeroImage({ image: HERO }, [EX1, EX2]), HERO);
  assert.equal(isFeaturedHeroFallback({ image: HERO }, [EX1, EX2]), false);
});

test('branch 2 — workout.image missing, falls back to first exercise', () => {
  assert.equal(resolveFeaturedHeroImage({ image: '' }, [EX1, EX2]), EX1.imageUrl);
  assert.equal(resolveFeaturedHeroImage({ image: null }, [EX1, EX2]), EX1.imageUrl);
  assert.equal(resolveFeaturedHeroImage({}, [EX1, EX2]), EX1.imageUrl);
  assert.equal(isFeaturedHeroFallback({ image: '' }, [EX1, EX2]), true);
});

test('branch 3 — both missing returns undefined', () => {
  assert.equal(resolveFeaturedHeroImage({}, []), undefined);
  assert.equal(resolveFeaturedHeroImage(null, null), undefined);
  assert.equal(resolveFeaturedHeroImage({ image: '' }, [{ imageUrl: '' }]), undefined);
  assert.equal(isFeaturedHeroFallback({}, []), false);
});

test('branch 4 — whitespace-only hero treated as missing', () => {
  assert.equal(resolveFeaturedHeroImage({ image: '   ' }, [EX1]), EX1.imageUrl);
  assert.equal(resolveFeaturedHeroImage({ image: '\t\n' }, [EX1]), EX1.imageUrl);
});

test('branch 5 — empty / undefined exercises array', () => {
  assert.equal(resolveFeaturedHeroImage({ image: HERO }, []), HERO);
  assert.equal(resolveFeaturedHeroImage({ image: HERO }, undefined), HERO);
  assert.equal(resolveFeaturedHeroImage({}, []), undefined);
});

test('branch 6 — null workout falls back to exercises', () => {
  assert.equal(resolveFeaturedHeroImage(null, [EX1]), EX1.imageUrl);
  assert.equal(resolveFeaturedHeroImage(undefined, [EX1]), EX1.imageUrl);
  assert.equal(isFeaturedHeroFallback(null, [EX1]), true);
});

test('branch 7 — first exercise has whitespace imageUrl, no further fallback', () => {
  // Only the first exercise is consulted (matches legacy behavior in
  // featured-workout-detail.tsx where the source was always exercises[0]).
  assert.equal(resolveFeaturedHeroImage({}, [{ imageUrl: '  ' }, EX2]), undefined);
});
