/**
 * MOOD V3 Guided Session analytics: the lean event set (no per-set events).
 *
 *   v3_workout_started      a new session began               direction, archetype, est minutes, work steps
 *   v3_session_resumed      restored after relaunch / Home     from, gap_sec, exact
 *   v3_block_completed      the athlete left a block          block, structure, actual_sec, done / skipped, rests skipped, time added
 *   v3_step_skipped         skip exercise / skip block (not rest skips; those roll up into v3_block_completed)
 *   v3_workout_ended_early  End workout                       block, done / total, elapsed
 *   v3_workout_abandoned    a 12 h idle session expired
 *   v3_workout_completed    explicit Finish                   elapsed, done / total, sync online / queued
 *   v3_completion_failed    a completion request failed       status, retryable, attempts
 *   v3_session_mode         Guided ↔ Overview switch          mode
 *   v3_overview_jump        navigation from the Overview sheet from, to (step indices)
 *   v3_workout_shared       a share card went out             via: instagram | share_sheet
 *
 * The canonical `workout_completed` (streaks, achievements, stats) is emitted by the server on completion, so opting out of
 * client analytics never breaks a streak. `workout_started` is kept for the existing activation funnel.
 */
import { trackEvent } from '../analytics';

export type SessionEvent =
  | 'v3_workout_started'
  | 'v3_session_resumed'
  | 'v3_block_completed'
  | 'v3_step_skipped'
  | 'v3_workout_ended_early'
  | 'v3_workout_abandoned'
  | 'v3_workout_completed'
  | 'v3_completion_failed'
  | 'v3_session_mode'
  | 'v3_overview_jump'
  | 'v3_workout_shared'
  | 'workout_started';

export function trackSession(token: string | null | undefined, name: SessionEvent, meta: Record<string, any>): void {
  if (!token) return;
  try {
    Promise.resolve(trackEvent(token, name, { surface: 'guided_session', ...meta })).catch(() => undefined);
  } catch { /* analytics never breaks the workout */ }
}
