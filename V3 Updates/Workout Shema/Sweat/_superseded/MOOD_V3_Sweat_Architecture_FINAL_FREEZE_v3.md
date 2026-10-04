# MOOD V3 Sweat Architecture FINAL FREEZE v3 · 2026-09-23

**Status: Sweat FINAL FREEZE.** v2 (implementation-ready) was accepted. v3 adds exactly two founder-requested guardrails (Low Energy repetition fix, Sweat Cardio Identity Contract SC1 to SC5), the Hybrid variety correction and the documented Athletic firewall. It is implemented in the Sweat reference generator v2, and targeted plus full automated QA is green. No implementation blocker.

Governing frozen sources (unchanged): WA FINAL_FREEZE v16, ET FINAL_FREEZE v11, SD FINAL_FREEZE v5, Strength Library v11. Strength is untouched.

| File (Sweat folder) | What it is |
|---|---|
| `MOOD_V3_Sweat_Architecture_FINAL_FREEZE_v3.md` | This spec |
| `MOOD_V3_Sweat_FREEZE_Record.md` | Freeze record (versions, final changes, QA totals) |
| `MOOD_V3_Sweat_Library_Audit_v3.xlsx` | Classification, 16 additions, eligibility map, pool density (generated) |
| `MOOD_V3_Sweat_Reference_Generator_v2.zip` | Generator, validator, renderer, QA runner, workbook builder |
| `MOOD_V3_Sweat_QA_Results_v2.json` / `MOOD_V3_Sweat_QA_Fixtures_v2.json` | Full QA output and 41 reference fixtures |
| `MOOD_V3_Sweat_QA_Report_v2.md` | QA summary, targeted Tier 5 results and rendered fixtures |

## v3 change log (v2 → FINAL FREEZE)

| # | Change | Where |
|---|---|---|
| V3-1 | **Low Energy repetition fixed.** The State predicate (rank 3) is now a **compliance tier**. Candidates that satisfy the State equally well tie at rank 3, and history / recency (rank 5) chooses among them; the finer State taste only applies after recency. Low Energy tiers: 0 = low systemic (≤ 4), low impact, and supported / semi-supported or very low systemic (≤ 2); 1 = acceptable; 2 = violates (systemic 5 or high impact) and never wins on variety. The same tiering applies to Stressed (familiar), Bored (novelty ≥ 3), Irritated (forceful) and Amped (forceful / explosive). | §F.1a |
| V3-2 | Supported machine / cable rows are verdict **preferred** when their condition holds (Low Energy, Beginner, explicit Target); incline treadmill walk is preferred as an Engine primary. Without this, verdict (rank 2) forced the same free-weight item every Low Energy session. | Workbook v3 |
| V3-3 | **Sweat Cardio Identity Contract SC1 to SC5** added to the validator and generator (duty cycle ≥ 0.60, subordinate resistance, output-oriented progression, conditioning driver). I2 is superseded by SC4. | §C.1 |
| V3-4 | **Hybrid variety.** Sled / carry and anchor preferences moved *below* recency (still preferred when fresh). At most one sled station per session on the first pass, so the sled push + sled pull + carry template is a subset, not the default. Recency also looks at the last 2 sessions of the same archetype. | §B.3 |
| V3-5 | **Athletic firewall** documented. | §M |
| V3-6 | Implementation fixes found by the new QA: complement circuit round rest capped at the round's work (SC1); rep caps for EMOM fill (hanging ≤ 10, pull-ups ≤ 8, resistance ≤ 15); Target coverage swap (every named muscle covered in the primary circuit); a State-lowered complexity cap can relax to the experience baseline for any role that would otherwise be empty (Strength FB1 analogue, logged); 3-item circuit when the pool is genuinely constrained (within the 3-5 rule). | §K.2 |

## 0. v2 change log (Pass 1 → v2, retained)

| # | Change | Where |
|---|---|---|
| B1 | Target approved: same body / muscle selector as Strength; explicit non-full-body Targets route to Circuit. No new UI. | §G |
| B2 | Three archetypes approved. **Engine now has two explicit modes, `steady` and `interval`**, selected by State, history (`engine_mode` recency) and goal. | §B, §E.2 |
| B3 | 16 additions approved and carried as full records. | Workbook: SWEAT ADDITIONS |
| F1 | **Core reclassified.** 16 core exercises Class A, `hanging_leg_raise` Class B; ab wheel, Copenhagen plank, dragon flag, landmine rotation excluded (Class C). | §H.1 |
| F2 | **Sweat commercial default includes sled + turf.** No-sled gyms substitute through normal feasibility / ranking. Strength's frozen default is unchanged. | §H.3 |
| C1 | **Soreness dependency made operational:** an archetype is dependent only when its required primary block cannot build after sore-primary exclusion. Sore-secondary items remain legal (deprioritized). Engine with sore legs is **not** dependent (SkiErg stays legal). | §F.2 |
| C2 | **No max / all-out treadmill running.** Treadmill may reach RPE 9; min 60 s bout retained. Derived predicate `max_intent_ok` excludes treadmill / running. | §C I5, §J2 |
| C3 | **J5 counts unique fixed stations across the whole block, all rounds included** (rotating stations count). Physical-station keys defined. | §J5 |
| C4 | **Jump Rope:** beginner-eligible as a Circuit station; as Engine primary or Engine complement it needs Intermediate+ (eligibility condition, no taxonomy change). | §H.2 |
| C5 | **EMOM:** expected work per minute ≤ 40 s from the time model; the generator reduces the dose until it fits, or falls back to another structure. | §E.1 |
| C6 | Counts reconciled against the rerunnable audit (all counts in this document come from `build_workbook.py`). | §H |
| I1 | Implementation fix: archetype rotation is **least-recently-used**. Pass 1's "first archetype not done last session" only alternated between two archetypes. | §B.2 |
| I2 | Implementation defaults added during the build (no founder decision needed); see §K.2. | §K.2 |

---

## A. Shared-system reuse (unchanged from Pass 1 except where noted)

Reused unchanged: ET fields and vocab, SD v5 (matrix, dial binding Sweat column, arbitration, predicates), SORE CONTRACT, S0 / S2a / S2b / S3 / S4, ranking ranks 1 to 8, SW1, SWAP CONTRACT, outcome classes, explanation contract, goal mapping, warm-up / downshift computation.
Sweat-specific: Target resolution (§G), dependency definition (§F.2), engine modes (§E.2), structures `intervals` / `emom` / `continuous` (§E), dosing and duration fit (§D), invariants (§C), safety (§J).
Not applicable: TARGET ROUTING, RR1 to RR3, G3 protected continuity, ATD, FB1, pairing-eligible rule, set-count DF1 / DF2.

---

## B. Archetypes

| | Engine `sweat_engine` | Circuit `sweat_circuit` | Hybrid `sweat_hybrid` |
|---|---|---|---|
| Primary block | 1 engine item; mode `steady` (continuous) or `interval` (intervals / pyramid) | 4 items: engine-or-output, then Target / region resistance, then core-or-output | Anchor engine every round + stations (60: 4 rotating, 1 per round; 30: 2 every round) |
| Reached by | MOOD's Pick, full_body | MOOD's Pick, full_body, **every explicit region Target** | MOOD's Pick, full_body |
| Complement | fixed 3-item circuit, or short engine intervals on a different machine (alternates by history) | engine intervals / EMOM couplet / ladder couplet / steady / fixed circuit (by State and Target) | upper + core 3-item circuit, RPE 6-7 |

### B.1 Required-block hard requirements (also define dependency, §F.2)

- **Engine:** ≥ 1 viable engine item for the chosen mode / format.
- **Circuit:** ≥ 1 engine-or-output item and ≥ 2 resistance / core items that satisfy composition (region rule, one loaded hinge, one high-impact item, ≤ 2 fixed stations).
- **Hybrid:** 1 anchor (treadmill run, row, ski, air bike, stationary bike) + ≥ 2 stations including ≥ 1 lower-dominant station, anchor + stations within the fixed-station cap.

### B.2 MOOD's Pick selection

1. Goal-ordered rotation: Improve Conditioning Circuit → Engine → Hybrid; Performance Hybrid → Circuit → Engine; General Fitness Circuit → Engine → Hybrid. Beginner: Hybrid last.
2. **Least-recently-used order** over Sweat history: never-used archetypes first (rotation order), then oldest; the last session's archetype is last. (I1)
3. State affinity tie-break: Low Energy and Stressed {Engine, Circuit}; Irritated {Hybrid, Circuit}; multi-State = intersection, else the constrained domain (Low Energy, then Stressed). Bored: least-recent archetype wins.
4. Swap: swap 1 keeps the archetype; swap ≥ 2 advances the candidate list.
5. Feasibility precheck (equipment / level, soreness ignored): skip with `archetype_skipped_equipment`.
6. Build; if the build fails only because of soreness, the archetype is dependent → next candidate (`sore_reroute`).

---

### B.3 Hybrid variety (v3)
HYROX-style sessions (run + sled + carry + wall balls) remain a natural subset of Hybrid, not its only expression. Station and anchor preferences sit below recency; the first pass admits one sled station, and a second sled station can still appear when it is the best remaining option. Across 8-session runs: no full sled-push + sled-pull + carry template, anchors rotate across treadmill / rower / SkiErg, consecutive sessions share 0% of stations (Irritated shares 60%, which is the minimum possible when only 7 forceful stations fill 5 slots), and 20 distinct stations appear over 8 intermediate sessions.

## C. Invariants (hard, validator-enforced)

| # | Rule |
|---|---|
| I1 | One required primary block, first; structures only from {intervals, circuit, emom, ladder, pyramid, continuous, finisher}. |
| I2 | Superseded by SC4 (v3). Engine primary is still exactly one engine item. |
| I3 | Conditioning-block minutes ≥ 14 (30) / 26 (60) before State Volume; ≥ 12 / 22 after. |
| I4 | Interval recovery ≤ 2x work (≤ 3x for bouts ≤ 20 s); round rest ≤ 2:00; within a round, transitions only; `continuous` has no programmed recovery. |
| I5 | Resistance dosed ≥ 8 reps (per-side counts both sides) or ≥ 30 s / ≥ 20 m, cue "moderate, unbroken, clean". "Heavy" only on carries and sleds. **"All-out" only when `max_intent_ok`** = self-limiting (ergs, sled, rope, throw / slam) **and not treadmill / running and not a carry.** (C2) |
| I6 | At most 2 blocks with RPE floor ≥ 8; finisher ≤ 6 min. |

Derived predicates (no taxonomy fields): role, self_limiting, max_intent_ok, heavy_ok, loaded_hinge, hanging, fixed_station_key.

### C.1 Sweat Cardio Identity Contract (v3, hard, validator-enforced)

Sweat may use bodyweight, sleds, carries, dumbbells, kettlebells and machines. What makes it Sweat is the **session structure, the dosing and the intended limiter** (breathing / work capacity or the end of the interval, never the inability to do another rep).

| # | Principle | Generator behavior | Validator test |
|---|---|---|---|
| SC1 | **Clock / output governs the session.** | Primary structures: continuous, intervals, timed stations, rounds, EMOM, pyramid. Every item is dosed in reps, time, distance or calories inside that structure. Circuit round rest is capped at the round's own work time (never set → long passive rest → set). | `SC1_primary_structure`; `SC1_round_rest_below_round_work` (every non-anchor circuit, primary and complement); `SC1_output_prescription` |
| SC2 | **Resistance is subordinate to conditioning.** | Resistance cue "moderate load, unbroken, well short of failure" (hinges "moderate, crisp hips, RPE ≤ 8"; bodyweight "steady, clean reps"); I5 minimum dose kept; rep ceilings (20 total, 12 per side; EMOM fill ≤ 15, ≤ 10 per side). No RIR UI, no new fields. | `SC2_resistance_cue`, `SC2_resistance_rep_ceiling`, `SC2_no_max_on_resistance` |
| SC3 | **Sustained work density.** | Primary block duty cycle ≥ **0.60** (ST4 time model). Active = exercise time, in-round transitions (10 s), timed-rotation changeovers up to 15 s, and easy engine recoveries (the user keeps moving). Passive = round rest, the walk between Hybrid rounds, the EMOM remainder, and rotation changeover beyond 15 s. EMOM doses are filled toward 36-40 s of work. Repair order if short: shorten passive rest in 15 s steps (floor 30 s), then fall back to the next permitted structure; exercises are never added to pass. | `SC3_primary_duty_cycle` |
| SC4 | **A conditioning driver in every primary block.** | Engine: the modality. Hybrid: the repeated anchor (≥ 2 rounds). Circuit: ≥ 1 engine / output / locomotion station per round where feasible. If no engine or output item is feasible (equipment + soreness), a **resistance-only Circuit** is allowed only as a timed rotation (EMOM for Bored), duty ≥ 0.60, with ≥ 2 systemically demanding items (systemic ≥ 3), at least one of them a whole-body pattern (integrated, squat, lunge or hinge). Logged `conditioning_driver_resistance_only`. Stressed uses the first two of those items as a 2-station rotation. | `SC4_conditioning_driver`, `SC4_hybrid_anchor_every_round` |
| SC5 | **Progression is output-oriented.** | Every block carries `progression_basis` (continuous: duration / pace at the same RPE; intervals: output and completion; pyramid: output held across steps; EMOM: minutes completed on time, then modest density; circuit: rounds / round time). Every item carries `item_progression`: `output` for engine / output items, `reuse_load` for resistance (last load remembered, not increased as an objective). | `SC5_progression_basis`, `SC5_item_progression` |

---

## D. Session assembly and duration

Order: dials → archetype → (Engine) mode and format → primary block → complement (60 always; 30 only when primary ≤ 14 min) → Sweat DF → I3 guard → State Volume → finisher (60, Extras ≥ 1) → Effort → I6 cap → validator.

| | Warm-up | Primary target (max) | Complement target (max) | Downshift |
|---|---|---|---|---|
| Engine 60 / 30 | 7 / 4 | 22 (26) / 16 (18) | 9 (10) / 6 | 5 / 3 |
| Circuit 60 / 30 | 6 / 4 | 21 (24) / 17 (19) | 10 (12) / 6 | 5 / 3 |
| Hybrid 60 / 30 | 7 / 5 | 23 (26) / 15 (18) | 8 (10) / 6 | 5 / 3 |

Band: 30 → 22-28 min, 60 → 42-55 min (±0.5 tolerance; transitions 1 min per work block). DF adds a primary unit (round / interval / EMOM round / +2 min continuous / ladder rung), then complement units; over band removes complement units, then primary units; at 30 a complement that cannot fit is removed. **Volume −1 removes a unit from the lowest-priority block and is clamped so I3 (after-dial floor) still holds.**

---

## E. Structures, Engine modes, dosing

### E.1 Structures (launch set unchanged)

`intervals` (single item or timed rotation 30/30 beginner, 40/20 intermediate, 45/15 advanced; Low Energy 30/30), `circuit` (rounds; Hybrid anchor rounds), `emom` (intermediate+, not Low Energy / Stressed), `ladder` (complement couplets only, 10-8-6-4-2 extendable to 14, intermediate+, not Low Energy / Stressed), `pyramid` (Engine only), `continuous`, `finisher`. AMRAP, For Time and complexes stay out.

**EMOM (C5):** every item's expected work, from the ST4 time model, must be ≤ 40 s. The generator lowers reps / calories / distance until it fits, but never below the I5 minimum (8 reps, or 4 per side for resistance); if that is impossible the block falls back to `circuit`. Validator re-checks every EMOM item.

**Structure gates:** Treadmill / stair items never appear in timed rotation or EMOM (min 60 s bout). Pull-ups and hanging items never appear in timed rotation (rep cap). Stressed: fixed-order circuit only. Beginner: circuit or intervals, recovery ≥ work.

### E.2 Engine modes (B2)

| Mode | Structure | RPE | Formats |
|---|---|---|---|
| `steady` | `continuous`, no programmed recovery | 5-7 | `aerobic` (RPE 5-6 throughout), `tempo` (thirds at RPE 5, 6, 7) |
| `interval` | `intervals` or `pyramid` | 7-9 | `long_even` (4:00 / 1:30; Stressed 6:00 / 2:00; max 6), `short` (0:30 / 1:00, advanced 0:40; max 10 before Volume), `pyramid` (1-2-3-2-1 or 1-2-3-4-3-2-1 min, 1:00 easy), `controlled` (1:00 / 1:00; Low Energy and all beginners) |

| State | Allowed modes / formats | Preference |
|---|---|---|
| Normal | steady {aerobic, tempo}; interval {long_even, short, pyramid} | alternate vs last Engine `engine_mode`; cold start by goal (Conditioning / Performance → interval, General Fitness → steady) |
| Stressed | steady {aerobic}; interval {long_even} | steady first; alternates with long-even intervals across Engine sessions |
| Low Energy | steady {aerobic, tempo}; interval {controlled, long_even} | steady first; alternates |
| Amped | interval {short, long_even, pyramid} | interval only |
| Irritated | interval {short} | hard, simple intervals |
| Bored | interval {pyramid, short, long_even}; steady {tempo} | interval first; least-recent format |
| Beginner (any State) | steady {aerobic ≤ 20 min}; interval {controlled} | as above |

Multi-State: intersect allowed modes / formats; if empty, the constrained domain decides (Low Energy, Stressed, Irritated, Amped, Bored). Formats used in the last Engine session or the displayed composition are deprioritized. On calm formats (steady, and long / controlled intervals on Stressed or Low Energy days) the machine preference is row, stationary bike, incline walk, then treadmill / stair; SkiErg and air bike rank below them. **History record adds `engine_mode`, `engine_format`, `primary_structure`, `comp_type`.**

### E.3 Dosing

Unchanged from Pass 1 E.3, with: pull-ups / chin-ups / dips 8 reps; hanging raises ≤ 10; Hybrid stations ~1.25x circuit dose; Hybrid anchor sized to ~2:30 at 60 (beginner ~1:50) and ~2:00 at 30 (beginner 1:30), distance rounded to 100 m (50 m under 350 m).

---

## F. States and soreness

### F.1 State behavior
Unchanged from Pass 1 §F, plus the Engine mode table (§E.2). Two domain clarifications, both from SD v5: when Low Energy is present, forceful / output ranking bonuses from Irritated or Amped only apply to exercises with systemic_demand ≤ 4 ("Low Energy constrains systemic cost first"), and Extras stay off.

### F.1a State compliance tiers and recency (v3)
Ranking key (frozen rank order kept, rank 3 made coarse): hard filters → sore-secondary deprioritized → verdict → structural preference (e.g. calm-machine preference on steady / Low Energy Engine days) → **Low Energy tier** → **State compliance tier** → Target coverage → swap chain and recency (last 2 Sweat sessions + last 2 of this archetype) → Low Energy fine score → State fine score → soft taste preference (Hybrid sled / carry / anchor) → priority_bias → engagement tie-break → stable seed.

| State | Compliance tier (rank 3) | Fine taste (after recency) |
|---|---|---|
| Low Energy | tier 0 / 1 / 2 as in change V3-1 | support level, lower systemic demand, familiarity |
| Stressed | familiar (novelty ≤ 2) | no fixed station |
| Bored | novelty ≥ 3 | exact novelty |
| Irritated | forceful_safe (systemic ≤ 4 if Low Energy present) | explosive |
| Amped | forceful or explosive (same Low Energy guard) | compound / integrated, explosive |

Result (Tier 5a, 8-session runs): Low Energy Engine sessions rotate among incline walk, stationary bike and rower, never repeating the same machine back to back; Circuit resistance changes session to session within supported / low-systemic options; zero Low Energy violations (no systemic-5, high-impact or tier-2 items selected for variety).

### F.2 Soreness and dependency (C1)
- S0 unchanged: sore primary muscle (rolled up / expanded) → excluded; sore secondary → ranked below sore-free options, still legal.
- **Dependent (Sweat):** after sore-primary exclusion, the archetype's required primary block cannot build under §B.1 and the §C / §J rules. Operationally: the build fails with soreness applied and succeeds without it.
- MOOD's Pick: a dependent archetype is skipped (`sore_reroute`, VALID ADAPTIVE REROUTE). Explicit Target: S2a (named sore muscles treated as not sore), S2b (the primary block is the single required slot), otherwise S3 terminal.
- **Engine with sore quads, hamstrings and glutes is not dependent:** SkiErg loads glutes only as a secondary muscle, so it stays legal and the Engine builds (fixture W13b). Hybrid with sore legs is dependent (no lower-dominant station), which MOOD's Pick never reaches because it rerouts first.

---

## G. Target (B1)
Unchanged from Pass 1 §G. Resistance items: ≥ 2/3 inside the Target regions; each named muscle covered as primary or secondary somewhere in the workout. Engine / output items are exempt but ranked by Target coverage (rank 4).

---

## H. Library (counts from `build_workbook.py`)

### H.1 Classification (212 records)

| Class | Existing 196 | Additions | Notes |
|---|---|---|---|
| A reusable | **46** | | +7 core vs Pass 1 (weighted plank, cable / machine crunch, decline / weighted sit-up, Pallof step-out, cable wood chop) |
| B Sweat-specific eligibility | **30** | | +hanging_leg_raise |
| NEW | | **16** | |
| C excluded under fatigue | **32** | | +ab_wheel_rollout, +copenhagen_plank (reasons in workbook) |
| D not used at launch | **88** | | |
| **Sweat-eligible** | **76** | **16** | **92 total**, 384 eligibility rows |

Core stations available to an intermediate in the commercial default: 12 (17 exercises are core-eligible in total; the remaining 5 need a beginner, Low Energy or Target context because they sit on machines / cables).

### H.2 Eligibility highlights
- Machines / cables carry `state_id = low_energy OR experience = beginner OR target_count >= 1`.
- **Jump Rope:** `sweat_engine.primary_engine_block` and `sweat_engine.complementary_block` rows carry `experience != beginner`; `sweat_circuit` rows have no condition (beginner short station). (C4)
- Hybrid uses sub-slots `primary_hybrid_block.anchor` / `.station` (same convention as Core variants).

### H.3 Pool density (sled + turf now in the Sweat default)

| Preset / level | engine | output | lower | upper | core | total |
|---|---|---|---|---|---|---|
| Sweat commercial default, Beginner | 8 | 9 | 17 | 31 | 16 | 81 |
| Sweat commercial default, Intermediate / Advanced | 8 | 10 | 18 | 20 | 12 | 68 |
| Commercial, no sled, Intermediate | 8 | 8 | 18 | 20 | 12 | 66 |
| Free-weight gym, Intermediate | 1 | 7 | 17 | 15 | 9 | 49 |
| DB + bench + rope + bodyweight, Beginner | 1 | 2 | 7 | 11 | 7 | 28 |

Beginner counts exceed intermediate because machine / cable stations are open to beginners by condition. Irritated forceful_safe pool: 11 with sled (9 without). Complexity-lowered slice (Low Energy): 83 eligible, 40 supported / semi-supported. Bored novelty ≥ 3: 16.

---

## J. Safety (J1 to J6, with v2 corrections)

| Rule | Definition |
|---|---|
| J1 | precision_required = FALSE; complexity ≤ min(resolved cap, 3); no barbell / trap bar (inverted row on a rack is the one bodyweight exception). |
| J2 | All-out only when `max_intent_ok` (never treadmill / running, never carries, never resistance). Loaded hinges cued RPE ≤ 8. Treadmill RPE ≤ 9. (C2) |
| J3 | High impact: none for Beginner, Low Energy or sore lower body; ≤ 1 per block. |
| J4 | ≤ 1 loaded hinge per block; pull-ups ≤ 8 reps and hanging ≤ 10 reps; a hanging item and a carry never share a block. |
| J5 | **≤ 2 unique fixed stations per block, counted across every round, including rotating stations.** Keys: `machine:<equipment>` (treadmill, rower, SkiErg, bike, stair), `sled_lane` (sled push + pull share it), `wall_ball_target`, `rack`, `pullup_bar`, `dip_station`, `station:<swap family>` for each machine / cable / landmine setup. Pass 1's W03 (treadmill + SkiErg + wall-ball target = 3) is now impossible by construction and by validator. (C3) |
| J6 | Adjacent items (with wrap) should not share first primary muscle; first pass also avoids a repeated push / pull class; relaxation logged. |

---

## K. Implementation and QA

### K.1 QA results (reference generator v2, all tiers green)

| Tier | Result |
|---|---|
| 0 Data | 0 errors |
| 1 Diagnostic grid | 672 builds: **0 ACTUAL GENERATOR FAILURES, 0 hard-rule failures**; MOOD's Pick 168 / 168 VALID BUILD; 112 VALID INFEASIBLE (forced Engine / Hybrid without machines); 12 VALID TERMINAL CONFLICT (forced Hybrid, sore legs) |
| 1 Named fixtures | 41 / 41 pass; 41 / 41 match reference on rerun |
| 2 Reproducibility / swap / history | 400 / 400 identical; swap 13 healthy + 1 limited but defensible; history 8 / 8 good |
| 3 Soreness | 156 cases, 0 sore-primary violations, 0 other failures |
| 4 Invariants + safety + SC contract | 832 workouts, 73,402 checks, 0 violations; 0 fixed-station overflows |
| **5a Low Energy rotation** | 5 profiles × 8 sessions: all rotate; 0 Low Energy violations |
| **5b Duty cycle** | 0 primary blocks below 0.60. Minimum / mean: Circuit rounds 0.67 / 0.76, Circuit EMOM 0.61 / 0.64, Circuit timed rotation 0.62 / 0.71, Hybrid 0.76 / 0.83, Engine 1.00. 2 repairs (rest shortened) |
| **5c Resistance-heavy Circuits** | 72 cases (6 explicit Targets × Normal / Low Energy / Stressed × Beginner / Intermediate × 30 / 60): 72 / 72 pass SC1 to SC5; minimum duty 0.67; all 72 carry a conditioning driver |
| **5d Equipment-limited Circuits** | 96 cases across 3 limited gyms × soreness × States: 96 / 96 pass; 24 resistance-only builds, all timed rotations meeting SC4 |
| **5e Hybrid variety** | 4 profiles: all varied (Irritated: varied within its State-limited pool); 0 full HYROX-template sessions |
| Soft | 2 duration-band misses (limited-equipment presets, within session length) |

### K.2 Implementation defaults (no founder decision)
v2 K.2 items 1 to 7 stand. v3 adds: SC1 complement rest cap, EMOM rep caps, Target coverage swap, State-cap relaxation for any empty role, 3-item constrained circuit, and resistance-only selection plans (2 whole-body items preferred, else 1 whole-body + 1 high-systemic).

### K.3 Genuine implementation blockers
**None.**

### K.4 Known and accepted for launch
- A few pools are genuinely thin for a given State, so some repetition is expected: Beginner Low Energy circuits tend to keep the kettlebell deadlift as the portable lower item (the station cap blocks a third machine), and Irritated Hybrid shares 3 of 5 stations session to session.
- Sled appears in most commercial-default Hybrid sessions as one station among four or five; the full sled template no longer dominates.
- Explicit Target circuits can overlap about 60% on swap 1 when the Target pool is narrow.
- Resistance-only Circuit exists only for extreme equipment + soreness combinations (0 of 168 MOOD's Pick grid builds needed it).

## L. Regenerated examples affected by v3 (generator output)

Full generator output for all 41 fixtures is in the QA report v2.

### Low Energy, 4 consecutive sessions (intermediate, 60)
```
Day 1 Circuit  Stationary Bike 1:00 · Kickstand DB RDL 8/side · Chest-Supported Machine Row 12 · Dead Bug 8/side (4 rounds) + Row Erg steady 9:00
Day 2 Engine   Incline Treadmill Walk, steady 22:00 @ RPE 5-6 + Leg Press 12 · Lat Pulldown 12 · Reverse Crunch 15
Day 3 Circuit  Suitcase Carry 30 m · Hack Squat 12 · Assisted Pull-Up Machine 12 · Battle Rope Waves 0:30 (5 rounds) + Stationary Bike steady 9:00
Day 4 Engine   Row Erg, 11 × 1:00 @ RPE 7 / 1:00 easy (controlled intervals) + Kickstand DB RDL · Plate-Loaded Incline Press · Front Plank
```
Engine modality and resistance items rotate within the Low Energy-compliant set; Volume −1 and Extras-off behavior are unchanged.

### W03 · Hybrid · 60 · Intermediate · Normal (v3 variety)
```
PRIMARY HYBRID · anchor circuit, 5 rounds, 1:00 walk between   [RPE 7]   duty 0.83
   Every round: Treadmill Run 500 m · race pace RPE 7
     R1 Sled Push 20 m · R2 Farmer Carry 60 m · R3 Goblet Squat 15 · R4 Burpee 10 · R5 DB Step-Up 10/side
COMPLEMENTARY · circuit, 3 rounds   Push-Up 10 · Wall Ball 15 · Dead Bug 8/side
Progression: rounds completed / round time; resistance loads reused
```
The next intermediate Hybrid sessions use a Row Erg anchor with lunge / hinge / squat-press stations, then a SkiErg anchor with slam / carry / sled stations (Tier 5e).

### W10 · Hybrid · 60 · Intermediate · Irritated
```
PRIMARY HYBRID · Row Erg 600 m every round, RPE 8   duty 0.81
   R1 Jump Squat 15 · R2 Med-Ball Slam 15 · R3 Sled Push 20 m · R4 Burpee 10 · R5 Farmer Carry 60 m
COMPLEMENTARY · Push-Up 10 · Wall Ball 15 · Front Plank 0:40   [RPE 7-8]
FINISHER · 6 × 0:20 all-out / 0:40, Battle Rope Waves / Sled Rope Pull
```

### Resistance-heavy Circuit · Explicit quads + glutes · Low Energy (SC contract)
```
PRIMARY CIRCUIT · 4 rounds, 1:30 between   duty 0.77
   Stationary Bike 1:00 (driver) · Cable Pull-Through 12 (RPE ≤ 8) · Goblet Squat 12 (moderate, well short of failure) · Dead Bug 8/side
COMPLEMENTARY · Row Erg steady 9:00
```

### Equipment-limited, resistance-only (DB + bench, sore quads + core, SC4 fallback)
```
PRIMARY CIRCUIT · timed rotation 40/20, 4 rounds, 1:00 between   duty 0.77
   DB Romanian Deadlift · DB Clean to Press · Diamond Push-Up · Bent-Over DB Row
log conditioning_driver_resistance_only
```

---

## M. Athletic firewall (for the Athletic build)

| | Sweat | Athletic |
|---|---|---|
| Purpose | **Accumulate and repeat output under controlled fatigue.** | **Produce high-quality speed, power, coordination and explosive output while preserving rep quality.** |
| Favors | sustained / repeated work; short to moderate recoveries; cardiovascular accumulation; moderate repeatable resistance; simple fatigue-safe movements | maximal intent; speed / power; jumps, throws, sprints; skill and coordination; longer or full recovery where needed; stopping when output quality falls |
| Limiter | breathing / work capacity, end of interval or round | drop in speed, height, distance or mechanics |
| Same exercise, different prescription | Med-ball slam: 10-15 repeated slams inside a conditioning round | Med-ball slam: low-rep maximal-intent throws with enough recovery to keep power |

Sweat enforcement already in the validator: explosive items are only prescribed as repeated work (≥ 8 reps, ≥ 20 s, or distance / calories), finisher bouts ≥ 15 s, and "all-out" only on self-limiting non-running items. Sweat never programs low-rep maximal-intent sets, long power recoveries or quality-gated stopping rules; that space belongs to Athletic.

---

**Sweat FINAL FREEZE.** Next: Athletic architecture.
