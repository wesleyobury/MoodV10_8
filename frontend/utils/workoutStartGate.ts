import { Alert } from 'react-native';
import { Analytics } from './analytics';
import { apiFetch } from './api';
import type { PaywallTrigger } from '../contexts/SubscriptionContext';

const HARD_PAYWALL_TRIGGER: PaywallTrigger = 'start_workout_after_free_session';

/**
 * How long a successful entitlement check stays valid.
 *
 * V2.1 — WHY THIS EXISTS. This gate is called on every "Start" tap AND every
 * "Completed Workout" tap (app/workout-guidance.tsx, two call sites), so a
 * four-exercise session used to require EIGHT successful network round-trips,
 * each with a 12s timeout and no retry (POST ⇒ maxRetries 0). Any single
 * failure stalled the user mid-workout. Entitlement cannot meaningfully change
 * during one session, so we check once and reuse the answer.
 */
const GRANT_TTL_MS = 30 * 60 * 1000;

let grantedUntil = 0;
let grantedForToken: string | null = null;

/** Called after a workout completes, so the next session re-checks the server. */
export function clearWorkoutStartGrant(): void {
  grantedUntil = 0;
  grantedForToken = null;
}

function hasValidGrant(token: string | null): boolean {
  return grantedForToken === token && Date.now() < grantedUntil;
}

function recordGrant(token: string | null): void {
  grantedForToken = token;
  grantedUntil = Date.now() + GRANT_TTL_MS;
}

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

  // Already verified for this session — don't re-hit the network mid-workout.
  if (hasValidGrant(token)) return true;

  // Server-side gate is the source of truth for returning users and second
  // workout attempts. Local state is only a fallback for signed-out/dev flows;
  // using it first can trap a newly-subscribed user behind stale Paywall #3.
  const res = await apiFetch<{ can_start: boolean }>('/api/workouts/start', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.ok && res.data?.can_start !== false) {
    recordGrant(token);
    return true;
  }

  // A real 402 is the paywall doing its job — the only case where blocking is
  // the correct outcome.
  if (res.status === 402) {
    console.warn('[Paywall] /api/workouts/start blocked', res.error);
    clearWorkoutStartGrant();
    openHardPaywall(openPaywall, token);
    return false;
  }

  // ── Everything below is a FAILURE, not a paywall ──────────────────────
  //
  // V2.1 — this used to unconditionally alert and return false. That made a
  // backend blip, a 12s timeout, or bad gym wifi indistinguishable from "you
  // must pay", and it hit PAYING SUBSCRIBERS too: offline, in a basement, or on
  // congested wifi, MOOD simply refused to start a workout. It also emitted no
  // analytics whatsoever, so the failure rate was unknowable.
  //
  // We now fail OPEN, deferring to the local entitlement mirror
  // (`canStartWorkout`, which already reflects subscription state and the
  // week-scoped free allowance). Consequences of each direction:
  //   - fail closed: a subscriber who paid cannot use the core feature. Worst
  //     possible outcome, and invisible.
  //   - fail open: at most, a free user who already spent this week's session
  //     gets one extra while offline. Their completion log won't reach the
  //     server either, so it isn't even durable.
  // The local mirror still blocks a free user who has genuinely used their
  // allowance, so this is not an open door.
  const isNetwork = (res as any).isNetworkError === true || res.status === 0;
  const reason: 'network' | 'server_error' | 'unexpected' = isNetwork
    ? 'network'
    : res.status >= 500
    ? 'server_error'
    : 'unexpected';

  if (canStartWorkout) {
    Analytics.workoutStartGateFailed(token, {
      reason,
      outcome: 'allowed_offline',
      status: res.status,
    });
    console.warn(
      `[Gate] entitlement check failed (${reason}, status ${res.status}) — ` +
        'allowing start from local entitlement mirror',
    );
    // Deliberately NOT cached: this was never verified, so the next session
    // should try the server again rather than inheriting an unverified pass.
    return true;
  }

  // Local mirror also says no. Now the paywall is the honest explanation.
  Analytics.workoutStartGateFailed(token, {
    reason,
    outcome: 'blocked',
    status: res.status,
  });

  if (isNetwork) {
    Alert.alert(
      'You’re offline',
      'We couldn’t reach MOOD to check your subscription, and your free session for this week is already used. Reconnect and try again.',
    );
    return false;
  }

  openHardPaywall(openPaywall, token);
  return false;
}
