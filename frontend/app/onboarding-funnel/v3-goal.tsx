/**
 * MOOD V3 onboarding — Step 2 — GOAL. Clean editorial selection.
 */
import React from 'react';
import { V3QuestionScreen } from '../../components/onboarding/V3QuestionScreen';
import { GOAL_OPTIONS, type V3Goal } from '../../utils/v3Profile';
import { GOAL_REACTIONS } from '../../utils/v3ProfileCopy';

export default function V3GoalScreen() {
  return (
    <V3QuestionScreen<V3Goal>
      config={{
        field: 'v3Goal',
        question: 'primary_goal',
        step: 2,
        eyebrow: "Why you're here",
        title: 'What are you really chasing?',
        subtitle: 'Pick the one that matters most right now.',
        options: GOAL_OPTIONS,
        reactions: GOAL_REACTIONS,
        variant: 'editorial',
        cta: 'Continue',
      }}
    />
  );
}
