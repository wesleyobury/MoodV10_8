/**
 * V3QuestionScreen — one MOOD V3 training-profile question.
 *
 * The five V3 questions (preference, goal, experience, frequency, barrier) share one flow: pick one, MOOD answers with
 * the real consequence (ReactionCard: what changed + how), continue. Each route file is a thin config over this
 * component; copy lives in utils/v3Profile(Options).ts + utils/v3ProfileCopy.ts.
 *
 * What varies per question is the answer surface (components/onboarding/V3Options.tsx) and the CTA, so the funnel
 * builds momentum instead of repeating "Continue". The progress bar is the profile itself: it moves on every tap.
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { FunnelLayout } from './FunnelLayout';
import { ReactionCard } from './ReactionLine';
import { EditorialList, LadderList, Opt, PreferenceCards, StatementCards, WeekList } from './V3Options';
import { FunnelAnswers, useOnboardingFunnel } from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics } from '../../utils/analytics';
import type { V3FunnelMode } from '../../utils/v3Profile';
import { Reaction, profileProgress } from '../../utils/v3ProfileCopy';

export type V3FieldKey = 'trainingPreference' | 'v3Goal' | 'experienceDetail' | 'trainingFrequency' | 'barrier';
export type V3Variant = 'cards' | 'editorial' | 'ladder' | 'week' | 'statements';

export interface V3QuestionConfig<T extends string> {
  field: V3FieldKey;
  /** analytics question name, e.g. 'training_preference' */
  question: string;
  step: number;
  eyebrow: string;
  title: string;
  subtitle?: string;
  options: Opt<T>[];
  reactions: Record<T, Reaction>;
  variant: V3Variant;
  /** CTA label; may depend on the funnel mode (the last question reads differently in edit mode). */
  cta: string | ((mode: V3FunnelMode) => string);
  /** Starting selection when the field itself is empty (e.g. edit mode with an older answer shape). */
  initial?: (a: FunnelAnswers) => T | undefined;
  /** Extra answers written with the selection (experience rung -> server level). */
  commit?: (id: T) => Partial<FunnelAnswers>;
}

/** Order of the V3 questions. The last one hands off to social proof (new users) or the reveal. */
export const V3_QUESTION_ROUTES = [
  '/onboarding-funnel/v3-preference',
  '/onboarding-funnel/v3-goal',
  '/onboarding-funnel/v3-experience',
  '/onboarding-funnel/v3-frequency',
  '/onboarding-funnel/v3-barrier',
] as const;

const SURFACE = { cards: PreferenceCards, editorial: EditorialList, ladder: LadderList, week: WeekList, statements: StatementCards } as const;

export function V3QuestionScreen<T extends string>({ config }: { config: V3QuestionConfig<T> }) {
  const router = useRouter();
  const { token } = useAuth();
  const { answers, setV3, markStepEntered, consumeStepDuration } = useOnboardingFunnel();
  const mode = answers.v3Mode ?? 'new';
  const [pending, setPending] = useState<T | undefined>(
    (answers[config.field] as T | undefined) ?? config.initial?.(answers),
  );

  useEffect(() => {
    markStepEntered(config.step);
    Analytics.onboardingStepViewed(token, { step: config.step, question: config.question, funnel_version: 'v3', mode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleContinue = () => {
    if (!pending) return;
    const extra = config.commit?.(pending) ?? {};
    setV3({ [config.field]: pending, ...extra } as any);
    Analytics.onboardingStepCompleted(token, {
      step: config.step,
      question: config.question,
      answer: pending,
      ...extra,
      time_spent_ms: consumeStepDuration(config.step),
      funnel_version: 'v3',
      funnel_design: 'v3_premium_oct26',
      mode,
    });
    const idx = config.step - 1;
    if (idx < V3_QUESTION_ROUTES.length - 1) {
      router.push(V3_QUESTION_ROUTES[idx + 1] as any);
    } else if (mode === 'new') {
      router.push('/onboarding-funnel/step-6-social-proof');
    } else {
      router.replace('/onboarding-funnel/reveal-loading');
    }
  };

  const Surface = SURFACE[config.variant] as (p: { options: Opt<T>[]; value?: T; onChange: (id: T) => void; testPrefix: string }) => React.ReactElement;
  const reaction = pending ? config.reactions[pending] : null;
  const cta = typeof config.cta === 'function' ? config.cta(mode) : config.cta;

  return (
    <FunnelLayout
      step={config.step}
      profilePct={profileProgress(config.step - 1, !!pending)}
      eyebrow={config.eyebrow}
      title={config.title}
      subtitle={config.subtitle}
      ctaLabel={cta}
      ctaDisabled={!pending}
      onCtaPress={handleContinue}
      testID={`funnel-v3-${config.question}`}
      aboveCta={
        reaction && pending ? (
          <ReactionCard tag={reaction.tag} text={reaction.text} selectionKey={pending} testID={`v3-${config.question}-reaction`} />
        ) : null
      }
    >
      <Surface options={config.options} value={pending} onChange={setPending} testPrefix={`v3-${config.question}`} />
    </FunnelLayout>
  );
}
