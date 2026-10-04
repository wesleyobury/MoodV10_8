/**
 * MOOD V3 Home — Today's Workout inputs.
 *
 * Pure state helpers for the Home builder (no React, no network) so the rules
 * are testable: State limits, Sore <-> soreness consistency, Target
 * vocabulary, request construction and applying a conflict option's patch.
 * The server still validates everything; these helpers only keep the UI from
 * offering a request the contract rejects.
 */
import { BODY_MAP_REGIONS } from './v3BodyMap';
import type { V3Direction, V3Equipment, V3Experience, V3GenerateRequest, V3SoreRegion, V3State } from './v3Api';

/* ------------------------------------------------------------------ vocabulary */

export const MAX_STATES = 3;
export const MAX_TARGET_MUSCLES = 3;

export const DIRECTIONS: { id: V3Direction; name: string; descriptor: string; icon: string }[] = [
  { id: 'strength', name: 'Strength', descriptor: 'Lifting, muscle & strength', icon: 'barbell-outline' },
  { id: 'sweat', name: 'Sweat', descriptor: 'Conditioning, HIIT & endurance', icon: 'water-outline' },
  { id: 'athletic', name: 'Athletic', descriptor: 'Power, speed & athleticism', icon: 'rocket-outline' },
];
export const DIRECTION_NAME: Record<V3Direction, string> = { strength: 'Strength', sweat: 'Sweat', athletic: 'Athletic' };

/** API values from CONTRACT.md; order is the on-screen order. */
export const STATES: { id: V3State; label: string; icon: string }[] = [
  { id: 'low_energy', label: 'Low Energy', icon: 'battery-half-outline' },
  { id: 'amped', label: 'Amped', icon: 'flash-outline' },
  { id: 'stressed', label: 'Stressed', icon: 'pulse-outline' },
  { id: 'bored', label: 'Bored', icon: 'shuffle-outline' },
  { id: 'irritated', label: 'Irritated', icon: 'flame-outline' },
  { id: 'sore', label: 'Sore', icon: 'bandage-outline' },
];
export const STATE_LABEL: Record<V3State, string> = Object.fromEntries(STATES.map((s) => [s.id, s.label])) as Record<V3State, string>;

/** Body-map regions, in head-to-toe order, plus the older broad regions (labels only; still accepted from earlier builds). */
export const SORE_REGIONS: { id: V3SoreRegion; label: string }[] = [
  ...BODY_MAP_REGIONS,
  { id: 'legs', label: 'Legs' },
  { id: 'back', label: 'Back' },
  { id: 'arms', label: 'Arms' },
];

/**
 * Target chips (Strength / Sweat). Each maps to user-facing Target muscles from
 * normalize.USER_FACING_TARGETS, or the special 'full_body'. "Arms" is biceps +
 * triceps, so it counts as two of the three allowed muscles.
 */
export const TARGETS: { id: string; label: string; muscles: string[] | 'full_body' }[] = [
  { id: 'full_body', label: 'Full Body', muscles: 'full_body' },
  { id: 'chest', label: 'Chest', muscles: ['chest'] },
  { id: 'back', label: 'Back', muscles: ['back'] },
  { id: 'shoulders', label: 'Shoulders', muscles: ['shoulders'] },
  { id: 'arms', label: 'Arms', muscles: ['biceps', 'triceps'] },
  { id: 'core', label: 'Core', muscles: ['core'] },
  { id: 'quads', label: 'Quads', muscles: ['quads'] },
  { id: 'hamstrings', label: 'Hamstrings', muscles: ['hamstrings'] },
  { id: 'glutes', label: 'Glutes', muscles: ['glutes'] },
  { id: 'calves', label: 'Calves', muscles: ['calves'] },
];

/**
 * Strength Focus (founder edit pass): the user picks a BODY AREA or SPECIFIC MUSCLES; the engine's Target routing picks the
 * architecture (Upper Body -> Upper Body session, Lower Body -> Glutes + Legs, Chest + Shoulders + Triceps -> Upper Push ...).
 * Body areas are exact Target sets the frozen Strength contract already routes (mood_v3 strength adapter ROUTING).
 */
export const BODY_AREAS: { id: 'upper_body' | 'lower_body' | 'full_body'; label: string; muscles: string[] | 'full_body' }[] = [
  { id: 'upper_body', label: 'Upper Body', muscles: ['chest', 'back', 'shoulders'] },
  { id: 'lower_body', label: 'Lower Body', muscles: ['quads', 'hamstrings', 'glutes'] },
  { id: 'full_body', label: 'Full Body', muscles: 'full_body' },
];

/** Strength specific-muscle Targets (normalize.USER_FACING_TARGETS; Core is the engine's `core`). */
export const STRENGTH_MUSCLES: { id: string; label: string }[] = [
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'quads', label: 'Quads' },
  { id: 'hamstrings', label: 'Hamstrings' },
  { id: 'glutes', label: 'Glutes' },
  { id: 'calves', label: 'Calves' },
  { id: 'core', label: 'Core' },
];

function sameSet(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((x) => b.includes(x));
}

/** The body area a Target equals exactly, if any. */
export function bodyAreaOf(target: HomeInputs['target'] | string[] | null | undefined): (typeof BODY_AREAS)[number] | null {
  if (target === null || target === undefined) return null;
  if (target === 'full_body') return BODY_AREAS[2];
  return BODY_AREAS.find((a) => a.muscles !== 'full_body' && sameSet(a.muscles, target as string[])) ?? null;
}

/** Strength Focus: choose a body area (replaces any muscle selection; tapping it again returns to MOOD's Pick). */
export function pickBodyArea(inputs: HomeInputs, areaId: string): HomeInputs {
  const area = BODY_AREAS.find((a) => a.id === areaId);
  if (!area) return inputs;
  const on = bodyAreaOf(inputs.target)?.id === areaId;
  return { ...inputs, target: on ? null : area.muscles === 'full_body' ? 'full_body' : [...area.muscles], archetype: null };
}

/** Strength Focus: toggle one specific muscle (max 3). Starting from a body area starts a fresh muscle selection. */
export function toggleStrengthMuscle(inputs: HomeInputs, muscle: string): { inputs: HomeInputs; limitHit: boolean } {
  const fromArea = bodyAreaOf(inputs.target) !== null;
  const current = inputs.target === null || inputs.target === 'full_body' || fromArea ? [] : (inputs.target as string[]);
  if (current.includes(muscle)) {
    const next = current.filter((m) => m !== muscle);
    return { inputs: { ...inputs, target: next.length ? next : null, archetype: null }, limitHit: false };
  }
  if (current.length >= MAX_TARGET_MUSCLES) return { inputs, limitHit: true };
  return { inputs: { ...inputs, target: [...current, muscle], archetype: null }, limitHit: false };
}

export function isStrengthMuscleSelected(inputs: HomeInputs, muscle: string): boolean {
  if (inputs.target === null || inputs.target === 'full_body' || bodyAreaOf(inputs.target)) return false;
  return (inputs.target as string[]).includes(muscle);
}

export const DURATIONS: (30 | 60)[] = [60, 30];

/** Session Difficulty (the V3 `experience` input). Default comes from the Training Profile. */
export const DIFFICULTIES: { id: V3Experience; label: string }[] = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
];
export const DIFFICULTY_LABEL: Record<V3Experience, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

/**
 * Session types (archetypes) the user may pick explicitly (Phase 2.5). IDs are the backend registry
 * (normalize.ARCHETYPES); names match the API's archetype.name. MOOD's Pick (null) is always the default.
 * Strength Core / Custom Target are reached through the Target control, not listed here.
 */
export const ARCHETYPES: Record<V3Direction, { id: string; name: string }[]> = {
  strength: [
    { id: 'strength_upper_push', name: 'Upper Push' },
    { id: 'strength_upper_pull', name: 'Upper Pull' },
    { id: 'strength_upper_mixed', name: 'Upper Body' },
    { id: 'strength_lower_squat', name: 'Lower Body: Squat' },
    { id: 'strength_lower_hinge', name: 'Lower Body: Hinge' },
    { id: 'strength_glutes_legs', name: 'Glutes + Legs' },
    { id: 'strength_full_body', name: 'Full Body' },
    { id: 'strength_arms', name: 'Arms' },
  ],
  sweat: [
    { id: 'sweat_circuit', name: 'Circuit' },
    { id: 'sweat_engine', name: 'Engine' },
    { id: 'sweat_hybrid', name: 'Hybrid' },
  ],
  athletic: [
    { id: 'athletic_power', name: 'Power' },
    { id: 'athletic_speed_agility', name: 'Speed + Plyo' },
    { id: 'athletic_full_body', name: 'Full-Body Athlete' },
  ],
};

export function archetypeName(id: string | null | undefined): string | null {
  if (!id) return null;
  for (const list of Object.values(ARCHETYPES)) {
    const hit = list.find((a) => a.id === id);
    if (hit) return hit.name;
  }
  return null;
}

/* ------------------------------------------------------------------ state */

export interface HomeInputs {
  direction: V3Direction;
  states: V3State[];
  soreness: V3SoreRegion[];
  /** null = MOOD's Pick. Otherwise exactly what is sent as `target`. */
  target: string[] | 'full_body' | null;
  duration: 30 | 60;
  /** Explicit session type (archetype). null = MOOD's Pick. Mutually exclusive with a Target (Phase 2.5 UX rule). */
  archetype: string | null;
  /** Session-only equipment override from a conflict option ("Use full gym equipment"). */
  equipment: V3Equipment | null;
  /** Today's Difficulty override. null = the Training Profile's experience (nothing sent; the server fills it). */
  difficulty: V3Experience | null;
  /** Today's goal override (the funnel's "What are you training for?"). null = the Training Profile's goal. Never written back. */
  goal?: V3Goal | null;
}

/** The funnel's goal values (utils/v3Profile GOAL_OPTIONS); the API's `goal`. */
export type V3Goal = 'build_strength' | 'lose_weight_conditioning' | 'build_muscle' | 'improve_athleticism' | 'feel_better_reduce_stress' | 'stay_consistent';

/** Same labels as the funnel (utils/v3Profile GOAL_OPTIONS). */
export const GOAL_CHOICES: { id: V3Goal; label: string }[] = [
  { id: 'build_strength', label: 'Build Strength' },
  { id: 'lose_weight_conditioning', label: 'Sweat / Burn Fat' },
  { id: 'build_muscle', label: 'Improve Physique' },
  { id: 'improve_athleticism', label: 'Improve Athleticism' },
  { id: 'feel_better_reduce_stress', label: 'Feel Better / Reduce Stress' },
  { id: 'stay_consistent', label: 'Stay Consistent' },
];
export const GOAL_LABEL = Object.fromEntries(GOAL_CHOICES.map((g) => [g.id, g.label])) as Record<V3Goal, string>;

/** Today's goal. Choosing the profile's own goal clears the override, so the request stays profile-driven. */
export function setGoal(inputs: HomeInputs, goal: V3Goal, profileGoal: V3Goal | null): HomeInputs {
  return { ...inputs, goal: profileGoal && goal === profileGoal ? null : goal };
}

/** The goal today's workout will use (null when the profile has none and nothing was picked). */
export function effectiveGoal(inputs: HomeInputs, profileGoal: V3Goal | null): V3Goal | null {
  return inputs.goal ?? profileGoal ?? null;
}

export function initialInputs(direction: V3Direction, opts: { states?: V3State[]; duration?: 30 | 60 } = {}): HomeInputs {
  return {
    direction,
    states: (opts.states ?? []).slice(0, MAX_STATES),
    soreness: [],
    target: null,
    duration: opts.duration ?? 60,
    archetype: null,
    equipment: null,
    difficulty: null,
  };
}

/**
 * Today's Difficulty. Choosing the profile's own level clears the override, so the request stays profile-driven and the
 * summaries stay quiet. Never touches the Training Profile.
 */
export function setDifficulty(inputs: HomeInputs, level: V3Experience, profileLevel: V3Experience | null): HomeInputs {
  return { ...inputs, difficulty: profileLevel && level === profileLevel ? null : level };
}

/** The Difficulty today's workout will use. */
export function effectiveDifficulty(inputs: HomeInputs, profileLevel: V3Experience | null): V3Experience {
  return inputs.difficulty ?? profileLevel ?? 'intermediate';
}

export function toggleState(inputs: HomeInputs, id: V3State): { inputs: HomeInputs; limitHit: boolean } {
  if (inputs.states.includes(id)) {
    const states = inputs.states.filter((s) => s !== id);
    // Removing Sore removes its areas too, so the UI never shows areas without Sore.
    return { inputs: { ...inputs, states, soreness: id === 'sore' ? [] : inputs.soreness }, limitHit: false };
  }
  if (inputs.states.length >= MAX_STATES) return { inputs, limitHit: true };
  return { inputs: { ...inputs, states: [...inputs.states, id] }, limitHit: false };
}

export function toggleSoreRegion(inputs: HomeInputs, id: V3SoreRegion): HomeInputs {
  const soreness = inputs.soreness.includes(id) ? inputs.soreness.filter((r) => r !== id) : [...inputs.soreness, id];
  return { ...inputs, soreness };
}

export function setDirection(inputs: HomeInputs, direction: V3Direction): HomeInputs {
  if (direction === inputs.direction) return inputs;
  // Athletic takes no muscle Target; an archetype belongs to one Direction.
  return { ...inputs, direction, target: direction === 'athletic' ? null : inputs.target, archetype: null };
}

export function setDuration(inputs: HomeInputs, duration: 30 | 60): HomeInputs {
  return { ...inputs, duration };
}

export function targetSupported(direction: V3Direction): boolean {
  return direction !== 'athletic';
}

export function isTargetSelected(inputs: HomeInputs, chipId: string): boolean {
  const chip = TARGETS.find((t) => t.id === chipId);
  if (!chip || inputs.target === null) return false;
  if (chip.muscles === 'full_body') return inputs.target === 'full_body';
  if (inputs.target === 'full_body') return false;
  return chip.muscles.every((m) => (inputs.target as string[]).includes(m));
}

export function toggleTarget(inputs: HomeInputs, chipId: string): { inputs: HomeInputs; limitHit: boolean } {
  const chip = TARGETS.find((t) => t.id === chipId);
  if (!chip || !targetSupported(inputs.direction)) return { inputs, limitHit: false };
  if (chip.muscles === 'full_body') {
    return { inputs: { ...inputs, target: inputs.target === 'full_body' ? null : 'full_body', archetype: null }, limitHit: false };
  }
  const current = inputs.target === null || inputs.target === 'full_body' ? [] : inputs.target;
  if (isTargetSelected(inputs, chipId)) {
    const next = current.filter((m) => !(chip.muscles as string[]).includes(m));
    return { inputs: { ...inputs, target: next.length ? next : null }, limitHit: false };
  }
  const next = [...current, ...chip.muscles.filter((m) => !current.includes(m))];
  if (next.length > MAX_TARGET_MUSCLES) return { inputs, limitHit: true };
  return { inputs: { ...inputs, target: next, archetype: null }, limitHit: false };
}

/**
 * Target vs session type (Phase 2.5): they are different questions, and the backend does not compose a Target inside an
 * explicit archetype. Rule: picking a session type clears the Target; picking a Target returns the type to MOOD's Pick.
 */
export function setArchetype(inputs: HomeInputs, archetype: string | null): HomeInputs {
  if (archetype && !ARCHETYPES[inputs.direction].some((a) => a.id === archetype)) return inputs;
  return { ...inputs, archetype, target: archetype ? null : inputs.target };
}

/** Target "None". Leaves an explicit session type alone (the two are exclusive, so there is nothing to reconcile). */
export function clearTarget(inputs: HomeInputs): HomeInputs {
  return { ...inputs, target: null };
}

/** "Chest + Arms", "Full Body", or null for MOOD's Pick. */
export function targetLabel(target: HomeInputs['target']): string | null {
  if (target === null) return null;
  if (target === 'full_body') return 'Full Body';
  const area = bodyAreaOf(target);
  if (area) return area.label;
  const labels: string[] = [];
  const left = new Set(target);
  for (const chip of TARGETS) {
    if (chip.muscles === 'full_body') continue;
    if (chip.muscles.every((m) => left.has(m))) {
      labels.push(chip.label);
      chip.muscles.forEach((m) => left.delete(m));
    }
  }
  left.forEach((m) => labels.push(m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())));
  return labels.join(' + ');
}

/* ------------------------------------------------------------------ request */

export type BuildBlocker = 'sore_needs_area' | null;

/** The server ignores Sore without an area, so hold the build until one is picked. */
export function buildBlocker(inputs: HomeInputs): BuildBlocker {
  if (inputs.states.includes('sore') && inputs.soreness.length === 0) return 'sore_needs_area';
  return null;
}

export function buildRequest(inputs: HomeInputs, date: string): V3GenerateRequest {
  const req: V3GenerateRequest = {
    direction: inputs.direction,
    states: [...inputs.states],
    soreness: inputs.states.includes('sore') ? [...inputs.soreness] : [],
    duration: inputs.duration,
    date,
    persist: true,
  };
  if (inputs.target !== null && targetSupported(inputs.direction)) req.target = inputs.target === 'full_body' ? 'full_body' : [...inputs.target];
  if (inputs.archetype) req.archetype = inputs.archetype;
  if (inputs.equipment) req.equipment = inputs.equipment;
  if (inputs.difficulty) req.experience = inputs.difficulty;
  if (inputs.goal) req.goal = inputs.goal;
  return req;
}

/** Stable key for "same inputs, same day" (reopen instead of regenerating). */
export function requestSignature(req: V3GenerateRequest): string {
  const norm = {
    d: req.direction,
    s: [...req.states].sort(),
    so: [...req.soreness].sort(),
    t: req.target === undefined ? null : req.target === 'full_body' ? 'full_body' : [...req.target].sort(),
    a: req.archetype ?? null,
    pa: req.pick_archetype ?? null,
    du: req.duration,
    e: req.equipment ?? null,
    x: req.experience ?? null,
    g: req.goal ?? null,
    date: req.date,
  };
  return JSON.stringify(norm);
}

/* ------------------------------------------------------------------ conflicts */

export type ConflictEffect = 'regenerate' | 'open_target_picker' | 'close';

/**
 * Apply a conflict option exactly as the API describes it. A non-null patch is
 * applied and regenerated. A null patch means "open the picker" (Change
 * Target), except `cancel`, which just closes. Nothing else is inferred.
 */
export function applyConflictOption(
  inputs: HomeInputs,
  option: { action: string; patch: Record<string, any> | null },
): { inputs: HomeInputs; effect: ConflictEffect } {
  if (option.patch === null) {
    if (option.action === 'cancel') return { inputs, effect: 'close' };
    return { inputs, effect: /target/.test(option.action) && targetSupported(inputs.direction) ? 'open_target_picker' : 'close' };
  }
  return { inputs: applyConflictPatch(inputs, option.patch).inputs, effect: 'regenerate' };
}

/** Apply a conflict `patch` (the fields to re-send to /generate). */
export function applyConflictPatch(
  inputs: HomeInputs,
  patch: Record<string, any> | null,
): { inputs: HomeInputs; openPicker: boolean } {
  if (patch === null) return { inputs, openPicker: true };
  let next: HomeInputs = { ...inputs };
  if ('direction' in patch && patch.direction) next = { ...next, direction: patch.direction as V3Direction };
  if ('target' in patch) {
    const t = patch.target;
    next = { ...next, target: t === null || t === undefined ? null : t === 'full_body' ? 'full_body' : Array.isArray(t) ? t : [t] };
  }
  if ('archetype' in patch) next = { ...next, archetype: patch.archetype ?? null };
  if ('equipment' in patch) next = { ...next, equipment: patch.equipment ?? null };
  if ('duration' in patch && (patch.duration === 30 || patch.duration === 60)) next = { ...next, duration: patch.duration };
  if ('states' in patch && Array.isArray(patch.states)) next = { ...next, states: patch.states.slice(0, MAX_STATES) };
  if ('soreness' in patch && Array.isArray(patch.soreness)) next = { ...next, soreness: patch.soreness };
  if (next.direction === 'athletic') next = { ...next, target: null };
  return { inputs: next, openPicker: false };
}

/* ------------------------------------------------------------------ copy */

/** What drives the session: the explicit Workout Type, else the Focus (Target), else MOOD's Pick. */
export function focusLabel(inputs: HomeInputs): string {
  return archetypeName(inputs.archetype) ?? targetLabel(inputs.target) ?? "MOOD's Pick";
}

/** Home's compact configuration row (Phase 2.6): "MOOD's Pick · 60 min", "Chest · 60 min", "Lower Body: Squat · 30 min". */
export function configSummary(inputs: HomeInputs): string {
  return [focusLabel(inputs), inputs.difficulty ? DIFFICULTY_LABEL[inputs.difficulty] : null, `${inputs.duration} min`].filter(Boolean).join(' · ');
}

/** Line above Build: exactly what will be sent. "Strength · Amped · Chest · 60 min". */
export function summaryLine(inputs: HomeInputs): string {
  const states = inputs.states.filter((s) => s !== 'sore').map((s) => STATE_LABEL[s]);
  if (inputs.states.includes('sore')) states.push(inputs.soreness.length ? `Sore ${inputs.soreness.map((r) => r.replace(/_/g, ' ')).join(', ')}` : 'Sore');
  return [DIRECTION_NAME[inputs.direction], ...states, focusLabel(inputs), inputs.difficulty ? DIFFICULTY_LABEL[inputs.difficulty] : null, `${inputs.duration} min`]
    .filter(Boolean)
    .join(' · ');
}

/** Honest MOOD's Pick copy: the pick uses the profile + completed V3 history; States shape the build. */
/**
 * The session types MOOD's Pick rotates through for this athlete. Mirrors the backend resolver
 * (backend/mood_v3/engines/strength/adapter.py rotation_for: 1–2 days = full body only, 5+ adds hinge + arms days;
 * Sweat and Athletic rotate all of their session types). Display only: the server still makes the pick.
 */
const PICK_GOAL_ROTATION: Record<string, string[]> = {
  build_strength: ['strength_lower_squat', 'strength_upper_pull', 'strength_upper_push', 'strength_glutes_legs', 'strength_upper_mixed'],
  build_muscle: ['strength_upper_pull', 'strength_lower_squat', 'strength_upper_push', 'strength_glutes_legs', 'strength_upper_mixed'],
  improve_athleticism: ['strength_lower_squat', 'strength_upper_pull', 'strength_glutes_legs', 'strength_upper_push', 'strength_upper_mixed'],
};
const PICK_DEFAULT_ROTATION = ['strength_glutes_legs', 'strength_upper_pull', 'strength_upper_push', 'strength_lower_squat', 'strength_upper_mixed'];
export function moodsPickRotation(direction: V3Direction, goal?: string | null, frequency?: string | null): string[] {
  if (direction !== 'strength') return ARCHETYPES[direction].map((a) => a.name);
  if (frequency === '1-2') return ['Full Body'];
  const ids = [...(PICK_GOAL_ROTATION[goal ?? ''] ?? PICK_DEFAULT_ROTATION)];
  if (frequency === '5+') { ids.push('strength_lower_hinge'); ids.push('strength_arms'); }
  return ids.map((id) => archetypeName(id) ?? id);
}

export function moodsPickCopy(direction: V3Direction): string {
  const base = "We'll choose today's session from your profile and recent workouts, then shape it around how you're feeling.";
  if (direction === 'athletic') return `${base} Athletic rotates Power, Speed + Plyo and Full-Body Athlete.`;
  return base;
}

export type BarrierKey = 'time' | 'low_energy' | 'motivation' | 'dont_know' | 'boredom';

export const BARRIER_BANNER: Record<BarrierKey, { title: string; body: string }> = {
  low_energy: { title: 'Set up for a low-energy day', body: 'Low Energy is on for your first session. Tap it to turn it off.' },
  boredom: { title: 'Set up for variety', body: 'Bored is on for your first session, so MOOD mixes things up. Tap it to turn it off.' },
  time: { title: 'Built for a short window', body: '30 minutes is selected for your first session. The main work stays; the rest gets cut.' },
  motivation: { title: 'One tap to start', body: "Press Build. MOOD's Pick handles the plan." },
  dont_know: { title: 'No planning needed', body: "MOOD's Pick chooses the exercises, sets and rest for you. Just press Build." },
};

/* ------------------------------------------------------------------ H1: Home hero + Build screen */

/** The Focus row on the Build screen: "MOOD's Pick", "Chest", "Lower Body: Squat · Advanced" (Length is its own row). */
export function focusSummary(inputs: HomeInputs): string {
  return [focusLabel(inputs), inputs.goal ? GOAL_LABEL[inputs.goal] : null, inputs.difficulty ? DIFFICULTY_LABEL[inputs.difficulty] : null].filter(Boolean).join(' · ');
}

/** Time-of-day greeting for the Home hero. First name only; no name means no comma. */
export function greeting(name: string | null | undefined, d: Date = new Date()): string {
  const h = d.getHours();
  const part = h >= 5 && h < 12 ? 'Good morning' : h >= 12 && h < 17 ? 'Good afternoon' : h >= 17 && h < 22 ? 'Good evening' : 'Late session';
  const first = (name ?? '').trim().split(/\s+/)[0];
  return first ? `${part}, ${first}.` : `${part}.`;
}

/**
 * The hero's one line of real context, or null. Only facts MOOD actually has: a first visit (from the onboarding
 * handoff) or the real workout streak from /api/achievements/state (workout days, never app-open days). A streak
 * under 2 days says nothing, so it is hidden.
 */
export function heroContextLine(opts: { firstVisit: boolean; workoutStreak: number | null }): string | null {
  if (opts.firstVisit) return 'Your first MOOD workout starts here.';
  const s = opts.workoutStreak ?? 0;
  if (s >= 2) return `${s}-day training streak. Keep it going.`;
  return null;
}

/** Compact default line under the hero CTA: "Strength · 60 min · MOOD's Pick" (what Build opens with). */
export function heroDefaultSummary(direction: V3Direction, duration: 30 | 60): string {
  return [DIRECTION_NAME[direction], `${duration} min`, "MOOD's Pick"].join(' · ');
}

/** State chips for the hero summary, in chip order: "Stressed · Sore". */
export function statesLabel(states: V3State[]): string {
  return STATES.filter((s) => states.includes(s.id)).map((s) => s.label).join(' · ');
}

/** Same State selection, order-insensitive (does the hero's selection still match today's workout?). */
export function sameStates(a: V3State[], b: V3State[]): boolean {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

/** Build's default length: the Training Profile's default_duration, else the onboarding handoff's, else 60. */
export function defaultDuration(profileDefault?: number | null, handoffDefault?: number | null): 30 | 60 {
  if (profileDefault === 30 || profileDefault === 60) return profileDefault;
  if (handoffDefault === 30 || handoffDefault === 60) return handoffDefault;
  return 60;
}

/* ------------------------------------------------------------------ founder edit pass: optional States, soreness */

/** States are an optional modifier: no selection IS the normal workout. */
export const HOME_STATE_PROMPT = 'Anything affecting your workout today?';
export const HOME_STATE_CAPTION = `Optional · choose up to ${MAX_STATES}`;

/** Same sore areas, order-insensitive. */
export function sameSoreness(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const s = new Set(a);
  return b.every((x) => s.has(x));
}

/** "Sore · Legs, Lower Back". */
export function soreSummary(regions: string[]): string {
  const labels = regions.map((r) => SORE_REGIONS.find((x) => x.id === r)?.label ?? r.replace(/_/g, ' '));
  return `Sore · ${labels.join(', ')}`;
}
