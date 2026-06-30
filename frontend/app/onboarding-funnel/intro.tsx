/**
 * Funnel — cinematic intro (standalone, before Step 1).
 *
 * The user's first real entry into MOOD. A slow "lights-up" entrance: a warm
 * gold bloom rises, a hairline draws, the MOOD wordmark resolves, a one-line
 * promise fades in, then a snapshot of what's ahead (mood → goal → plan) and
 * the "answer a few quick questions" framing, before a Begin CTA into Step 1.
 *
 * Intentionally NOT a numbered funnel step — it sits in front of the Step X / 6
 * sequence, like a title card before the show.
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics } from '../../utils/analytics';

const AHEAD: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'happy-outline', label: 'Your mood' },
  { icon: 'locate-outline', label: 'Your goal' },
  { icon: 'barbell-outline', label: 'Your plan' },
];

export default function FunnelIntro() {
  const router = useRouter();
  const { token } = useAuth();

  const glow = useRef(new Animated.Value(0)).current;
  const hair = useRef(new Animated.Value(0)).current;
  const word = useRef(new Animated.Value(0)).current;
  const tag = useRef(new Animated.Value(0)).current;
  const ahead = useRef(new Animated.Value(0)).current;
  const chipVals = useRef(AHEAD.map(() => new Animated.Value(0))).current;
  const qline = useRef(new Animated.Value(0)).current;
  const begin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Analytics.onboardingStepViewed(token, { step: 0, question: 'intro' });
    const mk = (v: Animated.Value, delay: number, duration: number) =>
      Animated.timing(v, {
        toValue: 1,
        delay,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });
    Animated.parallel([
      mk(glow, 0, 1700),
      mk(hair, 450, 1200),
      mk(word, 750, 1300),
      mk(tag, 1850, 950),
      mk(ahead, 2550, 600),
      ...chipVals.map((v, i) => mk(v, 2650 + i * 230, 520)),
      mk(qline, 3550, 850),
      mk(begin, 4050, 750),
    ]).start();
  }, [token, glow, hair, word, tag, ahead, chipVals, qline, begin]);

  const handleBegin = () => {
    Analytics.onboardingStepCompleted(token, { step: 0, question: 'intro' });
    router.push('/onboarding-funnel/step-1-mood');
  };

  const rise = (v: Animated.Value, dist = 10) => ({
    opacity: v,
    transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [dist, 0] }) },
    ],
  });

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']} testID="funnel-intro">
      {/* Ambient gold bloom rising behind the wordmark */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.22] }),
            transform: [
              { scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={[...BRAND_GRADIENT]}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.8, y: 0.8 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      <View style={styles.center}>
        <Animated.View
          style={[
            styles.hairline,
            {
              opacity: hair,
              transform: [
                { scaleX: hair.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
              ],
            },
          ]}
        />
        <Animated.Text
          style={[
            styles.word,
            {
              opacity: word,
              transform: [
                { scale: word.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1] }) },
              ],
            },
          ]}
        >
          MOOD
        </Animated.Text>
        <Animated.Text style={[styles.tag, { opacity: tag }]}>
          Training that matches how you feel.
        </Animated.Text>

        <Animated.View style={[styles.ahead, { opacity: ahead }]}>
          {AHEAD.map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 ? (
                <Ionicons name="chevron-forward" size={14} color="rgba(244,195,22,0.5)" />
              ) : null}
              <Animated.View style={[styles.chip, rise(chipVals[i], 8)]}>
                <View style={styles.chipRing}>
                  <Ionicons name={s.icon} size={20} color={COLORS.accent} />
                </View>
                <Text style={styles.chipLabel}>{s.label}</Text>
              </Animated.View>
            </React.Fragment>
          ))}
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Animated.Text style={[styles.qline, { opacity: qline }]}>
          Answer a few quick questions so we can personalize your entire experience.
        </Animated.Text>
        <Animated.View style={rise(begin, 12)}>
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
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 28,
  },
  glow: {
    position: 'absolute',
    alignSelf: 'center',
    top: '24%',
    width: 320,
    height: 320,
    borderRadius: 160,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hairline: {
    width: 120,
    height: 1,
    backgroundColor: COLORS.accent,
    opacity: 0.5,
    marginBottom: 26,
  },
  word: {
    fontSize: 44,
    fontWeight: '700',
    letterSpacing: 10,
    paddingLeft: 10,
    color: '#FFFFFF',
  },
  tag: {
    marginTop: 18,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  ahead: {
    marginTop: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chip: {
    alignItems: 'center',
    gap: 7,
  },
  chipRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,20,22,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(244,195,22,0.28)',
  },
  chipLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  footer: {
    paddingBottom: 8,
  },
  qline: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  beginBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beginLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.accentInk,
    letterSpacing: 0.3,
  },
});
