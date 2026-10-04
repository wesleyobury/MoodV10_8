# MOOD V3 Sweat: Final Programming-Quality Pass and Freeze

Branch `feature/mood-v3-app-rehaul`, nothing committed. Strength untouched. Athletic not started. Tests `168 passed, 2 skipped`, unified QA green. Sweat is frozen: `ENGINE_PHASE = '3.2-sweat-frozen'`, `ENGINE_VERSION = '... | sweat-frozen-v5 (budget+shapes+gate+coherence+completeness+contract) | ...'`, freeze record `backend/mood_v3/qa/results/SWEAT_FREEZE.md`, baseline `SWEAT_FREEZE_metrics_baseline.txt` (with the previous pass printed beside it as BEFORE).

Companion files in `V3 Updates/`: `MOOD_V3_Sweat_Rebuild_Review_Pack.md` and `.xlsx` (62 cases, block hierarchy labelled, completeness in the debug layer, a BEFORE / AFTER section for the named cases, and a Before vs After sheet).

## 1. The one question, made into code

`completeness(blocks)` reads the finished main block and answers "if performed honestly at the prescribed RPE, is this already a sufficient conditioning stimulus for this person?" It is deliberately lean: active minutes weighted by effort (RPE 5 to 9 map to 0.7 to 1.6) and density (1.1 when duty is 85 percent or more; 0.9 for slow round-rest formats), plus loaded reps / 40, bodyweight reps / 60, 1.5 per systemically demanding station and 0.5 per high-impact item. Thresholds by level at 60 minutes: sufficient 14 / 18 / 21, substantial 22 / 27 / 32 (beginner / intermediate / advanced); 30 minutes scaled by 0.6; Low Energy reaches both 10 percent sooner. Every session logs `primary_block_completeness` with the label, score, thresholds and features, and it shows in the founder layer as "Primary block completeness: insufficient / sufficient / substantial".

## 2. What the label decides (all archetypes, all States, both durations)

- Insufficient: the main block grows first (within its blueprint), then one complement. Beside a hard (RPE floor 8 or top 9) or Low Energy main block that complement is still modest.
- Sufficient: main only is valid. At most one secondary element, and only with a stated purpose: Low Energy extra sustainable minutes on a second modality, or an easy flush after RPE 7+ work; Bored a change of stimulus; a steady engine session in the lower half of the sufficient band gets a little muscular conditioning (2 rounds, 3 stations, RPE 6 to 7, about 7 minutes); a station-led circuit in the lower half with under 6 engine minutes gets a short engine piece (about 6 minutes). Stressed gets nothing added. Every complement kept is logged with its purpose, and the purpose is printed in the block's instructions.
- Substantial: no complement. A finisher only for an intentionally selected expression (Irritated `direct_finisher`) on a main block that is not already hard.
- Never main + complement + finisher. Never a finisher after a hard main block. Finisher probabilities are halved beside a sufficient main block.
- What remains of the window is filled by preparation appropriate to the workout, within caps: 1 to 3 minutes of technique and setup before round 1 on station blocks, warm-up up to 10 minutes, downshift up to 8. Nothing else. The Hybrid rule from the previous correction (one block, completeness gate, closer only when justified) is unchanged.

Built for Today says it plainly when the main block stands alone: "The main block is the whole workout: nothing is added after it. About 48 minutes in all with warm-up and downshift." The duration contract entry now reads "use the available window for the best session, not fill it" and carries the completeness score.

## 3. Before / after workload distributions (2,012 production-path runs, identical seeds)

60-minute sessions (1,185):

| | Before | After |
|---|---|---|
| Main only | 25% | 59% |
| Main + complement | 69% | 39% |
| Main + finisher | 0% | 2% |
| Main + complement + finisher | 5% (62 cases, all listed in the baseline) | 0 |
| Median elapsed | 49.3 min | 47.8 min |
| Median meaningful active | 25.7 min | 20.5 min |
| Median main-block active | 19.1 min | 18.4 min |
| Median loaded reps | 84 | 56 |
| Median engine minutes | 13.6 | 12.5 |
| Median warm-up / downshift | 6 to 7 / 5 | 10 / 6 |

Complement frequency by main-block effort (60 min): steady RPE 7 or below 80% to 48%; moderate 7 to 8 73% to 39%; hard (floor 8 or top 9) 63% to 10%. Finisher: 4% / 7% / 1% to 2% / 3% / 0%. Completeness at 60 minutes: substantial 319, sufficient 709, insufficient 157.

By archetype at 60 minutes (main-only share, before to after): Circuit advanced 0% to 38%, intermediate 0% to 46%, beginner 0% to 39%; Engine advanced 0% to 31%, intermediate 0% to 60%, beginner 0% to 44%; Hybrid 97 to 100% to 100%. Engine complements that remain are 2 rounds and about 7 minutes unless the main block is insufficient and neither hard nor Low Energy (61 cases carry a complement above 8.5 minutes, all of them below-sufficient main blocks at moderate effort).

30-minute sessions: 100% main only (was 89%), median 25.0 min elapsed, 11.1 active.

The old "inside the preferred duration band" metric is superseded by design: 30 percent of 60-minute sessions now end between 40 and 45 minutes because the main block was sufficient or substantial and the preparation caps were reached.

## 4. The named cases (full BEFORE / AFTER in the pack)

- D2 (advanced, Irritated, Circuit, build strength): before, 6-round circuit + 10 x 40/20 SkiErg + rope finisher (25.5 active, 55.6 elapsed). After, the same 6-round circuit + the rope finisher only (18.8 active, 48.4 elapsed). The complement went because the main block is sufficient (27.8 vs 21 / 32) and one secondary element is the maximum; the finisher stayed because Irritated selected `direct_finisher` and the main block is RPE 7 to 8, not hard. Keeping neither would also have been valid; the rule kept the one with a State purpose.
- B15 (Amped, advanced Hybrid): one block, 4 x 950 m Row with four alternating stations, unchanged from the Hybrid correction; the legacy 7 x 800 m fixture sits beside it.
- D1 (beginner, Amped Hybrid): one block, 4 rounds, 36-minute block, 48 elapsed, no closer.
- C1 (Low Energy + Amped Hybrid): one block, 4 rounds x 600 m Row with three stations, 46.5 minutes elapsed; the 6-minute SkiErg closer from the previous pass is gone (substantial, 34.1 vs 16.2 / 24.3).
- W1 to W3 (advanced Circuits): W1 EMOM 6 rounds stands alone (sufficient, 28.2); W2 timed 45/15 x 6 at RPE 7 to 8 keeps a 6-minute bike piece (lower-sufficient, no engine in the circuit); W3 Bored keeps a short ladder (change of stimulus).
- W4 to W6 (intermediate Circuits): W4 timed 5 rounds + a 6-minute bike piece (lower-sufficient, 3 engine minutes in the circuit); W5 Irritated timed 5 rounds at RPE 8 to 9 + nothing (hard main block); W6 Stressed 6 fixed rounds + nothing.
- W7 to W9 (Engines): W7 advanced pyramid 20 engine minutes at RPE 7 to 8 stands alone; W8 Amped intermediate long intervals stand alone; W9 beginner Low Energy 6 x 2:30 keeps an 8-minute steady second modality (sustainable minutes, Low Energy).
- B14 (hard Amped Circuit, advanced): 6 rounds at RPE 8 to 9, 282 loaded reps, main only, finisher skipped ("hard main block").
- B11 (Irritated Circuit, intermediate): timed 5 rounds at RPE 8 to 9, main only (was + engine intervals).
- B8 (Bored Circuit, advanced): main + a 4-minute couplet ladder (was + ladder + finisher).
- B5 (Stressed Circuit): 5 fixed rounds, main only (was + 7 x 1 min row).
- B1 (Low Energy Engine): 5 x 4 min at RPE 6 to 7 + an 8-minute steady second modality (was + 13:30 steady); label sufficient at the low edge (17.0 vs 16.2), purpose "sustainable extra minutes on a second modality".

Why the final workload is appropriate, in one sentence each: the main block was read as a stimulus, not as minutes; when it was sufficient, one small element with a purpose or nothing was added; when it was hard, nothing was added; the rest of the hour is preparation and downshift, which is how a trainer runs an hour around a 25 to 35 minute piece.

## 5. Human trainer read

48 random 60-minute production sessions (`qa/results/SWEAT_FREEZE_trainer_read_sample.txt`), read as workouts before looking at the labels. My classification: 37 "yes, clearly" (main only, or a modest purposeful addition such as an 8-minute steady flush after a Low Energy circuit), 11 "maybe / optional" (a 2-round 7-minute station piece after 26 minutes of steady rowing; a rope or sled finisher after a 6-round or EMOM main block at RPE 7 to 8), 0 "no, the main block was enough". Two sessions that read as "no" in the first read of this pass (an 18 x 40/20 rope block followed by a 4-round circuit; a Low Energy 4 x 5 min bike followed by a 3-round circuit) were fixed by a rule, not a seed: beside a hard or Low Energy main block the secondary element is always modest, including after State repairs.

## 6. Freeze standard, item by item

1. No systemic two-workouts-in-one: 0 main + complement + finisher; complements beside sufficient, hard or Low Energy main blocks are 2 rounds or 8 minutes or less; hard main blocks carry a complement in 10 percent of cases (all insufficient short-interval blocks, modest).
2. Hybrid remains fixed: 100 percent one block at 30 and 60 minutes, closer in 4 of 304.
3. Engine complements are purposeful, not automatic: 31 to 60 percent main only by level; every kept complement logs its purpose.
4. Hard Circuits stand alone: finisher after a hard main block 0; B14 and W5 in the pack.
5. Advanced is not more volume: advanced 60-minute median elapsed 47.7, main only 72 percent overall (was 54).
6. Amped does not stack: one expression (harder, denser or extra round), finisher only when the main block is not hard and no complement exists (Amped finisher 2 to 3 percent).
7. Complements and finishers earn their place: purposes listed in section 2, printed in the block instructions.
8. Main + complement + finisher: 0 of 1,968.
9. Budgets safe: 9 small open violations of 1,968, none above a level ceiling by more than 6 impact contacts or 30 seconds of engine time.
10. State behaviour differentiated: gate Low Energy 99.0, Stressed 98.4, Bored 96.0, Irritated 95.9, Amped 99.0 percent (Bored and Irritated gave up two to three points because a finisher or a second block is no longer a free realization vector, which is the intended trade).
11. No-State workouts are good: A1 to A6 and W1, W4, W7 in the pack.
12. A trainer reading only the workout: section 5.

## 7. Launch blockers

None systemic. Two things to know, not blockers: 30 percent of 60-minute sessions end at 40 to 45 minutes by design and the app's duration display ("40 to 45 min") reflects that; Bored on a beginner Engine session realizes through the complement or the modality only, so Bored's gate sits at 96 percent.

## 8. Freeze

Sweat is frozen. Do not reopen for State percentages, duration fill, variety or theoretical optimization. Athletic is next, in a separate pass.
