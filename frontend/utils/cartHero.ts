/**
 * Pure cart-hero resolver — no React, no side effects.
 *
 * HERO IMAGE PRIORITY (do not change without updating featured-cart spec):
 *   1. cartMeta.source === 'featured-carousel' AND cartMeta.heroImageUrl
 *      → use cartMeta.heroImageUrl (the carousel's in-memory hero)
 *   2. otherwise → fall back to cartItems[0]?.imageUrl
 *
 * This file is intentionally extracted from cart.tsx so it can be unit
 * tested without rendering the screen. See cartHero.test.ts for the
 * three-branch coverage.
 */

import type { CartMeta } from '../contexts/CartContext';

export interface CartHeroInput {
  imageUrl?: string;
}

export const resolveCartHeroImage = (
  cartMeta: CartMeta | null | undefined,
  firstItem: CartHeroInput | undefined,
): string | undefined => {
  if (
    cartMeta &&
    cartMeta.source === 'featured-carousel' &&
    cartMeta.heroImageUrl &&
    cartMeta.heroImageUrl.length > 0
  ) {
    return cartMeta.heroImageUrl;
  }
  return firstItem?.imageUrl;
};

/**
 * Pure guard: true when the cart is a featured-carousel cart that's missing
 * its heroImageUrl — signals a broken pass-through at the action site.
 * UI uses this to fire console.error('FEATURED_CART_HERO_V3 BROKEN', ...).
 */
export const isFeaturedHeroBroken = (
  cartMeta: CartMeta | null | undefined,
): boolean => {
  if (!cartMeta) return false;
  if (cartMeta.source !== 'featured-carousel') return false;
  return !cartMeta.heroImageUrl || cartMeta.heroImageUrl.length === 0;
};

/* ======================================================================== V3 (H1 / H2)
 *
 * V3 workouts have no featured hero and no V2 cart items, so the V3 Cart and the Home hero resolve imagery from the
 * workout itself. Priority (H2 spec):
 *   1. archetype-specific image          (Upper Pull -> back & biceps, Engine -> bike, Power -> jump ...)
 *   2. target-specific image, when sensible (Custom Target / Core sessions, and explicit Targets without (1))
 *   3. the first exercise thumbnail the API returned
 *   4. the Direction fallback
 * Remote images are the existing MOOD featured heroes on Cloudinary; local ones are the bundled onboarding portraits.
 * The caller maps a local `key` to its `require()` (components/v3/v3Images.ts) so this file stays pure and testable.
 */

export type V3HeroAssetKey = 'strength' | 'sweat' | 'athletic' | 'calisthenics' | 'outdoor';
export type V3HeroSource = { kind: 'asset'; key: V3HeroAssetKey } | { kind: 'remote'; uri: string };
export type V3HeroReason = 'archetype' | 'target' | 'direction';

const CLD = 'https://res.cloudinary.com/dfsygar5c/image/upload/mood_app/featured_heroes';
export const V3_REMOTE_HEROES = {
  chest_shoulders: `${CLD}/muscle_gainer_chest_and_shoulders.jpg`,
  back_biceps: `${CLD}/muscle_gainer_back_and_bis_volume.jpg`,
  glutes_legs: `${CLD}/muscle_gainer_glute_day.jpg`,
  hiit: `${CLD}/sweat_hiit_circuit.jpg`,
  bike: `${CLD}/sweat_cardio_engine.jpg`,
  jump: `${CLD}/build_explosion_power_complex.jpg`,
  hill_sprint: `${CLD}/outdoor_hill_repeats.jpg`,
  park: `${CLD}/outdoor_park_circuit.jpg`,
} as const;

const R = (k: keyof typeof V3_REMOTE_HEROES): V3HeroSource => ({ kind: 'remote', uri: V3_REMOTE_HEROES[k] });
const A = (key: V3HeroAssetKey): V3HeroSource => ({ kind: 'asset', key });

const V3_ARCHETYPE_HERO: Record<string, V3HeroSource> = {
  strength_upper_push: R('chest_shoulders'),
  strength_upper_pull: R('back_biceps'),
  strength_upper_mixed: R('chest_shoulders'),
  strength_arms: A('strength'),
  strength_lower_squat: R('glutes_legs'),
  strength_lower_hinge: R('glutes_legs'),
  strength_glutes_legs: R('glutes_legs'),
  strength_full_body: A('strength'),
  sweat_circuit: R('hiit'),
  sweat_engine: R('bike'),
  sweat_hybrid: R('park'),
  athletic_power: R('jump'),
  athletic_speed_agility: R('hill_sprint'),
  athletic_full_body: A('athletic'),
};

/** Target muscles -> image, checked in order (first muscle group that matches wins). */
const V3_TARGET_HERO: { muscles: string[]; hero: V3HeroSource }[] = [
  { muscles: ['chest', 'shoulders', 'triceps'], hero: R('chest_shoulders') },
  { muscles: ['back', 'lats', 'upper_back', 'biceps'], hero: R('back_biceps') },
  { muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'legs'], hero: R('glutes_legs') },
  { muscles: ['core', 'abs', 'obliques'], hero: A('calisthenics') },
];

const V3_DIRECTION_HERO: Record<string, V3HeroSource> = {
  strength: A('strength'),
  sweat: R('hiit'),
  athletic: R('jump'),
};

/** Portrait image for the Home hero, by Direction (bundled, so the hero never waits on the network). */
export const V3_HOME_HERO: Record<string, V3HeroAssetKey> = { strength: 'strength', sweat: 'sweat', athletic: 'athletic' };

export interface V3HeroWorkout {
  direction: string;
  archetype: { id: string };
  target?: { mode?: string; muscles?: string[] } | null;
  blocks?: { items: { exercise?: { media?: { thumbnail_url?: string | null } | null } | null }[] }[];
}

export function resolveV3CartHero(w: V3HeroWorkout): { source: V3HeroSource; reason: V3HeroReason } {
  const byArchetype = V3_ARCHETYPE_HERO[w.archetype?.id];
  if (byArchetype) return { source: byArchetype, reason: 'archetype' };
  const muscles = w.target && w.target.mode === 'explicit' ? w.target.muscles ?? [] : [];
  for (const m of muscles) {
    const hit = V3_TARGET_HERO.find((t) => t.muscles.includes(m));
    if (hit) return { source: hit.hero, reason: 'target' };
  }
  if (w.archetype?.id === 'strength_core') return { source: A('calisthenics'), reason: 'target' };
  // Exercise-video thumbnails are never used as Cart imagery (founder policy: static photos only); fall to the Direction image.
  return { source: V3_DIRECTION_HERO[w.direction] ?? A('strength'), reason: 'direction' };
}
