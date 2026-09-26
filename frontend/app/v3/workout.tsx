/**
 * V3 Workout Preview: /v3/workout?id=<workout_id>  (Phase 2.6)
 *
 * Preview = what. Details = why + how. Guided Session = do.
 *
 *   STRENGTH                      Direction eyebrow
 *   Chest                         Target (Target sessions) or session type
 *   ~40 min · 5 exercises · Intermediate   + State chips when any were selected
 *   BUILT FOR TODAY               always: what MOOD adapted, decided and took into account (API lines, kind-marked)
 *   STRAIGHT SETS / SUPERSET ...  the workout itself
 *   Different workout · Details   secondary actions;   Start Workout (sticky)
 *
 * One source of truth: `env` is the server's envelope for this workout id. It is replaced only by a successful server
 * response for the same id (GET, Different Workout) or a newer cached version written by Details (Swap Exercise).
 * Different Workout keeps the current workout on screen while it builds and swaps it in only on success.
 * Session type is edited on Home (Change sheet) only.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import { useAuth } from '../../contexts/AuthContext';
import { trackEvent } from '../../utils/analytics';
import { V3Envelope, getV3Workout, swapV3Workout } from '../../utils/v3Api';
import { readCachedEnvelope, updateTodayEnvelope } from '../../utils/v3Today';
import { STATE_LABEL } from '../../utils/v3HomeModel';
import { builtForToday, differentWorkoutMessage, exerciseIds, previewMeta, previewTitle, workoutDiff } from '../../utils/v3PreviewFormat';
import { PreviewSections } from '../../components/v3/PreviewSections';

/** adaptation = something about you changed the workout; decision = a choice MOOD made; context = what it took into account. */
const KIND_ICON = { adaptation: 'sparkles', decision: 'git-branch-outline', context: 'person-outline' } as const;

export default function V3WorkoutPreview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { token, user } = useAuth();
  const uid = user?.id ?? null;

  const [env, setEnv] = useState<V3Envelope | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const viewedFor = useRef<string | null>(null);
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
      Animated.delay(2600),
      Animated.timing(toastOpacity, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => setToast(null));
  };

  /** Take an envelope for this workout id if it is not older than the one on screen. */
  const accept = useCallback(
    (next: V3Envelope | null, persist: boolean) => {
      if (!next?.workout || next.workout.workout_id !== id) return false;
      setEnv((cur) => (cur?.workout && cur.workout.version > next.workout!.version ? cur : next));
      if (persist && uid) updateTodayEnvelope(uid, next);
      return true;
    },
    [id, uid],
  );

  // Load: cached envelope first (instant), then the server copy (authoritative).
  useEffect(() => {
    if (!id || !token) return;
    let alive = true;
    (async () => {
      if (uid) {
        const cached = await readCachedEnvelope(uid, id);
        if (alive) accept(cached, false);
      }
      const res = await getV3Workout(token, id);
      if (!alive) return;
      if (res.ok) accept(res.envelope, true);
      else setLoadError(res.error.message);
    })();
    return () => {
      alive = false;
    };
  }, [id, token, uid, accept]);

  // Back from Details: pick up an exercise swap made there (a newer version of the same workout).
  useFocusEffect(
    useCallback(() => {
      if (!uid || !id) return;
      readCachedEnvelope(uid, id).then((c) => accept(c, false));
    }, [uid, id, accept]),
  );

  useEffect(() => {
    const w = env?.workout;
    if (!w || viewedFor.current === w.workout_id) return;
    viewedFor.current = w.workout_id;
    track('v3_preview_viewed', {
      direction: w.direction,
      archetype: w.archetype.id,
      selection_source: w.selection_source ?? null,
      target_mode: w.target.mode,
      duration: w.duration.requested_minutes,
      estimated_minutes: w.duration.estimated_minutes,
      exercises: exerciseIds(w).length,
      bft_lines: (w.built_for_today ?? []).length,
      bft_adaptations: (w.built_for_today ?? []).filter((l) => l.kind === 'adaptation').length,
      difficulty: w.experience,
      engine: env?.engine?.phase ?? null,
    });
  }, [env, track]);

  /* ------------------------------------------------------------ Different Workout */
  const onDifferent = async () => {
    const before = env?.workout;
    if (!token || !id || !before || building) return;
    setBuilding(true);
    track('v3_swap_workout_tapped', { swap_count: before.swap_count, selection_source: before.selection_source ?? null, archetype: before.archetype.id });
    const res = await swapV3Workout(token, id);
    setBuilding(false);
    if (!res.ok || res.envelope.status === 'conflict' || !res.envelope.workout) {
      const msg = res.ok ? res.envelope.conflict?.message || "There isn't another version of this workout today." : res.error.message;
      track('v3_swap_workout_result', { result: res.ok ? res.envelope.conflict?.code ?? 'conflict' : 'error' });
      showToast(msg);
      return;
    }
    const after = res.envelope.workout;
    const d = workoutDiff(before, after);
    track('v3_swap_workout_result', {
      result: d.identical ? 'identical' : 'swapped',
      archetype_changed: d.archetypeChanged,
      from: before.archetype.id,
      to: after.archetype.id,
      selection_source: after.selection_source ?? null,
      exercises_changed: d.changed,
      exercises_total: d.total,
      swap_count: after.swap_count,
      engine: res.envelope.engine?.phase ?? null,
    });
    accept(res.envelope, true);
    if (d.identical) {
      // Only an old engine does this (Phase 2.5+ returns no_alternative instead); say so rather than pretend.
      showToast("There isn't another version of this workout today.");
      return;
    }
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    contentOpacity.setValue(0.35);
    Animated.timing(contentOpacity, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    showToast(differentWorkoutMessage(before, after));
  };

  /* ------------------------------------------------------------ navigation */
  const onDetails = () => {
    if (!id) return;
    track('v3_details_opened', { source: 'preview' });
    router.push({ pathname: '/v3/details', params: { id } } as any);
  };

  const onStart = () => {
    const w = env?.workout;
    if (!w || !id) return;
    track('v3_start_workout_tapped', { direction: w.direction, archetype: w.archetype.id, surface: 'preview' });
    router.push({ pathname: '/v3/session', params: { id } } as any);
  };

  /* ------------------------------------------------------------ render */
  const w = env?.workout ?? null;
  const bft = w ? builtForToday(w) : [];
  const states = w ? w.states.filter((s) => s !== 'sore') : [];
  const sore = w && w.soreness.regions.length ? `Sore ${w.soreness.regions.map((r) => r.replace(/_/g, ' ')).join(', ')}` : null;

  return (
    <View style={styles.root} testID="v3-preview">
      <View style={[styles.topBar, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back} accessibilityLabel="Back" testID="v3-preview-back">
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </Pressable>
      </View>

      {!w ? (
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
        <ScrollView ref={scrollRef} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: contentOpacity }} testID="v3-preview-content">
            <Text style={styles.eyebrow}>{w.direction_name.toUpperCase()}</Text>
            <Text style={styles.title} testID="v3-preview-title">
              {previewTitle(w)}
            </Text>
            <Text style={styles.meta} testID="v3-preview-meta">
              {previewMeta(w)}
            </Text>
            {states.length || sore ? (
              <View style={styles.chips}>
                {states.map((s) => (
                  <View key={s} style={styles.chip}>
                    <Text style={styles.chipText}>{STATE_LABEL[s] ?? s}</Text>
                  </View>
                ))}
                {sore ? (
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{sore}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.bft} testID="v3-preview-bft">
              <View style={styles.bftHead}>
                <Ionicons name="sparkles" size={13} color={COLORS.accent} />
                <Text style={styles.bftTitle}>BUILT FOR TODAY</Text>
              </View>
              {bft.length ? (
                bft.map((l) => (
                  <View key={l.key} style={styles.bftRow} testID={`v3-bft-${l.kind}`}>
                    <Ionicons name={KIND_ICON[l.kind] as any} size={14} color={l.kind === 'adaptation' ? COLORS.accent : COLORS.textTertiary} style={styles.bftIcon} />
                    <Text style={[styles.bftText, l.kind === 'adaptation' && styles.bftTextStrong]}>{l.text}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.bftText}>Built from your Training Profile and today's choices.</Text>
              )}
            </View>

            <PreviewSections workout={w} />
          </Animated.View>

          <View style={styles.actions}>
            <Pressable
              onPress={onDifferent}
              disabled={building}
              style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]}
              testID="v3-swap-workout"
              accessibilityState={{ busy: building }}
            >
              {building ? <ActivityIndicator size="small" color={COLORS.textPrimary} /> : <Ionicons name="shuffle" size={16} color={COLORS.textPrimary} />}
              <Text style={styles.actionText}>{building ? 'Building…' : 'Different workout'}</Text>
            </Pressable>
            <Pressable onPress={onDetails} style={({ pressed }) => [styles.action, pressed && { opacity: 0.7 }]} testID="v3-preview-details">
              <Ionicons name="list-outline" size={16} color={COLORS.textPrimary} />
              <Text style={styles.actionText}>Details</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {w ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <LinearGradient colors={['rgba(10,10,10,0)', COLORS.bg]} style={styles.fade as any} />
          <Pressable onPress={onStart} disabled={building} testID="v3-start-workout">
            <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.cta, building && { opacity: 0.6 }] as any}>
              <Ionicons name="play" size={18} color={COLORS.accentInk} />
              <Text style={styles.ctaText}>Start Workout</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : null}

      {toast ? (
        <Animated.View style={[styles.toast, { top: insets.top + 54, opacity: toastOpacity }]} pointerEvents="none" testID="v3-preview-toast">
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
  scroll: { paddingHorizontal: 22, paddingTop: 8 },
  errorText: { fontSize: 15, lineHeight: 22, color: COLORS.textSecondary, textAlign: 'center' },
  errorBtn: { marginTop: 16, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)' },
  errorBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },

  eyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 2.2, color: COLORS.accent },
  title: { fontSize: 34, lineHeight: 39, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.7, marginTop: 6 },
  meta: { fontSize: 14.5, color: COLORS.textSecondary, marginTop: 6, fontWeight: '500' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)' },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, textTransform: 'capitalize' },

  bft: {
    marginTop: 20,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255,215,0,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,215,0,0.3)',
  },
  bftHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  bftTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.7, color: COLORS.accent },
  bftRow: { flexDirection: 'row', gap: 9, paddingVertical: 6 },
  bftIcon: { marginTop: 2 },
  bftText: { flex: 1, fontSize: 13.5, lineHeight: 19, color: COLORS.textSecondary },
  bftTextStrong: { color: COLORS.textPrimary },

  actions: { flexDirection: 'row', gap: 10, marginTop: 28 },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  actionText: { fontSize: 14.5, fontWeight: '700', color: COLORS.textPrimary },
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
