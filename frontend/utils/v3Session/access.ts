/**
 * MOOD V3 Guided Session: access / paywall rules.
 *
 * Business rule (Oct 2026): ONE free workout per ISO week (Monday 00:00 UTC reset) for users without full access
 * (subscription, trial, comp or admin; backend/entitlement.py), and it is fully usable. STARTING a second, different
 * workout in the same week opens the paywall. For a new user: workout #1 is free, the paywall comes when they start
 * workout #2. Enforced on the server at POST /api/workouts/start with {workout_id, source: 'v3'} (backend/start_gate.py),
 * which claims the week's free workout on the user document, so reinstalling or logging in again does not reset it.
 *
 * What is a start: the Cart's Start Workout tap (and a fresh session opened any other way, e.g. replacing an active one).
 * Not a start: generating, previewing, swapping, opening the Cart, browsing, resuming / relaunching an active or finished
 * session, reopening the same workout. The server is idempotent per workout id, so a re-start of the week's free
 * workout is always allowed; a different workout within 15 minutes of an un-completed start moves the claim
 * (wrong-workout grace), after that it counts as the second workout.
 *
 * The client gate lives in utils/v3Session/startGate.ts (React Native side). This file stays pure (node tests).
 * After completion there is still no paywall (POST_COMPLETION_PAYWALL = 'none'): the athlete finishes the free workout,
 * sees the celebration and goes Home. The paywall appears when they tap Start on the next one that week.
 */

/**
 * Offline / server-unreachable fallback. The server decides whenever it answers; this only decides whether a failed
 * check may fail open. `claimedKey` is this week's locally remembered free workout ("v3:<id>"), `serverClaimed` the last
 * entitlement read (first_workout_claimed / free_workouts_remaining === 0).
 */
export function localStartAllowed(input: { entitled: boolean; serverClaimed: boolean; claimedKey: string | null; key: string }): boolean {
  if (input.entitled) return true;
  if (input.claimedKey) return input.claimedKey === input.key;
  return !input.serverClaimed;
}

export const v3StartKey = (workoutId: string) => `v3:${workoutId}`;

export type PostCompletionPlacement = 'none' | 'after_celebration' | 'after_done' | 'next_build' | 'next_start';

/** The one switch for a post-completion paywall. 'none': the paywall is at the START of workout #2 instead (startGate.ts). */
export const POST_COMPLETION_PAYWALL: PostCompletionPlacement = 'none';

export interface AccessAfterCompletion {
  entitled: boolean;
  free_used_this_week: boolean;
  free_remaining: number | null;
}

export type PostCompletionAction = 'none' | 'overlay_after_saved' | 'on_done';

export function postCompletionAction(access: AccessAfterCompletion | null, placement: PostCompletionPlacement = POST_COMPLETION_PAYWALL): PostCompletionAction {
  if (!access || access.entitled || placement === 'none') return 'none';
  if ((access.free_remaining ?? 0) > 0) return 'none';
  if (placement === 'after_celebration') return 'overlay_after_saved';
  if (placement === 'after_done') return 'on_done';
  return 'none'; // next_build / next_start are enforced where the athlete builds or starts
}

/** Message on the session screen when a fresh session is blocked (the paywall opens on top of it). */
export const START_BLOCKED_MESSAGE = "This week's free workout is done. Unlock MOOD to start this one.";
