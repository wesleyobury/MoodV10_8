# MOOD V3 Guided Session: implementation report

Baseline `bfc9974c`. Architecture: Phase Zero report (`MOOD_V3_Guided_Session_Phase0.md`) with founder decisions F1 to F5.
Nothing is committed to git yet; all changes are in the working tree.

## 1. What was built

Home → Build → Cart → **Guided Session → Complete → Home**. Start Workout now opens a real player that walks the athlete
through the warm-up, every set, round, interval, transition and recovery, the cool-down and an explicit Finish. The session
survives backgrounding, screen lock, force-close and relaunch. Completion is recorded exactly once by the server (offline
safe), and Home shows Continue Workout or Trained Today.

## 2. Architecture and files

```
V3 envelope ──compile()──▶ SessionPlan ──(SessionState, now)──▶ stepView() ──▶ player UI
```

| File | Role |
|---|---|
| `frontend/utils/v3Session/types.ts` | Session Plan types (sections, steps, targets, labels) |
| `utils/v3Session/compile.ts` | Pure, versioned compiler (`COMPILER_VERSION = 1`); one rule per `rest.kind`; stable step ids; fingerprint |
| `utils/v3Session/engine.ts` | Pure timestamp engine: `reduce()` (complete, start_timer, skip, skip_exercise, skip_block, back, pause, resume, add_time), `resolve()` catch-up, progress, tally, next-user-moment |
| `utils/v3Session/record.ts` | Persisted session record, restore / fingerprint fallback, 12 h expiry, Home model, weight-log model (F2), completion payload + backoff, background notice text (F3) |
| `utils/v3Session/store.ts` | AsyncStorage `@mood_v3_session_v1:<uid>`, `@mood_v3_weight_unit_v1:<uid>`; serialized writes |
| `utils/v3Session/sync.ts` | Completion delivery (intent persisted first, one request in flight, retry) |
| `utils/v3Session/notifier.ts`, `notify.ts` | One background timer notice, only with existing permission (F3) |
| `utils/v3Session/access.ts` | F4 paywall extension points (no paywall shown) |
| `utils/v3Session/analytics.ts` | Lean session events |
| `utils/v3Session/viewModel.ts` | What the screen says (position, target, next, phase, full recovery, scaling, quality stop) |
| `utils/v3Session/invariants.ts` | Plan invariants used by tests and the full sweep |
| `components/v3/session/*` | `useGuidedSession` (platform wiring), `SessionViews`, `TimerRing`, `WeightLogger`, `CompleteScreen` |
| `app/v3/session.tsx` | The screen (placeholder replaced) |
| `app/_layout.tsx` | `v3/session` registered with swipe-back disabled |
| `components/v3/V3Home.tsx` | Continue / Done modes wired; Shuffle hidden in those modes |
| `utils/v3Api.ts` | `completeV3Workout()` |
| `utils/notifications.ts` | Session notices never show as foreground banners and never navigate away from the workout |
| `package.json` | `expo-keep-awake ~15.0.8` declared (already bundled by `expo`, same lockfile key: no new native build); `test:v3-session` |
| `backend/mood_v3/completion.py` (new), `router.py`, `server.py` | Idempotent completion + server-side side effects |
| `backend/mood_v3/engines/sweat/sweat_core.py` | D1 only |

The player branches on normalized step types (work, rest, transition, ready, clock, checklist, finish), never on Direction.

## 3. D1 fix

`sweat_core.py` `bouts_longer` (rotating intervals): when a State raises work to 45 s, the station doses are set to the same
value (3 lines). Before: 40 of 590 timed circuits showed "40 s" under a 45 s block. Regression `tests/test_d1_timed_circuit.py`
(5 reproduced State cases + a sweep) proves `station seconds == display == block.rest.work_sec`; it fails on the old code.
Sweat freeze metrics before/after: identical. QA sample: 1 of 2,012 rows differs, only that display. Sweat frozen again.

## 4. Structure coverage

Compiled from 20,030 production-path envelopes (strength 6,532, sweat 6,063, athletic 7,435; 495,118 steps): **0 invariant
violations** (no duplicate rest, no trailing rest, transitions only between pair/round items, grouped blocks never use row rest,
rest durations from the contract, round rest only after the last station, anchor first every round, interval / timed-circuit /
pyramid / EMOM / continuous / ladder counts exact, reps_scheme targets, D1 agreement).

| Structure | Player behavior |
|---|---|
| Straight / Heavy / Volume / Top Set + Back-off / ladder / pyramid / finisher | set → row rest → set; no rest after the block's last set; per-set targets from `reps_scheme` |
| Superset (Strength 15 s, Athletic Strength 30–60 s, contrast 45 s) | A1 → **Move** timer → A2 → pair rest (or Full recovery) → next round; none after the last round |
| Circuit / Hybrid anchor circuit | Round r of R · Station k of n; round rest only after the last station; anchor first with its per-round dose |
| Intervals / finisher | Ready → WORK / EASY chained on expected ends (no drift); nothing after the last bout |
| Timed circuit | WORK per station at `rest.work_sec`; EASY after stations; round end = recovery + round rest (engine accounting) |
| Pyramid | Ready → steps of `steps_sec` with EASY between |
| EMOM | Ready → minute clock; Done early → REST until the next minute; the boundary always advances |
| Continuous | Ready → one STEADY timer |
| Sweat ladder (self-paced) | Rung × exercise, user-paced, no timers |
| Athletic power, Olympic, sprint, jumps, throws | user-paced sets, quality stop always visible, rest from the row |
| Time holds (incl. per side) | Start button, countdown, per-side chains Left → Right |
| Warm-up / cool-down | one checklist step (Athletic item list with checkmarks; guidance otherwise); no invented timers |

Full recovery label and "Start now" come only from `rest.full_recovery`.

## 5. Timer and background behavior

Only timestamps are stored (`stepStartedAt`, `pausedAt`, `pausedMs`, `extraSec`); a 250 ms render tick only redraws.
`resolve(plan, state, now)` completes every timer that ended while away, chaining from each expected end, and stops at the
first step that needs the athlete (a rest that ended while locked lands on the next set, waiting; user-paced work never
starts itself). Clock blocks only start from Ready and then run in real time; only Pause stops them. +15/+30 on rest and
transitions. Skip, skip exercise, skip block, Back (previous set; inside a clock block, its Ready card). Keep-awake while the
player is active and not paused; released on pause, pause-and-leave, finish, end, unmount. Haptics only when the clock moves
the athlete (rest over, WORK↔EASY, new round, 3-2-1 on timers of 10 s or more, completion).

## 6. Notifications (F3)

On background during a running timer: one local notice for the next moment the athlete is needed ("Rest over · Set 2 of 3 ·
Barbell Hip Thrust is ready.", "Time to move", "<Block> complete · Up next: …"). An interval block schedules one notice at the
block end, never per bout. Only if permission is already granted (or iOS provisional); never requests permission. Cancelled
on foreground, pause, end, completion and leaving the player. Foreground banners for these notices are suppressed; tapping one
opens the app where it was.

## 7. Persistence and Continue

One record per user, written on every transition and on background: envelope, workout id/version, compiler version +
fingerprint, session id, status (`active | completing | completed | ended_early | abandoned`), start, cursor step id, statuses,
timer state, pause, weight logs, completion intent. Restore: same fingerprint → exact; different (app update) → same step id, else
the start of the same block. Offline restore needs only the record. 12 h idle → abandoned (analytics once).

## 8. Optional weight logging (F2)

Loaded reps rows only: Strength, Athletic strength / support; never Sweat, power, jumps, throws, sprints, bodyweight / scalable
or timed work. "+ Log weight" (with "Try 140 lb" when progression has it) → [−] 135 [+] lb|kg · [−] 5 reps [+] · ×. The next
set carries the previous load + reps, visibly armed; × = don't log. Every change is saved to the record immediately. Only sets
completed with a real load are sent. Unit lb by default, kg toggle remembered locally. Tests prove untouched fields send nothing.

## 9. Completion and idempotency

Finish appears only at the end (skips allowed) with at least one main-block work step done (F5); arriving never completes.
Finish writes the intent (status `completing`) before the request. Server (`mood_v3/completion.py`): atomic winner transition
on `v3_workouts`; duplicates return 200 `already_completed` with the stored result; side effects run once, keyed by the workout:
`user_workouts` upsert, `workouts_count`, free allowance, canonical `workout_completed` (retention streak, achievements; works
with client analytics off). A crash between the transition and the effects is repaired by the next call (claimed effects never
repeat). Sets logged against a slot that was later swapped are dropped, never misattributed. Retries: foreground, Home focus,
30 s / 2 min / 10 min / 30 min / hourly while the completion screen is open. The V3 client never calls `/api/user-workouts`.

## 10. Weekly free workout (F4)

**V2 today:** `entitlement.py` books `free_workouts_used` per ISO week (Monday 00:00 UTC) via `consume_free_workout_update`,
called by `POST /api/user-workouts` on completion; `POST /api/workouts/start` returns 402 once the week's free workout is used.
**V3 now:** the allowance is consumed only inside V3 completion, only for non-entitled users. Generating, shuffling, Cart,
Start, abandoning and ending early never consume it. V3 never blocks at Start, so the first free workout always runs to
completion and ends on the normal completion screen. A second free completion in the same week is still recorded (V3 has no
start gate, as before this phase).
**Extension points:** `utils/v3Session/access.ts` `POST_COMPLETION_PAYWALL` (`'none'` today) with `postCompletionAction()`
wired into CompleteScreen (`after_celebration` overlay or `after_done`), `beforeSessionStart()` wired into session start
(`next_start`; the existing 402 gate `utils/workoutStartGate.ts` can be called there), and `next_build` (Build is frozen, not
wired). The completion response carries `access {has_full_access, consumed_free_workout, free_workouts_remaining,
free_workouts_reset_at}`, stored on the record.

## 11. Home

Precedence Continue > Done > Today > Build, never gated on the engine-build check. Continue: "Workout in progress · Block 3 of
4 · 22 min in · Continue Workout" (exact position). Done: "Trained today · Strength · 42 min" (+ "Saving to MOOD…" while
queued) and "Build another workout". Shuffle is hidden in both so an in-progress or finished workout can't be swapped from
Home. Starting a different workout while one is active: "You have a workout in progress" → Continue / End it and start this
workout / Cancel (the old one is ended early, not counted).

## 12. Tests and regression

| Suite | Result |
|---|---|
| Backend V3 (`pytest mood_v3/tests`) | **288 passed**, 3 skipped (baseline 269 + D1 6 + completion 13) |
| Completion end-to-end against server.py's real hooks (mongomock) | first completed (streak 1, free workout consumed), repeat already_completed, count 1, one event, one row |
| Unified production-path QA | 9,072 builds, 0 failures |
| Frontend V3 unit (existing) | 44/44 (cart hero 9, today 6, cart 14, plain 5, body map 7, media 3); other frontend unit suites also green |
| Guided Session unit (new) | 64/64: compiler 26, engine 21, view 8, sync 5, notifier 4 |
| Full compile sweep | 20,030 envelopes, 0 violations |
| Logic suites | Phase 2 680/680, Phase 2.6 273/273 |
| Typecheck | no errors in any new or touched file (the one remaining error in `utils/notifications.ts` line 119 predates this work) |
| Browser QA (`qa/v3/gs_e2e.py`, real screens on react-native-web, controlled clock) | 54/54 checks, 0 page errors |

Browser QA covers: Strength end-to-end with weight log, full recovery and superset; every Sweat structure; Athletic contrast;
background notice (authorized / denied, no prompt); foreground catch-up; relaunch → Home Continue → exact restore; pause and
leave; conflict; end workout (nothing counted); explicit Finish; duplicate taps (one completion, one count, one event, one
free workout); offline completion → Home Done → sync on foreground, counted once; keep-awake; haptics. Screenshots in
`V3 Updates/Guided_Session_QA_screens/`.

## 13. Physical iPhone QA (founder, feel not code)

Build a dev client from this tree (no new native modules), then:

1. **Strength (60 min, a Pull or Push day):** Is the screen obvious at a glance? Is Complete set the only thing you notice? Does the Full recovery screen feel unhurried and intentional ("Start now")? Does the superset's 15 s Move feel different from rest?
2. **Log weight** on one exercise: does it stay out of the way? Does the next set carry it forward? Skip it on another exercise entirely.
3. **Sweat Engine or Circuit:** after Start on the Ready card, do intervals run on their own? Is WORK vs EASY unmistakable from across the room? In a circuit, is "Round 2 of 4 · Station 3 of 5" obvious?
4. **EMOM:** tap Done early; does "Rest until the next minute" make sense?
5. **Athletic power:** does the quality stop change how you do the set? Does the contrast pair's 45 s move feel right?
6. **Lock the phone during a rest** (with notifications already allowed): does "Rest over" arrive once? Unlock: are you on the next set, waiting?
7. **Force-quit mid-workout**, reopen: Home shows Continue Workout; does it land exactly where you were?
8. **Exit → Pause and leave**, then Continue from Home.
9. **Airplane mode, Finish:** "Saved on this phone"; Home shows Trained Today; turn the network back on and reopen: saved once.
10. **Missing media:** an exercise without a photo still looks deliberate.
11. **Screen stays awake** during the workout, and sleeps normally after.
12. **Free account, first workout of the week:** no paywall anywhere before, during or after; completion screen feels satisfying.

## 14. Remaining launch issues

- Not verified on a physical iPhone yet (browser harness only): keep-awake, haptics feel, lock-screen notice delivery, iOS modal / keyboard behavior of the weight field.
- `.git/HEAD.lock` (0 bytes, dated 03:19, from the freeze commit, not created by this work) is still in the repo and will block `git commit` until removed.
- Existing `qa/v3/e2e_flows.py` (Phase 2.6) still expects the old placeholder testID `v3-session-placeholder`; superseded by `gs_e2e.py`.
- Cart Swap stays possible on a workout whose session is in progress if the athlete reaches that Cart through Build; the session keeps its own envelope and the server drops logs for a swapped slot, so nothing is misattributed.
- Home "today" uses the local date; the retention streak uses the UTC day (unchanged V2 behavior).
- No audio cues (post-launch by scope).

## 15. Decision needed: post-first-workout paywall

Pick one value for `POST_COMPLETION_PAYWALL`: `after_celebration` (overlay once "Saved to MOOD" shows), `after_done` (on Done,
before Home), `next_build`, or `next_start` (call the existing 402 start gate before a second free workout in the week).
Recommendation: `next_start`. It keeps the first completion clean, reuses the server gate that already exists, and asks for
the subscription at the moment the athlete wants the next workout.

Unified production-path QA (`python -m mood_v3.qa.run_unified_qa`): 9,072 builds, 0 failures (same as the freeze baseline).
