# Athletic engine: FROZEN (V3, engine phase 3.4-athletic-frozen, athletic-frozen-v4)

Frozen on 2026-09-28 after the founder-approved identity pass and the final cleanup, regression QA and freeze pass. Passes that led here:
1. Rebuild (3.3 candidate).
2. Founder correction: no agility drills, more Olympic derivatives, equipment traced.
3. Composition pass (3.3 frozen, v3).
4. Identity pass: an athletic movement budget with cost tiers, no carries, muscle-ups and explicit athletic variants.
5. Final cleanup: truthful sprint and sled accounting, honest quality metadata, Low Energy strength volume.

Behaviour changes to the Athletic generator from here on require a founder decision and a new engine phase. Strength (3.0) and Sweat (3.2) source files are unchanged since base; their frozen parity tests pass.

## Rules frozen

- **Movement budget at 60 min:** athletic movements are limited by cost, not count.
  - Tier A = 3 points, B = 2, C = 1.
  - Budget: beginner 5 points, intermediate 8, advanced 10.
  - Most Tier A movements: 1 / 1 / 2. Most athletic movements: 3 / 4 / 4.
  - Low Energy: 4 points and 2 movements. Stressed: 3 simple movements. 30 min: 2 movements.
- **How many:** a target is sampled per session and the budget decides what fits. Build Strength is capped at 3 with 2 strength exercises. Nothing is added to fill time.
- **Order and dose:**
  - Highest cost first; the validator enforces the order.
  - With 3 or more athletic movements, the primary gives up a set and other elements are capped at 3 sets (4 for sprints, sled and speed-strength).
  - Impact and intent ceilings are unchanged.
- **Strength is support:**
  - 1 strength exercise by default.
  - 2 for Build Strength or when there are 2 athletic movements; with Low Energy those 2 are capped at 2 sets each.
  - No carries. Support is rare and purpose-bound.
- **Classification comes from exercise identity:**
  - `ATHLETIC` = the POWER vocabulary (59 exercises).
  - `ATHLETIC_STRENGTH` = the STRENGTH vocabulary (32).
  - `SUPPORT` (9).
  - The ATHLETIC and ATHLETIC_STRENGTH vocabularies do not overlap, and this is tested.
- **Accounting:**
  - Sprint exposures, sled efforts, jump contacts, high-impact contacts, throws, Olympic-derivative sets and explosive sets are each counted separately.
  - Sprints and sled share only the internal acceleration budget (`accel_efforts`).
- **Quality metadata:**
  - The session's qualities are distinct and in order (`athletic_qualities`, with secondary and tertiary taken from that list).
  - When two exercises train the same quality, the second is titled "Athletic Element" and the text says "more <quality>".

## Baselines

- **Composition, 60 min, no State** (`ATHLETIC_FREEZE_v4_no_state_composition.txt`, 120 sessions per level). Share of sessions with 1 / 2 / 3 / 4 athletic movements:

  | Level | 1 / 2 / 3 / 4 | Mean ATHLETIC | Mean ATHLETIC_STRENGTH |
  |---|---|---|---|
  | Beginner | 0 / 82 / 18 / 0% | 2.18 | 1.86 |
  | Intermediate | 0 / 8 / 78 / 14% | 3.07 | 1.22 |
  | Advanced | 0 / 3 / 52 / 45% | 3.42 | 1.22 |

  There are no carries. Pull-ups and rows appear in 28%, 8% and 14% of sessions.
- **Composition, full State grid:**
  - Mean athletic movements: 2.10 / 2.66 / 2.83. No session has only one athletic movement.
  - 30 min: 2 athletic + 1 strength in 96% of sessions (the rest are Low Energy days with a single athletic movement).
- **Workload** (no State, medians): explosive sets 7 / 10 / 13 (maximum 14); estimated time 36 / 43 / 49 min. Across the whole grid, the 60-minute median is 42 min.
- **Olympic derivatives** (`ATHLETIC_FREEZE_v4_olympic_frequency.txt`, no State, 120 sessions per cell):
  - Beginner: 0.
  - Intermediate: Athleticism 25%, Build Strength 28%.
  - Advanced: 21 to 37% by goal.
  - Barbell Olympic lifts only ever lead the session.
- **Broad grid** (`ATHLETIC_FREEZE_v4_final_audit.txt`: 882 builds across levels, 30 and 60 min, goals, 14 State sets and soreness). Every check came back 0:
  - power after strength
  - carries
  - strength labelled ATHLETIC
  - high impact below advanced
  - Tier A or cost over budget
  - sprint or sled accounting mismatch
  - duplicate quality metadata
  - Built for Today sprint, sled, landing or carry mismatch
  - beginner too advanced
  - 30 min over 3 exercises
  - State gate or coherence failures
- **States** (`ATHLETIC_FREEZE_v4_metrics_baseline.txt`, 1,404 sessions): Satisfaction and Coherence 100% for every State. The regression against the same-seed no-State session is in the audit file, section 5.
- **History and Swap:**
  - Different Workout: 12 of 12 changed.
  - Swap: 50 of 52 valid, 2 honest "no alternative".
  - Over 8 consecutive days: same primary exercise 0%, same primary quality 10%, exercise overlap with the previous day 2%.
- **Tests and QA:** 181 pass, 3 skipped. Unified QA all green.

## Files

Frozen modules: `engines/athletic/{athletic_core,adapter,athletic_validate}.py`, `athletic_why.py`, and the Athletic parts of `explain.py`, `render.py`, `cues.py`, `normalize.py` and `formatter.py`.

Superseded baselines are kept for history:
- the v3 composition pass: `ATHLETIC_FREEZE_metrics_baseline.txt`, `ATHLETIC_COMPOSITION_*`
- the identity candidate: `ATHLETIC_IDENTITY_*`

Open launch-prep items:
- Media for the 8 identity-pass exercises and Hang High Pull.
- The frontend dev fixture JSON still shows the old "Speed + Agility" label (display only).
