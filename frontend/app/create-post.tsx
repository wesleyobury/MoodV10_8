import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Modal,
  Dimensions,
  Linking,
  NativeModules,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, router as globalRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Video, ResizeMode } from 'expo-av';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkoutStatsCard from '../components/WorkoutStatsCard';
import { fetchSessionMetrics } from '../modules/mood-healthkit/src';
import { useHealth } from '../contexts/HealthContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Analytics } from '../utils/analytics';
import { maybeRequestReview } from '../utils/ratingPrompt';
import Toast from '../components/Toast';
import ImageCropModal from '../components/ImageCropModal';
import GuestPromptModal from '../components/GuestPromptModal';
import VideoFrameSelector from '../components/VideoFrameSelector';
import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient';
import { useOnboarding } from '../contexts/OnboardingContext';
import OnboardingOverlay from '../components/OnboardingOverlay';

// Safely import native modules that can crash on production iOS builds
let captureRef: any = null;

try {
  captureRef = require('react-native-view-shot').captureRef;
} catch (error) {
  console.warn('react-native-view-shot not available:', error);
}

import { API_URL } from '../utils/apiConfig';
import { navigateToTabsAfterWorkoutComplete } from '../utils/resetRootStack';
const SCREEN_WIDTH = Dimensions.get('window').width;

// Storage keys for persisting user goals
const STORAGE_KEYS = {
  CALORIE_TARGET: '@mood_calorie_target',
  MINUTE_TARGET: '@mood_minute_target',
};

// Helper to detect if a URI is a video
const isVideoUri = (uri: string): boolean => {
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.m4v'];
  const lowerUri = uri.toLowerCase();
  return videoExtensions.some(ext => lowerUri.includes(ext));
};

interface MediaItem {
  uri: string;
  type: 'image' | 'video';
  coverUri?: string;  // Custom cover image for videos
}

interface WorkoutStats {
  workouts: {
    workoutTitle: string;
    workoutName: string;
    equipment: string;
    duration: string;
    difficulty: string;
    moodCategory?: string;
    imageUrl?: string;
    description?: string;
    battlePlan?: string;
    intensityReason?: string;
    moodTips?: { icon: string; title: string; description: string }[];
  }[];
  totalDuration: number;
  completedAt: string;
  moodCategory?: string;
}

export default function CreatePost() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, token, isLoading, isGuest, exitGuestMode } = useAuth();
  const { lastWorkoutMetrics, syncLastWorkout } = useHealth();
  const { hasActiveAccess, hasUsedFreeSession, openPaywall, tryFirePostFirstWorkoutPaywall } = useSubscription();
  const [caption, setCaption] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null);

  // Values pulled by a manual/auto "resync" after the Apple Watch flushes to
  // HealthKit (active energy / steps / HRV can lag the end of a session by
  // 5–60s). Any resynced value wins over the one captured at completion.
  const [resynced, setResynced] = useState<{
    calories?: number; steps?: number; hrv?: number;
    avgHr?: number; maxHr?: number;
  }>({});
  const [isResyncing, setIsResyncing] = useState(false);

  // Optional live heart-rate payload forwarded by workout-session.tsx. When
  // present, the 'heartrate' variant renders these real samples instead of
  // the synthesized fallback curve.
  const heartRateSeries = useMemo<number[] | undefined>(() => {
    const raw = params.heartRateSeries as string | undefined;
    if (!raw) return undefined;
    try {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length >= 2) return arr.map(Number).filter((n) => Number.isFinite(n) && n > 0);
    } catch {
      // ignore
    }
    return undefined;
  }, [params.heartRateSeries]);

  const heartRateRealStats = useMemo<{ avg: number; peak: number } | undefined>(() => {
    const avg = parseInt((params.heartRateAvg as string) || '', 10);
    const peak = parseInt((params.heartRatePeak as string) || '', 10);
    if (Number.isFinite(avg) && Number.isFinite(peak)) return { avg, peak };
    // Retrospective sync — HR pulled from the most recent HKWorkout.
    if (resynced.avgHr != null && resynced.maxHr != null) {
      return { avg: resynced.avgHr, peak: resynced.maxHr };
    }
    return undefined;
  }, [params.heartRateAvg, params.heartRatePeak, resynced.avgHr, resynced.maxHr]);

  // Session window (start → end ISO) forwarded from workout-session — used to
  // re-query HealthKit (resync) and to show the REAL elapsed time.
  const sessionStartISO = (params.startedAt as string) || '';
  const sessionEndISO = (params.endedAt as string) || '';
  const actualMinutes = useMemo<number | undefined>(() => {
    const s = Date.parse(sessionStartISO);
    const e = Date.parse(sessionEndISO);
    if (!Number.isFinite(s) || !Number.isFinite(e) || e <= s) return undefined;
    return Math.max(1, Math.round((e - s) / 60000));
  }, [sessionStartISO, sessionEndISO]);

  // Human-readable session time (e.g. "2:34 PM") — shown with the real-data
  // indicator so the user knows which session the stats are pulled from.
  const sessionLabel = useMemo(() => {
    const e = Date.parse(sessionEndISO);
    if (!Number.isFinite(e)) return '';
    try {
      return new Date(e).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    } catch {
      return '';
    }
  }, [sessionEndISO]);


  // True after a manual sync finished without finding real calories — used to
  // surface the "connect Apple Health" hint only when it's actually relevant.
  const [syncCameUpEmpty, setSyncCameUpEmpty] = useState(false);

  // Session-actual wearable metrics forwarded from workout-session.tsx.
  const sessionCaloriesFromWearable = useMemo<number | undefined>(() => {
    if (resynced.calories != null && resynced.calories > 0) return resynced.calories;
    const n = parseInt((params.sessionCalories as string) || '', 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [resynced.calories, params.sessionCalories]);

  const sessionStepsFromWearable = useMemo<number | undefined>(() => {
    if (resynced.steps != null) return resynced.steps;
    const n = parseInt((params.sessionSteps as string) || '', 10);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  }, [resynced.steps, params.sessionSteps]);

  const sessionHrvFromWearable = useMemo<number | undefined>(() => {
    if (resynced.hrv != null && resynced.hrv > 0) return resynced.hrv;
    const n = parseInt((params.sessionHrv as string) || '', 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }, [resynced.hrv, params.sessionHrv]);
  const [hasStatsCard, setHasStatsCard] = useState(false);
  const [saveButtonPressed, setSaveButtonPressed] = useState(false);
  const statsCardRef = useRef(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  
  // Editable stats
  const [editedDuration, setEditedDuration] = useState<number | undefined>(undefined);
  const [editedCalories, setEditedCalories] = useState<number | undefined>(undefined);

  // Auto-prefill calories from the wearable session value (one-shot). The
  // user can still edit afterward — sessionCaloriesFromWearable seeds the
  // state; subsequent manual edits are respected.
  const caloriesPrefilledRef = useRef(false);
  useEffect(() => {
    if (caloriesPrefilledRef.current) return;
    if (sessionCaloriesFromWearable != null && editedCalories === undefined) {
      setEditedCalories(sessionCaloriesFromWearable);
      caloriesPrefilledRef.current = true;
    }
  }, [sessionCaloriesFromWearable, editedCalories]);

  // Prefill duration with the REAL elapsed time (start → end), not the planned
  // estimate. One-shot; the user can still edit afterward.
  const durationPrefilledRef = useRef(false);
  useEffect(() => {
    if (durationPrefilledRef.current) return;
    if (actualMinutes != null && editedDuration === undefined) {
      setEditedDuration(actualMinutes);
      durationPrefilledRef.current = true;
    }
  }, [actualMinutes, editedDuration]);

  // Label for the workout the resynced numbers came from (fallback case).
  const [lastWorkoutLabel, setLastWorkoutLabel] = useState<string>('');

  // Re-query HealthKit. Prefer the exact session window (most accurate for a
  // just-finished MOOD workout); if that has no active energy, fall back to the
  // user's most recent HKWorkout (e.g. an Apple Watch workout recorded outside
  // MOOD) so past workouts still surface real calories.
  const resync = useCallback(async () => {
    setIsResyncing(true);
    try {
      let cal: number | null = null;
      let steps: number | null = null;
      let hrv: number | null = null;

      if (sessionStartISO && sessionEndISO) {
        const m = await fetchSessionMetrics(sessionStartISO, sessionEndISO);
        if (m) {
          cal = m.activeEnergyKcal;
          steps = m.stepCount;
          hrv = m.heartRateVariabilitySDNN;
        }
      }

      let avgHr: number | null = null;
      let maxHr: number | null = null;

      if (cal == null || cal <= 0) {
        // Shared retrospective sync — result lands in HealthContext so the
        // wearable-data screen and home snapshot update in the same tap.
        const w = await syncLastWorkout();
        if (w) {
          if (w.calories != null) cal = w.calories;
          if (w.minutes != null) setEditedDuration(w.minutes);
          if (w.avgHr != null) avgHr = w.avgHr;
          if (w.maxHr != null) maxHr = w.maxHr;
          if (steps == null) steps = w.steps;
          if (hrv == null) hrv = w.hrv;
          const t = Date.parse(w.endISO);
          if (Number.isFinite(t)) {
            try {
              setLastWorkoutLabel(new Date(t).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }));
            } catch {
              setLastWorkoutLabel('');
            }
          }
        }
      }

      setResynced((prev) => ({
        calories: cal != null ? Math.round(cal) : prev.calories,
        steps: steps != null ? Math.round(steps) : prev.steps,
        hrv: hrv != null ? Math.round(hrv) : prev.hrv,
        avgHr: avgHr != null ? avgHr : prev.avgHr,
        maxHr: maxHr != null ? maxHr : prev.maxHr,
      }));
      if (cal != null && cal > 0) {
        setEditedCalories(Math.round(cal));
        setSyncCameUpEmpty(false);
      } else {
        setSyncCameUpEmpty(true);
      }
    } catch {
      // ignore — the user can tap Resync again
    } finally {
      setIsResyncing(false);
    }
  }, [sessionStartISO, sessionEndISO, syncLastWorkout]);

  // A sync done elsewhere (wearable-data screen) pre-fills this card when the
  // session itself has no wearable data.
  const contextSeededRef = useRef(false);
  useEffect(() => {
    if (contextSeededRef.current) return;
    if (!lastWorkoutMetrics) return;
    if (sessionCaloriesFromWearable != null) return;
    contextSeededRef.current = true;
    setResynced((prev) => ({
      calories: prev.calories ?? lastWorkoutMetrics.calories ?? undefined,
      steps: prev.steps ?? lastWorkoutMetrics.steps ?? undefined,
      hrv: prev.hrv ?? lastWorkoutMetrics.hrv ?? undefined,
      avgHr: prev.avgHr ?? lastWorkoutMetrics.avgHr ?? undefined,
      maxHr: prev.maxHr ?? lastWorkoutMetrics.maxHr ?? undefined,
    }));
    const t = Date.parse(lastWorkoutMetrics.endISO);
    if (Number.isFinite(t)) {
      try {
        setLastWorkoutLabel(new Date(t).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }));
      } catch { /* ignore */ }
    }
  }, [lastWorkoutMetrics, sessionCaloriesFromWearable]);

  // Silent auto-retries so numbers often fill in before the user even taps.
  useEffect(() => {
    if (!sessionStartISO || !sessionEndISO) return;
    if (sessionCaloriesFromWearable != null) return; // already have the laggy metric
    const t1 = setTimeout(resync, 3000);
    const t2 = setTimeout(resync, 10000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [sessionStartISO, sessionEndISO, sessionCaloriesFromWearable, resync]);
  
  // Editable targets for donut rings
  const [calorieTarget, setCalorieTarget] = useState(500);
  const [minuteTarget, setMinuteTarget] = useState(60);
  
  // Equipment toggle for achievement card exercise labels
  // Default OFF so the title is the focus; user can toggle on.
  const [showEquipment, setShowEquipment] = useState(false);

  // Achievement card variant — swipeable between 3 designs on the share screen.
  const CARD_VARIANTS = ['rings', 'simple', 'heartrate'] as const;
  type CardVariant = (typeof CARD_VARIANTS)[number];
  const [cardVariant, setCardVariant] = useState<CardVariant>('rings');
  
  // Permission notice modal state
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionType, setPermissionType] = useState<'camera' | 'library'>('camera');
  
  // Cover photo selection state
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [coverPickerVideoIndex, setCoverPickerVideoIndex] = useState<number>(-1);
  
  // Video frame selector state
  const [showVideoFrameSelector, setShowVideoFrameSelector] = useState(false);
  const [videoForFrameSelection, setVideoForFrameSelection] = useState<{uri: string, index: number} | null>(null);
  
  // Image crop modal state
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<{uri: string, width: number, height: number} | null>(null);
  const [cropSource, setCropSource] = useState<'library' | 'camera'>('library');
  
  // Success animation state (inline button animation like 'Add workout')
  const [cardSaved, setCardSaved] = useState(false);
  const [saveScaleAnim] = useState(new Animated.Value(1));
  
  // Transparent card ref for Instagram export
  const transparentCardRef = useRef(null);
  const [isExportingToInstagram, setIsExportingToInstagram] = useState(false);

  // Instagram hand-off modal state (used by handleShareToInstagram)
  const [igPromptVisible, setIgPromptVisible] = useState(false);
  const igPromptResolveRef = useRef<((value: boolean) => void) | null>(null);

  // Onboarding Tip 3 — completion/share overlay (full-screen)
  const onboarding = useOnboarding();
  const onboardingRef = useRef(onboarding);
  useEffect(() => { onboardingRef.current = onboarding; }, [onboarding]);
  const [completionTipActive, setCompletionTipActive] = useState(false);
  const completionTipTriggeredRef = useRef(false);

  // Refs for measuring target positions so the overlay can align pointers accurately
  const mediaRowRef = useRef<View>(null);
  const editableStatsRowRef = useRef<View>(null);
  const cardContainerRef = useRef<View>(null);
  const igButtonRef = useRef<View>(null);
  const [targetRects, setTargetRects] = useState<{
    media: { x: number; y: number; w: number; h: number } | null;
    stats: { x: number; y: number; w: number; h: number } | null;
    ig: { x: number; y: number; w: number; h: number } | null;
  }>({ media: null, stats: null, ig: null });

  useEffect(() => {
    if (completionTipTriggeredRef.current) return;
    const timer = setTimeout(() => {
      if (completionTipTriggeredRef.current) return;
      const ob = onboardingRef.current;
      if (ob.requestRender('completion_share')) {
        // Measure target positions now that the screen has rendered
        const measure = (ref: React.RefObject<View>, key: 'media' | 'stats' | 'ig') => {
          ref.current?.measureInWindow((x, y, w, h) => {
            setTargetRects((prev) => ({ ...prev, [key]: { x, y, w, h } }));
          });
        };
        measure(mediaRowRef, 'media');
        measure(cardContainerRef, 'stats');
        measure(igButtonRef, 'ig');

        completionTipTriggeredRef.current = true;
        setCompletionTipActive(true);
        ob.trackShown('completion_share');
      }
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const completeCompletionTip = (action: 'tap' | 'dismiss' | 'never') => {
    if (!completionTipActive) return;
    setCompletionTipActive(false);
    if (action === 'tap') onboarding.markCompleted('completion_share');
    else if (action === 'dismiss') onboarding.markDismissed('completion_share');
    else onboarding.markNeverShow('completion_share');
  };
  
  // Saved achievements state
  const [savedAchievements, setSavedAchievements] = useState<any[]>([]);
  const [loadingSavedAchievements, setLoadingSavedAchievements] = useState(false);

  // Legacy support - map selectedImages to selectedMedia
  const selectedImages = selectedMedia.map(m => m.uri);

  // Debug auth state
  useEffect(() => {
    console.log('🔍 Auth state:', { 
      hasToken: !!token, 
      hasUser: !!user, 
      isLoading,
      isGuest,
      tokenLength: token?.length || 0 
    });
  }, [token, user, isLoading, isGuest]);

  // Show guest prompt if guest tries to access this screen
  useEffect(() => {
    if (isGuest) {
      setShowGuestPrompt(true);
    }
  }, [isGuest]);

  // Load saved user goals from AsyncStorage on mount
  useEffect(() => {
    const loadSavedGoals = async () => {
      try {
        const [savedCalorieTarget, savedMinuteTarget] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.CALORIE_TARGET),
          AsyncStorage.getItem(STORAGE_KEYS.MINUTE_TARGET),
        ]);
        
        if (savedCalorieTarget) {
          const calTarget = parseInt(savedCalorieTarget, 10);
          if (!isNaN(calTarget) && calTarget > 0) {
            setCalorieTarget(calTarget);
          }
        }
        
        if (savedMinuteTarget) {
          const minTarget = parseInt(savedMinuteTarget, 10);
          if (!isNaN(minTarget) && minTarget > 0) {
            setMinuteTarget(minTarget);
          }
        }
      } catch (error) {
        console.error('Error loading saved goals:', error);
      }
    };
    
    loadSavedGoals();
  }, []);

  // Save calorie target when it changes
  useEffect(() => {
    if (calorieTarget > 0) {
      AsyncStorage.setItem(STORAGE_KEYS.CALORIE_TARGET, String(calorieTarget)).catch(
        error => console.error('Error saving calorie target:', error)
      );
    }
  }, [calorieTarget]);

  // Save minute target when it changes
  useEffect(() => {
    if (minuteTarget > 0) {
      AsyncStorage.setItem(STORAGE_KEYS.MINUTE_TARGET, String(minuteTarget)).catch(
        error => console.error('Error saving minute target:', error)
      );
    }
  }, [minuteTarget]);

  // Fetch saved achievements when no workoutStats is passed
  useEffect(() => {
    if (!params.workoutStats && token && !isGuest) {
      fetchSavedAchievements();
    }
  }, [params.workoutStats, token, isGuest]);

  const fetchSavedAchievements = async () => {
    if (!token) return;
    
    try {
      setLoadingSavedAchievements(true);
      const response = await fetch(`${API_URL}/api/workout-cards`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Fetched saved achievements:', data.length);
        // Transform to match WorkoutStats format, keeping ALL workout details
        const transformed = data.map((card: any) => {
          console.log(`📋 Card ${card.id} has workout_snapshot_id:`, card.workout_snapshot_id);
          return {
            id: card.id,
            workouts: card.workouts.map((w: any) => ({
              // Keep all original workout data for "Try this workout" replication
              ...w,
              workoutTitle: w.workout_title || w.workoutTitle || w.workout_name || w.workoutName,
              workoutName: w.workout_name || w.workoutName || w.workout_title || w.workoutTitle,
              equipment: w.equipment,
              duration: w.duration,
              difficulty: w.difficulty,
              moodCategory: w.mood_category || w.moodCategory,
              battlePlan: w.battle_plan || w.battlePlan,
              imageUrl: w.image_url || w.imageUrl,
              description: w.description,
              intensityReason: w.intensity_reason || w.intensityReason,
            })),
            totalDuration: card.total_duration,
            completedAt: card.completed_at,
            moodCategory: card.mood_category,
            workoutSnapshotId: card.workout_snapshot_id, // CRITICAL: Include snapshot ID for "Try this workout"
          };
        });
        setSavedAchievements(transformed);
      }
    } catch (error) {
      console.error('Error fetching saved achievements:', error);
    } finally {
      setLoadingSavedAchievements(false);
    }
  };

  const selectSavedAchievement = (achievement: any) => {
    console.log('📋 SELECT_SAVED_ACHIEVEMENT_DEBUG', {
      achievementId: achievement.id,
      hasWorkoutSnapshotId: !!achievement.workoutSnapshotId,
      workoutSnapshotId: achievement.workoutSnapshotId,
      workoutsCount: achievement.workouts?.length,
      rawAchievement: JSON.stringify(achievement).substring(0, 500),
    });
    
    const newWorkoutStats = {
      workouts: achievement.workouts,
      totalDuration: achievement.totalDuration,
      completedAt: achievement.completedAt,
      moodCategory: achievement.moodCategory,
      workoutSnapshotId: achievement.workoutSnapshotId, // CRITICAL: Pass snapshot ID for "Try this workout"
    };
    
    console.log('📋 NEW_WORKOUT_STATS', {
      hasWorkoutSnapshotId: !!newWorkoutStats.workoutSnapshotId,
      workoutSnapshotId: newWorkoutStats.workoutSnapshotId,
    });
    
    setWorkoutStats(newWorkoutStats);
    setHasStatsCard(true);
    
    // Auto-generate caption
    const workoutEmojis = ['⚡', '💪', '🏋️', '🏃', '💦', '🔥', '🎯', '✨', '🚀', '💥'];
    const randomEmoji = workoutEmojis[Math.floor(Math.random() * workoutEmojis.length)];
    const minutes = achievement.totalDuration || 0;
    const calories = Math.round(minutes * 8);
    setCaption(`${calories} cals and ${minutes} minutes today ${randomEmoji}`);
  };

  // Load workout stats
  useEffect(() => {
    // Check if we have workout stats from completed workout
    if (params.workoutStats) {
      try {
        const stats = JSON.parse(params.workoutStats as string);
        setWorkoutStats(stats);
        setHasStatsCard(true);
        if (token) {
          Analytics.workoutRecapViewed(token, {
            has_heart_rate: !!params.heartRateSeries,
          });
        }
        
        // Randomized workout emojis
        const workoutEmojis = ['⚡', '💪', '🏋️', '🏃', '💦', '🔥', '🎯', '✨', '🚀', '💥'];
        const randomEmoji = workoutEmojis[Math.floor(Math.random() * workoutEmojis.length)];
        
        // Calculate calories (same formula as stats card: duration * 8)
        const minutes = stats.totalDuration || 0;
        const calories = Math.round(minutes * 8);
        setCaption(`${calories} cals and ${minutes} minutes today ${randomEmoji}`);
      } catch (error) {
        console.error('Error parsing workout stats:', error);
      }
    }
  }, [params.workoutStats]);

  // First-workout congrats + completion toast.
  // The very first completed workout gets a one-time congrats modal that
  // explains this achievement screen; every completion after that gets a
  // small toast instead. One-shot flag persisted per device.
  const [congratsVisible, setCongratsVisible] = useState(false);
  const [completionToastVisible, setCompletionToastVisible] = useState(false);
  const congratsCheckedRef = useRef(false);
  useEffect(() => {
    if (!params.workoutStats || congratsCheckedRef.current) return;
    congratsCheckedRef.current = true;
    (async () => {
      // Per-USER flag + the server-side workout count. The old device-wide
      // counter was poisoned by prior test accounts on the same phone, which
      // silently downgraded first-timers to the toast.
      const FLAG = `@mood_first_workout_congrats_v1:${user?.id ?? 'anon'}`;
      try {
        const shown = await AsyncStorage.getItem(FLAG);
        const serverCount = user?.workouts_count ?? 0;
        if (!shown && serverCount <= 1) {
          await AsyncStorage.setItem(FLAG, 'true');
          setCongratsVisible(true);
        } else {
          if (!shown) await AsyncStorage.setItem(FLAG, 'true');
          setCompletionToastVisible(true);
        }
      } catch {
        // Never block the share screen on the congrats bookkeeping.
      }
    })();
  }, [params.workoutStats, user?.id, user?.workouts_count]);

  // Auto-save: as soon as workout stats arrive on this screen (post-completion),
  // save the workout card to the user's profile silently. The visible "Save"
  // button still exists as a manual fallback.
  useEffect(() => {
    if (workoutStats && !cardSaved && !isLoading && token) {
      handleSaveCard().catch((e) => console.warn('Auto-save failed:', e));
    }
    // We intentionally only watch workoutStats + auth readiness — handleSaveCard
    // dedupes via cardSaved guard and the Save button updates state on success.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutStats, isLoading, token]);

  const pickImages = async () => {
    const maxMedia = hasStatsCard ? 4 : 5;
    
    if (selectedMedia.length >= maxMedia) {
      showAlert('Limit Reached', `You can only select up to ${maxMedia} items`);
      return;
    }

    // Check if we already have permission
    const { status: existingStatus } = await ImagePicker.getMediaLibraryPermissionsAsync();
    
    if (existingStatus !== 'granted') {
      // Show our custom permission modal first
      setPermissionType('library');
      setShowPermissionModal(true);
      return;
    }

    // Already have permission, proceed with picking
    await launchImageLibrary();
  };

  const launchImageLibrary = async () => {
    const maxMedia = hasStatsCard ? 4 : 5;

    // Don't use native editing - we'll use our custom crop modal
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      // Show crop modal for user to select crop area
      if (asset.width && asset.height) {
        setImageToCrop({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
        });
        setCropSource('library');
        setShowCropModal(true);
      } else {
        // Fallback: If dimensions not available, auto-crop to 4:5
        const finalUri = await cropTo4x5(asset.uri, asset.width || 1000, asset.height || 1250);
        const newMedia: MediaItem = { uri: finalUri, type: 'image' };
        setSelectedMedia([...selectedMedia, newMedia].slice(0, maxMedia));
      }
    }
  };

  // Handle crop completion
  const handleCropComplete = (croppedUri: string) => {
    const maxMedia = hasStatsCard ? 4 : 5;
    setShowCropModal(false);
    setImageToCrop(null);
    
    const newMedia: MediaItem = { uri: croppedUri, type: 'image' };
    setSelectedMedia([...selectedMedia, newMedia].slice(0, maxMedia));
  };

  // Handle crop cancel
  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop(null);
  };

  const handlePermissionRequest = async () => {
    setShowPermissionModal(false);
    
    if (permissionType === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status === 'granted') {
        await launchCamera();
      } else {
        showAlert('Permission Denied', 'Camera access is required to take photos. Please enable it in your device settings.');
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status === 'granted') {
        await launchImageLibrary();
      } else {
        showAlert('Permission Denied', 'Photo library access is required to select images. Please enable it in your device settings.');
      }
    }
  };

  // Helper function to crop image to 4:5 aspect ratio
  const cropTo4x5 = async (uri: string, width: number, height: number): Promise<string> => {
    const targetAspect = 4 / 5; // 0.8
    const currentAspect = width / height;
    
    let cropWidth = width;
    let cropHeight = height;
    let originX = 0;
    let originY = 0;
    
    if (currentAspect > targetAspect) {
      // Image is wider than 4:5 - crop width
      cropWidth = Math.round(height * targetAspect);
      originX = Math.round((width - cropWidth) / 2);
    } else if (currentAspect < targetAspect) {
      // Image is taller than 4:5 - crop height
      cropHeight = Math.round(width / targetAspect);
      originY = Math.round((height - cropHeight) / 2);
    }
    
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            crop: {
              originX,
              originY,
              width: cropWidth,
              height: cropHeight,
            },
          },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipulated.uri;
    } catch (error) {
      console.error('Error cropping image:', error);
      return uri; // Return original if crop fails
    }
  };

  const takePhoto = async () => {
    const maxMedia = hasStatsCard ? 4 : 5;
    
    if (selectedMedia.length >= maxMedia) {
      showAlert('Limit Reached', `You can only select up to ${maxMedia} items`);
      return;
    }

    // Check if we already have permission
    const { status: existingStatus } = await ImagePicker.getCameraPermissionsAsync();
    
    if (existingStatus !== 'granted') {
      // Show our custom permission modal first
      setPermissionType('camera');
      setShowPermissionModal(true);
      return;
    }

    // Already have permission, proceed with camera
    await launchCamera();
  };

  const launchCamera = async () => {
    const maxMedia = hasStatsCard ? 4 : 5;

    // Don't use native editing - we'll use our custom crop modal
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      // Show crop modal for user to select crop area
      if (asset.width && asset.height) {
        setImageToCrop({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
        });
        setCropSource('camera');
        setShowCropModal(true);
      } else {
        // Fallback: If dimensions not available, auto-crop to 4:5
        const finalUri = await cropTo4x5(asset.uri, asset.width || 1000, asset.height || 1250);
        const newMedia: MediaItem = { uri: finalUri, type: 'image' };
        setSelectedMedia([...selectedMedia, newMedia].slice(0, maxMedia));
      }
    }
  };

  const selectCoverFromLibrary = async (videoIndex: number) => {
    // Launch image picker to select cover photo from library
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      showAlert('Permission Required', 'We need photo library access to select a cover image');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const coverUri = result.assets[0].uri;
      
      // Update the video item with the cover image
      const updatedMedia = [...selectedMedia];
      updatedMedia[videoIndex] = {
        ...updatedMedia[videoIndex],
        coverUri: coverUri,
      };
      setSelectedMedia(updatedMedia);
      setShowCoverPicker(false);
      setCoverPickerVideoIndex(-1);
    }
  };

  const selectCoverFromVideo = (videoIndex: number) => {
    // Open video frame selector
    const video = selectedMedia[videoIndex];
    if (video && video.type === 'video') {
      setVideoForFrameSelection({ uri: video.uri, index: videoIndex });
      setShowCoverPicker(false);
      setShowVideoFrameSelector(true);
    }
  };

  const handleFrameSelected = (frameUri: string) => {
    console.log('🎬 Frame selected:', frameUri);
    if (videoForFrameSelection) {
      // Update the video item with the selected frame as cover
      const updatedMedia = [...selectedMedia];
      updatedMedia[videoForFrameSelection.index] = {
        ...updatedMedia[videoForFrameSelection.index],
        coverUri: frameUri,
      };
      console.log('🎬 Updated media with coverUri:', updatedMedia[videoForFrameSelection.index]);
      setSelectedMedia(updatedMedia);
    }
    setShowVideoFrameSelector(false);
    setVideoForFrameSelection(null);
  };

  const handleFrameSelectorCancel = () => {
    setShowVideoFrameSelector(false);
    setVideoForFrameSelection(null);
  };

  const openCoverPicker = (index: number) => {
    setCoverPickerVideoIndex(index);
    setShowCoverPicker(true);
  };

  const recordVideo = async () => {
    const maxMedia = hasStatsCard ? 4 : 5;
    
    if (selectedMedia.length >= maxMedia) {
      showAlert('Limit Reached', `You can only select up to ${maxMedia} items`);
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      showAlert('Permission Required', 'Sorry, we need camera permissions to record videos!');
      return;
    }

    try {
      // Launch camera for video recording
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        videoMaxDuration: 30, // 30 seconds max
        // Cap recording at 1080p H.264 to keep upload size + storage bounded.
        // `videoQuality` is the Android/legacy iOS knob; `videoExportPreset`
        // is the iOS-only exact 1080p preset.
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
        videoExportPreset: ImagePicker.VideoExportPreset.H264_1920x1080,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Check video duration if available
        if (asset.duration && asset.duration > 30000) { // 30 seconds in ms
          showAlert('Video Too Long', 'Please record a video under 30 seconds');
          return;
        }
        
        const newMedia: MediaItem = { uri: asset.uri, type: 'video' };
        const newIndex = selectedMedia.length;
        const updatedMedia = [...selectedMedia, newMedia].slice(0, maxMedia);
        setSelectedMedia(updatedMedia);
        
        // Auto-open cover selector for the newly recorded video
        setTimeout(() => {
          setVideoForFrameSelection({ uri: asset.uri, index: newIndex });
          setShowVideoFrameSelector(true);
        }, 300);
      }
    } catch (error: any) {
      console.error('Video recording error:', error);
      showAlert('Error', 'Failed to record video. Please try again.');
    }
  };

  const pickVideo = async () => {
    const maxMedia = hasStatsCard ? 4 : 5;
    
    if (selectedMedia.length >= maxMedia) {
      showAlert('Limit Reached', `You can only select up to ${maxMedia} items`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      showAlert('Permission Required', 'Sorry, we need camera roll permissions to select videos!');
      return;
    }

    try {
      // Pick video with transcoding enabled to handle slow-mo and ProRes videos.
      // `H264_1920x1080` caps the export at 1080p H.264 — converts slow-mo,
      // ProRes, HEVC and 4K masters down to a sane, broadly-compatible format
      // before upload. Saves bandwidth on cellular and storage forever.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsMultipleSelection: false,
        allowsEditing: false,
        videoMaxDuration: 30, // 30 seconds max
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.High,
        videoExportPreset: ImagePicker.VideoExportPreset.H264_1920x1080,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Check video duration if available
        if (asset.duration && asset.duration > 30000) { // 30 seconds in ms
          showAlert('Video Too Long', 'Please select a video under 30 seconds');
          return;
        }
        
        const newMedia: MediaItem = { uri: asset.uri, type: 'video' };
        const newIndex = selectedMedia.length;
        const updatedMedia = [...selectedMedia, newMedia].slice(0, maxMedia);
        setSelectedMedia(updatedMedia);
        
        // Auto-open cover selector for the newly added video
        setTimeout(() => {
          setVideoForFrameSelection({ uri: asset.uri, index: newIndex });
          setShowVideoFrameSelector(true);
        }, 300);
      }
    } catch (error: any) {
      console.error('Video picker error:', error);
      // Handle PHPhotos errors gracefully
      if (error?.message?.includes('PHPhotos') || error?.message?.includes('3164') || error?.message?.includes("couldn't be completed")) {
        showAlert(
          'Video Processing Issue', 
          'Unable to process this video. It may be corrupted or in an unsupported format. Try selecting a different video or recording a new one.'
        );
      } else {
        showAlert('Error', 'Failed to select video. Please try again.');
      }
    }
  };

  const showSaveAnimation = () => {
    // Same animation as 'Add workout' button
    Animated.sequence([
      Animated.timing(saveScaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(saveScaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(saveScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSaveCard = async () => {
    console.log('handleSaveCard called');
    console.log('=== SAVING WORKOUT CARD WITH FULL DATA ===');
    console.log('workoutStats:', JSON.stringify(workoutStats, null, 2));
    console.log('Snapshot ID:', workoutStats?.workoutSnapshotId);
    
    if (isLoading) {
      showAlert('Please wait', 'Loading authentication...');
      return;
    }
    
    if (!token) {
      console.error('❌ No auth token available!');
      showAlert('Authentication Error', 'Please wait a moment and try again. If the problem persists, try refreshing the app.');
      return;
    }
    
    if (!workoutStats) {
      console.log('No workout stats to save');
      return;
    }
    
    try {
      console.log('Saving card to API...');
      
      // Transform and ensure ALL workout data is saved for "Try this workout" feature
      const cardData = {
        workouts: workoutStats.workouts.map((w: any, idx: number) => {
          console.log(`Processing workout ${idx}:`, JSON.stringify(w, null, 2));
          return {
            // Core fields
            workoutTitle: w.workoutTitle || w.workout_title || w.workoutName || w.workout_name || 'Workout',
            workoutName: w.workoutName || w.workout_name || w.workoutTitle || w.workout_title || 'Workout',
            equipment: w.equipment || 'Bodyweight',
            duration: w.duration || '10 min',
            difficulty: w.difficulty || 'intermediate',
            // Critical fields for workout replication
            battlePlan: w.battlePlan || w.battle_plan || '',
            imageUrl: w.imageUrl || w.image_url || '',
            description: w.description || w.battlePlan || w.battle_plan || '',
            intensityReason: w.intensityReason || w.intensity_reason || '',
            moodCategory: w.moodCategory || w.mood_category || workoutStats.moodCategory || 'Workout',
            moodTips: w.moodTips || w.mood_tips || [],
          };
        }),
        total_duration: workoutStats.totalDuration,
        completed_at: workoutStats.completedAt,
        mood_category: workoutStats.moodCategory,
        workout_snapshot_id: workoutStats.workoutSnapshotId || null, // Persistent reference for "Try this workout"
      };
      
      console.log('Card data to save (including snapshot_id):', cardData.workout_snapshot_id);
      
      const response = await fetch(`${API_URL}/api/workout-cards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      });

      console.log('Save response status:', response.status);
      if (response.ok) {
        console.log('✅ Card saved successfully with snapshot_id:', cardData.workout_snapshot_id);
        setCardSaved(true);
        showSaveAnimation();
      } else {
        const errorData = await response.json();
        console.error('Save error:', errorData);
        showAlert('Error', 'Failed to save workout card.');
      }
    } catch (error) {
      console.error('Error saving workout card:', error);
      showAlert('Error', 'Something went wrong while saving the card.');
    }
  };

  const handleShareToInstagram = async () => {
    // Top-level guard — never let an error from this flow bubble up and crash
    // the screen (which would kick the user back to login).
    try {
      if (isExportingToInstagram) return; // single-flight guard

      if (!workoutStats || !transparentCardRef.current) {
        showAlert('Error', 'Unable to share. Please try again.');
        return;
      }

      if (token) {
        Analytics.shareToInstagramTapped(token, {
          has_heart_rate: !!heartRateSeries,
          samples: heartRateSeries?.length ?? 0,
        });
      }

      setIsExportingToInstagram(true);

      if (Platform.OS === 'web') {
        // For web, use html2canvas and download
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(transparentCardRef.current, {
          backgroundColor: null,
          scale: 2,
          logging: false,
          useCORS: true,
        });
        const imageUri = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `mood_workout_${Date.now()}.png`;
        link.href = imageUri;
        link.click();

        showAlert(
          'Image Downloaded',
          'Your workout overlay has been downloaded. Open Instagram Stories and add it as a sticker on your photo!',
        );
      } else {
        await shareToInstagramStoriesDirect();
      }
    } catch (error: any) {
      // Catch EVERYTHING — including native module crashes, permission errors,
      // canvas/captureRef failures, and unhandled URL scheme rejections.
      console.error('Error sharing to Instagram:', error?.message || error);
      try {
        showAlert(
          'Couldn\u2019t share to Instagram',
          'Something went wrong. The overlay may have been saved to your photo album — open Instagram → new Story → sticker icon to add it manually.',
        );
      } catch {}
    } finally {
      setIsExportingToInstagram(false);
      // Ensure the IG prompt modal isn't left mounted in a stuck state
      if (igPromptResolveRef.current) {
        try { igPromptResolveRef.current(false); } catch {}
        igPromptResolveRef.current = null;
      }
      setIgPromptVisible(false);
    }
  };

  // Direct share to Instagram Stories via URL scheme + Photos
  const shareToInstagramStoriesDirect = async () => {
    if (!transparentCardRef.current) {
      throw new Error('No card to capture');
    }
    
    if (!captureRef) {
      showAlert('Feature Unavailable', 'Screen capture is not available on this device.');
      return;
    }

    // 1) Capture overlay as transparent PNG
    const uri = await captureRef(transparentCardRef.current, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
      bgColor: '#00000000',
    });

    // 2) Save to Photos so Instagram can access it
    let MediaLibrary: any;
    try {
      MediaLibrary = await import('expo-media-library');
      // This will throw if the native module isn't in the binary
      await MediaLibrary.getPermissionsAsync();
    } catch (e) {
      showAlert('Unavailable', 'Photo library access is not included in this build. Please reinstall the latest development build.');
      return;
    }

    // Now safe to request permissions
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission Needed', 'Enable Photos access in Settings → MOOD → Photos.');
      return;
    }
    await MediaLibrary.saveToLibraryAsync(uri);
    if (token) {
      // Phase 3 — the overlay is being written to the camera roll. Previously
      // exported-but-unfired; now wired at the actual save point.
      Analytics.shareToCameraRollTapped(token, {
        destination: 'camera_roll',
        has_heart_rate: !!heartRateSeries,
      });
      Analytics.shareCompleted(token, {
        destination: 'instagram_stories',
        has_heart_rate: !!heartRateSeries,
      });
    }

    // 3) Check if Instagram is installed and open Stories camera
    const canOpenStories = await Linking.canOpenURL('instagram://story-camera');
    if (canOpenStories) {
      // Custom Modal (with X close) instead of system Alert so user can dismiss
      const opened = await new Promise<boolean>((resolve) => {
        igPromptResolveRef.current = resolve;
        setIgPromptVisible(true);
      });
      if (opened) {
        await Linking.openURL('instagram://story-camera');
      }
    } else {
      // Fallback: Instagram not installed — use system share sheet
      try {
        const Sharing = await import('expo-sharing');
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          if (token) {
            Analytics.shareSheetOpened(token, { destination: 'system_share_sheet' });
          }
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share your workout overlay',
            UTI: 'public.png',
          });
          return;
        }
      } catch {}
      showAlert('Saved to Photos', 'Your workout overlay has been saved to your photo library. Open Instagram and add it manually.');
    }
  };

  const navigateToHome = async () => {
    console.log('navigateToHome called - starting navigation...');
    // Spec §3 Stage 2a — fire Soft Paywall #2 on achievement-screen close.
    // Helper is idempotent (one-shot via @mood_post_first_workout_paywall_shown_v1)
    // and silently no-ops for active subscribers / users without a completed
    // free workout. Awaiting it ensures the paywall is enqueued before we
    // route home; PaywallModal renders on top of `/(tabs)` so the modal will
    // appear over the home screen rather than over a torn-down route.
    // In-app rating prompt — fires at the post-achievement moment, BEFORE the
    // soft paywall, on the user's 3rd completed workout (one-shot, self-gating).
    // On the 3rd workout Soft Paywall #2 is already consumed, so in practice
    // these never stack; ordering rating first keeps the favor-ask ahead of the
    // money-ask even in edge cases.
    try {
      await maybeRequestReview({
        onOutcome: (outcome, count) =>
          Analytics.ratingPromptOutcome(token, {
            outcome,
            workout_count: count,
            placement: 'post_achievement_close',
          }),
      });
    } catch {
      /* never block navigation on the rating prompt */
    }
    try {
      await tryFirePostFirstWorkoutPaywall('post_achievement_close_soft', {
        completedWorkoutConfirmed: !!workoutStats,
      });
    } catch {
      /* never block navigation on paywall fire */
    }
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        console.log('Platform is web, using window.location');
        console.log('Current URL:', window.location.href);
        // Navigate to the mood cards screen (tabs/index)
        window.location.href = '/(tabs)';
        console.log('window.location.href set to /(tabs)');
      } else {
        console.log('Platform is native, resetting stack and navigating to tabs');
        navigateToTabsAfterWorkoutComplete(router);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      navigateToTabsAfterWorkoutComplete(router);
    }
    console.log('navigateToHome completed');
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      // Use native web alert for web platform
      console.log(`Alert: ${title} - ${message}`);
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleCancel = () => {
    console.log('handleCancel called');
    
    if (Platform.OS === 'web') {
      // On web, use native confirm dialog
      if (hasStatsCard) {
        const shouldSave = window.confirm('Do you want to save your workout card before leaving?\n\nClick OK to save, Cancel to discard.');
        if (shouldSave) {
          console.log('User chose to save');
          handleSaveCard().then(() => {
            console.log('Card saved, now navigating...');
            navigateToHome();
          });
        } else {
          console.log('User chose to discard');
          navigateToHome();
        }
      } else {
        console.log('No stats card, navigating home');
        navigateToHome();
      }
    } else {
      // On native, use Alert.alert with buttons
      if (hasStatsCard) {
        Alert.alert(
          'Cancel Post',
          'Do you want to save your workout card to your profile before leaving?',
          [
            {
              text: 'Discard All',
              style: 'destructive',
              onPress: () => {
                console.log('Discard All pressed');
                navigateToHome();
              },
            },
            {
              text: 'Save Card Only',
              onPress: async () => {
                console.log('Save Card Only pressed');
                await handleSaveCard();
                navigateToHome();
              },
            },
            {
              text: 'Keep Editing',
              style: 'cancel',
            },
          ]
        );
      } else {
        console.log('No stats card, going home');
        navigateToHome();
      }
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia(selectedMedia.filter((_, i) => i !== index));
  };

  const moveMediaUp = (index: number) => {
    if (index === 0) return;
    const newMedia = [...selectedMedia];
    [newMedia[index - 1], newMedia[index]] = [newMedia[index], newMedia[index - 1]];
    setSelectedMedia(newMedia);
  };

  const moveMediaDown = (index: number) => {
    if (index === selectedMedia.length - 1) return;
    const newMedia = [...selectedMedia];
    [newMedia[index], newMedia[index + 1]] = [newMedia[index + 1], newMedia[index]];
    setSelectedMedia(newMedia);
  };

  const extractHashtags = (text: string): string[] => {
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  };

  const captureWorkoutCard = async (): Promise<string | null> => {
    if (!workoutStats || !statsCardRef.current) {
      console.log('❌ No stats or ref:', { hasStats: !!workoutStats, hasRef: !!statsCardRef.current });
      return null;
    }
    
    try {
      if (Platform.OS === 'web') {
        // Use html2canvas for web
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(statsCardRef.current, {
          backgroundColor: '#000000',
          scale: 1.5, // Lower scale for smaller file size
          logging: false,
          useCORS: true,
        });
        const uri = canvas.toDataURL('image/png', 0.9); // 90% quality
        console.log('✅ Web capture successful, data URL length:', uri.length);
        return uri;
      } else {
        // Check if captureRef is available
        if (!captureRef) {
          console.warn('captureRef not available on this device');
          return null;
        }
        // Use react-native-view-shot for native
        const uri = await captureRef(statsCardRef.current, {
          format: 'png',
          quality: 0.8,
        });
        console.log('✅ Native capture successful:', uri);
        return uri;
      }
    } catch (error) {
      console.error('❌ Error capturing workout card:', error);
      return null;
    }
  };

  const uploadMedia = async (): Promise<{urls: string[], coverUrls: {[key: number]: string}}> => {
    const uploadedUrls: string[] = [];
    const coverUrls: {[key: number]: string} = {};
    const totalSteps = selectedMedia.length + (hasStatsCard ? 1 : 0) + 1; // media + card + post creation
    let currentStep = 0;
    
    for (let i = 0; i < selectedMedia.length; i++) {
      const mediaItem = selectedMedia[i];
      currentStep++;
      setUploadProgress((currentStep / totalSteps) * 100);

      try {
        const formData = new FormData();
        let filename = mediaItem.uri.split('/').pop() || (mediaItem.type === 'video' ? 'video.mp4' : 'image.jpg');
        
        // Ensure filename has extension
        if (!filename.includes('.')) {
          filename = mediaItem.type === 'video' ? `video_${Date.now()}.mp4` : `image_${Date.now()}.jpg`;
        }
        
        const match = /\.(\w+)$/.exec(filename);
        let type: string;
        
        if (mediaItem.type === 'video') {
          // Determine video MIME type
          const ext = match ? match[1].toLowerCase() : 'mp4';
          const videoTypes: { [key: string]: string } = {
            'mp4': 'video/mp4',
            'mov': 'video/quicktime',
            'avi': 'video/x-msvideo',
            'webm': 'video/webm',
            'mkv': 'video/x-matroska',
            'm4v': 'video/x-m4v',
          };
          type = videoTypes[ext] || 'video/mp4';
        } else {
          type = match ? `image/${match[1]}` : 'image/jpeg';
        }

        if (Platform.OS === 'web') {
          // For web, fetch the blob and append it with proper filename
          const response = await fetch(mediaItem.uri);
          const blob = await response.blob();
          formData.append('file', blob, filename);
        } else {
          // For native platforms
          formData.append('file', {
            uri: mediaItem.uri,
            name: filename,
            type,
          } as any);
        }

        const uploadResponse = await fetch(`${API_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        console.log('Upload response status:', uploadResponse.status);
        if (uploadResponse.ok) {
          const data = await uploadResponse.json();
          console.log('Upload success:', data);
          uploadedUrls.push(data.url);
          
          // If this is a video, prioritize user-selected cover over Cloudinary auto-generated
          if (mediaItem.type === 'video') {
            if (mediaItem.coverUri) {
              // User selected a custom cover - upload it (HIGHEST PRIORITY)
              try {
                console.log('Uploading user-selected cover:', mediaItem.coverUri);
                const coverFormData = new FormData();
                const coverFilename = `cover_${Date.now()}.jpg`;
                
                if (Platform.OS === 'web') {
                  const coverResponse = await fetch(mediaItem.coverUri);
                  const coverBlob = await coverResponse.blob();
                  coverFormData.append('file', coverBlob, coverFilename);
                } else {
                  coverFormData.append('file', {
                    uri: mediaItem.coverUri,
                    name: coverFilename,
                    type: 'image/jpeg',
                  } as any);
                }
                
                const coverUploadResponse = await fetch(`${API_URL}/api/upload`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                  body: coverFormData,
                });
                
                if (coverUploadResponse.ok) {
                  const coverData = await coverUploadResponse.json();
                  coverUrls[uploadedUrls.length - 1] = coverData.url;
                  console.log('✅ User cover uploaded:', coverData.url);
                } else {
                  console.error('Cover upload failed, falling back to Cloudinary thumbnail');
                  if (data.thumbnail_url) {
                    coverUrls[uploadedUrls.length - 1] = data.thumbnail_url;
                  }
                }
              } catch (coverError) {
                console.error('Error uploading cover:', coverError);
                // Fallback to Cloudinary thumbnail if cover upload fails
                if (data.thumbnail_url) {
                  coverUrls[uploadedUrls.length - 1] = data.thumbnail_url;
                }
              }
            } else if (data.thumbnail_url) {
              // No user cover, use Cloudinary auto-generated thumbnail
              coverUrls[uploadedUrls.length - 1] = data.thumbnail_url;
              console.log('Using Cloudinary thumbnail:', data.thumbnail_url);
            }
          }
        } else {
          const errorText = await uploadResponse.text();
          console.error('Upload failed:', uploadResponse.status, errorText);
        }
      } catch (error) {
        console.error('Error uploading media:', error);
      }
    }

    console.log('All uploaded URLs:', uploadedUrls);
    console.log('Cover URLs:', coverUrls);
    return { urls: uploadedUrls, coverUrls };
  };

  const handleCreatePost = async () => {
    if (selectedMedia.length === 0 && !caption.trim() && !hasStatsCard) {
      showAlert('Empty Post', 'Please add at least an image, video, caption, or workout card');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const totalSteps = selectedMedia.length + (hasStatsCard ? 1 : 0) + 1;
      let currentStep = 0;

      // Upload media (images and videos)
      const uploadResult = await uploadMedia();
      let mediaUrls = uploadResult.urls;
      const coverUrls = uploadResult.coverUrls;
      console.log('Uploaded media:', mediaUrls);
      console.log('Cover URLs:', coverUrls);
      
      // Capture and upload workout card if it exists
      if (hasStatsCard && workoutStats) {
        console.log('📸 Capturing workout card...');
        
        // Small delay to ensure component is rendered
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const cardUri = await captureWorkoutCard();
        console.log('Workout card captured:', cardUri ? 'YES' : 'NO', 'Ref:', !!statsCardRef.current);
        
        if (cardUri) {
          currentStep++;
          setUploadProgress((currentStep / totalSteps) * 100);
          
          console.log('Uploading workout card...');
          // Upload the workout card
          const formData = new FormData();
          const filename = `workout_card_${Date.now()}.png`;
          
          if (Platform.OS === 'web') {
            // Convert data URL to blob for web
            if (cardUri.startsWith('data:')) {
              const response = await fetch(cardUri);
              const blob = await response.blob();
              formData.append('file', blob, filename);
            } else {
              // If it's already a URL
              const response = await fetch(cardUri);
              const blob = await response.blob();
              formData.append('file', blob, filename);
            }
          } else {
            formData.append('file', {
              uri: cardUri,
              name: filename,
              type: 'image/png',
            } as any);
          }
          
          const uploadResponse = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });
          
          console.log('Workout card upload status:', uploadResponse.status);
          if (uploadResponse.ok) {
            const data = await uploadResponse.json();
            console.log('✅ Workout card uploaded:', data.url);
            mediaUrls.push(data.url); // Add workout card as last item
          } else {
            const errorText = await uploadResponse.text();
            console.error('❌ Workout card upload failed:', errorText);
          }
        } else {
          console.error('❌ Failed to capture workout card. Ref current:', statsCardRef.current);
        }
      } else {
        console.log('No workout card to capture (hasStatsCard:', hasStatsCard, ', workoutStats:', !!workoutStats, ')');
      }
      
      console.log('📤 Final mediaUrls for post:', mediaUrls);
      
      currentStep++;
      setUploadProgress((currentStep / totalSteps) * 100);
      
      const hashtags = extractHashtags(caption);

      // Prepare post data including workout data for replication
      const postPayload: any = {
        caption: caption.trim(),
        media_urls: mediaUrls,
        hashtags,
        cover_urls: Object.keys(coverUrls).length > 0 ? coverUrls : null,
      };
      
      // =========================================================================
      // ATTACHED WORKOUT - Send ONLY workout_snapshot_id, server hydrates the rest
      // This ensures the canonical attached_workout is always complete and valid
      // =========================================================================
      if (workoutStats && workoutStats.workoutSnapshotId) {
        console.log('📋 Including workout_snapshot_id in post:', workoutStats.workoutSnapshotId);
        // ONLY send the snapshot ID - server will hydrate attached_workout
        postPayload.workout_snapshot_id = workoutStats.workoutSnapshotId;
        
        // Legacy: Also include workout_data for backwards compatibility with display
        postPayload.workout_data = {
          workouts: workoutStats.workouts.map((w: any) => ({
            workoutTitle: w.workoutTitle || w.workout_title || w.workoutName || w.workout_name,
            workoutName: w.workoutName || w.workout_name || w.workoutTitle || w.workout_title,
            equipment: w.equipment,
            duration: w.duration,
            difficulty: w.difficulty,
          })),
          totalDuration: workoutStats.totalDuration,
          completedAt: workoutStats.completedAt,
          moodCategory: workoutStats.moodCategory,
          workout_snapshot_id: workoutStats.workoutSnapshotId,
        };
      } else if (workoutStats) {
        // No snapshot ID - this shouldn't happen for new workouts, but log it
        console.warn('⚠️ No workout_snapshot_id available - "Try This Workout" will be unavailable for this post');
        // Still include basic workout_data for display purposes
        postPayload.workout_data = {
          workouts: workoutStats.workouts.map((w: any) => ({
            workoutTitle: w.workoutTitle || w.workout_title || w.workoutName || w.workout_name,
            workoutName: w.workoutName || w.workout_name || w.workoutTitle || w.workout_title,
            equipment: w.equipment,
            duration: w.duration,
            difficulty: w.difficulty,
          })),
          totalDuration: workoutStats.totalDuration,
          completedAt: workoutStats.completedAt,
          moodCategory: workoutStats.moodCategory,
        };
      }

      // DEBUG: Log the payload before sending
      console.log('🔍 CREATE_POST_PAYLOAD_DEBUG', {
        source: workoutStats ? 'saved_achievement_post_later' : 'no_workout',
        workout_snapshot_id: postPayload.workout_snapshot_id || null,
        hasWorkoutSnapshotId: !!postPayload.workout_snapshot_id,
        workoutStatsSnapshotId: workoutStats?.workoutSnapshotId || null,
        hasAttachedWorkoutInPayload: !!postPayload.attached_workout,
      });

      const response = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postPayload),
      });

      console.log('Post response status:', response.status);
      
      // DEBUG: Log the response
      const responseData = await response.json();
      console.log('🔍 CREATE_POST_RESPONSE_DEBUG', {
        status: response.status,
        postId: responseData?.id,
        hasAttached: !!responseData?.attached_workout,
        exCount: responseData?.attached_workout?.exercises?.length || 0,
        keys: responseData?.attached_workout ? Object.keys(responseData.attached_workout) : null,
        error: responseData?.detail || responseData?.error || null,
      });
      
      if (response.status === 200 || response.status === 201) {
        setUploadProgress(100);
        console.log('Post created successfully!');
        
        // Track post created event
        if (token) {
          Analytics.postCreated(token, {
            has_media: mediaUrls.length > 0,
            media_count: mediaUrls.length,
            caption_length: caption.trim().length,
          });
        }
        
        // Keep loading screen visible while showing 100%
        await new Promise(resolve => setTimeout(resolve, 800));

        // Spec §3 Stage 2b — fire Soft Paywall #2 on post-publish success.
        // Same one-shot helper as the achievement-close path; whichever
        // exit happens first consumes the flag. Fired BEFORE we route to
        // explore so the paywall lands on top of the explore feed (not
        // on top of a transitioning route).
        // In-app rating prompt — same post-achievement moment, BEFORE the soft
        // paywall. One-shot + count-gated (3rd workout), so it no-ops here if it
        // already fired on the achievement-close path.
        try {
          await maybeRequestReview({
            onOutcome: (outcome, count) =>
              Analytics.ratingPromptOutcome(token, {
                outcome,
                workout_count: count,
                placement: 'post_share',
              }),
          });
        } catch {
          /* never block navigation on the rating prompt */
        }
        try {
          await tryFirePostFirstWorkoutPaywall('post_share_soft', {
            completedWorkoutConfirmed: !!workoutStats,
          });
        } catch {
          /* never block navigation on paywall fire */
        }

        // Navigate to explore page first (while loading screen is still visible)
        router.replace('/(tabs)/explore');
        
        // Add small delay for navigation to start
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Dismiss loading screen after navigation begins
        setUploading(false);
        setUploadProgress(0);
      } else {
        const errorText = await response.text();
        console.error('Post failed:', response.status, errorText);
        setUploading(false);
        setUploadProgress(0);
        showAlert('Error', 'Failed to create post. Please try again.');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setUploading(false);
      setUploadProgress(0);
      showAlert('Error', 'Something went wrong. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Share Your Achievement</Text>
            <Text style={styles.headerSubtitle}>Post to your feed</Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.postButton,
              (!caption.trim() && selectedImages.length === 0 && !hasStatsCard) && styles.postButtonDisabled
            ]}
            onPress={() => {
              if (completionTipActive) completeCompletionTip('tap');
              handleCreatePost();
            }}
            disabled={uploading || (!caption.trim() && selectedImages.length === 0 && !hasStatsCard)}
            activeOpacity={0.7}
            testID="create-post-submit"
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Ionicons name="send" size={20} color="#000" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Attachments Label */}
          <View style={styles.attachmentsHeader}>
            <Ionicons name="attach" size={16} color="rgba(255, 255, 255, 0.5)" />
            <Text style={styles.attachmentsLabel}>Attachments</Text>
          </View>

          {/* Share-to-feed intro — frames media + caption as one action */}
          <View style={styles.feedIntro}>
            <View style={styles.feedIntroTitleRow}>
              <Ionicons name="people" size={15} color="#F4C316" />
              <Text style={styles.feedIntroTitle}>Post to the MOOD feed</Text>
            </View>
            <Text style={styles.feedIntroSub}>
              Add a photo or video and a caption — others can see your workout and duplicate it in a tap.
            </Text>
          </View>

          {/* 1. Media Picker Section — part of the feed post */}
          <View style={[styles.attachmentCard, styles.feedMediaCard]} ref={mediaRowRef} collapsable={false}>
            <View style={styles.attachmentHeader}>
              <View style={styles.attachmentLabelContainer}>
                <Ionicons name="images" size={14} color="rgba(255, 255, 255, 0.5)" />
                <Text style={styles.attachmentType}>
                  Media ({selectedMedia.length}/{hasStatsCard ? 4 : 5})
                </Text>
              </View>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.imageScroll}
              contentContainerStyle={styles.imageScrollContent}
            >
              {/* Big add tile — one "+" that opens photo / video / camera */}
              {selectedMedia.length < (hasStatsCard ? 4 : 5) && (
                <TouchableOpacity
                  style={styles.bigAddTile}
                  onPress={() => setShowMediaPicker(true)}
                  testID="feed-add-media"
                >
                  <Ionicons name="add" size={38} color="#F4C316" />
                  <Text style={styles.bigAddText}>Add photo or video</Text>
                </TouchableOpacity>
              )}

              {selectedMedia.map((media, index) => (
                <View key={index} style={styles.imagePreviewContainer}>
                  {media.type === 'video' ? (
                    <View style={styles.videoPreviewContainer}>
                      {media.coverUri ? (
                        <Image source={{ uri: media.coverUri }} style={styles.imagePreview} />
                      ) : (
                        <Video
                          source={{ uri: media.uri }}
                          style={styles.imagePreview}
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={false}
                          isMuted={true}
                        />
                      )}
                      <View style={styles.videoOverlay}>
                        <Ionicons name="play-circle" size={32} color="#fff" />
                      </View>
                      {/* Cover photo button for videos */}
                      <TouchableOpacity 
                        style={styles.setCoverButton}
                        onPress={() => openCoverPicker(index)}
                      >
                        <Ionicons name="image-outline" size={14} color='#000' />
                        <Text style={styles.setCoverButtonText}>
                          {media.coverUri ? 'Change' : 'Cover'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Image source={{ uri: media.uri }} style={styles.imagePreview} />
                  )}
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => removeMedia(index)}
                  >
                    <Ionicons name="close-circle" size={22} color='#FF4444' />
                  </TouchableOpacity>
                  <View style={[styles.imageNumber, media.type === 'video' && styles.videoNumber]}>
                    {media.type === 'video' ? (
                      <Ionicons name="videocam" size={10} color="#000" />
                    ) : (
                      <Text style={styles.imageNumberText}>{index + 1}</Text>
                    )}
                  </View>
                  {/* Reorder buttons */}
                  <View style={styles.reorderButtons}>
                    {index > 0 && (
                      <TouchableOpacity 
                        style={styles.reorderButton}
                        onPress={() => moveMediaUp(index)}
                      >
                        <Ionicons name="chevron-back" size={18} color="#FFD700" />
                      </TouchableOpacity>
                    )}
                    {index < selectedMedia.length - 1 && (
                      <TouchableOpacity 
                        style={styles.reorderButton}
                        onPress={() => moveMediaDown(index)}
                      >
                        <Ionicons name="chevron-forward" size={18} color="#FFD700" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Caption — prefilled, part of the same feed-post block */}
            <TextInput
              style={styles.captionInline}
              placeholder="Add a caption… (use #hashtags)"
              placeholderTextColor="#666"
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={2}
              maxLength={500}
            />
            <Text style={styles.captionCounter}>{caption.length}/500</Text>
          </View>

          {/* Saved Achievements Section - Show when no workout stats */}
          {!workoutStats && savedAchievements.length > 0 && (
            <View style={styles.attachmentCard}>
              <View style={styles.attachmentHeader}>
                <View style={styles.attachmentLabelContainer}>
                  <Ionicons name="trophy" size={16} color="#FFD700" />
                  <Text style={styles.attachmentType}>Saved Achievements ({savedAchievements.length})</Text>
                </View>
              </View>
              
              <Text style={styles.savedAchievementsHint}>
                Tap to add a workout achievement to your post
              </Text>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.savedAchievementsScroll}
                contentContainerStyle={styles.savedAchievementsContent}
              >
                {savedAchievements.map((achievement, index) => {
                  const estimatedCalories = Math.round(achievement.totalDuration * 8);
                  
                  // Extract mood label from workout names
                  const getMoodLabel = (): string => {
                    if (achievement.workouts.length > 0) {
                      const firstWorkout = achievement.workouts[0].workoutName?.toLowerCase() || '';
                      if (firstWorkout.includes('muscle') || firstWorkout.includes('gainer') || firstWorkout.includes('back') || firstWorkout.includes('chest') || firstWorkout.includes('arm')) return 'Muscle';
                      if (firstWorkout.includes('sweat') || firstWorkout.includes('cardio') || firstWorkout.includes('hiit') || firstWorkout.includes('burn')) return 'Sweat';
                      if (firstWorkout.includes('explosion') || firstWorkout.includes('power') || firstWorkout.includes('explosive')) return 'Explosion';
                      if (firstWorkout.includes('outdoor') || firstWorkout.includes('hill') || firstWorkout.includes('run') || firstWorkout.includes('outside')) return 'Outdoor';
                      if (firstWorkout.includes('calisthenics') || firstWorkout.includes('pull') || firstWorkout.includes('dip') || firstWorkout.includes('bodyweight')) return 'Calisthenics';
                      if (firstWorkout.includes('lazy') || firstWorkout.includes('stretch') || firstWorkout.includes('recovery') || firstWorkout.includes('easy')) return 'Lazy';
                    }
                    return 'Workout';
                  };
                  
                  const moodLabel = getMoodLabel();
                  
                  return (
                    <TouchableOpacity
                      key={achievement.id || index}
                      style={styles.savedAchievementCard}
                      onPress={() => selectSavedAchievement(achievement)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.achievementCardContent}>
                        {/* Header row */}
                        <View style={styles.achievementHeaderRow}>
                          <Text style={styles.achievementDateLabel}>{achievement.completedAt}</Text>
                          <View style={styles.achievementTrophyBadge}>
                            <Ionicons name="checkmark" size={12} color="#0c0c0c" />
                          </View>
                        </View>
                        
                        {/* Mood label as hero text */}
                        <Text style={styles.achievementMoodLabel} numberOfLines={2}>{moodLabel}</Text>
                        
                        {/* Stats row - duration, calories, exercises */}
                        <View style={styles.achievementStatsRow}>
                          <View style={styles.achievementStatPill}>
                            <Ionicons name="time-outline" size={10} color="#FFD700" />
                            <Text style={styles.achievementStatPillText}>{achievement.totalDuration}m</Text>
                          </View>
                          <View style={styles.achievementStatPill}>
                            <Ionicons name="flame-outline" size={10} color="#FFD700" />
                            <Text style={styles.achievementStatPillText}>{estimatedCalories}</Text>
                          </View>
                          <View style={styles.achievementStatPill}>
                            <Ionicons name="barbell-outline" size={10} color="#FFD700" />
                            <Text style={styles.achievementStatPillText}>{achievement.workouts.length}</Text>
                          </View>
                        </View>
                        
                        {/* Workout preview list */}
                        <View style={styles.achievementWorkoutPreview}>
                          {achievement.workouts.slice(0, 2).map((workout: any, wIndex: number) => {
                            const name = workout.workoutName || workout.workoutTitle;
                            const equip = workout.equipment && workout.equipment !== 'None' ? workout.equipment : '';
                            const label = equip ? `${name} \u2022 ${equip}` : name;
                            const display = label.length > 40 ? label.slice(0, 37) + '...' : label;
                            return (
                              <Text key={wIndex} style={styles.achievementWorkoutName} numberOfLines={1}>
                                {display}
                              </Text>
                            );
                          })}
                          {achievement.workouts.length > 2 && (
                            <Text style={styles.achievementWorkoutMore}>
                              +{achievement.workouts.length - 2} more
                            </Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Loading saved achievements */}
          {!workoutStats && loadingSavedAchievements && (
            <View style={styles.attachmentCard}>
              <View style={styles.loadingSavedContainer}>
                <ActivityIndicator size="small" color="#FFD700" />
                <Text style={styles.loadingSavedText}>Loading saved achievements...</Text>
              </View>
            </View>
          )}

          {/* 3. Workout Stats Card - LAST */}
          {workoutStats && (
            <View style={styles.attachmentCard}>
              <View style={styles.attachmentHeader}>
                <View style={[styles.actionButtonsRow, { flex: 1, justifyContent: 'flex-start' }]}>
                  {/* Instagram Share Button - Bold gold-bordered to stand out */}
                  <TouchableOpacity 
                    ref={igButtonRef}
                    collapsable={false}
                    onPress={() => {
                      if (completionTipActive) completeCompletionTip('tap');
                      handleShareToInstagram();
                    }}
                    style={styles.instagramButtonWrapper}
                    activeOpacity={0.8}
                    disabled={isExportingToInstagram}
                    testID="ig-share-button"
                  >
                    <LinearGradient
                      colors={['#833AB4', '#FD1D1D', '#F77737']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.instagramButtonGradient}
                    >
                      {isExportingToInstagram ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="logo-instagram" size={18} color="#fff" />
                          <Text style={styles.instagramButtonText}>IG Story</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  {/* Save Button */}
                  <Animated.View style={{ transform: [{ scale: saveScaleAnim }] }}>
                    <TouchableOpacity 
                      onPress={handleSaveCard} 
                      disabled={cardSaved}
                      style={[
                        styles.saveCardButton,
                        cardSaved && styles.saveCardButtonSaved
                      ]}
                      activeOpacity={0.7}
                    >
                      {cardSaved ? (
                        <>
                          <Ionicons name="checkmark" size={16} color="#FFD700" />
                          <Text style={styles.saveButtonText}>Saved</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="bookmark-outline" size={18} color="#FFD700" />
                          <Text style={styles.saveButtonText}>Save</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Equipment name on/off — same format as Save, with a
                      radio bubble that fills when active */}
                  <TouchableOpacity
                    testID="equipment-toggle"
                    onPress={() => setShowEquipment(prev => !prev)}
                    style={[
                      styles.saveCardButton,
                      showEquipment && styles.saveCardButtonSaved,
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.equipBubble, showEquipment && styles.equipBubbleOn]} />
                    <Text style={styles.saveButtonText}>Equip</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Card + equipment toggle overlay */}
              <View style={styles.cardWithToggleContainer} ref={cardContainerRef} collapsable={false}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => {
                    const cardW = e.nativeEvent.layoutMeasurement.width;
                    const idx = Math.round(e.nativeEvent.contentOffset.x / cardW);
                    const next = CARD_VARIANTS[Math.max(0, Math.min(CARD_VARIANTS.length - 1, idx))];
                    if (next !== cardVariant) setCardVariant(next);
                  }}
                  scrollEventThrottle={16}
                  decelerationRate="fast"
                  style={styles.variantScroll}
                  contentContainerStyle={styles.variantScrollContent}
                >
                  {CARD_VARIANTS.map((v) => (
                    <View key={v} style={styles.statsCardWrapper}>
                      <WorkoutStatsCard
                        {...workoutStats}
                        editedDuration={editedDuration}
                        editedCalories={editedCalories}
                        calorieTarget={calorieTarget}
                        minuteTarget={minuteTarget}
                        showRingPulse={v === 'rings'}
                        showEquipment={showEquipment}
                        variant={v}
                        heartRateSamples={heartRateSeries}
                        heartRateRealStats={heartRateRealStats}
                      />
                    </View>
                  ))}
                </ScrollView>

                {/* Variant dots indicator — in normal flow directly under the
                    card so it can never overlap the sync row / status chip. */}
                <View style={styles.variantDotsRow} pointerEvents="none">
                  {CARD_VARIANTS.map((v) => (
                    <View
                      key={v}
                      style={[
                        styles.variantDot,
                        v === cardVariant && styles.variantDotActive,
                      ]}
                    />
                  ))}
                </View>

                {/* Sync status + actions live in the "Your numbers" panel
                    above — nothing extra under the card. */}

              </View>

              {/* ── Your numbers — stats, targets & Apple Health in ONE panel ── */}
              <View style={styles.statsPanel} ref={editableStatsRowRef} collapsable={false}>
                <View style={styles.statsPanelHeader}>
                  <Text style={styles.statsPanelTitle}>Your numbers</Text>
                  {sessionCaloriesFromWearable != null ? (
                    <View style={styles.statsPanelBadge}>
                      <Ionicons name="checkmark-circle" size={13} color="#3CD070" />
                      <Text style={styles.statsPanelBadgeLive}>
                        Live · Apple Health
                        {sessionLabel ? ` · ${sessionLabel}` : lastWorkoutLabel ? ` · ${lastWorkoutLabel}` : ''}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.statsPanelBadge}>
                      <Text style={styles.statsPanelBadgeEst}>* estimated</Text>
                    </View>
                  )}
                </View>
                <View style={styles.editableStatsRow}>
                  <View style={styles.editableStat}>
                    <Text style={styles.editableStatLabel}>MIN</Text>
                    <TextInput
                      style={styles.editableStatInput}
                      value={editedDuration !== undefined ? String(editedDuration) : String(workoutStats.totalDuration)}
                      onChangeText={(text) => {
                        if (text === '') {
                          setEditedDuration(0);
                        } else {
                          const num = parseInt(text, 10);
                          if (!isNaN(num)) setEditedDuration(num);
                        }
                      }}
                      keyboardType="numeric"
                      maxLength={3}
                      selectTextOnFocus
                    />
                  </View>
                  <View style={styles.editableStat}>
                    <Text style={styles.editableStatLabel}>MIN GOAL</Text>
                    <TextInput
                      style={styles.editableStatInput}
                      value={String(minuteTarget)}
                      onChangeText={(text) => {
                        if (text === '') {
                          setMinuteTarget(0);
                        } else {
                          const num = parseInt(text, 10);
                          if (!isNaN(num)) setMinuteTarget(num);
                        }
                      }}
                      onBlur={() => {
                        if (minuteTarget === 0) setMinuteTarget(60);
                      }}
                      keyboardType="numeric"
                      maxLength={3}
                      selectTextOnFocus
                    />
                  </View>
                  <View style={styles.editableStat}>
                    <Text style={[styles.editableStatLabel, sessionCaloriesFromWearable == null && styles.editableStatLabelEst]}>
                      {sessionCaloriesFromWearable == null ? 'CAL *' : 'CAL'}
                    </Text>
                    <TextInput
                      style={[styles.editableStatInput, sessionCaloriesFromWearable == null && styles.editableStatInputEst]}
                      value={editedCalories !== undefined ? String(editedCalories) : String(Math.round(workoutStats.totalDuration * 8))}
                      onChangeText={(text) => {
                        if (text === '') {
                          setEditedCalories(0);
                        } else {
                          const num = parseInt(text, 10);
                          if (!isNaN(num)) setEditedCalories(num);
                        }
                      }}
                      keyboardType="numeric"
                      maxLength={4}
                      selectTextOnFocus
                    />
                  </View>
                  <View style={styles.editableStat}>
                    <Text style={styles.editableStatLabel}>CAL GOAL</Text>
                    <TextInput
                      style={styles.editableStatInput}
                      value={String(calorieTarget)}
                      onChangeText={(text) => {
                        if (text === '') {
                          setCalorieTarget(0);
                        } else {
                          const num = parseInt(text, 10);
                          if (!isNaN(num)) setCalorieTarget(num);
                        }
                      }}
                      onBlur={() => {
                        if (calorieTarget === 0) setCalorieTarget(500);
                      }}
                      keyboardType="numeric"
                      maxLength={4}
                      selectTextOnFocus
                    />
                  </View>
                </View>

                {/* Synced metrics — read-only. Always visible so the block
                    has a stable shape; unsynced values render as em-dashes. */}
                <View style={styles.syncedMetricsRow}>
                  <View style={styles.syncedMetric}>
                    <Text style={[styles.syncedMetricVal, !heartRateRealStats && styles.syncedMetricValMuted]}>
                      {heartRateRealStats ? heartRateRealStats.peak : '—'}
                    </Text>
                    <Text style={styles.syncedMetricKey}>MAX HR</Text>
                  </View>
                  <View style={styles.syncedMetric}>
                    <Text style={[styles.syncedMetricVal, !heartRateRealStats && styles.syncedMetricValMuted]}>
                      {heartRateRealStats ? heartRateRealStats.avg : '—'}
                    </Text>
                    <Text style={styles.syncedMetricKey}>AVG HR</Text>
                  </View>
                  <View style={styles.syncedMetric}>
                    <Text style={[styles.syncedMetricVal, sessionStepsFromWearable == null && styles.syncedMetricValMuted]}>
                      {sessionStepsFromWearable != null ? sessionStepsFromWearable : '—'}
                    </Text>
                    <Text style={styles.syncedMetricKey}>STEPS</Text>
                  </View>
                  <View style={styles.syncedMetric}>
                    <Text style={[styles.syncedMetricVal, sessionHrvFromWearable == null && styles.syncedMetricValMuted]}>
                      {sessionHrvFromWearable != null ? sessionHrvFromWearable : '—'}
                    </Text>
                    <Text style={styles.syncedMetricKey}>HRV</Text>
                  </View>
                </View>

                <Text style={styles.statsPanelFootnote}>
                  {sessionCaloriesFromWearable != null
                    ? 'Calories are real Apple Health data'
                    : '* estimated — sync Apple Health to replace with real numbers'}
                </Text>
                <Text style={styles.statsPanelFootnote}>
                  Tap any number to fine-tune it — goals are saved.
                </Text>

                {/* Single Apple Health action — sync pulls the exact session
                    window first, then falls back to the most recent Apple
                    Watch workout (works even outside 24h). Hidden once live
                    calories are in. */}
                {sessionCaloriesFromWearable == null && (
                  <TouchableOpacity
                    style={styles.statsPanelAction}
                    onPress={resync}
                    disabled={isResyncing}
                    activeOpacity={0.8}
                    testID="achievement-resync"
                  >
                    {isResyncing ? (
                      <ActivityIndicator size="small" color="#FFD700" />
                    ) : (
                      <Ionicons name="refresh" size={14} color="#FFD700" />
                    )}
                    <Text style={styles.statsPanelActionText}>
                      {isResyncing ? 'Syncing…' : 'Sync last workout from Apple Health'}
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Sync found nothing → the likely cause is Health isn't
                    connected. One tap to fix, only shown when relevant. */}
                {sessionCaloriesFromWearable == null && syncCameUpEmpty && (
                  <TouchableOpacity
                    style={styles.statsPanelConnectRow}
                    onPress={() => router.push('/wearable-data')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="heart-circle" size={13} color="#E0A03A" />
                    <Text style={styles.statsPanelConnectText}>
                      No data found — connect Apple Health
                    </Text>
                    <Ionicons name="chevron-forward" size={13} color="#E0A03A" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Hidden opaque capture mirror — single active variant, used for in-post embed */}
              <View style={styles.hiddenCardContainer} ref={statsCardRef} collapsable={false}>
                <WorkoutStatsCard
                  {...workoutStats}
                  editedDuration={editedDuration}
                  editedCalories={editedCalories}
                  calorieTarget={calorieTarget}
                  minuteTarget={minuteTarget}
                  showRingPulse={false}
                  showEquipment={showEquipment}
                  variant={cardVariant}
                  heartRateSamples={heartRateSeries}
                  heartRateRealStats={heartRateRealStats}
                  sessionSteps={sessionStepsFromWearable}
                  sessionHrvSdnn={sessionHrvFromWearable}
                  hasWearableData={
                    !!(heartRateRealStats ||
                       sessionCaloriesFromWearable != null ||
                       sessionStepsFromWearable != null ||
                       sessionHrvFromWearable != null)
                  }
                  onConnectHealthPress={() => router.push('/wearable-data')}
                />
              </View>

              {/* Apple Health connect entry now lives inside the "Your
                  numbers" panel (shown after a sync finds no data). */}

              {/* Hidden transparent card for Instagram export */}
              <View style={styles.hiddenCardContainer} ref={transparentCardRef} collapsable={false}>
                <WorkoutStatsCard 
                  {...workoutStats} 
                  transparent={true}
                  editedDuration={editedDuration}
                  editedCalories={editedCalories}
                  calorieTarget={calorieTarget}
                  minuteTarget={minuteTarget}
                  showEquipment={showEquipment}
                  variant={cardVariant}
                  heartRateSamples={heartRateSeries}
                  heartRateRealStats={heartRateRealStats}
                  sessionSteps={sessionStepsFromWearable}
                  sessionHrvSdnn={sessionHrvFromWearable}
                  hasWearableData={
                    !!(heartRateRealStats ||
                       sessionCaloriesFromWearable != null ||
                       sessionStepsFromWearable != null ||
                       sessionHrvFromWearable != null)
                  }
                />
              </View>
              
            </View>
          )}

          {/* Upload Progress */}
          {uploading && (
            <View style={styles.uploadProgressContainer}>
              <View style={styles.uploadingHeader}>
                <ActivityIndicator size="small" color="#FFD700" />
                <Text style={styles.uploadProgressText}>
                  Posting... {Math.round(uploadProgress)}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${uploadProgress}%` }
                  ]} 
                />
              </View>
            </View>
          )}

          {/* Content Rights Footnote */}
          <Text style={styles.contentRightsFootnote}>
            By uploading, you confirm you own this content or have the rights to use it.
          </Text>

          {/*
            Phase B paid-launch — free session recap footer.
            Only renders when:
              • the user just completed a workout (workoutStats present), AND
              • they're not a paying member / founding member, AND
              • they've consumed their one free live session.
            The "Maybe later" path dismisses silently; the trial CTA fires
            the paywall with `recap_footer_cta` trigger so attribution carries
            through to the eventual `subscription_purchased`.
          */}
          {workoutStats && !hasActiveAccess && hasUsedFreeSession ? (
            <View style={styles.freeSessionFooter} data-testid="free-session-footer">
              <Text style={styles.freeSessionEyebrow}>YOUR FREE SESSION IS COMPLETE</Text>
              <Text style={styles.freeSessionBody}>Next workout requires MOOD Premium.</Text>
              <TouchableOpacity
                style={styles.freeSessionCta}
                onPress={() => openPaywall('recap_footer_cta')}
                data-testid="free-session-trial-cta"
                testID="free-session-trial-cta"
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.freeSessionCtaGradient}
                >
                  <Text style={styles.freeSessionCtaLabel}>Start 7-day free trial →</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.freeSessionSecondary}
                onPress={() => navigateToHome()}
                data-testid="free-session-maybe-later"
                testID="free-session-maybe-later"
              >
                <Text style={styles.freeSessionSecondaryLabel}>Maybe later</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Media source picker — opened by the big "+" */}
      <Modal
        visible={showMediaPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMediaPicker(false)}
      >
        <TouchableOpacity
          style={styles.mpBackdrop}
          activeOpacity={1}
          onPress={() => setShowMediaPicker(false)}
        >
          <View style={styles.mpSheet}>
            <Text style={styles.mpTitle}>ADD TO YOUR POST</Text>
            {([
              { icon: 'image', label: 'Choose photo', fn: pickImages },
              { icon: 'film', label: 'Choose video', fn: pickVideo },
              { icon: 'camera', label: 'Take photo', fn: takePhoto },
              { icon: 'videocam', label: 'Record video', fn: recordVideo },
            ] as const).map((o) => (
              <TouchableOpacity
                key={o.label}
                style={styles.mpRow}
                onPress={() => { setShowMediaPicker(false); o.fn(); }}
              >
                <Ionicons name={o.icon} size={20} color="#F4C316" />
                <Text style={styles.mpRowText}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Full Screen Loading Overlay */}
      {uploading && (
        <Modal
          visible={uploading}
          transparent
          animationType="fade"
        >
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContent}>
              <ActivityIndicator size={40} color="#ffffff" />
              <Text style={styles.loadingTitle}>Posting</Text>
              <Text style={styles.loadingProgress}>{Math.round(uploadProgress)}%</Text>
              <View style={styles.loadingProgressBar}>
                <View 
                  style={[
                    styles.loadingProgressFill, 
                    { width: `${uploadProgress}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Permission Request Modal */}
      <Modal
        visible={showPermissionModal}
        transparent={true}
        animationType='fade'
        onRequestClose={() => setShowPermissionModal(false)}
      >
        <View style={styles.permissionModalOverlay}>
          <View style={styles.permissionModalContent}>
            {/* Icon */}
            <View style={styles.permissionIconContainer}>
              <Ionicons 
                name={permissionType === 'camera' ? 'camera' : 'images'} 
                size={48} 
                color='#FFD700' 
              />
            </View>
            
            {/* Title */}
            <Text style={styles.permissionTitle}>
              {permissionType === 'camera' ? 'Camera Access' : 'Photo Library Access'}
            </Text>
            
            {/* Description */}
            <Text style={styles.permissionDescription}>
              {permissionType === 'camera' 
                ? 'MOOD needs access to your camera to take photos and videos for your workout posts. Your photos are only shared when you choose to post them.'
                : 'MOOD needs access to your photo library to let you select photos and videos for your workout posts. Your photos are only shared when you choose to post them.'
              }
            </Text>
            
            {/* Privacy Note */}
            <View style={styles.permissionPrivacyNote}>
              <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
              <Text style={styles.permissionPrivacyText}>
                Your privacy is important to us
              </Text>
            </View>
            
            {/* Buttons */}
            <View style={styles.permissionButtonsContainer}>
              <TouchableOpacity 
                style={styles.permissionDenyButton}
                onPress={() => setShowPermissionModal(false)}
              >
                <Text style={styles.permissionDenyButtonText}>Not Now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.permissionAllowButton}
                onPress={handlePermissionRequest}
              >
                <Text style={styles.permissionAllowButtonText}>Allow Access</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Crop Modal */}
      {imageToCrop && (
        <ImageCropModal
          visible={showCropModal}
          imageUri={imageToCrop.uri}
          imageWidth={imageToCrop.width}
          imageHeight={imageToCrop.height}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={4 / 5}
        />
      )}
      
      {/* Guest Prompt Modal */}
      <GuestPromptModal
        visible={showGuestPrompt}
        onClose={() => {
          setShowGuestPrompt(false);
          router.back();
        }}
        action='create posts'
      />

      {/* First-workout congrats — one-time, explains the achievement card. */}
      <Modal
        visible={congratsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCongratsVisible(false)}
      >
        <View style={styles.congratsBackdrop}>
          {/* Abstract backdrop — soft gold orbs + faint stars, no card chrome */}
          <View pointerEvents="none" style={styles.congratsGlowOuter} />
          <View pointerEvents="none" style={styles.congratsGlowInner} />
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View style={[styles.congratsStar, { top: '18%', left: '16%' }]} />
            <View style={[styles.congratsStar, { top: '26%', right: '20%' }]} />
            <View style={[styles.congratsStar, { top: '64%', left: '24%' }]} />
            <View style={[styles.congratsStar, { top: '72%', right: '16%' }]} />
            <View style={[styles.congratsStar, { top: '44%', left: '82%' }]} />
          </View>

          <View style={styles.congratsContent}>
            <View style={styles.congratsHairline} />
            <Text style={styles.congratsEyebrow}>FIRST WORKOUT COMPLETE</Text>
            <Text style={styles.congratsTitle}>One down.</Text>
            <Text style={styles.congratsBody}>
              This card is your proof — tune the numbers, then share it.
            </Text>

            <View style={styles.congratsStreakRow}>
              <Ionicons name="flame" size={14} color="#FFD700" />
              <Text style={styles.congratsStreakText}>
                Come back tomorrow to start your streak.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.congratsCta}
              onPress={() => setCongratsVisible(false)}
              activeOpacity={0.85}
              testID="first-workout-congrats-cta"
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.congratsCtaGradient}
              >
                <Text style={styles.congratsCtaLabel}>See my card</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Completion toast — every workout after the first. */}
      <Toast
        message="Workout complete — nice work"
        visible={completionToastVisible}
        onHide={() => setCompletionToastVisible(false)}
        duration={2200}
      />

      {/* Instagram Hand-off Modal — replaces system Alert; has X to dismiss. */}
      <Modal
        visible={igPromptVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIgPromptVisible(false);
          igPromptResolveRef.current?.(false);
          igPromptResolveRef.current = null;
        }}
      >
        <View style={styles.igBackdrop}>
          <View style={styles.igCard}>
            <TouchableOpacity
              style={styles.igClose}
              onPress={() => {
                setIgPromptVisible(false);
                igPromptResolveRef.current?.(false);
                igPromptResolveRef.current = null;
              }}
              hitSlop={12}
              testID="instagram-prompt-close"
            >
              <Ionicons name="close" size={22} color="#999" />
            </TouchableOpacity>

            <Ionicons name="logo-instagram" size={36} color="#FFD700" style={{ marginBottom: 12 }} />
            <Text style={styles.igTitle}>Saved to your photo album</Text>
            <Text style={styles.igBody}>
              {"1.  Open Instagram and start a new Story\n2.  Tap the sticker icon (smiley face)\n3.  Pick \"Add yours\" or the photo sticker\n4.  Choose this overlay from your most recent photos\n5.  Position, post, done."}
            </Text>

            <TouchableOpacity
              style={styles.igCta}
              onPress={() => {
                setIgPromptVisible(false);
                igPromptResolveRef.current?.(true);
                igPromptResolveRef.current = null;
              }}
              activeOpacity={0.85}
              testID="instagram-prompt-open"
            >
              <Text style={styles.igCtaText}>Open Instagram</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cover Options Modal */}
      <Modal
        visible={showCoverPicker && coverPickerVideoIndex >= 0}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowCoverPicker(false);
          setCoverPickerVideoIndex(-1);
        }}
      >
        <TouchableOpacity 
          style={styles.coverModalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowCoverPicker(false);
            setCoverPickerVideoIndex(-1);
          }}
        >
          <View style={styles.coverModalContent}>
            <View style={styles.coverModalHeader}>
              <View style={styles.coverModalHandle} />
              <Text style={styles.coverModalTitle}>Choose Cover Image</Text>
            </View>

            {/* Option 1: Select from Video */}
            {Platform.OS !== 'web' && (
              <TouchableOpacity 
                style={styles.coverOption}
                onPress={() => selectCoverFromVideo(coverPickerVideoIndex)}
              >
                <View style={styles.coverOptionIcon}>
                  <Ionicons name="film-outline" size={24} color="#FFD700" />
                </View>
                <View style={styles.coverOptionText}>
                  <Text style={styles.coverOptionTitle}>Select from Video</Text>
                  <Text style={styles.coverOptionSubtitle}>Choose a frame from your video</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            )}

            {/* Option 2: Choose from Library */}
            <TouchableOpacity 
              style={styles.coverOption}
              onPress={() => selectCoverFromLibrary(coverPickerVideoIndex)}
            >
              <View style={styles.coverOptionIcon}>
                <Ionicons name="images-outline" size={24} color="#FFD700" />
              </View>
              <View style={styles.coverOptionText}>
                <Text style={styles.coverOptionTitle}>Choose from Library</Text>
                <Text style={styles.coverOptionSubtitle}>Select a photo from your gallery</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity 
              style={styles.coverCancelButton}
              onPress={() => {
                setShowCoverPicker(false);
                setCoverPickerVideoIndex(-1);
              }}
            >
              <Text style={styles.coverCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Video Frame Selector Modal */}
      <Modal
        visible={showVideoFrameSelector && videoForFrameSelection !== null}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleFrameSelectorCancel}
      >
        {videoForFrameSelection && (
          <VideoFrameSelector
            videoUri={videoForFrameSelection.uri}
            onFrameSelected={handleFrameSelected}
            onCancel={handleFrameSelectorCancel}
            currentCover={selectedMedia[videoForFrameSelection.index]?.coverUri}
          />
        )}
      </Modal>

      {/* Onboarding Overlay — Tip 3 (Share Your Achievement walkthrough) */}
      <OnboardingOverlay
        visible={completionTipActive}
        onTapAnywhere={() => completeCompletionTip('tap')}
        onNeverShow={() => completeCompletionTip('never')}
        targets={[
          {
            rect: targetRects.media,
            placement: 'above',
            icon: 'image-outline',
            title: 'Add your media',
            body: 'Tap here to upload a photo or video from your workout.',
          },
          {
            rect: targetRects.stats,
            placement: 'above',
            icon: 'trophy-outline',
            title: 'Your achievement card',
            body: 'Tappable in MOOD — friends can copy the workout. Shareable as a transparent overlay on IG & socials. Logs your time, calories & heart rate.',
          },
        ]}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.15)',
    backgroundColor: '#0a0a0a',
  },
  closeButton: {
    padding: 4,
    width: 50,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  postButton: {
    backgroundColor: '#FFD700',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.4,
  },
  scrollView: {
    flex: 1,
  },
  attachmentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  attachmentsLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  attachmentCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  feedIntro: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
  },
  feedIntroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  feedIntroTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F3F3F3',
    letterSpacing: 0.2,
  },
  feedIntroSub: {
    fontSize: 12.5,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.62)',
    marginTop: 4,
  },
  feedMediaCard: {
    marginBottom: 6, // sit tight to the caption below — one combined block
  },
  // ── "Your numbers" consolidated panel ──
  statsPanel: {
    backgroundColor: '#141417',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  statsPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statsPanelTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.3,
  },
  statsPanelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statsPanelBadgeLive: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  statsPanelBadgeEst: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E0A03A',
  },
  syncedMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  syncedMetric: {
    alignItems: 'center',
    gap: 2,
  },
  syncedMetricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  syncedMetricValMuted: {
    color: 'rgba(255,255,255,0.3)',
  },
  syncedMetricKey: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.45)',
  },
  statsPanelFootnote: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 8,
  },
  statsPanelAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.35)',
  },
  statsPanelActionText: {
    fontSize: 12.5,
    color: '#FFD700',
    fontWeight: '600',
  },
  statsPanelConnectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 8,
    paddingVertical: 4,
  },
  statsPanelConnectText: {
    fontSize: 11.5,
    color: '#E0A03A',
    fontWeight: '600',
  },
  editableStatLabelEst: {
    color: '#E0A03A',
  },
  editableStatInputEst: {
    color: '#E0A03A',
    borderColor: 'rgba(224,160,58,0.45)',
  },
  congratsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(4,4,5,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  congratsGlowOuter: {
    position: 'absolute',
    top: '22%',
    alignSelf: 'center',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(255,170,50,0.05)',
  },
  congratsGlowInner: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,195,60,0.08)',
  },
  congratsStar: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  congratsContent: {
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  congratsHairline: {
    width: 36,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#FFD700',
    marginBottom: 22,
  },
  congratsEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3.2,
    color: 'rgba(255,215,0,0.9)',
    marginBottom: 14,
  },
  congratsTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1.2,
    marginBottom: 12,
    textAlign: 'center',
  },
  congratsBody: {
    fontSize: 14.5,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    marginBottom: 22,
  },
  congratsStreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.28)',
    marginBottom: 30,
  },
  congratsStreakText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
  },
  congratsCta: {
    borderRadius: 14,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  congratsCtaGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  congratsCtaLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0c0c0c',
    letterSpacing: 0.2,
  },
  dataChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: '92%',
  },
  dataChipReal: {
    // Green check carries the state — no green shading behind it.
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  dataChipEst: {
    backgroundColor: 'rgba(224,160,58,0.10)',
    borderColor: 'rgba(224,160,58,0.35)',
  },
  dataChipText: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  dataChipTextEst: {
    fontSize: 11.5,
    color: '#E0A03A',
    fontWeight: '600',
  },
  bigAddTile: {
    width: 120,
    height: 120,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(244,195,22,0.35)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginRight: 10,
  },
  bigAddText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  captionInline: {
    marginTop: 10,
    minHeight: 34,
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: 'top',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
    paddingBottom: 4,
  },
  mpBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  mpSheet: {
    backgroundColor: '#161618',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 28,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mpTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingVertical: 10,
  },
  mpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  mpRowText: {
    fontSize: 16,
    color: '#F3F3F3',
    fontWeight: '500',
  },
  attachmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  attachmentLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  attachmentType: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  instagramButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    // Border + glow intentionally removed per design spec — the IG button
    // now relies solely on its IG-brand gradient fill for affordance.
  },
  instagramButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  instagramButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.6,
  },
  editableStatsHintRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  editableStatsHint: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
  },
  editableStatsOptional: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.25)',
    fontStyle: 'italic',
  },
  editableStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
    paddingVertical: 4,
  },
  editableStat: {
    width: '50%',
    paddingRight: 10,
    gap: 5,
  },
  editableStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  editableStatInput: {
    alignSelf: 'stretch',
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: 40,
  },
  hiddenCardContainer: {
    position: 'absolute',
    left: -9999,
    top: 0,
    backgroundColor: 'transparent', // CRITICAL: ensures PNG export has no background
  },
  saveCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    minWidth: 76,
  },
  equipBubble: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: 'transparent',
  },
  equipBubbleOn: {
    borderColor: '#FFD700',
    backgroundColor: '#FFD700',
  },
  saveCardButtonSaved: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  saveButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  savedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
  },
  statsCardWrapper: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: '#000',
  },
  resyncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.35)',
  },
  resyncText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  variantScroll: {
    width: SCREEN_WIDTH,
    alignSelf: 'center',
  },
  variantScrollContent: {
    alignItems: 'center',
  },
  variantDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 14,
  },
  variantDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  variantDotActive: {
    backgroundColor: '#FFD700',
    width: 18,
  },
  saveExplanation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 10,
  },
  saveExplanationText: {
    flex: 1,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 16,
  },
  equipmentToggleOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    zIndex: 10,
  },
  equipmentToggleTrack: {
    width: 28,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  equipmentToggleTrackOn: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  equipmentToggleThumb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#666',
  },
  equipmentToggleThumbOn: {
    alignSelf: 'flex-end',
    backgroundColor: '#bbb',
  },
  equipmentToggleLabel: {
    fontSize: 10,
    color: '#aaa',
    letterSpacing: 0.1,
  },
  cardWithToggleContainer: {
    position: 'relative',
  },
  attachmentHint: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  imageScroll: {
    marginTop: 4,
  },
  imageScrollContent: {
    paddingRight: 12,
    gap: 8,
  },
  addImageButton: {
    width: 64,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  addImageIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  addImageText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    position: 'relative',
    marginRight: 10,
  },
  videoPreviewContainer: {
    position: 'relative',
    width: 80,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  videoNumber: {
    backgroundColor: '#FF6B6B',
  },
  imagePreview: {
    width: 80,
    height: 100, // 4:5 aspect ratio to match final display
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#000',
    borderRadius: 11,
  },
  setCoverButton: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  setCoverButtonText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
  },
  imageNumber: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageNumberText: {
    color: '#000',
    fontSize: 11,
    fontWeight: 'bold',
  },
  reorderButtons: {
    position: 'absolute',
    top: '50%',
    flexDirection: 'row',
    gap: 8,
    transform: [{ translateY: -15 }],
    left: 10,
  },
  reorderButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  emptyText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  captionSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
    padding: 14,
  },
  captionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  captionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  captionInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 12,
    padding: 10,
    color: '#fff',
    fontSize: 15,
    minHeight: 44,
    textAlignVertical: 'top',
  },
  captionCounter: {
    color: '#666',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 6,
  },
  // Saved Achievements Styles - Premium Design
  savedAchievementsHint: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  savedAchievementsScroll: {
    marginHorizontal: -4,
  },
  savedAchievementsContent: {
    paddingHorizontal: 4,
    gap: 10,
  },
  savedAchievementCard: {
    width: 160,
    backgroundColor: '#111',
    borderRadius: 16,
    overflow: 'hidden',
  },
  achievementAccentLine: {
    height: 2.5,
    backgroundColor: '#FFD700',
  },
  achievementCardContent: {
    padding: 14,
    paddingTop: 12,
  },
  achievementHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  achievementDateLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  achievementTrophyBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementMoodLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.3,
    marginBottom: 10,
    lineHeight: 22,
  },
  achievementStatsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'nowrap',
  },
  achievementStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  achievementStatPillText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '500',
  },
  achievementWorkoutPreview: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
  },
  achievementWorkoutName: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    marginBottom: 3,
  },
  achievementWorkoutMore: {
    color: 'rgba(255, 215, 0, 0.6)',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  // Legacy styles kept for compatibility
  achievementMainStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  achievementDurationValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  achievementDurationUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.45)',
    marginLeft: 3,
  },
  achievementStatsPills: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  savedAchievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  savedAchievementDuration: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  savedAchievementDate: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    marginBottom: 6,
  },
  savedAchievementExercises: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  loadingSavedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 20,
  },
  loadingSavedText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 13,
  },
  uploadProgressContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  uploadingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  uploadProgressText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  bottomSpacer: {
    height: 40,
  },
  contentRightsFootnote: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  // Phase B free-session recap footer
  freeSessionFooter: {
    marginTop: 24,
    marginHorizontal: 16,
    padding: 22,
    borderRadius: 16,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.18)',
    alignItems: 'center',
  },
  freeSessionEyebrow: {
    fontSize: 11,
    letterSpacing: 1.8,
    color: '#FFD700',
    fontWeight: '700',
    marginBottom: 10,
  },
  freeSessionBody: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: 18,
  },
  freeSessionCta: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 6,
  },
  freeSessionCtaGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  freeSessionCtaLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0c0c0c',
    letterSpacing: 0.3,
  },
  freeSessionSecondary: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  freeSessionSecondaryLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  // Loading Overlay Styles
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minWidth: 180,
  },
  loadingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 16,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  loadingProgress: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 16,
  },
  loadingProgressBar: {
    width: 140,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingProgressFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 2,
  },
  // Permission Modal Styles
  permissionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  permissionIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  permissionPrivacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  permissionPrivacyText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '500',
  },
  permissionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  permissionDenyButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  permissionDenyButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionAllowButton: {
    flex: 1,
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  permissionAllowButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  // Cover Options Modal Styles
  coverModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  coverModalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  coverModalHeader: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  coverModalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    marginBottom: 12,
  },
  coverModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  coverOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  coverOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverOptionText: {
    flex: 1,
  },
  coverOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  coverOptionSubtitle: {
    fontSize: 13,
    color: '#888',
  },
  coverCancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  coverCancelText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '500',
  },
  // Instagram hand-off prompt
  igBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  igCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0a0a0a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.18)',
    paddingTop: 26,
    paddingBottom: 22,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  igClose: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  igTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  igBody: {
    color: '#c8c8c8',
    fontSize: 13,
    lineHeight: 22,
    textAlign: 'left',
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  igCta: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 999,
  },
  igCtaText: {
    color: '#0c0c0c',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // === Connect Apple Health CTA (post-workout achievement screen) ===
  // Shown immediately under the achievement card when this session
  // captured zero wearable metrics. Tapping opens /wearable-data which
  // owns the permission grant flow.
  connectHealthBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    // NOTE: never gold-on-gold. Dark surface + light text, single gold icon accent.
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    borderRadius: 14,
    gap: 12,
  },
  connectHealthIcon: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectHealthBody: {
    flex: 1,
  },
  connectHealthTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F3F3F3',
    letterSpacing: 0.2,
  },
  connectHealthSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
    marginTop: 2,
    lineHeight: 14,
  },
});
