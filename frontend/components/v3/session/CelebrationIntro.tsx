/**
 * The congratulations moment (founder pass 3, Oct 2026): a full-screen beat between the last set and the share screen.
 *
 * Slow, deliberate, heavy. The timeline (ms):
 *     0   black. A warm glow starts to rise behind where the medal will be (then breathes slowly while the screen is up)
 *   250   a thin gold ring draws itself around the medal spot (1.3s)
 *  1550   the ring closes: the medal lands (spring), a heavy haptic, two shockwave rings roll out, the confetti bursts
 *  1750   success haptic. A light glint sweeps across the medal
 *  1900   WORKOUT COMPLETE, then "Congratulations.", then "You finished <workout>." rise in, one after another
 *  2700   the numbers count up (minutes · sets/intervals · exercises), then the streak, then "Come back tomorrow for more."
 *  3700   "View your stats and share your workout to socials." and Continue fade in. Tap Continue (or anywhere once it is showing) and the screen lifts away into Share
 *
 * Reduced motion: no confetti, no draw or count; everything simply fades in.
 */
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../../SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../../constants/brand';
import { Confetti } from './Confetti';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const BOX = 156, R = 72, MEDAL = 104;
const CIRC = 2 * Math.PI * R;

export interface CelebrationStats {
  title: string;
  minutes: number | null;
  sets: number | null;
  intervals: number | null;
  exercises: number;
  streak: number | null;
}

function CountUp({ to, run, duration, reduce }: { to: number; run: boolean; duration: number; reduce: boolean }) {
  const [v, setV] = useState(reduce ? to : 0);
  useEffect(() => {
    if (!run || reduce) { if (reduce) setV(to); return; }
    const t0 = Date.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / duration);
      setV(Math.round(to * (1 - Math.pow(1 - p, 4))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, to, duration, reduce]);
  return <Text style={styles.statV}>{v}</Text>;
}

export function CelebrationIntro({ stats, insets, onContinue }: { stats: CelebrationStats; insets: { top: number; bottom: number }; onContinue: () => void }) {
  const { width, height } = useWindowDimensions();
  const [reduce, setReduce] = useState<boolean | null>(null);
  const [burst, setBurst] = useState(false);
  const [count, setCount] = useState(false);
  const [ready, setReady] = useState(false);
  const leaving = useRef(false);

  const glow = useRef(new Animated.Value(0)).current;
  const draw = useRef(new Animated.Value(0)).current;
  const medal = useRef(new Animated.Value(0)).current;
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const glint = useRef(new Animated.Value(0)).current;
  const eyebrow = useRef(new Animated.Value(0)).current;
  const title = useRef(new Animated.Value(0)).current;
  const sub = useRef(new Animated.Value(0)).current;
  const statsIn = useRef(new Animated.Value(0)).current;
  const streakIn = useRef(new Animated.Value(0)).current;
  const tomorrowIn = useRef(new Animated.Value(0)).current;
  const cta = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(0)).current;

  // the medal's centre sits at 30% of the screen; confetti and glow use the same point
  // shorter phones (SE / mini): the medal sits a little higher and the copy packs tighter, so nothing meets Continue
  const compact = height < 740;
  const cy = Math.round(Math.max(insets.top + 40 + BOX / 2, height * (compact ? 0.26 : 0.3)));
  const origin = { x: width / 2, y: cy };

  useEffect(() => {
    let alive = true;
    const p = AccessibilityInfo.isReduceMotionEnabled?.();
    if (p && typeof p.then === 'function') p.then((r) => alive && setReduce(!!r)).catch(() => alive && setReduce(false));
    else setReduce(false);
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (reduce == null) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));
    const ease = Easing.out(Easing.cubic);
    const t = (v: Animated.Value, duration: number, delay = 0, easing = ease) => Animated.timing(v, { toValue: 1, duration, delay, easing, useNativeDriver: true });

    if (reduce) {
      [glow, draw, medal, eyebrow, title, sub, statsIn, streakIn, tomorrowIn].forEach((v) => v.setValue(1));
      Animated.timing(cta, { toValue: 1, duration: 400, delay: 600, useNativeDriver: true }).start();
      setCount(true);
      at(600, () => setReady(true));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      return () => timers.forEach(clearTimeout);
    }

    t(glow, 1800).start(() => {
      Animated.loop(Animated.sequence([
        Animated.timing(glow, { toValue: 0.72, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])).start();
    });
    Animated.timing(draw, { toValue: 1, duration: 1300, delay: 250, easing: Easing.inOut(Easing.cubic), useNativeDriver: false }).start();
    at(1550, () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => undefined);
      setBurst(true);
      Animated.spring(medal, { toValue: 1, friction: 6, tension: 38, useNativeDriver: true }).start();
      t(wave1, 1700, 0, Easing.out(Easing.quad)).start();
      t(wave2, 2000, 220, Easing.out(Easing.quad)).start();
    });
    at(1750, () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined));
    t(glint, 1000, 1950, Easing.inOut(Easing.quad)).start();
    t(eyebrow, 700, 1900).start();
    t(title, 900, 2100).start();
    t(sub, 800, 2400).start();
    t(statsIn, 800, 2700).start();
    at(2750, () => setCount(true));
    t(streakIn, 700, 3300).start();
    t(tomorrowIn, 700, 3500).start();
    t(cta, 700, 3700).start();
    at(3700, () => setReady(true));
    return () => timers.forEach(clearTimeout);
  }, [reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  const leave = () => {
    if (leaving.current) return;
    leaving.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    Animated.timing(exit, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start(() => onContinue());
  };

  const rise = (v: Animated.Value, by = 14) => ({ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [by, 0] }) }] });
  const wave = (v: Animated.Value, to: number, peak: number) => ({
    opacity: v.interpolate({ inputRange: [0, 0.08, 1], outputRange: [0, peak, 0] }),
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, to] }) }],
  });

  const second = stats.sets ? { v: stats.sets, k: stats.sets === 1 ? 'SET' : 'SETS' } : stats.intervals ? { v: stats.intervals, k: stats.intervals === 1 ? 'INTERVAL' : 'INTERVALS' } : null;
  const cells = [
    stats.minutes != null ? { v: stats.minutes, k: 'MINUTES' } : null,
    second,
    stats.exercises ? { v: stats.exercises, k: stats.exercises === 1 ? 'EXERCISE' : 'EXERCISES' } : null,
  ].filter(Boolean) as { v: number; k: string }[];

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.root, {
        opacity: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
        transform: [{ scale: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
      }]}
      testID="v3-complete-celebration"
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={ready ? leave : undefined} accessible={false}>
        {/* warm glow behind the medal (a sparse layout, so glow is allowed here) */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: glow }]}>
          <Svg width={width} height={height}>
            <Defs>
              <RadialGradient id="celebGlow" cx={width / 2} cy={cy} rx={width * 0.85} ry={width * 0.85} gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor="#F4C316" stopOpacity="0.22" />
                <Stop offset="0.35" stopColor="#C9862A" stopOpacity="0.08" />
                <Stop offset="1" stopColor="#000000" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width={width} height={height} fill="url(#celebGlow)" />
          </Svg>
        </Animated.View>

        {/* medal */}
        <View pointerEvents="none" style={[styles.medalBox, { top: cy - BOX / 2, left: width / 2 - BOX / 2 }]}>
          <Animated.View style={[styles.wave, wave(wave1, 2.7, 0.55)]} />
          <Animated.View style={[styles.wave, { borderWidth: 1 }, wave(wave2, 3.4, 0.3)]} />
          <Svg width={BOX} height={BOX} style={StyleSheet.absoluteFill as any}>
            <Defs>
              <SvgGradient id="celebRing" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#FFF1B8" />
                <Stop offset="0.45" stopColor="#FFD700" />
                <Stop offset="1" stopColor="#B8860B" />
              </SvgGradient>
            </Defs>
            <Circle cx={BOX / 2} cy={BOX / 2} r={R} stroke="rgba(255,255,255,0.07)" strokeWidth={2} fill="none" />
            <AnimatedCircle
              cx={BOX / 2} cy={BOX / 2} r={R} stroke="url(#celebRing)" strokeWidth={2.5} fill="none" strokeLinecap="round"
              strokeDasharray={`${CIRC} ${CIRC}`}
              strokeDashoffset={draw.interpolate({ inputRange: [0, 1], outputRange: [CIRC, 0] }) as any}
              transform={`rotate(-90 ${BOX / 2} ${BOX / 2})`}
            />
          </Svg>
          <Animated.View style={[styles.medal, {
            opacity: medal.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
            transform: [{ scale: medal.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }],
          }]}>
            <LinearGradient colors={['#FFE45C', COLORS.accent, COLORS.accentTrail]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.medalFill as any}>
              <Ionicons name="checkmark" size={50} color={COLORS.accentInk} />
              <Animated.View style={[styles.glint, { transform: [{ translateX: glint.interpolate({ inputRange: [0, 1], outputRange: [-MEDAL, MEDAL * 1.2] }) }, { skewX: '-22deg' }] }]}>
                <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 } as any} />
              </Animated.View>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* words + numbers */}
        <View pointerEvents="none" style={[styles.copy, { top: cy + BOX / 2 + 22 }]}>
          <Animated.Text style={[styles.eyebrow, rise(eyebrow, 8)]}>WORKOUT COMPLETE</Animated.Text>
          <Animated.Text style={[styles.title, rise(title, 18)]} testID="v3-celebration-title" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>Congratulations.</Animated.Text>
          <Animated.Text style={[styles.sub, rise(sub, 10)]} numberOfLines={2}>{`You finished ${stats.title}.`}</Animated.Text>
          {cells.length ? (
            <Animated.View style={[styles.stats, compact && { marginTop: 20 }, rise(statsIn, 12)]} testID="v3-celebration-stats">
              {cells.map((c, i) => (
                <React.Fragment key={c.k}>
                  {i > 0 ? <View style={styles.statDivider} /> : null}
                  <View style={styles.stat}>
                    <CountUp to={c.v} run={count} duration={1300} reduce={!!reduce} />
                    <Text style={styles.statK}>{c.k}</Text>
                  </View>
                </React.Fragment>
              ))}
            </Animated.View>
          ) : null}
          {stats.streak && stats.streak > 0 ? (
            <Animated.View style={[styles.streak, compact && { marginTop: 12 }, rise(streakIn, 8)]} testID="v3-celebration-streak">
              <Ionicons name="flame" size={14} color={COLORS.accent} />
              <Text style={styles.streakText}>{`${stats.streak}-day streak`}</Text>
            </Animated.View>
          ) : null}
          <Animated.Text style={[styles.tomorrow, compact && { marginTop: 10 }, rise(tomorrowIn, 8)]} testID="v3-celebration-tomorrow">Come back tomorrow for more.</Animated.Text>
        </View>

        <Animated.View style={[styles.ctaWrap, { paddingBottom: insets.bottom + 16 }, rise(cta, 10)]} pointerEvents={ready ? 'auto' : 'none'}>
          <Text style={styles.ctaHint}>View your stats and share your workout to socials.</Text>
          <Pressable onPress={leave} testID="v3-complete-continue" style={({ pressed }) => [pressed && { transform: [{ scale: 0.98 }], opacity: 0.92 }]}>
            <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta as any}>
              <Text style={styles.ctaText}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color={COLORS.accentInk} />
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </Pressable>
      <Confetti origin={burst ? origin : null} fire={burst} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: COLORS.bg, zIndex: 20, elevation: 20 },
  medalBox: { position: 'absolute', width: BOX, height: BOX, alignItems: 'center', justifyContent: 'center' },
  wave: { position: 'absolute', width: MEDAL, height: MEDAL, borderRadius: MEDAL / 2, borderWidth: 1.5, borderColor: '#FFD700' },
  medal: { width: MEDAL, height: MEDAL, borderRadius: MEDAL / 2, shadowColor: '#FFB000', shadowOpacity: 0.45, shadowRadius: 24, shadowOffset: { width: 0, height: 0 }, elevation: 12 },
  medalFill: { flex: 1, borderRadius: MEDAL / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  glint: { position: 'absolute', top: -20, bottom: -20, left: 0, width: 36 },
  copy: { position: 'absolute', left: 28, right: 28, alignItems: 'center' },
  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 3.6, color: COLORS.accent },
  title: { fontSize: 42, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1.3, marginTop: 12, textAlign: 'center' },
  sub: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.66)', marginTop: 8, textAlign: 'center', lineHeight: 22 },
  stats: { flexDirection: 'row', alignItems: 'center', marginTop: 30, paddingVertical: 16, paddingHorizontal: 8, alignSelf: 'stretch', borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)' },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginVertical: 6, backgroundColor: 'rgba(255,255,255,0.14)' },
  statV: { fontSize: 36, fontWeight: '200', color: '#FFFFFF', letterSpacing: -1.2, fontVariant: ['tabular-nums'] },
  statK: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.6, color: 'rgba(255,255,255,0.45)', marginTop: 4 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18, paddingHorizontal: 14, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)' },
  tomorrow: { fontSize: 15, fontWeight: '600', color: 'rgba(255,250,242,0.78)', marginTop: 16, textAlign: 'center' },
  streakText: { fontSize: 13.5, fontWeight: '700', color: '#FFFFFF' },
  ctaWrap: { position: 'absolute', left: 20, right: 20, bottom: 0 },
  ctaHint: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.62)', textAlign: 'center', marginBottom: 14, lineHeight: 20 },
  cta: { height: 58, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { fontSize: 17, fontWeight: '800', color: COLORS.accentInk },
});
