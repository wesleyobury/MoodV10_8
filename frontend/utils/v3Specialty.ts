/**
 * The 18 MOOD V3 Specialty Workout Presets (backend/mood_v3/engines/specialty/blueprints.py PRESETS /
 * PRESET_NAMES -- mirrored here client-side the same way utils/v3HomeModel.ts's DIRECTIONS mirrors the backend's
 * Direction list, rather than fetched from GET /api/v3/specialty/presets on every Home load). Keep this in sync by
 * hand if the backend's 18 presets ever change; there is no runtime check that the two stay aligned.
 */
export type V3SpecialtyEquipment = 'barbell' | 'kettlebell' | 'dumbbells' | 'landmine' | 'bodyweight' | 'outdoor_park';
export type V3SpecialtyTarget = 'full' | 'upper' | 'lower';

export interface SpecialtyPresetDef {
  id: string;
  name: string;
  equipment: V3SpecialtyEquipment;
  target: V3SpecialtyTarget;
}

/** One Ionicons name per equipment category, for the preset card (no per-preset photo asset exists yet). */
export const SPECIALTY_EQUIPMENT_ICON: Record<V3SpecialtyEquipment, string> = {
  barbell: 'barbell-outline',
  kettlebell: 'fitness-outline',
  dumbbells: 'barbell-outline',
  landmine: 'barbell-outline',
  bodyweight: 'body-outline',
  outdoor_park: 'leaf-outline',
};

export const SPECIALTY_EQUIPMENT_LABEL: Record<V3SpecialtyEquipment, string> = {
  barbell: 'Barbell',
  kettlebell: 'Kettlebell',
  dumbbells: 'Dumbbells',
  landmine: 'Landmine',
  bodyweight: 'Bodyweight',
  outdoor_park: 'Outdoor / Park',
};

// "<Equipment> Only: <Target> Day" (Wes, Oct 2026) -- must exactly match backend's
// engines/specialty/blueprints.PRESET_NAMES. titleParts() below splits each on ": " to style
// "<Target> Day" with a secondary font/weight.
export const SPECIALTY_PRESETS: SpecialtyPresetDef[] = [
  { id: 'barbell_full', name: 'Barbell Only: Full Body Day', equipment: 'barbell', target: 'full' },
  { id: 'barbell_upper', name: 'Barbell Only: Upper Body Day', equipment: 'barbell', target: 'upper' },
  { id: 'barbell_lower', name: 'Barbell Only: Leg Day', equipment: 'barbell', target: 'lower' },
  { id: 'kettlebell_full', name: 'Kettlebell Only: Full Body Day', equipment: 'kettlebell', target: 'full' },
  { id: 'kettlebell_upper', name: 'Kettlebell Only: Upper Body Day', equipment: 'kettlebell', target: 'upper' },
  { id: 'kettlebell_lower', name: 'Kettlebell Only: Leg Day', equipment: 'kettlebell', target: 'lower' },
  { id: 'dumbbells_full', name: 'Dumbbell Only: Full Body Day', equipment: 'dumbbells', target: 'full' },
  { id: 'dumbbells_upper', name: 'Dumbbell Only: Upper Body Day', equipment: 'dumbbells', target: 'upper' },
  { id: 'dumbbells_lower', name: 'Dumbbell Only: Leg Day', equipment: 'dumbbells', target: 'lower' },
  { id: 'landmine_full', name: 'Landmine Only: Full Body Day', equipment: 'landmine', target: 'full' },
  { id: 'landmine_upper', name: 'Landmine Only: Upper Body Day', equipment: 'landmine', target: 'upper' },
  { id: 'landmine_lower', name: 'Landmine Only: Leg Day', equipment: 'landmine', target: 'lower' },
  { id: 'bodyweight_full', name: 'Bodyweight Only: Full Body Day', equipment: 'bodyweight', target: 'full' },
  { id: 'bodyweight_upper', name: 'Bodyweight Only: Upper Body Day', equipment: 'bodyweight', target: 'upper' },
  { id: 'bodyweight_lower', name: 'Bodyweight Only: Leg Day', equipment: 'bodyweight', target: 'lower' },
  { id: 'park_full', name: 'Park Only: Full Body Day', equipment: 'outdoor_park', target: 'full' },
  { id: 'park_upper', name: 'Park Only: Upper Body Day', equipment: 'outdoor_park', target: 'upper' },
  { id: 'park_lower', name: 'Park Only: Leg Day', equipment: 'outdoor_park', target: 'lower' },
];

/** Splits a "<X> Only: <Y> Day" preset/workout title into its two display parts, for a caller that wants to
 *  style them differently (the "<Y> Day" half in a secondary font/weight, per Wes, Oct 2026). A title with no
 *  ": " (anything outside this one Specialty naming convention) returns { primary: title, secondary: null } --
 *  render it as one plain string. */
export function titleParts(title: string): { primary: string; secondary: string | null } {
  const idx = title.indexOf(': ');
  if (idx === -1) return { primary: title, secondary: null };
  return { primary: title.slice(0, idx + 1), secondary: title.slice(idx + 2) };
}
