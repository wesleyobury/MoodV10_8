import assert from 'node:assert/strict';
import test from 'node:test';
import { revealStep, visibleEnd, extendsShown, REVEAL_CPS, MAX_CPS } from './v3BftReveal';

test('reveal advances at the base pace and catches up on a large backlog', () => {
  const near = revealStep(100, 110, 1000);
  assert.equal(near, 110);
  const steady = revealStep(0, 20, 100);
  assert.ok(steady > 0 && steady <= 20);
  const slow = revealStep(0, 400, 100) - 0;
  assert.ok(slow <= (MAX_CPS * 100) / 1000 + 1e-9 && slow > (REVEAL_CPS * 100) / 1000);
  assert.equal(revealStep(50, 40, 16), 40);
});

test('a typical 2-3 sentence message reveals in roughly two to four seconds', () => {
  const msg = 240; let c = 0; let t = 0;
  while (c < msg) { c = revealStep(c, msg, 16); t += 16; }
  assert.ok(t > 1500 && t < 4500, String(t));
});

test('the visible edge snaps to whole words', () => {
  const s = 'You have extra juice today, so accessories run closer.';
  assert.equal(visibleEnd(s, 0), 0);
  assert.equal(s.slice(0, visibleEnd(s, 6)), 'You');
  assert.equal(s.slice(0, visibleEnd(s, 9)), 'You have');
  assert.equal(visibleEnd(s, s.length + 3), s.length);
});

test('server text only ever extends what is shown', () => {
  assert.ok(extendsShown('One.', 'One. Two.'));
  assert.ok(!extendsShown('One.', 'Uno.'));
});
