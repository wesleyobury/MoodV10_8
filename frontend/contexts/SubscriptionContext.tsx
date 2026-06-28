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
  useRef,
  useState,
} from 'react';
import { useAuth } from './AuthContext';
import { mapServerStatusToLocal } from '../hooks/subscription/mapSubscriptionStatus';
import { SubscriptionSyncRunner } from '../hooks/subscription/useSubscriptionSync';

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
    source: 'post_achievement_close_soft' | 'post_share_soft',
    options?: { completedWorkoutConfirmed?: boolean }
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
const STORAGE_KEY_PREFIX = '@mood_subscription_state_v1';
const LEGACY_STORAGE_KEY = STORAGE_KEY_PREFIX;
/** Spec §3 Stage 2 — one-shot flag so Soft Paywall #2 fires at most once
 *  across BOTH trigger sources (achievement-close + post-share). Written
 *  when the modal becomes visible; checked before each subsequent fire.
 *  Scoped per user so a prior account on the same device cannot suppress
 *  the paywall for a new account. */
const POST_FIRST_WORKOUT_FLAG = '@mood_post_first_workout_paywall_shown_v1';
const LEGACY_POST_FIRST_WORKOUT_FLAG = POST_FIRST_WORKOUT_FLAG;

export const STAGE_2_PAYWALL_TRIGGERS = new Set<PaywallTrigger>([
  'post_achievement_close_soft',
  'post_share_soft',
]);

function subscriptionStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

function postFirstWorkoutFlagKey(userId: string): string {
  return `${POST_FIRST_WORKOUT_FLAG}:${userId}`;
}

/** Called by PaywallModal once Stage 2 is actually visible. */
export async function markPostFirstWorkoutPaywallShown(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(postFirstWorkoutFlagKey(userId), 'true');
    await AsyncStorage.removeItem(LEGACY_POST_FIRST_WORKOUT_FLAG);
  } catch {
    // ignore
  }
}

const DEFAULT_STATE: SubscriptionState = {
  status: 'none',
  hasUsedFreeSession: false,
  freeGenerationsUsed: 0,
  lastConversionTrigger: null,
};

// V2: founding_member is NO LONGER an access state — it's a discount-eligibility
// flag. Local fallback access = paid/trial only; server entitlement is the SoT.
const ACTIVE_STATUSES: SubscriptionStatus[] = ['active', 'in_trial'];

/* ---------------------------- Storage ---------------------------- */

function parseSubscriptionState(raw: string): SubscriptionState {
  const parsed = JSON.parse(raw);
  return {
    status: parsed.status ?? 'none',
    hasUsedFreeSession: Boolean(parsed.hasUsedFreeSession),
    freeGenerationsUsed: Number.isFinite(parsed.freeGenerationsUsed)
      ? parsed.freeGenerationsUsed
      : 0,
    lastConversionTrigger: parsed.lastConversionTrigger ?? null,
  };
}

async function readStateForUser(userId: string | null): Promise<SubscriptionState> {
  if (!userId) return DEFAULT_STATE;
  try {
    let raw = await AsyncStorage.getItem(subscriptionStorageKey(userId));
    if (!raw) {
      raw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    }
    if (!raw) return DEFAULT_STATE;
    return parseSubscriptionState(raw);
  } catch {
    return DEFAULT_STATE;
  }
}

async function writeStateForUser(userId: string | null, state: SubscriptionState): Promise<void> {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(subscriptionStorageKey(userId), JSON.stringify(state));
    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // ignore — in-memory state still functional.
  }
}

/* ---------------------------- Provider ---------------------------- */

const Ctx = createContext<SubscriptionContextValue | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SubscriptionState>(DEFAULT_STATE);
  const [pendingTrigger, setPendingTrigger] = useState<PaywallTrigger | null>(null);
  const prevUserIdRef = useRef<string | null>(null);

  // MOOD V2 Phase 1 — server-authoritative entitlement. The local
  // `@mood_subscription_state_v1` is now only an OFFLINE CACHE; the server's
  // /api/me/entitlement is the source of truth. When entitlement is loaded we
  // trust it; while it's null (not yet fetched / offline) we fall back to the
  // local status so we don't lock out a real subscriber on a cold start.
  const { entitlement, user } = useAuth();
  const userId = user?.id ?? null;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  // Mirror server subscription_status from /users/me when available.
  useEffect(() => {
    const mapped = mapServerStatusToLocal(user?.subscription_status);
    if (mapped != null && mapped !== 'none') {
      setState((prev) => {
        if (prev.status === mapped) return prev;
        const next: SubscriptionState = { ...prev, status: mapped };
        writeStateForUser(userIdRef.current, next);
        return next;
      });
    } else if (mapped === 'none' && user?.subscription_status === null) {
      setState((prev) => {
        if (prev.status === 'none') return prev;
        const next: SubscriptionState = { ...prev, status: 'none' };
        writeStateForUser(userIdRef.current, next);
        return next;
      });
    }
  }, [user?.subscription_status, user?.id]);

  const persistState = useCallback((next: SubscriptionState) => {
    writeStateForUser(userIdRef.current, next);
  }, []);

  // Rehydrate per-user state when userId changes. Do NOT blast DEFAULT_STATE
  // before the async read — that races recordStartFreeWorkout() and can leave
  // hasUsedFreeSession false at the exact moment Soft Paywall #2 tries to fire.
  useEffect(() => {
    let cancelled = false;
    const prevUserId = prevUserIdRef.current;
    prevUserIdRef.current = userId;

    if (prevUserId && userId && prevUserId !== userId) {
      setPendingTrigger(null);
    }

    if (!userId) {
      setState(DEFAULT_STATE);
      return;
    }

    (async () => {
      const next = await readStateForUser(userId);
      if (!cancelled) setState(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const patch = useCallback((delta: Partial<SubscriptionState>) => {
    setState((prev) => {
      const next = { ...prev, ...delta };
      persistState(next);
      return next;
    });
  }, [persistState]);

  // Server entitlement wins when present; local status is the offline fallback.
  const hasActiveAccess = entitlement
    ? entitlement.has_full_access
    : ACTIVE_STATUSES.includes(state.status);

  // Free-workout START gate. With server entitlement we trust
  // `free_workouts_remaining`; otherwise fall back to the local flag.
  const serverFreeRemaining = entitlement?.free_workouts_remaining;
  const freeWorkoutUsedServer =
    entitlement != null && !entitlement.has_full_access
      ? (serverFreeRemaining ?? 0) <= 0
      : false;

  const canGenerate = hasActiveAccess || state.freeGenerationsUsed < FREE_GENERATION_CAP;
  const canStartWorkout = hasActiveAccess || !(freeWorkoutUsedServer || state.hasUsedFreeSession);

  const recordGeneration = useCallback(() => {
    setState((prev) => {
      if (ACTIVE_STATUSES.includes(prev.status)) return prev;
      if (prev.freeGenerationsUsed >= FREE_GENERATION_CAP) return prev;
      const next = { ...prev, freeGenerationsUsed: prev.freeGenerationsUsed + 1 };
      persistState(next);
      return next;
    });
  }, [persistState]);

  const recordStartFreeWorkout = useCallback(() => {
    setState((prev) => {
      if (prev.hasUsedFreeSession) return prev;
      const next = { ...prev, hasUsedFreeSession: true };
      persistState(next);
      return next;
    });
  }, [persistState]);

  const openPaywall = useCallback((trigger?: PaywallTrigger) => {
    const resolved = trigger ?? 'unknown';
    setPendingTrigger(resolved);
    // Persist as the active conversion trigger so downstream `trial_started`
    // and `subscription_purchased` events can attribute correctly.
    setState((prev) => {
      if (prev.lastConversionTrigger === resolved) return prev;
      const next = { ...prev, lastConversionTrigger: resolved };
      persistState(next);
      return next;
    });
  }, [persistState]);

  const clearConversionTrigger = useCallback(() => {
    setState((prev) => {
      if (prev.lastConversionTrigger === null) return prev;
      const next = { ...prev, lastConversionTrigger: null };
      persistState(next);
      return next;
    });
  }, [persistState]);

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
      options?: { completedWorkoutConfirmed?: boolean },
    ): Promise<boolean> => {
      // Active subscribers + in-trial + comp/founding-claimed skip the soft paywall.
      if (hasActiveAccess) return false;
      if (!userId) return false;

      const stored = await readStateForUser(userId);
      const completedFreeSession =
        options?.completedWorkoutConfirmed === true ||
        freeWorkoutUsedServer ||
        state.hasUsedFreeSession ||
        stored.hasUsedFreeSession;

      // Must have completed at least one free session — otherwise this isn't
      // the "first workout" moment and Stage 3 hard paywall will handle later.
      if (!completedFreeSession) return false;

      const flagKey = postFirstWorkoutFlagKey(userId);
      try {
        const alreadyShown = await AsyncStorage.getItem(flagKey);
        if (alreadyShown === 'true') return false;
      } catch {
        // If storage read fails, fall through and show — better to double-show
        // once on a corrupted device than to silently lose the conversion moment.
      }

      // Flag is written by PaywallModal once visible — not here — so a failed
      // open or modal covered by another gate can still retry on the next exit.
      openPaywall(source);
      return true;
    },
    [hasActiveAccess, freeWorkoutUsedServer, state.hasUsedFreeSession, openPaywall, userId]
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

  return (
    <Ctx.Provider value={value}>
      <SubscriptionSyncRunner />
      {children}
    </Ctx.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useSubscription must be used inside <SubscriptionProvider>');
  }
  return ctx;
}
