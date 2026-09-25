/**
 * V3 Workout Overview — /v3/workout?id=<workout_id>
 *
 * Renders today's cached envelope instantly, then refreshes from
 * GET /api/v3/workouts/{id} (the server is the source of truth). Exercise swap
 * and "Different workout" call the production endpoints and only ever show
 * what the server returns. Start Workout hands off to /v3/session (Phase 3
 * builds the guided player there).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import { useAuth } from '../../contexts/AuthContext';
import { trackEvent } from '../../utils/analytics';
import { V3Envelope, V3Item, getV3Workout, swapV3Exercise, swapV3Workout } from '../../utils/v3Api';
import { readCachedEnvelope, updateTodayEnvelope } from '../../utils/v3Today';
import { WorkoutOverview } from '../../components/v3/WorkoutOverview';

export default function V3WorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { token, user } = useAuth();
  const uid = user?.id ?? null;

  const [env, setEnv] = useState<V3Envelope | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [swappingItem, setSwappingItem] = useState<string | null>(null);
  const [swappingWorkout, setSwappingWorkout] = useState(false);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const viewedRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  const track = useCallback(
    (name: string, meta: Record<string, any> = {}) => {
      if (token) trackEvent(token, name, { workout_id: id, ...meta });
    },
    [token, id],
  );

  const showToast = (msg: string) => {
    setToast(msg);
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(2400),
      Animated.timing(toastOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  const accept = useCallback(
    (next: V3Envelope) => {
      setEnv(next);
      if (uid) updateTodayEnvelope(uid, next);
    },
    [uid],
  );

  useEffect(() => {
    if (!id || !token) return;
    let alive = true;
    (async () => {
      if (uid) {
        const cached = await readCachedEnvelope(uid, id);
        if (alive && cached) setEnv((e) => e ?? cached);
      }
      const res = await getV3Workout(token, id);
      if (!alive) return;
      if (res.ok) accept(res.envelope);
      else setLoadError(res.error.message);
    })();
    return () => {
      alive = false;
    };
  }, [id, token, uid, accept]);

  useEffect(() => {
    if (!env?.workout || viewedRef.current) return;
    viewedRef.current = true;
    const w = env.workout;
    track('v3_workout_overview_viewed', {
      outcome: env.outcome,
      direction: w.direction,
      archetype: w.archetype.id,
      target_mode: w.target.mode,
      duration: w.duration.requested_minutes,
      estimated_minutes: w.duration.estimated_minutes,
      states: w.states,
      has_progression: w.blocks.some((b) => b.items.some((i) => !!i.progression?.text)),
      media_count: w.blocks.reduce((n, b) => n + b.items.filter((i) => !!i.exercise.media).length, 0),
    });
  }, [env, track]);

  const onSwap = async (item: V3Item) => {
    if (!token || !id || swappingItem) return;
    setSwappingItem(item.item_id);
    track('v3_swap_exercise_tapped', { item_id: item.item_id, from: item.exercise.id });
    const res = await swapV3Exercise(token, id, item.item_id);
    setSwappingItem(null);
    if (!res.ok) {
      track('v3_swap_exercise_result', { item_id: item.item_id, result: 'error', error_kind: res.error.kind });
      showToast(res.error.message);
      return;
    }
    const next = res.envelope;
    if (next.status === 'conflict') {
      // no_alternative: the workout is unchanged.
      track('v3_swap_exercise_result', { item_id: item.item_id, result: next.conflict?.code ?? 'conflict' });
      showToast(next.conflict?.message || 'No other exercise fits this slot today.');
      return;
    }
    accept(next);
    const to = next.workout?.swapped_item?.to;
    track('v3_swap_exercise_result', { item_id: item.item_id, result: 'swapped', from: item.exercise.id, to });
    setHighlight(item.item_id);
    setTimeout(() => setHighlight(null), 2200);
    const newName = next.workout?.blocks.flatMap((b) => b.items).find((i) => i.item_id === item.item_id)?.exercise.name;
    showToast(newName ? `Swapped in ${newName}` : 'Exercise swapped');
  };

  const onSwapWorkout = async () => {
    if (!token || !id || swappingWorkout) return;
    setSwappingWorkout(true);
    track('v3_swap_workout_tapped', { swap_count: env?.workout?.swap_count ?? 0 });
    const res = await swapV3Workout(token, id);
    setSwappingWorkout(false);
    if (!res.ok || res.envelope.status === 'conflict' || !res.envelope.workout) {
      const msg = res.ok ? res.envelope.conflict?.message || "Couldn't find another workout for these choices." : res.error.message;
      track('v3_swap_workout_result', { result: 'error' });
      showToast(msg);
      return;
    }
    accept(res.envelope);
    track('v3_swap_workout_result', { result: 'swapped', archetype: res.envelope.workout.archetype.id, swap_count: res.envelope.workout.swap_count });
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    showToast(`Here's a different ${res.envelope.workout.archetype.name} workout`);
  };

  const onStart = () => {
    if (!env?.workout || !id) return;
    track('v3_start_workout_tapped', { direction: env.workout.direction, archetype: env.workout.archetype.id });
    router.push({ pathname: '/v3/session', params: { id } } as any);
  };

  const busy = !!swappingItem || swappingWorkout;

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back} accessibilityLabel="Back" testID="v3-overview-back">
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </Pressable>
      </View>

      {!env ? (
        <View style={styles.center}>
          {loadError ? (
            <>
              <Text style={styles.errorText}>{loadError}</Text>
              <Pressable onPress={() => router.back()} style={styles.errorBtn}>
                <Text style={styles.errorBtnText}>Back to Home</Text>
              </Pressable>
            </>
          ) : (
            <ActivityIndicator color={COLORS.accent} />
          )}
        </View>
      ) : (
        <ScrollView ref={scrollRef} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 150 }]} showsVerticalScrollIndicator={false}>
          <View style={swappingWorkout && { opacity: 0.4 }}>
            <WorkoutOverview envelope={env} onSwap={onSwap} swappingItemId={swappingItem} highlightItemId={highlight} />
          </View>
          <Pressable onPress={onSwapWorkout} disabled={busy} style={({ pressed }) => [styles.diff, (pressed || busy) && { opacity: 0.6 }]} testID="v3-swap-workout">
            {swappingWorkout ? <ActivityIndicator size="small" color={COLORS.textSecondary} /> : <Ionicons name="shuffle" size={16} color={COLORS.textSecondary} />}
            <Text style={styles.diffText}>Different workout</Text>
          </Pressable>
        </ScrollView>
      )}

      {env?.workout ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <LinearGradient colors={['rgba(10,10,10,0)', COLORS.bg]} style={styles.fade as any} />
          <Pressable onPress={onStart} disabled={busy} testID="v3-start-workout">
            <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.cta, busy && { opacity: 0.6 }] as any}>
              <Ionicons name="play" size={18} color={COLORS.accentInk} />
              <Text style={styles.ctaText}>Start Workout</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : null}

      {toast ? (
        <Animated.View style={[styles.toast, { top: insets.top + 54, opacity: toastOpacity }]} pointerEvents="none">
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { paddingHorizontal: 12, paddingBottom: 4 },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  scroll: { paddingHorizontal: 20, paddingTop: 10 },
  errorText: { fontSize: 15, lineHeight: 22, color: COLORS.textSecondary, textAlign: 'center' },
  errorBtn: { marginTop: 16, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)' },
  errorBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  diff: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 22,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  diffText: { fontSize: 14.5, fontWeight: '600', color: COLORS.textSecondary },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20 },
  fade: { position: 'absolute', left: 0, right: 0, top: -36, bottom: 0 },
  cta: { height: 56, borderRadius: 18, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 17, fontWeight: '800', color: COLORS.accentInk },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(38,38,38,0.96)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    maxWidth: '88%',
  },
  toastText: { fontSize: 13.5, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'center' },
});
