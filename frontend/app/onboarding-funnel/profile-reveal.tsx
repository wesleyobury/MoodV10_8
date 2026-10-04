/**
 * MOOD V3 — Training Profile Reveal: the "we got you" moment.
 *
 * A screenshot-worthy profile card (name, archetype, one-line identity, radar, primary direction, training summary)
 * and, the part that matters most, WHAT MOOD WILL DO DIFFERENTLY FOR YOU: three lines on how sessions change with the
 * athlete's daily state, led by their own barrier. Everything is built from deterministic templates in
 * utils/v3ProfileCopy.ts (no LLM) and only describes behaviour the V3 generator actually has.
 *
 * NO PAYWALL. The CTA moves the athlete into MOOD:
 *   new      "Build my first workout" -> Home (stack root) -> Build (opened once via the first-Home handoff)
 *            -> Cart -> Start (workout #1 is free; the paywall is on STARTING workout #2, utils/v3Session/access.ts)
 *   upgrade  "Build today's workout"  -> same
 *   edit     "Done"                   -> back to Settings
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboardingFunnel } from '../../contexts/OnboardingFunnelContext';
import { Analytics } from '../../utils/analytics';
import { TrainingProfile, markFirstWorkoutPending, requestFirstBuildLaunch } from '../../utils/v3Profile';
import { RADAR_AXES, profileIdentity, radarValues } from '../../utils/v3ProfileCopy';
import { ProfileRadar } from '../../components/onboarding/ProfileRadar';
import { DIRECTION_IMAGE, ONB_ASPECT } from '../../components/onboarding/onboardingImages';

const PAD_X = 20;
const HERO_H = 290;
/** The photo is drawn at full card width and anchored near its top, so heads stay in frame (cover would centre-crop). */
const PHOTO_TOP_SHIFT = 0.02;

export default function ProfileReveal() {
  const router = useRouter();
  const { token, user } = useAuth();
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
  const firstName = useMemo(() => {
    const uname = user?.username && !user.username.toLowerCase().startsWith('apple_user') ? user.username : '';
    return answers.firstName?.trim() || user?.name?.trim().split(' ')[0] || uname || '';
  }, [answers.firstName, user?.name, user?.username]);
  const id = useMemo(() => profileIdentity(profile, { firstName, detail: answers.experienceDetail }), [profile, firstName, answers.experienceDetail]);
  const radar = useMemo(() => radarValues(profile), [profile]);

  const { width: winW } = useWindowDimensions();
  const cardW = winW - PAD_X * 2;
  const photoH = Math.max(HERO_H, cardW * ONB_ASPECT);
  const card = useRef(new Animated.Value(0)).current;
  const anims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Analytics.revealScreenViewed(token, {
      stage: 'profile',
      funnel_version: 'v3',
      funnel_design: 'v3_premium_oct26',
      mode,
      training_preference: profile.training_preference,
      goal: profile.goal,
      experience: profile.experience,
      experience_detail: answers.experienceDetail,
      training_frequency: profile.training_frequency,
      biggest_barrier: profile.biggest_barrier,
      default_direction: id.direction,
      archetype: id.archetype,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    Animated.sequence([
      Animated.timing(card, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.stagger(
        150,
        anims.map((v) => Animated.timing(v, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true })),
      ),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `onboarding_completed` used to fire on arrival at reveal-payoff (the old paywall screen). That screen is no longer
  // on the path, so the reveal is now "done": fire once, on arrival, for signups. Waits for the auth token (a null
  // token would 401 and the event would be lost; see the long note that lived in reveal-payoff.tsx).
  const completedRef = useRef(false);
  useEffect(() => {
    if (mode !== 'new' || completedRef.current || !token) return;
    completedRef.current = true;
    Analytics.onboardingCompleted(token, {
      funnel_version: 'v3',
      funnel_design: 'v3_premium_oct26',
      mode,
      paywall_in_onboarding: false,
      training_preference: profile.training_preference,
      goal: profile.goal,
      experience: profile.experience,
      experience_detail: answers.experienceDetail,
      training_frequency: profile.training_frequency,
      v3_biggest_barrier: profile.biggest_barrier,
      v3_profile_saved: !!answers.v3SavedAt,
      archetype: id.archetype,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onContinue = async () => {
    Analytics.revealCtaTapped(token, { stage: 'profile', funnel_version: 'v3', mode, cta: mode === 'edit' ? 'done' : 'build_first_workout' });
    if (mode === 'edit') {
      // Pop the whole edit run (upgrade + questions) back to the Settings screen.
      router.dismissTo('/settings' as any);
      return;
    }
    if (user?.id) {
      await requestFirstBuildLaunch(user.id);
      // Wearables / founding-offer prompts wait until workout #1 is done (utils/v3Profile isFirstWorkoutPending).
      if (mode === 'new') await markFirstWorkoutPending(user.id);
    }
    // Home becomes the stack root and opens Build on arrival, so Back from Build (and Done after the session) is Home.
    router.replace('/(tabs)');
  };

  const rise = (i: number) => ({
    opacity: anims[i],
    transform: [{ translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  });
  const cta = mode === 'edit' ? 'Done' : mode === 'upgrade' ? 'Build today’s workout' : 'Build my first workout';

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']} testID="v3-profile-reveal">
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.Text style={[styles.hero, { opacity: card }]} testID="v3-reveal-hero">Your profile</Animated.Text>
        <Animated.View
          style={[styles.card, { opacity: card, transform: [{ scale: card.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }] }]}
          testID="v3-reveal-card"
        >
          <ImageBackground
            source={DIRECTION_IMAGE[id.direction]}
            resizeMode="cover"
            fadeDuration={0}
            style={styles.cardHero}
            imageStyle={[styles.cardHeroImg, { width: cardW, height: photoH, top: -photoH * PHOTO_TOP_SHIFT, bottom: undefined }]}
          >
            <LinearGradient colors={['rgba(14,12,10,0.2)', 'rgba(14,12,10,0.55)', '#0E0C0A']} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFillObject as any} />
            <View style={styles.cardTop}>
              <Text style={styles.eyebrow} numberOfLines={1}>{id.eyebrow}</Text>
              <Text style={styles.wordmark}>MOOD</Text>
            </View>
            <View style={styles.cardHeroText}>
              <Text style={styles.archetype} testID="v3-reveal-archetype">{id.archetype.toUpperCase()}</Text>
              <Text style={styles.tagline}>{id.tagline}</Text>
            </View>
          </ImageBackground>

          <View style={styles.cardBody}>
            <View style={styles.radarRow}>
              <ProfileRadar values={radar} axes={RADAR_AXES} size={190} />
            </View>
            <View style={styles.attrs}>
              <View style={styles.attrLine} testID="v3-reveal-direction">
                <Text style={styles.attrLabel}>PRIMARY DIRECTION</Text>
                <Text style={styles.attrValue}>{id.primaryDirection}</Text>
              </View>
              <View style={styles.attrBlock} testID="v3-reveal-training">
                <Text style={styles.attrLabel}>YOUR TRAINING</Text>
                <View style={styles.chips}>
                  {id.training.map((t) => (
                    <View key={t} style={styles.chip}>
                      <Text style={styles.chipText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.Text style={[styles.sectionLabel, rise(0)]}>WHAT MOOD WILL DO DIFFERENTLY FOR YOU</Animated.Text>
        {id.adaptations.map((a, i) => (
          <Animated.View key={a.when} style={[styles.adapt, i === 0 && styles.adaptFirst, rise(i + 1)]} testID={`v3-reveal-adaptation-${i}`}>
            <Text style={styles.adaptWhen}>{a.when}</Text>
            <Text style={styles.adaptDoes}>{a.does}</Text>
          </Animated.View>
        ))}
        <Animated.Text style={[styles.foot, rise(4)]}>Your profile sets the baseline. Every day, how you show up adjusts it.</Animated.Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={onContinue} activeOpacity={0.85} testID="v3-profile-reveal-cta">
          <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
            <Text style={styles.btnLabel}>{cta}{mode === 'edit' ? '' : '  →'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingHorizontal: PAD_X, paddingTop: 6, paddingBottom: 24 },
  hero: { fontSize: 34, lineHeight: 40, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.8, marginBottom: 12 },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#0E0C0A',
    borderWidth: 1,
    borderColor: 'rgba(255,200,60,0.32)',
  },
  cardHero: { height: HERO_H, justifyContent: 'space-between', overflow: 'hidden' },
  cardHeroImg: { opacity: 0.95 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  eyebrow: { flex: 1, fontSize: 10.5, letterSpacing: 2, color: COLORS.accent, fontWeight: '800', marginRight: 12 },
  wordmark: { fontSize: 11, letterSpacing: 4, color: 'rgba(255,255,255,0.75)', fontWeight: '700' },
  cardHeroText: { paddingHorizontal: 18, paddingBottom: 6 },
  archetype: { fontSize: 31, lineHeight: 34, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.6 },
  tagline: { marginTop: 10, fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.8)' },
  cardBody: { paddingHorizontal: 18, paddingBottom: 14 },
  // the radar's own canvas has ~20 px of empty space above STRENGTH and below EXPERIENCE: trim it so the
  // "What MOOD will do differently" section starts above the fold
  radarRow: { alignItems: 'center', marginTop: -16, marginBottom: -18 },
  attrs: { marginTop: 0, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)' },
  attrLine: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  attrBlock: { marginTop: 10 },
  attrLabel: { fontSize: 9.5, letterSpacing: 1.6, color: COLORS.textTertiary, fontWeight: '700' },
  attrValue: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.04)' },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  sectionLabel: { marginTop: 18, marginBottom: 2, fontSize: 11, letterSpacing: 2, color: COLORS.accent, fontWeight: '800' },
  adapt: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' },
  adaptFirst: {},
  adaptWhen: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.2 },
  adaptDoes: { marginTop: 5, fontSize: 14, lineHeight: 20, color: COLORS.textSecondary },
  foot: { fontSize: 12.5, lineHeight: 18, color: COLORS.textTertiary, marginTop: 16 },
  footer: { paddingHorizontal: 20, paddingBottom: 10, paddingTop: 8 },
  btn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  btnLabel: { fontSize: 16.5, fontWeight: '800', color: COLORS.accentInk, letterSpacing: 0.2 },
});
