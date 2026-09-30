/**
 * MOOD V3 Workout Preview: compact structural view over the unified envelope (Phase 2.5, tightened in 2.6).
 *
 * The Preview answers "what am I doing?" in a few seconds. Details answers "why and how".
 *   STRAIGHT SETS            1 · Barbell Back Squat   4 × 6     (numbered through the session)
 *   SUPERSET · 3 rounds      A1 Cable Fly   12 reps
 *   CIRCUIT · 4 rounds       Burpee   8
 *   HYBRID · 6 rounds        ANCHOR Row Erg 550 m (every round), R1 Sled Push, R2 Front-Rack Carry ...
 *   EMOM / INTERVALS / TIMED CIRCUIT / CONTINUOUS / PYRAMID / LADDER / FINISHER
 *   PRIMARY / SECONDARY      Athletic exposures; the primary and repeat efforts keep one essential quality stop
 *   REPEAT EFFORTS / SUPPORT
 *
 * Presentation only: names, prescriptions and cues are the API's text. No workout rules live here.
 */
import type { V3Block, V3Item, V3Workout } from './v3Api';
import { secondsLabel } from './v3OverviewFormat';
import { bodyAreaOf } from './v3HomeModel';

export interface PreviewRow {
  key: string;
  itemId: string;
  /** Left marker: "1", "A1", "ANCHOR", "R1", "R1+R6"; null for plain circuit rows. */
  tag: string | null;
  name: string;
  detail: string;
  /** One short secondary line: the Hybrid anchor's "Every round", an Athletic quality stop. */
  note: string | null;
}

export interface PreviewSection {
  key: string;
  label: string;
  /** One short line under the label (Complement / Finisher title, Hybrid flow). */
  caption: string | null;
  grouped: boolean;
  rows: PreviewRow[];
}

const GENERIC_TITLES = new Set([
  'main lift', 'strength', 'accessory', 'target block', 'primary exposure', 'secondary exposure', 'third exposure',
  'repeat efforts', 'performance support', 'superset', 'circuit', 'pyramid', 'ladder', 'finisher', 'hybrid', 'engine',
]);

/** The one cue worth reading before a set: the stop rule when there is one, else the first sentence. */
export function essentialCue(text: string | null | undefined): string | null {
  const t = (text ?? '').trim();
  if (!t) return null;
  const sentences = (t.match(/[^.!?]+[.!?]?/g) ?? [t]).map((x) => x.trim()).filter(Boolean);
  const stop = sentences.find((x) => /\b(end|stop)\b/i.test(x));
  return (stop ?? sentences[0] ?? t).trim();
}

function roundsText(n: number | null | undefined): string | null {
  return n && n > 0 ? `${n} ${n === 1 ? 'round' : 'rounds'}` : null;
}

function join(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(' · ');
}

/** Inside a rounds structure the "N ×" is the round count, already in the label: "2 × 12" -> "12". */
export function perRound(item: V3Item, rounds: number | null, unit = ''): string {
  const d = item.prescription.display.trim();
  const m = d.match(/^(\d+)\s*×\s*(.+)$/);
  const body = m && rounds && Number(m[1]) === rounds ? m[2] : d;
  return unit && /^\d+(–\d+)?$/.test(body) ? `${body} ${unit}` : body;
}

export function stationTag(item: V3Item, total: number | null): string | null {
  const r = item.prescription.direction_fields?.rounds;
  if (!Array.isArray(r) || !r.length || (total && r.length >= total)) return null;
  return r.map((x: number) => `R${x}`).join('+');
}

function row(item: V3Item, tag: string | null, detail?: string, note: string | null = null): PreviewRow {
  return { key: item.item_id, itemId: item.item_id, tag, name: item.exercise.name, detail: detail ?? item.prescription.display, note };
}

function caption(block: V3Block, label: string): string | null {
  const t = (block.title ?? '').trim();
  if (!t || GENERIC_TITLES.has(t.toLowerCase())) return null;
  return label.toLowerCase().startsWith(t.toLowerCase()) ? null : t;
}

const ATHLETIC_LABEL: Record<string, string> = { primary: 'PRIMARY', secondary: 'SECONDARY' };

/** The structural sections of a workout, in session order. */
export function previewSections(w: V3Workout): PreviewSection[] {
  const out: PreviewSection[] = [];
  let groupLetter = 0;
  let num = 0;
  const isHybrid = w.archetype.id === 'sweat_hybrid';

  for (const b of w.blocks) {
    const s = b.structure;
    const last = out[out.length - 1];

    if (s === 'straight' && b.type !== 'support') {
      const rows = b.items.map((i) => row(i, String(++num)));
      if (last && last.key.startsWith('straight')) last.rows.push(...rows);
      else out.push({ key: `straight-${b.block_id}`, label: 'STRAIGHT SETS', caption: null, grouped: false, rows });
      continue;
    }
    if (s === 'exposure') {
      const label = ATHLETIC_LABEL[b.type] ?? 'SECONDARY';
      const rows = b.items.map((i) => row(i, null, undefined, b.type === 'primary' ? essentialCue(i.quality_stop) : null));
      if (last && last.label === label && last.key.startsWith('exposure')) last.rows.push(...rows);
      else out.push({ key: `exposure-${b.block_id}`, label, caption: null, grouped: false, rows });
      continue;
    }

    let label: string;
    let grouped = false;
    let rows: PreviewRow[];
    let cap: string | null = null;
    switch (s) {
      case 'superset': {
        const letter = String.fromCharCode(65 + (groupLetter++ % 26));
        label = join('SUPERSET', roundsText(b.rounds));
        grouped = b.items.length > 1;
        rows = b.items.map((i, k) => row(i, grouped ? `${letter}${k + 1}` : String(++num), grouped ? perRound(i, b.rounds, 'reps') : undefined));
        break;
      }
      case 'anchor_circuit': {
        label = join(isHybrid ? 'HYBRID' : 'ANCHOR CIRCUIT', roundsText(b.rounds));
        const anchor = b.items.find((i) => i.role === 'anchor') ?? b.items[0];
        const stations = b.items.filter((i) => i !== anchor);
        const rotating = stations.some((i) => stationTag(i, b.rounds) !== null);
        cap = rotating ? 'Anchor every round, then that round’s station' : 'Anchor every round, then every station';
        rows = [row(anchor, 'ANCHOR', undefined, 'Every round'), ...stations.map((i) => row(i, stationTag(i, b.rounds)))];
        break;
      }
      case 'circuit':
        label = join('CIRCUIT', roundsText(b.rounds));
        rows = b.items.map((i) => row(i, null, perRound(i, b.rounds)));
        break;
      case 'emom':
        label = join('EMOM', typeof b.interval?.minutes === 'number' ? `${b.interval.minutes} min` : roundsText(b.rounds));
        rows = b.items.map((i) => row(i, null, perRound(i, b.rounds)));
        break;
      case 'intervals':
        label = join('INTERVALS', roundsText(b.interval?.rounds ?? b.rounds));
        rows = b.items.map((i) => row(i, null));
        break;
      case 'timed_circuit':
        label = join('TIMED CIRCUIT', roundsText(b.rounds));
        rows = b.items.map((i) => row(i, null, perRound(i, b.rounds)));
        cap = b.interval?.work_sec ? `${secondsLabel(b.interval.work_sec)} on / ${secondsLabel(b.interval.recovery_sec ?? 0)} off per station` : null;
        break;
      case 'continuous':
        label = join('CONTINUOUS', b.est_minutes ? `~${Math.round(b.est_minutes)} min` : null);
        rows = b.items.map((i) => row(i, null));
        break;
      case 'repeats':
        label = join('REPEAT EFFORTS', roundsText(b.rounds));
        rows = b.items.map((i) => row(i, null, undefined, essentialCue(i.quality_stop)));
        break;
      case 'straight': // Athletic support
        label = 'SUPPORT';
        rows = b.items.map((i) => row(i, null));
        break;
      default:
        label = join(s.replace(/_/g, ' ').toUpperCase(), s === 'finisher' ? roundsText(b.rounds) : null);
        rows = b.items.map((i) => row(i, null, s === 'finisher' ? perRound(i, b.rounds) : undefined));
    }
    out.push({ key: `${s}-${b.block_id}`, label, caption: cap ?? caption(b, label), grouped, rows });
  }
  return out;
}

const LEVEL: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

/** Preview header facts: "~45 min · 5 exercises · Advanced" (Difficulty = the session's experience). */
export function previewMeta(w: V3Workout): string {
  const n = w.blocks.reduce((k, b) => k + b.items.length, 0);
  const est = Math.round(w.duration.estimated_minutes);
  return [`~${est} min`, `${n} ${n === 1 ? 'exercise' : 'exercises'}`, LEVEL[w.experience] ?? null].filter(Boolean).join(' · ');
}

/** Built for Today lines for the Preview, most meaningful first (the API already orders adaptation > decision > context). */
export function builtForToday(w: V3Workout): { key: string; kind: 'adaptation' | 'decision' | 'context'; text: string }[] {
  const rank = { adaptation: 0, decision: 1, context: 2 } as const;
  return (w.built_for_today ?? [])
    .map((l, i) => ({ key: `${l.code}-${i}`, kind: (l.kind ?? 'decision') as 'adaptation' | 'decision' | 'context', text: l.text, i }))
    .sort((a, b) => rank[a.kind] - rank[b.kind] || a.i - b.i)
    .map(({ key, kind, text }) => ({ key, kind, text }));
}

/** Preview title: the Target for Target sessions ("Chest", "Back + Core"), else the session type. */
export function previewTitle(w: V3Workout): string {
  // Strength Focus body areas are Target sets; show them as the area the user chose ("Upper Body", not "Chest + Back + Shoulders").
  if (w.target.mode === 'explicit' && w.target.muscles?.length) {
    const area = bodyAreaOf(w.target.muscles);
    if (area) return area.label;
  }
  if ((w.selection_source === 'target' || w.target.mode === 'explicit') && w.target.label && w.target.mode === 'explicit') return w.target.label;
  if (w.target.mode === 'full_body' && w.archetype.id !== 'strength_full_body') return 'Full Body';
  return w.archetype.name;
}

/** Exercise ids of a workout, in order (Different Workout comparison). */
export function exerciseIds(w: V3Workout | null | undefined): string[] {
  return w ? w.blocks.flatMap((b) => b.items.map((i) => i.exercise.id)) : [];
}

/** How a Different Workout result differs from the one on screen. */
export function workoutDiff(before: V3Workout, after: V3Workout): { archetypeChanged: boolean; changed: number; total: number; identical: boolean } {
  const a = exerciseIds(before);
  const b = exerciseIds(after);
  const set = new Set(a);
  const changed = b.filter((x) => !set.has(x)).length;
  return { archetypeChanged: before.archetype.id !== after.archetype.id, changed, total: b.length, identical: a.join('|') === b.join('|') };
}

/** Confirmation after Different Workout: "New workout · Upper Pull" / "New Chest workout · 4 of 5 exercises changed". */
export function differentWorkoutMessage(before: V3Workout, after: V3Workout): string {
  const d = workoutDiff(before, after);
  if (d.archetypeChanged) return `New workout · ${after.archetype.name}`;
  return `New ${previewTitle(after)} workout · ${d.changed} of ${d.total} exercises changed`;
}
