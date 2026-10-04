/**
 * MoodWorkoutCard: one "Workouts for your mood" recommendation on Home (founder Home redesign, Oct 2026).
 *
 *   IMAGE (the V3 Cart hero for the workout: archetype -> target -> Direction, utils/cartHero)
 *   [MOOD'S PICK] badge on the pick
 *   Workout name
 *   Direction · ~min
 *   [Start] pops up on the card once it is selected (selection first, explicit Start second)
 *
 * States: loading (skeleton), ok, refreshing (previous workout dimmed while today's States rebuild it), conflict (the
 * generator could not fit this Direction today: not selectable) and error (tap to retry). Presentational only.
 */
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import type { V3Direction, V3State, V3Workout } from '../../utils/v3Api';
import { DIRECTION_NAME, STATE_LABEL } from '../../utils/v3HomeModel';
import { STATE_THEME } from './StateCard';
import { previewTitle } from '../../utils/v3PreviewFormat';
import { resolveV3CartHero, type V3HeroSource } from '../../utils/cartHero';
import { heroImageSource } from './v3Images';

export type RecStatus = 'loading' | 'ok' | 'conflict' | 'error';

interface Props {
  direction: V3Direction;
  pick: boolean;
  status: RecStatus;
  workout: V3Workout | null;
  /** hero picked by Home for all three cards together (three different athletes); falls back to the card's own pick */
  heroSource?: V3HeroSource | null;
  /** an older workout is on screen while the new States rebuild it */
  refreshing?: boolean;
  conflictMessage?: string | null;
  selected: boolean;
  starting?: boolean;
  width: number;
  height: number;
  onPress: () => void;
  onStart: () => void;
  onRetry: () => void;
  testID?: string;
  /** the mood(s) the workout is built for, labelled on the cover (founder pass, Oct 2026) */
  moods?: V3State[];
}

/** "AMPED", "AMPED + BORED", "3 MOODS": the cover label, with each mood's icon in its own colour. */
function MoodLabel({ moods }: { moods: V3State[] }) {
  if (!moods.length) return null;
  const both = moods.map((m) => STATE_LABEL[m]).join(' + ');
  // one or two short moods by name ("AMPED + BORED"); longer combinations say how many, the icons show which
  const named = moods.length === 1 || both.length <= 14;
  const text = named ? both : `${moods.length} moods`;
  // icons when they fit: the one mood's, or every mood's beside "3 MOODS"; two named moods are text only (card width)
  const icons = moods.length === 1 || !named ? moods : [];
  return (
    <View style={styles.mood} testID="v3-rec-mood">
      {icons.map((m) => <MaterialCommunityIcons key={m} name={STATE_THEME[m].icon} size={11} color={STATE_THEME[m].accent} />)}
      <Text style={styles.moodText}>{text.toUpperCase()}</Text>
    </View>
  );
}

// Every session name must sit on ONE line on a Home card (a third of a 375 pt screen: ~91 pt for the title at 15 pt bold).
// Names measured over that width get their short form here; the Cart and session keep the full name. Borderline names
// ("Upper Body", "Upper Push", "Lower Body") fit as they are, and the title scales down at most 10% rather than wrap.
const CARD_SHORT: Record<string, string> = {
  'Full-Body Athlete': 'Full Body',
  'Speed + Plyo': 'Speed',
  'Glutes + Legs': 'Legs',
  'Lower Body: Hinge': 'Hinge',
  'Lower Body: Squat': 'Squat',
  'Custom Target': 'Custom',
};

export function MoodWorkoutCard(p: Props) {
  const { direction, pick, status, workout, refreshing, selected, starting, width, height } = p;
  const pop = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // JS-driven: the Start row animates its height (not supported by the native driver). Three cards, cheap.
    Animated.spring(pop, { toValue: selected ? 1 : 0, useNativeDriver: false, speed: 18, bounciness: 4 }).start();
  }, [selected, pop]);

  const skeleton = status === 'loading' && !workout;
  useEffect(() => {
    if (!skeleton) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [skeleton, pulse]);

  const heroSrc = p.heroSource ?? (workout ? resolveV3CartHero(workout).source : resolveV3CartHero({ direction, archetype: { id: '' } }).source);
  // Home cards are a third of the screen wide: names that cannot sit on one line at the card's size get their short form
  // ("Full-Body Athlete" wrapped to two lines; founder pass, Oct 2026). The Cart and session keep the full name.
  const full = workout ? previewTitle(workout) : DIRECTION_NAME[direction];
  const title = CARD_SHORT[full] ?? full;
  const meta = workout ? `${workout.direction_name} · ${Math.round(workout.duration.estimated_minutes)} min` : DIRECTION_NAME[direction];
  const selectable = status === 'ok' && !!workout;
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

  const onPress = () => {
    if (status === 'error') return p.onRetry();
    if (selectable) p.onPress();
  };

  return (
    <Animated.View
      style={[
        { width, height, transform: [{ scale }] },
        styles.shadow,
        selected && styles.shadowOn,
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={!selectable && status !== 'error'}
        accessibilityRole="button"
        accessibilityState={{ selected, disabled: !selectable && status !== 'error', busy: status === 'loading' || !!refreshing }}
        accessibilityLabel={selectable ? `${pick ? 'MOOD’s Pick: ' : ''}${title}, ${meta}` : status === 'error' ? `${DIRECTION_NAME[direction]} could not load. Tap to retry.` : DIRECTION_NAME[direction]}
        testID={p.testID}
        style={({ pressed }) => [styles.card, selected ? styles.cardOn : styles.cardOff, pressed && selectable && { opacity: 0.92 }]}
      >
        {skeleton ? (
          <Animated.View style={[StyleSheet.absoluteFill, styles.skeleton, { opacity: pulse }]} />
        ) : (
          <Image source={heroImageSource(heroSrc, width)} resizeMode="cover" style={[StyleSheet.absoluteFill, (status === 'conflict' || refreshing) && { opacity: 0.4 }]} />
        )}
        <LinearGradient
          colors={['rgba(8,8,8,0)', 'rgba(8,8,8,0.55)', 'rgba(8,8,8,0.96)']}
          locations={[0, 0.45, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.scrim as any}
        />

        {pick ? (
          <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.badge}>
            <Text style={styles.badgeText}>MOOD’S PICK</Text>
          </LinearGradient>
        ) : null}
        {refreshing || (status === 'loading' && workout) ? (
          <View style={styles.spinner}>
            <ActivityIndicator size="small" color={COLORS.textPrimary} />
          </View>
        ) : null}

        <View style={styles.body}>
          {skeleton ? (
            <>
              <View style={[styles.bar, { width: '72%' }]} />
              <Text style={styles.meta}>{DIRECTION_NAME[direction]}</Text>
            </>
          ) : status === 'conflict' ? (
            <>
              <Text style={styles.title} numberOfLines={2}>Not a fit today</Text>
              <Text style={styles.meta} numberOfLines={3}>{p.conflictMessage || `${DIRECTION_NAME[direction]} doesn’t fit how you feel today.`}</Text>
            </>
          ) : status === 'error' ? (
            <>
              <Text style={styles.title} numberOfLines={2}>{DIRECTION_NAME[direction]}</Text>
              <View style={styles.retryRow}>
                <Ionicons name="refresh" size={12} color={COLORS.textSecondary} />
                <Text style={styles.meta}>Tap to retry</Text>
              </View>
            </>
          ) : (
            <>
              <MoodLabel moods={p.moods ?? []} />
              <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9} testID={p.testID ? `${p.testID}-title` : undefined}>{title}</Text>
              <Text style={styles.meta} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{meta}</Text>
            </>
          )}

          {/* Start pops up on the selected card. Collapsed (height 0) otherwise, so the card text sits at the bottom. */}
          <Animated.View
            pointerEvents={selected ? 'auto' : 'none'}
            style={{
              height: pop.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }) as any,
              opacity: pop,
              overflow: 'hidden',
            }}
          >
            <Pressable
              onPress={p.onStart}
              disabled={!selected || !!starting}
              accessibilityRole="button"
              accessibilityLabel={`Start ${title}`}
              testID={p.testID ? `${p.testID}-start` : undefined}
              style={({ pressed }) => [styles.startWrap, pressed && { opacity: 0.85 }]}
            >
              <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.start}>
                {starting ? (
                  <ActivityIndicator size="small" color={COLORS.accentInk} />
                ) : (
                  <>
                    <Ionicons name="play" size={12} color={COLORS.accentInk} />
                    <Text style={styles.startText}>Start</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadow: { borderRadius: 18, shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0 },
  shadowOn: { shadowOpacity: 0.45, shadowRadius: 12, elevation: 8 },
  card: { flex: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: COLORS.surface },
  cardOff: { borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.14)' },
  cardOn: { borderWidth: 1.5, borderColor: COLORS.accent },
  skeleton: { backgroundColor: COLORS.surfaceElevated },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '68%' },
  badge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 7, height: 18, borderRadius: 9, justifyContent: 'center' },
  badgeText: { fontSize: 8.5, fontWeight: '900', letterSpacing: 0.8, color: COLORS.accentInk },
  spinner: { position: 'absolute', top: 8, right: 8 },
  body: { position: 'absolute', left: 9, right: 9, bottom: 9 },
  mood: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', maxWidth: '100%', marginBottom: 5, paddingHorizontal: 6, height: 18, borderRadius: 9, backgroundColor: 'rgba(12,12,12,0.6)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.22)' },
  moodText: { flexShrink: 0, marginLeft: 1, fontSize: 8.5, fontWeight: '800', letterSpacing: 0.7, color: COLORS.textPrimary },
  title: { fontSize: 15, lineHeight: 18, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.3 },
  meta: { fontSize: 11, lineHeight: 14, fontWeight: '600', color: 'rgba(255,255,255,0.72)', marginTop: 3 },
  bar: { height: 12, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.14)' },
  retryRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  startWrap: { marginTop: 8 },
  start: { height: 32, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  startText: { fontSize: 13, fontWeight: '800', color: COLORS.accentInk, letterSpacing: 0.2 },
});
