import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Animated,
  Modal,
  TextInput,
  Alert,
  FlatList,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { useCart, WorkoutItem } from '../../contexts/CartContext';
import { useBadges } from '../../contexts/BadgeContext';
import MediaCarousel from '../../components/MediaCarousel';
import ErrorBoundary from '../../components/ErrorBoundary';
import CommentsBottomSheet from '../../components/CommentsBottomSheet';
import { Analytics, GuestAnalytics } from '../../utils/analytics';
import { useScreenTime } from '../../hooks/useScreenTime';
import { PostSkeleton } from '../../components/Skeleton';
import GuestPromptModal from '../../components/GuestPromptModal';
import ReportModal from '../../components/ReportModal';
import { preloadNextItems, prefetchThumbnails } from '../../utils/cloudinaryVideo';

import { API_URL } from '../../utils/apiConfig';
import { formatNotificationTime } from '../../utils/notificationUtils';

interface Author {
  id: string;
  username: string;
  name: string;
  avatar: string;
}

interface FirstComment {
  id: string;
  text: string;
  author: {
    id: string;
    username: string;
    avatar: string | null;
  };
  created_at: string;
}

interface WorkoutExercise {
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
}

interface WorkoutCardData {
  workouts: WorkoutExercise[];
  totalDuration: number;
  completedAt: string;
  moodCategory?: string;
}

// NEW: Canonical attached workout types
interface AttachedWorkoutExercise {
  exerciseId: string;
  name: string;
  imageUrl: string;
  duration: string;
  equipment: string;
  difficulty: string;
  description?: string;
  battlePlan: string;
  intensityReason?: string;
  moodTips?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}

interface AttachedWorkout {
  version: number;
  title: string;
  totalDuration: number;
  moodCategory: string;
  completedAt: string;
  exercises: AttachedWorkoutExercise[];
}

interface Post {
  id: string;
  author: Author;
  caption: string;
  media_urls: string[];
  cover_urls?: { [key: number]: string } | null; // Map of media index to cover URL
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_saved: boolean;
  created_at: string;
  workout?: any;
  workout_data?: WorkoutCardData;  // Legacy - kept for display
  attached_workout?: AttachedWorkout;  // NEW: Canonical workout for "Try This Workout"
  first_comment?: FirstComment | null;
}

interface SearchUser {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatar: string;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  is_self: boolean;
}

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow';
  user: {
    id: string;
    username: string;
    name: string;
    avatar: string | null;
  };
  post_id?: string;
  post_preview?: string | null;
  comment_text?: string;
  created_at: string;
  message: string;
}

export default function Explore() {
  // Track screen time
  useScreenTime('Explore');
  
  // Handle tab query parameter from navigation
  const params = useLocalSearchParams<{ tab?: string }>();
  
  // Get badge context for notification counts - SERVER AUTHORITATIVE
  const { unreadNotifications, markAllNotificationsRead, refreshBadges } = useBadges();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'forYou' | 'following' | 'notifications'>('forYou');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [visiblePostId, setVisiblePostId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [carouselIndexes, setCarouselIndexes] = useState<{ [postId: string]: number }>({});
  const router = useRouter();
  const { token, user, isGuest } = useAuth();
  const { addToCart, clearCart } = useCart();
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const postLayoutsRef = useRef<{ [key: string]: { y: number; height: number } }>({});
  const PAGE_SIZE = 20;
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [guestAction, setGuestAction] = useState('');
  
  // Handle tab navigation from query parameter
  useEffect(() => {
    if (params.tab === 'notifications' && !isGuest) {
      setActiveTab('notifications');
    }
  }, [params.tab, isGuest]);
  
  // Post options menu state
  const [showPostMenu, setShowPostMenu] = useState(false);
  
  // Check if current user is admin
  const isAdmin = user?.username?.toLowerCase() === 'officialmoodapp';
  const [selectedMenuPost, setSelectedMenuPost] = useState<Post | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsRefreshing, setNotificationsRefreshing] = useState(false);

  // Double tap to like functionality
  const lastTap = useRef<number>(0);
  const [likeAnimations] = useState<{ [key: string]: Animated.Value }>({});
  
  // Try workout button animations
  const [tryWorkoutAnimations] = useState<{ [key: string]: Animated.Value }>({});
  
  // Shimmer animation for try workout button
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  // Start continuous shimmer animation
  useEffect(() => {
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    shimmerLoop.start();
    return () => shimmerLoop.stop();
  }, [shimmerAnim]);

  useEffect(() => {
    // Fetch posts for both authenticated users and guests
    fetchPosts();
  }, [token, activeTab, isGuest]);

  // Track last tab press time for double-tap to scroll to top
  const lastExploreTabPress = useRef<number>(0);
  const navigation = useNavigation();

  // Listen for tab press events
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', (e: any) => {
      const now = Date.now();
      const timeSinceLastTap = now - lastExploreTabPress.current;
      
      // If on notifications tab, single tap goes back to forYou
      if (activeTab === 'notifications') {
        setActiveTab('forYou');
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
      }
      // Double tap detected (within 300ms) - scroll to top
      else if (timeSinceLastTap < 300) {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
        if (activeTab !== 'forYou') {
          setActiveTab('forYou');
        }
      }
      
      lastExploreTabPress.current = now;
    });

    return unsubscribe;
  }, [navigation, activeTab]);

  const fetchPosts = async (loadMore = false, retryCount = 0) => {
    if (loadMore && !hasMore) return;
    if (loadMore) {
      setLoadingMore(true);
    }

    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    try {
      const skip = loadMore ? posts.length : 0;
      // Reduce initial load to 10 posts for faster first render
      const limit = loadMore ? PAGE_SIZE : 10;
      
      // Use public endpoint for guests, authenticated endpoints for logged-in users
      let endpoint: string;
      if (isGuest || !token) {
        // Guests only see the public "For You" feed
        endpoint = `${API_URL}/api/posts/public?limit=${limit}&skip=${skip}`;
      } else {
        endpoint = activeTab === 'following' 
          ? `${API_URL}/api/posts/following?limit=${limit}&skip=${skip}` 
          : `${API_URL}/api/posts?limit=${limit}&skip=${skip}`;
      }
      
      console.log('Fetching posts from:', endpoint);
      
      const headers: Record<string, string> = {};
      if (token && !isGuest) {
        headers['Authorization'] = `Bearer ${token}`;
      }
        
      const response = await fetch(endpoint, {
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      console.log(`Posts fetch completed in ${responseTime}ms, status: ${response.status}`);

      if (response.ok) {
        const data = await response.json();
        console.log('Posts fetched successfully:', data.length, 'posts');
        
        // Check if there are more posts
        if (data.length < limit) {
          setHasMore(false);
        }
        
        // Posts now include is_saved from the backend - no need for individual API calls
        const postsWithSaveStatus = data.map((post: Post) => ({
          ...post,
          is_saved: post.is_saved || false
        }));
        
        if (loadMore) {
          setPosts(prev => [...prev, ...postsWithSaveStatus]);
        } else {
          setPosts(postsWithSaveStatus);
          setHasMore(true);
        }
        
        // Prefetch images for next batch
        prefetchPostImages(postsWithSaveStatus);
      } else {
        console.error('Failed to fetch posts:', response.status);
        // Retry on server errors
        if (response.status >= 500 && retryCount < 2) {
          console.log(`Retrying fetch (attempt ${retryCount + 1})...`);
          setTimeout(() => fetchPosts(loadMore, retryCount + 1), 1000 * (retryCount + 1));
          return;
        }
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        console.error('Posts fetch timed out');
        // Retry on timeout
        if (retryCount < 2) {
          console.log(`Retrying after timeout (attempt ${retryCount + 1})...`);
          setTimeout(() => fetchPosts(loadMore, retryCount + 1), 1000);
          return;
        }
      } else {
        console.error('Error fetching posts:', error);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Prefetch images for posts
  const prefetchPostImages = (postsToCache: Post[]) => {
    const imagesToPrefetch: string[] = [];
    postsToCache.forEach(post => {
      // Add author avatar
      if (post.author.avatar) {
        const avatarUrl = post.author.avatar.startsWith('http') 
          ? post.author.avatar 
          : `${API_URL}${post.author.avatar}`;
        imagesToPrefetch.push(avatarUrl);
      }
      // Add first media URL (thumbnail)
      if (post.media_urls && post.media_urls.length > 0) {
        const mediaUrl = post.media_urls[0].startsWith('http')
          ? post.media_urls[0]
          : `${API_URL}${post.media_urls[0]}`;
        // Only prefetch images, not videos
        if (!mediaUrl.match(/\.(mov|mp4|avi|webm)$/i)) {
          imagesToPrefetch.push(mediaUrl);
        }
      }
    });
    
    // Use expo-image prefetch
    imagesToPrefetch.forEach(url => {
      Image.prefetch(url).catch(() => {});
    });
  };

  // Fetch notifications for display only (no badge logic - that's in BadgeContext)
  const fetchNotifications = async () => {
    if (!token || isGuest) return;
    
    setNotificationsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const rawNotifications = data.notifications || [];
        
        console.log(`🔔 NOTIF-DIAG: raw notifications count = ${rawNotifications.length}`);
        if (rawNotifications.length > 0) {
          console.log('🔔 NOTIF-DIAG: raw sample[0]:', JSON.stringify(rawNotifications[0]).substring(0, 300));
        }
        
        // Map backend notification format to frontend format
        const mappedNotifications = rawNotifications.map((n: any) => ({
          id: n.id,
          type: n.type,
          user: {
            id: n.actor?.id || '',
            username: n.actor?.username || 'Unknown',
            name: n.actor?.name || '',
            avatar: n.actor?.avatar || null,
          },
          post_id: n.entity_type === 'post' ? n.entity_id : undefined,
          post_preview: n.target_thumbnail_url || n.metadata?.post_thumbnail || n.image_url || null,
          comment_text: n.body,
          created_at: n.created_at,
          message: n.body || n.title || n.message || '',
        }));
        
        console.log(`🔔 NOTIF-DIAG: mapped notifications count = ${mappedNotifications.length}`);
        if (mappedNotifications.length > 0) {
          console.log('🔔 NOTIF-DIAG: mapped sample[0]:', JSON.stringify(mappedNotifications[0]).substring(0, 300));
        }
        
        setNotifications(mappedNotifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
      setNotificationsRefreshing(false);
    }
  };

  // Fetch notifications when tab changes to notifications
  // Only mark as read AFTER successful fetch, not before
  useEffect(() => {
    if (activeTab === 'notifications' && !isGuest && token) {
      // Fetch first, then mark as read after a short delay
      fetchNotifications().then(() => {
        // Mark as read after user has seen the list
        setTimeout(() => {
          markAllNotificationsRead();
        }, 1500);
      });
    }
  }, [activeTab, token, isGuest]);

  const onRefreshNotifications = () => {
    setNotificationsRefreshing(true);
    fetchNotifications();
  };

  // Refetch notifications on screen focus when on notifications tab
  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'notifications' && !isGuest && token) {
        console.log('🔔 NOTIF-DIAG: screen focused, refetching notifications');
        fetchNotifications();
      }
    }, [activeTab, isGuest, token])
  );

  // Format time ago for notifications - use shared utility
  const formatTimeAgo = (dateString: string) => {
    return formatNotificationTime(dateString);
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return 'heart';
      case 'comment': return 'chatbubble';
      case 'follow': return 'person-add';
      case 'mention': return 'at';
      case 'reply': return 'return-down-forward';
      default: return 'notifications';
    }
  };

  // Get notification icon color based on type
  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case 'like': return '#FF4444';
      case 'comment': return '#4A90D9';
      case 'follow': return '#FFD700';
      case 'mention': return '#9B59B6';
      case 'reply': return '#4ECDC4';
      default: return '#888';
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  const searchUsers = async (query: string) => {
    if (!token || query.trim().length < 1) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/users/search/query?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      } else {
        console.error('Failed to search users:', response.status);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search - wait 300ms after user stops typing
    if (text.trim().length > 0) {
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(text);
      }, 300);
    } else {
      setSearchResults([]);
    }
  };

  const handleFollowToggle = async (userId: string) => {
    // Block guests from following
    if (isGuest) {
      setGuestAction('follow other users');
      setShowGuestPrompt(true);
      return;
    }
    
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/follow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const isNowFollowing = data.following;

        // Update search results
        setSearchResults(prevResults =>
          prevResults.map(user =>
            user.id === userId
              ? { ...user, is_following: isNowFollowing }
              : user
          )
        );

        // Track follow/unfollow
        if (isNowFollowing) {
          Analytics.userFollowed(token, { followed_user_id: userId });
        } else {
          Analytics.userUnfollowed(token, { unfollowed_user_id: userId });
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleDoubleTap = (postId: string) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      handleLike(postId);
      showLikeAnimation(postId);
    }

    lastTap.current = now;
  };

  const showLikeAnimation = (postId: string) => {
    if (!likeAnimations[postId]) {
      likeAnimations[postId] = new Animated.Value(0);
    }

    const animation = likeAnimations[postId];
    animation.setValue(0);

    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleLike = async (postId: string) => {
    // Block guests from liking
    if (isGuest) {
      setGuestAction('like posts');
      setShowGuestPrompt(true);
      return;
    }
    
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(prevPosts =>
          prevPosts.map(post =>
            post.id === postId
              ? { ...post, is_liked: data.liked, likes_count: data.likes_count }
              : post
          )
        );

        // Track like event
        if (data.liked) {
          Analytics.postLiked(token, { post_id: postId });
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleSave = async (postId: string) => {
    if (!token) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      const method = post.is_saved ? 'DELETE' : 'POST';
      const response = await fetch(`${API_URL}/api/posts/${postId}/save`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === postId
              ? { ...p, is_saved: data.is_saved }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleProfile = (userId: string) => {
    // Block guests from viewing profiles
    if (isGuest) {
      setGuestAction('view profiles');
      setShowGuestPrompt(true);
      return;
    }
    
    // If clicking on own profile, navigate to profile tab
    if (user && user.id === userId) {
      router.push('/(tabs)/profile');
    } else {
      // Otherwise navigate to user-profile screen (keeps tabs visible)
      router.push(`/user-profile?userId=${userId}`);
    }
  };

  const handleCreatePost = () => {
    // Block guests from creating posts
    if (isGuest) {
      setGuestAction('create posts');
      setShowGuestPrompt(true);
      return;
    }
    router.push('/create-post');
  };

  const handleComments = (postId: string) => {
    // Block guests from commenting
    if (isGuest) {
      setGuestAction('comment on posts');
      setShowGuestPrompt(true);
      return;
    }
    
    setSelectedPostId(postId);
    setShowComments(true);
  };

  const handleCommentAdded = () => {
    // Refresh posts to update comment count
    fetchPosts();
  };

  // Default placeholder image for workouts without images
  const DEFAULT_WORKOUT_IMAGE = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop';

  // Extract the main mood card name from workoutType or moodCategory
  // workoutType might be "Calisthenics - Bodyweight exercises" or "Muscle Gainer - Shoulders"
  const extractMoodCardName = (category: string): string => {
    if (!category || category.toLowerCase() === 'workout' || category.toLowerCase() === 'unknown' || category.toLowerCase() === 'custom') {
      return "Custom";
    }
    
    // If it contains " - ", extract the first part (mood card name)
    if (category.includes(' - ')) {
      const moodCardPart = category.split(' - ')[0].trim();
      // Capitalize properly
      return moodCardPart
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    // Known mood card titles - check if category matches or contains these
    const moodCardTitles: { [key: string]: string } = {
      "i want to sweat": "Sweat / Burn Fat",
      "sweat / burn fat": "Sweat / Burn Fat",
      "i'm feeling lazy": "I'm Feeling Lazy",
      "muscle gainer": "Muscle Gainer",
      "outdoor": "Outdoor",
      "lift weights": "Lift Weights",
      "calisthenics": "Calisthenics",
      "bodyweight": "Calisthenics", // Map bodyweight to Calisthenics
    };
    
    const lowerCategory = category.toLowerCase();
    for (const [key, value] of Object.entries(moodCardTitles)) {
      if (lowerCategory.includes(key)) return value;
    }
    
    // If nothing matches, return the original (capitalized)
    return category
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Handle replicating a workout from a post
  // =========================================================================
  // HANDLE REPLICATE WORKOUT - Uses ONLY attached_workout, NO FALLBACKS
  // =========================================================================
  const handleReplicateWorkout = (post: Post) => {
    // DEBUG: Log the post data for Try This Workout
    console.log('🔍 REPLICATE_WORKOUT_DEBUG', {
      postId: post?.id,
      hasAttachedWorkout: !!post?.attached_workout,
      hasWorkoutData: !!post?.workout_data,
      attachedWorkoutKeys: post?.attached_workout ? Object.keys(post.attached_workout) : null,
      exerciseCount: post?.attached_workout?.exercises?.length || 0,
    });
    
    // Check if we have attached_workout
    if (!post.attached_workout) {
      console.log('❌ No attached_workout on post - workout unavailable');
      console.log('🔍 POST_DATA_DUMP:', JSON.stringify(post, null, 2).substring(0, 2000));
      Alert.alert(
        'Workout Unavailable',
        'REASON: missing_attached_workout\n\nThis workout is no longer available. It may have been posted before this feature was available.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Block guests from replicating workouts
    if (isGuest) {
      setGuestAction('replicate workouts');
      setShowGuestPrompt(true);
      return;
    }

    const attachedWorkout = post.attached_workout;
    console.log('✅ Found attached_workout:', attachedWorkout.title);
    console.log('   Exercises:', attachedWorkout.exercises?.length || 0);
    
    // Validate the attached workout
    if (!attachedWorkout.exercises || attachedWorkout.exercises.length === 0) {
      console.log('❌ attached_workout has no exercises');
      Alert.alert(
        'Workout Unavailable',
        'REASON: attached_workout_no_exercises\n\nThis workout has no exercises available.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Validate each exercise has required fields
    for (let i = 0; i < attachedWorkout.exercises.length; i++) {
      const ex = attachedWorkout.exercises[i];
      if (!ex.name || !ex.imageUrl || !ex.battlePlan) {
        console.log(`❌ Exercise ${i} is missing required fields`);
        Alert.alert(
          'Workout Unavailable',
          `REASON: exercise_${i}_incomplete\n\nExercise is missing: ${!ex.name ? 'name, ' : ''}${!ex.imageUrl ? 'image, ' : ''}${!ex.battlePlan ? 'battlePlan' : ''}`,
          [{ text: 'OK' }]
        );
        return;
      }
    }

    // Clear existing cart and add all workouts from attached_workout
    clearCart();
    
    const moodCategory = attachedWorkout.moodCategory || 'Workout';
    const moodCardName = extractMoodCardName(moodCategory);
    
    let addedCount = 0;
    attachedWorkout.exercises.forEach((exercise, index) => {
      const workoutItem: WorkoutItem = {
        // Core identification
        id: `attached-${exercise.exerciseId}-${Date.now()}-${index}`,
        
        // Display fields - ALL REQUIRED, no fallbacks
        name: exercise.name,
        imageUrl: exercise.imageUrl,
        duration: exercise.duration,
        equipment: exercise.equipment,
        difficulty: exercise.difficulty,
        
        // Content fields - REQUIRED
        description: exercise.description || exercise.battlePlan,
        battlePlan: exercise.battlePlan,
        intensityReason: exercise.intensityReason || `${exercise.difficulty} intensity workout`,
        
        // Category fields
        workoutType: moodCategory,
        moodCard: moodCardName,
        
        // Tips
        moodTips: exercise.moodTips || [],
        
        // Source tracking
        source: 'build_for_me',
      };
      
      console.log(`✅ Adding cart item: ${workoutItem.name}`);
      addToCart(workoutItem);
      addedCount++;
    });

    // Track analytics
    if (token) {
      Analytics.tryWorkoutClicked(token, {
        workout_name: attachedWorkout.exercises[0]?.name || 'Unknown',
        equipment: attachedWorkout.exercises[0]?.equipment || '',
        difficulty: attachedWorkout.exercises[0]?.difficulty || '',
        mood_category: moodCardName,
        source: 'explore_attached_workout',
      });
      
      Analytics.workoutReplicated(token, {
        source_post_id: post.id,
        source_author: post.author.username,
        exercises_count: addedCount,
        mood_category: moodCardName,
      });
    }

    // Navigate directly to cart
    console.log(`✅ Navigating to cart with ${addedCount} exercises`);
    router.push('/cart');
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => confirmDeletePost(postId)
        },
      ]
    );
  };

  const confirmDeletePost = async (postId: string) => {
    if (!token) return;

    setDeletingPostId(postId);
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove the post from local state
        setPosts(prev => prev.filter(p => p.id !== postId));
        Alert.alert('Success', 'Post deleted successfully');
      } else {
        const data = await response.json();
        Alert.alert('Error', data.detail || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete post. Please try again.');
    } finally {
      setDeletingPostId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Text style={styles.title}>Explore</Text>
        </View>
        <ScrollView style={styles.content}>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Explore</Text>
        <View style={styles.headerActions}>
          {/* Search button */}
          {!isGuest && (
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Ionicons name={showSearch ? "close" : "search"} size={22} color="#fff" />
            </TouchableOpacity>
          )}
          {/* Notifications button with badge */}
          {!isGuest && (
            <TouchableOpacity 
              style={[
                styles.headerIconButton,
                activeTab === 'notifications' && styles.headerIconButtonActive
              ]}
              onPress={() => {
                setActiveTab('notifications');
                // fetchNotifications will handle marking as read
              }}
            >
              <View style={styles.headerIconContainer}>
                <Ionicons 
                  name={activeTab === 'notifications' ? 'notifications' : 'notifications-outline'} 
                  size={22} 
                  color={activeTab === 'notifications' ? '#FFD700' : '#fff'} 
                />
                {/* Notification badge on bell icon (only notifications, not messages) */}
                {unreadNotifications > 0 && activeTab !== 'notifications' && (
                  <View style={styles.headerNotificationBadge}>
                    <Text style={styles.headerNotificationBadgeText}>
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
          {/* Create post button */}
          <TouchableOpacity 
            style={styles.headerIconButton}
            onPress={handleCreatePost}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={handleSearchChange}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                <Ionicons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Search Results */}
      {showSearch && searchQuery.length > 0 && (
        <ScrollView style={styles.searchResults}>
          {searchLoading ? (
            <View style={styles.searchLoadingContainer}>
              <ActivityIndicator size="small" color="#FFD700" />
            </View>
          ) : searchResults.length === 0 ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No users found</Text>
            </View>
          ) : (
            searchResults.map((user) => (
              <View key={user.id} style={styles.userResultCard}>
                <TouchableOpacity
                  style={styles.userResultInfo}
                  onPress={() => handleProfile(user.id)}
                >
                  {user.avatar ? (
                    <Image 
                      source={{ 
                        uri: user.avatar.startsWith('http') 
                          ? user.avatar 
                          : `${API_URL}${user.avatar}` 
                      }} 
                      style={styles.userResultAvatar} 
                    />
                  ) : (
                    <View style={[styles.userResultAvatar, styles.avatarPlaceholder]}>
                      <Ionicons name="person" size={24} color="#666" />
                    </View>
                  )}
                  <View style={styles.userResultDetails}>
                    <Text style={styles.userResultName}>{user.name || user.username}</Text>
                    <Text style={styles.userResultUsername}>@{user.username}</Text>
                    {user.bio && <Text style={styles.userResultBio} numberOfLines={1}>{user.bio}</Text>}
                    <Text style={styles.userResultStats}>
                      {user.followers_count} followers · {user.following_count} following
                    </Text>
                  </View>
                </TouchableOpacity>
                {!user.is_self && (
                  <TouchableOpacity
                    style={[
                      styles.followButton,
                      user.is_following && styles.followingButton
                    ]}
                    onPress={() => handleFollowToggle(user.id)}
                  >
                    <Text style={[
                      styles.followButtonText,
                      user.is_following && styles.followingButtonText
                    ]}>
                      {user.is_following ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Feed Tabs - Equal Width */}
      {!showSearch && <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.feedTab, activeTab === 'forYou' && styles.feedTabActive]}
          onPress={() => setActiveTab('forYou')}
        >
          <Text style={[
            styles.feedTabText,
            activeTab === 'forYou' && styles.feedTabTextActive
          ]}>
            For You
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.feedTab, activeTab === 'following' && styles.feedTabActive]}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[
            styles.feedTabText,
            activeTab === 'following' && styles.feedTabTextActive
          ]}>
            Following
          </Text>
        </TouchableOpacity>
      </View>}

      {!showSearch && activeTab !== 'notifications' && <ScrollView
        ref={scrollViewRef}
        style={styles.feed}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const paddingToBottom = 100;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            if (!loadingMore && hasMore) {
              fetchPosts(true);
            }
          }
          
          // Determine which post is visible
          const scrollY = nativeEvent.contentOffset.y;
          const viewportCenter = scrollY + (layoutMeasurement.height / 2);
          
          // Find the post that's most visible
          for (const postId of Object.keys(postLayoutsRef.current)) {
            const layout = postLayoutsRef.current[postId];
            if (layout && viewportCenter >= layout.y && viewportCenter <= layout.y + layout.height) {
              if (visiblePostId !== postId) {
                setVisiblePostId(postId);
              }
              break;
            }
          }
        }}
        scrollEventThrottle={100}
      >
        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="fitness" size={64} color="#666" />
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'following' 
                ? 'Follow users to see their posts here'
                : 'Be the first to share your fitness journey!'}
            </Text>
          </View>
        ) : (
          posts.map((post) => {
            const likeScale = likeAnimations[post.id]
              ? likeAnimations[post.id].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                })
              : new Animated.Value(0);

            return (
              <View 
                key={post.id} 
                style={styles.postCard}
                onLayout={(event) => {
                  const { y, height } = event.nativeEvent.layout;
                  postLayoutsRef.current[post.id] = { y, height };
                }}
              >
                {/* Post Header */}
                <View style={styles.postHeader}>
                  <TouchableOpacity
                    style={styles.authorInfo}
                    onPress={() => handleProfile(post.author.id)}
                  >
                    {post.author.avatar ? (
                      <Image 
                        source={{ 
                          uri: post.author.avatar.startsWith('http') 
                            ? post.author.avatar 
                            : `${API_URL}${post.author.avatar}` 
                        }} 
                        style={styles.avatar}
                        contentFit="cover"
                        transition={100}
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Ionicons name="person" size={20} color="#666" />
                      </View>
                    )}
                    <View>
                      <Text style={styles.authorName}>{post.author.name || post.author.username}</Text>
                      <Text style={styles.authorUsername}>@{post.author.username}</Text>
                    </View>
                  </TouchableOpacity>
                  {/* 3-dot menu for post options */}
                  <TouchableOpacity
                    style={styles.postMenuButton}
                    onPress={() => {
                      setSelectedMenuPost(post);
                      setShowPostMenu(true);
                    }}
                  >
                    <Ionicons name="ellipsis-horizontal" size={20} color="#888" />
                  </TouchableOpacity>
                </View>

                {/* Post Media (Images and Videos) */}
                {post.media_urls.length > 0 && (
                  <View>
                    <ErrorBoundary>
                      <MediaCarousel 
                        media={post.media_urls.map(url => {
                          // If URL doesn't start with http/https, prepend backend URL
                          if (!url.startsWith('http')) {
                            return url.startsWith('/') ? `${API_URL}${url}` : `${API_URL}/api/uploads/${url}`;
                          }
                          return url;
                        })}
                        postId={post.id}
                        isPostVisible={visiblePostId === post.id}
                        coverUrls={post.cover_urls}
                        onIndexChange={(index) => {
                          setCarouselIndexes(prev => ({ ...prev, [post.id]: index }));
                          
                          // Trigger animation when swiping to the last slide (workout completion card)
                          if (post.workout_data && 
                              post.workout_data.workouts && 
                              post.workout_data.workouts.length > 0 && 
                              index === post.media_urls.length - 1) {
                            // Create animation if it doesn't exist
                            if (!tryWorkoutAnimations[post.id]) {
                              tryWorkoutAnimations[post.id] = new Animated.Value(0);
                            }
                            // Reset and play animation
                            tryWorkoutAnimations[post.id].setValue(0);
                            Animated.spring(tryWorkoutAnimations[post.id], {
                              toValue: 1,
                              useNativeDriver: true,
                              tension: 50,
                              friction: 7,
                            }).start();
                          }
                        }}
                      />
                    </ErrorBoundary>
                    
                    {/* Try This Workout Button - Only show on workout completion card (last slide) */}
                    {post.workout_data && 
                     post.workout_data.workouts && 
                     post.workout_data.workouts.length > 0 && 
                     (carouselIndexes[post.id] ?? 0) === post.media_urls.length - 1 && (
                      <Animated.View
                        style={[
                          styles.tryWorkoutButtonContainer,
                          {
                            opacity: tryWorkoutAnimations[post.id] || 1,
                            transform: [
                              {
                                scale: tryWorkoutAnimations[post.id] 
                                  ? tryWorkoutAnimations[post.id].interpolate({
                                      inputRange: [0, 0.5, 1],
                                      outputRange: [0.8, 1.05, 1],
                                    })
                                  : 1,
                              },
                              {
                                translateX: tryWorkoutAnimations[post.id]
                                  ? tryWorkoutAnimations[post.id].interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [20, 0],
                                    })
                                  : 0,
                              },
                            ],
                          },
                        ]}
                      >
                        <TouchableOpacity 
                          style={styles.tryWorkoutButton}
                          onPress={() => handleReplicateWorkout(post)}
                          activeOpacity={0.8}
                        >
                          {/* Shimmer overlay */}
                          <Animated.View
                            style={[
                              styles.shimmerOverlay,
                              {
                                transform: [
                                  {
                                    translateX: shimmerAnim.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [-150, 150],
                                    }),
                                  },
                                ],
                              },
                            ]}
                          >
                            <LinearGradient
                              colors={[
                                'transparent',
                                'rgba(255, 215, 0, 0.15)',
                                'rgba(255, 255, 255, 0.25)',
                                'rgba(255, 215, 0, 0.15)',
                                'transparent',
                              ]}
                              start={{ x: 0, y: 0.5 }}
                              end={{ x: 1, y: 0.5 }}
                              style={styles.shimmerGradient}
                            />
                          </Animated.View>
                          <Ionicons name="chevron-forward" size={14} color="#FFD700" />
                          <Text style={styles.tryWorkoutButtonText}>Try this workout</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    )}
                    
                    {likeAnimations[post.id] && (
                      <Animated.View
                        style={[
                          styles.likeAnimationContainer,
                          {
                            opacity: likeScale,
                            transform: [
                              {
                                scale: likeScale.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 1.5],
                                }),
                              },
                            ],
                          },
                        ]}
                        pointerEvents="none"
                      >
                        <Ionicons name="heart" size={80} color="#FFD700" />
                      </Animated.View>
                    )}
                  </View>
                )}

                {/* Post Actions */}
                <View style={styles.postActions}>
                  <View style={styles.leftActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleLike(post.id)}
                    >
                      <View style={styles.socialIconContainer}>
                        <Ionicons
                          name={post.is_liked ? 'heart' : 'heart-outline'}
                          size={22}
                          color={post.is_liked ? '#FF6B6B' : 'rgba(255,255,255,0.7)'}
                        />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleComments(post.id)}
                    >
                      <View style={styles.socialIconContainer}>
                        <Ionicons name="chatbubble-outline" size={20} color="rgba(255,255,255,0.7)" />
                      </View>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleSave(post.id)}
                  >
                    <View style={styles.socialIconContainer}>
                      <Ionicons 
                        name={post.is_saved ? 'bookmark' : 'bookmark-outline'} 
                        size={20} 
                        color={post.is_saved ? '#FFD700' : 'rgba(255,255,255,0.7)'} 
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Likes Count */}
                <View style={styles.likesSection}>
                  <Text style={styles.likesText}>
                    {post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}
                  </Text>
                </View>

                {/* Caption */}
                {post.caption && (
                  <View style={styles.captionSection}>
                    <Text style={styles.caption}>
                      <Text style={styles.captionUsername}>@{post.author.username} </Text>
                      {post.caption}
                    </Text>
                  </View>
                )}

                {/* Comments Preview */}
                {post.first_comment && (
                  <View style={styles.firstCommentContainer}>
                    <Text style={styles.firstCommentText} numberOfLines={2}>
                      <Text style={styles.firstCommentUsername}>
                        {post.first_comment.author.username}
                      </Text>
                      {'  '}{post.first_comment.text}
                    </Text>
                  </View>
                )}
                <TouchableOpacity onPress={() => handleComments(post.id)}>
                  <Text style={styles.viewComments}>
                    {post.comments_count > 0 
                      ? `View all ${post.comments_count} ${post.comments_count === 1 ? 'comment' : 'comments'}`
                      : 'Add a comment...'
                    }
                  </Text>
                </TouchableOpacity>

                {/* Timestamp */}
                <Text style={styles.timestamp}>
                  {new Date(post.created_at).toLocaleDateString()}
                </Text>
              </View>
            );
          })
        )}
        
        {/* Loading more indicator */}
        {loadingMore && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color="#FFD700" />
            <Text style={styles.loadingMoreText}>Loading more posts...</Text>
          </View>
        )}
        
        {/* End of posts indicator */}
        {!hasMore && posts.length > 0 && (
          <View style={styles.endOfPosts}>
            <Text style={styles.endOfPostsText}>You've reached the end!</Text>
          </View>
        )}
      </ScrollView>}

      {/* Notifications Tab Content */}
      {activeTab === 'notifications' && !showSearch && (
        <ScrollView
          style={styles.notificationsContainer}
          contentContainerStyle={styles.notificationsContent}
          refreshControl={
            <RefreshControl
              refreshing={notificationsRefreshing}
              onRefresh={onRefreshNotifications}
              tintColor="#FFD700"
              colors={['#FFD700']}
            />
          }
        >
          {notificationsLoading ? (
            <View style={styles.notificationsLoading}>
              <ActivityIndicator size="large" color="#FFD700" />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.notificationsEmpty}>
              <Ionicons name="notifications-outline" size={64} color="#333" />
              <Text style={styles.notificationsEmptyTitle}>No Notifications</Text>
              <Text style={styles.notificationsEmptyText}>
                When someone likes, comments on your posts, or follows you, you'll see it here.
              </Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={styles.notificationItem}
                onPress={() => {
                  if (notification.type === 'follow') {
                    // For follow notifications, go to user profile
                    handleProfile(notification.user.id);
                  } else if (notification.post_id) {
                    // For like/comment notifications, go to the post
                    router.push(`/post-detail?postId=${notification.post_id}`);
                  } else {
                    // Fallback to user profile
                    handleProfile(notification.user.id);
                  }
                }}
              >
                {/* User Avatar */}
                <View style={styles.notificationAvatarContainer}>
                  {notification.user.avatar ? (
                    <Image
                      source={{
                        uri: notification.user.avatar.startsWith('http')
                          ? notification.user.avatar
                          : `${API_URL}${notification.user.avatar}`
                      }}
                      style={styles.notificationAvatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.notificationAvatar, styles.notificationAvatarPlaceholder]}>
                      <Ionicons name="person" size={20} color="#666" />
                    </View>
                  )}
                  <View style={[
                    styles.notificationIconBadge,
                    { backgroundColor: getNotificationIconColor(notification.type) }
                  ]}>
                    <Ionicons 
                      name={getNotificationIcon(notification.type) as any} 
                      size={10} 
                      color="#fff" 
                    />
                  </View>
                </View>

                {/* Notification Content */}
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationText}>
                    <Text style={styles.notificationUsername}>
                      {notification.user.username}
                    </Text>
                    {' '}{notification.message}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {formatTimeAgo(notification.created_at)}
                  </Text>
                </View>

                {/* Post Preview Thumbnail */}
                {notification.post_preview && notification.type !== 'follow' && (
                  (() => {
                    // Check if original URL is a video (before any transformations)
                    // Cloudinary transformed video thumbnails contain /so_0,f_jpg/ or similar
                    const isCloudinaryVideoThumbnail = notification.post_preview.includes('/so_0') || 
                                                        notification.post_preview.includes('f_jpg') ||
                                                        notification.post_preview.includes('f_png');
                    const isRawVideo = !isCloudinaryVideoThumbnail && 
                                       notification.post_preview.match(/\.(mov|mp4|avi|webm|mkv|m4v)(\?|$)/i);
                    
                    const previewUri = notification.post_preview.startsWith('http')
                      ? notification.post_preview
                      : `${API_URL}${notification.post_preview}`;
                    
                    if (isRawVideo) {
                      // Show video icon placeholder for raw video URLs
                      return (
                        <View style={[styles.notificationPostPreview, styles.videoPlaceholder]}>
                          <Ionicons name="play-circle" size={24} color="#666" />
                        </View>
                      );
                    }
                    
                    // Show image (including cloudinary video thumbnails)
                    return (
                      <Image
                        source={{ uri: previewUri }}
                        style={styles.notificationPostPreview}
                        contentFit="cover"
                        transition={200}
                      />
                    );
                  })()
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}

      {/* Comments Bottom Sheet */}
      <Modal
        visible={showComments}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowComments(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPostId && token && (
              <CommentsBottomSheet
                postId={selectedPostId}
                authToken={token}
                currentUserId={user?.id}
                onClose={() => setShowComments(false)}
                onCommentAdded={handleCommentAdded}
                onUserPress={handleProfile}
              />
            )}
          </View>
        </View>
      </Modal>
      
      {/* Guest Prompt Modal */}
      <GuestPromptModal 
        visible={showGuestPrompt}
        onClose={() => setShowGuestPrompt(false)}
        action={guestAction}
      />

      {/* Post Options Menu */}
      {showPostMenu && selectedMenuPost && (
        <TouchableOpacity 
          style={styles.postMenuOverlay} 
          activeOpacity={1} 
          onPress={() => setShowPostMenu(false)}
        >
          <View style={styles.postMenuContainer}>
            <View style={styles.postMenuHeader}>
              <View style={styles.postMenuHandle} />
            </View>
            
            {/* Save Post */}
            <TouchableOpacity 
              style={styles.postMenuItem}
              onPress={() => {
                setShowPostMenu(false);
                handleSave(selectedMenuPost.id);
              }}
            >
              <Ionicons 
                name={selectedMenuPost.is_saved ? 'bookmark' : 'bookmark-outline'} 
                size={24} 
                color={selectedMenuPost.is_saved ? '#FFD700' : '#fff'} 
              />
              <Text style={styles.postMenuItemText}>
                {selectedMenuPost.is_saved ? 'Unsave Post' : 'Save Post'}
              </Text>
            </TouchableOpacity>

            {/* Report Post - only show for other users' posts */}
            {user && user.id !== selectedMenuPost.author.id && (
              <TouchableOpacity 
                style={styles.postMenuItem}
                onPress={() => {
                  if (isGuest) {
                    setShowPostMenu(false);
                    setGuestAction('report content');
                    setShowGuestPrompt(true);
                  } else {
                    setShowPostMenu(false);
                    setShowReportModal(true);
                  }
                }}
              >
                <Ionicons name="flag-outline" size={24} color="#FF9500" />
                <Text style={[styles.postMenuItemText, { color: '#FF9500' }]}>Report Post</Text>
              </TouchableOpacity>
            )}

            {/* Delete Post - show for own posts OR for admin on any post */}
            {user && (user.id === selectedMenuPost.author.id || isAdmin) && (
              <TouchableOpacity 
                style={styles.postMenuItem}
                onPress={() => {
                  setShowPostMenu(false);
                  handleDeletePost(selectedMenuPost.id);
                }}
                disabled={deletingPostId === selectedMenuPost.id}
              >
                {deletingPostId === selectedMenuPost.id ? (
                  <ActivityIndicator size="small" color="#FF4444" />
                ) : (
                  <Ionicons name="trash-outline" size={24} color="#FF4444" />
                )}
                <Text style={[styles.postMenuItemText, { color: '#FF4444' }]}>
                  {isAdmin && user.id !== selectedMenuPost.author.id ? 'Delete Post (Admin)' : 'Delete Post'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Cancel */}
            <TouchableOpacity 
              style={styles.postMenuCancelItem}
              onPress={() => setShowPostMenu(false)}
            >
              <Text style={styles.postMenuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setSelectedMenuPost(null);
        }}
        contentType="post"
        contentId={selectedMenuPost?.id || ''}
        token={token}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1c1c1c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  headerIconContainer: {
    position: 'relative',
  },
  headerNotificationBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#1c1c1c',
  },
  headerNotificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888',
    marginTop: 16,
    fontSize: 14,
  },
  feed: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: '#0c0c0c',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.1)',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deletePostButton: {
    padding: 8,
  },
  postMenuButton: {
    padding: 8,
  },
  postMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  postMenuContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  postMenuHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  postMenuHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
  },
  postMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  postMenuItemText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  postMenuCancelItem: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  postMenuCancelText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFD700',
    backgroundColor: '#1a1a1a',
  },
  avatarPlaceholder: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  authorUsername: {
    fontSize: 12,
    color: '#888',
  },
  likeAnimationContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
    zIndex: 10,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  socialIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  likesSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  captionSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  caption: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  captionUsername: {
    fontWeight: '600',
    color: '#FFD700',
  },
  viewComments: {
    fontSize: 13,
    color: '#888',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  firstCommentContainer: {
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  firstCommentText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  firstCommentUsername: {
    fontWeight: '600',
    color: '#fff',
  },
  timestamp: {
    fontSize: 11,
    color: '#666',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  tryWorkoutButtonContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  tryWorkoutButton: {
    height: 32,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#333',
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  shimmerGradient: {
    width: 60,
    height: '100%',
  },
  tryWorkoutButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '75%',
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  mainTabsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  mainTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FFD700',
  },
  notificationTab: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  notificationTabActive: {
    // Active state handled by icon color
  },
  notificationBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#000',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
  },
  activeTabText: {
    color: '#FFD700',
  },
  feedTab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  feedTabActive: {
    borderBottomColor: '#FFD700',
  },
  feedTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  feedTabTextActive: {
    color: '#FFD700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.1)',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 0,
  },
  searchResults: {
    flex: 1,
    backgroundColor: '#0c0c0c',
  },
  searchLoadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noResultsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#888',
    fontSize: 16,
  },
  userResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.1)',
  },
  userResultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userResultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  userResultDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userResultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  userResultUsername: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  userResultBio: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 4,
  },
  userResultStats: {
    fontSize: 12,
    color: '#666',
  },
  followButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFD700',
  },
  followingButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  followingButtonText: {
    color: '#FFD700',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 10,
  },
  loadingMoreText: {
    color: '#888',
    fontSize: 14,
  },
  endOfPosts: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  endOfPostsText: {
    color: '#666',
    fontSize: 14,
  },
  // Notifications Styles
  notificationsContainer: {
    flex: 1,
  },
  notificationsContent: {
    paddingBottom: 100,
  },
  notificationsLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  notificationsEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  notificationsEmptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  notificationsEmptyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 22,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  notificationAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  notificationAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  notificationAvatarPlaceholder: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  notificationContent: {
    flex: 1,
    marginRight: 12,
  },
  notificationText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  notificationUsername: {
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  notificationPostPreview: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
  },
});