/**
 * Onboarding Funnel — child stack.
 *
 * All screens here are forward-only. We disable gestures and hide the header.
 * The flow is:
 *
 *   step-1-mood → step-2-build-for-me → step-3-goal → step-4-level →
 *   step-5-barrier → step-6-length → step-7-equipment → step-8-social-proof →
 *   reveal-loading → reveal-payoff → /onboarding/medical-disclaimer
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
