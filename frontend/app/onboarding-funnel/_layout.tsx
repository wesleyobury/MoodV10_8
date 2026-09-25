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
 * MOOD V3 (V3_ONBOARDING_ENABLED in utils/v3Profile.ts):
 *   new:     intro → v3-preference → v3-goal → v3-experience → v3-frequency →
 *            v3-barrier → step-6-social-proof → (name) → reveal-loading →
 *            profile-reveal → reveal-payoff → /onboarding/health-connect → /(tabs)
 *   upgrade: upgrade → v3-* (5) → reveal-loading → profile-reveal → /(tabs)
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
