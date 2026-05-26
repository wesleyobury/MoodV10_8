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
  { id: 10, label: '10 minutes', description: 'Quick hit.' },
  { id: 20, label: '20 minutes', description: 'Focused session.' },
  { id: 30, label: '30 minutes', description: 'Standard.' },
  { id: 45, label: '45 minutes', description: 'Full session.' },
];

export default function Step6Length() {
  const router = useRouter();
  const { answers, setWorkoutLength, markStepEntered, consumeStepDuration } = useOnboardingFunnel();
  const { token } = useAuth();
  const [pending, setPending] = useState<WorkoutLength | undefined>(answers.workoutLength);

  useEffect(() => {
    markStepEntered(6);
    Analytics.onboardingStepViewed(token, { step: 6, question: 'workout_length' });
  }, [markStepEntered, token]);

  const handleContinue = () => {
    if (!pending) return;
    setWorkoutLength(pending);
    Analytics.onboardingStepCompleted(token, {
      step: 6,
      question: 'workout_length',
      answer: pending,
      time_spent_ms: consumeStepDuration(6),
    });
    router.push('/onboarding-funnel/step-7-equipment');
  };

  return (
    <FunnelLayout
      step={6}
      eyebrow="HOW MUCH TIME"
      title="Preferred workout length?"
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
