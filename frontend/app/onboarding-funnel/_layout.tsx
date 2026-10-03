/**
 * Onboarding Funnel — child stack.
 *
 * All screens here are forward-only. We disable gestures and hide the header.
 * The flow is:
 *
 *   step-1-mood → step-2-goal → step-3-level → step-4-barrier →
 *   step-5-length → step-6-social-proof → reveal-loading → reveal-payoff →
 *   /onboarding/medical-disclaimer
 *
 * (6 visible steps; old step-2-build-for-me and step-7-equipment removed.)
 *
 * MOOD V3 (V3_ONBOARDING_ENABLED in utils/v3Profile.ts), Oct 2026 premium pass:
 *   new:     intro ("Build my MOOD") → v3-preference → v3-goal → v3-experience → v3-frequency → v3-barrier →
 *            step-6-social-proof ("Build my profile") → (name, Apple relay only) → reveal-loading (profile
 *            construction) → profile-reveal ("Build my first workout") → /(tabs) Home → /v3/build → Cart → Start
 *            (workout #1 free) … paywall on STARTING workout #2 (utils/v3Session/access.ts).
 *            No paywall in onboarding: reveal-payoff is no longer on this path; wearables connect runs after
 *            workout #1 (HealthOnboardingGate + isFirstWorkoutPending).
 *   upgrade: upgrade → v3-* (5) → reveal-loading → profile-reveal → /(tabs) → /v3/build
 *   edit:    upgrade?mode=edit → v3-* (5) → reveal-loading → profile-reveal → Settings
 * step-1..step-5 (V2) stay registered but are unreachable while V3 is on.
 */

import { Stack } from 'expo-router';
import React from 'react';

export default function OnboardingFunnelLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0A0A0A' },
      }}
    />
  );
}
