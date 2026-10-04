# V2 → V3 Programming Logic Reconciliation (pre Phase 2.5)

Analysis only. No code changed.

## Sources read

- **V2:** `frontend/utils/workoutGenerator.ts` (3,071 lines). The Strength-relevant part is the "Muscle Gainer" generator at lines ~2297 to 3000. I also skimmed the Sweat, Calisthenics and generic cart builders.
- **V2 inputs:** the V2 data files it reads (`chest/back/…/abs-workouts-data.ts`, `compound-legs-workouts-data.ts`) and `app/body-parts.tsx`, which stores the "recent exercises" memory.
- **V3:** `backend/mood_v3/engines/strength/adapter.py` (routing, Custom Target, swaps), `audit_engine.py` (`compose`, `compose_custom`, `rank`) and `qa_engine.py` (swap / recency ranking).
- **Measurements:** I ran live V3 generations through `mood_v3.service` on 2026-10-05 inputs, 60 min unless noted.

## What the measurements show (V3 today)

| Request | V3 result | Different Workout overlap |
|---|---|---|
| Back + Core, 60 | Custom Target, 4 exercises: **Farmer Carry, Ab Wheel** (core first), then Assisted Pull-Up, Cable Pullover. 30 to 35 min. | **4 of 4 identical** |
| Back + Core, 30 | **2 exercises**: Farmer Carry, Assisted Pull-Up | not measured |
| Chest + Core | Bench Press, Cable Fly, Farmer Carry, Ab Wheel | **4 of 4 identical** |
| Chest + Back + Core | Chest, then **Core in the middle**, then Back | **6 of 6 identical** |
| Shoulders (single) | 3 exercises, 9 sets, 25 to 30 min | **3 of 3 identical** |
| Calves (single) | 3 calf raises, 25 to 30 min | not measured |
| Chest (single) | Upper Push, **same 6 exercises as Chest + Triceps** (2 are triceps) | 2 of 6 kept (protected slots) |
| Back (single) | Upper Pull (2 of 6 are biceps) | 2 of 6 kept |
| Glutes (single) | **identical to Quads + Hamstrings + Glutes** | not measured |

**Root causes found in code:**

1. **Custom Target sizes are always the minimum of the spec's range.** The code comment in `compose_custom` records the WA v7.1 spec as "1 muscle 3–5 (60) / 2–4 (30); 2 muscles 2–3 / 1–2 each; 3 muscles 1–2 / 1 each". The code always uses the minimum: 3, 2 or 1 per muscle. Every muscle is treated the same, with no major / minor distinction.
2. **Custom Target ignores `swap_count` and history.** `_build_custom` passes `history=[]`, and `compose_custom` ranks by `(state score, exercise id)` only. So Different Workout returns the same session, every day, for the same inputs.
3. **The Custom Target block order puts Core first.** Blocks are ordered by "compound-led, then systemic demand". The core block always starts with its only compound, a carry (Farmer Carry, sysd 3), so Core sorts ahead of Back and sometimes Chest.
4. **Single-muscle Targets route to archetypes.** `chest` goes to Upper Push, `back` to Upper Pull, `quads` to Lower Squat, `hamstrings` to Lower Hinge, `glutes` to Glutes + Legs, and `biceps` / `triceps` to Arms. The archetype adds non-selected muscles.
5. **Archetype Different Workout keeps the protected primary slots** (WA v11 continuity), so the main lifts never change.

## Rule-by-rule reconciliation

### 1. Muscle roles (primary / ancillary / abs)

- **V2 rule:** `computeMuscleRoles` sorts muscles into three roles:
  - **Primary:** Chest, Back, Shoulders, Quads, Hamstrings, Glutes, Calves, Legs.
  - **Ancillary:** Biceps, Triceps.
  - **Abs.**
  - **Edge cases:** Abs alone is promoted to primary. Ancillary-only selections promote the first ancillary.
- **Purpose:** Big muscles get more work than small ones, and Abs never steals volume.
- **V3 equivalent:** None in Custom Target. Every block is the same size.
- **Status: ADAPT V2 RULE.** Map the V3 vocabulary:
  - **major** = chest, back, shoulders, quads, hamstrings, glutes, calves (V2 counts calves as primary);
  - **minor** = biceps, triceps, forearms, hip_adductors, hip_abductors (the last three have no V2 precedent; treated as minor by analogy);
  - **core.**
- **Rationale:** This directly fixes founder issues 3 and 5. The V2 roles are clear and were proven in use.
- **Layer:** Custom Target composer (`compose_custom` size table).

### 2. Per-muscle exercise counts

- **V2 rule:**
  - **Primary:** 2 to 4 by cart style and tier, typically 3 (`PRIMARY_COUNTS_V3`).
  - **Ancillary:** 2.
  - **Abs:** 2 for beginners, 3 for intermediate and advanced. Abs are exempt from the trim below.
  - **3 or more non-abs muscles:** every non-abs muscle is trimmed to a floor of 2.
- **Purpose:** Enough volume per selected muscle, with a floor so nothing gets a single token exercise.
- **V3 equivalent:** Fixed minimums of 3 / 2 / 1 per muscle (see root cause 1). The 60-minute working-set band is 12 to 16 sets, at 3 sets per exercise.
- **Status: ADAPT V2 RULE.** Stay inside the frozen WA v7.1 ranges, but pick the value within each range by role:

  | Targets | 60 min | 30 min |
  |---|---|---|
  | 1 muscle | major 5, minor 4, core 4 | major 3, minor or core 3 |
  | 2 muscles | major 3, minor 2, core 2 | major 2, minor or core 1 |
  | 3 muscles | 2 each (the V2 floor) | 1 each |

  The existing band trim (12 to 16 sets at 60) still limits total sets, so volume can't balloon the way V2 did at 18 to 24 sets.
- **Rationale:** This uses ranges the founder already approved and doesn't invent new numbers. Back + Core at 60 goes from 4 to 5 exercises (3 back + 2 core), and at 30 from 2 to 3.
- **Layer:** Custom Target composer.

### 3. Session order: primaries, then ancillaries, then Abs last

- **V2 rule:** `sortMusclesForSession` orders primaries in the user's selection order, then ancillaries, then Abs last. Calisthenics also builds its abs slot last.
- **Purpose:** Train the big muscles fresh, and don't pre-fatigue the trunk before heavy compounds.
- **V3 equivalent:** Blocks are ordered by compound-led, then systemic demand, then hierarchy. Measured result: Core lands first or in the middle.
- **Status: PORT V2 RULE** (founder issue 4). New block order key: role (major, then minor, then core); then the current compound / systemic key within a role; then selection order.
- **Rationale:** A small, deterministic change that matches the founder's stated preference.
- **Layer:** Custom Target composer (the block order line).

### 4. What counts as an "abs" exercise

- **V2 rule:** The V2 Abs pool (76 exercises) is crunches, rollouts, leg raises, planks and hollows. It contains **no carries**.
- **Purpose:** An Abs block that feels like ab work.
- **V3 equivalent:** The Core pool includes Farmer Carry, Suitcase Carry and Turkish Get-Up. Because each block starts with a compound, **a carry always leads the core block.** That's why Farmer Carry shows up in every Core combination.
- **Status: ADAPT V2 RULE.** When Core is combined with other muscles, its block should use trunk exercises (the 20 core isolations) and skip the compound-first rule. Carries stay available when Core is the only Target.
- **Rationale:** Removes the carry-first oddity. This is a ranking/filter change only; the taxonomy doesn't change.
- **Layer:** Custom Target composer (core block selection).

### 5. Only the muscles you selected

- **V2 rule:** A V2 Muscle Gainer session contains **only** the selected muscles. Chest means chest work.
- **Purpose:** Predictable, honest Targets.
- **V3 equivalent:** Single-muscle Targets route to archetypes that add other muscles. Chest alone produces the same workout as Chest + Triceps.
- **Status: ADAPT V2 RULE** (founder issue 2): route single **major** muscles (chest, back, quads, hamstrings, glutes) to Custom Target. Keep the multi-muscle archetype routes (Chest + Triceps to Upper Push and so on), because those match what the user asked for.
- **Rationale:** Worth doing only together with rules 2 and 6. Otherwise single Chest would get *worse* (3 exercises, never varies).
- **Founder decision needed:** WA TARGET ROUTING is a frozen table.
- **Layer:** Target routing (`ROUTING` in `adapter.py`).

### 6. Variation: recent-exercise memory and never-identical

- **V2 rule:**
  - Exercises shown in the **last 2 generations** get a strong score penalty (-3.0); they are down-weighted, not banned.
  - Within one batch, earlier carts' exercises are also penalized.
  - An exact duplicate exercise set is rejected.
  - Cart style rotates, so the session feel changes.
- **Purpose:** Re-rolling shows visibly new exercises.
- **V3 equivalent:**
  - **Archetypes:** WA v11 swap ranking deprioritizes families and exercises in the displayed chain, but only for non-protected slots. Measured: 2 of 6 exercises kept.
  - **Custom Target:** no variation at all (see root cause 2).
- **Status: ADAPT V2 RULE**, translated deterministically:
  1. **Custom Target:** rank by `swap_count` and completed-history recency, using the same keys archetypes already use (the family / exercise penalty for the displayed chain, then a stable seed).
  2. **Guard:** Different Workout never returns a composition identical to the one displayed.
  3. **Threshold:** at least half of the exercises change when the pool allows.
- **Rationale:** Founder issue 1. It reuses V3's own ranking keys, with no randomness.
- **Layer:** Different Workout / variation (inside `compose_custom` ranking).

### 7. Protected primary on Different Workout (archetypes)

- **V2 rule:** No protected concept. Every exercise, including the main compound, can change on re-roll.
- **Purpose:** Re-rolls feel like a new workout.
- **V3 equivalent:** WA v11 keeps protected primaries (the main lifts) on swap, for continuity and progression.
- **Status: ADAPT V2 RULE (founder decision).** During Different Workout only, allow the protected primary to change to a different swap family when a valid alternative exists. Keep cross-session continuity for progression unchanged.
- **Rationale:** This is the single biggest reason archetype swaps feel "not different enough". It touches a frozen WA v11 rule, so it needs the founder's call.
- **Layer:** Different Workout / variation (`qa_engine.rank`, swap branch).

### 8. Compounds before isolations within a muscle

- **V2 rule:** After picking, each muscle's section is reordered with compounds first and isolations last.
- **V3 equivalent:** Custom Target already picks the first exercise as the compound, then isolations. Archetype skeletons are ordered.
- **Status: KEEP V3.**

### 9. Movement-pattern and equipment variety within a muscle

- **V2 rule:** Soft score bonuses for a fresh movement pattern (+1.2 / -1.5) and fresh equipment (+0.8 / -1.0) within a muscle's section.
- **V3 equivalent:** Custom Target enforces swap-family uniqueness, plus a 2-of-5-attribute distinctness rule for single muscles. Archetypes use slot constraints.
- **Status: KEEP V3.** It's stricter and deterministic.

### 10. Legs: compounds first, then isolations spread across sub-groups

- **V2 rule:** Legs sections pick compounds, then isolations that prefer an unused sub-group (quads / hamstrings / glutes / calves).
- **V3 equivalent:** The lower-body archetypes (Squat / Hinge / Glutes + Legs) have dedicated slot skeletons.
- **Status: KEEP V3.**

### 11. Style carts and equipment themes

- **V2 rule:** An 8-cart library (Strength, Hypertrophy, Pump, Heavy Day, Builder Day, Athletic Day, Express, Eccentric Focus) with style and equipment biases. It shuffles which carts are offered.
- **V3 equivalent:** Prescription bands, the State system and archetypes.
- **Status: RETIRE V2 RULE.** It's V2 flavor logic that competes with States and prescription.

### 12. Structural jitter and softmax sampling

- **V2 rule:** A 40% chance of +1 exercise for primary muscles, and `Math.random` weighted sampling.
- **V3 equivalent:** Deterministic ranking.
- **Status: RETIRE V2 RULE.** Its intent (variety) is covered by rule 6.

### 13. Duration

- **V2 rule:** Muscle Gainer has **no duration input**. Each item carries its own "12–15 min" label, and the total is simply summed. Sweat uses minute / cost / peak budgets by tier.
- **V3 equivalent:** 30 / 60 templates, working-set bands (60 min: 12 to 16 sets, 30 min: 8 to 11), and backfill or trim.
- **Status: KEEP V3.** Rules 1 and 2 fix the underbuilt Custom Target sessions from within V3.

A related note: 60-minute Strength sessions currently *estimate* at 40 to 45 min (archetypes) or 30 to 35 min (Custom Target). That's a question about V3's volume band and duration display, not something to port from V2.

### 14. Supersets, circuits and finishers

- **V2 rule:** Muscle Gainer uses only straight standalone items. A "finisher" slot is a pump-style isolation at count 4.
- **V3 equivalent:** State-driven structure layer (supersets, pyramids, finishers). Custom Target is straight sets.
- **Status: KEEP V3.**

### 15. Sweat phase ordering and budgets

- **V2 rule:** Warm-up (easy), then main (mid to high), then finisher (hot), with minute, cost and peak caps plus equipment variety.
- **V3 equivalent:** The frozen Sweat engine.
- **Status: KEEP V3.** None of the founder issues are in Sweat.

### 16. Abs-only and ancillary-only promotion

- **V2 rule:** Abs alone, or only ancillaries, get primary treatment.
- **V3 equivalent:** `core` goes to the Core archetype; `biceps` / `triceps` go to Arms.
- **Status: KEEP V3.**

## Recommended V2 rules to port now

1. **Role-weighted Custom Target allocation** (rules 1 and 2): major > minor, and core. Stays inside the frozen WA v7.1 ranges; volume stays controlled by the existing set band.
2. **Abs / Core last, with an ab-style core block** (rules 3 and 4): primaries, then ancillaries, then Core; no carry leading the core block when Core is combined with other muscles.
3. **Custom Target variation** (rule 6): deterministic swap and recency ranking reusing V3's own keys, never an identical Different Workout, and at least 50% of exercises changed when the pool allows.
4. **Single major muscle routes to Custom Target** (rule 5): Chest alone means chest work. Ship this only together with items 1 and 3. Needs founder sign-off, because WA routing is frozen.

**Founder decision, not in the list above:** rule 7, letting the protected primary change on archetype Different Workout. It has high impact on founder issue 1, but it changes WA v11.

Each item touches only the Custom Target composer, the Target routing table or the swap ranking. There is no new layer, no change to the frozen Direction / State architecture, and no V2 imports or randomness. The frozen parity tests will need new expected values for Custom Target cases, and the archetype cases should be unaffected.

## V2 rules explicitly NOT worth porting

- The style-cart library and its equipment themes (Strength / Pump / Heavy Day / Builder Day / Athletic Day, etc.).
- `Math.random` structural jitter and softmax sampling.
- Per-item duration labels summed into a session length.
- V2's per-muscle volume beyond the V3 set band (18 to 24 sets).
- The off-theme equipment budget and cart feasibility shuffling.
- Sweat, Explosive, Calisthenics, Lazy and Outdoor cart builders; the V3 engines own those Directions.
- Any mood-card routing.
