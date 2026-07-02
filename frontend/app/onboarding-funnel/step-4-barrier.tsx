/**
 * Step 5 — BIGGEST BARRIER.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { FunnelLayout } from '../../components/onboarding/FunnelLayout';
import { OptionPill } from '../../components/onboarding/OptionPill';
import { ReactionLine } from '../../components/onboarding/ReactionLine';
import { BiggestBarrier, useOnboardingFunnel } from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics } from '../../utils/analytics';

const BARRIERS: { id: BiggestBarrier; label: string; description: string }[] = [
  { id: 'time', label: 'Time', description: "I'm always short on it." },
  { id: 'energy', label: 'Energy', description: "I'm wiped out by the time I get to it." },
  { id: 'motivation', label: 'Motivation', description: "I struggle to start." },
  { id: 'unsure', label: "Don't know what to do", description: "I freeze on the plan." },
  { id: 'bored', label: 'Bored', description: 'Just need a routine switchup.' },
];

const BARRIER_REACTIONS: Record<BiggestBarrier, string> = {
  time: "Then we'll keep sessions short and decision-free.",
  energy: "We'll read your recovery and ease off when you're spent.",
  motivation: 'One tap to a workout — no staring at a blank plan.',
  unsure: "You'll never wonder what to do — we pick, you press play.",
  bored: 'Say less — no two sessions will feel the same.',
};

export default function Step5Barrier() {
  const router = useRouter();
  const { answers, setBiggestBarrier, markStepEntered, consumeStepDuration } = useOnboardingFunnel();
  const { token } = useAuth();
  const [pending, setPending] = useState<BiggestBarrier | undefined>(answers.biggestBarrier);

  useEffect(() => {
    markStepEntered(4);
    Analytics.onboardingStepViewed(token, { step: 4, question: 'biggest_barrier' });
  }, [markStepEntered, token]);

  const handleContinue = () => {
    if (!pending) return;
    setBiggestBarrier(pending);
    Analytics.onboardingStepCompleted(token, {
      step: 4,
      question: 'biggest_barrier',
      answer: pending,
      time_spent_ms: consumeStepDuration(4),
    });
    router.push('/onboarding-funnel/step-5-length');
  };

  return (
    <FunnelLayout
      step={4}
      eyebrow="What gets in the way"
      title="What usually stops you?"
      subtitle="This is the thing MOOD is built to beat."
      ctaLabel="Continue"
      ctaDisabled={!pending}
      onCtaPress={handleContinue}
      testID="funnel-step-4"
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
      {pending ? <ReactionLine text={BARRIER_REACTIONS[pending]} testID="barrier-reaction" /> : null}
    </FunnelLayout>
  );
}
