/**
 * Root-stack reset for terminal navigation exits.
 *
 * `router.replace(href)` alone only swaps the top screen — workout-session,
 * settings, etc. stay underneath and swipe-back returns to them.
 *
 * Only call from explicit flow endings (sign-out, achievement screen done).
 * Do not use for onboarding, login entry, or mid-flow pushes.
 */
import type { Href, Router } from 'expo-router';

export function resetStackAndReplace(router: Router, href: Href): void {
  const r = router as Router & {
    canDismiss?: () => boolean;
    dismissAll?: () => void;
  };

  try {
    if (typeof r.canDismiss === 'function' && r.canDismiss() && typeof r.dismissAll === 'function') {
      r.dismissAll();
    }
  } catch {
    // Fall through to replace.
  }

  router.replace(href);
}

export function navigateToLoginAfterSessionEnd(router: Router): void {
  resetStackAndReplace(router, '/auth/login');
}

export function navigateToTabsAfterWorkoutComplete(router: Router): void {
  resetStackAndReplace(router, '/(tabs)');
}
