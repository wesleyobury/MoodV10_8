/**
 * Step 5 — BIGGEST BARRIER.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { FunnelLayout } from '../../components/onboarding/FunnelLayout';
import { OptionPill } from '../../components/onboarding/OptionPill';
import { BiggestBarrier, useOnboardingFunnel } from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics } from '../../utils/analytics';

const BARRIERS: { id: BiggestBarrier; label: string; description: string }[] = [
  { id: 'time', label: 'Time', description: "I'm always short on it." },
  { id: 'energy', label: 'Energy', description: "I'm wiped out by the time I get to it." },
  { id: 'motivation', label: 'Motivation', description: "I struggle to start." },
  { id: 'unsure', label: "Don't know what to do", description: "I freeze on the plan." },
];

export default function Step5Barrier() {
  const router = useRouter();
  const { answers, setBiggestBarrier, markStepEntered, consumeStepDuration } = useOnboardingFunnel();
  const { token } = useAuth();
  const [pending, setPending] = useState<BiggestBarrier | undefined>(answers.biggestBarrier);

  useEffect(() => {
    markStepEntered(5);
    Analytics.onboardingStepViewed(token, { step: 5, question: 'biggest_barrier' });
  }, [markStepEntered, token]);

  const handleContinue = () => {
    if (!pending) return;
    setBiggestBarrier(pending);
    Analytics.onboardingStepCompleted(token, {
      step: 5,
      question: 'biggest_barrier',
      answer: pending,
      time_spent_ms: consumeStepDuration(5),
    });
    router.push('/onboarding-funnel/step-6-length');
  };

  return (
    <FunnelLayout
      step={5}
      eyebrow="WHAT GETS IN THE WAY"
      title="What's your biggest barrier?"
      ctaLabel="Continue"
      ctaDisabled={!pending}
      onCtaPress={handleContinue}
      testID="funnel-step-5"
    >
      {BARRIERS.map((b) => (
        <OptionPill
          key={b.id}
          label={b.label}
          description={b.description}
          selected={pending === b.id}
          onPress={() => setPending(b.id)}
          testID={`barrier-${b.id}`}
        />
      ))}
    </FunnelLayout>
  );
}
