# MOOD V3 Sweat Rebuild: Report for Founder Review

Branch `feature/mood-v3-app-rehaul`, nothing committed. Strength stays frozen (`engines/strength/*`, `why_today.py`, `strategy.py`, Strength parts of explain/render/progression untouched this pass; the `engines/strength/adapter.py` and `qa_engine.py` diffs in `git status` are the freeze pass from the previous turn). Tests: `167 passed, 2 skipped` (was 145; 22 new Sweat rebuild tests), unified QA all green. Version tags: `ENGINE_PHASE = '3.1-sweat-rebuilt'`, `ENGINE_VERSION = '... | sweat-rebuild-v5 (budget+shapes+gate+coherence+contract) | ...'`.

Companion files (in `V3 Updates/`): `MOOD_V3_Sweat_Rebuild_Review_Pack.md` and `.xlsx` (53 production-path cases, six layers each, legacy Hybrid fixture beside the rebuilt one), plus `backend/mood_v3/qa/results/SWEAT_REBUILD_metrics.txt` (2,012-run sample).

## 1. Audit of the current Sweat generator

What the frozen v4 Sweat did, on inspection of the code and of its output on the founder inputs:

- Hybrid anchor dose came from an optimistic pace table (0.24 s/m times 0.9), so a 60-minute advanced Hybrid produced 7 x 800 m Row plus five stations (5.6 km of rowing) and reported it as a 44-minute session. Under a realistic pace model the same block is 23 minutes of rowing at RPE 8 or 9 with an anchor share of 68 percent. This is the pathology the brief named; it is now a regression fixture (`test_legacy_hybrid_pathology_is_gone`, and pack case B15).
- The State layer was a dial system (V/E/N/C/G/X) with no satisfaction gate, no whole-session coherence check and no contract, so a State could nudge a ranking without producing anything a user could see.
- Engine long intervals ran 4 minutes at RPE 8 by default (the brief's dosing principle puts long intervals at about RPE 7).
- Sixty-minute sessions were often underfilled (40 to 44 minutes), and the old time model made the estimate look fine.
- Built for Today was templated from block facts, with no strategy synthesis and no evidence that a claim was realized.
- Nothing in the pipeline understood the total workload it had created: no total engine dose, no loaded-rep count, no impact count, no anchor share, no RPE distribution.

## 2. Preserved

- Sweat identity: every session is conditioning. Resistance stations stay at or above 8 reps, 30 s or 20 m, engine work carries the session, "all-out" only appears on self-limiting tools (sled, rope, bike, erg, slam).
- The frozen library and its ranking layer (`sweat_data.py`, `sweat_gen.py` ranked(), hard filters, station_dose(), circuit_template, cover_target, ensure_duty), the five equipment presets, soreness exclusion rules, the block schema the app renders, and the frozen independent validator (`sweat_validate.py`), minus the checks that encoded the old State signatures and the old duration band.
- The frozen harness parity test on the old generator (`test_sweat_frozen_qa_identical`) still runs against `sweat_gen.generate` and still passes. The v4 adapter is kept byte for byte as `adapter_legacy_v4.py` for comparison.
- Different Workout rotation, Swap Exercise mechanics (same block, same role, same eligibility slot), Cart and frontend untouched.

## 3. Changed

New: `engines/sweat/sweat_core.py` (1,420 lines: time model, workload budget, blueprints and shapes, State expressions and conflict rules, satisfaction gate, coherence check and repairs, reconciliation, refill), `sweat_why.py` (278 lines: personalization contract, Built for Today strategy synthesis, trainer notes), `tests/test_sweat_rebuild.py`, `qa/sweat_core_sample.py`, `qa/sweat_core_metrics.py`, `qa/sweat_core_metrics_extra.py`.

Rewritten: `engines/sweat/adapter.py` (routes to the core, drops the twelve validator checks that forced old signatures, exposes budget, gate, coherence, contract, decisions; swap re-validates against the budget).

Edited minimally: `render.py` (ladder-hybrid anchor doses, block estimate from the core), `explain.py` (Sweat branch calls the strategy synthesis; pyramid and ladder structure lines; interval dosing copy), `progression.py`, `formatter.py`, three existing tests (one skipped: the "adapter equals frozen on 41 fixtures" test is obsolete by design), `qa/run_unified_qa.py` (Sweat caps 60 to 61, 30 to 32), `build_info.py`, `service.py` (version tag only).

## 4. Architecture

Pipeline, in order, all deterministic from `user|date|archetype|swap`:

inputs -> archetype (explicit, Target-routed Circuit, or MOOD's Pick by goal rotation with least-recently-used and State affinity) -> resolve States into one expression bundle per State plus deterministic conflict rules -> shape (weighted pick over level, goal, State and history multipliers) -> blueprint (primary block minutes by archetype and duration, complement minutes) -> compose (ranking dials, jump caps, Target coverage, ordering) -> base dose (realistic time model) -> levers (RPE, recovery, units, bouts, stations, interval variation) -> workload budget repairs -> duration reconciliation (backfill and trim inside the band, never adding work the budget forbids) -> finisher (probability from State, dropped if it breaks budget or window) -> finalize (beginner rules, duty cycle) -> satisfaction gate against a no-State reference build, with expression fallbacks -> whole-session coherence check and bounded repairs -> refill after repairs (complement first, main block only when no volume repair touched it) -> frozen validator -> contract -> Built for Today.

## 5. Engine, Circuit, Hybrid

- Engine shapes: long intervals (beginner 150/150 at RPE 6 to 7; intermediate 4 x 240/90; advanced 5 x 300/90 at RPE 7 to 8), short intervals (40/20 at RPE 8 to 9; beginner 30/30 at 7 to 8), pyramid (1-2-3-4-4-3-2-1 minutes, intermediate and up), continuous (20 to 30 minutes at RPE 5 to 6, RPE lever capped at 7). Jump rope is a short-bout tool only, never a 20-minute engine. Complement for 60 minutes: a three-station circuit or, for Low Energy, a steady block on a second modality.
- Circuit shapes: fixed rounds, timed rotation (35/25, 40/20, 45/15 by level), EMOM (intermediate and up, must hold a 60 percent duty cycle or falls back to rounds). Ladders live in the complement (Bored couplet ladder). Complement is short engine intervals on a different modality, a steady block for Low Energy, or a low-impact station circuit when the setup has no second engine.
- Hybrid shapes: anchor + couplet (k = 2, 4 to 6 rounds, anchor 75 to 125 s by level), anchor + triplet (k = 3, 3 to 5 rounds), split anchor (k = 4, 3 to 4 rounds, anchor 150 to 240 s, stations alternate by round), ladder hybrid (descending anchor doses, ascending station reps, capped at 12 per side and 20 bilateral).
- Hybrid rule (your addition, implemented): the primary Hybrid block is the workout. A 60-minute Hybrid never carries a second circuit. **Primary Block Completeness Gate**: once the main block holds 3 or more distinct training elements and 20 minutes or more of meaningful active work, no multi-round complement circuit may be added. A short session is extended in this order, each step rolled back if the budget, the window or a passed State verdict objects: one more round (blueprint permitting; a beginner's block stops growing 6 minutes sooner), a slightly longer anchor bout (+20 percent, one step), technique and setup time before round 1 (1 to 3 minutes, shown in the block instructions: "set your Row Erg pace and load every station"), a longer warm-up (+1 to +2 minutes, with a note that the main block is the workout) and downshift (+1), and only then one low-complexity 5 to 10 minute closer with a stated purpose (a 6-minute steady flush on a second modality, or for Irritated or Amped intermediates and up, 6 x 30/30 on a self-limiting tool). In the 2,012-run sample: 205 of 205 thirty-minute Hybrids and 299 of 304 sixty-minute Hybrids are one block; 4 carry a closer, 1 a finisher, 0 a second circuit. Fills used in the 60-minute sample: technique and setup 127, anchor bout 78, warm-up 67, downshift 32. Main-block active minutes run from 17 (Low Energy beginners) to 32, median 27.

## 6. Whole-session workload budget

`budget()` computes from the finished blocks: active, recovery and transition minutes and duty cycle; total engine dose per modality (metres, calories, seconds), engine minutes, bouts, engine share, anchor share (anchor seconds over active plus transitions); loaded reps and bodyweight reps per exercise; impact contacts (high-impact jumps weighted fully, moderate at 0.3 to 0.4, rope time at a quarter weight); high-impact items; loaded hinges; systemically demanding stations; distinct stations and fixed stations; transitions; hard minutes and hard share (blocks with an RPE floor of 8 or more); all-out blocks (floor 9); RPE per block.

Limits by level (60 minutes; 30 minutes scaled to 0.65 with one fewer station): beginner engine share 75 percent, anchor share 45, hard share 30 percent once past 8 hard minutes, loaded reps 200, impact 50, hinges 1, stations 6, no all-out blocks, engine 26 minutes; intermediate 80 / 45 / 60 percent past 16 / 300 / 90 / 1 / 8 / 1 / 30; advanced 85 / 48 / 70 percent past 22 / 360 / 120 / 1 / 9 / 2 / 34.

Repairs, in order: shrink the anchor bout (Hybrid must stay hybrid), fewer engine units, shorter complement, drop the finisher or take a block down one RPE notch for hard share, swap a jump station for a low-impact one before cutting rounds, take two reps off loaded stations before dropping rounds, trim complement stations for the station cap, remove units last. Growing the main block during backfill has two bounded concessions: an anchor bout comes down one step when the anchor cap alone blocks an extra round (3 x 550 m beats 2 x 700 m), and a block at RPE 8+ comes down one notch when only the hard budget blocks it (duration wins over an hour at RPE 8). Every repair is a `budget_repair` decision; anything unresolved is a `budget_open` decision (9 of 1,968 sessions, all within 6 impact contacts or 30 seconds of the cap).

## 7. State layer (conditioning philosophies)

Each State has three expressions plus a last resort; the gate tries them in order until at least one meaningful adaptation is realized in the finished session versus the no-State reference.

- Low Energy: steadier (long intervals or continuous, RPE minus 1, longer bouts), low impact and simple (no jumps, fewer stations, supported machines), lighter (one unit less, steady complement). Coherence forbids hard share above 15 percent, any block above RPE 8, finishers, more than one impact item, busy transition counts, high loaded reps, two systemically demanding stations.
- Stressed: steady cyclical (continuous or long intervals, RPE cap 7, familiar tools), fixed rounds (fewer stations, RPE cap 7), controlled pace (recovery plus 25 percent). Coherence forbids EMOM, ladder, pyramid and ladder hybrid, more than 4 stations in the main block, finishers, a main block above RPE 8 (unless Amped), duty above 92 percent.
- Bored: new structure (pyramid, ladder, EMOM, split anchor, ladder hybrid, avoid last shape), new modalities (rotate the engine, novelty bias, equipment variety), changing intervals (pyramid conversion). Coherence needs an experiential difference score (shape, novel items, equipment variety, finisher, new modality versus reference, device complement).
- Irritated: output tools (sled, rope, slams, carries, RPE plus 1), hard and simple (short intervals, erg bias, RPE plus 1), direct finisher. Coherence needs something direct (hard share, finisher, forceful tools, intervals, or RPE 8 at the beginner ceiling), no fiddly sequencing, no complexity-3 movement.
- Amped: harder output (RPE plus 1, capped at 8 on anchor blocks below advanced and at 7 on continuous), denser (recovery minus 25 percent), extra round. Coherence needs readiness used somewhere (hard block, density, finisher, extra round, or a sustained continuous effort), no more than one all-out block, no "everything all-out" once the hard budget is nearly spent.
- Sore: exclusion first; MOOD's Pick reroutes to an archetype that does not depend on the sore region; a user-selected archetype that depends on it returns a conflict envelope with options; explicit Targets keep the named muscles and work around the rest. Never a silent override.

A calm State whose base session is already a single continuous effort at RPE 7 or below counts as aligned (nothing added, nothing hurried) rather than unsatisfied.

## 8. Multi-State rules (deterministic, logged as `state_conflict_resolved`)

- Low Energy + Amped: energy owns workload (Amped's extra round dropped, Low Energy owns secondary RPE, volume and impact); Amped keeps one denser main block (recovery minus 25 percent) and the main block is held at RPE 7 to 8, never an 8 floor. At 30 minutes (one block) Low Energy sets the main-block effort and Amped tightens its rest. No finisher.
- Amped + Stressed: Amped owns output (RPE plus 1 on the main block), Stressed owns structure (EMOM, ladder, pyramid and ladder hybrid zeroed, RPE cap moved to the secondary block, density lever removed, finisher probability 0.15).
- Bored + Stressed: novelty in the movements and modality, structure fixed (no changing schemes, no avoid-last-shape pressure).
- Irritated + Low Energy: cathartic tools at sustainable output (Irritated's RPE lever removed, short intervals down-weighted, no finisher).
- Irritated + Stressed: Irritated keeps RPE plus 1 on the main block and its tools, Stressed caps the secondary block and removes fiddly shapes, finisher probability 0.3.
- Bored + Low Energy: novelty through modality and stations, not through cost (no interval variation, no finisher, EMOM down-weighted).
- Sore dominates everything.

## 9. Level and goal

Level: beginner RPE ceiling 8, recovery at least equal to work on engine intervals, no finisher, no pyramid, EMOM or ladder, at most one jump station, 35/25 timed circuits, 150/150 long intervals, fewer stations and transitions, tighter engine and rep budgets. Intermediate and advanced differ in interval length, RPE ceilings (9 for advanced on anchors), rounds, budgets and finisher access. Sample: beginner sessions never exceed RPE 8 and never carry a finisher; advanced engine sessions reach RPE 9 in 10 of 65 and carry a finisher in 7 of 65.

Goal (existing vocabulary): shape multipliers (conditioning goal weights continuous, timed and anchor + couplet; athleticism weights short intervals and split anchor; feel better weights continuous, long intervals and fixed rounds; build muscle weights fixed rounds and anchor + triplet; build strength weights split anchor and loaded rounds), MOOD's Pick rotation order, and the goal line in Built for Today and the contract. Goal is a soft weight over a seeded pick, so it shifts distributions rather than dictating a shape (for example, 16 intermediate Circuit users: build muscle 14 fixed rounds and 2 timed; conditioning 7 rounds, 8 timed, 1 EMOM).

## 10. Target and soreness

Explicit Targets route to Circuit and drive station selection through the frozen `cover_target` (216 of 216 Target sessions routed, every one with a Target claim backed by the stations chosen). Engine and Hybrid stay Target-neutral: Sweat identity first, and the copy says so ("the stations lean that way while the erg keeps the session conditioning-first"). Soreness: 96 soreness sessions in the sample; MOOD's Pick with sore legs rerouted (case B16: SkiErg carries the conditioning, no station loads the sore region); sore legs with a user-selected Hybrid returned a conflict envelope with Change Target, Let MOOD pick, Try Strength and Cancel (case D7); sore lower back with a quads + glutes Target kept the Target and worked around the back (D6).

## 11. History (minimal extension)

The Sweat history record now carries archetype, shape, engine modality, primary structure, complement type, finisher, stations, exercises, families and the State expressions used. Shape selection down-weights the last two shapes (0.3 then 0.7), MOOD's Pick down-weights the last three archetypes, the engine pick avoids the last two modalities, the frozen recency layer still avoids recent exercises. Sequential sample: five users, 34 sessions, 33 distinct sessions; a Bored Hybrid user gets four shapes in six sessions; a mixed-State user gets six shapes and three archetypes in eight sessions.

## 12. Built for Today

Strategy synthesis in `sweat_why.compose`: one paragraph chosen from the resolved combination (pair rules first, then single States, then soreness, level, goal, Target, history), each sentence tied to a claim that the contract must back, followed by the structure, dosing and effort lines. Examples from the pack, verbatim:

- "You're amped but running on less energy than usual, so energy sets the workload and the readiness goes into one denser Row Erg block. Everything else stays steady and sustainable."
- "You're amped but stressed, so the session stays simple and predictable (circuit rounds) and the extra energy goes into a harder main block rather than into a busier structure."
- "You're bored, so we're changing the experience with the SkiErg and movements you haven't seen recently (Devil Press, Single-Arm Overhead Carry and Med-Ball Slam). The workload stays controlled; the novelty comes from how the session unfolds, not from random extra work."
- "You're irritated and stressed, so this is hard, simple work on the Row Erg in a shape you can settle into: nothing fiddly, nothing frantic, just output."
- "Your legs are sore, so every station keeps that area out of the loading; the SkiErg carries the conditioning."
- "You're low on energy, so the work stays cyclical and steady on the Stationary Bike: long intervals at RPE 6–7, something you can sustain rather than survive."

## 13. QA metrics (2,012 production-path runs: 1,968 sessions, 44 conflict envelopes, 0 generation failures)

- State satisfaction (gate, finished session versus no-State reference, excluding States that yielded by a conflict rule): Low Energy 489/491 (99.6 percent), Stressed 427/433 (98.6), Bored 488/501 (97.4), Irritated 350/367 (95.4), Amped 406/410 (99.0). 23 yields by rule, all Amped under Low Energy.
- Whole-session coherence: 2,121 of 2,225 verdicts pass after repairs (95.3 percent); 1,491 of 1,595 State sessions pass every verdict (93.5 percent). Every failure is listed in the metrics file with its reason.
- Truthfulness: 5,180 Built for Today claims, 0 unbacked.
- Duration: 30-minute sessions median 26.6, min 22.5, max 31.0, 100 percent inside the brief's 22 to 30 window (58 below the preferred 24). 60-minute sessions median 49.3, min 39.0, max 59.1, 97.1 percent inside 45 to 60 (87 below the preferred 48, 34 below 45; all 34 are Low Energy or beginner sessions where the coherence layer refused the extra work, and each carries a `duration_underfill_accepted` decision that names what blocked the fill).
- Budget: 9 sessions with an open violation (4 impact contacts 42 versus 32 for 30-minute beginners with a jump station as the sole driver, 4 engine time 30.5 versus 30 minutes, 1 engine share 76 versus 75 percent).
- Level and goal differences are visible in RPE ceilings, finisher access, loaded reps and shape distributions (section 9).
- Different Workout (32 rotations) and Swap Exercise (16 swaps) all valid through the production path.

## 14. Hybrid regression

Legacy fixture (Amped, advanced, 60, commercial gym): 7 x 800 m Row plus five stations, 5,600 m, anchor share 68 percent, hard share 80 percent under the rebuilt time model, reported by v4 as 44 minutes. Rebuilt on identical inputs: split anchor, one block, 4 x 950 m Row with four alternating stations, 3,800 m, 16.2 engine minutes, anchor share 43 percent, 52 minutes elapsed. Across all 304 sixty-minute Hybrids in the sample: anchor share min 32, median 42, max 48 percent; engine share max 69 percent; hard share max 63 percent; rounds 4 to 6; stations 3 to 6 (the main block only); transitions 24 to 36. Guarded by `test_legacy_hybrid_pathology_is_gone` (five seeds) and `test_hybrid_anchor_share_across_states`.

## 15. Founder pack

`V3 Updates/MOOD_V3_Sweat_Rebuild_Review_Pack.md` and `.xlsx`: 53 cases. A: six No-State 60-minute sessions. B: three per State plus two Sore, with the legacy Hybrid beside B15. C: six multi-State combinations. D: beginner and advanced rules, goals, Custom Targets, soreness with a Target, the soreness conflict envelope, minimal and free-weight-limited presets. E: six sequential Bored Hybrid sessions for one user (each one block). F: six 30-minute regressions. G: Different Workout twice and Swap Exercise on one session. Each case: Context, Workout (blocks, items, load guidance, total engine dose, loaded and bodyweight reps, impact contacts, active and elapsed time, anchor share), Built for Today, Why this fits today, Realized personalization, Workload budget with the level limits, coherence verdicts and the engine trace. Sheets: Read Me, Sessions (with Rating and Notes columns), Legacy vs Rebuilt, Metrics.

## 16. Weaknesses (honest)

- Irritated on a beginner or Low Energy Engine session often has nothing direct to offer beyond intervals and RPE 8 at the ceiling; 27 of the 98 remaining coherence failures are "nothing direct or forceful to push against" on Engine sessions, mostly 30 minutes.
- Bored + Low Energy on a beginner Engine session scores 0 on experiential difference when the modality cannot rotate (pyramid, ladder, finisher and interval variation are all off for beginners or for Low Energy).
- Engine complements for first sessions converge on the same three stations (goblet squat, push-up, dead bug) because the ranking is priority-led and only history varies it.
- Timed circuits at RPE 8 to 9 for 20 to 25 minutes pass the budget for intermediates; a founder may still find them long.
- Thirty-four 60-minute sessions land between 39 and 45 minutes (Low Energy or beginner, with the reason logged). The brief allows about 45 to 60; these sit below it.
- Goal is a soft weight over a seeded shape pick, so two goals can still produce the same shape for the same user and date.
- Anchor and station time estimates come from pace tables, not from the user's own history; the progression basis is recorded per item but not yet fed back into the doses.

## 17. Launch-level issues

None that block the pipeline: no generation failures in 2,012 runs, every conflict is an envelope with options, all tests pass, unified QA green. Two things I would want a human to look at before launch: the "nothing direct" Irritated Engine sessions (they are valid and coherent for the other States, but the Irritated user gets a weaker acknowledgement), and the 34 short 60-minute Low Energy or beginner sessions (defensible, but visibly under the hour).

## 18. Recommendation

One narrow correction pass, then freeze. Scope of the pass: (a) give Irritated an Engine-specific expression (a hard single-modality interval block with a self-limiting tool finisher where the level allows) so the "nothing direct" failures close; (b) let Bored on beginner Engine sessions realize through the complement (a second modality or a couplet at beginner dose); (c) let the Low Energy steady complement grow to fill the 60-minute window when coherence allows, so the 36 to 45 minute tail closes; (d) seed the engine complement station pick so first sessions vary. None of these touch Strength or the budget model. After that pass, freeze Sweat with a baseline metrics file the way Strength was frozen.

## 19. What the founder should inspect

Twenty sessions to read first: A1 to A6 (base quality without States), B1, B4, B7, B10, B13 (each State on its natural archetype), B15 (legacy beside rebuilt), B16 and D7 (soreness reroute and conflict), C1, C2, C4, C6 (conflict rules), D1 (beginner), E1 to E3 (variety), F2 and F4 (30 minutes).

## 20. Stop

Stopped for founder review. Athletic not started. Nothing committed.
