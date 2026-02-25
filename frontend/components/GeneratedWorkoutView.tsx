import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WorkoutItem } from '../contexts/CartContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Dynamic workout title pools by intensity category
const WORKOUT_TITLES = {
  // Foundation (Beginner)
  foundation: [
    'Controlled Burn', 'Steady Pressure', 'Base Builder', 'Engine Warmup', 'Clean Effort',
    'Foundational Fire', 'Pulse Builder', 'Momentum', 'Rhythm & Repeat', 'Break a Sweat',
    'Light the Fuse', 'Aerobic Armor', 'Starter Surge', 'Move With Purpose', 'Core Temperature',
    'Built to Begin', 'Fresh Legs', 'Cardio Craft', 'Daily Driver', 'Solid State'
  ],
  // Performance (Intermediate)
  performance: [
    'Afterburn', 'Blacktop Conditioning', 'Velocity Circuit', 'Grind Mode', 'Oxygen Debt',
    'Relentless Tempo', 'Redline Ready', 'Shock the System', 'Burn Protocol', 'High Output',
    'Power Pulse', 'Engine Room', 'Dark Cardio', 'Heat Index', 'Gas Tank Builder',
    'Iron Tempo', 'Accelerate', 'The Climb', 'Threshold Work', 'Push Past'
  ],
  // Intensity (Advanced)
  intensity: [
    'Blackout Intervals', 'Engine Collapse', 'Zero Comfort', 'Blood & Breath', 'Conditioned to Break',
    'Redline Ritual', 'No Oxygen Left', 'Brutal Efficiency', 'System Override', 'Total Output',
    'Failure to Quit', 'Relentless Intervals', 'Dead Air', 'Heart Rate Hostile', 'Aftershock',
    'Chaos Conditioning', 'Burn the Clock', 'Max Effort Only', 'The Last Round', 'Full Send'
  ],
  // Athletic / Fight Conditioning
  athletic: [
    'Fight Shape', '12th Round', 'Roadwork Ritual', 'Championship Rounds', 'Overtime Engine',
    'Cut Weight Circuit', 'Ringside Ready', 'Combat Conditioning', 'Final Bell', 'Warrior Wind'
  ],
  // Hybrid Power (Cardio + Strength)
  hybrid: [
    'Iron & Intervals', 'Load & Go', 'Heavy Breath', 'Carry the Chaos', 'Strength Under Fire',
    'Weighted Velocity', 'Power Endurance', 'Force x Speed', 'Barbell Burn', 'Grind & Go'
  ],
  // Dark / Cinematic
  dark: [
    'Midnight Conditioning', 'Smoke & Sweat', 'Shadow Sprints', 'Neon Burn', 'Darkroom Intervals',
    'Ashes & Air', 'Night Shift', 'Silent Grind', 'The Long Night', 'Iron Pulse'
  ],
  // Minimal / Elite
  elite: [
    'Surge', 'Override', 'Threshold', 'Impact', 'Ignite',
    'Unbroken', 'Endure', 'Elevate', 'Relentless', 'Ascend'
  ]
};

// Get a random workout title based on intensity level
function getRandomWorkoutTitle(intensity: string, moodTitle: string): string {
  // Determine which pools to use based on intensity
  let availablePools: string[][] = [];
  
  const intensityLower = intensity.toLowerCase();
  const moodLower = moodTitle.toLowerCase();
  
  // Map intensity to title pools
  if (intensityLower === 'beginner') {
    availablePools = [WORKOUT_TITLES.foundation];
  } else if (intensityLower === 'intermediate') {
    availablePools = [WORKOUT_TITLES.performance, WORKOUT_TITLES.hybrid];
  } else if (intensityLower === 'advanced') {
    availablePools = [WORKOUT_TITLES.intensity, WORKOUT_TITLES.dark, WORKOUT_TITLES.elite];
  } else {
    // Default to performance pool
    availablePools = [WORKOUT_TITLES.performance];
  }
  
  // Add mood-specific pools
  if (moodLower.includes('muscle') || moodLower.includes('gain') || moodLower.includes('strength')) {
    availablePools.push(WORKOUT_TITLES.hybrid);
  }
  if (moodLower.includes('explosion') || moodLower.includes('explosive') || moodLower.includes('power')) {
    availablePools.push(WORKOUT_TITLES.athletic);
  }
  if (moodLower.includes('sweat') || moodLower.includes('burn') || moodLower.includes('cardio')) {
    if (intensityLower === 'advanced') {
      availablePools.push(WORKOUT_TITLES.elite);
    }
  }
  
  // Flatten all available pools
  const allTitles = availablePools.flat();
  
  // Return a random title
  return allTitles[Math.floor(Math.random() * allTitles.length)];
}

export interface GeneratedCart {
  id: string;
  workouts: WorkoutItem[];
  totalDuration: number;
  intensity: string;
}

interface GeneratedWorkoutViewProps {
  carts: GeneratedCart[];
  moodTitle: string;
  workoutType: string;
  onStartWorkout: (cart: GeneratedCart) => void;
  onClose: () => void;
  onSkip?: () => Promise<boolean>; // Returns true if skip was successful (had generations left)
  onSave?: (cart: GeneratedCart) => Promise<void>;
  remainingGenerations?: number;
}

// Exercise card component matching normal cart styling
const ExerciseCard = ({
  item,
  index,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  item: WorkoutItem;
  index: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
}) => {
  const placeholderImage = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop';
  const imageSource = item.imageUrl && item.imageUrl.length > 0 ? item.imageUrl : placeholderImage;

  return (
    <View style={styles.exerciseCard}>
      <Image
        source={{ uri: imageSource }}
        style={styles.exerciseImage}
        resizeMode="cover"
      />
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseEquipment}>{item.equipment}</Text>
        <Text style={styles.exerciseName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.exerciseDuration}>{item.duration}</Text>
      </View>
      <View style={styles.exerciseActions}>
        <View style={styles.reorderButtons}>
          <TouchableOpacity
            style={[styles.reorderButton, isFirst && styles.reorderButtonDisabled]}
            onPress={() => !isFirst && onMoveUp(index)}
            disabled={isFirst}
            activeOpacity={0.8}
          >
            <Ionicons
              name="chevron-up"
              size={18}
              color={isFirst ? 'rgba(255, 255, 255, 0.3)' : '#fff'}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reorderButton, isLast && styles.reorderButtonDisabled]}
            onPress={() => !isLast && onMoveDown(index)}
            disabled={isLast}
            activeOpacity={0.8}
          >
            <Ionicons
              name="chevron-down"
              size={18}
              color={isLast ? 'rgba(255, 255, 255, 0.3)' : '#fff'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function GeneratedWorkoutView({
  carts,
  moodTitle,
  workoutType,
  onStartWorkout,
  onClose,
  onSkip,
  onSave,
  remainingGenerations = 3,
}: GeneratedWorkoutViewProps) {
  const [currentCartIndex, setCurrentCartIndex] = useState(0);
  const [currentCart, setCurrentCart] = useState(carts[0]);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localRemainingGenerations, setLocalRemainingGenerations] = useState(remainingGenerations);
  const insets = useSafeAreaInsets();

  // Generate dynamic workout title based on intensity - memoized per cart
  const dynamicWorkoutTitle = useMemo(() => {
    return getRandomWorkoutTitle(currentCart?.intensity || 'intermediate', moodTitle);
  }, [currentCartIndex, moodTitle]); // Regenerate when cart changes

  const isLastCart = currentCartIndex === carts.length - 1;
  const cartsRemaining = carts.length - currentCartIndex - 1;

  const handleSkip = async () => {
    if (!isLastCart) {
      // Check if we have generations left
      if (localRemainingGenerations <= 0) {
        Alert.alert(
          'No Generations Left',
          'You have used all your daily generations. Each skip uses 1 generation.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Call onSkip callback to record the generation usage
      if (onSkip) {
        const success = await onSkip();
        if (!success) {
          Alert.alert(
            'No Generations Left',
            'You have used all your daily generations.',
            [{ text: 'OK' }]
          );
          return;
        }
        setLocalRemainingGenerations(prev => Math.max(0, prev - 1));
      }

      const newIndex = currentCartIndex + 1;
      setCurrentCartIndex(newIndex);
      setCurrentCart(carts[newIndex]);
      setIsSaved(false); // Reset saved state for new cart
    }
  };

  const handleSave = async () => {
    if (onSave && !isSaved) {
      setIsSaving(true);
      try {
        await onSave(currentCart);
        setIsSaved(true);
        Alert.alert(
          'Workout Saved!',
          'You can access this workout from your saved workouts.',
          [{ text: 'OK' }]
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to save workout. Please try again.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newWorkouts = [...currentCart.workouts];
      [newWorkouts[index - 1], newWorkouts[index]] = [newWorkouts[index], newWorkouts[index - 1]];
      setCurrentCart({ ...currentCart, workouts: newWorkouts });
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < currentCart.workouts.length - 1) {
      const newWorkouts = [...currentCart.workouts];
      [newWorkouts[index], newWorkouts[index + 1]] = [newWorkouts[index + 1], newWorkouts[index]];
      setCurrentCart({ ...currentCart, workouts: newWorkouts });
    }
  };

  const handleStart = () => {
    onStartWorkout(currentCart);
  };

  if (!currentCart) {
    return null;
  }

  // Get first workout image for hero
  const heroImage = currentCart.workouts[0]?.imageUrl || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Hero Section */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: heroImage }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroOverlay} />

        {/* Close Button */}
        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + 10 }]}
          onPress={onClose}
        >
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Cart Counter */}
        <View style={[styles.cartCounter, { top: insets.top + 10 }]}>
          <Text style={styles.cartCounterText}>
            Workout {currentCartIndex + 1} of {carts.length}
          </Text>
        </View>

        {/* Hero Content */}
        <View style={styles.heroContent}>
          <View style={styles.generatedBadge}>
            <Ionicons name="sparkles" size={12} color="#FFD700" />
            <Text style={styles.generatedBadgeText}>Generated for you</Text>
          </View>
          <Text style={styles.moodLabel}>{moodTitle}</Text>
          <Text style={styles.workoutTitle}>{dynamicWorkoutTitle}</Text>
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={14} color="#FFD700" />
            <Text style={styles.durationText}>~{currentCart.totalDuration} min</Text>
            <View style={styles.dotSeparator} />
            <Text style={styles.exerciseCount}>{currentCart.workouts.length} exercises</Text>
          </View>
        </View>
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionTitle}>Your Workout</Text>
            {!isLastCart && (
              <Text style={styles.skipHint}>
                {cartsRemaining} more • Skip uses 1 generation
              </Text>
            )}
          </View>
          {/* Save Button */}
          {onSave && (
            <TouchableOpacity
              style={[styles.saveButton, isSaved && styles.saveButtonSaved]}
              onPress={handleSave}
              disabled={isSaved || isSaving}
            >
              <Ionicons 
                name={isSaved ? "bookmark" : "bookmark-outline"} 
                size={18} 
                color={isSaved ? "#FFD700" : "#888"} 
              />
              <Text style={[styles.saveButtonText, isSaved && styles.saveButtonTextSaved]}>
                {isSaved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.exerciseList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          {currentCart.workouts.map((workout, index) => (
            <ExerciseCard
              key={workout.id}
              item={workout}
              index={index}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              isFirst={index === 0}
              isLast={index === currentCart.workouts.length - 1}
            />
          ))}
        </ScrollView>
      </View>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* Remaining generations indicator */}
        <View style={styles.generationsIndicator}>
          <Ionicons name="sparkles" size={12} color="#888" />
          <Text style={styles.generationsText}>
            {localRemainingGenerations} generation{localRemainingGenerations !== 1 ? 's' : ''} left today
          </Text>
        </View>
        <View style={styles.bottomActions}>
          {!isLastCart ? (
            <TouchableOpacity
              style={[
                styles.skipButton,
                localRemainingGenerations <= 0 && styles.skipButtonDisabled
              ]}
              onPress={handleSkip}
              disabled={localRemainingGenerations <= 0}
            >
              <Ionicons 
                name="shuffle" 
                size={18} 
                color={localRemainingGenerations <= 0 ? "#666" : "#FFD700"} 
              />
              <Text style={[
                styles.skipButtonText,
                localRemainingGenerations <= 0 && styles.skipButtonTextDisabled
              ]}>
                Skip
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.lastCartIndicator}>
              <Ionicons name="checkmark-circle" size={16} color="#888" />
              <Text style={styles.lastCartText}>Last option</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStart}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.startButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.startButtonText}>Start Workout</Text>
              <Ionicons name="arrow-forward" size={20} color="#0c0c0c" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  heroContainer: {
    height: 260,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  closeButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  cartCounter: {
    position: 'absolute',
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 10,
  },
  cartCounterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  generatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 8,
  },
  generatedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFD700',
  },
  moodLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    marginBottom: 2,
  },
  workoutTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  exerciseCount: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionHeaderLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  skipHint: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
    marginTop: 2,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  saveButtonSaved: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  saveButtonTextSaved: {
    color: '#FFD700',
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  // Exercise Card styles - matching cart.tsx exactly
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginTop: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseImage: {
    width: 80,
    height: 80,
  },
  exerciseInfo: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  exerciseEquipment: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  exerciseDuration: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  reorderButtons: {
    flexDirection: 'column',
    gap: 2,
  },
  reorderButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  // Bottom Bar styles
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  generationsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  generationsText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    gap: 6,
  },
  skipButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  skipButtonTextDisabled: {
    color: '#666',
  },
  lastCartIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  lastCartText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  startButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c0c0c',
  },
});
