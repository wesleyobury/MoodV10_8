/**
 * MOOD brand constants — single source of truth.
 *
 * Keep visual decisions here so we can swap the final accent hex without
 * touching every screen. The current gold→orange gradient matches the MOOD
 * wordmark on the landing page (`app/index.tsx`).
 */

/**
 * ⛔ FORBIDDEN DESIGN RULES — never violate anywhere in the app.
 *
 * 1. BANNED COLORWAY: a flat, single-tone muted "mustard" yellow-gold (the
 *    barbell reference icon Wes flagged). It reads cheap and off-brand. The
 *    gold accent must ALWAYS be the vibrant gold→orange BRAND_GRADIENT below,
 *    with depth (glow + inset highlight/shadow) — never a flat mustard fill.
 *
 * 2. NO GOLD-ON-GOLD: never place gold text + a gold emblem/icon on a
 *    transparent or gold background. That low-contrast gold-on-gold combo is
 *    banned everywhere. Gold emblems use dark ink (accentInk); gold text only
 *    ever sits on dark (bg/surface) backgrounds.
 *
 * Approved gold = #FFD700 → #FFA500 (gradient, with depth)
 * Banned        = flat mustard yellow-gold fill; gold-on-gold pairings
 */
export const FORBIDDEN_COLORS = {
  flatMustardGold: 'DO_NOT_USE', // exact hex TBD — Wes: "that mustard yellow"
} as const;

/**
 * Palette: "Taupe Silk" (founder pick, Oct 2026). A warm dim mode instead of near-black: mushroom-taupe canvas, cream
 * type, the same gold gradient. Gold text still only sits on these dark-enough taupe surfaces (contrast holds).
 * Previous palette (pre Oct 2026): bg #0A0A0A, surface #1A1A1A, surfaceElevated #222222, white text.
 */
export const COLORS = {
  bg: '#463D38',
  surface: '#554B45',
  surfaceElevated: '#615650',
  /** bottom sheets, tab bar, coachmarks: a touch deeper than the canvas so they read as a layer */
  sheet: '#3D3530',
  textPrimary: '#FFFAF2',
    textSecondary: 'rgba(255,250,242,0.76)',
  textTertiary: 'rgba(255,250,242,0.54)',
  divider: 'rgba(255,245,230,0.12)',
  /** input / pill outlines that must be visible on taupe */
  border: 'rgba(255,245,230,0.22)',
  /** neutral (non-gold) buttons: a cream fill with taupe ink, so they read as buttons on the taupe canvas */
  cream: '#F4EBDF',
  creamInk: '#2E2622',
  /** icon accent on cream (gold itself is too light on cream) */
  creamAccent: '#A86400',
  accent: '#FFD700',
  accentTrail: '#FFA500',
  accentInk: '#0c0c0c',
} as const;

/** The canvas colour at any opacity. Every fade that ends on the page must start from this (never from black), or the
 * fade shows a muddy band where black meets taupe. */
const BG_RGB = '70,61,56';
export function bgA(alpha: number): string {
  return `rgba(${BG_RGB},${alpha})`;
}

/**
 * Hero blend: transparent -> page, on an eased (smoothstep) curve, so a photo dissolves into the canvas with no visible
 * start or end. Use with HERO_FADE_LOCATIONS on any LinearGradient laid over the bottom of a hero photo.
 */
export const HERO_FADE_ALPHAS: readonly number[] = [0, 0.05, 0.19, 0.39, 0.6, 0.78, 0.94, 1];
export const HERO_FADE_COLORS: string[] = HERO_FADE_ALPHAS.map(bgA);
export const HERO_FADE_LOCATIONS: number[] = [0, 0.14, 0.28, 0.42, 0.56, 0.7, 0.85, 1];

// Tuple typed for SafeLinearGradient `colors` prop.
export const BRAND_GRADIENT: readonly [string, string] = [COLORS.accent, COLORS.accentTrail];

export const FUNNEL_TOTAL_STEPS = 6;
