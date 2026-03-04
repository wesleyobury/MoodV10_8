# MOOD Fitness App - PRD

## Original Problem Statement
Full-stack fitness application with React Native (Expo) frontend and FastAPI backend. Key goals:
1. Deployment stability (resolve all blockers)
2. Notification system (badge notifications, feed thumbnails)
3. Video performance & UX (aspect ratio, loading speed)
4. Instagram share flow (transparent overlay, 1-tap share)

## Architecture
- **Frontend**: React Native (Expo SDK 54), TypeScript
- **Backend**: FastAPI (Python), MongoDB
- **Infrastructure**: Kubernetes on Emergent platform
- **3rd Party**: Cloudinary (media), Expo Push Notifications, Vercel (mood-admin)

## What's Been Implemented
- [2026-02-28] Instagram share: true transparency (`#00000000` bgColor), removed black story backgrounds, removed `InstagramShareModal` for 1-tap flow, loading spinner on button, removed `Sharing.shareAsync` fallback
- [2026-02-28] Push Notifications section in Settings (production-ready, not DEV-gated), uses existing `NotificationService` to register token to logged-in user
- [2026-02-28] Added `+not-found.tsx` for graceful unmatched route handling
- [2026-02-28] Added `settings` route to Stack navigator in `_layout.tsx`
- [2026-02-27] Aspect ratio: 4:5 (Instagram feed standard) in SmartVideoPlayer and MediaCarousel
- [2026-02-27] FlatList migration for Explore feed (virtualized rendering)
- [2026-02-27] Video preloading: thumbnail prefetching for upcoming posts
- [2026-02-27] Cloudinary: 720p with 800k bitrate cap + progressive download
- [2026-02-27] Fixed hardcoded auth API URL in `backend/auth.py`
- [Previous] Downgraded Expo SDK 55 to 54 for deployment compatibility
- [Previous] Fixed 2 N+1 query patterns in `backend/server.py`
- [Previous] Notification system fixes (backend lookup, backfill endpoint)

## Pending Verification (Post-Deployment)
- P1: Notification badge count and feed thumbnails
- P1: Data backfill endpoint (`POST /api/admin/backfill-notification-thumbnails`)
- P1: Instagram Stories transparent overlay rendering on device

## What's Been Implemented (continued)
- [2026-03-02] Persistent login: All auth methods (email/password, Google OAuth, Apple Sign-In) now use 10-year token/session expiry. Users stay logged in until explicit sign-out.
- [2026-03-02] Auto push notification init: `initNotifications()` runs automatically after login and on every authenticated app launch. Checks OS permission, requests if undetermined, obtains Expo push token, configures Android channel, upserts to backend. Persists token locally; derives UI from OS + stored state. Logout preserves push token. Denied users see "Open Settings" CTA. Never re-requests after denial.
- [2026-03-02] Push notification identity + featured-workout deep links end-to-end:
  - iOS: Added CFBundleDisplayName "MOOD" to Info.plist in app.json
  - Android: Added notification icon + color config, channel name "MOOD Notifications"
  - Backend: `_send_push_notification` enriches featured_workout pushes with workoutId, workoutTitle, cartItems[] (fetched from DB)
  - Backend: `FeaturedWorkoutPush` model accepts custom_title/custom_body for exact authored copy; falls back to random copy library
  - Frontend: Notification response handler parses data.type === "featured_workout", builds cart from push data (or fetches by workoutId), replaces cart contents, navigates to /cart
  - Frontend: Cold-start handled via getLastNotificationResponse() in NotificationInitializer
  - Frontend: Admin push page shows custom title/body inputs for featured workout pushes
  - CartContext: Added replaceCart() method for push-originated cart population
- [2026-03-02] Hardened push deep link handling:
  - Replaced fixed 500ms cold-start delay with a pendingNotification queue in NotificationService; drained on first NavigationStack mount via onNavigationReady()
  - Gated "denied but already requested" re-prompt guard to Android only (iOS returns undetermined until first prompt, then denied is permanent)
  - Created proper monochrome Android notification icon (white M silhouette on transparent bg) at assets/images/notification-icon.png
  - Set CFBundleDisplayName to "officialmoodapp" to match desired sender label on iOS
- [2026-03-03] Three UI/UX fixes:
  - Removed exercise video search icon and search bar from home screen (index.tsx)
  - Fixed profile grid video thumbnails: added missing `cover_urls` to PostResponse in get_user_posts and get_following_posts endpoints — root cause was the API simply wasn't returning the user-selected cover URLs
  - Fixed video autoplay on tab switch: explore tab now clears visiblePostId on blur via useFocusEffect; SmartVideoPlayer pauses + mutes on AppState background; onViewableItemsChanged clears visiblePostId when no items visible
- [2026-03-03] Four push notification + UI fixes:
  - Push Notifications section in settings gated to admin only (officialmoodapp)
  - Fixed duplicate push notifications: deduplicated tokens in get_user_tokens
  - Fixed push title/body: defaults to workout_name as title (not random copy library); custom_title/custom_body used exactly when provided
  - Fixed "unknown" sender in notification tab: trigger_featured_workout_notification now passes admin's user_id as actor_id → notification lookup joins actor data → shows officialmoodapp profile
  - Fixed empty cart on featured workout push tap: corrected fetch URL from /api/featured/batch to /api/featured/workouts/batch
- [2026-03-04] Like push notifications — end-to-end fix:
  - Root cause: single-like notifications were stored with send_push=False (only bundled likes >=3 in 10min sent pushes)
  - Fix: Changed single likes to send_push=True — every like now sends a push immediately
  - Push copy: "New like" / "{likerName} liked your post" (Instagram-style)
  - Deep link: Updated LIKE scheme from mood://notifications to mood://post/{entity_id} (opens the liked post)
  - Dedupe: Added dedupe_key (like:{postId}:{likerId}) to create_notification — prevents spam from rapid re-likes
  - Push data enrichment: engagement pushes now include targetType + targetId for mobile routing
  - Logging: Added token count + push type logging in _send_push_notification
  - Existing safeguards preserved: self-like skipped, user prefs respected, following-only filter, quiet hours
- [2026-03-04] Comprehensive Push Notification System Fix (P0):
  - **Database Hygiene**: Added unique index on `device_tokens.token` to prevent duplicate token entries. Cleanup script auto-deduplicates existing tokens on startup.
  - **Idempotency Layer**: Created `push_send_log` collection with unique compound index on `[user_id, type, event_key]` and 7-day TTL. `_send_push_notification` checks this log before sending — guarantees at-most-once delivery per event per user.
  - **Sender Persistence**: All server-initiated notifications (featured workouts, workout reminders, featured suggestions) now auto-resolve the admin user's ID (`officialmoodapp`) as `actor_id`. Added `get_admin_user_id()` helper. All admin endpoints pass `current_user_id` as sender.
  - **Device Token Upsert**: Changed `register_device_token` from find+insert to atomic upsert on `token` field — eliminates race condition that caused duplicate tokens.
  - **Unbounded Queries Fixed (P1)**: Replaced all `.to_list(100000)` with `.to_list(10000)` in server.py to prevent potential OOM errors.
- [2026-03-04] Featured Workout Push – Empty Cart Fix (P0):
  - **Backend Validation**: Admin featured workout endpoint now validates workout exists and has non-empty exercises before sending. Returns 400 with descriptive error if empty.
  - **Frontend Cart Hydration**: Cart screen now self-hydrates from route params on cold start: (1) parses inline `pushCartItems` JSON param, or (2) fetches by `featuredId` from `/api/featured/workouts/batch`. No dependency on global CartContext state propagation.
  - **Notification Tap Handler**: `_handleFeaturedWorkoutTap` now passes `featuredId`, `pushCartItems` (serialized JSON), and `workoutTitle` as explicit route params.
  - **Loading State**: Cart suppresses empty state while hydrating from push params.
- [2026-03-04] Like Push Notification Fix (P0):
  - **Comprehensive Logging**: Added end-to-end PUSH-PATH tracing in `create_notification` and SEND-PUSH tracing in `_send_push_notification`. Logs quiet_hours check, idempotency result, token count, and Expo API response.
  - **Quiet Hours Default Fix**: Changed `_is_in_quiet_hours` default from `True` to `False` to prevent pushes from being silently blocked when settings key is missing.
  - **Verified**: Full push path traversal confirmed via live integration test — Expo API reached and returns 200 OK.

- [2026-03-04] Video Engagement Notification Fix (P0):
  - **Root Cause**: Legacy video posts stored author as `user_id` instead of `author_id`. Like/comment handlers read `author_id` only and silently skipped when empty.
  - **A) Fallback Resolution**: Added `resolve_post_author_id(post)` helper checking `author_id > user_id > creator_id > owner_id`. Updated like handler and `trigger_comment_notification` to use it. Orphan posts (no author fields) log warning instead of silently skipping.
  - **B) Write Normalization**: Post creation already writes `author_id`. Added assertion that logs error if `author_id` missing after insert.
  - **C) Data Migration**: One-time startup migration backfills `author_id` from `user_id`/`creator_id` for legacy posts. Ran successfully: 1 post fixed, 0 orphaned.
  - **Testing**: 16/16 backend tests passed including unit tests for priority order, integration tests for legacy+normal posts, regression tests.

## Backlog
- P2: Video pre-fetching for workout plans (Phase 2)
- P2: Admin panel caching for expensive aggregations
- P2: Investigate root cause of notifications without `metadata.post_thumbnail`
