/**
 * Step 6 — SOCIAL PROOF.
 *
 * Three compact editorial quotes from coaches / performance directors, each
 * with a headshot in the bottom-right of the card, plus a compact stats strip.
 * Designed to fit on a single screen with NO scrolling. Inline quotation marks.
 */

import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FunnelLayout } from '../../components/onboarding/FunnelLayout';
import { COLORS } from '../../constants/brand';
import { useOnboardingFunnel } from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics } from '../../utils/analytics';

const WORKOUTS_COMPLETED = '1,100+';
const ATHLETES_TRAINING = '300+';
const APP_STORE_RATING = '5.0';

type Testimonial = {
  quote: string;
  name: string;
  role: string;
  avatar: ReturnType<typeof require>;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      'I\u2019ve seen countless fitness apps, but MOOD is different. It\u2019s intuitive, adaptable, and what modern fitness should look like.',
    name: 'James Frazier',
    role: 'Head S&C Coach, Harvard University',
    avatar: require('../../assets/images/testimonials/frazier.png'),
  },
  {
    quote:
      'I\u2019ve lead multiple D1 sports programs and have seen too many fitness programs fail. MOOD is the solution that meets athletes where they\u2019re at.',
    name: 'Johnathan Poppe',
    role: 'Head Football Coach, Columbia University',
    avatar: require('../../assets/images/testimonials/poppe.png'),
  },
  {
    quote: 'It\u2019s so simple, yet so thorough.',
    name: 'Polica Houston',
    role: 'CEO, Denver Tennis Park | VP Programs, Big Brothers Big Sisters of CO',
    avatar: require('../../assets/images/testimonials/houston.png'),
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
            <View style={styles.attribution}>
              <Text style={styles.quoteName}>{t.name}</Text>
              <Text style={styles.quoteRole}>{t.role}</Text>
            </View>
            <Image source={t.avatar} style={styles.avatar} resizeMode="cover" />
          </View>
        ))}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCell}>
          <View style={styles.statTop}>
            <Ionicons name="barbell" size={16} color={COLORS.accent} />
            <Text style={styles.statValue}>{WORKOUTS_COMPLETED}</Text>
          </View>
          <Text style={styles.statLabel}>workouts completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <View style={styles.statTop}>
            <Ionicons name="people" size={16} color={COLORS.accent} />
            <Text style={styles.statValue}>{ATHLETES_TRAINING}</Text>
          </View>
          <Text style={styles.statLabel}>athletes training</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statCell}>
          <View style={styles.statTop}>
            <Ionicons name="star" size={16} color={COLORS.accent} />
            <Text style={styles.statValue}>{APP_STORE_RATING}</Text>
          </View>
          <Text style={styles.statLabel}>app store rating</Text>
        </View>
      </View>
    </FunnelLayout>
  );
}

const AVATAR = 46;

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
    position: 'relative',
  },
  quote: {
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: '500',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  attribution: {
    // leave room on the right for the avatar so text never runs under it
    paddingRight: AVATAR + 12,
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
  avatar: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: COLORS.bg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textTertiary,
  },
});
