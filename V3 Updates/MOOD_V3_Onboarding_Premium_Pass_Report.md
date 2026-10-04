# MOOD V3 Onboarding: Premium Pass + First-Workout-Free Paywall (Oct 3, 2026)

New arc: Intrigue → "this understands me" → accumulating personalization → construction → reveal → first workout → paywall on starting workout #2 (one free workout per week, as before).

Nothing is committed to git. Pre-change copies of every touched file: `Backups/onboarding_funnel_pre_rework_2026-10-03/`. Screenshots: `V3 Updates/Onboarding_Premium_screens/`.

## 1. Screen by screen

| Screen | Before | Now |
|---|---|---|
| Intro | "Training that matches how you feel." + "A few quick questions…" + Begin | Same video + scrim + wordmark. Headline "Your workout should change when you do." Support line on goals, level, and how you show up today. Ticker cycles the six real States in human words ("Low energy → adjusted.", "Feeling unstoppable → adjusted.", …). CTA "Build my MOOD →". Faster reveal (CTA at ~2.7s, was 4s). |
| Progress chrome (all 5 questions + social proof) | "Step X / 6" | "YOUR PROFILE IS TAKING SHAPE · 60%". The bar moves on every tap, not on Continue. Social proof reads "PROFILE COMPLETE · 100%". |
| Reactions | Gold dot + italic line inside the scroll list | ReactionCard in a fixed slot above the CTA (never below the fold): gold tag naming what changed ("DEFAULT SET · STRENGTH", "EXERCISE POOL · ADVANCED", "WEEK PLANNED · ROTATION") plus one line on how. Re-animates on every new selection. |
| 1 Training style | Pills | Cinematic 2×2 image cards (the Home Direction imagery; no new assets). CTA "That's me". |
| 2 Goal | "What are you training for?" pills | "What are you really chasing?" kept as you asked. Editorial type on hairlines: Getting stronger / A better physique / Leaning out / Moving like an athlete / Feeling better, stressing less / Finally staying consistent. CTA "Continue". |
| 3 Experience | Beginner / Intermediate / Advanced | "Where are you with training?" Four rising rungs with signal bars: Just getting started / I know the basics / I train consistently / I train seriously. CTA "That's me". |
| 4 Frequency | Pills | Each option is drawn as a week (M T W T F S S with the training days lit). CTA "Continue". |
| 5 Barrier | "What usually gets in the way?" pills | "What usually gets between you and a good workout?" First-person statement cards ("I never know what to do", "I get bored", …). MOOD answers with how it removes that barrier. CTA "Personalize my training" (upgrade: "Build my profile", edit: "Update my profile"). |
| Social proof | Unchanged content | Kept (testimonials + your new 1,000+ stat). Only the progress label changed. CTA stays "Build my profile". |
| Construction (reveal-loading) | 7.8s "Reading your answers… / Calibrating…" stream | "BUILDING YOUR TRAINING PROFILE / Here's what MOOD learned." Five real derived settings lock in one by one with a check and a haptic tick (e.g. Strength-first training ✓, Heavy compound priority ✓, Advanced exercise pool ✓, 3–4 days a week · split rotation ✓, Higher variety ✓) while the radar fills in the axes each setting drives. Waits for the profile save, then "PROFILE READY" holds for a beat. About 5.3s (rev 2: +1s hold). |
| Profile reveal | Settings summary → Continue → paywall | Screenshot-worthy card: "WESLEY'S TRAINING PROFILE", archetype ("THE STRENGTH BUILDER"), one-line identity, radar, Primary direction, training chips. Below the card: "WHAT MOOD WILL DO DIFFERENTLY FOR YOU" (3 lines, led by their own barrier). CTA "Build my first workout →". No paywall. |
| reveal-payoff (paywall #1) | After reveal | Removed from the path (file kept for V2 / dev screens). |
| Wearables connect | Between paywall and Home | Deferred until workout #1 is complete (then shows when they land back on Home). |
| Build | "Build today's workout" | Opened automatically from Home after the reveal, titled "Build your first workout". Same State / Direction generation flow, arriving with the funnel answers applied: Direction from training style, Low Energy / Bored States preselected from the barrier, 30 min preselected for "short on time" (rev 2; was only a SUGGESTED badge), plus a "SET FROM YOUR PROFILE" note saying what carried over. Section 3 MOOD's Pick card has a rotator ("Could be Upper Pull · 2/5") cycling the session types MOOD's Pick can actually choose for this athlete (mirrors the backend rotation: 1–2 days Strength = Full Body only, 5+ adds Hinge + Arms; Sweat / Athletic rotate all three). |

## 2. Final flow

New signup:
`intro → v3-preference → v3-goal → v3-experience → v3-frequency → v3-barrier → step-6-social-proof → (name, Apple relay only) → reveal-loading (construction + save) → profile-reveal → /(tabs) Home → /v3/build (auto, once) → Cart (/v3/workout) → Start Workout (workout #1 claimed free) → Guided Session → Complete → Home → (wearables connect) → … → Start on workout #2 → paywall`

Upgrade (existing user, first V3 open): `upgrade → 5 questions → construction → reveal ("Build today's workout") → Home → Build`.
Edit (Settings): `upgrade?mode=edit → 5 questions → construction → reveal ("Done") → Settings`.

The reveal replaces into `/(tabs)` so Home is the stack root. Home reads a one-time `launch_build` flag on the first-Home handoff and pushes Build. Back from Build and Done after the session both land on Home.

## 3. How personalization is derived

All deterministic templates in `frontend/utils/v3ProfileCopy.ts` (pure, unit-tested). No LLM, no network. Every line maps to real V3 behavior:

- Training style → default Direction (same rule as the backend `resolve_direction`).
- Goal → which sessions MOOD's Pick leads with. Copy never claims goal-specific sets or reps.
- Experience → the four rungs map to the three server levels (`EXPERIENCE_DETAIL_OPTIONS`: getting_started → beginner, basics → intermediate, consistent and serious → advanced). Rev 2: "I train consistently" moved from intermediate to advanced so it gets every movement. The level is more than a movement filter in the generator: `advanced` also unlocks complexity 4–5 lifts (Olympic and technical variations), high-impact Athletic work, cluster / pause methods, and puts the main lift slightly closer to failure (about 0.3 RIR) with a touch more volume. No generator code changed; only the onboarding mapping. The rung is kept on-device for selection state and wording. The server stores the level only.
- Frequency → Strength split (1–2 full body, 3–4 rotation, 5+ full split with hinge and arm days).
- Barrier → the existing first-session prefill (`barrierPrefill`: Low Energy / Bored preselected, 30-min suggestion, MOOD's Pick emphasis).
- Archetype → `archetypeName()`: keyed by goal with a few preference overrides (e.g. Athletic + strength goal → "The Performance Builder"). A name for the combination, not a score.
- "What MOOD will do differently" → `adaptationsFor()`. The barrier leads, then Amped, Low Energy, Bored (Stressed is promoted for the feel-better goal). The wording mirrors the State lines in `backend/mood_v3/explain.py`, per Direction where explain.py has a Direction-specific line.
- Radar → the existing `radarValues()`.

`frontend/utils/v3ProfileOptions.ts` holds the option and label data (moved out of v3Profile.ts so node tests can import it; v3Profile.ts re-exports everything, so existing imports are unchanged).

## 4. How the free workout is tracked (rev 2: weekly kept)

Rule: one free workout per ISO week (Monday 00:00 UTC reset, the same window as before) for users without access, claimed at START. Starting a second, different workout that week opens the paywall. For a new user that means workout #1 free, paywall on starting workout #2, and one more free workout next week.

Server is the source of truth (`backend/start_gate.py` + `entitlement.start_decision`):

- `users.first_free_workout = {key: "v3:<workout_id>", period: "2026-W41", source, started_at, moved_count}` is written atomically on the first allowed START of the week (the filter `period $ne <this week>` covers "never claimed" and "claimed last week"). It lives on the user doc, so reinstalling or logging in again does not reset it.
- `POST /api/workouts/start` accepts `{workout_id, source: "v3"}`. Outcomes:
  - `entitled`: always allowed. The week's first start is still recorded.
  - `first_workout`: no claim this week, so it is claimed and allowed.
  - `same_workout`: re-start of this week's claimed workout (reopen, restart, relaunch).
  - `switch_grace`: a different workout within 15 min of an un-completed claim moves the claim.
  - `second_workout`: 402 → paywall. The response carries `free_workouts_reset_at` (next Monday).
- Not a start: generate, preview, swap, Different Workout, cart edits, browsing, Home Continue / resume / relaunch.
- Completion safety net: completing a workout claims the week's free workout if no start did (offline fail-open start).
- `GET /me/entitlement`: `free_workouts_remaining` 1 / 0 for the week, `free_workouts_reset_at` = next Monday, plus `first_workout_claimed`.
- Client: the grant cache is keyed by workout id. The offline fallback remembers `<week>|<key>` on-device and ignores a key from an earlier week.
- Legacy V2 players (no workout id) share one claim key with a 4-hour session window.
- Change from V2.1: the allowance is consumed when a workout is STARTED, not when it is completed. The weekly counter is still booked on completion for analytics continuity.

## 5. Where the paywall triggers now

- Cart (`/v3/workout`) Start Workout → `useV3StartGate()` → 402 → `openPaywall('start_workout_after_free_session')`, and the user stays on the Cart. Analytics: `v3_start_workout_paywalled`.
- Session fresh start that skipped the Cart (conflict sheet "End it and start this workout", deep link) → same gate. A blocked start shows "Your first MOOD workout is done. Unlock MOOD to start this one." with the paywall on top. Try again works after purchase.
- If another workout is still in progress, the Cart does not gate. The session's Continue / Replace sheet comes first, and Replace is gated.
- Removed: Soft Paywall #1 at the end of onboarding. Founding-offer modal: suppressed on `/v3/*` screens and until workout #1 is done.
- Unchanged: V2 paths (cart.tsx, workout-guidance, featured detail) call the same server gate with the new lifetime rule. Post-completion paywall stays off (`POST_COMPLETION_PAYWALL = 'none'`).

## 6. Assumptions and edge cases

- Weekly allowance kept (rev 2). Existing free users keep getting one free workout each week; the only change for them is that it is used up on Start instead of on completion.
- "I train consistently" now maps to the server's `advanced` level, the same as "I train seriously" (rev 2, see below).
- The 15-minute wrong-workout grace is deliberately small. Set `FIRST_WORKOUT_SWITCH_GRACE_SEC = 0` to make it strict.
- `onboarding_completed` used to fire on arrival at reveal-payoff. It now fires on arrival at the profile reveal (new users), with `paywall_in_onboarding: false` and `funnel_design: 'v3_premium_oct26'` for before/after comparison. Dashboards comparing completion rates across this release should split on that field.
- Wearables connect moved to after workout #1, so the first guided session has no live HR unless they connected before. Device-local flag `@mood_v3_first_workout_pending_v1` with a 24h expiry. It only orders prompts and never decides access.
- If the app is killed between construction and reveal, relaunch lands on Home without the auto-Build. The Build handoff and prefill still apply on their next Build.
- Copy truthfulness: the Sweat Low Energy line uses the generic explain.py line, because explain.py has no Sweat-specific one.
- Server deploy is required for the new gate. Until then, the new client sends `{workout_id}` to the old endpoint, which ignores it and keeps the weekly rule. Nothing breaks.

## 7. Tests and typechecks

- `tsc --noEmit` (frontend): 78 errors before, 78 after, identical set (all pre-existing, none in touched files). No new errors.
- Backend pytest (rev 2): `test_first_workout_start_gate.py` (new, 11 tests incl. "the free workout comes back every Monday"), `test_v3_completion.py` (updated for the claim hook), `test_training_profile.py`, `test_router.py`: 48 passed.
- Frontend node tests: `utils/v3PickRotation.test.ts` (new, 2: the rotator only lists session types the resolver can pick), `utils/v3ProfileCopy.test.ts` (new, 7: every answer combination produces 5 conclusions, deterministic identity, 3 unique adaptations, barrier-led ordering) and `utils/v3Session/access.test.ts` (new, 5: offline fallback, no post-completion paywall): 12 passed. Added scripts `test:v3-profile` and access.test.ts in `test:v3-session`.
- Existing suites: viewModel, sync, notifier, v3TodayModel, v3HomeRecs, v3Activity, v3CartFormat all pass. Pre-existing failures unrelated to this pass (no touched imports): compile.test 4, engine.test 2, modes.test 1 (Engine intervals / continuous / pyramid / cool-down).
- `server.py` cannot be imported in the test VM (OpenSSL env issue, pre-existing). Its syntax was checked, and pyflakes reports no undefined names.
- Not run: device or simulator build, live StoreKit purchase, the end-to-end live server gate. Please run one TestFlight pass: new signup → workout #1 → Done → wearables → start a new workout → paywall.

## 8. Screenshots

`V3 Updates/Onboarding_Premium_screens/` was rendered from the real screen code with react-native-web (`frontend/qa/onboarding/web`, QA-only harness). Two harness limitations: the intro background video doesn't render, and icons show as placeholder circles.

## Rev 3 (founder testing fixes)

- First workout Build ignored the funnel answers on a device with earlier state (seen in dev: Athletic + "I never know what to do" opened as Strength + Stressed). Cause: Build preferred the device's last-used Direction and today's stored States over the onboarding handoff. Fix: when Build is opened by the reveal (`first=1`), the funnel answers win. Direction comes from the profile and is locked against the late profile fetch. States come from the barrier prefill (stale States are cleared). 30 min is selected for the time barrier. Normal Build opens are unchanged.
- Reveal page: "Your profile" hero title above the card. The card photo is now top-anchored (drawn at full card width, shifted 2% up), the hero area is taller, and the overlay is lighter, so the athlete's head and face are in frame.
- Step 1 images load instantly: new 900 px JPGs in `assets/images/onboarding/` (62 to 97 KB each, vs 1.3 to 1.8 MB PNGs) for the training-style cards and the reveal card. They are prefetched and decoded off-screen on the intro screen (and again on the building screen for the reveal photo). Android fade is off.

## Rev 4

- Building screen: back to the shorter hold (about 4.3s total).
- Reveal: tighter radar (190 px, trimmed empty canvas above and below) and spacing, so "WHAT MOOD WILL DO DIFFERENTLY FOR YOU" is visible without scrolling on a 390 × 844 screen.
- Build after onboarding: the "SET FROM YOUR PROFILE" block is gone. A one-time transparent overlay (`components/v3/BuildCoachmark.tsx`) dims the form, leaves Build Workout bright and tappable, and shows one message with a bouncing arrow pointing at it (barrier-specific copy, e.g. "No planning needed"). Tapping anywhere dismisses it; tapping Build Workout dismisses it and builds.
