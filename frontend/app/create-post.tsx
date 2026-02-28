import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, router as globalRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Video, ResizeMode } from 'expo-av';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkoutStatsCard from '../components/WorkoutStatsCard';
import { useAuth } from '../contexts/AuthContext';
import { Analytics } from '../utils/analytics';
import ImageCropModal from '../components/ImageCropModal';
import GuestPromptModal from '../components/GuestPromptModal';
import VideoFrameSelector from '../components/VideoFrameSelector';
import InstagramShareModal from '../components/InstagramShareModal';
import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient';

// Safely import native modules that can crash on production iOS builds
let captureRef: any = null;
let Share: any = null;

try {
  captureRef = require('react-native-view-shot').captureRef;
} catch (error) {
  console.warn('react-native-view-shot not available:', error);
}

try {
  Share = require('react-native-share').default;
} catch (error) {
  console.warn('react-native-share not available:', error);
}

import { API_URL } from '../utils/apiConfig';
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
  const [caption, setCaption] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null);
  const [hasStatsCard, setHasStatsCard] = useState(false);
  const [saveButtonPressed, setSaveButtonPressed] = useState(false);
  const statsCardRef = useRef(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  
  // Editable stats
  const [editedDuration, setEditedDuration] = useState<number | undefined>(undefined);
  const [editedCalories, setEditedCalories] = useState<number | undefined>(undefined);
  
  // Editable targets for donut rings
  const [calorieTarget, setCalorieTarget] = useState(500);
  const [minuteTarget, setMinuteTarget] = useState(60);
  
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
  const [showInstagramShareModal, setShowInstagramShareModal] = useState(false);
  
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
        videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
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
      // Pick video with transcoding enabled to handle slow-mo and ProRes videos
      // Using HighestQuality export preset to transcode problematic formats to H.264
      // This converts slow-mo, ProRes, and HEVC videos to standard H.264 format
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsMultipleSelection: false,
        allowsEditing: false,
        videoMaxDuration: 30, // 30 seconds max
        // Enable transcoding to H.264 - this handles slow-mo, ProRes, HEVC videos
        videoExportPreset: ImagePicker.VideoExportPreset.HighestQuality,
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
    if (!workoutStats || !transparentCardRef.current) {
      showAlert('Error', 'Unable to share. Please try again.');
      return;
    }
    
    setIsExportingToInstagram(true);
    
    try {
      if (Platform.OS === 'web') {
        // For web, use html2canvas and download
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(transparentCardRef.current, {
          backgroundColor: null, // Transparent background
          scale: 2,
          logging: false,
          useCORS: true,
        });
        const imageUri = canvas.toDataURL('image/png');
        
        // On web, download the image
        const link = document.createElement('a');
        link.download = `mood_workout_${Date.now()}.png`;
        link.href = imageUri;
        link.click();
        
        showAlert('Image Downloaded', 'Your workout overlay has been downloaded. Open Instagram Stories and add it as a sticker on your photo!');
      } else {
        // For native (iOS/Android), use direct Instagram Stories share
        await shareToInstagramStoriesDirect();
      }
    } catch (error) {
      console.error('Error sharing to Instagram:', error);
      showAlert('Error', 'Failed to create Instagram share image. Please try again.');
    } finally {
      setIsExportingToInstagram(false);
      setShowInstagramShareModal(false);
    }
  };

  // Direct share to Instagram Stories - opens IG immediately like CapCut
  const shareToInstagramStoriesDirect = async () => {
    if (!transparentCardRef.current) {
      throw new Error('No card to capture');
    }
    
    // Check if captureRef is available
    if (!captureRef) {
      showAlert('Feature Unavailable', 'Screen capture is not available on this device.');
      return;
    }

    // Check if Instagram is installed
    const canOpen = await Linking.canOpenURL('instagram-stories://share');
    if (!canOpen) {
      showAlert('Instagram Not Installed', 'Please install Instagram to share stories directly.');
      // Fall back to regular share sheet
      const imageUri = await captureRef(transparentCardRef.current, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
        bgColor: '#00000000',
      });
      return;
    }

    // 1) Capture overlay WITH transparency
    const uri = await captureRef(transparentCardRef.current, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
      bgColor: '#00000000',
    });

    // 2) Convert to base64 data URI for react-native-share
    const b64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const stickerImage = `data:image/png;base64,${b64}`;

    // 3) Share directly to IG Stories (skips iOS share sheet screens)
    try {
      // Check if Share module is available
      if (!Share) {
        // Fall back to expo-sharing
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share your workout achievement',
            UTI: 'public.png',
          });
        }
        return;
      }
      
      await Share.shareSingle({
        social: Share.Social.INSTAGRAM_STORIES,
        stickerImage,
        backgroundTopColor: '#000000',
        backgroundBottomColor: '#000000',
      });
    } catch (error: any) {
      // If shareSingle fails (e.g., user cancelled), don't show error
      if (error?.message?.includes('User did not share')) {
        console.log('User cancelled Instagram share');
        return;
      }
      throw error;
    }
  };

  // Legacy helper (kept for backwards compatibility, but not used)
  const shareToInstagramStories = async (imageUri: string): Promise<boolean> => {
    try {
      // Check if Instagram is installed
      const instagramUrl = Platform.OS === 'ios' 
        ? 'instagram-stories://share' 
        : 'instagram://story-camera';
      
      const canOpenInstagram = await Linking.canOpenURL(instagramUrl);
      
      if (!canOpenInstagram) {
        console.log('Instagram is not installed');
        return false;
      }
      
      if (Platform.OS === 'ios') {
        // iOS: Read the image and convert to base64 for sharing
        const imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // iOS Instagram Stories deep link with sticker
        // The image will be passed via the URL scheme
        // Note: For full functionality, the app needs to be registered with Facebook
        // For now, we'll use a workaround by opening Instagram Stories and letting user paste
        
        // Try opening Instagram Stories directly
        const instagramStoriesUrl = `instagram-stories://share?source_application=com.mood.fitness`;
        
        try {
          await Linking.openURL(instagramStoriesUrl);
          
          // Show instruction to user since we can't directly paste the sticker without native module
          setTimeout(() => {
            showAlert(
              'Add Your Workout Overlay', 
              'Instagram Stories is opening. Your workout card has been saved - tap the sticker icon and select it from your recent images to add it as an overlay!'
            );
          }, 500);
          
          // Save the image to camera roll so user can access it
          // This requires expo-media-library, but for now we'll rely on the temp file
          return true;
        } catch (e) {
          console.log('Failed to open Instagram Stories URL:', e);
          return false;
        }
      } else if (Platform.OS === 'android') {
        // Android: Use Intent to share directly to Instagram Stories
        try {
          // For Android, we can use the share intent with Instagram package
          const intentUrl = `intent://share#Intent;` +
            `package=com.instagram.android;` +
            `S.browser_fallback_url=https://www.instagram.com;` +
            `end`;
          
          // Try opening Instagram Stories camera directly
          const opened = await Linking.openURL('instagram://story-camera');
          
          if (opened) {
            setTimeout(() => {
              showAlert(
                'Add Your Workout Overlay',
                'Instagram Stories is opening. Add your workout card from your gallery as a sticker overlay!'
              );
            }, 500);
            return true;
          }
        } catch (e) {
          console.log('Failed to open Instagram on Android:', e);
        }
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('Error in shareToInstagramStories:', error);
      return false;
    }
  };

  const navigateToHome = () => {
    console.log('navigateToHome called - starting navigation...');
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        console.log('Platform is web, using window.location');
        console.log('Current URL:', window.location.href);
        // Navigate to the mood cards screen (tabs/index)
        window.location.href = '/(tabs)';
        console.log('window.location.href set to /(tabs)');
      } else {
        console.log('Platform is native, using router.replace');
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Navigation error:', error);
      if (router.canGoBack()) {
        console.log('Trying router.back()');
        router.back();
      }
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
            onPress={handleCreatePost}
            disabled={uploading || (!caption.trim() && selectedImages.length === 0 && !hasStatsCard)}
            activeOpacity={0.7}
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

          {/* 1. Media Picker Section - FIRST */}
          <View style={styles.attachmentCard}>
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
              {/* Take Photo Button (Camera) */}
              <TouchableOpacity 
                style={styles.addImageButton}
                onPress={takePhoto}
                disabled={selectedMedia.length >= (hasStatsCard ? 4 : 5)}
              >
                <View style={styles.addImageIconContainer}>
                  <Ionicons name="camera" size={18} color="rgba(255, 255, 255, 0.7)" />
                </View>
                <Text style={styles.addImageText}>Camera</Text>
              </TouchableOpacity>

              {/* Choose Photo Button */}
              <TouchableOpacity 
                style={styles.addImageButton}
                onPress={pickImages}
                disabled={selectedMedia.length >= (hasStatsCard ? 4 : 5)}
              >
                <View style={styles.addImageIconContainer}>
                  <Ionicons name="image" size={18} color="rgba(255, 255, 255, 0.7)" />
                </View>
                <Text style={styles.addImageText}>Photo</Text>
              </TouchableOpacity>

              {/* Record Video Button (Camera) */}
              <TouchableOpacity 
                style={styles.addImageButton}
                onPress={recordVideo}
                disabled={selectedMedia.length >= (hasStatsCard ? 4 : 5)}
              >
                <View style={styles.addImageIconContainer}>
                  <Ionicons name="videocam" size={18} color="rgba(255, 255, 255, 0.7)" />
                </View>
                <Text style={styles.addImageText}>Record</Text>
              </TouchableOpacity>

              {/* Choose Video Button */}
              <TouchableOpacity 
                style={styles.addImageButton}
                onPress={pickVideo}
                disabled={selectedMedia.length >= (hasStatsCard ? 4 : 5)}
              >
                <View style={styles.addImageIconContainer}>
                  <Ionicons name="film" size={18} color='rgba(255, 255, 255, 0.7)' />
                </View>
                <Text style={styles.addImageText}>Video</Text>
              </TouchableOpacity>

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
            
            {selectedMedia.length === 0 && (
              <Text style={styles.emptyText}>Optional: Add photos or videos (max 60s) to your post</Text>
            )}
          </View>

          {/* 2. Caption Input - SECOND */}
          <View style={styles.captionSection}>
            <View style={styles.captionHeader}>
              <Ionicons name="create-outline" size={20} color="#FFD700" />
              <Text style={styles.captionLabel}>Caption</Text>
            </View>
            <TextInput
              style={styles.captionInput}
              placeholder="Share your thoughts... (use #hashtags)"
              placeholderTextColor="#666"
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={4}
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
                          {achievement.workouts.slice(0, 2).map((workout: any, wIndex: number) => (
                            <Text key={wIndex} style={styles.achievementWorkoutName} numberOfLines={1}>
                              {workout.workoutName || workout.workoutTitle}
                            </Text>
                          ))}
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
                <View style={styles.attachmentLabelContainer}>
                  <Ionicons name="trophy" size={16} color="#FFD700" />
                  <Text style={styles.attachmentType}>Achievement</Text>
                </View>
                <View style={styles.actionButtonsRow}>
                  {/* Instagram Share Button - Uses Instagram gradient colors */}
                  <TouchableOpacity 
                    onPress={() => setShowInstagramShareModal(true)} 
                    style={styles.instagramButtonWrapper}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#833AB4', '#FD1D1D', '#F77737']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.instagramButtonGradient}
                    >
                      <Ionicons name="logo-instagram" size={18} color="#fff" />
                      <Text style={styles.instagramButtonText}>Stories</Text>
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
                        <Text style={styles.savedText}>Saved</Text>
                      ) : (
                        <>
                          <Ionicons name="bookmark-outline" size={18} color="#FFD700" />
                          <Text style={styles.saveButtonText}>Save</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </View>
              
              {/* Editable Stats Row */}
              <View style={styles.editableStatsHintRow}>
                <Text style={styles.editableStatsHint}>Adjust values & targets </Text>
                <Text style={styles.editableStatsOptional}>(optional, goals are saved)</Text>
              </View>
              <View style={styles.editableStatsRow}>
                <View style={styles.editableStat}>
                  <Text style={styles.editableStatLabel}>Min</Text>
                  <TextInput
                    style={styles.editableStatInput}
                    value={editedDuration !== undefined ? String(editedDuration) : String(workoutStats.totalDuration)}
                    onChangeText={(text) => {
                      // Allow empty input while editing
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
                  <Text style={styles.editableStatLabel}>Cal</Text>
                  <TextInput
                    style={styles.editableStatInput}
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
                  <Text style={styles.editableStatLabel}>Cal Goal</Text>
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
                      // Restore default if user left it empty
                      if (calorieTarget === 0) setCalorieTarget(500);
                    }}
                    keyboardType="numeric"
                    maxLength={4}
                    selectTextOnFocus
                  />
                </View>
                <View style={styles.editableStat}>
                  <Text style={styles.editableStatLabel}>Min Goal</Text>
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
                      // Restore default if user left it empty
                      if (minuteTarget === 0) setMinuteTarget(60);
                    }}
                    keyboardType="numeric"
                    maxLength={3}
                    selectTextOnFocus
                  />
                </View>
              </View>
              
              <View style={styles.statsCardWrapper} ref={statsCardRef} collapsable={false}>
                <WorkoutStatsCard 
                  {...workoutStats} 
                  editedDuration={editedDuration}
                  editedCalories={editedCalories}
                  calorieTarget={calorieTarget}
                  minuteTarget={minuteTarget}
                  showRingPulse={true}
                />
              </View>
              
              {/* Hidden transparent card for Instagram export */}
              <View style={styles.hiddenCardContainer} ref={transparentCardRef} collapsable={false}>
                <WorkoutStatsCard 
                  {...workoutStats} 
                  transparent={true}
                  editedDuration={editedDuration}
                  editedCalories={editedCalories}
                  calorieTarget={calorieTarget}
                  minuteTarget={minuteTarget}
                />
              </View>
              
              <View style={styles.saveExplanation}>
                <Ionicons name="information-circle-outline" size={14} color="rgba(255, 215, 0, 0.7)" />
                <Text style={styles.saveExplanationText}>
                  Tap Save to keep this card in your Profile without posting
                </Text>
              </View>
              <Text style={styles.attachmentHint}>
                👆 This will appear as the last item in your post
              </Text>
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

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

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

      {/* Instagram Share Modal */}
      {workoutStats && (
        <InstagramShareModal
          visible={showInstagramShareModal}
          onClose={() => setShowInstagramShareModal(false)}
          onShare={() => {
            handleShareToInstagram();
          }}
          previewComponent={
            <WorkoutStatsCard
              workouts={workoutStats.workouts}
              totalDuration={editedDuration !== undefined ? editedDuration : workoutStats.totalDuration}
              editedCalories={editedCalories !== undefined ? editedCalories : Math.round(workoutStats.totalDuration * 8)}
              completedAt={workoutStats.completedAt}
              moodCategory={workoutStats.moodCategory}
              username={user?.username || 'User'}
              calorieTarget={calorieTarget}
              minuteTarget={minuteTarget}
              transparent={true}
            />
          }
          isExporting={isExportingToInstagram}
        />
      )}
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
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#833AB4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  instagramButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  instagramButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
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
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  editableStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editableStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  editableStatInput: {
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
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    minWidth: 80,
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
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 6,
    backgroundColor: '#000',
    borderRadius: 0,
    overflow: 'hidden',
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
    padding: 14,
    color: '#fff',
    fontSize: 15,
    minHeight: 100,
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
  achievementWorkoutPreview: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
  },
  achievementWorkoutName: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    lineHeight: 14,
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
});
