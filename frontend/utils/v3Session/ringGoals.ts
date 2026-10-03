/**
 * Rings card: goals and intensity (founder pass, Oct 2026).
 *
 *   minutes goal   the length the athlete chose (30 / 60), so the ring closes when they did the session they asked for
 *   calories goal  minutes goal x a per-Direction active-burn rate, rounded to 10. A target for the ring to fill, never
 *                  shown as the athlete's burn (calories themselves still only come from a wearable or the athlete).
 *   intensity      0-100, one number for the inner ring.
 *                    heart   avg HR as a share of HRmax (190, or the session's own peak if higher): 50% -> 0, 85% -> 100.
 *                            The standard zone band, so a steady strength day lands ~45-65 and a hard Sweat day ~75-90.
 *                    work    no heart rate: the work itself. Work steps completed / planned x pace (planned minutes /
 *                            actual minutes, clamped), scaled so a full session at plan pace reads 85 and finishing the full
 *                            plan faster pushes it toward 100. Skipped sets pull it down.
 *                  Heart rate always wins when it exists (wearable or typed), so the number upgrades itself after a sync.
 */
import type { V3Direction } from '../v3Api';

export const KCAL_PER_MIN: Record<V3Direction, number> = { strength: 6, sweat: 9, athletic: 8 };
export const DEFAULT_MINUTES_GOAL = 60;
export const HR_MAX_DEFAULT = 190;

export function minutesGoal(requested: number | null | undefined): number {
  return typeof requested === 'number' && requested > 0 ? Math.round(requested) : DEFAULT_MINUTES_GOAL;
}

export function caloriesGoal(direction: V3Direction | string | null | undefined, goalMinutes: number): number {
  const rate = (KCAL_PER_MIN as Record<string, number>)[String(direction)] ?? 7;
  return Math.max(50, Math.round((goalMinutes * rate) / 10) * 10);
}

export type IntensitySource = 'heart' | 'work';
export interface Intensity { value: number; source: IntensitySource }

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function heartIntensity(avgHr: number | null | undefined, maxHr?: number | null): number | null {
  if (typeof avgHr !== 'number' || !(avgHr > 0)) return null;
  const hrMax = Math.max(HR_MAX_DEFAULT, typeof maxHr === 'number' && maxHr > 0 ? maxHr : 0);
  return Math.round(clamp(((avgHr / hrMax) - 0.5) / 0.35, 0, 1) * 100);
}

export function workIntensity(i: { workDone: number | null | undefined; workTotal: number | null | undefined; minutes: number | null | undefined; goalMinutes: number | null | undefined }): number | null {
  if (!i.workTotal || i.workTotal <= 0 || i.workDone == null) return null;
  const completion = clamp(i.workDone / i.workTotal, 0, 1);
  if (completion === 0) return null;
  const pace = i.minutes && i.goalMinutes ? clamp(i.goalMinutes / i.minutes, 0.6, 1.15) : 1;
  return Math.round(clamp(completion * pace * 85, 0, 100));
}

export function sessionIntensity(i: { avgHr?: number | null; maxHr?: number | null; workDone?: number | null; workTotal?: number | null; minutes?: number | null; goalMinutes?: number | null }): Intensity | null {
  const h = heartIntensity(i.avgHr, i.maxHr);
  if (h != null) return { value: h, source: 'heart' };
  const w = workIntensity({ workDone: i.workDone, workTotal: i.workTotal, minutes: i.minutes, goalMinutes: i.goalMinutes });
  return w != null ? { value: w, source: 'work' } : null;
}
