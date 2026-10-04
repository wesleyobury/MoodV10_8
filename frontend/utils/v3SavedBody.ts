/** Pure part of utils/v3Saved (no network, testable in node). */
import type { V3Workout } from './v3Api';
import { previewTitle } from './v3PreviewFormat';
import { statesLabel } from './v3HomeModel';

/** The body POST /api/saved-workouts expects for a V3 workout. */
export function savedBody(w: V3Workout, now: Date = new Date()) {
  const title = previewTitle(w);
  const day = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const rows = w.blocks.flatMap((b) =>
    b.items.map((it) => ({
      name: it.exercise.name,
      equipment: it.exercise.equipment_label ?? it.exercise.equipment ?? '',
      duration: it.prescription.display,
      difficulty: w.experience,
      workoutType: w.direction_name,
    })),
  );
  return {
    // the server de-duplicates by name, so the name carries the workout id's tail: two different "Upper Push" days never clash
    name: `${w.direction_name} · ${title} · ${day} · ${String(w.workout_id ?? '').slice(-4)}`,
    title,
    workouts: rows,
    total_duration: Math.round(w.duration.estimated_minutes),
    source: 'v3',
    featured_workout_id: w.workout_id,
    mood: statesLabel(w.states) || null,
  };
}

