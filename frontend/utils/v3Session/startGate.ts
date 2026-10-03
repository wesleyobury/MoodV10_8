/**
 * V3 workout START gate (client). Rules: utils/v3Session/access.ts. Server: POST /api/workouts/start.
 *
 * Call it on an explicit Start of a specific workout. It returns true when the workout may start; otherwise it has
 * already opened the paywall (trigger start_workout_after_free_session) and returns false.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { currentFreePeriodKey, useSubscription } from '../../contexts/SubscriptionContext';
import type { PaywallTrigger } from '../../contexts/SubscriptionContext';
import { tryBeginWorkoutSession } from '../workoutStartGate';
import { localStartAllowed, v3StartKey } from './access';

// This week's free workout as last seen on this device: "<ISO week>|v3:<workout_id>". A key from an earlier week is stale.
const KEY = (uid: string) => `@mood_week_free_workout_v1:${uid}`;

export async function readLocalFirstWorkoutKey(uid: string): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY(uid));
    if (!raw) return null;
    const [period, key] = raw.split('|');
    return period === currentFreePeriodKey() && key ? key : null;
  } catch {
    return null;
  }
}

async function rememberFirstWorkoutKey(uid: string, key: string): Promise<void> {
  try { await AsyncStorage.setItem(KEY(uid), `${currentFreePeriodKey()}|${key}`); } catch { /* ignore */ }
}

export interface V3StartGateInput {
  uid: string;
  token: string | null;
  workoutId: string;
  entitled: boolean;
  /** Last entitlement read says the free first workout is already claimed. */
  serverClaimed: boolean;
  openPaywall: (trigger?: PaywallTrigger) => void;
}

export async function gateV3WorkoutStart(input: V3StartGateInput): Promise<boolean> {
  const key = v3StartKey(input.workoutId);
  const claimedKey = await readLocalFirstWorkoutKey(input.uid);
  const localOk = localStartAllowed({ entitled: input.entitled, serverClaimed: input.serverClaimed, claimedKey, key });
  const ok = await tryBeginWorkoutSession(localOk, input.openPaywall, input.token, { workoutId: input.workoutId, source: 'v3' });
  // Mirror the server claim locally (used only when a later check cannot reach the server). Entitled starts are claimed
  // server-side too, but a subscriber never needs the offline fallback.
  if (ok && !input.entitled && claimedKey !== key) await rememberFirstWorkoutKey(input.uid, key);
  return ok;
}

/**
 * Hook form for screens: `const gate = useV3StartGate(); if (!(await gate(workoutId))) return;`
 * Reads entitlement through refs, so a callback captured early still sees a purchase made a moment ago.
 */
export function useV3StartGate(): (workoutId: string) => Promise<boolean> {
  const { user, token, entitlement, refreshEntitlement } = useAuth();
  const { hasActiveAccess, openPaywall } = useSubscription();
  const live = useRef({ user, token, entitlement, refreshEntitlement, hasActiveAccess, openPaywall });
  live.current = { user, token, entitlement, refreshEntitlement, hasActiveAccess, openPaywall };
  return useCallback(async (workoutId: string) => {
    const l = live.current;
    if (!l.user?.id) return true; // guests never reach V3 (it needs an account); nothing to gate
    const serverClaimed = !l.hasActiveAccess && (l.entitlement?.first_workout_claimed === true || l.entitlement?.free_workouts_remaining === 0);
    const ok = await gateV3WorkoutStart({
      uid: l.user.id, token: l.token, workoutId, entitled: l.hasActiveAccess, serverClaimed, openPaywall: l.openPaywall,
    });
    // keep "free workouts remaining" in sync after this week's claim
    if (ok && !l.hasActiveAccess && !serverClaimed) l.refreshEntitlement().catch(() => undefined);
    return ok;
  }, []);
}
