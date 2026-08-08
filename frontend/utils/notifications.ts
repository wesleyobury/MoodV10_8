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
import { Analytics } from './analytics';

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
      // On Android the OS can report "denied" even on a fresh install before
      // any prompt has been shown. We track a local flag so we only call
      // requestPermissionsAsync once. On iOS this branch is never hit for a
      // fresh install (iOS returns "undetermined" until the first prompt, and
      // after denial it simply no-ops on subsequent requests), so the guard
      // is Android-only.
      if (Platform.OS === 'android') {
        const alreadyRequested = await AsyncStorage.getItem(PERMISSION_REQUESTED_KEY);
        if (alreadyRequested === 'true') {
          console.log('🔔 initNotif: Permission previously denied on Android, not re-requesting');
          await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'denied');
          result.permission = 'denied';
          return result;
        }
        Analytics.notificationPermissionPrompted(authToken, { platform: Platform.OS });
        const { status } = await Notifications.requestPermissionsAsync();
        await AsyncStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
        finalStatus = status;
        console.log(`🔔 initNotif: Android first-time request, got = ${finalStatus}`);
      } else {
        // iOS: "denied" means the user explicitly denied via the OS dialog.
        // Calling requestPermissionsAsync again is a harmless no-op on iOS
        // but there is no reason to — just respect the denial.
        console.log('🔔 initNotif: iOS permission denied, not re-requesting');
        await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'denied');
        result.permission = 'denied';
        return result;
      }
    } else {
      // undetermined — request for first time
      Analytics.notificationPermissionPrompted(authToken, { platform: Platform.OS });
      const { status } = await Notifications.requestPermissionsAsync();
      await AsyncStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
      finalStatus = status;
      console.log(`🔔 initNotif: First-time request, got = ${finalStatus}`);
    }

    // Persist the decision
    if (finalStatus !== 'granted') {
      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'denied');
      Analytics.notificationPermissionDenied(authToken, { platform: Platform.OS });
      result.permission = 'denied';
      return result;
    }

    await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'granted');
    Analytics.notificationPermissionGranted(authToken, { platform: Platform.OS });
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
  private _navReady = false;
  // Pending notification responses queued before navigation was ready
  private _pendingResponses: Notifications.NotificationResponse[] = [];

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /** Inject cart + router so push response handler can navigate */
  setNavContext(replaceCart: (items: any[]) => void, router: any): void {
    this._replaceCart = replaceCart;
    this._router = router;
  }

  /**
   * Called by NotificationInitializer once the navigation stack is confirmed
   * mounted and the router is usable. Drains any pending notification
   * responses that arrived before the nav was ready (cold-start scenario).
   */
  onNavigationReady(): void {
    if (this._navReady) return;
    this._navReady = true;
    console.log(`🔔 Nav ready — draining ${this._pendingResponses.length} pending notification(s)`);
    for (const response of this._pendingResponses) {
      this._handleNotificationResponse(response);
    }
    this._pendingResponses = [];
  }

  /** Set up foreground + tap listeners (idempotent) */
  setupListeners(): void {
    if (this.listenersSetUp) return;
    this.listenersSetUp = true;

    this.notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('🔔 Notification received:', notification.request.content.title);
        if (this.authToken) {
          const data = notification.request.content.data as any;
          Analytics.notificationReceived(this.authToken, {
            notification_type: data?.type || 'unknown',
            foreground: true,
          });
        }
      }
    );

    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (this._navReady) {
          this._handleNotificationResponse(response);
        } else {
          console.log('🔔 Nav not ready yet — queuing notification response');
          this._pendingResponses.push(response);
        }
      }
    );
  }

  /**
   * Handle cold-start: check if the app was opened via a notification tap
   * while it was killed. Queues the response if navigation isn't ready yet.
   */
  handleColdStartNotification(): void {
    try {
      const lastResponse = Notifications.getLastNotificationResponse();
      if (lastResponse) {
        console.log('🔔 Cold-start notification detected');
        if (this._navReady) {
          this._handleNotificationResponse(lastResponse);
        } else {
          this._pendingResponses.push(lastResponse);
        }
      }
    } catch (e) {
      console.warn('🔔 getLastNotificationResponse not available:', e);
    }
  }

  /**
   * Central response handler — dispatches by notification type.
   *
   * V2.1: this used to hand every non-featured type to
   * `Linking.openURL(data.deep_link)`, which was dead code in production —
   * the links were `mood://...` while app.json declares `scheme: "moodapp"`,
   * so nothing was registered to handle them and every tap on a like /
   * comment / follow / message / reminder push silently did nothing but log an
   * error. On top of that the link paths (`mood://post/{id}`, `mood://home`,
   * `mood://notifications`) don't correspond to any route in this flat
   * expo-router tree, so even a correct scheme would have hit +not-found.
   *
   * We now route on `data.type` with `router.push` — the same mechanism the
   * in-app inbox uses (app/notifications-inbox.tsx handleDeepLink), which is
   * the one navigation path known to work. `deep_link` is no longer load-
   * bearing for navigation.
   */
  private _handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data as any;
    console.log('📲 Notification tapped:', JSON.stringify(data));

    if (this.authToken) {
      Analytics.notificationOpened(this.authToken, {
        notification_type: data?.type || 'unknown',
        source: 'push',
        has_deep_link: !!data?.deep_link,
      });
    }

    if (data?.type === 'featured_workout') {
      this._handleFeaturedWorkoutTap(data);
      return;
    }

    if (!this._router) {
      console.warn('🔔 No router injected — cannot route notification tap');
      return;
    }

    // `entityId` / `actorId` are always present on the payload as of V2.1;
    // `targetId` is the legacy field name, kept as a fallback so pushes that
    // were already sitting in the tray before this shipped still route.
    const entityId: string = data?.entityId || data?.targetId || '';
    const actorId: string = data?.actorId || '';

    try {
      switch (data?.type) {
        case 'like':
        case 'comment':
        case 'mention':
        case 'reply':
          if (entityId) this._router.push(`/post-detail?postId=${entityId}`);
          else this._router.push('/');
          break;
        case 'follow':
          if (actorId) this._router.push(`/user-profile?userId=${actorId}`);
          else this._router.push('/notifications-inbox');
          break;
        case 'message':
        case 'message_request':
          if (entityId) this._router.push(`/chat?conversationId=${entityId}`);
          else this._router.push('/notifications-inbox');
          break;
        case 'following_digest':
        case 'while_away_digest':
          this._router.push('/notifications-inbox');
          break;
        case 'workout_reminder':
        case 'featured_suggestion':
          this._router.push('/');
          break;
        case 'custom':
          // Admin broadcast. A custom deep link is an in-app path when present
          // (e.g. "/explore"); anything else just opens the app at home.
          if (typeof data?.deep_link === 'string' && data.deep_link.startsWith('/')) {
            this._router.push(data.deep_link);
          } else {
            this._router.push('/');
          }
          break;
        default:
          this._router.push('/');
          break;
      }
    } catch (err) {
      console.error('🔔 Notification routing failed:', err);
    }
  }

  /**
   * Featured workout / admin-cart tap handler.
   *
   * V2.1: this used to duplicate cart hydration — mapping `data.cartItems`
   * inline, with a fetch-by-id fallback. The server no longer ships inline
   * cart items (they were capped at 10, silently truncating longer workouts,
   * and rich exercises blew past the ~4KB APNs/FCM payload limit), so we
   * simply navigate with the workout id and let app/cart.tsx hydrate. That
   * path is uncapped, always reflects the current workout, and is the only one
   * that also sets the cart hero image.
   */
  private async _handleFeaturedWorkoutTap(data: any): Promise<void> {
    const workoutId = data.workoutId || data.entityId;
    const workoutTitle = data.workoutTitle || 'Featured Workout';

    if (!workoutId) {
      console.warn('🔔 featured_workout push carried no workout id');
      this._router?.push('/');
      return;
    }

    if (!this._router) {
      console.warn('🔔 No router injected — cannot open pushed cart');
      return;
    }

    this._router.push({
      pathname: '/cart',
      params: {
        featuredId: workoutId,
        workoutTitle,
        // cart.tsx treats fromPush as authoritative and will replace an
        // existing cart, so a pushed workout isn't silently ignored for users
        // who happen to already have items in their cart.
        fromPush: 'true',
      },
    });
  }

  cleanup(): void {
    if (this.notificationListener) {
      // expo-notifications SDK 53+: subscription objects expose .remove()
      // (Notifications.removeNotificationSubscription was deprecated/removed)
      const sub: any = this.notificationListener;
      if (typeof sub.remove === 'function') {
        sub.remove();
      } else if (typeof (Notifications as any).removeNotificationSubscription === 'function') {
        (Notifications as any).removeNotificationSubscription(sub);
      }
      this.notificationListener = null;
    }
    if (this.responseListener) {
      const sub: any = this.responseListener;
      if (typeof sub.remove === 'function') {
        sub.remove();
      } else if (typeof (Notifications as any).removeNotificationSubscription === 'function') {
        (Notifications as any).removeNotificationSubscription(sub);
      }
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
