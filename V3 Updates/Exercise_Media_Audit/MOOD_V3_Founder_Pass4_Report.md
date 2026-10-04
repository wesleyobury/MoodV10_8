# MOOD V3 · Founder Pass 4: Nordic fix and exercise / media audit

Date: 29 Sep 2026. Stopped before the Guided Session.

This pass made two changes:

- **Nordic Hamstring Curl:** the Strength dosing is corrected.
- **Cart images:** 20 image mappings that failed visual verification were removed.

Nothing else was optimized. Athletic Strength bodyweight dosing is unchanged, as instructed.

**Update after founder review: static photos only.**

- Cart and exercise images now come only from MOOD's static photo map. Exercise-video thumbnails are never used as images (the set is moving to AI-generated photos in one visual theme).
- An exercise without a verified photo shows the monogram tile.
- The same rule now applies to the V3 Cart hero: its old last-resort fallback to an exercise video frame was removed, so it falls to the Direction image (every shipped archetype already has its own image, so nothing visible changes today).
- Videos are untouched: the exercise sheet's Watch demo button still plays the library video.
- Code: `utils/v3ExerciseImages.ts` (`exerciseImageUrl` returns the static photo or nothing), `utils/cartHero.ts`, and their tests.

**Files in this folder:**

- `MOOD_V3_Exercise_Media_Contact_Sheet.html`: open it in any browser. It needs no server; the images are embedded. Shows the photos in use and the missing list, and lets you mark each photo Confirmed or Needs change with a note (saved in that browser; Export / Import JSON or CSV to back up or share).
- `MOOD_V3_Exercise_Inventory.xlsx`: the master inventory. Sheets: Summary (live formulas), Inventory, Missing by Direction, Missing (deduplicated), Removed image mappings, Unused by any Direction.
- `MOOD_V3_Missing_Exercise_Images.md`: what to photograph first.

## 1. Nordic Hamstring Curl

**Old behavior:**

- The Strength engine gave every non-loadable bodyweight exercise the generic bodyweight text: 12–15 for accessories, 8–12 for compounds.
- This ignored the frozen library's own `default_rep_band` for the Nordic, which is 4–8.
- The Nordic therefore came out as 2–4 × 12–15 at 1–2 reps in reserve.
- The accessory band also allows 0 reps in reserve, so a later effort lever could have pushed it to failure.

**New behavior:**

- 2–4 × **4–6** controlled reps, with **at least 1 rep in reserve**.
- 4–6 is the overlap of the frozen library band (4–8) and your 3–6 target.
- Sets, rest, State effects and validation still come from the accessory class.

**Layer changed:** Strength prescription only, in the existing rep-band architecture.

- **`bands.py`:** a one-entry `EXERCISE_DOSE = {'nordic_curl': {reps: '4–6', rir_floor: 1}}`. The bodyweight rep text and a `rir_floor()` read from it.
- **`core.py`:** `_band()` and `make_row()` respect that floor, so neither the initial value nor any State lever can go below 1 rep in reserve.
- **No new subsystem:** the band validator still treats the Nordic as a bodyweight row.
- **Scaling guidance (`exercise_meta.py`):**
  - Easier: "use a band or push off the floor with your hands, or stop the lowering earlier".
  - Harder: "use less help and control the lowering through a longer range".

**Examples:** Nordic is an advanced-skill exercise in the frozen library, so Beginner and Intermediate never receive it (tested). Before and after at Advanced:

| Case | Before | After |
|---|---|---|
| Advanced, no State | 4 × 12–15, 1 rep in reserve | 4 × 4–6, 1 rep in reserve |
| Advanced, Low Energy | 4 × 12–15, 1 | 4 × 4–6, 1 |
| Advanced, Amped | 4 × 12–15, 1 (one case 2) | 4 × 4–6, 1 (one case 2) |
| Advanced, Stressed + Bored | 2–4 × 12–15, 1 | 2–4 × 4–6, 1 |
| Beginner / Intermediate | not prescribed | not prescribed |
| Athletic support block | 3 × 4 (Athletic's own dose) | unchanged |

### Regression: did anything else move?

I compared 1,568 workouts before and after the change: 1,176 generate requests across Strength, Sweat and Athletic, 3 levels, 4 State sets, 30/60 min, 7 dates, several Strength Targets, plus 392 Different Workout taps.

- **Identical:** 1,162 requests.
- **Changed:** 14 requests, and every one contains a Nordic.
  - 9 differ only in the Nordic row.
  - 5 have the same exercises in the same order with the same session type. The existing time model re-spent the minutes freed by the shorter Nordic sets: rest went up 15–30 s on one or two compound lifts, or one accessory gained a set.
- **Athletic and Sweat:** zero changes.
- **Slider Curl, the leg curls and the other bodyweight rows:** unchanged (tested).

## 2. The exercise universe (exact)

**Canonical universe: 301 unique exercise IDs.** All 196 Strength library rows are marked active. Names match across all three engines (0 conflicts).

| Source | Count | Where it lives |
|---|---|---|
| Strength Exercise Library v11 | 196 | `backend/mood_v3/data/MOOD_V3_Strength_Exercise_Library_v11.xlsx` (frozen workbook) |
| Sweat additions | 30 | `engines/sweat/sweat_data.py` (ADDITIONS) |
| Athletic additions | 75 | `engines/athletic/athletic_lib.py`, `lib2.py`, `athletic_core.py` |

The sources nest: the Strength library (196) sits inside the Sweat library (226), which sits inside the Athletic library (301).

**Unused by any Direction: 19.** All are Athletic additions: agility and sprint-start drills (5-10-5 shuttle, carioca, dot drill, line hops, power skip, several 5 m start variants and others). The full list is on the "Unused" sheet.

**Direction pools (configured eligibility):**

| Direction | Eligible | Share of universe | Actually seen in the reachability sweep |
|---|---|---|---|
| Strength | **196** | 65.1% | 195 (Sled Push never picked) |
| Sweat | **82** | 27.2% | 74. Eight "class B" movements are allowed but never won the ranking: Pull-Up, Chin-Up, Neutral-Grip Pull-Up, Parallel Bar Dip, Hanging Leg Raise, DB Thruster, DB Clean to Press, Reverse Lunge to Press |
| Athletic | **113** | 37.5% | 111. 100 training movements plus 13 warm-up-only drills; Side Plank and Copenhagen Plank never picked |

**How the pools were measured:**

- **Configured pools** come from code and data:
  - **Strength:** the ARCHETYPE ELIGIBILITY sheet.
  - **Sweat:** the rule-derived eligibility table (classes A, B and NEW).
  - **Athletic:** the POWER, STRENGTH and SUPPORT vocabularies plus warm-up lists.
- **The reachability sweep** exercised all of these:
  - 4,590 generate requests plus about 8,000 targeted builds
  - all levels, equipment presets, goals, Targets and session types
  - States and soreness
  - Different Workout and exercise swaps
- **Earlier figures:** the last audit's 196 / 82 / 112 is confirmed for Strength and Sweat. Athletic is **113**; the earlier 112 came from a legacy eligibility function.

**Overlap. It reconciles to 301:**

| Group | Count |
|---|---|
| Strength only | 123 |
| Sweat only | 18 |
| Athletic only | 56 |
| Strength + Sweat only | 28 |
| Strength + Athletic only | 21 |
| Sweat + Athletic only | 12 |
| All three | 24 |
| No Direction | 19 |
| **Total** | **301** |

## 3. How static is the exercise universe?

**Short answer:** it is a curated, static vocabulary with dynamic programming built from it, as intended. There are three nuances.

**One canonical library?**

- Logically yes: 301 IDs, one name each.
- Physically it is one frozen workbook plus two sets of additions in Python.
- Each engine loads its own copy at import. The IDs and names are identical across the copies (verified).

**Can a generated workout contain an exercise name that is not in the library?**

- No, in practice. Every workout item is built from the engine's library entry (`exercise_ref(id, name, ...)`). There is no LLM or free-text path in V3.
- 0 exercise IDs outside the library across the 4,590-request reachability sweep, including its Different Workout and exercise-swap chains.
- Two edge paths to know about. Neither ever triggered, and I did not change them:
  - **Sweat display names:** a display alias exists for 2 IDs ("Air Bike / Assault Bike", "Suspension Trainer Row / TRX Row"). The ID is still canonical.
  - **Athletic warm-up names:** the warm-up renderer falls back to the raw ID as the name if a warm-up ID were ever missing from the library (`render.py` line 226).
- Free text does appear in guidance lines, cues and "Built for Today" copy, but those are sentences, not exercises.

**Hardcoded, DB-backed or seeded?**

- **The vocabulary, eligibility and programming** are static backend code and data: the workbooks in `backend/mood_v3/data` plus Python. Changing them needs a backend deploy, not an app release.
- **The database holds media only:**
  - videos, thumbnails and cues come from `db.exercises`, matched to V3 exercises by normalized name and aliases (`router.attach_media`)
  - seeded from `exercises_seed_data.py` (174 entries) and editable through the admin endpoints (`POST /exercises`, `/admin/exercises`) without any release
  - the database also stores V3 workouts and history
- **The frontend** holds no exercises, only the static Cart image map (`utils/v3ExerciseImages.ts`), which updates with an app release or an OTA update.

**Which fields decide Direction eligibility?**

- **Strength:**
  - the `active` flag
  - the ARCHETYPE ELIGIBILITY rows (archetype, slot, verdict, condition, bias)
  - hard filters: equipment, `skill_level_min`, complexity cap, space, soreness
- **Sweat:** `sweat_class`, derived by rules in `sweat_data.classify` from station, complexity, skill, impact, equipment, class and pattern (A, B and NEW are eligible), plus the rule-derived slot table.
- **Athletic:** explicit membership in the POWER, STRENGTH or SUPPORT vocabulary or a warm-up list, plus the level, equipment and soreness filters.

**What happens when a new exercise is added?**

- **Strength:** it needs ARCHETYPE ELIGIBILITY rows, or it is never picked. **Exception:** Core sessions draw from the whole library by category, so a new core movement could appear there automatically.
- **Sweat:** **automatic.** A new library row is classified by rule and becomes eligible (class A or B) unless a rule excludes it. **Flag:** this means a Strength-library addition can silently join Sweat.
- **Athletic:** never automatic. It must be added to a vocabulary.

**Swaps and Different Workout:** both draw from the same pools, with the same filters.

**Can an admin change the production universe without a release?**

- The exercise vocabulary: **no.**
- The media attached to it: **yes.** Videos, thumbnails, cues and aliases can change what the Cart and exercise details show without any release.

## 4. Master inventory and contact sheet

**Inventory:**

- The xlsx lists all 301 exercises.
- **Columns:** name, ID, source, pattern, movement and exercise family, primary and secondary muscles, equipment, skill and complexity, Strength / Sweat / Athletic eligibility, role in each Direction, scalable-bodyweight metadata, static image, match method, image source and URL, video and its URL, how often each exercise appears in the sample, and why an image was removed.
- Missing metadata is left blank.
- Video and thumbnail availability is taken from the repo seed; production may hold more.

**Contact sheet: 319 cards.**

| Card type | Count |
|---|---|
| In use (static photo) | 84 |
| Missing (monogram) | 198 |
| Removed mappings, shown so you can overrule them | 37 |

- **Filters:** in use / missing / removed, review status, Direction, search, and sort by A–Z or frequency.
- **Review marks:** each photo in use has Confirmed and Needs change buttons plus a note. A progress bar counts confirmed, needs change and not reviewed. Marks are tied to the photo URL, so a replaced photo asks to be reviewed again.
- **Default view:** photos in use. Click any image to enlarge.

### Verification of every mapping (item 9)

**Static images:**

- I viewed every static mapping full size. Of the 104 left after pass 3, **20 were removed**, either because the picture contradicts the exercise or because the variation cannot be seen. Examples:
  - Chin-Up: overhand grip
  - Seated Leg Curl: a lying curl
  - Seated Calf Raise: standing with dumbbells
  - DB Overhead Extension: a hip thrust
  - Burpee: a plank
  - Machine Preacher Curl: a barbell
  - Neutral-Grip Pulldown: a wide bar
  - Barbell Incline Press: a flat bench
  - EZ Skull Crusher: a straight bar
- **84 remain.** Each shows the named movement and implement.
- The 17 pass-3 removals are listed too, with reasons.
- A new frontend test keeps all 37 removed mappings from coming back.

**Video library matches:** all 41 library frames viewed. They are no longer used as images, but the same matches supply the exercise videos.

- **Wrong video match (5):**
  - EZ-Bar Skull Crusher: the frame shows a standing dumbbell extension
  - Glute Bridge: a machine hip thrust
  - Jump Squat: a kettlebell goblet jump squat
  - Kettlebell Clean and Press: matched to "KB Pull Press"
  - Neutral-Grip Pull-Up: the assisted machine
- **Close but a different variant (2):** Ab Wheel Rollout (the standing variant) and Pendlay Row (a standard barbell row).

**Video mismatches:** these five would reach the Guided Session. This is noted, not fixed.

## 5. Missing images

- **Unique exercises without a static image:** 198.
- **By Direction:** Strength 132, Sweat 52, Athletic 73.
- **Priority** comes from each exercise's share of its Direction's Cart rows:

  | Priority | Share of Direction rows | Unique exercises |
  |---|---|---|
  | High | 2% or more | 29 |
  | Medium | 0.5% to 2% | 41 |
  | Low | under 0.5% | 128 |

**The top 10 to photograph first:**

1. Hack Squat
2. Push-Up
3. Med-Ball Rotational Throw
4. Med-Ball Rotational Slam
5. Box Step-Up (Glute Bias)
6. Dumbbell Pullover
7. Front Squat
8. Broad Jump to Stick
9. GHD Glute-Ham Raise
10. Chin-Up

The full High list, the deduplicated master list and the per-Direction lists are in `MOOD_V3_Missing_Exercise_Images.md` and on the xlsx sheets.

## 6. Media coverage

**Scope:**

- Only verified images count.
- **A** counts eligible exercises.
- **B** counts Cart rows in a representative sample: MOOD's Pick, commercial gym, 3 levels × 5 State conditions × 30/60 min × 14 dates. That is 420 workouts per Direction and 4,435 rows.
- With static photos only, B is also the share of Cart rows that show any picture; every other row shows the monogram. (The earlier C measure, which counted video thumbnails, no longer applies.)

| | A. Exercises with a static image | B. Cart rows with a static image |
|---|---|---|
| Strength | 64 / 196 (32.7%) | 40.9% |
| Sweat | 30 / 82 (36.6%) | 59.4% |
| Athletic | 40 / 113 (35.4%) | 36.2% |
| **Overall** | **84 / 282 (29.8%)** | **43.9%** |

**Why these are lower than earlier reports:**

- Those reports counted images that were wrong: 17 were caught in pass 3 and 20 in this pass.
- They also used a different sample.
- These numbers count only images that show the right exercise.

## 7. Tests

- **Backend `pytest mood_v3/tests`:** 257 passed, 3 skipped. This includes:
  - the new `test_nordic_dose.py` (6)
  - the Sweat Different Workout regression (25)
  - bodyweight scaling and soreness (37)
  - no-invented-States (8)
  - the frozen parity and Athletic / Sweat rebuild suites
- **Unified production-path QA (`run_unified_qa`):** 9,072 builds, 0 failures.
- **Strength QA sample (`strength_core_sample` + metrics):**
  - 4,470 builds: 4,446 valid, 24 conflicts
  - all 24 conflicts are the designed sore-legs responses
  - 0 style-lint violations
- **Frontend:** all node tests pass.
  - new `v3ExerciseImages.test.ts` (3)
  - v3BodyMap 7
  - v3CartFormat 14
  - v3PlainLanguage 5
  - v3TodayModel 6
  - cartHero 9
  - featuredHeroImage 7
  - inSessionProgress 12
  - healthSyncFormat 9
  - heartRateZones 9
- **New script:** `yarn test:v3-media`.
- **tsc:** clean for V3 files.
- **Nordic drift check:** above (section 1).

## 8. Blockers before the Guided Session

None from this pass. For the founder's review:

1. **Images:** mark the 84 photos in use in the contact sheet. Overrule any of the 37 removals you disagree with.
2. **Stills:** which of the 29 High-priority exercises to photograph first.
3. **Video mismatches** that will matter in the Guided Session. The library name matching attaches these videos:
   - a kettlebell jump squat to the bodyweight Jump Squat
   - a machine hip thrust to Glute Bridge
   - "KB Pull Press" to Kettlebell Clean and Press
   - a standing dumbbell extension frame to EZ Skull Crusher
   - an assisted pull-up to Neutral-Grip Pull-Up

   Fixing these needs library aliases or new videos. I made no change.
4. **Architecture flags (no change made):**
   - Sweat eligibility is automatic for new library rows.
   - Strength Core sessions draw from the whole library by category.
   - 19 canonical Athletic drills are unused.
   - 8 Sweat class-B movements are eligible but never picked.
