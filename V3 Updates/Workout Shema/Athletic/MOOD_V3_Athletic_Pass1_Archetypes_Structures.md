# MOOD V3 Athletic · Pass 1: Archetype and Structure Design

**Status: APPROVED (F1 to F6), with three founder corrections applied (below). The archetype architecture is closed.**

## Pass 1 corrections (founder, applied in this document)

| # | Correction |
|---|---|
| C1 | **Support is `default`, not `required`.** Exposures alone must be able to form a complete Athletic session. 60 min: normally 1 to 2 support exercises, omitted when the exposures already make a complete session or when State, soreness, equipment or duration make support unnecessary. 30 min: 0 to 1. Speed + Agility may consist entirely of speed / agility / coordination exposures. Support is never added to fill time. All support caps stay hard maximums. AC10 unchanged. |
| C2 | **Full-Body Athlete distinctness broadened.** It must span at least two materially distinct Athletic qualities (for example power + speed, power + agility, speed + upper-body power, jump + rotational throw + coordination). At 60: lower-body plus upper-body or rotational exposure, unless soreness makes that impossible. Power + Speed stays the preferred broad composition when feasible, not a hard requirement. Trivial variants of one quality do not count. Power and Speed + Agility keep their stricter family rules. |
| C3 | **The QC 8-minute cap is authoritative.** Bout count must fit the actual time model (work, programmed recovery, between-set rest). Normal range about 4 to 8 total bouts; more only when the real prescription stays within 8 minutes. Recovery is never shortened to fit bouts. |


**Out of scope.** This pass does not:

- build workouts;
- implement a generator;
- build the library;
- change the item schema or the taxonomy;
- change Strength or Sweat.

**Builds on** the approved Pass 0 (identity, D1 to D5, intent refinement).

**Governing identity.** Athletic = movement / output quality governs the work. *What ends the set?* Quality dropping, or a small planned dose completed while quality is still high.

**Frozen sources used as inputs:**

- WA FINAL_FREEZE v16, including the four draft Athletic sheets, PRESCRIPTION BANDS, WORKOUT STANDARDS and PROGRESSION;
- SD FINAL_FREEZE v5;
- ET FINAL_FREEZE v11;
- Strength Library v11;
- Sweat FINAL FREEZE v4.

---

## Summary

- **Three archetypes:**
  - **Power + Explosiveness** (`athletic_power`);
  - **Speed + Agility** (`athletic_speed_agility`);
  - **Full-Body Athlete** (`athletic_full_body`).

  Each has a different protected primary, a different secondary requirement and a different space footprint. The IDs are the ones WA v16 already uses, so routing, cold start and the schema keep working.
- **Dropped:**
  - Athletic Strength becomes the support layer (D1).
  - Athletic Conditioning becomes a quality-capped block type (QC) available inside all three (D2).
- **One block grammar for all three archetypes:** Warm-up, Primary exposure (PX), Secondary exposure (SX), optional third exposure (SX2) or QC, Support, optional Trunk, Downshift.
- **The support cap is strengthened.** The rule "support sets never outnumber exposure sets" is not enough on its own. The WA v16 canonical Power example passes it (8 exposure sets vs 6 support sets), yet support is **55% of the working time**. New rule: Athletic exposure blocks must be **at least 55% of working time**, plus exercise and set caps on support.
- **Density ceiling 35% holds.** Across the 13 skeletons in section 13, the most work-heavy exposure or QC block is 29% active.
- **Speed + Agility is gym-feasible** in two space tiers:
  - a lane (10 to 20 m) for full expression;
  - a 5 m floor space for short-space speed.

  It is never done on a treadmill.
- **Library:** about 33 new exercise records plus about 45 reused ones. Eight categories are genuinely new to MOOD (accelerations, deceleration, change of direction, lateral agility, footwork, bounds, rotational throws, reactive).

---

## 1. Proposed archetype architecture

| Archetype | Protected primary (PX) | Required secondary (SX) | Third exposure (SX2, default at 60) | What it feels like |
|---|---|---|---|---|
| **Power + Explosiveness** `athletic_power` | Lower-body or total-body power: vertical / horizontal jump, bound, or explosive lift at speed | A different vector or region: throw (upper / rotational), or the other jump direction | Unilateral jump / hop, explosive lift, or contrast pair (intermediate+) | Jump, throw, move weight fast. Big efforts, full rest. |
| **Speed + Agility** `athletic_speed_agility` | Moving the body fast: acceleration (lane) or short-space acceleration (5 m) | Deceleration, change of direction or lateral agility | Elastic / footwork / coordination (pogos, line hops, lateral bounds, skips, combination drills) | Start fast, stop well, cut, react. Footwork and speed. |
| **Full-Body Athlete** `athletic_full_body` | A power **or** a speed exposure (whichever is feasible and less recent) | An exposure from the **other** family; at 60 the session must also include at least one upper-body or rotational exposure | Coordination / combination, or unilateral | A bit of everything athletic, whole body. The default starter. |

**How the exposure families are defined** (a category concept, not a new taxonomy field; see section 11 for representation gaps):

- **Power family:** jumps, bounds, hops, throws, explosive lifts, loaded jumps.
- **Speed family:** accelerations, sprints (short-space or lane), deceleration, change of direction, lateral agility, footwork, reactive and coordination drills, skips.

---

## 2. Why these three, and why they are materially different

**Alternatives considered:**

| Alternative | Verdict | Reason |
|---|---|---|
| One "Athletic" archetype that rotates qualities | Rejected | The user could not choose power vs speed. History rotation would blur the two, and the drafted Athletic cold-start starter order in WA (Full-Body Athlete → Power → Speed) could not be expressed. |
| Four archetypes: separate Speed and Agility | Rejected for launch | Same space and library constraints for both. In a commercial gym, acceleration and change of direction share the same lane and the same support work. Splitting them doubles the space risk and halves each pool. |
| Split Power into Lower Power and Upper / Throw Power | Rejected | The upper-power pool is very thin (throws, push press, explosive push-up). Lower-body power is what users expect from "power". Upper / rotational emphasis is handled inside Power and Full-Body Athlete when soreness requires it. |
| **Two archetypes (Power, Speed + Agility) and no Mixed** | Viable, not recommended | Loses four things Mixed provides (below). |
| **Three archetypes (recommended)** | Recommended | This is the smallest set that gives users two distinct choices plus a broad default. |

**Why Mixed (Full-Body Athlete) earns its place:**

1. It is the cold-start and MOOD's Pick default. WA already names it as the Athletic starter.
2. It is the right session for **beginners and General Fitness users**: broad, lower technical barrier, no single quality overloaded.
3. It builds in **any gym**: floor only, no lane required, choosing a short-space speed exposure.
4. It is where **Bored** variety lives naturally.

**Keeping them materially different** (checked by the validator, AI-8):

- **Power:** at least 2 power-family exposures; no speed-family exposure required.
- **Speed + Agility:** PX from the speed family and SX from deceleration, change of direction or lateral agility; at least 2 speed-family exposures.
- **Full-Body Athlete (C2):**
  - exposures span at least 2 materially distinct Athletic qualities (distinct `quality` values, Pass 2), never two variants of one quality;
  - at 60, at least 1 lower-body and at least 1 upper-body or rotational exposure, unless soreness makes that impossible (logged);
  - power + speed is the preferred composition when feasible (ranking preference, not a hard rule);
  - support, when present at 60, covers the region the exposures cover least.

---

## 3. Structures and block architecture

### 3.1 Block order (all archetypes)

1. **Warm-up (computed, protected).** 7 to 10 min at 60 and 5 to 7 at 30 (WA). It ends with a short ramp into the day's primary quality: pogos and build-up jumps before power, build-up runs and skips before speed.
2. **PX: primary exposure (protected, required).**
3. **SX: secondary exposure (required at 60 and at 30).**
4. **SX2: third exposure (default at 60, excluded at 30)**, then optionally **QC** (quality-capped conditioning, section 9).
5. **Support (default, C1):** athletic strength; 1 to 2 exercises at 60, 0 to 1 at 30; omitted when the exposures already form a complete session or State, soreness, equipment or duration make it unnecessary. Limits in section 10.
6. **Trunk (optional):** anti-rotation, rotation or carry; usually paired with support.
7. **Downshift (optional, computed).**

Exposures always come before support, apart from the contrast pair (3.2). Nothing fatiguing precedes PX.

### 3.2 Valid structures

| Structure | Where | Rule |
|---|---|---|
| **Straight sets, full reset** | PX, SX, SX2, support | Default for every exposure. Rest restores output. |
| **Speed reps** | PX / SX in Speed and Full-Body Athlete | One rep = one sprint or drill, with a walk-back or timed rest that restores speed. This is the Athletic form of "intervals": rest-governed, never clock-governed. |
| **Cluster sets** | PX, advanced only | E.g. 2 + 2 + 2 with 20 s between clusters, to keep every rep fast. |
| **Contrast pair** | SX in Power, intermediate+, 60 only | A heavy support lift (3 to 5 reps, 3 RIR), about 20 s later a same-pattern explosive (e.g. trap-bar deadlift then broad jump), full rest. The time counts half support, half exposure. |
| **Superset** | Support + support (antagonist or opposite region) or support + trunk | Never includes an exposure. |
| **QC block** | After the exposures, before support | Section 9. |
| **EMOM** | Support or SX only, intermediate+ | WA condition kept: 20 s of work per minute at most, no precision item. Rarely useful; kept, not preferred. |
| **Prohibited** | Everywhere in Athletic | AMRAP, For Time, circuits containing an exposure, finishers by default, ladders, pyramids, drop sets, burnouts. |
| **Complexes** | Not at launch | WA allows them for advanced users. They demand precision under accumulating fatigue and a library we do not have. Recommended to exclude at launch (decision F4). |

### 3.3 Density ceiling interaction

Every PX, SX, SX2 and QC block must be **no more than 35% active work**, using the Sweat time model (active / (active + rest)). Support and trunk are exempt.

The 13 skeletons in section 13 range from **0.11 to 0.29**. The work-heavy end is footwork and line hops (10 s on / 40 s rest = about 0.25 to 0.29). This is where the ceiling will bind, and it binds correctly: 20 s on / 30 s off footwork would be Sweat.

**No tuning needed now.** Recheck in the build pass once real footwork drills exist.

### 3.4 Quality-stop behavior (D3: standardized cue text, no schema change)

Every PX, SX, SX2 and QC item carries one of these cues:

| Category | Standard cue |
|---|---|
| Jumps, hops, bounds | "Max effort each rep. Land soft and quiet. End the set if height or distance drops or landings get loud or wobbly." |
| Throws, slams | "Throw as hard as you can. End the set when throws lose snap or distance." |
| Explosive lifts | "Move the weight fast. End the set if it slows down; pick a weight that stays fast." |
| Accelerations, sprints | "Full effort each rep, full walk-back. End the set if you're noticeably slower or your form breaks." |
| Deceleration, change of direction, lateral | "Clean stops and sharp cuts first. Add speed only while footwork stays controlled. End the set if you slide, round cuts or lose balance." |
| Coordination, footwork, beginner skill | "Smooth and precise first. Speed up only when it looks clean." |
| QC block | "Repeat only while each effort matches your first. When output drops, the block is done, even if reps remain." |

---

## 4. 30- and 60-minute session architecture

| | 60 min | 30 min |
|---|---|---|
| Warm-up | 7 to 10 min | 5 to 7 min |
| PX | 4 to 6 sets (reps) | 3 to 5 sets |
| SX | 3 to 5 sets | 3 sets |
| SX2 | Default | Excluded |
| QC | Optional (duration fill, Irritated, Amped) | Excluded |
| Support (default, C1) | Normally 1 to 2 exercises; hard max 2 exercises / 6 working sets | 0 to 1 exercise; hard max 3 working sets |
| Trunk | Optional, ≤ 1 exercise, ≤ 3 sets, usually paired | Optional, only paired with support |
| Estimated total | About 40 to 50 min (60 is an allowance; see the fill rule) | About 22 to 25 min |
| Exposure share | ≥ 55% of working time | ≥ 55% |

**Duration band (proposed):**

- 60 min: 38 to 55 min;
- 30 min: 20 to 30 min.

Athletic sessions are shorter than Strength sessions by nature: full-rest power work does not fill time the way sets to RIR do. WA already says "60 minutes is an allowance, not a requirement".

**Duration fill, in order.** Stop when the band floor is reached.

1. Raise PX and SX sets to their band maximum.
2. Add SX2 if absent.
3. Add a QC block (intermediate+, not on Low Energy).
4. Add Trunk.
5. Add 1 support set to an existing support exercise, only while support stays within its caps and exposure share stays ≥ 55%. Support is never added (as an exercise) to fill time (C1).

The fill never:

- shortens rest;
- adds a finisher;
- adds a third support exercise;
- adds support to reach a minute count.

---

## 5. Beginner / Intermediate / Advanced behavior

| | Beginner | Intermediate | Advanced |
|---|---|---|---|
| **Intent** | Precision-first on every drill. Power reps are "fast but clean". | Near-max on power, jumps, throws and sprints; precision-first on new agility drills. | Max intent where appropriate; reactive and combination work. |
| **Complexity cap** | 2 | 3 | Library maximum (SD baseline 5) |
| **Impact** | No high-impact items. Jumps onto a box or to a stick, no drop / depth jumps, no single-leg bounds. | Moderate impact; unilateral hops and bounds allowed. | High-impact (drop jumps, hurdle hops) allowed, at most 1 high-impact exposure block per session. |
| **Speed** | 10 to 15 m accelerations from a standing start; planned, shallow cuts at controlled speed. | 10 to 20 m accelerations, pro-agility, lateral agility. | Longer starts (up to 20 to 30 m where the lane allows), combination / reaction drills. |
| **Structures** | Straight sets and speed reps only. No contrast, clusters or QC. | + contrast pair (Power 60), + QC. | + clusters. |
| **Sets** | Exposures 3 to 4 (PX up to 5). Support 2 to 3 sets at 3 RIR. | Exposures 3 to 5; support 3 sets at 2 to 3 RIR. | Exposures 4 to 6; support 3 sets at 2 RIR. |
| **Progression** | Mechanics first, then height, distance or speed. | Quality / output first, then 1 set. | Quality / output, drill difficulty, then contrast or cluster methods. |

Advanced does not mean more volume: the WA rule is kept.

---

## 6. Target behavior

- **Athletic Target = the archetype itself** (WA: Target selects the archetype_id directly; muscle TARGET ROUTING is Strength-only). The user picks Power, Speed + Agility or Full-Body Athlete, or MOOD's Pick.
- **No muscle Targets in Athletic at launch.** "Athletic legs" is not a launch concept. If requested later, it belongs to a post-launch pass.
- **MOOD's Pick:**
  - The cold start follows WA: Full-Body Athlete, then Power, then Speed + Agility.
  - History then rotates, the least recent Athletic archetype winning ties.
  - Space feasibility filters: without lane or floor space, Speed + Agility is infeasible.
- **Soreness** (frozen S-rules apply; the sore primary muscle is always excluded):

  | Archetype | Defining region | Sore lower body |
  |---|---|---|
  | Speed + Agility | Lower body | Explicit Speed: terminal-conflict UX. MOOD's Pick: reroute. |
  | Power | Lower or upper | Builds with an upper / rotational emphasis: throws, explosive push-up, landmine punch-press, upper support (skeleton A13). |
  | Full-Body Athlete | Adapts | Keeps the upper / rotational exposure and uses the non-sore family. |

  Reroute order for MOOD's Pick with sore legs: Power (upper emphasis), then Full-Body Athlete. The reroute is logged.

---

## 7. State behavior (frozen SD v5 dials; no new dials)

| State | Dial effect in Athletic | Programming result | Never |
|---|---|---|---|
| **Low Energy** | Volume −1; Complexity −1; low-systemic / low-impact bias; support Effort +1 RIR | Removes QC first, then 1 SX2 set. Simpler drills (box jumps to a low landing, med-ball throws, planned accelerations), stable support. Exposure intent stays crisp. | Recovery session; longer rest to "take it easy"; dropping the protected primary. |
| **Stressed** | Novelty −1; Complexity −1 | Familiar, predictable drills with fixed distances and fixed rest. No reactive or random-cue drills, no contrast. QC only in a fixed machine format. | Novelty; time pressure. |
| **Bored** | Novelty +2; Engagement +1 | Combination and reactive drills, new vectors (lateral, rotational), contrast pair (intermediate+). PX stays the archetype's quality but may use a novel variant. | Novelty that breaks technique; circuits of exposures. |
| **Irritated** | Forceful-safe bias; Complexity −1; Volume 0 | Slams, throws, light-sled accelerations, jumps, short sprints; KB swings at speed; QC allowed (bike / sled sprints). Straight sets only; simple drills. Max intent with full rest. | Reckless max loads; fatigue-driven technique failure; combination drills. |
| **Amped** | Volume +1; Extras 1; support Effort +1 | +1 set on SX or SX2, and QC as the extra quality exposure. Support may reach its 2 RIR floor. | Compressed rest (SD Direction protection); fatigue finishers. |
| **Sore** | Hard exclusion | Section 6. | Training through a sore primary muscle. |

**Multi-State.** Frozen SD arbitration applies. Two Athletic-specific clamps (logged):

- no State combination may push an exposure block past the 35% density ceiling;
- none may push support past its caps.

---

## 8. Equipment and space feasibility (commercial gym)

**Space tiers** (existing ET `space_requirement` values):

| Space | What it enables | Commercial-gym reality |
|---|---|---|
| `floor_space` (about 5 × 3 m clear) | All power work; throws (with a wall); short-space speed (≤ 5 m starts, decelerations, 5-5 shuttles, lateral shuffles, footwork); skips and coordination in place | Every gym. **Minimum for all three archetypes.** |
| `lane` (10 to 20 m strip: turf, studio, open corridor) | Full accelerations, pro-agility, sled accelerations, repeat 15 m sprints | Many gyms; WA default space already includes `lane`. Unlocks Speed + Agility's full expression. |
| `track`, `outdoor`, large `turf` | Longer sprints | **Not required** anywhere in Athletic at launch. |

**Equipment:**

- **Bodyweight + floor:** enough for a valid session in all three archetypes.
- **Common items that widen options:** plyo box, med ball + wall, kettlebell, dumbbells, trap bar, sled (lane), air bike / rower / SkiErg (QC only).
- **Cones, agility ladders, mini-hurdles and speed-timing gear are not required.** Drills use floor lines or any marker. They are not in the ET equipment vocabulary; see section 11.

**Speed + Agility without a lane is still real speed work, not treadmill Sweat.** Short-space version:

- falling-start 5 m sprints to a stick;
- decel snaps;
- 5-5 lateral shuttles;
- lateral bounds;
- line hops;
- an air-bike QC block for repeat power (skeleton A6).

**Treadmills are never used for Athletic speed exposures** (decision F3). The belt drives the speed, max accelerations are unsafe, and treadmill intervals are Sweat's territory.

---

## 9. Quality-capped Athletic Conditioning block (QC) contract

| Field | Rule |
|---|---|
| **Purpose** | Repeat speed / repeat power: produce the same high output several times. |
| **Bout duration** | 3 to 10 s of max-intent work (a 10 to 20 m sprint, a 6 to 8 s bike / ski / row sprint, a 10 m light-sled acceleration, 3 to 5 fast med-ball throws). |
| **Recovery** | ≥ 4× the work time (work : rest 1:4 or longer; default 1:5 to 1:10). Walk-back or easy spin. Between sets (when used): 2 min. |
| **Volume (C3)** | About 4 to 8 total bouts, in 1 set (or 2 sets of 3 to 5 with 2 min between). The bout count is whatever fits the 8-minute cap with the prescribed recovery: bouts × work + (bouts − 1) × recovery + between-set rest ≤ 480 s. More than 8 bouts only when that still holds. Recovery is never shortened to fit bouts. Example: 6 s sprint / 54 s easy fits at most 8 bouts (7.1 min). |
| **Maximum block duration** | 8 min at 60, authoritative (not used at 30). |
| **Density** | ≤ 35% (by construction about 10% to 25%). |
| **Quality floor** | Standard QC cue (3.4). The block ends when output clearly drops (noticeably slower sprint, falling bike power, throws landing short), even if bouts remain. |
| **Where it may appear** | After PX, SX and SX2 (when present) and before support: via duration fill, Irritated, or as Amped's extra quality exposure. Never PX, never after support, never a finisher. At most 1 per session. |
| **Who** | Intermediate and advanced. Not beginners, who lack the self-monitoring for a quality floor. |
| **States** | Low Energy: removed first. Stressed: fixed machine format only. Irritated: allowed. Amped: preferred as the extra. Bored: allowed with a novel modality. |
| **Modalities** | Short sprints (lane); air bike / SkiErg / rower sprints (floor, any gym); light-sled accelerations (lane + sled); repeat med-ball throws. No repeat jumps (impact) and no treadmill. |
| **Progression** | Higher peak output first. Then 1 to 2 more bouts **only if quality holds**. Never less rest. |

**Mechanically different from Sweat intervals:**

| | Sweat interval | Athletic QC |
|---|---|---|
| Bout | 20 to 60 s | 3 to 10 s |
| Work : rest | 1:1 to 2:1 | 1:4 or longer |
| Block density | ≥ 60% (hard floor) | ≤ 35% (hard ceiling) |
| What ends it | The clock / planned rounds | Output dropping (quality floor) |
| Intent | Repeatable hard pace (RPE 7 to 9) | Max output each bout |
| Progression | More rounds, more output, less rest | Higher peak output; more bouts only while quality holds |

---

## 10. Strength-support limits

**Pressure test of the current rule** ("support working sets never outnumber Athletic exposure sets"):

- The WA v16 canonical Power example is box jump 4 × 3-5, med-ball chest throw 4 × 8-12, trap-bar deadlift 3 × 5-6 at 2 to 3 min rest, and reverse lunge 3 × 8 per side.
- It passes the set rule: 8 exposure sets vs 6 support sets.
- Measured with the Sweat time model, though, **support is 55% of the working time** (about 11 min vs 9 min).
- Add a third support exercise and it still passes on sets while support reaches 61%.

Sets are the wrong currency: an explosive set lasts 8 seconds, a strength set 20 to 50 seconds with longer rest. **The rule is insufficient on its own.**

**Proposed support rules (all hard):**

| # | Rule |
|---|---|
| SUP-1 | **Exposure share ≥ 55% of working time** (warm-up and downshift excluded). Exposures = PX + SX + SX2 + QC. This is the main composition limit and directly prevents "15 min of power + 35 min of Strength". |
| SUP-2 | Support ≤ 2 exercises and ≤ 6 working sets at 60; ≤ 1 exercise and ≤ 3 sets at 30. Trunk is separate: ≤ 1 exercise, ≤ 3 sets. |
| SUP-3 | Support sits after every exposure. Exception: the heavy half of a contrast pair. |
| SUP-4 | Support is never protected. It is prescribed at 2 to 3 RIR, 3 to 8 reps (Get Stronger 3 to 5 at 2 RIR), never to failure. No burnouts, drop sets, pyramids or ladders. |
| SUP-5 | The existing set rule stays as a secondary check: support sets ≤ exposure sets. |
| SUP-6 | **Selection purpose** by archetype: Speed = unilateral lower + hamstring / posterior chain; Power = one bilateral compound + one unilateral or upper pull; Full-Body Athlete = one lower + one upper. |

**The Get Stronger goal row** (WA) raises support intensity (heavier, 3 to 5 reps), not its share. SUP-1 and SUP-2 still apply. That keeps "Get Stronger" Athletic, per WA's own guardrail: "Slightly greater strength support without becoming Strength Direction."

**How much support Athletic needs:** in the skeletons, support is 2.2 to 11.2 min, and exposure share runs from 57% to 82%. One or two well-chosen lifts are enough to build robustness without competing with the athletic work.

---

## 11. Library-gap assessment (no library built)

**Current inventory:**

- **Strength Library v11:** 196 exercises, 5 tagged explosive (push press, KB swing, KB clean and press, DB clean to press, DB snatch), 0 jump / sprint / throw patterns, 0 Athletic eligibility rows.
- **Sweat additions:** box jump, jump squat, skater hops, high knees, med-ball slam, sled push / pull, KB snatch, DB push press, air squat, glute bridge, step-up and the ergs.

**Healthy-generation target:** the ET POOL DENSITY thresholds (OK ≥ 8 eligible per slot, THIN 4 to 7) at intermediate level in the commercial default. Counts below are approximate and deliberately modest.

| Category | Needed for | Reusable now | New records (approx.) | Examples of new |
|---|---|---|---|---|
| Vertical jumps | Power PX, Full-Body Athlete | box jump, jump squat | 3 | countermovement jump, pogo hops, seated box jump |
| Horizontal jumps | Power PX / SX | none | 2 | broad jump to stick, consecutive broad jumps (int+) |
| Unilateral jumps / hops | Power SX2, Speed SX2 | none | 3 | single-leg hop to stick, lateral single-leg hop, single-leg box jump (low) |
| Bounds | Speed SX2, Power (lane) | skater hops (as lateral bound) | 2 | lateral bound to stick, alternating bound (lane) |
| Throws (linear) | Power SX, Full-Body Athlete upper | med-ball slam | 3 | chest pass to wall, overhead throw to wall, scoop toss to wall |
| Rotational throws | Power SX, Full-Body Athlete | none | 2 | rotational wall throw, step-behind rotational throw |
| Accelerations | Speed PX, Full-Body Athlete | none | 4 | 10 to 20 m acceleration, falling start, push-up start, wall drill (beginner mechanics) |
| Deceleration | Speed SX, beginner landing | none | 2 | snap-down to stick, sprint-to-stick (decel) |
| Change of direction | Speed SX | none | 2 | 5-10-5 pro-agility (lane), 5-5 shuttle (floor) |
| Lateral movement | Speed SX / SX2 | none | 2 | lateral shuffle to stick, crossover-step drill |
| Footwork | Speed SX2, warm-up | jump rope, high knees | 2 | line hops / quick feet, dot drill |
| Reactive | Speed (advanced / Bored) | none | 1 to 2 | self-initiated combination starts (shuffle-crossover-sprint), single-leg hop to sprint; true reaction needs a cue (decision F5) |
| Coordination / skips | Beginner Speed, warm-up | none | 2 | A-skip, power skip (lane) |
| Explosive lifts | Power PX / SX2 | KB swing, KB snatch, DB snatch, DB push press, DB clean to press, KB clean and press, push press | 2 | trap-bar jump (light), landmine punch-press |
| Upper power | Power with lower soreness | (throws above) | 1 | explosive / plyo push-up |
| Sled speed / power | Speed, Power, QC | sled push, sled pull | 0 | same exercise records, Athletic prescription (light, fast, full rest) |
| Machine sprints (QC) | QC | air bike, SkiErg, rower | 0 | same records, Athletic prescription |
| Support (strength) | Support layer | about 25 Strength-library items (trap-bar deadlift, split squats, single-leg RDL, reverse / lateral lunge, step-ups, goblet squat, pull-ups, rows, push-ups, DB presses, Nordic-style hamstring work if present) | 0 | eligibility rows only |
| Trunk | Trunk slot | about 8 (Pallof, dead bug, side plank, Copenhagen plank, carries, landmine rotation) | 0 | eligibility rows only |

**Totals:**

- **New: about 33 records** (sum of the category estimates above).
- **Reused: about 45** (about 10 explosive or output items, 25 support, 8 trunk, ergs and sled).

No category needs more than 4 new records. Pool health should be verified after tagging.

**Representation gaps to resolve in the library pass** (taxonomy not changed now):

1. **No quality-category field.** ET cannot say power vs speed vs agility vs coordination vs reaction. `explosive` is one boolean that conflates them. Needed for PX / SX family rules (AI-8).
2. **`movement_pattern` gaps.** It has `jump`, `sprint`, `throw` and `locomotion`, but no deceleration, change of direction, lateral / shuffle, landing / stick or reactive.
3. **No force vector / plane** (vertical, horizontal, lateral, rotational). Needed for "different vector" SX rules. `variation_tags` could carry it.
4. **Impact severity is coarse.** `impact_level` has three levels and does not distinguish bilateral from unilateral landings, landing height, or contacts per rep. This is needed for the D4 impact rule.
5. **The intent mode is implicit.** Nothing marks max-intent vs precision-first drills (the intent refinement). A tag or category-level rule is needed so the correct cue is attached.
6. **Space is not granular.** `lane` does not state a length; drills need a minimum distance (5 m floor vs 10 to 20 m lane).
7. **Equipment vocabulary.** It lacks cones, agility ladder and mini-hurdles (all avoidable at launch) and a "wall target" for throws. `med_ball_wall` exists as a station.
8. **Prescription-dependent identity.** Sled push, KB swing and ergs are the same records across Directions, with a different prescription. Eligibility rows must carry the Athletic dose; this is already supported by ET condition grammar and WA prescription bands.
9. **WA slot class for QC.** PRESCRIPTION BANDS has no `athletic_conditioning` slot class yet; it is added in implementation.

---

## 12. Proposed hard Athletic invariants (validator)

| # | Invariant |
|---|---|
| **AI-1 Protected primary** | PX exists, is a power- or speed-family exposure, and is the first work after the warm-up. Never a non-explosive compound (D1). |
| **AI-2 Required secondary** | SX exists at 30 and 60 and differs from PX in exercise family and (where the library allows) vector or quality. |
| **AI-3 Intent and dose** | PX, SX and SX2 items: about 1 to 6 reps or ≤ 10 s per set (light ballistics up to 12 reps). Intent follows the drill category (max-intent vs precision-first). |
| **AI-4 Quality stop** | Every PX, SX, SX2 and QC item carries its category's standard quality-stop cue (D3). |
| **AI-5 Density ceiling** | Every exposure and QC block is ≤ 35% active work (D4). |
| **AI-6 Exposure share** | Exposure blocks are ≥ 55% of working time (SUP-1). |
| **AI-7 Support caps** | SUP-2 to SUP-5 hold. |
| **AI-8 Archetype distinctness** | Family rules in section 2 (Power ≥ 2 power; Speed PX speed + SX decel / COD / lateral; Full-Body Athlete ≥ 2 distinct qualities, plus lower + upper / rotational at 60 unless soreness prevents it) (C2). |
| **AI-9 No fatigue-first structure** | No AMRAP, For Time, exposure circuits, default finishers, ladders, pyramids or drop sets. EMOM only per WA condition. |
| **AI-10 QC contract** | QC meets section 9: bout 3 to 10 s, work : rest ≥ 1:4, ≤ 8 min, ≤ 1 per session, placement, intermediate+, no treadmill, no repeat jumps. |
| **AI-11 Order** | Exposures before support (contrast pair excepted); nothing fatiguing before PX. |
| **AI-12 Experience gates** | Complexity cap; beginners get no high-impact items, contrast, clusters or QC; advanced ≤ 1 high-impact exposure block. |
| **AI-13 Impact budget** | Principle only: capped by experience and impact severity; rule designed in the library pass (D4). |
| **AI-14 Space / equipment** | Hard filter on `space_requirement` and equipment; treadmills never used as Athletic speed exposures. |
| **AI-15 Rest integrity** | No State or duration rule may shorten exposure rest below its band floor. |
| **AI-16 Deletion test (AC10)** | Remove the exposures: support + trunk must not form a complete Strength session (guaranteed by SUP-2). Remove support: the remainder is still ≥ 2 exposures, so still Athletic. Support may be absent (C1). |
| **AI-17 Soreness** | Frozen S-rules; Speed + Agility is lower-body dependent (section 6). |
| **AI-18 Duration band** | 60: 38 to 55 min; 30: 20 to 30 min; the fill order in section 4. |

---

## 13. Representative skeletons (architecture review only)

The 13 skeletons below use example movements and prescriptions and are not generator output. Times come from one simple model:

- work plus rest between sets;
- contrast pairs split half support, half exposure;
- 1 minute of transition per block.

**Share** = exposure share of working time. **Max density** = the most work-heavy exposure or QC block.

| # | Session | Blocks (sets × reps / time, rest) | Est. min | Share | Support sets | Max density |
|---|---|---|---|---|---|---|
| **A1** | Power · Intermediate · Normal · 60 | WU 9 · **PX** box jump 5 × 3, 90 s · **SX** med-ball rotational throw 4 × 4 / side, 75 s · **SX2** broad jump to stick 4 × 3, 75 s · **Support** trap-bar deadlift 3 × 4 @ 2-3 RIR, 120 s; split squat 3 × 6 / side + Pallof press (superset) | 44 | 58% | 6 | 0.15 |
| **A2** | Power · Intermediate · Normal · 30 | WU 6 · **PX** box jump 4 × 3, 90 s · **SX** med-ball chest pass to wall 3 × 5, 60 s · **Support** trap-bar deadlift 3 × 5 @ 2-3 RIR, 90 s | 22 | 65% | 3 | 0.17 |
| **A3** | Power · Beginner · Normal · 60 | WU 10 (landing mechanics) · **PX** box jump, low box, step down, 5 × 3, 90 s · **SX** med-ball chest pass 3 × 6, 60 s · **SX2** snap-down to stick 3 × 4, 60 s; low pogo hops 3 × 10 s, 50 s · **Support** goblet squat + DB row 3 × 8 @ 3 RIR · **Trunk** dead bug 2 × 8 / side | 40 | 65% | 6 | 0.23 |
| **A4** | Power · Advanced · Get Stronger · 60 | WU 10 · **PX** hurdle hops 5 × 3, 120 s · **SX** contrast pair: trap-bar deadlift 3 reps @ 3 RIR → 20 s → broad jump × 3, 3 rounds, 150 s · **SX2** med-ball rotational throw 4 × 4 / side, 75 s · **Support** single-leg RDL 3 × 6 / side + Pallof press | 44 | 61% | 6 | 0.15 |
| **A5** | Speed + Agility · Intermediate · Normal · 60 (lane) | WU 10 (skips, build-ups) · **PX** 10-20 m acceleration × 6, walk-back about 75 s · **SX** 5-10-5 pro-agility × 5, 75 s · **SX2** lateral bound to stick 3 × 4 / side, 60 s · **Support** rear-foot elevated split squat 3 × 6 / side; single-leg RDL 3 × 6 / side | 43 | 60% | 6 | 0.29 |
| **A6** | Speed + Agility · Intermediate · Normal · 60 (floor only, no lane) | WU 10 · **PX** falling-start 5 m sprint to stick × 6, 60 s · **SX** 5-5 lateral shuffle shuttle × 5, 60 s · **SX2** line hops / quick feet 4 × 10 s, 40 s · **QC** air bike 8 × 6 s sprint / 54 s easy · **Support** RFE split squat + single-leg RDL 3 rounds | 45 | 72% | 6 | 0.25 |
| **A7** | Speed + Agility · Beginner · Normal · 30 | WU 7 (skips, wall drill) · **PX** 10 m acceleration from standing × 5, 60 s · **SX** lateral shuffle to stick 3 × 2 each way, 45 s · **Support** reverse lunge 2 × 8 / side @ 3 RIR + dead bug | 22 | 63% | 2 | 0.21 |
| **A8** | Full-Body Athlete · Intermediate · Normal · 60 (MOOD's Pick / cold start) | WU 9 · **PX** broad jump to stick 5 × 3, 90 s · **SX** 10 m acceleration × 5, 70 s (lane, or 5 m floor version) · **SX2** med-ball rotational throw 3 × 4 / side, 60 s · **Support** reverse lunge + single-arm DB row 3 rounds · **Trunk** Pallof press 2 × 10 / side | 40 | 62% | 6 | 0.29 |
| **A9** | Full-Body Athlete · Intermediate · Low Energy · 30 | WU 6 · **PX** box jump, low landing, 4 × 3, 90 s · **SX** 5 m acceleration × 4, 60 s (simple, planned) · **Support** goblet squat 2 × 8 @ 3 RIR (Volume −1) | 22 | 79% | 2 | 0.11 |
| **A10** | Power · Intermediate · Irritated · 60 | WU 9 · **PX** med-ball slam, max intent, 5 × 4, 70 s · **SX** light-sled acceleration 10 m × 5, 90 s · **SX2** KB swing, fast, 4 × 5, 75 s · **QC** air bike 6 × 6 s / 54 s · **Support** trap-bar deadlift 3 × 4 @ 2 RIR · **Trunk** suitcase carry 2 × 20 m / side | 46 | 76% | 3 | 0.15 |
| **A11** | Speed + Agility · Advanced · Bored · 60 | WU 10 · **PX** shuffle → crossover → 10 m sprint combo × 6, 90 s · **SX** lateral hop-to-stick combos 3 × 4 / side, 60 s · **SX2** single-leg hop → sprint 4 × 1 / side, 75 s · **Support** lateral lunge 3 × 6 / side; single-leg RDL + Copenhagen plank 3 rounds | 44 | 58% | 6 | 0.29 |
| **A12** | Full-Body Athlete · Intermediate · Amped · 60 | WU 9 · **PX** box jump 5 × 3, 90 s · **SX** 15-20 m acceleration × 5, 75 s · **SX2** med-ball rotational throw 4 × 4 / side (Volume +1) · **QC (Extras)** repeat 15 m sprints 2 × 5, 30 s walk-back, 2 min between sets · **Support** trap-bar deadlift 3 × 4 @ 2 RIR (Effort +1, at its floor) | 45 | 82% | 3 | 0.26 |
| **A13** | MOOD's Pick · Intermediate · sore quads, hamstrings, calves · 60 → Power, upper / rotational emphasis | WU 9 · **PX** med-ball chest pass to wall 5 × 4, 60 s · **SX** med-ball rotational throw 4 × 4 / side, 60 s · **SX2** explosive push-up 4 × 4, 75 s · **Support** pull-up 3 × 6; DB incline press 3 × 6 · **Trunk** Pallof press | 41 | 57% | 6 | 0.26 |

**What the skeletons show:**

- All 13 satisfy AI-1 to AI-12.
- Exposure share runs from 57% to 82%.
- No exposure or QC block exceeds 29% active work.
- 60-minute sessions land at 40 to 46 min and 30-minute sessions at 22 min.
- Speed + Agility builds with and without a lane.
- Low Energy stays athletic (crisp intent, fewer exposures), and Irritated vs Amped differ by programming:
  - Irritated: simple forceful drills, QC for catharsis, volume 0;
  - Amped: an extra exposure plus QC, heavier support, never compressed rest.

For contrast, the WA v16 canonical Power example lands at 45% exposure share and would fail AI-6.

---

## 14. Founder decisions required before implementation

| # | Decision | Recommendation |
|---|---|---|
| **F1** | Approve the three-archetype architecture (Power + Explosiveness, Speed + Agility, Full-Body Athlete) with the block grammar in section 3 and the family-distinctness rules. | Approve. |
| **F2** | Approve the support composition limits: exposure share ≥ 55% of working time, support ≤ 2 exercises / 6 sets at 60 and ≤ 1 / 3 at 30, the set rule kept as a secondary check. | Approve. |
| **F3** | Space policy: Speed + Agility full expression needs a `lane`; the 5 m floor version is a legitimate expression; treadmills are never used for Athletic speed; no cones, ladders or hurdles required at launch. | Approve all four. |
| **F4** | Exclude complexes and barbell Olympic lifts at launch (DB / KB explosive lifts only). | Exclude. |
| **F5** | Reaction: true reactive drills need a stimulus (partner or an app cue). Launch uses self-initiated combination drills only; an app-driven random cue is a possible post-launch product feature. | Defer the app cue; no reaction dependency at launch. |
| **F6** | Duration band: 60 min = 38 to 55 min, 30 min = 20 to 30 min, accepting that Athletic 60 usually finishes around 45 min rather than being filled with support. | Approve. |

**After approval.** The library pass comes next:

- tag about 33 new records and eligibility for about 45 reused ones;
- resolve the section 11 representation gaps;
- design the D4 impact rule;
- tune the density ceiling if needed.

Then the generator, QA and a founder pressure-test pack, as with Sweat.
