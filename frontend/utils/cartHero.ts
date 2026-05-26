/**
 * Pure cart-hero resolver — no React, no side effects.
 *
 * HERO IMAGE PRIORITY (do not change without updating featured-cart spec):
 *   1. cartMeta.source === 'featured-carousel' AND cartMeta.heroImageUrl
 *      → use cartMeta.heroImageUrl (the carousel's in-memory hero)
 *   2. otherwise → fall back to cartItems[0]?.imageUrl
 *
 * This file is intentionally extracted from cart.tsx so it can be unit
 * tested without rendering the screen. See cartHero.test.ts for the
 * three-branch coverage.
 */

import type { CartMeta } from '../contexts/CartContext';

export interface CartHeroInput {
  imageUrl?: string;
}

export const resolveCartHeroImage = (
  cartMeta: CartMeta | null | undefined,
  firstItem: CartHeroInput | undefined,
): string | undefined => {
  if (
    cartMeta &&
    cartMeta.source === 'featured-carousel' &&
    cartMeta.heroImageUrl &&
    cartMeta.heroImageUrl.length > 0
  ) {
    return cartMeta.heroImageUrl;
  }
  return firstItem?.imageUrl;
};

/**
 * Pure guard: true when the cart is a featured-carousel cart that's missing
 * its heroImageUrl — signals a broken pass-through at the action site.
 * UI uses this to fire console.error('FEATURED_CART_HERO_V3 BROKEN', ...).
 */
export const isFeaturedHeroBroken = (
  cartMeta: CartMeta | null | undefined,
): boolean => {
  if (!cartMeta) return false;
  if (cartMeta.source !== 'featured-carousel') return false;
  return !cartMeta.heroImageUrl || cartMeta.heroImageUrl.length === 0;
};
