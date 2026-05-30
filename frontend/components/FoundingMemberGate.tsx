/**
 * FoundingMemberGate — subscription-status sync (MOOD V2).
 *
 * V2 SEMANTIC SHIFT: founding membership NO LONGER grants free access and the
 * V1 "free for life" celebration modal has been removed. Entitlement is now
 * server-authoritative (`/api/me/entitlement`, consumed by SubscriptionContext).
 *
 * This component's remaining job is a thin offline-cache sync: mirror the
 * persisted `subscription_status` from `/auth/me` into SubscriptionContext's
 * local `status` so the offline fallback stays reasonable. The V2 founding
 * OFFER is handled by <FoundingOfferModal /> + <FoundingBanner />.
 */
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';

export function FoundingMemberGate() {
  const { user } = useAuth();
  const { status, setStatus } = useSubscription();

  useEffect(() => {
    const remote = user?.subscription_status;
    if (!remote) return;
    if (remote === status) return;
    if (remote === 'active' || remote === 'in_trial' || remote === 'lapsed') {
      setStatus(remote);
    }
  }, [user?.subscription_status, status, setStatus]);

  return null;
}

export default FoundingMemberGate;
