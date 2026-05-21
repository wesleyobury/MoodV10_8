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
- [2026-05-14 PM3] **Forgot-password deep link fix + Live Feed avatar overlap + Profile pic prompt + Paywall 2nd-session lock verified**:
  - **Forgot-password "dead button" fix**: Email clients (iOS Mail, Gmail iOS) strip custom URL schemes — the `moodapp://reset-password?token=...` link in our email body was silently failing on tap. Wrapped it in an HTTPS bounce page:
    - Added `GET /api/auth/reset-redirect?token=...` (FastAPI `HTMLResponse`) in `backend/server.py`. Returns a tiny branded page with **3 layers** of redirect to the `moodapp://` scheme: `<meta http-equiv="refresh">`, JS `window.location.replace`, and a manual "Open MOOD" button fallback for Safari/cases that block auto-redirect.
    - Added env var `PASSWORD_RESET_PUBLIC_BASE` (preview = `https://free-tier-limit-2.preview.emergentagent.com`). When set, the email button URL is built as `{base}/api/auth/reset-redirect?token=...`; when unset (dev), falls back to the raw scheme.
    - Updated email helper text from "copy paste into MOOD app" → "copy paste into your phone's browser" (it's an https URL now, browser will hand off to the app).
    - `from html import escape as html_escape` + `HTMLResponse` imported. Token defense-in-depth HTML-escaped before embedding.
    - **Tests** `backend/tests/test_password_reset_redirect.py` — **4/4 PASS**. Covers: HTML+deep-link present, HTML-escape on hostile tokens, missing-token graceful, content-type assertion.
  - **Live Feed avatar overlap (P0 visual bug)**: The 44×44 absolute-positioned avatar at `top:14 right:14` was overlapping the title (especially `"I'm feeling lazy"`) because the text rows had no right padding. Wrapped `labelRow + moodWord/milestoneNumber + sentence` in a new `<View style={styles.cardTextColumn}>` with `paddingRight: 68` (avatar offset 14 + width 44 + 10 breathing room). Bottom row (`timestamp + Try this workout` button) stays full-width.
  - **Profile pic prompt on 2nd app open**: New `components/ProfilePicPromptGate.tsx` mounted in `app/_layout.tsx::AppContent`. Tracks per-user app-open count in AsyncStorage (`@mood_app_open_count_<userId>`), increments exactly once per JS-runtime session via a module-level `Set` sentinel. On 2nd qualifying open with no avatar:
    - Shows a centered modal with `Add now` (launches `expo-image-picker`, uploads via existing `/api/users/me/avatar-base64`) + `Maybe later` skip.
    - Skipping flips a persistent top banner ("Add a profile picture — tap to upload, stand out across the app") that follows the user across every screen until they upload a pic. Banner positioned with `safeAreaInsets.top` and `zIndex:1000`.
    - Modal seen-flag (`@mood_pic_prompt_modal_seen_<userId>`) prevents re-showing modal; banner only appears once modal has been dismissed (so users get one explicit prompt, then a non-intrusive nudge).
    - Auto-tears-down all UI the moment `user.avatar` becomes truthy (regardless of upload source: settings, register, gate itself).
  - **Paywall on 2nd workout session — verified**: `SubscriptionContext.canStartWorkout = hasActiveAccess || !hasUsedFreeSession` is already wired correctly. `workout-guidance.tsx::handleStartPauseTimer` calls `openPaywall('start_workout_after_free_session')` and `recordStartFreeWorkout()` exactly as spec demands. `FREE_GENERATION_CAP = Number.POSITIVE_INFINITY` (unlimited generations) confirmed per product decision. No code changes required; behaviour matches "1 free session → paywall on 2nd Start tap".
  - **Full regression**: `test_live_feed_classification.py` 9/9 + `test_live_feed_snapshot_hydration.py` 1/1 + `test_live_feed_dedupe_priority.py` 3/3 + new `test_password_reset_redirect.py` 4/4 = **17/17 PASS**.


## What's Been Implemented
- [2026-05-14 PM2] **Live Feed mood-classification rule reorder — fixes Sweat ↔ Muscle bucket leak**:
  - **Root cause**: `_LIVE_MOOD_RULES` in `backend/server.py` evaluated the muscle-bucket keyword list (which included the loose substring `"weight"`) BEFORE the sweat rule. Any `mood_category` containing `"Sweat - Light Weights"` therefore matched `"weight"` first and got filed as Muscle Gainer on the Live Feed. Same family of bugs affected `"Build Explosion - Body Weight"` → calisthenics and `"Build Explosion - Light Weights"` → muscle.
  - **Fix** (`backend/server.py::_LIVE_MOOD_RULES`): rewrote the rule table top-to-bottom by parent-mood explicitness. Sweat is now rule 1, Explosive is rule 2, Outdoor / Lazy / Calisthenics / Muscle Gainer follow. Loose muscle-group fallbacks (`back`, `chest`, `legs`, `weights`, etc.) are now the LAST rule — they only fire when none of the explicit parent-mood names matched. Dropped overly-greedy keywords (`"weight"`, `"pull"`, `"dip"`) in favour of more specific phrases (`"weights"`, `"pull bar"`, `"dip bar"`).
  - **Test coverage** `backend/tests/test_live_feed_classification.py` — **9 new test functions / ~50 assertions PASS**. Covers every real-world `mood_category` string the workout-session analytics call sends across all 6 mood entry paths + featured workouts + legacy manual carts + case-insensitive variants. Locks the ordering as a regression baseline.
  - **Live Feed API tests** `backend/tests/test_live_feed_api.py` — updated 2 stale auth assertions (`requires_auth` / `invalid_token_rejected`) to reflect the prior session's intentional guest-access opening of `/api/feed/live`. **21/21 PASS**.
  - **Full live-feed suite** — **40/40 PASS** end-to-end (`test_live_feed.py` 9, `test_live_feed_classification.py` 9, `test_live_feed_api.py` 21, `test_live_feed_snapshot_hydration.py` 1). Zero regressions in `test_subscription_status_sync.py` (7/7) or `test_legal_reaccept.py` (6/6).


  - **Root cause** of broken cart hydration: workout snapshots are persisted with the workout-session field names (`workoutName` / `workoutTitle` / `moodCategory` — see `app/workout-session.tsx::handleFinishSession`) but `CartContext.WorkoutItem` expects `name` / `workoutType` / `moodCard` / `id`. Live Feed was pushing the raw snapshot dicts straight into `addToCart`, so the cart rendered empty names, missing dividers, and incorrect grouping.
  - **Fix** (`components/LiveFeed.tsx::handleCardPress`): added an inline mapper that mirrors `normalize_snapshot_to_attached_workout` on the server and the cart-item builder in `app/post-detail.tsx::handleTryWorkout`. Generates a stable `id` per item (`live-snapshot-<snapshotId>-<idx>`), copies `workoutName`/`workoutTitle` → `name`, `moodCategory` → `workoutType`/`moodCard`, and fills sane defaults for `equipment` / `difficulty` / `duration` / `imageUrl` / `battlePlan` etc. Items with no resolvable name are dropped (defensive null-guard).
  - **Founding Member badge** (`components/FoundingMemberBadge.tsx`): removed the now-unused `caption` prop (the "Day-one MOOD." subhead had already been deleted from the JSX in commit 618d44d1 but the prop and orphaned style remained). `app/(tabs)/profile.tsx` updated to pass just `testID`. Final badge UI: small gold-ring pill with star icon + "FOUNDING MEMBER" label — no caption underneath.
  - **End-to-end regression test** (`backend/tests/test_live_feed_snapshot_hydration.py` — **1/1 PASS**): registers a fresh user → POST `/api/workout-snapshots` with the exact payload shape `workout-session.tsx` sends → fires `workout_completed` analytics with `metadata.workout_snapshot_id` → GET `/api/feed/live` and asserts the entry surfaces the snapshot_id → GET `/api/workout-snapshots/{id}` and asserts the persisted workouts contain `workoutName`/`workoutTitle`/`equipment`/`battlePlan` (the keys the client mapper expects) and explicitly NOT `name`/`workoutType`/`moodCard` (locking the mapper as the canonical normalization point).
  - **TypeScript** `tsc --noEmit` clean on the touched files. Pre-existing errors in `utils/analytics.ts` / `utils/cloudinaryVideo.ts` unchanged.
  - **Verified live**: backend curl chain (register → snapshot → analytics → feed → hydration) returns the expected shape on the preview backend. Native cart-rendering verification requires a TestFlight build.


## What's Been Implemented
- [2026-05-14] **ToS version-bump re-consent system (App Store compliance enhancement).**
  - **Backend (`server.py`)** — two new endpoints + one enhancement:
    - `GET /api/legal/active-version` (public, no auth) → `{ terms_version, privacy_version }`. Sourced from the existing `CURRENT_TERMS_VERSION` constant.
    - `GET /api/legal/needs-reaccept` (auth required) → `{ needs_reaccept, current_version, user_version, terms_accepted_at, acknowledged_terms_at }`. Compares the user's stamped `terms_accepted_version` against the live constant; returns `True` when missing, null, or stale.
    - `POST /api/users/me/accept-terms` (existing endpoint) — now ALSO stamps `acknowledged_terms_at` alongside `terms_accepted_at`/`terms_accepted_version`/`privacy_accepted_at`, so the App-Store-compliance audit field is always current after a re-consent.
  - **Frontend (`components/LegalReacceptGate.tsx`)** — new lightweight bottom-sheet modal mounted from `app/_layout.tsx` (alongside `<FoundingMemberGate />`). On auth load (single check, no polling): hits `/legal/needs-reaccept`, and if the user is stale, shows a non-blocking sheet with the disclaimer text + "I Agree" CTA + Review-later snooze + inline links to `/terms-of-service` and `/privacy-policy`. The snooze stores the current_version in AsyncStorage (`@mood_legal_reaccept_snoozed_version_v1`) so the user isn't pestered again within the same launch — but a future version bump clears it automatically. Guests and unauthenticated users are skipped.
  - **Backend tests** `backend/tests/test_legal_reaccept.py` — **6/6 PASS** (public endpoint, auth gate on `/needs-reaccept`, fresh-user-doesn't-need, stale-version triggers, accept-terms clears + bumps both audit fields, null-version edge case). Existing subscription tests **7/7 PASS** = **13/13 total**, zero regressions.
  - **Audit trail** — every acceptance stamps `terms_accepted_at`, `terms_accepted_version`, `privacy_accepted_at`, AND `acknowledged_terms_at`. App Review responses can quote any of the four fields.
  - **Scope guards honored** — no new full-screen step, no blocking interaction, no rebuild of the signup flow.

- [2026-05-14] **App Store Compliance pass (signup acknowledgement, settings legal, in-workout safety banner) + Founding Member cutoff bump to TODAY + iOS build 46→47 / Android versionCode 2→3.**
  - **Founding Member cutoff moved forward** — `FOUNDING_MEMBER_CUTOFF` flipped from `2026-05-15 00:00 UTC` → `2026-05-14 00:00 UTC` (today, start of day UTC). All pre-cutoff users retain founding-member status (migration only flips False→True, never demotes). Anyone signing up today or later is on the paid tier and routes through the StoreKit paywall. Verified live: a fresh registration just now returned `founding_member=false`, `subscription_status=null`.
  - **iOS build** bumped `46 → 47` in `app.json`. **Android `versionCode`** bumped `2 → 3`. Required before pushing the next TestFlight / Play track build.
  - **App Store Compliance (5 sub-tasks, all integrated into existing surfaces — no new full-screen steps):**
    1. **Account Creation Screen (`app/auth/register.tsx`)** — added a single required acknowledgement checkbox below the Create Account button: "I acknowledge MOOD provides fitness guidance, not medical advice, and I am physically able to exercise. I agree to the [Terms of Service] and [Privacy Policy]." Inline links push to `/terms-of-service` and `/privacy-policy`. Checkbox unchecked by default. **The Create Account button is gold-gradient and active only when checked; charcoal-gradient and `disabled={!acknowledged}` otherwise.**
    2. **Backend (`server.py` `/api/auth/register`)** — now stamps `acknowledged_terms_at = datetime.now(timezone.utc)` on the user record alongside the existing `terms_accepted_at` (kept for back-compat). Verified end-to-end via direct Mongo read after register.
    3. **Settings Screen (`app/settings.tsx`)** — Legal section was already present with three rows: Terms of Service → `/terms-of-service`, Privacy Policy → `/privacy-policy`, Delete Account → existing confirm-then-execute flow. Confirmed reachable in 2 taps from home (Profile tab → Settings).
    4. **First Workout Safety Banner (`components/SessionSafetyBanner.tsx` + integration in `app/workout-guidance.tsx`)** — single-line dismissible banner: "Listen to your body. Stop if you feel pain or dizziness." Renders ABOVE the workout Start button. Module-level `SESSION_SHOWN` flag ensures it shows ONCE per cold-start app session (not per workout). Non-blocking, no modal. Dismissable via X. Test-only `__resetSessionSafetyBannerForTesting()` escape hatch exposed.
    5. **Privacy Policy + Terms of Service routes** — `/privacy-policy` (614 lines) and `/terms-of-service` (395 lines) already exist and already cover every spec bullet (mood/energy data, workout history, account info, 3rd-party services, retention + 30-day deletion, access/deletion/portability rights, under-13 prohibition, contact email; assumption of risk, not-medical-advice, physically-able representation, account termination, subscription terms placeholder, governing law). **No content rewrite needed.**
  - **Explicit scope guards honored** — no separate disclaimer screen added, no PAR-Q questionnaire, no ATT prompt, no blocking flow outside the signup checkbox. Zero touches to workout generation, algorithm, achievements, emblems, or carousel logic.

- [2026-05-14] **P0 / P1a / P1b / P1c cleanup pass — hero resolver extraction + StoreKit receipt sync + unlimited generations + expo-video migration:**
  - **P0 — Featured hero image resolver extracted** (`utils/featuredHeroImage.ts`):
    - Pure function `resolveFeaturedHeroImage(workout, exercises)` replaces the inline `workout.image || exercises[0]?.imageUrl` expression that had silently regressed across previous sessions.
    - Treats whitespace-only / null / empty strings as missing (prevents the broken-image flash when seed data is dirty).
    - Returns `undefined` (NOT empty string) when both sources are missing so the underlying `<Image>` placeholder shows cleanly.
    - Companion helper `isFeaturedHeroFallback()` for telemetry/dev warnings.
    - **Unit tests** `utils/featuredHeroImage.test.ts` — **7/7 PASS** via `yarn test:featured-hero` (covers priority, fallback, whitespace, null workout, empty exercises, missing first-exercise URL).
    - `app/featured-workout-detail.tsx` now imports and calls the resolver in the hero `<Image>` source. Backend pytest unchanged, no API surface impact.
  - **P1a — StoreKit receipt sync in `GET /api/auth/me`** (`backend/server.py`):
    - Response now includes `subscription_status` / `subscription_plan` / `subscription_product_id` / `subscription_expiration_date` mirrored from the persisted `subscription` sub-doc (set by `/subscription/validate` and the Apple S2S webhook).
    - Self-corrects stale `'active'` → `'lapsed'` when the stored `expiration_date` is in the past — prevents the client from showing entitlement while waiting for Apple's S2S webhook after a lapse.
    - Frontend `User` interface (AuthContext) gained the 4 new fields. `FoundingMemberGate` adds a second `useEffect` that mirrors `subscription_status` → `SubscriptionContext.setStatus()` on every auth load (founding members still take precedence). Handles the reinstall edge case where AsyncStorage is wiped but the Apple receipt is still valid.
    - **Backend tests** `backend/tests/test_subscription_status_sync.py` — **7/7 PASS** (new-user defaults to null, active/in_trial/lapsed mirroring, stale-expiration self-correction, founding-member coexistence, auth gate unchanged at 401/403).
  - **P1b — Unlimited free generations** (`contexts/SubscriptionContext.tsx`):
    - `FREE_GENERATION_CAP` flipped from `3` → `Number.POSITIVE_INFINITY` per product decision. `canGenerate` derived flag is now always true for free users; `ChooseForMeButton` will never fire the `generate_after_cap` paywall trigger.
    - Counter + `recordGeneration()` left in place so the cap can be re-introduced without touching call sites (clean A/B test path).
    - Live workout session start remains gated by `hasUsedFreeSession` — i.e. free users can generate as many workouts as they want but still hit the paywall after their first completed live session, matching the v1.0 monetization model the user verbally confirmed.
  - **P1c — `expo-av` → `expo-video` migration for `SmartVideoPlayer.tsx`** (`components/SmartVideoPlayer.tsx`):
    - Installed `expo-video@^3.0.16` alongside the existing `expo-av` (which remains for create-post, index, ExerciseLookupSheet, VideoFrameSelector — those are separate migration tickets).
    - Rewrote the player with the new declarative API: `useVideoPlayer(source, setup)` returns a player handle, `<VideoView player={player} contentFit="cover" />` renders it. Replaced imperative `videoRef.unloadAsync()` retry with key-bump-driven player recreation.
    - Status + playback events wired via `useEventListener(player, 'statusChange'|'playingChange', ...)` updating local state (cleaner than the old `onPlaybackStatusUpdate` callback chain).
    - Behavior preserved end-to-end: thumbnail-first render, HLS-on-iOS with MP4 fallback, pause+mute when off-center / inactive / backgrounded, 10s load timeout with 3-retry chain, mute toggle, progress bar.
    - `tsc --noEmit` clean for SmartVideoPlayer + all consumer files. Cannot fully test in the Linux pod (Expo Go won't reliably exercise the native video session) — needs TestFlight verification.

- [2026-05-14] **Paid Launch — Phase C: StoreKit 2 native module + backend reconciliation (Part 8) — end-to-end paid flow live.**
  - **`modules/mood-storekit/`** — full Expo native module, mirroring the `mood-healthkit` template:
    - `MoodStoreKitModule.swift` exposes `getProducts(ids)`, `purchase(productID)`, `restorePurchases()`, `currentEntitlements()`, plus a long-running `Transaction.updates` listener that fires `onTransactionUpdate` events to JS for renewals, family-share, ask-to-buy approvals, and most importantly the **day-7 trial-to-paid conversion** that happens server-side on Apple's side.
    - `src/index.ts` typed JS bridge — `getProducts`, `purchase`, `restorePurchases`, `currentEntitlements`, `onTransactionUpdate`, plus pinned product IDs (`MONTHLY_PRODUCT_ID = 'mood_premium_monthly'`, `YEARLY_PRODUCT_ID = 'mood_premium_yearly'` per your provisioning).
    - `MoodStoreKit.podspec` links `StoreKit` framework, targets iOS 16+, Swift 5.9.
    - `requireOptionalNativeModule` pattern means web preview / Expo Go / Android get a clean no-op fallback — `PaywallModal` checks `isStoreKitAvailable()` and falls through to the optimistic local flip for non-iOS QA surfaces.
  - **Backend reconciliation** (`server.py`):
    - `POST /api/subscription/validate` — client posts the verified signed JWS from `Product.purchase()`. Backend persists `subscription.status / plan / product_id / transaction_id / original_transaction_id / purchase_date / expiration_date`, reads the previously-stored `subscription.last_trigger_source`, inserts `subscription_purchased` into `analytics_events` with that attribution, then `$unset`s the trigger so a future paywall fires fresh attribution. Curl-verified live (`401` on bogus token, correct auth gating).
    - `POST /api/subscription/webhooks/apple` — App Store Server Notifications V2 entry point. Accepts `signedPayload`, logs to `apple_webhook_events` collection, returns 200 fast. Curl-verified (`200` on test post — visible in backend logs as `📩 Apple S2S notification received`). Full JWS verification + state-machine handling is a follow-up ticket needing Apple's root cert chain.
  - **`PaywallModal` real integration** — replaced the stub. `handleStartTrial` now: `storeKitPurchase(productID)` → on `success` POST `/subscription/validate` (server-side conversion event with attribution) → fire client `subscription_purchased` analytics (redundancy for client-side funnel tools) → `clearConversionTrigger()` → flip local status. Cancel/pending paths keep the paywall mounted for retry. `handleRestore` calls `storeKitRestore()` and promotes to `active` on a non-empty entitlements result.
  - **End-to-end funnel attribution loop closed**: `paywall_viewed` (record-trigger fires) → `trial_started` (client + trigger source) → `subscription_purchased` (both client AND server, both with the same `trigger_source` pulled from the persisted user record). Apple's day-7 trial-to-paid charge will fire `onTransactionUpdate` to JS AND the Apple S2S webhook to backend; either path catches the conversion with attribution intact.
  - **NOT yet activated**: requires an EAS Build to TestFlight to actually hit the native StoreKit flow. The pod / web preview can't test purchases — the optimistic-flip fallback covers QA there.

 Two unlocks: one for post-launch analytics, one for the new-user experience.
  - **`utils/posthogProvider.ts`** — drop-in `AnalyticsProvider` ready to register the moment the project key arrives. Uses dynamic `require()` so missing `posthog-react-native` doesn't crash the bundle (becomes a silent no-op until installed). Stitches guest→authenticated identity automatically via `identify(token)` on the first authenticated event after a session start. Activation = 4 lines: `yarn add posthog-react-native`, add `EXPO_PUBLIC_POSTHOG_KEY` to `.env`, `import { registerPostHogProvider } from '../utils/posthogProvider'` + `registerPostHogProvider()` once in `_layout.tsx`. **None of the 100+ `Analytics.foo()` call sites change.** Because the trigger-source attribution loop is already wired through to `subscription_purchased`, the PostHog conversion funnel dashboard lights up the day this is enabled.
  - **`components/FunnelEntryGate.tsx`** — the missing entry-point. `AuthContext.register()` now sets a `@mood_needs_funnel` AsyncStorage flag immediately after a successful registration. `<FunnelEntryGate />` mounts at root, watches for the flag, and routes the user to `/onboarding-funnel/step-1-mood` exactly once via `router.replace()` (so the funnel becomes the back-stack root). Latched via `useRef` so react-strict-mode double-mounts can't fire it twice. Founding members still get the funnel teach-moment (per spec — it's not a paywall trigger). Existing/returning logins skip the funnel entirely because the flag is only set during `register()`.
  - The dev `[dev] Skip to onboarding funnel →` button on the landing page is preserved for TestFlight demos.


  - **Phase E — Settings → Subscription section** (`app/settings.tsx`):
    - Status row reflects `SubscriptionContext.status`: `'Not subscribed'`, `'Free trial active'`, `'MOOD Premium'`, `'Subscription lapsed'`, `'Founding Member'`, each with a brand-aligned subtitle. Founding members get "Day-one MOOD. Lifetime access.".
    - "Manage in App Store" row (paying members only — Founding members hidden since they have no Apple subscription) deep-links to `https://apps.apple.com/account/subscriptions`.
    - "Start 7-day free trial" row (non-paying members) opens the paywall with `settings_subscribe` trigger source — flows through the same attribution loop as the in-app gates.
    - "Restore Purchases" row fires `settings_restore_purchases_tapped` analytics; Phase C wires the actual `Transaction.currentEntitlements` flow.
    - Delete Account already exists per user — left untouched.
  - **Phase G — Analytics provider abstraction** (`utils/analyticsProvider.ts`):
    - Pluggable `AnalyticsProvider` interface: `id`, optional `init()`, required `track(event, props, ctx)`. Failures are swallowed at both the provider and dispatcher level so a broken SDK can never crash the app or block other providers.
    - `registerProvider(p)` / `unregisterProvider(id)` / `dispatch(event, props, ctx)` / `listProviders()`.
    - **Zero-cost migration path**: existing `trackEvent()` + `trackGuestEvent()` now ALSO call `dispatch()` after their backend POST. Today no providers are registered → fan-out is a no-op. To wire PostHog/Segment/Amplitude later: import the provider, call `registerProvider(p)` once at boot. **No call-site changes**. The 100+ `Analytics.foo()` invocations stay exactly as they are.
    - This is precisely what was requested earlier: "scaffold a typed track(event, props) wrapper for now and keep the analytics provider abstracted so we can wire PostHog, Segment, or a custom /api/analytics endpoint later without refactoring the app."

 The remaining Phase B gate + the funnel-attribution loop closed end-to-end across the day-7 trial-to-paid boundary.
  - **Generation cap (Part 5) — single chokepoint**: rather than hunting every `*-workout-display.tsx`, wired the guard directly into `components/ChooseForMeButton.tsx` (the shared "Build For Me" component used by all 6 mood entry routes — `lazy-training-type`, `outdoor-equipment`, `calisthenics-equipment`, `explosiveness-type`, `body-parts`, `workout-type`). Press handler now reads `useSubscription()`:
    - Active access (founding/in-trial/active) → straight through.
    - `canGenerate === false` → `openPaywall('generate_after_cap')` + analytics `workout_generated` event with `generation_index: -1` (rejected sentinel).
    - Otherwise → `recordGeneration()` (idempotent counter bump) + `workout_generated` analytics + original `onPress`.
    - New `bypassFreeTierGuard` prop for the onboarding teach moment (Step 2) where Build For Me is shown but no generation is consumed.
  - **Server-side trigger-source attribution (small wire change)**:
    - `POST /api/subscription/record-trigger` shipped. Persists `subscription.last_trigger_source / last_trigger_plan / last_trigger_at` to the user record. Verified via curl (401 on bogus token).
    - `PaywallModal` fires this endpoint (fire-and-forget) the moment it mounts with a fresh trigger. Silent failure: the local `lastConversionTrigger` is still authoritative for client-side analytics; server recovers on the next paywall open.
    - **Why this closes the loop**: Apple's day-7 trial-to-paid charge fires a server-to-server `SUBSCRIBED` / `DID_CHANGE_RENEWAL_STATUS` notification — NOT from the client. The Phase C StoreKit webhook handler reads `subscription.last_trigger_source` from this record and stamps the `subscription_purchased` event with the original paywall attribution. Net result: `paywall_viewed` → `trial_started` → `subscription_purchased` all carry the SAME `trigger_source` even though the final event fires 7 days later from a different process.


  - **Backend** (`server.py`):
    - `FOUNDING_MEMBER_CUTOFF = datetime(2026, 5, 15, 0, 0, 0, tzinfo=timezone.utc)` per Wes.
    - Startup migration flips `founding_member = true` + `founding_member_at = cutoff` for every user with `created_at < cutoff` whose flag isn't already set. **Already ran in preview — 103 accounts flipped on first run**, second run is `nothing to do` (idempotent ✅).
    - `UserResponse` model gains `founding_member`, `founding_member_at`, `founding_member_modal_seen` (all default false / None).
    - `GET /api/auth/me` now returns the 3 founding fields.
    - `POST /api/auth/founding-member/mark-seen` — idempotent flag flip, no-op for non-founding accounts. Verified via curl (401 on bogus token).
  - **Frontend gates**:
    - `contexts/AuthContext.tsx`: `User` interface gains the 3 founding fields.
    - `components/FoundingMemberGate.tsx` (mounted at root): on auth load, flips `SubscriptionContext.status` → `'founding_member'` so every paywall gate short-circuits. If `founding_member_modal_seen` is still false, shows the celebration modal exactly once, then `POST /mark-seen` + optimistic `updateUser`.
    - `components/FoundingMemberBadge.tsx`: small gold pill ("FOUNDING MEMBER" + lifetime star icon) with optional "Day-one MOOD." caption. Mounted into `app/(tabs)/profile.tsx` below the bio.
  - **Phase B gate wiring**:
    - `app/workout-guidance.tsx` (the session-start chokepoint, NOT `workout-session.tsx`): `handleStartPauseTimer` now checks `canStartWorkout` before kicking off a session. Free users without active access get redirected to the paywall via `openPaywall('start_workout_after_free_session')`. Allowed users get `recordStartFreeWorkout()` (idempotent) and the `start_workout_tapped` event fires with `allowed: true`.
    - `app/create-post.tsx` (the recap screen): free-session footer block "YOUR FREE SESSION IS COMPLETE / Next workout requires MOOD Premium. / Start 7-day free trial → / Maybe later" renders only when `workoutStats` is present AND `!hasActiveAccess` AND `hasUsedFreeSession`. Trial CTA fires the paywall with `recap_footer_cta` trigger.
  - **Trigger-source attribution (the user-requested polish)**:
    - `SubscriptionState` gains `lastConversionTrigger`. Set when `openPaywall(trigger)` fires. Persisted to AsyncStorage so it survives app backgrounding mid-conversion.
    - `subscription_purchased` analytics event signature widened to accept optional `trigger_source`. Phase C's real StoreKit purchase flow will tag the event with `lastConversionTrigger` then call `clearConversionTrigger()`. This means `paywall_viewed` → `trial_started` → `subscription_purchased` all carry the SAME attribution token end-to-end — direct PostHog/Segment funnel.
  - **New analytics events** (Phase D): `founding_member_modal_shown`, `founding_member_modal_dismissed`.
  - **Generation cap (Part 5) — STILL NOT WIRED**: deferred again because generation entry points are route-distributed across many `*-workout-display.tsx` files. Wiring it well needs a focused scan — flagged as the next ticket below.

- [2026-05-13] **Paid Launch — Phase B Foundation: Subscription State + Paywall Modal (Parts 5 & 7)** — free-tier mechanics state machine + production-ready paywall modal, plumbed into the root layout. **Wiring** of `canGenerate` / `canStartWorkout` into the actual generation + workout-session entry points is the next ticket (intentionally separated — touches many screens, needs a focused review).
  - **`contexts/SubscriptionContext.tsx`** — typed state machine:
    - `status: 'none' | 'in_trial' | 'active' | 'lapsed' | 'founding_member'`
    - `hasUsedFreeSession: boolean` (set true on free workout start, idempotent)
    - `freeGenerationsUsed: number` (cap `FREE_GENERATION_CAP = 3`)
    - Derived `hasActiveAccess`, `canGenerate`, `canStartWorkout` flags. Founding Member status short-circuits every gate.
    - Imperative API: `openPaywall(trigger)`, `dismissPaywall()`, `recordGeneration()`, `recordStartFreeWorkout()`, `setStatus()`.
    - `PaywallTrigger` enum: `start_workout_after_free_session`, `generate_after_cap`, `recap_footer_cta`, `locked_premium_feature`, `settings_subscribe`, `unknown`.
    - Persisted to `@mood_subscription_state_v1` AsyncStorage with rehydrate-on-mount. Phase C will replace persistence with StoreKit 2 transaction observers — the consumer API stays stable.
  - **`components/PaywallModal.tsx`** — mounted once near root, listens to `pendingTrigger`:
    - Visual frame mirrors `GuestPromptModal.tsx` (slide-up bottom sheet, `#1a1a1a` surface, close button top-right, gold→orange CTA, link row).
    - Headline adapts to trigger source (`"You hit your free limit."`, `"Next workout, on Premium."`, `"Train how you feel."`).
    - 5 value bullets per spec.
    - Annual / Monthly plan cards, annual selected by default with "Save 34%" badge.
    - Apple required subscription disclosure rendered verbatim.
    - Privacy · Terms · Restore Purchases link row + "Manage subscription in App Store" deep-link (opens `apps.apple.com/account/subscriptions`).
    - **`handleStartTrial` is a stub** that flips status to `in_trial` locally — Phase C replaces it with real StoreKit purchase flow.
  - **Analytics events** added: `paywall_viewed`, `trial_started`, `trial_cancelled`, `subscription_purchased`, `subscription_restored`, `subscription_lapsed`, `workout_generated`, `start_workout_tapped`. Dual-pipeline (auth + guest).
  - **Root layout** wired: `SubscriptionProvider` nested inside `OnboardingFunnelProvider`, `<PaywallModal />` mounted alongside `<FloatingCart />`.
  - **Dev-only landing helpers** (Metro strips when `__DEV__` is false):
    - "[dev] Skip to onboarding funnel →" pill (Phase A).
    - "[dev] paywall (status): start | gen-cap | recap" trigger row — lets us QA all 3 trigger variants without walking the free flow. Useful for TestFlight demo.
  - **Smoke test**: paywall renders correctly via dev trigger — gold lock ring, dynamic headline, plan cards, disclosure, link row, all on dark `#0A0A0A`. Screenshot verified at mobile viewport. `tsc --noEmit` zero new errors.
  - **NOT yet wired into generation/start screens** (next ticket): `Build For Me` / `Generate Again` CTAs need to call `canGenerate → openPaywall('generate_after_cap')`; `workout-session.tsx` start-of-session check needs `canStartWorkout → openPaywall('start_workout_after_free_session')`; recap screen footer needs the "YOUR FREE SESSION IS COMPLETE" / "Start 7-day free trial →" block.

- [2026-05-13] **Paid Launch — Phase A: Onboarding Funnel + Reveal (Parts 1–3 of the v1.0 paid launch spec)** — 11-screen forward-only funnel with personalized cinematic reveal.
  - **Brand single source of truth** (`constants/brand.ts`): `COLORS`, `BRAND_GRADIENT = ['#FFD700', '#FFA500']` (gold→orange from the MOOD landing wordmark), `FUNNEL_TOTAL_STEPS = 8`. Final accent hex can swap here without touching screens.
  - **Funnel state** (`contexts/OnboardingFunnelContext.tsx`): typed `FunnelAnswers` + per-step timing tracker. Persisted to AsyncStorage, rehydrated on mount. Provider added to root `_layout.tsx`.
  - **Shared chrome**: `components/onboarding/FunnelLayout.tsx` (animated brand-gradient progress bar, "Step X / 8", gated Continue CTA); `components/onboarding/OptionPill.tsx`.
  - **8 forward-only screens** under `app/onboarding-funnel/`: step-1-mood (6 cards w/ mood gradients), step-2-build-for-me (teach moment, 3 BFM chips + slide-up preview per mood), step-3-goal, step-4-level, step-5-barrier, step-6-length, step-7-equipment, step-8-social-proof (4.8★ + athlete count; count placeholder, NOT faked).
  - **Reveal sequence**: `reveal-loading.tsx` (3 personalized lines fade in/out ~2.5s each + slow brand-gradient pulse, no spinners) → `reveal-payoff.tsx` (cinematic hero, `[FirstName], built for you.`, 3 preview cards, "Start your first workout →" CTA → existing `/onboarding/medical-disclaimer` chain).
  - **Analytics events** added: `onboarding_step_viewed/completed/abandoned`, `onboarding_completed`, `reveal_screen_viewed`, `reveal_cta_tapped`, `medical_disclaimer_accepted`. Dual-pipeline (auth + guest).
  - **Stack registration**: `onboarding-funnel` group registered in root `_layout.tsx` with `gestureEnabled: false`.
  - **Pre-existing bug fix**: orphaned `});` at `app/settings.tsx:1342` that split a StyleSheet was blocking the entire Metro bundle. Merged + removed duplicate keys.
  - **Smoke test**: bundler succeeds; mobile-viewport screenshot of `/onboarding-funnel/step-1-mood` renders cleanly with all expected elements.
  - **DEFERRED to subsequent sessions**: Phase B free-tier + paywall (Parts 5, 7), Phase C StoreKit 2 (Part 8), Phase D Founding Members + 5/15/2026 cutoff migration (Part 9), Phase E lapsed routing + Settings/Delete-Account (Parts 10, 11), Phase F Skia chart migration (Part 6), Phase G analytics provider wrapper + mock biometric provider (Parts 12, 13), Phase H EAS Build → TestFlight. Funnel currently reachable only via direct URL — entry wiring is Phase B's job (depends on gating logic).

## What's Been Implemented (older)
 + Shareable Recap (iOS)** — add-on to the HealthKit foundation:
  - **Native module additions** (`modules/mood-healthkit/ios/MoodHealthKitModule.swift`): added `heartRate` to read permissions, plus two new async functions `startHeartRateStream()` / `stopHeartRateStream()` backed by an `HKAnchoredObjectQuery` with `updateHandler`. Each new sample fires an `onHeartRateSample` event (`{ bpm, timestamp }`) to JS. Multiple start calls replace the in-flight query (idempotent).
  - **Config plugin updated** to the v2 usage string: *"MOOD reads your heart rate, HRV, sleep, and activity to personalize workouts and track your live heart rate during sessions."*
  - **JS bridge** (`modules/mood-healthkit/src/index.ts`): `subscribeHeartRateStream(listener)` returns `{ remove }` that both unsubscribes the listener AND stops the native query — single call to clean everything up.
  - **Live capture** (`app/workout-session.tsx`): starts the stream when the session screen mounts (subject to permission), accumulates samples in a `useRef` (avoids re-render storms across 60+ min sessions), tears down on unmount AND on `handleFinishSession`. After 30s of zero samples we surface a one-shot, non-blocking toast: *"Wear your Apple Watch to track heart rate"*. Workout flow is never blocked.
  - **Data model + persistence** (`utils/workoutSessionStorage.ts`): `WorkoutSession { id, startedAt, endedAt, workoutType, heartRateSamples, stats }` persisted via AsyncStorage (same tier as `BiometricSnapshot`); last 20 sessions kept (~36KB cap per 60-min session). Includes `loadUserAge` / `saveUserAge`.
  - **Zone math** (`utils/heartRateZones.ts`): `computeHeartRateStats(samples, age)` produces `{ avgHR, maxHR, minHR, timeInZones[5], ageDerivedMaxHR }` using the conventional 50/60/70/80/90% bands off `220 − age`. Each gap between adjacent samples is credited to the earlier sample's zone; pathological gaps clamped to 60s. Unit tests **9/9 PASS** (`yarn node --import tsx --test utils/heartRateZones.test.ts`).
  - **Chart wiring** (`components/WorkoutStatsCard.tsx`, 'heartrate' variant): added optional `heartRateSamples` + `heartRateRealStats` props. When non-empty, the existing cubic-bezier SVG curve renders the real Apple Watch samples (and the avg/peak header pills show real numbers) instead of the deterministic synth fallback. All three call-sites in `create-post.tsx` (preview carousel, hidden opaque mirror, hidden transparent IG-export) receive the same payload, so the shared overlay always matches what the user saw on screen.
  - **Settings — Age input**: one-time `Alert.prompt` row inside the Health Data section (iOS-only, gated by `healthAvailable`). Stored locally, used only on-device to compute zones.
  - **Analytics** (`utils/analytics.ts`): 7 new events — `workout_session_started`, `workout_session_ended`, `hr_samples_captured_count`, `workout_recap_viewed`, `share_to_instagram_tapped`, `share_to_camera_roll_tapped`, `share_completed`. The first six are wired and fire from real call-sites; **`share_to_camera_roll_tapped` is exported but unfired** because no dedicated "Save to Camera Roll" button exists in the current UI (IG-share saves to Photos as a side effect of the URL-scheme handoff but that's not a user-initiated camera-roll intent). Add a button to the create-post action bar in a follow-up if you want the metric live.
  - **Out of scope per spec (NOT built)**: WatchOS companion app, video overlay, in-app photo composer, HR zone audio cues, real-time coaching during workout, backfilling chart from past workouts, sharing to platforms beyond Instagram + camera roll.
  - **TestFlight demo**: start workout with Apple Watch on, do 5 min of any activity, end workout → recap screen shows real HR curve → tap Share to Instagram → overlay lands in IG Stories.

- [2026-02-13] **HealthKit integration (Apple Health, read-only)** — Swift native module + Expo config plugin + RN UI:
  - **Native module `modules/mood-healthkit/`**: Swift `MoodHealthKitModule` (iOS 16+, Expo Modules API) exposing exactly two JS-facing async functions — `requestPermissions()` (triggers native HealthKit sheet) and `fetchSnapshot()` (reads 5 metrics: restingHeartRate, heartRateVariabilitySDNN, sleepAnalysis asleep-duration last night, activeEnergyBurned yesterday total, stepCount yesterday total). Plus `getAuthorizationStatus()` helper.
  - **Config plugin `plugins/withMoodHealthKit.js`**: injects `com.apple.developer.healthkit` entitlement and `NSHealthShareUsageDescription = "MOOD reads your heart rate, HRV, sleep, and activity to personalize workouts based on your recovery."`. Registered in `app.json`.
  - **RN context `contexts/HealthContext.tsx`**: persists last snapshot to AsyncStorage, refreshes on app foreground + on indicator tap, fails silently if permissions denied. Snapshot is intentionally NOT yet fed into workout generation (separate ticket per spec).
  - **3-screen onboarding flow** (`app/onboarding/medical-disclaimer.tsx` → `health-intro.tsx` → `health-connect.tsx`), gated by `components/HealthOnboardingGate.tsx` (routes authenticated users to disclaimer on first session). Medical disclaimer text mirrored into Terms of Service.
  - **Sync indicator** (`components/HealthSyncIndicator.tsx`): single-line "Synced 2m ago", opacity 0.55, monochrome, no emoji/badges. Tap → silent refresh with 0.8s opacity dip. Hidden entirely when permission isn't granted. Relative time ticks every 60s.
  - **Settings screen "Health Data" section**: deep-links to iOS Settings if already granted, else triggers connect flow. Footer reminds users MOOD never writes/sells/shares health data.
  - **Analytics**: 5 new events (`health_permission_prompted`, `health_permission_granted`, `health_permission_denied`, `health_snapshot_refreshed`, `settings_health_row_tapped`) wired through existing `Analytics` namespace in `utils/analytics.ts`.
  - **Unit tests** (`utils/healthSyncFormat.test.ts` — 9/9 PASS): relative-time formatter ("just now", "1m ago", "12m ago", "2h ago", "3d ago", null/garbage handling, future-time clamping).
  - **Out of scope (NOT built)**: snapshot → workout generation injection, paid tier, subscriptions, account system, Whoop/Oura/Garmin APIs, Android, HealthKit write-back, trend charts.
  - **Delivery path**: EAS Build → TestFlight. The HealthKit native module CANNOT run in Expo Go or in this Linux pod — needs a custom dev client / TestFlight build and a real iPhone (ideally paired with an Apple Watch for HRV / resting HR data).

## What's Been Implemented
- [2026-05-12 PM2] **In-session progress bar — exercise tracking + expandable detail panel**:
  - **New component `frontend/components/InSessionProgressBar.tsx`**: horizontal scrollable bar of equipment icons (one per session exercise), max ~4 visible at once, auto-scrolls on `currentIndex` change to keep the active step pinned at position-2 of 4 (clamped at start/end). Three icon states: active (gold gradient + equipment Ionicon), completed (dim gold + checkmark), upcoming (outlined). Chevron strip with tap + swipe-down PanResponder expands a detail panel showing equipment / workout title / first-1–2-sentence description snippet for the CURRENT exercise only. Default collapsed.
  - **Pure helpers `frontend/utils/inSessionProgress.ts`**: `getEquipmentIcon()` with exact-match + fuzzy-contains fallback over 30+ equipment names (Kettlebells, Dumbbells, Battle Ropes, Sled, Hills, …), `getDescriptionSnippet()` returns first 1–2 sentences with whitespace collapsing and a 140-char truncation fallback.
  - **Scoped integration** in `app/workout-guidance.tsx`: branches on `isSession && sessionWorkouts.length > 0`. Pre-session/preview screens still render the original 4-step mood/type/equipment/intensity metadata bar — no regressions to equipment selection, workout selection, or onboarding flows.
  - **Unit tests** (`utils/inSessionProgress.test.ts` — 8/8 PASS via `yarn test:in-session-progress`): description snippet branches (empty, multi-sentence, single sentence, truncation, whitespace), equipment icon resolution (exact, fuzzy, unknown).

- [2026-05-11 PM4] **Saved Builds — persistent in-progress workout drafts** (BACKEND 15/15 TESTS PASS):
  - **New collection `workout_drafts`** with full lifecycle (`in_progress` → `ready_to_start` → `started` → `completed`, plus `abandoned` and `expired`). 30-day TTL, 30-min auto-abandon, cap of 20 active drafts per identity (auto-prune oldest non-pinned), pin cap of 3.
  - **Backend** (`backend/workout_drafts.py` — modular APIRouter wired into `server.py` at `/api/workout-drafts`): `POST` create, `GET` list (excludes completed by default), `GET /count` (for badge), `GET /{id}` (bumps last_viewed_at), `PATCH /{id}` (status transitions + pin), `DELETE /{id}`, `POST /merge` (guest device_id → authed user). Identity isolation by `user_id` (authed) or `device_id` (guest). Indexes: `(user_id, status, last_modified_at)`, `(device_id, user_id, status)`, `(expires_at)`.
  - **Frontend `contexts/DraftsContext.tsx`**: 500ms debounced auto-save snapshotting `cartItems → generated_workout`; mood-flavored creative titles ("Iron Blueprint · Legs", "Furnace Plan", "Power Map"); auto guest-to-user merge on first token transition; `markReady`/`markStarted`/`markCompleted` lifecycle helpers; `resumeDraft` rehydrates the cart and routes to `resume_route`.
  - **New screen `app/saved-builds.tsx`**: list with pinned section, status pills ("Ready to start", "In progress — N of M steps", "In session", "Paused"), mood-tinted thumbnails (uses first exercise image or mood-colored icon fallback), swipe-to-delete, long-press to pin/unpin, empty state CTA "Pick a MOOD". Stale modal (>7 days since created) with [Use this] / [Start fresh] choices.
  - **Profile entry point** (`app/(tabs)/profile.tsx` saved tab): "Saved Builds" row with gold badge of active count, visible only when ≥1 active draft.
  - **Cart screen lifecycle hook** (`app/cart.tsx`): on first mount with items, creates draft if none attached and sets status to `ready_to_start`. "Begin Workout" tap → `markStarted`.
  - **Workout-session completion hook** (`app/workout-session.tsx`): workout finish → `markCompleted` (clears `currentDraftId`).
  - **Auto-prune verified** with API-driven test (insert 22 active drafts; assert ≤20 remain after pruning).
  - **Guest → user merge verified**: create guest draft, register user, POST `/api/workout-drafts/merge {device_id}`, authed list now contains the merged draft.
  - **Tests**: `backend/tests/test_workout_drafts.py` — 15/15 PASS (CRUD, identity isolation, status transitions, invalid status, pin cap, count endpoint, count excludes completed, snapshot persistence across status changes, last_viewed_at bump, overflow prune, 30-min auto-abandon, guest→user merge).

## What's Been Implemented
- [2026-05-11 PM3] **Featured Workouts v2 — 6 picks + universal cart sub-path dividers** (BACKEND 13/13 TESTS PASS):
  - **Carousel rebuilt** (`backend/seed_data.py`): 6 new featured workouts replace the prior 6. Auto-seed detected the title diff on restart, deleted the old set, and re-inserted the new ones with fresh ObjectIds. New picks: `Sweat - Engine Builder`, `Outdoor - Park to Peak`, `Calisthenics - Bar to Floor`, `MOOD Mix - Air & Abs`, `Build Explosion - Triple Threat`, `Muscle Gainer - Push Day Pump`. Each entry includes a `hook` field (TikTok-caption-style one-liner) and Triple Threat gets `cartSizeOverride: 3`.
  - **Per-exercise `workoutType` drives sub-path dividers**: each exercise is tagged with a sub-path key like `Sweat - Cardio Based`, `Build Explosion - Body Weight`, `Muscle Gainer - Chest`, `Outdoor - Hills`, etc. The cart and featured-workout-detail screens render a labelled divider whenever the sub-path changes between consecutive items — including cross-mood combinations (MOOD Mix - Air & Abs renders `BUILD EXPLOSION - BODY WEIGHT` → `MUSCLE GAINER - ABS`).
  - **Cart divider helper generalised** (`app/cart.tsx`): replaced muscle-gainer-only `getMuscleGainerGroup` with `getCartSubPathLabel` — handles legacy muscle-gainer items (`"Muscle Building - <Muscle>"` and bare muscle names → `"Muscle Gainer - <Muscle>"`) and the new generic `workoutType` strings everywhere else. Divider chip styling (testID `cart-subpath-divider-<slug>`) unchanged.
  - **Featured workout detail dividers** (`app/featured-workout-detail.tsx`): added `getExerciseSubPathLabel` + render-time divider chip (testID `featured-subpath-divider-<slug>`). Visual parity with cart dividers (hairline lines + uppercase letter-spaced label).
  - **Profile saved-workout nav fixed** (`app/(tabs)/profile.tsx`): prefers `savedWorkout.featured_workout_id` (MongoDB ObjectId) when present, falls back to the legacy name → numeric-ID dict only for older records. New featured workouts saved via `handleSaveFeaturedWorkout` now route through the API path directly.
  - **Images**: 5 user-provided hero images applied (Engine Builder, Park to Peak, MOOD Mix, Triple Threat, Push Day Pump). Calisthenics - Bar to Floor uses a legacy placeholder pending user-provided asset.
  - **Verified**: backend pytest suite `test_featured_workouts_v2.py` 13/13 pass; `/api/featured/bundle` curl-confirms all 6 titles + correct `workoutType` tags per exercise; auto-seed logs show "Auto-seeded 6 featured workouts" after restart. Frontend bundles cleanly via Metro.


  - **Root cause**: previous Tip 2 implementations used an inline `position: absolute` View. On native iOS in Expo Go this was being clipped/hidden by SafeAreaView / parent layouts / scroll containers, so it never appeared even though it rendered on web.
  - **Fix**: rewrote Tip 2 to render via `<OnboardingOverlay>` — the exact component that ships Tip 3 reliably. Renders inside a `<Modal transparent statusBarTranslucent>` which is always on top of everything on native and immune to scroll/clipping/zIndex issues.
  - **One target**: `searchBarRef` is attached to a `<View>` wrapper around `ExerciseLookupTrigger` (with `collapsable={false}`). On screen mount, after 1.5s, `measureInWindow` writes the rect into state and the overlay renders with `placement: 'below'`, drawing a gold curved arrow line + arrowhead that lands at the search bar's center.
  - **Visual parity with Tip 3**: identical semi-transparent black backdrop, identical label card style, identical "Tap anywhere to dismiss" hint, identical "Don't show again" pill at the bottom.
  - **Persistence**: AsyncStorage flag `mood:tip:form_videos:never` only set when user explicitly taps "Don't show again". Tap anywhere on the backdrop just opens the visual exercise sheet (treats it as a CTA, consistent with how Tip 3 chips work).
  - **Verified by screenshot** (`/tmp/tip2_overlay.png`) — registered a fresh test user, navigated to `/workout-session` with mock workout data, waited 1.5s. The DOM contains: `Need a form check` ✓, `Tap the visual cues search` ✓, `Tap anywhere to dismiss` ✓, `Don't show again` ✓. Bundle (15.85 MB) contains `play-circle-outline` ×4 and the new body copy ×1.

## What's Been Implemented
- [2026-05-11 PM] **Onboarding iteration 6 — Tip 2 AsyncStorage rewrite + Tip 3 "Add your media" above media row** (PROVEN with screenshot):
  - **Tip 2 decoupled from server `tips_state`** (`app/workout-session.tsx`): the old gating on `onboarding.requestRender('form_videos')` relied on the user's prod `tips_state.form_videos` being `'unseen'`. Many users had it cached as `completed` from earlier sessions on the prod backend, so the popup never showed. Switched to a single AsyncStorage flag `mood:tip:form_videos:never` — Tip 2 now fires 1.5s after the screen mounts every time, **unless** the user explicitly tapped "Don't show again". X dismiss just closes the current instance; tapping the card opens the visual exercise sheet. Removed unused `useOnboarding` import.
  - **Tip 3 — "Add your media" repositioned**: `placement: 'below'` → `placement: 'above'`. The card now sits at the TOP of the screen (in the empty space above the media row) instead of overlapping the IG callout in the middle. Arrow still points DOWN at the media section.
  - **Verified by screenshot**: navigated a freshly-registered test user to a `/workout-session?sessionWorkouts=…` URL with mock workout data. After 1.5s the "Need a form check?" popup rendered at the bottom of the Battle Plan screen, above the visible "Find visuals" search bar. DOM check confirms `formTipFloatingWrap` + title text. Metro bundle (15.8 MB) contains the new keys: `mood:tip:form_videos:never` ×1, `Need a form check` ×1, `placement: 'above'` ×2, `placement: 'below'` ×1.
  - **Carryover**: backend backfill v3 (97 users) still relevant for Tip 3; Tip 2 no longer depends on it.

## What's Been Implemented
- [2026-05-11] **Onboarding iteration 5 — Tip 2 floating-popup rewrite, Tip 3 forced placement, gold border off**:
  - **Tip 2 reimagined as a bottom-floating popup** (`app/workout-session.tsx`): replaced inline `<OnboardingTip>` (which lived inside the ScrollView and was getting hidden by scroll position) with a `position: absolute` popup pinned at `bottom: 32, left: 16, right: 16, zIndex: 9999`. Renders AFTER the ScrollView. Includes gold #F5C518 play badge + title "Need a form check?" + body about visual exercise cues + X dismiss + "Don't show again" link. Trigger now fires 1.5s after screen mount with empty deps `[]` — no more dependency on `sessionWorkouts.length`/`isLoading`. testIDs: `tip-form-videos-container/tap/dismiss/never-show`.
  - **Tip 3 forced placement** (`components/OnboardingOverlay.tsx`): `OverlayTarget` interface now includes optional `placement?: 'above' | 'below'`. `PointerCallout` prefers the explicit override before the auto-flip heuristic. In `app/create-post.tsx`, the targets array now passes `placement: 'below'` for media, `placement: 'above'` for IG button, `placement: 'below'` for stats — matching user spec.
  - **Gold border removed**: `labelCard` style no longer has `borderColor: GOLD, borderWidth: 1` — plain dark `#1A1A1A` card with shadow only.
  - **Backfill v3** (`backend/server.py`): bumped flag so all 3 tips_state keys reset to 'unseen' for **97 users** at startup. Replays the tour for users who already auto-completed tips in iter-3/4.
  - **Tests**: 56/56 backend pass (`test_onboarding_backfill_v3.py` 12/12 + v2 9/9 + v1 8/8 + tips 27/27). Source-level audit: every iter-5 edit verified line-numbered. Metro bundle smoke clean. iteration_21.json: 0 critical, 0 minor.

## What's Been Implemented
- [2026-05-11] **Onboarding iteration 4 — alignment, Tip 2 timer bug, IG share hardening**:
  - **Tip 3 overlay alignment via `measureInWindow`**: rewrote `components/OnboardingOverlay.tsx` to take `targets: OverlayTarget[]` (each with measured screen `rect`). For each target, computes auto-flipping card placement (above if target is in bottom half of screen, below if in top half), edge-snap on left/right, and draws an SVG line + filled arrowhead from card edge to the target's center. Card height is now `onLayout`-driven (dynamic state) so long copy doesn't break the arrow start position. In `app/create-post.tsx`, attached `mediaRowRef` to the attachmentCard, `igButtonRef` to the Instagram TouchableOpacity, `editableStatsRowRef` to the editableStatsRow (each with `collapsable={false}`). 800ms after render, `measureInWindow` writes their absolute rects into a single `targetRects` state that's passed to the overlay.
  - **Tip 2 root-cause fix**: `useEffect` had `onboarding` (a memoized object) in its dep array → AuthContext's periodic user refresh changed `onboarding`'s identity → the 1.5s `setTimeout` was cleared on every re-render before it fired, so the tip never showed. Introduced `onboardingRef = useRef(onboarding)` synced via a separate effect; the trigger now reads `onboardingRef.current.requestRender('form_videos')` inside the timer and only depends on `[isLoading, sessionWorkouts.length]`. Same pattern applied to Tip 3 in create-post.
  - **IG share crash → kicked to login** hardened. Wrapped the entire `handleShareToInstagram` body in a top-level `try { … } catch { … } finally { … }` so ANY error (html2canvas / captureRef / MediaLibrary / Linking / permissions) is caught and surfaced as an alert instead of bubbling up to unmount the screen. Added single-flight guard `if (isExportingToInstagram) return;`. `finally` always resets `isExportingToInstagram=false`, calls `igPromptResolveRef.current?.(false)`, and `setIgPromptVisible(false)` so the IG prompt modal never gets stuck in an open state.
  - **Tests**: backend regression 44/44 (`test_onboarding_tips.py` 24/24 + `test_onboarding_backfill.py` 8/8 + `test_onboarding_backfill_v2.py` 12/12). Frontend source-level audit confirms all 6 requested edits present at the documented line numbers (`iteration_20.json`).
  - **Carryover from iter-19** (still open): Expo bundle hardcodes `API_BASE_URL=https://bug-busters-13.emergent.host` via `apiConfig.ts` — by design. Until backend is deployed to prod, dismissal won't persist server-side.

## What's Been Implemented
- [2026-05-08 PM3] **Onboarding iteration 3 — Tip 1 removed, animated mood header, full-overlay Tip 3, IG button polish**:
  - **Tip 1 removed entirely**: floating-bottom-center tip + minimal-down variant trigger gone from `app/(tabs)/index.tsx`. `<OnboardingTip>` import removed; `mood_scroll`-related state/handlers (Effect, focus, scroll-watcher, dismiss) all stripped.
  - **Animated tappable "Choose your MOOD" header**: section title is now wrapped in `TouchableOpacity` (`testID="home-mood-header-cta"`) + `Animated.View` running a 1.0→1.04 scale-pulse loop (1100ms each direction). Tapping it scrolls to `moodSectionYRef - 34`. No backend coupling — runs every session.
  - **Bottom spacing tightened**: `scrollContentContainer.paddingBottom` 60→16; `bottomSocialContainer.marginBottom` 8→0; min bottom inset on the home ScrollView 40→16. Removes excess black void below social icons.
  - **Backfill v2** (`backend/server.py`): bumped flag to `app_settings._id='onboarding_backfill_v2'` and now resets ALL 3 tips_state keys (mood_scroll, form_videos, completion_share) to 'unseen'. Applied to **91 users** on first restart; idempotent thereafter.
  - **Tip 3 reimagined as `<OnboardingOverlay />`** (NEW `components/OnboardingOverlay.tsx`): semi-transparent fullscreen Modal with 3 anchored callout cards + curved gold SVG arrows (via `react-native-svg`) pointing to: Add Media (top-left), Adjust Values & Targets (mid-right), IG Stories (bottom-left). Tap anywhere on backdrop = mark `completed`. Single "Don't show again" pill at bottom = `never`. Test IDs: `onboarding-overlay-pointer-{0,1,2}`, `onboarding-overlay-bottom-bar`, `onboarding-overlay-never-show`. The 3 chip-tips (`tip-completion-share-a/b/c`) are gone from `create-post.tsx`.
  - **IG button polish** (`create-post.tsx`): gold #F5C518 2px border + gold shadow glow + uppercase 'IG Story' label, larger padding/font weight. Test ID `ig-share-button`.
  - **IG hand-off modal walkthrough**: 5-step numbered list — "Open Instagram → new Story → sticker icon → 'Add yours'/photo sticker → pick saved overlay → post". Title updated to "Saved to your photo album". Body text-aligned left + lineHeight bumped for readability.
  - **NotificationInitializer crash fixed** (`utils/notifications.ts`): expo-notifications SDK 53+ removed `Notifications.removeNotificationSubscription` static — replaced with feature-detect that calls `subscription.remove()` (with legacy fallback). This was crashing first navigation to /create-post.
  - **Tests** (`backend/tests/test_onboarding_backfill_v2.py`): **9 new tests PASS**, total **36/36** with the previous suites (iteration_19 confirms backend green on preview URL).
  - **Known env-skew note**: the Expo bundle's `apiConfig.ts` is hardcoded to talk to `https://bug-busters-13.emergent.host` (production). Backend code changes (tips_state init, PATCH, GET /app/onboarding-config, backfill v2) live in `/app/backend/server.py` and are running on the preview backend only. **For the user to see persistence in production, backend MUST be deployed via the "Deploy" action.** Until then, tips will still trigger client-side (DEFAULT_STATE='unseen' is used when `/users/me` returns no tips_state field), but the dismissal won't persist server-side and the same tip will reappear next session.

## What's Been Implemented
- [2026-05-08 PM2] **Onboarding iteration 2 — Tip 1 redesign + legacy-user backfill + create-post crash fix**:
  - **Tip 1 visual overhaul** (`components/OnboardingTip.tsx`): added `variant: 'card' | 'minimal-down'` prop. Minimal-down renders **no card/capsule** — just white text on top with an animated downward arrow below it (gold pulse converted to vertical bob via `pulseAccent`). Tap = primary CTA, long-press = dismiss. Used by Tip 1 in `app/(tabs)/index.tsx`. Copy simplified to "Pick your mood to start" (arrow handled visually).
  - **Scroll target tightened**: tip-tap now scrolls to `moodSectionYRef - 34` (10px less than the previous -24).
  - **Legacy-user backfill** (`backend/server.py` startup): one-shot, idempotent migration gated by `app_settings._id='onboarding_backfill_v1'` flag. Sets `tips_state.form_videos = 'unseen'` and `tips_state.completion_share = 'unseen'` for ALL users so existing accounts see Tips 2 and 3. Applied to **87 users** on first restart; subsequent restarts no-op.
  - **Create-post crash fix** (`app/create-post.tsx`): pre-existing latent bug from a previous commit referenced `igPromptVisible` and `igPromptResolveRef` (rendered unconditionally in the Instagram hand-off Modal) but never declared them — would `ReferenceError` on screen render. Declared both via `useState` + `useRef`. Also removed two duplicate style keys (`achievementWorkoutPreview`, `achievementWorkoutName`).
  - **Tests** (`backend/tests/test_onboarding_backfill.py`): **8 new tests PASS** alongside the 27 existing → **35/35 total**. Verifies backfill applies once, flag doc shape, idempotency on restart, no-overwrite of users with prior `completed`/`dismissed`/`never` (current behavior unconditionally rewrites — covered in regression review note).
  - **iteration_18.json**: 0 critical issues, 0 minor issues, no retest needed.
  - **Known stale-Metro caveat**: Metro can serve stale bundle for `create-post.tsx`; if user reports ReferenceError reappearing, `sudo supervisorctl restart expo` clears it.

## What's Been Implemented
- [2026-05-08] **New-user Onboarding system — profile picture at signup + 3 contextual tips**:
  - **Backend** (`backend/server.py`):
    - `POST /api/auth/register` initializes `user.tips_state = {mood_scroll, form_videos, completion_share}` all `'unseen'`.
    - `GET /api/users/me` returns `tips_state` with lazy default for legacy users.
    - **NEW** `PATCH /api/users/me/tips-state` validates `{key, state}` against `ALLOWED_TIP_KEYS`/`ALLOWED_TIP_STATES`, blocks `mood_scroll→never` (self-resolves), persists via dot-path `$set`.
    - **NEW** `GET /api/app/onboarding-config` (public) reads `app_settings._id=onboarding.onboarding_tips_enabled`, defaults `true` (master kill switch).
  - **Frontend**:
    - **NEW** `components/OnboardingTip.tsx` — single reusable tip (#1A1A1A card, #2A2A2A border, 12px radius, white 14px text, X dismiss top-right, optional gold pulse + play badge, "Don't show again" link). Position modes: top/bottom/left/right/floating-bottom-center.
    - **NEW** `contexts/OnboardingContext.tsx` — manages `tipsState`, `enabled` (kill switch), single-active-tip queue (`requestRender`/`releaseRender`), persist via PATCH, fires `tip_shown / tip_tapped / tip_dismissed / tip_never_show` analytics. Wrapped in `app/_layout.tsx` inside Auth/Cart/Badge providers.
    - **NEW** `components/UserAvatar.tsx` — image when uri present, else first letter of name in white on a gold (#F5C518) circle (used as preview during signup; reusable elsewhere).
    - **`app/auth/register.tsx`** rewritten with profile picture upload field between Display Name and Password: 5MB cap, JPG/PNG, square crop via expo-image-picker, "Skip for now" link, base64 captured then uploaded to `/api/users/me/avatar-base64` after register call (fire-and-forget, never blocks signup).
    - **Tip 1 — `mood_scroll`** in `app/(tabs)/index.tsx`: triggered on first home focus, floating-bottom-center pill "Pick your mood to start →", taps smooth-scroll to mood section + completes; auto-completes if user manually scrolls past mood section; X → dismissed.
    - **Tip 2 — `form_videos`** in `app/workout-session.tsx`: 1.5s after exercise list renders, anchored above "Find visuals" search bar with gold pulse, copy "Stuck on form? Search any exercise for video cues and common mistakes."; `allowNeverShow=true`. Tap on tip OR underlying search bar → completed.
    - **Tip 3 — `completion_share`** in `app/create-post.tsx`: 800ms after completion screen renders, three small chips at once (A=Post button "Share with the community" + dismiss X + "Don't show again", B=Instagram Stories button "Save to camera roll, use as IG overlay", C=editable cal/min row "Tap to edit"). Tapping any chip OR underlying element fades all three; A's X dismisses all; A's "Don't show again" sets all to `never`.
    - **Analytics events** added to `utils/analytics.ts`: `tipShown`, `tipTapped`, `tipDismissed`, `tipNeverShow` (each emit `{tip_id}`).
  - **Tests** (`/app/backend/tests/test_onboarding_tips.py`): 27/27 PASS — covers register init, /users/me shape, PATCH happy + 6 negative paths, auth gates, key isolation, avatar-base64 regression. Curl-validated:
    - `GET /api/app/onboarding-config` → `{onboarding_tips_enabled: true}`
    - Register → token + tips_state all unseen
    - PATCH `mood_scroll=completed` → `{key, state}` echo, `/users/me` reflects update with other keys untouched
    - PATCH `mood_scroll=never` → 400 "mood_scroll does not support 'never'"
    - PATCH `key=foo` → 400 "Invalid tip key"
  - **Acceptance checks (per spec)**: ✅ new user lands on home → Tip 1 visible immediately, no other tips. ✅ Tap → smooth scroll, tip gone, state=completed. ✅ Workout session → Tip 2 1.5s after render. ✅ Completion screen → Tip 3 chips 800ms after render. ✅ All dismissed → never reappear (server-persisted). ✅ Tips never stack (single activeTip slot in context). ✅ `settings.onboarding_tips_enabled=false` hides all tips for all users (context guards every render).

  - **Muscle Gainer rotation fix** (`frontend/utils/workoutGenerator.ts:1631-1675`): Slots 2..N now alternate compound ↔ isolation rather than forcing isolation. When the alternating pool is exhausted (e.g. Back has only 1-2 isolations), the picker gracefully falls back to the other pool instead of degrading the section. Distribution check (300 runs/scenario): Back-only beginner shifted from forced-iso to 67% compound / 33% iso; multi-muscle beginner sections (target=1) now correctly stay 100% compound. All 1,280 invariant simulations still pass.
  - **Live feed lookback**: capped at **48h primary + soft 7d fallback** (was 365d). Beyond 48h, entries naturally read as "yesterday" / "X days ago".
  - **Milestone branch decoupled** from lookback iteration — always evaluated at the end so milestone cards surface even when 48h has plenty of activity.
  - **Seed script** `/app/scripts/seed_live_feed.py`: generates ~40 events spread across last 48h + bumps 3 users to milestone counts {5, 25, 100}. Idempotent via `seed_tag=live_feed_seed_v1`. Run again: `python /app/scripts/seed_live_feed.py`. Undo: `--clear`.
  - **Pull-to-refresh haptic** in `frontend/components/LiveFeed.tsx`: light selection haptic on pull, light impact haptic when fresh entries land during a manual refresh (mobile only — `Platform.OS !== 'web'`).
  - **"+N just landed" toast**: floating pill at the top of the feed, fades in/translateY when previously-unseen entry IDs appear in a refresh response. Auto-hides after 2.5s. Skips on first load (would always be "all new").
  - Inspection script `/app/scripts/inspect_muscle_gainer_distribution.js` for ad-hoc compound/isolation distribution analysis.


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
