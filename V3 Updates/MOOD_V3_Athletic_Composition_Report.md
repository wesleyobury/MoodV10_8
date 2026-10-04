# MOOD V3 Athletic: Composition Pass and Freeze

Athletic is frozen again at `ENGINE_PHASE = '3.3-athletic-frozen'`; the Athletic engine version is now `athletic-frozen-v3`. Strength and Sweat were not touched. Tests: `181 passed, 3 skipped`. Unified QA: 0 failures.

Companion files:
- `V3 Updates/MOOD_V3_Athletic_Founder_Review_Pack.md` / `.xlsx`: 29 production sessions, each showing its composition.
- In `backend/mood_v3/qa/results/`:
  - `ATHLETIC_COMPOSITION_before.txt` / `_after.txt`: the full grid.
  - `ATHLETIC_COMPOSITION_no_state.txt`: before and after, same seeds.
  - `ATHLETIC_FREEZE_olympic_frequency.txt`
  - `ATHLETIC_FREEZE_trainer_read_sample.txt`: the 25 sessions read.
  - `ATHLETIC_FREEZE.md`

## 1. What was wrong

The generator's default was: primary power, then a strength pair, then support. The secondary quality was only added for Athleticism goals, beginners and a few special cases. Before this pass, at 60 minutes:

- 62% of sessions had only one athletic movement.
- 79% had more strength and support exercises than athletic ones.
- 46% ended with a carry.
- At 30 minutes, every session was 1 athletic movement plus a strength pair.

## 2. The rule now (one general rule, no seed patches)

**60 minutes**

- **Primary athletic quality.** Unchanged.
- **Secondary athletic quality.** This is now the default. It complements the primary: a throw, a slam, an explosive push-up, a short sprint or sled, or a jump in a different direction. If the preferred options can't be built, a simple throw is the fallback.
- **Tertiary athletic element.** Optional and small, for intermediate and advanced only:
  - Budget: 2 to 3 sets. Allowed movements are complexity 2 or less, never high impact, never Olympic.
  - It is always a different family from the first two: a throw, a short sled push, or a jump if there is no jump yet.
  - Frequency is seeded by goal (more often for Athleticism, less for Strength and Muscle). Amped, Bored and Irritated raise it; contrast sessions lower it.
  - **It rebalances rather than adds:** the primary gives up one set, and strength is capped at 3 rounds.
- **Athletic strength.** Usually 2 exercises, capped at 3 rounds whenever a secondary is present (except for Build Strength).
  - Sometimes the second strength slot is replaced by support that serves the day: hamstrings for sprinting, tendons for elastic work, anti-rotation for throws, and carries only where grip or trunk stiffness is the point.
  - This swap never happens for Build Strength, Low Energy or Stressed.
- **Support.** Support is only added if athletic movements still at least equal strength plus support afterwards. A carry is no longer automatic.

**30 minutes**

- Primary, plus a low-cost second athletic movement (a throw, a slam, a landmine or an explosive push-up), plus 1 strength exercise.
- This swaps one strength exercise for a throw; it does not add work.

**Quality budget still wins.** The impact and intent ceilings are unchanged at 60 minutes. The 30-minute ceilings rose slightly so a throw fits. The maximum explosive exercises is now 3 at 60 minutes and 2 at 30 minutes (beginners 2). When the budget or the time window is tight, the order of cuts is:

1. Support
2. Strength rounds
3. Tertiary sets
4. Secondary sets
5. The tertiary element itself

The athletic work outlasts the strength work.

## 3. Composition metrics

**60 minutes, full grid** (1,404 production-path sessions, every level, goal and State mix; commercial gym). Each cell reads before → after.

| Level | 1 athletic | 2 athletic | 3+ athletic | Strength+support outnumber athletic | 1 athletic + 3 others | Carry | Secondary | Tertiary | Athletic : other |
|---|---|---|---|---|---|---|---|---|---|
| Beginner | 59% → 1% | 41% → 99% | 0 → 0 | 88% → 1% | 29% → 0 | 54% → 2% | 41% → 99% | 0 → 0 | 0.55 → 0.99 |
| Intermediate | 62% → 3% | 38% → 71% | 0 → 26% | 79% → 3% | 32% → 0 | 45% → 4% | 38% → 97% | 0 → 26% | 0.56 → 1.12 |
| Advanced | 65% → 5% | 35% → 65% | 0 → 30% | 72% → 5% | 35% → 0 | 39% → 0% | 35% → 95% | 0 → 30% | 0.56 → 1.13 |

The remaining one-movement sessions at 60 minutes are almost all Low Energy combinations (Bored + Low Energy and Irritated + Low Energy: 13% each).

**No State only, 60 minutes** (120 per level, same seeds):

| Level | Athletic 1 / 2 / 3+ | Other outnumber athletic | Support | Carry | Explosive sets | Strength + support sets | Est. min |
|---|---|---|---|---|---|---|---|
| Beginner | 6/94/0 → 3/97/0 | 79% → 3% | 79% → 24% | 77% → 6% | 6 → 6 | 9 → 6 | 41 → 36 |
| Intermediate | 31/69/0 → 0/43/57 | 88% → 2% | 82% → 26% | 78% → 12% | 7 → 9 | 9 → 6 | 46 → 45 |
| Advanced | 49/51/0 → 0/46/54 | 77% → 2% | 72% → 22% | 67% → 8% | 9 → 10 | 9 → 6 | 49 → 48.5 |

Total work is about the same. Two or three explosive sets moved from strength and support to athletic work, and estimated time is equal or shorter.

**30 minutes:** 2 athletic movements in 95% of sessions (was 0%). Strength is 1 exercise at 3 sets (was a pair at 6 sets). The median estimate is 22 / 26 / 28 min by level (was 20 / 22 / 24), inside the window.

**By State, 60 minutes** (share of sessions with 3+ athletic movements):

| State | 3+ athletic | Composition |
|---|---|---|
| Amped | 59% | Richer composition, with the same strength and support volume |
| Bored | 54% | Varied qualities: jump + throw, rotational + acceleration, Olympic + lateral |
| Irritated | 50% | Sled, sprint, slam, broad jump and explosive lifts; strength second |
| Stressed | n/a | 2 athletic + 2 strength (for example KB swing, med-ball throw, squat, row); simple, never complex |
| Low Energy | n/a | One jump or sprint plus one low-impact throw, with concise strength; no Olympic lifts, no tertiary |

State Satisfaction and Coherence: 100% for every State.

## 4. The founder cases (same inputs and users, before → after)

- **A2** (advanced, no State):
  - Before: Trap-Bar Jump Squat 5×3, Front Squat, Inverted Row, Suitcase Carry.
  - After: Trap-Bar Jump Squat 4×3, **Sled Push 4×10 m**, **Med-Ball Overhead Throw 3×5**, Front Squat 3×5, Inverted Row 3×8.
- **A3** (advanced, Build Strength):
  - Before: Consecutive Broad Jumps, RDL, Chin-Up, Carry.
  - After: Consecutive Broad Jumps 5×3, **Landmine Split Jerk 3×3/side**, RDL 4×3, Chin-Up 4×5. The carry is gone; strength keeps 4 rounds because the goal is strength.
- **S3** (Stressed):
  - Before: KB Swing, Goblet Squat, Row, Overhead Carry.
  - After: KB Swing 4×8, **Med-Ball Overhead Throw 3×5**, Goblet Squat, Row. Simple, and clearly athletic.
- **S4** (Low Energy, advanced):
  - Before: Lateral Box Jump, RDL, Inverted Row.
  - After: Lateral Box Jump 4×3, **Med-Ball Overhead Throw 3×5**, RDL 3×3, Inverted Row 3×6. Still concise, with low impact.
- **O4** (advanced, Build Strength, clean):
  - Before: Hang Power Clean 5×2, Front Squat 4×3, Pull-Up 4×5, Carry.
  - After: Hang Power Clean 4×2, **Med-Ball Rotational Throw 3×4/side**, **Countermovement Jump 3×3**, Front Squat 3×3, Pull-Up 3×5.

## 5. Olympic lifts, impact, beginners

Olympic lifts are protected. Measured on identical seeds, no State, 120 sessions per cell:

- **Intermediate:** unchanged. Athleticism 25%, Build Strength 28%.
- **Advanced:** equal or slightly higher.
  - Athleticism 28%, unchanged.
  - Build Strength 35%, unchanged.
  - Build Muscle 19% → 21%.
  - Conditioning 22% → 23%.
  - Feel Better 16% → 18%.
- **Beginners:** 0%.

(Earlier tables used different seeds, so compare this one within itself.)

An Olympic lift is still only ever the primary, now often followed by a throw or a jump. It is never the tertiary element. Across the grid there were 0 dose violations, 0 Olympic lifts outside the fresh blocks, and at most 3 explosive exercises.

**Impact:** contact medians are unchanged (beginner 6 to 9, intermediate 9, advanced 12) and the high-impact ceilings are untouched.

**Beginners:** two simple athletic movements (a jump or sprint plus a med-ball throw) and one or two simple strength exercises, with no tertiary, no Olympic lifts and no high-impact work.

## 6. Human read (25 random 60-minute sessions, seed 2027)

With the Direction label hidden, all 25 read as athletic-performance sessions. None were a strength workout with a jump first. The typical session is:

- Two or three athletic expressions (for example CMJ + rotational throw; Broad Jump + push press + sled; Hang High Pull + shot-put throw + sled)
- Then a concise strength pair, or one strength exercise plus purposeful support

Each explosive element is 2 to 5 sets of low reps with 60 to 150 s of rest, and every set stays explosive. The heaviest days (advanced Irritated or Amped with three elements) sit at 9 to 11 explosive sets, inside the intent ceiling.

Two things I tuned during the read:

- **Sled pushes** showed up too often as the third element, so their weighting was reduced.
- **Rotational med-ball throws** remain the most common secondary. They are the classic low-cost complement to lower-body power, and Low Energy and Stressed can only use throws.

## 7. Label cleanup

"Speed + Agility" is now **"Speed + Plyo"** in:
- the backend label (`formatter.py`, `athletic_core.ARCH_NAME`)
- the sore-legs conflict message
- the app picker (`frontend/utils/v3HomeModel.ts`, 2 lines)

The id `athletic_speed_agility` is unchanged, so saved history and requests are unaffected. Content is sprints, sled, bounds, lateral bounds and reactive jumps. The name is easy to change if you prefer another. The dev fixture JSON still says the old name and is display-only.

Warm-up is unchanged: A-skip, wall drill, snap-down and pogo remain as preparation. Equipment is unchanged: the production default is still the commercial gym.

## 8. Other changes needed by the composition

- **Validator:** knows the tertiary role (order, at most one, small dose).
- **Swap:**
  - A tertiary element can swap to another small athletic element.
  - Support can swap across the day's support purposes.
  - Swap is now 53 of 53 valid.
- **Built for Today:** names the tertiary element.
- **Low Energy wording:** now reads "2 athletic movements instead of 3".
- **Flaky test:** `test_phase2_6` uses a random user id, so its advanced-movement check sampled 4 days. It now samples 16 days to stop the flake.

## 9. Freeze standard

1. 60-minute sessions have enough athletic work: yes. 97% or more have 2 or more athletic movements; 19% have 3 or more across all States and 55% with no State.
2. One athletic movement plus mostly strength and support is uncommon: 0% "1 + 3", and 1 to 5% one-movement sessions (almost all Low Energy).
3. Strength supports rather than dominates: athletic to other ratio is 1.1 (was 0.55), and strength and support outnumber athletic in 3% (was 79%).
4. Carries are not automatic: 0 to 4% on the full grid, 6 to 12% with no State (was 39 to 78%).
5. Secondary qualities are meaningful: 95 to 99%.
6. Tertiary work appears where appropriate: intermediate and advanced only, 26 to 30% overall and 54 to 59% for Amped and Bored.
7. Olympic representation is healthy: unchanged or higher on the same seeds.
8. Power quality and rest are protected: validator and QA, 0 violations.
9. Impact is controlled: ceilings unchanged, contact medians unchanged.
10. Beginners are appropriate: 2 simple athletic movements, no tertiary, no Olympic lifts.
11. States are coherent: 100%.
12. 30-minute sessions stay focused: 3 exercises, 2 of them athletic.
13. 60-minute sessions feel unmistakably athletic: human read.
14. No systemic "strength workout with a jump first" pattern remains.
15. A performance coach would prescribe the whole workload: human read, with similar total sets and time.

**Athletic is frozen. Stopping here. Cart not started.**
