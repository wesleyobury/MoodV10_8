/**
 * Session compiler: every committed production-path fixture compiles and satisfies the Session Plan invariants, plus explicit
 * structure scenarios. Fixtures: utils/v3Session/__fixtures__/envelopes.json
 * (regenerate: cd backend && python3 mood_v3/qa/guided_session_fixtures.py ../frontend/utils/v3Session/__fixtures__/envelopes.json)
 * Run: node --import tsx --test utils/v3Session/compile.test.ts
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { V3Block, V3Workout } from '../v3Api';
import { compile, fmtClock, targetFor } from './compile';
import { checkPlan } from './invariants';
import type { SessionPlan } from './types';

const FIX: { tag: string; workout: V3Workout }[] = JSON.parse(readFileSync(join(__dirname, '__fixtures__', 'envelopes.json'), 'utf8'));

const find = (pred: (w: V3Workout, b: V3Block) => boolean) => {
  for (const f of FIX) for (const b of f.workout.blocks) if (pred(f.workout, b)) return { w: f.workout, b };
  throw new Error('no fixture matches');
};
const stepsOf = (plan: SessionPlan, w: V3Workout, b: V3Block) => {
  const bi = w.blocks.indexOf(b);
  const sec = plan.sections.filter((s) => s.kind === 'block')[bi];
  return plan.steps.filter((s) => s.section === sec.index && s.type !== 'finish');
};
const shape = (plan: SessionPlan, w: V3Workout, b: V3Block) =>
  stepsOf(plan, w, b).map((s) => (s.durationSec && s.type !== 'work' ? `${s.type}:${s.durationSec}` : s.type)).join(' ');

test('fixtures cover every reachable structure', () => {
  const kinds = new Set<string>();
  for (const f of FIX) for (const b of f.workout.blocks) kinds.add(`${f.workout.direction}/${b.structure}/${b.rest?.kind}`);
  for (const k of [
    'strength/straight/between_sets', 'strength/superset/after_pair', 'strength/finisher/between_sets', 'strength/ladder/between_sets', 'strength/pyramid/between_sets',
    'sweat/circuit/after_round', 'sweat/anchor_circuit/after_round', 'sweat/intervals/interval', 'sweat/timed_circuit/interval', 'sweat/continuous/continuous',
    'sweat/pyramid/interval', 'sweat/emom/emom', 'sweat/ladder/self_paced', 'sweat/finisher/interval',
    'athletic/straight/between_sets', 'athletic/superset/after_pair',
  ]) assert.ok(kinds.has(k), `missing fixture for ${k}`);
  assert.ok(FIX.length > 100);
});

test('every fixture compiles and satisfies the plan invariants', () => {
  const all: string[] = [];
  for (const f of FIX) all.push(...checkPlan(f.workout, compile(f.workout)));
  assert.deepEqual(all.slice(0, 20), []);
});

test('compilation is deterministic (same ids, same fingerprint)', () => {
  for (const f of FIX.slice(0, 60)) {
    const a = compile(f.workout), b = compile(JSON.parse(JSON.stringify(f.workout)));
    assert.equal(a.fingerprint, b.fingerprint);
    assert.deepEqual(a.steps.map((s) => s.id), b.steps.map((s) => s.id));
  }
});

/* ---------------------------------------------------------------- Strength */

test('Strength straight sets: set → row rest → set, no rest after the final set', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'straight' && b.items[0].prescription.sets === 4 && !b.rest!.full_recovery && b.items[0].prescription.kind === 'reps');
  const r = b.items[0].prescription.rest_sec;
  assert.equal(shape(compile(w), w, b), `work rest:${r} work rest:${r} work rest:${r} work`);
});

test('Heavy Primary: full recovery label comes from the structured flag', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.type === 'main' && !!b.rest!.full_recovery);
  const rests = stepsOf(compile(w), w, b).filter((s) => s.type === 'rest');
  assert.ok(rests.length > 0 && rests.every((s) => s.rest!.fullRecovery && s.rest!.reason === 'heavy'));
});

test('Top Set + Back-off: per-set targets follow reps_scheme', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && Array.isArray(b.items[0].prescription.reps_scheme) && b.structure === 'straight');
  const sch = b.items[0].prescription.reps_scheme as number[];
  const works = stepsOf(compile(w), w, b).filter((s) => s.type === 'work');
  assert.deepEqual(works.map((s) => s.target!.reps), sch);
  assert.equal(works[0].target!.text, `${sch[0]} reps`);
});

test('Strength superset: A1 → 15 s transition → A2 → pair rest; no rest after the last round', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'superset' && b.items.every((i) => i.prescription.kind === 'reps' && !i.prescription.per_side));
  const R = b.rounds!, T = b.rest!.transition_sec, P = b.rest!.seconds;
  assert.equal(T, 15);
  const round = `work transition:${T} work`;
  assert.equal(shape(compile(w), w, b), Array.from({ length: R }, () => round).join(` rest:${P} `));
  const st = stepsOf(compile(w), w, b);
  assert.equal(st[0].labels.group?.[1], '1');
  assert.equal(st[2].labels.group?.[1], '2');
  assert.ok(st.every((s) => s.type !== 'rest' || s.rest!.source === 'pair'));
});

test('Strength time hold: manual-start countdown of prescription.seconds; range shown as prescribed', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.items.some((i) => i.prescription.kind === 'time' && !i.prescription.per_side));
  const i = b.items.findIndex((x) => x.prescription.kind === 'time');
  const s = stepsOf(compile(w), w, b).find((x) => x.type === 'work' && x.itemIndex === i)!;
  assert.equal(s.timerStart, 'manual');
  assert.equal(s.durationSec, b.items[i].prescription.seconds);
  assert.match(s.target!.text, /sec|s$|min/);
});

test('per-side time hold: left (manual) then right (chained), one set', () => {
  const w: any = JSON.parse(JSON.stringify(find((w, b) => w.direction === 'strength' && b.structure === 'straight').w));
  const b = w.blocks[0];
  b.items = [{ ...b.items[0], prescription: { ...b.items[0].prescription, kind: 'time', seconds: 30, reps: '15–30', per_side: true, sets: 2, rest_sec: 45, reps_scheme: null } }];
  b.rest = { kind: 'between_sets', seconds: null, transition_sec: null, full_recovery: false, reason: null };
  const st = stepsOf(compile(w), w, b);
  assert.deepEqual(st.map((s) => `${s.type}${s.side ? ':' + s.side : ''}${s.timerStart ? ':' + s.timerStart : ''}`), [
    'work:left:manual', 'work:right:auto', 'rest', 'work:left:manual', 'work:right:auto',
  ]);
  assert.equal(st[0].target!.text, '15–30 sec / side');
});

test('scalable bodyweight row keeps its prescription untouched', () => {
  const { w, b } = find((w, b) => b.items.some((i) => !!i.prescription.scaling));
  const it = b.items.find((i) => !!i.prescription.scaling)!;
  const before = JSON.stringify(it.prescription);
  compile(w);
  assert.equal(JSON.stringify(it.prescription), before);
});

/* ---------------------------------------------------------------- Sweat */

test('Sweat circuit: stations → round rest only after the last station', () => {
  const { w, b } = find((w, b) => b.structure === 'circuit' && b.rest!.kind === 'after_round' && b.items.every((i) => i.prescription.kind !== 'time'));
  const n = b.items.length, R = b.rounds!, P = b.rest!.seconds;
  const round = Array.from({ length: n }, () => 'work').join(' ');
  assert.equal(shape(compile(w), w, b), Array.from({ length: R }, () => round).join(` rest:${P} `));
  const st = stepsOf(compile(w), w, b);
  assert.equal(st[1].labels.group, `Station 2 of ${n}`);
  assert.equal(st[0].labels.position, `Round 1 of ${R}`);
});

test('Hybrid: anchor opens every round; per-round anchor dose from round_doses', () => {
  const { w, b } = find((w, b) => b.structure === 'anchor_circuit' && Array.isArray(b.items[0].prescription.direction_fields?.round_doses));
  const st = stepsOf(compile(w), w, b).filter((s) => s.type === 'work');
  const doses = b.items[0].prescription.direction_fields!.round_doses as string[];
  const anchors = st.filter((s) => s.labels.group === 'Anchor');
  assert.equal(anchors.length, b.rounds);
  assert.deepEqual(anchors.map((s) => s.target!.text), doses);
});

test('Engine intervals: WORK / EASY, no recovery after the last bout, Ready first', () => {
  const { w, b } = find((w, b) => b.structure === 'intervals' && b.rest!.kind === 'interval' && b.items.length === 1);
  const R = b.rounds!, W = b.rest!.work_sec, E = b.rest!.recovery_sec;
  const body = Array.from({ length: R }, () => `timed_work:${W}`).join(` recovery:${E} `);
  assert.equal(shape(compile(w), w, b), `ready ${body}`);
});

test('Timed circuit: station recovery and round rest stack at round end (engine time accounting)', () => {
  const { w, b } = find((w, b) => b.structure === 'timed_circuit');
  const st = stepsOf(compile(w), w, b);
  const n = b.items.length, R = b.rounds!, W = b.rest!.work_sec!, E = b.rest!.recovery_sec!, RR = b.rest!.seconds!;
  assert.equal(st.filter((s) => s.type === 'timed_work').length, n * R);
  const roundRests = st.filter((s) => s.rest?.source === 'round_interval');
  assert.equal(roundRests.length, R - 1);
  assert.ok(roundRests.every((s) => s.durationSec === E + RR));
  // total clock time equals the engine's accounting: n*R*work + (n*R - 1)*recovery + (R - 1)*round_rest - (one trailing recovery)
  const clock = st.reduce((t, s) => t + (s.durationSec ?? 0), 0);
  assert.equal(clock, n * R * W + (n * R - 1) * E + (R - 1) * RR);
});

test('D1: State-raised timed circuit times every station at block.rest.work_sec and shows the same number', () => {
  for (const f of FIX.filter((x) => x.tag.startsWith('d1_'))) {
    const b = f.workout.blocks.find((x) => x.structure === 'timed_circuit')!;
    assert.equal(b.rest!.work_sec, 45);
    const st = stepsOf(compile(f.workout), f.workout, b).filter((s) => s.type === 'timed_work');
    assert.ok(st.every((s) => s.durationSec === 45 && s.target!.text === '45 s'));
    assert.ok(b.items.every((i) => i.prescription.seconds === 45 && i.prescription.display.startsWith('45 s')));
  }
});

test('EMOM: minute clock, stations cycle in item order', () => {
  const { w, b } = find((w, b) => b.structure === 'emom');
  const st = stepsOf(compile(w), w, b);
  assert.equal(st[0].type, 'ready');
  const mins = st.filter((s) => s.type === 'emom_minute');
  assert.equal(mins.length, b.interval!.minutes);
  assert.deepEqual(mins.slice(0, b.items.length + 1).map((s) => s.itemIndex), [...b.items.map((_, i) => i), 0]);
  assert.equal(mins[6].labels.position, `Minute 7 of ${b.interval!.minutes}`);
});

test('Continuous: Ready then one timer', () => {
  const { w, b } = find((w, b) => b.structure === 'continuous');
  assert.equal(shape(compile(w), w, b), `ready timed_work:${b.items[0].prescription.seconds}`);
});

test('Pyramid: steps_sec with recovery between', () => {
  const { w, b } = find((w, b) => b.structure === 'pyramid' && b.rest!.kind === 'interval');
  const E = b.rest!.recovery_sec;
  assert.equal(shape(compile(w), w, b), `ready ${b.interval!.steps_sec!.map((x) => `timed_work:${x}`).join(` recovery:${E} `)}`);
});

test('Sweat ladder: rung × item, user-paced, targets from reps_scheme', () => {
  const { w, b } = find((w, b) => b.rest!.kind === 'self_paced');
  const st = stepsOf(compile(w), w, b);
  const sch = b.items[0].prescription.reps_scheme as number[];
  assert.equal(st.length, sch.length * b.items.length);
  assert.deepEqual(st.filter((s) => s.itemIndex === 0).map((s) => s.target!.reps), sch);
  assert.ok(st.every((s) => s.advance === 'user'));
});

/* ---------------------------------------------------------------- Athletic */

test('Athletic power: quality stop kept on the item, user-paced straight sets with row rest', () => {
  const { w, b } = find((w, b) => w.direction === 'athletic' && b.type === 'primary' && b.structure === 'straight');
  assert.ok(b.items[0].quality_stop);
  assert.ok(stepsOf(compile(w), w, b).every((s) => s.type === 'work' || (s.type === 'rest' && s.durationSec === b.items[0].prescription.rest_sec)));
});

test('Athletic contrast pair: heavy → 45 s transition → explosive → full recovery', () => {
  const { w, b } = find((w, b) => w.direction === 'athletic' && b.structure === 'superset' && b.type === 'primary');
  assert.equal(b.rest!.transition_sec, 45);
  const st = stepsOf(compile(w), w, b);
  assert.deepEqual(st.slice(0, 4).map((s) => s.type), ['work', 'transition', 'work', 'rest']);
  assert.equal(st[1].durationSec, 45);
  assert.equal(st[3].durationSec, b.rest!.seconds);
  assert.equal(st[3].rest!.fullRecovery, !!b.rest!.full_recovery);
  assert.ok(b.items[1].quality_stop);
});

test('Athletic Strength pair: 30–60 s transition, block pair rest', () => {
  const { w, b } = find((w, b) => w.direction === 'athletic' && b.structure === 'superset' && b.type === 'strength');
  const t = b.rest!.transition_sec!;
  assert.ok(t >= 30 && t <= 60);
  const st = stepsOf(compile(w), w, b);
  assert.equal(st[1].type, 'transition');
  assert.equal(st[1].durationSec, t);
});

test('Athletic sprint (distance) and Olympic derivative are user-paced sets', () => {
  const sprint = find((w, b) => w.direction === 'athletic' && b.items[0].prescription.kind === 'distance' && !!b.items[0].quality_stop);
  const s1 = stepsOf(compile(sprint.w), sprint.w, sprint.b)[0];
  assert.equal(s1.advance, 'user');
  assert.match(s1.target!.text, /m/);
  const oly = find((w, b) => w.direction === 'athletic' && /clean|snatch|jerk/i.test(b.items[0].exercise.name));
  assert.equal(stepsOf(compile(oly.w), oly.w, oly.b)[0].type, 'work');
});

test('Athletic warm-up list becomes one checklist; 30-minute Athletic has no invented cool-down', () => {
  const { w } = find((w) => w.direction === 'athletic' && !!w.warmup?.items?.length && !w.cooldown);
  const plan = compile(w);
  assert.equal(plan.steps[0].type, 'checklist');
  assert.equal(plan.sections[0].warmupItems.length, w.warmup!.items.length);
  assert.ok(!plan.sections.some((s) => s.kind === 'cooldown'));
});

test('target text helpers', () => {
  const it: any = { prescription: { kind: 'reps', reps: 1, per_side: false, direction_fields: {} } };
  assert.equal(targetFor(it, 1, null).text, '1 rep');
  it.prescription = { kind: 'calories', calories: 12, per_side: false };
  assert.equal(targetFor(it, 1, null).text, '12 cal');
  assert.equal(fmtClock(61000), '1:01');
  assert.equal(fmtClock(59001), '1:00');
});

test('the invariant checker catches duplicate rest, wrong rest source, missing transition and trailing rest', () => {
  const { w, b } = find((w, b) => w.direction === 'strength' && b.structure === 'superset');
  const good = compile(w);
  assert.deepEqual(checkPlan(w, good), []);
  const mutate = (f: (p: SessionPlan) => void) => {
    const p: SessionPlan = JSON.parse(JSON.stringify(good));
    f(p);
    p.steps.forEach((s, i) => (s.index = i));
    return checkPlan(w, p);
  };
  const st = stepsOf(good, w, b);
  const restIdx = st.find((s) => s.type === 'rest')!.index;
  const transIdx = st.find((s) => s.type === 'transition')!.index;
  assert.ok(mutate((p) => p.steps.splice(restIdx, 0, { ...p.steps[restIdx], id: 'dup' })).some((e) => /consecutive/.test(e)));
  assert.ok(mutate((p) => (p.steps[restIdx].durationSec = 999)).some((e) => /!= block seconds/.test(e)));
  assert.ok(mutate((p) => p.steps.splice(transIdx, 1)).some((e) => /transitions/.test(e)));
  assert.ok(mutate((p) => (p.steps[restIdx].rest!.source = 'set')).some((e) => /row rest/.test(e)));
  const lastWork = st[st.length - 1].index;
  assert.ok(mutate((p) => p.steps.splice(lastWork + 1, 0, { ...p.steps[restIdx], id: 'trail' })).some((e) => /end of a block|round rests/.test(e)));
});
