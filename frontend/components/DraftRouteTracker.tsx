/**
 * Keeps an in-progress Saved Build pointing at the screen the user is actually on.
 *
 * V2.1 — WHY. The draft used to be created in cart.tsx on first entry with items,
 * so its resume_route was always '/cart' and everything before the cart was
 * unrecorded. Drafts are now created at intensity confirm (see
 * IntensitySelectionModal), which means a build can be abandoned on any of the
 * ~27 selection screens between mood and cart. Without this, resuming such a
 * draft would dump the user at whichever screen happened to be current when the
 * draft was created rather than where they actually stopped.
 *
 * Mounted once inside DraftsProvider. Renders nothing.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'expo-router';
import { useDrafts } from '../contexts/DraftsContext';

/**
 * Route prefixes that count as "still building".
 *
 * Deliberately an allowlist, not a denylist: if the user wanders to Profile or
 * the Live feed mid-build we must NOT overwrite resume_route with '/profile',
 * because resuming would then drop them somewhere with no relationship to the
 * workout they were assembling.
 */
const BUILD_ROUTE_PATTERNS: RegExp[] = [
  /^\/mood-intro/,
  /^\/body-parts/,
  /^\/workout-type/,
  /^\/muscle-groups/,
  /^\/legs-muscle-groups/,
  /^\/explosiveness-type/,
  /^\/lazy-training-type/,
  /^\/calisthenics-/,
  /^\/outdoor-/,
  /^\/lazy-/,
  /^\/bodyweight-/,
  /^\/[a-z-]+-equipment/,   // chest-equipment, legs-equipment, cardio-equipment, ...
  /^\/[a-z-]+-workouts/,    // calisthenics-workouts, outdoor-workouts, lazy-*-workouts, ...
  /^\/cart/,
];

const isBuildRoute = (path: string | null): boolean =>
  !!path && BUILD_ROUTE_PATTERNS.some((re) => re.test(path));

export default function DraftRouteTracker() {
  const pathname = usePathname();
  const { currentDraftId, patchDraft } = useDrafts();
  // Avoid re-PATCHing the same route on every re-render / focus change.
  const lastWrittenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentDraftId) {
      lastWrittenRef.current = null;
      return;
    }
    if (!isBuildRoute(pathname)) return;
    if (lastWrittenRef.current === pathname) return;

    lastWrittenRef.current = pathname;
    // Fire-and-forget — this is bookkeeping and must never interrupt navigation.
    patchDraft(currentDraftId, { resume_route: pathname } as any).catch(() => {});
  }, [pathname, currentDraftId, patchDraft]);

  return null;
}
