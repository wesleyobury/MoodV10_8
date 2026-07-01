import React, { useState, useEffect, useRef } from 'react';
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
import { useDrafts } from '../contexts/DraftsContext';
import { useHealth } from '../contexts/HealthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Analytics } from '../utils/analytics';
import { recordWorkoutCompletionForRating } from '../utils/ratingPrompt';
import { API_URL } from '../utils/apiConfig';
import {
  subscribeHeartRateStream,
  fetchSessionMetrics,
  type LiveHeartRateSample,
} from '../modules/mood-healthkit/src';
import {
  computeHeartRateStats,
} from '../utils/heartRateZones';
import {
  appendSession,
  loadUserAge,
  type WorkoutSession as PersistedSession,
} from '../utils/workoutSessionStorage';
import ExerciseLookupSheet from '../components/ExerciseLookupSheet';
import ExerciseLookupTrigger from '../components/ExerciseLookupTrigger';
import OnboardingOverlay, { type TargetRect } from '../components/OnboardingOverlay';
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
  const { token, refreshEntitlement } = useAuth();
  const { markCompleted } = useDrafts();
  const { status: healthStatus } = useHealth();
  const { recordStartFreeWorkout, hasUsedFreeSession } = useSubscription();

  // Live heart-rate streaming. Samples accumulate in a ref so the updateHandler
  // doesn't blow up re-renders during long sessions; the stream is started
  // once on mount and torn down on unmount or session end.
  const hrSamplesRef = useRef<LiveHeartRateSample[]>([]);
  const hrSubRef = useRef<{ remove: () => Promise<void> } | null>(null);
  const sessionStartRef = useRef<string>(new Date().toISOString());
  const [showNoWatchToast, setShowNoWatchToast] = useState(false);
  
  const [sessionWorkouts, setSessionWorkouts] = useState<SessionWorkout[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [exerciseLookupVisible, setExerciseLookupVisible] = useState(false);

  // Onboarding Tip 2 — uses OnboardingOverlay (same format as Tip 3) with a
  // single target pointing to the "Find visuals" search bar. AsyncStorage
  // flag persists "Don't show again"; otherwise the tip re-fires on each entry.
  const [formTipActive, setFormTipActive] = useState(false);
  const formTipTriggeredRef = React.useRef(false);
  const searchBarRef = React.useRef<View>(null);
  const [searchBarRect, setSearchBarRect] = useState<TargetRect | null>(null);

  // Trigger Tip 2 1.5s after the screen mounts — fires on every fresh entry
  // unless the user pressed "Don't show again" in any prior session.
  useEffect(() => {
    if (formTipTriggeredRef.current) return;
    let cancelled = false;
    let timer: any = null;
    (async () => {
      let never: string | null = null;
      try {
        never = await AsyncStorage.getItem(TIP_FORM_VIDEOS_DISMISSED_KEY);
      } catch {
        never = null;
      }
      if (cancelled) return;
      if (never === '1') return;
      timer = setTimeout(() => {
        if (formTipTriggeredRef.current || cancelled) return;
        // Measure search bar position so the overlay arrow points to it
        searchBarRef.current?.measureInWindow((x, y, w, h) => {
          if (cancelled) return;
          setSearchBarRect({ x, y, w, h });
        });
        formTipTriggeredRef.current = true;
        setFormTipActive(true);
      }, 1500);
    })();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleFormTipTap = () => {
    setFormTipActive(false);
    setExerciseLookupVisible(true);
  };
  const handleFormTipNeverShow = async () => {
    setFormTipActive(false);
    try {
      await AsyncStorage.setItem(TIP_FORM_VIDEOS_DISMISSED_KEY, '1');
    } catch {
      // best-effort
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Live heart-rate stream lifecycle.
  // Starts once when the session screen mounts (subject to permission).
  // Stops on unmount AND in handleFinishSession (whichever fires first).
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (healthStatus !== 'determined') return;
    let cancelled = false;
    sessionStartRef.current = new Date().toISOString();
    hrSamplesRef.current = [];

    if (token) {
      Analytics.workoutSessionStarted(token, {
        started_at: sessionStartRef.current,
      });
    }

    (async () => {
      const sub = await subscribeHeartRateStream((sample) => {
        hrSamplesRef.current.push(sample);
      });
      if (cancelled) {
        sub.remove().catch(() => {});
        return;
      }
      hrSubRef.current = sub;
    })();

    const watchTimer = setTimeout(() => {
      if (hrSamplesRef.current.length === 0) {
        setShowNoWatchToast(true);
      }
    }, 30_000);

    return () => {
      cancelled = true;
      clearTimeout(watchTimer);
      if (hrSubRef.current) {
        hrSubRef.current.remove().catch(() => {});
        hrSubRef.current = null;
      }
    };
  }, [healthStatus, token]);

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

  // ─────────────────────────────────────────────────────────────────
  // Live heart-rate stream lifecycle.
  // Starts once when the session screen mounts (subject to permission).
  // Stops on unmount AND in handleFinishSession (whichever fires first).
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (healthStatus !== 'determined') return;
    let cancelled = false;
    sessionStartRef.current = new Date().toISOString();
    hrSamplesRef.current = [];

    if (token) {
      Analytics.workoutSessionStarted(token, {
        started_at: sessionStartRef.current,
      });
    }

    (async () => {
      const sub = await subscribeHeartRateStream((sample) => {
        hrSamplesRef.current.push(sample);
        // Throttled state update so the screen can show a live count without
        // re-rendering on every single sample (cheap enough at 5s cadence,
        // but keeps the door open for higher-frequency sources later).
        setHrSampleCount(hrSamplesRef.current.length);
      });
      if (cancelled) {
        sub.remove().catch(() => {});
        return;
      }
      hrSubRef.current = sub;
    })();

    // Apple Watch detection — if zero samples land in the first 30s after a
    // permission-granted start, gently nudge the user. Don't block anything.
    const watchTimer = setTimeout(() => {
      if (hrSamplesRef.current.length === 0) {
        setShowNoWatchToast(true);
      }
    }, 30_000);

    return () => {
      cancelled = true;
      clearTimeout(watchTimer);
      if (hrSubRef.current) {
        hrSubRef.current.remove().catch(() => {});
        hrSubRef.current = null;
      }
    };
  }, [healthStatus, token]);

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
      
      // Also track general workout completion. The snapshot ID is
      // included so the Live Feed can deep-link from the completion card
      // into a hydrated cart (Try-this-workout from the Live tab).
      Analytics.workoutCompleted(token, {
        mood_category: firstWorkout.workoutType || 'Unknown',
        difficulty: firstWorkout.difficulty,
        equipment: firstWorkout.equipment,
        duration_minutes: totalDuration,
        exercises_completed: sessionWorkouts.length,
        workout_snapshot_id: workoutSnapshotId || undefined,
      });
    }

    // Rating prompt — increment the persistent completed-workout counter for
    // ALL users (independent of subscription/server free-workout state). The
    // in-app rating pre-prompt fires off this count at the post-achievement
    // moment in create-post.tsx (3rd completed workout). Awaited so the count
    // is durable before the achievement screen can read it.
    try {
      await recordWorkoutCompletionForRating();
    } catch {
      /* never block session finish on the rating counter */
    }

    // Spec §11 — gate Pulse Sync on "is this their first ever completed
    // workout?" The `hasUsedFreeSession` flag is still false at this point
    // (we flip it on the line below) so it doubles as a "no workouts ever
    // before this one" signal for the cold-start case. A separate one-shot
    // `@mood_pulse_sync_played_v1` flag (written inside the screen itself)
    // prevents replay even if hasUsedFreeSession is somehow reset.
    const isFirstWorkout = !hasUsedFreeSession;
    let pulseSyncEligible = false;
    if (isFirstWorkout) {
      try {
        const pulseAlreadyPlayed = await AsyncStorage.getItem('@mood_pulse_sync_played_v1');
        pulseSyncEligible = pulseAlreadyPlayed !== 'true';
      } catch {
        pulseSyncEligible = true;
      }
    }

    // Spec §3 Stage 3 — consume the free session on COMPLETION (not start).
    // Idempotent setter: only flips `hasUsedFreeSession=true` for non-
    // subscribers, and only writes once. On workout #2 attempt, the
    // `canStartWorkout` check in workout-guidance.tsx will be false and
    // trigger `start_workout_after_free_session` paywall.
    recordStartFreeWorkout();

    // Clear cart
    clearCart();
    console.log('Cart cleared');

    // Mark saved-build draft as completed (fire-and-forget)
    markCompleted().catch(() => {});

    // ─────────── Stop live HR stream + persist session ───────────
    if (hrSubRef.current) {
      hrSubRef.current.remove().catch(() => {});
      hrSubRef.current = null;
    }
    const samples = [...hrSamplesRef.current];
    const endedAt = new Date().toISOString();
    let recapStats: { avg: number; peak: number } | undefined;
    let recapBpmSeries: number[] | undefined;
    if (samples.length > 0) {
      const userAge = (await loadUserAge()) ?? 30; // Default age 30 if not set in Settings
      const stats = computeHeartRateStats(samples, userAge);
      const persisted: PersistedSession = {
        id: `${sessionStartRef.current}-${endedAt}`,
        startedAt: sessionStartRef.current,
        endedAt,
        workoutType: moodCategory,
        heartRateSamples: samples,
        stats,
      };
      appendSession(persisted).catch(() => {});
      if (stats) {
        recapStats = { avg: stats.avgHR, peak: stats.maxHR };
        recapBpmSeries = samples.map((s) => s.bpm).filter((b) => Number.isFinite(b) && b > 0);
      }
    }

    // ─────────── Capture session-window HealthKit aggregates ───────────
    // Pulls activeEnergy / steps / HRV recorded between session start & end.
    // Fails silently on Android / no-permission / no-data; we just won't
    // populate the wearable fields on the user_workouts log in that case.
    let sessionMetrics: Awaited<ReturnType<typeof fetchSessionMetrics>> = null;
    try {
      sessionMetrics = await fetchSessionMetrics(sessionStartRef.current, endedAt);
    } catch {
      sessionMetrics = null;
    }
    const sessionCaloriesBurned: number | null =
      sessionMetrics?.activeEnergyKcal != null
        ? Math.round(sessionMetrics.activeEnergyKcal)
        : null;
    const sessionSteps: number | null =
      sessionMetrics?.stepCount != null ? Math.round(sessionMetrics.stepCount) : null;
    const sessionHrvSdnn: number | null =
      sessionMetrics?.heartRateVariabilitySDNN != null
        ? sessionMetrics.heartRateVariabilitySDNN
        : null;

    if (token) {
      Analytics.workoutSessionEnded(token, {
        ended_at: endedAt,
        samples_captured: samples.length,
      });
      Analytics.hrSamplesCapturedCount(token, { count: samples.length });

      // ─── Persist session-actual metrics to user_workouts ───
      // Writes a single row per completed session. The home-summary endpoint
      // reads `calories_burned` from here for the "Last workout" calories tile.
      // workout_id uses the snapshot id when present (best long-term link),
      // otherwise a synthesized session id.
      const workoutIdForLog =
        workoutSnapshotId || `session-${sessionStartRef.current}`;
      try {
        await fetch(`${API_URL}/api/user-workouts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workout_id: workoutIdForLog,
            completed_at: endedAt,
            duration_actual: totalDuration,
            mood_before: moodCategory,
            mood_after: moodCategory,
            calories_burned: sessionCaloriesBurned,
            avg_heart_rate: recapStats?.avg ?? null,
            max_heart_rate: recapStats?.peak ?? null,
            hr_samples_count: samples.length || null,
            session_steps: sessionSteps,
            session_hrv_sdnn: sessionHrvSdnn,
          }),
        });
        console.log('✅ user-workouts logged with session-actual metrics');
        // Phase 4.3 — the server increments free_workouts_used on this POST
        // for non-entitled users. Refresh entitlement so the client mirror
        // (free_workouts_remaining → Hard Paywall #3) is accurate immediately.
        refreshEntitlement().catch(() => {});
      } catch (e) {
        console.log('⚠️ Failed to log user-workouts:', e);
      }
    }

    // Spec §11 — if this is the user's first completed workout AND the
    // Pulse Sync magic-moment hasn't played yet, hop through `/pulse-sync`
    // BEFORE the achievement screen. The Pulse Sync screen forwards all
    // create-post params through, plays the 2.5–3s animation + haptic
    // (or static fallback on reduce-motion), and then `router.replace`s
    // to `/create-post` itself. For all subsequent workouts we skip
    // straight to `/create-post`.
    const navParams = {
      workoutStats: JSON.stringify(workoutStatsData),
      heartRateSeries: recapBpmSeries ? JSON.stringify(recapBpmSeries) : '',
      heartRateAvg: recapStats ? String(recapStats.avg) : '',
      heartRatePeak: recapStats ? String(recapStats.peak) : '',
      sessionCalories: sessionCaloriesBurned != null ? String(sessionCaloriesBurned) : '',
      sessionSteps: sessionSteps != null ? String(sessionSteps) : '',
      sessionHrv: sessionHrvSdnn != null ? String(Math.round(sessionHrvSdnn)) : '',
      // Session window — lets the achievement screen re-query HealthKit (resync)
      // and show the real elapsed time instead of the planned estimate.
      startedAt: sessionStartRef.current,
      endedAt,
    };

    if (pulseSyncEligible) {
      console.log('🎉 First workout — routing through Pulse Sync');
      const hasWearableData = !!(
        recapStats || sessionCaloriesBurned != null || sessionSteps != null || sessionHrvSdnn != null
      );
      router.push({
        // `as any` suppresses Expo Router's typed-routes complaint until the
        // `.expo/types/router.d.ts` regenerates on the next Metro restart
        // (the file is autogenerated from the `app/` tree).
        pathname: '/pulse-sync' as any,
        params: {
          ...navParams,
          hasWearableData: String(hasWearableData),
          hrAvg: recapStats ? String(recapStats.avg) : '',
          hrv: sessionHrvSdnn != null ? String(Math.round(sessionHrvSdnn)) : '',
        },
      });
      console.log('Pulse Sync navigation sent');
      return;
    }

    // Navigate to create-post with workout stats + (optional) HR data
    console.log('Navigating to create-post...');
    router.push({
      pathname: '/create-post',
      params: navParams,
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
            
            {/* Exercise Lookup Trigger — ref'd for Tip 2 overlay positioning */}
            <View ref={searchBarRef} collapsable={false}>
              <ExerciseLookupTrigger
                onPress={() => {
                  if (formTipActive) {
                    setFormTipActive(false);
                  }
                  setExerciseLookupVisible(true);
                }}
              />
            </View>
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

      {/* Onboarding Tip 2 — full-screen overlay (same format as Tip 3) */}
      <OnboardingOverlay
        visible={formTipActive && !!searchBarRect}
        onTapAnywhere={handleFormTipTap}
        onNeverShow={handleFormTipNeverShow}
        targets={[
          {
            rect: searchBarRect,
            placement: 'below',
            icon: 'play-circle-outline',
            title: 'Need a form check?',
            body: 'Tap the visual cues search above to open video tutorials for every exercise.',
          },
        ]}
      />

      {/* Apple Watch nudge — fires once if no HR sample lands in the first 30s
          after a permission-granted session start. Non-blocking. */}
      <Toast
        message="Wear your Apple Watch to track heart rate"
        visible={showNoWatchToast}
        onHide={() => setShowNoWatchToast(false)}
        duration={4000}
        type="info"
      />
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