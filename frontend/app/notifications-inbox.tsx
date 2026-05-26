import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient';
import { useAuth } from '../contexts/AuthContext';
import notificationService, { Notification } from '../utils/notifications';
import { formatNotificationTime } from '../utils/notificationUtils';

// Notification type icons
const TYPE_ICONS: Record<string, { name: string; color: string }> = {
  follow: { name: 'person-add', color: '#4ECDC4' },
  comment: { name: 'chatbubble', color: '#FFD700' },
  like: { name: 'heart', color: '#FF6B6B' },
  message: { name: 'mail', color: '#45B7D1' },
  message_request: { name: 'mail-unread', color: '#9B59B6' },
  mention: { name: 'at', color: '#9B59B6' },
  reply: { name: 'return-down-forward', color: '#4ECDC4' },
  workout_reminder: { name: 'fitness', color: '#FF9F43' },
  featured_workout: { name: 'flash', color: '#FFD700' },
  featured_suggestion: { name: 'sparkles', color: '#FFD700' },
  following_digest: { name: 'newspaper', color: '#10AC84' },
};

// Time formatting - use shared utility
const formatTimeAgo = (dateString: string): string => {
  return formatNotificationTime(dateString);
};

// Notification Item Component
const NotificationItem = React.memo(({
  notification,
  onPress,
  onDismiss,
}: {
  notification: Notification;
  onPress: () => void;
  onDismiss: () => void;
}) => {
  const isUnread = !notification.read_at;
  const typeInfo = TYPE_ICONS[notification.type] || { name: 'notifications', color: '#888' };
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // Get content thumbnail - use explicit target_thumbnail_url first, then fall back to metadata
  // NEVER use actor avatar as fallback for content thumbnail
  const contentThumbnail = notification.target_thumbnail_url || 
                            notification.metadata?.post_thumbnail || 
                            notification.metadata?.post_preview;
  
  // Only show content thumbnail for relevant notification types
  const shouldShowContentThumbnail = ['like', 'comment', 'mention', 'reply'].includes(notification.type);
  const hasValidContentThumbnail = contentThumbnail && shouldShowContentThumbnail;

  // All notifications are clickable - featured_workout goes to cart, others go to home
  const isClickable = true;

  return (
    <Animated.View style={[
      styles.notificationItem,
      isUnread && styles.notificationItemUnread,
      { transform: [{ translateX: slideAnim }] },
    ]}>
      <TouchableOpacity
        style={styles.notificationContent}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {/* Left: Avatar or Type Icon (actor who performed the action) */}
        <View style={styles.avatarContainer}>
          {notification.actor?.avatar ? (
            <Image
              source={{ uri: notification.actor.avatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.typeIconContainer, { backgroundColor: `${typeInfo.color}20` }]}>
              <Ionicons name={typeInfo.name as any} size={20} color={typeInfo.color} />
            </View>
          )}
          
          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: typeInfo.color }]}>
            <Ionicons name={typeInfo.name as any} size={10} color="#fff" />
          </View>
        </View>

        {/* Content */}
        <View style={[styles.textContainer, shouldShowContentThumbnail && { flex: 1, marginRight: 12 }]}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {notification.body}
          </Text>
          <Text style={styles.notificationTime}>
            {formatTimeAgo(notification.created_at)}
          </Text>
        </View>

        {/* Right: Content Thumbnail (post/video/workout image) - NEVER actor avatar */}
        {shouldShowContentThumbnail && (
          <View style={styles.contentThumbnailContainer}>
            {hasValidContentThumbnail ? (
              <Image
                source={{ uri: contentThumbnail }}
                style={styles.contentThumbnail}
              />
            ) : (
              // Placeholder when no content thumbnail available
              <View style={[styles.contentThumbnail, styles.thumbnailPlaceholder]}>
                <Ionicons name="image-outline" size={20} color="#666" />
              </View>
            )}
          </View>
        )}

        {/* Unread indicator - only show if no content thumbnail */}
        {isUnread && !shouldShowContentThumbnail && (
          <View style={styles.unreadDot} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

// Empty State Component
const EmptyState = () => (
  <View style={styles.emptyContainer}>
    <LinearGradient
      colors={['rgba(255, 215, 0, 0.1)', 'rgba(255, 215, 0, 0.05)']}
      style={styles.emptyIconContainer}
    >
      <Ionicons name="notifications-off-outline" size={48} color="#FFD700" />
    </LinearGradient>
    <Text style={styles.emptyTitle}>No notifications yet</Text>
    <Text style={styles.emptySubtitle}>
      When you get notifications, they'll show up here
    </Text>
  </View>
);

export default function NotificationsInbox() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    if (token) {
      notificationService.setAuthToken(token);
      loadNotifications();
      loadUnreadCount();
    }
  }, [token]);

  const loadNotifications = async (refresh: boolean = false) => {
    if (!token) return;
    
    if (refresh) {
      setIsRefreshing(true);
    } else if (!refresh && notifications.length === 0) {
      setIsLoading(true);
    }

    try {
      const skip = refresh ? 0 : notifications.length;
      console.log(`🔔 DEBUG: Fetching notifications (skip=${skip}, filter=${filter}, unreadOnly=${filter === 'unread'})`);
      
      const fetched = await notificationService.getNotifications(
        20,
        refresh ? 0 : skip,
        filter === 'unread'
      );

      // Debug logging
      console.log(`🔔 DEBUG: Fetched ${fetched.length} notifications`);
      console.log(`🔔 DEBUG: Notification types received:`, fetched.map(n => n.type));
      if (fetched.length > 0) {
        console.log(`🔔 DEBUG: First notification:`, JSON.stringify(fetched[0], null, 2));
      }

      if (refresh) {
        setNotifications(fetched);
      } else {
        setNotifications(prev => [...prev, ...fetched]);
      }
      
      setHasMore(fetched.length === 20);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const loadUnreadCount = async () => {
    const count = await notificationService.getUnreadCount();
    console.log(`🔔 DEBUG: Unread notification count = ${count}`);
    setUnreadCount(count);
  };

  const handleRefresh = useCallback(() => {
    loadNotifications(true);
    loadUnreadCount();
  }, [filter]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadNotifications();
    }
  }, [isLoading, hasMore]);

  const handleNotificationPress = useCallback(async (notification: Notification) => {
    // Mark as read
    if (!notification.read_at) {
      await notificationService.markAsRead([notification.id]);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Navigate based on deep link
    if (notification.deep_link) {
      handleDeepLink(notification);
    }
  }, []);

  const handleDeepLink = (notification: Notification) => {
    const { type, entity_id, actor } = notification;

    switch (type) {
      case 'follow':
        if (actor?.id) {
          router.push(`/user-profile?userId=${actor.id}`);
        }
        break;
      case 'comment':
      case 'like':
      case 'mention':
      case 'reply':
        // For mentions and replies, navigate to the post
        if (entity_id) {
          router.push(`/post-detail?postId=${entity_id}`);
        }
        break;
      case 'message':
      case 'message_request':
        if (entity_id) {
          router.push(`/chat-detail?conversationId=${entity_id}`);
        }
        break;
      case 'featured_workout':
        if (entity_id) {
          router.push({
            pathname: '/featured-workout-detail',
            params: { id: entity_id },
          });
        }
        break;
      case 'workout_reminder':
      case 'featured_suggestion':
        router.push('/');
        break;
      case 'following_digest':
        router.push('/(tabs)/explore?filter=following');
        break;
      default:
        break;
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev =>
      prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
    );
    setUnreadCount(0);
  };

  const handleDeleteNotification = async (notificationId: string) => {
    await notificationService.deleteNotification(notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleFilterChange = (newFilter: 'all' | 'unread') => {
    setFilter(newFilter);
    setNotifications([]);
    setIsLoading(true);
  };

  useEffect(() => {
    if (token) {
      loadNotifications(true);
    }
  }, [filter]);

  const renderNotification = useCallback(({ item }: { item: Notification }) => (
    <NotificationItem
      notification={item}
      onPress={() => handleNotificationPress(item)}
      onDismiss={() => handleDeleteNotification(item.id)}
    />
  ), [handleNotificationPress]);

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="#FFD700" />
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Notifications</Text>
        
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => router.push('/notification-settings')}
        >
          <Ionicons name="settings-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => handleFilterChange('all')}
        >
          <Text style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterTab, filter === 'unread' && styles.filterTabActive]}
          onPress={() => handleFilterChange('unread')}
        >
          <Text style={[styles.filterTabText, filter === 'unread' && styles.filterTabTextActive]}>
            Unread
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Mark all read button */}
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllReadButton}
            onPress={handleMarkAllRead}
          >
            <Text style={styles.markAllReadText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isLoading && notifications.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#FFD700"
              colors={['#FFD700']}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: -8,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterTabActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#888',
  },
  filterTabTextActive: {
    color: '#FFD700',
  },
  unreadBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0c0c0c',
  },
  markAllReadButton: {
    marginLeft: 'auto',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  markAllReadText: {
    fontSize: 13,
    color: '#FFD700',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
  },
  listContent: {
    paddingVertical: 8,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginHorizontal: 16,
  },
  notificationItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  notificationItemUnread: {
    backgroundColor: 'rgba(255, 215, 0, 0.03)',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0c0c0c',
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  notificationBody: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 19,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700',
    marginLeft: 8,
    marginTop: 4,
  },
  contentThumbnailContainer: {
    marginLeft: 'auto',
  },
  contentThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  loadingMore: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
});
