# MOOD — project notes for Claude

## Design rules (permanent)

- **Never gold-on-gold.** Do not put gold text and/or a gold emblem/icon on a
  gold (or transparent-gold) background anywhere in the app. That low-contrast
  combo is banned. A single gold icon accent on a **dark** surface is fine; when
  a surface is gold-tinted, text and icons on it must be light/dark for contrast.

- **Gold is a mark colour, never a surface fill.** Do not use a translucent gold
  wash — `rgba(255, 215, 0, 0.05–0.15)` or similar — as the background of a
  card, panel, or row. At any size larger than a chip it muddies to olive against
  the near-black surfaces and competes with the brand lockup. A gold hairline
  border around a large container is banned for the same reason: it reads as a
  warning state. Gold belongs on marks — the wordmark, medallions, small icon
  discs, counts, chevrons, active state.

  The house treatment for a raised surface is a neutral fill on a neutral
  hairline, with gold allowed *inside* it as a mark:

  ```
  backgroundColor: 'rgba(255,255,255,0.05)'
  borderColor:     'rgba(255,255,255,0.10)'
  ```

  Reference implementation: `resumeCard` / `resumeIcon` in `app/(tabs)/index.tsx`.

- **Glow is for sparse layouts only.** `AchievementMedallion` renders a gold halo
  by default, which is right in the full achievements grid. In dense rows (the
  profile badge shelf) overlapping halos read as blur rather than depth — pass
  `glow={false}`.

- Brand gold accent: `#F4C316` (soft ambient gold), warm bronze edge `#9A7A35`.
  Primary text `#F3F3F3`, secondary `#8D8D90`. Backgrounds are true black / dark
  charcoal (`#0C0C0D`–`#101114`). Apple Wallet / TV+ / Leica premium minimalism.
