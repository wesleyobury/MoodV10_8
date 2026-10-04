/**
 * MOOD V3 today-cache model (pure, no storage).
 *
 * One day can hold several builds: the user's main Home -> Build workout plus (from H3) Quick Start workouts. Each build
 * is keyed by its request signature, so tapping the same thing twice reopens it and a Quick Start never overwrites the
 * primary daily build. `primary` is the most recent build from the Build screen: that is the workout the Home hero shows.
 *
 * The server stays the source of truth for every workout; this only remembers ids, signatures and the last envelope.
 */
import type { V3Envelope, V3GenerateRequest } from './v3Api';

/** Where a build came from. 'build' = Home -> Build screen. 'quick_start' = a Home preset card (H3). */
export type V3BuildSource = 'build' | 'quick_start';

export interface V3TodayEntry {
  date: string;
  workout_id: string;
  signature: string;
  request: V3GenerateRequest;
  envelope: V3Envelope;
  saved_at: string;
  /** Missing on entries migrated from the one-entry cache: treated as 'build'. */
  source?: V3BuildSource;
}

export interface V3TodayDay {
  version: 2;
  date: string;
  entries: V3TodayEntry[];
  /** Signature of the Home hero's workout (latest 'build' entry). */
  primary: string | null;
}

/** Enough for the main build plus a full row of Quick Starts. Oldest non-primary entries go first. */
export const MAX_TODAY_ENTRIES = 10;

export function emptyDay(date: string): V3TodayDay {
  return { version: 2, date, entries: [], primary: null };
}

/**
 * Parse whatever is stored: the v2 day shape only. Anything from another day, or unreadable, becomes an empty day.
 * Founder edit pass: the pre-H1 single-entry (v1) cache is NOT migrated. A build made by the old app (often a test build
 * with States chosen earlier that day) must never resurface as today's Home hero workout the user did not choose here.
 */
export function parseDay(raw: string | null | undefined, date: string): V3TodayDay {
  if (!raw) return emptyDay(date);
  try {
    const v = JSON.parse(raw);
    if (v && v.version === 2 && Array.isArray(v.entries)) {
      if (v.date !== date) return emptyDay(date);
      const entries = (v.entries as V3TodayEntry[]).filter((e) => e && e.date === date && e.workout_id && e.signature);
      const primary = entries.some((e) => e.signature === v.primary) ? v.primary : null;
      return { version: 2, date, entries, primary };
    }
  } catch {
    /* fall through */
  }
  return emptyDay(date);
}

/** Insert or replace a build (by signature, and by workout id so a re-keyed workout never appears twice). */
export function upsertEntry(day: V3TodayDay, entry: V3TodayEntry): V3TodayDay {
  if (entry.date !== day.date) day = emptyDay(entry.date);
  const source: V3BuildSource = entry.source ?? 'build';
  const e = { ...entry, source };
  let entries = day.entries.filter((x) => x.signature !== e.signature && x.workout_id !== e.workout_id);
  entries.push(e);
  const primary = source === 'build' ? e.signature : day.primary;
  while (entries.length > MAX_TODAY_ENTRIES) {
    const drop = entries.findIndex((x) => x.signature !== primary);
    entries = entries.filter((_, i) => i !== (drop < 0 ? 0 : drop));
  }
  return { ...day, entries, primary };
}

export function findBySignature(day: V3TodayDay, signature: string): V3TodayEntry | null {
  return day.entries.find((e) => e.signature === signature) ?? null;
}

export function findByWorkoutId(day: V3TodayDay, workoutId: string): V3TodayEntry | null {
  return day.entries.find((e) => e.workout_id === workoutId) ?? null;
}

/** The Home hero's workout. */
export function primaryEntry(day: V3TodayDay): V3TodayEntry | null {
  return day.primary ? findBySignature(day, day.primary) : null;
}

/** Keep a cached envelope current after a swap / Different Workout (same workout id; never an older version). */
export function withEnvelope(day: V3TodayDay, envelope: V3Envelope): V3TodayDay {
  const id = envelope.workout?.workout_id;
  if (!id) return day;
  let changed = false;
  const entries = day.entries.map((e) => {
    if (e.workout_id !== id) return e;
    const cur = e.envelope.workout?.version ?? 0;
    if ((envelope.workout?.version ?? 0) < cur) return e;
    changed = true;
    return { ...e, envelope, saved_at: new Date().toISOString() };
  });
  return changed ? { ...day, entries } : day;
}
