# MOOD V3 Athletic: Final Cleanup, Regression QA and Freeze

**Athletic is frozen: `ENGINE_PHASE = '3.4-athletic-frozen'`, engine version `athletic-frozen-v4`.**

**Checks:**
- Strength and Sweat source files are unchanged since base, and their frozen parity tests pass.
- Tests: 181 passed, 3 skipped. Unified QA: 0 failures.
- State Satisfaction and Coherence: 100% for every State.

**Review material:**
- `V3 Updates/MOOD_V3_Athletic_Founder_Review_Pack.md` / `.xlsx`: 20 production sessions.
- The freeze record and baselines are in `backend/mood_v3/qa/results/`, starting with `ATHLETIC_FREEZE.md`.

## 1. What changed in this pass (cleanup only, no redesign)

**Truthful accounting.**
- Sprint exposures and sled efforts are now counted separately (with metres for each).
- Jump contacts, high-impact contacts, throws, Olympic-derivative sets and total explosive sets stay separate as well.
- Sprints and sled pushes share only the internal acceleration budget; they are no longer reported as the same thing.
- Built for Today now says "3 sled pushes" rather than "3 sprint efforts".
- The State and Amped wording lists "sled pushes" separately from "sprints".
- A sled-led primary block is titled "Primary Power" rather than "Primary Speed".

**Honest quality metadata.**
- The session's qualities are a distinct, ordered list (`athletic_qualities`), and secondary and tertiary quality come from that list, so they can never repeat.
- Two exercises for the same quality are still allowed when programming justifies it. The second is titled "Athletic Element · <quality>", never "Secondary Quality", and Built for Today says "for more upper-body power".
- The selection penalty for a repeated quality is stronger, so it is rare (23 of 882 grid sessions).

**Low Energy strength.**
- When Low Energy has 2 strength exercises, each is capped at 2 sets.
- Low Energy now has less strength volume than the same day without a State, not more (−0.8 sets on average; it was +1.2).

**Built for Today difficulty line.** The advanced line now names athletic work, not strength support (it had said "demanding movements such as Bulgarian Split Squat").

**Cleanup.** A dead State flag was removed. A final audit script was added (`qa/athletic_final_audit.py`).

**Not changed:**
- The movement budget, cost tiers, targets and Olympic weighting.
- The State architecture, and Strength and Sweat.
- There is no requirement for 4 movements, and no filler. An optional low-cost fourth movement already exists within the budget and was not made systematic.

## 2. Audits

**Classification.**
- The `ATHLETIC` (59), `ATHLETIC_STRENGTH` (32) and `SUPPORT` (9) vocabularies do not overlap.
- Front Squat, Back Squat, conventional Trap-Bar Deadlift, RDL, Bulgarian Split Squat and Goblet Squat are all `ATHLETIC_STRENGTH`.
- The Speed variants, pops, split jumps, muscle-ups, sprints, sled and throws are all `ATHLETIC`.
- In the grid: 0 strength exercises labelled athletic and 0 carries (carries remain in the master library).

**New variants.** All sensible, with no duplicate records:

| Exercise | Min level | Impact | Cx | Tier | Dose | Swap family |
|---|---|---|---|---|---|---|
| Explosive Step-Up (Pop), bodyweight | beginner | moderate | 1 | C | 3 × 4/side, 90 s | step_up_pop |
| Dumbbell Step-Up with Pop | intermediate | moderate | 2 | B | 3 × 3/side, 90 s | step_up_pop_loaded |
| Reverse Lunge to Knee-Drive Hop | beginner | moderate | 2 | B | 3 × 3/side, 90 s | lunge_hop |
| Split-Squat Jump | intermediate | moderate | 2 | B | 3 × 3/side, 90 s | split_jump |
| RFE Split Squat Jump | advanced | moderate | 3 | B | 3 × 3/side, 90 s | rfe_split_jump |
| Band-Assisted Muscle-Up | intermediate | low | 3 | B | 3 × 3, 120 s | muscle_up (shared with Bar Muscle-Up) |
| Bar Muscle-Up | advanced | low | 4 (one high-skill slot) | B | 3 × 2, 120 s | muscle_up |
| Speed Trap-Bar Deadlift | intermediate | low | 3 | B | 4 × 2 at about 50%, 90 s | shares the deadlift family, so it never sits beside a normal Trap-Bar Deadlift |
| Speed Box Squat | intermediate | low | 3 | B | 4 × 3 at about 50%, 90 s | shares the back_squat family |

**Olympic pool** (only lifts the library supports):
- **Intermediate:** Push Press, Hang High Pull, DB Hang Power Clean, KB Snatch, Hang Clean to Box Knee Drive.
- **Advanced:** all of those, plus Hang Power Clean, Power Snatch, Split Jerk and DB Snatch.
- **Beginner:** none.
- The library has no Hang Clean, Power Clean, Push Jerk or Hang Snatch, so they are not programmed and none were added.

Frequency is unchanged. With no State:

| Level | Share of sessions with an Olympic derivative |
|---|---|
| Intermediate | Athleticism 25%, Build Strength 28% |
| Advanced | 21 to 37% by goal |

## 3. Broad regression

**Grid:** 882 builds across level, 30 and 60 min, 6 goals, 14 State sets (including multi-State) and 4 soreness regions, plus the 1,404-session State grid.

**Every check came back 0:**
- validator failures
- power after strength
- high impact below advanced
- Tier A or cost over budget
- carries
- strength labelled athletic
- sprint or sled accounting mismatches
- duplicate quality metadata
- Built for Today mismatches on sprint efforts, sled pushes, landings or carries
- beginner too advanced (no Olympic lifts, reactive jumps or muscle-ups, complexity 2 or less)
- 30-minute sessions over 3 exercises
- State gate or coherence failures

**Other results:**
- **Soreness:** every region builds safely, with 2.4 to 2.6 athletic movements on average.
- **History:** over 8 consecutive days, the same primary exercise never repeats, the same primary quality repeats 10% of the time, and 2% of exercises overlap with the previous day.
- **Different Workout:** 12 of 12 changed.
- **Swap:** 50 of 52 valid, 2 honest "no alternative"; a swap never raises cost tier or impact.
- **Duration:** the 60-minute median is 42 min (177 sessions under 40, 211 at 40 to 50, 53 at 50 to 57). There is no padding; prep only extends when a session would be under 30 min. The 30-minute median is 26 min.

**State regression** (change against the same user's no-State session, 60 min, intermediate and advanced):

| State | What changes |
|---|---|
| Low Energy | −1.2 athletic movements (to 2), −3.4 explosive sets, −11 contacts, −4.4 intent, simpler (−0.6 complexity), −0.4 Tier A, −0.8 strength sets, strength 1 rep further from failure |
| Amped | Same count and structure; +0.6 explosive sets, +0.8 intent, slightly more demanding variation, strength 1 rep closer to failure. No filler (exercise count −0.04) |
| Bored | +0.34 novelty, about 2.7 exercises changed, same count |
| Irritated | +1.2 forceful movements, fewer landings |
| Stressed | Simpler (−0.6 complexity, −0.5 Tier A), −1.4 strength sets, still 2 to 3 athletic movements |

Multi-State combinations follow the owning State; see the audit file, section 5.

## 4. Composition (60 min, no State, 120 per level)

| Level | 1 / 2 / 3 / 4 athletic | Mean ATHLETIC | Mean ATHLETIC_STRENGTH | Median explosive sets | Est. min |
|---|---|---|---|---|---|
| Beginner | 0 / 82 / 18 / 0% | 2.18 | 1.86 | 7 | 36 |
| Intermediate | 0 / 8 / 78 / 14% | 3.07 | 1.22 | 10 | 43 |
| Advanced | 0 / 3 / 52 / 45% | 3.42 | 1.22 | 13 | 49 |

## 5. Human trainer read (30 random 60-minute sessions, seed 2029)

All 30 were built; there were no conflicts in this sample.

1. **Does it unmistakably look like Athletic training?** Yes for 27. Borderline for 3: T12 and T14 (intermediate days where the sampled target was 2 athletic movements plus 2 strength) and T27 (a beginner day led by a rotational throw, then DB push press, step-up and row).
2. **Does athletic movement dominate?** Yes for 22. In the other 8 it is level by design, 2 athletic movements and 2 short strength exercises. These are beginners, Low Energy days (T04, T15, T28, T29) and those intermediate target-2 days. It is never outweighed.
3. **Is the explosive work reasonable?** Yes for all 30: 6 to 13 explosive sets, low reps, 60 to 150 s rest. The heaviest are advanced plyometric days such as T01 and T17 (Drop Jump, a sprint or sled, Alternating Bound or a throw), which sit inside the impact and intent ceilings and read as a demanding but legitimate advanced session.
4. **Is strength clearly supporting?** Yes for all 30: 1 strength exercise at 3 to 4 sets, or 2 short ones.
5. **Would a performance coach prescribe the whole session?** Yes for 30. The least distinctive (T27) is still a sensible beginner session.

No systemic defect appeared, so the engine was not tuned for these subjective cases.

## 6. Freeze standard

| Condition | Status |
|---|---|
| Automated QA green | Yes |
| Strength and Sweat untouched | Yes |
| Accounting truthful | Yes |
| Duplicate quality metadata fixed | Yes |
| States coherent | Yes, 100% |
| Athletic identity strong | Yes |
| No systemic programming defect | Yes |
| Founder pack at least as good as the approved one | Yes |

**Athletic is frozen.**

## 7. Known non-blocking imperfections (post-launch iteration)

1. **Intermediate "target 2" days:** about 8% of intermediate days with no State produce 2 athletic + 2 strength. They are athletic-led but the least distinctive.
2. **Beginner feel-better days** can lead with a med-ball throw instead of a jump or start.
3. **Rotational med-ball throws and landmine rotational work** are the most common secondary movements.
4. **Olympic variety** is limited to the 9 derivatives in the library (no Hang Clean, Power Clean, Push Jerk or Hang Snatch).
5. **Speed-strength lifts** are occasional and use a load and speed proxy (no velocity tracking).
6. **Media is needed** for the 8 identity-pass exercises and Hang High Pull.
7. **The dev fixture JSON** in the frontend still shows "Speed + Agility" (display only). The picker label is "Speed + Plyo".
8. **Swap:** 2 of 52 swaps return an honest "no alternative".
9. **Low Energy at 30 minutes** is sometimes a single athletic movement plus concise strength (4% of all 30-minute sessions).
