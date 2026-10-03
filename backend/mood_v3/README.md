# mood_v3: MOOD V3 unified workout generation

Server-side generation for the three frozen V3 Directions behind one interface: `service.generate_workout(user_context)`.
The API contract is in [CONTRACT.md](CONTRACT.md).

```
request ─► normalize.py ─► service.py ─► engines/<direction>/adapter.py ─► frozen generator ─► frozen validator(s)
                                                                                             │ (retry / explicit conflict)
          router.py ◄── media + cues ◄── explain.py ◄── progression.py ◄── render.py + formatter.py (shared schema v3.0)
```

| Module | Role |
|---|---|
| `engines/strength/{audit_engine,qa_engine,prescription,structure}.py` | Frozen Strength reference generator v6 (WA v17 / ET v12 / SD v5 / Library v11) |
| `engines/strength/trainer_gate.py` | Trainer Coherence Gate (final pre-launch pass): deterministic trainer-quality checks on the finished session + the cart's block-role labels. QA: `python -m mood_v3.qa.strength_trainer_qa` |
| `engines/sweat/{sweat_data,sweat_gen,sweat_validate}.py` | Frozen Sweat FINAL FREEZE v4 generator and validator |
| `engines/sweat/sweat_core.py` | Sweat production generator (FROZEN, phase 3.6-sweat-final-prelaunch): blueprints, State layer, workload budget, minimum meaningful work per duration, no standalone steady-state main block. See `qa/results/SWEAT_FINAL_PRELAUNCH.md` |
| `engines/sweat/trainer_gate.py` | Sweat Trainer Coherence Gate (final pre-launch pass): deterministic trainer-quality checks on the finished session; failing builds are re-rolled in `sweat_core.gate_select`. QA: `python -m mood_v3.qa.sweat_trainer_qa out` |
| `engines/athletic/athletic_core.py`, `athletic_validate.py` | Athletic (FROZEN, phase 3.4): primary quality + further athletic movements chosen by an athletic movement budget with cost tiers A/B/C (2-4 at 60 min), strength as 1-2 support exercises, no carries, muscle-ups and explicit athletic variants, 5 structures (no agility / footwork drills), low-rep power dosing with full recovery, athletic strength, impact / intent budget, State ownership, State Satisfaction + whole-session Coherence; independent validator |
| `engines/athletic/trainer_gate.py` | Athletic Trainer Coherence Gate (final pre-launch pass): composition, loaded power, archetype identity, sequencing, redundancy, strength balance; the generator tries the next candidate on issues. Every Athletic item also carries a `performance_role` the cart shows instead of muscles. QA: `python -m mood_v3.qa.athletic_prelaunch_qa <prefix>`; notes: `qa/results/ATHLETIC_FINAL_PRELAUNCH.md` |
| `engines/athletic/{athletic_gen,lib3,lib2,athletic_lib,audit2,sk5,sweat_shared_data}.py` | Frozen Athletic library (read by the rebuild) and the Reference Generator v1 kept for comparison (`adapter_legacy_v1.py`) |
| `athletic_why.py` | Athletic personalization contract + Built for Today synthesis (claims rest on realized changes) |
| `engines/VENDOR_PATCHES.md` | Every line changed while vendoring (paths and imports only) |
| `engines/state_rules.py` | SD v5 multi-State arbitration (the frozen Sweat implementation, shared read-only) |
| `engines/*/adapter.py` | Per-Direction production adapter: input translation, validation, exercise swap, conflicts |
| `normalize.py` | Unified input contract: States, soreness vocabulary, presets, Target / archetype rules |
| `formatter.py`, `render.py` | Shared app-facing schema and per-Direction mapping (formatting only) |
| `explain.py` | Built for Today, template-based and driven by generator events |
| `cues.py` | Launch cue layer: Olympic / explosive, Athletic quality-stop, unusual movements |
| `progression.py` | Conservative exact-exercise progression |
| `router.py` | FastAPI routes (`/api/v3/workouts/*`), Mongo `v3_workouts`, media enrichment from `db.exercises` |
| `data/` | The frozen workbooks the engines read at import (about 2.5 s at first use) |

## Tests

```
cd backend
python -m pytest -c mood_v3/pytest.ini mood_v3/tests -q           # about 310 tests, about 80 s
python -m mood_v3.qa.run_unified_qa out.json                     # unified production QA (8,424 builds plus swaps, history and conflicts)
python -m mood_v3.qa.sample_pack pack.json pack.md               # the 15-workout production-output pack
```

- `tests/test_frozen_parity.py` replays each Direction's frozen QA harness against the vendored engines and requires byte-identical results.
- `tests/test_integration.py` requires the production adapters to reproduce the frozen generators on every frozen fixture, and runs the unified QA.
- `tests/test_router.py` covers the HTTP flow with an in-memory Mongo stand-in: generate, swap, complete, history, progression, conflicts and 422s.

## Rules for changing this package

- Don't edit `engines/*/` (except `adapter.py`) to change programming behavior. Those files are the frozen contracts. Any change must
  come from a founder-approved re-freeze and must keep `test_frozen_parity.py` green.
- A generated workout reaches the app only after its Direction validator passes. Anything else is an explicit conflict.

## Built for Today copy (Oct 2026 quality pass) — `mood_v3/bft/`

The workout is fully built and validated first; this layer only describes it and can never change it.

1. `bft/brief.py` — the **verified story brief**: facts read only from the finished workout, the personalization contract's
   *realized* consequences and the decision log (soreness, State adaptations, Target, goal/level/history, then the session's own
   structure). Each fact carries its contract claims. Nothing is inferred from dials.
2. `bft/compose.py` + `bft/phrases.py` — the **deterministic composer** (production fallback, and the writer when no key is set):
   picks the 2–3 facts that best explain the session, tells them with one of several narrative approaches (how you feel / biggest
   change / what we're NOT doing / Target first / sequence / coaching cue), resolves multiple States as one rationale, generates
   ~70 candidates and keeps the best one that passes the gate and is least like the user's recent messages.
3. `bft/gate.py` — the **quality gate** used by both writers: 2–3 sentences, ~20–58 words, banned clinical/feature language,
   soreness acknowledged, personal when the user told us something, only today's exercise names, similarity to recent messages.
4. `bft/llm.py` — the **optional LLM writer**. Enabled by `ANTHROPIC_API_KEY` (`BFT_LLM=off` disables, `BFT_LLM_MODEL` default
   `claude-haiku-4-5`, `BFT_LLM_TIMEOUT_S` default 2.5). Runs async in the router after generation, sees only the brief and the
   user's recent messages, returns 3 options; the first that passes the same gate (plus a numbers check) replaces the composer
   copy. Timeout / error / failed gate → the composer copy that is already in the envelope ships. It never blocks the workout.

Envelope: `workout.today.blurb` (the copy the app shows verbatim) and `workout.today.blurb_meta` (`source`, `frame`, `facts`).
`built_for_today` lines are unchanged (detail / QA / analytics). The router reads the user's last 8 blurbs from `v3_workouts`
and strips the server-only `_bft` brief before storing or returning. QA pack: `python -m mood_v3.qa.bft_qa out.md out.json`.

**Frozen (Oct 2026).** Gate standard: Hook (sentence one unmistakably reflects what we know today, label not required) -> Proof
(the named mechanism, never a summary: `VAGUE`, `SCHEMA` and `FILLER` lists in `bft/gate.py` fail a message) -> optional Cue.
Similarity tracks storytelling devices (`FAMILIES`) and sentence-one constructions across the last messages, not just word overlap.
The composer is the quality floor; the next QA round is on live LLM output from the same briefs.

### Hybrid streaming (Oct 2026) — the workout never waits for the message

1. `/generate`, Different Workout and a message-changing Swap Exercise save the workout with the composer copy as the
   **fallback** and, when the writer is enabled, `today.blurb_pending: true` + `today.bft_job`. The response returns at once.
2. A background task (`router._bft_run` → `bft.llm.stream`) streams ONE message from the Messages API into a server-side
   buffer. The model starts with a `FACTS: f1, f3` line (the facts it relies on), then the plain-text message.
3. Each complete sentence passes `gate.sentence_problems` (claims vs the brief, exercise names, numbers in the cited facts,
   banned / internal / filler / vague language, first-sentence test, States visible by sentence two) before it is released.
   A sentence is released only once text after it has started (a single-sentence message never shows), and never past
   3 sentences / `MAX_WORDS`. A bad first sentence gets one fresh attempt while nothing is shown.
4. Released text is written to the workout doc (`bft.text`, `bft.status` writing → streaming → done | fallback); the Cart polls
   `GET /workouts/{id}/bft` (~350 ms) and reveals it (`components/v3/BftLiveText`). On completion the message is saved into
   `envelope.workout.today.blurb` (`blurb_meta.source = 'llm'`), so a reopened workout shows it immediately.
5. Failure before the first sentence → status `fallback`, the composer copy shows. Failure after → the released, complete
   sentences are the final message (never replaced). The full `gate.check` runs on the result and is logged
   (`final_problems`). A job still `writing` after `BFT_STALE_S` (20 s, e.g. a restart) settles on what it has.

Config: `BFT_STREAM_TIMEOUT_S` (default 7) bounds the background call; `BFT_LLM=off` or no key → composer only, never pending.
Not-persisted previews (`persist: false`) always use the composer.

**Launch freeze (Oct 2026).** Final production-path QA: `qa/bft_final_qa.py` -> `qa/results/BFT_FINAL_QA.md` (96 generations: 76% LLM,
24% composer fallback, 9 invented sentences blocked before display, 1 invented swap shown and now blocked, first text p50 1.27 s / p95 2.27 s). Built for Today is frozen:
change it only for a launch-impacting defect found in production.
Absolute safety promises ("your back stays safe", "protects your joints", "injury") are blocked by `gate.SAFETY`; the copy
describes the programming decision instead ("keeps heavy loading away from your lower back").

**Sore trunk stabilizers (Oct 2026 generator fix, `engines/strength/core.py` `sore_trunk_loaded`).** A sore muscle that only assists
still costs a lift 3 points. A sore lower back / core acting as the stabilizer of an UNSUPPORTED lift (bent-over rows, free-weight
hinges and squats, swings: library `sup` = unsupported with the muscle in `sec`) is avoided ahead of Target fit whenever the slot has
another option, and the Upper Pull lead ranking now applies the soreness penalty too (it returned before it). Continuity never
keeps last session's lift when that lift leans on a sore muscle. Sweat (strict sore-secondary key) and Athletic (explicit
lower-back loading rules) already behaved this way. Regression: `tests/test_sore_trunk.py`.

Instrumentation: one `bft stream {...}` log line per job and the same metrics in `v3_workouts.bft.metrics`: `ttft`,
`t_first_sentence`, `t_first_display`, `total`, `outcome` (complete | partial | fallback), `reason` (complete, trimmed, timeout,
`sentence N rejected: …`, single sentence, malformed, error), `streamed_before_failure`, `attempts`, `attempt_reasons`,
`rejected` (sentence + problems), `final_problems`. Fallback rate:
`db.v3_workouts.aggregate([{$match: {'bft.metrics': {$exists: true}}}, {$group: {_id: '$bft.metrics.outcome', n: {$sum: 1}}}])`.
