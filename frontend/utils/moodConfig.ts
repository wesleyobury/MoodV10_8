/**
 * MOOD V2 — mood interstitial copy (Phase 5.1).
 *
 * Keyed by the real funnel MoodId (sweat | muscle | explosive | lazy |
 * calisthenics | outdoor). Shown on the mood-intro screen after wearables
 * connect, before the first decision screen, to set context for the chosen mood.
 */
import type { MoodId } from './moodRoute';

export interface MoodIntroCopy {
  headline: string;
  body: string;
  cta: string;
  /** Brief "what to expect" overview of the path through the achievement card.
   *  Step count varies by mood: paths that skip the muscle/training-type
   *  screen (calisthenics, outdoor) have one fewer step. */
  steps: string[];
}

export const MOOD_INTRO_COPY: Record<string, MoodIntroCopy> = {
  sweat: {
    headline: "Let's get your heart rate up.",
    body: 'Pick the type of session — cardio-driven or light weights for a sweat. Build it yourself, or tap Generate to have MOOD build one for you.',
    cta: "Let's go",
    steps: ['Pick your session type', 'Choose equipment & level', 'Build your cart', 'Train & earn your card'],
  },
  muscle: {
    headline: 'Time to build.',
    body: 'Choose the muscle groups you want to hit today. Build from our exercise library, or tap Generate to have MOOD build it for you.',
    cta: "Let's go",
    steps: ['Pick your muscle groups', 'Choose equipment & level', 'Build your cart', 'Train & earn your card'],
  },
  explosive: {
    headline: 'Power mode.',
    body: "Pick your style — bodyweight for raw athleticism, or light weight to add load. Build it yourself, or tap Generate and we'll structure the work.",
    cta: "Let's go",
    steps: ['Pick your style', 'Choose equipment & level', 'Build your cart', 'Train & earn your card'],
  },
  lazy: {
    headline: 'Low effort, real results.',
    body: "Choose bodyweight or weight-based. Build it yourself, or tap Generate to keep it effortless — minimum setup, maximum return.",
    cta: "Let's go",
    steps: ['Pick your style', 'Choose equipment & level', 'Build your cart', 'Train & earn your card'],
  },
  calisthenics: {
    headline: 'Bodyweight, refined.',
    body: "Tell us what equipment you have — even if it's just the floor. Build from matched exercises, or tap Generate and we'll do it for you.",
    cta: "Let's go",
    steps: ['Pick your equipment & level', 'Build your cart', 'Train & earn your card'],
  },
  outdoor: {
    headline: 'Take it outside.',
    body: "Tell us what equipment you've got with you — bench, bars, none. Build your session, or tap Generate to have MOOD build it for you.",
    cta: "Let's go",
    steps: ['Pick your equipment & level', 'Build your cart', 'Train & earn your card'],
  },
};

export const MOOD_INTRO_FALLBACK: MoodIntroCopy = {
  headline: "Let's build your session.",
  body: "Make a few quick choices and we'll put together a workout tuned to you.",
  cta: "Let's go",
  steps: ['Make a few quick choices', 'Build your cart', 'Train & earn your card'],
};

export function moodIntroCopy(moodId: string | null | undefined): MoodIntroCopy {
  if (moodId && MOOD_INTRO_COPY[moodId]) return MOOD_INTRO_COPY[moodId];
  return MOOD_INTRO_FALLBACK;
}
