/**
 * MOOD V3 Home — Today's Workout inputs.
 *
 * Pure state helpers for the Home builder (no React, no network) so the rules
 * are testable: State limits, Sore <-> soreness consistency, Target
 * vocabulary, request construction and applying a conflict option's patch.
 * The server still validates everything; these helpers only keep the UI from
 * offering a request the contract rejects.
 */
import type { V3Direction, V3Equipment, V3GenerateRequest, V3SoreRegion, V3State } from './v3Api';

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

/** Body-map regions the API accepts (normalize.SORE_REGIONS). */
export const SORE_REGIONS: { id: V3SoreRegion; label: string }[] = [
  { id: 'legs', label: 'Legs' },
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'upper_back', label: 'Upper Back' },
  { id: 'lower_back', label: 'Lower Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'arms', label: 'Arms' },
  { id: 'core', label: 'Core' },
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

export const DURATIONS: (30 | 60)[] = [60, 30];

/* ------------------------------------------------------------------ state */

export interface HomeInputs {
  direction: V3Direction;
  states: V3State[];
  soreness: V3SoreRegion[];
  /** null = MOOD's Pick. Otherwise exactly what is sent as `target`. */
  target: string[] | 'full_body' | null;
  duration: 30 | 60;
  /** Only ever set by a conflict option's patch; the UI never exposes archetypes. */
  archetype: string | null;
  /** Session-only equipment override from a conflict option ("Use full gym equipment"). */
  equipment: V3Equipment | null;
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
  };
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

export function clearTarget(inputs: HomeInputs): HomeInputs {
  return { ...inputs, target: null, archetype: null };
}

/** "Chest + Arms", "Full Body", or null for MOOD's Pick. */
export function targetLabel(target: HomeInputs['target']): string | null {
  if (target === null) return null;
  if (target === 'full_body') return 'Full Body';
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
    du: req.duration,
    e: req.equipment ?? null,
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

export function summaryLine(inputs: HomeInputs): string {
  const focus = inputs.archetype ? null : targetLabel(inputs.target);
  return [DIRECTION_NAME[inputs.direction], focus ?? "MOOD's Pick", `${inputs.duration} min`].join(' · ');
}

/** Honest MOOD's Pick copy: the pick uses the profile + completed V3 history; States shape the build. */
export function moodsPickCopy(direction: V3Direction): string {
  const base = "We'll choose today's session from your profile and recent workouts, then shape it around how you're feeling.";
  if (direction === 'athletic') return `${base} Athletic rotates Power, Speed + Agility and Full-Body Athlete.`;
  return base;
}

export type BarrierKey = 'time' | 'low_energy' | 'motivation' | 'dont_know' | 'boredom';

export const BARRIER_BANNER: Record<BarrierKey, { title: string; body: string }> = {
  low_energy: { title: 'Set up for a low-energy day', body: 'Low Energy is on for your first session. Tap it to turn it off.' },
  boredom: { title: 'Set up for variety', body: 'Bored is on for your first session, so MOOD mixes things up. Tap it to turn it off.' },
  time: { title: 'Short on time?', body: 'The 30-minute option keeps the main work and trims the rest.' },
  motivation: { title: 'One tap to start', body: "Press Build. MOOD's Pick handles the plan." },
  dont_know: { title: 'No planning needed', body: "MOOD's Pick chooses the exercises, sets and rest for you. Just press Build." },
};
