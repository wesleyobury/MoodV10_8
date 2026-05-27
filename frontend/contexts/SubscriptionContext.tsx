/**
 * Subscription Context — Phase B of the paid launch.
 *
 * Holds the subscription state machine, free-tier mechanics counters, and
 * a single imperative `openPaywall(trigger)` API the rest of the app calls
 * before any locked action. Phase C will replace the local persistence here
 * with real StoreKit 2 receipts + backend sync — the consumer-facing API
 * (`canGenerate`, `canStartWorkout`, etc.) stays stable.
 *
 * Persistence: `@mood_subscription_state_v1` in AsyncStorage. Founding
 * Member flag is rehydrated from the authenticated `user` object in Phase D.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

/* ----------------------------- Types ----------------------------- */

export type SubscriptionStatus =
  | 'none'
  | 'in_trial'
  | 'active'
  | 'lapsed'
  | 'founding_member';

/**
 * Why the paywall was opened. Drives analytics and copy variants once we
 * start A/B testing trigger sources.
 *
 * Stage taxonomy (per Spec §3):
 *   Stage 1 — Soft     : `post_onboarding_soft` (replaces dev-only `post_onboarding_dev`)
 *   Stage 2 — Soft     : `post_achievement_close_soft` | `post_share_soft`
 *   Stage 3 — Hard     : `start_workout_after_free_session`
 *   In-app feature gates: `generate_after_cap`, `recap_footer_cta`,
 *                          `locked_premium_feature`, `settings_subscribe`
 */
export type PaywallTrigger =
  | 'start_workout_after_free_session'
  | 'generate_after_cap'
  | 'recap_footer_cta'
  | 'locked_premium_feature'
  | 'settings_subscribe'
  | 'post_onboarding_dev'   // dev/sandbox only — kept for the FORCE_SIGNUP_PAYWALL hatch
  | 'post_onboarding_soft'  // Stage 1 — fires on reveal-payoff for new users
  | 'post_achievement_close_soft'  // Stage 2a — fires on achievement-screen close
  | 'post_share_soft'              // Stage 2b — fires on post-publish success
  | 'unknown';

interface SubscriptionState {
  status: SubscriptionStatus;
  /** True after the user has tapped Start on their one free live session. */
  hasUsedFreeSession: boolean;
  /** Number of generations consumed in the initial free flow. Cap = 3. */
  freeGenerationsUsed: number;
  /**
   * Most-recent paywall trigger source. Persisted across the trial-start →
   * purchase journey so `subscription_purchased` carries the same
   * attribution as the original `paywall_viewed` event.
   */
  lastConversionTrigger: PaywallTrigger | null;
}

interface SubscriptionContextValue extends SubscriptionState {
  /** Convenience derived flag — `status === 'active' | 'in_trial' | 'founding_member'`. */
  hasActiveAccess: boolean;
  /** True if user is allowed to generate another workout in the initial free flow. */
  canGenerate: boolean;
  /** True if user is allowed to start a live workout session. */
  canStartWorkout: boolean;
  /** Increment the generation counter (call AFTER a successful generation). */
  recordGeneration: () => void;
  /** Mark the user's free live session as consumed. Idempotent. */
  recordStartFreeWorkout: () => void;
  /** Open the paywall modal with an optional trigger tag. */
  openPaywall: (trigger?: PaywallTrigger) => void;
  /**
   * Spec §3 Stage 2 — fire Soft Paywall #2 once across both trigger
   * sources (achievement-close + post-share). Returns true if shown,
   * false if suppressed (already-shown / active subscriber / no
   * completed workout yet).
   */
  tryFirePostFirstWorkoutPaywall: (
    source: 'post_achievement_close_soft' | 'post_share_soft'
  ) => Promise<boolean>;
  /** Currently-visible paywall trigger (consumed by <PaywallModal />). */
  pendingTrigger: PaywallTrigger | null;
  /** Dismiss the paywall (used by <PaywallModal /> close/back). */
  dismissPaywall: () => void;
  /** Set status. Phase C wires this to StoreKit transaction observers. */
  setStatus: (status: SubscriptionStatus) => void;
  /**
   * The trigger that opened the most recent paywall. Stays sticky through
   * trial_started → subscription_purchased so conversion attribution works
   * across the multi-event funnel. Cleared on `clearConversionTrigger()`.
   */
  lastConversionTrigger: PaywallTrigger | null;
  clearConversionTrigger: () => void;
}

/* --------------------------- Constants --------------------------- */

/**
 * Free-tier generation cap.
 *
 * Set to `Number.POSITIVE_INFINITY` on 2026-05-14 per product decision —
 * unlimited AI workout generations for free users (the live-session start
 * remains gated by `hasUsedFreeSession`, so the paywall still fires after
 * the first completed session).
 *
 * Keeping the constant + `recordGeneration()` counter in place so we can
 * dial the cap back in later (e.g. A/B test reintroducing a 3-generation
 * cap) without touching every call site.
 */
export const FREE_GENERATION_CAP = Number.POSITIVE_INFINITY;
const STORAGE_KEY = '@mood_subscription_state_v1';
/** Spec §3 Stage 2 — one-shot flag so Soft Paywall #2 fires at most once
 *  across BOTH trigger sources (achievement-close + post-share). Written
 *  the moment either trigger fires; checked before each subsequent fire. */
const POST_FIRST_WORKOUT_FLAG = '@mood_post_first_workout_paywall_shown_v1';

const DEFAULT_STATE: SubscriptionState = {
  status: 'none',
  hasUsedFreeSession: false,
  freeGenerationsUsed: 0,
  lastConversionTrigger: null,
};

const ACTIVE_STATUSES: SubscriptionStatus[] = ['active', 'in_trial', 'founding_member'];

/* ---------------------------- Storage ---------------------------- */

async function readState(): Promise<SubscriptionState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      status: parsed.status ?? 'none',
      hasUsedFreeSession: Boolean(parsed.hasUsedFreeSession),
      freeGenerationsUsed: Number.isFinite(parsed.freeGenerationsUsed)
        ? parsed.freeGenerationsUsed
        : 0,
      lastConversionTrigger: parsed.lastConversionTrigger ?? null,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

async function writeState(state: SubscriptionState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore — in-memory state still functional.
  }
}

/* ---------------------------- Provider ---------------------------- */

const Ctx = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SubscriptionState>(DEFAULT_STATE);
  const [pendingTrigger, setPendingTrigger] = useState<PaywallTrigger | null>(null);

  // Rehydrate.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next = await readState();
      if (!cancelled) setState(next);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = useCallback((delta: Partial<SubscriptionState>) => {
    setState((prev) => {
      const next = { ...prev, ...delta };
      writeState(next);
      return next;
    });
  }, []);

  const hasActiveAccess = ACTIVE_STATUSES.includes(state.status);

  const canGenerate = hasActiveAccess || state.freeGenerationsUsed < FREE_GENERATION_CAP;
  const canStartWorkout = hasActiveAccess || !state.hasUsedFreeSession;

  const recordGeneration = useCallback(() => {
    setState((prev) => {
      if (ACTIVE_STATUSES.includes(prev.status)) return prev;
      if (prev.freeGenerationsUsed >= FREE_GENERATION_CAP) return prev;
      const next = { ...prev, freeGenerationsUsed: prev.freeGenerationsUsed + 1 };
      writeState(next);
      return next;
    });
  }, []);

  const recordStartFreeWorkout = useCallback(() => {
    setState((prev) => {
      if (prev.hasUsedFreeSession) return prev;
      const next = { ...prev, hasUsedFreeSession: true };
      writeState(next);
      return next;
    });
  }, []);

  const openPaywall = useCallback((trigger?: PaywallTrigger) => {
    const resolved = trigger ?? 'unknown';
    setPendingTrigger(resolved);
    // Persist as the active conversion trigger so downstream `trial_started`
    // and `subscription_purchased` events can attribute correctly.
    setState((prev) => {
      if (prev.lastConversionTrigger === resolved) return prev;
      const next = { ...prev, lastConversionTrigger: resolved };
      writeState(next);
      return next;
    });
  }, []);

  const clearConversionTrigger = useCallback(() => {
    setState((prev) => {
      if (prev.lastConversionTrigger === null) return prev;
      const next = { ...prev, lastConversionTrigger: null };
      writeState(next);
      return next;
    });
  }, []);

  const dismissPaywall = useCallback(() => {
    setPendingTrigger(null);
  }, []);

  /**
   * Stage 2 (Spec §3) — fire the soft post-first-workout paywall, but at
   * most ONCE per user across both trigger sources (achievement-close +
   * post-share). Subscribers and users who haven't completed a workout
   * yet are no-ops. The flag is persisted so it survives app kills.
   *
   * Returns `true` if the paywall was opened, `false` if suppressed
   * (already-shown / active subscriber / no completed workout yet).
   */
  const tryFirePostFirstWorkoutPaywall = useCallback(
    async (
      source: 'post_achievement_close_soft' | 'post_share_soft',
    ): Promise<boolean> => {
      // Active subscribers + in-trial + founding members skip the soft paywall.
      if (ACTIVE_STATUSES.includes(state.status)) return false;
      // Must have completed at least one free session — otherwise this isn't
      // the "first workout" moment and Stage 3 hard paywall will handle later.
      if (!state.hasUsedFreeSession) return false;
      try {
        const alreadyShown = await AsyncStorage.getItem(POST_FIRST_WORKOUT_FLAG);
        if (alreadyShown === 'true') return false;
        await AsyncStorage.setItem(POST_FIRST_WORKOUT_FLAG, 'true');
      } catch {
        // If storage read/write fails, fall through and show — better to
        // double-show once on a corrupted device than to silently lose the
        // entire conversion moment.
      }
      openPaywall(source);
      return true;
    },
    [state.status, state.hasUsedFreeSession, openPaywall]
  );

  const setStatus = useCallback(
    (status: SubscriptionStatus) => {
      patch({ status });
    },
    [patch]
  );

  const value: SubscriptionContextValue = useMemo(
    () => ({
      ...state,
      hasActiveAccess,
      canGenerate,
      canStartWorkout,
      recordGeneration,
      recordStartFreeWorkout,
      openPaywall,
      tryFirePostFirstWorkoutPaywall,
      pendingTrigger,
      dismissPaywall,
      setStatus,
      clearConversionTrigger,
    }),
    [
      state,
      hasActiveAccess,
      canGenerate,
      canStartWorkout,
      recordGeneration,
      recordStartFreeWorkout,
      openPaywall,
      tryFirePostFirstWorkoutPaywall,
      pendingTrigger,
      dismissPaywall,
      setStatus,
      clearConversionTrigger,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useSubscription must be used inside <SubscriptionProvider>');
  }
  return ctx;
}
