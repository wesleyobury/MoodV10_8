/**
 * Plain English first (founder edit pass). The corpus is every jargon-bearing Built for Today line, load guidance, quality
 * stop, block instruction and prescription the frozen engines produced across all Directions, archetypes, States and
 * experience levels (utils/dev/v3ExplainCorpus.json, generated from the real engines).
 * Run: node --import tsx --test utils/v3PlainLanguage.test.ts   (or yarn test:v3-plain)
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  JARGON_OUTSIDE_PARENS,
  TRAINING_TERMS,
  effortFromRpe,
  plain,
  plainEffortFromPrescription,
  plainEffortLabel,
  stripParens,
  termsIn,
} from './v3PlainLanguage';

const CORPUS: string[] = JSON.parse(readFileSync(join(__dirname, 'dev', 'v3ExplainCorpus.json'), 'utf8'));

test('no unexplained jargon survives anywhere in the real engine copy', () => {
  assert.ok(CORPUS.length > 300);
  const left = CORPUS.map(plain).filter((p) => JARGON_OUTSIDE_PARENS.test(stripParens(p)));
  assert.deepEqual(left, []);
});

test('plain never drops exercise names or numbers', () => {
  for (const line of CORPUS) {
    const out = plain(line);
    for (const n of line.match(/\d+(?:\.\d+)?/g) ?? []) {
      // RPE numbers become words by design; every other number stays.
      if (new RegExp(`RPE[^.;]*\\b${n}\\b`).test(line)) continue;
      assert.ok(out.includes(n), `${n} lost in: ${line}`);
    }
  }
});

test('plain is idempotent', () => {
  for (const line of CORPUS.slice(0, 120)) assert.equal(plain(plain(line)), plain(line));
});

test('founder examples', () => {
  assert.equal(effortFromRpe(7, 8), 'hard');
  assert.equal(effortFromRpe(4, 6), 'easy to moderate');
  assert.equal(plainEffortLabel('RPE 7–8'), 'Hard effort');
  assert.equal(plainEffortFromPrescription(3, null)?.text, 'Stop with about 3 reps left in the tank');
  assert.equal(plain('Target effort for the main block is RPE 4–5.'), 'The main block should feel easy to moderate.');
  assert.match(plain("You're amped today, so we're putting that readiness into a heavy top set and back-off sets."), /one heavy set, then a few lighter ones \(a top set and back-off sets\)/);
});

test('terms are detected on the original text and every detected term has a definition', () => {
  assert.deepEqual(termsIn('EMOM for 20 min', 'a heavy top set and back-off sets'), ['top_set', 'back_off', 'emom']);
  for (const line of CORPUS) for (const t of termsIn(line)) assert.ok(TRAINING_TERMS[t].definition.length > 20);
});
