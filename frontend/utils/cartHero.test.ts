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
import { resolveV3CartHero, V3_CART_HEROES } from './cartHero';

const v3 = (over: Record<string, any> = {}) => ({ direction: 'strength', archetype: { id: 'strength_upper_pull' }, target: { mode: 'moods_pick', muscles: [] }, blocks: [], ...over });

test('V3 hero 1 — archetype image wins', () => {
  const r = resolveV3CartHero(v3());
  assert.equal(r.reason, 'archetype');
  assert.deepEqual(r.source, { kind: 'remote', uri: V3_CART_HEROES.strength_upper_pull });
});

test('V3 hero 2 — Custom Target uses the target image', () => {
  const r = resolveV3CartHero(v3({ archetype: { id: 'strength_custom_target' }, target: { mode: 'explicit', muscles: ['hamstrings', 'glutes'] } }));
  assert.equal(r.reason, 'target');
  assert.deepEqual(r.source, { kind: 'remote', uri: V3_CART_HEROES.strength_glutes_legs });
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
  assert.deepEqual(r.source, { kind: 'remote', uri: V3_CART_HEROES.sweat_circuit });
});

test('V3 hero — every shipped archetype has an image', () => {
  for (const id of ['strength_upper_push', 'strength_upper_pull', 'strength_upper_mixed', 'strength_arms', 'strength_lower_squat', 'strength_lower_hinge',
    'strength_glutes_legs', 'strength_full_body', 'sweat_engine', 'sweat_circuit', 'sweat_hybrid', 'athletic_power', 'athletic_speed_agility', 'athletic_full_body']) {
    assert.equal(resolveV3CartHero(v3({ archetype: { id } })).reason, 'archetype', id);
  }
});

/* ---------------------------------------------------------------- V3 hero library rotation (Oct 2026) */
import { V3_HERO_LIBRARY, v3HeroPool, pickV3Hero, type V3CartHeroKey } from './cartHero';

const HERO_KEYS = Object.keys(V3_CART_HEROES) as V3CartHeroKey[];

test('V3 hero rotation — no seed keeps the primary image', () => {
  const r = resolveV3CartHero(v3({ workout_id: null }));
  assert.deepEqual(r.source, { kind: 'remote', uri: V3_CART_HEROES.strength_upper_pull });
});

test('V3 hero rotation — same workout always gets the same image, and it comes from the archetype pool', () => {
  const a = resolveV3CartHero(v3({ workout_id: 'w_123' }));
  const b = resolveV3CartHero(v3({ workout_id: 'w_123' }));
  assert.deepEqual(a, b);
  assert.equal(a.reason, 'archetype');
  assert.ok(v3HeroPool('strength_upper_pull').includes((a.source as any).uri));
});

test('V3 hero rotation — every library photo is tagged with real archetypes and shows up in each tagged pool', () => {
  for (const p of V3_HERO_LIBRARY) {
    assert.ok(p.archetypes.length > 0, p.uri);
    for (const k of p.archetypes) {
      assert.ok(HERO_KEYS.includes(k), k);
      assert.ok(v3HeroPool(k).includes(p.uri), `${k} missing ${p.uri}`);
    }
  }
});

test('V3 hero rotation — pools mix older primaries with new photos, own primary first, no duplicates', () => {
  for (const k of HERO_KEYS) {
    const pool = v3HeroPool(k);
    assert.equal(pool[0], V3_CART_HEROES[k]);
    assert.equal(new Set(pool).size, pool.length, k);
    assert.ok(pool.length >= 3, `${k} has only ${pool.length}`);
  }
  // cross-archetype relevance: the glutes/legs primary (DB lunge) is also a Lower Squat hero
  assert.ok(v3HeroPool('strength_lower_squat').includes(V3_CART_HEROES.strength_glutes_legs));
});

test('V3 hero rotation — every image in a pool is reachable', () => {
  for (const k of HERO_KEYS) {
    const pool = v3HeroPool(k);
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(pickV3Hero(k, `seed-${i}`));
    assert.equal(seen.size, pool.length, k);
  }
});

test('V3 hero rotation — Custom Target rotates within the target archetype pool', () => {
  const r = resolveV3CartHero(v3({ workout_id: 'w_9', archetype: { id: 'strength_custom_target' }, target: { mode: 'explicit', muscles: ['chest'] } }));
  assert.equal(r.reason, 'target');
  assert.ok(v3HeroPool('strength_upper_push').includes((r.source as any).uri));
});

/* ---------------------------------------------------------------- V3 hero full pool (Direction-wide + workout exercise photos) */
import { v3WorkoutHeroPool, v3DirectionHeroPool } from './cartHero';
import { thumbUrl } from './v3ExerciseThumbs';

const withEx = (ids: string[]) => [{ items: ids.map((id) => ({ exercise: { id, media: null } })) }];

test('V3 hero pool — Sweat / Athletic workouts draw from every hero in their Direction', () => {
  const sw = v3({ direction: 'sweat', archetype: { id: 'sweat_engine' } });
  const pool = v3WorkoutHeroPool(sw, 'sweat_engine');
  assert.equal(pool[0], V3_CART_HEROES.sweat_engine);
  for (const u of v3DirectionHeroPool('sweat')) assert.ok(pool.includes(u), u);
  assert.ok(pool.includes(V3_CART_HEROES.sweat_circuit));
  const at = v3WorkoutHeroPool(v3({ direction: 'athletic', archetype: { id: 'athletic_power' } }), 'athletic_power');
  assert.ok(at.includes(V3_CART_HEROES.athletic_speed_agility));
});

test('V3 hero pool — Strength stays archetype-specific (no curl on a leg day)', () => {
  const pool = v3WorkoutHeroPool(v3({ archetype: { id: 'strength_lower_squat' } }), 'strength_lower_squat');
  assert.ok(!pool.includes(V3_CART_HEROES.strength_arms));
  assert.deepEqual(pool, v3HeroPool('strength_lower_squat'));
});

test("V3 hero pool — the workout's own exercise library photos join the pool, and every entry is reachable", () => {
  const w = v3({ direction: 'sweat', archetype: { id: 'sweat_circuit' }, blocks: withEx(['ski_erg', 'jump_rope', 'not_a_real_id']) });
  const pool = v3WorkoutHeroPool(w, 'sweat_circuit');
  assert.ok(pool.includes(thumbUrl('jump_rope')!));
  assert.ok(pool.includes(thumbUrl('ski_erg')!));
  assert.equal(new Set(pool).size, pool.length);
  const seen = new Set<string>();
  for (let i = 0; i < 3000; i++) seen.add((resolveV3CartHero({ ...w, workout_id: `w-${i}` }).source as any).uri);
  assert.equal(seen.size, pool.length);
});

/* ---------------------------------------------------------------- one Direction per photo (no duplicate Home cards) */
import { V3_EXERCISE_PHOTO_DIRECTION } from './v3ExercisePhotoDirection';

test('V3 hero — every curated photo is tagged within exactly one Direction', () => {
  for (const p of V3_HERO_LIBRARY) {
    const dirs = new Set(p.archetypes.map((a) => a.split('_')[0]));
    assert.equal(dirs.size, 1, p.uri);
  }
  const seen = new Map<string, string>();
  for (const d of ['strength', 'sweat', 'athletic']) {
    for (const k of HERO_KEYS.filter((x) => x.startsWith(`${d}_`))) {
      for (const u of v3HeroPool(k)) {
        assert.ok(!seen.has(u) || seen.get(u) === d, `${u} in ${seen.get(u)} and ${d}`);
        seen.set(u, d);
      }
    }
  }
});

test('V3 hero — exercise photos only join the pool of the Direction that owns them', () => {
  const ids = Object.keys(V3_EXERCISE_PHOTO_DIRECTION);
  const strengthId = ids.find((id) => V3_EXERCISE_PHOTO_DIRECTION[id] === 'strength')!;
  const sweatId = ids.find((id) => V3_EXERCISE_PHOTO_DIRECTION[id] === 'sweat')!;
  const blocks = withEx([strengthId, sweatId]);
  const st = v3WorkoutHeroPool(v3({ archetype: { id: 'strength_full_body' }, blocks }), 'strength_full_body');
  const sw = v3WorkoutHeroPool(v3({ direction: 'sweat', archetype: { id: 'sweat_hybrid' }, blocks }), 'sweat_hybrid');
  assert.ok(st.includes(thumbUrl(strengthId)!) && !st.includes(thumbUrl(sweatId)!));
  assert.ok(sw.includes(thumbUrl(sweatId)!) && !sw.includes(thumbUrl(strengthId)!));
});

/* ---------------------------------------------------------------- Home: three different athletes */
import { resolveV3HomeHeroes, v3PhotoAthlete, V3_PRIMARY_ATHLETE } from './cartHero';

test('V3 Home heroes — every curated photo has a known athlete', () => {
  for (const p of V3_HERO_LIBRARY) assert.ok(p.athlete && v3PhotoAthlete(p.uri) === p.athlete, p.uri);
  for (const k of HERO_KEYS) assert.ok(V3_PRIMARY_ATHLETE[k], k);
});

test('V3 Home heroes — the three cards never repeat an athlete, and the Cart reuses the card photo', () => {
  for (let i = 0; i < 300; i++) {
    const ws = [
      v3({ workout_id: `s-${i}`, archetype: { id: HERO_KEYS.filter((k) => k.startsWith('strength_'))[i % 9] } }),
      v3({ workout_id: `w-${i}`, direction: 'sweat', archetype: { id: ['sweat_circuit', 'sweat_engine', 'sweat_hybrid'][i % 3] } }),
      v3({ workout_id: `a-${i}`, direction: 'athletic', archetype: { id: ['athletic_power', 'athletic_speed_agility', 'athletic_full_body'][i % 3] } }),
    ];
    const hs = resolveV3HomeHeroes(ws);
    const who = hs.map((h) => v3PhotoAthlete((h as any).uri));
    assert.equal(new Set(who).size, 3, `${i}: ${who.join(',')}`);
    ws.forEach((w, j) => assert.deepEqual(resolveV3CartHero(w).source, hs[j]));
  }
});

test('V3 Home heroes — missing workouts stay null', () => {
  const hs = resolveV3HomeHeroes([null, v3({ workout_id: 'x' }), null]);
  assert.equal(hs[0], null);
  assert.equal(hs[2], null);
  assert.ok(hs[1]);
});

test('V3 Home heroes — never three women or three men across the three cards (founder pass, Oct 2026)', async () => {
  const { V3_ATHLETE_GENDER } = await import('./cartHero');
  // every athlete the Home cards can show has a gender on file
  for (const p of V3_HERO_LIBRARY) assert.ok(V3_ATHLETE_GENDER[p.athlete], p.athlete);
  const S = HERO_KEYS.filter((k) => k.startsWith('strength_'));
  const SW = ['sweat_circuit', 'sweat_engine', 'sweat_hybrid'];
  const AT = ['athletic_power', 'athletic_speed_agility', 'athletic_full_body'];
  let checked = 0;
  for (const s of S) for (const sw of SW) for (const at of AT) for (let i = 0; i < 12; i++) {
    const ws = [
      v3({ workout_id: `s-${s}-${i}`, archetype: { id: s } }),
      v3({ workout_id: `w-${sw}-${i}`, direction: 'sweat', archetype: { id: sw } }),
      v3({ workout_id: `a-${at}-${i}`, direction: 'athletic', archetype: { id: at } }),
    ];
    const hs = resolveV3HomeHeroes(ws);
    const who = hs.map((h) => v3PhotoAthlete((h as any).uri));
    const g = who.map((a) => V3_ATHLETE_GENDER[a ?? '']);
    assert.equal(new Set(who).size, 3, who.join(','));
    assert.ok(new Set(g).size > 1, `${s}/${sw}/${at}#${i}: ${who.join(', ')}`);
    ws.forEach((w, j) => assert.deepEqual(resolveV3CartHero(w).source, hs[j]));
    checked++;
  }
  assert.ok(checked >= 900);
});
