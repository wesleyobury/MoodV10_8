# Sweat: final pre-launch trainer-quality pass (FROZEN, engine phase 3.6-sweat-final-prelaunch)

**Founder-approved freeze, 2026-10-02.** Approved as shipped: the work floors (60-minute sessions land about 51-57 min including warm-up and downshift), and the two Sweat exclusions (Dumbbell Lateral-Raise Jacks, Bench Dip). Behavior changes to Sweat from here on require a founder decision and a new engine phase.

Frozen 2026-10-02. This pass changes Sweat programming behavior on top of the 3.2 Sweat freeze (`SWEAT_FREEZE.md`). The
architecture is unchanged: blueprints, State expressions, the workload budget, the State Satisfaction gate, State coherence,
the frozen validator, the renderer and the API schema all stay the same. Strength and Athletic source files are untouched, and
the frozen parity tests still pass.

Founder-facing summary: see the chat report. Everything below is implementation detail.

## 1. Root cause of short sessions

In the 3.2 freeze, the selected duration was treated as "an available window, not a work quota". A main block that scored
"sufficient" shipped on its own. The clock was then filled with warm-up (up to 10 min), downshift (up to 8 min) and "setup" time.
As a result, a "60-minute" Engine session could be 10 min warm-up + 4 x 4 min row + 8 min downshift (38 min elapsed, 20 min of
work). Stressed got no second block at all. Amped's harder main block counted as "sufficient" sooner, so it ended earlier.

## 2. What changed (engines/sweat/sweat_core.py unless noted)

**Minimum meaningful work.** Programmed work is every block between warm-up and downshift: the work, the recovery inside it,
transitions and the gaps between blocks. Warm-up, downshift and setup never count.

- `WORK_FLOOR`: 30 min = 19, 60 min = 41 (beginners 18 / 39).
- `HARD_RELIEF`: when hard (RPE 8+) work is already at least 6 / 12 min, the floor drops by 1.5 / 3 min. Harder sessions may
  finish a little earlier.
- `assemble()` order:
  1. The main block grows within its blueprint.
  2. One complement is sized to the gap (`add_complement`, which tries a first choice, an alternative and a bodyweight variant).
  3. A State-driven finisher, only when there is no complement and the main block is not hard.
  4. The main block may stretch past its blueprint (bounded).
  5. A capped station complement may take one or two more rounds when the main block is at its cap.
  6. Warm-up and downshift may each grow by at most 2 min (`PREP_EXTRA_MAX`).
- `hybrid_fill()`, `refill()` (after State coherence repairs) and the new `final_trim()` follow the same rule.
- Blueprint ranges moved (`PRIMARY_MIN`, `COMP_MIN`):
  - Engine 60: 22-28; Engine 30: 17-22.
  - Circuit 60: 22-25; Circuit 30: 17-22.
  - Hybrid 60: 30-40; Hybrid 30: 18-23.
  - Complement 60: 10-16; Complement 30: 4-7.
- A complement is now allowed at 30 minutes when the main block alone is short.

**No standalone steady state.**
- `continuous` is removed from `ENGINE_SHAPES`.
- Long intervals are at most 4 min per bout (advanced 4:00 / 1:15).
- The 30-minute pyramid is a full 1-2-3-4-3-2-1.
- Short intervals go up to 18 rounds (advanced 20) at 60 minutes.
- Easy continuous work survives only as a closer or flush, capped at 10 min (`STEADY_COMP_MAX_MIN`).

**Stressed = rhythmic, predictable, moderate, complete.**
- `rpe_cap` now leaves a one-point band (RPE 7-8 becomes 6-7).
- `steady_cyclical` and `controlled_pace` lengthen short bouts (`bouts_longer`). `steady_cyclical` also adds 25% recovery.
- Stressed sessions now get a simple complement (RPE 6-7) instead of stopping after one block.
- A burpee-type driver or a complexity-3 station (for example Devil Press) is swapped for a simple, low-impact station. This
  applies to circuits, Hybrid stations and complements, unless Amped or Irritated is also selected.

**Amped.**
- Amped keeps its harder or denser main block. The work floor then adds controlled (RPE 6-7) work next to it, never more all-out
  efforts.
- The Amped coherence check now credits real density or more productive work. It only flags "everything all-out" when a
  secondary block is itself hard.

**Irritated.** On an Engine (without Low Energy or Stressed), the main block is always short, hard intervals. Long intervals and
pyramids are no longer chosen.

**Trainer-quality fixes found in the audit.**
- **No RPE 9 on long bouts.** Bouts of 2.5 min or more (long intervals, long pyramid steps) top out at RPE 8 (`long_bout_rpe_cap`).
- **Bored "changing intervals" kept its length.** It used to collapse an 18 x 40 s block into a 4-minute pyramid. It now keeps
  roughly the block's work.
- **At most two pressing stations in a circuit** (`balance_pressing`). Impact swaps never add a third press.
- **A large explicit Target muscle is trained as a primary mover** (`cover_target_primary`). Impact swaps keep that coverage.
- **Impact budget: better stations, not fewer rounds.**
  - The only driver can be swapped for a lower-impact one.
  - A jumping bout is shortened before any round comes off (`shrink_impact_dose`). EMOMs are covered too.
- **Loaded-rep budget, during growth:** sets are trimmed once at most. Rounds of tiny sets are junk volume.
- **Easy complement intervals.** At RPE 6-7, 40/20 becomes 90/60 (60/60 for beginners). A short-rest format at an easy effort is
  incoherent.
- **The station complement stays small** (4 rounds, 5-6 only when the main block is capped). It also avoids exercises from the
  user's last two sessions.
- **Ladder Hybrids stay ladders when a round is added** (500 / 450 / 400 / 350 m, not 500 / 350 / 350 / 350).
- **30-minute split-anchor Hybrids** use 3 rounds x 3 stations instead of 2 x 4.
- **Excluded from Sweat** (`SWEAT_EXCLUDED`, production only; the frozen workbook is untouched):
  - Dumbbell Lateral-Raise Jacks (a gimmick).
  - Bench Dip (shoulder stress for little conditioning value).
- **Rendering and explanations** (`render.py`, `sweat_why.py`):
  - RPE 6-7 interval blocks are described as controlled, not "hard intervals".
  - The "Built for Today" text names the main-block machine, not the complement's.

## 3. Sweat Trainer Coherence Gate (engines/sweat/trainer_gate.py)

The gate is small and deterministic. It does not score or build anything. It runs on the finished session and returns the checks
that fail:

| Check | What it catches |
|---|---|
| `underfilled` | Work below the floor minus 2 min, or elapsed time well under the window |
| `generic_steady_state` | A continuous main block, or a flush longer than 10 min |
| `weak_stimulus` | Too few active minutes (30 min: 8, 60 min: 18; beginners x 0.85) |
| `excessive_hard_work` | Hard minutes or all-out blocks above the level ceiling, or RPE 9 for a beginner |
| `excessive_impact` | Impact contacts above the level ceiling |
| `engine_volume` | Engine minutes above the level ceiling |
| `redundant` | The same exercise family or machine twice |
| `station_complexity` | More than 5 stations in a block, or too many distinct stations |
| `low_value_exercise` | 2 or more filler stations in a non-beginner main circuit |
| `pattern_overload` | 3 or more pressing stations in one block |
| `state_mismatch` | Low Energy at RPE 9 or with a finisher; Stressed with a countdown structure, a finisher, or complex / jumping stations |
| `state_overload` | More than 2 special elements (finisher, changing structure, ladder complement) |
| `target_thin` | An explicit Target muscle with no station training it |
| `level_mismatch` | A beginner given an EMOM, ladder or pyramid main block, or more than 2 demanding stations |

**Allowances.** These apply only where the library cannot do better:

- **Constrained equipment.** Minimal or free-weight presets with a beginner or Low Energy have no cardio machine, and every
  bodyweight driver is a jumping pattern. These sessions get:
  - 2.5 / 6 min of work relief;
  - no impact check;
  - credit for a Target muscle reached as a secondary mover.
- **Soreness.** It narrows the menu, so it gets the same work relief, and the filler and pressing-balance checks are skipped.

**Wiring.**
- `sweat_core.gate_select()` builds the session.
- If the gate finds issues, it re-rolls with a salted seed (same archetype, same States) up to 3 times. The lowest-scoring
  attempt ships; validator failures weigh 10.
- Different Workout replays the chain through the same function, so anti-repeat stays exact.
- Issues are logged as `trainer_gate` and never become a conflict for the user.
- Exercise swaps may not add a gate issue the session did not already have.
- QA asserts zero gate issues.

## 4. QA (production path, `python -m mood_v3.qa.sweat_trainer_qa out`)

**Main matrix.** 2,081 requests:

- Engine, Circuit and Hybrid x 30 / 60 x 3 levels x no State, every single State, 8 pairs and 4 triples x 4 users.
- MOOD's Pick, goals, 6 explicit Targets, 4 soreness regions, 3 equipment presets, and 4 sequential users with history.

**Re-checks.**
- A holdout matrix with unseen users and dates.
- 3 x 1,500 randomized requests mixing soreness, Targets, limited equipment and 0-3 States.
- 751 exercise swaps.

**Results.**

- Main matrix:
  - 0 trainer-gate issues in the 2,001 workouts that built (the other 80 are the same equipment / soreness conflicts as before).
  - 6 re-rolls.
  - 0 standalone steady-state main blocks (was 172).
- Holdout matrix: 0 gate issues, 11 re-rolls.
- Randomized sweeps: 1-2 minor gate issues per 1,360 workouts, all on limited equipment or with soreness / Target constraints.
  They are logged and listed under Deferred.
- Exercise swaps: 0 new gate issues introduced.

| | 30 min before | 30 min after | 60 min before | 60 min after |
|---|---|---|---|---|
| Elapsed, median | 25.0 | 28.3 | 47.8 | 53.5 |
| Programmed work, median | 17.5 | 20.8 | 31.8 | 41.8 |
| Programmed work, 10th percentile | 14.1 | 19.2 | 23.9 | 39.2 |
| Programmed work, worst | 9.9 | 17.6 | 17.8 | 33.7 |

For per-group figures (Stressed Engine, Amped Engine / Circuit / Hybrid, Low Energy, Bored, Irritated, combinations), see
`SWEAT_FINAL_PRELAUNCH_metrics.txt`. A readable sample of real workouts is in `SWEAT_FINAL_PRELAUNCH_sample_pack.txt`.

**State behavior.** It is equal to or better than before on both seed sets:

- Single-State builds:
  - Main matrix: not realized 2 / 801 (was 0), coherence failures 11 / 801 (was 18).
  - Holdout: not realized 2 (was 4), coherence failures 25 (was 25).
- Multi-State builds:
  - Main matrix: coherence failures 86 / 936 (was 138).
  - Holdout: 102 (was 154).
- The remaining single-State misses are almost all beginner + Amped (see Deferred).

**Tests.** 307 pass, 3 skipped. New tests are in `tests/test_sweat_trainer_pass.py`.

Two existing tests were updated, both on purpose:

- A complement next to a "substantial" main block is now allowed when it is needed to reach the work floor.
- The 60-minute Hybrid engine-distance guard moved from 4.2 km to 5.0 km. The floor adds a round. The 7 x 800 m pathology is
  still guarded by the anchor-share and engine-time limits.

## 5. Deferred (post-launch)

- **Bodyweight-only conditioning drivers are all jumping patterns** (burpee, jump squat, jumping jack, skater hop, high knees).
  With a beginner or Low Energy, the impact ceiling caps minimal-equipment sessions at about 45-48 min for a 60-minute request.
  Fix: add 2-3 low-impact bodyweight drivers to the library.
- **Beginner + Amped can only show as volume.** The beginner hard-work budget and the 1:1 recovery rule leave Amped little room.
- **Some Low Energy beginner sessions on limited equipment use filler-type stations** (Glute Bridge, Dead Bug).
- **A fresh user's complement is predictable** (for example Goblet Squat / Push-Up / Dead Bug). It rotates from the second session
  on (recency).
- **Exercise swap "no alternative" rose from 12% to 16% of stations**, because a swap may no longer break the trainer rules.
- **Pre-existing conflicts are unchanged** (same counts as before): Engine + Low Energy on bodyweight-only equipment, and some
  Target + soreness mixes.
