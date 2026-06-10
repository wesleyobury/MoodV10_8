/**
 * Step 4 — FITNESS LEVEL.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { FunnelLayout } from '../../components/onboarding/FunnelLayout';
import { OptionPill } from '../../components/onboarding/OptionPill';
import { ReactionLine } from '../../components/onboarding/ReactionLine';
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

const LEVEL_REACTIONS: Record<FitnessLevel, string> = {
  sedentary: "Perfect starting point — we'll ease you in and build momentum.",
  casual: "We'll meet you here and ramp at your pace.",
  active: "Great base — we'll push you without burning you out.",
  athletic: "We'll keep the intensity high enough to matter.",
};

export default function Step4Level() {
  const router = useRouter();
  const { answers, setFitnessLevel, markStepEntered, consumeStepDuration } = useOnboardingFunnel();
  const { token } = useAuth();
  const [pending, setPending] = useState<FitnessLevel | undefined>(answers.fitnessLevel);

  useEffect(() => {
    markStepEntered(3);
    Analytics.onboardingStepViewed(token, { step: 3, question: 'fitness_level' });
  }, [markStepEntered, token]);

  const handleContinue = () => {
    if (!pending) return;
    setFitnessLevel(pending);
    Analytics.onboardingStepCompleted(token, {
      step: 3,
      question: 'fitness_level',
      answer: pending,
      time_spent_ms: consumeStepDuration(3),
    });
    router.push('/onboarding-funnel/step-5-barrier');
  };

  return (
    <FunnelLayout
      step={3}
      eyebrow="Where you're at"
      title="Be honest — where are you right now?"
      subtitle="No judgement. It just sets your starting load."
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
      {pending ? <ReactionLine text={LEVEL_REACTIONS[pending]} testID="level-reaction" /> : null}
    </FunnelLayout>
  );
}
