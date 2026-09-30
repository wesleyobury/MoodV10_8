# MOOD V3 · H1/H2 Founder Edit Pass

Date: 29 Sep 2026. Stopped before the Guided Session. No frozen Strength, Sweat or Athletic programming was changed.

Screenshots: `Founder_Pass_screens/` (24 numbered captures at 390×844) and `Founder_Pass_contact_sheet.png`.

## 1. What changed

| # | Item | Result |
|---|---|---|
| 1 | Optional States | Home now asks "Anything affecting your workout today?" with "Optional · choose up to 3". Unselected pills are quieter (darker fill, softer label). Selected pills stay MOOD yellow. There is no "Normal" pill. The max of 3, day persistence, conflicts and semantics are unchanged. (screens 01, 02) |
| 2 | Sore body map | Tapping Sore opens a branded body map right away, with Front/Back and a male/female figure switch. Tapped regions glow and can also be picked from chips. Done keeps Sore selected and carries the regions into Build and generation. Home shows a "Sore · Legs, Lower Back · Edit" line. Deselecting Sore clears the regions. Cancel leaves Sore off. Build shows the region chips (tap to remove) and a "Body map" link. The regions use the engine's exact vocabulary: chest, shoulders, arms, core, upper_back, lower_back, legs, plus legacy "back". The sheet no longer jumps in height between front and back. (03 to 07, 10) |
| 3 | Rebuild CTA | When Home States no longer match today's workout (States or sore regions), "Build for how you feel now" becomes the filled gold CTA and Open becomes a quiet "Open this workout". When they match, the gold "Open Workout" and quiet "Build a different workout" come back. (08, 09) |
| 4 | Irritated | Engine proven clean. The frontend cause is fixed and regression tests were added. See section 3. |
| 5 | Static imagery | Cart rows and the detail sheet use a static image first, then the clean thumbnail, then a monogram tile. The play badge is off on rows. See section 2. |
| 6 | Row Swap | Every swappable Cart row has a compact "⇄ Swap" pill, using the existing endpoint. While a swap runs, that row shows a spinner and the other rows dim. no_alternative leaves the exercise unchanged and shows the toast "No other exercise fits this spot today, so this one stays." Tapping a row still opens the sheet, and Swap is still in the sheet. (17, 24) |
| 7 | Plain English | Built for Today, block facts, prescriptions and sheet facts are rewritten on the frontend. Examples: "RPE 7–8" becomes "Hard effort", "2 RIR" becomes "Stop with about 2 reps left in the tank", "heavy top set and back-off sets" becomes "one heavy set, then a few lighter ones". Five terms are exposed on purpose: RPE, RIR, Top set, Back-off and EMOM (drop set, rest-pause, superset, contrast and eccentric are also defined). They appear as a small underlined term row under Built for Today, an ⓘ on block facts, or an ⓘ on the sheet's Effort row. Each opens a one-card definition. There are no question marks scattered across screens. Prescriptions are unchanged. (19, 20, 22, 18) |
| 8 | Adjusted for Today merged | The separate card is gone. The sore or reroute reason now leads Built for Today, once. The generic "moved from X to Y" line only appears if nothing better explains it. outcome, rerouted and requested_archetype are still sent on v3_cart_viewed for analytics. (11) |
| 9 | Strength Focus sheet | The sheet now has three sections: MOOD'S PICK, BODY AREA (Upper, Lower, Full) and SPECIFIC MUSCLE (up to 3 of Chest, Back, Shoulders, Biceps, Triceps, Quads, Hamstrings, Glutes, Calves, Core), then Difficulty. The Workout Type row is removed for Strength, and target routing picks the architecture. Sweat and Athletic sheets are unchanged: their Focus and Workout Type answer different questions, so they don't have the same redundancy. (12 to 14) |
| 11 | Preserved | The hero, Build layout, Cart hierarchy, blocks, estimated duration, today cache, Cart hero, Different Workout, detail sheet and generator contract are all unchanged. |

Small extras found during QA:

- The Cart facts line no longer repeats the title. Before, "Full Body" was followed by "Full body", and "Biceps + Triceps + Back" was followed by the same label.
- The Athletic block label "Primary Exposure" is now "Primary", and the "Exposure" structure label is now "Quality reps". Screens 23 and 24 were captured just before this rename.

## 2. Media coverage (Cart rows)

The audit was run over 324 generated rows (14 days × 30/60 min × 3 Directions) against the harness seed library.

| Direction | Before (thumbnail only) | After (static, then thumbnail) |
|---|---|---|
| Strength | 62% | 68% |
| Sweat | 27% | 62% |
| Athletic | 50% | 66% |
| All | 47% | 65% |

Sources:

- 81 static images already owned by MOOD: V2 single-movement card images, plus the V2 equipment photos for Row Erg, Bike, Assault Bike, SkiErg, Treadmill, Jump Rope, Stair Climber, Battle Ropes, Med Ball, Slam Ball, Sled and Tire.
- All are Cloudinary URLs, except 6 existing asset URLs (checked, all return 200).
- No new media was produced.

Main gaps, by how often they appear:

- Strength: GHD Glute-Ham Raise (the biggest), Box Step-Up, Reverse Nordic, Curtsy Lunge
- Sweat: Push-Up, Overhead / Front-Rack / Farmer / Suitcase Carry, DB Snatch, DB Squat-to-Press, Wall Ball, Devil Press
- Athletic: DB Push Press, Reverse Lunge to Knee-Drive Hop, Seated Box Jump, Landmine Rotational Punch, Hang High Pull, jump variants

About 15 stills would take every Direction above 80%. The production exercise DB may already have more thumbnails than the harness seed data, so real coverage is likely a little higher.

## 3. Irritated

**The engine does not invent States.** 1,440 generations with no States in, including Different Workout and exercise swaps, returned zero States and no State wording in Built for Today, "You told MOOD" or the teaser. No frontend path adds a State to the request either.

**Most likely cause:** the H1 today cache migrated the old single-entry (v1) cache. A same-day build made earlier with Irritated selected (for example on a pre-H1 build or while testing) could then surface as the Home hero workout, looking as if MOOD picked Irritated.

**Fix:**

- The v1 migration is removed, so a pre-H1 cached build is never shown as today's workout.
- The dev pack fixture that contains Irritated is only reachable from the dev viewer.

**Regression coverage:**

- Backend `test_no_invented_states.py` (8 cases × 2 dates): no States means zero States in the request, on the workout, after 3× Different Workout and after an exercise swap.
- Frontend tests cover the request and signature with no States, and a v1 Irritated cache never surfacing.
- E2E in the harness: Home with no chips → Build → Cart eyebrow "STRENGTH" → Different Workout → still "STRENGTH". Stored request.states and workout.states were both `[]`.

## 4. Different Workout rotation (report only)

**How it works:**

- The seed is user | date | swap_count.
- MOOD's Pick steps through an archetype rotation (pick_rotation / archetype_chain, last 12).
- History is the last 30 completed V3 workouts, and it only changes the first pick.
- An explicit target or type pins the architecture, so only exercise choice can change.
- States and duration change dosing and structure. They don't change the rotation.

Measured over 6 taps, on 2 dates:

| Case | What changes per tap | Repeats | Verdict |
|---|---|---|---|
| Strength MOOD's Pick | New archetype every tap: Squat → Upper Pull → Upper Push → Glutes/Legs → Upper Mixed → Hinge → Arms. 0% exercise overlap. | 7 distinct, then loops | Strong. **Post-launch:** the first build is the same archetype every day (Squat) until completions exist, because history is the only first-pick input. The Guided Session must write /complete. |
| Strength explicit area (Upper) | Same architecture, all-new exercises | 7/7 distinct | Good |
| Strength single muscle (Glutes) | Same architecture, about 25% exercise overlap (small pool) | 7/7 distinct | Fine, post-launch |
| Sweat MOOD's Pick | Circuit → Hybrid → Engine cycle | Repeats the format every 3rd tap, and some come back identical (5 or 6 distinct of 7) | Weak, **launch-level UX issue** |
| Sweat pinned type (Hybrid) | Mostly nothing: 75 to 100% overlap with the previous tap | Only 2 or 3 distinct of 7 | **Launch blocker for "Different Workout" on Sweat.** Exercise selection is seeded by date, not swap_count, so the button often returns the same session. |
| Athletic MOOD's Pick | Speed/Agility → Full Body → Power cycle, new exercises each time | 7/7 distinct | Strong |

**Product answer:**

- "Different Workout" should promise a different session every tap.
- Strength and Athletic deliver that.
- Sweat needs a frozen-engine change: fold swap_count into Sweat exercise selection. This needs a founder decision because it touches frozen Sweat programming.
- Until then, the Cart could hide Different Workout for a pinned Sweat type, or relabel it. I made no change.

## 5. Strength Focus contract check

Every frozen Strength architecture is still reachable:

| Choice | Architecture |
|---|---|
| Upper | upper_mixed |
| Lower | glutes_legs |
| Full | full_body |
| Chest+Shoulders+Triceps | upper_push |
| Back+Biceps | upper_pull |
| Hamstrings+Glutes | lower_hinge |
| Biceps+Triceps | arms |
| Core | strength_core |
| Any single muscle | custom_target |
| MOOD's Pick | rotates through all |

**One distinct choice is lost as a direct pick: Lower Body: Squat.**

- quads+glutes routes to glutes_legs, so squat-led lower is reachable only through MOOD's Pick.
- Options if you want it back: route "Quads" alone (or Quads+Glutes) to lower_squat. That is a routing change, so it needs your call.

Also checked:

- Target conflict (sore legs + Glutes) builds. The engine keeps the target and picks friendlier setups, as frozen. (15)
- Reopening the sheet in the same Build session keeps the selection.
- A new Build session starts from MOOD's Pick, as in H1.

## 6. Tests

- Frontend node tests: all pass.
  - v3CartFormat 13
  - v3TodayModel 6
  - v3PlainLanguage 5 (474 real engine lines with no jargon left, numbers kept, idempotent)
  - cartHero 9
  - featuredHeroImage 7
  - inSessionProgress 12
  - healthSyncFormat 9
  - heartRateZones 9
- Backend `pytest mood_v3/tests`: 189 passed, 3 skipped. This includes the 8 new no-invented-States cases. No frozen regressions.
- tsc: 0 errors in changed files. ESLint: clean on all changed files.
- Web harness E2E: every item in QA list 12 passed.
  - Home: 0, 1 and 3 States (a 4th is blocked); Sore → map → regions; Cancel; deselecting Sore clears.
  - Builds with no State, with a State and with Sore.
  - Changed State → gold CTA; back to matching → quiet.
  - Relaunch keeps Sore and its regions. Logout/login: another user starts clean, and switching back restores.
  - Focus: MOOD's Pick, Upper, Lower, Full, muscles, the 3-muscle limit, conflict, reopen.
  - Cart for Strength, Sweat, Athletic, and Strength at Beginner: row Swap, sheet Swap, no_alternative (Athletic), sore reroute, estimated duration, monogram fallback.
- Cart render matrix: 12/12 OK. It checks rx, block order, eyebrow, estimated minutes, and that no text shows undefined or NaN.
- New script: `yarn test:v3-plain`.

## 7. Synced to the Mac

These were written into MoodV10_8. Before writing, I checked every overwritten file on the Mac matched the last synced version.

- **Changed:** build.tsx, workout.tsx, CartBlockView, ConfigSheet, ExerciseSheet, ExerciseThumb, V3Chip, V3Home, v3CartFormat(.test), v3HomeModel, v3PreviewFormat, v3Today, v3TodayModel(.test)
- **New:** BodyMapSheet, TermSheet, v3ExerciseImages, v3PlainLanguage(.test), utils/dev/v3ExplainCorpus.json, the 4 body images in assets/images/body, backend test_no_invented_states.py
- **package.json:** only the one test:v3-plain line was added.
- .env and dev-v3.sh were not touched.

## 8. Remaining issues and decisions

1. **Sweat Different Workout sameness.** This is in the frozen engine and needs your decision. It is launch-level (section 4).
2. **Strength MOOD's Pick first build is the same archetype every day** until completions are recorded. The Guided Session must call /complete.
3. **Engine copy bug.** A frozen Strength low-energy line reads "leaving left out and…". The frontend strips it for now; the source should be fixed during a Strength copy review.
4. **Lower Body: Squat is not a direct Focus pick** (section 5).
5. **Body map figure.** It defaults to the male figure, with a local toggle that is remembered on the device. There is no profile requirement. Decide whether to default the figure from the profile later. The figures are cropped at mid-thigh, so "Legs" covers the upper legs only, which is fine for the engine's single legs region.
6. **Media gaps.** About 15 stills would close most of them (section 2).
7. **Term exposure.** "RPE" still shows in parentheses next to plain effort on Sweat ("Hard effort (RPE 7–8)"), backed by the term card. Say if you want it hidden entirely.
8. **Not yet on a device.** Everything was verified in the web harness and tests. The body map uses react-native-svg press targets, which should get a quick iOS check.
