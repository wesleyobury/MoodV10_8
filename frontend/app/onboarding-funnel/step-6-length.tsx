/**
 * Step 6 — PREFERRED WORKOUT LENGTH.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { FunnelLayout } from '../../components/onboarding/FunnelLayout';
import { OptionPill } from '../../components/onboarding/OptionPill';
import { useOnboardingFunnel, WorkoutLength } from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics } from '../../utils/analytics';

const LENGTHS: { id: WorkoutLength; label: string; description: string }[] = [
  { id: 20, label: '20 minutes', description: 'Focused session.' },
  { id: 30, label: '30 minutes', description: 'Standard.' },
  { id: 45, label: '45 minutes', description: 'Full session.' },
  { id: 60, label: '60 minutes', description: 'Go long.' },
  { id: 90, label: '90 minutes', description: "Everything you've got." },
];

export default function Step6Length() {
  const router = useRouter();
  const { answers, setWorkoutLength, markStepEntered, consumeStepDuration } = useOnboardingFunnel();
  const { token } = useAuth();
  const [pending, setPending] = useState<WorkoutLength | undefined>(answers.workoutLength);

  useEffect(() => {
    markStepEntered(5);
    Analytics.onboardingStepViewed(token, { step: 5, question: 'workout_length' });
  }, [markStepEntered, token]);

  const handleContinue = () => {
    if (!pending) return;
    setWorkoutLength(pending);
    Analytics.onboardingStepCompleted(token, {
      step: 5,
      question: 'workout_length',
      answer: pending,
      time_spent_ms: consumeStepDuration(5),
    });
    router.push('/onboarding-funnel/step-8-social-proof');
  };

  return (
    <FunnelLayout
      step={5}
      eyebrow="How much time"
      title="How long feels right?"
      subtitle="We'll never hand you more than you've got."
      ctaLabel="Continue"
      ctaDisabled={!pending}
      onCtaPress={handleContinue}
      testID="funnel-step-6"
    >
      {LENGTHS.map((l) => (
        <OptionPill
          key={l.id}
          label={l.label}
          description={l.description}
          selected={pending === l.id}
          onPress={() => setPending(l.id)}
          testID={`length-${l.id}`}
        />
      ))}
    </FunnelLayout>
  );
}
