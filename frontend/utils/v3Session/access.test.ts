/**
 * First workout free, paywall on STARTING workout #2: the offline fallback and the post-completion switch.
 * Run: node --import tsx --test utils/v3Session/access.test.ts
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { POST_COMPLETION_PAYWALL, localStartAllowed, postCompletionAction, v3StartKey } from './access';

test('entitled users always start, even offline', () => {
  assert.equal(localStartAllowed({ entitled: true, serverClaimed: true, claimedKey: 'v3:a', key: 'v3:b' }), true);
});

test('a fresh account may start its first workout offline', () => {
  assert.equal(localStartAllowed({ entitled: false, serverClaimed: false, claimedKey: null, key: v3StartKey('a') }), true);
});

test('the claimed first workout can be reopened offline; a different one cannot', () => {
  assert.equal(localStartAllowed({ entitled: false, serverClaimed: true, claimedKey: 'v3:a', key: 'v3:a' }), true);
  assert.equal(localStartAllowed({ entitled: false, serverClaimed: true, claimedKey: 'v3:a', key: 'v3:b' }), false);
});

test('server says claimed but this device never saw the claim (reinstall): fail closed offline', () => {
  assert.equal(localStartAllowed({ entitled: false, serverClaimed: true, claimedKey: null, key: 'v3:b' }), false);
});

test('no paywall after completing the free workout: it lives on the next Start', () => {
  assert.equal(POST_COMPLETION_PAYWALL, 'none');
  assert.equal(postCompletionAction({ entitled: false, free_used_this_week: true, free_remaining: 0 }), 'none');
});
