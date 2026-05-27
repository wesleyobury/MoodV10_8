/**
 * Pulse Sync — first-workout completion magic moment.
 *
 * Spec §11: a one-time 2.5–3.5s celebration that fires immediately after the
 * user's very first completed workout, BEFORE the achievement screen.
 *
 * Visual sequence
 *   1) Screen dim fade (250 ms)
 *   2) Soft gold radial glow expanding from center (1.2 s)
 *   3) Medium haptic at ~600 ms into the glow (peak)
 *   4) ECG/BPM waveform stroke-dash animation L→R (1.5 s)
 *   5) BRANCH:
 *        - Wearable connected → HR drops in + recovery line + "Body responding."
 *        - No wearable       → "First session complete ⚡️"
 *   6) Auto-advance to /create-post (replacing this route) after total ~3.0 s
 *
 * Reduce-motion: if AccessibilityInfo.isReduceMotionEnabled is true, we render
 * the static success card and advance after ~900 ms — same data surface, no
 * animation.
 *
 * One-shot flag: `@mood_pulse_sync_played_v1` is written when this screen
 * mounts so repeat workouts never re-trigger it.
 *
 * The caller (workout-session.tsx) passes the full create-post params through
 * so this screen is a transparent hop.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { Analytics } from '../utils/analytics';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const FLAG_KEY = '@mood_pulse_sync_played_v1';
const GLOW_DIAMETER = Math.max(SCREEN_W, SCREEN_H) * 1.6;
const CHART_W = SCREEN_W * 0.85;
const CHART_H = 80;

/* ── Animated Path so Reanimated can drive stroke-dashoffset on the UI thread ── */
const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Deterministic ECG-ish waveform. Looks like a heart-rate trace; we don't
 *  need real data here — the wearable values render on a separate row below. */
function buildEcgPath(width: number, height: number): { d: string; length: number } {
  const cy = height / 2;
  const peaks = 6;
  let d = `M 0 ${cy}`;
  const step = width / (peaks * 4);
  let x = 0;
  for (let i = 0; i < peaks; i++) {
    // flat baseline
    d += ` L ${x + step} ${cy}`;
    x += step;
    // small bump up
    d += ` L ${x + step * 0.3} ${cy - height * 0.12}`;
    x += step * 0.3;
    // sharp spike up
    d += ` L ${x + step * 0.15} ${cy - height * 0.42}`;
    x += step * 0.15;
    // sharp dip down
    d += ` L ${x + step * 0.2} ${cy + height * 0.30}`;
    x += step * 0.2;
    // recover
    d += ` L ${x + step * 0.35} ${cy}`;
    x += step * 0.35;
    // longer flat
    d += ` L ${x + step * 2} ${cy}`;
    x += step * 2;
  }
  d += ` L ${width} ${cy}`;
  // Approximate path length for dash math. Slight over-estimate is fine since
  // the offset starts equal to the dash length (line invisible) and animates
  // to 0 (fully drawn).
  const length = width * 1.6;
  return { d, length };
}

export default function PulseSyncScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuth();

  // ── Bridge params from workout-session → create-post unchanged.
  // Pulse Sync is a transparent hop; we just forward everything.
  const passThroughParams = useMemo(() => {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (typeof v === 'string') out[k] = v;
    }
    // Strip our own params so create-post doesn't see them as workout data.
    delete out.hasWearableData;
    delete out.hrAvg;
    delete out.hrv;
    return out;
  }, [params]);

  const hasWearableData = String(params.hasWearableData ?? '') === 'true';
  const hrAvg = (() => {
    const n = parseInt(String(params.hrAvg ?? ''), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();
  const hrv = (() => {
    const n = parseInt(String(params.hrv ?? ''), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();

  const [reduceMotion, setReduceMotion] = useState(false);
  const mountedAtRef = useRef<number>(Date.now());
  const advancedRef = useRef(false);

  const ecg = useMemo(() => buildEcgPath(CHART_W, CHART_H), []);

  // Reanimated shared values
  const dim = useSharedValue(0);          // backdrop fade 0 → 1
  const glowScale = useSharedValue(0);    // radial glow 0 → 1
  const glowOpacity = useSharedValue(0);
  const dashOffset = useSharedValue(ecg.length); // ECG stroke-dash animates to 0
  const ecgOpacity = useSharedValue(0);
  const dataOpacity = useSharedValue(0);
  const dataTranslate = useSharedValue(-16); // HR drops in from above

  /** Replace ourselves with create-post and pass all session params through.
   *  Idempotent — guarded by `advancedRef` so the haptic / animation completion
   *  callbacks racing the auto-timer can't double-fire navigation. */
  const advanceToCreatePost = () => {
    if (advancedRef.current) return;
    advancedRef.current = true;
    const durationMs = Date.now() - mountedAtRef.current;
    if (token) {
      Analytics.pulseSyncPlayed(token, {
        had_wearable_data: hasWearableData,
        duration_ms: durationMs,
      });
    }
    router.replace({ pathname: '/create-post', params: passThroughParams });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Persist the one-shot flag immediately so a crash mid-animation
      // doesn't cause a replay on next workout completion.
      AsyncStorage.setItem(FLAG_KEY, 'true').catch(() => {});

      const reduce = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
      if (cancelled) return;
      setReduceMotion(reduce);

      if (reduce) {
        // Skip animation, show static success briefly, then advance.
        dim.value = 1;
        dataOpacity.value = 1;
        dataTranslate.value = 0;
        setTimeout(() => advanceToCreatePost(), 900);
        return;
      }

      // ── 1) Backdrop dim fade ─────────────────────────
      dim.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) });

      // ── 2) Radial glow expansion ──────────────────────
      glowOpacity.value = withSequence(
        withTiming(0.95, { duration: 250 }),
        withDelay(700, withTiming(0, { duration: 500 })),
      );
      glowScale.value = withTiming(1, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      });

      // ── 3) Haptic at the glow's peak (~600 ms in) ────
      // Skip on web/Expo Go web previews — Haptics is a no-op there but the
      // import still runs, so this is safe; just gate to keep logs clean.
      if (Platform.OS !== 'web') {
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }, 600);
      }

      // ── 4) ECG line draw L→R ──────────────────────────
      ecgOpacity.value = withDelay(400, withTiming(1, { duration: 200 }));
      dashOffset.value = withDelay(
        400,
        withTiming(0, { duration: 1500, easing: Easing.out(Easing.cubic) }),
      );

      // ── 5) Data reveal ────────────────────────────────
      dataOpacity.value = withDelay(
        1700,
        withTiming(1, { duration: 350 }, (finished) => {
          'worklet';
          if (!finished) return;
          // After the data has been on screen ~1500 ms, advance.
          // We use runOnJS to bounce back to the JS thread for navigation.
          runOnJS(scheduleAdvance)();
        }),
      );
      dataTranslate.value = withDelay(
        1700,
        withSpring(0, { damping: 14, stiffness: 130, mass: 0.6 }),
      );
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleAdvance = () => {
    // Hold the final frame so the user can read the values before we
    // transition to the achievement card.
    setTimeout(advanceToCreatePost, 1500);
  };

  /* ── Animated styles ── */
  const backdropStyle = useAnimatedStyle(() => ({ opacity: dim.value }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));
  const ecgWrapperStyle = useAnimatedStyle(() => ({ opacity: ecgOpacity.value }));
  const ecgPathProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));
  const dataStyle = useAnimatedStyle(() => ({
    opacity: dataOpacity.value,
    transform: [{ translateY: dataTranslate.value }],
  }));

  return (
    <View style={styles.root}>
      {/* Solid black backdrop fades in over whatever was underneath. */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.backdrop, backdropStyle]} />

      {/* Radial-ish gold glow. RN doesn't have a true radial gradient without
          a heavy SVG path, so we fake it: a soft yellow circle with a low-
          opacity LinearGradient mask gives the same perceived bloom. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.glowWrapper, glowStyle]}
      >
        <LinearGradient
          colors={[
            'rgba(255, 215, 0, 0.55)',
            'rgba(255, 215, 0, 0.18)',
            'rgba(255, 215, 0, 0.00)',
          ]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.glow}
        />
      </Animated.View>

      {/* ECG line */}
      {!reduceMotion && (
        <Animated.View style={[styles.ecgWrap, ecgWrapperStyle]}>
          <Svg width={CHART_W} height={CHART_H}>
            <Defs>
              <SvgGradient id="ecgStroke" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#FFD700" stopOpacity="0.3" />
                <Stop offset="0.5" stopColor="#FFD700" stopOpacity="1" />
                <Stop offset="1" stopColor="#FFD700" stopOpacity="0.3" />
              </SvgGradient>
            </Defs>
            <AnimatedPath
              d={ecg.d}
              stroke="url(#ecgStroke)"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={`${ecg.length} ${ecg.length}`}
              animatedProps={ecgPathProps}
            />
          </Svg>
        </Animated.View>
      )}

      {/* Data reveal */}
      <Animated.View style={[styles.dataWrap, dataStyle]}>
        {hasWearableData && hrAvg ? (
          <>
            <Text style={styles.bigNumber}>
              {hrAvg}
              <Text style={styles.bigNumberUnit}> BPM</Text>
            </Text>
            <Text style={styles.subLabel}>avg heart rate</Text>
            {hrv != null && (
              <Text style={styles.recoveryRow}>
                Recovery <Text style={styles.recoveryValue}>{hrv} ms HRV</Text>
              </Text>
            )}
            <Text style={styles.tagLine}>Body responding.</Text>
          </>
        ) : (
          <Text style={styles.fallbackLine}>First session complete ⚡️</Text>
        )}
      </Animated.View>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  glowWrapper: {
    position: 'absolute',
    width: GLOW_DIAMETER,
    height: GLOW_DIAMETER,
    borderRadius: GLOW_DIAMETER / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    width: '100%',
    height: '100%',
    borderRadius: GLOW_DIAMETER / 2,
  },
  ecgWrap: {
    position: 'absolute',
    top: SCREEN_H * 0.45 - CHART_H / 2,
    alignItems: 'center',
  },
  dataWrap: {
    position: 'absolute',
    top: SCREEN_H * 0.55,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  bigNumber: {
    fontSize: 56,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1.5,
  },
  bigNumberUnit: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1,
  },
  subLabel: {
    fontSize: 12,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginTop: 4,
    fontWeight: '600',
  },
  recoveryRow: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  recoveryValue: {
    color: '#FFD700',
    fontWeight: '700',
  },
  tagLine: {
    fontSize: 16,
    color: '#FFD700',
    marginTop: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  fallbackLine: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
});
