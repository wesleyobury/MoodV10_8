/**
 * MOOD V3 Guided Session: completion delivery.
 *
 * Finish writes the completion intent into the session record (status `completing`) BEFORE any request, so a crash,
 * a dead network or a killed app can never lose it. syncCompletion() then sends it; the server is idempotent (a repeat
 * returns `already_completed`), so retries are always safe. Triggers: the Finish tap, app foreground, Home focus, and a
 * controlled backoff while the completion screen is open (record.ts RETRY_DELAYS_MS). One request in flight per user.
 */
import type { V3CompletionResult } from '../v3Api';
import { SessionRecord, afterFailure, shouldRetry } from './record';

export interface SyncDeps {
  update: (uid: string, fn: (r: SessionRecord | null) => SessionRecord | null) => Promise<SessionRecord | null>;
  send: (
    token: string,
    workoutId: string,
    body: any,
  ) => Promise<{ ok: true; result: V3CompletionResult } | { ok: false; retryable: boolean; status: number; message: string }>;
  now: () => number;
}

export type SyncOutcome =
  | { kind: 'skipped' }
  | { kind: 'synced'; record: SessionRecord; result: V3CompletionResult }
  | { kind: 'failed'; record: SessionRecord | null; retryable: boolean };

const inFlight = new Map<string, Promise<SyncOutcome>>();

export function syncCompletion(uid: string, token: string, trigger: 'timer' | 'foreground' | 'home' | 'screen', deps: SyncDeps): Promise<SyncOutcome> {
  const running = inFlight.get(uid);
  if (running) return running;
  const job = (async (): Promise<SyncOutcome> => {
    let target: SessionRecord | null = null;
    await deps.update(uid, (r) => {
      if (shouldRetry(r, deps.now(), trigger)) target = r;
      return r;
    });
    if (!target) return { kind: 'skipped' };
    const rec: SessionRecord = target;
    const res = await deps.send(token, rec.workoutId, rec.completion!.payload);
    if (res.ok) {
      const r = res.result;
      const saved = await deps.update(uid, (cur) => {
        if (!cur || cur.sessionId !== rec.sessionId || !cur.completion) return cur;
        return {
          ...cur,
          status: 'completed',
          completion: {
            ...cur.completion,
            attempts: cur.completion.attempts + 1,
            lastAttemptAt: deps.now(),
            lastError: null,
            serverCompletedAt: r.completed_at ?? new Date(deps.now()).toISOString(),
            alreadyCompleted: r.status === 'already_completed',
            streak: r.streak ?? null,
            access: r.access
              ? { entitled: r.access.has_full_access, free_used_this_week: r.access.consumed_free_workout || r.access.free_workouts_remaining === 0, free_remaining: r.access.free_workouts_remaining }
              : null,
          },
        };
      });
      return { kind: 'synced', record: saved ?? rec, result: r };
    }
    const saved = await deps.update(uid, (cur) => {
      if (!cur || cur.sessionId !== rec.sessionId || !cur.completion || cur.status !== 'completing') return cur;
      return { ...cur, completion: afterFailure(cur.completion, deps.now(), res.message, !res.retryable) };
    });
    return { kind: 'failed', record: saved, retryable: res.retryable };
  })();
  inFlight.set(uid, job);
  return job.finally(() => inFlight.delete(uid));
}
