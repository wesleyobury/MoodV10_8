/**
 * MOOD V3 onboarding — Step 2 — GOAL (V3 goal ids).
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
        title: 'What are you training for?',
        subtitle: 'MOOD uses this to decide which sessions come first.',
        options: GOAL_OPTIONS,
        reactions: GOAL_REACTIONS,
      }}
    />
  );
}
