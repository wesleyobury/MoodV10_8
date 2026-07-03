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
  if (!canStartWorkout) {
    openHardPaywall(openPaywall, token);
    return false;
  }

  // Server-side gate is the source of truth for returning users and second
  // workout attempts. Local state is only a fast pre-check.
  if (!token) return true;

  const res = await apiFetch<{ can_start: boolean }>('/api/workouts/start', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.ok && res.data?.can_start !== false) return true;

  if (res.status === 402) {
    openHardPaywall(openPaywall, token);
  } else {
    Alert.alert(
      'Couldn’t verify access',
      'Please check your connection and try again.',
    );
  }
  return false;
}
