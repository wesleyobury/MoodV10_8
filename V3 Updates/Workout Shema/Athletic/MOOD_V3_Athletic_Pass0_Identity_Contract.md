# MOOD V3 Athletic · Pass 0: Direction Identity and Programming Contract

**Status: APPROVED by the founder (with the decisions and refinements below). Pass 1 (archetypes and structures) builds on this.**

## Founder decisions (approved)

| # | Decision |
|---|---|
| D1 | Athletic Strength is dropped as a standalone archetype. "Athletic strength" remains a subordinate support layer after the defining speed / power / agility / coordination work. A non-explosive Strength-style compound can never be the protected primary. |
| D2 | Athletic conditioning (repeat speed / repeat power) is a quality-capped block type, not an archetype at launch. It is Athletic only while output quality governs the block; if fatigue or clock completion governs, it has crossed into Sweat. |
| D3 | Quality stop = standardized prescription / cue text in V3. No item-schema change. Every primary and secondary Athletic exposure carries a movement-appropriate quality-stop instruction. |
| D4 | The exposure-block density ceiling (about 35% active work) is the starting hard rule, tunable in Pass 1 if real structures expose a legitimate problem. The ground-contact numbers are NOT adopted. Principle adopted instead: impact exposure is capped by experience AND impact severity; the rule is designed in the library / build pass against the actual exercise universe and `impact_level`. |
| D5 | Identity approved: Strength = load / reps / RIR govern the work; Sweat = clock / round / output accumulation govern the work; Athletic = movement / output quality governs the work. The "what ends the set?" test and AC10 are kept. |

**Intent refinement (founder).** Every primary Athletic exposure is performed with **high intent appropriate to the drill while preserving movement quality**.
- Power, jumps, throws, sprints and explosive lifts use maximal or near-maximal intent where appropriate.
- Agility, deceleration, coordination, reaction and beginner skill acquisition put precision and mechanics first. Speed, complexity and intent rise only while quality stays high.

Athletic is not synonymous with max-effort power training.

**Taxonomy caution (founder).** The protected-primary concept includes power, speed, agility, coordination, reaction and locomotion skill, even where ET fields do not yet represent those categories well. The taxonomy is not changed now; representation gaps are listed in Pass 1.

---

*Original Pass 0 proposal follows, with the intent wording corrected per the refinement above.*

**Scope.** This pass defines what makes a workout unmistakably Athletic. It then pressure-tests that definition against the frozen Strength and Sweat systems.

**Out of scope.** It deliberately does not:

- propose archetypes, workouts, structures or library additions;
- change Strength or Sweat.

**Sources read.** Frozen, unchanged:

- WA FINAL_FREEZE v16, including its four draft Athletic archetype sheets, WORKOUT STANDARDS, PRESCRIPTION BANDS and PROGRESSION;
- SD FINAL_FREEZE v5 (State behavior, arbitration, dial binding);
- ET FINAL_FREEZE v11 (explosive, forceful_safe, precision_required, impact_level, movement_pattern);
- Strength Library v11;
- Sweat FINAL FREEZE v4.

---

## 1. The definition

**Founder definition (kept as the root):**
Athletic = train the ability to produce and control high-quality force, speed, power and movement, while preserving output quality.

**Proposed operational form (what the generator and validator enforce):**
An Athletic workout exists to make the user **faster, more powerful, more agile and better coordinated**. Every primary exposure is performed with **high intent appropriate to the drill while preserving movement quality**: maximal or near-maximal for power, jumps, throws, sprints and explosive lifts; precision-first, with speed rising only while quality holds, for agility, deceleration, coordination, reaction and beginner skill work. **Output quality is the currency**: fatigue is a cost to manage, never the stimulus being sought.

The one-line test that separates the three Directions is **what ends the set**:

| Direction | What the user is chasing | What ends a set or bout | What progresses |
|---|---|---|---|
| **Strength** | How much force (load) | Reaching the prescribed reps at the target RIR | Load and reps at a target RIR |
| **Sweat** | How much work, repeated | The clock or round ends; fatigue accumulates by design | Output, duration, density, pace |
| **Athletic** | How fast, how high, how far, how well | **Quality drops** (speed, height, distance or mechanics), or the planned small dose is done while quality is still high | Quality of output first (speed, height, distance, complexity), volume last |

If the workout would still make sense when the user grinds through slowing reps, it is not Athletic.

---

## 2. Markers of an unmistakably Athletic workout

A session is Athletic when all six hold:

1. **The main work is a speed, power, agility or coordination exposure.** The protected primary is a jump, throw, sprint, bound, change of direction, reactive drill or explosive lift. It is never a heavy strength lift or a conditioning block.
2. **Intent is high and appropriate to the drill.** Power, jump, throw, sprint and explosive-lift reps are maximal or near-maximal ("move it as fast as possible", not "hit 10 reps"). Agility, coordination, reaction and beginner skill reps are precision-first, with speed added only while quality holds.
3. **Doses are small and recovery is generous.** Primary sets are short (about 1-6 reps, or about 10 s or less of work) with rest sized to restore output. Longer rest is correct, not wasted time.
4. **There is a quality stop rule.** A set ends, or the plan adjusts, when speed, height, distance or mechanics fall off. Nothing is pushed to fatigue.
5. **Power and speed come before fatigue.** The primary exposure comes first after the warm-up. Support work follows and stays subordinate.
6. **Progression is measured in quality.** The user progresses by getting faster, jumping farther, throwing harder or handling a harder drill, not by grinding more reps or shortening rest.

---

## 3. Pressure test against Strength

The risk is **"explosive Strength"**: a normal strength session with a few jumps on top, or heavy lifts relabelled as athletic.

| Case | Verdict | Why |
|---|---|---|
| Trap-bar deadlift 3 × 5-6 at about 2 RIR as the main lift | **Strength** | Load-limited and RIR-governed; it progresses by load. It can appear in Athletic only as subordinate support. |
| Box jump 4 × 3 with full rest, then trap-bar deadlift 3 × 5 | **Athletic**, if the jump is the protected primary and the lift is capped support | The session's reason to exist is the jump. The lift supports it. |
| Push press or KB swing for 3 × 8 at a moderate load, logged by load | **Strength** (or Sweat if on a clock) | Explosive movement, but the prescription is load and reps. |
| Push press or KB swing, 4 × 3 at a load that keeps the bar fast, rest 90 s, stop if it slows | **Athletic** | Same exercise; the prescription is velocity-first. |
| Rear-foot elevated split squat 3 × 8 / side | **Strength-like support** | Legitimate in Athletic only as unilateral support, never as the defining work. |

**Rules this implies:**

- **S-1.** The Athletic protected primary must be an explosive, speed, agility or coordination exposure. In existing ET terms: `explosive = TRUE`, or `movement_pattern ∈ {jump, throw, sprint}`, or an agility / locomotion drill. A non-explosive compound can never be the protected primary.
- **S-2.** Strength support is capped and subordinate:
  - it comes after the primary work;
  - it is prescribed at 2-3 RIR;
  - its working sets never outnumber the power / speed exposures;
  - it is never protected.
- **S-3.** Explosive lifts (swings, cleans, push press, snatches) count as Athletic exposures only when prescribed velocity-first: low reps, a load chosen to keep speed, generous rest and a quality stop. Otherwise they are support.
- **S-4.** An Athletic session with its power / speed exposures deleted must not still read as a complete Strength session. If it does, the support layer is too big.

---

## 4. Pressure test against Sweat

The risk is **"high-intensity Sweat"**: sprints, jumps and slams done as repeated work under a clock.

| Case | Verdict | Why |
|---|---|---|
| 10 × 30 s sprint / 30 s easy at RPE 9 | **Sweat** | Repeated output under accumulating fatigue; the clock limits it. |
| 6 × 10-20 m accelerations with full walk-back recovery (60-90 s) | **Athletic** | Short, max intent, output restored between reps. |
| Box jumps 10 per round inside a circuit | **Sweat** (already frozen that way) | Repeated work, fatigue accumulates. |
| Box jumps 4 × 3, step down, full reset, 90 s rest | **Athletic** | Height and landing quality are the point. |
| Med-ball slams 12 per round | **Sweat** | Conditioning rounds. |
| Med-ball slams or throws 4 × 4, rest 60-90 s, stop when they slow | **Athletic** | Low-rep, maximal intent. |
| Repeated sprints 8 × 6 s with 54 s rest ("repeat-speed") | **Boundary case**: Athletic only if a quality floor governs it | Legitimate athletic conditioning, but it slides into Sweat the moment reps continue after speed drops. |

**Rules this implies:**

- **W-1.** Athletic primary and secondary exposure blocks carry a **density ceiling**, the mirror image of Sweat's density floor.
  - Sweat's primary block must be at least 60% active work.
  - An Athletic power / speed block must be mostly recovery: **proposed ceiling 35% active work**, using the Sweat time model.
  - Examples: a jump set of 4 × 3 with 90 s rest is about 10% active; light med-ball throws of 3 × 10 with 60 s rest are about 20%.
- **W-2.** No clock-driven structure on primary exposures: no AMRAP, no For Time, no Sweat-style rounds.
  - EMOM keeps the WA condition: at most 20 s of work per minute, support or secondary work only.
  - Intervals are allowed only for speed work with recovery that preserves output.
- **W-3.** **Athletic conditioning (repeat power / speed) is allowed only under a quality floor.**
  - Short max-intent bouts (about 10 s or less).
  - Work-to-rest of roughly 1:4 or longer.
  - The set or block ends when output drops meaningfully (for example about 10% slower, lower or shorter), even if reps remain.
  - Density rises only while quality holds.
  - Without the floor it is Sweat.
- **W-4.** No finisher by default, and never a fatigue-first finisher. This is already in WA; it stays hard.

---

## 5. Contract rules (proposed; validator-enforceable where noted)

These mirror what made Sweat reliable: a small set of hard rules that the generator must satisfy and the validator can check.

| # | Rule | Enforceable with existing fields? |
|---|---|---|
| **AC1 Primary identity** | Protected primary = explosive / speed / agility / coordination exposure (S-1). It is always the first work after the warm-up. | Yes (`explosive`, `movement_pattern`, block order) |
| **AC2 Intent and dose** | Primary exposures: high intent appropriate to the drill (max / near-max for power, jumps, throws, sprints and explosive lifts; precision-first for agility, coordination, reaction and beginner skill work), about 1-6 reps or 10 s or less per set. Light ballistics (med-ball, light KB) may go up to about 8-12 reps while velocity holds, per the WA programming note. | Yes (rep / time targets, `impact_level`, load class) |
| **AC3 Recovery preserves output** | Rest on primary / secondary exposures sized to restore quality (bands already in WA: 90-180 s primary, 60-120 s secondary). Density ceiling on those blocks (W-1). | Yes (reuse Sweat's time model, inverted) |
| **AC4 Quality stop rule** | Every primary and secondary exposure carries a stop / adjust instruction: end the set when speed, height, distance or mechanics drop. | **Partly**: needs a prescription field or a standard cue (decision D3) |
| **AC5 Support is subordinate** | Strength / support sets never outnumber power / speed exposures, sit at 2-3 RIR, come after the primary work and are never protected (S-2). | Yes |
| **AC6 No fatigue-first work** | No AMRAP or For Time. No circuit or EMOM on primary work. No pre-fatigue before power. No default finisher (W-2, W-4). | Yes |
| **AC7 Landing / impact budget** | Impact exposure is capped by experience AND impact severity (D4). The numeric rule is designed in the library / build pass against the actual exercise universe and `impact_level`; no contact numbers are fixed now. High-impact items are gated by experience. | Designed later (D4) |
| **AC8 Progression by quality** | Progress speed, distance, height, velocity at a given load, or drill difficulty first; volume last. Never shorten rest to progress. | Yes (progression basis, as in Sweat SC5) |
| **AC9 Skill belongs here** | Unlike Sweat, precision / technical movements (`precision_required = TRUE`) are welcome in Athletic when the user is fresh and the experience gate allows them. They are never done under fatigue. | Yes |
| **AC10 Direction integrity test** | Delete the power / speed exposures: the remainder must not be a complete Strength or Sweat session (S-4). Delete the support: the remainder must still be recognizably Athletic. | Yes (composition check) |

**States.** The frozen SD v5 already describes Athletic correctly and needs no new dials:

- **Low Energy:** simpler jumps and throws with stable support, fewer exposures and the same crisp intent. It never becomes a recovery session.
- **Stressed:** predictable, familiar drills.
- **Bored:** reactive, combination and novel coordination drills.
- **Irritated:** throws, slams, jumps and short hard accelerations, done at max intent with full rest.
- **Amped:** one extra quality exposure. Rest is never compressed until power fails.

The contract above is what makes those descriptions enforceable.

**Beginners.** Athletic stays quality-first rather than becoming easy conditioning:

- landing mechanics, low-amplitude jumps and hops, skips, med-ball throws and simple accelerations;
- conservative contacts;
- no advanced complexes.

---

## 6. Same exercise, three Directions

| Exercise | Strength | Sweat (frozen) | Athletic |
|---|---|---|---|
| Box jump | not used | 10+ reps inside rounds | 4 × 3, step down, full reset, stop if height drops |
| KB swing | 3 × 12 at ~2 RIR, load progresses | 15 reps per round on the clock | 4 × 5 at a load that keeps the hips snapping, 60-90 s rest |
| Med-ball throw / slam | not used | 12 slams per round | 4 × 4 max-intent throws, 60-90 s rest |
| Sprint | not used | 30 s hard / 30 s easy × 10 | 6 × 10-20 m accelerations, full walk-back |
| Sled push | not used | 20 m per round, heavy and steady | 4 × 10 m at max speed with a light sled, full rest |
| Trap-bar deadlift | 3 × 5-6 at ~2 RIR, protected primary | not used | Support only: 3 × 3-5 at ~2-3 RIR after the power work, or jump-trap-bar at light load for speed |

---

## 7. Audit of the existing WA v16 Athletic drafts

WA v16 already carries four Athletic archetype sheets: Power + Explosiveness, Speed + Agility, Athletic Strength and Full-Body Athlete. They are marked "freeze candidate", with slots, prescription bands and allowed structures.

Sweat showed that the WA drafts were the right starting vocabulary but not the right architecture: the four drafted Sweat archetypes became Engine / Circuit / Hybrid. The Athletic drafts should be tested against the identity before any of them is kept.

| Draft | Against the identity | Finding |
|---|---|---|
| **Power + Explosiveness** | Passes | The protected primary is explosive (jump / throw). The canonical example (box jump 4 × 3-5, 90 s) is exactly Athletic. The strength slot is required but correctly subordinate. |
| **Speed + Agility** | Passes, with a practicality risk | The primary is sprint / locomotion. It depends on space (lane / turf / track). The commercial default has `lane` but no track or turf. Needs a gym-realistic expression before it can be relied on. |
| **Athletic Strength** | **Fails as drafted** | Its protected primary is a non-explosive compound (the canonical example is trap-bar deadlift 3 × 5-8 at 2 RIR). Power support is only "default". That is explosive Strength by this definition (S-1, AC1, AC10). It either needs re-scoping so a power / speed exposure is the protected primary, or it should not exist as an Athletic archetype. **Decision D1.** |
| **Full-Body Athlete** | Passes if the power / speed primary stays protected | Risk: with a required compound strength slot, a required complementary pattern and a core slot, it can read as "Full Body Strength plus a jump". AC5 and AC10 are what keep it Athletic. |

**Other WA settings to recheck in the next pass:**

- Structures allow "Intervals: sprints / agility / repeated power" without a quality floor. W-3 should be attached.
- Complexes are "allowed", which fits Athletic only for advanced users when fresh.
- The Athletic Performance band ("2-6 reps or 5-12 sec, 90-180 s, stop before quality drops") already matches this contract.

---

## 8. The candidate territories, tested

The territories below are for orientation only; none is locked as an archetype.

| Territory | Unmistakably Athletic? | Main risk | Note |
|---|---|---|---|
| **Power / explosiveness** (jumps, throws, explosive lifts) | Yes | Drifting into loaded strength work (S-3) | Strongest and most gym-feasible territory. |
| **Speed / agility** (acceleration, change of direction, footwork, reaction) | Yes | Space and equipment in a commercial gym | Needs a lane-based and treadmill / sled-based expression. |
| **Athletic conditioning** (repeat speed / power) | Only with the quality floor (W-3) | Becoming Sweat | Highest-risk territory. It may work better as a quality-capped block type used inside other Athletic sessions than as its own archetype. **Decision D2.** |
| **Athletic strength** (unilateral, multiplanar, trunk, "strong and fast") | Only as support | Becoming Strength | See D1. |

---

## 9. Readiness facts that will matter later (flag only, no action now)

- **The library is thin for Athletic.**
  - Strength Library v11 has 196 exercises. Only 5 are tagged explosive (push press, KB swing, KB clean and press, DB clean to press, DB snatch).
  - None has a jump, sprint or throw pattern.
  - There are 0 Athletic eligibility rows (all 2,080 rows are Strength).
  - The Sweat additions contribute some jump / throw items (box jump, skater hops, jump squat, med-ball slam, burpee), but as conditioning work.
  - ET sets a density target of 6+ explosive options per Athletic archetype.
  - A library pass will be needed after the identity and archetypes are settled; it is not part of this pass.
- **Space is a design constraint.** Speed and agility need a lane at minimum. `lane` is in the WA default space; track and turf are not.
- **The schema may need one field** for the quality stop rule (D3). The item object is locked in WA, so this is a real decision rather than a detail.

---

## 10. Founder decisions requested

| # | Decision | Recommendation |
|---|---|---|
| **D1** | The Athletic Strength draft: re-scope so a power / speed exposure is its protected primary, or drop it as an archetype and keep "athletic strength" as the support layer. | Drop as an archetype; keep as support. It is the draft most likely to blur into Strength. |
| **D2** | Athletic conditioning: its own archetype, or a quality-capped block type available inside Athletic sessions. | Block type first. Promote it only if it holds its identity under the quality floor. |
| **D3** | Quality stop rule: a new prescription field on the item (for example a stop condition), or a standard cue text on every primary / secondary exposure. | Standard cue text for V3 (no schema change); a field later if tracking velocity or height becomes real. |
| **D4** | Adopt the density ceiling (W-1, proposed 35%) and the landing / contact budget (AC7) as hard validator rules. | Adopt both; tune the numbers in the build pass. |
| **D5** | Confirm the operational definition in §1 and the "what ends the set" test as the Athletic identity. | Confirm. |

**Next step after approval.** The archetype and structure pass, starting from this contract and the WA drafts as input. Library and workouts come after that.
