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
import { blockMeta, emomLabel, itemRest, progressionText } from './v3OverviewFormat';
import { essentialCue, perRound, previewTitle, stationTag } from './v3PreviewFormat';
import { TermId, plain, plainEffortFromPrescription, plainEffortLabel, termsIn } from './v3PlainLanguage';
import { V3_COACHING, sameCue } from './v3ExerciseCues';

/* ------------------------------------------------------------------ header */

const LEVEL: Record<string, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

export function prettyMuscle(m: string): string {
  return m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Athletic performance role (final pre-launch pass): why a movement is in an athletic session ("Total-Body Power",
 * "Lower-Body Power", "Upper-Body Power", "Rotational Power", "Acceleration", "Plyometric", "Strength Support",
 * "Core / Stability"). Athletic rows and sections show this instead of bodybuilding muscle labels (a landmine power
 * movement is not "Shoulders", a med-ball throw is not "Glutes"). null outside Athletic or on older envelopes.
 */
export function performanceRole(it: V3Item): string | null {
  const r = it.prescription?.direction_fields?.performance_role;
  return typeof r === 'string' && r ? r : null;
}

/** The distinct performance roles of a run of Athletic blocks, in order, at most two ("Total-Body Power · Plyometric"). */
function athleticRoles(blocks: V3Block[]): string | null {
  const out: string[] = [];
  // "Velocity Strength" is said once on the row (FOR VELOCITY), not again in the section sub-label
  for (const b of blocks) for (const it of b.items) { const r = performanceRole(it); if (r && r !== 'Velocity Strength' && !out.includes(r)) out.push(r); }
  return out.length ? out.slice(0, 2).join(' · ') : null;
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
      const m = (it.exercise.display_muscles ?? it.exercise.primary_muscles)?.[0];
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
  athletic: { primer: 'Primer', primary: 'Primary', secondary: 'Secondary', strength: 'Athletic Strength', support: 'Support', finisher: 'Finisher' },
};

/**
 * Athletic row context (sequencing / presentation pass): a short tag that says why the row is in an athletic session
 * ("FOR VELOCITY" on a traditional lift dosed for bar speed, "PRIMER" on a potentiation set, "HEAVY, THEN EXPLODE" on the heavy
 * half of a contrast pair). null elsewhere.
 */
export function contextTag(it: V3Item): string | null {
  const t = it.prescription?.direction_fields?.context_tag;
  return typeof t === 'string' && t ? t.toUpperCase() : null;
}

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
      // Athletic rows show the performance role instead (final pre-launch pass).
      const liftingRow = w.direction === 'strength';
      const muscle = w.direction === 'athletic' ? performanceRole(it) : liftingRow && (it.exercise.display_muscles ?? it.exercise.primary_muscles)?.[0] ? prettyMuscle((it.exercise.display_muscles ?? it.exercise.primary_muscles)![0]) : null;
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
  /**
   * Founder pass (Oct 2026): the whole Built for Today card is ONE reasoning blurb. The reasons (soreness / reroute, States,
   * your Target + history + goal, rotation, progression, 30 min, equipment ...) are joined into a paragraph; the
   * mechanics the session list already shows (structure, sets, volume, effort, difficulty limits, carry-over) are left out.
   */
  blurb: string | null;
}

/** Built for Today codes that carry a reason, in blurb order. Everything else (structure, volume, intensity, difficulty,
 *  history, carryover, preference) is mechanics or bookkeeping the session list already shows. */
const BLURB_ORDER: (string | RegExp)[] = [
  'reroute', 'sore_reroute', 'sore', 'sore_override', 'why_today', 'state_pair', /^state_/, 'session_expectation', 'target', 'allocation',
  'rotation_swap', 'rotation', 'frequency', 'different_workout', 'swap', 'progression', 'duration', 'duration_pair', 'equipment',
  'support', 'finisher', 'goal',
];
const GENERIC_GOAL = /built from today[’']s choices/i;

function blurbRank(code: string): number {
  const i = BLURB_ORDER.findIndex((c) => (typeof c === 'string' ? c === code : c.test(code)));
  return i < 0 ? -1 : i;
}

/** One paragraph from the reason lines, sentence-deduplicated (the synthesis and the Target line can both say "direct work"). */
export function bftBlurb(lines: { code: string; text: string }[]): string | null {
  const picked = lines
    .map((l, i) => ({ ...l, i, r: blurbRank(l.code) }))
    .filter((l) => l.r >= 0 && !(l.code === 'goal' && GENERIC_GOAL.test(l.text)))
    .sort((a, b) => a.r - b.r || a.i - b.i);
  const cands: { t: string; score: number; order: number }[] = [];
  const seen = new Set<string>();
  let order = 0;
  for (const l of picked) {
    for (const raw of l.text.split(/(?<=[.!?])\s+(?=[A-Z0-9])/)) {
      const t = raw.trim();
      if (!t) continue;
      const key = t.toLowerCase().replace(/[^a-z0-9 ]/g, '');
      if (seen.has(key)) continue;
      seen.add(key);
      cands.push({ t: /[.!?]$/.test(t) ? t : `${t}.`, score: sentenceScore(l.code, t), order: order++ });
    }
  }
  // Condensed (founder pass, Oct 2026): the most useful reasons only, at most BLURB_MAX sentences and about BLURB_CHARS
  // characters, read in their natural order. One sentence per topic (one goal sentence, one "direct work" sentence).
  const keep: typeof cands = [];
  const topics = new Set<string>();
  let chars = 0;
  for (const c of [...cands].filter((c) => c.score > 0).sort((a, b) => b.score - a.score || a.order - b.order)) {
    const topic = /goal/i.test(c.t) ? 'goal' : /direct work/i.test(c.t) ? 'direct' : /sore|away from/i.test(c.t) ? 'sore' : c.t;
    if (topics.has(topic)) continue;
    // the two most useful sentences always fit; a third only inside the character budget
    if (keep.length >= BLURB_MAX || (keep.length >= 2 && chars + c.t.length > BLURB_CHARS)) continue;
    keep.push(c); topics.add(topic); chars += c.t.length + 1;
  }
  return keep.length ? keep.sort((a, b) => a.order - b.order).map((c) => c.t).join(' ') : null;
}

const BLURB_MAX = 3;
const BLURB_CHARS = 280;

/** How much a sentence tells the user about THEIR workout today. 0 = mechanics / filler, never shown. */
function sentenceScore(code: string, t: string): number {
  if (/movements? (is|are) new|in that order|complexity and skill|working sets|short of failure|leads as the main lift/i.test(t)) return 0;
  if (/^As an? (beginner|intermediate|advanced)/i.test(t)) return 10;
  if (/sore|reroute|away from/i.test(t) || /sore|reroute/.test(code)) return 100;
  if (/^You[’']re |you[’']re (amped|stressed|bored|irritated|low)/i.test(t) || /^state_/.test(code)) return 90;
  if (/your last .* (day|session)|you trained|first .* day in MOOD|balances your week|rotates to/i.test(t)) return 80;
  if (/goal/i.test(t)) return 70;
  if (/sets today[’']s target|carries over|30 minutes|equipment you have/i.test(t)) return 60;
  if (code === 'why_today') return 50;
  if (/run as an? .* session/i.test(t)) return 20;
  return 30;
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
  // term chips follow the words the user actually reads
  // while the server is still writing (blurb_pending) the stored blurb is only the fallback: no chips for words not on screen
  const terms = w.today?.blurb_pending ? [] : w.today?.blurb?.trim() ? termsIn(w.today.blurb) : termsIn(...src.map((l) => l.text), w.today?.teaser?.text, rerouteText);
  // Oct 2026: the server writes the finished Built for Today copy (verified brief -> composer / LLM -> quality gate). Shown
  // verbatim. Older stored workouts without it fall back to stitching the reason lines.
  const blurb = w.today?.blurb?.trim() || (bftBlurb(lines.map((l) => ({ code: l.key.replace(/-\d+$/, ''), text: l.text }))) ?? lead);
  return { lead, told: w.today?.told ?? [], chose: w.today?.chose ?? null, chosenBy: w.today?.chosen_by ?? null, lines, terms, adjusted, blurb };
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
  /** common mistakes from the exercise library (optional) */
  mistakes: string[];
  /** setup / execution copy: the block instructions when they describe the movement, else null */
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
        // the MOOD coaching set when the exercise has one (setup, form, efficiency), the engine's cues otherwise; the
        // late-set breakdown leads "Watch out for" (founder review 6)
        cues: (() => {
          const c = V3_COACHING[it.exercise.id];
          return c ? [c.setup, c.form, c.efficiency] : (it.cues || []).filter((x) => x && x.trim()).map(plain);
        })(),
        mistakes: (() => {
          const c = V3_COACHING[it.exercise.id];
          const out: string[] = c ? [c.fatigue.replace(/^Last reps:\s*/, 'Late in a set: ')] : [];
          for (const m of (it.mistakes || []).filter((x) => x && x.trim()).map(plain)) if (!out.some((o) => sameCue(o, m))) out.push(m);
          return out;
        })(),
        // Athletic: the performance role replaces the muscle list (final pre-launch pass)
        muscles: w.direction === 'athletic' && performanceRole(it) ? [performanceRole(it) as string] : ((it.exercise.display_muscles ?? it.exercise.primary_muscles) ?? []).map(prettyMuscle),
        equipment: it.exercise.equipment_label ?? null,
      },
    };
  }
  return null;
}

export function exerciseTotal(w: V3Workout): number {
  return w.blocks.reduce((n, b) => n + b.items.length, 0);
}

/* ------------------------------------------------------------------ scan model (founder UX pass) */

/**
 * The Cart's job: "let me understand the workout I'm about to do in a few seconds." The scan model is what the Cart and the
 * Overview session mode render: block label, the exercises, sets / rounds, reps / time / distance and the grouping. Nothing
 * else: no rest (Guided Session runs it), no RPE, no muscles, no round rest, no warm-up. The envelope is untouched.
 */
export interface ScanRow {
  key: string;
  itemId: string;
  item: V3Item;
  /** "A1" / "A2" for pairs, "ANCHOR" for the Hybrid anchor, "1"…"n" station numbers for circuits, null for straight rows. */
  marker: string | null;
  name: string;
  /** "4 × 6–8" (straight sets), "12–15" (per round inside a pair / circuit), "45 s", "40 m", "12 cal". */
  rx: string;
  /** Stations of an anchor circuit that only appear in some rounds. */
  roundsNote: string | null;
  /** Athletic: "FOR VELOCITY" / "PRIMER" / "HEAVY, THEN EXPLODE" (why this row is here); null elsewhere. */
  context?: string | null;
}

export interface ScanBlock {
  key: string;
  number: number;
  /** "MAIN LIFT", "SUPERSET · 3 ROUNDS", "CIRCUIT · 4 ROUNDS", "INTERVALS · 8 × 2 MIN / 1:30 EASY", "EMOM · 24 MIN". */
  label: string;
  /** Second line when the block role and the structure both matter: "Accessory" under "SUPERSET · 3 ROUNDS". */
  sublabel: string | null;
  structure: string;
  /** Main work rows are larger and brighter than secondary / support work. */
  emphasis: 'main' | 'secondary';
  grouped: boolean;
  rows: ScanRow[];
  terms: TermId[];
}

const MAIN_TYPES: Record<V3Direction, Set<string>> = {
  strength: new Set(['main']),
  sweat: new Set(['primary']),
  athletic: new Set(['primary', 'strength']),
};

function secs(s: number): string {
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60), r = s % 60;
  return r === 0 ? `${m} min` : `${m}:${String(r).padStart(2, '0')}`;
}

/** The structure line from the rest contract and block fields only. */
export function structureLabel(b: V3Block): string | null {
  const iv = b.interval;
  const rest = b.rest;
  switch (b.structure) {
    case 'superset': return b.items.length > 1 ? `Superset · ${b.rounds ?? 1} rounds` : null;
    case 'circuit': return `Circuit · ${b.rounds ?? 1} rounds`;
    case 'anchor_circuit': return `Hybrid · ${b.rounds ?? 1} rounds`;
    case 'timed_circuit': return `Timed circuit · ${b.rounds ?? iv?.rounds ?? 1} rounds · ${secs(rest?.work_sec ?? iv?.work_sec ?? 0)} on / ${secs(rest?.recovery_sec ?? iv?.recovery_sec ?? 0)} easy`;
    case 'intervals':
    case 'finisher':
      if (rest?.kind === 'interval') return `${b.structure === 'finisher' ? 'Finisher' : 'Intervals'} · ${b.rounds ?? iv?.rounds ?? 1} rounds`;
      return b.structure === 'finisher' ? 'Finisher' : null;
    case 'emom': return emomLabel(b);
    case 'continuous': return `Steady · ${secs(b.items[0]?.prescription.seconds ?? 0)}`;
    case 'pyramid': return iv?.steps_sec?.length ? `Pyramid · ${iv.steps_sec.map((s) => secs(s)).join(' / ')}` : 'Pyramid';
    case 'ladder': {
      const sch = b.items[0]?.prescription.reps_scheme;
      return Array.isArray(sch) ? `Ladder · ${sch.join('-')}` : 'Ladder';
    }
    default: return null;
  }
}

export function cartScan(w: V3Workout): ScanBlock[] {
  let letter = 0;
  return w.blocks.map((b, idx) => {
    const role = ROLE_LABEL[w.direction]?.[b.type] ?? prettyMuscle(b.type);
    const structure = structureLabel(b);
    const grouped = b.structure === 'superset' && b.items.length > 1;
    const stationed = b.structure === 'circuit' || b.structure === 'timed_circuit' || b.structure === 'anchor_circuit' || b.structure === 'emom';
    // Athletic contrast pair: the pair is the method, not a generic superset
    const athContrast = w.direction === 'athletic' && b.type === 'primary' && grouped;
    const label = (athContrast ? `Contrast pair · ${b.rounds ?? 1} rounds` : structure && (grouped || stationed || b.rest?.kind === 'interval' || b.rest?.kind === 'continuous' || b.rest?.kind === 'self_paced') ? structure : role).toUpperCase();
    const sublabel = label !== role.toUpperCase() && !label.startsWith(role.toUpperCase()) && b.type !== 'primary' && b.type !== 'main' ? role : null;
    const L = grouped ? String.fromCharCode(65 + (letter++ % 26)) : '';
    let items = b.items;
    if (b.structure === 'anchor_circuit') {
      const anchor = b.items.find((i) => i.role === 'anchor') ?? b.items[0];
      items = [anchor, ...b.items.filter((i) => i !== anchor)];
    }
    const rows: ScanRow[] = items.map((it, i) => {
      const perRoundRx = PER_ROUND.has(b.structure) || b.structure === 'anchor_circuit' || b.rest?.kind === 'interval';
      let rx = plain(perRoundRx ? perRound(it, b.rounds, b.structure === 'superset' && it.prescription.kind === 'reps' ? 'reps' : '') : it.prescription.display);
      // the label already states the format: the row says only its own share
      if (b.structure === 'pyramid' && b.interval?.steps_sec?.length) rx = `${secs(b.interval.steps_sec.reduce((n, x) => n + x, 0))} total`;
      if (b.structure === 'ladder' && Array.isArray(it.prescription.reps_scheme)) rx = `${it.prescription.reps_scheme.join('-')} reps`;
      const marker = grouped ? `${L}${i + 1}` : b.structure === 'anchor_circuit' ? (i === 0 ? 'ANCHOR' : String(i)) : stationed ? String(i + 1) : null;
      return { key: it.item_id, itemId: it.item_id, item: it, marker, name: it.exercise.name, rx, roundsNote: b.structure === 'anchor_circuit' && i > 0 ? stationTag(it, b.rounds) : null,
               context: w.direction === 'athletic' ? contextTag(it) : null };
    });
    return {
      key: b.block_id,
      number: idx + 1,
      label,
      sublabel,
      structure: b.structure,
      // Athletic: the Power phase is the session's centre of gravity; Primer and Athletic Strength read as its lead-in and support
      emphasis: w.direction === 'athletic' && b.phase ? (b.phase === 'power' ? 'main' : 'secondary') : MAIN_TYPES[w.direction].has(b.type) ? 'main' : 'secondary',
      grouped,
      rows,
      terms: termsIn(structure ?? '', grouped ? 'superset' : ''),
    };
  });
}

/* ------------------------------------------------------------------ sections (founder review: primary / secondary / accessories) */

export interface ScanSection {
  key: string;
  /** "PRIMARY" / "SECONDARY" / "ACCESSORIES" / "FINISHER" (Strength); "PRIMARY" / "COMPLEMENT"; Athletic: "PRIMARY" / "SECONDARY" / "STRENGTH" / "SUPPORT" */
  title: string;
  /** the muscles this section loads most, e.g. "Chest · Triceps" */
  muscles: string | null;
  exercises: number;
  minutes: number | null;
  emphasis: 'main' | 'secondary';
  blocks: ScanBlock[];
}

const PHASE: Record<V3Direction, Record<string, string>> = {
  strength: { main: 'Primary', secondary: 'Secondary', accessory: 'Accessories', finisher: 'Finisher' },
  sweat: { primary: 'Primary', complement: 'Complement', finisher: 'Finisher' },
  athletic: { primary: 'Primary', secondary: 'Secondary', repeats: 'Secondary', strength: 'Strength', support: 'Support', finisher: 'Finisher' },
};

function phaseOf(w: V3Workout, b: V3Block): string {
  if (b.type === 'target') {
    // a Target block is named for what it loads: "chest block" -> CHEST; a generic title falls back to its top muscle
    const t = b.title.replace(/\s*block$/i, '').trim();
    if (t && !/^target$/i.test(t)) return prettyMuscle(t);
    return topMuscles([b])?.split(' · ')[0] ?? 'Target';
  }
  // Athletic (sequencing / presentation pass): blocks group into the session's phases (Primer -> Power -> Athletic Strength,
  // labelled for the actual work), so the cart reads as one coached progression instead of Primary / Secondary / Strength / Support
  if (w.direction === 'athletic' && b.phase_label) return b.phase_label;
  return PHASE[w.direction]?.[b.type] ?? prettyMuscle(b.type);
}

/** Engine muscle ids -> the muscle groups a lifter names (delt heads are Shoulders, lats are Back ...). */
const MUSCLE_GROUP: Record<string, string> = {
  front_delts: 'Shoulders', side_delts: 'Shoulders', rear_delts: 'Shoulders', shoulders: 'Shoulders',
  lats: 'Back', upper_back: 'Back', back: 'Back', traps: 'Back',
  spinal_erectors: 'Lower Back', lower_back: 'Lower Back',
  hip_adductors: 'Adductors', hip_abductors: 'Abductors',
  abs: 'Core', obliques: 'Core', core: 'Core',
};
export function muscleGroup(m: string): string {
  return MUSCLE_GROUP[m] ?? prettyMuscle(m);
}

/** An exercise's groups: its lead muscle, plus the second one for a compound lift (Trap-Bar Deadlift -> Glutes + Quads). */
function itemGroups(it: V3Item, compound: boolean): string[] {
  const ms = ((it.exercise.display_muscles ?? it.exercise.primary_muscles) ?? []).map(muscleGroup);
  return [...new Set(ms)].slice(0, compound ? 2 : 1);
}

/**
 * What a block trains, as muscle groups: one exercise names its lead muscle (two for a compound lift); a superset / circuit
 * names each exercise's lead muscle (Spider Curl + Lateral Raise -> Biceps + Shoulders). At most three names.
 */
export function blockMuscles(b: V3Block): string[] {
  const out: string[] = [];
  const single = b.items.length === 1;
  for (const it of b.items) for (const g of itemGroups(it, single)) if (!out.includes(g)) out.push(g);
  return out.slice(0, 3);
}

/** The muscles a run of blocks loads most, by each exercise's lead muscle (never a secondary one like forearms). */
function topMuscles(blocks: V3Block[]): string | null {
  const n = new Map<string, number>();
  for (const b of blocks) for (const it of b.items) {
    const g = itemGroups(it, false)[0];
    if (g) n.set(g, (n.get(g) ?? 0) + 1);
  }
  const top = [...n.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([m]) => m);
  return top.length ? top.join(' · ') : null;
}

const STRENGTH_ROLE: Record<string, string> = { main: 'Main lift', secondary: 'Strength', target: 'Target', accessory: 'Accessories', finisher: 'Finisher' };

/**
 * The Cart grouped the way a lifter reads a session: consecutive blocks with the same programming role become one section
 * (PRIMARY, SECONDARY, ACCESSORIES, FINISHER for Strength). Inside a section a straight block needs no label of its own; a
 * grouped or clocked block keeps its structure line (SUPERSET · 3 ROUNDS).
 */
export function cartSections(w: V3Workout): ScanSection[] {
  if (w.direction === 'strength') return strengthMuscleSections(w);
  const scan = cartScan(w);
  const out: ScanSection[] = [];
  w.blocks.forEach((b, i) => {
    const phase = phaseOf(w, b);
    const sb = scan[i];
    const roleUpper = (ROLE_LABEL[w.direction]?.[b.type] ?? prettyMuscle(b.type)).toUpperCase();
    // a straight block's label is its role; the section already says it
    // inside a section the structure line splits at the timing detail so it fits one line: TIMED CIRCUIT · 5 ROUNDS / 40 s on / 20 s easy
    const m = /^(.*?ROUNDS?) · (\d.*)$/.exec(sb.label);
    const block: ScanBlock = sb.label === roleUpper || (b.type === 'target' && !sb.grouped) ? { ...sb, label: '', sublabel: null } : m ? { ...sb, label: m[1], sublabel: m[2].toLowerCase() } : { ...sb, sublabel: null };
    const last = out[out.length - 1];
    if (last && last.title === phase.toUpperCase()) {
      last.blocks.push(block);
      last.exercises += b.items.length;
      last.minutes = last.minutes != null && b.est_minutes != null ? last.minutes + b.est_minutes : last.minutes ?? b.est_minutes ?? null;
      const merged = w.blocks.filter((x) => last.blocks.some((y) => y.key === x.block_id));
      last.muscles = w.direction === 'athletic' ? athleticRoles(merged) : topMuscles(merged);
      return;
    }
    out.push({ key: `${phase}-${b.block_id}`, title: phase.toUpperCase(), muscles: w.direction === 'athletic' ? athleticRoles([b]) : topMuscles([b]), exercises: b.items.length, minutes: b.est_minutes ?? null, emphasis: sb.emphasis, blocks: [block] });
  });
  return out;
}

/**
 * Strength Cart by muscle group (founder pass, Oct 2026): sections are named for what they train, in API order.
 *   CHEST                 Bench Press, Dip, Incline Press        (Main lift · Strength)
 *   CHEST + TRICEPS       superset: Cable Fly + Skull Crusher    (Accessories)
 *   TRICEPS               Cable Triceps Extension                (Accessories)
 * Consecutive blocks that train the same group(s) share a section; a superset or compound lift names every group it trains.
 * The programming role moves to the section's subline; the Finisher keeps its own section. Primary emphasis stays on the
 * section holding the main lift.
 */
const LEG_GROUPS = new Set(['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Adductors', 'Abductors']);
const legsOnly = (groups: string[]) => groups.length > 0 && groups.every((g) => LEG_GROUPS.has(g));
/** A leg section's name: up to two groups by name ("GLUTES + QUADS"), otherwise just LEGS. */
const legTitle = (groups: string[], picked: string[] | null) =>
  (groups.length <= 2 ? groups.join(' + ') : picked && picked.length <= 2 ? picked.join(' + ') : 'Legs').toUpperCase();

function strengthMuscleSections(w: V3Workout): ScanSection[] {
  const scan = cartScan(w);
  const out: (ScanSection & { roles: string[]; groups: string[]; legs: boolean; hasMain: boolean })[] = [];
  // the user's own leg Target (e.g. Hamstrings + Calves) names a merged leg section better than LEGS
  const tm = w.target?.mode === 'explicit' ? (w.target.muscles ?? []).map(muscleGroup) : [];
  const picked = tm.length && legsOnly(tm) ? [...new Set(tm)] : null;
  w.blocks.forEach((b, i) => {
    const sb = scan[i];
    const groups = blockMuscles(b);
    let title = (b.type === 'finisher' ? 'Finisher' : groups.join(' + ') || STRENGTH_ROLE[b.type] || prettyMuscle(b.type)).toUpperCase();
    // Leg days (founder pass, Oct 2026): leg work after the main lift is not split glute vs hamstring vs quad. Consecutive
    // leg-only blocks share one section, named for the groups it holds (two by name, more = LEGS).
    const legBlock = b.type !== 'finisher' && b.type !== 'main' && legsOnly(groups);
    const prev = out[out.length - 1];
    if (legBlock && prev && prev.legs && !prev.hasMain) {
      const union = [...prev.groups, ...groups.filter((g) => !prev.groups.includes(g))];
      prev.groups = union;
      prev.title = legTitle(union, picked);
      prev.key = `${prev.title}-${prev.blocks[0].key}`;
      title = prev.title;
    }
    const role = STRENGTH_ROLE[b.type] ?? prettyMuscle(b.type);
    // straight blocks need no label inside a section; grouped / clocked ones keep their structure line (SUPERSET · 3 ROUNDS)
    const m = /^(.*?ROUNDS?) · (\d.*)$/.exec(sb.label);
    const block: ScanBlock = !sb.grouped && b.structure === 'straight' ? { ...sb, label: '', sublabel: null } : m ? { ...sb, label: m[1], sublabel: m[2].toLowerCase() } : { ...sb, sublabel: null };
    const last = out[out.length - 1];
    if (last && last.title === title) {
      last.blocks.push(block);
      last.exercises += b.items.length;
      last.minutes = last.minutes != null && b.est_minutes != null ? last.minutes + b.est_minutes : last.minutes ?? b.est_minutes ?? null;
      if (!last.roles.includes(role)) last.roles.push(role);
      if (b.type === 'main') last.emphasis = 'main';
      if (b.type === 'main') last.hasMain = true;
      last.muscles = last.title === 'FINISHER' ? topMuscles(w.blocks.filter((x) => last.blocks.some((y) => y.key === x.block_id))) : last.roles.join(' · ');
      return;
    }
    out.push({
      key: `${title}-${b.block_id}`,
      title,
      muscles: b.type === 'finisher' ? topMuscles([b]) : role,
      exercises: b.items.length,
      minutes: b.est_minutes ?? null,
      emphasis: b.type === 'main' ? 'main' : 'secondary',
      blocks: [block],
      roles: [role],
      groups,
      legs: legBlock,
      hasMain: b.type === 'main',
    });
  });
  return out.map(({ roles: _roles, groups: _groups, legs: _legs, hasMain: _hasMain, ...sec }) => sec);
}
