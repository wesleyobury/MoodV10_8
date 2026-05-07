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
- [2026-05-07] **Added 12 new compound-legs workouts** to `frontend/data/compound-legs-workouts-data.ts`:
  - **Smith Machine — Step Ups** (3): `Smith Supported Step-Ups` (beginner), `Smith Step-Ups Tempo` (intermediate), `Smith Step-Up Drive` (advanced) — uses smith-machine-step-up reference image.
  - **Squat Rack — Zercher Squat** (3): `Zercher Box Squat` (beginner), `Tempo Zercher Squat` (intermediate), `Zercher Pause Squat` (advanced) — uses zercher-squat reference image.
  - **Squat Rack — Lunges** (3): `Barbell Static Lunge` (beginner), `Barbell Walking Lunge` (intermediate), `Barbell Lunge Burnout` (advanced) — uses bb-lunge reference image.
  - **Squat Rack — Jump Squat** (3): `Bodyweight Jump Squat` (beginner), `Jump Squat Repeats` (intermediate), `Jump Squat Clusters` (advanced) — uses jump-squat reference image.
  All 12 surface in the Muscle Gainer → Legs → Compound flow when the matching equipment + intensity is selected. TypeScript compile clean for the data file (no new errors introduced).

- [2026-05-06] **P2: Eliminated unbounded admin analytics queries + added 2 Pit Shark Step-Up workouts**:
  - **Backend (`server.py`)**: Refactored 16 `.find().to_list(10000)` calls in admin analytics to MongoDB aggregation pipelines that group at the DB level (no more loading 10k docs into Python memory). Affected functions: `get_time_series_analytics` (10 metrics × {day,week,month}), `get_metric_breakdown` (3 breakdowns), `get_signup_trend_endpoint`, `get_chart_data` (`user_growth`, `session_trend`, `engagement_trend`), and paginated `export_users_csv` (now `?limit=&skip=`, hard-cap 5000). Response shapes preserved. Week-period grouping now uses Mongo `%G-W%V` (correct ISO week+year).
  - **Frontend (`compound-legs-workouts-data.ts`)**: Added 2 new workouts under `Pit Shark`:
    - **Intermediate**: `Pit Shark Step-Ups` — 14–16 min, 4 rounds × 8/leg, Rest 90s. Belt-loaded step-ups reducing spinal load.
    - **Advanced**: `Pit Shark Step-Up Pulses` — 16–18 min, 4 rounds × 6/leg + 3 pulses, Rest 120s. Top pulses extend time under tension.
    - Both use the user-supplied step-up reference image (`mt2elt9e_pit shark step up.png`).
  - **Verification**: Testing agent ran 43/43 backend pytest tests — all admin analytics endpoints return correct shape, pagination works, non-admin → 403, /users/{id}/posts requires auth (no staging bypass leak). Frontend data file additions confirmed by direct inspection.

- [2026-05-06] **Reverted staging auth bypass + 2 new Compound equipment dead-links**:
  - **Reverted `IS_STAGING` JWT bypass** on `GET /api/users/{user_id}/posts` in `backend/server.py` — endpoint now requires JWT auth in all environments.
  - **Reverted `APP_ENV=staging`** → `APP_ENV=production` in `backend/.env`. Backend log confirms `Environment: APP_ENV=production, IS_STAGING=False` after restart.
  - **Added Kettlebells + Pendulum Squat equipment cards** to Muscle Gainer → Legs → Compound flow (`frontend/app/compound-equipment.tsx`). Per request, these are dead-link selections — no static workouts seeded yet, so selecting only one of them produces an empty equipment-state in the workout display. Visible at the bottom of the equipment grid alongside the existing six options.


  - **Welcome screen Get Started button accessibility (P0)**: Wrapped the welcome content in a `ScrollView` with `flexGrow:1, justifyContent:'space-between'` content style and `bounces=false`. On constrained viewports (e.g., the Emergent web preview's iPhone-frame mockup), users can now scroll to reach the gold "Get Started" button at the bottom. File: `frontend/app/index.tsx`.
  - **Admin Add Workout — final wiring**:
    1. Registered the new screen in `frontend/app/_layout.tsx`: `<Stack.Screen name="admin-add-workout" />`.
    2. Added an "Add Workout" CTA button to `frontend/app/admin-dashboard.tsx` (right after the Debug Panel) that routes to `/admin-add-workout` with `data-testid="admin-go-add-workout"`. Yellow pill, prominent placement.
    3. Aligned admin form muscle options for "Muscle Gainer" mood with the legs sub-groups used by the display screen: `['Compound', 'Glutes', 'Hamstrings', 'Quads', 'Calves', 'Chest', 'Back', 'Shoulders', 'Arms', 'Abs']`, with auto-reset effect when mood changes. Default muscle is now `Compound`. File: `frontend/app/admin-add-workout.tsx`.
    4. **Dynamic merge into compound-workout-display**: `frontend/app/compound-workout-display.tsx` now fetches `GET /api/workouts?mood=<mood>&intensity=<difficulty>` on mount, then in `getWorkoutsForMuscleGroup()` merges admin docs into each `EquipmentWorkouts` card by matching mood + (mapped muscleGroup) + selected equipment + intensity. Mapping: `Compound→Compound, Glutes→Glutes, Hammies→Hamstrings, Quads→Quads, Calfs→Calves`. Admin workouts inject into the same equipment buckets the user already selected; if none of the static cards covers an admin workout's equipment, a new equipment card is created on the fly with a `barbell` icon.
  - **Verification**: Backend `GET /api/workouts?mood=Muscle Gainer&intensity=beginner` returns inserted admin workouts in the static-data schema (verified with a temporary DB row). Welcome screen "Get Started" verified visible at the bottom on a 390×700 viewport.

 New `POST /api/messages/send-workout` (validates recipient exists, refuses self-send, finds/creates DM conversation, persists `workout_share` attachment message). Extended `POST /api/conversations/{id}/messages` to accept optional `attachment_type` + `attachment`; extended `GET /api/conversations/{id}/messages` to return them. New components: `SendWorkoutModal.tsx` (premium bottom-sheet user search with debounced query, empty state, send pill), `WorkoutShareMessageCard.tsx` (premium share-card with image banner, gold pill, mood-category title + sub-path subtext, tap → open `/shared-workout`), and new screen `app/shared-workout.tsx` that renders the original WorkoutCard form. Wired the new "Send Workout to Friend" button into the shared `components/WorkoutCard.tsx` (right below "Add Workout"). Mood title + subtext auto-derived from `usePathname()` (Muscle Gainer + muscle group, Sweat + Cardio/Light Weight, Explosion/Lazy + Bodyweight/Weight Based, Outdoors/Calisthenics with no subtext). All security paths verified via curl: valid send → thread created + payload preserved, self-send → 400, invalid recipient → 404, empty body → 400.
- [2026-04-27] **Forgot / Reset Password flow**: Added `POST /api/auth/forgot-password` (always returns `{success:true}` — never leaks account existence; generates 256-bit URL-safe token, bcrypt-hashed in `password_reset_tokens` collection, 1h expiry, supersedes prior tokens) and `POST /api/auth/reset-password` (verifies token, single-use atomically marked, updates bcrypt password hash on `users`, invalidates other outstanding tokens). Email sent via **Resend** (`noreply@officialmoodapp.com`) with MOOD-styled HTML + CTA → `moodapp://reset-password?token=XYZ`. New screens: `app/auth/forgot-password.tsx`, `app/reset-password.tsx` (deep-link enabled via expo-router file-based routing). Added "Forgot password?" link below password field on login screen. **⚠️ Email currently fails to deliver: `officialmoodapp.com` domain is not yet verified in Resend** — token rows still create correctly, only the email send is blocked. Verify the domain at https://resend.com/domains to enable real delivery.
- [2026-04-27] **Admin Session Diagnostics row** in `/admin-dashboard` Debug Panel (gated to `officialmoodapp` only): shows storage backend (SecureStore vs AsyncStorage), token presence + tail, token age, and last-validated timestamp — refreshes every 30s. Instrumented token writes in `AuthContext.login/register/initAuth/fetchCurrentUser/logout` and `login.tsx` OAuth+Apple paths to maintain `auth_token_stored_at` and `auth_token_last_validated_at` keys.
- [2026-04-27] **Login persistence fix**: Replaced `AsyncStorage` with `expo-secure-store` for `auth_token` via new `/app/frontend/utils/secureStorage.ts` (keychain/keystore-backed). Auto-migrates legacy tokens from AsyncStorage on first launch. Updated `AuthContext.tsx`, `AppBootstrap.tsx`, `app/auth/login.tsx` (OAuth + Apple). Fixed `fetchCurrentUser` to only logout on 401/403 (was logging out on any non-OK). Removed legacy `Ogeeezzbury` auto-clear. Backend tokens already have 10-year expiry (longer than the 180d requested).
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
  - **A) Fallback Resolution**: Added `resolve_post_author_id(post)` helper (server.py) and `_resolve_post_author_id` @staticmethod (NotificationService) checking `author_id > user_id > creator_id > owner_id`. Updated like handler and comment notification to use it. Orphan posts (no author fields) log warning.
  - **Comment notifications now resolve recipient from the post via _resolve_post_author_id() (same fallback order).**
  - **B) Write Normalization**: Post creation already writes `author_id`. Added assertion that logs error if `author_id` missing after insert.
  - **C) Data Migration**: One-time startup migration backfills `author_id` from `user_id > creator_id > owner_id` (matching helper priority). Ran successfully: 1 post fixed, 0 orphaned.
  - **D) NOTIF-CREATED evidence**: Log line includes `id`, `type`, `entity_id`, `recipient`, `actor`, `media_type`. Both like (single + bundled) and comment metadata include `media_type` field.
  - **Testing**: 14/14 VIBER backend tests passed + 16/16 initial acceptance tests.

- [2026-03-04] Video Profile Grid Thumbnail Fix:
  - **Backend**: Added `derive_post_media_fields()` helper. Every `PostResponse` now includes canonical `thumbnail_url` (from cover_urls or Cloudinary auto-thumb fallback) and `media_type` ("video"/"image"). Video detection includes `.m3u8` and `/video/` path.
  - **Frontend Profile Grid**: Uses server-derived `thumbnail_url` as static `<Image>` for video tiles — never loads video. Falls back to `VideoThumbnail` component only when no cover URL exists.
  - **Normalized**: `thumbnail_url` is the canonical field. Both Explore and Profile read the same source.
  - **Testing**: 33/33 backend tests passed (unit + API integration + regression).

- [2026-03-05] Featured Workout Deep Link – Battle Plan Data Fix (P0):
  - **Root Cause**: Push payload in `notifications.py` only sent 6 fields per exercise (id, name, duration, description, imageUrl, equipment). Missing: `battlePlan`, `moodTips`, `difficulty`, `workoutType`, `moodCard`, `intensityReason`.
  - **Backend Fix**: Updated push payload construction to include all 12 exercise fields. Capped at 10 exercises for push payload size. Added `heroImageUrl` to payload.
  - **Frontend Fix (notifications.ts)**: Fixed fetch fallback body format from `{ids: [...]}` to bare `[...]` (matching backend endpoint contract). Fixed moodTips mapping from `[]` to `ex.moodTips || []`. Fixed id mapping to check `exerciseId` first.
  - **Frontend Fix (cart.tsx)**: Same fixes as notifications.ts for the cart hydration fetch fallback path.
  - **Testing**: 30/30 backend tests passed (push payload fields, batch endpoint, exerciseId mapping, cap at 10, body format).

- [2026-03-05] Video Engagement Notification Fix – cover_urls KeyError (P0):
  - **Root Cause**: `cover_urls` stored as dict `{"0": "url"}` (from React Native) instead of list `["url"]`. `cover_urls[0]` threw `KeyError: 0` (dict key is string "0", not int 0) in `trigger_like_notification`, `trigger_comment_notification`, `trigger_mention_notification`, and `trigger_reply_notification`. The exception was caught silently → notification never created for ANY video post with Cloudinary URLs.
  - **Fix 1 - _safe_first() helper** (notifications.py): New function that handles list, dict, and None for `cover_urls`/`media_urls` access. Replaced all 5 occurrences of `cover_urls[0]` in notifications.py.
  - **Fix 2 - server.py backfill thumbnail** (line 11303): Same dict-safe access pattern applied.
  - **Fix 3 - Startup migration**: On boot, converts all existing dict `cover_urls` to list format. Normalized 10 posts.
  - **Fix 4 - create_post normalization**: New posts normalize dict `cover_urls` to list before storage — prevents future occurrences.
  - **TRACE logging**: Added TRACE-LIKE, TRACE-COMMENT, TRACE-NOTIF with explicit skip reasons (self_like, missing_post, missing_recipient, idempotency, following_only, prefs_disabled, type_blocked). Downgraded to debug level after root cause confirmed.
  - **Testing**: 10/10 backend tests passed. Video like + comment notifications now created. Image post regression passed.

- [2026-03-05] Cart Persistent After Trash Fix:
  - **Root Cause**: Hydration `useEffect` in `cart.tsx` depended on `cartItems.length`. When `clearCart()` set items to `[]`, length changed to 0, re-triggering the useEffect. Since `params.featuredId` was still set (route params persist in navigation stack), it re-hydrated the cart immediately.
  - **Fix**: Added `userClearedRef` (React ref) that's set to `true` on trash press and individual last-item removal. Hydration useEffect checks this ref and skips re-hydration after explicit user clear. Ref resets on fresh mount (new push notification = new screen instance).

- [2026-03-05] Featured Workout Notification Inbox Tap Fix:
  - **Root Cause**: `notifications-inbox.tsx` navigated to `/featured-workout` (nonexistent route → fell through to profile). Should be `/featured-workout-detail` with `params: { id: entity_id }` matching the carousel path.
  - **Fix**: One-line route correction. Now tapping featured workout notification → workout detail screen → cart → workout session (full path with battle plans, mood tips).
  - **Testing**: 8/8 backend tests passed (iteration_8). Code review verified correct routing.

- [2026-03-05] Video Performance Phase 2 — Aggressive Pre-fetching:
  - **New `utils/mediaPrefetch.ts`**: Centralized prefetch service with session-level deduplication. Functions: `prefetchFeaturedWorkoutImages`, `prefetchCartImages`, `prefetchVideoStart`, `prefetchUpcomingVideos`.
  - **Featured Workout Image Prefetch**: `useFeaturedWorkouts.ts` now auto-prefetches all exercise images (hero + individual) when workouts load from cache or server. Detail pages load instantly.
  - **Cart Image Prefetch**: `CartContext.tsx` auto-prefetches cart item images whenever cart changes. Workout guidance screens load faster.

- [2026-03-05] Environment Switch: APP_ENV=production in backend/.env

- [2026-03-05] Profile Grid Missing Content Fix (P0):
  - **Root Cause**: 14 posts had `author_id` stored as string instead of ObjectId. Profile endpoint queried only ObjectId type, so these posts were invisible on profiles but visible on explore (different query).
  - **Fix**:
    1. Profile endpoint `$match` now uses `$or` for both ObjectId and string author_id
    2. Added `$addFields` + `$toObjectId` in pipeline for proper `$lookup` join on legacy data
    3. Startup migration normalizes all string author_ids → ObjectId (14 converted)
    4. Added `PROFILE-POSTS` debug logging with userId, skip, limit, db_count
    5. Added admin-only `/api/debug/user_posts` endpoint for diagnosis
  - **Testing**: 19/19 backend tests passed (iteration_12)

  - **Explore Feed Enhanced Preloading**: Lookahead increased from 1→3 video posts. Now prefetches: poster thumbnails (3 ahead), HLS manifests (3 ahead), and initial 150KB MP4 bytes (immediate next item only) via Range request for near-instant playback start.
  - **`cloudinaryVideo.ts` Enhancements**: `preloadNextItems` default `maxAhead` increased to 3. Added `prefetchInitialBytes` helper for MP4 Range request prefetching.
  - **Testing**: 15/15 backend tests passed (iteration_9). Code review verified all integration points.

- [2026-03-05] Push Notification Reliability Fix (P0):
  - **Root Cause**: `None` values stored in MongoDB `notification_settings` treated as falsy by Python's `dict.get()`. When `notifications_enabled=None`, `not None` → `True` → silently blocked ALL push sends for affected users.
  - **Fix**: 
    1. Added `_bool(val, default)` / `_str(val, default)` coalescing helpers in `get_user_settings()` (notifications.py) — ensures None→default for all settings fields
    2. Added startup data migration in `server.py` to fix existing None→True values in `notification_settings` collection
    3. Changed `notification_worker.py` DB queries from exact `True` match to `{"$ne": False}` pattern (matches both True and None/unset)
  - **Scope**: 6+ code paths affected including `send_featured_workout_to_all`, `trigger_mass_workout_reminder`, `create_notification`, `_process_scheduled_digests`, `_check_quiet_hours_ending`
  - **Testing**: 13/13 backend tests passed (iteration_10). RCA verified with unit tests.

- [2026-03-05] Session Persistence Fix (P0):
  - **Root Cause**: AuthContext.tsx cleared auth token on ANY non-200 response from `/api/users/me`, including 500/502/503 server errors during pod restarts/deployments.
  - **Fix**: Only clear token on HTTP 401 (truly invalid/expired). On 500/502/503, keep the token and proceed optimistically — don't log users out for transient server issues.
  - **File**: `contexts/AuthContext.tsx` lines 164-176

- [2026-03-05] Guest Explore "No Posts" Fix (P0):
  - **Root Cause**: `KeyError: 'caption'` crashed `/api/posts/public` when any post lacked the `caption` field. Some posts had `content` instead.
  - **Fix**: Changed `post["caption"]` → `post.get("caption", "")` in 3 locations (public endpoint, authenticated endpoint, single post endpoint).
  - **File**: `server.py` lines ~6914, ~7560, ~7636. Test posts without caption cleaned from DB.
  - **Testing**: 20/20 backend tests passed (iteration_11).

- [2026-03-05] Featured Workout Loading Speed Improvements:
  - **New `/api/featured/bundle` endpoint**: Returns config + workouts in a single response, eliminating the config→batch network waterfall (saves ~100ms round trip).
  - **Bundle-first loading in `useFeaturedWorkouts.ts`**: Hook now tries bundle endpoint first, falls back to sequential fetch if it fails.
  - **Carousel uses `expo-image`**: Switched from React Native's `Image` to `expo-image` with `cachePolicy="disk"` and `transition={200}` for disk-cached images with smooth fade-in.
  - **Testing**: Bundle endpoint verified (20/20 tests, iteration_11). Code review confirmed all integrations.

- [2026-03-05] Backend URL Lock Fix (P0):
  - **Root Cause**: `AppBootstrap.tsx` had its own `getApiUrl()` function that read `process.env.EXPO_PUBLIC_BACKEND_URL` directly WITHOUT the preview domain rejection logic from `apiConfig.ts`. The Emergent deployment automation overwrites `frontend/.env` with preview URLs, so any code reading the env var directly would use the wrong backend.
  - **Fix**:
    1. Removed duplicate `getApiUrl()` from `AppBootstrap.tsx` — now imports `API_URL` from `../utils/apiConfig`
    2. Updated `frontend/.env` to `https://bug-busters-13.emergent.host`
    3. `apiConfig.ts` already has: hardcoded `PRODUCTION_BACKEND_URL`, `isPreviewDomain()` rejection, 3-tier fallback (env → config → hardcoded)
    4. `app.json` extra section already has production URL
  - **Files**: `components/AppBootstrap.tsx`, `frontend/.env`, `utils/apiConfig.ts`, `app.json`
  - **Testing**: 7/7 backend tests + full frontend code correctness verification (iteration_13)

- [2026-03-05] Profile Grid "No Posts" Debug & Fix (P0):
  - **Bugs Found & Fixed**:
    1. **Bare `except:` swallowed ALL errors** in profile endpoint → returned 404 "User not found" hiding real crashes. Fixed: now catches `Exception`, logs `PROFILE-POSTS-ERROR` with full traceback, returns 500 with error type.
    2. **`PostResponse.cover_urls: Optional[dict]`** — previous migration converted dicts to lists, but model expected dict. Fixed: changed to `Optional[Any]` (both PostCreate and PostResponse).
    3. **Frontend showed "No posts yet" on errors** — no distinction between failed request and empty result. Fixed: added `postsError` state, shows "Couldn't load posts" with pull-to-refresh on errors, "No posts yet" only on 200+empty.
  - **New Debug Endpoint**: `GET /api/debug/profile_posts_check?userId=<id>` (admin-only) returns:
    - `userId_received`, `user_exists_in_db`, `posts_by_author_id` (string), `posts_by_user_id`, `posts_by_author_obj` (ObjectId), `newest_author_posts` (3 newest), `profile_pipeline_returned`, `profile_pipeline_error`
  - **Enhanced Logging**: PROFILE-POSTS log now includes full `filter=` mongo query
  - **Testing**: 10/10 backend tests passed (iteration_14)

## Backlog
- P2: Admin panel caching for expensive aggregations
- P2: Unbounded query refactoring at server.py (replace .to_list(10000) with proper pagination)
- P3: Some posts have media_type=None (legacy data quality)
