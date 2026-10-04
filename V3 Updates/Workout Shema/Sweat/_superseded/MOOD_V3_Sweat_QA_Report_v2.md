# MOOD V3 Sweat QA Report v2 (reference generator v2, FINAL FREEZE) · 2026-09-23

All tiers green, including the v3 targeted Tier 5. 0 ACTUAL GENERATOR FAILURES, 0 hard-rule, soreness, SC-contract or fixed-station violations. No implementation blocker.

| Tier | Result |
|---|---|
| 0 Data | 0 errors |
| 1a Grid | 672 builds · actual failures 0 · hard fails 0 · soft band 2 |
| 1b Fixtures | 41/41 pass · 41/41 match reference |
| 2 | reproducible 400/400 · swap {'healthy': 13, 'limited but defensible': 1} · history {'good': 8} |
| 3 Soreness | violations 0 · outcomes {'VALID BUILD': 152, 'VALID TERMINAL CONFLICT': 4} |
| 4 Invariants + SC | 832 workouts, 73402 checks · violations {'SOFT_duration_band': 2} |
| 5a Low Energy rotation | {'LE int 60': 'rotates', 'LE int 30': 'rotates', 'LE beginner 60': 'rotates', 'LE + Stressed 60': 'rotates', 'LE forced Engine 60': 'rotates'} |
| 5b Duty cycle | below 0.60: 0 · repairs 2 |
| 5c Resistance-heavy Circuits | 72/72 pass |
| 5d Equipment-limited | 96/96 pass, resistance-only builds 24 |
| 5e Hybrid variety | {'Hybrid int': 'varied', 'Hybrid Irritated': 'varied (State-limited pool)', 'Hybrid adv 30': 'varied', 'Hybrid in rotation (Performance)': 'varied'} |

## 5a Low Energy sequences

| Profile | Engine primaries (in order) | Distinct Circuit resistance items | Verdict |
|---|---|---|---|
| LE int 60 | treadmill_incline_walk → row_erg → treadmill_incline_walk → stationary_bike | 7 | rotates |
| LE int 30 | row_erg → stationary_bike → treadmill_incline_walk → row_erg | 7 | rotates |
| LE beginner 60 | treadmill_incline_walk → stationary_bike → treadmill_incline_walk → stationary_bike | 5 | rotates |
| LE + Stressed 60 | treadmill_incline_walk → stationary_bike → treadmill_incline_walk → stationary_bike | 5 | rotates |
| LE forced Engine 60 | stationary_bike → row_erg → treadmill_incline_walk → stationary_bike → row_erg → treadmill_incline_walk → stationary_bike → row_erg | 0 | rotates |

## 5b Duty cycle by primary block

| Archetype / structure | n | min | mean |
|---|---|---|---|
| circuit|circuit | 190 | 0.667 | 0.761 |
| circuit|emom | 101 | 0.606 | 0.635 |
| circuit|intervals | 90 | 0.621 | 0.706 |
| engine|continuous | 53 | 1.0 | 1.0 |
| engine|intervals | 101 | 1.0 | 1.0 |
| engine|pyramid | 17 | 1.0 | 1.0 |
| hybrid|circuit | 76 | 0.764 | 0.829 |

## 5e Hybrid variety

| Profile | Sessions | Anchors | Max consecutive overlap | Full sled template | Sessions with a sled | Distinct stations |
|---|---|---|---|---|---|---|
| Hybrid int | 8 | row_erg, ski_erg, treadmill_run | 0.0 | 0 | 5 | 20 |
| Hybrid Irritated | 8 | row_erg, ski_erg | 0.6 | 0 | 7 | 10 |
| Hybrid adv 30 | 8 | row_erg, ski_erg, treadmill_run | 0.0 | 0 | 6 | 6 |
| Hybrid in rotation (Performance) | 4 | row_erg, ski_erg, treadmill_run | 0.0 | 0 | 4 | 14 |

## v3 renders

```
LE day 1 · Circuit · 60 min · intermediate · low_energy · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V -1 E +0 Nov -1/-1 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · circuit, 4 rounds, 1:30 between rounds   [RPE 7-8, a few words]  ~20.0 min
   A1 Stationary Bike 1:00 · RPE 8
   A2 Kickstand Dumbbell RDL 8/side · moderate, crisp hips (RPE <= 8)
   A3 Chest-Supported Machine Row 12 · moderate load, unbroken, well short of failure
   A4 Dead Bug 8/side · steady, clean reps
3  COMPLEMENTARY · continuous 9:00   [RPE 5-6, full sentences]  ~9.0 min
   Row Erg · one steady rhythm, no programmed recovery
4  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.77
Est. ~42 min · conditioning time 29.0 min
  log state_volume: -1 unit complementary_block

LE day 2 · Engine · 60 min · intermediate · low_energy · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V -1 E +0 Nov -1/-1 Eng +0 Extras 0 · engine_mode steady (aerobic)
1  WARM-UP (computed) 7:00
2  PRIMARY ENGINE · continuous 22:00   [RPE 5-6, full sentences]  ~22.0 min
   Incline Treadmill Walk · one steady rhythm, no programmed recovery
3  COMPLEMENTARY · circuit, 2 rounds, 1:30 between rounds   [RPE 6-7, short phrases]  ~6.2 min
   B1 Leg Press 12 · moderate load, unbroken, well short of failure
   B2 Lat Pulldown 12 · moderate load, unbroken, well short of failure
   B3 Reverse Crunch 15 · steady, clean reps
4  DOWNSHIFT (computed) 5:00
Progression: duration / pace at the same RPE; resistance loads reused, not progressed · primary duty cycle 1.00
Est. ~42 min · conditioning time 28.1 min
  log engine_mode_selected: steady (aerobic, state_preference)
  log state_volume: -1 unit complementary_block

LE day 3 · Circuit · 60 min · intermediate · low_energy · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V -1 E +0 Nov -1/-1 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · circuit, 5 rounds, 1:30 between rounds   [RPE 7-8, a few words]  ~20.3 min
   A1 Suitcase Carry 30 m · heavy, steady
   A2 Hack Squat 12 · moderate load, unbroken, well short of failure
   A3 Assisted Pull-Up Machine 12 · moderate load, unbroken, well short of failure
   A4 Battle Rope Waves 0:30 · RPE 8
3  COMPLEMENTARY · continuous 9:00   [RPE 5-6, full sentences]  ~9.0 min
   Stationary Bike · one steady rhythm, no programmed recovery
4  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.70
Est. ~42 min · conditioning time 29.3 min
  log state_volume: -1 unit complementary_block

LE day 4 · Engine · 60 min · intermediate · low_energy · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V -1 E +0 Nov -1/-1 Eng +0 Extras 0 · engine_mode interval (controlled)
1  WARM-UP (computed) 7:00
2  PRIMARY ENGINE · intervals 11 x 1:00 / 1:00 easy   [RPE 7, short phrases]  ~21.0 min
   Row Erg
3  COMPLEMENTARY · circuit, 2 rounds, 1:30 between rounds   [RPE 6-7, short phrases]  ~6.6 min
   B1 Kickstand Dumbbell RDL 8/side · moderate, crisp hips (RPE <= 8)
   B2 Plate-Loaded Incline Press 12 · moderate load, unbroken, well short of failure
   B3 Front Plank 0:40 · steady, clean reps
4  DOWNSHIFT (computed) 5:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 1.00
Est. ~42 min · conditioning time 27.6 min
  log engine_mode_selected: interval (controlled, rotate_vs_last_engine)
  log state_volume: -1 unit complementary_block

Equipment-limited resistance-only · Circuit · 30 min · intermediate · Normal · MOOD's Pick · db_bench_only
Sore: quads, core
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 4:00
2  PRIMARY CIRCUIT · EMOM 16 min (4 stations x 4)   [RPE 7-8, a few words]  ~16.0 min
   Min 1 Dumbbell Romanian Deadlift 13 · moderate, crisp hips (RPE <= 8)
   Min 2 Dumbbell Bench Press 13 · moderate load, unbroken, well short of failure
   Min 3 Chest-Supported Dumbbell Row 13 · moderate load, unbroken, well short of failure
   Min 4 Reverse Lunge to Overhead Press 5/side · moderate load, unbroken, well short of failure
   Expected work per minute <= 40 s (39s, 39s, 39s, 40s); rest the remainder
3  DOWNSHIFT (computed) 3:00
Progression: minutes completed on time, then modest density; resistance loads reused, not progressed · primary duty cycle 0.65
Est. ~24 min · conditioning time 16.0 min
  log sore_exclusion: ['core', 'quads']
  log conditioning_driver_resistance_only: ['db_rdl', 'db_bench_press', 'chest_supported_db_row', 'reverse_lunge_to_press']

```

## Rendered fixtures

### W01 Engine canonical
```
Engine · 60 min · intermediate · Normal · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0 · engine_mode interval (long_even)
1  WARM-UP (computed) 7:00
2  PRIMARY ENGINE · intervals 4 x 4:00 / 1:30 easy   [RPE 7-8, a few words]  ~20.5 min
   Air Bike
3  COMPLEMENTARY · circuit, 3 rounds, 1:30 between rounds   [RPE 6-7, short phrases]  ~9.6 min
   B1 Goblet Squat 12 · moderate load, unbroken, well short of failure
   B2 Push-Up 10 · steady, clean reps
   B3 Front Plank 0:40 · steady, clean reps
4  DOWNSHIFT (computed) 5:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 1.00
Est. ~44 min · conditioning time 30.1 min
  log engine_mode_selected: interval (long_even, goal_default)
```

### W02 Circuit canonical
```
Circuit · 60 min · intermediate · Normal · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · EMOM 20 min (4 stations x 5)   [RPE 7-8, a few words]  ~20.0 min
   Min 1 Row Erg 150 m · RPE 8
   Min 2 Box Step-Up (Glute Bias) 6/side · moderate load, unbroken, well short of failure
   Min 3 Push-Up 15 · steady, clean reps
   Min 4 Dead Bug 6/side · steady, clean reps
   Expected work per minute <= 40 s (36s, 36s, 37s, 36s); rest the remainder
3  COMPLEMENTARY · EMOM 10 min (2 stations x 5)   [RPE 6-7, short phrases]  ~10.0 min
   Min 1 Farmer Carry 40 m · heavy, steady
   Min 2 Goblet Squat 13 · moderate load, unbroken, well short of failure
   Expected work per minute <= 40 s (40s, 39s); rest the remainder
4  DOWNSHIFT (computed) 5:00
Progression: minutes completed on time, then modest density; resistance loads reused, not progressed · primary duty cycle 0.61
Est. ~43 min · conditioning time 30.0 min
```

### W03 Hybrid canonical (sled default)
```
Hybrid · 60 min · intermediate · Normal · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 7:00
2  PRIMARY HYBRID · anchor circuit, 5 rounds, 1:00 walk between   [RPE 7, short phrases]  ~23.5 min
   Every round: Treadmill Run 500 m · race pace RPE 7
     R1 Sled Push 20 m · heavy, steady
     R2 Farmer Carry 60 m · heavy, steady
     R3 Goblet Squat 15 · moderate load, unbroken, well short of failure
     R4 Burpee 10 · RPE 7, quick and clean
     R5 Dumbbell Step-Up 10/side · moderate load, unbroken, well short of failure
3  COMPLEMENTARY · circuit, 3 rounds, 0:45 between rounds   [RPE 6-7, short phrases]  ~8.9 min
   B1 Push-Up 10 · steady, clean reps
   B2 Wall Ball 15 · RPE 7
   B3 Dead Bug 8/side · steady, clean reps
4  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.83
Est. ~46 min · conditioning time 32.4 min
  log duration_backfill: primary +1 unit
```

### W03b Hybrid, user has no sled
```
Hybrid · 60 min · intermediate · Normal · MOOD's Pick · commercial_no_sled
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 7:00
2  PRIMARY HYBRID · anchor circuit, 5 rounds, 1:00 walk between   [RPE 7, short phrases]  ~23.6 min
   Every round: Treadmill Run 500 m · race pace RPE 7
     R1 Wall Ball 20 · RPE 7
     R2 Farmer Carry 60 m · heavy, steady
     R3 Goblet Squat 15 · moderate load, unbroken, well short of failure
     R4 Burpee 10 · RPE 7, quick and clean
     R5 Jump Squat 15 · RPE 7, quick and clean
3  COMPLEMENTARY · circuit, 3 rounds, 0:45 between rounds   [RPE 6-7, short phrases]  ~8.4 min
   B1 Push-Up 10 · steady, clean reps
   B2 Med-Ball Slam 12 · RPE 7
   B3 Dead Bug 8/side · steady, clean reps
4  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.83
Est. ~46 min · conditioning time 32.1 min
  log relaxation_a: comp: adjacency relaxed (no valid order)
  log duration_backfill: primary +1 unit
```

### W04 Engine beginner 30
```
Engine · 30 min · beginner · Normal · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0 · engine_mode interval (controlled)
1  WARM-UP (computed) 4:00
2  PRIMARY ENGINE · intervals 8 x 1:00 / 1:00 easy   [RPE 7, short phrases]  ~15.0 min
   Row Erg
3  DOWNSHIFT (computed) 3:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 1.00
Est. ~23 min · conditioning time 15.0 min
  log engine_mode_selected: interval (controlled, goal_default)
```

### W05 Explicit upper Target 30
```
Circuit · 30 min · intermediate · Normal · Explicit: chest, back, shoulders · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 4:00
2  PRIMARY CIRCUIT · EMOM 16 min (4 stations x 4)   [RPE 7-8, a few words]  ~16.0 min
   Min 1 SkiErg 150 m · RPE 8
   Min 2 Push-Up 15 · steady, clean reps
   Min 3 Bent-Over Dumbbell Row (Two-Arm) 13 · moderate load, unbroken, well short of failure
   Min 4 Battle Rope Waves 0:40 · RPE 8
   Expected work per minute <= 40 s (37s, 37s, 39s, 40s); rest the remainder
3  DOWNSHIFT (computed) 3:00
Progression: minutes completed on time, then modest density; resistance loads reused, not progressed · primary duty cycle 0.64
Est. ~24 min · conditioning time 16.0 min
  log target_routed_circuit: ['back', 'chest', 'front_delts', 'rear_delts', 'shoulders', 'side_delts', 'spinal_erectors']
```

### W06 Hybrid 30
```
Hybrid · 30 min · intermediate · Normal · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 5:00
2  PRIMARY HYBRID · anchor circuit, 3 rounds, 1:00 walk between   [RPE 7, short phrases]  ~14.6 min
   Every round: Treadmill Run 400 m · race pace RPE 7
     Sled Push 20 m · heavy, steady
     Farmer Carry 60 m · heavy, steady
3  DOWNSHIFT (computed) 3:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.86
Est. ~24 min · conditioning time 14.6 min
```

### W07 Low Energy 60
```
Circuit · 60 min · intermediate · low_energy · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V -1 E +0 Nov -1/-1 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · circuit, 4 rounds, 1:30 between rounds   [RPE 7-8, a few words]  ~19.4 min
   A1 Stationary Bike 1:00 · RPE 8
   A2 Kickstand Dumbbell RDL 8/side · moderate, crisp hips (RPE <= 8)
   A3 Machine Chest Press 12 · moderate load, unbroken, well short of failure
   A4 Front Plank 0:40 · steady, clean reps
3  COMPLEMENTARY · continuous 9:00   [RPE 5-6, full sentences]  ~9.0 min
   Row Erg · one steady rhythm, no programmed recovery
4  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.77
Est. ~41 min · conditioning time 28.4 min
  log state_volume: -1 unit complementary_block
```

### W08 Stressed 60 (Engine steady)
```
Engine · 60 min · intermediate · stressed · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V +0 E +0 Nov -1/-1 Eng +2 Extras 0 · engine_mode steady (aerobic)
1  WARM-UP (computed) 7:00
2  PRIMARY ENGINE · continuous 22:00   [RPE 5-6, full sentences]  ~22.0 min
   Row Erg · one steady rhythm, no programmed recovery
3  COMPLEMENTARY · circuit, 3 rounds, 1:00 between rounds   [RPE 6-7, short phrases]  ~8.6 min
   B1 Goblet Squat 12 · moderate load, unbroken, well short of failure
   B2 Push-Up 10 · steady, clean reps
   B3 Front Plank 0:40 · steady, clean reps
4  DOWNSHIFT (computed) 5:00
Progression: duration / pace at the same RPE; resistance loads reused, not progressed · primary duty cycle 1.00
Est. ~44 min · conditioning time 30.6 min
  log engine_mode_selected: steady (aerobic, state_preference)
```

### W08b Stressed 60 after a steady Engine session
```
Engine · 60 min · intermediate · stressed · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V +0 E +0 Nov -1/-1 Eng +2 Extras 0 · engine_mode interval (long_even)
1  WARM-UP (computed) 7:00
2  PRIMARY ENGINE · intervals 3 x 6:00 / 2:00 easy   [RPE 7-8, a few words]  ~22.0 min
   Incline Treadmill Walk
3  COMPLEMENTARY · circuit, 3 rounds, 1:00 between rounds   [RPE 6-7, short phrases]  ~8.6 min
   B1 Goblet Squat 12 · moderate load, unbroken, well short of failure
   B2 Push-Up 10 · steady, clean reps
   B3 Front Plank 0:40 · steady, clean reps
4  DOWNSHIFT (computed) 5:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 1.00
Est. ~44 min · conditioning time 30.6 min
  log engine_mode_selected: interval (long_even, rotate_vs_last_engine)
```

### W09 Bored advanced 60
```
Circuit · 60 min · advanced · bored · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +2/+2 Eng +1 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · EMOM 24 min (4 stations x 6)   [RPE 7-8, a few words]  ~24.0 min
   Min 1 Bear Crawl 20 m · RPE 8, quick and clean
   Min 2 Lateral Step-Up 6/side · moderate load, unbroken, well short of failure
   Min 3 Dumbbell Floor Press 13 · moderate load, unbroken, well short of failure
   Min 4 Battle Rope Waves 0:40 · RPE 8
   Expected work per minute <= 40 s (36s, 36s, 39s, 40s); rest the remainder
3  COMPLEMENTARY · ladder 12-10-8-6-4-2 (self-paced)   [RPE 6-7, short phrases]  ~5.7 min
   Med-Ball Slam + Heel-Elevated Dumbbell Squat
4  DOWNSHIFT (computed) 5:00
Progression: minutes completed on time, then modest density; resistance loads reused, not progressed · primary duty cycle 0.63
Est. ~43 min · conditioning time 29.7 min
  log duration_backfill: primary +1 unit
  log duration_backfill: complement +1 unit
```

### W10 Irritated Hybrid 60 (sled default)
```
Hybrid · 60 min · intermediate · irritated · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V +0 E +1 Nov +0/+0 Eng +1 Extras 1
1  WARM-UP (computed) 7:00
2  PRIMARY HYBRID · anchor circuit, 5 rounds, 1:00 walk between   [RPE 8, a few words]  ~21.4 min
   Every round: Row Erg 600 m · race pace RPE 8
     R1 Jump Squat 15 · RPE 8, quick and clean
     R2 Med-Ball Slam 15 · RPE 8
     R3 Sled Push 20 m · heavy, steady
     R4 Burpee 10 · RPE 8, quick and clean
     R5 Farmer Carry 60 m · heavy, steady
3  COMPLEMENTARY · circuit, 3 rounds, 0:45 between rounds   [RPE 7-8, a few words]  ~8.5 min
   B1 Push-Up 10 · steady, clean reps
   B2 Wall Ball 15 · RPE 8
   B3 Front Plank 0:40 · steady, clean reps
4  FINISHER · finisher 6 x 20s all-out / 40s easy   [RPE 9, no talking]  ~5.3 min
   Battle Rope Waves / Sled Rope Pull (alternate)
5  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.81
Est. ~50 min · conditioning time 35.2 min
  log duration_backfill: primary +1 unit
  log extra_finisher: battle_rope_waves,sled_pull
```

### W11 Amped Engine 60 advanced
```
Engine · 60 min · advanced · amped · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +1 E +1 Nov +0/+0 Eng +0 Extras 1 · engine_mode interval (short)
1  WARM-UP (computed) 7:00
2  PRIMARY ENGINE · intervals 11 x 0:40 / 1:00 easy   [RPE 9, no talking]  ~17.3 min
   SkiErg
3  COMPLEMENTARY · circuit, 4 rounds, 1:00 between rounds   [RPE 7-8, a few words]  ~11.5 min
   B1 Goblet Squat 12 · moderate load, unbroken, well short of failure
   B2 Push-Up 10 · steady, clean reps
   B3 Farmer Carry 40 m · heavy, steady
4  FINISHER · finisher 6 x 20s all-out / 40s easy   [RPE 9, no talking]  ~5.3 min
   Med-Ball Slam / Air Bike (alternate)
5  DOWNSHIFT (computed) 5:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 1.00
Est. ~49 min · conditioning time 34.1 min
  log engine_mode_selected: interval (short, state)
  log duration_backfill: complement +1 unit
  log state_volume: +1 unit primary
  log extra_finisher: med_ball_slam,air_bike
```

### W12 Amped Circuit 30
```
Circuit · 30 min · intermediate · amped · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +1 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 4:00
2  PRIMARY CIRCUIT · intervals (timed rotation) 40/20, 4 rounds, 1:00 between rounds   [RPE 8-9, no talking]  ~19.0 min
   1 Jump Squat · RPE 8, quick and clean
   2 Dumbbell Romanian Deadlift · moderate, crisp hips (RPE <= 8)
   3 Push-Up · steady, clean reps
   4 Med-Ball Slam · RPE 9
3  DOWNSHIFT (computed) 3:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 0.77
Est. ~27 min · conditioning time 19.0 min
```

### W13 Sore legs, MOOD's Pick
```
Circuit · 60 min · intermediate · Normal · MOOD's Pick · sweat_commercial_default
Sore: quads, hamstrings, glutes
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · intervals (timed rotation) 40/20, 4 rounds, 1:00 between rounds   [RPE 7-8, a few words]  ~19.0 min
   1 Farmer Carry · heavy, steady
   2 Push-Up · steady, clean reps
   3 Chest-Supported Dumbbell Row · moderate load, unbroken, well short of failure
   4 Battle Rope Waves · RPE 8
3  COMPLEMENTARY · EMOM 10 min (2 stations x 5)   [RPE 6-7, short phrases]  ~10.0 min
   Min 1 Med-Ball Slam 13 · RPE 7
   Min 2 Seated Dumbbell Shoulder Press 13 · moderate load, unbroken, well short of failure
   Expected work per minute <= 40 s (39s, 39s); rest the remainder
4  DOWNSHIFT (computed) 5:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 0.77
Est. ~42 min · conditioning time 29.0 min
  log sore_exclusion: ['glutes', 'hamstrings', 'quads']
  log region_balance_relaxed_sore: primary
```

### W13b Sore legs, Engine forced (SkiErg legal: not dependent)
```
Engine · 60 min · intermediate · Normal · MOOD's Pick · sweat_commercial_default
Sore: quads, hamstrings, glutes
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0 · engine_mode interval (long_even)
1  WARM-UP (computed) 7:00
2  PRIMARY ENGINE · intervals 4 x 4:00 / 1:30 easy   [RPE 7-8, a few words]  ~20.5 min
   SkiErg
3  COMPLEMENTARY · circuit, 3 rounds, 1:30 between rounds   [RPE 6-7, short phrases]  ~9.6 min
   B1 Push-Up 10 · steady, clean reps
   B2 Bent-Over Dumbbell Row (Two-Arm) 12 · moderate load, unbroken, well short of failure
   B3 Farmer Carry 40 m · heavy, steady
4  DOWNSHIFT (computed) 5:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 1.00
Est. ~44 min · conditioning time 30.1 min
  log sore_exclusion: ['glutes', 'hamstrings', 'quads']
  log engine_mode_selected: interval (long_even, goal_default)
  log region_balance_relaxed_sore: comp
```

### W14 Beginner limited equipment 30
```
Circuit · 30 min · beginner · Normal · MOOD's Pick · db_bodyweight_only
Outcome: VALID BUILD
Resolved: cap 2 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 4:00
2  PRIMARY CIRCUIT · circuit, 4 rounds, 1:00 between rounds   [RPE 7-8, a few words]  ~13.0 min
   A1 Burpee 6 · RPE 8, quick and clean
   A2 Dumbbell Romanian Deadlift 10 · moderate, crisp hips (RPE <= 8)
   A3 Push-Up 8 · steady, clean reps
   A4 Front Plank 0:30 · steady, clean reps
3  COMPLEMENTARY · intervals 6 x 0:30 / 0:30 easy   [RPE 7-8, a few words]  ~5.5 min
   Jump Rope
4  DOWNSHIFT (computed) 3:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.77
Est. ~28 min · conditioning time 18.5 min
```

### W15 Lower Target + Irritated + Low Energy
```
Circuit · 60 min · intermediate · irritated, low_energy · Explicit: quads, glutes · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V -1 E +1 Nov -1/-1 Eng +1 Extras 0 · pair irritated+low_energy
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · circuit, 4 rounds, 1:30 between rounds   [RPE 8-9, no talking]  ~20.2 min
   A1 Row Erg 250 m · RPE 9
   A2 Kickstand Dumbbell RDL 8/side · moderate, crisp hips (RPE <= 8)
   A3 Box Step-Up (Glute Bias) 8/side · moderate load, unbroken, well short of failure
   A4 Front Plank 0:40 · steady, clean reps
3  COMPLEMENTARY · continuous 9:00   [RPE 6-7, short phrases]  ~9.0 min
   Stationary Bike · one steady rhythm, no programmed recovery
4  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.78
Est. ~42 min · conditioning time 29.2 min
  log target_routed_circuit: ['glutes', 'quads']
  log state_volume: -1 unit complementary_block
```

### W16 Engine Bored 30
```
Engine · 30 min · intermediate · bored · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +2/+2 Eng +1 Extras 0 · engine_mode interval (pyramid)
1  WARM-UP (computed) 4:00
2  PRIMARY ENGINE · pyramid 1:00-2:00-3:00-2:00-1:00 with 1:00 easy between   [RPE 7-8, a few words]  ~13.0 min
   SkiErg
3  COMPLEMENTARY · intervals 6 x 0:30 / 0:30 easy   [RPE 7-8, a few words]  ~5.5 min
   Jump Rope
4  DOWNSHIFT (computed) 3:00
Progression: output held across steps; resistance loads reused, not progressed · primary duty cycle 1.00
Est. ~28 min · conditioning time 18.5 min
  log engine_mode_selected: interval (pyramid, rotate_vs_last_engine)
```

### M1 Bored + Stressed
```
Circuit · 60 min · intermediate · bored, stressed · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V +0 E +0 Nov +2/-1 Eng +2 Extras 0 · pair bored+stressed
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · circuit, 5 rounds, 1:30 between rounds   [RPE 7-8, a few words]  ~22.2 min
   A1 Bear Crawl 20 m · RPE 8, quick and clean
   A2 Kickstand Dumbbell RDL 8/side · moderate, crisp hips (RPE <= 8)
   A3 Dumbbell Floor Press 12 · moderate load, unbroken, well short of failure
   A4 Battle Rope Waves 0:30 · RPE 8
3  COMPLEMENTARY · circuit, 3 rounds, 1:00 between rounds   [RPE 6-7, short phrases]  ~9.8 min
   B1 Front-Foot Elevated Split Squat 8/side · moderate load, unbroken, well short of failure
   B2 Half-Kneeling Single-Arm Landmine Press 8/side · moderate load, unbroken, well short of failure
   B3 Suitcase Carry 30 m · heavy, steady
4  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.73
Est. ~45 min · conditioning time 32.0 min
```

### M2 Low Energy + Amped
```
Circuit · 60 min · intermediate · low_energy, amped · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V +0 E +1 Nov -1/-1 Eng +0 Extras 0 · pair amped+low_energy
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · intervals (timed rotation) 30/30, 4 rounds, 1:00 between rounds   [RPE 8-9, no talking]  ~19.0 min
   1 Row Erg · RPE 9
   2 Kickstand Dumbbell RDL · moderate, crisp hips (RPE <= 8)
   3 Assisted Dip (Triceps Bias) · moderate load, unbroken, well short of failure
   4 Dead Bug · steady, clean reps
3  COMPLEMENTARY · continuous 10:00   [RPE 5-6, full sentences]  ~10.0 min
   Stationary Bike · one steady rhythm, no programmed recovery
4  DOWNSHIFT (computed) 5:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 0.63
Est. ~42 min · conditioning time 29.0 min
```

### M3 Irritated + Low Energy (pick)
```
Circuit · 60 min · intermediate · irritated, low_energy · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V -1 E +1 Nov -1/-1 Eng +1 Extras 0 · pair irritated+low_energy
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · circuit, 4 rounds, 1:30 between rounds   [RPE 8-9, no talking]  ~19.4 min
   A1 Row Erg 250 m · RPE 9
   A2 Kickstand Dumbbell RDL 8/side · moderate, crisp hips (RPE <= 8)
   A3 Chest-Supported Dumbbell Row 12 · moderate load, unbroken, well short of failure
   A4 Front Plank 0:40 · steady, clean reps
3  COMPLEMENTARY · continuous 9:00   [RPE 6-7, short phrases]  ~9.0 min
   Stationary Bike · one steady rhythm, no programmed recovery
4  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.77
Est. ~41 min · conditioning time 28.4 min
  log state_volume: -1 unit complementary_block
```

### M4 Sore shoulders + Amped
```
Circuit · 60 min · intermediate · amped · MOOD's Pick · sweat_commercial_default
Sore: shoulders
Outcome: VALID BUILD
Resolved: cap 3 · V +1 E +1 Nov +0/+0 Eng +0 Extras 1
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · intervals (timed rotation) 40/20, 5 rounds, 1:00 between rounds   [RPE 8-9, no talking]  ~24.0 min
   1 Jump Squat · RPE 8, quick and clean
   2 Kickstand Dumbbell RDL · moderate, crisp hips (RPE <= 8)
   3 Dumbbell Floor Press · moderate load, unbroken, well short of failure
   4 Sled Rope Pull · heavy, steady
3  COMPLEMENTARY · EMOM 10 min (2 stations x 5)   [RPE 7-8, a few words]  ~10.0 min
   Min 1 Air Bike 11 cal · RPE 8
   Min 2 Box Step-Up (Glute Bias) 6/side · moderate load, unbroken, well short of failure
   Expected work per minute <= 40 s (38s, 36s); rest the remainder
4  FINISHER · finisher 6 x 15s all-out / 45s easy   [RPE 9, no talking]  ~5.2 min
   Row Erg
5  DOWNSHIFT (computed) 5:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 0.76
Est. ~53 min · conditioning time 39.2 min
  log sore_exclusion: ['front_delts', 'rear_delts', 'shoulders', 'side_delts']
  log state_volume: +1 unit primary
  log extra_finisher: row_erg
```

### M5 Stressed + Irritated
```
Circuit · 60 min · intermediate · stressed, irritated · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V +0 E +1 Nov -1/-1 Eng +2 Extras 1 · pair irritated+stressed
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · circuit, 6 rounds, 1:30 between rounds   [RPE 8-9, no talking]  ~24.2 min
   A1 Jump Squat 12 · RPE 8, quick and clean
   A2 Kettlebell Deadlift 12 · moderate, crisp hips (RPE <= 8)
   A3 Push-Up 10 · steady, clean reps
   A4 Med-Ball Slam 12 · RPE 9
3  COMPLEMENTARY · circuit, 3 rounds, 1:00 between rounds   [RPE 7-8, a few words]  ~8.8 min
   B1 Goblet Squat 12 · moderate load, unbroken, well short of failure
   B2 Bench Dip 10 · moderate load, unbroken, well short of failure
   B3 Farmer Carry 40 m · heavy, steady
4  FINISHER · finisher 6 x 15s all-out / 45s easy   [RPE 9, no talking]  ~5.2 min
   Wall Ball
5  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.69
Est. ~52 min · conditioning time 38.2 min
  log duration_backfill: primary +1 unit
  log extra_finisher: wall_ball
```

### M6 Bored + Amped 60
```
Circuit · 60 min · intermediate · bored, amped · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +1 E +1 Nov +2/+1 Eng +1 Extras 1 · pair amped+bored
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · EMOM 28 min (4 stations x 7)   [RPE 8-9, no talking]  ~28.0 min
   Min 1 Med-Ball Slam 13 · RPE 9
   Min 2 Kickstand Dumbbell RDL 6/side · moderate, crisp hips (RPE <= 8)
   Min 3 Dumbbell Floor Press 13 · moderate load, unbroken, well short of failure
   Min 4 Battle Rope Waves 0:40 · RPE 9
   Expected work per minute <= 40 s (39s, 36s, 39s, 40s); rest the remainder
3  COMPLEMENTARY · ladder 12-10-8-6-4-2 (self-paced)   [RPE 7-8, a few words]  ~5.0 min
   Jump Squat + Suspension Trainer Row
4  FINISHER · finisher 6 x 20s all-out / 40s easy   [RPE 9, no talking]  ~5.3 min
   Sled Rope Pull / Sled Push (alternate)
5  DOWNSHIFT (computed) 5:00
Progression: minutes completed on time, then modest density; resistance loads reused, not progressed · primary duty cycle 0.64
Est. ~52 min · conditioning time 38.3 min
  log duration_backfill: primary +1 unit
  log duration_backfill: complement +1 unit
  log state_volume: +1 unit primary
  log extra_finisher: sled_pull,sled_push
```

### M7 Bored + Amped 30
```
Circuit · 30 min · intermediate · bored, amped · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +1 Nov +2/+1 Eng +1 Extras 0 · pair amped+bored
1  WARM-UP (computed) 4:00
2  PRIMARY CIRCUIT · EMOM 16 min (4 stations x 4)   [RPE 8-9, no talking]  ~16.0 min
   Min 1 Med-Ball Slam 13 · RPE 9
   Min 2 Front-Foot Elevated Split Squat 6/side · moderate load, unbroken, well short of failure
   Min 3 Dumbbell Floor Press 13 · moderate load, unbroken, well short of failure
   Min 4 Battle Rope Waves 0:40 · RPE 9
   Expected work per minute <= 40 s (39s, 36s, 39s, 40s); rest the remainder
3  DOWNSHIFT (computed) 3:00
Progression: minutes completed on time, then modest density; resistance loads reused, not progressed · primary duty cycle 0.64
Est. ~24 min · conditioning time 16.0 min
```

### M8 Low Energy + Stressed + Bored
```
Circuit · 60 min · intermediate · low_energy, stressed, bored · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V +0 E +0 Nov +2/-1 Eng +2 Extras 0 · pair bored+stressed
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · circuit, 4 rounds, 1:30 between rounds   [RPE 7-8, a few words]  ~19.4 min
   A1 Stationary Bike 1:00 · RPE 8
   A2 Kickstand Dumbbell RDL 8/side · moderate, crisp hips (RPE <= 8)
   A3 Plate-Loaded High Row 12 · moderate load, unbroken, well short of failure
   A4 Weighted Plank 0:40 · moderate load, unbroken, well short of failure
3  COMPLEMENTARY · continuous 10:00   [RPE 5-6, full sentences]  ~10.0 min
   Row Erg · one steady rhythm, no programmed recovery
4  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.77
Est. ~42 min · conditioning time 29.4 min
```

### T1 Target core
```
Circuit · 60 min · intermediate · Normal · Explicit: core · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · EMOM 20 min (4 stations x 5)   [RPE 7-8, a few words]  ~20.0 min
   Min 1 Farmer Carry 40 m · heavy, steady
   Min 2 Dead Bug 6/side · steady, clean reps
   Min 3 Cable Wood Chop 6/side · moderate load, unbroken, well short of failure
   Min 4 Goblet Squat 13 · moderate load, unbroken, well short of failure
   Expected work per minute <= 40 s (40s, 36s, 36s, 39s); rest the remainder
3  COMPLEMENTARY · intervals 10 x 0:30 / 0:30 easy   [RPE 7-8, a few words]  ~9.5 min
   SkiErg
4  DOWNSHIFT (computed) 5:00
Progression: minutes completed on time, then modest density; resistance loads reused, not progressed · primary duty cycle 0.63
Est. ~42 min · conditioning time 29.5 min
  log target_routed_circuit: ['core']
  log relaxation_a: primary: adjacency relaxed (no valid order)
```

### T2 Target biceps (secondary coverage)
```
Circuit · 30 min · intermediate · Normal · Explicit: biceps · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 4:00
2  PRIMARY CIRCUIT · intervals (timed rotation) 40/20, 4 rounds, 1:00 between rounds   [RPE 7-8, a few words]  ~19.0 min
   1 Battle Rope Waves · RPE 8
   2 Single-Arm Dumbbell Row · moderate load, unbroken, well short of failure
   3 Push-Up · steady, clean reps
   4 Front Plank · steady, clean reps
3  DOWNSHIFT (computed) 3:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 0.77
Est. ~27 min · conditioning time 19.0 min
  log target_routed_circuit: ['biceps']
```

### T3 Target calves
```
Circuit · 30 min · intermediate · Normal · Explicit: calves · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 4:00
2  PRIMARY CIRCUIT · circuit, 4 rounds, 1:00 between rounds   [RPE 7-8, a few words]  ~17.9 min
   A1 Treadmill Run 1:00 · RPE 8, strong and controlled
   A2 Kettlebell Deadlift 12 · moderate, crisp hips (RPE <= 8)
   A3 Box Step-Up (Glute Bias) 8/side · moderate load, unbroken, well short of failure
   A4 Farmer Carry 40 m · heavy, steady
3  DOWNSHIFT (computed) 3:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.83
Est. ~26 min · conditioning time 17.9 min
  log target_routed_circuit: ['calves']
```

### T4 Target chest + quads
```
Circuit · 60 min · intermediate · Normal · Explicit: chest, quads · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · intervals (timed rotation) 40/20, 5 rounds, 1:00 between rounds   [RPE 7-8, a few words]  ~24.0 min
   1 Burpee · RPE 8, quick and clean
   2 Box Step-Up (Glute Bias) · moderate load, unbroken, well short of failure
   3 Push-Up · steady, clean reps
   4 Bear Crawl · RPE 8, quick and clean
3  COMPLEMENTARY · intervals 10 x 0:30 / 0:30 easy   [RPE 7-8, a few words]  ~9.5 min
   Air Bike
4  DOWNSHIFT (computed) 5:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 0.76
Est. ~46 min · conditioning time 33.5 min
  log target_routed_circuit: ['chest', 'quads']
  log duration_backfill: primary +1 unit
```

### T5 Target full_body
```
Circuit · 60 min · intermediate · Normal · Full body · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · circuit, 5 rounds, 1:30 between rounds   [RPE 7-8, a few words]  ~21.2 min
   A1 Air Bike 12 cal · RPE 8
   A2 Kettlebell Deadlift 12 · moderate, crisp hips (RPE <= 8)
   A3 Push-Up 10 · steady, clean reps
   A4 Farmer Carry 40 m · heavy, steady
3  COMPLEMENTARY · EMOM 10 min (2 stations x 5)   [RPE 6-7, short phrases]  ~10.0 min
   Min 1 Row Erg 150 m · RPE 7
   Min 2 Box Step-Up (Glute Bias) 6/side · moderate load, unbroken, well short of failure
   Expected work per minute <= 40 s (36s, 36s); rest the remainder
4  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.72
Est. ~44 min · conditioning time 31.2 min
```

### T6 Target quads, sore quads (S2a override)
```
Circuit · 60 min · intermediate · Normal · Explicit: quads · sweat_commercial_default
Sore: quads
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · circuit, 5 rounds, 1:30 between rounds   [RPE 7-8, a few words]  ~24.7 min
   A1 Treadmill Run 1:00 · RPE 8, strong and controlled
   A2 Reverse Lunge 8/side · moderate load, unbroken, well short of failure
   A3 Kettlebell Deadlift 12 · moderate, crisp hips (RPE <= 8)
   A4 Bear Crawl 20 m · RPE 8, quick and clean
3  COMPLEMENTARY · intervals 10 x 0:30 / 0:30 easy   [RPE 7-8, a few words]  ~9.5 min
   Row Erg
4  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.76
Est. ~47 min · conditioning time 34.2 min
  log sore_override_by_explicit_target: ['quads']
  log target_routed_circuit: ['quads']
  log duration_backfill: primary +1 unit
```

### T7 Target chest, sore shoulders (S2b substitution)
```
Circuit · 60 min · intermediate · Normal · Explicit: chest · sweat_commercial_default
Sore: shoulders
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · EMOM 20 min (4 stations x 5)   [RPE 7-8, a few words]  ~20.0 min
   Min 1 Air Bike 11 cal · RPE 8
   Min 2 Dumbbell Floor Press 13 · moderate load, unbroken, well short of failure
   Min 3 Assisted Pull-Up Machine 13 · moderate load, unbroken, well short of failure
   Min 4 Dead Bug 6/side · steady, clean reps
   Expected work per minute <= 40 s (38s, 39s, 39s, 36s); rest the remainder
3  COMPLEMENTARY · intervals 10 x 0:30 / 0:30 easy   [RPE 7-8, a few words]  ~9.5 min
   Row Erg
4  DOWNSHIFT (computed) 5:00
Progression: minutes completed on time, then modest density; resistance loads reused, not progressed · primary duty cycle 0.64
Est. ~42 min · conditioning time 29.5 min
  log sore_exclusion: ['front_delts', 'rear_delts', 'shoulders', 'side_delts']
  log target_routed_circuit: ['chest']
```

### T8 Target beginner lower
```
Circuit · 30 min · beginner · Normal · Explicit: glutes · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 4:00
2  PRIMARY CIRCUIT · circuit, 4 rounds, 1:00 between rounds   [RPE 7-8, a few words]  ~14.0 min
   A1 Sled Push 20 m · heavy, steady
   A2 Cable Pull-Through 10 · moderate, crisp hips (RPE <= 8)
   A3 Goblet Squat 10 · moderate load, unbroken, well short of failure
   A4 Front Plank 0:30 · steady, clean reps
3  COMPLEMENTARY · intervals 6 x 0:30 / 0:30 easy   [RPE 7-8, a few words]  ~5.5 min
   Air Bike
4  DOWNSHIFT (computed) 3:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.79
Est. ~28 min · conditioning time 19.5 min
  log target_routed_circuit: ['glutes']
```

### S1 Sore chest+shoulders+triceps, pick
```
Circuit · 60 min · intermediate · Normal · MOOD's Pick · sweat_commercial_default
Sore: chest, shoulders, triceps
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · circuit, 5 rounds, 1:30 between rounds   [RPE 7-8, a few words]  ~21.2 min
   A1 Sled Push 20 m · heavy, steady
   A2 Kettlebell Deadlift 12 · moderate, crisp hips (RPE <= 8)
   A3 Chin-Up 8 · steady, clean reps
   A4 Dead Bug 8/side · steady, clean reps
3  COMPLEMENTARY · EMOM 10 min (2 stations x 5)   [RPE 6-7, short phrases]  ~10.0 min
   Min 1 Row Erg 150 m · RPE 7
   Min 2 Reverse Lunge 6/side · moderate load, unbroken, well short of failure
   Expected work per minute <= 40 s (36s, 36s); rest the remainder
4  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.72
Est. ~44 min · conditioning time 31.2 min
  log sore_exclusion: ['chest', 'front_delts', 'rear_delts', 'shoulders', 'side_delts', 'triceps']
```

### S2 Sore back, pick
```
Circuit · 60 min · intermediate · Normal · MOOD's Pick · sweat_commercial_default
Sore: back
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · intervals (timed rotation) 40/20, 4 rounds, 1:00 between rounds   [RPE 7-8, a few words]  ~19.0 min
   1 Sled Push · heavy, steady
   2 Kickstand Dumbbell RDL · moderate, crisp hips (RPE <= 8)
   3 Push-Up · steady, clean reps
   4 Dead Bug · steady, clean reps
3  COMPLEMENTARY · EMOM 10 min (2 stations x 5)   [RPE 6-7, short phrases]  ~10.0 min
   Min 1 Burpee 8 · RPE 7, quick and clean
   Min 2 Incline Dumbbell Press 13 · moderate load, unbroken, well short of failure
   Expected work per minute <= 40 s (40s, 39s); rest the remainder
4  DOWNSHIFT (computed) 5:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 0.77
Est. ~42 min · conditioning time 29.0 min
  log sore_exclusion: ['back', 'spinal_erectors']
```

### S3 Sore legs, Hybrid forced (dependent -> terminal)
```
Hybrid · 60 min · intermediate · Normal · MOOD's Pick · sweat_commercial_default
Sore: quads, hamstrings, glutes
Outcome: VALID TERMINAL CONFLICT
  log dials_resolved: {'V': 0, 'E': 0, 'NE': 0, 'NS': 0, 'C': 0, 'G': 0, 'X': 0, 'cap': 3, 'pair': None}
  log sore_exclusion: ['glutes', 'hamstrings', 'quads']
  log sore_terminal_conflict: sweat_hybrid: hybrid: no lower station
```

### S4 Sore legs + back + shoulders, pick
```
Circuit · 60 min · intermediate · Normal · MOOD's Pick · sweat_commercial_default
Sore: quads, hamstrings, glutes, back, shoulders
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · intervals (timed rotation) 40/20, 4 rounds, 1:00 between rounds   [RPE 7-8, a few words]  ~19.0 min
   1 Suitcase Carry · heavy, steady
   2 Dumbbell Floor Press · moderate load, unbroken, well short of failure
   3 Dead Bug · steady, clean reps
   4 Diamond Push-Up · steady, clean reps
3  COMPLEMENTARY · EMOM 10 min (2 stations x 5)   [RPE 6-7, short phrases]  ~10.0 min
   Min 1 Jump Rope 0:40 · RPE 7, quick and clean
   Min 2 Bench Dip 13 · moderate load, unbroken, well short of failure
   Expected work per minute <= 40 s (40s, 39s); rest the remainder
4  DOWNSHIFT (computed) 5:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 0.77
Est. ~42 min · conditioning time 29.0 min
  log sore_exclusion: ['back', 'front_delts', 'glutes', 'hamstrings', 'quads', 'rear_delts', 'shoulders', 'side_delts', 'spinal_erectors']
  log region_balance_relaxed_sore: primary
```

### S5 Sore legs, explicit upper Target
```
Circuit · 60 min · intermediate · Normal · Explicit: back, biceps · sweat_commercial_default
Sore: quads, hamstrings, glutes
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · circuit, 5 rounds, 1:30 between rounds   [RPE 7-8, a few words]  ~20.6 min
   A1 Sled Rope Pull 20 m · heavy, steady
   A2 Push-Up 10 · steady, clean reps
   A3 Bent-Over Dumbbell Row (Two-Arm) 12 · moderate load, unbroken, well short of failure
   A4 Battle Rope Waves 0:30 · RPE 8
3  COMPLEMENTARY · intervals 10 x 0:30 / 0:30 easy   [RPE 7-8, a few words]  ~9.5 min
   SkiErg
4  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.71
Est. ~43 min · conditioning time 30.1 min
  log sore_exclusion: ['glutes', 'hamstrings', 'quads']
  log target_routed_circuit: ['back', 'biceps', 'spinal_erectors']
```

### S6 Sore legs + back, explicit lower Target (named muscles override)
```
Circuit · 60 min · intermediate · Normal · Explicit: quads, glutes, hamstrings · sweat_commercial_default
Sore: quads, hamstrings, glutes, back
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · circuit, 4 rounds, 1:30 between rounds   [RPE 7-8, a few words]  ~20.2 min
   A1 Treadmill Run 1:00 · RPE 8, strong and controlled
   A2 Reverse Lunge 8/side · moderate load, unbroken, well short of failure
   A3 Kickstand Dumbbell RDL 8/side · moderate, crisp hips (RPE <= 8)
   A4 Bear Crawl 20 m · RPE 8, quick and clean
3  COMPLEMENTARY · intervals 10 x 0:30 / 0:30 easy   [RPE 7-8, a few words]  ~9.5 min
   Stationary Bike
4  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.78
Est. ~43 min · conditioning time 29.7 min
  log sore_override_by_explicit_target: ['glutes', 'hamstrings', 'quads']
  log sore_exclusion: ['back', 'spinal_erectors']
  log target_routed_circuit: ['glutes', 'hamstrings', 'quads']
```

