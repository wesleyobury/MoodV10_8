/**
 * MOOD V3 — Training Profile values, labels and pure rules (no React Native imports, so node tests can load it).
 * Re-exported by utils/v3Profile.ts; import from there in app code.
 */

/* ------------------------------------------------------------------ values */

export type TrainingPreference = 'lifting' | 'conditioning' | 'athletic' | 'mix';
export type V3Goal =
  | 'build_strength'
  | 'lose_weight_conditioning'
  | 'build_muscle'
  | 'improve_athleticism'
  | 'feel_better_reduce_stress'
  | 'stay_consistent';
export type Experience = 'beginner' | 'intermediate' | 'advanced';
export type TrainingFrequency = '1-2' | '3-4' | '5+';
export type Barrier = 'time' | 'low_energy' | 'motivation' | 'dont_know' | 'boredom';
export type Direction = 'strength' | 'sweat' | 'athletic';
export type ProfileSource = 'onboarding_v3' | 'reonboarding_v3' | 'user_edit';
/** new = signup funnel; upgrade = existing user's first V3 open; edit = Settings. */
export type V3FunnelMode = 'new' | 'upgrade' | 'edit';

export interface TrainingProfile {
  training_preference?: TrainingPreference;
  goal?: V3Goal;
  experience?: Experience;
  training_frequency?: TrainingFrequency;
  biggest_barrier?: Barrier;
  default_duration?: 30 | 60;
  default_equipment?: 'commercial_gym' | 'free_weight_limited' | 'minimal';
  profile_source?: ProfileSource;
  completed_at?: string;
  updated_at?: string;
}

export interface TrainingProfileResponse {
  profile: TrainingProfile;
  complete: boolean;
  default_direction: Direction;
  version: number;
}

export const DEFAULT_DURATION = 60 as const;
export const DEFAULT_EQUIPMENT = 'commercial_gym' as const;

/* ------------------------------------------------------------------ labels */
// Same labels on the funnel and (Phase 2) the Home screen.

export const PREFERENCE_OPTIONS: { id: TrainingPreference; label: string; description: string }[] = [
  // Same vocabulary as the Home Directions (Strength / Sweat / Athletic). Stored IDs unchanged.
  { id: 'lifting', label: 'Strength', description: 'Lift heavy. Build muscle.' },
  { id: 'conditioning', label: 'Sweat', description: 'Conditioning, intervals, engine.' },
  { id: 'athletic', label: 'Athletic', description: 'Power, speed, explosiveness.' },
  { id: 'mix', label: 'Mix It Up', description: 'A little of everything.' },
];
// "What are you really chasing?" Human answers; stored ids unchanged (server + generator contract).
export const GOAL_OPTIONS: { id: V3Goal; label: string }[] = [
  { id: 'build_strength', label: 'Getting stronger' },
  { id: 'build_muscle', label: 'A better physique' },
  { id: 'lose_weight_conditioning', label: 'Leaning out' },
  { id: 'improve_athleticism', label: 'Moving like an athlete' },
  { id: 'feel_better_reduce_stress', label: 'Feeling better, stressing less' },
  { id: 'stay_consistent', label: 'Finally staying consistent' },
];
export const EXPERIENCE_OPTIONS: { id: Experience; label: string; description: string }[] = [
  { id: 'beginner', label: 'Beginner', description: 'Still learning the fundamentals.' },
  { id: 'intermediate', label: 'Intermediate', description: 'Comfortable with most gym movements.' },
  { id: 'advanced', label: 'Advanced', description: 'Years of serious, structured training.' },
];
/**
 * Onboarding asks experience in human terms (four rungs). Each rung maps onto the three server levels that gate
 * exercise eligibility; the rung itself is kept on-device for the funnel (selection state + reveal wording).
 */
export type ExperienceDetail = 'getting_started' | 'basics' | 'consistent' | 'serious';
export const EXPERIENCE_DETAIL_OPTIONS: { id: ExperienceDetail; label: string; description: string; experience: Experience }[] = [
  { id: 'getting_started', label: 'Just getting started', description: 'New to the gym, or back after a long break.', experience: 'beginner' },
  { id: 'basics', label: 'I know the basics', description: 'Comfortable with the main lifts and machines.', experience: 'intermediate' },
  // Consistent trainers get the whole movement library (server level 'advanced'), same as "I train seriously".
  { id: 'consistent', label: 'I train consistently', description: 'A real routine. I know my way around.', experience: 'advanced' },
  { id: 'serious', label: 'I train seriously', description: 'Years of structured training.', experience: 'advanced' },
];
export const experienceFromDetail = (d: ExperienceDetail): Experience =>
  EXPERIENCE_DETAIL_OPTIONS.find((o) => o.id === d)?.experience ?? 'intermediate';
/** Best rung for a stored level (edit mode / older answers without a rung). */
export const detailFromExperience = (e?: Experience): ExperienceDetail | undefined =>
  e === 'beginner' ? 'getting_started' : e === 'intermediate' ? 'basics' : e === 'advanced' ? 'serious' : undefined;
export const FREQUENCY_OPTIONS: { id: TrainingFrequency; label: string; description: string; days: number }[] = [
  { id: '1-2', label: '1–2 days a week', description: 'Getting it in when I can.', days: 2 },
  { id: '3-4', label: '3–4 days a week', description: 'A steady routine.', days: 4 },
  { id: '5+', label: '5+ days a week', description: 'Training is part of my week.', days: 6 },
];
// First-person statements: the barrier question is where MOOD names the problem it solves.
export const BARRIER_OPTIONS: { id: Barrier; label: string; description: string }[] = [
  { id: 'dont_know', label: 'I never know what to do', description: 'I walk in without a plan.' },
  { id: 'boredom', label: 'I get bored', description: 'Same workouts, every time.' },
  { id: 'time', label: "I'm always short on time", description: 'It has to fit the day.' },
  { id: 'low_energy', label: "I'm wiped by the time I get there", description: 'Energy is the bottleneck.' },
  { id: 'motivation', label: 'I struggle to get started', description: 'Starting is the hard part.' },
];

const labelOf = <T extends string>(opts: { id: T; label: string }[], id?: T) => opts.find((o) => o.id === id)?.label ?? '';
export const preferenceLabel = (v?: TrainingPreference) => labelOf(PREFERENCE_OPTIONS, v);
export const goalLabel = (v?: V3Goal) => labelOf(GOAL_OPTIONS, v);
export const experienceLabel = (v?: Experience) => labelOf(EXPERIENCE_OPTIONS, v);
export const frequencyLabel = (v?: TrainingFrequency) => (v ? `${v.replace('-', '–')} days / week` : '');
export const barrierLabel = (v?: Barrier) =>
  ({ time: 'Time', low_energy: 'Low energy', motivation: 'Motivation', dont_know: 'Knowing what to do', boredom: 'Boredom' } as const)[v as Barrier] ?? '';
export const DIRECTION_LABEL: Record<Direction, string> = { strength: 'Strength', sweat: 'Sweat', athletic: 'Athletic' };

/**
 * Default Direction for the Home card. Mirrors the backend rule
 * (mood_v3.normalize.resolve_direction): training preference, then goal, then
 * Strength. The server also returns `default_direction`; prefer that when you
 * have it — this local copy is for rendering before the round-trip lands.
 */
export function defaultDirectionFor(p: TrainingProfile): Direction {
  if (p.training_preference === 'lifting') return 'strength';
  if (p.training_preference === 'conditioning') return 'sweat';
  if (p.training_preference === 'athletic') return 'athletic';
  if (p.goal === 'lose_weight_conditioning') return 'sweat';
  if (p.goal === 'improve_athleticism') return 'athletic';
  return 'strength';
}

export function isProfileComplete(p?: TrainingProfile | null): boolean {
  return !!p && !!p.training_preference && !!p.goal && !!p.experience && !!p.training_frequency && !!p.biggest_barrier;
}

