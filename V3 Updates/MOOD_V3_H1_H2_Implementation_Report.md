# MOOD V3 · H1 Home + Build · H2 Workout Cart · Implementation Report

Scope: H1 (Home + Build) and H2 (read-first Cart) only. No Guided Session, no Cart edit mode, no stats or community, no Quick Starts, and no programming changes (no backend file touched). Stopping here for founder review.

**The short answer to the review question:**
- **Home** now opens on a full-screen athlete photo with a greeting, the State chips and one gold CTA. The generator form has moved off Home.
- **Cart** is one calm screen: a photo, the plan and Start. It replaces the Preview and Details pair.

Screenshots are in `V3 Updates/H1H2_screens/`. `H1H2_overview.png` shows the seven requested screens plus Home with today's workout.

---

## 1. What changed

### H1 · Home (Today Hero)

**Layout.** The hero fills the first screen: a Direction portrait, the date, a time-of-day greeting, one line of real context, "How are you showing up today?" with 6 State chips, a **Build Today's Workout** CTA and a default summary line ("Strength · 60 min · MOOD's Pick").

**Hero states that exist today:**
- **A. Nothing built today.** The Build state described above.
- **B. Built today (by the running engine).** The hero becomes "TODAY'S WORKOUT":
  - title, then Direction · ~estimated min · States;
  - an **Open Workout** CTA;
  - the chips stay visible below.
  - If the chips still match the workout, the secondary button reads "Build a different workout". If they no longer match, it changes to "**Build for how you feel now**", so the chips never make the workout on screen ambiguous.

**Continue / Done are not built.** `HeroMode` includes `'continue' | 'done'` as the Guided Session's extension points, but nothing can reach them yet.

**States:**
- Optional, max 3, with the same limit hint as before.
- They persist **for the day**, per user (`@mood_v3_day_states_v1:<uid>`).
- Chips give light haptics.
- If Sore is picked on Home, a quiet line says the areas are chosen on the next screen.

**Context line (real data only):**
- "Your first MOOD workout starts here." on a first visit (from the onboarding handoff).
- "N-day training streak." when the **workout** streak is 2 or more. The source is `/api/achievements/state` → `workout_streak`, which counts workout days. The app-open streak is never used.
- Otherwise the line is hidden.

**First visit.** The onboarding barrier prefill (e.g. Low Energy) shows as pre-selected, removable chips with its one-line explanation. Once a workout is built with those chips, they become that day's States.

**Motion:**
- slow 18 s image drift (scale 1.00 to 1.06);
- crossfade when the hero image changes;
- the summary line fades when it changes;
- `bg.mp4` is not used.

**Quick Starts.** A `QuickStartsSlot` sits directly under the hero and renders nothing yet, so H3 drops in without layout rework.

**Tab.** Renamed Workouts → **Home** (home icon). The route is still `index`, so analytics tab names are unchanged.

### H1 · Build screen (`/v3/build`)

**Order:**
1. Direction: three image cards.
2. State: carried over from Home and editable. Edits write back to today's States, so Home reflects them.
3. Focus: "MOOD's Pick" with its explanation; Change opens the existing sheet for Focus, Workout Type and Difficulty, with Length hidden.
4. **Time available**: 60 or 30, with the line "MOOD builds a complete session that fits inside this window, so it can finish early."
5. **Build Workout**.

**Defaults:**
- Direction: last used, else the profile's `default_direction`.
- Length: the profile's **`default_duration`**, else the handoff's, else 60. It is no longer hardcoded to 60.
- Difficulty: the profile's `experience`.
- Nothing the profile already knows is asked again.

**Preserved from Phase 2.6, unchanged:**
- State limits and Sore areas;
- the Target vs Workout Type rules;
- the conflict sheet and all its options;
- request signatures;
- "same inputs, same day, same engine = reopen, don't regenerate".

**After a build**, Build is *replaced* by the Cart, so Back from the Cart returns to Home.

**Disabled CTA.** The disabled "Pick where you're sore" state is now a neutral surface. The old dimmed-gold version rendered as the banned flat mustard.

### H1 · Today cache (`utils/v3TodayModel.ts`, `utils/v3Today.ts`)

- The one-entry cache is now a **day of builds keyed by request signature**, capped at 10.
- A `primary` pointer marks the Home hero's workout.
- A `source: 'build' | 'quick_start'` field is ready for H3, so a Quick Start can never overwrite the main daily build.
- The old v1 key is read once and migrated.
- Envelope refresh never goes backwards in `version`.

### H2 · Workout Cart (`/v3/workout`, replaces Preview + Details)

**Hero:**
- workout image (see the image mapping below);
- an eyebrow with Direction + States (e.g. "STRENGTH · STRESSED · SORE LEGS");
- title;
- **~estimated min** · level · body emphasis;
- floating Back and Different Workout buttons.

**Duration.** The Cart always shows the *estimated* session, never the requested window. For example, a 60-minute Engine request shows "~39 min". A test and the QA script both assert this.

**Adjusted for today.** Shown when the workout was rerouted, using the API's text.

**Built for Today:**
- a neutral surface; the gold wash is gone;
- collapsed to its lead line (the API's teaser);
- tap to expand: *You told MOOD* pills, *MOOD chose* and every line with its kind icon.

**Session:**
- Warm-up (collapsed, expandable with thumbnails).
- Every block in API order. The heading comes from the block's **programming role, per Direction**:

  | Direction | Headings |
  |---|---|
  | Strength | Main Lift / Secondary / Target / Accessory / Finisher |
  | Sweat | Primary / Complement / Finisher |
  | Athletic | Primary Exposure / Secondary / Athletic Strength / Support / Finisher |

- The API's own title is kept as a subtitle when it adds something (e.g. "Primary Power · Total-body explosiveness").
- Structure and block facts are said once, e.g. "Superset · 2 rounds · 1 min between rounds", "Hybrid · 6 rounds · ~36 min · RPE 7–8", "EMOM · 20 min".
- Cool-down (collapsed).

**Rows** read identity first, then prescription, then quiet context:
- thumbnail or monogram;
- A1/A2, ANCHOR or R-station tag;
- name;
- the prescription, per round inside round structures, exactly as the Preview showed it;
- rest on straight sets;
- one muscle on lifting rows only. It is dropped on conditioning and power rows, because "Stationary Bike · Quads" misleads;
- the Athletic primary keeps its one-line quality stop;
- a small progression mark when there is one.

**Row tap opens a detail sheet** with:
- the library thumbnail, and **Watch demo** (the existing tutorial viewer) when the library has video;
- role;
- prescription, rest, effort (RIR/RPE), block format;
- load guidance, quality stop, progression and all cues;
- **Swap exercise**, using the existing endpoint. The sheet updates in place to the new exercise and shows "Swapped in X".

**Actions:**
- **Different workout**: in the hero and at the end of the plan, with the same endpoint and messages as before.
- **Start Workout**: sticky.

**Read-first.** There are no reorder, remove, add or edit controls.

**Start Workout** still opens the existing `/v3/session` placeholder, via one constant (`V3_SESSION_ROUTE`) with the workout id. The Guided Session replaces that screen and nothing in the Cart changes. Nothing is routed to the V2 player and nothing is flattened.

**`/v3/details`** is now a redirect to the Cart, so old links still work.

**Hero images** (`utils/cartHero.ts` → `resolveV3CartHero`, tested). Priority: archetype image → target image → first exercise thumbnail → Direction fallback.
- Every shipped archetype has an image, all from existing assets: the 8 Cloudinary featured heroes plus 5 bundled portraits.
- No new media was needed.

---

## 2. Files changed (all in `frontend/`, nothing in `backend/`)

**New:**
- `app/v3/build.tsx`: Build screen.
- `components/v3/HeroImage.tsx`: drift + crossfade + scrim.
- `components/v3/v3Images.ts`: image keys → sources.
- `components/v3/CartBlockView.tsx`: a Cart block and its rows.
- `components/v3/ExerciseSheet.tsx`: the row detail sheet.
- `utils/v3CartFormat.ts` + `.test.ts`: the pure Cart model, plus the H1 helper tests.
- `utils/v3TodayModel.ts` + `.test.ts`: the multi-build day cache.

**Rewritten:**
- `components/v3/V3Home.tsx`: Home.
- `app/v3/workout.tsx`: Cart.
- `app/v3/details.tsx`: redirect.
- `utils/v3Today.ts`: multi-build cache + day States.

**Edited:**
- `utils/v3HomeModel.ts`: H1 helpers (greeting, context line, default duration, focus summary, state comparison).
- `utils/cartHero.ts` + `.test.ts`: V3 hero resolver + 5 tests.
- `utils/v3PreviewFormat.ts`: exports `stationTag`.
- `components/v3/ConfigSheet.tsx`: `showLength` prop.
- `components/v3/V3Chip.tsx`: `glass` variant for chips over a photo.
- `utils/v3Api.ts`: `EXPECTED_ENGINE_PHASE` updated to `3.4-athletic-frozen`. It still said 2.6, so dev builds showed a stale-backend warning against the correct backend.
- `app/(tabs)/_layout.tsx`: the tab rename.
- `package.json`: `test:v3-today` and `test:v3-cart` scripts.

**Untouched:** `PreviewSections`, `WorkoutOverview`, `BlockCard` and `ExerciseRow` remain, used only by the dev pack viewer (`/dev/v3-pack`). They can be deleted once you no longer want that viewer.

---

## 3. UX behavior (verified end to end)

**Setup.** The real `mood_v3` router and training-profile router ran on an in-memory Mongo. The exercise library was the real seed library (174 exercises with Cloudinary media). The real screens were bundled for the web and driven at 390 × 844.

| Case | Result |
|---|---|
| First-time user (Low Energy barrier) | Low Energy pre-selected, hint shown, "Your first MOOD workout starts here." |
| Build → Cart | 1 generate call. Build replaced by Cart. Back returns to Home in the Today's Workout state. Handoff consumed. |
| No State / 1 State / 3 States / 4th tap | All work. The 4th tap is refused with the "Up to 3" hint. |
| Sore | Home hints that areas are chosen next. Build blocks until an area is picked, with a neutral CTA. |
| Conflict | Sore legs, back and chest + Full Body gave the real `sore_target_conflict` sheet. "Let MOOD pick" rebuilt an Arms workout. Athletic with sore legs gave the real no-upper-body conflict. |
| Reopen same workout | Same inputs gave 0 generate calls and the same workout id. |
| Change States, build again | Home switches to "Build for how you feel now", then 1 generate, a new id, and the new States in the Cart eyebrow and hero. |
| Swap (sheet) | Leg Press → Pit Shark Belt Squat. Sheet updated in place with a confirmation. |
| Different Workout | Lower Body: Squat → Upper Pull, with the toast "New workout · Upper Pull". The Home hero reflects it. |
| App relaunch | Today's workout and today's chips restored. |
| Logout / login | Another user sees a clean Home. Switching back restores the first user's workout and chips (storage is per user). |

---

## 4. Required QA matrix

Every case below was generated by the real engine, opened in the Cart, and checked automatically:
- title and Direction/States eyebrow;
- **estimated** minutes in the header;
- block order equals the API order;
- every prescription on screen equals the API's (per round where applicable);
- every exercise present;
- warm-up and cool-down present;
- no "undefined" or "NaN".

Swap and Different Workout were also called on each.

| Case | Title | Header | Result |
|---|---|---|---|
| Strength · Upper Push | Upper Push | ~56 min · Intermediate · Chest, Triceps | OK |
| Strength · Lower (Squat, superset accessory) | Lower Body: Squat | ~53 min · Quads, Glutes | OK |
| Strength · Full Body 30 | Full Body | ~30 min · Full body | OK |
| Strength · Low Energy + Sore back | Lower Body: Squat | ~52 min | OK |
| Strength · Bored, with Finisher | Upper Pull | ~28 min · Back, Biceps | OK |
| Sweat · Engine (60 requested) | Engine | ~39 min | OK |
| Sweat · Engine + Complement (Low Energy) | Engine | ~48 min | OK |
| Sweat · Circuit 30 | Circuit | ~24 min | OK |
| Sweat · EMOM circuit | Circuit | ~38 min | OK |
| Sweat · Hybrid | Hybrid | ~48 min | OK |
| Sweat · Amped + Bored | Hybrid | ~49 min | OK |
| Athletic · Power | Power | ~50 min | OK |
| Athletic · Olympic (Hang Clean to Box Knee Drive) | Full-Body Athlete | ~51 min | OK |
| Athletic · Sprint (Primary Speed · Acceleration) | Speed + Plyo | ~27 min | OK |
| Athletic · Irritated | Speed + Plyo | ~53 min | OK |

**Swap and Different Workout by Direction:**
- Swap succeeded on every Strength and Sweat case.
- On two Athletic cases, the primary exposure returned the backend's `no_alternative`. The Cart shows the message in the sheet and leaves the workout unchanged, which is the existing, correct contract.
- Different Workout succeeded on all 15.

**Content from the old screens, all still present in the Cart or its sheet:**
- Preview: title, meta, State chips, every Built for Today line, structure tags, per-round prescriptions.
- Details: *You told MOOD* / *MOOD chose*, warm-up items, block facts, rest, thumbnails, load guidance, quality stop, progression, cues, Swap.

**Tests run:**

| Suite | Result |
|---|---|
| Backend `mood_v3` pytest | 181 passed, 3 skipped (unchanged; no backend edits) |
| `cartHero` | 9 pass (5 new) |
| `v3TodayModel` | 6 pass (new) |
| `v3CartFormat` | 8 pass (new; runs every Strength, Sweat and Athletic envelope in the dev pack) |
| `featuredHeroImage`, `inSessionProgress`, `healthSyncFormat`, `heartRateZones` | all pass |
| `tsc` | 0 errors in any changed file (the repo's pre-existing errors elsewhere are unchanged) |
| ESLint on changed files | clean |
| `npx expo export --platform ios` | bundles; the new screens are in the bundle |

---

## 5. Known issues

1. **Exercise media coverage.** Most thumbnails will be monograms until this is fixed.
   - Against the 174-exercise seed library, the generator's exercises match media on 54% of Strength rows, 28% of Sweat rows and 35% of Athletic rows (65 of 199 unique exercises).
   - Production `db.exercises` may be larger, so these are lower bounds.
   - The Cart does not depend on media: the hero photos carry the visual weight and the monograms are intentional.
   - Closing the gap is a library/alias task, not UI work. The 133 unmatched names are listed in `V3 Updates/H1H2_screens/unmatched_media.txt`.
2. **Not tested on a phone or simulator.** There is no Mac here. The web harness ran the real screens and backend, but it can't check native Modal layering, haptics or video playback (demo video would not play in headless Chromium). **Run the app on your phone before approving.**
3. **Start Workout** still lands on the placeholder session (by design until the Guided Session).
4. **Streak line.** It shows only for a workout streak of 2 or more. V3 completions don't record yet, so for V3-only users it will usually be hidden until the Guided Session writes completions.
5. **Home hero image.** It uses the Direction portrait, not the workout's own image. This keeps Home consistent and bundled (instant, offline). The Cart uses the workout-specific image.

---

## 6. Decisions needed from you

1. **Home hero in the Today's Workout state:** keep the Direction portrait (current), or switch to the same workout-specific image the Cart uses? Keeping the portrait is my recommendation, for consistency and instant load.
2. **The tab label "Home":** keep it, or would you rather call it "Today"?

Everything else is ready for your review. Next up, when you approve: H3 Quick Starts, or the Guided Session.
