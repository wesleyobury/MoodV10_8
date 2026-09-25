/**
 * MOOD V3 onboarding — Step 3 — EXPERIENCE (separate from frequency; drives exercise eligibility).
 */
import React from 'react';
import { V3QuestionScreen } from '../../components/onboarding/V3QuestionScreen';
import { EXPERIENCE_OPTIONS, type Experience } from '../../utils/v3Profile';
import { EXPERIENCE_REACTIONS } from '../../utils/v3ProfileCopy';

export default function V3ExperienceScreen() {
  return (
    <V3QuestionScreen<Experience>
      config={{
        field: 'experience',
        question: 'experience',
        step: 3,
        eyebrow: "Where you're at",
        title: "What's your training experience?",
        subtitle: 'This decides which movements MOOD programs for you.',
        options: EXPERIENCE_OPTIONS,
        reactions: EXPERIENCE_REACTIONS,
      }}
    />
  );
}
