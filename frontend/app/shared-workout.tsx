import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WorkoutCard from '../components/WorkoutCard';
import { Workout } from '../types/workout';

/**
 * Renders a single shared workout in its original "workout cart" form.
 * Reached via deep navigation from a chat WorkoutShareMessageCard.
 *
 * Recipient sees the same WorkoutCard the sender saw — they can preview,
 * add it to their own cart, edit it, swipe through (only one item here),
 * etc., flowing into the standard battle-plan / share screens from there.
 */
export default function SharedWorkoutScreen() {
  const insets = useSafeAreaInsets();
  const { payload } = useLocalSearchParams<{ payload?: string }>();

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
