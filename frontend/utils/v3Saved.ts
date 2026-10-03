/**
 * V3 Cart "Save" (founder pass, Oct 2026): a V3 workout saved to the user's profile.
 *
 * Reuses the existing /api/saved-workouts store (the Profile "Saved Workouts" list) instead of a new one:
 *   source               'v3'
 *   featured_workout_id  the V3 workout_id (the server keeps the workout; Profile reopens it in the V3 Cart)
 *   workouts             one row per exercise (name · equipment · prescription) so the Profile card can list them
 * The workout id is the identity: saving the same workout twice is a no-op, and Unsave deletes that one entry.
 */
import { apiFetch } from './api';
import type { V3Workout } from './v3Api';
import { savedBody } from './v3SavedBody';

export interface SavedEntry { id: string; source?: string; featured_workout_id?: string | null; name: string }

const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

/** The saved entry for this V3 workout, if any. */
export async function findSavedV3(token: string, workoutId: string): Promise<SavedEntry | null> {
  const res = await apiFetch<SavedEntry[]>('/api/saved-workouts?limit=200', { method: 'GET', headers: auth(token) });
  if (!res.ok || !Array.isArray(res.data)) return null;
  return res.data.find((s) => s.source === 'v3' && s.featured_workout_id === workoutId) ?? null;
}

export async function saveV3(token: string, w: V3Workout): Promise<{ ok: boolean; id: string | null; already?: boolean }> {
  const res = await apiFetch<{ id: string }>('/api/saved-workouts', {
    method: 'POST',
    headers: { ...auth(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(savedBody(w)),
  });
  if (res.ok) return { ok: true, id: res.data?.id ?? null };
  if (res.status === 400) {
    const hit = w.workout_id ? await findSavedV3(token, w.workout_id) : null;
    return { ok: !!hit, id: hit?.id ?? null, already: true };
  }
  return { ok: false, id: null };
}

export async function unsaveV3(token: string, savedId: string): Promise<boolean> {
  const res = await apiFetch(`/api/saved-workouts/${encodeURIComponent(savedId)}`, { method: 'DELETE', headers: auth(token) });
  return res.ok;
}

/* ------------------------------------------------------------------ the Saved page (app/saved.tsx) */

/** One entry of /api/saved-workouts (V3 saves and older featured / custom saves). */
export interface SavedWorkout {
  id: string;
  name: string;
  title?: string;
  source: string;
  mood?: string;
  featured_workout_id?: string | null;
  total_duration: number;
  created_at?: string;
  workouts: { name: string; equipment: string; duration: string; difficulty: string; description?: string; battlePlan?: string; imageUrl?: string; intensityReason?: string; workoutType?: string; moodCard?: string; moodTips?: any[] }[];
}

export async function fetchSaved(token: string): Promise<SavedWorkout[] | null> {
  const res = await apiFetch<SavedWorkout[]>('/api/saved-workouts?limit=200', { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
  return res.ok && Array.isArray(res.data) ? res.data : null;
}
