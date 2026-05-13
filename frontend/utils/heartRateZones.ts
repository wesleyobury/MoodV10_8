/**
 * Heart-rate zone breakdown.
 *
 * Max HR is age-derived (the simple 220 − age formula, per spec). Zones are
 * the conventional 5-band split of (% of max HR):
 *
 *   Z1: 50–60%   Z2: 60–70%   Z3: 70–80%   Z4: 80–90%   Z5: 90–100%
 *
 * Anything below Z1 is bucketed into Z1 to keep the recap chart total stable.
 * Zone time is derived from sample timestamps — between two adjacent samples
 * we credit the gap to the earlier sample's zone. That makes the function
 * tolerant of irregular Apple Watch sampling cadences.
 */

export interface HeartRateSample {
  bpm: number;
  timestamp: string; // ISO-8601
}

export interface HeartRateStats {
  avgHR: number;
  maxHR: number;
  minHR: number;
  /** Seconds spent in each zone, indexed 0..4 → Z1..Z5. */
  timeInZones: [number, number, number, number, number];
  /** Max HR used for the zone split. */
  ageDerivedMaxHR: number;
}

export const ageToMaxHR = (age: number): number => Math.max(120, 220 - Math.round(age));

/**
 * Returns the zone index (0..4) for a given BPM.
 */
export function zoneForBpm(bpm: number, maxHR: number): number {
  const pct = bpm / maxHR;
  if (pct < 0.6) return 0; // Z1
  if (pct < 0.7) return 1; // Z2
  if (pct < 0.8) return 2; // Z3
  if (pct < 0.9) return 3; // Z4
  return 4; // Z5
}

const FALLBACK_GAP_SEC = 5; // matches the native 5s poll cadence

export function computeHeartRateStats(
  samples: HeartRateSample[],
  age: number,
): HeartRateStats | null {
  if (!samples || samples.length === 0) return null;

  const maxHR = ageToMaxHR(age);
  const bpms = samples.map((s) => s.bpm).filter((b) => Number.isFinite(b) && b > 0);
  if (bpms.length === 0) return null;

  const sum = bpms.reduce((a, b) => a + b, 0);
  const avgHR = Math.round(sum / bpms.length);
  const maxObserved = Math.max(...bpms);
  const minObserved = Math.min(...bpms);

  // Walk the timeline, crediting each gap to the earlier sample's zone.
  const timeInZones: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  for (let i = 0; i < samples.length; i++) {
    const cur = samples[i];
    const next = samples[i + 1];
    const curTime = Date.parse(cur.timestamp);
    const nextTime = next ? Date.parse(next.timestamp) : NaN;
    let gapSec: number;
    if (Number.isFinite(curTime) && Number.isFinite(nextTime)) {
      gapSec = Math.max(0, (nextTime - curTime) / 1000);
    } else {
      gapSec = FALLBACK_GAP_SEC;
    }
    // Clamp pathological gaps (e.g., watch dropped for hours) to keep the
    // recap honest. 60s is generous given a 5s poll cadence.
    gapSec = Math.min(gapSec, 60);
    timeInZones[zoneForBpm(cur.bpm, maxHR)] += gapSec;
  }

  return {
    avgHR,
    maxHR: maxObserved,
    minHR: minObserved,
    timeInZones,
    ageDerivedMaxHR: maxHR,
  };
}

/** Convenience: just the BPM numbers, for chart rendering. */
export const samplesToBpmSeries = (samples: HeartRateSample[]): number[] =>
  samples.map((s) => s.bpm).filter((b) => Number.isFinite(b) && b > 0);
