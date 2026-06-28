import type { Entitlement } from '../../contexts/AuthContext';
import type { SubscriptionStatus } from '../../contexts/SubscriptionContext';
import { mapServerStatusToLocal, type ServerSubscriptionStatus } from './mapSubscriptionStatus';

/**
 * Derive UI subscription status from server entitlement (single source of truth).
 * Never infer trial vs paid from date deltas — entitlement.reason + subscription_status
 * come from the backend / Apple receipt reconciliation.
 */
export function resolveSubscriptionStatus(
  entitlement: Entitlement | null,
  fallbackUserStatus?: ServerSubscriptionStatus,
): SubscriptionStatus {
  const serverStatus = entitlement?.subscription_status ?? fallbackUserStatus;

  if (entitlement?.has_full_access) {
    if (entitlement.reason === 'trial') return 'in_trial';
    if (entitlement.reason === 'subscription') {
      const mapped = mapServerStatusToLocal(serverStatus);
      if (mapped === 'in_trial' || mapped === 'active') return mapped;
      return 'active';
    }
    return 'active';
  }

  const mapped = mapServerStatusToLocal(serverStatus);
  return mapped ?? 'none';
}

/** Settings / paywall CTA copy — Apple decides trial eligibility at purchase time. */
export function getSubscribeCtaCopy(status: SubscriptionStatus): {
  title: string;
  subtitle: string;
} {
  if (status === 'lapsed') {
    return {
      title: 'Resubscribe to MOOD Premium',
      subtitle: 'Restore unlimited workouts and live HR tracking.',
    };
  }
  return {
    title: 'Subscribe to MOOD Premium',
    subtitle: 'Trial offers, if eligible, appear at App Store checkout.',
  };
}

export function getSubscriptionDisplayLabels(status: SubscriptionStatus): {
  title: string;
  subtitle: string;
} {
  switch (status) {
    case 'in_trial':
      return {
        title: 'Free trial active',
        subtitle: 'Renews to MOOD Premium after the trial.',
      };
    case 'active':
      return {
        title: 'MOOD Premium',
        subtitle: 'Renews automatically. Cancel anytime in the App Store.',
      };
    case 'lapsed':
      return {
        title: 'Subscription lapsed',
        subtitle: 'Resubscribe to keep training with Premium.',
      };
    case 'founding_member':
      return {
        title: 'Founding Member',
        subtitle: 'Day-one MOOD. Lifetime access.',
      };
    default:
      return {
        title: 'Not subscribed',
        subtitle: 'Subscribe to unlock Premium workouts and live HR.',
      };
  }
}

/** Refresh user profile + entitlement in parallel after IAP events. */
export async function refreshSubscriptionFromServer(
  refreshUser: () => Promise<void>,
  refreshEntitlement: () => Promise<void>,
): Promise<void> {
  await Promise.all([refreshUser(), refreshEntitlement()]);
}
