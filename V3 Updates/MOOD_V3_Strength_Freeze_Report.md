# MOOD V3 Strength: Freeze Report

Strength is frozen. Engine phase `3.0-strength-frozen`, `ENGINE_VERSION strength-frozen-v3`. Branch `feature/mood-v3-app-rehaul`, nothing committed (39 changed or new files, backend only, `frontend/.env` untouched by this pass). Freeze record and QA baselines are in `backend/mood_v3/qa/results/` (`STRENGTH_FREEZE.md`, `STRENGTH_FREEZE_metrics_baseline.txt`, `MOOD_V3_Unified_QA_Results.json`). The founder pack is `V3 Updates/MOOD_V3_Strength_Freeze_Review_Pack.md` and `.xlsx`.

---

## 1. Changes made (only what the six issues needed)

1. **Whole-session State Coherence** (`engines/strength/coherence.py`, `core.coherence_pass`). Runs after final reconciliation on every State session (archetype, Custom Target and Core paths). Features: total sets, exercises, estimate, variant, pairs, device, methods (high-fatigue, counting-heavy), finisher, compound count and sets, demanding compounds, average / minimum / primary / compound RIR, near-failure count, compound rest, systemic demand, support, station changes, complexity, novelty, primary tempo and scheme, plus what the gate realized. State-specific predicates judge the resolved combination (a State that yielded by conflict rule is not judged; Bored + Stressed lowers the novelty bar to exercises only; Low Energy + Amped judges Amped only on the primary). Each State has a short ordered repair list; a repair runs only when it addresses an open failure, is applied once, the session is rebuilt and re-checked, and the whole thing is logged (`state_coherence`, `state_coherence_repair`). Low Energy trims give the time back as recovery (longer rests), never as more work. The contract is re-derived after repairs so Built for Today describes the final session; a realized detail whose value was later undone is no longer "realized" (3,366 details checked, 0 mismatches).
2. **Built for Today upgraded** (`strategy.py`, `why_today.build` delegates to it). Contract + completed session → strategy representation (State resolutions such as Amped + Stressed = harder effort / simpler experience, Low Energy + strength = one heavy stimulus / lower surrounding cost, Bored + advanced = sophisticated novelty; single-State strategies conditioned on level and goal; soreness; level; goal; history; Target; Core focus) → the two to four most meaningful ideas → two to three sentences with seeded phrasing variation. Every strategy carries its claims; a level or goal is named only when the contract has a realized consequence for it. A trainer layer (`strategy.trainer_notes`) explains the whole session for the pack.
3. **Core respects duration** (`core.compose_core`, `_core_once`, `build_core`, `swap_core`; adapter routes `strength_core` to it). Categories, not recipes: loaded bracing lift (goblet / front / Zercher squat, overhead and landmine presses, kettlebell swing), posterior-chain / trunk hinge, carries, anti-extension, anti-rotation and lateral stability, rotation, flexion. 60 minutes: seven categories, direct trunk work always the majority; 30 minutes: four. Level gates systemic cost (beginner ≤ 3) and complexity; State, goal and history bias selection; the loaded lifts are prescribed moderate (RIR ≥ 2) so it stays a Core session. `session_expectation = long_core_session` on the envelope for 60-minute Core, with a Built for Today note. Swap and Different Workout work on Core.
4. **Beginner rules**: 3 s eccentric for beginners only on machines, cables and stable accessories, never on a loaded hinge / squat / press (`methods.compatible`); RIR-0 burnout finishers are intermediate and up (beginners keep carries and forceful finishers at RIR 1); Amped coherence forbids any beginner set at RIR 0 and prefers extra set, heavier position within the beginner band, or an intent cue.
5. **Soreness routing** (adapter + `qa_engine` two lines): MOOD's Pick reroutes (already did; Built for Today now says so as strategy); a user-selected archetype whose defining muscle is sore is narrowed to the part that can be trained (Upper Push with sore shoulders → chest + triceps as a Custom Target, logged `archetype_narrowed_around_soreness`, explained) and only conflicts when nothing coherent remains (whole-lower-body soreness with a lower-body archetype); explicit Targets keep the intent and work around the region (24 / 24 build); never a silent override.
6. **Composition rules** (general, not seed patches): same-movement-family compound stacking is limited (beginner, Stressed or feel-better: one same-family compound at full volume; otherwise two), the extra same-family compound drops to the band-low set count and a lighter rep position (`compound_redundancy_trimmed`); the ranker prefers a different pattern for the secondary slot when the family is already used; Low Energy total workload is governed by the coherence budget (level × duration, +2 for a strength goal), not a universal ceiling; an explicit Target muscle can never lose its only covering exercise to a State lever, the clock or a coherence repair.

Kept as the founder asked: Amped + Stressed as a plain structure with harder primary effort; Bored advanced unusual complementary movements (Dragon Flag stays); Irritated advanced heavy compound emphasis with no finisher.

## 2. State Coherence results (4,470-run sample, all failures listed in the baseline file and the pack Summary sheet)

| Resolved combination → State judged | Pass |
|---|---|
| Amped → Amped | 95% (372 / 390) |
| Amped + Bored → Amped / Bored | 98% / 100% |
| Amped + Stressed → Amped / Stressed | 99% / 100% |
| Bored → Bored | 100% |
| Bored + Low Energy → Bored / Low Energy | 100% / 95% |
| Bored + Stressed → Bored / Stressed | 96% / 100% |
| Irritated → Irritated | 92% (356 / 389) |
| Irritated + Low Energy → Irritated / Low Energy | 100% / 98% |
| Irritated + Stressed → Irritated / Stressed | 99% / 100% |
| Low Energy → Low Energy | 96% (321 / 333) |
| Low Energy + Amped → Amped / Low Energy | 100% / 99% |
| Stressed → Stressed | 100% |
| **Overall** | **99.0% (58 failures of 5,558)** |

The 58 open failures: Irritated in Custom Target and Core sessions with nothing heavy or direct to lean on (single-muscle Targets such as biceps), Bored beginner sessions with nothing less-familiar in the pool, Low Energy 30-minute Arms one set over budget at the band floor, Low Energy Full Body with two systemic-4 compounds where no supported alternative exists for the slot, and Amped + Stressed in Core where Stressed removes every effort marker. Repairs applied most often: Low Energy accessory-set trims (212) with rest given back (119), Amped near-failure trims (203), Irritated intent-and-heavier on the primary (185).

Low Energy no longer produces contradictory high-cost sessions: the 23-set Arms case is now 17 sets at RIR 2 to 3 with longer rests; the beginner 18-set Upper Pull is 16 sets with supported movements; Heavy Primary + high accessory volume is a named failure with a repair. Stressed stays distinct from Low Energy (RIR unchanged, rest +4 s, tempo and structure carry it; Low Energy moves RIR +0.6 and sets −1.25).

## 3. Core solution and examples

60-minute Core (195 runs): mean 53.3 min, 84% inside 50 to 60, 6.5 exercises, 20 sets, 6.5 distinct categories per session, expectation flag on 100%. 30-minute Core: mean 27.5 min, 86% inside 25 to 33, 3.7 exercises. No duplicate patterns inside a session; State satisfaction inside Core 98 to 100%.

- Beginner, 60: Half-Kneeling Landmine Press 4 × 10–12/side, Mountain Climber → Dead Bug family anti-extension, Kettlebell Deadlift 4 × 10–12, Pallof Press, Suitcase Carry, Cable Wood Chop, Captain's Chair Knee Raise (51 min, 18 sets, all RIR 2).
- Advanced, 60, build strength: Barbell Overhead Press 4 × 8–10 paused reps, Dragon Flag, Barbell Good Morning, Pallof Press, Suitcase Carry, Landmine Rotation, Captain's Chair Knee Raise (54 min, 23 sets).
- Low Energy, intermediate, 30: Landmine Press 3 × 8–10/side RIR 3, Weighted Plank, Pallof Press, Knee Raise (27 min, 10 sets; coherence trimmed the Low Energy volume).

## 4. Long-Core expectation copy and field

Envelope: `workout.session_expectation = "long_core_session"` (null otherwise) so the Cart / overview can surface it. Built for Today carries it, usually inside the synthesis ("Core stays the focus, but at 60 minutes it becomes a core-focused strength session: a loaded bracing lift, anti-extension, posterior-chain work, anti-rotation and lateral stability and carries.") and otherwise as a dedicated line: "You chose 60 minutes, so this is a full core-focused strength session rather than an hour of ab work: loaded bracing, carries and stability work that challenge your trunk from several angles, with Core still the focus." Deterministic, visible before Start, not apologetic.

## 5. Beginner method corrections

1,290 beginner sessions in the sample: the only method is the 3 s eccentric (138), attached to leg extension, lat pulldown, pec deck, chest-supported row, single-leg curl, cable fly, frog pump, preacher / spider curl, machine triceps extension; never on a trap-bar deadlift, squat or press. 0 RIR-0 rows, 0 high-fatigue methods, finishers only carries. Beginner Amped now shows as an extra working set, heavier positioning inside the beginner band or an intent cue ("using it the way a good coach would for a newer lifter: adding a working set to Hack Squat, still with reps in reserve on every set").

## 6. Soreness routing behaviour

- MOOD's Pick + sore chest → Upper Pull: "Your chest is sore, so we're moving the work away from it: today is an Upper Pull session that leaves it alone."
- User-selected Upper Push + sore shoulders → narrowed to chest + triceps (Custom Target), overhead work out, sore secondary movers penalised and reported: "Your shoulders are sore, so today's Upper Push keeps the chest and triceps work and leaves the shoulders work out."
- Explicit chest + triceps + sore shoulders → Custom Target around the shoulders; explicit back + biceps + sore lower back → chest-supported and machine rows, erectors never overridden by naming "back".
- User-selected Lower Body: Squat + whole legs sore → conflict envelope with options (nothing coherent remains). 24 such conflicts in 4,470 runs, all of this shape.

## 7. Built for Today examples (verbatim from the pack)

- Amped, advanced, strength, Full Body: "You're amped, so that extra readiness goes into demanding compound work with Barbell Romanian Deadlift carrying an extra working set. Since you're an advanced lifter focused on strength, the session stays compound-heavy rather than turning the energy into more accessory volume."
- Low Energy, advanced, strength, 30-minute Upper Push: "You're low on energy, but strength is still the goal, so we're keeping one meaningful heavy stimulus (Barbell Bench Press) instead of watering the session down. The rest of the workout stays simpler and further from failure so you train productively without turning it into a grind."
- Amped + Stressed, conditioning goal: "You're amped but stressed, so instead of making the workout busier we're putting that extra energy into more from the main lifts while keeping the structure straight and predictable and the rest unhurried. Your conditioning goal keeps the accessory rests short so the session keeps moving."
- Irritated + Stressed: "You're irritated and stressed, so the session is heavy and direct without being frantic: Chest-Supported Machine Row carries the effort, the structure stays plain and the rest stays unhurried."
- Bored + Low Energy: "You're bored and low on energy, so the change of scenery comes from the movement choices, not from extra work: 2 less-familiar movements, everything further from failure."
- Irritated, advanced, Squat: "You're irritated, so the session is built around heavy, direct work: Hack Squat heavy and driven with intent, simple movements behind it and nothing fussy. No finisher needed; the load does the job."
- Low Energy + Amped: "You're amped but running on less energy than usual, so energy sets the budget and the readiness goes into one place: Barbell Back Squat. Everything around it stays further from failure."

Truthfulness stays at 100%: 4,352 synthesised lines, 0 unbacked claims, 0 lint violations. 94 no-State sessions with nothing material to say beyond the structure lines carry no synthesis (by design).

## 8. Founder-test pack

`MOOD_V3_Strength_Freeze_Review_Pack.xlsx` (sheets: Read Me, Workouts, Founder Test, Legacy vs Rebuilt, Summary) and `.md`. Section N is the founder test: 21 sixty-minute cases (Low Energy beginner, Low Energy advanced strength, Bored + Low Energy, Stressed beginner, Irritated + Stressed, Amped + Stressed ×2, Amped advanced, Bored advanced ×2, Irritated advanced, sore + State ×2, Low Energy + Amped, and 60-minute Core across beginner, advanced, Low Energy, Bored, Amped, Stressed) plus 9 thirty-minute regression cases (beginner methods, beginner Amped, Amped + Stressed, Low Energy, Bored, Core). Each shows Context, the complete workout (structure, sets × reps, RIR, rest, set methods, pairings, estimate, total sets), Built for Today (exact consumer copy), Why this fits today (trainer reasoning, including the coherence verdict and repairs), Realized personalization (contract) and the gate trace. All 30 founder-test workouts pass coherence.

## 9. QA and test results

- Unified QA all green (8,424 builds across directions), results file refreshed.
- Tests: 145 pass, 1 skipped, 1 pre-existing date-seeded Sweat flake.
- Gate: 98% satisfied (5,474 / 5,558), 17% needed a fallback, 52 yielded by rule, 28 exhausted.
- Coherence 99.0%; Core durations as above; beginner methods as above; determinism, protected primary (100 / 100 / 98 / 100 / 100), sequential rotation (no back-to-back variant repeat for the no-State user; expressions and methods rotate) unchanged; 60-minute no-State mean 53.8 min (94% in window), 30-minute 28.1 (99%).

## 10. Known non-blocking post-launch items

1. Coherence failures that have no honest repair (58 of 5,558): single-muscle Irritated Targets, Bored beginner lower-body pools, Core under Amped + Stressed. These are logged and truthfully explained, not hidden.
2. Core 60 minutes lands at 47 to 50 min in 16% of runs (Low Energy trims and level floors); Core 30 minutes under 25 min in 14%.
3. Level and goal sentences are still the flattest part of the copy; the strategy layer has the hooks for richer goal phrasing later.
4. The frozen slot plans force three pressing compounds in Upper Push; the redundancy rule lowers the third to the band floor rather than replacing it (a slot-plan change would be a library / archetype decision).
5. Core exercise novelty for beginners is limited by the pool (landmine press leads most beginner Core sessions).

## 11. Freeze confirmation

All twelve freeze conditions are met: gate strong, whole-session coherence in place and founder-visible, Low Energy no longer high-cost, Stressed distinct from Low Energy, Amped / Irritated / Bored varied, beginner edge cases fixed, both Core durations coherent, long Core communicated and flagged, soreness auto-routes when MOOD caused the conflict, explicit Targets work around soreness, Built for Today explains strategy with evidence, and Direction invariants, determinism, progression, swaps and safety intact.

**Strength is frozen and ready for the Sweat phase.** Sweat was not started in this pass.
