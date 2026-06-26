/**
 * HealthOnboardingGate
 *
 * Listens for an authenticated user that hasn't yet completed the one-time
 * HealthKit onboarding flow. When detected, it routes them to the medical
 * disclaimer screen (the entry point of the 3-screen onboarding stack).
 *
 * Mounted inside <Stack> in _layout.tsx so router.replace is safe to call.
 */
import { useEffect, useRef } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import {
  isHealthOnboardingComplete,
  isMedicalDisclaimerAcknowledged,
} from '../utils/healthStorage';
import { shouldDeferAuxiliaryOnboardingGates } from '../utils/onboardingFunnelDefer';

export default function HealthOnboardingGate() {
  const { token, isGuest, isLoading, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (!token || isGuest) return;
    if (redirectedRef.current) return;

    // Don't redirect if user is already inside the onboarding stack OR the
    // onboarding funnel. (Phase 3.1: new signups route into /onboarding-funnel;
    // without whitelisting it here, this gate would immediately bounce them to
    // health-connect and break the funnel.)
    const seg = segments?.[0];
    const inOnboarding = seg === 'onboarding' || seg === 'onboarding-funnel';
    if (inOnboarding) return;

    (async () => {
      // Health connect runs AFTER reveal-payoff (Spec §6). Never hijack a
      // fresh signup that still owes the onboarding funnel.
      if (await shouldDeferAuxiliaryOnboardingGates(user?.id)) return;

      const [done, disclaimerAck] = await Promise.all([
        isHealthOnboardingComplete(),
        isMedicalDisclaimerAcknowledged(),
      ]);
      if (done) return;
      redirectedRef.current = true;
      // Spec §6 — the medical disclaimer is now folded into the signup
      // acknowledgement on `/auth/register`. New users have the flag set
      // there; for any legacy accounts that registered before this change,
      // auto-acknowledge here (Wes owns the legal review and signed off on
      // this migration 2026-05-27). Then always route directly to connect.
      if (!disclaimerAck) {
        const { setMedicalDisclaimerAcknowledged } = await import(
          '../utils/healthStorage'
        );
        await setMedicalDisclaimerAcknowledged();
      }
      router.replace('/onboarding/health-connect');
    })();
  }, [token, isGuest, isLoading, segments, router, user?.id]);

  return null;
}
