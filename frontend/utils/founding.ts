/**
 * MOOD V2 — founding-offer client helpers (Phase 2).
 */
export const FOUNDING_PRICE_DISPLAY = '$39/year';
export const STANDARD_ANNUAL_DISPLAY = '$79.99/year';

// Session/persistence keys.
export const FOUNDING_BANNER_COLLAPSED_KEY = '@mood_founding_banner_collapsed';

/** Whole days remaining until the founding window closes (never negative). */
export function foundingDaysRemaining(expiresAtIso?: string | null): number {
  if (!expiresAtIso) return 0;
  const expires = new Date(expiresAtIso).getTime();
  if (Number.isNaN(expires)) return 0;
  const diff = expires - Date.now();
  if (diff <= 0) return 0;
  return Math.max(1, Math.ceil(diff / 86400000));
}
