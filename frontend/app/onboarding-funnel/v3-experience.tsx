/**
 * MOOD V3 onboarding — Step 3 — EXPERIENCE. Four human rungs on a rising progression; each maps onto the three server
 * levels that decide exercise eligibility (utils/v3ProfileOptions EXPERIENCE_DETAIL_OPTIONS).
 */
import React from 'react';
import { V3QuestionScreen } from '../../components/onboarding/V3QuestionScreen';
import { EXPERIENCE_DETAIL_OPTIONS, detailFromExperience, experienceFromDetail, type ExperienceDetail } from '../../utils/v3Profile';
import { EXPERIENCE_REACTIONS } from '../../utils/v3ProfileCopy';

export default function V3ExperienceScreen() {
  return (
    <V3QuestionScreen<ExperienceDetail>
      config={{
        field: 'experienceDetail',
        question: 'experience',
        step: 3,
        eyebrow: "Where you're at",
        title: 'Where are you with training?',
        subtitle: 'This decides which movements MOOD programs for you.',
        options: EXPERIENCE_DETAIL_OPTIONS,
        reactions: EXPERIENCE_REACTIONS,
        variant: 'ladder',
        cta: "That's me",
        initial: (a) => detailFromExperience(a.experience),
        commit: (d) => ({ experience: experienceFromDetail(d) }),
      }}
    />
  );
}
