/**
 * In-app rating prompt — soft pre-prompt → native StoreReview dialog.
 *
 * Placement (Spec §3): fires at the post-achievement-card moment — i.e. on
 * achievement-card close OR post-share success in `create-post.tsx`, BEFORE
 * Soft Paywall #2 is evaluated. See `maybeRequestReview`.
 *
 * Trigger: the user's 3rd COMPLETED workout. We keep our own completion
 * counter in AsyncStorage (`recordWorkoutCompletionForRating`, called from
 * `workout-session.tsx`) so the gate works for everyone — free users and
 * subscribers alike — independent of the server free-workout counter.
 *
 * Why a soft pre-prompt: Apple rate-limits the native dialog (~3 prompts/yr,
 * and the OS can silently suppress it). Gating the real dialog behind a cheap
 * "Enjoying MOOD?" Alert means we only spend a prompt on users who
 * self-identify as happy — which lifts star averages and routes unhappy users
 * to feedback instead of a one-star review.
 *
 * Requires `expo-store-review` (run `npx expo install expo-store-review` and
 * rebuild the dev/EAS client — it ships a native module).
 */
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

/** Persisted completed-workout counter (ALL users). */
const WORKOUT_COUNT_KEY = '@mood_completed_workout_count_v1';
/** One-shot: the rating pre-prompt has been shown (any outcome). */
const RATING_PROMPT_SHOWN_KEY = '@mood_rating_prompt_shown_v1';
/** Which completion number triggers the prompt. Bump to A/B the moment. */
export const RATING_TRIGGER_AT = 3;

/**
 * Increment + persist the completed-workout counter. Call exactly once per
 * completed session. Returns the new total. Never throws.
 */
export async function recordWorkoutCompletionForRating(): Promise<{ count: number }> {
  try {
    const raw = await AsyncStorage.getItem(WORKOUT_COUNT_KEY);
    const prev = Number.parseInt(raw ?? '0', 10);
    const count = Number.isFinite(prev) ? prev + 1 : 1;
    await AsyncStorage.setItem(WORKOUT_COUNT_KEY, String(count));
    return { count };
  } catch {
    return { count: 0 };
  }
}

async function getCompletedCount(): Promise<number> {
  try {
    const n = Number.parseInt((await AsyncStorage.getItem(WORKOUT_COUNT_KEY)) ?? '0', 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

async function hasShownPrompt(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(RATING_PROMPT_SHOWN_KEY)) === 'true';
  } catch {
    return false;
  }
}

async function markPromptShown(): Promise<void> {
  try {
    await AsyncStorage.setItem(RATING_PROMPT_SHOWN_KEY, 'true');
  } catch {
    /* ignore — worst case we re-show once */
  }
}

export type RatingPromptOutcome =
  | 'shown_review_requested' // user said yes → native dialog requested
  | 'shown_feedback' // user said no → routed to feedback
  | 'suppressed_not_eligible' // not the Nth workout / already shown
  | 'suppressed_unavailable'; // StoreReview not available on this device

export interface MaybeRequestReviewOptions {
  /** Analytics / logging hook. */
  onOutcome?: (outcome: RatingPromptOutcome, count: number) => void;
  /** Where "Not really" routes (e.g. open a feedback form / mailto). */
  onRequestFeedback?: () => void;
  /** Skip the count gate (dev/QA only). */
  force?: boolean;
}

/**
 * Evaluate + (maybe) show the rating prompt. Resolves with the outcome.
 *
 * Gating order:
 *   1. one-shot   — never show twice;
 *   2. count gate — only on the RATING_TRIGGER_AT-th completed workout;
 *   3. availability — StoreReview must be available;
 *   4. soft pre-prompt → native dialog on "Love it!".
 *
 * Safe to `await` in a navigation handler: it resolves as soon as the user
 * answers the pre-prompt (the native dialog is fire-and-forget after that),
 * so it never blocks routing for an eligible-but-declining user, and is an
 * instant no-op for everyone else.
 */
export async function maybeRequestReview(
  opts: MaybeRequestReviewOptions = {},
): Promise<RatingPromptOutcome> {
  const { onOutcome, onRequestFeedback, force } = opts;

  const count = await getCompletedCount();
  const emit = (o: RatingPromptOutcome): RatingPromptOutcome => {
    onOutcome?.(o, count);
    return o;
  };

  if (await hasShownPrompt()) return emit('suppressed_not_eligible');
  if (!force && count !== RATING_TRIGGER_AT) return emit('suppressed_not_eligible');

  // Native availability (false on simulators / unsupported OS versions).
  let available = false;
  try {
    available = await StoreReview.isAvailableAsync();
  } catch {
    available = false;
  }
  if (!available) return emit('suppressed_unavailable');

  // Mark BEFORE showing so a crash mid-flow can't re-trigger on next completion.
  await markPromptShown();

  return new Promise<RatingPromptOutcome>((resolve) => {
    Alert.alert(
      'Enjoying MOOD?',
      "You just crushed your third workout. Mind sharing how it's going?",
      [
        {
          text: 'Not really',
          style: 'cancel',
          onPress: () => {
            onRequestFeedback?.();
            resolve(emit('shown_feedback'));
          },
        },
        {
          text: 'Love it!',
          style: 'default',
          onPress: () => {
            // Fire-and-forget; the OS owns whether the dialog actually renders.
            StoreReview.requestReview().catch(() => {});
            resolve(emit('shown_review_requested'));
          },
        },
      ],
      { cancelable: false },
    );
  });
}
