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

export const SPECIALTY_PRESETS: SpecialtyPresetDef[] = [
  { id: 'barbell_full', name: 'Full Body Barbell', equipment: 'barbell', target: 'full' },
  { id: 'barbell_upper', name: 'Barbell Upper Body', equipment: 'barbell', target: 'upper' },
  { id: 'barbell_lower', name: 'Barbell Leg Day', equipment: 'barbell', target: 'lower' },
  { id: 'kettlebell_full', name: 'Full Body Kettlebells', equipment: 'kettlebell', target: 'full' },
  { id: 'kettlebell_upper', name: 'Kettlebell Upper Body', equipment: 'kettlebell', target: 'upper' },
  { id: 'kettlebell_lower', name: 'Kettlebell Leg Day', equipment: 'kettlebell', target: 'lower' },
  { id: 'dumbbells_full', name: 'Full Body Dumbbells', equipment: 'dumbbells', target: 'full' },
  { id: 'dumbbells_upper', name: 'Dumbbell Upper Body', equipment: 'dumbbells', target: 'upper' },
  { id: 'dumbbells_lower', name: 'Dumbbell Leg Day', equipment: 'dumbbells', target: 'lower' },
  { id: 'landmine_full', name: 'Full Body Landmine', equipment: 'landmine', target: 'full' },
  { id: 'landmine_upper', name: 'Landmine Upper Body', equipment: 'landmine', target: 'upper' },
  { id: 'landmine_lower', name: 'Landmine Leg Day', equipment: 'landmine', target: 'lower' },
  { id: 'bodyweight_full', name: 'Full Body Bodyweight', equipment: 'bodyweight', target: 'full' },
  { id: 'bodyweight_upper', name: 'Bodyweight Upper Body', equipment: 'bodyweight', target: 'upper' },
  { id: 'bodyweight_lower', name: 'Bodyweight Leg Day', equipment: 'bodyweight', target: 'lower' },
  { id: 'park_full', name: 'Park Full Body', equipment: 'outdoor_park', target: 'full' },
  { id: 'park_upper', name: 'Park Upper Body', equipment: 'outdoor_park', target: 'upper' },
  { id: 'park_lower', name: 'Park Leg Day', equipment: 'outdoor_park', target: 'lower' },
];
