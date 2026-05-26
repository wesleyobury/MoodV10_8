/**
 * Step 4 — FITNESS LEVEL.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { FunnelLayout } from '../../components/onboarding/FunnelLayout';
import { OptionPill } from '../../components/onboarding/OptionPill';
import {
  FitnessLevel,
  LEVEL_LABELS,
  useOnboardingFunnel,
} from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics } from '../../utils/analytics';

const LEVELS: { id: FitnessLevel; description: string }[] = [
  { id: 'sedentary', description: 'Little to no regular exercise.' },
  { id: 'casual', description: 'Active a few times a month.' },
  { id: 'active', description: 'Training 2–4 times a week.' },
  { id: 'athletic', description: 'Training 5+ times a week.' },
];

export default function Step4Level() {
  const router = useRouter();
  const { answers, setFitnessLevel, markStepEntered, consumeStepDuration } = useOnboardingFunnel();
  const { token } = useAuth();
  const [pending, setPending] = useState<FitnessLevel | undefined>(answers.fitnessLevel);

  useEffect(() => {
    markStepEntered(4);
    Analytics.onboardingStepViewed(token, { step: 4, question: 'fitness_level' });
  }, [markStepEntered, token]);

  const handleContinue = () => {
    if (!pending) return;
    setFitnessLevel(pending);
    Analytics.onboardingStepCompleted(token, {
      step: 4,
      question: 'fitness_level',
      answer: pending,
      time_spent_ms: consumeStepDuration(4),
    });
    router.push('/onboarding-funnel/step-5-barrier');
  };

  return (
    <FunnelLayout
      step={4}
      eyebrow="WHERE YOU'RE AT"
      title="How would you describe your fitness?"
      ctaLabel="Continue"
      ctaDisabled={!pending}
      onCtaPress={handleContinue}
      testID="funnel-step-4"
    >
      {LEVELS.map((l) => (
        <OptionPill
          key={l.id}
          label={LEVEL_LABELS[l.id]}
          description={l.description}
          selected={pending === l.id}
          onPress={() => setPending(l.id)}
          testID={`level-${l.id}`}
        />
      ))}
    </FunnelLayout>
  );
}
