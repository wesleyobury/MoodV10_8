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

/**
 * One real exercise thumbnail per preset for the Home carousel's drill-down cards (Wes, Oct 2026 feedback #11):
 * tapping an equipment hero animates to its 3 body-part cards, each showing "the actual exercise thumbnails" --
 * a real exercise photo, not the curated shoot photo (that's the equipment-level hero, see cartHero.ts's
 * V3_SPECIALTY_HEROES) and not a live-generated preview (3 generator calls on every equipment tap is the same
 * performance concern SpecialtyPresetsRow's own header comment already rules out at the top level). Each is a
 * fixed, deterministically-picked real exercise from that preset's own curated catalog pool -- computed by
 * backend/compute_specialty_drilldown_thumbs.py; keep this in sync by hand if the catalog's thumbnails change
 * or a preset's pool changes enough that a better representative exists. Keyed by preset id.
 */
export const SPECIALTY_DRILLDOWN_THUMB: Record<string, string> = {
  barbell_full: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792782073/mood/v3/exercises_specialty/sp_barbell_deadlift_to_row.png',
  barbell_upper: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792782056/mood/v3/exercises_specialty/sp_seated_barbell_overhead_press.png',
  barbell_lower: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792782060/mood/v3/exercises_specialty/sp_barbell_reverse_lunge.png',
  kettlebell_full: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792782027/mood/v3/exercises_specialty/sp_kettlebell_thruster.png',
  kettlebell_upper: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792782003/mood/v3/exercises_specialty/sp_single_arm_kettlebell_strict_press.png',
  kettlebell_lower: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792782014/mood/v3/exercises_specialty/sp_kettlebell_goblet_squat.png',
  dumbbells_full: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792782094/mood/v3/exercises_specialty/sp_dumbbell_reverse_lunge_to_press.png',
  dumbbells_upper: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792782074/mood/v3/exercises_specialty/sp_standing_dumbbell_shoulder_press.png',
  dumbbells_lower: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792782082/mood/v3/exercises_specialty/sp_dumbbell_reverse_lunge.png',
  landmine_full: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792808737/mood/v3/exercises_specialty/sp_landmine_deadlift_to_row.png',
  landmine_upper: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792782035/mood/v3/exercises_specialty/sp_half_kneeling_landmine_press.png',
  landmine_lower: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792782042/mood/v3/exercises_specialty/sp_landmine_front_squat.png',
  bodyweight_full: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792782114/mood/v3/exercises_specialty/sp_squat_thrust.png',
  bodyweight_upper: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792782099/mood/v3/exercises_specialty/sp_standard_push_up.png',
  bodyweight_lower: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792782104/mood/v3/exercises_specialty/sp_bodyweight_squat.png',
  park_full: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792782114/mood/v3/exercises_specialty/sp_squat_thrust.png',
  park_upper: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792782099/mood/v3/exercises_specialty/sp_standard_push_up.png',
  park_lower: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792782104/mood/v3/exercises_specialty/sp_bodyweight_squat.png',
};

/** Equipment order for the Home carousel (Wes, Oct 2026 feedback #11): one hero card per equipment category
 *  ("Dumbbell Only", "Barbell Only", etc.), not one per preset -- tapping a card drills into its 3 body-part
 *  presets (SPECIALTY_EQUIPMENT_GROUPS below). Mirrors blueprints.PRESETS' own equipment grouping order. */
const EQUIPMENT_ORDER: V3SpecialtyEquipment[] = ['barbell', 'kettlebell', 'dumbbells', 'landmine', 'bodyweight', 'outdoor_park'];

/** One true-16:9 hero photo per equipment category, for the Home carousel's 6 equipment cards (Wes, Oct 2026
 *  feedback #12 -- a correction of feedback #11: the earlier "Preset Heros" set (18 photos, one per PRESET,
 *  portrait-cropped) was the wrong source for these equipment-level cards; these 6 photos -- found in
 *  "Cart Heroes/preset heros", genuinely shot 16:9 -- are the right ones. Uploaded via
 *  backend/upload_specialty_equipment_heroes_to_cloudinary.py. Note: that folder's "athlete.png" is used as the
 *  bodyweight photo -- there's no "bodyweight.png" in the set and no other unclaimed file for 6 equipment slots,
 *  so this is an inferred mapping, not a confirmed one; flag to Wes if it looks wrong. */
export const SPECIALTY_EQUIPMENT_HERO: Record<V3SpecialtyEquipment, string> = {
  barbell: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792812000/mood/v3/cart_heroes/specialty_equipment/barbell.png',
  kettlebell: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792812011/mood/v3/cart_heroes/specialty_equipment/kettlebell.png',
  dumbbells: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792812003/mood/v3/cart_heroes/specialty_equipment/dumbbells.png',
  landmine: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792812018/mood/v3/cart_heroes/specialty_equipment/landmine.png',
  bodyweight: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792811999/mood/v3/cart_heroes/specialty_equipment/bodyweight.png',
  outdoor_park: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1792812022/mood/v3/cart_heroes/specialty_equipment/outdoor_park.png',
};

export interface SpecialtyEquipmentGroup {
  equipment: V3SpecialtyEquipment;
  /** "Barbell Only", "Dumbbell Only", "Park Only", etc. -- derived from the equipment's own "full" preset name
   *  (the part before ": "), so it never drifts out of sync with PRESET_NAMES. */
  label: string;
  /** [full, upper, lower] preset ids for this equipment. */
  presets: [string, string, string];
  /** True 16:9 equipment-level hero photo (SPECIALTY_EQUIPMENT_HERO above) -- NOT a per-preset photo. */
  heroUri: string;
}

export const SPECIALTY_EQUIPMENT_GROUPS: SpecialtyEquipmentGroup[] = EQUIPMENT_ORDER.map((equipment) => {
  const full = SPECIALTY_PRESETS.find((p) => p.equipment === equipment && p.target === 'full')!;
  const upper = SPECIALTY_PRESETS.find((p) => p.equipment === equipment && p.target === 'upper')!;
  const lower = SPECIALTY_PRESETS.find((p) => p.equipment === equipment && p.target === 'lower')!;
  return {
    equipment,
    label: titleParts(full.name).primary.replace(/:$/, ''),
    presets: [full.id, upper.id, lower.id],
    heroUri: SPECIALTY_EQUIPMENT_HERO[equipment],
  };
});
