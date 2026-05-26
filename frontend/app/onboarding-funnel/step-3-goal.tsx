/**
 * Step 3 — PRIMARY GOAL.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { FunnelLayout } from '../../components/onboarding/FunnelLayout';
import { OptionPill } from '../../components/onboarding/OptionPill';
import {
  GOAL_LABELS,
  PrimaryGoal,
  useOnboardingFunnel,
} from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics } from '../../utils/analytics';

const GOALS: PrimaryGoal[] = [
  'feel_better',
  'build_strength',
  'lose_weight',
  'stress_relief',
  'consistency',
];

export default function Step3Goal() {
  const router = useRouter();
  const { answers, setPrimaryGoal, markStepEntered, consumeStepDuration } = useOnboardingFunnel();
  const { token } = useAuth();
  const [pending, setPending] = useState<PrimaryGoal | undefined>(answers.primaryGoal);

  useEffect(() => {
    markStepEntered(3);
    Analytics.onboardingStepViewed(token, { step: 3, question: 'primary_goal' });
  }, [markStepEntered, token]);

  const handleContinue = () => {
    if (!pending) return;
    setPrimaryGoal(pending);
    Analytics.onboardingStepCompleted(token, {
      step: 3,
      question: 'primary_goal',
      answer: pending,
      time_spent_ms: consumeStepDuration(3),
    });
    router.push('/onboarding-funnel/step-4-level');
  };

  return (
    <FunnelLayout
      step={3}
      eyebrow="WHY YOU'RE HERE"
      title="What's your primary goal?"
      ctaLabel="Continue"
      ctaDisabled={!pending}
      onCtaPress={handleContinue}
      testID="funnel-step-3"
    >
      {GOALS.map((id) => (
        <OptionPill
          key={id}
          label={GOAL_LABELS[id]}
          selected={pending === id}
          onPress={() => setPending(id)}
          testID={`goal-${id}`}
        />
      ))}
    </FunnelLayout>
  );
}
