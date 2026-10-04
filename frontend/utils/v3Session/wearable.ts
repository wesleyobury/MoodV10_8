/**
 * Post-workout metrics from the wearable (Apple Health / Health Connect), read through the existing mood-healthkit module.
 * Reads only. No wearable is a first-class state: every function returns null quietly when nothing is available or
 * permitted. Nothing here estimates a number.
 *
 *   readSessionMetrics(startISO, endISO)  active energy, steps, HRV for the exact session window
 *   readRecentWorkout()                   the most recent HealthKit workout (a Watch workout): calories, avg / max HR, minutes
 *   syncWearable(startISO, endISO)        the two combined into the post-workout numbers; a Watch workout that overlaps the
 *                                         session supplies heart rate, the session window supplies energy / steps / HRV
 */
import type { AfterIntent } from './record';

type HK = typeof import('../../modules/mood-healthkit/src');

function hk(): HK | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('../../modules/mood-healthkit/src');
  } catch {
    return null;
  }
}

export interface WearableNumbers {
  calories: number | null;
  avg_heart_rate: number | null;
  max_heart_rate: number | null;
  steps: number | null;
  hrv_sdnn: number | null;
  /** minutes of the matching Watch workout, when one overlaps the session */
  workout_minutes: number | null;
  /** where a value came from: the session window, or a Watch workout */
  matched_workout: boolean;
}

export function wearableAvailable(): boolean {
  const m = hk();
  try {
    return !!m && typeof m.isHealthKitAvailable === 'function' && m.isHealthKitAvailable();
  } catch {
    return false;
  }
}

export async function wearableAuthorized(): Promise<boolean> {
  const m = hk();
  if (!m) return false;
  try {
    return (await m.getAuthorizationStatus()) === 'determined';
  } catch {
    return false;
  }
}

const pos = (v: number | null | undefined) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.round(v) : null);

export async function syncWearable(startISO: string, endISO: string): Promise<WearableNumbers | null> {
  const m = hk();
  if (!m || !wearableAvailable()) return null;
  const out: WearableNumbers = { calories: null, avg_heart_rate: null, max_heart_rate: null, steps: null, hrv_sdnn: null, workout_minutes: null, matched_workout: false };
  try {
    const sm = await m.fetchSessionMetrics(startISO, endISO);
    if (sm) {
      out.calories = pos(sm.activeEnergyKcal);
      out.steps = pos(sm.stepCount);
      out.hrv_sdnn = pos(sm.heartRateVariabilitySDNN);
    }
  } catch { /* partial data is fine */ }
  try {
    const w = await m.fetchMostRecentWorkout();
    if (w && overlaps(w.startISO, w.endISO, startISO, endISO)) {
      out.matched_workout = true;
      out.avg_heart_rate = pos(w.avgHeartRate);
      out.max_heart_rate = pos(w.maxHeartRate);
      out.workout_minutes = w.durationSec ? Math.max(1, Math.round(w.durationSec / 60)) : null;
      if (out.calories == null) out.calories = pos(w.activeEnergyKcal);
    }
  } catch { /* no workout on the watch */ }
  const any = out.calories != null || out.avg_heart_rate != null || out.max_heart_rate != null || out.steps != null || out.hrv_sdnn != null;
  return any ? out : null;
}

export function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const as = Date.parse(aStart), ae = Date.parse(aEnd), bs = Date.parse(bStart), be = Date.parse(bEnd);
  if ([as, ae, bs, be].some((x) => !Number.isFinite(x))) return false;
  const tol = 15 * 60_000; // a Watch workout started a little before or ended a little after the session still counts
  return as <= be + tol && ae >= bs - tol;
}

export function afterFromWearable(n: WearableNumbers): Partial<AfterIntent> {
  return { calories: n.calories, avg_heart_rate: n.avg_heart_rate, max_heart_rate: n.max_heart_rate, steps: n.steps, hrv_sdnn: n.hrv_sdnn, source: 'wearable' };
}
