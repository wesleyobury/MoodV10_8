import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { useCart, WorkoutItem } from '../contexts/CartContext';
import MediaCarousel from '../components/MediaCarousel';
import ReportModal from '../components/ReportModal';
import GuestPromptModal from '../components/GuestPromptModal';
import CommentsBottomSheet from '../components/CommentsBottomSheet';
import BackButton from '../components/BackButton';
import Constants from 'expo-constants';
import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient';
import { Analytics, GuestAnalytics } from '../utils/analytics';

import { API_URL } from '../utils/apiConfig';

interface Author {
  id: string;
  username: string;
  name: string;
  avatar: string;
}

interface WorkoutExercise {
  name: string;
  equipment: string;
  duration: string;
  difficulty: string;
  imageUrl?: string;
  description?: string;
}

interface WorkoutData {
  workouts: WorkoutExercise[];
  total_duration: number;
  completed_at: string;
  mood_category?: string;
  workout_snapshot_id?: string; // Legacy - kept for backwards compatibility
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
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_saved: boolean;
  created_at: string;
  workout_data?: WorkoutData;  // Legacy - kept for display
  attached_workout?: AttachedWorkout;  // NEW: Canonical workout for "Try This Workout"
}

export default function PostDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token, user, isGuest } = useAuth();
  const { addToCart, clearCart } = useCart();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [guestAction, setGuestAction] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  
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

  // Check if current user is the post author
  const isOwnPost = post && user && post.author.id === user.id;

  useEffect(() => {
    if (params.postId && token) {
      fetchPost();
    }
  }, [params.postId, token]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`${API_URL}/api/posts/${params.postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Post detail fetched:', data.id, 'workout_data:', data.workout_data ? `${data.workout_data.workouts?.length || 0} exercises` : 'none');
        setPost(data);
      } else {
        console.error('Failed to fetch post:', response.status);
      }
    } catch (error) {
      console.error('Error fetching post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: confirmDelete 
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!post || !token) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`${API_URL}/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        Alert.alert('Success', 'Post deleted successfully');
        router.back();
      } else {
        const data = await response.json();
        Alert.alert('Error', data.detail || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLike = async () => {
    if (isGuest) {
      setGuestAction('like posts');
      setShowGuestPrompt(true);
      return;
    }
    if (!post || !token) return;

    try {
      const response = await fetch(`${API_URL}/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPost({
          ...post,
          is_liked: data.liked,
          likes_count: data.likes_count,
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleSave = async () => {
    if (isGuest) {
      setGuestAction('save posts');
      setShowGuestPrompt(true);
      return;
    }
    if (!post || !token) return;

    try {
      const response = await fetch(`${API_URL}/api/posts/${post.id}/save`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPost({
          ...post,
          is_saved: data.is_saved,
        });
        Alert.alert('Success', data.is_saved ? 'Post saved!' : 'Post removed from saved');
      }
    } catch (error) {
      console.error('Error saving post:', error);
    }
  };

  const handleReportPost = async (reason: string, details?: string) => {
    if (!post || !token) return;

    try {
      const response = await fetch(`${API_URL}/api/moderation/report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_id: post.id,
          content_type: 'post',
          reason: reason,
          details: details,
        }),
      });

      if (response.ok) {
        Alert.alert('Report Submitted', 'Thank you for helping keep our community safe.');
      } else {
        const data = await response.json();
        Alert.alert('Error', data.detail || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error reporting post:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    }
  };

  const handleComment = () => {
    if (isGuest) {
      setGuestAction('comment on posts');
      setShowGuestPrompt(true);
      return;
    }
    setShowComments(true);
  };

  const handleCommentAdded = () => {
    // Refresh the post to update comment count
    fetchPost();
  };

  // Check if last slide is workout completion card (has workout_data and it's the last slide)
  const isOnWorkoutCard = post?.workout_data?.workouts?.length > 0 && 
    carouselIndex === (post?.media_urls?.length || 1) - 1;

  // =========================================================================
  // HANDLE TRY WORKOUT - Uses ONLY attached_workout, NO FALLBACKS
  // =========================================================================
  const handleTryWorkout = () => {
    console.log('🏋️ Try this workout - checking for attached_workout');
    
    // DEBUG: Log the post data for Try This Workout
    console.log('🔍 TRY_WORKOUT_DEBUG', {
      postId: post?.id,
      hasAttachedWorkout: !!post?.attached_workout,
      hasWorkoutData: !!post?.workout_data,
      attachedWorkoutKeys: post?.attached_workout ? Object.keys(post.attached_workout) : null,
      exerciseCount: post?.attached_workout?.exercises?.length || 0,
    });
    
    // Check if we have attached_workout
    if (!post?.attached_workout) {
      console.log('❌ No attached_workout on post - workout unavailable');
      console.log('🔍 POST_DATA_DUMP:', JSON.stringify(post, null, 2));
      Alert.alert(
        'Workout Unavailable',
        'REASON: missing_attached_workout\n\nThis workout is no longer available. It may have been posted before this feature was available.',
        [{ text: 'OK' }]
      );
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
        console.log(`❌ Exercise ${i} is missing required fields:`, {
          hasName: !!ex.name,
          hasImageUrl: !!ex.imageUrl,
          hasBattlePlan: !!ex.battlePlan,
        });
        Alert.alert(
          'Workout Unavailable',
          `REASON: exercise_${i}_incomplete\n\nExercise is missing: ${!ex.name ? 'name, ' : ''}${!ex.imageUrl ? 'image, ' : ''}${!ex.battlePlan ? 'battlePlan' : ''}`,
          [{ text: 'OK' }]
        );
        return;
      }
    }
    
    // Clear cart and build from attached_workout
    clearCart();
    
    const moodCategory = attachedWorkout.moodCategory || 'Workout';
    
    attachedWorkout.exercises.forEach((exercise, index) => {
      const cartItem: WorkoutItem = {
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
        moodCard: moodCategory,
        
        // Tips
        moodTips: exercise.moodTips || [],
        
        // Source tracking
        source: 'build_for_me',
      };
      
      console.log(`✅ Adding cart item: ${cartItem.name}`);
      console.log(`   imageUrl: ${cartItem.imageUrl ? 'YES' : 'NO'}`);
      console.log(`   battlePlan: ${cartItem.battlePlan ? 'YES (' + cartItem.battlePlan.length + ' chars)' : 'NO'}`);
      
      addToCart(cartItem);
    });
    
    // Track analytics
    if (token) {
      Analytics.tryWorkoutClicked(token, {
        post_id: post.id,
        workout_count: attachedWorkout.exercises.length,
        author_id: post.author.id,
        source: 'attached_workout',
      });
    } else {
      GuestAnalytics.tryWorkoutClicked({
        post_id: post.id,
        workout_count: attachedWorkout.exercises.length,
      });
    }
    
    // Navigate to cart
    console.log(`✅ Navigating to cart with ${attachedWorkout.exercises.length} exercises`);
    router.push('/cart');
  };

  const handleUserPress = (userId: string) => {
    setShowComments(false);
    router.push(`/user-profile?userId=${userId}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      </SafeAreaView>
    );
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Post not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Post</Text>
        {isOwnPost ? (
          <TouchableOpacity onPress={handleDeletePost} disabled={isDeleting}>
            {isDeleting ? (
              <ActivityIndicator size="small" color="#888" />
            ) : (
              <Ionicons name="trash-outline" size={24} color="#888" />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setShowPostMenu(true)}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Author Info */}
        <View style={styles.authorSection}>
          {post.author.avatar ? (
            <Image source={{ uri: post.author.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={20} color='#666' />
            </View>
          )}
          <View>
            <Text style={styles.authorName}>{post.author.name || post.author.username}</Text>
            <Text style={styles.authorUsername}>@{post.author.username}</Text>
          </View>
        </View>

        {/* Media (Images/Videos) */}
        {post.media_urls.length > 0 && (
          <View style={styles.mediaWrapper}>
            <MediaCarousel 
              media={post.media_urls.map(url => {
                // If URL doesn't start with http/https, prepend backend URL
                if (!url.startsWith('http')) {
                  return url.startsWith('/') ? `${API_URL}${url}` : `${API_URL}/api/uploads/${url}`;
                }
                return url;
              })}
              onIndexChange={setCarouselIndex}
              coverUrls={post.cover_urls}
            />
            
            {/* Try this Workout Button - Only on workout completion card (last slide) */}
            {isOnWorkoutCard && (
              <Animated.View
                style={[
                  styles.tryWorkoutButtonContainer,
                  {
                    opacity: 1,
                    transform: [
                      { scale: 1 },
                      { translateX: 0 },
                    ],
                  },
                ]}
              >
                <TouchableOpacity 
                  style={styles.tryWorkoutButton}
                  onPress={handleTryWorkout}
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
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            <Ionicons
              name={post.is_liked ? 'heart' : 'heart-outline'}
              size={28}
              color={post.is_liked ? '#FF6B6B' : '#fff'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
            <Ionicons name="chatbubble-outline" size={26} color='#fff' />
          </TouchableOpacity>
        </View>

        {/* Likes Count */}
        <Text style={styles.likesText}>
          {post.likes_count} {post.likes_count === 1 ? 'like' : 'likes'}
        </Text>

        {/* Comments Count - Tappable */}
        {post.comments_count > 0 && (
          <TouchableOpacity onPress={handleComment}>
            <Text style={styles.commentsText}>
              View all {post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Caption */}
        {post.caption && (
          <View style={styles.captionSection}>
            <Text style={styles.caption}>
              <Text style={styles.captionUsername}>@{post.author.username} </Text>
              {post.caption}
            </Text>
          </View>
        )}

        {/* Timestamp */}
        <Text style={styles.timestamp}>
          {new Date(post.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </ScrollView>

      {/* Post Menu Modal */}
      <Modal
        visible={showPostMenu}
        transparent={true}
        animationType='fade'
        onRequestClose={() => setShowPostMenu(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowPostMenu(false)}
        >
          <View style={styles.postMenuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowPostMenu(false);
                if (isGuest) {
                  setGuestAction('save posts');
                  setShowGuestPrompt(true);
                } else {
                  handleSave();
                }
              }}
            >
              <Ionicons 
                name={post.is_saved ? 'bookmark' : "bookmark-outline"} 
                size={22} 
                color='#fff' 
              />
              <Text style={styles.menuItemText}>
                {post.is_saved ? 'Unsave' : 'Save'}
              </Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setShowPostMenu(false);
                if (isGuest) {
                  setGuestAction('report content');
                  setShowGuestPrompt(true);
                } else {
                  setShowReportModal(true);
                }
              }}
            >
              <Ionicons name="flag-outline" size={22} color='#FF6B6B' />
              <Text style={[styles.menuItemText, { color: '#FF6B6B' }]}>
                Report
              </Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => setShowPostMenu(false)}
            >
              <Ionicons name="close" size={22} color='#888' />
              <Text style={[styles.menuItemText, { color: '#888' }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportPost}
        contentType="post"
      />

      {/* Guest Prompt Modal */}
      <GuestPromptModal
        visible={showGuestPrompt}
        onClose={() => setShowGuestPrompt(false)}
        actionDescription={guestAction}
      />

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        animationType="slide"
        presentationStyle='pageSheet'
        onRequestClose={() => setShowComments(false)}
      >
        <View style={styles.commentsModal}>
          {post && token && (
            <CommentsBottomSheet
              postId={post.id}
              authToken={token}
              currentUserId={user?.id}
              onClose={() => setShowComments(false)}
              onCommentAdded={handleCommentAdded}
              onUserPress={handleUserPress}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
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
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  authorUsername: {
    fontSize: 13,
    color: '#888',
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
  // Media wrapper for overlay positioning
  mediaWrapper: {
    position: 'relative',
  },
  // Try workout button container - positioned bottom right
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
  likesText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  captionSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  caption: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  captionUsername: {
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postMenuContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 8,
    width: '80%',
    maxWidth: 300,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#fff',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 8,
  },
  commentsText: {
    fontSize: 14,
    color: '#888',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  commentsModal: {
    flex: 1,
    backgroundColor: '#000',
  },
});
