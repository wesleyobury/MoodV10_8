/**
 * MOOD V3 Home: "Workouts for your mood" (founder Home redesign, Oct 2026). Pure, no React, no network.
 *
 * Home shows one recommendation per Direction (Strength, Sweat, Athletic), each built by the real generator with today's
 * States, sore areas and default length. They are fetched as live previews (`persist: false`, the contract's "home card"
 * mode: nothing stored) and only persisted when the user taps Start on a card. Generation is seeded by user + local date
 * + inputs, so the persisted build is the workout the card previewed.
 *
 * MOOD's Pick is the existing rule, unchanged: the user's last-used Direction (else the Training Profile / onboarding
 * default). That card carries the badge and sits first; the other two follow in the house Direction order.
 */
import type { V3Direction, V3GenerateRequest, V3HistoryItem, V3SoreRegion, V3State } from './v3Api';
import { DIRECTIONS, SORE_REGIONS, STATE_LABEL, STATES, buildRequest, initialInputs, requestSignature } from './v3HomeModel';

export interface RecSlot {
  direction: V3Direction;
  /** true on the MOOD's Pick card */
  pick: boolean;
  /** the live-preview request (persist: false) */
  request: V3GenerateRequest;
  /** request signature (persist excluded), shared with the persisted build of the same inputs */
  signature: string;
}

/** The Direction order on Home: MOOD's Pick first, then the rest in the house order (Strength, Sweat, Athletic). */
export function recDirections(pick: V3Direction): V3Direction[] {
  return [pick, ...DIRECTIONS.map((d) => d.id).filter((d) => d !== pick)];
}

/** One preview request per Direction, all with the same States / sore areas / length. */
export function recSlots(opts: {
  pick: V3Direction;
  states: V3State[];
  soreness: V3SoreRegion[];
  duration: 30 | 60;
  date: string;
  /** recovery steering (recoveryPlan): the Strength card's session type, so it rests the area trained last */
  strengthArchetype?: string | null;
  /** featured moods (no States answered): one mood per card, in card order, instead of `states` */
  slotStates?: V3State[] | null;
}): RecSlot[] {
  return recDirections(opts.pick).map((direction, i) => {
    const archetype = direction === 'strength' ? opts.strengthArchetype ?? null : null;
    const states = opts.slotStates?.[i] ? [opts.slotStates[i]] : opts.states;
    const req = buildRequest({ ...initialInputs(direction, { states, duration: opts.duration }), soreness: [...opts.soreness], archetype }, opts.date);
    const request = { ...req, persist: false };
    return { direction, pick: direction === opts.pick, request, signature: requestSignature(request) };
  });
}

/** The same request, stored (Start). */
export function persistRequest(req: V3GenerateRequest): V3GenerateRequest {
  return { ...req, persist: true };
}

/** "Amped + Bored" in on-screen State order, or '' for none. */
export function statesPlus(states: V3State[]): string {
  return STATES.filter((s) => states.includes(s.id)).map((s) => STATE_LABEL[s.id]).join(' + ');
}

/** Subcopy under "Workouts for your mood". */
export function recsSubtitle(states: V3State[]): string {
  const s = statesPlus(states);
  return s ? `Personalized for ${s}.` : 'Personalized picks based on how you feel today.';
}

/** The button under the State grid: "I'm steady today" with no States, "Build for my mood" once one is picked. */
export function stateCta(states: V3State[]): { label: string; primary: boolean; source: 'home_steady' | 'home_build_for_mood' } {
  return states.length
    ? { label: 'Build for my mood', primary: true, source: 'home_build_for_mood' }
    : { label: 'I’m steady today', primary: false, source: 'home_steady' };
}

/** Headline: "How are you feeling today, Wes?" (first name only; no name, no comma). */
export function homeHeadline(name: string | null | undefined): string {
  const first = (name ?? '').trim().split(/\s+/)[0];
  return first ? `How are you feeling today, ${first}?` : 'How are you feeling today?';
}

/** Streak pill text, or null when there is no real streak to show (workout days from /api/achievements/state). */
export function streakLabel(workoutStreak: number | null | undefined): string | null {
  const s = workoutStreak ?? 0;
  return s >= 1 ? `${s}-day streak` : null;
}

/** Card layout: three across the content width with fixed gaps, portrait proportions. */
export function recCardSize(screenW: number, gutter = 16, gap = 8): { width: number; height: number } {
  const width = Math.floor((screenW - gutter * 2 - gap * 2) / 3);
  return { width, height: Math.round(width * 1.8) };
}

/** State tile layout: 3 x 2 grid, landscape tiles. */
export function stateTileSize(screenW: number, gutter = 16, gap = 8): { width: number; height: number } {
  const width = Math.floor((screenW - gutter * 2 - gap * 2) / 3);
  return { width, height: Math.max(62, Math.round(width * 0.6)) };
}

/** Workout card height: fixed 9:16 portrait. */
export function cardHeight916(width: number): number {
  return Math.round((width * 16) / 9);
}

export interface HomeSpacing {
  /** extra space above the date row */
  top: number;
  /** between the header copy and the State grid */
  grid: number;
  /** between the State grid and the State CTA */
  cta: number;
  /** between the State CTA and "Workouts for your mood" */
  sec: number;
  /** between the section title and the cards */
  cards: number;
}

const SPACING_WEIGHTS: HomeSpacing = { top: 1, grid: 1, cta: 0.5, sec: 1.25, cards: 0.5 };
const SPACING_CAP = 36;

/**
 * Spread the first screen's spare height over the gaps above the cards, so the bottom of the 9:16 cards lands at the bottom
 * of the first screen (the wearables ribbon stays below the fold). No spare height (small phones) = no extra spacing, and
 * the page scrolls. Each gap grows by at most SPACING_CAP; anything beyond that stays as space under the cards.
 */
export function homeSpacing(extra: number | null): HomeSpacing {
  const zero: HomeSpacing = { top: 0, grid: 0, cta: 0, sec: 0, cards: 0 };
  if (extra == null || !Number.isFinite(extra) || extra <= 0) return zero;
  const keys = Object.keys(SPACING_WEIGHTS) as (keyof HomeSpacing)[];
  const total = keys.reduce((a, k) => a + SPACING_WEIGHTS[k], 0);
  const out = { ...zero };
  for (const k of keys) out[k] = Math.min(SPACING_CAP, Math.floor((extra * SPACING_WEIGHTS[k]) / total));
  return out;
}

/** Server times may arrive without an offset (naive UTC): read those as UTC, never as the phone's local time. */
export function parseServerTime(t: string | null | undefined): number {
  if (!t) return NaN;
  return Date.parse(/[zZ]|[+-]\d\d:?\d\d$/.test(t) || !/T\d/.test(t) ? t : `${t}Z`);
}

/* ------------------------------------------------------------------ recovery: "you trained legs last" */

/**
 * The area each session type loads, for the Home recovery line. Only sessions with a clear focus count; full-body
 * Strength, Core, every Sweat session and Full-Body Athlete train everything, so they never steer anything.
 */
export const TRAINED_AREA: Record<string, { area: 'lower' | 'upper'; label: string }> = {
  strength_lower_squat: { area: 'lower', label: 'legs' },
  strength_lower_hinge: { area: 'lower', label: 'legs' },
  strength_glutes_legs: { area: 'lower', label: 'legs' },
  athletic_power: { area: 'lower', label: 'legs' },
  athletic_speed_agility: { area: 'lower', label: 'legs' },
  strength_upper_push: { area: 'upper', label: 'chest and shoulders' },
  strength_upper_pull: { area: 'upper', label: 'back' },
  strength_upper_mixed: { area: 'upper', label: 'upper body' },
  strength_arms: { area: 'upper', label: 'arms' },
};

/** Strength session types that rest each area, in the engine's default rotation order. */
const RESTING: Record<'lower' | 'upper', string[]> = {
  lower: ['strength_upper_pull', 'strength_upper_push', 'strength_upper_mixed'],
  upper: ['strength_glutes_legs', 'strength_lower_squat', 'strength_lower_hinge'],
};

/** Steer only off a recent session: after this, the area has recovered and the engine's normal rotation applies. */
export const RECOVERY_WINDOW_H = 48;

export interface RecoveryPlan {
  /** "legs", "back", "chest and shoulders" ... */
  trained: string;
  /** the Strength session type that rests it */
  strengthArchetype: string;
}

/**
 * Last completed workout -> the Strength card's session type that gives that area a break, or null (no history, an
 * old or full-body session, a 1-2 days/week full-body program, or Sore picked today: soreness already steers the build).
 * Among the resting types it takes the one done least recently (never done first), like the engine's own rotation.
 */
export function recoveryPlan(
  history: Pick<V3HistoryItem, 'archetype' | 'completed_at'>[],
  opts: { now: number; frequency?: string | null; states?: V3State[] },
): RecoveryPlan | null {
  const last = history[0];
  if (!last) return null;
  if (opts.frequency === '1-2') return null;
  if (opts.states?.includes('sore')) return null;
  const at = parseServerTime(last.completed_at);
  if (!Number.isFinite(at) || opts.now - at > RECOVERY_WINDOW_H * 3600 * 1000 || at - opts.now > 3600 * 1000) return null;
  const hit = TRAINED_AREA[last.archetype?.id];
  if (!hit) return null;
  const lastIdx = new Map<string, number>();
  history.forEach((h, i) => {
    if (!lastIdx.has(h.archetype?.id)) lastIdx.set(h.archetype?.id, i);
  });
  const candidates = RESTING[hit.area];
  const pick = [...candidates].sort((a, b) => {
    const ia = lastIdx.has(a) ? lastIdx.get(a)! : Infinity;
    const ib = lastIdx.has(b) ? lastIdx.get(b)! : Infinity;
    // larger index = longer ago; never done (Infinity) first; ties keep rotation order
    return ib - ia || candidates.indexOf(a) - candidates.indexOf(b);
  })[0];
  return { trained: hit.label, strengthArchetype: pick };
}

/** "Wes, you trained legs last. MOOD’s Pick gives them a break." (no name: "You trained legs last. ...") */
export function recoveryLine(name: string | null | undefined, plan: RecoveryPlan): string {
  const first = (name ?? '').trim().split(/\s+/)[0];
  const them = plan.trained === 'back' || plan.trained === 'upper body' ? 'it' : 'them';
  return `${first ? `${first}, you` : 'You'} trained ${plan.trained} last. MOOD’s Pick gives ${them} a break.`;
}

/* ------------------------------------------------------------------ "MOOD's suggestions": the one-line subline */

/** Note what was last trained only when it was this recent (founder pass, Oct 2026). */
export const LAST_TRAINED_WINDOW_H = 24;
/** The subline is one line under "MOOD's suggestions" beside See all (about 270 pt on a 375 pt phone): this many characters. */
export const RECS_LINE_MAX = 40;

/** What a session type trained, said short: focused Strength by area, everything else by what it was. */
const TRAINED_SHORT: Record<string, string> = {
  strength_upper_push: 'chest & shoulders',
  strength_full_body: 'full-body session',
  strength_core: 'core session',
  sweat_engine: 'conditioning',
  sweat_circuit: 'conditioning',
  sweat_hybrid: 'conditioning',
  athletic_full_body: 'athletic session',
};

function trainedLabel(h: Pick<V3HistoryItem, 'archetype' | 'direction'>): string | null {
  const id = h.archetype?.id ?? '';
  const t = TRAINED_SHORT[id] ?? TRAINED_AREA[id]?.label ?? null;
  if (t) return t;
  if (h.direction === 'sweat') return 'conditioning';
  if (h.direction === 'athletic') return 'athletic session';
  const n = (h.archetype?.name ?? '').trim().toLowerCase();
  return n || null;
}

/** "today" / "yesterday" for the last completed workout, or null when it is older than the window (or has no date). */
function trainedWhen(completedAt: string, now: number): 'today' | 'yesterday' | null {
  const at = parseServerTime(completedAt);
  if (!Number.isFinite(at) || now - at > LAST_TRAINED_WINDOW_H * 3600 * 1000 || at - now > 3600 * 1000) return null;
  const day = (t: number) => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };
  return day(at) === day(now) ? 'today' : 'yesterday';
}

const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);

/**
 * The single line under "MOOD's suggestions" (founder pass, Oct 2026): what today's picks are built around, in one line.
 * It names the last session when it was in the last 24 h, the States picked today, and what MOOD's Pick does about them.
 *   recent + States:      "After legs yesterday, built for Amped" / "After legs yesterday · Amped + Bored"
 *   recent, rested area:  "Legs today, so MOOD’s Pick rests them" / "Legs yesterday, so your Pick rests them"
 *   recent, no area:      "Last session: conditioning, yesterday"
 *   States only:          "Personalized for Amped + Bored"
 *   steering, older:      "MOOD’s Pick rests your legs"
 *   nothing:              "Picked for how you feel today"
 * Every variant is kept to RECS_LINE_MAX characters; a longer one falls back to a shorter form.
 */
export function recsLine(
  states: V3State[],
  history: Pick<V3HistoryItem, 'archetype' | 'direction' | 'completed_at'>[],
  recovery: RecoveryPlan | null,
  now: number,
): string {
  const last = history[0];
  const when = last ? trainedWhen(last.completed_at, now) : null;
  const what = last && when ? trainedLabel(last) : null;
  const st = statesPlus(states);
  const fit = (...xs: (string | null)[]) => xs.find((x): x is string => !!x && x.length <= RECS_LINE_MAX) ?? null;
  const them = (t: string) => (t === 'back' || t === 'upper body' || t === 'core' ? 'it' : 'them');
  let line: string | null = null;
  if (what && st) line = fit(`After ${what} ${when}, built for ${st}`, `After ${what} ${when} · ${st}`, `${cap(what)} ${when} · ${st}`);
  else if (what && recovery) line = fit(`${cap(what)} ${when}, so MOOD’s Pick rests ${them(what)}`, `${cap(what)} ${when}, so your Pick rests ${them(what)}`, `MOOD’s Pick rests your ${what}`);
  else if (what) line = fit(`Last session: ${what}, ${when}`);
  if (!line && st) line = fit(`Personalized for ${st}`, `Built for ${st}`, 'Personalized for how you feel today');
  if (!line && recovery) line = fit(`MOOD’s Pick rests your ${recovery.trained}`);
  return line ?? 'Picked for how you feel today';
}

/* ------------------------------------------------------------------ featured mood + the two-line suggestions message */

/** Moods Home can feature on its own (Sore needs the body map, so it is never guessed). */
const FEATURABLE: V3State[] = ['amped', 'low_energy', 'stressed', 'bored', 'irritated'];

/**
 * No States answered yet today: each of the three suggestions is built for a different mood (founder pass, Oct 2026),
 * labelled on its cover, and the set rotates daily. Picking a State rebuilds all three for it; "I'm steady today"
 * (answered, none) features nothing. Returns one mood per card, in card order, or [].
 */
export function featuredMoods(date: string, answered: boolean): V3State[] {
  if (answered) return [];
  const [y, m, d] = date.split('-').map(Number);
  const dayNo = Math.floor(Date.UTC(y || 2026, (m || 1) - 1, d || 1) / 86400000);
  const n = FEATURABLE.length;
  const start = ((dayNo % n) + n) % n;
  return [0, 1, 2].map((k) => FEATURABLE[(start + k * 2) % n]);
}

/** The message under "MOOD's suggestions": two lines at most (about this many characters beside See all). */
export const RECS_MESSAGE_MAX = 76;

const FEEL: Record<V3State, string> = { low_energy: 'low on energy', amped: 'amped', stressed: 'stressed', bored: 'bored', irritated: 'irritated', sore: 'sore' };
const DAY: Record<V3State, string> = { low_energy: 'a low-energy day', amped: 'an amped day', stressed: 'a stressed day', bored: 'a bored day', irritated: 'an irritated day', sore: 'a sore day' };

/**
 * What the three cards are and why, said like a coach (two lines at most):
 *   States + recent:     "Nice work on yesterday's legs. Three picks for feeling amped and bored."
 *   recent, rested area: "Legs yesterday, so MOOD's Pick rests them. Three picks for a stressed day."
 *   featured moods:      "Not sure yet? One pick each for feeling amped, stressed and bored."
 *   steady:              "Steady is a great place to start. Here's a balanced pick for each style."
 * The longest wording that fits is used; every variant stays within RECS_MESSAGE_MAX.
 */
export function recsMessage(opts: {
  states: V3State[];
  featured: V3State[];
  history: Pick<V3HistoryItem, 'archetype' | 'direction' | 'completed_at'>[];
  recovery: RecoveryPlan | null;
  now: number;
}): string {
  const { states, featured, history, recovery, now } = opts;
  const last = history[0];
  const when = last ? trainedWhen(last.completed_at, now) : null;
  const what = last && when ? trainedLabel(last) : null;
  const whose = when === 'today' ? 'today’s' : 'yesterday’s';
  const them = (t: string) => (t === 'back' || t === 'upper body' || t === 'core session' || t === 'conditioning' || t === 'full-body session' || t === 'athletic session' ? 'it' : 'them');
  const feels = joinAnd(STATES.filter((x) => states.includes(x.id)).map((x) => FEEL[x.id]));

  const recent: string[] = !what
    ? []
    : recovery
      ? [`You trained ${what} ${when}, so MOOD’s Pick gives ${them(what)} a break.`, `${cap(what)} ${when}, so MOOD’s Pick rests ${them(what)}.`]
      : [`Nice work on ${whose} ${what}.`];
  const picks: string[] = states.length
    ? [`Here’s a Strength, Sweat and Athletic pick for feeling ${feels}.`, `Three picks for feeling ${feels}.`, 'Three picks built for your mood.']
    : featured.length
      ? [`Not sure yet? One pick each for feeling ${joinAnd(featured.map((x) => FEEL[x]))}.`, `One pick each for feeling ${joinAnd(featured.map((x) => FEEL[x]))}.`, 'Three moods, one pick each. Tap yours to tailor them.']
      : ['Steady is a great place to start. Here’s a balanced pick for each style.', 'A balanced Strength, Sweat and Athletic pick.', 'A balanced pick for each style.'];
  // the picks are always named; the last session is added when there is room for both
  const options = [...recent.flatMap((r) => picks.map((p) => `${r} ${p}`)), ...picks];
  return options.find((x) => x.length <= RECS_MESSAGE_MAX) ?? picks[picks.length - 1];
}

/* ------------------------------------------------------------------ "MOOD's suggestions" subline for today's States */

/** How each State reads in the line, and what the suggestions do about it (used when it is the only / leading State). */
const STATE_PHRASE: Record<Exclude<V3State, 'sore'>, { feel: string; then: string }> = {
  low_energy: { feel: 'low on energy', then: 'Here are some suggestions that still get the work in without draining you.' },
  amped: { feel: 'amped', then: 'Here are some suggestions to put that energy to work.' },
  stressed: { feel: 'stressed', then: 'Here are some suggestions to help you reset.' },
  bored: { feel: 'bored', then: 'Here are some suggestions to mix things up.' },
  irritated: { feel: 'irritated', then: 'Here are some suggestions to burn it off.' },
};

const PLURAL_AREAS = new Set(['shoulders', 'biceps', 'triceps', 'glutes', 'quads', 'hamstrings', 'calves', 'legs', 'arms']);

function joinAnd(xs: string[]): string {
  return xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
}

/** "back", "lower back and quads" (body-map order) + whether it takes "are". */
export function soreAreasPhrase(regions: V3SoreRegion[]): { text: string; plural: boolean } | null {
  if (!regions.length) return null;
  const labels = SORE_REGIONS.filter((r) => regions.includes(r.id)).map((r) => r.label.toLowerCase());
  if (!labels.length) return null;
  const plural = labels.length > 1 || PLURAL_AREAS.has(SORE_REGIONS.find((r) => r.label.toLowerCase() === labels[0])!.id);
  return { text: joinAnd(labels), plural };
}

/**
 * The subline for today's States, or null with none picked.
 *   Sore (back):            "Wes, your lower back is sore today. Here are some suggestions to put the load elsewhere."
 *   Sore + Amped:           "Wes, your quads are sore and you're amped today. Here are some suggestions to put the load elsewhere."
 *   Amped:                  "Wes, you're amped today. Here are some suggestions to put that energy to work."
 *   Amped + Bored:          "Wes, you're amped and bored today. Here are some suggestions built for both."
 * Sore leads whenever it is picked (it changes what MOOD builds most). No name: "Your back is sore ..." / "You're amped ...".
 */
export function statesLine(name: string | null | undefined, states: V3State[], soreness: V3SoreRegion[]): string | null {
  if (!states.length) return null;
  const first = (name ?? '').trim().split(/\s+/)[0];
  const feels = STATES.filter((s) => s.id !== 'sore' && states.includes(s.id)).map((s) => STATE_PHRASE[s.id as Exclude<V3State, 'sore'>]);
  const sore = states.includes('sore') ? soreAreasPhrase(soreness) : null;
  const parts: string[] = [];
  if (states.includes('sore')) parts.push(sore ? `your ${sore.text} ${sore.plural ? 'are' : 'is'} sore` : 'you’re sore');
  if (feels.length) parts.push(`you’re ${joinAnd(feels.map((f) => f.feel))}`);
  let lead = parts.join(' and ') + ' today.';
  lead = first ? `${first}, ${lead}` : lead.charAt(0).toUpperCase() + lead.slice(1);
  const then = states.includes('sore')
    ? 'Here are some suggestions to put the load elsewhere.'
    : feels.length === 1
      ? feels[0].then
      : feels.length === 2
        ? 'Here are some suggestions built for both.'
        : 'Here are some suggestions built for all of it.';
  return `${lead} ${then}`;
}

/* ------------------------------------------------------------------ Home week strip */

export interface WeekDay {
  letter: string;
  /** day of the month */
  day: number;
  /** local YYYY-MM-DD */
  date: string;
  isToday: boolean;
  isFuture: boolean;
  /** a workout was completed on this local day */
  trained: boolean;
}

function localKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * The current week, Monday to Sunday, with the days a workout was completed (local day of each completion instant).
 * Month label follows today ("OCT 2026").
 */
export function weekStrip(now: Date, completedAt: (string | null | undefined)[]): { monthLabel: string; days: WeekDay[] } {
  const trained = new Set<string>();
  for (const t of completedAt) {
    const ms = parseServerTime(t);
    if (Number.isFinite(ms)) trained.add(localKey(new Date(ms)));
  }
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const offset = (today.getDay() + 6) % 7; // Monday = 0
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
  const todayKey = localKey(today);
  const days: WeekDay[] = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((letter, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const key = localKey(d);
    return { letter, day: d.getDate(), date: key, isToday: key === todayKey, isFuture: d > today, trained: trained.has(key) };
  });
  const monthLabel = `${today.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} ${today.getFullYear()}`;
  return { monthLabel, days };
}

/**
 * Cards keep 9:16 when the first screen has room; when it does not (small phones, the week strip, a Continue strip), they
 * give up just enough height to keep their bottom on screen, never below 1.45x the width (then the page scrolls).
 */
export function fitCards(width: number, extraAt916: number | null): { height: number; extra: number | null } {
  const h = cardHeight916(width);
  if (extraAt916 == null || extraAt916 >= 0) return { height: h, extra: extraAt916 };
  const min = Math.round(width * 1.45);
  const height = Math.max(min, h + Math.floor(extraAt916));
  return { height, extra: extraAt916 + (h - height) };
}
