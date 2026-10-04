# Athletic: final pre-launch trainer-quality pass (engine phase 3.7-athletic-final-prelaunch, 2026-10-02; composition pass 3.8 below)

Scope: no architecture change (the rebuilt Athletic engine stays: primary quality + structure, movement budget with cost tiers,
impact / intent budgets, State ownership, State gate + coherence, independent validator). This pass fixes sessions that passed
every validator but would make a performance coach ask "why is this programmed this way?", and adds a small deterministic
Athletic Trainer Coherence Gate. Recommended: FREEZE Athletic at this build.

## What changed (files)

- `engines/athletic/athletic_core.py`
  - Loaded power. `is_loaded` / `is_major_loaded` (Olympic derivatives, DB / KB explosive lifts, loaded jumps, speed-strength lifts,
    swings, push presses / jerks, explosive landmine work). `loaded_need`: 2 = an intermediate / advanced Power day must carry one;
    1 = a 60-minute intermediate / advanced Full-Body Athlete day should; 0 for beginners and Low Energy.
  - Power primary ranking: major loaded power x2.6 (a swing x1.3: it supports more than it leads), lateral / single-leg / split /
    step-up jumps x0.5, a Tier C primary (med-ball throw, seated box jump) x0.3 for trained athletes (also on sore-leg days),
    the Power Skip never leads Power. Inside a chosen Power archetype, qualities with a loaded option x1.6 and total-body (Olympic)
    x1.5. MOOD's Pick keeps its archetype balance (verified: Power / Full-Body / Speed share unchanged).
  - `composition_gaps` + `ensure_composition` (after the extras step): Power without major loaded power, Speed + Plyo with fewer
    than two lower-body speed / plyo elements, Full-Body Athlete (60 min) missing lower- or upper-body athletic work. Each gap is
    filled by adding (when the movement budget allows) or replacing the least valuable further element (Tier C first); budgets,
    family caps, one-high-skill and "barbell Olympic lifts only lead" all still hold.
  - Composition, not count: `TARGET_N` beginner 2-3 (was mostly 2), intermediate 3-4, advanced 3-4 (more 4s). In the extras step
    a Tier C throw only rounds out a session that already has two Tier A / B movements; Speed + Plyo extras are speed / plyo
    (no Olympic / swing / speed-strength); Power adds its loaded movement first; Full-Body adds its missing upper element.
  - Speed + Plyo identity: second element is speed / plyo first (`SECONDARY_FOR`, `SECONDARY_KINDS`), the lower-after-lower rule
    allows bounds / hops / elastic work and only blocks a same-direction second jump or a second sprint. 30-minute trained sessions
    may take a short speed / plyo second element (budget-checked) instead of an automatic med-ball throw. Never a second Tier A
    element the budget would immediately drop.
  - Vocabulary from the existing, photographed library (never programmed before): Power Skip; Split-Stance, Half-Kneeling and
    Push-Up-Start Sprints; Broad Jump to Sprint. No new exercises needing media. Redundancy groups: one broad-jump variation,
    one box-jump variation, one split-jump variation, one push-press / jerk variation per session.
  - Strength support: a 3-athletic-movement 60-minute day carries 2 strength supports (4 -> 1). `strength_form`: two strength
    exercises are a superset only by choice (30 min: always; two leg lifts: never; heavy barbell / trap-bar lift for an advanced,
    Build Strength or Amped lifter: 15%; otherwise 35-55%), else separate straight-set blocks with their own full rest. A single
    strength lift and a trunk support can be paired (`paired_support`, "Athletic Strength + Core"). Repairs, duration trims and
    budget repairs handle two strength blocks (`strength_blocks`, `drop_second_strength`). Strength items carry `slot`.
  - No goblet-squat "heavy" contrast pair. Budget repair trims the secondary before the primary on a tie.
  - `performance_role` + `PERFORMANCE_ROLES` (Total-Body Power, Lower-Body Power, Upper-Body Power, Rotational Power,
    Acceleration, Plyometric, Strength Support, Core / Stability, Conditioning).
  - Generate loop: the Trainer Coherence Gate joins the State gate (try the next candidate; ship the fewest issues; logged).
- `engines/athletic/trainer_gate.py` (new): athletic_insufficient, power_unloaded, low_level_dominant, sequencing, redundant,
  complexity, strength_heavy, identity (Speed + Plyo / Full-Body gaps, throw-led Power, Speed not led by speed / plyo).
- `engines/athletic/adapter.py`: `athletic_summary.trainer_gate`; swap keeps the strength slot.
- `render.py`: every Athletic item carries `direction_fields.performance_role`; every block `performance_roles`; paired strength +
  core block titled "Athletic Strength + Core".
- `athletic_why.py`: Built for Today names every strength support across blocks.
- `cues.py`: quality-stop for jump-to-sprint ("combination"); cues for the 5 newly programmed exercises.
- Frontend: `utils/v3CartFormat.ts` (`performanceRole`; Athletic section sub-labels, row facts and the exercise sheet caption use
  the performance role, never muscles), `utils/v3Session/coach.ts` (Guided Session role line), test in `v3CartFormat.test.ts`.
- `build_info.py` phase -> 3.7-athletic-final-prelaunch; `service.py` ENGINE_VERSION athletic-frozen-v5.
- Tests: new `tests/test_athletic_trainer_gate.py`; `test_athletic_rebuild.py` State test allows the intended 4 -> 1 / 3 -> 2
  strength-support coupling.

## Results

- Tests: 314 passed, 3 skipped (merged with the Sweat final pass) (excluding `test_v3_completion.py`, which needs backend modules outside mood_v3). Unified QA green.
  Frontend: v3CartFormat 25/25, v3Session suites green.
- Trainer QA (`qa/athletic_prelaunch_qa.py`, 1,968 production builds: 4 archetype modes x 3 levels x 30/60 x no State / every
  State / 7 pairs / 3 triples, 6 goals, 3 soreness regions, 2 limited presets, 4 Targets, 3 days): Trainer Coherence Gate issues
  2 of 1,950 (beginner 30-min minimal-equipment Speed + Plyo with no second element available; logged, honest). 18 conflicts are
  the intended sore-legs + explicit Speed + Plyo conflict.
- Before -> after, same inputs (explicit archetype, intermediate + advanced, 60 min, 3 goals incl. Build Strength, 7 days; 42
  sessions per archetype; `qa/athletic_prelaunch_before_after.py`):
  - Power with a meaningful loaded explosive movement: 64% -> 100%. Loaded primary (no State): 5-27% -> 73-77%.
  - Speed + Plyo with 2+ lower-body speed / plyo elements: 48% -> 100%; a med-ball throw in the session 69% -> 29%.
  - Full-Body Athlete with lower-body + upper / rotational + loaded power: 45% -> 100%.
  - Two strength exercises as a superset: 43-48% of sessions -> 10-19%.
  - Library usage (all 1,968 builds): med-ball rotational throw / slam were the two most programmed movements -> broad jump, CMJ
    and sprints lead; Push Press and Trap-Bar Jump (0 cart rows in the image tracker) are now regular Power leads.
  - All inputs: Low Energy superset share 100% -> 21%, beginner 44% -> 16%.
  - 60-minute trained sessions: estimated 44-50 min -> 47-53 min (still a window, not a quota).
- Broad-grid invariants (`ATHLETIC_FINAL_PRELAUNCH_final_audit.txt`, 882 builds): every check 0 (power after strength, carries,
  high impact below advanced, Tier A / cost over budget, sprint / sled accounting, Built for Today claims, beginner too advanced,
  30 min > 3 exercises, State gate / coherence).
- Repetition: 8 consecutive explicit Power / Speed / Full-Body days per level: no back-to-back repeat of the primary exercise.

# Composition pass (engine phase 3.8-athletic-composition-pass)

Founder review after 3.7: too much sprinting, and too predictable "3 athletic movements + 2 strength lifts". No architecture change.

## What changed
- Sprinting is a sprinkle in a standard gym (`ctx.sprint_space`, default False): sprint-led candidates x0.2, sprints x0.25 in
  ranking and extras, acceleration moves to the end of the secondary list 80% of the time, sled x0.4-0.5 outside the primary.
  The engine accepts `sprint_space=True` (turf / track) and then programs sprints as before; the app has no such input yet.
  Gate: `sprint_heavy` (two sprint variations).
- Speed + Plyo no longer needs sprinting: vertical power joins its qualities, power_strength + elastic maps to Speed + Plyo for
  MOOD's Pick, its primary is always speed / plyo work, its second element is elastic / horizontal / vertical first.
- Session composition is chosen, not templated (`composition_mode`, 60 min, trained users; beginners choose between the two
  lighter shapes): loaded_power (4 athletic incl. 2 loaded + 1 lift), athletic_volume (4 athletic + trunk / stability, no lift),
  power_complex (3 athletic + 1 lift, sometimes trunk), strength_supported (3 athletic + 2 lifts). Weights by archetype, goal
  (Build Strength favours strength_supported), State (Stressed: no 4-athletic shapes; Amped / Bored: richer shapes) and history
  (last session's shape x0.4). Low Energy, sore legs, 30 min and contrast days keep the fixed rules. A shape that cannot reach
  its athletic count gets one lift back so it is never thin. The validator accepts an athletic_volume session without a lift
  (3+ athletic movements + support, 60 min). `athletic_summary.composition` reports the shape.
- Support work leans athletic: the slots a second lift used to fill now hold loaded / unilateral athletic work; a lone support
  lift for a trained athlete is athletic-leaning (trap-bar, front squat, split squats, step-ups, single-leg RDL, pull-ups, landmine
  press) whenever the plan offers one; bench / machine-style lifts x0.6 otherwise.
- One box-jump variation per session (lateral box jump joins the group); beginner lateral jumps get 90 s rest (work:rest fix).

## Results (`ATHLETIC_COMPOSITION_PASS_template.txt` vs `_before_template.txt`, 1,968 production builds)
- Sessions with a sprint: all 39% -> 6%; Speed + Plyo 82% -> 13%; trained 60 min 46% -> 8%. Two sprint variations: 0%.
- Traditional lifts in trained 60-minute sessions: 0 / 1 / 2 lifts 1% / 35% / 64% -> 10% / 57% / 33% (no State: 18 / 50 / 32%).
- Composition shapes, trained 60 min: power_complex 25%, strength_supported 24%, loaded_power 17%, athletic_volume 15%, fixed
  rules (Low Energy, contrast, sore legs) 19%. Consecutive sessions with the same shape: 100% -> 13%.
- Lone support lifts that are athletic-leaning (trained): 87%.
- Loaded power in trained 60-minute sessions 65% -> 69%; Olympic / KB / DB explosive work 30% -> 36%.
- Tests 319 passed, 3 skipped. Trainer gate issues 0 of 1,950. Broad-grid invariants all 0.

# Sequencing / presentation pass (engine phase 3.9-athletic-sequencing-pass)

No architecture change. Goal: a glance at an Athletic cart shows one intentionally sequenced session.

## What changed
- Performance-demand order (`demand`, `order_athletic`, `sequence_session`): 0 = high-skill / high-velocity power (Olympic
  derivatives, explosive lifts, loaded jumps, drop / reactive / consecutive jumps, muscle-ups), 1 = ballistic / plyometric (jumps,
  bounds, hops, throws, swings, landmine and dumbbell presses, sprints), 2 = velocity-strength (speed pulls / squats), then the
  strength and support blocks. When a loaded high-demand lift sat behind the lead: a low-fatigue jump lead becomes a **Primer**
  (2 sets, 3 reps, full intent) and the loaded lift leads; otherwise the loaded lift simply moves first. Intentional potentiation:
  ~30% of loaded lower / total-body leads take a low-fatigue jump from later in the session as their Primer. Speed + Plyo keeps
  its speed / plyo lead; contrast pairs are unchanged. Validator: `demand_lead`, demand order, `primer_low_fatigue`; the role
  order allows one Primer before the primary. Built for Today names the Primer.
- Cart phases: every Athletic block carries `phase` / `phase_label` (`render.ath_phases`): Primer -> Power ("Speed & Plyo" on a
  Speed + Plyo day, "Plyometrics" for an unloaded jump-only Power phase) -> Athletic Strength ("Athletic Core" / "Resilience"
  when no lift). The app groups consecutive blocks by phase, drops Primary / Secondary / Strength / Support labels on straight
  blocks, labels a contrast pair as such and emphasises the Power phase.
- Athletic core: Dead Bug, Side Plank and Copenhagen Plank removed. Trunk work is loaded anti-rotation (Pallof press / step-out,
  "heavy enough that resisting the pull is hard"), loaded rotation (Landmine Rotation) or the explosive Cable Wood Chop, and is
  added only when the session has no forceful rotational element already (throw, slam, landmine rotation). A 4-movement athletic
  session may end with no support at all.
- Velocity strength: traditional lifts in Athletic are dosed light-to-moderate, crisp reps (3-6, mostly 3-5), 2-4 reps in
  reserve, 90-150 s rest, with the cue "Explode through every rep: move the weight as fast as you can with control. Stop the set
  when the speed clearly drops." Role "Velocity Strength", context tag FOR VELOCITY (contrast halves: HEAVY, THEN EXPLODE; Primer
  sets: PRIMER). The cart shows the tag under the prescription.
- Exercise swaps never push a session past its time window.

## Results
- Tests 322 passed, 3 skipped; frontend cart / session suites green (v3CartFormat 26/26).
- 1,950 production builds: gate issues 0; broad-grid invariants all 0; composition-pass metrics unchanged (sprint 6%, 0/1/2 lifts
  10/56/33% trained 60 min).
- Sequencing: 50 of 1,950 sessions had a higher-demand loaded lift moved to lead (29 with a Primer, 21 simple reorders) and 8 took
  an intentional potentiation Primer; every session now runs in demand order.
- Rendered-cart QA (`frontend/qa/v3/athletic_cart_qa.ts` over 448 real envelopes, `ATHLETIC_SEQUENCING_PASS_carts.txt`): 0 failures;
  phases per cart 1 / 2 / 3 = 20 / 409 / 19; shapes Power > Athletic Strength 303, Speed & Plyo > Athletic Strength 104, Primer >
  Power > Athletic Strength 19; 511 / 511 velocity lifts tagged FOR VELOCITY; no passive core. Visual mock of six carts:
  `ATHLETIC_SEQUENCING_PASS_carts.png` (an HTML replica of the cart layout, not a device screenshot).

## Founder swap (after 3.9, engine phase string unchanged)
- No trap-bar deadlifts or back squats in Athletic, in any form: Trap-Bar Deadlift and Barbell Back Squat left the Athletic
  strength vocabulary and the contrast pairs; Speed Trap-Bar Deadlift and Speed Box Squat left the athletic vocabulary. Their jump
  versions take that force production: Trap-Bar Jump Squat and Dumbbell Jump Squat (x1.4 in selection). The library has no
  barbell back-squat jump, so the Dumbbell Jump Squat is the back-squat replacement (a barbell jump squat would need a photo).
- With the trap-bar deadlift gone the bilateral force slot fell mostly to the front squat; trained users now rotate that slot
  across patterns (55% of sessions lead the support work with a split squat / hinge / hip thrust instead).
- 1,950 builds: Trap-Bar Deadlift 0, Back Squat 0, speed pulls / squats 0; Trap-Bar Jump Squat in 166 sessions, Dumbbell Jump Squat
  in 186. Front squat 550 of 2,328 support lifts (was 881 right after the swap, before the rotation). Gate issues 0, broad-grid
  invariants 0, tests 322 passed.
- Follow-up: Trap-Bar Jump Squat and Dumbbell Jump Squat also serve the Athletic Strength slot (`STRENGTH_DUAL`, dosed as
  velocity strength: 3 x 3, light load, max-height jumps, full reset; their landings count toward the contact budget; never
  alongside another loaded jump in the same session, never on Low Energy). The slot is now a seeded weighted choice across the
  plan's patterns with a balance factor (`SLOT_BALANCE`) instead of always the top lift of the first pattern. Trained users,
  1,950 builds: front squat 15%, Bulgarian split squat 14%, front-foot-elevated split squat 11%, Dumbbell Jump Squat 11%,
  Trap-Bar Jump Squat 9%, hip thrust 7%, others below 5%. A Low Energy hour may now run 25-27 minutes rather than pad its warm-up.
  Tests 323 passed.
