# MOOD V3: Guided Session handoff (pre-Guided-Session baseline)

For the agent building Guided Session. This is the contract the session player may trust. Generation, Home, Build and Cart are
frozen (see "Freeze record"); the player consumes the envelope, it does not re-plan the workout.

Source of truth for field shapes: `backend/mood_v3/CONTRACT.md`, `frontend/utils/v3Api.ts` (`V3Workout`, `V3Block`,
`V3RestContract`, `V3Prescription`). Rules for rest: `backend/mood_v3/formatter.py::rest_contract`.

## 1. What to perform, in what order

- `workout.warmup` first, then `workout.blocks` in array order (`sequence` matches), then `workout.cooldown` if present.
  "What comes next" is always the next item in the block, then the next block. Nothing else reorders work.
- Each block has `items[]`. Each item: `exercise` (id, name, equipment, primary_muscles, media), `prescription`
  (`kind`: reps | time | distance | calories; `sets`, `reps`, `reps_scheme`, `per_side`, `seconds`, `distance_m`, `calories`,
  `rir`/`rpe`, `load_guidance`, `display`), `cues`, `quality_stop` (Athletic power), `item_id` (use for swap and completion).
- Set count: `prescription.sets` on straight work; `block.rounds` on grouped work (pairs, circuits, intervals). Ladders and
  pyramids spell their steps in `reps_scheme` / `display` / `interval.steps_sec`. `reps_scheme` (e.g. `[4,7,7,7]`) is per set.
- `display` is ready to render. Never parse it for timing.

## 2. Rest (authoritative)

Every block carries `block.rest`:

```
{kind, seconds, transition_sec, work_sec, recovery_sec, full_recovery, reason}
```

| `rest.kind` | Structures | When the timer starts | How long | Row `rest_sec` |
|---|---|---|---|---|
| `between_sets` | Strength straight / pyramid / ladder / finisher; Athletic straight | after each set of the current item | that item's `prescription.rest_sec` (none after the last set of the last item) | set (the only source) |
| `after_pair` | superset (Strength pairs, Athletic strength pairs and contrast pairs) | after the last item of each round | `rest.seconds` | `null` |
| `after_round` | Sweat / Strength circuit, anchor_circuit | after the last station of each round | `rest.seconds` | `null` |
| `interval` | Sweat intervals, timed_circuit, interval finisher, pyramid | work is timed: `work_sec` on, `recovery_sec` easy; timed_circuit adds `rest.seconds` after each round; pyramid uses `block.interval.steps_sec` as the work steps with `recovery_sec` between steps | as stated | `null` |
| `emom` | Sweat EMOM | at the top of every minute | the remainder of the minute; `block.interval.minutes` total, stations cycle in item order | `null` |
| `continuous` | Sweat steady work | no rest; one timed effort of `prescription.seconds` | none | `null` |
| `self_paced` | Sweat ladder | athlete-paced; no prescribed timer | none | `null` |

Rules for the player:
- Run exactly one recovery timer at a time, taken from `block.rest` (and the row `rest_sec` only when `kind == between_sets`).
  A grouped row never carries its own rest; if a row and the block both seem to describe recovery, the block wins.
- `transition_sec` (pairs and circuits only) is the timed gap between consecutive items inside one round. It is never the
  recovery after the round. Strength supersets use 15 s (a move-over); Athletic pairs use 30 to 60 s (Athletic strength pairs)
  or 45 s (contrast pair: heavy set, then the explosive partner). Run it as its own short countdown, then the next item.
- `full_recovery: true` (with `reason` `heavy` or `power`) means label the rest "Full recovery" and let the athlete start early
  only when ready; the seconds are still the prescribed minimum-to-typical window. It is set when the longest rest in the block is
  150 s or more on Strength or Athletic power / pair blocks. Sweat is never marked full recovery.
- `prescription.rest_sec` means only the rest after one set of that individual exercise.
- Do not infer timing from `display`, `instructions` or any other string. Do not invent rest rules. Ignore the legacy block
  fields `rest_between_items_sec` / `rest_between_rounds_sec` (kept for older clients; on `between_sets` blocks they equal
  the row value, on grouped blocks they equal `transition_sec` / `seconds`).

Known copy nuance (not a timing input): some Athletic power blocks with rest under 150 s carry instruction text "Full recovery
between sets: start the next set only when you feel fresh" while `full_recovery` is false (threshold is 150 s). Show the
instruction as coaching copy; drive the timer and the "Full recovery" label from `block.rest` only.

## 3. Scaling ("Make it fit you")

- If `prescription.scaling` exists (`{kind, short, detail}`), the player may surface `short` at the set and `detail` on demand
  ("Too hard: ... Too easy: ..."). It never changes sets, reps or the effort target.
- The same `detail` sentence is already appended to `prescription.load_guidance`; show one or the other, not both.
- Present on bodyweight-adjustable Strength rows and Athletic strength rows; never on Sweat, finishers or power work.

## 4. Media

- Three cases must all work: video available, static image available, neither available.
- Video: `exercise.media` (`video_url`, `thumbnail_url`, `library_id`) or `null`. Images: `frontend/utils/v3ExerciseImages.ts`
  (`exerciseImageUrl`, `exerciseImageSource`); founder policy is static photos only, never video thumbnails as images; anything
  unmapped shows the monogram tile.
- Media availability must never gate starting, progressing or completing a workout. The founder is replacing the media library
  separately; do not build logic that depends on its coverage.

## 5. Completion (required, not implemented yet)

- Endpoint exists: `POST /api/v3/workouts/{id}/complete` with `performance[{item_id, sets[{reps, load, unit}]}]`, `fit_rating`,
  `mood_after`, `duration_actual`. 409 once already completed. There is no frontend V3 completion call yet.
- Completion is the source for: MOOD's Pick history and rotation, streaks (keep calling `POST /api/user-workouts` as today),
  exact-exercise progression, V3 history (`GET /api/v3/workouts/history`) and the Home "Done" state.
- A workout abandoned mid-session must not be recorded as complete.

## 6. Accepted launch behavior

- Duration is the time the user has available, not a quota. The Cart shows the honest estimate. About 22% of Strength sessions
  requested at 60 minutes estimate under 45 (lowest about 34), mostly beginner single-muscle Targets, Arms, Core and Low Energy +
  Stressed. Accepted: no filler sets, no extra exercises, no longer rest, no extra finishers. Revisit with real user data.
- Rest audit (approved): normal Strength work generally 2:00 or less; justified heavy low-rep Strength up to 3:00; Athletic
  power / contrast pairs may exceed 2:00 as full recovery; Sweat keeps its structure-specific work and recovery; rest is never
  lengthened to fill the clock.

## 7. Freeze record

Frozen for launch (change only if Guided Session exposes a concrete functional defect; no opportunistic improvements):
- Programming: Strength, Sweat, Athletic, State behavior, soreness routing, bodyweight scaling, Nordic dosing, Different Workout,
  rest rules and the `rest` contract.
- Product: Home, Build, Cart, body map, Home Shuffle, Strength Focus UX, Built for Today presentation, Cart Swap.

Baseline evidence (pre-Guided-Session): backend V3 269 passed / 3 skipped (legacy parity skips); unified production-path QA
9,072 builds, 0 failures; Strength metrics State satisfaction 99%, explanation mismatches 0, lint 0; Sweat metrics identical to
the Sweat freeze baseline; Athletic freeze metrics and final audit byte-identical to the Athletic v4 freeze; frontend V3 unit
tests 44/44; logic suites Phase 2 680/680 and Phase 2.6 273/273; no typecheck errors in V3 or touched files; iOS JS bundle exports.
