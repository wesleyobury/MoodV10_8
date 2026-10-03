# Strength: final pre-launch trainer-quality pass (engine phase 3.5-strength-final-prelaunch, 2026-10-02)

Scope: no architecture change. Fixes for sessions that passed every validator but would make a good trainer question them,
plus a small deterministic Trainer Coherence Gate. Recommended: FREEZE Strength at this build.

## What changed (files)

- `engines/strength/core.py`
  - Custom Target: combination / integrated lifts (Clean to Press, Thruster, Renegade Row) are no longer Custom Target material; the
    block lead prefers the most muscle-specific loadable compound (Hip Thrust for Glutes) and never a ballistic / niche lift.
  - Custom Target pairing: a block's lead lift is never supersetted; a cross-block superset sits after both muscles' leads.
  - Accessory relevance by archetype (`acc_tier`): Hinge accessories are hamstrings / glutes / erectors first; Full Body accessories
    must fill a gap; low-value filler (band pull-apart, front raises after pressing, Copenhagen plank, adductor machines, mountain
    climbers) only when nothing relevant is left; Arms delt work is raises, not presses.
  - Target-fulfilment tier no longer forces a second hamstring-involving lift once the Target is covered (Hinge: RDL + Cable
    Pull-Through in 30/30 sessions -> RDL + a hip-thrust family lift most days).
  - Support lifts: no niche lunge (curtsy / lateral) by default, no unloaded push-up as a trained lifter's press, loadable second
    lower-body lift preferred; the Full Body bridge adds a pattern instead of a second squat.
  - Upper Pull main-lift variety (added before freeze): any high-value loadable back lift can lead (pull-up family, lat pulldown,
    chest-supported / cable / machine / barbell / T-bar rows). Each session picks row or vertical pull with an even seeded choice
    that leans away from the last Upper Pull's lead pattern; the last two leads are penalised; inverted rows and the assisted
    machine never lead for a trained lifter; the second pull is not heavier than the lead. Across levels the lead is ~55/45
    vertical / row with 10+ different leads and no back-to-back repeat (was the chest-supported machine row in ~90% of sessions).
    Trade-off: the Upper Pull main lift no longer repeats session to session for exact-lift progression.
  - Full Body always presses and pulls (Renegade Row bridge -> the upper slot becomes a press).
  - Assisted Pull-Up Machine / Assisted Dip: beginner only.
  - Arms: straight sets grouped by muscle (order flips by session) or, on a paired 60-minute shape, antagonist supersets
    (lead pair, then depth pair). Never a curl paired with a raise.
  - At most two "special" elements per session (three when Bored): top-set scheme, set methods, pyramid / ladder, finisher.
  - Finishers belong to the session (no thruster after a pull day, no carry on a hinge / push day; carries are farmer carries
    outside Full Body). Controlled-tempo text renamed to "Controlled eccentrics".
- `engines/strength/dials.py`: Amped Top Set weight x40 -> x5 (State bias x1.5 -> x1.0); paired x3 -> x2; new Amped `intensity`
  expression (intermediate+): accessory effort up, compounds heavier, one forced intensity method.
- `engines/strength/methods.py`: "3 s eccentric" -> "eccentrics"; no method on a top-set primary; no rest-pause / drop set on trunk
  work; no slow-eccentric floor deadlifts; Amped rarely gets eccentrics / 1.5 reps.
- `engines/strength/bands.py`: a fixed-load movement never exceeds its library rep band (Dragon Flag 6–8, Glute-Ham Raise 8–10,
  Sissy Squat 9–12 instead of 12–15); Kettlebell Swing dosed 12–15.
- `engines/strength/trainer_gate.py` (new): Trainer Coherence Gate + the block-role labels the cart reads.
- `engines/strength/adapter.py`: gate on archetype builds (re-roll with the existing salt retries, ship the attempt with the fewest
  issues, log them); Custom Target / Core gated for logging.
- `render.py`: block `type` / title = the role in THIS workout (Arms lead curl / extension = main; Custom Target blocks = Target,
  titled by muscle; Core trunk work = Target "Core", bracing lifts = Strength).
- `strategy.py`, `why_today.py`: copy fixes ("leaving left out", "1 less-familiar movements", empty "using it: ," fragment,
  "no main lift" when there was one, blank sore region), "eccentrics" wording.
- `build_info.py` phase -> 3.5-strength-final-prelaunch; `service.py` ENGINE_VERSION strength-frozen-v4.
- Tests: new `tests/test_strength_trainer_gate.py`; `test_nordic_dose.py` and `test_phase2_5.py` updated for the intended changes.

## Results

- Tests: 284 passed, 3 skipped (excluding two suites that need backend-level modules outside mood_v3). Unified QA: 0 failures.
- Trainer QA (`qa/strength_trainer_qa.py`, 3,785 production builds: every archetype x every State and 10 multi-State combos x
  30/60 x 3 levels, 20 Custom Target combos, MOOD's Pick by frequency / goal, soreness, explicit Target + soreness, limited
  equipment, Full Body Target): Trainer Coherence Gate failures 0 (pre-pass code on the same matrix: 832, including 81 off-target
  leads, 83 assisted machines for intermediate / advanced, 341 low-value accessories, 87 coverage gaps, 81 State overloads).
- Amped Top Set + Back-off share (eligible sessions): 41% -> 11–21% depending on the mix; Amped now spreads over traditional,
  paired, heavy primary, top set, volume.
- Freeze metrics (`STRENGTH_FINAL_PRELAUNCH_metrics.txt`, same 4,470-run sample as the Sep 26 freeze): State Satisfaction 98%,
  whole-session coherence 98.9%, Built for Today claims without a realized entry 0, prescription mismatches 0, lint 0, beginner
  RIR-0 rows 0.
- Conflicts unchanged vs pre-pass (sore whole-lower-body vs lower archetypes, 3 sore generation_failed, minimal-equipment Upper Pull).
