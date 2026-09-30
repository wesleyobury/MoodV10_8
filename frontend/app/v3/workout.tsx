/**
 * V3 Workout Cart: /v3/workout?id=<workout_id>  (H2, replaces the Phase 2.6 Preview + Details pair)
 *
 * "Here is today's complete training plan. Review it, then start."
 *
 *   HERO           workout image (utils/cartHero resolveV3CartHero) · Direction + States · title · ~estimated min ·
 *                  level · body emphasis                                      [back]            [Different workout]
 *   (founder edit pass) a soreness / conflict reroute is one of the Built for Today reasons, never a separate card
 *   BUILT FOR TODAY  neutral card, collapsed to its lead line; expands to TODAY / MOOD CHOSE / every line
 *   Warm-up (collapsed) → every block in API order, Direction-specific headings (utils/v3CartFormat) → Cool-down
 *   Different workout                                                     sticky: Start Workout
 *
 * Read-first: rows open a detail sheet (media, cues, load guidance, quality stop, Swap). No reorder / remove / add /
 * edit here (H4). One source of truth: `env` is the server's envelope for this id; it is replaced only by a successful
 * server response for the same id (GET, Swap Exercise, Different Workout), never by an older version.
 * Start Workout opens V3_SESSION_ROUTE with the workout id; the V3 Guided Session replaces that screen, nothing here.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import { useAuth } from '../../contexts/AuthContext';
import { trackEvent } from '../../utils/analytics';
import { V3Envelope, getV3Workout, swapV3Exercise, swapV3Workout } from '../../utils/v3Api';
import { readCachedEnvelope, updateTodayEnvelope } from '../../utils/v3Today';
import { differentWorkoutMessage, exerciseIds, workoutDiff } from '../../utils/v3PreviewFormat';
import { rerouteNotice } from '../../utils/v3OverviewFormat';
import { cartBlocks, cartExplain, cartHeader, exerciseTotal } from '../../utils/v3CartFormat';
import { resolveV3CartHero } from '../../utils/cartHero';
import { CartBlockView } from '../../components/v3/CartBlockView';
import { TermChips, TermSheet } from '../../components/v3/TermSheet';
import type { TermId } from '../../utils/v3PlainLanguage';
import { ExerciseSheet } from '../../components/v3/ExerciseSheet';
import { ExerciseThumb } from '../../components/v3/ExerciseThumb';
import { HeroImage } from '../../components/v3/HeroImage';
import { heroImageSource } from '../../components/v3/v3Images';

/** Where Start Workout goes. The V3 Guided Session plugs in here (same param: the workout id). */
const V3_SESSION_ROUTE = '/v3/session';

const KIND_ICON = { adaptation: 'sparkles', decision: 'git-branch-outline', context: 'person-outline' } as const;

export default function V3WorkoutCart() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { token, user } = useAuth();
  const uid = user?.id ?? null;

  const [env, setEnv] = useState<V3Envelope | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [sheetItem, setSheetItem] = useState<string | null>(null);
  const [sheetNotice, setSheetNotice] = useState<string | null>(null);
  const [term, setTerm] = useState<TermId | null>(null);
  const [swappingItem, setSwappingItem] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [explainOpen, setExplainOpen] = useState(false);
  const [warmOpen, setWarmOpen] = useState(false);
  const [coolOpen, setCoolOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const viewedFor = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const track = useCallback(
    (name: string, meta: Record<string, any> = {}) => {
      if (token) trackEvent(token, name, { workout_id: id, surface: 'cart', ...meta });
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
    track('v3_cart_viewed', {
      direction: w.direction,
      archetype: w.archetype.id,
      selection_source: w.selection_source ?? null,
      target_mode: w.target.mode,
      duration: w.duration.requested_minutes,
      estimated_minutes: w.duration.estimated_minutes,
      exercises: exerciseIds(w).length,
      bft_lines: (w.built_for_today ?? []).length,
      media_count: w.blocks.reduce((n, b) => n + b.items.filter((i) => !!i.exercise.media).length, 0),
      outcome: env?.outcome ?? null,
      rerouted: env?.outcome === 'rerouted',
      requested_archetype: w.requested_archetype?.id ?? null,
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
    });
    accept(res.envelope, true);
    if (d.identical) {
      showToast("There isn't another version of this workout today.");
      return;
    }
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    contentOpacity.setValue(0.35);
    Animated.timing(contentOpacity, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    showToast(differentWorkoutMessage(before, after));
  };

  /* ------------------------------------------------------------ Swap Exercise (from the row sheet) */
  const onSwap = async (itemId: string) => {
    const w = env?.workout;
    if (!token || !id || !w || swappingItem) return;
    const before = w.blocks.flatMap((b) => b.items).find((i) => i.item_id === itemId);
    setSwappingItem(itemId);
    track('v3_swap_exercise_tapped', { item_id: itemId, from: before?.exercise.id });
    const res = await swapV3Exercise(token, id, itemId);
    setSwappingItem(null);
    // From the detail sheet the message shows inside the sheet; from a Cart row it is a quiet toast.
    const notify = (m: string) => {
      if (sheetItem) {
        setSheetNotice(m);
        setTimeout(() => setSheetNotice(null), 2600);
      } else showToast(m);
    };
    if (!res.ok) {
      track('v3_swap_exercise_result', { item_id: itemId, result: 'error', error_kind: res.error.kind, surface: sheetItem ? 'sheet' : 'row' });
      notify(res.error.message);
      return;
    }
    const next = res.envelope;
    if (next.status === 'conflict') {
      track('v3_swap_exercise_result', { item_id: itemId, result: next.conflict?.code ?? 'conflict', surface: sheetItem ? 'sheet' : 'row' });
      notify(next.conflict?.code === 'no_alternative' ? 'No other exercise fits this spot today, so this one stays.' : next.conflict?.message || 'No other exercise fits this spot today.');
      return;
    }
    accept(next, true);
    track('v3_swap_exercise_result', { item_id: itemId, result: 'swapped', from: before?.exercise.id, to: next.workout?.swapped_item?.to, surface: sheetItem ? 'sheet' : 'row' });
    setHighlight(itemId);
    setTimeout(() => setHighlight(null), 2200);
    const newName = next.workout?.blocks.flatMap((b) => b.items).find((i) => i.item_id === itemId)?.exercise.name;
    notify(newName ? `Swapped in ${newName}` : 'Exercise swapped');
  };

  const onStart = () => {
    const w = env?.workout;
    if (!w || !id) return;
    track('v3_start_workout_tapped', { direction: w.direction, archetype: w.archetype.id });
    router.push({ pathname: V3_SESSION_ROUTE, params: { id } } as any);
  };

  /* ------------------------------------------------------------ render */
  const w = env?.workout ?? null;
  const header = useMemo(() => (w ? cartHeader(w) : null), [w]);
  const blocks = useMemo(() => (w ? cartBlocks(w) : []), [w]);
  const reroute = w && env ? rerouteNotice(w, env.outcome) : null;
  const explain = useMemo(() => (w ? cartExplain(w, reroute) : null), [w, reroute]);
  const hero = w ? resolveV3CartHero(w) : null;
  const heroH = Math.round(Math.min(380, Math.max(300, width * 0.84))) + insets.top;

  return (
    <View style={styles.root} testID="v3-cart">
      {!w || !header || !explain || !hero ? (
        <View style={styles.center}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={[styles.glassBtn, { position: 'absolute', top: insets.top + 8, left: 14 }]} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
          </Pressable>
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
        <>
          <ScrollView ref={scrollRef} contentContainerStyle={{ paddingBottom: insets.bottom + 130 }} showsVerticalScrollIndicator={false}>
            <Animated.View style={{ opacity: contentOpacity }} testID="v3-cart-content">
              {/* ---------------- HERO */}
              <View style={{ height: heroH }}>
                <HeroImage
                  source={heroImageSource(hero.source, width)}
                  imageKey={hero.source.kind === 'asset' ? hero.source.key : hero.source.uri}
                  style={StyleSheet.absoluteFillObject as any}
                />
                <View style={styles.heroText}>
                  <Text style={styles.eyebrow} testID="v3-cart-eyebrow">
                    {header.eyebrow}
                  </Text>
                  <Text style={styles.title} testID="v3-cart-title">
                    {header.title}
                  </Text>
                  {header.subtitle ? <Text style={styles.subtitle}>{header.subtitle}</Text> : null}
                  <Text style={styles.facts} testID="v3-cart-meta">
                    {header.facts.join('  ·  ')}
                  </Text>
                </View>
              </View>

              <View style={styles.page}>
                {/* ---------------- Built for Today */}
                <Pressable
                  onPress={() => {
                    setExplainOpen((v) => !v);
                    if (!explainOpen) track('v3_built_for_today_expanded', {});
                  }}
                  style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
                  testID="v3-cart-bft"
                  accessibilityRole="button"
                  accessibilityState={{ expanded: explainOpen }}
                >
                  <View style={styles.cardHead}>
                    <Ionicons name="sparkles" size={13} color={COLORS.accent} />
                    <Text style={styles.cardLabel}>BUILT FOR TODAY</Text>
                    <View style={{ flex: 1 }} />
                    <Ionicons name={explainOpen ? 'chevron-up' : 'chevron-down'} size={16} color="rgba(255,255,255,0.45)" />
                  </View>
                  {!explainOpen ? (
                    <Text style={styles.cardText} numberOfLines={2}>
                      {explain.lead ?? "Built from your Training Profile and today's choices."}
                    </Text>
                  ) : (
                    <View testID="v3-cart-bft-open">
                      {explain.told.length ? (
                        <>
                          <Text style={styles.miniLabel}>YOU TOLD MOOD</Text>
                          <View style={styles.pills}>
                            {explain.told.map((t) => (
                              <View key={t} style={styles.pill}>
                                <Text style={styles.pillText}>{t}</Text>
                              </View>
                            ))}
                          </View>
                        </>
                      ) : null}
                      {explain.chose ? (
                        <>
                          <Text style={[styles.miniLabel, { marginTop: 14 }]}>MOOD CHOSE</Text>
                          <Text style={styles.chose}>{explain.chose}</Text>
                          {explain.chosenBy ? <Text style={styles.chosenBy}>{explain.chosenBy}</Text> : null}
                        </>
                      ) : null}
                      {explain.lines.length ? <View style={styles.rule} /> : null}
                      {explain.lines.map((l) => (
                        <View key={l.key} style={styles.line}>
                          <Ionicons name={KIND_ICON[l.kind] as any} size={14} color={l.kind === 'adaptation' ? COLORS.accent : 'rgba(255,255,255,0.45)'} style={{ marginTop: 3 }} />
                          <Text style={[styles.lineText, l.kind === 'adaptation' && styles.lineStrong]}>{l.text}</Text>
                        </View>
                      ))}
                      <TermChips terms={explain.terms} onPick={setTerm} style={{ marginTop: 12 }} />
                    </View>
                  )}
                </Pressable>

                {/* ---------------- Warm-up */}
                {w.warmup && (w.warmup.guidance || w.warmup.items.length) ? (
                  <Pressable onPress={() => setWarmOpen((v) => !v)} style={styles.side} testID="v3-cart-warmup">
                    <View style={styles.sideHead}>
                      <Text style={styles.sideTitle}>Warm-up</Text>
                      <Text style={styles.sideMin}>{w.warmup.minutes ? `${Math.round(w.warmup.minutes)} min` : ''}</Text>
                      <Ionicons name={warmOpen ? 'chevron-up' : 'chevron-down'} size={16} color="rgba(255,255,255,0.45)" />
                    </View>
                    {!warmOpen ? (
                      <Text style={styles.sideText} numberOfLines={1}>
                        {w.warmup.items.length ? w.warmup.items.map((x) => x.name).join(' · ') : w.warmup.guidance}
                      </Text>
                    ) : w.warmup.items.length ? (
                      w.warmup.items.map((x, i) => (
                        <View key={`${x.name}-${i}`} style={styles.wuRow}>
                          <ExerciseThumb item={x} size={36} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.wuName}>{x.name}</Text>
                            <Text style={styles.wuMeta}>{[x.component_label, x.prescription_text].filter(Boolean).join(' · ')}</Text>
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.sideText}>{w.warmup.guidance}</Text>
                    )}
                    {warmOpen && w.warmup.items.length && w.warmup.guidance ? <Text style={[styles.sideText, { marginTop: 10 }]}>{w.warmup.guidance}</Text> : null}
                  </Pressable>
                ) : null}

                {/* ---------------- Session */}
                {blocks.map((b) => (
                  <CartBlockView
                    key={b.key}
                    block={b}
                    highlightItemId={highlight}
                    onSwap={(it) => onSwap(it.item_id)}
                    swappingItemId={swappingItem}
                    onTerm={setTerm}
                    onOpen={(it) => {
                      setSheetItem(it.item_id);
                      track('v3_exercise_detail_opened', { item_id: it.item_id, exercise: it.exercise.id, has_media: !!it.exercise.media });
                    }}
                  />
                ))}

                {/* ---------------- Cool-down */}
                {w.cooldown && w.cooldown.guidance ? (
                  <Pressable onPress={() => setCoolOpen((v) => !v)} style={[styles.side, { marginTop: 30 }]} testID="v3-cart-cooldown">
                    <View style={styles.sideHead}>
                      <Text style={styles.sideTitle}>Cool-down</Text>
                      <Text style={styles.sideMin}>{w.cooldown.minutes ? `${Math.round(w.cooldown.minutes)} min` : ''}</Text>
                      <Ionicons name={coolOpen ? 'chevron-up' : 'chevron-down'} size={16} color="rgba(255,255,255,0.45)" />
                    </View>
                    <Text style={styles.sideText} numberOfLines={coolOpen ? undefined : 1}>
                      {w.cooldown.guidance}
                    </Text>
                  </Pressable>
                ) : null}

                <Text style={styles.totals} testID="v3-cart-totals">
                  {`${exerciseTotal(w)} exercises · ${header.facts[0]}`}
                </Text>

                <Pressable
                  onPress={onDifferent}
                  disabled={building}
                  style={({ pressed }) => [styles.different, pressed && { opacity: 0.75 }]}
                  testID="v3-swap-workout"
                  accessibilityState={{ busy: building }}
                >
                  {building ? <ActivityIndicator size="small" color={COLORS.textPrimary} /> : <Ionicons name="shuffle" size={17} color={COLORS.textPrimary} />}
                  <Text style={styles.differentText}>{building ? 'Building…' : 'Different workout'}</Text>
                </Pressable>
              </View>
            </Animated.View>
          </ScrollView>

          {/* Floating hero controls */}
          <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
            <Pressable onPress={() => router.back()} hitSlop={10} style={styles.glassBtn} accessibilityLabel="Back" testID="v3-cart-back">
              <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
            </Pressable>
            <Pressable onPress={onDifferent} disabled={building} hitSlop={10} style={styles.glassBtn} accessibilityLabel="Different workout" testID="v3-cart-different-top">
              {building ? <ActivityIndicator size="small" color={COLORS.textPrimary} /> : <Ionicons name="shuffle" size={19} color={COLORS.textPrimary} />}
            </Pressable>
          </View>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <LinearGradient colors={['rgba(10,10,10,0)', COLORS.bg]} style={styles.fade as any} />
            <Pressable onPress={onStart} disabled={building} testID="v3-start-workout">
              <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.cta, building && { opacity: 0.6 }] as any}>
                <Ionicons name="play" size={18} color={COLORS.accentInk} />
                <Text style={styles.ctaText}>Start Workout</Text>
              </LinearGradient>
            </Pressable>
          </View>

          <ExerciseSheet
            workout={w}
            itemId={sheetItem}
            swapping={!!swappingItem}
            notice={sheetNotice}
            onSwap={onSwap}
            onClose={() => {
              setSheetItem(null);
              setSheetNotice(null);
            }}
          />
        </>
      )}

      <TermSheet term={term} onClose={() => setTerm(null)} />
      {toast ? (
        <Animated.View style={[styles.toast, { top: insets.top + 60, opacity: toastOpacity }]} pointerEvents="none" testID="v3-cart-toast">
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  errorText: { fontSize: 15, lineHeight: 22, color: COLORS.textSecondary, textAlign: 'center' },
  errorBtn: { marginTop: 16, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.08)' },
  errorBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },

  topBar: { position: 'absolute', left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between' },
  glassBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12,12,12,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },

  heroText: { position: 'absolute', left: 22, right: 22, bottom: 14 },
  eyebrow: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1.9, color: COLORS.accent },
  title: { fontSize: 36, lineHeight: 41, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.9, marginTop: 6 },
  subtitle: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.78)', marginTop: 2 },
  facts: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.82)', marginTop: 8 },

  page: { paddingHorizontal: 20 },
  card: {
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  cardLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.6, color: COLORS.textSecondary },
  cardText: { fontSize: 14.5, lineHeight: 21, color: COLORS.textPrimary },
  miniLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.5, color: COLORS.textTertiary, marginTop: 2 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', maxWidth: '100%' },
  pillText: { fontSize: 12.5, fontWeight: '600', color: COLORS.textPrimary },
  chose: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginTop: 5 },
  chosenBy: { fontSize: 12.5, color: COLORS.textSecondary, marginTop: 2 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 14 },
  line: { flexDirection: 'row', gap: 10, paddingVertical: 5 },
  lineText: { flex: 1, fontSize: 14, lineHeight: 20, color: COLORS.textSecondary },
  lineStrong: { color: COLORS.textPrimary },

  side: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sideHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sideTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  sideMin: { fontSize: 12.5, color: COLORS.textTertiary },
  sideText: { fontSize: 13, lineHeight: 19, color: COLORS.textTertiary, marginTop: 6 },
  wuRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  wuName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  wuMeta: { fontSize: 12, color: COLORS.textTertiary, marginTop: 1 },

  totals: { fontSize: 12.5, color: COLORS.textTertiary, textAlign: 'center', marginTop: 28 },
  different: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  differentText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },

  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20 },
  fade: { position: 'absolute', left: 0, right: 0, top: -36, bottom: 0 },
  cta: { height: 58, borderRadius: 18, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
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
