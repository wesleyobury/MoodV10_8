/**
 * Funnel — cinematic intro (standalone, before the profile questions).
 *
 * Sells the promise, not the questionnaire: "Your workout should change when you do." The landing-page background
 * video stays (brand continuity) under a scrim; the MOOD wordmark resolves, the promise lands, and a quiet ticker
 * shows MOOD's core behaviour in one line at a time: a state appears, then "adjusted." (the six real V3 States, in
 * human words). CTA: "Build my MOOD".
 *
 * Intentionally NOT a numbered step — it sits in front of the profile, like a title card before the show.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboardingFunnel } from '../../contexts/OnboardingFunnelContext';
import { Analytics } from '../../utils/analytics';
import { V3_ONBOARDING_ENABLED } from '../../utils/v3Profile';
import { warmOnboardingImages } from '../../components/onboarding/onboardingImages';
import { OnboardingImageWarmup } from '../../components/onboarding/OnboardingImageWarmup';

const BG_VIDEO_SOURCE = require('../../assets/videos/bg.mp4');

export default function FunnelIntro() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { answers, setFirstName, setV3 } = useOnboardingFunnel();

  // Carry the user's name through the whole funnel from the very start:
  // Google gives us a real name; manual signups have a display name or
  // username. Only Apple relay accounts (apple_user_*) have nothing — they
  // get the dedicated name-capture screen later.
  useEffect(() => {
    if (answers.firstName?.trim()) return;
    const uname =
      user?.username && !user.username.toLowerCase().startsWith('apple_user')
        ? user.username.trim()
        : '';
    const first = user?.name?.trim().split(' ')[0] || uname;
    if (first) setFirstName(first);
  }, [answers.firstName, user?.name, user?.username, setFirstName]);
  const [videoReady, setVideoReady] = useState(false);

  const videoOpacity = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const head = useRef(new Animated.Value(0)).current;
  const sub = useRef(new Animated.Value(0)).current;
  const ticker = useRef(new Animated.Value(0)).current;
  const begin = useRef(new Animated.Value(0)).current;
  // ticker: the state word, then "adjusted."
  const stateIn = useRef(new Animated.Value(0)).current;
  const adjIn = useRef(new Animated.Value(0)).current;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    Analytics.onboardingStepViewed(token, { step: 0, question: 'intro', funnel_design: 'v3_premium_oct26' });
    warmOnboardingImages(); // step 1's cards must appear instantly
    const mk = (v: Animated.Value, delay: number, duration: number) =>
      Animated.timing(v, { toValue: 1, delay, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    Animated.parallel([
      mk(word, 250, 1100),
      mk(head, 1000, 900),
      mk(sub, 1650, 800),
      mk(ticker, 2250, 600),
      mk(begin, 2700, 700),
    ]).start();
  }, [token, word, head, sub, ticker, begin]);

  // One state at a time: the state lands, a beat later MOOD answers "adjusted.", hold, fade, next.
  useEffect(() => {
    stateIn.setValue(0);
    adjIn.setValue(0);
    const seq = Animated.sequence([
      Animated.delay(tick === 0 ? 2350 : 0),
      Animated.timing(stateIn, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(380),
      Animated.timing(adjIn, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.delay(1250),
      Animated.parallel([
        Animated.timing(stateIn, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(adjIn, { toValue: 0, duration: 260, useNativeDriver: true }),
      ]),
    ]);
    seq.start(({ finished }) => { if (finished) setTick((t) => t + 1); });
    return () => seq.stop();
  }, [tick, stateIn, adjIn]);
  const state = TICKER_STATES[tick % TICKER_STATES.length];

  useEffect(() => {
    if (!videoReady) return;
    Animated.timing(videoOpacity, { toValue: 1, duration: 900, useNativeDriver: true }).start();
  }, [videoReady, videoOpacity]);

  const handleBegin = () => {
    if (V3_ONBOARDING_ENABLED) {
      // MOOD V3: training-profile funnel (preference, goal, experience, frequency, barrier).
      setV3({ v3Mode: 'new' });
      Analytics.onboardingStepCompleted(token, { step: 0, question: 'intro', funnel_version: 'v3', mode: 'new', funnel_design: 'v3_premium_oct26' });
      router.push('/onboarding-funnel/v3-preference' as any);
      return;
    }
    Analytics.onboardingStepCompleted(token, { step: 0, question: 'intro' });
    router.push('/onboarding-funnel/step-1-mood');
  };

  const rise = (v: Animated.Value, dist = 12) => ({
    opacity: v,
    transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [dist, 0] }) }],
  });

  return (
    <View style={styles.root}>
      {/* Landing-page background video, dimmed */}
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
        colors={['rgba(0,0,0,0.78)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.9)'] as const}
        locations={[0, 0.5, 1] as const}
        style={styles.scrim}
      />

      <OnboardingImageWarmup />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']} testID="funnel-intro">
        <Animated.Text
          style={[
            styles.word,
            { opacity: word, transform: [{ scale: word.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1] }) }] },
          ]}
        >
          MOOD
        </Animated.Text>

        <View style={styles.center}>
          <Animated.Text style={[styles.headline, rise(head, 14)]}>
            Your workout should change when you do.
          </Animated.Text>
          <Animated.Text style={[styles.support, rise(sub, 10)]}>
            MOOD builds your training around you: your goals, your level, and how you show up today.
          </Animated.Text>

          <Animated.View style={[styles.ticker, { opacity: ticker }]} testID="funnel-intro-ticker">
            <Animated.Text style={[styles.tickState, { opacity: stateIn, transform: [{ translateY: stateIn.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }]}>
              {state}
            </Animated.Text>
            <Animated.View style={[styles.tickAdj, { opacity: adjIn, transform: [{ translateX: adjIn.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] }]}>
              <Text style={styles.tickArrow}>→</Text>
              <Text style={styles.tickAdjusted}>adjusted.</Text>
            </Animated.View>
          </Animated.View>
        </View>

        <Animated.View style={[styles.footer, rise(begin)]}>
          <TouchableOpacity onPress={handleBegin} activeOpacity={0.85} testID="funnel-intro-begin">
            <LinearGradient
              colors={[...BRAND_GRADIENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.beginBtn}
            >
              <Text style={styles.beginLabel}>Build my MOOD  →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

/** The six V3 daily States in human words (Amped -> "Feeling unstoppable"). */
const TICKER_STATES = ['Low energy', 'Feeling unstoppable', 'Stressed', 'Sore', 'Bored', 'Irritated'];

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  safe: { flex: 1, paddingHorizontal: 28 },
  word: { marginTop: 18, alignSelf: 'center', fontSize: 22, fontWeight: '700', letterSpacing: 9, paddingLeft: 9, color: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'flex-end', paddingBottom: 34 },
  headline: { fontSize: 38, lineHeight: 43, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1 },
  support: { marginTop: 16, fontSize: 15.5, lineHeight: 23, color: 'rgba(255,255,255,0.74)', maxWidth: 340 },
  ticker: { marginTop: 30, height: 26, flexDirection: 'row', alignItems: 'center' },
  tickState: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', letterSpacing: -0.1 },
  tickAdj: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  tickArrow: { fontSize: 15, color: 'rgba(255,255,255,0.45)', marginRight: 8 },
  tickAdjusted: { fontSize: 15, fontWeight: '700', color: COLORS.accent, letterSpacing: -0.1 },
  footer: { paddingBottom: 10 },
  beginBtn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  beginLabel: { fontSize: 16.5, fontWeight: '800', color: COLORS.accentInk, letterSpacing: 0.2 },
});
