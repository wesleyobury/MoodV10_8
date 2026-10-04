# MOOD V3 Strength Core: Founder Review Pack (Personalization Pass)

Every workout came through the real production path (`service.generate_workout`) with the rebuilt Strength core after the personalization pass. Same user/date seed reproduces the same workout. For each case you get the full user context, the complete prescription (set methods shown inline), WHY THIS FITS TODAY (the exact Built for Today synthesis the app shows), REALIZED PERSONALIZATION (the contract: every input, what it intended, what it actually changed) and the State gate trace. Legacy blocks are the Phase 2.6 engine on identical inputs.

Sections N (founder test) hides the State: read the workout and the WHY line and judge whether the State is guessable and the workout defensible. The answer key is at the very end.

## A. No State (level and goal carry the session)

### Upper Push, 60, intermediate, build muscle

Context: State(s): none · level: intermediate · goal: Build muscle · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-14`

**Upper Push** · variant **Compound + Paired Accessories** · est. 59.3 min · 24 working sets
```
Barbell Bench Press: 4 × 5–7  RIR 2  rest 180 s
Parallel Bar Dip: 4 × 8–10  RIR 2  rest 120 s
Smith Machine Incline Press: 4 × 8–10  RIR 2  rest 120 s
SUPERSET A (4 rounds, rest 60 s after each round)
  A1 Dumbbell Fly: 4 × 12–15  RIR 1
  A2 Cable Triceps Pressdown: 4 × 12–15  RIR 1
EZ-Bar Skull Crusher: 4 × 12–15  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: Your muscle goal is why 3 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Barbell Bench Press, Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Compound + Paired Accessories shape (muscle goal weights it up); 3 accessory movements behind the main lift, 12 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 59.3 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

Legacy V3 (Phase 2.6), same inputs: strength_upper_push · est. 42.0 min
```
  Dumbbell Bench Press: 4 × 8  RIR 2  rest 120 s
  Parallel Bar Dip: 3 × 10  RIR 2  rest 90 s
  Plate-Loaded Incline Press: 3 × 10  RIR 2  rest 90 s
  Cable Fly: 2 × 12  RIR 1  rest 60 s
  Cable Triceps Pressdown: 2 × 12  RIR 1  rest 60 s
  Dumbbell Skull Crusher: 2 × 12  RIR 1  rest 60 s
```

### Upper Push, 60, beginner, build muscle (same seed)

Context: State(s): none · level: beginner · goal: Build muscle · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-14`

**Upper Push** · variant **Compound + Paired Accessories** · est. 56.4 min · 21 working sets
```
Incline Dumbbell Press: 4 × 6–8  RIR 2  rest 150 s
Seated Dumbbell Shoulder Press: 4 × 10–12  RIR 2  rest 120 s
Push-Up: 4 × 8–12  RIR 2  rest 120 s
SUPERSET A (3 rounds, rest 60 s after each round)
  A1 Pec Deck: 3 × 15–20  RIR 2
  A2 EZ-Bar Skull Crusher: 3 × 15–20  RIR 2
Cable Triceps Pressdown: 3 × 15–20  RIR 2  rest 60 s
```
WHY THIS FITS TODAY: Since you're newer to lifting, the main work keeps at least two reps in reserve and the movements stay approachable, and your muscle goal is why 3 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- experience = beginner → intended: match_programming_vocabulary_to_level → realized: beginner bands: every lift keeps 2+ reps in reserve, no exercise above 4 sets; beginner-rated, low-complexity movements only; no advanced set methods
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Compound + Paired Accessories shape (muscle goal weights it up); 3 accessory movements behind the main lift, 9 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 56.4 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

### Upper Push, 60, advanced, build muscle (same seed)

Context: State(s): none · level: advanced · goal: Build muscle · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-14`

**Upper Push** · variant **Compound + Paired Accessories** · est. 59.3 min · 24 working sets
```
Barbell Bench Press: 4 × 5–7  RIR 1  rest 180 s
Parallel Bar Dip: 4 × 8–10  RIR 2  rest 120 s
Smith Machine Incline Press: 4 × 8–10  RIR 2  rest 120 s
SUPERSET A (4 rounds, rest 60 s after each round)
  A1 Dumbbell Fly: 4 × 12–15  RIR 1
  A2 Cable Triceps Pressdown: 4 × 12–15  RIR 1
EZ-Bar Skull Crusher: 4 × 12–15  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: Since you're an advanced lifter, Barbell Bench Press runs to a rep from failure, and your muscle goal is why 3 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- experience = advanced → intended: match_programming_vocabulary_to_level → realized: Barbell Bench Press runs to RIR 1 (advanced band position); higher-complexity movements kept in: Barbell Bench Press, Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Compound + Paired Accessories shape (muscle goal weights it up); 3 accessory movements behind the main lift, 12 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 59.3 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

### Lower Body: Squat, 60, intermediate, build strength

Context: State(s): none · level: intermediate · goal: Build strength · 60 min · target: Lower Body: Squat · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-15`

**Lower Body: Squat** · variant **Traditional** · est. 55.0 min · 18 working sets
```
Hack Squat: 4 × 5–7  RIR 2  rest 210 s
Leg Press: 4 × 8–10  RIR 2  rest 120 s
Walking Lunge: 4 × 8–10/side  RIR 2  rest 120 s
Reverse Nordic Curl: 3 × 12–15  RIR 1  rest 60 s
Roman Chair / GHD Glute-Ham Raise: 3 × 10–12  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: Your strength goal keeps the main lift heavy with full rest.

REALIZED PERSONALIZATION:
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Roman Chair / GHD Glute-Ham Raise
- goal = build_strength → intended: primary_emphasis_heavier_longer_rest → realized: Hack Squat at 5–7 with full 210 s rest
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 55.0 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

Legacy V3 (Phase 2.6), same inputs: strength_lower_squat · est. 43.0 min
```
  Barbell Back Squat: 4 × 6  RIR 2  rest 150 s
  Leg Press: 3 × 10  RIR 2  rest 90 s
  Reverse Lunge: 3 × 10/side  RIR 2  rest 90 s
  Leg Extension: 3 × 12  RIR 1  rest 60 s
  Roman Chair / GHD Glute-Ham Raise: 3 × 12  RIR 1  rest 60 s
```

### Lower Body: Squat, 60, intermediate, build muscle (same seed)

Context: State(s): none · level: intermediate · goal: Build muscle · 60 min · target: Lower Body: Squat · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-15`

**Lower Body: Squat** · variant **Traditional** · est. 56.0 min · 20 working sets
```
Hack Squat: 4 × 5–7  RIR 2  rest 165 s
Leg Press: 4 × 8–10  RIR 2  rest 120 s
Walking Lunge: 4 × 8–10/side  RIR 2  rest 120 s
Reverse Nordic Curl: 4 × 12–15  RIR 1  rest 60 s
Roman Chair / GHD Glute-Ham Raise: 4 × 10–12  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: Your muscle goal is why 2 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Roman Chair / GHD Glute-Ham Raise
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 2 accessory movements behind the main lift, 8 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 56.0 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

### Lower Body: Squat, 60, intermediate, lose weight / conditioning (same seed)

Context: State(s): none · level: intermediate · goal: Lose weight / conditioning · 60 min · target: Lower Body: Squat · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-15`

**Lower Body: Squat** · variant **Traditional** · est. 52.0 min · 18 working sets
```
Hack Squat: 4 × 5–7  RIR 2  rest 180 s
Leg Press: 4 × 8–10  RIR 2  rest 105 s
Walking Lunge: 4 × 8–10/side  RIR 2  rest 105 s
Reverse Nordic Curl: 3 × 12–15  RIR 1  rest 60 s
Roman Chair / GHD Glute-Ham Raise: 3 × 10–12  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: Your conditioning goal keeps the accessory rests short.

REALIZED PERSONALIZATION:
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Roman Chair / GHD Glute-Ham Raise
- goal = lose_weight_conditioning → intended: density_short_rests_paired_work → realized: short rests on the accessories (60 s)
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 52.0 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

### Upper Pull, 60, advanced, improve athleticism

Context: State(s): none · level: advanced · goal: Improve athleticism · 60 min · target: Upper Pull · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-16`

**Upper Pull** · variant **Heavy Primary** · est. 56.2 min · 17 working sets · set methods: drop_set
```
Chest-Supported Machine Row: 5 × 4–6  RIR 1  rest 240 s
Pull-Up: 4 × 6–8  RIR 2  rest 135 s
Bent-Over Dumbbell Row (Two-Arm): 4 × 6–8  RIR 2  rest 135 s
Dumbbell Pullover: 2 × 10–12 · drop set on the final set  RIR 1  (On the last set, hit the reps, drop the load about 25% and go again to the same reps-in-reserve. Stop each set with about 1 rep left in the tank.)  rest 60 s
EZ-Bar Preacher Curl: 2 × 10–12  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: Since you're an advanced lifter, we're keeping drop set on the final set on Dumbbell Pullover in the mix, and your athleticism goal keeps the main lift heavy and fast with full rest.

REALIZED PERSONALIZATION:
- experience = advanced → intended: match_programming_vocabulary_to_level → realized: drop set on the final set on Dumbbell Pullover; Chest-Supported Machine Row runs to RIR 1 (advanced band position); higher-complexity movements kept in: Pull-Up; Heavy Primary shape
- goal = improve_athleticism → intended: heavy_primary_with_intent → realized: Chest-Supported Machine Row kept heavy (4–6) with full rest; Heavy Primary shape
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 56.2 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

### Glutes + Legs, 60, beginner, feel better

Context: State(s): none · level: beginner · goal: Feel better / reduce stress · 60 min · target: Glutes + Legs · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-17`

**Glutes + Legs** · variant **Traditional** · est. 53.2 min · 16 working sets
```
Barbell Hip Thrust: 4 × 6–8  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 150 s
Pit Shark Belt Squat: 4 × 8–10  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 120 s
Reverse Lunge: 4 × 8–10/side  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 120 s
Cable Glute Kickback: 2 × 12–15/side  RIR 2  rest 60 s
Seated Leg Curl: 2 × 12–15  RIR 2  rest 60 s
FINISHER  Frog Pump: 2 × 15–20  RIR 0  rest 30 s
```
WHY THIS FITS TODAY: Since you're newer to lifting, the main work keeps at least two reps in reserve and the movements stay approachable, and your feel-better goal keeps the compound work two reps from failure.

REALIZED PERSONALIZATION:
- experience = beginner → intended: match_programming_vocabulary_to_level → realized: beginner bands: every lift keeps 2+ reps in reserve, no exercise above 4 sets; beginner-rated, low-complexity movements only; no advanced set methods
- goal = feel_better_reduce_stress → intended: steady_effort_away_from_failure → realized: Traditional shape (feel-better goal weights it up); compound work stays 2+ reps from failure
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 53.2 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

Legacy V3 (Phase 2.6), same inputs: strength_glutes_legs · est. 41.0 min
```
  Barbell Hip Thrust: 4 × 8  RIR 2  rest 120 s
  Dumbbell Romanian Deadlift: 3 × 10  RIR 2  rest 90 s
  Reverse Lunge: 3 × 10/side  RIR 2  rest 90 s
  Cable Glute Kickback: 3 × 12/side  RIR 1  rest 60 s
  Leg Extension: 3 × 12  RIR 1  rest 60 s
```

### MOOD's Pick, 30, intermediate, stay consistent (first session)

Context: State(s): none · level: intermediate · goal: Stay consistent · 30 min · target: MOOD's Pick · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-18`

**Glutes + Legs** · variant **Efficient** · est. 26.8 min · 10 working sets
```
Barbell Hip Thrust: 3 × 5–7  RIR 2  rest 135 s
Trap-Bar Deadlift: 3 × 8–10  RIR 2  rest 90 s
Cable Glute Kickback: 2 × 10–12/side  RIR 1  rest 45 s
Leg Extension: 2 × 10–12  RIR 1  rest 45 s
```
WHY THIS FITS TODAY: (no synthesised line: nothing material beyond the structure lines)

REALIZED PERSONALIZATION:
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Trap-Bar Deadlift
- goal = stay_consistent → intended: balanced_general_strength → realized: nothing (no claim made)
- duration = 30 → intended: fill_the_requested_time_with_useful_work → realized: filled toward the requested time: slot_added Leg Extension; 30-minute session: 4 exercises, 10 working sets, main work kept; estimated 26.8 min for a 30-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

### Full Body, 60, intermediate, build muscle

Context: State(s): none · level: intermediate · goal: Build muscle · 60 min · target: Full Body · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-19`

**Full Body** · variant **Heavy Primary** · est. 58.4 min · 16 working sets · set methods: pause
```
Barbell Romanian Deadlift: 5 × 4–6 · paused reps  RIR 2  (Pause 2 s at the hardest point of every rep, then drive out of it. Stop each set with about 2 reps left in the tank.)  rest 225 s
Renegade Row: 4 × 8–10/side  RIR 2  rest 135 s
Pull-Up: 4 × 8–10  RIR 2  rest 135 s
Pallof Press: 3 × 10–12/side  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: As an intermediate lifter, paused reps on Barbell Romanian Deadlift is on the table, and your muscle goal is why 1 accessory movement sits behind the main lifts.

REALIZED PERSONALIZATION:
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: paused reps on Barbell Romanian Deadlift (intermediate and up); intermediate pool: Barbell Romanian Deadlift, Renegade Row, Pull-Up
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 1 accessory movement behind the main lift, 3 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 58.4 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

## B. Low Energy

### Upper Push, 60, intermediate

Context: State(s): low_energy · level: intermediate · goal: Build muscle · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-14`

**Upper Push** · variant **Compound + Paired Accessories** · est. 53.2 min · 19 working sets
```
Barbell Bench Press: 4 × 5–7  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 180 s
Parallel Bar Dip: 4 × 10–12  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 120 s
Plate-Loaded Incline Press: 4 × 10–12  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 120 s
SUPERSET A (2 rounds, rest 60 s after each round)
  A1 Dumbbell Fly: 2 × 12–15  RIR 1
  A2 Machine Triceps Extension: 2 × 12–15  RIR 1
Overhead Cable Triceps Extension: 3 × 12–15  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: You're low on energy today, so we're keeping you further from failure on every set, leaning into stable, low-friction movements and keeping the main lifts at moderate loads. Your muscle goal is why 3 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- state = low_energy (expression: moderate_load) → intended: reduce_training_cost → realized: Parallel Bar Dip 8–10→10–12; Plate-Loaded Incline Press 8–10→10–12; Barbell Bench Press RIR 2→3; Parallel Bar Dip RIR 2→3; Plate-Loaded Incline Press RIR 2→3; Smith Machine Incline Press → Plate-Loaded Incline Press; Cable Triceps Pressdown → Machine Triceps Extension; EZ-Bar Skull Crusher → Overhead Cable Triceps Extension
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Barbell Bench Press, Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Compound + Paired Accessories shape (muscle goal weights it up); 3 accessory movements behind the main lift, 7 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: trimmed to fit: set_removed; estimated 53.2 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: low_energy: attempt 0 expression 'moderate_load' realized ['reps', 'rir', 'exercises'] no-ops [] → satisfied

Legacy V3 (Phase 2.6), same inputs: strength_upper_push · est. 40.0 min
```
  Dumbbell Bench Press: 4 × 8  RIR 2  rest 120 s
  Seated Dumbbell Shoulder Press: 3 × 10  RIR 2  rest 90 s
  Plate-Loaded Incline Press: 3 × 10  RIR 2  rest 90 s
  Pec Deck: 2 × 12  RIR 1  rest 60 s
  Machine Triceps Extension: 3 × 12  RIR 1  rest 60 s
```

### Lower Body: Hinge, 60, advanced, build strength

Context: State(s): low_energy · level: advanced · goal: Build strength · 60 min · target: Lower Body: Hinge · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-20`

**Lower Body: Hinge** · variant **Traditional** · est. 52.0 min · 16 working sets
```
Barbell Romanian Deadlift: 4 × 5–7  RIR 1  rest 210 s
Cable Pull-Through: 4 × 6–8  RIR 2  rest 120 s
Reverse Lunge: 4 × 6–8/side  RIR 2  rest 120 s
Single-Leg Lying Leg Curl: 4 × 10–12/side  RIR 2  rest 60 s
```
WHY THIS FITS TODAY: You're low on energy today, so we're leaving Side Plank out and keeping the structure simple. Since you're an advanced lifter, the compound work stays demanding before the accessories, and your strength goal keeps the main lift heavy with full rest.

REALIZED PERSONALIZATION:
- state = low_energy (expression: simplify) → intended: reduce_training_cost → realized: left out Side Plank; Traditional instead of Heavy Primary
- experience = advanced → intended: match_programming_vocabulary_to_level → realized: Barbell Romanian Deadlift runs to RIR 1 (advanced band position); higher-complexity movements kept in: Barbell Romanian Deadlift
- goal = build_strength → intended: primary_emphasis_heavier_longer_rest → realized: Barbell Romanian Deadlift at 5–7 with full 210 s rest
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: filled toward the requested time: set_added; estimated 52.0 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: low_energy: attempt 0 expression 'simplify' realized ['slot_removed', 'structure'] no-ops [] → satisfied

### Upper Pull, 30, beginner

Context: State(s): low_energy · level: beginner · goal: Build muscle · 30 min · target: Upper Pull · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-21`

**Upper Pull** · variant **Efficient** · est. 26.9 min · 10 working sets · set methods: slow_eccentric
```
Chest-Supported Machine Row: 3 × 6–8  RIR 2  rest 120 s
Lat Pulldown: 3 × 10–12 · 3 s eccentric  RIR 2  (Take 3 s to lower every rep, then lift at normal speed. Stop each set with about 2 reps left in the tank.)  rest 90 s
SUPERSET A (2 rounds, rest 60 s after each round)
  A1 Machine Preacher Curl: 2 × 15–20  RIR 2
  A2 Reverse Pec Deck: 2 × 15–20  RIR 2
```
WHY THIS FITS TODAY: You're low on energy today, so we're slowing the eccentric on Lat Pulldown instead of adding load. Since you're newer to lifting, the main work keeps at least two reps in reserve and the movements stay approachable, and your muscle goal is why 2 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- state = low_energy (expression: simplify) → intended: reduce_training_cost → realized: 3 s eccentric on Lat Pulldown
- experience = beginner → intended: match_programming_vocabulary_to_level → realized: beginner bands: every lift keeps 2+ reps in reserve, no exercise above 3 sets; beginner-rated, low-complexity movements only
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 2 accessory movements behind the main lift, 4 accessory sets in the 10–20 range; 3 s eccentric on Lat Pulldown
- duration = 30 → intended: fill_the_requested_time_with_useful_work → realized: filled toward the requested time: slot_added Reverse Pec Deck; 30-minute session: 4 exercises, 10 working sets, main work kept; estimated 26.9 min for a 30-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: low_energy: attempt 0 expression 'simplify' realized ['set_method'] no-ops ['state_slot_removed_no_effect', 'state_rir_no_effect'] → satisfied

## C. Amped

### Upper Push, 60, intermediate

Context: State(s): amped · level: intermediate · goal: Build muscle · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-14`

**Upper Push** · variant **Compound + Paired Accessories** · est. 55.8 min · 20 working sets
```
Barbell Bench Press: 5 × 5–7  RIR 2  rest 180 s
Parallel Bar Dip: 4 × 8–10  RIR 2  rest 120 s
Smith Machine Incline Press: 4 × 8–10  RIR 2  rest 120 s
SUPERSET A (2 rounds, rest 60 s after each round)
  A1 Dumbbell Fly: 2 × 12–15  RIR 1
  A2 Cable Triceps Pressdown: 2 × 12–15  RIR 1
EZ-Bar Skull Crusher: 3 × 12–15  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: You're amped today, so we're adding a working set to Barbell Bench Press. Your muscle goal is why 3 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- state = amped (expression: extra_set_paired) → intended: use_readiness_productively → realized: Barbell Bench Press 4→5 sets
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Barbell Bench Press, Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Compound + Paired Accessories shape (muscle goal weights it up); 3 accessory movements behind the main lift, 7 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: trimmed to fit: set_removed; estimated 55.8 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: amped: attempt 0 expression 'extra_set_paired' realized ['volume'] no-ops [] → satisfied

Legacy V3 (Phase 2.6), same inputs: strength_upper_push · est. 43.0 min
```
  Dumbbell Bench Press: 4 × 8  RIR 1  rest 120 s
  Parallel Bar Dip: 3 × 10  RIR 1  rest 90 s
  Plate-Loaded Incline Press: 3 × 10  RIR 1  rest 90 s
  SUPERSET A (2 rounds, rest 60 s after each round)
    A1 Cable Fly: 2 × 12  RIR 0
    A2 Cable Triceps Pressdown: 2 × 12  RIR 0
  Dumbbell Skull Crusher: 2 × 12  RIR 0  rest 60 s
  FINISHER  Reverse Pec Deck: 2 × 20  RIR 0  rest 30 s
```

### Lower Body: Squat, 60, advanced, build strength

Context: State(s): amped · level: advanced · goal: Build strength · 60 min · target: Lower Body: Squat · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-22`

**Lower Body: Squat** · variant **Top Set + Back-off** · est. 57.0 min · 17 working sets · set methods: pause
```
Barbell Back Squat: 5 sets: 4/7/7/7/7 · paused reps  RIR 1  (Pause 2 s at the hardest point of every rep, then drive out of it. Top set heavy, then back off 10–15% for the remaining sets. Stop each set with about 1 rep left in the tank.)  rest 240 s
Leg Press: 4 × 6–8  RIR 2  rest 135 s
Front-Foot Elevated Split Squat: 4 × 6–8/side  RIR 2  rest 135 s
SUPERSET A (2 rounds, rest 60 s after each round)
  A1 Reverse Nordic Curl: 2 × 12–15  RIR 1
  A2 Roman Chair / GHD Glute-Ham Raise: 2 × 10–12  RIR 1
```
WHY THIS FITS TODAY: You're amped today, so we're adding a working set to Barbell Back Squat. Since you're an advanced lifter, we're keeping paused reps on Barbell Back Squat in the mix, and your strength goal keeps the main lift heavy with full rest.

REALIZED PERSONALIZATION:
- state = amped (expression: extra_set_paired) → intended: use_readiness_productively → realized: Barbell Back Squat 4→5 sets
- experience = advanced → intended: match_programming_vocabulary_to_level → realized: paused reps on Barbell Back Squat; Barbell Back Squat runs to RIR 1 (advanced band position); higher-complexity movements kept in: Barbell Back Squat, Roman Chair / GHD Glute-Ham Raise; Top Set + Back-off shape
- goal = build_strength → intended: primary_emphasis_heavier_longer_rest → realized: Top Set + Back-off shape (strength goal weights it up); Barbell Back Squat at 4–6 with full 240 s rest; paused reps on Barbell Back Squat
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 57.0 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: amped: attempt 0 expression 'extra_set_paired' realized ['volume'] no-ops [] → satisfied

### Upper Body (mixed), 30, intermediate

Context: State(s): amped · level: intermediate · goal: Build muscle · 30 min · target: Upper Body (mixed) · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-23`

**Upper Body** · variant **Compound + Paired Accessories** · est. 29.9 min · 9 working sets · set methods: rest_pause
```
Barbell Bench Press: 4 × 5–7  RIR 2  rest 150 s
Chest-Supported Machine Row: 3 × 8–10  RIR 2  rest 120 s
Cable Lateral Raise: 2 × 15–20/side · rest-pause on the final set  RIR 1  (On the last set, hit the reps, rest 15 s, then add as many clean reps as you can. Stop each set with about 1 rep left in the tank.)  rest 45 s
```
WHY THIS FITS TODAY: You're amped today, so we're adding a working set to Barbell Bench Press and using rest-pause on the final set on Cable Lateral Raise. As an intermediate lifter, rest-pause on the final set on Cable Lateral Raise is on the table, and your muscle goal is why 1 accessory movement sits behind the main lifts.

REALIZED PERSONALIZATION:
- state = amped (expression: extra_set_paired) → intended: use_readiness_productively → realized: Barbell Bench Press 3→4 sets; rest-pause on the final set on Cable Lateral Raise
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: rest-pause on the final set on Cable Lateral Raise (intermediate and up); intermediate pool: Barbell Bench Press
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Compound + Paired Accessories shape (muscle goal weights it up); 1 accessory movement behind the main lift, 2 accessory sets in the 10–20 range; rest-pause on the final set on Cable Lateral Raise
- duration = 30 → intended: fill_the_requested_time_with_useful_work → realized: trimmed to fit: set_removed; 30-minute session: 3 exercises, 9 working sets, main work kept; estimated 29.9 min for a 30-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: amped: attempt 0 expression 'extra_set_paired' realized ['volume', 'set_method'] no-ops [] → satisfied

### Glutes + Legs, 60, beginner

Context: State(s): amped · level: beginner · goal: Build muscle · 60 min · target: Glutes + Legs · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-24`

**Glutes + Legs** · variant **Volume** · est. 54.9 min · 18 working sets
```
Barbell Hip Thrust: 4 × 6–8  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 135 s
Pit Shark Belt Squat: 4 × 10–12  RIR 2  rest 120 s
Reverse Lunge: 4 × 10–12/side  RIR 2  rest 120 s
Machine Glute Kickback: 2 × 15–20/side  RIR 2  rest 60 s
SUPERSET A (2 rounds, rest 60 s after each round)
  A1 Seated Leg Curl: 2 × 15–20  RIR 2
  A2 Leg Extension: 2 × 15–20  RIR 2
```
WHY THIS FITS TODAY: You're amped today, so we're pushing the main lifts to the heavy end of their range. Since you're newer to lifting, the main work keeps at least two reps in reserve and the movements stay approachable, and your muscle goal is why 3 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- state = amped (expression: heavy_end) → intended: use_readiness_productively → realized: Barbell Hip Thrust 8–10→6–8
- experience = beginner → intended: match_programming_vocabulary_to_level → realized: beginner bands: every lift keeps 2+ reps in reserve, no exercise above 4 sets; beginner-rated, low-complexity movements only; no advanced set methods
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Volume shape (muscle goal weights it up); 3 accessory movements behind the main lift, 6 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: trimmed to fit: accessory_rest_shortened, finisher_dropped, set_removed; estimated 54.9 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: amped: attempt 0 expression 'extra_set_paired' realized [] no-ops ['state_volume_no_effect'] → NOT satisfied | amped: fallback extra_set_paired → heavy_end | amped: attempt 1 expression 'heavy_end' realized ['reps'] no-ops ['state_rir_no_effect'] → satisfied

## D. Irritated

### Upper Push, 60, intermediate

Context: State(s): irritated · level: intermediate · goal: Build muscle · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-14`

**Upper Push** · variant **Top Set + Back-off** · est. 57.5 min · 21 working sets
```
Barbell Bench Press: 4 sets: 4/7/7/7  RIR 2  (Top set heavy, then back off 10–15% for the remaining sets. Stop each set with about 2 reps left in the tank.)  rest 225 s
Parallel Bar Dip: 4 × 8–10  RIR 2  rest 135 s
Smith Machine Incline Press: 4 × 8–10  RIR 2  rest 135 s
SUPERSET A (3 rounds, rest 60 s after each round)
  A1 Dumbbell Fly: 3 × 10–12  RIR 1
  A2 Cable Triceps Pressdown: 3 × 10–12  RIR 1
EZ-Bar Skull Crusher: 3 × 10–12  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: You're irritated today, so we're keeping the structure direct and loading the main lifts heavier. As an intermediate lifter, the top-set scheme is in play, and your muscle goal is why 3 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- state = irritated (expression: forceful_finish) → intended: direct_physical_cathartic_work → realized: Barbell Bench Press 5–7→4–6; Top Set + Back-off instead of Compound + Paired Accessories
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: Top Set + Back-off (intermediate and up); intermediate pool: Barbell Bench Press, Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 3 accessory movements behind the main lift, 9 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 57.5 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: irritated: attempt 0 expression 'forceful_finish' realized ['reps', 'structure'] no-ops [] → satisfied

Legacy V3 (Phase 2.6), same inputs: strength_upper_push · est. 44.0 min
```
  Dumbbell Bench Press: 4 × 8  RIR 1  rest 120 s
  Seated Dumbbell Shoulder Press: 3 × 10  RIR 1  rest 90 s
  Plate-Loaded Incline Press: 3 × 10  RIR 1  rest 90 s
  SUPERSET A (2 rounds, rest 60 s after each round)
    A1 Cable Fly: 2 × 12  RIR 0
    A2 Cable Triceps Pressdown: 2 × 12  RIR 0
  Dumbbell Skull Crusher: 2 × 12  RIR 0  rest 60 s
  FINISHER  Kettlebell Swing: 3 × 15  RIR 1  rest 45 s
```

### Glutes + Legs, 60, intermediate

Context: State(s): irritated · level: intermediate · goal: Build muscle · 60 min · target: Glutes + Legs · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-24`

**Glutes + Legs** · variant **Traditional** · est. 57.9 min · 20 working sets
```
Barbell Hip Thrust: 4 × 5–7  RIR 2  rest 165 s
Trap-Bar Deadlift: 4 × 8–10  RIR 2  rest 120 s
Reverse Lunge: 4 × 8–10/side  RIR 2  rest 120 s
Machine Glute Kickback: 4 × 10–12/side  RIR 1  rest 60 s
Reverse Nordic Curl: 4 × 12–15  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: You're irritated today, so we're keeping the structure direct. Your muscle goal is why 2 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- state = irritated (expression: direct_simple) → intended: direct_physical_cathartic_work → realized: Traditional instead of Volume
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Trap-Bar Deadlift
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 2 accessory movements behind the main lift, 8 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: trimmed to fit: finisher_dropped; estimated 57.9 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: irritated: attempt 0 expression 'direct_simple' realized ['structure'] no-ops ['state_reps_no_effect'] → satisfied

### Upper Pull, 30, intermediate

Context: State(s): irritated · level: intermediate · goal: Build muscle · 30 min · target: Upper Pull · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-25`

**Upper Pull** · variant **Heavy Primary** · est. 30.5 min · 9 working sets · set methods: drop_set
```
Chest-Supported Machine Row: 4 × 4–6  RIR 2  (Move the bar with intent: controlled down, drive up as fast as it will go. Stop each set with about 2 reps left in the tank.)  rest 210 s
Neutral-Grip Lat Pulldown: 3 × 8–10 · drop set on the final set  RIR 2  (On the last set, hit the reps, drop the load about 25% and go again to the same reps-in-reserve. Stop each set with about 2 reps left in the tank.)  rest 120 s
Barbell Curl: 2 × 10–12  RIR 1  rest 45 s
```
WHY THIS FITS TODAY: You're irritated today, so we're building the session around heavy, simple compound work, driving every rep of Chest-Supported Machine Row with intent and giving the heavy work full rest so it stays heavy. As an intermediate lifter, drop set on the final set on Neutral-Grip Lat Pulldown is on the table, and your muscle goal is why 1 accessory movement sits behind the main lifts.

REALIZED PERSONALIZATION:
- state = irritated (expression: heavy_primary) → intended: direct_physical_cathartic_work → realized: Chest-Supported Machine Row rest 210→225 s; Neutral-Grip Lat Pulldown rest 120→135 s; explosive intent on Chest-Supported Machine Row; Heavy Primary instead of Compound + Paired Accessories
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: drop set on the final set on Neutral-Grip Lat Pulldown (intermediate and up)
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 1 accessory movement behind the main lift, 2 accessory sets in the 10–20 range; drop set on the final set on Neutral-Grip Lat Pulldown
- duration = 30 → intended: fill_the_requested_time_with_useful_work → realized: trimmed to fit: rest_shortened, set_removed; 30-minute session: 3 exercises, 9 working sets, main work kept; estimated 30.5 min for a 30-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: irritated: attempt 0 expression 'direct_simple' realized [] no-ops ['state_reps_no_effect'] → NOT satisfied | irritated: fallback direct_simple → heavy_primary | irritated: attempt 1 expression 'heavy_primary' realized ['rest', 'tempo', 'structure'] no-ops ['state_reps_no_effect'] → satisfied

### Lower Body: Hinge, 60, advanced

Context: State(s): irritated · level: advanced · goal: Build muscle · 60 min · target: Lower Body: Hinge · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-26`

**Lower Body: Hinge** · variant **Traditional** · est. 58.3 min · 20 working sets
```
Barbell Romanian Deadlift: 4 × 4–6  RIR 1  (Move the bar with intent: controlled down, drive up as fast as it will go. Stop each set with about 1 rep left in the tank.)  rest 195 s
Cable Pull-Through: 4 × 8–10  RIR 2  rest 135 s
Curtsy Lunge: 4 × 8–10/side  RIR 2  rest 135 s
Seated Leg Curl: 4 × 10–12  RIR 1  rest 60 s
Ab Wheel Rollout: 4 × 10–12  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: You're irritated today, so we're loading the main lifts heavier, driving every rep of Barbell Romanian Deadlift with intent and giving the heavy work full rest so it stays heavy. Since you're an advanced lifter, Barbell Romanian Deadlift runs to a rep from failure, and your muscle goal is why 2 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- state = irritated (expression: heavy_primary) → intended: direct_physical_cathartic_work → realized: Barbell Romanian Deadlift 5–7→4–6; Barbell Romanian Deadlift rest 165→195 s; Cable Pull-Through rest 120→135 s; Curtsy Lunge rest 120→135 s; explosive intent on Barbell Romanian Deadlift
- experience = advanced → intended: match_programming_vocabulary_to_level → realized: Barbell Romanian Deadlift runs to RIR 1 (advanced band position); higher-complexity movements kept in: Barbell Romanian Deadlift, Curtsy Lunge, Ab Wheel Rollout
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 2 accessory movements behind the main lift, 8 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 58.3 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: irritated: attempt 0 expression 'forceful_finish' realized [] no-ops ['state_reps_no_effect'] → NOT satisfied | irritated: fallback forceful_finish → heavy_primary | irritated: attempt 1 expression 'heavy_primary' realized ['reps', 'rest', 'tempo'] no-ops [] → satisfied

## E. Bored

### Upper Push, 60, intermediate

Context: State(s): bored · level: intermediate · goal: Build muscle · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-14`

**Upper Push** · variant **Compound + Paired Accessories** · est. 53.8 min · 19 working sets · set methods: one_and_half
```
Barbell Bench Press: 4 × 5–7  RIR 2  rest 180 s
Parallel Bar Dip: 4 × 8–10  RIR 2  rest 120 s
Smith Machine Incline Press: 4 × 8–10 · 1.5 reps  RIR 2  (Full rep, half rep from the stretched position, back to the top: that is one rep. Stop each set with about 2 reps left in the tank.)  rest 120 s
SUPERSET A (2 rounds, rest 60 s after each round)
  A1 Low-to-High Cable Fly: 2 × 12–15  RIR 1
  A2 Dumbbell Overhead Triceps Extension: 2 × 12–15  RIR 1
LADDER Cross-Body Cable Triceps Extension: 3 sets: 15/12/9  RIR 1  rest 30 s
```
WHY THIS FITS TODAY: You're bored today, so we're changing the feel with 1.5 reps on the Smith Machine Incline Press and bringing in 3 less-familiar movements. Your muscle goal is why 3 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- state = bored (expression: new_structure) → intended: refresh_the_experience → realized: 1.5 reps on Smith Machine Incline Press; Dumbbell Fly → Low-to-High Cable Fly; Cable Triceps Pressdown → Dumbbell Overhead Triceps Extension; EZ-Bar Skull Crusher → Cross-Body Cable Triceps Extension
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: 1.5 reps on Smith Machine Incline Press (intermediate and up); intermediate pool: Barbell Bench Press, Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Compound + Paired Accessories shape (muscle goal weights it up); 3 accessory movements behind the main lift, 7 accessory sets in the 10–20 range; 1.5 reps on Smith Machine Incline Press
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: trimmed to fit: set_removed; estimated 53.8 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: bored: attempt 0 expression 'new_structure' realized ['set_method', 'exercises'] no-ops [] → satisfied

Legacy V3 (Phase 2.6), same inputs: strength_upper_push · est. 40.0 min
```
  Dumbbell Bench Press: 4 × 8  RIR 2  rest 120 s
  Parallel Bar Dip: 3 × 10  RIR 2  rest 90 s
  PYRAMID Plate-Loaded Incline Press: 3 × 12/10/8  RIR 2  rest 90 s
  SUPERSET A (2 rounds, rest 60 s after each round)
    A1 Low-to-High Cable Fly: 2 × 12  RIR 1
    A2 Cross-Body Cable Triceps Extension: 2 × 12/side  RIR 1
  Machine Triceps Extension: 2 × 12  RIR 1  rest 60 s
```

### Lower Body: Squat, 60, intermediate

Context: State(s): bored · level: intermediate · goal: Build muscle · 60 min · target: Lower Body: Squat · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-26`

**Lower Body: Squat** · variant **Compound + Paired Accessories** · est. 55.2 min · 20 working sets · set methods: one_and_half
```
Barbell Back Squat: 4 × 5–7  RIR 2  rest 180 s
Leg Press: 4 × 8–10 · 1.5 reps  RIR 2  (Full rep, half rep from the stretched position, back to the top: that is one rep. Stop each set with about 2 reps left in the tank.)  rest 120 s
Lateral Step-Up: 4 × 8–10/side  RIR 2  rest 120 s
SUPERSET A (4 rounds, rest 60 s after each round)
  A1 Reverse Nordic Curl: 4 × 12–15  RIR 1
  A2 Roman Chair / GHD Glute-Ham Raise: 4 × 12–15  RIR 1
```
WHY THIS FITS TODAY: You're bored today, so we're changing the feel with 1.5 reps on the Leg Press and bringing in 2 less-familiar movements. Your muscle goal is why 2 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- state = bored (expression: new_exercises) → intended: refresh_the_experience → realized: 1.5 reps on Leg Press; Bulgarian Split Squat → Lateral Step-Up; Leg Extension → Reverse Nordic Curl
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: 1.5 reps on Leg Press (intermediate and up); intermediate pool: Barbell Back Squat, Roman Chair / GHD Glute-Ham Raise
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Compound + Paired Accessories shape (muscle goal weights it up); 2 accessory movements behind the main lift, 8 accessory sets in the 10–20 range; 1.5 reps on Leg Press
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 55.2 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: bored: attempt 0 expression 'new_exercises' realized ['set_method', 'exercises'] no-ops [] → satisfied

### Arms, 30, intermediate

Context: State(s): bored · level: intermediate · goal: Build muscle · 30 min · target: Arms · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-27`

**Arms** · variant **Efficient** · est. 25.5 min · 12 working sets
```
SUPERSET A (4 rounds, rest 120 s after each round)
  A1 High Cable Curl: 4 × 10–12  RIR 2
  A2 Dumbbell Skull Crusher: 4 × 10–12  RIR 2
Lu Raise: 4 × 15–20  RIR 1  rest 45 s
```
WHY THIS FITS TODAY: You're bored today, so we're bringing in 1 less-familiar movement. Your muscle goal keeps 1 accessory movement working at moderate reps.

REALIZED PERSONALIZATION:
- state = bored (expression: new_structure) → intended: refresh_the_experience → realized: Dumbbell Lateral Raise → Lu Raise
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Lu Raise
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 1 accessory movement, 4 accessory sets in the 10–20 range
- duration = 30 → intended: fill_the_requested_time_with_useful_work → realized: filled toward the requested time: rest_extended, set_added; 30-minute session: 3 exercises, 12 working sets, main work kept; estimated 25.5 min for a 30-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: bored: attempt 0 expression 'new_structure' realized ['exercises'] no-ops [] → satisfied

### Upper Pull, 60, advanced

Context: State(s): bored · level: advanced · goal: Build muscle · 60 min · target: Upper Pull · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-28`

**Upper Pull** · variant **Volume** · est. 56.0 min · 18 working sets · set methods: drop_set, one_and_half
```
Chest-Supported Machine Row: 4 × 6–8  RIR 2  rest 150 s
Pull-Up: 4 × 10–12  RIR 2  rest 120 s
Meadows Row: 4 × 10–12/side  RIR 2  rest 120 s
Dumbbell Pullover: 2 × 12–15 · drop set on the final set  RIR 1  (On the last set, hit the reps, drop the load about 25% and go again to the same reps-in-reserve. Stop each set with about 1 rep left in the tank.)  rest 60 s
Bayesian Cable Curl: 2 × 12–15/side · 1.5 reps  RIR 1  (Full rep, half rep from the stretched position, back to the top: that is one rep. Stop each set with about 1 rep left in the tank.)  rest 60 s
Barbell Curl: 2 × 12–15  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: You're bored today, so we're changing the feel with drop set on the final set on the Dumbbell Pullover and bringing in 4 less-familiar movements. Since you're an advanced lifter, we're keeping drop set on the final set on Dumbbell Pullover and 1.5 reps on Bayesian Cable Curl in the mix, and your muscle goal is why 3 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- state = bored (expression: new_exercises) → intended: refresh_the_experience → realized: drop set on the final set on Dumbbell Pullover; 1.5 reps on Bayesian Cable Curl; T-Bar Row → Meadows Row; Straight-Arm Pulldown → Dumbbell Pullover; EZ-Bar Curl → Bayesian Cable Curl; Spider Curl → Barbell Curl
- experience = advanced → intended: match_programming_vocabulary_to_level → realized: drop set on the final set on Dumbbell Pullover; 1.5 reps on Bayesian Cable Curl; higher-complexity movements kept in: Pull-Up, Meadows Row
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Volume shape (muscle goal weights it up); 3 accessory movements behind the main lift, 6 accessory sets in the 10–20 range; drop set on the final set on Dumbbell Pullover; 1.5 reps on Bayesian Cable Curl
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: trimmed to fit: accessory_rest_shortened, set_removed; estimated 56.0 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: bored: attempt 0 expression 'new_exercises' realized ['set_method', 'set_method', 'exercises'] no-ops [] → satisfied

### Upper Pull, 60, beginner (same seed)

Context: State(s): bored · level: beginner · goal: Build muscle · 60 min · target: Upper Pull · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-28`

**Upper Pull** · variant **Volume** · est. 53.9 min · 18 working sets
```
Chest-Supported Machine Row: 4 × 8–10  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 135 s
Lat Pulldown: 4 × 10–12  RIR 2  rest 120 s
Inverted Row: 4 × 10–12  RIR 2  rest 120 s
Dumbbell Pullover: 2 × 15–20  RIR 2  rest 60 s
Machine Preacher Curl: 2 × 15–20  RIR 2  rest 60 s
Bayesian Cable Curl: 2 × 15–20/side  RIR 2  rest 60 s
```
WHY THIS FITS TODAY: You're bored today, so we're bringing in 3 less-familiar movements. Since you're newer to lifting, the main work keeps at least two reps in reserve and the movements stay approachable, and your muscle goal is why 3 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- state = bored (expression: new_exercises) → intended: refresh_the_experience → realized: Assisted Pull-Up Machine → Inverted Row; EZ-Bar Preacher Curl → Machine Preacher Curl; Barbell Curl → Bayesian Cable Curl
- experience = beginner → intended: match_programming_vocabulary_to_level → realized: beginner bands: every lift keeps 2+ reps in reserve, no exercise above 4 sets; beginner-rated, low-complexity movements only; no advanced set methods
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Volume shape (muscle goal weights it up); 3 accessory movements behind the main lift, 6 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: trimmed to fit: accessory_rest_shortened, set_removed; estimated 53.9 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: bored: attempt 0 expression 'new_exercises' realized ['exercises'] no-ops [] → satisfied

## F. Stressed

### Upper Push, 60, intermediate

Context: State(s): stressed · level: intermediate · goal: Build muscle · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-14`

**Upper Push** · variant **Traditional** · est. 50.7 min · 20 working sets
```
Barbell Bench Press: 4 × 5–7  RIR 2  rest 165 s
Parallel Bar Dip: 4 × 8–10  RIR 2  rest 120 s
Plate-Loaded Incline Press: 4 × 8–10  RIR 2  rest 120 s
SUPERSET A (4 rounds, rest 60 s after each round)
  A1 Dumbbell Fly: 4 × 10–12  RIR 1
  A2 Machine Triceps Extension: 4 × 10–12  RIR 1
```
WHY THIS FITS TODAY: You're stressed today, so we're keeping the structure simple and predictable, setting up one thing fewer and sticking to familiar movements you can run on autopilot. Your muscle goal is why 2 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- state = stressed (expression: simpler) → intended: reduce_cognitive_load → realized: left out Overhead Cable Triceps Extension; Traditional instead of Compound + Paired Accessories; Smith Machine Incline Press → Plate-Loaded Incline Press; Cable Triceps Pressdown → Machine Triceps Extension
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Barbell Bench Press, Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 2 accessory movements behind the main lift, 8 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 50.7 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: stressed: attempt 0 expression 'simpler' realized ['slot_removed', 'structure', 'exercises'] no-ops [] → satisfied

Legacy V3 (Phase 2.6), same inputs: strength_upper_push · est. 40.0 min
```
  Dumbbell Bench Press: 4 × 8  RIR 2  rest 120 s
  Seated Dumbbell Shoulder Press: 3 × 10  RIR 2  rest 90 s
  Plate-Loaded Incline Press: 3 × 10  RIR 2  rest 90 s
  SUPERSET A (2 rounds, rest 60 s after each round)
    A1 Cable Fly: 2 × 12  RIR 1
    A2 Cable Triceps Pressdown: 2 × 12  RIR 1
  Dumbbell Skull Crusher: 2 × 12  RIR 1  rest 60 s
```

### Lower Body: Hinge, 60, intermediate

Context: State(s): stressed · level: intermediate · goal: Build muscle · 60 min · target: Lower Body: Hinge · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-28`

**Lower Body: Hinge** · variant **Traditional** · est. 56.6 min · 20 working sets
```
Dumbbell Romanian Deadlift: 4 × 5–7  RIR 2  rest 165 s
Cable Pull-Through: 4 × 8–10  RIR 2  (Controlled tempo: 3 s lowering, smooth drive, no bounce. Stop each set with about 2 reps left in the tank.)  rest 120 s
Reverse Lunge: 4 × 8–10/side  RIR 2  (Controlled tempo: 3 s lowering, smooth drive, no bounce. Stop each set with about 2 reps left in the tank.)  rest 120 s
Seated Leg Curl: 4 × 10–12  RIR 1  rest 60 s
Weighted Plank: 4 × 30–45 sec  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: You're stressed today, so we're keeping the structure simple and predictable, keeping the reps controlled and rhythmic and sticking to familiar movements you can run on autopilot. Your muscle goal is why 2 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- state = stressed (expression: controlled) → intended: reduce_cognitive_load → realized: controlled on Cable Pull-Through, Reverse Lunge; Traditional instead of Compound + Paired Accessories; Curtsy Lunge out (complexity / systemic cost); Standing Single-Leg Curl → Seated Leg Curl
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: nothing (no claim made)
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 2 accessory movements behind the main lift, 8 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 56.6 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: stressed: attempt 0 expression 'controlled' realized ['tempo', 'structure', 'complexity_or_systemic_cap', 'exercises'] no-ops ['state_rir_no_effect'] → satisfied

### Upper Pull, 30, intermediate

Context: State(s): stressed · level: intermediate · goal: Build muscle · 30 min · target: Upper Pull · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-29`

**Upper Pull** · variant **Traditional** · est. 25.6 min · 9 working sets
```
Barbell Row: 3 × 5–7  RIR 2  rest 150 s
Pull-Up: 3 × 8–10  RIR 2  (Controlled tempo: 3 s lowering, smooth drive, no bounce. Stop each set with about 2 reps left in the tank.)  rest 105 s
Cable Curl: 3 × 10–12  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: You're stressed today, so we're keeping the structure simple and predictable, keeping the reps controlled and rhythmic and sticking to familiar movements you can run on autopilot. Your muscle goal is why 1 accessory movement sits behind the main lifts.

REALIZED PERSONALIZATION:
- state = stressed (expression: controlled) → intended: reduce_cognitive_load → realized: controlled on Pull-Up; Traditional instead of Compound + Paired Accessories; Zottman Curl → Cable Curl
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Barbell Row, Pull-Up
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 1 accessory movement behind the main lift, 3 accessory sets in the 10–20 range
- duration = 30 → intended: fill_the_requested_time_with_useful_work → realized: 30-minute session: 3 exercises, 9 working sets, main work kept; estimated 25.6 min for a 30-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: stressed: attempt 0 expression 'controlled' realized ['tempo', 'structure', 'exercises'] no-ops ['state_rir_no_effect'] → satisfied

### Lower Body: Squat, 60, advanced, build strength

Context: State(s): stressed · level: advanced · goal: Build strength · 60 min · target: Lower Body: Squat · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-30`

**Lower Body: Squat** · variant **Efficient** · est. 46.2 min · 13 working sets · set methods: pause
```
Barbell Back Squat: 5 × 4–6 · paused reps  RIR 1  (Pause 2 s at the hardest point of every rep, then drive out of it. Stop each set with about 1 rep left in the tank.)  rest 240 s
Leg Press: 4 × 8–10  RIR 2  rest 150 s
Leg Extension: 4 × 10–12  RIR 1  rest 45 s
```
WHY THIS FITS TODAY: You're stressed today, so we're keeping the structure simple and predictable, setting up one thing fewer and sticking to familiar movements you can run on autopilot. Since you're an advanced lifter, we're keeping paused reps on Barbell Back Squat in the mix, and your strength goal keeps the main lift heavy with full rest.

REALIZED PERSONALIZATION:
- state = stressed (expression: simpler) → intended: reduce_cognitive_load → realized: left out Roman Chair / GHD Glute-Ham Raise; Efficient instead of Top Set + Back-off; Sissy Squat → Leg Extension
- experience = advanced → intended: match_programming_vocabulary_to_level → realized: paused reps on Barbell Back Squat; Barbell Back Squat runs to RIR 1 (advanced band position); higher-complexity movements kept in: Barbell Back Squat
- goal = build_strength → intended: primary_emphasis_heavier_longer_rest → realized: Barbell Back Squat at 4–6 with full 240 s rest; paused reps on Barbell Back Squat
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: filled toward the requested time: primary_set_added, rest_extended, set_added; estimated 46.2 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: stressed: attempt 0 expression 'simpler' realized ['slot_removed', 'structure', 'exercises'] no-ops [] → satisfied

## G. Sore

### MOOD's Pick with sore legs, 60, intermediate

Context: State(s): none · level: intermediate · goal: Build muscle · 60 min · target: MOOD's Pick · soreness: legs · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-30`

**Upper Pull** · variant **Volume** · est. 54.2 min · 19 working sets · set methods: rest_pause
```
Chest-Supported Machine Row: 4 × 6–8  RIR 2  rest 150 s
Lat Pulldown: 4 × 10–12  RIR 2  rest 120 s
Inverted Row: 4 × 10–12  RIR 2  rest 120 s
SUPERSET A (2 rounds, rest 60 s after each round)
  A1 Dumbbell Pullover: 2 × 12–15 · rest-pause on the final set  RIR 1  (On the last set, hit the reps, rest 15 s, then add as many clean reps as you can. Stop each set with about 1 rep left in the tank.)
  A2 EZ-Bar Curl: 2 × 12–15  RIR 1
Bayesian Cable Curl: 3 × 12–15/side  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: Your legs are sore, so today is an Upper Pull session that leaves them alone. As an intermediate lifter, rest-pause on the final set on Dumbbell Pullover is on the table, and your muscle goal is why 3 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- soreness = ['calves', 'glutes', 'hamstrings', 'quads'] → intended: protect_sore_region → realized: no movement loads the sore calves, glutes, hamstrings, quads directly; no accessory uses it as a secondary mover either
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: rest-pause on the final set on Dumbbell Pullover (intermediate and up)
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Volume shape (muscle goal weights it up); 3 accessory movements behind the main lift, 7 accessory sets in the 10–20 range; rest-pause on the final set on Dumbbell Pullover
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: trimmed to fit: accessory_rest_shortened, set_removed; estimated 54.2 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

### Upper Push with sore shoulders, 60, intermediate

Context: State(s): none · level: intermediate · goal: Build muscle · 60 min · target: Upper Push · soreness: shoulders · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-31`

CONFLICT (envelope with options): sore_target_conflict: Your sore areas block a credible session for this Target today.

### Target chest + triceps with sore shoulders, 60, intermediate

Context: State(s): none · level: intermediate · goal: Build muscle · 60 min · target: Custom Target: chest + triceps · soreness: shoulders · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-11-01`

**Custom Target** · variant **Compound + Paired Accessories** · est. 51.9 min · 20 working sets · set methods: drop_set
```
Dumbbell Bench Press: 4 × 8–10  RIR 2  rest 120 s
Smith Machine Incline Press: 4 × 8–10  RIR 2  rest 120 s
SUPERSET A (4 rounds, rest 60 s after each round)
  A1 Cable Fly: 4 × 12–15 · drop set on the final set  RIR 1  (On the last set, hit the reps, drop the load about 25% and go again to the same reps-in-reserve. Stop each set with about 1 rep left in the tank.)
  A2 Single-Arm Cable Triceps Extension: 4 × 12–15/side  RIR 1
Assisted Dip (Triceps Bias): 4 × 8–10  RIR 2  rest 120 s
```
WHY THIS FITS TODAY: Your shoulders are sore, so we kept your session and chose movements that keep that area out of the heavy lifting. As an intermediate lifter, drop set on the final set on Cable Fly is on the table, and your muscle goal keeps 2 accessory movements working at moderate reps. Both chest and triceps get direct work, in that order.

REALIZED PERSONALIZATION:
- soreness = ['front_delts', 'rear_delts', 'shoulders', 'side_delts'] → intended: protect_sore_region → realized: no movement loads the sore front_delts, rear_delts, shoulders, side_delts directly; 3 movements still use it as a secondary mover (Dumbbell Bench Press, Smith Machine Incline Press, Assisted Dip (Triceps Bias)); everything else avoids it
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: drop set on the final set on Cable Fly (intermediate and up)
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Compound + Paired Accessories shape (muscle goal weights it up); 2 accessory movements, 8 accessory sets in the 10–20 range; drop set on the final set on Cable Fly
- target = ['chest', 'triceps'] → intended: cover_every_target_muscle_directly → realized: chest: Dumbbell Bench Press, Smith Machine Incline Press, Cable Fly; triceps: Assisted Dip (Triceps Bias), Single-Arm Cable Triceps Extension
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 51.9 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

### Target back + biceps with sore lower back, 60, intermediate

Context: State(s): none · level: intermediate · goal: Build muscle · 60 min · target: Custom Target: back + biceps · soreness: lower_back · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-11-02`

**Upper Pull** · variant **Compound + Paired Accessories** · est. 54.5 min · 19 working sets
```
Chest-Supported Machine Row: 4 × 5–7  RIR 2  rest 180 s
Pull-Up: 4 × 8–10  RIR 2  rest 120 s
Single-Arm Cable Row: 4 × 8–10/side  RIR 2  rest 120 s
SUPERSET A (2 rounds, rest 60 s after each round)
  A1 Dumbbell Pullover: 2 × 12–15  RIR 1
  A2 EZ-Bar Curl: 2 × 12–15  RIR 1
Machine Preacher Curl: 3 × 12–15  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: Your lower back is sore, so we kept your session and chose movements that keep that area out of the heavy lifting. Your muscle goal is why 3 accessory movements sit behind the main lifts. Both back and biceps get direct work, in that order.

REALIZED PERSONALIZATION:
- soreness = ['spinal_erectors'] → intended: protect_sore_region → realized: no movement loads the sore spinal_erectors directly; no accessory uses it as a secondary mover either
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Pull-Up
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Compound + Paired Accessories shape (muscle goal weights it up); 3 accessory movements behind the main lift, 7 accessory sets in the 10–20 range
- target = ['back', 'biceps'] → intended: cover_every_target_muscle_directly → realized: back: Chest-Supported Machine Row, Pull-Up, Single-Arm Cable Row, Dumbbell Pullover; biceps: EZ-Bar Curl, Machine Preacher Curl
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: trimmed to fit: set_removed; estimated 54.5 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

### Amped with sore chest, Upper Push, 60

Context: State(s): amped · level: intermediate · goal: Build muscle · 60 min · target: Upper Push · soreness: chest · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-11-03`

CONFLICT (envelope with options): sore_target_conflict: Your sore areas block a credible session for this Target today.

## H. Multi-State

### Amped + Stressed, Upper Push, 60

Context: State(s): amped, stressed · level: intermediate · goal: Build muscle · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-10-14`

**Upper Push** · variant **Compound + Paired Accessories** · est. 55.9 min · 21 working sets
```
Barbell Bench Press: 5 × 5–7  RIR 2  rest 180 s
Parallel Bar Dip: 4 × 8–10  RIR 2  rest 120 s
Plate-Loaded Incline Press: 4 × 8–10  RIR 2  rest 120 s
SUPERSET A (4 rounds, rest 60 s after each round)
  A1 Dumbbell Fly: 4 × 12–15  RIR 1
  A2 Machine Triceps Extension: 4 × 12–15  RIR 1
```
WHY THIS FITS TODAY: You're amped but stressed, so we're adding a working set to Barbell Bench Press and setting up one thing fewer. Your muscle goal is why 2 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- state = amped (expression: extra_set_paired) → intended: use_readiness_productively → realized: Barbell Bench Press 4→5 sets
- state = stressed (expression: simpler) → intended: reduce_cognitive_load → realized: left out Overhead Cable Triceps Extension; Smith Machine Incline Press → Plate-Loaded Incline Press; Cable Triceps Pressdown → Machine Triceps Extension
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Barbell Bench Press, Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Compound + Paired Accessories shape (muscle goal weights it up); 2 accessory movements behind the main lift, 8 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 55.9 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: amped: attempt 0 expression 'extra_set_paired' realized ['volume'] no-ops [] → satisfied | stressed: attempt 0 expression 'simpler' realized ['slot_removed', 'exercises'] no-ops [] → satisfied

Legacy V3 (Phase 2.6), same inputs: strength_upper_push · est. 42.0 min
```
  Dumbbell Bench Press: 4 × 8  RIR 1  rest 120 s
  Seated Dumbbell Shoulder Press: 4 × 10  RIR 1  rest 90 s
  Plate-Loaded Incline Press: 3 × 10  RIR 1  rest 90 s
  SUPERSET A (2 rounds, rest 60 s after each round)
    A1 Cable Fly: 2 × 12  RIR 0
    A2 Cable Triceps Pressdown: 2 × 12  RIR 0
  Dumbbell Skull Crusher: 2 × 12  RIR 0  rest 60 s
```

### Low Energy + Amped, Lower Body: Squat, 60

Context: State(s): low_energy, amped · level: intermediate · goal: Build muscle · 60 min · target: Lower Body: Squat · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-11-01`

**Lower Body: Squat** · variant **Heavy Primary** · est. 51.1 min · 17 working sets
```
Barbell Back Squat: 5 × 4–6  RIR 1  rest 225 s
Leg Press: 4 × 8–10  RIR 2  rest 135 s
Leg Extension: 4 × 10–12  RIR 2  rest 60 s
Lying Leg Curl: 4 × 10–12  RIR 2  rest 60 s
```
WHY THIS FITS TODAY: You're amped but running on less energy than usual, so we're keeping you further from failure on Leg Extension and Lying Leg Curl, taking Barbell Back Squat a rep closer to failure and leaving out the higher-cost accessories. Your muscle goal is why 2 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- state = low_energy (expression: cost_down) → intended: reduce_training_cost → realized: Leg Extension RIR 1→2; Lying Leg Curl RIR 1→2; Sissy Squat out (complexity / systemic cost); Roman Chair / GHD Glute-Ham Raise out (complexity / systemic cost)
- state = amped (expression: top_set) → intended: use_readiness_productively → realized: Barbell Back Squat RIR 2→1
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Barbell Back Squat
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 2 accessory movements behind the main lift, 8 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: filled toward the requested time: set_added; estimated 51.1 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: low_energy: attempt 0 expression 'cost_down' realized ['rir', 'complexity_or_systemic_cap'] no-ops [] → satisfied | amped: attempt 0 expression 'extra_set_paired' realized [] no-ops [] → NOT satisfied | amped: fallback extra_set_paired → top_set | low_energy: attempt 1 expression 'cost_down' realized ['rir', 'complexity_or_systemic_cap'] no-ops [] → satisfied | amped: attempt 1 expression 'top_set' realized ['rir'] no-ops [] → satisfied

### Bored + Stressed, Upper Pull, 60

Context: State(s): bored, stressed · level: intermediate · goal: Build muscle · 60 min · target: Upper Pull · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-11-02`

**Upper Pull** · variant **Traditional** · est. 58.7 min · 21 working sets
```
Chest-Supported Machine Row: 4 × 5–7  RIR 2  rest 165 s
Pull-Up: 4 × 8–10  RIR 2  (Controlled tempo: 3 s lowering, smooth drive, no bounce. Stop each set with about 2 reps left in the tank.)  rest 120 s
Meadows Row: 4 × 8–10/side  RIR 2  (Controlled tempo: 3 s lowering, smooth drive, no bounce. Stop each set with about 2 reps left in the tank.)  rest 120 s
Dumbbell Pullover: 3 × 10–12  RIR 1  rest 60 s
Bayesian Cable Curl: 3 × 10–12/side  RIR 1  rest 60 s
Machine Preacher Curl: 3 × 10–12  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: You're bored and stressed, so we're bringing in 2 less-familiar movements and keeping the structure simple and predictable. Your muscle goal is why 3 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- state = bored (expression: new_exercises) → intended: refresh_the_experience → realized: Single-Arm Cable Row → Meadows Row; EZ-Bar Curl → Bayesian Cable Curl
- state = stressed (expression: controlled) → intended: reduce_cognitive_load → realized: controlled on Pull-Up, Meadows Row; Traditional instead of Compound + Paired Accessories; Single-Arm Cable Row → Meadows Row; EZ-Bar Curl → Bayesian Cable Curl
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Pull-Up, Meadows Row
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 3 accessory movements behind the main lift, 9 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: trimmed to fit: accessory_rest_shortened, set_removed; estimated 58.7 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: bored: attempt 0 expression 'fresh_finish' realized [] no-ops [] → NOT satisfied | stressed: attempt 0 expression 'controlled' realized ['tempo'] no-ops ['state_rir_no_effect'] → satisfied | bored: fallback fresh_finish → new_exercises | bored: attempt 1 expression 'new_exercises' realized ['exercises'] no-ops [] → satisfied | stressed: attempt 1 expression 'controlled' realized ['tempo', 'structure', 'exercises'] no-ops ['state_rir_no_effect'] → satisfied

### Irritated + Low Energy, Glutes + Legs, 30

Context: State(s): irritated, low_energy · level: intermediate · goal: Build muscle · 30 min · target: Glutes + Legs · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-11-03`

**Glutes + Legs** · variant **Efficient** · est. 27.6 min · 9 working sets
```
Barbell Hip Thrust: 3 × 5–7  RIR 3  (Move the bar with intent: controlled down, drive up as fast as it will go. Stop each set with about 3 reps left in the tank.)  rest 150 s
Trap-Bar Deadlift: 3 × 10–12  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 105 s
Machine Glute Kickback: 3 × 12–15/side  RIR 1  rest 45 s
```
WHY THIS FITS TODAY: You're irritated but low on energy, so we're loading the main lifts heavier, keeping you further from failure on Barbell Hip Thrust and Trap-Bar Deadlift and driving every rep of Barbell Hip Thrust with intent. Your muscle goal is why 1 accessory movement sits behind the main lifts.

REALIZED PERSONALIZATION:
- state = irritated (expression: heavy_primary) → intended: direct_physical_cathartic_work → realized: Barbell Hip Thrust 5–7→4–6; Barbell Hip Thrust rest 120→150 s; Trap-Bar Deadlift rest 90→105 s; explosive intent on Barbell Hip Thrust
- state = low_energy (expression: moderate_load) → intended: reduce_training_cost → realized: Barbell Hip Thrust 4–6→5–7; Barbell Hip Thrust RIR 2→3; Trap-Bar Deadlift RIR 2→3
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Trap-Bar Deadlift
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 1 accessory movement behind the main lift, 3 accessory sets in the 10–20 range
- duration = 30 → intended: fill_the_requested_time_with_useful_work → realized: 30-minute session: 3 exercises, 9 working sets, main work kept; estimated 27.6 min for a 30-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: irritated: attempt 0 expression 'direct_simple' realized [] no-ops ['state_reps_no_effect'] → NOT satisfied | low_energy: attempt 0 expression 'moderate_load' realized ['rir'] no-ops ['state_reps_no_effect'] → satisfied | irritated: fallback direct_simple → heavy_primary | irritated: attempt 1 expression 'heavy_primary' realized ['reps', 'rest', 'tempo'] no-ops [] → satisfied | low_energy: attempt 1 expression 'moderate_load' realized ['reps', 'rir'] no-ops [] → satisfied

### Bored + Low Energy, Upper Push, 60, advanced

Context: State(s): bored, low_energy · level: advanced · goal: Build muscle · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-11-04`

**Upper Push** · variant **Compound + Paired Accessories** · est. 58.5 min · 20 working sets · set methods: pause, slow_eccentric
```
Dumbbell Bench Press: 4 × 5–7 · paused reps  RIR 1  (Pause 2 s at the hardest point of every rep, then drive out of it. Stop each set with about 1 rep left in the tank.)  rest 180 s
Parallel Bar Dip: 4 × 8–10 · 3 s eccentric  RIR 2  (Take 3 s to lower every rep, then lift at normal speed. Stop each set with about 2 reps left in the tank.)  rest 120 s
Smith Machine Incline Press: 4 × 8–10  RIR 2  rest 120 s
Pec Deck: 4 × 12–15  RIR 2  rest 60 s
Cross-Body Cable Triceps Extension: 4 × 12–15/side  RIR 2  rest 60 s
```
WHY THIS FITS TODAY: You're bored and low on energy, so we're changing the feel with paused reps on the Dumbbell Bench Press and keeping you further from failure on Pec Deck and Cross-Body Cable Triceps Extension. Since you're an advanced lifter, we're keeping 3 s eccentric on Parallel Bar Dip in the mix, and your muscle goal is why 2 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- state = bored (expression: new_structure) → intended: refresh_the_experience → realized: paused reps on Dumbbell Bench Press
- state = low_energy (expression: simplify) → intended: reduce_training_cost → realized: left out EZ-Bar Skull Crusher; Pec Deck RIR 1→2; Cross-Body Cable Triceps Extension RIR 1→2; 3 s eccentric on Parallel Bar Dip
- experience = advanced → intended: match_programming_vocabulary_to_level → realized: paused reps on Dumbbell Bench Press; 3 s eccentric on Parallel Bar Dip; Dumbbell Bench Press runs to RIR 1 (advanced band position); higher-complexity movements kept in: Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Compound + Paired Accessories shape (muscle goal weights it up); 2 accessory movements behind the main lift, 8 accessory sets in the 10–20 range; 3 s eccentric on Parallel Bar Dip
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 58.5 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: bored: attempt 0 expression 'new_structure' realized ['set_method'] no-ops [] → satisfied | low_energy: attempt 0 expression 'simplify' realized ['slot_removed', 'rir', 'set_method'] no-ops [] → satisfied

## I. Custom Target

### Chest, 60, intermediate

Context: State(s): none · level: intermediate · goal: Build muscle · 60 min · target: Custom Target: chest · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-11-04`

**Custom Target** · variant **Traditional** · est. 50.6 min · 17 working sets
```
Incline Dumbbell Press: 5 × 5–7  RIR 2  rest 165 s
Push-Up: 4 × 8–12  RIR 2  rest 120 s
Parallel Bar Dip: 4 × 8–10  RIR 2  rest 120 s
Cable Fly: 4 × 10–12  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: Your muscle goal is why 1 accessory movement sits behind the main lifts.

REALIZED PERSONALIZATION:
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 1 accessory movement behind the main lift, 4 accessory sets in the 10–20 range
- target = ['chest'] → intended: cover_every_target_muscle_directly → realized: chest: Incline Dumbbell Press, Push-Up, Parallel Bar Dip, Cable Fly
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: filled toward the requested time: primary_set_added; estimated 50.6 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

Legacy V3 (Phase 2.6), same inputs: strength_custom_target · est. 40.0 min
```
  Dumbbell Bench Press: 3 × 10  RIR 2  rest 90 s
  Dumbbell Fly: 3 × 10  RIR 2  rest 90 s
  Pec Deck: 3 × 10  RIR 2  rest 90 s
  Cable Fly: 3 × 10  RIR 2  rest 90 s
  Smith Machine Incline Press: 3 × 10  RIR 2  rest 90 s
```

### Biceps, 60, intermediate, Bored

Context: State(s): bored · level: intermediate · goal: Build muscle · 60 min · target: Custom Target: biceps · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-11-05`

**Custom Target** · variant **Compound + Paired Accessories** · est. 43.3 min · 16 working sets · set methods: drop_set
```
Curl to Arnold Press: 4 × 8–10  RIR 2  rest 150 s
Bayesian Cable Curl: 4 × 12–15/side · drop set on the final set  RIR 1  (On the last set, hit the reps, drop the load about 25% and go again to the same reps-in-reserve. Stop each set with about 1 rep left in the tank.)  rest 60 s
Barbell Curl: 4 × 12–15  RIR 1  rest 60 s
EZ-Bar Preacher Curl: 4 × 12–15  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: You're bored today, so we're changing the feel with drop set on the final set on the Bayesian Cable Curl and bringing in 1 less-familiar movement. As an intermediate lifter, drop set on the final set on Bayesian Cable Curl is on the table, and your muscle goal keeps 3 accessory movements working at moderate reps.

REALIZED PERSONALIZATION:
- state = bored (expression: new_exercises) → intended: refresh_the_experience → realized: drop set on the final set on Bayesian Cable Curl; Bayesian Cable Curl (new vs no-State build)
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: drop set on the final set on Bayesian Cable Curl (intermediate and up); intermediate pool: Curl to Arnold Press
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Compound + Paired Accessories shape (muscle goal weights it up); 3 accessory movements, 12 accessory sets in the 10–20 range; drop set on the final set on Bayesian Cable Curl
- target = ['biceps'] → intended: cover_every_target_muscle_directly → realized: biceps: Curl to Arnold Press, Bayesian Cable Curl, Barbell Curl, EZ-Bar Preacher Curl
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: filled toward the requested time: rest_extended; estimated 43.3 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: bored: attempt 0 expression 'new_exercises' realized ['set_method', 'exercises'] no-ops [] → satisfied

### Back + Core, 30, intermediate

Context: State(s): none · level: intermediate · goal: Build muscle · 30 min · target: Custom Target: back + core · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-11-06`

**Custom Target** · variant **Compound + Paired Accessories** · est. 27.2 min · 12 working sets · set methods: slow_eccentric
```
Barbell Row: 4 × 8–10 · 3 s eccentric  RIR 2  (Take 3 s to lower every rep, then lift at normal speed. Stop each set with about 2 reps left in the tank.)  rest 120 s
LADDER Cable Pullover: 4 sets: 15/12/9/7  RIR 1  rest 30 s
Hanging Knee Raise: 4 × 12–15  RIR 1  rest 45 s
```
WHY THIS FITS TODAY: As an intermediate lifter, 3 s eccentric on Barbell Row is on the table, and your muscle goal keeps 2 accessory movements working at moderate reps. Both back and core get direct work, in that order.

REALIZED PERSONALIZATION:
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: 3 s eccentric on Barbell Row (intermediate and up); intermediate pool: Barbell Row
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Compound + Paired Accessories shape (muscle goal weights it up); 2 accessory movements, 8 accessory sets in the 10–20 range; 3 s eccentric on Barbell Row
- target = ['back', 'core'] → intended: cover_every_target_muscle_directly → realized: back: Barbell Row, Cable Pullover; core: Hanging Knee Raise
- duration = 30 → intended: fill_the_requested_time_with_useful_work → realized: filled toward the requested time: set_added; 30-minute session: 3 exercises, 12 working sets, main work kept; estimated 27.2 min for a 30-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

### Quads + Hamstrings, 60, advanced, build strength, Amped

Context: State(s): amped · level: advanced · goal: Build strength · 60 min · target: Custom Target: quads + hamstrings · soreness: none · equipment: commercial_gym · history: first session  ·  seed `wes / 2026-11-07`

**Custom Target** · variant **Compound + Paired Accessories** · est. 58.1 min · 22 working sets · set methods: slow_eccentric
```
Smith Machine Squat: 4 × 6–8 · 3 s eccentric  RIR 1  (Take 3 s to lower every rep, then lift at normal speed. Stop each set with about 1 rep left in the tank.)  rest 120 s
Walking Lunge: 4 × 6–8/side  RIR 1  rest 120 s
SUPERSET A (3 rounds, rest 60 s after each round)
  A1 Reverse Nordic Curl: 3 × 12–15  RIR 1
  A2 Standing Single-Leg Curl: 3 × 10–12/side  RIR 1
Barbell Good Morning: 4 × 6–8  RIR 1  rest 120 s
Conventional Deadlift: 4 × 6–8  RIR 1  rest 120 s
```
WHY THIS FITS TODAY: You're amped today, so we're taking Smith Machine Squat and Walking Lunge a rep closer to failure. Since you're an advanced lifter, we're keeping 3 s eccentric on Smith Machine Squat in the mix. Both quads and hamstrings get direct work, in that order.

REALIZED PERSONALIZATION:
- state = amped (expression: heavy_end) → intended: use_readiness_productively → realized: Smith Machine Squat RIR 2→1; Walking Lunge RIR 2→1; Barbell Good Morning RIR 2→1; Conventional Deadlift RIR 2→1
- experience = advanced → intended: match_programming_vocabulary_to_level → realized: 3 s eccentric on Smith Machine Squat; higher-complexity movements kept in: Barbell Good Morning, Conventional Deadlift
- goal = build_strength → intended: primary_emphasis_heavier_longer_rest → realized: nothing (no claim made)
- target = ['quads', 'hamstrings'] → intended: cover_every_target_muscle_directly → realized: quads: Smith Machine Squat, Walking Lunge, Reverse Nordic Curl; hamstrings: Barbell Good Morning, Conventional Deadlift, Standing Single-Leg Curl
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: trimmed to fit: finisher_dropped; estimated 58.1 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: amped: attempt 0 expression 'heavy_end' realized ['rir'] no-ops ['state_reps_no_effect'] → satisfied

## J. Sequential: same user, Upper Push, Amped every session (4 sessions)

### Session 1 (amped)

Context: State(s): amped · level: intermediate · goal: Build muscle · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: first session  ·  seed `seqA / 2026-11-10`

**Upper Push** · variant **Top Set + Back-off** · est. 59.5 min · 21 working sets
```
Barbell Bench Press: 4 sets: 4/7/7/7  RIR 1  (Top set heavy, then back off 10–15% for the remaining sets. Stop each set with about 1 rep left in the tank.)  rest 225 s
Parallel Bar Dip: 4 × 8–10  RIR 2  rest 135 s
Smith Machine Incline Press: 4 × 8–10  RIR 2  rest 135 s
Dumbbell Fly: 3 × 10–12  RIR 1  rest 45 s
Cross-Body Cable Triceps Extension: 3 × 10–12/side  RIR 1  rest 45 s
Machine Triceps Extension: 3 × 10–12  RIR 1  rest 45 s
```
WHY THIS FITS TODAY: You're amped today, so we're putting that readiness into a heavy top set and back-off sets and taking Barbell Bench Press a rep closer to failure. Your muscle goal is why 3 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- state = amped (expression: top_set) → intended: use_readiness_productively → realized: Barbell Bench Press RIR 2→1; Top Set + Back-off instead of Compound + Paired Accessories
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: Top Set + Back-off (intermediate and up); intermediate pool: Barbell Bench Press, Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 3 accessory movements behind the main lift, 9 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: trimmed to fit: accessory_rest_shortened; estimated 59.5 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: amped: attempt 0 expression 'top_set' realized ['rir', 'structure'] no-ops [] → satisfied

### Session 2 (amped)

Context: State(s): amped · level: intermediate · goal: Build muscle · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: 1 completed session(s); last: strength_upper_push / Top Set + Back-off  ·  seed `seqA / 2026-11-12`

**Upper Push** · variant **Compound + Paired Accessories** · est. 56.4 min · 20 working sets
```
Barbell Bench Press: 5 × 5–7  RIR 2  rest 180 s
Parallel Bar Dip: 4 × 8–10  RIR 2  rest 120 s
Plate-Loaded Incline Press: 4 × 8–10  RIR 2  rest 120 s
SUPERSET A (2 rounds, rest 60 s after each round)
  A1 Cable Fly: 2 × 12–15  RIR 1
  A2 Dumbbell Overhead Triceps Extension: 2 × 12–15  RIR 1
Diamond Push-Up: 3 × 12–15  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: You're amped today, so we're adding a working set to Barbell Bench Press. Your muscle goal is why 3 accessory movements sit behind the main lifts. Barbell Bench Press and Parallel Bar Dip stay so your progression carries over, the session runs a different shape from last time and 4 movements are new versus your last one.

REALIZED PERSONALIZATION:
- state = amped (expression: extra_set_paired) → intended: use_readiness_productively → realized: Barbell Bench Press 4→5 sets
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Barbell Bench Press, Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Compound + Paired Accessories shape (muscle goal weights it up); 3 accessory movements behind the main lift, 7 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: trimmed to fit: set_removed; estimated 56.4 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = 1 completed Strength sessions → intended: rotate_shape_and_movements_keep_the_main_lift → realized: different shape from your last Upper Push (Top Set + Back-off then, Compound + Paired Accessories now); main lift continuity for progression: Barbell Bench Press, Parallel Bar Dip; 4 movements not in your last Upper Push session; amped: expressed differently from last time (top_set then, extra_set_paired now)

State gate: amped: attempt 0 expression 'extra_set_paired' realized ['volume'] no-ops [] → satisfied

### Session 3 (amped)

Context: State(s): amped · level: intermediate · goal: Build muscle · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: 2 completed session(s); last: strength_upper_push / Compound + Paired Accessories  ·  seed `seqA / 2026-11-14`

**Upper Push** · variant **Heavy Primary** · est. 58.7 min · 19 working sets
```
Barbell Bench Press: 5 × 4–6  RIR 1  rest 225 s
Parallel Bar Dip: 4 × 8–10  RIR 2  rest 135 s
Smith Machine Incline Press: 4 × 8–10  RIR 2  rest 135 s
Pec Deck: 3 × 10–12  RIR 1  rest 60 s
Cable Triceps Pressdown: 3 × 10–12  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: You're amped today, so we're taking Barbell Bench Press a rep closer to failure. Your muscle goal is why 2 accessory movements sit behind the main lifts. Barbell Bench Press and Parallel Bar Dip stay so your progression carries over, the session runs a different shape from last time and 3 movements are new versus your last one.

REALIZED PERSONALIZATION:
- state = amped (expression: top_set) → intended: use_readiness_productively → realized: Barbell Bench Press RIR 2→1
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Barbell Bench Press, Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 2 accessory movements behind the main lift, 6 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 58.7 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = 2 completed Strength sessions → intended: rotate_shape_and_movements_keep_the_main_lift → realized: different shape from your last Upper Push (Compound + Paired Accessories then, Heavy Primary now); main lift continuity for progression: Barbell Bench Press, Parallel Bar Dip; 3 movements not in your last Upper Push session; amped: expressed differently from last time (extra_set_paired then, top_set now)

State gate: amped: attempt 0 expression 'extra_set_paired' realized [] no-ops ['state_volume_no_effect'] → NOT satisfied | amped: fallback extra_set_paired → top_set | amped: attempt 1 expression 'top_set' realized ['rir'] no-ops [] → satisfied

### Session 4 (amped)

Context: State(s): amped · level: intermediate · goal: Build muscle · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: 3 completed session(s); last: strength_upper_push / Heavy Primary  ·  seed `seqA / 2026-11-16`

**Upper Push** · variant **Compound + Paired Accessories** · est. 54.5 min · 19 working sets · set methods: drop_set
```
Barbell Bench Press: 4 × 4–6  RIR 2  rest 180 s
Parallel Bar Dip: 4 × 8–10  RIR 1  rest 120 s
Plate-Loaded Incline Press: 4 × 8–10 · drop set on the final set  RIR 1  (On the last set, hit the reps, drop the load about 25% and go again to the same reps-in-reserve. Stop each set with about 1 rep left in the tank.)  rest 120 s
SUPERSET A (2 rounds, rest 60 s after each round)
  A1 Dumbbell Fly: 2 × 12–15  RIR 1
  A2 EZ-Bar Skull Crusher: 2 × 12–15  RIR 1
Cable Triceps Kickback: 3 × 12–15/side  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: You're amped today, so we're taking Parallel Bar Dip and Plate-Loaded Incline Press a rep closer to failure, pushing the main lifts to the heavy end of their range and using drop set on the final set on Plate-Loaded Incline Press. As an intermediate lifter, drop set on the final set on Plate-Loaded Incline Press is on the table, and your muscle goal is why 3 accessory movements sit behind the main lifts. Barbell Bench Press and Parallel Bar Dip stay so your progression carries over, the session runs a different shape from last time and 4 movements are new versus your last one.

REALIZED PERSONALIZATION:
- state = amped (expression: heavy_end) → intended: use_readiness_productively → realized: Barbell Bench Press 5–7→4–6; Parallel Bar Dip RIR 2→1; Plate-Loaded Incline Press RIR 2→1; drop set on the final set on Plate-Loaded Incline Press
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: drop set on the final set on Plate-Loaded Incline Press (intermediate and up); intermediate pool: Barbell Bench Press, Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Compound + Paired Accessories shape (muscle goal weights it up); 3 accessory movements behind the main lift, 7 accessory sets in the 10–20 range; drop set on the final set on Plate-Loaded Incline Press
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: trimmed to fit: finisher_dropped, set_removed; estimated 54.5 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = 3 completed Strength sessions → intended: rotate_shape_and_movements_keep_the_main_lift → realized: different shape from your last Upper Push (Heavy Primary then, Compound + Paired Accessories now); main lift continuity for progression: Barbell Bench Press, Parallel Bar Dip; 4 movements not in your last Upper Push session; amped: expressed differently from last time (top_set then, heavy_end now)

State gate: amped: attempt 0 expression 'heavy_end' realized ['reps', 'rir', 'set_method'] no-ops [] → satisfied

## K. Sequential: same user, MOOD's Pick, no State (5 sessions)

### Session 1 (no State)

Context: State(s): none · level: intermediate · goal: Build muscle · 60 min · target: MOOD's Pick · soreness: none · equipment: commercial_gym · history: first session  ·  seed `seqB / 2026-11-10`

**Upper Pull** · variant **Volume** · est. 54.2 min · 19 working sets · set methods: drop_set
```
Chest-Supported Machine Row: 4 × 6–8  RIR 2  rest 150 s
Pull-Up: 4 × 10–12  RIR 2  rest 120 s
Bent-Over Dumbbell Row (Two-Arm): 4 × 10–12  RIR 2  rest 120 s
SUPERSET A (2 rounds, rest 60 s after each round)
  A1 Straight-Arm Pulldown: 2 × 12–15 · drop set on the final set  RIR 1  (On the last set, hit the reps, drop the load about 25% and go again to the same reps-in-reserve. Stop each set with about 1 rep left in the tank.)
  A2 EZ-Bar Preacher Curl: 2 × 12–15  RIR 1
Bayesian Cable Curl: 3 × 12–15/side  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: As an intermediate lifter, drop set on the final set on Straight-Arm Pulldown is on the table, and your muscle goal is why 3 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: drop set on the final set on Straight-Arm Pulldown (intermediate and up); intermediate pool: Pull-Up
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Volume shape (muscle goal weights it up); 3 accessory movements behind the main lift, 7 accessory sets in the 10–20 range; drop set on the final set on Straight-Arm Pulldown
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: trimmed to fit: accessory_rest_shortened, set_removed; estimated 54.2 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

### Session 2 (no State)

Context: State(s): none · level: intermediate · goal: Build muscle · 60 min · target: MOOD's Pick · soreness: none · equipment: commercial_gym · history: 1 completed session(s); last: strength_upper_pull / Volume  ·  seed `seqB / 2026-11-12`

**Lower Body: Squat** · variant **Traditional** · est. 56.1 min · 20 working sets · set methods: slow_eccentric
```
Barbell Back Squat: 4 × 5–7  RIR 2  rest 165 s
Leg Press: 4 × 8–10 · 3 s eccentric  RIR 2  (Take 3 s to lower every rep, then lift at normal speed. Stop each set with about 2 reps left in the tank.)  rest 120 s
Dumbbell Step-Up: 4 × 8–10/side  RIR 2  rest 120 s
Leg Extension: 4 × 10–12  RIR 1  rest 60 s
Roman Chair / GHD Glute-Ham Raise: 4 × 10–12  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: As an intermediate lifter, 3 s eccentric on Leg Press is on the table, and your muscle goal is why 2 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: 3 s eccentric on Leg Press (intermediate and up); intermediate pool: Barbell Back Squat, Roman Chair / GHD Glute-Ham Raise
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 2 accessory movements behind the main lift, 8 accessory sets in the 10–20 range; 3 s eccentric on Leg Press
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 56.1 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = 1 completed Strength sessions → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

### Session 3 (no State)

Context: State(s): none · level: intermediate · goal: Build muscle · 60 min · target: MOOD's Pick · soreness: none · equipment: commercial_gym · history: 2 completed session(s); last: strength_lower_squat / Traditional  ·  seed `seqB / 2026-11-14`

**Upper Push** · variant **Compound + Paired Accessories** · est. 59.3 min · 24 working sets
```
Incline Dumbbell Press: 4 × 5–7  RIR 2  rest 180 s
Parallel Bar Dip: 4 × 8–10  RIR 2  rest 120 s
Standing Cable Chest Press: 4 × 8–10  RIR 2  rest 120 s
SUPERSET A (4 rounds, rest 60 s after each round)
  A1 Pec Deck: 4 × 12–15  RIR 1
  A2 Machine Triceps Extension: 4 × 12–15  RIR 1
EZ-Bar Skull Crusher: 4 × 12–15  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: Your muscle goal is why 3 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Compound + Paired Accessories shape (muscle goal weights it up); 3 accessory movements behind the main lift, 12 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 59.3 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = 2 completed Strength sessions → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

### Session 4 (no State)

Context: State(s): none · level: intermediate · goal: Build muscle · 60 min · target: MOOD's Pick · soreness: none · equipment: commercial_gym · history: 3 completed session(s); last: strength_upper_push / Compound + Paired Accessories  ·  seed `seqB / 2026-11-16`

**Glutes + Legs** · variant **Traditional** · est. 57.8 min · 20 working sets · set methods: rest_pause
```
Barbell Hip Thrust: 4 × 5–7  RIR 2  rest 165 s
Trap-Bar Deadlift: 4 × 8–10  RIR 2  rest 120 s
Reverse Lunge: 4 × 8–10/side  RIR 2  rest 120 s
Cable Glute Kickback: 4 × 10–12/side · rest-pause on the final set  RIR 1  (On the last set, hit the reps, rest 15 s, then add as many clean reps as you can. Stop each set with about 1 rep left in the tank.)  rest 60 s
Leg Extension: 4 × 10–12  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: As an intermediate lifter, rest-pause on the final set on Cable Glute Kickback is on the table, and your muscle goal is why 2 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: rest-pause on the final set on Cable Glute Kickback (intermediate and up); intermediate pool: Trap-Bar Deadlift
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 2 accessory movements behind the main lift, 8 accessory sets in the 10–20 range; rest-pause on the final set on Cable Glute Kickback
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: trimmed to fit: finisher_dropped; estimated 57.8 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = 3 completed Strength sessions → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

### Session 5 (no State)

Context: State(s): none · level: intermediate · goal: Build muscle · 60 min · target: MOOD's Pick · soreness: none · equipment: commercial_gym · history: 4 completed session(s); last: strength_glutes_legs / Traditional  ·  seed `seqB / 2026-11-18`

**Upper Body** · variant **Volume** · est. 53.0 min · 19 working sets
```
Incline Dumbbell Press: 5 × 6–8  RIR 2  rest 150 s
Barbell Overhead Press: 4 × 10–12  RIR 2  rest 120 s
Lat Pulldown: 4 × 10–12  RIR 2  rest 120 s
SUPERSET A (3 rounds, rest 60 s after each round)
  A1 Machine Lateral Raise: 3 × 15–20  RIR 1
  A2 Dumbbell Pullover: 3 × 12–15  RIR 1
```
WHY THIS FITS TODAY: Your muscle goal is why 2 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Barbell Overhead Press
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Volume shape (muscle goal weights it up); 2 accessory movements behind the main lift, 6 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: filled toward the requested time: primary_set_added, set_added; estimated 53.0 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = 4 completed Strength sessions → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

## L. Sequential: same user, Lower Body: Squat, Bored every session, advanced (4 sessions)

### Session 1 (bored)

Context: State(s): bored · level: advanced · goal: Build muscle · 60 min · target: Lower Body: Squat · soreness: none · equipment: commercial_gym · history: first session  ·  seed `seqC / 2026-11-10`

**Lower Body: Squat** · variant **Compound + Paired Accessories** · est. 54.5 min · 20 working sets
```
Barbell Back Squat: 4 × 5–7  RIR 1  rest 180 s
Leg Press: 4 × 8–10  RIR 2  rest 120 s
Curtsy Lunge: 4 × 8–10/side  RIR 2  rest 120 s
SUPERSET A (4 rounds, rest 60 s after each round)
  A1 Sissy Squat: 4 × 12–15  RIR 1
  A2 Roman Chair / GHD Glute-Ham Raise: 4 × 12–15  RIR 1
```
WHY THIS FITS TODAY: You're bored today, so we're bringing in 1 less-familiar movement and changing the shape of the session to Compound + Paired Accessories. Since you're an advanced lifter, Barbell Back Squat runs to a rep from failure, and your muscle goal is why 2 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- state = bored (expression: new_exercises) → intended: refresh_the_experience → realized: Compound + Paired Accessories instead of Traditional; Bulgarian Split Squat → Curtsy Lunge
- experience = advanced → intended: match_programming_vocabulary_to_level → realized: Barbell Back Squat runs to RIR 1 (advanced band position); higher-complexity movements kept in: Barbell Back Squat, Curtsy Lunge, Sissy Squat, Roman Chair / GHD Glute-Ham Raise
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Compound + Paired Accessories shape (muscle goal weights it up); 2 accessory movements behind the main lift, 8 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 54.5 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

State gate: bored: attempt 0 expression 'new_exercises' realized ['structure', 'exercises'] no-ops [] → satisfied

### Session 2 (bored)

Context: State(s): bored · level: advanced · goal: Build muscle · 60 min · target: Lower Body: Squat · soreness: none · equipment: commercial_gym · history: 1 completed session(s); last: strength_lower_squat / Compound + Paired Accessories  ·  seed `seqC / 2026-11-12`

**Lower Body: Squat** · variant **Heavy Primary** · est. 52.6 min · 17 working sets · set methods: one_and_half, rest_pause
```
Barbell Back Squat: 5 × 4–6  RIR 1  rest 225 s
Leg Press: 4 × 8–10 · 1.5 reps  RIR 2  (Full rep, half rep from the stretched position, back to the top: that is one rep. Stop each set with about 2 reps left in the tank.)  rest 135 s
Reverse Nordic Curl: 4 × 12–15  RIR 1  rest 60 s
Roman Chair / GHD Glute-Ham Raise: 4 × 10–12 · rest-pause on the final set  RIR 1  (On the last set, hit the reps, rest 15 s, then add as many clean reps as you can. Stop each set with about 1 rep left in the tank.)  rest 60 s
```
WHY THIS FITS TODAY: You're bored today, so we're changing the feel with 1.5 reps on the Leg Press and bringing in 1 less-familiar movement. Since you're an advanced lifter, we're keeping rest-pause on the final set on Roman Chair / GHD Glute-Ham Raise in the mix, and your muscle goal is why 2 accessory movements sit behind the main lifts. Barbell Back Squat and Leg Press stay so your progression carries over, the session runs a different shape from last time and 1 movement is new versus your last one.

REALIZED PERSONALIZATION:
- state = bored (expression: new_structure) → intended: refresh_the_experience → realized: 1.5 reps on Leg Press; rest-pause on the final set on Roman Chair / GHD Glute-Ham Raise; Leg Extension → Reverse Nordic Curl
- experience = advanced → intended: match_programming_vocabulary_to_level → realized: 1.5 reps on Leg Press; rest-pause on the final set on Roman Chair / GHD Glute-Ham Raise; Barbell Back Squat runs to RIR 1 (advanced band position); higher-complexity movements kept in: Barbell Back Squat, Roman Chair / GHD Glute-Ham Raise; Heavy Primary shape
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 2 accessory movements behind the main lift, 8 accessory sets in the 10–20 range; 1.5 reps on Leg Press; rest-pause on the final set on Roman Chair / GHD Glute-Ham Raise
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: filled toward the requested time: set_added; estimated 52.6 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = 1 completed Strength sessions → intended: rotate_shape_and_movements_keep_the_main_lift → realized: different shape from your last Lower Body: Squat (Compound + Paired Accessories then, Heavy Primary now); main lift continuity for progression: Barbell Back Squat, Leg Press; 1 movement not in your last Lower Body: Squat session; bored: expressed differently from last time (new_exercises then, new_structure now)

State gate: bored: attempt 0 expression 'new_structure' realized ['set_method', 'set_method', 'exercises'] no-ops [] → satisfied

### Session 3 (bored)

Context: State(s): bored · level: advanced · goal: Build muscle · 60 min · target: Lower Body: Squat · soreness: none · equipment: commercial_gym · history: 2 completed session(s); last: strength_lower_squat / Heavy Primary  ·  seed `seqC / 2026-11-14`

**Lower Body: Squat** · variant **Volume** · est. 58.6 min · 22 working sets · set methods: drop_set, slow_eccentric
```
Barbell Back Squat: 4 × 5–7  RIR 2  rest 150 s
Leg Press: 4 × 10–12 · drop set on the final set  RIR 2  (On the last set, hit the reps, drop the load about 25% and go again to the same reps-in-reserve. Stop each set with about 2 reps left in the tank.)  rest 120 s
Front-Foot Elevated Split Squat: 4 × 10–12/side · 3 s eccentric  RIR 2  (Take 3 s to lower every rep, then lift at normal speed. Stop each set with about 2 reps left in the tank.)  rest 120 s
SUPERSET A (4 rounds, rest 60 s after each round)
  A1 Sissy Squat: 4 × 12–15  RIR 1
  A2 Roman Chair / GHD Glute-Ham Raise: 4 × 12–15  RIR 1
Frog Pump: 2 × 12–15  RIR 1  rest 45 s
```
WHY THIS FITS TODAY: You're bored today, so we're changing the feel with drop set on the final set on the Leg Press, bringing in 2 less-familiar movements and changing the shape of the session to Volume. Since you're an advanced lifter, we're keeping drop set on the final set on Leg Press and 3 s eccentric on Front-Foot Elevated Split Squat in the mix, and your muscle goal is why 3 accessory movements sit behind the main lifts. Barbell Back Squat and Leg Press stay so your progression carries over, the session runs a different shape from last time and 3 movements are new versus your last one.

REALIZED PERSONALIZATION:
- state = bored (expression: new_exercises) → intended: refresh_the_experience → realized: drop set on the final set on Leg Press; Volume instead of Traditional; Bulgarian Split Squat → Front-Foot Elevated Split Squat; Leg Extension → Sissy Squat
- experience = advanced → intended: match_programming_vocabulary_to_level → realized: drop set on the final set on Leg Press; 3 s eccentric on Front-Foot Elevated Split Squat; higher-complexity movements kept in: Barbell Back Squat, Sissy Squat, Roman Chair / GHD Glute-Ham Raise
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Volume shape (muscle goal weights it up); 3 accessory movements behind the main lift, 10 accessory sets in the 10–20 range; drop set on the final set on Leg Press; 3 s eccentric on Front-Foot Elevated Split Squat
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 58.6 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = 2 completed Strength sessions → intended: rotate_shape_and_movements_keep_the_main_lift → realized: different shape from your last Lower Body: Squat (Heavy Primary then, Volume now); main lift continuity for progression: Barbell Back Squat, Leg Press; 3 movements not in your last Lower Body: Squat session; bored: expressed differently from last time (new_structure then, new_exercises now)

State gate: bored: attempt 0 expression 'new_exercises' realized ['set_method', 'structure', 'exercises'] no-ops [] → satisfied

### Session 4 (bored)

Context: State(s): bored · level: advanced · goal: Build muscle · 60 min · target: Lower Body: Squat · soreness: none · equipment: commercial_gym · history: 3 completed session(s); last: strength_lower_squat / Volume  ·  seed `seqC / 2026-11-16`

**Lower Body: Squat** · variant **Compound + Paired Accessories** · est. 58.4 min · 20 working sets · set methods: drop_set, slow_eccentric
```
Barbell Back Squat: 4 × 5–7  RIR 1  rest 180 s
Leg Press: 4 × 8–10 · drop set on the final set  RIR 2  (On the last set, hit the reps, drop the load about 25% and go again to the same reps-in-reserve. Stop each set with about 2 reps left in the tank.)  rest 120 s
Curtsy Lunge: 4 × 8–10/side · 3 s eccentric  RIR 2  (Take 3 s to lower every rep, then lift at normal speed. Stop each set with about 2 reps left in the tank.)  rest 120 s
Leg Extension: 4 × 12–15  RIR 1  rest 60 s
Roman Chair / GHD Glute-Ham Raise: 4 × 12–15  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: You're bored today, so we're changing the feel with drop set on the final set on the Leg Press, bringing in 1 less-familiar movement and changing the shape of the session to Compound + Paired Accessories. Since you're an advanced lifter, we're keeping drop set on the final set on Leg Press and 3 s eccentric on Curtsy Lunge in the mix, and your muscle goal is why 2 accessory movements sit behind the main lifts. Barbell Back Squat and Leg Press stay so your progression carries over, the session runs a different shape from last time and 2 movements are new versus your last one.

REALIZED PERSONALIZATION:
- state = bored (expression: fresh_finish) → intended: refresh_the_experience → realized: drop set on the final set on Leg Press; Compound + Paired Accessories instead of Traditional; Lateral Step-Up → Curtsy Lunge
- experience = advanced → intended: match_programming_vocabulary_to_level → realized: drop set on the final set on Leg Press; 3 s eccentric on Curtsy Lunge; Barbell Back Squat runs to RIR 1 (advanced band position); higher-complexity movements kept in: Barbell Back Squat, Curtsy Lunge, Roman Chair / GHD Glute-Ham Raise
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Compound + Paired Accessories shape (muscle goal weights it up); 2 accessory movements behind the main lift, 8 accessory sets in the 10–20 range; drop set on the final set on Leg Press; 3 s eccentric on Curtsy Lunge
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 58.4 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = 3 completed Strength sessions → intended: rotate_shape_and_movements_keep_the_main_lift → realized: different shape from your last Lower Body: Squat (Volume then, Compound + Paired Accessories now); main lift continuity for progression: Barbell Back Squat, Leg Press; 2 movements not in your last Lower Body: Squat session; bored: expressed differently from last time (new_exercises then, fresh_finish now)

State gate: bored: attempt 0 expression 'fresh_finish' realized ['set_method', 'structure', 'exercises'] no-ops [] → satisfied

## M. Sequential: same user, mixed States, Upper Push (6 sessions)

### Session 1 (no State)

Context: State(s): none · level: intermediate · goal: Build muscle · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: first session  ·  seed `seqD / 2026-11-10`

**Upper Push** · variant **Heavy Primary** · est. 58.7 min · 19 working sets
```
Barbell Bench Press: 5 × 4–6  RIR 2  rest 225 s
Parallel Bar Dip: 4 × 8–10  RIR 2  rest 135 s
Plate-Loaded Incline Press: 4 × 8–10  RIR 2  rest 135 s
Cable Fly: 3 × 10–12  RIR 1  rest 60 s
Dumbbell Skull Crusher: 3 × 10–12  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: Your muscle goal is why 2 accessory movements sit behind the main lifts.

REALIZED PERSONALIZATION:
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Barbell Bench Press, Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 2 accessory movements behind the main lift, 6 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 58.7 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: rotate_shape_and_movements_keep_the_main_lift → realized: nothing (no claim made)

### Session 2 (stressed)

Context: State(s): stressed · level: intermediate · goal: Build muscle · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: 1 completed session(s); last: strength_upper_push / Heavy Primary  ·  seed `seqD / 2026-11-12`

**Upper Push** · variant **Compound + Paired Accessories** · est. 52.4 min · 20 working sets
```
Barbell Bench Press: 4 × 5–7  RIR 2  rest 180 s
Parallel Bar Dip: 4 × 8–10  RIR 2  rest 120 s
Smith Machine Incline Press: 4 × 8–10  RIR 2  rest 120 s
SUPERSET A (4 rounds, rest 60 s after each round)
  A1 Pec Deck: 4 × 12–15  RIR 1
  A2 Dumbbell Overhead Triceps Extension: 4 × 12–15  RIR 1
```
WHY THIS FITS TODAY: You're stressed today, so we're setting up one thing fewer and sticking to familiar movements you can run on autopilot. Your muscle goal is why 2 accessory movements sit behind the main lifts. Barbell Bench Press and Parallel Bar Dip stay so your progression carries over, the session runs a different shape from last time and 3 movements are new versus your last one.

REALIZED PERSONALIZATION:
- state = stressed (expression: simpler) → intended: reduce_cognitive_load → realized: left out Machine Triceps Extension; Low-to-High Cable Fly → Pec Deck
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Barbell Bench Press, Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Compound + Paired Accessories shape (muscle goal weights it up); 2 accessory movements behind the main lift, 8 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 52.4 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = 1 completed Strength sessions → intended: rotate_shape_and_movements_keep_the_main_lift → realized: different shape from your last Upper Push (Heavy Primary then, Compound + Paired Accessories now); main lift continuity for progression: Barbell Bench Press, Parallel Bar Dip; 3 movements not in your last Upper Push session

State gate: stressed: attempt 0 expression 'simpler' realized ['slot_removed', 'exercises'] no-ops [] → satisfied

### Session 3 (amped)

Context: State(s): amped · level: intermediate · goal: Build muscle · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: 2 completed session(s); last: strength_upper_push / Compound + Paired Accessories  ·  seed `seqD / 2026-11-14`

**Upper Push** · variant **Volume** · est. 57.0 min · 20 working sets · set methods: pause
```
Barbell Bench Press: 5 × 5–7 · paused reps  RIR 2  (Pause 2 s at the hardest point of every rep, then drive out of it. Stop each set with about 2 reps left in the tank.)  rest 150 s
Parallel Bar Dip: 4 × 10–12  RIR 2  rest 120 s
Plate-Loaded Incline Press: 4 × 10–12  RIR 2  rest 120 s
SUPERSET A (2 rounds, rest 60 s after each round)
  A1 Dumbbell Fly: 2 × 12–15  RIR 1
  A2 Machine Triceps Extension: 2 × 12–15  RIR 1
Cross-Body Cable Triceps Extension: 3 × 12–15/side  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: You're amped today, so we're adding a working set to Barbell Bench Press. As an intermediate lifter, paused reps on Barbell Bench Press is on the table, and your muscle goal is why 3 accessory movements sit behind the main lifts. Barbell Bench Press and Parallel Bar Dip stay so your progression carries over, the session runs a different shape from last time and 4 movements are new versus your last one.

REALIZED PERSONALIZATION:
- state = amped (expression: extra_set_paired) → intended: use_readiness_productively → realized: Barbell Bench Press 4→5 sets
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: paused reps on Barbell Bench Press (intermediate and up); intermediate pool: Barbell Bench Press, Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: Volume shape (muscle goal weights it up); 3 accessory movements behind the main lift, 7 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: trimmed to fit: accessory_rest_shortened, set_removed; estimated 57.0 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = 2 completed Strength sessions → intended: rotate_shape_and_movements_keep_the_main_lift → realized: different shape from your last Upper Push (Compound + Paired Accessories then, Volume now); main lift continuity for progression: Barbell Bench Press, Parallel Bar Dip; 4 movements not in your last Upper Push session

State gate: amped: attempt 0 expression 'extra_set_paired' realized ['volume'] no-ops [] → satisfied

### Session 4 (low_energy)

Context: State(s): low_energy · level: intermediate · goal: Build muscle · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: 3 completed session(s); last: strength_upper_push / Volume  ·  seed `seqD / 2026-11-16`

**Upper Push** · variant **Traditional** · est. 57.6 min · 23 working sets · set methods: slow_eccentric
```
Barbell Bench Press: 4 × 5–7  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 165 s
Parallel Bar Dip: 4 × 8–10 · 3 s eccentric  RIR 3  (Take 3 s to lower every rep, then lift at normal speed. Stop each set with about 3 reps left in the tank.)  rest 120 s
Smith Machine Incline Press: 4 × 8–10  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 120 s
SUPERSET A (4 rounds, rest 60 s after each round)
  A1 Cable Fly: 4 × 10–12  RIR 2
  A2 Dumbbell Skull Crusher: 4 × 10–12  RIR 2
Single-Arm Cable Triceps Extension: 3 × 10–12/side  RIR 2  rest 60 s
```
WHY THIS FITS TODAY: You're low on energy today, so we're keeping you further from failure on every set, trimming a little accessory volume and slowing the eccentric on Parallel Bar Dip instead of adding load. As an intermediate lifter, 3 s eccentric on Parallel Bar Dip is on the table, and your muscle goal is why 3 accessory movements sit behind the main lifts. Barbell Bench Press and Parallel Bar Dip stay so your progression carries over, the session runs a different shape from last time and 4 movements are new versus your last one.

REALIZED PERSONALIZATION:
- state = low_energy (expression: cost_down) → intended: reduce_training_cost → realized: Barbell Bench Press RIR 2→3; Parallel Bar Dip RIR 2→3; Smith Machine Incline Press RIR 2→3; Cable Fly RIR 1→2; Dumbbell Skull Crusher RIR 1→2; Single-Arm Cable Triceps Extension RIR 1→2; Single-Arm Cable Triceps Extension 4→3 sets; Dumbbell Skull Crusher 4→3 sets; 3 s eccentric on Parallel Bar Dip
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: 3 s eccentric on Parallel Bar Dip (intermediate and up); intermediate pool: Barbell Bench Press, Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 3 accessory movements behind the main lift, 11 accessory sets in the 10–20 range; 3 s eccentric on Parallel Bar Dip
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 57.6 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = 3 completed Strength sessions → intended: rotate_shape_and_movements_keep_the_main_lift → realized: different shape from your last Upper Push (Volume then, Traditional now); main lift continuity for progression: Barbell Bench Press, Parallel Bar Dip; 4 movements not in your last Upper Push session

State gate: low_energy: attempt 0 expression 'cost_down' realized ['rir', 'volume', 'set_method'] no-ops [] → satisfied

### Session 5 (bored)

Context: State(s): bored · level: intermediate · goal: Build muscle · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: 4 completed session(s); last: strength_upper_push / Traditional  ·  seed `seqD / 2026-11-18`

**Upper Push** · variant **Top Set + Back-off** · est. 59.8 min · 21 working sets · set methods: one_and_half
```
Barbell Bench Press: 4 sets: 4/7/7/7  RIR 2  (Top set heavy, then back off 10–15% for the remaining sets. Stop each set with about 2 reps left in the tank.)  rest 225 s
Parallel Bar Dip: 4 × 8–10  RIR 2  rest 135 s
Plate-Loaded Incline Press: 4 × 8–10 · 1.5 reps  RIR 2  (Full rep, half rep from the stretched position, back to the top: that is one rep. Stop each set with about 2 reps left in the tank.)  rest 135 s
SUPERSET A (3 rounds, rest 60 s after each round)
  A1 EZ-Bar Skull Crusher: 3 × 10–12  RIR 1
  A2 Low-to-High Cable Fly: 3 × 10–12  RIR 1
Cable Triceps Kickback: 3 × 10–12/side  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: You're bored today, so we're changing the feel with 1.5 reps on the Plate-Loaded Incline Press and bringing in 1 less-familiar movement. As an intermediate lifter, the top-set scheme is in play, and your muscle goal is why 3 accessory movements sit behind the main lifts. Barbell Bench Press and Parallel Bar Dip stay so your progression carries over, the session runs a different shape from last time and 4 movements are new versus your last one.

REALIZED PERSONALIZATION:
- state = bored (expression: new_structure) → intended: refresh_the_experience → realized: 1.5 reps on Plate-Loaded Incline Press; Cable Triceps Pressdown → Cable Triceps Kickback
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: Top Set + Back-off (intermediate and up); 1.5 reps on Plate-Loaded Incline Press (intermediate and up); intermediate pool: Barbell Bench Press, Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 3 accessory movements behind the main lift, 9 accessory sets in the 10–20 range; 1.5 reps on Plate-Loaded Incline Press
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: estimated 59.8 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = 4 completed Strength sessions → intended: rotate_shape_and_movements_keep_the_main_lift → realized: different shape from your last Upper Push (Traditional then, Top Set + Back-off now); main lift continuity for progression: Barbell Bench Press, Parallel Bar Dip; 4 movements not in your last Upper Push session

State gate: bored: attempt 0 expression 'new_structure' realized ['set_method', 'exercises'] no-ops [] → satisfied

### Session 6 (irritated)

Context: State(s): irritated · level: intermediate · goal: Build muscle · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: 5 completed session(s); last: strength_upper_push / Top Set + Back-off  ·  seed `seqD / 2026-11-20`

**Upper Push** · variant **Heavy Primary** · est. 57.5 min · 17 working sets
```
Barbell Bench Press: 5 × 4–6  RIR 2  (Move the bar with intent: controlled down, drive up as fast as it will go. Stop each set with about 2 reps left in the tank.)  rest 240 s
Parallel Bar Dip: 4 × 8–10  RIR 2  rest 150 s
Smith Machine Incline Press: 4 × 8–10  RIR 2  rest 150 s
Pec Deck: 2 × 10–12  RIR 1  rest 45 s
Cable Triceps Pressdown: 2 × 10–12  RIR 1  rest 45 s
```
WHY THIS FITS TODAY: You're irritated today, so we're building the session around heavy, simple compound work, driving every rep of Barbell Bench Press with intent and giving the heavy work full rest so it stays heavy. Your muscle goal is why 2 accessory movements sit behind the main lifts. Barbell Bench Press and Parallel Bar Dip stay so your progression carries over, the session runs a different shape from last time and 3 movements are new versus your last one.

REALIZED PERSONALIZATION:
- state = irritated (expression: heavy_primary) → intended: direct_physical_cathartic_work → realized: Barbell Bench Press rest 225→240 s; Parallel Bar Dip rest 135→150 s; Smith Machine Incline Press rest 135→150 s; explosive intent on Barbell Bench Press; Heavy Primary instead of Top Set + Back-off
- experience = intermediate → intended: match_programming_vocabulary_to_level → realized: intermediate pool: Barbell Bench Press, Parallel Bar Dip
- goal = build_muscle → intended: hypertrophy_volume_and_accessories → realized: 2 accessory movements behind the main lift, 4 accessory sets in the 10–20 range
- duration = 60 → intended: fill_the_requested_time_with_useful_work → realized: trimmed to fit: accessory_rest_shortened, set_removed; estimated 57.5 min for a 60-minute request
- equipment = commercial_gym → intended: availability_only → realized: nothing (no claim made)
- history = 5 completed Strength sessions → intended: rotate_shape_and_movements_keep_the_main_lift → realized: different shape from your last Upper Push (Top Set + Back-off then, Heavy Primary now); main lift continuity for progression: Barbell Bench Press, Parallel Bar Dip; 3 movements not in your last Upper Push session

State gate: irritated: attempt 0 expression 'heavy_primary' realized ['rest', 'tempo', 'structure'] no-ops ['state_reps_no_effect'] → satisfied

## N. Founder test: 20 random workouts, State hidden

For each: is the State guessable from the workout plus the WHY line, and is the answer to 'why this workout for this person today' defensible? Answer key at the end.

### Founder test 1

Context: State(s): hidden · level: advanced · goal: Build strength · 30 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: first session

**Upper Push** · variant **Efficient** · est. 28.5 min · 9 working sets
```
Barbell Bench Press: 4 × 4–6  RIR 1  rest 150 s
Parallel Bar Dip: 3 × 6–8  RIR 1  rest 90 s
Rope Triceps Pressdown: 2 × 10–12  RIR 1  rest 45 s
FINISHER  Pec Deck: 2 × 15–20  RIR 0  rest 30 s
```
WHY THIS FITS TODAY: You're amped today, so we're taking Parallel Bar Dip a rep closer to failure, pushing the main lifts to the heavy end of their range and closing with a burnout finisher. Since you're an advanced lifter, Barbell Bench Press runs to a rep from failure, and your strength goal keeps the main lift heavy first.

### Founder test 2

Context: State(s): hidden · level: intermediate · goal: Feel better / reduce stress · 30 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: first session

**Upper Push** · variant **Heavy Primary** · est. 30.0 min · 9 working sets
```
Incline Dumbbell Press: 4 × 4–6  RIR 2  (Move the bar with intent: controlled down, drive up as fast as it will go. Stop each set with about 2 reps left in the tank.)  rest 210 s
Parallel Bar Dip: 3 × 8–10  RIR 2  rest 120 s
Machine Triceps Extension: 2 × 10–12  RIR 1  rest 45 s
```
WHY THIS FITS TODAY: You're irritated and stressed, so we're building the session around heavy, simple compound work, sticking to familiar movements you can run on autopilot and driving every rep of Incline Dumbbell Press with intent. Your feel-better goal keeps the compound work two reps from failure.

### Founder test 3

Context: State(s): hidden · level: beginner · goal: Lose weight / conditioning · 30 min · target: Glutes + Legs · soreness: none · equipment: commercial_gym · history: first session

**Glutes + Legs** · variant **Compound + Paired Accessories** · est. 27.3 min · 10 working sets · set methods: slow_eccentric
```
Barbell Hip Thrust: 3 × 6–8  RIR 2  rest 150 s
Trap-Bar Deadlift: 3 × 8–10 · 3 s eccentric  RIR 2  (Take 3 s to lower every rep, then lift at normal speed. Stop each set with about 2 reps left in the tank.)  rest 105 s
SUPERSET A (2 rounds, rest 60 s after each round)
  A1 Frog Pump: 2 × 12–15  RIR 2
  A2 Leg Extension: 2 × 12–15  RIR 2
```
WHY THIS FITS TODAY: You're bored today, so we're changing the shape of the session to Compound + Paired Accessories. Since you're newer to lifting, the main work keeps at least two reps in reserve and the movements stay approachable, and your conditioning goal keeps the accessory rests short.

### Founder test 4

Context: State(s): hidden · level: beginner · goal: Build strength · 30 min · target: Glutes + Legs · soreness: none · equipment: commercial_gym · history: first session

**Glutes + Legs** · variant **Traditional** · est. 26.3 min · 8 working sets
```
Barbell Hip Thrust: 3 × 8–10  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 150 s
Dumbbell Romanian Deadlift: 3 × 10–12  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 105 s
Machine Glute Kickback: 2 × 12–15/side  RIR 2  rest 60 s
```
WHY THIS FITS TODAY: You're low on energy today, so we're keeping you further from failure on Barbell Hip Thrust and Dumbbell Romanian Deadlift, leaving out the higher-cost accessories and keeping the main lifts at moderate loads. Since you're newer to lifting, the main work keeps at least two reps in reserve and the movements stay approachable.

### Founder test 5

Context: State(s): hidden · level: beginner · goal: Build strength · 30 min · target: Glutes + Legs · soreness: none · equipment: commercial_gym · history: first session

**Glutes + Legs** · variant **Compound + Paired Accessories** · est. 27.9 min · 10 working sets
```
Barbell Hip Thrust: 3 × 8–10  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 150 s
Pit Shark Belt Squat: 3 × 10–12  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 120 s
SUPERSET A (2 rounds, rest 60 s after each round)
  A1 Frog Pump: 2 × 12–15  RIR 2
  A2 Lying Leg Curl: 2 × 12–15  RIR 2
```
WHY THIS FITS TODAY: You're low on energy today, so we're keeping you further from failure on Barbell Hip Thrust and Pit Shark Belt Squat and keeping the main lifts at moderate loads. Since you're newer to lifting, the main work keeps at least two reps in reserve and the movements stay approachable.

### Founder test 6

Context: State(s): hidden · level: intermediate · goal: Lose weight / conditioning · 30 min · target: Lower Body: Squat · soreness: none · equipment: commercial_gym · history: first session

**Lower Body: Squat** · variant **Compound + Paired Accessories** · est. 29.4 min · 12 working sets
```
Barbell Back Squat: 3 × 5–7  RIR 2  rest 165 s
Leg Press: 3 × 8–10  RIR 2  rest 105 s
SUPERSET A (3 rounds, rest 60 s after each round)
  A1 Sissy Squat: 3 × 12–15  RIR 1
  A2 Roman Chair / GHD Glute-Ham Raise: 3 × 10–12  RIR 1
```
WHY THIS FITS TODAY: You're bored today, so we're bringing in 1 less-familiar movement and changing the shape of the session to Compound + Paired Accessories. Your conditioning goal keeps the accessory rests short.

### Founder test 7

Context: State(s): hidden · level: beginner · goal: Feel better / reduce stress · 60 min · target: Lower Body: Squat · soreness: none · equipment: commercial_gym · history: first session

**Lower Body: Squat** · variant **Traditional** · est. 53.8 min · 18 working sets · set methods: slow_eccentric
```
Hack Squat: 4 × 6–8  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 150 s
Leg Press: 4 × 8–10  RIR 3  (Controlled tempo: 3 s lowering, smooth drive, no bounce. Stop each set with about 3 reps left in the tank.)  rest 120 s
Box Step-Up (Glute Bias): 4 × 8–10/side  RIR 3  (Controlled tempo: 3 s lowering, smooth drive, no bounce. Stop each set with about 3 reps left in the tank.)  rest 120 s
Leg Extension: 2 × 12–15 · 3 s eccentric  RIR 2  (Take 3 s to lower every rep, then lift at normal speed. Stop each set with about 2 reps left in the tank.)  rest 60 s
Seated Leg Curl: 2 × 12–15  RIR 2  rest 60 s
Machine Glute Kickback: 2 × 12–15/side  RIR 2  rest 45 s
```
WHY THIS FITS TODAY: You're stressed today, so we're keeping the structure simple and predictable, keeping the reps controlled and rhythmic and sticking to familiar movements you can run on autopilot. Since you're newer to lifting, the main work keeps at least two reps in reserve and the movements stay approachable, and your feel-better goal keeps the compound work two reps from failure.

### Founder test 8

Context: State(s): hidden · level: intermediate · goal: Build strength · 30 min · target: Lower Body: Hinge · soreness: none · equipment: commercial_gym · history: first session

**Lower Body: Hinge** · variant **Efficient** · est. 26.7 min · 10 working sets
```
Barbell Romanian Deadlift: 3 × 5–7  RIR 2  rest 150 s
Cable Pull-Through: 3 × 8–10  RIR 2  rest 90 s
Seated Leg Curl: 2 × 10–12  RIR 1  rest 45 s
Side Plank: 2 × 20–40 sec / side  RIR 1  rest 45 s
```
WHY THIS FITS TODAY: You're stressed today, so we're keeping the structure simple and predictable. Your strength goal keeps the main lift heavy first.

### Founder test 9

Context: State(s): hidden · level: beginner · goal: Feel better / reduce stress · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: first session

**Upper Push** · variant **Heavy Primary** · est. 52.0 min · 16 working sets
```
Dumbbell Bench Press: 4 × 6–8  RIR 3  (Move the bar with intent: controlled down, drive up as fast as it will go. Stop each set with about 3 reps left in the tank.)  rest 180 s
Seated Dumbbell Shoulder Press: 4 × 8–10  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 150 s
Smith Machine Incline Press: 4 × 8–10  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 150 s
Pec Deck: 2 × 12–15  RIR 2  rest 75 s
Machine Triceps Extension: 2 × 12–15  RIR 2  rest 75 s
```
WHY THIS FITS TODAY: You're irritated and stressed, so we're building the session around heavy, simple compound work, taking unhurried rest between sets and driving every rep of Dumbbell Bench Press with intent. Since you're newer to lifting, the main work keeps at least two reps in reserve and the movements stay approachable, and your feel-better goal keeps the compound work two reps from failure.

### Founder test 10

Context: State(s): hidden · level: advanced · goal: Lose weight / conditioning · 60 min · target: Lower Body: Hinge · soreness: none · equipment: commercial_gym · history: first session

**Lower Body: Hinge** · variant **Top Set + Back-off** · est. 56.2 min · 18 working sets · set methods: pause, slow_eccentric
```
Barbell Romanian Deadlift: 4 sets: 4/7/7/7 · paused reps  RIR 1  (Pause 2 s at the hardest point of every rep, then drive out of it. Top set heavy, then back off 10–15% for the remaining sets. Stop each set with about 1 rep left in the tank.)  rest 240 s
Cable Pull-Through: 4 × 8–10 · 3 s eccentric  RIR 2  (Take 3 s to lower every rep, then lift at normal speed. Stop each set with about 2 reps left in the tank.)  rest 120 s
Curtsy Lunge: 4 × 8–10/side  RIR 2  rest 120 s
Roman Chair / GHD Glute-Ham Raise: 3 × 10–12  RIR 1  rest 45 s
Dragon Flag: 3 × 10–12  RIR 1  rest 45 s
```
WHY THIS FITS TODAY: You're bored today, so we're changing the feel with paused reps on the Barbell Romanian Deadlift, bringing in 2 less-familiar movements and changing the shape of the session to Top Set + Back-off. Since you're an advanced lifter, we're keeping 3 s eccentric on Cable Pull-Through in the mix, and your conditioning goal keeps the accessory rests short.

### Founder test 11

Context: State(s): hidden · level: intermediate · goal: Build muscle · 60 min · target: Arms · soreness: none · equipment: commercial_gym · history: first session

**Arms** · variant **Compound + Paired Accessories** · est. 56.9 min · 23 working sets
```
Incline Dumbbell Curl: 4 × 8–10  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 120 s
Seated Dip Machine: 4 × 8–10  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 120 s
SUPERSET A (4 rounds, rest 60 s after each round)
  A1 Bayesian Cable Curl: 4 × 12–15/side  RIR 2
  A2 Cross-Body Cable Triceps Extension: 4 × 12–15/side  RIR 2
Plate Front Raise: 4 × 15–20  RIR 2  rest 60 s
Chest-Supported Rear-Delt Row: 3 × 15–20  RIR 2  rest 60 s
```
WHY THIS FITS TODAY: You're bored and low on energy, so we're bringing in 3 less-familiar movements and keeping you further from failure on every set. Your muscle goal keeps 4 accessory movements working at moderate reps.

### Founder test 12

Context: State(s): hidden · level: intermediate · goal: Improve athleticism · 30 min · target: Full Body · soreness: none · equipment: commercial_gym · history: first session

**Full Body** · variant **Heavy Primary** · est. 30.8 min · 10 working sets · set methods: one_and_half
```
Barbell Romanian Deadlift: 4 × 4–6  RIR 2  rest 165 s
Dumbbell Thruster: 3 × 8–10  RIR 2  rest 90 s
Lat Pulldown: 3 × 8–10 · 1.5 reps  RIR 2  (Full rep, half rep from the stretched position, back to the top: that is one rep. Stop each set with about 2 reps left in the tank.)  rest 90 s
```
WHY THIS FITS TODAY: You're bored today, so we're changing the feel with 1.5 reps on the Lat Pulldown, bringing in 1 less-familiar movement and changing the shape of the session to Heavy Primary. Your athleticism goal keeps the main lift heavy and fast with full rest.

### Founder test 13

Context: State(s): hidden · level: beginner · goal: Feel better / reduce stress · 60 min · target: Upper Pull · soreness: none · equipment: commercial_gym · history: first session

**Upper Pull** · variant **Heavy Primary** · est. 52.1 min · 18 working sets
```
Chest-Supported Machine Row: 4 × 6–8  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 180 s
Lat Pulldown: 4 × 8–10  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 135 s
Assisted Pull-Up Machine: 4 × 8–10  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 135 s
SUPERSET A (3 rounds, rest 60 s after each round)
  A1 Incline Dumbbell Curl: 3 × 12–15  RIR 2
  A2 Reverse Pec Deck: 3 × 15–20  RIR 2
```
WHY THIS FITS TODAY: You're bored and low on energy, so we're bringing in 2 less-familiar movements, leaning into stable, low-friction movements and changing the shape of the session to Heavy Primary. Since you're newer to lifting, the main work keeps at least two reps in reserve and the movements stay approachable, and your feel-better goal keeps the compound work two reps from failure.

### Founder test 14

Context: State(s): hidden · level: intermediate · goal: Lose weight / conditioning · 30 min · target: Upper Body (mixed) · soreness: none · equipment: commercial_gym · history: first session

**Upper Body** · variant **Traditional** · est. 26.2 min · 9 working sets
```
Barbell Bench Press: 4 × 5–7  RIR 2  rest 150 s
Seated Cable Row: 3 × 8–10  RIR 2  rest 90 s
EZ-Bar Preacher Curl: 2 × 10–12  RIR 1  rest 45 s
```
WHY THIS FITS TODAY: You're amped but stressed, so we're adding a working set to Barbell Bench Press and sticking to familiar movements you can run on autopilot. Your conditioning goal keeps the accessory rests short.

### Founder test 15

Context: State(s): hidden · level: beginner · goal: Improve athleticism · 30 min · target: Lower Body: Hinge · soreness: none · equipment: commercial_gym · history: first session

**Lower Body: Hinge** · variant **Traditional** · est. 27.2 min · 8 working sets
```
Dumbbell Romanian Deadlift: 3 × 6–8  RIR 2  rest 150 s
Cable Pull-Through: 3 × 8–10  RIR 2  (Controlled tempo: 3 s lowering, smooth drive, no bounce. Stop each set with about 2 reps left in the tank.)  rest 105 s
Seated Leg Curl: 2 × 12–15  RIR 2  rest 60 s
FINISHER  Machine Glute Kickback: 2 × 15–20  RIR 0  rest 30 s
```
WHY THIS FITS TODAY: You're amped but stressed, so we're closing with a burnout finisher and keeping the reps controlled and rhythmic. Since you're newer to lifting, the main work keeps at least two reps in reserve and the movements stay approachable.

### Founder test 16

Context: State(s): hidden · level: advanced · goal: Build strength · 60 min · target: Full Body · soreness: none · equipment: commercial_gym · history: first session

**Full Body** · variant **Traditional** · est. 53.0 min · 19 working sets
```
Trap-Bar Deadlift: 4 × 4–6  RIR 1  rest 210 s
Dumbbell Thruster: 4 × 6–8  RIR 1  rest 120 s
Seated Cable Row: 4 × 6–8  RIR 1  rest 120 s
Copenhagen Plank: 4 × 15–30 sec / side  RIR 1  rest 60 s
Barbell Curl: 3 × 12–15  RIR 1  rest 45 s
```
WHY THIS FITS TODAY: You're amped today, so we're taking Dumbbell Thruster and Seated Cable Row a rep closer to failure. Since you're an advanced lifter, Trap-Bar Deadlift runs to a rep from failure, and your strength goal keeps the main lift heavy with full rest.

### Founder test 17

Context: State(s): hidden · level: advanced · goal: Build strength · 60 min · target: Upper Pull · soreness: none · equipment: commercial_gym · history: first session

**Upper Pull** · variant **Heavy Primary** · est. 57.4 min · 17 working sets
```
Chest-Supported Machine Row: 5 × 4–6  RIR 2  rest 240 s
Pull-Up: 4 × 6–8  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 135 s
Single-Arm Cable Row: 4 × 6–8/side  RIR 3  (Stop each set with about 3 reps left in the tank.)  rest 135 s
Dumbbell Pullover: 2 × 10–12  RIR 2  rest 60 s
EZ-Bar Preacher Curl: 2 × 10–12  RIR 2  rest 60 s
```
WHY THIS FITS TODAY: You're low on energy today, so we're keeping you further from failure on every set and leaning into stable, low-friction movements. Since you're an advanced lifter, the compound work stays demanding before the accessories, and your strength goal keeps the main lift heavy with full rest.

### Founder test 18

Context: State(s): hidden · level: advanced · goal: Stay consistent · 60 min · target: Lower Body: Squat · soreness: none · equipment: commercial_gym · history: first session

**Lower Body: Squat** · variant **Traditional** · est. 52.0 min · 18 working sets
```
Barbell Back Squat: 4 × 4–6  RIR 1  rest 180 s
Leg Press: 4 × 6–8  RIR 2  rest 120 s
Dumbbell Step-Up: 4 × 6–8/side  RIR 2  rest 120 s
Reverse Nordic Curl: 3 × 12–15  RIR 1  rest 60 s
Roman Chair / GHD Glute-Ham Raise: 3 × 10–12  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: You're irritated today, so we're loading the main lifts heavier and keeping the movements simple and physical. Since you're an advanced lifter, Barbell Back Squat runs to a rep from failure, and the session stays balanced rather than specialised.

### Founder test 19

Context: State(s): hidden · level: intermediate · goal: Lose weight / conditioning · 60 min · target: Upper Push · soreness: none · equipment: commercial_gym · history: first session

**Upper Push** · variant **Traditional** · est. 56.6 min · 21 working sets
```
Dumbbell Bench Press: 4 × 5–7  RIR 1  rest 195 s
Parallel Bar Dip: 4 × 8–10  RIR 2  rest 120 s
Smith Machine Incline Press: 4 × 8–10  RIR 2  rest 120 s
Cable Fly: 3 × 10–12  RIR 1  rest 60 s
Cable Triceps Pressdown: 3 × 10–12  RIR 1  rest 60 s
EZ-Bar Skull Crusher: 3 × 10–12  RIR 1  rest 60 s
```
WHY THIS FITS TODAY: You're amped but stressed, so we're taking Dumbbell Bench Press a rep closer to failure and keeping the structure simple and predictable. Your conditioning goal keeps the accessory rests short.

### Founder test 20

Context: State(s): hidden · level: beginner · goal: Build strength · 30 min · target: Full Body · soreness: none · equipment: commercial_gym · history: first session

**Full Body** · variant **Compound + Paired Accessories** · est. 30.9 min · 10 working sets
```
Hack Squat: 4 × 6–8  RIR 2  rest 150 s
Landmine Squat-to-Press: 3 × 8–10  RIR 2  rest 105 s
Neutral-Grip Lat Pulldown: 3 × 8–10  RIR 2  rest 105 s
```
WHY THIS FITS TODAY: You're amped today, so we're running a compound + paired accessories shape and adding a working set to Hack Squat. Since you're newer to lifting, the main work keeps at least two reps in reserve and the movements stay approachable.

## Answer key (founder test)

- Founder test 1: State(s) = amped; realized: amped via heavy_end: Parallel Bar Dip 8–10→6–8; Parallel Bar Dip RIR 2→1; burnout finisher: Pec Deck 2 × 15–20
- Founder test 2: State(s) = irritated, stressed; realized: irritated via heavy_primary: Incline Dumbbell Press rest 210→240 s; Parallel Bar Dip rest 120→135 s; explosive intent on Incline Dumbbell Press; Heavy Primary instead of Compound + Paired Accessories; Single-Arm Cable Triceps Extension → Machine Triceps Extension | stressed via simpler: Single-Arm Cable Triceps Extension → Machine Triceps Extension
- Founder test 3: State(s) = bored; realized: bored via new_exercises: Compound + Paired Accessories instead of Traditional
- Founder test 4: State(s) = low_energy; realized: low_energy via moderate_load: Barbell Hip Thrust 6–8→8–10; Dumbbell Romanian Deadlift 8–10→10–12; Barbell Hip Thrust RIR 2→3; Dumbbell Romanian Deadlift RIR 2→3; Cable Glute Kickback out (complexity / systemic cost)
- Founder test 5: State(s) = low_energy; realized: low_energy via moderate_load: Barbell Hip Thrust 6–8→8–10; Pit Shark Belt Squat 8–10→10–12; Barbell Hip Thrust RIR 2→3; Pit Shark Belt Squat RIR 2→3
- Founder test 6: State(s) = bored; realized: bored via new_exercises: Compound + Paired Accessories instead of Traditional; Leg Extension → Sissy Squat
- Founder test 7: State(s) = stressed; realized: stressed via controlled: controlled on Leg Press, Box Step-Up (Glute Bias); 3 s eccentric on Leg Extension; Traditional instead of Volume; Slider Hamstring Curl out (complexity / systemic cost); Frog Pump → Machine Glute Kickback
- Founder test 8: State(s) = stressed; realized: stressed via simpler: Efficient instead of Heavy Primary
- Founder test 9: State(s) = irritated, stressed; realized: irritated via heavy_primary: Seated Dumbbell Shoulder Press rest 135→150 s; Smith Machine Incline Press rest 135→150 s; explosive intent on Dumbbell Bench Press; Heavy Primary instead of Volume; EZ-Bar Skull Crusher out (complexity / systemic cost) | stressed via predictable: Pec Deck rest 60→75 s; Machine Triceps Extension rest 60→75 s; EZ-Bar Skull Crusher out (complexity / systemic cost)
- Founder test 10: State(s) = bored; realized: bored via new_structure: paused reps on Barbell Romanian Deadlift; Top Set + Back-off instead of Traditional; Reverse Lunge → Curtsy Lunge; Landmine Rotation → Dragon Flag
- Founder test 11: State(s) = bored, low_energy; realized: bored via new_structure: EZ-Bar Curl → Incline Dumbbell Curl; Assisted Dip (Triceps Bias) → Seated Dip Machine; Cable Front Raise → Plate Front Raise | low_energy via cost_down: Incline Dumbbell Curl RIR 2→3; Seated Dip Machine RIR 2→3; Bayesian Cable Curl RIR 1→2; Cross-Body Cable Triceps Extension RIR 1→2; Plate Front Raise RIR 1→2; Chest-Supported Rear-Delt Row RIR 1→2; Chest-Supported Rear-Delt Row 4→3 sets; Cross-Body Cable Triceps Extension 4→3 sets; EZ-Bar Curl → Incline Dumbbell Curl; Assisted Dip (Triceps Bias) → Seated Dip Machine; Cable Front Raise → Plate Front Raise
- Founder test 12: State(s) = bored; realized: bored via new_exercises: 1.5 reps on Lat Pulldown; Heavy Primary instead of Efficient; Dumbbell Squat-to-Press → Dumbbell Thruster
- Founder test 13: State(s) = bored, low_energy; realized: bored via new_structure: Heavy Primary instead of Traditional; Dumbbell Pullover → Reverse Pec Deck; EZ-Bar Preacher Curl → Incline Dumbbell Curl | low_energy via cost_down: Dumbbell Pullover out (complexity / systemic cost); EZ-Bar Preacher Curl → Incline Dumbbell Curl
- Founder test 14: State(s) = amped, stressed; realized: amped via extra_set_paired: Barbell Bench Press 3→4 sets | stressed via simpler: Dumbbell Lateral Raise → EZ-Bar Preacher Curl
- Founder test 15: State(s) = amped, stressed; realized: amped via heavy_end: burnout finisher: Machine Glute Kickback 2 × 15–20 | stressed via controlled: controlled on Cable Pull-Through
- Founder test 16: State(s) = amped; realized: amped via heavy_end: Dumbbell Thruster RIR 2→1; Seated Cable Row RIR 2→1
- Founder test 17: State(s) = low_energy; realized: low_energy via cost_down: Chest-Supported Machine Row RIR 1→2; Pull-Up RIR 2→3; Single-Arm Cable Row RIR 2→3; Dumbbell Pullover RIR 1→2; EZ-Bar Preacher Curl RIR 1→2; Barbell Curl → EZ-Bar Preacher Curl
- Founder test 18: State(s) = irritated; realized: irritated via direct_simple: Barbell Back Squat 5–7→4–6; Leg Press 8–10→6–8; Dumbbell Step-Up 8–10/side→6–8/side; Bulgarian Split Squat → Dumbbell Step-Up; Sissy Squat → Reverse Nordic Curl
- Founder test 19: State(s) = amped, stressed; realized: amped via top_set: Dumbbell Bench Press RIR 2→1 | stressed via predictable: Dumbbell Bench Press rest 180→195 s; Parallel Bar Dip rest 105→120 s; Smith Machine Incline Press rest 105→120 s; Traditional instead of Compound + Paired Accessories; EZ-Bar Skull Crusher → Cable Triceps Pressdown; Single-Arm Cable Triceps Extension → EZ-Bar Skull Crusher
- Founder test 20: State(s) = amped; realized: amped via extra_set_paired: Hack Squat 3→4 sets; Compound + Paired Accessories instead of Efficient

## QA metrics (full sample)

```
== sample 4470 ok 4431 conflicts [(('strength_upper_push', "['chest']", 'sore_target_conflict'), 6), (('strength_upper_mixed', "['chest']", 'sore_target_conflict'), 6), (('strength_lower_squat', "['legs']", 'sore_target_conflict'), 6), (('strength_lower_hinge', "['legs']", 'sore_target_conflict'), 6), (('strength_glutes_legs', "['legs']", 'sore_target_conflict'), 6), (('strength_full_body', "['legs']", 'sore_target_conflict'), 6)]

== STATE SATISFACTION GATE
 states evaluated 5548; satisfied 97% (5378/5548); needed a fallback expression 21% (1154/5548); yielded to a conflicting State by rule 76; exhausted 62
   yielded: {('amped', 'low_energy_vs_effort'): 60, ('low_energy', 'low_energy_vs_amped_volume'): 16}
   exhausted by (state, archetype, level): {('bored', 'strength_lower_squat', 'beginner'): 9, ('bored', 'strength_glutes_legs', 'beginner'): 4, ('low_energy', 'strength_core', 'beginner'): 9, ('bored', 'strength_core', 'beginner'): 2, ('irritated', 'strength_core', 'beginner'): 16, ('bored', 'strength_lower_hinge', 'advanced'): 2, ('bored', 'strength_full_body', 'beginner'): 3, ('irritated', 'strength_core', 'intermediate'): 14, ('bored', 'strength_upper_push', 'beginner'): 1, ('bored', 'strength_upper_pull', 'beginner'): 2}
   amped        satisfied 94% (1124/1195)  fallback used 32% (382/1195)
   bored        satisfied 98% (1120/1143)  fallback used 10% (114/1143)
   irritated    satisfied 97% (894/924)  fallback used 20% (182/924)
   low_energy   satisfied 97% (1106/1143)  fallback used 23% (265/1143)
   stressed     satisfied 99% (1134/1143)  fallback used 18% (211/1143)
 first-attempt no-op rate (before fallback): {'amped': '29%', 'bored': '6%', 'irritated': '17%', 'low_energy': '8%', 'stressed': '6%'}

== STATE FINGERPRINTS (realized adaptation kinds in the final workout)

 low_energy n=1080: kinds {'exercises': '60%', 'rir': '59%', 'reps': '25%', 'complexity_or_systemic_cap': '22%', 'structure': '20%', 'slot_removed': '17%', 'set_method': '11%', 'volume': '8%'}
   top combinations: [(['exercises', 'rir'], 117), (['exercises'], 100), (['rir'], 69), (['exercises', 'reps', 'rir'], 51), (['exercises', 'slot_removed'], 49)]
   expressions {'moderate_load': 337, 'simplify': 318, 'cost_down': 400, 'last_resort': 25}   set methods present {'slow_eccentric': 124, 'one_and_half': 11, 'pause': 66}   finisher 4% (48/1080)
   single-State vs same no-State build: retention 69%  Δsets -0.75  ΔRIR +0.55  Δrest +0.9s

 stressed n=1080: kinds {'exercises': '56%', 'tempo': '34%', 'rest': '32%', 'structure': '25%', 'complexity_or_systemic_cap': '19%', 'slot_removed': '14%', 'rir': '10%', 'set_method': '4%'}
   top combinations: [(['exercises', 'rest'], 120), (['exercises'], 108), (['tempo'], 91), (['rest'], 74), (['exercises', 'slot_removed'], 61)]
   expressions {'predictable': 386, 'simpler': 306, 'controlled': 370, 'last_resort': 18}   set methods present {'slow_eccentric': 45, 'one_and_half': 1, 'pause': 73}   finisher 2% (26/1080)
   single-State vs same no-State build: retention 72%  Δsets -0.45  ΔRIR +0.04  Δrest +4.5s

 bored n=1080: kinds {'exercises': '89%', 'set_method': '31%', 'structure': '22%', 'finisher': '7%'}
   top combinations: [(['exercises'], 533), (['exercises', 'set_method'], 192), (['exercises', 'structure'], 104), (['exercises', 'set_method', 'structure'], 71), (['exercises', 'finisher'], 43)]
   expressions {'new_exercises': 339, 'fresh_finish': 488, 'last_resort': 33, 'new_structure': 220}   set methods present {'one_and_half': 104, 'drop_set': 64, 'cluster': 26, 'slow_eccentric': 189, 'rest_pause': 116, 'pause': 171}   finisher 11% (116/1080)
   single-State vs same no-State build: retention 57%  Δsets -0.20  ΔRIR +0.00  Δrest +1.0s

 irritated n=810: kinds {'rest': '45%', 'tempo': '43%', 'exercises': '37%', 'structure': '35%', 'reps': '26%', 'complexity_or_systemic_cap': '19%', 'finisher': '5%'}
   top combinations: [(['rest', 'structure', 'tempo'], 105), (['exercises'], 95), (['rest', 'tempo'], 55), (['reps'], 51), (['exercises', 'reps'], 42)]
   expressions {'heavy_primary': 393, 'forceful_finish': 221, 'last_resort': 50, 'direct_simple': 146}   set methods present {'drop_set': 7, 'pause': 36, 'rest_pause': 4, 'slow_eccentric': 34, 'one_and_half': 8}   finisher 5% (41/810)
   single-State vs same no-State build: retention 84%  Δsets -0.62  ΔRIR +0.01  Δrest +9.0s

 amped n=1080: kinds {'rir': '43%', 'structure': '36%', 'volume': '26%', 'reps': '21%', 'set_method': '11%', 'finisher': '4%'}
   top combinations: [(['structure'], 154), (['rir'], 131), (['volume'], 115), (['reps'], 106), (['rir', 'structure'], 103)]
   expressions {'extra_set_paired': 295, 'top_set': 254, 'heavy_end': 367, 'last_resort': 164}   set methods present {'one_and_half': 63, 'cluster': 38, 'drop_set': 54, 'slow_eccentric': 86, 'rest_pause': 75, 'pause': 128}   finisher 7% (71/1080)
   single-State vs same no-State build: retention 97%  Δsets -0.01  ΔRIR -0.21  Δrest +2.5s

== EXPLANATION TRUTHFULNESS
 workouts with a synthesised line 4413; claims not backed by a realized contract entry: 0; workouts with no synthesised line 18 (no State, no soreness, nothing material to say beyond structure)
 style-lint violations: 0

== EXPERIENCE LEVEL (archetype runs, no State, 60 min)
 beginner     n=160 sets/session 18.0  exercises 5.3  set-method in session 19% (31/160)  methods {'slow_eccentric': 31}
      variants {'paired': 44, 'heavy_primary': 43, 'volume': 40, 'traditional': 26, 'efficient': 7}
      RIR {2: 742, 3: 110}  primary reps {'6–8': 116, '8–10': 39}  accessory reps {'12–15': 295, '15–20': 63, '20–40 sec': 3, '20–30 sec': 2}
      structures {'straight': 160, 'superset': 107, 'finisher': 18}
 intermediate n=160 sets/session 19.0  exercises 5.3  set-method in session 42% (68/160)  methods {'drop_set': 6, 'one_and_half': 6, 'pause': 24, 'slow_eccentric': 31, 'rest_pause': 1}
      variants {'paired': 44, 'volume': 42, 'heavy_primary': 36, 'traditional': 17, 'top_backoff': 14, 'efficient': 7}
      RIR {2: 448, 1: 388, 3: 8}  primary reps {'5–7': 93, '4–6': 42, '6–8': 20}  accessory reps {'10–12': 266, '12–15': 85, '15–20': 11, '20–30 sec': 2}
      structures {'straight': 160, 'superset': 86, 'finisher': 14, 'ladder': 1}
 advanced     n=160 sets/session 18.9  exercises 5.3  set-method in session 66% (105/160)  methods {'drop_set': 19, 'one_and_half': 18, 'pause': 25, 'rest_pause': 5, 'cluster': 8, 'slow_eccentric': 30}
      variants {'paired': 44, 'volume': 42, 'heavy_primary': 36, 'traditional': 17, 'top_backoff': 14, 'efficient': 7}
      RIR {1: 483, 2: 361}  primary reps {'5–7': 93, '4–6': 42, '6–8': 20}  accessory reps {'10–12': 262, '12–15': 92, '15–20': 10, '15–30 sec / side': 2}
      structures {'straight': 160, 'superset': 69, 'finisher': 11, 'ladder': 1}

== GOAL (goal grid, no State, 60 min, intermediate+advanced)
 build_muscle               n=40 variants {'volume': 14, 'paired': 14, 'heavy_primary': 6, 'efficient': 2, 'top_backoff': 2, 'traditional': 2}
      primary reps {'5–7': 24, '6–8': 10, '4–6': 6} primary rest {150: 14, 180: 14, 225: 8} accessories/session 2.5 accessory sets/session 7.9 accessory rest {60: 96, 30: 2} compound RIR {2: 105, 1: 13} methods {'drop_set': 7, 'one_and_half': 7, 'slow_eccentric': 6, 'pause': 4, 'rest_pause': 1}
 build_strength             n=40 variants {'heavy_primary': 14, 'top_backoff': 10, 'paired': 6, 'volume': 6, 'efficient': 2, 'traditional': 2}
      primary reps {'5–7': 22, '4–6': 18} primary rest {240: 26, 210: 8, 180: 6} accessories/session 2.4 accessory sets/session 6.1 accessory rest {60: 92, 45: 2} compound RIR {2: 95, 1: 17} methods {'drop_set': 2, 'slow_eccentric': 8, 'pause': 8, 'cluster': 5, 'one_and_half': 2}
 improve_athleticism        n=40 variants {'heavy_primary': 12, 'volume': 12, 'paired': 8, 'top_backoff': 4, 'efficient': 2, 'traditional': 2}
      primary reps {'5–7': 24, '4–6': 16} primary rest {240: 18, 180: 12, 210: 8} accessories/session 2.4 accessory sets/session 6.8 accessory rest {60: 88, 45: 8} compound RIR {2: 100, 1: 14} methods {'one_and_half': 4, 'rest_pause': 2, 'pause': 9, 'slow_eccentric': 4, 'drop_set': 1}
 lose_weight_conditioning   n=40 variants {'paired': 16, 'volume': 12, 'heavy_primary': 6, 'efficient': 2, 'top_backoff': 2, 'traditional': 2}
      primary reps {'5–7': 26, '6–8': 8, '4–6': 6} primary rest {195: 16, 165: 12, 240: 10} accessories/session 2.5 accessory sets/session 7.5 accessory rest {60: 66, 45: 34} compound RIR {2: 102, 1: 14} methods {'drop_set': 6, 'one_and_half': 2, 'slow_eccentric': 8, 'pause': 4}
 feel_better_reduce_stress  n=40 variants {'volume': 12, 'heavy_primary': 10, 'paired': 10, 'traditional': 4, 'efficient': 2, 'top_backoff': 2}
      primary reps {'5–7': 22, '4–6': 10, '6–8': 8} primary rest {240: 13, 165: 12, 195: 10} accessories/session 2.5 accessory sets/session 7.4 accessory rest {60: 96, 45: 2} compound RIR {2: 108, 3: 6} methods {'one_and_half': 3, 'slow_eccentric': 12, 'pause': 4, 'drop_set': 1}
 stay_consistent            n=40 variants {'volume': 12, 'paired': 12, 'heavy_primary': 8, 'top_backoff': 4, 'efficient': 2, 'traditional': 2}
      primary reps {'5–7': 24, '4–6': 8, '6–8': 8} primary rest {240: 13, 165: 12, 195: 12} accessories/session 2.5 accessory sets/session 7.3 accessory rest {60: 90, 45: 8} compound RIR {2: 102, 1: 14} methods {'drop_set': 2, 'slow_eccentric': 12, 'one_and_half': 2, 'pause': 4}

== SET METHODS (all archetype runs)
 sessions with a method: 27% (940/3510)  by method {'one_and_half': 135, 'drop_set': 98, 'cluster': 49, 'slow_eccentric': 335, 'rest_pause': 133, 'pause': 339}
 by State: {'': 'n/a', 'low_energy': '12% (32/270)', 'stressed': '8% (22/270)', 'bored': '72% (195/270)', 'irritated': '19% (52/270)', 'amped': '39% (105/270)'}
 method on which class: {'accessory': 250, 'secondary_compound': 484, 'primary_compound': 355}

== BASE + REGRESSION
 no-State 60: straight-only 39% (47/120) est mean 53.6 in 50–60 94% (113/120) variants {'paired': 33, 'traditional': 32, 'heavy_primary': 25, 'volume': 23, 'top_backoff': 4, 'efficient': 3}
 no-State 30: est mean 28.0 in 25–33 99% (119/120)
 Amped 60 finisher 19% (25/135) burnout 14% (19/135) top/back-off 20% (27/135)
 Irritated 60 finisher 18% (24/135) carry anywhere 7% (9/135) KB swing anywhere 7% (9/135)
 Low Energy: accessory sets reduced 18% (49/270)
 protected primary kept under low_energy: 100% (210/210)
 protected primary kept under stressed: 100% (210/210)
 protected primary kept under bored: 98% (206/210)
 protected primary kept under irritated: 100% (210/210)
 protected primary kept under amped: 100% (210/210)

== SORENESS + EXPLICIT TARGET
 target ['chest', 'triceps'] sore ['shoulders'] -> strength_custom_target: ['db_incline_press', 'machine_chest_press', 'cable_fly', 'rope_pressdown', 'seated_dip_machine']
      ['no movement loads the sore front_delts, rear_delts, shoulders, side_delts directly', '2 movements still use it as a secondary mover (Incline Dumbbell Press, Machine Chest Press); everything else avoids it']
 target ['chest', 'triceps'] sore ['lower_back'] -> strength_upper_push: ['barbell_bench_press', 'parallel_bar_dip', 'smith_incline_press', 'low_to_high_cable_fly', 'db_overhead_extension', 'machine_lateral_raise']
      ['no movement loads the sore spinal_erectors directly', 'no accessory uses it as a secondary mover either']
 target ['chest', 'triceps'] sore ['legs'] -> strength_upper_push: ['barbell_bench_press', 'parallel_bar_dip', 'smith_incline_press', 'low_to_high_cable_fly', 'db_overhead_extension', 'machine_lateral_raise']
      ['no movement loads the sore calves, glutes, hamstrings, quads directly', 'no accessory uses it as a secondary mover either']
 target ['chest'] sore ['shoulders'] -> strength_custom_target: ['db_incline_press', 'machine_chest_press', 'parallel_bar_dip', 'cable_fly']
      ['no movement loads the sore front_delts, rear_delts, shoulders, side_delts directly', '3 movements still use it as a secondary mover (Incline Dumbbell Press, Machine Chest Press, Parallel Bar Dip); everything else avoids it']
 target ['chest'] sore ['lower_back'] -> strength_custom_target: ['db_incline_press', 'machine_chest_press', 'parallel_bar_dip', 'cable_fly']
      ['no movement loads the sore spinal_erectors directly', 'no accessory uses it as a secondary mover either']
 target ['chest'] sore ['legs'] -> strength_custom_target: ['db_incline_press', 'machine_chest_press', 'parallel_bar_dip', 'cable_fly']
      ['no movement loads the sore calves, glutes, hamstrings, quads directly', 'no accessory uses it as a secondary mover either']
 target ['back', 'biceps'] sore ['shoulders'] -> strength_upper_pull: ['assisted_pull_up_machine', 'single_arm_cable_row', 'single_arm_lat_pulldown', 'db_pullover', 'ez_preacher_curl', 'barbell_curl']
      ['no movement loads the sore front_delts, rear_delts, shoulders, side_delts directly', 'no accessory uses it as a secondary mover either']
 target ['back', 'biceps'] sore ['lower_back'] -> strength_upper_pull: ['chest_supported_row_machine', 'assisted_pull_up_machine', 'meadows_row', 'straight_arm_pulldown', 'ez_preacher_curl', 'zottman_curl']
      ['no movement loads the sore spinal_erectors directly', 'no accessory uses it as a secondary mover either']
 target ['back', 'biceps'] sore ['legs'] -> strength_upper_pull: ['chest_supported_row_machine', 'assisted_pull_up_machine', 't_bar_row', 'straight_arm_pulldown', 'ez_preacher_curl', 'zottman_curl']
      ['no movement loads the sore calves, glutes, hamstrings, quads directly', 'no accessory uses it as a secondary mover either']
 target ['quads', 'glutes'] sore ['shoulders'] -> strength_glutes_legs: ['barbell_hip_thrust', 'hack_squat', 'box_step_up_glute', 'cable_glute_kickback', 'leg_extension']
      ['no movement loads the sore front_delts, rear_delts, shoulders, side_delts directly', 'no accessory uses it as a secondary mover either']
 target ['quads', 'glutes'] sore ['lower_back'] -> strength_glutes_legs: ['barbell_hip_thrust', 'hack_squat', 'box_step_up_glute', 'cable_glute_kickback', 'leg_extension']
      ['no movement loads the sore spinal_erectors directly', 'no accessory uses it as a secondary mover either']
 target ['quads', 'glutes'] sore ['legs'] -> strength_glutes_legs: ['barbell_hip_thrust', 'hack_squat', 'curtsy_lunge', 'cable_glute_kickback', 'leg_extension']
      ['glutes, quads trained as asked despite soreness']
 target ['chest', 'triceps'] sore ['shoulders'] -> strength_custom_target: ['db_incline_press', 'machine_chest_press', 'low_to_high_cable_fly', 'overhead_cable_extension', 'seated_dip_machine']
      ['no movement loads the sore front_delts, rear_delts, shoulders, side_delts directly', '3 movements still use it as a secondary mover (Incline Dumbbell Press, Machine Chest Press, Low-to-High Cable Fly); everything else avoids it']
 target ['chest', 'triceps'] sore ['lower_back'] -> strength_upper_push: ['db_incline_press', 'parallel_bar_dip', 'single_arm_cable_chest_press', 'pec_deck', 'ez_skull_crusher', 'cross_body_cable_triceps_extension']
      ['no movement loads the sore spinal_erectors directly', 'no accessory uses it as a secondary mover either']
 target ['chest', 'triceps'] sore ['legs'] -> strength_upper_push: ['db_incline_press', 'parallel_bar_dip', 'single_arm_cable_chest_press', 'pec_deck', 'ez_skull_crusher', 'cross_body_cable_triceps_extension']
      ['no movement loads the sore calves, glutes, hamstrings, quads directly', 'no accessory uses it as a secondary mover either']
 target ['chest'] sore ['shoulders'] -> strength_custom_target: ['db_incline_press', 'machine_chest_press', 'parallel_bar_dip', 'low_to_high_cable_fly']
      ['no movement loads the sore front_delts, rear_delts, shoulders, side_delts directly', '4 movements still use it as a secondary mover (Incline Dumbbell Press, Machine Chest Press, Parallel Bar Dip, Low-to-High Cable Fly); everything else avoids it']
 target ['chest'] sore ['lower_back'] -> strength_custom_target: ['db_incline_press', 'machine_chest_press', 'parallel_bar_dip', 'low_to_high_cable_fly']
      ['no movement loads the sore spinal_erectors directly', 'no accessory uses it as a secondary mover either']
 target ['chest'] sore ['legs'] -> strength_custom_target: ['db_incline_press', 'machine_chest_press', 'parallel_bar_dip', 'low_to_high_cable_fly']
      ['no movement loads the sore calves, glutes, hamstrings, quads directly', 'no accessory uses it as a secondary mover either']
 target ['back', 'biceps'] sore ['shoulders'] -> strength_upper_pull: ['assisted_pull_up_machine', 'single_arm_cable_row', 'single_arm_lat_pulldown', 'db_pullover', 'ez_bar_curl', 'bayesian_cable_curl']
      ['no movement loads the sore front_delts, rear_delts, shoulders, side_delts directly', 'no accessory uses it as a secondary mover either']
 target ['back', 'biceps'] sore ['lower_back'] -> strength_upper_pull: ['chest_supported_row_machine', 'chin_up', 'single_arm_db_row', 'straight_arm_pulldown', 'ez_bar_curl', 'bayesian_cable_curl']
      ['no movement loads the sore spinal_erectors directly', 'no accessory uses it as a secondary mover either']
 target ['back', 'biceps'] sore ['legs'] -> strength_upper_pull: ['chest_supported_row_machine', 'chin_up', 'single_arm_db_row', 'straight_arm_pulldown', 'ez_bar_curl', 'bayesian_cable_curl']
      ['no movement loads the sore calves, glutes, hamstrings, quads directly', 'no accessory uses it as a secondary mover either']
 target ['quads', 'glutes'] sore ['shoulders'] -> strength_glutes_legs: ['barbell_hip_thrust', 'hack_squat', 'curtsy_lunge', 'frog_pump', 'reverse_nordic']
      ['no movement loads the sore front_delts, rear_delts, shoulders, side_delts directly', 'no accessory uses it as a secondary mover either']
 target ['quads', 'glutes'] sore ['lower_back'] -> strength_glutes_legs: ['barbell_hip_thrust', 'hack_squat', 'curtsy_lunge', 'frog_pump', 'reverse_nordic']
      ['no movement loads the sore spinal_erectors directly', 'no accessory uses it as a secondary mover either']
 target ['quads', 'glutes'] sore ['legs'] -> strength_glutes_legs: ['barbell_hip_thrust', 'hack_squat', 'curtsy_lunge', 'frog_pump', 'reverse_nordic']
      ['glutes, quads trained as asked despite soreness']

== SEQUENTIAL
 h1: traditional/drop_set | paired | volume/slow_eccentric | paired/pause | traditional/slow_eccentric/fin | paired | volume | paired/one_and_half | traditional | volume/slow_eccentric
      back-to-back repeats: variant 0 expression 0 method 0 finisher 0
 h2: volume/top_set/pause | paired/heavy_end/drop_set | volume/extra_set_paired/one_and_half | traditional/heavy_end/fin | top_backoff/extra_set_paired/drop_set | top_backoff/top_set/one_and_half | volume/heavy_end/slow_eccentric | top_backoff/top_set
      back-to-back repeats: variant 1 expression 0 method 0 finisher 0
 h3: heavy_primary/heavy_primary/drop_set | paired/forceful_finish | heavy_primary/heavy_primary/rest_pause | heavy_primary/heavy_primary | traditional/heavy_primary/one_and_half | heavy_primary/heavy_primary/one_and_half | paired/direct_simple | heavy_primary/heavy_primary
      back-to-back repeats: variant 1 expression 3 method 1 finisher 0
 h4: traditional/moderate_load | traditional/cost_down | traditional/moderate_load | heavy_primary/simplify | traditional/cost_down/pause | heavy_primary/moderate_load | volume/simplify | volume/cost_down
      back-to-back repeats: variant 3 expression 0 method 0 finisher 0
 h5: top_backoff/new_exercises/slow_eccentric | paired/new_structure/slow_eccentric | volume/fresh_finish/pause | paired/new_structure/rest_pause | volume/fresh_finish/slow_eccentric | traditional/new_exercises/drop_set | paired/fresh_finish/drop_set | volume/new_structure/rest_pause
      back-to-back repeats: variant 0 expression 0 method 2 finisher 0
 h6: traditional/controlled | volume/simpler | traditional/predictable/slow_eccentric | traditional/simpler/slow_eccentric | volume/predictable | traditional/simpler | volume/controlled | traditional/simpler/pause
      back-to-back repeats: variant 1 expression 0 method 1 finisher 0
 h7: traditional | top_backoff/top_set | paired/new_structure/drop_set | traditional | paired/cost_down | heavy_primary/forceful_finish | volume | traditional/controlled | volume/heavy_end/pause/fin | heavy_primary/slow_eccentric
      back-to-back repeats: variant 0 expression 0 method 0 finisher 0
```