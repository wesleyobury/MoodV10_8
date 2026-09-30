# MOOD V3 Rest Audit Report

Branch `feature/mood-v3-app-rehaul`. The working tree already held a large uncommitted body of work from other passes (Strength Core, Athletic and Sweat rebuilds, Cart). This audit was done on top of it and is **not committed**, so it does not sweep that work into a commit. Guided Session was not started.

Changed files:

| Area | Files |
|---|---|
| Backend | `engines/strength/bands.py`, `engines/strength/core.py`, `engines/strength/timing.py`, `render.py`, `formatter.py`, `service.py` |
| Backend tests | `tests/test_rest_audit.py` (new), one line in `tests/test_phase2_5.py` |
| Frontend | `utils/v3Api.ts`, `utils/v3OverviewFormat.ts` |

## 1. Root cause of "Dumbbell Bench Press · 4 × 7 · Rest 3:30"

Reproduced exactly: Upper Push, 30 min, Intermediate, no State, Top Set + Back-off variant. The primary showed `4 sets: 4/7/7/7`, which is where "4 × 7" comes from, with rest **210 s = 3:30** after every set.

Cause **A** (really prescribed between every set), built from three pieces:

1. **Primary band.** The primary-compound rest band was **120 to 240 s** for every primary, whatever the load or equipment. A dumbbell press was treated like a maximal barbell lift.
2. **Variant position.** The Top Set + Back-off variant puts primary rest at position 0.9 in that band. The 30-minute rule takes off 0.2, leaving 0.7.
3. **Rounding.** 120 + 0.7 × 120 = 204, rounded to 15 s = **210**.

Not the cause:

- The frontend (D).
- Superset semantics (B).

Duration fill (C) was not needed for this case, but it inflated rest elsewhere:

- The reconciler step `duration_backfill: rest_extended` added +0.2 band position to every compound, up to 4:00. It fired in **441 of 972** 60-minute sessions and **113 of 972** 30-minute sessions.
- Low Energy's `extend_rest` repair explicitly "gave the time back as longer rests" to fill the clock. Example: Machine Preacher Curl at 2:30 in a beginner Arms session.

## 2. Rest rules: before and after

**Before:**

| Class | Band |
|---|---|
| Primary | 120 to 240 s |
| Secondary | 90 to 150 s |
| Accessory | 45 to 90 s |
| Extra | 30 to 60 s |

Beginner primary was 120 to 180 s. Rest was lengthened to hit duration. Pair rest was max(A, B) minus 15, which reached 2:15.

**After:** rest serves the stimulus. Nothing is lengthened to reach a duration.

| Class | Band | Ceiling |
|---|---|---|
| Primary, normal | 90 to 150 s | 2:00 |
| Primary at ≤ 6 reps (heavy intent: Heavy Primary, top set) | same band | 2:30 |
| Primary, heavy barbell / trap-bar squat, deadlift, bench or press family at ≤ 6 reps (not beginner) | **120 to 180 s** | 3:00 |
| Secondary | 75 to 120 s | 2:00 |
| Accessory | 45 to 90 s | 1:30 |
| Extra | 30 to 60 s | 1:00 |

A top set + back-off is judged by its heaviest set. The ceiling is re-applied after State or coherence levers change reps.

**Duration behaviour:**

- The reconciler no longer extends rest. Low Energy no longer pads rest.
- The 60-minute window moved from 50–60 to **45–60**, matching your "may finish in about 45–55" standard.
- If a structural repair (Stressed un-pairing) pushes a session past the window after reconciling, sets are trimmed back. Rest and a State's own set changes are never touched.

## 3. Strength rest distribution

1,620 workouts:

- 12 archetypes / Targets;
- 60 and 30 min;
- 3 levels;
- 9 State sets: none, Low Energy, Amped, Stressed, Bored, Irritated, LE+Stressed, Amped+Bored, Irritated+Stressed;
- 3 dates.

| Role | Before: median / max / share > 2:00 | After: median / max / share > 2:00 |
|---|---|---|
| Primary compound | 2:30 / 4:00 / **89%** | 1:45 / 3:00 / **15%** (all ≤ 6 reps) |
| Secondary compound | 2:00 / 2:30 / 29% | 1:30 / 2:00 / 0% |
| Accessory / isolation | 1:00 / 1:30 / 0% | 1:00 / 1:15 / 0% |
| Extra | 0:45 / 0:45 / 0% | 0:45 / 0:45 / 0% |
| Superset / circuit, after the pair | 1:00 / 2:15 / 4% | 1:00 / 1:15 / 0% |
| Finisher | 0:30 / 1:00 | unchanged |

Primaries at 2:00 or less went from 11% to 85%. Secondaries went from 71% to 100%. Nothing is over 3:00.

## 4. Every > 2:00 case, with verdict

**Before (Strength, 2,149 straight rows + 44 pair rests):**

| Role / source | Rows | Rest | Typical | Verdict |
|---|---|---|---|---|
| Primary, base band | 772 | 2:15–3:00 | Hack Squat, Incline DB Press, Hip Thrust at 5–7 / 6–8 | **too long** (ordinary moderate compounds) |
| Secondary, duration fill | 312 | 2:15–2:30 | Machine Row, Chest Press, Goblet Squat at 8–12 (mostly beginner, Stressed) | **too long** (filler) |
| Secondary, Stressed rest lever | 180 | 2:15–2:30 | Reverse Lunge, Dip at 8–10 | **too long** |
| Primary, Stressed lever | 133 | 2:15–3:00 | Hip Thrust, DB Bench at 5–7 | **too long** |
| Primary, duration fill | 98 | 2:30–4:00 | Incline DB Press at 6–8 | **too long** (filler) |
| Secondary, Heavy Primary / Top Set variant (± Irritated) | 256 | 2:15–2:30 | Dip, Leg Press at 8–10 | **too long** |
| Primary, Heavy Primary / Top Set (± State) | 250 | 2:30–4:00 | Barbell / DB Bench, Machine Row at 4–6 | justified intent, **too long in value** (3:45–4:00) |
| Pairs (curls, dips, raises) | 44 | 2:15 after the pair | Preacher Curl + partner | **too long** (inherited from 2:30 secondaries) |

**After (Strength, 210 rows, all primaries):**

| Case | Rows | Rest | Reps | Verdict |
|---|---|---|---|---|
| Heavy Primary, barbell / trap bar | 53 | 2:30–3:00 | 4–6 | **justified** (heavy barbell, full recovery) |
| Heavy Primary, DB / machine | 51 | 2:15–2:30 | 4–6 | **justified** (heavy low-rep intent; capped at 2:30) |
| Top Set + Back-off, barbell | 42 | 2:15–3:00 | top set 4–5 | **justified** |
| Top Set + Back-off, DB / machine / Smith | 44 | 2:15–2:30 | top set 4–6 | **justified** |
| Traditional / Paired / Efficient barbell at 4–6 (Irritated's heavier reps) | 20 | 2:15–2:30 | 4–6 | **justified** |

All of these are flagged `full_recovery` (reason `heavy`) and show as "Full recovery 2:30 min".

## 5. Athletic rests over 2:00

Sample: 486 builds, all States / levels / archetypes. All 70 cases over 2:00 are **max-intent power**:

- Consecutive / Banded Broad Jumps, Alternating Bound, Drop Jump: 2:15;
- Sled Push 10 m: 2:15;
- DB / KB Snatch, Hang Power Clean: 2:15;
- Split Jerk: 2:30–2:45;
- contrast pairs (Back Squat / Trap-Bar Deadlift 4 × 3 + jump): **2:30 after the pair**.

**Verdict: justified, kept.** No Athletic value changed.

- Athletic Strength blocks stay at 2:00 or less (90–120 s).
- Power blocks at 2:30+ are now marked `full_recovery`, reason `power`, and read "Full recovery 2:30 min".
- Contrast rows already carried no per-row rest; the pair owns it.

## 6. Sweat structural rest

| Structure | Where the rest lives | Finding |
|---|---|---|
| Circuit / Hybrid | Round rest on the block, 30–90 s by level and State | Correct level; rows carried no rest |
| Timed circuit | Work / recovery per station on the block interval, plus round rest | Correct |
| Intervals / finisher | Interval recovery (Engine 2:30 / 2:30, 2:30 / 3:10, 4:00 / 1:30, 5:00 / 1:30) | Structural 1:1 aerobic recovery, **justified**. It was duplicated on every row and on the block; rows are now null and the block owns it. |
| Pyramid | Recovery between steps | Same duplication, same fix |
| EMOM | The rest of each minute | Correct |
| Continuous | No programmed rest | Correct |

No Strength rules were applied to Sweat, and no Sweat value changed.

## 7. Superset / pair / round semantics

Before, a Strength superset repeated the pair rest on both A1 and A2 (`rest_sec` 60 on each row). The UI happened to hide it, but a player would have run two timers.

Now:

- Rows in grouped work carry `rest_sec: null`.
- The block owns one rest: `after_pair` (superset) or `after_round` (circuit).
- `transition_sec` (15 s) says how long between A1 and A2.

Cart / Details copy:

| Structure | Copy |
|---|---|
| Straight sets | `4 × 8–10 · Rest 1:30 min` |
| Heavy / power | `Full recovery 2:30 min` |
| Superset | `Superset · 3 rounds · Rest 1 min after each pair` |
| Circuit / Hybrid | `Rest 1 min between rounds` |
| Intervals / EMOM / continuous | Rest stays inside the format line (`6 × 2:30 min on / 2:30 min easy`, `EMOM · 12 min`) |

## 8. Envelope contract for Guided Session

Backward-compatible. Every block now carries `rest`:

```
rest: { kind, seconds, transition_sec, work_sec, recovery_sec, full_recovery, reason }
```

| `kind` | Timer starts | How long |
|---|---|---|
| `between_sets` | after every set of each row | that row's `prescription.rest_sec` |
| `after_pair` | after A2 (A1, then `transition_sec`, then A2) | `seconds` |
| `after_round` | after the last station | `seconds` (`transition_sec` between stations if set) |
| `interval` | each interval | `work_sec` on / `recovery_sec` easy (`seconds` = rest between rotations if any) |
| `emom` | minute clock | the rest of the minute |
| `continuous` | no rest | none |
| `self_paced` | ladder / density work | as needed |

- `full_recovery: true` (reason `heavy` or `power`) when the rest is 2:30 or more on heavy Strength or Athletic power.
- `prescription.rest_sec` now only ever means "rest after each set of this row". It is null wherever the block owns the rest, so nothing is described twice.
- The TypeScript type is `V3RestContract` in `utils/v3Api.ts`.

## 9. Representative before / after

**Your case:** Upper Push, 30 min, Intermediate, Top Set + Back-off.

| Exercise | Prescription | Before | After |
|---|---|---|---|
| Dumbbell Bench Press | 4 sets: 4/7/7/7 | 3:30 | **2:15** |
| Parallel Bar Dip | 3 × 8–10 | 2:00 | 1:30 |
| EZ-Bar Skull Crusher | 2 → 3 × 10–12 | 1:00 | 1:00 |

Estimate: 31.0 → 27.8 min.

**Upper Push, 60 min, Heavy Primary:**

| Exercise | Prescription | Before | After |
|---|---|---|---|
| Dumbbell Bench Press | 5 × 4–6 | 3:45 | **2:30, full recovery** |
| Dip | 4 × 8–10 | 2:15 | 1:45 |
| Incline Press | 4 × 8–10 | 2:15 | 1:45 |

Estimate: 58.7 → 50.7 min.

**Arms, beginner, Low Energy:**

| Exercise | Before | After |
|---|---|---|
| Machine Preacher Curl | 2:30 | 1:30 |
| Bench Dip | 2:30 | 1:30 |
| Superset | 1:15 on each row | **"Rest 1 min after each pair"** |

Estimate: 48.6 → 41.3 min. This is the honest length of the lighter session.

**Lower Squat, Stressed:**

| Exercise | Prescription | Before | After |
|---|---|---|---|
| Barbell Back Squat | 4 × 5–7 | 2:45 | 2:00 |
| Step-Up / Split Squat | | 2:00 | 1:30 |

Estimate: 51.2 → 45.9 min.

**Filler did not compensate with junk work** (same 1,944-workout grid, before → after):

- **60 min:** mean estimate 53.2 → 48.6. 78% are in 45–60 (65% in 45–55); **22% land under 45** (below).
- **Exercises:** unchanged in 1,771 of 1,944 workouts; 161 gained one optional slot.
- **Sets:** unchanged in 72%.
- **Where sets rose:** most rises (+2 to +7) are sessions whose own variant sets were previously *trimmed* because inflated rest pushed them over 60. Example: the Volume variant keeps its 4-set accessories at 56 min instead of being cut to 2 sets. That comes from dropping over-long rest, not from new filler.
- **Backfill never added a set outside the bands.**

## 10. Test results

| Suite | Result |
|---|---|
| Backend V3 tests | **267 passed**, 3 skipped. Includes frozen parity, unified production-path QA, Strength / Sweat / Athletic rebuild suites, Different Workout, State behaviour, and 10 new rest-audit tests. |
| New rest-audit tests | Class ceilings over the Strength grid; no rest-as-filler codes; your DB Bench case; heavy exception; Athletic full-recovery flags; Sweat contract; grouped rows carry no rest |
| Strength core metrics (4,470-run sample) | State satisfaction 99% (baseline 98%); explanation mismatches 0; lint 0 |
| Strength durations | 60 min no-State mean 48.2 (was 53.8); 30 min mean 27.3 (was 28.1) |
| Frontend Cart / Today / PlainLanguage / Images / BodyMap tests | 35 / 35 |
| Phase 2.6 logic suite | 273 / 0 |
| Phase 2 logic suite | 679 / 680. The one failure, `sore vocab`, predates this audit: the body-map pass changed `SORE_REGIONS`, not rest. |
| Typecheck | 86 errors, same count as before, none in touched files |
| Expo iOS export | Succeeds |

## 11. Unresolved (your call)

1. **Short 60-minute sessions.** 22% of 60-minute Strength sessions now estimate under 45 min, as low as 34. They are mostly beginner single-muscle Targets, Arms, Core and Low Energy + Stressed. Those minutes were previously rest padding. The reconciler already adds slots and sets up to the band limits before accepting. Options:
   - accept the honest length (current behaviour);
   - allow one more useful set per accessory beyond the band for those archetypes.
2. **Stale allocation log.** The Custom Target allocation log (`custom_target.allocation.sets`) is computed before duration trimming, so after a post-repair trim it can overstate sets by 1–2. This is internal only; Built for Today does not read it.
3. **Nothing committed.** The tree contains other passes' uncommitted work. Say the word and I'll commit the rest audit on its own or together.
