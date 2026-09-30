# MOOD V3 Sweat Rebuild: Founder Review Pack

Every session came through the production path (`service.generate_workout`, `swap_workout`, `swap_exercise`) with the rebuilt Sweat engine. Same user and date seed reproduces the same session. Each case shows six layers: Context, Workout (with total engine dose, loaded and bodyweight reps, impact contacts, active and elapsed time, anchor share), Built for Today (the exact consumer text), Why this fits today (trainer reasoning from the same strategy synthesis, plus the engine notes), Realized personalization (the contract: every input, what it intended, what it actually changed) and Workload budget (the level limits and whether the finished session sits inside them). B15 carries the frozen v4 Hybrid on identical inputs beside the rebuilt one.

## A. No State, 60 minutes (base sessions must stand on their own)

### A1 Engine · intermediate · conditioning goal

Context: State(s): none · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_engine · soreness: none · equipment: commercial_gym · seed `a1|2026-10-11`

**Engine** · shape **long_intervals** · est. 38.5 min (shown as 35–40 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Engine] intervals · 4 rounds · 4 x 240s work / 90s recovery · RPE 7–8 · ~20.5 min
   Hard intervals on the same machine; easy pace between.
   - Air Bike / Assault Bike: 4 × 4 min / 1:30 easy (RPE 8)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: 960 s Air Bike (16.0 min, 4 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 16.0 min, recovery 4.5 min, transitions 0.0 min, elapsed 38.5 min (duty 0.78). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 1, transitions 0.

BUILT FOR TODAY (consumer text):
- Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- This session is complete at about 38 min. Quality over filler.
- Intermediate dosing: 4 min work with 1:30 easy between intervals.
- 4 rounds of 240 s work / 90 s easy on Air Bike / Assault Bike.
- One main block, about 38 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.

WHY THIS FITS TODAY (trainer reasoning):
- [goal] duty cycle 78%: the session keeps moving; long intervals shape (conditioning goal weights it up)
- [archetype] Engine (your choice)
- [structure] long intervals: 4 × 240 s / 90 s easy

REALIZED PERSONALIZATION (contract):
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 78%: the session keeps moving; long intervals shape (conditioning goal weights it up)
- archetype = sweat_engine → intended: conditioning_type_for_today → realized: Engine (your choice)
- structure = long_intervals → intended: conditioning_structure_and_dose → realized: long intervals: 4 × 240 s / 90 s easy
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 38.5 min for a 60-minute window (16.0 active, 4.5 recovery, 0.0 transitions); main block stimulus: sufficient (score 20.8 vs 18.0 / 27.0); warm-up +3 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 20.8 vs sufficient 18.0 / substantial 27.0; main block 16.0 active min at RPE 7–8, 0 loaded reps, 16.0 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
Engine trace: fill: warm-up +3 min (movement preparation) | fill: downshift +3 min | elapsed 38.5 min accepted (window [48, 60], main block sufficient)

### A2 Circuit · intermediate · build muscle

Context: State(s): none · level: intermediate · goal: build muscle · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `a2|2026-10-11`

**Circuit** · shape **rounds** · est. 44.2 min (shown as 40–45 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] circuit · 6 rounds · 60 s between rounds · RPE 7–8 · ~26.2 min
   6 rounds, moving station to station; rest 60 s after each round.
   - Wall Ball: 15 (RPE 8)
   - Kettlebell Swing: 15 (moderate, crisp hips (RPE <= 8))
   - Push-Up: 12 (steady, clean reps)
   - Sled Push: 20 m (heavy, steady)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 180, bodyweight reps 72, impact contacts 0. Active 15.2 min, recovery 5.0 min, transitions 6.0 min, elapsed 44.2 min (duty 0.75). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 4, transitions 24.

BUILT FOR TODAY (consumer text):
- Your muscle goal is why the resistance stations run at moderate reps, but this stays conditioning first.
- Intermediate dosing: station targets and 60 s between rounds are set for your level.
- 6 rounds of 4 stations: Wall Ball, Kettlebell Swing, Push-Up and Sled Push.
- The main block is the whole workout: nothing is added after it. About 44 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to build muscle; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [goal] resistance stations for muscular endurance: Kettlebell Swing, Push-Up
- [archetype] Circuit (your choice)
- [structure] circuit rounds: 6 rounds × 4 stations, 60 s between rounds
- Budget repair: impact_item_swapped db_jumping_jack → sled_push

REALIZED PERSONALIZATION (contract):
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = build_muscle → intended: muscular_endurance_stations → realized: resistance stations for muscular endurance: Kettlebell Swing, Push-Up
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = rounds → intended: conditioning_structure_and_dose → realized: circuit rounds: 6 rounds × 4 stations, 60 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 44.2 min for a 60-minute window (15.2 active, 5.0 recovery, 6.0 transitions); main block stimulus: substantial (score 28.5 vs 18.0 / 27.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: substantial (score 28.5 vs sufficient 18.0 / substantial 27.0; main block 15.2 active min at RPE 7–8, 180 loaded reps, 0.0 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
Engine trace: budget_repair: impact_item_swapped db_jumping_jack→sled_push | fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | elapsed 44.2 min accepted (window [48, 60], main block substantial)

### A3 Hybrid · intermediate · improve athleticism

Context: State(s): none · level: intermediate · goal: improve athleticism · 60 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym · seed `a3|2026-10-11`

**Hybrid** · shape **anchor_couplet** · est. 48.9 min (shown as 45–50 min)
```
WARM-UP / PREP 8 min: 8 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Hybrid] anchor_circuit · 6 rounds · 60 s between rounds · RPE 7–8 · ~35.9 min
   First 1 min: set your Row Erg pace and load every station, then start round 1. Every round: Row Erg, then every station. Walk 60 s between rounds.
   - Row Erg: 450 m (RPE 8) [anchor]
   - Sled Push: 20 m (heavy, steady)
   - Farmer Carry: 60 m (heavy, steady)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 2700 m Row Erg (13.0 min, 6 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 23.9 min, recovery 5.0 min, transitions 7.0 min, elapsed 48.9 min (duty 0.83). Anchor share 42%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 3, transitions 28.

BUILT FOR TODAY (consumer text):
- Your athleticism goal is why the output tools (Sled Push and Farmer Carry) are in here.
- Intermediate dosing: the anchor distance, station targets and 60 s between rounds are set for your level.
- Row Erg 450 m anchors all 6 rounds, followed by 2 stations every round.
- The main block is the whole workout: nothing is added after it. About 49 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to improve athleticism; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [goal] power and output tools: Sled Push, Farmer Carry
- [archetype] Hybrid (your choice)
- [structure] anchor + couplet: 6 rounds: Row Erg 450 m + 2 stations, 60 s between rounds

REALIZED PERSONALIZATION (contract):
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = improve_athleticism → intended: powerful_output_sleds_carries_intervals → realized: power and output tools: Sled Push, Farmer Carry
- archetype = sweat_hybrid → intended: conditioning_type_for_today → realized: Hybrid (your choice)
- structure = anchor_couplet → intended: conditioning_structure_and_dose → realized: anchor + couplet: 6 rounds: Row Erg 450 m + 2 stations, 60 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 48.9 min for a 60-minute window (23.9 active, 5.0 recovery, 7.0 transitions); main block stimulus: substantial (score 32.5 vs 18.0 / 27.0); 1 min technique and setup before round 1; warm-up +1 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: substantial (score 32.5 vs sufficient 18.0 / substantial 27.0; main block 23.9 active min at RPE 7–8, 0 loaded reps, 13.0 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
Engine trace: fill: 1 min technique and setup before round 1 | fill: warm-up +1 min

### A4 Engine · advanced · feel better

Context: State(s): none · level: advanced · goal: feel better / reduce stress · 60 min · archetype: sweat_engine · soreness: none · equipment: commercial_gym · seed `a4|2026-10-11`

**Engine** · shape **long_intervals** · est. 42.5 min (shown as 40–45 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Engine] intervals · 4 rounds · 4 x 300s work / 90s recovery · RPE 7–8 · ~24.5 min
   Hard intervals on the same machine; easy pace between.
   - Air Bike / Assault Bike: 4 × 5 min / 1:30 easy (RPE 8)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: 1200 s Air Bike (20.0 min, 4 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 20.0 min, recovery 4.5 min, transitions 0.0 min, elapsed 42.5 min (duty 0.82). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 1, transitions 0.

BUILT FOR TODAY (consumer text):
- You're advanced, so the session carries more output: long intervals with the main block to RPE 8. Your feel-better goal keeps the work rhythmic and sustainable.
- Advanced dosing: 5 min work with 1:30 easy between intervals.
- 4 rounds of 300 s work / 90 s easy on Air Bike / Assault Bike.
- One main block, about 42 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to feel better and manage stress; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [experience] main block to RPE 8; duty cycle 82% (dense); 20.0 min of engine work
- [goal] long intervals shape: rhythmic, sustainable; nothing above RPE 8
- [archetype] Engine (your choice)
- [structure] long intervals: 4 × 300 s / 90 s easy

REALIZED PERSONALIZATION (contract):
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 8; duty cycle 82% (dense); 20.0 min of engine work
- goal = feel_better_reduce_stress → intended: rhythmic_sustainable_work → realized: long intervals shape: rhythmic, sustainable; nothing above RPE 8
- archetype = sweat_engine → intended: conditioning_type_for_today → realized: Engine (your choice)
- structure = long_intervals → intended: conditioning_structure_and_dose → realized: long intervals: 4 × 300 s / 90 s easy
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 42.5 min for a 60-minute window (20.0 active, 4.5 recovery, 0.0 transitions); main block stimulus: sufficient (score 26.0 vs 21.0 / 32.0); warm-up +3 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 26.0 vs sufficient 21.0 / substantial 32.0; main block 20.0 active min at RPE 7–8, 0 loaded reps, 20.0 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
Engine trace: fill: warm-up +3 min (movement preparation) | fill: downshift +3 min | elapsed 42.5 min accepted (window [48, 60], main block sufficient)

### A5 Circuit · beginner · stay consistent

Context: State(s): none · level: beginner · goal: stay consistent · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `a5|2026-10-11`

**Circuit** · shape **rounds** · est. 40.2 min (shown as about 40 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] circuit · 5 rounds · 75 s between rounds · RPE 7–8 · ~22.2 min
   5 rounds, moving station to station; rest 75 s after each round.
   - Treadmill Run: 1 min (RPE 8, strong and controlled)
   - Glute Bridge: 15 (steady, clean reps)
   - Push-Up: 8 (steady, clean reps)
   - Goblet Squat: 12 (light-moderate load, unbroken, short of failure)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: 300 s Treadmill Run (5.0 min, 5 bouts). Loaded reps 60, bodyweight reps 115, impact contacts 0. Active 12.2 min, recovery 5.0 min, transitions 5.0 min, elapsed 40.2 min (duty 0.71). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 4, transitions 20.

BUILT FOR TODAY (consumer text):
- Since you're newer to conditioning, the effort stays at RPE 8 or below and the structure is one you can follow without watching a clock. A balanced session, which is the point of a consistency goal.
- Beginner dosing: station targets and 75 s between rounds are set for your level.
- 5 rounds of 4 stations: Treadmill Run, Glute Bridge, Push-Up and Goblet Squat.
- One main block, about 40 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to stay consistent; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [experience] RPE capped at 8; no high-impact movement; 3 stations in the main block; predictable structure (no EMOM / ladder / pyramid)
- [goal] balanced default shape
- [archetype] Circuit (your choice)
- [structure] circuit rounds: 5 rounds × 4 stations, 75 s between rounds
- Budget repair: impact_item_swapped db_jumping_jack → goblet_squat

REALIZED PERSONALIZATION (contract):
- experience = beginner → intended: match_conditioning_vocabulary_to_level → realized: RPE capped at 8; no high-impact movement; 3 stations in the main block; predictable structure (no EMOM / ladder / pyramid)
- goal = stay_consistent → intended: balanced_default → realized: balanced default shape
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = rounds → intended: conditioning_structure_and_dose → realized: circuit rounds: 5 rounds × 4 stations, 75 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 40.2 min for a 60-minute window (12.2 active, 5.0 recovery, 5.0 transitions); main block stimulus: sufficient (score 19.2 vs 14.0 / 22.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 19.2 vs sufficient 14.0 / substantial 22.0; main block 12.2 active min at RPE 7–8, 60 loaded reps, 5.0 engine min)
WORKLOAD BUDGET: limits (beginner, 60 min): engine ≤ 26 min, engine share ≤ 75%, anchor share ≤ 45%, hard ≤ 30% of active once past 8 min, loaded reps ≤ 200, impact contacts ≤ 50, loaded hinges ≤ 1, stations ≤ 6, all-out blocks ≤ 0. Within budget.
Engine trace: budget_repair: impact_item_swapped db_jumping_jack→goblet_squat | fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | elapsed 40.2 min accepted (window [48, 60], main block sufficient)

### A6 Hybrid · advanced · build strength

Context: State(s): none · level: advanced · goal: build strength · 60 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym · seed `a6|2026-10-11`

**Hybrid** · shape **split_anchor** · est. 49.3 min (shown as 45–50 min)
```
WARM-UP / PREP 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Hybrid] anchor_circuit · 4 rounds · 45 s between rounds · RPE 7–8 · ~37.3 min
   Every round: Row Erg, then every station. Walk 45 s between rounds.
   - Row Erg: 950 m (RPE 8) [anchor]
   - Sled Push: 20 m (heavy, steady)
   - Farmer Carry: 60 m (heavy, steady)
   - Dumbbell Push Press: 16 (light-moderate load, unbroken, short of failure)
   - Med-Ball Slam: 15 (RPE 8)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 3800 m Row Erg (16.2 min, 4 bouts). Loaded reps 124, bodyweight reps 0, impact contacts 0. Active 29.1 min, recovery 2.2 min, transitions 6.0 min, elapsed 49.3 min (duty 0.93). Anchor share 46%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 24.

BUILT FOR TODAY (consumer text):
- You're advanced, so the session carries more output: split anchor with the main block to RPE 8. Your strength goal shows up as loaded work inside the conditioning: Sled Push and Farmer Carry; the session stays Sweat.
- Advanced dosing: the anchor distance, station targets and 45 s between rounds are set for your level.
- Row Erg 950 m anchors all 4 rounds, followed by 4 stations every round.
- The main block is the whole workout: nothing is added after it. About 49 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to build strength; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [experience] main block to RPE 8; duty cycle 93% (dense)
- [goal] loaded carries / sleds inside the conditioning: Sled Push, Farmer Carry; split anchor shape (bigger station blocks)
- [archetype] Hybrid (your choice)
- [structure] split anchor: 4 rounds: Row Erg 950 m + 4 stations, 45 s between rounds

REALIZED PERSONALIZATION (contract):
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 8; duty cycle 93% (dense)
- goal = build_strength → intended: loaded_carries_and_sleds_conditioning_first → realized: loaded carries / sleds inside the conditioning: Sled Push, Farmer Carry; split anchor shape (bigger station blocks)
- archetype = sweat_hybrid → intended: conditioning_type_for_today → realized: Hybrid (your choice)
- structure = split_anchor → intended: conditioning_structure_and_dose → realized: split anchor: 4 rounds: Row Erg 950 m + 4 stations, 45 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 49.3 min for a 60-minute window (29.1 active, 2.2 recovery, 6.0 transitions); main block stimulus: substantial (score 46.2 vs 21.0 / 32.0); primary +1 round
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: substantial (score 46.2 vs sufficient 21.0 / substantial 32.0; main block 29.1 active min at RPE 7–8, 124 loaded reps, 16.2 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
Engine trace: fill: primary +1 round

## B. Single States, 60 minutes (three per State, Sore twice)

### B1 Low Energy · Engine · intermediate

Context: State(s): low_energy · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_engine · soreness: none · equipment: commercial_gym · seed `b1|2026-10-11`

**Engine** · shape **long_intervals** · est. 47.5 min (shown as 45–50 min)
```
WARM-UP / PREP 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Engine] intervals · 5 rounds · 5 x 240s work / 90s recovery · RPE 6–7 · ~26.0 min
   Hard intervals on the same machine; easy pace between.
   - Stationary Bike: 5 × 4 min / 1:30 easy (RPE 7)
OPTIONAL COMPLEMENT [Complement] continuous · RPE 5–6 · ~8.0 min
   One steady rhythm, no programmed recovery. Purpose: sustainable extra minutes on a second modality (Low Energy).
   - Row Erg: 8 min steady (RPE 5-6)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 1200 s Stationary Bike, 480 s Row Erg (28.0 min, 6 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 28.0 min, recovery 6.0 min, transitions 0.0 min, elapsed 47.5 min (duty 0.82). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 2, transitions 0.

BUILT FOR TODAY (consumer text):
- You're low on energy, so the work stays cyclical and steady on the Stationary Bike: long intervals at RPE 6–7, something you can sustain rather than survive. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: 4 min work with 1:30 easy between intervals.
- 5 rounds of 240 s work / 90 s easy on Stationary Bike.
- Plus a short complement block, about 48 minutes in all.
- Target effort for the main block is RPE 6–7.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=low_energy] block RPE 7–8 → 6–7
- [goal] duty cycle 82%: the session keeps moving; long intervals shape (conditioning goal weights it up)
- [archetype] Engine (your choice)
- [structure] long intervals: 5 × 240 s / 90 s easy; complement: steady (8 min)
- Coherence low_energy: PASS

REALIZED PERSONALIZATION (contract):
- state = low_energy (expression: lighter) → intended: keep_moving_lower_intensity_and_systemic_cost → realized: block RPE 7–8 → 6–7
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 82%: the session keeps moving; long intervals shape (conditioning goal weights it up)
- archetype = sweat_engine → intended: conditioning_type_for_today → realized: Engine (your choice)
- structure = long_intervals → intended: conditioning_structure_and_dose → realized: long intervals: 5 × 240 s / 90 s easy; complement: steady (8 min)
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 47.5 min for a 60-minute window (28.0 active, 6.0 recovery, 0.0 transitions); main block stimulus: sufficient (score 17.0 vs 16.2 / 24.3); primary +1 unit (stimulus below sufficient); primary +1 unit (stimulus below sufficient)
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 17.0 vs sufficient 16.2 / substantial 24.3; main block 20.0 active min at RPE 6–7, 0 loaded reps, 20.0 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
State coherence: low_energy PASS
Engine trace: fill: primary +1 unit (stimulus below sufficient) | fill: primary +1 unit (stimulus below sufficient) | complement kept: sustainable extra minutes on a second modality (Low Energy) (8.0 min) | low_energy: attempt 0 'lighter' realized ['rpe'] → satisfied | elapsed 47.5 min accepted (window [48, 60], main block sufficient)

### B2 Low Energy · Circuit · beginner

Context: State(s): low_energy · level: beginner · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `b2|2026-10-11`

**Circuit** · shape **timed** · est. 55.5 min (shown as about 55 min)
```
WARM-UP / PREP 6 min: 6 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Circuit] timed_circuit · 6 rounds · 6 x 35s work / 35s recovery · 60 s between rounds · RPE 6–7 · ~35.0 min
   35 s work / 35 s rest per station, rotate through all stations; 6 rounds.
   - Stationary Bike: 35 s (RPE 7)
   - Glute Bridge: 35 s (steady, clean reps)
   - Suspension Trainer Row / TRX Row: 35 s (steady, clean reps)
   - Farmer Carry: 35 s (heavy, steady)
OPTIONAL COMPLEMENT [Complement] continuous · RPE 5–6 · ~8.0 min
   One steady rhythm, no programmed recovery. Purpose: main block alone is below a sufficient stimulus.
   - Treadmill Run: 8 min steady (RPE 5-6)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 210 s Stationary Bike, 480 s Treadmill Run (11.5 min, 7 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 22.0 min, recovery 19.0 min, transitions 2.0 min, elapsed 55.5 min (duty 0.54). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 8.

BUILT FOR TODAY (consumer text):
- You're low on energy, so today's circuit stays simple and sustainable: Glute Bridge, Suspension Trainer Row and Farmer Carry at RPE 6–7, with fewer hard peaks. You'll keep moving, but nothing here asks you to empty the tank. As a newer athlete you get a predictable structure, no high-impact work and an effort that leaves something in reserve. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Beginner dosing: 35 s work and 35 s rest per station.
- 6 rounds of 35 s work / 35 s easy on Stationary Bike, Glute Bridge, Suspension Trainer Row / TRX Row and Farmer Carry.
- Plus a short complement block, about 56 minutes in all.
- Target effort for the main block is RPE 6–7.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=low_energy] circuit RPE 7–8 → 6–7; Suspension Trainer Row (vs no-State build); Farmer Carry (vs no-State build)
- [experience] RPE capped at 7; no high-impact movement; 3 stations in the main block; predictable structure (no EMOM / ladder / pyramid)
- [goal] timed circuit shape (conditioning goal weights it up)
- [archetype] Circuit (your choice)
- [structure] timed circuit: 6 rounds × 4 stations at 35 s / 35 s; complement: steady (8 min)
- Coherence low_energy: PASS

REALIZED PERSONALIZATION (contract):
- state = low_energy (expression: lighter) → intended: keep_moving_lower_intensity_and_systemic_cost → realized: circuit RPE 7–8 → 6–7; Suspension Trainer Row (vs no-State build); Farmer Carry (vs no-State build)
- experience = beginner → intended: match_conditioning_vocabulary_to_level → realized: RPE capped at 7; no high-impact movement; 3 stations in the main block; predictable structure (no EMOM / ladder / pyramid)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: timed circuit shape (conditioning goal weights it up)
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = timed → intended: conditioning_structure_and_dose → realized: timed circuit: 6 rounds × 4 stations at 35 s / 35 s; complement: steady (8 min)
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 55.5 min for a 60-minute window (22.0 active, 19.0 recovery, 2.0 transitions); main block stimulus: insufficient (score 11.9 vs 12.6 / 19.8); primary +1 unit (stimulus below sufficient); primary +1 unit (stimulus below sufficient)
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: insufficient (score 11.9 vs sufficient 12.6 / substantial 19.8; main block 14.0 active min at RPE 6–7, 0 loaded reps, 3.5 engine min)
WORKLOAD BUDGET: limits (beginner, 60 min): engine ≤ 26 min, engine share ≤ 75%, anchor share ≤ 45%, hard ≤ 30% of active once past 8 min, loaded reps ≤ 200, impact contacts ≤ 50, loaded hinges ≤ 1, stations ≤ 6, all-out blocks ≤ 0. Within budget.
State coherence: low_energy PASS
Engine trace: fill: primary +1 unit (stimulus below sufficient) | fill: primary +1 unit (stimulus below sufficient) | complement kept: main block alone is below a sufficient stimulus (8.0 min) | low_energy: attempt 0 'lighter' realized ['rpe', 'exercises'] → satisfied

### B3 Low Energy · Hybrid · advanced

Context: State(s): low_energy · level: advanced · goal: lose weight / conditioning · 60 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym · seed `b3|2026-10-11`

**Hybrid** · shape **anchor_couplet** · est. 48.1 min (shown as 45–50 min)
```
WARM-UP / PREP 8 min: 8 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Hybrid] anchor_circuit · 6 rounds · 45 s between rounds · RPE 6–7 · ~35.1 min
   First 3 min: set your Row Erg pace and load every station, then start round 1. Every round: Row Erg, then every station. Walk 45 s between rounds.
   - Row Erg: 500 m (RPE 7) [anchor]
   - Air Squat: 20 (steady, clean reps)
   - Suitcase Carry: 40 m (heavy, steady)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 3000 m Row Erg (13.7 min, 6 bouts). Loaded reps 0, bodyweight reps 120, impact contacts 0. Active 22.3 min, recovery 3.8 min, transitions 9.0 min, elapsed 48.1 min (duty 0.86). Anchor share 44%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 3, transitions 36.

BUILT FOR TODAY (consumer text):
- You're low on energy, so the Row Erg anchor runs at a pace you can repeat and the stations stay simple and stable: Air Squat and Suitcase Carry. Steady output, not peaks. You're advanced, so the session carries more output: anchor + couplet with the main block to RPE 7. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Advanced dosing: the anchor distance, station targets and 45 s between rounds are set for your level.
- Row Erg 500 m anchors all 6 rounds, followed by 2 stations every round.
- One main block, about 48 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 6–7.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=low_energy] block RPE 7–8 → 6–7; anchor + couplet instead of ladder hybrid
- [experience] duty cycle 86% (dense)
- [goal] duty cycle 86%: the session keeps moving; anchor + couplet shape (conditioning goal weights it up)
- [archetype] Hybrid (your choice)
- [structure] anchor + couplet: 6 rounds: Row Erg 500 m + 2 stations, 45 s between rounds
- Coherence low_energy: PASS

REALIZED PERSONALIZATION (contract):
- state = low_energy (expression: low_impact_simple) → intended: keep_moving_lower_intensity_and_systemic_cost → realized: block RPE 7–8 → 6–7; anchor + couplet instead of ladder hybrid
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: duty cycle 86% (dense)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 86%: the session keeps moving; anchor + couplet shape (conditioning goal weights it up)
- archetype = sweat_hybrid → intended: conditioning_type_for_today → realized: Hybrid (your choice)
- structure = anchor_couplet → intended: conditioning_structure_and_dose → realized: anchor + couplet: 6 rounds: Row Erg 500 m + 2 stations, 45 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 48.1 min for a 60-minute window (22.3 active, 3.8 recovery, 9.0 transitions); main block stimulus: sufficient (score 22.9 vs 18.9 / 28.8); 3 min technique and setup before round 1; warm-up +1 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 22.9 vs sufficient 18.9 / substantial 28.8; main block 22.3 active min at RPE 6–7, 0 loaded reps, 13.7 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
State coherence: low_energy PASS
Engine trace: fill: 3 min technique and setup before round 1 | fill: warm-up +1 min | low_energy: attempt 0 'low_impact_simple' realized ['rpe', 'shape'] → satisfied

### B4 Stressed · Engine · beginner

Context: State(s): stressed · level: beginner · goal: lose weight / conditioning · 60 min · archetype: sweat_engine · soreness: none · equipment: commercial_gym · seed `b4|2026-10-11`

**Engine** · shape **continuous** · est. 38.0 min (shown as 35–40 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Engine] continuous · RPE 5–6 · ~20.0 min
   One steady rhythm, no programmed recovery.
   - Row Erg: 20 min steady (RPE 5-6)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: 1200 s Row Erg (20.0 min, 1 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 20.0 min, recovery 0.0 min, transitions 0.0 min, elapsed 38.0 min (duty 1.0). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 1, transitions 0.

BUILT FOR TODAY (consumer text):
- You're stressed, so we're keeping this simple: one Row Erg, continuous you can settle into, and a pace that gives your head something straightforward to hold on to. Since you're newer to conditioning, the effort stays at RPE 6 or below and the structure is one you can follow without watching a clock. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- This session is complete at about 38 min. Quality over filler.
- Beginner difficulty caps the steady effort at 20 minutes.
- 20 min steady on the Row Erg as one continuous effort.
- One main block, about 38 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 5–6.

WHY THIS FITS TODAY (trainer reasoning):
- [state=stressed] one continuous Row Erg effort at RPE 5–6 already matches this State; nothing added, nothing hurried
- [experience] RPE capped at 6; no high-impact movement; 0 stations in the main block; predictable structure (no EMOM / ladder / pyramid)
- [goal] duty cycle 100%: the session keeps moving; continuous shape (conditioning goal weights it up)
- [archetype] Engine (your choice)
- [structure] continuous: 20 min continuous at RPE 5–6
- Coherence stressed: PASS

REALIZED PERSONALIZATION (contract):
- state = stressed (expression: steady_cyclical) → intended: rhythmic_predictable_conditioning → realized: one continuous Row Erg effort at RPE 5–6 already matches this State; nothing added, nothing hurried
- experience = beginner → intended: match_conditioning_vocabulary_to_level → realized: RPE capped at 6; no high-impact movement; 0 stations in the main block; predictable structure (no EMOM / ladder / pyramid)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 100%: the session keeps moving; continuous shape (conditioning goal weights it up)
- archetype = sweat_engine → intended: conditioning_type_for_today → realized: Engine (your choice)
- structure = continuous → intended: conditioning_structure_and_dose → realized: continuous: 20 min continuous at RPE 5–6
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 38.0 min for a 60-minute window (20.0 active, 0.0 recovery, 0.0 transitions); main block stimulus: sufficient (score 18.7 vs 14.0 / 22.0); warm-up +3 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 18.7 vs sufficient 14.0 / substantial 22.0; main block 20.0 active min at RPE 5–6, 0 loaded reps, 20.0 engine min)
WORKLOAD BUDGET: limits (beginner, 60 min): engine ≤ 26 min, engine share ≤ 75%, anchor share ≤ 45%, hard ≤ 30% of active once past 8 min, loaded reps ≤ 200, impact contacts ≤ 50, loaded hinges ≤ 1, stations ≤ 6, all-out blocks ≤ 0. Within budget.
State coherence: stressed PASS
Engine trace: fill: warm-up +3 min (movement preparation) | fill: downshift +3 min | stressed: attempt 0 'steady_cyclical' realized ['aligned'] → satisfied | elapsed 38.0 min accepted (window [48, 60], main block sufficient)

### B5 Stressed · Circuit · intermediate

Context: State(s): stressed · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `b5|2026-10-11`

**Circuit** · shape **rounds** · est. 41.2 min (shown as 40–45 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] circuit · 5 rounds · 60 s between rounds · RPE 7–8 · ~23.2 min
   5 rounds, moving station to station; rest 60 s after each round.
   - Burpee: 8 (RPE 8, quick and clean)
   - Reverse Lunge: 10/side (light-moderate load, unbroken, short of failure)
   - Push-Up: 12 (steady, clean reps)
   - Front Plank: 40 s (steady, clean reps)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 100, bodyweight reps 100, impact contacts 12. Active 14.2 min, recovery 4.0 min, transitions 5.0 min, elapsed 41.2 min (duty 0.78). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 4, transitions 20.

BUILT FOR TODAY (consumer text):
- You're stressed, so the session runs in fixed, repeatable rounds of Burpee, Reverse Lunge, Push-Up and Front Plank at a controlled effort: settle in and just work, no clock to race. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: station targets and 60 s between rounds are set for your level.
- 5 rounds of 4 stations: Burpee, Reverse Lunge, Push-Up and Front Plank.
- One main block, about 41 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=stressed] main block → fixed rounds; circuit rounds instead of EMOM
- [goal] duty cycle 78%: the session keeps moving
- [archetype] Circuit (your choice)
- [structure] circuit rounds: 5 rounds × 4 stations, 60 s between rounds
- Coherence stressed: PASS; before repairs: ['emom structure (changing scheme / countdown feel)']
- Coherence repair stressed: to_fixed_rounds (main block → fixed rounds)

REALIZED PERSONALIZATION (contract):
- state = stressed (expression: controlled_pace) → intended: rhythmic_predictable_conditioning → realized: main block → fixed rounds; circuit rounds instead of EMOM
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 78%: the session keeps moving
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = rounds → intended: conditioning_structure_and_dose → realized: circuit rounds: 5 rounds × 4 stations, 60 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 41.2 min for a 60-minute window (14.2 active, 4.0 recovery, 5.0 transitions); main block stimulus: sufficient (score 24.1 vs 18.0 / 27.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 24.1 vs sufficient 18.0 / substantial 27.0; main block 14.2 active min at RPE 7–8, 100 loaded reps, 0.0 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
State coherence: stressed PASS
Engine trace: fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | stressed: attempt 0 'controlled_pace' realized ['rpe'] → satisfied | coherence repair (stressed): main block → fixed rounds | fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | elapsed 41.2 min accepted (window [48, 60], main block sufficient)

### B6 Stressed · Hybrid · intermediate

Context: State(s): stressed · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym · seed `b6|2026-10-11`

**Hybrid** · shape **split_anchor** · est. 48.8 min (shown as 45–50 min)
```
WARM-UP / PREP 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Hybrid] anchor_circuit · 5 rounds · 60 s between rounds · RPE 7–7 · ~36.8 min
   First 1 min: set your Row Erg pace and load every station, then start round 1. Every round: Row Erg, then every station. Walk 60 s between rounds.
   - Row Erg: 600 m (RPE 7) [anchor]
   - Burpee: 10 (RPE 7, quick and clean)
   - Suitcase Carry: 40 m (heavy, steady)
   - Dumbbell Push Press: 16 (light-moderate load, unbroken, short of failure)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 3000 m Row Erg (14.2 min, 5 bouts). Loaded reps 80, bodyweight reps 50, impact contacts 15. Active 25.6 min, recovery 4.0 min, transitions 7.2 min, elapsed 48.8 min (duty 0.86). Anchor share 43%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 4, transitions 29.

BUILT FOR TODAY (consumer text):
- You're stressed, so the session runs in fixed, repeatable rounds of Burpee, Suitcase Carry and Dumbbell Push Press at a controlled effort: settle in and just work, no clock to race. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: the anchor distance, station targets and 60 s between rounds are set for your level.
- Row Erg 600 m anchors all 5 rounds, followed by 3 stations every round.
- The main block is the whole workout: nothing is added after it. About 49 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=stressed] Med-Ball Slam left out; block RPE 7–8 → 7–7
- [goal] duty cycle 86%: the session keeps moving
- [archetype] Hybrid (your choice)
- [structure] split anchor: 5 rounds: Row Erg 600 m + 3 stations, 60 s between rounds
- Coherence stressed: PASS
- Budget repair: anchor_dose {'kind': 'distance', 'value': 750} → {'kind': 'distance', 'value': 600}

REALIZED PERSONALIZATION (contract):
- state = stressed (expression: fixed_rounds) → intended: rhythmic_predictable_conditioning → realized: Med-Ball Slam left out; block RPE 7–8 → 7–7
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 86%: the session keeps moving
- archetype = sweat_hybrid → intended: conditioning_type_for_today → realized: Hybrid (your choice)
- structure = split_anchor → intended: conditioning_structure_and_dose → realized: split anchor: 5 rounds: Row Erg 600 m + 3 stations, 60 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 48.8 min for a 60-minute window (25.6 active, 4.0 recovery, 7.2 transitions); main block stimulus: substantial (score 32.5 vs 18.0 / 27.0); primary +1 round; primary +1 round; 1 min technique and setup before round 1
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: substantial (score 32.5 vs sufficient 18.0 / substantial 27.0; main block 25.6 active min at RPE 7–7, 80 loaded reps, 14.2 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
State coherence: stressed PASS
Engine trace: budget_repair: anchor_dose {'kind': 'distance', 'value': 750}→{'kind': 'distance', 'value': 600} | fill: primary +1 round | fill: primary +1 round | fill: 1 min technique and setup before round 1 | stressed: attempt 0 'fixed_rounds' realized ['stations', 'rpe'] → satisfied

### B7 Bored · Engine · intermediate

Context: State(s): bored · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_engine · soreness: none · equipment: commercial_gym · seed `b7|2026-10-11`

**Engine** · shape **pyramid** · est. 48.1 min (shown as 45–50 min)
```
WARM-UP / PREP 8 min: 8 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Engine] pyramid · steps 1:00-2:00-3:00-4:00-4:00-3:00-2:00-1:00 with 60s easy · RPE 7–8 · ~27.0 min
   Work steps with 60 s easy between.
   - SkiErg: Pyramid 1 min-2 min-3 min-4 min-4 min-3 min-2 min-1 min (RPE 7-8; hold output across steps)
OPTIONAL COMPLEMENT [Complement] circuit · 2 rounds · 45 s between rounds · RPE 6–7 · ~6.6 min
   2 rounds, moving station to station; rest 45 s after each round. Purpose: a change of stimulus after the engine block (Bored).
   - Devil Press: 8 (light-moderate load, unbroken, short of failure)
   - Dumbbell Floor Press: 15 (light-moderate load, unbroken, short of failure)
   - Single-Arm Overhead Carry: 40 m (moderate load, switch arms halfway)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 1200 s SkiErg (20.0 min, 1 bouts). Loaded reps 46, bodyweight reps 0, impact contacts 0. Active 24.4 min, recovery 7.8 min, transitions 1.5 min, elapsed 48.1 min (duty 0.76). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 4, transitions 6.

BUILT FOR TODAY (consumer text):
- You're bored, so we're changing the experience with a pyramid structure and the SkiErg. The workload stays controlled; the novelty comes from how the session unfolds, not from random extra work. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: 8 pyramid steps up to 4 min, output held across the steps.
- A 1-2-3-4-4-3-2-1 minute pyramid on the SkiErg, 60 s easy between steps.
- Plus a short complement block, about 48 minutes in all.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=bored] pyramid instead of continuous; SkiErg instead of Row Erg; Devil Press (vs no-State build); Dumbbell Floor Press (vs no-State build); Single-Arm Overhead Carry (vs no-State build)
- [experience] pyramid (intermediate and up)
- [goal] duty cycle 76%: the session keeps moving
- [archetype] Engine (your choice)
- [structure] pyramid: pyramid 1:00-2:00-3:00-4:00-4:00-3:00-2:00-1:00 with 60 s easy; complement: fixed_circuit (7 min)
- Coherence bored: PASS

REALIZED PERSONALIZATION (contract):
- state = bored (expression: new_modalities) → intended: fresh_engaging_conditioning → realized: pyramid instead of continuous; SkiErg instead of Row Erg; Devil Press (vs no-State build); Dumbbell Floor Press (vs no-State build); Single-Arm Overhead Carry (vs no-State build)
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: pyramid (intermediate and up)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 76%: the session keeps moving
- archetype = sweat_engine → intended: conditioning_type_for_today → realized: Engine (your choice)
- structure = pyramid → intended: conditioning_structure_and_dose → realized: pyramid: pyramid 1:00-2:00-3:00-4:00-4:00-3:00-2:00-1:00 with 60 s easy; complement: fixed_circuit (7 min)
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 48.1 min for a 60-minute window (24.4 active, 7.8 recovery, 1.5 transitions); main block stimulus: sufficient (score 26.0 vs 18.0 / 27.0); warm-up +1 min (movement preparation)
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 26.0 vs sufficient 18.0 / substantial 27.0; main block 20.0 active min at RPE 7–8, 0 loaded reps, 20.0 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
State coherence: bored PASS
Engine trace: complement kept: a change of stimulus after the engine block (Bored) (6.6 min) | finisher skipped: one secondary element maximum | fill: warm-up +1 min (movement preparation) | bored: attempt 0 'new_modalities' realized ['shape', 'modality', 'exercises'] → satisfied

### B8 Bored · Circuit · advanced

Context: State(s): bored · level: advanced · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `b8|2026-10-11`

**Circuit** · shape **timed** · est. 48.0 min (shown as 45–50 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] timed_circuit · 5 rounds · 5 x 45s work / 15s recovery · 45 s between rounds · RPE 7–8 · ~24.7 min
   45 s work / 15 s rest per station, rotate through all stations; 5 rounds.
   - Battle Rope Waves: 45 s (RPE 8)
   - Devil Press: 45 s (light-moderate load, unbroken, short of failure)
   - Dumbbell Floor Press: 45 s (light-moderate load, unbroken, short of failure)
   - Wall Ball: 45 s (RPE 8)
OPTIONAL COMPLEMENT [Complement] ladder · RPE 7–8 · ~3.8 min
   Alternate the exercises at each rung, self-paced: 12-10-8-6-4 reps. Purpose: a change of stimulus after the circuit (Bored).
   - Skater Hops: Ladder 12-10-8-6-4 (RPE 8, quick and clean)
   - Med-Ball Slam: Ladder 12-10-8-6-4 (RPE 8)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 40, bodyweight reps 40, impact contacts 12. Active 18.0 min, recovery 8.0 min, transitions 2.5 min, elapsed 48.0 min (duty 0.69). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 6, transitions 10.

BUILT FOR TODAY (consumer text):
- You're bored, so we're changing the experience with movements you haven't seen recently (Battle Rope Waves, Devil Press and Dumbbell Floor Press). The workload stays controlled; the novelty comes from how the session unfolds, not from random extra work. You're advanced, so the session carries more output: timed circuit with the main block to RPE 8. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Advanced dosing: 45 s work and 15 s rest per station.
- 5 rounds of 45 s work / 15 s easy on Battle Rope Waves, Devil Press, Dumbbell Floor Press and Wall Ball.
- Plus a short complement block, about 48 minutes in all.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=bored] Battle Rope Waves (vs no-State build); Devil Press (vs no-State build); Dumbbell Floor Press (vs no-State build); Skater Hops (vs no-State build); Med-Ball Slam (vs no-State build)
- [experience] main block to RPE 8
- [goal] timed circuit shape (conditioning goal weights it up)
- [archetype] Circuit (your choice)
- [structure] timed circuit: 5 rounds × 4 stations at 45 s / 15 s; complement: couplet_ladder (4 min)
- Coherence bored: PASS

REALIZED PERSONALIZATION (contract):
- state = bored (expression: new_modalities) → intended: fresh_engaging_conditioning → realized: Battle Rope Waves (vs no-State build); Devil Press (vs no-State build); Dumbbell Floor Press (vs no-State build); Skater Hops (vs no-State build); Med-Ball Slam (vs no-State build)
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 8
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: timed circuit shape (conditioning goal weights it up)
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = timed → intended: conditioning_structure_and_dose → realized: timed circuit: 5 rounds × 4 stations at 45 s / 15 s; complement: couplet_ladder (4 min)
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 48.0 min for a 60-minute window (18.0 active, 8.0 recovery, 2.5 transitions); main block stimulus: sufficient (score 22.5 vs 21.0 / 32.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 22.5 vs sufficient 21.0 / substantial 32.0; main block 15.0 active min at RPE 7–8, 0 loaded reps, 0.0 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
State coherence: bored PASS
Engine trace: complement kept: a change of stimulus after the circuit (Bored) (3.8 min) | finisher skipped: one secondary element maximum | fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | bored: attempt 0 'new_modalities' realized ['exercises'] → satisfied

### B9 Bored · Hybrid · advanced

Context: State(s): bored · level: advanced · goal: lose weight / conditioning · 60 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym · seed `b9|2026-10-11`

**Hybrid** · shape **anchor_triplet** · est. 51.4 min (shown as 50–55 min)
```
WARM-UP / PREP 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Hybrid] anchor_circuit · 6 rounds · 45 s between rounds · RPE 7–8 · ~39.4 min
   Every round: SkiErg, then every station. Walk 45 s between rounds.
   - SkiErg: 500 m (RPE 8) [anchor]
   - Devil Press: 10 (light-moderate load, unbroken, short of failure)
   - Sled Rope Pull: 20 m (heavy, steady)
   - Overhead Carry: 40 m (moderate load, arms locked out)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 3000 m SkiErg (13.7 min, 6 bouts). Loaded reps 60, bodyweight reps 0, impact contacts 0. Active 28.1 min, recovery 3.8 min, transitions 7.5 min, elapsed 51.4 min (duty 0.88). Anchor share 39%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 4, transitions 30.

BUILT FOR TODAY (consumer text):
- You're bored, so we're changing the experience with the SkiErg and movements you haven't seen recently (Devil Press, Sled Rope Pull and Overhead Carry). The workload stays controlled; the novelty comes from how the session unfolds, not from random extra work. You're advanced, so the session carries more output: anchor + triplet with the main block to RPE 8. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Advanced dosing: the anchor distance, station targets and 45 s between rounds are set for your level.
- SkiErg 500 m anchors all 6 rounds, followed by 3 stations every round.
- The main block is the whole workout: nothing is added after it. About 51 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=bored] SkiErg instead of Row Erg; Devil Press (vs no-State build)
- [experience] main block to RPE 8; duty cycle 88% (dense); anchor + triplet shape
- [goal] duty cycle 88%: the session keeps moving
- [archetype] Hybrid (your choice)
- [structure] anchor + triplet: 6 rounds: SkiErg 500 m + 3 stations, 45 s between rounds
- Coherence bored: PASS

REALIZED PERSONALIZATION (contract):
- state = bored (expression: new_structure) → intended: fresh_engaging_conditioning → realized: SkiErg instead of Row Erg; Devil Press (vs no-State build)
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 8; duty cycle 88% (dense); anchor + triplet shape
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 88%: the session keeps moving
- archetype = sweat_hybrid → intended: conditioning_type_for_today → realized: Hybrid (your choice)
- structure = anchor_triplet → intended: conditioning_structure_and_dose → realized: anchor + triplet: 6 rounds: SkiErg 500 m + 3 stations, 45 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 51.4 min for a 60-minute window (28.1 active, 3.8 recovery, 7.5 transitions); main block stimulus: substantial (score 44.7 vs 21.0 / 32.0); primary +1 round
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: substantial (score 44.7 vs sufficient 21.0 / substantial 32.0; main block 28.1 active min at RPE 7–8, 60 loaded reps, 13.7 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
State coherence: bored PASS
Engine trace: fill: primary +1 round | bored: attempt 0 'new_structure' realized ['modality', 'exercises'] → satisfied

### B10 Irritated · Engine · advanced

Context: State(s): irritated · level: advanced · goal: lose weight / conditioning · 60 min · archetype: sweat_engine · soreness: none · equipment: commercial_gym · seed `b10|2026-10-11`

**Engine** · shape **long_intervals** · est. 48.3 min (shown as 45–50 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Engine] intervals · 4 rounds · 4 x 300s work / 90s recovery · RPE 7–8 · ~24.5 min
   Hard intervals on the same machine; easy pace between.
   - Air Bike / Assault Bike: 4 × 5 min / 1:30 easy (RPE 8)
FINISHER [Finisher] finisher · 6 rounds · 6 x 20s work / 40s recovery · RPE 9–9 · ~5.3 min
   All-out efforts with easy recovery between.
   - Battle Rope Waves: 6 × 20 s / 40 s easy (RPE 9)
COOLDOWN 7 min: Easy pace and breathing down.
```
Totals: Total engine dose: 1200 s Air Bike (20.0 min, 4 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 22.0 min, recovery 7.8 min, transitions 0.0 min, elapsed 48.3 min (duty 0.74). Hard (RPE 8+) 2.0 min (9%), all-out blocks 1, stations 2, transitions 0.

BUILT FOR TODAY (consumer text):
- You're irritated, so that energy gets somewhere physical to go: Battle Rope Waves around the Air Bike. The movements stay simple so you can focus on output, not coordination. Since you're advanced, the density is higher and the main block runs to RPE 8. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Advanced dosing: 5 min work with 1:30 easy between intervals.
- 4 rounds of 300 s work / 90 s easy on Air Bike / Assault Bike.
- Plus a short finisher block, about 48 minutes in all.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=irritated] Battle Rope Waves (vs no-State build); finisher added
- [experience] main block to RPE 8; 20.0 min of engine work
- [goal] duty cycle 74%: the session keeps moving; long intervals shape (conditioning goal weights it up)
- [archetype] Engine (your choice)
- [structure] long intervals: 4 × 300 s / 90 s easy; finisher: Battle Rope Waves
- Coherence irritated: PASS

REALIZED PERSONALIZATION (contract):
- state = irritated (expression: direct_finisher) → intended: direct_cathartic_output → realized: Battle Rope Waves (vs no-State build); finisher added
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 8; 20.0 min of engine work
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 74%: the session keeps moving; long intervals shape (conditioning goal weights it up)
- archetype = sweat_engine → intended: conditioning_type_for_today → realized: Engine (your choice)
- structure = long_intervals → intended: conditioning_structure_and_dose → realized: long intervals: 4 × 300 s / 90 s easy; finisher: Battle Rope Waves
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 48.3 min for a 60-minute window (22.0 active, 7.8 recovery, 0.0 transitions); main block stimulus: sufficient (score 26.0 vs 21.0 / 32.0); warm-up +3 min (movement preparation); downshift +2 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 26.0 vs sufficient 21.0 / substantial 32.0; main block 20.0 active min at RPE 7–8, 0 loaded reps, 20.0 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
State coherence: irritated PASS
Engine trace: fill: warm-up +3 min (movement preparation) | fill: downshift +2 min | irritated: attempt 0 'direct_finisher' realized ['exercises', 'finisher'] → satisfied

### B11 Irritated · Circuit · intermediate

Context: State(s): irritated · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `b11|2026-10-11`

**Circuit** · shape **timed** · est. 42.7 min (shown as 40–45 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] timed_circuit · 5 rounds · 5 x 40s work / 20s recovery · 45 s between rounds · RPE 8–9 · ~24.7 min
   40 s work / 20 s rest per station, rotate through all stations; 5 rounds.
   - Air Bike / Assault Bike: 40 s (RPE 9)
   - Kettlebell Swing: 40 s (moderate, crisp hips (RPE <= 8))
   - Dumbbell Push Press: 40 s (light-moderate load, unbroken, short of failure)
   - Sled Rope Pull: 40 s (heavy, steady)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: 200 s Air Bike (3.3 min, 5 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 13.3 min, recovery 9.7 min, transitions 1.7 min, elapsed 42.7 min (duty 0.58). Hard (RPE 8+) 13.3 min (100%), all-out blocks 0, stations 4, transitions 6.

BUILT FOR TODAY (consumer text):
- You're irritated, so that energy gets somewhere physical to go: Kettlebell Swing, Dumbbell Push Press and Sled Rope Pull around the Air Bike. The movements stay simple so you can focus on output, not coordination. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: 40 s work and 20 s rest per station.
- 5 rounds of 40 s work / 20 s easy on Air Bike / Assault Bike, Kettlebell Swing, Dumbbell Push Press and Sled Rope Pull.
- One main block, about 43 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 8–9.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=irritated] circuit RPE 7–8 → 8–9
- [goal] timed circuit shape (conditioning goal weights it up)
- [archetype] Circuit (your choice)
- [structure] timed circuit: 5 rounds × 4 stations at 40 s / 20 s
- Coherence irritated: PASS

REALIZED PERSONALIZATION (contract):
- state = irritated (expression: hard_simple) → intended: direct_cathartic_output → realized: circuit RPE 7–8 → 8–9
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: timed circuit shape (conditioning goal weights it up)
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = timed → intended: conditioning_structure_and_dose → realized: timed circuit: 5 rounds × 4 stations at 40 s / 20 s
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 42.7 min for a 60-minute window (13.3 active, 9.7 recovery, 1.7 transitions); main block stimulus: sufficient (score 18.8 vs 18.0 / 27.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 18.8 vs sufficient 18.0 / substantial 27.0; main block 13.3 active min at RPE 8–9, 0 loaded reps, 3.3 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
State coherence: irritated PASS
Engine trace: finisher skipped: hard main block | fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | irritated: attempt 0 'hard_simple' realized ['rpe'] → satisfied | elapsed 42.7 min accepted (window [48, 60], main block sufficient)

### B12 Irritated · Hybrid · intermediate

Context: State(s): irritated · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym · seed `b12|2026-10-11`

**Hybrid** · shape **anchor_couplet** · est. 48.3 min (shown as 45–50 min)
```
WARM-UP / PREP 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Hybrid] anchor_circuit · 6 rounds · 60 s between rounds · RPE 8–8 · ~36.3 min
   First 2 min: set your Row Erg pace and load every station, then start round 1. Every round: Row Erg, then every station. Walk 60 s between rounds.
   - Row Erg: 450 m (RPE 8) [anchor]
   - Sled Push: 20 m (heavy, steady)
   - Front-Rack Carry: 60 m (moderate-heavy, stay tall)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 2700 m Row Erg (12.4 min, 6 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 23.3 min, recovery 5.0 min, transitions 8.0 min, elapsed 48.3 min (duty 0.82). Anchor share 40%. Hard (RPE 8+) 12.4 min (53%), all-out blocks 0, stations 3, transitions 32.

BUILT FOR TODAY (consumer text):
- You're irritated, so that energy gets somewhere physical to go: Sled Push and Front-Rack Carry around the Row Erg. The movements stay simple so you can focus on output, not coordination. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: the anchor distance, station targets and 60 s between rounds are set for your level.
- Row Erg 450 m anchors all 6 rounds, followed by 2 stations every round.
- The main block is the whole workout: nothing is added after it. About 48 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=irritated] block RPE 7–8 → 8–8; anchor + couplet instead of ladder hybrid
- [goal] duty cycle 82%: the session keeps moving; anchor + couplet shape (conditioning goal weights it up)
- [archetype] Hybrid (your choice)
- [structure] anchor + couplet: 6 rounds: Row Erg 450 m + 2 stations, 60 s between rounds
- Coherence irritated: PASS

REALIZED PERSONALIZATION (contract):
- state = irritated (expression: output_tools) → intended: direct_cathartic_output → realized: block RPE 7–8 → 8–8; anchor + couplet instead of ladder hybrid
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 82%: the session keeps moving; anchor + couplet shape (conditioning goal weights it up)
- archetype = sweat_hybrid → intended: conditioning_type_for_today → realized: Hybrid (your choice)
- structure = anchor_couplet → intended: conditioning_structure_and_dose → realized: anchor + couplet: 6 rounds: Row Erg 450 m + 2 stations, 60 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 48.3 min for a 60-minute window (23.3 active, 5.0 recovery, 8.0 transitions); main block stimulus: substantial (score 31.7 vs 18.0 / 27.0); 2 min technique and setup before round 1
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: substantial (score 31.7 vs sufficient 18.0 / substantial 27.0; main block 23.3 active min at RPE 8–8, 0 loaded reps, 12.4 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
State coherence: irritated PASS
Engine trace: fill: 2 min technique and setup before round 1 | irritated: attempt 0 'direct_finisher' realized [] → NOT satisfied | irritated: fallback direct_finisher → output_tools | irritated: attempt 1 'output_tools' realized ['rpe', 'shape'] → satisfied

### B13 Amped · Engine · intermediate

Context: State(s): amped · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_engine · soreness: none · equipment: commercial_gym · seed `b13|2026-10-11`

**Engine** · shape **short_intervals** · est. 34.7 min (shown as 30–35 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Engine] intervals · 17 rounds · 17 x 40s work / 20s recovery · RPE 9–9 · ~16.7 min
   Hard intervals on the same machine; easy pace between.
   - SkiErg: 17 × 40 s / 20 s easy (RPE 9)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: 680 s SkiErg (11.3 min, 17 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 11.3 min, recovery 5.3 min, transitions 0.0 min, elapsed 34.7 min (duty 0.68). Hard (RPE 8+) 11.3 min (100%), all-out blocks 1, stations 1, transitions 0.

BUILT FOR TODAY (consumer text):
- You're amped, so that readiness goes into a harder pace on the SkiErg.
- This session is complete at about 35 min. Quality over filler.
- Intermediate dosing: 40 s work with 20 s easy between intervals.
- 17 rounds of 40 s work / 20 s easy on SkiErg.
- One main block, about 35 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 9.

WHY THIS FITS TODAY (trainer reasoning):
- [state=amped] block RPE 8–9 → 9–9
- [experience] short intervals (intermediate and up)
- [archetype] Engine (your choice)
- [structure] short intervals: 17 × 40 s / 20 s easy
- Coherence amped: PASS

REALIZED PERSONALIZATION (contract):
- state = amped (expression: harder_output) → intended: use_readiness_for_output_or_density → realized: block RPE 8–9 → 9–9
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: short intervals (intermediate and up)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: nothing (no claim made)
- archetype = sweat_engine → intended: conditioning_type_for_today → realized: Engine (your choice)
- structure = short_intervals → intended: conditioning_structure_and_dose → realized: short intervals: 17 × 40 s / 20 s easy
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 34.7 min for a 60-minute window (11.3 active, 5.3 recovery, 0.0 transitions); main block stimulus: sufficient (score 18.1 vs 18.0 / 27.0); primary +1 unit (stimulus below sufficient); warm-up +3 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 18.1 vs sufficient 18.0 / substantial 27.0; main block 11.3 active min at RPE 9–9, 0 loaded reps, 11.3 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
State coherence: amped PASS
Engine trace: fill: primary +1 unit (stimulus below sufficient) | finisher skipped: hard main block | fill: warm-up +3 min (movement preparation) | fill: downshift +3 min | amped: attempt 0 'harder_output' realized ['rpe'] → satisfied | elapsed 34.7 min accepted (window [48, 60], main block sufficient)

### B14 Amped · Circuit · advanced

Context: State(s): amped · level: advanced · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `b14|2026-10-11`

**Circuit** · shape **rounds** · est. 41.9 min (shown as 40–45 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] circuit · 6 rounds · 45 s between rounds · RPE 8–9 · ~23.9 min
   6 rounds, moving station to station; rest 45 s after each round.
   - Box Jump: 10 (RPE 8, quick and clean)
   - Kettlebell Swing: 15 (moderate, crisp hips (RPE <= 8))
   - Dumbbell Push Press: 15 (light-moderate load, unbroken, short of failure)
   - Med-Ball Slam: 12 (RPE 9)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 312, bodyweight reps 0, impact contacts 18. Active 14.1 min, recovery 3.8 min, transitions 6.0 min, elapsed 41.9 min (duty 0.79). Hard (RPE 8+) 14.1 min (100%), all-out blocks 0, stations 4, transitions 24.

BUILT FOR TODAY (consumer text):
- You're amped, so that readiness goes into a harder pace. You're advanced, so the session can carry more output without every round becoming all-out. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Advanced dosing: station targets and 45 s between rounds are set for your level.
- 6 rounds of 4 stations: Box Jump, Kettlebell Swing, Dumbbell Push Press and Med-Ball Slam.
- One main block, about 42 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 8–9.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=amped] circuit RPE 7–8 → 8–9
- [experience] main block to RPE 9; duty cycle 79% (dense)
- [goal] duty cycle 79%: the session keeps moving
- [archetype] Circuit (your choice)
- [structure] circuit rounds: 6 rounds × 4 stations, 45 s between rounds
- Coherence amped: PASS

REALIZED PERSONALIZATION (contract):
- state = amped (expression: harder_output) → intended: use_readiness_for_output_or_density → realized: circuit RPE 7–8 → 8–9
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 9; duty cycle 79% (dense)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 79%: the session keeps moving
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = rounds → intended: conditioning_structure_and_dose → realized: circuit rounds: 6 rounds × 4 stations, 45 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 41.9 min for a 60-minute window (14.1 active, 3.8 recovery, 6.0 transitions); main block stimulus: sufficient (score 27.6 vs 21.0 / 32.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 27.6 vs sufficient 21.0 / substantial 32.0; main block 14.1 active min at RPE 8–9, 312 loaded reps, 0.0 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
State coherence: amped PASS
Engine trace: finisher skipped: hard main block | fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | amped: attempt 0 'harder_output' realized ['rpe'] → satisfied | elapsed 41.9 min accepted (window [48, 60], main block sufficient)

### B15 Amped · Hybrid · advanced (legacy 7 x 800 m Row fixture beside it)

Context: State(s): amped · level: advanced · goal: lose weight / conditioning · 60 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym · seed `u1|2026-10-11`

**Hybrid** · shape **split_anchor** · est. 51.7 min (shown as 50–55 min)
```
WARM-UP / PREP 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Hybrid] anchor_circuit · 4 rounds · 45 s between rounds · RPE 7–8 · ~39.7 min
   Every round: Row Erg, then every station. Walk 45 s between rounds.
   - Row Erg: 950 m (RPE 8) [anchor]
   - Dumbbell Snatch: 12/side (light-moderate load, unbroken, short of failure)
   - Med-Ball Slam: 15 (RPE 8)
   - Sled Rope Pull: 20 m (heavy, steady)
   - Front-Rack Carry: 60 m (moderate-heavy, stay tall)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 3800 m Row Erg (16.2 min, 4 bouts). Loaded reps 156, bodyweight reps 0, impact contacts 0. Active 31.4 min, recovery 2.2 min, transitions 6.0 min, elapsed 51.7 min (duty 0.93). Anchor share 43%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 24.

BUILT FOR TODAY (consumer text):
- You're amped, so that readiness goes into an extra round on the Row Erg. You're advanced, so the session can carry more output without every round becoming all-out. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Advanced dosing: the anchor distance, station targets and 45 s between rounds are set for your level.
- Row Erg 950 m anchors all 4 rounds, followed by 4 stations every round.
- The main block is the whole workout: nothing is added after it. About 52 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=amped] 3 rounds → 4 rounds
- [experience] main block to RPE 8; duty cycle 93% (dense)
- [goal] duty cycle 93%: the session keeps moving; 31.4 active minutes
- [archetype] Hybrid (your choice)
- [structure] split anchor: 4 rounds: Row Erg 950 m + 4 stations, 45 s between rounds
- Coherence amped: PASS

REALIZED PERSONALIZATION (contract):
- state = amped (expression: extra_round) → intended: use_readiness_for_output_or_density → realized: 3 rounds → 4 rounds
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 8; duty cycle 93% (dense)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 93%: the session keeps moving; 31.4 active minutes
- archetype = sweat_hybrid → intended: conditioning_type_for_today → realized: Hybrid (your choice)
- structure = split_anchor → intended: conditioning_structure_and_dose → realized: split anchor: 4 rounds: Row Erg 950 m + 4 stations, 45 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 51.7 min for a 60-minute window (31.4 active, 2.2 recovery, 6.0 transitions); main block stimulus: substantial (score 51.9 vs 21.0 / 32.0)
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: substantial (score 51.9 vs sufficient 21.0 / substantial 32.0; main block 31.4 active min at RPE 7–8, 156 loaded reps, 16.2 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
State coherence: amped PASS
Engine trace: amped: attempt 0 'extra_round' realized ['volume'] → satisfied

LEGACY (frozen v4 Sweat, identical inputs):
```
[Hybrid legacy] 7 rounds: Row Erg 800 distance every round + stations Dumbbell Snatch 12/side, Med-Ball Slam 15, Box Jump 12, Skater Hops 12/side, Kettlebell Swing 20 · legacy est 44.3 min
   legacy total anchor dose: 5600 distance
   under the rebuilt time model: engine 23.4 min, anchor share 68%, elapsed 49.4 min, violations: anchor share 68% above 48%; hard (RPE 8+) share 80% above 70% (23.4 min at RPE 8+, limit 22)
```

### B16 Sore legs · MOOD's Pick · intermediate (auto reroute)

Context: State(s): none · level: intermediate · goal: lose weight / conditioning · 60 min · MOOD's Pick · soreness: legs · equipment: commercial_gym · seed `b16|2026-10-11`

**Circuit** · shape **rounds** · est. 48.1 min (shown as 45–50 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] circuit · 6 rounds · 60 s between rounds · RPE 7–8 · ~24.9 min
   6 rounds, moving station to station; rest 60 s after each round.
   - Suitcase Carry: 30 m (heavy, steady)
   - Push-Up: 12 (steady, clean reps)
   - Bent-Over Dumbbell Row (Two-Arm): 15 (light-moderate load, unbroken, short of failure)
   - Battle Rope Waves: 30 s (RPE 8)
OPTIONAL COMPLEMENT [Complement] intervals · 6 rounds · 6 x 40s work / 20s recovery · RPE 7–8 · ~5.7 min
   Hard intervals on the same machine; easy pace between. Purpose: a short engine piece to round out a station-led circuit.
   - SkiErg: 6 × 40 s / 20 s easy (RPE 8)
COOLDOWN 6 min: Easy pace and breathing down.
```
Totals: Total engine dose: 240 s SkiErg (4.0 min, 6 bouts). Loaded reps 90, bodyweight reps 72, impact contacts 0. Active 17.9 min, recovery 6.7 min, transitions 6.0 min, elapsed 48.1 min (duty 0.73). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 24.

BUILT FOR TODAY (consumer text):
- Your legs are sore, so every station keeps that area out of the loading; the SkiErg carries the conditioning. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: station targets and 60 s between rounds are set for your level.
- 6 rounds of 4 stations: Suitcase Carry, Push-Up, Bent-Over Dumbbell Row (Two-Arm) and Battle Rope Waves.
- Plus a short complement block, about 48 minutes in all.
- Target effort for the main block is RPE 7–8.
- MOOD's Pick orders Circuit, Engine and Hybrid for your goal to lose weight and build conditioning.

WHY THIS FITS TODAY (trainer reasoning):
- [soreness] no station loads the sore calves, glutes, hamstrings, quads directly; 1 station still uses it as a secondary mover (SkiErg); no high-impact work on sore legs
- [goal] duty cycle 73%: the session keeps moving
- [archetype] Circuit (MOOD's Pick: goal rotation, least recently used, State affinity)
- [structure] circuit rounds: 6 rounds × 4 stations, 60 s between rounds; complement: engine_intervals (6 min)

REALIZED PERSONALIZATION (contract):
- soreness = ['calves', 'glutes', 'hamstrings', 'quads'] → intended: protect_sore_region → realized: no station loads the sore calves, glutes, hamstrings, quads directly; 1 station still uses it as a secondary mover (SkiErg); no high-impact work on sore legs
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 73%: the session keeps moving
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (MOOD's Pick: goal rotation, least recently used, State affinity)
- structure = rounds → intended: conditioning_structure_and_dose → realized: circuit rounds: 6 rounds × 4 stations, 60 s between rounds; complement: engine_intervals (6 min)
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 48.1 min for a 60-minute window (17.9 active, 6.7 recovery, 6.0 transitions); main block stimulus: sufficient (score 21.6 vs 18.0 / 27.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +1 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 21.6 vs sufficient 18.0 / substantial 27.0; main block 13.9 active min at RPE 7–8, 90 loaded reps, 0.0 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
Engine trace: complement kept: a short engine piece to round out a station-led circuit (5.7 min) | fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +1 min

### B17 Sore shoulders · Circuit (user-selected) · intermediate

Context: State(s): none · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: shoulders · equipment: commercial_gym · seed `b17|2026-10-11`

**Circuit** · shape **rounds** · est. 41.8 min (shown as 40–45 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] circuit · 5 rounds · 60 s between rounds · RPE 7–8 · ~23.8 min
   5 rounds, moving station to station; rest 60 s after each round.
   - Row Erg: 250 m (RPE 8)
   - Kettlebell Swing: 15 (moderate, crisp hips (RPE <= 8))
   - Dumbbell Floor Press: 15 (light-moderate load, unbroken, short of failure)
   - Suitcase Carry: 30 m (heavy, steady)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: 1250 m Row Erg (5.0 min, 5 bouts). Loaded reps 150, bodyweight reps 0, impact contacts 0. Active 14.8 min, recovery 4.0 min, transitions 5.0 min, elapsed 41.8 min (duty 0.79). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 4, transitions 20.

BUILT FOR TODAY (consumer text):
- Your shoulders are sore, so every station keeps that area out of the loading; the Row Erg carries the conditioning. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: station targets and 60 s between rounds are set for your level.
- 5 rounds of 4 stations: Row Erg, Kettlebell Swing, Dumbbell Floor Press and Suitcase Carry.
- One main block, about 42 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [soreness] no station loads the sore front_delts, rear_delts, shoulders, side_delts directly
- [goal] duty cycle 79%: the session keeps moving
- [archetype] Circuit (your choice)
- [structure] circuit rounds: 5 rounds × 4 stations, 60 s between rounds

REALIZED PERSONALIZATION (contract):
- soreness = ['front_delts', 'rear_delts', 'shoulders', 'side_delts'] → intended: protect_sore_region → realized: no station loads the sore front_delts, rear_delts, shoulders, side_delts directly
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 79%: the session keeps moving
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = rounds → intended: conditioning_structure_and_dose → realized: circuit rounds: 5 rounds × 4 stations, 60 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 41.8 min for a 60-minute window (14.8 active, 4.0 recovery, 5.0 transitions); main block stimulus: sufficient (score 22.9 vs 18.0 / 27.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 22.9 vs sufficient 18.0 / substantial 27.0; main block 14.8 active min at RPE 7–8, 150 loaded reps, 5.0 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
Engine trace: fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | elapsed 41.8 min accepted (window [48, 60], main block sufficient)

## C. Multi-State, 60 minutes (deterministic conflict rules)

### C1 Low Energy + Amped · Hybrid · intermediate

Context: State(s): low_energy, amped · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym · seed `c1|2026-10-11`

**Hybrid** · shape **split_anchor** · est. 46.5 min (shown as 45–50 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Hybrid] anchor_circuit · 4 rounds · 45 s between rounds · RPE 7–8 · ~28.5 min
   First 1 min: set your Row Erg pace and load every station, then start round 1. Every round: Row Erg, then every station. Walk 45 s between rounds.
   - Row Erg: 600 m (RPE 8) [anchor]
   - Kettlebell Swing: 20 (moderate, crisp hips (RPE <= 8))
   - Med-Ball Slam: 15 (RPE 8)
   - Dumbbell Push Press: 16 (light-moderate load, unbroken, short of failure)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: 2400 m Row Erg (11.3 min, 4 bouts). Loaded reps 204, bodyweight reps 0, impact contacts 0. Active 20.3 min, recovery 2.2 min, transitions 6.0 min, elapsed 46.5 min (duty 0.9). Anchor share 43%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 4, transitions 24.

BUILT FOR TODAY (consumer text):
- You're amped but running on less energy than usual, so energy sets the workload and the readiness goes into one denser Row Erg block. Everything else stays steady and sustainable. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: the anchor distance, station targets and 45 s between rounds are set for your level.
- Row Erg 600 m anchors all 4 rounds, followed by 3 stations every round.
- The main block is the whole workout: nothing is added after it. About 46 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=low_energy] Front-Rack Carry left out; primary → 4 rounds
- [state=amped] round_rest 60 → 45 s
- [goal] duty cycle 90%: the session keeps moving
- [archetype] Hybrid (your choice)
- [structure] split anchor: 4 rounds: Row Erg 600 m + 3 stations, 45 s between rounds
- Coherence low_energy: PASS; before repairs: ['loaded reps 255']
- Coherence amped: PASS
- Budget repair: anchor_dose {'kind': 'distance', 'value': 750} → {'kind': 'distance', 'value': 600}
- Coherence repair low_energy: units_-1 (primary → 4 rounds)

REALIZED PERSONALIZATION (contract):
- state = low_energy (expression: low_impact_simple) → intended: keep_moving_lower_intensity_and_systemic_cost → realized: Front-Rack Carry left out; primary → 4 rounds
- state = amped (expression: extra_round) → intended: use_readiness_for_output_or_density → realized: round_rest 60 → 45 s
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 90%: the session keeps moving
- archetype = sweat_hybrid → intended: conditioning_type_for_today → realized: Hybrid (your choice)
- structure = split_anchor → intended: conditioning_structure_and_dose → realized: split anchor: 4 rounds: Row Erg 600 m + 3 stations, 45 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 46.5 min for a 60-minute window (20.3 active, 2.2 recovery, 6.0 transitions); main block stimulus: substantial (score 34.1 vs 16.2 / 24.3); primary +1 round; primary +1 round; 1 min technique and setup before round 1
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: substantial (score 34.1 vs sufficient 16.2 / substantial 24.3; main block 20.3 active min at RPE 7–8, 204 loaded reps, 11.3 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
State coherence: low_energy PASS · amped PASS
Engine trace: rule low_energy_owns_workload | rule low_energy_owns_workload | budget_repair: anchor_dose {'kind': 'distance', 'value': 750}→{'kind': 'distance', 'value': 600} | fill: primary +1 round | fill: primary +1 round | fill: 1 min technique and setup before round 1 | fill: warm-up +1 min | low_energy: attempt 0 'low_impact_simple' realized ['stations'] → satisfied | amped: attempt 0 'extra_round' realized ['recovery'] → satisfied | coherence repair (low_energy): primary → 4 rounds | fill: warm-up +2 min (movement preparation) | fill: downshift +3 min | elapsed 46.5 min accepted (window [48, 60], main block substantial)

### C2 Amped + Stressed · Circuit · intermediate

Context: State(s): amped, stressed · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `c2|2026-10-11`

**Circuit** · shape **rounds** · est. 44.4 min (shown as 40–45 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] circuit · 6 rounds · 75 s between rounds · RPE 8–9 · ~26.4 min
   6 rounds, moving station to station; rest 75 s after each round.
   - Jump Squat: 12 (RPE 8, quick and clean)
   - Kettlebell Swing: 15 (moderate, crisp hips (RPE <= 8))
   - Dumbbell Push Press: 15 (light-moderate load, unbroken, short of failure)
   - Med-Ball Slam: 12 (RPE 9)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 252, bodyweight reps 72, impact contacts 72 (high-impact: jump_squat). Active 14.1 min, recovery 6.2 min, transitions 6.0 min, elapsed 44.4 min (duty 0.69). Hard (RPE 8+) 14.1 min (100%), all-out blocks 0, stations 4, transitions 24.

BUILT FOR TODAY (consumer text):
- You're amped but stressed, so the session stays simple and predictable (circuit rounds) and the extra energy goes into a harder main block rather than into a busier structure.
- Intermediate dosing: station targets and 75 s between rounds are set for your level.
- 6 rounds of 4 stations: Jump Squat, Kettlebell Swing, Dumbbell Push Press and Med-Ball Slam.
- One main block, about 44 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 8–9.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=amped] circuit RPE 7–8 → 8–9
- [state=stressed] round_rest 60 → 75 s
- [archetype] Circuit (your choice)
- [structure] circuit rounds: 6 rounds × 4 stations, 75 s between rounds
- Coherence amped: PASS
- Coherence stressed: PASS

REALIZED PERSONALIZATION (contract):
- state = amped (expression: denser) → intended: use_readiness_for_output_or_density → realized: circuit RPE 7–8 → 8–9
- state = stressed (expression: controlled_pace) → intended: rhythmic_predictable_conditioning → realized: round_rest 60 → 75 s
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: nothing (no claim made)
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = rounds → intended: conditioning_structure_and_dose → realized: circuit rounds: 6 rounds × 4 stations, 75 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 44.4 min for a 60-minute window (14.1 active, 6.2 recovery, 6.0 transitions); main block stimulus: sufficient (score 26.3 vs 18.0 / 27.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 26.3 vs sufficient 18.0 / substantial 27.0; main block 14.1 active min at RPE 8–9, 252 loaded reps, 0.0 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
State coherence: amped PASS · stressed PASS
Engine trace: rule amped_output_stressed_structure | rule amped_output_stressed_structure | finisher skipped: hard main block | fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | amped: attempt 0 'denser' realized ['rpe'] → satisfied | stressed: attempt 0 'fixed_rounds' realized [] → NOT satisfied | stressed: fallback fixed_rounds → steady_cyclical | amped: attempt 1 'denser' realized ['rpe'] → satisfied | stressed: attempt 1 'steady_cyclical' realized [] → NOT satisfied | stressed: fallback steady_cyclical → controlled_pace | amped: attempt 2 'denser' realized ['rpe'] → satisfied | stressed: attempt 2 'controlled_pace' realized ['recovery'] → satisfied | elapsed 44.4 min accepted (window [48, 60], main block sufficient)

### C3 Bored + Stressed · Engine · intermediate

Context: State(s): bored, stressed · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_engine · soreness: none · equipment: commercial_gym · seed `c3|2026-10-11`

**Engine** · shape **long_intervals** · est. 48.1 min (shown as 45–50 min)
```
WARM-UP / PREP 9 min: 9 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Engine] intervals · 5 rounds · 5 x 240s work / 90s recovery · RPE 7–7 · ~26.0 min
   Hard intervals on the same machine; easy pace between.
   - Air Bike / Assault Bike: 5 × 4 min / 1:30 easy (RPE 7)
OPTIONAL COMPLEMENT [Complement] circuit · 2 rounds · 45 s between rounds · RPE 6–7 · ~6.6 min
   2 rounds, moving station to station; rest 45 s after each round. Purpose: a change of stimulus after the engine block (Bored).
   - Devil Press: 8 (light-moderate load, unbroken, short of failure)
   - Dumbbell Floor Press: 15 (light-moderate load, unbroken, short of failure)
   - Single-Arm Overhead Carry: 40 m (moderate load, switch arms halfway)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 1200 s Air Bike (20.0 min, 5 bouts). Loaded reps 46, bodyweight reps 0, impact contacts 0. Active 24.4 min, recovery 6.8 min, transitions 1.5 min, elapsed 48.1 min (duty 0.78). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 4, transitions 6.

BUILT FOR TODAY (consumer text):
- You're bored and stressed, so the novelty is in the movements while the structure stays a fixed, repeatable long intervals. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: 4 min work with 1:30 easy between intervals.
- 5 rounds of 240 s work / 90 s easy on Air Bike / Assault Bike.
- Plus a short complement block, about 48 minutes in all.
- Target effort for the main block is RPE 7.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=bored] Air Bike instead of Treadmill Run; Devil Press (vs no-State build); Dumbbell Floor Press (vs no-State build); Single-Arm Overhead Carry (vs no-State build)
- [state=stressed] block RPE 7–8 → 7–7; Air Bike instead of Treadmill Run; Devil Press (vs no-State build); Dumbbell Floor Press (vs no-State build); Single-Arm Overhead Carry (vs no-State build)
- [goal] duty cycle 78%: the session keeps moving; long intervals shape (conditioning goal weights it up)
- [archetype] Engine (your choice)
- [structure] long intervals: 5 × 240 s / 90 s easy; complement: fixed_circuit (7 min)
- Coherence bored: PASS
- Coherence stressed: PASS

REALIZED PERSONALIZATION (contract):
- state = bored (expression: new_modalities) → intended: fresh_engaging_conditioning → realized: Air Bike instead of Treadmill Run; Devil Press (vs no-State build); Dumbbell Floor Press (vs no-State build); Single-Arm Overhead Carry (vs no-State build)
- state = stressed (expression: fixed_rounds) → intended: rhythmic_predictable_conditioning → realized: block RPE 7–8 → 7–7; Air Bike instead of Treadmill Run; Devil Press (vs no-State build); Dumbbell Floor Press (vs no-State build); Single-Arm Overhead Carry (vs no-State build)
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 78%: the session keeps moving; long intervals shape (conditioning goal weights it up)
- archetype = sweat_engine → intended: conditioning_type_for_today → realized: Engine (your choice)
- structure = long_intervals → intended: conditioning_structure_and_dose → realized: long intervals: 5 × 240 s / 90 s easy; complement: fixed_circuit (7 min)
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 48.1 min for a 60-minute window (24.4 active, 6.8 recovery, 1.5 transitions); main block stimulus: sufficient (score 20.0 vs 18.0 / 27.0); primary +1 unit (stimulus below sufficient); warm-up +2 min (movement preparation)
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 20.0 vs sufficient 18.0 / substantial 27.0; main block 20.0 active min at RPE 7–7, 0 loaded reps, 20.0 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
State coherence: bored PASS · stressed PASS
Engine trace: rule bored_novelty_stressed_structure | rule bored_novelty_stressed_structure | fill: primary +1 unit (stimulus below sufficient) | complement kept: a change of stimulus after the engine block (Bored) (6.6 min) | finisher skipped: one secondary element maximum | fill: warm-up +2 min (movement preparation) | bored: attempt 0 'new_modalities' realized ['modality', 'exercises'] → satisfied | stressed: attempt 0 'fixed_rounds' realized ['rpe', 'modality', 'exercises'] → satisfied

### C4 Irritated + Low Energy · Circuit · advanced

Context: State(s): irritated, low_energy · level: advanced · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `c4|2026-10-11`

**Circuit** · shape **rounds** · est. 47.6 min (shown as 45–50 min)
```
WARM-UP / PREP 6 min: 6 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Circuit] circuit · 7 rounds · 45 s between rounds · RPE 6–7 · ~27.1 min
   7 rounds, moving station to station; rest 45 s after each round.
   - Battle Rope Waves: 30 s (RPE 7)
   - Glute Bridge: 15 (steady, clean reps)
   - Suspension Trainer Row / TRX Row: 15 (steady, clean reps)
   - Plate Push: 20 m (moderate plate, fast feet)
OPTIONAL COMPLEMENT [Complement] continuous · RPE 5–6 · ~8.0 min
   One steady rhythm, no programmed recovery. Purpose: easy flush after the harder work (Low Energy).
   - Stationary Bike: 8 min steady (RPE 5-6)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 480 s Stationary Bike (8.0 min, 1 bouts). Loaded reps 105, bodyweight reps 105, impact contacts 0. Active 23.6 min, recovery 4.5 min, transitions 7.0 min, elapsed 47.6 min (duty 0.84). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 28.

BUILT FOR TODAY (consumer text):
- You're irritated but low on energy, so the work is direct and physical (Battle Rope Waves and Plate Push) at an output you can sustain, not maximal efforts. You're advanced, so the session carries more output: circuit rounds with the main block to RPE 7. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Advanced dosing: station targets and 45 s between rounds are set for your level.
- 7 rounds of 4 stations: Battle Rope Waves, Glute Bridge, Suspension Trainer Row / TRX Row and Plate Push.
- Plus a short complement block, about 48 minutes in all.
- Target effort for the main block is RPE 6–7.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=irritated] Battle Rope Waves (vs no-State build); Glute Bridge (vs no-State build); Suspension Trainer Row (vs no-State build); Plate Push (vs no-State build)
- [state=low_energy] circuit RPE 7–8 → 6–7; Battle Rope Waves (vs no-State build); Glute Bridge (vs no-State build); Suspension Trainer Row (vs no-State build); Plate Push (vs no-State build)
- [experience] duty cycle 84% (dense)
- [goal] duty cycle 84%: the session keeps moving
- [archetype] Circuit (your choice)
- [structure] circuit rounds: 7 rounds × 4 stations, 45 s between rounds; complement: steady (8 min)
- Coherence irritated: PASS
- Coherence low_energy: PASS

REALIZED PERSONALIZATION (contract):
- state = irritated (expression: hard_simple) → intended: direct_cathartic_output → realized: Battle Rope Waves (vs no-State build); Glute Bridge (vs no-State build); Suspension Trainer Row (vs no-State build); Plate Push (vs no-State build)
- state = low_energy (expression: lighter) → intended: keep_moving_lower_intensity_and_systemic_cost → realized: circuit RPE 7–8 → 6–7; Battle Rope Waves (vs no-State build); Glute Bridge (vs no-State build); Suspension Trainer Row (vs no-State build); Plate Push (vs no-State build)
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: duty cycle 84% (dense)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 84%: the session keeps moving
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = rounds → intended: conditioning_structure_and_dose → realized: circuit rounds: 7 rounds × 4 stations, 45 s between rounds; complement: steady (8 min)
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 47.6 min for a 60-minute window (23.6 active, 4.5 recovery, 7.0 transitions); main block stimulus: sufficient (score 19.1 vs 18.9 / 28.8); primary +1 unit (stimulus below sufficient); primary +1 unit (stimulus below sufficient); 1 min technique and setup before round 1
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 19.1 vs sufficient 18.9 / substantial 28.8; main block 15.6 active min at RPE 6–7, 105 loaded reps, 0.0 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
State coherence: irritated PASS · low_energy PASS
Engine trace: rule irritated_tools_low_energy_intensity | rule irritated_tools_low_energy_intensity | fill: primary +1 unit (stimulus below sufficient) | fill: primary +1 unit (stimulus below sufficient) | complement kept: easy flush after the harder work (Low Energy) (8.0 min) | fill: 1 min technique and setup before round 1 | irritated: attempt 0 'hard_simple' realized ['exercises'] → satisfied | low_energy: attempt 0 'lighter' realized ['rpe', 'exercises'] → satisfied | elapsed 47.6 min accepted (window [48, 60], main block sufficient)

### C5 Amped + Bored · Hybrid · advanced

Context: State(s): amped, bored · level: advanced · goal: lose weight / conditioning · 60 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym · seed `c5|2026-10-11`

**Hybrid** · shape **anchor_couplet** · est. 48.3 min (shown as 45–50 min)
```
WARM-UP / PREP 9 min: 9 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Hybrid] anchor_circuit · 6 rounds · 30 s between rounds · RPE 7–8 · ~33.3 min
   First 3 min: set your SkiErg pace and load every station, then start round 1. Every round: SkiErg, then every station. Walk 30 s between rounds.
   - SkiErg: 450 m (RPE 8) [anchor]
   - Devil Press: 10 (light-moderate load, unbroken, short of failure)
   - Med-Ball Slam: 15 (RPE 8)
COOLDOWN 6 min: Easy pace and breathing down.
```
Totals: Total engine dose: 2700 m SkiErg (12.3 min, 6 bouts). Loaded reps 150, bodyweight reps 0, impact contacts 0. Active 21.8 min, recovery 2.5 min, transitions 9.0 min, elapsed 48.3 min (duty 0.9). Anchor share 40%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 3, transitions 36.

BUILT FOR TODAY (consumer text):
- You're amped and bored, so the extra energy goes into a fresh shape (anchor + couplet) with Devil Press and Med-Ball Slam, pushed a notch harder. You're advanced, so the session carries more output: anchor + couplet with the main block to RPE 8. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Advanced dosing: the anchor distance, station targets and 30 s between rounds are set for your level.
- SkiErg 450 m anchors all 6 rounds, followed by 2 stations every round.
- The main block is the whole workout: nothing is added after it. About 48 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=amped] round_rest 45 → 30 s
- [state=bored] SkiErg instead of Row Erg; Devil Press (vs no-State build)
- [experience] main block to RPE 8; duty cycle 90% (dense)
- [goal] duty cycle 90%: the session keeps moving; anchor + couplet shape (conditioning goal weights it up)
- [archetype] Hybrid (your choice)
- [structure] anchor + couplet: 6 rounds: SkiErg 450 m + 2 stations, 30 s between rounds
- Coherence amped: PASS
- Coherence bored: PASS

REALIZED PERSONALIZATION (contract):
- state = amped (expression: denser) → intended: use_readiness_for_output_or_density → realized: round_rest 45 → 30 s
- state = bored (expression: new_modalities) → intended: fresh_engaging_conditioning → realized: SkiErg instead of Row Erg; Devil Press (vs no-State build)
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 8; duty cycle 90% (dense)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 90%: the session keeps moving; anchor + couplet shape (conditioning goal weights it up)
- archetype = sweat_hybrid → intended: conditioning_type_for_today → realized: Hybrid (your choice)
- structure = anchor_couplet → intended: conditioning_structure_and_dose → realized: anchor + couplet: 6 rounds: SkiErg 450 m + 2 stations, 30 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 48.3 min for a 60-minute window (21.8 active, 2.5 recovery, 9.0 transitions); main block stimulus: substantial (score 36.5 vs 21.0 / 32.0); 3 min technique and setup before round 1; warm-up +2 min; downshift +1 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: substantial (score 36.5 vs sufficient 21.0 / substantial 32.0; main block 21.8 active min at RPE 7–8, 150 loaded reps, 12.3 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
State coherence: amped PASS · bored PASS
Engine trace: fill: 3 min technique and setup before round 1 | fill: warm-up +2 min | fill: downshift +1 min | amped: attempt 0 'denser' realized ['recovery'] → satisfied | bored: attempt 0 'new_modalities' realized ['modality', 'exercises'] → satisfied

### C6 Irritated + Stressed · Hybrid · intermediate

Context: State(s): irritated, stressed · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym · seed `c6|2026-10-11`

**Hybrid** · shape **anchor_couplet** · est. 48.6 min (shown as 45–50 min)
```
WARM-UP / PREP 8 min: 8 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Hybrid] anchor_circuit · 6 rounds · 75 s between rounds · RPE 8–8 · ~35.6 min
   First 2 min: set your Row Erg pace and load every station, then start round 1. Every round: Row Erg, then every station. Walk 75 s between rounds.
   - Row Erg: 450 m (RPE 8) [anchor]
   - Burpee: 10 (RPE 8, quick and clean)
   - Dumbbell Push Press: 16 (light-moderate load, unbroken, short of failure)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 2700 m Row Erg (12.4 min, 6 bouts). Loaded reps 96, bodyweight reps 60, impact contacts 18. Active 21.4 min, recovery 6.2 min, transitions 8.0 min, elapsed 48.6 min (duty 0.77). Anchor share 42%. Hard (RPE 8+) 12.4 min (58%), all-out blocks 0, stations 3, transitions 32.

BUILT FOR TODAY (consumer text):
- You're irritated and stressed, so this is hard, simple work on the Row Erg in a shape you can settle into: nothing fiddly, nothing frantic, just output. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: the anchor distance, station targets and 75 s between rounds are set for your level.
- Row Erg 450 m anchors all 6 rounds, followed by 2 stations every round.
- The main block is the whole workout: nothing is added after it. About 49 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=irritated] block RPE 7–8 → 8–8
- [state=stressed] round_rest 60 → 75 s
- [goal] duty cycle 77%: the session keeps moving; anchor + couplet shape (conditioning goal weights it up)
- [archetype] Hybrid (your choice)
- [structure] anchor + couplet: 6 rounds: Row Erg 450 m + 2 stations, 75 s between rounds
- Coherence irritated: PASS
- Coherence stressed: PASS

REALIZED PERSONALIZATION (contract):
- state = irritated (expression: hard_simple) → intended: direct_cathartic_output → realized: block RPE 7–8 → 8–8
- state = stressed (expression: controlled_pace) → intended: rhythmic_predictable_conditioning → realized: round_rest 60 → 75 s
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 77%: the session keeps moving; anchor + couplet shape (conditioning goal weights it up)
- archetype = sweat_hybrid → intended: conditioning_type_for_today → realized: Hybrid (your choice)
- structure = anchor_couplet → intended: conditioning_structure_and_dose → realized: anchor + couplet: 6 rounds: Row Erg 450 m + 2 stations, 75 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 48.6 min for a 60-minute window (21.4 active, 6.2 recovery, 8.0 transitions); main block stimulus: substantial (score 32.7 vs 18.0 / 27.0); 2 min technique and setup before round 1; warm-up +1 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: substantial (score 32.7 vs sufficient 18.0 / substantial 27.0; main block 21.4 active min at RPE 8–8, 96 loaded reps, 12.4 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
State coherence: irritated PASS · stressed PASS
Engine trace: rule irritated_direct_stressed_calm | rule irritated_direct_stressed_calm | fill: 2 min technique and setup before round 1 | fill: warm-up +1 min | irritated: attempt 0 'hard_simple' realized ['rpe'] → satisfied | stressed: attempt 0 'fixed_rounds' realized [] → NOT satisfied | stressed: fallback fixed_rounds → steady_cyclical | irritated: attempt 1 'hard_simple' realized ['rpe'] → satisfied | stressed: attempt 1 'steady_cyclical' realized [] → NOT satisfied | stressed: fallback steady_cyclical → controlled_pace | irritated: attempt 2 'hard_simple' realized ['rpe'] → satisfied | stressed: attempt 2 'controlled_pace' realized ['recovery'] → satisfied

## D. Level, goal, Target, soreness, equipment

### D1 Beginner · Amped · Hybrid (beginner rules: RPE ≤ 8, no finisher, recovery ≥ work)

Context: State(s): amped · level: beginner · goal: lose weight / conditioning · 60 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym · seed `d1|2026-10-11`

**Hybrid** · shape **split_anchor** · est. 48.0 min (shown as 45–50 min)
```
WARM-UP / PREP 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Hybrid] anchor_circuit · 4 rounds · 60 s between rounds · RPE 7–8 · ~36.0 min
   Every round: Row Erg, then every station. Walk 60 s between rounds.
   - Row Erg: 650 m (RPE 8) [anchor]
   - Skater Hops: 12/side (RPE 8, quick and clean)
   - Med-Ball Slam: 13 (RPE 8)
   - Dumbbell Push Press: 16 (light-moderate load, unbroken, short of failure)
   - Front-Rack Carry: 60 m (moderate-heavy, stay tall)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 2600 m Row Erg (14.8 min, 4 bouts). Loaded reps 116, bodyweight reps 96, impact contacts 28. Active 27.0 min, recovery 3.0 min, transitions 6.0 min, elapsed 48.0 min (duty 0.9). Anchor share 45%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 24.

BUILT FOR TODAY (consumer text):
- You're amped, so that readiness goes into less downtime between efforts on the Row Erg. As a newer athlete you get a predictable structure, no high-impact work and an effort that leaves something in reserve. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Beginner dosing: the anchor distance, station targets and 60 s between rounds are set for your level.
- Row Erg 650 m anchors all 4 rounds, followed by 4 stations every round.
- The main block is the whole workout: nothing is added after it. About 48 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=amped] round_rest 75 → 60 s
- [experience] RPE capped at 8; no high-impact movement; 4 stations in the main block; predictable structure (no EMOM / ladder / pyramid)
- [goal] duty cycle 90%: the session keeps moving
- [archetype] Hybrid (your choice)
- [structure] split anchor: 4 rounds: Row Erg 650 m + 4 stations, 60 s between rounds
- Coherence amped: PASS

REALIZED PERSONALIZATION (contract):
- state = amped (expression: denser) → intended: use_readiness_for_output_or_density → realized: round_rest 75 → 60 s
- experience = beginner → intended: match_conditioning_vocabulary_to_level → realized: RPE capped at 8; no high-impact movement; 4 stations in the main block; predictable structure (no EMOM / ladder / pyramid)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 90%: the session keeps moving
- archetype = sweat_hybrid → intended: conditioning_type_for_today → realized: Hybrid (your choice)
- structure = split_anchor → intended: conditioning_structure_and_dose → realized: split anchor: 4 rounds: Row Erg 650 m + 4 stations, 60 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 48.0 min for a 60-minute window (27.0 active, 3.0 recovery, 6.0 transitions); main block stimulus: substantial (score 43.2 vs 14.0 / 22.0); primary +1 round; anchor bout 550 → 650 distance
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: substantial (score 43.2 vs sufficient 14.0 / substantial 22.0; main block 27.0 active min at RPE 7–8, 116 loaded reps, 14.8 engine min)
WORKLOAD BUDGET: limits (beginner, 60 min): engine ≤ 26 min, engine share ≤ 75%, anchor share ≤ 45%, hard ≤ 30% of active once past 8 min, loaded reps ≤ 200, impact contacts ≤ 50, loaded hinges ≤ 1, stations ≤ 6, all-out blocks ≤ 0. Within budget.
State coherence: amped PASS
Engine trace: fill: primary +1 round | fill: anchor bout 550 → 650 distance | amped: attempt 0 'harder_output' realized [] → NOT satisfied | amped: fallback harder_output → denser | amped: attempt 1 'denser' realized ['recovery'] → satisfied

### D2 Advanced · Irritated · Circuit · build strength

Context: State(s): irritated · level: advanced · goal: build strength · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `d2|2026-10-11`

**Circuit** · shape **rounds** · est. 48.4 min (shown as 45–50 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] circuit · 6 rounds · 45 s between rounds · RPE 7–8 · ~26.6 min
   6 rounds, moving station to station; rest 45 s after each round.
   - Air Bike / Assault Bike: 12 cal (RPE 8)
   - Kettlebell Swing: 15 (moderate, crisp hips (RPE <= 8))
   - Dumbbell Push Press: 15 (light-moderate load, unbroken, short of failure)
   - Sled Rope Pull: 20 m (heavy, steady)
FINISHER [Finisher] finisher · 6 rounds · 6 x 20s work / 40s recovery · RPE 9–9 · ~5.3 min
   All-out efforts with easy recovery between.
   - Battle Rope Waves: 6 × 20 s / 40 s easy (RPE 9)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 72 cal Air Bike (4.5 min, 6 bouts). Loaded reps 180, bodyweight reps 0, impact contacts 0. Active 18.8 min, recovery 7.1 min, transitions 6.0 min, elapsed 48.4 min (duty 0.73). Hard (RPE 8+) 2.0 min (11%), all-out blocks 1, stations 5, transitions 24.

BUILT FOR TODAY (consumer text):
- You're irritated, so that energy gets somewhere physical to go: Kettlebell Swing, Dumbbell Push Press and Sled Rope Pull around the Air Bike. The movements stay simple so you can focus on output, not coordination. Since you're advanced, the density is higher and the main block runs to RPE 8. Your strength goal shows up as loaded work inside the conditioning: Kettlebell Swing and Dumbbell Push Press; the session stays Sweat.
- Advanced dosing: station targets and 45 s between rounds are set for your level.
- 6 rounds of 4 stations: Air Bike / Assault Bike, Kettlebell Swing, Dumbbell Push Press and Sled Rope Pull.
- Plus a short finisher block, about 48 minutes in all.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to build strength; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=irritated] circuit rounds instead of timed circuit; Kettlebell Swing (vs no-State build); Battle Rope Waves (vs no-State build); finisher added
- [experience] main block to RPE 8
- [goal] loaded carries / sleds inside the conditioning: Sled Rope Pull
- [archetype] Circuit (your choice)
- [structure] circuit rounds: 6 rounds × 4 stations, 45 s between rounds; finisher: Battle Rope Waves
- Coherence irritated: PASS

REALIZED PERSONALIZATION (contract):
- state = irritated (expression: direct_finisher) → intended: direct_cathartic_output → realized: circuit rounds instead of timed circuit; Kettlebell Swing (vs no-State build); Battle Rope Waves (vs no-State build); finisher added
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 8
- goal = build_strength → intended: loaded_carries_and_sleds_conditioning_first → realized: loaded carries / sleds inside the conditioning: Sled Rope Pull
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = rounds → intended: conditioning_structure_and_dose → realized: circuit rounds: 6 rounds × 4 stations, 45 s between rounds; finisher: Battle Rope Waves
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 48.4 min for a 60-minute window (18.8 active, 7.1 recovery, 6.0 transitions); main block stimulus: sufficient (score 27.8 vs 21.0 / 32.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation)
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 27.8 vs sufficient 21.0 / substantial 32.0; main block 16.8 active min at RPE 7–8, 180 loaded reps, 4.5 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
State coherence: irritated PASS
Engine trace: fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | irritated: attempt 0 'direct_finisher' realized ['shape', 'exercises', 'finisher'] → satisfied

### D3 Goal feel better · Stressed · MOOD's Pick · intermediate

Context: State(s): stressed · level: intermediate · goal: feel better / reduce stress · 60 min · MOOD's Pick · soreness: none · equipment: commercial_gym · seed `d3|2026-10-11`

**Circuit** · shape **rounds** · est. 42.7 min (shown as 40–45 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] circuit · 7 rounds · 60 s between rounds · RPE 7–7 · ~24.7 min
   7 rounds, moving station to station; rest 60 s after each round.
   - Burpee: 8 (RPE 7, quick and clean)
   - Dumbbell Romanian Deadlift: 15 (moderate, crisp hips (RPE <= 8))
   - Push-Up: 12 (steady, clean reps)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 105, bodyweight reps 140, impact contacts 16. Active 13.4 min, recovery 6.0 min, transitions 5.2 min, elapsed 42.7 min (duty 0.69). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 3, transitions 21.

BUILT FOR TODAY (consumer text):
- You're stressed, so the session runs in fixed, repeatable rounds of Burpee, Dumbbell Romanian Deadlift and Push-Up at a controlled effort: settle in and just work, no clock to race. Your feel-better goal keeps the work rhythmic and sustainable.
- Intermediate dosing: station targets and 60 s between rounds are set for your level.
- 7 rounds of 3 stations: Burpee, Dumbbell Romanian Deadlift and Push-Up.
- One main block, about 43 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7.
- MOOD's Pick orders Circuit, Engine and Hybrid for your goal to feel better and manage stress.

WHY THIS FITS TODAY (trainer reasoning):
- [state=stressed] circuit RPE 7–8 → 7–7; circuit rounds instead of EMOM
- [goal] circuit rounds shape: rhythmic, sustainable; nothing above RPE 8
- [archetype] Circuit (MOOD's Pick: goal rotation, least recently used, State affinity)
- [structure] circuit rounds: 7 rounds × 3 stations, 60 s between rounds
- Coherence stressed: PASS

REALIZED PERSONALIZATION (contract):
- state = stressed (expression: fixed_rounds) → intended: rhythmic_predictable_conditioning → realized: circuit RPE 7–8 → 7–7; circuit rounds instead of EMOM
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = feel_better_reduce_stress → intended: rhythmic_sustainable_work → realized: circuit rounds shape: rhythmic, sustainable; nothing above RPE 8
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (MOOD's Pick: goal rotation, least recently used, State affinity)
- structure = rounds → intended: conditioning_structure_and_dose → realized: circuit rounds: 7 rounds × 3 stations, 60 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 42.7 min for a 60-minute window (13.4 active, 6.0 recovery, 5.2 transitions); main block stimulus: sufficient (score 19.9 vs 18.0 / 27.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 19.9 vs sufficient 18.0 / substantial 27.0; main block 13.4 active min at RPE 7–7, 105 loaded reps, 0.0 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
State coherence: stressed PASS
Engine trace: fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | stressed: attempt 0 'fixed_rounds' realized ['rpe', 'shape'] → satisfied | elapsed 42.7 min accepted (window [48, 60], main block sufficient)

### D4 Goal improve athleticism · Amped · MOOD's Pick · advanced

Context: State(s): amped · level: advanced · goal: improve athleticism · 60 min · MOOD's Pick · soreness: none · equipment: commercial_gym · seed `d4|2026-10-11`

**Circuit** · shape **emom** · est. 42.0 min (shown as 40–45 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] emom · 6 rounds · 24 min · RPE 7–8 · ~24.0 min
   Every minute on the minute for 24 min: one station per minute, rest the remainder of the minute.
   - Box Jump: 13 (RPE 8, quick and clean)
   - Dumbbell Snatch: 7/side (light-moderate load, unbroken, short of failure)
   - Dumbbell Push Press: 15 (light-moderate load, unbroken, short of failure)
   - Med-Ball Slam: 13 (RPE 8)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 330, bodyweight reps 0, impact contacts 23. Active 15.5 min, recovery 8.5 min, transitions 0.0 min, elapsed 42.0 min (duty 0.64). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 4, transitions 0.

BUILT FOR TODAY (consumer text):
- You're amped, so that readiness goes into more output. You're advanced, so the session can carry more output without every round becoming all-out. Your athleticism goal is why the output tools (Box Jump, Dumbbell Snatch and Dumbbell Push Press) are in here.
- Advanced dosing: station targets are set for your level.
- EMOM for 24 min, one station per minute: Box Jump, Dumbbell Snatch, Dumbbell Push Press and Med-Ball Slam.
- One main block, about 42 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- MOOD's Pick orders Circuit, Engine and Hybrid for your goal to improve athleticism.

WHY THIS FITS TODAY (trainer reasoning):
- [state=amped] EMOM instead of circuit rounds
- [experience] main block to RPE 8; EMOM shape
- [goal] power and output tools: Box Jump, Med-Ball Slam
- [archetype] Circuit (MOOD's Pick: goal rotation, least recently used, State affinity)
- [structure] EMOM: EMOM 24 min
- Coherence amped: PASS

REALIZED PERSONALIZATION (contract):
- state = amped (expression: denser) → intended: use_readiness_for_output_or_density → realized: EMOM instead of circuit rounds
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 8; EMOM shape
- goal = improve_athleticism → intended: powerful_output_sleds_carries_intervals → realized: power and output tools: Box Jump, Med-Ball Slam
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (MOOD's Pick: goal rotation, least recently used, State affinity)
- structure = emom → intended: conditioning_structure_and_dose → realized: EMOM: EMOM 24 min
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 42.0 min for a 60-minute window (15.5 active, 8.5 recovery, 0.0 transitions); main block stimulus: sufficient (score 31.4 vs 21.0 / 32.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 31.4 vs sufficient 21.0 / substantial 32.0; main block 15.5 active min at RPE 7–8, 330 loaded reps, 0.0 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
State coherence: amped PASS
Engine trace: fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | amped: attempt 0 'denser' realized ['shape'] → satisfied | elapsed 42.0 min accepted (window [48, 60], main block sufficient)

### D5 Custom Target chest + shoulders · Bored · intermediate (routes to Circuit)

Context: State(s): bored · level: intermediate · goal: lose weight / conditioning · 60 min · Custom Target: chest + shoulders · soreness: none · equipment: commercial_gym · seed `d5|2026-10-11`

**Circuit** · shape **rounds** · est. 48.2 min (shown as 45–50 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] circuit · 6 rounds · 60 s between rounds · RPE 7–8 · ~25.9 min
   6 rounds, moving station to station; rest 60 s after each round.
   - Battle Rope Waves: 30 s (RPE 8)
   - Dumbbell Floor Press: 15 (light-moderate load, unbroken, short of failure)
   - Suspension Trainer Row / TRX Row: 15 (steady, clean reps)
   - Plate Push: 20 m (moderate plate, fast feet)
OPTIONAL COMPLEMENT [Complement] ladder · RPE 7–8 · ~4.8 min
   Alternate the exercises at each rung, self-paced: 10-8-6-4-2 reps. Purpose: a change of stimulus after the circuit (Bored).
   - Med-Ball Slam: Ladder 10-8-6-4-2 (RPE 8)
   - Devil Press: Ladder 10-8-6-4-2 (light-moderate load, unbroken, short of failure)
COOLDOWN 6 min: Easy pace and breathing down.
```
Totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 240, bodyweight reps 0, impact contacts 0. Active 18.9 min, recovery 5.0 min, transitions 6.8 min, elapsed 48.2 min (duty 0.79). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 6, transitions 27.

BUILT FOR TODAY (consumer text):
- You're bored, so we're changing the experience with movements you haven't seen recently (Battle Rope Waves, Dumbbell Floor Press and Plate Push). The workload stays controlled; the novelty comes from how the session unfolds, not from random extra work. You asked for chest + shoulders, so the stations lean that way. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: station targets and 60 s between rounds are set for your level.
- The circuit stations are weighted toward chest + shoulders.
- 6 rounds of 4 stations: Battle Rope Waves, Dumbbell Floor Press, Suspension Trainer Row / TRX Row and Plate Push.
- Plus a short complement block, about 48 minutes in all.
- Target effort for the main block is RPE 7–8.

WHY THIS FITS TODAY (trainer reasoning):
- [state=bored] Dumbbell Floor Press (vs no-State build); Plate Push (vs no-State build); Med-Ball Slam (vs no-State build); Devil Press (vs no-State build)
- [goal] duty cycle 79%: the session keeps moving
- [target] stations lean into chest + shoulders: Battle Rope Waves, Dumbbell Floor Press, Suspension Trainer Row, Plate Push
- [archetype] Circuit (Target routes to Circuit)
- [structure] circuit rounds: 6 rounds × 4 stations, 60 s between rounds; complement: couplet_ladder (5 min)
- Coherence bored: PASS

REALIZED PERSONALIZATION (contract):
- state = bored (expression: new_structure) → intended: fresh_engaging_conditioning → realized: Dumbbell Floor Press (vs no-State build); Plate Push (vs no-State build); Med-Ball Slam (vs no-State build); Devil Press (vs no-State build)
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 79%: the session keeps moving
- target = ['chest', 'shoulders'] → intended: route_station_selection_keep_sweat_identity → realized: stations lean into chest + shoulders: Battle Rope Waves, Dumbbell Floor Press, Suspension Trainer Row, Plate Push
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (Target routes to Circuit)
- structure = rounds → intended: conditioning_structure_and_dose → realized: circuit rounds: 6 rounds × 4 stations, 60 s between rounds; complement: couplet_ladder (5 min)
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 48.2 min for a 60-minute window (18.9 active, 5.0 recovery, 6.8 transitions); main block stimulus: sufficient (score 25.3 vs 18.0 / 27.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +1 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 25.3 vs sufficient 18.0 / substantial 27.0; main block 14.8 active min at RPE 7–8, 180 loaded reps, 0.0 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
State coherence: bored PASS
Engine trace: target_routed_circuit: ['chest', 'front_delts', 'rear_delts', 'shoulders', 'side_delts'] | complement kept: a change of stimulus after the circuit (Bored) (4.8 min) | finisher skipped: one secondary element maximum | fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +1 min | bored: attempt 0 'new_structure' realized ['exercises'] → satisfied

### D6 Custom Target quads + glutes with sore lower back · intermediate

Context: State(s): none · level: intermediate · goal: lose weight / conditioning · 60 min · Custom Target: quads + glutes · soreness: lower_back · equipment: commercial_gym · seed `d6|2026-10-11`

**Circuit** · shape **rounds** · est. 44.2 min (shown as 40–45 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] circuit · 5 rounds · 60 s between rounds · RPE 7–8 · ~26.2 min
   5 rounds, moving station to station; rest 60 s after each round.
   - Sled Push: 20 m (heavy, steady)
   - Box Step-Up (Glute Bias): 10/side (light-moderate load, unbroken, short of failure)
   - Kickstand Dumbbell RDL: 10/side (moderate, crisp hips (RPE <= 8))
   - Front-Rack Carry: 40 m (moderate-heavy, stay tall)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 200, bodyweight reps 0, impact contacts 0. Active 17.2 min, recovery 4.0 min, transitions 5.0 min, elapsed 44.2 min (duty 0.81). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 4, transitions 20.

BUILT FOR TODAY (consumer text):
- Your lower back is sore, so every station keeps that area out of the loading. You asked for quads + glutes, so the stations lean that way. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: station targets and 60 s between rounds are set for your level.
- The circuit stations are weighted toward quads + glutes.
- 5 rounds of 4 stations: Sled Push, Box Step-Up (Glute Bias), Kickstand Dumbbell RDL and Front-Rack Carry.
- The main block is the whole workout: nothing is added after it. About 44 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.

WHY THIS FITS TODAY (trainer reasoning):
- [soreness] no station loads the sore spinal_erectors directly
- [goal] duty cycle 81%: the session keeps moving
- [target] stations lean into quads + glutes: Sled Push, Box Step-Up (Glute Bias), Kickstand Dumbbell RDL, Front-Rack Carry
- [archetype] Circuit (Target routes to Circuit)
- [structure] circuit rounds: 5 rounds × 4 stations, 60 s between rounds

REALIZED PERSONALIZATION (contract):
- soreness = ['spinal_erectors'] → intended: protect_sore_region → realized: no station loads the sore spinal_erectors directly
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 81%: the session keeps moving
- target = ['quads', 'glutes'] → intended: route_station_selection_keep_sweat_identity → realized: stations lean into quads + glutes: Sled Push, Box Step-Up (Glute Bias), Kickstand Dumbbell RDL, Front-Rack Carry
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (Target routes to Circuit)
- structure = rounds → intended: conditioning_structure_and_dose → realized: circuit rounds: 5 rounds × 4 stations, 60 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 44.2 min for a 60-minute window (17.2 active, 4.0 recovery, 5.0 transitions); main block stimulus: substantial (score 28.8 vs 18.0 / 27.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: substantial (score 28.8 vs sufficient 18.0 / substantial 27.0; main block 17.2 active min at RPE 7–8, 200 loaded reps, 0.0 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
Engine trace: target_routed_circuit: ['glutes', 'quads'] | fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | elapsed 44.2 min accepted (window [48, 60], main block substantial)

### D7 Sore legs · Hybrid (user-selected) · intermediate (conflict envelope, never a silent override)

Context: State(s): none · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_hybrid · soreness: legs · equipment: commercial_gym · seed `d7|2026-10-11`

CONFLICT ENVELOPE (options shown to the user): sore_target_conflict: Your sore areas block a credible session for this choice today. options [{'action': 'change_target', 'label': 'Change Target', 'patch': None}, {'action': 'moods_pick', 'label': 'Let MOOD pick', 'patch': {'target': None, 'archetype': None}}, {'action': 'switch_direction', 'label': 'Try Strength', 'patch': {'direction': 'strength', 'target': None, 'archetype': None}}, {'action': 'switch_direction', 'label': 'Try Athletic', 'patch': {'direction': 'athletic', 'target': None, 'archetype': None}}, {'action': 'cancel', 'label': 'Cancel', 'patch': None}]

### D8 Minimal equipment · Bored · MOOD's Pick · intermediate

Context: State(s): bored · level: intermediate · goal: lose weight / conditioning · 60 min · MOOD's Pick · soreness: none · equipment: minimal · seed `d8|2026-10-11`

**Engine** · shape **pyramid** · est. 30.7 min (shown as about 30 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Engine] pyramid · steps 0:30-0:45-0:45-0:45-0:30 with 20s easy · RPE 8–9 · ~4.6 min
   Work steps with 20 s easy between.
   - Jump Rope: Pyramid 30 s-45 s-45 s-45 s-30 s (RPE 8-9; hold output across steps)
OPTIONAL COMPLEMENT [Complement] circuit · 2 rounds · 45 s between rounds · RPE 6–7 · ~6.6 min
   2 rounds, moving station to station; rest 45 s after each round. Purpose: main block alone is below a sufficient stimulus.
   - Devil Press: 8 (light-moderate load, unbroken, short of failure)
   - Dumbbell Floor Press: 15 (light-moderate load, unbroken, short of failure)
   - Front-Rack Carry: 40 m (moderate-heavy, stay tall)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: 195 s Jump Rope (3.2 min, 1 bouts). Loaded reps 46, bodyweight reps 0, impact contacts 0. Active 7.6 min, recovery 2.1 min, transitions 1.5 min, elapsed 30.7 min (duty 0.79). Hard (RPE 8+) 3.2 min (43%), all-out blocks 0, stations 4, transitions 6.

BUILT FOR TODAY (consumer text):
- You're bored, so we're changing the experience with a pyramid structure. The workload stays controlled; the novelty comes from how the session unfolds, not from random extra work. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- This session is complete at about 31 min. Quality over filler.
- Built around the equipment you have.
- Intermediate dosing: 5 pyramid steps up to 0 min, output held across the steps.
- A 0:30-0:45-0:45-0:45-0:30 minute pyramid on the Jump Rope, 20 s easy between steps.
- Plus a short complement block, about 31 minutes in all.

WHY THIS FITS TODAY (trainer reasoning):
- [state=bored] 16 x 40 s → pyramid 30-45-45-45-30; pyramid instead of short intervals; Devil Press (vs no-State build); Dumbbell Floor Press (vs no-State build); Front-Rack Carry (vs no-State build)
- [experience] pyramid (intermediate and up)
- [goal] duty cycle 79%: the session keeps moving
- [archetype] Engine (MOOD's Pick: goal rotation, least recently used, State affinity)
- [structure] pyramid: pyramid 0:30-0:45-0:45-0:45-0:30 with 20 s easy; complement: fixed_circuit (7 min)
- Coherence bored: PASS

REALIZED PERSONALIZATION (contract):
- state = bored (expression: changing_intervals) → intended: fresh_engaging_conditioning → realized: 16 x 40 s → pyramid 30-45-45-45-30; pyramid instead of short intervals; Devil Press (vs no-State build); Dumbbell Floor Press (vs no-State build); Front-Rack Carry (vs no-State build)
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: pyramid (intermediate and up)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 79%: the session keeps moving
- archetype = sweat_engine → intended: conditioning_type_for_today → realized: Engine (MOOD's Pick: goal rotation, least recently used, State affinity)
- structure = pyramid → intended: conditioning_structure_and_dose → realized: pyramid: pyramid 0:30-0:45-0:45-0:45-0:30 with 20 s easy; complement: fixed_circuit (7 min)
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 30.7 min for a 60-minute window (7.6 active, 2.1 recovery, 1.5 transitions); main block stimulus: insufficient (score 4.2 vs 18.0 / 27.0); warm-up +3 min (movement preparation); downshift +3 min
- equipment = db_bodyweight_only → intended: availability_only → realized: sweat_hybrid
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: insufficient (score 4.2 vs sufficient 18.0 / substantial 27.0; main block 3.2 active min at RPE 8–9, 0 loaded reps, 3.2 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
State coherence: bored PASS
Engine trace: complement kept: main block alone is below a sufficient stimulus (6.6 min) | finisher skipped: hard main block | fill: warm-up +3 min (movement preparation) | fill: downshift +3 min | bored: attempt 0 'changing_intervals' realized ['structure', 'shape', 'exercises'] → satisfied | elapsed 30.7 min accepted (window [48, 60], main block insufficient)

### D9 Free-weight limited · Low Energy · Circuit · beginner

Context: State(s): low_energy · level: beginner · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: free_weight_limited · seed `d9|2026-10-11`

**Circuit** · shape **timed** · est. 52.0 min (shown as 50–55 min)
```
WARM-UP / PREP 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] timed_circuit · 5 rounds · 5 x 45s work / 45s recovery · 45 s between rounds · RPE 6–7 · ~35.7 min
   45 s work / 45 s rest per station, rotate through all stations; 5 rounds.
   - Farmer Carry: 35 s (heavy, steady)
   - Glute Bridge: 35 s (steady, clean reps)
   - Bench Dip: 35 s (light-moderate load, unbroken, short of failure)
   - Dead Bug: 35 s (steady, clean reps)
OPTIONAL COMPLEMENT [Complement] circuit · 2 rounds · 60 s between rounds · RPE 6–7 · ~3.9 min
   2 rounds, moving station to station; rest 60 s after each round. Purpose: easy flush after the harder work (Low Energy).
   - Decline Sit-Up: 12 (light-moderate load, unbroken, short of failure)
   - Push-Up: 8 (steady, clean reps)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 24, bodyweight reps 16, impact contacts 0. Active 16.9 min, recovery 19.0 min, transitions 2.7 min, elapsed 52.0 min (duty 0.47). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 6, transitions 10.

BUILT FOR TODAY (consumer text):
- You're low on energy, so today's circuit stays simple and sustainable: Farmer Carry, Glute Bridge, Bench Dip and Dead Bug at RPE 6–7, with fewer hard peaks. You'll keep moving, but nothing here asks you to empty the tank. As a newer athlete you get a predictable structure, no high-impact work and an effort that leaves something in reserve. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Built around the equipment you have.
- Beginner dosing: 45 s work and 45 s rest per station.
- 5 rounds of 45 s work / 45 s easy on Farmer Carry, Glute Bridge, Bench Dip and Dead Bug.
- Plus a short complement block, about 52 minutes in all.
- Target effort for the main block is RPE 6–7.

WHY THIS FITS TODAY (trainer reasoning):
- [state=low_energy] circuit RPE 7–8 → 6–7; 35/25 → 45/30; impact items 1 → 0
- [experience] RPE capped at 7; no high-impact movement; 4 stations in the main block; predictable structure (no EMOM / ladder / pyramid)
- [goal] timed circuit shape (conditioning goal weights it up)
- [archetype] Circuit (your choice)
- [structure] timed circuit: 5 rounds × 4 stations at 45 s / 45 s; complement: fixed_circuit (4 min)
- Coherence low_energy: PASS
- Budget repair: impact_item_swapped jumping_jack → dead_bug

REALIZED PERSONALIZATION (contract):
- state = low_energy (expression: steadier) → intended: keep_moving_lower_intensity_and_systemic_cost → realized: circuit RPE 7–8 → 6–7; 35/25 → 45/30; impact items 1 → 0
- experience = beginner → intended: match_conditioning_vocabulary_to_level → realized: RPE capped at 7; no high-impact movement; 4 stations in the main block; predictable structure (no EMOM / ladder / pyramid)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: timed circuit shape (conditioning goal weights it up)
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = timed → intended: conditioning_structure_and_dose → realized: timed circuit: 5 rounds × 4 stations at 45 s / 45 s; complement: fixed_circuit (4 min)
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 52.0 min for a 60-minute window (16.9 active, 19.0 recovery, 2.7 transitions); main block stimulus: sufficient (score 12.8 vs 12.6 / 19.8); 1 min technique and setup before round 1; warm-up +1 min (movement preparation)
- equipment = free_weight_limited → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 12.8 vs sufficient 12.6 / substantial 19.8; main block 15.0 active min at RPE 6–7, 0 loaded reps, 0.0 engine min)
WORKLOAD BUDGET: limits (beginner, 60 min): engine ≤ 26 min, engine share ≤ 75%, anchor share ≤ 45%, hard ≤ 30% of active once past 8 min, loaded reps ≤ 200, impact contacts ≤ 50, loaded hinges ≤ 1, stations ≤ 6, all-out blocks ≤ 0. Within budget.
State coherence: low_energy PASS
Engine trace: budget_repair: impact_item_swapped jumping_jack→dead_bug | complement kept: easy flush after the harder work (Low Energy) (3.9 min) | fill: 1 min technique and setup before round 1 | fill: warm-up +1 min (movement preparation) | low_energy: attempt 0 'steadier' realized ['rpe', 'bouts', 'impact'] → satisfied

## D2. Workload-quality cases the founder asked for (advanced and intermediate Circuits, Engines, a hard Amped Circuit)

### W1 Circuit · advanced · No State · conditioning

Context: State(s): none · level: advanced · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `w1|2026-10-11`

**Circuit** · shape **emom** · est. 42.0 min (shown as 40–45 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] emom · 6 rounds · 24 min · RPE 7–8 · ~24.0 min
   Every minute on the minute for 24 min: one station per minute, rest the remainder of the minute.
   - Burpee: 8 (RPE 8, quick and clean)
   - Kettlebell Snatch: 8/side (moderate, crisp hips (RPE <= 8))
   - Push-Up: 15 (steady, clean reps)
   - Dumbbell Lateral-Raise Jacks: 40 s (RPE 8, quick and clean)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 96, bodyweight reps 138, impact contacts 110. Active 15.8 min, recovery 8.2 min, transitions 0.0 min, elapsed 42.0 min (duty 0.66). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 4, transitions 0.

BUILT FOR TODAY (consumer text):
- You're advanced, so the session carries more output: EMOM with the main block to RPE 8.
- Advanced dosing: station targets are set for your level.
- EMOM for 24 min, one station per minute: Burpee, Kettlebell Snatch, Push-Up and Dumbbell Lateral-Raise Jacks.
- One main block, about 42 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [experience] main block to RPE 8; EMOM shape
- [archetype] Circuit (your choice)
- [structure] EMOM: EMOM 24 min

REALIZED PERSONALIZATION (contract):
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 8; EMOM shape
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: nothing (no claim made)
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = emom → intended: conditioning_structure_and_dose → realized: EMOM: EMOM 24 min
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 42.0 min for a 60-minute window (15.8 active, 8.2 recovery, 0.0 transitions); main block stimulus: sufficient (score 28.2 vs 21.0 / 32.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 28.2 vs sufficient 21.0 / substantial 32.0; main block 15.8 active min at RPE 7–8, 96 loaded reps, 0.0 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
Engine trace: fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | elapsed 42.0 min accepted (window [48, 60], main block sufficient)

### W2 Circuit · advanced · Amped (hard main block)

Context: State(s): amped · level: advanced · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `w2|2026-10-11`

**Circuit** · shape **timed** · est. 47.9 min (shown as 45–50 min)
```
WARM-UP / PREP 6 min: 6 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Circuit] timed_circuit · 6 rounds · 6 x 45s work / 15s recovery · 45 s between rounds · RPE 7–8 · ~29.8 min
   45 s work / 15 s rest per station, rotate through all stations; 6 rounds.
   - Devil Press: 45 s (light-moderate load, unbroken, short of failure)
   - Kettlebell Snatch: 45 s (moderate, crisp hips (RPE <= 8))
   - Dumbbell Push Press: 45 s (light-moderate load, unbroken, short of failure)
   - Med-Ball Slam: 45 s (RPE 8)
OPTIONAL COMPLEMENT [Complement] intervals · 6 rounds · 6 x 40s work / 20s recovery · RPE 7–8 · ~5.7 min
   Hard intervals on the same machine; easy pace between. Purpose: a short engine piece to round out a station-led circuit.
   - Air Bike / Assault Bike: 6 × 40 s / 20 s easy (RPE 8)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 240 s Air Bike (4.0 min, 6 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 22.0 min, recovery 11.4 min, transitions 2.0 min, elapsed 47.9 min (duty 0.66). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 8.

BUILT FOR TODAY (consumer text):
- You're amped, so that readiness goes into an extra round on the Air Bike. You're advanced, so the session can carry more output without every round becoming all-out. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Advanced dosing: 45 s work and 15 s rest per station.
- 6 rounds of 45 s work / 15 s easy on Devil Press, Kettlebell Snatch, Dumbbell Push Press and Med-Ball Slam.
- Plus a short complement block, about 48 minutes in all.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=amped] 5 rounds → 6 rounds
- [experience] main block to RPE 8
- [goal] timed circuit shape (conditioning goal weights it up)
- [archetype] Circuit (your choice)
- [structure] timed circuit: 6 rounds × 4 stations at 45 s / 15 s; complement: engine_intervals (6 min)
- Coherence amped: PASS
- Budget repair: impact_item_swapped jump_squat → devil_press

REALIZED PERSONALIZATION (contract):
- state = amped (expression: extra_round) → intended: use_readiness_for_output_or_density → realized: 5 rounds → 6 rounds
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 8
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: timed circuit shape (conditioning goal weights it up)
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = timed → intended: conditioning_structure_and_dose → realized: timed circuit: 6 rounds × 4 stations at 45 s / 15 s; complement: engine_intervals (6 min)
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 47.9 min for a 60-minute window (22.0 active, 11.4 recovery, 2.0 transitions); main block stimulus: sufficient (score 26.4 vs 21.0 / 32.0); 1 min technique and setup before round 1
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 26.4 vs sufficient 21.0 / substantial 32.0; main block 18.0 active min at RPE 7–8, 0 loaded reps, 0.0 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
State coherence: amped PASS
Engine trace: budget_repair: impact_item_swapped jump_squat→devil_press | complement kept: a short engine piece to round out a station-led circuit (5.7 min) | finisher skipped: one secondary element maximum | fill: 1 min technique and setup before round 1 | amped: attempt 0 'extra_round' realized ['volume'] → satisfied | elapsed 47.9 min accepted (window [48, 60], main block sufficient)

### W3 Circuit · advanced · Bored · build muscle

Context: State(s): bored · level: advanced · goal: build muscle · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `w3|2026-10-11`

**Circuit** · shape **rounds** · est. 46.7 min (shown as 45–50 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] circuit · 5 rounds · 45 s between rounds · RPE 7–8 · ~23.3 min
   5 rounds, moving station to station; rest 45 s after each round.
   - Plate Push: 20 m (moderate plate, fast feet)
   - Devil Press: 8 (light-moderate load, unbroken, short of failure)
   - Half-Kneeling Single-Arm Landmine Press: 10/side (light-moderate load, unbroken, short of failure)
   - Sled Rope Pull: 20 m (heavy, steady)
OPTIONAL COMPLEMENT [Complement] ladder · RPE 7–8 · ~3.8 min
   Alternate the exercises at each rung, self-paced: 12-10-8-6-4 reps. Purpose: a change of stimulus after the circuit (Bored).
   - Skater Hops: Ladder 12-10-8-6-4 (RPE 8, quick and clean)
   - Med-Ball Slam: Ladder 12-10-8-6-4 (RPE 8)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 180, bodyweight reps 40, impact contacts 12. Active 18.3 min, recovery 3.0 min, transitions 5.8 min, elapsed 46.7 min (duty 0.86). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 6, transitions 23.

BUILT FOR TODAY (consumer text):
- You're bored, so we're changing the experience with movements you haven't seen recently (Plate Push, Devil Press and Half-Kneeling Single-Arm Landmine Press). The workload stays controlled; the novelty comes from how the session unfolds, not from random extra work. Since you're advanced, the density is higher and the main block runs to RPE 8. Your muscle goal is why the resistance stations run at moderate reps, but this stays conditioning first.
- Advanced dosing: station targets and 45 s between rounds are set for your level.
- 5 rounds of 4 stations: Plate Push, Devil Press, Half-Kneeling Single-Arm Landmine Press and Sled Rope Pull.
- Plus a short complement block, about 47 minutes in all.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to build muscle; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=bored] Plate Push (vs no-State build); Devil Press (vs no-State build); Half-Kneeling Single-Arm Landmine Press (vs no-State build); Sled Rope Pull (vs no-State build); Skater Hops (vs no-State build); Med-Ball Slam (vs no-State build)
- [experience] main block to RPE 8; duty cycle 86% (dense)
- [goal] resistance stations for muscular endurance: Devil Press, Half-Kneeling Single-Arm Landmine Press
- [archetype] Circuit (your choice)
- [structure] circuit rounds: 5 rounds × 4 stations, 45 s between rounds; complement: couplet_ladder (4 min)
- Coherence bored: PASS

REALIZED PERSONALIZATION (contract):
- state = bored (expression: new_modalities) → intended: fresh_engaging_conditioning → realized: Plate Push (vs no-State build); Devil Press (vs no-State build); Half-Kneeling Single-Arm Landmine Press (vs no-State build); Sled Rope Pull (vs no-State build); Skater Hops (vs no-State build); Med-Ball Slam (vs no-State build)
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 8; duty cycle 86% (dense)
- goal = build_muscle → intended: muscular_endurance_stations → realized: resistance stations for muscular endurance: Devil Press, Half-Kneeling Single-Arm Landmine Press
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = rounds → intended: conditioning_structure_and_dose → realized: circuit rounds: 5 rounds × 4 stations, 45 s between rounds; complement: couplet_ladder (4 min)
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 46.7 min for a 60-minute window (18.3 active, 3.0 recovery, 5.8 transitions); main block stimulus: sufficient (score 27.9 vs 21.0 / 32.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 27.9 vs sufficient 21.0 / substantial 32.0; main block 15.3 active min at RPE 7–8, 140 loaded reps, 0.0 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
State coherence: bored PASS
Engine trace: complement kept: a change of stimulus after the circuit (Bored) (3.8 min) | finisher skipped: one secondary element maximum | fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | bored: attempt 0 'new_modalities' realized ['exercises'] → satisfied | elapsed 46.7 min accepted (window [48, 60], main block sufficient)

### W4 Circuit · intermediate · No State

Context: State(s): none · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `w4|2026-10-11`

**Circuit** · shape **timed** · est. 47.8 min (shown as 45–50 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] timed_circuit · 5 rounds · 5 x 40s work / 20s recovery · 45 s between rounds · RPE 7–8 · ~24.7 min
   40 s work / 20 s rest per station, rotate through all stations; 5 rounds.
   - Row Erg: 40 s (RPE 8)
   - Kettlebell Snatch: 40 s (moderate, crisp hips (RPE <= 8))
   - Push-Up: 40 s (steady, clean reps)
   - Dumbbell Lateral-Raise Jacks: 40 s (RPE 8, quick and clean)
OPTIONAL COMPLEMENT [Complement] intervals · 6 rounds · 6 x 40s work / 20s recovery · RPE 7–8 · ~5.7 min
   Hard intervals on the same machine; easy pace between. Purpose: a short engine piece to round out a station-led circuit.
   - Air Bike / Assault Bike: 6 × 40 s / 20 s easy (RPE 8)
COOLDOWN 6 min: Easy pace and breathing down.
```
Totals: Total engine dose: 200 s Row Erg, 240 s Air Bike (7.3 min, 11 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 80. Active 17.3 min, recovery 11.3 min, transitions 1.7 min, elapsed 47.8 min (duty 0.6). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 6.

BUILT FOR TODAY (consumer text):
- Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: 40 s work and 20 s rest per station.
- 5 rounds of 40 s work / 20 s easy on Row Erg, Kettlebell Snatch, Push-Up and Dumbbell Lateral-Raise Jacks.
- Plus a short complement block, about 48 minutes in all.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [goal] timed circuit shape (conditioning goal weights it up)
- [archetype] Circuit (your choice)
- [structure] timed circuit: 5 rounds × 4 stations at 40 s / 20 s; complement: engine_intervals (6 min)

REALIZED PERSONALIZATION (contract):
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: timed circuit shape (conditioning goal weights it up)
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = timed → intended: conditioning_structure_and_dose → realized: timed circuit: 5 rounds × 4 stations at 40 s / 20 s; complement: engine_intervals (6 min)
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 47.8 min for a 60-minute window (17.3 active, 11.3 recovery, 1.7 transitions); main block stimulus: sufficient (score 18.8 vs 18.0 / 27.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +1 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 18.8 vs sufficient 18.0 / substantial 27.0; main block 13.3 active min at RPE 7–8, 0 loaded reps, 3.3 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
Engine trace: complement kept: a short engine piece to round out a station-led circuit (5.7 min) | fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +1 min | elapsed 47.8 min accepted (window [48, 60], main block sufficient)

### W5 Circuit · intermediate · Irritated

Context: State(s): irritated · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `w5|2026-10-11`

**Circuit** · shape **timed** · est. 42.7 min (shown as 40–45 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] timed_circuit · 5 rounds · 5 x 40s work / 20s recovery · 45 s between rounds · RPE 8–9 · ~24.7 min
   40 s work / 20 s rest per station, rotate through all stations; 5 rounds.
   - Air Bike / Assault Bike: 40 s (RPE 9)
   - Kettlebell Swing: 40 s (moderate, crisp hips (RPE <= 8))
   - Dumbbell Push Press: 40 s (light-moderate load, unbroken, short of failure)
   - Sled Rope Pull: 40 s (heavy, steady)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: 200 s Air Bike (3.3 min, 5 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 13.3 min, recovery 9.7 min, transitions 1.7 min, elapsed 42.7 min (duty 0.58). Hard (RPE 8+) 13.3 min (100%), all-out blocks 0, stations 4, transitions 6.

BUILT FOR TODAY (consumer text):
- You're irritated, so that energy gets somewhere physical to go: Kettlebell Swing, Dumbbell Push Press and Sled Rope Pull around the Air Bike. The movements stay simple so you can focus on output, not coordination. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: 40 s work and 20 s rest per station.
- 5 rounds of 40 s work / 20 s easy on Air Bike / Assault Bike, Kettlebell Swing, Dumbbell Push Press and Sled Rope Pull.
- One main block, about 43 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 8–9.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=irritated] circuit RPE 7–8 → 8–9; Kettlebell Swing (vs no-State build)
- [goal] timed circuit shape (conditioning goal weights it up)
- [archetype] Circuit (your choice)
- [structure] timed circuit: 5 rounds × 4 stations at 40 s / 20 s
- Coherence irritated: PASS

REALIZED PERSONALIZATION (contract):
- state = irritated (expression: output_tools) → intended: direct_cathartic_output → realized: circuit RPE 7–8 → 8–9; Kettlebell Swing (vs no-State build)
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: timed circuit shape (conditioning goal weights it up)
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = timed → intended: conditioning_structure_and_dose → realized: timed circuit: 5 rounds × 4 stations at 40 s / 20 s
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 42.7 min for a 60-minute window (13.3 active, 9.7 recovery, 1.7 transitions); main block stimulus: sufficient (score 18.8 vs 18.0 / 27.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 18.8 vs sufficient 18.0 / substantial 27.0; main block 13.3 active min at RPE 8–9, 0 loaded reps, 3.3 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
State coherence: irritated PASS
Engine trace: finisher skipped: hard main block | fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | irritated: attempt 0 'output_tools' realized ['rpe', 'exercises'] → satisfied | elapsed 42.7 min accepted (window [48, 60], main block sufficient)

### W6 Circuit · intermediate · Stressed

Context: State(s): stressed · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `w6|2026-10-11`

**Circuit** · shape **rounds** · est. 46.4 min (shown as 45–50 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] circuit · 6 rounds · 75 s between rounds · RPE 7–7 · ~28.4 min
   6 rounds, moving station to station; rest 75 s after each round.
   - Burpee: 8 (RPE 7, quick and clean)
   - Dumbbell Romanian Deadlift: 15 (moderate, crisp hips (RPE <= 8))
   - Push-Up: 12 (steady, clean reps)
   - Farmer Carry: 40 m (heavy, steady)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 90, bodyweight reps 120, impact contacts 14. Active 16.1 min, recovery 6.2 min, transitions 6.0 min, elapsed 46.4 min (duty 0.72). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 4, transitions 24.

BUILT FOR TODAY (consumer text):
- You're stressed, so the session runs in fixed, repeatable rounds of Burpee, Dumbbell Romanian Deadlift, Push-Up and Farmer Carry at a controlled effort: settle in and just work, no clock to race. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: station targets and 75 s between rounds are set for your level.
- 6 rounds of 4 stations: Burpee, Dumbbell Romanian Deadlift, Push-Up and Farmer Carry.
- One main block, about 46 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=stressed] round_rest 60 → 75 s; circuit RPE 7–8 → 7–7; circuit rounds instead of EMOM
- [goal] duty cycle 72%: the session keeps moving
- [archetype] Circuit (your choice)
- [structure] circuit rounds: 6 rounds × 4 stations, 75 s between rounds
- Coherence stressed: PASS

REALIZED PERSONALIZATION (contract):
- state = stressed (expression: controlled_pace) → intended: rhythmic_predictable_conditioning → realized: round_rest 60 → 75 s; circuit RPE 7–8 → 7–7; circuit rounds instead of EMOM
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 72%: the session keeps moving
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = rounds → intended: conditioning_structure_and_dose → realized: circuit rounds: 6 rounds × 4 stations, 75 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 46.4 min for a 60-minute window (16.1 active, 6.2 recovery, 6.0 transitions); main block stimulus: sufficient (score 21.9 vs 18.0 / 27.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 21.9 vs sufficient 18.0 / substantial 27.0; main block 16.1 active min at RPE 7–7, 90 loaded reps, 0.0 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
State coherence: stressed PASS
Engine trace: fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | stressed: attempt 0 'controlled_pace' realized ['recovery', 'rpe', 'shape'] → satisfied | elapsed 46.4 min accepted (window [48, 60], main block sufficient)

### W7 Engine · advanced · No State (long intervals)

Context: State(s): none · level: advanced · goal: improve athleticism · 60 min · archetype: sweat_engine · soreness: none · equipment: commercial_gym · seed `w7|2026-10-11`

**Engine** · shape **pyramid** · est. 45.0 min (shown as about 45 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Engine] pyramid · steps 1:00-2:00-3:00-4:00-4:00-3:00-2:00-1:00 with 60s easy · RPE 7–8 · ~27.0 min
   Work steps with 60 s easy between.
   - Treadmill Run: Pyramid 1 min-2 min-3 min-4 min-4 min-3 min-2 min-1 min (RPE 7-8; hold output across steps)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: 1200 s Treadmill Run (20.0 min, 1 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 20.0 min, recovery 7.0 min, transitions 0.0 min, elapsed 45.0 min (duty 0.74). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 1, transitions 0.

BUILT FOR TODAY (consumer text):
- Since you're advanced, the density is higher and the main block runs to RPE 8. Your athleticism goal favours powerful, repeatable output.
- Advanced dosing: 8 pyramid steps up to 4 min, output held across the steps.
- A 1-2-3-4-4-3-2-1 minute pyramid on the Treadmill Run, 60 s easy between steps.
- One main block, about 45 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to improve athleticism; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [experience] main block to RPE 8; 20.0 min of engine work
- [goal] pyramid shape (athleticism goal weights it up)
- [archetype] Engine (your choice)
- [structure] pyramid: pyramid 1:00-2:00-3:00-4:00-4:00-3:00-2:00-1:00 with 60 s easy

REALIZED PERSONALIZATION (contract):
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 8; 20.0 min of engine work
- goal = improve_athleticism → intended: powerful_output_sleds_carries_intervals → realized: pyramid shape (athleticism goal weights it up)
- archetype = sweat_engine → intended: conditioning_type_for_today → realized: Engine (your choice)
- structure = pyramid → intended: conditioning_structure_and_dose → realized: pyramid: pyramid 1:00-2:00-3:00-4:00-4:00-3:00-2:00-1:00 with 60 s easy
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 45.0 min for a 60-minute window (20.0 active, 7.0 recovery, 0.0 transitions); main block stimulus: sufficient (score 26.0 vs 21.0 / 32.0); warm-up +3 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 26.0 vs sufficient 21.0 / substantial 32.0; main block 20.0 active min at RPE 7–8, 0 loaded reps, 20.0 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
Engine trace: fill: warm-up +3 min (movement preparation) | fill: downshift +3 min | elapsed 45.0 min accepted (window [48, 60], main block sufficient)

### W8 Engine · intermediate · Amped

Context: State(s): amped · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_engine · soreness: none · equipment: commercial_gym · seed `w8|2026-10-11`

**Engine** · shape **long_intervals** · est. 44.0 min (shown as 40–45 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Engine] intervals · 5 rounds · 5 x 240s work / 90s recovery · RPE 7–8 · ~26.0 min
   Hard intervals on the same machine; easy pace between.
   - Row Erg: 5 × 4 min / 1:30 easy (RPE 8)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: 1200 s Row Erg (20.0 min, 5 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 20.0 min, recovery 6.0 min, transitions 0.0 min, elapsed 44.0 min (duty 0.77). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 1, transitions 0.

BUILT FOR TODAY (consumer text):
- You're amped, so that readiness goes into an extra round on the Row Erg. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: 4 min work with 1:30 easy between intervals.
- 5 rounds of 240 s work / 90 s easy on Row Erg.
- One main block, about 44 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=amped] 4 rounds → 5 rounds
- [goal] duty cycle 77%: the session keeps moving; long intervals shape (conditioning goal weights it up)
- [archetype] Engine (your choice)
- [structure] long intervals: 5 × 240 s / 90 s easy
- Coherence amped: PASS

REALIZED PERSONALIZATION (contract):
- state = amped (expression: extra_round) → intended: use_readiness_for_output_or_density → realized: 4 rounds → 5 rounds
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 77%: the session keeps moving; long intervals shape (conditioning goal weights it up)
- archetype = sweat_engine → intended: conditioning_type_for_today → realized: Engine (your choice)
- structure = long_intervals → intended: conditioning_structure_and_dose → realized: long intervals: 5 × 240 s / 90 s easy
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 44.0 min for a 60-minute window (20.0 active, 6.0 recovery, 0.0 transitions); main block stimulus: sufficient (score 26.0 vs 18.0 / 27.0); warm-up +3 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 26.0 vs sufficient 18.0 / substantial 27.0; main block 20.0 active min at RPE 7–8, 0 loaded reps, 20.0 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
State coherence: amped PASS
Engine trace: fill: warm-up +3 min (movement preparation) | fill: downshift +3 min | amped: attempt 0 'extra_round' realized ['volume'] → satisfied | elapsed 44.0 min accepted (window [48, 60], main block sufficient)

### W9 Engine · beginner · Low Energy

Context: State(s): low_energy · level: beginner · goal: lose weight / conditioning · 60 min · archetype: sweat_engine · soreness: none · equipment: commercial_gym · seed `w9|2026-10-11`

**Engine** · shape **long_intervals** · est. 49.0 min (shown as 45–50 min)
```
WARM-UP / PREP 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Engine] intervals · 6 rounds · 6 x 150s work / 150s recovery · RPE 5–6 · ~27.5 min
   Hard intervals on the same machine; easy pace between.
   - Stationary Bike: 6 × 2:30 / 2:30 easy (RPE 6)
OPTIONAL COMPLEMENT [Complement] continuous · RPE 5–6 · ~8.0 min
   One steady rhythm, no programmed recovery. Purpose: sustainable extra minutes on a second modality (Low Energy).
   - Stair Climber: 8 min steady (RPE 5-6)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 900 s Stationary Bike, 480 s Stair Climber (23.0 min, 7 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 23.0 min, recovery 12.5 min, transitions 0.0 min, elapsed 49.0 min (duty 0.65). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 2, transitions 0.

BUILT FOR TODAY (consumer text):
- You're low on energy, so the work stays cyclical and steady on the Stationary Bike: long intervals at RPE 5–6, something you can sustain rather than survive. Since you're newer to conditioning, the effort stays at RPE 6 or below and the structure is one you can follow without watching a clock. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Beginner dosing: 2:30 work with 2:30 easy between intervals.
- 6 rounds of 150 s work / 150 s easy on Stationary Bike.
- Plus a short complement block, about 49 minutes in all.
- Target effort for the main block is RPE 5–6.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=low_energy] block RPE 6–7 → 5–6
- [experience] RPE capped at 6; no high-impact movement; 0 stations in the main block; recovery 150 s ≥ work 150 s; predictable structure (no EMOM / ladder / pyramid)
- [goal] long intervals shape (conditioning goal weights it up)
- [archetype] Engine (your choice)
- [structure] long intervals: 6 × 150 s / 150 s easy; complement: steady (8 min)
- Coherence low_energy: PASS

REALIZED PERSONALIZATION (contract):
- state = low_energy (expression: low_impact_simple) → intended: keep_moving_lower_intensity_and_systemic_cost → realized: block RPE 6–7 → 5–6
- experience = beginner → intended: match_conditioning_vocabulary_to_level → realized: RPE capped at 6; no high-impact movement; 0 stations in the main block; recovery 150 s ≥ work 150 s; predictable structure (no EMOM / ladder / pyramid)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: long intervals shape (conditioning goal weights it up)
- archetype = sweat_engine → intended: conditioning_type_for_today → realized: Engine (your choice)
- structure = long_intervals → intended: conditioning_structure_and_dose → realized: long intervals: 6 × 150 s / 150 s easy; complement: steady (8 min)
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 49.0 min for a 60-minute window (23.0 active, 12.5 recovery, 0.0 transitions); main block stimulus: sufficient (score 12.8 vs 12.6 / 19.8); primary +1 unit (stimulus below sufficient)
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 12.8 vs sufficient 12.6 / substantial 19.8; main block 15.0 active min at RPE 5–6, 0 loaded reps, 15.0 engine min)
WORKLOAD BUDGET: limits (beginner, 60 min): engine ≤ 26 min, engine share ≤ 75%, anchor share ≤ 45%, hard ≤ 30% of active once past 8 min, loaded reps ≤ 200, impact contacts ≤ 50, loaded hinges ≤ 1, stations ≤ 6, all-out blocks ≤ 0. Within budget.
State coherence: low_energy PASS
Engine trace: fill: primary +1 unit (stimulus below sufficient) | complement kept: sustainable extra minutes on a second modality (Low Energy) (8.0 min) | low_energy: attempt 0 'low_impact_simple' realized ['rpe'] → satisfied

## E. Sequential history (one user, six Hybrid sessions, Bored every time)

### E1 Bored · Hybrid · advanced · session 1

Context: State(s): bored · level: advanced · goal: lose weight / conditioning · 60 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym · seed `seq|2026-11-01`

**Hybrid** · shape **split_anchor** · est. 50.5 min (shown as about 50 min)
```
WARM-UP / PREP 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Hybrid] anchor_circuit · 4 rounds · 45 s between rounds · RPE 7–8 · ~38.5 min
   Every round: SkiErg, then every station. Walk 45 s between rounds.
   - SkiErg: 900 m (RPE 8) [anchor]
   - Devil Press: 10 (light-moderate load, unbroken, short of failure)
   - Single-Arm Overhead Carry: 60 m (moderate load, switch arms halfway)
   - Med-Ball Slam: 15 (RPE 8)
   - Sled Rope Pull: 20 m (heavy, steady)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 3600 m SkiErg (16.1 min, 4 bouts). Loaded reps 100, bodyweight reps 0, impact contacts 0. Active 30.2 min, recovery 2.2 min, transitions 6.0 min, elapsed 50.5 min (duty 0.93). Anchor share 44%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 24.

BUILT FOR TODAY (consumer text):
- You're bored, so we're changing the experience with the SkiErg and movements you haven't seen recently (Devil Press, Single-Arm Overhead Carry and Med-Ball Slam). The workload stays controlled; the novelty comes from how the session unfolds, not from random extra work. You're advanced, so the session carries more output: split anchor with the main block to RPE 8. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Advanced dosing: the anchor distance, station targets and 45 s between rounds are set for your level.
- SkiErg 900 m anchors all 4 rounds, followed by 4 stations every round.
- The main block is the whole workout: nothing is added after it. About 50 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=bored] SkiErg instead of Row Erg; Devil Press (vs no-State build); Sled Rope Pull (vs no-State build)
- [experience] main block to RPE 8; duty cycle 93% (dense)
- [goal] duty cycle 93%: the session keeps moving; 30.2 active minutes
- [archetype] Hybrid (your choice)
- [structure] split anchor: 4 rounds: SkiErg 900 m + 4 stations, 45 s between rounds
- Coherence bored: PASS

REALIZED PERSONALIZATION (contract):
- state = bored (expression: new_structure) → intended: fresh_engaging_conditioning → realized: SkiErg instead of Row Erg; Devil Press (vs no-State build); Sled Rope Pull (vs no-State build)
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 8; duty cycle 93% (dense)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 93%: the session keeps moving; 30.2 active minutes
- archetype = sweat_hybrid → intended: conditioning_type_for_today → realized: Hybrid (your choice)
- structure = split_anchor → intended: conditioning_structure_and_dose → realized: split anchor: 4 rounds: SkiErg 900 m + 4 stations, 45 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 50.5 min for a 60-minute window (30.2 active, 2.2 recovery, 6.0 transitions); main block stimulus: substantial (score 48.7 vs 21.0 / 32.0); primary +1 round
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: substantial (score 48.7 vs sufficient 21.0 / substantial 32.0; main block 30.2 active min at RPE 7–8, 100 loaded reps, 16.1 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
State coherence: bored PASS
Engine trace: fill: primary +1 round | bored: attempt 0 'new_structure' realized ['modality', 'exercises'] → satisfied

### E2 Bored · Hybrid · advanced · session 2

Context: State(s): bored · level: advanced · goal: lose weight / conditioning · 60 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym · seed `seq|2026-11-03`

**Hybrid** · shape **anchor_couplet** · est. 48.4 min (shown as 45–50 min)
```
WARM-UP / PREP 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Hybrid] anchor_circuit · 6 rounds · 45 s between rounds · RPE 7–8 · ~36.4 min
   First 3 min: set your Row Erg pace and load every station, then start round 1. Every round: Row Erg, then every station. Walk 45 s between rounds.
   - Row Erg: 500 m (RPE 8) [anchor]
   - Lateral Step-Up: 10/side (light-moderate load, unbroken, short of failure)
   - Overhead Carry: 40 m (moderate load, arms locked out)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 3000 m Row Erg (13.1 min, 6 bouts). Loaded reps 120, bodyweight reps 0, impact contacts 0. Active 23.7 min, recovery 3.8 min, transitions 9.0 min, elapsed 48.4 min (duty 0.86). Anchor share 40%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 3, transitions 36.

BUILT FOR TODAY (consumer text):
- You're bored, so we're changing the experience with movements you haven't seen recently (Lateral Step-Up and Overhead Carry). The workload stays controlled; the novelty comes from how the session unfolds, not from random extra work. Since you're advanced, the density is higher and the main block runs to RPE 8. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Advanced dosing: the anchor distance, station targets and 45 s between rounds are set for your level.
- Row Erg 500 m anchors all 6 rounds, followed by 2 stations every round.
- The main block is the whole workout: nothing is added after it. About 48 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=bored] Lateral Step-Up (vs no-State build); Overhead Carry (vs no-State build)
- [experience] main block to RPE 8; duty cycle 86% (dense)
- [goal] duty cycle 86%: the session keeps moving; anchor + couplet shape (conditioning goal weights it up)
- [archetype] Hybrid (your choice)
- [structure] anchor + couplet: 6 rounds: Row Erg 500 m + 2 stations, 45 s between rounds
- Coherence bored: PASS

REALIZED PERSONALIZATION (contract):
- state = bored (expression: changing_intervals) → intended: fresh_engaging_conditioning → realized: Lateral Step-Up (vs no-State build); Overhead Carry (vs no-State build)
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 8; duty cycle 86% (dense)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 86%: the session keeps moving; anchor + couplet shape (conditioning goal weights it up)
- archetype = sweat_hybrid → intended: conditioning_type_for_today → realized: Hybrid (your choice)
- structure = anchor_couplet → intended: conditioning_structure_and_dose → realized: anchor + couplet: 6 rounds: Row Erg 500 m + 2 stations, 45 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 48.4 min for a 60-minute window (23.7 active, 3.8 recovery, 9.0 transitions); main block stimulus: substantial (score 36.8 vs 21.0 / 32.0); 3 min technique and setup before round 1
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = 1 completed Sweat session(s) → intended: vary_shape_modality_and_stations → realized: different shape from last Hybrid (split anchor); Row Erg instead of last time's SkiErg; 3 stations not in your last Hybrid

PRIMARY BLOCK COMPLETENESS: substantial (score 36.8 vs sufficient 21.0 / substantial 32.0; main block 23.7 active min at RPE 7–8, 120 loaded reps, 13.1 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
State coherence: bored PASS
Engine trace: fill: 3 min technique and setup before round 1 | bored: attempt 0 'changing_intervals' realized ['exercises'] → satisfied

### E3 Bored · Hybrid · advanced · session 3

Context: State(s): bored · level: advanced · goal: lose weight / conditioning · 60 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym · seed `seq|2026-11-05`

**Hybrid** · shape **anchor_couplet** · est. 48.8 min (shown as 45–50 min)
```
WARM-UP / PREP 8 min: 8 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Hybrid] anchor_circuit · 6 rounds · 45 s between rounds · RPE 7–8 · ~35.8 min
   First 2 min: set your Treadmill Run pace and load every station, then start round 1. Every round: Treadmill Run, then every station. Walk 45 s between rounds.
   - Treadmill Run: 400 m (RPE 8, strong and controlled) [anchor]
   - Kettlebell Snatch: 12/side (moderate, crisp hips (RPE <= 8))
   - Sled Rope Pull: 20 m (heavy, steady)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 2400 m Treadmill Run (13.3 min, 6 bouts). Loaded reps 144, bodyweight reps 0, impact contacts 0. Active 24.1 min, recovery 3.8 min, transitions 8.0 min, elapsed 48.8 min (duty 0.87). Anchor share 41%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 3, transitions 32.

BUILT FOR TODAY (consumer text):
- You're bored, so we're changing the experience with movements you haven't seen recently (Kettlebell Snatch and Sled Rope Pull). The workload stays controlled; the novelty comes from how the session unfolds, not from random extra work. Since you're advanced, the density is higher and the main block runs to RPE 8. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Advanced dosing: the anchor distance, station targets and 45 s between rounds are set for your level.
- Treadmill Run 400 m anchors all 6 rounds, followed by 2 stations every round.
- The main block is the whole workout: nothing is added after it. About 49 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=bored] Kettlebell Snatch (vs no-State build); Sled Rope Pull (vs no-State build)
- [experience] main block to RPE 8; duty cycle 87% (dense)
- [goal] duty cycle 87%: the session keeps moving; anchor + couplet shape (conditioning goal weights it up)
- [archetype] Hybrid (your choice)
- [structure] anchor + couplet: 6 rounds: Treadmill Run 400 m + 2 stations, 45 s between rounds
- Coherence bored: PASS

REALIZED PERSONALIZATION (contract):
- state = bored (expression: new_structure) → intended: fresh_engaging_conditioning → realized: Kettlebell Snatch (vs no-State build); Sled Rope Pull (vs no-State build)
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 8; duty cycle 87% (dense)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 87%: the session keeps moving; anchor + couplet shape (conditioning goal weights it up)
- archetype = sweat_hybrid → intended: conditioning_type_for_today → realized: Hybrid (your choice)
- structure = anchor_couplet → intended: conditioning_structure_and_dose → realized: anchor + couplet: 6 rounds: Treadmill Run 400 m + 2 stations, 45 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 48.8 min for a 60-minute window (24.1 active, 3.8 recovery, 8.0 transitions); main block stimulus: substantial (score 41.0 vs 21.0 / 32.0); 2 min technique and setup before round 1; warm-up +1 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = 2 completed Sweat session(s) → intended: vary_shape_modality_and_stations → realized: Treadmill Run instead of last time's Row Erg; 3 stations not in your last Hybrid

PRIMARY BLOCK COMPLETENESS: substantial (score 41.0 vs sufficient 21.0 / substantial 32.0; main block 24.1 active min at RPE 7–8, 144 loaded reps, 13.3 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
State coherence: bored PASS
Engine trace: fill: 2 min technique and setup before round 1 | fill: warm-up +1 min | bored: attempt 0 'new_structure' realized ['exercises'] → satisfied

### E4 Bored · Hybrid · advanced · session 4

Context: State(s): bored · level: advanced · goal: lose weight / conditioning · 60 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym · seed `seq|2026-11-07`

**Hybrid** · shape **ladder_hybrid** · est. 48.3 min (shown as 45–50 min)
```
WARM-UP / PREP 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Hybrid] anchor_circuit · 6 rounds · 45 s between rounds · RPE 7–8 · ~36.3 min
   First 2 min: set your SkiErg pace and load every station, then start round 1. Every round: SkiErg, then every station. Walk 45 s between rounds.
   - SkiErg: 800 m / 650 m / 550 m / 400 m / 250 m / 250 m (RPE 8) [anchor]
   - Front-Foot Elevated Split Squat: 8/side (light-moderate load, unbroken, short of failure)
   - Med-Ball Slam: 12 (RPE 8)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 2900 m SkiErg (13.0 min, 6 bouts). Loaded reps 231, bodyweight reps 0, impact contacts 0. Active 24.6 min, recovery 3.8 min, transitions 8.0 min, elapsed 48.3 min (duty 0.87). Anchor share 40%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 3, transitions 32.

BUILT FOR TODAY (consumer text):
- You're bored, so we're changing the experience with movements you haven't seen recently (Front-Foot Elevated Split Squat and Med-Ball Slam). The workload stays controlled; the novelty comes from how the session unfolds, not from random extra work. Since you're advanced, the density is higher and the main block runs to RPE 8. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Advanced dosing: the anchor distance, station targets and 45 s between rounds are set for your level.
- SkiErg 800 m / 650 m / 550 m / 400 m / 250 m / 250 m anchors all 6 rounds, followed by 2 stations every round.
- The main block is the whole workout: nothing is added after it. About 48 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=bored] Front-Foot Elevated Split Squat (vs no-State build); Med-Ball Slam (vs no-State build)
- [experience] main block to RPE 8; duty cycle 87% (dense); ladder hybrid shape
- [goal] duty cycle 87%: the session keeps moving
- [archetype] Hybrid (your choice)
- [structure] ladder hybrid: 6 rounds: SkiErg 800 m/650 m/550 m/400 m/250 m/250 m + 2 stations, 45 s between rounds
- Coherence bored: PASS

REALIZED PERSONALIZATION (contract):
- state = bored (expression: changing_intervals) → intended: fresh_engaging_conditioning → realized: Front-Foot Elevated Split Squat (vs no-State build); Med-Ball Slam (vs no-State build)
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 8; duty cycle 87% (dense); ladder hybrid shape
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 87%: the session keeps moving
- archetype = sweat_hybrid → intended: conditioning_type_for_today → realized: Hybrid (your choice)
- structure = ladder_hybrid → intended: conditioning_structure_and_dose → realized: ladder hybrid: 6 rounds: SkiErg 800 m/650 m/550 m/400 m/250 m/250 m + 2 stations, 45 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 48.3 min for a 60-minute window (24.6 active, 3.8 recovery, 8.0 transitions); main block stimulus: substantial (score 40.9 vs 21.0 / 32.0); primary +1 round; 2 min technique and setup before round 1
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = 3 completed Sweat session(s) → intended: vary_shape_modality_and_stations → realized: different shape from last Hybrid (anchor + couplet); SkiErg instead of last time's Treadmill Run; 3 stations not in your last Hybrid

PRIMARY BLOCK COMPLETENESS: substantial (score 40.9 vs sufficient 21.0 / substantial 32.0; main block 24.6 active min at RPE 7–8, 231 loaded reps, 13.0 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
State coherence: bored PASS
Engine trace: fill: primary +1 round | fill: 2 min technique and setup before round 1 | bored: attempt 0 'changing_intervals' realized ['exercises'] → satisfied

### E5 Bored · Hybrid · advanced · session 5

Context: State(s): bored · level: advanced · goal: lose weight / conditioning · 60 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym · seed `seq|2026-11-09`

**Hybrid** · shape **split_anchor** · est. 50.5 min (shown as about 50 min)
```
WARM-UP / PREP 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Hybrid] anchor_circuit · 4 rounds · 45 s between rounds · RPE 7–8 · ~38.5 min
   Every round: Row Erg, then every station. Walk 45 s between rounds.
   - Row Erg: 950 m (RPE 8) [anchor]
   - Devil Press: 10 (light-moderate load, unbroken, short of failure)
   - Single-Arm Overhead Carry: 60 m (moderate load, switch arms halfway)
   - Sled Rope Pull: 20 m (heavy, steady)
   - Med-Ball Slam: 15 (RPE 8)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 3800 m Row Erg (16.2 min, 4 bouts). Loaded reps 100, bodyweight reps 0, impact contacts 0. Active 30.3 min, recovery 2.2 min, transitions 6.0 min, elapsed 50.5 min (duty 0.93). Anchor share 45%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 24.

BUILT FOR TODAY (consumer text):
- You're bored, so we're changing the experience with movements you haven't seen recently (Devil Press, Single-Arm Overhead Carry and Sled Rope Pull). The workload stays controlled; the novelty comes from how the session unfolds, not from random extra work. You're advanced, so the session carries more output: split anchor with the main block to RPE 8. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Advanced dosing: the anchor distance, station targets and 45 s between rounds are set for your level.
- Row Erg 950 m anchors all 4 rounds, followed by 4 stations every round.
- The main block is the whole workout: nothing is added after it. About 50 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=bored] Devil Press (vs no-State build); Single-Arm Overhead Carry (vs no-State build); Sled Rope Pull (vs no-State build)
- [experience] main block to RPE 8; duty cycle 93% (dense)
- [goal] duty cycle 93%: the session keeps moving; 30.3 active minutes
- [archetype] Hybrid (your choice)
- [structure] split anchor: 4 rounds: Row Erg 950 m + 4 stations, 45 s between rounds
- Coherence bored: PASS

REALIZED PERSONALIZATION (contract):
- state = bored (expression: new_structure) → intended: fresh_engaging_conditioning → realized: Devil Press (vs no-State build); Single-Arm Overhead Carry (vs no-State build); Sled Rope Pull (vs no-State build)
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 8; duty cycle 93% (dense)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 93%: the session keeps moving; 30.3 active minutes
- archetype = sweat_hybrid → intended: conditioning_type_for_today → realized: Hybrid (your choice)
- structure = split_anchor → intended: conditioning_structure_and_dose → realized: split anchor: 4 rounds: Row Erg 950 m + 4 stations, 45 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 50.5 min for a 60-minute window (30.3 active, 2.2 recovery, 6.0 transitions); main block stimulus: substantial (score 48.8 vs 21.0 / 32.0); primary +1 round
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = 4 completed Sweat session(s) → intended: vary_shape_modality_and_stations → realized: different shape from last Hybrid (ladder hybrid); Row Erg instead of last time's SkiErg; 4 stations not in your last Hybrid

PRIMARY BLOCK COMPLETENESS: substantial (score 48.8 vs sufficient 21.0 / substantial 32.0; main block 30.3 active min at RPE 7–8, 100 loaded reps, 16.2 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
State coherence: bored PASS
Engine trace: fill: primary +1 round | bored: attempt 0 'new_structure' realized ['exercises'] → satisfied

### E6 Bored · Hybrid · advanced · session 6

Context: State(s): bored · level: advanced · goal: lose weight / conditioning · 60 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym · seed `seq|2026-11-11`

**Hybrid** · shape **split_anchor** · est. 48.7 min (shown as 45–50 min)
```
WARM-UP / PREP 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Hybrid] anchor_circuit · 4 rounds · 45 s between rounds · RPE 7–8 · ~36.7 min
   Every round: Treadmill Run, then every station. Walk 45 s between rounds.
   - Treadmill Run: 750 m (RPE 8, strong and controlled) [anchor]
   - Landmine Squat-to-Press: 15 (light-moderate load, unbroken, short of failure)
   - Overhead Carry: 40 m (moderate load, arms locked out)
   - Med-Ball Slam: 15 (RPE 8)
   - Dumbbell Push Press: 16 (light-moderate load, unbroken, short of failure)
COOLDOWN 5 min: Easy pace and breathing down.
```
Totals: Total engine dose: 3000 m Treadmill Run (16.2 min, 4 bouts). Loaded reps 184, bodyweight reps 0, impact contacts 0. Active 28.5 min, recovery 2.2 min, transitions 6.0 min, elapsed 48.7 min (duty 0.93). Anchor share 47%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 24.

BUILT FOR TODAY (consumer text):
- You're bored, so we're changing the experience with movements you haven't seen recently (Landmine Squat-to-Press, Overhead Carry and Med-Ball Slam). The workload stays controlled; the novelty comes from how the session unfolds, not from random extra work. Since you're advanced, the density is higher and the main block runs to RPE 8. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Advanced dosing: the anchor distance, station targets and 45 s between rounds are set for your level.
- Treadmill Run 750 m anchors all 4 rounds, followed by 4 stations every round.
- The main block is the whole workout: nothing is added after it. About 49 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=bored] Landmine Squat-to-Press (vs no-State build); Med-Ball Slam (vs no-State build)
- [experience] main block to RPE 8; duty cycle 93% (dense)
- [goal] duty cycle 93%: the session keeps moving
- [archetype] Hybrid (your choice)
- [structure] split anchor: 4 rounds: Treadmill Run 750 m + 4 stations, 45 s between rounds
- Coherence bored: PASS

REALIZED PERSONALIZATION (contract):
- state = bored (expression: new_modalities) → intended: fresh_engaging_conditioning → realized: Landmine Squat-to-Press (vs no-State build); Med-Ball Slam (vs no-State build)
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 8; duty cycle 93% (dense)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 93%: the session keeps moving
- archetype = sweat_hybrid → intended: conditioning_type_for_today → realized: Hybrid (your choice)
- structure = split_anchor → intended: conditioning_structure_and_dose → realized: split anchor: 4 rounds: Treadmill Run 750 m + 4 stations, 45 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 48.7 min for a 60-minute window (28.5 active, 2.2 recovery, 6.0 transitions); main block stimulus: substantial (score 46.8 vs 21.0 / 32.0); primary +1 round
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = 5 completed Sweat session(s) → intended: vary_shape_modality_and_stations → realized: Treadmill Run instead of last time's Row Erg; 4 stations not in your last Hybrid

PRIMARY BLOCK COMPLETENESS: substantial (score 46.8 vs sufficient 21.0 / substantial 32.0; main block 28.5 active min at RPE 7–8, 184 loaded reps, 16.2 engine min)
WORKLOAD BUDGET: limits (advanced, 60 min): engine ≤ 34 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 22 min, loaded reps ≤ 360, impact contacts ≤ 120, loaded hinges ≤ 1, stations ≤ 9, all-out blocks ≤ 2. Within budget.
State coherence: bored PASS
Engine trace: fill: primary +1 round | bored: attempt 0 'new_modalities' realized ['exercises'] → satisfied

## F. 30-minute regression

### F1 Engine · No State · intermediate

Context: State(s): none · level: intermediate · goal: lose weight / conditioning · 30 min · archetype: sweat_engine · soreness: none · equipment: commercial_gym · seed `f1|2026-10-11`

**Engine** · shape **short_intervals** · est. 23.7 min (shown as 20–25 min)
```
WARM-UP / PREP 5 min: 5 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Engine] intervals · 16 rounds · 16 x 40s work / 20s recovery · RPE 8–9 · ~15.7 min
   Hard intervals on the same machine; easy pace between.
   - SkiErg: 16 × 40 s / 20 s easy (RPE 9)
COOLDOWN 3 min: Easy pace and breathing down.
```
Totals: Total engine dose: 640 s SkiErg (10.7 min, 16 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 10.7 min, recovery 5.0 min, transitions 0.0 min, elapsed 23.7 min (duty 0.68). Hard (RPE 8+) 10.7 min (100%), all-out blocks 0, stations 1, transitions 0.

BUILT FOR TODAY (consumer text):
- Intermediate dosing: 40 s work with 20 s easy between intervals.
- 16 rounds of 40 s work / 20 s easy on SkiErg.
- One main block, about 24 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 8–9.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.
- This is your first MOOD workout, so it starts from your Training Profile.

WHY THIS FITS TODAY (trainer reasoning):
- [experience] short intervals (intermediate and up)
- [archetype] Engine (your choice)
- [structure] short intervals: 16 × 40 s / 20 s easy

REALIZED PERSONALIZATION (contract):
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: short intervals (intermediate and up)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: nothing (no claim made)
- archetype = sweat_engine → intended: conditioning_type_for_today → realized: Engine (your choice)
- structure = short_intervals → intended: conditioning_structure_and_dose → realized: short intervals: 16 × 40 s / 20 s easy
- duration = 30 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 23.7 min for a 30-minute window (10.7 active, 5.0 recovery, 0.0 transitions); main block stimulus: sufficient (score 13.9 vs 10.8 / 16.2); warm-up +1 min (movement preparation)
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 13.9 vs sufficient 10.8 / substantial 16.2; main block 10.7 active min at RPE 8–9, 0 loaded reps, 10.7 engine min)
WORKLOAD BUDGET: limits (intermediate, 30 min): engine ≤ 19 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 13 min, loaded reps ≤ 195, impact contacts ≤ 58, loaded hinges ≤ 1, stations ≤ 7, all-out blocks ≤ 1. Within budget.
Engine trace: fill: warm-up +1 min (movement preparation) | elapsed 23.7 min accepted (window [24, 31], main block sufficient)

### F2 Circuit · Amped · beginner

Context: State(s): amped · level: beginner · goal: lose weight / conditioning · 30 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `f2|2026-10-11`

**Circuit** · shape **timed** · est. 30.0 min (shown as about 30 min)
```
WARM-UP / PREP 4 min: 4 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Circuit] timed_circuit · 4 rounds · 4 x 35s work / 35s recovery · 60 s between rounds · RPE 7–8 · ~23.0 min
   35 s work / 35 s rest per station, rotate through all stations; 4 rounds.
   - Med-Ball Slam: 35 s (RPE 8)
   - Landmine Squat-to-Press: 35 s (light-moderate load, unbroken, short of failure)
   - Dumbbell Push Press: 35 s (light-moderate load, unbroken, short of failure)
   - Sled Push: 35 s (heavy, steady)
COOLDOWN 3 min: Easy pace and breathing down.
```
Totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 9.3 min, recovery 12.3 min, transitions 1.3 min, elapsed 30.0 min (duty 0.43). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 4, transitions 5.

BUILT FOR TODAY (consumer text):
- You're amped, so that readiness goes into an extra round. As a newer athlete you get a predictable structure, no high-impact work and an effort that leaves something in reserve. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Beginner dosing: 35 s work and 35 s rest per station.
- 4 rounds of 35 s work / 35 s easy on Med-Ball Slam, Landmine Squat-to-Press, Dumbbell Push Press and Sled Push.
- The main block is the whole workout: nothing is added after it. About 30 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=amped] 3 rounds → 4 rounds
- [experience] RPE capped at 8; no high-impact movement; 4 stations in the main block; predictable structure (no EMOM / ladder / pyramid)
- [goal] timed circuit shape (conditioning goal weights it up)
- [archetype] Circuit (your choice)
- [structure] timed circuit: 4 rounds × 4 stations at 35 s / 35 s
- Coherence amped: PASS
- Budget repair: impact_item_swapped skater_hop → sled_push

REALIZED PERSONALIZATION (contract):
- state = amped (expression: extra_round) → intended: use_readiness_for_output_or_density → realized: 3 rounds → 4 rounds
- experience = beginner → intended: match_conditioning_vocabulary_to_level → realized: RPE capped at 8; no high-impact movement; 4 stations in the main block; predictable structure (no EMOM / ladder / pyramid)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: timed circuit shape (conditioning goal weights it up)
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = timed → intended: conditioning_structure_and_dose → realized: timed circuit: 4 rounds × 4 stations at 35 s / 35 s
- duration = 30 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 30.0 min for a 30-minute window (9.3 active, 12.3 recovery, 1.3 transitions); main block stimulus: substantial (score 15.1 vs 8.4 / 13.2)
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: substantial (score 15.1 vs sufficient 8.4 / substantial 13.2; main block 9.3 active min at RPE 7–8, 0 loaded reps, 0.0 engine min)
WORKLOAD BUDGET: limits (beginner, 30 min): engine ≤ 16 min, engine share ≤ 75%, anchor share ≤ 45%, hard ≤ 30% of active once past 6 min, loaded reps ≤ 130, impact contacts ≤ 32, loaded hinges ≤ 1, stations ≤ 5, all-out blocks ≤ 0. Within budget.
State coherence: amped PASS
Engine trace: budget_repair: impact_item_swapped skater_hop→sled_push | amped: attempt 0 'denser' realized [] → NOT satisfied | amped: fallback denser → harder_output | amped: attempt 1 'harder_output' realized [] → NOT satisfied | amped: fallback harder_output → extra_round | amped: attempt 2 'extra_round' realized ['volume'] → satisfied

### F3 Hybrid · Irritated · advanced

Context: State(s): irritated · level: advanced · goal: lose weight / conditioning · 30 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym · seed `f3|2026-10-11`

**Hybrid** · shape **anchor_triplet** · est. 26.7 min (shown as 25–30 min)
```
WARM-UP / PREP 5 min: 5 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Hybrid] anchor_circuit · 3 rounds · 45 s between rounds · RPE 8–9 · ~18.7 min
   Every round: Row Erg, then every station. Walk 45 s between rounds.
   - Row Erg: 550 m (RPE 9) [anchor]
   - Sled Push: 20 m (heavy, steady)
   - Front-Rack Carry: 45 m (moderate-heavy, stay tall)
   - Med-Ball Slam: 15 (RPE 9)
COOLDOWN 3 min: Easy pace and breathing down.
```
Totals: Total engine dose: 1650 m Row Erg (6.6 min, 3 bouts). Loaded reps 45, bodyweight reps 0, impact contacts 0. Active 13.4 min, recovery 1.5 min, transitions 3.8 min, elapsed 26.7 min (duty 0.9). Anchor share 38%. Hard (RPE 8+) 6.6 min (49%), all-out blocks 0, stations 4, transitions 15.

BUILT FOR TODAY (consumer text):
- You're irritated, so that energy gets somewhere physical to go: Sled Push, Front-Rack Carry and Med-Ball Slam around the Row Erg. The movements stay simple so you can focus on output, not coordination. Since you're advanced, the density is higher and the main block runs to RPE 9. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Advanced dosing: the anchor distance, station targets and 45 s between rounds are set for your level.
- Row Erg 550 m anchors all 3 rounds, followed by 3 stations every round.
- The main block is the whole workout: nothing is added after it. About 27 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 8–9.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=irritated] block RPE 7–8 → 8–9
- [experience] main block to RPE 9; duty cycle 90% (dense); anchor + triplet shape
- [goal] duty cycle 90%: the session keeps moving
- [archetype] Hybrid (your choice)
- [structure] anchor + triplet: 3 rounds: Row Erg 550 m + 3 stations, 45 s between rounds
- Coherence irritated: PASS

REALIZED PERSONALIZATION (contract):
- state = irritated (expression: hard_simple) → intended: direct_cathartic_output → realized: block RPE 7–8 → 8–9
- experience = advanced → intended: match_conditioning_vocabulary_to_level → realized: main block to RPE 9; duty cycle 90% (dense); anchor + triplet shape
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 90%: the session keeps moving
- archetype = sweat_hybrid → intended: conditioning_type_for_today → realized: Hybrid (your choice)
- structure = anchor_triplet → intended: conditioning_structure_and_dose → realized: anchor + triplet: 3 rounds: Row Erg 550 m + 3 stations, 45 s between rounds
- duration = 30 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 26.7 min for a 30-minute window (13.4 active, 1.5 recovery, 3.8 transitions); main block stimulus: substantial (score 21.8 vs 12.6 / 19.2)
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: substantial (score 21.8 vs sufficient 12.6 / substantial 19.2; main block 13.4 active min at RPE 8–9, 45 loaded reps, 6.6 engine min)
WORKLOAD BUDGET: limits (advanced, 30 min): engine ≤ 22 min, engine share ≤ 85%, anchor share ≤ 48%, hard ≤ 70% of active once past 16 min, loaded reps ≤ 234, impact contacts ≤ 78, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 2. Within budget.
State coherence: irritated PASS
Engine trace: irritated: attempt 0 'hard_simple' realized ['rpe'] → satisfied

### F4 Circuit · Low Energy + Amped · intermediate

Context: State(s): low_energy, amped · level: intermediate · goal: lose weight / conditioning · 30 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `f4|2026-10-11`

**Circuit** · shape **rounds** · est. 24.2 min (shown as 20–25 min)
```
WARM-UP / PREP 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] circuit · 4 rounds · 45 s between rounds · RPE 6–7 · ~14.2 min
   4 rounds, moving station to station; rest 45 s after each round.
   - Row Erg: 250 m (RPE 7)
   - Kettlebell Swing: 15 (moderate, crisp hips (RPE <= 8))
   - Dumbbell Push Press: 15 (light-moderate load, unbroken, short of failure)
COOLDOWN 3 min: Easy pace and breathing down.
```
Totals: Total engine dose: 1000 m Row Erg (4.0 min, 4 bouts). Loaded reps 120, bodyweight reps 0, impact contacts 0. Active 9.0 min, recovery 2.2 min, transitions 3.0 min, elapsed 24.2 min (duty 0.8). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 3, transitions 12.

BUILT FOR TODAY (consumer text):
- You're amped but running on less energy than usual, so energy sets the workload and the readiness goes into one denser Row Erg block. Everything else stays steady and sustainable. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: station targets and 45 s between rounds are set for your level.
- 4 rounds of 3 stations: Row Erg, Kettlebell Swing and Dumbbell Push Press.
- One main block, about 24 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 6–7.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=low_energy] circuit RPE 7–8 → 6–7
- [state=amped] round_rest 60 → 45 s
- [goal] duty cycle 80%: the session keeps moving
- [archetype] Circuit (your choice)
- [structure] circuit rounds: 4 rounds × 3 stations, 45 s between rounds
- Coherence low_energy: PASS
- Coherence amped: PASS

REALIZED PERSONALIZATION (contract):
- state = low_energy (expression: low_impact_simple) → intended: keep_moving_lower_intensity_and_systemic_cost → realized: circuit RPE 7–8 → 6–7
- state = amped (expression: harder_output) → intended: use_readiness_for_output_or_density → realized: round_rest 60 → 45 s
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 80%: the session keeps moving
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = rounds → intended: conditioning_structure_and_dose → realized: circuit rounds: 4 rounds × 3 stations, 45 s between rounds
- duration = 30 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 24.2 min for a 30-minute window (9.0 active, 2.2 recovery, 3.0 transitions); main block stimulus: sufficient (score 10.6 vs 9.7 / 14.6); 3 min technique and setup before round 1; warm-up +3 min (movement preparation)
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 10.6 vs sufficient 9.7 / substantial 14.6; main block 9.0 active min at RPE 6–7, 120 loaded reps, 4.0 engine min)
WORKLOAD BUDGET: limits (intermediate, 30 min): engine ≤ 19 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 13 min, loaded reps ≤ 195, impact contacts ≤ 58, loaded hinges ≤ 1, stations ≤ 7, all-out blocks ≤ 1. Within budget.
State coherence: low_energy PASS · amped PASS
Engine trace: rule low_energy_owns_workload | rule low_energy_owns_workload (30 min: Low Energy sets the main-block effort, Amped tightens its rest) | rule low_energy_owns_workload | rule low_energy_owns_workload (30 min: Low Energy sets the main-block effort, Amped tightens its rest) | complement skipped: 30-minute session: the main block is the workout | fill: 3 min technique and setup before round 1 | fill: warm-up +3 min (movement preparation) | low_energy: attempt 0 'low_impact_simple' realized ['rpe'] → satisfied | amped: attempt 0 'harder_output' realized ['recovery'] → satisfied

### F5 Engine · Stressed · beginner

Context: State(s): stressed · level: beginner · goal: lose weight / conditioning · 30 min · archetype: sweat_engine · soreness: none · equipment: commercial_gym · seed `f5|2026-10-11`

**Engine** · shape **long_intervals** · est. 26.5 min (shown as 25–30 min)
```
WARM-UP / PREP 4 min: 4 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Engine] intervals · 4 rounds · 4 x 150s work / 190s recovery · RPE 6–7 · ~19.5 min
   Hard intervals on the same machine; easy pace between.
   - SkiErg: 4 × 2:30 / 3:10 easy (RPE 7)
COOLDOWN 3 min: Easy pace and breathing down.
```
Totals: Total engine dose: 600 s SkiErg (10.0 min, 4 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 10.0 min, recovery 9.5 min, transitions 0.0 min, elapsed 26.5 min (duty 0.51). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 1, transitions 0.

BUILT FOR TODAY (consumer text):
- You're stressed, so we're keeping this simple: one SkiErg, long intervals you can settle into, and a pace that gives your head something straightforward to hold on to. As a newer athlete you get a predictable structure, no high-impact work and an effort that leaves something in reserve. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Beginner dosing: 2:30 work with 3:10 easy between intervals.
- 4 rounds of 150 s work / 190 s easy on SkiErg.
- One main block, about 26 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 6–7.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=stressed] recovery 150 → 190 s
- [experience] RPE capped at 7; no high-impact movement; 0 stations in the main block; recovery 190 s ≥ work 150 s; predictable structure (no EMOM / ladder / pyramid)
- [goal] long intervals shape (conditioning goal weights it up)
- [archetype] Engine (your choice)
- [structure] long intervals: 4 × 150 s / 190 s easy
- Coherence stressed: PASS

REALIZED PERSONALIZATION (contract):
- state = stressed (expression: controlled_pace) → intended: rhythmic_predictable_conditioning → realized: recovery 150 → 190 s
- experience = beginner → intended: match_conditioning_vocabulary_to_level → realized: RPE capped at 7; no high-impact movement; 0 stations in the main block; recovery 190 s ≥ work 150 s; predictable structure (no EMOM / ladder / pyramid)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: long intervals shape (conditioning goal weights it up)
- archetype = sweat_engine → intended: conditioning_type_for_today → realized: Engine (your choice)
- structure = long_intervals → intended: conditioning_structure_and_dose → realized: long intervals: 4 × 150 s / 190 s easy
- duration = 30 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 26.5 min for a 30-minute window (10.0 active, 9.5 recovery, 0.0 transitions); main block stimulus: sufficient (score 8.5 vs 8.4 / 13.2)
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 8.5 vs sufficient 8.4 / substantial 13.2; main block 10.0 active min at RPE 6–7, 0 loaded reps, 10.0 engine min)
WORKLOAD BUDGET: limits (beginner, 30 min): engine ≤ 16 min, engine share ≤ 75%, anchor share ≤ 45%, hard ≤ 30% of active once past 6 min, loaded reps ≤ 130, impact contacts ≤ 32, loaded hinges ≤ 1, stations ≤ 5, all-out blocks ≤ 0. Within budget.
State coherence: stressed PASS
Engine trace: stressed: attempt 0 'steady_cyclical' realized [] → NOT satisfied | stressed: fallback steady_cyclical → fixed_rounds | stressed: attempt 1 'fixed_rounds' realized [] → NOT satisfied | stressed: fallback fixed_rounds → controlled_pace | stressed: attempt 2 'controlled_pace' realized ['recovery'] → satisfied

### F6 Hybrid · Bored · intermediate

Context: State(s): bored · level: intermediate · goal: lose weight / conditioning · 30 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym · seed `f6|2026-10-11`

**Hybrid** · shape **split_anchor** · est. 25.0 min (shown as about 25 min)
```
WARM-UP / PREP 5 min: 5 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Hybrid] anchor_circuit · 2 rounds · 60 s between rounds · RPE 7–8 · ~17.0 min
   Every round: SkiErg, then every station. Walk 60 s between rounds.
   - SkiErg: 700 m (RPE 8) [anchor]
   - Devil Press: 10 (light-moderate load, unbroken, short of failure)
   - Overhead Carry: 40 m (moderate load, arms locked out)
   - Sled Rope Pull: 20 m (heavy, steady)
   - Med-Ball Slam: 15 (RPE 8)
COOLDOWN 3 min: Easy pace and breathing down.
```
Totals: Total engine dose: 1400 m SkiErg (6.7 min, 2 bouts). Loaded reps 50, bodyweight reps 0, impact contacts 0. Active 13.0 min, recovery 1.0 min, transitions 3.0 min, elapsed 25.0 min (duty 0.93). Anchor share 42%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 12.

BUILT FOR TODAY (consumer text):
- You're bored, so we're changing the experience with the SkiErg and movements you haven't seen recently (Devil Press, Overhead Carry and Sled Rope Pull). The workload stays controlled; the novelty comes from how the session unfolds, not from random extra work. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: the anchor distance, station targets and 60 s between rounds are set for your level.
- SkiErg 700 m anchors all 2 rounds, followed by 4 stations every round.
- The main block is the whole workout: nothing is added after it. About 25 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=bored] SkiErg instead of Row Erg; Devil Press (vs no-State build); Sled Rope Pull (vs no-State build)
- [goal] duty cycle 93%: the session keeps moving
- [archetype] Hybrid (your choice)
- [structure] split anchor: 2 rounds: SkiErg 700 m + 4 stations, 60 s between rounds
- Coherence bored: PASS

REALIZED PERSONALIZATION (contract):
- state = bored (expression: new_modalities) → intended: fresh_engaging_conditioning → realized: SkiErg instead of Row Erg; Devil Press (vs no-State build); Sled Rope Pull (vs no-State build)
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 93%: the session keeps moving
- archetype = sweat_hybrid → intended: conditioning_type_for_today → realized: Hybrid (your choice)
- structure = split_anchor → intended: conditioning_structure_and_dose → realized: split anchor: 2 rounds: SkiErg 700 m + 4 stations, 60 s between rounds
- duration = 30 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 25.0 min for a 30-minute window (13.0 active, 1.0 recovery, 3.0 transitions); main block stimulus: substantial (score 22.9 vs 10.8 / 16.2)
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: substantial (score 22.9 vs sufficient 10.8 / substantial 16.2; main block 13.0 active min at RPE 7–8, 50 loaded reps, 6.7 engine min)
WORKLOAD BUDGET: limits (intermediate, 30 min): engine ≤ 19 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 13 min, loaded reps ≤ 195, impact contacts ≤ 58, loaded hinges ≤ 1, stations ≤ 7, all-out blocks ≤ 1. Within budget.
State coherence: bored PASS
Engine trace: bored: attempt 0 'new_modalities' realized ['modality', 'exercises'] → satisfied

## G. Different Workout and Swap Exercise (production path)

### G1 Irritated · Circuit · intermediate (original)

Context: State(s): irritated · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `g1|2026-10-11`

**Circuit** · shape **timed** · est. 47.8 min (shown as 45–50 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] timed_circuit · 5 rounds · 5 x 40s work / 20s recovery · 45 s between rounds · RPE 7–8 · ~24.7 min
   40 s work / 20 s rest per station, rotate through all stations; 5 rounds.
   - Air Bike / Assault Bike: 40 s (RPE 8)
   - Kettlebell Swing: 40 s (moderate, crisp hips (RPE <= 8))
   - Dumbbell Push Press: 40 s (light-moderate load, unbroken, short of failure)
   - Sled Rope Pull: 40 s (heavy, steady)
OPTIONAL COMPLEMENT [Complement] intervals · 6 rounds · 6 x 40s work / 20s recovery · RPE 7–8 · ~5.7 min
   Hard intervals on the same machine; easy pace between. Purpose: a short engine piece to round out a station-led circuit.
   - SkiErg: 6 × 40 s / 20 s easy (RPE 8)
COOLDOWN 6 min: Easy pace and breathing down.
```
Totals: Total engine dose: 200 s Air Bike, 240 s SkiErg (7.3 min, 11 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 17.3 min, recovery 11.3 min, transitions 1.7 min, elapsed 47.8 min (duty 0.6). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 6.

BUILT FOR TODAY (consumer text):
- You're irritated, so that energy gets somewhere physical to go: Kettlebell Swing, Dumbbell Push Press and Sled Rope Pull around the Air Bike. The movements stay simple so you can focus on output, not coordination. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: 40 s work and 20 s rest per station.
- 5 rounds of 40 s work / 20 s easy on Air Bike / Assault Bike, Kettlebell Swing, Dumbbell Push Press and Sled Rope Pull.
- Plus a short complement block, about 48 minutes in all.
- Target effort for the main block is RPE 7–8.
- Your profile goal is to lose weight and build conditioning; today's Sweat session is built from today's choices.

WHY THIS FITS TODAY (trainer reasoning):
- [state=irritated] Kettlebell Swing (vs no-State build)
- [goal] timed circuit shape (conditioning goal weights it up)
- [archetype] Circuit (your choice)
- [structure] timed circuit: 5 rounds × 4 stations at 40 s / 20 s; complement: engine_intervals (6 min)
- Coherence irritated: PASS

REALIZED PERSONALIZATION (contract):
- state = irritated (expression: direct_finisher) → intended: direct_cathartic_output → realized: Kettlebell Swing (vs no-State build)
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: timed circuit shape (conditioning goal weights it up)
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = timed → intended: conditioning_structure_and_dose → realized: timed circuit: 5 rounds × 4 stations at 40 s / 20 s; complement: engine_intervals (6 min)
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 47.8 min for a 60-minute window (17.3 active, 11.3 recovery, 1.7 transitions); main block stimulus: sufficient (score 18.8 vs 18.0 / 27.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +1 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: sufficient (score 18.8 vs sufficient 18.0 / substantial 27.0; main block 13.3 active min at RPE 7–8, 0 loaded reps, 3.3 engine min)
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
State coherence: irritated PASS
Engine trace: complement kept: a short engine piece to round out a station-led circuit (5.7 min) | finisher skipped: one secondary element maximum | fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +1 min | irritated: attempt 0 'direct_finisher' realized ['exercises'] → satisfied | elapsed 47.8 min accepted (window [48, 60], main block sufficient)

### G2 Different Workout on G1

Context: State(s): irritated · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `g1|2026-10-11`

**Circuit** · shape **rounds** · est. 41.9 min (shown as 40–45 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] circuit · 5 rounds · 60 s between rounds · RPE 8–9 · ~23.9 min
   5 rounds, moving station to station; rest 60 s after each round.
   - Air Bike / Assault Bike: 12 cal (RPE 9)
   - Kettlebell Swing: 15 (moderate, crisp hips (RPE <= 8))
   - Dumbbell Push Press: 15 (light-moderate load, unbroken, short of failure)
   - Sled Rope Pull: 20 m (heavy, steady)
COOLDOWN 8 min: Easy pace and breathing down.
```
Totals: Total engine dose: 60 cal Air Bike (4.6 min, 5 bouts). Loaded reps 150, bodyweight reps 0, impact contacts 0. Active 14.9 min, recovery 4.0 min, transitions 5.0 min, elapsed 41.9 min (duty 0.79). Hard (RPE 8+) 14.9 min (100%), all-out blocks 0, stations 4, transitions 20.

BUILT FOR TODAY (consumer text):
- A different Circuit session: 0 of 4 exercises changed.
- You're irritated, so that energy gets somewhere physical to go: Kettlebell Swing, Dumbbell Push Press and Sled Rope Pull around the Air Bike. The movements stay simple so you can focus on output, not coordination. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Intermediate dosing: station targets and 60 s between rounds are set for your level.
- 5 rounds of 4 stations: Air Bike / Assault Bike, Kettlebell Swing, Dumbbell Push Press and Sled Rope Pull.
- One main block, about 42 minutes in all with warm-up and downshift.
- Target effort for the main block is RPE 8–9.

WHY THIS FITS TODAY (trainer reasoning):
- [state=irritated] circuit RPE 7–8 → 8–9; Kettlebell Swing (vs no-State build)
- [goal] duty cycle 79%: the session keeps moving
- [archetype] Circuit (your choice)
- [structure] circuit rounds: 5 rounds × 4 stations, 60 s between rounds
- Coherence irritated: PASS

REALIZED PERSONALIZATION (contract):
- state = irritated (expression: hard_simple) → intended: direct_cathartic_output → realized: circuit RPE 7–8 → 8–9; Kettlebell Swing (vs no-State build)
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: duty cycle 79%: the session keeps moving
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = rounds → intended: conditioning_structure_and_dose → realized: circuit rounds: 5 rounds × 4 stations, 60 s between rounds
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 41.9 min for a 60-minute window (14.9 active, 4.0 recovery, 5.0 transitions); main block stimulus: sufficient (score 24.6 vs 18.0 / 27.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +3 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: n/a
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
State coherence: irritated PASS
Engine trace: finisher skipped: hard main block | fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | irritated: attempt 0 'hard_simple' realized ['rpe', 'exercises'] → satisfied | elapsed 41.9 min accepted (window [48, 60], main block sufficient)

### G3 Swap Exercise on G1 (Sled Rope Pull → Battle Rope Waves)

Context: State(s): irritated · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym · seed `g1|2026-10-11`

**Circuit** · shape **timed** · est. 47.8 min (shown as 45–50 min)
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] timed_circuit · 5 rounds · 5 x 40s work / 20s recovery · 45 s between rounds · RPE 7–8 · ~24.7 min
   40 s work / 20 s rest per station, rotate through all stations; 5 rounds.
   - Air Bike / Assault Bike: 40 s (RPE 8)
   - Kettlebell Swing: 40 s (moderate, crisp hips (RPE <= 8))
   - Dumbbell Push Press: 40 s (light-moderate load, unbroken, short of failure)
   - Battle Rope Waves: 40 s (RPE 8)
OPTIONAL COMPLEMENT [Complement] intervals · 6 rounds · 6 x 40s work / 20s recovery · RPE 7–8 · ~5.7 min
   Hard intervals on the same machine; easy pace between. Purpose: a short engine piece to round out a station-led circuit.
   - SkiErg: 6 × 40 s / 20 s easy (RPE 8)
COOLDOWN 6 min: Easy pace and breathing down.
```
Totals: Total engine dose: 200 s Air Bike, 240 s SkiErg (7.3 min, 11 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 17.3 min, recovery 11.3 min, transitions 1.7 min, elapsed 47.8 min (duty 0.6). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 6.

BUILT FOR TODAY (consumer text):
- You're irritated, so that energy gets somewhere physical to go: Kettlebell Swing, Dumbbell Push Press and Battle Rope Waves around the Air Bike. The movements stay simple so you can focus on output, not coordination. Your conditioning goal keeps the session moving: sustained active minutes rather than long breaks.
- Swapped in a fresh option for that slot, same purpose.
- Intermediate dosing: 40 s work and 20 s rest per station.
- 5 rounds of 40 s work / 20 s easy on Air Bike / Assault Bike, Kettlebell Swing, Dumbbell Push Press and Battle Rope Waves.
- Plus a short complement block, about 48 minutes in all.
- Target effort for the main block is RPE 7–8.

WHY THIS FITS TODAY (trainer reasoning):
- [state=irritated] Kettlebell Swing (vs no-State build)
- [goal] timed circuit shape (conditioning goal weights it up)
- [archetype] Circuit (your choice)
- [structure] timed circuit: 5 rounds × 4 stations at 40 s / 20 s; complement: engine_intervals (6 min)
- Coherence irritated: PASS

REALIZED PERSONALIZATION (contract):
- state = irritated (expression: direct_finisher) → intended: direct_cathartic_output → realized: Kettlebell Swing (vs no-State build)
- experience = intermediate → intended: match_conditioning_vocabulary_to_level → realized: nothing (no claim made)
- goal = lose_weight_conditioning → intended: density_and_sustained_active_minutes → realized: timed circuit shape (conditioning goal weights it up)
- archetype = sweat_circuit → intended: conditioning_type_for_today → realized: Circuit (your choice)
- structure = timed → intended: conditioning_structure_and_dose → realized: timed circuit: 5 rounds × 4 stations at 40 s / 20 s; complement: engine_intervals (6 min)
- duration = 60 → intended: use_the_available_window_for_the_best_session_not_fill_it → realized: estimated 47.8 min for a 60-minute window (17.3 active, 11.3 recovery, 1.7 transitions); main block stimulus: sufficient (score 18.8 vs 18.0 / 27.0); 3 min technique and setup before round 1; warm-up +4 min (movement preparation); downshift +1 min
- equipment = sweat_commercial_default → intended: availability_only → realized: nothing (no claim made)
- history = first session → intended: vary_shape_modality_and_stations → realized: nothing (no claim made)

PRIMARY BLOCK COMPLETENESS: n/a
WORKLOAD BUDGET: limits (intermediate, 60 min): engine ≤ 30 min, engine share ≤ 80%, anchor share ≤ 45%, hard ≤ 60% of active once past 16 min, loaded reps ≤ 300, impact contacts ≤ 90, loaded hinges ≤ 1, stations ≤ 8, all-out blocks ≤ 1. Within budget.
State coherence: irritated PASS
Engine trace: complement kept: a short engine piece to round out a station-led circuit (5.7 min) | finisher skipped: one secondary element maximum | fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +1 min | irritated: attempt 0 'direct_finisher' realized ['exercises'] → satisfied | elapsed 47.8 min accepted (window [48, 60], main block sufficient)

## BEFORE / AFTER: the founder's named cases

BEFORE is the previous pass (duration-fill logic). AFTER is this pass (completeness gate, one secondary element maximum, complements and finishers that earn their place). Same seeds.

### D2: D2 Advanced · Irritated · Circuit · build strength

Context: State(s): irritated · level: advanced · goal: build strength · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym

BEFORE:
```
Warm-up 6 min: 6 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
[Circuit] circuit · 6 rounds · 45 s between rounds · RPE 7–8 · ~26.6 min
   6 rounds, moving station to station; rest 45 s after each round.
   - Air Bike / Assault Bike: 12 cal (RPE 8)
   - Kettlebell Swing: 15 (moderate, crisp hips (RPE <= 8))
   - Dumbbell Push Press: 15 (light-moderate load, unbroken, short of failure)
   - Sled Rope Pull: 20 m (heavy, steady)
[Complement] intervals · 10 rounds · 10 x 40s work / 20s recovery · RPE 7–8 · ~9.7 min
   Hard intervals on the same machine; easy pace between.
   - SkiErg: 10 × 40 s / 20 s easy (RPE 8)
[Finisher] finisher · 6 rounds · 6 x 20s work / 40s recovery · RPE 9–9 · ~5.3 min
   All-out efforts with easy recovery between.
   - Battle Rope Waves: 6 × 20 s / 40 s easy (RPE 9)
Downshift 5 min: Easy pace and breathing down.
```
Before totals: Total engine dose: 72 cal Air Bike, 400 s SkiErg (11.2 min, 16 bouts). Loaded reps 180, bodyweight reps 0, impact contacts 0. Active 25.5 min, recovery 10.1 min, transitions 6.0 min, elapsed 55.6 min (duty 0.72). Hard (RPE 8+) 2.0 min (8%), all-out blocks 1, stations 6, transitions 24.

AFTER:
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] circuit · 6 rounds · 45 s between rounds · RPE 7–8 · ~26.6 min
   6 rounds, moving station to station; rest 45 s after each round.
   - Air Bike / Assault Bike: 12 cal (RPE 8)
   - Kettlebell Swing: 15 (moderate, crisp hips (RPE <= 8))
   - Dumbbell Push Press: 15 (light-moderate load, unbroken, short of failure)
   - Sled Rope Pull: 20 m (heavy, steady)
FINISHER [Finisher] finisher · 6 rounds · 6 x 20s work / 40s recovery · RPE 9–9 · ~5.3 min
   All-out efforts with easy recovery between.
   - Battle Rope Waves: 6 × 20 s / 40 s easy (RPE 9)
COOLDOWN 5 min: Easy pace and breathing down.
```
After totals: Total engine dose: 72 cal Air Bike (4.5 min, 6 bouts). Loaded reps 180, bodyweight reps 0, impact contacts 0. Active 18.8 min, recovery 7.1 min, transitions 6.0 min, elapsed 48.4 min (duty 0.73). Hard (RPE 8+) 2.0 min (11%), all-out blocks 1, stations 5, transitions 24.
Primary block completeness: sufficient (score 27.8 vs sufficient 21.0 / substantial 32.0; main block 16.8 active min at RPE 7–8, 180 loaded reps, 4.5 engine min)

Why the final workload is appropriate: fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | irritated: attempt 0 'direct_finisher' realized ['shape', 'exercises', 'finisher'] → satisfied

### B15: B15 Amped · Hybrid · advanced (legacy 7 x 800 m Row fixture beside it)

Context: State(s): amped · level: advanced · goal: lose weight / conditioning · 60 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym

BEFORE:
```
Warm-up 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
[Hybrid] anchor_circuit · 4 rounds · 45 s between rounds · RPE 7–8 · ~39.7 min
   Every round: Row Erg, then every station. Walk 45 s between rounds.
   - Row Erg: 950 m (RPE 8) [anchor]
   - Dumbbell Snatch: 12/side (light-moderate load, unbroken, short of failure)
   - Med-Ball Slam: 15 (RPE 8)
   - Sled Rope Pull: 20 m (heavy, steady)
   - Front-Rack Carry: 60 m (moderate-heavy, stay tall)
Downshift 5 min: Easy pace and breathing down.
```
Before totals: Total engine dose: 3800 m Row Erg (16.2 min, 4 bouts). Loaded reps 156, bodyweight reps 0, impact contacts 0. Active 31.4 min, recovery 2.2 min, transitions 6.0 min, elapsed 51.7 min (duty 0.93). Anchor share 43%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 24.

AFTER:
```
WARM-UP / PREP 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Hybrid] anchor_circuit · 4 rounds · 45 s between rounds · RPE 7–8 · ~39.7 min
   Every round: Row Erg, then every station. Walk 45 s between rounds.
   - Row Erg: 950 m (RPE 8) [anchor]
   - Dumbbell Snatch: 12/side (light-moderate load, unbroken, short of failure)
   - Med-Ball Slam: 15 (RPE 8)
   - Sled Rope Pull: 20 m (heavy, steady)
   - Front-Rack Carry: 60 m (moderate-heavy, stay tall)
COOLDOWN 5 min: Easy pace and breathing down.
```
After totals: Total engine dose: 3800 m Row Erg (16.2 min, 4 bouts). Loaded reps 156, bodyweight reps 0, impact contacts 0. Active 31.4 min, recovery 2.2 min, transitions 6.0 min, elapsed 51.7 min (duty 0.93). Anchor share 43%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 24.
Primary block completeness: substantial (score 51.9 vs sufficient 21.0 / substantial 32.0; main block 31.4 active min at RPE 7–8, 156 loaded reps, 16.2 engine min)

Why the final workload is appropriate: amped: attempt 0 'extra_round' realized ['volume'] → satisfied

### D1: D1 Beginner · Amped · Hybrid (beginner rules: RPE ≤ 8, no finisher, recovery ≥ work)

Context: State(s): amped · level: beginner · goal: lose weight / conditioning · 60 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym

BEFORE:
```
Warm-up 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
[Hybrid] anchor_circuit · 4 rounds · 60 s between rounds · RPE 7–8 · ~36.0 min
   Every round: Row Erg, then every station. Walk 60 s between rounds.
   - Row Erg: 650 m (RPE 8) [anchor]
   - Skater Hops: 12/side (RPE 8, quick and clean)
   - Med-Ball Slam: 13 (RPE 8)
   - Dumbbell Push Press: 16 (light-moderate load, unbroken, short of failure)
   - Front-Rack Carry: 60 m (moderate-heavy, stay tall)
Downshift 5 min: Easy pace and breathing down.
```
Before totals: Total engine dose: 2600 m Row Erg (14.8 min, 4 bouts). Loaded reps 116, bodyweight reps 96, impact contacts 28. Active 27.0 min, recovery 3.0 min, transitions 6.0 min, elapsed 48.0 min (duty 0.9). Anchor share 45%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 24.

AFTER:
```
WARM-UP / PREP 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Hybrid] anchor_circuit · 4 rounds · 60 s between rounds · RPE 7–8 · ~36.0 min
   Every round: Row Erg, then every station. Walk 60 s between rounds.
   - Row Erg: 650 m (RPE 8) [anchor]
   - Skater Hops: 12/side (RPE 8, quick and clean)
   - Med-Ball Slam: 13 (RPE 8)
   - Dumbbell Push Press: 16 (light-moderate load, unbroken, short of failure)
   - Front-Rack Carry: 60 m (moderate-heavy, stay tall)
COOLDOWN 5 min: Easy pace and breathing down.
```
After totals: Total engine dose: 2600 m Row Erg (14.8 min, 4 bouts). Loaded reps 116, bodyweight reps 96, impact contacts 28. Active 27.0 min, recovery 3.0 min, transitions 6.0 min, elapsed 48.0 min (duty 0.9). Anchor share 45%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 24.
Primary block completeness: substantial (score 43.2 vs sufficient 14.0 / substantial 22.0; main block 27.0 active min at RPE 7–8, 116 loaded reps, 14.8 engine min)

Why the final workload is appropriate: fill: anchor bout 550 → 650 distance | amped: attempt 0 'harder_output' realized [] → NOT satisfied | amped: fallback harder_output → denser | amped: attempt 1 'denser' realized ['recovery'] → satisfied

### C1: C1 Low Energy + Amped · Hybrid · intermediate

Context: State(s): low_energy, amped · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_hybrid · soreness: none · equipment: commercial_gym

BEFORE:
```
Warm-up 9 min: 9 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
[Hybrid] anchor_circuit · 4 rounds · 45 s between rounds · RPE 7–8 · ~30.5 min
   First 3 min: set your Row Erg pace and load every station, then start round 1. Every round: Row Erg, then every station. Walk 45 s between rounds.
   - Row Erg: 600 m (RPE 8) [anchor]
   - Kettlebell Swing: 20 (moderate, crisp hips (RPE <= 8))
   - Med-Ball Slam: 15 (RPE 8)
   - Dumbbell Push Press: 16 (light-moderate load, unbroken, short of failure)
[Closer] continuous · RPE 5–6 · ~6.0 min
   One steady rhythm, no programmed recovery. Purpose: an easy flush to bring the heart rate down gradually after the anchor work.
   - SkiErg: 6 min steady (RPE 5-6)
Downshift 6 min: Easy pace and breathing down.
```
Before totals: Total engine dose: 2400 m Row Erg, 360 s SkiErg (17.3 min, 5 bouts). Loaded reps 204, bodyweight reps 0, impact contacts 0. Active 26.3 min, recovery 2.2 min, transitions 8.0 min, elapsed 53.0 min (duty 0.92). Anchor share 33%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 32.

AFTER:
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Hybrid] anchor_circuit · 4 rounds · 45 s between rounds · RPE 7–8 · ~28.5 min
   First 1 min: set your Row Erg pace and load every station, then start round 1. Every round: Row Erg, then every station. Walk 45 s between rounds.
   - Row Erg: 600 m (RPE 8) [anchor]
   - Kettlebell Swing: 20 (moderate, crisp hips (RPE <= 8))
   - Med-Ball Slam: 15 (RPE 8)
   - Dumbbell Push Press: 16 (light-moderate load, unbroken, short of failure)
COOLDOWN 8 min: Easy pace and breathing down.
```
After totals: Total engine dose: 2400 m Row Erg (11.3 min, 4 bouts). Loaded reps 204, bodyweight reps 0, impact contacts 0. Active 20.3 min, recovery 2.2 min, transitions 6.0 min, elapsed 46.5 min (duty 0.9). Anchor share 43%. Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 4, transitions 24.
Primary block completeness: substantial (score 34.1 vs sufficient 16.2 / substantial 24.3; main block 20.3 active min at RPE 7–8, 204 loaded reps, 11.3 engine min)

Why the final workload is appropriate: coherence repair (low_energy): primary → 4 rounds | fill: warm-up +2 min (movement preparation) | fill: downshift +3 min | elapsed 46.5 min accepted (window [48, 60], main block substantial)

### B14 (hard Amped Circuit, advanced): B14 Amped · Circuit · advanced

Context: State(s): amped · level: advanced · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym

BEFORE:
```
Warm-up 6 min: 6 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
[Circuit] circuit · 6 rounds · 45 s between rounds · RPE 8–9 · ~23.9 min
   6 rounds, moving station to station; rest 45 s after each round.
   - Box Jump: 10 (RPE 8, quick and clean)
   - Kettlebell Swing: 15 (moderate, crisp hips (RPE <= 8))
   - Dumbbell Push Press: 15 (light-moderate load, unbroken, short of failure)
   - Med-Ball Slam: 12 (RPE 9)
[Complement] intervals · 12 rounds · 12 x 40s work / 20s recovery · RPE 7–8 · ~11.7 min
   Hard intervals on the same machine; easy pace between.
   - SkiErg: 12 × 40 s / 20 s easy (RPE 8)
Downshift 5 min: Easy pace and breathing down.
```
Before totals: Total engine dose: 480 s SkiErg (8.0 min, 12 bouts). Loaded reps 312, bodyweight reps 0, impact contacts 18. Active 22.1 min, recovery 7.4 min, transitions 6.0 min, elapsed 48.0 min (duty 0.75). Hard (RPE 8+) 14.1 min (64%), all-out blocks 0, stations 5, transitions 24.

AFTER:
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] circuit · 6 rounds · 45 s between rounds · RPE 8–9 · ~23.9 min
   6 rounds, moving station to station; rest 45 s after each round.
   - Box Jump: 10 (RPE 8, quick and clean)
   - Kettlebell Swing: 15 (moderate, crisp hips (RPE <= 8))
   - Dumbbell Push Press: 15 (light-moderate load, unbroken, short of failure)
   - Med-Ball Slam: 12 (RPE 9)
COOLDOWN 8 min: Easy pace and breathing down.
```
After totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 312, bodyweight reps 0, impact contacts 18. Active 14.1 min, recovery 3.8 min, transitions 6.0 min, elapsed 41.9 min (duty 0.79). Hard (RPE 8+) 14.1 min (100%), all-out blocks 0, stations 4, transitions 24.
Primary block completeness: sufficient (score 27.6 vs sufficient 21.0 / substantial 32.0; main block 14.1 active min at RPE 8–9, 312 loaded reps, 0.0 engine min)

Why the final workload is appropriate: fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | amped: attempt 0 'harder_output' realized ['rpe'] → satisfied | elapsed 41.9 min accepted (window [48, 60], main block sufficient)

### B11 (Irritated Circuit): B11 Irritated · Circuit · intermediate

Context: State(s): irritated · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym

BEFORE:
```
Warm-up 6 min: 6 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
[Circuit] timed_circuit · 6 rounds · 6 x 40s work / 20s recovery · 45 s between rounds · RPE 8–9 · ~29.8 min
   40 s work / 20 s rest per station, rotate through all stations; 6 rounds.
   - Air Bike / Assault Bike: 40 s (RPE 9)
   - Kettlebell Swing: 40 s (moderate, crisp hips (RPE <= 8))
   - Dumbbell Push Press: 40 s (light-moderate load, unbroken, short of failure)
   - Sled Rope Pull: 40 s (heavy, steady)
[Complement] intervals · 10 rounds · 10 x 40s work / 20s recovery · RPE 7–8 · ~9.7 min
   Hard intervals on the same machine; easy pace between.
   - Row Erg: 10 × 40 s / 20 s easy (RPE 8)
Downshift 5 min: Easy pace and breathing down.
```
Before totals: Total engine dose: 240 s Air Bike, 400 s Row Erg (10.7 min, 16 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 22.7 min, recovery 14.8 min, transitions 2.0 min, elapsed 51.9 min (duty 0.61). Hard (RPE 8+) 16.0 min (71%), all-out blocks 0, stations 5, transitions 8.

AFTER:
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] timed_circuit · 5 rounds · 5 x 40s work / 20s recovery · 45 s between rounds · RPE 8–9 · ~24.7 min
   40 s work / 20 s rest per station, rotate through all stations; 5 rounds.
   - Air Bike / Assault Bike: 40 s (RPE 9)
   - Kettlebell Swing: 40 s (moderate, crisp hips (RPE <= 8))
   - Dumbbell Push Press: 40 s (light-moderate load, unbroken, short of failure)
   - Sled Rope Pull: 40 s (heavy, steady)
COOLDOWN 8 min: Easy pace and breathing down.
```
After totals: Total engine dose: 200 s Air Bike (3.3 min, 5 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 13.3 min, recovery 9.7 min, transitions 1.7 min, elapsed 42.7 min (duty 0.58). Hard (RPE 8+) 13.3 min (100%), all-out blocks 0, stations 4, transitions 6.
Primary block completeness: sufficient (score 18.8 vs sufficient 18.0 / substantial 27.0; main block 13.3 active min at RPE 8–9, 0 loaded reps, 3.3 engine min)

Why the final workload is appropriate: fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | irritated: attempt 0 'hard_simple' realized ['rpe'] → satisfied | elapsed 42.7 min accepted (window [48, 60], main block sufficient)

### B8 (Bored Circuit, advanced): B8 Bored · Circuit · advanced

Context: State(s): bored · level: advanced · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym

BEFORE:
```
Warm-up 6 min: 6 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
[Circuit] timed_circuit · 6 rounds · 6 x 45s work / 15s recovery · 45 s between rounds · RPE 7–8 · ~29.8 min
   45 s work / 15 s rest per station, rotate through all stations; 6 rounds.
   - Battle Rope Waves: 45 s (RPE 8)
   - Devil Press: 45 s (light-moderate load, unbroken, short of failure)
   - Dumbbell Floor Press: 45 s (light-moderate load, unbroken, short of failure)
   - Wall Ball: 45 s (RPE 8)
[Complement] ladder · RPE 7–8 · ~6.4 min
   Alternate the exercises at each rung, self-paced: 16-14-12-10-8-6-4 reps.
   - Skater Hops: Ladder 16-14-12-10-8-6-4 (RPE 8, quick and clean)
   - Med-Ball Slam: Ladder 16-14-12-10-8-6-4 (RPE 8)
Downshift 5 min: Easy pace and breathing down.
```
Before totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 70, bodyweight reps 70, impact contacts 21. Active 23.2 min, recovery 9.8 min, transitions 3.2 min, elapsed 48.7 min (duty 0.7). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 6, transitions 12.

AFTER:
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] timed_circuit · 5 rounds · 5 x 45s work / 15s recovery · 45 s between rounds · RPE 7–8 · ~24.7 min
   45 s work / 15 s rest per station, rotate through all stations; 5 rounds.
   - Battle Rope Waves: 45 s (RPE 8)
   - Devil Press: 45 s (light-moderate load, unbroken, short of failure)
   - Dumbbell Floor Press: 45 s (light-moderate load, unbroken, short of failure)
   - Wall Ball: 45 s (RPE 8)
OPTIONAL COMPLEMENT [Complement] ladder · RPE 7–8 · ~3.8 min
   Alternate the exercises at each rung, self-paced: 12-10-8-6-4 reps. Purpose: a change of stimulus after the circuit (Bored).
   - Skater Hops: Ladder 12-10-8-6-4 (RPE 8, quick and clean)
   - Med-Ball Slam: Ladder 12-10-8-6-4 (RPE 8)
COOLDOWN 8 min: Easy pace and breathing down.
```
After totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 40, bodyweight reps 40, impact contacts 12. Active 18.0 min, recovery 8.0 min, transitions 2.5 min, elapsed 48.0 min (duty 0.69). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 6, transitions 10.
Primary block completeness: sufficient (score 22.5 vs sufficient 21.0 / substantial 32.0; main block 15.0 active min at RPE 7–8, 0 loaded reps, 0.0 engine min)

Why the final workload is appropriate: fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | bored: attempt 0 'new_modalities' realized ['exercises'] → satisfied

### B5 (Stressed Circuit): B5 Stressed · Circuit · intermediate

Context: State(s): stressed · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym

BEFORE:
```
Warm-up 6 min: 6 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
[Circuit] circuit · 5 rounds · 60 s between rounds · RPE 7–8 · ~23.2 min
   5 rounds, moving station to station; rest 60 s after each round.
   - Burpee: 8 (RPE 8, quick and clean)
   - Reverse Lunge: 10/side (light-moderate load, unbroken, short of failure)
   - Push-Up: 12 (steady, clean reps)
   - Front Plank: 40 s (steady, clean reps)
[Complement] intervals · 7 rounds · 7 x 60s work / 75s recovery · RPE 7–7 · ~14.5 min
   Hard intervals on the same machine; easy pace between.
   - Jump Rope: 7 × 1 min / 1:15 easy (RPE 7, quick and clean)
Downshift 5 min: Easy pace and breathing down.
```
Before totals: Total engine dose: 420 s Jump Rope (7.0 min, 7 bouts). Loaded reps 100, bodyweight reps 100, impact contacts 12. Active 21.2 min, recovery 11.5 min, transitions 5.0 min, elapsed 50.2 min (duty 0.65). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 20.

AFTER:
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] circuit · 5 rounds · 60 s between rounds · RPE 7–8 · ~23.2 min
   5 rounds, moving station to station; rest 60 s after each round.
   - Burpee: 8 (RPE 8, quick and clean)
   - Reverse Lunge: 10/side (light-moderate load, unbroken, short of failure)
   - Push-Up: 12 (steady, clean reps)
   - Front Plank: 40 s (steady, clean reps)
COOLDOWN 8 min: Easy pace and breathing down.
```
After totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 100, bodyweight reps 100, impact contacts 12. Active 14.2 min, recovery 4.0 min, transitions 5.0 min, elapsed 41.2 min (duty 0.78). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 4, transitions 20.
Primary block completeness: sufficient (score 24.1 vs sufficient 18.0 / substantial 27.0; main block 14.2 active min at RPE 7–8, 100 loaded reps, 0.0 engine min)

Why the final workload is appropriate: fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | elapsed 41.2 min accepted (window [48, 60], main block sufficient)

### B1 (Low Energy Engine): B1 Low Energy · Engine · intermediate

Context: State(s): low_energy · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_engine · soreness: none · equipment: commercial_gym

BEFORE:
```
Warm-up 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
[Engine] intervals · 4 rounds · 4 x 240s work / 90s recovery · RPE 6–7 · ~20.5 min
   Hard intervals on the same machine; easy pace between.
   - Stationary Bike: 4 × 4 min / 1:30 easy (RPE 7)
[Complement] continuous · RPE 5–6 · ~13.5 min
   One steady rhythm, no programmed recovery.
   - Row Erg: 13:30 steady (RPE 5-6)
Downshift 5 min: Easy pace and breathing down.
```
Before totals: Total engine dose: 960 s Stationary Bike, 810 s Row Erg (29.5 min, 5 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 29.5 min, recovery 4.5 min, transitions 0.0 min, elapsed 47.5 min (duty 0.87). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 2, transitions 0.

AFTER:
```
WARM-UP / PREP 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Engine] intervals · 5 rounds · 5 x 240s work / 90s recovery · RPE 6–7 · ~26.0 min
   Hard intervals on the same machine; easy pace between.
   - Stationary Bike: 5 × 4 min / 1:30 easy (RPE 7)
OPTIONAL COMPLEMENT [Complement] continuous · RPE 5–6 · ~8.0 min
   One steady rhythm, no programmed recovery. Purpose: sustainable extra minutes on a second modality (Low Energy).
   - Row Erg: 8 min steady (RPE 5-6)
COOLDOWN 5 min: Easy pace and breathing down.
```
After totals: Total engine dose: 1200 s Stationary Bike, 480 s Row Erg (28.0 min, 6 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 28.0 min, recovery 6.0 min, transitions 0.0 min, elapsed 47.5 min (duty 0.82). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 2, transitions 0.
Primary block completeness: sufficient (score 17.0 vs sufficient 16.2 / substantial 24.3; main block 20.0 active min at RPE 6–7, 0 loaded reps, 20.0 engine min)

Why the final workload is appropriate: fill: primary +1 unit (stimulus below sufficient) | complement kept: sustainable extra minutes on a second modality (Low Energy) (8.0 min) | low_energy: attempt 0 'lighter' realized ['rpe'] → satisfied | elapsed 47.5 min accepted (window [48, 60], main block sufficient)

### A2 (intermediate Circuit): A2 Circuit · intermediate · build muscle

Context: State(s): none · level: intermediate · goal: build muscle · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym

BEFORE:
```
Warm-up 6 min: 6 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
[Circuit] circuit · 6 rounds · 60 s between rounds · RPE 7–8 · ~26.2 min
   6 rounds, moving station to station; rest 60 s after each round.
   - Wall Ball: 15 (RPE 8)
   - Kettlebell Swing: 15 (moderate, crisp hips (RPE <= 8))
   - Push-Up: 12 (steady, clean reps)
   - Sled Push: 20 m (heavy, steady)
[Complement] intervals · 10 rounds · 10 x 40s work / 20s recovery · RPE 7–8 · ~9.7 min
   Hard intervals on the same machine; easy pace between.
   - Air Bike / Assault Bike: 10 × 40 s / 20 s easy (RPE 8)
Downshift 5 min: Easy pace and breathing down.
```
Before totals: Total engine dose: 400 s Air Bike (6.7 min, 10 bouts). Loaded reps 180, bodyweight reps 72, impact contacts 0. Active 21.9 min, recovery 8.0 min, transitions 6.0 min, elapsed 48.4 min (duty 0.73). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 24.

AFTER:
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] circuit · 6 rounds · 60 s between rounds · RPE 7–8 · ~26.2 min
   6 rounds, moving station to station; rest 60 s after each round.
   - Wall Ball: 15 (RPE 8)
   - Kettlebell Swing: 15 (moderate, crisp hips (RPE <= 8))
   - Push-Up: 12 (steady, clean reps)
   - Sled Push: 20 m (heavy, steady)
COOLDOWN 8 min: Easy pace and breathing down.
```
After totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 180, bodyweight reps 72, impact contacts 0. Active 15.2 min, recovery 5.0 min, transitions 6.0 min, elapsed 44.2 min (duty 0.75). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 4, transitions 24.
Primary block completeness: substantial (score 28.5 vs sufficient 18.0 / substantial 27.0; main block 15.2 active min at RPE 7–8, 180 loaded reps, 0.0 engine min)

Why the final workload is appropriate: fill: 3 min technique and setup before round 1 | fill: warm-up +4 min (movement preparation) | fill: downshift +3 min | elapsed 44.2 min accepted (window [48, 60], main block substantial)

### B2 (beginner Circuit): B2 Low Energy · Circuit · beginner

Context: State(s): low_energy · level: beginner · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: commercial_gym

BEFORE:
```
Warm-up 6 min: 6 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
[Circuit] timed_circuit · 5 rounds · 5 x 35s work / 35s recovery · 60 s between rounds · RPE 6–7 · ~29.0 min
   35 s work / 35 s rest per station, rotate through all stations; 5 rounds.
   - Stationary Bike: 35 s (RPE 7)
   - Glute Bridge: 35 s (steady, clean reps)
   - Suspension Trainer Row / TRX Row: 35 s (steady, clean reps)
   - Farmer Carry: 35 s (heavy, steady)
[Complement] continuous · RPE 5–6 · ~10.5 min
   One steady rhythm, no programmed recovery.
   - Treadmill Run: 10:30 steady (RPE 5-6)
Downshift 5 min: Easy pace and breathing down.
```
Before totals: Total engine dose: 175 s Stationary Bike, 630 s Treadmill Run (13.4 min, 6 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 22.2 min, recovery 15.7 min, transitions 1.7 min, elapsed 52.0 min (duty 0.59). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 6.

AFTER:
```
WARM-UP / PREP 6 min: 6 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
MAIN WORKOUT [Circuit] timed_circuit · 6 rounds · 6 x 35s work / 35s recovery · 60 s between rounds · RPE 6–7 · ~35.0 min
   35 s work / 35 s rest per station, rotate through all stations; 6 rounds.
   - Stationary Bike: 35 s (RPE 7)
   - Glute Bridge: 35 s (steady, clean reps)
   - Suspension Trainer Row / TRX Row: 35 s (steady, clean reps)
   - Farmer Carry: 35 s (heavy, steady)
OPTIONAL COMPLEMENT [Complement] continuous · RPE 5–6 · ~8.0 min
   One steady rhythm, no programmed recovery. Purpose: main block alone is below a sufficient stimulus.
   - Treadmill Run: 8 min steady (RPE 5-6)
COOLDOWN 5 min: Easy pace and breathing down.
```
After totals: Total engine dose: 210 s Stationary Bike, 480 s Treadmill Run (11.5 min, 7 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 22.0 min, recovery 19.0 min, transitions 2.0 min, elapsed 55.5 min (duty 0.54). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 5, transitions 8.
Primary block completeness: insufficient (score 11.9 vs sufficient 12.6 / substantial 19.8; main block 14.0 active min at RPE 6–7, 0 loaded reps, 3.5 engine min)

Why the final workload is appropriate: fill: primary +1 unit (stimulus below sufficient) | fill: primary +1 unit (stimulus below sufficient) | complement kept: main block alone is below a sufficient stimulus (8.0 min) | low_energy: attempt 0 'lighter' realized ['rpe', 'exercises'] → satisfied

### A1 (Engine, intermediate): A1 Engine · intermediate · conditioning goal

Context: State(s): none · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_engine · soreness: none · equipment: commercial_gym

BEFORE:
```
Warm-up 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
[Engine] intervals · 5 rounds · 5 x 240s work / 90s recovery · RPE 7–8 · ~26.0 min
   Hard intervals on the same machine; easy pace between.
   - Air Bike / Assault Bike: 5 × 4 min / 1:30 easy (RPE 8)
[Complement] circuit · 3 rounds · 45 s between rounds · RPE 6–7 · ~10.5 min
   3 rounds, moving station to station; rest 45 s after each round.
   - Goblet Squat: 15 (light-moderate load, unbroken, short of failure)
   - Push-Up: 12 (steady, clean reps)
   - Dead Bug: 10/side (steady, clean reps)
Downshift 5 min: Easy pace and breathing down.
```
Before totals: Total engine dose: 1200 s Air Bike (20.0 min, 5 bouts). Loaded reps 45, bodyweight reps 96, impact contacts 0. Active 26.8 min, recovery 7.5 min, transitions 2.2 min, elapsed 50.0 min (duty 0.78). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 4, transitions 9.

AFTER:
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Engine] intervals · 4 rounds · 4 x 240s work / 90s recovery · RPE 7–8 · ~20.5 min
   Hard intervals on the same machine; easy pace between.
   - Air Bike / Assault Bike: 4 × 4 min / 1:30 easy (RPE 8)
COOLDOWN 8 min: Easy pace and breathing down.
```
After totals: Total engine dose: 960 s Air Bike (16.0 min, 4 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 16.0 min, recovery 4.5 min, transitions 0.0 min, elapsed 38.5 min (duty 0.78). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 1, transitions 0.
Primary block completeness: sufficient (score 20.8 vs sufficient 18.0 / substantial 27.0; main block 16.0 active min at RPE 7–8, 0 loaded reps, 16.0 engine min)

Why the final workload is appropriate: fill: warm-up +3 min (movement preparation) | fill: downshift +3 min | elapsed 38.5 min accepted (window [48, 60], main block sufficient)

### A4 (Engine, advanced): A4 Engine · advanced · feel better

Context: State(s): none · level: advanced · goal: feel better / reduce stress · 60 min · archetype: sweat_engine · soreness: none · equipment: commercial_gym

BEFORE:
```
Warm-up 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
[Engine] intervals · 4 rounds · 4 x 300s work / 90s recovery · RPE 7–8 · ~24.5 min
   Hard intervals on the same machine; easy pace between.
   - Air Bike / Assault Bike: 4 × 5 min / 1:30 easy (RPE 8)
[Complement] circuit · 3 rounds · 45 s between rounds · RPE 6–7 · ~10.5 min
   3 rounds, moving station to station; rest 45 s after each round.
   - Goblet Squat: 15 (light-moderate load, unbroken, short of failure)
   - Push-Up: 12 (steady, clean reps)
   - Dead Bug: 10/side (steady, clean reps)
Downshift 5 min: Easy pace and breathing down.
```
Before totals: Total engine dose: 1200 s Air Bike (20.0 min, 4 bouts). Loaded reps 45, bodyweight reps 96, impact contacts 0. Active 26.8 min, recovery 6.0 min, transitions 2.2 min, elapsed 48.5 min (duty 0.82). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 4, transitions 9.

AFTER:
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Engine] intervals · 4 rounds · 4 x 300s work / 90s recovery · RPE 7–8 · ~24.5 min
   Hard intervals on the same machine; easy pace between.
   - Air Bike / Assault Bike: 4 × 5 min / 1:30 easy (RPE 8)
COOLDOWN 8 min: Easy pace and breathing down.
```
After totals: Total engine dose: 1200 s Air Bike (20.0 min, 4 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 20.0 min, recovery 4.5 min, transitions 0.0 min, elapsed 42.5 min (duty 0.82). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 1, transitions 0.
Primary block completeness: sufficient (score 26.0 vs sufficient 21.0 / substantial 32.0; main block 20.0 active min at RPE 7–8, 0 loaded reps, 20.0 engine min)

Why the final workload is appropriate: fill: warm-up +3 min (movement preparation) | fill: downshift +3 min | elapsed 42.5 min accepted (window [48, 60], main block sufficient)

### B13 (Engine, Amped): B13 Amped · Engine · intermediate

Context: State(s): amped · level: intermediate · goal: lose weight / conditioning · 60 min · archetype: sweat_engine · soreness: none · equipment: commercial_gym

BEFORE:
```
Warm-up 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
[Engine] intervals · 18 rounds · 18 x 40s work / 20s recovery · RPE 9–9 · ~17.7 min
   Hard intervals on the same machine; easy pace between.
   - SkiErg: 18 × 40 s / 20 s easy (RPE 9)
[Complement] circuit · 5 rounds · 45 s between rounds · RPE 6–7 · ~16.8 min
   5 rounds, moving station to station; rest 45 s after each round.
   - Kettlebell Swing: 15 (moderate, crisp hips (RPE <= 8))
   - Dumbbell Push Press: 15 (light-moderate load, unbroken, short of failure)
   - Front-Rack Carry: 40 m (moderate-heavy, stay tall)
Downshift 5 min: Easy pace and breathing down.
```
Before totals: Total engine dose: 720 s SkiErg (12.0 min, 18 bouts). Loaded reps 150, bodyweight reps 0, impact contacts 0. Active 22.1 min, recovery 8.7 min, transitions 3.8 min, elapsed 48.0 min (duty 0.72). Hard (RPE 8+) 12.0 min (54%), all-out blocks 1, stations 4, transitions 15.

AFTER:
```
WARM-UP / PREP 10 min: 10 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Engine] intervals · 17 rounds · 17 x 40s work / 20s recovery · RPE 9–9 · ~16.7 min
   Hard intervals on the same machine; easy pace between.
   - SkiErg: 17 × 40 s / 20 s easy (RPE 9)
COOLDOWN 8 min: Easy pace and breathing down.
```
After totals: Total engine dose: 680 s SkiErg (11.3 min, 17 bouts). Loaded reps 0, bodyweight reps 0, impact contacts 0. Active 11.3 min, recovery 5.3 min, transitions 0.0 min, elapsed 34.7 min (duty 0.68). Hard (RPE 8+) 11.3 min (100%), all-out blocks 1, stations 1, transitions 0.
Primary block completeness: sufficient (score 18.1 vs sufficient 18.0 / substantial 27.0; main block 11.3 active min at RPE 9–9, 0 loaded reps, 11.3 engine min)

Why the final workload is appropriate: fill: warm-up +3 min (movement preparation) | fill: downshift +3 min | amped: attempt 0 'harder_output' realized ['rpe'] → satisfied | elapsed 34.7 min accepted (window [48, 60], main block sufficient)

### D9 (Circuit, Low Energy, beginner): D9 Free-weight limited · Low Energy · Circuit · beginner

Context: State(s): low_energy · level: beginner · goal: lose weight / conditioning · 60 min · archetype: sweat_circuit · soreness: none · equipment: free_weight_limited

BEFORE:
```
Warm-up 6 min: 6 min: easy cardio building to a moderate pace, plus a few reps of the first stations.
[Circuit] timed_circuit · 5 rounds · 5 x 45s work / 45s recovery · 45 s between rounds · RPE 6–7 · ~35.7 min
   45 s work / 45 s rest per station, rotate through all stations; 5 rounds.
   - Farmer Carry: 35 s (heavy, steady)
   - Glute Bridge: 35 s (steady, clean reps)
   - Bench Dip: 35 s (light-moderate load, unbroken, short of failure)
   - Decline Sit-Up: 35 s (light-moderate load, unbroken, short of failure)
[Complement] circuit · 4 rounds · 60 s between rounds · RPE 5–6 · ~8.3 min
   4 rounds, moving station to station; rest 60 s after each round.
   - Front Plank: 30 s (steady, clean reps)
   - Push-Up: 8 (steady, clean reps)
Downshift 5 min: Easy pace and breathing down.
```
Before totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 0, bodyweight reps 32, impact contacts 0. Active 18.3 min, recovery 21.0 min, transitions 3.7 min, elapsed 55.5 min (duty 0.47). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 6, transitions 14.

AFTER:
```
WARM-UP / PREP 7 min: 7 min: easy cardio building to a moderate pace, plus a few reps of the first stations. Extra time here on purpose: the main block is the workout, so arrive at it ready.
MAIN WORKOUT [Circuit] timed_circuit · 5 rounds · 5 x 45s work / 45s recovery · 45 s between rounds · RPE 6–7 · ~35.7 min
   45 s work / 45 s rest per station, rotate through all stations; 5 rounds.
   - Farmer Carry: 35 s (heavy, steady)
   - Glute Bridge: 35 s (steady, clean reps)
   - Bench Dip: 35 s (light-moderate load, unbroken, short of failure)
   - Dead Bug: 35 s (steady, clean reps)
OPTIONAL COMPLEMENT [Complement] circuit · 2 rounds · 60 s between rounds · RPE 6–7 · ~3.9 min
   2 rounds, moving station to station; rest 60 s after each round. Purpose: easy flush after the harder work (Low Energy).
   - Decline Sit-Up: 12 (light-moderate load, unbroken, short of failure)
   - Push-Up: 8 (steady, clean reps)
COOLDOWN 5 min: Easy pace and breathing down.
```
After totals: Total engine dose: none (0.0 min, 0 bouts). Loaded reps 24, bodyweight reps 16, impact contacts 0. Active 16.9 min, recovery 19.0 min, transitions 2.7 min, elapsed 52.0 min (duty 0.47). Hard (RPE 8+) 0.0 min (0%), all-out blocks 0, stations 6, transitions 10.
Primary block completeness: sufficient (score 12.8 vs sufficient 12.6 / substantial 19.8; main block 15.0 active min at RPE 6–7, 0 loaded reps, 0.0 engine min)

Why the final workload is appropriate: complement kept: easy flush after the harder work (Low Energy) (3.9 min) | fill: 1 min technique and setup before round 1 | fill: warm-up +1 min (movement preparation) | low_energy: attempt 0 'steadier' realized ['rpe', 'bouts', 'impact'] → satisfied

## QA metrics (2,012-run production-path sample)

```
rows 2012 ok 1968
CONFLICTS Counter({('sore_target_conflict', (), 'sweat_hybrid', 'commercial_gym', 'intermediate', ('legs',), ()): 2, ('sore_target_conflict', ('irritated',), 'sweat_hybrid', 'commercial_gym', 'intermediate', ('legs',), ()): 2, ('sore_target_conflict', ('low_energy',), 'sweat_hybrid', 'commercial_gym', 'intermediate', ('legs',), ()): 2, ('equipment_insufficient', (), 'sweat_engine', 'minimal', 'beginner', (), ()): 2, ('equipment_insufficient', ('bored',), 'sweat_engine', 'minimal', 'beginner', (), ()): 2, ('equipment_insufficient', ('low_energy',), 'sweat_engine', 'minimal', 'beginner', (), ()): 2, ('equipment_insufficient', (), 'sweat_engine', 'free_weight_limited', 'beginner', (), ()): 2, ('equipment_insufficient', ('bored',), 'sweat_engine', 'free_weight_limited', 'beginner', (), ()): 2, ('equipment_insufficient', ('low_energy',), 'sweat_engine', 'free_weight_limited', 'beginner', (), ()): 2, ('equipment_insufficient', (), 'sweat_hybrid', 'minimal', 'beginner', (), ()): 2, ('equipment_insufficient', ('bored',), 'sweat_hybrid', 'minimal', 'beginner', (), ()): 2, ('equipment_insufficient', ('low_energy',), 'sweat_hybrid', 'minimal', 'beginner', (), ()): 2, ('equipment_insufficient', (), 'sweat_hybrid', 'minimal', 'advanced', (), ()): 2, ('equipment_insufficient', ('bored',), 'sweat_hybrid', 'minimal', 'advanced', (), ()): 2, ('equipment_insufficient', ('low_energy',), 'sweat_hybrid', 'minimal', 'advanced', (), ()): 2, ('equipment_insufficient', (), 'sweat_hybrid', 'free_weight_limited', 'beginner', (), ()): 2, ('equipment_insufficient', ('bored',), 'sweat_hybrid', 'free_weight_limited', 'beginner', (), ()): 2, ('equipment_insufficient', ('low_energy',), 'sweat_hybrid', 'free_weight_limited', 'beginner', (), ()): 2, ('equipment_insufficient', (), 'sweat_hybrid', 'free_weight_limited', 'advanced', (), ()): 2, ('equipment_insufficient', ('bored',), 'sweat_hybrid', 'free_weight_limited', 'advanced', (), ()): 2, ('equipment_insufficient', ('low_energy',), 'sweat_hybrid', 'free_weight_limited', 'advanced', (), ()): 2, ('cannot_build', ('low_energy',), 'sweat_engine', 'minimal', 'advanced', (), ()): 1, ('cannot_build', ('low_energy',), 'sweat_engine', 'free_weight_limited', 'advanced', (), ()): 1})
ARCH by tag {'arch': {'sweat_engine': 390, 'sweat_circuit': 390, 'sweat_hybrid': 390}, 'pick': {'sweat_engine': 84, 'sweat_circuit': 76, 'sweat_hybrid': 20}, 'target': {'sweat_circuit': 216}, 'sore': {'sweat_engine': 40, 'sweat_circuit': 32, 'sweat_hybrid': 18}, 'equip': {'sweat_engine': 36, 'sweat_circuit': 58, 'sweat_hybrid': 12}}
SHAPES {('sweat_engine', 'continuous'): 229, ('sweat_engine', 'long_intervals'): 310, ('sweat_engine', 'pyramid'): 59, ('sweat_circuit', 'rounds'): 430, ('sweat_circuit', 'timed'): 368, ('sweat_hybrid', 'anchor_couplet'): 166, ('sweat_hybrid', 'split_anchor'): 275, ('sweat_hybrid', 'anchor_triplet'): 51, ('sweat_circuit', 'emom'): 41, ('sweat_hybrid', 'ladder_hybrid'): 17, ('sweat_engine', 'short_intervals'): 22}
DUR 30 n 783 min 23.5 p10 23.7 med 25.0 p90 28.46 max 31.0 under 102 over 0
DUR 60 n 1185 min 34.7 p10 41.56 med 47.8 p90 50.5 max 55.5 under 650 over 0
GATE {'low_energy': (486, 491, 0.99), 'stressed': (426, 433, 0.984), 'bored': (481, 501, 0.96), 'irritated': (352, 367, 0.959), 'amped': (407, 433, 0.94)}
GATE FAILS 70
   (['low_energy', 'amped'], 'sweat_engine', 30, 'beginner', None, None, {'low_energy': True, 'amped': False})
   (['low_energy', 'amped'], 'sweat_engine', 30, 'intermediate', None, None, {'low_energy': True, 'amped': False})
   (['low_energy', 'amped'], 'sweat_engine', 30, 'advanced', None, None, {'low_energy': True, 'amped': False})
   (['low_energy', 'amped'], 'sweat_engine', 60, 'beginner', None, None, {'low_energy': True, 'amped': False})
   (['low_energy', 'amped'], 'sweat_engine', 60, 'intermediate', None, None, {'low_energy': True, 'amped': False})
   (['low_energy', 'amped'], 'sweat_engine', 60, 'advanced', None, None, {'low_energy': True, 'amped': False})
   (['amped', 'stressed'], 'sweat_circuit', 60, 'beginner', None, None, {'amped': True, 'stressed': False})
   (['irritated', 'stressed'], 'sweat_hybrid', 30, 'advanced', None, None, {'irritated': False, 'stressed': True})
   (['low_energy', 'amped'], 'sweat_engine', 30, 'beginner', None, None, {'low_energy': True, 'amped': False})
   (['low_energy', 'amped'], 'sweat_engine', 60, 'intermediate', None, None, {'low_energy': False, 'amped': True})
   (['irritated', 'stressed'], 'sweat_engine', 30, 'intermediate', None, None, {'irritated': False, 'stressed': True})
   (['irritated', 'stressed'], 'sweat_engine', 30, 'advanced', None, None, {'irritated': False, 'stressed': True})
   (['irritated', 'stressed'], 'sweat_engine', 60, 'intermediate', None, None, {'irritated': False, 'stressed': True})
   (['irritated', 'stressed'], 'sweat_engine', 60, 'advanced', None, None, {'irritated': False, 'stressed': True})
   (['bored', 'low_energy'], 'sweat_engine', 30, 'beginner', None, None, {'bored': False, 'low_energy': True})
   (['bored', 'low_energy'], 'sweat_engine', 30, 'intermediate', None, None, {'bored': False, 'low_energy': True})
   (['bored', 'low_energy'], 'sweat_engine', 30, 'advanced', None, None, {'bored': False, 'low_energy': True})
   (['bored', 'low_energy'], 'sweat_engine', 60, 'beginner', None, None, {'bored': False, 'low_energy': True})
   (['bored', 'low_energy'], 'sweat_engine', 60, 'intermediate', None, None, {'bored': False, 'low_energy': True})
   (['low_energy', 'amped'], 'sweat_circuit', 30, 'beginner', None, None, {'low_energy': True, 'amped': False})
   (['low_energy', 'amped'], 'sweat_circuit', 30, 'advanced', None, None, {'low_energy': True, 'amped': False})
   (['low_energy', 'amped'], 'sweat_circuit', 60, 'beginner', None, None, {'low_energy': True, 'amped': False})
   (['low_energy', 'amped'], 'sweat_circuit', 60, 'advanced', None, None, {'low_energy': False, 'amped': False})
   (['amped', 'stressed'], 'sweat_hybrid', 60, 'beginner', None, None, {'amped': False, 'stressed': True})
   (['irritated', 'stressed'], 'sweat_hybrid', 30, 'advanced', None, None, {'irritated': False, 'stressed': True})
   (['irritated', 'stressed'], 'sweat_hybrid', 60, 'advanced', None, None, {'irritated': False, 'stressed': True})
   (['low_energy', 'amped'], 'sweat_engine', 30, 'beginner', None, None, {'low_energy': True, 'amped': False})
   (['bored', 'low_energy'], 'sweat_engine', 30, 'beginner', None, None, {'bored': False, 'low_energy': True})
   (['bored', 'low_energy'], 'sweat_engine', 30, 'intermediate', None, None, {'bored': False, 'low_energy': True})
   (['bored', 'low_energy'], 'sweat_engine', 30, 'advanced', None, None, {'bored': False, 'low_energy': True})
   (['bored', 'low_energy'], 'sweat_engine', 60, 'beginner', None, None, {'bored': False, 'low_energy': True})
   (['bored', 'low_energy'], 'sweat_engine', 60, 'intermediate', None, None, {'bored': False, 'low_energy': True})
   (['bored', 'low_energy'], 'sweat_engine', 60, 'advanced', None, None, {'bored': False, 'low_energy': True})
   (['amped', 'bored'], 'sweat_engine', 30, 'beginner', None, None, {'amped': True, 'bored': False})
   (['amped', 'bored'], 'sweat_engine', 30, 'intermediate', None, None, {'amped': True, 'bored': False})
   (['amped', 'bored'], 'sweat_engine', 30, 'advanced', None, None, {'amped': True, 'bored': False})
   (['amped', 'bored'], 'sweat_engine', 60, 'advanced', None, None, {'amped': True, 'bored': False})
   (['irritated', 'stressed'], 'sweat_hybrid', 30, 'advanced', None, None, {'irritated': False, 'stressed': True})
   (['low_energy', 'amped'], 'sweat_engine', 30, 'beginner', None, None, {'low_energy': True, 'amped': False})
   (['low_energy', 'amped'], 'sweat_engine', 60, 'intermediate', None, None, {'low_energy': False, 'amped': True})
COHERENCE sessions 1595 all-pass 1477 verdicts 2225 passed 2107
COH FAILS
   ('irritated', 'nothing direct or forceful to push against') 48
   ('bored', 'experiential difference score 0 below 1') 23
   ('bored', 'experiential difference score 1 below 2') 15
   ('amped', 'readiness not used ') 11
   ('low_energy', '32 transitions ') 6
   ('stressed', '32 transitions') 5
   ('stressed', '36 transitions') 4
   ('low_energy', '2 impact items') 4
   ('stressed', '20 transitions') 2
COH REPAIRS []
BUDGET_OPEN 4 [("['impact contacts 42 above 32']", 4)]
DECISION CODES [('state_expression', 4450), ('duration_backfill', 3327), ('state_gate', 3018), ('shape_selected', 1968), ('primary_block_completeness', 1968), ('state_coherence', 1595), ('state_conflict_resolved', 1192), ('state_rpe', 1107), ('duration_underfill_accepted', 759), ('complement_selected', 467), ('state_gate_fallback', 441), ('budget_repair', 403), ('state_rpe_no_effect', 338), ('state_recovery', 286), ('state_volume', 285), ('complement_skipped', 264), ('archetype_selected', 264), ('finisher_skipped', 259), ('state_stations_no_effect', 229), ('target_routed_circuit', 216), ('state_coherence_repair', 194), ('state_bouts_no_effect', 144), ('sore_exclusion', 90), ('state_volume_no_effect', 63), ('state_stations', 49), ('state_recovery_no_effect', 38), ('state_gate_exhausted', 35), ('finisher_selected', 31), ('state_structure_no_effect', 28), ('complement_unavailable', 25), ('state_gate_yielded', 22), ('state_structure', 8), ('target_coverage_swap', 8), ('archetype_skipped_equipment', 8), ('duration_trim', 7), ('state_bouts', 5), ('budget_open', 4), ('archetype_failed', 2)]
HYBRID 30 n 205 {'anchor_share': (0.32, 0.42, 0.48), 'engine_share': (0.42, 0.55, 0.62), 'loaded_reps': (0, 50, 150), 'bodyweight_reps': (0, 0, 100), 'transitions': (12, 16, 22), 'hard_share': (0.0, 0.0, 0.62), 'stations': (3, 3, 5)}
  shapes Counter({'anchor_couplet': 97, 'split_anchor': 68, 'anchor_triplet': 32, 'ladder_hybrid': 8}) rounds Counter({4: 101, 2: 59, 3: 41, 5: 4})
HYBRID 60 n 304 {'anchor_share': (0.35, 0.41, 0.48), 'engine_share': (0.45, 0.53, 0.62), 'loaded_reps': (0, 124.0, 270), 'bodyweight_reps': (0, 0.0, 144), 'transitions': (24, 25.0, 36), 'hard_share': (0.0, 0.0, 0.61), 'stations': (3, 5.0, 5)}
  shapes Counter({'split_anchor': 207, 'anchor_couplet': 69, 'anchor_triplet': 19, 'ladder_hybrid': 9}) rounds Counter({4: 176, 6: 94, 5: 34})
BUDGET KEYS ['active_min', 'anchor_share', 'blocks', 'bodyweight_reps', 'demanding', 'duty', 'engine', 'engine_bouts', 'engine_min', 'engine_share', 'finisher', 'fixed_stations', 'hard_min', 'hard_share', 'high_impact_items', 'impact_contacts', 'loaded_hinges', 'loaded_reps', 'recovery_min', 'reps_by', 'rpe', 'stations', 'total_min', 'transition_min', 'transitions', 'very_hard_blocks']
LEVEL sweat_engine beginner n 65 rpe_max [(7, 24), (8, 20), (6, 19), (5, 2)] loaded 0 impact 0 stations 2 fin 0
LEVEL sweat_engine intermediate n 65 rpe_max [(7, 29), (8, 20), (6, 8), (9, 6)] loaded 0 impact 0 stations 1 fin 3
LEVEL sweat_engine advanced n 65 rpe_max [(7, 32), (8, 19), (6, 8), (9, 6)] loaded 0 impact 0 stations 2 fin 1
LEVEL sweat_circuit beginner n 65 rpe_max [(7, 34), (8, 31)] loaded 60 impact 0 stations 4 fin 0
LEVEL sweat_circuit intermediate n 65 rpe_max [(8, 24), (7, 24), (9, 17)] loaded 115 impact 0 stations 4 fin 3
LEVEL sweat_circuit advanced n 65 rpe_max [(7, 27), (8, 21), (9, 17)] loaded 138 impact 0 stations 4 fin 4
LEVEL sweat_hybrid beginner n 65 rpe_max [(7, 39), (8, 26)] loaded 72 impact 0 stations 4 fin 0
LEVEL sweat_hybrid intermediate n 65 rpe_max [(8, 40), (7, 25)] loaded 125 impact 0 stations 4 fin 0
LEVEL sweat_hybrid advanced n 65 rpe_max [(7, 30), (8, 19), (9, 16)] loaded 130 impact 0 stations 4 fin 0
GOAL shapes {'build_muscle': {('engine', 'continuous'): 2, ('circuit', 'rounds'): 2, ('hybrid', 'anchor_triplet'): 3, ('engine', 'long_intervals'): 2, ('circuit', 'timed'): 4, ('hybrid', 'split_anchor'): 3, ('engine', 'pyramid'): 2}, 'build_strength': {('engine', 'continuous'): 2, ('circuit', 'rounds'): 2, ('hybrid', 'split_anchor'): 6, ('engine', 'long_intervals'): 2, ('circuit', 'timed'): 4, ('engine', 'pyramid'): 2}, 'feel_better_reduce_stress': {('engine', 'continuous'): 2, ('circuit', 'rounds'): 2, ('hybrid', 'split_anchor'): 6, ('engine', 'long_intervals'): 4, ('circuit', 'timed'): 4}, 'improve_athleticism': {('engine', 'short_intervals'): 2, ('circuit', 'rounds'): 2, ('hybrid', 'split_anchor'): 6, ('engine', 'long_intervals'): 2, ('circuit', 'timed'): 4, ('engine', 'pyramid'): 2}, 'lose_weight_conditioning': {('engine', 'continuous'): 2, ('circuit', 'rounds'): 2, ('hybrid', 'split_anchor'): 6, ('engine', 'long_intervals'): 2, ('circuit', 'timed'): 4, ('engine', 'pyramid'): 2}, 'stay_consistent': {('engine', 'continuous'): 2, ('circuit', 'rounds'): 2, ('hybrid', 'split_anchor'): 6, ('engine', 'long_intervals'): 2, ('circuit', 'timed'): 4, ('engine', 'pyramid'): 2}}
SEQ h1 [('eng', 'pyramid', ['ski_erg']), ('hyb', 'split_anchor', ['row_erg']), ('cir', 'emom', ['air_bike']), ('eng', 'continuous', ['stationary_bik']), ('hyb', 'anchor_triplet', ['treadmill_run']), ('hyb', 'split_anchor', ['ski_erg']), ('cir', 'timed', ['row_erg', 'jump_rope']), ('hyb', 'anchor_couplet', ['treadmill_run'])]
   distinct sessions 8 / 8 shape distinct 7
SEQ h2 [('hyb', 'ladder_hybrid', ['ski_erg']), ('hyb', 'anchor_couplet', ['row_erg']), ('hyb', 'anchor_triplet', ['treadmill_run']), ('hyb', 'anchor_couplet', ['ski_erg']), ('hyb', 'split_anchor', ['row_erg']), ('hyb', 'anchor_triplet', ['treadmill_run'])]
   distinct sessions 6 / 6 shape distinct 4
SEQ h3 [('eng', 'continuous', ['row_erg']), ('eng', 'pyramid', ['ski_erg']), ('eng', 'short_intervals', ['air_bike']), ('eng', 'pyramid', ['row_erg']), ('eng', 'long_intervals', ['ski_erg']), ('eng', 'short_intervals', ['air_bike'])]
   distinct sessions 3 / 6 shape distinct 4
SEQ h4 [('cir', 'rounds', ['burpee', 'jump_rope']), ('cir', 'timed', ['dead_bug']), ('cir', 'timed', ['high_knees']), ('cir', 'rounds', ['jumping_jack', 'treadmill_run']), ('cir', 'timed', ['plank']), ('cir', 'rounds', ['burpee', 'jump_rope'])]
   distinct sessions 6 / 6 shape distinct 2
SEQ h5 [('hyb', 'anchor_couplet', ['row_erg']), ('eng', 'long_intervals', ['stationary_bik', 'row_erg']), ('hyb', 'split_anchor', ['ski_erg']), ('eng', 'continuous', ['row_erg']), ('cir', 'rounds', ['air_bike']), ('hyb', 'anchor_triplet', ['row_erg']), ('eng', 'continuous', ['stationary_bik']), ('eng', 'long_intervals', ['treadmill_run'])]
   distinct sessions 8 / 8 shape distinct 6
CLAIMS 5137 unbacked 0
BFT codes [('difficulty', 1968), ('structure', 1968), ('volume', 1968), ('intensity', 1958), ('goal', 1580), ('state_pair', 630), ('why_today', 316), ('state_bored', 231), ('state_low_energy', 221), ('target', 216), ('state_irritated', 187), ('state_stressed', 163), ('state_amped', 163), ('duration', 81), ('equipment', 58), ('sore', 30), ('different_workout', 24), ('history', 22), ('swap', 16), ('rotation_swap', 8)]
DW/SWAP Counter({('dw1', 'ok'): 16, ('dw2', 'ok'): 16, ('swap', 'ok'): 16})

--- GATE excluding States yielded by a conflict rule ---
yielded by rule 22 {'low_energy': (486, 491, 0.99), 'stressed': (426, 433, 0.984), 'bored': (481, 501, 0.96), 'irritated': (352, 367, 0.959), 'amped': (407, 411, 0.99)}
unsatisfied by combination [(('bored', ('bored', 'low_energy'), 'engine', 30), 9), (('bored', ('bored', 'low_energy'), 'engine', 60), 7), (('irritated', ('irritated', 'stressed'), 'hybrid', 30), 5), (('irritated', ('irritated', 'stressed'), 'engine', 30), 4), (('irritated', ('irritated', 'stressed'), 'engine', 60), 4), (('stressed', ('amped', 'stressed'), 'circuit', 60), 3), (('amped', ('amped', 'stressed'), 'hybrid', 60), 3), (('bored', ('amped', 'bored'), 'engine', 30), 3), (('low_energy', ('low_energy', 'amped'), 'engine', 60), 2), (('irritated', ('irritated', 'stressed'), 'hybrid', 60), 2), (('stressed', ('amped', 'stressed'), 'circuit', 30), 2), (('stressed', ('amped', 'stressed'), 'hybrid', 60), 2)]

--- COHERENCE failures after repairs ---
failed verdicts 118
[(('irritated', 'nothing direct or forceful to push against'), 48), (('bored', 'experiential difference score 0 below 1'), 23), (('bored', 'experiential difference score 1 below 2'), 15), (('amped', 'readiness not used '), 11), (('low_energy', '32 transitions '), 6), (('stressed', '32 transitions'), 5), (('stressed', '36 transitions'), 4), (('low_energy', '2 impact items'), 4), (('stressed', '20 transitions'), 2)]
[(('bored', ('bored', 'low_energy'), 'engine', 30, 'beginner'), 5), (('bored', ('bored', 'low_energy'), 'engine', 60, 'beginner'), 5), (('irritated', ('irritated',), 'engine', 30, 'beginner'), 4), (('irritated', ('irritated',), 'engine', 30, 'intermediate'), 4), (('irritated', ('irritated',), 'engine', 30, 'advanced'), 4), (('irritated', ('irritated',), 'engine', 60, 'beginner'), 4), (('amped', ('amped',), 'engine', 30, 'beginner'), 4), (('bored', ('bored', 'low_energy'), 'engine', 30, 'intermediate'), 4), (('bored', ('bored', 'low_energy'), 'engine', 30, 'advanced'), 4), (('bored', ('bored', 'low_energy'), 'engine', 60, 'intermediate'), 4), (('amped', ('amped', 'stressed'), 'circuit', 60, 'beginner'), 4), (('low_energy', ('low_energy',), 'circuit', 60, 'advanced'), 4)]

--- DURATION vs brief windows (30 -> ~22-30, 60 -> ~45-60) ---
30 n 783 below preferred band 102 below brief window 0 within brief window % 100.0
60 n 1185 below preferred band 650 below brief window 357 within brief window % 69.9

--- CONFLICT envelopes ---
Counter({('sore_target_conflict', (), 'sweat_hybrid', 'commercial_gym', 'intermediate', ('legs',)): 2, ('sore_target_conflict', ('irritated',), 'sweat_hybrid', 'commercial_gym', 'intermediate', ('legs',)): 2, ('sore_target_conflict', ('low_energy',), 'sweat_hybrid', 'commercial_gym', 'intermediate', ('legs',)): 2, ('equipment_insufficient', (), 'sweat_engine', 'minimal', 'beginner', ()): 2, ('equipment_insufficient', ('bored',), 'sweat_engine', 'minimal', 'beginner', ()): 2, ('equipment_insufficient', ('low_energy',), 'sweat_engine', 'minimal', 'beginner', ()): 2, ('equipment_insufficient', (), 'sweat_engine', 'free_weight_limited', 'beginner', ()): 2, ('equipment_insufficient', ('bored',), 'sweat_engine', 'free_weight_limited', 'beginner', ()): 2, ('equipment_insufficient', ('low_energy',), 'sweat_engine', 'free_weight_limited', 'beginner', ()): 2, ('equipment_insufficient', (), 'sweat_hybrid', 'minimal', 'beginner', ()): 2, ('equipment_insufficient', ('bored',), 'sweat_hybrid', 'minimal', 'beginner', ()): 2, ('equipment_insufficient', ('low_energy',), 'sweat_hybrid', 'minimal', 'beginner', ()): 2, ('equipment_insufficient', (), 'sweat_hybrid', 'minimal', 'advanced', ()): 2, ('equipment_insufficient', ('bored',), 'sweat_hybrid', 'minimal', 'advanced', ()): 2, ('equipment_insufficient', ('low_energy',), 'sweat_hybrid', 'minimal', 'advanced', ()): 2, ('equipment_insufficient', (), 'sweat_hybrid', 'free_weight_limited', 'beginner', ()): 2, ('equipment_insufficient', ('bored',), 'sweat_hybrid', 'free_weight_limited', 'beginner', ()): 2, ('equipment_insufficient', ('low_energy',), 'sweat_hybrid', 'free_weight_limited', 'beginner', ()): 2, ('equipment_insufficient', (), 'sweat_hybrid', 'free_weight_limited', 'advanced', ()): 2, ('equipment_insufficient', ('bored',), 'sweat_hybrid', 'free_weight_limited', 'advanced', ()): 2, ('equipment_insufficient', ('low_energy',), 'sweat_hybrid', 'free_weight_limited', 'advanced', ()): 2, ('cannot_build', ('low_energy',), 'sweat_engine', 'minimal', 'advanced', ()): 1, ('cannot_build', ('low_energy',), 'sweat_engine', 'free_weight_limited', 'advanced', ()): 1})

--- HYBRID: primary block is the workout (completeness gate) ---
30 hybrids 205 blocks {1: 205} closers 0 second circuits 0
   fills [('technique and setup', 23), ('anchor bout +1 step', 11), ('warm-up extended', 5)]
   primary active minutes deciles [8, 10, 11, 12, 13, 13, 14, 14, 14, 15, 16]
60 hybrids 304 blocks {1: 304} closers 0 second circuits 0
   fills [('technique and setup', 132), ('warm-up extended', 102), ('anchor bout +1 step', 61), ('downshift extended', 56)]
   primary active minutes deciles [16, 20, 22, 24, 26, 27, 27, 28, 29, 30, 32]

===== AFTER (this pass): 1968 sessions =====
block composition, all: {'main only': 1478, 'main + complement': 467, 'main + finisher': 23}
  by archetype:
    circuit: main only 552 (66%), main + complement 277 (33%), main + finisher 10 (1%)
    engine: main only 417 (67%), main + complement 190 (31%), main + finisher 13 (2%)
    hybrid: main only 509 (100%)
  by duration:
    30: main only 783 (100%)
    60: main only 695 (59%), main + complement 467 (39%), main + finisher 23 (2%)
  by level:
    advanced: main only 409 (72%), main + complement 153 (27%), main + finisher 6 (1%)
    beginner: main only 382 (76%), main + complement 122 (24%)
    intermediate: main only 687 (77%), main + complement 192 (21%), main + finisher 17 (2%)
  main + complement + finisher cases: 0
  30 min: median elapsed 25.0, median meaningful active 11.1, median main-block active 11.1, median hard minutes 0.0, median loaded reps 0, median engine minutes 6.0, median warm-up 5, median cooldown 3
    main-block RPE distribution: {'steady (<= 7)': 422, 'moderate (7-8)': 214, 'hard (floor 8+ or 9)': 147}
    steady (<= 7): n 422, complement 0%, finisher 0%
    moderate (7-8): n 214, complement 0%, finisher 0%
    hard (floor 8+ or 9): n 147, complement 0%, finisher 0%
    completeness labels: {'substantial': 312, 'sufficient': 408, 'insufficient': 63}
    by archetype/level: elapsed / main active / total active / hard min / loaded reps / engine min / main-only %
      circuit  advanced      24.4 /  10.9 /  10.9 /   0.0 /  84.0 /   0.0 / 100%
      circuit  beginner      25.0 /   8.3 /   8.3 /   0.0 /    36 /   0.0 / 100%
      circuit  intermediate  24.2 /   9.6 /   9.6 /   0.0 /   0.0 /   0.0 / 100%
      engine   advanced      25.0 /  16.0 /  16.0 /   0.0 /     0 /  16.0 / 100%
      engine   beginner      24.5 /  10.0 /  10.0 /   0.0 /     0 /  10.0 / 100%
      engine   intermediate  24.0 /  12.0 /  12.0 /   0.0 /     0 /  12.0 / 100%
      hybrid   advanced      27.7 /  14.4 /  14.4 /   0.0 /  75.0 /   8.0 / 100%
      hybrid   beginner      25.9 /  11.1 /  11.1 /   0.0 /    32 /   5.7 / 100%
      hybrid   intermediate  27.0 /  13.4 /  13.4 /   0.0 /  72.0 /   6.9 / 100%
  60 min: median elapsed 47.8, median meaningful active 20.5, median main-block active 18.4, median hard minutes 0.0, median loaded reps 56, median engine minutes 12.5, median warm-up 10, median cooldown 6
    main-block RPE distribution: {'steady (<= 7)': 516, 'moderate (7-8)': 513, 'hard (floor 8+ or 9)': 156}
    steady (<= 7): n 516, complement 48%, finisher 2%
    moderate (7-8): n 513, complement 39%, finisher 3%
    hard (floor 8+ or 9): n 156, complement 10%, finisher 0%
    completeness labels: {'sufficient': 709, 'substantial': 319, 'insufficient': 157}
    by archetype/level: elapsed / main active / total active / hard min / loaded reps / engine min / main-only %
      circuit  advanced      47.8 /  16.1 /  19.0 /   0.0 / 100.0 /   4.0 / 38%
      circuit  beginner      47.0 /  12.4 /  14.2 /   0.0 /    32 /   3.0 / 39%
      circuit  intermediate  47.5 /  14.6 /  16.2 /   0.0 /    60 /   4.0 / 46%
      engine   advanced      47.6 /  20.0 /  25.0 /   0.0 /    30 /  20.0 / 31%
      engine   beginner      48.1 /  17.8 /  20.0 /   0.0 /     0 /  20.0 / 44%
      engine   intermediate  44.0 /  21.4 /  26.0 /   0.0 /     0 /  26.0 / 60%
      hybrid   advanced      49.7 /  29.1 /  29.1 /   0.0 / 152.5 /  16.1 / 100%
      hybrid   beginner      48.5 /  21.8 /  21.8 /   0.0 /    78 /  11.0 / 100%
      hybrid   intermediate  48.8 /  26.8 /  26.8 /   0.0 /   150 /  13.6 / 100%

===== BEFORE (previous pass): 1968 sessions =====
block composition, all: {'main only': 992, 'main + complement': 913, 'main + complement + finisher': 62, 'main + finisher': 1}
  by archetype:
    circuit: main only 277 (33%), main + complement 540 (64%), main + complement + finisher 22 (3%)
    engine: main only 211 (34%), main + complement 369 (60%), main + complement + finisher 40 (6%)
    hybrid: main only 504 (99%), main + complement 4 (1%), main + finisher 1 (0%)
  by duration:
    30: main only 693 (89%), main + complement 90 (11%)
    60: main only 299 (25%), main + complement 823 (69%), main + finisher 1 (0%), main + complement + finisher 62 (5%)
  by level:
    advanced: main only 309 (54%), main + complement 240 (42%), main + complement + finisher 19 (3%)
    beginner: main only 285 (57%), main + complement 219 (43%)
    intermediate: main only 398 (44%), main + complement 454 (51%), main + finisher 1 (0%), main + complement + finisher 43 (5%)
  main + complement + finisher cases: 62
     ['irritated'] sweat_engine 60 intermediate lose_weight_conditioning arch ['continuous', 'circuit', 'finisher'] est 56.1
     ['irritated'] sweat_engine 60 advanced lose_weight_conditioning arch ['continuous', 'circuit', 'finisher'] est 56.1
     ['amped', 'bored'] sweat_engine 60 intermediate lose_weight_conditioning arch ['continuous', 'circuit', 'finisher'] est 56.9
     ['amped', 'bored'] sweat_engine 60 advanced lose_weight_conditioning arch ['continuous', 'circuit', 'finisher'] est 56.9
     ['irritated'] sweat_engine 60 intermediate improve_athleticism arch ['intervals', 'circuit', 'finisher'] est 56.1
     ['bored'] sweat_engine 60 intermediate build_muscle arch ['pyramid', 'circuit', 'finisher'] est 58.4
     ['bored'] sweat_engine 60 advanced build_muscle arch ['pyramid', 'circuit', 'finisher'] est 58.4
     ['irritated'] sweat_engine 60 intermediate build_muscle arch ['pyramid', 'circuit', 'finisher'] est 57.1
     ['irritated'] sweat_engine 60 advanced build_muscle arch ['pyramid', 'circuit', 'finisher'] est 57.1
     ['amped'] sweat_engine 60 intermediate build_muscle arch ['pyramid', 'circuit', 'finisher'] est 57.8
     ['amped'] sweat_engine 60 advanced build_muscle arch ['pyramid', 'circuit', 'finisher'] est 57.8
     ['amped', 'bored'] sweat_engine 60 intermediate build_muscle arch ['pyramid', 'circuit', 'finisher'] est 58.4
     ['amped', 'bored'] sweat_engine 60 advanced build_muscle arch ['pyramid', 'circuit', 'finisher'] est 58.4
     ['irritated'] sweat_engine 60 intermediate build_strength arch ['intervals', 'circuit', 'finisher'] est 56.1
     ['bored'] sweat_circuit 60 intermediate build_strength arch ['emom', 'ladder', 'finisher'] est 46.9
     ['bored'] sweat_circuit 60 advanced build_strength arch ['emom', 'ladder', 'finisher'] est 55.5
     ['irritated'] sweat_circuit 60 intermediate build_strength arch ['circuit', 'intervals', 'finisher'] est 52.9
     ['irritated'] sweat_circuit 60 advanced build_strength arch ['circuit', 'intervals', 'finisher'] est 55.6
     ['amped', 'bored'] sweat_circuit 60 intermediate build_strength arch ['emom', 'ladder', 'finisher'] est 42.7
     ['amped', 'bored'] sweat_circuit 60 advanced build_strength arch ['emom', 'ladder', 'finisher'] est 48.7
     ['irritated'] sweat_engine 60 intermediate feel_better_reduce_stress arch ['continuous', 'circuit', 'finisher'] est 56.1
     ['irritated'] sweat_engine 60 advanced feel_better_reduce_stress arch ['continuous', 'circuit', 'finisher'] est 56.1
     ['amped'] sweat_engine 60 intermediate feel_better_reduce_stress arch ['continuous', 'circuit', 'finisher'] est 59.1
     ['amped'] sweat_engine 60 advanced feel_better_reduce_stress arch ['continuous', 'circuit', 'finisher'] est 59.1
     ['amped', 'bored'] sweat_engine 60 intermediate feel_better_reduce_stress arch ['intervals', 'circuit', 'finisher'] est 57.4
     ['bored'] sweat_circuit 60 intermediate feel_better_reduce_stress arch ['emom', 'ladder', 'finisher'] est 45.2
     ['bored'] sweat_circuit 60 advanced feel_better_reduce_stress arch ['emom', 'ladder', 'finisher'] est 53.7
     ['irritated'] sweat_circuit 60 intermediate feel_better_reduce_stress arch ['circuit', 'intervals', 'finisher'] est 57.8
     ['irritated'] sweat_circuit 60 advanced feel_better_reduce_stress arch ['circuit', 'intervals', 'finisher'] est 55.6
     ['amped'] sweat_circuit 60 advanced feel_better_reduce_stress arch ['circuit', 'intervals', 'finisher'] est 58.7
     ['amped', 'bored'] sweat_circuit 60 intermediate feel_better_reduce_stress arch ['circuit', 'ladder', 'finisher'] est 50.5
     ['amped', 'bored'] sweat_circuit 60 advanced feel_better_reduce_stress arch ['circuit', 'ladder', 'finisher'] est 54.9
     ['irritated'] sweat_engine 60 intermediate lose_weight_conditioning pick ['continuous', 'circuit', 'finisher'] est 56.1
     ['irritated'] sweat_engine 60 advanced lose_weight_conditioning pick ['continuous', 'circuit', 'finisher'] est 56.1
     ['bored'] sweat_circuit 60 intermediate build_strength pick ['emom', 'ladder', 'finisher'] est 46.9
     ['bored'] sweat_circuit 60 advanced build_strength pick ['emom', 'ladder', 'finisher'] est 55.5
     ['irritated'] sweat_engine 60 intermediate feel_better_reduce_stress pick ['continuous', 'circuit', 'finisher'] est 56.1
     ['irritated'] sweat_engine 60 advanced feel_better_reduce_stress pick ['continuous', 'circuit', 'finisher'] est 56.1
     ['amped'] sweat_engine 60 intermediate feel_better_reduce_stress pick ['continuous', 'circuit', 'finisher'] est 59.1
     ['amped'] sweat_engine 60 advanced feel_better_reduce_stress pick ['continuous', 'circuit', 'finisher'] est 59.1
  30 min: median elapsed 26.6, median meaningful active 12.0, median main-block active 11.7, median hard minutes 0.0, median loaded reps 0, median engine minutes 6.3, median warm-up 0, median cooldown 0
    main-block RPE distribution: {'steady (<= 7)': 420, 'moderate (7-8)': 219, 'hard (floor 8+ or 9)': 144}
    steady (<= 7): n 420, complement 5%, finisher 0%
    moderate (7-8): n 219, complement 19%, finisher 0%
    hard (floor 8+ or 9): n 144, complement 18%, finisher 0%
    by archetype/level: elapsed / main active / total active / hard min / loaded reps / engine min / main-only %
      circuit  advanced      26.6 /  11.9 /  12.0 /   0.0 /  84.0 /   0.0 / 96%
      circuit  beginner      25.4 /   9.3 /   9.3 /   0.0 /    48 /   0.0 / 88%
      circuit  intermediate  26.6 /  10.7 /  10.7 /   0.0 /  31.0 /   0.0 / 72%
      engine   advanced      27.5 /  16.0 /  16.0 /   0.0 /     0 /  16.0 / 84%
      engine   beginner      24.5 /  10.0 /  10.0 /   0.0 /     0 /  10.0 / 100%
      engine   intermediate  27.5 /  16.0 /  16.0 /   0.0 /     0 /  16.0 / 84%
      hybrid   advanced      27.9 /  14.5 /  14.5 /   0.0 /  75.0 /   8.1 / 100%
      hybrid   beginner      25.9 /  11.1 /  11.1 /   0.0 /    32 /   5.7 / 100%
      hybrid   intermediate  27.2 /  13.5 /  13.5 /   0.0 /  72.0 /   6.9 / 100%
  60 min: median elapsed 49.3, median meaningful active 25.7, median main-block active 19.1, median hard minutes 0.0, median loaded reps 84, median engine minutes 13.6, median warm-up 0, median cooldown 0
    main-block RPE distribution: {'steady (<= 7)': 513, 'moderate (7-8)': 541, 'hard (floor 8+ or 9)': 131}
    steady (<= 7): n 513, complement 80%, finisher 4%
    moderate (7-8): n 541, complement 73%, finisher 7%
    hard (floor 8+ or 9): n 131, complement 63%, finisher 1%
    by archetype/level: elapsed / main active / total active / hard min / loaded reps / engine min / main-only %
      circuit  advanced      50.6 /  18.6 /  24.5 /   0.0 / 106.5 /   6.7 / 0%
      circuit  beginner      48.5 /  12.7 /  19.0 /   0.0 /    40 /   7.0 / 0%
      circuit  intermediate  48.9 /  16.5 /  22.6 /   0.0 /    70 /   8.0 / 0%
      engine   advanced      49.9 /  18.8 /  28.1 /   0.0 /    60 /  20.0 / 0%
      engine   beginner      49.5 /  15.7 /  22.1 /   0.0 /    36 /  15.0 / 0%
      engine   intermediate  50.0 /  19.2 /  28.2 /   0.0 /    60 /  20.0 / 0%
      hybrid   advanced      49.8 /  29.1 /  29.1 /   0.0 / 152.5 /  16.1 / 100%
      hybrid   beginner      48.7 /  25.3 /  25.3 /   0.0 /    78 /  12.8 / 99%
      hybrid   intermediate  48.8 /  26.8 /  26.8 /   0.0 /   150 /  13.8 / 97%
```