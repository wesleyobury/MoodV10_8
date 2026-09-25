/**
 * V3QuestionScreen — one MOOD V3 training-profile question.
 *
 * The five V3 questions (preference, goal, experience, frequency, barrier) are
 * the same interaction: pick one, see a truthful one-line reaction, continue.
 * Each route file is a thin config over this component, so copy and order live
 * in one place (utils/v3Profile.ts + utils/v3ProfileCopy.ts) and the screens
 * keep the existing funnel chrome (FunnelLayout, OptionPill, ReactionLine).
 */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { FunnelLayout } from './FunnelLayout';
import { OptionPill } from './OptionPill';
import { ReactionLine } from './ReactionLine';
import { useOnboardingFunnel } from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics } from '../../utils/analytics';

export type V3FieldKey = 'trainingPreference' | 'v3Goal' | 'experience' | 'trainingFrequency' | 'barrier';

export interface V3QuestionConfig<T extends string> {
  field: V3FieldKey;
  /** analytics question name, e.g. 'training_preference' */
  question: string;
  step: number;
  eyebrow: string;
  title: string;
  subtitle?: string;
  options: { id: T; label: string; description?: string }[];
  reactions: Record<T, string>;
}

/** Order of the V3 questions. The last one hands off to social proof (new users) or the reveal. */
export const V3_QUESTION_ROUTES = [
  '/onboarding-funnel/v3-preference',
  '/onboarding-funnel/v3-goal',
  '/onboarding-funnel/v3-experience',
  '/onboarding-funnel/v3-frequency',
  '/onboarding-funnel/v3-barrier',
] as const;

export function V3QuestionScreen<T extends string>({ config }: { config: V3QuestionConfig<T> }) {
  const router = useRouter();
  const { token } = useAuth();
  const { answers, setV3, markStepEntered, consumeStepDuration } = useOnboardingFunnel();
  const mode = answers.v3Mode ?? 'new';
  // New users also see social proof (step 6); upgrade / edit runs the 5 questions only.
  const totalSteps = mode === 'new' ? 6 : 5;
  const [pending, setPending] = useState<T | undefined>(answers[config.field] as T | undefined);

  useEffect(() => {
    markStepEntered(config.step);
    Analytics.onboardingStepViewed(token, { step: config.step, question: config.question, funnel_version: 'v3', mode });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleContinue = () => {
    if (!pending) return;
    setV3({ [config.field]: pending } as any);
    Analytics.onboardingStepCompleted(token, {
      step: config.step,
      question: config.question,
      answer: pending,
      time_spent_ms: consumeStepDuration(config.step),
      funnel_version: 'v3',
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

  return (
    <FunnelLayout
      step={config.step}
      totalSteps={totalSteps}
      eyebrow={config.eyebrow}
      title={config.title}
      subtitle={config.subtitle}
      ctaLabel="Continue"
      ctaDisabled={!pending}
      onCtaPress={handleContinue}
      testID={`funnel-v3-${config.question}`}
    >
      {config.options.map((o) => (
        <OptionPill
          key={o.id}
          label={o.label}
          description={o.description}
          selected={pending === o.id}
          onPress={() => setPending(o.id)}
          testID={`v3-${config.question}-${o.id}`}
        />
      ))}
      {pending ? <ReactionLine text={config.reactions[pending]} testID={`v3-${config.question}-reaction`} /> : null}
    </FunnelLayout>
  );
}
