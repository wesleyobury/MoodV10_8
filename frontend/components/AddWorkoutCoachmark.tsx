/**
 * AddWorkoutCoachmark — first-time coaching overlay for the workout-cards screen.
 *
 * Reuses the app's shared OnboardingOverlay (same format as the in-app tips):
 * a dimmed backdrop, a gold arrow pointing at a measured target, and a label
 * card. Here the single target is the FIRST workout card's "Add workout" button.
 * Because that button sits at different vertical positions depending on the path,
 * we never hard-code a position — each WorkoutCard measures its own Add button in
 * window coordinates and reports it up; the provider keeps the top-most one (the
 * first card).
 *
 * Shown ONCE per user (persisted via AsyncStorage). Dismissed by tapping anywhere
 * or "Don't show again" — both permanently dismiss, since this is a one-time tip.
 *
 * IMPORTANT: the context value is memoized so its identity is stable across
 * provider re-renders. Otherwise every re-render would re-run each WorkoutCard's
 * mount/unmount effect and thrash the card counter, making the overlay flicker
 * and dismiss itself before the user interacts.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OnboardingOverlay, { TargetRect } from './OnboardingOverlay';

const STORAGE_KEY = 'mood_coachmark_addworkout_v1';
const COACHMARK_TITLE = 'Build your cart';
const COACHMARK_BODY = 'Add workout to build your cart, swipe cards for variations.';
// Small settle delay so the overlay never appears mid-navigation and never
// catches the tail of the gesture that brought the user onto the screen.
const SHOW_DELAY_MS = 1000;

interface CoachmarkContextValue {
  cardMounted: () => void;
  cardUnmounted: () => void;
  reportFirstAddButton: (rect: TargetRect) => void;
}

const CoachmarkContext = createContext<CoachmarkContextValue | null>(null);

export const useAddWorkoutCoachmark = () => useContext(CoachmarkContext);

export function AddWorkoutCoachmarkProvider({ children }: { children: React.ReactNode }) {
  const [rect, setRect] = useState<TargetRect | null>(null);
  const [active, setActive] = useState(false);

  const seenRef = useRef(false);
  const triggeredRef = useRef(false);
  const cardCount = useRef(0);
  const rectRef = useRef<TargetRect | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        seenRef.current = v === '1';
      })
      .catch(() => {});
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const cardMounted = useCallback(() => {
    cardCount.current += 1;
  }, []);

  const cardUnmounted = useCallback(() => {
    cardCount.current = Math.max(0, cardCount.current - 1);
    // When every workout card has left the screen, tear the tip down so it can
    // never linger over another screen. Not marked "seen" — if the user left
    // before dismissing, it may show again next time.
    if (cardCount.current === 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      triggeredRef.current = false;
      rectRef.current = null;
      setRect(null);
      setActive(false);
    }
  }, []);

  const reportFirstAddButton = useCallback((next: TargetRect) => {
    if (seenRef.current) return;
    // Keep the top-most button (the first card on screen).
    if (!rectRef.current || next.y < rectRef.current.y) {
      rectRef.current = next;
      setRect(next);
    }
    if (!triggeredRef.current && rectRef.current) {
      triggeredRef.current = true;
      timerRef.current = setTimeout(() => setActive(true), SHOW_DELAY_MS);
    }
  }, []);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    seenRef.current = true;
    AsyncStorage.setItem(STORAGE_KEY, '1').catch(() => {});
    setActive(false);
  }, []);

  const value = useMemo<CoachmarkContextValue>(
    () => ({ cardMounted, cardUnmounted, reportFirstAddButton }),
    [cardMounted, cardUnmounted, reportFirstAddButton],
  );

  return (
    <CoachmarkContext.Provider value={value}>
      {children}
      <OnboardingOverlay
        visible={active && !!rect}
        targets={
          rect
            ? [{ rect, title: COACHMARK_TITLE, body: COACHMARK_BODY, icon: 'add-circle' }]
            : []
        }
        onTapAnywhere={dismiss}
        onNeverShow={dismiss}
      />
    </CoachmarkContext.Provider>
  );
}
