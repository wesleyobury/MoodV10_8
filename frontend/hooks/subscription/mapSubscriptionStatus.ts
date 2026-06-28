import type { SubscriptionStatus } from '../../contexts/SubscriptionContext';

export type ServerSubscriptionStatus = 'active' | 'in_trial' | 'lapsed' | 'none' | null | undefined;

export function mapServerStatusToLocal(status: ServerSubscriptionStatus): SubscriptionStatus | null {
  switch (status) {
    case 'active':
      return 'active';
    case 'in_trial':
      return 'in_trial';
    case 'lapsed':
      return 'lapsed';
    case 'none':
    case null:
    case undefined:
      return 'none';
    default:
      return null;
  }
}
