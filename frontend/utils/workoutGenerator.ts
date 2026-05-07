import { WorkoutItem } from '../contexts/CartContext';
import { lightWeightsDatabase } from '../data/light-weights-data';
import { cardioWorkoutsDatabase } from '../data/cardio-workouts-data';
import { bodyweightExplosivenessDatabase } from '../data/bodyweight-explosiveness-data';
import { explosivenessWeightsDatabase } from '../data/explosiveness-weights-data';
import { lazyBodyweightDatabase } from '../data/lazy-bodyweight-data';
import { lazyUpperBodyDatabase } from '../data/lazy-upper-body-data';
import { lazyLowerBodyDatabase } from '../data/lazy-lower-body-data';
import { lazyFullBodyDatabase } from '../data/lazy-full-body-data';
import { additionalWorkoutDatabase as calisthenicsDatabase } from '../data/calisthenics-all-workouts-data';
import { outdoorRunWorkoutDatabase } from '../data/outdoor-workouts-data';
// Muscle gainer data imports
import { chestWorkoutDatabase } from '../data/chest-workouts-data';
import { backWorkoutDatabase } from '../data/back-workouts-data';
import { shouldersWorkoutDatabase } from '../data/shoulders-workouts-data';
import { bicepsWorkoutDatabase } from '../data/biceps-workouts-data';
import { tricepsWorkoutDatabase } from '../data/triceps-workouts-data';
import { absWorkoutDatabase } from '../data/abs-workouts-data';
import { quadsWorkoutDatabase } from '../data/quads-workouts-data';
import { hamstringsWorkoutDatabase } from '../data/hamstrings-workouts-data';
import { glutesWorkoutDatabase } from '../data/glutes-workouts-data';
import { calvesWorkoutDatabase } from '../data/calves-workouts-data';
import { Workout, EquipmentWorkouts, Modality, IntensityCost } from '../types/workout';
import { IntensityLevel } from '../components/IntensitySelectionModal';
import { GeneratedCart } from '../components/GeneratedWorkoutView';

// Time limits based on intensity (in minutes)
const TIME_LIMITS: Record<IntensityLevel, { min: number; max: number }> = {
  beginner: { min: 25, max: 40 },
  intermediate: { min: 40, max: 60 },
  advanced: { min: 55, max: 80 },
};

// Exercise count per cart based on intensity
const EXERCISE_COUNTS: Record<IntensityLevel, { min: number; max: number }> = {
  beginner: { min: 2, max: 3 },
  intermediate: { min: 3, max: 4 },
  advanced: { min: 3, max: 4 },
};

// Parse duration string to get average minutes
function parseDuration(durationStr: string): number {
  // Handle formats like "15–18 min", "20 min", "~30 min"
  const cleaned = durationStr.replace(/[~]/g, '').replace('min', '').trim();
  
  if (cleaned.includes('–') || cleaned.includes('-')) {
    const parts = cleaned.split(/[–-]/);
    const low = parseInt(parts[0].trim()) || 0;
    const high = parseInt(parts[1].trim()) || low;
    return Math.round((low + high) / 2);
  }
  
  return parseInt(cleaned) || 15;
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate unique ID for workout item
function generateWorkoutId(workout: Workout, equipment: string, intensity: string): string {
  return `generated-${workout.name}-${equipment}-${intensity}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Convert Workout to WorkoutItem
function workoutToItem(
  workout: Workout,
  equipment: string,
  intensity: IntensityLevel,
  moodCard: string,
  workoutType: string
): WorkoutItem {
  return {
    id: generateWorkoutId(workout, equipment, intensity),
    name: workout.name,
    duration: workout.duration,
    description: workout.description,
    battlePlan: workout.battlePlan,
    imageUrl: workout.imageUrl,
    intensityReason: workout.intensityReason,
    equipment: equipment,
    difficulty: intensity,
    workoutType: workoutType,
    moodCard: moodCard,
    moodTips: workout.moodTips.map(tip => ({
      icon: tip.icon as string,
      title: tip.title,
      description: tip.description,
    })),
  };
}

// Get all workouts from a database for a specific intensity
function getAllWorkoutsForIntensity(
  database: EquipmentWorkouts[],
  intensity: IntensityLevel
): { workout: Workout; equipment: string }[] {
  const allWorkouts: { workout: Workout; equipment: string }[] = [];
  
  for (const equipmentData of database) {
    const workouts = equipmentData.workouts[intensity] || [];
    for (const workout of workouts) {
      allWorkouts.push({
        workout,
        equipment: equipmentData.equipment,
      });
    }
  }
  
  return allWorkouts;
}

// Select complementary workouts for a cart
function selectComplementaryWorkouts(
  availableWorkouts: { workout: Workout; equipment: string }[],
  exerciseCount: number,
  maxDuration: number,
  usedWorkoutNames: Set<string>
): { workout: Workout; equipment: string }[] {
  const selected: { workout: Workout; equipment: string }[] = [];
  const usedEquipment = new Set<string>();
  let totalDuration = 0;
  
  // Shuffle to get randomness
  const shuffled = shuffleArray(availableWorkouts);
  
  for (const item of shuffled) {
    // Skip if already used this workout name
    if (usedWorkoutNames.has(item.workout.name)) {
      continue;
    }
    
    const duration = parseDuration(item.workout.duration);
    
    // Check if adding this workout would exceed time limit
    if (totalDuration + duration > maxDuration) {
      continue;
    }
    
    // Try to vary equipment for variety (but allow same if needed)
    const equipmentAlreadyUsed = usedEquipment.has(item.equipment);
    const shouldPreferVariety = selected.length > 0 && selected.length < exerciseCount - 1;
    
    if (shouldPreferVariety && equipmentAlreadyUsed && Math.random() > 0.3) {
      continue; // 70% chance to skip same equipment for variety
    }
    
    selected.push(item);
    usedEquipment.add(item.equipment);
    usedWorkoutNames.add(item.workout.name);
    totalDuration += duration;
    
    if (selected.length >= exerciseCount) {
      break;
    }
  }
  
  return selected;
}

// Main function to generate workout carts
export function generateWorkoutCarts(
  intensity: IntensityLevel,
  moodCard: string,
  workoutType: string,
  database: EquipmentWorkouts[] = lightWeightsDatabase,
  cartCount: number = 3
): GeneratedCart[] {
  const timeLimit = TIME_LIMITS[intensity];
  const exerciseRange = EXERCISE_COUNTS[intensity];
  
  // Get all available workouts for this intensity
  const allWorkouts = getAllWorkoutsForIntensity(database, intensity);
  
  if (allWorkouts.length === 0) {
    console.warn('No workouts found for intensity:', intensity);
    return [];
  }
  
  const carts: GeneratedCart[] = [];
  const usedWorkoutNames = new Set<string>();
  
  for (let i = 0; i < cartCount; i++) {
    // Randomize exercise count within range
    const exerciseCount = Math.floor(
      Math.random() * (exerciseRange.max - exerciseRange.min + 1)
    ) + exerciseRange.min;
    
    // Select complementary workouts
    const selectedWorkouts = selectComplementaryWorkouts(
      allWorkouts,
      exerciseCount,
      timeLimit.max,
      usedWorkoutNames
    );
    
    if (selectedWorkouts.length === 0) {
      // If no unique workouts left, reset and allow reuse
      usedWorkoutNames.clear();
      continue;
    }
    
    // Convert to WorkoutItems
    const workoutItems = selectedWorkouts.map(item =>
      workoutToItem(item.workout, item.equipment, intensity, moodCard, workoutType)
    );
    
    // Calculate total duration
    const totalDuration = workoutItems.reduce(
      (sum, item) => sum + parseDuration(item.duration),
      0
    );
    
    carts.push({
      id: `cart-${i + 1}-${Date.now()}`,
      workouts: workoutItems,
      totalDuration,
      intensity,
    });
  }
  
  return carts;
}

// ============================================================================
// SWEAT MOOD CARD — Structured Assembly Logic
// ============================================================================
// Replaces the old shuffle-and-filter generator with a slot-template builder.
// Template:
//   Beginner    : [primer, main_block, main_block]
//   Intermediate: [primer, main_block, main_block, finisher]
//   Advanced    : [primer, main_block, main_block, finisher]
// Rules per cart:
//   • Each slot only pulls workouts whose `role` matches that slot
//   • Modality must alternate slot-to-slot (no two cardio adjacent, no two
//     resistance adjacent)
//   • Every cart guaranteed ≥1 cardio + ≥1 resistance
//   • Intensity curve: low at slot 1, peak in middle, taper but stay strong
//   • Equipment clusters when possible (same equipment grouped to reduce
//     transition friction)
// 3 carts are deliberate flavors: Cardio-leaning, Balanced, Resistance-leaning.
// ============================================================================

type SlotRole = 'primer' | 'main_block' | 'finisher';
type Flavor = 'cardio' | 'balanced' | 'resistance';

interface TaggedCandidate {
  workout: Workout;
  equipment: string;
}

const SWEAT_TEMPLATES: Record<IntensityLevel, SlotRole[]> = {
  beginner:     ['primer', 'main_block', 'main_block'],
  intermediate: ['primer', 'main_block', 'main_block', 'finisher'],
  advanced:     ['primer', 'main_block', 'main_block', 'finisher'],
};

// Pull every tagged workout (across ALL tiers) from cardio + light-weights pools.
// We deliberately do NOT filter by `intensity` here — the user's selected
// intensity shapes the cart through `intensity_cost` targeting, not tier
// gating. (User's spec: roles like 'primer' are only tagged on beginner-tier
// cardio, 'finisher' on advanced-tier; if we filter by tier we starve slots.)
function buildSweatPool(): {
  byRoleModality: Record<SlotRole, { cardio: TaggedCandidate[]; resistance: TaggedCandidate[] }>;
} {
  const empty = (): { cardio: TaggedCandidate[]; resistance: TaggedCandidate[] } => ({ cardio: [], resistance: [] });
  const byRoleModality: Record<SlotRole, { cardio: TaggedCandidate[]; resistance: TaggedCandidate[] }> = {
    primer: empty(),
    main_block: empty(),
    finisher: empty(),
  };

  const harvest = (db: EquipmentWorkouts[]) => {
    for (const eq of db) {
      for (const tier of ['beginner', 'intermediate', 'advanced'] as IntensityLevel[]) {
        for (const w of eq.workouts[tier] || []) {
          if (!w.role || !w.modality) continue;
          byRoleModality[w.role][w.modality].push({ workout: w, equipment: eq.equipment });
        }
      }
    }
  };
  harvest(cardioWorkoutsDatabase);
  harvest(lightWeightsDatabase);
  return { byRoleModality };
}

// Target intensity_cost per slot for each user-selected intensity.
// Curve: low at slot 1, ramp to peak in middle, finisher stays strong.
const SWEAT_COST_CURVE: Record<IntensityLevel, IntensityCost[]> = {
  beginner:     [2, 3, 3],
  intermediate: [2, 4, 4, 4],
  advanced:     [3, 5, 5, 5],
};

// Pick best candidate for a slot given used names, target modality, equipment cluster pref,
// and target intensity cost.
function pickForSlot(
  candidates: TaggedCandidate[],
  usedNames: Set<string>,
  preferredEquipment: string | null,
  targetCost: IntensityCost
): TaggedCandidate | null {
  const fresh = candidates.filter(c => !usedNames.has(c.workout.name));
  const pool = fresh.length > 0 ? fresh : candidates;
  if (pool.length === 0) return null;

  // Score by cost proximity, with strong bias toward exact match,
  // then equipment cluster match.
  const scored = pool.map(c => {
    const cost = c.workout.intensity_cost ?? 3;
    const costDiff = Math.abs(cost - targetCost);
    const equipMatch = preferredEquipment && c.equipment === preferredEquipment ? 1 : 0;
    return { c, score: -costDiff * 2 + equipMatch + Math.random() * 0.5 };
  });
  scored.sort((a, b) => b.score - a.score);
  // Take from top 3 to keep variety run-to-run
  const topN = Math.min(3, scored.length);
  return scored[Math.floor(Math.random() * topN)].c;
}

// Decide modality for slot N based on flavor + previous slot modality + role available pools
function chooseModality(
  flavor: Flavor,
  prevModality: Modality | null,
  rolePool: { cardio: TaggedCandidate[]; resistance: TaggedCandidate[] }
): Modality | null {
  const cardioAvail = rolePool.cardio.length > 0;
  const resAvail = rolePool.resistance.length > 0;
  if (!cardioAvail && !resAvail) return null;
  if (!cardioAvail) return 'resistance';
  if (!resAvail) return 'cardio';

  // Hard alternation rule: must differ from prev when both are available
  if (prevModality === 'cardio') return 'resistance';
  if (prevModality === 'resistance') return 'cardio';

  // First slot: bias by flavor
  if (flavor === 'cardio') return 'cardio';
  if (flavor === 'resistance') return 'resistance';
  // balanced — coin flip
  return Math.random() < 0.5 ? 'cardio' : 'resistance';
}

function buildSweatCart(
  intensity: IntensityLevel,
  flavor: Flavor,
  pool: ReturnType<typeof buildSweatPool>['byRoleModality'],
  globalUsed: Set<string>,
  moodCard: string,
  workoutType: string
): { exercises: WorkoutItem[]; equipmentList: string[]; totalDurationMin: number } {
  const template = SWEAT_TEMPLATES[intensity];
  const costCurve = SWEAT_COST_CURVE[intensity];
  const localUsed = new Set<string>();
  const exercises: WorkoutItem[] = [];
  const equipmentList: string[] = [];
  let prevModality: Modality | null = null;
  let lastEquipment: string | null = null;
  let totalDuration = 0;
  let cardioCount = 0;
  let resistanceCount = 0;

  for (let slotIdx = 0; slotIdx < template.length; slotIdx++) {
    const role = template[slotIdx];
    const targetCost = costCurve[slotIdx] ?? 3;
    const isLastSlot = slotIdx === template.length - 1;
    let modality = chooseModality(flavor, prevModality, pool[role]);

    // Guarantee both modalities present: if last slot and one is missing, force it
    if (isLastSlot) {
      if (cardioCount === 0 && pool[role].cardio.length > 0) modality = 'cardio';
      else if (resistanceCount === 0 && pool[role].resistance.length > 0) modality = 'resistance';
    }
    // Mid-cart correction: if 2nd-to-last and a modality has zero count, prefer it
    if (!isLastSlot && slotIdx === template.length - 2) {
      if (cardioCount === 0 && pool[role].cardio.length > 0 && prevModality !== 'cardio') modality = 'cardio';
      else if (resistanceCount === 0 && pool[role].resistance.length > 0 && prevModality !== 'resistance') modality = 'resistance';
    }

    if (!modality) continue;

    const candidates = pool[role][modality];
    const used = new Set([...globalUsed, ...localUsed]);
    // Equipment clustering: prefer matching last equipment when same modality follows
    const preferEquip = lastEquipment && modality === prevModality ? lastEquipment : null;
    const pick = pickForSlot(candidates, used, preferEquip, targetCost);
    if (!pick) continue;

    const item = workoutToItem(pick.workout, pick.equipment, intensity, moodCard, workoutType);
    exercises.push(item);
    equipmentList.push(pick.equipment);
    localUsed.add(pick.workout.name);
    globalUsed.add(pick.workout.name);
    totalDuration += parseDuration(pick.workout.duration);
    prevModality = modality;
    lastEquipment = pick.equipment;
    if (modality === 'cardio') cardioCount++;
    else resistanceCount++;
  }

  return { exercises, equipmentList, totalDurationMin: totalDuration };
}

// New structured Sweat generator — replaces shuffle-and-filter approach
export function generateSweatBurnFatCarts(
  intensity: IntensityLevel,
  moodCard: string = 'Sweat / burn fat',
  workoutType: string = 'Mixed'
): GeneratedCart[] {
  const { byRoleModality } = buildSweatPool();

  const flavors: { flavor: Flavor; title: string; focus: string }[] = [
    { flavor: 'cardio',     title: 'Cardio-Leaning Sweat',     focus: 'Cardio-driven session with a resistance accent.' },
    { flavor: 'balanced',   title: 'Balanced Sweat',           focus: 'Even split of cardio and resistance work.' },
    { flavor: 'resistance', title: 'Resistance-Leaning Sweat', focus: 'Resistance-driven session with a cardio accent.' },
  ];

  const globalUsed = new Set<string>();
  const carts: GeneratedCart[] = [];

  for (let i = 0; i < flavors.length; i++) {
    const { flavor, title, focus } = flavors[i];
    const built = buildSweatCart(intensity, flavor, byRoleModality, globalUsed, moodCard, workoutType);
    if (built.exercises.length === 0) continue;

    carts.push({
      id: `sweat-cart-${i + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title,
      focus,
      exercises: built.exercises,
      totalDuration: `${built.totalDurationMin} min`,
      equipmentList: built.equipmentList,
    });
  }

  return carts;
}

// Export for specific mood paths
export function generateLightWeightsCarts(
  intensity: IntensityLevel,
  moodCard: string = 'Sweat / burn fat',
  workoutType: string = 'Light Weights'
): GeneratedCart[] {
  return generateWorkoutCarts(intensity, moodCard, workoutType, lightWeightsDatabase);
}

// Export for cardio path
export function generateCardioCarts(
  intensity: IntensityLevel,
  moodCard: string = 'Sweat / burn fat',
  workoutType: string = 'Cardio Based'
): GeneratedCart[] {
  return generateWorkoutCarts(intensity, moodCard, workoutType, cardioWorkoutsDatabase);
}

// Export for Build Explosion path (bodyweight + weights)
export function generateExplosivenessCarts(
  intensity: IntensityLevel,
  moodCard: string = 'I want to build explosion',
  workoutType: string = 'Mixed Explosive'
): GeneratedCart[] {
  // Combine both bodyweight and weight-based explosiveness databases
  const combinedDatabase = [...bodyweightExplosivenessDatabase, ...explosivenessWeightsDatabase];
  return generateWorkoutCarts(intensity, moodCard, workoutType, combinedDatabase);
}

// Export for I'm Feeling Lazy path (all lazy workouts combined)
export function generateLazyCarts(
  intensity: IntensityLevel,
  moodCard: string = "I'm feeling lazy",
  workoutType: string = 'Mixed Lazy'
): GeneratedCart[] {
  // Combine all lazy databases
  const combinedDatabase = [
    ...lazyBodyweightDatabase,
    ...lazyUpperBodyDatabase,
    ...lazyLowerBodyDatabase,
    ...lazyFullBodyDatabase
  ];
  return generateWorkoutCarts(intensity, moodCard, workoutType, combinedDatabase);
}

// Export for I'm Feeling Lazy path with specific training type selection
export function generateLazyCartsWithType(
  intensity: IntensityLevel,
  trainingType: 'bodyweight' | 'weights',
  moodCard: string = "I'm feeling lazy",
): GeneratedCart[] {
  // Determine exercise count based on training type and intensity
  let exerciseCount: number;
  
  if (trainingType === 'bodyweight') {
    // Move your body: 3 for beginner and intermediate, 4 for advanced
    exerciseCount = intensity === 'advanced' ? 4 : 3;
  } else {
    // Lift weights: 1 from weights + 1 from bodyweight = 2 total
    exerciseCount = 2;
  }
  
  const workoutType = trainingType === 'bodyweight' ? 'Move Your Body' : 'Lift Weights';
  
  // Get databases based on training type
  const bodyweightDatabase = lazyBodyweightDatabase;
  const weightsDatabase = [
    ...lazyUpperBodyDatabase,
    ...lazyLowerBodyDatabase,
    ...lazyFullBodyDatabase
  ];
  
  const carts: GeneratedCart[] = [];
  const cartCount = 3; // Generate 3 workout options
  const usedWorkoutNames = new Set<string>();
  
  for (let i = 0; i < cartCount; i++) {
    const workoutItems: WorkoutItem[] = [];
    
    if (trainingType === 'bodyweight') {
      // Only bodyweight exercises
      const allWorkouts = getAllWorkoutsForIntensity(bodyweightDatabase, intensity);
      const shuffled = shuffleArray(allWorkouts);
      
      for (const item of shuffled) {
        if (workoutItems.length >= exerciseCount) break;
        if (usedWorkoutNames.has(item.workout.name)) continue;
        
        workoutItems.push(workoutToItem(item.workout, item.equipment, intensity, moodCard, workoutType));
        usedWorkoutNames.add(item.workout.name);
      }
    } else {
      // Lift weights: 1 bodyweight first, then 1 weight exercise
      const bodyweightWorkouts = getAllWorkoutsForIntensity(bodyweightDatabase, intensity);
      const weightsWorkouts = getAllWorkoutsForIntensity(weightsDatabase, intensity);
      
      // Shuffle both arrays
      const shuffledBodyweight = shuffleArray(bodyweightWorkouts);
      const shuffledWeights = shuffleArray(weightsWorkouts);
      
      // Add 1 bodyweight exercise first (listed first in cart)
      for (const item of shuffledBodyweight) {
        if (workoutItems.length >= 1) break;
        if (usedWorkoutNames.has(item.workout.name)) continue;
        
        workoutItems.push(workoutToItem(item.workout, item.equipment, intensity, moodCard, 'Move Your Body'));
        usedWorkoutNames.add(item.workout.name);
      }
      
      // Add 1 weight exercise
      for (const item of shuffledWeights) {
        if (workoutItems.length >= 2) break;
        if (usedWorkoutNames.has(item.workout.name)) continue;
        
        workoutItems.push(workoutToItem(item.workout, item.equipment, intensity, moodCard, workoutType));
        usedWorkoutNames.add(item.workout.name);
      }
    }
    
    if (workoutItems.length === 0) {
      usedWorkoutNames.clear();
      continue;
    }
    
    // Calculate total duration
    const totalDuration = workoutItems.reduce(
      (sum, item) => sum + parseDuration(item.duration),
      0
    );
    
    carts.push({
      id: `cart-${i + 1}-${Date.now()}`,
      workouts: workoutItems,
      totalDuration,
      intensity,
    });
  }
  
  return carts;
}

// Export for Calisthenics path
export function generateCalisthenicsCarts(
  intensity: IntensityLevel,
  moodCard: string = 'I want to do calisthenics',
  workoutType: string = 'Calisthenics'
): GeneratedCart[] {
  return generateWorkoutCarts(intensity, moodCard, workoutType, calisthenicsDatabase);
}

// Export for Outdoor/Get Outside path
export function generateOutdoorCarts(
  intensity: IntensityLevel,
  moodCard: string = 'Get outside',
  workoutType: string = 'Outdoor'
): GeneratedCart[] {
  return generateWorkoutCarts(intensity, moodCard, workoutType, outdoorRunWorkoutDatabase);
}

// Mapping of muscle group names to their databases
const muscleGroupDatabases: Record<string, EquipmentWorkouts[]> = {
  'Chest': chestWorkoutDatabase,
  'Back': backWorkoutDatabase,
  'Shoulders': shouldersWorkoutDatabase,
  'Biceps': bicepsWorkoutDatabase,
  'Triceps': tricepsWorkoutDatabase,
  'Abs': absWorkoutDatabase,
  'Quads': quadsWorkoutDatabase,
  'Hamstrings': hamstringsWorkoutDatabase,
  'Glutes': glutesWorkoutDatabase,
  'Calves': calvesWorkoutDatabase,
  'Legs': [...quadsWorkoutDatabase, ...hamstringsWorkoutDatabase, ...glutesWorkoutDatabase, ...calvesWorkoutDatabase],
};

// Define primary vs ancillary muscle groups for ordering
const PRIMARY_MUSCLE_GROUPS = ['Legs', 'Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Glutes', 'Calves'];
const ANCILLARY_MUSCLE_GROUPS = ['Biceps', 'Triceps', 'Abs']; // Abs should always be last

// Minimum exercise counts for primary muscle groups (intermediate/advanced)
const MIN_EXERCISES_PRIMARY: Record<string, number> = {
  'Legs': 4,
  'Quads': 3,
  'Hamstrings': 3,
  'Glutes': 3,
  'Calves': 2,
  'Chest': 3,
  'Back': 3,
  'Shoulders': 3,
};

// Compound exercises for legs (must include at least 1 for legs)
const LEG_COMPOUND_EXERCISES = [
  'Barbell Back Squat',
  'Front Squat',
  'Leg Press',
  'Romanian Deadlift',
  'Deadlift',
  'Bulgarian Split Squat',
  'Lunges',
  'Goblet Squat',
  'Hack Squat',
  'Sumo Deadlift',
  'Barbell Hack Squat',
  'Dumbbell Lunges',
  'Walking Lunges',
  'Smith Machine Squat',
  'Trap Bar Deadlift',
  'Barbell Squat',
  'Dumbbell Squat',
  'Split Squat',
  'Step Up',
  'Zercher Squat',
];

// Leg sub-groups for isolation exercises
const LEG_ISOLATION_GROUPS = ['Quads', 'Hamstrings', 'Glutes', 'Calves'];

// Check if a workout is a compound leg exercise
function isCompoundLegExercise(workoutName: string): boolean {
  return LEG_COMPOUND_EXERCISES.some(compound => 
    workoutName.toLowerCase().includes(compound.toLowerCase()) ||
    compound.toLowerCase().includes(workoutName.toLowerCase())
  );
}

// Get workouts from database with muscle group tagging
function getWorkoutsForMuscleGroup(
  muscleGroup: string,
  intensity: IntensityLevel
): { workout: Workout; equipment: string; muscleGroup: string }[] {
  const database = muscleGroupDatabases[muscleGroup];
  if (!database) return [];
  
  const workouts: { workout: Workout; equipment: string; muscleGroup: string }[] = [];
  
  for (const equipmentData of database) {
    const intensityWorkouts = equipmentData.workouts[intensity] || [];
    for (const workout of intensityWorkouts) {
      workouts.push({
        workout,
        equipment: equipmentData.equipment,
        muscleGroup: muscleGroup,
      });
    }
  }
  
  return workouts;
}

// Special function to select leg workouts with compound-first rule
function selectLegWorkouts(
  intensity: IntensityLevel,
  usedWorkoutNames: Set<string>
): { workout: Workout; equipment: string; muscleGroup: string }[] {
  const isBeginner = intensity === 'beginner';
  
  // Get compound count and isolation count based on intensity
  const compoundCount = 2;
  const isolationCount = isBeginner ? 1 : 2; // Beginner: 2+1=3, Int/Adv: 2+2=4
  
  const selected: { workout: Workout; equipment: string; muscleGroup: string }[] = [];
  
  // Step 1: Get all leg workouts from all sub-groups
  const allLegWorkouts: { workout: Workout; equipment: string; muscleGroup: string }[] = [];
  for (const subGroup of LEG_ISOLATION_GROUPS) {
    const subGroupWorkouts = getWorkoutsForMuscleGroup(subGroup, intensity);
    allLegWorkouts.push(...subGroupWorkouts);
  }
  
  // Shuffle for variety
  const shuffledWorkouts = shuffleArray(allLegWorkouts);
  
  // Step 2: Select compound exercises first
  const compoundWorkouts = shuffledWorkouts.filter(w => 
    isCompoundLegExercise(w.workout.name) && !usedWorkoutNames.has(w.workout.name)
  );
  
  for (const compound of compoundWorkouts) {
    if (selected.length >= compoundCount) break;
    selected.push(compound);
    usedWorkoutNames.add(compound.workout.name);
  }
  
  // Step 3: Select isolation exercises from different sub-groups (no duplicates from same group)
  const usedSubGroups = new Set<string>();
  const isolationWorkouts = shuffledWorkouts.filter(w => 
    !isCompoundLegExercise(w.workout.name) && !usedWorkoutNames.has(w.workout.name)
  );
  
  for (const isolation of isolationWorkouts) {
    if (selected.length >= compoundCount + isolationCount) break;
    
    // Don't pick two exercises from the same sub-group
    if (usedSubGroups.has(isolation.muscleGroup)) continue;
    
    selected.push(isolation);
    usedWorkoutNames.add(isolation.workout.name);
    usedSubGroups.add(isolation.muscleGroup);
  }
  
  // If we still need more isolation exercises (unlikely but handle edge case)
  // Allow same sub-group but different exercises
  if (selected.length < compoundCount + isolationCount) {
    for (const isolation of isolationWorkouts) {
      if (selected.length >= compoundCount + isolationCount) break;
      if (usedWorkoutNames.has(isolation.workout.name)) continue;
      
      selected.push(isolation);
      usedWorkoutNames.add(isolation.workout.name);
    }
  }
  
  // Tag all selected as "Legs" for proper grouping
  return selected.map(w => ({
    ...w,
    muscleGroup: 'Legs'
  }));
}

// Select workouts for a specific muscle group with minimum count requirements
function selectWorkoutsForMuscleGroup(
  muscleGroup: string,
  intensity: IntensityLevel,
  minCount: number,
  maxCount: number,
  usedWorkoutNames: Set<string>,
  requireCompound: boolean = false
): { workout: Workout; equipment: string; muscleGroup: string }[] {
  const availableWorkouts = getWorkoutsForMuscleGroup(muscleGroup, intensity);
  const selected: { workout: Workout; equipment: string; muscleGroup: string }[] = [];
  
  // Shuffle for randomness
  const shuffled = shuffleArray(availableWorkouts);
  
  // If we need a compound exercise for legs, find one first
  if (requireCompound) {
    const compoundWorkout = shuffled.find(
      w => LEG_COMPOUND_EXERCISES.some(name => 
        w.workout.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(w.workout.name.toLowerCase())
      ) && !usedWorkoutNames.has(w.workout.name)
    );
    if (compoundWorkout) {
      selected.push(compoundWorkout);
      usedWorkoutNames.add(compoundWorkout.workout.name);
    }
  }
  
  // Fill remaining slots
  for (const item of shuffled) {
    if (usedWorkoutNames.has(item.workout.name)) continue;
    if (selected.length >= maxCount) break;
    
    selected.push(item);
    usedWorkoutNames.add(item.workout.name);
  }
  
  // Ensure minimum count (allow reuse if necessary)
  if (selected.length < minCount) {
    for (const item of shuffled) {
      if (selected.length >= minCount) break;
      if (!selected.some(s => s.workout.name === item.workout.name)) {
        selected.push(item);
      }
    }
  }
  
  return selected;
}

// Export for Muscle Gainer path (uses selected muscle groups only)
export function generateMuscleGainerCarts(
  intensity: IntensityLevel,
  selectedMuscleGroups: string[] = [],
  moodCard: string = 'I want to gain muscle',
  workoutType: string = 'Muscle Building'
): GeneratedCart[] {
  // If no muscle groups selected, return empty
  if (selectedMuscleGroups.length === 0) {
    return [];
  }

  const carts: GeneratedCart[] = [];
  const isBeginner = intensity === 'beginner';
  
  // Generate 3 cart options
  for (let cartIndex = 0; cartIndex < 3; cartIndex++) {
    const usedWorkoutNames = new Set<string>();
    const allWorkouts: { workout: Workout; equipment: string; muscleGroup: string }[] = [];
    
    // Separate muscle groups into primary and ancillary
    const primaryGroups = selectedMuscleGroups.filter(g => PRIMARY_MUSCLE_GROUPS.includes(g));
    const ancillaryGroups = selectedMuscleGroups.filter(g => ANCILLARY_MUSCLE_GROUPS.includes(g));
    
    // Sort ancillary groups to ensure Abs is last
    ancillaryGroups.sort((a, b) => {
      if (a === 'Abs') return 1;
      if (b === 'Abs') return -1;
      return 0;
    });
    
    // Process primary muscle groups first
    for (const muscleGroup of primaryGroups) {
      // Special handling for "Legs" - use dedicated function
      if (muscleGroup === 'Legs') {
        const legWorkouts = selectLegWorkouts(intensity, usedWorkoutNames);
        allWorkouts.push(...legWorkouts);
        continue;
      }
      
      // Determine exercise count for this muscle group
      let minCount = isBeginner ? 2 : (MIN_EXERCISES_PRIMARY[muscleGroup] || 3);
      let maxCount = isBeginner ? 3 : minCount + 1;
      
      // Check if this is a leg-related sub-group that needs a compound
      const isLegSubGroup = ['Quads', 'Hamstrings', 'Glutes'].includes(muscleGroup);
      const requireCompound = !isBeginner && isLegSubGroup;
      
      const groupWorkouts = selectWorkoutsForMuscleGroup(
        muscleGroup,
        intensity,
        minCount,
        maxCount,
        usedWorkoutNames,
        requireCompound
      );
      
      allWorkouts.push(...groupWorkouts);
    }
    
    // Process ancillary muscle groups (always at the end, abs last)
    for (const muscleGroup of ancillaryGroups) {
      // Ancillary groups should always have at least 2 exercises
      const minCount = 2;
      const maxCount = isBeginner ? 2 : 3;
      
      const groupWorkouts = selectWorkoutsForMuscleGroup(
        muscleGroup,
        intensity,
        minCount,
        maxCount,
        usedWorkoutNames,
        false
      );
      
      allWorkouts.push(...groupWorkouts);
    }
    
    // Now sort the workouts to group by muscle group consecutively
    // Primary groups first (in order selected), then ancillary (with abs last)
    const sortedWorkouts = sortWorkoutsByMuscleGroup(allWorkouts, [...primaryGroups, ...ancillaryGroups]);
    
    // Convert to WorkoutItems
    const workoutItems = sortedWorkouts.map(item =>
      workoutToItem(item.workout, item.equipment, intensity, moodCard, `${workoutType} - ${item.muscleGroup}`)
    );
    
    // Calculate total duration
    const totalDuration = workoutItems.reduce(
      (sum, item) => sum + parseDuration(item.duration),
      0
    );
    
    if (workoutItems.length > 0) {
      carts.push({
        id: `cart-${cartIndex + 1}-${Date.now()}`,
        workouts: workoutItems,
        totalDuration,
        intensity,
      });
    }
  }
  
  return carts;
}

// Sort workouts to group by muscle group consecutively
function sortWorkoutsByMuscleGroup(
  workouts: { workout: Workout; equipment: string; muscleGroup: string }[],
  muscleGroupOrder: string[]
): { workout: Workout; equipment: string; muscleGroup: string }[] {
  // Create a map to track the order position of each muscle group
  const orderMap = new Map<string, number>();
  muscleGroupOrder.forEach((group, index) => {
    orderMap.set(group, index);
  });
  
  // Sort workouts by their muscle group's position in the order
  return [...workouts].sort((a, b) => {
    const orderA = orderMap.get(a.muscleGroup) ?? 999;
    const orderB = orderMap.get(b.muscleGroup) ?? 999;
    return orderA - orderB;
  });
}
