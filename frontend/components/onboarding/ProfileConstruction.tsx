/**
 * V3 profile construction (route: /onboarding-funnel/reveal-loading when V3 answers exist).
 *
 * Not a fake "analyzing…" loader: it locks in, one by one, the actual settings MOOD derived from the answers
 * (utils/v3ProfileCopy profileConclusions — Strength-first training ✓, Advanced exercise pool ✓, 3–4× weekly ✓ …)
 * while the profile radar fills in. Meanwhile the profile is saved (PUT /api/users/me/training-profile), the
 * first-Home handoff + completion markers are written, then it resolves into the profile reveal. Nothing here implies
 * an LLM or analysis that isn't happening; the timing exists so each conclusion can be read.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../constants/brand';
import { useOnboardingFunnel } from '../../contexts/OnboardingFunnelContext';
import { useAuth } from '../../contexts/AuthContext';
import { Analytics, trackEvent } from '../../utils/analytics';
import { Direction, TrainingProfile, markV3ProfileDone, saveTrainingProfile, writeFirstHomeHandoff } from '../../utils/v3Profile';
import { RADAR_AXES, profileConclusions, radarValues } from '../../utils/v3ProfileCopy';
import { ProfileRadar } from './ProfileRadar';
import { OnboardingImageWarmup } from './OnboardingImageWarmup';
import { warmOnboardingImages } from './onboardingImages';

const START_MS = 450;
const STEP_MS = 640;
const CHECK_DELAY_MS = 260;
const HOLD_MS = 650; // the finished profile holds a beat before the reveal

/** Which radar axes each conclusion fills (Strength, Conditioning, Power, Experience, Frequency, Variety). */
const AXES_FOR: Record<string, number[]> = { direction: [0, 1, 2], goal: [0, 1, 2], experience: [3], frequency: [4], barrier: [5] };

export function ProfileConstruction() {
  const router = useRouter();
  const { answers, markCompleted, setV3 } = useOnboardingFunnel();
  const { token, user } = useAuth();
  const mode = answers.v3Mode ?? 'new';

  const profile = useMemo<TrainingProfile>(
    () => ({
      training_preference: answers.trainingPreference,
      goal: answers.v3Goal,
      experience: answers.experience,
      training_frequency: answers.trainingFrequency,
      biggest_barrier: answers.barrier,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const conclusions = useMemo(() => profileConclusions(profile, answers.experienceDetail), [profile, answers.experienceDetail]);
  const target = useMemo(() => radarValues(profile), [profile]);

  const [locked, setLocked] = useState(0); // rows whose check has landed
  const [shown, setShown] = useState(0); // rows visible
  const [saved, setSaved] = useState(false);
  const rowAnims = useRef(conclusions.map(() => new Animated.Value(0))).current;
  const checkAnims = useRef(conclusions.map(() => new Animated.Value(0))).current;
  const [grow, setGrow] = useState<number[]>(RADAR_AXES.map(() => 0.06));
  const latest = useRef({ token, user, mode });
  latest.current = { token, user, mode };

  // Radar: each axis eases toward the share of its conclusions that are locked.
  useEffect(() => {
    const goal = RADAR_AXES.map((_, ax) => {
      const owners = conclusions.map((c, i) => ({ c, i })).filter(({ c }) => (AXES_FOR[c.id] ?? []).includes(ax));
      if (!owners.length) return target[ax];
      const done = owners.filter(({ i }) => i < locked).length / owners.length;
      return 0.06 + (target[ax] - 0.06) * done;
    });
    let raf = 0;
    const from = grow.slice();
    const t0 = Date.now();
    const tickFn = () => {
      const u = Math.min(1, (Date.now() - t0) / 420);
      const e = 1 - Math.pow(1 - u, 3);
      setGrow(from.map((f, i) => f + (goal[i] - f) * e));
      if (u < 1) raf = requestAnimationFrame(tickFn);
    };
    raf = requestAnimationFrame(tickFn);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked]);

  /** Save the profile; never blocks the user (V3ProfileGate retries a failed PUT on the next Home visit). */
  const save = async (): Promise<void> => {
    const { token: tk, user: u, mode: m } = latest.current;
    const source = m === 'new' ? 'onboarding_v3' : m === 'upgrade' ? 'reonboarding_v3' : 'user_edit';
    let serverDir: Direction | undefined;
    let ok = false;
    if (tk) {
      try {
        const res = await saveTrainingProfile(tk, { ...profile, profile_source: source });
        ok = !!res?.complete;
        serverDir = res?.default_direction;
      } catch {
        ok = false;
      }
    }
    if (u?.id) {
      if (ok) await markV3ProfileDone(u.id);
      if (m !== 'edit') await writeFirstHomeHandoff(u.id, profile, m, serverDir);
    }
    setV3({ v3SavedAt: ok ? new Date().toISOString() : undefined });
    if (tk) {
      trackEvent(tk, 'v3_training_profile_saved', {
        funnel_version: 'v3', funnel_design: 'v3_premium_oct26', mode: m, profile_source: source, saved: ok,
        training_preference: profile.training_preference, goal: profile.goal, experience: profile.experience,
        experience_detail: answers.experienceDetail, training_frequency: profile.training_frequency,
        biggest_barrier: profile.biggest_barrier, default_direction: serverDir,
      });
    }
    if (m === 'new') await markCompleted();
  };

  useEffect(() => {
    Analytics.revealScreenViewed(token, { stage: 'loading', funnel_version: 'v3', mode, funnel_design: 'v3_premium_oct26' });
    warmOnboardingImages(); // the reveal card's photo
    const timers: ReturnType<typeof setTimeout>[] = [];
    conclusions.forEach((_, i) => {
      const at = START_MS + i * STEP_MS;
      timers.push(setTimeout(() => {
        setShown(i + 1);
        Animated.timing(rowAnims[i], { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      }, at));
      timers.push(setTimeout(() => {
        setLocked(i + 1);
        Haptics.selectionAsync().catch(() => undefined);
        Animated.spring(checkAnims[i], { toValue: 1, friction: 5, tension: 160, useNativeDriver: true }).start();
      }, at + CHECK_DELAY_MS));
    });
    const doneAt = START_MS + conclusions.length * STEP_MS + HOLD_MS;
    const minWait = new Promise<void>((r) => timers.push(setTimeout(r, doneAt)));
    let alive = true;
    Promise.all([save(), minWait]).then(() => {
      if (!alive) return;
      setSaved(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      timers.push(setTimeout(() => router.replace('/onboarding-funnel/profile-reveal' as any), 420));
    });
    return () => { alive = false; timers.forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeAxes = conclusions.slice(0, locked).flatMap((c) => AXES_FOR[c.id] ?? []);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']} testID="reveal-loading" data-testid="reveal-loading">
      <OnboardingImageWarmup />
      <Text style={styles.eyebrow}>BUILDING YOUR TRAINING PROFILE</Text>
      <Text style={styles.title}>Here's what MOOD learned.</Text>

      <View style={styles.radarWrap}>
        <View style={styles.glow} />
        <ProfileRadar values={grow} axes={RADAR_AXES} size={236} active={activeAxes} />
      </View>

      <View style={styles.list} testID="v3-construction-list">
        {conclusions.map((c, i) => (
          <Animated.View
            key={c.id}
            style={[
              styles.row,
              { opacity: rowAnims[i], transform: [{ translateY: rowAnims[i].interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] },
            ]}
            testID={`v3-conclusion-${c.id}`}
          >
            <Text style={[styles.rowText, i < locked && styles.rowTextLocked]}>{c.label}</Text>
            <Animated.View style={[styles.check, { opacity: checkAnims[i], transform: [{ scale: checkAnims[i].interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }]}>
              <Ionicons name="checkmark" size={13} color={COLORS.accentInk} />
            </Animated.View>
          </Animated.View>
        ))}
      </View>

      <Text style={[styles.status, saved && styles.statusDone]} testID="v3-construction-status">
        {saved ? 'Profile ready' : shown < conclusions.length ? 'Locking in your settings' : 'Saving your profile'}
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 28, paddingTop: 18 },
  eyebrow: { fontSize: 11, letterSpacing: 2.2, color: COLORS.accent, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.textPrimary, marginTop: 10, letterSpacing: -0.6 },
  radarWrap: { alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  glow: { position: 'absolute', width: 170, height: 170, borderRadius: 85, backgroundColor: 'rgba(255,200,40,0.06)' },
  list: { flex: 1, marginTop: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)',
  },
  rowText: { flex: 1, fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.55)', letterSpacing: -0.2 },
  rowTextLocked: { color: COLORS.textPrimary },
  check: { width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  status: { fontSize: 12, letterSpacing: 1.4, textTransform: 'uppercase', color: COLORS.textTertiary, fontWeight: '600', paddingBottom: 12 },
  statusDone: { color: COLORS.accent },
});
