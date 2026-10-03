/**
 * Built for Today, progressive reveal (Oct 2026). Pure helpers for components/v3/BftLiveText.
 *
 * The server only ever hands over validated, complete sentences; these helpers decide how fast they appear. Text is revealed
 * at a quick reading pace (not a novelty typewriter): a steady base rate that speeds up when a whole new sentence lands, so the
 * reveal never falls far behind what has arrived. The visible edge snaps to word boundaries so words never appear letter by
 * letter at a line end (no reflow jitter).
 */

/** Characters per second at the base pace (about 9 words a second (Oct 2026: slowed slightly after on-device review)). */
export const REVEAL_CPS = 50;
/** Extra speed per character of backlog, and the ceiling. */
export const CATCHUP_PER_CHAR = 0.6;
export const MAX_CPS = 130;
/** How long the Cart waits for the first sentence before showing the fallback copy (the server gives up at ~7 s). */
export const FIRST_SENTENCE_DEADLINE_MS = 9000;
/** Hard stop for polling (whatever is settled by then is final). */
export const SETTLE_DEADLINE_MS = 14000;
export const POLL_MS = 200;

/** Advance the revealed character count by `dtMs` toward `targetLen`. */
export function revealStep(count: number, targetLen: number, dtMs: number): number {
  if (count >= targetLen) return targetLen;
  const backlog = targetLen - count;
  const cps = Math.min(MAX_CPS, REVEAL_CPS + backlog * CATCHUP_PER_CHAR);
  return Math.min(targetLen, count + (cps * Math.max(0, dtMs)) / 1000);
}

/** Index up to which `target` is shown for a revealed count: the end of the last whole word (or everything when done). */
export function visibleEnd(target: string, count: number): number {
  const n = Math.floor(count);
  if (n >= target.length) return target.length;
  if (n <= 0) return 0;
  const cut = target.lastIndexOf(' ', n);
  return cut <= 0 ? 0 : cut;
}

/** New server text may only extend what is already on screen; anything else (never expected) restarts the reveal cleanly. */
export function extendsShown(shown: string, next: string): boolean {
  return next.startsWith(shown);
}
