import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import HomeButton from '../components/HomeButton';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import Toast from '../components/Toast';
import { Analytics, GuestAnalytics } from '../utils/analytics';
import ExerciseLookupSheet from '../components/ExerciseLookupSheet';
import ExerciseLookupTrigger from '../components/ExerciseLookupTrigger';
import { TextWithTermLinks } from '../components/TermDefinitionPopup';
import { API_URL } from '../utils/apiConfig';
import InSessionProgressBar from '../components/InSessionProgressBar';
import { SessionSafetyBanner } from '../components/SessionSafetyBanner';

interface MOODTip {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const parseWorkoutDescription = (description: string): string[] => {
  // Handle the new format with instructions and bulleted movements
  if (description.includes('\n•') || description.includes('\n')) {
    const lines = description
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    const steps: string[] = [];
    
    for (const line of lines) {
      if (line.startsWith('•')) {
        // This is a movement/exercise - already has bullet, capitalize and keep original formatting
        const cleanStep = line.replace(/^•\s*/, '').trim();
        if (cleanStep) {
          const capitalized = cleanStep.charAt(0).toUpperCase() + cleanStep.slice(1);
          steps.push(`• ${capitalized}`);
        }
      } else {
        // This is an instruction - no bullet, just capitalize
        const cleanStep = line.trim();
        if (cleanStep) {
          const capitalized = cleanStep.charAt(0).toUpperCase() + cleanStep.slice(1);
          steps.push(capitalized);
        }
      }
    }
    
    return steps.filter(step => step.length > 0);
  }
  
  // Fallback for old comma-separated format
  let cleanedDescription = description
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/,\s*\./g, '.') // Remove comma before period
    .replace(/\.\s*,/g, ',') // Remove period before comma
    .replace(/,+/g, ',') // Replace multiple commas with single comma
    .trim();

  // Smart splitting on time units and logical breaks
  const steps = cleanedDescription
    .split(/,\s*(?=\d+\s*(?:sec|min))|(?:,\s*)?(?=repeat\s+\d+\s*(?:x|times?|cycles?|sets?))|(?:,\s*)?(?=finish\s+with)/i)
    .map(step => step.trim())
    .filter(step => step.length > 0)
    .map(step => {
      // Remove leading/trailing punctuation and clean up
      step = step.replace(/^[,.\s]+|[,.\s]+$/g, '').trim();
      
      // Handle specific patterns
      if (step.toLowerCase().match(/repeat\s+\d+\s*(?:x|times?|cycles?|sets?)/i)) {
        const repeatMatch = step.match(/repeat\s+(\d+\s*(?:x|times?|cycles?|sets?))/i);
        if (repeatMatch && repeatMatch[1]) {
          return `Repeat ${repeatMatch[1]}`;
        }
        return 'Repeat the sequence';
      }
      
      if (step.toLowerCase().startsWith('finish with')) {
        return `Finish with ${step.substring(11).trim()}`;
      }
      
      // Capitalize first letter
      return step.charAt(0).toUpperCase() + step.slice(1);
    })
    .filter(step => step.length > 0);
  
  // If we only have one step or no meaningful splits, return the original
  return steps.length > 1 ? steps : [cleanedDescription];
};

// Component to render step text with band placement styling and RPE/SPM links
const StepTextWithLinks: React.FC<{ step: string; style: object; }> = ({ step, style }) => {
  const { TextWithTermLinks } = require('../components/TermDefinitionPopup');
  
  // Check if the step contains parenthetical text (band placement)
  const parts = step.split(/(\([^)]+\))/);
  
  if (parts.length === 1) {
    // No parenthetical text, just use TextWithTermLinks
    return <TextWithTermLinks text={step} baseStyle={style} />;
  }
  
  // Has parenthetical text - render with mixed styles
  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (part.startsWith('(') && part.endsWith(')')) {
          // This is parenthetical text - render with smaller, italic style and term links
          return (
            <TextWithTermLinks 
              key={index} 
              text={part} 
              baseStyle={styles.bandPlacementText}
            />
          );
        } else {
          // Regular text with term links
          return (
            <TextWithTermLinks 
              key={index} 
              text={part} 
              baseStyle={style}
            />
          );
        }
      })}
    </Text>
  );
};

const renderStepWithBandPlacement = (step: string) => {
  // Check if the step contains parenthetical text (band placement)
  const parts = step.split(/(\([^)]+\))/);
  
  return parts.map((part, index) => {
    if (part.startsWith('(') && part.endsWith(')')) {
      // This is parenthetical text - render with smaller, italic style
      return (
        <Text key={index} style={styles.bandPlacementText}>
          {part}
        </Text>
      );
    } else {
      // Regular text
      return part;
    }
  });
};

export default function WorkoutGuidanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { clearCart, addToCart, isInCart } = useCart();
  
  const workoutName = params.workoutName as string || 'Workout';
  const equipment = params.equipment as string || 'Equipment';
  const description = params.description as string || '';
  const battlePlan = params.battlePlan as string || '';
  const duration = params.duration as string || '20 min';
  const difficulty = params.difficulty as string || 'beginner';
  const workoutType = params.workoutType as string || 'Strength Based';
  const imageUrl = params.imageUrl as string || '';
  const intensityReason = params.intensityReason as string || '';
  const moodCard = params.moodCard as string || '';
  
  // Session handling
  const isSession = params.isSession === 'true';
  const currentSessionIndex = parseInt(params.currentSessionIndex as string) || 0;
  const sessionWorkoutsParam = params.sessionWorkouts as string || '[]';
  let sessionWorkouts: any[] = [];
  try {
    sessionWorkouts = JSON.parse(sessionWorkoutsParam);
  } catch (error) {
    console.error('Error parsing session workouts:', error);
  }
  
  // Generate workout ID for cart checking
  const workoutId = `${workoutName}-${equipment}-${difficulty}`.toLowerCase().replace(/\s+/g, '-');
  const isWorkoutInCart = isInCart(workoutId);
  
  // Animation for add workout button
  const [addButtonScaleAnim] = useState(new Animated.Value(1));
  
  // Format workout type to show proper type  
  const displayWorkoutType = workoutType;
  
  // Parse MOOD tips from params (passed as JSON string)
  const moodTipsParam = params.moodTips as string || '[]';
  let moodTips: MOODTip[] = [];
  try {
    // First try to decode, but handle malformed URI gracefully
    let decodedParam = moodTipsParam;
    try {
      decodedParam = decodeURIComponent(moodTipsParam);
    } catch (decodeError) {
      // If decodeURIComponent fails, try using the raw param
      // It might already be decoded or have invalid encoding
      console.log('⚠️ decodeURIComponent failed, using raw param');
      decodedParam = moodTipsParam;
    }
    
    // Handle case where param might already be an array (not stringified)
    if (Array.isArray(decodedParam)) {
      moodTips = decodedParam;
    } else if (typeof decodedParam === 'string' && decodedParam.trim()) {
      moodTips = JSON.parse(decodedParam);
    }
    
    // Validate that we got an array
    if (!Array.isArray(moodTips)) {
      moodTips = [];
    }
  } catch (error) {
    console.log('🔄 Using fallback tips');
    // Fallback tips
    moodTips = [
      {
        icon: 'fitness',
        title: 'Form First',
        description: 'Focus on proper form over speed for maximum effectiveness and injury prevention.'
      },
      {
        icon: 'heart',
        title: 'Breathe Right',
        description: 'Maintain steady breathing rhythm to optimize oxygen delivery and performance.'
      }
    ];
  }
  
  // Get selected equipment names from router state or parse from URL
  // For demo purposes, we'll extract from the navigation path
  const selectedEquipmentNames = [equipment]; // This should be passed from navigation
  
  // Determine mood title based on workout type for better UX
  let moodTitle = 'Workout';
  if (workoutType === 'Body Weight' || workoutType === 'Weight Based') {
    moodTitle = 'Build explosion';
  } else if (workoutType.toLowerCase().includes('cardio') || workoutType.toLowerCase().includes('sweat')) {
    moodTitle = 'Sweat / burn fat';
  } else if (workoutType.toLowerCase().includes('lazy') || workoutType.toLowerCase().includes('light')) {
    moodTitle = 'Light movement';
  } else if (workoutType.toLowerCase().includes('outdoor')) {
    moodTitle = 'Outside';
  }
  
  // Timer state - uses start timestamp for background persistence
  const [startTimestamp, setStartTimestamp] = useState<number | null>(null);
  const [pausedTime, setPausedTime] = useState(0); // Time accumulated before pause
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [exerciseLookupVisible, setExerciseLookupVisible] = useState(false);
  
  const { token } = useAuth();
  const { canStartWorkout, openPaywall, recordStartFreeWorkout } = useSubscription();
  
  // Timer that calculates elapsed time from start timestamp
  // This ensures timer continues even when app is in background
  useEffect(() => {
    let interval: number | null = null;
    
    if (isRunning && !isPaused && startTimestamp) {
      // Update elapsed time every second based on actual timestamp difference
      const updateElapsed = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - startTimestamp) / 1000) + pausedTime;
        setElapsedTime(elapsed);
      };
      
      // Update immediately
      updateElapsed();
      
      // Then update every second
      interval = setInterval(updateElapsed, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, isPaused, startTimestamp, pausedTime]);
  
  const handleStartPauseTimer = () => {
    if (!isRunning) {
      // Phase B free-tier gate: a fresh "Start Workout" tap must check the
      // subscription state. Founding members + active/in-trial users pass
      // through; free users get exactly one session, then the paywall.
      if (!canStartWorkout) {
        Analytics.startWorkoutTapped(token, {
          allowed: false,
          trigger_source: 'start_workout_after_free_session',
        });
        openPaywall('start_workout_after_free_session');
        return;
      }
      Analytics.startWorkoutTapped(token, { allowed: true });
      // Mark the free session as consumed BEFORE state mutation so an
      // accidental double-tap can't race past the gate.
      recordStartFreeWorkout();
      // Starting fresh
      setStartTimestamp(Date.now());
      setPausedTime(0);
      setIsRunning(true);
      setIsPaused(false);
    } else if (isPaused) {
      // Resuming from pause - set new start timestamp and keep accumulated time
      setStartTimestamp(Date.now());
      setIsPaused(false);
    } else {
      // Pausing - save current elapsed time and clear start timestamp
      setPausedTime(elapsedTime);
      setStartTimestamp(null);
      setIsPaused(true);
    }
  };
  
  const handleResetTimer = () => {
    setElapsedTime(0);
    setStartTimestamp(null);
    setPausedTime(0);
    setIsRunning(false);
    setIsPaused(false);
  };
  
  const saveWorkoutCard = async (workouts: any[], totalDuration: number, completedAt: string) => {
    if (!token) {
      console.log('❌ No token available, cannot save workout card');
      return false;
    }

    try {
      console.log('💾 Saving workout card to profile...');
      const response = await fetch(`${API_URL}/api/workout-cards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workouts,
          total_duration: totalDuration,
          completed_at: completedAt,
        }),
      });

      if (response.ok) {
        console.log('✅ Workout card saved successfully');
        return true;
      } else {
        console.error('❌ Failed to save workout card:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Error saving workout card:', error);
      return false;
    }
  };
  
  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };
  
  // Handle adding workout to cart (for preview mode)
  const handleAddWorkoutToCart = () => {
    if (isWorkoutInCart) {
      showToast('Workout already in cart!');
      return;
    }
    
    // Animate the button
    Animated.sequence([
      Animated.timing(addButtonScaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(addButtonScaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(addButtonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Parse moodTips back to array
    let parsedMoodTips: { icon: string; title: string; description: string; }[] = [];
    try {
      parsedMoodTips = moodTips.map(tip => ({
        icon: tip.icon as string,
        title: tip.title,
        description: tip.description,
      }));
    } catch (e) {
      console.error('Error parsing moodTips for cart:', e);
    }
    
    const workoutItem = {
      id: workoutId,
      name: workoutName,
      duration: duration,
      description: description,
      battlePlan: battlePlan,
      imageUrl: imageUrl,
      intensityReason: intensityReason,
      equipment: equipment,
      difficulty: difficulty,
      workoutType: workoutType,
      moodCard: moodCard,
      moodTips: parsedMoodTips,
    };
    
    addToCart(workoutItem);
    showToast('Added to cart!');
    
    // Track analytics
    if (token) {
      Analytics.workoutAddedToCart(token, {
        workout_name: workoutName,
        equipment: equipment,
        difficulty: difficulty,
      });
    }
  };
  
  const handleCompletedWorkout = async () => {
    console.log('🎯 handleCompletedWorkout called');
    console.log('🎯 isSession:', isSession);
    console.log('🎯 sessionWorkouts.length:', sessionWorkouts.length);
    console.log('🎯 currentSessionIndex:', currentSessionIndex);
    
    // Track current exercise completion
    if (token) {
      Analytics.exerciseCompleted(token, {
        exercise_name: workoutName,
        sets: 1,
        reps: 1,
      });
      console.log('📊 Tracked exercise completed:', workoutName);
    }
    
    if (isSession && sessionWorkouts.length > 0) {
      const nextIndex = currentSessionIndex + 1;
      console.log('🎯 nextIndex:', nextIndex);
      
      if (nextIndex < sessionWorkouts.length) {
        // Move to next workout in session
        console.log('🎯 Moving to next workout');
        const nextWorkout = sessionWorkouts[nextIndex];
        
        // Get featured workout params to pass along
        const featuredWorkoutId = params.featuredWorkoutId as string;
        const featuredWorkoutTitle = params.featuredWorkoutTitle as string;
        
        // Handle moodTips - could be string or array depending on source
        let nextMoodTips = nextWorkout.moodTips || [];
        if (typeof nextMoodTips === 'string') {
          try {
            nextMoodTips = JSON.parse(nextMoodTips);
          } catch (e) {
            nextMoodTips = [];
          }
        }
        
        router.push({
          pathname: '/workout-guidance',
          params: {
            workoutName: nextWorkout.workoutName || nextWorkout.name,
            equipment: nextWorkout.equipment,
            description: nextWorkout.description,
            battlePlan: nextWorkout.battlePlan,
            duration: nextWorkout.duration,
            difficulty: nextWorkout.difficulty,
            workoutType: nextWorkout.workoutType,
            moodCard: nextWorkout.moodCard,
            sessionWorkouts: sessionWorkoutsParam,
            currentSessionIndex: nextIndex.toString(),
            isSession: 'true',
            moodTips: encodeURIComponent(JSON.stringify(nextMoodTips)),
            // Pass along featured workout info for tracking
            ...(featuredWorkoutId && { featuredWorkoutId }),
            ...(featuredWorkoutTitle && { featuredWorkoutTitle }),
          }
        });
      } else {
        // Session complete - navigate to create-post with workout stats
        console.log('🎉 Session complete! Preparing workout stats...');
        
        try {
          const sessionWorkouts = JSON.parse(sessionWorkoutsParam);
          
          // Get the first workout for mood category info
          const firstWorkout = sessionWorkouts[0];
          const overallMoodCategory = firstWorkout?.workoutType || firstWorkout?.moodCard || 'Workout';
          
          // Prepare workout completion data with FULL workout details for replication
          const completedWorkouts = sessionWorkouts.map((workout: any) => {
            // Handle moodTips - could be string or array
            let parsedMoodTips = workout.moodTips || [];
            if (typeof parsedMoodTips === 'string') {
              try {
                parsedMoodTips = JSON.parse(parsedMoodTips);
              } catch (e) {
                parsedMoodTips = [];
              }
            }
            
            return {
              workoutTitle: workout.workoutName || workout.name,
              workoutName: workout.workoutName || workout.name,
              equipment: workout.equipment,
              duration: workout.duration,
              difficulty: workout.difficulty,
              // Include full workout data for replication feature
              moodCategory: workout.workoutType || workout.moodCard || overallMoodCategory,
              imageUrl: workout.imageUrl || '',
              description: workout.description || '',
              battlePlan: workout.battlePlan || '',
              intensityReason: workout.intensityReason || '',
              moodTips: parsedMoodTips,
            };
          });

          const totalDuration = sessionWorkouts.reduce((total: number, workout: any) => {
            const duration = parseInt(workout.duration.split(' ')[0]) || 0;
            return total + duration;
          }, 0);

          const completedAt = new Date().toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          });

          // Create workout snapshot for persistent access (Try this workout feature)
          let workoutSnapshotId: string | null = null;
          if (token) {
            try {
              console.log('📸 Creating workout snapshot for Try this workout feature...');
              const snapshotResponse = await fetch(`${API_URL}/api/workout-snapshots`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  workouts: completedWorkouts,
                  total_duration: totalDuration,
                  mood_category: overallMoodCategory,
                }),
              });
              
              if (snapshotResponse.ok) {
                const snapshotData = await snapshotResponse.json();
                workoutSnapshotId = snapshotData.id;
                console.log('✅ Workout snapshot created:', workoutSnapshotId);
              } else {
                console.error('❌ Failed to create workout snapshot:', await snapshotResponse.text());
              }
            } catch (error) {
              console.error('❌ Error creating workout snapshot:', error);
            }
          }

          const workoutStatsData = {
            workouts: completedWorkouts,
            totalDuration,
            completedAt,
            moodCategory: overallMoodCategory, // Include top-level mood category
            workoutSnapshotId, // Include snapshot ID for "Try this workout" feature
          };

          console.log('Workout stats prepared:', workoutStatsData);
          console.log('📋 Snapshot ID:', workoutSnapshotId);
          
          // Track workout completion analytics
          if (token) {
            // Check if this is a featured workout
            const featuredWorkoutId = params.featuredWorkoutId as string;
            const featuredWorkoutTitle = params.featuredWorkoutTitle as string;
            
            if (featuredWorkoutId) {
              // Track featured workout completion
              Analytics.featuredWorkoutCompleted(token, {
                workout_id: featuredWorkoutId,
                workout_title: featuredWorkoutTitle || 'Unknown',
                mood_category: overallMoodCategory,
                exercises_completed: sessionWorkouts.length,
                duration_minutes: totalDuration,
              });
              console.log('📊 Tracked featured workout completed:', featuredWorkoutId);
            }
            
            // Track general workout completion — include the snapshot ID
            // so the Live Feed can deep-link from this user's completion
            // card straight into the viewer's hydrated cart.
            Analytics.workoutCompleted(token, {
              mood_category: overallMoodCategory,
              difficulty: firstWorkout?.difficulty,
              equipment: firstWorkout?.equipment,
              duration_minutes: totalDuration,
              exercises_completed: sessionWorkouts.length,
              workout_snapshot_id: workoutSnapshotId || undefined,
            });
            
            // Track workout session completed with elapsed time
            Analytics.workoutSessionCompleted(token, {
              workout_name: firstWorkout?.workoutName || firstWorkout?.name || 'Unknown',
              equipment: firstWorkout?.equipment,
              difficulty: firstWorkout?.difficulty,
              mood_category: overallMoodCategory,
              duration_seconds: elapsedTime,
              source: featuredWorkoutId ? 'featured' : 'custom',
            });
            console.log('📊 Tracked workout session completed');
          } else {
            // Track for guest users
            GuestAnalytics.workoutSessionCompleted({
              workout_name: firstWorkout?.workoutName || firstWorkout?.name || 'Unknown',
              equipment: firstWorkout?.equipment,
              difficulty: firstWorkout?.difficulty,
              mood_category: overallMoodCategory,
              duration_seconds: elapsedTime,
              source: params.featuredWorkoutId ? 'featured' : 'custom',
            });
            console.log('📊 Tracked guest workout session completed');
          }
          
          console.log('🧹 Clearing cart...');
          clearCart();
          
          console.log('📱 Navigating to create-post...');
          router.push({
            pathname: '/create-post',
            params: {
              workoutStats: JSON.stringify(workoutStatsData)
            }
          });
        } catch (error) {
          console.error('Error preparing workout stats:', error);
          // Fallback to home if there's an error
          clearCart();
          router.push('/(tabs)');
        }
      }
    } else {
      // Single workout - save to profile and navigate back
      console.log('🔙 Single workout completed, saving to profile...');

      const totalDurationMins = parseInt(duration.split(' ')[0]) || 0;

      // Create a workout snapshot so this single workout can be
      // replicated from the Live Feed "Try this workout" deep link.
      // Mirrors the multi-workout session path at line ~562 — without
      // this, single-workout paths (e.g. "I'm feeling lazy" → body
      // part → one workout) leave their Live Feed cards with no
      // snapshot to hydrate, forcing the viewer back to mood selection.
      let workoutSnapshotId: string | null = null;
      if (token) {
        const singleCompletedWorkout = {
          workoutTitle: workoutName,
          workoutName: workoutName,
          equipment: equipment,
          duration: duration,
          difficulty: difficulty,
          moodCategory: workoutType || moodCard || 'Workout',
          imageUrl: imageUrl || '',
          description: description || '',
          battlePlan: battlePlan || '',
          intensityReason: intensityReason || '',
          moodTips: Array.isArray(moodTips) ? moodTips : [],
        };
        try {
          console.log('📸 Creating workout snapshot (single-workout path)...');
          const snapshotResponse = await fetch(`${API_URL}/api/workout-snapshots`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              workouts: [singleCompletedWorkout],
              total_duration: totalDurationMins,
              mood_category: workoutType || moodCard || 'Workout',
            }),
          });
          if (snapshotResponse.ok) {
            const snapshotData = await snapshotResponse.json();
            workoutSnapshotId = snapshotData.id;
            console.log('✅ Single-workout snapshot created:', workoutSnapshotId);
          } else {
            console.error('❌ Failed to create single-workout snapshot:', await snapshotResponse.text());
          }
        } catch (err) {
          console.error('❌ Error creating single-workout snapshot:', err);
        }
      }

      // Track single workout completion (now with snapshot_id so the
      // Live Feed entry can deep-link into a hydrated cart).
      if (token) {
        Analytics.workoutCompleted(token, {
          mood_category: workoutType || 'Unknown',
          difficulty: difficulty,
          equipment: equipment,
          duration_minutes: totalDurationMins,
          exercises_completed: 1,
          workout_snapshot_id: workoutSnapshotId || undefined,
        });
        console.log('📊 Tracked single workout completed', workoutSnapshotId ? `(snap ${workoutSnapshotId})` : '(no snap)');
      }

      // Prepare workout data for saving
      const completedWorkout = {
        workoutTitle: workoutName,
        workoutName: workoutName,
        equipment: equipment,
        duration: duration,
        difficulty: difficulty,
      };

      const totalDuration = totalDurationMins;
      const completedAt = new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      
      // Save workout card to profile
      const saved = await saveWorkoutCard([completedWorkout], totalDuration, completedAt);
      
      if (saved) {
        console.log('✅ Workout saved to profile');
        showToast('Workout saved to your profile!');
        // Wait for toast to be visible before navigating
        setTimeout(() => {
          router.back();
        }, 2500);
      } else {
        console.log('⚠️  Failed to save workout, but navigating back');
        router.back();
      }
    }
  };
  
  const handleGoBack = () => {
    if (isRunning) {
      Alert.alert(
        'Workout in Progress',
        'Are you sure you want to go back? Your progress will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go Back', style: 'destructive', onPress: () => router.back() }
        ]
      );
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header - Simple */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Ionicons name="chevron-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            {isSession ? "Workout Session" : 'Workout Guidance'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isSession 
              ? `${currentSessionIndex + 1} of ${sessionWorkouts.length} • ${displayWorkoutType}`
              : displayWorkoutType
            }
          </Text>
        </View>
        <HomeButton />
      </View>

      {/* Progress Bar — in-session uses exercise-tracking bar; preview keeps the original 4-step metadata bar. */}
      {isSession && sessionWorkouts.length > 0 ? (
        <InSessionProgressBar
          exercises={sessionWorkouts}
          currentIndex={currentSessionIndex}
          workoutTitle={(params.featuredWorkoutTitle as string) || displayWorkoutType}
        />
      ) : (
      <View style={styles.extendedProgressContainer}>
        <View style={styles.extendedProgressContent}>
          {/* Step 1: Mood Card */}
          <View style={styles.progressStep}>
            <View style={styles.progressStepActive}>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.progressStepGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="flame" size={12} color='#0c0c0c' />
              </LinearGradient>
            </View>
            <Text style={styles.progressStepText} numberOfLines={2}>{moodTitle}</Text>
          </View>
          
          <View style={styles.progressConnector} />
          
          {/* Step 2: Workout/Training Type */}
          <View style={styles.progressStep}>
            <View style={styles.progressStepActive}>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.progressStepGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons 
                  name={workoutType === 'Body Weight' ? 'body' : workoutType === 'Weight Based' ? 'barbell' : 'heart'} 
                  size={12} 
                  color='#0c0c0c' 
                />
              </LinearGradient>
            </View>
            <Text style={styles.progressStepText} numberOfLines={2}>{displayWorkoutType}</Text>
          </View>
          
          <View style={styles.progressConnector} />
          
          {/* Step 3: Equipment */}
          <View style={styles.progressStep}>
            <View style={styles.progressStepActive}>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.progressStepGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="fitness" size={12} color='#0c0c0c' />
              </LinearGradient>
            </View>
            <Text style={styles.progressStepText} numberOfLines={2}>{equipment}</Text>
          </View>
          
          <View style={styles.progressConnector} />
          
          {/* Step 4: Intensity */}
          <View style={styles.progressStep}>
            <View style={styles.progressStepActive}>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.progressStepGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="checkmark" size={12} color='#0c0c0c' />
              </LinearGradient>
            </View>
            <Text style={styles.progressStepText} numberOfLines={2}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </Text>
          </View>
        </View>
      </View>
      )}

      {/* Timer Section - Compact */}
      <View style={styles.timerContainer}>
        <View style={styles.timerRow}>
          <Text style={styles.timerLabel}>Timer:</Text>
          <Text style={styles.timerDisplay}>{formatTime(elapsedTime)}</Text>
          <TouchableOpacity 
            style={styles.timerButton}
            onPress={handleStartPauseTimer}
            activeOpacity={0.8}
          >
            <View style={styles.timerButtonCharcoal}>
              <Ionicons 
                name={!isRunning ? "play" : isPaused ? "play" : "pause"} 
                size={16} 
                color="#ffffff" 
              />
              <Text style={styles.timerButtonTextCharcoal}>
                {!isRunning ? "Start" : isPaused ? "Resume" : "Pause"}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.resetButtonCharcoal}
            onPress={handleResetTimer}
            activeOpacity={0.8}
          >
            <View style={styles.resetButtonInner}>
              <Ionicons name="refresh" size={16} color='#ffffff' />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Workout Instructions - Simplified */}
        <View style={styles.instructionsContainer}>
          <View style={styles.workoutCard}>
            {/* Centered Workout Title with Custom Badge */}
            <View style={styles.workoutTitleRow}>
              <Text style={styles.centeredWorkoutTitle}>{workoutName}</Text>
              {workoutType === 'Custom' && (
                <View style={styles.customBadgeGuidance}>
                  <Text style={styles.customBadgeGuidanceText}>Custom</Text>
                </View>
              )}
            </View>
            
            {/* Step-by-Step Instructions - User Friendly Format */}
            <View style={styles.stepsContainer}>
              <Text style={styles.stepsHeader}>Battle Plan</Text>
              <View style={styles.stepsList}>
                {(() => {
                  // Use battlePlan for workout instructions, fallback to description for backward compatibility
                  const workoutInstructions = battlePlan || description;
                  const workoutSteps = parseWorkoutDescription(workoutInstructions);
                  return workoutSteps;
                })().map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    {step.startsWith('•') ? (
                      // Step already has bullet - use StepTextWithLinks for RPE/SPM linking
                      <StepTextWithLinks step={step} style={styles.stepText} />
                    ) : (
                      // Step doesn't have bullet - it's an instruction, use StepTextWithLinks
                      <StepTextWithLinks step={step} style={styles.stepTextNoBullet} />
                    )}
                  </View>
                ))}
              </View>
              
              {/* Exercise Lookup Trigger */}
              <ExerciseLookupTrigger onPress={() => setExerciseLookupVisible(true)} />
            </View>
          </View>
        </View>

        {/* MOOD Tips Section - Enhanced (Hidden for Custom workouts) */}
        {moodTips && moodTips.length > 0 && workoutType !== 'Custom' && (
        <View style={styles.moodTipsContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="bulb" size={24} color='#FFD700' />
            </View>
            <Text style={styles.sectionTitle}>MOOD Tips</Text>
            <View style={styles.headerAccent} />
          </View>
          
          <View style={styles.tipsGrid}>
            {moodTips.map((tip, index) => (
              <View key={index} style={styles.tipCard}>
                <View style={styles.tipCardHeader}>
                  <View style={styles.tipIconContainer}>
                    <Ionicons name={(tip.icon as any) || 'fitness'} size={20} color="#FFD700" />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                  <TextWithTermLinks 
                    text={tip.description} 
                    baseStyle={styles.tipDescription}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
        )}

        {/* Enhanced Workout Details - Always Show */}
        <View style={styles.moodTipsContainer}>
          <View style={styles.workoutDetailsBlock}>
            <View style={styles.detailsHeader}>
              <Ionicons name="clipboard" size={20} color="#FFD700" />
              <Text style={styles.detailsTitle}>Workout Details</Text>
            </View>
            
            <View style={styles.detailsGrid}>
              <View style={styles.detailCard}>
                <Ionicons name="time" size={24} color="#FFD700" />
                <Text style={styles.detailValue}>{duration}</Text>
                <Text style={styles.detailLabel}>Duration</Text>
              </View>
              
              <View style={styles.detailCard}>
                <Ionicons name="speedometer" size={24} color='#FFD700' />
                <Text style={styles.detailValueSmall}>
                  {difficulty.toLowerCase() === 'intermediate' ? 'Intermed.' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </Text>
                <Text style={styles.detailLabel}>Intensity</Text>
              </View>
              
              <View style={styles.detailCard}>
                <Ionicons name="fitness" size={24} color="#FFD700" />
                <Text style={styles.detailValue}>{equipment}</Text>
                <Text style={styles.detailLabel}>Equipment</Text>
              </View>
            </View>
            
            {/* Workout Preparation Section */}
            <View style={styles.preparationSection}>
              <View style={styles.preparationHeader}>
                <Ionicons name="checkmark-circle" size={18} color="#FFD700" />
                <Text style={styles.preparationTitle}>Before You Begin</Text>
              </View>
              <View style={styles.preparationList}>
                <View style={styles.preparationItem}>
                  <Ionicons name="water" size={16} color="#FFD700" />
                  <Text style={styles.preparationText}>Ensure you have water nearby for hydration</Text>
                </View>
                <View style={styles.preparationItem}>
                  <Ionicons name="body" size={16} color="#FFD700" />
                  <Text style={styles.preparationText}>Start with light warm-up movements</Text>
                </View>
                <View style={styles.preparationItem}>
                  <Ionicons name="timer" size={16} color='#FFD700' />
                  <Text style={styles.preparationText}>Focus on proper form over speed</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Button - Fixed at Bottom */}
      <View style={styles.completedButtonContainer}>
        {isSession ? (
          // Session mode: Show Next Workout / Finish and share!
          <TouchableOpacity 
            style={styles.completedButton}
            onPress={handleCompletedWorkout}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.completedButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="checkmark-circle" size={24} color="#0c0c0c" />
              <Text style={styles.completedButtonText}>
                {currentSessionIndex < sessionWorkouts.length - 1 
                  ? "Next Workout" 
                  : "Finish and share!"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          // Preview mode: Show Add workout / Added button
          <Animated.View style={{ transform: [{ scale: addButtonScaleAnim }] }}>
            <TouchableOpacity 
              style={[
                styles.addWorkoutButton,
                isWorkoutInCart && styles.addWorkoutButtonAdded
              ]}
              onPress={handleAddWorkoutToCart}
              activeOpacity={0.8}
              disabled={isWorkoutInCart}
            >
              <Ionicons 
                name={isWorkoutInCart ? "checkmark" : "add"} 
                size={18} 
                color='#FFD700' 
              />
              <Text style={styles.addWorkoutButtonText}>
                {isWorkoutInCart ? 'Added' : 'Add workout'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
      
      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
        type='success'
      />
      
      {/* Exercise Lookup Bottom Sheet */}
      <ExerciseLookupSheet
        visible={exerciseLookupVisible}
        onClose={() => setExerciseLookupVisible(false)}
      />
    </SafeAreaView>
  );
}

const getDifficultyColor = (level: string) => {
  return '#FFD700'; // Same neon gold for all difficulty levels
};

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
  headerSpacer: {
    width: 40,
  },
  extendedProgressContainer: {
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  extendedProgressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    flexWrap: 'nowrap',
  },
  progressStep: {
    alignItems: 'center',
    minWidth: 60,
    maxWidth: 80,
  },
  progressStepActive: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: 'hidden',
    marginBottom: 3,
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
    maxWidth: 75,
    numberOfLines: 2,
  },
  progressConnector: {
    width: 16,
    height: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    marginHorizontal: 4,
    marginTop: 12,
  },
  timerContainer: {
    backgroundColor: '#111111',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  timerLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  timerDisplay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'center',
  },
  timerButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  timerButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
    justifyContent: 'center',
  },
  timerButtonCharcoal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    justifyContent: 'center',
    backgroundColor: '#333333',
    borderRadius: 8,
  },
  timerButtonTextCharcoal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  resetButtonCharcoal: {
    borderRadius: 8,
    overflow: 'hidden',
    minWidth: 44,
    height: 40,
  },
  resetButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4a4a4a',
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  resetButton: {
    borderRadius: 8,
    overflow: 'hidden',
    width: 36,
    height: 36,
  },
  resetButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#FFD700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  timerStatus: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
  scrollView: {
    flex: 1,
  },
  instructionsContainer: {
    padding: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 215, 0, 0.3)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  headerAccent: {
    width: 4,
    height: 40,
    backgroundColor: '#FFD700',
    borderRadius: 2,
  },
  workoutCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  workoutTitleSection: {
    flex: 1,
    marginRight: 16,
  },
  workoutTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  equipmentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  equipmentText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  workoutMeta: {
    alignItems: 'flex-end',
    gap: 12,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  workoutDuration: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  descriptionContainer: {
    marginTop: 16,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  workoutDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 24,
  },
  moodTipsContainer: {
    padding: 24,
    paddingTop: 0,
  },
  tipsGrid: {
    gap: 16,
  },
  tipCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  tipCardHeader: {
    marginRight: 12,
  },
  tipIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipNumber: {
    display: 'none', // Hide tip numbers for minimal design
  },
  tipNumberText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    flex: 1,
  },
  tipAccentLine: {
    display: 'none', // Hide accent lines for minimal design
  },
  workoutDetailsBlock: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8, // Reduced from 16 to 8 to prevent overflow
    paddingHorizontal: 4, // Added small horizontal padding to container
  },
  detailCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    minWidth: 85,
    maxWidth: '32%',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 6,
    marginBottom: 2,
    textAlign: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
    textAlign: 'center',
  },
  preparationSection: {
    marginTop: 16,
  },
  preparationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  preparationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  preparationList: {
    gap: 8,
  },
  preparationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  preparationText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    flex: 1,
  },
  // New styles for simplified workout instructions
  centeredWorkoutTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  workoutTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  customBadgeGuidance: {
    backgroundColor: '#4a4a4a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  customBadgeGuidanceText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepsContainer: {
    marginTop: 8,
  },
  stepsHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  bulletPoint: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  bulletText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  detailValueSmall: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 6,
    marginBottom: 2,
    paddingHorizontal: 2,
    textAlign: 'center',
    lineHeight: 16,
    flexShrink: 1,
  },
  stepText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
    flex: 1,
  },
  stepTextNoBullet: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    flex: 1,
    fontWeight: '600', // Make instructions slightly bolder
  },
  bandPlacementText: {
    fontSize: 15, // 1pt smaller than regular stepText (16pt)
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.7)', // Slightly muted color for band placement
    lineHeight: 22,
  },
  // Completed workout button styles
  completedButtonContainer: {
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 215, 0, 0.2)',
  },
  completedButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  completedButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  completedButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c0c0c',
  },
  addWorkoutButton: {
    height: 40,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  addWorkoutButtonAdded: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  addWorkoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});