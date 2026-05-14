/**
 * Featured Workout Hero Image Resolver (P0 — extracted from
 * `app/featured-workout-detail.tsx` to eliminate the recurring
 * priority-inversion bug where the first exercise's image briefly
 * rendered over the carousel hero before the resolver settled.
 *
 * Contract: prefer the workout-level hero (`workout.image`) when present
 * and non-empty. Fall back to the first exercise's `imageUrl` only when
 * the hero is missing or whitespace-only. Returns `undefined` (NOT empty
 * string) when neither exists so the consuming `<Image source>` gracefully
 * shows the underlying placeholder instead of attempting to load a bogus URI.
 *
 * Tests: `utils/featuredHeroImage.test.ts` — run via
 *   yarn test:featured-hero
 */

export interface FeaturedHeroWorkout {
  image?: string | null;
}

export interface FeaturedHeroExercise {
  imageUrl?: string | null;
}

/**
 * Resolve the hero image URI for the featured-workout-detail screen.
 *
 * Priority:
 *   1. `workout.image` (the carousel-matching hero)
 *   2. `exercises[0]?.imageUrl` (legacy fallback)
 *   3. `undefined` (no source — Image component shows placeholder)
 */
export function resolveFeaturedHeroImage(
  workout: FeaturedHeroWorkout | null | undefined,
  exercises: FeaturedHeroExercise[] | null | undefined,
): string | undefined {
  const heroRaw = workout?.image;
  if (typeof heroRaw === 'string' && heroRaw.trim().length > 0) {
    return heroRaw;
  }

  const first = exercises && exercises.length > 0 ? exercises[0] : undefined;
  const firstRaw = first?.imageUrl;
  if (typeof firstRaw === 'string' && firstRaw.trim().length > 0) {
    return firstRaw;
  }

  return undefined;
}

/**
 * Returns true when we were forced to use a fallback because the
 * featured-carousel hero was missing/blank — useful for telemetry or
 * dev-only console warnings to surface broken seed data.
 */
export function isFeaturedHeroFallback(
  workout: FeaturedHeroWorkout | null | undefined,
  exercises: FeaturedHeroExercise[] | null | undefined,
): boolean {
  const heroRaw = workout?.image;
  const heroValid = typeof heroRaw === 'string' && heroRaw.trim().length > 0;
  if (heroValid) return false;

  const first = exercises && exercises.length > 0 ? exercises[0] : undefined;
  const firstRaw = first?.imageUrl;
  return typeof firstRaw === 'string' && firstRaw.trim().length > 0;
}
