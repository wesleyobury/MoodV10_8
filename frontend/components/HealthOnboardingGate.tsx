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

export default function HealthOnboardingGate() {
  const { token, isGuest, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (!token || isGuest) return;
    if (redirectedRef.current) return;

    // Don't redirect if user is already inside the onboarding stack.
    const inOnboarding = segments?.[0] === 'onboarding';
    if (inOnboarding) return;

    (async () => {
      const [done, disclaimerAck] = await Promise.all([
        isHealthOnboardingComplete(),
        isMedicalDisclaimerAcknowledged(),
      ]);
      if (done) return;
      redirectedRef.current = true;
      // Medical disclaimer is the first screen. If the user has already
      // acknowledged it but bailed before connecting, resume at the intro.
      if (disclaimerAck) {
        router.replace('/onboarding/health-intro');
      } else {
        router.replace('/onboarding/medical-disclaimer');
      }
    })();
  }, [token, isGuest, isLoading, segments, router]);

  return null;
}
