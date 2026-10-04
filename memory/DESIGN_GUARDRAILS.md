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

## Palette: Taupe Silk (Oct 2026)

- The app canvas is warm taupe, not near-black. Use the tokens in `frontend/constants/brand.ts`:
  `bg #463D38`, `surface #554B45`, `surfaceElevated #615650`, `sheet #3D3530` (sheets, tab bar, coachmarks),
  cream text `#FFFAF2`. Gold gradient and the gold rules above are unchanged.
- Never hard-code black page backgrounds (`#000`, `#0A0A0A`, `#0c0c0c`, `#121212`...). Use `COLORS.bg` / `COLORS.sheet`.
- **Fades that end on the page must start from the page colour**: `bgA(0)` → `COLORS.bg`, never `transparent`,
  `rgba(0,0,0,0)` or `rgba(10,10,10,0)`, or the fade shows a muddy band.
- **Hero photos** (Cart, Guided Session, anywhere a photo meets the page) blend with `HERO_FADE_COLORS` +
  `HERO_FADE_LOCATIONS` (eased, 8 stops). Dark veils for status-bar legibility and text scrims *inside* photo cards
  may stay black.
- State tile skies were lifted one step brighter (StateCard `STATE_THEME`) so they glow on taupe.
- Pre-change copies of every edited file: `Backups/taupe-silk-pre-2026-10-03/`.
- Legibility floor (pass 2): subtext uses `COLORS.textSecondary` (0.86) at weight 600 for key lines; captions /
  placeholders use `COLORS.textTertiary` (0.70). No text below ~0.66 opacity on taupe, no neutral grays (#888, #8D8D90).
- Neutral (non-gold) buttons: "Satin Taupe" (pass 5; cream and black+gold rim were rejected): gradient #8E7F74 > #71645B > #62564E, hairline cream edge, soft top highlight, cream label, #FFE2A6 icon. E.g. Home "I'm steady today".
  Translucent-white pills disappear on taupe.
- Splash: native splash stays black; the JS boot screen fades in a warm taupe rise from the bottom third.
- Pass-2 backups: `Backups/taupe-silk-pass2-2026-10-03/`.
- Pass 3: subtext legibility change reverted at founder request (white subtext under white headings read flat).
  textSecondary back to 0.76 / textTertiary 0.54 and the original grays restored. Cream buttons, login and splash kept.
- Splash: black around the logo, warm taupe only at the top and bottom edges (`SPLASH_STOPS` in AppBootstrap). The same
  stops are baked into `assets/images/splash-screen-ios.png` (iOS native splash via app.json expo-splash-screen `ios`
  override, resizeMode cover, logo at 86% of width). Change both together. Android keeps the plain black splash.
