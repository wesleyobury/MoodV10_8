# MOOD V3 Guided Session: Phase Zero architecture report

Baseline: `bfc9974c01425f52d4e47f7345f5006db665a963` (verified). Inputs: `V3 Updates/MOOD_V3_Guided_Session_Handoff.md`, `backend/mood_v3/CONTRACT.md`, `formatter.py::rest_contract`, `frontend/utils/v3Api.ts`, the V2 player code, and about 18,000 envelopes generated offline through the production path (`service.generate_workout`, plus `swap_workout` on every fifth): Strength 5,981, Sweat 5,764, Athletic 6,000, zero exceptions. No repo files were changed.

**Headline:** the finalized envelope plus the `rest` contract compiles deterministically into a Guided Session. One small upstream defect (Sweat timed circuits, 7% of them) and one backend gap (completion is not idempotent and does not drive streaks) need fixing. Everything else is frontend work.

---

## 1. Existing session audit

| File / component | What it is | Verdict |
|---|---|---|
| `app/v3/session.tsx` (84 lines) | Placeholder. Reads `id`, looks only in the local today-cache, lists exercises, completes nothing | **Replace.** Keep the route and the `id` param |
| `app/v3/workout.tsx` (Cart) | Start → `router.push('/v3/session', {id})`; tracks `v3_start_workout_tapped`; cache-then-server load with a version guard (L90-117) | **Reuse as-is.** Copy its load pattern into the session |
| `utils/v3Api.ts` | Types plus generate / get / swap / version | **Reuse, extend** with `completeV3Workout` |
| `utils/v3Today.ts`, `v3TodayModel.ts` | Per-user, per-day cache of workout ids and the latest envelope | **Reuse as-is.** Nothing records started or completed |
| `components/v3/V3Home.tsx` | `HeroMode = 'build' \| 'today' \| 'continue' \| 'done'`; only build and today are ever produced (L181-183) | **The extension point.** See section 8 |
| `components/v3/ExerciseSheet.tsx`, `ExerciseThumb.tsx`, `utils/v3ExerciseImages.ts` | Details sheet (cues, load guidance, quality stop, progression), static photo or monogram tile | **Reuse as-is** for in-session details |
| `components/ExerciseLookupSheet.tsx` | Demo video player on expo-av | **Reuse conceptually.** expo-av is deprecated |
| `components/SmartVideoPlayer.tsx` | expo-video player, HLS with MP4 fallback, pauses on background | **Reuse conceptually** if inline video is ever needed |
| `app/workout-guidance.tsx` (2,179 lines, live V2) | One pushed screen per exercise; `setInterval(prev => prev - 1)` rest countdown; auto-fills sets and **auto-completes the workout** when the timer runs out; non-idempotent completion with no in-flight guard | **Dangerous to reuse.** Do not borrow its timer, advance chain or completion |
| `app/workout-session.tsx` (1,252 lines) | Unreachable old stepper. Timestamp-based timing, abandon / background analytics, HealthKit HR stream | **Reuse conceptually** (timestamps, analytics shape). Do not revive: it starts HealthKit queries and analytics on mount |
| `utils/workoutStartGate.ts` | Paywall gate (`POST /api/workouts/start`) | **Reusable, but V3 never calls it.** See founder decision F4 |
| `utils/markWorkoutCompleted.ts`, `InSessionProgressBar`, `inSessionProgress.ts`, `CartContext`, `DraftsContext` | V2 snapshots, V2 progress strip, V2 cart | **Obsolete / V2-specific** |
| `utils/workoutSessionStorage.ts` | Last 20 finished sessions with HR samples | **Reuse conceptually.** Post-workout history, not in-progress state |
| `utils/heartRateZones.ts`, `SessionSafetyBanner.tsx`, `ratingPrompt.ts` | HR stats; "listen to your body" banner; review-prompt counter | **Reuse as-is.** Wire `recordWorkoutCompletionForRating` on completion |
| `utils/analytics.ts` (`trackEvent`) | Batched `POST /api/analytics/track` | **Reuse as-is** |
| `modules/mood-healthkit` | Read-only HealthKit / Health Connect: snapshot, session metrics, HR stream (only sees samples another device writes) | **Post-launch.** No HKWorkoutSession, nothing writes a workout |

**Missing entirely:** in-progress persistence (none in V2 or V3), a timestamp timer engine, a V3 completion call, V3 session analytics, a leave guard on the session route (iOS swipe-back is currently live), keep-awake.

**Relevant packages:** expo ~54, RN 0.81.5, expo-router ~6, expo-haptics (installed, used), expo-notifications (installed), expo-video (installed), AsyncStorage (installed). `expo-keep-awake` ships inside `expo` but is not a declared dependency; declare it. Not installed: expo-audio, expo-task-manager, any background mode.

---

## 2. V3 structure matrix

### Block structures actually produced (counts across ~18k envelopes)

| Direction | type / structure | rest.kind | blocks | items |
|---|---|---|---|---|
| Strength | main / secondary / accessory · straight | between_sets | 21,826 | 1 |
| | accessory / secondary · superset | after_pair | 1,503 | 2 |
| | finisher · finisher | between_sets | 458 | 1 |
| | accessory / secondary · ladder, pyramid | between_sets | 198 | 1 |
| Sweat | primary / complement · circuit | after_round | 2,431 | 2-4 |
| | primary · anchor_circuit (Hybrid) | after_round | 1,281 | 3-5 |
| | primary / complement · intervals | interval | 1,257 | 1 |
| | primary · timed_circuit | interval | 590 | 3-4 |
| | primary / complement · continuous | continuous | 984 | 1 |
| | primary · pyramid | interval | 190 | 1 |
| | primary · emom | emom | 159 | 3-4 |
| | complement · ladder | self_paced | 59 | 2 |
| | finisher · finisher | interval | 34 | 1 |
| Athletic | primary / secondary / strength / support / finisher · straight | between_sets | 17,459 | 1 |
| | strength · superset (Athletic Strength pair) | after_pair | 1,878 | 2 |
| | primary · superset (contrast pair) | after_pair | 160 | 2 |

Strength variants (Traditional, Heavy Primary, Volume, Paired, Efficient, Top Set + Back-off) are **not** block types. They are combinations of the rows above. Top Set + Back-off is signalled only by `reps_scheme` on the main row (e.g. `[4,7,7,7]`). Declared but never produced: Strength circuit, Sweat primary ladder, alternating intervals.

### Execution semantics

| rest.kind | Unit of progression | Step completes when | Rest / transition | Advanced by | Progress label |
|---|---|---|---|---|---|
| **between_sets** | set | user taps Complete (time holds: countdown ends) | row `rest_sec` after each set; none after the last set of the block | user; rest timed | Set 2 of 4 (target = `reps_scheme[set]` when present) |
| **after_pair** | round of A1 + A2 | user taps each | `transition_sec` A1 → A2 (15 s Strength, 30-60 s Athletic Strength, 45 s contrast); `seconds` after A2; none after the final round | user; transition and rest timed | Round 2 of 4 · A1 / A2 |
| **after_round** | round of stations | user taps each station (time stations: countdown) | `seconds` after the last station of each non-final round; `transition_sec` is always null for circuits | user; round rest timed | Round 2 of 4 · Station 3 of 5 |
| after_round (anchor) | round = anchor + that round's stations (`direction_fields.rounds`) | same | same | same | Round 2 of 4 · Anchor / Station 2 of 3 |
| **interval** (intervals, finisher) | work bout | clock | `recovery_sec` between bouts, none after the last | clock | Interval 5 of 8 · WORK / EASY |
| **interval** (timed_circuit) | station bout | clock | `recovery_sec` after each station; round end adds `seconds` (engine time accounting stacks both) | clock | Round 2 of 5 · Station 3 of 4 |
| **interval** (pyramid) | step of `interval.steps_sec` | clock | `recovery_sec` between steps | clock | Step 3 of 8 |
| **emom** | minute | clock (minute boundary). Tapping Done early shows "rest until next minute" | remainder of the minute | clock | Minute 7 of 24 · Station 3 |
| **continuous** | one effort of `prescription.seconds` | clock | none | clock | 6:12 of 16:00 |
| **self_paced** (ladder) | rung × item | user taps | none prescribed | user | Rung 3 of 5 · 8 reps |

Other fields the player uses: `quality_stop` (Athletic power items only), `prescription.scaling` (Strength and Athletic strength rows only), `per_side` (all Directions, including per-side time holds and carries), `full_recovery` + `reason` (901 heavy Strength mains, 50 Athletic power blocks, contrast pairs, and 129 Athletic strength pairs where `reason` is null).

**Warm-up:** always `{minutes, items, guidance}`. Strength and Sweat have `items: []` (guidance text only). Athletic has 3-6 items of `{component_label, exercise, name, prescription_text}` with free-text doses. **Cool-down:** Strength always null; Sweat `{minutes, guidance}`; Athletic `{minutes: 3, guidance}` at 60 min, null at 30 min. No cool-down has items.

### Is the envelope sufficient? Yes, with one fix

An invariant script over all envelopes found **zero** violations for: missing or unknown `rest.kind`, missing value fields, `reps_scheme` length ≠ sets, `between_sets` rows without `rest_sec`, grouped blocks without rounds or `rest.seconds`, grouped rows carrying their own `rest_sec`, superset ≠ 2 items, interval blocks missing `work_sec` / `recovery_sec`, non-time items in interval blocks, EMOM minutes ≠ rounds × stations, anchor ordering, pyramid sum mismatches, ladders without schemes.

**Upstream defect D1 (frozen Sweat, concrete):** in 40 of 590 timed circuits the block says `work_sec: 45` while every station says `seconds: 40` / "40 s". Cause: the `bouts_longer` State rule (`engines/sweat/sweat_core.py` ~L852-854) raises `interval_target.work` to 45 but does not update `b['doses']`, which `render.py` uses for item seconds. The engine's time budget uses 45. The player will drive the clock from `block.rest.work_sec` (the contract says so), so the workout is executable, but the screen would show "40 s" next to a 45 s timer. **Smallest fix:** in that branch, set each timed dose to the new work value (a one-line change). The player also renders timed-circuit bout length from `rest.work_sec`, never from the item. Needs founder approval because Sweat is frozen (F1).

**Not defects (handled in the player, no schema change):**
- Hybrid anchor per-round doses (95 blocks) are an array of per-round display strings in `direction_fields.round_doses`; index by round, no parsing.
- Hybrid "setup first N min" (477 blocks) exists only in `instructions`; show it on the block's Ready card.
- Set methods (cluster, drop set, rest-pause, 1½ reps, pause, slow eccentric) are coaching text in `load_guidance`; show as the cue. No extra timers at launch.
- Strength time/distance ranges resolve to one number (time takes the top of the range, distance the bottom). Display the range, time the number.
- Athletic power copy says "Full recovery" while `full_recovery` is false (5,790 blocks, rest 60-135 s). Per handoff: coaching copy only; label and timer come from `block.rest`.

**Documentation fix:** the handoff says `/complete` returns 409 when already completed. It returns **200** `{"message": "Already completed"}`. 409 is swap-after-complete. `v3Api.ts` maps 409 to "completed", which will never fire for completion.

---

## 3. Recommended player architecture

**Yes to a normalized Session Plan.** Implement:

```
V3 envelope ──compile()──▶ SessionPlan (pure, deterministic, versioned)
                               │
SessionState (tiny, persisted) ┼──resolve(plan, state, now)──▶ current step + timer view
                               │
Player UI renders by step.type (+ section.structure for layout variants)
```

Why this and not direct rendering of the envelope:
- **One engine for all three Directions.** Every structure reduces to two kinds of step: *user-advanced* (sets, stations, rungs) and *timer-advanced* (rest, transition, work bouts, recovery, EMOM minutes, continuous). The engine never branches on Direction; only the compiler knows `rest.kind`.
- **No flattening of semantics.** Steps are ordered linearly, but every step carries its parent refs (section → round → item → set / side / phase) and a pre-computed label, so pairs, rounds and circuits remain explicit.
- **Rest correctness becomes a compile-time invariant.** Duplicate rest, rest after the wrong movement, or skipped recovery can be tested once, against all 18k generated envelopes, before any UI exists.
- **Persistence is trivial.** Because compilation is deterministic, the saved state is a cursor plus timestamps, not a copy of the plan.
- **Backgrounding is correct by construction.** A timer step's remaining time is `endsAt - now`. On resume, `resolve()` walks forward through any timer steps that ended while the app was away, and stops at the next user-advanced step.

The generator describes the workout. The Session Plan describes how to walk it. SessionState describes where the user is. No generator schema changes.

---

## 4. Session-plan model (conceptual)

```ts
SessionPlan {
  compilerVersion: 1
  workoutId, workoutVersion, fingerprint   // hash of step ids; detects stale saved state
  direction
  sections: Section[]                      // warmup, each block, cooldown
  steps: Step[]                            // ordered; every step points to its section
}

Section {
  id, kind: 'warmup' | 'block' | 'cooldown'
  label: 'Block 2 of 4', title, structure, rest: V3RestContract
  rounds, items, instructions
  estSec                                   // for progress-bar proportions only
}

Step {
  id: 'b2:r3:i1:s1:work'                   // stable, deterministic
  section, round?, itemIndex?, set?, side?
  type: 'ready'        // block start card; user taps Start (always before clock blocks)
      | 'work'         // a set / station / rung; user taps Complete
      | 'timed_work'   // interval bout, pyramid step, timed-circuit station, continuous
      | 'emom_minute'  // 60 s, station = items[(m-1) % n]
      | 'transition'   // transition_sec between items inside a round
      | 'rest'         // between_sets / after_pair / after_round rest
      | 'recovery'     // interval recovery (incl. timed-circuit round rest)
      | 'checklist'    // warm-up / cool-down
      | 'finish'
  advance: 'user' | 'timer'
  durationSec?                             // timer steps; also manual-start holds on work steps
  timerStart?: 'auto' | 'manual'           // time holds inside user-paced blocks start on tap
  target: { kind, value, reps?, seconds?, distance_m?, calories?, perSide? }
  labels: { position: 'Set 2 of 4', group?: 'Round 2 of 4 · Station 3 of 5', phase?: 'WORK' }
  rest?: { fullRecovery, reason, source: 'set' | 'pair' | 'round' | 'interval' }
  countsAsWork: boolean                    // for completion guard and progress
}
```

**Compiler rules** (one function per `rest.kind`, each small):
- `between_sets`: for each item, for each set: `work` (time items get a manual-start timer; per-side time → two timed halves with "Switch sides"); then `rest(row.rest_sec)` unless this is the last set of the last item.
- `after_pair`: per round: `work(A1)` → `transition(transition_sec)` if > 0 → `work(A2)` → `rest(rest.seconds)` unless final round.
- `after_round`: per round: stations in item order (anchor first; anchor-circuit stations only in rounds listed in `direction_fields.rounds`), `transition` if `transition_sec` present → `rest(rest.seconds)` unless final round.
- `interval` single item: `ready` → rounds × `timed_work(work_sec)` with `recovery(recovery_sec)` between (none after the last).
- `interval` timed_circuit: `ready` → per round, per station `timed_work(rest.work_sec)`; after each station `recovery(recovery_sec)`, which at round end becomes one "Round rest" of `recovery_sec + rest.seconds`; nothing after the final station.
- `interval` pyramid: `ready` → `timed_work(steps_sec[k])` with `recovery(recovery_sec)` between.
- `emom`: `ready` → `interval.minutes` × `emom_minute`.
- `continuous`: `ready` → one `timed_work(prescription.seconds)`.
- `self_paced`: per rung of `reps_scheme`, per item: `work(scheme[rung])`.
- Warm-up / cool-down: one `checklist` step each when present (see 11).
- Between blocks: user-paced blocks flow straight into their first `work` step (with a "New exercise" header and a small "since last set" count-up so the athlete can breathe without a fake timer). Clock blocks always get a `ready` step so the clock never starts without the athlete.

**Controller responsibilities:**
- `compile(envelope)`: pure; unit-tested; no React.
- `sessionReducer(state, action, now)`: `complete`, `skipStep`, `skipExercise`, `skipBlock`, `back`, `pause`, `resume`, `addTime(15|30)`, `startManualTimer`. Pure; unit-tested.
- `resolve(plan, state, now)`: catch-up through elapsed timer steps; returns the current step, remaining ms, and next-step preview.
- `useSessionClock()`: re-renders ~4× per second while a timer is visible; never stores time.
- `sessionStore`: load / save / clear of SessionState in AsyncStorage on every transition (not on ticks).

---

## 5. Screen flow (text wireframes)

Shared frame on every state: top bar (✕ exit, block label, pause), thin segmented progress bar (one segment per block, width ∝ estimated time), workout elapsed time. Bottom: one dominant action + "Up next" line. Screen stays awake.

**Exercise (user-paced set)**
```
 ✕   Block 2 of 4 · Strength                     ⏸
 ▬▬▬▬▬▬▬▬▬▬░░░░░░░░░░░░░░░░░░░              18:42
 ┌─────────────────────────────────────────────┐
 │        [photo, or compact monogram]          │   ~30% height; collapses if none
 └─────────────────────────────────────────────┘
  BARBELL ROMANIAN DEADLIFT                (i)     (i) opens ExerciseSheet
  Set 2 of 4
  7 reps                                           huge type
  About 2 reps left in the tank
  "Push hips back, bar close to the legs"          one cue
  ⤷ Make it fit you: Scale assistance or load      only when prescription.scaling
 ─────────────────────────────────────────────────
  [              Complete set              ]
  Next: Full recovery 2:30, then Set 3
```

**Rest**
```
  REST                         (FULL RECOVERY when full_recovery)
            1:47
  ────────────── ring / bar ──────────────
  Next: Set 3 of 4 · Romanian Deadlift · 7 reps
  [ +15s ]                    [ Skip rest ]
  (full recovery shows "Start when you feel fresh" and the primary button reads Start now)
```

**Transition (superset / contrast)**
```
  MOVE TO
  Countermovement Jump               0:38
  Round 2 of 4 · A2
  "End the set when jump height drops…"            quality stop preview
  [ I'm ready ]
```

**Circuit station**
```
  Round 2 of 4 · Station 3 of 5
  ● ● ◉ ○ ○                                         station dots
  GOBLET SQUAT
  13 reps
  [ Done ]                 Next: Farmer Carry 50 m
  (after last station of round → Round rest 0:60 screen)
```

**Interval (clock)**
```
  Interval 5 of 8
  WORK                                    full-bleed accent color
            1:12
  Row Erg · RPE 8
  Next: Easy 2:30
  [ ⏸ ]      [ Skip ]
  (EASY phase uses a calm color and big "EASY")
```

**EMOM**
```
  Minute 7 of 24
  0:41 left in this minute
  BURPEE · 8 reps
  [ Done ]  → "Rest · next: Reverse Lunge to Press in 0:23"
  Minute boundary always advances; tapping Done is optional.
```

**Continuous**
```
  SkiErg · steady
            6:12 / 16:00
  ───────────── progress ─────────────
  "One steady rhythm, no programmed recovery."
  [ ⏸ ]      [ End block ]
```

**Ready (before clock blocks and after warm-up)**
```
  Up next · Block 1 of 2
  Timed circuit · 5 rounds · 45 s on / 20 s easy
  Med-Ball Slam · DB Row · Floor Press · Battle Ropes
  First 2 min: set your pace and load (Hybrid setup copy)
  [ Start ]
```

**Completion**
```
  Workout complete
  Strength · Posterior chain
  48 min  ·  4 blocks  ·  16 sets
  🔥 5-day streak                    only if the server returned it
  How was it?  [Too easy] [Just right] [Too much]   optional
  ✓ Saved to MOOD      (or: Saved on this phone, syncing when you're online)
  [ Done ]
```

**Exit (✕) sheet:** Pause and leave (keeps it resumable) · End workout (confirm; not recorded as completed) · Keep going.

---

## 6. Persistence architecture

One record per user: `@mood_v3_session_v1:<uid>` (AsyncStorage). Single active session at a time.

```ts
{
  schema: 1, sessionId (uuid), compilerVersion,
  workoutId, workoutVersion, planFingerprint,
  envelope,                          // the exact workout being executed (offline resume)
  status: 'active' | 'completing' | 'completed' | 'ended_early' | 'abandoned',
  startedAt, lastActiveAt, localDateStarted,
  cursor: { stepIndex, stepStartedAt|null, extraSec, manualTimerStartedAt|null },
  pausedAt|null, pausedMsTotal,
  stepStatus: { [stepId]: 'done' | 'skipped' },
  logs?: { [itemId]: [{ set, reps, load, unit }] },     // only if F2 = yes
  completion?: { payload, attempts, lastError, serverCompletedAt, streak }
}
```

- **Written** on every state transition (complete, skip, back, pause, resume, add time, timer start) and on AppState → background. Never on ticks.
- **Restored** on session screen mount: recompile from the stored `envelope`, check `planFingerprint` (mismatch after an app update → resume at the same block start, never crash), then `resolve(now)`.
- **Timers** never store remaining time. They store `stepStartedAt`; remaining = `startedAt + duration + extra + pausedMs - now`.
- **Elapsed workout time** = `now - startedAt - pausedMsTotal`.
- **Expiry:** an `active` record whose `lastActiveAt` is more than 12 hours old becomes `abandoned` on next read.
- Route guard: `gestureEnabled: false` on `/v3/session`; hardware back opens the exit sheet.

---

## 7. Completion architecture

**Recommendation: one frontend call, backend orchestrates everything.** Today `/complete` writes only `v3_workouts`; streaks come from a client analytics event (lost for users who opt out of analytics) and counts from a separate non-idempotent `POST /api/user-workouts`. Three client calls cannot be made safe together.

**Smallest backend change** (`mood_v3/router.py::complete`):
1. Atomic transition: `find_one_and_update({_id, user_id, status: {$ne: 'completed'}}, {$set: …})`.
2. Duplicate → 200 `{status: 'already_completed', completed_at, …}` (never an error).
3. Only on the winning transition, run idempotent side effects: upsert `user_workouts` keyed `{user_id, v3_workout_id}` with `$inc workouts_count` only on insert; server-emitted `workout_completed` (`source: 'v3'`, direction, archetype, duration, deduped on `v3_workout_id`) through the same path that feeds `retention.process_workout_completion` and achievements; free-allowance consumption per F4.
4. Record `side_effects_at`; a duplicate call re-runs any missing effect (crash safety).
5. Extend `CompleteBody` (it is `extra='forbid'`) with optional `started_at`, `completed_steps`, `total_steps`.
6. Return `{status, workout_id, completed_at, logged_exercises, streak: {current, longest}}`.
7. Tests: duplicate, concurrent, stale `item_id`, side-effect re-run.

`build_v3_router` currently receives only `db`; it needs the event and retention helpers injected.

**Frontend:**
- "Finish workout" appears only when the cursor reaches the `finish` step (all remaining steps done or skipped) and at least one main-block work step was completed. Opening the final screen does nothing; the explicit tap does.
- Tap → status `completing` + payload persisted **before** the request → button disabled → POST.
- 200 (either status) → `completed`; show streak if returned.
- Network failure → stay `completing`; completion screen says "Saved on this phone, syncing"; retry on app foreground, Home focus and a 30 s / 2 min / 10 min backoff. Home already shows Done.
- 4xx other than auth → keep payload, log `v3_completion_failed`, show a quiet retry; never double-post because the server is idempotent.
- The V3 player must **not** call `/api/user-workouts` or `Analytics.workoutCompleted` itself.
- Always complete against the envelope version the session ran (item ids are slot-stable across swaps).

Downstream systems affected: MOOD's Pick rotation and exact-exercise progression (read completed `v3_workouts` on next generate), V3 history, workout count, streak (retention), achievements, `/users/me/stats`, review-prompt counter.

---

## 8. Home integration

Home reads `@mood_v3_session_v1:<uid>` in its existing `load()` (mount + focus). Precedence: **continue > done > today > build**. Neither continue nor done may be gated on the `engine.build` check (a mid-day deploy would hide them).

| Session record | Home mode | Hero content / action |
|---|---|---|
| `active`, not expired | `continue` | Workout title · "Block 3 of 4 · 22 min in" · **Continue workout** → `/v3/session?id` (restores exact step) |
| `completing` or `completed`, completed on today's local date | `done` | "Trained today" · Direction · minutes · secondary "Build another" |
| `completed` on an earlier date, `ended_early`, `abandoned`, or none | `today` / `build` as now | unchanged |

- **Ended early:** record moves to `ended_early`, analytics fires, Home returns to `today` mode; the workout can be started fresh from the Cart.
- **Abandoned (12 h idle):** same as ended early, reason `expired`.
- **Starting another workout while one is active:** Cart Start shows "You have a workout in progress: Continue it / End it and start this one."
- **Starting a workout already completed:** session shows "Already completed today" with Build another.
- Home UI change is limited to rendering the two declared modes in the existing hero; no redesign.

---

## 9. Timer architecture

One engine, not nine timers. Every timed thing is a step with `durationSec`; the only live state is `stepStartedAt`, `pausedAt`, `pausedMsTotal`, `extraSec`.

- **Display:** a lightweight tick (~250 ms) only triggers re-render; values are always recomputed from `Date.now()`. No accumulation, no drift.
- **Auto-advance:** when a timer step reaches zero in the foreground, the reducer advances with `stepStartedAt = previous end time` (not "now"), so chained intervals never drift.
- **Background / lock:** nothing runs. On `AppState → active`, `resolve()` fast-forwards through timer steps that ended while away (intervals and EMOM keep running in real life, so the clock should too) and stops at the next user step. Rest that ended while away lands on the next set, waiting.
- **Pause:** freezes all clocks and elapsed time. Intervals only pause on explicit Pause.
- **Skip:** ends the current step now. **+15 / +30 s:** rest, transition and recovery only (not work bouts or EMOM).
- **Keep awake:** `activateKeepAwakeAsync` while a session is active and the screen is focused; release on exit, completion and pause-and-leave.

Timer correctness is launch-mandatory and fully covered by the above. Background alerts are separate (section 19 of the brief, below).

---

## 10. Logging

The player works with **zero** logging. Tapping Complete / Done records the step as done, which feeds progress, analytics and the `completed_steps` sent with completion.

Important finding for F2: V3 progression (the "Last time 60 kg × 8, try 62.5 kg today" line the Cart already renders) is fed **only** by `performance` sent at completion. With no load logging, Strength progression stays blank forever.

**Recommendation (F2):** SHOULD SHIP an optional weight field on Strength rows and Athletic strength / support rows only: a small "Log weight" affordance under Complete set, prefilled from the progression suggestion or the previous set; reps default to the set's target and are adjustable. Untouched sets send nothing (never fabricate data). No logging for Sweat or Athletic power. Unit: lb by default with a kg toggle remembered locally (no unit preference exists in the profile today).

---

## 11. Media, details and scaling

- **Photo exists** (`exerciseImageUrl`): hero area ~30% height.
- **Video exists** (`exercise.media.video_url`): a "Watch demo" chip opens the existing sheet/player; no inline autoplay (focus, data, audio).
- **Neither:** the hero collapses entirely; exercise name and prescription move up and get larger. No monogram-sized empty box, no broken states. Media never gates any step.
- **Details:** the (i) button and a tap on the name open the existing `ExerciseSheet` as a modal over the player (cues, load guidance, quality stop, progression, demo). The session keeps running underneath.
- **Scaling:** when `prescription.scaling` exists, one quiet line under the prescription ("Make it fit you: Scale assistance or load"); tap opens `detail`. The sheet shows `load_guidance` (which already contains `detail`), so no duplicate. Never on Sweat, finishers or power.
- **Quality stop:** always visible on Athletic power items as a distinct line under the target ("Stop the set when…"), and on the transition screen into the power half of a contrast pair.
- **In-session Swap:** POST-LAUNCH (version bump, recompile mid-session and server state for little launch value; Cart Swap covers it).

---

## 12. HealthKit / wearables

| Item | Status | Class |
|---|---|---|
| Player works with no wearable | Design requirement | MUST |
| Live heart rate in session | Stream exists but only sees samples from a Watch running its own workout; never wired in a live screen | POST-LAUNCH |
| Start/end an Apple Health workout, Watch app | Not supported (module is read-only, no HKWorkoutSession) | POST-LAUNCH |
| Session HR / energy summary on completion (`fetchSessionMetrics`) | Exists; cheap to call, but `CompleteBody` can't carry it yet and numbers depend on a Watch | POST-LAUNCH |

---

## 13. Reuse map

Keep and use: `v3/workout.tsx` handoff + load pattern, `v3Api.ts`, `v3Today.ts`, `V3Home.tsx` hero modes, `ExerciseSheet.tsx`, `ExerciseThumb.tsx`, `v3ExerciseImages.ts`, `v3PlainLanguage` / `v3CartFormat` / `v3OverviewFormat` formatters (labels), `analytics.ts`, `SessionSafetyBanner`, `ratingPrompt`, expo-haptics, expo-video.
Concept only: timestamp model and abandon/background analytics from `workout-session.tsx`; `SmartVideoPlayer` AppState handling.
Do not reuse: `workout-guidance.tsx` timer, auto-advance and completion; `create-post` (auto-saves a workout card on mount); `InSessionProgressBar`; `CartContext`.

New: `utils/v3Session/compile.ts`, `engine.ts` (reducer + resolve), `store.ts`, `useSessionClock.ts`, `app/v3/session.tsx` (rewrite), `components/v3/session/*` (Frame, WorkStep, TimerStep, ReadyStep, Checklist, CompleteScreen, ExitSheet).

---

## 14. Implementation plan

| Phase | Scope | Exit criterion |
|---|---|---|
| **1. Compiler** | `compile()` + TS types; fixture export of ~500 envelopes (every structure) from the backend harness; invariant tests over all fixtures | Zero invariant failures (section 15, automated) |
| **2. Engine + store** | Reducer, `resolve()`, persistence, expiry; fake-clock tests for background catch-up, pause, skip, back, add time | All lifecycle unit tests green |
| **3. Player UI** | Frame, work / timer / ready / checklist screens, exit sheet, details sheet, scaling, quality stop, media states, keep-awake, haptics, route guard | Every structure playable end-to-end on device |
| **4. Completion** | Backend change + tests (section 7); client completion, queue, retry; completion screen | Idempotency and offline tests pass |
| **5. Home + analytics** | Continue / Done modes, conflict prompt, analytics events | Home QA rows pass |
| **6. Should-ships** | Optional weight logging (if F2), fit rating, rest-end local notification (if F3) | |
| **7. QA** | Full matrix below on a physical iPhone | Launch gate |

D1 fix (if approved) lands with Phase 1 so fixtures reflect it.

---

## 15. QA plan

**Automated (compiler invariants over every fixture envelope):** no two consecutive rest/recovery steps; no rest after the final step of a block; `between_sets` rest duration equals that row's `rest_sec`; `after_pair` has exactly one transition between A1 and A2 and one rest after A2, none after the final round; circuits rest only after the last station; anchor stations appear only in their listed rounds; interval step count = rounds × 2 - 1; timed-circuit bout = `rest.work_sec`; EMOM minute count = `interval.minutes`; pyramid steps match `steps_sec`; `reps_scheme[set]` used when present; step ids unique and stable across recompiles; total work steps = Σ sets (or rounds × items).

**Device matrix:**

| Area | Case | Expect |
|---|---|---|
| Strength | Traditional straight sets | Set → rest(row) → set; no rest before next exercise |
| | Heavy Primary (≥150 s) | "Full recovery", Start-now allowed |
| | Top Set + Back-off | Set targets 4 / 7 / 7 / 7 |
| | Superset | A1 → 15 s → A2 → pair rest; no rest after final round |
| | Time hold / per-side hold | Manual start, switch sides, auto-complete |
| | Scalable bodyweight (Pull-Up) | Make it fit you line + detail; prescription unchanged |
| | Finisher, ladder, pyramid | Correct per-set targets |
| Sweat | Circuit | Round 2 of 4 · Station 3 of 5; round rest only after last station |
| | Hybrid | Anchor first every round; round-specific anchor dose; setup copy on Ready |
| | Engine intervals | WORK / EASY auto-chain; no recovery after the last bout |
| | Timed circuit (incl. D1 case) | Bout = `work_sec`; round rest = recovery + round seconds |
| | EMOM | Minute clock advances regardless of taps; early Done shows remainder |
| | Continuous, pyramid, ladder | Single clock; steps; rung targets |
| Athletic | Standard power | Quality stop visible; between-set rest from row |
| | 2:00+ full recovery | Label from `full_recovery` only |
| | Athletic Strength pair | 30-60 s transition, pair rest |
| | Contrast pair | Heavy → 45 s → jump → recovery → repeat |
| | Olympic derivative, sprint (distance) | Correct targets; tap-advanced |
| | Warm-up checklist, 30 min with no cool-down | Checklist shows; nothing invented |
| Lifecycle | Start / pause / resume / skip rest / skip exercise / back | Correct step and timers |
| | Background mid-rest and mid-interval, screen lock 5 min | Lands on the right step with the right remaining time |
| | Force close and relaunch (online and offline) | Exact step restored |
| | Home Continue | Restores exact step; not hidden by engine build change |
| | Completion | One `v3_workouts` completion, one `user_workouts` row, streak +1 once |
| | Double / triple tap Finish, kill app mid-request | Still exactly one of each |
| | Completion offline → online | Done immediately; syncs later exactly once |
| | End early, 12 h idle | Not completed; Home back to today |
| | Missing media / photo only / video | No gaps; details sheet works |
| | No wearable | No prompts, no errors |

---

## 16. Scope table

| MUST SHIP | SHOULD SHIP | POST-LAUNCH |
|---|---|---|
| Compiler + engine + persistence | Optional weight logging on Strength / Athletic strength rows (F2) | In-session Swap |
| All structures in section 2 | Fit rating one-tap on completion | Audio cues / spoken countdown |
| Timestamp timers, pause, skip, back, +15/+30 s on rest | Streak on completion screen (from server response) | HealthKit HR, Apple Health workout write, Watch |
| Keep-awake, route guard, exit sheet | Rest-end local notification when backgrounded, only if permission already granted (F3) | Background audio / Live Activity |
| Warm-up / cool-down checklist | "Since last set" count-up between user-paced blocks | Richer logging (RIR, reps per set everywhere) |
| Details sheet, scaling, quality stop, three media states | | Set-method timers (cluster intra-set rests) |
| Idempotent backend completion + client queue/retry | | Partial-credit for ended-early workouts |
| Home Continue / Done | | Session history screen |
| Minimal haptics (phase changes, 3-2-1 on timed phases) | | |
| Analytics (below), D1 fix | | |

**Analytics (minimum):** `v3_workout_started` (workout_id, direction, archetype, est minutes), `v3_session_resumed` (from: home / relaunch / foreground, gap_sec), `v3_block_completed` (block index, structure, actual sec, rests skipped, time added), `v3_step_skipped` (exercise or block only, not rest), `v3_workout_ended_early` (block index, completed / total steps, elapsed), `v3_workout_abandoned` (expired), `v3_workout_completed` (client view: elapsed, completed / total steps, sync: online / queued), `v3_completion_failed`. Per-set events dropped in favor of block aggregates. `workout_completed` (streak) is emitted by the server.

---

## 17. Founder decisions

- **F1. Approve the one-line Sweat fix (D1)?** Timed circuits whose State raised work to 45 s still show 40 s per station. Recommendation: yes. Without it, the player still times correctly but shows a mismatched label on 7% of timed circuits.
- **F2. Optional weight logging at launch?** Without it, the Strength progression line never appears. Recommendation: yes, Strength and Athletic strength rows only, optional, never fabricated.
- **F3. Rest-end notification when the phone is locked?** Keep-awake covers most use. Recommendation: ship only for users who already granted notifications; never prompt mid-workout.
- **F4. Paywall and free allowance for V3.** V3 Start calls no paywall gate today, and V3 completion consumes no free workout. Should V3 Start use `tryBeginWorkoutSession`, and should completion consume the allowance as V2 does? This is a business call; the plan works either way.
- **F5. What counts as completed.** Recommendation: reaching the end (skips allowed) with at least one main-block set done, via an explicit Finish tap. "End workout" never counts. Confirm this is strict enough.

---

## 18. Risks / blockers

- **No blockers.** The envelope is sufficient; nothing in the generator needs new fields.
- Backend completion change touches streak / count / achievement paths shared with V2. Mitigation: V2 endpoints untouched; new code keyed on `v3_workout_id`; tests.
- `create-post` auto-saves a workout card on mount; do not route V3 completion there.
- Home "today" uses local date while retention uses UTC day; a late-night workout may show Done today but land on tomorrow's UTC streak day. Accept for launch.
- Timezone / app-update edge: a plan fingerprint mismatch after an app update resumes at the block start rather than the exact set.
- Mid-session deploy that changes the generator: completion is unaffected (`/complete` does not check engine build).
- Housekeeping: an audit archive `_gs_audit_src.tar` was left in the MOOD folder by this review; safe to delete.
