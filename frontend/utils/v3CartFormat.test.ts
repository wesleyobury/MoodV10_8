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
import { bftBlurb, bodyEmphasis, cartBlocks, cartExplain, cartHeader, estimatedLabel, itemDetail, cartSections } from './v3CartFormat';
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

/* ---------------------------------------------------------------- scan model (founder UX pass) */
import { cartScan, structureLabel } from './v3CartFormat';

const FIXTURES: { workout: any }[] = JSON.parse(readFileSync(join(__dirname, 'v3Session', '__fixtures__', 'envelopes.json'), 'utf8'));

test('scan: no rest, effort or muscle detail on rows; the envelope is untouched', () => {
  for (const f of FIXTURES.slice(0, 120)) {
    const before = JSON.stringify(f.workout);
    const blocks = cartScan(f.workout);
    assert.equal(JSON.stringify(f.workout), before);
    for (const b of blocks) {
      assert.doesNotMatch(b.label, /rest|recovery|RPE|RIR/i, b.label);
      for (const r of b.rows) {
        assert.doesNotMatch(r.rx, /\brest \d|recovery|RPE|RIR|left in the tank/i, r.rx); // ("rest-pause" is a set method, part of the prescription)
        assert.ok(r.rx.length > 0 && r.name.length > 0);
      }
    }
  }
});

test('scan: grouping is preserved (A1/A2 pairs, numbered stations, anchor first) and main work is emphasised', () => {
  const sup = FIXTURES.find((f) => f.workout.direction === 'strength' && f.workout.blocks.some((b: any) => b.structure === 'superset'))!.workout;
  const sb = cartScan(sup).find((b) => b.structure === 'superset')!;
  assert.match(sb.label, /^SUPERSET · \d+ ROUNDS$/);
  assert.deepEqual(sb.rows.map((r) => r.marker), ['A1', 'A2']);
  assert.equal(sb.grouped, true);
  const circ = FIXTURES.find((f) => f.workout.blocks.some((b: any) => b.structure === 'circuit'))!.workout;
  const cb = cartScan(circ).find((b) => b.structure === 'circuit')!;
  assert.match(cb.label, /^CIRCUIT · \d+ ROUNDS$/);
  assert.deepEqual(cb.rows.map((r) => r.marker), cb.rows.map((_, i) => String(i + 1)));
  const hyb = FIXTURES.find((f) => f.workout.blocks.some((b: any) => b.structure === 'anchor_circuit'))!.workout;
  const hb = cartScan(hyb).find((b) => b.structure === 'anchor_circuit')!;
  assert.equal(hb.rows[0].marker, 'ANCHOR');
  assert.equal(hb.emphasis, hyb.blocks.find((b: any) => b.structure === 'anchor_circuit').type === 'primary' ? 'main' : 'secondary');
  const str = FIXTURES.find((f) => f.workout.direction === 'strength' && f.workout.blocks.some((b: any) => b.type === 'main'))!.workout;
  const blocks = cartScan(str);
  assert.equal(blocks.find((b) => b.label === 'MAIN LIFT')?.emphasis, 'main');
  assert.ok(blocks.filter((b) => b.emphasis === 'secondary').length >= 1);
  const straight = blocks.find((b) => b.structure === 'straight')!;
  assert.match(straight.rows[0].rx, /^\d+ (×|sets:)/);
});

test('scan: every reachable structure gets a label from structured fields only', () => {
  const seen = new Map<string, string>();
  for (const f of FIXTURES) for (const b of f.workout.blocks) if (!seen.has(b.structure)) seen.set(b.structure, structureLabel(b) ?? '(role)');
  for (const k of ['superset', 'circuit', 'anchor_circuit', 'timed_circuit', 'intervals', 'emom', 'continuous', 'pyramid', 'ladder']) assert.ok(seen.get(k) && seen.get(k) !== '(role)', k);
  assert.match(seen.get('emom')!, /^EMOM · \d+ min( · \d+ rounds)?$/); // rounds said when there are several stations (founder pass, Oct 2026)
  assert.match(seen.get('timed_circuit')!, /on \/ .* easy$/);
});

/* ---------------------------------------------------------------- founder review: sections */

test('cartSections: every exercise once, in API order; Strength sections are named by muscle group', () => {
  for (const { envelope } of PACK) {
    const w = envelope.workout;
    if (!w) continue;
    const secs = cartSections(w);
    const rows = secs.flatMap((s) => s.blocks.flatMap((b) => b.rows.map((r) => r.itemId)));
    assert.deepEqual(rows, w.blocks.flatMap((b) => b.items.map((i) => i.item_id)), 'every exercise once, in API order');
    for (let i = 1; i < secs.length; i++) assert.notEqual(secs[i].title, secs[i - 1].title, 'consecutive sections differ');
    if (w.direction === 'strength') {
      for (const s of secs) assert.ok(!/^(PRIMARY|SECONDARY|ACCESSORIES)$/.test(s.title), `muscle-group title, got ${s.title}`);
      if (w.blocks[0]?.type === 'main') assert.equal(secs[0].emphasis, 'main');
    }
    for (const s of secs) {
      assert.equal(s.exercises, s.blocks.reduce((n, b) => n + b.rows.length, 0));
      for (const b of s.blocks) {
        // inside a section a straight block carries no label; grouped / clocked blocks keep a one-line structure label
        if (b.structure === 'straight') assert.equal(b.label, '');
        else assert.ok(b.label.length <= 34, `short structure label: ${b.label}`);
      }
    }
  }
});

test('Built for Today blurb: reasons only, one paragraph, no repeated "direct work"', () => {
  const b = bftBlurb([
    { code: 'why_today', text: 'Strength is the goal, so Barbell Hip Thrust gets the priority. Quads, hamstrings and glutes each get direct work, in that order.' },
    { code: 'target', text: 'Quads + Hamstrings + Glutes run as a Glutes + Legs session, so each gets direct work. Your last leg day was 4 days ago, so they should be fresh for this.' },
    { code: 'structure', text: 'Barbell Hip Thrust (5 × 4–6) leads as the main lift, then 1 strength lift and 2 accessories.' },
    { code: 'volume', text: '17 working sets across 4 exercises, about 46 minutes.' },
    { code: 'intensity', text: 'Main work stops about 2 reps short of failure.' },
    { code: 'difficulty', text: 'Intermediate difficulty: every movement is within the intermediate complexity and skill limits.' },
    { code: 'goal', text: 'Your profile goal is to build strength; today’s Strength session is built from today’s choices.' },
  ])!;
  assert.equal(b, 'Strength is the goal, so Barbell Hip Thrust gets the priority. Quads + Hamstrings + Glutes run as a Glutes + Legs session, so each gets direct work. Your last leg day was 4 days ago, so they should be fresh for this.');
  assert.ok(!/working sets|short of failure|difficulty|leads as the main lift/.test(b));
});

test('Built for Today blurb: soreness leads; nothing worth saying -> null', () => {
  const b = bftBlurb([
    { code: 'progression', text: 'Your last Back Squat session sets today’s target.' },
    { code: 'sore', text: 'Today’s workout shifts stress away from your sore chest.' },
  ])!;
  assert.ok(b.startsWith('Today’s workout shifts stress away from your sore chest.'));
  assert.equal(bftBlurb([{ code: 'volume', text: '17 working sets.' }]), null);
});

const it = (name: string, muscles: string[]) => ({ item_id: name, exercise: { id: name, name, primary_muscles: muscles, media: null }, prescription: { kind: 'reps', sets: 3, reps: 10, display: '3 × 10' } });
const blk = (id: string, type: string, structure: string, items: any[]) => ({ block_id: id, sequence: 0, type, structure, title: '', rounds: structure === 'superset' ? 3 : null, items });

test('Strength arms cart: sections by muscle group, supersets name both, never a secondary muscle', () => {
  const w = { ...workouts.find((x) => x.direction === 'strength')!, blocks: [
    blk('b1', 'secondary', 'straight', [it('Zottman Curl', ['biceps', 'forearms'])]),
    blk('b2', 'secondary', 'straight', [it('Assisted Dip', ['triceps', 'chest'])]),
    blk('b3', 'accessory', 'superset', [it('Spider Curl', ['biceps']), it('Machine Lateral Raise', ['side_delts'])]),
    blk('b4', 'accessory', 'straight', [it('Rope Pushdown', ['triceps'])]),
    blk('b5', 'accessory', 'straight', [it('Overhead Extension', ['triceps'])]),
  ] } as any;
  const secs = cartSections(w);
  assert.deepEqual(secs.map((s) => s.title), ['BICEPS + FOREARMS', 'TRICEPS + CHEST', 'BICEPS + SHOULDERS', 'TRICEPS']);
  assert.deepEqual(secs.map((s) => s.muscles), ['Strength', 'Strength', 'Accessories', 'Accessories']);
  assert.equal(secs[3].exercises, 2);
  assert.ok(!secs.some((s) => /FOREARMS · |BICEPS · FOREARMS/.test(s.title)));
});

test('Built for Today blurb is condensed: at most 3 sentences, the personal ones first', () => {
  const b = bftBlurb([
    { code: 'why_today', text: 'Strength is the goal, so Barbell Hip Thrust gets the priority; everything else supports it. 4 movements are new. Quads, hamstrings and glutes each get direct work, in that order.' },
    { code: 'target', text: 'Quads + Hamstrings + Glutes run as a Glutes + Legs session, so each gets direct work. Your last leg day was 4 days ago, so they should be fresh for this. For your goal to build strength, it leads with Barbell Hip Thrust at 5 × 4–6.' },
  ])!;
  const n = b.split(/(?<=\.)\s+/).length;
  assert.ok(n <= 3 && b.length <= 300, b);
  assert.ok(b.includes('Your last leg day was 4 days ago'));
  assert.ok(!/movements are new|in that order/.test(b));
  assert.equal((b.match(/goal/g) ?? []).length, 1);
});

test('Built for Today: the server-written blurb is shown verbatim; old workouts fall back to stitched lines', () => {
  const w = workouts.find((x) => x.direction === 'strength')!;
  const copy = "You've got extra juice today, so we're using it. The accessories run closer to the edge than usual. Push where it counts.";
  const withBlurb = { ...w, today: { ...(w.today ?? { told: [], chose: '', chosen_by: '' }), blurb: copy } } as any;
  assert.equal(cartExplain(withBlurb, null).blurb, copy);
  const without = { ...w, today: { ...(w.today ?? { told: [], chose: '', chosen_by: '' }), blurb: undefined } } as any;
  assert.ok(cartExplain(without, null).blurb !== copy);
});

import { savedBody } from './v3SavedBody';
test('save to profile: V3 body keeps the workout id, one row per exercise', () => {
  const w = workouts.find((x) => x.direction === 'strength')!;
  const b = savedBody({ ...w, workout_id: 'abc123456789' } as any, new Date('2026-10-02T12:00:00'));
  assert.equal(b.source, 'v3');
  assert.equal(b.featured_workout_id, 'abc123456789');
  assert.equal(b.workouts.length, w.blocks.reduce((n, x) => n + x.items.length, 0));
  assert.ok(b.name.endsWith('6789') && b.name.includes('Oct 2'));
});

test('Strength leg day: leg work after the main lift shares one section', () => {
  const w = { ...workouts.find((x) => x.direction === 'strength')!, target: { mode: 'moods_pick', muscles: [], label: '' }, blocks: [
    blk('m', 'main', 'straight', [it('Barbell Hip Thrust', ['glutes'])]),
    blk('s1', 'secondary', 'straight', [it('Hack Squat', ['quads', 'glutes'])]),
    blk('s2', 'secondary', 'straight', [it('Single-Leg RDL', ['hamstrings', 'glutes'])]),
    blk('a1', 'accessory', 'straight', [it('Leg Extension', ['quads'])]),
    blk('a2', 'accessory', 'straight', [it('Hollow Body Hold', ['core'])]),
  ] } as any;
  const secs = cartSections(w);
  assert.deepEqual(secs.map((s) => s.title), ['GLUTES', 'LEGS', 'CORE']);
  assert.equal(secs[1].exercises, 3);
  assert.equal(secs[1].muscles, 'Strength · Accessories');
  const t = cartSections({ ...w, target: { mode: 'explicit', muscles: ['hamstrings', 'calves'], label: 'Hamstrings + Calves' }, blocks: [
    blk('a', 'secondary', 'straight', [it('RDL', ['hamstrings', 'glutes'])]),
    blk('b', 'accessory', 'superset', [it('Leg Curl', ['hamstrings']), it('Calf Raise', ['calves'])]),
  ] } as any);
  assert.deepEqual(t.map((s) => s.title), ['HAMSTRINGS + CALVES']);
});

test('Athletic cart: performance roles, never bodybuilding muscle labels (final pre-launch pass)', () => {
  const ath = (name: string, muscles: string[], role: string) => ({ ...it(name, muscles), prescription: { kind: 'reps', sets: 3, reps: 3, display: '3 × 3', direction_fields: { performance_role: role } } });
  const w = { ...workouts.find((x) => x.direction === 'athletic')!, blocks: [
    blk('p', 'primary', 'straight', [ath('Hang Power Clean', ['glutes', 'hamstrings'], 'Total-Body Power')]),
    blk('s', 'secondary', 'straight', [ath('Landmine Rotational Punch', ['shoulders', 'core'], 'Rotational Power')]),
    blk('t', 'secondary', 'straight', [ath('Med-Ball Scoop Toss', ['glutes', 'hamstrings'], 'Total-Body Power')]),
    blk('st', 'strength', 'straight', [ath('Trap-Bar Deadlift', ['glutes', 'quads'], 'Strength Support')]),
  ] } as any;
  const secs = cartSections(w);
  assert.deepEqual(secs.map((s) => s.muscles), ['Total-Body Power', 'Rotational Power · Total-Body Power', 'Strength Support']);
  assert.ok(!secs.some((s) => /Shoulders|Glutes|Hamstrings/.test(s.muscles ?? '')));
  const rows = cartBlocks(w).flatMap((b) => b.rows);
  assert.deepEqual(rows.map((r) => r.facts.find((f) => /Power|Support/.test(f))), ['Total-Body Power', 'Rotational Power', 'Total-Body Power', 'Strength Support']);
  assert.deepEqual(itemDetail(w, 'Landmine Rotational Punch')!.detail.muscles, ['Rotational Power']);
});

test('Athletic cart: one sequenced session in phases (Primer -> Power -> Athletic Strength), FOR VELOCITY on lifts', () => {
  const row = (name: string, role: string, tag: string | null = null) => ({ ...it(name, ['glutes']), prescription: { kind: 'reps', sets: 3, reps: 3, display: '3 × 3', direction_fields: { performance_role: role, context_tag: tag } } });
  const pb = (id: string, type: string, phase: string, label: string, items: any[], structure = 'straight') => ({ ...blk(id, type, structure, items), phase, phase_label: label });
  const w = { ...workouts.find((x) => x.direction === 'athletic')!, blocks: [
    pb('pr', 'primer', 'primer', 'Primer', [row('Broad Jump to Stick', 'Plyometric', 'Primer')]),
    pb('p', 'primary', 'power', 'Power', [row('Hang High Pull', 'Total-Body Power')]),
    pb('s', 'secondary', 'power', 'Power', [row('Landmine Push Press', 'Upper-Body Power')]),
    pb('t', 'secondary', 'power', 'Power', [row('Med-Ball Rotational Throw', 'Rotational Power')]),
    pb('st', 'strength', 'strength', 'Athletic Strength', [row('Front Squat', 'Velocity Strength', 'For velocity')]),
  ] } as any;
  const secs = cartSections(w);
  assert.deepEqual(secs.map((s) => s.title), ['PRIMER', 'POWER', 'ATHLETIC STRENGTH']);
  assert.deepEqual(secs.map((s) => s.emphasis), ['secondary', 'main', 'secondary']);
  assert.equal(secs[1].exercises, 3);
  assert.ok(secs.every((s) => s.blocks.every((b) => b.label === '')));          // straight blocks carry no Primary / Secondary labels
  assert.equal(secs[2].muscles, null);                                          // "Velocity Strength" is said on the row, not repeated
  assert.deepEqual(secs.flatMap((s) => s.blocks.flatMap((b) => b.rows.map((r) => r.context))), ['PRIMER', null, null, null, 'FOR VELOCITY']);
});
