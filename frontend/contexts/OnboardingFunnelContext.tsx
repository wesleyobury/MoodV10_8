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

/* ---------------------------- Domain types ---------------------------- */

export type MoodId = 'sweat' | 'muscle' | 'explosive' | 'lazy' | 'calisthenics' | 'outdoor';

export type PrimaryGoal =
  | 'feel_better'
  | 'build_strength'
  | 'lose_weight'
  | 'stress_relief'
  | 'consistency';

export type FitnessLevel = 'sedentary' | 'casual' | 'active' | 'athletic';

export type BiggestBarrier = 'time' | 'energy' | 'motivation' | 'unsure';

export type WorkoutLength = 10 | 20 | 30 | 45;

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
  reset: () => Promise<void>;
}

/* --------------------------- Storage layer --------------------------- */

const STORAGE_KEY = '@mood_funnel_answers_v1';

async function readPersisted(): Promise<FunnelAnswers> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FunnelAnswers) : {};
  } catch {
    return {};
  }
}

async function writePersisted(next: FunnelAnswers): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Silent — funnel still works in-memory.
  }
}

/* ----------------------------- Provider ----------------------------- */

const Ctx = createContext<OnboardingFunnelContextValue | undefined>(undefined);

export function OnboardingFunnelProvider({ children }: { children: React.ReactNode }) {
  const [answers, setAnswers] = useState<FunnelAnswers>({});
  const timingsRef = useRef<Map<number, FunnelStepTiming>>(new Map());

  // Rehydrate once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const persisted = await readPersisted();
      if (!cancelled) setAnswers(persisted);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const patch = useCallback((delta: Partial<FunnelAnswers>) => {
    setAnswers((prev) => {
      const next = { ...prev, ...delta };
      writePersisted(next);
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
      writePersisted(next);
      return next;
    });
  }, []);

  const reset = useCallback(async () => {
    timingsRef.current.clear();
    setAnswers({});
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
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
  feel_better: 'Feel better',
  build_strength: 'Build strength',
  lose_weight: 'Lose weight',
  stress_relief: 'Stress relief',
  consistency: 'Consistency',
};

export const LEVEL_LABELS: Record<FitnessLevel, string> = {
  sedentary: 'Sedentary',
  casual: 'Casual',
  active: 'Active',
  athletic: 'Athletic',
};
