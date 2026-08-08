/**
 * devMocks — single, auditable home for ALL dev-only mock state used by the
 * /dev/screens tooling (Tier 2). Everything here is gated behind
 * `DEV_MOCKS_ENABLED`, which is `__DEV__`. In any production bundle
 * (`__DEV__ === false`) every function below is inert: the entitlement
 * override returns null and the dev menu route redirects home.
 *
 * Belt-and-suspenders: consumers MUST check `DEV_MOCKS_ENABLED` AND keep their
 * own `__DEV__` guard. Keeping the flag in one exported constant makes the
 * blast radius greppable — `grep DEV_MOCKS_ENABLED` finds every entry point.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

/** The ONLY switch that enables any dev mock. Compiles to `false` in prod. */
export const DEV_MOCKS_ENABLED: boolean = __DEV__;

/** Funnel answers key (shared with the real onboarding funnel). */
export const FUNNEL_ANSWERS_KEY = '@mood_funnel_answers_v1';

/** Dev-only AsyncStorage keys. Cleared by `clearDevMocks()`. */
export const DEV_MOCK_FOUNDING_KEY = '@mood_dev_mock_founding';
const DEV_MOCK_KEYS = [DEV_MOCK_FOUNDING_KEY];

/** Shape returned for the founding-eligible entitlement override. */
export interface DevMockEntitlement {
  has_full_access: boolean;
  reason: string;
  free_workouts_remaining: number | null;
  free_workouts_reset_at?: string | null;
  is_founding_member: boolean;
  founding_pricing_claimed: boolean;
  founding_window_active: boolean;
  founding_window_expires_at?: string | null;
}

/**
 * Inject a mood into the funnel-answers blob so mood-keyed screens
 * (mood-intro, first-decision screens) read it like the real funnel wrote it.
 * Merges so any other answers already present survive.
 */
export async function setDevMockMood(moodId: string): Promise<void> {
  if (!DEV_MOCKS_ENABLED) return;
  let existing: Record<string, unknown> = {};
  try {
    const raw = await AsyncStorage.getItem(FUNNEL_ANSWERS_KEY);
    if (raw) existing = JSON.parse(raw) ?? {};
  } catch {
    existing = {};
  }
  await AsyncStorage.setItem(
    FUNNEL_ANSWERS_KEY,
    JSON.stringify({ ...existing, mood: moodId }),
  );
}

/** Flip the founding-variant entitlement override on/off. */
export async function setDevMockFounding(on: boolean): Promise<void> {
  if (!DEV_MOCKS_ENABLED) return;
  if (on) {
    await AsyncStorage.setItem(DEV_MOCK_FOUNDING_KEY, 'true');
  } else {
    await AsyncStorage.removeItem(DEV_MOCK_FOUNDING_KEY);
  }
}

/**
 * Read the dev entitlement override. Returns the founding-eligible mock when
 * the dev menu has armed it, otherwise null (→ real server entitlement wins).
 * ALWAYS null in production.
 */
export async function getDevMockEntitlement(): Promise<DevMockEntitlement | null> {
  if (!DEV_MOCKS_ENABLED) return null;
  let flag: string | null = null;
  try {
    flag = await AsyncStorage.getItem(DEV_MOCK_FOUNDING_KEY);
  } catch {
    return null;
  }
  if (flag !== 'true') return null;
  return {
    has_full_access: false,
    reason: 'dev_mock_founding',
    free_workouts_remaining: null,
    free_workouts_reset_at: null,
    is_founding_member: true,
    founding_pricing_claimed: false,
    founding_window_active: true,
    founding_window_expires_at: new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000,
    ).toISOString(),
  };
}

/** Wipe ALL dev mock state (funnel answers + every @mood_dev_mock_* key). */
export async function clearDevMocks(): Promise<void> {
  if (!DEV_MOCKS_ENABLED) return;
  await AsyncStorage.multiRemove([
    FUNNEL_ANSWERS_KEY,
    ...DEV_MOCK_KEYS,
    'privacy_policy_accepted',
    '@mood_subscription_state_v1',
    '@mood_post_first_workout_paywall_shown_v1',
    '@mood_pulse_sync_played_v1',
  ]);
}
