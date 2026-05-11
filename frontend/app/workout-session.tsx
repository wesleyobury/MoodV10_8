import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeButton from '../components/HomeButton';
import BackButton from '../components/BackButton';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Analytics } from '../utils/analytics';
import ExerciseLookupSheet from '../components/ExerciseLookupSheet';
import ExerciseLookupTrigger from '../components/ExerciseLookupTrigger';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TIP_FORM_VIDEOS_DISMISSED_KEY = 'mood:tip:form_videos:never';

interface SessionWorkout {
  workoutName: string;
  equipment: string;
  description: string;
  battlePlan: string;
  duration: string;
  difficulty: string;
  workoutType: string;
  moodTips: string;
  imageUrl?: string;
  intensityReason?: string;
}

export default function WorkoutSessionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { clearCart } = useCart();
  const { token } = useAuth();
  
  const [sessionWorkouts, setSessionWorkouts] = useState<SessionWorkout[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [exerciseLookupVisible, setExerciseLookupVisible] = useState(false);

  // Onboarding Tip 2: Form videos — uses AsyncStorage for "never" persistence
  // instead of server tips_state. This guarantees the popup actually shows
  // for users whose prod tips_state may have stale 'completed' values.
  const [formTipActive, setFormTipActive] = useState(false);
  const formTipTriggeredRef = React.useRef(false);

  // Trigger Tip 2 1.5s after the screen mounts — fires on every fresh entry
  // unless the user pressed "Don't show again" in any prior session.
  useEffect(() => {
    if (formTipTriggeredRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        const never = await AsyncStorage.getItem(TIP_FORM_VIDEOS_DISMISSED_KEY);
        if (never === '1' || cancelled) return;
        const timer = setTimeout(() => {
          if (formTipTriggeredRef.current || cancelled) return;
          formTipTriggeredRef.current = true;
          setFormTipActive(true);
        }, 1500);
        return () => clearTimeout(timer);
      } catch {
        // AsyncStorage unavailable — just show the tip
        const timer = setTimeout(() => {
          if (formTipTriggeredRef.current || cancelled) return;
          formTipTriggeredRef.current = true;
          setFormTipActive(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleFormTipTap = () => {
    setFormTipActive(false);
    setExerciseLookupVisible(true);
  };
  const handleFormTipDismiss = () => {
    setFormTipActive(false);
  };
  const handleFormTipNeverShow = async () => {
    setFormTipActive(false);
    try {
      await AsyncStorage.setItem(TIP_FORM_VIDEOS_DISMISSED_KEY, '1');
    } catch {
      // best-effort
    }
  };

  useEffect(() => {
    try {
      const workoutsParam = params.sessionWorkouts as string;
      const indexParam = params.currentIndex as string;
      
      if (workoutsParam) {
        const workouts = JSON.parse(workoutsParam);
        setSessionWorkouts(workouts);
        setCurrentIndex(parseInt(indexParam) || 0);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error parsing session workouts:', error);
      setIsLoading(false);
    }
  }, [params]);

  const currentWorkout = sessionWorkouts[currentIndex];
  const isLastWorkout = currentIndex === sessionWorkouts.length - 1;
  const isFirstWorkout = currentIndex === 0;

  const handleGoBack = () => {
    if (currentIndex === 0) {
      router.back();
    } else {
      Alert.alert(
        'Leave Session',
        "Are you sure you want to leave the workout session?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Leave", 
            style: "destructive", 
            onPress: () => {
              // Track workout abandoned event
              if (token && currentWorkout) {
                Analytics.workoutAbandoned(token, {
                  workout_name: currentWorkout.workoutName,
                  progress_percentage: Math.round((currentIndex / sessionWorkouts.length) * 100),
                  exercises_completed: currentIndex,
                  total_exercises: sessionWorkouts.length,
                });
              }
              router.back();
            }
          }
        ]
      );
    }
  };

  const handleNextWorkout = () => {
    if (!isLastWorkout) {
      // Track exercise/workout completed
      if (token && currentWorkout) {
        Analytics.exerciseCompleted(token, {
          exercise_name: currentWorkout.workoutName,
          sets: 1,
          reps: 1,
        });
      }
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePreviousWorkout = () => {
    if (!isFirstWorkout) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinishSession = async () => {
    console.log('=== FINISH SESSION CALLED ===');
    
    // Prepare workout completion data with full details for replication
    const completedWorkouts = sessionWorkouts.map(workout => ({
      workoutTitle: workout.workoutName,
      workoutName: workout.workoutName,
      equipment: workout.equipment,
      duration: workout.duration,
      difficulty: workout.difficulty,
      moodCategory: workout.workoutType,
      // Include additional data for workout replication
      imageUrl: workout.imageUrl || '',
      description: workout.description || '',
      battlePlan: workout.battlePlan || '',
      intensityReason: workout.intensityReason || '',
      moodTips: workout.moodTips ? JSON.parse(workout.moodTips) : [],
    }));

    const totalDuration = getTotalDuration();
    const completedAt = new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });

    // Get mood category from first workout
    const firstWorkout = sessionWorkouts[0];
    const moodCategory = firstWorkout?.workoutType || firstWorkout?.moodCard || 'Workout';

    // Create workout snapshot for persistent access (Try this workout feature)
    let workoutSnapshotId: string | null = null;
    if (token) {
      try {
        console.log('📸 Creating workout snapshot...');
        const snapshotResponse = await fetch(`${API_URL}/api/workout-snapshots`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workouts: completedWorkouts,
            total_duration: totalDuration,
            mood_category: moodCategory,
          }),
        });
        
        if (snapshotResponse.ok) {
          const snapshotData = await snapshotResponse.json();
          workoutSnapshotId = snapshotData.id;
          console.log('✅ Workout snapshot created:', workoutSnapshotId);
        } else {
          console.error('❌ Failed to create workout snapshot');
        }
      } catch (error) {
        console.error('❌ Error creating workout snapshot:', error);
      }
    }

    const workoutStatsData = {
      workouts: completedWorkouts,
      totalDuration,
      completedAt,
      moodCategory,
      workoutSnapshotId, // Include the snapshot ID
    };

    console.log('Workout stats data:', workoutStatsData);

    // Track workout completion
    if (token && sessionWorkouts.length > 0) {
      const firstWorkout = sessionWorkouts[0];
      
      // Check if this is a featured workout
      const featuredWorkoutId = params.featuredWorkoutId as string;
      const featuredWorkoutTitle = params.featuredWorkoutTitle as string;
      
      if (featuredWorkoutId) {
        // Track featured workout completion
        Analytics.featuredWorkoutCompleted(token, {
          workout_id: featuredWorkoutId,
          workout_title: featuredWorkoutTitle || 'Unknown',
          mood_category: firstWorkout.workoutType || 'Unknown',
          exercises_completed: sessionWorkouts.length,
          duration_minutes: totalDuration,
        });
      }
      
      // Also track general workout completion
      Analytics.workoutCompleted(token, {
        mood_category: firstWorkout.workoutType || 'Unknown',
        difficulty: firstWorkout.difficulty,
        equipment: firstWorkout.equipment,
        duration_minutes: totalDuration,
        exercises_completed: sessionWorkouts.length
      });
    }

    // Clear cart
    clearCart();
    console.log('Cart cleared');
    
    // Navigate to create-post with workout stats
    console.log('Navigating to create-post...');
    router.push({
      pathname: '/create-post',
      params: {
        workoutStats: JSON.stringify(workoutStatsData)
      }
    });
    console.log('Navigation command sent');
  };

  const handleSkipWorkout = () => {
    Alert.alert(
      'Skip Workout',
      "Skip this workout and move to the next one?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Skip", 
          style: 'default', 
          onPress: () => {
            // Track workout skipped event
            if (token && currentWorkout) {
              Analytics.workoutSkipped(token, {
                workout_name: currentWorkout.workoutName,
                workout_index: currentIndex,
                total_exercises: sessionWorkouts.length,
              });
            }
            
            if (isLastWorkout) {
              handleFinishSession();
            } else {
              handleNextWorkout();
            }
          }
        }
      ]
    );
  };

  const getTotalDuration = () => {
    return sessionWorkouts.reduce((total, workout) => {
      const duration = parseInt(workout.duration.split(' ')[0]) || 0;
      return total + duration;
    }, 0);
  };

  const getCompletedDuration = () => {
    return sessionWorkouts.slice(0, currentIndex).reduce((total, workout) => {
      const duration = parseInt(workout.duration.split(' ')[0]) || 0;
      return total + duration;
    }, 0);
  };

  if (isLoading || !currentWorkout) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  let moodTips = [];
  try {
    moodTips = JSON.parse(currentWorkout.moodTips || '[]');
  } catch (error) {
    console.error('Error parsing mood tips:', error);
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={handleGoBack} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Workout Session</Text>
          <Text style={styles.headerSubtitle}>
            {currentIndex + 1} of {sessionWorkouts.length} • {getCompletedDuration()}/{getTotalDuration()} min
          </Text>
        </View>
        <View style={styles.headerButtonsContainer}>
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleSkipWorkout}
          >
            <Ionicons name="play-forward" size={20} color="#FFD700" />
          </TouchableOpacity>
          <HomeButton />
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${((currentIndex) / sessionWorkouts.length) * 100}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(((currentIndex) / sessionWorkouts.length) * 100)}% Complete
        </Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Workout */}
        <View style={styles.workoutCard}>
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutName}>{currentWorkout.workoutName}</Text>
            <View style={styles.workoutMeta}>
              <Text style={styles.workoutEquipment}>{currentWorkout.equipment}</Text>
              <View style={styles.workoutBadges}>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{currentWorkout.duration}</Text>
                </View>
                <View style={styles.difficultyBadge}>
                  <Text style={styles.difficultyText}>{currentWorkout.difficulty.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={styles.workoutDescription}>{currentWorkout.description}</Text>

          {/* Battle Plan */}
          <View style={styles.battlePlanContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list-outline" size={20} color="#FFD700" />
              <Text style={styles.sectionTitle}>Battle Plan</Text>
            </View>
            <Text style={styles.battlePlanText}>{currentWorkout.battlePlan}</Text>
            
            {/* Exercise Lookup Trigger */}
            <ExerciseLookupTrigger
              onPress={() => {
                if (formTipActive) {
                  setFormTipActive(false);
                }
                setExerciseLookupVisible(true);
              }}
            />
          </View>

          {/* MOOD Tips */}
          {moodTips.length > 0 && (
            <View style={styles.moodTipsContainer}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bulb-outline" size={20} color="#FFD700" />
                <Text style={styles.sectionTitle}>MOOD Tips</Text>
              </View>
              {moodTips.map((tip: any, index: number) => (
                <View key={index} style={styles.moodTip}>
                  <View style={styles.moodTipHeader}>
                    <Ionicons name={tip.icon as any} size={16} color="#FFD700" />
                    <Text style={styles.moodTipTitle}>{tip.title}</Text>
                  </View>
                  <Text style={styles.moodTipDescription}>{tip.description}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, isFirstWorkout && styles.navButtonDisabled]}
            onPress={handlePreviousWorkout}
            disabled={isFirstWorkout}
            activeOpacity={0.8}
          >
            <Ionicons 
              name='chevron-back' 
              size={20} 
              color={isFirstWorkout ? 'rgba(255, 255, 255, 0.3)' : '#FFD700'} 
            />
            <Text style={[
              styles.navButtonText, 
              isFirstWorkout && styles.navButtonTextDisabled
            ]}>
              Previous
            </Text>
          </TouchableOpacity>

          {isLastWorkout ? (
            <TouchableOpacity
              style={styles.finishButton}
              onPress={handleFinishSession}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-circle" size={20} color="#000000" />
              <Text style={styles.finishButtonText}>Finish Session</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNextWorkout}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Next Workout</Text>
              <Ionicons name="chevron-forward" size={20} color="#000000" />
            </TouchableOpacity>
          )}
        </View>

        {/* Upcoming Workouts */}
        {!isLastWorkout && (
          <View style={styles.upcomingContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color='#FFD700' />
              <Text style={styles.sectionTitle}>Up Next</Text>
            </View>
            {sessionWorkouts.slice(currentIndex + 1, currentIndex + 3).map((workout, index) => (
              <View key={index} style={styles.upcomingWorkout}>
                <Text style={styles.upcomingWorkoutName}>{workout.workoutName}</Text>
                <Text style={styles.upcomingWorkoutMeta}>
                  {workout.equipment} • {workout.duration}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      
      {/* Exercise Lookup Bottom Sheet */}
      <ExerciseLookupSheet
        visible={exerciseLookupVisible}
        onClose={() => setExerciseLookupVisible(false)}
      />

      {/* Onboarding Tip 2 — bottom-of-screen popup (visible regardless of scroll position) */}
      {formTipActive && (
        <View
          style={styles.formTipFloatingWrap}
          pointerEvents="box-none"
          testID="tip-form-videos-container"
        >
          <TouchableOpacity
            style={styles.formTipCard}
            activeOpacity={0.9}
            onPress={handleFormTipTap}
            testID="tip-form-videos-tap"
          >
            <View style={styles.formTipIconWrap}>
              <Ionicons name="play" size={12} color="#000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.formTipTitle}>Need a form check?</Text>
              <Text style={styles.formTipBody}>
                Tap to open visual exercise cues — videos for every move.
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleFormTipDismiss}
              style={styles.formTipClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID="tip-form-videos-dismiss"
            >
              <Ionicons name="close" size={14} color="#888" />
            </TouchableOpacity>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleFormTipNeverShow}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{ alignSelf: 'center', marginTop: 6 }}
            testID="tip-form-videos-never-show"
          >
            <Text style={styles.formTipNever}>Don&apos;t show again</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
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
    color: '#FFD700',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 2,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  workoutCard: {
    backgroundColor: '#111111',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    padding: 24,
    marginBottom: 24,
  },
  workoutHeader: {
    marginBottom: 16,
  },
  workoutName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  workoutMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workoutEquipment: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
  },
  workoutBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  durationBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  difficultyBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  workoutDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
    marginBottom: 24,
  },
  battlePlanContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 8,
  },
  battlePlanText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  moodTipsContainer: {
    marginBottom: 16,
  },
  moodTip: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  moodTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  moodTipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginLeft: 8,
  },
  moodTipDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginLeft: 8,
  },
  navButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  upcomingContainer: {
    backgroundColor: '#111111',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    padding: 20,
  },
  upcomingWorkout: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  upcomingWorkoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  upcomingWorkoutMeta: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },

  /* Onboarding Tip 2 — floating popup */
  formTipFloatingWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    zIndex: 9999,
  },
  formTipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    paddingRight: 30,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  formTipIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F5C518',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTipTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  formTipBody: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 12,
    lineHeight: 17,
  },
  formTipClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTipNever: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    textDecorationLine: 'underline',
  },
});