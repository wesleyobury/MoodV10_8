/**
 * DraftsContext — persistent "Saved Builds" for in-progress and ready-to-start
 * workout builds. Auto-saves changes to the cart with a 500ms debounce.
 *
 * Lifecycle:
 *   addToCart (first item) → creates draft (in_progress)
 *   any cart change       → patches draft.generated_workout
 *   cart reaches preview  → status = ready_to_start
 *   tap "Begin Workout"   → status = started
 *   workout completion    → status = completed (clears currentDraftId)
 *
 * Guests are identified by an AsyncStorage device_id. On login we merge them
 * into the authenticated user.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/apiConfig';
import { getOrCreateDeviceId } from '../utils/analytics';
import { useAuth } from './AuthContext';
import { useCart, WorkoutItem } from './CartContext';

// ===== Types =====
export interface DraftMoodInput {
  category: string;
  card?: string | null;
}

export interface WorkoutDraft {
  id: string;
  user_id: string | null;
  device_id: string | null;
  title: string;
  mood_input: DraftMoodInput;
  energy_input: Record<string, any> | null;
  preference_inputs: Record<string, any>;
  generated_workout: WorkoutItem[] | null;
  resume_route: string;
  resume_params: Record<string, any>;
  thumbnail_url: string | null;
  step_count: number;
  current_step: number;
  status: 'in_progress' | 'ready_to_start' | 'started' | 'completed' | 'abandoned' | 'expired';
  pinned: boolean;
  created_at: string;
  last_modified_at: string;
  last_viewed_at: string;
  expires_at: string;
}

interface BeginDraftArgs {
  moodCategory: string;
  moodCard?: string | null;
  energyInput?: Record<string, any> | null;
  preferenceInputs?: Record<string, any>;
  resumeRoute?: string;
  resumeParams?: Record<string, any>;
  stepCount?: number;
  currentStep?: number;
}

interface DraftsContextType {
  currentDraftId: string | null;
  setCurrentDraftId: (id: string | null) => void;
  activeCount: number;
  refreshCount: () => Promise<void>;
  listDrafts: (opts?: { includeCompleted?: boolean }) => Promise<WorkoutDraft[]>;
  getDraft: (id: string) => Promise<WorkoutDraft | null>;
  beginDraft: (args: BeginDraftArgs) => Promise<WorkoutDraft | null>;
  patchDraft: (id: string, body: Partial<WorkoutDraft>) => Promise<WorkoutDraft | null>;
  deleteDraft: (id: string) => Promise<boolean>;
  togglePin: (id: string, pinned: boolean) => Promise<WorkoutDraft | null>;
  markReady: () => Promise<void>;
  markStarted: () => Promise<void>;
  markCompleted: () => Promise<void>;
  resumeDraft: (id: string) => Promise<WorkoutDraft | null>;
  mergeGuestDrafts: () => Promise<number>;
}

const DraftsContext = createContext<DraftsContextType | undefined>(undefined);

export const useDrafts = () => {
  const ctx = useContext(DraftsContext);
  if (!ctx) throw new Error('useDrafts must be used within DraftsProvider');
  return ctx;
};

// ===== Title generator — mood-flavored, picked once per draft =====
const TITLE_POOLS: Record<string, string[]> = {
  'Sweat': ['Furnace Plan', 'Heat Wave Build', 'Engine Draft', 'Pulse Plan', 'Cardio Crucible', 'Sweatline Sketch', 'Burn Blueprint'],
  'Muscle Gainer': ['Iron Blueprint', 'Volume Vault', 'Hypertrophy Sketch', 'Tonnage Plan', 'Pump Draft', 'Mass Map', 'Steel Stack'],
  'Build Explosion': ['Power Map', 'Detonator Plan', 'Spring Loaded', 'Velocity Draft', 'Snap Build', 'Fast Twitch Sketch', 'Reactive Plan'],
  "I'm Feeling Lazy": ['Easy Roller', 'Couch Comeback', 'Slow Burn', 'Low-Effort Draft', 'Recovery Lite', 'Soft Start', 'Coast Mode'],
  'Lazy': ['Easy Roller', 'Couch Comeback', 'Slow Burn', 'Low-Effort Draft', 'Recovery Lite', 'Soft Start', 'Coast Mode'],
  'Calisthenics': ['Bar Sketch', 'Bodyweight Blueprint', 'Bar to Floor Plan', 'Skill Build', 'Movement Draft', 'Lever Layout', 'Hand Balance Plan'],
  'Outdoor': ['Trailhead Plan', 'Open Air Build', 'Park Plan', 'Sunlit Sketch', 'Outside Draft', 'Roam Plan', 'Off-Road Layout'],
};

const pickDraftTitle = (moodCategory: string, moodCard?: string | null): string => {
  const pool = TITLE_POOLS[moodCategory] || TITLE_POOLS['Sweat'];
  const base = pool[Math.floor(Math.random() * pool.length)];
  if (moodCard && moodCard.trim() && moodCard !== moodCategory) {
    return `${base} · ${moodCard}`;
  }
  return base;
};

// ===== Provider =====
interface DraftsProviderProps { children: ReactNode; }

export const DraftsProvider: React.FC<DraftsProviderProps> = ({ children }) => {
  const { token, user } = useAuth();
  const { cartItems, replaceCart, clearCart } = useCart();

  const [currentDraftId, setCurrentDraftIdState] = useState<string | null>(null);
  const currentDraftIdRef = useRef<string | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  // Suppress autosave during resume to avoid loop when we replaceCart
  const suppressAutoSaveRef = useRef(false);

  // Save buffer for debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Boot device id
  useEffect(() => {
    getOrCreateDeviceId().then(setDeviceId).catch(() => setDeviceId(null));
  }, []);

  const setCurrentDraftId = useCallback((id: string | null) => {
    currentDraftIdRef.current = id;
    setCurrentDraftIdState(id);
  }, []);

  const headers = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }, [token]);

  const identityQuery = useCallback((): string => {
    // For guests we pass device_id as query param; for authed users the JWT alone is enough
    if (token) return '';
    if (deviceId) return `?device_id=${encodeURIComponent(deviceId)}`;
    return '';
  }, [token, deviceId]);

  // ===== Network helpers =====
  const listDrafts = useCallback(async (opts?: { includeCompleted?: boolean }): Promise<WorkoutDraft[]> => {
    try {
      const q = identityQuery();
      const sep = q ? '&' : '?';
      const url = `${API_URL}/api/workout-drafts${q}${opts?.includeCompleted ? `${sep}include_completed=true` : ''}`;
      const res = await fetch(url, { headers: headers() });
      if (!res.ok) return [];
      return (await res.json()) as WorkoutDraft[];
    } catch {
      return [];
    }
  }, [headers, identityQuery]);

  const refreshCount = useCallback(async () => {
    try {
      const url = `${API_URL}/api/workout-drafts/count${identityQuery()}`;
      const res = await fetch(url, { headers: headers() });
      if (!res.ok) {
        setActiveCount(0);
        return;
      }
      const data = await res.json();
      setActiveCount(typeof data?.count === 'number' ? data.count : 0);
    } catch {
      setActiveCount(0);
    }
  }, [headers, identityQuery]);

  const getDraft = useCallback(async (id: string): Promise<WorkoutDraft | null> => {
    try {
      const url = `${API_URL}/api/workout-drafts/${id}${identityQuery()}`;
      const res = await fetch(url, { headers: headers() });
      if (!res.ok) return null;
      return (await res.json()) as WorkoutDraft;
    } catch {
      return null;
    }
  }, [headers, identityQuery]);

  const patchDraft = useCallback(async (id: string, body: Partial<WorkoutDraft>): Promise<WorkoutDraft | null> => {
    try {
      const url = `${API_URL}/api/workout-drafts/${id}${identityQuery()}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: headers(),
        body: JSON.stringify(body),
      });
      if (!res.ok) return null;
      return (await res.json()) as WorkoutDraft;
    } catch {
      return null;
    }
  }, [headers, identityQuery]);

  const deleteDraft = useCallback(async (id: string): Promise<boolean> => {
    try {
      const url = `${API_URL}/api/workout-drafts/${id}${identityQuery()}`;
      const res = await fetch(url, { method: 'DELETE', headers: headers() });
      if (currentDraftIdRef.current === id) setCurrentDraftId(null);
      refreshCount();
      return res.ok;
    } catch {
      return false;
    }
  }, [headers, identityQuery, refreshCount, setCurrentDraftId]);

  const togglePin = useCallback(async (id: string, pinned: boolean): Promise<WorkoutDraft | null> => {
    return patchDraft(id, { pinned });
  }, [patchDraft]);

  // ===== Draft creation =====
  const beginDraft = useCallback(async (args: BeginDraftArgs): Promise<WorkoutDraft | null> => {
    const title = pickDraftTitle(args.moodCategory, args.moodCard);
    try {
      const body = {
        device_id: deviceId,
        title,
        mood_input: { category: args.moodCategory, card: args.moodCard || null },
        energy_input: args.energyInput || null,
        preference_inputs: args.preferenceInputs || {},
        resume_route: args.resumeRoute || '/cart',
        resume_params: args.resumeParams || {},
        step_count: args.stepCount || 0,
        current_step: args.currentStep || 0,
        status: 'in_progress',
      };
      const res = await fetch(`${API_URL}/api/workout-drafts`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(body),
      });
      if (!res.ok) return null;
      const draft = (await res.json()) as WorkoutDraft;
      setCurrentDraftId(draft.id);
      refreshCount();
      return draft;
    } catch {
      return null;
    }
  }, [deviceId, headers, refreshCount, setCurrentDraftId]);

  // ===== Status transitions =====
  const markReady = useCallback(async () => {
    const id = currentDraftIdRef.current;
    if (!id) return;
    await patchDraft(id, { status: 'ready_to_start' });
    refreshCount();
  }, [patchDraft, refreshCount]);

  const markStarted = useCallback(async () => {
    const id = currentDraftIdRef.current;
    if (!id) return;
    await patchDraft(id, { status: 'started' });
    refreshCount();
  }, [patchDraft, refreshCount]);

  const markCompleted = useCallback(async () => {
    const id = currentDraftIdRef.current;
    if (!id) return;
    await patchDraft(id, { status: 'completed' });
    setCurrentDraftId(null);
    refreshCount();
  }, [patchDraft, refreshCount, setCurrentDraftId]);

  // ===== Resume =====
  const resumeDraft = useCallback(async (id: string): Promise<WorkoutDraft | null> => {
    const draft = await getDraft(id);
    if (!draft) return null;
    suppressAutoSaveRef.current = true;
    if (Array.isArray(draft.generated_workout) && draft.generated_workout.length > 0) {
      replaceCart(draft.generated_workout);
    } else {
      clearCart();
    }
    setCurrentDraftId(draft.id);
    // Re-enable autosave after a tick
    setTimeout(() => { suppressAutoSaveRef.current = false; }, 50);
    return draft;
  }, [getDraft, replaceCart, clearCart, setCurrentDraftId]);

  // ===== Auto-save effect =====
  // Auto-saves the current draft's `generated_workout` (the cart) with a 500ms debounce.
  // If there's no current draft AND a cart item has been added, we DO NOT auto-create —
  // creation happens explicitly via `beginDraft` called from the cart screen on first
  // addition (mood + sub-card are known there).
  useEffect(() => {
    if (suppressAutoSaveRef.current) return;
    if (!currentDraftIdRef.current) return;
    if (!Array.isArray(cartItems)) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const id = currentDraftIdRef.current;
      if (!id) return;

      // Snapshot cart into draft. If cart empty, leave generated_workout null
      const snapshot = cartItems.length > 0 ? cartItems : null;
      const firstImage = snapshot && snapshot[0] ? snapshot[0].imageUrl : null;

      patchDraft(id, {
        generated_workout: snapshot as any,
        thumbnail_url: firstImage || undefined,
      }).catch(() => {});
    }, 500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [cartItems, patchDraft]);

  // ===== Guest → User merge =====
  const mergeGuestDrafts = useCallback(async (): Promise<number> => {
    if (!token || !deviceId) return 0;
    try {
      const res = await fetch(`${API_URL}/api/workout-drafts/merge`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ device_id: deviceId }),
      });
      if (!res.ok) return 0;
      const data = await res.json();
      refreshCount();
      return typeof data?.merged === 'number' ? data.merged : 0;
    } catch {
      return 0;
    }
  }, [token, deviceId, headers, refreshCount]);

  // Auto-merge on login (when token first appears alongside known deviceId)
  const prevTokenRef = useRef<string | null>(null);
  useEffect(() => {
    if (!token || !deviceId) {
      prevTokenRef.current = token;
      return;
    }
    // Only fire on token transition from null → present
    if (prevTokenRef.current === null && token) {
      mergeGuestDrafts().catch(() => {});
    }
    prevTokenRef.current = token;
  }, [token, deviceId, mergeGuestDrafts]);

  // Refresh count on auth changes
  useEffect(() => {
    refreshCount();
  }, [token, user?.id, deviceId, refreshCount]);

  const value = useMemo<DraftsContextType>(() => ({
    currentDraftId,
    setCurrentDraftId,
    activeCount,
    refreshCount,
    listDrafts,
    getDraft,
    beginDraft,
    patchDraft,
    deleteDraft,
    togglePin,
    markReady,
    markStarted,
    markCompleted,
    resumeDraft,
    mergeGuestDrafts,
  }), [
    currentDraftId, setCurrentDraftId, activeCount, refreshCount, listDrafts,
    getDraft, beginDraft, patchDraft, deleteDraft, togglePin, markReady,
    markStarted, markCompleted, resumeDraft, mergeGuestDrafts,
  ]);

  return <DraftsContext.Provider value={value}>{children}</DraftsContext.Provider>;
};
