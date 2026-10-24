/**
 * Home entry point for the 18 MOOD V3 Specialty Workout Presets (founder build, Oct 2026).
 *
 * Per the locked product rule (MOOD_V3_Specialty_Generator scope doc): presets are NOT a 4th Direction and do not
 * touch the Build flow's 3-card Direction step (Strength/Sweat/Athletic stays exactly as it is). This is new,
 * additive content on Home.
 *
 * Shape (Wes, Oct 2026 feedback #14 -- a full simplification after the peek/overlap carousel read as
 * "glitchy"): ONE card, one equipment at a time, the same width as the Home content column (the same width
 * the mood-pick recommendation cards' row spans above -- GUTTER-based, no separate measurement). No
 * neighboring cards visible at all. It cross-fades to a random other equipment on a timer, and can be swiped
 * left/right to step through manually (a swipe restarts the auto-shuffle window rather than being immediately
 * overridden). Starts on a random equipment every time Home mounts -- there is intentionally no fixed/first
 * card.
 *
 * Tapping the card does a literal 3D flip (rotateY + backfaceVisibility, not a slide-in section) to its back
 * face: the same equipment's 3 body-part presets (Full/Upper/Lower), each a real exercise thumbnail
 * (SPECIALTY_DRILLDOWN_THUMB -- a fixed representative exercise per preset, not a live preview; see that
 * constant's own comment for why) -- within the EXACT same card bounds as the front face, so this reads as
 * the hero card turning over, not a jump into a separate section. Tapping one of those calls the independent
 * specialty generator (POST /api/v3/specialty/generate) and opens the existing Cart screen (/v3/workout) with
 * a `kind=specialty` param, same as before. A back chevron on the back face flips it back to the hero.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Dimensions, Easing, ImageBackground, PanResponder, Pressable, StyleSheet, Text, View,
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
const GUTTER = 16; // same content gutter V3Home.tsx uses for its own `pad` -- this card spans the recs row's own width
const CARD_WIDTH = SCREEN_WIDTH - GUTTER * 2;
const CARD_HEIGHT = Math.round((CARD_WIDTH * 9) / 16); // 16:9, on purpose (Wes, Oct 2026)
const AUTO_SHUFFLE_MS = 4500;
const SWIPE_THRESHOLD = 40;
const DRILL_GAP = 10;
// Back-face tiles fill the exact same CARD_WIDTH x CARD_HEIGHT box as the front -- 3-across, full card height.
const DRILL_TILE_WIDTH = Math.round((CARD_WIDTH - DRILL_GAP * 2) / 3);
const PRESET_BY_ID = new Map(SPECIALTY_PRESETS.map((p) => [p.id, p]));
const N = SPECIALTY_EQUIPMENT_GROUPS.length;

export function SpecialtyPresetsRow() {
  const { token } = useAuth();
  const router = useRouter();
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [index, setIndex] = useState(() => Math.floor(Math.random() * N)); // no fixed starting equipment
  const [flipped, setFlipped] = useState(false);
  const indexRef = useRef(index);
  indexRef.current = index;
  const flippedRef = useRef(flipped);
  flippedRef.current = flipped;

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

  /* ------------------------------------------------------------------ single card, cross-fade between equipment */
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const changeIndex = useCallback((next: number) => {
    const wrapped = ((next % N) + N) % N;
    if (wrapped === indexRef.current) return;
    Animated.timing(fadeAnim, { toValue: 0, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => {
      setIndex(wrapped);
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true }).start();
    });
  }, [fadeAnim]);

  const startAutoShuffle = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (N < 2) return;
      let next = Math.floor(Math.random() * N);
      if (next === indexRef.current) next = (next + 1) % N;
      changeIndex(next);
    }, AUTO_SHUFFLE_MS);
  }, [changeIndex]);

  useEffect(() => {
    if (flipped) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    startAutoShuffle();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [flipped, startAutoShuffle]);

  /* ------------------------------------------------------------------ swipe left/right to step manually */
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        !flippedRef.current && Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderRelease: (_evt, gesture) => {
        if (Math.abs(gesture.dx) < SWIPE_THRESHOLD) return;
        changeIndex(indexRef.current + (gesture.dx < 0 ? 1 : -1));
        startAutoShuffle(); // a manual swipe just happened -- restart the auto-shuffle window instead of firing immediately
      },
    }),
  ).current;

  /* ------------------------------------------------------------------ flip to body-part presets, same bounds */
  const flipAnim = useRef(new Animated.Value(0)).current;
  const openFlip = () => {
    setFlipped(true);
    Animated.timing(flipAnim, { toValue: 1, duration: 340, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start();
  };
  const closeFlip = () => {
    Animated.timing(flipAnim, { toValue: 0, duration: 300, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }).start(({ finished }) => {
      if (finished) setFlipped(false);
    });
  };
  const frontRotateY = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotateY = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  const group = SPECIALTY_EQUIPMENT_GROUPS[index];

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

      <View style={styles.pad}>
        <View style={{ width: CARD_WIDTH, height: CARD_HEIGHT, marginTop: 10 }} {...panResponder.panHandlers}>
          {/* Front face: the single equipment hero, cross-fading between equipments */}
          <Animated.View
            pointerEvents={flipped ? 'none' : 'auto'}
            style={[
              StyleSheet.absoluteFill,
              { opacity: fadeAnim, backfaceVisibility: 'hidden', transform: [{ perspective: 1200 }, { rotateY: frontRotateY }] },
            ]}
          >
            <Pressable
              onPress={openFlip}
              style={({ pressed }) => [styles.heroCard, pressed && { transform: [{ scale: 0.98 }] }]}
              accessibilityRole="button"
              accessibilityLabel={group.label}
              testID={`v3-specialty-equipment-${group.equipment}`}
            >
              <ImageBackground
                source={{ uri: optimizedImageUrl(group.heroUri, Math.round(CARD_WIDTH * 3)) }}
                resizeMode="cover"
                style={styles.heroImg}
                imageStyle={styles.heroImgInner}
              >
                <LinearGradient colors={['rgba(10,10,10,0)', 'rgba(10,10,10,0.9)']} locations={[0.3, 1]} style={StyleSheet.absoluteFillObject as any} />
                <View style={styles.heroIconWrap}>
                  <Ionicons name={SPECIALTY_EQUIPMENT_ICON[group.equipment] as any} size={16} color={COLORS.textPrimary} />
                </View>
                <View style={styles.heroText}>
                  <Text style={styles.heroName}>{group.label}</Text>
                  <Text style={styles.heroSub}>3 ways to train -- full, upper &amp; leg day</Text>
                </View>
              </ImageBackground>
            </Pressable>
          </Animated.View>

          {/* Back face: this equipment's 3 body-part presets, same card bounds */}
          <Animated.View
            pointerEvents={flipped ? 'auto' : 'none'}
            style={[
              StyleSheet.absoluteFill,
              { backfaceVisibility: 'hidden', transform: [{ perspective: 1200 }, { rotateY: backRotateY }] },
            ]}
          >
            <View style={styles.drillRow}>
              {group.presets.map((presetId) => {
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
            <Pressable onPress={closeFlip} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back to equipment" testID="v3-specialty-flip-back">
              <Ionicons name="chevron-back" size={16} color={COLORS.textPrimary} />
            </Pressable>
          </Animated.View>
        </View>

        {/* Small, subtle pills so users can jump straight to any equipment (Wes, Oct 2026 feedback #15). */}
        <View style={styles.dots} pointerEvents={flipped ? 'none' : 'auto'}>
          {SPECIALTY_EQUIPMENT_GROUPS.map((g, i) => (
            <Pressable
              key={g.equipment}
              onPress={() => { changeIndex(i); startAutoShuffle(); }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={g.label}
              testID={`v3-specialty-dot-${g.equipment}`}
            >
              <View style={[styles.dot, i === index && styles.dotActive]} />
            </Pressable>
          ))}
        </View>
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

  heroCard: { flex: 1, borderRadius: 18, overflow: 'hidden' },
  heroImg: { flex: 1, justifyContent: 'space-between', backgroundColor: COLORS.surface },
  heroImgInner: { width: '100%', height: '100%' },
  heroIconWrap: {
    alignSelf: 'flex-start', margin: 12, width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,10,10,0.55)',
  },
  heroText: { paddingHorizontal: 14, paddingBottom: 14 },
  heroName: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginTop: 2 },

  // Small overlay button on the back face only -- no separate header row, so the back face keeps the exact
  // same CARD_WIDTH x CARD_HEIGHT bounds as the front (Wes, Oct 2026 feedback #14).
  backBtn: {
    position: 'absolute', top: 10, left: 10, width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,10,10,0.55)',
  },
  drillRow: { flex: 1, flexDirection: 'row', gap: DRILL_GAP },
  drillCard: { width: DRILL_TILE_WIDTH, borderRadius: 14, overflow: 'hidden' },
  drillImg: { flex: 1, justifyContent: 'flex-end', backgroundColor: COLORS.surface },
  drillImgInner: { width: '100%', height: '100%' },
  drillBusy: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  drillText: { padding: 10 },
  drillName: { fontSize: 12, fontWeight: '800', color: COLORS.textPrimary },
  drillSub: { fontSize: 10.5, color: 'rgba(255,255,255,0.72)', marginTop: 1 },

  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 10 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { width: 16, backgroundColor: 'rgba(255,255,255,0.75)' },
});
