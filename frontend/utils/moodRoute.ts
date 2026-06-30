/**
 * moodRoute — central mapping from selected mood card → its first decision
 * screen. Used by:
 *
 *   1) `app/(tabs)/index.tsx` (home tab) — every mood card tap
 *   2) `app/onboarding/health-connect.tsx` (Spec §4) — post-wearables-connect
 *      handoff for first-session users. Reads the funnel answers from
 *      AsyncStorage to know which mood was picked back at funnel step 1.
 *
 * Spec §4 route table (provided by Wes 2026-05-27):
 *   sweat         → /workout-type             (training type select)
 *   muscle        → /body-parts               (muscle group select)
 *   explosive     → /explosiveness-type       (training type select)
 *   lazy          → /lazy-training-type       (training type select)
 *   calisthenics  → /calisthenics-equipment   (equipment select)
 *   outdoor       → /outdoor-equipment        (equipment select)
 *   ringer        → /ringer-challenge         (daily challenge — keep as-is)
 *
 * If the funnel-picked mood doesn't match any known id we default to
 * the home tab so the user is never stranded.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type MoodId =
  | 'sweat'
  | 'muscle'
  | 'explosive'
  | 'lazy'
  | 'calisthenics'
  | 'outdoor'
  | 'ringer';

export interface MoodRoute {
  pathname: string;
  params: Record<string, string>;
}

const MOOD_TITLE_FALLBACK: Record<MoodId, string> = {
  sweat: 'Sweat / Burn Fat',
  muscle: 'Muscle Gainer',
  explosive: 'Explosive Power',
  lazy: 'Lazy Day',
  calisthenics: 'Calisthenics',
  outdoor: 'Outdoor',
  ringer: 'Daily Challenge',
};

/** Resolve the first-decision-screen route for a given mood id. */
export function routeForMood(moodId: string | null | undefined, moodTitle?: string): MoodRoute | null {
  const title = moodTitle ?? (moodId && MOOD_TITLE_FALLBACK[moodId as MoodId]) ?? '';
  switch (moodId) {
    case 'sweat':
      return { pathname: '/workout-type', params: { mood: title } };
    case 'muscle':
      return { pathname: '/body-parts', params: { mood: title } };
    case 'explosive':
      return { pathname: '/explosiveness-type', params: { mood: title } };
    case 'lazy':
      return { pathname: '/lazy-training-type', params: { mood: title } };
    case 'calisthenics':
      return { pathname: '/calisthenics-equipment', params: { mood: title } };
    case 'outdoor':
      return { pathname: '/outdoor-equipment', params: { mood: title } };
    case 'ringer':
      return { pathname: '/ringer-challenge', params: { mood: title } };
    default:
      return null;
  }
}

const FUNNEL_ANSWERS_KEY_PREFIX = '@mood_funnel_answers_v1';
const SEEN_INTRO_KEY = '@mood_intro_seen_v1';

/** Whether the user has already seen the mood-intro interstitial for this mood.
 *  Returning users see each mood's intro once (a newly-picked mood card can have
 *  a different layout/flow), then skip it on repeat visits. */
export async function hasSeenMoodIntro(moodId: string): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_INTRO_KEY);
    if (!raw) return false;
    const seen = JSON.parse(raw);
    return Array.isArray(seen) && seen.includes(moodId);
  } catch {
    return false;
  }
}

/** Mark a mood's intro as seen so it won't show again for that mood. */
export async function markMoodIntroSeen(moodId: string): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_INTRO_KEY);
    const seen: string[] = raw ? JSON.parse(raw) : [];
    if (!seen.includes(moodId)) {
      seen.push(moodId);
      await AsyncStorage.setItem(SEEN_INTRO_KEY, JSON.stringify(seen));
    }
  } catch {
    // Non-fatal — worst case the intro shows again.
  }
}

/** Read the mood picked during the onboarding funnel (step 1).
 *  Returns null when no answers persisted yet (e.g. returning user
 *  who never went through the funnel — defaults to home). */
export async function readFunnelMoodId(userId?: string | null): Promise<string | null> {
  try {
    let raw: string | null = null;
    if (userId) {
      raw = await AsyncStorage.getItem(`${FUNNEL_ANSWERS_KEY_PREFIX}:${userId}`);
    }
    if (!raw) {
      raw = await AsyncStorage.getItem(FUNNEL_ANSWERS_KEY_PREFIX);
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.mood === 'string' ? parsed.mood : null;
  } catch {
    return null;
  }
}
