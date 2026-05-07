import { Ionicons } from '@expo/vector-icons';

// --- Sweat mood metadata (used by Build For Me on the Sweat / burn fat path) ---
export type SweatRole = 'primer' | 'main_block' | 'finisher';
export type Modality = 'cardio' | 'resistance';
export type IntensityCost = 1 | 2 | 3 | 4 | 5;

// --- Outdoor mood metadata (used by Build For Me on the Get Outside path) ---
export type SessionType =
  | 'continuous'
  | 'interval'
  | 'tempo'
  | 'threshold'
  | 'fartlek'
  | 'sprint'
  | 'drill'
  | 'plyo'
  | 'strength_circuit'
  | 'hybrid'
  | 'technique';
export type OutdoorEnvironment = 'run' | 'bike' | 'swim' | 'hills' | 'park' | 'track';

// --- Calisthenics mood metadata (used by Build For Me on the Calisthenics path) ---
export type CalisthenicsEquipment =
  | 'no_equipment'
  | 'pull_up_bar'
  | 'pull_up_bar_abs'
  | 'parallel_bars'
  | 'rings'
  | 'parallettes'
  | 'ab_wheel';
export type MovementFocus =
  | 'full_body'
  | 'upper_push'
  | 'upper_pull'
  | 'mixed_upper'
  | 'lower'
  | 'unilateral'
  | 'hinge_pull'
  | 'core';

export interface Workout {
  name: string;
  duration: string;
  description: string;
  battlePlan: string;
  imageUrl: string;
  videoUrl?: string;
  intensityReason: string;
  moodTips: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
  }[];
  // Sweat metadata — optional, only set on workouts that participate in the Sweat Build For Me pool
  role?: SweatRole;
  intensity_cost?: IntensityCost;
  modality?: Modality;
  // Outdoor metadata — optional, only set on outdoor workouts
  session_type?: SessionType;
  // Calisthenics metadata — optional, only set on calisthenics workouts
  movement_focus?: MovementFocus;
  abs_slot_eligible?: boolean;
}

export interface EquipmentWorkouts {
  equipment: string;
  icon: keyof typeof Ionicons.glyphMap;
  workouts: {
    beginner: Workout[];
    intermediate: Workout[];
    advanced: Workout[];
  };
}
