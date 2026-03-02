/**
 * MOOD Notifications Service
 * Handles push notifications, device token registration, and notification settings.
 * initNotifications() runs automatically after login and on app launch when authenticated.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Linking } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './apiConfig';

// Configure notification handler (foreground display)
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
  target_thumbnail_url?: string;
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

// Persisted storage keys
const PUSH_TOKEN_KEY = '@mood_push_token';
const NOTIFICATION_PERMISSION_KEY = '@mood_notification_permission';
// Tracks whether we already prompted the OS dialog (so we never re-request after denial)
const PERMISSION_REQUESTED_KEY = '@mood_notification_permission_requested';

/** Result returned by initNotifications / getNotificationStatus */
export type NotifPermission = 'granted' | 'denied' | 'undetermined';
export interface NotifStatus {
  permission: NotifPermission;
  pushToken: string | null;
  registeredWithBackend: boolean;
}

// ─── Standalone init function ───────────────────────────────────────────────

/**
 * Core initialisation — call after login and on every authenticated app launch.
 *   1. Check OS permission status
 *   2. If undetermined → request permission
 *   3. If granted → obtain Expo push token, configure Android channel,
 *      upsert token to backend, persist locally
 *   4. If denied → persist that fact; never re-request
 *
 * @returns NotifStatus so callers can react (e.g. show "Open Settings" CTA)
 */
export async function initNotifications(authToken: string): Promise<NotifStatus> {
  const result: NotifStatus = { permission: 'undetermined', pushToken: null, registeredWithBackend: false };

  // Non-physical devices can't do push (simulators, web)
  if (!Device.isDevice) {
    console.log('🔔 initNotif: Not a physical device, skipping');
    result.permission = 'denied';
    return result;
  }

  try {
    // 1. Check current OS permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log(`🔔 initNotif: OS permission = ${existingStatus}`);

    let finalStatus = existingStatus;

    if (existingStatus === 'granted') {
      // Already granted — skip prompt
      finalStatus = 'granted';
    } else if (existingStatus === 'denied') {
      // OS says denied — check whether we ever prompted before
      const alreadyRequested = await AsyncStorage.getItem(PERMISSION_REQUESTED_KEY);
      if (alreadyRequested === 'true') {
        // User previously denied — do NOT re-request (on iOS it's a no-op anyway)
        console.log('🔔 initNotif: Permission previously denied, not re-requesting');
        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'denied');
        result.permission = 'denied';
        return result;
      }
      // First time seeing denied (e.g. fresh install on some Android) — try requesting
      const { status } = await Notifications.requestPermissionsAsync();
      await AsyncStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
      finalStatus = status;
      console.log(`🔔 initNotif: Requested permission, got = ${finalStatus}`);
    } else {
      // undetermined — request for first time
      const { status } = await Notifications.requestPermissionsAsync();
      await AsyncStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
      finalStatus = status;
      console.log(`🔔 initNotif: First-time request, got = ${finalStatus}`);
    }

    // Persist the decision
    if (finalStatus !== 'granted') {
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'denied');
      result.permission = 'denied';
      return result;
    }

    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
    result.permission = 'granted';

    // 2. Configure Android notification channel (must happen before getExpoPushTokenAsync)
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'MOOD Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFD700',
      });
    }

    // 3. Obtain Expo push token
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const pushToken = tokenData.data;
    console.log(`🔔 initNotif: Expo push token = ${pushToken}`);

    // 4. Persist token locally
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, pushToken);
    result.pushToken = pushToken;

    // 5. Upsert token to backend for the current user
    try {
      const resp = await fetch(`${API_URL}/api/notifications/device-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          token: pushToken,
          platform: Platform.OS,
          device_id: Device.modelId || `${Platform.OS}-unknown`,
        }),
      });
      result.registeredWithBackend = resp.ok;
      if (resp.ok) {
        console.log('🔔 initNotif: Token upserted to backend');
      } else {
        console.warn(`🔔 initNotif: Backend upsert failed HTTP ${resp.status}`);
      }
    } catch (e) {
      console.warn('🔔 initNotif: Backend upsert network error', e);
    }

    return result;
  } catch (error) {
    console.error('🔔 initNotif: Error', error);
    return result;
  }
}

/**
 * Read the current notification status from OS + local persistence.
 * Use this to derive UI state without triggering any permission dialogs.
 */
export async function getNotificationStatus(): Promise<NotifStatus> {
  const result: NotifStatus = { permission: 'undetermined', pushToken: null, registeredWithBackend: false };

  if (!Device.isDevice) {
    result.permission = 'denied';
    return result;
  }

  try {
    const { status } = await Notifications.getPermissionsAsync();
    result.permission = status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined';

    const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    result.pushToken = storedToken;
    // If we have a stored token and permission is granted, assume registered
    result.registeredWithBackend = !!(storedToken && status === 'granted');
  } catch (e) {
    console.warn('🔔 getNotificationStatus error', e);
  }

  return result;
}

/**
 * Open the OS Settings page for this app (for users who denied notifications).
 */
export function openNotificationSettings(): void {
  Linking.openSettings();
}

// ─── Singleton service (retains listeners + API helpers) ─────────────────────

class NotificationService {
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private authToken: string | null = null;
  private listenersSetUp = false;
  // Injected by _layout.tsx so the notification handler can populate the cart
  private _replaceCart: ((items: any[]) => void) | null = null;
  private _router: any = null;

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /** Inject cart + router so push response handler can navigate */
  setNavContext(replaceCart: (items: any[]) => void, router: any): void {
    this._replaceCart = replaceCart;
    this._router = router;
  }

  /** Set up foreground + tap listeners (idempotent) */
  setupListeners(): void {
    if (this.listenersSetUp) return;
    this.listenersSetUp = true;

    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('🔔 Notification received:', notification.request.content.title);
      }
    );

    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        this._handleNotificationResponse(response);
      }
    );
  }

  /**
   * Handle cold-start: check if the app was opened via a notification tap
   * while it was killed. Must be called once after listeners are set up.
   */
  handleColdStartNotification(): void {
    try {
      const lastResponse = Notifications.getLastNotificationResponse();
      if (lastResponse) {
        console.log('🔔 Cold-start notification detected');
        this._handleNotificationResponse(lastResponse);
      }
    } catch (e) {
      console.warn('🔔 getLastNotificationResponse not available:', e);
    }
  }

  /**
   * Central response handler — dispatches by notification type.
   * For featured_workout: populates cart from push data → navigates to /cart.
   * For all others: opens deep link or falls back to home.
   */
  private _handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data as any;
    console.log('📲 Notification tapped:', JSON.stringify(data));

    if (data?.type === 'featured_workout') {
      this._handleFeaturedWorkoutTap(data);
    } else {
      // Non-featured: open deep link if present, else go home
      const link = data?.deep_link || 'mood://home';
      Linking.openURL(link).catch((err) => {
        console.error('Error opening deep link:', err);
      });
    }
  }

  /**
   * Featured workout tap handler:
   *  1. Build WorkoutItem[] from push data.cartItems (or fetch by workoutId)
   *  2. Replace cart contents
   *  3. Navigate to /cart
   */
  private async _handleFeaturedWorkoutTap(data: any): Promise<void> {
    const workoutId = data.workoutId;
    const workoutTitle = data.workoutTitle || 'Featured Workout';

    // Try to build cart items from push payload first
    let cartItems: any[] = [];
    if (Array.isArray(data.cartItems) && data.cartItems.length > 0) {
      cartItems = data.cartItems.map((item: any) => ({
        id: item.id || item.name || `push-${Date.now()}`,
        name: item.name || '',
        duration: item.duration || '',
        description: item.description || '',
        battlePlan: item.battlePlan || '',
        imageUrl: item.imageUrl || item.image_url || '',
        intensityReason: item.intensityReason || '',
        equipment: item.equipment || 'None',
        difficulty: item.difficulty || '',
        workoutType: item.workoutType || '',
        moodCard: item.moodCard || workoutTitle,
        moodTips: item.moodTips || [],
        source: 'build_for_me' as const,
      }));
    } else if (workoutId) {
      // Fallback: fetch workout by ID from the backend
      try {
        const resp = await fetch(`${API_URL}/api/featured/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [workoutId] }),
        });
        if (resp.ok) {
          const result = await resp.json();
          const workout = result.workouts?.[0];
          if (workout?.exercises) {
            cartItems = workout.exercises.map((ex: any) => ({
              id: ex.id || ex.name || `fetch-${Date.now()}`,
              name: ex.name || '',
              duration: ex.duration || '',
              description: ex.description || '',
              battlePlan: ex.battlePlan || '',
              imageUrl: ex.image_url || ex.imageUrl || '',
              intensityReason: ex.intensityReason || '',
              equipment: ex.equipment || 'None',
              difficulty: ex.difficulty || '',
              workoutType: ex.workoutType || '',
              moodCard: workout.title || workoutTitle,
              moodTips: [],
              source: 'build_for_me' as const,
            }));
          }
        }
      } catch (e) {
        console.warn('🔔 Failed to fetch workout for push deep link:', e);
      }
    }

    // Replace cart BEFORE navigating
    if (cartItems.length > 0 && this._replaceCart) {
      console.log(`🔔 Populating cart with ${cartItems.length} items from push`);
      this._replaceCart(cartItems);
    }

    // Navigate to cart screen
    if (this._router) {
      try {
        this._router.push({
          pathname: '/cart',
          params: { workoutId, workoutTitle, fromPush: 'true' },
        });
      } catch (e) {
        console.warn('🔔 Router navigation failed, falling back to Linking:', e);
        Linking.openURL(data.deep_link || 'mood://cart').catch(() => {});
      }
    } else {
      // No router injected yet — fall back to deep link
      Linking.openURL(data.deep_link || 'mood://cart').catch(() => {});
    }
  }

  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
    this.listenersSetUp = false;
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
