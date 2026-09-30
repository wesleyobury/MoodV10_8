# MOOD V3 Athletic: Identity Pass (candidate, not frozen)

**Status:** Athletic is reopened as `ENGINE_PHASE = '3.4-athletic-candidate'` (engine version `athletic-candidate-v4`). I have not frozen it; I've stopped here for your review.

**Checks:**
- Strength and Sweat are untouched, and their frozen parity tests pass.
- Tests: 181 passed, 3 skipped. Unified QA: 0 failures.
- State Satisfaction and Coherence: 100% for every State.

**Review material:**
- `V3 Updates/MOOD_V3_Athletic_Founder_Review_Pack.md` / `.xlsx`: 27 production sessions, every movement labelled.
- In `backend/mood_v3/qa/results/`:
  - `ATHLETIC_IDENTITY_metrics.txt`: level, goal, State and structure breakdowns.
  - `ATHLETIC_IDENTITY_before_after.txt`: same seeds, before and after.
  - `ATHLETIC_IDENTITY_checks.txt`: drills, Olympic lifts, gates, Swap and Different Workout.
  - `ATHLETIC_IDENTITY_trainer_read_sample.txt`: the 30 sessions from the identity test.
  - `ATHLETIC_IDENTITY_olympic_frequency.txt`

## 1. The change: an athletic movement budget, not a block count

**Cost tiers.** Every athletic movement is classified by its systemic and technical cost:

| Tier | What | Cost points |
|---|---|---|
| **A** | Olympic lifts; maximal sprint or heavy sled when it leads the session; drop and reactive jumps; Consecutive Broad Jumps; Trap-Bar Jump Squat; DB/KB snatch; contrast pairs | 3 |
| **B** | Box and broad jumps, hops, bounds, lateral bounds, split-squat jumps, step-up pops, explosive push-ups, landmine power, KB swing, muscle-ups, speed-strength lifts, a sprint or sled that is not the lead | 2 |
| **C** | Med-ball throws and slams; low-impact jumps (seated box jump); bodyweight step-up pop | 1 |

**Budget at 60 minutes** (beginner / intermediate / advanced):

| | Beginner | Intermediate | Advanced |
|---|---|---|---|
| Cost points | 5 | 8 | 10 |
| Tier A movements, at most | 1 | 1 | 2 |
| Athletic movements, at most | 3 | 4 | 4 |

- **30 minutes:** 2 athletic movements.
- **Low Energy:** 4 cost points and 2 movements. **Stressed:** 3 movements, all simple.

**How many athletic movements a session aims for** is sampled, and the budget decides what actually fits:
- Beginner: 2, sometimes 3.
- Intermediate: mostly 3, sometimes 2 or 4.
- Advanced: 3 or 4, mostly 4.
- Amped and Bored lean toward the richer end. Build Strength is capped at 3, because it keeps heavier strength support.

**How further movements are chosen:**
- A new family or quality first, and a second jump must go in a different direction.
- At most one med-ball throw, one sprint or sled, one Olympic lift, one high-skill movement and one speed-strength lift.
- The choice is seeded and weighted, so the vocabulary varies from day to day.

**Order and dosing:**
- Highest cost first: Tier A, then B, then C, with jumps and sprints before throws. The validator enforces this order.
- With 3 or more athletic movements, the primary gives up one set and every other element stays at 3 sets (4 for sprints and speed-strength lifts), so a four-movement session is not four times the volume.
- The budget check projects this rebalance before adding a movement, and the impact and intent ceilings still decide.

**Strength is support.**
- One strength exercise is the default when there are 3 or more athletic movements.
- Two are used for Build Strength, or when the athletic work is only two movements (beginners and Low Energy).
- Pull-ups and rows are no longer the automatic partner; they are chosen for pulling balance about half the time.

**Carries are gone from Athletic:** support, finisher, swaps, Built for Today and the State language. They remain in the master library for Strength and Sweat. Support is now rare and purpose-bound (hamstrings for sprinting, tendons, anti-rotation, or sore legs); otherwise there is nothing.

**Accounting uses exercise identity.** Each movement is labelled `ATHLETIC`, `ATHLETIC_STRENGTH` or `SUPPORT` in the app payload (`direction_fields.category` and `cost_tier`). A normal Front Squat, Trap-Bar Deadlift, RDL, pull-up or row is always `ATHLETIC_STRENGTH`, whatever the cue says; a test fails if one is ever counted as athletic.

## 2. Library additions (media needed for every new item)

I audited the library first. It already had the jumps, hops, bounds, throws, slams, Olympic lifts, landmine power, explosive push-up, sprints and sled. `Split-Squat Jump` was also there but unused, so it is now wired in. I added 8 distinct exercises, each with its own dose. None is an ordinary strength exercise with a "move fast" cue.

| Exercise | Min level | Impact | Cx | Tier | Dose | Swap family |
|---|---|---|---|---|---|---|
| Explosive Step-Up (Pop), bodyweight | beginner | moderate | 1 | C | 3 × 4/side, 90 s | step_up_pop |
| Dumbbell Step-Up with Pop | intermediate | moderate | 2 | B | 3 × 3/side, 90 s | step_up_pop_loaded |
| Reverse Lunge to Knee-Drive Hop | beginner | moderate | 2 | B | 3 × 3/side, 90 s | lunge_hop |
| Split-Squat Jump *(existing)* | intermediate | moderate | 2 | B | 3 × 3/side, 90 s | split_jump |
| Rear-Foot-Elevated Split Squat Jump | advanced | moderate | 3 | B | 3 × 3/side, 90 s | rfe_split_jump |
| Band-Assisted Muscle-Up | intermediate | low | 3 | B | 3 × 3, 120 s | muscle_up |
| Bar Muscle-Up | advanced | low | 4 (high skill) | B | 3 × 2, 120 s | muscle_up |
| Speed Trap-Bar Deadlift | intermediate | low | 3 | B | 4 × 2 at about 50% est. max, 90 s, stop if speed slows | deadlift |
| Speed Box Squat | intermediate | low | 3 | B | 4 × 3 at about 50% est. max, 90 s, stop if speed slows | back_squat |

- **Muscle-ups:** no beginner gets one. Advanced users get the bar version; the band version is the intermediate option.
- **Speed-strength lifts:** they share a swap family with their strength lift, so a Speed Trap-Bar Deadlift never appears next to a normal Trap-Bar Deadlift. They are weighted to stay occasional.
- **Not added:** ring muscle-up, speed bench, depth push-up and "explosive RDL"; the existing set covers the need. Hinge power stays with the KB swing, high pull and Olympic derivatives.

## 3. Movement accounting, 60 minutes

**No State, same seeds** (120 sessions per level; before = the frozen composition pass):

| Level | Athletic 1 / 2 / 3 / 4+ | Mean ATHLETIC | Mean ATHLETIC_STRENGTH | Mean SUPPORT | Carry | Pull-up / row |
|---|---|---|---|---|---|---|
| Beginner | before 3/97/0/0 → **0/82/18/0** | 1.97 → **2.18** | 1.76 → 1.86 | 0.24 → 0.00 | 6% → 0% | 59% → 28% |
| Intermediate | before 0/43/57/0 → **0/8/78/14** | 2.57 → **3.07** | 1.74 → 1.22 | 0.28 → 0.14 | 12% → 0% | 57% → 8% |
| Advanced | before 0/46/54/0 → **0/3/52/44** | 2.54 → **3.41** | 1.78 → 1.22 | 0.24 → 0.07 | 8% → 0% | 66% → 14% |

**Full State grid** (1,404 sessions, all States):
- Beginner mean 2.10: 90% have 2 athletic movements, 10% have 3.
- Intermediate mean 2.66: 59% have 3 or more.
- Advanced mean 2.83: 68% have 3 or more.
- Low Energy, and its combinations, is 2 athletic movements plus concise strength by design. Stressed is 2 to 3 simple movements.
- No session anywhere has more strength and support than athletic work.

**By goal** (no State, intermediate and advanced, mean athletic movements):

| Goal | Mean athletic | Strength exercises |
|---|---|---|
| Athleticism | 3.1 | |
| Build Strength | 2.9 | 2 (heavier) |
| Build Muscle | 3.3 | |
| Conditioning | 3.3 | |
| Feel Better | 3.2 | |
| Stay Consistent | 3.4 | |

**By State** (60 min, all levels, mean athletic): Bored 3.06, Irritated 2.91, Amped 2.83, Stressed 2.56, Low Energy 2.00. For structures, see `ATHLETIC_IDENTITY_metrics.txt`.

**Workload is the same order as before:**
- Estimated time is unchanged: medians of 36 / 43 / 49 min.
- Median explosive sets rose from 6 / 9 / 10 to 7 / 10 / 13, with a maximum of 14.
- Strength and support sets fell from 9 to 3 to 6.

**Olympic lifts are unchanged or slightly more common:**
- Intermediate: Athleticism 25%, Build Strength 30%.
- Advanced: Athleticism 31%, Build Strength 36%; other goals 20 to 28%.
- Beginners: 0.
- Barbell Olympic lifts only ever lead the session. DB and KB derivatives can appear as a further element.
- There are 0 dose or freshness violations.

**Other checks:**
- Different Workout: 12 of 12 changed.
- Swap: 50 of 52 valid, 2 honest "no alternative". A swap never raises cost tier or impact.

## 4. Human identity test (30 random 60-minute sessions, Direction hidden)

One of the 30 was a correct conflict (Speed + Plyo requested with sore legs). Of the other 29:

- **26 read immediately as athletic-performance training.** Most of their exercises are ones you would expect because this is Athletic, not merely things an athlete could benefit from. Typical examples:
  - Sled Push, Landmine Push Press, Med-Ball Overhead Throw, Front Squat, Kickstand RDL
  - Consecutive Broad Jumps, KB Swing, Landmine Push Press, Rotational Slam, Front Squat
  - RFE Split Squat Jump, Broad Jump to Vertical, Explosive Push-Up, KB Swing, Trap-Bar Deadlift
  - Lateral Box Jump, Reverse Lunge to Knee-Drive Hop, Landmine Punch, Rotational Throw, KB Deadlift
- **3 are 50/50 by design:** 2 athletic movements plus 2 strength exercises.
  - T12 and T19 are beginners. A jump, a push press or chest pass, a KB deadlift and a press.
  - T30 is an intermediate day where the sampled target was 2 (10% of intermediate days). Broad Jump, DB Push Press, KB Deadlift and DB Bench.
  - All three are still clearly athletic-led, but they are the least distinctive sessions.

I read the whole sample for "would this still be explosive":
- Every element is 2 to 5 sets of low reps with 60 to 150 s of rest.
- The biggest days sit at 13 to 14 explosive sets, inside the impact and intent ceilings.
- None of them is a conditioning circuit.

Issues found and fixed during the read:
- Two med-ball throws in one session read as filler, so throws are now capped at one.
- A second jump in the same direction (Broad Jump plus Banded Broad Jump) is no longer allowed.
- Advanced users were getting the band-assisted muscle-up; they now prefer the bar muscle-up.
- A Low Energy session led by a throw now gets a simple jump or start as its partner, not a single movement.

## 5. The founder cases in the pack (selected)

Every movement is labelled in the pack.

| Case | ATHLETIC | ATHLETIC_STRENGTH |
|---|---|---|
| Advanced, Athleticism | Sled Push, Lateral Single-Leg Hop, Explosive Step-Up (Pop), Med-Ball Rotational Throw | Bulgarian Split Squat |
| Advanced, Olympic | Split Jerk, Sled Push, Explosive Step-Up (Pop) | Trap-Bar Deadlift |
| Advanced, Build Strength | Falling-Start Sprint, DB Push Press, Rotational Throw | Trap-Bar Deadlift, Kickstand RDL |
| Advanced, Amped | Box Jump, Sled Push, Lateral Single-Leg Hop, Landmine Punch | Back Squat |
| Advanced, muscle-up (Bored) | Consecutive Broad Jumps, Bar Muscle-Up, Speed Box Squat, Step-Behind Rotational Throw | RDL |
| Intermediate, assisted muscle-up | Banded Lateral Bound, Band-Assisted Muscle-Up, Rotational Slam | DB RDL |
| Intermediate, Stressed | KB Swing, Explosive Push-Up, Med-Ball Slam | Goblet Squat |
| Beginner, three movements | Countermovement Jump, DB Push Press, Med-Ball Chest Pass | Goblet Squat |
| Low Energy, advanced | Lateral Box Jump, Shot-Put Throw | Front Squat, Weighted Push-Up |

## 6. What I would flag for your review

1. **Advanced sits at 52% three movements and 44% four.** Sprint-led and Build Strength days hold at 3, by rule and by budget. If you want four to be the clear majority, the lever is the advanced intent ceiling (14) or shorter lead sprint days. I did not raise ceilings without your call.
2. **Speed-strength lifts are deliberately occasional** (a few percent of intermediate and advanced sessions), because MOOD has no velocity tracking. They use a load and speed proxy.
3. **Media:** 8 new exercises need media.
4. **Pull-ups and rows** still appear in 8 to 28% of no-State sessions (more for beginners, who get two strength exercises).

## 7. Freeze standard (for your decision)

| # | Condition | Status |
|---|---|---|
| 1 | Advanced 3 to 4 athletic movements | Yes, 96% with no State |
| 2 | Intermediate centres on 3 | Yes, 78% |
| 3 | Beginner generally 2 | Yes, 82%; 18% have 3 simple movements |
| 4 | Athletic dominates | Yes, 0% of sessions are outnumbered by strength and support |
| 5 | Strength is support | Yes, 1 to 1.2 strength exercises on average |
| 6 | No false athletic counting | Yes, by identity and tested |
| 7 | Explicit variants | Yes |
| 8 | Muscle-ups | Yes, advanced bar and intermediate band |
| 9 | Carries absent | Yes, 0% and validator-checked |
| 10 | Olympic lifts prominent | Yes |
| 11 | Power quality protected | Yes |
| 12 | Reasonable workload | Yes |
| 13 | States coherent | Yes, 100% |
| 14 | 30 minutes concise | Yes, 2 athletic + 1 strength |
| 15 | Hard to mistake for Strength | Yes, in 26 of 29 in the human read; 3 borderline |

Not frozen. Stopping for founder review. Cart not started.
