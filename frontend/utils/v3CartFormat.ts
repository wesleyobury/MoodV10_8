/**
 * MOOD V3 Workout Cart (H2): presentation model over the unified envelope. Pure, no React.
 *
 * The Cart is one screen: hero, metadata, Built for Today, then every block in API order. It merges what the Phase 2.6
 * Preview (structure tags, per-round prescriptions) and Details (block facts, rest, thumbnails, cues) showed, so no
 * content is lost; the richer per-exercise detail moves into the row's detail sheet.
 *
 * Block headings are Direction-specific and come from the API's block `type` (its programming role), never from a
 * shared fake section list:
 *   Strength  main / secondary / target / accessory / finisher        -> Main Lift / Secondary / Target / Accessory / Finisher
 *   Sweat     primary / complement / finisher                         -> Primary / Complement / Finisher (+ Circuit, EMOM,
 *                                                                        Intervals, Hybrid ... from `structure`)
 *   Athletic  primary / secondary / strength / support / finisher     -> Primary / Secondary / Athletic Strength /
 *                                                                        Support / Finisher
 * The API's own block title is kept as the subtitle when it adds something ("Primary Power · Vertical power").
 * Nothing here changes a workout: names, prescriptions and explanations are the API's text.
 */
import type { V3Block, V3Direction, V3Item, V3Workout } from './v3Api';
import { STATE_LABEL, bodyAreaOf } from './v3HomeModel';
import { blockMeta, itemRest, progressionText } from './v3OverviewFormat';
import { essentialCue, perRound, previewTitle, stationTag } from './v3PreviewFormat';
import { TermId, plain, plainEffortFromPrescription, plainEffortLabel, termsIn } from './v3PlainLanguage';

/* ------------------------------------------------------------------ header */

const LEVEL: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

export function prettyMuscle(m: string): string {
  return m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Body emphasis for the header, when useful. Strength only (Sweat and Athletic titles already say what the session
 * is). An explicit Target wins; otherwise the two muscles that the main and supporting work load most often.
 */
export function bodyEmphasis(w: V3Workout): string | null {
  if (w.direction !== 'strength') return null;
  // Never repeat the title ("Full Body" / "Biceps + Triceps + Back") as a fact under it.
  const same = (x: string) => (x.toLowerCase() === previewTitle(w).toLowerCase() ? null : x);
  if (w.target.mode === 'explicit' && w.target.label) return bodyAreaOf(w.target.muscles) ? null : same(w.target.label);
  if (w.target.mode === 'full_body' || w.archetype.id === 'strength_full_body') return same('Full body');
  const count = new Map<string, number>();
  for (const b of w.blocks) {
    if (b.type === 'finisher') continue;
    const weight = b.type === 'main' ? 2 : 1;
    for (const it of b.items) {
      const m = it.exercise.primary_muscles?.[0];
      if (m) count.set(m, (count.get(m) ?? 0) + weight);
    }
  }
  const top = [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([m]) => prettyMuscle(m));
  const title = previewTitle(w).toLowerCase();
  const fresh = top.filter((m) => !title.includes(m.toLowerCase()));
  return fresh.length ? top.join(', ') : null;
}

/** "~44 min": the estimated workout, never the requested window (a 60-minute request can be a 44-minute session). */
export function estimatedLabel(w: V3Workout): string {
  return `~${Math.round(w.duration.estimated_minutes)} min`;
}

export interface CartHeader {
  eyebrow: string;
  title: string;
  subtitle: string | null;
  facts: string[];
}

export function cartHeader(w: V3Workout): CartHeader {
  // The eyebrow stays one line: up to two sore areas are named; with more it just says Sore (Built for Today names them all).
  const regions = w.soreness.regions;
  const sore = regions.length > 2 ? 'Sore' : `Sore ${regions.map((r) => r.replace(/_/g, ' ')).join(', ')}`;
  const states = w.states.map((s) => (s === 'sore' && regions.length ? sore : STATE_LABEL[s] ?? s));
  const title = previewTitle(w);
  // Target sessions titled by their Target keep the session type as a subtitle ("Chest" / "Upper Push").
  const subtitle = title !== w.archetype.name && w.archetype.id !== 'strength_custom_target' ? w.archetype.name : null;
  const facts = [estimatedLabel(w), LEVEL[w.experience] ?? null, w.equipment.preset !== 'commercial_gym' ? w.equipment.label : null, bodyEmphasis(w)];
  return {
    eyebrow: [w.direction_name, ...states].join(' · ').toUpperCase(),
    title,
    subtitle,
    facts: facts.filter(Boolean) as string[],
  };
}

/* ------------------------------------------------------------------ blocks */

const ROLE_LABEL: Record<V3Direction, Record<string, string>> = {
  strength: { main: 'Main Lift', secondary: 'Secondary', target: 'Target', accessory: 'Accessory', finisher: 'Finisher' },
  sweat: { primary: 'Primary', complement: 'Complement', finisher: 'Finisher' },
  athletic: { primary: 'Primary', secondary: 'Secondary', strength: 'Athletic Strength', support: 'Support', finisher: 'Finisher' },
};

const STRUCTURE_LABEL: Record<string, string> = {
  straight: 'Straight sets',
  superset: 'Superset',
  circuit: 'Circuit',
  emom: 'EMOM',
  intervals: 'Intervals',
  timed_circuit: 'Timed circuit',
  continuous: 'Continuous',
  repeats: 'Repeat efforts',
  exposure: 'Quality reps',
  pyramid: 'Pyramid',
  ladder: 'Ladder',
  finisher: 'Finisher',
};

/** Structures whose rows show the per-round prescription (the round count lives in the block facts). */
const PER_ROUND = new Set(['superset', 'circuit', 'emom', 'timed_circuit', 'finisher']);

export interface CartRow {
  key: string;
  item: V3Item;
  /** Left marker: "A1", "ANCHOR", "R1+R6"; null for plain rows. */
  tag: string | null;
  /** The prescription as the row shows it (per round inside a rounds structure). */
  rx: string;
  /** Secondary facts: rest (straight sets) and one muscle. Hybrid station rounds live in the R-tag. */
  facts: string[];
  /** One short line when it matters before a set: the Athletic primary's quality stop. */
  note: string | null;
  /** Scalable bodyweight strength: "Scale assistance or load" (details in the sheet). */
  scale: string | null;
  hasProgression: boolean;
}

export interface CartBlock {
  key: string;
  number: number;
  heading: string;
  subtitle: string | null;
  structure: string;
  /** Structure word + block facts: "Superset · 3 rounds · 90 s between rounds", "EMOM · 12 min". */
  facts: string;
  caption: string | null;
  instructions: string | null;
  grouped: boolean;
  rows: CartRow[];
  /** Training terms this block's format uses (tappable definitions): EMOM, superset ... */
  terms: TermId[];
}

function grouped0(b: V3Block): boolean {
  return b.structure === 'superset' && b.items.length > 1;
}

function norm(s: string | null | undefined): string {
  return (s ?? '').trim().toLowerCase();
}

export function cartBlocks(w: V3Workout): CartBlock[] {
  let letter = 0;
  const isHybrid = w.archetype.id === 'sweat_hybrid';
  return w.blocks.map((b, idx) => {
    const heading = ROLE_LABEL[w.direction]?.[b.type] ?? (b.title || prettyMuscle(b.type));
    const structWord = b.structure === 'anchor_circuit' ? (isHybrid ? 'Hybrid' : 'Anchor circuit') : STRUCTURE_LABEL[b.structure] ?? prettyMuscle(b.structure);
    const meta = blockMeta(b, w.direction);
    // Straight sets are the default (rest shows per row); blockMeta already leads with the format for Sweat intervals /
    // EMOM; a Finisher heading already says Finisher. Say the structure once, only when it adds something.
    const quiet = b.structure === 'straight' || norm(structWord) === norm(heading) || (meta.length > 0 && norm(meta[0]).startsWith(norm(structWord)));
    const rawFacts = [...(quiet ? [] : [structWord]), ...meta];
    const facts = rawFacts.map(plainEffortLabel).join(' · ');
    const terms = termsIn(rawFacts.filter((f) => !/^RPE/.test(f)).join(' '), grouped0(b) ? 'superset' : '');
    const t = norm(b.title);
    const subtitle = b.title && t !== norm(heading) && t !== norm(structWord) && t !== 'strength' ? b.title : null;

    const grouped = b.structure === 'superset' && b.items.length > 1;
    const L = grouped ? String.fromCharCode(65 + (letter++ % 26)) : '';
    let caption: string | null = null;
    let items = b.items;
    let tags: (string | null)[] = items.map((_, i) => (grouped ? `${L}${i + 1}` : null));
    if (b.structure === 'anchor_circuit') {
      const anchor = b.items.find((i) => i.role === 'anchor') ?? b.items[0];
      const stations = b.items.filter((i) => i !== anchor);
      const rotating = stations.some((i) => stationTag(i, b.rounds) !== null);
      caption = rotating ? 'Anchor every round, then that round’s station.' : 'Anchor every round, then every station.';
      items = [anchor, ...stations];
      tags = [ 'ANCHOR', ...stations.map((i) => stationTag(i, b.rounds)) ];
    }

    const rows: CartRow[] = items.map((it, i) => {
      const rest = itemRest(it, b);
      // One muscle is useful context on lifting rows; on conditioning / power rows it misleads (a bike is not "Quads").
      const liftingRow = w.direction === 'strength' || (w.direction === 'athletic' && b.type === 'strength');
      const muscle = liftingRow && it.exercise.primary_muscles?.[0] ? prettyMuscle(it.exercise.primary_muscles[0]) : null;
      const primaryAthletic = w.direction === 'athletic' && b.type === 'primary';
      return {
        key: it.item_id,
        item: it,
        tag: tags[i],
        rx: plain(PER_ROUND.has(b.structure) ? perRound(it, b.rounds, b.structure === 'superset' && it.prescription.kind === 'reps' ? 'reps' : '') : it.prescription.display),
        facts: [rest, muscle].filter(Boolean) as string[],
        note: primaryAthletic || b.structure === 'repeats' ? plain(essentialCue(it.quality_stop)) || null : b.structure === 'anchor_circuit' && i === 0 ? 'Every round' : null,
        scale: it.prescription.scaling?.short ?? null,
        hasProgression: !!progressionText(it),
      };
    });

    return {
      key: b.block_id,
      number: idx + 1,
      heading,
      subtitle,
      structure: b.structure,
      facts,
      caption,
      instructions: plain(b.instructions) || null,
      grouped,
      rows,
      terms,
    };
  });
}

/* ------------------------------------------------------------------ Built for Today */

export interface CartExplain {
  /** Shown collapsed: the one line worth reading first (the soreness/reroute reason when the plan was adjusted, else the
   *  API's teaser, else the first adaptation / line). Plain English. */
  lead: string | null;
  told: string[];
  chose: string | null;
  chosenBy: string | null;
  lines: { key: string; kind: 'adaptation' | 'decision' | 'context'; text: string }[];
  /** Training terms the explanation mentions (definitions on tap), detected on the engine's original wording. */
  terms: TermId[];
  /** true when the workout was rerouted (kept for analytics; there is no separate "Adjusted for today" surface). */
  adjusted: boolean;
}

/**
 * One explainability surface (founder edit pass): a soreness / conflict reroute is one of the Built for Today reasons,
 * not a second card. When the engine already explains the move (a sore / reroute line), that line leads and the
 * generic "Today moved from X to Y" notice is dropped; otherwise the notice leads, in plain words. Nothing is said twice.
 */
export function cartExplain(w: V3Workout, rerouteText: string | null): CartExplain {
  const rank = { adaptation: 0, decision: 1, context: 2 } as const;
  const src = (w.built_for_today ?? []).map((l, i) => ({ ...l, i }));
  const soreLine = src.find((l) => /sore|reroute/.test(l.code) || /\bsore\b/i.test(l.text));
  const adjusted = !!rerouteText;
  const lines = src
    .filter((l) => l === soreLine || !(rerouteText && l.text === rerouteText))
    .map((l) => ({ key: `${l.code}-${l.i}`, kind: (l.kind ?? 'decision') as 'adaptation' | 'decision' | 'context', text: plain(l.text), i: l.i, sore: l === soreLine }))
    .sort((a, b) => Number(b.sore) - Number(a.sore) || rank[a.kind] - rank[b.kind] || a.i - b.i)
    .map(({ key, kind, text }) => ({ key, kind, text }));
  let lead: string | null;
  if (adjusted && soreLine) lead = plain(soreLine.text);
  else if (adjusted && rerouteText) {
    const notice = plain(rerouteText.replace(/^Today moved from (.+) to (.+)\.$/, 'We changed today’s session from $1 to $2 so it works around how you feel.'));
    lines.unshift({ key: 'reroute', kind: 'adaptation', text: notice });
    lead = notice;
  } else lead = plain(w.today?.teaser?.text ?? lines[0]?.text ?? null) || null;
  const terms = termsIn(...src.map((l) => l.text), w.today?.teaser?.text, rerouteText);
  return { lead, told: w.today?.told ?? [], chose: w.today?.chose ?? null, chosenBy: w.today?.chosen_by ?? null, lines, terms, adjusted };
}

/* ------------------------------------------------------------------ detail sheet */

export interface ItemDetail {
  role: string;
  rx: string;
  facts: { label: string; value: string; term?: TermId }[];
  loadGuidance: string | null;
  /** "Make it fit you": assistance / added load so the reps land at the intended effort. */
  fit: string | null;
  qualityStop: string | null;
  progression: string | null;
  cues: string[];
  muscles: string[];
  equipment: string | null;
}

export function itemDetail(w: V3Workout, itemId: string): { item: V3Item; block: V3Block; detail: ItemDetail } | null {
  const blocks = cartBlocks(w);
  for (let bi = 0; bi < w.blocks.length; bi++) {
    const b = w.blocks[bi];
    const it = b.items.find((x) => x.item_id === itemId);
    if (!it) continue;
    const cb = blocks[bi];
    const row = cb.rows.find((r) => r.key === itemId);
    const p = it.prescription;
    const facts: { label: string; value: string; term?: TermId }[] = [];
    if (row?.rx && row.rx !== p.display) facts.push({ label: 'Per round', value: row.rx });
    const rest = itemRest(it, b);
    if (rest) facts.push({ label: 'Rest', value: rest.replace(/^Rest /, '') });
    const eff = plainEffortFromPrescription(p.rir, p.rpe);
    if (eff) facts.push({ label: 'Effort', value: eff.text, term: eff.term });
    const bf = cb.facts;
    if (bf) facts.push({ label: 'Format', value: bf, term: cb.terms[0] });
    return {
      item: it,
      block: b,
      detail: {
        role: [cb.heading, row?.tag].filter(Boolean).join(' · '),
        rx: plain(p.display),
        facts,
        loadGuidance: plain(p.scaling ? (p.load_guidance ?? '').replace(p.scaling.detail, '').trim() : p.load_guidance) || null,
        fit: p.scaling ? plain(p.scaling.detail.replace(/^Make it fit you\.\s*/, '')) : null,
        qualityStop: plain(it.quality_stop) || null,
        progression: plain(progressionText(it)) || null,
        cues: (it.cues || []).filter((c) => c && c.trim()).map(plain),
        muscles: (it.exercise.primary_muscles ?? []).map(prettyMuscle),
        equipment: it.exercise.equipment_label ?? null,
      },
    };
  }
  return null;
}

export function exerciseTotal(w: V3Workout): number {
  return w.blocks.reduce((n, b) => n + b.items.length, 0);
}
