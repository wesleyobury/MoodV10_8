/**
 * Home entry point for the 18 MOOD V3 Specialty Workout Presets (founder build, Oct 2026).
 *
 * Per the locked product rule (MOOD_V3_Specialty_Generator scope doc): presets are NOT a 4th Direction and do not
 * touch the Build flow's 3-card Direction step (Strength/Sweat/Athletic stays exactly as it is). This is new,
 * additive content on Home: a horizontally-scrollable row of 18 preset cards, visually based on the Direction
 * cards' look (app/v3/build.tsx's dirCard/dirImg/dirText styles) -- originally an icon-and-text card (no shoot
 * existed to cover all 18 equipment x target combinations), now a real photo card per Wes's Oct 2026 feedback
 * #10, matching the Direction step's own ImageBackground + bottom gradient + text treatment now that one does.
 * Home's one other existing card set ("MOOD's suggestions") is a live-preview-per-card system purpose-built for
 * exactly 3 Directions (it generates a real workout per card on every Home render); doing that for 18 presets
 * would mean 18 generator calls on every Home load, a different performance profile this feature doesn't need.
 * These cards are static (no live preview) and generate on demand, only when tapped.
 *
 * Tapping a card calls the independent specialty generator (POST /api/v3/specialty/generate) and opens the
 * existing Cart screen (/v3/workout) with a `kind=specialty` param so the Cart knows to fetch/swap through the
 * specialty endpoints instead of the Direction ones (see app/v3/workout.tsx for the corresponding branch).
 */
import React, { useState } from 'react';
import { ActivityIndicator, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../SafeLinearGradient';
import { COLORS } from '../../constants/brand';
import { useAuth } from '../../contexts/AuthContext';
import { trackEvent } from '../../utils/analytics';
import { V3_SPECIALTY_HEROES } from '../../utils/cartHero';
import { generateSpecialtyWorkout } from '../../utils/v3Api';
import { SPECIALTY_EQUIPMENT_ICON, SPECIALTY_EQUIPMENT_LABEL, SPECIALTY_PRESETS, titleParts } from '../../utils/v3Specialty';

const TARGET_LABEL: Record<string, string> = { full: 'Full Body', upper: 'Upper Body', lower: 'Lower Body' };

export function SpecialtyPresetsRow() {
  const { token } = useAuth();
  const router = useRouter();
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const onPressPreset = async (presetId: string) => {
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
  };

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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {SPECIALTY_PRESETS.map((p) => {
          const busy = generatingId === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => onPressPreset(p.id)}
              disabled={!!generatingId}
              style={({ pressed }) => [styles.card, pressed && !generatingId && { transform: [{ scale: 0.98 }] }, generatingId && !busy && { opacity: 0.5 }]}
              accessibilityRole="button"
              accessibilityLabel={p.name}
              testID={`v3-specialty-preset-${p.id}`}
            >
              <ImageBackground source={{ uri: V3_SPECIALTY_HEROES[p.id] }} resizeMode="cover" style={styles.cardImg} imageStyle={styles.cardImgInner}>
                <LinearGradient colors={['rgba(10,10,10,0)', 'rgba(10,10,10,0.92)']} locations={[0.35, 1]} style={StyleSheet.absoluteFillObject as any} />
                <View style={styles.iconWrap}>
                  {busy ? <ActivityIndicator size="small" color={COLORS.textPrimary} /> : <Ionicons name={SPECIALTY_EQUIPMENT_ICON[p.equipment] as any} size={15} color={COLORS.textPrimary} />}
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardName} numberOfLines={2}>
                    {titleParts(p.name).secondary ? (
                      <>
                        {titleParts(p.name).primary}{' '}
                        <Text style={styles.cardNameSecondary}>{titleParts(p.name).secondary}</Text>
                      </>
                    ) : (
                      p.name
                    )}
                  </Text>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {SPECIALTY_EQUIPMENT_LABEL[p.equipment]} · {TARGET_LABEL[p.target]}
                  </Text>
                </View>
              </ImageBackground>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 28 },
  pad: { paddingHorizontal: 16 },
  secTitle: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  secSub: { fontSize: 12, lineHeight: 16, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  error: { fontSize: 12, color: '#FF6B6B', marginTop: 8 },
  row: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  card: {
    width: 128,
    height: 172,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  cardImg: { flex: 1, justifyContent: 'space-between', backgroundColor: COLORS.surface },
  cardImgInner: { width: '100%', height: '100%' },
  iconWrap: {
    alignSelf: 'flex-start', margin: 10, width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,10,10,0.55)',
  },
  cardText: { paddingHorizontal: 11, paddingBottom: 11 },
  cardName: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary },
  cardNameSecondary: { fontWeight: '500', opacity: 0.75 },
  cardSub: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
});
