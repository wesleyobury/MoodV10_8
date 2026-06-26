/**
 * Onboarding Funnel Context — Phase A of the paid launch funnel.
 *
 * Holds the 8-screen funnel answers in memory, persists them to AsyncStorage
 * under a versioned key, and exposes a typed setter per question. Survives
 * app backgrounding mid-funnel so the user never loses progress.
 *
 * Persistence is intentionally local-only here. A future ticket will mirror
 * these to the backend `users.preferences` blob once the algorithm consumes
 * them.
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

/* ---------------------------- Domain types ---------------------------- */

export type MoodId = 'sweat' | 'muscle' | 'explosive' | 'lazy' | 'calisthenics' | 'outdoor';

export type PrimaryGoal =
  | 'feel_better'
  | 'build_strength'
  | 'improve_physique'
  | 'lose_weight'
  | 'stress_relief'
  | 'consistency';

export type FitnessLevel = 'sedentary' | 'casual' | 'active' | 'athletic';

export type BiggestBarrier = 'time' | 'energy' | 'motivation' | 'unsure';

export type WorkoutLength = 20 | 30 | 45 | 60 | 90;

export type EquipmentAccess = 'bodyweight' | 'dumbbells' | 'bands' | 'full_gym';

export interface BuildForMeChoice {
  /** e.g., "Standard · 30m" — the option label the user tapped on Screen 2. */
  label: string;
  /** Free-form key tied to the mood, e.g., "sweat::standard". */
  optionId: string;
}

export interface FunnelAnswers {
  mood?: MoodId;
  buildForMe?: BuildForMeChoice;
  primaryGoal?: PrimaryGoal;
  fitnessLevel?: FitnessLevel;
  biggestBarrier?: BiggestBarrier;
  workoutLength?: WorkoutLength;
  equipment?: EquipmentAccess;
  completedAt?: string; // ISO timestamp
}

interface FunnelStepTiming {
  step: number;
  enteredAt: number;
}

interface OnboardingFunnelContextValue {
  answers: FunnelAnswers;
  setMood: (mood: MoodId) => void;
  setBuildForMe: (choice: BuildForMeChoice) => void;
  setPrimaryGoal: (goal: PrimaryGoal) => void;
  setFitnessLevel: (level: FitnessLevel) => void;
  setBiggestBarrier: (barrier: BiggestBarrier) => void;
  setWorkoutLength: (length: WorkoutLength) => void;
  setEquipment: (equipment: EquipmentAccess) => void;
  /** Returns ms spent on the given step since `markStepEntered` was called. */
  markStepEntered: (step: number) => void;
  consumeStepDuration: (step: number) => number;
  markCompleted: () => Promise<void>;
  /**
   * Spec §2c — true once the user has reached `reveal-payoff` at least
   * once. Persisted via `answers.completedAt`. Read by FunnelEntryGate
   * and the landing `handleGetStarted` so a returning user can never
   * be rerouted back into the 8-step funnel.
   */
  hasCompletedFunnel: boolean;
  reset: () => Promise<void>;
}

/** Spec §2c — async one-shot read used by gates that fire before the
 *  provider has rehydrated (e.g. cold-start route guards). Reads the same
 *  per-user key directly so callers don't need to mount the provider. */
export async function readHasCompletedFunnel(userId?: string | null): Promise<boolean> {
  try {
    const answers = await readPersistedForUser(userId ?? null);
    return Boolean(answers.completedAt);
  } catch {
    return false;
  }
}

/* --------------------------- Storage layer --------------------------- */

const STORAGE_KEY_PREFIX = '@mood_funnel_answers_v1';
const LEGACY_STORAGE_KEY = STORAGE_KEY_PREFIX;

function funnelStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

async function readLegacyPersisted(): Promise<FunnelAnswers> {
  try {
    const raw = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FunnelAnswers) : {};
  } catch {
    return {};
  }
}

async function readPersistedForUser(userId: string | null): Promise<FunnelAnswers> {
  if (!userId) return readLegacyPersisted();
  try {
    const scopedRaw = await AsyncStorage.getItem(funnelStorageKey(userId));
    if (scopedRaw) return JSON.parse(scopedRaw) as FunnelAnswers;

    // One-time migration from the pre-user-scoping device-wide blob.
    const legacy = await readLegacyPersisted();
    if (Object.keys(legacy).length > 0) {
      await AsyncStorage.setItem(funnelStorageKey(userId), JSON.stringify(legacy));
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
    }
    return legacy;
  } catch {
    return {};
  }
}

async function writePersistedForUser(userId: string | null, next: FunnelAnswers): Promise<void> {
  if (!userId) return;
  try {
    await AsyncStorage.setItem(funnelStorageKey(userId), JSON.stringify(next));
    await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Silent — funnel still works in-memory.
  }
}

/* ----------------------------- Provider ----------------------------- */

const Ctx = createContext<OnboardingFunnelContextValue | undefined>(undefined);

export function OnboardingFunnelProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const [answers, setAnswers] = useState<FunnelAnswers>({});
  const timingsRef = useRef<Map<number, FunnelStepTiming>>(new Map());

  // Rehydrate per-user answers when the authenticated user changes.
  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setAnswers({});
      return;
    }
    (async () => {
      const persisted = await readPersistedForUser(userId);
      if (!cancelled) setAnswers(persisted);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const patch = useCallback((delta: Partial<FunnelAnswers>) => {
    setAnswers((prev) => {
      const next = { ...prev, ...delta };
      writePersistedForUser(userIdRef.current, next);
      return next;
    });
  }, []);

  const markStepEntered = useCallback((step: number) => {
    timingsRef.current.set(step, { step, enteredAt: Date.now() });
  }, []);

  const consumeStepDuration = useCallback((step: number) => {
    const t = timingsRef.current.get(step);
    if (!t) return 0;
    timingsRef.current.delete(step);
    return Date.now() - t.enteredAt;
  }, []);

  const markCompleted = useCallback(async () => {
    const completedAt = new Date().toISOString();
    setAnswers((prev) => {
      const next = { ...prev, completedAt };
      writePersistedForUser(userIdRef.current, next);
      return next;
    });
  }, []);

  const reset = useCallback(async () => {
    timingsRef.current.clear();
    setAnswers({});
    const uid = userIdRef.current;
    if (!uid) return;
    try {
      await AsyncStorage.removeItem(funnelStorageKey(uid));
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value: OnboardingFunnelContextValue = useMemo(
    () => ({
      answers,
      setMood: (mood) => patch({ mood }),
      setBuildForMe: (buildForMe) => patch({ buildForMe }),
      setPrimaryGoal: (primaryGoal) => patch({ primaryGoal }),
      setFitnessLevel: (fitnessLevel) => patch({ fitnessLevel }),
      setBiggestBarrier: (biggestBarrier) => patch({ biggestBarrier }),
      setWorkoutLength: (workoutLength) => patch({ workoutLength }),
      setEquipment: (equipment) => patch({ equipment }),
      markStepEntered,
      consumeStepDuration,
      markCompleted,
      // Spec §2c — derive from the same persisted field `markCompleted`
      // writes. True the moment `reveal-payoff` is reached for the first
      // time; survives app kills and re-login (scoped per user id).
      hasCompletedFunnel: Boolean(answers.completedAt),
      reset,
    }),
    [answers, patch, markStepEntered, consumeStepDuration, markCompleted, reset]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOnboardingFunnel(): OnboardingFunnelContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error('useOnboardingFunnel must be used inside <OnboardingFunnelProvider>');
  }
  return ctx;
}

/* ------------------------ Display helpers ------------------------ */

export const MOOD_DISPLAY: Record<MoodId, { title: string; subtitle: string; gradient: readonly [string, string] }> = {
  sweat: { title: 'Sweat', subtitle: 'High intensity', gradient: ['#FF6B6B', '#FF8E53'] },
  muscle: { title: 'Muscle', subtitle: 'Strength', gradient: ['#4ECDC4', '#44A08D'] },
  explosive: { title: 'Explosive', subtitle: 'Power', gradient: ['#FFD93D', '#FF6B6B'] },
  lazy: { title: 'Lazy', subtitle: 'Gentle', gradient: ['#D299C2', '#FEF9D7'] },
  calisthenics: { title: 'Calisthenics', subtitle: 'Bodyweight', gradient: ['#667eea', '#764ba2'] },
  outdoor: { title: 'Outdoor', subtitle: 'Fresh air', gradient: ['#56ab2f', '#a8e6cf'] },
};

export const GOAL_LABELS: Record<PrimaryGoal, string> = {
  feel_better: 'Feel better day to day',
  build_strength: 'Build strength / muscle',
  improve_physique: 'Improve physique',
  lose_weight: 'Lose weight',
  stress_relief: 'Relieve stress',
  consistency: 'Just stay consistent',
};

export const LEVEL_LABELS: Record<FitnessLevel, string> = {
  sedentary: 'Sedentary',
  casual: 'Casual',
  active: 'Active',
  athletic: 'Athletic',
};
