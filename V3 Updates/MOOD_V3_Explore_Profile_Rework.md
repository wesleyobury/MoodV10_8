# MOOD V3: Explore + Profile rework (Oct 2, 2026)

Social feed and content posting removed from both tabs. Home = what to do today, Explore = what's happening + something to do, Profile = what I've done + progress. Workout generation untouched.

## Files
| Area | File | Change |
|---|---|---|
| Backend | `backend/v3_explore.py` (new) | `GET /api/v3/explore` (Live + Trending), `GET /api/v3/me/activity` (Profile data) |
| Backend | `backend/server.py` | import + mount (2 lines) |
| Backend | `backend/tests/test_v3_explore_samples.py` (new) | sample-session determinism / variety tests (5 pass) |
| Frontend | `app/(tabs)/explore.tsx` | rewritten: Live on MOOD, Trending, MOOD's Picks |
| Frontend | `app/(tabs)/profile.tsx` | rewritten: header, stats, calendar, this week, achievements, Your MOOD, history, saved |
| Frontend | `app/(tabs)/_layout.tsx` | notification / DM badges removed from tabs |
| Frontend | `app/v3/build.tsx` | optional `preset` param (direction, states, target or session type, length) |
| Frontend | `app/v3/workout.tsx` | `completed` param: read-only Cart, Completed summary, Do Again |
| Frontend | `components/v3/ExerciseSheet.tsx` | `onSwap` optional (read-only) |
| Frontend | `utils/v3Explore.ts`, `utils/v3Activity.ts`, `utils/v3ExploreApi.ts` (new) | pure models + fetchers |
| Frontend | `utils/v3Activity.test.ts` (new), `package.json` `test:v3-activity` | 15 tests pass |

Pre-rework copies: `Backups/explore_profile_pre_rework_2026-10-02/`. Screens: `V3 Updates/Explore_Profile_screens/` (web harness, mocked data).

## Live on MOOD
- **Real:** a `workout_started` event (source v3) with no completion / end-early / abandon, and not more than 20 minutes past its estimate. First name and avatar only.
- **Sample:** a pure function of the clock. No scheduler and no stored rows. Each 5-minute slot gets a random (Poisson) number of starts, driven by the time-of-day curve (US Central), a 30-minute busy/quiet wave and a daily factor. Every session gets its own Direction, States, focus, length and pace. All clients see the same sessions. Samples fill only the gap left by real sessions: `cap = 8 - 2 × real`.
- **`EXPLORE_SYNTHETIC` env:** `labeled` (default, production) shows no name or face plus a SAMPLE tag and a footnote. `realistic` (dev/staging) adds names. `off` shows real sessions only.

## Trending
Counts come only from real V3 completions (24h, else 7d, minimum 12 completions). Otherwise the section shows "Quick starts" with no numbers. Tapping a trend opens Build with a preset.

## Profile data rules
- Totals, calendar, streak: all `user_workouts` rows (V2 + V3).
- Time: only recorded `duration_actual`.
- History, Your MOOD, Direction achievements: V3 only.
- Your MOOD: hidden below 3 V3 workouts or fewer than 2 supported insights.
- Week streak: an empty current week doesn't break it until the week ends.

## Known limits
- The generator builds only 30 or 60 minute sessions, so presets use those lengths, not 45.
- Do Again carries Direction + focus + length. States are chosen fresh.
- The old `/api/feed/live` and the social screens are left in place but unreachable from the tabs.

## Pass 2 (Oct 3): founder feedback

1. **Explore is the V2 Live page again.** The "Explore" header, the Live tab strip and `components/LiveFeed` (stats header, LIVE NOW / completion / milestone / badge cards, Try this workout) are back. Trending and MOOD's Picks are gone from the tab. Changes to `/api/feed/live` (server.py):
   - V3 events (metadata.source v3) show as Strength / Sweat / Athletic in the existing palettes.
   - V3 workouts are named the way the Cart names them, and Try this workout opens Build with a preset.
   - V3 completions now count toward "most common mood".
   - Sample rows (`v3_explore.feed_samples`) fill the feed only up to ~15 rows. A sample counts as LIVE NOW if it started under 20 minutes ago, otherwise as a completion within the last 6 hours. In production they show no name or face, carry a SAMPLE tag and a footnote, and are never counted in "sessions today". `EXPLORE_SYNTHETIC` still controls them.
   - `/api/v3/explore` stays on the server but the app no longer calls it.
2. **Saved page.** New screen `app/saved.tsx`, opened from a Saved row under the Profile stats that's always visible:
   - V3 saves open a fresh copy in the Cart.
   - Featured saves open the featured workout page.
   - Older custom saves load into the cart.
   - The x button or a long-press removes an entry.
3. **Completed workouts show the completion stats screen.** It's the Guided Session's own "Share your workout" screen (`CompleteScreen` Share, now exported), rebuilt from `GET /api/v3/me/completed/{id}` (new). It shows min, cal and heart rate, the Rings / Simple / Heart rate overlays, and Instagram Story / Share. Edits save through `/after`. It opens from:
   - the Stats button next to Do Again on a completed workout's Cart;
   - Stats on each Profile history row.
4. **Profile bio.** `profileBio` in `utils/v3Activity.ts` builds the paragraph from the user's own history:
   - identity from their main Direction, or "well-rounded" when no Direction has half;
   - workouts logged since the first month;
   - usual time of day and typical length;
   - favorite focus and most common State;
   - best day streak;
   - a motivational closing line.
   It uses only neutral or positive phrasing, with no comparisons and no "only", "rarely" or "should". Tests check for these words. It's deterministic, so the text doesn't change between visits.

## Pass 3 (Oct 3): Live page polish
- **Intro copy** at the top of the Live feed (`LIVE_INTRO` in LiveFeed.tsx). It shows on the empty state too.
- **Detail line** on cards: States · exercises · sets (completions) · level, plus est. minutes on LIVE NOW cards. Real V3 rows get it from the workout doc (`v3_explore.feed_details`). Sample rows get matching sample details. V2 rows are unchanged.
- **Try this workout shimmer:** a gold light band sweeps each button every few seconds, staggered down the list (reuses `components/v3/Shimmer`).

## Pass 4 (Oct 3)
- **Explore intro** is now a headline plus one line: "See who's training." / "Like what you see? Tap it. MOOD builds your version."
- **Profile bio removed.** In its place is one goal line from the funnel (training_profile.goal): "MOOD is here to help you **build real strength**." There is a phrase for each goal, and a generic line when no goal is on file (`goalLine` in `utils/v3Activity.ts`, tested).

## Pass 5 (Oct 3)
- **Profile goal paragraph** (`goalBio`, tested). The goal sentence comes first, then up to two lines on how MOOD helps:
  - their typical State, taken from their own history once it appears at least twice;
  - the barrier they named in the funnel (`training_profile.biggest_barrier`);
  - otherwise "Every workout is built around how you feel that day."
  A Low Energy barrier plus a Low Energy State shows one line, not both.
- **Sample sessions** never pair States that clash (Amped + Low Energy, Amped + Sore).
