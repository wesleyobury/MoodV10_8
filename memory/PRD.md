# MOOD Fitness App - Product Requirements Document

## Original Problem Statement
Build a fitness app with workout generation, social features, and video guidance. The app includes admin analytics, push notifications, and Instagram sharing capabilities.

## Current Sprint Focus
1. Resolve deployment blocker (Expo SDK 55 `--environment` flag incompatibility)
2. Fix N+1 query performance issues for production stability
3. Verify post-deployment features (notifications, video playback)

## What's Been Implemented

### February 27, 2026
- **Expo SDK Downgrade (54)**: Downgraded from SDK 55 (`^55.0.2`) to SDK 54 (`~54.0.0`) to resolve EAS update `--environment` flag requirement that Emergent deployment pipeline doesn't support yet. Both SDKs use React Native 0.81 so impact is minimal.
- **Package Alignment**: Ran `npx expo install --fix` to align 5 packages with SDK 54:
  - `@react-native-community/slider`: 5.1.2 -> 5.0.1
  - `expo-linking`: 8.0.10 -> 8.0.11
  - `expo-router`: 6.0.19 -> 6.0.23
  - `expo-splash-screen`: 31.0.12 -> 31.0.13
  - `react-native-worklets`: 0.5.2 -> 0.5.1
- **Lock File Cleanup**: Removed `package-lock.json` (keeping only `yarn.lock`)
- **app.json Fixes**: Fixed `android/adaptiveIcon/backgroundColor` from `#000` to `#000000`, removed duplicate `LSApplicationQueriesSchemes` and Android permissions
- **N+1 Query Fix (Event Listing)**: Batched user lookup in event listing endpoint using `$in` query instead of per-event `find_one`
- **N+1 Query Fix (User Export)**: Replaced per-user `count_documents` calls with two aggregation pipelines for events and workouts

### February 26, 2026
- **Feed Aspect Ratio Fix**: Changed SmartVideoPlayer and MediaCarousel containers from square to 9:16 portrait
- **Cloudinary Video Fast Delivery**: Rewrote `normalizeCloudinaryVideoUrl()` with fast-delivery transforms
- **MongoDB Atlas Timeout Fix**: Increased AsyncIOMotorClient timeouts for Atlas stability
- **Notification Thumbnail Live Lookup**: Added `$lookup` fallback for missing thumbnails
- **N+1 Query Fixes (4 analytics endpoints)**: Batched follow-check queries
- **Admin Backfill Endpoint**: Added `POST /api/admin/backfill-notification-thumbnails`

### February 25, 2026
- **Deployment Fix (Syntax Error)**: Removed orphaned duplicate code block in SmartVideoPlayer.tsx
- **Backend Analytics Fix**: Fixed undefined variable names in user_analytics.py

### February 22, 2026
- **TestFlight Login Fix**: Created safe API fetch wrapper
- **Cloudinary Video Playback Fix**: iOS-compatible video URL normalization
- **Create Post Crash Fix**: Safe dynamic imports for expo-video-thumbnails

### Previous Sessions
- V2 Analytics Console, Push notifications, Instagram Story sharing
- Video player optimizations, Featured workouts system, User stats and streaks

## Tech Stack
- **Frontend**: Expo SDK 54 / React Native 0.81
- **Backend**: FastAPI
- **Database**: MongoDB
- **Media**: Cloudinary
- **Notifications**: Expo Push

## Key Files
- `/app/frontend/package.json` - Expo SDK 54 configuration
- `/app/frontend/app.json` - Expo app configuration
- `/app/frontend/eas.json` - EAS build configuration
- `/app/backend/server.py` - Main backend with N+1 fixes
- `/app/backend/db.py` - MongoDB connection with Atlas timeouts
- `/app/backend/notifications.py` - Notification system with thumbnail fallback

## Prioritized Backlog

### P0 (Critical)
- [x] Fix deployment blocker (Expo SDK 55 --environment flag) - FIXED Feb 27
- [x] Fix N+1 queries in event listing and user export - FIXED Feb 27
- [ ] User verification of deployment success

### P1 (High)
- [ ] Debug and fix likes/comments notification badge (diagnostics added Feb 26)
- [ ] Post-deployment: Run backfill endpoint for notification thumbnails
- [ ] Verify video playback speed and 9:16 aspect ratio

### P2 (Medium)
- [ ] Video Performance Phase 2 (pre-fetching)
- [ ] Admin Panel caching
- [ ] Clean up hardcoded fallback URL in apiConfig.ts

### P3 (Low)
- [ ] Replace temporary try-catch native module wrappers
- [ ] Code refactoring and cleanup
- [ ] Root cause fix: populate metadata.post_thumbnail at notification creation time
