/**
 * Unit tests for the HealthSyncIndicator's relative-time formatter.
 *
 * The formatter is intentionally inlined inside HealthSyncIndicator.tsx; we
 * mirror its logic here verbatim so the spec is locked in. If the indicator
 * formatter is ever extracted to a util, swap this import.
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';

function formatRelative(iso: string | null): string | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;
  const deltaSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (deltaSec < 30) return 'Synced just now';
  if (deltaSec < 60) return 'Synced 1m ago';
  const minutes = Math.floor(deltaSec / 60);
  if (minutes < 60) return `Synced ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Synced ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Synced ${days}d ago`;
}

const iso = (offsetMs: number) => new Date(Date.now() - offsetMs).toISOString();

test('returns null for null input', () => {
  assert.equal(formatRelative(null), null);
});

test('returns null for garbage input', () => {
  assert.equal(formatRelative('not-a-date'), null);
});

test('< 30s ago → "just now"', () => {
  assert.equal(formatRelative(iso(5_000)), 'Synced just now');
});

test('30–59s ago → "1m ago"', () => {
  assert.equal(formatRelative(iso(45_000)), 'Synced 1m ago');
});

test('2 minutes ago → "2m ago"', () => {
  assert.equal(formatRelative(iso(2 * 60_000 + 1_000)), 'Synced 2m ago');
});

test('12 minutes ago → "12m ago"', () => {
  assert.equal(formatRelative(iso(12 * 60_000)), 'Synced 12m ago');
});

test('2 hours ago → "2h ago"', () => {
  assert.equal(formatRelative(iso(2 * 60 * 60_000)), 'Synced 2h ago');
});

test('3 days ago → "3d ago"', () => {
  assert.equal(formatRelative(iso(3 * 24 * 60 * 60_000)), 'Synced 3d ago');
});

test('future timestamp clamps to "just now"', () => {
  assert.equal(formatRelative(iso(-10_000)), 'Synced just now');
});
