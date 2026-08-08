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
import { resolveSubscriptionStatus } from '../hooks/subscription/subscriptionState';
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
  /**
   * True after the user has EVER consumed a free live session. Lifetime flag —
   * do NOT use this to gate workout start (see `freeSessionPeriod`). It exists
   * so Soft Paywall #2 ("first workout" moment) stays a genuine one-shot.
   */
  hasUsedFreeSession: boolean;
  /**
   * ISO week key (e.g. "2026-W31") in which the most recent free session was
   * consumed, or null if never / pre-V2.1 storage.
   *
   * V2.1: the free allowance resets weekly server-side. Gating on the lifetime
   * `hasUsedFreeSession` flag alone would keep a user locked out forever even
   * after the server reset, because this flag is persisted to AsyncStorage and
   * was never cleared. A legacy row with no period reads as "not used this
   * week", which unlocks previously-blocked users — matching the backend.
   */
  freeSessionPeriod: string | null;
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
  /** Server-derived subscription status for UI (entitlement is SoT). */
  status: SubscriptionStatus;
  /** From /me/entitlement.has_full_access — gates paywall + workout start. */
  hasActiveAccess: boolean;
  /** True if user is allowed to generate another workout in the initial free flow. */
  canGenerate: boolean;
  /** True if user is allowed to start a live workout session. */
  canStartWorkout: boolean;
  /**
   * Free workouts left in the current ISO week, or null for entitled users.
   * V2.1 — surface this in the UI BEFORE the user invests effort building a
   * workout; the value was previously fetched and never rendered anywhere.
   */
  freeWorkoutsRemaining: number | null;
  /** ISO timestamp when the weekly allowance resets. Null if entitled. */
  freeWorkoutsResetAt: string | null;
  /** Increment the generation counter (call AFTER a successful generation). */
  recordGeneration: () => void;
  /** Mark the user's free live session as consumed. Idempotent. */
  recordStartFreeWorkout: () => void;
  /** Open the paywall modal with an optional trigger tag. */
  openPaywall: (trigger?: PaywallTrigger, opts?: { preferredCta?: 'subscribe_now' | 'start_free_trial' }) => void;
  /** Which single CTA the paywall should show, when the opener specified one
   *  (e.g. reveal screen's Subscribe Now vs trial button). Null = show both. */
  preferredPaywallCta: 'subscribe_now' | 'start_free_trial' | null;
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
  /** Dev/Expo Go only — production status comes from refreshSubscriptionState(). */
  setStatus: (status: SubscriptionStatus) => void;
  /** Refresh /users/me + /me/entitlement after IAP (single SoT update path). */
  refreshSubscriptionState: () => Promise<void>;
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

/**
 * ISO year-week key in UTC, e.g. "2026-W31". MUST stay byte-identical to
 * backend `entitlement.current_free_period_key()` — the client mirror and the
 * server gate have to agree on which week it is, or the UI will show a
 * remaining count the server refuses to honour.
 *
 * Standard ISO-8601 week algorithm: shift to the Thursday of the current week,
 * then count weeks from Jan 1 of *that* Thursday's year. This is what makes
 * the year-boundary cases (e.g. 2026-W53 running into January 2027) correct.
 */
export function currentFreePeriodKey(now: Date = new Date()): string {
  const dt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNum = dt.getUTCDay() || 7; // Mon=1 ... Sun=7
  dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
  const isoYear = dt.getUTCFullYear();
  const yearStart = Date.UTC(isoYear, 0, 1);
  const week = Math.ceil(((dt.getTime() - yearStart) / 86400000 + 1) / 7);
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
}
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
  hasUsedFreeSession: false,
  freeSessionPeriod: null,
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
    hasUsedFreeSession: Boolean(parsed.hasUsedFreeSession),
    // Absent on pre-V2.1 stored state -> null -> "not used this week" -> unlocked.
    freeSessionPeriod:
      typeof parsed.freeSessionPeriod === 'string' ? parsed.freeSessionPeriod : null,
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
  const [preferredPaywallCta, setPreferredPaywallCta] = useState<'subscribe_now' | 'start_free_trial' | null>(null);
  const [devStatusOverride, setDevStatusOverride] = useState<SubscriptionStatus | null>(null);
  const prevUserIdRef = useRef<string | null>(null);

  const { entitlement, user, refreshSubscriptionState } = useAuth();
  const userId = user?.id ?? null;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const serverStatus = useMemo(
    () => resolveSubscriptionStatus(entitlement, user?.subscription_status),
    [entitlement, user?.subscription_status],
  );

  const status = devStatusOverride ?? serverStatus;

  useEffect(() => {
    if (entitlement?.has_full_access) {
      setDevStatusOverride(null);
    }
  }, [entitlement?.has_full_access]);

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
      setDevStatusOverride(null);
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

  const hasActiveAccess = entitlement?.has_full_access ?? ACTIVE_STATUSES.includes(status);

  // Free-workout START gate. With server entitlement we trust
  // `free_workouts_remaining`; otherwise fall back to the local flag.
  const serverFreeRemaining = entitlement?.free_workouts_remaining;
  const freeWorkoutUsedServer =
    entitlement != null && !entitlement.has_full_access
      ? (serverFreeRemaining ?? 0) <= 0
      : false;

  const canGenerate = hasActiveAccess || state.freeGenerationsUsed < FREE_GENERATION_CAP;

  // V2.1 — offline/pre-entitlement fallback, scoped to the CURRENT week so it
  // cannot outlive the server-side reset. `hasUsedFreeSession` on its own is a
  // lifetime flag and would permanently block the user.
  const hasUsedFreeSessionThisPeriod =
    state.hasUsedFreeSession && state.freeSessionPeriod === currentFreePeriodKey();

  const canStartWorkout =
    hasActiveAccess || !(freeWorkoutUsedServer || hasUsedFreeSessionThisPeriod);

  /** Free workouts left this week (server SoT; falls back to the local mirror). */
  const freeWorkoutsRemaining = hasActiveAccess
    ? null
    : (serverFreeRemaining ?? (hasUsedFreeSessionThisPeriod ? 0 : 1));

  /** ISO timestamp when the weekly allowance next resets, or null if entitled. */
  const freeWorkoutsResetAt = hasActiveAccess
    ? null
    : (entitlement?.free_workouts_reset_at ?? null);

  const recordGeneration = useCallback(() => {
    setState((prev) => {
      if (hasActiveAccess) return prev;
      if (prev.freeGenerationsUsed >= FREE_GENERATION_CAP) return prev;
      const next = { ...prev, freeGenerationsUsed: prev.freeGenerationsUsed + 1 };
      persistState(next);
      return next;
    });
  }, [persistState, hasActiveAccess]);

  const recordStartFreeWorkout = useCallback(() => {
    setState((prev) => {
      const period = currentFreePeriodKey();
      // Idempotent WITHIN a week. Must not early-return on the lifetime flag —
      // a user consuming their allowance in a later week still needs the new
      // period stamped, or the local mirror would read as "not used".
      if (prev.hasUsedFreeSession && prev.freeSessionPeriod === period) return prev;
      const next = { ...prev, hasUsedFreeSession: true, freeSessionPeriod: period };
      persistState(next);
      return next;
    });
  }, [persistState]);

  const openPaywall = useCallback((trigger?: PaywallTrigger, opts?: { preferredCta?: 'subscribe_now' | 'start_free_trial' }) => {
    const resolved = trigger ?? 'unknown';
    setPreferredPaywallCta(opts?.preferredCta ?? null);
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
    setPreferredPaywallCta(null);
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

  const setStatus = useCallback((nextStatus: SubscriptionStatus) => {
    setDevStatusOverride(nextStatus);
  }, []);

  const value: SubscriptionContextValue = useMemo(
    () => ({
      ...state,
      status,
      hasActiveAccess,
      canGenerate,
      canStartWorkout,
      freeWorkoutsRemaining,
      freeWorkoutsResetAt,
      recordGeneration,
      recordStartFreeWorkout,
      openPaywall,
      preferredPaywallCta,
      tryFirePostFirstWorkoutPaywall,
      pendingTrigger,
      dismissPaywall,
      setStatus,
      refreshSubscriptionState,
      clearConversionTrigger,
    }),
    [
      state,
      status,
      hasActiveAccess,
      canGenerate,
      canStartWorkout,
      freeWorkoutsRemaining,
      freeWorkoutsResetAt,
      recordGeneration,
      recordStartFreeWorkout,
      openPaywall,
      preferredPaywallCta,
      tryFirePostFirstWorkoutPaywall,
      pendingTrigger,
      dismissPaywall,
      setStatus,
      refreshSubscriptionState,
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
