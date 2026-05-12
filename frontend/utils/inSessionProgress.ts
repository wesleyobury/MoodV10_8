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
