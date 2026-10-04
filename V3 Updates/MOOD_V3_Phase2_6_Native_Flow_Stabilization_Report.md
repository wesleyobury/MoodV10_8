# MOOD V3 Phase 2.6 Native Flow Stabilization Report

## Git

| | |
|---|---|
| Branch | `feature/mood-v3-app-rehaul` |
| Starting commit | `9486b9e7` (Phase 2.5 frontend) |
| Ending commit | see `git log -1` (Phase 2.6 checkpoint, committed with this report) |
| Status | Clean. `frontend/.env` is still modified from local dev testing and is not committed. Phase 3 not started. |

## Founder Bugs

### Root cause of all three: the backend on your Mac was still running Phase 2 code

The three founder bugs have one cause:

- Chest → Upper Push.
- Custom Target Different Workout flashes but does not change.
- Irritated Hybrid with Complement + Finisher, 11 exercises, about 50 min.

The uvicorn process on your Mac was started before the Phase 2.5 backend landed and was never restarted. `dev-v3.sh` told you to start it without `--reload`, so it kept serving the Phase 2 generator. Metro, meanwhile, served the Phase 2.5 app, so the new screens were rendering old workouts.

Evidence:

1. **Live check against your running backend** (`http://10.0.0.248:8001`):
   - `/api/v3/workouts/history` exists (403, needs login), so the V3 router is loaded.
   - `/api/v3/version` returns 404. The running process predates the current code.
2. **Python bytecode timestamps** in `backend/mood_v3/__pycache__` (your Mac's Python 3.12):
   - Every `*.cpython-312.pyc` was last compiled on Sep 25 at 17:21 UTC.
   - The Phase 2.5 sources were written Sep 26 at 03:28, and committed as `de5b7969` at 03:37.
   - Python recompiles on import whenever a source file changes. So no Mac Python process has loaded the Phase 2.5 code, even though you generated workouts after that.
3. **Replaying your exact inputs through both code versions:**

| Input | Phase 2 code (`3ee4ad21`), what you saw | Current code |
|---|---|---|
| Strength, Target Chest, 60 | **Upper Push**, 6 exercises: Barbell Bench Press, Parallel Bar Dip, Smith Machine Incline Press, Cable Fly, **Cable Triceps Pressdown, Dumbbell Overhead Triceps Extension** | Custom Target, 5 chest movements, `selection_source=target` |
| Back + Core → Different Workout | **identical** (0 of 4 changed) | 5 of 5 changed |
| Shoulders → Different Workout | identical (0 of 3) | 5 of 5 changed |
| Quads + Core → Different Workout | identical (0 of 4) | 5 of 5 changed |
| Hybrid 60, Irritated | **Hybrid + Complement + Finisher, 11 exercises, 50.0 min** | Hybrid + Finisher, 8 exercises, 44.6 min |

The Irritated Hybrid row matches your screenshot exactly: same structure, same count, same length.

**What to do once:** stop the backend and start it again with `--reload`:

```
cd backend && source ~/.venvs/mood/bin/activate
JWT_SECRET=dev-only-secret uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

`dev-v3.sh` now refuses to start Metro unless the backend reports engine 2.6.

### Chest-only

- **Reproduced?** Yes, by replaying the request through the Phase 2 code (table above) and by running the new app against a Phase 2 backend in the web harness.
  - The current backend was correct all along: Custom Target, chest only.
- **Root cause:** a stale backend process, not the app. The app's request was already correct. I traced the whole path, and it adds no archetype:
  - Home state → `buildRequest` → JSON `{"direction":"strength","states":[],"soreness":[],"duration":60,"date":…,"persist":true,"target":["chest"]}`.
  - Profile defaults fill only goal / experience / frequency / preference / equipment / duration, and never target or archetype.
- **Fixes:**
  1. `dev-v3.sh` now uses `--reload` and refuses to start when the backend's engine phase is not 2.6.
  2. `GET /api/v3/version` reports the engine phase plus a fingerprint of the running source.
  3. Every envelope is stamped with `engine {phase, build}`.
  4. Dev builds show a red banner on Home when the backend is not running engine 2.6.
  5. Dev builds log one line per V3 call: request → archetype / selection_source / swap_count / engine.
  6. The backend logs one line per generation with the same fields.
- **Real request before/after:** the request is the same before and after (shown above). Only the process answering it changed.
- **Real output before/after:** Upper Push with two triceps accessories → Custom Target Chest. Example: Machine Chest Press, Dumbbell Fly, Cable Fly, Weighted Push-Up, plus one more chest press. No triceps-primary work, `selection_source=target`.

### Custom Target Different Workout

- **Reproduced?** Yes. Against the Phase 2 backend, Back + Core / Shoulders / Quads + Core returned the same composition.
  - The Phase 2.5 Preview accepted it, dimmed the content to 40% while waiting, then showed the same workout. That was the "flash".
- **Root cause:** the stale backend (Phase 2 Custom Target Different Workout had no variation), plus a Preview that treated an identical response as success.
- **Fix:**
  - The backend was already right, and I left it unchanged.
  - The Preview:
    - keeps the workout fully visible while building (only the button shows a spinner);
    - swaps in the new envelope only on success;
    - scrolls to the top;
    - fades the list in once;
    - shows "New Chest workout · 4 of 5 exercises changed" or "New workout · Upper Pull".
  - If a server ever returns the same composition, the app says "There isn't another version of this workout today." instead of pretending.
- **Before/after:**
  - Before: flash, same exercises.
  - After (live e2e): Chest → 5/5 changed, then 5/5 again; Back + Core → 5/5; Lower Squat → 4/5, type kept.

### Sweat Hybrid

- **What you were seeing:** Phase 2 output from the stale backend (Hybrid + Complement + Finisher, 11 exercises, 50 min).
- **Stale or current?** Stale. Nothing was cached or frozen. It was generated live, by old code.
- **Actual live current behavior** (current code, intermediate, the app's exact request):

| Case | Blocks | Exercises | Estimate |
|---|---|---|---|
| Hybrid 60, no State | Hybrid (one anchor block) | 6 | 39.6 min |
| Hybrid 60, Irritated | Hybrid + Finisher | 8 | 44.6 min |
| Hybrid 60, Amped | Hybrid | 6 | 43.6 min |
| Hybrid 60, Stressed | Hybrid | 6 | 40.2 min |
| Hybrid 30 | Hybrid | 3 | 23.4 min |

No Complement in any case. The Irritated Finisher is the approved Phase 2.5 behavior (finishers kept inside the band).

- **Fix made:** none to the generator. I added a live Hybrid regression test through the HTTP path (5 cases).

## Home Flow

**Old hierarchy (2.5):**

- States.
- Direction cards.
- A panel with three equal rows: TYPE (Change), TARGET (Change, expanding chip grid), LENGTH (segmented).
- MOOD's Pick copy.
- A barrier banner card.
- Build.

**New hierarchy:**

1. How are you feeling? Optional States, max 3, plus sore areas when Sore is on.
2. What are we doing? Strength / Sweat / Athletic, defaulting from last Direction or profile.
3. One compact row, for example `MOOD's Pick · 60 min    Change`, `Chest · 60 min`, or `Lower Body: Squat · 30 min`.
4. A line above Build that says exactly what will be sent, for example `Strength · Amped · Chest · 60 min`, then **Build workout**.

**Default tap path:** optional State → Direction (already selected) → Build. That can be a single tap.

**Change sheet:** one bottom sheet with three sections. Edits stay in a draft, and the Done button reads "Done · Chest · 60 min", so you see the result before applying.

| Section | Prompt | Options |
|---|---|---|
| FOCUS | "What do you want to train?" | MOOD's Pick, Full Body, Chest, Back, Shoulders, Arms, Core, Quads, Hamstrings, Glutes, Calves; multi-select up to 3 (Arms counts as two). Strength and Sweat only; Athletic hides it, as before. |
| WORKOUT TYPE | "Want a specific style of session?" | Let MOOD choose + the registry: Strength 8, Sweat 3, Athletic 3 |
| LENGTH | | 60 (default) / 30 |

**Focus / Type interaction:**

- Picking a Focus puts Workout Type back to "Let MOOD choose".
- Picking a Workout Type puts Focus back to MOOD's Pick.
- One quiet line in the sheet says what now leads: "MOOD now builds the session around Chest." / "Lower Body: Squat now shapes the session."
- Home only shows the result. There is no clearing language outside the sheet.

**First-session barrier personalization is kept.** It is now a single dismissible line under the title, not a card. The Time barrier adds a quiet "Short on time? 30 min is one tap away." under the configuration row. Motivation / Don't-know highlight the row and show the MOOD's Pick sentence.

## Preview

**Old hierarchy (2.5):**

- Eyebrow with duration, title, exercise count.
- TYPE row with a picker.
- Sections inside bordered cards.
- A Built for Today card showing the first line (often "You picked X.").
- Different Workout plus a hint line.
- Start.

**New hierarchy:**

- `STRENGTH` eyebrow.
- Title: the Target for Target sessions ("Chest", "Back + Core"), else the type ("Lower Body: Squat", "Hybrid").
- `~40 min · 5 exercises`.
- State chips, only if you selected any.
- An optional adaptation teaser.
- The workout.
- Different workout · Details, side by side.
- Sticky Start Workout.

**Removed from the Preview:**

- The Type picker. Type editing now lives only in Home's Change sheet, which also removes the Phase 2.5 path that swapped workout ids via route params.
- Bordered section cards.
- The Built for Today card.
- Hint copy.
- Equipment meta.
- Secondary-exposure cues.

**Structure:**

| Structure | Preview |
|---|---|
| Straight work | numbered through the session: `1 · Barbell Back Squat  4 × 6` |
| Superset | `SUPERSET · 3 rounds`, `A1 Cable Fly  12 reps`, `A2 …` (per-round reps; rounds are in the label) |
| Circuit / EMOM | `CIRCUIT · 4 rounds`, `Burpee  8` |
| Hybrid | `HYBRID · 6 rounds`, "Anchor every round, then that round's station", `ANCHOR Row Erg 550 m · Every round`, then `R1+R6 Sled Push`, `R2 Front-Rack Carry` … |
| Athletic | `PRIMARY` (with its one quality stop), `SECONDARY`, `REPEAT EFFORTS · 8 rounds` (with its stop rule), `SUPPORT` |
| Other | `INTERVALS`, `TIMED CIRCUIT` (+ "30 s on / 15 s off per station"), `CONTINUOUS · ~22 min`, `PYRAMID`, `LADDER`, `FINISHER · N rounds` |

**Actions:**

- Start Workout (sticky, primary).
- Different workout and Details (secondary).

**Teaser:** at most one line, from the API's `today.teaser`, shown only when something meaningful adapted. Examples:

- "Built for your Amped state / You're Amped, so a Spider Curl burnout finishes the session and working sets go a rep closer to failure."
- "Built around Back + Core / Back gets 3 movements while Core gets 2, with Core saved for the end."
- "Built around sore legs / Your legs are sore, so today was rerouted to Upper Pull, away from that loading."

Chest alone, plain Hybrid and plain MOOD's Pick show no teaser.

## Built for Today

**What changed:**

- Removed pure confirmations:
  - "You picked Hybrid."
  - "You chose Chest, so all 5 movements train chest."
  - "You chose X, so today is …"
  - "Your first Strength session starts with X."
- Rewrote lines to say what MOOD actually did.
- Capped at 4 lines. Zero lines is allowed.
- Details hides the BUILT FOR TODAY heading when there are no lines, but keeps TODAY / MOOD CHOSE.

**Rules for what appears:** a line is emitted only when an input or generator event caused a change:

- a soreness reroute or shift;
- a MOOD's Pick rotation (first session with a known goal, 5+ / 1-2 day frequency, or a Different Workout rotation);
- a multi-muscle Target split;
- State lines, where the specific event line wins (finisher, effort dial, set taken off, superset for Bored), with the general State line as fallback;
- the 30-minute shape;
- beginner, equipment and progression lines.

**Representative lines:**

- **Amped:** "You're Amped, so a 45° Back Extension burnout finishes the session and working sets go a rep closer to failure."
- **Low Energy:** "Low Energy: one set comes off the last accessory, so the main work keeps its quality." The fallback is "Stable, low-friction movements keep the session productive without adding unnecessary systemic fatigue." It says "low-friction" because the existing lint bans the word "lower".
- **Stressed:** "Today's work stays rhythmic and predictable without forcing you to race the clock."
- **Bored:** "MOOD pushed variety today: part of the session runs as a superset instead of your usual straight sets."
- **Irritated (Sweat, no finisher):** "Forceful stations like sled push, med-ball slam and … give that energy somewhere productive to go." It names only stations that are really in the workout.
- **Sore:** "Your legs are sore, so today was rerouted to Upper Pull, away from that loading."
- **Target split:** "Back gets 3 movements while Core gets 2, with Core saved for the end."
- **Different Workout (MOOD's Pick):** "MOOD moved you from Glutes + Legs to Upper Pull so this actually feels like a different session."
- **Different Workout (same type):** "A different Upper Pull session: 6 of 6 exercises changed."

## State / Persistence Audit

**Sources of truth:**

| Data | Owner |
|---|---|
| Direction, States, soreness, Focus/Target, Workout Type, duration (before Build) | `V3Home` `inputs` only (`HomeInputs`). Never persisted, so a new app session starts clean. |
| What is sent | `buildRequest(inputs)` |
| Current workout id | route param `id` (set once by Build or Open) |
| Current envelope (after Build) | the server envelope for that id. Preview and Details each hold it, both loaded from the today cache then refreshed from `GET` |
| `selection_source`, `swap_count` | only inside the envelope (server-owned) |
| Today's workout | `@mood_v3_today_v1:<uid>` (date, id, request signature, request, envelope). New day → ignored. |

**Stale-state bugs found and fixed:**

1. **An older engine's workout could be reopened as a fresh build.** Home's "same inputs, same day → reopen" shortcut, and the READY TO GO card, would have reopened your Phase 2 workouts even after restarting the backend. Now both require the cached envelope's `engine.build` to equal the running backend's. Otherwise Build generates fresh and the card is hidden (e2e verified).
2. **An identical Different Workout was accepted silently.** It is now detected and reported.
3. **Out-of-order envelope overwrite.** The Preview's focus refresh could replace a newer envelope with an older cached one. `accept()` now only takes the same workout id at an equal or newer `version`.
4. **Two sources for the workout id.** The Phase 2.5 Preview type change regenerated into a new id through `router.setParams` plus local `wid` state. That path is removed, and the Preview has a single id from the route.

**Persistence semantics verified:**

- Home configuration is what gets sent.
- The returned envelope is authoritative.
- Different Workout atomically replaces the envelope (and today's cache).
- Details reads the same workout, and a Details exercise swap shows on the Preview when you go back.
- Reopening with the same engine does not regenerate.
- A new day starts fresh.
- Direction change never carries a type/Target into the next request.

## End-to-End Flows

`frontend/qa/v3/e2e_flows.py` drives the real screens through the real request builder, the real `/api/v3` router (in-memory DB) and persistence. It exits non-zero on failure. Result: **13 / 13 PASS**.

| Flow | Result |
|---|---|
| A zero effort | Request `{direction: strength}` with no target/archetype → Upper Pull. Different Workout → "New workout · Lower Body: Squat", workout visible while building, scroll 0 → Start placeholder |
| B Amped | Teaser "Built for your Amped state …" |
| C Chest | Request `target=["chest"]`, no archetype → "Chest", 5 chest movements. Different Workout twice: 5/5, then 5/5 (4/5 on another run). |
| D Back + Core | Back 3 → Core 2 last, teaser names the split. Different Workout 5/5. |
| E Lower Body: Squat | Request `archetype=strength_lower_squat` → Different Workout keeps Lower Squat, 4/5 changed |
| F Sweat MOOD's Pick | Circuit → Different Workout → Hybrid |
| G Hybrid (Irritated) | One HYBRID anchor block (anchor + R-tagged stations) + Finisher. No Complement. Details shows TODAY / MOOD CHOSE / 1 line. |
| H Athletic | PRIMARY / SECONDARY / REPEAT EFFORTS / SUPPORT, no Focus in the sheet. Different Workout → Power |
| Guards | Same engine reopens without generating. A cached workout from another engine is never reopened. Dev banner shows when the backend has no engine identity. |

I also ran the new app against the **Phase 2 backend**:

- the dev banner appears;
- Back + Core Different Workout now says "There isn't another version of this workout today." instead of flashing.

## QA

| Suite | Result |
|---|---|
| Backend V3 pytest (on your machine) | **118 passed**. That is 96 existing (32 Phase 1/2, including the Strength, Sweat and Athletic frozen parity suites, plus 64 Phase 2.5) and 22 new in `test_phase2_6.py`. |
| Phase 2.6 backend tests | Version endpoint and envelope engine stamp; Chest / Back / Quads / Hamstrings / Glutes through the app's exact request (Custom Target, that muscle only, `selection_source=target`, persisted); Chest has no triceps work; Custom Target Different Workout over HTTP ×3 (≥50%, never identical, GET returns the same); explicit type and MOOD's Pick rotation over HTTP for all Directions; live Hybrid ×5; no confirmation lines and ≤4 lines; teaser rules |
| Unified QA | **0 failures** |
| Frozen fixtures | **Unchanged.** No fixture was regenerated in 2.6. |
| Frontend logic | Phase 2 suite **632 / 0**; Phase 2.6 suite **211 / 0** (`frontend/qa/v3/logic`) |
| E2E flows A to H + guards | **13 / 13 PASS** |
| Typecheck | 86 errors = baseline. Normalized file:code diff: **no new errors**. |
| Expo iOS export | **Success** (16.3 MB, contains the new screens) |

**Intentional test changes:**

- In `test_phase2_5.py`, `core_last` is now folded into the `allocation` line (your copy: "…with Core saved for the end").
- In the Phase 2 frontend suite, "every pack case has ≥1 Built for Today line" now allows zero for engine 2.6, per item 22.

## Device Checklist

First, restart the backend with `--reload` and run `./dev-v3.sh`. It should print "✓ Backend engine 2.6". Then check:

1. Open MOOD: tap Build without changing anything. Is it obvious what you are about to get from the line above the button?
2. Change → Chest → Done → Build. Is the Preview titled "Chest" with only chest movements? The Metro log should show `ask=strength target=["chest"] type=-` → `strength_custom_target src=target`.
3. On that Chest workout, tap Different workout twice. Does the list stay visible while it builds, then clearly change with a "New Chest workout · k of 5" toast?
4. MOOD's Pick → Different workout. Does the title change to a new type?
5. Sweat → Change → Hybrid (with Irritated). Is there one HYBRID block plus a short finisher, around 45 min, and no Complement?
6. Can you tell in 3 seconds what the Preview is asking you to do? Does Details feel optional rather than required?
7. Kill and reopen the app. Does READY TO GO reopen the same workout?

## Known Issues

- **Your Mac backend must be restarted once** (see above). Until then the app shows the red dev banner and old output.
- **Phase 2 pack fixtures are old snapshots.** The 24 Phase 2 cases in `utils/dev/v3PackFixture.json` predate 2.5/2.6 (e.g. W3 Hybrid with a Complement, "You picked" lines). The `p25_*` / `p26_*` cases show current behavior. It is a dev-only viewer.
- **Title ambiguity for multi-muscle Targets.** For a multi-muscle Target routed to an archetype (e.g. Chest + Triceps → Upper Push), the Preview title is the Target label ("Chest + Triceps"). The type appears in Details.

## Deferred

Phase 3+ only:

- guided session player, timers, set logging, completion;
- in-session swap and Different Workout;
- post-session feedback.

## Recommendation

**READY FOR PHASE 3**
