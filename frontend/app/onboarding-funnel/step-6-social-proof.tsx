/**
 * Step 6 — SOCIAL PROOF.
 *
 * Three compact editorial quotes from coaches / performance directors.
 * Designed to fit on a single screen with NO scrolling. Inline quotation
 * marks (no oversized decorative marks).
 */

import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { FunnelLayout } from '../../components/onboarding/FunnelLayout';
import { COLORS } from '../../constants/brand';
import { useOnboardingFunnel } from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics } from '../../utils/analytics';

type Testimonial = { quote: string; name: string; role: string };

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'I\u2019ve seen countless fitness apps, but MOOD is different. It\u2019s intuitive, adaptable, and what modern fitness should look like.',
    name: 'James Frazier',
    role: 'Head S&C Coach, Harvard University',
  },
  {
    quote:
      'MOOD removes the guesswork. It gives athletes structured training that matches how they\u2019re feeling while still driving results.',
    name: 'Jermaine W. Stafford',
    role: 'Director of Performance | Sports Performance Specialist | Head T&F Coach',
  },
  {
    quote: 'It\u2019s so simple, yet so thorough.',
    name: 'Polica Houston',
    role: 'CEO, Denver Tennis Park | Former VP of Programs, Big Brothers Big Sisters of Colorado',
  },
];

export default function Step6SocialProof() {
  const router = useRouter();
  const { markStepEntered, consumeStepDuration } = useOnboardingFunnel();
  const { token } = useAuth();

  useEffect(() => {
    markStepEntered(6);
    Analytics.onboardingStepViewed(token, { step: 6, question: 'social_proof' });
  }, [markStepEntered, token]);

  const handleContinue = () => {
    Analytics.onboardingStepCompleted(token, {
      step: 6,
      question: 'social_proof',
      time_spent_ms: consumeStepDuration(6),
    });
    router.push('/onboarding-funnel/reveal-loading');
  };

  return (
    <FunnelLayout
      step={6}
      eyebrow="Don't take our word for it"
      title="Trusted by those who coach elite athletes."
      ctaLabel="Build my profile"
      onCtaPress={handleContinue}
      testID="funnel-step-6"
    >
      <View style={styles.list}>
        {TESTIMONIALS.map((t) => (
          <View key={t.name} style={styles.quoteCard} testID={`testimonial-${t.name}`}>
            <Text style={styles.quote}>&ldquo;{t.quote}&rdquo;</Text>
            <Text style={styles.quoteName}>{t.name}</Text>
            <Text style={styles.quoteRole}>{t.role}</Text>
          </View>
        ))}
      </View>
    </FunnelLayout>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  quoteCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  quote: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '500',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  quoteName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  quoteRole: {
    marginTop: 2,
    fontSize: 10.5,
    lineHeight: 14,
    color: COLORS.textTertiary,
  },
});
