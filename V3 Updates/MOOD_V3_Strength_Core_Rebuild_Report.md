# MOOD V3 Strength Core Rebuild (Phase 1): Report

Option B, Strength only, smallest version that proves the model. Sweat, Athletic, the Cart, media and library enrichment were not touched.

| | |
|---|---|
| Branch | `feature/mood-v3-app-rehaul`, uncommitted working tree (nothing committed or pushed; `frontend/.env` was already modified before this work) |
| Companion files | `V3 Updates/MOOD_V3_Strength_Core_Review_Pack.md` (36 full workouts incl. 10 legacy comparisons), `V3 Updates/MOOD_V3_Strength_Core_QA_Sample.txt` (metrics over 3,720 production-path workouts) |
| Tests | 142 passed, 1 skipped (by design), 4 slow frozen-parity tests all pass (the frozen reference generators are unchanged on disk) |
| Engine identity | `build_info.ENGINE_PHASE = '2.7-strength-core'`, `service.ENGINE_VERSION = 'strength-core-p1 …'`; old persisted workouts return 409 `workout_outdated` on swap, exactly as designed |

---

## 1. What changed

New modules under `backend/mood_v3/engines/strength/` (about 900 lines total, all deterministic in user, date, archetype, swap count and history):

| Module | Role |
|---|---|
| `bands.py` | Prescription bands per slot class and level (sets, reps, RIR, rest), canonical coach-facing rep windows (4–6, 5–7, 6–8, 8–10, 10–12, 12–15, 15–20), small-muscle and non-loadable bodyweight handling, `in_band` validation |
| `variants.py` | Six structural variants (Traditional, Heavy Primary, Volume, Compound + Paired Accessories, Efficient, Top Set + Back-off), each with band positions, slot plan, pairing probability and compatible devices; priors by duration, goal and level multipliers, history penalty (×0.35 last, ×0.7 second-last); exact deterministic weighted sampling |
| `dials.py` | State expressions (2 to 3 per State, each at most three levers plus soft biases), State-level structure bias, conflict rules, a lever budget of 4, expression history penalty (×0.12 last, ×0.5 second-last), exercise-fit terms for the ranker |
| `timing.py` | Realistic time model (per-rep seconds by class, rest, setup, pairing transitions, warm-up) and the duration windows (60 → 50–60 min, 30 → 25–31 min) |
| `core.py` | The pipeline: ranker and slot plan injected into the frozen composer, band prescription, lever application, structure (pairing, one device, optional finisher), duration reconciliation, validation, decision log, Custom Target composer, exercise swap and finisher swap |

Modified:

- `adapter.py`: routing, MOOD's Pick, equipment presets, history mapping and the retry loop kept; generation delegates to `core`. The Phase 2.6 adapter is preserved byte for byte as `adapter_legacy_phase26.py` (used only for the legacy comparison in the review pack).
- `explain.py`: Strength State lines are now generated from decision events that fired (`state_rir`, `state_volume`, `state_reps`, `state_rest`, `state_slot_removed`, `state_tempo`, `finisher_selected`, `variant_selected`, `device_selected`). Generic State lines remain as the fallback when no lever fired. The false "one set comes off the last accessory" line is gone. Arms sessions say "opens the session" instead of "leads as the main lift".
- `progression.py`: rep prescriptions are windows; sessions are comparable when the windows overlap and a rep target is "hit" when every set at the top load reaches the top of last time's window.
- `qa/run_unified_qa.py`: the three State-signature assertions (Low Energy must be straight, Normal 60 must be straight, Stressed structure list) removed; Core-straight and beginner-no-circuit kept; Strength duration cap 65/36 (tolerance over the 60/31 window); progression probe reads the top of the rep window.
- `tests/`: `test_integration::test_strength_adapter_equals_frozen_on_all_237_fixtures` skipped with a reason (production Strength is no longer the frozen reference); Custom Target tests updated to 4 exercises for a single muscle and to a duration check instead of the 12–16 set band; router test reads the top of the rep window. `test_frozen_parity` was left as-is and still passes for all three Directions.
- `build_info.ENGINE_PHASE`, `service.ENGINE_VERSION`.
- New QA tooling: `qa/strength_core_sample.py` and `qa/strength_core_metrics.py` (the sample and metrics used below).

Behavioural changes, in one place:

1. A no-State session gets a structural variant first; State only changes the weights. No `amped_structure`, no `ALLOWED_BY_STATE`.
2. Prescription comes from bands positioned by the variant; State levers move values inside the same bands.
3. A State fires one expression (1 to 3 levers). Amped is "top set + back-off", "extra primary set + paired accessories" or "heavier rep position + optional finisher", never all of them. Irritated is "heavy primary", "forceful finish" or "direct and simple". Low Energy is "cost down", "moderate load" or "simplify". Bored is "new exercises", "new structure" or "fresh finish". Stressed is "predictable", "controlled" or "simpler".
4. The protected primary is never replaced by a State: State bias is excluded from protected slots and a lowering complexity cap applies to accessory slots only (compound lifts keep the level's cap). Sore and Different Workout keep their existing rights to move it.
5. Duration is reconciled in minutes with a realistic time model, by adding or removing useful work inside the bands (optional slot, set, rest position), with a direction lock and an overshoot revert so it cannot oscillate.
6. Finishers are a device with three types (burnout, forceful, carry), a probability that comes from the State expression or the variant, a history penalty on type and exercise, and a push-day rule that excludes rear-delt "burnouts". Carries are weighted 0.4 relative to forceful movements.
7. History records `variant`, `expressions`, `finisher {eid, type}` and `device`, and all four feed the next session's choices.
8. Ranking: Target fulfilment strict, protected continuity strict, then a weighted soft score (library verdict, State bias, recency × novelty, swap chain, equipment diversity, profile distance, seeded jitter). A main-lift prior favours loadable bilateral compounds so a glute day leads with a hip thrust, not a pull-through.
9. Custom Target: 4 exercises for a single major or minor muscle at 60 (3 at 30), compound lead where the pool has one (plain compounds only; combination lifts and non-loadable bodyweight are never the primary), compounds before isolations, at most one exercise per swap family and two per movement family with graceful relaxation for thin pools (calves), uses the variant and band layers, Core stays its own last block.
10. Every decision emits a structured event (`decisions[]` on the result, `adjustments[]` in the envelope).

## 2. What I deliberately did not change

APIs and request/response contracts (schema v3.0; `prescription.reps` is now a window string such as `6–8`, which the frontend already handled for bodyweight rows and renders via `display`); persistence, workout and item IDs, versions; `normalize.py`; profile defaults; soreness resolution (S1 to S3, RR1 to RR3, S2a override) and the frozen composer (`audit_engine.compose`, `candidates`, `_CON` slot constraints, hard filters); taxonomy and library workbooks; Direction, State, Target and archetype vocabulary; MOOD's Pick rotation; Different Workout semantics (`service.swap_workout`); the swap-exercise contract; `sweat_*`, `athletic_*` engines and adapters; `render.py` and `formatter.py`; frontend; the unified QA harness structure; the frozen fixtures and parity tests; the frozen `prescription.py` and `structure.py` files (still imported for `META`, `SLOT_ROLE` and the block helpers `straight`, `superset`, `pyramid`, `ladder`, `compatible`).

Not built, on purpose: Sweat and Athletic changes, the Cart, media work, library enrichment, consumer copy polish, a generalized optimizer.

## 3. Architecture of the lean implementation

```
adapter.build
  routing (unchanged) ──────────────────────────────────────────────┐
  dials.resolve(states, level, duration, history)                    │  expressions, levers, structure bias, exercise bias,
  variants.select_variant(archetype, duration, goal, bias, history)  │  finisher (p, types), caps, tempo, pairing multiplier
  QE.generate(...)   frozen composer + soreness/reroute              │  with core.rank / core.backfill / core.candidates injected
  core.prescribe     rows from bands at the variant's positions      │
  core.apply_levers  bounded shifts inside the bands, one event each │
  core.build_structure  pairing, ≤1 device, optional finisher        │
  core.reconcile     realistic minutes → add/remove useful work      │
  core.validate      frozen safety/composition checks (minus signatures) + bands + structure + duration
  core.result        envelope fields + history_record + decisions[]
```

Sizes: `core.py` ~560 lines, `dials.py` ~150, `variants.py` ~95, `bands.py` ~85, `timing.py` ~55. Multi-State resolution is a rule table of five rules (Low Energy owns systemic cost and preserves volume against Amped; Bored owns exercise novelty while Stressed owns structure; Stressed caps density and rest reductions from Amped/Irritated; Extras stay off under Low Energy; a lever budget of 4 with a fixed priority order). Everything is seeded; `Different Workout` (swap_count) rotates the variant first, then exercises, then archetype as before.

## 4. QA results

Sample: 3,720 workouts through `service.generate_workout` (3,240 archetype grid = 5 seeds × 9 archetypes × 12 State sets × {30, 60} × 3 levels; 324 Target runs; 96 soreness runs; 60 sequential-history sessions across 7 simulated users). 8 conflicts, all designed soreness conflicts (explicit Glutes + Legs or Full Body with sore legs). 0 exceptions. Equipment/Target buildability is identical to the legacy engine: on a 1,224-input grid across commercial, free-weight and minimal presets both engines conflict on the same 174 inputs (pre-existing pool gaps).

Base quality (no State, archetype runs, Core excluded):

| Metric | 60 min | 30 min |
|---|---|---|
| Structure: straight sets only | **28%** (was 100%) | 55% (was 94%) |
| Contains a superset | 61% | 42% |
| Pyramid or ladder device | 6% | 3% |
| Finisher | 11% | 0% |
| Top Set + Back-off | 5% in this sample (selector probability 14% for an intermediate; the 120-run sample shares seeds across levels) | 3% |
| Estimated minutes | **mean 53.8, range 42–60, 98% inside 50–60** (was mean 38.9, 88% under 45) | mean 28.3, 100% inside 25–31 |
| Working sets | mean 18.9 (14–24) | mean 10.5 (9–12) |
| Exercises | mean 5.3 | mean 3.7 |
| Rep windows in use | 8–10, 10–12, 12–15, 15–20, 5–7, 6–8, 4–6 plus pyramid/ladder schemes (was 10/12/8 covering 84%) | |
| Rest values in use | 60, 120, 135, 150, 45, 180, 195, 165, 240 (was 90/60/120 covering 91%) | |
| RIR | 2 (65%), 1 (30%), 3 (1%) | |
| Intermediate primary compound | 4 × 5–7 most common, 5 × 4–6 under Heavy Primary, rest 165–240 s | 3 × 5–7, rest 135–165 |
| Intermediate secondary compound | 4 × 8–10 at 120–135 s | 3 × 8–10 at 90–120 |
| Intermediate accessory | 3 × 10–12 at 60 s (4 sets under Volume, 15–20 for delts and calves) | 2–3 × 10–12 at 45–60 |

Variant distribution in the no-State 60 sample: Paired 32%, Volume 25%, Traditional 24%, Heavy Primary 11%, Top Set + Back-off 5%, Efficient 2%. Verified selector probabilities over 3,000 seeds for an intermediate `build_muscle` Upper Push: Volume 26%, Traditional 24%, Paired 22%, Top Set 14%, Heavy Primary 12%, Efficient 2%. Traditional no longer dominates anywhere.

Exercise variety across 5 users (no State, 60, intermediate): distinct exercises per archetype rose from 5–15 to 8–23; Glutes + Legs went from 5 identical exercises in every session to 11 distinct with only the hip thrust and trap-bar deadlift constant. Primaries vary between users (Bench / DB Incline / DB Bench for push; Back Squat / Hack Squat for squat) while staying loadable compounds.

State behaviour versus the identical no-State build (same user, date, archetype, duration, level; n = 240 per State set):

| State | Exercise retention | Protected primary kept | Δ sets | Δ RIR | Δ rest | Finisher | Expressions used |
|---|---|---|---|---|---|---|---|
| Low Energy | 66% | 100% | −0.78 | **+0.55** | +0.6 s | 1% | cost_down 84, simplify 84, moderate_load 72 |
| Stressed | 73% | 100% | −0.70 | +0.03 | +3.3 s | 0% | controlled 84, predictable 78, simpler 78 |
| Bored | **56%** (intentionally lowest) | 98% | −0.24 | 0.00 | +2.6 s | 16% (burnout 21, carry 15, forceful 2) | fresh_finish 108, new_exercises 78, new_structure 54 |
| Irritated | 85% | 100% | −0.75 | +0.02 | **+9.9 s** | 11% (forceful 16, carry 10) | heavy_primary 102, forceful_finish 84, direct_simple 54 |
| Amped | **96%** | 100% | −0.06 | −0.11 | +5.2 s | 8% (burnout 14, forceful 4) | extra_set_paired 90, heavy_end 90, top_set 60 |
| Amped + Stressed | 71% | 100% | −0.84 | −0.06 | +9.4 s | 2% | Stressed structure, Amped primary effort |
| Low Energy + Amped | 65% | 100% | −0.76 | +0.21 | +7.0 s | 1% | volume preserved, Amped effort on the primary only |
| Bored + Stressed | 53% | 100% | −0.99 | +0.03 | +4.1 s | 2% | Bored exercises, Stressed structure (Traditional/Efficient 54%) |

Protected-primary retention is 100% for every State on the seven archetypes that have one (Bored 98%: four Full Body sessions where the +1 complexity cap admitted a different primary). The 86–90% figure in the raw metrics file includes Arms and Core, which have no protected primary. Irritated's rest increase is the Heavy Primary variant (240 s on the main lift), not a State lever.

Regression checks:

| Check | Legacy | Rebuilt |
|---|---|---|
| Low Energy 60 removes a set from an accessory | 94% | 19% (only under `cost_down`, spread over up to 2 accessories, never the primary) |
| Built for Today claims a set was removed when none was | 79 of 354 sessions | 0 (lines are generated from fired events; asserted over all 240 Low Energy runs) |
| Amped 60 has a burnout finisher | 89% | 10% (finisher of any type 14%; Top Set + Back-off 20%; extra primary set or heavier rep position otherwise) |
| Irritated 60 has a forceful finisher | 89% (KB Swing or Farmer Carry 70% of those) | 22% (any carry anywhere in the session 8%, KB Swing anywhere 9%) |
| No-State 60 is straight sets only | 100% | 28% |
| 60-minute request, mean estimated minutes | 38.9 | 53.8 |
| State replaces the primary lift | Low Energy / Stressed / Irritated changed it whenever the complexity cap dropped | 0% |
| Custom Target single muscle 60 | 5 exercises, all 3 × 10 / 90 s / RIR 2, up to 3 fly variants | 4 exercises (102 of 108 single-muscle runs; 3 only when the pool is thin), compound lead with its own band, isolations after, at most 2 per movement family |
| Sequential same-State sessions (8 in a row) | same finisher 4/4 (Irritated), same burnout 3/4 (Amped) | back-to-back finisher repeats 0 across all 7 simulated users; expression repeats 0–2 per 8-session run; variant repeats 0–4 (Stressed repeats Traditional by design) |

Swaps: 111 exercise swaps across archetypes, Custom Target and finishers; 109 succeeded, 2 `no_alternative` on the Core archetype (pool constraint, pre-existing). Different Workout: 100% changed compositions, archetype rotation for MOOD's Pick preserved, Custom Target never returns the shown composition.

## 5. Founder-facing review pack

`V3 Updates/MOOD_V3_Strength_Core_Review_Pack.md`: 36 complete workouts with inputs, variant, every exercise, sets × reps, RIR, rest, pairings, estimated duration, the Built for Today lines that fired and the exact State events. Sections: 6 no-State (5 archetypes plus a 30-minute MOOD's Pick), 3 Low Energy, 3 Amped, 3 Irritated, 3 Bored, 3 Stressed, 2 Sore, 4 multi-State, 3 Custom Target, 4 sequential Amped sessions, 5 sequential MOOD's Pick sessions. Each major behaviour has a 30-minute example. Ten of them carry the legacy engine's output for identical inputs.

Two representative entries, verbatim from the pack:

**Upper Push, 60, intermediate, no State** (variant Top Set + Back-off, est. 58 min, 21 sets): Barbell Bench Press 4 × 4/7/7/7 top set then back off 10–15%, RIR 2, 240 s · Parallel Bar Dip 4 × 8–10 · Smith Incline Press 4 × 8–10 at 135 s · Superset A: Dumbbell Fly 3 × 10–12 / Cable Triceps Pressdown 3 × 10–12, 60 s · EZ-Bar Skull Crusher 3 × 10–12. Legacy for the same inputs: DB Bench 4 × 8, Dips 3 × 10, Plate-Loaded Incline 3 × 10, three accessories at 2 × 12, all straight, 42 min.

**Irritated, Upper Push, 60** (variant Top Set + Back-off, `heavy_primary` expression): Bench 4 × 4/7/7/7 at 240 s with the explosive-intent cue, Dips 4 × 6–8, Smith Incline 4 × 6–8 at 135 s, two accessories 3 × 10–12; no finisher. Built for Today: "You're Irritated, so the main lifts sit at the heavier end of their rep range." Legacy: DB Bench replaced by Incline DB Press, RIR 0 on every accessory, Kettlebell Swing 3 × 15 finisher.

## 6. Legacy vs rebuilt comparison

| | Legacy Phase 2.6 | Rebuilt core |
|---|---|---|
| Base structure | straight sets by rule | one of six variants, weights not recipes |
| Prescription | 6/8/10/12/15 reps, RIR 2/1, rest 150/120/90/60 by class | bands positioned by variant, canonical windows, rest 45–240 |
| Duration | 39 min mean for 60 | 54 min mean for 60, 98% inside 50–60 |
| State | switch statement + validator enforcing the signature | 1 expression of 2–3 per State, budgeted, history-rotated |
| Low Energy | −1 set on the last accessory, 72% of exercises replaced, main lift often replaced | RIR +1 or moderate load or one accessory less; 66% retained; main lift kept |
| Amped | + burnout isolation, RIR −1 everywhere | top set/back-off, or +1 primary set with pairs, or heavier reps with optional finisher; 96% retained |
| Irritated | KB Swing / Farmer Carry finisher 89% | Heavy Primary variant with intent cue, or a forceful finisher from a rotated pool, or direct-and-simple; 22% finisher |
| Bored | 4 hashed patterns | novelty bias, reshuffled picks, structure devices, fresh finisher; retention lowest by design |
| Stressed | one same-station superset | Traditional shape, controlled tempo cue or more rest or one accessory less |
| Custom Target | 5 identical prescriptions, isolation stacking | 4 exercises, compound lead, banded, structured |
| Explain | dial-value templates, one false line | event-driven, truthful |
| History | exercises and slots | + variant, expression, finisher, device |
| Buildability | 174 conflicts on the equipment grid | same 174 |

## 7. Remaining known weaknesses

1. **Bored without history is limited by the library.** Only 16 of 196 exercises carry novelty ≥ 3, so the novelty bias has little to grab on a first Bored session; the reshuffle salt and the structure devices carry most of the change. With history the recency multiplier (×2.5) does the job. Real fix is the novelty re-score noted in the reassessment (library work, deferred).
2. **Time model is calibrated by judgment, not measurement.** 3.2 s per compound rep, 2.4 s per isolation rep, fixed setup allowances. It produces sensible sessions but has not been validated against real completions. `duration_actual` from `/complete` is the data to calibrate it with.
3. **Volume variant can reach 24 working sets at 60 minutes** for intermediates (4 × 4 accessories). Defensible for a hypertrophy goal, at the top of what I would program; the reconciler trims by time, not by a set ceiling. If you want a hard ceiling, it is one number in `bands.py`.
4. **Sample skew.** The 5-seed diagnostic grid shares seeds across levels, so its variant percentages are noisier than the selector's true probabilities (reported both). The QA scripts are in `qa/` to re-run with more seeds.
5. **Pool gaps are unchanged** (Custom Target back/hamstrings on minimal equipment, Upper Pull `complementary_pull` on minimal, `forearms`, calves single family). Same 174 conflicts as legacy.
6. **Explain copy is functional, not final.** Lines are truthful and lint-clean but read like engineering ("1 more rep in reserve on the accessories").
7. **`test_sweat_difficulty_changes_dosing`** is date-seeded and occasionally fails in the full run (passes in isolation); pre-existing and unrelated to Strength.
8. **Reconciler occasionally accepts 61–64 min** for a 60 request on long-rest Custom Target pairs with limited equipment (shown as "about 60 min"). Validation tolerates up to +5; the QA cap is 65.

## 8. Launch-level issues I believe still exist

- The 60-minute Athletic and Sweat labels still under-deliver (unchanged this phase; Athletic averages 36 min).
- Media coverage (35% of Strength names match a video) means most Cart rows will show initials; unchanged.
- Old persisted workouts generated by Phase 2.6 cannot be swapped after deploy (409 `workout_outdated`), by design; the app already handles that code.
- `prescription.reps` is now a range string for Strength. The V3 frontend renders `display`, so nothing breaks, but any client code that parses `reps` as an integer must take the first or last number (progression and the router test were updated accordingly).

## 9. Recommendation

**Freeze Strength after one additional targeted pass**, not now. The bar you set is met on structure, duration, State behaviour, truthfulness and Custom Target, and the sample says ten generated Strength workouts will all be defensible and visibly different. The pass I want before freezing is small and mostly numbers, not architecture:

1. Calibrate the time model against a handful of real completions (or your own timing of two sessions from the pack).
2. Decide the Volume set ceiling and the Bored-without-history behaviour (accept, or add the novelty re-score to the library backlog now).
3. Polish the eight State sentence templates in `explain.py` into consumer copy.
4. Re-baseline `tests/frozen` for Strength against the new core so parity protects the rebuilt engine, not only the frozen reference.

After that pass, freeze the Strength model and apply the same layers (bands, variants, expressions with a budget, minute reconciliation, decision log) to Sweat, where the Hybrid workload budget from the reassessment becomes the Sweat equivalent of `timing.py`.
