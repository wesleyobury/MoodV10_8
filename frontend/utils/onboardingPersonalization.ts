/**
 * Turns onboarding answers into product behaviour.
 *
 * V2.1 — WHY THIS FILE EXISTS. The funnel collected six answers (mood, goal,
 * fitness level, biggest barrier, workout length, first name) and `useOnboardingFunnel()`
 * was read in exactly two places: the funnel screens that WRITE the answers, and
 * mood-intro.tsx for routing. Goal, level, barrier and length were written to
 * AsyncStorage and read by nothing at all — while the payoff screen told the
 * user "we've curated a library of workouts designed specifically for your
 * preferences." This module is the single place those answers turn into
 * behaviour, so there's one mapping to reason about rather than six call sites
 * quietly disagreeing.
 */

import type { FitnessLevel, WorkoutLength } from '../contexts/OnboardingFunnelContext';
import type { IntensityLevel } from '../components/IntensitySelectionModal';

/**
 * Baseline capability -> intensity tier.
 *
 * NOTE these are deliberately DIFFERENT variables, not duplicates:
 *   fitnessLevel = what you can handle in general (stable for months)
 *   intensity    = how hard you want to go TODAY (the whole "mood in, workout
 *                  out" premise, re-chosen every session by design)
 * So this never REPLACES the daily pick — it only decides where that pick
 * starts, turning a cold question into a one-tap confirm.
 */
const LEVEL_TO_INTENSITY: Record<FitnessLevel, IntensityLevel> = {
  sedentary: 'beginner',
  casual: 'beginner',
  active: 'intermediate',
  athletic: 'advanced',
};

/**
 * Preferred session length -> intensity tier.
 *
 * The tiers already carry real duration bands (see SWEAT_LIMITS et al in
 * workoutGenerator.ts): beginner caps ~34 min, intermediate ~52, advanced ~70.
 * Mapping length onto a tier is therefore the one way the user's stated length
 * preference can actually change session duration WITHOUT threading a minutes
 * target through all six per-mood generators.
 *
 * KNOWN GAP: someone who answered "20 min" still gets ~30-40, and "90" still
 * caps around 70, because no tier extends that far. Closing that needs a
 * genuine short tier in the content/limits tables — a separate decision, not
 * something this mapping can fake.
 */
const LENGTH_TO_INTENSITY = (len: WorkoutLength): IntensityLevel => {
  if (len <= 30) return 'beginner';
  if (len <= 45) return 'intermediate';
  return 'advanced';
};

const RANK: Record<IntensityLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };
const BY_RANK: IntensityLevel[] = ['beginner', 'intermediate', 'advanced'];

/**
 * The tier we pre-select for this user, or null if we know nothing about them
 * (in which case the modal keeps its original "nothing selected" behaviour
 * rather than guessing).
 *
 * When level and length disagree we take the LOWER of the two. Suggesting too
 * easy costs a tap; suggesting too hard costs a bad first session — and for an
 * app positioned as "the only fitness app that doesn't yell at you", erring
 * gentle is the on-brand direction.
 */
export function recommendedIntensity(
  fitnessLevel?: FitnessLevel,
  workoutLength?: WorkoutLength,
): IntensityLevel | null {
  const fromLevel = fitnessLevel ? LEVEL_TO_INTENSITY[fitnessLevel] : null;
  const fromLength = workoutLength ? LENGTH_TO_INTENSITY(workoutLength) : null;

  if (fromLevel && fromLength) {
    return BY_RANK[Math.min(RANK[fromLevel], RANK[fromLength])];
  }
  return fromLevel ?? fromLength ?? null;
}
