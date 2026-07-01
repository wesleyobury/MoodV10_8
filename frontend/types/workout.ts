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

// --- Lazy mood metadata (used by Build For Me on the I'm Feeling Lazy path) ---
// Move Your Body sub-path
export type MoveYourBodyEquipment =
  | 'treadmill'
  | 'stationary_bike'
  | 'elliptical'
  | 'stair_stepper'
  | 'rowing_machine'
  | 'assault_bike'
  | 'skierg'
  | 'jump_rope'
  | 'plyo_box'
  | 'bodyweight';
export type LazyModality = 'cardio' | 'bodyweight';

// Lift Weights sub-path
export type LiftWeightsBodyRegion = 'upper' | 'lower' | 'full_body';
export type LiftWeightsSubCategory =
  | 'upper_press'
  | 'upper_pull'
  | 'upper_full'
  | 'lower_quad'
  | 'lower_hinge'
  | 'lower_full'
  | 'fullbody_push'
  | 'fullbody_pull'
  | 'fullbody_mix';

// --- Explosive mood metadata (used by Build For Me on the I'm Feeling Explosive path) ---
export type ExplosivePath = 'bodyweight' | 'weights';
export type CartFlavor = 'plyo' | 'loaded' | 'dynamic';

// --- Muscle Gainer mood metadata (used by Build For Me on the I want to gain muscle path) ---
export type ExerciseType = 'compound' | 'isolation';
export type TrainingStyle = 'strength' | 'hypertrophy' | 'pump' | 'mixed';
export type MovementPattern =
  // Push
  | 'horizontal_press' | 'incline_press' | 'decline_press' | 'fly' | 'dip'
  | 'vertical_press' | 'lateral_raise' | 'rear_delt' | 'front_raise' | 'upright_row'
  | 'pushdown' | 'overhead_extension' | 'skullcrusher' | 'close_grip_press'
  // Pull
  | 'horizontal_pull' | 'vertical_pull' | 'shrug' | 'hyperextension' | 'deadlift'
  | 'curl' | 'preacher_curl' | 'hammer_curl' | 'chin_up'
  // Lower
  | 'squat' | 'lunge' | 'leg_extension' | 'hinge' | 'leg_curl'
  | 'hip_thrust' | 'hip_abduction' | 'kickback' | 'pull_through'
  | 'calf_raise' | 'jump_squat'
  // Core
  | 'crunch' | 'leg_raise' | 'plank' | 'rotation' | 'rollout' | 'side_bend' | 'sit_up';

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

// --- Standardized Battle Plan structure (additive migration) ---
// `battlePlan` (the legacy string) is kept for back-compat and the existing
// render/snapshot pipeline. New code reads `plan` when present and renders
// structured tiles; falls back to the string otherwise.
export type BattlePlanFormat = 'strength' | 'circuit' | 'interval' | 'rounds';
export type BlockType = 'straight' | 'superset' | 'circuit' | 'interval';

export interface Movement {
  name: string;            // clean movement name, e.g. "Paused Decline Press"
  tutorialSlug?: string;   // resolved library match; undefined = no tutorial → show search fallback
  // reps-based
  sets?: number;
  reps?: string;           // kept as string to allow ranges: "5", "8–10", "15–25s"
  rest?: string;           // "90s", "60–90s"
  // time/effort-based
  duration?: string;       // "5 min", "30 sec"
  intensity?: string;      // "5.2 mph", "RPE 4", "resistance 6", "6% incline"
  note?: string;           // per-movement extra ("drop set", "4s eccentric")
}

export interface BattlePlanBlock {
  label?: string;          // "Main", "Circuit A", "Intervals"
  type: BlockType;
  rounds?: number;         // defaults to 1; "repeat 3x" → 3
  rest?: string;           // rest between rounds
  movements: Movement[];
}

export interface BattlePlan {
  format: BattlePlanFormat;
  instructions?: string;   // single one-line cue ("Pause 1s on the chest")
  blocks: BattlePlanBlock[];
}

export interface Workout {
  name: string;
  duration: string;
  description: string;
  battlePlan: string;      // legacy free-text; retained for back-compat
  plan?: BattlePlan;       // structured plan; preferred when present
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
  // Explosive metadata — optional, only set on explosive workouts
  path?: ExplosivePath;
  cart_flavor?: CartFlavor;
  // Muscle Gainer metadata — optional, only set on muscle gainer workouts
  exercise_type?: ExerciseType;
  movement_pattern?: MovementPattern;
  training_style?: TrainingStyle;
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
