/**
 * Step 7 — EQUIPMENT ACCESS.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { FunnelLayout } from '../../components/onboarding/FunnelLayout';
import { OptionPill } from '../../components/onboarding/OptionPill';
import { EquipmentAccess, useOnboardingFunnel } from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics } from '../../utils/analytics';

const EQUIPMENT: { id: EquipmentAccess; label: string; description: string }[] = [
  { id: 'bodyweight', label: 'Bodyweight only', description: 'No equipment.' },
  { id: 'dumbbells', label: 'Dumbbells', description: 'A pair at home.' },
  { id: 'bands', label: 'Resistance bands', description: 'Portable + adjustable.' },
  { id: 'full_gym', label: 'Full gym', description: 'Barbells, racks, machines.' },
];

export default function Step7Equipment() {
  const router = useRouter();
  const { answers, setEquipment, markStepEntered, consumeStepDuration } = useOnboardingFunnel();
  const { token } = useAuth();
  const [pending, setPending] = useState<EquipmentAccess | undefined>(answers.equipment);

  useEffect(() => {
    markStepEntered(7);
    Analytics.onboardingStepViewed(token, { step: 7, question: 'equipment' });
  }, [markStepEntered, token]);

  const handleContinue = () => {
    if (!pending) return;
    setEquipment(pending);
    Analytics.onboardingStepCompleted(token, {
      step: 7,
      question: 'equipment',
      answer: pending,
      time_spent_ms: consumeStepDuration(7),
    });
    router.push('/onboarding-funnel/step-8-social-proof');
  };

  return (
    <FunnelLayout
      step={7}
      eyebrow="WHAT YOU'VE GOT"
      title="Equipment access?"
      ctaLabel="Continue"
      ctaDisabled={!pending}
      onCtaPress={handleContinue}
      testID="funnel-step-7"
    >
      {EQUIPMENT.map((e) => (
        <OptionPill
          key={e.id}
          label={e.label}
          description={e.description}
          selected={pending === e.id}
          onPress={() => setPending(e.id)}
          testID={`equipment-${e.id}`}
        />
      ))}
    </FunnelLayout>
  );
}
