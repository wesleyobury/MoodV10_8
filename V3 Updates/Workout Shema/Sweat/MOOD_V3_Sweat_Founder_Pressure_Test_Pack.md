# MOOD V3 Sweat: Founder Pressure-Test Pack (28 workouts) · generator v3 (founder revision)

Qualitative human review only. Every workout below is the unedited output of the Sweat reference generator v3 (founder revision). Objective rule checks are the validator; the four review flags are left blank for the founder.

Density = SC3 active-work share of the primary block (threshold 0.60). "Conditioning driver" is what drives the cardiovascular demand of the primary block.

## Index

| # | Archetype | Engine mode | Est. min | Density | Primary structure | Violations |
|---|---|---|---|---|---|---|
| E1 | Engine | steady | 45 | 1.00 | continuous | 0 |
| E2 | Engine | interval | 47 | 1.00 | intervals | 0 |
| E3 | Engine | interval | 23 | 1.00 | intervals | 0 |
| E4 | Engine | steady | 45 | 1.00 | continuous | 0 |
| E5 | Engine | interval | 27 | 1.00 | pyramid | 0 |
| C1 | Circuit | - | 45 | 0.83 | intervals | 0 |
| C2 | Circuit | - | 42 | 0.88 | intervals | 0 |
| C3 | Circuit | - | 44 | 0.83 | circuit | 0 |
| C4 | Circuit | - | 55 | 0.83 | intervals | 0 |
| C5 | Circuit | - | 50 | 0.83 | circuit | 0 |
| C6 | Circuit | - | 45 | 0.83 | intervals | 0 |
| C7 | Circuit | - | 44 | 0.86 | circuit | 0 |
| C8 | Circuit | - | 43 | 0.65 | emom | 0 |
| H1 | Hybrid | - | 44 | 0.87 | circuit | 0 |
| H2 | Hybrid | - | 44 | 0.86 | circuit | 0 |
| H3 | Hybrid | - | 43 | 0.86 | circuit | 0 |
| H4 | Hybrid | - | 54 | 0.85 | circuit | 0 |
| H5 | Hybrid | - | 49 | 0.85 | circuit | 0 |
| H6 | Hybrid | - | 27 | 0.88 | circuit | 0 |
| X1 | Circuit | - | 43 | 0.65 | emom | 0 |
| X2 | Circuit | - | 42 | 0.88 | intervals | 0 |
| X3 | Circuit | - | 26 | 0.88 | circuit | 0 |
| X4 | Circuit | - | 28 | 0.83 | circuit | 0 |
| X5 | Circuit | - | 43 | 0.62 | emom | 0 |
| A1 | Circuit | - | 44 | 0.86 | circuit | 0 |
| A2 | Circuit | - | 45 | 0.91 | intervals | 0 |
| A3 | Circuit | - | 46 | 0.65 | intervals | 0 |
| A4 | Circuit | - | 24 | 0.77 | intervals | 0 |

## E1 · Engine · 60 min Normal, steady (last Engine session was intervals)

**Inputs:** `{"force_archetype": "sweat_engine", "duration": 60, "experience": "intermediate"}`

**History:** Prior: Circuit, then Engine intervals (Row Erg long-even)

**Resolved archetype:** Engine · **Engine mode:** steady (aerobic) · **Outcome:** VALID BUILD

**Estimated duration:** ~45 min · **Conditioning time:** 30.7 min · **Active-work density (primary):** 1.00 · **Conditioning driver:** Engine modality: Incline Treadmill Walk

```
Engine · 60 min · intermediate · Normal · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0 · engine_mode steady (aerobic)
1  WARM-UP (computed) 7:00
2  PRIMARY ENGINE · continuous 22:00   [RPE 5-6, full sentences]  ~22.0 min
   Incline Treadmill Walk · one steady rhythm, no programmed recovery
3  COMPLEMENTARY · intervals 9 x 0:40 / 0:20 easy   [RPE 7-8, a few words]  ~8.7 min
   SkiErg
4  DOWNSHIFT (computed) 5:00
Progression: duration / pace at the same RPE; resistance loads reused, not progressed · primary duty cycle 1.00
Est. ~45 min · conditioning time 30.7 min
  log engine_mode_selected: steady (aerobic, rotate_vs_last_engine)
```

**Adaptation:** No State: baseline dials. Engine mode steady / aerobic (rotate vs last engine).

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## E2 · Engine · 60 min Normal, interval (last Engine session was steady)

**Inputs:** `{"force_archetype": "sweat_engine", "duration": 60, "experience": "intermediate"}`

**History:** Prior: Circuit, then Engine steady (Stationary Bike)

**Resolved archetype:** Engine · **Engine mode:** interval (long_even) · **Outcome:** VALID BUILD

**Estimated duration:** ~47 min · **Conditioning time:** 32.7 min · **Active-work density (primary):** 1.00 · **Conditioning driver:** Engine modality: Row Erg

```
Engine · 60 min · intermediate · Normal · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0 · engine_mode interval (long_even)
1  WARM-UP (computed) 7:00
2  PRIMARY ENGINE · intervals 5 x 4:00 / 1:00 easy   [RPE 7-8, a few words]  ~24.0 min
   Row Erg
3  COMPLEMENTARY · intervals 9 x 0:40 / 0:20 easy   [RPE 7-8, a few words]  ~8.7 min
   SkiErg
4  DOWNSHIFT (computed) 5:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 1.00
Est. ~47 min · conditioning time 32.7 min
  log engine_mode_selected: interval (long_even, rotate_vs_last_engine)
  log duration_backfill: primary +1 unit
```

**Adaptation:** No State: baseline dials. Engine mode interval / long_even (rotate vs last engine).

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## E3 · Engine · 30 min Beginner

**Inputs:** `{"force_archetype": "sweat_engine", "duration": 30, "experience": "beginner", "goal": "stay_consistent"}`

**Resolved archetype:** Engine · **Engine mode:** interval (controlled) · **Outcome:** VALID BUILD

**Estimated duration:** ~23 min · **Conditioning time:** 15.0 min · **Active-work density (primary):** 1.00 · **Conditioning driver:** Engine modality: Assault Bike

```
Engine · 30 min · beginner · Normal · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0 · engine_mode interval (controlled)
1  WARM-UP (computed) 4:00
2  PRIMARY ENGINE · intervals 8 x 1:00 / 1:00 easy   [RPE 7, short phrases]  ~15.0 min
   Assault Bike
3  DOWNSHIFT (computed) 3:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 1.00
Est. ~23 min · conditioning time 15.0 min
  log engine_mode_selected: interval (controlled, goal_default)
```

**Adaptation:** No State: baseline dials. Engine mode interval / controlled (goal default).

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## E4 · Engine · 60 min Stressed

**Inputs:** `{"force_archetype": "sweat_engine", "duration": 60, "experience": "intermediate", "states": ["stressed"]}`

**History:** Prior: Circuit

**Resolved archetype:** Engine · **Engine mode:** steady (aerobic) · **Outcome:** VALID BUILD

**Estimated duration:** ~45 min · **Conditioning time:** 31.0 min · **Active-work density (primary):** 1.00 · **Conditioning driver:** Engine modality: Row Erg

```
Engine · 60 min · intermediate · stressed · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V +0 E +0 Nov -1/-1 Eng +2 Extras 0 · engine_mode steady (aerobic)
1  WARM-UP (computed) 7:00
2  PRIMARY ENGINE · continuous 22:00   [RPE 5-6, full sentences]  ~22.0 min
   Row Erg · one steady rhythm, no programmed recovery
3  COMPLEMENTARY · circuit, 3 rounds, 0:45 between rounds   [RPE 6-7, short phrases]  ~9.0 min
   B1 Dumbbell Squat-to-Press 15 · light-moderate load, unbroken, short of failure
   B2 TRX Row 15 · steady, clean reps
   B3 Suitcase Carry 30 m · heavy, steady
4  DOWNSHIFT (computed) 5:00
Progression: duration / pace at the same RPE; resistance loads reused, not progressed · primary duty cycle 1.00
Est. ~45 min · conditioning time 31.0 min
  log engine_mode_selected: steady (aerobic, state_preference)
```

**Adaptation:** States stressed: Novelty exercise -1 / structure -1; complexity cap 2; Engagement +2. Engine mode steady / aerobic (state preference).

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## E5 · Engine · 30 min Bored

**Inputs:** `{"force_archetype": "sweat_engine", "duration": 30, "experience": "intermediate", "states": ["bored"]}`

**History:** Prior: Engine intervals (Row Erg), then Engine steady (Stationary Bike)

**Resolved archetype:** Engine · **Engine mode:** interval (pyramid) · **Outcome:** VALID BUILD

**Estimated duration:** ~27 min · **Conditioning time:** 17.7 min · **Active-work density (primary):** 1.00 · **Conditioning driver:** Engine modality: SkiErg

```
Engine · 30 min · intermediate · bored · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +2/+2 Eng +1 Extras 0 · engine_mode interval (pyramid)
1  WARM-UP (computed) 4:00
2  PRIMARY ENGINE · pyramid 1:00-2:00-3:00-2:00-1:00 with 0:45 easy between   [RPE 7-8, a few words]  ~12.0 min
   SkiErg
3  COMPLEMENTARY · intervals 6 x 0:40 / 0:20 easy   [RPE 7-8, a few words]  ~5.7 min
   Jump Rope
4  DOWNSHIFT (computed) 3:00
Progression: output held across steps; resistance loads reused, not progressed · primary duty cycle 1.00
Est. ~27 min · conditioning time 17.7 min
  log engine_mode_selected: interval (pyramid, rotate_vs_last_engine)
```

**Adaptation:** States bored: Novelty exercise +2 / structure +2; complexity cap 3; Engagement +1. Engine mode interval / pyramid (rotate vs last engine).

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## C1 · Circuit · Normal, 60

**Inputs:** `{"force_archetype": "sweat_circuit", "duration": 60, "experience": "intermediate"}`

**Resolved archetype:** Circuit · **Outcome:** VALID BUILD

**Estimated duration:** ~45 min · **Conditioning time:** 32.0 min · **Active-work density (primary):** 0.83 · **Conditioning driver:** Engine / output station(s): Wall Ball, Dumbbell Lateral-Raise Jacks

```
Circuit · 60 min · intermediate · Normal · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · intervals (timed rotation) 40/20, 5 rounds, 0:30 between rounds   [RPE 7-8, a few words]  ~22.0 min
   1 Wall Ball · RPE 8
   2 Kettlebell Snatch · moderate, crisp hips (RPE <= 8)
   3 Push-Up · steady, clean reps
   4 Dumbbell Lateral-Raise Jacks · RPE 8, quick and clean
3  COMPLEMENTARY · EMOM 10 min (2 stations x 5)   [RPE 6-7, short phrases]  ~10.0 min
   Min 1 Sled Push 20 m · heavy, steady
   Min 2 Kettlebell Swing 15 · moderate, crisp hips (RPE <= 8)
   Expected work per minute <= 40 s (30s, 37s); rest the remainder
4  DOWNSHIFT (computed) 5:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 0.83
Est. ~45 min · conditioning time 32.0 min
```

**Adaptation:** No State: baseline dials.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## C2 · Circuit · Low Energy, 60

**Inputs:** `{"force_archetype": "sweat_circuit", "duration": 60, "experience": "intermediate", "states": ["low_energy"]}`

**Resolved archetype:** Circuit · **Outcome:** VALID BUILD

**Estimated duration:** ~42 min · **Conditioning time:** 29.5 min · **Active-work density (primary):** 0.88 · **Conditioning driver:** Engine / output station(s): Stationary Bike, Suitcase Carry

```
Circuit · 60 min · intermediate · low_energy · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V -1 E +0 Nov -1/-1 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · intervals (timed rotation) 30/15, 6 rounds, 0:30 between rounds   [RPE 7-8, a few words]  ~20.5 min
   1 Stationary Bike · RPE 8
   2 Glute Bridge · steady, clean reps
   3 Chest-Supported Dumbbell Row · light-moderate load, unbroken, short of failure
   4 Suitcase Carry · heavy, steady
3  COMPLEMENTARY · continuous 9:00   [RPE 5-6, full sentences]  ~9.0 min
   Row Erg · one steady rhythm, no programmed recovery
4  DOWNSHIFT (computed) 5:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 0.88
Est. ~42 min · conditioning time 29.5 min
  log duration_backfill: primary +1 unit
  log state_volume: -1 unit complementary_block
```

**Adaptation:** States low_energy: Volume -1; Novelty exercise -1 / structure -1; complexity cap 2. Volume dial: -1 unit complementary_block.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## C3 · Circuit · Stressed, 60

**Inputs:** `{"force_archetype": "sweat_circuit", "duration": 60, "experience": "intermediate", "states": ["stressed"]}`

**Resolved archetype:** Circuit · **Outcome:** VALID BUILD

**Estimated duration:** ~44 min · **Conditioning time:** 31.2 min · **Active-work density (primary):** 0.83 · **Conditioning driver:** Engine / output station(s): Burpee, Jumping Jacks

```
Circuit · 60 min · intermediate · stressed · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V +0 E +0 Nov -1/-1 Eng +2 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · circuit, 6 rounds, 0:45 between rounds   [RPE 7-8, a few words]  ~21.8 min
   A1 Burpee 8 · RPE 8, quick and clean
   A2 Glute Bridge 15 · steady, clean reps
   A3 Push-Up 12 · steady, clean reps
   A4 Jumping Jacks 0:40 · RPE 8, quick and clean
3  COMPLEMENTARY · circuit, 3 rounds, 0:45 between rounds   [RPE 6-7, short phrases]  ~9.5 min
   B1 Goblet Squat 15 · light-moderate load, unbroken, short of failure
   B2 Incline Dumbbell Press 15 · light-moderate load, unbroken, short of failure
   B3 Front Plank 0:40 · steady, clean reps
4  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.83
Est. ~44 min · conditioning time 31.2 min
  log duration_backfill: primary +1 unit
```

**Adaptation:** States stressed: Novelty exercise -1 / structure -1; complexity cap 2; Engagement +2.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## C4 · Circuit · Amped, 60

**Inputs:** `{"force_archetype": "sweat_circuit", "duration": 60, "experience": "intermediate", "states": ["amped"]}`

**Resolved archetype:** Circuit · **Outcome:** VALID BUILD

**Estimated duration:** ~55 min · **Conditioning time:** 41.0 min · **Active-work density (primary):** 0.83 · **Conditioning driver:** Engine / output station(s): Jump Squat, Med-Ball Slam

```
Circuit · 60 min · intermediate · amped · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +1 E +1 Nov +0/+0 Eng +0 Extras 1
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · intervals (timed rotation) 40/20, 6 rounds, 0:30 between rounds   [RPE 8-9, no talking]  ~26.5 min
   1 Jump Squat · RPE 8, quick and clean
   2 Dumbbell Snatch · light-moderate load, unbroken, short of failure
   3 Dumbbell Push Press · light-moderate load, unbroken, short of failure
   4 Med-Ball Slam · RPE 9
3  COMPLEMENTARY · EMOM 10 min (2 stations x 5)   [RPE 7-8, a few words]  ~10.0 min
   Min 1 Skater Hops 10/side · RPE 8, quick and clean
   Min 2 Goblet Squat 13 · light-moderate load, unbroken, short of failure
   Expected work per minute <= 40 s (30s, 39s); rest the remainder
4  FINISHER · finisher 6 x 20s all-out / 30s easy   [RPE 9, no talking]  ~4.5 min
   Wall Ball / Battle Rope Waves (alternate)
5  DOWNSHIFT (computed) 5:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 0.83
Est. ~55 min · conditioning time 41.0 min
  log state_volume: +1 unit primary
  log extra_finisher: wall_ball,battle_rope_waves
```

**Adaptation:** States amped: Volume +1; Effort +1; Extras 1. Volume dial: +1 unit primary. Extras: finisher added.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## C5 · Circuit · Irritated, 60

**Inputs:** `{"force_archetype": "sweat_circuit", "duration": 60, "experience": "intermediate", "states": ["irritated"]}`

**Resolved archetype:** Circuit · **Outcome:** VALID BUILD

**Estimated duration:** ~50 min · **Conditioning time:** 36.4 min · **Active-work density (primary):** 0.83 · **Conditioning driver:** Engine / output station(s): Box Jump, Med-Ball Slam

```
Circuit · 60 min · intermediate · irritated · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V +0 E +1 Nov +0/+0 Eng +1 Extras 1
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · circuit, 6 rounds, 0:45 between rounds   [RPE 8-9, no talking]  ~21.9 min
   A1 Box Jump 10 · RPE 8, quick and clean
   A2 Kettlebell Swing 15 · moderate, crisp hips (RPE <= 8)
   A3 Dumbbell Push Press 15 · light-moderate load, unbroken, short of failure
   A4 Med-Ball Slam 12 · RPE 9
3  COMPLEMENTARY · EMOM 10 min (2 stations x 5)   [RPE 7-8, a few words]  ~10.0 min
   Min 1 Jump Squat 16 · RPE 8, quick and clean
   Min 2 Push-Up 15 · steady, clean reps
   Expected work per minute <= 40 s (40s, 37s); rest the remainder
4  FINISHER · finisher 6 x 20s all-out / 30s easy   [RPE 9, no talking]  ~4.5 min
   Battle Rope Waves / Sled Push (alternate)
5  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.83
Est. ~50 min · conditioning time 36.4 min
  log duration_backfill: primary +1 unit
  log extra_finisher: battle_rope_waves,sled_push
```

**Adaptation:** States irritated: Effort +1; complexity cap 2; Engagement +1; Extras 1. Extras: finisher added.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## C6 · Circuit · Explicit upper-body Target (chest, back, shoulders), 60

**Inputs:** `{"duration": 60, "experience": "intermediate", "target": ["chest", "back", "shoulders"]}`

**Resolved archetype:** Circuit · **Outcome:** VALID BUILD

**Estimated duration:** ~45 min · **Conditioning time:** 31.7 min · **Active-work density (primary):** 0.83 · **Conditioning driver:** Engine / output station(s): SkiErg, Battle Rope Waves

```
Circuit · 60 min · intermediate · Normal · Explicit: chest, back, shoulders · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · intervals (timed rotation) 40/20, 5 rounds, 0:30 between rounds   [RPE 7-8, a few words]  ~22.0 min
   1 SkiErg · RPE 8
   2 Push-Up · steady, clean reps
   3 Bent-Over Dumbbell Row (Two-Arm) · light-moderate load, unbroken, short of failure
   4 Battle Rope Waves · RPE 8
3  COMPLEMENTARY · intervals 10 x 0:40 / 0:20 easy   [RPE 7-8, a few words]  ~9.7 min
   Assault Bike
4  DOWNSHIFT (computed) 5:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 0.83
Est. ~45 min · conditioning time 31.7 min
  log target_routed_circuit: ['back', 'chest', 'front_delts', 'rear_delts', 'shoulders', 'side_delts', 'spinal_erectors']
```

**Adaptation:** No State: baseline dials. Explicit Target routed to Circuit; resistance items biased to the Target region.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## C7 · Circuit · Explicit lower-body Target (quads, hamstrings, glutes), 60

**Inputs:** `{"duration": 60, "experience": "intermediate", "target": ["quads", "hamstrings", "glutes"]}`

**Resolved archetype:** Circuit · **Outcome:** VALID BUILD

**Estimated duration:** ~44 min · **Conditioning time:** 30.9 min · **Active-work density (primary):** 0.86 · **Conditioning driver:** Engine / output station(s): Box Jump, Front-Rack Carry

```
Circuit · 60 min · intermediate · Normal · Explicit: quads, hamstrings, glutes · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · circuit, 5 rounds, 0:45 between rounds   [RPE 7-8, a few words]  ~21.2 min
   A1 Box Jump 10 · RPE 8, quick and clean
   A2 Reverse Lunge 10/side · light-moderate load, unbroken, short of failure
   A3 Kettlebell Deadlift 15 · moderate, crisp hips (RPE <= 8)
   A4 Front-Rack Carry 40 m · moderate-heavy, stay tall
3  COMPLEMENTARY · intervals 10 x 0:40 / 0:20 easy   [RPE 7-8, a few words]  ~9.7 min
   Assault Bike
4  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.86
Est. ~44 min · conditioning time 30.9 min
  log target_routed_circuit: ['glutes', 'hamstrings', 'quads']
```

**Adaptation:** No State: baseline dials. Explicit Target routed to Circuit; resistance items biased to the Target region.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## C8 · Circuit · Equipment-limited (dumbbells, kettlebell, bench, box, rope, balls, bar), 60

**Inputs:** `{"force_archetype": "sweat_circuit", "duration": 60, "experience": "intermediate", "preset": "free_weight_limited"}`

**Resolved archetype:** Circuit · **Outcome:** VALID BUILD

**Estimated duration:** ~43 min · **Conditioning time:** 30.0 min · **Active-work density (primary):** 0.65 · **Conditioning driver:** Engine / output station(s): Wall Ball, Dumbbell Lateral-Raise Jacks

```
Circuit · 60 min · intermediate · Normal · MOOD's Pick · free_weight_limited
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · EMOM 20 min (4 stations x 5)   [RPE 7-8, a few words]  ~20.0 min
   Min 1 Wall Ball 13 · RPE 8
   Min 2 Devil Press 8 · light-moderate load, unbroken, short of failure
   Min 3 Push-Up 15 · steady, clean reps
   Min 4 Dumbbell Lateral-Raise Jacks 0:40 · RPE 8, quick and clean
   Expected work per minute <= 40 s (39s, 40s, 37s, 40s); rest the remainder
3  COMPLEMENTARY · EMOM 10 min (2 stations x 5)   [RPE 6-7, short phrases]  ~10.0 min
   Min 1 Burpee 8 · RPE 7, quick and clean
   Min 2 Dumbbell Push Press 15 · light-moderate load, unbroken, short of failure
   Expected work per minute <= 40 s (40s, 37s); rest the remainder
4  DOWNSHIFT (computed) 5:00
Progression: minutes completed on time, then modest density; resistance loads reused, not progressed · primary duty cycle 0.65
Est. ~43 min · conditioning time 30.0 min
```

**Adaptation:** No State: baseline dials.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## H1 · Hybrid · Normal commercial gym (no sled declared), 60

**Inputs:** `{"force_archetype": "sweat_hybrid", "duration": 60, "experience": "intermediate", "preset": "commercial_no_sled"}`

**History:** Prior: Circuit

**Resolved archetype:** Hybrid · **Outcome:** VALID BUILD

**Estimated duration:** ~44 min · **Conditioning time:** 30.3 min · **Active-work density (primary):** 0.87 · **Conditioning driver:** Anchor every round: Treadmill Run

```
Hybrid · 60 min · intermediate · Normal · MOOD's Pick · commercial_no_sled
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 7:00
2  PRIMARY HYBRID · anchor circuit, 5 rounds, 0:45 walk between   [RPE 7, short phrases]  ~22.6 min
   Every round: Treadmill Run 500 m · race pace RPE 7
     R1 Burpee 10 · RPE 7, quick and clean
     R2 Overhead Carry 40 m · moderate load, arms locked out
     R3 Wall Ball 20 · RPE 7
     R4 Reverse Lunge 10/side · light-moderate load, unbroken, short of failure
     R5 Box Jump 12 · RPE 7, quick and clean
3  COMPLEMENTARY · circuit, 3 rounds, 0:30 between rounds   [RPE 6-7, short phrases]  ~7.7 min
   B1 Diamond Push-Up 12 · steady, clean reps
   B2 Jumping Jacks 0:40 · RPE 7, quick and clean
   B3 Captain's Chair Knee Raise 10 · steady, clean reps
4  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.87
Est. ~44 min · conditioning time 30.3 min
  log duration_backfill: primary +1 unit
```

**Adaptation:** No State: baseline dials.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## H2 · Hybrid · HYROX-style (Performance goal, sled + turf default), 60

**Inputs:** `{"duration": 60, "experience": "intermediate", "goal": "build_strength"}`

**Resolved archetype:** Hybrid · **Outcome:** VALID BUILD

**Estimated duration:** ~44 min · **Conditioning time:** 30.1 min · **Active-work density (primary):** 0.86 · **Conditioning driver:** Anchor every round: Treadmill Run

```
Hybrid · 60 min · intermediate · Normal · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 7:00
2  PRIMARY HYBRID · anchor circuit, 5 rounds, 0:45 walk between   [RPE 7, short phrases]  ~21.9 min
   Every round: Treadmill Run 500 m · race pace RPE 7
     R1 Sled Push 20 m · heavy, steady
     R2 Overhead Carry 40 m · moderate load, arms locked out
     R3 Goblet Squat 15 · light-moderate load, unbroken, short of failure
     R4 Burpee 10 · RPE 7, quick and clean
     R5 Skater Hops 12/side · RPE 7, quick and clean
3  COMPLEMENTARY · circuit, 3 rounds, 0:30 between rounds   [RPE 6-7, short phrases]  ~8.2 min
   B1 Push-Up 12 · steady, clean reps
   B2 Wall Ball 15 · RPE 7
   B3 Front Plank 0:40 · steady, clean reps
4  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.86
Est. ~44 min · conditioning time 30.1 min
  log duration_backfill: primary +1 unit
```

**Adaptation:** No State: baseline dials.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## H3 · Hybrid · No sled, 60 (same user one Hybrid later)

**Inputs:** `{"force_archetype": "sweat_hybrid", "duration": 60, "experience": "intermediate", "preset": "commercial_no_sled"}`

**History:** Prior: Hybrid (treadmill + sled push / carry / wall ball / burpee), then Circuit

**Resolved archetype:** Hybrid · **Outcome:** VALID BUILD

**Estimated duration:** ~43 min · **Conditioning time:** 29.2 min · **Active-work density (primary):** 0.86 · **Conditioning driver:** Anchor every round: Row Erg

```
Hybrid · 60 min · intermediate · Normal · MOOD's Pick · commercial_no_sled
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 7:00
2  PRIMARY HYBRID · anchor circuit, 5 rounds, 0:45 walk between   [RPE 7, short phrases]  ~20.7 min
   Every round: Row Erg 600 m · race pace RPE 7
     R1 Landmine Squat-to-Press 15 · light-moderate load, unbroken, short of failure
     R2 Lateral Step-Up 10/side · light-moderate load, unbroken, short of failure
     R3 Kickstand Dumbbell RDL 10/side · moderate, crisp hips (RPE <= 8)
     R4 Air Squat 20 · steady, clean reps
     R5 Plate Push 20 m · moderate plate, fast feet
3  COMPLEMENTARY · circuit, 3 rounds, 0:30 between rounds   [RPE 6-7, short phrases]  ~8.5 min
   B1 Single-Arm Dumbbell Row 10/side · light-moderate load, unbroken, short of failure
   B2 Jump Squat 12 · RPE 7, quick and clean
   B3 Captain's Chair Knee Raise 10 · steady, clean reps
4  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.86
Est. ~43 min · conditioning time 29.2 min
  log duration_backfill: primary +1 unit
```

**Adaptation:** No State: baseline dials.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## H4 · Hybrid · Amped, 60

**Inputs:** `{"force_archetype": "sweat_hybrid", "duration": 60, "experience": "advanced", "states": ["amped"]}`

**Resolved archetype:** Hybrid · **Outcome:** VALID BUILD

**Estimated duration:** ~54 min · **Conditioning time:** 39.0 min · **Active-work density (primary):** 0.85 · **Conditioning driver:** Anchor every round: Row Erg

```
Hybrid · 60 min · advanced · amped · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +1 E +1 Nov +0/+0 Eng +0 Extras 1
1  WARM-UP (computed) 7:00
2  PRIMARY HYBRID · anchor circuit, 6 rounds, 0:45 walk between   [RPE 8, a few words]  ~25.7 min
   Every round: Row Erg 700 m · race pace RPE 8
     R1 Kettlebell Snatch 12/side · moderate, crisp hips (RPE <= 8)
     R2 Med-Ball Slam 15 · RPE 8
     R3 Skater Hops 12/side · RPE 8, quick and clean
     R4 Devil Press 10 · light-moderate load, unbroken, short of failure
     R5 Box Jump 12 · RPE 8, quick and clean
     R6 Kettlebell Snatch 12/side · moderate, crisp hips (RPE <= 8)
3  COMPLEMENTARY · circuit, 3 rounds, 0:30 between rounds   [RPE 7-8, a few words]  ~8.9 min
   B1 Dumbbell Push Press 15 · light-moderate load, unbroken, short of failure
   B2 Jump Squat 12 · RPE 8, quick and clean
   B3 Dead Bug 10/side · steady, clean reps
4  FINISHER · finisher 6 x 20s all-out / 30s easy   [RPE 9, no talking]  ~4.5 min
   SkiErg / Battle Rope Waves (alternate)
5  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.85
Est. ~54 min · conditioning time 39.0 min
  log duration_backfill: primary +1 unit
  log state_volume: +1 unit primary
  log extra_finisher: ski_erg,battle_rope_waves
```

**Adaptation:** States amped: Volume +1; Effort +1; Extras 1. Volume dial: +1 unit primary. Extras: finisher added.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## H5 · Hybrid · Irritated, 60

**Inputs:** `{"force_archetype": "sweat_hybrid", "duration": 60, "experience": "intermediate", "states": ["irritated"]}`

**Resolved archetype:** Hybrid · **Outcome:** VALID BUILD

**Estimated duration:** ~49 min · **Conditioning time:** 33.9 min · **Active-work density (primary):** 0.85 · **Conditioning driver:** Anchor every round: Row Erg

```
Hybrid · 60 min · intermediate · irritated · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V +0 E +1 Nov +0/+0 Eng +1 Extras 1
1  WARM-UP (computed) 7:00
2  PRIMARY HYBRID · anchor circuit, 5 rounds, 0:45 walk between   [RPE 8, a few words]  ~20.0 min
   Every round: Row Erg 600 m · race pace RPE 8
     R1 Box Jump 12 · RPE 8, quick and clean
     R2 Med-Ball Slam 15 · RPE 8
     R3 Kettlebell Swing 20 · moderate, crisp hips (RPE <= 8)
     R4 Jump Squat 15 · RPE 8, quick and clean
     R5 Sled Push 20 m · heavy, steady
3  COMPLEMENTARY · circuit, 3 rounds, 0:30 between rounds   [RPE 7-8, a few words]  ~9.4 min
   B1 Dumbbell Push Press 15 · light-moderate load, unbroken, short of failure
   B2 Burpee 8 · RPE 8, quick and clean
   B3 Dead Bug 10/side · steady, clean reps
4  FINISHER · finisher 6 x 20s all-out / 30s easy   [RPE 9, no talking]  ~4.5 min
   Battle Rope Waves / Wall Ball (alternate)
5  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.85
Est. ~49 min · conditioning time 33.9 min
  log duration_backfill: primary +1 unit
  log extra_finisher: battle_rope_waves,wall_ball
```

**Adaptation:** States irritated: Effort +1; complexity cap 2; Engagement +1; Extras 1. Extras: finisher added.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## H6 · Hybrid · 30 min

**Inputs:** `{"force_archetype": "sweat_hybrid", "duration": 30, "experience": "intermediate"}`

**Resolved archetype:** Hybrid · **Outcome:** VALID BUILD

**Estimated duration:** ~27 min · **Conditioning time:** 18.2 min · **Active-work density (primary):** 0.88 · **Conditioning driver:** Anchor every round: Treadmill Run

```
Hybrid · 30 min · intermediate · Normal · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 5:00
2  PRIMARY HYBRID · anchor circuit, 4 rounds, 0:45 walk between   [RPE 7, short phrases]  ~18.2 min
   Every round: Treadmill Run 400 m · race pace RPE 7
     Sled Push 20 m · heavy, steady
     Overhead Carry 40 m · moderate load, arms locked out
3  DOWNSHIFT (computed) 3:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.88
Est. ~27 min · conditioning time 18.2 min
  log duration_trim: complement removed at 30
  log duration_backfill: primary +1 unit (I3 floor)
```

**Adaptation:** No State: baseline dials.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## X1 · Edge · Substantial soreness (quads, hamstrings, glutes, back), MOOD's Pick, 60

**Inputs:** `{"duration": 60, "experience": "intermediate", "sore": ["quads", "hamstrings", "glutes", "back"]}`

**Resolved archetype:** Circuit · **Outcome:** VALID BUILD

**Estimated duration:** ~43 min · **Conditioning time:** 30.0 min · **Active-work density (primary):** 0.65 · **Conditioning driver:** Engine / output station(s): Suitcase Carry, Battle Rope Waves

```
Circuit · 60 min · intermediate · Normal · MOOD's Pick · sweat_commercial_default
Sore: quads, hamstrings, glutes, back
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · EMOM 20 min (4 stations x 5)   [RPE 7-8, a few words]  ~20.0 min
   Min 1 Suitcase Carry 40 m · heavy, steady
   Min 2 Push-Up 15 · steady, clean reps
   Min 3 Diamond Push-Up 14 · steady, clean reps
   Min 4 Battle Rope Waves 0:40 · RPE 8
   Expected work per minute <= 40 s (40s, 37s, 39s, 40s); rest the remainder
3  COMPLEMENTARY · EMOM 10 min (2 stations x 5)   [RPE 6-7, short phrases]  ~10.0 min
   Min 1 Jump Rope 0:40 · RPE 7, quick and clean
   Min 2 Incline Dumbbell Press 13 · light-moderate load, unbroken, short of failure
   Expected work per minute <= 40 s (40s, 39s); rest the remainder
4  DOWNSHIFT (computed) 5:00
Progression: minutes completed on time, then modest density; resistance loads reused, not progressed · primary duty cycle 0.65
Est. ~43 min · conditioning time 30.0 min
  log sore_exclusion: ['back', 'glutes', 'hamstrings', 'quads', 'spinal_erectors']
  log region_balance_relaxed_sore: primary
```

**Adaptation:** No State: baseline dials. Sore-primary exclusion: back, glutes, hamstrings, quads, spinal_erectors. Region balance relaxed because a region is sore.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## X2 · Edge · Multi-State: Low Energy + Irritated + Bored, 60

**Inputs:** `{"duration": 60, "experience": "intermediate", "states": ["low_energy", "irritated", "bored"]}`

**Resolved archetype:** Circuit · **Outcome:** VALID BUILD

**Estimated duration:** ~42 min · **Conditioning time:** 29.5 min · **Active-work density (primary):** 0.88 · **Conditioning driver:** Engine / output station(s): Med-Ball Slam, Battle Rope Waves

```
Circuit · 60 min · intermediate · low_energy, irritated, bored · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V -1 E +1 Nov +1/+1 Eng +2 Extras 0 · pair irritated+low_energy
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · intervals (timed rotation) 30/15, 6 rounds, 0:30 between rounds   [RPE 8-9, no talking]  ~20.5 min
   1 Med-Ball Slam · RPE 9
   2 Kickstand Dumbbell RDL · moderate, crisp hips (RPE <= 8)
   3 Dumbbell Floor Press · light-moderate load, unbroken, short of failure
   4 Battle Rope Waves · RPE 9
3  COMPLEMENTARY · continuous 9:00   [RPE 6-7, short phrases]  ~9.0 min
   Row Erg · one steady rhythm, no programmed recovery
4  DOWNSHIFT (computed) 5:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 0.88
Est. ~42 min · conditioning time 29.5 min
  log duration_backfill: primary +1 unit
  log state_volume: -1 unit complementary_block
```

**Adaptation:** States low_energy, irritated, bored: Volume -1; Effort +1; Novelty exercise +1 / structure +1; complexity cap 2; Engagement +2 (named pair irritated+low_energy). Volume dial: -1 unit complementary_block.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## X3 · Edge · Narrow muscle Target: calves only, 30

**Inputs:** `{"duration": 30, "experience": "intermediate", "target": ["calves"]}`

**Resolved archetype:** Circuit · **Outcome:** VALID BUILD

**Estimated duration:** ~26 min · **Conditioning time:** 18.3 min · **Active-work density (primary):** 0.88 · **Conditioning driver:** Engine / output station(s): Treadmill Run, Jumping Jacks

```
Circuit · 30 min · intermediate · Normal · Explicit: calves · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 4:00
2  PRIMARY CIRCUIT · circuit, 4 rounds, 0:45 between rounds   [RPE 7-8, a few words]  ~18.3 min
   A1 Treadmill Run 1:00 · RPE 8, strong and controlled
   A2 Dumbbell Snatch 10/side · light-moderate load, unbroken, short of failure
   A3 Dumbbell Romanian Deadlift 15 · moderate, crisp hips (RPE <= 8)
   A4 Jumping Jacks 0:40 · RPE 8, quick and clean
3  DOWNSHIFT (computed) 3:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.88
Est. ~26 min · conditioning time 18.3 min
  log target_routed_circuit: ['calves']
```

**Adaptation:** No State: baseline dials. Explicit Target routed to Circuit; resistance items biased to the Target region.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## X4 · Edge · Beginner + limited equipment (DB, bench, jump rope, bodyweight), 30

**Inputs:** `{"duration": 30, "experience": "beginner", "preset": "db_bodyweight_only", "goal": "stay_consistent"}`

**Resolved archetype:** Circuit · **Outcome:** VALID BUILD

**Estimated duration:** ~28 min · **Conditioning time:** 18.6 min · **Active-work density (primary):** 0.83 · **Conditioning driver:** Engine / output station(s): Burpee, Skater Hops

```
Circuit · 30 min · beginner · Normal · MOOD's Pick · db_bodyweight_only
Outcome: VALID BUILD
Resolved: cap 2 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 4:00
2  PRIMARY CIRCUIT · circuit, 4 rounds, 0:45 between rounds   [RPE 7-8, a few words]  ~13.1 min
   A1 Burpee 6 · RPE 8, quick and clean
   A2 Kickstand Dumbbell RDL 8/side · moderate, crisp hips (RPE <= 8)
   A3 Push-Up 8 · steady, clean reps
   A4 Skater Hops 8/side · RPE 8, quick and clean
3  COMPLEMENTARY · intervals 6 x 0:30 / 0:30 easy   [RPE 7-8, a few words]  ~5.5 min
   Jump Rope
4  DOWNSHIFT (computed) 3:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.83
Est. ~28 min · conditioning time 18.6 min
```

**Adaptation:** No State: baseline dials.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## X5 · Edge · History-heavy user (6 prior Sweat sessions), MOOD's Pick, 60

**Inputs:** `{"duration": 60, "experience": "intermediate"}`

**History (oldest → newest):** circuit: wall_ball, kettlebell_swing, push_up, db_jumping_jack · engine (interval): treadmill_run, goblet_squat, landmine_press_single_arm, dead_bug · hybrid: ski_erg, sled_push, waiter_carry, burpee · circuit: air_bike, db_snatch, suspension_row, db_jumping_jack · engine (steady): row_erg, ski_erg · hybrid: treadmill_run, wall_ball, goblet_squat, front_foot_elevated_split_squat

**Resolved archetype:** Circuit · **Outcome:** VALID BUILD

**Estimated duration:** ~43 min · **Conditioning time:** 30.0 min · **Active-work density (primary):** 0.62 · **Conditioning driver:** Engine / output station(s): Sled Push, Dumbbell Lateral-Raise Jacks

```
Circuit · 60 min · intermediate · Normal · MOOD's Pick · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · EMOM 20 min (4 stations x 5)   [RPE 7-8, a few words]  ~20.0 min
   Min 1 Sled Push 20 m · heavy, steady
   Min 2 Devil Press 8 · light-moderate load, unbroken, short of failure
   Min 3 Incline Dumbbell Press 13 · light-moderate load, unbroken, short of failure
   Min 4 Dumbbell Lateral-Raise Jacks 0:40 · RPE 8, quick and clean
   Expected work per minute <= 40 s (30s, 40s, 39s, 40s); rest the remainder
3  COMPLEMENTARY · EMOM 10 min (2 stations x 5)   [RPE 6-7, short phrases]  ~10.0 min
   Min 1 Burpee 8 · RPE 7, quick and clean
   Min 2 Seated Dumbbell Shoulder Press 13 · light-moderate load, unbroken, short of failure
   Expected work per minute <= 40 s (40s, 39s); rest the remainder
4  DOWNSHIFT (computed) 5:00
Progression: minutes completed on time, then modest density; resistance loads reused, not progressed · primary duty cycle 0.62
Est. ~43 min · conditioning time 30.0 min
```

**Adaptation:** No State: baseline dials.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## A1 · Adversarial · Explicit chest + back Target, Stressed (predictable, familiar), 60

**Inputs:** `{"duration": 60, "experience": "intermediate", "target": ["chest", "back"], "states": ["stressed"]}`

**Resolved archetype:** Circuit · **Outcome:** VALID BUILD

**Estimated duration:** ~44 min · **Conditioning time:** 30.8 min · **Active-work density (primary):** 0.86 · **Conditioning driver:** Engine / output station(s): SkiErg, Burpee

```
Circuit · 60 min · intermediate · stressed · Explicit: chest, back · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V +0 E +0 Nov -1/-1 Eng +2 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · circuit, 5 rounds, 0:45 between rounds   [RPE 7-8, a few words]  ~21.1 min
   A1 SkiErg 250 m · RPE 8
   A2 Push-Up 12 · steady, clean reps
   A3 Bent-Over Dumbbell Row (Two-Arm) 15 · light-moderate load, unbroken, short of failure
   A4 Burpee 8 · RPE 8, quick and clean
3  COMPLEMENTARY · intervals 10 x 0:40 / 0:20 easy   [RPE 7-8, a few words]  ~9.7 min
   Row Erg
4  DOWNSHIFT (computed) 5:00
Progression: rounds completed / round time; resistance loads reused, not progressed · primary duty cycle 0.86
Est. ~44 min · conditioning time 30.8 min
  log target_routed_circuit: ['back', 'chest', 'spinal_erectors']
```

**Adaptation:** States stressed: Novelty exercise -1 / structure -1; complexity cap 2; Engagement +2. Explicit Target routed to Circuit; resistance items biased to the Target region.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## A2 · Adversarial · Lower-body Target (glutes, hamstrings), advanced, many resistance options, 60

**Inputs:** `{"duration": 60, "experience": "advanced", "target": ["glutes", "hamstrings"]}`

**Resolved archetype:** Circuit · **Outcome:** VALID BUILD

**Estimated duration:** ~45 min · **Conditioning time:** 31.7 min · **Active-work density (primary):** 0.91 · **Conditioning driver:** Engine / output station(s): Box Jump, Jumping Jacks

```
Circuit · 60 min · advanced · Normal · Explicit: glutes, hamstrings · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 3 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · intervals (timed rotation) 45/15, 5 rounds, 0:30 between rounds   [RPE 7-8, a few words]  ~22.0 min
   1 Box Jump · RPE 8, quick and clean
   2 Kettlebell Deadlift · moderate, crisp hips (RPE <= 8)
   3 Devil Press · light-moderate load, unbroken, short of failure
   4 Jumping Jacks · RPE 8, quick and clean
3  COMPLEMENTARY · intervals 10 x 0:40 / 0:20 easy   [RPE 7-8, a few words]  ~9.7 min
   Assault Bike
4  DOWNSHIFT (computed) 5:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 0.91
Est. ~45 min · conditioning time 31.7 min
  log target_routed_circuit: ['glutes', 'hamstrings']
```

**Adaptation:** No State: baseline dials. Explicit Target routed to Circuit; resistance items biased to the Target region.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## A3 · Adversarial · Machine-rich commercial gym: Beginner + chest/back/shoulders Target (machines unlocked), 60

**Inputs:** `{"duration": 60, "experience": "beginner", "target": ["chest", "back", "shoulders"]}`

**Resolved archetype:** Circuit · **Outcome:** VALID BUILD

**Estimated duration:** ~46 min · **Conditioning time:** 32.5 min · **Active-work density (primary):** 0.65 · **Conditioning driver:** Engine / output station(s): SkiErg, Battle Rope Waves

```
Circuit · 60 min · beginner · Normal · Explicit: chest, back, shoulders · sweat_commercial_default
Outcome: VALID BUILD
Resolved: cap 2 · V +0 E +0 Nov +0/+0 Eng +0 Extras 0
1  WARM-UP (computed) 6:00
2  PRIMARY CIRCUIT · intervals (timed rotation) 30/30, 5 rounds, 0:45 between rounds   [RPE 7-8, a few words]  ~23.0 min
   1 SkiErg · RPE 8
   2 Push-Up · steady, clean reps
   3 Bent-Over Dumbbell Row (Two-Arm) · light-moderate load, unbroken, short of failure
   4 Battle Rope Waves · RPE 8
3  COMPLEMENTARY · intervals 10 x 0:30 / 0:30 easy   [RPE 7-8, a few words]  ~9.5 min
   Assault Bike
4  DOWNSHIFT (computed) 5:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 0.65
Est. ~46 min · conditioning time 32.5 min
  log target_routed_circuit: ['back', 'chest', 'front_delts', 'rear_delts', 'shoulders', 'side_delts', 'spinal_erectors']
```

**Adaptation:** No State: baseline dials. Explicit Target routed to Circuit; resistance items biased to the Target region.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## A4 · Adversarial · Engine/output-suppressing combo: Low Energy + Stressed + sore quads/calves/core, DB + bench only, 30

**Inputs:** `{"duration": 30, "experience": "intermediate", "states": ["low_energy", "stressed"], "sore": ["quads", "calves", "core"], "preset": "db_bench_only"}`

**Resolved archetype:** Circuit · **Outcome:** VALID BUILD

**Estimated duration:** ~24 min · **Conditioning time:** 15.5 min · **Active-work density (primary):** 0.77 · **Conditioning driver:** Resistance-only timed rotation (SC4 fallback)

```
Circuit · 30 min · intermediate · low_energy, stressed · MOOD's Pick · db_bench_only
Sore: quads, calves, core
Outcome: VALID BUILD
Resolved: cap 1 · V -1 E +0 Nov -2/-2 Eng +2 Extras 0
1  WARM-UP (computed) 4:00
2  PRIMARY CIRCUIT · intervals (timed rotation) 30/15, 8 rounds, 0:30 between rounds   [RPE 7-8, a few words]  ~15.5 min
   1 Dumbbell Romanian Deadlift · moderate, crisp hips (RPE <= 8)
   2 Dumbbell Push Press · light-moderate load, unbroken, short of failure
3  DOWNSHIFT (computed) 3:00
Progression: interval output (meters, calories, pace) and completion; resistance loads reused, not progressed · primary duty cycle 0.77
Est. ~24 min · conditioning time 15.5 min
  log sore_exclusion: ['calves', 'core', 'quads']
  log complexity_relaxed_state_cap: db_rdl
  log complexity_relaxed_state_cap: db_push_press
  log conditioning_driver_resistance_only: ['db_rdl', 'db_push_press', 'bench_dip', 'glute_bridge']
  log stressed_resistance_only_couplet: ['db_rdl', 'db_push_press']
  log state_volume: -1 unit primary_circuit
```

**Adaptation:** States low_energy, stressed: Volume -1; Novelty exercise -2 / structure -2; complexity cap 1; Engagement +2. Sore-primary exclusion: calves, core, quads. State-lowered complexity cap relaxed to experience baseline for db_rdl (logged). State-lowered complexity cap relaxed to experience baseline for db_push_press (logged). No engine/output item feasible: resistance-only timed rotation (SC4). Volume dial: -1 unit primary_circuit.

**Objective rule violations (validator):** none

**Founder review flags**

- [ ] SWEAT IDENTITY: clear / questionable
- [ ] STATE EXPRESSION: clear / weak
- [ ] GYM PRACTICALITY: good / questionable
- [ ] ATHLETIC OVERLAP: none / possible

---

## Recurring patterns across the 28 workouts

Objective result: all 28 are VALID BUILD with **0 validator violations**. Primary-block active-work density ranges from 0.62 to 1.00. Sessions run 42-55 min at 60 and 23-28 min at 30.

What changed in this revision (v3, founder feedback), and how it shows up here:

1. **Less rest, more cardio feel.**
   - Circuit round rest is now 45 s (intermediate), 60 s (beginner) and 30 s (advanced), down from 90 / 60.
   - Timed stations run 40 s on / 20 s move with 30 s between rounds, down from 60.
   - Hybrid walks are 45 s between rounds, down from 60.
   - Engine long intervals are 4:00 / 1:00, down from 4:00 / 1:30.
   - Finishers run 20 s / 30 s, and engine add-ons run 40 s / 20 s.
   - Beginners keep recovery at or above work (safety rule), so their rests are longer.
2. **No machines or cables in any circuit.** 0 of 28 workouts use a lat pulldown, cable or selectorized/plate-loaded machine. Cardio machines (rower, SkiErg, Assault Bike, treadmill) remain as conditioning stations.
3. **Low Energy now reads as cardio (C2, X2).**
   - Both run as timed stations, 30 s on / 15 s move, on a continuous clock, followed by a steady row.
   - X2 is slam, kickstand RDL, DB floor press and battle ropes.
   - C2 still includes glute bridge and chest-supported DB row, the two most lifting-like Low Energy stations left.
4. **Full-body movements show up widely.** DB push press (6), box jump (6), devil press (4), skater hops (4), jumping jacks (4), DB lateral-raise jacks (3), KB swing (3), KB or DB snatch (4). Figures are workouts out of 28.
5. **Carries now vary.** Overhead carry (H1, H2, H6), suitcase carry (E4, C2, X1) and front-rack carry (C7) appear. Farmer carry and single-arm overhead carry did not come up in this cold-start pack; across real sessions, recency rotates the carry family.
6. **Irritated vs Amped still overlap, but less.** C4 (Amped) and C5 (Irritated) now share 2 of 4 primary items (DB push press, med-ball slam), down from 4 of 4. H4 and H5 share 2 of 5 stations (med-ball slam, box jump), down from 5 of 5. Both States still pull from the same forceful / explosive pool, so this remains a founder call.
7. **Remaining lifting-like moments.** C3 (Stressed) complement: goblet squat, incline DB press, plank. A4, the deliberately suppressed edge case: DB RDL + DB push press only. X1 (sore legs and back) leans on pressing.
8. **Athletic territory.** Box jumps, skater hops, jump squats and snatches are always dosed as repeated conditioning work (10+ reps or timed, inside rounds). No low-rep maximal-intent sets appear anywhere. H4 (Amped Hybrid) is the most athletic-leaning session in the pack.
9. **Cold-start staples.** Push-up (10) is now the most frequent item, followed by row erg, burpee and battle ropes. With history, recency moves the selection away from these.

No systemic safety or gym-practicality violation was found.
