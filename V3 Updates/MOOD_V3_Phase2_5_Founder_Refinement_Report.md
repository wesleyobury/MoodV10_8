# MOOD V3 Phase 2.5 Founder Refinement Report

Branch: `feature/mood-v3-app-rehaul`. Scope: the approved founder workout + UX refinement pass. Phase 3 (guided sessions) was not started.

## 1. Git

| Commit | Content |
|---|---|
| `de5b7969` | Backend: role-weighted Custom Target, Core last, single-muscle routing, Different Workout (Custom Target variation, protected primary, MOOD's Pick rotation, `selection_source`), Sweat Hybrid as one block, Built for Today rewrite, fixture updates, 64 new tests |
| (this checkpoint) | Frontend: session-type picker (Home + Preview), compact Workout Preview, Details / Built for Today screen, Different Workout UX, analytics, dev pack viewer Preview/Details toggle, 8 Phase 2.5 pack cases, this report |

Not committed on purpose: `frontend/.env` (local dev IP from `dev-v3.sh`). `.env.development` is gitignored.

## 2. V2 rules ported

Only the rules approved in the reconciliation were carried over, as V3-native deterministic logic. There is no V2 import, no V2 generator call and no randomness.

- **Role-weighted muscle allocation.** V2's "big muscles get more work" idea now lives in `audit_engine.CT_SIZE` / `ct_role`. It uses V3 roles (major / minor / core) and V3 set bands.
- **Core last.** V2 ordered core work at the end. V3 enforces it in the Custom Target block order key: role rank major → minor → core.
- **Isolation core when combined.** V2's "direct ab work" became a V3 rule: when Core is combined with other Targets, the core slots are trunk isolations, and no carry can lead.
- **Variety on regenerate.** V2 used `Math.random`. V3 now uses the displayed chain, completed recency, `swap_count` and a deterministic md5 seed (`user|date|target|swap|exercise`).

## 3. Custom Target

**Routing.** These single-muscle Targets now build a Custom Target instead of an archetype. The removed routes are recorded in `adapter.ROUTING_REMOVED_PHASE_2_5`.

| Target | Before | After |
|---|---|---|
| Chest | Upper Push | Custom Target |
| Back | Upper Pull | Custom Target |
| Quads | Lower Squat | Custom Target |
| Hamstrings | Lower Hinge | Custom Target |
| Glutes | Glutes + Legs | Custom Target |
| Biceps | Arms | Custom Target |
| Triceps | Arms | Custom Target |

Unchanged:

- Core alone still routes to `strength_core`.
- Multi-muscle archetype routes are unchanged (tested):
  - Chest + Triceps → Upper Push;
  - Back + Biceps → Upper Pull;
  - Glutes + Hamstrings → Lower Hinge;
  - Quads + Glutes → Glutes + Legs.

**Allocation (exercises per muscle).** The set band remains the final guard, so a build never overstuffs.

| Targets | 60 min | 30 min |
|---|---|---|
| 1 muscle | major 5 / minor 4 / core 4 | 3 |
| 2 muscles | major 3 / minor or core 2 | major 2 / minor or core 1 |
| 3 muscles | 2 each | 1 each |

**Order and core:**

- Blocks run major → minor → core.
- Core combined with other Targets uses direct trunk isolations. No carries.

**Before → after:**

| Case | Before | After |
|---|---|---|
| Back + Core 60 | 4 exercises, core first (Farmer Carry, Ab Wheel, Assisted Pull-Up, Cable Pullover), 30 to 35 min; Different Workout identical | 5 exercises (e.g. Pendlay Row, Straight-Arm Pulldown, Single-Arm Lat Pulldown, Dead Bug, Hanging Knee Raise), 15 sets, about 40 min, core last; Different Workout changes 5 of 5 |
| Back + Core 30 | 2 exercises | 3 exercises, 8 sets, 20 to 25 min |
| Chest alone | Upper Push, identical to Chest + Triceps | 5 chest movements; Different Workout changes 4 to 5 of 5 |
| Shoulders alone | 3 exercises | 5 exercises; Different Workout changes 5 of 5 |

## 4. Different Workout

The session carries `selection_source` (`moods_pick` / `user_selected` / `target`) in the persisted state and the envelope, so Different Workout behaves differently for each:

| Source | Behavior |
|---|---|
| `moods_pick` | May change the archetype. It rotates to the next archetype not yet shown today, using the goal/frequency rotation first and staying soreness-aware. It accepts a result only if the archetype actually differs. The chain is capped at 12. |
| `user_selected` | Keeps the archetype. Exercises change. The protected primary may change on Different Workout only (Rule 7); normal next-session continuity is kept. |
| `target` | Keeps the Target. Custom Target variation: at least 50% of exercises change when the pool allows, and the result is never identical. If no different build exists, the API returns a `no_alternative` conflict instead of the same workout. |

**Observed sequences (deterministic):**

- MOOD's Pick Strength: Glutes + Legs → Upper Pull → Upper Push → Lower Squat → Upper Body.
- MOOD's Pick Sweat: Circuit → Hybrid → Engine.
- MOOD's Pick Athletic: Full-Body → Power → Speed + Agility.
- Explicit Lower Squat: 4 of 5 exercises change each time. The primary moved at least once in 3 swaps.

**UX:**

- Different Workout regenerates and stays on the Preview, and scroll resets to the top (verified: scrollTop 47 → 0).
- A highlighted note makes the result obvious:
  - "New type: Upper Pull → Lower Body: Squat" when the archetype changed;
  - "Same Lower Body: Squat setup · 4 of 5 exercises changed" when it did not.
- A hint under the button says what will happen: "MOOD may pick a different type." / "Keeps your Target and changes the exercises." / "Keeps X and changes the exercises."
- Explicit constraints are preserved: States, soreness, duration, equipment and Target all ride on the stored request.

**Swap Exercise** stays slot-level and separate. It lives on Details and uses the same `/swap-exercise` endpoint. A swap made on Details shows on the Preview when you go back (verified).

## 5. Archetype Picker

The picker is a lightweight bottom sheet (`ArchetypeSheet`) with MOOD's Pick first as the default. Options mirror the backend registry (`formatter.ARCHETYPE_NAMES` / `normalize.ARCHETYPES`); a cross-check found 14 of 14 names matching.

| Direction | Options |
|---|---|
| Strength | MOOD's Pick, Upper Push, Upper Pull, Upper Body, Lower Body: Squat, Lower Body: Hinge, Glutes + Legs, Full Body, Arms |
| Sweat | MOOD's Pick, Circuit, Engine, Hybrid |
| Athletic | MOOD's Pick, Power, Speed + Agility, Full-Body Athlete |

Strength Core and Custom Target are not in the list. They are reached through the Target control.

- **On Home:** a TYPE row sits above TARGET.
- **On the Preview:** the TYPE row regenerates with the same States, soreness, length and equipment. The new workout replaces today's entry, and the URL id is updated.
  - If the new type conflicts with soreness, the standard Conflict sheet appears. Its options re-generate with the API's patch.

**Target vs type rule (item 8):** they answer different questions, so only one can be set.

- Picking a type clears the Target. The sheet says so: "Picking a type replaces your Target (Chest)."
- Picking a Target sets the type back to MOOD's Pick. The TYPE row then reads "Built from your Target".
- Target "None" leaves an explicit type alone.
- Changing Direction clears both.
- Athletic has no Target, so TYPE is its only focus control.

## 6. Sweat Hybrid

Hybrid is now one coherent anchor-circuit block:

- Hybrid band: 60 → 36 to 46 min; 30 → 20 to 28 min.
- Primary cap: 34 min at 60 and 20 min at 30.
- The Complement is skipped. A small complement is added only if the build would land more than 3 min under the band floor at 60, and it is logged with its reason.
- The 30-min backfill is skipped.
- State volume is capped at the band maximum.
- Finishers (Amped, Irritated) are kept inside the band.

| Case | Before | After |
|---|---|---|
| Intermediate 60, no State | 45.0 min, 9 exercises: Hybrid 5 rounds (Treadmill Run 500 m anchor; Sled Push, Suitcase Carry, Burpee, Goblet Squat, Plate Push) + Complement circuit 3 rounds (Push-Up, Wall Ball, Dead Bug) | 39.0 min, 6 exercises: one Hybrid block, same anchor and stations, 6 rounds, 26 min; no Complement |
| Amped 60 | 54.1 (Complement + Finisher) | 43.1 |
| Irritated 60 | 51.0 | 44.6 (Finisher kept) |
| All 30-min cases | 22 to 27.5 with Complement | 22 to 27.5, no Complement |

The grid of 3 levels × 2 lengths × 5 States (30 builds) is always one anchor block with no Complement, and the estimate stays within the band maximum.

## 7. Workout Preview

New flow: Home → Build → **Workout Preview** (`/v3/workout`) → Start Workout (the `/v3/session` placeholder, unchanged). From the Preview there is also a path to **Details** (`/v3/details`).

The Preview is compact:

- Eyebrow: Direction and duration.
- Title (plus the Target label when one was chosen), and exercise count.
- TYPE row.
- Structure sections.
- A Built for Today teaser card.
- Different Workout.
- Start Workout (sticky).
- A "Details" pill in the top bar.

Structure rendering comes from `utils/v3PreviewFormat.ts` (pure, tested) through `components/v3/PreviewSections.tsx`:

| Structure | Preview |
|---|---|
| straight | `STRAIGHT SETS` (consecutive blocks merged) |
| superset | `SUPERSET · 3 rounds`, rows tagged A1 / A2 (B1 / B2 for the next) |
| circuit | `CIRCUIT · N rounds` |
| anchor_circuit | `HYBRID · N rounds`, caption "Treadmill Run every round, then that round's station"; ANCHOR row + stations with "Round 2" / "Rounds 1 + 6" / "Every round" |
| emom / intervals / timed_circuit / continuous | `EMOM · 10 min`, `INTERVALS · N rounds`, `TIMED CIRCUIT · N rounds` (with "30 s on / 15 s off per station"), `CONTINUOUS · ~22 min` |
| pyramid / ladder / finisher | `PYRAMID`, `LADDER`, `FINISHER · N rounds` |
| exposure | `ATHLETIC EXPOSURE` (merged), each row with one essential quality cue (the stop rule, e.g. "End the set when distance drops or you cannot stick the landing.") |
| repeats / support | `REPEAT EFFORTS · N rounds` with cue, `PERFORMANCE SUPPORT` |

Complement and Finisher blocks show their title as a caption.

## 8. Built for Today

**Details** (`/v3/details`) is the rich Overview, moved off the Preview. It contains:

- the header model;
- the warm-up;
- every block with cues and progression;
- Swap Exercise;
- the cool-down;
- Start Workout.

Header model inside the Built for Today card, all from the API:

- **TODAY:** what you told MOOD (Direction, States, "Sore legs", Target or type, "60 min").
- **MOOD CHOSE:** "Strength · Lower Body: Squat" or "Custom Strength: Back + Core", plus who chose it: "MOOD's Pick" / "You picked it" / "Built from your Target".
- **BUILT FOR TODAY:** at most 6 deterministic lines, each tied to a real generator event or input. Examples:
  - `allocation`: "Back gets 3 movements and Core 2."
  - `core_last`.
  - `target`: "You chose Chest, so all 5 movements train chest."
  - State lines backed by what the generator actually did (Amped burnout finisher, Low Energy set off the last accessory, etc.).
  - `rotation_swap`: "You asked for a different workout, so MOOD's Pick moved from Upper Pull to Lower Body: Squat."
  - `different_workout`: "k of n exercises changed, same X setup."
  - `duration`, `experience` (beginner only), `equipment`, `progression`, `swap`.

No fake personalization:

- Goal lines appear only on the first session of the rotation and only for known goals.
- Target sessions make no profile claims (tested).
- All lines pass the existing `explain.lint`.

## 9. Frozen behavior intentionally changed

| Fixture / rule | Change | Why |
|---|---|---|
| `tests/frozen/MOOD_V3_Strength_QA_Results_v6.json` | Only tier2b (swap) changed: swap variation 45 HEALTHY (was 39 + 6 limited); protected primary stable on swap 12/45 (was 45/45) | Rule 7: the primary may change on Different Workout. Normal continuity unchanged (no other tier moved). |
| `MOOD_V3_Sweat_QA_Fixtures_FINAL.json` | `reference_signature` of 4 Hybrid fixtures (W03, W03b, W06, W10) | Hybrid is one block, no Complement. Summary counts identical (672 builds, 0 hard fails, 0 soft band). |
| `MOOD_V3_Sweat_QA_Results_FINAL.json` | Regenerated in a fresh output dir | Same reason |
| `adapter.ROUTING` | 7 single-muscle rows removed | Item 3 |
| `qa/run_unified_qa.py` | Explanation-line cap 5 → 6 | Built for Today can now carry allocation + core_last + state + duration + progression |
| `utils/dev/v3PackFixture.json` | +8 Phase 2.5 cases (`p25_*`); the 24 Phase 2 cases are untouched | Visual QA of new behavior |

Previous copies are kept in `tests/frozen/pre_phase2_5/`. No validator was weakened.

## 10. QA

| Suite | Result |
|---|---|
| Backend pytest (`mood_v3/tests`) | **96 passed** (32 existing + 64 new in `test_phase2_5.py`) |
| Frozen parity (`test_frozen_parity.py`) | pass, against the updated fixtures |
| Unified QA (`run_unified_qa.py`) | **0 failures** |
| Frontend logic, Phase 2 suite | **555 checks, 0 failures** |
| Frontend logic, Phase 2.5 suite | **132 checks, 0 failures**. Covers registry mirrors, the type/Target rule, the request helpers, every structure label, A1/A2, the Hybrid anchor and round notes, Athletic cues, every pack case rendering every item exactly once with no empty sections or junk text, and the `today` header. |
| Web visual harness (react-native-web + Playwright, real router + dev server) | 14 flow screenshots + 32 pack cases × Preview/Details, **0 page errors** |
| Typecheck | 86 errors = baseline (normalized file:code diff: **no new errors**) |
| Expo iOS export | **success** (16.2 MB bundle, contains the new screens) |

The flow run confirmed:

- Home TYPE row, sheet options, type → summary line.
- Lower Squat Preview; Different Workout keeps the type with 4/5 changed and resets scroll.
- Preview type change to MOOD's Pick; Different Workout then rotates to a new type.
- Details header, and exercise swap visible back on the Preview.
- Chest Target: TYPE reads "Built from your Target"; Preview reads "Target: Chest"; Different Workout gives 4/5 changed.
- Sweat Hybrid, Sweat Circuit, Athletic (no Target row; Different Workout rotates Full-Body → Power), and Strength with a State.

Analytics events fire:

- `v3_archetype_changed` (surface, from, to, cleared_target) and `v3_archetype_change_result`;
- `v3_preview_viewed`;
- `v3_details_opened`;
- `v3_swap_workout_result` with `archetype_changed`, `exercises_changed` / `exercises_total` and `selection_source`.

## 11. Device testing

Not run on a physical device from this session. What was verified:

- the web harness above (same components, react-native-web);
- the iOS bundle export.

To check on your phone with the dev build (`./dev-v3.sh`), run through:

1. Home: TYPE → Lower Body: Squat → Build. The Preview shows STRAIGHT SETS.
2. Different workout: it stays on the Preview, the note reads "Same Lower Body: Squat setup · k of 5 exercises changed", and it scrolls to the top.
3. TYPE → MOOD's Pick, then Different workout: the note reads "New type: A → B".
4. Details (the pill or the Built for Today card): TODAY / MOOD CHOSE / BUILT FOR TODAY. Swap one exercise, go back, and confirm the Preview shows it.
5. Home: Target Chest → TYPE shows "Built from your Target". Build: 5 chest movements.
6. Sweat → TYPE Hybrid → one HYBRID block with an ANCHOR row.
7. Athletic: ATHLETIC EXPOSURE with one cue per movement.

## 12. Known issues

- **Type change on the Preview makes a new workout id.** Changing type is a new `/generate`, so the earlier workout stays persisted but unreferenced (today's entry points to the new one). This is harmless and matches Home behavior.
- **Older pack case W3 is out of date.** The 24 Phase 2 pack cases are frozen snapshots, so W3 still shows the pre-2.5 Hybrid with a Complement. The `p25_hybrid_*` cases show current behavior.
- **Built for Today can be short.** After a MOOD's Pick rotation with no States it can be a single line (the rotation line), because only lines backed by real events are emitted.
- **Thin exercise pools.** A thin pool (e.g. Calves alone, minimal equipment) can return `no_alternative` on Different Workout. The Preview shows the API message and keeps the current workout.
- **Hermes check pending.** `essentialCue` avoids regex lookbehind for Hermes safety. It was verified in Node and the web harness only.

## 13. Deferred (scope guard, item 24)

Deferred, in line with item 24:

- timers, set logging, completion from the Preview (Phase 3);
- body-map;
- new exercise library, States or Directions;
- new progression or goal prescriptions;
- wearables;
- equipment overhaul;
- notifications.

No V2 generator dependency and no randomness were introduced.

## 14. Recommendation

**READY FOR PHASE 3**, after your on-device pass of the 7 steps in section 11. Phase 3 was not started.
