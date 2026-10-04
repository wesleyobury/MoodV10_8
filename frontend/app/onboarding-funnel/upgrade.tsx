/**
 * MOOD V3 — "MOOD got an upgrade" entry.
 *
 * Existing users who don't yet have a completed V3 training profile land here
 * (routed by components/V3ProfileGate). It's framed as an upgrade, not account
 * creation: 5 quick questions → reveal-loading → profile-reveal → Home. No
 * paywall, no wearables step; account, social and workout data are untouched.
 *
 * Also reused from Settings → Training Profile with `?mode=edit`, where the
 * current answers are prefilled and the user can cancel.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboardingFunnel } from '../../contexts/OnboardingFunnelContext';
import { Analytics, trackEvent } from '../../utils/analytics';
import { fetchTrainingProfile } from '../../utils/v3Profile';

const BG_VIDEO_SOURCE = require('../../assets/videos/bg.mp4');

export default function V3Upgrade() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const isEdit = params.mode === 'edit';
  const { token, user } = useAuth();
  const { setV3 } = useOnboardingFunnel();
  const [videoReady, setVideoReady] = useState(false);
  const videoOpacity = useRef(new Animated.Value(0)).current;
  const fade = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Analytics.onboardingStepViewed(token, { step: 0, question: isEdit ? 'v3_profile_edit' : 'v3_upgrade_intro', funnel_version: 'v3', mode: isEdit ? 'edit' : 'upgrade' });
    Animated.stagger(
      260,
      fade.map((v) => Animated.timing(v, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true })),
    ).start();
    // Edit mode: prefill the current profile so every answer starts where the user left it.
    if (isEdit && token) {
      fetchTrainingProfile(token).then((r) => {
        const p = r?.profile;
        if (!p) return;
        setV3({
          trainingPreference: p.training_preference,
          v3Goal: p.goal,
          experience: p.experience,
          trainingFrequency: p.training_frequency,
          barrier: p.biggest_barrier,
        });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!videoReady) return;
    Animated.timing(videoOpacity, { toValue: 1, duration: 900, useNativeDriver: true }).start();
  }, [videoReady, videoOpacity]);

  const start = () => {
    const mode = isEdit ? 'edit' : 'upgrade';
    setV3({ v3Mode: mode, v3SavedAt: undefined });
    if (token) trackEvent(token, isEdit ? 'v3_profile_edit_started' : 'v3_reonboarding_started', { funnel_version: 'v3', mode, user_id: user?.id });
    Analytics.onboardingStepCompleted(token, { step: 0, question: isEdit ? 'v3_profile_edit' : 'v3_upgrade_intro', funnel_version: 'v3', mode });
    router.push('/onboarding-funnel/v3-preference' as any);
  };

  const rise = (v: Animated.Value) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  });

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: videoOpacity }]} pointerEvents="none">
        <Video
          source={BG_VIDEO_SOURCE}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          shouldPlay
          isLooping
          isMuted
          useNativeControls={false}
          onReadyForDisplay={() => setVideoReady(true)}
        />
      </Animated.View>
      <LinearGradient
        colors={['rgba(0,0,0,0.80)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.92)'] as const}
        locations={[0, 0.5, 1] as const}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']} testID="v3-upgrade">
        <View style={styles.center}>
          <Animated.Text style={[styles.eyebrow, rise(fade[0])]}>{isEdit ? 'TRAINING PROFILE' : 'NEW IN MOOD'}</Animated.Text>
          <Animated.Text style={[styles.title, rise(fade[1])]}>
            {isEdit ? 'Update your\ntraining profile.' : 'MOOD got\nan upgrade.'}
          </Animated.Text>
          <Animated.Text style={[styles.body, rise(fade[2])]}>
            {isEdit
              ? 'Change how you train or what you’re working toward. Your workout history stays exactly as it is.'
              : 'Workouts now adapt to how you train, what you’re working toward, and how you feel today.'}
          </Animated.Text>
          {!isEdit ? (
            <Animated.Text style={[styles.sub, rise(fade[3])]}>
              Let’s set up your training profile. Five questions, about 30 seconds.
            </Animated.Text>
          ) : null}
        </View>
        <Animated.View style={[styles.footer, rise(fade[3])]}>
          <TouchableOpacity onPress={start} activeOpacity={0.85} testID="v3-upgrade-start">
            <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
              <Text style={styles.btnLabel}>{isEdit ? 'Update my profile' : 'Let’s go'}</Text>
            </LinearGradient>
          </TouchableOpacity>
          {isEdit ? (
            <TouchableOpacity onPress={() => router.back()} style={styles.cancel} testID="v3-upgrade-cancel">
              <Text style={styles.cancelLabel}>Cancel</Text>
            </TouchableOpacity>
          ) : null}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1, paddingHorizontal: 30 },
  center: { flex: 1, justifyContent: 'center' },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 2.4, color: COLORS.accent, marginBottom: 14 },
  title: { fontSize: 38, lineHeight: 44, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.6 },
  body: { marginTop: 18, fontSize: 16, lineHeight: 24, color: COLORS.textSecondary },
  sub: { marginTop: 22, fontSize: 13, lineHeight: 19, color: COLORS.textTertiary },
  footer: { paddingBottom: 10 },
  btn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  btnLabel: { fontSize: 16, fontWeight: '700', color: COLORS.accentInk, letterSpacing: 0.3 },
  cancel: { alignItems: 'center', paddingVertical: 14 },
  cancelLabel: { fontSize: 14, color: COLORS.textTertiary },
});
