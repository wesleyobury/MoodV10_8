# MOOD V3 Strength Core Rebuild: Founder Review Pack

Every workout below came through the real production path (`service.generate_workout`) with the rebuilt Strength core. Same user/date seed reproduces the same workout. Where a legacy block is shown it is the Phase 2.6 engine run on identical inputs (`adapter_legacy_phase26.py`).

## A. No State

### Upper Push, 60, intermediate

Inputs: {'states': [], 'duration': 60, 'experience': 'intermediate', 'archetype': 'strength_upper_push'}  ·  user/date seed `wes / 2026-10-14`
**Upper Push** · variant **Top Set + Back-off** · 55–60 min (est. 58.4 min) · 21 working sets
```
  Barbell Bench Press: 4 × 4/7/7/7 (top set, then back off)  RIR 2  rest 240 s  (Top set heavy, then back off 10–15% for the remaining sets. Stop each set with about 2 reps left in the tank.)
  Parallel Bar Dip: 4 × 8–10  RIR 2  rest 135 s
  Smith Machine Incline Press: 4 × 8–10  RIR 2  rest 135 s
  SUPERSET A (3 rounds, rest 60 s after each round)
    A1 Dumbbell Fly: 3 × 10–12  RIR 1
    A2 Cable Triceps Pressdown: 3 × 10–12  RIR 1
  EZ-Bar Skull Crusher: 3 × 10–12  RIR 1  rest 60 s
```
Built for Today: “Barbell Bench Press (4 sets: 4/7/7/7) leads as the main lift, then 2 strength lifts and 3 accessories, with part of it run as a superset.”
Fired: top set 4 then 3 × 7

Legacy V3 (Phase 2.6) for the same inputs: strength_upper_push · est. 42.0 min
```
  Dumbbell Bench Press: 4 × 8  RIR 2  rest 120 s
  Parallel Bar Dip: 3 × 10  RIR 2  rest 90 s
  Plate-Loaded Incline Press: 3 × 10  RIR 2  rest 90 s
  Cable Fly: 2 × 12  RIR 1  rest 60 s
  Cable Triceps Pressdown: 2 × 12  RIR 1  rest 60 s
  Dumbbell Skull Crusher: 2 × 12  RIR 1  rest 60 s
```

### Lower Body: Squat, 60, intermediate

Inputs: {'states': [], 'duration': 60, 'experience': 'intermediate', 'archetype': 'strength_lower_squat'}  ·  user/date seed `wes / 2026-10-15`
**Lower Body: Squat** · variant **Traditional** · 50–55 min (est. 53.5 min) · 18 working sets
```
  Hack Squat: 4 × 5–7  RIR 2  rest 180 s
  Leg Press: 4 × 8–10  RIR 2  rest 120 s
  Walking Lunge: 4 × 8–10/side  RIR 2  rest 120 s
  Reverse Nordic Curl: 3 × 12–15  RIR 1  rest 60 s
  Roman Chair / GHD Glute-Ham Raise: 3 × 10–12  RIR 1  rest 60 s
```
Built for Today: “Hack Squat (4 × 5–7) leads as the main lift, then 2 strength lifts and 2 accessories.”
Fired: no State levers (no State selected)

Legacy V3 (Phase 2.6) for the same inputs: strength_lower_squat · est. 43.0 min
```
  Barbell Back Squat: 4 × 6  RIR 2  rest 150 s
  Leg Press: 3 × 10  RIR 2  rest 90 s
  Reverse Lunge: 3 × 10/side  RIR 2  rest 90 s
  Leg Extension: 3 × 12  RIR 1  rest 60 s
  Roman Chair / GHD Glute-Ham Raise: 3 × 12  RIR 1  rest 60 s
```

### Upper Pull, 60, advanced

Inputs: {'states': [], 'duration': 60, 'experience': 'advanced', 'archetype': 'strength_upper_pull'}  ·  user/date seed `wes / 2026-10-16`
**Upper Pull** · variant **Top Set + Back-off** · about 55 min (est. 55.8 min) · 18 working sets
```
  Chest-Supported Machine Row: 4 × 4/7/7/7 (top set, then back off)  RIR 2  rest 240 s  (Top set heavy, then back off 10–15% for the remaining sets. Stop each set with about 2 reps left in the tank.)
  Pull-Up: 4 × 8–10  RIR 2  rest 135 s
  Bent-Over Dumbbell Row (Two-Arm): 4 × 8–10  RIR 2  rest 135 s
  Dumbbell Pullover: 2 × 10–12  RIR 1  rest 45 s
  EZ-Bar Preacher Curl: 2 × 10–12  RIR 1  rest 45 s
  Bayesian Cable Curl: 2 × 10–12/side  RIR 1  rest 45 s
```
Built for Today: “Chest-Supported Machine Row (4 sets: 4/7/7/7) leads as the main lift, then 2 strength lifts and 3 accessories.”
Fired: trim: accessory_rest_shortened; trim: set_removed ancillary_depth; top set 4 then 3 × 7

### Glutes + Legs, 60, beginner

Inputs: {'states': [], 'duration': 60, 'experience': 'beginner', 'archetype': 'strength_glutes_legs'}  ·  user/date seed `wes / 2026-10-17`
**Glutes + Legs** · variant **Traditional** · 50–55 min (est. 53.2 min) · 16 working sets
```
  Barbell Hip Thrust: 4 × 6–8  RIR 2  rest 150 s
  Dumbbell Romanian Deadlift: 4 × 8–10  RIR 2  rest 120 s
  Reverse Lunge: 4 × 8–10/side  RIR 2  rest 120 s
  Cable Glute Kickback: 2 × 12–15/side  RIR 2  rest 60 s
  Leg Extension: 2 × 12–15  RIR 2  rest 60 s
  FINISHER  45° Back Extension: 2 × 15–20  RIR 0  rest 30 s
```
Built for Today: “Beginner difficulty applies MOOD's beginner exercise rules: all 6 movements are beginner-rated and technically approachable.” “Barbell Hip Thrust (4 × 6–8) leads as the main lift, then 2 strength lifts and 2 accessories.”
Fired: finisher burnout (back_extension_45)

Legacy V3 (Phase 2.6) for the same inputs: strength_glutes_legs · est. 41.0 min
```
  Barbell Hip Thrust: 4 × 8  RIR 2  rest 120 s
  Dumbbell Romanian Deadlift: 3 × 10  RIR 2  rest 90 s
  Reverse Lunge: 3 × 10/side  RIR 2  rest 90 s
  Cable Glute Kickback: 3 × 12/side  RIR 1  rest 60 s
  Leg Extension: 3 × 12  RIR 1  rest 60 s
```

### MOOD's Pick, 30, intermediate (first session)

Inputs: {'states': [], 'duration': 30, 'experience': 'intermediate'}  ·  user/date seed `wes / 2026-10-18`
**Upper Pull** · variant **Efficient** · 25–30 min (est. 26.1 min) · 10 working sets
```
  Chest-Supported Machine Row: 3 × 5–7  RIR 2  rest 135 s
  Assisted Pull-Up Machine: 3 × 8–10  RIR 2  rest 90 s
  SUPERSET A (2 rounds, rest 60 s after each round)
    A1 Dumbbell Pullover: 2 × 10–12  RIR 1
    A2 Bayesian Cable Curl: 2 × 10–12/side  RIR 1
```
Built for Today: “30 minutes: 4 exercises and 10 working sets, with the main work kept.” “Chest-Supported Machine Row (3 × 5–7) leads as the main lift, then 1 strength lift and 2 accessories, with part of it run as a superset.”
Fired: backfill: slot_added target_accessory

### Full Body, 60, intermediate

Inputs: {'states': [], 'duration': 60, 'experience': 'intermediate', 'archetype': 'strength_full_body'}  ·  user/date seed `wes / 2026-10-19`
**Full Body** · variant **Heavy Primary** · 55–60 min (est. 58.9 min) · 16 working sets
```
  Barbell Romanian Deadlift: 5 × 4–6  RIR 2  rest 240 s
  Renegade Row: 4 × 8–10/side  RIR 2  rest 135 s
  Pull-Up: 4 × 8–10  RIR 2  rest 135 s
  Pallof Press: 3 × 10–12/side  RIR 1  rest 60 s
```
Built for Today: “Barbell Romanian Deadlift (5 × 4–6) leads as the main lift, then 2 strength lifts and 1 accessory.”
Fired: no State levers (no State selected)

## B. Low Energy

### Upper Push, 60, intermediate

Inputs: {'states': ['low_energy'], 'duration': 60, 'experience': 'intermediate', 'archetype': 'strength_upper_push'}  ·  user/date seed `wes / 2026-10-14`
**Upper Push** · variant **Compound + Paired Accessories** · about 55 min (est. 55.5 min) · 21 working sets
```
  Barbell Bench Press: 4 × 5–7  RIR 3  rest 195 s
  Parallel Bar Dip: 4 × 10–12  RIR 3  rest 120 s
  Plate-Loaded Incline Press: 4 × 10–12  RIR 3  rest 120 s
  SUPERSET A (3 rounds, rest 60 s after each round)
    A1 Dumbbell Fly: 3 × 10–12  RIR 1
    A2 Machine Triceps Extension: 3 × 10–12  RIR 1
  Overhead Cable Triceps Extension: 3 × 10–12  RIR 1  rest 60 s
```
Built for Today: “You're Low Energy, so 1 more rep in reserve on the main lifts.” “Barbell Bench Press (4 × 5–7) leads as the main lift, then 2 strength lifts and 3 accessories, with part of it run as a superset.”
Fired: low_energy → expression 'moderate_load'; low_energy: reps compound +0.3 on 2 slot(s); low_energy: rir compound +1 on 3 slot(s)

Legacy V3 (Phase 2.6) for the same inputs: strength_upper_push · est. 40.0 min
```
  Dumbbell Bench Press: 4 × 8  RIR 2  rest 120 s
  Seated Dumbbell Shoulder Press: 3 × 10  RIR 2  rest 90 s
  Plate-Loaded Incline Press: 3 × 10  RIR 2  rest 90 s
  Pec Deck: 2 × 12  RIR 1  rest 60 s
  Machine Triceps Extension: 3 × 12  RIR 1  rest 60 s
```

### Lower Body: Hinge, 60, intermediate

Inputs: {'states': ['low_energy'], 'duration': 60, 'experience': 'intermediate', 'archetype': 'strength_lower_hinge'}  ·  user/date seed `wes / 2026-10-20`
**Lower Body: Hinge** · variant **Traditional** · 50–55 min (est. 51.7 min) · 16 working sets
```
  Barbell Romanian Deadlift: 4 × 5–7  RIR 2  rest 180 s
  Cable Pull-Through: 4 × 8–10  RIR 2  rest 120 s
  Reverse Lunge: 4 × 8–10/side  RIR 2  rest 120 s
  Single-Leg Lying Leg Curl: 4 × 10–12/side  RIR 2  rest 60 s
```
Built for Today: “You're Low Energy, so 1 more rep in reserve on the accessories and one accessory left out.” “Barbell Romanian Deadlift (4 × 5–7) leads as the main lift, then 2 strength lifts and 1 accessory.”
Fired: low_energy → expression 'simplify'; low_energy: one accessory slot removed; low_energy: rir accessory +1 on 1 slot(s); backfill: set_added target_accessory

### Upper Pull, 30, beginner

Inputs: {'states': ['low_energy'], 'duration': 30, 'experience': 'beginner', 'archetype': 'strength_upper_pull'}  ·  user/date seed `wes / 2026-10-21`
**Upper Pull** · variant **Efficient** · 25–30 min (est. 26.0 min) · 10 working sets
```
  Chest-Supported Machine Row: 3 × 6–8  RIR 2  rest 120 s
  Lat Pulldown: 3 × 10–12  RIR 2  rest 90 s
  SUPERSET A (2 rounds, rest 60 s after each round)
    A1 Machine Preacher Curl: 2 × 12–15  RIR 2
    A2 Band Pull-Apart: 2 × 15–20  RIR 2
```
Built for Today: “Stable, low-friction movements keep the session productive without adding unnecessary systemic fatigue.” “30 minutes: 4 exercises and 10 working sets, with the main work kept.” “Beginner difficulty applies MOOD's beginner exercise rules: all 4 movements are beginner-rated and technically approachable.” “Chest-Supported Machine Row (3 × 6–8) leads as the main lift, then 1 strength lift and 2 accessories, with part of it run as a superset.”
Fired: low_energy → expression 'simplify'; low_energy: slot_removed lever had nothing to change; low_energy: rir lever had nothing to change; backfill: slot_added target_accessory

## C. Amped

### Upper Push, 60, intermediate

Inputs: {'states': ['amped'], 'duration': 60, 'experience': 'intermediate', 'archetype': 'strength_upper_push'}  ·  user/date seed `wes / 2026-10-14`
**Upper Push** · variant **Compound + Paired Accessories** · 55–60 min (est. 58.4 min) · 22 working sets
```
  Barbell Bench Press: 5 × 5–7  RIR 2  rest 195 s
  Parallel Bar Dip: 4 × 8–10  RIR 2  rest 120 s
  Smith Machine Incline Press: 4 × 8–10  RIR 2  rest 120 s
  SUPERSET A (3 rounds, rest 60 s after each round)
    A1 Dumbbell Fly: 3 × 10–12  RIR 1
    A2 Cable Triceps Pressdown: 3 × 10–12  RIR 1
  EZ-Bar Skull Crusher: 3 × 10–12  RIR 1  rest 60 s
```
Built for Today: “You're Amped, so one more working set on the main lift.” “Barbell Bench Press (5 × 5–7) leads as the main lift, then 2 strength lifts and 3 accessories, with part of it run as a superset.”
Fired: amped → expression 'extra_set_paired'; amped: volume primary +1 on 1 slot(s)

Legacy V3 (Phase 2.6) for the same inputs: strength_upper_push · est. 43.0 min
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

### Lower Body: Squat, 60, advanced

Inputs: {'states': ['amped'], 'duration': 60, 'experience': 'advanced', 'archetype': 'strength_lower_squat'}  ·  user/date seed `wes / 2026-10-22`
**Lower Body: Squat** · variant **Top Set + Back-off** · 55–60 min (est. 58.0 min) · 17 working sets
```
  Barbell Back Squat: 5 × 4/7/7/7/7 (top set, then back off)  RIR 2  rest 240 s  (Top set heavy, then back off 10–15% for the remaining sets. Stop each set with about 2 reps left in the tank.)
  Leg Press: 4 × 8–10  RIR 2  rest 135 s
  Front-Foot Elevated Split Squat: 4 × 8–10/side  RIR 2  rest 135 s
  SUPERSET A (2 rounds, rest 60 s after each round)
    A1 Reverse Nordic Curl: 2 × 12–15  RIR 1
    A2 Roman Chair / GHD Glute-Ham Raise: 2 × 10–12  RIR 1
```
Built for Today: “You're Amped, so one more working set on the main lift.” “Barbell Back Squat (5 sets: 4/7/7/7/7) leads as the main lift, then 2 strength lifts and 2 accessories, with part of it run as a superset.”
Fired: amped → expression 'extra_set_paired'; amped: volume primary +1 on 1 slot(s); trim: accessory_rest_shortened; trim: set_removed support_accessory; top set 4 then 4 × 7

### Upper Body (mixed), 30, intermediate

Inputs: {'states': ['amped'], 'duration': 30, 'experience': 'intermediate', 'archetype': 'strength_upper_mixed'}  ·  user/date seed `wes / 2026-10-23`
**Upper Body** · variant **Compound + Paired Accessories** · about 30 min (est. 30.2 min) · 9 working sets
```
  Barbell Bench Press: 4 × 5–7  RIR 2  rest 165 s
  Chest-Supported Machine Row: 3 × 8–10  RIR 2  rest 120 s
  Cable Lateral Raise: 2 × 15–20/side  RIR 1  rest 45 s
```
Built for Today: “You're Amped, so one more working set on the main lift.” “30 minutes: 3 exercises and 9 working sets, with the main work kept.” “Barbell Bench Press (4 × 5–7) leads as the main lift, then 1 strength lift and 1 accessory.”
Fired: amped → expression 'extra_set_paired'; amped: volume primary +1 on 1 slot(s); trim: set_removed arm_shoulder_accessory

## D. Irritated

### Upper Push, 60, intermediate

Inputs: {'states': ['irritated'], 'duration': 60, 'experience': 'intermediate', 'archetype': 'strength_upper_push'}  ·  user/date seed `wes / 2026-10-14`
**Upper Push** · variant **Top Set + Back-off** · 55–60 min (est. 57.3 min) · 21 working sets
```
  Barbell Bench Press: 4 × 4/7/7/7 (top set, then back off)  RIR 2  rest 240 s  (Top set heavy, then back off 10–15% for the remaining sets. Stop each set with about 2 reps left in the tank.)
  Parallel Bar Dip: 4 × 6–8  RIR 2  rest 135 s
  Smith Machine Incline Press: 4 × 6–8  RIR 2  rest 135 s
  SUPERSET A (3 rounds, rest 60 s after each round)
    A1 Dumbbell Fly: 3 × 10–12  RIR 1
    A2 Cable Triceps Pressdown: 3 × 10–12  RIR 1
  EZ-Bar Skull Crusher: 3 × 10–12  RIR 1  rest 60 s
```
Built for Today: “You're Irritated, so the main lifts sit at the heavier end of their rep range.” “Barbell Bench Press (4 sets: 4/7/7/7) leads as the main lift, then 2 strength lifts and 3 accessories, with part of it run as a superset.”
Fired: irritated → expression 'forceful_finish'; irritated: reps compound -0.15 on 3 slot(s); top set 4 then 3 × 7

Legacy V3 (Phase 2.6) for the same inputs: strength_upper_push · est. 44.0 min
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

Inputs: {'states': ['irritated'], 'duration': 60, 'experience': 'intermediate', 'archetype': 'strength_glutes_legs'}  ·  user/date seed `wes / 2026-10-24`
**Glutes + Legs** · variant **Traditional** · 55–60 min (est. 59.9 min) · 18 working sets
```
  Barbell Hip Thrust: 4 × 5–7  RIR 2  rest 180 s
  Trap-Bar Deadlift: 4 × 8–10  RIR 2  rest 120 s
  Reverse Lunge: 4 × 8–10/side  RIR 2  rest 120 s
  Machine Glute Kickback: 3 × 10–12/side  RIR 1  rest 60 s
  Reverse Nordic Curl: 3 × 12–15  RIR 1  rest 60 s
  FINISHER  Kettlebell Swing: 3 × 15  RIR 1  rest 60 s
```
Built for Today: “You're Irritated, so a forceful finisher (Kettlebell Swing) closes the session.” “Barbell Hip Thrust (4 × 5–7) leads as the main lift, then 2 strength lifts and 2 accessories.”
Fired: irritated → expression 'direct_simple'; irritated: reps lever had nothing to change; finisher forceful (kettlebell_swing) (State-driven)

### Upper Pull, 30, intermediate

Inputs: {'states': ['irritated'], 'duration': 30, 'experience': 'intermediate', 'archetype': 'strength_upper_pull'}  ·  user/date seed `wes / 2026-10-25`
**Upper Pull** · variant **Compound + Paired Accessories** · 25–30 min (est. 29.5 min) · 12 working sets
```
  Chest-Supported Machine Row: 3 × 5–7  RIR 2  rest 165 s
  Neutral-Grip Lat Pulldown: 3 × 8–10  RIR 2  rest 120 s
  SUPERSET A (3 rounds, rest 60 s after each round)
    A1 Dumbbell Pullover: 3 × 10–12  RIR 1
    A2 Barbell Curl: 3 × 10–12  RIR 1
```
Built for Today: “Simple, forceful movements give that energy somewhere productive to go.” “30 minutes: 4 exercises and 12 working sets, with the main work kept.” “Chest-Supported Machine Row (3 × 5–7) leads as the main lift, then 1 strength lift and 2 accessories, with part of it run as a superset.”
Fired: irritated → expression 'direct_simple'; irritated: reps lever had nothing to change

## E. Bored

### Upper Push, 60, intermediate

Inputs: {'states': ['bored'], 'duration': 60, 'experience': 'intermediate', 'archetype': 'strength_upper_push'}  ·  user/date seed `wes / 2026-10-14`
**Upper Push** · variant **Top Set + Back-off** · 55–60 min (est. 59.9 min) · 21 working sets
```
  Barbell Bench Press: 4 × 4/7/7/7 (top set, then back off)  RIR 2  rest 240 s  (Top set heavy, then back off 10–15% for the remaining sets. Stop each set with about 2 reps left in the tank.)
  Parallel Bar Dip: 4 × 8–10  RIR 2  rest 135 s
  Smith Machine Incline Press: 4 × 8–10  RIR 2  rest 135 s
  SUPERSET A (3 rounds, rest 60 s after each round)
    A1 Low-to-High Cable Fly: 3 × 10–12  RIR 1
    A2 Dumbbell Skull Crusher: 3 × 10–12  RIR 1
  Cross-Body Cable Triceps Extension: 3 × 10–12/side  RIR 1  rest 60 s
```
Built for Today: “You're Bored, so today's shape is top backoff rather than your usual straight sets.” “Barbell Bench Press (4 sets: 4/7/7/7) leads as the main lift, then 2 strength lifts and 3 accessories, with part of it run as a superset.”
Fired: bored → expression 'new_structure'; top set 4 then 3 × 7

Legacy V3 (Phase 2.6) for the same inputs: strength_upper_push · est. 40.0 min
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

Inputs: {'states': ['bored'], 'duration': 60, 'experience': 'intermediate', 'archetype': 'strength_lower_squat'}  ·  user/date seed `wes / 2026-10-26`
**Lower Body: Squat** · variant **Compound + Paired Accessories** · 50–55 min (est. 52.3 min) · 18 working sets
```
  Barbell Back Squat: 4 × 5–7  RIR 2  rest 195 s
  Leg Press: 4 × 8–10  RIR 2  rest 120 s
  Lateral Step-Up: 4 × 8–10/side  RIR 2  rest 120 s
  SUPERSET A (3 rounds, rest 60 s after each round)
    A1 Reverse Nordic Curl: 3 × 12–15  RIR 1
    A2 Roman Chair / GHD Glute-Ham Raise: 3 × 10–12  RIR 1
```
Built for Today: “You're Bored, so today's shape is paired rather than your usual straight sets.” “Barbell Back Squat (4 × 5–7) leads as the main lift, then 2 strength lifts and 2 accessories, with part of it run as a superset.”
Fired: bored → expression 'new_exercises'

### Arms, 30, intermediate

Inputs: {'states': ['bored'], 'duration': 30, 'experience': 'intermediate', 'archetype': 'strength_arms'}  ·  user/date seed `wes / 2026-10-27`
**Arms** · variant **Efficient** · about 25 min (est. 25.6 min) · 12 working sets
```
  SUPERSET A (4 rounds, rest 135 s after each round)
    A1 High Cable Curl: 4 × 8–10  RIR 2
    A2 Dumbbell Skull Crusher: 4 × 8–10  RIR 2
  Lu Raise: 4 × 15–20  RIR 1  rest 45 s
```
Built for Today: “MOOD pushed exercise and structure variety today instead of repeating your usual patterns.” “30 minutes: 3 exercises and 12 working sets, with the main work kept.” “High Cable Curl (4 × 8–10) opens the session, then 2 strength lifts and 1 accessory, with part of it run as a superset.”
Fired: bored → expression 'new_structure'; backfill: set_added shoulder_exercise; backfill: set_added shoulder_exercise; backfill: rest_extended; backfill: rest_extended; backfill: rest_extended; backfill: rest_extended

## F. Stressed

### Upper Push, 60, intermediate

Inputs: {'states': ['stressed'], 'duration': 60, 'experience': 'intermediate', 'archetype': 'strength_upper_push'}  ·  user/date seed `wes / 2026-10-14`
**Upper Push** · variant **Top Set + Back-off** · 50–55 min (est. 53.6 min) · 18 working sets
```
  Barbell Bench Press: 4 × 4/7/7/7 (top set, then back off)  RIR 2  rest 240 s  (Top set heavy, then back off 10–15% for the remaining sets. Stop each set with about 2 reps left in the tank.)
  Parallel Bar Dip: 4 × 8–10  RIR 2  rest 135 s
  Plate-Loaded Incline Press: 4 × 8–10  RIR 2  rest 135 s
  SUPERSET A (3 rounds, rest 60 s after each round)
    A1 Dumbbell Fly: 3 × 10–12  RIR 1
    A2 Machine Triceps Extension: 3 × 10–12  RIR 1
```
Built for Today: “You're Stressed, so one accessory left out.” “Barbell Bench Press (4 sets: 4/7/7/7) leads as the main lift, then 2 strength lifts and 2 accessories, with part of it run as a superset.”
Fired: stressed → expression 'simpler'; stressed: one accessory slot removed; top set 4 then 3 × 7

Legacy V3 (Phase 2.6) for the same inputs: strength_upper_push · est. 40.0 min
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

Inputs: {'states': ['stressed'], 'duration': 60, 'experience': 'intermediate', 'archetype': 'strength_lower_hinge'}  ·  user/date seed `wes / 2026-10-28`
**Lower Body: Hinge** · variant **Traditional** · about 55 min (est. 55.4 min) · 18 working sets
```
  Dumbbell Romanian Deadlift: 4 × 5–7  RIR 2  rest 180 s
  Cable Pull-Through: 4 × 8–10  RIR 2  rest 120 s  (Controlled tempo: 3 s lowering, smooth drive, no bounce. Stop each set with about 2 reps left in the tank.)
  Reverse Lunge: 4 × 8–10/side  RIR 2  rest 120 s  (Controlled tempo: 3 s lowering, smooth drive, no bounce. Stop each set with about 2 reps left in the tank.)
  Standing Single-Leg Curl: 3 × 10–12/side  RIR 1  rest 60 s
  Weighted Plank: 3 × 30–45 sec  RIR 1  rest 60 s
```
Built for Today: “You're Stressed, so controlled tempo on the secondary work.” “Dumbbell Romanian Deadlift (4 × 5–7) leads as the main lift, then 2 strength lifts and 2 accessories.”
Fired: stressed → expression 'controlled'; stressed: rir lever had nothing to change; tempo 'controlled' cue

### Upper Pull, 30, intermediate

Inputs: {'states': ['stressed'], 'duration': 30, 'experience': 'intermediate', 'archetype': 'strength_upper_pull'}  ·  user/date seed `wes / 2026-10-29`
**Upper Pull** · variant **Compound + Paired Accessories** · 25–30 min (est. 29.5 min) · 12 working sets
```
  Barbell Row: 3 × 5–7  RIR 2  rest 165 s
  Pull-Up: 3 × 8–10  RIR 2  rest 120 s  (Controlled tempo: 3 s lowering, smooth drive, no bounce. Stop each set with about 2 reps left in the tank.)
  SUPERSET A (3 rounds, rest 60 s after each round)
    A1 Cable Pullover: 3 × 10–12  RIR 1
    A2 Cable Curl: 3 × 10–12  RIR 1
```
Built for Today: “You're Stressed, so controlled tempo on the secondary work.” “30 minutes: 4 exercises and 12 working sets, with the main work kept.” “Barbell Row (3 × 5–7) leads as the main lift, then 1 strength lift and 2 accessories, with part of it run as a superset.”
Fired: stressed → expression 'controlled'; stressed: rir lever had nothing to change; tempo 'controlled' cue

## G. Sore

### MOOD's Pick with sore legs, 60, intermediate

Inputs: {'states': [], 'duration': 60, 'experience': 'intermediate', 'soreness': ['legs']}  ·  user/date seed `wes / 2026-10-30`
**Upper Pull** · variant **Heavy Primary** · 55–60 min (est. 57.7 min) · 19 working sets
```
  Chest-Supported Machine Row: 5 × 4–6  RIR 2  rest 240 s
  Lat Pulldown: 4 × 8–10  RIR 2  rest 135 s
  Inverted Row: 4 × 8–10  RIR 2  rest 135 s
  SUPERSET A (3 rounds, rest 60 s after each round)
    A1 Dumbbell Pullover: 3 × 10–12  RIR 1
    A2 EZ-Bar Curl: 3 × 10–12  RIR 1
```
Built for Today: “Today's workout shifts stress away from your sore legs.” “Chest-Supported Machine Row (5 × 4–6) leads as the main lift, then 2 strength lifts and 2 accessories, with part of it run as a superset.”
Fired: no State levers (no State selected)

### Upper Push with sore shoulders, 60, intermediate

Inputs: {'states': [], 'duration': 60, 'experience': 'intermediate', 'archetype': 'strength_upper_push', 'soreness': ['shoulders']}  ·  user/date seed `wes / 2026-10-31`
**Upper Push** · variant **Efficient** · 50–55 min (est. 51.5 min) · 20 working sets
```
  Barbell Bench Press: 4 × 5–7  RIR 2  rest 150 s
  Parallel Bar Dip: 4 × 8–10  RIR 2  rest 105 s
  Plate-Loaded Incline Press: 4 × 8–10  RIR 2  rest 105 s
  Pec Deck: 4 × 10–12  RIR 1  rest 45 s
  Single-Arm Cable Triceps Extension: 4 × 10–12/side  RIR 1  rest 45 s
```
Built for Today: “Chest + Triceps is trained as planned despite the soreness, because you asked for it.” “Barbell Bench Press (4 × 5–7) leads as the main lift, then 2 strength lifts and 2 accessories.”
Fired: backfill: set_added complementary_press

## H. Multi-State

### Amped + Stressed, Upper Push, 60

Inputs: {'states': ['amped', 'stressed'], 'duration': 60, 'experience': 'intermediate', 'archetype': 'strength_upper_push'}  ·  user/date seed `wes / 2026-10-14`
**Upper Push** · variant **Top Set + Back-off** · 55–60 min (est. 58.0 min) · 19 working sets
```
  Barbell Bench Press: 5 × 4/7/7/7/7 (top set, then back off)  RIR 2  rest 240 s  (Top set heavy, then back off 10–15% for the remaining sets. Stop each set with about 2 reps left in the tank.)
  Parallel Bar Dip: 4 × 8–10  RIR 2  rest 135 s
  Plate-Loaded Incline Press: 4 × 8–10  RIR 2  rest 135 s
  SUPERSET A (3 rounds, rest 60 s after each round)
    A1 Dumbbell Fly: 3 × 10–12  RIR 1
    A2 Machine Triceps Extension: 3 × 10–12  RIR 1
```
Built for Today: “You're Amped, so one more working set on the main lift.” “You're Stressed, so one accessory left out.” “Barbell Bench Press (5 sets: 4/7/7/7/7) leads as the main lift, then 2 strength lifts and 2 accessories, with part of it run as a superset.”
Fired: amped → expression 'extra_set_paired'; stressed → expression 'simpler'; conflict rule 'stressed_caps_density'; amped: volume primary +1 on 1 slot(s); stressed: one accessory slot removed; top set 4 then 4 × 7

Legacy V3 (Phase 2.6) for the same inputs: strength_upper_push · est. 42.0 min
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

Inputs: {'states': ['low_energy', 'amped'], 'duration': 60, 'experience': 'intermediate', 'archetype': 'strength_lower_squat'}  ·  user/date seed `wes / 2026-11-01`
**Lower Body: Squat** · variant **Heavy Primary** · 50–55 min (est. 52.1 min) · 17 working sets
```
  Barbell Back Squat: 5 × 4–6  RIR 2  rest 240 s
  Leg Press: 4 × 8–10  RIR 2  rest 135 s
  Leg Extension: 4 × 10–12  RIR 2  rest 60 s
  Lying Leg Curl: 4 × 10–12  RIR 2  rest 60 s
```
Built for Today: “You're Low Energy, so 1 more rep in reserve on the accessories.” “Your extra energy goes into higher training intent where it fits.” “Barbell Back Squat (5 × 4–6) leads as the main lift, then 1 strength lift and 2 accessories.”
Fired: low_energy → expression 'cost_down'; amped → expression 'extra_set_paired'; conflict rule 'low_energy_vs_amped_effort'; conflict rule 'low_energy_vs_amped_volume'; conflict rule 'low_energy_vs_amped_volume'; low_energy: rir accessory +1 on 2 slot(s); backfill: set_added target_accessory

### Bored + Stressed, Upper Pull, 60

Inputs: {'states': ['bored', 'stressed'], 'duration': 60, 'experience': 'intermediate', 'archetype': 'strength_upper_pull'}  ·  user/date seed `wes / 2026-11-02`
**Upper Pull** · variant **Compound + Paired Accessories** · 55–60 min (est. 56.8 min) · 21 working sets
```
  Chest-Supported Machine Row: 4 × 5–7  RIR 2  rest 195 s
  Pull-Up: 4 × 8–10  RIR 2  rest 120 s  (Controlled tempo: 3 s lowering, smooth drive, no bounce. Stop each set with about 2 reps left in the tank.)
  Meadows Row: 4 × 8–10/side  RIR 2  rest 120 s  (Controlled tempo: 3 s lowering, smooth drive, no bounce. Stop each set with about 2 reps left in the tank.)
  SUPERSET A (3 rounds, rest 60 s after each round)
    A1 Cable Pullover: 3 × 10–12  RIR 1
    A2 Incline Dumbbell Curl: 3 × 10–12  RIR 1
  Barbell Curl: 3 × 10–12  RIR 1  rest 60 s
```
Built for Today: “You're Bored, so today's shape is paired rather than your usual straight sets.” “You're Stressed, so controlled tempo on the secondary work.” “Chest-Supported Machine Row (4 × 5–7) leads as the main lift, then 2 strength lifts and 3 accessories, with part of it run as a superset.”
Fired: bored → expression 'fresh_finish'; stressed → expression 'controlled'; conflict rule 'bored_novelty_stressed_structure'; stressed: rir lever had nothing to change; tempo 'controlled' cue

### Irritated + Low Energy, Glutes + Legs, 30

Inputs: {'states': ['irritated', 'low_energy'], 'duration': 30, 'experience': 'intermediate', 'archetype': 'strength_glutes_legs'}  ·  user/date seed `wes / 2026-11-03`
**Glutes + Legs** · variant **Efficient** · 25–30 min (est. 27.1 min) · 10 working sets
```
  Barbell Hip Thrust: 3 × 5–7  RIR 3  rest 135 s
  Trap-Bar Deadlift: 3 × 10–12  RIR 3  rest 90 s
  Machine Glute Kickback: 2 × 10–12/side  RIR 1  rest 45 s
  Leg Extension: 2 × 10–12  RIR 1  rest 45 s
```
Built for Today: “Simple, forceful movements give that energy somewhere productive to go.” “You're Low Energy, so 1 more rep in reserve on the main lifts.” “30 minutes: 4 exercises and 10 working sets, with the main work kept.” “Barbell Hip Thrust (3 × 5–7) leads as the main lift, then 1 strength lift and 2 accessories.”
Fired: irritated → expression 'direct_simple'; low_energy → expression 'moderate_load'; conflict rule 'low_energy_vs_effort'; irritated: reps lever had nothing to change; low_energy: reps compound +0.3 on 1 slot(s); low_energy: rir compound +1 on 2 slot(s); backfill: slot_added leg_accessory

## I. Custom Target

### Chest, 60, intermediate

Inputs: {'states': [], 'duration': 60, 'experience': 'intermediate', 'target': ['chest']}  ·  user/date seed `wes / 2026-11-04`
**Custom Target** · variant **Traditional** · 50–55 min (est. 51.6 min) · 17 working sets
```
  Incline Dumbbell Press: 5 × 5–7  RIR 2  rest 180 s
  Push-Up: 4 × 8–12  RIR 2  rest 120 s
  Parallel Bar Dip: 4 × 8–10  RIR 2  rest 120 s
  Cable Fly: 4 × 10–12  RIR 1  rest 60 s
```
Built for Today: “All 4 movements train chest, opening with Incline Dumbbell Press (5 × 5–7).”
Fired: backfill: set_added target_block_a#3; backfill: primary_set_added target_block_a#0

Legacy V3 (Phase 2.6) for the same inputs: strength_custom_target · est. 40.0 min
```
  Dumbbell Bench Press: 3 × 10  RIR 2  rest 90 s
  Dumbbell Fly: 3 × 10  RIR 2  rest 90 s
  Pec Deck: 3 × 10  RIR 2  rest 90 s
  Cable Fly: 3 × 10  RIR 2  rest 90 s
  Smith Machine Incline Press: 3 × 10  RIR 2  rest 90 s
```

### Biceps, 60, intermediate, Bored

Inputs: {'states': ['bored'], 'duration': 60, 'experience': 'intermediate', 'target': ['biceps']}  ·  user/date seed `wes / 2026-11-05`
**Custom Target** · variant **Compound + Paired Accessories** · about 40 min (est. 40.9 min) · 16 working sets
```
  Curl to Arnold Press: 4 × 8–10  RIR 2  rest 150 s
  Bayesian Cable Curl: 4 × 10–12/side  RIR 1  rest 60 s
  Barbell Curl: 4 × 10–12  RIR 1  rest 60 s
  EZ-Bar Preacher Curl: 4 × 10–12  RIR 1  rest 60 s
```
Built for Today: “You're Bored, so today's shape is paired rather than your usual straight sets.” “All 4 movements train biceps, opening with Curl to Arnold Press (4 × 8–10).”
Fired: bored → expression 'new_exercises'; backfill: set_added target_block_a#1; backfill: rest_extended; backfill: rest_extended

### Back + Core, 30, intermediate

Inputs: {'states': [], 'duration': 30, 'experience': 'intermediate', 'target': ['back', 'core']}  ·  user/date seed `wes / 2026-11-06`
**Custom Target** · variant **Compound + Paired Accessories** · about 25 min (est. 25.7 min) · 12 working sets
```
  Barbell Row: 4 × 8–10  RIR 2  rest 120 s
  LADDER Cable Pullover: 4 × 13/10/7/5  RIR 1  rest 30 s
  Hanging Knee Raise: 4 × 10–12  RIR 1  rest 45 s
```
Built for Today: “30 minutes: 3 exercises and 12 working sets, with the main work kept.”
Fired: backfill: set_added target_block_a#0; device ladder

## J. Sequential history (same user, Upper Push, Amped every session)

### Session 1

Inputs: {'states': ['amped'], 'duration': 60, 'experience': 'intermediate', 'archetype': 'strength_upper_push'}  ·  user/date seed `seqA / 2026-11-10`
**Upper Push** · variant **Top Set + Back-off** · about 55 min (est. 55.8 min) · 18 working sets
```
  Barbell Bench Press: 4 × 4/7/7/7 (top set, then back off)  RIR 1  rest 240 s  (Top set heavy, then back off 10–15% for the remaining sets. Stop each set with about 1 rep left in the tank.)
  Parallel Bar Dip: 4 × 8–10  RIR 2  rest 135 s
  Smith Machine Incline Press: 4 × 8–10  RIR 2  rest 135 s
  Dumbbell Fly: 2 × 10–12  RIR 1  rest 45 s
  Cross-Body Cable Triceps Extension: 2 × 10–12/side  RIR 1  rest 45 s
  Machine Triceps Extension: 2 × 10–12  RIR 1  rest 45 s
```
Built for Today: “You're Amped, so 1 rep closer to failure on the main lift.” “Barbell Bench Press (4 sets: 4/7/7/7) leads as the main lift, then 2 strength lifts and 3 accessories.”
Fired: amped → expression 'top_set'; amped: rir primary -1 on 1 slot(s); trim: accessory_rest_shortened; trim: set_removed ancillary_depth; top set 4 then 3 × 7

### Session 2

Inputs: {'states': ['amped'], 'duration': 60, 'experience': 'intermediate', 'archetype': 'strength_upper_push'}  ·  user/date seed `seqA / 2026-11-12`
**Upper Push** · variant **Compound + Paired Accessories** · 55–60 min (est. 59.3 min) · 22 working sets
```
  Barbell Bench Press: 5 × 5–7  RIR 2  rest 195 s
  Parallel Bar Dip: 4 × 8–10  RIR 2  rest 120 s
  Plate-Loaded Incline Press: 4 × 8–10  RIR 2  rest 120 s
  SUPERSET A (3 rounds, rest 60 s after each round)
    A1 Cable Fly: 3 × 10–12  RIR 1
    A2 Dumbbell Overhead Triceps Extension: 3 × 10–12  RIR 1
  Diamond Push-Up: 3 × 12–15  RIR 1  rest 60 s
```
Built for Today: “You're Amped, so one more working set on the main lift.” “Barbell Bench Press (5 × 5–7) leads as the main lift, then 2 strength lifts and 3 accessories, with part of it run as a superset.”
Fired: amped → expression 'extra_set_paired'; amped: volume primary +1 on 1 slot(s)

### Session 3

Inputs: {'states': ['amped'], 'duration': 60, 'experience': 'intermediate', 'archetype': 'strength_upper_push'}  ·  user/date seed `seqA / 2026-11-14`
**Upper Push** · variant **Heavy Primary** · 55–60 min (est. 59.7 min) · 19 working sets
```
  Barbell Bench Press: 5 × 4–6  RIR 2  rest 240 s
  Parallel Bar Dip: 4 × 8–10  RIR 2  rest 135 s
  Smith Machine Incline Press: 4 × 8–10  RIR 2  rest 135 s
  Pec Deck: 3 × 10–12  RIR 1  rest 60 s
  Cable Triceps Pressdown: 3 × 10–12  RIR 1  rest 60 s
```
Built for Today: “Your extra energy goes into higher training intent where it fits.” “Barbell Bench Press (5 × 4–6) leads as the main lift, then 2 strength lifts and 2 accessories.”
Fired: amped → expression 'extra_set_paired'; amped: volume lever had nothing to change

### Session 4

Inputs: {'states': ['amped'], 'duration': 60, 'experience': 'intermediate', 'archetype': 'strength_upper_push'}  ·  user/date seed `seqA / 2026-11-16`
**Upper Push** · variant **Top Set + Back-off** · 55–60 min (est. 59.9 min) · 21 working sets
```
  Barbell Bench Press: 4 × 4/7/7/7 (top set, then back off)  RIR 1  rest 240 s  (Top set heavy, then back off 10–15% for the remaining sets. Stop each set with about 1 rep left in the tank.)
  Parallel Bar Dip: 4 × 8–10  RIR 2  rest 135 s
  Plate-Loaded Incline Press: 4 × 8–10  RIR 2  rest 135 s
  SUPERSET A (3 rounds, rest 60 s after each round)
    A1 Dumbbell Fly: 3 × 10–12  RIR 1
    A2 EZ-Bar Skull Crusher: 3 × 10–12  RIR 1
  Cable Triceps Kickback: 3 × 10–12/side  RIR 1  rest 60 s
```
Built for Today: “You're Amped, so 1 rep closer to failure on the main lift.” “Barbell Bench Press (4 sets: 4/7/7/7) leads as the main lift, then 2 strength lifts and 3 accessories, with part of it run as a superset.”
Fired: amped → expression 'top_set'; amped: rir primary -1 on 1 slot(s); top set 4 then 3 × 7

## K. Sequential history (same user, MOOD's Pick, no State, 5 sessions)

### Session 1

Inputs: {'states': [], 'duration': 60, 'experience': 'intermediate'}  ·  user/date seed `seqB / 2026-11-10`
**Upper Pull** · variant **Volume** · 50–55 min (est. 54.8 min) · 21 working sets
```
  Chest-Supported Machine Row: 4 × 6–8  RIR 2  rest 165 s
  Pull-Up: 4 × 8–10  RIR 2  rest 120 s
  Bent-Over Dumbbell Row (Two-Arm): 4 × 8–10  RIR 2  rest 120 s
  SUPERSET A (3 rounds, rest 60 s after each round)
    A1 Straight-Arm Pulldown: 3 × 10–12  RIR 1
    A2 EZ-Bar Preacher Curl: 3 × 10–12  RIR 1
  Bayesian Cable Curl: 3 × 10–12/side  RIR 1  rest 60 s
```
Built for Today: “Chest-Supported Machine Row (4 × 6–8) leads as the main lift, then 2 strength lifts and 3 accessories, with part of it run as a superset.”
Fired: no State levers (no State selected)

### Session 2

Inputs: {'states': [], 'duration': 60, 'experience': 'intermediate'}  ·  user/date seed `seqB / 2026-11-12`
**Lower Body: Squat** · variant **Traditional** · 50–55 min (est. 53.1 min) · 18 working sets
```
  Barbell Back Squat: 4 × 5–7  RIR 2  rest 180 s
  Leg Press: 4 × 8–10  RIR 2  rest 120 s
  Dumbbell Step-Up: 4 × 8–10/side  RIR 2  rest 120 s
  Leg Extension: 3 × 10–12  RIR 1  rest 60 s
  Roman Chair / GHD Glute-Ham Raise: 3 × 10–12  RIR 1  rest 60 s
```
Built for Today: “Barbell Back Squat (4 × 5–7) leads as the main lift, then 2 strength lifts and 2 accessories.”
Fired: no State levers (no State selected)

### Session 3

Inputs: {'states': [], 'duration': 60, 'experience': 'intermediate'}  ·  user/date seed `seqB / 2026-11-14`
**Upper Push** · variant **Compound + Paired Accessories** · 50–55 min (est. 54.7 min) · 21 working sets
```
  Incline Dumbbell Press: 4 × 5–7  RIR 2  rest 195 s
  Parallel Bar Dip: 4 × 8–10  RIR 2  rest 120 s
  Standing Cable Chest Press: 4 × 8–10  RIR 2  rest 120 s
  SUPERSET A (3 rounds, rest 60 s after each round)
    A1 Pec Deck: 3 × 10–12  RIR 1
    A2 Machine Triceps Extension: 3 × 10–12  RIR 1
  EZ-Bar Skull Crusher: 3 × 10–12  RIR 1  rest 60 s
```
Built for Today: “Incline Dumbbell Press (4 × 5–7) leads as the main lift, then 2 strength lifts and 3 accessories, with part of it run as a superset.”
Fired: no State levers (no State selected)

### Session 4

Inputs: {'states': [], 'duration': 60, 'experience': 'intermediate'}  ·  user/date seed `seqB / 2026-11-16`
**Glutes + Legs** · variant **Traditional** · 55–60 min (est. 59.5 min) · 18 working sets
```
  Barbell Hip Thrust: 4 × 5–7  RIR 2  rest 180 s
  Trap-Bar Deadlift: 4 × 8–10  RIR 2  rest 120 s
  Reverse Lunge: 4 × 8–10/side  RIR 2  rest 120 s
  Cable Glute Kickback: 3 × 10–12/side  RIR 1  rest 60 s
  Leg Extension: 3 × 10–12  RIR 1  rest 60 s
  FINISHER  Kettlebell Clean and Press: 3 × 6/side  RIR 1  rest 60 s
```
Built for Today: “Barbell Hip Thrust (4 × 5–7) leads as the main lift, then 2 strength lifts and 2 accessories.”
Fired: finisher forceful (kb_clean_and_press)

### Session 5

Inputs: {'states': [], 'duration': 60, 'experience': 'intermediate'}  ·  user/date seed `seqB / 2026-11-18`
**Upper Body** · variant **Volume** · 50–55 min (est. 53.1 min) · 19 working sets
```
  Incline Dumbbell Press: 5 × 6–8  RIR 2  rest 165 s
  Barbell Overhead Press: 4 × 8–10  RIR 2  rest 120 s
  Lat Pulldown: 4 × 8–10  RIR 2  rest 120 s
  SUPERSET A (3 rounds, rest 60 s after each round)
    A1 Machine Lateral Raise: 3 × 15–20  RIR 1
    A2 Dumbbell Pullover: 3 × 12–15  RIR 1
```
Built for Today: “Incline Dumbbell Press (5 × 6–8) leads as the main lift, then 2 strength lifts and 2 accessories, with part of it run as a superset.”
Fired: backfill: primary_set_added primary_push
