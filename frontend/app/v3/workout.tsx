/**
 * V3 Workout Cart: /v3/workout?id=<workout_id>  (H2, replaces the Phase 2.6 Preview + Details pair)
 *
 * "Here is today's complete training plan. Review it, then start."
 *
 *   HERO           workout image (utils/cartHero resolveV3CartHero) · Direction + States · title · ~estimated min ·
 *                  level · body emphasis                                      [back]            [Different workout]
 *   (founder edit pass) a soreness / conflict reroute is one of the Built for Today reasons, never a separate card
 *   BUILT FOR TODAY  neutral card, collapsed to its lead line; expands to TODAY / MOOD CHOSE / every line
 *   blocks grouped by programming role (utils/v3CartFormat cartSections: PRIMARY / SECONDARY / ACCESSORIES / FINISHER; thumbnail, name, sets × reps; no rest,
 *   no warm-up, no coaching: that is the session's job) → Cool-down
 *   Different workout                                                     sticky: Start Workout
 *
 * Read-first: rows open a detail sheet (media, cues, load guidance, quality stop, Swap). No reorder / remove / add /
 * edit here (H4). One source of truth: `env` is the server's envelope for this id; it is replaced only by a successful
 * server response for the same id (GET, Swap Exercise, Different Workout), never by an older version.
 * Start Workout opens V3_SESSION_ROUTE with the workout id; the V3 Guided Session replaces that screen, nothing here.
 *
 * Completed mode (Profile > Workout History, `completed=<summary line>`): the same Cart, read-only. A "Completed" summary sits
 * under the hero, Swap / Different workout are hidden, and the sticky CTA is Do Again: Build opens with this workout's
 * Direction, focus and length preselected (utils/v3Activity doAgainPreset), so today's States still shape the new one.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Shimmer } from '../../components/v3/Shimmer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { BRAND_GRADIENT, COLORS, bgA } from '../../constants/brand';
import { useAuth } from '../../contexts/AuthContext';
import { trackEvent } from '../../utils/analytics';
import { V3Envelope, getV3Workout, swapV3Exercise, swapV3Workout } from '../../utils/v3Api';
import { readCachedEnvelope, updateTodayEnvelope } from '../../utils/v3Today';
import { findSavedV3, saveV3, unsaveV3 } from '../../utils/v3Saved';
import * as Haptics from 'expo-haptics';
import { exerciseIds, workoutDiff } from '../../utils/v3PreviewFormat';
import { rerouteNotice } from '../../utils/v3OverviewFormat';
import { cartExplain, cartHeader, cartSections, exerciseTotal } from '../../utils/v3CartFormat';
import { resolveV3CartHero } from '../../utils/cartHero';
import { CartSectionView } from '../../components/v3/CartSectionView';
import { TermChips, TermSheet } from '../../components/v3/TermSheet';
import type { TermId } from '../../utils/v3PlainLanguage';
import { ExerciseSheet } from '../../components/v3/ExerciseSheet';
import { warmExerciseDemos } from '../../utils/cloudinaryVideo';
import { Image as CachedImage } from 'expo-image';
import { exerciseImageUrl } from '../../utils/v3ExerciseImages';
import { optimizedImageUrl } from '../../utils/cloudinaryImage';
import { HeroImage } from '../../components/v3/HeroImage';
import { heroImageSource } from '../../components/v3/v3Images';
import { doAgainPreset } from '../../utils/v3Activity';
import { buildPresetParams } from '../../utils/v3Explore';
import { CompletedStatsOverlay } from '../../components/v3/CompletedStatsOverlay';
import { useV3StartGate } from '../../utils/v3Session/startGate';
import { readSession } from '../../utils/v3Session/store';
import { BftLiveText, BftSource } from '../../components/v3/BftLiveText';
import GuestGate from '../../components/GuestGate';

/** Where Start Workout goes. The V3 Guided Session plugs in here (same param: the workout id). */
const V3_SESSION_ROUTE = '/v3/session';


function V3WorkoutCartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { id, saved: savedParam, completed } = useLocalSearchParams<{ id?: string; saved?: string; completed?: string }>();
  /** read-only: opened from Profile > Workout History */
  const isDone = !!completed;
  const [statsOpen, setStatsOpen] = useState(false);
  const { token, user } = useAuth();
  const uid = user?.id ?? null;
  const startGate = useV3StartGate();
  const [starting, setStarting] = useState(false);

  const [env, setEnv] = useState<V3Envelope | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [sheetItem, setSheetItem] = useState<string | null>(null);
  const [sheetNotice, setSheetNotice] = useState<string | null>(null);
  const [term, setTerm] = useState<TermId | null>(null);
  const [swappingItem, setSwappingItem] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [explainOpen, setExplainOpen] = useState(false);
  const [coolOpen, setCoolOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  /** Save to profile (utils/v3Saved): the saved entry's id when this workout is saved. */
  const [savedId, setSavedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    if (!token || !id) return;
    // opened from Profile > Saved Workouts: this copy belongs to that saved entry
    if (savedParam) {
      setSavedId(savedParam);
      return;
    }
    let alive = true;
    findSavedV3(token, id).then((hit) => alive && setSavedId(hit?.id ?? null));
    return () => {
      alive = false;
    };
  }, [token, id, savedParam]);

  const onToggleSave = async () => {
    const wk = env?.workout;
    if (!token || !wk || saving) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSaving(true);
    try {
      if (savedId) {
        if (await unsaveV3(token, savedId)) {
          setSavedId(null);
          showToast('Removed from your saved workouts.');
          track('v3_workout_unsaved', {});
        } else showToast('Could not update right now. Try again.');
      } else {
        const r = await saveV3(token, wk);
        if (r.ok) {
          setSavedId(r.id ?? 'saved');
          showToast(r.already ? 'Already in your saved workouts.' : 'Saved to your profile.');
          track('v3_workout_saved', { archetype: wk.archetype.id, direction: wk.direction });
        } else showToast('Could not save right now. Try again.');
      }
    } finally {
      setSaving(false);
    }
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

  /** Built for Today finished writing: keep the on-screen envelope (and the Today cache) in step, so chips and a reopen agree. */
  const onBftSettled = useCallback(
    (text: string, source: BftSource) => {
      setEnv((cur) => {
        if (!cur?.workout?.today || cur.workout.workout_id !== id) return cur;
        const today = { ...cur.workout.today, blurb: text, blurb_pending: false, blurb_meta: { source, frame: null, facts: cur.workout.today.blurb_meta?.facts ?? [] } };
        const next = { ...cur, workout: { ...cur.workout, today } };
        if (uid) updateTodayEnvelope(uid, next);
        return next;
      });
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

  // demos the athlete may open from here or in the session: have Cloudinary derive them now, not on the first tap
  useEffect(() => {
    const w = env?.workout;
    if (w) warmExerciseDemos(w.blocks.flatMap((b) => b.items.map((it) => it.exercise.media?.video_url)));
    // the Guided Session's full-size photos, cached before Start Workout
    if (w) {
      const urls = w.blocks.flatMap((b) => b.items.map((it) => exerciseImageUrl(it))).filter((u): u is string => !!u).map((u) => optimizedImageUrl(u, 1080));
      if (urls.length) CachedImage.prefetch(urls, 'memory-disk').catch(() => undefined);
    }
  }, [env?.workout?.workout_id, env?.workout?.version]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!res.ok && res.error.kind === 'completed') {
      // finished already: Different Workout cannot change it. Send them Home, where the card builds a fresh one.
      track('v3_swap_workout_result', { result: 'completed' });
      showToast('You already finished this one. Pick a fresh workout on Home.');
      setTimeout(() => router.replace('/(tabs)' as any), 1400);
      return;
    }
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
    // no confirmation toast (founder pass, Oct 2026): the new workout on screen is the confirmation
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

  const onDoAgain = () => {
    const w = env?.workout;
    if (!w) return;
    const preset = doAgainPreset({
      at: '', source: 'v3', minutes: null, direction: w.direction, target: w.target, archetype: w.archetype,
      selection_source: w.selection_source ?? null, requested_minutes: w.duration?.requested_minutes ?? null,
    });
    if (!preset) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    track('v3_do_again_tapped', { direction: w.direction, archetype: w.archetype.id, surface: 'cart_completed' });
    router.push({ pathname: '/v3/build', params: buildPresetParams(preset, 'do_again') } as any);
  };

  const onStart = async () => {
    const w = env?.workout;
    if (!w || !id || starting) return;
    track('v3_start_workout_tapped', { direction: w.direction, archetype: w.archetype.id });
    // Start = the activation moment, and the paywall point for workout #2 (utils/v3Session/access.ts). A different
    // workout still in progress is not gated here: the session screen asks Continue / Replace first, and a Replace is
    // gated there as a fresh start.
    setStarting(true);
    try {
      const active = uid ? (await readSession(uid)).record : null;
      const otherActive = !!active && active.status === 'active' && active.workoutId !== id;
      if (!otherActive && !(await startGate(id))) {
        track('v3_start_workout_paywalled', { direction: w.direction, archetype: w.archetype.id, workout_id: id });
        return;
      }
      router.push({ pathname: V3_SESSION_ROUTE, params: { id } } as any);
    } finally {
      setStarting(false);
    }
  };

  /* ------------------------------------------------------------ render */
  const w = env?.workout ?? null;
  const header = useMemo(() => (w ? cartHeader(w) : null), [w]);
  const sections = useMemo(() => (w ? cartSections(w) : []), [w]);
  const reroute = w && env ? rerouteNotice(w, env.outcome) : null;
  const explain = useMemo(() => (w ? cartExplain(w, reroute) : null), [w, reroute]);
  const hero = w ? resolveV3CartHero(w) : null;
  // the photo starts under the status bar (never behind the speaker / front camera); the bar above it stays dark
  const heroImgH = Math.round(Math.min(400, Math.max(320, width * 0.9)));
  const heroH = heroImgH + insets.top;

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
                  // every Cart hero is a 4:5 portrait (the bundled payoff photos and the Cart hero library, 1080 × 1350).
                  // Same treatment as the Guided photo: runs to the very top of the screen, its bottom where it was (status
                  // bar + full-width 4:5), scaled up a touch so a sliver of each side goes; heads never cut, no black fade
                  portraitAspect={0.8}
                  extendTop={insets.top}
                  testID="v3-cart-hero"
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
                {isDone ? (
                  <View style={[styles.card, styles.doneCard]} testID="v3-cart-completed">
                    <Ionicons name="checkmark-circle" size={18} color="#5FE0A0" />
                    <Text style={styles.doneText}>{completed}</Text>
                  </View>
                ) : null}
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
                    <Text style={styles.cardLabel}>BUILT FOR YOUR MOOD</Text>
                    <View style={{ flex: 1 }} />
                    <Ionicons name={explainOpen ? 'chevron-up' : 'chevron-down'} size={16} color="rgba(255,255,255,0.45)" />
                  </View>
                  {/* Founder pass (Oct 2026): one reasoning blurb, no bullets. Collapsed it previews; tapped it reads in full. */}
                  {/* Oct 2026 hybrid streaming: while the server writes, the validated sentences are revealed in place (no
                      fallback-then-swap); a reopened workout shows its saved message at once. */}
                  <BftLiveText
                    key={`${w.workout_id}:${w.today?.bft_job ?? 'static'}`}
                    token={token ?? null}
                    workoutId={w.workout_id}
                    job={w.today?.bft_job ?? null}
                    pending={!!w.today?.blurb_pending && !isDone}
                    fallback={explain.blurb ?? "Built from your Training Profile and today's choices."}
                    style={styles.cardText}
                    numberOfLines={explainOpen ? undefined : 3}
                    testID={explainOpen ? 'v3-cart-bft-open' : 'v3-cart-bft-text'}
                    onSettled={onBftSettled}
                  />
                  {explainOpen ? <TermChips terms={explain.terms} onPick={setTerm} style={{ marginTop: 12 }} /> : null}
                </Pressable>

                {/* ---------------- Session */}
                {sections.map((sec) => (
                  <CartSectionView
                    key={sec.key}
                    section={sec}
                    highlightItemId={highlight}
                    onSwap={isDone ? undefined : (it) => onSwap(it.item_id)}
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
                  {`${exerciseTotal(w)} exercises · ${header.facts[0]}${w.warmup ? ' · warm-up included' : ''}`}
                </Text>

                {!isDone ? (
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
                ) : null}
              </View>
            </Animated.View>
          </ScrollView>

          {/* Floating hero controls */}
          <View style={[styles.topBar, { top: insets.top + 8 }]} pointerEvents="box-none">
            <Pressable onPress={() => router.back()} hitSlop={10} style={styles.glassBtn} accessibilityLabel="Back" testID="v3-cart-back">
              <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
            </Pressable>
            <View style={styles.topRight}>
              <Pressable
                onPress={onToggleSave}
                disabled={saving}
                hitSlop={10}
                style={styles.glassBtn}
                accessibilityLabel={savedId ? 'Saved to your profile. Tap to remove.' : 'Save to your profile'}
                accessibilityState={{ selected: !!savedId, busy: saving }}
                testID="v3-cart-save"
              >
                {saving ? <ActivityIndicator size="small" color={COLORS.textPrimary} /> : <Ionicons name={savedId ? 'bookmark' : 'bookmark-outline'} size={18} color={savedId ? COLORS.accent : COLORS.textPrimary} />}
              </Pressable>
              {!isDone ? (
                <Pressable onPress={onDifferent} disabled={building} hitSlop={10} style={[styles.glassBtn, { overflow: 'hidden' }]} accessibilityLabel="Different workout" testID="v3-cart-different-top">
                  {!building ? <Shimmer size={38} /> : null}
                  {building ? <ActivityIndicator size="small" color={COLORS.textPrimary} /> : <Ionicons name="shuffle" size={19} color={COLORS.textPrimary} />}
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <LinearGradient colors={[bgA(0), COLORS.bg]} style={styles.fade as any} />
            {isDone ? (
              <View style={styles.doneRow}>
                <Pressable
                  onPress={() => {
                    setStatsOpen(true);
                    track('v3_completed_stats_opened', {});
                  }}
                  style={({ pressed }) => [styles.statsBtn, pressed && { opacity: 0.8 }]}
                  testID="v3-completed-stats-open"
                >
                  <Ionicons name="stats-chart" size={17} color={COLORS.textPrimary} />
                  <Text style={styles.statsBtnText}>Stats</Text>
                </Pressable>
                <Pressable onPress={onDoAgain} style={{ flex: 1 }} testID="v3-do-again">
                  <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta as any}>
                    <Ionicons name="refresh" size={18} color={COLORS.accentInk} />
                    <Text style={styles.ctaText}>Do Again</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            ) : (
              <Pressable onPress={onStart} disabled={building || starting} testID="v3-start-workout">
                <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.cta, building && { opacity: 0.6 }] as any}>
                  <Ionicons name="play" size={18} color={COLORS.accentInk} />
                  <Text style={styles.ctaText}>Start Workout</Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>

          <ExerciseSheet
            workout={w}
            itemId={sheetItem}
            swapping={!!swappingItem}
            notice={sheetNotice}
            onSwap={isDone ? undefined : onSwap}
            onClose={() => {
              setSheetItem(null);
              setSheetNotice(null);
            }}
          />
        </>
      )}

      <TermSheet term={term} onClose={() => setTerm(null)} />
      {isDone && w ? <CompletedStatsOverlay visible={statsOpen} token={token ?? null} workout={w} onClose={() => setStatsOpen(false)} /> : null}
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
  topRight: { flexDirection: 'row', gap: 10 },
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
  doneCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  doneRow: { flexDirection: 'row', gap: 10 },
  statsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 20, height: 58, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.16)' },
  statsBtnText: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  doneText: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
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


/** Workouts need a profile: guests get the sign-up prompt (components/GuestGate). */
export default function V3WorkoutCart() {
  const { isGuest } = useAuth();
  if (isGuest) return <GuestGate action="start this workout" />;
  return <V3WorkoutCartScreen />;
}
