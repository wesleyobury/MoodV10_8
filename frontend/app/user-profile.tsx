import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Analytics } from '../utils/analytics';
import GuestPromptModal from '../components/GuestPromptModal';
import ReportModal from '../components/ReportModal';
import BlockUserModal from '../components/BlockUserModal';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Constants from 'expo-constants';
import VideoThumbnail from '../components/VideoThumbnail';

import { API_URL } from '../utils/apiConfig';
const { width } = Dimensions.get('window');

interface User {
  id: string;
  username: string;
  name: string;
  bio: string;
  avatar: string;
  followers_count: number;
  following_count: number;
  workouts_count: number;
  current_streak: number;
}

interface Post {
  id: string;
  media_urls: string[];
  cover_urls?: { [key: string]: string }; // Map of media index to cover URL
  likes_count: number;
  comments_count: number;
}

export default function UserProfile() {
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [loading, setLoading] = useState(true);
  const { token, isGuest } = useAuth();
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/explore');
    }
  }, [router]);

  useEffect(() => {
    // Show guest prompt if guest tries to view a profile
    if (isGuest) {
      setShowGuestPrompt(true);
    }
  }, [isGuest]);

  useEffect(() => {
    // Track profile view when the page loads (only for non-self profiles)
    if (token && userId && !isSelf && user) {
      Analytics.profileViewed(token, {
        viewed_user_id: userId,
      });
    }
  }, [userId, token, isSelf, user]);

  useEffect(() => {
    if (token && userId) {
      fetchUserProfile();
      fetchUserPosts();
      checkFollowingStatus();
    }
  }, [token, userId]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/posts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  const checkFollowingStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}/is-following`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.is_following);
        setIsSelf(data.is_self);
      }
    } catch (error) {
      console.error('Error checking following status:', error);
    }
  };

  const handleFollowToggle = async () => {
    // Block guests from following
    if (isGuest) {
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
        setIsFollowing(data.following);
        
        // Track follow/unfollow
        if (data.following) {
          Analytics.userFollowed(token, { followed_user_id: userId });
        } else {
          Analytics.userUnfollowed(token, { unfollowed_user_id: userId });
        }
        
        // Update local user state
        if (user) {
          setUser({
            ...user,
            followers_count: data.following 
              ? user.followers_count + 1 
              : user.followers_count - 1,
          });
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleFollowers = () => {
    router.push(`/followers-list?userId=${userId}&type=followers`);
  };

  const handleFollowing = () => {
    router.push(`/followers-list?userId=${userId}&type=following`);
  };

  const renderPostItem = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={styles.postItem}
      onPress={() => {
        router.push(`/post-detail?postId=${item.id}`);
      }}
    >
      {item.media_urls.length > 0 ? (
        (() => {
          const mediaUrl = item.media_urls[0];
          const isVideo = mediaUrl && (
            mediaUrl.toLowerCase().endsWith('.mov') ||
            mediaUrl.toLowerCase().endsWith('.mp4') ||
            mediaUrl.toLowerCase().endsWith('.avi') ||
            mediaUrl.toLowerCase().endsWith('.webm')
          );
          
          // Fix URL if needed
          const fullUrl = mediaUrl.startsWith('http') ? mediaUrl : 
            (mediaUrl.startsWith('/') ? `${API_URL}${mediaUrl}` : `${API_URL}/api/uploads/${mediaUrl}`);
          
          // Get cover URL for this video if available
          const coverUrl = item.cover_urls && item.cover_urls['0'] 
            ? (item.cover_urls['0'].startsWith('http') 
                ? item.cover_urls['0'] 
                : `${API_URL}/api/uploads/${item.cover_urls['0']}`)
            : null;
          
          if (isVideo) {
            return (
              <VideoThumbnail 
                videoUrl={fullUrl}
                coverUrl={coverUrl}
                style={styles.postImage}
              />
            );
          }
          
          return (
            <Image 
              source={{ uri: fullUrl }} 
              style={styles.postImage}
              resizeMode="cover"
            />
          );
        })()
      ) : (
        <View style={[styles.postImage, styles.noImagePost]}>
          <Ionicons name="image-outline" size={40} color='#666' />
        </View>
      )}
      
      {/* Video indicator */}
      {item.media_urls.length > 0 && (
        item.media_urls[0].toLowerCase().endsWith('.mov') ||
        item.media_urls[0].toLowerCase().endsWith('.mp4') ||
        item.media_urls[0].toLowerCase().endsWith('.avi') ||
        item.media_urls[0].toLowerCase().endsWith('.webm')
      ) && (
        <View style={styles.videoIndicator}>
          <Ionicons name="videocam" size={14} color="#fff" />
        </View>
      )}
      
      {/* Multi-image indicator */}
      {item.media_urls.length > 1 && (
        <View style={styles.multiImageIndicator}>
          <Ionicons name="copy-outline" size={16} color="#fff" />
        </View>
      )}
      
      {/* Engagement overlay */}
      <View style={styles.postOverlay}>
        <View style={styles.engagementInfo}>
          <View style={styles.engagementItem}>
            <Ionicons name="heart" size={16} color="#fff" />
            <Text style={styles.engagementText}>{item.likes_count}</Text>
          </View>
          <View style={styles.engagementItem}>
            <Ionicons name="chatbubble" size={16} color="#fff" />
            <Text style={styles.engagementText}>{item.comments_count}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFD700" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFD700" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#FF4444" />
          <Text style={styles.errorText}>User not found</Text>
          <TouchableOpacity style={styles.backToFeedButton} onPress={handleGoBack}>
            <Text style={styles.backToFeedText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFD700" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{user.username}</Text>
        {!isSelf ? (
          <TouchableOpacity 
            style={styles.moreButton} 
            onPress={() => setShowMoreOptions(true)}
          >
            <Ionicons name="ellipsis-horizontal" size={24} color="#FFD700" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      {/* More Options Modal */}
      {showMoreOptions && (
        <TouchableOpacity 
          style={styles.optionsOverlay} 
          activeOpacity={1} 
          onPress={() => setShowMoreOptions(false)}
        >
          <View style={styles.optionsMenu}>
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => {
                setShowMoreOptions(false);
                setShowReportModal(true);
              }}
            >
              <Ionicons name="flag-outline" size={22} color="#FF9500" />
              <Text style={styles.optionText}>Report User</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.optionItem, styles.optionItemDanger]}
              onPress={() => {
                setShowMoreOptions(false);
                setShowBlockModal(true);
              }}
            >
              <Ionicons name="ban-outline" size={22} color="#FF4444" />
              <Text style={[styles.optionText, styles.optionTextDanger]}>Block User</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.optionItemCancel}
              onPress={() => setShowMoreOptions(false)}
            >
              <Text style={styles.optionTextCancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentType='profile'
        contentId={userId}
        token={token}
      />

      {/* Block User Modal */}
      <BlockUserModal
        visible={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        userId={userId}
        username={user.username}
        token={token}
        onBlockSuccess={() => {
          // Navigate back after blocking
          handleGoBack();
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {user.avatar ? (
                <Image 
                  source={{ 
                    uri: user.avatar.startsWith('http') 
                      ? user.avatar 
                      : user.avatar.startsWith('/') 
                        ? `${API_URL}${user.avatar}`
                        : `${API_URL}/api/uploads/${user.avatar}`
                  }} 
                  style={styles.profileImage} 
                />
              ) : (
                <View style={[styles.profileImage, styles.placeholderAvatar]}>
                  <Ionicons name="person" size={40} color='#666' />
                </View>
              )}
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.workouts_count}</Text>
                <Text style={styles.statLabel}>Workouts</Text>
              </View>
              <TouchableOpacity style={styles.statItem} onPress={handleFollowers}>
                <Text style={styles.statValue}>{user.followers_count}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statItem} onPress={handleFollowing}>
                <Text style={styles.statValue}>{user.following_count}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.displayName}>{user.name}</Text>
            {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
          </View>

          {/* Follow Button or Edit Profile */}
          {isSelf ? (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => router.push('/edit-profile')}
            >
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity 
                style={[
                  styles.followButton,
                  isFollowing && styles.followingButton
                ]}
                onPress={handleFollowToggle}
              >
                <Text style={[
                  styles.followButtonText,
                  isFollowing && styles.followingButtonText
                ]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.messageButton}
                onPress={() => router.push({
                  pathname: '/chat',
                  params: {
                    userId: user.id,
                    username: user.username,
                    name: user.name,
                    avatar: user.avatar || ''
                  }
                })}
              >
                <Ionicons name="chatbubble-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Current Streak (if viewing own profile) */}
          {isSelf && (
            <View style={styles.streakContainer}>
              <Ionicons name="flame" size={24} color="#FF6B6B" />
              <Text style={styles.streakText}>
                {user.current_streak} day streak
              </Text>
            </View>
          )}
        </View>

        {/* Posts Grid */}
        <View style={styles.postsSection}>
          <View style={styles.postsSectionHeader}>
            <Ionicons name="grid" size={20} color="#FFD700" />
            <Text style={styles.postsSectionTitle}>Posts</Text>
          </View>
          
          {posts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="images-outline" size={48} color='#666' />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>
                {isSelf ? 'Share your fitness journey!' : `${user.username} hasn't posted yet`}
              </Text>
            </View>
          ) : (
            <FlatList
              data={posts}
              renderItem={renderPostItem}
              keyExtractor={(item) => item.id}
              numColumns={3}
              scrollEnabled={false}
              columnWrapperStyle={styles.postsRow}
            />
          )}
        </View>
      </ScrollView>
      
      {/* Guest Prompt Modal */}
      <GuestPromptModal 
        visible={showGuestPrompt}
        onClose={() => {
          setShowGuestPrompt(false);
          handleGoBack();
        }}
        action='view profiles'
      />
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
  backButton: {
    padding: 4,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  moreButton: {
    padding: 4,
    width: 40,
    alignItems: 'flex-end',
  },
  optionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 100,
    justifyContent: 'flex-end',
  },
  optionsMenu: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 8,
    paddingBottom: 30,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderRadius: 12,
  },
  optionItemDanger: {
    // styling for danger items
  },
  optionText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  optionTextDanger: {
    color: '#FF4444',
  },
  optionItemCancel: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  optionTextCancel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  backToFeedButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backToFeedText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  placeholderAvatar: {
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
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
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  editButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  editButtonText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  followButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButtonText: {
    color: '#fff',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  messageButton: {
    width: 44,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
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
  postsSection: {
    padding: 20,
  },
  postsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  postsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
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
  },
  postsRow: {
    justifyContent: 'flex-start',
    gap: 2,
    marginBottom: 2,
  },
  postItem: {
    width: (width - 44) / 3, // Account for padding and gaps
    height: (width - 44) / 3,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  noImagePost: {
    backgroundColor: '#1a1a1a',
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
  multiImageIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  postOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  engagementInfo: {
    flexDirection: 'row',
    gap: 16,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  engagementText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
