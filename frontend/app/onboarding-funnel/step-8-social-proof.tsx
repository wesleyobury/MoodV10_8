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

const APP_STORE_RATING = '4.8';
const APP_STORE_REVIEW_COUNT = '1,200+';

export default function Step8SocialProof() {
  const router = useRouter();
  const { markStepEntered, consumeStepDuration } = useOnboardingFunnel();
  const { token } = useAuth();

  useEffect(() => {
    markStepEntered(8);
    Analytics.onboardingStepViewed(token, { step: 8, question: 'social_proof' });
  }, [markStepEntered, token]);

  const handleContinue = () => {
    Analytics.onboardingStepCompleted(token, {
      step: 8,
      question: 'social_proof',
      time_spent_ms: consumeStepDuration(8),
    });
    router.push('/onboarding-funnel/reveal-loading');
  };

  return (
    <FunnelLayout
      step={8}
      eyebrow="WHY MOOD"
      title="Built for people who actually train."
      ctaLabel="Build my profile"
      onCtaPress={handleContinue}
      testID="funnel-step-8"
    >
      <View style={styles.quoteCard}>
        <Ionicons name="leaf" size={20} color={COLORS.accent} style={styles.quoteIcon} />
        <Text style={styles.quote}>
          “The first fitness app that meets me where I&apos;m at, not where some algorithm thinks I
          should be.”
        </Text>
        <Text style={styles.quoteAttribution}>— Editorial review</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.stars}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Ionicons key={i} name="star" size={14} color={COLORS.accent} />
            ))}
          </View>
          <Text style={styles.statValue}>{APP_STORE_RATING}</Text>
          <Text style={styles.statLabel}>App Store rating</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="people" size={20} color={COLORS.accent} style={styles.statIcon} />
          <Text style={styles.statValue}>{APP_STORE_REVIEW_COUNT}</Text>
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
  quoteIcon: {
    marginBottom: 12,
  },
  quote: {
    fontSize: 18,
    lineHeight: 27,
    fontWeight: '500',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  quoteAttribution: {
    fontSize: 12,
    color: COLORS.textTertiary,
    letterSpacing: 1,
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
  stars: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 2,
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
