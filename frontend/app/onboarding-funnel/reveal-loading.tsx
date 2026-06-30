/**
 * Reveal Loading — the "analyzer".
 *
 * Replaces the old scrolling-text loader with a live synthesis moment: a
 * profile radar whose six axes map to the six onboarding screens
 * (Mood→Intensity, Goal→Strength, Level→Conditioning, Barrier→Recovery,
 * Length→Volume, +Consistency). Each axis GROWS outward in a few randomly-timed
 * steps (never bounces back), so the shape fills in organically and only locks
 * right as the reasoning finishes — then we auto-advance to reveal-payoff.
 *
 * A reasoning stream below narrates the synthesis from the user's real answers,
 * and their answers float around the radar as chips. No counts, no fake timer.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  Line,
  Polygon,
  RadialGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/brand';
import {
  FunnelAnswers,
  GOAL_LABELS,
  LEVEL_LABELS,
  MOOD_DISPLAY,
  useOnboardingFunnel,
} from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics } from '../../utils/analytics';

const AXES = ['Intensity', 'Strength', 'Conditioning', 'Recovery', 'Volume', 'Consistency'];
const CX = 125;
const CY = 125;
const R = 80;
const BASE = 0.1;
const WIN_START = 500;
const LOCK_MS = 7000;
const END_MS = 7800;

const clamp = (v: number, a = 0.05, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const easeOut = (g: number) => 1 - Math.pow(1 - g, 3);
const axisPoint = (i: number, r: number): [number, number] => [
  CX + Math.cos(-Math.PI / 2 + (i * Math.PI) / 3) * r,
  CY + Math.sin(-Math.PI / 2 + (i * Math.PI) / 3) * r,
];

/** Mapping table: each answer contributes to the six training dimensions. */
function computeProfile(answers: FunnelAnswers): number[] {
  const a = {
    mood: answers.mood ?? 'muscle',
    goal: answers.primaryGoal ?? 'consistency',
    level: answers.fitnessLevel ?? 'casual',
    barrier: answers.biggestBarrier ?? 'unsure',
    length: answers.workoutLength ?? 30,
  };
  const mood: Record<string, number> = { sweat: 0.85, muscle: 0.65, explosive: 0.95, lazy: 0.25, calisthenics: 0.6, outdoor: 0.55 };
  const goalStr: Record<string, number> = { build_strength: 0.95, improve_physique: 0.8, lose_weight: 0.4, feel_better: 0.4, stress_relief: 0.3, consistency: 0.45 };
  const level: Record<string, number> = { sedentary: 0.2, casual: 0.45, active: 0.65, athletic: 0.9 };
  const barRec: Record<string, number> = { energy: 0.85, time: 0.55, motivation: 0.45, unsure: 0.5 };
  const lenVol: Record<number, number> = { 20: 0.3, 30: 0.5, 45: 0.7, 60: 0.85, 90: 1.0 };

  const Intensity = mood[a.mood] + (a.goal === 'build_strength' || a.goal === 'improve_physique' ? 0.05 : 0) + (a.level === 'athletic' ? 0.1 : 0) - (a.barrier === 'energy' ? 0.1 : 0);
  const Strength = goalStr[a.goal] + (a.mood === 'muscle' ? 0.1 : 0) + (a.mood === 'explosive' ? 0.05 : 0);
  const Conditioning = level[a.level] + (a.mood === 'sweat' ? 0.15 : 0) + (a.mood === 'outdoor' ? 0.1 : 0) + (a.goal === 'lose_weight' ? 0.1 : 0);
  const Recovery = barRec[a.barrier] + (a.level === 'athletic' ? 0.1 : 0) + (a.length >= 60 ? 0.1 : 0) + (a.mood === 'lazy' ? 0.1 : 0);
  const Volume = (lenVol[a.length] ?? 0.5) + (a.level === 'athletic' ? 0.1 : 0) - (a.level === 'sedentary' ? 0.1 : 0) + (a.goal === 'build_strength' ? 0.05 : 0);
  const Consistency = 0.4 + (a.goal === 'consistency' ? 0.35 : 0) + (a.barrier === 'motivation' ? 0.25 : 0) + (a.length <= 30 ? 0.15 : 0) + (a.level === 'casual' || a.level === 'active' ? 0.05 : 0);
  return [Intensity, Strength, Conditioning, Recovery, Volume, Consistency].map((v) => clamp(v));
}

interface Seg { t0: number; t1: number; from: number; to: number; }

/** Monotonic growth plan: a few randomly-timed steps climbing to target. */
function planAxis(target: number): Seg[] {
  const n = 2 + Math.floor(Math.random() * 3); // 2–4 steps
  const mids = Array.from({ length: n - 1 }, () => Math.random()).sort((a, b) => a - b);
  const fracs = [...mids, 1];
  const cps = [BASE, ...fracs.map((f) => BASE + (target - BASE) * f)];
  const windowEnd = LOCK_MS - 120;
  const slot = (windowEnd - WIN_START) / n;
  const segs: Seg[] = [];
  for (let k = 0; k < n; k++) {
    const dur = 480 + Math.random() * 260;
    let t0 = WIN_START + slot * k + Math.random() * slot * 0.55;
    if (t0 + dur > windowEnd) t0 = windowEnd - dur;
    segs.push({ t0, t1: t0 + dur, from: cps[k], to: cps[k + 1] });
  }
  return segs;
}
function valueAt(segs: Seg[], el: number): { v: number; active: boolean } {
  let last = segs[0].from;
  for (const s of segs) {
    if (el >= s.t1) { last = s.to; continue; }
    if (el >= s.t0) return { v: lerp(s.from, s.to, easeOut((el - s.t0) / (s.t1 - s.t0))), active: true };
    return { v: last, active: false };
  }
  return { v: last, active: false };
}

const GOAL_SHORT: Record<string, string> = {
  feel_better: 'Feel better', build_strength: 'Build strength', improve_physique: 'Physique',
  lose_weight: 'Lose weight', stress_relief: 'Stress relief', consistency: 'Consistency',
};
const BARRIER_SHORT: Record<string, string> = {
  time: 'Limited time', energy: 'Low energy', motivation: 'Motivation', unsure: 'Need a plan',
};
const BARRIER_LINE: Record<string, string> = {
  time: 'Short on time — keeping sessions tight, decision-free',
  energy: 'Low energy — weighting recovery, easing intensity',
  motivation: 'Motivation dips — one tap to start, no blank plans',
  unsure: "Not sure what to do — we pick, you press play",
};

function buildThoughts(answers: FunnelAnswers): string[] {
  const moodLabel = answers.mood ? MOOD_DISPLAY[answers.mood].title : 'your mood';
  const goalLabel = answers.primaryGoal ? GOAL_LABELS[answers.primaryGoal].toLowerCase() : 'your goal';
  const levelLabel = answers.fitnessLevel ? LEVEL_LABELS[answers.fitnessLevel].toLowerCase() : 'your level';
  const length = answers.workoutLength ?? 30;
  return [
    'Reading your inputs…',
    `Mood ${moodLabel} · goal ${goalLabel}`,
    answers.biggestBarrier ? BARRIER_LINE[answers.biggestBarrier] : 'Working around what slows you down',
    `Calibrating to a ${levelLabel} baseline`,
    `Sizing ${length}-minute sessions`,
    'Mapping your strengths and gaps',
    'Shaping week-to-week progression',
    'Composing your program…',
  ];
}

export default function RevealLoading() {
  const router = useRouter();
  const { answers, markCompleted } = useOnboardingFunnel();
  const { token } = useAuth();

  const target = useMemo(() => computeProfile(answers), [answers]);
  const plans = useRef<Seg[][]>(AXES.map((_, i) => planAxis(target[i])));
  const thoughts = useMemo(() => buildThoughts(answers), [answers]);

  const chips = useMemo(() => {
    const length = answers.workoutLength ?? 30;
    return [
      { icon: 'flame' as const, label: answers.mood ? MOOD_DISPLAY[answers.mood].title : 'Your mood' },
      { icon: 'locate' as const, label: answers.primaryGoal ? GOAL_SHORT[answers.primaryGoal] : 'Your goal' },
      { icon: 'battery-half' as const, label: answers.biggestBarrier ? BARRIER_SHORT[answers.biggestBarrier] : 'Your level' },
      { icon: 'time-outline' as const, label: `${length} min` },
    ];
  }, [answers]);

  const [vals, setVals] = useState<number[]>(AXES.map(() => BASE));
  const [active, setActive] = useState<boolean[]>(AXES.map(() => false));
  const [lines, setLines] = useState<{ key: number; text: string }[]>([]);
  const [workLabel, setWorkLabel] = useState('Reasoning…');
  const [ready, setReady] = useState(false);

  const spin = useRef(new Animated.Value(0)).current;
  const cursor = useRef(new Animated.Value(1)).current;
  const chipAnims = useRef(chips.map(() => new Animated.Value(0))).current;

  // Slow rotation of the ring scaffold + blinking stream cursor.
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 90000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursor, { toValue: 0, duration: 1, delay: 500, useNativeDriver: true }),
        Animated.timing(cursor, { toValue: 1, duration: 1, delay: 500, useNativeDriver: true }),
      ])
    ).start();
    Animated.stagger(
      230,
      chipAnims.map((v) =>
        Animated.timing(v, { toValue: 1, duration: 450, delay: 250, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true })
      )
    ).start();
  }, [spin, cursor, chipAnims]);

  // Radar growth loop (throttled ~30fps).
  useEffect(() => {
    let raf = 0;
    let lastUpdate = 0;
    const t0 = Date.now();
    const tick = () => {
      const el = Date.now() - t0;
      if (el - lastUpdate >= 32 || el >= LOCK_MS) {
        lastUpdate = el;
        if (el >= LOCK_MS) {
          setVals(target.slice());
          setActive(AXES.map(() => false));
          return; // stop — shape locked
        }
        const nv: number[] = [];
        const na: boolean[] = [];
        for (let i = 0; i < AXES.length; i++) {
          const r = valueAt(plans.current[i], el);
          nv.push(clamp(r.v));
          na.push(r.active);
        }
        setVals(nv);
        setActive(na);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  // Reasoning stream + auto-advance.
  useEffect(() => {
    Analytics.revealScreenViewed(token, { stage: 'loading' });
    const timers: ReturnType<typeof setTimeout>[] = [];
    let i = 0;
    const emit = () => {
      setLines((prev) => {
        const next = [...prev, { key: i, text: thoughts[i] }];
        return next.slice(-4);
      });
      i++;
      if (i < thoughts.length) {
        timers.push(setTimeout(emit, 720 + Math.random() * 340));
      } else {
        setWorkLabel('Finalizing your program…');
      }
    };
    emit();

    timers.push(setTimeout(() => { setReady(true); setWorkLabel('Your plan is ready'); }, LOCK_MS + 150));
    timers.push(
      setTimeout(async () => {
        await markCompleted();
        router.replace('/onboarding-funnel/reveal-payoff');
      }, END_MS)
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const polyPoints = vals.map((v, i) => axisPoint(i, R * v).join(',')).join(' ');
  const ringPoints = (f: number) => AXES.map((_, i) => axisPoint(i, R * f).join(',')).join(' ');
  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']} testID="reveal-loading" data-testid="reveal-loading">
      <View style={styles.header}>
        <Text style={styles.eyebrow}>PERSONALIZING YOUR MOOD</Text>
        <Text style={styles.title}>Designing your program</Text>
        <Text style={styles.sub}>
          Not just your first workout — we&apos;re shaping every session, your progression, and your recovery around you.
        </Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.glow} />

        {/* Rotating ring scaffold */}
        <Animated.View style={[styles.layer, { transform: [{ rotate: spinDeg }] }]} pointerEvents="none">
          <Svg width={250} height={250} viewBox="0 0 250 250">
            {[0.4, 0.7, 1].map((f) => (
              <Polygon key={f} points={ringPoints(f)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
            ))}
            {AXES.map((_, i) => {
              const [x, y] = axisPoint(i, R);
              return <Line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />;
            })}
          </Svg>
        </Animated.View>

        {/* Radar polygon */}
        <Svg style={styles.layer} width={250} height={250} viewBox="0 0 250 250">
          <Defs>
            <RadialGradient id="fill" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={COLORS.accent} stopOpacity={0.42} />
              <Stop offset="1" stopColor={COLORS.accent} stopOpacity={0.08} />
            </RadialGradient>
          </Defs>
          {AXES.map((ax, i) => {
            const [lx, ly] = axisPoint(i, R + 18);
            return (
              <SvgText
                key={ax}
                x={lx}
                y={ly}
                fill={active[i] ? COLORS.accent : 'rgba(141,141,144,0.55)'}
                fontSize={8.5}
                textAnchor="middle"
              >
                {ax}
              </SvgText>
            );
          })}
          <Polygon points={polyPoints} fill="url(#fill)" stroke={COLORS.accent} strokeWidth={1.6} strokeLinejoin="round" />
          {vals.map((v, i) => {
            const [x, y] = axisPoint(i, R * v);
            return <Circle key={i} cx={x} cy={y} r={3} fill="#FFE08A" />;
          })}
        </Svg>

        {/* Answer chips */}
        {chips.map((c, i) => (
          <Animated.View
            key={c.label + i}
            style={[
              styles.chip,
              CHIP_POS[i],
              { opacity: chipAnims[i], transform: [{ scale: chipAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] },
            ]}
          >
            <Ionicons name={c.icon} size={13} color={COLORS.accent} />
            <Text style={styles.chipText}>{c.label}</Text>
          </Animated.View>
        ))}
      </View>

      <View style={styles.stream}>
        {lines.map((l, idx) => {
          const isLast = idx === lines.length - 1;
          return (
            <View key={l.key} style={styles.thoughtRow}>
              <Text style={[styles.cf, !isLast && styles.dim]}>›</Text>
              <Text style={[styles.tt, !isLast && styles.dim]}>{l.text}</Text>
              {isLast && !ready ? <Animated.View style={[styles.cursor, { opacity: cursor }]} /> : null}
            </View>
          );
        })}
      </View>

      <View style={styles.work}>
        {!ready ? (
          <>
            <View style={styles.workDot} />
            <View style={styles.workDot} />
            <View style={styles.workDot} />
          </>
        ) : null}
        <Text style={[styles.workLabel, ready && styles.workReady]}>{workLabel}</Text>
      </View>
    </SafeAreaView>
  );
}

const CHIP_POS = [
  { top: 4, left: 6 },
  { top: 4, right: 6 },
  { bottom: 4, left: 10 },
  { bottom: 4, right: 10 },
];

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 28, paddingTop: 12 },
  header: {},
  eyebrow: { fontSize: 11, letterSpacing: 2, color: COLORS.accent, fontWeight: '700' },
  title: { fontSize: 23, fontWeight: '700', color: COLORS.textPrimary, marginTop: 9, letterSpacing: -0.3 },
  sub: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 7, lineHeight: 18 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(244,195,22,0.07)',
  },
  layer: { position: 'absolute' },
  chip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(20,20,22,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(154,122,53,0.4)',
  },
  chipText: { fontSize: 11, color: COLORS.textPrimary },
  stream: { height: 150, justifyContent: 'flex-end' },
  thoughtRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 9 },
  cf: { color: 'rgba(244,195,22,0.6)', fontSize: 12, marginTop: 1 },
  tt: { color: COLORS.textPrimary, fontSize: 13, lineHeight: 19, flex: 1 },
  dim: { color: '#6f6f73' },
  cursor: { width: 7, height: 15, backgroundColor: COLORS.accent, marginLeft: 3, marginTop: 2 },
  work: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, minHeight: 20, paddingBottom: 8 },
  workDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent, opacity: 0.6 },
  workLabel: { fontSize: 11, color: COLORS.textSecondary },
  workReady: { color: COLORS.accent, fontWeight: '600' },
});
