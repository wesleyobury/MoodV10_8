# MOOD V3 · H1/H2 Founder Pass 3 (final targeted pass)

Date: 29 Sep 2026. Stopped before the Guided Session. Home and Cart layouts were not redesigned. The only programming changes are the narrow Sweat Different Workout fix and a presentation-only bodyweight scaling layer; neither changes sets, reps or effort targets.

Screenshots: `Founder_Pass3_screens/` (16 numbered captures at 390×844) and `Founder_Pass3_contact_sheet.png`.

## 1. Screenshots

| # | Screen |
|---|---|
| 01–05 | Body map: female front (empty), female front selected, female back selected, male front, male back |
| 06 | Home with three States and Sore areas |
| 07 | Build: precise sore areas plus the Body map link |
| 08 | Cart and Built for Today with precise soreness |
| 09 | Home (nothing built yet) with the Shuffle icon |
| 10 | Home after Shuffle: today's workout |
| 11 | Sweat after three Shuffles, still Low Energy |
| 12 | "Build a different workout", filled |
| 13 | States changed: "Build for how you feel now" is the primary action |
| 14 | Cart row: Inverted Row, "Scale assistance or load" |
| 15, 16 | Exercise details: "Make it fit you" for Inverted Row and Parallel Bar Dip |

## 2. Body map, and the soreness schema

### What I checked first

I looked through every body asset in the repo and in Branding before making anything new:

- The only body figures were the four `MOOD-{Male,Female}-{front,back}.png` files. All of them are cropped at mid-thigh, so they have no calves.
- `muscle payoff.png` and `payoff-muscle.png` are photos, not figures.
- The App Store "built around your body" image is a phone mockup.
- There was no earlier body-map vector set, and `frontend/body` is an empty file.

### New figures

- **How they were made:** four new full-body figures, made with Higgsfield (GPT Image 2.5), using the existing MOOD figures as references so the look stays the same (dark bronze body, gold veins, MOOD emblem).
- **Framing:** head to feet, calves and feet included, centered, arms slightly away from the body. All four share one crop (640×1254), so the sheet never changes size when switching views.
- **Cost:** 6 generations at about 2.75 credits each, roughly 16.5 credits. The first female request was blocked by the image service's content filter. It went through on the second try once the prompt said crop top and training shorts.
- **Default and memory:** female is the default. The male/female toggle stays in the header, and the choice is remembered on the device using the same key as before.

### Interaction

- The dashed circles and hotspot outlines are gone. You tap the body itself.
- Tap targets are invisible and 1.45× the size of the drawn glow, so a near-miss still counts. When areas overlap, the tap goes to the one it is most inside.
- A selected area gets a soft glow in two layers: a red-orange core with a gold falloff, plus a wider amber halo. It is drawn over the muscle at partial opacity, so the body detail still shows through. Tapping the area again clears it.
- Each area appears on the view where it lives. Areas that only exist on the other view show as a count on the Front or Back tab.
- The selected areas appear as a single row of removable pills (it scrolls sideways), so the sheet height never jumps.
- On web the tap comes back in screen coordinates, so it is converted relative to the figure's position. On iOS and Android the position is already relative to the figure.

### Areas

- **The map's areas:** Shoulders, Chest, Biceps, Triceps, Upper Back, Core, Lower Back, Glutes, Quads, Hamstrings, Calves.
- **Removed:** the generic Arms option. Legs is no longer offered either.
- **Where each appears:**
  - Front only: Chest, Biceps, Core, Quads
  - Back only: Triceps, Upper Back, Lower Back, Glutes, Hamstrings
  - Both views: Shoulders and Calves

### The soreness schema: no engine change was needed

**The generator already understands exactly what is tapped:**

- `normalize()` already accepts any id in `MUSCLES` (biceps, triceps, calves, quads, hamstrings, glutes) next to the region names. Every engine works on the resulting set of sore muscles.
- A tap on Biceps reaches programming as biceps, not as "arms". The UI never claims more precision than the generator uses.

**What I verified:**

- Every precise area, alone and in combination, across Strength, Sweat and Athletic:
  - The areas come back unchanged on the workout.
  - They are named in "You told MOOD" (for example "Sore biceps").
  - No exercise in the session uses a sore muscle as a primary mover (0 cases).
- Example: sore quads gave a Hinge session that leaves the quads alone.

**Older selections:**

- The broad regions (legs, arms, back, lower_body) are still accepted by the API.
- When the map opens with one of them, it expands to exactly what it already meant. For example, legs becomes quads, hamstrings, glutes and calves.

**Frozen behavior to know about (unchanged):**

- Athletic treats any sore lower-body muscle as sore legs.
- So sore calves alone still move Speed + Plyo to an upper-body-led session.
- This is conservative, and I left it alone.

### QA (web harness)

**Body map:**

- The map opens with the female figure.
- The male toggle works, and the choice is remembered after reload.
- Front and back both work.
- Biceps, Triceps, Calves, Glutes, Upper Back and Lower Back were each selected.
- Up to ten areas were selected at once, and tapping an area again deselects it.
- Done saves the day state.
- Deselecting Sore clears the areas.

**Build and Cart:**

- Build shows the chips and the Body map link.
- The request sent to the generator, the areas on the workout, and "You told MOOD" all list the same seven areas.
- The Cart eyebrow stays on one line: up to two areas are named, more just says "Sore".
- The "You told MOOD" pill now wraps instead of being cut off.

## 3. Shuffle

**The icon:** a small round shuffle icon at the top right of the Home hero.

**When today's workout exists:**

- Shuffle calls the existing Different Workout (swap-workout) on it.
- It keeps the same:
  - Direction
  - explicit Target / Focus
  - duration
  - States
  - soreness
  - profile inputs
- The engine changes the session or archetype within its own rotation.
- States come from the stored workout on the server, so Shuffle cannot add, remove or change one.
- The hero title fades out and back in, and the saved today workout is updated to the new version.

**When nothing is built yet:**

- Shuffle is a one-tap MOOD's Pick using:
  - the current Direction (last used or default)
  - the Home States and sore areas
  - the default length
- The result becomes today's workout, and Home switches to the Today view.
- I kept this rather than limiting Shuffle to the Today view. It behaved clearly: one tap, one workout, and nothing about the Home selection changes.

**While it is working:**

- The icon rotates.
- Extra taps are ignored: three rapid taps produced exactly one request.
- If nothing else fits, a quiet toast says "No other version fits today, so this one stays."

**Results in the web harness (four Shuffles after the first build):**

| Case | Sessions | States / soreness |
|---|---|---|
| Strength, no State | Squat → Upper Pull → Upper Push → Glutes + Legs | unchanged, [] |
| Strength, Amped | same rotation | Amped on every version |
| Sweat, Bored + Amped + Stressed | Hybrid → Engine → Circuit → Hybrid | all three on every version |
| Athletic, Sore hamstrings + calves | Power / Full-Body Athlete, new exercises each time | Sore with the same two areas every time |
| Sweat, Low Energy | Hybrid → Engine → Circuit → Hybrid | Low Energy every time |

After a relaunch, the shuffled version is still there, and Open Workout opens that same version.

**Build a different workout:** it keeps its size and position. It is now filled (a neutral fill, a brighter hairline and a gold plus), so it clearly reads as a button. Open Workout stays the gold primary. When States no longer match, "Build for how you feel now" is still the gold primary action.

## 4. Sweat Different Workout

### Root cause

The frozen Sweat ranker already has a Different Workout mechanism:

- It penalizes exercises and exercise families shown earlier in the chain.
- It alternates engine mode and structure between versions.

But the V3 Sweat context always passed swap = 0 and an empty history of shown versions. Only the format choice varied from tap to tap, and exercise selection stayed the same, so a chosen Sweat type rebuilt the same session.

### The fix: two small changes in `sweat_core.py`, nothing else in Sweat

1. **`_swap_ctx`:**
   - For Different Workout number k, it rebuilds versions 0 to k-1 of the same archetype. The rebuild is deterministic, the same way Strength already does it for Custom Target and Core.
   - It then passes that history, and the real swap count, to the frozen ranker.
2. **Engine sessions:**
   - The frozen rule that avoids the last completed machine and interval shape now also counts the versions shown in this chain, not just completed workouts.
   - Without this, an Engine session (one machine) could repeat with Low Energy.

**What did not change:** hard filters, verdicts, State rules, workload budgets, time bands and validation.

**It still rebuilds correctly:** swapping an exercise after four Different Workouts still rebuilds and matches the stored workout.

### Before and after

The audit covered 72 sequences:

- **Types:** 4 (Engine, Circuit, Hybrid, MOOD's Pick)
- **States:** 3 (none, Amped, Low Energy)
- **Durations:** 2 (30 and 60 min)
- **Dates:** 3

Each sequence was generate plus 7 Different Workout taps, so 8 sessions.

- A session counts as unique if its exercises or prescription differ from every other session in that sequence.
- Overlap is the share of a session's exercises that were also in the session just before it.
- An exact repeat is a session identical to any earlier one in the sequence.

| Type | Unique of 8 (before → after) | Avg overlap with previous tap | Identical to previous tap | Exact repeats |
|---|---|---|---|---|
| Circuit (chosen) | 3.2 → **8.0** | 93% → 13% | 55 → **0** | 87 → 0 |
| Hybrid (chosen) | 4.1 → **7.8** | 89% → 15% | 26 → **0** | 71 → 3 |
| Engine (chosen) | 3.9 → **6.7** | 73% → 7% | 31 → **0** | 73 → 24 |
| MOOD's Pick | 6.6 → **7.8** | 20% → 15% | 0 → 0 | 26 → 4 |

**Notes on the results:**

- **Engine:** an Engine session is one machine plus one interval shape, so there are only so many combinations. Low Energy allows low-impact machines only. Repeats can still happen, but never on the next tap: each tap changes the machine or the format, for example Bike intervals → Rower steady → Treadmill pyramid → Bike steady → Rower intervals.
- **Invariants:** States never changed in any sequence. A chosen type always stayed chosen. Estimated minutes stayed inside the same range the engine produced before the fix.

**Regression coverage:** `test_sweat_different_workout.py` has 25 tests: 24 cases × 7 taps, plus a rebuild test. It requires:

- no session identical to the one just before it
- at least 7 of 8 unique (Engine at least 5)
- at most 50% overlap with the previous tap for Circuit and Hybrid
- the chosen type kept, and the States and duration unchanged
- estimated time inside the pre-fix range

## 5. V2 media audit and Cart coverage

**The real V2 library:**

- **Size:** `frontend/data/*-data.ts` holds 1,435 V2 workout cards, and 1,411 of them have an image. So "1,000+" is right for cards.
- **Unique images:** the cards share only **727 unique images**.
- **The `.bak` files:** older copies of the same 21 data files with identical URLs.
- **Every image across the repo:** 898 unique. The rest are featured heroes, stock placeholders and equipment photos.
- **The video library:** 174 exercises with video-frame thumbnails, which the Cart now uses only as a fallback.

**How the images are indexed:**

- Images belong to the workout card, not to an exercise.
- `tutorialSlug` points to the video library, not the image, and it is sometimes wrong.
- Of 6 multi-movement card covers I checked:
  - 2 showed the first movement
  - 2 showed a later movement
  - 2 showed something else
- So covers are never used as exercise images.
- About 356 images belong to single-movement cards. Even those are sometimes reused for a different movement. One generic atlas-stone photo is on sit-up, crunch, flutter-kick and V-twist cards.

**Matching, in priority order, every entry checked by eye:**

| Match type | New entries |
|---|---|
| Exact id | 6 |
| Exact canonical name | 3 |
| Known alias | 0 (no reliable alias source in the repo) |
| Validated normalized name, same movement and implement | 10 |
| Manual, obvious same movement and implement | 21 |
| **Total new** | **40** (56 candidates viewed, 16 rejected) |

**Cleanup of the old map:** 17 of the earlier 81 entries showed the wrong movement or implement, so I removed them:

- incline press showing a shoulder press
- a barbell front squat showing a dumbbell front squat
- all 7 med-ball throws using the generic atlas-ball photo
- sumo deadlift showing an RDL
- and similar

The Cart map is now **104 entries**, all visually checked: 64 kept and 40 new.

**Coverage of each Direction's exercises (static image):**

| Direction | Exercises | Before (81, including the wrong 17) | Now (104, all checked) |
|---|---|---|---|
| Strength | 196 | 54 | 80 (41%) |
| Sweat | 82 | 28 | 32 (39%) |
| Athletic | 112 | 32 | 38 (34%) |

**Share of generated Cart rows showing a correct image:** 585 rows across 14 days × 30/60 min × no State / Low Energy.

| Direction | Our static image | Static, else the clean library thumbnail |
|---|---|---|
| Strength | 66% | 69% |
| Sweat | 67% | 74% |
| Athletic | 38% | 52% |
| All | 56% | 64% |

**Why these numbers look lower than the last report:** the earlier 64% to 72% counted the wrong images as covered. Athletic drops most because the med-ball throws no longer show the generic ab photo; they now fall back to the monogram tile.

**Remaining gaps, by how often they appear in generated workouts:**

- **Strength:**
  - GHD Glute-Ham Raise
  - Box Step-Up (Glute Bias)
  - Curtsy Lunge
  - Reverse Nordic
  - Slider and single-leg curls
- **Sweat:**
  - Push-Up
  - Suitcase, Overhead and Front-Rack Carries
  - Dead Bug
- **Athletic:**
  - Seated and Lateral Box Jump
  - the 5 med-ball throws
  - sprint starts

V2 has no single-movement image for any of these. About 20 new stills would lift every Direction above 80%.

**Where a bigger library could still be:** the Cloudinary account (`dfsygar5c`) may hold uploads the repo never references, and production MongoDB (`exercises`, `admin_workouts`, `featured_workouts`) may too. Checking either needs credentials I do not have.

**Files:** the full audit, with the per-entry source card and note, is in `media_audit/report.md` and `media_audit/v3_image_map.json`.

## 6. Bodyweight exercise audit

The Strength library has 28 bodyweight exercises. I also checked Athletic and Sweat.

**Scalable strength (the founder's problem): scaling added**

| Exercise | Kind |
|---|---|
| Pull-Up, Chin-Up, Neutral-Grip Pull-Up | assistance or added load |
| Parallel Bar Dip, Bench Dip | assistance or added load |
| Push-Up, Deficit Push-Up, Diamond Push-Up | assistance (incline) or added load |
| Inverted Row | angle or added load |
| Nordic Hamstring Curl, Reverse Nordic, Sissy Squat | leverage or range |

**Deliberately excluded:**

- **Already loadable:** Weighted Pull-Up and Weighted Push-Up. Their load guidance already covers it.
- **Core and holds:**
  - Plank, Side Plank, Hollow Hold, Dead Bug, Dragon Flag, Copenhagen Plank
  - hanging and captain's chair raises
  - sit-ups and crunches
  - These use time or core rep logic.
- **Light high-rep accessories:** Single-Leg Glute Bridge, Slider Hamstring Curl, Side-Lying Abduction.
- **Explosive and skill:**
  - Box Jump, Broad Jump, plyo and clap push-ups
  - Muscle-Up and Band-Assisted Muscle-Up
  - all Athletic power work
  - These keep their low counts and quality stops.
- **Conditioning:** Burpee, Mountain Climber, and every Sweat row, including Sweat push-ups and pull-ups. These follow Sweat's time and output logic. Sweat never receives scaling (tested).

**What the engines actually prescribe:**

- **Strength already does the right thing.** Every bodyweight strength row has a rep range and a reps-left-in-the-tank target. None has a fixed count.

  | Exercise | Level / State | Prescription |
  |---|---|---|
  | Pull-Up | Advanced | 4 × 6–8, 2 reps left in the tank |
  | Pull-Up | Intermediate | 4 × 8–10, 2 reps left |
  | Pull-Up | Amped | 1 rep left |
  | Pull-Up | Low Energy | 3 reps left |
  | Inverted Row | Beginner, Low Energy | 4 × 10–12, 3 reps left |
  | Deficit Push-Up | Intermediate, Amped | 4 × 8–12, 1 rep left |

  The State effects on effort are intact.
- **Athletic Strength uses fixed low counts** tied to effort: Pull-Up 4 × 3 or 4 × 5 with 1–2 reps left, Inverted Row 3 × 6 or 3 × 8, Push-Up 3 × 8. These are strength-intent sets. With the scaling instruction ("pick the version that lets you do 3 reps with about 1 good rep left") they prescribe correctly for both the 5-rep and the 35-rep athlete: the stronger one simply adds load.
- **Two prescriptions need your review; I did not change them:**
  - **Nordic Hamstring Curl:** Strength prescribes it as a normal isolation accessory, 2–4 × 12–15. That is unrealistic even for advanced lifters; Nordics are normally 3–6 slow-lowering reps. The scaling note (band or pushing off with the hands) makes it doable, but the rep range itself is a frozen-Strength decision.
  - **Athletic Strength fixed counts:** turning them into ranges is optional and would change frozen Athletic programming.

## 7. The prescription solution

**Which layer:** metadata plus presentation. The generator already prescribes a usable range and effort target. No sets, reps, rest or effort values changed (tested).

- **Metadata:**
  - A new file, `backend/mood_v3/exercise_meta.py`, holds an explicit list, `LOAD_SCALING`.
  - Each entry is marked `bodyweight_adjustable` (assistance or added load) or `bodyweight_leverage` (range or lever length).
  - Each entry has one "easier" and one "harder" option.
  - It is never inferred from bodyweight equipment.
- **Where it applies:** every Strength block except the finisher, and Athletic's Athletic Strength block. Only on rep-based rows.
- **What the envelope carries:** a new, optional `prescription.scaling`, `{kind, short, detail}`. The detail is also appended to `load_guidance`, and the old "Bodyweight: work within the rep range." line is replaced.
- **Cart row:** one quiet line under the prescription, "⚙ Scale assistance or load" (or "Scale the range").
- **Exercise details:** a "Make it fit you" section. For example: "Too hard: use a band or the assisted pull-up machine. Too easy: add weight with a belt or vest. Pick the version that lets you land in the rep range with about 2 good reps left; the effort matters more than the exact count." It is not repeated under Load.
- **What it does not do:** no AMRAP, no sets to failure, and no change to State effects. The Guided Session can surface the same text at the right moment later.

## 8. Tests

- **Backend `pytest mood_v3/tests`:** 251 passed, 3 skipped (was 189). The 62 new tests are:
  - `test_sweat_different_workout.py` (25)
  - `test_founder_pass3.py` (37): precise soreness across all Directions, legacy regions, scaling on Strength rows across 3 levels × 3 States, Athletic strength rows only, never Sweat, and explosive / conditioning movements excluded
- **Frontend node tests:** all pass.
  - v3BodyMap 7 (new)
  - v3CartFormat 14 (plus the scaling test)
  - v3PlainLanguage 5
  - v3TodayModel 6
  - cartHero 9
  - featuredHeroImage 7
  - inSessionProgress 12
  - healthSyncFormat 9
  - heartRateZones 9
- **New script:** `yarn test:v3-bodymap`.
- **tsc:** 0 errors in V3 files.
- **ESLint:** no new errors. The one error, in `ConflictSheet.tsx`, was already there, and that file was not touched.
- **iOS bundle:** the iOS export builds.
- **Web harness end-to-end:** the body map, Home (no, one and three States; Sore; deselecting; relaunch; switching users), Build, the Shuffle matrix, and a Cart regression run:
  - Strength, Strength Beginner, Sweat and Athletic
  - swaps from the row and from the sheet
  - no alternative, term cards and plain language
- **Render matrix:** 12/12 OK.

## 9. Synced to your Mac

- **Where:** MoodV10_8. Before writing, I checked every overwritten file matched the last synced version. The four body images were my previous cropped figures and are now replaced.
- **Backend:**
  - `sweat_core.py`
  - `service.py`
  - `exercise_meta.py` (new)
  - two new test files
- **Frontend:**
  - Components: `V3Home`, `BodyMapSheet`, `CartBlockView`, `ExerciseSheet`, `workout.tsx`
  - Utils: `v3Api`, `v3HomeModel`, `v3CartFormat` (and its test), `v3ExerciseImages`, `v3BodyMap` (new, with its test)
  - Images: the four body images
- **package.json:** only the `test:v3-bodymap` line was added.

## 10. What still blocks the Guided Session

Nothing from this pass blocks it. To carry forward:

1. **The Guided Session must record completions** (`/complete`). Strength MOOD's Pick opens on the same first archetype each day until completions exist, and the Engine repeat-avoidance rules depend on history too.
2. **Founder decisions:**
   - the Nordic Hamstring Curl rep range (Strength)
   - optionally, ranges for Athletic Strength bodyweight sets
3. **Media:** about 20 exercise stills would close most of the gaps (see section 5).
4. **Device check:** the body map tap on iOS uses the native position relative to the figure. It is verified on web and in the iOS bundle build, but not yet on a phone.
