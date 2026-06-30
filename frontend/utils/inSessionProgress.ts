/**
 * Pure helpers used by InSessionProgressBar. Kept in a separate file so they
 * can be unit-tested under node + tsx without pulling in react-native.
 */

import type { Ionicons } from '@expo/vector-icons';

export type IoniconName = keyof typeof Ionicons.glyphMap;

export const equipmentIconMap: Record<string, IoniconName> = {
  Kettlebells: 'fitness',
  Kettlebell: 'fitness',
  Dumbbells: 'barbell',
  Dumbbell: 'barbell',
  Barbell: 'barbell',
  'Squat Rack': 'square-outline',
  Cables: 'reorder-three',
  Cable: 'reorder-three',
  'Smith Machine': 'hardware-chip',
  Bodyweight: 'body',
  'Body Weight': 'body',
  Bench: 'remove',
  'Flat Bench': 'remove',
  'Incline Bench': 'trending-up',
  'Decline Bench': 'trending-down',
  'Adjustable Bench': 'swap-vertical',
  'Battle Ropes': 'git-network',
  'Battle Rope': 'git-network',
  Sled: 'car',
  Hills: 'triangle',
  Treadmill: 'walk',
  Bike: 'bicycle',
  Rower: 'boat',
  'Pull-up Bar': 'remove-outline',
  'Resistance Bands': 'pulse',
  'Resistance Band': 'pulse',
  'Medicine Ball': 'football',
  Box: 'cube',
  'Jump Rope': 'infinite',
  Track: 'speedometer',
  Outdoor: 'leaf',
};

export const getEquipmentIcon = (equipmentName?: string): IoniconName => {
  if (!equipmentName) return 'fitness';
  if (equipmentIconMap[equipmentName]) return equipmentIconMap[equipmentName];
  const key = Object.keys(equipmentIconMap).find((k) =>
    equipmentName.toLowerCase().includes(k.toLowerCase())
  );
  return key ? equipmentIconMap[key] : 'fitness';
};

/**
 * Returns the first 1–2 sentences from a description, collapsing whitespace.
 * Falls back to a 140-char truncation when no sentence terminator is present.
 */
export const getDescriptionSnippet = (description?: string): string => {
  if (!description) return '';
  const cleaned = description.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const matches = cleaned.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!matches || matches.length === 0) {
    return cleaned.length > 140 ? cleaned.slice(0, 137).trim() + '…' : cleaned;
  }
  return matches.slice(0, 2).join('').trim();
};

/**
 * Sub-path / muscle-group grouping for the in-session progress bar.
 *
 * Mirrors `getCartSubPathLabel` in app/cart.tsx so the in-session bar groups
 * exercises the same way the cart does (Muscle Gainer → CHEST, SHOULDERS, …;
 * Sweat → CARDIO / WEIGHTS; etc.). Session workouts carry the same
 * `workoutType` field the cart groups on, so the taxonomy is identical.
 * Returns null when no meaningful group can be derived (e.g. Custom / single
 * generic workout) — callers should render no divider in that case.
 */
const SUBPATH_MUSCLE_GROUPS = new Set([
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Abs',
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Legs',
]);

const SUBPATH_BODYWEIGHT_EQUIPMENT = new Set([
  'Bodyweight', 'No Equipment', 'Pull-up Bar', 'Parallel Bars', 'Bar',
]);

export const getSessionSubPathLabel = (ex?: {
  workoutType?: string;
  equipment?: string;
}): string | null => {
  const wt = (ex?.workoutType || '').trim();
  if (!wt) return null;
  const wtLower = wt.toLowerCase();

  // Muscle Gainer → muscle group
  if (wt.startsWith('Muscle Building')) {
    const parts = wt.split(' - ');
    const muscle = parts.length > 1 ? parts[parts.length - 1].trim() : '';
    return muscle || null;
  }
  if (SUBPATH_MUSCLE_GROUPS.has(wt)) return wt;
  if (wtLower.startsWith('muscle gainer')) {
    const parts = wt.split(' - ');
    return parts.length > 1 ? parts[parts.length - 1].trim() : 'Muscle Gainer';
  }

  // Sweat → CARDIO / WEIGHTS
  if (wtLower.startsWith('sweat')) {
    if (wtLower.includes('cardio')) return 'Cardio';
    if (wtLower.includes('weight') || wtLower.includes('resistance')) return 'Weights';
    return 'Cardio';
  }

  // Build Explosion → BODY WEIGHT / WEIGHT BASED
  if (wtLower.startsWith('build explosion') || wtLower.startsWith('explosion')) {
    if (wtLower.includes('body weight') || wtLower.includes('bodyweight') || wtLower.includes('plyo')) {
      return 'Body Weight';
    }
    return 'Weight Based';
  }

  // Lazy → BODY WEIGHT / WEIGHT BASED
  if (wtLower.startsWith('lazy')) {
    const equip = (ex?.equipment || '').trim();
    if (wtLower.includes('body weight') || wtLower.includes('bodyweight') || SUBPATH_BODYWEIGHT_EQUIPMENT.has(equip)) {
      return 'Body Weight';
    }
    return 'Weight Based';
  }

  // Outdoor → OUTDOOR
  if (wtLower.startsWith('outdoor') || wtLower.startsWith('get outside')) return 'Outdoor';

  // Calisthenics → CALISTHENICS
  if (wtLower.startsWith('calisthenics') || wtLower.startsWith('bodyweight only')) return 'Calisthenics';

  // Skip generic / placeholder values
  if (wt === 'Custom' || wt === 'Workout' || wt === 'Unknown') return null;

  if (wt.includes(' - ')) {
    const parts = wt.split(' - ');
    return parts[parts.length - 1].trim();
  }
  return wt;
};

/**
 * Returns just the first sentence from a description. Falls back to a 90-char
 * truncation when no sentence terminator is present.
 */
export const getFirstSentence = (description?: string): string => {
  if (!description) return '';
  const cleaned = description.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const matches = cleaned.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!matches || matches.length === 0) {
    return cleaned.length > 90 ? cleaned.slice(0, 87).trim() + '…' : cleaned;
  }
  return matches[0].trim();
};
