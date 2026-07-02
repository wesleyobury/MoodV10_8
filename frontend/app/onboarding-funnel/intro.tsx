/**
 * Funnel — cinematic intro (standalone, before Step 1).
 *
 * The user's first real entry into MOOD. Reuses the landing-page background
 * video for brand continuity, dimmed under a scrim, with a slow "lights-up"
 * reveal: the MOOD wordmark resolves, a one-line promise fades in, an abstract
 * three-step progress cue + the "answer a few quick questions" framing, then a
 * Begin CTA into Step 1.
 *
 * Intentionally NOT a numbered funnel step — it sits in front of the Step X / 6
 * sequence, like a title card before the show.
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

const BG_VIDEO_SOURCE = require('../../assets/videos/bg.mp4');

export default function FunnelIntro() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { answers, setFirstName } = useOnboardingFunnel();

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
  const tag = useRef(new Animated.Value(0)).current;
  const segs = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const qline = useRef(new Animated.Value(0)).current;
  const begin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Analytics.onboardingStepViewed(token, { step: 0, question: 'intro' });
    const mk = (v: Animated.Value, delay: number, duration: number) =>
      Animated.timing(v, { toValue: 1, delay, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    Animated.parallel([
      mk(word, 500, 1300),
      mk(tag, 1600, 950),
      ...segs.map((v, i) => mk(v, 2400 + i * 320, 420)),
      mk(qline, 3500, 850),
      mk(begin, 4000, 750),
    ]).start();
  }, [token, word, tag, segs, qline, begin]);

  useEffect(() => {
    if (!videoReady) return;
    Animated.timing(videoOpacity, { toValue: 1, duration: 900, useNativeDriver: true }).start();
  }, [videoReady, videoOpacity]);

  const handleBegin = () => {
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

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']} testID="funnel-intro">
        <View style={styles.center}>
          <Animated.Text
            style={[
              styles.word,
              { opacity: word, transform: [{ scale: word.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1] }) }] },
            ]}
          >
            MOOD
          </Animated.Text>
          <Animated.Text style={[styles.tag, { opacity: tag }]}>
            Training that matches how you feel.
          </Animated.Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.segs}>
            {segs.map((v, i) => (
              <View key={i} style={styles.segTrack}>
                <Animated.View style={[styles.segFill, { opacity: v }]} />
              </View>
            ))}
          </View>
          <Animated.Text style={[styles.qline, { opacity: qline }]}>
            A few quick questions to personalize your entire experience.
          </Animated.Text>
          <Animated.View style={rise(begin)}>
            <TouchableOpacity onPress={handleBegin} activeOpacity={0.85} testID="funnel-intro-begin">
              <LinearGradient
                colors={[...BRAND_GRADIENT]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.beginBtn}
              >
                <Text style={styles.beginLabel}>Begin</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  safe: { flex: 1, paddingHorizontal: 30 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  word: { fontSize: 46, fontWeight: '700', letterSpacing: 12, paddingLeft: 12, color: '#FFFFFF' },
  tag: { marginTop: 18, fontSize: 15, color: 'rgba(255,255,255,0.82)', textAlign: 'center' },
  footer: { paddingBottom: 10 },
  segs: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 12 },
  segTrack: { width: 40, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.14)', overflow: 'hidden' },
  segFill: { flex: 1, backgroundColor: COLORS.accent, borderRadius: 2 },
  qline: {
    fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.72)', textAlign: 'center',
    marginBottom: 18, paddingHorizontal: 6,
  },
  beginBtn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  beginLabel: { fontSize: 16, fontWeight: '700', color: COLORS.accentInk, letterSpacing: 0.3 },
});
