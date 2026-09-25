/**
 * MOOD V3 onboarding — Step 5 — BIGGEST BARRIER (first-session setup + future notification copy).
 */
import React from 'react';
import { V3QuestionScreen } from '../../components/onboarding/V3QuestionScreen';
import { BARRIER_OPTIONS, type Barrier } from '../../utils/v3Profile';
import { BARRIER_REACTIONS } from '../../utils/v3ProfileCopy';

export default function V3BarrierScreen() {
  return (
    <V3QuestionScreen<Barrier>
      config={{
        field: 'barrier',
        question: 'biggest_barrier',
        step: 5,
        eyebrow: 'What gets in the way',
        title: 'What usually gets in the way?',
        subtitle: "Tell us once. We'll set up your first session around it.",
        options: BARRIER_OPTIONS,
        reactions: BARRIER_REACTIONS,
      }}
    />
  );
}
