# MOOD V3: Onboarding, Profile and Workout Input Audit (2026-09-25)

**Scope.** Analysis only; no code was changed. Sources of truth:
- **Frontend:** `frontend/app/onboarding-funnel/*`, `app/onboarding/*`, `app/auth/register.tsx`, `app/index.tsx`, `app/mood-intro.tsx`, `contexts/OnboardingFunnelContext.tsx`, `contexts/AuthContext.tsx`, `utils/onboardingPersonalization.ts`, `utils/moodRoute.ts`, `components/IntensitySelectionModal.tsx`, `app/settings.tsx`, `app/edit-profile.tsx`.
- **Backend:** `backend/server.py` (user models, `/users/me`, `/users/me/funnel-answers`), plus `backend/mood_v3/*` (`CONTRACT.md`, `normalize.py`, the adapters and the frozen engines).
- **Frozen spec:** WA FINAL_FREEZE v17 sheets COLD START + ONBOARDING, GOAL MAPPING and GENERATOR INPUT.

---

## 1. Executive summary

- **None of today's onboarding answers can be sent to `/api/v3` as they are.**
  - The goal ids don't match V3's ids.
  - The level scale is different (four levels, and they are really training frequencies).
  - The length options include 20, 45 and 90, which V3 rejects.
  - The first question ("How do you want to move today?") picks one of the six V2 mood cards, which don't exist in V3.
  - Nothing V3 needs is stored on the server. Answers live in device AsyncStorage, plus a copy inside the `onboarding_completed` analytics event.
- **What the answers actually do in V2:**
  - **Workout effect:** only fitness level and workout length touch workouts, and only by pre-selecting the Beginner / Intermediate / Advanced intensity pill. Mood routes the very first workout.
  - **Goal and barrier:** used only for copy on the reveal screens and for analytics. The goal screen promises "We'll bias every session toward it"; in V2 nothing reads the goal.
- **What goal does in V3:**
  - It routes MOOD's Pick in Strength and Sweat.
  - It picks the default Direction when none is chosen.
  - In Sweat it sets the default Engine mode.
  - In Athletic it makes Performance Support heavier and always-on for the two strength goals.
  - It **never** changes Strength sets, reps or rest.
- **The frozen WA already defines the V3 onboarding** (COLD START + ONBOARDING sheet):
  - training preference;
  - primary goal (6 V3 ids);
  - experience (3 levels);
  - training frequency;
  - barrier (kept only as a light tie-break);
  - preferred length (30 / 60 only);
  - equipment dropped (assume a standard gym).

  The current funnel was never migrated to it.
- **Recommendation: a 5-question funnel.**
  1. Training preference.
  2. Goal.
  3. Experience.
  4. Frequency.
  5. Length.

  Keep the intro, social proof, reveal, paywall, name and wearables screens as they are. Drop the mood and barrier questions. Store the result server-side as `users.training_profile`, and have `/api/v3/workouts/generate` fill any missing fields from it.
- **Existing users migrate without re-onboarding.** Their answers map from `onboarding_completed`. Level maps to both experience and frequency, because the V2 "level" descriptions are frequency bands. Only training preference has no source, and it can be inferred or asked once on a single card.
- **Six founder decisions are listed in section 16.**

---

## 2. Current onboarding funnel (what a new user sees today)

**Entry points.**
- Email signup (`auth/register.tsx`) goes to `/onboarding-funnel/intro`.
- Apple / Google sign-in (`AuthContext.completeSocialAuth`) goes to `/onboarding-funnel/intro` when `completedAt` is absent.
- The landing "Get Started" button and a cold start without `completedAt` route there too (`app/index.tsx`).

**Order (from code, `router.push` / `replace`):**
1. register
2. intro
3. step-1-mood
4. step-2-goal
5. step-3-level
6. step-4-barrier
7. step-5-length
8. step-6-social-proof
9. (name, Apple relay users only)
10. reveal-loading
11. reveal-payoff (paywall)
12. /onboarding/health-connect
13. /mood-intro
14. the first V2 workout screen for the funnel mood

| # | Screen (file) | User-facing question / copy (exact) | Answer options (exact label, saved value) | Required? | Can skip? | Where stored |
|---|---|---|---|---|---|---|
| 0 | Register (`auth/register.tsx`) | "Create Account" | Username *, Email *, Display Name (optional), avatar (optional), Password *, Confirm Password *, and the checkbox "I acknowledge MOOD provides fitness guidance, not medical advice, and I am physically able to exercise. I agree to the Terms of Service, Privacy Policy, and Medical Disclaimer." | Yes (email path) | No | `users` (username, email, name, password hash, avatar); terms stamp |
| 1 | Intro (`intro.tsx`) | "MOOD" / "Training that matches how you feel." / "A few quick questions to personalize your entire experience." | Begin | n/a | No | nothing |
| 2 | Step 1 (`step-1-mood.tsx`) | Eyebrow "Let's start with today". Title "{First name}, how do you want to move today?" (or without the name). Subtitle "There's no wrong answer. MOOD builds around it." | Sweat "High intensity" (`sweat`); Muscle "Strength" (`muscle`); Lazy "Gentle" (`lazy`); Outdoor "Fresh air" (`outdoor`); Calisthenics "Bodyweight" (`calisthenics`); Explosive "Power" (`explosive`) | Yes (Continue is disabled until one is picked) | No | AsyncStorage `@mood_funnel_answers_v1:<uid>`.mood; `user_events` onboarding_step_completed {step:1, answer} |
| 3 | Step 2 (`step-2-goal.tsx`) | Eyebrow "Why you're here". Title "What are you really chasing?" Subtitle "We'll bias every session toward it." Each answer shows a reaction line (for example "Strength-first programming, locked in.") | "Build strength / muscle" (`build_strength`); "Improve physique" (`improve_physique`); "Improve athleticism" (`improve_athleticism`); "Lose weight" (`lose_weight`); "Relieve stress" (`stress_relief`); "Just stay consistent" (`consistency`) | Yes | No | AsyncStorage `.primaryGoal`; step event |
| 4 | Step 3 (`step-3-level.tsx`) | Eyebrow "Where you're at". Title "Be honest — where are you right now?" Subtitle "No judgement. It just sets your starting load." | Sedentary "Little to no regular exercise." (`sedentary`); Casual "Active a few times a month." (`casual`); Active "Training 2–4 times a week." (`active`); Athletic "Training 5+ times a week." (`athletic`) | Yes | No | AsyncStorage `.fitnessLevel`; step event |
| 5 | Step 4 (`step-4-barrier.tsx`) | Eyebrow "What gets in the way". Title "What usually stops you?" Subtitle "This is the thing MOOD is built to beat." | Time "I'm always short on it." (`time`); Energy "I'm wiped out by the time I get to it." (`energy`); Motivation "I struggle to start." (`motivation`); "Don't know what to do" "I freeze on the plan." (`unsure`); Bored "Just need a routine switchup." (`bored`) | Yes | No | AsyncStorage `.biggestBarrier`; step event |
| 6 | Step 5 (`step-5-length.tsx`) | Eyebrow "How much time". Title "How long feels right?" Subtitle "We'll calibrate workouts to your tune." | 20 minutes "Focused session."; 30 minutes "Standard."; 45 minutes "Full session."; 60 minutes "Go long."; 90 minutes "Everything you've got." (saved as the number) | Yes | No | AsyncStorage `.workoutLength`; step event |
| 7 | Step 6 (`step-6-social-proof.tsx`) | Eyebrow "Don't take our word for it". Title "Trusted by those who coach elite athletes." Three testimonials, "600+", "5.0". CTA "Build my profile" | none | n/a | No | nothing |
| 8 | Name (`name.tsx`), **conditional** | "LAST THING" / "What should we call you?" | Free text "First name"; "Build my plan" or Skip | No | **Yes** | `users.name` via `PUT /api/users/me`; AsyncStorage `.firstName` |
| 9 | Reveal loading (`reveal-loading.tsx`) | "PERSONALIZING YOUR MOOD" / "Designing your program"; a radar chart and a scripted "reasoning" stream built from the answers | none (auto-advances after about 7.8 s) | n/a | No | writes `completedAt` (AsyncStorage) |
| 10 | Reveal payoff (`reveal-payoff.tsx`) | Blurb: "Based on your {mood} mood, {goal} goal, and {level} level, we've curated a library of workouts designed specifically for your preferences. Subscribe now to gain unlimited access." Also a feature carousel (includes "Personalized to you" and "Adapts to recovery: Intensity tuned to how recovered you are.") | "Claim Founding Price — $39/year" (founding-eligible) or "Subscribe Now"; "See all plans"; "Start my 7-day free trial"; "Try my first workout — free"; "Have a creator code?"; Restore | n/a | Yes (free path) | fires `onboarding_completed` {mood, primary_goal, fitness_level, biggest_barrier, workout_length, equipment} into `user_events` |
| 11 | Wearables (`onboarding/health-connect.tsx`) | "Connect {Apple Health / Health Connect}." "MOOD uses … to read the health data below and personalize your workouts. Read-only. Never sold. Never used for ads." | Connect, or "Maybe later" | No | **Yes** | OS permission; `setHealthOnboardingComplete` (device); step 8 event |
| 12 | Mood intro (`mood-intro.tsx`) | The interstitial for the funnel mood card ("Sweat / burn fat", "Muscle gainer", and so on) | Continue into that mood's V2 flow | n/a | No (hardware back disabled) | marks the intro seen (device) |

**Conditional screens.** Name (step 8) is shown only when the account is an Apple relay user (`username` starts with `apple_user`) with no name. Payoff CTAs vary by founding eligibility.

**Defaults and preselection.**
- No funnel answer is preselected on first entry.
- Payoff and loading fall back to mood "muscle"/"chosen", goal "consistency"/"your", level "casual"/"current", length 30.

**Transformations.**
- Level and length become an intensity tier via `recommendedIntensity`: sedentary / casual map to beginner, active to intermediate, athletic to advanced. Length of 30 or less maps to beginner, 45 or less to intermediate, otherwise advanced. The lower of the two wins.

**Collected but discarded, or dead.**
- `equipment`: the type, setter and payload key still exist, but the screen was removed (`_layout.tsx`: "step-7-equipment removed"). It is always `undefined` in `onboarding_completed`.
- `feel_better` goal: exists in the type and labels but is not offered.
- `buildForMe` field: its screen was removed.

**Code and docs disagree**
- `onboarding-funnel/_layout.tsx` says the flow ends at `/onboarding/medical-disclaimer`. In code, the payoff routes to `/onboarding/health-connect`. The medical disclaimer is reachable only as a link inside the register acknowledgement (email path). Social sign-ins accept terms through the terms stamp or modal in `AuthContext`.
- `OnboardingFunnelContext.tsx` says answers are local-only and "a future ticket will mirror these to the backend `users.preferences` blob". That never happened; there is no such field.
- The reveal-loading chip labelled with the battery icon shows the **barrier** answer, but its fallback text says "Your level".
- The Sept 18 `MOOD-V3-spec.md` proposed a different onboarding: ranked "what do you usually train for", training days, optional baseline lifts, equipment dropped. The frozen WA COLD START sheet supersedes it.

---

## 3. Current training-profile / data model

**A. Persistent training-profile data (what exists)**

| Field | Source | Stored where | Editable later? | Current consumer(s) |
|---|---|---|---|---|
| mood (`sweat`, `muscle`, `lazy`, `outdoor`, `calisthenics`, `explosive`) | Step 1 | AsyncStorage `@mood_funnel_answers_v1:<uid>`; `user_events` (step + `onboarding_completed` metadata) | No | `mood-intro` / `moodRoute` (first workout); reveal copy; admin analytics mood segmentation |
| primaryGoal (6 V2 ids) | Step 2 | same | No | reveal copy only; analytics |
| fitnessLevel (4 levels) | Step 3 | same | No | `IntensitySelectionModal` preselection; reveal copy |
| biggestBarrier (5) | Step 4 | same | No | reveal-loading copy only; analytics |
| workoutLength (20 / 30 / 45 / 60 / 90) | Step 5 | same | No | `IntensitySelectionModal` preselection; reveal chip |
| equipment | (removed screen) | never written | n/a | none |
| Health permission | Wearables | OS; device flag | OS settings | Home snapshot, live HR, workout stats (not workout generation) |

There is **no training-profile field on the `users` document** (`UserCreate` / `UserResponse` / `UserUpdate` in `server.py`). The only server read path is `GET /api/users/me/funnel-answers`, which reconstructs answers from the latest `onboarding_completed` event.

**B. Account / profile data (not for generation):** username, email, name, bio, avatar, followers/following counts, workouts_count, current_streak, created_at, the founding-member fields, entitlement fields (`is_comp`, `is_internal`, `free_workouts_used`), and terms acceptance. Editable in Edit Profile (name, username, bio, avatar) and Settings (credentials).

**C. Temporary / session data:**
- V2: daily intensity pick, cart, drafts.
- V3: states, soreness, direction, target / archetype, swap context. These are request-scoped. `db.v3_workouts` stores each generated workout, and its completion becomes history.

---

## 4. Onboarding answer → behavior trace

| Input | Screen → state → storage → consumer → behavior | Class | Evidence |
|---|---|---|---|
| Mood | step-1 → `answers.mood` → AsyncStorage + events → `mood-intro.tsx` / `readFunnelMoodId` / `routeForMood` → opens that V2 mood's first decision screen; reveal hero image and copy | **LEGACY** (V2 only; mood cards don't exist in V3) | `mood-intro.tsx` l.40-70, `utils/moodRoute.ts` |
| Goal | step-2 → `answers.primaryGoal` → AsyncStorage + events → reveal-loading (radar, "Mood … goal …" line), reveal-payoff blurb, analytics | **STORED BUT UNUSED** for workouts in V2 (copy only). Not V3-compatible ids | `onboardingPersonalization.ts` header: "Goal, level, barrier and length were written … and read by nothing at all"; only level and length were then wired |
| Fitness level | step-3 → `answers.fitnessLevel` → `recommendedIntensity` → preselects the intensity pill in `IntensitySelectionModal` (user can change it) | **ACTIVE** (weak: a preselection only) | `IntensitySelectionModal.tsx` l.72-86 |
| Barrier | step-4 → `answers.biggestBarrier` → reveal-loading line and chip | **UI ONLY** (persisted, no behavior) | only referenced in `reveal-loading.tsx` |
| Workout length | step-5 → `answers.workoutLength` → `recommendedIntensity` (lower tier wins) | **ACTIVE** (weak). The file itself documents "KNOWN GAP: '20 min' still gets ~30-40" | `onboardingPersonalization.ts` |
| First name | name → `PUT /users/me` | **ACTIVE** (account) | `name.tsx` |
| Wearables | health-connect → OS permission | **ACTIVE** (data display, not generation) | `health-connect.tsx` |
| Equipment | none (screen removed) | **UNKNOWN / dead** | `_layout.tsx` comment; `setEquipment` has no caller |

**For V3: none of these reach `/api/v3`.** No V3 frontend exists yet, and the V3 router reads nothing from the user document or AsyncStorage.

---

## 5. V3 input reconciliation matrix

| V3 input | Required / optional (contract) | Collected in onboarding today? | Persisted? | Current V3 use (code) | Persistent or daily? |
|---|---|---|---|---|---|
| direction | Optional (resolver when omitted) | Indirectly (V2 mood, no V3 mapping) | Device only | Routes to the Direction engine; explicit value wins | **Daily** choice with a profile default |
| states (max 3) | Optional | No | No | Every engine: selection, dials, structure, explanation | **Daily** |
| soreness | Optional | No | No | Hard exclusion, reroute or conflict in every engine | **Daily** |
| target (muscles / full_body) | Optional (Strength, Sweat) | No | No | Strength routing, Custom Target; Sweat routes to Circuit | **Daily** |
| archetype | Optional | No | No | Forces an archetype, else MOOD's Pick | **Daily** |
| duration (30 / 60) | Optional (default 60) | Yes, but 20 / 30 / 45 / 60 / 90 (incompatible) | Device only | Template size in every engine | **Profile default + daily override** |
| experience (3 levels) | Optional (default intermediate) | Yes, as the 4-level "fitness level" (incompatible) | Device only | Hard skill / complexity gates, dosing, beginner rules in every engine | **Persistent** |
| goal (6 V3 ids) | Optional (default stay_consistent) | Yes, but with 6 different V2 ids | Device only | See section 6 | **Persistent** |
| equipment (3 presets) | Optional (default commercial_gym) | No (screen removed) | No | Hard filter in every engine; MOOD's Pick skips archetypes the equipment can't build | **Persistent default + daily override** |
| training_frequency (1-2 / 3-4 / 5+) | Optional (default 3-4) | Not directly; V2 level descriptions are frequency bands | Device only (as level) | Strength MOOD's Pick rotation only (1-2 means Full Body every time; 5+ adds Hinge and Arms) | **Persistent** |
| training_preference | Optional; only used when direction is omitted | No | No | `resolve_direction` only | **Persistent** (default Direction) |
| history | System | n/a | `db.v3_workouts` (completed) | Rotation, recency, protected continuity, progression | System |
| date | System (client local date) | n/a | Stored with the workout | Same-day seed | System |
| persist / swap context | System | n/a | `db.v3_workouts` | Preview vs stored; swap chains | System |
| performance logs (completion) | System | n/a | `v3_workouts.performance_entries` | Exact-exercise progression | System |

**Not in the contract and not used by V3:** biggest barrier, mood, wearables data, demographics. None of these is collected except barrier and mood.

---

## 6. Goal deep dive

1. **Question:** "What are you really chasing?" Eyebrow "Why you're here". Subtitle "We'll bias every session toward it."
2. **Options (label, then saved value):**
   - Build strength / muscle: `build_strength`
   - Improve physique: `improve_physique`
   - Improve athleticism: `improve_athleticism`
   - Lose weight: `lose_weight`
   - Relieve stress: `stress_relief`
   - Just stay consistent: `consistency`

   (`feel_better` exists in the code but isn't shown.)
3. **Saved to:** `answers.primaryGoal` (AsyncStorage) and `onboarding_completed.metadata.primary_goal`. **Only `build_strength` and `improve_athleticism` are valid V3 ids.** The other four would get a 422 from `/api/v3` (`normalize.GOALS`).
4. **Effect in V2:** none on workouts. It shapes reveal copy (radar "Strength" axis, "goal {x}" line, payoff blurb) and the reaction line.
5. **Effect in V3, for each V3 goal id.** Measured on the production path with cold start, intermediate, commercial gym and 3-4 days/week. MOOD's Pick shows the first three sessions in order.

   Sweat's goal row (`sweat_gen.GOAL_ROW`) is "performance" for the two Performance goals, "general" for build_muscle, feel_better_reduce_stress and stay_consistent, and "conditioning" for lose_weight_conditioning.

   | V3 goal | Default Direction (no direction or preference) | Strength MOOD's Pick | Sweat MOOD's Pick | Sweat Engine default mode | Athletic |
   |---|---|---|---|---|---|
   | build_strength | Strength | Lower Squat, Upper Pull, Upper Push | Hybrid, Circuit, Engine | interval | Performance Support always wanted; strength-transfer dose 3 reps / 150 s / 2 RIR |
   | build_muscle | Strength | Upper Pull, Lower Squat, Upper Push | Circuit, Engine, Hybrid | steady | same as build_strength |
   | improve_athleticism | **Athletic** | Lower Squat, Upper Pull, Glutes + Legs | Hybrid, Circuit, Engine | interval | default Performance Support rules (5 reps / 120 s) |
   | lose_weight_conditioning | **Sweat** | Glutes + Legs, Upper Pull, Upper Push | Circuit, Engine, Hybrid | interval | default |
   | feel_better_reduce_stress | Strength (then cycles by history) | Glutes + Legs, Upper Pull, Upper Push | Circuit, Engine, Hybrid | steady | default |
   | stay_consistent | Strength (then cycles by history) | same as feel_better | same as feel_better | steady | default |

6. **Default Direction:** yes, but only when the request omits both `direction` and `training_preference` (`normalize.resolve_direction`).
7. **MOOD's Pick:** yes, in Strength (goal-ordered rotation) and Sweat (rotation). Not in Athletic (its rotation is goal-independent: Full-Body, Power, Speed).
8. **Archetype selection / rotation:** yes, as above (the first archetype and the order).
9. **Exercise selection:** no direct effect in Strength or Sweat. Athletic's Performance Support is always added for the two strength goals, so an extra lift appears.
10. **Sets / reps / rest:** **Strength: no.** Verified identical across goals, and WA REP TARGET RESOLUTION v12 is goal-independent. Sweat: only indirectly, through the Engine mode (steady vs interval). Athletic: Performance Support strength-transfer dose only.
11. **Progression:** no.
12. **Wording that overclaims:**
    - In both V2 and V3: "We'll bias every session toward it." and "Strength-first programming, locked in." In V3, Strength sessions don't change with goal; only the order of archetypes does.
    - "Aesthetic-focused training — sculpt & definition prioritized." (improve_physique): no V2 or V3 behavior.
    - Payoff: "we've curated a library of workouts designed specifically for your preferences."
    - Payoff carousel: "Adapts to recovery / Intensity tuned to how recovered you are."
    - Wearables: "…personalize your workouts." V3 does not read wearable data.
    - Reveal-loading: "Shaping week-to-week progression" and "Designing your program" (there is no multi-week program).

---

## 7. Goal vs Training Preference vs Direction

**How the code behaves:**
- **goal** (V3) routes MOOD's Pick ordering in Strength and Sweat, sets the Sweat Engine default and Athletic support intensity, and is the second-priority default Direction.
- **training_preference** (V3) is used in exactly one place: `resolve_direction`, and only when `direction` is absent. `lifting` maps to Strength, `conditioning` to Sweat, `athletic` to Athletic; `mix` falls through to goal.
- **direction** (V3) is the engine router. If sent, it always wins.
- **V2:** no concept of Direction or training preference. Step 1 "mood" is a daily-framed question ("how do you want to move today?") that sets the first V2 flow.

**Questions answered**
- **What sets a user's default Direction today?** In V3: explicit `direction`, else `training_preference`, else goal, else a Strength, Sweat, Athletic cycle by the last completed V3 Direction. With no goal and no history it defaults to Strength.
- **When preference and goal disagree:** preference wins. The frozen WA says the same ("preference wins initial Direction unless goal is strongly incompatible"). V3 doesn't implement the "strongly incompatible" exception, and there's no need to.
- **When neither exists:** goal defaults to `stay_consistent`, so Direction defaults to Strength, then cycles as history accumulates.
- **Does the user ever choose a default Direction?** No, not today. V2 mood is the closest thing, but it is framed as "today".
- **Does V3 infer it?** Only from preference or goal, then from the history cycle. It does not learn from which Direction the user actually picks.
- **Should Direction be persistent?** No. Direction is a daily choice. Its **default** should come from the persistent training preference, with the last-used Direction as the practical default once history exists. That's one tap to confirm or change on Home.

**Conclusion: the three are distinct, not redundant.** Preference answers "what do I usually do", goal answers "why", and Direction answers "today". The overlap is only that goal is a fallback for preference. That fallback is useful because it means onboarding can work even if the preference screen is cut.

---

## 8. Persistent vs daily input recommendation (from actual V3 behavior)

| Persistent Training Profile (ask once) | Why persistent |
|---|---|
| experience | Hard eligibility gates in every engine; stable for months |
| goal | Routes MOOD's Pick, the Sweat mode and Athletic support; stable |
| training_preference | The default Direction for the home card |
| training_frequency | Strength MOOD's Pick specialization (1-2 means Full Body); stable |
| default_duration (30 / 60) | Used every session; worth remembering |
| default_equipment | A hard filter; rarely changes; **default commercial_gym and don't ask at signup** |

| Today's Workout (each session) | Notes |
|---|---|
| states (0-3), soreness | Core daily input |
| direction | Prefilled from preference or last used |
| target / archetype | Optional; MOOD's Pick by default |
| duration override | Prefilled from the profile |
| equipment override | Only when away from the usual gym; low priority UI |

---

## 9. Wasted onboarding friction

| Current question | Verdict | Reason |
|---|---|---|
| Step 1 "How do you want to move today?" (6 V2 moods) | **CHANGE** | V2 mood cards don't exist in V3. Replace it with the WA "training preference" question, which sets the default Direction. |
| Step 2 Goal | **CHANGE** | Keep the question, but re-map it to the 6 V3 goal ids and soften the "bias every session" copy. |
| Step 3 Fitness level (4 frequency-based levels) | **CHANGE** | V3 needs Beginner / Intermediate / Advanced; the current options describe frequency, not ability. |
| Step 4 Barrier | **REMOVE** (or DEFER) | V3 doesn't use it; today it only drives reveal copy. Its analytics value is the only reason to keep it. |
| Step 5 Length (20 / 30 / 45 / 60 / 90) | **CHANGE** | V3 supports only 30 and 60; three of the five options can't be honored. |
| Step 6 Social proof | **KEEP** | Conversion screen, no input. |
| Name (Apple only) | **KEEP** | Already conditional and skippable. |
| Reveal loading | **KEEP, fix the copy** | Keep the moment. Remove the "week-to-week progression" and "program" claims, and fix the barrier / "Your level" chip mix-up. |
| Reveal payoff | **KEEP, fix the copy** | The blurb references "{mood} mood"; the "Adapts to recovery" card overclaims. |
| Wearables | **KEEP** | Real feature. Soften "personalize your workouts". |
| Mood intro (post-onboarding) | **REMOVE for V3** | It hands off to a V2 mood flow; V3 should land on Home / Today's Workout. |
| Register "Display Name (optional)" | KEEP | Account. |

---

## 10. Missing high-value inputs

| Input | Used by V3? | Stable? | Asking once helps? | Verdict |
|---|---|---|---|---|
| Training frequency | Yes (Strength MOOD's Pick) | Yes | Yes (1-2 day users otherwise get split sessions) | **Collect, but fold it into the experience screen** (WA allows "combine with Experience"). |
| Training preference | Yes (default Direction) | Yes | Yes (a correct first card) | **Collect** (it replaces the mood question, so there's no extra screen). |
| Equipment | Yes (hard filter) | Yes | Marginal. Most users are in a commercial gym; the frozen WA and the V3 spec both say don't ask up front. | **Don't ask at signup.** Default commercial_gym and offer it in the Training Profile, plus a one-time prompt after the first "don't have this" swap (post-launch). |
| Baseline lifts, demographics, rep maxes | No | n/a | n/a | Don't add. |

---

## 11. Profile editing

A new **Training Profile** section in Settings (next to Health Data) is the only place these live. Every field is editable. No reset is needed for any change, and history stays valid (history is keyed by the exercises and archetypes actually completed).

| Field | Editable | Effect on future workouts |
|---|---|---|
| experience | Yes | Changes eligibility gates from the next generation. Protected primaries may change, which is logged and allowed by WA. |
| goal | Yes | Changes MOOD's Pick ordering, the Sweat mode default and Athletic support. |
| training_preference | Yes | Changes the default Direction on the Home card. |
| training_frequency | Yes | Changes Strength MOOD's Pick specialization. |
| default_duration | Yes | Prefill only. |
| default_equipment | Yes | A hard filter from the next generation. |

---

## 12. New-user defaults (backend, when a field is missing)

These come from `normalize.py` and the adapters.

| Field | Backend default | Risk |
|---|---|---|
| direction | training_preference, else goal, else Strength | Invisible if the frontend omits `direction`. **Always send direction from the Home card.** |
| archetype | MOOD's Pick (Strength: the goal / frequency rotation; Sweat: the goal rotation; Athletic: Full-Body first) | fine |
| duration | 60 | fine, and it matches WA |
| equipment | commercial_gym (Sweat includes a sled) | fine; a user without a sled can swap |
| experience | **intermediate** | **Risky**: a true beginner gets intermediate gates if the frontend doesn't send experience. |
| goal | stay_consistent | fine, but the UI never says so |
| training_frequency | 3-4 | fine |
| training_preference | none | goal decides |
| history | V3 history only | **Existing users look like new users in V3.** V2 `user_workouts` are not read, so the explanation "Your first Strength session starts with …" would show to people who have trained for months (a copy issue). |
| date | server UTC date | The frontend should send the local date, or same-day determinism shifts at UTC midnight. |

---

## 13. Returning-user migration

Source: the latest `onboarding_completed` event (`GET /users/me/funnel-answers` already exists), falling back to AsyncStorage.

| V3 profile field | Classification | Mapping |
|---|---|---|
| goal | **Can map safely** | build_strength → build_strength; improve_physique → build_muscle; improve_athleticism → improve_athleticism; lose_weight → lose_weight_conditioning; stress_relief → feel_better_reduce_stress; consistency → stay_consistent; feel_better → feel_better_reduce_stress |
| experience | **Can map safely** | sedentary, casual → beginner; active → intermediate; athletic → advanced (same mapping V2 already uses in `onboardingPersonalization.ts`) |
| training_frequency | **Can map safely** | sedentary, casual → 1-2; active ("2–4 times a week") → 3-4; athletic ("5+") → 5+ |
| default_duration | **Can map safely** | 20, 30 → 30; 45, 60, 90 → 60 (V3's "60" sessions estimate at about 40-50 min, so 45 fits) |
| training_preference | **Should ask once** (or infer) | V2 mood is a daily question. The best inference is `muscle`/`calisthenics` → lifting, `sweat`/`outdoor`/`lazy` → conditioning, `explosive` → athletic. That's weak. A one-card "What do you usually train?" on first V3 open is cleaner. |
| default_equipment | **Can default safely** | commercial_gym |
| Users with no `onboarding_completed` (pre-funnel accounts) | **Can default safely** | Defaults above, plus the one-card prompt for experience and preference. Check how many users are in this group. |

Nobody needs to redo the full funnel.

---

## 14. Proposed V3 onboarding (minimum viable)

These are unchanged: register, intro, social proof, name (Apple only), reveal loading (copy fixes only), reveal payoff (copy fixes only) and wearables.

| # | Screen | Question | Options (value) | Required | Profile field | Behavior it drives |
|---|---|---|---|---|---|---|
| 1 | Intro | as today | Begin | n/a | none | n/a |
| 2 | Training preference (replaces mood) | "What do you usually train?" | Lifting / Strength (`lifting`); HIIT / Conditioning (`conditioning`); Athletic training (`athletic`); Mix of everything (`mix`) | Yes | training_preference | Default Direction on Home. `mix` falls back to goal. |
| 3 | Goal (re-mapped) | "What are you training for?" | Build Strength (`build_strength`); Build Muscle / Physique (`build_muscle`); Improve Athleticism (`improve_athleticism`); Lose Weight / Conditioning (`lose_weight_conditioning`); Feel Better / Reduce Stress (`feel_better_reduce_stress`); Stay Consistent (`stay_consistent`) | Yes | goal | MOOD's Pick order (Strength, Sweat), Sweat Engine mode, Athletic support; the Direction fallback for `mix` |
| 4 | Experience + frequency (one screen, two short rows) | "Where are you at?" / "How often do you train?" | Beginner / Intermediate / Advanced; 1-2 / 3-4 / 5+ days a week | Yes | experience, training_frequency | Eligibility gates and dosing in every Direction; Strength split specialization |
| 5 | Length | "How long do you usually have?" | 30 minutes / 60 minutes | Yes (preselect 60) | default_duration | Prefills Today's duration |
| 6 | Social proof, (name), reveal, payoff, wearables | as today | as today | n/a | none | n/a |
| after | Land on Home / Today's Workout | State chips + Direction card | n/a | n/a | n/a | first `/generate` |

**Removed:** the mood question, the barrier question and mood-intro.

**Net:** 4 input screens (from 5), each with a real downstream job.

---

## 15. Proposed V3 Training Profile (`users.training_profile`, not implemented)

| Field | Source | Allowed values | Default | Editable | V3 consumer | Effect |
|---|---|---|---|---|---|---|
| training_preference | Onboarding screen 2 / migration prompt | lifting, conditioning, athletic, mix | none (goal decides) | Yes | Home default Direction (frontend); `resolve_direction` | Which Direction the Home card proposes |
| goal | Onboarding screen 3 / migrated | the 6 V3 ids | stay_consistent | Yes | `normalize`, Strength / Sweat MOOD's Pick, Sweat engine mode, Athletic support | Session ordering and some Sweat / Athletic character |
| experience | Screen 4 / migrated | beginner, intermediate, advanced | beginner **if unknown** (a safer default than today's intermediate) | Yes | all engines | Exercise eligibility, dosing, beginner rules |
| training_frequency | Screen 4 / migrated | 1-2, 3-4, 5+ | 3-4 | Yes | Strength MOOD's Pick | Full Body vs split rotation |
| default_duration | Screen 5 / migrated | 30, 60 | 60 | Yes | request prefill | Session template |
| default_equipment | Settings only | commercial_gym, free_weight_limited, minimal | commercial_gym | Yes | all engines | Hard equipment filter |
| profile_source / updated_at | system | onboarding_v3, migrated_v2, user_edit | n/a | No | support / analytics | Explains where values came from |

**Implementation note for the build phase.** Add `GET/PUT /api/users/me/training-profile`. Have `/api/v3/workouts/generate` fill any omitted profile fields from `users.training_profile` (the request still wins). This is a small router change, not a generator change.

---

## 16. Founder Decisions Needed

**1. Replace the "mood" question with Training Preference?**
- **Current behavior:** Step 1 asks "how do you want to move today?" with the 6 V2 moods. It feeds only the V2 first-workout route.
- **Option A:** Swap it for WA's 4-option training preference. Same screen slot, no extra friction.
- **Option B:** Drop it entirely and let goal set the default Direction.
- **Recommendation: A.** It gives the right first Home card (for example, a "lose weight" user who loves lifting). Goal alone guesses Direction poorly for the four general goals.

**2. Drop the barrier question?**
- **Current behavior:** It is asked and stored; it drives only reveal copy and analytics. V3 doesn't use it.
- **Option A:** Remove it (one fewer screen).
- **Option B:** Keep it for analytics and reveal copy.
- **Recommendation: A.** It has no V3 job. The WA frozen tie-break role was never implemented, and implementing it would be the speculative personalization you asked to avoid.

**3. Experience and frequency: one combined screen, or ask only experience?**
- **Current behavior:** One 4-level question that mixes ability and frequency.
- **Option A:** One screen with two short rows (experience plus days/week).
- **Option B:** Ask only experience; default frequency to 3-4.
- **Recommendation: A.** Frequency materially changes Strength MOOD's Pick (1-2 days means Full Body). Combining the two costs no extra screen.

**4. How to fix the overclaiming copy before launch**
- **Current behavior:** "We'll bias every session toward it", "Strength-first programming, locked in", "Aesthetic-focused…", "Adapts to recovery", "personalize your workouts" (wearables) and "week-to-week progression".
- **Option A:** Rewrite to claims V3 can back. For example, goal: "We'll use it to choose which sessions come first." Recovery and wearables: drop the claim or reword it.
- **Option B:** Leave it.
- **Recommendation: A.** The V3 spec's own principle is that "whatever the UI claims was adapted must correspond to a real rule."

**5. Existing users' training preference: infer it or ask?**
- **Current behavior:** There is no source field; V2 mood is a weak proxy.
- **Option A:** Ask once with a single card on first V3 open (it can also confirm the migrated experience and duration).
- **Option B:** Infer it from V2 mood silently.
- **Recommendation: A.** One tap, correct data, and a natural "MOOD got an upgrade" moment. Every other field migrates silently.

**6. Where the profile lives**
- **Current behavior:** Device AsyncStorage plus an analytics event; nothing on the user document.
- **Option A:** A `users.training_profile` field plus a Training Profile section in Settings; the V3 router fills request gaps from it.
- **Option B:** Keep everything client-side and send it on every request.
- **Recommendation: A.** It survives reinstalls and second devices (the V2.1 recovery endpoint exists precisely because of this problem), and it lets the backend default safely.

**Not a founder decision, just an implementation note:** default experience to beginner when unknown; send the local date and the Direction from the frontend; and make the "first session" explanation line check V2 history so long-time users don't see it.
