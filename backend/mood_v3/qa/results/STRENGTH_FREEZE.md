# Strength engine: FROZEN (V3, engine phase 3.0-strength-frozen)

Frozen on 2026-09-26 after founder review of the personalization pass and the freeze pass. Behaviour changes to the Strength
generator from here on require a founder decision and a new engine phase.

Baselines (the freeze pass sample, 4,470 production-path runs, `qa/strength_core_sample.py` + `qa/strength_core_metrics.py`,
full output in `STRENGTH_FREEZE_metrics_baseline.txt`):

- State Satisfaction Gate: 98% of State evaluations satisfied (5,474 / 5,558); 52 yielded to a conflicting State by rule
  (Low Energy vs Amped), 28 exhausted (thin beginner lower-body / pull pools for Bored, one beginner Full Body for Amped).
- Whole-session State Coherence: 99.0% pass (58 failures of 5,558), every failure listed in the baseline file.
- Built for Today truthfulness: 0 claims without a realized contract entry; 0 realized RIR / set details that disagree with the
  final prescription (3,366 checked); 0 style-lint violations.
- Duration: no-State 60-minute sessions mean 53.8 min (94% inside 50 to 60); 30-minute mean 28.1 (99% inside 25 to 33).
  Core 60: mean 53.3 (84% inside 50 to 60); Core 30: mean 27.5 (86% inside 25 to 33).
- Beginner: only 3 s eccentric, only on machines / cables / stable accessories; 0 RIR-0 rows; 0 high-fatigue methods; no burnout finishers.
- Soreness: MOOD's Pick reroutes; a user-selected archetype is narrowed around the sore area (Custom Target) when part of it can
  be trained, otherwise the conflict envelope; explicit Targets build 24 / 24 sore combinations; only whole-lower-body soreness
  with a user-selected lower-body archetype conflicts (24 of 4,470 runs).
- Unified QA (`qa/run_unified_qa.py`): all green (`MOOD_V3_Unified_QA_Results.json`). Tests: 145 pass, 1 skipped, 1 pre-existing
  date-seeded Sweat flake (`test_sweat_difficulty_changes_dosing`).

Frozen modules: `engines/strength/{core,dials,variants,bands,timing,methods,coherence,library_overrides,adapter}.py`,
`why_today.py`, `strategy.py`, the Strength parts of `explain.py`, `render.py`, `progression.py`. The frozen workbook and
`audit_engine.py` / `qa_engine.py` (two documented lines) are unchanged.
