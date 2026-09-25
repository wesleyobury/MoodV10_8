/**
 * MOOD V3 onboarding — Step 4 — TRAINING FREQUENCY.
 */
import React from 'react';
import { V3QuestionScreen } from '../../components/onboarding/V3QuestionScreen';
import { FREQUENCY_OPTIONS, type TrainingFrequency } from '../../utils/v3Profile';
import { FREQUENCY_REACTIONS } from '../../utils/v3ProfileCopy';

export default function V3FrequencyScreen() {
  return (
    <V3QuestionScreen<TrainingFrequency>
      config={{
        field: 'trainingFrequency',
        question: 'training_frequency',
        step: 4,
        eyebrow: 'Your rhythm',
        title: 'How often do you usually train?',
        subtitle: 'MOOD plans your sessions around how often you show up.',
        options: FREQUENCY_OPTIONS,
        reactions: FREQUENCY_REACTIONS,
      }}
    />
  );
}
