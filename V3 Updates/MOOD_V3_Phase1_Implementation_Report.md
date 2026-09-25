# MOOD V3 Frontend Rehaul: Phase 1 Implementation Report

Training Profile + Onboarding. Phase 2 (V3 Home and workout creation) has not been started.

**Recommendation: READY FOR PHASE 2**

## 1. Git

| | |
|---|---|
| Branch | `feature/mood-v3-app-rehaul` (from `main` at `0224454`) |
| Snapshot of your pre-existing uncommitted V2.1 work | `3583f025` |
| Phase 1 starting commit | `b0c3e8ec` (mood_v3 backend + V3 specs) |
| Phase 1 code commit | `b653e84f` |
| Ending commit | this report's commit, directly after `b653e84f` |
| Status | clean apart from items I left untouched on purpose: 8 untracked `backend/hero_uploads/*.jpg` and an Excel lock file (`~$MOOD_V3_Athletic_Founder_Pack.xlsx`, which exists because the workbook is open) |

No repository copy was made. V2 is still fully available. Setting `V3_ONBOARDING_ENABLED = false` in `frontend/utils/v3Profile.ts` brings back the V2 funnel in a dev build, and the V2 workout flows were not touched.

## 2. What was implemented

- **Persistent training profile.** It's stored server-side on `users.training_profile` and exposed through `GET/PUT /api/users/me/training-profile`, with enum validation.
- **Generator fallback.** `/api/v3/workouts/generate` now fills in missing fields from the profile, in this order: explicit request, then training profile, then backend default. This happens only in the API layer. The generator itself was not changed and the frozen regression is green.
- **New onboarding.** The funnel is now five V3 questions: preference, goal, experience, frequency and barrier. The V2 mood, workout length and equipment questions are no longer part of the flow.
- **Reveal-loading.** It now processes the real profile ("TRAINING STYLE → MIX", and so on) and saves it. The fake claims are gone.
- **New Training Profile Reveal screen.** It shows "YOUR MOOD PROFILE", "PRIMARY FOCUS" and "TRAINING STYLE", plus three insights from deterministic templates.
- **Existing-user re-onboarding.** Existing users see "MOOD got an upgrade." It's controlled by a separate V3 completion marker and the server profile, not by the V2 `completedAt`.
- **Settings.** A new Settings > Training Profile row reuses the same 5 questions in edit mode.
- **First-Home handoff for Phase 2.** It carries the profile, a first-visit flag, the barrier prefill, the default Direction, 60 min and commercial gym.
- **Analytics.** Covered for every funnel step, the save, the reveal, the paywall and completion. New users and upgrades are distinguished.

## 3. Onboarding screen order and values

**New user:** intro → Q1 to Q5 → social proof (step 6) → name (Apple private-relay users only, as before) → reveal-loading (saves the profile) → **profile-reveal** → reveal-payoff (paywall #1, `post_onboarding_soft` / founding) → health-connect → `/(tabs)`.

| # | Route | Question | Options → stored ID |
|---|---|---|---|
| 1 | `v3-preference` | What do you usually train? | Strength Training → `lifting`, Conditioning / Sweat → `conditioning`, Athletic Training → `athletic`, Mix of Everything → `mix` |
| 2 | `v3-goal` | What are you training for? | Build Strength → `build_strength`, Sweat / Burn Fat → `lose_weight_conditioning`, Improve Physique → `build_muscle`, Improve Athleticism → `improve_athleticism`, Feel Better / Reduce Stress → `feel_better_reduce_stress`, Stay Consistent → `stay_consistent` |
| 3 | `v3-experience` | What's your training experience? | Beginner → `beginner`, Intermediate → `intermediate`, Advanced → `advanced` (each with supporting copy) |
| 4 | `v3-frequency` | How often do you usually train? | 1–2 days a week → `1-2`, 3–4 days a week → `3-4`, 5+ days a week → `5+` |
| 5 | `v3-barrier` | What usually gets in the way? | Time → `time`, Low energy → `low_energy`, Motivation → `motivation`, Don't know what to do → `dont_know`, Boredom → `boredom` |

- **Labels.** All labels live in `utils/v3Profile.ts` so Phase 2 Home uses the same ones.
- **Reaction lines.** Each answer shows a one-line reaction that only describes real V3 behavior. For example, frequency controls the Strength split rotation, and experience controls exercise eligibility. The phrase "We'll bias every session toward it" is not used.
- **Not asked:** duration and equipment. The system defaults are 60 minutes and commercial gym.
- **Progress bar.** It reads 1–6 of 6 for new users and 1–5 of 5 for upgrade and edit.

## 4. Training Profile: schema, endpoints, persistence

`users.training_profile`:

| Field | Values |
|---|---|
| training_preference | lifting, conditioning, athletic, mix |
| goal | build_strength, build_muscle, improve_athleticism, lose_weight_conditioning, feel_better_reduce_stress, stay_consistent |
| experience | beginner, intermediate, advanced |
| training_frequency | 1-2, 3-4, 5+ |
| biggest_barrier | time, low_energy, motivation, dont_know, boredom |
| default_duration | 30, 60 (defaults to 60; onboarding never sets it) |
| default_equipment | commercial_gym, free_weight_limited, minimal (defaults to commercial_gym) |
| profile_source | onboarding_v3, reonboarding_v3, user_edit |
| created_at, updated_at, completed_at (set once), version | server-managed |

The enum sets are asserted against `mood_v3.normalize`, so the profile can never hold a value that `/api/v3` would reject. The profile never stores a daily State, soreness or Target.

**`GET /api/users/me/training-profile`** returns `{profile, complete, default_direction, version}`, with defaults filled in. A user with no profile gets the defaults and `complete: false`.

**`PUT /api/users/me/training-profile`**:
- Takes a partial update that is merged into the existing profile.
- Rejects unknown keys and bad enum values with a 422, and an empty body with a 422.
- Leaves every other user field untouched.

It lives in `backend/training_profile.py` and is mounted in `server.py`, next to the `/api/v3` router.

**`/api/v3/workouts/generate` fallback** (`backend/mood_v3/profile_defaults.py`):
- Applies to goal, experience, training_frequency, training_preference, equipment (from `default_equipment`) and duration (from `default_duration`).
- A field counts as explicit only when it is present in the request and not null.
- The envelope now includes `profile_defaults_applied`, which lists the fields that came from the profile.
- `CONTRACT.md` is updated.

## 5. Existing-user re-onboarding

`components/V3ProfileGate.tsx` is mounted in `app/_layout.tsx`. It only acts on the `(tabs)` segment, for signed-in non-guest users, and runs at most once per session. Its checks, in order:

1. It defers while the signup funnel or health onboarding is still owed, so a new signup is never routed twice.
2. The local V3 marker `@mood_v3_profile_done_v1:<uid>` is present: done.
3. The local answers are complete but were never saved (for example, the user was offline at the end of the funnel): it retries the PUT.
4. It checks the server profile. If complete, it caches the marker. If incomplete, it goes to `/onboarding-funnel/upgrade`. If the request fails, it does nothing this session (fails open).

What the user sees:
- The upgrade screen reads: "MOOD got an upgrade." / "Workouts now adapt to how you train, what you're working toward, and how you feel today." / "Let's set up your training profile. Five questions, about 30 seconds."
- They then answer the 5 questions, see reveal-loading and the profile reveal, and land on Home.
- There is no paywall, health step or account creation.
- There is no V2 to V3 migration. The V2 `completedAt` is not used as the signal.

**Edit mode:** Settings > Training Profile opens `upgrade?mode=edit`, pre-filled from the server. It has Cancel, saves with `profile_source: user_edit`, returns to Settings, and does not re-arm the first-Home prefill.

## 6. Reveal mappings

**Loading.**
- Title: "Building your MOOD profile".
- Stream: Reading your answers, then TRAINING STYLE → X, GOAL → X, EXPERIENCE → X, FREQUENCY → X, BIGGEST BARRIER → X, then Matching exercises to your experience, Setting your default session: {Direction} · 60 min, Saving your MOOD profile.
- Radar axes are Strength, Conditioning, Power, Experience, Frequency and Variety. They are a picture of the answers, not a score.
- Removed: "Designing your program", week-to-week progression and recovery claims.

**Profile Reveal:**
- **Headline:** experience · frequency, for example "Advanced · 5+ days / week".
- **PRIMARY FOCUS:** the goal label. **TRAINING STYLE:** the preference label.
- **HOW MOOD STARTS YOU:** the default Direction · 60 min. It's resolved like the backend: preference, then goal (Sweat / Burn Fat → Sweat, Improve Athleticism → Athletic), then Strength. Strength users also get the rotation by frequency: 1–2 is full body, 3–4 rotates upper / lower / pull, and 5+ is a full split including hinge and arm days.
- **YOUR EDGE, by barrier:**
  - Time: "Making short sessions count."
  - Low energy: "Training on a low battery."
  - Boredom: "Keeping training fresh."
  - Motivation: "Getting you started."
  - Don't know: "Taking out the guesswork."
- **BUILT FOR YOUR LEVEL:** by experience.

**Payoff (paywall #1).** The payment logic is unchanged. Only the copy changed:
- Hero image by preference.
- Headline "{name}, your profile is ready!".
- A profile-based blurb.
- The carousel card "Adapts to recovery" is replaced with "Adapts to how you feel" (energy and soreness).

**Health-connect.** The copy is softened from "personalize your workouts" to "show it alongside your training". In V3 it routes to `/(tabs)` instead of `mood-intro`.

## 7. First-Home handoff (what Phase 2 consumes)

AsyncStorage `@mood_v3_first_home_v1:<uid>`, via `readFirstHomeHandoff(uid)` / `consumeFirstHomeHandoff(uid)` in `utils/v3Profile.ts`:

```
{ version: 1, pending: true, created_at, mode: 'new' | 'upgrade',
  default_direction: 'strength' | 'sweat' | 'athletic',   // from the server response
  default_duration: 60, default_equipment: 'commercial_gym',
  profile: {training_preference, goal, experience, training_frequency, biggest_barrier},
  prefill: { states: ['low_energy'] | ['bored'] | [], suggest_duration: 30 | null,
             emphasize_moods_pick: boolean, copy_key: <barrier> } }
```

- `pending: true` means this is the first V3 Home visit.
- Phase 2 shows the prefill as visible, removable chips, then calls `consumeFirstHomeHandoff` after the first generate or dismiss. That clears `pending` and sets `prefill` to null, so a barrier never becomes a standing daily State.
- Barrier rules:
  - Low energy preselects Low Energy.
  - Boredom preselects Bored.
  - Time suggests 30 min, while the default stays 60.
  - Don't know and Motivation emphasize MOOD's Pick.
- The server profile, via `fetchTrainingProfile`, is the long-term source for every later visit.
- `biggest_barrier` stays on the profile for future notification personalization. No notification work was done.

## 8. V3 vs V2 inventory

| Status | Items |
|---|---|
| **V3 (live on this branch)** | `v3-preference/goal/experience/frequency/barrier`, `upgrade`, `profile-reveal`, V3 paths in `intro`, `reveal-loading`, `reveal-payoff`, `health-connect`; `V3ProfileGate`; Settings Training Profile row; `utils/v3Profile.ts`, `utils/v3ProfileCopy.ts`, `V3QuestionScreen`; backend `training_profile.py`, `profile_defaults.py` |
| **Still V2 and in use** | social proof, name, reveal-payoff purchase / founding / restore / creator code / skip logic, health-connect, all V2 workout flows and `mood-intro` (reachable from V2 workout entry points), `completedAt` routing (still set for new users so `index.tsx` and `FunnelEntryGate` work), `IntensitySelectionModal` (now falls back to V3 experience) |
| **Unreachable but retained** | `step-1-mood`, `step-2-goal`, `step-3-level`, `step-4-barrier`, `step-5-length`; the V2 radar / thoughts code in `reveal-loading`; the V2 blurb in `reveal-payoff`; V2 answer fields (`mood`, `primaryGoal`, `fitnessLevel`, `biggestBarrier`, `workoutLength`, `equipment`) |
| **Deletable after V3 ships** | the five V2 step screens and their `FunnelAnswers` fields and setters, the V2 branches in `reveal-loading` / `reveal-payoff`, `markWorkoutHandoffPending` + `mood-intro` once Phase 2 Home replaces them, and the `V3_ONBOARDING_ENABLED` flag |

## 9. Analytics

Every event carries `funnel_version: 'v3'` and `mode` (new, upgrade or edit).

- **Funnel started:** `onboarding_step_completed` with `step 0 / intro` for new users, plus `v3_reonboarding_started` or `v3_profile_edit_started` for the other modes.
- **Each question:** `onboarding_step_viewed` and `onboarding_step_completed`, with `question`, `answer` and `time_spent_ms`.
- **Profile saved:** `v3_training_profile_saved`, with all 5 values, `profile_source`, `saved`, `default_direction` and `retried`.
- **Upgrade prompt shown:** `v3_reonboarding_prompted`.
- **Reveal and paywall:**
  - `reveal_screen_viewed` for stage `loading` and stage `profile` (the profile stage includes the values).
  - `reveal_cta_tapped` for stage `profile`.
  - `paywall_viewed` is unchanged.
- **Completion:** `onboarding_completed` now also carries the V3 fields, `funnel_version` and `v3_profile_saved`. Its fire-on-arrival logic also waits for V3 answers, not just the V2 `mood`.

## 10. Files changed (29, +1573 / -37)

- **Backend:**
  - New: `training_profile.py`, `mood_v3/profile_defaults.py`, `mood_v3/tests/test_training_profile.py`.
  - Changed: `server.py` (3 lines), `mood_v3/router.py`, `mood_v3/tests/test_router.py` (a test double fix only), `mood_v3/CONTRACT.md`.
- **Frontend new:** the 5 `v3-*.tsx` screens, `upgrade.tsx`, `profile-reveal.tsx`, `components/V3ProfileGate.tsx`, `components/onboarding/V3QuestionScreen.tsx`, `utils/v3Profile.ts`, `utils/v3ProfileCopy.ts`.
- **Frontend modified:** `app/_layout.tsx`, `onboarding-funnel/_layout.tsx` (a comment only), `intro.tsx`, `reveal-loading.tsx`, `reveal-payoff.tsx`, `onboarding/health-connect.tsx`, `settings.tsx`, `IntensitySelectionModal.tsx`, `FunnelLayout.tsx` (an optional `totalSteps` prop), `OnboardingFunnelContext.tsx`, `utils/analytics.ts` (wider metadata types).

The Strength, Sweat and Athletic workout architecture and the generator engines were not touched.

## 11. Tests (run on your machine)

| Command | Result |
|---|---|
| `python3 -m pytest -q mood_v3/tests -m "not slow"` | **28 passed** (router, integration, 16 training-profile tests) |
| `python3 -m pytest -q mood_v3/tests -m slow` (frozen parity) | **4 passed** |
| `python3 -m mood_v3.qa.run_unified_qa` | **all_green, 0 failures** |
| `npx tsc --noEmit` | 86 errors, **the same set as the pre-change baseline, so no new errors** |
| `npx expo export --platform ios` | **exit 0**, 15.7 MB bundle; new routes, gate and copy confirmed in the bundle; "Adapts to recovery" confirmed gone |
| Frontend logic harness (esbuild + node, 1080 profile combos) | **0 failures** |

The training-profile tests cover:
- An empty profile returns defaults.
- The PUT/GET round-trip leaves account fields untouched.
- Partial updates merge.
- Enum validation, with 7 bad-value 422 cases.
- An incomplete profile is not marked complete.
- Generation uses the profile when fields are omitted.
- An explicit request value overrides the profile.
- With no profile, the backend defaults apply.
- A profile-filled request produces the same workout as the equivalent explicit request.

The logic harness checked:
- The default Direction matches the backend rule for every combination.
- Every reveal has 3 insights.
- No reveal or loading copy contains "program", "progression", "recover", "wearable", "designing" or an em dash.
- Radar bounds.
- Each barrier's prefill.
- The handoff write, read and consume.
- The completion marker is per-user.
- The PUT body sends only the 5 answers plus `profile_source`, never duration or equipment.

## 12. Frozen regression

- Unified QA: A grid 8424 builds, 0 failures; 0 unexpected commercial conflicts; swaps 0 failures; conflicts 12/12; progression pass; negative checks 6/6 caught; determinism 3/3 identical.
- Frozen parity: 4/4.
- Profile fallback is a no-op when nothing is omitted, so frozen outputs are unchanged.

## 13. Known issues

1. **Not run on a device or simulator.** Verification was tests, typecheck, bundle and a logic harness. Please do one pass in your dev build of each flow: new signup, upgrade (an existing account with no profile), and Settings edit.
2. **Upgrade is required once per session.** The funnel stack has gestures disabled, so an existing user can't skip the upgrade. If they close the app mid-way, they're prompted again on the next launch.
3. **Offline at the end of the funnel.** The user still lands on the reveal. The save is retried by the gate on the next Home visit. Until then the upgrade prompt is suppressed only if that retry succeeds or the server can't be reached.
4. **Typed routes.** The new routes are cast `as any` until Expo regenerates its typed-routes file on the next `expo start`.
5. **`default_duration` / `default_equipment` can't be edited in the app yet.** They are only set server-side, which is intended for Phase 1.

## 14. Deferred

- V3 Home, State / soreness / Target UI, the MOOD's Pick card, and consuming the first-Home handoff (Phase 2).
- Barrier-personalized notifications.
- Editing duration and equipment preferences.
- Deleting the V2 funnel screens and fields once V3 ships.
