# Sweat engine: FROZEN (V3, engine phase 3.2-sweat-frozen)

Frozen on 2026-09-27 after the rebuild pass, the Hybrid architecture correction and the final programming-quality pass
(duration is an available window, not a work quota). Behaviour changes to the Sweat generator from here on require a founder
decision and a new engine phase.

Baselines (2,012 production-path runs, `qa/sweat_core_sample.py` + `qa/sweat_core_metrics.py` + `qa/sweat_core_metrics_extra.py`
+ `qa/sweat_workload_metrics.py`, full output in `SWEAT_FREEZE_metrics_baseline.txt`; the previous pass is printed beside it as BEFORE):

- Block composition, 60 minutes: main only 59%, main + one complement 39%, main + finisher 2%, main + complement + finisher 0
  (was 25% / 69% / 0% / 5%). 30 minutes: main only 100%. Hybrid: one block 100% (a closer in 4 of 304 sixty-minute Hybrids).
- Primary block completeness (finished main block): 60 minutes: substantial 319, sufficient 709, insufficient 157 (the last get
  a modest complement). Complement frequency by main-block effort: steady 48%, moderate 39%, hard (RPE floor 8 or hi 9) 10%;
  finisher frequency 2% / 3% / 0%.
- Median 60-minute session: 47.8 min elapsed, 20.5 meaningful active minutes (18.4 in the main block), 12.5 engine minutes,
  56 loaded reps, warm-up 10, downshift 6. Median 30-minute session: 25.0 elapsed, 11.1 active.
- State Satisfaction Gate (finished session vs no-State reference, excluding States yielded by rule): Low Energy 99.0%,
  Stressed 98.4%, Bored 96.0%, Irritated 95.9%, Amped 99.0%. Whole-session coherence: 94.7% of verdicts, every failure listed.
- Built for Today truthfulness: 5,137 claims, 0 unbacked.
- Workload budget: 0 sessions above a level ceiling except 9 with a small open violation (impact contacts or 30 s of engine time).
- Hybrid regression: legacy 7 x 800 m Row fixture guarded by `tests/test_sweat_rebuild.py`; anchor share max 48%.
- Unified QA all green; tests 168 pass, 2 skipped.

Frozen modules: `engines/sweat/{sweat_core,adapter,sweat_gen,sweat_data,sweat_validate}.py`, `sweat_why.py`, the Sweat parts of
`explain.py`, `render.py`, `progression.py`. `adapter_legacy_v4.py` is kept for the legacy comparison only.
