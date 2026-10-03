/**
 * MOOD V3 onboarding — Step 1 — TRAINING PREFERENCE. Cinematic cards (the Home Direction imagery).
 */
import React from 'react';
import { V3QuestionScreen } from '../../components/onboarding/V3QuestionScreen';
import { PREFERENCE_OPTIONS, type TrainingPreference } from '../../utils/v3Profile';
import { PREFERENCE_REACTIONS } from '../../utils/v3ProfileCopy';
import { PREFERENCE_IMAGE } from '../../components/onboarding/onboardingImages';

export default function V3PreferenceScreen() {
  return (
    <V3QuestionScreen<TrainingPreference>
      config={{
        field: 'trainingPreference',
        question: 'training_preference',
        step: 1,
        eyebrow: 'How you train',
        title: 'What do you usually train?',
        subtitle: 'Your default. You can switch any day.',
        options: PREFERENCE_OPTIONS.map((o) => ({ ...o, image: PREFERENCE_IMAGE[o.id] })),
        reactions: PREFERENCE_REACTIONS,
        variant: 'cards',
        cta: "That's me",
      }}
    />
  );
}
