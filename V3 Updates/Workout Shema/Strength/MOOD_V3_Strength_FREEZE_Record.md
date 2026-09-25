# MOOD V3 Strength: Final Freeze Record (2026-09-23)

Strength is frozen at launch quality. No further Strength architecture work; next priority is the Sweat Direction, then Athletic.

## Frozen versions

| Component | Version |
|---|---|
| Workout Architecture (WA) | FINAL_FREEZE_v16 |
| Exercise Taxonomy (ET) | FINAL_FREEZE_v11 (unchanged since Pass 1) |
| State Dial Rules (SD) | FINAL_FREEZE_v5 (unchanged) |
| Strength Exercise Library | v11 (196 exercises, 2,080 eligibility rows) |
| QA fixtures | v7 (237 archetype scenarios + 78 Custom Target cases) |
| Reference generator | v6 (audit_engine, qa_engine, prescription, structure, run_qa, regen_fixtures) |

## The three final changes

1. Lower Hinge v15 accepted as final: the 60-minute support accessory (glute, erector or core support) is default; 30 minutes unchanged. Hinge 60 sits at 16 working sets, about 41 minutes.

2. Kettlebell Swing complexity 3 to 2 (Library v11). ET defines complexity as technical / coordination demand, explicitly not difficulty. A swing is a ballistic hinge with one timing cue, in line with Dumbbell RDL (2) and Rack Pull (2) and below Barbell RDL, Conventional Deadlift and Pendlay Row (3), so the retag is internally consistent and no State-only exemption was needed. skill_level_min stays intermediate, so beginners remain gated. Effect confirmed in the diagnostic grid: Intermediate Irritated finishers are now the swing in 7 of 8 archetypes (one carry, Core none), where before they were carries only. Side effect, accepted: under Irritated the swing can now also take the Glutes + Legs primary slot for intermediates (it is forceful and now within cap), which is coach-consistent.

3. Beginner Full Body under constrained States (WA v16 rule FB1). When experience is beginner and the State lowers the complexity cap to 1 (Low Energy, Stressed, Irritated), an empty true_full_body_bridge pool no longer fails the build: the session builds bridge-less, provided the remaining required slots still cover upper and lower regions and the core slot is filled, and logs bridge_relaxed_beginner_constrained_state. No exercises added, no other slot or archetype affected. Three fixtures added (AS235 to AS237: Beginner + Low Energy, Stressed, Irritated), all VALID BUILD with four exercises and 13 working sets.

Also in this closing pass: stale Pass 3 documentation corrected (row 54 now states Lower Hinge 0.5 selected, Glutes + Legs 1.5 with the reduced-build term; Irritated finisher text no longer says the swing is complexity 3). One latent build-determinism defect fixed in the library builder: exercise roles were a Python set, so an exercise mapped to one slot by two roles with different verdicts could flip between builds; roles are now ordered and the first-listed role wins, which settles Pit Shark Belt Squat as preferred for Glutes + Legs complementary and changes five Glutes + Legs references. Library v11 now builds byte-identical across runs.

## Final QA totals (all green)

| Tier | Result |
|---|---|
| 1 Archetype fixtures | 237 / 237 pass, 237 / 237 match reference |
| 1 Custom Target fixtures | 78 / 78 pass |
| 2A Reproducibility | 90 / 90 identical (structure layer reproducible on every fixture) |
| 2B Swap variation | 39 healthy, 6 limited but defensible, 0 functionally identical, 0 constraint violations |
| 2C History / recency | 32 good rotation, 15 good repetition, 0 bad |
| 3 Soreness | 144 / 144 correct; 18 adaptive reroutes, 0 terminal conflicts, 0 failures; every reroute ranked with a logged candidate table |
| 4 Structure | 237 / 237 fixture builds pass every structure check; diagnostic grid 324 / 324 built and valid (9 archetypes × 6 States × 2 durations × 3 experience levels) |
| New S11 fixtures | 3 / 3 valid |

Confirmed: no supported-input generation failures (the grid now builds every archetype in every State for every experience level), no hard-rule violations, no soreness violations, no structure violations, no missing required slots other than the logged FB1 bridge relaxation, no regressions from the Kettlebell Swing retag (8 reference compositions changed vs v6: 5 from the belt-squat determinism fix, 1 from the swing under Irritated, 3 new fixtures; 0 expected outcome class changes).

## Known, accepted for launch

Circuits under Bored are rare by construction (three compatible equal-set accessories). Stressed same-station pairing treats two selectorized machines as one station. Core is untouched by the structure layer. Thin pools remain where earlier audits noted them (Beginner Glutes + Legs leg accessory, free-weight-only Upper Pull ancillary depth). Iterate after launch with user data.

## Files (outputs)

MOOD_V3_Workout_Architecture_FINAL_FREEZE_v16.xlsx, MOOD_V3_Exercise_Taxonomy_FINAL_FREEZE_v11.xlsx, MOOD_V3_State_Dial_Rules_FINAL_FREEZE_v5.xlsx, MOOD_V3_Strength_Exercise_Library_v11.xlsx, MOOD_V3_Strength_QA_Fixtures.json (v7), MOOD_V3_Strength_QA_Fixture_Reference_Changes.json, MOOD_V3_Strength_QA_Reference_Generator_v6.zip, MOOD_V3_Strength_QA_Founder_Review_Pass3.xlsx (regenerated only to correct stale text).
