/**
 * FunnelEntryGate — Phase A/B paid launch entry-point wiring.
 *
 * Mounted once near the root. Watches for the `@mood_needs_funnel` flag
 * (set by `AuthContext.register()` immediately after a successful new-
 * account registration). When seen, routes the user into the 8-step
 * onboarding funnel exactly once, then clears the flag.
 *
 * Why a flag instead of in-line `router.replace()`? Two reasons:
 *   1. `AuthContext.register()` runs BEFORE the navigation root is fully
 *      hydrated on cold-start sign-ups, so an immediate route push can
 *      race the SafeAreaProvider / theme provider mount.
 *   2. The flag survives the inevitable react-strict-mode double mount
 *      and any hot-reload mid-funnel.
 *
 * Founding members + already-subscribed accounts still run the funnel
 * once on first registration — it's a teach moment, not a paywall
 * trigger, per the spec (Part 1).
 */

import React, { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

const FLAG_KEY = '@mood_needs_funnel';

export function FunnelEntryGate() {
  const router = useRouter();
  const { token, isLoading } = useAuth();
  // Latch so the route push only fires once per authenticated session.
  const dispatched = useRef(false);

  useEffect(() => {
    if (isLoading || !token || dispatched.current) return;
    let cancelled = false;
    (async () => {
      const flag = await AsyncStorage.getItem(FLAG_KEY);
      if (cancelled || flag !== 'true') return;
      dispatched.current = true;
      await AsyncStorage.removeItem(FLAG_KEY);
      // Use `replace` so the funnel becomes the back-stack root — there's
      // no meaningful "back" target after a registration.
      router.replace('/onboarding-funnel/step-1-mood');
    })();
    return () => {
      cancelled = true;
    };
  }, [token, isLoading, router]);

  return null;
}
