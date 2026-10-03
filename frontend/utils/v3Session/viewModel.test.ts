/**
 * Player copy: what the athlete reads at each moment (position, target, next, phase labels, full recovery, scaling, quality
 * stop, since-last-set, EMOM early done, Ready summaries).
 * Run: node --import tsx --test utils/v3Session/viewModel.test.ts
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { V3Block, V3Workout } from '../v3Api';
import { compile } from './compile';
import { SessionState, currentStep, initialState, reduce, resolve } from './engine';
import { clockSummary, stepView } from './viewModel';
import type { SessionPlan } from './types';

const FIX: { tag: string; workout: V3Workout }[] = JSON.parse(readFileSync(join(__dirname, '__fixtures__', 'envelopes.json'), 'utf8'));
const find = (pred: (w: V3Workout, b: V3Block) => boolean) => {
  for (const f of FIX) for (const b of f.workout.blocks) if (pred(f.workout, b)) return { w: f.workout, b };
  throw new Error('no fixture');
};
const T0 = 1_800_000_000_000, S = 1000;
function atBlock(p: SessionPlan, w: V3Workout, b: V3Block): SessionState {
  let s = initialState(p, T0);
  const sec = p.sections.filter((x) => x.kind === 'block')[w.blocks.indexOf(b)];
  while (currentStep(p, s).section < sec.index) s = reduce(p, s, { type: 'skip_block' }, T0);
  return s;
}

test('heavy set: position, target, effort, next says Full recovery then the next set', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.type === 'main' && !!b.rest!.full_recovery && b.items[0].prescription.sets! >= 3);
  const p = compile(w);
  const v = stepView(p, atBlock(p, w, b), T0);
  assert.equal(v.eyebrow, `SET 1 OF ${b.items[0].prescription.sets}`);
  assert.equal(v.title, b.items[0].exercise.name);
  assert.ok(v.target && v.target.length > 0);
  assert.equal(v.primary, 'Complete set');
  assert.match(v.nextLine!, /^Then full recovery \d/);
  const r = stepView(p, reduce(p, atBlock(p, w, b), { type: 'complete' }, T0), T0 + 10 * S);
  assert.equal(r.phaseLabel, 'FULL RECOVERY');
  assert.equal(r.primary, 'Start now');
  assert.equal(r.upNext!.eyebrow, `SET 2 OF ${b.items[0].prescription.sets}`);
  assert.equal(r.timer!.remainingMs, (b.items[0].prescription.rest_sec! - 10) * S);
});

test('Athletic power copy says full recovery but the label follows the structured flag', () => {
  const { w, b } = find((w, b) => w.direction === 'athletic' && b.type === 'primary' && b.structure === 'straight' && !b.rest!.full_recovery && /full recovery/i.test(b.instructions ?? ''));
  const p = compile(w);
  const r = stepView(p, reduce(p, atBlock(p, w, b), { type: 'complete' }, T0), T0);
  assert.equal(r.phaseLabel, 'REST');
  const v = stepView(p, atBlock(p, w, b), T0);
  assert.ok(v.qualityStop);
});

test('superset: A1 tag; the transition shows the partner\'s own screen (founder round 3) with Complete set', () => {
  const { w, b } = find((w, b) => w.direction === 'athletic' && b.structure === 'superset' && b.type === 'primary');
  const p = compile(w);
  const v = stepView(p, atBlock(p, w, b), T0);
  assert.match(v.tag!, /^[A-Z]1$/);
  assert.match(v.nextLine!, /^Then [A-Z]2 · /);
  const t = stepView(p, reduce(p, atBlock(p, w, b), { type: 'complete' }, T0), T0);
  assert.equal(t.phaseLabel, 'MOVE TO');
  assert.equal(t.upNext!.title, b.items[1].exercise.name);
  assert.equal(t.upNext!.qualityStop, b.items[1].quality_stop);
  assert.ok(t.transitionToWork && t.transitionToWork.itemIndex === 1);
  assert.equal(t.item?.item_id, b.items[1].item_id);
  assert.equal(t.primary, 'Complete set');
});

test('circuit station eyebrow and round rest next line', () => {
  const { w, b } = find((w, b) => b.structure === 'circuit' && b.rest!.kind === 'after_round' && b.items.length >= 3);
  const p = compile(w);
  const v = stepView(p, atBlock(p, w, b), T0);
  assert.equal(v.eyebrow, `ROUND 1 OF ${b.rounds} · STATION 1 OF ${b.items.length}`);
  assert.equal(v.primary, 'Done');
});

test('intervals: WORK / EASY labels; Ready summary from the rest contract', () => {
  const { w, b } = find((w, b) => b.structure === 'intervals' && b.rest!.kind === 'interval');
  const p = compile(w);
  const s0 = atBlock(p, w, b);
  const ready = stepView(p, s0, T0);
  assert.equal(ready.primary, 'Start');
  assert.match(clockSummary(ready.section), /× .* work · .* easy/);
  const s1 = reduce(p, s0, { type: 'complete' }, T0);
  assert.equal(stepView(p, s1, T0).phaseLabel, 'WORK');
  const W = b.rest!.work_sec!;
  const easy = stepView(p, resolve(p, s1, T0 + W * S + 1), T0 + W * S + 1);
  assert.equal(easy.phaseLabel, 'EASY');
});

test('EMOM: no Done, no preview while the minute runs; the round is on screen; the switch shows the next station', () => {
  const { w, b } = find((w, b) => b.structure === 'emom' && b.items.length > 1);
  const p = compile(w);
  let s = reduce(p, atBlock(p, w, b), { type: 'complete' }, T0);
  let v = stepView(p, s, T0 + 25 * S);
  assert.equal(v.phaseLabel, 'WORK');
  assert.equal(v.primary, null);
  assert.equal(v.upNext, null);
  assert.equal(v.title, b.items[0].exercise.name);
  assert.equal(v.where.group!.kind, 'emom');
  assert.equal(v.where.group!.round, 1);
  assert.equal(v.where.group!.rounds, Math.ceil(b.interval!.minutes! / b.items.length));
  assert.equal(v.where.group!.items[0].active, true);
  s = resolve(p, s, T0 + 60 * S);
  v = stepView(p, s, T0 + 62 * S);
  assert.equal(v.phaseLabel, 'NEXT MINUTE IN');
  assert.equal(v.upNext!.title, b.items[1].exercise.name);
  assert.equal(v.timer!.running, true);
  assert.equal(v.canAddTime, true);
  assert.equal(v.where.group!.items[0].done, true);
  assert.equal(v.where.group!.items[1].active, true);
});

test('scaling: short shown, detail kept out of the guidance line', () => {
  const { w, b } = find((w, b) => b.items.some((i) => !!i.prescription.scaling && (i.prescription.load_guidance ?? '').includes(i.prescription.scaling!.detail)));
  const p = compile(w);
  let s = atBlock(p, w, b);
  const i = b.items.findIndex((x) => !!x.prescription.scaling);
  while (currentStep(p, s).itemIndex !== i) s = reduce(p, s, { type: 'skip' }, T0);
  const v = stepView(p, s, T0);
  assert.equal(v.scaling!.short, b.items[i].prescription.scaling!.short);
  assert.ok(!v.guidance || !v.guidance.includes(b.items[i].prescription.scaling!.detail));
});

test('first set of the next block shows the since-last-set count-up', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'straight' && w.blocks.indexOf(b) > 0 && w.blocks[w.blocks.indexOf(b) - 1].structure === 'straight');
  const p = compile(w);
  const prev = w.blocks[w.blocks.indexOf(b) - 1];
  let s = atBlock(p, w, prev);
  while (currentStep(p, s).section === p.steps[s.cursor].section && p.sections[currentStep(p, s).section].blockNumber === w.blocks.indexOf(prev) + 1) {
    s = reduce(p, s, { type: currentStep(p, s).type === 'work' ? 'complete' : 'skip' }, T0);
  }
  const v = stepView(p, s, T0 + 40 * S);
  assert.equal(v.sinceLastMs, 40 * S);
});

test('rest timer ring follows −15 / +15 / +30 (ring scaled to the planned rest)', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.type === 'main' && (b.items[0].prescription.rest_sec ?? 0) >= 60 && b.items[0].prescription.sets! >= 2);
  const p = compile(w);
  const rest = b.items[0].prescription.rest_sec! * S;
  let s = reduce(p, atBlock(p, w, b), { type: 'complete' }, T0);
  const frac = (st: SessionState, t: number) => { const v = stepView(p, st, t); return v.timer!.remainingMs / v.timer!.totalMs; };
  const half = T0 + rest / 2;
  const f0 = frac(s, half);
  s = reduce(p, s, { type: 'add_time', seconds: 15 }, half);
  assert.ok(Math.abs(frac(s, half) - (f0 + 15 * S / rest)) < 1e-6, '+15 s grows the ring by 15 s of the planned rest');
  s = reduce(p, s, { type: 'add_time', seconds: -15 }, half);
  s = reduce(p, s, { type: 'add_time', seconds: -15 }, half);
  assert.ok(Math.abs(frac(s, half) - (f0 - 15 * S / rest)) < 1e-6, '−15 s shrinks it');
  const t0 = reduce(p, reduce(p, atBlock(p, w, b), { type: 'complete' }, T0), { type: 'add_time', seconds: 30 }, T0);
  assert.equal(frac(t0, T0), 1, 'extra time beyond the plan keeps the ring full');
});
