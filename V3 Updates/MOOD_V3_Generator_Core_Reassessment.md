# MOOD V3 Generator Core Reassessment

Architecture audit + V2 reconciliation. Analysis only. No code, fixtures, or frozen data were modified.

| | |
|---|---|
| Scope | `backend/mood_v3` (engines, service, router, formatter, explain), `frontend/app/v3`, `frontend/components/v3`, V2 `utils/workoutGenerator.ts`, V2 cart (`app/cart.tsx`, `contexts/CartContext.tsx`), V2 data files, `exercises_seed_data.py` |
| Evidence | 7,173 generated workouts through the real production path (`service.generate_workout`): 4,149 Strength, 1,728 Sweat, 1,296 Athletic, plus sequential-history simulations. Scripts live outside the repo and were not committed. |
| Lenses | Trainer: is the programming defensible, appropriate and engaging? Product: does the engineering produce something intuitive and premium? |
| Verdict in one line | The infrastructure is good. The programming brain is a rule switchboard, not a programming model, and it is producing exactly what the founder observed. Rebuild the brain (composition, prescription, State dials, workload budget), keep everything around it. |

---

## 1. Executive Diagnosis

MOOD V3 generates *valid* workouts. It does not generate *programmed* workouts. The difference explains every founder observation.

1. **State is implemented as a lookup table of named recipes, not as dials.** `structure.py::build_blocks` is literally an `if st == 'low_energy' ... elif st == 'amped' ... elif st == 'irritated'` switch. Each branch hard-codes one structural signature (Low Energy: all straight; Amped: density superset + burnout isolation; Irritated: antagonist superset + a finisher drawn from a 7-item list). The frozen validator then *enforces* the signature (`ALLOWED_BY_STATE`, `normal_60_straight`, `irritated_finisher_forceful`, `amped_finisher_isolation`). The product cannot vary because the rules forbid it from varying.

2. **The no-State session has no structural layer at all.** With no State, a 60-minute Strength session is straight sets 100% of the time (162/162 sampled) and the validator fails anything else. State was made responsible for making the workout interesting, which is the inversion the founder called out.

3. **Prescription is a per-class constant, not a range.** Reps are `6/8/10/12/15` by slot class, RIR is `2/1` minus one under Amped or Irritated, rest is `150/120/90/60/45` by class. Three rep values (10, 12, 8) cover 84% of every prescription generated. There is no band for a State to move inside; the only expressible State effect is "minus one set from the last non-required slot" or "RIR minus 1".

4. **Sweat validates blocks locally and fills duration with the primary block's unit.** For Hybrid the unit is *another anchor round*. The time model assumes 2:00/500 m rowing for intermediates and 1:48/500 m for advanced, so the estimator under-counts round time, which lets duration-fill push rounds to 6 to 8. The founder's 7 × 700 m is the modal output for an intermediate 60-minute Hybrid under Amped, not an outlier.

5. **State exercise bias overrides session identity.** `pred_score` (the State predicate) ranks *above* continuity and Target for every slot, including the protected primary. Under Low Energy a Barbell Bench Press day becomes an Incline Dumbbell Press day; Low Energy changes 72% of a session's exercises while Amped changes 4%. Low Energy replaces the workout; Amped decorates it. Neither modulates it.

6. **History does not touch adaptation.** Recency penalizes exercise and family reuse in slots, but finishers, structural patterns and State expressions carry no history. Four consecutive Irritated squat sessions ended in Kettlebell Swings four times; three of four Amped push sessions ended in Prone Y-Raise.

7. **The 60-minute request produces a 39-minute session.** Mean estimated Strength time at 60 is 38.9 min; 88% of 60-minute Strength sessions estimate under 45 min. Athletic averages 36 min. The app then displays "40 to 45 min" against a 60-minute request. That is a product credibility issue independent of State.

None of this is a bug in the sense of code disagreeing with spec. The code agrees with the spec. The spec (WA v15 ST1 to ST4, SD v5 DIAL BINDING) describes signatures.

---

## 2. Evidence

Sampling design: 6 user/date seeds × every archetype × 12 State configurations (none, 5 singles, 6 pairs) × {30, 60} × {beginner, intermediate, advanced}, commercial gym, plus Custom Target, soreness and sequential-history runs. Frozen data and code untouched; runs used the production service path.

### 2.1 Strength (3,888 archetype runs, 12 conflicts, 0 exceptions)

| Metric | Result |
|---|---|
| No-State 60-min sessions that are only straight sets | **100%** (162/162). Validator check `normal_60_straight` requires it. |
| No-State 30-min sessions that are only straight sets | 94% (153/162); the rest have exactly one accessory superset (B26 time-fit rule) |
| Low Energy 60: one set removed from an accessory | 94% (152/162). At 30: 67%. |
| Low Energy: Built for Today says "one set comes off the last accessory" | **100%** of Low Energy sessions, including 79 of 354 where no set was actually removed (`dial_volume` logs `-1` with operation "no non-required set available", and `explain.py` keys the sentence on the value, not the operation). Truthfulness defect. |
| Low Energy structure | 100% straight (validator allows only `straight`) |
| Amped 60: burnout finisher present | **89%** (144/162). Density superset in 44%. |
| Amped 30 | 0% finisher, 0% superset. Amped at 30 is RIR minus 1 and nothing else. |
| Amped finisher exercise distribution | Chest-Supported Rear-Delt Row 33, Frog Pump 20, Pec Deck 18, 45° Back Extension 15, Machine Glute Kickback 13, Prone Y-Raise 9 |
| Irritated 60: forceful finisher present | **89%** (144/162). Kettlebell Swing 51, Farmer Carry 50, KB Clean and Press 16, DB Clean to Press 13, DB Snatch 10, Suitcase Carry 4. |
| Irritated 60: session contains a carry | 33% (54/162); the finisher pool is 7 exercises, 3 of them carries |
| Irritated 30 | 0% finisher (identical to Amped 30: RIR minus 1 only) |
| Bored 30 | 52% straight-only; the rest one ladder or pyramid |
| Bored 60 | one superset + one ladder or pyramid in 78%; pattern chosen by md5 hash from a fixed list of 4 |
| Stressed 30 / 60 | 100% straight / 56% one same-station superset |
| Sequential Irritated Lower Squat (4 sessions, history carried) | Kettlebell Swing finisher **4 of 4** |
| Sequential Amped Upper Push (4 sessions) | Prone Y-Raise finisher 3 of 4; identical block structure 4 of 4 |
| Rep targets across all items | 10 (6,195), 12 (4,084), 8 (2,742), 15 (1,030), 6 (278). Three values cover 84%. |
| Rest values | 90 s (6,370), 60 s (5,335), 120 s (2,798): 91% of items |
| RIR values | 1 (7,842), 2 (5,372), 0 (2,867). Nothing else exists. |
| Estimated minutes for a 60-min request | mean 38.9, range 18 to 50; **88% under 45 min** |
| Estimated minutes for a 30-min request | mean 21.6, 11% under 15 min |
| Glutes + Legs, no State, intermediate, 6 different users | **5 distinct exercises across 6 sessions**; all 5 appear in every session (Hip Thrust, Trap Bar DL, Reverse Lunge, Cable Kickback, Leg Extension) |
| Lower Squat, same conditions | 7 distinct exercises; Leg Press, Leg Extension, GHD Raise in every session |
| Custom Target "chest", 60 | 5 exercises, every one `3 × 10, 90 s, RIR 2`; one build contained Cable Fly, DB Fly and Pec Deck together (three fly variants in five exercises) |

State deltas measured against the *same* no-State build (same user, date, archetype, duration, level):

| State | Δ working sets | Δ exercises | Δ mean RIR | Δ mean rest | Δ est. min | Exercises kept from base |
|---|---|---|---|---|---|---|
| Low Energy | −1.35 | −0.37 | 0.00 | +0.3 s | −2.5 | **28%** |
| Stressed | −0.29 | −0.10 | 0.00 | −0.4 s | −1.1 | 45% |
| Bored | +0.28 | 0.00 | 0.00 | −1.9 s | −0.8 | 54% |
| Irritated | −0.32 | +0.32 | **−0.99** | −3.1 s | +1.0 | 62% |
| Amped | +0.06 | +0.44 | **−1.03** | −3.2 s | +1.2 | **96%** |
| Amped + Stressed | +0.21 | −0.10 | −0.68 | −0.1 s | +0.1 | 43% |
| Low Energy + Stressed | −1.35 | −0.37 | 0.00 | +0.3 s | −2.5 | 25% |

Reading: rest never moves. Sets move by at most one. RIR moves by exactly one or zero. The only large lever is exercise replacement, and it fires hardest for the State (Low Energy) where identity preservation matters most.

### 2.2 Sweat (1,296 archetype runs + 432 MOOD's Pick runs, 0 conflicts)

Hybrid anchor aggregate (anchor dose × rounds, 60-minute sessions):

| Level | Anchor | Dose | Rounds | Total anchor volume | Estimated session |
|---|---|---|---|---|---|
| Beginner | Row | 400 to 500 m | 6 to 8 | 2,400 to 4,000 m | 36 to 46 min |
| Intermediate | Row | 500 to 700 m | 6 to 8 | **3,500 to 4,900 m** (mean 4,200) | 38 to 45 min |
| Advanced | Row | 550 to 800 m | 6 to 8 | **4,200 to 5,600 m** (mean 4,775) | 38 to 45 min |
| Intermediate | Run | 500 m | 5 to 6 | 2,500 to 3,000 m | 35 to 40 min |
| Advanced | Ski | 700 to 800 m | 6 to 7 | 4,200 to 5,600 m | 39 to 45 min |

- Round count distribution at 60: **7 rounds in 94 of 216**, 6 in 68, 8 in 48, 5 in 6.
- 23% of all Hybrid sessions carry 4,000 m or more of anchor distance. Under Amped the 60-minute row-anchor mean is 4,833 m across levels; Amped + Irritated and Amped + Stressed reach 5,250 m mean, 5,600 m max.
- 48 sampled sessions matched or exceeded the founder's 7 × 700 m.
- In a 60-minute Hybrid each of the 5 stations appears in only 1 or 2 rounds (`rotating=True`), so the session is 70 to 80% anchor by time. The "stations" are one set each.
- Hybrid structure is `anchor_circuit` in 216/216 sixty-minute runs regardless of State; State changes anchor dose (±15 to 20%), round rest (30/45/60 s) and one Irritated finisher in 6 of 36 runs. Hybrid is one shape.
- Time model: `SPM['row_erg']=0.24` s/m is a 2:00/500 m split; advanced multiplies by 0.9 (1:48/500 m). At a realistic repeat-effort split (2:10 to 2:20 for intermediates with stations between), the 7-round Hybrid runs 50 to 58 minutes of block time, not 31.

State signatures in Sweat (exercise appearing in N of 108 sessions for that State):

| State | Signature exercises | Kept from no-State base |
|---|---|---|
| Irritated | Air Bike 76, Sled Pull 62, Battle Rope Waves 48; finisher is Battle Rope Waves in 36 of 42 finishers | 33% |
| Amped | Med Ball Slam 76, DB Push Press 66, Skater Hop 46 | 26% |
| Low Energy | Stationary Bike 72, Glute Bridge 54, Suitcase Carry 48 | **10%** |
| Bored | (varied) | 20% |
| Stressed | (varied) | 44% |

Sweat States rebuild the session rather than adjust it. Other observations: 60-minute Engine and Circuit estimate 39 to 55 min (reasonable); MOOD's Pick for a user with no history returns `sweat_circuit` in 432 of 432 runs regardless of State or equipment.

### 2.3 Athletic (1,296 runs, 0 conflicts)

| State | Δ exposure sets | Δ rest | Exposures kept | Other |
|---|---|---|---|---|
| Low Energy | +0.38 (then no QC block) | −9 s | 54% | QC present 0% (vs 67% base), PS present 74%, target 32 min |
| Amped | +0.32 | 0 s | **99%** | QC bouts 7 instead of 6; PS drops to 33% |
| Irritated | +0.63 | −6 s | 56% | PS 33% |
| Bored | −0.15 | −3 s | 71% | QC block is SkiErg in **36 of 36** Bored sessions |
| Stressed | +0.42 | −5 s | 27% | QC restricted to ergs |

Athletic is the healthiest Direction. Rest does not shrink with State (correct for power quality). Low Energy reduces power volume and removes repeat efforts (correct). Weaknesses: Amped is nearly inert (one QC bout and one set); Bored has a hard SkiErg signature; estimated time at 60 averages 36 min.

### 2.4 Library and media

- Strength library v11: 196 active exercises, 42 swap families, 93 isolation / 92 compound / 11 integrated. Novelty ≥ 4: 16 exercises. Explosive: 5. Forceful-safe: 13. `impact_level` is `low` for all 196 (the tag carries no information in Strength).
- Sweat: 226 rows, **82 usable** (class A/B/NEW). Engines 8, anchors 5, finisher pool 11.
- Athletic: 292 rows, 112 eligible across slots; Speed + Agility primary pool is 10.
- Media: `db.exercises` seed has 174 exercises with video and thumbnail. Name-normalized match against V3 libraries: **Strength 69/196 (35%)**, Sweat 32/82 (39%), Athletic 37/112 (33%). Unmatched includes staples (Push-Up, Lat Pulldown, Farmer Carry, Row Erg, Air Bike, Battle Ropes, most cable arm work).
- V2 imagery is per *routine*, not per exercise: 1,508 authored V2 workouts, 1,384 with `imageUrl` (1,269 Cloudinary), 24 empty, 5 with video. It is a source of hero/theme images, not exercise thumbnails.

---

## 3. Root Causes (ranked by impact)

| # | Root cause | Where | Founder symptom it produces |
|---|---|---|---|
| 1 | **State expressed as a fixed recipe per State, enforced by the validator** | `engines/strength/structure.py` (`build_blocks`, `ALLOWED_BY_STATE`, `FORCEFUL_FINISHER`, `BORED_PATTERNS`); `sweat_gen.py` (`MODE_RULES`, `circuit_comp` ctype ladder, `hybrid_primary` `forceful_day`) | "Amped = burnout", "Irritated = Farmer Carry / swing", "Low Energy = one set off" |
| 2 | **No structural layer for the base session** | `structure.py`: `st is None` branch emits straight sets (one superset only at 30); validator `normal_60_straight` | "No-State Strength is all straight sets" |
| 3 | **Point-value prescription with no bands** | `prescription.py` (`rep_target`, `rest_rir`, `SETS_BY_CLASS`, `DIALS`) | State cannot express itself through reps/rest/tempo/load; every accessory is 12 or 15 reps at 60 s |
| 4 | **Duration fill by repeating the primary unit + optimistic time model, no aggregate budget** | `sweat_gen.py` (`build` DF loop, `add_unit` for anchor circuits, `SPM/SPC/LVM`, `HYBRID_BAND`) | 7 × 700 m rowing; anchor-dominated Hybrids |
| 5 | **State predicate ranked above continuity and Target in exercise ranking, for every slot** | `qa_engine.py::rank` (`-VR, -pred_score, -tc, ...`); `sweat_gen.py::ranked` (`le_rank`, `state_tier` before recency) | Low Energy swaps the main lift; Sweat States rebuild the session; 10 to 28% exercise retention |
| 6 | **No adaptation history** (finishers, patterns, State expressions are not recorded or penalized) | `history_record` carries exercises and slots only; finisher choice is seeded by user/date/archetype only | Same finisher session after session under the same State |
| 7 | **Session duration target not enforced as an output** (working-set band, not minutes) | `BAND={60:(12,16)}`, `est_minutes_blocks` runs after composition; `duration_underfill_accepted` | 60 requested, 39 delivered, "about 40 min" displayed |
| 8 | **Explainability keyed on dial values, not on what happened** | `explain.py` Low Energy line | Built for Today claims a set was removed when none was |
| 9 | Thin pools in specific slots and near-duplicate isolation stacking in Custom Target | Library v11 pool widths (`target_accessory` 3, `leg_accessory` 3, `secondary_target_press` 4, `ancillary_depth` 6); `compose_custom` isolation-first fill | Same 5 Glutes + Legs exercises every time; 4 fly variants in a chest block |
| 10 | Amped at 30 minutes, Amped in Athletic, Hybrid under every State have no meaningful expression | `PR.prescribe` (`dur==60` guards), `athletic_gen.assemble`, `hybrid_primary` | States feel inert in those cells |

Causes 1 to 4 are architectural. 5 to 8 are design choices inside the same layers. 9 is data. 10 falls out of fixing 1 to 3.

---

## 4. Current Architecture Map

Request → output for each Direction. File references are exact.

**Shared path** (`router.py` → `service.py`): `POST /api/v3/workouts/generate` → `apply_profile_defaults` (explicit value > `users.training_profile` > default) → `normalize.normalize` (Direction resolution, State aliases, soreness regions → muscles, `sore` auto-State, presets, Target vs archetype exclusivity, date seed) → `service._generate` → Direction adapter `build(nctx, history, swap)` → `render.format_*` (schema v3.0 blocks/items) → `progression.attach` → `explain.build_lines` → `formatter.envelope_ok` → persistence in `db.v3_workouts` (state + envelope) → `attach_media` (name match against `db.exercises`).

### Strength (`engines/strength/`)

| Layer | Where | What is decided |
|---|---|---|
| Inputs | `adapter._sc` | experience, equipment set, single "frozen State" (multi-State collapses to one structural State via `STRUCTURE_PRECEDENCE`), sore set, history, swap count, user/date seed |
| Routing | `adapter.build`: explicit archetype > `route_target` (exact-set table, single muscles fall to Custom Target) > `moods_pick` (goal rotation list, never-completed first) | archetype |
| Blueprint | `audit_engine.SLOTS` read from WA v17 `ARCHETYPE + SLOT IDS`; slot class, required/default/optional by duration, protected flag | slot list, fixed per archetype |
| Exercise selection | `audit_engine.candidates` (hard filters: active, skill, equipment, space, sore-primary, complexity cap ± State) + `_CON` slot constraints; `qa_engine.rank` sort key `(-verdict, -pred_score, -target_cov, swap+recency family, swap+recency exercise, profile distance, -bias, seed)` | one exercise per slot, in slot order |
| Duration fill | `qa_engine.backfill`: add optional slots until working sets ≥ band floor (12 at 60, 8 at 30); trim above ceiling (16 / 11) | which optional slots exist |
| Prescription | `prescription.prescribe`: `SETS_BY_CLASS` by duration and class; `rep_target` = 6/8/10/12/15 by class and equipment; `rest_rir` = fixed rest by class, RIR 2/1 minus `effort` dial; ATD1 drops three accessories to 2 sets; Low Energy −1 set on last non-required slot; Amped +1 set (60 only) unless a finisher is planned | sets, reps, rest, RIR |
| Structure | `structure.build_blocks`: switch on State; pairs from `pairable` accessories with equal set counts; finisher from `burnout_candidate` (Amped) or `FORCEFUL_FINISHER` list (Irritated) | blocks |
| State | Three touchpoints: `STATE_CAP` (complexity ±1), `pred_score` (exercise bias), `DIALS` (volume/effort/extras/structure_novelty ∈ {−1,0,1,2}) → the structure switch | |
| Multi-State | `adapter.resolve_states` → Sweat's `resolve_dials` (sum and clamp, 6 named pair overrides), then *one* structural State by precedence | |
| Whole-session validation | None on load. `est_minutes_blocks` is computed after the fact and only displayed. | |
| History | last 2 completed sessions of the same archetype: family and exercise recency (non-protected slots); protected slot continuity with last completed primary | |
| Validator | `qa_engine.validate` (slots, families, caps, equipment, eligibility, Target coverage, set band) + `structure.validate_blocks` (structures allowed per State, pairing rules, finisher rules) | |

### Sweat (`engines/sweat/`)

| Layer | Where | What is decided |
|---|---|---|
| Inputs | `sweat_gen.make_ctx`: preset → equipment/space, goal row, sore set minus Target-named muscles, target regions | |
| Dials | `resolve_dials` (SD v5): V, E, N (→ NE, NS), C, G, X; pair overrides; Amped-at-30 and Low-Energy-Extras-off rules; complexity cap ≤ 3 | |
| Routing | `select_archetypes`: Target → Circuit; else goal rotation, beginner pushes Hybrid last, State affinity sets, least recent first, `feasible` precheck | archetype order |
| Blueprint | primary block builder per archetype (`engine_primary`, `circuit_primary`, `hybrid_primary`) + optional complement (`_add_comp`) + optional finisher | |
| Exercise selection | `ranked`: hard filters (class A/B/NEW, equipment, skill, cap, high impact rules, sore) then sort `(sore_secondary, verdict, structural pref, LE tier, -state_tier, -target, swap fam/ex, recency fam/ex, recent_count, -le_fine, -state_fine, ...)` | |
| Prescription | `station_dose` (fixed tables by exercise/level, ×1.25 hybrid); Hybrid anchor from `tsec` seconds via `SPM/SPC/LVM` time model; interval W/R from fixed tables by format and level; RPE ranges by block, +E under Effort | |
| Structure | `circuit_primary` opts list filtered by State/level/equipment, ordered by State pref or hash; `circuit_comp` ctype ladder by State; Hybrid always anchor circuit | |
| Duration | `build`: add primary units (rounds) until `total_minutes ≥ band lo`; complement units; trim; I3 conditioning floor; then V dial ±1 unit | |
| Whole-session validation | `sweat_validate` SC1 to SC5, I1 to I6, J1 to J6: duty cycle, RPE stacking cap, grip, adjacency, minutes band. **No aggregate distance/calorie/rep budget.** | |
| History | last 2 Sweat sessions + last 2 of the archetype: family/exercise recency; engine mode/format and comp type rotation | |

### Athletic (`engines/athletic/`)

| Layer | Where | What is decided |
|---|---|---|
| Routing | `resolve`: explicit or rotation by least recent; sore legs → Power/Full Body only | |
| Blueprint | px + sx (+ sx2 at 60) exposures, optional QC repeat block, optional Performance Support (`ps_wanted`) | |
| Selection | `ranked` sort `(-state_rank, -comp_rank, recency, -bias, seed)`; `compatible` family/type rules; protected px | |
| Prescription | `dose` per quality (reps, rest, per-side); `base_sets` 4 to 6; sets grow toward `target_min` (40, or 32 under Low Energy/beginner) with impact caps; Low Energy −1 set on sx2; Amped +1 set on one exposure and QC bouts 7 | |
| Validation | `sk5.check` on every candidate combination (impact units, density, duration, warm-up) | |
| State | `STATE_PREF` predicates (ranking), warm-up raise preference, QC preference lists, PS gating | |

---

## 5. Preserve / Modify / Replace

| System | File(s) | Verdict | Rationale |
|---|---|---|---|
| FastAPI endpoints (`generate`, `swap-exercise`, `swap-workout`, `complete`, `history`, `version`) | `router.py` | **KEEP** | Contract is right. Add nothing until the Cart needs `reorder`/`add`/`remove`/`edit` endpoints (see §20). |
| Unified request contract | `router.GenerateBody`, `normalize.py` | **KEEP** | Vocabulary, aliases, presets, soreness expansion, 422 errors are all sound. One addition: `duration` should stop being an enum of two if the Cart lets users trim. |
| Output contract (schema v3.0) | `formatter.py` | **KEEP** (minor extend) | `workout → warmup → blocks → items → prescription` already models supersets, circuits, anchors, exposures and finishers. Add `block.group_label` (muscle/emphasis), `item.prescription.reps_range`, `tempo`, `load_intent`, and a `decisions[]` log (see §26). |
| Workout persistence, IDs, item IDs, versions | `router.py`, `service.py` | **KEEP** | `v3_workouts` state + envelope with deterministic rebuild is exactly what an editable Cart needs. |
| Exercise taxonomy (ET v12) | `data/…Taxonomy…xlsx`, `audit_engine` loaders | **KEEP** | Muscle hierarchy, controlled vocab, tag registries are the right shape. |
| Exercise library (Library v11, Sweat data, Athletic lib) | `data/`, `sweat_data.py`, `athletic_lib.py` | **KEEP + targeted enrichment** | See §6. Rich enough in metadata; thin in specific pools and media. |
| Media lookup | `router.attach_media`, `MediaIndex` | **MODIFY** | Name matching is fragile (35% hit). Move to an explicit `exercise_id → library_id` map table with alias curation; keep the index as fallback. |
| Profile integration | `profile_defaults.py`, `tests/test_training_profile.py` | **KEEP** | Precedence is already explicit. |
| Home inputs | `components/v3/V3Home.tsx`, `ConfigSheet.tsx` | **KEEP** | |
| Soreness system (S1 to S3, RR1 to RR3, S2a override) | `qa_engine.reroute`, `sore_substitute`, `custom_sore_override`, Sweat `sore_eff`, Athletic `resolve` | **KEEP** | Best-designed part of the generator. Keep as the dominant safety layer in the new pipeline. |
| Direction definitions, State definitions, Target vocabulary, archetype names | `normalize.py`, `formatter.ARCHETYPE_NAMES` | **KEEP** | |
| Archetype skeletons (slot lists) | WA v17 `ARCHETYPE + SLOT IDS`, `audit_engine.SLOTS`, `_CON` | **MODIFY** | Slots are good *intent* descriptions (primary press, complementary press, target accessory). They should become the blueprint that a structural variant arranges, not the output order. Loosen the "ATD1 three accessories at 2 sets" rule. |
| Exercise ranking | `qa_engine.rank`, `sweat_gen.ranked`, `athletic_gen.rank_key` | **MODIFY** | Reorder the key: verdict > Target > continuity (protected) > State bias > recency > profile distance > seed. State bias becomes a weighted score with a magnitude, not the second sort key. |
| Strength prescription logic | `prescription.py` | **REPLACE** | Point values → bands. See §21 of the brief and §11 here. |
| State + dial resolver | `sweat_gen.resolve_dials`, `state_rules.py`, `prescription.DIALS`, `adapter.resolve_states` | **REPLACE** | Six integer dials with no ranges cannot express a matrix. Replace with the dial architecture in §11 to §13. Keep the *pair rules* as seed content for the conflict table. |
| Strength structural layer | `structure.py` (`build_blocks`, `validate_blocks`) | **REPLACE** | Recipe switch. Keep the helper functions (`compatible`, `muscles_ok`, `equipment_ok`, `superset`, `circuit`, `pyramid`, `ladder`) as building blocks of the new variant library. |
| Custom Target composer | `audit_engine.compose_custom`, `adapter._build_custom` | **MODIFY** | Role weighting and order are right (V2 port). Replace the isolation-first fill with a compound-anchored fill and a "profile distance ≥ 2 from every chosen exercise" rule for all block sizes, and let it use the structural layer. |
| Sweat workload composition | `sweat_gen.build`, `hybrid_primary`, `add_unit` | **REPLACE** | Add a whole-session budget (§16) and rebuild Hybrid around a fixed dose × rounds envelope with rotating stations that repeat. |
| Sweat prescription (`station_dose`, time model) | `sweat_gen.py` | **MODIFY** | Recalibrate `SPM/SPC/LVM` to realistic repeat-effort paces; keep the dose tables as the base row of a band. |
| Sweat structure selection | `circuit_primary`, `circuit_comp`, `engine_mode` | **MODIFY** | Good variety exists; the State preference lists should become weights. |
| Athletic State modulation | `athletic_gen.assemble`, `STATE_PREF`, `pick_qc` | **MODIFY** (small) | Already dial-shaped. Give Amped a real lever (intent variant, +1 exposure set, harder valid variation) and diversify Bored's QC. |
| Duration fill | `qa_engine.backfill`, Sweat DF loop, Athletic set growth | **REPLACE** for Strength/Sweat | Budget in minutes with a realistic time model as a first-class constraint, not a set-count band. Athletic's approach (grow toward a minute target, validator-checked) is the right pattern. |
| Different Workout internals | `service.swap_workout`, `swap_penalty`, `_custom_chain` | **KEEP** | Chain semantics are good. The new pipeline should feed it a structural-variant chain too. |
| Exercise swap | `adapter.swap_exercise` (all three) | **KEEP** | Re-validated slot-pool swap is exactly what the Cart's Swap needs. |
| History storage / progression | `progression.py`, `router._history`, `history_record` | **KEEP + extend** | Add structure, finisher and State-expression fields to `history_record`. |
| Completion design | `CompleteBody`, `entries_from_performance` | **KEEP** | |
| Conflict system | `Conflict`, `conflict_payload`, `ConflictSheet.tsx` | **KEEP** | |
| Validators | `qa_engine.validate`, `sweat_validate`, `sk5.check` | **MODIFY** | Keep every safety and composition check. Delete the checks that pin signatures (`ALLOWED_BY_STATE`, `normal_60_straight`, `irritated_finisher_forceful`, `amped_finisher_isolation`, `arms_compound_conditional` tie to State). Add budget checks. |
| Analytics, `_trace` | `router.py` | **KEEP** | |
| Frontend components | `components/v3/*` | **KEEP / extend** | `BlockCard`, `ExerciseRow`, `ExerciseThumb`, `PreviewSections` are the seed of the Cart (see §20). |
| QA harness | `qa/run_unified_qa.py`, `tests/` | **MODIFY** | Integration grid is valuable. Frozen parity fixtures (`test_frozen_parity`, `tests/frozen/*`) will be intentionally broken and must be re-baselined; quality metrics need adding (§28). |
| Explainability | `explain.py` | **REPLACE the source, keep the surface** | Lines should be generated from a structured decision log, not by re-inferring from output plus dial values. |

---

## 6. Exercise Library Audit

**Decision: B. The library is usable but needs targeted enrichment. Architecture and ranking, not the library, are the primary cause of repetition.**

Why not A: several slots are genuinely thin and would stay repetitive under any ranking. Why not C: metadata coverage is strong (support level, laterality, complexity, novelty, systemic demand, swap family, forceful/explosive, station, precision) and 196 Strength exercises across 42 families is a workable base. Nothing about the taxonomy needs to change shape.

Exact thin areas (intermediate, commercial gym):

| Area | Count today | Effect | Enrichment |
|---|---|---|---|
| Glutes + Legs `leg_accessory` | 3 candidates | Leg Extension in every session | +4 to 6 quad/hamstring isolations (sissy squat, leg extension variants by foot position, lying/standing leg curl variants, Nordic regressions) |
| Lower Squat `target_accessory` | 3 (beginner: 1) | same | same as above |
| Upper Push `secondary_target_press` and `target_accessory` | 4 and 4 | Cable Fly / Pec Deck / Dip every time | +3 to 4 chest isolation and press variants (decline, cable press angles, machine fly variants) |
| Calves | 6 exercises, **1 family** | cannot vary, cannot superset distinctly | +4 (seated, standing single-leg, leg-press calf, donkey), split into 2 families |
| Forearms | 1 | Target "forearms" is unbuildable as a real block | +4 to 5 or remove from `USER_FACING_TARGETS` |
| Hip abductors / adductors | 4 / 3 | fine as accessories, not as Targets | +2 each or demote from user-facing Targets |
| Hamstring isolation | 7, 5 unilateral | ok | +2 (Nordic regressions, glute-ham raise variants) |
| Novelty ≥ 4 | 16 of 196 | Bored has almost nothing "uncommon but valid" to promote | Re-score novelty on a 1 to 5 curve where ~25% sit at 3+, and add 15 to 20 legitimately uncommon variations (1.5-rep, paused, deficit, tempo variants can be *variants of existing rows*, see below) |
| Explosive / forceful (Strength) | 5 / 13 | Irritated has a 7-item finisher list | Add a `variation` layer rather than new exercises: "explosive intent" is a prescription flag on a compound (see §11), and add 6 to 8 genuine forceful movements (sled drag, heavy KB swing variants, rope slams, tire flip if equipped, landmine punch) |
| `impact_level` in Strength | 196 × low | tag is dead | Re-tag jumps/step-ups/loaded carries honestly or drop the column from Strength |
| Sweat usable pool | 82 of 226 rows | fine for Circuit, thin for Hybrid anchors (5), engines (8), finishers (11) | Promote suitable rows from the 144 excluded; add 4 to 6 finisher-grade movements; treat "run/row/ski/bike" plus "sled/carry" as anchor families |
| Athletic Speed + Agility `px` | 10 | px repeats (Sled Push in 4 of 6 users) | +4 to 6 acceleration/COD drills with the lane preset |
| Media | 35% name match | initials fallback in most rows | (a) curated alias map for the 174 existing videos (recovers an estimated 15 to 25 more Strength matches: pull-up, lat pulldown, RDL, hip thrust variants), (b) shoot list of ~60 high-frequency uncovered movements (push-up family, cable arm work, carries, ergs, machines) |

A note on what *not* to add: five exercises for one muscle in a Custom Target block (`CT_SIZE[60][1]['major']=5`) is too many when the pool is isolation-heavy. Four fly variants in one session is not more chest training, it is the same stimulus three or four times. The fix is a composition rule (at most 2 isolations sharing a movement family, compounds ≥ 40% of a single-muscle block), not more fly exercises.

---

## 7. Strength Findings

### No-State structure
- 60 min: straight sets 100% of the time, by rule and by validator.
- 30 min: straight sets plus at most one accessory superset, chosen for time, not for programming.
- A trainer's read of the base Upper Push (intermediate, 60): Bench 4 × 6 @150 s, Dips 3 × 10, Smith Incline 3 × 10, then Cable Fly 2 × 12, Pressdown 2 × 12, Skull Crusher 2 × 12, all at 60 s. This is a coherent push day, but 2-set accessories at RIR 1 with 60 s rest are a filler pattern (ATD1) rather than a choice, and estimated at 43 min for a 60-min request. Nothing in it says "this is *Tuesday's* push day".

### Prescription
- Reps: one integer per class. Compounds 6 or 8, secondaries 10, accessories 12 or 15. No rep ranges, no top-set/back-off, no tempo, no rep-in-reserve progression across sets, no load intent beyond RIR.
- Rest: constant per class. Never adapts to State, structure or exercise systemic demand (a Trap Bar Deadlift secondary and a Leg Extension both get the class value).
- Sets: constant per class and duration, with the working-set band (12 to 16 at 60) as the only aggregate control. 16 sets in 39 minutes is the ceiling; a real 60-minute intermediate hypertrophy session is 18 to 24 working sets.
- Effort: RIR 2/1, minus one under Amped/Irritated. RIR 0 on accessories for every Amped and Irritated session is aggressive for a default and identical across the two States, which should feel different.

### State behavior
- Documented in §2.1 and §10. The one State that changes the *most* exercises is Low Energy (72%), which is the State where a user most wants "my workout, gentler".
- Amped at 30 minutes, Irritated at 30 minutes and Stressed at 30 minutes are functionally identical to no State except RIR.

### Custom Target
- Every block is `3 × 10, 90 s, RIR 2` straight sets. Single-muscle blocks are filled isolation-first up to 5 exercises. Result: uniform prescription and stimulus duplication. Role weighting and Core-last ordering (the V2 port) are good and should stay.

### Duration
- 60 requested → 38.9 estimated (mean), displayed as "40 to 45 min". Either the label should stop implying 60, or the generator should fill 50 to 55 minutes. A premium product cannot do the first.

### Positive findings worth stating
- Soreness handling (reroute by intent distance, S2 substitution, explicit-Target override) is excellent and better than V2.
- Protected-primary continuity and progression are correct ideas.
- Deterministic reproducibility and the swap chain work.
- Composition constraints (`_CON`) encode real coaching intent (complementary press must be a different pattern, secondary back must be a new family, unilateral secondary, hamstring support on a squat day).

---

## 8. Sweat Findings

### Hybrid aggregate workload
- Is **7 × 700 m Row Erg a reasonable default Hybrid prescription?** No, for this session. 4,900 m of hard rowing is a legitimate *standalone* engine session for an intermediate (a 5 km piece). Placed inside a Hybrid where each round also carries a loaded or explosive station (KB swing 20, Devil Press 10, Box Jump 12, Slams 15 in the sampled Amped build), it does three bad things: it makes the session anchor-dominated (stations appear once or twice each), it produces 45 to 55 minutes of real work against a 31-minute block estimate, and it fatigues the posterior chain and grip before every station. A defensible intermediate Hybrid round is 250 to 500 m of rowing with 2 to 3 stations, for 4 to 6 rounds: total anchor 1,500 to 2,500 m, with stations repeating.
- Why it happens (exact chain): `tsec` = 150 s → `raw = 150 / (0.24 × 1.0) = 625 m` → rounded to 600 m (700 m for advanced via `LVM 0.9`); base rounds = 4; the DF loop adds anchor rounds (`add_unit` on an anchor circuit appends a round) until `total_minutes ≥ 36`; the I3 floor and the Amped `V=+1` add more. Each added round is ~4 min in the model and ~6 to 7 min in a gym.
- Under every State, Hybrid is the same single anchor circuit block. Hybrid has no structural variety.

### Circuit and Engine
- Composition variety is real (circuit / timed circuit / EMOM / intervals / ladder / pyramid, engine modes and formats rotate against history). Circuit is the strongest current archetype.
- Estimates for 60-minute Engine/Circuit sessions land 39 to 55 min, acceptable.
- Circuit round counts of 5 to 7 at 60 are on the high side for 4 to 5 station circuits with loaded movements; duty-cycle repair shortens rest to keep `≥ 0.60`, which makes a long circuit harder rather than shorter.

### State behavior
- Sweat States rebuild the exercise list (10 to 44% retention). This is the compound effect of `le_rank` and `state_tier` sitting above recency and Target in the sort key plus State-specific complement types and mode rules.
- Signatures: Irritated is Air Bike + Sled Pull + Battle Ropes; Amped is Med Ball Slam + DB Push Press; Low Energy is Stationary Bike + Glute Bridge + Suitcase Carry. Finisher pool of 11 with Battle Rope Waves winning most ties.
- The good part: the dial *inputs* (V, E, N, C, G, X, pair overrides) are a sound skeleton for the new resolver; they just need magnitudes, budgets and a Direction-specific binding.

### MOOD's Pick
- A new user gets Circuit for every State and every equipment preset. The rotation-then-affinity ordering is fine after history exists; cold start should let State affinity pick the first archetype (Stressed → Engine, Irritated → Hybrid or Circuit).

---

## 9. Athletic Findings

Athletic largely does not have the State problem, and it should stay mostly intact.

- Rest is not shortened by any State (correct). Low Energy lowers power volume (−1 set on sx2, no repeat block, 32-min target, more Performance Support) without touching rest or intent quality (correct). Stressed restricts repeats to ergs and prefers low-novelty, low-complexity drills (reasonable).
- Amped is inert: 99% identical exposures, one extra QC bout, one extra set. Amped in Athletic should mean *intent* (max-effort cue, harder valid variation of the same quality, an optional extra exposure with full recovery), not more bouts.
- Bored's repeat block is SkiErg 36 of 36 times (`pref = ['ski_erg', ...]` when bored). Signature.
- Irritated and Amped suppress Performance Support (`ps_wanted` returns False), which is the wrong lever: a forceful day can still end with heavy carries or trap-bar pulls; those *are* cathartic.
- Estimated duration at 60 averages 36 min; the "no filler" philosophy is right for power quality, but the product should either label Athletic sessions honestly on the Home card (e.g. "35 to 45 min, quality over volume") or allow Performance Support to fill toward 45 to 50 when the user asked for 60.
- Aggregate workload is sane: `sk5.check` caps impact units and density, and set growth stops at the validator. This is the pattern Strength and Sweat should copy.

Verdict: Option A-level repair for Athletic, inside the shared dial architecture so the same matrix vocabulary applies.

---

## 10. State System Diagnosis

Why signatures appear, mechanically:

1. **One structural State.** `resolve_states` collapses up to three States into one `frozen_state` by precedence for the structure switch, so Amped + Stressed structures exactly like Stressed (same-station superset), while its dials are blended. The user picked two States and the structure heard one.
2. **Switch, not weights.** Each branch of `build_blocks` builds one pattern. Bored picks among four by hash; every other State has one.
3. **Validator pins the signature.** `ALLOWED_BY_STATE` and the finisher checks make any other expression a validation failure. Variation is impossible by construction.
4. **Dials with domain {−1, 0, 1, 2} and one binding each.** `volume` binds to "one set on one slot"; `effort` binds to "RIR −1 everywhere"; `extras` binds to "one finisher at 60"; `structure_novelty` binds to nothing outside the switch. Rest, reps, tempo, load intent, density, exposure count, station count, round count are not dials.
5. **Exercise bias above identity.** `pred_score` is the second sort key for every slot, above Target and above continuity. Low Energy's `supported +2` predicate therefore rewrites the session; Amped's `compound +1` predicate is nearly always satisfied by the base and rewrites nothing. That asymmetry, not the States themselves, is why Low Energy feels like a different workout and Amped feels like "the same workout plus a burnout".
6. **No adaptation memory.** History records exercises and slots. Nothing records "last Amped session used a burnout", "last Irritated finisher was a swing", "last Bored used a ladder". The seed for finisher choice is `user|date|archetype|swap`, so a new date yields a new pick from a tiny pool, and the pool's top-tier items recur.
7. **Duration guards hide States at 30.** Amped, Irritated and Stressed expressions are gated on `dur == 60`; at 30 minutes the States exist only as RIR −1.

What is right and should carry into the new design: the pair-override idea (named conflicts resolved explicitly), Sore as a dominant safety layer, the complexity cap moving with State, Low Energy constraining systemic cost before output, Amped-at-30 not adding volume, Extras off under Low Energy.

---

## 11. Proposed State Dial Architecture

Principle: **Direction fixes the invariants, the blueprint fixes the intent, the base prescription fixes the center of every band, and State moves values inside the bands with a budget.** State never creates structure from nothing and never replaces a slot's intent.

### 11.1 Dials (the vocabulary every layer speaks)

Each dial has a domain, a Direction-specific binding, and a *magnitude cost* used by the budget.

| Dial | Domain | Strength binding | Sweat binding | Athletic binding |
|---|---|---|---|---|
| `volume` | −2..+2 | working sets per slot within `[min,max]` of the slot band; slot count for optional slots | rounds / intervals / minutes of the primary block within its envelope | exposure sets within caps; QC bouts |
| `effort` | −2..+2 | RIR shift within slot RIR band; load intent word (moderate / heavy / heavy-for-you) | RPE range shift, capped at level ceiling | intent cue (submax / crisp / max); never rest |
| `rest` | −1..+1 | rest within slot rest band (e.g. compounds 120..240) | round rest / interval recovery within band | **locked** (hard) |
| `density` | −1..+1 | probability of paired structures; rest coupling | work:rest ratio, duty cycle target | **locked** |
| `reps` | −1..+1 | position in rep band (low = heavier) | station dose within band | reps per set within quality caps |
| `tempo` | 0 / controlled / explosive-intent | tempo tag on eligible movements (eccentric control, paused, fast concentric) | none | intent variant |
| `complexity_cap` | −1..+1 | existing `STATE_CAP` | existing `C` | existing |
| `systemic_cap` | −1..0 | max systemic demand for non-primary slots | max systemic per station | max high-CNS exposures |
| `stability_bias` | −1..+1 | supported/semi-supported preference weight | machine/erg preference | bilateral/stable preference |
| `unilateral_bias` | −1..+1 | unilateral slot preference | unilateral stations | hop/lateral qualities |
| `novelty` | −1..+2 | novelty score weight, recency penalty multiplier, family-rotation pressure | same | same |
| `structure_bias` | vector of weights over structural variants | see §15 | over primary/complement structure options | over QC/PS inclusion |
| `finisher_prob` | 0..1 | probability an optional finisher slot activates, and its *type* distribution | extra block probability | none (QC is the analog) |
| `exercise_bias` | tag weights | `{forceful, explosive, supported, low_sysd, novelty, carry, ...}` weights used in ranking *below* Target and continuity | same | same |
| `impact_cap` | 0 / −1 | n/a in Strength today | high-impact exclusion | high-impact exclusion |
| `quality_stop` | tighter / normal | n/a | n/a | earlier stop cue |

### 11.2 Bounded shifts, not signatures

- Every prescribed value comes from a **band** owned by the slot class, archetype and level (§21 in the brief). Example, intermediate: `primary_compound: sets 3..5, reps 5..8, RIR 1..3, rest 120..240 s`. The base session sits at a center value that already varies by structural variant (Heavy Primary centers reps low and rest high; Volume centers sets high).
- A State contributes a vector of **shifts** in band units (e.g. Amped Strength: `effort +1, volume +1 (one slot), finisher_prob 0.4, density +0.5`). A shift never leaves the band; the band is the safety.
- Shifts have **magnitudes**, and each State has a **budget** (sum of |magnitude| it may spend, Direction-specific). Amped's budget prevents "add sets and drop RIR and shorten rest and add a finisher and add a superset". When a State's candidate shifts exceed its budget, shifts are dropped in the State's own priority order (Amped: effort > volume > finisher > density).
- **Conditional shifts**: a shift is applied only if the base does not already satisfy it (Low Energy's stability bias does nothing on a machine-heavy base; its systemic cap does nothing on an isolation-heavy accessory list). This is what makes the same State look different on different sessions.
- **Exclusive bundles**: some shifts are mutually exclusive alternatives (Amped: "one extra working set on the primary" *or* "top set / back-off on the primary" *or* "high-intent finisher"). The structural variant and history pick which bundle expresses the State today.

### 11.3 What the Direction invariants forbid State from touching

- Strength: State never changes the primary lift's movement pattern or family; State moves the primary's reps/RIR/rest inside its band only. Continuity beats State for protected slots. Compounds are never at RIR 0 by default.
- Sweat: State never breaks SC1 to SC5 / I-rules / J-rules or the session budget (§16). Beginner RPE ceiling stays 8.
- Athletic: State never shortens recovery between exposures, never adds high-impact contacts beyond `sk5` caps, never lowers the quality-stop cue below the frozen rule. Amped expresses as intent and variation, not fatigue.

---

## 12. State Dial Matrix

Legend: `same` unchanged · `↓ / ↑` slight · `↓↓ / ↑↑` moderate · `cond` conditional on base · `bias` preference in ranking · `HARD` constraint · `lock` Direction invariant.

### 12.1 Strength

| Dial | Low Energy | Bored | Irritated | Sore | Amped | Stressed |
|---|---|---|---|---|---|---|
| Sets / volume | ↓ (1 to 2 sets off accessories first; primary kept) | same | same | ↓ local (sore region only) | ↑ (one bundle: +1 set primary *or* top/back-off *or* finisher) | same |
| Reps (band position) | same or ↑ (cond: only if primary is heavy-low reps, move toward mid band) | ↑ / ↓ variety (pyramid / ladder schemes) | ↓ on compounds (heavier, lower reps within band) | same | ↓ on primary (cond: not if variant is Volume) | same (mid band) |
| RIR | ↑ (2..3 compounds, 1..2 accessories) | same | ↓ on compounds only (floor 1); accessories same | same | ↓ on selected work (floor 1 compounds, 0 on ≤2 accessory sets) | same (never below 2 on compounds) |
| RPE / load intent | moderate | same | "heavy, forceful" cue on compounds | same | "heavy for you today" | "controlled, smooth" |
| Rest | same (adequate rest kept; never shortened) | same | ↑ on compounds (cond: heavier work) | same | ↓ on accessories only (cond: density bundle) | ↑ slight; never coupled to density |
| Density | ↓ (fewer pairings) | ↑ cond (supersets/circuits are a novelty channel) | same | same | ↑ (accessory pairings) | ↓ (predictable straight or same-station pairs) |
| Tempo | controlled | eccentric / paused variants (bias) | explosive-intent concentric on eligible compounds | controlled on adjacent regions | fast concentric intent | controlled |
| Explosiveness | ↓ | bias toward novel | ↑ bias | same | ↑ bias | ↓ |
| Complexity cap | −1 | +1 | −1 | same | same | −1 |
| Systemic demand | HARD cap on non-primary slots (≤ 3 of 5) | same | same | same | same | bias ↓ |
| Impact | same | same | same | HARD (sore region) | same | same |
| Stability | bias ↑ supported (cond) | bias toward unfamiliar setups | same | bias ↑ (cond: near sore region) | same | bias ↑ |
| Unilateral bias | ↓ slight (less balance demand) | ↑ slight | same | cond (unilateral to work around) | same | same |
| Novelty | ↓ | ↑↑ (recency multiplier ×2, novelty weight, family rotation) | same | same | same | ↓ |
| Structure | bias: Traditional, Heavy Primary (fewer slots) | bias: Paired, Pyramid, Ladder, Compound+Paired | bias: Heavy Primary, Compound + Paired; optional forceful finisher **from a broad pool, prob 0.5, history-rotated** | same (structure chosen after reroute) | bias: Heavy Primary, Volume, Superset-Biased; finisher prob 0.4 | bias: Traditional, same-station pairs |
| Exercise selection | bias: supported, low systemic, familiar; **never above continuity** | bias: novelty, uncommon valid variants, equipment variety | bias: forceful, heavy compounds, carries/sleds/slams as candidates (not mandatory) | HARD: exclude sore primary; reroute; substitute | bias: compound, heavier variation | bias: familiar, rhythmic, low novelty |
| Finisher probability | 0 | 0.3 (novel format) | 0.5 (forceful type) | 0 | 0.4 (burnout *or* high-intent) | 0.1 (rhythmic, e.g. carry or sled walk) |
| Budget (magnitude units) | 4 | 4 | 3 | safety, unbudgeted | 3 | 3 |

### 12.2 Sweat (deltas from the Strength matrix; blank = same intent)

| Dial | Low Energy | Bored | Irritated | Sore | Amped | Stressed |
|---|---|---|---|---|---|---|
| Volume | ↓ (rounds/intervals −1, floor I3) | same | same | ↓ local | ↑ (+1 unit **only if budget allows**, see §16) | same |
| Effort (RPE) | ↓ (ceiling −1) | same | ↑ (+1 on short efforts) | same | ↑ (+1, level cap) | ↓ (ceiling 7) |
| Rest / recovery | ↑ slight | same | ↓ slight on short intervals | same | ↓ (round rest −15 s, floor 30) | ↑ (generous, no time pressure) |
| Density / work:rest | ↓ | same | ↑ short-hard | same | ↑ | ↓↓ |
| Dose (station/anchor) | ↓ | same | ↓ anchor length, ↑ intensity | same | ↑ within envelope | same, steady |
| Complexity cap | −1 | +1 | −1 | same | same | −1 |
| Systemic | HARD (tier 2 excluded) | same | same | same | same | bias ↓ |
| Impact | HARD (no high) | same | same | HARD lower sore | same | same |
| Structure | bias: continuous, steady circuit, timed circuit | bias: EMOM, ladder, pyramid, novel complement, **new Hybrid shapes** | bias: circuit, short intervals, anchor circuit; finisher prob 0.5 from a pool of ≥ 12 | same | bias: intervals, denser circuit; finisher prob 0.4 | bias: continuous, fixed circuit, predictable rounds |
| Exercise selection | bias: supported ergs, low systemic, carries | bias: novelty, equipment variety | bias: forceful (ropes, slams, sleds, carries, ergs at high RPE) as *weights* | HARD | bias: explosive, compound | bias: rhythmic, fixed stations |
| Round count / distance / calories | ↓ | same | shorter anchors, more rounds within budget | same | ↑ within budget | same |
| Budget | 4 | 4 | 3 | safety | 3 | 3 |

### 12.3 Athletic

| Dial | Low Energy | Bored | Irritated | Sore | Amped | Stressed |
|---|---|---|---|---|---|---|
| Exposure sets | ↓ (−1 on sx2, as today) | same | same | ↓ local / reroute | ↑ (+1 on one exposure, cap) | same |
| Reps per set | same | same | same | same | same | same |
| Rest | **lock** | **lock** | **lock** | **lock** | **lock** | **lock** |
| Intent / RPE | submax-crisp | same | max-intent cue on forceful qualities | same | max-intent cue, "harder valid variation" | crisp, controlled |
| Explosiveness | ↓ (fewer high-CNS) | novelty over vectors (lateral, rotational) | ↑ throws / slams / sled | same | ↑ loaded jumps / Olympic variants where skill allows | ↓ |
| Complexity | −1 | +1 | −1 | same | same | −1 |
| Impact | ↓ (contacts −20%) | same | same | HARD | same | same |
| QC repeats | off | on, **rotated pool** (not SkiErg by default) | on, forceful | same | on, +1 bout (as today) | ergs only (as today) |
| Performance Support | ↑ likely | same | allowed (heavy carries, trap-bar pulls are cathartic) | ↑ | allowed, heavier intent | ↑ likely |
| Quality stop | earlier | same | same | same | same | same |
| Novelty | ↓ | ↑↑ | same | same | same | ↓ |
| Budget | 3 | 3 | 2 | safety | 2 | 2 |

---

## 13. Multi-State Resolution

Deterministic, explainable, three passes.

1. **Safety pass (dominant).** Sore excludes and reroutes first. Then hard caps from any State are applied as the *minimum* over States (complexity cap, systemic cap, impact cap, RPE ceiling). Low Energy's systemic cap always wins over Amped/Irritated exercise bias (existing SD step 4 rule, kept).
2. **Conflict pass.** For each dial, if the selected States' shifts have opposite signs, resolve by a fixed dial-level rule table (seeded from today's `PAIRS`):
   - `effort`: Low Energy vs Amped/Irritated → +1 on the primary slot only, 0 elsewhere (existing `ESCOPE p1`).
   - `volume`: Low Energy vs Amped → 0 (existing). Sore vs Amped → 0 local.
   - `rest`/`density`: Stressed vs Amped/Irritated → Stressed wins (predictable structure), Amped's effort survives.
   - `novelty`: Bored vs Stressed → Bored owns exercise novelty, Stressed owns structural predictability (existing named row).
   - `structure_bias`: weights are **summed**, not overridden; the variant sampler then draws from the summed distribution. Amped + Stressed yields "Heavy Primary, Traditional" rather than either State's favorite alone.
3. **Budget pass.** Combined budget = max(single budgets) + 1, never the sum. Remaining shifts are dropped in a global priority order: safety > effort > volume > structure > finisher > density > novelty. Every dropped shift is logged (`state_shift_dropped`).

Output: one resolved dial vector, one resolved structure weight vector, one exercise-bias weight vector, plus a log of (State, dial, proposed, applied, reason) rows. The current `resolve_dials` pair table becomes rows in the conflict table; nothing about it is wasted.

---

## 14. Proposed Session-Generation Pipeline

```
inputs (profile ⊕ explicit controls ⊕ States ⊕ soreness ⊕ history)
  → Direction resolve, archetype/Target route            [KEEP: normalize, adapter routing, moods_pick]
  → soreness resolve (S1..S3, RR1..RR3, S2a)              [KEEP]
  → blueprint: slot list with intents + slot bands        [MODIFY: SLOTS + new PRESCRIPTION BANDS]
  → structural variant selection                          [NEW, §15]  weights = variant base × State structure_bias × history
  → base prescription per slot from bands, centered by    [NEW]       archetype, level, goal, variant
  → exercise composition per slot                          [MODIFY]    rank: verdict > Target > continuity > State bias (weighted) > recency×novelty > profile distance > seed
  → State dial modulation (bounded shifts, budget)        [NEW, §11..13]
  → whole-session workload budget & time model            [NEW, §16]  fit to requested minutes; trim/backfill by priority
  → history / adaptation ranking (structure, finisher)    [NEW, §17]
  → validation (safety + composition + budget)            [MODIFY]    remove signature checks
  → decision log → explain → envelope                     [MODIFY]
```

This is the founder's mental model with two changes: (a) the structural variant is chosen *before* prescription because it sets the band centers (Heavy Primary means low reps and long rest on the primary), and (b) the workload budget runs *after* State modulation so State cannot push a session past its budget, and the budget's trims are logged as such.

Determinism is preserved: every weighted choice is drawn with the existing `user|date|archetype|swap` seed, so Different Workout and swap chains behave exactly as now.

---

## 15. Structural Variation Model

Structure becomes a first-class layer with a small library of **variants** per Direction. A variant is a template over slot intents, not over exercises, so it composes with every archetype.

Strength variants (names provisional; the founder's list is close):

| Variant | Shape | Band centers | Best for |
|---|---|---|---|
| Traditional | main + secondaries + accessories, straight | mid | any; the "no surprises" day |
| Heavy Primary | primary 5 × 3..5 at long rest, fewer accessories | primary low reps, high rest | Amped, Irritated, build_strength goal |
| Top Set + Back-off | primary 1 heavy top set + 2..3 back-off sets at −10..15% | primary | Amped, intermediate+ |
| Compound + Paired Accessories | compounds straight, accessories in antagonist or same-region pairs | accessories rest ↓ | Bored, Amped, 30-min |
| Superset-Biased | secondary pair + accessory pair | rest ↓ | 30-min, Amped |
| Volume | primary 4 × 8..10, extra accessory set, moderate rest | sets ↑ | build_muscle, no State |
| Pyramid / Ladder | ascending load on a secondary or descending reps on an isolation | | Bored |
| Efficient | primary + one pair + one isolation | fewer slots | 30-min, Low Energy |
| Controlled Finish | Traditional + optional finisher (burnout / forceful / carry / rhythmic) | | Amped, Irritated, Stressed variants |

Rules: at most one "novel" device per session (pyramid *or* ladder *or* circuit) unless Bored; protected primary is never paired; beginners get no tri-set circuits (existing rule); Core archetype keeps its own formats. Variant weights: base prior per archetype × goal × duration, multiplied by State `structure_bias`, multiplied by a history penalty (×0.4 if the same variant was used in the last session of this archetype, ×0.7 if in the last two). No State → all variants available with priors that put Traditional around 35%, not 100%.

Sweat: the existing structure options (circuit, timed circuit, EMOM, intervals, ladder, pyramid, continuous, anchor circuit) already form the library; add Hybrid shapes (**Anchor + Couplet**, **Anchor + Triplet, stations repeat**, **Ladder Hybrid** with anchor distance descending, **Split Anchor** two engines alternating). The State preference lists become weights.

Athletic: structure is exposures + optional QC + optional PS; leave it, add a "contrast pair" variant (heavy support lift alternated with a jump) for intermediate+ Power under Amped/Bored.

---

## 16. Whole-Session Workload Model

Purpose: enough aggregate awareness to stop obviously excessive combinations, not a physiology simulator.

Tracked per session (Sweat primarily; Strength uses a subset):

| Dimension | How | Budget (intermediate, 60 min; scale by level and duration) |
|---|---|---|
| Elapsed minutes | realistic time model: warm-up + Σ blocks + transitions (20 s station, 45 s machine change, 60 s loading) + downshift | target = requested − 5; hard max = requested + 3 |
| Active minutes | Σ work time | ≥ 26 (existing I3) |
| Engine distance / calories by modality | Σ anchor and engine doses × rounds, in *minutes-equivalent* using a realistic pace table (row 2:15/500 m, ski 2:20, run 5:30/km, bike 12 cal/min for intermediates; ×1.15 beginner, ×0.93 advanced) | Hybrid anchor ≤ 40% of active minutes; standalone Engine ≤ 90% |
| Total reps of loaded work | Σ station reps × rounds | ≤ 220 per session; ≤ 60 per movement |
| High-impact contacts | Σ jumps × rounds | ≤ 60 (Athletic `sk5` logic reused) |
| High-systemic movements | count of sysd ≥ 4 items × rounds | ≤ 8 exposures |
| Peak-intensity minutes | minutes at RPE ≥ 8 | ≤ 12 (existing I6 stacking cap extended) |
| Equipment transitions | count | ≤ 10; Hybrid stations chosen from ≤ 3 stations |
| Work:rest | duty cycle | 0.55..0.75 by State |

Mechanics: after State modulation, compute the vector; if any dimension exceeds its budget, trim in priority order (finisher → complement units → primary rounds → anchor dose) and log `workload_cap {dimension, before, after}`. If below the minute target, backfill in the *opposite* order and never with anchor rounds beyond the anchor share cap; add a station repeat or a complement instead. Strength uses elapsed minutes (realistic per-set time by rest and reps) and working-set range; the working-set band is replaced by "fill to requested minutes − 5 within the slot set bands".

Applied to the founder's case: 7 × 700 m at 2:15/500 m is 22 min of rowing, 71% of active time → capped to anchor ≤ 40%: 5 rounds × 500 m (11 min) with two stations repeating each round (KB swing, Devil Press, Box Jump rotating in pairs), round rest 45 s, and the remaining minutes go to a couplet complement. Same exercises, defensible session.

---

## 17. History + Variation Model

Keep: archetype rotation, family/exercise recency (2 sessions), protected-primary continuity and progression, Different Workout chain semantics, exercise swap chain, determinism.

Add to `history_record`:

```
structure_variant, finisher {exercise_id, type}, state_expression {state: [shift ids applied]},
engine_mode/format (exists), hybrid_shape, qc_exercise, ps_purpose
```

Use it:
- Variant weights ×0.4 / ×0.7 for last / last-two same-archetype sessions (all States).
- Finisher exercise and *type* get the same recency treatment as slot exercises (a forceful finisher can be a swing, a sled, a carry, a slam, a heavy trap-bar pull; the type should rotate too).
- State expression rotation: if Amped last expressed as a burnout, the next Amped session prefers a different bundle (top set/back-off or extra primary set) at ×0.5 weight for burnout.
- Bored gets a global novelty pressure across Directions (last 4 sessions), not only per archetype.
- Athletic QC pool rotates by recency instead of a fixed preference list.

Different Workout: rotates the variant first (cheapest visible change), then exercises, then archetype (existing Phase 2.5 rule). Swap keeps the variant.

---

## 18. V2 Generator Lessons Worth Preserving

From `utils/workoutGenerator.ts` (the Muscle Gainer path is the relevant one):

1. **Weighted sampling, not lexicographic sorting.** V2 scores candidates (`SCORE` weights: style match 2.0, equipment 2.2, fresh pattern +1.2, stale −1.5, recently seen −3.0) and samples with softmax. V3 sorts by a strict tuple where the second key is the State predicate. Weighted scoring is what lets several concerns share influence; it is the single most valuable V2 idea for the new ranker, and it stays deterministic when seeded.
2. **Structural jitter.** `JITTER_BUMP_CHANCE = 0.4` (+1 exercise on a primary muscle) is why V2 sessions did not feel identical. The variant layer is the disciplined version of this.
3. **Cart flavors.** Eight "carts" (strength / hypertrophy / pump × heavy day / builder day / athletic day, express, eccentric focus) with display copy. These are structural variants with names the user could see. The V3 variant should be *visible* in the Cart header ("Heavy Primary Upper Push").
4. **Fresh pattern / fresh equipment bonuses** within a session, which V3 only partially has (profile distance on depth slots). Generalize to all non-primary slots.
5. **`plan.blocks` with `type: straight | superset | circuit | interval`.** V2's authored data already modeled structure; the V3 output contract does too. Nothing new needed.
6. **Variations-per-flavor with signature dedupe** (never hand back the same composition) is already ported to Different Workout. Keep.

Not worth restoring: pre-authored mini-routines as the unit of composition (V3's slot model is strictly better), string-parsed grouping (`workoutType` → dividers), duration as a parsed string, JSON-in-route-params session handoff, equipment "themes" as hard carts.

---

## 19. V2 Editable Workout Cart Assessment

What V2 actually had (verified in code, `app/cart.tsx` 2,213 lines, `contexts/CartContext.tsx` 236 lines):

- Hero image header (full-bleed) with mood label, generated title, `~N min` badge, tappable flavor badge with a dropdown of generated variations and Shuffle.
- Body grouped by inferred muscle (`MuscleGroupDivider`, `LegSubDivider`), each row with thumbnail, name, equipment, duration, role label, **up/down chevrons** (not drag; `react-native-draggable-flatlist` is installed but only used in admin), remove.
- Preview-vs-commit state (`previewWorkouts` → `commitPreview` on Save/Start/edit).
- Add: `AddCustomExerciseModal` (free-text name/equipment/sets/reps/rest → a text battle plan). No library search in the cart.
- Swap: none at item level (whole-cart Skip only). Sets/reps edit: none on existing items.
- Start: paywall gate → `router.push('/workout-guidance')` with the session JSON-stringified in params.
- Persistence: AsyncStorage `@mood_cart_v1`, image prefetch.

Reuse verdicts:

| Component | Verdict | Why |
|---|---|---|
| Preview-vs-commit pattern | **Reuse (as a hook)** | Right separation; drop the 2,200-line screen |
| `CartContext` provider + persistence | **Adapt** | Needs block-scoped items and the V3 envelope; provider/persist shape is fine |
| Hero header, `~min` badge, variation dropdown | **Adapt** | Duration from `duration.display`; variation dropdown becomes "Different workout / variant" |
| Up/down reorder | **Adapt** | Constrain to within-block and block-level; or finally use the installed draggable list |
| `MuscleGroupDivider` / `LegSubDivider` | **Rebuild** | V3 blocks carry structure; grouping must come from data, not string parsing |
| `CartItemComponent` | **Rebuild** | Row model needs prescription, A1/A2 and ANCHOR tags, swap, inline edit |
| `AddCustomExerciseModal` | **Rebuild** | Must pick a library exercise for a slot and receive a prescription from the engine |
| `ExerciseLookupSheet` (1,083 lines) | **Adapt** | Already a searchable library sheet; wire to V3 exercise ids |
| `FloatingCart`, `BackButton`, `HomeButton`, `SafeLinearGradient` | **Reuse directly** | Generic |
| `WorkoutCard`, per-muscle display screens, `GeneratedWorkoutView` (dead) | **Do not port** | Tied to the retired browse model |
| JSON-in-params session handoff | **Retire** | `app/v3/session.tsx` already reads by `workout_id` |

Current V3 post-generation surface (`app/v3/workout.tsx` 354 lines, `components/v3/PreviewSections.tsx`, `details.tsx` → `WorkoutOverview` → `BlockCard` → `ExerciseRow` → `ExerciseThumb`): renders blocks by structure with A1/A2 and ANCHOR tags, Built for Today, Different workout, Start. Swap exists only on Details. No reorder, add, remove, edit, hero, or media in Preview. `ExerciseThumb` already implements thumbnail → gradient monogram fallback.

Should the Cart replace the Preview as the primary post-generation experience? **Yes**, with one caveat: the Cart must open in a *read-first* state (clean session, one tap to Start) and reveal editing on intent (long-press, "Edit" toggle), so the default experience stays premium and calm rather than a form. Ownership reduces pressure on the generator, but the generator must still be excellent: a Cart that users always edit is a generator users do not trust.

---

## 20. Proposed V3 Workout Cart

Hierarchy (top to bottom):

1. **Header**: hero (direction/archetype hero image from a curated set; V2 `imageUrl` assets are usable here), archetype + variant name ("Upper Push · Heavy Primary"), duration display, State chips, level, equipment label. Actions: Different workout, Edit toggle, Details.
2. **Built for Today**: 2 to 4 lines, sourced from the decision log (§26), collapsible.
3. **Session body**, grouped by **block group** (a new `group_label` on blocks: "Main lift", "Chest", "Triceps", "Superset", "Anchor circuit", "Primary exposure", "Finisher"). Each block renders by structure exactly as `PreviewSections` does today, with a block-level meta line (rounds, rest, instruction).
4. **Exercise card**: thumbnail (video thumb → initials fallback, as `ExerciseThumb`), name, equipment, prescription display (`4 × 6..8 · RIR 2 · 150 s`), muscle tag, A1/A2 or ANCHOR tag, expand for cues and load guidance. Edit affordances appear in Edit mode: reorder handle, swap, remove, sets/reps stepper.
5. **Footer**: totals (exercises, working sets, estimated minutes recomputed client-side from the same time model), Save build, Send to friend, **Start Workout**.

UX rules for edits against structure (these are recommendations, some constrain the user on purpose):

- **Reorder** is allowed within a block and between blocks *at block granularity*. Dragging A1 out of a superset is not allowed as a drop; the user can "Unpair" the superset (one action, both items become straight, rest recomputed) and then reorder. Dragging an exercise into a superset offers "Pair with …" only if `compatible()` passes; otherwise it drops adjacent as straight.
- **Remove** any item; removing one half of a pair unpairs the other; removing the anchor of a Hybrid converts the block to a plain circuit and warns. Totals update; if working sets fall below the band floor, show a gentle "This session is now lighter than planned" line, not a block.
- **Swap**: existing slot-pool swap (`swap-exercise`), which keeps intent and revalidates. Offer "why this alternative" from the log.
- **Add**: opens the library filtered to the block's intent (muscle group, class), engine prescribes for the slot class (new `POST /workouts/{id}/add-item` returning the item with a prescription). Cap at 2 added items per session; beyond that suggest Different workout.
- **Sets/reps edit**: stepper within the slot band (sets ±1 inside `[min,max]`, reps by band position). Outside the band requires a second tap ("Coach note: that's beyond the range for this exercise today"). RIR/rest editing not exposed in v1.
- **Structure edit**: only Pair / Unpair in v1. No user-authored circuits.
- Every edit is a server round-trip that revalidates and returns a new envelope version, so history, progression and the session screen keep working. Local optimistic update, then reconcile.
- **Disagreement flagged**: fully free reordering (main lift after isolations) is something a trainer would talk a client out of. Allow it, but show a one-line coach note when a primary compound is moved below accessories. Do not block.

New endpoints implied: `reorder`, `remove-item`, `add-item`, `edit-prescription`, `pair`/`unpair`. All operate on `state` + `envelope` exactly like `swap-exercise` today.

---

## 21. Architecture Option A: Repair the current V3 core

Keep everything; replace `structure.py`'s switch with a variant sampler, replace `prescription.DIALS` with the dial vector and budget, add the Sweat workload budget, recalibrate the time model, fix the ranking key order, add adaptation history.

| Criterion | Assessment |
|---|---|
| Workout quality | Improves structure and State variety. Prescription stays point-valued unless `prescription.py` is also replaced, and without bands the dials have nothing to move inside; in practice A grows into B for Strength. |
| Variation | Good for structure; limited for prescription |
| State intelligence | Moderate; dials still bind to "one set / RIR −1" unless bands exist |
| Predictability / control | High (small, local diffs) |
| Safety | Unchanged (validators intact) |
| Testability | Frozen fixtures break anyway (structure output changes) |
| Implementation time | 3 to 4 weeks |
| Regression risk | Medium: the frozen engine's implicit couplings (`ATD1`, `two_set_slots`, `finisher_planned`, `dur==60` guards) make local edits leak |
| Frontend impact | None beyond Cart |
| Cart compatibility | Fine |
| Extensibility | Poor: the switch is gone but the class-constant prescription remains the ceiling |

Risk statement: A is the fastest to a *less repetitive* generator and the slowest to a *good* one, because each later improvement (tempo, top-set/back-off, load intent, realistic rest) has to be threaded through frozen code that was written to be constant.

## 22. Architecture Option B: Hybrid rebuild

Keep taxonomy, libraries, APIs, persistence, normalize, soreness system, validators (minus signature checks), swap/Different Workout semantics, explain surface, frontend. Replace, for Strength and Sweat: session composition (blueprint → variant → composition), prescription engine (bands), State modulation (dials, budgets, multi-State resolver), workload budget and time model, adaptation history. Athletic gets the dial vocabulary and three targeted changes but keeps `athletic_gen` and `sk5`.

| Criterion | Assessment |
|---|---|
| Workout quality | High: bands, variants and budgets are the three things the current output lacks |
| Variation | High, and controlled (weights, history, budgets) |
| State intelligence | High; Direction-specific matrices become data |
| Predictability / control | High: deterministic, logged, variant names visible |
| Safety | Unchanged or better (aggregate budgets added) |
| Testability | High: new quality metrics (§28) sit naturally on the decision log; integration harness reused |
| Implementation time | 6 to 8 weeks for Strength + Sweat + Athletic touch-ups, in parallel with Cart frontend |
| Regression risk | Medium-low: the rewritten layers are the ones already producing wrong output; the layers with the most subtle correctness (soreness, swap chains, persistence, validators) are kept |
| Frontend impact | Contract additions only (group labels, ranges, decision log) |
| Cart compatibility | Designed for it (bands give the Cart its edit limits; decision log gives it explanations) |
| Extensibility | High |

## 23. Architecture Option C: New generator core

Preserve external contracts and infrastructure; rebuild all three Directions' internal generation from a single generic engine (slots, bands, variants, dials, budget) with Direction plug-ins.

| Criterion | Assessment |
|---|---|
| Workout quality | Potentially highest, but Athletic's current quality would have to be re-earned |
| Variation / State intelligence | Same as B in principle |
| Predictability | Lower during the rebuild: soreness reroute, Sweat SC/I/J rules and `sk5` impact logic would be re-implemented |
| Safety | Real regression risk on the best-tested parts |
| Testability | Re-baseline everything |
| Implementation time | 10 to 14 weeks |
| Regression risk | High |
| Frontend impact | Same as B |
| Cart compatibility | Same as B |
| Extensibility | Highest on paper; in practice one generic engine tends to grow Direction `if`s anyway |

## 24. Recommendation

**Option B.** The evidence isolates the fault to four layers (composition/structure, prescription, State modulation, workload budgeting) and shows that the surrounding layers are correct and valuable. A stops short of the layer (prescription) that caps quality; C throws away the layers that are already right and re-risks safety for no product gain.

Two qualifications. First, "frozen" status is lifted for exactly these layers and their validators; everything else stays frozen in the useful sense (unchanged behavior, parity-tested). Second, the Cart is not a substitute for B. It is a multiplier on a good generator and a shield for a mediocre one; the founder's tests show users would be editing every session today.

## 25. Implementation Scope

Backend (`backend/mood_v3`):

| Layer | Action | Files |
|---|---|---|
| Bands | new data + loader | `data/…PRESCRIPTION BANDS` (extend the existing sheet or a `bands.py`), `engines/strength/bands.py` |
| Variants | new | `engines/strength/variants.py` (uses `structure.py` helpers), `engines/sweat/shapes.py` |
| Dials | new shared module | `engines/dials.py` (matrix as data, budgets, conflict table, resolver); replaces `engines/state_rules.py`, `prescription.DIALS`, `sweat_gen.SM/PAIRS/resolve_dials`, `adapter.resolve_states` |
| Composition | modify | `engines/strength/qa_engine.py` (`rank` key order and weights, `backfill` → minute budget), `audit_engine.compose_custom` (block fill rules), `sweat_gen.ranked`, `athletic_gen.rank_key` (minor) |
| Prescription | replace | `engines/strength/prescription.py`; `sweat_gen.station_dose/hybrid_primary` doses become band rows |
| Structure | replace | `engines/strength/structure.py::build_blocks` (keep helpers), `validate_blocks` (drop signature checks); `sweat_gen.circuit_primary/circuit_comp/hybrid_primary` structure choice → weights |
| Budget / time | new + modify | `engines/budget.py`; `sweat_gen.SPM/SPC/LVM`, `est`, `block_minutes`, DF loop; `structure.est_minutes_blocks` |
| History | extend | `adapter._result` history_record (all three), `qa_engine.recency_penalty`, `sweat_gen.recency`, `athletic_gen.pick_qc` |
| Athletic | small | `athletic_gen.assemble` (Amped bundle, PS gating), `pick_qc` rotation, `STATE_PREF` weights |
| Explain | rewrite source | `explain.py` reads `res['decisions']` |
| Contract | extend | `formatter.py` (`group_label`, `reps_range`, `tempo`, `load_intent`, `decisions`), `render.py` |
| Router | extend later | `router.py` Cart endpoints |
| QA | modify | `qa/run_unified_qa.py` + new `qa/quality_metrics.py`; re-baseline `tests/frozen/*` |

Frontend (`frontend`): `app/v3/workout.tsx` → Cart screen; `components/v3/{BlockCard, ExerciseRow, ExerciseThumb, PreviewSections}` extended with edit affordances; new `CartContext`-style hook (adapted from V2); `utils/v3Api.ts` new calls; `utils/v3PreviewFormat.ts` group labels and ranges.

## 26. What Does NOT Need Rebuilding

Explicitly: `router.py` endpoints and persistence model; `normalize.py`; `profile_defaults.py`; `service.py` orchestration, swap chain and Different Workout semantics; `formatter.py` schema (extend only); soreness resolution in all three Directions; `audit_engine` loaders, `_CON` slot constraints, hard filters; `qa_engine.validate` safety and composition checks; `sweat_validate` SC/I/J rules; `sk5.check`; `athletic_gen` core; `progression.py`; `cues.py`; the taxonomy and library workbooks (content additions only); media pipeline (add a map table); `components/v3/*`; `V3Home`, `ConfigSheet`, `ConflictSheet`; the unified QA harness structure.

Decision log design (for §26 of the brief): each pipeline stage appends typed events with the same shape `{code, layer, slot|block, before, after, reason, state?}`; codes include `variant_selected`, `band_center`, `state_shift_applied`, `state_shift_dropped`, `state_conflict_resolved`, `exercise_bias_applied`, `history_rotation`, `target_allocation`, `soreness_reroute`, `workload_cap`, `duration_backfill`, `difficulty_gate`. `explain.py` composes lines only from these events, so it can never claim a set came off when none did.

## 27. Migration / Compatibility

- **API**: unchanged request; response gains optional fields. `schema_version` → `v3.1`; the app tolerates missing new fields.
- **Persisted workouts**: `_rebuild` already detects fingerprint drift and raises `Outdated` (409 `workout_outdated`) for swaps on old workouts; generated-but-uncompleted workouts from the old engine remain viewable and startable, not swappable. Add `engine_version` gating (already stored in `state`).
- **History**: old `history_record`s lack the new fields; treat missing as "unknown" (no penalty). Exercise/family recency keeps working unchanged.
- **Progression**: keyed by exercise id; unaffected.
- **Frozen fixtures**: `tests/frozen/*` and `test_frozen_parity.py` will fail by design. Re-baseline after the quality gates pass; keep the pre-rebuild fixtures in `frozen/pre_core_rebuild/` as a diff reference (as `pre_phase2_5` is today).
- **Frontend**: Preview keeps rendering the new envelope with zero changes (structures unchanged, new fields ignored). Cart ships separately.
- **Feature flag**: `MOOD_V3_CORE=legacy|rebuilt` in `service.ADAPTERS` selection so both engines can be A/B'd on device during founder testing.

## 28. QA Strategy (quality, not only validity)

Keep the existing grid (A to G) for integration validity. Add a **quality pack** that runs the same grid and asserts on distributions, not on individual outputs:

| Metric | Gate |
|---|---|
| Structural variety, no State, per archetype at 60 | no single variant > 45% over 50 seeds; ≥ 4 variants observed |
| State signature index: P(most common finisher exercise \| State, archetype) | ≤ 0.30; P(any finisher \| Amped) between 0.25 and 0.55 |
| Exercise retention under State vs the same base | Low Energy ≥ 65%, Stressed ≥ 65%, Amped ≥ 70%, Bored 35..60%, Irritated ≥ 60% |
| Prescription entropy | ≥ 6 distinct rep targets and ≥ 5 rest values with ≥ 5% share each at 60 |
| Estimated vs requested minutes | 60-min: 90% within 50..62; 30-min: 90% within 25..33 |
| Hybrid anchor share | anchor ≤ 40% active minutes; total row/ski ≤ 2,800 m intermediate, ≤ 3,500 m advanced; ≥ 2 station repeats per station |
| Sweat aggregate | reps ≤ 220, high-impact contacts ≤ 60, RPE ≥ 8 minutes ≤ 12 |
| Sequential history | over 6 consecutive same-State sessions: ≤ 2 repeats of any finisher, ≤ 2 of any variant |
| Custom Target | ≤ 2 isolations per movement family per block; compounds ≥ 40% of single-muscle blocks |
| Explain truthfulness | every Built for Today line traces to ≥ 1 decision event (unit test over the log) |
| Trainer review sample | 40 sessions per Direction per release, scored 1 to 5 on defensible / appropriate / engaging by a coach; release gate mean ≥ 4.0, no 1s |
| Determinism | unchanged (G) |

Run the quality pack as a report (`qa/results/MOOD_V3_Quality_Pack.md`) that the founder can read like this document's §2.

## 29. Representative Before / After Workouts

Each example uses a real current V3 output (same user/date) as the base. "Proposed" shows the same base after the new pipeline; exercise changes are marked. Rest in seconds.

### Strength base: Upper Push, intermediate, 60, no State (current output, est. 43 min)

| | Exercise | Rx |
|---|---|---|
| B1 | Barbell Bench Press | 4 × 6 · RIR 2 · 150 |
| B2 | Parallel Bar Dip | 3 × 10 · RIR 2 · 90 |
| B3 | Smith Machine Incline Press | 3 × 10 · RIR 2 · 90 |
| B4 | Cable Fly | 2 × 12 · RIR 1 · 60 |
| B5 | Cable Triceps Pressdown | 2 × 12 · RIR 1 · 60 |
| B6 | Dumbbell Skull Crusher | 2 × 12 · RIR 1 · 60 |

Proposed no-State base (variant sampled: Compound + Paired Accessories; est. 54 min): Bench 4 × 5..7 RIR 2 · 180; Dips 3 × 8..10 RIR 2 · 105; Smith Incline 3 × 8..10 RIR 2 · 90; **Superset** Cable Fly 3 × 12..15 / Pressdown 3 × 10..12 RIR 1 · 75 after pair; Skull Crusher 3 × 10..12 RIR 1 · 60. Same exercises. 19 sets. The variant, not State, made it interesting.

**Low Energy** (current: replaces Bench with Incline DB Press and Dips with Seated DB Shoulder Press, drops Fly to 2 sets, 40 min, and claims "one set comes off the last accessory"). Proposed: variant biased to Traditional; Bench 3 × 6..8 RIR 3 · 180 (**kept**); Dips → **Machine Chest Press** 3 × 10 RIR 2 · 90 (stability bias fired because Dips are unsupported and systemic 3); Smith Incline 3 × 10 RIR 2; Cable Fly 2 × 12..15 RIR 2; Pressdown 3 × 12 RIR 2; Skull Crusher removed (volume −1 spent on the lowest-priority slot). 17 sets, est. 46 min. Log: `state_shift_applied {low_energy, effort +1 RIR}`, `{volume −1: slot secondary_accessory_extra removed}`, `{stability_bias: parallel_bar_dip → machine_chest_press}`, `{structure_bias: traditional}`.

**Amped** (current: RIR −1 everywhere, Fly/Pressdown superset, Chest-Supported Rear-Delt Row 2 × 20 "burnout", 44 min). Proposed, bundle chosen by history = Top Set + Back-off: Bench **1 × 4 RIR 1 + 3 × 6 RIR 2 · 180**; Dips 3 × 8 RIR 1 · 105 (heavier intent, weighted vest cue); Smith Incline 3 × 8..10 RIR 2; Superset Fly / Pressdown 3 × 12 RIR 1 · 60; Skull Crusher 3 × 10 RIR 1. No finisher this time (finisher_prob 0.4 lost the draw; last Amped used one). Budget spent: effort 1, volume 1 (top set), density 0.5. Est. 55 min.

**Irritated** (current: swaps Bench for Incline DB Press, RIR 0 on all accessories, Kettlebell Swing 3 × 15 finisher, 44 min). Proposed, variant Heavy Primary: Bench **5 × 4..5 RIR 1..2 · 210**, "drive it"; Dips 3 × 8 RIR 1 · 120; Smith Incline removed (Heavy Primary has fewer secondaries); Superset Fly / Pressdown 3 × 12 RIR 1 · 60; **Finisher (forceful type, prob 0.5, drew "sled/carry" because last Irritated was a hinge)**: Sled Push 4 × 20 m heavy, 60 s walk-back. RIR 0 nowhere by default. Est. 52 min.

**Bored** (current: one Fly/cross-body extension superset and a 15/12/9 Skull Crusher ladder). Proposed: novelty ×2 recency multiplier and variant Pyramid: Bench → **Barbell Incline Press** 4 × 8/6/6/4 ascending (protected slot allowed to move within family because continuity < novelty *only under Bored*, logged); Dips → **Deficit Push-Up (handles)** 3 × 10..12; Smith Incline → **Landmine Press** 3 × 10/side; Superset Low-to-High Cable Fly / **Overhead Cable Extension** 3 × 12; Skull Crusher ladder kept (12/10/8). Est. 53 min. Six exercises, five new to the user, one novel structure, still a push day.

### Sweat base: Hybrid, intermediate, 60, no State (current output)

Treadmill Run 500 m every round × **6 rounds**; stations rotate one per round: Sled Push 20 m (×2), Farmer Carry 60 m, Burpee 10, Goblet Squat 15, Box Step-Up 10/side; walk 45 s. Est. 39.8 min in-model, roughly 50 real.

Proposed base (shape: Anchor + Couplet, stations repeat): Run **400 m** × **5 rounds**; each round two stations from a rotating set of four (Sled Push 20 m + Goblet Squat 12; Farmer Carry 40 m + Burpee 8; alternate), walk 60 s; **Complement**: 6-min couplet EMOM Box Step-Up 8/side / Hollow Hold 30 s. Anchor 2,000 m (36% of active), reps 150, transitions 6. Est. 52 min with realistic pacing.

**Stressed Sweat** (current: same single anchor circuit, RPE 7 → 6..7). Proposed: shape Steady Anchor; Run 500 m × 4 at RPE 6, fixed couplet every round (Farmer Carry 40 m, Goblet Squat 12), walk 75 s, then 8 min continuous Stationary Bike RPE 5..6. Predictable, rhythmic, no clock pressure, no finisher. Est. 50 min.

**Amped Sweat** (current: 7 × 700 m Row at RPE 8 with five one-off stations, est. 43, real 55+). Proposed: budget lets Amped spend effort (+1 RPE → 8), density (rest 45 → 30) and *one* of {volume +1 round, finisher}; drew finisher. Row **500 m × 5** RPE 8; couplets KB Swing 15 + Box Jump 8 / Med Ball Slam 12 + Devil Press 6, alternating; walk 30 s; finisher 4 × 20 s Battle Ropes / 40 s easy. Anchor 2,500 m (38%). Est. 53 min. Same "hard day" feel, defensible dose.

### Athletic base: Power, intermediate, 60, no State (current, est. 42 min)

Hang Clean to Box Knee Drive 6 × 2/side · 120; Banded Broad Jump 5 × 3 · 120; Banded Lateral Bound 5 × 3/side · 75; QC Sled Push 6 × 10 m · 45.

**Low Energy Athletic** (current: primary changes to Pogo-to-Box Jump, 4 × 3 and 3 × 3/side, KB Deadlift 3 × 5 support, no QC, 33.7 min). Proposed: primary **kept** (continuity above State bias): Hang Clean to Box Knee Drive **5 × 2/side** submax-crisp cue · 120; Broad Jump 4 × 3 · 120; Lateral Bound **3 × 3/side** · 75; QC off; Performance Support **Trap Bar Deadlift 3 × 5 RIR 3** · 150 (strength transfer, low complexity). Rest untouched, contacts −20%, est. 38 min with an honest "quality over volume" label.

**Amped Athletic** (current: identical exposures, QC 7 bouts instead of 6). Proposed: intent bundle: primary variation upgraded to **Hang Clean to Box Jump** (harder valid variation of the same quality, skill-gated) 6 × 2/side · 120 "max intent"; Broad Jump **6 × 3** (+1 set, cap) · 120; Lateral Bound 5 × 3/side · 75; QC Sled Push 6 × 10 m (unchanged); PS allowed: Heavy Farmer Carry 3 × 30 m. Rest never shortened. Est. 47 min.

## 30. Estimated Build Sequence

Fastest path to a shippable generator, assuming one backend engineer and one frontend engineer, founder review at each gate.

| Week | Backend | Frontend | Gate |
|---|---|---|---|
| 1 | Bands + dial matrix as data; `dials.py` resolver with conflict table and budgets; decision log plumbing; realistic time model | Cart hook (preview/commit), contract types for new fields | Unit tests on resolver (all 18 State sets from the QA grid) |
| 2 | Strength variants + new `build_structure`; prescription from bands; ranking key reorder; drop signature validator checks | Cart read-first screen (header, groups, cards, media fallback) | Quality pack on Strength no-State: variety and minutes gates |
| 3 | Strength State modulation end to end; adaptation history; Custom Target fill rules; explain from log | Edit mode: reorder (within/between blocks), remove, unpair/pair | Quality pack on Strength States; founder review of 30 sessions |
| 4 | Sweat budget + Hybrid shapes + dose bands; structure weights; cold-start affinity | Swap in Cart; sets/reps stepper within bands | Quality pack on Sweat; Hybrid aggregate gates |
| 5 | Athletic touch-ups (Amped bundle, QC rotation, PS gating); Cart endpoints (`reorder`, `remove`, `add`, `edit`, `pair`) | Add exercise via library sheet; coach notes | Integration grid green; determinism; swap chains |
| 6 | Re-baseline frozen fixtures; media alias map; feature flag; device testing with the founder | Polish, hero set, Start → session handoff by id | Trainer review ≥ 4.0; ship behind flag |
| 7 to 8 | Buffer, library enrichment items from §6, Phase 2.6 resume, Phase 3 guided session unblocked | | |

Cart and generator can proceed in parallel from week 1 because the contract additions are known now.

## 31. Founder Decisions Needed

Only the ones that are product judgment, not engineering.

1. **Duration honesty vs fill.** When a user asks for 60 minutes, should MOOD fill to ~55 (more sets, more exercises, longer rests) or keep "complete at 40, quality over filler" and relabel the Home card? Recommendation: fill Strength and Sweat to requested −5; keep Athletic shorter with an explicit label.
2. **Default effort.** Should Amped and Irritated put any accessory at RIR 0 by default? Recommendation: RIR 0 only on ≤ 2 accessory sets under Amped, never by default under Irritated (Irritated is heavy and forceful, not to failure).
3. **Protected primary under State.** Today Low Energy/Stressed/Irritated can change the main lift. Proposal: State never changes the primary except under Bored (within family, logged) and Sore (safety). Confirm.
4. **Custom Target block size.** Reduce single-muscle 60-min blocks from 5 exercises to 4 with a compound floor, or keep 5 with the family cap? Recommendation: 4 with ≥ 1 compound (Core excepted).
5. **Cart editing depth for v1.** Reorder + remove + swap + pair/unpair + sets stepper (recommended) versus also add-exercise and reps editing in v1.
6. **Cart as the primary post-generation screen** in read-first mode (recommended) versus keeping Preview and adding an Edit screen.
7. **Visible variant names.** Show "Heavy Primary", "Top Set + Back-off", "Anchor + Couplet" in the header (recommended, it is the V2 "flavor" the founder liked) versus keeping structure implicit.
8. **Forearms / abductors / adductors as user-facing Targets.** Enrich the library or demote them to accessory-only.
9. **Media plan.** Approve the alias-curation pass now and a ~60-movement shoot list, or accept the initials fallback for launch.
10. **Frozen status.** Formally lift "frozen" for the four layers named in §22 and re-baseline the parity fixtures after the quality gates pass.

---

*Analysis only. Nothing in `backend/`, `frontend/`, `data/` or `tests/frozen/` was modified. Sampling scripts ran from a scratch directory outside the repository and are not committed.*
