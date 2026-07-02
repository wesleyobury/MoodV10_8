/**
 * Step 3 — PRIMARY GOAL.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { FunnelLayout } from '../../components/onboarding/FunnelLayout';
import { OptionPill } from '../../components/onboarding/OptionPill';
import { ReactionLine } from '../../components/onboarding/ReactionLine';
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
  'improve_physique',
  'improve_athleticism',
  'lose_weight',
  'stress_relief',
  'consistency',
];

const GOAL_REACTIONS: Record<PrimaryGoal, string> = {
  feel_better: "Got it — we'll prioritize how you feel, not just the numbers.",
  build_strength: 'Strength-first programming, locked in.',
  improve_physique: 'Aesthetic-focused training — sculpt & definition prioritized.',
  improve_athleticism: 'Power, speed, and coordination — training like an athlete.',
  lose_weight: "We'll bias toward fat-burn and conditioning.",
  stress_relief: 'Sessions that leave you calmer than you started.',
  consistency: "Consistency over intensity — we'll make it easy to show up.",
};

export default function Step3Goal() {
  const router = useRouter();
  const { answers, setPrimaryGoal, markStepEntered, consumeStepDuration } = useOnboardingFunnel();
  const { token } = useAuth();
  const [pending, setPending] = useState<PrimaryGoal | undefined>(answers.primaryGoal);

  useEffect(() => {
    markStepEntered(2);
    Analytics.onboardingStepViewed(token, { step: 2, question: 'primary_goal' });
  }, [markStepEntered, token]);

  const handleContinue = () => {
    if (!pending) return;
    setPrimaryGoal(pending);
    Analytics.onboardingStepCompleted(token, {
      step: 2,
      question: 'primary_goal',
      answer: pending,
      time_spent_ms: consumeStepDuration(2),
    });
    router.push('/onboarding-funnel/step-3-level');
  };

  return (
    <FunnelLayout
      step={2}
      eyebrow="Why you're here"
      title="What are you really chasing?"
      subtitle="We'll bias every session toward it."
      ctaLabel="Continue"
      ctaDisabled={!pending}
      onCtaPress={handleContinue}
      testID="funnel-step-2"
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
      {pending ? <ReactionLine text={GOAL_REACTIONS[pending]} testID="goal-reaction" /> : null}
    </FunnelLayout>
  );
}
