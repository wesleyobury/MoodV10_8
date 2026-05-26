import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { API_URL } from '../utils/apiConfig';
import { Analytics } from '../utils/analytics';

export type TipKey = 'mood_scroll' | 'form_videos' | 'completion_share';
export type TipState = 'unseen' | 'completed' | 'dismissed' | 'never';

interface OnboardingContextValue {
  /** Master kill switch loaded from /api/app/onboarding-config */
  enabled: boolean;
  /** Tip states (server source of truth, local optimistic) */
  tipsState: Record<TipKey, TipState>;
  /** Currently rendering tip (only one at a time per session) */
  activeTip: TipKey | null;
  /** Returns true if this tip can render now (unseen + not blocked + no other tip active) */
  canRender: (key: TipKey) => boolean;
  /** Lock the visible tip slot to a specific key (call at trigger time) */
  requestRender: (key: TipKey) => boolean;
  /** Release the active tip slot when this key is no longer visible */
  releaseRender: (key: TipKey) => void;
  /** Mark tip as completed (tap or auto-resolve) and persist server-side */
  markCompleted: (key: TipKey) => void;
  /** Mark tip as dismissed (X button) and persist */
  markDismissed: (key: TipKey) => void;
  /** Mark tip as never-show and persist */
  markNeverShow: (key: TipKey) => void;
  /** Track tip_shown analytics (call once per render) */
  trackShown: (key: TipKey) => void;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined,
);

const DEFAULT_STATE: Record<TipKey, TipState> = {
  mood_scroll: 'unseen',
  form_videos: 'unseen',
  completion_share: 'unseen',
};

interface ProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: ProviderProps) {
  const { token, user } = useAuth();
  const [enabled, setEnabled] = useState<boolean>(true);
  const [tipsState, setTipsState] = useState<Record<TipKey, TipState>>(
    DEFAULT_STATE,
  );
  const [activeTip, setActiveTip] = useState<TipKey | null>(null);
  const shownTrackedRef = useRef<Set<string>>(new Set());

  // Sync from user object whenever it updates
  useEffect(() => {
    const remote = (user as any)?.tips_state;
    if (remote && typeof remote === 'object') {
      setTipsState({
        mood_scroll: remote.mood_scroll || 'unseen',
        form_videos: remote.form_videos || 'unseen',
        completion_share: remote.completion_share || 'unseen',
      });
    }
  }, [user]);

  // Fetch master kill switch once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/app/onboarding-config`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setEnabled(Boolean(data.onboarding_tips_enabled));
      } catch {
        // network failure: leave enabled=true (default)
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(
    async (key: TipKey, state: TipState) => {
      if (!token) return;
      try {
        await fetch(`${API_URL}/api/users/me/tips-state`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ key, state }),
        });
      } catch {
        // swallow — tip state is best-effort
      }
    },
    [token],
  );

  const canRender = useCallback(
    (key: TipKey) => {
      if (!enabled) return false;
      if (!token) return false;
      if (tipsState[key] !== 'unseen') return false;
      if (activeTip && activeTip !== key) return false;
      return true;
    },
    [enabled, token, tipsState, activeTip],
  );

  const requestRender = useCallback(
    (key: TipKey) => {
      if (!enabled) return false;
      if (!token) return false;
      if (tipsState[key] !== 'unseen') return false;
      if (activeTip && activeTip !== key) return false;
      if (activeTip !== key) setActiveTip(key);
      return true;
    },
    [enabled, token, tipsState, activeTip],
  );

  const releaseRender = useCallback(
    (key: TipKey) => {
      setActiveTip((cur) => (cur === key ? null : cur));
    },
    [],
  );

  const updateState = useCallback(
    (key: TipKey, state: TipState) => {
      setTipsState((prev) => ({ ...prev, [key]: state }));
      setActiveTip((cur) => (cur === key ? null : cur));
      persist(key, state);
    },
    [persist],
  );

  const markCompleted = useCallback(
    (key: TipKey) => {
      if (token) Analytics.tipTapped(token, { tip_id: key });
      updateState(key, 'completed');
    },
    [token, updateState],
  );

  const markDismissed = useCallback(
    (key: TipKey) => {
      if (token) Analytics.tipDismissed(token, { tip_id: key });
      updateState(key, 'dismissed');
    },
    [token, updateState],
  );

  const markNeverShow = useCallback(
    (key: TipKey) => {
      if (token) Analytics.tipNeverShow(token, { tip_id: key });
      updateState(key, 'never');
    },
    [token, updateState],
  );

  const trackShown = useCallback(
    (key: TipKey) => {
      if (!token) return;
      if (shownTrackedRef.current.has(key)) return;
      shownTrackedRef.current.add(key);
      Analytics.tipShown(token, { tip_id: key });
    },
    [token],
  );

  const value = useMemo(
    () => ({
      enabled,
      tipsState,
      activeTip,
      canRender,
      requestRender,
      releaseRender,
      markCompleted,
      markDismissed,
      markNeverShow,
      trackShown,
    }),
    [
      enabled,
      tipsState,
      activeTip,
      canRender,
      requestRender,
      releaseRender,
      markCompleted,
      markDismissed,
      markNeverShow,
      trackShown,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx)
    throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}
