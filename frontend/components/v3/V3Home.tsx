/**
 * V3Home: MOOD Home (founder Home redesign, Oct 2026). How you feel is the input; MOOD answers with real workouts.
 *
 *   HEADER          date · real workout streak pill · "How are you feeling today, <first name>?" · one line of copy
 *   IN PROGRESS     an active Guided Session shows a slim Continue strip (unchanged behaviour)
 *   STATES          six artwork State cards (3 x 2), optional, max 3. Empty on app open (no prefill); kept while the user
 *                   moves around the app (Build edits included) until a workout is completed (see selectionLive).
 *                   Sore opens the body map and is selected once an area is chosen. Same State names and rules as before.
 *   STATE CTA       always under the grid: "I'm steady today" (no States) flips to "Build for my mood" (1-3 States).
 *                   Both open the existing Build flow (/v3/build), which reads today's States from the same storage.
 *   SUGGESTIONS     "MOOD's suggestions": one real recommendation per Direction (three across, MOOD's Pick first).
 *                   Recovery: after a recent leg / upper session (last 48 h) the Strength card is steered to a session type
 *                   that rests that area, carries the MOOD's Pick badge, and the subline says so ("Wes, you trained legs
 *                   last. MOOD's Pick gives them a break."). Otherwise MOOD's Pick = last-used Direction.
 *                   Each is a live preview from the generator (`persist: false`, utils/v3HomeRecs) with today's States,
 *                   sore areas and default length; they rebuild when the States change (cached per request signature, so
 *                   toggling back is instant). Tap a card to select it; Start pops up on the card. Start persists that
 *                   exact request (deterministic per user + date + inputs, so it is the workout the card showed) and
 *                   opens the existing Cart (/v3/workout). An existing build of the same inputs today is reused instead.
 *
 * MOOD's Pick is the existing rule: last-used Direction, else the Training Profile / onboarding default.
 * Removed from Home (not from the app): the full-screen pick hero, Open Workout, Shuffle (Different Workout stays in the
 * Cart) and the permanent Build my own button.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, AppState, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeLinearGradient as LinearGradient } from '../SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import { useAuth } from '../../contexts/AuthContext';
import { useHealth } from '../../contexts/HealthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import WearablesSnapshot from '../WearablesSnapshot';
import { trackEvent } from '../../utils/analytics';
import { authFetch } from '../../utils/api';
import { FirstHomeHandoff, consumeFirstHomeHandoff, fetchTrainingProfile, readFirstHomeHandoff, takeFirstBuildLaunch } from '../../utils/v3Profile';
import { EXPECTED_ENGINE_PHASE, V3Direction, V3HistoryItem, getV3History, V3SoreRegion, V3State, V3Workout, completeV3Workout, generateV3Workout, getV3Version, localDateISO } from '../../utils/v3Api';
import { MAX_STATES, STATES, defaultDuration, requestSignature, soreSummary } from '../../utils/v3HomeModel';
import { RecSlot, fitCards, weekStrip, cardHeight916, homeHeadline, homeSpacing, persistRequest, recCardSize, recSlots, recoveryPlan, recsMessage, featuredMoods, stateCta, stateTileSize, streakLabel } from '../../utils/v3HomeRecs';
import { V3DayStates, V3TodayEntry, readDayStates, readLastDirection, readTodayBySignature, writeDayStates, writeLastDirection, writeToday } from '../../utils/v3Today';
import { BodyMapSheet } from './BodyMapSheet';
import { StateCard } from './StateCard';
import { MoodWorkoutCard } from './MoodWorkoutCard';
import { resolveV3HomeHeroes } from '../../utils/cartHero';
import { HomeSession, homeSession } from '../../utils/v3Session/record';
import { readSession, updateSession } from '../../utils/v3Session/store';
import { syncCompletion } from '../../utils/v3Session/sync';
import { trackSession } from '../../utils/v3Session/analytics';

declare const __DEV__: boolean;

/** "1 free this week" / "Free workout back Mon" (free plan), or null for members / unknown. */
function freeAllowanceLabel(remaining: number | null | undefined, resetAt: string | null | undefined): { text: string; left: boolean } | null {
  if (typeof remaining !== 'number') return null;
  if (remaining > 0) return { text: `${remaining} free this week`, left: true };
  let day = '';
  try { day = resetAt ? new Date(resetAt).toLocaleDateString('en-US', { weekday: 'short' }) : ''; } catch { day = ''; }
  return { text: day ? `Free workout back ${day}` : 'Free workout used', left: false };
}

/** Home's State selection: empty, for today. */
function emptyDay(date: string): V3DayStates {
  return { date, states: [], soreness: [], set: false };
}

/**
 * State selection lifetime (module scope = this app process):
 *   • app open: empty (never prefilled; whatever an earlier app run stored is ignored)
 *   • once the user picks States in this run, they are kept in today's day states (utils/v3Today), so leaving Home
 *     (Build, Cart, another tab) and coming back shows the same selection, including edits made on Build
 *   • cleared when a workout is completed
 */
let selectionLive = false;
/** the completed workout already seen this run (undefined = Home has not loaded yet in this run) */
let seenDoneWorkout: string | null | undefined;
const GUTTER = 16;
const GAP = 8;
const TOP_PAD = 8;
const REC_GAP = 10;
const BOTTOM_PAD = 10;
/** gap between the bottom of the cards and the bottom of the first screen (the wearables ribbon starts below it) */
const FOLD_GAP = 12;

/** A recommendation, keyed by request signature. `workoutId` is set once it is persisted (Start, or reused from Build). */
type Rec =
  | { status: 'loading' }
  | { status: 'ok'; workout: V3Workout; workoutId: string | null }
  | { status: 'conflict'; message: string | null }
  | { status: 'error' };


function haptic() {
  Haptics.selectionAsync().catch(() => {});
}

export default function V3Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const { token, user } = useAuth();
  const { freeWorkoutsRemaining, freeWorkoutsResetAt } = useSubscription();
  const uid = user?.id ?? null;

  const [ready, setReady] = useState(false);
  const [day, setDay] = useState<V3DayStates | null>(null);
  const [handoff, setHandoff] = useState<FirstHomeHandoff | null>(null);
  const [direction, setDirectionState] = useState<V3Direction>('strength');
  const [duration, setDuration] = useState<30 | 60>(60);
  const [streak, setStreak] = useState<number | null>(null);
  const [engine, setEngine] = useState<{ engine_phase: string; engine_build: string } | null | undefined>(undefined);
  const [stateHint, setStateHint] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [session, setSession] = useState<HomeSession>(null);
  const [recs, setRecs] = useState<Record<string, Rec>>({});
  /** the last workout shown per Direction, kept on screen (dimmed) while new States rebuild it */
  const [lastShown, setLastShown] = useState<Partial<Record<V3Direction, V3Workout>>>({});
  const [selectedSig, setSelectedSig] = useState<string | null>(null);
  const [startingSig, setStartingSig] = useState<string | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflight = useRef(new Set<string>());
  const doneKey = useRef<string | null>(null);
  const firstFetch = useRef(true);
  const ctaPrimary = useRef(new Animated.Value(0)).current;
  // Fit-to-screen: 9:16 cards end at the bottom of the first screen; spare height is spread over the gaps above them
  // (utils/v3HomeRecs homeSpacing). aboveBase = height of everything above the cards WITHOUT that extra spacing.
  const [viewportH, setViewportH] = useState<number | null>(null);
  const [aboveBase, setAboveBase] = useState<number | null>(null);
  const appliedSpread = useRef(0);
  // Wearables ribbon (V2 Home's): HealthKit snapshot + last workout calories from the home summary.
  const { snapshot: healthSnapshot, refresh: refreshHealth } = useHealth();
  const [lastWorkoutCalories, setLastWorkoutCalories] = useState<number | null>(null);
  const [history, setHistory] = useState<V3HistoryItem[]>([]);
  /** completion instants of the last 14 days, every workout type (achievements state): the week strip's flames */
  const [workoutTimes, setWorkoutTimes] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<string | null>(null);

  const track = useCallback(
    (name: string, meta: Record<string, any> = {}) => {
      if (token) trackEvent(token, name, { home_version: 'v3_h1', home_layout: 'states_recs', ...meta });
    },
    [token],
  );

  /* ---------------------------------------------------------------- data (mount + every focus) */
  const load = useCallback(async () => {
    if (!uid) return;
    const date = localDateISO();
    const [h, last, sess] = await Promise.all([readFirstHomeHandoff(uid), readLastDirection(uid), readSession(uid)]);
    // Recent completed workouts: the recovery line + steering of the Strength suggestion (utils/v3HomeRecs recoveryPlan).
    if (token) getV3History(token, 20).then(setHistory);
    // Week strip + streak pill: refreshed on every focus, so a workout finished a minute ago shows its flame.
    if (token) {
      authFetch<{ workout_streak?: number; workout_completed_at_14d?: string[] }>('/api/achievements/state', token)
        .then((ach) => {
          if (!ach || !(ach as any).ok) return;
          const data = (ach as any).data ?? {};
          if (typeof data.workout_streak === 'number') setStreak(data.workout_streak);
          if (Array.isArray(data.workout_completed_at_14d)) setWorkoutTimes(data.workout_completed_at_14d);
        })
        .catch(() => {});
    }
    if (sess.expiredNow && sess.record) trackSession(token, 'v3_workout_abandoned', { workout_id: sess.record.workoutId, session_id: sess.record.sessionId, reason: 'expired' });
    const hs = homeSession(sess.record, date, Date.now());
    setSession(hs);
    // A workout finished since the recommendations were built changes the generator's history: rebuild them.
    const dk = hs?.mode === 'done' ? hs.workoutId : null;
    if (dk !== doneKey.current) {
      if (doneKey.current !== null || dk !== null) setRecs({});
      doneKey.current = dk;
    }
    // A finished workout whose completion is still queued (offline): retry now (the server is idempotent).
    if (sess.record?.status === 'completing' && token) {
      syncCompletion(uid, token, 'home', { update: updateSession, send: completeV3Workout, now: () => Date.now() }).then(async (out) => {
        if (out.kind === 'synced') setSession(homeSession(out.record, localDateISO(), Date.now()));
      });
    }
    const pending = h && h.pending ? h : null;
    setHandoff(pending);
    // States: empty on app open; this run's selection is kept (and Build's edits picked up) until a workout is completed.
    let nextDay = selectionLive ? await readDayStates(uid, date) : emptyDay(date);
    if (seenDoneWorkout === undefined) seenDoneWorkout = dk;
    else if (dk && dk !== seenDoneWorkout) {
      seenDoneWorkout = dk;
      nextDay = emptyDay(date);
      if (selectionLive) await writeDayStates(uid, nextDay);
      track('v3_home_states_cleared', { reason: 'workout_completed', workout_id: dk });
    }
    setDay(nextDay);
    setDirectionState((cur) => last ?? (pending?.default_direction as V3Direction) ?? cur);
    setReady(true);
    return { last, pending };
  }, [uid, token, track]);

  useEffect(() => {
    if (!uid) return;
    let alive = true;
    (async () => {
      const r = await load();
      if (!alive || !r) return;
      setDuration(defaultDuration(null, r.pending?.default_duration));
      // Profile reveal -> "Build my first workout": Home is now the stack root; open Build on top of it, once.
      if (await takeFirstBuildLaunch(uid)) {
        track('v3_build_opened', { source: 'onboarding_reveal', states: [] });
        router.push({ pathname: '/v3/build', params: { first: '1' } } as any);
      }
      track('v3_home_viewed', {
        first_visit: !!r.pending,
        direction: r.last ?? r.pending?.default_direction ?? 'strength',
        direction_source: r.last ? 'last_used' : r.pending ? 'handoff' : 'fallback',
      });
      if (!token) return;
      const [prof, ach, summary] = await Promise.all([
        fetchTrainingProfile(token),
        authFetch<{ workout_streak?: number }>('/api/achievements/state', token).catch(() => null),
        authFetch<{ last_workout_calories?: number }>('/api/users/me/home-summary', token).catch(() => null),
      ]);
      if (!alive) return;
      const cal = summary && (summary as any).ok ? (summary as any).data?.last_workout_calories : null;
      setLastWorkoutCalories(typeof cal === 'number' ? cal : null);
      if (prof) {
        setFrequency((prof.profile?.training_frequency as string | undefined) ?? null);
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

  // Back from Build / Cart / a session: a new last-used Direction, Continue / Done, States edited on Build, fresh history
  // and Health data. Leaving Home keeps the State selection (see selectionLive) but drops the selected card.
  useFocusEffect(
    useCallback(() => {
      load();
      refreshHealth({ silent: true });
      return () => {
        setSelectedSig(null);
        setStateHint(false);
      };
    }, [load, refreshHealth]),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') load();
    });
    return () => sub.remove();
  }, [load]);

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
  const soreness = useMemo(() => day?.soreness ?? [], [day]);
  const date = localDateISO();
  // Recovery: after a recent leg (or upper) session, the Strength suggestion rests that area and becomes MOOD's Pick.
  const recovery = useMemo(() => recoveryPlan(history, { now: Date.now(), frequency, states }), [history, frequency, states]);
  const pickDirection: V3Direction = recovery ? 'strength' : direction;
  // No States answered yet: the suggestions are built for one featured mood (labelled on the covers); once States are picked
  // all three rebuild for them (founder pass, Oct 2026). "I'm steady today" (answered, none) features nothing.
  const featured = useMemo(() => (states.length ? [] : featuredMoods(date, !!day?.set)), [states, date, day]);
  const slots = useMemo(
    () => recSlots({ pick: pickDirection, states, soreness, duration, date, strengthArchetype: recovery?.strengthArchetype ?? null, slotStates: featured.length ? featured : null }),
    [pickDirection, states, soreness, duration, date, recovery, featured],
  );
  const slotKey = slots.map((s) => s.signature).join('||');
  const cta = stateCta(states);
  const staleBackend = typeof __DEV__ !== 'undefined' && __DEV__ && engine !== undefined && (!engine || engine.engine_phase !== EXPECTED_ENGINE_PHASE);
  const tile = stateTileSize(screenW, GUTTER, GAP);
  const cardW = recCardSize(screenW, GUTTER, GAP).width;
  // The cards end at the bottom of the first screen; the wearables ribbon is below the fold (scroll to see it).
  const extra916 = viewportH != null && aboveBase != null ? viewportH - (insets.top + TOP_PAD) - aboveBase - REC_GAP - cardHeight916(cardW) - FOLD_GAP : null;
  // 9:16 when there is room; otherwise just short enough that the card bottoms stay on the first screen (utils/v3HomeRecs fitCards)
  const fit = fitCards(cardW, extra916);
  const card = { width: cardW, height: fit.height };
  const extra = fit.extra;
  const week = weekStrip(new Date(), [...workoutTimes, ...history.map((h) => h.completed_at)]);
  const sp = homeSpacing(extra);
  appliedSpread.current = sp.top + sp.grid + sp.cta + sp.sec;
  const selected = slots.find((s) => s.signature === selectedSig && recs[s.signature]?.status === 'ok') ?? null;

  useEffect(() => {
    Animated.timing(ctaPrimary, { toValue: cta.primary ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [cta.primary, ctaPrimary]);

  /* ---------------------------------------------------------------- recommendations */
  const fetchSlot = useCallback(
    async (slot: RecSlot, force = false) => {
      if (!token || !uid) return;
      const sig = slot.signature;
      if (inflight.current.has(sig)) return;
      inflight.current.add(sig);
      setRecs((r) => (!force && r[sig] && r[sig].status !== 'error' && r[sig].status !== 'loading' ? r : { ...r, [sig]: { status: 'loading' } }));
      const done = (rec: Rec) => {
        setRecs((r) => ({ ...r, [sig]: rec }));
        if (rec.status === 'ok') setLastShown((l) => ({ ...l, [slot.direction]: rec.workout }));
      };
      try {
        // Same inputs already built today by the running engine (Build screen, or an earlier Start): reuse that workout.
        const existing = await readTodayBySignature(uid, slot.request.date, sig);
        const completed = session?.mode === 'done' && existing?.workout_id === session.workoutId;
        if (existing?.envelope.workout && engine && existing.envelope.engine?.build === engine.engine_build && !completed) {
          done({ status: 'ok', workout: existing.envelope.workout, workoutId: existing.workout_id });
          return;
        }
        const res = await generateV3Workout(token, slot.request);
        if (!res.ok) {
          done({ status: 'error' });
          track('v3_home_rec_outcome', { direction: slot.direction, outcome: 'error', kind: res.error.kind });
          return;
        }
        const env = res.envelope;
        if (env.status === 'conflict' || !env.workout) {
          done({ status: 'conflict', message: env.conflict?.message ?? null });
          track('v3_home_rec_outcome', { direction: slot.direction, outcome: 'conflict', code: env.conflict?.code ?? null });
          return;
        }
        done({ status: 'ok', workout: env.workout, workoutId: null });
      } finally {
        inflight.current.delete(sig);
      }
    },
    [token, uid, engine, session, track],
  );

  // Build (or reuse) the three recommendations whenever the inputs change. Debounced so tapping through States is cheap.
  useEffect(() => {
    if (!ready || !token || !uid || engine === undefined) return;
    // Only never-requested signatures: in-flight ones are 'loading', failed ones retry from the card (tap to retry).
    const missing = slots.filter((s) => !recs[s.signature]);
    if (!missing.length) return;
    const wait = firstFetch.current ? 0 : 450;
    firstFetch.current = false;
    const t = setTimeout(() => {
      missing.forEach((s) => void fetchSlot(s));
      track('v3_home_recs_requested', { states, featured, soreness, duration, pick: direction, count: missing.length });
    }, wait);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, token, uid, engine, slotKey, recs]);

  /* ---------------------------------------------------------------- actions */
  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  };

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
    selectionLive = true;
    writeDayStates(uid, next);
    track('v3_state_toggled', { state: id, selected: !on, count: next.states.length, surface: 'home' });
  };

  const onMapDone = (regions: V3SoreRegion[]) => {
    setMapOpen(false);
    if (!uid || !day) return;
    const withSore = day.states.includes('sore') ? day.states : [...day.states, 'sore' as V3State];
    const next: V3DayStates = { ...day, states: withSore, soreness: regions, set: true };
    setDay(next);
    selectionLive = true;
    writeDayStates(uid, next);
    track('v3_soreness_changed', { surface: 'home', soreness: regions });
  };

  const onMapCancel = () => {
    setMapOpen(false);
    track('v3_body_map_cancelled', { surface: 'home', kept: states.includes('sore') });
  };

  /** "I'm steady today" / "Build for my mood": the existing Build flow, with today's States (none, or the selection). */
  const onStateCta = () => {
    if (!uid || !day) return;
    haptic();
    selectionLive = true;
    writeDayStates(uid, { ...day, set: true });
    track('v3_build_opened', { source: cta.source, states, soreness });
    router.push('/v3/build' as any);
  };

  const onSeeAll = () => {
    // Build reads today's States from storage: hand it exactly what Home shows (possibly none).
    if (uid && day) {
      selectionLive = true;
      writeDayStates(uid, { ...day, set: true });
    }
    track('v3_build_opened', { source: 'home_see_all', states });
    router.push('/v3/build' as any);
  };

  const continueWorkout = () => {
    if (!session) return;
    track('v3_continue_tapped', { workout_id: session.workoutId });
    router.push({ pathname: '/v3/session', params: { id: session.workoutId, from: 'home' } } as any);
  };

  const onSelectCard = (slot: RecSlot) => {
    haptic();
    const on = selectedSig === slot.signature;
    setSelectedSig(on ? null : slot.signature);
    const r = recs[slot.signature];
    track('v3_home_rec_selected', {
      direction: slot.direction,
      pick: slot.pick,
      selected: !on,
      archetype: r?.status === 'ok' ? r.workout.archetype.id : null,
      states,
    });
  };

  /** Start: persist the previewed request (or reuse today's build of it) and open the existing Cart. */
  const onStart = async (slot: RecSlot) => {
    const r = recs[slot.signature];
    if (!token || !uid || !day || r?.status !== 'ok' || startingSig) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const open = (id: string, reused: boolean) => {
      track('v3_home_rec_start', { direction: slot.direction, pick: slot.pick, archetype: r.workout.archetype.id, workout_id: id, reused, states });
      router.push({ pathname: '/v3/workout', params: { id } } as any);
    };
    if (r.workoutId) return open(r.workoutId, true);
    setStartingSig(slot.signature);
    try {
      const req = persistRequest(slot.request);
      const res = await generateV3Workout(token, req);
      if (!res.ok) {
        showToast(res.error.message || 'Could not start right now. Try again.');
        return;
      }
      const env = res.envelope;
      if (env.status === 'conflict' || !env.workout?.workout_id) {
        showToast(env.conflict?.message || 'MOOD could not build that one. Try Build for my mood.');
        return;
      }
      const id = env.workout.workout_id as string;
      const entry: V3TodayEntry = { date: req.date, workout_id: id, signature: requestSignature(req), request: req, envelope: env, saved_at: new Date().toISOString(), source: 'build' };
      await Promise.all([writeToday(uid, entry), writeLastDirection(uid, slot.direction), writeDayStates(uid, { ...day, set: true })]);
      if (handoff) {
        await consumeFirstHomeHandoff(uid);
        setHandoff(null);
      }
      setRecs((m) => ({ ...m, [slot.signature]: { status: 'ok', workout: env.workout!, workoutId: id } }));
      if (env.workout.archetype.id !== r.workout.archetype.id) track('v3_home_rec_start_drift', { direction: slot.direction, preview: r.workout.archetype.id, built: env.workout.archetype.id });
      open(id, false);
    } finally {
      setStartingSig(null);
    }
  };

  /* ---------------------------------------------------------------- render */
  if (!ready || !day) {
    return (
      <View style={[styles.root, styles.center]}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  const streakText = streakLabel(streak);
  // Free plan only (V2's allowance chip, founder pass, Oct 2026): the weekly free workout, between the month and the streak.
  // null for members (useSubscription returns null when entitled), so nothing shows for them.
  const freeText = freeAllowanceLabel(freeWorkoutsRemaining, freeWorkoutsResetAt);
  const anyRefreshing = slots.some((s) => !recs[s.signature] || recs[s.signature].status === 'loading');

  return (
    <View style={styles.root} testID="v3-home">
      <ScrollView
        showsVerticalScrollIndicator={false}
        onLayout={(e) => setViewportH(Math.round(e.nativeEvent.layout.height))}
        contentContainerStyle={{ paddingTop: insets.top + TOP_PAD, paddingBottom: BOTTOM_PAD }}
      >
        <View onLayout={(e) => setAboveBase(Math.round(e.nativeEvent.layout.height) - appliedSpread.current)}>
        {/* ============================================================ HEADER */}
        <View style={[styles.pad, { paddingTop: sp.top }]}>
          <View style={styles.topRow}>
            <Text style={styles.eyebrow} testID="v3-home-date">{week.monthLabel}</Text>
            {freeText ? (
              <View style={styles.free} testID="v3-home-free">
                <Ionicons name={freeText.left ? 'lock-open-outline' : 'time-outline'} size={11} color={freeText.left ? COLORS.accent : 'rgba(255,255,255,0.45)'} />
                <Text style={styles.freeText} numberOfLines={1}>{freeText.text}</Text>
              </View>
            ) : null}
            {streakText ? (
              <View style={styles.streak} testID="v3-home-streak">
                <Ionicons name="flame" size={14} color="#FF8A1F" />
                <Text style={styles.streakText}>{streakText}</Text>
              </View>
            ) : (
              <View style={{ height: 28 }} />
            )}
          </View>
          {/* This week (Mon to Sun): today in gold, a flame under every day with a completed workout */}
          <View style={styles.week} testID="v3-home-week" accessibilityLabel={`This week: ${week.days.filter((d) => d.trained).length} workout ${week.days.filter((d) => d.trained).length === 1 ? 'day' : 'days'}`}>
            {week.days.map((d) => (
              <View key={d.date} style={styles.weekDay}>
                <Text style={[styles.weekLetter, d.isToday && styles.weekLetterToday]}>{d.letter}</Text>
                <View style={[styles.weekNum, d.isToday && styles.weekNumToday]}>
                  <Text style={[styles.weekNumText, d.isFuture && styles.weekFuture, d.trained && !d.isToday && styles.weekTrained, d.isToday && styles.weekNumTextToday]}>{d.day}</Text>
                </View>
                <View style={styles.weekFlame}>{d.trained ? <Ionicons name="flame" size={11} color="#FF8A1F" /> : null}</View>
              </View>
            ))}
          </View>
          <Text style={styles.headline} testID="v3-home-headline">{homeHeadline(user?.name)}</Text>
          <Text style={styles.sub} numberOfLines={1} testID="v3-home-state-caption">
            {stateHint ? `Up to ${MAX_STATES}. Tap one to remove it.` : 'Pick up to 3 and we’ll tailor today’s workouts.'}
          </Text>

          {staleBackend ? (
            <Text style={styles.devWarn} testID="v3-dev-stale-backend">
              DEV: backend engine is {engine ? engine.engine_phase : 'unreachable'} (app expects {EXPECTED_ENGINE_PHASE}). Restart uvicorn.
            </Text>
          ) : null}

          {session?.mode === 'continue' ? (
            <Pressable onPress={continueWorkout} style={({ pressed }) => [styles.strip, pressed && styles.pressed]} testID="v3-hero-continue-block">
              <View style={styles.stripDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.stripEyebrow}>WORKOUT IN PROGRESS</Text>
                <Text style={styles.stripTitle} numberOfLines={1} testID="v3-hero-continue-title">
                  {[session.title, session.elapsedMin > 0 ? `${session.elapsedMin} min in` : null].filter(Boolean).join(' · ')}
                </Text>
              </View>
              <View style={styles.stripCta} testID="v3-hero-continue-cta">
                <Ionicons name="play" size={13} color={COLORS.accentInk} />
                <Text style={styles.stripCtaText}>Continue</Text>
              </View>
            </Pressable>
          ) : null}
        </View>

        {/* ============================================================ STATES */}
        <View style={[styles.pad, styles.grid, { marginTop: 12 + sp.grid }]} testID="v3-home-states">
          {STATES.map((s) => (
            <StateCard
              key={s.id}
              id={s.id}
              label={s.label}
              width={tile.width}
              height={tile.height}
              selected={states.includes(s.id)}
              muted={!states.includes(s.id) && states.length >= MAX_STATES}
              onPress={() => onToggleState(s.id)}
              testID={`v3-state-${s.id}`}
            />
          ))}
        </View>
        <View style={styles.pad}>
          {states.includes('sore') && soreness.length ? (
            <Pressable onPress={() => setMapOpen(true)} hitSlop={6} style={styles.soreLine} testID="v3-home-sore-summary">
              <View style={styles.soreDot} />
              <Text style={styles.soreText} numberOfLines={1}>{soreSummary(soreness)}</Text>
              <Text style={styles.soreEdit}>Edit</Text>
            </Pressable>
          ) : null}

          {/* "I'm steady today" -> "Build for my mood": the satin-taupe pill crossfades to the gold primary when States are picked */}
          <Pressable
            onPress={onStateCta}
            accessibilityRole="button"
            accessibilityLabel={cta.label}
            testID="v3-home-state-cta"
            style={({ pressed }) => [styles.ctaWrap, { marginTop: 10 + sp.cta }, pressed && styles.pressed]}
          >
            {/* steady state: "Satin Taupe" (founder pick, Oct 2026): a lighter taupe gradient with a soft top highlight */}
            <LinearGradient colors={['#8E7F74', '#71645B', '#62564E']} locations={[0, 0.55, 1]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.ctaQuiet} />
            <View style={styles.ctaSatinEdge} pointerEvents="none" />
            <View style={styles.ctaSatinHighlight} pointerEvents="none" />
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: ctaPrimary }]}>
              <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaFill} />
            </Animated.View>
            <View style={styles.ctaRow}>
              <Ionicons name={cta.primary ? 'sparkles' : 'leaf-outline'} size={16} color={cta.primary ? COLORS.accentInk : '#FFE2A6'} />
              <Text style={[styles.ctaText, { color: cta.primary ? COLORS.accentInk : COLORS.textPrimary }]}>{cta.label}</Text>
              {cta.primary ? <Ionicons name="arrow-forward" size={16} color={COLORS.accentInk} /> : null}
            </View>
          </Pressable>
        </View>

        {/* ============================================================ WORKOUTS FOR YOUR MOOD */}
        <View style={[styles.pad, styles.secHead, { marginTop: 14 + sp.sec }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.secTitle}>MOOD’s suggestions</Text>
            {/* one line (founder pass, Oct 2026): today's States plus the last session when it was in the last 24 h */}
            <Text style={styles.secSub} numberOfLines={2} testID="v3-home-recs-sub">
              {recsMessage({ states, featured, history, recovery, now: Date.now() })}
            </Text>
          </View>
          <Pressable onPress={onSeeAll} hitSlop={10} style={({ pressed }) => [styles.seeAll, pressed && { opacity: 0.6 }]} testID="v3-home-see-all">
            <Text style={styles.seeAllText}>See all</Text>
            <Ionicons name="arrow-forward" size={14} color={COLORS.textSecondary} />
          </Pressable>
        </View>
        </View>
        <View style={[styles.pad, styles.recRow, { marginTop: REC_GAP + sp.cards }]} testID="v3-home-recs" accessibilityLiveRegion="polite" accessibilityState={{ busy: anyRefreshing }}>
          {(() => {
            // Founder rule: the three cards show three different athletes (utils/cartHero resolveV3HomeHeroes).
            const shown = slots.map((s) => {
              const r = recs[s.signature];
              const prev = lastShown[s.direction] ?? null;
              const loading = !r || r.status === 'loading';
              return r?.status === 'ok' ? r.workout : loading ? prev : null;
            });
            const heroes = resolveV3HomeHeroes(shown);
            return slots.map((s, i) => {
            const r = recs[s.signature];
            const prev = lastShown[s.direction] ?? null;
            const loading = !r || r.status === 'loading';
            return (
              <MoodWorkoutCard
                key={s.direction}
                direction={s.direction}
                pick={s.pick}
                moods={featured.length ? [featured[i]] : states}
                status={loading ? 'loading' : r.status}
                workout={r?.status === 'ok' ? r.workout : loading ? prev : null}
                heroSource={heroes[i]}
                refreshing={loading && !!prev}
                conflictMessage={r?.status === 'conflict' ? r.message : null}
                selected={selected?.signature === s.signature}
                starting={startingSig === s.signature}
                width={card.width}
                height={card.height}
                onPress={() => onSelectCard(s)}
                onStart={() => void onStart(s)}
                onRetry={() => void fetchSlot(s, true)}
                testID={`v3-home-rec-${s.direction}`}
              />
            );
            });
          })()}
        </View>

        {/* ============================================================ WEARABLES (the V2 Home ribbon, below the fold) */}
        <View style={styles.wearables} testID="v3-home-wearables">
          <WearablesSnapshot
            restingHr={healthSnapshot?.restingHeartRate ?? null}
            sleepMinutes={healthSnapshot?.asleepDurationMinutes ?? null}
            steps={healthSnapshot?.stepCount ?? null}
            calories={lastWorkoutCalories}
          />
        </View>
      </ScrollView>

      {toast ? (
        <View style={[styles.toast, { top: insets.top + 8 }]} pointerEvents="none" testID="v3-home-toast">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
      <BodyMapSheet visible={mapOpen} initial={day.soreness} onDone={onMapDone} onCancel={onMapCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { paddingHorizontal: GUTTER },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },

  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: 12, fontWeight: '600', letterSpacing: 2, color: 'rgba(255,255,255,0.62)' },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 28,
    paddingHorizontal: 11,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  streakText: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  // quiet on purpose: no fill, no border, small muted text with one gold glyph
  free: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 4, marginHorizontal: 10 },
  freeText: { flexShrink: 1, fontSize: 11.5, fontWeight: '600', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.1 },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  weekDay: { flex: 1, alignItems: 'center' },
  weekLetter: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: 0.5 },
  weekLetterToday: { color: COLORS.accent },
  weekNum: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  weekNumToday: { backgroundColor: COLORS.accent },
  weekNumText: { fontSize: 13.5, fontWeight: '700', color: 'rgba(255,255,255,0.62)', fontVariant: ['tabular-nums'] },
  weekNumTextToday: { color: COLORS.accentInk, fontWeight: '800' },
  weekTrained: { color: '#FF9A3D' },
  weekFuture: { color: 'rgba(255,255,255,0.32)' },
  weekFlame: { height: 13, marginTop: 2, alignItems: 'center', justifyContent: 'center' },
  headline: { fontSize: 27, lineHeight: 31, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.8, marginTop: 8 },
  sub: { fontSize: 13.5, lineHeight: 18, color: '#8D8D90', marginTop: 4, fontWeight: '500' },
  devWarn: { fontSize: 11.5, lineHeight: 16, color: '#ff8a80', fontWeight: '600', marginTop: 8 },

  strip: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)' },
  stripDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent },
  stripEyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4, color: COLORS.accent },
  stripTitle: { fontSize: 13.5, fontWeight: '700', color: COLORS.textPrimary, marginTop: 1 },
  stripCta: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: COLORS.accent },
  stripCtaText: { fontSize: 13, fontWeight: '800', color: COLORS.accentInk },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  soreLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  soreDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5FE0A0' },
  soreText: { flex: 1, fontSize: 13.5, fontWeight: '600', color: COLORS.textPrimary },
  soreEdit: { fontSize: 13.5, fontWeight: '700', color: COLORS.accent },

  ctaWrap: { height: 42, borderRadius: 21, overflow: 'hidden' },
  ctaQuiet: { ...StyleSheet.absoluteFillObject, borderRadius: 21 },
  ctaSatinEdge: { ...StyleSheet.absoluteFillObject, borderRadius: 21, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,245,230,0.22)' },
  ctaSatinHighlight: { position: 'absolute', top: 0.5, left: 18, right: 18, height: 1, borderRadius: 1, backgroundColor: 'rgba(255,245,230,0.38)' },
  ctaFill: { flex: 1, borderRadius: 21 },
  ctaRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { fontSize: 15.5, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: 0.1 },

  secHead: { flexDirection: 'row', alignItems: 'flex-start' },
  secTitle: { fontSize: 19, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.4 },
  secSub: { fontSize: 12.5, color: '#8D8D90', marginTop: 2, fontWeight: '500' },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 3 },
  seeAllText: { fontSize: 13.5, fontWeight: '600', color: COLORS.textSecondary },
  recRow: { flexDirection: 'row', gap: GAP },
  wearables: { paddingTop: FOLD_GAP + 24 },

  toast: {
    position: 'absolute',
    left: 22,
    right: 22,
    zIndex: 5,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(20,20,20,0.96)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  toastText: { fontSize: 13.5, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
});
