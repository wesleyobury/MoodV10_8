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
}

export const MOOD_INTRO_COPY: Record<string, MoodIntroCopy> = {
  sweat: {
    headline: "Let's get your heart rate up.",
    body: 'Pick the type of session — cardio-driven or light weights for a sweat. Build it yourself or let MOOD generate one for you.',
    cta: "Let's go",
  },
  muscle: {
    headline: 'Time to build.',
    body: 'Choose the muscle groups you want to hit today. Build a workout from our exercise library, or have one auto-generated based on your profile.',
    cta: "Let's go",
  },
  explosive: {
    headline: 'Power mode.',
    body: "Pick your style — bodyweight for raw athleticism, or light weight to add load. We'll structure the work.",
    cta: "Let's go",
  },
  lazy: {
    headline: 'Low effort, real results.',
    body: "Choose bodyweight or weight-based. We'll keep it efficient — minimum setup, maximum return.",
    cta: "Let's go",
  },
  calisthenics: {
    headline: 'Bodyweight, refined.',
    body: "Tell us what equipment you have access to — even if it's just the floor. We'll match exercises to your space and your level.",
    cta: "Let's go",
  },
  outdoor: {
    headline: 'Take it outside.',
    body: "Tell us what equipment you've got with you — bench, bars, none. We'll build a session that fits your space.",
    cta: "Let's go",
  },
};

export const MOOD_INTRO_FALLBACK: MoodIntroCopy = {
  headline: "Let's build your session.",
  body: "Make a few quick choices and we'll put together a workout tuned to you.",
  cta: "Let's go",
};

export function moodIntroCopy(moodId: string | null | undefined): MoodIntroCopy {
  if (moodId && MOOD_INTRO_COPY[moodId]) return MOOD_INTRO_COPY[moodId];
  return MOOD_INTRO_FALLBACK;
}
