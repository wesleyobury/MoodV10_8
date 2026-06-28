import { Analytics } from './analytics';
import type { PaywallTrigger } from '../contexts/SubscriptionContext';

const HARD_PAYWALL_TRIGGER: PaywallTrigger = 'start_workout_after_free_session';

/**
 * Spec §3 Stage 3 — Hard Paywall. Returns true when the user may begin a
 * live workout session; otherwise opens the paywall and returns false.
 */
export function tryBeginWorkoutSession(
  canStartWorkout: boolean,
  openPaywall: (trigger?: PaywallTrigger) => void,
  token: string | null,
): boolean {
  if (canStartWorkout) return true;
  Analytics.startWorkoutTapped(token, {
    allowed: false,
    trigger_source: HARD_PAYWALL_TRIGGER,
  });
  openPaywall(HARD_PAYWALL_TRIGGER);
  return false;
}
