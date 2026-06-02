/**
 * MOOD V2 Phase 1 (1d) — workout generation funnel instrumentation.
 *
 * Each mood screen builds its workout via a synchronous local generator
 * (`generate*Carts`). This helper wraps that call so every entry point emits
 * the funnel consistently:
 *   - workout_generation_started  (before generation)
 *   - workout_generation_completed (carts produced)  → returns a workout_id
 *   - workout_generation_failed    (threw OR produced nothing)
 *
 * `workout_previewed` fires from the cart screen; `workout_regenerated` fires
 * when the user shuffles to another generated option.
 */
import { Analytics } from './analytics';

export interface GenerationMeta {
  mood?: string;
  energy_level?: string;
  duration_min?: number;
  equipment?: string;
}

export interface TrackedGeneration<T> {
  carts: T;
  /** Correlation id stamped on completed/previewed so the funnel joins up. */
  workoutId: string;
}

/**
 * Run a synchronous cart generator with full funnel instrumentation.
 * Re-throws on error AFTER emitting `workout_generation_failed` so callers
 * keep their existing control flow.
 */
export function runTrackedGeneration<T>(
  token: string | null,
  meta: GenerationMeta,
  generate: () => T
): TrackedGeneration<T> {
  const start = Date.now();
  const workoutId = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  Analytics.workoutGenerationStarted(token, meta);

  try {
    const carts = generate();
    const latencyMs = Date.now() - start;
    const isEmpty =
      carts == null || (Array.isArray(carts) && (carts as unknown[]).length === 0);

    if (isEmpty) {
      Analytics.workoutGenerationFailed(token, {
        mood: meta.mood,
        failure_reason: 'empty_result',
        latency_ms: latencyMs,
      });
    } else {
      Analytics.workoutGenerationCompleted(token, {
        mood: meta.mood,
        latency_ms: latencyMs,
        workout_id: workoutId,
      });
    }
    return { carts, workoutId };
  } catch (e) {
    Analytics.workoutGenerationFailed(token, {
      mood: meta.mood,
      failure_reason: 'exception',
      latency_ms: Date.now() - start,
    });
    throw e;
  }
}
