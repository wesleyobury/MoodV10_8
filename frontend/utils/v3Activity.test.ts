/**
 * Profile activity model + Explore presets.
 * Run: node --import tsx --test utils/v3Activity.test.ts   (or yarn test:v3-activity)
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { ActivityRow, achievements, doAgainPreset, formatMinutes, historyGroups, insights, longestDayStreak, monthGrid, profileStats, thisWeek, weekLine, weekStreak, workoutTitle } from './v3Activity';
import { buildPresetParams, liveDetail, liveHeadline, parseBuildPreset, trendCountLabel, trendingTitle, MOODS_PICKS } from './v3Explore';

const NOW = new Date(2026, 9, 2, 18, 0); // Fri Oct 2 2026, local
const at = (y: number, m: number, d: number, h = 12) => new Date(y, m, d, h).toISOString();
const v3 = (iso: string, o: Partial<ActivityRow> = {}): ActivityRow => ({
  at: iso, source: 'v3', minutes: 40, workout_id: `w-${iso}`, direction: 'strength', states: ['amped'],
  target: { mode: 'moods_pick', muscles: [], label: '' }, archetype: { id: 'strength_upper_push', name: 'Upper Push' }, selection_source: 'moods_pick', requested_minutes: 60, ...o,
});

test('stats: count everything, time only what was recorded', () => {
  const rows = [v3(at(2026, 9, 2)), v3(at(2026, 9, 1), { minutes: null }), { at: at(2026, 8, 20), source: 'v2', minutes: 30 }];
  const s = profileStats(rows, NOW);
  assert.equal(s.workouts, 3);
  assert.equal(s.minutes, 70);
});

test('week streak: a gap of a full week ends it', () => {
  const rows = [v3(at(2026, 8, 16)), v3(at(2026, 8, 8))]; // weeks of Sep 14 and Sep 7; nothing in the weeks of Sep 21 or Sep 28
  assert.equal(weekStreak(rows, NOW), 0);
  assert.equal(weekStreak([...rows, v3(at(2026, 8, 24))], NOW), 3);
});

test('week streak counts back from last week when this week is still empty', () => {
  const rows = [v3(at(2026, 8, 24)), v3(at(2026, 8, 16)), v3(at(2026, 8, 8))];
  const mon = new Date(2026, 8, 28, 9); // Monday Sep 28, nothing yet this week
  assert.equal(weekStreak(rows, mon), 3);
  assert.equal(weekStreak([...rows, v3(at(2026, 8, 29))], mon), 4);
});

test('longest day streak', () => {
  const rows = [1, 2, 3, 5].map((d) => v3(at(2026, 8, d)));
  assert.equal(longestDayStreak(rows), 3);
  assert.equal(longestDayStreak([v3(at(2026, 8, 1, 8)), v3(at(2026, 8, 1, 20))]), 1);
});

test('month grid: Monday first, whole weeks, trained days marked', () => {
  const g = monthGrid(2026, 9, [v3(at(2026, 9, 1)), v3(at(2026, 9, 2))], NOW);
  assert.equal(g.weeks[0][0].day, 28); // Mon Sep 28
  assert.equal(g.trainedCount, 2);
  const today = g.weeks.flat().find((c) => c.isToday)!;
  assert.equal(today.day, 2);
  assert.ok(today.trained);
  assert.ok(g.weeks.every((w) => w.length === 7));
});

test('this week: workouts, time and Direction split', () => {
  const rows = [v3(at(2026, 9, 2)), v3(at(2026, 8, 30), { direction: 'sweat', minutes: 31 }), v3(at(2026, 8, 25))];
  const w = thisWeek(rows, NOW);
  assert.equal(w.workouts, 2);
  assert.equal(w.minutes, 71);
  assert.deepEqual(w.byDirection.map((d) => `${d.name} ${d.count}`), ['Strength 1', 'Sweat 1']);
  assert.equal(weekLine(w), '2 workouts · 1h 11m');
  assert.equal(weekLine(thisWeek([], NOW)), 'No workouts yet this week');
});

test('achievements: earned and locked with progress', () => {
  const rows = [v3(at(2026, 9, 1)), v3(at(2026, 9, 2), { direction: 'sweat' }), v3(at(2026, 8, 1), { direction: 'athletic' })];
  const a = Object.fromEntries(achievements(rows).map((x) => [x.id, x]));
  assert.equal(a.all_around.earned, true);
  assert.equal(a.getting_started.earned, false);
  assert.equal(a.getting_started.progress, 3);
  assert.equal(a.on_a_roll.progress, 2);
});

test('insights only with enough real history', () => {
  assert.deepEqual(insights([v3(at(2026, 9, 1)), v3(at(2026, 9, 2))]), []);
  const rows = [v3(at(2026, 9, 1)), v3(at(2026, 9, 2)), v3(at(2026, 8, 30), { states: ['stressed'], minutes: 50 })];
  const i = Object.fromEntries(insights(rows).map((x) => [x.key, x.value]));
  assert.equal(i.direction, 'Strength');
  assert.equal(i.state, 'Amped');
  assert.equal(i.focus, 'Upper Push');
  assert.equal(i.avg, '43 min');
});

test('titles mirror the Cart: body area > target label > archetype', () => {
  assert.equal(workoutTitle(v3(NOW.toISOString(), { target: { mode: 'explicit', muscles: ['chest', 'back', 'shoulders'], label: 'Chest + Back + Shoulders' } })), 'Upper Body');
  assert.equal(workoutTitle(v3(NOW.toISOString(), { target: { mode: 'explicit', muscles: ['chest', 'triceps'], label: 'Chest + Triceps' } })), 'Chest + Triceps');
  assert.equal(workoutTitle(v3(NOW.toISOString())), 'Upper Push');
});

test('history: V3 only, grouped by local day', () => {
  const rows = [v3(at(2026, 9, 2, 9)), v3(at(2026, 9, 2, 7)), v3(at(2026, 9, 1)), { at: at(2026, 8, 29), source: 'v2', minutes: 20 }, v3(at(2026, 8, 29), { sets: 16 })];
  const g = historyGroups(rows, NOW);
  assert.deepEqual(g.map((x) => x.label), ['TODAY', 'YESTERDAY', 'SEP 29']);
  assert.equal(g[0].items.length, 2);
  assert.equal(g[2].items[0].facts, '40 min · 16 sets');
  assert.equal(historyGroups(rows, NOW, 1).length, 1);
});

test('Do Again keeps Direction, focus and length, never the States', () => {
  assert.deepEqual(doAgainPreset(v3(NOW.toISOString())), { direction: 'strength', duration: 60 });
  assert.deepEqual(doAgainPreset(v3(NOW.toISOString(), { selection_source: 'user_selected' })), { direction: 'strength', archetype: 'strength_upper_push', duration: 60 });
  assert.deepEqual(doAgainPreset(v3(NOW.toISOString(), { target: { mode: 'explicit', muscles: ['chest', 'triceps'] } })), { direction: 'strength', target: ['chest', 'triceps'], duration: 60 });
});

test('formatMinutes', () => {
  assert.equal(formatMinutes(45), '45m');
  assert.equal(formatMinutes(166), '2h 46m');
  assert.equal(formatMinutes(1870, { hoursOnly: true }), '31h');
});

test('presets round-trip and are sanitized', () => {
  for (const p of MOODS_PICKS) assert.deepEqual(parseBuildPreset(buildPresetParams(p.preset, 'pick').preset), p.preset);
  assert.equal(parseBuildPreset('nope'), null);
  assert.equal(parseBuildPreset(JSON.stringify({ direction: 'yoga' })), null);
  assert.deepEqual(parseBuildPreset(JSON.stringify({ direction: 'athletic', target: ['chest'], states: ['sore', 'amped'], duration: 45 })), { direction: 'athletic', states: ['amped'] });
  assert.deepEqual(parseBuildPreset(JSON.stringify({ direction: 'strength', target: ['chest', 'bogus'], archetype: 'x' })), { direction: 'strength', target: ['chest'] });
});

test('trending never claims popularity without measured data', () => {
  assert.equal(trendingTitle({ source: 'curated', window: null, items: [] }).title, 'Quick starts');
  assert.equal(trendingTitle({ source: 'measured', window: 'today', items: [] }).title, 'Trending today');
  assert.equal(trendCountLabel(null), null);
  assert.equal(trendCountLabel(124), '124 workouts');
});

test('live rows: production samples name the workout, never a person', () => {
  const base = { id: 'x', kind: 'sample' as const, sample: true, show_sample_tag: true, is_you: false, name: null, avatar: null, direction: 'strength' as const,
    direction_name: 'Strength', states: [], state_labels: ['Amped'], focus: 'Chest + Triceps', elapsed_min: 32, est_min: 50, progress: 0.6 };
  assert.equal(liveHeadline(base), 'Chest + Triceps');
  assert.equal(liveDetail(base), 'Strength');
  assert.equal(liveHeadline({ ...base, kind: 'real', sample: false, show_sample_tag: false, name: 'Marcus' }), 'Marcus is training');
  assert.equal(liveDetail({ ...base, name: 'Marcus' }), 'Strength · Chest + Triceps');
});

import { goalBio, goalLine } from './v3Activity';

test('goal line: the funnel goal, or a generic line', () => {
  assert.deepEqual(goalLine('build_strength'), { lead: 'MOOD is here to help you ', goal: 'build real strength.' });
  assert.equal(goalLine('feel_better_reduce_stress').goal, 'feel better and stress less.');
  for (const g of [null, undefined, 'nonsense']) assert.equal(goalLine(g as any).goal, 'train for how you feel, every day.');
});

test('goal bio: goal, typical State and barrier, how MOOD helps', () => {
  const rows = [v3(at(2026, 9, 1)), v3(at(2026, 9, 2)), v3(at(2026, 8, 30), { states: ['stressed'] })];
  const b = goalBio('build_strength', 'time', rows);
  assert.equal(b.goal, 'build real strength.');
  assert.equal(b.rest, 'On Amped days, MOOD turns that energy into hard, focused work. When time is tight, MOOD fits a complete session into the window you have.');
  assert.equal(goalBio(null, null, []).rest, 'Every workout is built around how you feel that day.');
  assert.equal(goalBio('stay_consistent', 'motivation', []).rest, 'MOOD takes the planning off your plate, so all you have to do is start. Every workout is built around how you feel that day.');
  const low = [1, 2].map((d) => v3(at(2026, 9, d), { states: ['low_energy'] }));
  assert.equal(goalBio('build_muscle', 'low_energy', low).rest, 'On Low Energy days, MOOD keeps the bar realistic so you still get the win. Every workout is built around how you feel that day.');
  for (const t of [b.rest, goalBio('x', 'boredom', rows).rest]) for (const bad of [/\bshould\b/i, /\bonly\b/i, /\bnever\b(?! feels like a rerun)/i, /—/]) assert.doesNotMatch(t, bad);
});
