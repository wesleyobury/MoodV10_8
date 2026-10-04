/** Network calls for Explore and Profile (kept apart from the pure models in v3Explore / v3Activity so those stay testable in node). */
import { apiFetch } from './api';
import type { ActivityRow } from './v3Activity';

export async function getMyActivity(token: string): Promise<ActivityRow[] | null> {
  const res = await apiFetch<{ rows: ActivityRow[] }>('/api/v3/me/activity', { method: 'GET', headers: { Authorization: `Bearer ${token}` }, timeoutMs: 12000 });
  return res.ok && res.data && Array.isArray(res.data.rows) ? res.data.rows : null;
}

export interface CompletedStats {
  workout_id: string;
  completed_at: string | null;
  started_at: string | null;
  duration_actual: number | null;
  /** logged sets (weight logger); 0 when nothing was logged */
  sets: number;
  fit_rating: string | null;
  after: { calories?: number; avg_heart_rate?: number; max_heart_rate?: number; steps?: number; hrv_sdnn?: number; metrics_source?: 'wearable' | 'edited' };
}

/** GET /api/v3/me/completed/{id}: what a completed V3 workout recorded (the completion overlay is rebuilt from it). */
export async function getCompletedStats(token: string, workoutId: string): Promise<CompletedStats | null> {
  const res = await apiFetch<CompletedStats>(`/api/v3/me/completed/${encodeURIComponent(workoutId)}`, { method: 'GET', headers: { Authorization: `Bearer ${token}` }, timeoutMs: 10000 });
  return res.ok && res.data && res.data.workout_id ? res.data : null;
}
