import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Modal,
  Dimensions,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
// REMOVED: expo-video-thumbnails - causes crashes on production iOS builds
// Use the VideoThumbnail component instead which has safe fallbacks
import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkoutStatsCard from '../../components/WorkoutStatsCard';
import VideoThumbnail from '../../components/VideoThumbnail';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useBadges } from '../../contexts/BadgeContext';
import { useDrafts } from '../../contexts/DraftsContext';
import FollowListModal from '../../components/FollowListModal';
import { useScreenTime } from '../../hooks/useScreenTime';
import { GridItemSkeleton, ProfileHeaderSkeleton } from '../../components/Skeleton';
import GuestPromptModal from '../../components/GuestPromptModal';

// Prioritize process.env for development/preview environments
import { API_URL } from '../../utils/apiConfig';
const { width } = Dimensions.get('window');


// External URLs for legal pages
const EXTERNAL_URLS = {
  termsOfService: 'https://www.officialmood.app/terms-of-service',
  privacyPolicy: 'https://www.officialmood.app/privacy-policy',
  support: 'https://www.officialmood.app/support',
};

// Mapping of featured workout names to their IDs
const FEATURED_WORKOUT_IDS: { [key: string]: string } = {
  'Sweat / Burn Fat - Cardio Based': '1',
  'Muscle Gainer - Back & Bis Volume': '2',
  'Sweat / Burn Fat - HIIT - Intense Full Body': '6',
  'Build Explosion - Power Lifting': '3',
  'Calisthenics - Pulls & Dips': '4',
  'Get Outside - Hill Workout': '5',
};

interface UserStats {
  workouts: number;
  followers: number;
  following: number;
  streak: number;
}

interface RecentWorkout {
  id: string;
  title: string;
  mood: string;
  duration: number;
  date: string;
}

interface Post {
  id: string;
  media_urls: string[];
  cover_urls?: { [key: string]: string }; // Map of media index to cover image URL
  thumbnail_url?: string | null; // Canonical thumbnail for grid (server-derived for videos)
  media_type?: string | null; // "video" | "image" | null
  caption: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

interface WorkoutCard {
  id: string;
  workouts: {
    workoutName: string;
    workoutTitle?: string;
    equipment: string;
    duration: string;
    difficulty: string;
    battlePlan?: string;
    imageUrl?: string;
    description?: string;
    intensityReason?: string;
    moodCategory?: string;
    moodTips?: any[];
  }[];
  totalDuration: number;
  completedAt: string;
  created_at: string;
  moodCategory?: string;
  workoutSnapshotId?: string;
}

interface SavedWorkout {
  id: string;
  name: string;
  workouts: {
    name: string;
    equipment: string;
    duration: string;
    difficulty: string;
    description?: string;
    battlePlan?: string;
    imageUrl?: string;
    intensityReason?: string;
    workoutType?: string;
    moodCard?: string;
    moodTips?: any[];
  }[];
  total_duration: number;
  source: string;
  featured_workout_id?: string;
  mood?: string;
  title?: string;
  created_at: string;
}

interface SavedPost {
  id: string;
  author: {
    id: string;
    username: string;
    name: string;
    avatar: string;
  };
  caption: string;
  media_urls: string[];
  likes_count: number;
  comments_count: number;
  saved_at: string;
}

export default function Profile() {
  // Track screen time
  useScreenTime('Profile');
  
  const [user, setUser] = useState({
    id: 'current-user',
    username: 'your_username',
    name: 'Your Name',
    bio: 'Fitness enthusiast • Living my best life • Let\'s get stronger together 💪',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=face',
    isVerified: false,
  });

  const [stats, setStats] = useState<UserStats>({
    workouts: 0,
    followers: 0,
    following: 0,
    streak: 0,
  });

  const [recentWorkouts] = useState<RecentWorkout[]>([]);
  const [workoutCards, setWorkoutCards] = useState<WorkoutCard[]>([]);
  const [savedWorkouts, setSavedWorkouts] = useState<SavedWorkout[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [loadingSavedPosts, setLoadingSavedPosts] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [selectedCard, setSelectedCard] = useState<WorkoutCard | null>(null);
  const [selectedSavedWorkout, setSelectedSavedWorkout] = useState<SavedWorkout | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [savedModalVisible, setSavedModalVisible] = useState(false);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postsError, setPostsError] = useState(false);
  const [followListVisible, setFollowListVisible] = useState(false);
  const [followListType, setFollowListType] = useState<'followers' | 'following'>('followers');
  const [refreshing, setRefreshing] = useState(false);
  const { token, user: authUser, updateUser, isGuest, exitGuestMode } = useAuth();
  const { addToCart } = useCart();
  const { unreadMessages, refreshBadges } = useBadges();
  const { activeCount: savedBuildsCount, refreshCount: refreshDraftsCount } = useDrafts();

  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'cards'>('posts');
  const router = useRouter();

  // Pull to refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchUserProfile(),
      fetchUserPosts(),
    ]);
    // Refresh badge counts from shared context
    refreshBadges();
    setRefreshing(false);
  }, [token, authUser?.id, refreshBadges]);

  // Load user profile when token is available
  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token]);

  // Refetch profile data when screen comes into focus (with debounce)
  const lastFocusFetch = React.useRef(0);
  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        const now = Date.now();
        // Debounce: only fetch if last fetch was more than 5 seconds ago
        if (now - lastFocusFetch.current > 5000) {
          lastFocusFetch.current = now;
          fetchUserProfile();
          // Fetch posts only if on posts tab
          if (activeTab === 'posts' && authUser?.id) {
            fetchUserPosts();
          }
        }
      }
    }, [token, activeTab, authUser?.id])
  );

  // Sync with AuthContext user data when it changes
  useEffect(() => {
    if (authUser) {
      // Fix avatar URL if it doesn't include the backend URL
      let avatarUrl = authUser.avatar || '';
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        avatarUrl = avatarUrl.startsWith('/') ? `${API_URL}${avatarUrl}` : `${API_URL}/api/uploads/${avatarUrl}`;
      }
      
      setUser({
        id: authUser.id,
        username: authUser.username,
        name: authUser.name || authUser.username,
        bio: authUser.bio || '',
        avatar: avatarUrl,
        isVerified: false,
      });
      setStats({
        workouts: authUser.workouts_count || 0,
        followers: authUser.followers_count || 0,
        following: authUser.following_count || 0,
        streak: authUser.current_streak || 0,
      });
    }
  }, [authUser]);

  // Load workout cards when Cards tab is selected
  useEffect(() => {
    if (activeTab === 'cards' && token) {
      fetchWorkoutCards();
    }
  }, [activeTab, token]);

  // Load saved workouts and posts when Saved tab is selected
  useEffect(() => {
    if (activeTab === 'saved' && token) {
      fetchSavedWorkouts();
      fetchSavedPosts();
    }
  }, [activeTab, token]);

  // Load user posts when Posts tab is selected or user is loaded
  useEffect(() => {
    if (activeTab === 'posts' && token && authUser?.id) {
      fetchUserPosts();
    }
  }, [activeTab, token, authUser?.id]);

  const fetchUserProfile = async () => {
    if (!token) {
      console.log('No token available for profile');
      setLoadingProfile(false);
      return;
    }

    try {
      console.log('Fetching user profile from:', `${API_URL}/api/users/me`);
      const response = await fetch(`${API_URL}/api/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Profile fetch response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Profile data loaded:', data.username);
        
        // Fix avatar URL if it doesn't include the backend URL
        let avatarUrl = data.avatar || '';
        if (avatarUrl && !avatarUrl.startsWith('http')) {
          avatarUrl = avatarUrl.startsWith('/') ? `${API_URL}${avatarUrl}` : `${API_URL}/api/uploads/${avatarUrl}`;
        }
        
        setUser({
          id: data.id,
          username: data.username,
          name: data.name || data.username,
          bio: data.bio || '',
          avatar: avatarUrl,
          isVerified: false,
        });
        setStats({
          workouts: data.workouts_count || 0,
          followers: data.followers_count || 0,
          following: data.following_count || 0,
          streak: data.current_streak || 0,
        });
        // Also update the AuthContext with the fetched data
        updateUser({
          username: data.username,
          name: data.name,
          bio: data.bio,
          avatar: data.avatar,
          followers_count: data.followers_count || 0,
          following_count: data.following_count || 0,
          workouts_count: data.workouts_count || 0,
          current_streak: data.current_streak || 0,
        });
      } else {
        console.error('Failed to fetch profile:', response.status);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchWorkoutCards = async () => {
    setLoadingCards(true);
    try {
      console.log('Fetching workout cards...');
      const response = await fetch(`${API_URL}/api/workout-cards`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Workout cards response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched workout cards:', data);
        
        // Transform snake_case to camelCase for frontend
        const transformedData = data.map((card: any) => ({
          id: card.id,
          workouts: card.workouts.map((w: any) => ({
            workoutName: w.workoutName || w.workout_name || w.workoutTitle || w.workout_title,
            workoutTitle: w.workoutTitle || w.workout_title || w.workoutName || w.workout_name,
            equipment: w.equipment,
            duration: w.duration,
            difficulty: w.difficulty,
            battlePlan: w.battlePlan || w.battle_plan,
            imageUrl: w.imageUrl || w.image_url,
            description: w.description,
            intensityReason: w.intensityReason || w.intensity_reason,
            moodCategory: w.moodCategory || w.mood_category,
            moodTips: w.moodTips || w.mood_tips,
          })),
          totalDuration: card.total_duration,
          completedAt: card.completed_at,
          created_at: card.created_at,
          moodCategory: card.mood_category,
          workoutSnapshotId: card.workout_snapshot_id, // CRITICAL: Include snapshot ID for "Try this workout"
        }));
        
        console.log('Transformed cards with snapshot IDs:', transformedData.map((c: any) => ({ id: c.id, snapshotId: c.workoutSnapshotId })));
        setWorkoutCards(transformedData);
      } else {
        console.error('Failed to fetch workout cards:', response.status);
      }
    } catch (error) {
      console.error('Error fetching workout cards:', error);
    } finally {
      setLoadingCards(false);
    }
  };

  const fetchUserPosts = async (retryCount = 0) => {
    if (!authUser?.id) {
      console.log('No user ID available for fetching posts');
      return;
    }
    
    const startTime = Date.now();
    console.log('Fetching posts for user:', authUser.id);
    setLoadingPosts(true);
    setPostsError(false);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    try {
      const url = `${API_URL}/api/users/${authUser.id}/posts`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      console.log(`Profile posts fetch completed in ${responseTime}ms, status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Posts loaded:', data.length, 'posts');
        setUserPosts(data);
        setPostsError(false);
        
        // Prefetch thumbnails for grid
        prefetchGridImages(data);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch posts:', response.status, errorText);
        setPostsError(true);
        // Retry on server error
        if (response.status >= 500 && retryCount < 2) {
          console.log(`Retrying fetch (attempt ${retryCount + 1})...`);
          setTimeout(() => fetchUserPosts(retryCount + 1), 1000 * (retryCount + 1));
          return;
        }
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      setPostsError(true);
      if (error.name === 'AbortError') {
        console.error('Profile posts fetch timed out');
        if (retryCount < 2) {
          setTimeout(() => fetchUserPosts(retryCount + 1), 1000);
          return;
        }
      } else {
        console.error('Error fetching user posts:', error);
      }
    } finally {
      setLoadingPosts(false);
    }
  };

  // Prefetch grid images for smoother scrolling
  const prefetchGridImages = (posts: Post[]) => {
    posts.forEach(post => {
      if (post.media_urls && post.media_urls.length > 0) {
        const firstMedia = post.media_urls[0];
        const mediaUrl = firstMedia.startsWith('http') ? firstMedia : `${API_URL}${firstMedia}`;
        // Only prefetch images, not videos
        if (!mediaUrl.match(/\.(mov|mp4|avi|webm)$/i)) {
          Image.prefetch(mediaUrl).catch(() => {});
        }
      }
      // Prefetch cover_urls for videos
      if (post.cover_urls) {
        Object.values(post.cover_urls).forEach((coverUrl: any) => {
          if (coverUrl) {
            const url = coverUrl.startsWith('http') ? coverUrl : `${API_URL}${coverUrl}`;
            Image.prefetch(url).catch(() => {});
          }
        });
      }
    });
  };

  const fetchSavedWorkouts = async () => {
    setLoadingSaved(true);
    try {
      const response = await fetch(`${API_URL}/api/saved-workouts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavedWorkouts(data);
      } else {
        console.error('Failed to fetch saved workouts:', response.status);
      }
    } catch (error) {
      console.error('Error fetching saved workouts:', error);
    } finally {
      setLoadingSaved(false);
    }
  };

  const fetchSavedPosts = async () => {
    setLoadingSavedPosts(true);
    try {
      const response = await fetch(`${API_URL}/api/saved-posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSavedPosts(data);
      } else {
        console.error('Failed to fetch saved posts:', response.status);
      }
    } catch (error) {
      console.error('Error fetching saved posts:', error);
    } finally {
      setLoadingSavedPosts(false);
    }
  };

  const handleUnsavePost = async (postId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/save`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSavedPosts(savedPosts.filter(p => p.id !== postId));
      }
    } catch (error) {
      console.error('Error unsaving post:', error);
    }
  };

  const handleDeleteSavedWorkout = async (workoutId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/saved-workouts/${workoutId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSavedWorkouts(savedWorkouts.filter(w => w.id !== workoutId));
        setSavedModalVisible(false);
        setSelectedSavedWorkout(null);
      }
    } catch (error) {
      console.error('Error deleting saved workout:', error);
    }
  };

  const handleLoadSavedWorkout = (savedWorkout: SavedWorkout) => {
    // Add all exercises from saved workout to cart
    savedWorkout.workouts.forEach(exercise => {
      addToCart({
        id: `${exercise.name}-${Date.now()}-${Math.random()}`,
        name: exercise.name,
        duration: exercise.duration,
        description: exercise.description || '',
        battlePlan: exercise.battlePlan || '',
        imageUrl: exercise.imageUrl || '',
        intensityReason: exercise.intensityReason || '',
        equipment: exercise.equipment,
        difficulty: exercise.difficulty,
        workoutType: exercise.workoutType || '',
        moodCard: exercise.moodCard || '',
        moodTips: exercise.moodTips || [],
      });
    });
    
    setSavedModalVisible(false);
    setSelectedSavedWorkout(null);
    
    // Show confirmation alert like featured workouts
    Alert.alert(
      'Added to Cart',
      `${savedWorkout.workouts.length} exercise${savedWorkout.workouts.length !== 1 ? 's' : ''} added to your cart. You can now customize your workout.`,
      [
        { text: 'View Cart', onPress: () => router.push('/cart') },
        { text: 'Continue', style: 'cancel' },
      ]
    );
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/workout-cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setWorkoutCards(workoutCards.filter(card => card.id !== cardId));
        setModalVisible(false);
        setSelectedCard(null);
      }
    } catch (error) {
      console.error('Error deleting workout card:', error);
    }
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const handleCreatePost = () => {
    router.push('/create-post');
  };

  const handleFollowers = () => {
    setFollowListType('followers');
    setFollowListVisible(true);
  };

  const handleFollowing = () => {
    setFollowListType('following');
    setFollowListVisible(true);
  };

  const renderWorkoutCard = ({ item }: { item: WorkoutCard }) => {
    // Get up to 2 workout titles for cleaner look
    const workoutTitles = item.workouts.slice(0, 2).map(w => w.workoutName);
    const hasMore = item.workouts.length > 2;
    
    // Calculate estimated calories
    const estimatedCalories = Math.round(item.totalDuration * 8);
    
    // Extract mood card name (first word of first workout or category)
    const getMoodLabel = (): string => {
      if (item.workouts.length > 0) {
        const firstWorkout = item.workouts[0].workoutName?.toLowerCase() || '';
        // Check for known mood categories
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
        style={styles.cardThumbnail}
        onPress={() => {
          setSelectedCard(item);
          setModalVisible(true);
        }}
        activeOpacity={0.85}
      >
        <View style={styles.cardThumbnailContent}>
          {/* Header with date and checkmark */}
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardDateLabel}>{item.completedAt}</Text>
            <View style={styles.cardTrophyBadge}>
              <Ionicons name="checkmark" size={14} color="#0c0c0c" />
            </View>
          </View>
          
          {/* Mood label as hero text */}
          <Text style={styles.cardMoodLabel}>{moodLabel}</Text>
          
          {/* Stats row - duration, calories, exercises all together */}
          <View style={styles.cardStatsRow}>
            <View style={styles.cardStatPill}>
              <Ionicons name="time-outline" size={11} color="#FFD700" />
              <Text style={styles.cardStatPillText}>{item.totalDuration}m</Text>
            </View>
            <View style={styles.cardStatPill}>
              <Ionicons name="flame-outline" size={11} color="#FFD700" />
              <Text style={styles.cardStatPillText}>{estimatedCalories}</Text>
            </View>
            <View style={styles.cardStatPill}>
              <Ionicons name="barbell-outline" size={11} color="#FFD700" />
              <Text style={styles.cardStatPillText}>{item.workouts.length}</Text>
            </View>
          </View>
          
          {/* Workout preview */}
          <View style={styles.cardWorkoutPreview}>
            {workoutTitles.map((title, index) => (
              <Text key={index} style={styles.cardWorkoutName} numberOfLines={1}>
                {title}
              </Text>
            ))}
            {hasMore && (
              <Text style={styles.cardWorkoutMore}>
                +{item.workouts.length - 2} more
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const insets = useSafeAreaInsets();
  
  // State for guest modal visibility
  const [guestModalVisible, setGuestModalVisible] = useState(false);
  
  // Auto-show modal when guest visits profile
  useEffect(() => {
    if (isGuest) {
      setGuestModalVisible(true);
    }
  }, [isGuest]);

  // Guest Profile View - shows modal over dark background
  if (isGuest) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={{ width: 32 }} />
          <Text style={styles.username}>Profile</Text>
          <View style={{ width: 32 }} />
        </View>
        
        <View style={styles.guestBackgroundContainer}>
          <View style={styles.guestIconContainer}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.guestIconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="person-outline" size={48} color="#0c0c0c" />
            </LinearGradient>
          </View>
          <Text style={styles.guestTitle}>Welcome to Profile</Text>
          <Text style={styles.guestSubtitle}>
            Create an account to unlock your profile
          </Text>
          <TouchableOpacity 
            style={styles.guestTapButton}
            onPress={() => setGuestModalVisible(true)}
          >
            <Text style={styles.guestTapButtonText}>Tap to get started</Text>
          </TouchableOpacity>
        </View>
        
        <GuestPromptModal
          visible={guestModalVisible}
          onClose={() => setGuestModalVisible(false)}
          action="access your profile"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.username}>@{user.username}</Text>
        <View style={styles.headerRightButtons}>
          <TouchableOpacity 
            style={styles.messagesButton}
            onPress={() => router.push('/messages')}
          >
            <Ionicons name="chatbubbles-outline" size={24} color="#fff" />
            {unreadMessages > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreatePost}
          >
            <View style={styles.createIconContainer}>
              <Ionicons name="add" size={24} color="#000" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFD700"
            colors={['#FFD700']}
          />
        }
      >
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <TouchableOpacity onPress={handleEditProfile} style={styles.avatarContainer}>
              <Image 
                source={{ 
                  uri: user.avatar 
                    ? (user.avatar.startsWith('http') ? user.avatar : `${API_URL}${user.avatar}`)
                    : 'https://via.placeholder.com/100'
                }}
                style={styles.profileImage}
                resizeMode="cover"
              />
              <View style={styles.editIconContainer}>
                <Ionicons name="pencil" size={16} color="#0c0c0c" />
              </View>
            </TouchableOpacity>
            <View style={styles.statsContainer}>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statValue}>{stats.workouts}</Text>
                <Text style={styles.statLabel}>Workouts</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statItem} onPress={handleFollowers}>
                <Text style={styles.statValue}>{stats.followers}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statItem} onPress={handleFollowing}>
                <Text style={styles.statValue}>{stats.following}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.displayName}>{user.name}</Text>
              {user.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
              )}
            </View>
            <Text style={styles.bio}>{user.bio}</Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.statsButton} 
              onPress={() => router.push('/user-stats')}
            >
              <Ionicons name="stats-chart" size={18} color="#FFD700" />
              <Text style={styles.statsButtonText}>Stats</Text>
            </TouchableOpacity>
          </View>

          {/* Admin Dashboard Button - Only show for officialmoodapp admin account */}
          {(authUser?.username?.toLowerCase() === 'officialmoodapp' || user?.username?.toLowerCase() === 'officialmoodapp') && (
            <TouchableOpacity 
              style={styles.adminButton} 
              onPress={() => router.push('/admin-dashboard')}
            >
              <Ionicons name="analytics" size={20} color="#FFD700" />
              <Text style={styles.adminButtonText}>Admin Dashboard</Text>
            </TouchableOpacity>
          )}

          {/* Current Streak */}
          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={24} color="#FFD700" />
            <Text style={styles.streakText}>
              {stats.streak} day streak
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
            onPress={() => setActiveTab('posts')}
          >
            <Ionicons 
              name="grid" 
              size={18} 
              color={activeTab === 'posts' ? '#FFD700' : '#888'} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === 'posts' && styles.activeTabText
            ]}>
              Posts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'cards' && styles.activeTab]}
            onPress={() => setActiveTab('cards')}
          >
            <Ionicons 
              name="trophy" 
              size={18} 
              color={activeTab === 'cards' ? '#FFD700' : '#888'} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === 'cards' && styles.activeTabText
            ]}>
              Completed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'saved' && styles.activeTab]}
            onPress={() => setActiveTab('saved')}
          >
            <Ionicons 
              name="bookmark" 
              size={18} 
              color={activeTab === 'saved' ? '#FFD700' : '#888'} 
            />
            <Text style={[
              styles.tabText, 
              activeTab === 'saved' && styles.activeTabText
            ]}>
              Saved
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === 'posts' ? (
            <View style={styles.postsTab}>
              {loadingPosts ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FFD700" />
                  <Text style={styles.loadingText}>Loading posts...</Text>
                </View>
              ) : postsError ? (
                <View style={styles.emptyState} data-testid="profile-posts-error">
                  <Ionicons name="cloud-offline-outline" size={48} color="#FF6B6B" />
                  <Text style={styles.emptyTitle}>Couldn't load posts</Text>
                  <Text style={styles.emptySubtitle}>
                    Pull down to refresh and try again
                  </Text>
                </View>
              ) : userPosts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="images-outline" size={48} color="#666" />
                  <Text style={styles.emptyTitle}>No posts yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Share your fitness journey with your first post!
                  </Text>
                </View>
              ) : (
                <View style={styles.postsGrid}>
                  {userPosts.map((post) => {
                    let mediaUrl = post.media_urls && post.media_urls.length > 0 
                      ? post.media_urls[0] 
                      : null;
                    
                    // Detect video using server-derived media_type (canonical) + URL extension fallback
                    const isVideo = post.media_type === 'video' || (mediaUrl && (
                      mediaUrl.toLowerCase().endsWith('.mov') ||
                      mediaUrl.toLowerCase().endsWith('.mp4') ||
                      mediaUrl.toLowerCase().endsWith('.avi') ||
                      mediaUrl.toLowerCase().endsWith('.webm') ||
                      mediaUrl.toLowerCase().endsWith('.m3u8') ||
                      mediaUrl.toLowerCase().includes('/video/')
                    ));
                    
                    // Use canonical thumbnail_url from backend (user-selected cover or Cloudinary fallback)
                    // Priority: post.thumbnail_url > cover_urls['0'] > null
                    let coverUrl: string | null = post.thumbnail_url || null;
                    if (!coverUrl && post.cover_urls) {
                      coverUrl = post.cover_urls['0'] || post.cover_urls[0 as unknown as string] || null;
                    }
                    if (coverUrl && !coverUrl.startsWith('http')) {
                      coverUrl = coverUrl.startsWith('/') ? `${API_URL}${coverUrl}` : `${API_URL}/api/uploads/${coverUrl}`;
                    }
                    
                    // For video grid tiles: ALWAYS use the thumbnail image, never load the video
                    const gridImageUrl = isVideo ? (coverUrl || mediaUrl) : mediaUrl;
                    
                    // Fix media URL if it doesn't include the backend URL
                    if (mediaUrl && !mediaUrl.startsWith('http')) {
                      mediaUrl = mediaUrl.startsWith('/') ? `${API_URL}${mediaUrl}` : `${API_URL}/api/uploads/${mediaUrl}`;
                    }
                    
                    return (
                      <TouchableOpacity
                        key={post.id}
                        style={styles.gridItem}
                        onPress={() => {
                          router.push(`/post-detail?postId=${post.id}`);
                        }}
                      >
                        {gridImageUrl ? (
                          isVideo && coverUrl ? (
                            // Video with known cover thumbnail — render as static Image (no video loading)
                            <Image 
                              source={{ uri: coverUrl }}
                              style={styles.gridImage}
                              contentFit="cover"
                              transition={150}
                              cachePolicy="memory-disk"
                              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                            />
                          ) : isVideo ? (
                            // Video without cover — use VideoThumbnail (Cloudinary auto-thumb)
                            <VideoThumbnail 
                              videoUrl={mediaUrl}
                              coverUrl={null}
                              style={styles.gridImage}
                            />
                          ) : (
                            <Image 
                              source={{ uri: mediaUrl }}
                              style={styles.gridImage}
                              contentFit="cover"
                              transition={150}
                              cachePolicy="memory-disk"
                              placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                            />
                          )
                        ) : (
                          <View style={[styles.gridImage, styles.placeholderGrid]}>
                            <Ionicons name="image-outline" size={40} color="#666" />
                          </View>
                        )}
                        {/* Video indicator overlay */}
                        {isVideo && (
                          <View style={styles.videoIndicator}>
                            <Ionicons name="videocam" size={14} color="#fff" />
                          </View>
                        )}
                        {post.media_urls && post.media_urls.length > 1 && (
                          <View style={styles.multipleIndicator}>
                            <Ionicons name="copy-outline" size={16} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          ) : activeTab === 'cards' ? (
            <View style={styles.cardsTab}>
              {loadingCards ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FFD700" />
                  <Text style={styles.loadingText}>Loading workout cards...</Text>
                </View>
              ) : workoutCards.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="trophy-outline" size={48} color="#666" />
                  <Text style={styles.emptyTitle}>No completed workouts yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Finish a workout to see it here.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={workoutCards}
                  renderItem={renderWorkoutCard}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  columnWrapperStyle={styles.cardRow}
                  scrollEnabled={false}
                />
              )}
            </View>
          ) : (
            <View style={styles.savedTab}>
              {/* Saved Builds Entry — visible only if at least 1 active draft */}
              {savedBuildsCount > 0 ? (
                <TouchableOpacity
                  style={styles.savedBuildsEntry}
                  onPress={() => router.push('/saved-builds')}
                  activeOpacity={0.85}
                  testID="profile-saved-builds-entry"
                >
                  <View style={styles.savedBuildsLeft}>
                    <View style={styles.savedBuildsIconWrap}>
                      <Ionicons name="bookmark" size={18} color="#0A0A0A" />
                    </View>
                    <View>
                      <Text style={styles.savedBuildsTitle}>Saved Builds</Text>
                      <Text style={styles.savedBuildsSubtitle}>Resume where you left off</Text>
                    </View>
                  </View>
                  <View style={styles.savedBuildsRight}>
                    <View style={styles.savedBuildsBadge} testID="profile-saved-builds-count">
                      <Text style={styles.savedBuildsBadgeText}>{savedBuildsCount}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#6B6B6B" />
                  </View>
                </TouchableOpacity>
              ) : null}

              {/* Saved Workouts Section */}
              <View style={styles.savedSection}>
                <View style={styles.savedSectionHeader}>
                  <Ionicons name="fitness" size={20} color="#FFD700" />
                  <Text style={styles.savedSectionTitle}>Saved Workouts</Text>
                </View>
                {loadingSaved ? (
                  <View style={styles.loadingContainerSmall}>
                    <ActivityIndicator size="small" color="#FFD700" />
                  </View>
                ) : savedWorkouts.length === 0 ? (
                  <View style={styles.emptyStateSmall}>
                    <Text style={styles.emptySubtitleSmall}>No saved workouts yet</Text>
                  </View>
                ) : (
                  <View style={styles.savedWorkoutsList}>
                    {savedWorkouts.map((savedWorkout) => (
                      <View key={savedWorkout.id} style={styles.savedWorkoutCard}>
                        {/* Main content area */}
                        <TouchableOpacity
                          style={styles.savedWorkoutContent}
                          onPress={() => {
                            // Prefer the explicit featured_workout_id (MongoDB ObjectId)
                            // saved at save-time. Fall back to legacy name → numeric map
                            // for older saved records.
                            const featuredId = savedWorkout.featured_workout_id || FEATURED_WORKOUT_IDS[savedWorkout.name];
                            if (savedWorkout.source === 'featured' && featuredId) {
                              // Navigate to featured workout detail page
                              router.push({
                                pathname: '/featured-workout-detail',
                                params: { id: featuredId },
                              });
                            } else {
                              // For custom workouts, load directly into cart
                              handleLoadSavedWorkout(savedWorkout);
                            }
                          }}
                        >
                          <View style={styles.savedWorkoutHeader}>
                            <View style={styles.savedWorkoutInfo}>
                              <Text style={styles.savedWorkoutName}>{savedWorkout.name}</Text>
                              <Text style={styles.savedWorkoutMeta}>
                                {savedWorkout.workouts.length} exercises • {savedWorkout.total_duration} min
                              </Text>
                            </View>
                            <View style={styles.savedWorkoutBadge}>
                              <Ionicons 
                                name={savedWorkout.source === 'featured' ? 'star' : 'create'} 
                                size={14} 
                                color="#FFD700" 
                              />
                              <Text style={styles.savedWorkoutBadgeText}>
                                {savedWorkout.source === 'featured' ? 'Featured' : 'Custom'}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.savedWorkoutExercises}>
                            {savedWorkout.workouts.slice(0, 3).map((exercise, index) => (
                              <Text key={index} style={styles.savedExerciseName}>
                                • {exercise.name}
                              </Text>
                            ))}
                            {savedWorkout.workouts.length > 3 && (
                              <Text style={styles.savedExerciseMore}>
                                +{savedWorkout.workouts.length - 3} more
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                        
                        {/* X button - vertically centered on entire card */}
                        <TouchableOpacity
                          style={styles.unsaveButtonOnCard}
                          onPress={() => handleDeleteSavedWorkout(savedWorkout.id)}
                        >
                          <Ionicons name="close" size={16} color="#FFD700" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Saved Posts Section */}
              <View style={styles.savedSection}>
                <View style={styles.savedSectionHeader}>
                  <Ionicons name="bookmark" size={20} color="#FFD700" />
                  <Text style={styles.savedSectionTitle}>Saved Posts</Text>
                </View>
                {loadingSavedPosts ? (
                  <View style={styles.loadingContainerSmall}>
                    <ActivityIndicator size="small" color="#FFD700" />
                  </View>
                ) : savedPosts.length === 0 ? (
                  <View style={styles.emptyStateSmall}>
                    <Text style={styles.emptySubtitleSmall}>No saved posts yet</Text>
                  </View>
                ) : (
                  <View style={styles.savedPostsGrid}>
                    {savedPosts.map((post) => (
                      <TouchableOpacity 
                        key={post.id} 
                        style={styles.savedPostItem}
                        onPress={() => router.push('/(tabs)/explore')}
                      >
                        {post.media_urls.length > 0 && (
                          <Image
                            source={{ 
                              uri: post.media_urls[0].startsWith('http') 
                                ? post.media_urls[0] 
                                : `${API_URL}${post.media_urls[0].startsWith('/') ? '' : '/api/uploads/'}${post.media_urls[0]}` 
                            }}
                            style={styles.savedPostImage}
                            contentFit="cover"
                          />
                        )}
                        {/* Unsave button overlay */}
                        <TouchableOpacity
                          style={styles.unsavePostButton}
                          onPress={() => handleUnsavePost(post.id)}
                        >
                          <Ionicons name="close" size={14} color="#FFD700" />
                        </TouchableOpacity>
                        {/* Multiple images indicator */}
                        {post.media_urls.length > 1 && (
                          <View style={styles.multipleImagesIndicator}>
                            <Ionicons name="copy" size={12} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Workout Card Detail Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Workout Achievement</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => selectedCard && handleDeleteCard(selectedCard.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF4444" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedCard && (
                <View style={styles.modalCardContainer}>
                  <WorkoutStatsCard {...selectedCard} />
                  
                  {/* Share/Post Button */}
                  <TouchableOpacity
                    style={styles.shareAchievementButton}
                    onPress={() => {
                      setModalVisible(false);
                      // Navigate to create-post with workout stats INCLUDING snapshot ID
                      router.push({
                        pathname: '/create-post',
                        params: {
                          workoutStats: JSON.stringify({
                            workouts: selectedCard.workouts.map((w: any) => ({
                              workoutTitle: w.workoutTitle || w.workoutName || w.workout_title,
                              workoutName: w.workoutName || w.workoutTitle || w.workout_name,
                              equipment: w.equipment,
                              duration: w.duration,
                              difficulty: w.difficulty,
                              battlePlan: w.battlePlan || w.battle_plan,
                              imageUrl: w.imageUrl || w.image_url,
                              description: w.description,
                              intensityReason: w.intensityReason || w.intensity_reason,
                              moodCategory: w.moodCategory || w.mood_category,
                              moodTips: w.moodTips || w.mood_tips,
                            })),
                            totalDuration: selectedCard.totalDuration,
                            completedAt: selectedCard.completedAt,
                            moodCategory: selectedCard.moodCategory,
                            workoutSnapshotId: selectedCard.workoutSnapshotId, // CRITICAL: Include snapshot ID for "Try this workout"
                          }),
                        },
                      });
                    }}
                  >
                    <LinearGradient
                      colors={['#FFD700', '#FFA500']}
                      style={styles.shareAchievementGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Ionicons name="share-social" size={20} color="#0c0c0c" />
                      <Text style={styles.shareAchievementButtonText}>Share Achievement</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Saved Workout Detail Modal */}
      <Modal
        visible={savedModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSavedModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saved Workout</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  onPress={() => selectedSavedWorkout && handleDeleteSavedWorkout(selectedSavedWorkout.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF4444" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSavedModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {selectedSavedWorkout && (
                <View style={styles.savedModalContent}>
                  <Text style={styles.savedModalName}>{selectedSavedWorkout.name}</Text>
                  <Text style={styles.savedModalMeta}>
                    {selectedSavedWorkout.workouts.length} exercises • {selectedSavedWorkout.total_duration} min
                  </Text>
                  
                  <View style={styles.savedModalExercises}>
                    {selectedSavedWorkout.workouts.map((exercise, index) => (
                      <View key={index} style={styles.savedModalExercise}>
                        <Text style={styles.savedModalExerciseName}>{exercise.name}</Text>
                        <Text style={styles.savedModalExerciseDetail}>
                          {exercise.equipment} • {exercise.duration}
                        </Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.savedModalButtons}>
                    <TouchableOpacity
                      style={styles.addToCartButtonSaved}
                      onPress={() => selectedSavedWorkout && handleLoadSavedWorkout(selectedSavedWorkout)}
                    >
                      <Ionicons name="cart-outline" size={20} color="#fff" />
                      <Text style={styles.addToCartButtonTextSaved}>Add to Cart</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.startWorkoutButtonSaved}
                      onPress={() => {
                        if (selectedSavedWorkout) {
                          // Add to cart first
                          selectedSavedWorkout.workouts.forEach(exercise => {
                            addToCart({
                              id: `${exercise.name}-${Date.now()}-${Math.random()}`,
                              name: exercise.name,
                              duration: exercise.duration,
                              description: exercise.description || '',
                              battlePlan: exercise.battlePlan || '',
                              imageUrl: exercise.imageUrl || '',
                              intensityReason: exercise.intensityReason || '',
                              equipment: exercise.equipment,
                              difficulty: exercise.difficulty,
                              workoutType: exercise.workoutType || '',
                              moodCard: exercise.moodCard || '',
                              moodTips: exercise.moodTips || [],
                            });
                          });
                          
                          setSavedModalVisible(false);
                          setSelectedSavedWorkout(null);
                          
                          // Navigate to workout guidance
                          router.push({
                            pathname: '/workout-guidance',
                            params: {
                              workouts: JSON.stringify(selectedSavedWorkout.workouts),
                              moodTitle: selectedSavedWorkout.name.split(' - ')[0] || 'Workout',
                              workoutTitle: selectedSavedWorkout.name.split(' - ').slice(1).join(' - ') || selectedSavedWorkout.name,
                            },
                          });
                        }
                      }}
                    >
                      <Text style={styles.startWorkoutButtonTextSaved}>Start Workout</Text>
                      <Ionicons name="arrow-forward" size={20} color="#0c0c0c" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Follow List Modal */}
      <FollowListModal
        visible={followListVisible}
        onClose={() => setFollowListVisible(false)}
        userId={user.id}
        type={followListType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingsButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messagesButton: {
    padding: 4,
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  createButton: {
    padding: 4,
  },
  createIconContainer: {
    backgroundColor: '#FFD700',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0c0c0c',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  profileInfo: {
    marginBottom: 16,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 4,
  },
  bio: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  statsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  adminButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  streakText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FFD700',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
  },
  activeTabText: {
    color: '#FFD700',
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  workoutsTab: {
    flex: 1,
  },
  cardsTab: {
    flex: 1,
  },
  postsTab: {
    flex: 1,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  gridItem: {
    width: (width - 44) / 3, // 3 columns with small gaps
    height: (width - 44) / 3, // 1:1 aspect ratio
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  placeholderGrid: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoThumbnail: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 4,
  },
  multipleIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 4,
  },
  savedTab: {
    flex: 1,
  },
  // Saved Builds entry row (above saved workouts section)
  savedBuildsEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141414',
    borderColor: '#1F1F1F',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 18,
  },
  savedBuildsLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  savedBuildsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5C518',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  savedBuildsTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  savedBuildsSubtitle: { color: '#B7B7B7', fontSize: 12, marginTop: 2 },
  savedBuildsRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  savedBuildsBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: '#F5C518',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  savedBuildsBadgeText: { color: '#0A0A0A', fontSize: 12, fontWeight: '700' },
  savedSection: {
    marginBottom: 24,
  },
  savedSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  savedSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainerSmall: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateSmall: {
    padding: 16,
    alignItems: 'center',
  },
  emptySubtitleSmall: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  savedPostsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  savedPostItem: {
    width: (width - 48 - 8) / 3,
    aspectRatio: 4 / 5,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  savedPostImage: {
    width: '100%',
    height: '100%',
  },
  unsavePostButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  multipleImagesIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 4,
    padding: 3,
  },
  savedWorkoutsList: {
    gap: 12,
  },
  savedWorkoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingLeft: 16,
    paddingVertical: 12,
    paddingRight: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  savedWorkoutContent: {
    flex: 1,
  },
  savedWorkoutRightColumn: {
    alignItems: 'center',
    gap: 8,
  },
  unsaveButtonOnCard: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginLeft: 12,
  },
  savedWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  savedWorkoutInfo: {
    flex: 1,
  },
  savedWorkoutName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  savedWorkoutMeta: {
    fontSize: 13,
    color: '#888',
  },
  savedWorkoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  savedWorkoutBadgeText: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '600',
  },
  savedWorkoutExercises: {
    marginTop: 2,
  },
  savedExerciseName: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 2,
  },
  savedExerciseMore: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  savedModalContent: {
    padding: 16,
  },
  savedModalName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  savedModalMeta: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
  },
  savedModalExercises: {
    gap: 14,
  },
  savedModalExercise: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  savedModalExerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  savedModalExerciseDetail: {
    fontSize: 13,
    color: '#888',
  },
  loadWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 18,
    marginTop: 28,
  },
  loadWorkoutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  savedModalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  addToCartButtonSaved: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 30,
    paddingVertical: 14,
  },
  addToCartButtonTextSaved: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  startWorkoutButtonSaved: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    borderRadius: 30,
    paddingVertical: 14,
  },
  startWorkoutButtonTextSaved: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0c0c0c',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#0c0c0c',
    fontSize: 14,
    fontWeight: '600',
  },
  workoutItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  workoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  workoutMood: {
    fontSize: 12,
    color: '#FFD700',
    marginBottom: 4,
  },
  workoutDuration: {
    fontSize: 12,
    color: '#888',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#888',
    marginTop: 16,
    fontSize: 14,
  },
  cardRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardThumbnail: {
    width: (width - 52) / 2,
    backgroundColor: '#111',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardAccentLine: {
    height: 3,
    backgroundColor: '#FFD700',
  },
  cardThumbnailContent: {
    padding: 14,
    paddingTop: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardDateLabel: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  cardTrophyBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardMoodLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  cardStatsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'nowrap',
  },
  cardStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
  },
  cardStatPillText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  cardWorkoutPreview: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
  },
  cardWorkoutName: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    marginBottom: 3,
  },
  cardWorkoutMore: {
    color: 'rgba(255, 215, 0, 0.6)',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
  // Legacy styles (kept for compatibility)
  cardMainStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  cardDurationValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1,
  },
  cardDurationUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 4,
  },
  cardSecondaryStats: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  workoutTitlesContainer: {
    width: '100%',
    marginTop: 8,
    gap: 3,
  },
  savedWorkoutTitle: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    width: '100%',
  },
  workoutTitleMore: {
    color: '#888',
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 2,
  },
  cardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  cardStat: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  cardStatDivider: {
    color: '#666',
    fontSize: 12,
  },
  cardThumbnailText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  cardThumbnailDuration: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  cardThumbnailFooter: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 215, 0, 0.2)',
  },
  cardThumbnailDate: {
    color: '#888',
    fontSize: 11,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0c0c0c',
    borderRadius: 20,
    width: '100%',
    maxHeight: '90%',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
  },
  deleteButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    maxHeight: '85%',
  },
  modalCardContainer: {
    padding: 20,
    alignItems: 'center',
  },
  shareAchievementButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
    width: '100%',
  },
  shareAchievementGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  shareAchievementButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c0c0c',
  },
  // Guest Profile Styles
  guestBackgroundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: -60,
  },
  guestProfileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: -60,  // Offset for visual centering (accounts for header)
  },
  guestIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 24,
  },
  guestIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  guestTapButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  guestTapButtonText: {
    fontSize: 14,
    color: '#FFD700',
    textDecorationLine: 'underline',
  },
  guestBenefits: {
    width: '100%',
    marginBottom: 32,
  },
  guestBenefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  guestBenefitIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  guestBenefitIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestBenefitText: {
    fontSize: 15,
    color: '#ccc',
    marginLeft: 14,
  },
  guestSignUpButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  guestSignUpGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  guestSignUpButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c0c0c',
  },
  guestSignInButton: {
    width: '100%',
    backgroundColor: '#333',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  guestSignInButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  guestLegalContainer: {
    marginTop: 24,
    width: '100%',
  },
  guestLegalDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  guestLegalLinks: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 8,
  },
  guestLegalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  guestLegalText: {
    fontSize: 12,
    color: '#888',
  },
});
