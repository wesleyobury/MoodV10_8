# MOOD V3 Sweat: Founder Revision (generator v3)

> **Superseded in part by Sweat FINAL FREEZE v4:** the Assault Bike / TRX Row renames were reverted to the generic canonical names (Air Bike, Suspension Trainer Row; brand names are display aliases only), and Low Energy / Irritated / Amped received final corrections. See *MOOD_V3_Sweat_Architecture_FINAL_FREEZE_v4.md*.

This revision applies the founder's review notes from the pressure-test pack. It changes tuning and content only: archetypes, block structure, State dials, safety rules and the validator contract are unchanged. Where the numbers below differ from *MOOD_V3_Sweat_Architecture_FINAL_FREEZE_v3.md*, this document wins.

Code: *MOOD_V3_Sweat_Reference_Generator_v3.zip*. Library audit: *MOOD_V3_Sweat_Library_Audit_v4.xlsx*.

## 1. Shorter rest (cardio feel)

| Where | Before | Now |
|---|---|---|
| Circuit, rest between rounds | 90 s (60 s advanced, 60 s at 30 min) | 45 s intermediate, 60 s beginner, 30 s advanced (max 45 s at 30 min) |
| Timed stations, work / move | 40 / 20 (Low Energy 30 / 30) | 40 / 20 (Low Energy 30 / 15; beginners keep 30 / 30) |
| Timed stations, rest between rounds | 60 s | 30 s (beginners 45 s) |
| Hybrid, walk between rounds | 60 s | 45 s (beginners 60 s) |
| Hybrid add-on circuit, rest between rounds | 45 s | 30 s |
| Engine long intervals | 4:00 / 1:30 (Stressed 6:00 / 2:00) | 4:00 / 1:00 (Stressed 6:00 / 1:30) |
| Engine short intervals | 0:30 / 1:00 | 0:30 / 0:45 |
| Engine pyramid, easy between steps | 1:00 | 0:45 |
| Engine add-on intervals | 0:30 / 0:30 | 0:40 / 0:20 (beginners 0:30 / 0:30) |
| Finisher | 20 / 40 or 15 / 45 | 20 / 30 or 15 / 30 |

Beginners keep recovery at or above work, which is an existing safety rule.

## 2. Equipment and exercise library

- **No machines in Sweat.** Selectorized and plate-loaded machines, cables, Smith machine and rack stations (lat pulldown, cable rows, machine presses and so on) are excluded from every Sweat block. Cardio machines stay.
- **Removed:** Bear Crawl, replaced by **Plate Push**.
- **Renamed:** Air Bike is now **Assault Bike**, and Suspension Trainer Row is now **TRX Row**.
- **Carry variety:** added **Overhead Carry**, **Single-Arm Overhead Carry** (switch arms halfway) and **Front-Rack Carry** (clean position). They share the carry family with Farmer and Suitcase Carry, so a block never has two carries and sessions rotate between them.
- **Full-body and athletic movements:**
  - **New:** Kettlebell Snatch, Dumbbell Push Press, Jumping Jacks, Dumbbell Lateral-Raise Jacks, Box Jump, Skater Hops, High Knees, Devil Press.
  - **Dumbbell Snatch** is now allowed for intermediate and advanced users.
  - Kettlebell Swing and Dumbbell Snatch are first-choice options when the user's level allows them.
  - KB Snatch and DB Snatch never appear in the same block.
- **Simple lower-body stations** (Air Squat, Glute Bridge, Step-Up) are added so that Low Energy and Beginner circuits keep variety now that machines are gone.
- **Barbell push press was not added.** It needs a rack or a clean from the floor, which brings back the station problem the machine removal fixes. DB Push Press covers the movement.
- **Dosing leans higher:** most resistance stations are 15 reps (12 for beginners), unilateral 10 per side, and bodyweight pushes 12. The cue is now "light-moderate load, unbroken, short of failure."

## 3. Circuit composition

- The fourth circuit station now prefers a **full-body lift or an output movement** (swing, snatch, thruster-style, devil press, burpee, jumps, ropes) over a core hold. The lower-body station prefers full-body lifts too.
- **Low Energy** now:
  - runs as timed stations on a continuous clock (30 s on / 15 s move);
  - counts low-impact, moderate-cost movements (carries, ropes, slams, swings, goblet squats) as fully compliant, instead of only supported or near-zero-cost lifts;
  - fills its last station with an easy output (ropes, carries) rather than a floor hold.
- **Jumping is spread out:** at most 2 jump-type stations per block.
- **Variety tie-break:** when two options are otherwise equal, the one used in fewer of the last 3 sessions wins. Farmer Carry and KB Swing no longer get a first-choice nudge, so carry variants and other full-body moves rotate in.
- **Hybrid:** at most 5 distinct stations per session; after that, rounds cycle back through them.

## 4. QA (full suite, all tiers)

All green:

- **Data and fixtures:**
  - 0 data errors.
  - 672 grid builds with 0 hard failures and 0 generator failures.
  - 41 of 41 fixtures pass.
  - 400 of 400 builds reproduce exactly.
- **History and swaps:** swap chains healthy (13 healthy, 1 limited but defensible), and history behavior good in all 8 cases.
- **Soreness:** 0 soreness violations.
- **Cardio Identity Contract:** 0 violations and 0 fixed-station overflows.
- **Targeted checks:**
  - Low Energy rotation passes 5 of 5.
  - No primary block falls below 0.60 density.
  - Resistance-heavy identity passes 72 of 72.
  - Equipment-limited identity passes 96 of 96.
  - Hybrid variety passes 4 of 4.
- **Pressure-test pack:** 28 of 28 workouts are VALID BUILD with 0 violations, and none contain a machine or cable station.

## 5. Still open for the founder

- **Irritated vs Amped** still draw on the same forceful pool.
  - The overlap is smaller than before: C4 / C5 share 2 of 4 primary items, down from 4 of 4, and H4 / H5 share 2 of 5 stations, down from 5 of 5.
  - They still read similarly.
- **The Low Energy circuit (C2)** still includes Glute Bridge and Chest-Supported DB Row, the most lifting-like stations left.
