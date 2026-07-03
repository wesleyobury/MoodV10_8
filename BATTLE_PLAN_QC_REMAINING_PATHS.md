# Battle Plan QC — Remaining 4 Paths + "Rounds → Sets" Normalization

_Covers Explosive, Calisthenics, Get Outside, and Lazy (396 workouts), plus the
single-exercise "N rounds" → "N sets" normalization you approved for Muscle Gainer and the
other paths. With this, **all 1,407 workouts across all six paths have been QC'd.**_

---

## 1. "N rounds" → "N sets" normalization

You approved normalizing single-exercise workouts (where "rounds" really means "sets").

- **Parser tweak** (`utils/battlePlanFormat.ts`): the parser now reads a standalone "N sets"
  line as the set count (previously only "N rounds" worked). Validated across all 1,407 — the
  only side effect was a bonus fix: 14 Lazy workouts that said "1 set" had been rendering a
  phantom "×1" tile, which is now gone.
- **Muscle Gainer:** 449 single-exercise workouts changed from "N rounds" → "N sets". The 80
  multi-exercise circuits kept "rounds" (correct).
- **Other paths:** 122 more single-exercise workouts normalized (mostly Explosive plyometrics
  like "Box Jump Repeats," where "sets" is the correct term). Multi-exercise circuits kept
  "rounds."

A distinct-exercise classifier decided single vs. multi (supersets/circuits have 2+ named
exercises; ladders and drop-sets of one movement count as single). 0 set-count changes
resulted — only the wording.

---

## 2. Explosive path (120 workouts)

Same defect as Muscle Gainer: the conversion stripped the movement bullet out of **9 advanced
cluster/ladder workouts**, leaving empty bodies (e.g. "Clean Pull Cluster," "DB Jump Squat
Clusters," "Split Jerk Ladder"). Restored the movement bullet from the old format while keeping
the improved coaching Instructions, so each again shows its scheme (e.g. `• Cluster: 2 + 2
Clean Pulls (moderate–heavy)`). No other defects found.

---

## 3. Calisthenics path (69 workouts)

**Clean — no fixes needed.** This path uses a different but valid format (exercise name on one
line, the sets/reps prescription on the next), which parses correctly to named tiles with reps
(e.g. "Ring Support Lean ×15–25s"). Stored plans were refreshed to match the corrected parser.

---

## 4. Get Outside path (60 workouts)

- **9 garbled interval lines** (swim & bike) fixed — the same `× (N)` corruption seen
  elsewhere. Example: swim `• Freestyle, 30–45s rest — 10 × (25)` → `• Freestyle — 10 × 25
  (30–45s rest)`; bike `• Min moderate + 2 min easy — 3 × (3)` → `• Intervals — 3 × (3 min
  moderate + 2 min easy)`.
- **Lowercase names** capitalized (swim "easy Freestyle" cooldowns; hill drills "uphill side
  shuffle" → "Uphill Side Shuffle").
- The pace-based tiles ("Easy," "Tempo," "Threshold") were left as-is — those are valid
  running/cycling segment names, same as the Sweat cardio format.

---

## 5. Lazy path (147 workouts)

- **1 empty body** ("Incline Switch-Ups") restored with a named "Treadmill Walk" movement.
- **13 machine-cardio tiles** that started with a bare qualifier (`@ 5–6%`, `@ 18 spm`,
  `@ RPE 5 → …`) were given their modality so the tile is clear: `Walk @ 5–6%`, `Row @ 18 spm`,
  `Spin @ RPE 5 → 1 min Easy`.
- The "1 set" phantom tiles were removed by the parser tweak (above).

---

## Verification (all six paths)

- **Stored `plan` == runtime parse for all 1,407 workouts** (0 mismatches).
- Final defect sweep across all 21 data files: **0 garbles, 0 empty bodies, 0 lowercase tiles.**
- `tsc --noEmit` clean on the parser and all changed data files.
- The parser change was validated across all 1,407 — no unintended reparses beyond the 14
  intended Lazy fixes.

---

## Files changed (this pass)

- `frontend/utils/battlePlanFormat.ts` — "N sets" header support
- `frontend/data/bodyweight-explosiveness-data.ts`, `explosiveness-weights-data.ts`,
  `calisthenics-all-workouts-data.ts`, `outdoor-workouts-data.ts`,
  `lazy-bodyweight-data.ts`, `lazy-full-body-data.ts`, `lazy-lower-body-data.ts`,
  `lazy-upper-body-data.ts` — text fixes + re-synced plans
- The 11 muscle-group files — normalization + re-synced plans

`.ts.bak` (old format) files left in place as reference.

---

## Where things stand

All six paths (Sweat, Muscle Gainer, Explosive, Calisthenics, Get Outside, Lazy — 1,407
workouts) have been reviewed and fixed. Every workout now parses to named movement tiles with a
visible prescription, no dropped content versus the old format, and consistent "sets"/"rounds"
terminology. See the two prior changelogs (`SWEAT_BATTLE_PLAN_QC.md`,
`MUSCLE_GAINER_BATTLE_PLAN_QC.md`) for those paths.
