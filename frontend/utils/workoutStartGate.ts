import { Alert } from 'react-native';
import { Analytics } from './analytics';
import { apiFetch } from './api';
import type { PaywallTrigger } from '../contexts/SubscriptionContext';

const HARD_PAYWALL_TRIGGER: PaywallTrigger = 'start_workout_after_free_session';

/**
 * Spec §3 Stage 3 — Hard Paywall. Returns true when the user may begin a
 * live workout session; otherwise opens the paywall and returns false.
 */
function openHardPaywall(
  openPaywall: (trigger?: PaywallTrigger) => void,
  token: string | null,
) {
  Analytics.startWorkoutTapped(token, {
    allowed: false,
    trigger_source: HARD_PAYWALL_TRIGGER,
  });
  openPaywall(HARD_PAYWALL_TRIGGER);
}

export async function tryBeginWorkoutSession(
  canStartWorkout: boolean,
  openPaywall: (trigger?: PaywallTrigger) => void,
  token: string | null,
): Promise<boolean> {
  if (!token) {
    if (!canStartWorkout) {
      openHardPaywall(openPaywall, token);
      return false;
    }
    return true;
  }

  // Server-side gate is the source of truth for returning users and second
  // workout attempts. Local state is only a fallback for signed-out/dev flows;
  // using it first can trap a newly-subscribed user behind stale Paywall #3.
  const res = await apiFetch<{ can_start: boolean }>('/api/workouts/start', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.ok && res.data?.can_start !== false) return true;

  if (res.status === 402) {
    console.warn('[Paywall] /api/workouts/start blocked', res.error);
    openHardPaywall(openPaywall, token);
    return false;
  }

  Alert.alert(
    'Couldn’t verify access',
    'Please check your connection and try again.',
  );
  return false;
}
