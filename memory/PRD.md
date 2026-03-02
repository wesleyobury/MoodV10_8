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

## Backlog
- P2: Fix unbounded query `.to_list(100000)` in `server.py` (pagination)
- P2: Video pre-fetching for workout plans (Phase 2)
- P2: Admin panel caching for expensive aggregations
- P2: Investigate root cause of notifications without `metadata.post_thumbnail`
