/**
 * MOOD V3 onboarding — Step 5 — BIGGEST BARRIER. First-person statements; MOOD answers with how it removes that
 * barrier (first-session setup: utils/v3Profile barrierPrefill).
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
        eyebrow: 'Be honest',
        title: 'What usually gets between you and a good workout?',
        options: BARRIER_OPTIONS,
        reactions: BARRIER_REACTIONS,
        variant: 'statements',
        // new users see one more screen (social proof, "Build my profile"); upgrade / edit go straight to the build
        cta: (mode) => (mode === 'new' ? 'Personalize my training' : mode === 'edit' ? 'Update my profile' : 'Build my profile'),
      }}
    />
  );
}
