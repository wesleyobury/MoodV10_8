/**
 * MOOD V3 Workout Preview: compact structural view over the unified envelope (Phase 2.5).
 *
 * The Preview answers "what am I about to do, and how is it organised?" in one screen:
 *   STRAIGHT SETS            consecutive straight blocks merged
 *   SUPERSET · 3 rounds      A1 / A2 tags
 *   CIRCUIT · 6 rounds
 *   HYBRID · 6 rounds        anchor every round + stations with their rounds
 *   EMOM · 10 min / INTERVALS / TIMED CIRCUIT / CONTINUOUS / PYRAMID / LADDER / FINISHER
 *   ATHLETIC EXPOSURE        consecutive exposures merged, one short quality cue per row
 *   REPEAT EFFORTS / PERFORMANCE SUPPORT
 *
 * Presentation only: names, prescriptions and cues are the API's text. No workout rules live here.
 */
import type { V3Block, V3GenerateRequest, V3Item, V3Workout } from './v3Api';
import { localDateISO } from './v3Api';
import { archetypeName, targetLabel } from './v3HomeModel';
import { secondsLabel } from './v3OverviewFormat';

export interface PreviewRow {
  key: string;
  itemId: string;
  tag: string | null;
  name: string;
  detail: string;
  /** Short secondary line: Hybrid rounds, Athletic quality cue. */
  note: string | null;
}

export interface PreviewSection {
  key: string;
  label: string;
  /** One short line under the label (block title for complements/finishers, Hybrid flow). */
  caption: string | null;
  grouped: boolean;
  rows: PreviewRow[];
}

const GENERIC_TITLES = new Set([
  'main lift', 'strength', 'accessory', 'target block', 'primary exposure', 'secondary exposure', 'third exposure',
  'repeat efforts', 'performance support', 'superset', 'circuit', 'pyramid', 'ladder', 'finisher', 'hybrid', 'engine',
]);

/** First sentence of an Athletic quality stop: the one cue that matters before starting. */
export function essentialCue(text: string | null | undefined): string | null {
  const t = (text ?? '').trim();
  if (!t) return null;
  const sentences = (t.match(/[^.!?]+[.!?]?/g) ?? [t]).map((x) => x.trim()).filter(Boolean);
  // Prefer the stop rule when the first sentence is set-up only ("Full walk-back between reps.").
  const stop = sentences.find((x) => /\b(end|stop)\b/i.test(x));
  const first = sentences[0] ?? t;
  return (stop ?? first).trim();
}

function roundsText(n: number | null | undefined): string | null {
  return n && n > 0 ? `${n} ${n === 1 ? 'round' : 'rounds'}` : null;
}

function join(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(' · ');
}

function hybridRounds(item: V3Item, total: number | null): string {
  const r = item.prescription.direction_fields?.rounds;
  if (Array.isArray(r) && r.length && !(total && r.length >= total)) return r.length === 1 ? `Round ${r[0]}` : `Rounds ${r.join(' + ')}`;
  return 'Every round';
}

function row(item: V3Item, tag: string | null = null, note: string | null = null): PreviewRow {
  return { key: item.item_id, itemId: item.item_id, tag, name: item.exercise.name, detail: item.prescription.display, note };
}

function caption(block: V3Block, label: string): string | null {
  const t = (block.title ?? '').trim();
  if (!t || GENERIC_TITLES.has(t.toLowerCase())) return null;
  return label.toLowerCase().startsWith(t.toLowerCase()) ? null : t;
}

/** The structural sections of a workout, in session order. */
export function previewSections(w: V3Workout): PreviewSection[] {
  const out: PreviewSection[] = [];
  let groupLetter = 0;
  const isHybrid = w.archetype.id === 'sweat_hybrid';

  for (const b of w.blocks) {
    const s = b.structure;
    const last = out[out.length - 1];

    // Merge runs of plain straight sets and of Athletic exposures.
    if (s === 'straight' && b.type !== 'support') {
      if (last && last.key.startsWith('straight')) {
        last.rows.push(...b.items.map((i) => row(i)));
        continue;
      }
      out.push({ key: `straight-${b.block_id}`, label: 'STRAIGHT SETS', caption: null, grouped: false, rows: b.items.map((i) => row(i)) });
      continue;
    }
    if (s === 'exposure') {
      const rows = b.items.map((i) => row(i, null, essentialCue(i.quality_stop)));
      if (last && last.key.startsWith('exposure')) {
        last.rows.push(...rows);
        continue;
      }
      out.push({ key: `exposure-${b.block_id}`, label: 'ATHLETIC EXPOSURE', caption: null, grouped: false, rows });
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
        rows = b.items.map((i, k) => row(i, grouped ? `${letter}${k + 1}` : null));
        break;
      }
      case 'anchor_circuit': {
        label = join(isHybrid ? 'HYBRID' : 'ANCHOR CIRCUIT', roundsText(b.rounds));
        const anchor = b.items.find((i) => i.role === 'anchor') ?? b.items[0];
        const stations = b.items.filter((i) => i !== anchor);
        const rotating = stations.some((i) => Array.isArray(i.prescription.direction_fields?.rounds) && i.prescription.direction_fields!.rounds.length < (b.rounds ?? 0));
        cap = rotating ? `${anchor.exercise.name} every round, then that round's station` : `${anchor.exercise.name} every round, then every station`;
        rows = [row(anchor, 'ANCHOR', 'Every round'), ...stations.map((i) => row(i, null, hybridRounds(i, b.rounds)))];
        break;
      }
      case 'emom':
        label = join('EMOM', typeof b.interval?.minutes === 'number' ? `${b.interval.minutes} min` : roundsText(b.rounds));
        rows = b.items.map((i) => row(i));
        break;
      case 'intervals':
        label = join('INTERVALS', roundsText(b.interval?.rounds ?? b.rounds));
        rows = b.items.map((i) => row(i));
        break;
      case 'timed_circuit':
        label = join('TIMED CIRCUIT', roundsText(b.rounds));
        rows = b.items.map((i) => row(i));
        cap = b.interval?.work_sec ? `${secondsLabel(b.interval.work_sec)} on / ${secondsLabel(b.interval.recovery_sec ?? 0)} off per station` : null;
        break;
      case 'continuous':
        label = join('CONTINUOUS', b.est_minutes ? `~${Math.round(b.est_minutes)} min` : null);
        rows = b.items.map((i) => row(i));
        break;
      case 'repeats':
        label = join('REPEAT EFFORTS', roundsText(b.rounds));
        rows = b.items.map((i) => row(i, null, essentialCue(i.quality_stop)));
        break;
      case 'straight': // Athletic support
        label = 'PERFORMANCE SUPPORT';
        rows = b.items.map((i) => row(i));
        break;
      case 'circuit':
        label = join('CIRCUIT', roundsText(b.rounds));
        rows = b.items.map((i) => row(i));
        break;
      default:
        label = join(s.replace(/_/g, ' ').toUpperCase(), ['finisher'].includes(s) ? roundsText(b.rounds) : null);
        rows = b.items.map((i) => row(i));
    }
    out.push({ key: `${s}-${b.block_id}`, label, caption: cap ?? caption(b, label), grouped, rows });
  }
  return out;
}

/** Header "type" line for the Preview's session-type control. */
export function typeLabel(w: V3Workout): { value: string; source: 'moods_pick' | 'user_selected' | 'target' } {
  const src = (w.selection_source ?? (w.target.mode === 'explicit' || w.target.mode === 'full_body' ? 'target' : 'moods_pick')) as
    | 'moods_pick'
    | 'user_selected'
    | 'target';
  if (src === 'target') {
    const lbl = w.target.label || targetLabel(w.target.muscles as any) || w.archetype.name;
    return { value: `Target: ${lbl}`, source: src };
  }
  const name = archetypeName(w.archetype.id) ?? w.archetype.name;
  return { value: src === 'moods_pick' ? `MOOD's Pick · ${name}` : name, source: src };
}

/** The request that produced a workout: today's stored request, else rebuilt from the envelope. */
export function requestFor(w: V3Workout, stored: V3GenerateRequest | null): V3GenerateRequest {
  if (stored) return { ...stored };
  const req: V3GenerateRequest = {
    direction: w.direction,
    states: [...w.states],
    soreness: w.states.includes('sore') ? (w.soreness.regions as any) : [],
    duration: (w.duration.requested_minutes === 30 ? 30 : 60) as 30 | 60,
    date: localDateISO(),
    persist: true,
  };
  if (w.selection_source === 'target' && w.target.mode === 'full_body') req.target = 'full_body';
  else if (w.selection_source === 'target' && w.target.muscles.length) req.target = [...w.target.muscles];
  if (w.selection_source === 'user_selected') req.archetype = w.archetype.id;
  return req;
}

/** Session type change: explicit archetype clears the Target; MOOD's Pick clears both (Phase 2.5 UX rule). */
export function withArchetype(req: V3GenerateRequest, archetype: string | null): V3GenerateRequest {
  const next: V3GenerateRequest = { ...req };
  delete next.target;
  delete next.archetype;
  if (archetype) next.archetype = archetype;
  return next;
}
