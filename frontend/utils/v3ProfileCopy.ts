/**
 * MOOD V3 — deterministic onboarding / profile-reveal copy.
 *
 * Every sentence here maps to real V3 behaviour (backend/mood_v3):
 *  • training preference → default Direction on Home
 *  • goal → which sessions MOOD's Pick serves first (Strength / Sweat), Sweat
 *    engine style, Athletic support work; it does NOT make Strength sets/reps
 *    goal-specific, so no copy claims that
 *  • experience → exercise eligibility / complexity gates in every Direction
 *  • frequency → Strength MOOD's Pick: 1–2 = full body, 3–4 = split rotation,
 *    5+ = full split incl. hinge + arms days
 *  • barrier → first-session setup only (and future notification copy)
 * No LLM, no network: composable templates only.
 */
import type { Barrier, Direction, Experience, TrainingFrequency, TrainingPreference, TrainingProfile, V3Goal } from './v3Profile';
import { DIRECTION_LABEL, defaultDirectionFor, experienceLabel, goalLabel, preferenceLabel } from './v3Profile';

/* ------------------------------------------------------------------ question reactions */

export const PREFERENCE_REACTIONS: Record<TrainingPreference, string> = {
  lifting: 'Strength sessions become your default. Sweat and Athletic are always one tap away.',
  conditioning: 'Sweat sessions become your default. Strength and Athletic are always one tap away.',
  athletic: 'Athletic sessions become your default. Strength and Sweat are always one tap away.',
  mix: "We'll use your goal to pick where to start. Every style stays one tap away.",
};

export const GOAL_REACTIONS: Record<V3Goal, string> = {
  build_strength: "MOOD's Pick will lead with heavy, compound-first strength sessions.",
  lose_weight_conditioning: "MOOD's Pick will lean into sweat and conditioning sessions.",
  build_muscle: "MOOD's Pick will lead with muscle-building strength sessions.",
  improve_athleticism: "MOOD's Pick will lean into power, speed and athletic sessions.",
  feel_better_reduce_stress: 'Steady, approachable sessions that leave you better than you started.',
  stay_consistent: 'Sessions rotate so every workout feels different and showing up stays easy.',
};

export const EXPERIENCE_REACTIONS: Record<Experience, string> = {
  beginner: "We'll program movements you can do well, and build from there.",
  intermediate: 'Most of the exercise library is open to you. The most technical lifts stay reserved.',
  advanced: 'Every movement is on the table, including the technical ones.',
};

export const FREQUENCY_REACTIONS: Record<TrainingFrequency, string> = {
  '1-2': 'Strength days will be full-body, so every session covers everything.',
  '3-4': 'Strength days will rotate through upper, lower and pull-focused sessions.',
  '5+': 'Strength days will rotate a full split, including dedicated hinge and arm days.',
};

export const BARRIER_REACTIONS: Record<Barrier, string> = {
  time: "Your first session will put the 30-minute option front and center.",
  low_energy: 'Your first session starts with Low Energy selected. Change it anytime.',
  motivation: "One tap to start. MOOD's Pick handles the plan.",
  dont_know: "MOOD's Pick builds the whole session. You just press start.",
  boredom: 'Your first session starts with Bored selected, for more variety.',
};

/* ------------------------------------------------------------------ reveal */

export interface ProfileInsight {
  eyebrow: string;
  title: string;
  body: string;
  icon: 'flash' | 'sparkles' | 'time-outline' | 'battery-charging' | 'compass' | 'play' | 'shuffle' | 'barbell' | 'layers';
}

const STRENGTH_ROTATION: Record<TrainingFrequency, string> = {
  '1-2': 'your Strength days are full-body sessions that cover every major muscle group',
  '3-4': "MOOD's Pick rotates upper, lower and pull-focused Strength days",
  '5+': "MOOD's Pick rotates a full split, including dedicated hinge and arm days",
};

const DIRECTION_STARTS: Record<Direction, string> = {
  strength: '',
  sweat: "MOOD's Pick rotates circuits, engine intervals and hybrid sessions",
  athletic: "MOOD's Pick rotates full-body athlete, power, and speed + agility sessions",
};

function startInsight(p: TrainingProfile, dir: Direction): ProfileInsight {
  const freq = p.training_frequency ?? '3-4';
  const how = dir === 'strength' ? STRENGTH_ROTATION[freq] : DIRECTION_STARTS[dir];
  const lead =
    p.training_preference === 'mix'
      ? `You like variety, so your goal picks the starting point: ${DIRECTION_LABEL[dir]}.`
      : `Your default is ${DIRECTION_LABEL[dir]}.`;
  return {
    eyebrow: 'HOW MOOD STARTS YOU',
    title: `${DIRECTION_LABEL[dir]} · 60 min`,
    body: `${lead} ${how.charAt(0).toUpperCase()}${how.slice(1)}. Switch style or go 30 minutes any day.`,
    icon: 'layers',
  };
}

const EDGE: Record<Barrier, ProfileInsight> = {
  boredom: {
    eyebrow: 'YOUR EDGE', title: 'Keeping training fresh.', icon: 'shuffle',
    body: "When things feel stale, tell MOOD you're bored. We'll bring in more movement and structure variety while keeping the workout purposeful.",
  },
  low_energy: {
    eyebrow: 'YOUR EDGE', title: 'Training on a low battery.', icon: 'battery-charging',
    body: "When energy is low, tell MOOD. We'll adjust the workout while keeping the session worthwhile.",
  },
  time: {
    eyebrow: 'YOUR EDGE', title: 'Making short sessions count.', icon: 'time-outline',
    body: 'Short on time? Switch any workout to 30 minutes. MOOD keeps the main work and trims the rest.',
  },
  motivation: {
    eyebrow: 'YOUR EDGE', title: 'Getting you started.', icon: 'play',
    body: "Skip the planning. MOOD's Pick builds a complete session from your profile, so starting is one tap.",
  },
  dont_know: {
    eyebrow: 'YOUR EDGE', title: 'Taking out the guesswork.', icon: 'compass',
    body: "MOOD's Pick chooses the exercises, sets, reps and rest for you, and tells you why it built today's session the way it did.",
  },
};

const LEVEL: Record<Experience, ProfileInsight> = {
  beginner: {
    eyebrow: 'BUILT FOR YOUR LEVEL', title: 'Movements you can own.', icon: 'barbell',
    body: 'Every exercise is matched to your experience, so you build skill and confidence session by session.',
  },
  intermediate: {
    eyebrow: 'BUILT FOR YOUR LEVEL', title: 'Most of the library, unlocked.', icon: 'barbell',
    body: 'You get the full range of gym movements. The most technical lifts stay reserved for advanced athletes.',
  },
  advanced: {
    eyebrow: 'BUILT FOR YOUR LEVEL', title: 'Everything unlocked.', icon: 'flash',
    body: 'Technical lifts, Olympic variations and advanced power work are all in play when they fit the session.',
  },
};

export interface ProfileReveal {
  headline: string;         // e.g. "Advanced · 5+ days / week"
  focus: string;            // goal label
  style: string;            // preference label
  direction: Direction;
  insights: ProfileInsight[];
}

export function buildProfileReveal(p: TrainingProfile, serverDirection?: Direction): ProfileReveal {
  const dir = serverDirection ?? defaultDirectionFor(p);
  const freq = p.training_frequency ? `${p.training_frequency.replace('-', '–')} days / week` : '';
  const insights: ProfileInsight[] = [startInsight(p, dir)];
  if (p.biggest_barrier) insights.push(EDGE[p.biggest_barrier]);
  if (p.experience) insights.push(LEVEL[p.experience]);
  return {
    headline: [experienceLabel(p.experience), freq].filter(Boolean).join(' · '),
    focus: goalLabel(p.goal),
    style: preferenceLabel(p.training_preference),
    direction: dir,
    insights,
  };
}

/** Reveal-loading stream: the profile being "processed", line by line. */
export function processingLines(p: TrainingProfile): string[] {
  const dir = defaultDirectionFor(p);
  return [
    'Reading your answers…',
    `TRAINING STYLE → ${preferenceLabel(p.training_preference).toUpperCase()}`,
    `GOAL → ${goalLabel(p.goal).toUpperCase()}`,
    `EXPERIENCE → ${experienceLabel(p.experience).toUpperCase()}`,
    `FREQUENCY → ${(p.training_frequency ?? '').replace('-', '–')} DAYS / WEEK`,
    `BIGGEST BARRIER → ${barrierUpper(p.biggest_barrier)}`,
    'Matching exercises to your experience',
    `Setting your default session: ${DIRECTION_LABEL[dir]} · 60 min`,
    'Saving your MOOD profile',
  ];
}

function barrierUpper(b?: Barrier): string {
  return ({ time: 'TIME', low_energy: 'LOW ENERGY', motivation: 'MOTIVATION', dont_know: "DON'T KNOW WHAT TO DO", boredom: 'BOREDOM' } as const)[b as Barrier] ?? '';
}

/** Radar values (0–1) for the six reveal axes — a picture of the answers, not a score. */
export const RADAR_AXES = ['Strength', 'Conditioning', 'Power', 'Experience', 'Frequency', 'Variety'];
export function radarValues(p: TrainingProfile): number[] {
  const pref = p.training_preference ?? 'mix';
  const goal = p.goal ?? 'stay_consistent';
  const strength = ({ lifting: 0.85, conditioning: 0.35, athletic: 0.55, mix: 0.6 } as const)[pref] + (goal === 'build_strength' || goal === 'build_muscle' ? 0.12 : 0);
  const conditioning = ({ lifting: 0.35, conditioning: 0.85, athletic: 0.5, mix: 0.6 } as const)[pref] + (goal === 'lose_weight_conditioning' ? 0.12 : 0);
  const power = ({ lifting: 0.45, conditioning: 0.35, athletic: 0.9, mix: 0.6 } as const)[pref] + (goal === 'improve_athleticism' ? 0.1 : 0);
  const experience = ({ beginner: 0.35, intermediate: 0.65, advanced: 0.92 } as const)[p.experience ?? 'intermediate'];
  const frequency = ({ '1-2': 0.35, '3-4': 0.65, '5+': 0.92 } as const)[p.training_frequency ?? '3-4'];
  const variety = (pref === 'mix' ? 0.75 : 0.45) + (p.biggest_barrier === 'boredom' ? 0.2 : 0) + (goal === 'stay_consistent' ? 0.1 : 0);
  return [strength, conditioning, power, experience, frequency, variety].map((v) => Math.max(0.08, Math.min(1, v)));
}
