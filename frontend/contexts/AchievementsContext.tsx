/**
 * AchievementsContext — v2 gamification badge engine (client side).
 *
 * WHY A NEW CONTEXT (not BadgeContext): `BadgeContext`/`useBadges` already
 * exists for notification + message COUNTS. This is the achievement/gamification
 * system, namespaced "achievements" to avoid the collision.
 *
 * RESPONSIBILITIES
 *  - Fetch the single source of truth: GET /api/achievements/state.
 *  - Detect newly-earned badges by diffing against a persisted baseline
 *    (AsyncStorage), so an existing user is NOT spammed on first load.
 *  - Fire a `badge_earned` analytics event for client-detected badges (this
 *    also populates the public Live feed). Server badges (inspiring_others)
 *    are emitted by the server, never here.
 *  - Celebrate with a lightweight toast that DEFERS to paywalls and caps at
 *    one per foreground session (see design guardrails).
 *
 * The toast host is rendered here so it's mounted exactly once near the root.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  AppState,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/apiConfig';
import { Analytics } from '../utils/analytics';
import { useAuth } from './AuthContext';
import { useSubscription } from './SubscriptionContext';
import {
  AchievementSignals,
  AchievementDef,
  EMPTY_SIGNALS,
  ACHIEVEMENTS,
  ACHIEVEMENTS_BY_ID,
  evaluateEarned,
} from '../constants/achievements';
import AchievementMedallion from '../components/AchievementMedallion';

// Badges the SERVER awards + emits events for. The client celebrates them but
// must never emit `badge_earned` for them (the server already did).
const SERVER_BADGE_IDS = new Set(['inspiring_others']);

const K_EMITTED = '@mood_ach_emitted';
const K_CELEBRATED = '@mood_ach_celebrated';
const K_INITIALIZED = '@mood_ach_initialized';

// How long after a paywall clears before a badge toast may appear.
const PAYWALL_COOLDOWN_MS = 4000;

interface AchievementsContextType {
  signals: AchievementSignals;
  earnedIds: string[];
  loading: boolean;
  /** Re-fetch state + run detection. Call on home / stats focus. */
  refresh: () => Promise<void>;
}

const AchievementsContext = createContext<AchievementsContextType>({
  signals: EMPTY_SIGNALS,
  earnedIds: [],
  loading: false,
  refresh: async () => {},
});

export const useAchievements = () => useContext(AchievementsContext);

async function loadSet(key: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

async function saveSet(key: string, set: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch {
    /* best-effort */
  }
}

export function AchievementsProvider({ children }: { children: React.ReactNode }) {
  const { token, isGuest } = useAuth();
  const { pendingTrigger } = useSubscription();

  const [signals, setSignals] = useState<AchievementSignals>(EMPTY_SIGNALS);
  const [earnedIds, setEarnedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeToast, setActiveToast] = useState<AchievementDef | null>(null);

  // Persisted sets (loaded once)
  const emittedRef = useRef<Set<string>>(new Set());
  const celebratedRef = useRef<Set<string>>(new Set());
  const setsLoadedRef = useRef(false);
  const initializedRef = useRef(false);

  // One toast per foreground session
  const sessionShownRef = useRef(false);
  // Cooldown after a paywall dismiss
  const cooldownUntilRef = useRef(0);
  const prevTriggerRef = useRef<typeof pendingTrigger>(null);
  // Queue of earned-but-not-yet-celebrated defs waiting for the gate to open
  const queueRef = useRef<AchievementDef[]>([]);

  // Reset the per-session cap whenever the app returns to the foreground.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') sessionShownRef.current = false;
    });
    return () => sub.remove();
  }, []);

  // Track paywall open→close transitions to arm the cooldown.
  useEffect(() => {
    const prev = prevTriggerRef.current;
    if (prev && !pendingTrigger) {
      cooldownUntilRef.current = Date.now() + PAYWALL_COOLDOWN_MS;
    }
    prevTriggerRef.current = pendingTrigger;
    // A paywall just opened → hide any visible toast so we never stack them.
    if (!prev && pendingTrigger && activeToast) {
      setActiveToast(null);
    }
  }, [pendingTrigger, activeToast]);

  const gateOpen = useCallback(() => {
    return (
      !!token &&
      !isGuest &&
      pendingTrigger == null &&
      Date.now() >= cooldownUntilRef.current
    );
  }, [token, isGuest, pendingTrigger]);

  const flushQueue = useCallback(() => {
    if (sessionShownRef.current) return;
    if (!gateOpen()) return;
    const next = queueRef.current.shift();
    if (!next) return;
    sessionShownRef.current = true;
    setActiveToast(next);
    celebratedRef.current.add(next.id);
    void saveSet(K_CELEBRATED, celebratedRef.current);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }, [gateOpen]);

  const runDetection = useCallback(
    async (s: AchievementSignals) => {
      if (!token || isGuest) return;

      if (!setsLoadedRef.current) {
        emittedRef.current = await loadSet(K_EMITTED);
        celebratedRef.current = await loadSet(K_CELEBRATED);
        const initFlag = await AsyncStorage.getItem(K_INITIALIZED);
        initializedRef.current = initFlag === 'true';
        setsLoadedRef.current = true;
      }

      const earned = evaluateEarned(s);
      setEarnedIds(earned);

      // FIRST-EVER load for this user: baseline everything currently earned so
      // we don't spam an established user with 15 toasts + feed events.
      if (!initializedRef.current) {
        earned.forEach((id) => {
          emittedRef.current.add(id);
          celebratedRef.current.add(id);
        });
        await saveSet(K_EMITTED, emittedRef.current);
        await saveSet(K_CELEBRATED, celebratedRef.current);
        await AsyncStorage.setItem(K_INITIALIZED, 'true');
        initializedRef.current = true;
        return;
      }

      // 1) Emit tracking/feed events for newly-earned CLIENT badges (once each).
      for (const id of earned) {
        if (SERVER_BADGE_IDS.has(id)) continue;
        if (emittedRef.current.has(id)) continue;
        const def = ACHIEVEMENTS_BY_ID[id];
        if (!def) continue;
        emittedRef.current.add(id);
        void Analytics.badgeEarned(token, {
          badge_id: def.id,
          badge_label: def.label,
          badge_icon: def.icon,
          badge_category: def.category,
        });
      }
      await saveSet(K_EMITTED, emittedRef.current);

      // 2) Queue newly-earned badges (client + server) for celebration.
      const pending = earned
        .filter((id) => !celebratedRef.current.has(id))
        .map((id) => ACHIEVEMENTS_BY_ID[id])
        .filter(Boolean) as AchievementDef[];
      // De-dupe against anything already queued.
      const queuedIds = new Set(queueRef.current.map((d) => d.id));
      for (const def of pending) {
        if (!queuedIds.has(def.id)) queueRef.current.push(def);
      }
      // Highest priority first (inspiring_others, first workout, …).
      queueRef.current.sort((a, b) => (b.priority || 0) - (a.priority || 0));

      flushQueue();
    },
    [token, isGuest, flushQueue],
  );

  const refresh = useCallback(async () => {
    if (!token || isGuest) {
      setEarnedIds([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/achievements/state`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as AchievementSignals;
        const merged: AchievementSignals = { ...EMPTY_SIGNALS, ...data };
        setSignals(merged);
        await runDetection(merged);
      }
    } catch (err) {
      console.warn('Achievements refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, [token, isGuest, runDetection]);

  // Initial load + reset on logout.
  useEffect(() => {
    if (token && !isGuest) {
      refresh();
    } else {
      setEarnedIds([]);
      setSignals(EMPTY_SIGNALS);
      setActiveToast(null);
      // Fresh device sets are per-account; reload lazily on next detection.
      setsLoadedRef.current = false;
    }
  }, [token, isGuest, refresh]);

  // If the gate was closed when a badge landed, retry shortly after it opens.
  useEffect(() => {
    if (!activeToast && queueRef.current.length > 0 && gateOpen()) {
      const t = setTimeout(flushQueue, 600);
      return () => clearTimeout(t);
    }
  }, [activeToast, pendingTrigger, flushQueue, gateOpen]);

  const value: AchievementsContextType = {
    signals,
    earnedIds,
    loading,
    refresh,
  };

  return (
    <AchievementsContext.Provider value={value}>
      {children}
      <AchievementToastHost
        def={activeToast}
        onDismiss={() => setActiveToast(null)}
      />
    </AchievementsContext.Provider>
  );
}

// ───────────────────────── Toast host ─────────────────────────

function AchievementToastHost({
  def,
  onDismiss,
}: {
  def: AchievementDef | null;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-24)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animateOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -16, duration: 220, useNativeDriver: true }),
    ]).start(() => onDismiss());
  }, [opacity, translateY, onDismiss]);

  useEffect(() => {
    if (!def) return;
    opacity.setValue(0);
    translateY.setValue(-24);
    scale.setValue(0.96);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 14, stiffness: 160 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 12, stiffness: 150 }),
    ]).start();

    hideTimer.current = setTimeout(animateOut, 4200);
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [def, opacity, translateY, scale, animateOut]);

  if (!def) return null;

  return (
    <View style={[styles.host, { top: insets.top + 8 }]} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.toast,
          { opacity, transform: [{ translateY }, { scale }] },
        ]}
      >
        <Pressable style={styles.toastInner} onPress={animateOut} accessibilityRole="button">
          <AchievementMedallion icon={def.icon as any} size={46} />
          <View style={styles.textCol}>
            <Text style={styles.eyebrow}>BADGE UNLOCKED</Text>
            <Text style={styles.title} numberOfLines={1}>{def.label}</Text>
            <Text style={styles.desc} numberOfLines={2}>{def.description}</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

export const ACHIEVEMENTS_LIST = ACHIEVEMENTS;

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    width: '92%',
    maxWidth: 380,
    borderRadius: 18,
    backgroundColor: 'rgba(20,19,24,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.28)',
    // Depth — a lifted glassy card, not a flat rectangle.
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.55,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 14 },
      },
      android: { elevation: 14 },
      default: {},
    }),
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 13,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  desc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '400',
    marginTop: 1,
    lineHeight: 16,
  },
});

export { AchievementsContext };
