# feat(gamification): achievement badges, toasts, dual streak, live-feed badges

**Branch:** `feature/badges-gamification` → `wes/onboarding-and-card-revamp`
**Commit:** `c3ffa3ee` · 13 files, +1263 / -3

## Summary

Lightweight, launch-ready gamification for v2. Users earn achievement badges,
get a quiet premium toast on their next home visit, and can review the full
collection on the stats screen. Badges also appear publicly on the Live feed.
Built to sit alongside — never fight — the existing interstitials and paywalls.

## What's included

**Badges (20)** — keyed off the server-reliable *workout-completion* streak:
- Streaks in a row: 3 / 5 / 7 / 14 / 30
- Consistency: 5 of 7 days, 7 of 14 days
- Volume: 1 / 10 / 25 / 50 / 100 workouts
- Difficulty: first Hard, 10 Hard, every level
- Mood: first mood, all moods, 10 mood logs
- Social: first post, "inspiring others" (someone copied your workout)

**Toast** — one lightweight, auto-dismissing gold toast. It:
- Defers to paywalls (`pendingTrigger`) with a cooldown after any paywall closes
- Caps at one per foreground session
- Baselines silently on first load so established users aren't spammed
- Celebrates on the next home-tab focus (earn during a workout → toast on return)

**Dual streak (nested, non-contradictory)** — the home/stats hero keeps the big
forgiving **active streak** (dopamine) and adds a nested **workout streak** chip
("trained X of your last 7 days"). Because a workout day is always an active day,
workout streak ≤ active streak, so the two never disagree. Badges reward the
workout streak.

**Live feed** — badge unlocks render as public gold "BADGE" cards, tracked via a
`badge_earned` event just like other feed activity.

## Architecture

- **Single source of truth:** `GET /api/achievements/state` returns every signal
  the client needs; badge predicates are pure functions
  (`frontend/constants/achievements.ts`).
- **Naming:** namespaced *Achievements* to avoid colliding with the existing
  `BadgeContext`/`useBadges` (notification counts).
- **Client badges** emit their own `badge_earned` events (feed + analytics);
  **server-authoritative** `inspiring_others` is awarded + emitted server-side
  when a workout is copied from another athlete's snapshot (idempotent).

### Files
- `frontend/constants/achievements.ts` — definitions + evaluation
- `frontend/contexts/AchievementsContext.tsx` — engine + gated toast host
- `frontend/components/AchievementMedallion.tsx` — gold emblem with depth
- `frontend/app/user-stats.tsx` — dual-streak hero + badge grid
- `frontend/components/LiveFeed.tsx` — public badge cards
- `frontend/utils/analytics.ts`, `frontend/app/(tabs)/index.tsx`, `frontend/app/_layout.tsx`
- `backend/achievements.py`, `backend/server.py`, `backend/user_analytics.py`

## Design guardrails (recorded)
- Banned the flat mustard yellow-gold colorway; gold is always the gold→orange
  gradient with depth. No gold-on-gold. See `frontend/constants/brand.ts` +
  `memory/DESIGN_GUARDRAILS.md`.

## Testing
- Python: `py_compile` passes for all backend files.
- TypeScript: `tsc --noEmit` shows zero errors in any new/edited badge file
  (only 3 pre-existing, unrelated errors remain in untouched regions).
- Branch built from committed HEAD via a temp index — unrelated WIP is not included.

## Follow-ups
- [ ] Lock the exact banned mustard hex into `FORBIDDEN_COLORS` (placeholder).
- [ ] QA the toast against a live paywall trigger on device.
- [ ] Optional: "showing up" milestone toasts for the active streak (deferred to avoid clutter).
