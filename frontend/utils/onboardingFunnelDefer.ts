/**
 * Shared guard for post-auth gates (profile pic, HealthKit, etc.) that must
 * NOT interrupt the paid-launch onboarding funnel or the post-metrics workout
 * handoff.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { readHasCompletedFunnel } from '../contexts/OnboardingFunnelContext';
import { isHealthOnboardingComplete } from './healthStorage';

const NEEDS_FUNNEL_KEY = '@mood_needs_funnel';
const WORKOUT_HANDOFF_PENDING_PREFIX = '@mood_pending_workout_handoff_v1';

function workoutHandoffPendingKey(userId: string): string {
  return `${WORKOUT_HANDOFF_PENDING_PREFIX}:${userId}`;
}

/** Set when metrics connect finishes — cleared after mood-intro CTA. */
export async function markWorkoutHandoffPending(userId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(workoutHandoffPendingKey(userId), 'true');
  } catch {
    // ignore
  }
}

export async function clearWorkoutHandoffPending(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(workoutHandoffPendingKey(userId));
  } catch {
    // ignore
  }
}

async function isWorkoutHandoffPending(userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  try {
    return (await AsyncStorage.getItem(workoutHandoffPendingKey(userId))) === 'true';
  } catch {
    return false;
  }
}

/** True while the user still owes the 8-step funnel (+ reveal payoff). */
export async function shouldDeferAuxiliaryOnboardingGates(
  userId?: string | null,
): Promise<boolean> {
  try {
    const needsFunnel = await AsyncStorage.getItem(NEEDS_FUNNEL_KEY);
    if (needsFunnel === 'true') return true;
    if (userId) {
      return !(await readHasCompletedFunnel(userId));
    }
    return !(await readHasCompletedFunnel());
  } catch {
    return false;
  }
}

/**
 * Expo Router collapses the landing page (`app/index.tsx`) and the workouts
 * home tab (`app/(tabs)/index.tsx`) to pathname `/`. Only treat the
 * authenticated tab stack as "home" — never the pre-auth landing screen.
 */
export function isOnAuthenticatedHomeTab(
  segments: string[],
  pathname?: string | null,
): boolean {
  const tabsIdx = segments.findIndex((s) => s === '(tabs)');
  if (tabsIdx !== -1) {
    const tab = segments[tabsIdx + 1];
    return !tab || tab === 'index' || tab === 'explore' || tab === 'profile';
  }

  // Some navigator states only expose the leaf segment.
  const first = segments[0];
  if (first === 'index' || first === 'explore' || first === 'profile') {
    return true;
  }

  // Pathname fallback — never treat bare `/` as home unless we're inside tabs.
  if (pathname === '/explore' || pathname === '/profile') return true;
  if (pathname === '/' && segments.length === 1 && segments[0] === '(tabs)') {
    return true;
  }

  return false;
}

export interface ProfilePicDeferInput {
  userId?: string | null;
  segments: string[];
  pathname?: string | null;
}

/**
 * Profile-pic nudge waits until primary onboarding is done, but shows as soon
 * as the user reaches home tabs — no need to complete a workout first.
 */
export async function shouldDeferProfilePicPrompt(
  input: ProfilePicDeferInput,
): Promise<boolean> {
  if (await shouldDeferAuxiliaryOnboardingGates(input.userId)) return true;
  if (!isOnAuthenticatedHomeTab(input.segments, input.pathname)) return true;

  // Brief window after metrics while mood-intro / workout handoff is in flight.
  if (await isWorkoutHandoffPending(input.userId)) return true;

  try {
    if (!(await isHealthOnboardingComplete())) return true;
  } catch {
    return true;
  }

  return false;
}
