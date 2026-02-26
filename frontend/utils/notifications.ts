/**
 * MOOD Notifications Service
 * Handles push notifications, device token registration, and notification settings
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './apiConfig';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Types
export interface NotificationSettings {
  notifications_enabled: boolean;
  likes_enabled: boolean;
  likes_from_following_only: boolean;
  comments_enabled: boolean;
  comments_from_following_only: boolean;
  messages_enabled: boolean;
  follows_enabled: boolean;
  workout_reminders_enabled: boolean;
  featured_workouts_enabled: boolean;
  following_digest_enabled: boolean;
  following_digest_frequency: 'daily' | '3x_week' | 'off';
  featured_suggestions_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  digest_time: string;
  timezone: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  image_url?: string;
  deep_link?: string;
  entity_id?: string;
  entity_type?: string;
  created_at: string;
  read_at?: string;
  // Explicit target thumbnail URL for post/workout/media content
  target_thumbnail_url?: string;
  // Metadata for backward compatibility
  metadata?: {
    post_thumbnail?: string;
    post_preview?: string;
    workout_name?: string;
    [key: string]: any;
  };
  actor?: {
    id: string;
    username: string;
    avatar?: string;
    name?: string;
  };
}

// Storage keys
const PUSH_TOKEN_KEY = '@mood_push_token';
const NOTIFICATION_PERMISSION_KEY = '@mood_notification_permission';

class NotificationService {
  private pushToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private authToken: string | null = null;

  /**
   * Initialize notification service
   */
  async initialize(authToken: string): Promise<void> {
    this.authToken = authToken;
    
    // Register for push notifications
    await this.registerForPushNotifications();
    
    // Set up notification listeners
    this.setupListeners();
  }

  /**
   * Set auth token for API calls
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /**
   * Register for push notifications and get token
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    try {
      // Check existing permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log(`🔔 PUSH-DIAG: existing permission status = ${existingStatus}`);
      let finalStatus = existingStatus;

      // Request permission if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log(`🔔 PUSH-DIAG: requested permission, got status = ${finalStatus}`);
      }

      if (finalStatus !== 'granted') {
        console.log('🔔 PUSH-DIAG: Push notification permission NOT granted');
        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'denied');
        return null;
      }

      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      console.log(`🔔 PUSH-DIAG: projectId = ${projectId}`);
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      
      this.pushToken = tokenData.data;
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, this.pushToken);
      console.log(`🔔 PUSH-DIAG: Expo push token = ${this.pushToken}`);

      // Register token with backend
      if (this.authToken) {
        const registered = await this.registerDeviceToken(this.pushToken);
        console.log(`🔔 PUSH-DIAG: backend registration success = ${registered}`);
      } else {
        console.log('🔔 PUSH-DIAG: No auth token yet, skipping backend registration');
      }

      // Configure Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'MOOD Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FFD700',
        });
      }

      console.log('📱 Push token registered:', this.pushToken.substring(0, 20) + '...');
      return this.pushToken;
    } catch (error) {
      console.error('🔔 PUSH-DIAG ERROR registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Register device token with backend
   */
  async registerDeviceToken(token: string): Promise<boolean> {
    if (!this.authToken) {
      console.log('🔔 PUSH-DIAG: No auth token, skipping device registration');
      return false;
    }

    try {
      console.log(`🔔 PUSH-DIAG: Sending token to backend (platform=${Platform.OS}, token=${token.substring(0, 30)}...)`);
      const response = await fetch(`${API_URL}/api/notifications/device-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({
          token,
          platform: Platform.OS,
          device_id: Device.modelId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`🔔 PUSH-DIAG: Backend confirmed token stored: status=${data.status}, id=${data.id}`);
        return true;
      } else {
        const errText = await response.text();
        console.error(`🔔 PUSH-DIAG: Failed to register device token: HTTP ${response.status}, body=${errText}`);
        return false;
      }
    } catch (error) {
      console.error('🔔 PUSH-DIAG ERROR registering device token:', error);
      return false;
    }
  }

  /**
   * Unregister device token (logout)
   */
  async unregisterDeviceToken(): Promise<void> {
    if (!this.pushToken || !this.authToken) return;

    try {
      await fetch(`${API_URL}/api/notifications/device-token?token=${this.pushToken}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });
      
      await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
      this.pushToken = null;
      console.log('📱 Device token unregistered');
    } catch (error) {
      console.error('Error unregistering device token:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  private setupListeners(): void {
    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('🔔 Notification received:', notification.request.content.title);
      }
    );

    // Listener for user tapping on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as any;
        console.log('📲 Notification tapped:', data);
        
        // Handle deep links based on notification type
        if (data?.type === 'featured_workout' && data?.deep_link) {
          // Featured workout: open to cart with workout loaded
          this.handleDeepLink(data.deep_link as string);
        } else {
          // All other types (like, comment, mention, nudge): open to home screen
          this.handleDeepLink('mood://home');
        }
      }
    );
  }

  /**
   * Handle deep link navigation
   */
  private handleDeepLink(deepLink: string): void {
    console.log('🔗 Navigating to:', deepLink);
    
    // Import Linking to open the deep link
    import('expo-linking').then(({ default: Linking }) => {
      Linking.openURL(deepLink).catch(err => {
        console.error('Error opening deep link:', err);
      });
    });
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  // =====================
  // API Methods
  // =====================

  /**
   * Get notification settings
   */
  async getSettings(): Promise<NotificationSettings | null> {
    if (!this.authToken) return null;

    try {
      const response = await fetch(`${API_URL}/api/notifications/settings`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      return null;
    }
  }

  /**
   * Update notification settings
   */
  async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings | null> {
    if (!this.authToken) return null;

    try {
      const response = await fetch(`${API_URL}/api/notifications/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return null;
    }
  }

  /**
   * Get notifications (inbox)
   */
  async getNotifications(
    limit: number = 50,
    skip: number = 0,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    if (!this.authToken) return [];

    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        skip: skip.toString(),
        unread_only: unreadOnly.toString(),
      });

      const response = await fetch(`${API_URL}/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const notifications = data.notifications || [];
        console.log(`🔔 NOTIF-DIAG: GET /notifications returned ${notifications.length} items (skip=${skip}, unreadOnly=${unreadOnly})`);
        if (notifications.length > 0) {
          console.log(`🔔 NOTIF-DIAG: sample[0] =`, JSON.stringify(notifications[0]).substring(0, 200));
        }
        return notifications;
      }
      console.log(`🔔 NOTIF-DIAG: GET /notifications failed with status ${response.status}`);
      return [];
    } catch (error) {
      console.error('🔔 NOTIF-DIAG ERROR fetching notifications:', error);
      return [];
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    if (!this.authToken) return 0;

    try {
      const response = await fetch(`${API_URL}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.unread_count || 0;
        console.log(`🔔 NOTIF-DIAG: unread-count = ${count}`);
        return count;
      }
      console.log(`🔔 NOTIF-DIAG: unread-count request failed with status ${response.status}`);
      return 0;
    } catch (error) {
      console.error('🔔 NOTIF-DIAG ERROR fetching unread count:', error);
      return 0;
    }
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[]): Promise<boolean> {
    if (!this.authToken) return false;

    try {
      const response = await fetch(`${API_URL}/api/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
        body: JSON.stringify({ notification_ids: notificationIds }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<boolean> {
    if (!this.authToken) return false;

    try {
      const response = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<boolean> {
    if (!this.authToken) return false;

    try {
      const response = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
