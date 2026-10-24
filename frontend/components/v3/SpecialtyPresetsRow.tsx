/**
 * Home entry point for the 18 MOOD V3 Specialty Workout Presets (founder build, Oct 2026).
 *
 * Per the locked product rule (MOOD_V3_Specialty_Generator scope doc): presets are NOT a 4th Direction and do not
 * touch the Build flow's 3-card Direction step (Strength/Sweat/Athletic stays exactly as it is). This is new,
 * additive content on Home.
 *
 * Shape (Wes, Oct 2026 feedback #11/#12/#13 -- a full redo of the original flat 18-card scroll row, then a
 * hero-source correction, then two animation/polish passes): a one-at-a-time hero carousel of the 6 EQUIPMENT
 * groups ("Barbell Only", "Dumbbell Only", ... -- SPECIALTY_EQUIPMENT_GROUPS), each a true-16:9 photo
 * (SPECIALTY_EQUIPMENT_GROUPS[i].heroUri, from the "Cart Heroes/preset heros" shoot -- NOT a per-preset photo).
 * The previous/next cards sit almost entirely BEHIND the centered one (heavy horizontal overlap, a sliver
 * peeking at each edge, lower zIndex, slight rotateY tilt for a "revolving circle" read) at full opacity --
 * no fade -- rather than beside it with a faded slideshow feel. It auto-shuffles to a random next card on a
 * timer, and can be swiped manually (which pauses and restarts the auto-shuffle, so a manual swipe never gets
 * immediately overridden). Starts on a random equipment every time Home mounts -- there is intentionally no
 * fixed/first card.
 *
 * Tapping an equipment card animates a cross-fade into that equipment's 3 body-part cards (Full/Upper/Lower),
 * each showing a real exercise thumbnail (SPECIALTY_DRILLDOWN_THUMB -- a fixed representative exercise per
 * preset, not a live preview; see that constant's own comment for why). The drill-down tiles deliberately
 * reuse the hero card's own format (16:9 aspect, same gradient stops, same bold-title/sub-caption layout) so
 * the drill-down reads as a continuation of the same card family, not a jump into a separate section. Tapping
 * one of THOSE calls the independent specialty generator (POST /api/v3/specialty/generate) and opens the
 * existing Cart screen (/v3/workout) with a `kind=specialty` param, same as before. A back chevron returns to
 * the equipment carousel.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Dimensions, Easing, ImageBackground, NativeScrollEvent, NativeSyntheticEvent,
  Pressable, StyleSheet, Text, View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../SafeLinearGradient';
import { COLORS } from '../../constants/brand';
import { useAuth } from '../../contexts/AuthContext';
import { trackEvent } from '../../utils/analytics';
import { optimizedImageUrl } from '../../utils/cloudinaryImage';
import { generateSpecialtyWorkout } from '../../utils/v3Api';
import { SPECIALTY_DRILLDOWN_THUMB, SPECIALTY_EQUIPMENT_GROUPS, SPECIALTY_EQUIPMENT_ICON, SPECIALTY_PRESETS, titleParts } from '../../utils/v3Specialty';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.78);
const CARD_GAP = 12;
const STEP = CARD_WIDTH + CARD_GAP;
const SIDE_PAD = (SCREEN_WIDTH - CARD_WIDTH) / 2;
const CARD_HEIGHT = Math.round((CARD_WIDTH * 9) / 16); // 16:9, on purpose (Wes, Oct 2026)
const AUTO_SHUFFLE_MS = 4500;
const DRILL_GAP = 10;
// Drill-down tiles keep the SAME 16:9 format as the hero card, just smaller (3-across) -- so the drill-down
// reads as the hero card's own family, not a differently-shaped new section (Wes, Oct 2026 feedback #13).
const DRILL_TILE_WIDTH = Math.round((SCREEN_WIDTH - 32 - DRILL_GAP * 2) / 3);
const DRILL_TILE_HEIGHT = Math.round((DRILL_TILE_WIDTH * 9) / 16);
// How much of a side card peeks out from behind the centered one (Wes, Oct 2026 feedback #13: "behind, no fade").
const PEEK = 20;
const PRESET_BY_ID = new Map(SPECIALTY_PRESETS.map((p) => [p.id, p]));

export function SpecialtyPresetsRow() {
  const { token } = useAuth();
  const router = useRouter();
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null); // equipment key, or null = carousel showing

  const onPressPreset = useCallback(async (presetId: string) => {
    if (!token || generatingId) return;
    setErrorText(null);
    setGeneratingId(presetId);
    trackEvent(token, 'v3_specialty_preset_tapped', { preset_id: presetId });
    const res = await generateSpecialtyWorkout(token, { preset_id: presetId });
    setGeneratingId(null);
    if (!res.ok) {
      trackEvent(token, 'v3_specialty_generation_outcome', { preset_id: presetId, outcome: 'error', error_kind: res.error.kind });
      setErrorText(res.error.message || "Couldn't build that workout. Try again.");
      return;
    }
    const workoutId = res.envelope.workout?.workout_id as string | undefined;
    if (!workoutId) {
      setErrorText("Couldn't build that workout. Try again.");
      return;
    }
    trackEvent(token, 'v3_specialty_generation_outcome', { preset_id: presetId, outcome: res.envelope.outcome });
    router.push({ pathname: '/v3/workout', params: { id: workoutId, kind: 'specialty' } } as any);
  }, [token, generatingId, router]);

  /* ------------------------------------------------------------------ equipment carousel */
  const scrollRef = useRef<any>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const indexRef = useRef(Math.floor(Math.random() * SPECIALTY_EQUIPMENT_GROUPS.length)); // no fixed starting preset
  const [initialIndex] = useState(indexRef.current);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToIndex = useCallback((i: number, animated = true) => {
    indexRef.current = i;
    scrollRef.current?.scrollTo?.({ x: i * STEP, animated });
  }, []);

  const startAutoShuffle = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const n = SPECIALTY_EQUIPMENT_GROUPS.length;
      if (n < 2) return;
      let next = Math.floor(Math.random() * n);
      if (next === indexRef.current) next = (next + 1) % n;
      scrollToIndex(next);
    }, AUTO_SHUFFLE_MS);
  }, [scrollToIndex]);

  useEffect(() => {
    if (expanded) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    startAutoShuffle();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [expanded, startAutoShuffle]);

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false });

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / STEP);
    indexRef.current = Math.max(0, Math.min(SPECIALTY_EQUIPMENT_GROUPS.length - 1, i));
    startAutoShuffle(); // a manual swipe just happened -- restart the auto-shuffle window instead of firing immediately
  };

  /* ------------------------------------------------------------------ drill-down cross-fade */
  const drillAnim = useRef(new Animated.Value(0)).current;
  const openDrilldown = (equipment: string) => {
    setExpanded(equipment);
    Animated.timing(drillAnim, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };
  const closeDrilldown = () => {
    Animated.timing(drillAnim, { toValue: 0, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
      if (finished) setExpanded(null);
    });
  };

  const expandedGroup = useMemo(
    () => (expanded ? SPECIALTY_EQUIPMENT_GROUPS.find((g) => g.equipment === expanded) ?? null : null),
    [expanded],
  );

  return (
    <View style={styles.section} testID="v3-home-specialty">
      <View style={styles.pad}>
        <Text style={styles.secTitle}>Specialty Workouts</Text>
        <Text style={styles.secSub} numberOfLines={2}>
          Equipment-specific sessions: kettlebell complexes, landmine flows, park circuits and more.
        </Text>
      </View>
      {errorText ? (
        <View style={styles.pad}>
          <Text style={styles.error}>{errorText}</Text>
        </View>
      ) : null}

      <View style={{ height: CARD_HEIGHT + 16, marginTop: 10 }}>
        {/* Carousel: one equipment hero at a time, neighbors peeking */}
        <Animated.View
          pointerEvents={expanded ? 'none' : 'auto'}
          style={[StyleSheet.absoluteFill, { opacity: drillAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}
        >
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={STEP}
            snapToAlignment="start"
            contentContainerStyle={{ paddingHorizontal: SIDE_PAD, gap: CARD_GAP }}
            contentOffset={{ x: initialIndex * STEP, y: 0 }}
            onScroll={onScroll}
            scrollEventThrottle={16}
            onMomentumScrollEnd={onMomentumEnd}
          >
            {SPECIALTY_EQUIPMENT_GROUPS.map((g, i) => {
              const inputRange = [(i - 1) * STEP, i * STEP, (i + 1) * STEP];
              // "Behind, not beside" (Wes, Oct 2026 feedback #13): side cards are pulled in by almost a full
              // STEP so they sit mostly behind the centered card (just a PEEK sliver showing at each edge),
              // at full opacity -- no fade -- with a lower zIndex and a slight rotateY for the "revolving
              // circle" read, instead of floating beside it as a faded slideshow neighbor.
              const scale = scrollX.interpolate({ inputRange, outputRange: [0.86, 1, 0.86], extrapolate: 'clamp' });
              const rotateY = scrollX.interpolate({ inputRange, outputRange: ['16deg', '0deg', '-16deg'], extrapolate: 'clamp' });
              const pullIn = scrollX.interpolate({ inputRange, outputRange: [-(STEP - PEEK), 0, STEP - PEEK], extrapolate: 'clamp' });
              const zIndex = scrollX.interpolate({ inputRange, outputRange: [0, 10, 0], extrapolate: 'clamp' });
              const heroUri = g.heroUri; // true-16:9 equipment photo (SPECIALTY_EQUIPMENT_HERO), not a per-preset shot
              return (
                <Animated.View
                  key={g.equipment}
                  style={{
                    width: CARD_WIDTH,
                    zIndex: zIndex as unknown as number,
                    transform: [{ perspective: 900 }, { translateX: pullIn }, { rotateY }, { scale }],
                  }}
                >
                  <Pressable
                    onPress={() => openDrilldown(g.equipment)}
                    style={({ pressed }) => [styles.heroCard, pressed && { transform: [{ scale: 0.98 }] }]}
                    accessibilityRole="button"
                    accessibilityLabel={g.label}
                    testID={`v3-specialty-equipment-${g.equipment}`}
                  >
                    <ImageBackground
                      source={{ uri: optimizedImageUrl(heroUri, Math.round(CARD_WIDTH * 3)) }}
                      resizeMode="cover"
                      style={styles.heroImg}
                      imageStyle={styles.heroImgInner}
                    >
                      <LinearGradient colors={['rgba(10,10,10,0)', 'rgba(10,10,10,0.9)']} locations={[0.3, 1]} style={StyleSheet.absoluteFillObject as any} />
                      <View style={styles.heroIconWrap}>
                        <Ionicons name={SPECIALTY_EQUIPMENT_ICON[g.equipment] as any} size={16} color={COLORS.textPrimary} />
                      </View>
                      <View style={styles.heroText}>
                        <Text style={styles.heroName}>{g.label}</Text>
                        <Text style={styles.heroSub}>3 ways to train -- full, upper &amp; leg day</Text>
                      </View>
                    </ImageBackground>
                  </Pressable>
                </Animated.View>
              );
            })}
          </Animated.ScrollView>
        </Animated.View>

        {/* Drill-down: the tapped equipment's 3 body-part presets, real exercise thumbnails */}
        <Animated.View
          pointerEvents={expanded ? 'auto' : 'none'}
          style={[
            StyleSheet.absoluteFill,
            styles.pad,
            {
              opacity: drillAnim,
              transform: [{ translateY: drillAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
            },
          ]}
        >
          {expandedGroup ? (
            <>
              {/* Same bold-label treatment as the hero card's own heroName/heroIconWrap (Wes, Oct 2026 feedback
                  #13), so this reads as "the same card, zoomed in" rather than a nav header into a new page. */}
              <Pressable onPress={closeDrilldown} style={styles.backRow} accessibilityRole="button" accessibilityLabel="Back to equipment">
                <View style={styles.heroIconWrap}>
                  <Ionicons name="chevron-back" size={16} color={COLORS.textPrimary} />
                </View>
                <Text style={styles.backText}>{expandedGroup.label}</Text>
              </Pressable>
              <View style={styles.drillRow}>
                {expandedGroup.presets.map((presetId) => {
                  const preset = PRESET_BY_ID.get(presetId)!;
                  const busy = generatingId === presetId;
                  const thumb = SPECIALTY_DRILLDOWN_THUMB[presetId];
                  return (
                    <Pressable
                      key={presetId}
                      onPress={() => onPressPreset(presetId)}
                      disabled={!!generatingId}
                      style={({ pressed }) => [styles.drillCard, pressed && !generatingId && { transform: [{ scale: 0.97 }] }, generatingId && !busy && { opacity: 0.5 }]}
                      accessibilityRole="button"
                      accessibilityLabel={preset.name}
                      testID={`v3-specialty-preset-${presetId}`}
                    >
                      {/* Same gradient stops/locations as the hero card's own ImageBackground overlay. */}
                      <ImageBackground source={{ uri: optimizedImageUrl(thumb, Math.round(DRILL_TILE_WIDTH * 3)) }} resizeMode="cover" style={styles.drillImg} imageStyle={styles.drillImgInner}>
                        <LinearGradient colors={['rgba(10,10,10,0)', 'rgba(10,10,10,0.9)']} locations={[0.3, 1]} style={StyleSheet.absoluteFillObject as any} />
                        {busy ? (
                          <View style={styles.drillBusy}>
                            <ActivityIndicator color={COLORS.textPrimary} />
                          </View>
                        ) : null}
                        <View style={styles.drillText}>
                          <Text style={styles.drillName} numberOfLines={1}>{titleParts(preset.name).secondary}</Text>
                          <Text style={styles.drillSub} numberOfLines={1}>{preset.target === 'full' ? 'Full body' : preset.target === 'upper' ? 'Upper body' : 'Leg day'}</Text>
                        </View>
                      </ImageBackground>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 28 },
  pad: { paddingHorizontal: 16 },
  secTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  secSub: { fontSize: 12, lineHeight: 16, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  error: { fontSize: 12, color: '#FF6B6B', marginTop: 8 },

  heroCard: { height: CARD_HEIGHT, borderRadius: 18, overflow: 'hidden' },
  heroImg: { flex: 1, justifyContent: 'space-between', backgroundColor: COLORS.surface },
  heroImgInner: { width: '100%', height: '100%' },
  heroIconWrap: {
    alignSelf: 'flex-start', margin: 12, width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,10,10,0.55)',
  },
  heroText: { paddingHorizontal: 14, paddingBottom: 14 },
  heroName: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginTop: 2 },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  // Matches heroName (same bold 18px/800 treatment) so the drill-down reads as the hero card's own label,
  // not a separate nav header (Wes, Oct 2026 feedback #13).
  backText: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  drillRow: { flexDirection: 'row', gap: DRILL_GAP },
  // Same 16:9 format as the hero card, just smaller/3-across -- see DRILL_TILE_WIDTH/HEIGHT above.
  drillCard: { width: DRILL_TILE_WIDTH, height: DRILL_TILE_HEIGHT, borderRadius: 14, overflow: 'hidden' },
  drillImg: { flex: 1, justifyContent: 'flex-end', backgroundColor: COLORS.surface },
  drillImgInner: { width: '100%', height: '100%' },
  drillBusy: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  drillText: { padding: 10 },
  drillName: { fontSize: 12, fontWeight: '800', color: COLORS.textPrimary },
  // Mirrors heroSub's caption-under-title layout.
  drillSub: { fontSize: 10.5, color: 'rgba(255,255,255,0.72)', marginTop: 1 },
});
