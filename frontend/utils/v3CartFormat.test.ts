/**
 * Workout Cart (H2) presentation model + H1 Home helpers.
 * Runs every envelope in the dev pack fixture (utils/dev/v3PackFixture.json: Strength, Sweat, Athletic) through the Cart
 * model and checks that nothing is lost or reordered, and that headings are Direction-specific.
 * Run: node --import tsx --test utils/v3CartFormat.test.ts   (or yarn test:v3-cart)
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { V3Envelope } from './v3Api';
import { bodyEmphasis, cartBlocks, cartExplain, cartHeader, estimatedLabel, itemDetail } from './v3CartFormat';
import { defaultDuration, focusSummary, greeting, heroContextLine, initialInputs, sameStates } from './v3HomeModel';

const PACK: { key: string; envelope: V3Envelope }[] = JSON.parse(readFileSync(join(__dirname, 'dev', 'v3PackFixture.json'), 'utf8'));
const workouts = PACK.map((p) => p.envelope.workout).filter(Boolean) as NonNullable<V3Envelope['workout']>[];

test('fixture covers all three Directions', () => {
  const dirs = new Set(workouts.map((w) => w.direction));
  for (const d of ['strength', 'sweat', 'athletic']) assert.ok(dirs.has(d as any), d);
});

test('every block and every exercise appears once, in API order', () => {
  for (const w of workouts) {
    const blocks = cartBlocks(w);
    assert.deepEqual(blocks.map((b) => b.key), w.blocks.map((b) => b.block_id));
    const shown = blocks.flatMap((b) => b.rows.map((r) => r.item.item_id)).sort();
    const api = w.blocks.flatMap((b) => b.items.map((i) => i.item_id)).sort();
    assert.deepEqual(shown, api, w.archetype.id);
    for (const b of blocks) {
      assert.ok(b.heading && !/undefined|null/.test(b.heading), `${w.archetype.id}: heading`);
      for (const r of b.rows) assert.ok(r.rx && !/undefined|NaN/.test(r.rx), `${w.archetype.id}: rx ${r.item.exercise.name}`);
    }
  }
});

test('headings come from the Direction-specific role, not a shared section list', () => {
  const allowed: Record<string, string[]> = {
    strength: ['Main Lift', 'Secondary', 'Target', 'Accessory', 'Finisher'],
    sweat: ['Primary', 'Complement', 'Finisher'],
    athletic: ['Primary', 'Secondary', 'Athletic Strength', 'Support', 'Finisher'],
  };
  for (const w of workouts) {
    for (const [i, b] of cartBlocks(w).entries()) {
      const known = allowed[w.direction].includes(b.heading);
      // An unknown role falls back to the API's own title, never to another Direction's vocabulary.
      assert.ok(known || b.heading === w.blocks[i].title, `${w.direction}/${w.blocks[i].type}: ${b.heading}`);
    }
  }
});

test('superset rows are tagged A1/A2 and the Hybrid anchor leads its block', () => {
  for (const w of workouts) {
    for (const b of cartBlocks(w)) {
      if (b.grouped) assert.ok(b.rows.every((r) => /^[A-Z]\d$/.test(r.tag ?? '')), 'superset tags');
      if (b.structure === 'anchor_circuit') assert.equal(b.rows[0].tag, 'ANCHOR');
    }
  }
});

test('header shows the estimated workout, never the requested window', () => {
  for (const w of workouts) {
    const h = cartHeader(w);
    assert.equal(h.facts[0], estimatedLabel(w));
    assert.equal(estimatedLabel(w), `~${Math.round(w.duration.estimated_minutes)} min`);
    assert.ok(h.eyebrow.startsWith(w.direction_name.toUpperCase()));
    if (w.direction !== 'strength') assert.equal(bodyEmphasis(w), null);
  }
});

test('Built for Today keeps every line (reroute text shown separately)', () => {
  for (const w of workouts) {
    const e = cartExplain(w, null);
    assert.equal(e.lines.length, (w.built_for_today ?? []).length);
  }
});

test('detail sheet resolves every item', () => {
  for (const w of workouts) for (const b of w.blocks) for (const it of b.items) assert.ok(itemDetail(w, it.item_id), it.exercise.name);
});

test('H1 home helpers', () => {
  assert.equal(greeting('Wes Ogsbury', new Date(2026, 8, 28, 8)), 'Good morning, Wes.');
  assert.equal(greeting('Wes', new Date(2026, 8, 28, 19)), 'Good evening, Wes.');
  assert.equal(greeting('', new Date(2026, 8, 28, 13)), 'Good afternoon.');
  assert.equal(heroContextLine({ firstVisit: false, workoutStreak: 1 }), null);
  assert.match(heroContextLine({ firstVisit: false, workoutStreak: 4 }) ?? '', /^4-day/);
  assert.match(heroContextLine({ firstVisit: true, workoutStreak: 9 }) ?? '', /first/);
  assert.equal(defaultDuration(30, 60), 30);
  assert.equal(defaultDuration(undefined, 30), 30);
  assert.equal(defaultDuration(null, null), 60);
  assert.ok(sameStates(['amped', 'sore'], ['sore', 'amped']));
  assert.ok(!sameStates(['amped'], []));
  assert.equal(focusSummary(initialInputs('strength')), "MOOD's Pick");
});

/* ---------------------------------------------------------------- founder edit pass */
import { buildRequest, requestSignature, sameSoreness, soreSummary, bodyAreaOf, pickBodyArea, toggleStrengthMuscle, targetLabel } from './v3HomeModel';
import { previewTitle } from './v3PreviewFormat';

test('no States selected -> the request carries zero States (and its signature says so)', () => {
  const req = buildRequest(initialInputs('strength'), '2026-10-01');
  assert.deepEqual(req.states, []);
  assert.deepEqual(req.soreness, []);
  assert.match(requestSignature(req), /"s":\[\]/);
});

test('a workout with no States shows no States anywhere in the Cart header', () => {
  for (const w of workouts.filter((x) => x.states.length === 0)) {
    assert.equal(cartHeader(w).eyebrow, w.direction_name.toUpperCase());
  }
});

test('Sore areas: comparison and summary', () => {
  assert.ok(sameSoreness(['legs', 'lower_back'], ['lower_back', 'legs']));
  assert.ok(!sameSoreness(['legs'], []));
  assert.equal(soreSummary(['legs', 'lower_back']), 'Sore · Legs, Lower Back');
});

test('Strength Focus: body areas are exact Target sets; muscles replace an area', () => {
  let i = pickBodyArea(initialInputs('strength'), 'upper_body');
  assert.deepEqual(i.target, ['chest', 'back', 'shoulders']);
  assert.equal(targetLabel(i.target), 'Upper Body');
  assert.equal(bodyAreaOf(['glutes', 'quads', 'hamstrings'])?.label, 'Lower Body');
  i = toggleStrengthMuscle(i, 'biceps').inputs;
  assert.deepEqual(i.target, ['biceps']);
  i = pickBodyArea(i, 'full_body');
  assert.equal(i.target, 'full_body');
  assert.equal(pickBodyArea(i, 'full_body').target, null);
  const w = { ...workouts[0], target: { mode: 'explicit', muscles: ['shoulders', 'chest', 'back'], label: 'Chest + Back + Shoulders' } } as any;
  assert.equal(previewTitle(w), 'Upper Body');
});

test('Built for Today is plain English and a reroute is explained once', () => {
  const w = workouts.find((x) => (x.built_for_today ?? []).some((l) => /RPE|in reserve|working sets/.test(l.text)));
  if (w) for (const l of cartExplain(w, null).lines) assert.ok(!/\bRPE\b|in reserve|working sets/.test(l.text.replace(/\([^)]*\)/g, '')), l.text);
  const rerouted = { ...workouts[0], built_for_today: [{ code: 'sore_reroute', kind: 'adaptation', text: 'Your legs are sore, so we moved the work.' }, { code: 'volume', kind: 'decision', text: '12 working sets across 4 exercises.' }] } as any;
  const e = cartExplain(rerouted, 'Your legs are sore, so we moved the work.');
  assert.equal(e.lead, 'Your legs are sore, so we moved the work.');
  assert.ok(e.adjusted);
  assert.equal(e.lines[0].text, 'Your legs are sore, so we moved the work.');
  assert.equal(e.lines.filter((l) => /sore/.test(l.text)).length, 1);
  const e2 = cartExplain({ ...rerouted, built_for_today: [{ code: 'volume', kind: 'decision', text: 'x' }] }, 'Today moved from Lower Body: Squat to Upper Pull.');
  assert.match(e2.lead ?? '', /^We changed today’s session from Lower Body: Squat to Upper Pull/);
  assert.equal(e2.lines.filter((l) => /changed today/.test(l.text)).length, 1);
});

test('scalable bodyweight rows: a short Cart hint, the full instruction once in the sheet, prescription unchanged', () => {
  const w = JSON.parse(JSON.stringify(workouts.find((x) => x.direction === 'strength')));
  const b = w.blocks.find((x: any) => x.type !== 'finisher');
  const it = b.items[0];
  const detail = 'Make it fit you. Too hard: use a band or the assisted pull-up machine. Too easy: add weight with a belt or vest. Pick the version that lets you land in the rep range with about 2 good reps left; the effort matters more than the exact count.';
  it.prescription = { ...it.prescription, load_guidance: 'Stop each set with about 2 reps left in the tank. ' + detail, scaling: { kind: 'bodyweight_adjustable', short: 'Scale assistance or load', detail } };
  const row = cartBlocks(w).flatMap((x) => x.rows).find((r) => r.key === it.item_id)!;
  assert.equal(row.scale, 'Scale assistance or load');
  assert.equal(row.rx, it.prescription.display);
  const d = itemDetail(w, it.item_id)!.detail;
  assert.match(d.fit!, /^Too hard: use a band/);
  assert.ok(!/Make it fit you/.test(d.loadGuidance ?? ''), 'not repeated in Load');
  const other = cartBlocks(workouts.find((x) => x.direction === 'sweat')!).flatMap((x) => x.rows);
  assert.ok(other.every((r) => r.scale === null));
});
