/**
 * V3ProfileGate — existing-user V3 re-onboarding.
 *
 * When an authenticated user lands on the main tabs without a completed V3
 * training profile, route them once per session to /onboarding-funnel/upgrade
 * ("MOOD got an upgrade"). There is no V2 -> V3 migration: V2 answers are
 * never mapped into the profile.
 *
 * Order of checks (cheapest first, fail open on any network problem):
 *   1. only on the (tabs) segment, signed-in non-guest users
 *   2. defer while the V2/V3 signup funnel or health onboarding is still owed,
 *      so a brand-new signup is never double-routed
 *   3. local V3 completion marker (@mood_v3_profile_done_v1:<uid>) -> done
 *   4. local funnel answers complete but never saved (save failed offline at
 *      the end of the funnel) -> retry the PUT; success -> done
 *   5. server GET /api/users/me/training-profile: complete -> cache marker, done;
 *      incomplete -> upgrade; request failed -> do nothing this session
 *
 * The V2 `completedAt` marker is deliberately NOT used as the signal: every
 * existing user has it, and it says nothing about a V3 profile.
 */
import { useEffect, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { readPersistedFunnelAnswers } from '../contexts/OnboardingFunnelContext';
import { isHealthOnboardingComplete } from '../utils/healthStorage';
import { shouldDeferAuxiliaryOnboardingGates } from '../utils/onboardingFunnelDefer';
import { trackEvent } from '../utils/analytics';
import {
  V3_ONBOARDING_ENABLED,
  TrainingProfile,
  fetchTrainingProfile,
  isProfileComplete,
  isV3ProfileDoneLocally,
  markV3ProfileDone,
  saveTrainingProfile,
} from '../utils/v3Profile';

export default function V3ProfileGate() {
  const { token, isGuest, isLoading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const checkedForRef = useRef<string | null>(null);
  const runningRef = useRef(false);

  useEffect(() => {
    if (!V3_ONBOARDING_ENABLED) return;
    if (isLoading || !token || isGuest || !user?.id) return;
    if (segments?.[0] !== '(tabs)') return;
    if (checkedForRef.current === user.id || runningRef.current) return;

    const uid = user.id;
    runningRef.current = true;
    (async () => {
      try {
        // A signup still owing the funnel / wearables step: other gates own it.
        if (await shouldDeferAuxiliaryOnboardingGates(uid)) return;
        if (!(await isHealthOnboardingComplete())) return;

        if (await isV3ProfileDoneLocally(uid)) {
          checkedForRef.current = uid;
          return;
        }

        // Retry a save that failed at the end of the funnel.
        const local = await readPersistedFunnelAnswers(uid);
        const pending: TrainingProfile = {
          training_preference: local.trainingPreference,
          goal: local.v3Goal,
          experience: local.experience,
          training_frequency: local.trainingFrequency,
          biggest_barrier: local.barrier,
        };
        if (isProfileComplete(pending) && !local.v3SavedAt) {
          const mode = local.v3Mode ?? 'new';
          const res = await saveTrainingProfile(token, {
            ...pending,
            profile_source: mode === 'new' ? 'onboarding_v3' : mode === 'upgrade' ? 'reonboarding_v3' : 'user_edit',
          });
          if (res?.complete) {
            await markV3ProfileDone(uid);
            trackEvent(token, 'v3_training_profile_saved', { funnel_version: 'v3', mode, saved: true, retried: true });
            checkedForRef.current = uid;
            return;
          }
        }

        const server = await fetchTrainingProfile(token);
        if (!server) return; // offline / server error: fail open, try again next session
        checkedForRef.current = uid;
        if (server.complete) {
          await markV3ProfileDone(uid);
          return;
        }
        trackEvent(token, 'v3_reonboarding_prompted', { funnel_version: 'v3', mode: 'upgrade' });
        router.replace('/onboarding-funnel/upgrade' as any);
      } finally {
        runningRef.current = false;
      }
    })();
  }, [token, isGuest, isLoading, user?.id, segments, router]);

  return null;
}
