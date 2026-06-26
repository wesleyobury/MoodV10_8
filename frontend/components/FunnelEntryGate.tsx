/**
 * FunnelEntryGate — Phase A/B paid launch entry-point wiring.
 *
 * Mounted once near the root. Watches for the legacy `@mood_needs_funnel`
 * flag (set only by older builds / the landing "Get Started" recovery path).
 * When seen, routes the user BACK TO THE LANDING PAGE (`/`) so they can
 * tap "Get Started" to enter the funnel. Fresh signups skip this entirely —
 * `app/auth/register.tsx` routes directly into the funnel.
 *
 * Founding members + already-subscribed accounts still run the funnel
 * once on first registration — it's a teach moment, not a paywall
 * trigger, per the spec (Part 1).
 */

import React, { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { readHasCompletedFunnel } from '../contexts/OnboardingFunnelContext';

const FLAG_KEY = '@mood_needs_funnel';

export function FunnelEntryGate() {
  const router = useRouter();
  const segments = useSegments();
  const { token, isLoading, user } = useAuth();
  // Latch so the route push only fires once per authenticated session.
  // NOTE (Spec §2b): This ref alone is NOT sufficient — it resets on
  // remount. The persisted `completedAt` check below is the real guard.
  const dispatched = useRef(false);

  useEffect(() => {
    if (isLoading || !token || !user?.id || dispatched.current) return;
    // Register routes straight into the funnel — don't yank the user back to
    // the landing page mid-navigation.
    const root = segments[0];
    if (root === 'onboarding-funnel' || root === 'auth') {
      dispatched.current = true;
      return;
    }
    const userId = user.id;
    let cancelled = false;
    (async () => {
      const flag = await AsyncStorage.getItem(FLAG_KEY);
      if (cancelled || flag !== 'true') return;

      // Spec §2c — never re-route an already-onboarded user back into the
      // funnel, even if `@mood_needs_funnel` somehow survived (e.g. force-
      // quit mid-register, schema drift, manual debug). Self-heal by
      // purging the flag and bailing.
      const completed = await readHasCompletedFunnel(userId);
      if (cancelled) return;
      if (completed) {
        await AsyncStorage.removeItem(FLAG_KEY);
        dispatched.current = true;
        return;
      }

      dispatched.current = true;
      // Land on the brand landing page (video + CTA). The flag is kept
      // alive so the "Get Started" handler in `app/index.tsx` knows to
      // push into the funnel + clear it.
      router.replace('/');
    })();
    return () => {
      cancelled = true;
    };
  }, [token, isLoading, user?.id, router, segments]);

  return null;
}
