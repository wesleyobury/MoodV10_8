# MOOD — Design guardrails

## ⛔ Forbidden design rules (never violate anywhere in the app)

1. **Banned colorway — mustard yellow-gold.** A flat, single-tone muted
   gold/mustard-yellow (the barbell reference icon Wes flagged, 2026-07-01).
   Reads cheap and off-brand. The gold accent must always be the vibrant brand
   gradient `#FFD700 → #FFA500` (`BRAND_GRADIENT` in
   `frontend/constants/brand.ts`), applied with depth — outer glow, inset top
   highlight, inset bottom shadow. Never a flat mustard fill. Exact banned hex
   TBD (Wes: "that mustard yellow"); lock into `FORBIDDEN_COLORS` when known.

2. **No gold-on-gold.** Never place gold text + a gold emblem/icon on a
   transparent or gold background — that low-contrast gold-on-gold combo is
   banned everywhere. Gold emblems use dark ink (`accentInk`); gold text only
   sits on dark (bg/surface) backgrounds.

## Badges / gamification (v2)

- Popups are **toast-only** (lightweight, auto-dismiss). Big bottom-sheet
  format is reserved / optional per Wes.
- Badge collection lives on `user-stats.tsx` (no new nav).
- Streak model is **dual and nested**: activity streak = big hero "active
  streak" number (dopamine); workout-completion streak = smaller "workout
  streak", drives all badges. Copy line ties them: "trained X of your last Y days".
- Badges key off the **workout-completion streak** (`rt_streak_current`),
  which is server-reliable.
- **"Inspiring others" badge has NO share button.**
- Badge unlocks are **both tracked as events AND displayed publicly on the
  live feed**, alongside the other events already tracked and shown there.
