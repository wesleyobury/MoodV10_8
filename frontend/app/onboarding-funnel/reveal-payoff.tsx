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

  const handleStart = () => {
    Analytics.revealCtaTapped(token, { cta: 'start_first_workout' });
    Analytics.onboardingCompleted(token, {
      mood: answers.mood,
      primary_goal: answers.primaryGoal,
      fitness_level: answers.fitnessLevel,
      biggest_barrier: answers.biggestBarrier,
      workout_length: answers.workoutLength,
      equipment: answers.equipment,
    });

    // Dev/sandbox: force the paywall to appear as the final onboarding
    // step so QA can rehearse the end-to-end signup → payment flow on
    // TestFlight without having to complete a free workout first.
    // Inert in production builds (env var not compiled in).
    // The medical-disclaimer route is still pushed underneath so when
    // the user dismisses the paywall they land on the existing happy
    // path (medical → health-intro → health-connect → /(tabs)).
    if (FORCE_SIGNUP_PAYWALL) {
      openPaywall('post_onboarding_dev');
    }
    router.replace('/onboarding/medical-disclaimer');
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
            onPress={handleStart}
            data-testid="reveal-start-cta"
            testID="reveal-start-cta"
          >
            <LinearGradient
              colors={BRAND_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaLabel}>Start your first workout</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.accentInk} style={styles.ctaIcon} />
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.ctaCaption}>Your first session is on us.</Text>
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
  ctaCaption: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textTertiary,
  },
});
