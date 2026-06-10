/**
 * Step 1 — MOOD SELECTION.
 *
 * All 6 moods unlocked. Teach moment. Tap → select → continue.
 */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { FunnelLayout } from '../../components/onboarding/FunnelLayout';
import { COLORS } from '../../constants/brand';
import {
  MOOD_DISPLAY,
  MoodId,
  useOnboardingFunnel,
} from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics } from '../../utils/analytics';

const MOOD_ORDER: MoodId[] = ['sweat', 'muscle', 'lazy', 'outdoor', 'calisthenics', 'explosive'];

const MOOD_ICONS: Record<MoodId, keyof typeof Ionicons.glyphMap> = {
  sweat: 'flame',
  muscle: 'barbell',
  lazy: 'bed',
  outdoor: 'bicycle',
  calisthenics: 'body',
  explosive: 'flash',
};

// Step-1-only icon palette — mirrors the live-tab notification colors,
// slightly transparent for an on-brand feel. Intentionally NOT the global
// MOOD_DISPLAY.gradient (which is used app-wide).
const MOOD_ICON_GRADIENT: Record<MoodId, readonly [string, string]> = {
  muscle: ['rgba(255,159,67,0.92)', 'rgba(255,122,0,0.92)'], // orange
  sweat: ['rgba(255,107,107,0.92)', 'rgba(255,68,68,0.92)'], // coral
  lazy: ['rgba(69,183,209,0.90)', 'rgba(74,144,217,0.90)'], // blue
  outdoor: ['rgba(78,205,196,0.92)', 'rgba(16,172,132,0.92)'], // teal/green
  calisthenics: ['rgba(155,89,182,0.90)', 'rgba(126,87,194,0.90)'], // purple
  explosive: ['rgba(255,215,0,0.95)', 'rgba(255,159,67,0.95)'], // gold anchor
};

export default function Step1Mood() {
  const router = useRouter();
  const { answers, setMood, markStepEntered, consumeStepDuration } = useOnboardingFunnel();
  const { token } = useAuth();
  const [pending, setPending] = useState<MoodId | undefined>(answers.mood);

  useEffect(() => {
    markStepEntered(1);
    Analytics.onboardingStepViewed(token, { step: 1, question: 'mood' });
  }, [markStepEntered, token]);

  const handleSelect = (mood: MoodId) => {
    setPending(mood);
  };

  const handleContinue = () => {
    if (!pending) return;
    setMood(pending);
    Analytics.onboardingStepCompleted(token, {
      step: 1,
      question: 'mood',
      answer: pending,
      time_spent_ms: consumeStepDuration(1),
    });
    router.push('/onboarding-funnel/step-3-goal');
  };

  return (
    <FunnelLayout
      step={1}
      eyebrow="Let's start with today"
      title="How do you want to move today?"
      subtitle="There's no wrong answer. MOOD builds around it."
      ctaLabel="Continue"
      ctaDisabled={!pending}
      onCtaPress={handleContinue}
      testID="funnel-step-1"
    >
      <View style={styles.grid}>
        {MOOD_ORDER.map((id) => {
          const meta = MOOD_DISPLAY[id];
          const selected = pending === id;
          return (
            <Pressable
              key={id}
              onPress={() => handleSelect(id)}
              style={[styles.card, selected && styles.cardSelected]}
              testID={`mood-card-${id}`}
              data-testid={`mood-card-${id}`}
            >
              <LinearGradient
                colors={MOOD_ICON_GRADIENT[id]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconRing}
              >
                <Ionicons name={MOOD_ICONS[id]} size={22} color="#0c0c0c" />
              </LinearGradient>
              <Text style={styles.cardTitle}>{meta.title}</Text>
              <Text style={styles.cardSubtitle}>{meta.subtitle}</Text>
            </Pressable>
          );
        })}
      </View>
    </FunnelLayout>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 12,
    minHeight: 120,
  },
  cardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(255,215,0,0.06)',
  },
  iconRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.textTertiary,
  },
});
