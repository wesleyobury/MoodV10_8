/**
 * V3Home: MOOD Home (H1). The Today Hero is the dominant object; generation lives on the Build screen (/v3/build).
 *
 *   TODAY HERO (full first screen)
 *     premium Direction portrait · date · greeting · one line of real context (first visit / real workout streak)
 *     A. nothing built today     "Anything affecting your workout today?" optional State chips (Sore -> body map) -> Build -> /v3/build
 *     B. built today             Today's Workout (title · Direction · ~estimated min · States) -> Open Workout -> Cart
 *                                the chips stay; if they no longer match the workout, the secondary action says so
 *     C. Continue / Done         NOT implemented: needs the V3 Guided Session + completion. See `heroMode` below.
 *   SHUFFLE (top right)          B: Different Workout on today's workout (same inputs, never a State change);
 *                                A: one-tap MOOD's Pick with the Home selection. Spins while building; repeat taps ignored.
 *   QUICK STARTS slot (H3)       reserved directly under the hero; renders nothing yet
 *
 * Home never exposes Direction, Focus, Length or Difficulty. State is the one MOOD-specific input here, it is optional
 * (max 3) and it persists for the day (utils/v3Today readDayStates / writeDayStates). Sore opens the body map.
 * Today's workout is only offered when the running engine built it (never an older engine's cached output).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeLinearGradient as LinearGradient } from '../SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import { useAuth } from '../../contexts/AuthContext';
import { trackEvent } from '../../utils/analytics';
import { authFetch } from '../../utils/api';
import { FirstHomeHandoff, consumeFirstHomeHandoff, fetchTrainingProfile, readFirstHomeHandoff } from '../../utils/v3Profile';
import { EXPECTED_ENGINE_PHASE, V3Direction, V3SoreRegion, V3State, generateV3Workout, getV3Version, localDateISO, swapV3Workout } from '../../utils/v3Api';
import {
  BARRIER_BANNER,
  BarrierKey,
  MAX_STATES,
  STATES,
  defaultDuration,
  greeting,
  heroContextLine,
  heroDefaultSummary,
  sameStates,
  sameSoreness,
  soreSummary,
  statesLabel,
  HOME_STATE_PROMPT,
  HOME_STATE_CAPTION,
  buildRequest,
  initialInputs,
  requestSignature,
} from '../../utils/v3HomeModel';
import { V3DayStates, V3TodayEntry, readDayStates, readLastDirection, readToday, updateTodayEnvelope, writeDayStates, writeLastDirection, writeToday } from '../../utils/v3Today';
import { V3_HOME_HERO } from '../../utils/cartHero';
import { previewTitle } from '../../utils/v3PreviewFormat';
import { V3Chip } from './V3Chip';
import { BodyMapSheet } from './BodyMapSheet';
import { HeroImage } from './HeroImage';
import { V3_ASSETS } from './v3Images';

declare const __DEV__: boolean;

const VALID_STATES = new Set<string>(STATES.map((s) => s.id));

/** Hero modes. 'continue' and 'done' are the Guided Session's extension points (not reachable yet). */
export type HeroMode = 'build' | 'today' | 'continue' | 'done';

function dateEyebrow(d = new Date()): string {
  const wd = d.toLocaleDateString('en-US', { weekday: 'long' });
  const md = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${wd} · ${md}`.toUpperCase();
}

function haptic() {
  Haptics.selectionAsync().catch(() => {});
}

export default function V3Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const uid = user?.id ?? null;

  const [ready, setReady] = useState(false);
  const [day, setDay] = useState<V3DayStates | null>(null);
  const [handoff, setHandoff] = useState<FirstHomeHandoff | null>(null);
  const [today, setToday] = useState<V3TodayEntry | null>(null);
  const [direction, setDirectionState] = useState<V3Direction>('strength');
  const [duration, setDuration] = useState<30 | 60>(60);
  const [streak, setStreak] = useState<number | null>(null);
  const [engine, setEngine] = useState<{ engine_phase: string; engine_build: string } | null | undefined>(undefined);
  const [stateHint, setStateHint] = useState(false);
  const [heroHeight, setHeroHeight] = useState(0);
  const [mapOpen, setMapOpen] = useState(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spin = useRef(new Animated.Value(0)).current;
  const heroFade = useRef(new Animated.Value(1)).current;
  const summaryFade = useRef(new Animated.Value(1)).current;

  const track = useCallback(
    (name: string, meta: Record<string, any> = {}) => {
      if (token) trackEvent(token, name, { home_version: 'v3_h1', ...meta });
    },
    [token],
  );

  /* ---------------------------------------------------------------- data (mount + every focus) */
  const load = useCallback(async () => {
    if (!uid) return;
    const date = localDateISO();
    const [h, last, t, ds] = await Promise.all([readFirstHomeHandoff(uid), readLastDirection(uid), readToday(uid, date), readDayStates(uid, date)]);
    const pending = h && h.pending ? h : null;
    // First visit: the onboarding barrier prefill shows as pre-selected chips (removable), until the user sets their own.
    let states = ds;
    if (!ds.set && pending?.prefill?.states?.length) {
      states = { ...ds, states: pending.prefill.states.filter((s) => VALID_STATES.has(s)) as V3State[] };
    }
    setHandoff(pending);
    setToday(t);
    setDay(states);
    setDirectionState(last ?? (pending?.default_direction as V3Direction) ?? 'strength');
    setDuration(defaultDuration(null, pending?.default_duration));
    setReady(true);
    return { last, pending, t };
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    (async () => {
      const r = await load();
      if (!alive || !r) return;
      track('v3_home_viewed', {
        first_visit: !!r.pending,
        has_today_workout: !!r.t,
        direction: r.last ?? r.pending?.default_direction ?? 'strength',
        direction_source: r.last ? 'last_used' : r.pending ? 'handoff' : 'fallback',
      });
      if (!token) return;
      const [prof, ach] = await Promise.all([
        fetchTrainingProfile(token),
        authFetch<{ workout_streak?: number }>('/api/achievements/state', token).catch(() => null),
      ]);
      if (!alive) return;
      if (prof) {
        setDuration(defaultDuration(prof.profile?.default_duration as any, r.pending?.default_duration));
        if (!r.last && prof.default_direction) setDirectionState(prof.default_direction as V3Direction);
      }
      const s = ach && (ach as any).ok ? (ach as any).data?.workout_streak : null;
      setStreak(typeof s === 'number' ? s : null);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // Back from Build / Cart: pick up a new build, a swap, a changed Direction or States edited on Build.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    let alive = true;
    getV3Version(token ?? null).then((v) => alive && setEngine(v));
    return () => {
      alive = false;
    };
  }, [token]);

  useEffect(() => () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  /* ---------------------------------------------------------------- derived */
  const states = useMemo(() => day?.states ?? [], [day]);
  const todayWorkout = today?.envelope.workout ?? null;
  const todayCurrent = !!todayWorkout && !!engine && today?.envelope.engine?.build === engine.engine_build;
  const mode: HeroMode = todayCurrent ? 'today' : 'build';
  const heroDirection: V3Direction = mode === 'today' && todayWorkout ? todayWorkout.direction : direction;
  const firstVisit = !!handoff;
  const context = heroContextLine({ firstVisit, workoutStreak: streak });
  const barrier = (handoff?.prefill?.copy_key ?? null) as BarrierKey | null;
  const prefillHint = barrier && (handoff?.prefill?.states?.length ?? 0) > 0 && !day?.set ? BARRIER_BANNER[barrier] : null;
  // Does today's selection still describe the workout on screen? States AND sore areas must match.
  const statesMatchToday = !!todayWorkout && sameStates(states, todayWorkout.states) && sameSoreness(day?.soreness ?? [], todayWorkout.soreness?.regions ?? []);
  const staleBackend = typeof __DEV__ !== 'undefined' && __DEV__ && engine !== undefined && (!engine || engine.engine_phase !== EXPECTED_ENGINE_PHASE);

  const summary = useMemo(() => {
    const s = statesLabel(states);
    return [heroDefaultSummary(direction, duration), s].filter(Boolean).join(' · ');
  }, [direction, duration, states]);

  // Subtle text transition when the summary line changes.
  const lastSummary = useRef(summary);
  useEffect(() => {
    if (lastSummary.current === summary) return;
    lastSummary.current = summary;
    summaryFade.setValue(0.25);
    Animated.timing(summaryFade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [summary, summaryFade]);

  /* ---------------------------------------------------------------- actions */
  const flashHint = () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    setStateHint(true);
    hintTimer.current = setTimeout(() => setStateHint(false), 2600);
  };

  const onToggleState = (id: V3State) => {
    if (!uid || !day) return;
    const on = states.includes(id);
    if (!on && states.length >= MAX_STATES) {
      flashHint();
      track('v3_state_limit_reached', { state: id, surface: 'home' });
      return;
    }
    haptic();
    // Sore opens the body map right away; it becomes selected only once at least one area is chosen.
    if (id === 'sore' && !on) {
      track('v3_body_map_opened', { surface: 'home', source: 'sore_chip' });
      setMapOpen(true);
      return;
    }
    const next: V3DayStates = {
      ...day,
      states: on ? states.filter((s) => s !== id) : [...states, id],
      soreness: id === 'sore' && on ? [] : day.soreness,
      set: true,
    };
    setDay(next);
    writeDayStates(uid, next);
    track('v3_state_toggled', { state: id, selected: !on, count: next.states.length, surface: 'home', hero_mode: mode });
  };

  const onMapDone = (regions: V3SoreRegion[]) => {
    setMapOpen(false);
    if (!uid || !day) return;
    const withSore = day.states.includes('sore') ? day.states : [...day.states, 'sore' as V3State];
    const next: V3DayStates = { ...day, states: withSore, soreness: regions, set: true };
    setDay(next);
    writeDayStates(uid, next);
    track('v3_soreness_changed', { surface: 'home', soreness: regions });
  };

  const onMapCancel = () => {
    setMapOpen(false);
    track('v3_body_map_cancelled', { surface: 'home', kept: states.includes('sore') });
  };

  const openBuild = (source: string) => {
    track('v3_build_opened', { source, hero_mode: mode, states, states_match_today: mode === 'today' ? statesMatchToday : null });
    router.push('/v3/build' as any);
  };

  const openToday = () => {
    if (!today) return;
    track('v3_workout_reopened', { workout_id: today.workout_id, source: 'home_hero' });
    router.push({ pathname: '/v3/workout', params: { id: today.workout_id } } as any);
  };

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };

  /**
   * Shuffle: "give me another workout" in one tap.
   *   Today's workout exists -> the existing Different Workout (swap-workout): same Direction, Target / Focus, duration, States,
   *     soreness and profile inputs; the engine varies the session / archetype within its allowed rotation. The States are the
   *     workout's own (server state), so Shuffle can never add, remove or change a State.
   *   Nothing built yet -> one-tap MOOD's Pick with the Home selection (Direction, today's States + sore areas, default length).
   */
  const onShuffle = async () => {
    if (shuffling || !token || !uid || !day) return;
    haptic();
    const t0 = Date.now();
    const fadeOut = Animated.timing(heroFade, { toValue: 0.35, duration: 180, useNativeDriver: true });
    const fadeIn = () => Animated.timing(heroFade, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    setShuffling(true);
    spin.setValue(0);
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 900, useNativeDriver: true }));
    loop.start();
    try {
      if (mode === 'today' && today) {
        fadeOut.start();
        track('v3_home_shuffle', { mode: 'today', workout_id: today.workout_id, states: todayWorkout?.states ?? [] });
        const res = await swapV3Workout(token, today.workout_id);
        if (!res.ok) { showToast(res.error.message || 'Could not shuffle right now.'); return; }
        const env = res.envelope;
        if (env.status === 'conflict' || !env.workout) {
          showToast('No other version fits today, so this one stays.');
          track('v3_home_shuffle_outcome', { outcome: 'conflict', code: env.conflict?.code ?? null });
          return;
        }
        await updateTodayEnvelope(uid, env);
        setToday({ ...today, envelope: env, saved_at: new Date().toISOString() });
        track('v3_home_shuffle_outcome', { outcome: 'ok', archetype: env.workout.archetype.id, version: env.workout.version, ms: Date.now() - t0 });
      } else {
        if (states.includes('sore') && !day.soreness.length) { setMapOpen(true); return; }
        fadeOut.start();
        const date = localDateISO();
        const req = buildRequest({ ...initialInputs(direction, { states, duration }), soreness: [...day.soreness] }, date);
        track('v3_home_shuffle', { mode: 'build', direction: req.direction, states: req.states, soreness: req.soreness, duration: req.duration });
        const res = await generateV3Workout(token, req);
        if (!res.ok) { showToast(res.error.message || 'Could not build right now.'); return; }
        const env = res.envelope;
        if (env.status === 'conflict' || !env.workout) {
          showToast(env.conflict?.message || 'MOOD could not build that one. Try Build instead.');
          track('v3_home_shuffle_outcome', { outcome: 'conflict', code: env.conflict?.code ?? null });
          return;
        }
        writeDayStates(uid, { ...day, set: true });
        await writeLastDirection(uid, direction);
        const entry: V3TodayEntry = { date, workout_id: env.workout.workout_id as string, signature: requestSignature(req), request: req, envelope: env, saved_at: new Date().toISOString(), source: 'build' };
        await writeToday(uid, entry);
        if (handoff) { await consumeFirstHomeHandoff(uid); setHandoff(null); }
        setToday(entry);
        track('v3_home_shuffle_outcome', { outcome: 'ok', archetype: env.workout.archetype.id, version: 1, ms: Date.now() - t0 });
      }
    } finally {
      loop.stop();
      spin.setValue(0);
      fadeIn();
      setShuffling(false);
    }
  };

  const onLayout = (e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h && Math.abs(h - heroHeight) > 1) setHeroHeight(h);
  };

  /* ---------------------------------------------------------------- render */
  if (!ready || !day) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  const heroKey = V3_HOME_HERO[heroDirection] ?? 'strength';
  const chips = (
    <View style={styles.chipGrid}>
      {STATES.map((s) => (
        <V3Chip
          key={s.id}
          label={s.label}
          selected={states.includes(s.id)}
          muted={!states.includes(s.id) && states.length >= MAX_STATES}
          block
          quiet
          size="sm"
          style={styles.chipCell}
          onPress={() => onToggleState(s.id)}
          testID={`v3-state-${s.id}`}
        />
      ))}
    </View>
  );
  const soreLine =
    states.includes('sore') && day.soreness.length ? (
      <Pressable onPress={() => setMapOpen(true)} hitSlop={6} style={styles.soreLine} testID="v3-home-sore-summary">
        <View style={styles.soreDot} />
        <Text style={styles.soreText} numberOfLines={1}>
          {soreSummary(day.soreness)}
        </Text>
        <Text style={styles.soreEdit}>Edit</Text>
      </Pressable>
    ) : null;

  return (
    <View style={styles.root} testID="v3-home">
      <ScrollView onLayout={onLayout} bounces showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {/* ============================================================ TODAY HERO */}
        <View style={[styles.hero, { minHeight: Math.max(heroHeight, 600) }]} testID={`v3-hero-${mode}`}>
          <HeroImage source={V3_ASSETS[heroKey]} imageKey={heroKey} style={StyleSheet.absoluteFillObject as any} />

          <View style={[styles.heroTop, { paddingTop: insets.top + 12 }]}>
            <Text style={styles.eyebrow}>{dateEyebrow()}</Text>
            <Pressable
              onPress={onShuffle}
              disabled={shuffling}
              hitSlop={10}
              style={({ pressed }) => [styles.shuffle, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={mode === 'today' ? 'Shuffle: another workout like this one' : "Shuffle: build MOOD's Pick now"}
              testID="v3-home-shuffle"
            >
              <Animated.View style={{ transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
                <Ionicons name={shuffling ? 'sync' : 'shuffle'} size={19} color={COLORS.textPrimary} />
              </Animated.View>
            </Pressable>
          </View>
          {toast ? (
            <View style={[styles.toast, { top: insets.top + 58 }]} pointerEvents="none" testID="v3-home-toast">
              <Text style={styles.toastText}>{toast}</Text>
            </View>
          ) : null}

          <View style={styles.heroBody}>
            <Text style={[styles.greeting, mode === 'today' && styles.greetingSmall]} testID="v3-hero-greeting">
              {greeting(user?.name)}
            </Text>
            {context ? (
              <Text style={styles.context} testID="v3-hero-context">
                {context}
              </Text>
            ) : null}

            {staleBackend ? (
              <Text style={styles.devWarn} testID="v3-dev-stale-backend">
                DEV: backend engine is {engine ? engine.engine_phase : 'unreachable'} (app expects {EXPECTED_ENGINE_PHASE}). Restart uvicorn.
              </Text>
            ) : null}

            {mode === 'today' && todayWorkout ? (
              /* ---------------- B. Today's workout */
              <View style={styles.todayBlock} testID="v3-hero-today">
                <Animated.View style={{ opacity: heroFade }}>
                  <Text style={styles.todayEyebrow}>TODAY’S WORKOUT</Text>
                  <Text style={styles.todayTitle} numberOfLines={2} testID="v3-hero-today-title">
                    {previewTitle(todayWorkout)}
                  </Text>
                  <Text style={styles.todayMeta} testID="v3-hero-today-meta">
                    {[todayWorkout.direction_name, `~${Math.round(todayWorkout.duration.estimated_minutes)} min`, statesLabel(todayWorkout.states) || null]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </Animated.View>
                {statesMatchToday ? (
                  <Pressable onPress={openToday} testID="v3-hero-open" style={({ pressed }) => [styles.ctaWrap, pressed && styles.pressed]}>
                    <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
                      <Text style={styles.ctaText}>Open Workout</Text>
                      <Ionicons name="arrow-forward" size={18} color={COLORS.accentInk} />
                    </LinearGradient>
                  </Pressable>
                ) : (
                  // The selection changed: this workout is still here, one tap away, but the gold action is the rebuild below.
                  <Pressable onPress={openToday} testID="v3-hero-open" style={({ pressed }) => [styles.openQuiet, pressed && styles.pressed]}>
                    <Text style={styles.secondaryText}>Open this workout</Text>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.textPrimary} />
                  </Pressable>
                )}

                <View style={styles.rule} />
                <View style={styles.qHead}>
                  <Text style={styles.qSmall}>{HOME_STATE_PROMPT}</Text>
                </View>
                <Text style={styles.caption}>{stateHint ? `Up to ${MAX_STATES}` : HOME_STATE_CAPTION}</Text>
                {chips}
                {soreLine}
                {statesMatchToday ? (
                  <Pressable
                    onPress={() => openBuild('hero_build_different')}
                    style={({ pressed }) => [styles.secondary, styles.secondaryLit, pressed && styles.pressed]}
                    testID="v3-hero-build-different"
                  >
                    <Ionicons name="add" size={17} color={COLORS.accent} />
                    <Text style={styles.secondaryText}>Build a different workout</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => openBuild('hero_rebuild_for_states')} testID="v3-hero-build-different" style={({ pressed }) => [styles.ctaWrap, pressed && styles.pressed]}>
                    <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
                      <Ionicons name="refresh" size={17} color={COLORS.accentInk} />
                      <Text style={styles.ctaText}>Build for how you feel now</Text>
                    </LinearGradient>
                  </Pressable>
                )}
              </View>
            ) : (
              /* ---------------- A. Nothing built today */
              <View testID="v3-hero-build">
                <View style={styles.qHead}>
                  <Text style={styles.question}>{HOME_STATE_PROMPT}</Text>
                </View>
                <Text style={styles.caption} testID="v3-home-state-caption">
                  {stateHint ? `Up to ${MAX_STATES}. Tap one to remove it.` : HOME_STATE_CAPTION}
                </Text>
                {chips}
                {soreLine}
                {prefillHint ? (
                  <Text style={styles.prefill} testID="v3-prefill-hint">
                    {prefillHint.body}
                  </Text>
                ) : null}
                <Pressable onPress={() => openBuild('hero_cta')} testID="v3-hero-build-cta" style={({ pressed }) => [styles.ctaWrap, pressed && styles.pressed]}>
                  <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
                    <Text style={styles.ctaText}>Build Today’s Workout</Text>
                    <Ionicons name="arrow-forward" size={18} color={COLORS.accentInk} />
                  </LinearGradient>
                </Pressable>
                <Pressable onPress={() => openBuild('hero_summary')} hitSlop={8} testID="v3-hero-summary">
                  <Animated.Text style={[styles.summary, { opacity: summaryFade }]} numberOfLines={1}>
                    {summary}
                  </Animated.Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* ============================================================ QUICK STARTS (H3) */}
        {/* Reserved: a horizontal preset carousel slots in here, directly under the hero, with no layout rework. */}
        <QuickStartsSlot />
      </ScrollView>
      <BodyMapSheet visible={mapOpen} initial={day.soreness} onDone={onMapDone} onCancel={onMapCancel} />
    </View>
  );
}

/** H3 extension point. Returns nothing until Quick Starts ship. */
function QuickStartsSlot() {
  return null;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },

  hero: { justifyContent: 'space-between' },
  heroTop: { paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shuffle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,10,10,0.42)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  toast: {
    position: 'absolute',
    left: 22,
    right: 22,
    zIndex: 5,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(20,20,20,0.94)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  toastText: { fontSize: 13.5, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
  eyebrow: { fontSize: 11.5, fontWeight: '700', letterSpacing: 2, color: 'rgba(255,255,255,0.78)' },
  heroBody: { paddingHorizontal: 20, paddingBottom: 22 },

  greeting: { fontSize: 36, lineHeight: 41, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.9 },
  greetingSmall: { fontSize: 22, lineHeight: 27, letterSpacing: -0.4 },
  context: { fontSize: 15, lineHeight: 21, color: 'rgba(255,255,255,0.78)', marginTop: 6, fontWeight: '500' },
  devWarn: { fontSize: 11.5, lineHeight: 16, color: '#ff8a80', fontWeight: '600', marginTop: 8 },

  qHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 26 },
  question: { fontSize: 19, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.2 },
  qSmall: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  caption: { fontSize: 12.5, color: 'rgba(255,255,255,0.55)', marginTop: 4 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chipCell: { flexGrow: 1, flexBasis: '30%' },
  prefill: { fontSize: 12.5, lineHeight: 18, color: 'rgba(255,255,255,0.6)', marginTop: 10 },

  ctaWrap: { marginTop: 18 },
  cta: { height: 58, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { fontSize: 17, fontWeight: '800', color: COLORS.accentInk, letterSpacing: 0.2 },
  summary: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.62)', textAlign: 'center', marginTop: 12 },

  todayBlock: { marginTop: 22 },
  todayEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.8, color: COLORS.accent },
  todayTitle: { fontSize: 34, lineHeight: 39, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.8, marginTop: 6 },
  todayMeta: { fontSize: 14.5, color: 'rgba(255,255,255,0.78)', marginTop: 6, fontWeight: '500' },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.14)', marginTop: 22 },
  secondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 12,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  openQuiet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 16,
    height: 48,
    borderRadius: 15,
    backgroundColor: 'rgba(16,16,16,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  soreLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  soreDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF9A1F' },
  soreText: { flex: 1, fontSize: 13.5, fontWeight: '600', color: COLORS.textPrimary },
  soreEdit: { fontSize: 13.5, fontWeight: '700', color: COLORS.accent },
  secondaryText: { fontSize: 14.5, fontWeight: '700', color: COLORS.textPrimary },
  // Same size and position as `secondary`, filled so it reads as a real button; Open Workout stays the gold primary.
  secondaryLit: { backgroundColor: 'rgba(255,255,255,0.17)', borderColor: 'rgba(255,255,255,0.32)', borderWidth: 1 },
});
