# MOOD Fitness App - Product Requirements Document

## Original Problem Statement
Build a fitness app with workout generation, social features, and video guidance. The app includes admin analytics, push notifications, and Instagram sharing capabilities.

## Current Sprint Focus
1. Fix TestFlight login failures caused by JSON parse errors
2. Fix video playback failures on Explore and Profile pages
3. Fix Create Post page crashes caused by expo-video-thumbnails

## What's Been Implemented

### February 22, 2026
- **TestFlight Login Fix**: Created safe API fetch wrapper (`/app/frontend/utils/api.ts`) that handles non-JSON responses gracefully
- Updated `AuthContext.tsx` login/register to use safe fetch
- Added `EXPO_PUBLIC_BACKEND_URL` to `app.json` extra config for production builds
- Enhanced API logging for debugging URL issues

- **Cloudinary Video Playback Fix**: 
  - Created `normalizeCloudinaryVideoUrl()` in `/app/frontend/utils/cloudinaryVideo.ts`
  - Forces iOS-compatible `f_mp4,q_auto` transformation on all Cloudinary video URLs
  - Updated `MediaCarousel.tsx` to use normalized URLs
  - Updated `ExerciseLookupSheet.tsx` to use normalized URLs
  - Added enhanced error logging for video failures

- **Create Post Crash Fix (expo-video-thumbnails)**:
  - `VideoFrameSelector.tsx`: Changed to dynamic require() with try-catch to prevent crashes
  - `VideoThumbnail.tsx`: Same safe import pattern with Cloudinary fallback
  - `profile.tsx`: Removed unused direct import
  - Components now show helpful error messages instead of crashing when native thumbnails unavailable

### Previous Sessions
- V2 Analytics Console
- Push notifications system
- Instagram Story sharing
- Video player optimizations
- Featured workouts system
- User stats and streaks

## Tech Stack
- **Frontend**: Expo/React Native
- **Backend**: FastAPI
- **Database**: MongoDB
- **Media**: Cloudinary
- **Notifications**: Expo Push

## Key Files
- `/app/frontend/utils/api.ts` - Safe API fetch wrapper
- `/app/frontend/utils/apiConfig.ts` - API URL configuration with fallbacks
- `/app/frontend/utils/cloudinaryVideo.ts` - Video URL normalization for iOS
- `/app/frontend/components/MediaCarousel.tsx` - Video player component
- `/app/frontend/components/VideoFrameSelector.tsx` - Safe video frame selector
- `/app/frontend/components/VideoThumbnail.tsx` - Safe video thumbnail generator
- `/app/frontend/contexts/AuthContext.tsx` - Authentication state management
- `/app/frontend/eas.json` - EAS build configuration
- `/app/frontend/app.json` - Expo configuration

### February 26, 2026
- **Feed Aspect Ratio Fix**: Changed SmartVideoPlayer and MediaCarousel containers from square (SCREEN_WIDTH x SCREEN_WIDTH) to 9:16 portrait (SCREEN_WIDTH x FEED_HEIGHT where FEED_HEIGHT = SCREEN_WIDTH * 16/9). Updated `videoContainer`, `errorContainer` in SmartVideoPlayer.tsx and `mediaContainer` in MediaCarousel.tsx.
- **Cloudinary Video Fast Delivery**: Rewrote `normalizeCloudinaryVideoUrl()` in `cloudinaryVideo.ts` to enforce `f_mp4,q_auto:good,w_720,br_1200k,fl_progressive` transforms. Strips existing transforms and rebuilds clean URL from public_id. Reduces initial buffer time significantly on first render.
- **MongoDB Atlas Timeout Fix**: Increased `AsyncIOMotorClient` timeouts (`connectTimeoutMS=30000`, `serverSelectionTimeoutMS=30000`, `socketTimeoutMS=45000`) and added `maxPoolSize=20`, `retryWrites=True`, `retryReads=True` for Atlas stability.
- **Notification Thumbnail Live Lookup**: Replaced static `$ifNull` in `get_notifications` aggregation with a `$lookup` to the posts collection that fires when `metadata.post_thumbnail` is missing. Also auto-backfills `metadata.post_thumbnail` on read so future fetches skip the lookup.
- **N+1 Query Fixes (4 endpoints)**: Batched follow-check queries in `get_user_followers`, `get_user_following`, `search_users_general`, and `get_drilldown_users` — each now uses a single `$in` query instead of per-item queries.
  - Fixed `post_preview` mapping: was using `n.image_url` (actor avatar), now uses `n.target_thumbnail_url || n.metadata?.post_thumbnail || n.image_url`
  - Fixed `message` mapping to include fallback chain: `n.body || n.title || n.message || ''`
  - Delayed `markAllNotificationsRead()` — now fires 1.5s AFTER fetch completes (not before), preventing premature zeroing of badge
  - Added `useFocusEffect` to refetch notifications when screen regains focus while on notifications tab
  - Added `NOTIF-DIAG` console logs for raw + mapped notification payloads
- **Admin Backfill Endpoint**: Added `POST /api/admin/backfill-notification-thumbnails` — patches existing notifications missing `metadata.post_thumbnail` by looking up the post's `cover_urls`/`media_urls`

### February 25, 2026
- **Deployment Fix (Syntax Error)**: Removed orphaned duplicate code block (lines 144-174) in `SmartVideoPlayer.tsx` — a stray try/catch block with trailing `};` left over from a previous refactor. This was the sole cause of the Metro bundling SyntaxError at line 174.
- **Backend Analytics Fix**: Fixed `NameError: name 'workouts_started' is not defined` in `user_analytics.py` `get_admin_analytics()`. The return dict was using undefined variable names `workouts_started` and `total_workouts` instead of the correctly defined `total_workouts_started` and `total_workouts_completed`. Also fixed `average_workouts_per_active_user` calculation.

## Prioritized Backlog

### P0 (Critical)
- [x] Fix deployment-blocking syntax error in SmartVideoPlayer.tsx
- [ ] User verification of TestFlight login fix
- [ ] User verification of video playback fix
- [ ] User verification of create-post page fix

### P1 (High)
- [x] Fix backend analytics error (`workouts_started` undefined) — FIXED Feb 25
- [ ] Debug and fix likes/comments notification badge not updating (diagnostics added Feb 26)

### P2 (Medium)
- [ ] Video Performance Phase 2 (pre-fetching)
- [ ] Admin Panel caching
- [ ] Clean up hardcoded fallback URL in `frontend/utils/apiConfig.ts`
- [ ] Fix N+1 query pattern in moderation stats endpoint

### P3 (Low)
- [ ] Replace temporary try-catch native module wrappers with permanent solutions
- [ ] Code refactoring and cleanup
