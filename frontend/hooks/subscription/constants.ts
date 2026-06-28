/** Throttle app-open StoreKit → backend sync (ms). */
export const SUBSCRIPTION_SYNC_INTERVAL_MS = 30_000;

export const SUBSCRIPTION_LAST_SYNC_KEY = '@mood/subscription_last_sync_at';

/** Intro trial window used to infer in_trial before first paid charge. */
export const INTRO_TRIAL_WINDOW_MS = 8 * 24 * 60 * 60 * 1000;
