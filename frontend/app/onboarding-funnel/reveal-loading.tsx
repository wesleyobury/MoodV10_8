/**
 * Reveal Loading — cinematic 5–10s pause after Step 8.
 *
 * Three lines fade in/out (~2.5s each), each personalized to the user's
 * funnel answers. No spinners, no percentages. A slow gradient pulse plays
 * behind the title using the brand gold→orange accent at low opacity.
 *
 * On completion → reveal-payoff.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import {
  GOAL_LABELS,
  LEVEL_LABELS,
  MOOD_DISPLAY,
  useOnboardingFunnel,
} from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics } from '../../utils/analytics';

const LINE_DURATION_MS = 2500;

export default function RevealLoading() {
  const router = useRouter();
  const { answers, markCompleted } = useOnboardingFunnel();
  const { token, user } = useAuth();

  const firstName =
    (user?.name && user.name.split(' ')[0]) || user?.username || 'Athlete';

  const lines = useMemo(() => {
    const goal = answers.primaryGoal ? GOAL_LABELS[answers.primaryGoal].toLowerCase() : 'your goal';
    const level = answers.fitnessLevel ? LEVEL_LABELS[answers.fitnessLevel].toLowerCase() : 'where you are';
    const length = answers.workoutLength ?? 30;
    const mood = answers.mood ? MOOD_DISPLAY[answers.mood].title.toLowerCase() : 'your mood';
    return [
      `Tuning for ${goal}…`,
      `Calibrating to ${level}…`,
      `Loading ${length}-minute ${mood} workouts…`,
    ];
  }, [answers]);

  const [idx, setIdx] = useState(0);
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  // Background gradient pulse — slow, never bouncy.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  // Cycle through 3 lines, then route on.
  useEffect(() => {
    let cancelled = false;
    Analytics.revealScreenViewed(token, { stage: 'loading' });

    const runLine = (i: number) => {
      fade.setValue(0);
      Animated.sequence([
        Animated.timing(fade, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(LINE_DURATION_MS - 1000),
        Animated.timing(fade, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (cancelled || !finished) return;
        if (i + 1 < lines.length) {
          setIdx(i + 1);
          runLine(i + 1);
        } else {
          // Persist completion and route on.
          (async () => {
            await markCompleted();
            if (!cancelled) router.replace('/onboarding-funnel/reveal-payoff');
          })();
        }
      });
    };

    runLine(0);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.18] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] });

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']} testID="reveal-loading" data-testid="reveal-loading">
      <Animated.View
        pointerEvents="none"
        style={[styles.pulse, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]}
      >
        <LinearGradient
          colors={BRAND_GRADIENT}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.8, y: 0.8 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={styles.center}>
        <Text style={styles.title}>Building {firstName}&apos;s MOOD profile…</Text>
        <Animated.Text style={[styles.line, { opacity: fade }]}>{lines[idx]}</Animated.Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  pulse: {
    position: 'absolute',
    width: 420,
    height: 420,
    borderRadius: 210,
    overflow: 'hidden',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 36,
    textAlign: 'center',
  },
  line: {
    fontSize: 16,
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
    minHeight: 24,
    textAlign: 'center',
  },
});
