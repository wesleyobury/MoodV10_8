/**
 * useAdminWorkouts — fetches admin-created workouts from Mongo for a
 * given mood/muscle/category/equipment combo and groups them by intensity
 * so the static-data carousel can fold them in.
 *
 * Returns an object keyed by intensity (`beginner` | `intermediate` |
 * `advanced`) with arrays in the same shape as the static workout files
 * so the consumer can `[...static, ...admin]` without further mapping.
 */

import { useEffect, useState, useCallback } from 'react';
import { API_URL } from '../utils/apiConfig';

export interface AdminWorkout {
  mood: string;
  muscle: string;
  category: string;
  equipment: string;
  intensity: string;
  name: string;
  duration: string;
  description: string;
  battlePlan: string;
  imageUrl: string;
  intensityReason?: string;
  moodTips?: { icon: string; title: string; description: string }[];
}

export interface UseAdminWorkoutsParams {
  mood?: string;
  muscle?: string;
  category?: string;
  equipment?: string;
}

export function useAdminWorkouts({ mood, muscle, category, equipment }: UseAdminWorkoutsParams) {
  const [byIntensity, setByIntensity] = useState<{
    beginner: AdminWorkout[];
    intermediate: AdminWorkout[];
    advanced: AdminWorkout[];
  }>({ beginner: [], intermediate: [], advanced: [] });
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (mood) params.set('mood', mood);
      if (muscle) params.set('muscle', muscle);
      if (category) params.set('category', category);
      if (equipment) params.set('equipment', equipment);
      const url = `${API_URL}/api/workouts?${params.toString()}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        setByIntensity({ beginner: [], intermediate: [], advanced: [] });
        return;
      }
      const data: AdminWorkout[] = await resp.json();
      const grouped = { beginner: [] as AdminWorkout[], intermediate: [] as AdminWorkout[], advanced: [] as AdminWorkout[] };
      for (const w of data) {
        const k = (w.intensity || '').toLowerCase();
        if (k === 'beginner' || k === 'intermediate' || k === 'advanced') {
          grouped[k as 'beginner' | 'intermediate' | 'advanced'].push(w);
        }
      }
      setByIntensity(grouped);
    } catch (e) {
      console.warn('useAdminWorkouts fetch failed:', e);
      setByIntensity({ beginner: [], intermediate: [], advanced: [] });
    } finally {
      setLoading(false);
    }
  }, [mood, muscle, category, equipment]);

  useEffect(() => { refresh(); }, [refresh]);

  return { byIntensity, loading, refresh };
}

export default useAdminWorkouts;
