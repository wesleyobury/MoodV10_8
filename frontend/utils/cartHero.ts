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
import { thumbUrl } from './v3ExerciseThumbs';
import { V3_EXERCISE_PHOTO_DIRECTION } from './v3ExercisePhotoDirection';

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

/**
 * V3 Cart hero library (Oct 2026): one primary image per archetype (plus alternates below), same dark-gym look as the Direction covers.
 * Sources: "V3 Updates/Cart Heroes/<archetype>.jpg" (1080 x 1350), uploaded to Cloudinary as mood/v3/cart_heroes/<archetype>.
 * strength_custom_target has no image of its own; it resolves through V3_TARGET_HERO below.
 */
export const V3_CART_HEROES = {
  strength_upper_push: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790958223/mood/v3/cart_heroes/strength_upper_push.jpg',
  strength_upper_pull: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790890201/mood/v3/cart_heroes/strength_upper_pull.jpg',
  strength_upper_mixed: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790890200/mood/v3/cart_heroes/strength_upper_mixed.jpg',
  strength_arms: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790890196/mood/v3/cart_heroes/strength_arms.jpg',
  strength_lower_squat: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790890199/mood/v3/cart_heroes/strength_lower_squat.jpg',
  strength_lower_hinge: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790890199/mood/v3/cart_heroes/strength_lower_hinge.jpg',
  strength_glutes_legs: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790890198/mood/v3/cart_heroes/strength_glutes_legs.jpg',
  strength_full_body: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790890197/mood/v3/cart_heroes/strength_full_body.jpg',
  strength_core: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790890197/mood/v3/cart_heroes/strength_core.jpg',
  sweat_circuit: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790890203/mood/v3/cart_heroes/sweat_circuit.jpg',
  sweat_engine: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790890203/mood/v3/cart_heroes/sweat_engine.jpg',
  sweat_hybrid: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790890204/mood/v3/cart_heroes/sweat_hybrid.jpg',
  athletic_power: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790890195/mood/v3/cart_heroes/athletic_power.jpg',
  athletic_speed_agility: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790890196/mood/v3/cart_heroes/athletic_speed_agility.jpg',
  athletic_full_body: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790890194/mood/v3/cart_heroes/athletic_full_body.jpg',
} as const;
export type V3CartHeroKey = keyof typeof V3_CART_HEROES;

/**
 * Cart hero library (Oct 2026). Every photo is tagged with each archetype it suits (first tag = the archetype it was
 * shot for), and an archetype's pool is ALL photos tagged with it: its primary first, then the other primaries and the
 * alternates that fit (e.g. Lower Squat also draws the lunge, step-up and Bulgarian split squat shots).
 * The pick is seeded by the workout (workout_id, else created_at) so one workout always shows the same photo on the
 * Preview card, the Cart and Home; with no seed the archetype's own primary is used.
 * Alternates: "V3 Updates/Cart Heroes/alts/<archetype>__<id>.jpg" (1080 x 1350), Cloudinary mood/v3/cart_heroes/alts/<same name>.
 */
/** Extra archetypes each primary image (V3_CART_HEROES) also suits. */
export const V3_PRIMARY_HERO_ALSO: Partial<Record<V3CartHeroKey, readonly V3CartHeroKey[]>> = {
  strength_upper_push: ['strength_upper_mixed'],
  strength_upper_pull: ['strength_full_body'],
  strength_upper_mixed: ['strength_upper_push', 'strength_core'],
  strength_arms: ['strength_upper_pull'],
  strength_lower_squat: ['strength_glutes_legs', 'strength_full_body'],
  strength_lower_hinge: ['strength_glutes_legs'],
  strength_glutes_legs: ['strength_lower_squat'],
  sweat_circuit: ['sweat_hybrid', 'sweat_engine'],
  sweat_hybrid: ['sweat_circuit'],
  athletic_power: ['athletic_full_body'],
  athletic_speed_agility: ['athletic_full_body'],
};

export interface V3HeroPhoto {
  uri: string;
  archetypes: readonly V3CartHeroKey[];
}

/** Alternate photos (cast: Lena, Zoe, Mateo, Wyatt, Julian, Harper, Noa, Imani, plus Mei, Amara, Luca, Kai). */
export const V3_CART_HERO_ALTS: readonly V3HeroPhoto[] = [
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965254/mood/v3/cart_heroes/alts/strength_upper_pull__a01_wyatt_lat_pulldown.jpg', archetypes: ['strength_upper_pull'] }, // a01_wyatt_lat_pulldown
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965247/mood/v3/cart_heroes/alts/strength_full_body__a02_wyatt_farmer_carry.jpg', archetypes: ['strength_full_body', 'strength_core'] }, // a02_wyatt_farmer_carry
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965255/mood/v3/cart_heroes/alts/strength_upper_push__a03_julian_db_bench.jpg', archetypes: ['strength_upper_push'] }, // a03_julian_db_bench
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965243/mood/v3/cart_heroes/alts/athletic_power__a04_julian_box_jump.jpg', archetypes: ['athletic_power', 'athletic_full_body'] }, // a04_julian_box_jump
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965245/mood/v3/cart_heroes/alts/strength_arms__a05_julian_db_curl.jpg', archetypes: ['strength_arms'] }, // a05_julian_db_curl
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965250/mood/v3/cart_heroes/alts/strength_lower_squat__a06_harper_goblet_squat.jpg', archetypes: ['strength_lower_squat', 'strength_glutes_legs', 'strength_full_body'] }, // a06_harper_goblet_squat
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965249/mood/v3/cart_heroes/alts/strength_lower_hinge__a07_harper_db_rdl.jpg', archetypes: ['strength_lower_hinge', 'strength_glutes_legs'] }, // a07_harper_db_rdl
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965257/mood/v3/cart_heroes/alts/sweat_engine__a08_harper_spin_bike.jpg', archetypes: ['sweat_engine'] }, // a08_harper_spin_bike
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965256/mood/v3/cart_heroes/alts/sweat_circuit__a09_noa_jump_rope.jpg', archetypes: ['sweat_circuit', 'sweat_engine', 'sweat_hybrid'] }, // a09_noa_jump_rope
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965246/mood/v3/cart_heroes/alts/strength_core__a10_noa_forearm_plank.jpg', archetypes: ['strength_core'] }, // a10_noa_forearm_plank
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965254/mood/v3/cart_heroes/alts/strength_upper_pull__a11_wyatt_1_arm_db_row.jpg', archetypes: ['strength_upper_pull', 'strength_upper_mixed'] }, // a11_wyatt_1_arm_db_row
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965251/mood/v3/cart_heroes/alts/strength_lower_squat__a12_wyatt_back_squat.jpg', archetypes: ['strength_lower_squat', 'strength_full_body'] }, // a12_wyatt_back_squat
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965258/mood/v3/cart_heroes/alts/sweat_hybrid__a13_julian_db_thruster.jpg', archetypes: ['sweat_hybrid', 'sweat_circuit'] }, // a13_julian_db_thruster
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965244/mood/v3/cart_heroes/alts/athletic_speed_agility__a14_julian_ladder.jpg', archetypes: ['athletic_speed_agility', 'athletic_full_body'] }, // a14_julian_ladder
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965248/mood/v3/cart_heroes/alts/strength_glutes_legs__a15_harper_bulgarian_split.jpg', archetypes: ['strength_glutes_legs', 'strength_lower_squat'] }, // a15_harper_bulgarian_split
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965252/mood/v3/cart_heroes/alts/strength_upper_mixed__a16_harper_cable_row.jpg', archetypes: ['strength_upper_mixed', 'strength_upper_pull'] }, // a16_harper_cable_row
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965243/mood/v3/cart_heroes/alts/athletic_power__a17_noa_med_ball_chest_pass.jpg', archetypes: ['athletic_power', 'athletic_full_body'] }, // a17_noa_med_ball_chest_pass
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965247/mood/v3/cart_heroes/alts/strength_core__a18_noa_hanging_knee_raise.jpg', archetypes: ['strength_core'] }, // a18_noa_hanging_knee_raise
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965253/mood/v3/cart_heroes/alts/strength_upper_mixed__a19_wyatt_half_kneel_db_press.jpg', archetypes: ['strength_upper_mixed', 'strength_upper_push'] }, // a19_wyatt_half_kneel_db_press
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965249/mood/v3/cart_heroes/alts/strength_lower_hinge__a20_wyatt_kb_deadlift.jpg', archetypes: ['strength_lower_hinge', 'strength_full_body', 'strength_glutes_legs'] }, // a20_wyatt_kb_deadlift
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965255/mood/v3/cart_heroes/alts/strength_upper_push__a21_julian_dips.jpg', archetypes: ['strength_upper_push', 'strength_arms'] }, // a21_julian_dips
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965246/mood/v3/cart_heroes/alts/strength_arms__a22_julian_rope_pushdown.jpg', archetypes: ['strength_arms', 'strength_upper_push'] }, // a22_julian_rope_pushdown
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965242/mood/v3/cart_heroes/alts/athletic_full_body__a23_julian_skater_bound.jpg', archetypes: ['athletic_full_body', 'athletic_speed_agility', 'athletic_power'] }, // a23_julian_skater_bound
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965251/mood/v3/cart_heroes/alts/strength_lower_squat__a24_harper_db_step_up.jpg', archetypes: ['strength_lower_squat', 'strength_glutes_legs'] }, // a24_harper_db_step_up
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965244/mood/v3/cart_heroes/alts/athletic_speed_agility__a25_harper_cone_drill.jpg', archetypes: ['athletic_speed_agility', 'athletic_full_body'] }, // a25_harper_cone_drill
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965253/mood/v3/cart_heroes/alts/strength_upper_mixed__a26_noa_suspension_row.jpg', archetypes: ['strength_upper_mixed', 'strength_upper_pull'] }, // a26_noa_suspension_row
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965257/mood/v3/cart_heroes/alts/sweat_engine__a27_noa_ski_erg.jpg', archetypes: ['sweat_engine', 'sweat_hybrid'] }, // a27_noa_ski_erg
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790987994/mood/v3/cart_heroes/alts/strength_arms__h100_imani_hammer_curl.jpg', archetypes: ['strength_arms'] }, // h100_imani_hammer_curl
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790986867/mood/v3/cart_heroes/alts/strength_upper_push__h101_lena_incline_db_press.jpg', archetypes: ['strength_upper_push', 'strength_upper_mixed'] }, // h101_lena_incline_db_press
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790986866/mood/v3/cart_heroes/alts/strength_upper_pull__h102_mateo_pull_up.jpg', archetypes: ['strength_upper_pull', 'strength_upper_mixed'] }, // h102_mateo_pull_up
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790986866/mood/v3/cart_heroes/alts/strength_upper_mixed__h103_zoe_arnold_press.jpg', archetypes: ['strength_upper_mixed', 'strength_upper_push'] }, // h103_zoe_arnold_press
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790986863/mood/v3/cart_heroes/alts/strength_arms__h104_wyatt_ez_curl.jpg', archetypes: ['strength_arms'] }, // h104_wyatt_ez_curl
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790988354/mood/v3/cart_heroes/alts/strength_lower_squat__h105_imani_kb_front_squat.jpg', archetypes: ['strength_lower_squat', 'strength_glutes_legs', 'strength_full_body'] }, // h105_imani_kb_front_squat
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790986865/mood/v3/cart_heroes/alts/strength_lower_hinge__h106_zoe_sl_db_rdl.jpg', archetypes: ['strength_lower_hinge', 'strength_glutes_legs'] }, // h106_zoe_sl_db_rdl
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790988352/mood/v3/cart_heroes/alts/strength_glutes_legs__h107_imani_band_walk.jpg', archetypes: ['strength_glutes_legs'] }, // h107_imani_band_walk
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790986864/mood/v3/cart_heroes/alts/strength_full_body__h108_wyatt_sandbag_carry.jpg', archetypes: ['strength_full_body'] }, // h108_wyatt_sandbag_carry
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790987994/mood/v3/cart_heroes/alts/strength_core__h109_lena_side_plank.jpg', archetypes: ['strength_core'] }, // h109_lena_side_plank
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790988357/mood/v3/cart_heroes/alts/sweat_circuit__h110_imani_mountain_climbers.jpg', archetypes: ['sweat_circuit', 'sweat_hybrid'] }, // h110_imani_mountain_climbers
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790987995/mood/v3/cart_heroes/alts/sweat_engine__h111_lena_rower.jpg', archetypes: ['sweat_engine', 'sweat_hybrid'] }, // h111_lena_rower
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790986868/mood/v3/cart_heroes/alts/sweat_hybrid__h112_mateo_db_snatch.jpg', archetypes: ['sweat_hybrid'] }, // h112_mateo_db_snatch
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790987992/mood/v3/cart_heroes/alts/athletic_power__h113_zoe_broad_jump.jpg', archetypes: ['athletic_power', 'athletic_full_body'] }, // h113_zoe_broad_jump
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790987993/mood/v3/cart_heroes/alts/athletic_speed_agility__h114_imani_mini_hurdles.jpg', archetypes: ['athletic_speed_agility', 'athletic_power'] }, // h114_imani_mini_hurdles
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790986860/mood/v3/cart_heroes/alts/athletic_full_body__h115_wyatt_rot_mb_wall_throw.jpg', archetypes: ['athletic_full_body', 'athletic_power'] }, // h115_wyatt_rot_mb_wall_throw
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790988357/mood/v3/cart_heroes/alts/strength_upper_push__h201_mateo_cable_fly.jpg', archetypes: ['strength_upper_push', 'strength_upper_mixed'] }, // h201_mateo_cable_fly
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790988356/mood/v3/cart_heroes/alts/strength_upper_pull__h202_imani_seated_cable_row.jpg', archetypes: ['strength_upper_pull', 'strength_upper_mixed'] }, // h202_imani_seated_cable_row
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790988355/mood/v3/cart_heroes/alts/strength_upper_mixed__h203_wyatt_renegade_row.jpg', archetypes: ['strength_upper_mixed', 'strength_upper_pull', 'strength_core'] }, // h203_wyatt_renegade_row
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790988350/mood/v3/cart_heroes/alts/strength_arms__h204_imani_oh_triceps_ext.jpg', archetypes: ['strength_arms', 'strength_upper_push'] }, // h204_imani_oh_triceps_ext
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790988355/mood/v3/cart_heroes/alts/strength_lower_squat__h205_mateo_goblet_box_squat.jpg', archetypes: ['strength_lower_squat', 'strength_glutes_legs'] }, // h205_mateo_goblet_box_squat
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790988354/mood/v3/cart_heroes/alts/strength_lower_hinge__h206_wyatt_trap_bar_dl.jpg', archetypes: ['strength_lower_hinge', 'strength_full_body'] }, // h206_wyatt_trap_bar_dl
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790988353/mood/v3/cart_heroes/alts/strength_glutes_legs__h207_zoe_kb_lateral_lunge.jpg', archetypes: ['strength_glutes_legs', 'strength_lower_squat'] }, // h207_zoe_kb_lateral_lunge
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790988352/mood/v3/cart_heroes/alts/strength_full_body__h208_mateo_bear_crawl.jpg', archetypes: ['strength_full_body', 'strength_core'] }, // h208_mateo_bear_crawl
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790988351/mood/v3/cart_heroes/alts/strength_core__h209_zoe_pallof_press.jpg', archetypes: ['strength_core'] }, // h209_zoe_pallof_press
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790988358/mood/v3/cart_heroes/alts/sweat_circuit__h210_mateo_wall_ball.jpg', archetypes: ['sweat_circuit', 'sweat_hybrid'] }, // h210_mateo_wall_ball
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790988359/mood/v3/cart_heroes/alts/sweat_engine__h211_wyatt_treadmill.jpg', archetypes: ['sweat_engine'] }, // h211_wyatt_treadmill
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790988359/mood/v3/cart_heroes/alts/sweat_hybrid__h212_zoe_sled_pull.jpg', archetypes: ['sweat_hybrid'] }, // h212_zoe_sled_pull
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790988349/mood/v3/cart_heroes/alts/athletic_power__h213_lena_mb_scoop_toss.jpg', archetypes: ['athletic_power', 'athletic_full_body'] }, // h213_lena_mb_scoop_toss
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790988350/mood/v3/cart_heroes/alts/athletic_speed_agility__h214_lena_wall_drive.jpg', archetypes: ['athletic_speed_agility'] }, // h214_lena_wall_drive
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790988349/mood/v3/cart_heroes/alts/athletic_full_body__h215_imani_turf_sprint.jpg', archetypes: ['athletic_full_body', 'athletic_speed_agility', 'athletic_power'] }, // h215_imani_turf_sprint
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790998367/mood/v3/cart_heroes/alts/strength_lower_hinge__h301_mateo_barbell_rdl.jpg', archetypes: ['strength_lower_hinge', 'strength_glutes_legs'] }, // h301_mateo_barbell_rdl
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790999938/mood/v3/cart_heroes/alts/strength_lower_hinge__h302_imani_kb_swing.jpg', archetypes: ['strength_lower_hinge', 'strength_full_body'] }, // h302_imani_kb_swing
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790999117/mood/v3/cart_heroes/alts/strength_lower_hinge__h304_julian_kb_sumo_deadlift.jpg', archetypes: ['strength_lower_hinge', 'strength_glutes_legs'] }, // h304_julian_kb_sumo_deadlift
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1791000200/mood/v3/cart_heroes/alts/athletic_power__h305_julian_backward_mb_throw.jpg', archetypes: ['athletic_power', 'athletic_full_body'] }, // h305_julian_backward_mb_throw
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965531/mood/v3/cart_heroes/alts/sweat_circuit__s01_mei_jump_rope.jpg', archetypes: ['sweat_circuit', 'sweat_engine', 'sweat_hybrid'] }, // s01_mei_jump_rope
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965528/mood/v3/cart_heroes/alts/athletic_speed_agility__s02_amara_a_skip.jpg', archetypes: ['athletic_speed_agility', 'athletic_full_body'] }, // s02_amara_a_skip
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965528/mood/v3/cart_heroes/alts/athletic_speed_agility__s04_kai_sprint_start.jpg', archetypes: ['athletic_speed_agility', 'athletic_power'] }, // s04_kai_sprint_start
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965532/mood/v3/cart_heroes/alts/sweat_hybrid__s05_wyatt_kb_swing.jpg', archetypes: ['sweat_hybrid', 'sweat_circuit'] }, // s05_wyatt_kb_swing
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965531/mood/v3/cart_heroes/alts/sweat_circuit__s06_julian_battle_ropes.jpg', archetypes: ['sweat_circuit', 'sweat_hybrid', 'sweat_engine'] }, // s06_julian_battle_ropes
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965530/mood/v3/cart_heroes/alts/strength_upper_push__s07_harper_lateral_raise.jpg', archetypes: ['strength_upper_push', 'strength_upper_mixed'] }, // s07_harper_lateral_raise
  { uri: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1790965529/mood/v3/cart_heroes/alts/strength_glutes_legs__s08_noa_walking_lunge.jpg', archetypes: ['strength_glutes_legs', 'strength_lower_squat'] }, // s08_noa_walking_lunge
];

/** Every cart hero photo: the 15 primaries (tagged with their own archetype + V3_PRIMARY_HERO_ALSO), then the alternates. */
export const V3_HERO_LIBRARY: readonly V3HeroPhoto[] = [
  ...(Object.keys(V3_CART_HEROES) as V3CartHeroKey[]).map((k) => ({ uri: V3_CART_HEROES[k], archetypes: [k, ...(V3_PRIMARY_HERO_ALSO[k] ?? [])] })),
  ...V3_CART_HERO_ALTS,
];

/** Every image an archetype can show: its own primary first, then every other library photo tagged with it. */
export const v3HeroPool = (k: V3CartHeroKey): string[] => {
  const pool: string[] = [V3_CART_HEROES[k]];
  for (const p of V3_HERO_LIBRARY) if (p.archetypes.includes(k) && !pool.includes(p.uri)) pool.push(p.uri);
  return pool;
};

const isHeroKey = (id: string | undefined): id is V3CartHeroKey => !!id && Object.prototype.hasOwnProperty.call(V3_CART_HEROES, id);

/** Stable 32-bit FNV-1a hash, so the pick never changes between renders, sessions or devices. */
const hashSeed = (s: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

/** Picks one image from a pool for this workout seed ('' -> the first image, i.e. the archetype primary). */
const pickFrom = (pool: readonly string[], seed: string | null | undefined, salt: string): string =>
  !seed || pool.length === 0 ? pool[0] : pool[hashSeed(`${seed}|${salt}`) % pool.length];

/** Picks one image from the archetype's curated pool for this workout seed ('' -> primary). */
export const pickV3Hero = (k: V3CartHeroKey, seed: string | null | undefined): string => pickFrom(v3HeroPool(k), seed, k);

/** Sweat and Athletic workouts may show any hero shot from their Direction (modalities read interchangeably on a cover);
 *  Strength stays archetype-specific so a leg day never shows a curl. Every hero photo is tagged within ONE Direction only. */
const DIRECTION_WIDE: readonly string[] = ['sweat', 'athletic'];

/** Every curated hero photo tagged with any archetype of this Direction. */
export const v3DirectionHeroPool = (direction: string): string[] => {
  const out: string[] = [];
  for (const p of V3_HERO_LIBRARY) if (p.archetypes.some((a) => a.startsWith(`${direction}_`)) && !out.includes(p.uri)) out.push(p.uri);
  return out;
};

/** The library photos (V3 exercise thumbnails, same visual theme) of the exercises in this workout, limited to photos
 *  owned by this workout's Direction (V3_EXERCISE_PHOTO_DIRECTION) so a photo never appears on two Directions' cards. */
export const v3WorkoutExercisePhotos = (w: V3HeroWorkout): string[] => {
  const out: string[] = [];
  for (const b of w.blocks ?? []) for (const it of b.items ?? []) {
    const id = it.exercise?.id;
    const u = id && V3_EXERCISE_PHOTO_DIRECTION[id] === w.direction ? thumbUrl(id) : null;
    if (u && !out.includes(u)) out.push(u);
  }
  return out;
};

/**
 * The full pool a workout's hero is drawn from: the archetype's curated pool (primary first), then for Sweat / Athletic
 * every hero shot in that Direction, then the library photos of this workout's own exercises.
 */
export const v3WorkoutHeroPool = (w: V3HeroWorkout, k: V3CartHeroKey): string[] => {
  const pool = v3HeroPool(k);
  const add = (u: string) => { if (!pool.includes(u)) pool.push(u); };
  if (DIRECTION_WIDE.includes(w.direction)) v3DirectionHeroPool(w.direction).forEach(add);
  v3WorkoutExercisePhotos(w).forEach(add);
  return pool;
};

const R = (k: V3CartHeroKey, seed?: string | null): V3HeroSource => ({ kind: 'remote', uri: pickV3Hero(k, seed) });
/** Hero for a workout: drawn from its full pool (see v3WorkoutHeroPool). */
const RW = (w: V3HeroWorkout, k: V3CartHeroKey, seed: string | null): V3HeroSource => ({ kind: 'remote', uri: pickFrom(v3WorkoutHeroPool(w, k), seed, k) });
const A = (key: V3HeroAssetKey): V3HeroSource => ({ kind: 'asset', key });


/** Target muscles -> image, checked in order (first muscle group that matches wins). */
const V3_TARGET_HERO: { muscles: string[]; hero: V3CartHeroKey }[] = [
  { muscles: ['chest', 'shoulders', 'triceps'], hero: 'strength_upper_push' },
  { muscles: ['back', 'lats', 'upper_back', 'biceps'], hero: 'strength_upper_pull' },
  { muscles: ['quads', 'hamstrings', 'glutes', 'calves', 'legs'], hero: 'strength_glutes_legs' },
  { muscles: ['core', 'abs', 'obliques'], hero: 'strength_core' },
];

const V3_DIRECTION_HERO: Record<string, V3HeroSource> = {
  strength: A('strength'),
  sweat: R('sweat_circuit'),
  athletic: A('athletic'),
};

/** Portrait image for the Home hero, by Direction (bundled, so the hero never waits on the network). */
export const V3_HOME_HERO: Record<string, V3HeroAssetKey> = { strength: 'strength', sweat: 'sweat', athletic: 'athletic' };

export interface V3HeroWorkout {
  /** Seeds the alternate-hero pick; absent / null -> primary image. */
  workout_id?: string | null;
  created_at?: string;
  direction: string;
  archetype: { id: string };
  target?: { mode?: string; muscles?: string[] } | null;
  blocks?: { items: { exercise?: { id?: string; media?: { thumbnail_url?: string | null } | null } | null }[] }[];
}

export function resolveV3CartHero(w: V3HeroWorkout): { source: V3HeroSource; reason: V3HeroReason } {
  const seed = w.workout_id || w.created_at || null;
  const id = w.archetype?.id;
  if (isHeroKey(id)) return { source: RW(w, id, seed), reason: 'archetype' };
  const muscles = w.target && w.target.mode === 'explicit' ? w.target.muscles ?? [] : [];
  for (const m of muscles) {
    const hit = V3_TARGET_HERO.find((t) => t.muscles.includes(m));
    if (hit) return { source: RW(w, hit.hero, seed), reason: 'target' };
  }
  // Exercise-video thumbnails are never used as Cart imagery (founder policy: static photos only); fall to the Direction image.
  return { source: V3_DIRECTION_HERO[w.direction] ?? A('strength'), reason: 'direction' };
}
