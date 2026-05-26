import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeButton from '../components/HomeButton';
import WorkoutCard from '../components/WorkoutCard';
import { useCart, WorkoutItem } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Analytics } from '../utils/analytics';
import { lazyFullBodyDatabase } from '../data/lazy-full-body-data';
import { Workout, EquipmentWorkouts } from '../types/workout';

// Use imported lazy full body workout database
const workoutDatabase: EquipmentWorkouts[] = lazyFullBodyDatabase;

const LazyFullBodyWorkoutsScreen = memo(function LazyFullBodyWorkoutsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // Parse URL parameters
  const moodTitle = params.mood as string || "I'm feeling lazy";
  const workoutType = params.workoutType as string || 'Full Body';
  const bodyPart = params.bodyPart as string || 'Full Body';
  const difficulty = params.difficulty as string || 'beginner';
  
  console.log('Lazy Full Body Debug:', {
    difficulty,
    workoutType,
    bodyPart,
    moodTitle,
    workoutDatabaseEquipment: workoutDatabase.map(w => w.equipment),
  });

  // For lazy weight screens, show ALL equipment workouts (no filtering)
  const userWorkouts = workoutDatabase;

  console.log('Workout data count:', userWorkouts.length);

  // Cart hooks
  const { addToCart, isInCart } = useCart();
  const { token } = useAuth();

  const handleGoBack = () => {
    router.back();
  };

  const createWorkoutId = (workout: Workout, equipment: string, diff: string) => {
    return `${workout.name}-${equipment}-${diff}`;
  };

  const handleAddToCart = (workout: Workout, equipment: string) => {
    const workoutId = createWorkoutId(workout, equipment, difficulty);
    
    if (isInCart(workoutId)) {
      return; // Already in cart
    }

    // Create WorkoutItem from current workout
    const workoutItem: WorkoutItem = {
      id: workoutId,
      name: workout.name,
      duration: workout.duration,
      description: workout.description,
      battlePlan: workout.battlePlan,
      imageUrl: workout.imageUrl,
      intensityReason: workout.intensityReason,
      equipment: equipment,
      difficulty: difficulty,
      workoutType: `${moodTitle} - ${bodyPart}`,
      moodCard: moodTitle,
      moodTips: workout.moodTips || [],
    };

    // Track workout added to cart
    if (token) {
      Analytics.workoutAddedToCart(token, {
        workout_name: workout.name,
        mood_category: moodTitle,
        equipment: equipment,
      });
    }

    // Add to cart
    addToCart(workoutItem);
  };

  const handleStartWorkout = (workout: Workout, equipment: string, diff: string) => {
    try {
      console.log('🚀 Starting workout:', workout.name, 'on', equipment);
      
      if (!workout.name || !equipment || !diff) {
        console.error('❌ Missing required parameters for workout navigation');
        return;
      }
      
      router.push({
        pathname: '/workout-guidance',
        params: {
          workoutName: workout.name,
          equipment: equipment,
          description: workout.description || '',
          battlePlan: workout.battlePlan || '',
          duration: workout.duration || '20 min',
          difficulty: diff,
          workoutType: workoutType,
          imageUrl: workout.imageUrl || '',
          intensityReason: workout.intensityReason || '',
          moodCard: moodTitle,
          moodTips: encodeURIComponent(JSON.stringify(workout.moodTips || []))
        }
      });
      
      console.log('✅ Navigation completed - using simplified parameters');
    } catch (error) {
      console.error('❌ Error starting workout:', error);
    }
  };

  // Create progress bar - single row with requested order
  const createProgressRows = () => {
    const steps = [
      { key: 'mood', icon: 'bed' as keyof typeof Ionicons.glyphMap, text: 'Lazy' },
      { key: 'type', icon: 'barbell' as keyof typeof Ionicons.glyphMap, text: 'Lift' },
      { key: 'bodyPart', icon: 'body' as keyof typeof Ionicons.glyphMap, text: bodyPart },
      { key: 'difficulty', icon: 'speedometer' as keyof typeof Ionicons.glyphMap, text: difficulty === 'intermediate' ? 'Intermed.' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1) },
    ];

    return [steps];
  };

  if (userWorkouts.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="chevron-back" size={24} color="#FFD700" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Full Body</Text>
            <Text style={styles.headerSubtitle}>{moodTitle}</Text>
          </View>
          <HomeButton />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="barbell" size={64} color='rgba(255, 215, 0, 0.3)' />
          <Text style={styles.emptyStateText}>No workouts found for selected options</Text>
          <Text style={styles.emptyStateSubtext}>Try selecting different muscle groups or difficulty level</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      {/* Status bar background - covers the notch/status bar area */}
      <View style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        height: insets.top, 
        backgroundColor: '#000000', 
        zIndex: 100 
      }} />
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="chevron-back" size={24} color="#FFD700" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Your Workouts</Text>
            <Text style={styles.headerSubtitle}>{moodTitle}</Text>
          </View>
          <HomeButton />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressContent}>
            <View style={styles.progressRow}>
              {createProgressRows()[0].map((step, stepIndex) => (
                <React.Fragment key={step.key}>
                  <View style={styles.progressStep}>
                    <View style={styles.progressStepActive}><LinearGradient colors={['#FFD700', '#FFA500']} style={styles.progressStepGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                      <Ionicons name={step.icon} size={10} color='#0c0c0c' /></LinearGradient>
                    </View>
                    <Text style={styles.progressStepText}>{step.text}</Text>
                  </View>
                  {stepIndex < createProgressRows()[0].length - 1 && (
                    <View style={styles.progressConnector} />
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>

        {/* Equipment Workout Cards */}
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
        >
          {userWorkouts.map((equipmentData) => {
            const workouts = equipmentData.workouts[difficulty as keyof typeof equipmentData.workouts] || [];
            
            if (workouts.length === 0) {
              return null;
            }
            
            return (
              <WorkoutCard
                key={equipmentData.equipment}
                equipment={equipmentData.equipment}
                icon={equipmentData.icon}
                workouts={workouts}
                difficulty={difficulty}
                isInCart={isInCart}
                createWorkoutId={createWorkoutId}
                handleAddToCart={handleAddToCart}
                onStartWorkout={handleStartWorkout}
              />
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
});

export default LazyFullBodyWorkoutsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
    backgroundColor: '#000000',
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 2,
  },
  progressContainer: {
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  progressContent: {
    alignItems: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  progressStep: {
    alignItems: 'center',
    minWidth: 60,
  },
  progressStepActive: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressStepGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
  },
  progressStepText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 70,
  },
  progressConnector: {
    width: 16,
    height: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    marginHorizontal: 8,
    marginTop: 14,
  },
  scrollView: {
    flex: 1,
    overflow: 'visible',
  },
  scrollContentContainer: {
    paddingTop: 24,
    paddingBottom: 10,
    overflow: 'visible',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
});
