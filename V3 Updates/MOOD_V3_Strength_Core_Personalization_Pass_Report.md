# MOOD V3 Strength Core: Personalization, Programming Methods and Explainability Pass

Branch `feature/mood-v3-app-rehaul`, nothing committed. Backend only. Architecture from Phase 1 kept (variants, bands, dials, gate-less loop replaced by a gated loop). No Sweat, Athletic, Cart, frontend, media or library expansion. No LLM. Frozen workbook untouched.

Companion files in `V3 Updates/`: `MOOD_V3_Strength_Core_Personalization_Review_Pack.md` and `.xlsx` (83 workouts with full context, WHY THIS FITS TODAY, REALIZED PERSONALIZATION, a 20-workout founder test with hidden States and an answer key, legacy comparisons, full QA metrics).

---

## 1. Founder summary

What changed, in one paragraph. Every selected State now has to leave a real, attributable mark on the finished workout or the engine tries the State's next expression, then a last-resort bundle, and logs every step. States have sharper, distinct philosophies (Stressed is now clearly not Low Energy). A small set-method layer exists (pause, 3 s eccentric, 1.5 reps, cluster, drop set, rest-pause) with hard compatibility rules; State only changes how often a method appears. Level and goal now visibly change the session, using the existing goal vocabulary. Every input records what it intended and what it actually changed (the personalization contract), and Built for Today is a 2 to 3 sentence synthesis built only from those realized consequences. A soreness audit found and fixed a real hole (picking an archetype silently overrode soreness on its own muscles).

Headline numbers over a 4,470-run production-path sample (4,431 valid builds, 39 designed soreness conflicts):

| Metric | Phase 1 (before) | Now |
|---|---|---|
| State produces at least one realized adaptation | 87% (first attempt, no gate) | 97% (5,378 / 5,548 State evaluations) |
| Of the remaining 3%: yielded to a conflicting State by an explicit rule | not tracked | 1.4% (76), all Low Energy + Amped |
| Of the remaining 3%: exhausted (every prescription already at a band floor, or a thin beginner pool) | not tracked | 1.1% (62), 47 of them in the Core archetype or beginner lower-body pools |
| Fallback expression needed | n/a | 21% of State evaluations |
| Built for Today claims not backed by a realized contract entry | not measurable | 0 of 4,413 synthesised lines |
| Style-lint violations (easier / reduced / lower) | 0 | 0 |
| Protected primary kept under every State | 100 / 100 / 98 / 100 / 100 | unchanged |
| 60-minute sessions inside 50 to 60 min (no State) | 97% | 94% (mean 53.6) |
| 30-minute sessions inside 25 to 33 min | 98% | 99% (mean 28.0) |
| Explicit Target + sore region builds a session | 23 / 24 | 24 / 24 |

Tests: 145 pass, 1 skipped, 1 pre-existing date-seeded Sweat flake (`test_sweat_difficulty_changes_dosing`, unrelated). Frozen parity tests pass.

Recommendation: freeze Strength after the founder decides one narrow policy question (section 12). Nothing else is blocking.

---

## 2. State Satisfaction Gate

Definition (in `core.build_archetype` and `core._custom_once`): after the workout is assembled, `realized_for_state(s)` lists the meaningful adaptations attributable to State `s` in the finished session. A State is satisfied when that list is non-empty. If any selected State is unsatisfied, the engine reruns with the same seed and forces that State's next expression, in table order, then the State's `LAST_RESORT` bundle. The loop is bounded (1 + 3 × number of States attempts). Everything is logged as decisions: `state_gate` (attempt, expression, realized kinds, no-op levers, satisfied), `state_gate_fallback` (from, to), `state_gate_yielded` (rule that stripped the State's levers) or `state_gate_exhausted` (what was tried).

What counts as meaningful (unchanged from Phase 1 except the two additions marked new):

- RIR change on a compound row, or on 2+ rows
- Sets change on the primary, or a total of 2+ sets
- Rep window change on a compound row, or on 2+ rows (new: the 2+ rows rule, so a Core or Arms session can realize it)
- Rest change of 15 s+ on 2+ rows, 30 s+ on one, or any 15 s+ change in a session with no compound slot (new)
- A slot removed, a tempo cue, a set method attributed to the State, a finisher the State drove
- A structure change the State's own structure weights favour over the no-State reference build
- Exercise selection differences driven by the State's exercise bias (or Bored)
- A complexity / systemic-cost cap that removed an exercise

Last-resort bundles were extended so every one carries an `all`-scope lever (RIR, sets, rest or reps across the whole session), because Core and Arms sessions have no compound slot for the primary-scoped levers to act on. The reconciler was also fixed so the clock never undoes a State's set change (`_state_sets` marker): a set Low Energy removed is never put back by the duration fill, and a set Amped added is never trimmed.

No-op rate before vs after:

| State | First-attempt no-op (what Phase 1 shipped) | Final unsatisfied after gate |
|---|---|---|
| Amped | 29% | 6% (60 of 71 are Low Energy + Amped yields by rule) |
| Irritated | 17% | 3% (30, all Core archetype, where nothing is heavy, direct or forceful to lean on) |
| Low Energy | 8% | 3% (16 yields to Amped's volume rule, 9 beginner Core sessions already at band floor) |
| Bored | 6% | 2% (21 beginner sessions with thin lower-body or pull pools: nothing less familiar to bring in) |
| Stressed | 6% | 1% |

The 76 yields are intentional: under Low Energy + Amped the conflict rule lets Low Energy own systemic cost and keeps Amped's effort only on the primary lift. In a session with no primary lift (Arms, Core) Amped has nothing left to act on, the log says so (`state_gate_yielded`, rule `low_energy_vs_effort`), and Built for Today talks only about Low Energy. That is the honest outcome, not a silent no-op.

---

## 3. State fingerprints (philosophies, not recipes)

Each State has three expressions plus a last resort. The gate picks among them by seed and history; nothing is guaranteed to appear. Realized kinds over 1,080 single- and multi-State archetype runs per State:

| State | Philosophy | Most realized kinds | Retention vs same no-State build | Sets / RIR / rest vs no-State |
|---|---|---|---|---|
| Low Energy | reduce training cost, keep the main lift | exercises 60%, RIR 59%, reps 25%, cost cap 22%, slot removed 17% | 69% | -0.75 sets, +0.55 RIR, rest flat |
| Stressed | reduce cognitive load: predictable, controlled, familiar | exercises 56%, tempo 34%, rest 32%, structure 25%, slot removed 14% | 72% | -0.45 sets, RIR flat, +4.5 s rest |
| Bored | refresh the experience | exercises 89%, set method 31%, structure 22%, finisher 7% | 57% | sets, RIR, rest all flat |
| Irritated | direct, heavy, physical | rest 45%, tempo 43%, exercises 37%, structure 35%, reps 26% | 84% | -0.62 sets, RIR flat, +9 s rest |
| Amped | use readiness productively | RIR 43%, structure 36%, volume 26%, reps 21%, set method 11% | 97% | sets flat, -0.21 RIR, +2.5 s rest |

Stressed vs Low Energy is now a different shape, not a different degree: Low Energy moves RIR and volume and leaves rest alone; Stressed leaves RIR alone and moves rest, tempo and structure. Stressed never gets Top Set + Back-off (structure weight 0.0), Paired is weighted 0.3, ladders and pyramids need intermediate+ and a bilateral lift, and Stressed's method probability is the lowest of any State (8% of Stressed sessions carry a method, and only pause or 3 s eccentric).

Bored: the novelty metadata was audited and ~55 exercises re-scored in `library_overrides.NOVELTY_RESCORE` (applied at import; frozen workbook unchanged). No exercises were added. Bored is the only State that can force a set method and the only one that lets an advanced lifter carry two.

Sore stays safety-dominant (section 8).

---

## 4. Set-method / execution layer (`engines/strength/methods.py`)

Six methods, each attached to exactly one prescription row, rendered inline (" · paused reps") with a one-line execution text in load guidance, and carried in `direction_fields.set_method` for the app. Not structural variants; a session can have zero methods under any State.

| Method | Level | Rows it may sit on | Hard compatibility | Fatigue |
|---|---|---|---|---|
| paused reps | intermediate+ | primary / secondary compound | loadable press, squat or hinge, complexity ≤ 3, not explosive | low |
| 3 s eccentric | beginner+ | secondary compound / accessory | not explosive, not core, not a bodyweight secondary | low |
| 1.5 reps | intermediate+ | accessory / secondary | machine, cable or dumbbell; isolation, or supported machine compound | moderate |
| cluster 2+2+2 | advanced | primary compound | loadable press / squat / hinge, Heavy Primary, Traditional or Top Set shape only | moderate |
| drop set (final set) | intermediate+ | accessory / secondary | machine or cable (dumbbell only if isolation), supported | high |
| rest-pause (final set) | intermediate+ | accessory | isolation, supported or machine/cable, rep window ≥ 10 | high |

Universal rules: reps-based rows only, never on a row that already carries a tempo cue, a top-set scheme or another method, never on carries, never on rows under 2 sets. At most one method per session (two only for an advanced lifter who is Bored). A planned finisher cuts method probability by 60%. Methods add realistic seconds to the time model (`timing.method_seconds`). Mechanical drop sets are the only load-drop method and stay on supported machine or cable work.

Probability by level (no State): beginner 19% of sessions (3 s eccentric only), intermediate 42%, advanced 66%. By State: Bored 72%, Amped 39%, Irritated 19%, Low Energy 12%, Stressed 8%. Method mix over the sample: pause 338, 3 s eccentric 335, 1.5 reps 141, rest-pause 135, drop set 101, cluster 49. History penalises a method used in the last completed session of the same archetype.

---

## 5. Experience level: visible effects

Beginner has its own bands (RIR floor 2 on compounds, sets ≤ 4, rep windows one notch higher). Intermediate and advanced share bands; advanced now carries a band-position fingerprint (`core.LEVEL_POS`: primary RIR position -0.3, primary sets +0.15, secondary reps -0.1) plus the method and pool differences. Over 160 no-State 60-minute runs per level:

| | Beginner | Intermediate | Advanced |
|---|---|---|---|
| Set method in session | 19% (3 s eccentric only) | 42% | 66% (cluster available) |
| RIR distribution | 2: 742, 3: 110 | 2: 448, 1: 388 | 1: 483, 2: 361 |
| Primary rep windows | 6–8 (116), 8–10 (39) | 5–7 (93), 4–6 (42), 6–8 (20) | same windows as intermediate |
| Accessory windows | 12–15 (295), 15–20 (63) | 10–12 (266), 12–15 (85) | 10–12 (262), 12–15 (92) |
| Top Set + Back-off | never | 14 of 160 | 14 of 160 |
| Exercise pool | beginner-rated, low complexity, supported bias | intermediate pool | complexity ≥ 3 and free-weight bias |

Realized text for the level (from the contract) is what the synthesis uses: for a beginner it only says "keeps at least two reps in reserve" when the minimum RIR in the session really is 2; when a State pushed a beginner accessory to RIR 1 it says "no set runs closer than a rep from failure".

---

## 6. Goal: visible effects (existing vocabulary)

Every goal in the app vocabulary now has a shape multiplier (`variants.GOAL_MULT`), a band-position shift (`core.GOAL_POS`), a method weight (`methods.GOAL_W`) and realized text. Over 40 no-State 60-minute intermediate/advanced runs per goal:

| Goal | Shape lean | Primary rest (most common) | Accessory sets / session | Other visible marker |
|---|---|---|---|---|
| build_strength | Heavy Primary 14, Top Set 10 | 240 s (26 of 40) | 6.0 | primary 4–6 in 18 of 40; pause and cluster favoured |
| build_muscle | Volume 14, Paired 14 | 150 to 180 s | 7.9 | drop set, rest-pause, 1.5 reps favoured |
| improve_athleticism | Heavy Primary 12 | 240 s (18) | 6.8 | primary 4–6 in 16 of 40 |
| lose_weight_conditioning | Paired 16 | 165 to 195 s | 7.5 | accessory rest 45 s in a third of rows; drop set and rest-pause favoured |
| feel_better_reduce_stress | Traditional up, Top Set down | 240 s | 7.4 | compound RIR 3 appears (12 rows); 3 s eccentric favoured |
| stay_consistent | deliberately neutral | 240 s | 7.3 | the balanced default is the point |

The review pack shows the same seed under three goals (Lower Body: Squat, 60, intermediate: build strength / build muscle / conditioning) so the difference is visible side by side.

---

## 7. Personalization contract

`core.personalization()` emits one entry per input: `{input, value, intended, realized[]}` and, for States, the expression used and the realized kinds. Inputs covered: each State, soreness, experience, goal, Target (explicit or Full Body), duration, equipment, history. `realized` is built only from events and comparisons that happened; an input that changed nothing keeps an empty list and the pack prints "realized: nothing (no claim made)". The contract rides in the engine result (`personalization`) and is exposed to QA; the synthesised Built for Today line carries `claims`, the list of contract entries it rests on, so the truthfulness audit runs from the envelope alone.

---

## 8. Soreness audit and correction

Findings:

1. Picking an archetype silently overrode soreness on that archetype's own muscles. Upper Push with sore chest trained chest normally and told the user "because you asked for it" although the user never named chest. Root cause: the frozen S2a rule treated the archetype's defining muscles as user-named. Correction (one line in `qa_engine.generate`, flag set by the core): only muscles the user explicitly named in a Custom Target override soreness. An archetype choice never does. Consequence in the sample: 39 of 192 archetype + sore-defining-muscle requests now return the standard conflict envelope with options (Change Target, Let MOOD pick, Try Sweat / Athletic) instead of training the sore muscle. MOOD's Pick with the same soreness still reroutes to a session that avoids it (e.g. sore chest → Upper Pull).
2. Naming "back" overrode a sore lower back, because the lower-back region rolls into the back group. Correction: spinal erectors are never overridden unless the user named lower back. Back + biceps with sore lower back now builds around chest-supported and machine rows and says "shifts stress away from your sore lower back".
3. Chest + triceps with sore shoulders sometimes conflicted, because that Target routes to Upper Push, whose shoulder-press slot cannot be filled. Correction (adapter routing): an explicit Target routed to an archetype whose defining muscle is sore and unnamed is built as a Custom Target instead. 24 of 24 explicit Target + sore region combinations now build.
4. Custom Target movement families were counted per muscle block, so chest + triceps could stack three presses. Fixed: the family cap (two per session) is session-wide, including the block lead.

Sore secondary movers keep the -3.0 ranking penalty; the contract reports how many movements still use the sore muscle as a secondary mover, and Built for Today says so.

---

## 9. Built for Today architecture

`why_today.build(ctx, res)` produces 2 to 3 sentences from the contract, and only from entries with realized consequences:

1. Sentence 1: State(s), soreness first when present. Multi-State uses a pair opener ("You're amped but stressed, so we're…") and at most three verb-phrase fragments, each mapped from a realized kind (RIR, volume, reps, rest, slot, tempo, structure, method, finisher, exercises, cap). Nothing fires without its realized event.
2. Sentence 2: level and goal, only when the contract has realized items for them, joined with ", and".
3. Sentence 3: history continuity ("Barbell Bench Press and Parallel Bar Dip stay so your progression carries over, the session runs a different shape from last time…") or a multi-muscle Target, only when there is a real choice to report.

Information hierarchy is enforced by construction: State → soreness → major programming consequence → level → goal → Target → history. The per-State template lines are suppressed when a synthesis exists; the code stays `state_<s>` / `state_pair` (or `why_today` with no State) so the app, the teaser and the QA harness keep working. The lint bans "easier", "reduced" and "lower" as claims (proper names such as "lower back" are exempt), and the tests ban "rep range", "hypertrophy", "you picked".

Examples (all from the pack, verbatim):

- Amped, Upper Push, 60, intermediate: "You're amped today, so we're adding a working set to Barbell Bench Press. Your muscle goal is why 3 accessory movements sit behind the main lifts."
- Stressed, Lower Body: Hinge, 60: "You're stressed today, so we're keeping the structure simple and predictable, keeping the reps controlled and rhythmic and sticking to familiar movements you can run on autopilot. Your muscle goal is why 2 accessory movements sit behind the main lifts."
- Low Energy + Amped, Squat, 60: "You're amped but running on less energy than usual, so we're keeping you further from failure on Leg Extension and Lying Leg Curl, taking Barbell Back Squat a rep closer to failure and leaving out the higher-cost accessories."
- Bored, advanced, Upper Pull: "You're bored today, so we're changing the feel with drop set on the final set on the Dumbbell Pullover and bringing in 4 less-familiar movements. Since you're an advanced lifter, we're keeping 1.5 reps on Bayesian Cable Curl in the mix, and your muscle goal is why 3 accessory movements sit behind the main lifts."
- Sore lower back, Target back + biceps: "Today's workout shifts stress away from your sore lower back."

Truthfulness audit: 4,413 synthesised lines, 0 claims without a realized contract entry. 18 workouts (no State, no soreness, nothing beyond the structure) have no synthesised line and fall back to the structure, volume and intensity lines.

---

## 10. Personalization QA metrics

Sample: `qa/strength_core_sample.py` (4,470 runs: 9 archetypes × 13 State sets × 2 durations × 3 levels × 5 seeds, a 6-goal grid, 9 Targets, 8 archetypes × 4 sore regions × 3 State sets, 12 explicit Target + sore combos, 7 sequential users). Metrics: `qa/strength_core_metrics.py`. Full output is the Summary sheet of the pack. Key lines beyond the tables above:

- Determinism: same seed reproduces the same workout (unchanged).
- Sequential users: no back-to-back variant repeat for the no-State user over 10 sessions; the Amped-every-session user cycles top set / extra set / heavy end without repeating an expression back to back; Bored-every-session rotates exercises and methods with 2 method repeats in 8 sessions (both 3 s eccentric, the only method a beginner-compatible accessory can carry in that pool).
- Amped 60-minute sessions: finisher 19%, Top Set + Back-off 20%. Irritated 60: finisher 18%, carries or kettlebell swings 7%. Low Energy: accessory sets reduced in 18% (RIR and exercise selection carry the rest).
- Duration: no-State 60 mean 53.6 min (94% in window), 30 mean 28.0 (99%). Core archetype is exempt by frozen design (see section 11).

---

## 11. Remaining weaknesses (honest list)

1. Core archetype ignores duration by frozen design ("Core formats unchanged", 2 to 4 straight movements): a 60-minute Core request estimates 20 to 28 minutes, and a beginner 30-minute Core sits at every band floor, so Low Energy and Irritated have nothing to act on there (47 of the 62 exhausted gate cases). Not touched in this pass; it needs a Core slot-plan decision, not a personalization fix.
2. Beginner lower-body and pull pools are thin, so Bored sometimes cannot bring in a less-familiar movement (21 cases). No library enrichment was allowed in this pass.
3. Intermediate and advanced share prescription bands; advanced differs through RIR position, method frequency, cluster availability and exercise bias, not through different windows. Deliberate, but visible only in some sessions.
4. Level and goal sentences in Built for Today are template-flat compared with the State sentence. They are truthful, but "your muscle goal is why 3 accessory movements sit behind the main lifts" will read repetitive over many sessions. The claims map is in place if the founder wants richer goal phrasing later.
5. Set methods are attributed to a State only when the State's probability lifted them; a method that appears under Stressed by level/goal alone is correctly not claimed, but the user cannot tell the difference. Fine for truthfulness, worth knowing.
6. The per-State fragment library is small (about 8 phrasings per State). Over months a user will see repeats.
7. Stressed and Low Energy share "exercises" as the most common realized kind (stable, supported, familiar movements); the fingerprint difference lives in the second kind (rest/tempo vs RIR/volume). A trainer can tell them apart; a casual reader may need the WHY line.

---

## 12. Recommendation

Freeze Strength after one narrow policy decision, which does not need code beyond a flag:

**When a user selects an archetype (not a muscle Target) and reports soreness on one of that archetype's own muscles, the engine now returns a conflict with options instead of silently training the sore muscle.** Options on the table: (a) keep the conflict with options (current, safest, one more tap for the user), (b) auto-reroute like MOOD's Pick with a "we moved you to Upper Pull because your chest is sore" line, or (c) the legacy silent override. I recommend (a) or (b), not (c). The frozen conflict envelope already carries the "Let MOOD pick" option, so (a) costs the user one tap; (b) is a ten-line change in the adapter if you prefer it.

Everything else in this pass is ready for freeze. Stop here for founder review.

---

## Appendix: files changed in this pass

New: `why_today.py`, `engines/strength/methods.py`, `engines/strength/library_overrides.py`, `qa/strength_core_sample.py` (rewritten), `qa/strength_core_metrics.py`.
Changed: `engines/strength/core.py` (gate, contract, LEVEL_POS, GOAL_POS, reconciler `_state_sets`, Custom Target family cap, `_exhausted` / `_yield_rule`), `engines/strength/dials.py` (LAST_RESORT bundles, expressions), `engines/strength/variants.py` (GOAL_MULT for all six goals), `engines/strength/adapter.py` (sore-aware Target routing), `engines/strength/qa_engine.py` (named-only override, lower-back rule; two lines in a frozen file, documented inline), `explain.py` (synthesis integration, `claims` on the line), `render.py` (method label and text), `timing.py`, `progression.py`, `build_info.py` (2.8-strength-core-personalization), `service.py` (ENGINE_VERSION strength-core-p2), tests.
