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
    body: 'Pick the kind of session you feel like today.',
    cta: "Let's go",
    steps: ['Pick your session type', 'Choose equipment & level', 'Build your workout'],
  },
  muscle: {
    headline: 'Time to build.',
    body: 'Choose the muscle groups you want to hit today.',
    cta: "Let's go",
    steps: ['Pick your muscle groups', 'Choose equipment & level', 'Build your workout'],
  },
  explosive: {
    headline: 'Power mode.',
    body: 'Pick the style of power work you want today.',
    cta: "Let's go",
    steps: ['Pick your style', 'Choose equipment & level', 'Build your workout'],
  },
  lazy: {
    headline: 'Low effort, real results.',
    body: 'Keep it easy — pick how you want to move today.',
    cta: "Let's go",
    steps: ['Pick your style', 'Choose equipment & level', 'Build your workout'],
  },
  calisthenics: {
    headline: 'Bodyweight, refined.',
    body: "Tell us what you've got — even just the floor.",
    cta: "Let's go",
    steps: ['Choose equipment & level', 'Build your workout'],
  },
  outdoor: {
    headline: 'Take it outside.',
    body: "Tell us what you've brought — bench, bars, or nothing.",
    cta: "Let's go",
    steps: ['Choose equipment & level', 'Build your workout'],
  },
};

export const MOOD_INTRO_FALLBACK: MoodIntroCopy = {
  headline: "Let's build your session.",
  body: "Make a few quick choices and we'll tune it to you.",
  cta: "Let's go",
  steps: ['Choose equipment & level', 'Build your workout'],
};

export function moodIntroCopy(moodId: string | null | undefined): MoodIntroCopy {
  if (moodId && MOOD_INTRO_COPY[moodId]) return MOOD_INTRO_COPY[moodId];
  return MOOD_INTRO_FALLBACK;
}
