# MOOD V3 Athletic: Rebuild Report (stopped for founder review)

Branch `feature/mood-v3-app-rehaul`, nothing committed. Strength (`3.0-strength-frozen`) and Sweat (`3.2-sweat-frozen`) are untouched: no file under `engines/strength/`, `engines/sweat/`, `strategy.py`, `why_today.py` or `sweat_why.py` changed, and their frozen parity tests still reproduce the frozen results byte for byte. No shared-system defect was found that needed frozen code. Athletic is a freeze candidate: `ENGINE_PHASE = '3.3-athletic-candidate'`, `ENGINE_VERSION = '... | athletic-v2 (quality+blueprints+impact/intent budget+gate+coherence+contract)'`. Tests `178 passed, 3 skipped` (the skips are the old "adapter equals frozen generator" checks, retired the same way they were for Strength and Sweat). Unified QA green, 0 failures.

Companion files in `V3 Updates/`: `MOOD_V3_Athletic_Founder_Review_Pack.md` and `.xlsx` (57 production-path workouts: 46 cases plus the history sequence, Different Workout and Swap Exercise pairs; seven cases print the legacy workout for the same inputs as BEFORE). Metrics, the random trainer-read sample, the legacy baseline and the full workout dumps are in `backend/mood_v3/qa/results/ATHLETIC_*`.

## 1. What the audit found (legacy Reference Generator v1, production path, 456 builds)

The legacy engine was careful about dosing inside each exposure, but the session model around it was wrong for performance training:

| Finding (60-minute sessions unless noted) | Legacy |
|---|---|
| Every session had 3 separate explosive exposures (PX, SX, SX2), usually a random mix: jump + swing + slam, then all-out erg or sprint repeats at the end | 3 explosive exercises in 100%, median 16 explosive sets |
| Repeat efforts (6 s all-out row / ski / bike, 10 m sprints) placed after 15+ explosive sets: power under fatigue | 112 of 228 sessions |
| Athletic strength barely existed ("Performance Support", optional) | 46 of 228 had none; median 3 strength sets |
| High-rep power | kettlebell swings 15 reps at 45 s, med-ball slams 8 reps, pogo 20 s sets; 29 sessions with power reps > 8 |
| Impact | up to 200 contacts in a session (pogo 5 × 20 s); 32 sessions above a sensible level cap |
| No primary athletic quality; MOOD's Pick | 89% Full-Body Athlete; no quality label anywhere |
| Goal | changed nothing measurable (same explosive and strength volume for every goal) |
| States | Low Energy removed one set; Amped added a set and the repeat block; nothing else |
| Target | rejected with a 422 |
| Duration | 60-minute sessions ended at 31 to 40 min, not because they were complete but because there was no strength block |
| Warm-up | 4 to 5 minutes before max-intent jumps and sprints |

What was worth keeping and is kept: the frozen exercise library and its quality / vector / impact / complexity tags, the equipment and space model, the quality-stop cues, the rule that acceleration runs stay at 10 m or less (gym lanes), low-rep dosing inside a set, and the independent-validator discipline.

## 2. The rebuild in one paragraph

Every session now answers "what are we primarily developing today?" first. The engine picks one primary athletic quality (acceleration, vertical power, horizontal power, change of direction, rotational power, upper-body power, total-body explosiveness, elastic / reactive ability) and one of six structures (Power + Strength, Speed + Strength, Agility + Strength, Jump + Throw, Contrast Pairing, Athletic Mixed). It builds the session in a fixed order: preparation, primary quality (fresh, low reps, full recovery), an optional complementary secondary quality, athletic strength chosen to support the primary quality, optional support (carry, trunk, hamstring, tendon) with a stated purpose, and a finisher only in narrow cases. Then it accounts for the whole session (impact and intent budget), reconciles to the level ceilings by removing work (never adding it), checks every State against the same session built without that State (State Satisfaction) and checks the finished session against each State as a whole (State Coherence), runs an independent validator, and only then serves it.

Files: `engines/athletic/athletic_core.py` (generator), `engines/athletic/athletic_validate.py` (independent validator), `engines/athletic/adapter.py` (production adapter, swap), `athletic_why.py` (personalization contract and Built for Today), `render.py` Athletic section. The legacy adapter is kept byte for byte as `adapter_legacy_v1.py`; `athletic_gen.py` and `sk5.py` stay on disk and their frozen QA still passes.

## 3. Programming rules, as implemented

**Power must be fresh.** Primary and secondary quality are always the first two blocks. The validator fails any power item after a strength, support or finisher block (0 of 2,160 in the stress grid). The contrast pair is the only place a heavy set precedes an explosive one, by design, with full recovery after every pair.

**Rest is prescribed.** Minimum rest by movement kind (jumps 60 to 105 s, loaded jumps and bounds 120 s, Olympic derivatives 120 to 150 s, sprints 60 to 90 s for 5 to 10 m, sled 90 to 120 s, throws 60 s) plus a work:rest check (rest at least 3 × the set's work, 2 × for throws). Low Energy adds 15 s. The block instruction says it plainly: "start the next set only when you feel fresh."

**Power dosing.** Jumps 3 reps, combinations 2, bounds 6 contacts or 3 consecutive, hops 3 per side, reactive jumps 5, pogo 10 contacts, throws 4 to 5, Olympic 2 to 3, kettlebell swing 8. Sets by role and level: primary 3 / 4 / 5 (beginner / intermediate / advanced), secondary 3 / 3 / 4, sprints 5 / 6 / 8. The validator caps reps per kind.

**Impact and intent budget (per session, 60 min; 30 min in brackets).** Jump contacts 30 / 60 / 90 (24 / 45 / 65); high-impact contacts 0 / 0 / 20; sprint exposures 6 / 8 / 10; explosive sets 8 / 10 / 13; weighted intent load 8 / 11 / 14; Olympic-derivative sets 0 / 5 / 6; at most 1 high-skill movement; at most 2 explosive exercises at 60 min, 1 at 30 min and 1 under Low Energy. Low Energy lowers contacts to 60%, explosive sets by 3 and sprint exposures by 3. Over budget, the reconciler removes sets from the most expensive power element, then drops the secondary quality. It never adds work.

**Athletic strength supports the quality.** Force for jumps (trap-bar deadlift, front squat, back squat), hinge for horizontal power, single-leg strength and hamstrings for acceleration, lateral single-leg strength for change of direction, pulling to balance pressing and throwing. Usually two exercises alternated (a lower pattern and a pull) at 60 minutes and at 30. Implements that cannot be loaded heavily (goblet squat, kettlebell deadlift, body-weight rows, lunges, DB RDL) never go below 6 reps, single-leg work never below 5 per side, and the force slot prefers a loadable lift for advanced users, strength goals and Amped.

**Duration is a window.** 60 minutes: 11 to 12 minutes of preparation, the primary quality, strength, optional support, a 3-minute cooldown. Median estimate 41 to 48 min by level (45 overall), 90th percentile 48 to 56. If a session would run over, the least essential work is trimmed; if it would run short (Low Energy), only preparation is lengthened. 30 minutes: preparation, the primary quality, one strength pair. Median 21 to 25 min.

**Finishers are rare.** Only for the conditioning goal, intermediate or advanced, 60 minutes, never after a speed or contrast session, never with Low Energy, Amped, Irritated or Stressed, and only half the time it fits: a 4 × 15 m moderate sled push or heavy carries. 2 of 486 audit sessions, 0 red flags.

**Level.** Beginner: no Olympic lifts, no high-impact, reactive or depth jumps, complexity 2 or less, 3 × 3 jumps, simple throws, a throw added as the second quality on 60-minute lower-body days (low impact, keeps the hour athletic). Intermediate: loaded jumps, bounds, hops, the one-turn shuttle, DB / KB explosive lifts, push press. Advanced: drop jumps and consecutive broad jumps (high-impact budget), barbell Olympic derivatives, contrast pairing, higher-complexity landmine work; the same low-rep, full-recovery rules and the same exercise count. Advanced 60-minute median is 4 exercises and 7 explosive sets.

**Goal** (the app's goal ids). Improve athleticism weights speed, change of direction and reactive work up and adds a secondary quality. Build strength weights total-body and vertical power, contrast pairing, and heavier strength (4 × 4 to 4 × 3, 150 to 180 s). Build muscle keeps the power low-rep and adds strength volume (4 × 6, 3 × 8 to 10). Conditioning weights acceleration and allows the rare finisher, and Built for Today says Athletic stays performance training. Feel better favours accessible, lower-impact qualities, fewer contrast sessions, RIR 3.

**Target** (now accepted for Athletic; either a session type or a Target, like Sweat). A lower Target moves primary quality weights (glutes / hamstrings toward horizontal power and acceleration, quads toward vertical power and change of direction, calves toward elastic work) and chooses the strength patterns (hamstrings: hinge; glutes: hip thrust; quads: squat and split squat). An upper Target shapes the secondary quality (chest / triceps: chest pass, explosive push-up; back / core: rotational power) and the strength pair. The primary quality stays athletic: a Chest + Triceps request gives kettlebell swings first, explosive push-ups second and weighted push-ups in the strength pair, not a chest day. Built for Today says so.

**Soreness.** Sore legs: MOOD's Pick reroutes to upper-body or rotational power with upper strength and trunk work, no jumping or sprinting; explicit Speed + Agility is a conflict (unchanged); explicit Power or Full-Body builds the honest upper-body version. Sore shoulders: lower-body power, nothing pressed or thrown overhead. Sore lower back: no loaded hinges, barbell squats, Olympic lifts, swings, rotational slams or sled. The minimal preset now includes dumbbells for Athletic (the unified preset definition), so sore legs at home builds an upper session instead of the old conflict.

## 4. States: ownership, satisfaction, coherence

| State | Owns | What actually changes |
|---|---|---|
| Low Energy | volume, complexity, impact | one explosive exercise, primary sets minus 1 (floor 3), contacts about half, complexity 2 or less, no Olympic or reactive work, strength RIR plus 1, 15 s more rest, no support or finisher |
| Bored | exercise, plane and tool novelty | a new primary quality or structure versus the last session, less common structures (contrast, Jump + Throw, Athletic Mixed, Agility), lateral / rotational / novel movements; never extra exercises |
| Irritated | movement character | forceful, simple movements (sled, sprints, broad jumps, slams, throws, swings); no footwork or reaction drills; no automatic finisher |
| Amped | intent and load | heavier strength (1 fewer rep, 1 RIR lower), one extra quality set when volume allows, contrast pairing for intermediate and advanced, a more demanding variation; never extra exercises or a finisher |
| Stressed | structure | simple structures only (Power / Speed + Strength, Jump + Throw), complexity 2 or less, no contrast, shuttle or reactive drills, 4 exercises at 60 min |
| Sore | safety | see section 3 |

Pairs resolve by ownership, never by stacking: Low Energy + Amped gives fewer efforts at full intent and heavier strength at the same volume (C1: 4 × 3 seated box jumps, front squat 3 × 4 at RIR 3, 35 min); Amped + Stressed gives heavier load in a simple structure (C2); Bored + Stressed gives new movements in a simple structure (C3); Irritated + Low Energy gives direct work at reduced volume (C4); Irritated + Stressed gives simple explosive work without drills (C5); Bored + Low Energy gives something different while the total work stays modest (C6).

Paired effect (40 users, intermediate 60, each State session against the same candidate built without the State; with / without):

| State | explosive sets | contacts + sprints | exercises | strength reps | strength RIR | max complexity | minutes |
|---|---|---|---|---|---|---|---|
| Low Energy | 3 / 4 | 5 / 12 | 3 / 4 | 6 / 6 | 3 / 2 | 2 / 3 | 33 / 41 |
| Amped | 5 / 4 | 9 / 9 | 4 / 4 | 5 / 6 | 1 / 2 | 3 / 3 | 47 / 41 |
| Stressed | 4 / 4 | 6 / 6 | 4 / 4 | 6 / 6 | 2 / 2 | 2 / 3 | 42 / 39 |
| Low Energy + Amped | 3 / 4 | 5 / 12 | 3 / 4 | 5 / 6 | 3 / 2 | 3 / 3 | 33 / 41 |

State Satisfaction and Coherence: 100% for every State on the 1,068-build metrics grid (commercial, free weights and minimal; all levels; both durations). In the 2,160-build stress grid (every explicit archetype × soreness × equipment) Bored is 89% (319 / 360); every miss is the minimal preset, where there are no novel tools to reach for, and Built for Today says so ("the options for something new are limited with this setup today"). Every other State is 100% there too.

## 5. History, Different Workout, Swap

History records the primary quality, structure, primary exercise, secondary quality, strength patterns and ids, and applies penalties (never bans). 30 users × 5 consecutive MOOD's Pick sessions: back-to-back same primary quality 5 of 120, back-to-back same primary exercise 0 of 120, 4.2 distinct primary qualities per 5 sessions. Different Workout: MOOD's Pick rotates the session type; a user-selected type or a Target keeps it and moves the primary quality and exercise (primary quality changed 11 of 12, primary exercise 12 of 12). Swap Exercise keeps the block, the role, the movement kind (a jump for a jump, a sprint start for a sprint start, a throw for a throw), no higher impact or skill, the same pattern for strength (then the same pattern group, then the same region), the same purpose for support, and the prescribed sets; the whole session is re-accounted and re-validated. 57 swaps: 54 valid, 0 invalid, 3 honest "no alternative" conflicts.

## 6. Built for Today

One synthesized line carries the strategy, composed only from realized changes (claims are stored for audit, and a test checks each claimed State kind was realized):

- No State: "Today is primarily vertical power: Trap-Bar Jump Squat comes first, while you're fresh, and Front Squat and Inverted Row build the strength behind it."
- Low Energy: "You're low on energy, so today's athletic work stays focused: 4 explosive sets, 120 s of recovery between primary sets and strength sets that stop about 3 reps short of failure. You still train explosively without turning the session into a grind."
- Amped: "You're amped, so we're spending that readiness on quality rather than piling on volume: a heavy-light contrast pair (Barbell Romanian Deadlift into Broad Jump to Stick) and heavier strength work ..."
- Irritated: "You're irritated, so the session keeps things direct with Sled Push and Med-Ball Rotational Throw. The reps stay low enough that the explosive work stays explosive."
- Stressed: "You're stressed, so there are no complicated reaction drills today: a simple power + strength structure with 4 exercises you can repeat without thinking about a dozen moving parts."
- Bored: "You're bored, so we're changing the movement experience with a new focus (acceleration), a Speed + Strength structure and Falling-Start Sprint (5 m) rather than simply adding more work."

Supporting lines give the workload ("About 15 landings and 20 throws in all, with 120 s between primary sets so every rep stays explosive"), the support purpose, the level rule that applied, the goal effect, the Target effect and the history carry-over. The workout envelope also carries an `athletic` object (primary quality, structure, accounting, limits, State gate, coherence, realized changes) for the founder layer.

## 7. Before and after (60-minute production-path sessions)

| | Legacy v1 | Rebuild |
|---|---|---|
| Explosive exercises | 3 (always) | median 1 to 2 (max 2) |
| Explosive sets | median 16 | median 6 (advanced 7) |
| Jump contacts, max | 200 | 50 (level ceilings 30 / 60 / 90; high-impact contacts advanced only, max 20) |
| Power after fatigue (repeats after 15+ sets, power after strength) | 112 of 228 | 0 |
| Power reps above 8 | 29 | 0 |
| Power rest under 45 s | 32 | 0 |
| No athletic strength at 60 min | 46 | 0 |
| Strength sets | median 3 | median 6 (8 for strength and muscle goals) |
| Exercises | 4 | 4 (max 5, never 7+) |
| Estimated minutes | median 35 | median 45 |
| Primary quality stated | never | always |
| Finisher | 0 | 2 of 486, purposeful |
| Target | 422 | accepted, shapes support |

Red-flag search on the rebuild (486 audit builds plus the 2,160-build stress grid): 3+ lower-body explosive exercises 0, high-volume jumps 0, jumps or sprints after fatigue 0, technical Olympic lifts late 0, 7+ exercises 0, high-rep power 0, inadequate rest 0, advanced = more volume no (same exercise count), Amped = more volume no (same exercise count, heavier), Irritated finisher 0, Low Energy = one set removed no (4 to 6 realized changes), Bored circus 0 (complexity cap), Stressed generic easy no (still one max-intent quality), padding 0 (only preparation is ever lengthened).

## 8. Human trainer read

I read 30 random production-path sessions (`qa/results/ATHLETIC_REBUILD_trainer_read_sample.txt`, any level, goal, equipment, State, soreness, Target) as a coach, before looking at the labels, then the 57 pack workouts. Random 30: 1 valid conflict (explicit Speed + Agility with sore legs), 27 "yes, I would give this to this person", 2 "yes, slightly heavy": T12 (advanced, build muscle: 8 short sprints then 4 × 6 / side split squats and 4 × 8 / side single-leg RDLs at RIR 1, a lot of single-leg volume after sprinting) and T10 (advanced, Bored, build muscle: consecutive broad jumps, rotational throws, then RDL and Meadows row 4 × at RIR 1, 52 minutes). Neither is unsafe or incoherent; both are the build-muscle goal doing what it says. None read as conditioning, as a strength workout with a jump in front, or as a random collection.

Problems found in earlier reads and fixed by rules, not seeds: triples on goblet squats and body-weight rows under a strength goal (load floors); a bench-press contrast followed by more pressing (the post-contrast lift is now the antagonist); two slams in one session (the secondary may not repeat the primary's movement kind); upper-only MOOD's Pick days for healthy legs (now occasional, with lower strength in the pair); Bored adding a second quality and 8 minutes (Bored no longer adds work); the same med-ball rotational throw as the secondary in almost every session (seeded secondary order plus history); name capitalization in Built for Today.

## 9. Freeze standard, item by item

1. No-State workouts are good: A1 to A9, D2, D4, D7 in the pack; trainer read above.
2. Clear purpose: every session names its primary quality and structure; the first Built for Today line explains them.
3. Max-intent work is fresh: validator rule, 0 violations.
4. Rest preserves quality: minimum rest and work:rest checks, 0 violations.
5. Impact is controlled: level ceilings 30 / 60 / 90 contacts; observed maximum 50 (intermediate), median 0 to 12.
6. Beginner is beginner: complexity 2, no Olympic / high-impact / reactive work, 3 × 3 jumps, simple throws.
7. Advanced means quality and specificity: same exercise count; advanced-only movements (drop jumps, consecutive broad jumps, Olympic derivatives with a goal reason, contrast) appear, with more rest.
8. States change real variables: section 4 table.
9. Multi-State makes sense: C1 to C6.
10. Soreness reroutes safely: B16 to B18, D11, D12; tests.
11. Target keeps Athletic identity: D8 to D10.
12. No padding: only preparation is lengthened; 60-minute median 45 min.
13. Finishers rare and purposeful: 2 of 486.
14. Ordering defensible: fixed order, validator-enforced.
15. History varies: 0 back-to-back repeated primaries.
16. Built for Today is truthful: composed from realized changes; audited by test.
17. Swap preserves intent: 54 of 57 valid, 0 invalid.
18. A coach would prescribe the workload: section 8.

## 10. Decisions and notes for the founder

- **Target in the app.** The backend now accepts a Target for Athletic. The home screen still hides Target chips for Athletic (`targetSupported()` in `frontend/utils/v3HomeModel.ts` returns false for Athletic). Exposing it is a one-line change; I left the frontend alone because it is a product decision.
- **Library.** No new exercises. Three existing records that were warm-up only now also serve as change-of-direction work: 5-5 Shuttle, Backpedal to Stick and Lateral Shuffle to Stick. They already appeared in warm-ups, so any missing video already existed there; worth a media check.
- **Minimal preset** for Athletic is now dumbbells + bench + jump rope + body weight (it was body weight only, which did not match the unified preset). Sore legs on minimal now builds an upper-body session instead of a conflict.
- **Olympic derivatives are deliberately rare**: about 5% of advanced build-strength sessions and 3% of advanced athleticism sessions, 0% for other goals and levels. They are never assigned because someone is advanced. If you want more of them for advanced strength users, it is one weight.
- **60-minute sessions end around 45 minutes** (the duration display shows "40 to 45" or "45 to 50"). That is the intended result of not padding power work; Low Energy sessions end around 33 minutes.
- **Stored Athletic workouts** built by the old engine will answer an exercise swap with `workout_outdated` (the normal behaviour when a generator changes).
- **Sprint distance** stays at 10 m or less, the gym-lane rule from the v1 freeze.

Recommendation: Athletic meets the launch standard. If the pack reads right to you, freeze it as `3.3-athletic-frozen` and move on. Cart was not started.
