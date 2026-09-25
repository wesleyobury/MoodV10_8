/**
 * MOOD V3 onboarding — Step 1 — TRAINING PREFERENCE (replaces the V2 mood question).
 */
import React from 'react';
import { V3QuestionScreen } from '../../components/onboarding/V3QuestionScreen';
import { PREFERENCE_OPTIONS, type TrainingPreference } from '../../utils/v3Profile';
import { PREFERENCE_REACTIONS } from '../../utils/v3ProfileCopy';

export default function V3PreferenceScreen() {
  return (
    <V3QuestionScreen<TrainingPreference>
      config={{
        field: 'trainingPreference',
        question: 'training_preference',
        step: 1,
        eyebrow: 'How you train',
        title: 'What do you usually train?',
        subtitle: 'This sets your default session. You can switch any day.',
        options: PREFERENCE_OPTIONS,
        reactions: PREFERENCE_REACTIONS,
      }}
    />
  );
}
