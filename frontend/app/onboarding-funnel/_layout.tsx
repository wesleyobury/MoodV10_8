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
