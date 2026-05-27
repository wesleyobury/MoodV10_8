/**
 * Reveal Payoff — the conversion moment.
 *
 * Top half: cinematic full-bleed athlete photo with overlay text.
 * Bottom half: dark background, three small preview cards in a row.
 *
 * Primary CTA "Start your first workout →" routes to /onboarding/medical-disclaimer,
 * keeping the existing HealthKit flow intact (medical → health-intro → health-connect → /(tabs)).
 *
 * Hero photo: stock placeholder via Unsplash CDN. Replace with the final
 * brand asset shipped by Wes before TestFlight cut.
 */

import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  Dimensions,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import {
  GOAL_LABELS,
  LEVEL_LABELS,
  useOnboardingFunnel,
} from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics } from '../../utils/analytics';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { FORCE_SIGNUP_PAYWALL } from '../../utils/devFlags';

const { height } = Dimensions.get('window');

// TODO(wes): Swap to final brand asset before TestFlight.
const HERO_URI =
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=80';

export default function RevealPayoff() {
  const router = useRouter();
  const { answers } = useOnboardingFunnel();
  const { user, token } = useAuth();
  const { openPaywall } = useSubscription();

  const firstName =
    (user?.name && user.name.split(' ')[0]) || user?.username || 'Athlete';
  const goal = answers.primaryGoal ? GOAL_LABELS[answers.primaryGoal] : 'your goal';
  const level = answers.fitnessLevel ? LEVEL_LABELS[answers.fitnessLevel] : 'your level';
  const length = answers.workoutLength ?? 30;

  useEffect(() => {
    Analytics.revealScreenViewed(token, { stage: 'payoff' });
  }, [token]);

  // Spec §3 Stage 1 — Soft Paywall #1.
  // Primary CTA fires the post-onboarding soft paywall. The medical
  // disclaimer route is pushed underneath so when the user dismisses the
  // paywall they land on the existing happy path (medical → health-connect
  // → /(tabs)). Tapping the primary CTA = "I want to start a trial."
  const handleStartTrial = () => {
    Analytics.revealCtaTapped(token, { cta: 'start_free_trial' });
    Analytics.onboardingCompleted(token, {
      mood: answers.mood,
      primary_goal: answers.primaryGoal,
      fitness_level: answers.fitnessLevel,
      biggest_barrier: answers.biggestBarrier,
      workout_length: answers.workoutLength,
      equipment: answers.equipment,
    });
    // Spec §6 — medical disclaimer is now folded into /auth/register's
    // acknowledgement checkbox. Skip the standalone disclaimer screen and
    // route the funnel directly to the health-connect step.
    openPaywall(FORCE_SIGNUP_PAYWALL ? 'post_onboarding_dev' : 'post_onboarding_soft');
    router.replace('/onboarding/health-connect');
  };

  // Secondary CTA — replaces the old "Your first session is on us" caption.
  // User taps "Try first workout for free" → skip paywall, proceed straight
  // to the first free workout via the existing medical → health-connect flow.
  const handleTryFreeWorkout = () => {
    Analytics.revealCtaTapped(token, { cta: 'try_first_workout_for_free' });
    Analytics.onboardingCompleted(token, {
      mood: answers.mood,
      primary_goal: answers.primaryGoal,
      fitness_level: answers.fitnessLevel,
      biggest_barrier: answers.biggestBarrier,
      workout_length: answers.workoutLength,
      equipment: answers.equipment,
    });
    router.replace('/onboarding/health-connect');
  };

  return (
    <SafeAreaView style={styles.root} edges={['bottom']} testID="reveal-payoff" data-testid="reveal-payoff">
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        {/* TOP HALF — cinematic hero */}
        <ImageBackground source={{ uri: HERO_URI }} style={styles.hero} resizeMode="cover">
          <LinearGradient
            colors={['transparent', 'rgba(10,10,10,0.4)', COLORS.bg]}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            <Text style={styles.eyebrow}>YOUR MOOD PROFILE</Text>
            <Text style={styles.heroHeadline}>{firstName}, built for you.</Text>
            <Text style={styles.heroSubhead}>
              Tuned to {goal} · {level} · {length} min
            </Text>
          </View>
        </ImageBackground>

        {/* BOTTOM HALF — preview cards */}
        <View style={styles.bottom}>
          <View style={styles.previewRow}>
            <PreviewCard
              icon="barbell"
              caption={'Workouts tuned\nto your mood, every day.'}
            />
            <PreviewCard
              icon="pulse"
              caption={'Live heart rate.\nShareable charts.'}
            />
            <PreviewCard
              icon="moon"
              caption={'Adapts to how\nrecovered you are.'}
            />
          </View>

          <TouchableOpacity
            style={styles.cta}
            onPress={handleStartTrial}
            data-testid="reveal-start-cta"
            testID="reveal-start-cta"
          >
            <LinearGradient
              colors={BRAND_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaLabel}>Start free trial</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.accentInk} style={styles.ctaIcon} />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryCta}
            onPress={handleTryFreeWorkout}
            data-testid="reveal-try-free-cta"
            testID="reveal-try-free-cta"
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryCtaLabel}>Try first workout for free</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PreviewCard({
  icon,
  caption,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  caption: string;
}) {
  return (
    <View style={styles.previewCard}>
      <Ionicons name={icon} size={22} color={COLORS.accent} />
      <Text style={styles.previewCaption}>{caption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flexGrow: 1,
  },
  hero: {
    height: Math.max(height * 0.55, 420),
    justifyContent: 'flex-end',
  },
  heroContent: {
    padding: 24,
    paddingBottom: 32,
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.8,
    fontWeight: '600',
    color: COLORS.accent,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  heroHeadline: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  heroSubhead: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  bottom: {
    padding: 24,
    paddingTop: 24,
    backgroundColor: COLORS.bg,
  },
  previewRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  previewCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    minHeight: 110,
  },
  previewCaption: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  cta: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accentInk,
    letterSpacing: 0.3,
  },
  ctaIcon: {
    marginLeft: 8,
  },
  // Spec §3 Stage 1 — secondary "Try first workout for free" CTA.
  // Intentionally text-only / no fill so the primary trial CTA stays
  // visually dominant. Small enough to read as a graceful out, not a
  // competing primary action.
  secondaryCta: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  secondaryCtaLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textTertiary,
    textDecorationLine: 'underline',
    textDecorationColor: 'rgba(255,255,255,0.25)',
  },
  ctaCaption: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textTertiary,
  },
});
