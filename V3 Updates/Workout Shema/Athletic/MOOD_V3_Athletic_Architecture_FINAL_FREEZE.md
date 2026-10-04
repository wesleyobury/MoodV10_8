# MOOD V3 Athletic: Architecture FINAL FREEZE

**Status: FROZEN.** The Athletic exercise library, architecture, warm-up behavior and Type A / Type B rules are frozen. Generator implementation v1 is built and green (§12).

**Strength and Sweat are unchanged.** WA v17 and ET v12 change only Athletic content, and a cell-by-cell comparison with v16 / v11 found 0 changed Strength or Sweat cells.

**Companion files:**

- `MOOD_V3_Athletic_Library_FINAL_FREEZE.xlsx`: records, eligibility (canonical slot ids), pools and QA;
- `MOOD_V3_Athletic_Founder_Pack.xlsx`: the 16 workouts under these rules;
- `MOOD_V3_Workout_Architecture_FINAL_FREEZE_v17.xlsx`: Athletic sheets and slot ids;
- `MOOD_V3_Exercise_Taxonomy_FINAL_FREEZE_v12.xlsx`: Athletic registry values appended;
- `MOOD_V3_Athletic_Reference_Generator_v1.zip`: generator, rule code, validator and QA scripts;
- `MOOD_V3_Athletic_Generator_QA_v1.json`: generator QA results.

This document supersedes the architecture parts of Pass 1 and Pass 2 where they differ. Pass 0 (identity) stands.

---

## 1. What changed in this pass

| # | Founder item | Frozen result |
|---|---|---|
| 1 | Simpler warm-ups | 3 to 4 items: 1 raise, 0 to 1 prep, 1 to 2 primers, 0 to 1 rehearsal only when needed. About 5 to 6 min at 60 (was 9 to 10). |
| 2 | Strength Support → Performance Support | Optional and purpose-bound. Usually 0 at 30, normally 0 to 1 at 60, and 2 only with a stated reason and ≥ 70% exposure share. Never added to reach a duration floor. |
| 3 | No default Trunk | The Trunk slot is removed. Dead Bug, Plank, Hollow Hold, Weighted Plank and Cable Wood Chop are no longer Athletic-eligible. Pallof Press, carries, Copenhagen and Side Plank remain, but only as Performance Support with a purpose. |
| 4 | Type A / Type B | Kept unchanged (§5). |
| 5 | Exercise universe | Unchanged. Work pools are identical to the approved library in all 36 archetype × slot × preset cells. |
| 6 | Reaction work, overcoming isometrics | Not built. Added to the backlog (§11). |
| 7 | Speed + Agility naming | Not renamed. Structure and reroutes unchanged. Added to the naming review. |
| 8 | Duration | New fill order (§6). Floors re-based by the shorter warm-up (§6.2). |
| 9 to 10 | Founder pack and checks | All 16 pass. All 19 negative and control tests behave as expected. Checks are reproducible (§9). |

---

## 2. Archetypes (unchanged)

- `athletic_power`: Power + Explosiveness.
- `athletic_speed_agility`: Speed + Agility.
- `athletic_full_body`: Full-Body Athlete.

Athletic Strength stays retired (D1) and is marked RETIRED in WA v17.

Identity rules are unchanged:

- **Power:** at least 2 power-family exposures.
- **Speed + Agility:** the primary is from the speed family.
- **Full-Body Athlete:** at least 2 distinct qualities. At 60, at least 1 lower and 1 upper or rotational exposure, unless soreness prevents it.

---

## 3. Block grammar

| Order | Slot id | 60 | 30 | Rule |
|---|---|---|---|---|
| 0 | `athletic_warm_up` (computed) | required | required | §4 |
| 1 | `primary_exposure` | required | required | Protected, done fresh, first work after the warm-up |
| 2 | `secondary_exposure` | required | required | Different quality or direction |
| 3 | `third_exposure` | default | excluded | A meaningful third exposure |
| 4 | `quality_capped_repeats` | optional | excluded | Intermediate+, ≤ 1, ≤ 8 min, 3 to 10 s bouts, recovery ≥ 4 × work. Not on Low Energy. Machine format only on Stressed. |
| 5 | `performance_support` | optional | optional (usually 0) | §7 |

There is no Trunk, Core, Strength or Extra slot. A session may end right after its Athletic exposures.

---

## 4. Warm-up contract

| Component | Count | Pool | Minutes |
|---|---|---|---|
| Raise | exactly 1 | Stationary bike, rower, air bike, SkiErg, jump rope | 2.5 at 60, 2 at 30 |
| Prep | 0 to 1 | World's Greatest Stretch, Leg Swings, Lateral Lunge, Glute Bridge (one movement or a short sequence) | 1 |
| Primer | 1 to 2 (0 allowed when the legs are sore) | Power: Pogo Jumps, Snap-Down, Line Hops, Power Skip. Speed: those plus A-Skip, A-March, Wall Drill, Lateral Shuffle to Stick, Short Shuttle, High Knees. Full-Body Athlete: all primers. | 1 each |
| Rehearsal | 0 to 1 | Light-load practice of the primary exposure, or build-ups (≤ 10 m sprint, easy sled) | 1.5 |

**The total is at most 4 items.**

**Rehearsal only when needed:**

- when the primary exposure is an Olympic lift, explosive lift, loaded jump, explosive press or landmine power;
- or build-ups when the primary or secondary exposure is a sprint or sled push.

A bodyweight jump or a throw as the primary gets no rehearsal: the primer is enough.

**Sore legs.** Lower-body primers are skipped. A submax rehearsal of the upper-body primary replaces them.

**Trim rule for the generator.** An over-long warm-up is trimmed deterministically: keep 1 raise, 1 prep, the primers that fit, and the rehearsal only if it is needed. Test N9 shows the old six-item F1 warm-up trimmed to four items and passing.

---

## 5. Exposure prescription: Type A / Type B (unchanged)

| | Type A: technical / quality-dominant (default) | Type B: repeatable ballistic / elastic (`pc_repeatable`) |
|---|---|---|
| Records | Olympic derivatives, loaded jumps, jump combinations, box / broad / single-leg jumps, hops, bounds, high-impact plyometrics, technical throws, explosive presses, landmine power, accelerations | KB Swing, Pogo Jumps, Continuous Vertical Jumps, Split-Squat Jump, Skater Hops, Med-Ball Slam, Rotational Slam, Chest Pass, Overhead Throw, Sled Push, Bear Crawl Ball Toss |
| Dose | Olympic ≤ 3 reps / ≥ 120 s; loaded jump ≤ 5 / ≥ 90 s; explosive lift, press, landmine, rotational power ≤ 5 / ≥ 60 s; other Type A ≤ 6 reps (≤ 5 / side) or ≤ 10 s | ≤ 20 reps (≤ 10 / side) or ≤ 30 s per set; rest ≥ max(30 s, work) |
| Block density | ≤ 0.35 | ≤ 0.50 |
| Fatigue | Performed fresh; stop when speed or form drops | Controlled fatigue allowed; stop when rhythm, height, snap or distance drops |

**Session rules:**

- exposure density ≤ 0.40;
- at least 1 Type A exposure.

**Fatigue is allowed. Fatigue is not the objective.**

---

## 6. Duration

### 6.1 Fill order (generator)

1. Dose the primary exposure properly, up to its band maximum.
2. Dose the secondary exposure properly.
3. Add a meaningful third exposure (60 only).
4. Add a quality-capped repeats block when appropriate (intermediate+, 60, not Low Energy).
5. Add Performance Support only if it improves this session (§7).
6. Stop.

The fill never:

- shortens rest;
- adds a finisher;
- adds trunk work;
- adds Performance Support to reach a minute count.

### 6.2 Duration band (re-based)

| | Floor | Ceiling |
|---|---|---|
| 60, intermediate / advanced | 34 min | 55 min |
| 60, beginner or Low Energy | 30 min | 55 min |
| 30 | 18 min | 30 min |

**Why the floors moved.** The Pass 1 floors (38, beginner 34, 30-min 20) were measured with an 8 to 10 minute warm-up. The warm-up is now about 5 to 6 minutes, so the same training content measures about 4 minutes shorter. The floors moved by that amount and nothing else.

Keeping the old floors would have forced the filler this pass removes: the beginner 60 sessions could only reach 34 minutes with 2 to 3 support exercises plus trunk.

**What the numbers look like:**

| Sessions | Typical length |
|---|---|
| Intermediate / advanced 60 | 37 to 45 min |
| Beginner and Low Energy 60 | 30 to 34 min |
| 30 | 20 to 25 min |

**Accepted consequence.** A beginner who picks 60 minutes gets about 30 to 32 minutes of training. This is noted for UI copy (§11), not treated as a flaw.

**Equipment-limited presets** (free-weight-limited, bodyweight floor). When the fill order is exhausted under hard limits (set caps and impact budget), the floor relaxes to 20 min at 60 and 15 min at 30, and the reason is logged.

- It never relaxes on commercial presets (0 cases in QA).
- Full-Body Athlete's upper / rotational requirement relaxes, logged, only when the equipment offers no upper or rotational exposure at all.

---

## 7. Performance Support contract

**Caps:**

| | Exercises | Sets |
|---|---|---|
| 30 min | max 1 (usually 0) | max 3 |
| 60 min | normally 0 to 1; max 2 | max 6 |

A second exercise at 60 needs both:

- a logged reason;
- exposure share ≥ 70%.

**Always:**

- exposure share ≥ 55%;
- support sets ≤ exposure sets;
- 2 to 3 RIR, never to failure;
- placed after all exposures.

**Purpose rule.** Every Performance Support record carries one purpose. It may be selected only when that purpose is relevant to the session's exposures:

- strength transfer needs jumps, lifts, bounds or sled;
- hamstring resilience needs sprints, sled, bounds, hops, deceleration or lateral power;
- anti-rotation needs rotational exposures;
- structural balance needs upper, Olympic, throw or rotational power, or sore legs;
- the full table is in the Library workbook, PS PURPOSE RULES.

| Purpose | Records |
|---|---|
| `strength_transfer` | Trap-Bar Deadlift, Front Squat, Goblet Squat, Barbell Back Squat, Kettlebell Deadlift |
| `unilateral_robustness` | Bulgarian Split Squat, Front-Foot Elevated Split Squat, Reverse Lunge, Lateral Lunge, Walking Lunge, Dumbbell Step-Up, Lateral Step-Up |
| `posterior_chain` | Dumbbell Romanian Deadlift, Single-Leg Romanian Deadlift, Kickstand Dumbbell RDL, Barbell Romanian Deadlift, Single-Leg Glute Bridge |
| `hamstring_resilience` | Nordic Hamstring Curl, Slider Hamstring Curl |
| `isometric_strength` | Copenhagen Plank, Side Plank |
| `carry` | Farmer Carry, Suitcase Carry, Front-Rack Carry, Overhead Carry, Single-Arm Overhead Carry |
| `tendon_robustness` | Single-Leg Dumbbell Calf Raise, Reverse Nordic Curl |
| `anti_rotation` | Pallof Press, Pallof Step-Out, Landmine Rotation |
| `structural_balance` | Pull-Up, Chin-Up, Single-Arm Dumbbell Row, Chest-Supported Dumbbell Row, Inverted Row, Suspension Trainer Row, Push-Up, Dumbbell Bench Press, Incline Dumbbell Press, Single-Arm Landmine Press, Half-Kneeling Single-Arm Landmine Press, Seated Dumbbell Shoulder Press |

Isometrics are represented only where a clean record exists (Copenhagen Plank, Side Plank). There is no dedicated isometric architecture.

---

## 8. Unchanged launch rules (restated for the generator)

- **Experience:**
  - complexity caps 2 / 3 / 5;
  - beginners get no high impact, no Olympic lifts, no loaded jumps, no Continuous Vertical Jumps and no quality-capped repeats;
  - advanced ≤ 1 high-impact exposure block.
- **Impact budget:**
  - 40 / 70 / 100 units per session;
  - high-impact caps 0 / 0 / 30.
- **Space:**
  - accelerations and sled ≤ 10 m;
  - no treadmill speed;
  - hard equipment and space filters by preset.
- **Soreness:**
  - frozen S-rules;
  - sore legs → Power builds upper / rotational;
  - explicit Speed → conflict UX;
  - MOOD's Pick reroutes to Power upper, then Full-Body Athlete.
- **Floor-only beginner Speed:** MOOD's Pick reroutes (the primary pool is 2).
- **Sore legs with too little upper-body equipment** (bodyweight only): conflict UX. Suggest Strength or Sweat, or adding equipment.
- **States (frozen SD v5 dials):**
  - Low Energy: Volume -1, no QC.
  - Stressed: familiar, QC machine-only.
  - Bored: novel vectors.
  - Irritated: forceful, straight sets.
  - Amped: QC as the extra.

---

## 9. QA results

| Check | Result |
|---|---|
| Founder pack, 16 cases | 16 / 16 pass all rules |
| Negative and control tests | 19 / 19 as expected |
| Work pools identical to the approved library | Yes |
| Warm-up component pools empty anywhere | None |
| Every archetype × State with ≥ 2 options per exposure slot | Yes |
| Smallest Performance Support pool, commercial presets | 28 records |
| Sore legs, Speed primary pool | 0 (conflict UX / reroute, by design) |
| Floor-only beginner Speed primary pool | 2 (reroute, by design) |
| Treadmill records Athletic-eligible | 0 |
| Reproducibility | 3 fresh runs, identical hash `e183e3b1b3a78301` |

### 9.1 Founder pack: before → after

| ID | Archetype | Level | Min | State | Warm-up items | Est. min | Performance Support | Exposure share |
|---|---|---|---|---|---|---|---|---|
| F1 | Power | Intermediate | 60 | Normal | 6 → 4 | 40 → 45 | Bulgarian Split Squat (unilateral robustness) | 85% |
| F2 | Power | Advanced | 60 | Normal | 6 → 4 | 44 → 42 | Front Squat (strength transfer) | 81% |
| F3 | Power | Intermediate | 30 | Normal | 4 → 4 | 24 → 25 | none | 100% |
| F4 | Power | Beginner | 60 | Normal | 6 → 4 | 38 → 30 | Goblet Squat (strength transfer) | 79% |
| F5 | Power | Intermediate | 60 | Irritated | 5 → 4 | 40 → 37 | none | 100% |
| F6 | Power | Intermediate | 60 | Amped | 5 → 4 | 46 → 45 | Pull-Up (structural balance) | 87% |
| F7 | Speed Agility | Intermediate | 60 | Normal | 6 → 4 | 42 → 42 | Slider Hamstring Curl (hamstring resilience) | 87% |
| F8 | Speed Agility | Intermediate | 30 | Normal | 5 → 4 | 24 → 21 | none | 100% |
| F9 | Speed Agility | Advanced | 60 | Bored | 6 → 4 | 40 → 38 | Copenhagen Plank (isometric strength) | 86% |
| F10 | Speed Agility | Intermediate | 60 | Stressed | 6 → 4 | 40 → 40 | Front-Foot Elevated Split Squat (unilateral robustness) | 83% |
| F16 | Speed Agility | Beginner | 60 | Normal | 6 → 4 | 36 → 32 | Single-Leg Glute Bridge (posterior chain) | 82% |
| F11 | Full Body | Intermediate | 60 | Normal | 6 → 4 | 39 → 40 | Farmer Carry (carry) | 87% |
| F12 | Full Body | Beginner | 30 | Normal | 4 → 3 | 21 → 20 | Goblet Squat (strength transfer) | 84% |
| F13 | Full Body | Intermediate | 60 | Low Energy | 4 → 3 | 40 → 34 | Single-Leg Romanian Deadlift (posterior chain) | 83% |
| F14 | Full Body | Advanced | 60 | Amped | 5 → 4 | 45 → 41 | none | 100% |
| F15 | Power | Intermediate | 60 | Sore legs | 3 → 3 | 43 → 41 | Pull-Up (structural balance), Pallof Press (anti rotation) | 75% |

**What the pack shows:**

- **Warm-ups** are 3 to 4 items everywhere (12 of 16 were 5 to 6).
- **Support:**
  - no workout ends with automatic Strength or trunk;
  - F3, F5, F8 and F14 end after the Athletic work;
  - 11 use one purposeful support exercise;
  - only F15 (sore legs, upper-only) uses two, with a stated reason.
- **Exposure share** now runs 75% to 100% (it was as low as 57%).
- **Type B fatigue:**
  - F5 is 6 × 15 KB swings on 45 s rest;
  - F14 is 5 × 10 Continuous Vertical Jumps;
  - F10 uses 20 s pogo sets.
- **60-minute sessions stay substantial through exposures and repeat efforts:**
  - F1 went from 40 to 45 min after gaining a sprint repeat block;
  - beginner and Low Energy 60s got shorter (§6.2).

### 9.2 Negative and control tests

| ID | Test | Expected | Result | What caught it |
|---|---|---|---|---|
| N7 | Athletic workout padded with 3 Strength exercises to fill time | Reject | Reject | exposure share 0.45; Performance Support cap (3 ex / 12 sets at 60) |
| N8a | Complete Athletic session with a required Trunk block added (Dead Bug) | Reject | Reject | slot 'trunk' is not in the Athletic architecture |
| N8b | Same, with Dead Bug placed as Performance Support | Reject | Reject | not eligible dead_bug as ps; dead_bug is not a Performance Support record |
| N9a | Six-component warm-up (the old F1 style) | Reject | Reject | warm-up 6 components (max 4); warm-up > 1 mobility / prep item |
| N9b | Same six-component warm-up after the deterministic trim | Accept | Accept | no failures |
| N10 | Type A work prescribed like conditioning (trap-bar jumps 5 x 12 / 45 s, broad jumps 6 x 10 / 30 s) | Reject | Reject | Type A load rule trap_bar_jump 12 reps / 45 s; Type A density trap_bar_jump 0.40; Type A dose broad_jump |
| N11 | All-repeatable Sweat-like session (swings, pogos, slams, sled at 1:1) | Reject | Reject | Type B density kettlebell_swing 0.55; Type B density pogo_hop 0.55; session exposure density 0.50 |
| N12 | Valid Type B session: KB Swings + Continuous Vertical Jumps with controlled fatigue | Accept | Accept | no failures |
| N1 | Power Snatch 5 x 5 on 60 s rest (grinding) | Reject | Reject | Type A load rule power_snatch 5 reps / 60 s; duration 25.2 outside 34-55 |
| N2 | KB Swing 30 reps on 30 s rest (clock completion) | Reject | Reject | Type B bout kettlebell_swing 45 s / 30 s; Type B density kettlebell_swing 0.64; Type B density med_ball_slam 0.56 |
| N4 | Continuous Vertical Jumps for a beginner | Reject | Reject | not eligible reactive_vertical_jump as sx; experience gate reactive_vertical_jump; impact 47 > 40 |
| N5 | Bear Crawl Ball Toss as the Power main exercise | Reject | Reject | not eligible bear_crawl_ball_toss as px; Power needs >= 2 power exposures; duration 20.0 outside 34-55 |
| N6 | Hang Power Clean for an intermediate | Reject | Reject | experience gate hang_power_clean; duration 26.2 outside 34-55 |
| N13 | Performance Support with no purpose in this session (bench press on a speed day) | Reject | Reject | Performance Support db_bench_press (structural_balance) has no purpose in this session |
| N14 | Rehearsal added when not needed (bodyweight box jump main) | Reject | Reject | rehearsal not needed for PX quality jump |
| N15 | 20 m acceleration | Reject | Reject | acceleration distance 20 m (max 10) |
| N16 | Quality-capped block for a beginner | Reject | Reject | QC contract |
| N17 | Two Performance Support exercises on a normal day without a reason | Reject | Reject | 2 Performance Support exercises without a stated reason / share >= 0.70 |
| N18 | Sled on a floor-only gym (no lane) | Reject | Reject | equipment/space unavailable sled_push; duration 27.7 outside 34-55 |

---

## 10. Minor imperfections (documented, left alone)

- **Stressed Speed + Agility** has a small secondary pool: 2 options at intermediate in the default gym. It is valid but will repeat often. State bias is a ranking preference, not a hard filter.
- **Bodyweight-only Performance Support pools** are 4 to 6 records. This is acceptable because Performance Support is optional.
- **Time estimates** use the frozen time model (work + rest + 1 min per block + a 2 to 3 min buffer). Real sessions will run slightly longer because of setup.
- **F4** (Beginner Power 60, floor only) lands at 30 min, at the floor.

---

## 11. Post-launch backlog

1. **Reaction work.** Drills driven by audio or visual cues generated by the app.
2. **Overcoming isometrics** as a dedicated method.
3. **Speed + Agility name review**, if it keeps feeling slightly mismatched.
4. **Beginner / Low Energy 60 UI copy.** Show "about 30 to 35 min" so the shorter session reads as intended.
5. **Warm-up rehearsal cue text per exercise**, as copy work in the generator's output layer.

---

## 12. Generator implementation (v1, reference)

`athletic_gen.py` builds a session from:

- archetype (or MOOD's Pick);
- level, duration and equipment preset;
- States, soreness and goal;
- history, seed, swap count and the displayed composition.

Every build is re-validated by the frozen checker (`sk5.check`). A build that cannot pass returns an explicit status, never a silent downgrade.

**Selection** follows the frozen WA ranking:

1. hard filters;
2. State predicate;
3. composition coverage;
4. for the protected primary: priority bias, then **continuity** with the last primary of that archetype, so the primary changes only when outranked or unavailable (logged as `protected_primary_changed`); for the other slots: family recency over the last 2 sessions of that archetype, then priority bias;
5. stable seed.

**Fill order** is §6.1. Performance Support is added only for a session-specific need:

- Speed with sprints or sled;
- Power with loaded jumps or Olympic lifts;
- a one-region session;
- sore legs;
- beginners;
- Get Stronger.

It is never added on Amped or Irritated days, or when the session is already 42 min or longer.

**QA** (`MOOD_V3_Athletic_Generator_QA_v1.json`):

| Check | Result |
|---|---|
| Grid | 1728 builds (4 archetype inputs × 3 levels × 2 durations × 4 presets × 6 States × 3 soreness cases) |
| Valid builds | 1476 |
| Designed conflicts | 252: explicit Speed + sore legs (144); sore legs + bodyweight-only (108) |
| Infeasible | 0 |
| Independent re-validation failures | 0 |
| Reproducible (full grid rebuilt, identical hash) | True |
| Warm-ups over 4 items / trunk slots | 0 / 0 |
| Repeat efforts on beginners / Low Energy / 30 min | 0 / 0 / 0 |
| Performance Support at 60 | 365 with 1, 373 with 0 (ending after the Athletic work) |
| Performance Support at 30 | beginners only (212); never 2 at 30 |
| Relaxations on commercial presets | 0 |
| Commercial 60, intermediate / advanced | mean 36.9 / 39.3 min (range 30.2-46.7) |
| Commercial 60, beginner | mean 31.5 min |
| Commercial 30 | 18.6-26.9 min |
| History | primary held across sessions (continuity); non-protected slots rotate; MOOD's Pick rotates Full-Body Athlete → Power → Speed |
| Founder-pack inputs | all 16 build valid sessions (`gen_samples.md`) |

**Not yet built** (generator output layer, not rules):

- per-exercise quality-stop cue text;
- the progression engine (load / height / distance targets from history);
- Built for Today explanation strings beyond the logged reasons.
