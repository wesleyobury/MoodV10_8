# MOOD V3 Athletic · Pass 2 FINAL: Explosive Gym Library (for final founder approval)

**Status: final library proposal. Recommended action: FINAL LIBRARY APPROVAL, then generator implementation.**

**Unchanged:**

- Strength and Sweat are frozen.
- The Pass 1 architecture is unchanged.
- This is a targeted refinement of the revised Pass 2 library, not a redesign.

**Companion workbook: `MOOD_V3_Athletic_Pass2_Library.xlsx`** (updated). It holds:

- classification;
- the work universe (now with prescription class);
- new records and warm-up pools;
- all 535 eligibility rows;
- work-pool density, warm-up coverage, State and soreness coverage;
- the 16-workout founder pack and negative tests.

---

## 1. What changed in this final pass

| # | Change |
|---|---|
| 1 | **Two prescription classes.** Class A (quality-dominant / technical) keeps low reps, generous rest and a fresh-only position. Class B (repeatable ballistic / elastic) may use moderate or higher reps, timed bouts and controlled fatigue. Class B is a governed tag `pc_repeatable` on 11 records (§2). |
| 2 | **Density rule changed from one flat 35% ceiling to a class-aware rule plus a session guard** (exact rule in §3). |
| 3 | **Continuous Vertical Jumps kept and refined:** class B, intermediate+, moderate impact, 3 to 4 × 6 to 10 reps (or 10 to 15 s), 60 to 90 s rest. |
| 4 | **Added Bear Crawl Ball Toss** (integrated coordination). |
| 5 | **Added 3 landmine power exercises:** Rotational Punch, Split Jerk, Rotational Clean and Press. Landmine Push Press already existed, so there are 4 landmine exercises in total. |
| 6 | **No other additions.** The integrated-movement recheck found no further gap worth filling (§6). |
| 7 | **Speed + Agility SX2** may now also use short sled pushes. This gives beginners a no-impact second acceleration exposure. |

Nothing was removed in this pass.

---

## 2. Prescription classes (founder refinement)

**Governing principle (unchanged).** Athletic work develops or expresses power, explosiveness, speed, elasticity, coordination and high-quality movement.

**The test for fatigue:** is the movement still performed for explosive, elastic or athletic output, or has completing time or reps under fatigue become the objective?

| | Class A: quality-dominant / technical (default) | Class B: repeatable ballistic / elastic (`pc_repeatable`) |
|---|---|---|
| **Records** | Olympic derivatives, loaded jumps, jump combinations, box / broad / single-leg jumps and hops, bounds, high-impact plyometrics, technical and rotational throws, explosive presses, landmine power, accelerations | KB Swing, Pogo Jumps, Continuous Vertical Jumps, Split-Squat Jump, Skater Hops, Med-Ball Slam, Rotational Slam, Chest Pass, Overhead Throw, Sled Push, Bear Crawl Ball Toss |
| **Reps / bout** | Olympic ≤ 3; explosive lifts, presses, landmine and loaded jumps ≤ 5 (per side) | ≤ 20 reps (≤ 10 per side) or ≤ 30 s per set |
| **Rest** | Olympic ≥ 120 s; loaded jumps ≥ 90 s; lifts / presses ≥ 60 s | ≥ 30 s and ≥ the set's own work time |
| **Block density** | ≤ 35% active | ≤ 50% active |
| **Fatigue** | Performed fresh; stop when mechanics, velocity or output drop | Controlled fatigue allowed; stop when rhythm, height, snap or distance drops |
| **Cue** | Standard quality-stop cues (D3) | "Stay springy and fast. End the set when the rhythm, height or snap drops, even if reps remain." |

**High-impact and technical work never becomes class B:** drop jumps, consecutive broad jumps, Olympic lifts and loaded jumps stay class A.

---

## 3. Recommended validator rule (exact)

**AI-5 Exposure density and fatigue** (replaces the single 35% block ceiling). For every PX, SX and SX2 block:

- **AI-5a (class A):** active / (active + programmed rest) ≤ 0.35, AND the class-A load rule holds:

  | Quality | Max reps / set | Min rest |
  |---|---|---|
  | Olympic | 3 | 120 s |
  | Loaded jump | 5 | 90 s |
  | Explosive lift, explosive press, rotational power | 5 (per side) | 60 s |

- **AI-5b (class B):**
  - active / (active + programmed rest) ≤ 0.50;
  - each set ≤ 30 s and ≤ 20 reps (≤ 10 per side);
  - rest ≥ max(30 s, the set's work time).
- **AI-5c (session guard):**
  - time-weighted exposure density across all PX, SX and SX2 blocks ≤ 0.40;
  - at least one class-A exposure per session.
- **QC keeps its own contract** (bouts 3 to 10 s, work : rest ≥ 1:4, ≤ 8 min).

**Why this is the smallest safe change:**

- Class B's 0.50 ceiling sits below Sweat's 0.60 floor.
- The session guard keeps the whole workout rest-dominant.
- The class-A requirement guarantees every session contains quality-dominant work.

**Negative tests confirm the loophole is closed:**

| # | Session | Rejected by |
|---|---|---|
| N2 | KB Swing 30 reps / 30 s rest | Class B bout, density, session density |
| N3 | An all-class-B 1:1 session | Density, session density 0.52, no class-A exposure, impact 90 |

**The founder examples pass:**

- Continuous Vertical Jumps 3 × 8 at 75 s rest: 0.12 block density;
- KB Swing 5 × 12 at 60 s rest: 0.23.

---

## 4. Continuous Vertical Jumps and the other repeatable exercises

| Exercise | Levels | Rep / time range | Rest | Impact accounting | Cue |
|---|---|---|---|---|---|
| **Continuous Vertical Jumps** | I, A | 3 to 4 × 6 to 10 reps (10 to 15 s) | 60 to 90 s | moderate, 1.0 per contact (4 × 10 = 40 units) | "Tall, stiff and springy: minimal ground time, jump again immediately. End the set if height drops or landings get loud." |
| Pogo Jumps | B, I, A | 3 to 4 × 10 to 20 s | 45 to 60 s | low, 0.25 per contact (2 per s) | "Bounce off the ankles, knees nearly straight. Stop if rhythm breaks." |
| KB Swing | I, A | 4 to 5 × 8 to 15 | 60 to 90 s | none (not landing load) | "Snap the hips; the bell floats. End the set if the hips stop snapping." |
| Split-Squat Jump | I, A | 3 × 4 to 8 / side | 60 to 75 s | moderate alternating, 1.5 | "Switch in the air, land soft. Stop when height drops." |
| Skater Hops | B, I, A | 3 to 4 × 3 to 6 / side | 60 s | moderate alternating, 1.5 | "Push sideways hard; stick or rebound under control." |
| Med-Ball Slam, Rotational Slam, Chest Pass, Overhead Throw | B, I, A | 3 to 4 × 5 to 10 | 45 to 60 s | none | "Every throw at full intent. Stop when throws lose snap." |
| Sled Push | B, I, A | 4 to 6 × 10 m | 60 to 90 s | none | "Drive fast, stay low. Stop if speed clearly drops." |
| Bear Crawl Ball Toss | B, I, A | 3 to 4 × 6 to 10 m (about 15 to 20 s) | 45 to 60 s | none | see §5 |

---

## 5. Bear Crawl Ball Toss

**Name.** Canonical name "Bear Crawl Ball Toss" (id `bear_crawl_ball_toss`). No clearer established name exists: "bear crawl ball transfer" and "bear crawl pass" describe the same thing less intuitively. User-facing it stays **Bear Crawl Ball Toss**.

**Record:**

| Field | Value |
|---|---|
| Quality / class | `integrated` (a new quality, grouped separately for distinctness); class B |
| Muscles | core and shoulders primary; quads, triceps, hip abductors secondary |
| Equipment | light med ball; floor space |
| Complexity / level | 2; beginner+ |
| Impact | low; not counted |

**Where it can be used:**

- **Full-Body Athlete** SX and SX2;
- **Speed + Agility** SX2 (coordination / movement);
- **never Power PX** (negative test N5).

**Prescription:**

- 3 to 4 × 6 to 10 m (about 15 to 20 s), rest 45 to 60 s.
- Cue: "Knees an inch off the floor, hips level; toss the ball hand to hand as the opposite hand and foot move; slow down before the hips wobble."
- Short bouts keep it coordination, never a conditioning crawl.

---

## 6. Landmine power and the integrated-movement recheck

**Landmine exercises (4 total):**

| Exercise | Levels | Class | Purpose |
|---|---|---|---|
| Landmine Push Press (existing) | I, A | A | Accessible one-arm explosive press |
| **Landmine Rotational Punch** | I, A | A | Rotational power: hip-to-hand transfer from a staggered stance. Broadens the library into rotation. |
| **Landmine Split Jerk** | I, A | A | Jerk mechanics with a forgiving bar path. Makes the jerk accessible to intermediates. |
| **Landmine Rotational Clean and Press** | A only | A | Multiplanar power: a rotational clean into a press. The advanced rotational option. |

**Considered and not added:**

- **Landmine Thruster:** it is squat-to-press conditioning; Strength / Sweat already have Landmine Squat-to-Press.
- **Landmine rainbows / rotations:** trunk work, already in trunk.
- **Lateral landmine variations:** low intuitive value for users.

**Integrated-movement recheck** (up to 3 more allowed; high bar):

- **Rotational power** is now covered by throws, slams and 2 landmine rotational lifts.
- **Upper-body explosiveness** is covered by explosive push-up, 3 presses, 2 jerks, chest pass and shot-put.
- **Integrated coordination / locomotion** is covered by Bear Crawl Ball Toss.
- **Rejected candidates:**
  - Turkish Get-Up: slow, not athletic output;
  - rotational box jumps: gimmicky, landing risk;
  - med-ball drop push-ups: advanced and niche.

**Result: no additional exercises needed.**

---

## 7. Final checks (1 to 13)

| # | Check | Result |
|---|---|---|
| 1 | **Final work-exercise count** | **52** (22 added across the revision and this pass, 21 kept from Pass 2 v1, 9 reused Strength / Sweat records). Class B: 11; class A: 41. |
| 2 | **Final warm-up-only count** | **16**. Pogo Jumps is also warm-up; other warm-up drills are shared records. Total distinct Athletic-eligible shared records: 115 (52 work, 16 warm-up-only, 31 support, 13 trunk, 3 QC ergs). 54 are new to the library. |
| 3 | **Added in this pass** | Bear Crawl Ball Toss, Landmine Rotational Punch, Landmine Split Jerk, Landmine Rotational Clean and Press |
| 4 | **Removed in this pass** | None |
| 5 | **Power pool health** (intermediate, commercial default; B / I / A) | PX 4 / 18 / 23 · SX 10 / 34 / 41 · SX2 12 / 39 / 43. **OK.** Floor-only: PX 17, SX 32, SX2 37. Beginner PX 4 (THIN, intentional). |
| 6 | **Speed + Agility pool health** | PX 4 / 9 / 10 · SX 3 / 11 / 12 · SX2 8 / 20 / 22. **OK for intermediate and advanced.** Floor-only: PX 6, SX 10, SX2 18 (OK). Beginners: PX 4 with a lane, 2 floor-only; SX 3 (**thin**). MOOD's Pick reroutes floor-only beginners (R-5). |
| 7 | **Full-Body Athlete pool health** | PX 7 / 23 / 28 · SX 17 / 45 / 52 · SX2 17 / 44 / 48. **OK** everywhere, including floor-only (PX 21). |
| 8 | **Beginner / Intermediate / Advanced coverage** | Beginner **17** work exercises (jumps, throws, slams, sled, short accelerations, skater hops, pogo, Bear Crawl Ball Toss); intermediate **45**; advanced **52**. Advanced-only: Hang Power Clean, Power Snatch, Split Jerk, DB Snatch, Landmine Rotational Clean and Press, Drop Jump, Consecutive Broad Jumps. |
| 9 | **Floor-only commercial gym** | 48 of 52 work exercises need no lane or turf (all except Explosive Start, Alternating Bound, Backward Toss and Sled). Distinct intermediate work options: Power 38, Speed + Agility 19, Full-Body Athlete 41. |
| 10 | **Impact budget** | Unchanged structure (40 / 70 / 100; high-impact sub-cap 0 / 0 / 30). Continuous Vertical Jumps now moderate (1.0 per contact). Loaded jumps ×1.5; combinations 2 landings; landmine, Olympic, throws, sled and Bear Crawl count 0. Pack range 0 to 48 units; beginners ≤ 27. |
| 11 | **Density / fatigue rule** | Class-aware AI-5a / b / c (§3). Pack: block density ≤ 0.33, session density 0.07 to 0.20. |
| 12 | **State coverage** (intermediate, PX / SX / SX2) | See the table below. Speed Stressed is thin by nature (familiar and simple): accept it. |
| 13 | **Soreness coverage** (intermediate) | See the table below. |

**State coverage** (intermediate, PX / SX / SX2, number of distinct quality groups in brackets):

| Archetype | Low Energy | Stressed | Bored | Irritated | Amped |
|---|---|---|---|---|---|
| Power | 11 / 23 / 29 (8) | 5 / 9 / 10 (6) | 13 / 25 / 29 (8) | 12 / 23 / 26 (8) | 18 / 34 / 39 (8) |
| Speed + Agility | 7 / 9 / 15 (4) | 3 / 2 / 6 (3) | 6 / 9 / 14 (4) | 6 / 5 / 12 (4) | 9 / 11 / 20 (5) |
| Full-Body Athlete | 15 / 33 / 33 (10) | 7 / 12 / 12 (7) | 16 / 33 / 32 (10) | 15 / 30 / 30 (9) | 23 / 45 / 44 (10) |

**Soreness coverage** (intermediate, PX / SX / SX2):

| Sore region | Power | Full-Body Athlete | Speed + Agility |
|---|---|---|---|
| Lower body | 13 / 13 / 12 (upper / rotational / landmine emphasis) | 13 / 14 / 13 | 0: reroute or terminal UX, as designed |
| Upper push | 16 / 22 / 28 | 21 / 32 / 32 | 9 / 11 / 19 |
| Core | 18 / 29 / 34 | 23 / 39 / 38 | 9 / 11 / 19 (trunk omitted) |
| Back | 18 / 33 / 38 | 23 / 44 / 43 | 9 / 11 / 20 |

**Final work universe** (Class: A = quality-dominant, B = repeatable; Levels: B = beginner, I = intermediate, A = advanced; * = lower-body-sore upper emphasis only):

| Category | Exercise | Source | Class | Levels | Equipment | Space | Impact | Cx | Slots |
|---|---|---|---|---|---|---|---|---|---|
| Olympic derivative | Push Press | Strength | A | IA | barbell | standard gym | low | 3 | Pow PX/SX; FBA PX/SX |
|  | Hang Power Clean | NEW (revision) | A | A | barbell | standard gym | low | 4 | Pow PX/SX; FBA PX/SX |
|  | Power Snatch | NEW (revision) | A | A | barbell | standard gym | low | 5 | Pow PX/SX; FBA PX/SX |
|  | Split Jerk | NEW (revision) | A | A | barbell | standard gym | low | 5 | Pow PX/SX; FBA PX/SX |
| Explosive KB / DB lift | Kettlebell Swing | Strength | B | IA | kettlebell | floor space | low | 2 | Pow PX/SX/SX2; FBA PX/SX/SX2 |
|  | Dumbbell Hang Power Clean | NEW (revision) | A | IA | dumbbells | floor space | low | 3 | Pow PX/SX/SX2; FBA PX/SX/SX2 |
|  | Hang Clean to Box Knee Drive | NEW (revision) | A | IA | dumbbells | floor space | low | 3 | Pow PX/SX/SX2; FBA PX/SX/SX2 |
|  | Kettlebell Snatch | Sweat | A | IA | kettlebell | floor space | low | 3 | Pow PX/SX/SX2; FBA PX/SX/SX2 |
|  | Dumbbell Snatch | Strength | A | A | dumbbells | floor space | low | 4 | Pow PX/SX/SX2; FBA PX/SX/SX2 |
| Explosive press / upper power | Dumbbell Push Press | Sweat | A | BIA | dumbbells | floor space | low | 2 | Pow SX/SX2/PX*; FBA SX/SX2/PX* |
|  | Explosive Push-Up | Pass 2 v1 | A | IA | bodyweight | floor space | low | 2 | Pow SX/SX2/PX*; FBA SX/SX2/PX* |
|  | Landmine Push Press | NEW (revision) | A | IA | landmine | standard gym | low | 2 | Pow SX/SX2/PX*; FBA SX/SX2/PX* |
|  | Landmine Split Jerk | NEW (revision) | A | IA | landmine | standard gym | low | 3 | Pow SX/SX2/PX*; FBA SX/SX2/PX* |
| Landmine rotational power | Landmine Rotational Punch | NEW (revision) | A | IA | landmine | standard gym | low | 2 | Pow SX/SX2/PX*; FBA SX/SX2/PX* |
|  | Landmine Rotational Clean and Press | NEW (revision) | A | A | landmine | standard gym | low | 4 | Pow SX/SX2/PX*; FBA SX/SX2/PX* |
| Loaded jump | Banded Broad Jump | NEW (revision) | A | IA | bands | floor space | moderate | 2 | Pow PX/SX/SX2; FBA PX/SX/SX2 |
|  | Banded Squat Jump | NEW (revision) | A | IA | bands | floor space | moderate | 2 | Pow PX/SX/SX2; FBA PX/SX/SX2 |
|  | Dumbbell Jump Squat | NEW (revision) | A | IA | dumbbells | floor space | moderate | 2 | Pow PX/SX/SX2; FBA PX/SX/SX2 |
|  | Trap-Bar Jump Squat | NEW (revision) | A | IA | trap bar | standard gym | moderate | 3 | Pow PX/SX/SX2; FBA PX/SX/SX2 |
| Jump | Countermovement Jump | Pass 2 v1 | A | BIA | bodyweight | floor space | moderate | 1 | Pow PX/SX/SX2; Spd SX2; FBA PX/SX/SX2 |
|  | Box Jump | Sweat | A | IA | box | floor space | moderate | 2 | Pow PX/SX/SX2; Spd SX2; FBA PX/SX/SX2 |
|  | Broad Jump to Stick | Pass 2 v1 | A | BIA | bodyweight | floor space | moderate | 2 | Pow PX/SX/SX2; Spd SX2; FBA PX/SX/SX2 |
|  | Seated Box Jump | Pass 2 v1 | A | BIA | box | floor space | low | 2 | Pow PX/SX/SX2; Spd SX2; FBA PX/SX/SX2 |
|  | Drop Jump | Pass 2 v1 | A | A | box | floor space | high | 3 | Pow PX/SX/SX2; Spd SX2; FBA PX/SX/SX2 |
| Jump combination | Broad Jump to Vertical Jump | NEW (revision) | A | IA | bodyweight | floor space | moderate | 2 | Pow PX/SX/SX2; Spd SX2; FBA PX/SX/SX2 |
|  | Pogo to Box Jump | NEW (revision) | A | IA | box | floor space | moderate | 2 | Pow PX/SX/SX2; Spd SX2; FBA PX/SX/SX2 |
|  | Lateral Bound to Box Jump | NEW (revision) | A | IA | box | floor space | moderate | 3 | Pow PX/SX/SX2; Spd SX2; FBA PX/SX/SX2 |
| Unilateral jump / hop | Single-Leg Hop to Stick | Pass 2 v1 | A | IA | bodyweight | floor space | moderate | 2 | Pow SX/SX2; Spd SX/SX2; FBA SX/SX2 |
|  | Single-Leg Box Jump | Pass 2 v1 | A | IA | box | floor space | low | 3 | Pow SX/SX2; Spd SX/SX2; FBA SX/SX2 |
| Bound | Split-Squat Jump | NEW (revision) | B | IA | bodyweight | floor space | moderate | 2 | Pow SX/SX2; Spd PX/SX/SX2; FBA SX/SX2 |
|  | Alternating Bound | Pass 2 v1 | A | IA | bodyweight | lane | moderate | 3 | Pow SX/SX2; Spd PX/SX/SX2; FBA SX/SX2 |
|  | Consecutive Broad Jumps | Pass 2 v1 | A | A | bodyweight | floor space | high | 3 | Pow SX/SX2; Spd PX/SX/SX2; FBA SX/SX2 |
| Elastic / reactive | Pogo Jumps | Pass 2 v1 | B | BIA | bodyweight | floor space | low | 1 | Pow SX2; Spd SX/SX2; FBA SX/SX2 |
|  | Continuous Vertical Jumps | Pass 2 v1 | B | IA | bodyweight | floor space | moderate | 2 | Pow SX2; Spd SX/SX2; FBA SX/SX2 |
| Lateral power | Banded Lateral Bound | NEW (revision) | A | IA | bands | floor space | moderate | 2 | Pow SX2; Spd PX/SX/SX2; FBA PX/SX/SX2 |
|  | Lateral Box Jump | NEW (revision) | A | IA | box | floor space | low | 2 | Pow SX2; Spd PX/SX/SX2; FBA PX/SX/SX2 |
|  | Lateral Single-Leg Hop to Stick | Pass 2 v1 | A | IA | bodyweight | floor space | moderate | 2 | Pow SX2; Spd PX/SX/SX2; FBA PX/SX/SX2 |
|  | Skater Hops | Sweat | B | BIA | bodyweight | floor space | moderate | 2 | Pow SX2; Spd PX/SX/SX2; FBA PX/SX/SX2 |
| Med-ball throw | Med-Ball Chest Pass | Pass 2 v1 | B | BIA | med ball | floor space | low | 1 | Pow SX/SX2/PX*; FBA SX/SX2/PX* |
|  | Med-Ball Overhead Throw | Pass 2 v1 | B | BIA | med ball | floor space | low | 1 | Pow SX/SX2/PX*; FBA SX/SX2/PX* |
|  | Med-Ball Backward Overhead Toss | NEW (revision) | A | IA | med ball | lane | low | 2 | Pow SX/SX2/PX; FBA SX/SX2/PX* |
|  | Med-Ball Scoop Toss | Pass 2 v1 | A | BIA | med ball | floor space | low | 2 | Pow SX/SX2/PX; FBA SX/SX2/PX* |
|  | Med-Ball Shot-Put Throw | Pass 2 v1 | A | IA | med ball | floor space | low | 2 | Pow SX/SX2/PX*; FBA SX/SX2/PX* |
|  | Med-Ball Slam | Sweat | B | BIA | slam ball | floor space | low | 2 | Pow SX/SX2/PX*; FBA SX/SX2/PX* |
| Rotational throw | Med-Ball Rotational Slam | NEW (revision) | B | BIA | slam ball | floor space | low | 2 | Pow SX/SX2/PX*; FBA SX/SX2/PX* |
|  | Med-Ball Rotational Throw | Pass 2 v1 | A | BIA | med ball | floor space | low | 2 | Pow SX/SX2/PX*; FBA SX/SX2/PX* |
|  | Step-Behind Rotational Throw | Pass 2 v1 | A | IA | med ball | floor space | low | 3 | Pow SX/SX2/PX*; FBA SX/SX2/PX* |
| Short acceleration | Explosive Start (5-10 m) | Pass 2 v1 | A | BIA | bodyweight | lane | moderate | 1 | Spd PX; FBA PX/SX/SX2 |
|  | Falling-Start Sprint (5 m) | Pass 2 v1 | A | BIA | bodyweight | floor space | moderate | 1 | Spd PX; FBA PX/SX/SX2 |
| Sled | Sled Push | Strength | B | BIA | sled | turf | low | 2 | Spd PX/SX2; FBA PX/SX/SX2 |
| Deceleration | Acceleration to Stick (5 m) | Pass 2 v1 | A | BIA | bodyweight | floor space | moderate | 2 | Spd SX/SX2; FBA SX/SX2 |
| Integrated coordination | Bear Crawl Ball Toss | NEW (revision) | B | BIA | med ball | floor space | low | 2 | Spd SX2; FBA SX/SX2 |

**Work-pool density** (warm-up excluded; OK ≥ 6, THIN 4 to 5, FAIL < 4):

**Power + Explosiveness** (work exposures only; B / I / A; status shown for intermediate)

| Slot | Commercial default | Commercial, floor only | Free-weight gym | Bodyweight only |
|---|---|---|---|---|
| PX | 4/18/23 (OK) | 4/17/22 (OK) | 4/15/17 (OK) | 2/3/3 (FAIL) |
| SX | 10/34/41 (OK) | 10/32/39 (OK) | 10/28/31 (OK) | 2/6/7 (OK) |
| SX2 | 12/39/43 (OK) | 12/37/41 (OK) | 12/33/36 (OK) | 4/10/11 (OK) |
| QC | 0/7/7 (OK) | 0/5/5 (THIN) | 0/3/3 (FAIL) | 0/0/0 (FAIL) |

**Speed + Agility** (work exposures only; B / I / A; status shown for intermediate)

| Slot | Commercial default | Commercial, floor only | Free-weight gym | Bodyweight only |
|---|---|---|---|---|
| PX | 4/9/10 (OK) | 2/6/7 (OK) | 3/7/8 (OK) | 2/4/5 (THIN) |
| SX | 3/11/12 (OK) | 3/10/11 (OK) | 3/10/11 (OK) | 3/7/8 (OK) |
| SX2 | 8/20/22 (OK) | 7/18/20 (OK) | 7/18/20 (OK) | 5/10/11 (OK) |
| QC | 0/7/7 (OK) | 0/5/5 (THIN) | 0/3/3 (FAIL) | 0/0/0 (FAIL) |

**Full-Body Athlete** (work exposures only; B / I / A; status shown for intermediate)

| Slot | Commercial default | Commercial, floor only | Free-weight gym | Bodyweight only |
|---|---|---|---|---|
| PX | 7/23/28 (OK) | 5/21/26 (OK) | 6/18/20 (OK) | 4/6/6 (OK) |
| SX | 17/45/52 (OK) | 15/41/48 (OK) | 16/37/40 (OK) | 6/12/13 (OK) |
| SX2 | 17/44/48 (OK) | 15/40/44 (OK) | 16/37/40 (OK) | 6/12/13 (OK) |
| QC | 0/7/7 (OK) | 0/5/5 (THIN) | 0/3/3 (FAIL) | 0/0/0 (FAIL) |

**Warm-up pools** (unchanged from the revision; composed from the day's exposures):

| Component | Purpose | Exercises (shared records) | Power | Speed + Agility | Full-Body Athlete |
|---|---|---|---|---|---|
| raise | Temperature, 2 min easy | Jump Rope, High Knees, Stationary Bike, Row Erg, Air Bike, SkiErg | yes | yes | yes |
| mobility | Hips, ankles, trunk for the day | World's Greatest Stretch, Leg Swings, Lateral Lunge, Glute Bridge, Air Squat | yes | yes | yes |
| elastic | Ankle stiffness, rhythm | Pogo Jumps, Line Hops, Power Skip, Jump Rope | yes | yes | yes |
| landing | Landing / stopping mechanics | Snap-Down to Stick, Seated Box Jump, Countermovement Jump, Backpedal to Stick | yes | yes | yes |
| mechanics | Acceleration posture, rhythm | A-March, Wall Drill (March to Switches), A-Skip, High Knees | - | yes | yes |
| lateral | Lateral movement, controlled COD | Lateral Shuffle to Stick, 5-5 Shuttle, Skater Hops, Lateral Lunge | - | yes | yes |
| build-up | Submax rehearsal of the day's acceleration | Explosive Start (5-10 m), Falling-Start Sprint (5 m), Sled Push | - | yes | yes |
| rehearsal | Light sets of the day's PX lift or jump | <PX exercise at light load / submax> | yes | yes | yes |

---

## 8. Founder workout pack (16 workouts from the final library)

These are what a strong trainer would program for "today I want to train explosively and feel athletic".

**Every workout is machine-checked:**

- eligibility, equipment, space, experience gates and soreness;
- no warm-up or removed record in a work slot;
- family and distinctness rules;
- class-aware density and load rules;
- session density guard;
- support caps and QC contract;
- impact budget and duration band.

**All 16 pass.** [B] marks class-B repeatable exercises. Times use the Pass 1 time model.

**Coverage across the pack:**

| Dimension | Workouts |
|---|---|
| Power 30 / 60 | F3 / F1, F2, F4, F5, F6 |
| Speed + Agility 30 / 60 | F8 / F7, F9, F10, F16 |
| Full-Body Athlete 30 / 60 | F12 / F11, F13, F14 |
| Beginner | F4, F12, F16 |
| Advanced | F2, F9, F14 |
| States | Normal; Low Energy F13; Bored F9; Irritated F5; Amped F6, F14; Stressed F10 |
| Floor-only | F4, F8, F13 |
| Well-equipped | F1, F3, F7, F11 |
| Sore-legs reroute | F15 |

**Categories surfaced:**

| Category | Workouts |
|---|---|
| Olympic derivatives | F2, F3 (push press), F14 |
| Loaded jumps | F1, F3, F6 |
| KB ballistic | F5 |
| Landmine power | F1, F2, F11, F14, F15 |
| Medicine-ball work | F4, F5, F6, F12, F13, F15 |
| Sled | F5, F7, F10, F14, F16 |
| Repeated elastic work | F1, F10, F14 |
| Bear Crawl Ball Toss | F9, F13 |
| Short acceleration | F8, F9, F11, F16 |
| Jump combination | F7 (Pogo → Box Jump) |
| Combination lift | F6 (Hang Clean → Box Knee Drive) |


**F1 · Power + Explosiveness · Intermediate · Normal · 60 · well-equipped gym**  
_40 min · exposure share 62% · session density 0.12 · impact 42 / 70 · rule check: pass_

- **Warm-up (9 min):** Row Erg → World's Greatest Stretch → Leg Swings → Pogo Jumps → Snap-Down to Stick → Rehearsal: Trap-Bar Jump Squat (light 2 x 2)
- **PX:** Trap-Bar Jump Squat 4 × 3, rest 120 s · light (about 20-30% of deadlift), jump as high as possible
- **SX:** Landmine Rotational Punch 4 × 3 / side, rest 75 s · drive from the back hip, punch fast
- **SX2:** Continuous Vertical Jumps [B] 3 × 8, rest 75 s · springy, minimal ground contact
- **Support:** Bulgarian Split Squat 3 × 6 / side, rest 90 s · 2-3 RIR
- **Support:** Pull-Up 3 × 6, rest 90 s · 2-3 RIR

**F2 · Power + Explosiveness · Advanced · Normal · 60 · Olympic day**  
_44 min · exposure share 72% · session density 0.07 · impact 12 / 100 · rule check: pass_

- **Warm-up (10 min):** Row Erg → World's Greatest Stretch → Leg Swings → Pogo Jumps → Snap-Down to Stick → Rehearsal: Power Snatch (empty bar 3 x 2)
- **PX:** Power Snatch 5 × 2, rest 150 s · light-moderate, fast turnover
- **SX:** Box Jump 4 × 3, rest 90 s
- **SX2:** Landmine Rotational Clean and Press 3 × 3 / side, rest 90 s
- **Support:** Front Squat 3 × 4, rest 120 s · 2 RIR
- **Trunk:** Pallof Press 3 × 8 / side, rest 120 s

**F3 · Power + Explosiveness · Intermediate · Normal · 30 · well-equipped gym**  
_24 min · exposure share 100% · session density 0.08 · impact 18 / 70 · rule check: pass_

- **Warm-up (6 min):** Jump Rope → Leg Swings → Pogo Jumps → Rehearsal: Push Press (empty bar 2 x 3)
- **PX:** Push Press 5 × 3, rest 120 s · moderate load, dip and drive fast
- **SX:** Banded Broad Jump 4 × 3, rest 90 s · light band, max distance, stick

**F4 · Power + Explosiveness · Beginner · Normal · 60 · floor-only gym**  
_38 min · exposure share 57% · session density 0.14 · impact 15 / 40 · rule check: pass_

- **Warm-up (10 min):** Stationary Bike → World's Greatest Stretch → Glute Bridge → Pogo Jumps → Snap-Down to Stick → Rehearsal: Broad Jump to Stick (2 x 2 at 70%)
- **PX:** Broad Jump to Stick 5 × 3, rest 75 s
- **SX:** Med-Ball Scoop Toss 4 × 4, rest 60 s
- **SX2:** Med-Ball Slam [B] 3 × 8, rest 60 s · hard slams, stop when they lose snap
- **Support:** Goblet Squat 3 × 8, rest 75 s · 3 RIR
- **Support:** Chest-Supported Dumbbell Row 3 × 8, rest 75 s · 3 RIR
- **Trunk:** Dead Bug 3 × 8 / side, rest 30 s

**F5 · Power + Explosiveness · Intermediate · Irritated · 60**  
_40 min · exposure share 80% · session density 0.20 · impact 12 / 70 · rule check: pass_

- **Warm-up (9 min):** Row Erg → Leg Swings → Pogo Jumps → Snap-Down to Stick → Rehearsal: Kettlebell Swing (light 1 x 8)
- **PX:** Kettlebell Swing [B] 5 × 12, rest 60 s · heavy enough to snap; stop if the hips stop snapping
- **SX:** Med-Ball Rotational Slam [B] 4 × 5 / side, rest 60 s
- **SX2:** Box Jump 4 × 3, rest 90 s
- **QC:** Sled Push 6 × 5 s, 45 s easy (stop when output drops)
- **Support:** Trap-Bar Deadlift 3 × 4, rest 120 s · 2 RIR

**F6 · Power + Explosiveness · Intermediate · Amped · 60**  
_46 min · exposure share 83% · session density 0.09 · impact 22 / 70 · rule check: pass_

- **Warm-up (9 min):** Air Bike → World's Greatest Stretch → Pogo Jumps → Snap-Down to Stick → Rehearsal: Hang Clean to Box Knee Drive (light 1 x 2 / side)
- **PX:** Hang Clean to Box Knee Drive 4 × 2 / side, rest 120 s · moderate DBs, clean fast, drive the knee onto the box
- **SX:** Trap-Bar Jump Squat 5 × 3, rest 120 s · light, max height
- **SX2:** Med-Ball Shot-Put Throw 4 × 3 / side, rest 60 s
- **QC:** Air Bike 6 × 6 s, 54 s easy (stop when output drops)
- **Support:** Bulgarian Split Squat 3 × 6 / side, rest 90 s · 2 RIR

**F7 · Speed + Agility · Intermediate · Normal · 60 · well-equipped gym (lane + sled)**  
_42 min · exposure share 65% · session density 0.09 · impact 48 / 70 · rule check: pass_

- **Warm-up (10 min):** Air Bike → Leg Swings → A-Skip → Wall Drill (March to Switches) → Lateral Shuffle to Stick → Build-Up: Explosive Start (5-10 m) 2 x 10 m at 70-80%
- **PX:** Sled Push [B] 6 × 10 m, light-moderate sled, drive fast, rest 90 s
- **SX:** Banded Lateral Bound 4 × 3 / side, rest 75 s · light band, max distance, stick
- **SX2:** Pogo to Box Jump 3 × 2, rest 90 s
- **Support:** Bulgarian Split Squat 3 × 6 / side, rest 90 s · 2-3 RIR
- **Support:** Nordic Hamstring Curl 3 × 4, rest 90 s · controlled lowering

**F8 · Speed + Agility · Intermediate · Normal · 30 · floor-only gym**  
_24 min · exposure share 80% · session density 0.09 · impact 6 / 70 · rule check: pass_

- **Warm-up (7 min):** Jump Rope → Leg Swings → Wall Drill (March to Switches) → Lateral Shuffle to Stick → Build-Up: Falling-Start Sprint (5 m) 2 x 5 m
- **PX:** Falling-Start Sprint (5 m) 6 × 5 m, explosive first steps, rest 60 s
- **SX:** Lateral Box Jump 4 × 3 / side, rest 75 s
- **Support:** Reverse Lunge 2 × 6 / side, rest 75 s · 2-3 RIR

**F9 · Speed + Agility · Advanced · Bored · 60**  
_40 min · exposure share 60% · session density 0.14 · impact 36 / 100 · rule check: pass_

- **Warm-up (10 min):** SkiErg → World's Greatest Stretch → Power Skip → 5-5 Shuttle → Lateral Shuffle to Stick → Build-Up: Explosive Start (5-10 m) 2 x 10 m
- **PX:** Explosive Start (5-10 m) 6 × 10 m from a half-kneeling start, rest 75 s
- **SX:** Lateral Single-Leg Hop to Stick 4 × 3 / side, rest 60 s
- **SX2:** Bear Crawl Ball Toss [B] 3 × 8-10 m, light ball, hips level, rest 60 s
- **Support:** Lateral Lunge 3 × 6 / side, rest 75 s · 2 RIR
- **Support:** Single-Leg Romanian Deadlift 3 × 6 / side, rest 75 s · 2 RIR

**F10 · Speed + Agility · Intermediate · Stressed · 60**  
_40 min · exposure share 66% · session density 0.11 · impact 33 / 70 · rule check: pass_

- **Warm-up (10 min):** Stationary Bike → Leg Swings → A-March → Wall Drill (March to Switches) → Lateral Shuffle to Stick → Build-Up: Sled Push 1 x 10 m easy
- **PX:** Sled Push [B] 5 × 10 m, same sled weight every set, rest 90 s
- **SX:** Acceleration to Stick (5 m) 6 × 1, rest 60 s · 5 m accelerate, stop in 2 steps
- **SX2:** Pogo Jumps [B] 4 × 15 s, rest 45 s
- **Support:** Front-Foot Elevated Split Squat 3 × 6 / side, rest 75 s · 2-3 RIR
- **Support:** Single-Leg Glute Bridge 3 × 10 / side, rest 75 s · controlled

**F11 · Full-Body Athlete · Intermediate · Normal · 60 · MOOD's Pick · well-equipped gym**  
_39 min · exposure share 68% · session density 0.08 · impact 15 / 70 · rule check: pass_

- **Warm-up (9 min):** Row Erg → Leg Swings → Pogo Jumps → Snap-Down to Stick → A-Skip → Build-Up: Explosive Start (5-10 m) 2 x 10 m
- **PX:** Box Jump 5 × 3, rest 90 s
- **SX:** Explosive Start (5-10 m) 5 × 10 m explosive start, rest 75 s
- **SX2:** Landmine Rotational Punch 3 × 3 / side, rest 75 s
- **Support:** Trap-Bar Deadlift 3 × 4, rest 120 s · 2-3 RIR
- **Trunk:** Suitcase Carry 2 × 1 / side, rest 45 s

**F12 · Full-Body Athlete · Beginner · Normal · 30**  
_21 min · exposure share 80% · session density 0.12 · impact 15 / 40 · rule check: pass_

- **Warm-up (6 min):** Stationary Bike → World's Greatest Stretch → Pogo Jumps → Snap-Down to Stick
- **PX:** Countermovement Jump 5 × 3, rest 75 s
- **SX:** Med-Ball Rotational Throw 3 × 3 / side, rest 60 s
- **Support:** Goblet Squat 2 × 8, rest 75 s · 3 RIR

**F13 · Full-Body Athlete · Intermediate · Low Energy · 60 · floor-only gym**  
_40 min · exposure share 62% · session density 0.16 · impact 4 / 70 · rule check: pass_

- **Warm-up (9 min):** Stationary Bike → World's Greatest Stretch → Pogo Jumps → Snap-Down to Stick
- **PX:** Seated Box Jump 5 × 3, rest 90 s
- **SX:** Bear Crawl Ball Toss [B] 4 × 8 m, light ball, smooth, rest 60 s
- **SX2:** Med-Ball Chest Pass [B] 4 × 6, rest 60 s
- **Support:** Goblet Squat 3 × 8, rest 75 s · 3 RIR
- **Support:** Chest-Supported Dumbbell Row 3 × 8, rest 75 s · 3 RIR
- **Trunk:** Side Plank 3 × 1 / side, rest 30 s

**F14 · Full-Body Athlete · Advanced · Amped · 60**  
_45 min · exposure share 84% · session density 0.09 · impact 40 / 100 · rule check: pass_

- **Warm-up (10 min):** Row Erg → World's Greatest Stretch → Pogo Jumps → Snap-Down to Stick → Rehearsal: Hang Power Clean (empty bar 2 x 3)
- **PX:** Hang Power Clean 5 × 2, rest 150 s · light-moderate, bar stays fast
- **SX:** Continuous Vertical Jumps [B] 4 × 10, rest 75 s
- **SX2:** Landmine Split Jerk 3 × 3 / side, rest 90 s
- **QC:** Sled Push 6 × 5 s, 45 s easy (stop when output drops)
- **Support:** Front Squat 3 × 3, rest 120 s · 2 RIR

**F15 · MOOD's Pick · Intermediate · sore quads, hamstrings, glutes, calves · 60 -> Power, upper / rotational**  
_43 min · exposure share 69% · session density 0.14 · impact 0 / 70 · rule check: pass_

- **Warm-up (9 min):** SkiErg → World's Greatest Stretch → Rehearsal: Landmine Rotational Punch (light 1 x 3 / side)
- **PX:** Landmine Rotational Punch 4 × 3 / side, rest 75 s
- **SX:** Med-Ball Chest Pass [B] 4 × 5, rest 60 s
- **SX2:** Explosive Push-Up 4 × 4, rest 75 s
- **QC:** SkiErg 6 × 6 s, 54 s easy (stop when output drops)
- **Support:** Pull-Up 3 × 6, rest 90 s · 2-3 RIR
- **Support:** Incline Dumbbell Press 3 × 6, rest 90 s · 2-3 RIR
- **Trunk:** Pallof Press 2 × 10 / side, rest 30 s

**F16 · Speed + Agility · Beginner · Normal · 60 · lane**  
_36 min · exposure share 68% · session density 0.10 · impact 27 / 40 · rule check: pass_

- **Warm-up (10 min):** Stationary Bike → Leg Swings → A-March → Wall Drill (March to Switches) → Lateral Shuffle to Stick → Build-Up: Explosive Start (5-10 m) 2 x 10 m at 70%
- **PX:** Explosive Start (5-10 m) 5 × 10 m from a standing start, rest 60 s
- **SX:** Skater Hops [B] 3 × 3 / side, rest 60 s
- **SX2:** Sled Push [B] 5 × 10 m, light sled, fast feet, rest 75 s
- **Support:** Reverse Lunge 2 × 8 / side, rest 60 s · 3 RIR
- **Support:** Slider Hamstring Curl 2 × 8, rest 60 s · controlled
- **Trunk:** Dead Bug 2 × 8 / side, rest 30 s

**Negative tests** (rejected as intended):

| # | Test | Rejected by |
|---|---|---|
| N1 | Power Snatch 5 × 5 at 60 s | Class-A load rule |
| N2 | KB Swing 30 reps / 30 s | Class-B bout, density, session guard |
| N3 | All-class-B 1:1 session | Density, session guard, no class-A exposure, impact |
| N4 | Continuous Vertical Jumps for a beginner | Experience gate |
| N5 | Bear Crawl Ball Toss as Power PX | Not eligible |
| N6 | Hang Power Clean for an intermediate | Experience gate |

---

## 9. Decisions

**Adopted as recommended in the previous pass:**

- R-1 to R-7;
- quality / vector tags;
- Athletic WA sheet updates;
- beginner 60-minute floor 34 min;
- hamstring isolation in Speed support.

**New in this pass:**

| # | Decision | Recommendation |
|---|---|---|
| F-A | Adopt the two prescription classes and the governed tag `pc_repeatable` (a third tag family beside `aq_*` / `vec_*`). | Approve. |
| F-B | Adopt AI-5a / b / c (§3) in place of the single 35% block ceiling. | Approve. |
| F-C | Approve the 4 additions (Bear Crawl Ball Toss and 3 landmine) and the new `integrated` / `rotational_power` quality values (18 `aq_*` values in total). | Approve. |
| Later | Whether "Speed + Agility" still names the experience (it now reads as acceleration, lateral power, elasticity and sled). Decide with pressure-test evidence. | Defer. |

**Stop condition met:**

- pools are viable (thin only where intentional and rerouted);
- mechanics are sound and gated;
- the workouts read as explosive gym training;
- State and soreness behavior works;
- safety, impact and fatigue checks work;
- no major launch flaw appeared.

**Recommendation: FINAL LIBRARY APPROVAL → GENERATOR IMPLEMENTATION** (then automated QA, one founder pressure test, fixes, FINAL FREEZE).
