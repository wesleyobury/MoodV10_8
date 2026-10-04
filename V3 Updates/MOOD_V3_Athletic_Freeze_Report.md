# MOOD V3 Athletic: Founder Correction Pass and Freeze

Athletic is frozen: `ENGINE_PHASE = '3.3-athletic-frozen'`, `ENGINE_VERSION = '... | athletic-frozen-v2 (...; no agility drills; Olympic derivatives)'`. Strength and Sweat were not touched (their frozen parity tests still reproduce the frozen results exactly). Tests `180 passed, 3 skipped`, unified QA green with 0 failures. Nothing committed. Cart not started.

Companion files: `V3 Updates/MOOD_V3_Athletic_Founder_Review_Pack.md` / `.xlsx` (30 production-path sessions focused on this pass). Freeze record and baselines in `backend/mood_v3/qa/results/`: `ATHLETIC_FREEZE.md`, `ATHLETIC_FREEZE_metrics_baseline.txt`, `ATHLETIC_FREEZE_olympic_frequency.txt`, `ATHLETIC_FREEZE_workload_before_founder_pass.txt`, `ATHLETIC_FREEZE_trainer_read_sample.txt`.

## 1. Agility and footwork drills removed

- Removed from Athletic generation: Acceleration to Stick, Backpedal to Stick, Lateral Shuffle to Stick, 5-5 Shuttle (work items), and Lateral Shuffle to Stick and Line Hops (warm-up primers). No replacement drills were added.
- The change-of-direction quality and the Agility + Strength structure no longer exist. Every reference is gone: qualities, structures, State weights and dials (`allow_cod`), history, the validator, accounting (`cod_exposures`), Swap groups, Built for Today, render labels, cues added in the last pass, QA and tests.
- Kept as legitimate lateral athletic exercises, now under horizontal power: Skater Hops, Lateral Box Jump, Banded Lateral Bound, Lateral Single-Leg Hop, Lateral Bound to Box Jump. Lateral single-leg strength (lateral lunge, lateral step-up) and rotational throws stay.
- Athletic now has five structures: Power + Strength, Speed + Strength, Jump + Throw, Contrast Pairing and Athletic Mixed. The seven qualities are acceleration, vertical, horizontal (including lateral), rotational, upper-body and total-body power, and elastic / reactive ability.
- The Speed + Agility session type keeps its id and name (they are in the app's picker). It now means acceleration, bounding and reactive jumps, and on a bodyweight-only setup it can fall back to a bounding day.
- Sprint warm-up keeps A-March / A-Skip / Wall Drill as preparation before sprinting (standard sprint mechanics, not agility drills). Tell me if you want those gone too.
- Checked across 1,404 production-path sessions: 0 contain a drill in the work or the warm-up. A test fails if one returns.

## 2. Olympic derivatives

Library audit: the barbell derivatives already there are Hang Power Clean, Power Snatch and Split Jerk (advanced) and Push Press (intermediate). The dumbbell and kettlebell derivatives are DB Hang Power Clean, KB Snatch, Hang Clean to Box Knee Drive (intermediate) and DB Snatch (advanced). Missing were a barbell derivative an intermediate can own and anything without a catch. Added exactly one: **Hang High Pull** (intermediate, barbell, 4 × 3, 120 s rest). It needs a media check. Hang Clean, Power Clean, Hang Snatch, pulls and Push Jerk were not added; the existing set covers the need.

Rules: beginners never get one. Low Energy never gets one, and neither do Low Energy combinations. Stressed never gets one through its complexity cap. Amped is not an automatic trigger. Olympic work only ever appears as the primary or secondary quality (fresh), at 2 to 3 reps with 120 to 150 s rest. It replaces another power choice and is never added on top. Weighting favours Build Strength and Athleticism, and advanced over intermediate.

Share of no-State sessions containing an Olympic derivative (120 sessions per cell, 30 and 60 min; previous pass in brackets; "barbell" counts barbell lifts only):

| | Athleticism | Build Strength | Build Muscle | Stay Consistent | Conditioning | Feel Better |
|---|---|---|---|---|---|---|
| Advanced | 29% (12%) · barbell 29% (7%) | 42% (22%) · barbell 42% (11%) | 25% (17%) | 23% (14%) | 20% (12%) | 15% (8%) |
| Intermediate | 16% (4%) · barbell 16% (1%) | 32% (6%) · barbell 32% (2%) | 2% | 3% | 3% | 2% |
| Beginner | 0% | 0% | 0% | 0% | 0% | 0% |

Blended over the full freeze grid (every goal and State, including the Low Energy and Stressed combinations that exclude Olympic work), the rate is intermediate 5% and advanced 7%; the table above is the like-for-like comparison with the earlier 3 to 5% figure.

By structure (intermediate + advanced, all States): Power + Strength 8%, Athletic Mixed 20%. Speed + Strength, Jump + Throw and Contrast Pairing have none, by design, because their primary is a sprint, jump or contrast pair. By State: none 15%, Amped 29%, Bored 17%, Irritated 4%, and Low Energy, Stressed and all their pairs 0%. Across the grid: 0 sessions where an Olympic lift sits outside the primary or secondary block, 0 doses outside the rules, and no session with more than 2 explosive exercises.

Pack examples:
- **Intermediate:** Hang High Pull in O1 (Build Strength, 60), O2 (Athleticism) and O3 (30 min).
- **Advanced:** Hang Power Clean (O4, no State, Build Strength), Power Snatch (O5, Athleticism), Split Jerk (O6 Amped, O7, O8 Build Muscle).
- **Eligible but not selected:** O9 (Consecutive Broad Jumps instead).

## 3. Equipment: where it comes from

1. **Before (as reported):** the last pass treated three presets (commercial gym, free weights, minimal) as if they were user inputs. QA, metrics and my report were split by equipment, and I changed the Athletic mapping of the minimal preset.
2. **Real production behaviour:**
   - No launch screen asks for equipment, and the app's generate request omits it (`frontend/utils/v3Api.ts`: "Profile fields (goal, experience, frequency, equipment) are omitted on purpose").
   - The server fills it from `training_profile.default_equipment`. Onboarding never sets that field, and the profile API defaults it to `commercial_gym`; so does the route when there is no profile.
   - The only place the app itself could send equipment is the "Use full gym equipment" conflict option. It only appears when the preset is not a commercial gym, so it can't be reached.
   - Result: **every real user is generated for a commercial gym**. The other presets are only reachable by calling the API directly (QA, future features).
3. **What changed:**
   - Nothing in the request path. The generator keeps equipment as a compatibility constraint only: availability, swaps, validation.
   - QA, metrics, the trainer read and the pack now use the commercial gym only, and no report treats equipment as personalization.
   - Built for Today mentions equipment only if one is actually sent, which never happens in the app.
   - The `minimal → athletic_minimal` mapping from the last pass stays. It is API-only and matches the preset's own definition (dumbbells + bench); with the older bodyweight-only mapping, some Low Energy combinations could not be built at all.
   - The contract now documents the production equipment context.
4. **Strength / Sweat:** not affected and not changed. Their API accepts the same presets and production sends them the same commercial default, so they have the same "phantom preset in QA" situation. Their generators are correct for real users. I'm reporting it, not touching it.

## 4. Target stays hidden

No frontend change: `targetSupported()` still returns false for Athletic. The backend's Athletic Target handling is left as is (harmless, unreachable from the app), and no time went into it.

## 5. Nothing that worked was changed

Fresh power, rest rules, the impact / intent budget, the 2-explosive-exercise cap, strength support, State ownership, Satisfaction and Coherence, soreness, history, Different Workout, Swap, rare finishers, duration as a window and the exercise-count limits are all unchanged.

Two small rules were added:
- A secondary quality may not repeat the primary's movement pattern. This stopped Split Jerk being followed by Landmine Split Jerk.
- The Hang High Pull dose.

Workload is unchanged. Medians before this pass → after it, same seeds and grid:

| Level, 60 min | Explosive sets | Contacts | Strength sets | Estimated minutes |
|---|---|---|---|---|
| Beginner | 4 → 4 | 9 → 9 | 6 → 6 | 36 → 36 |
| Intermediate | 5 → 5 | 9 → 9 | 6 → 6 | 42 → 42 |
| Advanced | 6 → 6 | 12 → 12 | 6 → 6 | 47 → 47 |

The 30-minute medians did not change either.

## 6. QA

- **State Satisfaction and Coherence:** 100% for every State across 1,404 commercial-gym sessions.
- **Different Workout:** 12 of 12 runs changed both the primary quality and the primary exercise.
- **Swap Exercise:** 57 of 57 valid, including Hang Power Clean → Hang High Pull.
- **Soreness:** sore legs moves the session to upper-body power (X1); sore shoulders keeps power in the lower body with nothing pressed or thrown overhead (X2); lower back unchanged.
- **Tests:** new tests cover no drills, no dead change-of-direction paths, Olympic frequency bands, no beginner or Low Energy Olympic lifts, and Olympic lifts only in fresh blocks with a valid dose.

## 7. Human trainer read

I read 30 random production sessions: all levels, goals and States, commercial gym.
- One was a correct conflict (Speed + Agility with sore legs).
- The other 29 read as gym workouts, not drill sessions. Each has a clear quality and does its power work first, with reasonable workload.
- The one Olympic lift in the sample (T29, intermediate Hang High Pull 4 × 3) suited the user.
- I would give all 29 as written.

The pack's Olympic cases read the same way. No systemic problems remain.

## 8. Freeze standard

1. Drills gone: yes (0 of 1,404).
2. Change of direction no longer expressed through drills: the quality was removed.
3. Olympic representation: advanced 15–42% by goal, intermediate 16–32% for performance goals.
4. Beginners: 0%.
5. Low-rep, fresh, fully recovered: validator and QA, 0 violations.
6. Workload: unchanged.
7. Equipment: matches the app (commercial gym only).
8. Target: hidden.
9. States coherent: 100%.
10. No-State sessions good: A1 to A5.
11. Soreness safe: X1, X2.
12. Different Workout and Swap work.
13. A trainer would assign the workouts: section 7.
14. No systemic launch blocker.

**Athletic is frozen. Stopping here.**
