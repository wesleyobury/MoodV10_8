/**
 * MOOD V3 Explore (Oct 2026 rework: the social feed is gone).
 *
 *   LIVE ON MOOD   GET /api/v3/explore -> live[]: real Guided Sessions in progress, plus sample sessions that fill the gap at
 *                  low concurrency (server: backend/v3_explore.py, EXPLORE_SYNTHETIC). One row component renders both; a
 *                  sample row in production has no name or face and carries a Sample tag (show_sample_tag).
 *   TRENDING       trending.source 'measured' (real V3 completions, with counts) | 'curated' (no counts, never a fake number)
 *   MOOD'S PICKS   generation presets (MOODS_PICKS below), not stored workouts
 *
 * Trends, picks and History's Do Again all open the existing Build flow with a preset (buildPresetParams / parseBuildPreset):
 * every input arrives preselected and the generator, conflicts and the Cart are unchanged.
 */
import type { V3Direction, V3State } from './v3Api';
import { DIRECTION_NAME, STATE_LABEL } from './v3HomeModel';

/** Small Direction marks for Explore / Profile (marks only, never surface fills). */
export const DIRECTION_ACCENT: Record<V3Direction, string> = { strength: '#FFB547', sweat: '#FF7A5C', athletic: '#7FA7FF' };
export const DIRECTION_ICON: Record<V3Direction, 'barbell' | 'water' | 'rocket'> = { strength: 'barbell', sweat: 'water', athletic: 'rocket' };

/* ------------------------------------------------------------------ live + trending */

export interface LiveEntry {
  id: string;
  kind: 'real' | 'sample';
  sample: boolean;
  /** production sample rows: no person, tagged "Sample" */
  show_sample_tag: boolean;
  is_you: boolean;
  name: string | null;
  avatar: string | null;
  direction: V3Direction;
  direction_name: string;
  states: V3State[];
  state_labels: string[];
  focus: string;
  elapsed_min: number;
  est_min: number | null;
  progress: number | null;
}

export interface TrendItem {
  id: string;
  kind: 'combo' | 'focus';
  label: string;
  direction: V3Direction;
  /** measured completions; null for curated items (never shown as a number) */
  count: number | null;
  preset: BuildPreset;
}

export interface ExploreData {
  live: LiveEntry[];
  live_real_count: number;
  synthetic_mode: 'off' | 'labeled' | 'realistic';
  trending: { source: 'measured' | 'curated'; window: 'today' | 'week' | null; items: TrendItem[] };
  generated_at: string;
}

/** "TRENDING TODAY" / "TRENDING THIS WEEK" only for measured data; curated combos never claim popularity. */
export function trendingTitle(t: ExploreData['trending'] | null | undefined): { title: string; sub: string } {
  if (t?.source === 'measured') return { title: t.window === 'today' ? 'Trending today' : 'Trending this week', sub: 'What people are training on MOOD' };
  return { title: 'Quick starts', sub: 'Combinations that work well together' };
}

export function trendCountLabel(n: number | null): string | null {
  if (n == null) return null;
  return `${n.toLocaleString('en-US')} workout${n === 1 ? '' : 's'}`;
}

/** Elapsed minutes now, from the server's value at fetch time (rows keep ticking between polls). */
export function liveElapsed(e: LiveEntry, fetchedAt: number, now: number): number {
  return Math.max(1, Math.round(e.elapsed_min + Math.max(0, now - fetchedAt) / 60000));
}

export function liveProgress(e: LiveEntry, elapsed: number): number | null {
  if (!e.est_min) return null;
  return Math.min(0.97, Math.max(0.03, elapsed / e.est_min));
}

/** Headline of a live row. Production sample rows name the workout, never a person. */
export function liveHeadline(e: LiveEntry): string {
  if (e.is_you) return 'You’re training';
  if (e.name) return `${e.name} is training`;
  return e.focus || `${e.direction_name} session`;
}

/** "Strength · Chest + Triceps" (or just the Direction when the headline already names the workout). */
export function liveDetail(e: LiveEntry): string {
  const named = e.is_you || !!e.name;
  return named && e.focus && e.focus !== e.direction_name ? `${e.direction_name} · ${e.focus}` : e.direction_name;
}

/** "Amped · 32 min in" */
export function liveStatus(e: LiveEntry, elapsed: number): string {
  return [...e.state_labels, `${elapsed} min in`].join(' · ');
}

/* ------------------------------------------------------------------ presets -> Build */

export interface BuildPreset {
  direction: V3Direction;
  states?: V3State[];
  /** muscles, or 'full_body'. Mutually exclusive with archetype (the Build rule). */
  target?: string[] | 'full_body';
  archetype?: string;
  duration?: 30 | 60;
}

export interface MoodPick {
  id: string;
  title: string;
  preset: BuildPreset;
}

/** MOOD's Picks: generation presets. The generator only builds 30 or 60 minute sessions. */
export const MOODS_PICKS: MoodPick[] = [
  { id: 'heavy-upper', title: 'Heavy Upper Body', preset: { direction: 'strength', states: ['amped'], target: ['chest', 'back', 'shoulders'], duration: 60 } },
  { id: 'sweat-it-out', title: 'Sweat It Out', preset: { direction: 'sweat', states: ['irritated'], duration: 30 } },
  { id: 'move-fast', title: 'Move Fast', preset: { direction: 'athletic', states: ['amped'], archetype: 'athletic_speed_agility', duration: 30 } },
  { id: 'lift-it-off', title: 'Lift It Off', preset: { direction: 'strength', states: ['stressed'], target: 'full_body', duration: 60 } },
  { id: 'easy-engine', title: 'Low-Key Engine', preset: { direction: 'sweat', states: ['low_energy'], archetype: 'sweat_engine', duration: 30 } },
];

/** "Strength · Amped · 60 min" */
export function presetMeta(p: BuildPreset): string {
  return [DIRECTION_NAME[p.direction], ...(p.states ?? []).map((s) => STATE_LABEL[s] ?? s), p.duration ? `${p.duration} min` : null]
    .filter(Boolean)
    .join(' · ');
}

const DIRS = new Set(['strength', 'sweat', 'athletic']);
const STATES_OK = new Set(['low_energy', 'bored', 'irritated', 'amped', 'stressed']); // Sore needs an area: never preset
/** backend normalize.USER_FACING_TARGETS */
const TARGET_MUSCLES = new Set(['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'quads', 'hamstrings', 'glutes', 'calves', 'hip_adductors', 'hip_abductors', 'core']);

/** Route params for /v3/build. */
export function buildPresetParams(p: BuildPreset, source: string): { preset: string; source: string } {
  return { preset: JSON.stringify(p), source };
}

/** Parse + sanitize a preset param. Anything unexpected is dropped, never trusted. */
export function parseBuildPreset(raw: string | string[] | undefined | null): BuildPreset | null {
  const s = Array.isArray(raw) ? raw[0] : raw;
  if (!s) return null;
  let o: any;
  try {
    o = JSON.parse(s);
  } catch {
    return null;
  }
  if (!o || !DIRS.has(o.direction)) return null;
  const out: BuildPreset = { direction: o.direction };
  if (Array.isArray(o.states)) out.states = o.states.filter((x: any) => STATES_OK.has(x)).slice(0, 3);
  if (o.target === 'full_body') out.target = 'full_body';
  else if (Array.isArray(o.target)) {
    const muscles = o.target.filter((m: any) => TARGET_MUSCLES.has(m)).slice(0, 3);
    if (muscles.length) out.target = muscles;
  }
  if (typeof o.archetype === 'string' && o.archetype && !out.target) out.archetype = o.archetype;
  if (o.duration === 30 || o.duration === 60) out.duration = o.duration;
  if (out.direction === 'athletic') delete out.target; // Athletic has no Target
  return out;
}
