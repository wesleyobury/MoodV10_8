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
- [2026-05-08] **Live tab — real-time workout activity feed (replaces "Following")**:
  - Replaced `Following` tab in `frontend/app/(tabs)/explore.tsx` with new `Live` tab. Tab type changed to `'forYou' | 'live' | 'notifications'`.
  - Tab styling per brand spec: active = white text + 2px gold (#F5C518) underline, inactive = #6B6B6B. Tiny pulsing gold dot (6px) next to "Live" label via inline `LiveTabPulseDot`.
  - New `frontend/components/LiveFeed.tsx` renders: pinned stat-header card (#141414, 14px radius) with sessions-today big number + most-common-mood + tiny pulsing gold dot, then a scrollable list of tinted feed cards.
  - Six mood palettes (sweat #E27457 on #1F0F0B, muscle #D9CDB8 on #1A1715, explosive #9B8AE0 on #15102A, lazy #5FA68A on #0F1F1A, calisthenics #6B9CD9 on #0E1620, outdoor #B89A5F on #1F1A0B). Gold reserved for LIVE pulse / active tab underline / milestone accent only (≤2 gold elements per screen).
  - Three entry types: `live_now` (LIVE NOW label + 5px gold pulse dot), `completion` (no label, "X finished a Y-min workout"), `milestone` (gold MILESTONE label + big white number). All cards have a "Try this workout" CTA chip.
  - Tap → navigates to that mood's existing Build-for-Me path (sweat→workout-type, muscle→body-parts, explosive→explosiveness-type, lazy→lazy-training-type, calisthenics→calisthenics-equipment, outdoor→outdoor-equipment).
  - Empty state: when <5 entries, shows only stat header + "Quiet right now — be the first today" (no fake activity).
  - **New backend endpoint** `GET /api/feed/live` (in `backend/server.py`) returns `{stats: {sessions_today, most_common_mood}, entries: [...]}`. Aggregates `workout_started` (last 20 min → live_now) + `workout_completed` + `workout_session_completed` events from ALL users (no follow graph), classifies inconsistent `metadata.mood_category` strings into one of 6 buckets via `_classify_live_mood`, joins user info, formats relative timestamps via `_format_relative_time`, stretches lookback window (6h → 24h → 3d → 7d → 30d → 365d) until ≥15 entries, and emits milestone cards for users sitting exactly at thresholds {5, 10, 25, 50, 100, 250, 500, 1000}.
  - Polls every 30s while tab focused.
  - Tests: `/app/backend/tests/test_live_feed.py` (9 unit tests for classifier + relative time) + `/app/backend/tests/test_live_feed_api.py` (21 integration tests via testing agent) — **30/30 PASS**.


- [2026-05-08] **Muscle Gainer cart polish — flavor badge, muscle-group dividers, compound/isolation tags**:
  - Bottom-right hero badge: gold icon (barbell / fitness / flame) + white text for Strength / Hypertrophy / Pump. Lives in both `GeneratedWorkoutView.tsx` and `cart.tsx`. The cart-screen badge derives from majority `training_style`.
  - **Subtle light-grey muscle-group divider** (`MuscleGroupDivider` component) inserted before each muscle section in both manual + auto-generated muscle gainer carts. Hairline lines flank an uppercase label (CHEST / LEGS / BICEPS, etc.). Helper `getMuscleGainerGroup()` parses `workoutType` for both formats: `"Muscle Building - <Muscle>"` (auto) and `"<Muscle>"` (manual).
  - **Compound / Isolation tag** rendered on every muscle gainer card (matches existing "Warm-Up / Main Set / Finisher / Activation / Power / Bonus" badge format). Field plumbed to `WorkoutItem` via `workoutToItem()`.


## What's Been Implemented
- [2026-05-08] **Muscle Gainer "Build for Me" generator (v2 spec) + metadata tagging** for all 11 muscle group databases:
  - Added `MuscleGainerMetadata` types to `frontend/types/workout.ts`: `ExerciseType`, `MovementPattern` (37 patterns), `TrainingStyle` (`strength` / `hypertrophy` / `pump` / `mixed`).
  - Programmatically tagged **880 workouts** across `chest/back/shoulders/biceps/triceps/abs/quads/hamstrings/glutes/calves/compound-legs-workouts-data.ts` via `/app/scripts/tag_muscle_gainer.py` (heuristic + spec overrides).
  - Replaced `generateMuscleGainerCarts` in `frontend/utils/workoutGenerator.ts`. New algorithm:
    - Volume table: 1 muscle (beg 2-3, int/adv 3-4) / 2 muscles (cap 5/6) / 3+ muscles (cap 5/6 with ancillary trim).
    - Per-muscle slot order: compound → secondary → isolation.
    - Legs special case: 4-slot section (2 compound from compound-legs DB + 2 isolation from sub-files; isolations from different sub-groups).
    - 3 cart variants flavored by `training_style`: Cart 1 = Strength, Cart 2 = Hypertrophy, Cart 3 = Pump (with `mixed` fallback when flavor pool is exhausted).
    - Equipment + movement_pattern uniqueness within each muscle section.
    - Abs always rendered last; protected from being trimmed to 0 unless absolutely required.
  - Validation: `/app/scripts/validate_muscle_gainer.js` runs 1,280 cart simulations across 12 scenarios × 3 tiers + 200 random multi-muscle combos — all 7 invariants pass (0 failures).
  - Sample script `/app/scripts/sample_muscle_gainer_carts.js` for visual inspection of generated carts.
  - Dropped legacy `LEG_COMPOUND_EXERCISES` hardcoded list and old `selectLegWorkouts`/`selectWorkoutsForMuscleGroup` helpers — all leg compound logic is now metadata-driven.


## What's Been Implemented
- [2026-05-07] **Added Barbell equipment to Muscle Gainer > Legs > Glutes (alphabetical)** in `frontend/app/legs-equipment.tsx` and Glutes data file:
  - New equipment id `barbell-glute` (name: 'Barbell', icon: 'barbell') inserted alphabetically as first option in Glutes equipment list.
  - Updated `equipmentPerGroup.Glutes.push` mapping (line 284) and `hasGlutesEquipment` selector (line 350) to include `barbell-glute`.
  - Added new `Barbell` block to `frontend/data/glutes-workouts-data.ts` with **9 Back Squat workouts** (3 per intensity):
    - Beginner: Controlled Back Squat, Box Back Squat, Tempo Back Squat
    - Intermediate: Glute-Biased Back Squat, Back Squat Pulses, Back Squat Pause Reps
    - Advanced: Heavy Glute Back Squat, Back Squat 1.5 Reps, Back Squat Burnout
  - Each intensity uses one of the 3 user-supplied back squat images (beginner→pic1, intermediate→pic2, advanced→pic3).
  - User confirmed prior Pendulum Squat / Kettlebells fixes are rendering correctly.

- [2026-05-07] **Aligned Kettlebells intermediate/advanced deadlift picks with user's first-listed variants** + restarted Metro to clear stale bundle cache:
  - KB intermediate deadlift: KB Romanian Deadlift → **KB Deadlift Tempo** (matches user's first-listed intermediate deadlift).
  - KB advanced deadlift: KB Heavy Deadlift → **KB Deadlift Drop Set** (matches user's first-listed advanced deadlift).
  - Forced `expo` supervisor restart + cache clear after the user reported stale UI showing "no workouts found" on Pendulum Squat.
  - Verified via direct module import: data file exposes Kettlebells (4/4/4) and Pendulum Squat (3/3/3) correctly, all 10 equipment entries present.

- [2026-05-07] **Kettlebells trimmed to 4 cards per intensity & added Pendulum Squat block** in `frontend/data/compound-legs-workouts-data.ts`:
  - **Kettlebells (12 total — 4 per intensity)**: each intensity now shows exactly one Lunge + one Step-Up + one Swing + one Deadlift.
    - Beginner: KB Static Lunge, KB Supported Step-Up, KB Controlled Swing, KB Deadlift
    - Intermediate: KB Walking Lunge, KB Step-Up Tempo, KB Swing Tempo, KB Romanian Deadlift
    - Advanced: KB Walking Lunge Drop Set, KB Explosive Step-Up, KB Swing Intervals, KB Heavy Deadlift
  - **Pendulum Squat (9 total)**: new equipment block with 3 per intensity. Beginner: Controlled, Pause, Tempo. Intermediate: Drop Set, Heel-Elevated, Pulses. Advanced: Heavy, Burnout, 1.5 Reps. Each rotates through the 3 user-supplied Pendulum Squat reference images.
  - `tsc --noEmit` clean.

- [2026-05-07] **Added 9 KB Deadlift workouts** to the existing `Kettlebells` block in `frontend/data/compound-legs-workouts-data.ts` (Kettlebells now has **34 total**: 9 lunges + 7 swings + 9 step-ups + 9 deadlifts):
  - **Beginner (3)**: KB Deadlift, KB Deadlift Pause, KB Deadlift Reset
  - **Intermediate (3)**: KB Deadlift Tempo, KB Romanian Deadlift, KB Deadlift Hold
  - **Advanced (3)**: KB Deadlift Drop Set, KB Deadlift 1.5 Reps, KB Heavy Deadlift
  - Each rotates through the 3 user-supplied deadlift reference images. `tsc --noEmit` clean.

- [2026-05-07] **Added 9 KB Step-Up workouts** to the existing `Kettlebells` block in `frontend/data/compound-legs-workouts-data.ts` (Kettlebells now has 25 total: 9 lunges + 7 swings + 9 step-ups):
  - **Beginner (3)**: KB Supported Step-Up, KB Low Box Step-Up, KB Alternating Step-Up
  - **Intermediate (3)**: KB Step-Up Tempo, KB Step-Up Knee Drive, KB Step-Up Hold
  - **Advanced (3)**: KB Explosive Step-Up, KB Step-Up Pulses, KB Step-Up Drop Set
  - Each rotates through the 3 user-supplied step-up reference images. `tsc --noEmit` clean.

- [2026-05-07] **Added 7 KB Swing workouts** to the existing `Kettlebells` block in `frontend/data/compound-legs-workouts-data.ts` (alongside the 9 KB Lunge entries already there):
  - **Beginner (3)**: KB Controlled Swing, KB Swing Reset, KB Swing Hold
  - **Intermediate (3)**: KB Swing Tempo, KB Swing Ladder, KB Swing Continuous
  - **Advanced (1)**: KB Swing Intervals
  - Each workout uses one of the 3 user-supplied swing reference images. Surfaces in the standard Kettlebells equipment carousel together with the lunges. `tsc --noEmit` clean.

- [2026-05-07] **Kettlebells equipment now has real workouts** in Muscle Gainer → Legs → Compound:
  - **`frontend/app/legs-equipment.tsx`**: Wired `kettlebells-compound` (and `pendulum-squat-compound`) into the `Compound` equipment bucket so selections actually flow into the workout-display screen (previously dead-link).
  - **`frontend/data/compound-legs-workouts-data.ts`**: Added new `Kettlebells` equipment block with 9 lunge workouts (3 per intensity), each carouseling through the 3 user-supplied KB lunge reference images:
    - **Beginner**: KB Static Lunge, KB Supported Reverse Lunge, KB Alternating Lunge.
    - **Intermediate**: KB Walking Lunge, KB Lunge Pulses, KB Front Rack Lunge.
    - **Advanced**: KB Walking Lunge Drop Set, KB Lunge 1.5 Reps, KB Deficit Lunge.
  - All 9 surface in the standard equipment carousel via the existing `WorkoutCard` rendering — no new component required (same logic as Dumbbells / Barbell). `tsc --noEmit` clean for both edited files.

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

- [2026-02 session] Build For Me v2 — Sweat / Outdoor / Calisthenics:
  - **Sweat v2**: Fixed cart sizes (2 beg / 3 int/adv), strict equipment uniqueness, canonical `cardio → resistance → cardio` template. Tagged all sweat workouts with `role`/`modality`/`intensity_cost`.
  - **Outdoor v2**: Combo + solo logic via `ELIGIBLE_PAIRINGS` matrix. Same-env combos require beginner-tier opener; cross-env prefers user-tier ≤cost 3 with beginner-tier fallback. 60 outdoor workouts tagged with `session_type`.
  - **Calisthenics v2**: Slot-assembly generator (main_1 → optional main_2 → abs finisher). Strict equipment uniqueness for int/adv; abs slot ALWAYS picks `abs_slot_eligible: true`. 69 calisthenics workouts tagged with `movement_focus`/`abs_slot_eligible`. Added "Pull-Up Bar (abs)" equipment + 12 new core exercises.
  - **Cart UI labels**: `cart.tsx` and `GeneratedWorkoutView.tsx` render plain white "Warm-Up / Main Set / Finisher" text labels under workout names based on the `role` metadata.
  - **Validation [2026-02 fork session]**: Self-contained Node validator at `/tmp/test_calisthenics.mjs` runs the v2 algorithm against real data — 50 iterations × 3 carts × 3 intensities = 450 carts validated. All v2 rules pass: cart sizes correct (2/3/3), last slot is abs_eligible 100% of the time, no duplicate equipment within int/adv carts, no duplicate names across carts in same iteration. Metro cache cleared and Expo restarted with fresh bundle.
  - **Files**: `frontend/types/workout.ts`, `frontend/utils/workoutGenerator.ts`, `frontend/data/calisthenics-all-workouts-data.ts`, `frontend/data/outdoor-workouts-data.ts`, `frontend/data/cardio-workouts-data.ts`, `frontend/app/cart.tsx`, `frontend/components/GeneratedWorkoutView.tsx`.

- [2026-02 fork session] **Explosive cart slot badges** — Activation / Power / Bonus.
  - Slot order in every explosive cart is now FIXED: **slot 0 = BW (Activation)**, **slot 1 = LW (Power)**, **slot 2 = Flex (Bonus)**. Previous intensity-cost re-sequencing dropped — the spec author's slot semantics override that.
  - **Schema**: `slot_label?: string` added to `WorkoutItem` in `frontend/contexts/CartContext.tsx`. Generator sets it per slot. Display layer prefers `slot_label` over `role` (so explosive carts show Activation/Power/Bonus while sweat carts continue to show Warm-Up/Main Set/Finisher).
  - **Display**: same `sweatRoleLabel` style used in `frontend/components/GeneratedWorkoutView.tsx` and `frontend/app/cart.tsx` — single line of edits in each (a `slot_label || ROLE_LABEL[role]` fallback). No new style needed; matches existing badge format exactly.
  - **Validation**: `/app/scripts/validate_explosive.py` (now persistent under `/app/scripts/`) re-runs 600 trials × 3 carts and asserts the new fixed slot order. PASS.

- [2026-02 fork session] **I'm Feeling Explosive v3 generator** — flavor-aware, bodyweight + weights cart pairing.
  - **Cart shape**: 3 carts in canonical display order [plyo, loaded, dynamic]. Beginner = 2 slots (1 BW + 1 LW). Int / Adv = 3 slots (1 BW + 1 LW + 1 flex from full pool). Sequencing: lowest `intensity_cost` first; for 3-slot carts → low, high, mid (peak in middle).
  - **Hard rules**: every cart contains at least one BW and one LW workout, all workouts in a cart share the same `cart_flavor`, no `equipment` value appears in more than one cart per generation.
  - **Tagging**: 120 workouts tagged with `path` + `cart_flavor` + `intensity_cost` via `/tmp/tag_explosive.py` (idempotent, equipment+tier-aware). 63 BW + 57 LW. Schema additions in `frontend/types/workout.ts`: `ExplosivePath`, `CartFlavor`. Optional fields `path?` and `cart_flavor?` added to `Workout` interface.
  - **KB normalization**: `'Kettle Bell'` (BW pool) → `'Kettlebells'` to match LW pool. Without this, the cross-cart equipment uniqueness rule would treat them as different equipment and could place both in one generation.
  - **Tightness sort + retry**: tightest flavor processed first using `min(BW_distinct_eq, LW_distinct_eq)` per flavor; whole generation retries up to 25 times if any cart can't be filled. Required because beginner `dynamic` LW pool has only 3 distinct equipment (Landmine, Kettlebells, Trap Hex Bar) all of which overlap with `loaded`/`plyo` flavors.
  - **Validation**: `/tmp/validate_explosive.py` parses both data files, mirrors the generator, runs 600 trials × 3 carts = 1800 carts. PASS — all hard rules verified (cart count, slot count, ≥1 BW & ≥1 LW per cart, single flavor per cart, equipment uniqueness across carts, sequencing, canonical display order).
  - **Files**: `frontend/types/workout.ts`, `frontend/utils/workoutGenerator.ts`, `frontend/data/bodyweight-explosiveness-data.ts`, `frontend/data/explosiveness-weights-data.ts`.

 — every workout name now unique within its mood database.
  - **Sweat (cardio + light-weights)**: 18 collision groups disambiguated. Cardio: `Resistance Play (Assault/Ski)`, `Reverse & Forward (UBE)`, `Endurance Builder (Row)`, `Endurance & Power (Bike)`, `Sprint & Recover (Row/Ski/Climber)`, `Interval Climb (Climber)`, `EMOM Challenge (Curve)`. Weights: `Cardio Circuit (Med Ball)`, `Flow (Med Ball/Slam Ball)`, `Cardio Flow (BB)`, `Complex (KB/BB/Med Ball/Slam Ball)`, `EMOM 12 (BB)`, `Tabata (Med Ball/Slam Ball/Ropes)`, `Ladder (KB/BB)`, `AMRAP 15 (KB/BB)`, `AMRAP 10 (Slam Ball)`, `Sprint Circuit (Slam Ball)`, `Gauntlet (Sled)`.
  - **Calisthenics**: 6 collision groups disambiguated. `Bar Start (Parallettes)`, `Mixed Angle (Parallel Bars/Parallettes)`, `Angle Mix (Ab Wheel)`, `Eccentric Power (Parallel Bars)`, `Midrange Control (Parallel Bars/Parallettes/Ab Wheel)`. (Spec listed 5 Midrange Control collisions but only 3 exist in data; spec also listed Support Strength/Rings & Midrange Control/Rings collisions which don't exist — skipped.)
  - **Lazy Move Your Body**: 2 collisions disambiguated. `Gear Nudge (Assault)`, `Technique Tempo (SkiErg)`.
  - **Lazy Lift Weights**: 5 collisions disambiguated. `Vertical Stack (Full Body Push)`, `Smith Lines (Push/Mix)`, `Cable Finish (Lower)`, `Vertical Lines (Mix)`, `Midrange Pull (Full Body)`.
  - **Outdoor**: zero collisions (already unique).
  - **Validation**: `/tmp/verify_unique.py` walks every mood database (6 totals: sweat-cardio 78, sweat-light-weights 54, outdoor 60, calisthenics 69, lazy-move-your-body 66, lazy-lift-weights 81 = 408 workouts) and confirms 100% name uniqueness within each. PASS.
  - **Tooling**: `/tmp/rename_workouts.py` (programmatic equipment+tier-aware renamer; 35/35 applied) + 10 search_replace edits for cardio. Total: 45 renames across 6 data files.
  - **Files**: `frontend/data/cardio-workouts-data.ts`, `frontend/data/light-weights-data.ts`, `frontend/data/calisthenics-all-workouts-data.ts`, `frontend/data/lazy-bodyweight-data.ts`, `frontend/data/lazy-full-body-data.ts`, `frontend/data/lazy-lower-body-data.ts`.
  - Featured workout content (`backend/seed_featured_workouts.py`, `app/featured-workout-detail.tsx`) shares some legacy names (e.g., "Eccentric Power") with calisthenics pool but is a separate curated pool — no conflict.


  - **Path 1: Move Your Body** — picks 3 carts, each with one cardio machine slot (beginner) or two cardio slots with different machines (int/adv) plus a mandatory bodyweight finisher in the last slot. Equipment uniqueness within cart, soft cross-cart variety per slot role, soft uniqueness for bodyweight names across the 3 carts.
  - **Path 2: Lift Weights** — picks 3 carts always in fixed region order: [upper, lower, full_body], 1 workout each. Sub-category randomly chosen from {press/pull/full upper}, {quad/hinge/full lower}, {push/pull/mix full body}. Module-level `lwLastPicks` cache softly rotates sub-categories across consecutive Build for Me calls in a session.
  - **Schema**: New types added to `frontend/types/workout.ts`: `MoveYourBodyEquipment`, `LazyModality`, `LiftWeightsBodyRegion`, `LiftWeightsSubCategory`. No per-workout data file edits — metadata derived at runtime from existing `EquipmentWorkouts.equipment` parent labels via `MB_EQUIPMENT_TO_KEY` and `LW_SUBCAT_MAP`.
  - **API**: New exports `generateMoveYourBodyCarts` and `generateLiftWeightsCarts`. Backwards-compat dispatcher `generateLazyCartsWithType(intensity, 'bodyweight'|'weights', moodCard)` still works for the existing call site `app/lazy-training-type.tsx`.
  - **Validation**: Self-contained Node validator at `/tmp/test_lazy.mjs` runs structural checks across 300 generations × 3 carts each = 900 carts. All hard rules pass: cart sizes (2 beginner, 3 int/adv for Move Your Body; 1 each × 3 for Lift Weights), last slot bodyweight, equipment uniqueness within cart, fixed region order for Lift Weights, distinct bodyweight names across the 3 Move Your Body carts.
  - **Files**: `frontend/types/workout.ts`, `frontend/utils/workoutGenerator.ts`. No data file edits.

## Backlog
- P1: "Send Workout to Friend" 404 in production — backend has `/api/messages/send-workout` route working in preview, needs production deploy from user (no code change).
- P2: Primary Goal toggle (Strength / Skill / Endurance) above equipment list to narrow down picks.
- P2: Cleanup duplicate/dead files (`compound-equipment.tsx`, `compound-workout-display-updated.tsx`, `.backup-before-fix` files).
- P2: Refactor `workoutGenerator.ts` (1400+ lines) into domain-specific files (`generators/sweat.ts`, `generators/outdoor.ts`, `generators/calisthenics.ts`).
- P2: Admin panel caching for expensive aggregations
- P2: Unbounded query refactoring at server.py (replace .to_list(10000) with proper pagination)
- P3: Some posts have media_type=None (legacy data quality)
