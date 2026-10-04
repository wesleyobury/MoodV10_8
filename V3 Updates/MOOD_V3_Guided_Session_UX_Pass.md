# MOOD V3 Guided Session — Founder UX Pass

Status: implemented on the device (not committed). Companion to `MOOD_V3_Guided_Session_Phase0.md` and `MOOD_V3_Guided_Session_Implementation.md`. Nothing in this pass changes the generator, the envelope, the compiler's session semantics, the completion contract (F1–F5), the weekly allowance, or the rest contract. It is a presentation, navigation and coaching pass over the same Session Plan / SessionState.

## 1. Thumbnail library

- 301 PNGs from `V3 Updates/Exercise Thumbnails` uploaded once to Cloudinary (`dfsygar5c`, `mood/v3/exercises/<exercise_id>.jpg`, 720×900, q90). Re-run `backend/mood_v3/qa/exercise_thumbs_sync.py` if the library changes; it re-uploads and regenerates the TS map.
- `frontend/utils/v3ExerciseThumbs.ts` (generated): id → Cloudinary version, `thumbUrl(id)`.
- `frontend/utils/v3ExerciseImages.ts`: resolution order is library → legacy MOOD image → none; `exerciseImageSource()` reports which. Delivery via `optimizedImageUrl` (f_auto, q_auto, c_limit) ≈ 12 KB at 240 px.
- Coverage: 269 block exercise ids + 62 warm-up ids all matched by exact id and name against the tracker CSV; 26 library entries are spares with no exercise yet.
- Used in: Cart rows (56 / 48 px), Guided hero, Overview rows, Exercise Details. Video remains an optional demo inside Details; a missing thumbnail falls back to the legacy image, then to a muscle-group glyph — never a broken image.
- Worth a founder look (image plausibly mismatched to name): F048 barbell_curl (no bar visible), F065 slider_hamstring_curl (reads as a bridge), F062 kettlebell_swing (overhead position), F210 jm_press, F033 lat_pulldown.

## 2. Cart

- `cartScan(workout)` in `v3CartFormat.ts` builds the scan model: blocks with a label (`MAIN WORK`, `SECONDARY`, `FINISHER` …), a structure sublabel from `structureLabel()` (`Superset · 3 rounds`, `Circuit · 4 rounds`, `Timed circuit · 4 rounds · 40s on / 20s easy`, `EMOM · 12 min`, `Ladder · 12-10-8`), and rows `[marker][thumb][name][rx]` where marker is `A1/A2` for pairs and `1..n` for circuits.
- Rest, muscle tags and notes are no longer on the rows (rest is still in the envelope and still drives the session). Warm-up section removed from the Cart; the totals line says "warm-up included". Swap stays as a small icon.
- Main block label is gold; secondary blocks are neutral.

## 3. Guided — second pass

- Elapsed timer and the abstract progress bar are gone from the top bar. Elapsed is still tracked in `SessionState` and shown in the summary.
- Top bar now shows semantic position (`coach.position()`): block label, exercise, `Set 2 of 4` / `Round 3 of 4` and structure dots; warm-up and cool-down show no set counter.
- Pause moved to the secondary row (visible only while a timer is running). Primary button remains the one big action; the "next" line is hidden when the primary is Finish workout.
- Tap burden: `timerStart: 'auto' | 'manual' | 'ontap'` on work steps. Circuit stations that follow a tapped station start `ontap` (no extra confirmation); rest and transitions still auto-advance; anything that would start a clock unexpectedly still waits for a tap.
- Exercise Details sheet now has "How to do it" (cues) and "Watch out for" (mistakes; `mistakes` copied from db.exercises by the media attach).

## 4. Overview mode

- `overview.ts` builds `overviewModel(plan, state, workout)` from the same plan/state — no second engine. Blocks → rows with `setsDone / setsTotal`, state (done / current / open), the entry step, `nextOpen`, `lastDone`; clock blocks (timed circuit, EMOM, intervals, steady) show `clockProgress` and a `readyStep`.
- Engine actions added: `jump` (navigation only; never completes anything), `complete_step`, `uncomplete_step`. `EnterCause 'tap' | 'timer' | 'jump'` so a jump never starts a timer.
- OverviewView: edges (warm-up / cool-down), block cards, rows with circle / check, current-row strip (Details · Complete set N · Skip), "Start guided timer" / "Open guided timer" for clock blocks (a clock block can only start from its Ready step), Finish button (same `canFinish` / `finishState` as Guided).
- Switching: `ModeToggle` in the top bar; the record carries `mode`; switching never resets timers, logged loads, coachSeen or position. Background rule in Overview: no rest-end notice unless the current section is a clock section.
- Preference: `@mood_v3_session_mode_v1:<uid>` written on every switch, read on start. Default is Guided. No onboarding, no experience gating.

## 5. Coaching layer (`coach.ts`, deterministic, no LLM)

- Layer 1 always visible: position + primary action. Layer 2 one short contextual line (`coachLine`), shown in Work / Rest / Clock / Ready bodies. Layer 3 Exercise Details on demand.
- Structure explanation once per structure per session (`record.coachSeen`), e.g. superset: "Two exercises back to back, then rest. Three rounds."
- Pacing lines by State tone: Stressed → controlled, Low Energy → supportive, Amped → assertive, Irritated → direct. Rest ≤ 12 s: "Get set. 135 lb, 6–8." Recovery ≤ 10 s: "Next effort in N seconds" / "Last effort. Finish strong." Power: "Every rep should be fast." Heavy: "Take your time here. Brace hard before every rep." Last set: "Last one. Match the quality of your first set."
- No line repeats on consecutive steps; no motivational filler outside these triggers.

## 6. Post-workout flow

Finish → Complete (celebration + summary) → Feedback (Too easy / Just right / Too much, skippable) → Results (MIN / CAL / AVG HR / MAX HR; Sync from Health only when `wearableAvailable()`; Edit + Save; "No estimates — only numbers you or your watch recorded") → Share (Minimal / Session / Stats treatments; Instagram Story via `instagram://story-camera` with a transparent sticker, or the system share sheet) → Done.

- Backend: `POST /api/v3/workouts/{id}/after` (idempotent `$set`, 409 unless completed) stores `fit_rating`, `mood_after`, `calories`, `avg/max HR`, `steps`, `hrv_sdnn`, `duration_actual`, `metrics_source` and mirrors the metrics onto the `user_workouts` row. Completion itself is untouched.
- Frontend: `record.after` + `afterPayload()` (only non-null fields), `sendAfter` with backoff and foreground flush. Wearable read is `syncWearable(startISO, endISO)`: session window for energy / steps / HRV, an overlapping (±15 min) Watch workout for heart rate. Nothing is estimated; empty fields stay empty.

## 7. Tap burden (20,030 envelopes)

Guided: required / optional / auto-advanced taps.

| Direction · length | required | optional | auto |
|---|---|---|---|
| Strength 30 | 12 | 7 | 7 |
| Strength 60 | 20 | 13 | 13 |
| Sweat 30 | 14 | 2 | 4 |
| Sweat 60 | 20 | 4 | 9 |
| Athletic 30 | 11 | 6 | 6 |
| Athletic 60 | 15 | 9 | 9 |

Overview: minimum 2 taps to a valid completion (one main-block set + Finish); per-exercise tracking 4–6; per-set tracking 10–19; guided timers invoked 0–1 per workout. Script: `frontend/qa/v3/tap-burden.ts`.

## 8. QA

- Unit: `modes.test.ts` (12), `v3CartFormat.test.ts` (17), `v3ExerciseImages.test.ts` (4), plus the existing compile / engine / view / sync / notifier suites — all green. Backend 289 passed, 3 skipped.
- Sweep: 20,030 envelopes compile with 0 violations.
- Browser E2E (`qa/v3/web`, controlled clock): `gs_e2e.py` 54/54, `gs_ux_e2e.py` 52/52 (Cart hierarchy, thumbnails, no elapsed timer, coaching lines, Overview navigation-never-completes, switching, preference, cool-down + Finish, feedback, results, share treatments, after-payload).
- Screens: `Founder_UX_Pass_screens/` (cart, guided, overview per Direction, completion stages, share, thumbnail contact sheets).

## 9. Known / needs a physical iPhone

- `utils/notifications.ts:119` pre-existing TypeScript error (untouched). `.git/HEAD.lock` still present on the device.
- view-shot capture, media-library save, the Instagram URL scheme and HealthKit reads are stubbed in the browser harness; verify on a phone with Instagram and a Watch workout.
- Coaching line length at Dynamic Type sizes, thumbnail sharpness on the hero at 3×, and haptic timing on rest end.

---

# Founder review round 2 (device review notes)

Seven notes from the first device review, all presentation and navigation. The engine, compiler semantics, completion contract and rest contract are untouched.

## 1. Session hero photos, uncropped and outside the card

The exercise photo is now a full-bleed hero (Cart-hero style): no rounded card, the top bar floats over it on a scrim, and the block role · muscles and the exercise name sit on its bottom edge. It is `min(width × 0.92, height × 0.38)` tall, so the 4:5 library image loses far less than the old 300 px card did. `Hero` in `SessionViews.tsx`; `optimizedImageUrl(…, 1080)`.

## 2. Cart sections

`cartSections()` in `v3CartFormat.ts` groups consecutive blocks by programming role: Strength PRIMARY / SECONDARY / ACCESSORIES / FINISHER (a Target workout: one section per muscle, e.g. CHEST), Sweat PRIMARY / COMPLEMENT / FINISHER, Athletic PRIMARY / SECONDARY / STRENGTH / SUPPORT / FINISHER. A section header carries the muscles it loads most and `N exercises · ~min`; blocks inside share one card; a straight block has no label of its own, a grouped or clocked block keeps a one-line structure label (`TIMED CIRCUIT · 5 ROUNDS` with `40 s on / 20 s easy` under it). `CartSectionView.tsx`; `CartBlockView` gained `inSection`.

## 3. No screen per rest

A rest or transition no longer has a screen. `RestBody` renders the exercise screen of the set being rested for (same hero, same name, the strip already reads `Set 2 of 4`) with the rest ring where the target was and one line `Then Set 2 of 4 · 6–8 reps`. Clock blocks are one screen per block: during EASY the hero shows the next station with an `UP NEXT` tag. Only a rest before a Ready card or the finish keeps the plain ring + up-next card. Screens per workout (median, 20,030 envelopes): Strength 30 min 19 → 5, Strength 60 min 33 → 8, Athletic 30 min 17 → 5, Athletic 60 min 25 → 9, Sweat 30 min 22 → 16, Sweat 60 min 32 → 23 (Sweat stays higher because every circuit station is a different exercise). `qa/v3/tap-burden.ts` prints the "Screens" line.

## 4. Where am I, always

`whereAmI()` in `coach.ts` (pure, tested) feeds two always-visible pieces:

- on the hero: `MAIN LIFT · CHEST · TRICEPS` (block role from the block type, muscles from the exercise) and the exercise name;
- the Where strip under it: one segment per block (filled as its sets complete, the current one thicker) with `BLOCK 2 OF 5`, then `Set 2 of 4 ●●○○` and `14 sets left · ~22 min` (open sets from the cursor on, and the compiler's per-step estimate for the rest of the plan plus the cool-down).

On a rest the strip describes the set it leads to. In clock blocks it reads `Interval 3 of 8` / `Round 2 of 4 · Station 3` / `Minute 7 of 12`; where there are no sets it says `N exercises left`. Elapsed time is still not shown.

## 5. Mode switch spelled out

The two icons became a labelled pill: `Guided | Overview` (icon + word, selected in gold), top right over the hero. Same `testID`s (`v3-session-mode-guided` / `-overview`).

## 6. Instagram overlay cards in the V2 design

`ShareCard.tsx` is now a port of `components/WorkoutStatsCard.tsx`: **Rings** (the three concentric gold rings for calories · minutes · max HR with the glossy gradients, minutes left, max bpm right, legend, exercise list, MOOD footer), **Simple** (the 48 pt gradient MOOD wordmark, the exercise list, the four-cell stats pill with the workout name split into two words), **Heart rate** (wordmark, exercises, the HEART RATE · LIVE row with avg · peak, the wearable strip). The transparent Instagram Story variant is V2's sticker layout (rings left, dot rows right, white text with shadows). Differences from V2, on purpose: no random mood phrase (the Direction is letter-spaced instead), no estimated calories, no synthesized heart-rate curve, no fake max HR: a ring, a cell or a legend entry exists only when the number exists, and Heart rate is offered only once HR data exists (`availableTreatments`). The web harness stubs `@react-native-masked-view/masked-view`.

## 7. Home is one screen, always

`V3Home.tsx` renders the same layout in every situation: the hero, `MOOD'S PICK` with the workout title · Direction · ~min · States and **Open Workout**, the State chips, and **Build my own** at the bottom (→ `/v3/build`). MOOD keeps the pick real by itself: when nothing current is built, when the pick was completed today, or when the States / sore areas no longer match it, Home builds a new pick (`buildPick`, the one-tap MOOD's Pick request; 700 ms debounce after a chip change, one at a time, never while Shuffle runs). While it builds the title reads "Building your pick…"; if the server declines, the card offers **Try again** and, when the completed pick is still the one on screen, a small `DONE TODAY` tag. Shuffle stays top right (Different Workout on the pick). The old Continue / Done / Today / Build hero variants are gone. One deliberate exception: an active Guided Session shows a slim "Workout in progress · Continue" strip above the pick; nothing underneath moves, and a finished or ended workout changes nothing.

Note for the engine (not changed, generator is frozen): the fresh pick after a completion is a new `/generate` call with the same inputs; whether it differs from the completed session is up to the engine's rotation. In the harness it did.

## QA

- `modes.test.ts` +2 (whereAmI on straight sets, rest, finish; clock blocks) → 14; `v3CartFormat.test.ts` +1 (sections: order, every exercise once, one ACCESSORIES section, label lengths) → 18. All frontend session suites green (76 in `test:v3-session`).
- Browser: `gs_ux_e2e.py` 60/60 (Cart sections, hero role line, block number, what's left, rest-on-the-exercise-screen, `Then Set 2`, spelled-out mode switch, Rings / Simple / Heart rate, Home after the flow: fresh pick + Build my own). `gs_e2e.py` updated for the new Home (fresh pick after completion, no Done state; the same layout while an offline completion is queued).
- Harness fix: React commits through its scheduler (MessageChannel), which Playwright's fake clock does not drive; `settle()` gives the page 40–60 ms of real time after clicks and fake-clock jumps before the DOM is read. This removed a 1-in-3 flake that the heavier session screens exposed.
- Screens: `Founder_UX_Pass_screens/round2_*.jpg`.

---

# Founder review round 3

Eight notes from the second device review. Presentation, navigation and one engine action; the completion contract and the generator stay as they were.

## 1. Warm-up screen

`edgePlan()` in `viewModel.ts` reads the section into rows, nothing invented: Athletic's own list (raise · mobility · primer · rehearsal, with thumbnails); Strength's guidance sentence ("5-8 min: easy cardio and mobility, then 2-3 lighter ramp-up sets of X") into **Easy cardio 3–5 min** (marked "Your choice of machine"), **Mobility 2–3 min** ("Open up what you're about to train: chest, triceps"), **Ramp-up sets · 2–3 lighter sets of X** (X's thumbnail, taps into its details; "These don't count as sets"); Sweat's into **Easy cardio, building** plus "Rehearse · a few easy reps" of the first stations. When MOOD leaves the cardio unspecified the screen says so in one line: "Cardio is your call on purpose: bike, rower, ski erg, treadmill, jump rope or a brisk walk. Anything easy that gets you warm." Rows tick off like a checklist; guidance that cannot be read stays as text.

## 2. Hero photos brought down

The 4:5 photo is laid out at full width and anchored 5 % above the hero box; the box (`min(width × 0.98, height × 0.42)`) clips the bottom. Heads and hands stay in frame; feet may go.

## 3. Coaching cues on every set

The set screen lists up to two of the exercise's cues under the effort line (gold-dot rows); the rest screen carries the first cue of the set it leads to. Cues come from the exercise library (`item.cues`), the same source as Exercise Details.

## 4. Sleeker timer

`TimerRing`: ring stroke `size / 40` (5 px at 190–216) on a fainter track, the time at weight 500 / 58 pt with tighter tracking, label 11 pt letter-spaced, sublabel 12.5 pt.

## 5. All sets done

A work set in a straight-set block with more than one set to go shows **All sets done** in the secondary row. It confirms ("All 3 remaining sets done? … Rests in between are not run.") and dispatches the new engine action `complete_exercise`: the exercise's remaining work steps are marked done (they count toward F5 like any completed set), its rests are marked skipped so none of them runs, and the cursor lands on the next exercise's first set. Not offered inside supersets, circuits or clock blocks. Weight logging for the sets done this way is not asked for.

## 6. Supersets and other grouped structures

Two changes. (a) The move between pair members no longer has its own "MOVE TO / I'm ready" screen: during the transition the next member's own screen is shown (photo, name, target, cues) with a small amber "Move straight over · 0:14" line, and the primary already reads **Complete set**; one tap ends the move and completes the set (or starts the hold). (b) `whereAmI.group` renders a group strip under the round line: the round's members in order as pills (`A1 Cable Fly → A2 Skull Crusher`; `1 Treadmill → 2 Snatch → 3 Push-Up → 4 Jacks` for circuits; `ANCHOR …` for Hybrid), the one in hand lit gold, the ones done ticked. The local line keeps only the round (`Round 2 of 3`), the dots are rounds. Circuits and Hybrid get the same strip; timed circuits too. Checked by walking a superset, a circuit and a per-side Athletic block in the harness; the only other structural oddity found (the truncated "Round 1 of 5 · Stati…") is gone with (b).

## 7. Overview set bubbles

`SetRing`: a ring that fills by the exact fraction (1 of 3 = a third, 2 of 4 = half) with the count inside; solid gold with a tick when every set is done, a dash when skipped. Tap completes the next set, long-press undoes the last one, as before.

## 8. Bigger thumbnails

Cart rows 68 / 60 px (was 56 / 48); Overview rows 60 / 52 px (was 44 / 38).

## QA

- `modes.test.ts` +4 (All sets done; superset move → A2 screen, group strip, round; circuit strip; warm-up plan) → 18. Session suites green.
- `gs_ux_e2e.py` → 71 checks (warm-up rows + choice note + first lift named; cues on the set screen; All sets done offered / confirmed / recorded; superset strip, move shows A2 with Complete set, one tap completes A2; Overview ring at 1 / N; hero anchored to its top). `gs_e2e.py` unchanged in scope.
- Harness: `wait_out` now verifies the fake-clock jump against `Date.now()` in the page and repeats it after a short real-time yield when Playwright ignored it (a 1-in-3 flake that only ever affected the harness).
- Screens: `Founder_UX_Pass_screens/round3_*.jpg`.

---

# Founder review round 4: the clean pass

Only the essentials on a Guided screen. Nothing was removed from the data; what left the screen lives in Exercise Details or the More sheet.

**Set screen, top to bottom:** photo with `ROLE · MUSCLES` and the exercise name (the info icon is gone, the name itself opens Details; the A1 / A2 tag is gone, the group strip says it) · block segments with a small `2/5` · `Set 2 of 4 ●●○○` with `20 sets left · ~35 min` in tertiary · the target, large, with the effort line under it in tertiary · one line of coaching: the moment's coach line when there is one, otherwise the exercise's first cue · the quality stop as one small line (only when the exercise has one) · Log weight · a short hint above the button (`Then rest 2 min`, `Then A2 · Skull Crusher`) · the primary · Back / Pause / All sets done / More.

**Removed from the set screen:** the "New exercise · 0:02 since your last set" line, the load-guidance paragraph, the second cue, the quality-stop card, the "Make it fit you" chip (now an item in More, `v3-more-scaling`), the long "Next: Rest 2 min, then Set 2 of 4 · Barbell Bench Press" sentence.

**Rest screen:** ring · `Then Set 2 of 4 · 5–7 reps` · the coach line. The cue and the quality stop no longer repeat there. **Clock screen:** phase · ring · target · coach line (the effort line under the ring is gone). Segments are 3 px, the current one 5 px; the where strip and the next hint are tertiary; the target is 56 pt.

QA: `viewModel.test.ts` updated for the short next hint ("Then full recovery 2:30", "Then A2 · …"); the core suite's Full-recovery check reads the shorter phrase. Session suites 82/82.

---

# Founder review round 5

**Effort as a chip.** The "Stop with about 2 reps left in the tank" sentence is gone. The target row reads `5–7 reps` with a `2 RIR` chip to its right (or `RPE 7–8` for Sweat / Athletic work); tapping it opens a sheet with the plain-language definition and what the number means for this set ("stop each set when you could still do about 2 more good reps; if you are sure you had 5 left, go heavier next set"). `effortChipOf()` in `viewModel.ts`.

**Set methods, visible.** A prescription that carries a method ("4 × 8–10 · 1.5 reps", "3 s eccentric", "paused reps", "drop set on the final set", "rest-pause on the final set") now shows it as a gold chip next to the reps, with its own tooltip ("Full rep, then a half rep from the stretched position, then back to the top. That is one rep…"). `methodOf()` reads the display suffix the engine already writes, so nothing is guessed. The Cart and Overview rows carried the suffix already.

**Two cues on every exercise, from a curated library.** The engine attaches cues to only about a fifth of items (267 of 331 generated items had none; in production the V2 exercise collection fills some gaps, unevenly). `utils/v3ExerciseCues.ts` now holds two written cues for all 301 library exercises, specific to how each lift fails ("Pendlay row: bar dead on the floor every rep; torso parallel" rather than "control the movement"). `exerciseCues(item)` builds the two lines: the scaling cue first on scalable bodyweight work (the "Too hard: … Too easy: …" sentences of the engine's Make-it-fit-you text, so that button is gone), then the engine's own cues for the item, then the library; duplicates and generic filler dropped. A test asserts two cues for every id.

**Removed:** the "Main lift done. Now accessory." line; the `22 sets left · ~35 min` line (the segments and the set count carry position); the Make it fit you button and its More-sheet item.

**Hero photos lower.** The photo now starts under the notch (`0.75 × top inset`, about 44 px on an iPhone with Dynamic Island) instead of above it, so the athlete is never behind the camera; the box is a little taller (`min(width, height × 0.44)`) and still clips the bottom.

**Set count more prominent:** `Set 2 of 4` at 18 pt / 800 with 8 px dots.

**Buttons:** on a straight-set exercise with sets to go, `Complete set` (gold, left) and `All sets done` (neutral, right) share the row at equal width and height; everywhere else the primary stays full width.

QA: `modes.test.ts` +1 (chips, methods, cue coverage for all 301 ids, scaling cue first) → 19; session suites 83 green; UX browser suite +3 checks (two cues, RIR chip and its sheet, no sets-left line; the hero check now expects the photo to start under the notch); harness `jump()` verifies every fake-clock fast-forward against `Date.now()` (the first one after install is reliably ignored by Playwright, which was the remaining 1-in-3 flake).

---

# Founder review round 6

Seven notes. Presentation, the finish path, the post-workout flow and demo-video delivery; the generator, compiler semantics, completion contract (F5 still requires one completed main set) and rest contract are unchanged.

**Warm-up text wraps.** The ramp-up row put the first lift's name and "2–3 lighter sets" on one unwrapping line, so a long name (Dumbbell Bench Press, Chest-Supported Machine Row) ran past the card border. Name and rx now wrap (`edgeHead`, `minWidth: 0` on the text column). Browser check: every warm-up line stays inside its card.

**Overview: Complete exercise instead of Skip.** The current row's strip is Details · Complete set N · **Complete exercise** (shown while more than one set is open). It jumps to the row's next open set and dispatches `complete_exercise` (the same engine action as Guided's All sets done: remaining sets done, their rests not run, the next exercise becomes current). Skipping still lives in Guided's More sheet.

**Demo videos.** Three causes, three fixes:
- Quality: the generic Cloudinary MP4 (`w_1280,h_720,c_limit`) caps HEIGHT at 720, so the portrait library clips (1080×1920 HEVC) were delivered at 404×720, ~0.9 Mbps. Demos now use `exerciseDemoVideoUrl()`: `vc_h264,q_auto:good,w_1280,h_1280,c_limit,fps_30,ac_none` → 720×1280, ~2.4 Mbps, ~2 MB for a 7 s clip. The social-feed MP4 (and its eager backfill) is untouched.
- Load: `VideoWithPoster` was declared inside `ExerciseLookupSheet`, so every re-render of the sheet (the Guided Session re-renders every second for its timers) unmounted and restarted the video. It is module-level now. Also, library demos were never eagerly derived, so the first view of each paid a 3–6 s Cloudinary transcode: the Cart and the session now warm the workout's demos (`warmExerciseDemos`: one request per demo, body dropped after the headers, poster prefetched).
- Thumbnail: with a demo, the Exercise Details header and the player poster are a frame of that video (`exerciseDemoPosterUrl`, `so_1.0`, 1080 w) instead of the library photo.

**Last set = Finish workout.** `isLastWork()`: once the step in hand is done no work is left. Its primary reads **Finish workout**; one tap (`finishFromLast`) counts the set, closes what is left (cool-down, trailing rest) as skipped, never done, and finishes. A Guided session that reaches the end on its own (a clock block's last interval, the last exercise skipped) finishes immediately. The "That's the workout. Tap Finish to save it to MOOD." card is no longer reached in normal use (it stays only for "Nothing logged yet"). The cool-down guidance moves to one line on the next screen.

**One interstitial, one post-workout screen.** `CompleteScreen` is now:
1. **Wrap**: Congratulations · "You finished Upper Pull." · `52 min · 18 sets · 6 exercises` · streak · Saved to MOOD · **How did that feel?** (Too easy / Just right / Too much; a tap saves and moves on; Skip).
2. **Share**: one screen, no scrolling (card sized to the space left, 4:5, ≤ 300 wide): MIN / CAL / AVG HR / MAX HR are text fields (tap and type; saved on blur, Share or Done; no Edit button), Sync Health when a wearable exists, Rings · Simple · Heart rate, Instagram Story / Share, Done.
The old Workout complete page and its Continue are gone.

**Heart rate overlay is back.** Always offered. V2's tracker: HEART RATE header with avg · peak, the gold area chart and the wearable strip. With avg / peak (wearable or typed) the curve is drawn through them (`utils/v3Session/heartCurve.ts`: V2's shape, deterministic per session, peaks at the real peak, averages to the real avg); without numbers the chart is a dim dashed outline and the numbers read "–". LIVE only for wearable data. Note: the curve's shape between the real numbers is illustrative, as in V2 (HealthKit gives avg / max for the matched Watch workout, not the sample series).

QA: `modes.test.ts` +3 (last set → Finish workout and one-tap finish for Strength / Sweat / Athletic, not-last stays Complete set, heart-rate curve) → session suites 86 green; `gs_e2e.py` 56/56 (last set carries Finish, auto-finish after a clock block, offline finish), `gs_ux_e2e.py` 84/84 (warm-up wrap, no Skip / Complete exercise, wrap screen, share fits one screen, inline numbers saved to the server, Heart rate empty → drawn). No new TypeScript errors (85 pre-existing, none in these files). Screens: `Founder_UX_Pass_screens/round6_*.jpg`.

Needs a phone: demo playback speed on cellular, the 720×1280 demo against the bundled landing video, keyboard over the number fields on a 4.7" screen.

---

# Founder review round 6b: coaching and timers

**Coaching rewritten for all 302 library exercises.** `utils/v3ExerciseCues.ts` now holds four lines per exercise, each on a different point: `setup` (getting into position), `form` (what a good rep looks like), `efficiency` (intent, tempo, the muscle that drives, a pause) and `fatigue` ("Last reps: …", what breaks down first on that lift late in a hard set and how to hold it or when to stop). They were written per exercise, then reviewed line by line for redundancy (the hip thrust's double "upper back on the bench" was the trigger), vague filler and accuracy. Engine cues are no longer mixed in for library exercises (that mixing caused the duplicates); they remain the fallback outside the library.

**Cues follow the sets.** `cuesFor()` works out which set of the exercise the screen is (per-side and circuit rounds included): first set setup + form, middle sets form + efficiency, last set fatigue + efficiency. Timed holds read "Last seconds:". A rest shows the first cue of the set it leads to. `sameCue()` guarantees the two lines on screen never make the same point. Exercise Details "How to do it" shows setup / form / efficiency; "Watch out for" leads with the late-set line.

**Set screen trimmed.** The coach bubble and the lightning quality-stop line are gone from the set screen; it is target + effort chip + two cues + Log weight. The "Then rest 2:00" hint above the button is gone too (the rest itself now says what is next).

**One rest timer for every Direction.** Strength, Sweat and Athletic rests (and round rests) are the same: gold ring, REST, the next set and its cue beside it, −15s · +15s · +30s under that, primary **Start now**. "Skip rest", "I'm ready" and the white ring are gone. `add_time` accepts −15 / −30 (taking off more than is left ends the rest). EASY inside interval blocks stays blue: it is part of the interval rhythm, not a rest.

**No flash on Complete set.** Work and its rest are one component (`ExerciseScreen`): the photo, name and Where strip stay mounted, only the guidance area flips (a 260 ms vertical flip) between the set and the rest timer. The next exercise's photo is prefetched during the current one.

**More of the photo.** The hero is anchored to the bottom of the 4:5 image, so feet and floor always show; any crop is a sliver of ceiling under the top bar. The block role and exercise name moved under the photo (nothing overlays the base of the movement), the Where strip is one row (Set 2 of 4 ●●○○ beside the block segments), the target is 40 pt and the cues 13.5 pt, so the photo gets half the screen.

QA: session suites 89 (all 302 exercises × 3 phases checked for two distinct cues, last set leads with the fatigue line, no dashes; cues change across a real straight-set block; every rest's primary is Start now; −15 s), `gs_e2e.py` 56/56, `gs_ux_e2e.py` 87/87 (no coach / quality-stop lines on the set screen, the stage flips to the rest, gold ring, Start now, −15 s, photo bottom-aligned). Screens: `round6b_*.jpg`.

---

# Founder review round 6c: supersets, hero framing, warm-up, All sets done

**Supersets, clear as day.** A `GroupCard` sits right under the photo on every superset / circuit screen: a gold SUPERSET (or CIRCUIT / ANCHOR CIRCUIT) badge, "2 exercises, back to back", then one row per exercise with its marker (A1 / A2), name and target; the one in hand is lit with NOW, the ones done this round are ticked. On A1 of round 1 it also says how: "Do A1, then go straight to A2. No rest between; rest after A2." It stays during the move to A2 and on the pair rest. (`whereAmI().group` gained `rx` and `how`.)

**All sets done everywhere it makes sense, no popup.** Straight sets finish the exercise (`complete_exercise`), supersets and non-clock circuits finish the whole group, every round of every exercise (`complete_block`, new engine action; rests and moves are not run). Offered while more than one set is open, including during the move to A2. The confirmation sheet is gone.

**Hero framing.** The photo now starts just under the status bar and is never cut at the top (`heroGeometry`: full width, 4:5, up to 57 % of the screen height). The role · muscles line, the name and the Set / Round row are overlaid on the bottom of the photo on a dark fade, so below the photo is only the set (target, effort, cues, Log weight). Checked by eye on 22 exercises across Strength, Athletic and Sweat with the new `qa/v3/hero_sheet.py` contact sheet (`round6c_hero_sweep.jpg`): heads and hands in frame on all.

**The warm-up looks like a warm-up.** A WARM-UP badge with "7 min · Doesn't count toward your sets", "Warm up first", "Gets you ready for X. Your workout starts after this.", then the steps as a numbered timeline you tick off (no cards, no exercise photo; the ramp-up lift is a small thumbnail at the side). Cool-down uses the same layout with a COOL-DOWN badge.

QA: session suites 90 (superset All sets done completes both exercises in every round; group card names and how), `gs_e2e.py` 56/56, `gs_ux_e2e.py` 93/93 (photo starts under the status bar and is not cut at the top, name over the photo, warm-up labelled, no All sets done popup, SUPERSET badge + NOW + how, All sets done on a superset). Screens: `round6c_*.jpg`.

---

# Founder review round 6d / 6e: warm-up photos, Cart hero, Guided layout from the founder mock

**Warm-up photos back.** A warm-up step shows its exercise photo (52 px, beside the text) whenever the item has one: Athletic's list (Row Erg, World's Greatest Stretch, Leg Swings, Snap-Down, Pogo Jumps, Skater Hops …) and the Strength ramp-up lift. Steps without a photo (easy cardio, mobility) stay text-only. Tap opens details where available.

**Cart hero below the speaker / camera.** The Cart photo now starts under the status bar (`top: insets.top`) instead of behind it. The bundled payoff photos are 4:5 portraits, so they are laid out at full width and anchored to the top (`HeroImage portraitAspect`, the slow drift grows from the top edge): heads always in frame, only the bottom can go under the scrim. The 16:9 remote heroes keep their full height. Checked on 8 Carts (`qa/v3/cart_sheet.py`, `round6d_cart_heroes.jpg`).

**Guided layout (founder mock).** Top to bottom: the bar (close · Guided | Overview), WORKOUT PROGRESS with one segment per block and n / N, EXERCISE n / N · role (UP NEXT on a rest that leads to a new exercise), the exercise name (up to two lines), "4 sets • 8–10 reps" (rounds for supersets, the clock format for interval blocks). Then the photo, then Set 2 of 4 ●●○○ with the effort / method chips, the two cues and Log weight (or the rest timer, flipping in place), the buttons. The screen is a fitted column, nothing scrolls: the photo takes whatever height is left.

**No cropping.** `FitPhoto` fits the 4:5 library image inside that height (contain, centred), so nothing is ever cut; its top and bottom fade slightly into the black, and when it is narrower than the screen its sides do too. The superset card, Ready card and interval screens use the same header + photo. Browser check: the photo keeps 4:5 inside its box; progress, name and sets · reps are all above it.

QA: session suites 90, `gs_e2e.py` 56/56, `gs_ux_e2e.py` 93/93. Screens: `round6d_*.jpg`, `round6e_*.jpg`.

---

# Founder review round 6f: Cart and Guided heroes, same place, full width, never cut at the top

**Cart.** The new Cart hero library (`V3_CART_HEROES`, 1080 × 1350) is 4:5 like the bundled payoff photos, but the Cart only top-anchored the bundled ones, so the new remote heroes were centre-cropped and lost the top of the head. Every Cart hero is now laid out at full width and anchored to its top (`portraitAspect={0.8}`), starting under the status bar; only the bottom goes under the title scrim.

**Guided.** The photo is back to edge-to-edge (`PhotoHero`), starting at the same place as the Cart hero (right under the status bar, close / mode bar floating over it), anchored to its top so heads are never cut, and taking the height the screen leaves. The founder-mock header (WORKOUT PROGRESS, EXERCISE n / N · role, name, sets • reps) sits over its lower part on a fade into the black; below the photo is the superset card when there is one, Set n of N with the effort chip, the cues / rest timer and the buttons. Interval and Ready screens use the same hero.

Checked by eye on 8 Carts and 8 Guided screens (`round6f_*.jpg`). QA: `gs_e2e.py` 56/56, `gs_ux_e2e.py` 94/94 (new: Cart hero starts under the status bar, full width, top-anchored; Guided photo full width, starts under the status bar, 4:5 kept with the top never cut, header over its lower part).

---

# Founder review round 6g: top fade, no black frames

**Top fade.** The Guided and Cart photos now melt into the black at their top edge (a 64 / 72 px fade from the page black, half-strength by 40 %), so there is no hard line under the status bar. Short on purpose: not a feather.

**No black screen, no words ahead of the picture.** The Guided photo is now `expo-image` with a memory + disk cache: when the exercise changes, the previous photo stays on screen until the next one is decoded and then cross-dissolves (200 ms), instead of the native Image blanking while it reloads. Every exercise photo of the workout (the 1080 px version the session draws) is prefetched into that cache when the Cart opens and again when the session opens, so moving exercise to exercise, or from a set to a rest that previews the next exercise, never waits on a download. The header over the photo (exercise n / N, name, sets • reps) dissolves in with the same timing, so the text no longer flips before the picture.

QA: `gs_e2e.py` 56/56, `gs_ux_e2e.py` 95/95 (new: every photo of the workout prefetched at w_1080). The web harness stub for expo-image now renders a real image with the caller's style and records prefetches. Needs a phone to confirm the black frame is gone on device.

---

# Founder review round 6h: stronger top fade, the Complete set black screen, slow Cart heroes

**Top fade.** Stronger: solid black at the top edge, 82 % black at a third, gone by 110 px (Guided) / 120 px (Cart). The top of the photo no longer reads as an edge.

**Complete set → black (every workout).** The web harness shows the photo node is not remounted on Complete set, so the cause is native. Three suspects removed: (1) the photo hid itself on any load error (`failed` state), and iOS reports a cancelled request as an error when a view re-renders mid-load, which blanked the hero until the next exercise; the photo now never hides itself. (2) The photo layer re-rendered on every tick and every Complete set with a fresh source object; it is now a memoised layer (`HeroPhotoLayer`, keyed on uri + width) with a stable source, fixed size and `priority="high"`. (3) The guidance flip was a 3D `rotateX` with perspective, which can flash on iOS while the layer rasterises; it is now a 200 ms dissolve with an 8 px lift.

**Slow Cart heroes.** `HeroImage` (Cart, Home) now draws with expo-image (memory + disk cache, decoded off the main thread) instead of the native Image, is sized from the window width once (it used to lay out, measure, then re-decode at the portrait size), and Home prefetches every Cart hero into the cache at the size the Cart draws, so opening a Cart is a cache hit.

QA: `gs_e2e.py` 56/56, `gs_ux_e2e.py` 95/95, remount probe (same photo / header nodes across Complete set). Needs the phone to confirm the black frame is gone.

---

# Founder review round 6i: Guided photo to the top of the screen, no black fade

The Guided photo now runs to the very top of the screen, behind the status bar, instead of starting under it with a fade to black. Its bottom stays exactly where it was (status-bar height + the 4:5 height at full width); to keep 4:5 while growing upward it is scaled up a touch and centred, so a sliver of each side is cropped (about 18 pt per side on a 390 pt phone, less on bigger phones). Nothing is cut at the top or the bottom. The black top fade is gone; a light 38 % veil under the status bar and the close / mode bar keeps them legible, and the top bar no longer draws its own dark scrim. The Cart is unchanged (still starts under the status bar with its top fade).

QA: `gs_e2e.py` 56/56, `gs_ux_e2e.py` 95/95 (photo box starts at y = 0, the image fills the width with under 15 % side overflow, 4:5 kept, top at y = 0). Screens: `round6i_guided_sweep.jpg`.

---

# Founder review round 6j: one view switch

The two-part Guided | Overview pill sat over the photo. It is now one round button in the top-right corner, the same size and glass as the close button, showing where it takes you: a list icon in Guided (open Overview), a guide arrow in Overview (back to Guided). The testID names the destination (`v3-session-mode-overview` / `-guided`). Switching still never changes the workout or its progress; the remembered preference is unchanged.

QA: `gs_e2e.py` 56/56, `gs_ux_e2e.py` 95/95 (one round switch, same size as close). Screen: `round6j_view_switch.jpg`.

---

# Founder review round 6k: Cart hero = Guided photo treatment

The Cart hero now gets the same treatment as the Guided photo: the box starts at the very top of the screen (behind the status bar), the 4:5 photo keeps its bottom where it was (status bar + full-width 4:5) and grows upward, scaled up a touch and centred so a sliver of each side is cropped (`HeroImage extendTop={insets.top}`). Heads never cut, nothing lost at the bottom, no black fade; a light 38 % veil under the status bar keeps the back / shuffle buttons and the clock legible. Checked by eye on 8 Carts (`round6k_cart_sweep.jpg`). QA: `gs_e2e.py` 56/56, `gs_ux_e2e.py` 95/95 (Cart hero box at y = 0, image fills the width with under 15 % side overflow, top at y = 0).

---

# Founder note: Upper Body / Lower Body in Focus (Sweat)

Strength's Change sheet already had BODY AREA (Upper Body / Lower Body / Full Body). Sweat's FOCUS row ("What do you want to train?") now has **Upper Body** and **Lower Body** chips after MOOD's Pick, sending the same Target sets (chest + back + shoulders; quads + hamstrings + glutes). While an area is picked its muscles are not shown as separately selected, and tapping a muscle starts a fresh muscle selection. Home and the Cart read it as "Upper Body" / "Lower Body". Checked against the Sweat engine: both areas generate valid 30 and 60 min workouts. Athletic still has no Focus (unchanged). `ConfigSheet.tsx` only; no new TypeScript errors.
