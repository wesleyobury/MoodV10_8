# Battle Plan QC — "I Want to Sweat" Path

_Full changelog of the quality-control pass over the 132 workouts in the Sweat path
(`cardio-workouts-data.ts` = 78, `light-weights-data.ts` = 54)._

---

## The key finding (read this first)

The `plan` objects that were added to every workout on July 3 (the change that roughly
doubled each data file's size) **are not read by the app.** The workout screens re-parse
the `battlePlan` **text string** at runtime through `parseBattlePlan()`
(`utils/battlePlanFormat.ts`), and derive the movement tiles, the rest timer, and the set
counter from that. The stored `plan` object is currently dead data.

That means what a user actually sees is driven by two things: the **`battlePlan` text**
and the **parser**. Both had defects. Fixing the stored `plan` alone would have changed
nothing for users, so this pass fixed the parser and the text, then re-synced the stored
plans so they match (the code is written to prefer `plan` when present, so a stale stored
plan would silently reintroduce every bug the day that path is wired up).

The parser is shared by **all six mood paths**, so the parser fixes below improve all
1,407 workouts, not just Sweat. The text fixes are scoped to the 132 Sweat workouts.

---

## 1. Root-cause parser fixes — `utils/battlePlanFormat.ts`

Five targeted changes. Validated by snapshotting the parser output for all 1,407 workouts
before and after: **0 regressions, 0 new errors**, and the following improvements.

**A. Dropped work intervals recovered.** A bullet like `8 rounds: 20 sec max effort` was
matched as a "rounds" header and the *entire line was discarded* — so the hardest interval
of a Tabata vanished. The parser now captures the round count **and** keeps the work.

> **Tabata Bike (before):** user saw only `easy` → `recovery`.
> **Tabata Bike (after):** `Max Effort (20 sec)` → `Easy (10 sec)` → `Recovery (2 min)`, 8 rounds.

**B. Finishers kept as real steps.** `finish with 5 min incline walk (...)` was collapsed
into a footnote on the previous movement. It's now shown as its own step.

**C. EMOM prescriptions structured.** `Odd min, 10 Dumbbell Thrusters` became the literal
tile title. It's now `Dumbbell Thrusters` × 10, labeled "Odd min".

**D. Movement names capitalized.** Fully-lowercase cardio names (`walk`, `jog`, `max effort
combos`) now display as `Walk`, `Jog`, `Max Effort Combos`. Names that already carried
capitals or acronyms (RPE, DB) are left untouched.

**E. Round count read from the Instructions line.** So that a redundant `• N rounds:`
bullet can be removed from the text without losing the set count.

**Parser impact across all 1,407 workouts:** 29 workouts had a dropped movement restored,
148 had movement names cleaned up, 2 EMOM workouts fixed, everything else byte-identical.

---

## 2. Sweat battle-plan text cleanup — `data/cardio-workouts-data.ts`, `data/light-weights-data.ts`

The raw `battlePlan` text is shown to users verbatim under the "Battle Plan" header
(`workout-session.tsx`), so the text itself was cleaned, not just the parsed view.

| Fix | Count | What it was |
|---|---|---|
| Removed dangling `• N rounds:` bullets | 58 cardio + 10 weights | A redundant, dangling `• 5 rounds:` line at the end of the list (the round count is already in the Instructions line). Read like an incomplete/broken line. |
| Stripped `N rounds:` prefix off work intervals | 3 (Tabata Bike/Elliptical/Assault) | `• 8 rounds: 20 sec max effort` → `• 20 sec max effort`. |
| Preserved round count into Instructions | 5 (KB/Med/Slam/Rope Tabata, KB Complex) | Where the Instructions didn't already state the rounds, the count was injected so removing the bullet never drops it. |
| De-duplicated doubled sentences | 1 (Waves And Slams) | `Rest 20s between moves. rest 20s between moves.` → single sentence. |
| Capitalized sentence starts | 7 | `...every sprint. follow the...` → `...Follow the...`. |
| Rebuilt garbled segments | 2 | See below. |
| Fixed Tabata round labels | 1 (Band Tabata) | `• Band squat jumps — round 1` (parsed "round 1" as reps) → clean movement names. |
| Restructured collapsed body | 1 (Hammer Tabata) | Non-bulleted lines that collapsed to one garbled tile → `• 20s strikes` / `• 10s rest`, 8 rounds. |
| Bulleted stray finisher lines | 3 (band circuits) | `Finish with stretching` → `• Finish with stretching`. |

**The two garbled segments** (the clearest "this doesn't make sense" cases):

> **Tempo & Hill Challenge** — was `• Min hill sprints — 5 × (1)` with the details dumped
> into a broken Instructions line.
> Now: `• 1 min hill sprint (8.0 mph, incline 6%) — 5 reps, 1 min walk between each`.

> **Endurance & Power (Arm Bicycle)** — was `• Sec sprint (resistance 10) with 30 sec easy — 10 × (30)`.
> Now: `• 30 sec sprint (resistance 10) — 10 reps, with 30 sec easy between each`.

_Note:_ the `× N` / `x N` notation silently disables interval parsing for the **whole**
workout (it made every other segment mis-parse too), which is why both were re-phrased
without it. This is worth keeping in mind for any future battle-plan authoring.

**Fidelity vs. the old format:** every `.ts.bak` (pre-conversion) battle plan was compared
against the new one. No exercise content was dropped — the apparent "missing" lines were
all rephrasings (`Every minute:` → the EMOM instruction; `20 m Sprint (with ball)` →
`Sprint — ~20m, with ball`; `repeat 3x` → the Instructions round count).

---

## 3. Video (tutorial) links

Tutorial videos are resolved by movement **name** (`TUTORIAL_MAP`), which is
equipment-blind. Fixed the one clear wrong-*movement* error:

- **`goblet squat` → was `kb_squat`** (a plain squat, not a goblet) **→ now `kb_goblet_squat`.**
  All 5 uses across paths are dumbbell/kettlebell, so this is a strict improvement everywhere.

**Documented limitation (not changed):** several dumbbell/kettlebell movements resolve to a
barbell demo (`Reverse Lunge` → `barbell_reverse_lunge`, `Push Press` → `barbell_push_press`,
`Alternating Snatch` → `bb_snatch`, `Deadlifts` → `barbell_deadlift`). In each case **no
dumbbell-specific video exists** in the library, so the barbell clip is a reasonable
movement demo. A couple could be improved if the app passed equipment into slug selection
(e.g. `Front Squat` → `db_front_squat` in a DB workout vs `kb_squat` in a KB workout; KB
`Alternating Snatches` → `kettlebell_snatch`). The data for this already exists in
`TUTORIAL_CANDIDATES` — see recommendations.

---

## 4. Stored `plan` objects re-synced

All 132 Sweat stored `plan` objects were regenerated from the corrected parser so they
match runtime exactly (verified: 0 content differences). Movement keys are serialized
alphabetically to match the original file style and keep the diff to real content changes.

---

## Verification

- Parser output snapshotted for **all 1,407 workouts** before/after — **0 regressions** on
  the 1,275 non-Sweat workouts, **0 parse errors** anywhere.
- Final Sweat defect sweep: **0** dangling round bullets, **0** garbled segments, **0**
  lowercase tiles, **0** round-labels-as-reps, **0** stray non-bulleted body lines.
- Stored `plan` == runtime parse for all 132 (content).
- All 21 data files load; `tsc --noEmit` clean on the changed files.
- 88 of 132 Sweat workouts improved (13 with a recovered movement, 63 with cleaner names,
  plus the text fixes above).

---

## Files changed

- `frontend/utils/battlePlanFormat.ts` — parser fixes (A–E)
- `frontend/utils/tutorialMap.ts` — `goblet squat` → `kb_goblet_squat`
- `frontend/data/cardio-workouts-data.ts` — text cleanup + re-synced plans (78 workouts)
- `frontend/data/light-weights-data.ts` — text cleanup + re-synced plans (54 workouts)

The `.ts.bak` files (old format) were left in place as reference.

---

## Recommendations / follow-ups

1. **Apply the same pass to the other five paths (1,275 workouts).** The parser fix already
   benefits them, but their battle-plan **text** hasn't been cleaned. The same audit tooling
   applies directly — the biggest wins will be the same dropped-interval and dangling-round
   patterns.
2. **Decide whether to actually use the stored `plan`.** Right now it's regenerated at
   runtime every render. If you wire the screens to read `plan`, the stored objects are now
   correct and ready. If you don't intend to, they can be dropped to shrink the files.
3. **Equipment-aware video selection.** Thread the workout's equipment into slug resolution
   and pick from `TUTORIAL_CANDIDATES` so DB workouts show DB demos where they exist.
4. **Authoring guideline:** avoid `× N` / `x N` inside a battle plan line — it disables
   interval parsing for the whole workout. Write "N reps" or put the count in Instructions.
