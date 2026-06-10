/**
 * MOOD brand constants — single source of truth.
 *
 * Keep visual decisions here so we can swap the final accent hex without
 * touching every screen. The current gold→orange gradient matches the MOOD
 * wordmark on the landing page (`app/index.tsx`).
 */

export const COLORS = {
  bg: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceElevated: '#222222',
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.72)',
  textTertiary: 'rgba(255,255,255,0.50)',
  divider: 'rgba(255,255,255,0.08)',
  accent: '#FFD700',
  accentTrail: '#FFA500',
  accentInk: '#0c0c0c',
} as const;

// Tuple typed for SafeLinearGradient `colors` prop.
export const BRAND_GRADIENT: readonly [string, string] = [COLORS.accent, COLORS.accentTrail];

export const FUNNEL_TOTAL_STEPS = 6;
