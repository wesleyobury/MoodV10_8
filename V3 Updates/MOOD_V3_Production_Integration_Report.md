# MOOD V3: Production Integration Report (2026-09-24)

**Recommendation: READY FOR APP INTEGRATION.** All three frozen Directions now run behind one production entry point in the backend. Every frozen Direction QA reproduces byte-identical. The new integration QA is green, and no genuine launch blocker came up. The next step is frontend work against `/api/v3`.

Code: `MoodV10_8/backend/mood_v3/` (79 files). API contract: `backend/mood_v3/CONTRACT.md`. Evidence: `backend/mood_v3/qa/results/`.

---

## 1. Integration inspection

**How production works today (V2.1).** Workouts are generated on the phone. `frontend/utils/workoutGenerator.ts` shuffles pre-authored mini-workouts from about 20 static `data/*.ts` files into "carts" with `Math.random`, keyed to the old mood cards. The backend only records the result:
- `POST /choose-for-me/generate` saves the carts;
- `POST /user-workouts` logs a completion;
- `workout-snapshots` persist carts.

Exercises exist only as names inside `battlePlan` text, with an optional structured `plan`. Media and cues live in Mongo `db.exercises`. There is no exercise identity, no per-exercise history, and "swap" means moving to the next pre-generated cart. None of the V2 generation logic carries into V3.

**Frozen V3 path.** Strength v6, Sweat FINAL v4 and Athletic v1 are deterministic Python reference generators with independent validators. I re-ran every frozen QA before changing anything:
- Strength: 237/237 fixtures and 237/237 reference match.
- Sweat: results JSON byte-identical.
- Athletic: grid hash `a874e39c`, 0 revalidation failures.

**Gaps**
1. The generators were QA scripts: hard-coded paths, `sys.path` imports, and two modules both named `sweat_data`.
2. Inputs differed across Directions: history order and shape, preset names, soreness vocabulary, and State given as a scalar or a list.
3. There were three unrelated output shapes.
4. **Strength implemented only one State.** SD v5 multi-State was never wired into Strength. Strength also had no Custom Target prescription path and no MOOD's Pick archetype resolver.
5. There was no exercise-level swap for Strength or Sweat.
6. There were no explanations, cues or progression output.
7. `openpyxl` was missing from the backend requirements.

**Approach.**
- Vendor the frozen engines, changing only file paths and imports. Every changed line is listed in `engines/VENDOR_PATCHES.md`, and parity is proven by tests.
- Put a thin adapter per Direction on top.
- Add one shared contract and formatter, a template explanation layer, a launch cue layer, conservative progression and a FastAPI router.

## 2. Implementation report

**Created** (`backend/mood_v3/`)

| Area | Files |
|---|---|
| Frozen engines (vendored) | `engines/strength/{audit_engine,qa_engine,prescription,structure}.py`, `engines/sweat/{sweat_data,sweat_gen,sweat_validate}.py`, `engines/athletic/{athletic_gen,lib3,lib2,athletic_lib,audit2,sk5,sweat_shared_data}.py`, `data/` (Strength Library v11, WA FINAL_FREEZE v17, ET FINAL_FREEZE v12) |
| Adapters | `engines/strength/adapter.py`, `engines/sweat/adapter.py`, `engines/athletic/adapter.py`, `engines/state_rules.py` |
| Shared layer | `normalize.py`, `service.py`, `formatter.py`, `render.py`, `explain.py`, `cues.py`, `progression.py`, `router.py`, `paths.py` |
| Tests and QA | `tests/test_frozen_parity.py`, `tests/test_integration.py`, `tests/test_router.py`, `tests/harness/*` (the frozen QA harnesses with import edits only), `tests/frozen/*` (frozen fixtures and results), `qa/run_unified_qa.py`, `qa/sample_pack.py`, `qa/results/*` |
| Docs | `README.md`, `CONTRACT.md`, `engines/VENDOR_PATCHES.md` |

**Changed**
- `backend/server.py`: 1 import and 1 `include_router` line (mounts `/api/v3`). Your existing uncommitted edits in that file are untouched.
- `backend/requirements.txt`: added `openpyxl==3.1.5`.

**Retired or replaced: nothing yet.** The V2 client generator and `/choose-for-me` stay live until the V3 screens ship, so the current app keeps working. After the V3 frontend launches, `workoutGenerator.ts`, `data/*-workouts-data.ts` and `/choose-for-me/*` can be retired.

**Production flow**
1. `POST /api/v3/workouts/generate`
2. `normalize` (vocabulary, 30/60, max 3 States, presets, Target rules)
3. Resolve Direction (explicit, else training preference, then goal)
4. Direction adapter
5. Frozen generator
6. Frozen validator(s), with a deterministic retry, else an explicit conflict
7. Shared formatter
8. Built for Today, cues, exact-exercise progression and media
9. Store in `db.v3_workouts` and return

Engine calls run in a worker thread, behind a lock, because the frozen code keeps module-level state. Generation takes 1 to 11 ms (about 2.5 s once, at first import).

## 3. Unified input contract

`POST /api/v3/workouts/generate` takes:
- **Required:** `direction`
- **Optional:**
  - `states` (0 to 3 of low_energy, stressed, bored, irritated, amped, sore)
  - `soreness` (legs, chest, back, upper_back, lower_back, shoulders, arms, core, or muscle ids; soreness adds the Sore State)
  - `target` (Strength and Sweat: 1 to 3 muscles or `full_body`)
  - `archetype` (an explicit archetype, else MOOD's Pick)
  - `duration` (30 or 60)
  - `experience`
  - `goal`
  - `equipment` (commercial_gym, free_weight_limited, minimal)
  - `training_frequency`
  - `training_preference`
  - `date` (the user's local date, which seeds same-day determinism)
  - `persist` (false = live home-card preview)

Swap context is carried by the stored workout: `swap_count`, the swap chain and the exercises already shown per item. History comes from completed V3 workouts. Unsupported input returns 422 with the field and a message (for example duration 45, 4 States, or a muscle Target on Athletic). Full field list in `CONTRACT.md`.

## 4. Unified app-facing output contract

It's one envelope for every Direction and every endpoint:

`{schema_version, status: ok | conflict, outcome: valid | valid_with_relaxation | rerouted | conflict, workout, conflict}`

**`workout` fields**
- workout_id, version
- direction, archetype, requested_archetype
- target (mode and label)
- duration (requested, estimated, display)
- experience, states, soreness, equipment
- built_for_today, warmup, blocks, cooldown
- relaxations, adjustments (the generator decision log, WA "adjustment" objects)

**Blocks and items**
- `block`: type, structure, title, rounds, rest, interval / effort (Sweat), instructions, items.
- `item`: a stable `item_id`, `exercise` (id, name, equipment, primary muscles, media), a `prescription` (kind, sets, reps / scheme, seconds, distance, calories, rest, RIR / RPE, load_guidance, and a ready-to-render `display`), `cues`, `quality_stop`, `swap` and `progression`.

**Direction-specific fields.** These are limited to `prescription.direction_fields`:
- Strength: slot class, protected.
- Sweat: SC5 progression basis, role, anchor-station rounds.
- Athletic: Type A / B, quality, Performance Support purpose and why.

The frontend needs one renderer. Sweat's interval and anchor fields and Athletic's quality-stop line are the only Direction-aware bits.

## 5. Direction routing behavior

`service.generate_workout` routes to the Direction's frozen logic. There is no shared workout algorithm.

**Strength**
- **Explicit Target** uses WA TARGET ROUTING (exact set match, else Custom Target).
- **MOOD's Pick** follows the WA COLD START deterministic resolver:
  - 1-2 days/week gives Full Body;
  - 3-4 days/week uses the goal-ordered rotation, taking the first archetype not yet completed, then the least recently completed;
  - 5+ days/week adds Lower Hinge and Arms.
- Frozen S1 dependency and RR1-RR3 reroute handle soreness.
- **New (MOOD's Pick optimizes):** when the equipment cannot build the picked archetype, the next one in the rotation is used and logged as `archetype_skipped_equipment`, which mirrors Sweat. Explicit choices still surface the conflict.
- **Multi-State (new, SD v5):** it uses the frozen SD v5 resolver (already implemented in Sweat).
  - Complexity cap binding: the resolved C, clamped to plus or minus 1.
  - Selection bias: each State's frozen predicate is summed, with the named-pair ownership rules (Bored owns originality over Stressed; Low Energy guards systemic cost before Irritated / Amped).
  - Structure owner, in order: Low Energy, then Stressed, then Irritated, then Bored + Amped, then Amped, then Bored.
  - Dials come from the resolved V / E / X, including Priority-1-only effort for Low Energy + Amped.
  - With 0 or 1 State, or Sore + one State other than Amped, the frozen single-State path runs unchanged.
- **Custom Target:** frozen `compose_custom`, with sets from the target_block band (raised toward the band floor where the band allows), straight sets, and the frozen CT checks.

**Sweat.** The frozen `generate` picks the archetype (goal rotation, State affinity, history), handles `force_archetype` and Target, including routing to Circuit. Swap Workout chains use the frozen displayed-chain convention.

**Athletic.** The frozen `build` handles MOOD's Pick rotation, the sore-legs reroute to Power / Full-Body, Type A / B dosing, the 3 to 4 component warm-up, optional Performance Support, no Trunk slot, 10 m acceleration maximum and no treadmill. Goal mapping follows WA GOAL MAPPING: build_strength and build_muscle map to get_stronger.

## 6. Built for Today

Built for Today is template-based and deterministic (`explain.py`). A line is emitted only when its input or generator event exists.
- It shows at most 5 lines.
- Priority order: soreness or reroute, then States (a named SD pair replaces its two single lines), then Target / archetype / rotation, then equipment and honest duration, then swaps.
- It uses your State wording, with Direction-true variants where the generic line would overclaim. Athletic Amped reads "more quality efforts, never at the cost of speed."
- A style lint (no "easier", "reduced" or "lower") is enforced by tests. This meant rewording "Lower-systemic-load" to "Stable, efficient movements…".

Examples from the sample pack:
- "With sore legs, today moved to Upper Push."
- "Fresh movements inside a simple, steady structure: something new without the chaos."
- "You hit every rep at 100 kg last time. Try 105 kg today." (This one is a progression line.)

## 7. Cue implementation

`cues.py` is the minimum launch layer, by priority:
1. About 30 Olympic and explosive movements (snatch, cleans, jerks, push press, landmine power, KB swing / snatch, loaded and depth jumps, sprints, throws).
2. An Athletic quality-stop rule for **every** quality class (jump height or loud landings, bar speed, throw snap or distance, stick quality, sprint slowing). Every Athletic exposure carries one; QA enforces this.
3. Unusual movements (Nordic, Copenhagen, reverse Nordic, Pallof, Turkish get-up, sled work, carries).
4. Misunderstanding-risk lifts (squat, bench and hip-thrust safety cues).

Everything else falls back to the existing `db.exercises.cues`, attached with the media. Strength effort guidance is rendered from RIR, and Sweat guidance comes from the frozen `cue_for`. No rewrite of basic-exercise cues was needed.

## 8. History and progression

**Launch-ready**
- Completed V3 workouts (`POST /{id}/complete`) feed each engine's native history format:
  - Strength and Sweat: oldest first;
  - Athletic: newest first.
- Strength protected-primary continuity: Upper Push kept the same primary across 8 sessions, while accessories rotated (33% overlap with the previous session).
- MOOD's Pick rotation in every Direction, verified over 8-session runs:
  - Strength: Glutes + Legs, Upper Pull, Upper Push, Lower Squat, Upper Mixed…
  - Sweat: Circuit, Engine, Hybrid…
  - Athletic: Full-Body Athlete, Power, Speed + Agility…
- Non-protected recency.
- Exact-exercise progression:
  - **Strength**, and Athletic Performance Support: when every logged set hit the prescribed reps, suggest the smallest practical increment (2.5 / 5 kg by region, 2 kg dumbbells, 4 kg kettlebell, or lb equivalents). Otherwise hold. Low Energy today means hold ("see how it moves"). No history means nothing is shown. A rep target that differs from last time gets a reference only.
  - **Athletic loaded exposures:** last load only, plus "go up only if every rep stays fast".
  - **Sweat:** reuse the resistance load and show the last output. Never a numeric push (SC5).

**Deferred (post-launch)**
- RIR / quality capture.
- Rep progression inside the band.
- State-aware up and down load suggestions.
- Pace and output targets.
- Recovery decay and the body map.

## 9. Swap behavior

**Exercise swap** (`POST /{id}/swap-exercise`). Each Direction uses its own frozen candidate pool and ranking for the same slot, then revalidates the whole workout.
- **Strength:** same slot, with frozen `candidates` and `rank` including the swap-chain penalty. Every composition constraint is re-checked, and both frozen validators must pass. Explicit swaps may change a protected primary, as WA allows. ATD partner handling and finisher swaps are supported.
- **Sweat:** same block, role and eligibility slot. The frozen hard filters (equipment, experience, State cap, soreness, impact) and ranking apply, the dose comes from the frozen `station_dose`, and the frozen validator (SC1-SC5, I1-I6, J1-J6, firewall) must pass.
- **Athletic:** exposures go back through the frozen `ranked` and `compatible` checks and are re-assembled by the frozen `assemble`. QC and Performance Support use the frozen `pick_qc` / `pick_ps`. The frozen checker must pass.

For all three:
- Exercises already shown for that item are excluded, so a second swap never returns to the first.
- If nothing fits, the response is `no_alternative` and the workout is unchanged.

**Swap Workout** (`/swap-workout`) keeps Direction, Target, duration, States, soreness and equipment, and adds 1 to `swap_count`, using each frozen chain.

Swaps are replayed deterministically from stored inputs and a history snapshot, with a fingerprint check. After a generator deploy, an old workout returns `409 workout_outdated` instead of a silently different workout.

## 10. Conflict and reroute behavior

The four outcomes:
- `valid`
- `valid_with_relaxation`, with a logged frozen relaxation code
- `rerouted` (MOOD's Pick soreness reroute, with the requested archetype shown)
- `conflict`

Conflict codes:
- `sore_target_conflict`
- `equipment_insufficient`
- `cannot_build`
- `no_alternative` (swap only)
- `generation_failed` (never observed)

Every conflict carries options with a ready request patch: Let MOOD pick, Change Target, Try Strength / Sweat / Athletic, Use full gym equipment. Verified cases:
- **Explicit Speed + sore legs:** conflict.
- **MOOD's Pick Athletic + sore legs:** rerouted to Power.
- **Sore legs + minimal Athletic:** conflict with "Try Strength, Try Sweat, Use full gym equipment".
- **Strength MOOD's Pick + sore quads:** Lower Hinge (frozen RR).
- **Explicit Chest + sore chest:** trained, per the frozen S2a override (it's explained to the user).
- **Sweat Hybrid on minimal:** conflict.

MOOD's Pick with no soreness never conflicts on any preset (QA-enforced).

## 11. End-to-end QA results (`qa/run_unified_qa.py`): ALL GREEN, 0 failures

**A. Grid: 8,424 production-path builds**
- Coverage: Direction × 18 State sets (none, all 6 singles, 11 pairs and triples including Sore) × 30/60 × 3 levels × 3 equipment presets × every Strength archetype plus 5 Target forms, every Sweat and Athletic archetype, and MOOD's Pick. Sore State cases used sore shoulders for Strength, legs for Sweat and chest for Athletic.
- Per build, QA checked:
  - schema and ready-to-render displays;
  - sore-primary exclusion;
  - Direction identity (Strength resistance with RIR; Sweat structures and SC2; Athletic has no treadmill, 10 m acceleration maximum, quality-stop on every exposure, a 2-4 item warm-up and no Trunk);
  - State invariants per Direction (Strength Low Energy is straight sets; Stressed has no circuits; Normal 60 is straight sets; Sweat Low Energy has no finisher; Athletic has no QC on Low Energy, Beginner or 30 min, and no third exposure at 30);
  - an explanation line for every selected State;
  - banned words;
  - estimated duration;
  - formatter output equal to engine composition.
- Outcomes:

| Direction | valid | valid with relaxation | conflict |
|---|---|---|---|
| Strength | 3,172 | 1,125 | 887 |
| Sweat | 1,428 | 180 | 336 |
| Athletic | 1,024 | 272 | 0 |

- Where conflicts come from:
  - Commercial-gym conflicts are only the designed explicit sore-Target cases.
  - Strength limited-equipment conflicts come from explicit Targets or archetypes that need machines, cables or a bar. For example Upper Pull on minimal equipment, and Custom Targets whose limited-equipment pool yields under 2 exercises. The second is a new integration guard: a 1-exercise session is never shipped.
  - Sweat equipment conflicts are the frozen forced-archetype infeasible cases.

**Remaining sections**
- **B. History:** 8-session runs per Direction plus a fixed Strength archetype. No failures, rotation and continuity as described in section 8.
- **C. Swaps:** every item of 25 sample workouts across all archetypes, States and soreness. 131 valid swaps and 2 honest `no_alternative`. Direction, archetype and slot or role are preserved every time, and primaries stay compound. 128 second swaps never returned the original. 25 Swap Workout chains of depth 2 all valid.
- **D. Conflicts:** 12 of 12 designed cases.
- **E. Progression:** increase / hold / Low Energy hold / unseen exercise shows nothing / Sweat reuse, all as specified.
- **F. Negative tests:** 6 of 6 intentionally bad workouts caught by the frozen validators (wrong-slot exercise, sore primary, Sweat 600 s passive rest, primary block not first, Athletic Type A overdose, treadmill in Athletic).
- **G. Determinism:** 3 of 3 identical.

**Router tests (6/6):** generate, swap, get, swap-workout, complete, history, progression on the next session, conflict, 422s, preview not persisted, ownership 403, and every item swappable or explicitly not.

## 12. Regression results for the three frozen Directions (all identical)

| Test | Result |
|---|---|
| Strength frozen QA replayed on the vendored engine **with WA v17 / ET v12** | Byte-identical to the frozen v6 results: 237/237 fixtures, 237/237 reference match, 78/78 Custom Target, T2A 90/90, T2B 39 healthy / 6 limited / 0 violations, T3 144/144, T4 237/237. This proves the shared-taxonomy update changed no Strength eligibility. |
| Sweat frozen QA replayed | Results JSON and fixtures byte-identical (672 grid, 41/41, 0 violations) |
| Athletic frozen QA replayed | Byte-identical (1,728 builds, grid hash a874e39c, 0 revalidation failures, all_green); all 19 frozen negative and control validator cases behave as expected (17 reject, 2 accept) |
| Production adapters vs frozen generators | Strength 237/237 fixture compositions identical; Sweat 41/41 signatures identical; Athletic 288/288 builds identical |

All 16 tests also pass on your machine against the installed package (router and integration in 8.4 s, parity in 9.7 s).

## 13. 15-workout production-output pack

`backend/mood_v3/qa/results/MOOD_V3_Production_Output_Pack.json` holds the exact response bodies. `.md` is a readable digest.
- **Strength:** 5 workouts (MOOD's Pick Normal; Chest + Triceps Amped; Lower Hinge Low Energy 30 Beginner; Arms Bored free-weights; Glutes + Legs Irritated).
- **Sweat:** 5 workouts (MOOD's Pick; Engine Stressed 30 Beginner; Hybrid Irritated Advanced; Quads + Glutes Target Low Energy; Circuit Amped 30 free-weights).
- **Athletic:** 5 workouts (Power; Speed + Agility Bored Advanced; Full-Body Beginner Low Energy, "30–35 min"; MOOD's Pick Amped 30; Power Irritated Advanced).
- **Special cases:** an exercise swap (Incline DB Press to Barbell Incline Press); a 3-State workout (Bored + Stressed + Amped); a sore-legs reroute (Lower Squat to Upper Push); the Athletic sore-legs + minimal conflict; a progression case (100 kg on every set, so 105 kg today with the Back Squat kept as protected primary); and a Built for Today case (Sweat Low Energy + Amped with sore shoulders).

## 14. Remaining launch blockers

**None in the generation system.** Two launch-adjacent items sit outside the generator:
1. **The V3 frontend screens still need to be built** against `/api/v3`: State chips, Direction, Built for Today, guided session, swap, completion logging. The V2 flow is untouched in the meantime.
2. **Exercise media coverage.** Videos come from `db.exercises` by name / alias match. Against the seed file only about 84 of 292 V3 library exercises match (the live DB may hold more). The contract returns `media: null` otherwise, so the app must render without video. Before launch, run a one-time name mapping, or add the missing videos, for the exercises the pack shows most often.

## 15. Post-launch backlog

- Reaction-cue system; dedicated overcoming isometrics; Speed + Agility rename; new archetypes; library expansion; rare equipment; pool optimization (per brief).
- **Strength Core as a standalone 30-min choice** is short by frozen design (Section C: 2 to 4 core exercises, 3 to 4 sets, "about 5–10 min"). It's honest and valid. Consider a founder call on whether Core stands alone at 30 min or gets a floor.
- **Custom Target single-muscle sessions** run short at the frozen block size (3 exercises at 60, 2 at 30). WA allows 3 to 5 and 2 to 4; widening is a founder call. Custom Target has no history rotation (frozen ranking).
- **Strength goal rows.** The frozen prescription uses the Build Muscle row for every goal. Wire the other PRESCRIPTION BANDS rows (Get Stronger, and so on).
- **Strength multi-State structure:** a Stressed + Irritated forceful finisher and a Low Energy + Irritated finisher are currently expressed through selection only, matching Sweat's Extras-off interpretation.
- **Sweat pure-bodyweight preset** (untested in the frozen QA, so not offered), plus learned equipment from "Don't have this?" swaps.
- **Richer progression:** RIR and quality capture, in-band rep progression, state-aware suggestions, pace targets, recovery decay and the body map.
- **Build step** to compile the frozen workbooks to JSON, removing `openpyxl` and the 2.5 s cold import.
- **Explanation copy polish:** "session is complete at about N min" appears on most Athletic 60 sessions (this matches Athletic backlog item 4).
- **Warm-up items** for Strength and Sweat are guidance text, not an item list.

## 16. Recommendation

**READY FOR APP INTEGRATION.**
- Frozen behavior is provably unchanged in all three Directions.
- The unified path is green across 8,424 builds, swaps, history, conflicts and progression.
- Every returned workout has passed its Direction's frozen validator; anything else comes back as an explicit, actionable conflict.

Build the V3 screens on `CONTRACT.md` and run the media-mapping pass. No further architecture work is needed.
