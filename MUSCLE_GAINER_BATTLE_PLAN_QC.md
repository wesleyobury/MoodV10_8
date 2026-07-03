# Battle Plan QC — "Gain Muscle" (Muscle Gainer) Path

_Full changelog of the QC pass over all **880 workouts** across the 11 muscle-group files
(abs, back, biceps, calves, chest, compound-legs, glutes, hamstrings, quads, shoulders,
triceps)._

This is the second path reviewed, after Sweat. Same method: audit-driven detection of
defects at scale, then per-workout reconstruction where the structured plan didn't make
sense. The root-cause parser fixes from the Sweat pass (`utils/battlePlanFormat.ts`) were
already in place and already benefited this path.

---

## Did the parser fix help here? Yes.

Re-running the old vs fixed parser across the 880: **39 workouts improved automatically** —
14 had a dropped iso-finisher movement restored (same class as Sweat: "Iso-Finish Rows",
"Hip Thrust + Iso Hold", etc.), 25 had lowercased movement names cleaned up. No regressions.

---

## The main defect found: drop-cluster / drop-ladder workouts

The July conversion mishandled a whole class of **advanced techniques** (drop clusters, drop
ladders, cluster sets). It pushed the set-by-set details up into the Instructions prose and
**deleted the movement bullets**, leaving the structured plan empty or unnamed. Worst case:

> **Jump Squat Clusters** — the old plan had `• 5 + 5 + 5`. The conversion **deleted it
> entirely**; the new plan said only "4 sets, rest 120s" with **no rep count anywhere**. A
> user had no idea how many reps. Restored to `• Jump Squat — 5 + 5 + 5 (cluster…)`.

**53 workouts** were reconstructed so the exercise is named and the full prescription is
present, pulling the exact numbers from the old `.ts.bak` format:

| Fix | Count | What it was → what it is |
|---|---|---|
| Empty-body drop clusters restored | 12 | Body was just "Battle Plan — Drop Cluster / Rest 90s". Restored the Set 1 / Set 2 / Set 3 drop scheme and named the exercise (e.g. `• EZ-Bar Curl` + the three sets). |
| Unnamed drop-ladder schemes named | 11 | Tile read `"reps → drop ~20% → 8 reps → …"` with no exercise. Now `• DB Curl — 10 reps → drop ~20% → 8 → drop ~15% → AMRAP`. |
| Bare rep bullets named | 24 | `• 8 per leg` → `• Barbell Static Lunge — 8 per leg`. The exercise now appears on the bullet, not just the workout title. |
| Lost set restored | 1 | "Press w/ Early Drop Cluster" had dropped its Set 3 triple-drop bullet — restored. |
| Capitalization / cleanup | 2 | `• 8-10 dumbbell RDLs` → `Dumbbell RDLs`; `• 20 steps total Walking Lunges` → `• Walking Lunges — 20 steps total`. |
| **Rep scheme fully lost — restored** | (Jump Squat Clusters, counted above) | See callout. |

After these, **every one of the 880 workouts** has a named movement tile with a visible
prescription — 0 empty bodies, 0 unnamed tiles, 0 lowercase tiles.

---

## Things that looked wrong but are fine (verified, not changed)

- **Cluster / AMRAP notation (26 workouts):** `• Barbell Bench Press — 4 × (4 / 4 / 4)` and
  `• Chin-Ups — 4 × (AMRAP)` flagged as "garbled" but are intentional, correctly-named
  cluster and AMRAP notation that parses fine. Left as-is.
- **Fidelity vs the old format:** every `.ts.bak` battle plan was diffed against the new
  one. **No exercise content was lost** beyond the drop-clusters above. The ~130 "missing"
  lines were all rephrasings — and several were *improvements*: supersets went from
  `• Immediately 8 Pike Jumps` to `• 8 Stiff Leg Pike Jumps — immediately, no rest`, with a
  proper superset cue added to Instructions.

---

## One open item for your call: the "N rounds" header (510 workouts)

Most muscle-gainer plans have a non-bulleted header line, e.g.:

```
Instructions: 3 sets of 10-12 — rest 75s between sets, take all of it.
3 rounds
• 10-12 Goblet Squats
Rest 75s
```

That "3 rounds" line is a consistent, readable convention and the Instructions always carry
the exact prescription — so it's **not a defect** and I left it. But note: **403 of the 510
are single-exercise workouts**, where "rounds" really means "sets" (rounds usually implies a
circuit). The other 107 are multi-exercise, where "rounds" is correct.

If you'd like, I can normalize the 403 single-exercise ones from "N rounds" → "N sets" for
precise terminology. It's a larger, stylistic change (and needs a small parser tweak to read
"N sets" as the set count), so I left it as your decision rather than doing it unasked.

---

## Stored plans re-synced

All 880 stored `plan` objects were regenerated from the corrected parser so they match
runtime exactly (verified: 0 content differences), with movement keys serialized
alphabetically to match the original file style.

---

## Verification

- Parser output snapshotted for all 1,407 workouts: **0 changes to any non-muscle path**
  (Sweat and the other four paths untouched), **0 parse errors**.
- Final muscle defect sweep: **0** unnamed tiles, **0** lowercase tiles, **0** empty bodies,
  **0** true garbles.
- Stored `plan` == runtime parse for all 880 (content).
- `tsc --noEmit` clean on all 11 muscle files.

---

## Files changed (this pass)

- `frontend/data/abs-workouts-data.ts`, `back-…`, `biceps-…`, `calves-…`, `chest-…`,
  `compound-legs-…`, `glutes-…`, `hamstrings-…`, `quads-…`, `shoulders-…`, `triceps-…`
  (text fixes + re-synced plans).

No app code was changed in this pass — the parser fix from the Sweat pass already covers this
path. The `.ts.bak` files (old format) were left in place as reference.

---

## Recommendations

1. **"N rounds" → "N sets"** for the 403 single-exercise workouts, if you want the precise
   terminology (see open item above).
2. **Remaining paths:** Explosive, Calisthenics, Get Outside, and Lazy still have only the
   parser-level fix — their text hasn't been cleaned. Sweat and Muscle Gainer (your two
   priority paths) are now done.
