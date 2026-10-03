/**
 * Onboarding personalization is derived, deterministic and complete for every answer combination.
 * Run: node --import tsx --test utils/v3ProfileCopy.test.ts
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  BARRIER_REACTIONS, EXPERIENCE_REACTIONS, FREQUENCY_REACTIONS, GOAL_REACTIONS, PREFERENCE_REACTIONS,
  adaptationsFor, archetypeName, possessiveName, profileConclusions, profileIdentity, profileProgress, profileProgressLabel, radarValues,
} from './v3ProfileCopy';
import {
  BARRIER_OPTIONS, EXPERIENCE_DETAIL_OPTIONS, FREQUENCY_OPTIONS, GOAL_OPTIONS, PREFERENCE_OPTIONS, TrainingProfile,
  detailFromExperience, experienceFromDetail,
} from './v3ProfileOptions';

const ALL: { p: TrainingProfile; d: (typeof EXPERIENCE_DETAIL_OPTIONS)[number]['id'] }[] = [];
for (const pr of PREFERENCE_OPTIONS) for (const g of GOAL_OPTIONS) for (const e of EXPERIENCE_DETAIL_OPTIONS) for (const f of FREQUENCY_OPTIONS) for (const b of BARRIER_OPTIONS)
  ALL.push({ p: { training_preference: pr.id, goal: g.id, experience: e.experience, training_frequency: f.id, biggest_barrier: b.id }, d: e.id });

test('every option has a reaction with a tag and a line', () => {
  for (const o of PREFERENCE_OPTIONS) assert.ok(PREFERENCE_REACTIONS[o.id].tag && PREFERENCE_REACTIONS[o.id].text);
  for (const o of GOAL_OPTIONS) assert.ok(GOAL_REACTIONS[o.id].text);
  for (const o of EXPERIENCE_DETAIL_OPTIONS) assert.ok(EXPERIENCE_REACTIONS[o.id].text);
  for (const o of FREQUENCY_OPTIONS) assert.ok(FREQUENCY_REACTIONS[o.id].text);
  for (const o of BARRIER_OPTIONS) assert.ok(BARRIER_REACTIONS[o.id].text);
});

test('experience rungs map onto the three server levels', () => {
  assert.equal(experienceFromDetail('getting_started'), 'beginner');
  assert.equal(experienceFromDetail('basics'), 'intermediate');
  assert.equal(experienceFromDetail('consistent'), 'advanced');
  assert.equal(experienceFromDetail('serious'), 'advanced');
  assert.equal(detailFromExperience('advanced'), 'serious');
  assert.equal(detailFromExperience('intermediate'), 'basics');
});

test('the construction screen locks in five real settings for every profile', () => {
  for (const { p, d } of ALL) {
    const c = profileConclusions(p, d);
    assert.equal(c.length, 5);
    assert.deepEqual(c.map((x) => x.id), ['direction', 'goal', 'experience', 'frequency', 'barrier']);
  }
  const c = profileConclusions({ training_preference: 'lifting', goal: 'build_strength', experience: 'advanced', training_frequency: '3-4', biggest_barrier: 'boredom' }, 'serious');
  assert.deepEqual(c.map((x) => x.label), ['Strength-first training', 'Heavy compound priority', 'Advanced exercise pool', '3–4 days a week · split rotation', 'Higher variety']);
});

test('identity is deterministic and complete', () => {
  for (const { p, d } of ALL) {
    const a = profileIdentity(p, { firstName: 'Wesley', detail: d });
    const b = profileIdentity(p, { firstName: 'Wesley', detail: d });
    assert.deepEqual(a, b);
    assert.ok(a.archetype.startsWith('The '));
    assert.equal(a.adaptations.length, 3);
    assert.equal(new Set(a.adaptations.map((x) => x.when)).size, 3);
    assert.equal(a.training.length, 4);
  }
});

test('the barrier leads "what MOOD will do differently"', () => {
  const base: TrainingProfile = { training_preference: 'lifting', goal: 'build_strength', experience: 'advanced', training_frequency: '3-4' };
  assert.equal(adaptationsFor({ ...base, biggest_barrier: 'low_energy' }, 'strength')[0].when, "When you're low on energy");
  assert.equal(adaptationsFor({ ...base, biggest_barrier: 'boredom' }, 'strength')[0].when, "When you're bored");
  assert.equal(adaptationsFor({ ...base, biggest_barrier: 'time' }, 'strength')[0].when, "When you're short on time");
});

test('archetype examples', () => {
  assert.equal(archetypeName({ training_preference: 'athletic', goal: 'build_strength' }), 'The Performance Builder');
  assert.equal(archetypeName({ training_preference: 'lifting', goal: 'build_strength' }), 'The Strength Builder');
  assert.equal(archetypeName({ training_preference: 'conditioning', goal: 'lose_weight_conditioning' }), 'The Engine Builder');
});

test('names, progress, radar', () => {
  assert.equal(possessiveName('Wesley'), 'WESLEY’S');
  assert.equal(possessiveName('James'), 'JAMES’');
  assert.equal(possessiveName(''), 'YOUR');
  assert.equal(profileProgress(0, false), 0);
  assert.equal(profileProgress(2, true), 60);
  assert.equal(profileProgress(4, true), 100);
  assert.equal(profileProgressLabel(60), 'Your profile is taking shape');
  for (const { p } of ALL) for (const v of radarValues(p)) assert.ok(v >= 0.08 && v <= 1);
});
