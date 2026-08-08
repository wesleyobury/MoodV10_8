/**
 * Analytics Tracking Utility
 * 
 * Makes it super easy to track user events throughout the app
 * Supports both authenticated users and guest users
 * 
 * Apple Compliance: All events include UTC timestamp and user timezone
 * Users can opt-out of non-essential analytics via settings
 */

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Localization from 'expo-localization';
import { API_URL } from './apiConfig';
import { fetchWithTimeout } from './api';
import { dispatch as dispatchToProviders } from './analyticsProvider';

// Storage keys
const GUEST_DEVICE_ID_KEY = 'guest_device_id';
const ANALYTICS_OPT_OUT_KEY = '@mood_analytics_opt_out';

/* ────────────────────────────────────────────────────────────────────────
 * Background event queue.
 *
 * Analytics used to fire a network request the instant each event happened
 * (difficulty tap, equipment tap, ...). On poor connections those requests
 * piled up and competed with user-facing calls (workout generation, feed),
 * making the app feel laggy or frozen. Events now enqueue instantly and a
 * background loop drains them one at a time with a timeout. Best-effort by
 * design: on failure an event is dropped, never retried at the user's cost.
 * ──────────────────────────────────────────────────────────────────────── */
interface QueuedAnalyticsEvent {
  url: string;
  headers: Record<string, string>;
  body: Record<string, any>;
}

const eventQueue: QueuedAnalyticsEvent[] = [];
const MAX_QUEUE_LENGTH = 100;
const FLUSH_DELAY_MS = 3000;
const SEND_TIMEOUT_MS = 8000;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushing = false;

function enqueueEvent(evt: QueuedAnalyticsEvent): void {
  eventQueue.push(evt);
  if (eventQueue.length > MAX_QUEUE_LENGTH) eventQueue.shift(); // drop oldest
  scheduleFlush();
}

function scheduleFlush(): void {
  if (flushTimer || flushing) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushEventQueue();
  }, FLUSH_DELAY_MS);
}

async function flushEventQueue(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    while (eventQueue.length > 0) {
      const evt = eventQueue.shift()!;
      try {
        await fetchWithTimeout(
          evt.url,
          {
            method: 'POST',
            headers: evt.headers,
            body: JSON.stringify(evt.body),
          },
          SEND_TIMEOUT_MS
        );
      } catch {
        // Best-effort: drop the event and move on.
      }
    }
  } finally {
    flushing = false;
    if (eventQueue.length > 0) scheduleFlush();
  }
}

/**
 * Check if user has opted out of non-essential analytics
 */
export const isAnalyticsOptedOut = async (): Promise<boolean> => {
  try {
    const optOut = await AsyncStorage.getItem(ANALYTICS_OPT_OUT_KEY);
    return optOut === 'true';
  } catch {
    return false;
  }
};

/**
 * Set analytics opt-out preference
 */
export const setAnalyticsOptOut = async (optOut: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(ANALYTICS_OPT_OUT_KEY, optOut ? 'true' : 'false');
  } catch (error) {
    console.log('Error setting analytics opt-out:', error);
  }
};

/**
 * Get user's timezone in IANA format (e.g., 'America/New_York')
 */
export const getUserTimezone = (): string => {
  try {
    return Localization.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

/**
 * Get current UTC timestamp in ISO format
 */
export const getUTCTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Get or create a unique device ID for guest tracking
 */
export const getOrCreateDeviceId = async (): Promise<string> => {
  try {
    // Check if we already have a device ID stored
    let deviceId = await AsyncStorage.getItem(GUEST_DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Generate a unique device ID (platform-agnostic approach)
      const timestamp = Date.now();
      const randomPart = Math.random().toString(36).substring(2, 15);
      const platformPart = Platform.OS.substring(0, 3);
      deviceId = `guest_${platformPart}_${timestamp}_${randomPart}`;
      
      // Store for future use
      await AsyncStorage.setItem(GUEST_DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  } catch (error) {
    // Fallback to a simple random ID
    return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
};

/**
 * Track any user event with metadata (authenticated users)
 * Apple Compliance: Includes event_timestamp_utc and user_timezone
 */
export const trackEvent = async (
  token: string,
  eventType: string,
  metadata?: Record<string, any>,
  isEssential: boolean = false // Essential events track even if opted out
): Promise<void> => {
  try {
    // Check opt-out for non-essential analytics
    if (!isEssential) {
      const optedOut = await isAnalyticsOptedOut();
      if (optedOut) {
        return; // Skip non-essential tracking
      }
    }

    // Timestamp is stamped NOW (enqueue time), so batched delivery a few
    // seconds later doesn't skew event times.
    enqueueEvent({
      url: `${API_URL}/api/analytics/track`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: {
        event_type: eventType,
        event_timestamp_utc: getUTCTimestamp(),
        user_timezone: getUserTimezone(),
        metadata: metadata || {}
      }
    });

    // Phase G — fan-out to any externally-registered providers (PostHog /
    // Segment / etc.). Today no providers are registered, so this is a
    // cheap no-op. Tomorrow `registerProvider(posthog)` flips it on with
    // zero call-site changes.
    dispatchToProviders(eventType, metadata || {}, { token });
  } catch (error) {
    // Silently fail - don't block user flow
    console.log('Analytics tracking error:', error);
  }
};

/**
 * Track guest user events (no authentication required)
 * Apple Compliance: Includes event_timestamp_utc and user_timezone
 */
export const trackGuestEvent = async (
  eventType: string,
  metadata?: Record<string, any>,
  isEssential: boolean = false
): Promise<void> => {
  try {
    // Check opt-out for non-essential analytics
    if (!isEssential) {
      const optedOut = await isAnalyticsOptedOut();
      if (optedOut) {
        return; // Skip non-essential tracking
      }
    }

    const deviceId = await getOrCreateDeviceId();
    
    enqueueEvent({
      url: `${API_URL}/api/analytics/track/guest`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        event_type: eventType,
        device_id: deviceId,
        event_timestamp_utc: getUTCTimestamp(),
        user_timezone: getUserTimezone(),
        metadata: { ...metadata, is_guest: true }
      }
    });

    // Phase G — same provider fan-out for guest events (the funnel runs
    // pre-login, so PostHog/Segment also need to see these).
    dispatchToProviders(eventType, { ...metadata, is_guest: true }, { token: null, deviceId });
  } catch (error) {
    // Silently fail - don't block user flow
    console.log('Guest analytics tracking error:', error);
  }
};

/**
 * Alias guest activity to a registered user account
 * Call this after a guest signs up or logs in
 */
export const aliasGuestToUser = async (token: string): Promise<number> => {
  try {
    const deviceId = await getOrCreateDeviceId();
    
    const response = await fetchWithTimeout(`${API_URL}/api/analytics/alias?device_id=${encodeURIComponent(deviceId)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, 12000);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Merged ${data.merged_count} guest events to user account`);
      return data.merged_count;
    } else {
      console.log('Failed to alias guest to user:', response.status);
      return 0;
    }
  } catch (error) {
    console.log('Error aliasing guest to user:', error);
    return 0;
  }
};

// Pre-built tracking functions for common events

export const Analytics = {
  // Workout Events
  workoutStarted: (token: string, metadata: {
    mood_category?: string;
    difficulty?: string;
    equipment?: string;
    // Set when a session-start snapshot is created in cart.tsx so that
    // the Live tab "Live now" cards can hydrate "Try this workout" using
    // the same snapshot pipeline as completion cards.
    workout_snapshot_id?: string;
    workout_name?: string;
  }) => trackEvent(token, 'workout_started', metadata),

  workoutCompleted: (token: string, metadata: {
    mood_category?: string;
    difficulty?: string;
    equipment?: string;
    duration_minutes?: number;
    exercises_completed?: number;
    // Phase 7 — included on completion so the Live Feed entry can carry
    // an opaque pointer back to the full cart. Tapping "Try this workout"
    // on a feed entry fetches /api/workout-snapshots/{id} and hydrates the
    // viewer's cart with the exact exercises the original athlete ran.
    workout_snapshot_id?: string;
  }) => trackEvent(token, 'workout_completed', metadata),

  workoutSkipped: (token: string, metadata: {
    workout_name?: string;
    workout_index?: number;
    total_exercises?: number;
  }) => trackEvent(token, 'workout_skipped', metadata),

  workoutAbandoned: (token: string, metadata: {
    workout_name?: string;
    progress_percentage?: number;
    exercises_completed?: number;
    total_exercises?: number;
  }) => trackEvent(token, 'workout_abandoned', metadata),

  workoutSaved: (token: string, metadata: {
    workout_id?: string;
    mood_category?: string;
  }) => trackEvent(token, 'workout_saved', metadata),

  exerciseCompleted: (token: string, metadata: {
    exercise_name?: string;
    sets?: number;
    reps?: number;
  }) => trackEvent(token, 'exercise_completed', metadata),

  // Cart/Add workout events
  trackWorkoutAdded: (token: string, workoutId: string, workoutName: string, equipment: string, difficulty: string) => 
    trackEvent(token, 'workout_added_to_cart', {
      workout_id: workoutId,
      workout_name: workoutName,
      equipment: equipment,
      difficulty: difficulty,
    }),

  // Social Events
  postCreated: (token: string, metadata: {
    has_media?: boolean;
    media_count?: number;
    caption_length?: number;
  }) => trackEvent(token, 'post_created', metadata),

  postLiked: (token: string, metadata: {
    post_id: string;
    author_id?: string;
  }) => trackEvent(token, 'post_liked', metadata),

  postCommented: (token: string, metadata: {
    post_id: string;
    comment_length?: number;
  }) => trackEvent(token, 'post_commented', metadata),

  workoutReplicated: (token: string, metadata: {
    source_post_id: string;
    source_author: string;
    exercises_count: number;
    mood_category?: string;
  }) => trackEvent(token, 'workout_replicated', metadata),

  userFollowed: (token: string, metadata: {
    followed_user_id: string;
  }) => trackEvent(token, 'user_followed', metadata),

  userUnfollowed: (token: string, metadata: {
    unfollowed_user_id: string;
  }) => trackEvent(token, 'user_unfollowed', metadata),

  profileViewed: (token: string, metadata: {
    viewed_user_id: string;
  }) => trackEvent(token, 'profile_viewed', metadata),

  // Navigation Events
  screenViewed: (token: string, metadata: {
    screen_name: string;
    previous_screen?: string;
  }) => trackEvent(token, 'screen_viewed', metadata),

  tabSwitched: (token: string, metadata: {
    from_tab: string;
    to_tab: string;
  }) => trackEvent(token, 'tab_switched', metadata),

  searchPerformed: (token: string, metadata: {
    search_query: string;
    results_count?: number;
  }) => trackEvent(token, 'search_performed', metadata),

  // Engagement Events
  appOpened: (token: string) => trackEvent(token, 'app_opened'),

  appBackgrounded: (token: string) => trackEvent(token, 'app_backgrounded'),

  notificationClicked: (token: string, metadata: {
    notification_type?: string;
  }) => trackEvent(token, 'notification_clicked', metadata),

  // Feature Usage
  equipmentSelected: (token: string, metadata: {
    equipment: string;
    mood_category?: string;
  }) => trackEvent(token, 'equipment_selected', metadata),

  difficultySelected: (token: string, metadata: {
    difficulty: string;
    mood_category?: string;
  }) => trackEvent(token, 'difficulty_selected', metadata),

  moodSelected: (token: string, metadata: {
    mood_category: string;
  }) => trackEvent(token, 'mood_selected', metadata),

  filterApplied: (token: string, metadata: {
    filter_type: string;
    filter_value: string;
  }) => trackEvent(token, 'filter_applied', metadata),

  // Featured Workout Events
  featuredWorkoutClicked: (token: string, metadata: {
    workout_id: string;
    workout_title: string;
    mood_category: string;
  }) => trackEvent(token, 'featured_workout_clicked', metadata),

  featuredWorkoutStarted: (token: string, metadata: {
    workout_id: string;
    workout_title: string;
    mood_category: string;
    exercise_count: number;
  }) => trackEvent(token, 'featured_workout_started', metadata),

  featuredWorkoutCompleted: (token: string, metadata: {
    workout_id: string;
    workout_title: string;
    mood_category: string;
    exercises_completed: number;
    duration_minutes?: number;
  }) => trackEvent(token, 'featured_workout_completed', metadata),

  // Try This Workout Events
  tryWorkoutClicked: (token: string, metadata: {
    workout_name: string;
    equipment?: string;
    difficulty?: string;
    mood_category?: string;
    source?: string; // 'featured', 'custom', 'muscle_gainer', etc.
    // When set (e.g. copying from a Live-feed snapshot), the server credits the
    // original author with the `inspiring_others` badge.
    workout_snapshot_id?: string;
  }) => trackEvent(token, 'try_workout_clicked', metadata),

  /**
   * v2 gamification — fired by AchievementsContext when a client-detected
   * achievement badge is first earned. Populates the public Live feed
   * (`type: "badge"` entries) and analytics. Server-authoritative badges
   * (e.g. inspiring_others) are emitted by the server, NOT here.
   */
  badgeEarned: (token: string, metadata: {
    badge_id: string;
    badge_label: string;
    badge_icon: string;
    badge_category: string;
  }) => trackEvent(token, 'badge_earned', metadata),

  // Workout Session Events
  workoutSessionCompleted: (token: string, metadata: {
    workout_name: string;
    equipment?: string;
    difficulty?: string;
    mood_category?: string;
    duration_seconds: number;
    source?: string;
  }) => trackEvent(token, 'workout_session_completed', metadata),

  /**
   * Spec §11 — fired by /pulse-sync after the first-workout magic moment.
   * `had_wearable_data` answers "what % of first-workout completions have
   * wearables connected" → signal for how aggressively to prompt wearable
   * connection earlier in onboarding.
   */
  pulseSyncPlayed: (token: string | null, metadata: {
    had_wearable_data: boolean;
    duration_ms: number;
  }) => {
    // Pulse Sync fires on the user's first completed workout; for guest /
    // logged-out edge cases we silently drop the event since the
    // authenticated `trackEvent` requires a token.
    if (!token) return;
    return trackEvent(token, 'pulse_sync_played', metadata);
  },


  // Workout Funnel Events
  workoutFunnelStep: (token: string, metadata: {
    step: string;
    mood_category?: string;
    equipment?: string;
    difficulty?: string;
  }) => trackEvent(token, 'workout_funnel_step', metadata),

  workoutAddedToCart: (token: string, metadata: {
    workout_name: string;
    mood_category?: string;
    equipment?: string;
  }) => trackEvent(token, 'workout_added_to_cart', metadata),

  workoutRemovedFromCart: (token: string, metadata: {
    workout_name: string;
  }) => trackEvent(token, 'workout_removed_from_cart', metadata),

  cartViewed: (token: string, metadata: {
    item_count: number;
  }) => trackEvent(token, 'cart_viewed', metadata),

  // Choose For Me Events (Apple Compliance - required tracking)
  chooseForMeUsed: (token: string, metadata: {
    mood_category?: string;
    selected_workout?: string;
    available_options?: number;
  }) => trackEvent(token, 'choose_for_me_used', metadata),

  // Build For Me by Mood Events (Apple Compliance - required tracking)
  buildForMeMoodUsed: (token: string, metadata: {
    mood_category: string;
    workout_count?: number;
    equipment_selected?: string[];
    difficulty?: string;
  }) => trackEvent(token, 'build_for_me_mood_used', metadata),

  // Screen Time Tracking
  screenTimeSpent: (token: string, metadata: {
    screen_name: string;
    duration_seconds: number;
    duration_minutes?: number;
  }) => trackEvent(token, 'screen_time_spent', {
    ...metadata,
    duration_minutes: metadata.duration_minutes || Math.round(metadata.duration_seconds / 60 * 100) / 100
  }),

  screenEntered: (token: string, metadata: {
    screen_name: string;
  }) => trackEvent(token, 'screen_entered', metadata),

  screenExited: (token: string, metadata: {
    screen_name: string;
    duration_seconds: number;
  }) => trackEvent(token, 'screen_exited', metadata),

  // Onboarding Tip Events
  tipShown: (token: string, metadata: { tip_id: string }) =>
    trackEvent(token, 'tip_shown', metadata),

  tipTapped: (token: string, metadata: { tip_id: string }) =>
    trackEvent(token, 'tip_tapped', metadata),

  tipDismissed: (token: string, metadata: { tip_id: string }) =>
    trackEvent(token, 'tip_dismissed', metadata),

  tipNeverShow: (token: string, metadata: { tip_id: string }) =>
    trackEvent(token, 'tip_never_show', metadata),

  // HealthKit Events
  healthPermissionPrompted: (token: string, metadata: Record<string, any>) =>
    trackEvent(token, 'health_permission_prompted', metadata),

  healthPermissionGranted: (token: string, metadata: Record<string, any>) =>
    trackEvent(token, 'health_permission_granted', metadata),

  healthPermissionDenied: (token: string, metadata: Record<string, any>) =>
    trackEvent(token, 'health_permission_denied', metadata),

  healthSnapshotRefreshed: (token: string, metadata: Record<string, any>) =>
    trackEvent(token, 'health_snapshot_refreshed', metadata),

  settingsHealthRowTapped: (token: string, metadata: Record<string, any>) =>
    trackEvent(token, 'settings_health_row_tapped', metadata),

  // Workout Session (live HR + recap)
  workoutSessionStarted: (token: string, metadata: Record<string, any>) =>
    trackEvent(token, 'workout_session_started', metadata),

  workoutSessionEnded: (token: string, metadata: Record<string, any>) =>
    trackEvent(token, 'workout_session_ended', metadata),

  hrSamplesCapturedCount: (token: string, metadata: { count: number }) =>
    trackEvent(token, 'hr_samples_captured_count', metadata),

  workoutRecapViewed: (token: string, metadata: Record<string, any>) =>
    trackEvent(token, 'workout_recap_viewed', metadata),

  shareToInstagramTapped: (token: string, metadata: Record<string, any>) =>
    trackEvent(token, 'share_to_instagram_tapped', metadata),

  shareToCameraRollTapped: (token: string, metadata: Record<string, any>) =>
    trackEvent(token, 'share_to_camera_roll_tapped', metadata),

  shareCompleted: (token: string, metadata: Record<string, any>) =>
    trackEvent(token, 'share_completed', metadata),

  // Onboarding funnel — Phase A of the paid launch.
  // The funnel runs before login; events are routed to both authenticated and
  // guest pipelines so the funnel can be analyzed end-to-end pre- and
  // post-account creation.
  onboardingStepViewed: (token: string | null, metadata: { step: number; question?: string }) =>
    token
      ? trackEvent(token, 'onboarding_step_viewed', metadata)
      : trackGuestEvent('onboarding_step_viewed', metadata),

  onboardingStepCompleted: (
    token: string | null,
    metadata: { step: number; question?: string; answer?: any; time_spent_ms?: number }
  ) =>
    token
      ? trackEvent(token, 'onboarding_step_completed', metadata)
      : trackGuestEvent('onboarding_step_completed', metadata),

  onboardingCompleted: (token: string | null, metadata: Record<string, any>) =>
    token
      ? trackEvent(token, 'onboarding_completed', metadata)
      : trackGuestEvent('onboarding_completed', metadata),

  onboardingAbandoned: (token: string | null, metadata: { step: number }) =>
    token
      ? trackEvent(token, 'onboarding_abandoned', metadata)
      : trackGuestEvent('onboarding_abandoned', metadata),

  revealScreenViewed: (token: string | null, metadata: Record<string, any> = {}) =>
    token
      ? trackEvent(token, 'reveal_screen_viewed', metadata)
      : trackGuestEvent('reveal_screen_viewed', metadata),

  revealCtaTapped: (token: string | null, metadata: Record<string, any> = {}) =>
    token
      ? trackEvent(token, 'reveal_cta_tapped', metadata)
      : trackGuestEvent('reveal_cta_tapped', metadata),

  medicalDisclaimerAccepted: (token: string | null, metadata: Record<string, any> = {}) =>
    token
      ? trackEvent(token, 'medical_disclaimer_accepted', metadata)
      : trackGuestEvent('medical_disclaimer_accepted', metadata),

  // Monetization funnel — Phase B paid launch.
  // 1a (MOOD V2): metadata extended additively with stage/trigger/
  // is_founding_window. Existing callers passing only `trigger_source` still
  // compile — every new field is optional. Event name unchanged.
  paywallViewed: (
    token: string | null,
    metadata: {
      trigger_source?: string;
      stage?: 1 | 2 | 3;
      trigger?: string;
      is_founding_window?: boolean;
    }
  ) =>
    token
      ? trackEvent(token, 'paywall_viewed', metadata)
      : trackGuestEvent('paywall_viewed', metadata),

  trialStarted: (token: string | null, metadata: { plan: 'annual' | 'monthly'; trigger_source: string }) =>
    token
      ? trackEvent(token, 'trial_started', metadata)
      : trackGuestEvent('trial_started', metadata),

  trialCancelled: (token: string | null, metadata: Record<string, any> = {}) =>
    token
      ? trackEvent(token, 'trial_cancelled', metadata)
      : trackGuestEvent('trial_cancelled', metadata),

  subscriptionPurchased: (token: string | null, metadata: { plan: 'annual' | 'monthly'; trigger_source?: string | null }) =>
    token
      ? trackEvent(token, 'subscription_purchased', metadata)
      : trackGuestEvent('subscription_purchased', metadata),

  subscriptionRestored: (token: string | null, metadata: Record<string, any> = {}) =>
    token
      ? trackEvent(token, 'subscription_restored', metadata)
      : trackGuestEvent('subscription_restored', metadata),

  subscriptionLapsed: (token: string | null, metadata: Record<string, any> = {}) =>
    token
      ? trackEvent(token, 'subscription_lapsed', metadata)
      : trackGuestEvent('subscription_lapsed', metadata),

  workoutGenerated: (token: string | null, metadata: { generation_index?: number; mood?: string }) =>
    token
      ? trackEvent(token, 'workout_generated', metadata)
      : trackGuestEvent('workout_generated', metadata),

  startWorkoutTapped: (token: string | null, metadata: { allowed: boolean; trigger_source?: string } & Record<string, any>) =>
    token
      ? trackEvent(token, 'start_workout_tapped', metadata)
      : trackGuestEvent('start_workout_tapped', metadata),

  /**
   * V2.1 — the entitlement round-trip that guards Start failed for a reason
   * that is NOT the paywall (network unreachable, timeout, 5xx, unexpected
   * shape). This previously showed a bare "Couldn't verify access" alert and
   * emitted NOTHING, so a reliability problem on the app's core verb was
   * completely invisible in the dashboard. `outcome` records whether we let the
   * user through on the local mirror or actually blocked them.
   */
  workoutStartGateFailed: (
    token: string | null,
    metadata: {
      reason: 'network' | 'timeout' | 'server_error' | 'unexpected';
      outcome: 'allowed_offline' | 'blocked';
      status?: number;
      cached_grant?: boolean;
    } & Record<string, any>,
  ) =>
    token
      ? trackEvent(token, 'workout_start_gate_failed', metadata)
      : trackGuestEvent('workout_start_gate_failed', metadata),

  // Founding Member — Phase D paid launch.
  foundingMemberModalShown: (token: string | null, metadata: Record<string, any> = {}) =>
    token
      ? trackEvent(token, 'founding_member_modal_shown', metadata)
      : trackGuestEvent('founding_member_modal_shown', metadata),

  foundingMemberModalDismissed: (token: string | null, metadata: Record<string, any> = {}) =>
    token
      ? trackEvent(token, 'founding_member_modal_dismissed', metadata)
      : trackGuestEvent('founding_member_modal_dismissed', metadata),

  // Founding Member — V2 offer flow.
  foundingModalShown: (token: string | null, metadata: Record<string, any> = {}) =>
    token
      ? trackEvent(token, 'founding_modal_shown', metadata)
      : trackGuestEvent('founding_modal_shown', metadata),

  pulseSyncPlayed: (token: string | null, metadata: { had_wearable_data?: boolean; duration_ms?: number; reduce_motion_active?: boolean } & Record<string, any> = {}) =>
    token
      ? trackEvent(token, 'pulse_sync_played', metadata)
      : trackGuestEvent('pulse_sync_played', metadata),

  foundingModalClaimed: (token: string | null, metadata: Record<string, any> = {}) =>
    token
      ? trackEvent(token, 'founding_modal_claimed', metadata)
      : trackGuestEvent('founding_modal_claimed', metadata),

  foundingModalDismissed: (token: string | null, metadata: { dismissed_at_day_of_window?: number } & Record<string, any> = {}) =>
    token
      ? trackEvent(token, 'founding_modal_dismissed', metadata)
      : trackGuestEvent('founding_modal_dismissed', metadata),

  settingsRestorePurchasesTapped: (token: string | null, metadata: Record<string, any> = {}) =>
    token
      ? trackEvent(token, 'settings_restore_purchases_tapped', metadata)
      : trackGuestEvent('settings_restore_purchases_tapped', metadata),

  // ── MOOD V2 PHASE 1 — Paywall + monetization + generation funnel ──────
  // All event NAMES are new and additive; nothing above is renamed.

  // 1a. Paywall events (category: monetization)
  paywallDismissed: (
    token: string | null,
    metadata: {
      stage?: 1 | 2 | 3;
      dismiss_method?: 'x_button' | 'back_swipe' | 'tap_outside';
      seconds_on_screen?: number;
      // MOOD V2 launch-critical additions (additive — old callers still compile)
      trigger_source?: string;
      method?: 'tertiary_link' | 'background_tap' | 'system_back';
    }
  ) =>
    token
      ? trackEvent(token, 'paywall_dismissed', metadata)
      : trackGuestEvent('paywall_dismissed', metadata),

  planSelected: (
    token: string | null,
    metadata: { plan_id: string; stage?: 1 | 2 | 3 }
  ) =>
    token
      ? trackEvent(token, 'plan_selected', metadata)
      : trackGuestEvent('plan_selected', metadata),

  purchaseInitiated: (
    token: string | null,
    metadata: { plan_id: string; stage?: 1 | 2 | 3 }
  ) =>
    token
      ? trackEvent(token, 'purchase_initiated', metadata)
      : trackGuestEvent('purchase_initiated', metadata),

  purchaseCompleted: (
    token: string | null,
    metadata: { plan_id: string; revenue_usd?: number; is_trial?: boolean }
  ) =>
    token
      ? trackEvent(token, 'purchase_completed', metadata)
      : trackGuestEvent('purchase_completed', metadata),

  purchaseFailed: (
    token: string | null,
    metadata: {
      plan_id?: string;
      failure_reason: 'user_cancelled' | 'payment_declined' | 'network' | 'server_validation_rejected' | 'unknown';
    }
  ) =>
    token
      ? trackEvent(token, 'purchase_failed', metadata)
      : trackGuestEvent('purchase_failed', metadata),

  restorePurchasesClicked: (token: string | null, metadata: Record<string, any> = {}) =>
    token
      ? trackEvent(token, 'restore_purchases_clicked', metadata)
      : trackGuestEvent('restore_purchases_clicked', metadata),

  restorePurchasesCompleted: (
    token: string | null,
    metadata: { restored_plan_id?: string }
  ) =>
    token
      ? trackEvent(token, 'restore_purchases_completed', metadata)
      : trackGuestEvent('restore_purchases_completed', metadata),

  // 1c. Founding member events (category: monetization).
  // NOTE: `founding_member_window_ended` is server-side only.
  foundingMemberOfferShown: (
    token: string | null,
    metadata: { days_remaining_in_window?: number }
  ) =>
    token
      ? trackEvent(token, 'founding_member_offer_shown', metadata)
      : trackGuestEvent('founding_member_offer_shown', metadata),

  foundingMemberClaimed: (
    token: string | null,
    metadata: { revenue_usd?: number }
  ) =>
    token
      ? trackEvent(token, 'founding_member_claimed', metadata)
      : trackGuestEvent('founding_member_claimed', metadata),

  // 1d. Workout generation funnel (category: workout)
  workoutGenerationStarted: (
    token: string | null,
    metadata: {
      mood?: string;
      energy_level?: string;
      duration_min?: number;
      equipment?: string;
    }
  ) =>
    token
      ? trackEvent(token, 'workout_generation_started', metadata)
      : trackGuestEvent('workout_generation_started', metadata),

  workoutGenerationCompleted: (
    token: string | null,
    metadata: { mood?: string; latency_ms?: number; workout_id?: string }
  ) =>
    token
      ? trackEvent(token, 'workout_generation_completed', metadata)
      : trackGuestEvent('workout_generation_completed', metadata),

  workoutGenerationFailed: (
    token: string | null,
    metadata: { mood?: string; failure_reason?: string; latency_ms?: number }
  ) =>
    token
      ? trackEvent(token, 'workout_generation_failed', metadata)
      : trackGuestEvent('workout_generation_failed', metadata),

  workoutRegenerated: (
    token: string | null,
    metadata: {
      mood?: string;
      previous_workout_id?: string;
      regeneration_count?: number;
    }
  ) =>
    token
      ? trackEvent(token, 'workout_regenerated', metadata)
      : trackGuestEvent('workout_regenerated', metadata),

  workoutPreviewed: (
    token: string | null,
    metadata: { workout_id?: string; mood?: string }
  ) =>
    token
      ? trackEvent(token, 'workout_previewed', metadata)
      : trackGuestEvent('workout_previewed', metadata),

  // ── MOOD V2 — Launch-critical CTA-level events ──────────────────────
  // The single biggest conversion-analysis gap: which paywall CTA the user
  // actually tapped (vs just viewing the paywall).
  paywallCtaTapped: (
    token: string | null,
    metadata: {
      cta: 'start_free_trial' | 'subscribe_now' | 'claim_founding' | 'save_for_later' | 'maybe_later' | 'see_all_plans';
      trigger_source?: string;
      variant?: 'standard' | 'founding';
    }
  ) =>
    token
      ? trackEvent(token, 'paywall_cta_tapped', metadata)
      : trackGuestEvent('paywall_cta_tapped', metadata),

  // Mood interstitial (drop-off measurement before workout build).
  moodIntroViewed: (token: string | null, metadata: { mood: string }) =>
    token
      ? trackEvent(token, 'mood_intro_viewed', metadata)
      : trackGuestEvent('mood_intro_viewed', metadata),

  moodIntroCtaTapped: (token: string | null, metadata: { mood: string }) =>
    token
      ? trackEvent(token, 'mood_intro_cta_tapped', metadata)
      : trackGuestEvent('mood_intro_cta_tapped', metadata),

  // Founding banner — distinct conversion path from the founding MODAL.
  foundingBannerShown: (token: string | null, metadata: { days_remaining?: number }) =>
    token
      ? trackEvent(token, 'founding_banner_shown', metadata)
      : trackGuestEvent('founding_banner_shown', metadata),

  foundingBannerClaimTapped: (token: string | null, metadata: { days_remaining?: number }) =>
    token
      ? trackEvent(token, 'founding_banner_claim_tapped', metadata)
      : trackGuestEvent('founding_banner_claim_tapped', metadata),

  foundingBannerDismissed: (token: string | null, metadata: { days_remaining?: number }) =>
    token
      ? trackEvent(token, 'founding_banner_dismissed', metadata)
      : trackGuestEvent('founding_banner_dismissed', metadata),

  foundingBannerChipTapped: (token: string | null, metadata: { days_remaining?: number }) =>
    token
      ? trackEvent(token, 'founding_banner_chip_tapped', metadata)
      : trackGuestEvent('founding_banner_chip_tapped', metadata),

  // ── MOOD V2 PHASE 3 — Notifications + sharing ───────────────────────
  notificationReceived: (token: string, metadata: { notification_type?: string } & Record<string, any> = {}) =>
    trackEvent(token, 'notification_received', metadata),

  notificationOpened: (token: string, metadata: { notification_type?: string; source?: string } & Record<string, any> = {}) =>
    trackEvent(token, 'notification_opened', metadata),

  notificationPermissionPrompted: (token: string | null, metadata: Record<string, any> = {}) =>
    token
      ? trackEvent(token, 'notification_permission_prompted', metadata)
      : trackGuestEvent('notification_permission_prompted', metadata),

  notificationPermissionGranted: (token: string | null, metadata: Record<string, any> = {}) =>
    token
      ? trackEvent(token, 'notification_permission_granted', metadata)
      : trackGuestEvent('notification_permission_granted', metadata),

  notificationPermissionDenied: (token: string | null, metadata: { can_ask_again?: boolean } & Record<string, any> = {}) =>
    token
      ? trackEvent(token, 'notification_permission_denied', metadata)
      : trackGuestEvent('notification_permission_denied', metadata),

  notificationSettingsChanged: (token: string, metadata: { setting: string; value: any }) =>
    trackEvent(token, 'notification_settings_changed', metadata),

  shareSheetOpened: (token: string, metadata: Record<string, any> = {}) =>
    trackEvent(token, 'share_sheet_opened', metadata),

  // In-app rating prompt (3rd completed workout → soft pre-prompt → native
  // StoreReview dialog). `outcome` is one of the RatingPromptOutcome values
  // from utils/ratingPrompt.ts. Guest edge cases silently drop the event.
  ratingPromptOutcome: (token: string | null, metadata: {
    outcome: string;
    workout_count?: number;
    placement?: string;
  }) => {
    if (!token) return;
    return trackEvent(token, 'rating_prompt_outcome', metadata);
  },
};

// Guest Analytics - for tracking guest user activity
export const GuestAnalytics = {
  // Workout Events (guests can browse and start workouts)
  workoutViewed: (metadata: {
    workout_name?: string;
    mood_category?: string;
  }) => trackGuestEvent('workout_viewed', metadata),

  workoutStarted: (metadata: {
    mood_category?: string;
    difficulty?: string;
    equipment?: string;
  }) => trackGuestEvent('workout_started', metadata),

  workoutCompleted: (metadata: {
    mood_category?: string;
    difficulty?: string;
    duration_minutes?: number;
  }) => trackGuestEvent('workout_completed', metadata),

  // Try This Workout Events
  tryWorkoutClicked: (metadata: {
    workout_name: string;
    equipment?: string;
    difficulty?: string;
    mood_category?: string;
    source?: string;
  }) => trackGuestEvent('try_workout_clicked', metadata),

  // Workout Session Events
  workoutSessionCompleted: (metadata: {
    workout_name: string;
    equipment?: string;
    difficulty?: string;
    mood_category?: string;
    duration_seconds: number;
    source?: string;
  }) => trackGuestEvent('workout_session_completed', metadata),

  // Navigation Events
  screenViewed: (metadata: {
    screen_name: string;
  }) => trackGuestEvent('screen_viewed', metadata),

  tabSwitched: (metadata: {
    from_tab: string;
    to_tab: string;
  }) => trackGuestEvent('tab_switched', metadata),

  // Feature Usage
  moodSelected: (metadata: {
    mood_category: string;
  }) => trackGuestEvent('mood_selected', metadata),

  equipmentSelected: (metadata: {
    equipment: string;
    mood_category?: string;
  }) => trackGuestEvent('equipment_selected', metadata),

  difficultySelected: (metadata: {
    difficulty: string;
    mood_category?: string;
  }) => trackGuestEvent('difficulty_selected', metadata),

  // Engagement Events
  appOpened: () => trackGuestEvent('app_opened'),
  
  exploreViewed: () => trackGuestEvent('explore_viewed'),
  
  // Conversion Events (when guest tries restricted actions)
  signupPromptShown: (metadata: {
    trigger_action: string;  // e.g., "save_workout", "like_post", "follow_user"
  }) => trackGuestEvent('signup_prompt_shown', metadata),
  
  signupPromptDismissed: (metadata: {
    trigger_action: string;
  }) => trackGuestEvent('signup_prompt_dismissed', metadata),
  
  signupPromptClicked: (metadata: {
    trigger_action: string;
    destination: 'register' | 'login';
  }) => trackGuestEvent('signup_prompt_clicked', metadata),

  // Guest Session Events
  guestSessionStarted: () => trackGuestEvent('guest_session_started'),
};

// Screen Time Tracker Hook Helper
export class ScreenTimeTracker {
  private screenName: string;
  private startTime: number;
  private token: string | null;

  constructor(screenName: string, token: string | null) {
    this.screenName = screenName;
    this.startTime = Date.now();
    this.token = token;
    
    // Track screen entered
    if (token) {
      Analytics.screenEntered(token, { screen_name: screenName });
    }
  }

  stop(): number {
    const duration = Math.round((Date.now() - this.startTime) / 1000);
    
    if (this.token && duration > 0) {
      Analytics.screenTimeSpent(this.token, {
        screen_name: this.screenName,
        duration_seconds: duration,
      });
    }
    
    return duration;
  }

  reset(): void {
    this.startTime = Date.now();
  }
}
