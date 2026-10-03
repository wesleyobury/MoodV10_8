/**
 * MOOD V3 Overview — display helpers over the unified envelope.
 *
 * Presentation only. Prescriptions render from `prescription.display` and
 * explanations from `built_for_today`; these helpers format the structural
 * fields the API returns as numbers (rest, rounds, intervals, RPE) and pick
 * which fields a row shows. No workout rules live here.
 */
import type { V3Block, V3Direction, V3Item, V3Workout } from './v3Api';

export function secondsLabel(sec: number): string {
  if (sec < 60) return `${sec} s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s ? `${m}:${String(s).padStart(2, '0')} min` : `${m} min`;
}

export function restLabel(sec: number | null | undefined): string | null {
  if (!sec || sec <= 0) return null;
  return `Rest ${secondsLabel(sec)}`;
}

export function rpeLabel(rpe: unknown): string | null {
  if (Array.isArray(rpe) && rpe.length === 2) {
    const [lo, hi] = rpe as number[];
    return lo === hi ? `RPE ${lo}` : `RPE ${lo}–${hi}`;
  }
  if (typeof rpe === 'number') return `RPE ${rpe}`;
  return null;
}

const ROUND_STRUCTURES = new Set(['superset', 'circuit', 'timed_circuit', 'anchor_circuit']);

/** Short facts under a block title: rounds, interval format, effort, rest between rounds. */
/**
 * The EMOM label, rounds included (founder pass, Oct 2026): "EMOM · 20 min · 5 rounds". One station per minute, so a 20-minute
 * EMOM with 4 stations is 5 rounds through them; without the round count the block read as one pass of each exercise.
 */
export function emomLabel(block: V3Block): string {
  const n = Math.max(1, block.items.length);
  const minutes = block.interval?.minutes ?? (block.rounds ?? 1) * n;
  const rounds = Math.ceil(minutes / n);
  return n > 1 && rounds > 1 ? `EMOM · ${minutes} min · ${rounds} rounds` : `EMOM · ${minutes} min`;
}

export function blockMeta(block: V3Block, direction: V3Direction): string[] {
  const out: string[] = [];
  const iv = block.interval;
  if (direction === 'sweat' && iv) {
    if (typeof iv.minutes === 'number') out.push(emomLabel(block));
    else if (Array.isArray(iv.steps_sec) && iv.steps_sec.length) {
      out.push(`Pyramid ${iv.steps_sec.map((s) => secondsLabel(s)).join(' / ')}`);
      if (iv.recovery_sec) out.push(`${secondsLabel(iv.recovery_sec)} easy between`);
    } else if (iv.work_sec) {
      const rounds = iv.rounds ? `${iv.rounds} × ` : '';
      out.push(`${rounds}${secondsLabel(iv.work_sec)} on / ${secondsLabel(iv.recovery_sec ?? 0)} easy`);
      if (iv.alternate) out.push('Alternate exercises');
    }
  } else if (block.rounds && ROUND_STRUCTURES.has(block.structure)) {
    out.push(`${block.rounds} rounds`);
  }
  if (direction === 'sweat' && block.est_minutes && typeof iv?.minutes !== 'number') out.push(`~${Math.round(block.est_minutes)} min`);
  const rpe = rpeLabel(block.effort?.rpe);
  if (rpe) out.push(rpe);
  const after = roundRestLabel(block);
  if (after) out.push(after);
  return out;
}

/**
 * Rest that belongs to the whole structure, said once and said with its timing: "Rest 90 s after each pair",
 * "Rest 60 s between rounds", "Full recovery 2:30 min after each pair". Straight sets show rest per row instead.
 */
export function roundRestLabel(block: V3Block): string | null {
  const r = block.rest;
  const sec = r ? r.seconds : block.rest_between_rounds_sec;
  if (!sec || sec <= 0) return null;
  const kind = r?.kind ?? (block.structure === 'superset' && block.items.length > 1 ? 'after_pair' : ROUND_STRUCTURES.has(block.structure) || block.structure === 'emom' ? 'after_round' : null);
  if (!kind || kind === 'between_sets') return null;
  const head = r?.full_recovery ? 'Full recovery' : 'Rest';
  if (kind === 'after_pair') return `${head} ${secondsLabel(sec)} after each pair`;
  if (kind === 'after_round' || kind === 'interval') return `${head} ${secondsLabel(sec)} between rounds`;
  return null;
}

/** Per-row rest: straight sets show the item's own rest; grouped formats show it on the block. */
export function itemRest(item: V3Item, block: V3Block): string | null {
  if (ROUND_STRUCTURES.has(block.structure) || block.structure === 'emom' || block.structure === 'continuous' || block.interval) return null;
  if (block.rest && block.rest.kind !== 'between_sets') return null;          // grouped work: the block says it once
  const sec = item.prescription.rest_sec;
  if (!sec || sec <= 0) return null;
  // Long rest reads as intentional: heavy low-rep lifting and max-intent power earn full recovery.
  return block.rest?.full_recovery && sec >= 150 ? `Full recovery ${secondsLabel(sec)}` : restLabel(sec);
}

/** Sweat anchor circuits: which rounds a station appears in. */
export function anchorRoundsLabel(item: V3Item, block: V3Block): string | null {
  if (block.structure !== 'anchor_circuit') return null;
  const rounds = item.prescription.direction_fields?.rounds;
  if (Array.isArray(rounds) && rounds.length) {
    return rounds.length === 1 ? `Round ${rounds[0]}` : `Rounds ${rounds.join(' + ')}`;
  }
  return 'Every round';
}

/** Guidance line under a prescription. Athletic quality-stop is shown separately. */
export function itemGuidance(item: V3Item): string | null {
  const g = item.prescription.load_guidance?.trim();
  if (!g) return null;
  // Some prescriptions already carry the guidance in `display` (e.g. "8 × 10 m, light sled, walk back").
  if (item.prescription.display && item.prescription.display.toLowerCase().includes(g.toLowerCase())) return null;
  return g;
}

export function progressionText(item: V3Item): string | null {
  const t = item.progression?.text;
  return t && t.trim() ? t.trim() : null;
}

export function thumbnailUrl(item: { exercise?: { media?: { thumbnail_url?: string | null } | null } | null }): string | null {
  const u = item.exercise?.media?.thumbnail_url;
  return typeof u === 'string' && /^https?:\/\//.test(u) ? u : null;
}

export function hasVideo(item: { exercise?: { media?: { video_url?: string | null } | null } | null }): boolean {
  const u = item.exercise?.media?.video_url;
  return typeof u === 'string' && /^https?:\/\//.test(u);
}

/** Title line: "Upper Push" plus the Target label when the user chose one. */
export function workoutTitle(w: V3Workout): { title: string; subtitle: string | null } {
  const t = w.target;
  const showTarget = t && (t.mode === 'explicit' || t.mode === 'full_body') && t.label && t.label !== w.archetype.name;
  return { title: w.archetype.name, subtitle: showTarget ? t.label : null };
}

/** The reroute line from Built for Today (API text), if the workout was rerouted. */
export function rerouteNotice(w: V3Workout, outcome: string): string | null {
  if (outcome !== 'rerouted') return null;
  const line = w.built_for_today.find((l) => l.code.includes('reroute'));
  if (line) return line.text;
  return w.requested_archetype ? `Today moved from ${w.requested_archetype.name} to ${w.archetype.name}.` : null;
}

export function exerciseCount(w: V3Workout): number {
  return w.blocks.reduce((n, b) => n + b.items.length, 0);
}

/** Initials for the no-media exercise tile ("Barbell Bench Press" -> "BB"). */
export function initials(name: string): string {
  const words = name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  return (words.slice(0, 2).map((w) => w[0]).join('') || '•').toUpperCase();
}
