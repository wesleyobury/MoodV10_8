# MOOD V3 Phase 2 Implementation Report

Home + Workout Creation + Generated Workout Overview. Phase 3 (the guided player, completion logging) has not been started.

**Recommendation: READY FOR PHASE 3**, once you have done the device pass in section 11.

## 1. Git

| | |
|---|---|
| Branch | `feature/mood-v3-app-rehaul` (the same branch as Phase 1) |
| Starting commit | `20a27c3d` (the end of Phase 1). The tree was clean, so no extra checkpoint was needed. |
| Ending commit | the Phase 2 commit directly after `20a27c3d` (the hash is in the chat summary) |
| Status | Clean. The only untracked items are the same ones as before: the Excel lock file and `backend/hero_uploads/*.jpg`, which I left alone. |

No backend files changed in Phase 2, and the frozen generators are untouched.

## 2. Phase 1 cleanup: preference labels

The onboarding Q1 screen now uses the Home vocabulary. The stored IDs are unchanged.

| Label | Descriptor | Stored ID |
|---|---|---|
| Strength | Lifting, muscle & strength | lifting |
| Sweat | Conditioning, HIIT & endurance | conditioning |
| Athletic | Power, speed & athleticism | athletic |
| Mix It Up | A little of everything | mix |

## 3. Home

**What was built.** The Workouts tab now renders `components/v3/V3Home` for signed-in users.
- Guests always get the V2 home, because `/api/v3` needs an account.
- `V3_HOME_ENABLED = false` in `utils/v3Profile.ts` brings the V2 home back for everyone.
- The V2 home component is untouched. It was renamed to `V2WorkoutsHome` inside the same file.

**The screen, top to bottom:**
1. The date and the heading "Today's workout".
2. The **Ready to go** card. It only appears when today's workout has already been generated, and it reopens that workout.
3. The first-visit barrier banner (first visit only, dismissable).
4. **A. How are you feeling?** Six State chips in a 3 x 2 grid, marked "Optional · up to 3". Choosing Sore reveals "Where are you sore?".
5. **B. What are we doing?** Three Direction cards: Strength, Sweat and Athletic. One is always selected.
6. **C. Focus + Length panel.**
   - FOCUS shows MOOD's Pick by default. "Change" opens the Target chips (Strength and Sweat only).
   - LENGTH is 60 min or 30 min.
7. **D. Build.** A sticky "Build workout" button with a one-line summary above it, for example "Strength · MOOD's Pick · 60 min".

**Defaults:**
- no State;
- the resolved Direction;
- MOOD's Pick;
- 60 min;
- the equipment comes from the profile on the server (commercial gym).

With those defaults, building a workout is one tap.

**Direction defaults, in order:**
1. The last Direction the user actually built with, stored locally in `@mood_v3_last_direction_v1:<uid>`.
2. The Training Profile's `default_direction` from `GET /api/users/me/training-profile`.
3. The handoff's `default_direction` (shown while that request is still loading).
4. Strength.

Changing the Direction on Home never writes to the Training Profile. Every request sends `direction` explicitly.

## 4. First-session personalization

This comes from Phase 1's `readFirstHomeHandoff`. It only applies while the handoff is `pending`.

| Barrier | What Home does |
|---|---|
| Low energy | The Low Energy chip starts selected. The banner says it's on and that tapping it turns it off. |
| Boredom | The Bored chip starts selected, with the same kind of banner. |
| Time | 60 stays selected. The 30 min chip gets a "SUGGESTED" badge, the Length row says "Short on time? Try 30.", and the banner explains 30 min. |
| Motivation | "One tap to start" banner. The Focus panel gets an accent border, and Focus stays collapsed. |
| Don't know | "No planning needed" banner, with the same emphasis on MOOD's Pick and nothing extra to decide. |

**When the handoff is consumed** (`consumeFirstHomeHandoff`):
- after the first successful generation (valid, relaxed or rerouted), or
- when the user dismisses the banner with X. Dismissing also removes any prefilled State chips.

A conflict does not consume it. Once consumed, the barrier is never applied again.

## 5. Workout inputs

- **States.** The API values are `low_energy`, `amped`, `stressed`, `bored`, `irritated` and `sore`, with a maximum of 3.
  - Zero States is fine.
  - Tapping a fourth State does nothing visible except dim the unselected chips and change the caption to "Up to 3. Tap one to remove it." Nothing looks like an error.
- **Soreness.**
  - Choosing Sore reveals chips for Legs, Chest, Back, Upper Back, Lower Back, Shoulders, Arms and Core. These are exactly the API's body-map regions.
  - Removing Sore clears the areas.
  - The server ignores Sore when no area is given, so while no area is picked the button reads "Pick where you're sore" and stays inactive.
  - Sore counts toward the 3-State limit, the same as on the server. So the Sore chip and the generated workout never disagree.
- **Direction.** Always one of the three. Switching to Athletic clears any Target and hides the Target picker.
- **Target** (Strength and Sweat only).
  - Chips: Full Body, Chest, Back, Shoulders, Arms (biceps + triceps), Core, Quads, Hamstrings, Glutes, Calves.
  - Every value comes from `USER_FACING_TARGETS`, and Full Body is sent as `"full_body"`.
  - Up to 3 muscles; Arms counts as two. Full Body can't be combined with anything else.
  - Archetypes are never exposed.
- **Duration.** 60 (the default) or 30. Nothing else is offered.
- **MOOD's Pick.** This is the default whenever no Target is chosen. The copy reads: "We'll choose today's session from your profile and recent workouts, then shape it around how you're feeling." For Athletic it adds that Athletic rotates Power, Speed + Agility and Full-Body Athlete. It makes no claims about a program, recovery or wearables.
- **Equipment.** It isn't on Home. The server fills it from the profile. The only way it changes for a session is the conflict option "Use full gym equipment", and that change is never saved to the profile.

## 6. API

**Client:** `utils/v3Api.ts`.
- Its types mirror CONTRACT.md.
- It is the only place the app calls `/api/v3`.
- It uses the app's `apiFetch`, so token refresh and offline detection still work.
- It allows 30 seconds for generate and swaps (a cold server start can be slow).

**Request construction:** `utils/v3HomeModel.buildRequest`. A typical body looks like this:

```json
{"direction":"strength","states":["low_energy","sore"],"soreness":["shoulders"],"duration":60,"date":"2026-09-25","persist":true}
```

`target` is added only when one is chosen. `archetype` and `equipment` are added only when a conflict option's patch sets them. `date` is the user's local date.

Goal, experience, frequency and equipment are left out on purpose, so the Phase 1 profile fallback fills them. No V2 values are sent, and the V2 generator is never called.

**Endpoints used:**
- `POST /api/v3/workouts/generate`
- `GET /api/v3/workouts/{id}`
- `POST /api/v3/workouts/{id}/swap-exercise`
- `POST /api/v3/workouts/{id}/swap-workout`
- `GET /api/users/me/training-profile`

**Outcomes:**
- `valid`: rendered normally.
- `valid_with_relaxation`: rendered normally. Any relaxation the user should know about already arrives as a Built for Today line, for example "This session is complete at about 29 min. Quality over filler." The `relaxations` codes themselves are never shown.
- `rerouted`: the Overview shows an "Adjusted for today" card with the API's own reroute line, for example "With sore legs, back and chest, today moved to Arms." That line is then left out of the Built for Today list so it isn't shown twice.
- `conflict`: a bottom sheet titled "Let's adjust today" shows the API's message and exactly the options the API returned.
  - An option with a patch applies that patch and regenerates.
  - `change_target` with a null patch opens the Target picker.
  - `cancel` just closes the sheet. It's shown as the text link at the bottom.
  - No conflict rules live on the client.

**Errors:** network failures, 422 validation errors, 404, 409 completed and 409 `workout_outdated` each map to a calm inline message with "Try again", or to a toast on the Overview.

## 7. Generated Workout Overview

**Screen:** `app/v3/workout.tsx` (`/v3/workout?id=`).
- It shows the cached envelope instantly, then refreshes with `GET /api/v3/workouts/{id}`.
- The sticky button is **Start Workout**. Below the workout is a **Different workout** button.

**Components**, one renderer shared by all three Directions:
- `WorkoutOverview`:
  - Identity: the Direction eyebrow, the archetype name as the title, the Target label as a subtitle when the user chose one, then `duration.display` · exercise count · equipment (only when it isn't commercial gym).
  - State pills, with the sore areas merged into the Sore pill.
  - The Adjusted card, Built for Today, the warm-up, the blocks and the cool-down.
- `BlockCard`:
  - The block title and `instructions` come from the API.
  - A formatted fact line: rounds, EMOM minutes, work/easy intervals, estimated minutes, RPE, and rest between rounds.
  - Supersets are grouped with a gold rail and A1 / A2 labels.
- `ExerciseRow`:
  - Media or monogram, name and swap button.
  - `prescription.display` is shown as-is, never rebuilt, followed by equipment and rest.
  - Then the load guidance, quality-stop, progression and cues.
- Also: `ExerciseThumb`, `V3Chip` and `ConflictSheet`.
- Formatting helpers are in `utils/v3OverviewFormat.ts`. They only format; they make no workout decisions.

**Direction-specific handling** (only where the data calls for it):
- **Sweat:** the `interval` and `effort` facts on the block, plus the round labels for anchor-circuit stations ("Every round", "Rounds 1 + 6").
- **Athletic:** `quality_stop` shown as its own line with an icon. The Performance Support "why" comes through the block's `instructions`.

**Built for Today** is rendered verbatim from `built_for_today`, in a card with a gold hairline border.

**Media fallback.**
- Every exercise in the production pack has `media: null`, so this path is the common one today.
- Those exercises get an intentional monogram tile ("BB" for Barbell Back Squat).
- If a thumbnail URL exists, it's shown; if it fails to load, the tile falls back to the monogram. A play badge appears only when a working thumbnail has a video.

**Cues:** the first cue shows on one line, with "+N more" to expand the rest.

**Progression:** when `progression.text` exists it shows as a highlighted line, for example "You hit every rep at 100 kg last time. Try 105 kg today." Otherwise nothing is rendered.

## 8. Swap

Both swaps are implemented with the production endpoints. The client only ever shows what the server returns.

**Exercise swap** (the icon on every item whose `swap.swappable` is true):
- Calls `swap-exercise` with the `item_id`. A spinner shows on that item, and other swaps are paused until it finishes.
- On success, the new envelope replaces the old one, the swapped row is briefly highlighted, and a toast says "Swapped in Barbell Incline Press".
- `no_alternative` shows the API message as a toast and leaves the workout unchanged.
- 409 `workout_outdated` and 409 completed show calm messages.
- No candidate selection happens on the client.

**Different workout:** calls `swap-workout`. The server keeps the Direction, Target, duration, States, soreness and equipment and increments `swap_count`. The screen then scrolls to the top and shows a toast.

Swap reasons (`dont_have` / `dont_like`) aren't asked for yet, so none is sent. That's deferred to the Phase 3 session UI.

## 9. Start Workout handoff

**Start Workout** tracks an analytics event and pushes `/v3/session?id=<workout_id>` (`app/v3/session.tsx`). That screen:
- shows the workout's name and a note that guided sessions are coming in the next build;
- lists the exercises with their `prescription.display`;
- has a back button.

It never touches the V2 cart or player, never marks the workout complete, and never uses up the free workout. Phase 3 replaces this screen.

## 10. Home after generation

Local state lives in `utils/v3Today.ts`, under `@mood_v3_today_v1:<uid>`. It stores today's date, the workout id, a request signature, the request and the latest envelope.

- Navigating back to Home shows the **Ready to go** card.
- Tapping Build with the same inputs on the same day reopens that workout instead of generating again. This was verified: no second generate call was made.
- Swaps update the stored envelope.
- A new day starts fresh.
- The server remains the source of truth, because the Overview always refreshes with GET.

## 11. Analytics

Events go through the existing `trackEvent`, with `home_version: 'v3'`:

| Area | Events |
|---|---|
| Home | `v3_home_viewed` (first_visit, barrier, default_direction, direction_source, has_today_workout) |
| States | `v3_state_toggled`, `v3_state_limit_reached`, `v3_soreness_changed` |
| Choices | `v3_direction_changed`, `v3_target_changed`, `v3_duration_changed`, `v3_moods_pick_used`, `v3_prefill_dismissed` |
| Build | `v3_generate_tapped` (the full request plus a moods_pick flag), `v3_generation_outcome` (outcome, archetype, conflict code, the profile_defaults_applied keys) |
| Reroute and conflict | `v3_rerouted`, `v3_conflict_shown`, `v3_conflict_resolved` (code, action, label) |
| Overview | `v3_workout_reopened`, `v3_workout_overview_viewed` (outcome, direction, archetype, target mode, durations, states, has_progression, media_count) |
| Start and swaps | `v3_start_workout_tapped`, `v3_swap_exercise_tapped` and `v3_swap_exercise_result`, `v3_swap_workout_tapped` and `v3_swap_workout_result` |

## 12. Files changed

**New:**
- `components/v3/V3Home.tsx`, `WorkoutOverview.tsx`, `BlockCard.tsx`, `ExerciseRow.tsx`, `ExerciseThumb.tsx`, `V3Chip.tsx`, `ConflictSheet.tsx`
- `app/v3/workout.tsx`, `app/v3/session.tsx`
- `app/dev/v3-pack.tsx`, a dev-only viewer that runs the production output pack through the real renderer with no backend
- `utils/v3Api.ts`, `utils/v3HomeModel.ts`, `utils/v3OverviewFormat.ts`, `utils/v3Today.ts`
- `utils/dev/v3PackFixture.json`, which holds the 15 pack workouts, 6 special cases, and 3 extra cases generated by the frozen service: relaxation, sore-target conflict and Athletic reroute

**Modified:**
- `app/(tabs)/index.tsx`: the V3 / V2 switch
- `utils/v3Profile.ts`: the preference labels and the `V3_HOME_ENABLED` flag
- `app/dev/screens.tsx`: a new "MOOD V3" section linking the pack viewer, the upgrade screen and the profile edit screen

## 13. Tests

| What | Result |
|---|---|
| Backend: `pytest mood_v3/tests` (router, integration, training profile, frozen parity) | **32 passed** |
| Unified QA: `python -m mood_v3.qa.run_unified_qa` | **all green, 0 failures, 8,424 builds** |
| `npx tsc --noEmit` | 86 errors, **the same set as the baseline, so none are new** |
| `npx expo export --platform ios` | **exit 0**. The new routes, components and copy are confirmed in the bundle. |
| Frontend logic suite (esbuild + node over the real modules) | **436 checks, 0 failures** |
| Browser end-to-end run against the real `/api/v3` (details below) | **all flows passed, 0 page errors** |
| All 24 fixture cases rendered through the real renderer | **0 errors**, with screenshots |

**What the logic suite covered:**
- **Defaults:** preference to Direction (including Mix via the goal), 60 min as the default, and every barrier's prefill and banner.
- **States:** zero, each one alone, three, a fourth blocked, Sore with and without an area, removing Sore clears its areas, and Sore counting toward the limit.
- **Target:** Strength and Sweat Targets, Full Body exclusivity, Arms counting as two, the three-muscle limit, Athletic clearing and ignoring Targets, and the chip values being a subset of the contract's Target list.
- **Requests:** 30 and 60, the minimal request shape (no profile or V2 fields), the local date, and signature and reopen behavior.
- **Conflicts:** every option in both fixture conflicts (patch applied, Change Target opens the picker, Cancel closes).
- **Overview:** every fixture, checking titles, Target subtitles, Built for Today, reroute detection, block facts, rest labels, anchor rounds, a quality-stop on every Athletic exposure, progression, the monogram fallback, and no "undefined" or "NaN" text anywhere.
- **API client:** request shape, conflict passthrough, and mapping of network, 422 and 409 errors.
- **Local storage:** last Direction, today's workout, a new day resetting, and cache updates.

**Browser end-to-end run.**
- **Setup.** The real `mood_v3` router and training-profile router ran against an in-memory database. The V3 components were bundled for the web with react-native-web and driven with Playwright at a 390 x 844 phone size.
- **Flow tested:**
  - First visit with the Low Energy barrier (prefill on, banner shown).
  - The fourth-State limit.
  - Sore with no area blocking Build, then Sore on Shoulders.
  - Build led to a real Strength Upper Pull, whose Built for Today included "Today's workout shifts stress away from your sore shoulders."
  - The handoff was consumed after that build.
  - Exercise swap changed the workout, and Different workout worked.
  - Start Workout led to the placeholder screen.
  - Back on Home, the Ready to go card showed; tapping Build again with the same inputs reopened the workout without a new generate call.
  - Full Body with sore legs, back and chest produced the real `sore_target_conflict` sheet: Change Target opened the picker, and Let MOOD pick regenerated a rerouted Arms workout.
  - Athletic with sore legs at 30 min was rerouted and showed the Adjusted card.
- **Checked afterwards:** the last Direction was stored as athletic.

Screenshots are in `V3 Updates/Phase2_screens/`. In those web captures, icons are simple circles because the icon font isn't loaded there. On a device you'll see the real Ionicons.

## 14. Device / simulator QA

**What was actually tested:** everything above, including the browser run. **Not tested:** the iOS simulator or your phone, because there is no Mac or Xcode available here. So far nothing has been checked on native iOS.

**Please check in your dev build:**
1. A new account through V3 onboarding. Confirm the new preference labels, then land on the V3 Home with the barrier prefill for that account.
2. An existing account. Home should use its profile's Direction.
3. Tap Build with no changes (the one-tap path).
4. States:
   - Select three, then try a fourth.
   - Sore + Legs with Strength should reroute and show the Adjusted card.
   - Athletic + Sore + Legs should reroute to Power.
5. Strength with Target Chest + Arms, and Sweat with Quads + Glutes.
6. The 30 min option, and the time barrier's SUGGESTED badge.
7. On the Overview:
   - Scroll a Sweat workout and an Athletic one.
   - Swap an exercise, then tap Different workout.
   - Start Workout should open the placeholder.
8. Leave Home and come back. The Ready to go card should show, and Build with the same inputs should reopen the workout.
9. Open `/dev/v3-pack` from the DEV pill and flip through all 24 cases on the phone.
10. Watch these native details:
    - the sticky Build button and its fade above the tab bar;
    - Modal sheet behavior;
    - long exercise names wrapping;
    - how the gradient chips render.

## 15. Known issues

1. **MOOD's Pick won't rotate between days yet.** MOOD's Pick rotation and the "recent workouts" part of the copy depend on completed V3 workouts, and completion isn't wired until Phase 3. Until then, a given MOOD's Pick input tends to repeat the same first-session archetype (for example "Your first Strength session starts with Upper Pull"). Different workout, Target and States still vary it.
2. **Start Workout isn't gated by subscription yet.** It opens the placeholder, so there are no paywall or entitlement checks on V3 sessions, and no free workout is used up. The Phase 3 player needs to adopt the existing workout-start gate.
3. **Home's selections don't survive the app being killed.** They persist while the tab stays mounted, which is normal navigation. Today's generated workout does persist.
4. **The pack viewer adds size to the bundle.** The fixture is about 130 KB and is bundled into every build, although the screen itself is dev-gated. It's easy to drop before release.

## 16. Deferred to Phase 3

- The guided V3 session player (timers, rest, rounds, intervals, quality-stops), replacing `/v3/session`.
- Completion (`POST /api/v3/workouts/{id}/complete`), performance entry, `fit_rating` / `mood_after`, plus keeping the `POST /api/user-workouts` call for streaks and the paywall.
- The workout-start entitlement and paywall gate for V3.
- Swap reasons and in-session swap UX.
- Playing exercise video (only thumbnails are shown now), and cleaning up the media library.
- An advanced workout-type (archetype) picker. It isn't exposed, and nothing in the spec required it for launch.
- An equipment setting in Settings, a body-map for soreness, notification personalization, and deleting V2.
