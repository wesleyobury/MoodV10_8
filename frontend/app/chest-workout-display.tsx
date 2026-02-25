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
import BackButton from '../components/BackButton';
import WorkoutCard from '../components/WorkoutCard';
import { useCart, WorkoutItem } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Analytics } from '../utils/analytics';
import { chestWorkoutDatabase } from '../data/chest-workouts-data';
import { Workout, EquipmentWorkouts } from '../types/workout';

const workoutDatabase: EquipmentWorkouts[] = chestWorkoutDatabase;

const ChestWorkoutDisplayScreen = memo(function ChestWorkoutDisplayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const moodTitle = params.mood as string || 'Muscle Gainer';
  const workoutType = params.workoutType as string || 'Chest';
  const equipmentParam = params.equipment as string || '';
  const difficulty = params.difficulty as string || 'beginner';
  
  // Multi-muscle group queue support
  const muscleQueue = params.muscleQueue ? JSON.parse(params.muscleQueue as string) : [];
  const currentMuscleIndex = parseInt(params.currentMuscleIndex as string || '0');
  const totalMuscles = parseInt(params.totalMuscles as string || '1');
  const hasMoreMuscles = muscleQueue.length > 0;
  
  // Decode the equipment parameter since it was URL encoded
  const decodedEquipmentParam = decodeURIComponent(equipmentParam);
  const selectedEquipmentNames = decodedEquipmentParam.split(',').filter(name => name.trim() !== '');
  
  console.log('Chest Workout Debug:', {
    equipmentParam,
    selectedEquipmentNames,
    difficulty,
    workoutType,
    moodTitle,
    muscleQueue,
    currentMuscleIndex,
    totalMuscles,
  });

  const userWorkouts = workoutDatabase.filter(item => 
    selectedEquipmentNames.some(name => 
      item.equipment.toLowerCase().trim() === name.toLowerCase().trim()
    )
  );

  const { addToCart, isInCart, cartItems } = useCart();
  const { token } = useAuth();
  const hasItemsInCart = cartItems.length > 0;

  const handleGoBack = () => {
    router.back();
  };

  // Navigate to next muscle group in queue
  const handleNextMuscleGroup = () => {
    if (muscleQueue.length === 0) return;
    
    const nextMuscle = muscleQueue[0];
    const remainingQueue = muscleQueue.slice(1);
    const nextIndex = currentMuscleIndex + 1;
    
    // Navigate to the next muscle group's equipment screen
    let pathname = '';
    switch (nextMuscle.name) {
      case 'Chest':
        pathname = '/chest-equipment';
        break;
      case 'Shoulders':
        pathname = '/shoulders-equipment';
        break;
      case 'Back':
        pathname = '/back-equipment';
        break;
      case 'Biceps':
        pathname = '/biceps-equipment';
        break;
      case 'Triceps':
        pathname = '/triceps-equipment';
        break;
      case 'Legs':
        pathname = '/legs-muscle-groups';
        break;
      case 'Abs':
        pathname = '/abs-equipment';
        break;
      default:
        console.log(`Navigation for ${nextMuscle.name} not implemented`);
        return;
    }
    
    router.push({
      pathname: pathname as any,
      params: {
        mood: moodTitle,
        bodyPart: nextMuscle.name,
        muscleQueue: JSON.stringify(remainingQueue),
        currentMuscleIndex: nextIndex.toString(),
        totalMuscles: totalMuscles.toString(),
      }
    });
  };

  // Navigate to next muscle group or workout session
  const handleContinue = () => {
    // If there are more muscle groups, go to next one
    if (hasMoreMuscles) {
      handleNextMuscleGroup();
    } else {
      // All muscle groups done, go to workout session
      router.push('/cart' as any);
    }
  };

  const createWorkoutId = (workout: Workout, equipment: string, diff: string) => {
    return `${workout.name}-${equipment}-${diff}`;
  };

  const handleAddToCart = (workout: Workout, equipment: string) => {
    const workoutId = createWorkoutId(workout, equipment, difficulty);
    
    if (isInCart(workoutId)) {
      return;
    }

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
      workoutType: workoutType,
      moodCard: moodTitle,
      moodTips: workout.moodTips || [],
    };

    if (token) {
      Analytics.workoutAddedToCart(token, {
        workout_name: workout.name,
        mood_category: moodTitle,
        equipment: equipment,
      });
    }

    addToCart(workoutItem);
  };

  const handleStartWorkout = (workout: Workout, equipment: string, diff: string) => {
    try {
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
          moodCard: 'Muscle Gainer',
          moodTips: encodeURIComponent(JSON.stringify(workout.moodTips || []))
        }
      });
    } catch (error) {
      console.error('Error starting workout:', error);
    }
  };

  const createProgressRows = () => {
    const steps = [
      { key: 'mood', icon: 'fitness' as keyof typeof Ionicons.glyphMap, text: 'Muscle' },
      { key: 'muscle', icon: 'body' as keyof typeof Ionicons.glyphMap, text: 'Chest' },
      { key: 'difficulty', icon: 'speedometer' as keyof typeof Ionicons.glyphMap, text: difficulty === 'intermediate' ? 'Intermed.' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1) },
      { key: 'equipment', icon: 'construct' as keyof typeof Ionicons.glyphMap, text: `${selectedEquipmentNames.length} Equip.` },
    ];
    return [steps];
  };

  if (userWorkouts.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <BackButton onPress={handleGoBack} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Chest Workouts</Text>
            <Text style={styles.headerSubtitle}>{moodTitle}</Text>
          </View>
          <HomeButton />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="barbell" size={64} color='rgba(255, 215, 0, 0.3)' />
          <Text style={styles.emptyStateText}>No workouts found for selected equipment</Text>
          <Text style={styles.emptyStateSubtext}>Try selecting different equipment or difficulty level</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: '#000000', zIndex: 100 }} />
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <BackButton onPress={handleGoBack} />
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Your Workouts</Text>
            <Text style={styles.headerSubtitle}>{moodTitle}</Text>
          </View>
          <HomeButton />
        </View>

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

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContentContainer, { paddingBottom: hasItemsInCart ? 100 : 24 }]}>
          {/* Muscle Group Indicator */}
          {totalMuscles > 1 && (
            <View style={styles.muscleIndicator}>
              <Text style={styles.muscleIndicatorText}>
                Muscle Group {currentMuscleIndex + 1} of {totalMuscles}: <Text style={styles.muscleIndicatorHighlight}>{workoutType}</Text>
              </Text>
            </View>
          )}
          
          {userWorkouts.map((equipmentData) => {
            const workouts = equipmentData.workouts[difficulty as keyof typeof equipmentData.workouts] || [];
            if (workouts.length === 0) return null;
            
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
        
        {/* Bottom Navigation Button - Always show, either next muscle or finish */}
        <View style={[styles.continueButtonContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.continueButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.continueButtonText}>
                {hasMoreMuscles 
                  ? `Next: ${muscleQueue[0]?.displayName || muscleQueue[0]?.name}`
                  : 'Finish and View Cart'
                }
              </Text>
              {hasMoreMuscles && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
                </View>
              )}
              <Ionicons name={hasMoreMuscles ? "arrow-forward" : "cart"} size={20} color='#0c0c0c' />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
});

export default ChestWorkoutDisplayScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 215, 0, 0.2)', backgroundColor: '#000000', zIndex: 10 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 215, 0, 0.1)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255, 215, 0, 0.3)' },
  headerTextContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', textAlign: 'center' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', marginTop: 2 },
  progressContainer: { backgroundColor: '#111111', borderBottomWidth: 1, borderBottomColor: 'rgba(255, 215, 0, 0.2)', paddingVertical: 8, paddingHorizontal: 16, zIndex: 10 },
  progressContent: { alignItems: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  progressStep: { alignItems: 'center', minWidth: 60 },
  progressStepActive: { width: 28, height: 28, borderRadius: 14, overflow: 'hidden', marginBottom: 4 },
  progressStepGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', borderRadius: 999 },
  progressStepText: { fontSize: 10, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', fontWeight: '500', maxWidth: 70 },
  progressConnector: { width: 16, height: 2, backgroundColor: 'rgba(255, 215, 0, 0.3)', marginHorizontal: 8, marginTop: 14 },
  scrollView: { flex: 1, overflow: 'visible' },
  scrollContentContainer: { paddingTop: 24, paddingBottom: 120, overflow: 'visible' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyStateText: { fontSize: 18, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', marginTop: 16, marginBottom: 8 },
  emptyStateSubtext: { fontSize: 14, color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' },
  // Muscle Group Indicator
  muscleIndicator: { backgroundColor: 'rgba(255, 215, 0, 0.1)', paddingVertical: 10, paddingHorizontal: 16, marginHorizontal: 24, marginBottom: 16, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.2)' },
  muscleIndicatorText: { fontSize: 13, color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' },
  muscleIndicatorHighlight: { color: '#FFD700', fontWeight: '600' },
  // Next Muscle Group Button
  nextMuscleContainer: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  nextMuscleButton: { backgroundColor: '#FFD700', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nextMuscleContent: { flex: 1 },
  nextMuscleLabel: { fontSize: 12, color: 'rgba(0, 0, 0, 0.6)', marginBottom: 2 },
  nextMuscleName: { fontSize: 16, fontWeight: '600', color: '#000' },
  nextMuscleIndicatorBadge: { backgroundColor: 'rgba(0, 0, 0, 0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 12 },
  nextMuscleIndicatorText: { fontSize: 12, fontWeight: '600', color: '#000' },
  // Continue Button
  continueButtonContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 16, backgroundColor: '#000000', borderTopWidth: 1, borderTopColor: 'rgba(255, 215, 0, 0.2)' },
  continueButton: { borderRadius: 12, overflow: 'hidden' },
  continueButtonGradient: { padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  continueButtonText: { fontSize: 16, fontWeight: 'bold', color: '#0c0c0c', marginRight: 8 },
  cartBadge: { backgroundColor: 'rgba(0, 0, 0, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginRight: 8 },
  cartBadgeText: { fontSize: 12, fontWeight: '600', color: '#0c0c0c' },
});
