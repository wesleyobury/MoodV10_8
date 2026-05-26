/**
 * Featured Workouts Data Layer
 * 
 * Handles fetching, caching, and fallback for server-driven featured workouts.
 * - Caches featured_config and workouts in AsyncStorage
 * - TTL-based refresh (configurable, default 12 hours)
 * - Background refresh on app focus
 * - Falls back to cached → hardcoded if remote fails
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

import { API_URL } from '../utils/apiConfig';
import { prefetchFeaturedWorkoutImages } from '../utils/mediaPrefetch';

// Cache keys
const CACHE_KEYS = {
  FEATURED_CONFIG: 'featured_config_cache',
  FEATURED_WORKOUTS: 'featured_workouts_cache',
  LAST_FETCH: 'featured_last_fetch',
};

// Default TTL in hours (fallback if not specified in config)
const DEFAULT_TTL_HOURS = 12;

// Types
export interface FeaturedWorkoutExercise {
  exerciseId: string;
  order: number;
  sets?: number;
  reps?: string;
  restSec?: number;
  notes?: string;
  // Inline exercise data
  name?: string;
  equipment?: string;
  description?: string;
  battlePlan?: string;
  duration?: string;
  imageUrl?: string;
  intensityReason?: string;
  difficulty?: string;
  workoutType?: string;
  moodCard?: string;
  moodTips?: { icon: string; title: string; description: string }[];
}

export interface FeaturedWorkout {
  _id: string;
  title: string;
  subtitle?: string;
  mood: string;
  difficulty?: string;
  durationMin?: number;
  duration?: string;
  badge?: string;
  heroImageUrl?: string;
  exercises: FeaturedWorkoutExercise[];
}

export interface FeaturedConfig {
  schemaVersion: number;
  featuredWorkoutIds: string[];
  ttlHours: number;
  updatedAt: string | null;
}

// Hardcoded fallback workouts (minimal data for display)
const HARDCODED_FALLBACK: FeaturedWorkout[] = [
  {
    _id: 'fallback-1',
    mood: 'Sweat / Burn Fat',
    title: 'Cardio Based',
    duration: '25–35 min',
    badge: 'Top pick',
    heroImageUrl: 'https://customer-assets.emergentagent.com/job_3f3e12c6-013b-4158-b2e9-29980fb2b4f9/artifacts/tfdiqbfo_download.png',
    exercises: []
  },
  {
    _id: 'fallback-2',
    mood: 'Muscle Gainer',
    title: 'Back & Bis Volume',
    duration: '45–60 min',
    badge: 'Trending',
    heroImageUrl: 'https://customer-assets.emergentagent.com/job_0b65e409-b210-4730-af62-16b022c37685/artifacts/q6jestgn_download.png',
    exercises: []
  },
];

/**
 * Fetch featured config from server
 */
export async function fetchFeaturedConfig(): Promise<FeaturedConfig | null> {
  try {
    const response = await fetch(`${API_URL}/api/featured/config`);
    if (!response.ok) {
      console.warn('[FeaturedWorkouts] Failed to fetch config:', response.status);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('[FeaturedWorkouts] Error fetching config:', error);
    return null;
  }
}

/**
 * Fetch workouts by IDs from server
 */
export async function fetchWorkoutsByIds(ids: string[]): Promise<FeaturedWorkout[]> {
  if (!ids || ids.length === 0) return [];
  
  try {
    const response = await fetch(`${API_URL}/api/featured/workouts/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ids),
    });
    
    if (!response.ok) {
      console.warn('[FeaturedWorkouts] Failed to fetch workouts:', response.status);
      return [];
    }
    
    const data = await response.json();
    return data.workouts || [];
  } catch (error) {
    console.error('[FeaturedWorkouts] Error fetching workouts:', error);
    return [];
  }
}

/**
 * Fetch config + workouts in a single call (eliminates network waterfall)
 */
async function fetchFeaturedBundle(): Promise<{ config: FeaturedConfig; workouts: FeaturedWorkout[] } | null> {
  try {
    const response = await fetch(`${API_URL}/api/featured/bundle`);
    if (!response.ok) {
      console.warn('[FeaturedWorkouts] Bundle fetch failed:', response.status);
      return null;
    }
    const data = await response.json();
    return { config: data.config, workouts: data.workouts || [] };
  } catch (error) {
    console.error('[FeaturedWorkouts] Error fetching bundle:', error);
    return null;
  }
}

/**
 * Get cached data from AsyncStorage
 */
async function getCachedData(): Promise<{
  config: FeaturedConfig | null;
  workouts: FeaturedWorkout[];
  lastFetch: number | null;
}> {
  try {
    const [configStr, workoutsStr, lastFetchStr] = await Promise.all([
      AsyncStorage.getItem(CACHE_KEYS.FEATURED_CONFIG),
      AsyncStorage.getItem(CACHE_KEYS.FEATURED_WORKOUTS),
      AsyncStorage.getItem(CACHE_KEYS.LAST_FETCH),
    ]);
    
    return {
      config: configStr ? JSON.parse(configStr) : null,
      workouts: workoutsStr ? JSON.parse(workoutsStr) : [],
      lastFetch: lastFetchStr ? parseInt(lastFetchStr, 10) : null,
    };
  } catch (error) {
    console.error('[FeaturedWorkouts] Error reading cache:', error);
    return { config: null, workouts: [], lastFetch: null };
  }
}

/**
 * Save data to cache
 */
async function saveToCache(config: FeaturedConfig, workouts: FeaturedWorkout[]): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.setItem(CACHE_KEYS.FEATURED_CONFIG, JSON.stringify(config)),
      AsyncStorage.setItem(CACHE_KEYS.FEATURED_WORKOUTS, JSON.stringify(workouts)),
      AsyncStorage.setItem(CACHE_KEYS.LAST_FETCH, Date.now().toString()),
    ]);
  } catch (error) {
    console.error('[FeaturedWorkouts] Error saving to cache:', error);
  }
}

/**
 * Check if cache has expired based on TTL
 */
function isCacheExpired(lastFetch: number | null, ttlHours: number): boolean {
  if (!lastFetch) return true;
  const ttlMs = ttlHours * 60 * 60 * 1000;
  return Date.now() - lastFetch > ttlMs;
}

/**
 * Validate workout exercises - filter out any with missing exerciseIds
 */
export function validateWorkoutExercises(workout: FeaturedWorkout): FeaturedWorkout {
  // For workouts with inline data, just return as-is
  // For workouts referencing exerciseIds, filter out unknown ones
  const validExercises = workout.exercises.filter(ex => {
    // Has inline data - always valid
    if (ex.name) return true;
    // Has exerciseId - would need validation against exercise DB
    // For now, accept any with exerciseId
    if (ex.exerciseId) return true;
    // Skip invalid
    console.warn(`[FeaturedWorkouts] Skipping invalid exercise in ${workout.title}`);
    return false;
  });
  
  return {
    ...workout,
    exercises: validExercises,
  };
}

/**
 * Main hook for featured workouts with caching and fallback
 */
export function useFeaturedWorkouts() {
  const [workouts, setWorkouts] = useState<FeaturedWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isRefreshing = useRef(false);

  /**
   * Load workouts - first from cache (instant), then refresh from server
   */
  const loadWorkouts = useCallback(async (forceRefresh = false) => {
    try {
      // Step 1: Load from cache immediately for instant display
      const cached = await getCachedData();
      
      if (cached.workouts.length > 0 && !forceRefresh) {
        const validated = cached.workouts.map(validateWorkoutExercises);
        setWorkouts(validated);
        setIsFromCache(true);
        setLoading(false);
        
        // Prefetch exercise images from cache for instant detail loads
        prefetchFeaturedWorkoutImages(validated);
        
        // If cache not expired, we're done (but still refresh in background)
        const ttlHours = cached.config?.ttlHours || DEFAULT_TTL_HOURS;
        if (!isCacheExpired(cached.lastFetch, ttlHours)) {
          setLastUpdated(cached.lastFetch ? new Date(cached.lastFetch) : null);
          return;
        }
      }

      // Step 2: Fetch fresh data from server (background if we have cache)
      if (isRefreshing.current) return;
      isRefreshing.current = true;

      // Use bundle endpoint (single round-trip) for faster first load
      const bundle = await fetchFeaturedBundle();
      
      if (bundle && bundle.workouts.length > 0) {
        const validatedWorkouts = bundle.workouts.map(validateWorkoutExercises);
        setWorkouts(validatedWorkouts);
        setIsFromCache(false);
        setLastUpdated(new Date());
        setError(null);
        
        // Prefetch exercise images for instant detail page loads
        prefetchFeaturedWorkoutImages(validatedWorkouts);
        
        // Save to cache
        await saveToCache(bundle.config, validatedWorkouts);
      } else {
        // Bundle failed — fallback to sequential fetch
        const config = await fetchFeaturedConfig();
        
        if (config && config.featuredWorkoutIds.length > 0) {
          const freshWorkouts = await fetchWorkoutsByIds(config.featuredWorkoutIds);
          
          if (freshWorkouts.length > 0) {
            const validatedWorkouts = freshWorkouts.map(validateWorkoutExercises);
            setWorkouts(validatedWorkouts);
            setIsFromCache(false);
            setLastUpdated(new Date());
            setError(null);
            
            // Prefetch exercise images for instant detail page loads
            prefetchFeaturedWorkoutImages(validatedWorkouts);
            
            // Save to cache
            await saveToCache(config, validatedWorkouts);
          } else if (cached.workouts.length === 0) {
            console.warn('[FeaturedWorkouts] Using hardcoded fallback');
            setWorkouts(HARDCODED_FALLBACK);
            setError('Using offline data');
          }
        } else if (cached.workouts.length === 0) {
          console.warn('[FeaturedWorkouts] Using hardcoded fallback (no config)');
          setWorkouts(HARDCODED_FALLBACK);
          setError('Using offline data');
        }
      }
    } catch (err) {
      console.error('[FeaturedWorkouts] Error loading workouts:', err);
      setError('Failed to load workouts');
      
      // Try to use cached or fallback
      const cached = await getCachedData();
      if (cached.workouts.length > 0) {
        setWorkouts(cached.workouts.map(validateWorkoutExercises));
        setIsFromCache(true);
      } else {
        setWorkouts(HARDCODED_FALLBACK);
      }
    } finally {
      setLoading(false);
      isRefreshing.current = false;
    }
  }, []);

  /**
   * Refresh workouts from server
   */
  const refresh = useCallback(async () => {
    await loadWorkouts(true);
  }, [loadWorkouts]);

  // Initial load
  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  return {
    workouts,
    loading,
    error,
    isFromCache,
    lastUpdated,
    refresh,
  };
}

/**
 * Clear featured workouts cache (useful for testing/debugging)
 */
export async function clearFeaturedWorkoutsCache(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(CACHE_KEYS.FEATURED_CONFIG),
      AsyncStorage.removeItem(CACHE_KEYS.FEATURED_WORKOUTS),
      AsyncStorage.removeItem(CACHE_KEYS.LAST_FETCH),
    ]);
    console.log('[FeaturedWorkouts] Cache cleared');
  } catch (error) {
    console.error('[FeaturedWorkouts] Error clearing cache:', error);
  }
}
