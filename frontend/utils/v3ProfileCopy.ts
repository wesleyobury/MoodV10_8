/**
 * MOOD V3 — deterministic onboarding / profile-reveal copy.
 *
 * Every sentence here maps to real V3 behaviour (backend/mood_v3). No LLM, no network: composable templates only.
 *  • training preference → default Direction on Home / Build
 *  • goal → which sessions MOOD's Pick serves first (Strength / Sweat), Sweat engine style, Athletic support work;
 *    it does NOT make Strength sets/reps goal-specific, so no copy claims that
 *  • experience → exercise eligibility / complexity gates in every Direction (beginner / intermediate / advanced). The
 *    onboarding rungs map: getting_started → beginner, basics → intermediate, consistent + serious → advanced
 *  • frequency → Strength MOOD's Pick: 1–2 = full body, 3–4 = split rotation, 5+ = full split incl. hinge + arms days
 *  • barrier → first-session setup (States prefill, 30-min suggestion, MOOD's Pick emphasis) and future copy
 *  • daily States → the "what MOOD will do differently" lines mirror backend/mood_v3/explain.py STATE lines
 */
import type { Barrier, Direction, ExperienceDetail, TrainingFrequency, TrainingPreference, TrainingProfile, V3Goal } from './v3ProfileOptions';
import { DIRECTION_LABEL, defaultDirectionFor, detailFromExperience } from './v3ProfileOptions';

/* ------------------------------------------------------------------ question reactions */

/** A reaction = the consequence of an answer: a short tag ("what changed") + one line ("how"). */
export interface Reaction {
  tag: string;
  text: string;
}

export const PREFERENCE_REACTIONS: Record<TrainingPreference, Reaction> = {
  lifting: { tag: 'Default set · Strength', text: 'Compound lifts lead. Every Strength session is built around a protected main lift.' },
  conditioning: { tag: 'Default set · Sweat', text: 'Circuits, engine intervals and hybrid sessions that use all the time you give them.' },
  athletic: { tag: 'Default set · Athletic', text: 'Power, speed and full-body athlete sessions. Quality reps, never sloppy ones.' },
  mix: { tag: 'Default set · Goal-led', text: 'Your goal decides where MOOD starts. Strength, Sweat and Athletic stay one tap away.' },
};

export const GOAL_REACTIONS: Record<V3Goal, Reaction> = {
  build_strength: { tag: 'Priority set', text: "MOOD's Pick leads with heavy, compound-first strength days." },
  build_muscle: { tag: 'Priority set', text: "MOOD's Pick leads with muscle-building strength days." },
  lose_weight_conditioning: { tag: 'Priority set', text: "MOOD's Pick leans into Sweat: conditioning that keeps you working the whole session." },
  improve_athleticism: { tag: 'Priority set', text: "MOOD's Pick leans into power, speed and athletic work." },
  feel_better_reduce_stress: { tag: 'Priority set', text: 'Steady, approachable sessions that leave you better than you started.' },
  stay_consistent: { tag: 'Priority set', text: 'Sessions rotate so no two feel the same, and showing up stays easy.' },
};

export const EXPERIENCE_REACTIONS: Record<ExperienceDetail, Reaction> = {
  getting_started: { tag: 'Exercise pool · Foundations', text: 'Movements you can own from day one. MOOD builds up from there.' },
  basics: { tag: 'Exercise pool · Full gym', text: 'Most of the library opens up. The most technical lifts stay reserved for now.' },
  consistent: { tag: 'Exercise pool · Full library', text: 'Every movement MOOD programs is open to you, technical lifts included.' },
  serious: { tag: 'Exercise pool · Advanced', text: 'Everything is on the table, technical and Olympic variations included. Less hand-holding.' },
};

export const FREQUENCY_REACTIONS: Record<TrainingFrequency, Reaction> = {
  '1-2': { tag: 'Week planned · Full body', text: 'Strength days go full-body, so every session covers what matters.' },
  '3-4': { tag: 'Week planned · Rotation', text: 'Strength days rotate upper, lower and pull-focused sessions across your week.' },
  '5+': { tag: 'Week planned · Full split', text: 'Strength days run a full split, with dedicated hinge and arm days.' },
};

export const BARRIER_REACTIONS: Record<Barrier, Reaction> = {
  dont_know: { tag: "That's what MOOD removes", text: 'Open the app, tell MOOD where you’re at, and your session is built. Exercises, sets, rest, all of it.' },
  boredom: { tag: 'Then repetition is the enemy', text: 'Tell MOOD you’re bored and it changes the movements and the session structure, not just the order. Your first session starts there.' },
  time: { tag: 'Every minute earns its place', text: 'Your first session puts the 30-minute option up front. The main work stays; the rest gets cut.' },
  low_energy: { tag: 'A different workout, not a skipped one', text: 'Your first session starts with Low Energy on: steadier movements, still a real session. Change it anytime.' },
  motivation: { tag: 'Starting becomes one tap', text: "MOOD's Pick builds the whole session for you. All you do is press start." },
};

/* ------------------------------------------------------------------ profile progress */

/** "Your profile is taking shape · 60%": every tap moves it, before Continue. */
export function profileProgress(answeredBefore: number, hasPending: boolean, total = 5): number {
  const n = Math.max(0, Math.min(total, answeredBefore + (hasPending ? 1 : 0)));
  return Math.round((n / total) * 100);
}

export function profileProgressLabel(pct: number): string {
  if (pct <= 0) return "Let's build your profile";
  if (pct >= 100) return 'Profile complete';
  return 'Your profile is taking shape';
}

/* ------------------------------------------------------------------ construction (what MOOD learned) */

export interface Conclusion {
  id: 'direction' | 'goal' | 'experience' | 'frequency' | 'barrier';
  label: string;
}

const DIRECTION_FIRST: Record<Direction, string> = { strength: 'Strength-first training', sweat: 'Sweat-first training', athletic: 'Athletic-first training' };
const GOAL_CONCLUSION: Record<V3Goal, string> = {
  build_strength: 'Heavy compound priority',
  build_muscle: 'Muscle-building priority',
  lose_weight_conditioning: 'Conditioning priority',
  improve_athleticism: 'Power & speed priority',
  feel_better_reduce_stress: 'Steady, sustainable sessions',
  stay_consistent: 'Rotating session styles',
};
const POOL_CONCLUSION: Record<ExperienceDetail, string> = {
  getting_started: 'Foundational exercise pool',
  basics: 'Full gym exercise pool',
  consistent: 'Full exercise library',
  serious: 'Advanced exercise pool',
};
const FREQ_CONCLUSION: Record<TrainingFrequency, string> = {
  '1-2': '1–2 days a week · full body',
  '3-4': '3–4 days a week · split rotation',
  '5+': '5+ days a week · full split',
};
const BARRIER_CONCLUSION: Record<Barrier, string> = {
  time: '30-minute option up front',
  low_energy: 'Low-energy first session',
  motivation: 'One-tap starts',
  dont_know: 'Fully built sessions',
  boredom: 'Higher variety',
};

/** The settings MOOD actually derived, in the order they lock in on the construction screen. */
export function profileConclusions(p: TrainingProfile, detail?: ExperienceDetail): Conclusion[] {
  const dir = defaultDirectionFor(p);
  const out: Conclusion[] = [];
  out.push({ id: 'direction', label: p.training_preference === 'mix' ? `Goal-led · starts with ${DIRECTION_LABEL[dir]}` : DIRECTION_FIRST[dir] });
  if (p.goal) out.push({ id: 'goal', label: GOAL_CONCLUSION[p.goal] });
  const d = detail ?? detailFromExperience(p.experience);
  if (d) out.push({ id: 'experience', label: POOL_CONCLUSION[d] });
  if (p.training_frequency) out.push({ id: 'frequency', label: FREQ_CONCLUSION[p.training_frequency] });
  if (p.biggest_barrier) out.push({ id: 'barrier', label: BARRIER_CONCLUSION[p.biggest_barrier] });
  return out;
}

/* ------------------------------------------------------------------ reveal */

export interface Adaptation {
  /** "When you're amped" */
  when: string;
  /** what MOOD does, in one sentence */
  does: string;
}

export interface ProfileIdentity {
  /** "WESLEY'S TRAINING PROFILE" */
  eyebrow: string;
  /** "The Performance Builder" */
  archetype: string;
  /** one sentence under the archetype */
  tagline: string;
  direction: Direction;
  /** "Strength" or "Goal-led · Strength first" */
  primaryDirection: string;
  /** "Advanced movements · 4×/week · High variety · 60 min" */
  training: string[];
  adaptations: Adaptation[];
}

type Variety = 'High' | 'Moderate' | 'Focused';

function varietyOf(p: TrainingProfile): Variety {
  if (p.biggest_barrier === 'boredom' || p.goal === 'stay_consistent' || p.training_preference === 'mix') return 'High';
  if (p.training_preference === 'conditioning' || p.training_preference === 'athletic') return 'Moderate';
  return 'Focused';
}

const ARCHETYPE_BY_GOAL: Record<V3Goal, string> = {
  build_strength: 'The Strength Builder',
  build_muscle: 'The Physique Builder',
  lose_weight_conditioning: 'The Engine Builder',
  improve_athleticism: 'The Performance Athlete',
  feel_better_reduce_stress: 'The Steady Athlete',
  stay_consistent: 'The Everyday Athlete',
};

/** A name for the combination, not a score. Deterministic: same answers, same name. */
export function archetypeName(p: TrainingProfile): string {
  const goal = p.goal ?? 'stay_consistent';
  const pref = p.training_preference;
  const lifting = goal === 'build_strength' || goal === 'build_muscle';
  if (pref === 'athletic' && lifting) return 'The Performance Builder';
  if (pref === 'conditioning' && lifting) return 'The Hybrid Builder';
  if (pref === 'lifting' && goal === 'lose_weight_conditioning') return 'The Lean Builder';
  if (pref === 'lifting' && goal === 'improve_athleticism') return 'The Power Builder';
  if (pref === 'mix' && goal !== 'stay_consistent' && goal !== 'feel_better_reduce_stress') return 'The Hybrid Athlete';
  return ARCHETYPE_BY_GOAL[goal];
}

const BIAS: Record<Direction, string> = { strength: 'Strong training bias.', sweat: 'Conditioning-first.', athletic: 'Athletic training bias.' };

function tagline(p: TrainingProfile, dir: Direction, variety: Variety): string {
  const bias = p.training_preference === 'mix' ? 'A little of everything.' : BIAS[dir];
  const v = variety === 'High' ? 'High variety.' : variety === 'Moderate' ? 'Balanced variety.' : 'Focused structure.';
  return `${bias} ${v} Built to push when you're ready and adapt when you're not.`;
}

const POOL_TAG: Record<ExperienceDetail, string> = {
  getting_started: 'Foundational movements',
  basics: 'Full gym library',
  consistent: 'Full movement library',
  serious: 'Advanced movements',
};
const FREQ_TAG: Record<TrainingFrequency, string> = { '1-2': '1–2 days/week', '3-4': '3–4 days/week', '5+': '5+ days/week' };

/* Daily-State lines: mirror backend/mood_v3/explain.py (STATE + direction-specific lines). */
const AMPED: Record<Direction, string> = {
  strength: 'The extra energy goes into higher intent on the main work, not a longer list of exercises.',
  sweat: 'Denser, harder conditioning where it fits, without ending the session early.',
  athletic: 'More quality efforts, never at the cost of speed.',
};
const LOW_ENERGY: Record<Direction, string> = {
  strength: 'Stable, low-friction movements keep it productive without piling on fatigue. A different challenge, not a recovery day.',
  sweat: 'Stable, low-friction stations keep the session productive without piling on fatigue. Still a full session.',
  athletic: 'Simple, low-impact explosive work keeps the quality high without burying you.',
};
const ADAPT: Record<'bored' | 'stressed' | 'sore', Adaptation> = {
  bored: { when: "When you're bored", does: 'New movements and a different session structure, not just a reshuffled list.' },
  stressed: { when: "When you're stressed", does: "Rhythmic, predictable work. You won't be racing the clock, and you still get a complete session." },
  sore: { when: "When you're sore", does: 'Tell MOOD where. The session trains around it instead of skipping the day.' },
};
const BARRIER_ADAPT: Partial<Record<Barrier, Adaptation>> = {
  time: { when: "When you're short on time", does: 'Switch to 30 minutes. MOOD keeps the main work and cuts what doesn’t earn its place.' },
  dont_know: { when: "When you don't know what to do", does: "MOOD's Pick chooses the exercises, sets, reps and rest, and tells you why." },
  motivation: { when: "When you can't get going", does: "One tap. MOOD's Pick has the whole session built before you've talked yourself out of it." },
};

/** Three "what MOOD will do differently for you" lines, led by the athlete's own barrier. */
export function adaptationsFor(p: TrainingProfile, dir: Direction): Adaptation[] {
  const out: Adaptation[] = [];
  const add = (a: Adaptation) => { if (!out.some((x) => x.when === a.when)) out.push(a); };
  const low = { when: "When you're low on energy", does: LOW_ENERGY[dir] };
  const amped = { when: "When you're amped", does: AMPED[dir] };
  const b = p.biggest_barrier;
  if (b === 'low_energy') add(low);
  else if (b === 'boredom') add(ADAPT.bored);
  else if (b && BARRIER_ADAPT[b]) add(BARRIER_ADAPT[b]!);
  if (p.goal === 'feel_better_reduce_stress') add(ADAPT.stressed);
  add(amped);
  add(low);
  add(ADAPT.bored);
  return out.slice(0, 3);
}

export function possessiveName(first?: string | null): string {
  const n = (first ?? '').trim();
  if (!n) return 'YOUR';
  const up = n.toUpperCase();
  return up.endsWith('S') ? `${up}’` : `${up}’S`;
}

export function profileIdentity(p: TrainingProfile, opts: { firstName?: string | null; detail?: ExperienceDetail; serverDirection?: Direction } = {}): ProfileIdentity {
  const dir = opts.serverDirection ?? defaultDirectionFor(p);
  const variety = varietyOf(p);
  const d = opts.detail ?? detailFromExperience(p.experience);
  const minutes = p.biggest_barrier === 'time' ? '30–60 min' : '60 min';
  const training = [d ? POOL_TAG[d] : null, p.training_frequency ? FREQ_TAG[p.training_frequency] : null, `${variety} variety`, minutes].filter(Boolean) as string[];
  return {
    eyebrow: `${possessiveName(opts.firstName)} TRAINING PROFILE`,
    archetype: archetypeName(p),
    tagline: tagline(p, dir, variety),
    direction: dir,
    primaryDirection: p.training_preference === 'mix' ? `Goal-led · ${DIRECTION_LABEL[dir]} first` : DIRECTION_LABEL[dir],
    training,
    adaptations: adaptationsFor(p, dir),
  };
}

/** Radar values (0–1) for the six profile axes — a picture of the answers, not a score. */
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
