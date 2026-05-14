import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WorkoutCard from '../components/WorkoutCard';
import { Workout } from '../types/workout';
import { useCart } from '../contexts/CartContext';

/**
 * Renders a shared workout reached via deep navigation from a chat
 * WorkoutShareMessageCard.
 *
 * Two payload shapes are supported:
 *   A) `data.workout = Workout` — legacy single-workout share. Renders
 *      it via `WorkoutCard` as before.
 *   B) `data.workout.workouts = Workout[]` — full cart share (new format
 *      shipped 2026-05-14). Hydrates the recipient's cart with the
 *      sender's exact exercises (mirroring the Explore "Try this
 *      workout" replicate flow) and routes straight to `/cart`. This
 *      avoids dumping the recipient on the mood sub-selection screen
 *      and matches the original sender's complete build.
 */
export default function SharedWorkoutScreen() {
  const insets = useSafeAreaInsets();
  const { payload } = useLocalSearchParams<{ payload?: string }>();
  const { clearCart, addToCart } = useCart();
  // Latched so the cart hydration only fires once per mount (React Strict
  // Mode double-mount safety).
  const hydratedRef = useRef(false);

  const data = useMemo(() => {
    try {
      if (!payload) return null;
      const decoded = decodeURIComponent(String(payload));
      return JSON.parse(decoded);
    } catch (e) {
      console.warn('Failed to decode shared workout payload:', e);
      return null;
    }
  }, [payload]);

  // Shape B — full cart payload. Hydrate + redirect.
  useEffect(() => {
    if (hydratedRef.current) return;
    const items: Workout[] | undefined = data?.workout?.workouts;
    if (!Array.isArray(items) || items.length === 0) return;
    hydratedRef.current = true;
    clearCart();
    // Cart context's `WorkoutItem` is structurally compatible with the
    // `Workout` payload coming over the wire (created by the sender from
    // their own cart). We cast through `unknown` because the two type
    // names live in different modules with the same shape but different
    // optional-field signatures.
    items.forEach((w) => addToCart(w as unknown as Parameters<typeof addToCart>[0]));
    router.replace('/cart');
  }, [data, clearCart, addToCart]);

  if (!data || !data.workout) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={26} color="#FFD700" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shared Workout</Text>
          <View style={{ width: 26 }} />
        </View>
        <View style={styles.emptyWrap}>
          <Ionicons name="alert-circle-outline" size={36} color="#444" />
          <Text style={styles.emptyText}>This shared workout could not be loaded.</Text>
        </View>
      </View>
    );
  }

  const workout: Workout = data.workout;
  const equipment: string = data.equipment || 'Workout';
  const difficulty: string = data.difficulty || 'intermediate';
  const moodCategory: string = data.mood_category || '';
  const subtext: string = data.subtext || '';

  // No-op handlers — sharing a single workout doesn't auto-add it to the
  // recipient's local cart store; users tap "Add Workout" themselves.
  const noopIsInCart = () => false;
  const stableId = (w: Workout, eq: string, diff: string) => `shared-${eq}-${diff}-${w.name}`;
  const handleAddToCart = (_w: Workout) => {
    // Could be wired to the recipient's cart context if/when shared.
    // For now keep no-op: the WorkoutCard will visually animate without persistence.
  };
  const onStartWorkout = (_w: Workout) => {
    // Hook this into the existing start-workout flow if available
    // by navigating to the appropriate display screen for the equipment/difficulty.
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} testID="shared-workout-back">
          <Ionicons name="chevron-back" size={26} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {moodCategory || workout.name || 'Shared Workout'}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      {!!subtext && (
        <Text style={styles.subtext}>{subtext}</Text>
      )}

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 32, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <WorkoutCard
          equipment={equipment}
          icon="fitness"
          workouts={[workout]}
          difficulty={difficulty}
          isInCart={noopIsInCart}
          createWorkoutId={stableId}
          handleAddToCart={handleAddToCart}
          onStartWorkout={onStartWorkout}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  subtext: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: -4,
    marginBottom: 4,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyText: { color: '#555', fontSize: 13, marginTop: 12, textAlign: 'center' },
});
