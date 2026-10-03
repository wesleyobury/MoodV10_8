# V2 media library audit for V3 Cart exercise images

Date: 2026-09-29. Read-only audit of /home/claude/mood. All artifacts are in /tmp/media_audit/.

## 1. What the "1,000+ card library" actually is

The V2 library is the 21 `frontend/data/*-data.ts` workout-card databases. They were parsed with `node --import tsx` (parse_v2.mjs, output v2_cards.json).

| metric | value |
|---|---|
| V2 workout cards | **1,435** (1,411 with an imageUrl) |
| unique image URLs on cards | **727** (Cloudinary 1,296 refs, emergentagent 109, unsplash 5, pexels 1) |
| single-movement cards with image | 852 cards, 495 unique images |
| multi-movement cards (2-8 movements) | 583 cards |
| distinct movements on single cards | ~375 (name/tutorialSlug keys) |
| movements carrying a tutorialSlug | 131 distinct slugs (1,462 movements have none) |
| single-card images reused across *different* movements | **139 of 495** |

So the founder's memory of "1,000+" is correct for **cards** (1,435), but those cards share **727 images**, and only **~356** single-card images are used for exactly one movement.

`.bak` files (21, one per data file): older copies without the structured `plan` block (only `battlePlan` text). They reference exactly the same 732 URL strings as the current files, so there is no extra imagery in them.

| file | cards | cards w/ image | unique images | single-movement cards | unique single-card images |
|---|---|---|---|---|---|
| abs-workouts-data.ts | 76 | 76 | 46 | 64 | 41 |
| back-workouts-data.ts | 128 | 128 | 73 | 82 | 51 |
| biceps-workouts-data.ts | 72 | 72 | 23 | 66 | 23 |
| bodyweight-explosiveness-data.ts | 63 | 63 | 36 | 53 | 36 |
| calisthenics-all-workouts-data.ts | 96 | 96 | 46 | 12 | 10 |
| calves-workouts-data.ts | 36 | 36 | 16 | 26 | 16 |
| cardio-workouts-data.ts | 78 | 78 | 25 | 0 | 0 |
| chest-workouts-data.ts | 108 | 108 | 33 | 81 | 33 |
| compound-legs-workouts-data.ts | 144 | 144 | 76 | 139 | 73 |
| explosiveness-weights-data.ts | 57 | 57 | 48 | 49 | 42 |
| glutes-workouts-data.ts | 57 | 45 | 23 | 40 | 23 |
| hamstrings-workouts-data.ts | 46 | 34 | 24 | 32 | 23 |
| lazy-bodyweight-data.ts | 66 | 66 | 30 | 16 | 13 |
| lazy-full-body-data.ts | 27 | 27 | 24 | 0 | 0 |
| lazy-lower-body-data.ts | 27 | 27 | 16 | 0 | 0 |
| lazy-upper-body-data.ts | 27 | 27 | 18 | 0 | 0 |
| light-weights-data.ts | 54 | 54 | 28 | 1 | 1 |
| outdoor-workouts-data.ts | 60 | 60 | 31 | 4 | 2 |
| quads-workouts-data.ts | 24 | 24 | 9 | 21 | 9 |
| shoulders-workouts-data.ts | 120 | 120 | 67 | 110 | 64 |
| triceps-workouts-data.ts | 69 | 69 | 38 | 64 | 36 |

### Other sources (none add a hidden per-exercise library)

| source | what it is | images |
|---|---|---|
| backend/cloudinary_image_mapping.json | emergentagent -> Cloudinary migration map (665 pairs) | 665 Cloudinary URLs, 663 are the same V2 card images |
| backend/exercises_seed_data.py (`PREVIEW_EXERCISES`, auto-seeded into `db.exercises`) | 174-exercise video library with name, aliases, video_url, thumbnail_url | 174 thumbnails, all **video frames** (`/video/upload/so_1.0,.../exercise_library/<slug>.jpg`). This is what V3 already attaches as `exercise.media.thumbnail_url` via `mood_v3/router.py` `attach_media` (name/alias match) |
| backend/add_exercises_batch*.py, add_*.py, fix_*.py, seed_exercise_videos.py | one-off inserts into `db.exercises` | only videos; every slug already in the 174 seed |
| backend/seed_data.py, seed_featured_workouts.py, _apply_featured_v2_images.py, _sync_seed_data_images.py, frontend/app/featured-workout-detail.tsx | featured workouts | per-exercise images are reused V2 card images plus 8-17 featured hero covers; found mismatches (e.g. "Hollow Body Hold" -> Pike_jump.jpg) |
| backend/featured_hero_map.json, frontend/hooks/useFeaturedWorkouts.ts | 8 featured hero covers | multi-exercise covers, not usable |
| frontend/utils/tutorialMap.ts | TUTORIAL_MAP (name -> library slug) + TUTORIAL_CANDIDATES | links to the 174 video library, not images. Loose (e.g. "10m push 10m pull" -> pull_ups) so not used as an alias source |
| frontend/utils/battlePlanFormat.ts | `tutorialThumbUrl(slug)` builds the same video-frame thumbnail | same 174 |
| unsplash URLs in backup screens / seed_test_data / server.py | 135 stock placeholders | not exercise-specific |

Across all repo sources: 1,563 image URL strings -> **898 unique images** after mapping emergentagent originals to their Cloudinary copies; 727 of them are the V2 card images. There is no bigger per-exercise image set in the repo.

## 2. How images are indexed, and how reliable they are

- Images are indexed **per workout card** (`card.imageUrl`), not per movement or exercise id. `plan.blocks[].movements[].tutorialSlug` points to the **video** library (`exercise_library/<slug>`), not to the card image. Slugs are sometimes wrong (for example "Bodyweight Hip Thrust" -> barbell_hip_thrust, "Banded Jump Squats" -> kb_squat, several cable/KB rows -> barbell_row).
- The card's `equipment` group (e.g. "Squat Rack", "Lat pull down machine") is the only reliable implement signal, because movement names often leave out the implement ("Push Press" appears under Barbell, Dumbbells, Kettlebells and Bands).
- **Multi-movement covers are not exercise images.** Of 6 random multi-movement covers checked: 2 showed the 1st movement (Cable Raise + Face Pull showed the cable lateral raise; VersaClimber intervals showed the climber), 2 showed a later movement (Flow Basics showed a side plank, the 4th movement; Vertical Guide showed the hip-thrust machine, the 2nd), and 2 showed something else (Heavy Rope Pull + Sprint showed battle-rope waves; Combo Superset rows showed a generic outdoor T-bar/row scene).
- **Single-movement card images are mostly right but not always.** 7 random single cards all matched their movement. Targeted checks of reused images found errors: `cu85n2we` (a man holding an atlas stone/slam ball) is used for sit-ups, crunches, flutter kicks and V-twists; `rw2y880d_chest_supported_db_row` is used on a barbell-row card; `lel4saj0_Pike_jump` is used for Hollow Body Hold in featured data.
- As a result, every mapping below was **visually checked**. 56 candidate images were viewed for the new map; 40 were accepted and 16 were rejected on sight or replaced by a better image (details in section 4).

### Problems found in the existing 81-entry map (frontend/utils/v3ExerciseImages.ts), from visual review
About 17 entries show a different movement or implement:
- db_incline_press: image is a standing DB shoulder press (file idt8edgt_db_shoulder_press)
- db_lateral_raise, db_jumping_jack: image is a chest-supported incline delt raise (no2mapks_Low_incline_delt_fly)
- ez_preacher_curl, ez_reverse_curl: standing EZ-bar curl image
- front_squat (barbell): image is a DB front squat
- walking_lunge (V3 dumbbells): barbell walking lunge; jump_squat (V3 bodyweight): barbell jump squat
- mb_backward_toss, mb_chest_pass, mb_overhead_throw, mb_rotational_slam, mb_rotational_throw, mb_scoop_toss, mb_shot_put: all 7 use the same generic atlas-ball ab photo (cu85n2we)
- sumo_deadlift: shares the barbell RDL image (46ki5rsl); treadmill_incline_walk uses a flat treadmill run
The "before" numbers below count these as covered, so they overstate how many rows really show the right exercise.

## 3. V3 exercise universe

Source: `mood_v3.engines.athletic.athletic_core.EX` (301 ids, the shared universe: Strength Library v11 + Sweat + Athletic additions). Direction pools:
- strength: `strength.adapter.EX` (all 196 marked active)
- sweat: `sweat_gen.EX` with sweat_class A/B/NEW (82, the classes sweat_gen allows)
- athletic: ids in `lib3.eligibility3(EX)` (112, including warm-up components)
- 22 ids are in no Direction's pool (sprint-start variants, muscle-ups and similar)

Full list with names and Directions: v3_universe.json.

## 4. New safe map: /tmp/media_audit/v3_image_map.json

**40 exercises**, none of which are in the existing 81 map. Match types: exact_id 6, exact_name 3, alias 0, normalized 10, manual 21. Every entry was visually verified. 39 come from single-movement cards; `inverted_row` is the one exception (a file named inverted_rows.jpg used only on multi-movement cards, verified by eye). `hang_high_pull` is borderline: the image shows the finish of a barbell high pull, and the hang start is not shown. `pull_up` and `ez_skull_crusher` are .avif files, so request them with an `f_jpg` or `f_auto` transform.

| V3 id | V3 name | match | source card |
|---|---|---|---|
| barbell_back_squat | Barbell Back Squat | manual | compound-legs-workouts-data.ts:Back Squat Burnout |
| barbell_hip_thrust | Barbell Hip Thrust | exact_id | glutes-workouts-data.ts:Tempo Hip Thrust |
| barbell_rdl | Barbell Romanian Deadlift | exact_id | hamstrings-workouts-data.ts:Barbell RDL |
| cable_fly | Cable Fly | manual | chest-workouts-data.ts:Cable Burn |
| cable_glute_kickback | Cable Glute Kickback | manual | glutes-workouts-data.ts:Cable High Kickback |
| cable_pressdown | Cable Triceps Pressdown | manual | triceps-workouts-data.ts:Pushdown Builder |
| cable_pull_through | Cable Pull-Through | normalized | glutes-workouts-data.ts:Cable Pull‑Through |
| chest_supported_row_machine | Chest-Supported Machine Row | manual | back-workouts-data.ts:Pause Rows |
| chin_up | Chin-Up | normalized | biceps-workouts-data.ts:Chin-Up Burn Builder |
| db_push_press | Dumbbell Push Press | manual | shoulders-workouts-data.ts:Heavy Push Press Builder |
| db_rdl | Dumbbell Romanian Deadlift | exact_id | compound-legs-workouts-data.ts:DB RDL |
| db_skull_crusher | Dumbbell Skull Crusher | exact_id | triceps-workouts-data.ts:Lying DB Skullcrushers |
| db_snatch | Dumbbell Snatch | manual | explosiveness-weights-data.ts:DB Snatch Alternating |
| db_step_up | Dumbbell Step-Up | manual | compound-legs-workouts-data.ts:Tempo Step-Ups |
| ez_skull_crusher | EZ-Bar Skull Crusher | normalized | triceps-workouts-data.ts:EZ Skullcrusher Builder |
| front_foot_elevated_split_squat | Front-Foot Elevated Split Squat | exact_name | compound-legs-workouts-data.ts:Front-Foot Elevated Split Squat |
| good_morning | Barbell Good Morning | normalized | hamstrings-workouts-data.ts:Barbell Hip Hinge Good Morning |
| hang_high_pull | Hang High Pull | manual | shoulders-workouts-data.ts:High Pull Control |
| hip_abduction_machine | Hip Abduction Machine | manual | glutes-workouts-data.ts:Triple Drop Abduction |
| inverted_row | Inverted Row | manual | calisthenics-all-workouts-data.ts:Volume Pull |
| landmine_push_press | Landmine Push Press | exact_id | shoulders-workouts-data.ts:Landmine Push Press Builder |
| landmine_rotational_punch | Landmine Rotational Punch | manual | explosiveness-weights-data.ts:Split Stance Rotation Punch |
| landmine_split_jerk | Landmine Split Jerk | manual | explosiveness-weights-data.ts:Landmine Split Jerk Ladder |
| lat_pulldown | Lat Pulldown | manual | back-workouts-data.ts:Pulldown + Hold |
| leg_press_calf_raise | Leg Press Calf Raise | exact_name | calves-workouts-data.ts:Leg Press Calf Raise |
| lying_leg_curl | Lying Leg Curl | exact_name | hamstrings-workouts-data.ts:Lying Leg Curl |
| machine_chest_press | Machine Chest Press | normalized | chest-workouts-data.ts:Heavy Machine |
| machine_crunch | Machine Crunch | manual | abs-workouts-data.ts:Slow Eccentric Machine Crunch |
| machine_glute_kickback | Machine Glute Kickback | manual | glutes-workouts-data.ts:Single-Leg Kickback |
| med_ball_slam | Med-Ball Slam | manual | bodyweight-explosiveness-data.ts:Slam Cluster Density |
| pec_deck | Pec Deck | normalized | chest-workouts-data.ts:Fly Control |
| plank | Front Plank | exact_id | abs-workouts-data.ts:Forearm Plank Hold |
| pull_up | Pull-Up | normalized | back-workouts-data.ts:Tempo Pull-Ups |
| rope_pressdown | Rope Triceps Pressdown | manual | triceps-workouts-data.ts:Rope Pushdown |
| seated_cable_row | Seated Cable Row | manual | back-workouts-data.ts:Cable Row Drop Set |
| single_leg_db_calf_raise | Single-Leg Dumbbell Calf Raise | normalized | calves-workouts-data.ts:Single‑Leg DB Calf Raise |
| smith_squat | Smith Machine Squat | manual | compound-legs-workouts-data.ts:Heavy Smith Squat |
| split_jump | Split-Squat Jump | normalized | bodyweight-explosiveness-data.ts:Split Squat Jump Repeats |
| weighted_pull_up | Weighted Pull-Up | normalized | back-workouts-data.ts:Weighted Pull-Ups |
| zercher_squat | Zercher Squat | manual | compound-legs-workouts-data.ts:Tempo Zercher Squat |

Rejected after viewing the image (not included): barbell_row (two images looked like a deadlift or RDL setup), broad_jump (image shows a vertical jump), bulgarian_split_squat (one image is a setup pose, the other is a barbell/rack variant while V3 uses dumbbells), captains_chair_knee_raise (seated bench tuck), first chin_up image (grip unclear), hip_abduction_machine first image (standing plate machine), lat_pulldown two images (standing), db_jump_squat two images (implement unclear), cable_pressdown first image (seated dip machine), split_jump and single_leg_db_calf_raise first images. Rejected by rule without viewing: close_grip_bench_press (image is an EZ-bar press), db_fly (only rear-delt or cable flies), kb_snatch (image shared with KB clean / clean-and-press), weighted_sit_up and decline_sit_up (the only images are either decline-with-plate or shared with generic sit-up cards), machine_hip_thrust and smith_hip_thrust (barbell hip-thrust images), db_clean_to_press (V2 has a push press, not a strict press), dead_bug (V2 only has a med-ball variant).

No alias-tier matches were made. The only alias data in the repo are the `exercises_seed_data.py` aliases (for the video library), and they are too loose to use (for example, "squat" is an alias of KB Squat).

## 5. Coverage

### By library (share of each Direction's exercise pool)
| Direction | pool | existing 81 map | 81 + new map | also counting library video-frame thumbnail: before -> after |
|---|---|---|---|---|
| strength | 196 | 54/196 (28%) | 87/196 (44%) | 90/196 (46%) -> 107/196 (55%) |
| sweat | 82 | 28/82 (34%) | 37/82 (45%) | 44/82 (54%) -> 48/82 (59%) |
| athletic | 112 | 32/112 (29%) | 48/112 (43%) | 52/112 (46%) -> 59/112 (53%) |
| ALL | 301 | 81/301 (27%) | 121/301 (40%) | 129/301 (43%) -> 149/301 (50%) |

(ALL = the 301-id universe. The library thumbnail column copies router.attach_media: norm_name matched against the 174 seeded exercises and their aliases. 85 of the 301 ids get a thumbnail this way.)

### Row-weighted (real generator on the harness)
84 generations: 3 Directions x 2 durations (30, 60) x 14 dates (2026-10-01..14), with `states=[]`, `soreness=[]`, `persist:false` and the harness default profile. That gave 332 block exercise rows covering only **66 unique ids**, so these figures describe the default profile, not the whole library. Warm-up items (134) are excluded.

| Direction | rows | existing 81 only | before (81 map OR media.thumbnail_url) | after (+ new map) | static images only (81 + new) |
|---|---|---|---|---|---|
| strength | 115 | 48.7% | 70.4% | 72.2% | 66.1% |
| sweat | 106 | 55.7% | 63.2% | 69.8% | 67.9% |
| athletic | 111 | 55.0% | 59.5% | 73.0% | 73.0% |
| ALL | 332 | 53.0% | 64.5% | 71.7% | 69.0% |

### Top remaining gaps (generated rows with no static image and no library thumbnail; row count in parentheses)
- strength: roman_chair_ghd_raise (18), box_step_up_glute (7), reverse_nordic (6), lateral_step_up (1)
- sweat: push_up (13), suitcase_carry (4), farmer_carry (4), waiter_carry (2), devil_press (2), wall_ball (2), db_squat_to_press (2), overhead_carry (2), dead_bug (1)
- athletic: seated_box_jump (4), explosive_push_up (3), acceleration_sprint (3), falling_start_sprint (3), kickstand_db_rdl (3), banded_lateral_bound (3), lateral_box_jump (2), pogo_to_box_jump (2), lateral_single_leg_hop (2), broad_jump_to_vertical (1), speed_box_squat (1), alternating_bound (1)

Largest gaps overall: roman_chair_ghd_raise (18 rows), push_up (13), box_step_up_glute (7), reverse_nordic (6), farmer/suitcase/overhead/waiter carries, seated_box_jump, and the sprint/bound/hop drills. V2 has **no single-movement card** for push-ups (every card that contains a push-up is multi-movement), GHD/glute-ham raise, Nordic curls, inverted rows (multi only), carries, dead bugs, Pallof presses, mountain climbers or side planks. These need new imagery. In the library as a whole, 152 of the 301 V3 ids still have no image from any source.

## 6. Places a bigger library could still exist (not visible in the repo)
- **Cloudinary account** `dfsygar5c`: folders `mood_app/workout_images` (at least 727 referenced images) and `exercise_library` (174 videos). A Cloudinary Admin API listing (needs credentials) would show whether there are uploaded images the repo never references.
- **Production MongoDB**: `db.exercises` can be edited through `POST /api/exercises` and `/api/exercises/bulk`, and the V3 media index reads whatever is in it. `db.admin_workouts` (admin-created workouts) and `db.featured_workouts` are also production-only. `db.workout_cards` holds user share cards (derived), and `db.workouts` / `db.generated_workouts` hold user data. None of these are in the repo. Worth dumping `db.exercises` (name, aliases, thumbnail_url) from production and checking its count against the 174 seed.
- emergentagent job artifact URLs (12 not migrated) are older copies. No evidence of an extra set.

## Files
- v3_image_map.json: the new safe map (40 entries)
- v2_cards.json: all 1,435 parsed V2 cards; v3_universe.json: 301 V3 ids with Directions; existing_map.json: the current 81 entries
- cands.json, near2.txt, picks.json, picks2.json: candidate generation and review; gen_rows.json: harness sample; coverage.json: numbers
- samples/: spot-check images and contact sheets (contact.jpg, contact2.jpg, verify/sheet0-3.jpg, verify2/sheet.jpg, existing/ex0-2.jpg)
