/**
 * Home recommendations model (founder Home redesign).
 * Run: node --import tsx --test utils/v3HomeRecs.test.ts   (or yarn test:v3-home-recs)
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { RECOVERY_WINDOW_H, cardHeight916, statesLine, homeHeadline, homeSpacing, recoveryLine, recoveryPlan, persistRequest, recCardSize, recDirections, recSlots, recsSubtitle, stateCta, stateTileSize, statesPlus, streakLabel } from './v3HomeRecs';
import { requestSignature } from './v3HomeModel';

const D = '2026-10-01';

test('MOOD’s Pick Direction first, then house order, one per Direction', () => {
  assert.deepEqual(recDirections('strength'), ['strength', 'sweat', 'athletic']);
  assert.deepEqual(recDirections('sweat'), ['sweat', 'strength', 'athletic']);
  assert.deepEqual(recDirections('athletic'), ['athletic', 'strength', 'sweat']);
});

test('slots: previews with the same States, soreness and length; only the pick is flagged', () => {
  const slots = recSlots({ pick: 'sweat', states: ['amped', 'sore'], soreness: ['quads'], duration: 30, date: D });
  assert.equal(slots.length, 3);
  assert.deepEqual(slots.map((s) => s.pick), [true, false, false]);
  for (const s of slots) {
    assert.equal(s.request.persist, false);
    assert.deepEqual(s.request.states, ['amped', 'sore']);
    assert.deepEqual(s.request.soreness, ['quads']);
    assert.equal(s.request.duration, 30);
    assert.equal(s.request.date, D);
    assert.equal(s.request.target, undefined);
    assert.equal(s.request.archetype, undefined);
  }
  assert.equal(new Set(slots.map((s) => s.signature)).size, 3);
});

test('soreness is dropped without Sore (server contract)', () => {
  const [s] = recSlots({ pick: 'strength', states: ['amped'], soreness: ['quads'], duration: 60, date: D });
  assert.deepEqual(s.request.soreness, []);
});

test('preview and persisted build share a signature (Start reuses an existing build)', () => {
  const [s] = recSlots({ pick: 'strength', states: ['bored'], soreness: [], duration: 60, date: D });
  const p = persistRequest(s.request);
  assert.equal(p.persist, true);
  assert.equal(requestSignature(p), s.signature);
});

test('State order is stable regardless of tap order', () => {
  const a = recSlots({ pick: 'strength', states: ['bored', 'amped'], soreness: [], duration: 60, date: D });
  const b = recSlots({ pick: 'strength', states: ['amped', 'bored'], soreness: [], duration: 60, date: D });
  assert.equal(a[0].signature, b[0].signature);
  assert.equal(statesPlus(['bored', 'amped']), 'Amped + Bored');
});

test('copy', () => {
  assert.equal(recsSubtitle([]), 'Personalized picks based on how you feel today.');
  assert.equal(recsSubtitle(['amped']), 'Personalized for Amped.');
  assert.equal(recsSubtitle(['bored', 'amped']), 'Personalized for Amped + Bored.');
  assert.equal(stateCta([]).label, 'I’m steady today');
  assert.equal(stateCta([]).primary, false);
  assert.equal(stateCta(['stressed']).label, 'Build for my mood');
  assert.equal(stateCta(['stressed']).primary, true);
  assert.equal(homeHeadline('Wes Ogsbury'), 'How are you feeling today, Wes?');
  assert.equal(homeHeadline(''), 'How are you feeling today?');
  assert.equal(homeHeadline(null), 'How are you feeling today?');
  assert.equal(streakLabel(2), '2-day streak');
  assert.equal(streakLabel(0), null);
  assert.equal(streakLabel(null), null);
});

test('three cards fit across common iPhone widths', () => {
  for (const w of [320, 375, 390, 393, 402, 430, 440]) {
    const c = recCardSize(w);
    assert.ok(c.width * 3 + 8 * 2 + 16 * 2 <= w, `fits at ${w}`);
    assert.ok(c.height > c.width, 'portrait');
    const t = stateTileSize(w);
    assert.ok(t.width * 3 + 8 * 2 + 16 * 2 <= w);
  }
});

test('cards are 9:16', () => {
  assert.equal(cardHeight916(114), 203);
  assert.equal(cardHeight916(126), 224);
});

test('spare height spreads over the gaps above the cards, never more than it has', () => {
  const z = homeSpacing(null);
  assert.deepEqual(z, { top: 0, grid: 0, cta: 0, sec: 0, cards: 0 });
  assert.deepEqual(homeSpacing(-40), z);
  const s = homeSpacing(85);
  const sum = s.top + s.grid + s.cta + s.sec + s.cards;
  assert.ok(sum <= 85 && sum >= 80, `sum ${sum}`);
  assert.ok(s.sec >= s.top && s.top >= s.cta);
  const big = homeSpacing(1000);
  for (const v of Object.values(big)) assert.ok(v <= 36);
});

const NOW = Date.parse('2026-10-01T18:00:00Z');
const h = (id: string, hoursAgo: number) => ({ archetype: { id, name: id }, completed_at: new Date(NOW - hoursAgo * 3600e3).toISOString() });

test('recovery: legs last -> an upper Strength session, least recently done first', () => {
  const p = recoveryPlan([h('strength_glutes_legs', 20)], { now: NOW });
  assert.deepEqual(p, { trained: 'legs', strengthArchetype: 'strength_upper_pull' });
  const p2 = recoveryPlan([h('strength_lower_squat', 20), h('strength_upper_pull', 50), h('strength_upper_mixed', 90)], { now: NOW });
  assert.equal(p2!.strengthArchetype, 'strength_upper_push'); // never done
  const p3 = recoveryPlan([h('athletic_power', 5), h('strength_upper_pull', 30), h('strength_upper_push', 60), h('strength_upper_mixed', 200)], { now: NOW });
  assert.equal(p3!.strengthArchetype, 'strength_upper_mixed'); // longest ago
});

test('recovery: upper last -> a lower Strength session', () => {
  assert.deepEqual(recoveryPlan([h('strength_upper_push', 10)], { now: NOW }), { trained: 'chest and shoulders', strengthArchetype: 'strength_glutes_legs' });
});

test('recovery: nothing to steer', () => {
  assert.equal(recoveryPlan([], { now: NOW }), null);
  assert.equal(recoveryPlan([h('strength_full_body', 10)], { now: NOW }), null);
  assert.equal(recoveryPlan([h('sweat_engine', 10)], { now: NOW }), null);
  assert.equal(recoveryPlan([h('strength_glutes_legs', RECOVERY_WINDOW_H + 1)], { now: NOW }), null);
  assert.equal(recoveryPlan([h('strength_glutes_legs', 10)], { now: NOW, frequency: '1-2' }), null);
  assert.equal(recoveryPlan([h('strength_glutes_legs', 10)], { now: NOW, states: ['sore'] }), null);
});

test('recovery: steered Strength slot carries the archetype; other Directions do not', () => {
  const slots = recSlots({ pick: 'strength', states: [], soreness: [], duration: 60, date: D, strengthArchetype: 'strength_upper_pull' });
  assert.equal(slots[0].request.archetype, 'strength_upper_pull');
  assert.equal(slots[1].request.archetype, undefined);
  assert.equal(slots[2].request.archetype, undefined);
});

test('recovery line', () => {
  assert.equal(recoveryLine('Wes Ogsbury', { trained: 'legs', strengthArchetype: 'x' }), 'Wes, you trained legs last. MOOD’s Pick gives them a break.');
  assert.equal(recoveryLine(null, { trained: 'back', strengthArchetype: 'x' }), 'You trained back last. MOOD’s Pick gives it a break.');
});

test('states line: sore leads, areas read naturally', () => {
  assert.equal(statesLine('Wes O', ['sore'], ['lower_back']), 'Wes, your lower back is sore today. Here are some suggestions to put the load elsewhere.');
  assert.equal(statesLine('Wes', ['sore'], ['quads']), 'Wes, your quads are sore today. Here are some suggestions to put the load elsewhere.');
  assert.equal(statesLine('Wes', ['sore'], ['quads', 'upper_back']), 'Wes, your upper back and quads are sore today. Here are some suggestions to put the load elsewhere.');
  assert.equal(statesLine('Wes', ['amped', 'sore'], ['chest']), 'Wes, your chest is sore and you’re amped today. Here are some suggestions to put the load elsewhere.');
  assert.equal(statesLine(null, ['sore'], ['upper_back']), 'Your upper back is sore today. Here are some suggestions to put the load elsewhere.');
});

test('states line: other States', () => {
  assert.equal(statesLine('Wes', ['amped'], []), 'Wes, you’re amped today. Here are some suggestions to put that energy to work.');
  assert.equal(statesLine('Wes', ['bored', 'amped'], []), 'Wes, you’re amped and bored today. Here are some suggestions built for both.');
  assert.equal(statesLine('', ['low_energy', 'stressed', 'irritated'], []), 'You’re low on energy, stressed and irritated today. Here are some suggestions built for all of it.');
  assert.equal(statesLine('Wes', [], []), null);
});

import { buildRequest as _br, initialInputs as _ii, setGoal, effectiveGoal } from './v3HomeModel';
test('goal: today-only override; the profile goal sends nothing', () => {
  const base = _ii('strength');
  assert.equal(_br(base, D).goal, undefined);
  const g = setGoal(base, 'build_muscle', 'build_strength');
  assert.equal(_br(g, D).goal, 'build_muscle');
  assert.notEqual(requestSignature(_br(g, D)), requestSignature(_br(base, D)));
  const back = setGoal(g, 'build_strength', 'build_strength');
  assert.equal(back.goal, null);
  assert.equal(effectiveGoal(back, 'build_strength'), 'build_strength');
});

import { fitCards, weekStrip } from './v3HomeRecs';
test('week strip: Monday-first, today, future, trained local days', () => {
  const now = new Date(2026, 9, 2, 10, 0); // Fri Oct 2 2026
  const wk = weekStrip(now, [new Date(2026, 8, 30, 19, 30).toISOString(), new Date(2026, 9, 1, 23, 50).toISOString(), new Date(2026, 9, 2, 7).toISOString(), null, 'bad']);
  assert.equal(wk.monthLabel, 'OCT 2026');
  assert.deepEqual(wk.days.map((d) => d.letter), ['M', 'T', 'W', 'T', 'F', 'S', 'S']);
  assert.deepEqual(wk.days.map((d) => d.day), [28, 29, 30, 1, 2, 3, 4]);
  assert.deepEqual(wk.days.map((d) => d.trained), [false, false, true, true, true, false, false]);
  assert.equal(wk.days.findIndex((d) => d.isToday), 4);
  assert.deepEqual(wk.days.map((d) => d.isFuture), [false, false, false, false, false, true, true]);
  // Sunday belongs to the week that started the Monday before
  assert.equal(weekStrip(new Date(2026, 9, 4, 9), []).days[0].day, 28);
});

test('cards shrink only as much as needed to stay on screen', () => {
  assert.deepEqual(fitCards(114, 30), { height: 203, extra: 30 });
  assert.deepEqual(fitCards(114, -20), { height: 183, extra: 0 });
  assert.equal(fitCards(114, -200).height, 165);
});

test('recsLine: one line under MOOD’s suggestions, last session noted only within 24 h (founder pass, Oct 2026)', async () => {
  const { recsLine, RECS_LINE_MAX } = await import('./v3HomeRecs');
  const now = new Date(2026, 9, 6, 9, 0).getTime();
  const h = (id: string, dir: any, hoursAgo: number) => [{ archetype: { id, name: id }, direction: dir, completed_at: new Date(now - hoursAgo * 3600e3).toISOString() }];
  const legs = { trained: 'legs', strengthArchetype: 'strength_upper_pull' };
  assert.equal(recsLine(['amped', 'bored'], h('strength_glutes_legs', 'strength', 14), legs, now), 'After legs yesterday · Amped + Bored');
  assert.equal(recsLine([], h('strength_glutes_legs', 'strength', 14), legs, now), 'Legs yesterday, so your Pick rests them');
  assert.equal(recsLine(['amped'], h('strength_glutes_legs', 'strength', 14), legs, now), 'After legs yesterday, built for Amped');
  assert.equal(recsLine([], h('strength_glutes_legs', 'strength', 2), legs, now), 'Legs today, so MOOD’s Pick rests them');
  assert.equal(recsLine([], h('strength_upper_push', 'strength', 14), { trained: 'chest and shoulders', strengthArchetype: 'x' }, now), 'MOOD’s Pick rests your chest & shoulders');
  assert.equal(recsLine([], h('sweat_engine', 'sweat', 20), null, now), 'Last session: conditioning, yesterday');
  assert.equal(recsLine(['amped'], h('sweat_engine', 'sweat', 30), null, now), 'Personalized for Amped');
  assert.equal(recsLine([], h('strength_glutes_legs', 'strength', 30), legs, now), 'MOOD’s Pick rests your legs');
  assert.equal(recsLine([], [], null, now), 'Picked for how you feel today');
  // every combination stays on one line
  const all: any[] = ['low_energy', 'amped', 'stressed', 'bored', 'irritated', 'sore'];
  const ids = ['strength_upper_push', 'strength_upper_pull', 'strength_full_body', 'strength_arms', 'sweat_circuit', 'athletic_full_body', 'athletic_power'];
  for (let m = 0; m < 64; m++) {
    const st = all.filter((_, i) => m & (1 << i));
    for (const id of ids) for (const hr of [1, 14, 30]) {
      const line = recsLine(st, h(id, id.split('_')[0], hr), { trained: 'chest and shoulders', strengthArchetype: 'x' }, now);
      assert.ok(line.length <= RECS_LINE_MAX, `${line} (${line.length})`);
    }
  }
});

test('server times without an offset are UTC, not the phone’s local time (Houston bug, Oct 2026)', async () => {
  const { parseServerTime, recsLine } = await import('./v3HomeRecs');
  assert.equal(parseServerTime('2026-10-02T16:20:00'), Date.parse('2026-10-02T16:20:00Z'));
  assert.equal(parseServerTime('2026-10-02T16:20:00.123456'), Date.parse('2026-10-02T16:20:00.123Z'));
  assert.equal(parseServerTime('2026-10-02T16:20:00+00:00'), Date.parse('2026-10-02T16:20:00Z'));
  assert.equal(parseServerTime('2026-10-02T11:20:00-05:00'), Date.parse('2026-10-02T16:20:00Z'));
  // 10 min after a naive-UTC completion: noted, not dropped as "in the future"
  const now = Date.parse('2026-10-02T16:30:00Z');
  const line = recsLine([], [{ archetype: { id: 'strength_upper_push', name: 'Upper Push' }, direction: 'strength', completed_at: '2026-10-02T16:20:00.512000' }], null, now);
  assert.match(line, /^Last session: chest & shoulders, today$/);
});

test('featured moods + the two-line suggestions message (founder pass, Oct 2026)', async () => {
  const { featuredMoods, recsMessage, recSlots, RECS_MESSAGE_MAX } = await import('./v3HomeRecs');
  // three different moods, one per card, never Sore; a new set each day; none once answered (steady)
  const days = ['2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07'].map((d) => featuredMoods(d, false));
  for (const f of days) { assert.equal(f.length, 3); assert.equal(new Set(f).size, 3); assert.ok(!f.includes('sore')); }
  assert.equal(new Set(days.map((f) => f.join())).size, 5);
  assert.deepEqual(featuredMoods('2026-10-03', true), []);
  // each card's request is built for its own mood
  const f = featuredMoods('2026-10-03', false);
  const slots = recSlots({ pick: 'strength', states: [], soreness: [], duration: 60, date: '2026-10-03', slotStates: f });
  assert.deepEqual(slots.map((s) => s.request.states), f.map((x) => [x]));
  assert.equal(new Set(slots.map((s) => s.signature)).size, 3);
  const now = new Date(2026, 9, 6, 9, 0).getTime();
  const h = (id: string, dir: any, hoursAgo: number) => [{ archetype: { id, name: id }, direction: dir, completed_at: new Date(now - hoursAgo * 3600e3).toISOString() }];
  const legs = { trained: 'legs', strengthArchetype: 'strength_upper_pull' };
  assert.equal(recsMessage({ states: [], featured: ['amped', 'stressed', 'bored'], history: [], recovery: null, now }), 'Not sure yet? One pick each for feeling amped, stressed and bored.');
  assert.equal(recsMessage({ states: [], featured: [], history: [], recovery: null, now }), 'Steady is a great place to start. Here’s a balanced pick for each style.');
  assert.equal(recsMessage({ states: ['amped', 'bored'], featured: [], history: h('sweat_engine', 'sweat', 14), recovery: null, now }), 'Nice work on yesterday’s conditioning. Three picks built for your mood.');
  const all: any[] = ['low_energy', 'amped', 'stressed', 'bored', 'irritated', 'sore'];
  const ids = ['strength_upper_push', 'strength_upper_pull', 'strength_full_body', 'strength_arms', 'sweat_circuit', 'athletic_full_body', 'athletic_power'];
  const feats = ['2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07'].map((d) => featuredMoods(d, false));
  for (let m = 0; m < 64; m++) {
    const st = all.filter((_, i) => m & (1 << i));
    for (const fe of [[], ...feats] as any[]) for (const id of ids) for (const hr of [1, 14, 30]) for (const rec of [null, legs]) {
      const msg = recsMessage({ states: st, featured: st.length ? [] : fe, history: h(id, id.split('_')[0], hr), recovery: rec, now });
      assert.ok(msg.length <= RECS_MESSAGE_MAX, `${msg} (${msg.length})`);
    }
  }
});
