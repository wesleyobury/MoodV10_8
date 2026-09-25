/**
 * MOOD V3 — Training Profile Reveal.
 *
 * Shown right after reveal-loading saves the profile. Everything on screen is
 * built from deterministic templates in utils/v3ProfileCopy.ts (no LLM) and
 * only describes behaviour the V3 generator actually has.
 *
 * Next step by mode:
 *   new     → reveal-payoff (paywall #1, post_onboarding_soft) → health → Home
 *   upgrade → Home (existing users are not re-paywalled or re-asked for health)
 *   edit    → back to Settings
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboardingFunnel } from '../../contexts/OnboardingFunnelContext';
import { Analytics } from '../../utils/analytics';
import { TrainingProfile, frequencyLabel } from '../../utils/v3Profile';
import { buildProfileReveal } from '../../utils/v3ProfileCopy';

export default function ProfileReveal() {
  const router = useRouter();
  const { token } = useAuth();
  const { answers } = useOnboardingFunnel();
  const mode = answers.v3Mode ?? 'new';

  const profile = useMemo<TrainingProfile>(
    () => ({
      training_preference: answers.trainingPreference,
      goal: answers.v3Goal,
      experience: answers.experience,
      training_frequency: answers.trainingFrequency,
      biggest_barrier: answers.barrier,
    }),
    [answers],
  );
  const reveal = useMemo(() => buildProfileReveal(profile), [profile]);

  const anims = useRef([0, 1, 2, 3, 4, 5].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Analytics.revealScreenViewed(token, {
      stage: 'profile',
      funnel_version: 'v3',
      mode,
      training_preference: profile.training_preference,
      goal: profile.goal,
      experience: profile.experience,
      training_frequency: profile.training_frequency,
      biggest_barrier: profile.biggest_barrier,
      default_direction: reveal.direction,
    });
    Animated.stagger(
      140,
      anims.map((v) => Animated.timing(v, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true })),
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onContinue = () => {
    Analytics.revealCtaTapped(token, { stage: 'profile', funnel_version: 'v3', mode });
    if (mode === 'new') router.replace('/onboarding-funnel/reveal-payoff');
    // Pop the whole edit run (upgrade + questions) back to the Settings screen.
    else if (mode === 'edit') router.dismissTo('/settings' as any);
    else router.replace('/(tabs)');
  };

  const rise = (i: number) => ({
    opacity: anims[Math.min(i, anims.length - 1)],
    transform: [{ translateY: anims[Math.min(i, anims.length - 1)].interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  });

  const cta = mode === 'new' ? 'Continue' : mode === 'edit' ? 'Done' : 'Go to MOOD';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']} testID="v3-profile-reveal">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={rise(0)}>
          <Text style={styles.eyebrow}>YOUR MOOD PROFILE</Text>
          <Text style={styles.headline}>{reveal.headline}</Text>
        </Animated.View>

        <Animated.View style={[styles.pairRow, rise(1)]}>
          <View style={styles.pairCard} testID="v3-reveal-focus">
            <Text style={styles.pairLabel}>PRIMARY FOCUS</Text>
            <Text style={styles.pairValue}>{reveal.focus}</Text>
          </View>
          <View style={styles.pairCard} testID="v3-reveal-style">
            <Text style={styles.pairLabel}>TRAINING STYLE</Text>
            <Text style={styles.pairValue}>{reveal.style}</Text>
          </View>
        </Animated.View>

        {reveal.insights.map((ins, i) => (
          <Animated.View key={ins.eyebrow} style={[styles.insight, rise(i + 2)]} testID={`v3-reveal-insight-${i}`}>
            <View style={styles.insightIcon}>
              <Ionicons name={ins.icon as any} size={18} color={COLORS.accent} />
            </View>
            <View style={styles.insightText}>
              <Text style={styles.insightEyebrow}>{ins.eyebrow}</Text>
              <Text style={styles.insightTitle}>{ins.title}</Text>
              <Text style={styles.insightBody}>{ins.body}</Text>
            </View>
          </Animated.View>
        ))}

        <Animated.Text style={[styles.foot, rise(5)]}>
          {profile.training_frequency ? `Planned around ${frequencyLabel(profile.training_frequency)}. ` : ''}
          You can update your profile anytime in Settings.
        </Animated.Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={onContinue} activeOpacity={0.85} testID="v3-profile-reveal-cta">
          <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
            <Text style={styles.btnLabel}>{cta}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24 },
  eyebrow: { fontSize: 11, letterSpacing: 2.2, color: COLORS.accent, fontWeight: '700' },
  headline: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: COLORS.textPrimary, marginTop: 10, letterSpacing: -0.4 },
  pairRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
  pairCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.28)',
  },
  pairLabel: { fontSize: 10, letterSpacing: 1.6, color: COLORS.textTertiary, fontWeight: '700' },
  pairValue: { fontSize: 16, lineHeight: 21, color: COLORS.textPrimary, fontWeight: '700', marginTop: 8 },
  insight: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  insightIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
  },
  insightText: { flex: 1 },
  insightEyebrow: { fontSize: 10, letterSpacing: 1.6, color: COLORS.accent, fontWeight: '700' },
  insightTitle: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '700', marginTop: 4 },
  insightBody: { fontSize: 13, lineHeight: 19, color: COLORS.textSecondary, marginTop: 4 },
  foot: { fontSize: 12, lineHeight: 18, color: COLORS.textTertiary, marginTop: 16 },
  footer: { paddingHorizontal: 24, paddingBottom: 10, paddingTop: 6 },
  btn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  btnLabel: { fontSize: 16, fontWeight: '700', color: COLORS.accentInk, letterSpacing: 0.3 },
});
