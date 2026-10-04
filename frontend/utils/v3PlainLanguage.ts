/**
 * Plain English first, technical terminology second (founder edit pass).
 *
 * The generator's explanation text (Built for Today, block facts, effort) is written by the frozen engines. This layer
 * only changes how it READS in the app: it never changes a prescription or a decision. Coaching jargon is rewritten into
 * everyday language; where a term is worth keeping (top set, EMOM, drop set ...) it stays in parentheses after the plain
 * explanation and becomes tappable through TRAINING_TERMS (components/v3/TermSheet).
 */

export type TermId = 'rpe' | 'rir' | 'top_set' | 'back_off' | 'drop_set' | 'rest_pause' | 'emom' | 'contrast' | 'superset' | 'eccentric';

export const TRAINING_TERMS: Record<TermId, { term: string; definition: string }> = {
  rpe: { term: 'RPE', definition: 'Rate of Perceived Exertion: how hard a set feels on a 1 to 10 scale. 5 is moderate, 7 to 8 is hard, 10 is everything you have.' },
  rir: { term: 'Reps in reserve', definition: 'How many more good reps you could have done when you stop the set. "2 in reserve" means stop with about 2 reps left in the tank.' },
  top_set: { term: 'Top set', definition: 'Your heaviest set of the day for that lift. It comes first, while you are fresh.' },
  back_off: { term: 'Back-off sets', definition: 'Lighter sets after the top set. Same movement, a little less weight, a few more reps.' },
  drop_set: { term: 'Drop set', definition: 'On the last set, when you finish your reps, lower the weight and keep going for a few more.' },
  rest_pause: { term: 'Rest-pause', definition: 'On the last set, finish your reps, rest 10 to 15 seconds, then squeeze out a few more.' },
  emom: { term: 'EMOM', definition: 'Every Minute On the Minute: start a new station at the top of each minute and rest for whatever is left of it.' },
  contrast: { term: 'Contrast pair', definition: 'A heavy set followed right away by a fast, explosive movement that uses the same muscles.' },
  superset: { term: 'Superset', definition: 'Two exercises done back to back, then rest. The letters A1 and A2 show the order.' },
  eccentric: { term: 'Slow lowering (eccentric)', definition: 'The lowering part of a rep. Taking 3 seconds to lower builds control and strength.' },
};

const TERM_PATTERNS: [TermId, RegExp][] = [
  ['rpe', /\bRPE\b/i],
  ['rir', /\bin reserve\b|\bRIR\b/i],
  ['top_set', /\btop set\b|top backoff/i],
  ['back_off', /\bback-?off\b/i],
  ['drop_set', /\bdrop set\b/i],
  ['rest_pause', /\brest-pause\b/i],
  ['emom', /\bEMOM\b/],
  ['contrast', /\bcontrast\b/i],
  ['superset', /\bsuperset\b/i],
  ['eccentric', /\beccentric\b/i],
];

/** The training terms a piece of (original, unrewritten) generator text uses. */
export function termsIn(...texts: (string | null | undefined)[]): TermId[] {
  const t = texts.filter(Boolean).join(' ');
  return TERM_PATTERNS.filter(([, re]) => re.test(t)).map(([id]) => id);
}

/* ------------------------------------------------------------------ effort */

function effortWord(n: number): string {
  if (n <= 4) return 'easy';
  if (n <= 6) return 'moderate';
  if (n <= 8) return 'hard';
  return 'very hard';
}

/** "RPE 7–8" -> "hard", "RPE 4–6" -> "easy to moderate". */
export function effortFromRpe(lo: number, hi: number = lo): string {
  const a = effortWord(lo);
  const b = effortWord(hi);
  return a === b ? a : `${a} to ${b}`;
}

function article(word: string): string {
  return /^[aeiou]/i.test(word) ? 'an' : 'a';
}

/** Block facts: "RPE 7–8" -> "Hard effort". */
export function plainEffortLabel(label: string): string {
  const m = label.match(/^RPE (\d+)(?:–(\d+))?$/);
  if (!m) return label;
  const e = effortFromRpe(Number(m[1]), m[2] ? Number(m[2]) : undefined);
  return `${e.charAt(0).toUpperCase()}${e.slice(1)} effort`;
}

/** Detail-sheet effort row from the prescription's RIR / RPE. */
export function plainEffortFromPrescription(rir: number | null | undefined, rpe: unknown): { text: string; term: TermId } | null {
  if (typeof rir === 'number') {
    if (rir <= 0) return { text: 'Take the last set to failure', term: 'rir' };
    return { text: `Stop with about ${rir} ${rir === 1 ? 'rep' : 'reps'} left in the tank`, term: 'rir' };
  }
  if (Array.isArray(rpe) && rpe.length === 2) return { text: `${capital(effortFromRpe(rpe[0], rpe[1]))} effort (RPE ${rpe[0] === rpe[1] ? rpe[0] : `${rpe[0]}–${rpe[1]}`})`, term: 'rpe' };
  if (typeof rpe === 'number') return { text: `${capital(effortFromRpe(rpe))} effort (RPE ${rpe})`, term: 'rpe' };
  return null;
}

function capital(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ------------------------------------------------------------------ explanations */

type Rule = [RegExp, string | ((...m: string[]) => string)];

const NAME = "([A-Z][A-Za-z0-9'’()/ -]*?)";

const RULES: Rule[] = [
  // Engine copy defect seen in the frozen Strength low-energy line ("leaving left out and slowing ..."): drop the orphan.
  [/\bleaving left out and /g, ''],

  // Effort (RPE)
  [/the density is higher and the main block runs to RPE (\d+)(?:–(\d+))?/g, (_m, a, b) => `there's less rest between efforts and the main block gets ${effortFromRpe(+a, b ? +b : undefined)}`],
  [/\bthe density is higher\b/g, "there's less rest between efforts"],
  [/Target effort for the main block is RPE (\d+)(?:–(\d+))?\./g, (_m, a, b) => `The main block should feel ${effortFromRpe(+a, b ? +b : undefined)}.`],
  [/\bruns to RPE (\d+)(?:–(\d+))?/g, (_m, a, b) => `gets ${effortFromRpe(+a, b ? +b : undefined)}`],
  [/\bat RPE (\d+)(?:–(\d+))?/g, (_m, a, b) => {
    const e = effortFromRpe(+a, b ? +b : undefined);
    return `at ${article(e)} ${e} effort`;
  }],
  [/\(RPE <= (\d+)\)/g, (_m, a) => `(don't go past ${effortFromRpe(+a)})`],
  [/\bRPE (\d+)(?:[–-](\d+))?/g, (_m, a, b) => `${effortFromRpe(+a, b ? +b : undefined)} effort`],

  // Reps in reserve
  [/\btwo reps in reserve\b/g, 'about two reps left in the tank'],
  [/\bleaves something in reserve\b/g, 'leaves something in the tank'],
  [/\breps in reserve\b/g, 'reps left in the tank'],

  // Volume / density words
  [/\b(\d+) working sets across\b/g, '$1 hard sets across'],
  [/\bpiling on volume\b/g, 'piling on extra work'],
  [/\btrimming accessory volume\b/g, 'trimming the smaller extra exercises'],
  [/\bthe shape of the session to Volume\b/g, 'the shape of the session to higher-rep work'],

  // Set schemes: plain first, the term in parentheses
  [/\ba heavy top set and back-off sets\b/g, 'one heavy set, then a few lighter ones (a top set and back-off sets)'],
  [/\bthe shape of the session to Top Set \+ Back-off\b/g, 'the shape of the session to one heavy set followed by lighter ones (a top set and back-off sets)'],
  [/\b1\.5 reps on (?:the )?([A-Z][A-Za-z0-9' -]*?)(?= is on the table| in the mix|,| and\b|\.|$)/g, '1.5 reps on $1 (a full rep plus a half rep)'],
  [/\ba top backoff shape\b/g, 'one heavy set followed by lighter ones (a top set and back-off sets)'],
  [new RegExp(`\\b(using |with )?drop set on the final set on (?:the )?${NAME}(?= is on the table| in the mix| and\\b|,|\\.|$)`, 'g'), (_m, p, n) => `${p ?? ''}a drop set on the last set of ${n.trim()} (lower the weight and keep going)`],
  [new RegExp(`\\b(using |with )?rest-pause on the final set on (?:the )?${NAME}(?= is on the table| in the mix| and\\b|,|\\.|$)`, 'g'), (_m, p, n) => `${p ?? ''}a rest-pause last set on ${n.trim()} (a short breather, then a few more reps)`],
  [/\bthe top-set scheme\b/g, 'the heavy-set-then-lighter-sets approach'],
  [new RegExp(`\\bslowing the eccentric on ${NAME}(?= instead| and\\b|,|\\.|$)`, 'g'), (_m, n) => `lowering ${n.trim()} slowly`],
  [new RegExp(`\\b(\\d+) s eccentric on ${NAME}(?= is on the table| in the mix| and\\b|,|\\.|$)`, 'g'), (_m, s, n) => `a slow ${s}-second lowering on ${n.trim()}`],
  [/\bheavy-light contrast pair \(/g, 'heavy set paired with an explosive one, a contrast pair ('],
  [/\bheavy-light contrast pair\b/g, 'heavy set paired with an explosive one (a contrast pair)'],

  // Load guidance phrasing
  [/\bTop set heavy, then back off (\S+) for the remaining sets\./g, 'Make your first set the heavy one, then drop the weight $1 for the rest (a top set and back-off sets).'],
  [/\b(\d+) s eccentric\b/g, '$1 s lowering'],

  // Intent
  [/\bdriven with intent\b/g, 'driven hard'],
  [/\bwith intent\b/g, 'hard and fast'],
  [/\bmaximal intent\b/g, 'all-out'],
  [/\bmax intent\b/g, 'all-out effort'],
  [/\bwith full intent\b/g, 'with full effort'],

  // EMOM
  [/\ba EMOM structure\b/g, 'an every-minute (EMOM) structure'],
  [/\bEMOM for (\d+) min\b/g, 'Every minute on the minute (EMOM) for $1 min'],

  // Athletic
  [/\ba small landing budget\b/g, 'a cap on jump landings'],
  [/\breactive jumps\b/g, 'quick, bouncy jumps'],
  [/\belastic, reactive ability\b/g, 'springiness (quick, bouncy power)'],
];

/** Rewrite one generator sentence into plain language. Idempotent on already-plain text. */
export function plain(text: string | null | undefined): string {
  let t = (text ?? '').trim();
  if (!t) return t;
  for (const [re, rep] of RULES) t = t.replace(re, rep as any);
  t = t.replace(/\s{2,}/g, ' ').replace(/ ,/g, ',');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Jargon that must not survive outside parentheses in plain text (used by tests). */
export const JARGON_OUTSIDE_PARENS = /\btop-set\b|\bRPE\b|\bRIR\b|\bin reserve\b|\bdensity\b|\btop set\b|\bback-?off\b|\beccentric\b|\bintent\b|\bworking sets\b|\blanding budget\b/i;

export function stripParens(t: string): string {
  return t.replace(/\([^)]*\)/g, '');
}
