# MOOD V3 · Home, Generate, Cart · Phase Zero

Inspection and recommendation only. No code changed. Repo inspected: `MoodV10_8` on `feature/mood-v3-app-rehaul` (HEAD `aad9404c`, plus the uncommitted Athletic freeze work). Workout programming (Strength, Sweat, Athletic) is treated as frozen and is not reopened here.

---

## TL;DR

1. **The biggest finding is not about Home.** V3 has no way to finish a workout. `Start Workout` opens a placeholder (`app/v3/session.tsx`), and nothing calls `POST /api/v3/workouts/{id}/complete` or `/api/user-workouts`. So for V3 users, streak, counts, minutes, history, MOOD's Pick rotation and progression all stay frozen at their V2 values. A Home built around "how have I been doing" and "continue" has nothing live to show until a session records completion. **Home and Cart can be built now, but they cannot ship to users before a minimal Guided Session exists.** (Decision 1.)
2. **Hero:** recommend **Concept C, the "Today" hero.** It is a full-bleed Direction image with the State chips on it, and it changes shape across the day: *Build* → *Today's workout* → *Continue* → *Done*. It uses existing assets and the existing today-cache. The hero is where the resume logic lives, so there is no separate "Continue" section.
3. **Discovery:** **Quick Starts is the right second object.** It is technically clean because the V3 generate endpoint accepts a fully specified request (direction + archetype/target + duration). Launch with 8 curated presets hardcoded in the app. **Presets never set State**; they inherit whatever chips the user tapped in the hero.
4. **Cart:** replace today's Preview + Details pair with one Cart screen. It opens read-first and has an Edit mode. At launch: Swap (the endpoint exists), Remove, Reorder within a block, and Different Workout. The primary block of every Direction is locked in place. Edits persist through one new backend `edit` endpoint.
5. **V2 reuse is less than it looked.** The V2 cart has no swap, no drag, no sets/reps on rows, and groups by string-parsing `workoutType`. What's worth carrying over is the *visual* system: the hero header, the carousel card, the stat count-up and the wearables tiles. The V3 `components/v3/*` rows and blocks are the better foundation for Cart content.

---

## 1. Current-state audit

### 1.1 V2 Home (`app/(tabs)/index.tsx` → `V2WorkoutsHome`, lines 683-1398; still shown to guests)

Top to bottom:

| # | Section | Source |
|---|---|---|
| 0 | `HomeBackground`: SVG radial gradient + faint grid. **No hero image or video.** | none |
| 1 | Brand header: pulsing icon, "MOOD" wordmark, "TRAIN HOW YOU FEEL DAILY", time-of-day greeting | `useAuth().user.name` |
| 1b | "Synced 2m ago" | `HealthSyncIndicator` / `useHealth` |
| 2 | Free-allowance chip | `useSubscription` |
| 3 | Stats row: WORKOUTS · MINUTES · STREAK with count-up animation (`AnimatedStat`) | `GET /api/users/me/stats`. **Caveat:** this `current_streak` counts *app-open days*, not workout days. |
| 4 | Wearables tiles: calories (last workout), steps, resting HR, sleep (`WearablesSnapshot`) | HealthKit snapshot (device-only) + `home-summary.last_workout_calories` |
| 5 | **Featured Workouts carousel** (`WorkoutCarouselCard`): full-width 280pt cards, Cloudinary hero, badge, bookmark, auto-advance every 4s, animated dots | `GET /api/featured/bundle` (admin-curated, V2 exercise lists) |
| 6 | "Choose your MOOD": 6 glass mood cards | hardcoded |
| 7 | Social links (IG, TikTok, site) | static |

The "featured imagery did a lot of visual work" memory is correct: the carousel is the only image-forward element on V2 Home. There is no resume card (it was removed in V2.1, and the `resumeCard` reference in `CLAUDE.md` is stale). There is no feed on Home.

### 1.2 Current V3 Home (`components/v3/V3Home.tsx`; all signed-in users)

It is a form page: date eyebrow, "Today's workout" H1, an optional "Today's workout" reopen card, 6 State chips (+ sore regions), 3 Direction cards (icon only), a config row (Focus / Workout Type / Difficulty / Length in a sheet), and a sticky **Build workout**. There are no images, stats, discovery or community. This is the "launches straight into workout creation" problem. The underlying logic is good and reusable (defaults from profile, last-used Direction, first-visit barrier prefill, conflict sheet, request signature → reopen today's workout).

### 1.3 Current V3 post-generation

- **Preview** (`app/v3/workout.tsx`): title, meta, State chips, a BUILT FOR TODAY card (uses a gold wash fill, which breaks the CLAUDE.md design rule), `PreviewSections` (a structure-aware flat list with A1/A2, ANCHOR and station tags, **no thumbnails, no muscles**), Different workout, Details, Start.
- **Details** (`app/v3/details.tsx` → `WorkoutOverview` / `BlockCard` / `ExerciseRow`): thumbnails with a monogram fallback, prescriptions, rest, load guidance, cues, and **Swap** (the only edit that exists).
- **Start** → `app/v3/session.tsx`, a placeholder list. There is no timer, no logging, no completion call and no paywall gate.

### 1.4 V2 Workout Cart (`app/cart.tsx`, 2,213 lines)

What it has:
- 240pt hero image. The source is the featured `heroImageUrl`, else the first exercise's image (`utils/cartHero.ts`, tested).
- Mood label and a random title from pools.
- `~N min` badge.
- Flavor badge with a variation dropdown.
- Rows grouped by **muscle/sub-path dividers parsed from strings**. Each row shows thumbnail, equipment, name, a duration string, role label, up/down chevrons and remove.
- Add Exercise (a free-text form), Send to Friend, and a bottom bar with Save / **Start** / Skip.

What it does **not** have (verified in code):
- no per-exercise swap (Skip replaces the whole cart);
- no drag reorder (the library is installed but only used in admin);
- no sets × reps or rest on rows (they're buried in free-text `battlePlan`);
- no muscle/body UI beyond divider labels;
- no sets/reps editing.

The live V2 session is `app/workout-guidance.tsx` (one pushed screen per exercise, with route params as state). `app/workout-session.tsx` is **unreachable and broken** (it renders `<Toast>` without importing it), but it holds the good plumbing: live HR, abandon analytics, Pulse Sync, HealthKit session metrics, and draft completion.

So the V2 cart you remember is mostly a *feel*: hero image, clean list, big Start. The editing depth was thinner than it seemed. V3 already exceeds it on structure and swap.

---

## 2. Reuse map

| Item | Verdict | Notes |
|---|---|---|
| `components/v3/V3Home.tsx` input logic (chips, Direction, ConfigSheet, ConflictSheet, defaults, request signature) | **Adapt** | Split into the Home hero (chips only) and a Build screen (everything else). The logic moves; it doesn't get rewritten. |
| `utils/v3HomeModel.ts`, `v3Api.ts`, `v3Profile.ts`, `v3PreviewFormat.ts`, `v3OverviewFormat.ts` | **Reuse directly** | Preset requests go through the same `buildRequest`. |
| `utils/v3Today.ts` | **Adapt** | It holds one entry today. Change it to hold today's builds keyed by signature, so Quick Starts don't overwrite each other. |
| `components/v3/PreviewSections`, `BlockCard`, `ExerciseRow`, `ExerciseThumb` | **Adapt → Cart body** | Merge into one Cart block/row system: Preview's structure-aware grouping + Details' thumbnail row. Add a muscle tag (`primary_muscles` already exists and is unused). |
| `components/v3/WorkoutOverview`, `app/v3/workout.tsx`, `app/v3/details.tsx` | **Replace** with one Cart screen | Keep the Different Workout and Swap handlers. |
| V2 `WorkoutCarouselCard` + `CarouselDots` (local to `index.tsx`) | **Adapt (extract)** | This is the premium carousel feel you liked. Shrink to a peeking card (about 78% width) so the next card is visible. |
| V2 `AnimatedStat` | **Reuse (extract)** | For Your Training. |
| V2 `WearablesSnapshot` | **Adapt (extract)** | Compact version, shown only when Health is connected. |
| `HealthContext`, `HealthSyncIndicator` | **Reuse directly** | |
| `HomeBackground` | **Reuse directly** | Under the scroll content below the hero. |
| `utils/cartHero.ts` (+test) | **Adapt** | Add a V3 source: Direction/archetype → curated image. |
| `utils/cloudinaryImage.ts` `optimizedImageUrl` | **Reuse directly** | |
| `OptimizedImage`, `Skeleton`, `GradientButton`, `SafeLinearGradient`, `BackButton` | **Reuse directly** | |
| `ExerciseLookupSheet` | **Adapt** | Exercise video/tutorial viewer from a Cart row; later the library picker for Add. |
| `LiveFeed` / `GET /api/feed/live` | **Reuse endpoint only** | For a one-line community strip; the full component stays in Explore. |
| `AchievementMedallion` | **Later** | Not needed on Home at launch. |
| `workout-guidance.tsx` timer card, set dots, stat tiles, `TutorialGrid`, `workoutStartGate`, `markWorkoutCompleted` | **Reuse in Guided Session** | Session phase, not this one. |
| `workout-session.tsx` HR stream / analytics / Pulse Sync | **Move logic into Guided Session**, delete screen | |
| V2 cart list, grouping, Skip, random titles, `AddCustomExerciseModal`, `CustomWorkoutModal`, `GeneratedWorkoutView`, `WorkoutCard` | **Discard** | String-parsed V2 taxonomy; nothing survives contact with V3 blocks. |
| V2 Featured Workouts backend + admin | **Keep running for guests; not used by V3 Home** | Possible future home for remotely managed presets (post-launch). |
| V2 "Choose your MOOD" cards | **Discard** | Replaced by the hero chips. |

### Assets

| Asset | Where | Use |
|---|---|---|
| 8 landscape hero images (2048×1152): HIIT, back & bis, cardio/bike, chest & shoulders, explosive, glute day, hill run, park calisthenics | `Branding/Hero Images` and already on Cloudinary (`mood_app/featured_heroes/*`, `backend/featured_hero_map.json`) | Quick Start cards, Cart hero |
| 5 portrait payoff images (≈1120×1400): muscle, sweat, explosive (sled), calisthenics, outdoor run | bundled in `frontend/assets/images/payoff/` | **Home hero** (portrait fits a tall hero) |
| `bg.mp4` (4.4 MB) | bundled; used on splash/onboarding | Optional hero video (see §4) |
| App Store panels / raw shots (≈60) | `Branding/App Store Content` | Probably reusable crops; not required |
| MOOD male/female front/back body figures | `Branding/Other Assets` | Future soreness/body map; not launch |
| Exercise media | `db.exercises` (`video_url`, `thumbnail_url`), fuzzy-matched by name in `router.attach_media` | **Coverage unknown in production.** The Phase 2 pack ran offline (all `null`). Measure before relying on thumbnails (Phase 3 task). |

**Image coverage by Direction.**
- **Strength:** 4 images (chest/shoulders, back/bis, glutes, payoff-muscle).
- **Sweat:** 4 (HIIT, bike, payoff-sweat, hill run).
- **Athletic:** 3 or 4 (explosive, sled, park calisthenics, payoff-calisthenics).

Enough to ship. Some repetition across 8 cards is acceptable. About 6 more images (lower hinge, arms, sprint, med-ball throw, rower, full-body barbell) would remove the repetition and can come after launch.

---

## 3. Proposed V3 Home

### Hierarchy

1. **Today hero** (dominant, about 62% of the first screen): answers *what should I do today* and *continue*.
2. **Quick Starts** carousel: answers *can I start quickly*.
3. **Your Training** (compact): answers *how have I been doing*.
4. **Community strip** (one line): answers *what else is happening*.

There are no more sections than these. There is no feed on Home.

### Text wireframe

```
┌─────────────────────────────────────────┐
│ [full-bleed portrait image, Direction]  │
│                                         │
│  MONDAY · SEP 28                    (●) │  ← avatar → Profile
│                                         │
│  Evening, Wes.                          │
│  Day 4. Last session: Sweat, Saturday.  │  ← only real data; hidden if none
│                                         │
│  How are you showing up?                │
│  [Low Energy] [Amped] [Stressed]        │
│  [Bored] [Irritated] [Sore]             │  ← optional, max 3, carried forward
│                                         │
│  ┌───────────────────────────────────┐  │
│  │      BUILD TODAY'S WORKOUT   →    │  │
│  └───────────────────────────────────┘  │
│  Strength · 60 min · MOOD's Pick        │  ← live summary line, tap = Build
├─────────────────────────────────────────┤
│ QUICK STARTS                    See all │
│ ┌──────────────┐ ┌──────────────┐ ┌──   │
│ │ [image]      │ │ [image]      │ │     │
│ │ STRENGTH     │ │ ATHLETIC     │ │     │
│ │ Upper Push   │ │ Power        │ │     │
│ │ 60 min       │ │ 45-60 min    │ │     │
│ └──────────────┘ └──────────────┘ └──   │
├─────────────────────────────────────────┤
│ YOUR TRAINING                           │
│   3            4 days        142        │
│   this week    streak        min / wk   │
│  ───────────────────────────────────    │
│  Last: Upper Pull · Strength · Tue  →   │
│  ♥ 58 rest  · 7h 10m sleep · 8,412 steps│ ← only if Health connected
├─────────────────────────────────────────┤
│ ● 37 people trained with MOOD today  →  │ → Explore
└─────────────────────────────────────────┘
```

### Interaction model

- **Chips are optional.** Tapping a chip only records it; it doesn't navigate. The chips carry into Build and Quick Starts. Sore does not open regions on Home; regions are asked for on the Build screen, or in a small sheet when a Quick Start is tapped while Sore is selected.
- **Primary CTA → Build screen** (§6).
- **Quick Start card → generate → Cart** in one tap.
- **Your Training → existing `user-stats` screen.** The Last row reopens that workout's summary (later).
- **Tab bar:** keep Explore / Workouts / Profile, and rename the centre tab to **Home** (I'll do this unless you object).
- **Guests** keep the V2 Home. V3 generation requires auth, so it's unchanged.
- **Chip selections persist for the day** (a small AsyncStorage key) so returning to Home doesn't lose them. This fixes the Phase 2 known issue.

This keeps your earlier call that the mood input stays on the surface of Home and isn't hidden behind an Adjust button, while keeping Direction, Focus and Length off Home.

---

## 4. Hero recommendation

| | A. Training Hero | B. Dynamic Workout Hero | C. Today Hero (recommended) |
|---|---|---|---|
| **User sees** | Cinematic athlete image or `bg.mp4`, greeting, "Build today's workout" | A pre-generated recommended workout: title, meta, 3 exercise names, Start | Portrait Direction image, greeting + real context line, State chips, Build CTA, live summary line |
| **Changes dynamically** | Image by time/day | The workout itself (MOOD's Pick for the default Direction) | Image follows the user's default/last Direction. Hero content changes by day state: **Build** → **Today's workout** (after generating) → **Continue** (once a session is in progress) → **Done today** |
| **Tap** | → Build screen | → Cart for that workout | CTA → Build screen. In the later states → Cart / Session |
| **Complexity** | Low | Medium: generate on every Home load (or cache), handle stale builds and engine changes, plus a waste doc per open | Low-medium: existing today-cache + portrait images; the Continue state waits for the session |
| **Assets / data** | Yes | Data is weak: MOOD's Pick has no V3 history until completions exist, so the "recommendation" would be profile-only | Yes: payoff portraits, `useAuth` name, today-cache, streak/last session once completions exist (context line hidden until then) |
| **Weakness** | Pretty but passive. It doesn't use MOOD's core idea. | Shows a workout *before asking how you feel*, which contradicts "mood in, workout out". Also looks like every fitness app's "Today's plan". | Two rows of chips add text weight to an image hero. Mitigation: chips on frosted glass, bottom-aligned, image top-weighted. |

**Recommend C.** The hero's job is to invite the workout, and MOOD's invitation is *how are you showing up today?* C makes that question the memorable object, sets it on premium imagery, and turns the hero into a resume card as the day moves on, which removes the need for a separate Continue section. A's cinematic quality is included in C's image layer. B's idea returns in C's "Today's workout" state, but only after the user has told MOOD how they feel.

**Motion (subtle):**
- a slow 1.03 scale drift on the hero image;
- the image crossfades when the default Direction changes;
- chips give a light haptic;
- the summary line animates its text change.

**`bg.mp4` in the hero:** optional, and off by default. Its content is shared with onboarding, and autoplay video on every Home open costs battery and attention. Revisit after launch.

---

## 5. Discovery recommendation

**Keep Quick Starts as the second object.** The technical check came back clean:

- `POST /api/v3/workouts/generate` accepts `direction`, `archetype` **or** `target`, `duration`, `states`, `soreness`. Nothing is required; profile fields (experience, goal, frequency, equipment) are filled server-side automatically and reported in `profile_defaults_applied`.
- Generation takes about 1-11 ms server-side and is seeded by user + date + swap_count, so a preset tapped twice on one day reopens the same workout (via request signature).
- Each tap stores a `v3_workouts` doc with `status: generated`, so the Cart, swap, edit and complete flows all work the same as the main flow.
- The one change needed is that `v3Today` holds one entry, so a Quick Start currently overwrites today's main build. Fix: keep a small per-signature map for today.

### Preset rules

| Question | Answer |
|---|---|
| Inputs the preset controls | `direction` + `archetype` (or `target` for Strength/Sweat muscle presets) + `duration` |
| Inputs from the user | States and soreness (from the hero chips, if any); experience, goal, frequency, equipment (from profile, server-side) |
| Should State ever be preset? | **No.** State is the user's truth about today, and a card claiming it ("Low Energy Strength") contradicts the thesis and your "substitute, not subtract" rule. Cards inherit the hero chips instead. If chips are selected, the card shows a small "Shaped for Stressed" line so the user sees that it adapts. |
| Titles | Must match what the Cart will say. Card title = archetype name (or target label), the eyebrow is the Direction, and the meta is the duration. **No marketing titles that the workout can't back up** (e.g. "Heavy" isn't guaranteed by the engine). |
| Images | Static map, `archetype_id → image` (§2 assets) |
| How many | **8 at launch** |
| Rotation | Deterministic daily order: presets from the user's default Direction first, then the others interleaved, seeded by date. Hide the preset matching today's already-built workout. |
| Personalization | **Post-launch**, once V3 completions exist (e.g. surface the archetype that's "due" from MOOD's Pick rotation, and the user's most-completed Direction). |
| Where configured | A TS constant in the app at launch. Later, optionally move to `featured_config` for remote edits. |

**Proposed launch set (8):**

| # | Eyebrow | Title | Request | Image |
|---|---|---|---|---|
| 1 | Strength | Upper Push | `strength_upper_push`, 60 | chest & shoulders |
| 2 | Strength | Upper Pull | `strength_upper_pull`, 60 | back & bis |
| 3 | Strength | Glutes + Legs | `strength_glutes_legs`, 60 | glute day |
| 4 | Strength | Full Body | `strength_full_body`, 30 | payoff-muscle |
| 5 | Sweat | Circuit | `sweat_circuit`, 30 | HIIT |
| 6 | Sweat | Engine | `sweat_engine`, 60 | bike |
| 7 | Athletic | Power | `athletic_power`, 60 | explosive |
| 8 | Athletic | Speed + Plyo | `athletic_speed_agility`, 30 | hill run / sled |

Some of your examples need adjusting. "Explosive Full Body" maps to Athletic *Full-Body Athlete* and is a fine swap-in for #8 if you prefer it. "Heavy Upper" becomes *Upper Push* unless the engine guarantees heavy loading. "Low Energy Strength" is dropped (State isn't preset).

### Alternatives considered

1. **Direction trio tiles** (three large image tiles: Strength / Sweat / Athletic → Build screen with the Direction preset). Simpler and very clean. But it only moves one step of the Build screen onto Home, and it provides no discovery. It's a fallback if the carousel feels redundant with the hero.
2. **"Due next" single card**: MOOD's Pick's next archetype from rotation ("Your next Strength session: Lower Body: Hinge"). This is more personal and very MOOD. It needs V3 completion history to be honest, so it's **post-launch**, likely as the first card of the carousel.
3. **Weekly plan strip** (Mon-Sun with a suggested Direction per day). Valuable eventually, but it's program-like, contradicts the daily-fresh positioning, and has no data behind it. Not recommended.

---

## 6. Workout creation flow

```
HOME ── tap chips (optional) ── [BUILD TODAY'S WORKOUT]
   │
   ▼
BUILD (full-screen sheet, everything preselected)
   1. Direction   three image cards; preselected = last used → profile default
   2. State       chip row carried from Home (editable); Sore → region chips (required)
   3. Focus       "MOOD's Pick" (default) · Change → Target / Workout Type (Strength, Sweat) · Type only (Athletic)
   4. Length      60 | 30  (default: profile default_duration; see note)
   [BUILD WORKOUT]            ← one tap if defaults are fine
   │  (build transition: ~600 ms branded moment; real latency is ms)
   ▼
CART
   │
   ▼
[START WORKOUT] → Guided Session
```

- **Tap counts:** CTA → Build → Cart is **2 taps**. Quick Start → Cart is **1 tap**.
- **Not asked** (auto from profile/history, server-side): experience, goal, frequency, equipment, archetype selection under MOOD's Pick, Direction default.
- **Difficulty** stays inside Focus → Change as the existing "today only" override, never on the main sheet.
- **Conflicts** (e.g. Sore + a targeted muscle) use the existing `ConflictSheet` unchanged.
- **Reopen rule** unchanged: same inputs on the same day reopen today's workout instead of regenerating.
- **Note:** V3Home currently hardcodes 60 min and ignores the profile's `default_duration`. I'll use the profile value (falling back to 60). This is a small fix, not a decision.

---

## 7. Workout Cart

### Hierarchy

```
┌─────────────────────────────────────────┐
│ [hero image · Direction/archetype]   ⋯  │  ⋯ = Different workout · Share · Save
│ STRENGTH · Stressed                     │
│ Upper Pull                              │
│ ~52 min · Intermediate · Back, Biceps   │  ← estimated minutes · experience · muscles
├─────────────────────────────────────────┤
│ BUILT FOR TODAY                     ˅   │  2 lines, expandable (neutral surface, no gold wash)
├─────────────────────────────────────────┤
│ Warm-up · 7 min                     ˅   │  collapsed
│                                         │
│ 1 · MAIN LIFT                     🔒    │  ← block title from API; locked blocks show a quiet lock only in Edit
│  [thumb] Lat Pulldown                   │
│          4 × 8 · rest 2 min · Back      │
│ 2 · SUPERSET · 3 rounds                 │
│  A1 [thumb] Chest-Supported Row  ...    │
│  A2 [thumb] Face Pull  ...              │
│ 3 · FINISHER                            │
│  ...                                    │
│ Cool-down · 5 min                   ˅   │
│                                         │
│ 7 exercises · 18 working sets           │
├─────────────────────────────────────────┤
│        [ START WORKOUT ]          Edit  │
└─────────────────────────────────────────┘
```

- **Block names come from the API** (`block.title`, which is already Direction-specific). There are no forced shared section names.
  - Strength: Main lift / Secondary / Target / Accessory / Finisher.
  - Sweat: Primary / Complement / Finisher, rendered as Circuit / EMOM / Intervals / Hybrid-anchor.
  - Athletic: Primary exposure / Secondary / Strength / Support / Finisher.
- **Row:**
  - thumbnail (`ExerciseThumb`, monogram fallback);
  - name;
  - `prescription.display`;
  - rest (straight sets only);
  - one muscle tag from `primary_muscles`;
  - A1/A2, ANCHOR or station tag from the existing formatter.
- **Row tap → exercise sheet:** video/tutorial (via `ExerciseLookupSheet`), cues, load guidance, quality stop, and a Swap button.
- **Read-first.** The Cart opens as a calm plan. **Edit** reveals handles, remove and swap on every row. Swipe-left on a row gives Swap / Remove without entering Edit mode.
- **Different workout** stays (existing endpoint) in the ⋯ menu and at the bottom of the list.
- This replaces both `/v3/workout` and `/v3/details`; Details content becomes the row sheet.

### Edit classification

| Edit | Class | Rule |
|---|---|---|
| View / expand cues / play video | Unrestricted | |
| Swap exercise | **Backend-revalidated** (exists) | `POST /swap-exercise` keeps slot intent and constraints; repeated taps cycle alternatives. `no_alternative` shows an inline message. |
| Different workout | **Backend** (exists) | Same inputs, new archetype or exercises |
| Remove accessory / support / secondary / finisher item | Unrestricted (persisted) | Totals and minutes update. If the session drops below about 60% of planned working sets, show a quiet note: "Lighter than planned." |
| Remove one half of a superset | Structure-aware | The partner becomes straight sets; rest is recomputed server-side |
| Remove a Sweat circuit station | Structure-aware | The circuit keeps at least 2 stations. The anchor of a Hybrid can't be removed, only swapped. |
| Remove a primary item (Strength main lift, Sweat primary, Athletic primary exposure) | **Constrained** | Swap only, no remove. "Replace, don't remove" keeps the protected primary intact. |
| Reorder items within a straight-set accessory block | Unrestricted | |
| Reorder A1/A2 within a superset | Structure-aware | Allowed (swap order) |
| Reorder stations within a circuit | Structure-aware | Allowed. Not allowed in EMOM / Intervals / Hybrid (time-slot and anchor semantics). |
| Move an item across blocks | **Constrained** | Not at launch |
| Reorder blocks | **Constrained** | The primary block is locked first in all Directions (Athletic power before strength, Strength main lift first, Sweat primary first). Finisher is locked last. Middle blocks may reorder. |
| Add exercise | **Backend-revalidated** (new) | Library filtered to the block's intent. The engine assigns the prescription for that slot class. Allowed only in accessory / support / finisher blocks; max 2 per session; blocked for plyo/contact moves in Athletic (contact limits). **Launch vs fast-follow = Decision 3.** |
| Edit sets / reps | Later | Stepper within the slot band (from the reassessment §20). Not needed to ship. |

**How edits persist:** one new endpoint, `POST /api/v3/workouts/{id}/edit` with `ops: [{op:'remove', item_id} | {op:'move', item_id|block_id, to}]`. It:
- applies the rules above server-side (so they're enforced, not just hidden);
- re-runs time estimation;
- bumps `version`;
- returns the envelope, like swap does.

The Cart does an optimistic update, then reconciles. The session and `/complete` then always operate on what the user actually sees. That makes 1 new endpoint rather than the 5 in the reassessment; add-item is the second, if approved.

---

## 8. Data map

Critical dependency: every "live" number below needs V3 completion wired to write:
1. `POST /api/v3/workouts/{id}/complete`,
2. `POST /api/user-workouts`,
3. the `workout_completed` analytics event (which drives `rt_streak`).

Without those, V3 users' numbers freeze.

| Home element | Source | Exists today? | Fallback | Launch / later |
|---|---|---|---|---|
| Greeting name | `useAuth().user.name` | Yes | "Today" | Launch |
| Hero image | Static map from default/last Direction (`@mood_v3_last_direction_v1`, `training-profile.default_direction`) | Yes | Strength image | Launch |
| Context line, streak part ("Day 4") | `GET /api/achievements/state` → `workout_streak` (real workout streak, `retention.py`) | Yes, V2 completions only until wiring | Hidden if 0 | Launch |
| Context line, last session part | `GET /api/v3/workouts/history?limit=1` | Endpoint yes, always empty today | Hidden | Launch (fills after session) |
| Hero "Today's workout" state | `@mood_v3_today_v1` + `GET /v3/workouts/{id}` | Yes | Build state | Launch |
| Hero "Continue" state | New local session-progress key written by Guided Session | **No** | Today's workout state | With Guided Session |
| Hero "Done today" state | V3 history (completed today) | Endpoint yes, empty until wiring | Build state | With Guided Session |
| State chips | Local, persisted for the day | Add small key | none selected | Launch |
| Quick Starts | App constant + image map | Build | none | Launch |
| This week (workouts) | **New** `GET /api/home/summary` (count of `user_workouts` in the last 7 days) | Partially (`workout_days_last_7` counts days; `analytics/workout-stats?days=7` exists but is heavier) | Show "0 this week" | Launch (1 small endpoint) |
| Streak | `achievements/state.workout_streak` (fold into summary) | Yes | 0 | Launch. Do **not** use `current_streak` from `/users/me` (app-open days). |
| Minutes this week | Same new summary (sum `duration_actual`) | **No weekly aggregate** | Hide | Launch |
| Last workout row | `v3/workouts/history?limit=1`, else latest `user_workouts` | V3 empty; V2 rows lack titles | Hide | Launch |
| Direction mix | `v3_workouts` completed, grouped by direction | Data model yes, no data | Hide until 3 or more V3 completions | Later |
| Wearables row | `useHealth().snapshot` (resting HR, sleep, steps; HRV) | Yes, **device-only** | One quiet "Connect Apple Health" link, dismissible | Launch |
| Last-workout calories | `home-summary.last_workout_calories` | Yes (V2 sessions) | Hide | Later (with session HR) |
| Community strip | `GET /api/feed/live` → `sessions_today` | Yes | Hide below about 5 | Launch |
| Achievements / badges | `achievements/state` | Yes, but mood/difficulty badges are V2-keyed | none | Later |
| State history ("you've been Stressed 3× this week") | `v3_workouts.state.request.states` | Stored, no endpoint | none | Later (nice, not needed) |
| Featured (V2) | `featured/bundle` | Yes | n/a | Not used on V3 Home |

No element on the launch Home shows invented personalization. Anything without data is hidden, not faked.

---

## 9. Implementation plan

The smallest sequence. Each phase is shippable to TestFlight and reviewable on its own.

| Phase | Scope | Size |
|---|---|---|
| **H1 · Home + Build** | Split `V3Home` into `HomeScreen` (Today hero in Build/Today states, chips persisted per day) and `BuildScreen` (Direction image cards, carried States, Focus, Length). Multi-entry today cache. Profile default duration. Rename tab to Home. The hero image map. | M |
| **H2 · Cart (read-first)** | One Cart screen replacing Preview + Details: hero, Built for Today (collapsed, neutral surface), API-titled blocks, merged row with muscle tag, row sheet (cues, video via `ExerciseLookupSheet`), Swap, Different workout. Measure production media coverage and fix aliases if it's low. | M |
| **H3 · Quick Starts** | Preset constant, extracted V2 carousel card (peeking layout), generate → Cart, "Shaped for …" line, daily order. | S |
| **H4 · Cart edits** | Backend `edit` endpoint (remove, move) with Direction rules + tests in `mood_v3/tests`. Frontend Edit mode + swipe actions. Add-item only if Decision 3 says launch. | M (+S for Add) |
| **S1 · Guided Session MVP** *(launch gate; detailed in its own Phase Zero)* | Block-aware session that walks the V3 envelope. Timer/set dots from `workout-guidance`. Completion writes `v3 complete` + `user-workouts` + `workout_completed`. Paywall via `workoutStartGate`. Local progress key (enables Continue). | L |
| **H5 · Your Training + community** | `GET /api/home/summary` (week count, week minutes, workout streak, last V3 workout, sessions_today). Extracted `AnimatedStat`, compact wearables row, community strip. Hero Continue/Done states. | S |

Order: **H1 → H2 → H3 → H4 → S1 → H5**. H5 goes last because it only becomes meaningful once S1 records completions. It's small enough to land in the same release.

---

## 10. Decisions needed from you

1. **Launch gate: Guided Session.** V3 users currently can't finish a workout, and nothing records completion. Options:
   - **(a)** Hold the V3 release until a lean Guided Session (S1) ships with Home + Cart. **(Recommended.)**
   - **(b)** Temporarily route Start into the V2 `workout-guidance` player by flattening the V3 workout. Faster, but supersets and circuits degrade, and it's throwaway work.
2. **State chips on the Home hero.** I've recommended them on the hero (consistent with your earlier "don't hide the mood input" call), with Direction, Focus and Length on the Build screen. Confirm, or say if you'd rather the hero carry only the CTA and keep chips on the Build screen.
3. **Add Exercise at launch or fast-follow.** Swap, Remove, Reorder and Different Workout are in the launch Cart either way. Add needs a new engine endpoint + library picker (roughly +1 phase-sized chunk). I recommend fast-follow.
4. **Quick Start lineup.** Approve the 8 presets in §5 (or swap any), including dropping "Low Energy Strength" and not using "Heavy" in titles unless the engine guarantees it.

Everything else (tab rename, preset storage, edit endpoint shape, image mapping, the gold-wash fix, stale CLAUDE.md reference) I'll resolve during implementation.
