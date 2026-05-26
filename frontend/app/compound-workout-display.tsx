import React, { memo, useEffect, useMemo, useState } from 'react';
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
import { glutesWorkoutDatabase } from '../data/glutes-workouts-data';
import { hamstringsWorkoutDatabase } from '../data/hamstrings-workouts-data';
import { quadsWorkoutDatabase } from '../data/quads-workouts-data';
import { calvesWorkoutDatabase } from '../data/calves-workouts-data';
import { compoundLegsWorkoutDatabase } from '../data/compound-legs-workouts-data';
import { Workout, EquipmentWorkouts } from '../types/workout';
import { API_URL } from '../utils/apiConfig';

// Map muscle group name to database
const muscleGroupDatabases: Record<string, EquipmentWorkouts[]> = {
  Compound: compoundLegsWorkoutDatabase,
  Glutes: glutesWorkoutDatabase,
  Hammies: hamstringsWorkoutDatabase,
  Quads: quadsWorkoutDatabase,
  Calfs: calvesWorkoutDatabase,
};

// Map muscle group name to display name
const muscleGroupDisplayNames: Record<string, string> = {
  Compound: 'Compound Legs',
  Glutes: 'Glutes',
  Hammies: 'Hamstrings',
  Quads: 'Quadriceps',
  Calfs: 'Calves',
};

interface EquipmentPerGroup {
  Compound: string[];
  Glutes: string[];
  Hammies: string[];
  Quads: string[];
  Calfs: string[];
}

const CompoundWorkoutDisplayScreen = memo(function CompoundWorkoutDisplayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const moodTitle = params.mood as string || 'Muscle Gainer';
  const muscleGroupsParam = params.muscleGroups as string || '';
  const equipmentPerGroupParam = params.equipmentPerGroup as string || '';
  const difficulty = params.difficulty as string || 'beginner';
  
  // Parse muscle groups
  const muscleGroups = muscleGroupsParam ? decodeURIComponent(muscleGroupsParam).split(',') : [];
  
  // Multi-muscle group queue support
  const muscleQueue = params.muscleQueue ? JSON.parse(params.muscleQueue as string) : [];
  const currentMuscleIndex = parseInt(params.currentMuscleIndex as string || '0');
  const totalMuscles = parseInt(params.totalMuscles as string || '1');
  const hasMoreMuscles = muscleQueue.length > 0;
  
  // Parse equipment per group
  let equipmentPerGroup: EquipmentPerGroup = {
    Compound: [],
    Glutes: [],
    Hammies: [],
    Quads: [],
    Calfs: [],
  };
  
  try {
    if (equipmentPerGroupParam) {
      equipmentPerGroup = JSON.parse(decodeURIComponent(equipmentPerGroupParam));
    }
  } catch (e) {
    console.error('Error parsing equipmentPerGroup:', e);
  }
  
  console.log('Compound/Legs Workout Debug:', {
    muscleGroups,
    equipmentPerGroup,
    difficulty,
    moodTitle,
  });

  const { addToCart, isInCart } = useCart();
  const { token } = useAuth();

  // Map frontend muscleGroup key → admin "muscle" value (form uses display names)
  const muscleGroupToAdminMuscle: Record<string, string> = {
    Compound: 'Compound',
    Glutes: 'Glutes',
    Hammies: 'Hamstrings',
    Quads: 'Quads',
    Calfs: 'Calves',
  };

  // Fetch dynamic admin-created workouts for this mood + difficulty
  const [adminWorkouts, setAdminWorkouts] = useState<any[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams();
        if (moodTitle) params.set('mood', moodTitle);
        if (difficulty) params.set('intensity', difficulty);
        const resp = await fetch(`${API_URL}/api/workouts?${params.toString()}`);
        if (!resp.ok) {
          if (!cancelled) setAdminWorkouts([]);
          return;
        }
        const data = await resp.json();
        if (!cancelled) setAdminWorkouts(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setAdminWorkouts([]);
      }
    })();
    return () => { cancelled = true; };
  }, [moodTitle, difficulty]);

  // Convert admin workout doc → static Workout shape
  const toWorkoutShape = (w: any): Workout => ({
    name: w.name,
    duration: w.duration,
    description: w.description,
    battlePlan: w.battlePlan || '',
    imageUrl: w.imageUrl || '',
    intensityReason: w.intensityReason || '',
    moodTips: Array.isArray(w.moodTips) ? w.moodTips : [],
  });

  const handleGoBack = () => {
    router.back();
  };

  // Navigate to next muscle group or cart
  const handleNextMuscleGroup = () => {
    if (hasMoreMuscles) {
      const nextMuscle = muscleQueue[0];
      const remainingQueue = muscleQueue.slice(1);
      const nextIndex = currentMuscleIndex + 1;
      
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
          pathname = '/cart';
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
    } else {
      router.push('/cart' as any);
    }
  };

  const createWorkoutId = (workout: Workout, equipment: string, diff: string) => {
    return `${workout.name}-${equipment}-${diff}`;
  };

  const handleAddToCart = (workout: Workout, equipment: string, muscleGroup: string) => {
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
      workoutType: muscleGroupDisplayNames[muscleGroup] || muscleGroup,
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

  const handleStartWorkout = (workout: Workout, equipment: string, diff: string, muscleGroup: string) => {
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
          workoutType: muscleGroupDisplayNames[muscleGroup] || muscleGroup,
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
      { key: 'muscle', icon: 'body' as keyof typeof Ionicons.glyphMap, text: 'Legs' },
      { key: 'groups', icon: 'layers' as keyof typeof Ionicons.glyphMap, text: `${muscleGroups.length} Groups` },
      { key: 'difficulty', icon: 'speedometer' as keyof typeof Ionicons.glyphMap, text: difficulty === 'intermediate' ? 'Intermed.' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1) },
    ];
    return [steps];
  };

  // Get workouts for each selected muscle group with their equipment.
  // Merges static-data workouts with admin-created workouts (matching mood +
  // muscle + equipment + intensity), so dynamically-added workouts appear in
  // the same equipment group cards.
  const getWorkoutsForMuscleGroup = (muscleGroup: string): EquipmentWorkouts[] => {
    const database = muscleGroupDatabases[muscleGroup] || [];
    const equipment = equipmentPerGroup[muscleGroup as keyof EquipmentPerGroup] || [];

    if (equipment.length === 0) {
      return [];
    }

    const adminMuscleName = muscleGroupToAdminMuscle[muscleGroup] || muscleGroup;
    const eqEquals = (a: string, b: string) =>
      a.toLowerCase().trim() === b.toLowerCase().trim();

    // Admin workouts that match this muscle group + intensity (already filtered)
    const groupAdminWorkouts = adminWorkouts.filter(
      (w) => (w.muscle || '').toLowerCase() === adminMuscleName.toLowerCase()
    );

    // Start with static equipment cards filtered to selected equipment
    const staticEquipment = database.filter((item) =>
      equipment.some((eqName) => eqEquals(item.equipment, eqName))
    );

    // Build map keyed by equipment name (lowercase) to inject admin workouts
    const merged: Record<string, EquipmentWorkouts> = {};
    for (const item of staticEquipment) {
      merged[item.equipment.toLowerCase().trim()] = {
        equipment: item.equipment,
        icon: item.icon,
        workouts: {
          beginner: [...(item.workouts.beginner || [])],
          intermediate: [...(item.workouts.intermediate || [])],
          advanced: [...(item.workouts.advanced || [])],
        },
      };
    }

    // Inject admin workouts into matching equipment buckets (or create new)
    for (const w of groupAdminWorkouts) {
      // Only consider equipment the user selected for this group
      const matchedEq = equipment.find((eqName) => eqEquals(eqName, w.equipment));
      if (!matchedEq) continue;
      const key = matchedEq.toLowerCase().trim();
      if (!merged[key]) {
        merged[key] = {
          equipment: matchedEq,
          icon: 'barbell',
          workouts: { beginner: [], intermediate: [], advanced: [] },
        };
      }
      const intensityKey = (w.intensity || difficulty || 'beginner').toLowerCase() as
        | 'beginner'
        | 'intermediate'
        | 'advanced';
      if (intensityKey === 'beginner' || intensityKey === 'intermediate' || intensityKey === 'advanced') {
        merged[key].workouts[intensityKey].push(toWorkoutShape(w));
      }
    }

    return Object.values(merged);
  };

  // Check if there are any workouts to display
  const hasAnyWorkouts = muscleGroups.some(group => {
    const workouts = getWorkoutsForMuscleGroup(group);
    return workouts.some(eq => {
      const difficultyWorkouts = eq.workouts[difficulty as keyof typeof eq.workouts] || [];
      return difficultyWorkouts.length > 0;
    });
  });

  if (!hasAnyWorkouts) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="chevron-back" size={24} color="#FFD700" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Legs Workouts</Text>
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
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="chevron-back" size={24} color="#FFD700" />
          </TouchableOpacity>
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

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContentContainer}>
          {muscleGroups.map((muscleGroup) => {
            const workoutsForGroup = getWorkoutsForMuscleGroup(muscleGroup);
            
            // Filter to only show equipment with workouts for this difficulty
            const equipmentWithWorkouts = workoutsForGroup.filter(eq => {
              const difficultyWorkouts = eq.workouts[difficulty as keyof typeof eq.workouts] || [];
              return difficultyWorkouts.length > 0;
            });
            
            if (equipmentWithWorkouts.length === 0) {
              return null;
            }
            
            return (
              <View key={muscleGroup} style={styles.muscleGroupSection}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{muscleGroupDisplayNames[muscleGroup] || muscleGroup}</Text>
                  <View style={styles.sectionBadge}>
                    <Text style={styles.sectionBadgeText}>{equipmentWithWorkouts.length} equipment</Text>
                  </View>
                </View>
                
                {equipmentWithWorkouts.map((equipmentData) => {
                  const workouts = equipmentData.workouts[difficulty as keyof typeof equipmentData.workouts] || [];
                  
                  return (
                    <WorkoutCard
                      key={`${muscleGroup}-${equipmentData.equipment}`}
                      equipment={equipmentData.equipment}
                      icon={equipmentData.icon}
                      workouts={workouts}
                      difficulty={difficulty}
                      isInCart={isInCart}
                      createWorkoutId={createWorkoutId}
                      handleAddToCart={(workout, equipment) => handleAddToCart(workout, equipment, muscleGroup)}
                      onStartWorkout={(workout, equipment, diff) => handleStartWorkout(workout, equipment, diff, muscleGroup)}
                    />
                  );
                })}
              </View>
            );
          })}
        </ScrollView>

        {/* Bottom Navigation Button - Always show, either next muscle or finish */}
        <View style={[styles.bottomButtonContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
          <TouchableOpacity 
            style={styles.nextMuscleButton}
            onPress={handleNextMuscleGroup}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.nextMuscleButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.nextMuscleButtonText}>
                {hasMoreMuscles 
                  ? `Next: ${muscleQueue[0]?.displayName || muscleQueue[0]?.name || 'Muscle Group'}`
                  : 'Finish and View Cart'
                }
              </Text>
              <Ionicons 
                name={hasMoreMuscles ? "arrow-forward" : "cart"}
                size={20} 
                color='#0c0c0c' 
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
});

export default CompoundWorkoutDisplayScreen;

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
  scrollContentContainer: { paddingTop: 16, paddingBottom: 100, overflow: 'visible' },
  muscleGroupSection: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  sectionBadge: { backgroundColor: 'rgba(255, 215, 0, 0.15)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  sectionBadgeText: { fontSize: 12, color: '#FFD700', fontWeight: '600' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyStateText: { fontSize: 18, color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center', marginTop: 16, marginBottom: 8 },
  emptyStateSubtext: { fontSize: 14, color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' },
  bottomButtonContainer: { 
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20, 
    paddingTop: 16, 
    backgroundColor: '#000000', 
    borderTopWidth: 1, 
    borderTopColor: 'rgba(255, 215, 0, 0.2)' 
  },
  nextMuscleButton: { borderRadius: 12, overflow: 'hidden' },
  nextMuscleButtonGradient: { paddingVertical: 16, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  nextMuscleButtonText: { fontSize: 16, fontWeight: 'bold', color: '#0c0c0c' },
});
