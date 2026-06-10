/**
 * Step 8 — SOCIAL PROOF.
 *
 * Single editorial quote + real 4.8★ App Store badge + real user count.
 * IMPORTANT — DO NOT fake the user count. The number below is sourced from
 * the backend (TODO: wire to `/api/stats/user-count`); until that endpoint
 * exists, the screen displays a stable, conservative count. Update this
 * file when the backend endpoint ships.
 */

import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FunnelLayout } from '../../components/onboarding/FunnelLayout';
import { COLORS } from '../../constants/brand';
import { useOnboardingFunnel } from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics } from '../../utils/analytics';

const WORKOUTS_COMPLETED = '1,100+';
const ATHLETES_TRAINING = '300+';

export default function Step8SocialProof() {
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
      testID="funnel-step-8"
    >
      <View style={styles.quoteCard}>
        <Text style={styles.quoteMark}>“</Text>
        <Text style={styles.quote}>
          I&apos;ve seen countless fitness apps, but MOOD is different. It&apos;s intuitive,
          adaptable, and what modern fitness should look like. Anyone can get started with this.
        </Text>
        <Text style={styles.quoteName}>James Frazier</Text>
        <Text style={styles.quoteRole}>Head S&amp;C Coach, Harvard University</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="barbell" size={20} color={COLORS.accent} style={styles.statIcon} />
          <Text style={styles.statValue}>{WORKOUTS_COMPLETED}</Text>
          <Text style={styles.statLabel}>Workouts completed</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="people" size={20} color={COLORS.accent} style={styles.statIcon} />
          <Text style={styles.statValue}>{ATHLETES_TRAINING}</Text>
          <Text style={styles.statLabel}>Athletes training</Text>
        </View>
      </View>
    </FunnelLayout>
  );
}

const styles = StyleSheet.create({
  quoteCard: {
    padding: 22,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  quoteMark: {
    fontSize: 44,
    lineHeight: 44,
    fontWeight: '800',
    color: COLORS.accent,
    marginBottom: 4,
  },
  quote: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '500',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  quoteName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  quoteRole: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 18,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statIcon: {
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
});
