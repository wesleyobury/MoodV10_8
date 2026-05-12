/**
 * Unit tests for the in-session progress-bar pure helpers.
 *
 * Run:
 *   cd /app/frontend && node --import tsx --test utils/inSessionProgress.test.ts
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { getDescriptionSnippet, getEquipmentIcon } from './inSessionProgress';

test('getDescriptionSnippet — empty / undefined input returns empty string', () => {
  assert.equal(getDescriptionSnippet(undefined), '');
  assert.equal(getDescriptionSnippet(''), '');
  assert.equal(getDescriptionSnippet('   '), '');
});

test('getDescriptionSnippet — returns first two sentences when multiple present', () => {
  const desc =
    'AMRAP 15 minutes. This builds power and conditioning. A third sentence we do not want.';
  assert.equal(
    getDescriptionSnippet(desc),
    'AMRAP 15 minutes. This builds power and conditioning.'
  );
});

test('getDescriptionSnippet — single sentence is returned intact', () => {
  const desc = 'A single descriptive sentence about the move.';
  assert.equal(getDescriptionSnippet(desc), desc);
});

test('getDescriptionSnippet — truncates and ellipsises when no terminator', () => {
  const desc =
    'this is a long block of text without any terminator that should be truncated when it exceeds the soft limit configured in the helper because we never want the bar to render an essay';
  const snippet = getDescriptionSnippet(desc);
  assert.ok(snippet.endsWith('…'));
  assert.ok(snippet.length <= 140);
});

test('getDescriptionSnippet — collapses whitespace and newlines', () => {
  const desc = 'First sentence.\n   Second\tsentence.   Third sentence.';
  assert.equal(getDescriptionSnippet(desc), 'First sentence. Second sentence.');
});

test('getEquipmentIcon — exact match wins', () => {
  assert.equal(getEquipmentIcon('Kettlebells'), 'fitness');
  assert.equal(getEquipmentIcon('Dumbbells'), 'barbell');
  assert.equal(getEquipmentIcon('Battle Ropes'), 'git-network');
});

test('getEquipmentIcon — fuzzy contains-match falls through', () => {
  assert.equal(getEquipmentIcon('Single Kettlebell Snatch'), 'fitness');
  assert.equal(getEquipmentIcon('Heavy Sled Push'), 'car');
});

test('getEquipmentIcon — unknown / empty returns generic fitness', () => {
  assert.equal(getEquipmentIcon(undefined), 'fitness');
  assert.equal(getEquipmentIcon(''), 'fitness');
  assert.equal(getEquipmentIcon('Some Mystery Tool'), 'fitness');
});
