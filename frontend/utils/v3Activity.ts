/**
 * MOOD V3 Profile: training identity, history and progress (Oct 2026 rework: the social profile is gone).
 *
 * One request, GET /api/v3/me/activity (backend/v3_explore.py): every completed workout (V2 and V3, from user_workouts),
 * newest first, with the V3 plan facts joined in. Everything on Profile is derived here, purely, in the user's local time:
 *
 *   header stats      workouts · training time · week streak · achievements earned
 *   calendar          a month grid of trained days
 *   this week         workouts · time · per Direction
 *   achievements      five simple milestones (earned / locked with progress); no XP, levels or currency
 *   Your MOOD         most trained Direction, most common State, favorite focus, average length; each only with enough data
 *   history           V3 workouts grouped by day (V2 rows have no plan to reopen, so they count in totals only)
 *
 * Nothing is estimated: a workout without a recorded duration adds to the count, never to the time.
 * Goal line: "MOOD is here to help you <goal from the funnel>." (goalLine).
 */
import type { V3Direction, V3State } from './v3Api';
import { DIRECTION_NAME, STATE_LABEL, bodyAreaOf } from './v3HomeModel';
import type { BuildPreset } from './v3Explore';

export interface ActivityRow {
  at: string;
  source: string;
  minutes: number | null;
  workout_id?: string;
  direction?: V3Direction | null;
  states?: V3State[];
  target?: { mode?: string; muscles?: string[]; label?: string } | null;
  archetype?: { id: string; name: string } | null;
  selection_source?: string | null;
  experience?: string | null;
  estimated_minutes?: number | null;
  requested_minutes?: number | null;
  created_at?: string | null;
  sets?: number;
  fit_rating?: string | null;
}

/* ------------------------------------------------------------------ dates */

export function localKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Monday of d's week (local). */
export function weekStart(d: Date): Date {
  const day = startOfDay(d);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() - ((day.getDay() + 6) % 7));
}

function rowDate(r: ActivityRow): Date | null {
  const ms = Date.parse(r.at);
  return Number.isFinite(ms) ? new Date(ms) : null;
}

/* ------------------------------------------------------------------ formatting */

/** "31h", "2h 46m", "45m", "0m" */
export function formatMinutes(total: number, opts: { hoursOnly?: boolean } = {}): string {
  const m = Math.max(0, Math.round(total));
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (opts.hoursOnly || rest === 0) return `${h}h`;
  return `${h}h ${rest}m`;
}

/** The title a V3 workout had on its Cart (mirrors previewTitle without needing the whole envelope). */
export function workoutTitle(r: ActivityRow): string {
  const t = r.target ?? null;
  if (t?.mode === 'explicit' && t.muscles?.length) {
    const area = bodyAreaOf(t.muscles);
    if (area) return area.label;
    if (t.label) return t.label;
  }
  if (t?.mode === 'full_body' && r.archetype?.id !== 'strength_full_body') return 'Full Body';
  return r.archetype?.name || (r.direction ? `${DIRECTION_NAME[r.direction]} workout` : 'Workout');
}

/* ------------------------------------------------------------------ stats */

export interface ProfileStats {
  workouts: number;
  minutes: number;
  weekStreak: number;
  longestDayStreak: number;
}

export function trainedDays(rows: ActivityRow[]): Set<string> {
  const s = new Set<string>();
  for (const r of rows) {
    const d = rowDate(r);
    if (d) s.add(localKey(d));
  }
  return s;
}

/** Consecutive weeks (Mon-Sun) with at least one workout. An empty current week does not break it until it ends. */
export function weekStreak(rows: ActivityRow[], now: Date): number {
  const weeks = new Set<string>();
  for (const r of rows) {
    const d = rowDate(r);
    if (d) weeks.add(localKey(weekStart(d)));
  }
  let cur = weekStart(now);
  if (!weeks.has(localKey(cur))) cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() - 7);
  let n = 0;
  while (weeks.has(localKey(cur))) {
    n += 1;
    cur = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() - 7);
  }
  return n;
}

/** Longest run of consecutive trained days. */
export function longestDayStreak(rows: ActivityRow[]): number {
  const keys = [...trainedDays(rows)].sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of keys) {
    const [y, m, d] = k.split('-').map(Number);
    const day = new Date(y, m - 1, d);
    run = prev && Math.round((day.getTime() - prev.getTime()) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return best;
}

export function profileStats(rows: ActivityRow[], now: Date): ProfileStats {
  return {
    workouts: rows.length,
    minutes: rows.reduce((n, r) => n + (r.minutes ?? 0), 0),
    weekStreak: weekStreak(rows, now),
    longestDayStreak: longestDayStreak(rows),
  };
}

/* ------------------------------------------------------------------ calendar + this week */

export interface CalendarCell {
  key: string;
  day: number;
  inMonth: boolean;
  trained: boolean;
  isToday: boolean;
  isFuture: boolean;
}

/** A Monday-first month grid (whole weeks). month is 0-based. */
export function monthGrid(year: number, month: number, rows: ActivityRow[], now: Date): { label: string; weeks: CalendarCell[][]; trainedCount: number } {
  const days = trainedDays(rows);
  const first = new Date(year, month, 1);
  const start = weekStart(first);
  const todayKey = localKey(now);
  const today = startOfDay(now);
  const weeks: CalendarCell[][] = [];
  let trainedCount = 0;
  for (let w = 0; w < 6; w++) {
    const week: CalendarCell[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + i);
      const key = localKey(d);
      const inMonth = d.getMonth() === month;
      const trained = days.has(key);
      if (inMonth && trained) trainedCount += 1;
      week.push({ key, day: d.getDate(), inMonth, trained, isToday: key === todayKey, isFuture: d > today });
    }
    if (w >= 4 && !week.some((c) => c.inMonth)) break;
    weeks.push(week);
  }
  const label = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  return { label, weeks, trainedCount };
}

export interface WeekSummary {
  workouts: number;
  minutes: number;
  byDirection: { direction: V3Direction; name: string; count: number }[];
}

export function thisWeek(rows: ActivityRow[], now: Date): WeekSummary {
  const start = weekStart(now).getTime();
  const end = start + 7 * 86400000;
  const inWeek = rows.filter((r) => {
    const d = rowDate(r);
    return d && d.getTime() >= start && d.getTime() < end;
  });
  const counts: Record<V3Direction, number> = { strength: 0, sweat: 0, athletic: 0 };
  for (const r of inWeek) if (r.direction && r.direction in counts) counts[r.direction] += 1;
  return {
    workouts: inWeek.length,
    minutes: inWeek.reduce((n, r) => n + (r.minutes ?? 0), 0),
    byDirection: (['strength', 'sweat', 'athletic'] as V3Direction[]).filter((d) => counts[d] > 0).map((d) => ({ direction: d, name: DIRECTION_NAME[d], count: counts[d] })),
  };
}

/** "4 workouts · 2h 46m" */
export function weekLine(w: WeekSummary): string {
  if (!w.workouts) return 'No workouts yet this week';
  return [`${w.workouts} workout${w.workouts === 1 ? '' : 's'}`, w.minutes ? formatMinutes(w.minutes) : null].filter(Boolean).join(' · ');
}

/* ------------------------------------------------------------------ achievements */

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  goal: number;
  progress: number;
  earned: boolean;
}

export function achievements(rows: ActivityRow[]): Achievement[] {
  const by = (d: V3Direction) => rows.filter((r) => r.direction === d).length;
  const dirs = (['strength', 'sweat', 'athletic'] as V3Direction[]).filter((d) => by(d) > 0).length;
  const list: Omit<Achievement, 'earned'>[] = [
    { id: 'getting_started', title: 'Getting Started', description: 'Complete 5 workouts', icon: 'flag', goal: 5, progress: rows.length },
    { id: 'on_a_roll', title: 'On a Roll', description: 'Train 7 days in a row', icon: 'flame', goal: 7, progress: longestDayStreak(rows) },
    { id: 'sweat_equity', title: 'Sweat Equity', description: 'Complete 10 Sweat workouts', icon: 'water', goal: 10, progress: by('sweat') },
    { id: 'getting_stronger', title: 'Getting Stronger', description: 'Complete 25 Strength workouts', icon: 'barbell', goal: 25, progress: by('strength') },
    { id: 'all_around', title: 'All Around Athlete', description: 'Train all three Directions', icon: 'trophy', goal: 3, progress: dirs },
  ];
  return list.map((a) => ({ ...a, progress: Math.min(a.goal, a.progress), earned: a.progress >= a.goal }));
}

/* ------------------------------------------------------------------ Your MOOD */

export interface Insight {
  key: string;
  label: string;
  value: string;
}

const MIN_V3_FOR_INSIGHTS = 3;

function mode<T extends string>(values: T[], min: number): T | null {
  const c = new Map<T, number>();
  for (const v of values) c.set(v, (c.get(v) ?? 0) + 1);
  let best: T | null = null;
  let n = 0;
  for (const [k, v] of c) {
    if (v > n) {
      best = k;
      n = v;
    }
  }
  return n >= min ? best : null;
}

/** Only insights the user's own history supports; [] (section hidden) until there are a few V3 workouts. */
export function insights(rows: ActivityRow[]): Insight[] {
  const v3 = rows.filter((r) => r.workout_id && r.direction);
  if (v3.length < MIN_V3_FOR_INSIGHTS) return [];
  const out: Insight[] = [];
  const dir = mode(v3.map((r) => r.direction as V3Direction), 2);
  if (dir) out.push({ key: 'direction', label: 'Most trained', value: DIRECTION_NAME[dir] });
  const state = mode(v3.flatMap((r) => r.states ?? []), 2);
  if (state) out.push({ key: 'state', label: 'Most common State', value: STATE_LABEL[state] ?? state });
  const focus = mode(v3.map(workoutTitle), 2);
  if (focus) out.push({ key: 'focus', label: 'Favorite focus', value: focus });
  const timed = rows.filter((r) => r.minutes != null);
  if (timed.length >= MIN_V3_FOR_INSIGHTS) {
    const avg = timed.reduce((n, r) => n + (r.minutes ?? 0), 0) / timed.length;
    out.push({ key: 'avg', label: 'Average workout', value: `${Math.round(avg)} min` });
  }
  return out.length >= 2 ? out : [];
}

/* ------------------------------------------------------------------ history */

export interface HistoryItem {
  row: ActivityRow;
  workoutId: string;
  title: string;
  meta: string;
  facts: string;
}

export interface HistoryGroup {
  key: string;
  label: string;
  items: HistoryItem[];
}

export function dayLabel(d: Date, now: Date): string {
  const diff = Math.round((startOfDay(now).getTime() - startOfDay(d).getTime()) / 86400000);
  if (diff === 0) return 'TODAY';
  if (diff === 1) return 'YESTERDAY';
  const opts: Intl.DateTimeFormatOptions = d.getFullYear() === now.getFullYear() ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric', year: 'numeric' };
  return d.toLocaleDateString('en-US', opts).toUpperCase();
}

/** V3 workouts, newest first, grouped by local day. */
export function historyGroups(rows: ActivityRow[], now: Date, limit = Infinity): HistoryGroup[] {
  const groups: HistoryGroup[] = [];
  let n = 0;
  for (const r of rows) {
    if (!r.workout_id || !r.direction) continue;
    const d = rowDate(r);
    if (!d) continue;
    if (n >= limit) break;
    n += 1;
    const key = localKey(d);
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      g = { key, label: dayLabel(d, now), items: [] };
      groups.push(g);
    }
    const states = (r.states ?? []).map((s) => STATE_LABEL[s] ?? s);
    g.items.push({
      row: r,
      workoutId: r.workout_id,
      title: workoutTitle(r),
      meta: [DIRECTION_NAME[r.direction], ...states.slice(0, 2)].join(' · '),
      facts: [r.minutes != null ? `${r.minutes} min` : null, r.sets ? `${r.sets} sets` : null].filter(Boolean).join(' · '),
    });
  }
  return groups;
}

export function historyCount(rows: ActivityRow[]): number {
  return rows.filter((r) => r.workout_id && r.direction).length;
}

/** Do Again: the workout's high-level inputs (Direction, focus, length). Today's States are the user's to choose again. */
export function doAgainPreset(r: ActivityRow): BuildPreset | null {
  if (!r.direction) return null;
  const p: BuildPreset = { direction: r.direction };
  const t = r.target;
  if (r.direction !== 'athletic' && t?.mode === 'explicit' && t.muscles?.length) p.target = t.muscles.slice(0, 3);
  else if (r.direction !== 'athletic' && t?.mode === 'full_body') p.target = 'full_body';
  else if (r.archetype?.id && r.selection_source !== 'moods_pick' && r.archetype.id !== 'strength_custom_target') p.archetype = r.archetype.id;
  if (r.requested_minutes === 30 || r.requested_minutes === 60) p.duration = r.requested_minutes;
  return p;
}

/* ------------------------------------------------------------------ goal line */

/** The funnel's goal (training_profile.goal, same ids as utils/v3HomeModel V3Goal) as the end of "MOOD is here to help you ...". */
const GOAL_PHRASE: Record<string, string> = {
  build_strength: 'build real strength',
  lose_weight_conditioning: 'sweat, burn fat and build your engine',
  build_muscle: 'build the physique you want',
  improve_athleticism: 'become a better athlete',
  feel_better_reduce_stress: 'feel better and stress less',
  stay_consistent: 'show up and stay consistent',
};

/** Profile line under the name: what MOOD is here for, in the user's own goal. Generic when no goal is on file. */
export function goalLine(goal: string | null | undefined): { lead: string; goal: string } {
  const phrase = goal ? GOAL_PHRASE[goal] : null;
  return phrase ? { lead: 'MOOD is here to help you ', goal: `${phrase}.` } : { lead: 'MOOD is here to help you ', goal: 'train for how you feel, every day.' };
}

/** How MOOD helps on the user's typical State (their most common State in their own history). */
const STATE_HELP: Record<string, string> = {
  amped: 'On Amped days, MOOD turns that energy into hard, focused work.',
  stressed: 'On Stressed days, MOOD builds sessions that help you burn it off and reset.',
  low_energy: 'On Low Energy days, MOOD keeps the bar realistic so you still get the win.',
  bored: 'When you’re Bored, MOOD mixes things up so training stays fresh.',
  irritated: 'On Irritated days, MOOD gives that edge somewhere useful to go.',
  sore: 'When you’re Sore, MOOD trains around it so you recover and keep moving.',
};

/** How MOOD helps with the barrier they named in the funnel (training_profile.biggest_barrier). */
const BARRIER_HELP: Record<string, string> = {
  time: 'When time is tight, MOOD fits a complete session into the window you have.',
  low_energy: 'When energy is low, MOOD meets you where you are.',
  motivation: 'MOOD takes the planning off your plate, so all you have to do is start.',
  dont_know: 'No guesswork: MOOD tells you exactly what to do, set by set.',
  boredom: 'MOOD keeps every session fresh, so training never feels like a rerun.',
};

const GENERAL_HELP = 'Every workout is built around how you feel that day.';

/**
 * Profile paragraph under the name: their goal (funnel), then HOW MOOD helps, high level: on their typical State (from their
 * own history, once it shows up at least twice) and with the barrier they named. Supportive only: it describes what MOOD
 * does, never what the user should change. At most three sentences.
 */
export function goalBio(goal: string | null | undefined, barrier: string | null | undefined, rows: ActivityRow[]): { lead: string; goal: string; rest: string } {
  const head = goalLine(goal);
  const extra: string[] = [];
  const state = mode(rows.filter((r) => r.workout_id).flatMap((r) => r.states ?? []), 2);
  if (state && STATE_HELP[state]) extra.push(STATE_HELP[state]);
  // a Low Energy barrier says the same thing as a Low Energy State: keep one
  if (barrier && BARRIER_HELP[barrier] && !(barrier === 'low_energy' && state === 'low_energy')) extra.push(BARRIER_HELP[barrier]);
  if (extra.length < 2) extra.push(GENERAL_HELP);
  return { ...head, rest: extra.join(' ') };
}
