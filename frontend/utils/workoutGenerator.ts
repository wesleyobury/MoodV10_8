import { WorkoutItem } from '../contexts/CartContext';
import { lightWeightsDatabase } from '../data/light-weights-data';
import { cardioWorkoutsDatabase } from '../data/cardio-workouts-data';
import { bodyweightExplosivenessDatabase } from '../data/bodyweight-explosiveness-data';
import { explosivenessWeightsDatabase } from '../data/explosiveness-weights-data';
import { lazyBodyweightDatabase } from '../data/lazy-bodyweight-data';
import { lazyUpperBodyDatabase } from '../data/lazy-upper-body-data';
import { lazyLowerBodyDatabase } from '../data/lazy-lower-body-data';
import { lazyFullBodyDatabase } from '../data/lazy-full-body-data';
import { additionalWorkoutDatabase as calisthenicsDatabase, calisthenicsWorkoutsDatabase } from '../data/calisthenics-all-workouts-data';
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
import {
  Workout,
  EquipmentWorkouts,
  Modality,
  IntensityCost,
  OutdoorEnvironment,
  SessionType,
  MovementFocus,
  CalisthenicsEquipment,
  MoveYourBodyEquipment,
  LazyModality,
  LiftWeightsBodyRegion,
  LiftWeightsSubCategory,
  ExplosivePath,
  CartFlavor,
} from '../types/workout';
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
    role: workout.role,
    intensity_cost: workout.intensity_cost,
    modality: workout.modality,
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
// SWEAT MOOD CARD — Structured Assembly Logic (v2)
// ============================================================================
// Cart structure by tier (FIXED size, not a range):
//   Beginner    : [Cardio Primer, Resistance Main]                    (2 exercises)
//   Intermediate: [Cardio Primer, Resistance Main, Cardio Finisher]   (3 exercises)
//   Advanced    : [Cardio Primer, Resistance Main, Cardio Finisher]   (3 exercises)
//
// Hard rules per cart:
//   • Equipment uniqueness: no two slots can share `equipment` value
//   • Modality alternation: cardio → resistance → cardio (canonical sandwich)
//   • Always exactly 1 resistance circuit + 1-2 cardio blocks
//
// Slot eligibility:
//   • Cardio Primer:  modality='cardio', intensity_cost<=3, prefer role='primer'
//                     (any tier; beginner-tier primers are valid for advanced users)
//   • Resistance Main: modality='resistance', tier===userTier, intensity_cost>=3,
//                     prefer role='main_block', accept role='finisher' for int/adv
//   • Cardio Finisher: modality='cardio', tier===userTier, intensity_cost>=4,
//                     prefer role='finisher'
//
// 3 carts: differentiate by equipment selection (not session shape).
// Cross-cart soft preference: track usedEquipmentByRole and deprioritize
// (don't exclude) repeats so the 3 carts visibly differ.
// ============================================================================

type SlotRole = 'primer' | 'main_block' | 'finisher';

interface TaggedCandidate {
  workout: Workout;
  equipment: string;
  tier: IntensityLevel;
}

const SWEAT_CART_SIZE: Record<IntensityLevel, number> = {
  beginner: 2,
  intermediate: 3,
  advanced: 3,
};

// Pull every tagged workout from cardio + light-weights pools, preserving tier.
function buildSweatPool(): TaggedCandidate[] {
  const out: TaggedCandidate[] = [];
  const harvest = (db: EquipmentWorkouts[]) => {
    for (const eq of db) {
      for (const tier of ['beginner', 'intermediate', 'advanced'] as IntensityLevel[]) {
        for (const w of eq.workouts[tier] || []) {
          if (!w.role || !w.modality) continue;
          out.push({ workout: w, equipment: eq.equipment, tier });
        }
      }
    }
  };
  harvest(cardioWorkoutsDatabase);
  harvest(lightWeightsDatabase);
  return out;
}

interface SlotConstraints {
  modality: Modality;
  tier?: IntensityLevel;            // hard tier filter (omit for any-tier)
  preferRole: SlotRole;
  acceptRoles?: SlotRole[];          // additional roles allowed if preferRole is exhausted
  costMin?: IntensityCost;
  costMax?: IntensityCost;
}

// Pick a candidate matching constraints, excluding equipment already in cart,
// and deprioritizing equipment already used in this slot-role across the 3 carts.
function pickCandidate(
  pool: TaggedCandidate[],
  constraints: SlotConstraints,
  excludeEquipment: Set<string>,
  deprioritizeEquipment: Set<string>,
  usedNames: Set<string>
): TaggedCandidate | null {
  const { modality, tier, preferRole, acceptRoles = [], costMin, costMax } = constraints;

  // Hard filter
  let filtered = pool.filter(c => {
    if (c.workout.modality !== modality) return false;
    if (tier && c.tier !== tier) return false;
    if (excludeEquipment.has(c.equipment)) return false;
    const cost = c.workout.intensity_cost ?? 3;
    if (costMin !== undefined && cost < costMin) return false;
    if (costMax !== undefined && cost > costMax) return false;
    return true;
  });

  if (filtered.length === 0) return null;

  // Prefer fresh names (not used elsewhere in this build)
  const fresh = filtered.filter(c => !usedNames.has(c.workout.name));
  if (fresh.length > 0) filtered = fresh;

  // Prefer preferRole, fall back to acceptRoles
  let preferred = filtered.filter(c => c.workout.role === preferRole);
  if (preferred.length === 0 && acceptRoles.length > 0) {
    preferred = filtered.filter(c => acceptRoles.includes(c.workout.role!));
  }
  if (preferred.length === 0) preferred = filtered;

  // Cross-cart variety: prefer equipment NOT already used in this slot role
  const novel = preferred.filter(c => !deprioritizeEquipment.has(c.equipment));
  const finalPool = novel.length > 0 ? novel : preferred;

  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

// New structured Sweat generator (v2) — slot-based assembly with strict
// equipment uniqueness + canonical cardio-resistance-cardio sandwich.
export function generateSweatBurnFatCarts(
  intensity: IntensityLevel,
  moodCard: string = 'Sweat / burn fat',
  workoutType: string = 'Mixed'
): GeneratedCart[] {
  const pool = buildSweatPool();
  const cartSize = SWEAT_CART_SIZE[intensity];

  // Track equipment used per slot-role across the 3 carts (soft variety).
  const usedEqByRole: Record<SlotRole, Set<string>> = {
    primer: new Set(),
    main_block: new Set(),
    finisher: new Set(),
  };
  const usedNames = new Set<string>();
  const carts: GeneratedCart[] = [];

  for (let cartIdx = 0; cartIdx < 3; cartIdx++) {
    const usedEqInCart = new Set<string>();
    const slotItems: WorkoutItem[] = [];
    let totalDuration = 0;

    // SLOT 1 — Cardio Primer
    const primer = pickCandidate(
      pool,
      {
        modality: 'cardio',
        preferRole: 'primer',
        acceptRoles: ['main_block'],
        costMax: 3,
      },
      usedEqInCart,
      usedEqByRole.primer,
      usedNames,
    );
    if (!primer) continue; // skip cart if no primer available
    slotItems.push(workoutToItem(primer.workout, primer.equipment, intensity, moodCard, workoutType));
    usedEqInCart.add(primer.equipment);
    usedEqByRole.primer.add(primer.equipment);
    usedNames.add(primer.workout.name);
    totalDuration += parseDuration(primer.workout.duration);

    // SLOT 2 — Resistance Main (tier-locked)
    const main = pickCandidate(
      pool,
      {
        modality: 'resistance',
        tier: intensity,
        preferRole: 'main_block',
        acceptRoles: intensity === 'beginner' ? [] : ['finisher'],
        costMin: 3,
      },
      usedEqInCart,
      usedEqByRole.main_block,
      usedNames,
    );
    if (!main) continue;
    slotItems.push(workoutToItem(main.workout, main.equipment, intensity, moodCard, workoutType));
    usedEqInCart.add(main.equipment);
    usedEqByRole.main_block.add(main.equipment);
    usedNames.add(main.workout.name);
    totalDuration += parseDuration(main.workout.duration);

    // SLOT 3 — Cardio Finisher (only for intermediate/advanced)
    if (cartSize === 3) {
      const finisher = pickCandidate(
        pool,
        {
          modality: 'cardio',
          tier: intensity,
          preferRole: 'finisher',
          acceptRoles: ['main_block'],
          costMin: 4,
        },
        usedEqInCart, // critical — prevents same cardio twice
        usedEqByRole.finisher,
        usedNames,
      );
      if (finisher) {
        slotItems.push(workoutToItem(finisher.workout, finisher.equipment, intensity, moodCard, workoutType));
        usedEqInCart.add(finisher.equipment);
        usedEqByRole.finisher.add(finisher.equipment);
        usedNames.add(finisher.workout.name);
        totalDuration += parseDuration(finisher.workout.duration);
      }
    }

    if (slotItems.length === 0) continue;

    carts.push({
      id: `sweat-cart-${cartIdx + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      workouts: slotItems,
      totalDuration,
      intensity,
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

// ============================================================================
// I'M FEELING EXPLOSIVE — Build For Me v3
// 3 carts, each tagged with a flavor: plyo / loaded / dynamic.
// Beginner = 2 slots (1 BW + 1 LW); Int/Adv = 3 slots (1 BW + 1 LW + 1 flex).
// Hard rules:
//   • each cart contains exactly 1 BW and 1 LW workout (slots 1-2 mandatory)
//   • no equipment value appears in more than one cart in a single generation
//   • each cart's workouts share the same cart_flavor
//   • sequencing: lowest intensity_cost first; for 3-slot carts → low, high, mid
// Returned in canonical display order: plyo → loaded → dynamic.
// ============================================================================

interface ExplosiveCandidate {
  workout: Workout;
  equipment: string;
  path: ExplosivePath;
  flavor: CartFlavor;
  cost: number;
}

const EXPLOSIVE_FLAVORS: CartFlavor[] = ['plyo', 'loaded', 'dynamic'];

function buildExplosivePool(
  database: EquipmentWorkouts[],
  intensity: IntensityLevel,
  path: ExplosivePath,
): ExplosiveCandidate[] {
  const out: ExplosiveCandidate[] = [];
  for (const eq of database) {
    for (const w of eq.workouts[intensity] || []) {
      if (!w.cart_flavor || !w.path) continue;
      out.push({
        workout: w,
        equipment: eq.equipment,
        path: w.path,
        flavor: w.cart_flavor,
        cost: w.intensity_cost ?? 3,
      });
    }
  }
  return out;
}

function pickFromFlavoredPool(
  pool: ExplosiveCandidate[],
  flavor: CartFlavor,
  excludeNames: Set<string>,
  excludeEquipment: Set<string>,
  pathFilter?: ExplosivePath,
): ExplosiveCandidate | null {
  const candidates = pool.filter(c =>
    c.flavor === flavor &&
    !excludeNames.has(c.workout.name) &&
    !excludeEquipment.has(c.equipment) &&
    (pathFilter ? c.path === pathFilter : true)
  );
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function sequenceExplosiveCart(items: ExplosiveCandidate[]): ExplosiveCandidate[] {
  const sorted = [...items].sort((a, b) => a.cost - b.cost);
  if (sorted.length <= 2) return sorted;
  // 3 slots: low, high, mid
  return [sorted[0], sorted[2], sorted[1]];
}

export function generateExplosivenessCarts(
  intensity: IntensityLevel,
  moodCard: string = 'I want to build explosion',
  workoutType: string = 'Mixed Explosive',
): GeneratedCart[] {
  const bwPool = buildExplosivePool(bodyweightExplosivenessDatabase, intensity, 'bodyweight');
  const lwPool = buildExplosivePool(explosivenessWeightsDatabase, intensity, 'weights');
  const fullPool = [...bwPool, ...lwPool];

  const cartSize = intensity === 'beginner' ? 2 : 3;

  // Process tightest flavor first. Tightness is the SMALLEST DISTINCT EQUIPMENT count
  // across the BW and LW slots for that flavor — that's the slot most likely to be
  // blocked by other flavors' picks.
  const distinctEq = (pool: ExplosiveCandidate[], flavor: CartFlavor): number =>
    new Set(pool.filter(c => c.flavor === flavor).map(c => c.equipment)).size;

  const flavorTightness = EXPLOSIVE_FLAVORS.map(f => ({
    flavor: f,
    tightness: Math.min(distinctEq(bwPool, f), distinctEq(lwPool, f)),
  }));

  // Retry the whole generation a bounded number of times. Even with smart sort,
  // shared-equipment conflicts (e.g. KB appearing in both loaded BW and dynamic LW)
  // can require a do-over for a small fraction of seeds.
  const MAX_ATTEMPTS = 25;
  let cartsByFlavor = new Map<CartFlavor, ExplosiveCandidate[]>();

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    cartsByFlavor = new Map<CartFlavor, ExplosiveCandidate[]>();
    const flavorsByDepth = [...flavorTightness].sort((a, b) => a.tightness - b.tightness).map(x => x.flavor);
    const usedEquipment = new Set<string>();
    const usedNames = new Set<string>();
    let allFlavorsFilled = true;

    for (const flavor of flavorsByDepth) {
      const cart: ExplosiveCandidate[] = [];

      const bwPick = pickFromFlavoredPool(bwPool, flavor, usedNames, usedEquipment);
      if (!bwPick) { allFlavorsFilled = false; break; }
      cart.push(bwPick);
      usedEquipment.add(bwPick.equipment);
      usedNames.add(bwPick.workout.name);

      const lwPick = pickFromFlavoredPool(lwPool, flavor, usedNames, usedEquipment);
      if (!lwPick) { allFlavorsFilled = false; break; }
      cart.push(lwPick);
      usedEquipment.add(lwPick.equipment);
      usedNames.add(lwPick.workout.name);

      if (cartSize === 3) {
        const flexPick = pickFromFlavoredPool(fullPool, flavor, usedNames, usedEquipment);
        if (flexPick) {
          cart.push(flexPick);
          usedEquipment.add(flexPick.equipment);
          usedNames.add(flexPick.workout.name);
        }
        // Flex slot is best-effort; not having one isn't fatal but shouldn't really happen.
      }

      cartsByFlavor.set(flavor, sequenceExplosiveCart(cart));
    }
    if (allFlavorsFilled && cartsByFlavor.size === 3) break;
  }

  // Reorder to canonical display: plyo → loaded → dynamic
  const carts: GeneratedCart[] = [];
  EXPLOSIVE_FLAVORS.forEach((flavor, idx) => {
    const cart = cartsByFlavor.get(flavor);
    if (!cart || cart.length === 0) return;
    const items: WorkoutItem[] = cart.map(c =>
      workoutToItem(c.workout, c.equipment, intensity, moodCard, workoutType),
    );
    const totalDuration = items.reduce((sum, it) => sum + parseDuration(it.duration), 0);
    carts.push({
      id: `cart-${idx + 1}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      workouts: items,
      totalDuration,
      intensity,
    });
  });
  return carts;
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

// ============================================================================
// I'M FEELING LAZY — Build For Me v2
// Two paths picked by the user before this runs:
//   • Move Your Body  → cardio machine + bodyweight finisher carts
//   • Lift Weights    → 1-workout machine carts (upper / lower / full body)
// ============================================================================

// Move Your Body: parent-equipment label → snake_case key
const MB_EQUIPMENT_TO_KEY: Record<string, MoveYourBodyEquipment> = {
  'Treadmill': 'treadmill',
  'Stationary bike': 'stationary_bike',
  'Elliptical': 'elliptical',
  'Stair stepper': 'stair_stepper',
  'Rowing machine': 'rowing_machine',
  'Assault Bike': 'assault_bike',
  'SkiErg': 'skierg',
  'Jump rope': 'jump_rope',
  'Plyo box': 'plyo_box',
  'Body weight only': 'bodyweight',
};

interface MBCandidate {
  workout: Workout;
  displayEquipment: string;
  equipment: MoveYourBodyEquipment;
  modality: LazyModality;
}

function buildMoveYourBodyPool(intensity: IntensityLevel): MBCandidate[] {
  const out: MBCandidate[] = [];
  for (const eq of lazyBodyweightDatabase) {
    const key = MB_EQUIPMENT_TO_KEY[eq.equipment];
    if (!key) continue;
    const modality: LazyModality = key === 'bodyweight' ? 'bodyweight' : 'cardio';
    for (const w of eq.workouts[intensity] || []) {
      out.push({ workout: w, displayEquipment: eq.equipment, equipment: key, modality });
    }
  }
  return out;
}

// Generate 3 Move Your Body carts.
//   Beginner       → 2 slots: [cardio, bodyweight]
//   Int / Advanced → 3 slots: [cardio, cardio (different), bodyweight]
export function generateMoveYourBodyCarts(
  intensity: IntensityLevel,
  moodCard: string = "I'm feeling lazy",
): GeneratedCart[] {
  const workoutType = 'Move Your Body';
  const pool = buildMoveYourBodyPool(intensity);
  const cardioPool = pool.filter(c => c.modality === 'cardio');
  const bodyweightPool = pool.filter(c => c.modality === 'bodyweight');

  if (cardioPool.length === 0 || bodyweightPool.length === 0) return [];

  const cartSize = intensity === 'beginner' ? 2 : 3;
  const cardioSlotsPerCart = cartSize - 1;

  const carts: GeneratedCart[] = [];
  const usedBodyweightNames = new Set<string>();
  const usedCardioEquipByRole: Set<MoveYourBodyEquipment>[] = Array.from(
    { length: cardioSlotsPerCart },
    () => new Set<MoveYourBodyEquipment>(),
  );

  for (let cartIndex = 0; cartIndex < 3; cartIndex++) {
    const cart: MBCandidate[] = [];
    const usedEquipInCart = new Set<MoveYourBodyEquipment>();

    // Cardio slot(s): equipment-unique within cart, soft cross-cart variety per role
    for (let slotIdx = 0; slotIdx < cardioSlotsPerCart; slotIdx++) {
      const candidates = cardioPool.filter(c => !usedEquipInCart.has(c.equipment));
      if (candidates.length === 0) break;
      const preferred = candidates.filter(c => !usedCardioEquipByRole[slotIdx].has(c.equipment));
      const finalPool = preferred.length > 0 ? preferred : candidates;
      const pick = finalPool[Math.floor(Math.random() * finalPool.length)];
      cart.push(pick);
      usedEquipInCart.add(pick.equipment);
      usedCardioEquipByRole[slotIdx].add(pick.equipment);
    }

    // Bodyweight finisher: always last, prefer unused names across carts
    let bwCandidates = bodyweightPool.filter(c => !usedBodyweightNames.has(c.workout.name));
    if (bwCandidates.length === 0) bwCandidates = bodyweightPool; // pool exhausted — allow repeat
    const bwPick = bwCandidates[Math.floor(Math.random() * bwCandidates.length)];
    cart.push(bwPick);
    usedBodyweightNames.add(bwPick.workout.name);

    const items: WorkoutItem[] = cart.map(c =>
      workoutToItem(c.workout, c.displayEquipment, intensity, moodCard, workoutType),
    );
    const totalDuration = items.reduce((sum, it) => sum + parseDuration(it.duration), 0);

    carts.push({
      id: `cart-${cartIndex + 1}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      workouts: items,
      totalDuration,
      intensity,
    });
  }

  return carts;
}

// Lift Weights: derive sub_category from each EquipmentWorkouts.equipment label per region.
const LW_SUBCAT_MAP: Record<LiftWeightsBodyRegion, Record<string, LiftWeightsSubCategory>> = {
  upper: {
    'Push': 'upper_press',
    'Pull': 'upper_pull',
    'Full Upper Body': 'upper_full',
  },
  lower: {
    'Push': 'lower_quad',
    'Pull': 'lower_hinge',
    'Full Lower Body': 'lower_full',
  },
  full_body: {
    'Push': 'fullbody_push',
    'Pull': 'fullbody_pull',
    'Full Body': 'fullbody_mix',
  },
};

interface LWCandidate {
  workout: Workout;
  displayEquipment: string;
  body_region: LiftWeightsBodyRegion;
  sub_category: LiftWeightsSubCategory;
}

function buildLiftWeightsPool(
  region: LiftWeightsBodyRegion,
  intensity: IntensityLevel,
): LWCandidate[] {
  const db =
    region === 'upper' ? lazyUpperBodyDatabase :
    region === 'lower' ? lazyLowerBodyDatabase :
    lazyFullBodyDatabase;
  const subMap = LW_SUBCAT_MAP[region];

  const out: LWCandidate[] = [];
  for (const eq of db) {
    const subCat = subMap[eq.equipment];
    if (!subCat) continue;
    for (const w of eq.workouts[intensity] || []) {
      out.push({
        workout: w,
        displayEquipment: eq.equipment,
        body_region: region,
        sub_category: subCat,
      });
    }
  }
  return out;
}

// In-memory soft cache: avoid repeating sub-category in each region across consecutive calls.
type LWSubCache = { upper: LiftWeightsSubCategory | null; lower: LiftWeightsSubCategory | null; full_body: LiftWeightsSubCategory | null };
const lwLastPicks: LWSubCache = { upper: null, lower: null, full_body: null };

// Generate 3 Lift Weights carts: [Upper], [Lower], [Full Body], each with 1 workout.
export function generateLiftWeightsCarts(
  intensity: IntensityLevel,
  moodCard: string = "I'm feeling lazy",
): GeneratedCart[] {
  const workoutType = 'Lift Weights';
  const regions: LiftWeightsBodyRegion[] = ['upper', 'lower', 'full_body'];
  const carts: GeneratedCart[] = [];

  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    const regionPool = buildLiftWeightsPool(region, intensity);
    if (regionPool.length === 0) continue;

    const lastSub = lwLastPicks[region];
    const preferred = lastSub ? regionPool.filter(c => c.sub_category !== lastSub) : regionPool;
    const finalPool = preferred.length > 0 ? preferred : regionPool;
    const pick = finalPool[Math.floor(Math.random() * finalPool.length)];

    lwLastPicks[region] = pick.sub_category;

    const item = workoutToItem(pick.workout, pick.displayEquipment, intensity, moodCard, workoutType);
    carts.push({
      id: `cart-${i + 1}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      workouts: [item],
      totalDuration: parseDuration(item.duration),
      intensity,
    });
  }

  return carts;
}

// Backwards-compatible dispatcher used by lazy-training-type.tsx.
export function generateLazyCartsWithType(
  intensity: IntensityLevel,
  trainingType: 'bodyweight' | 'weights',
  moodCard: string = "I'm feeling lazy",
): GeneratedCart[] {
  return trainingType === 'bodyweight'
    ? generateMoveYourBodyCarts(intensity, moodCard)
    : generateLiftWeightsCarts(intensity, moodCard);
}

// ============================================================================
// CALISTHENICS MOOD CARD — Slot-Assembly Build Logic (v2)
// ============================================================================
// Cart structure by tier:
//   Beginner    : [Main, Abs Finisher]                (2 workouts)
//   Intermediate: [Main 1, Main 2, Abs Finisher]      (3 workouts)
//   Advanced    : [Main 1, Main 2, Abs Finisher]      (3 workouts)
//
// Rules:
//   • Equipment uniqueness within int/adv carts (each slot uses different gear)
//   • Last slot is always abs-eligible (ab_wheel, no_equipment, or pull_up_bar_abs)
//   • Finisher-only equipment (ab_wheel, pull_up_bar_abs) cannot fill main slots
//   • Slot 2 prefers different movement_focus than Slot 1
//   • Cross-cart soft variety: track usedEquipByRole so abs slot rotates through gear
//   • No equipment selection prerequisite — pulls from full database
// ============================================================================

const CAL_EQUIPMENT_TO_KEY: Record<string, CalisthenicsEquipment> = {
  'Pure bodyweight': 'no_equipment',
  'Pull up bar': 'pull_up_bar',
  'Pull-Up Bar (abs)': 'pull_up_bar_abs',
  'Parallel bars / dip station': 'parallel_bars',
  'Gymnast rings': 'rings',
  'Pushup bars / parallettes': 'parallettes',
  'Ab wheel': 'ab_wheel',
};

const CAL_FINISHER_ONLY: Set<CalisthenicsEquipment> = new Set(['ab_wheel', 'pull_up_bar_abs']);

const CAL_CART_SIZE: Record<IntensityLevel, number> = {
  beginner: 2,
  intermediate: 3,
  advanced: 3,
};

interface CalCandidate {
  workout: Workout;
  displayEquipment: string;
  equipment: CalisthenicsEquipment;
  movement_focus?: MovementFocus;
  abs_eligible: boolean;
}

function buildCalisthenicsPool(intensity: IntensityLevel): CalCandidate[] {
  const out: CalCandidate[] = [];
  for (const eq of calisthenicsWorkoutsDatabase) {
    const key = CAL_EQUIPMENT_TO_KEY[eq.equipment];
    if (!key) continue;
    for (const w of eq.workouts[intensity] || []) {
      out.push({
        workout: w,
        displayEquipment: eq.equipment,
        equipment: key,
        movement_focus: w.movement_focus,
        abs_eligible: !!w.abs_slot_eligible,
      });
    }
  }
  return out;
}

function pickCalMain(
  pool: CalCandidate[],
  usedNames: Set<string>,
  usedEqInCart: Set<CalisthenicsEquipment>,
  avoidFocus: MovementFocus | null,
  deprioritizeEquip: Set<CalisthenicsEquipment>,
  deprioritizeFocus: Set<MovementFocus>,
): CalCandidate | null {
  let candidates = pool.filter(c =>
    !usedNames.has(c.workout.name) &&
    !CAL_FINISHER_ONLY.has(c.equipment) &&
    !usedEqInCart.has(c.equipment)
  );
  if (candidates.length === 0) return null;

  if (avoidFocus) {
    const filtered = candidates.filter(c => c.movement_focus !== avoidFocus);
    if (filtered.length > 0) candidates = filtered;
  }
  // Prefer non-deprioritized equipment AND non-deprioritized focus
  const novel = candidates.filter(c =>
    !deprioritizeEquip.has(c.equipment) && (!c.movement_focus || !deprioritizeFocus.has(c.movement_focus))
  );
  const finalPool = novel.length > 0 ? novel : candidates;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

function pickCalAbs(
  pool: CalCandidate[],
  usedNames: Set<string>,
  excludeEquip: Set<CalisthenicsEquipment>,
  deprioritizeEquip: Set<CalisthenicsEquipment>,
): CalCandidate | null {
  const candidates = pool.filter(c =>
    !usedNames.has(c.workout.name) &&
    c.abs_eligible &&
    !excludeEquip.has(c.equipment)
  );
  if (candidates.length === 0) return null;
  const novel = candidates.filter(c => !deprioritizeEquip.has(c.equipment));
  const finalPool = novel.length > 0 ? novel : candidates;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

// New v2 Calisthenics generator — slot assembly with abs finisher.
export function generateCalisthenicsCarts(
  intensity: IntensityLevel,
  moodCard: string = 'I want to do calisthenics',
  workoutType: string = 'Calisthenics',
): GeneratedCart[] {
  const pool = buildCalisthenicsPool(intensity);
  const cartSize = CAL_CART_SIZE[intensity];

  const usedNames = new Set<string>();
  const usedEqByRole = {
    main_1: new Set<CalisthenicsEquipment>(),
    main_2: new Set<CalisthenicsEquipment>(),
    abs:    new Set<CalisthenicsEquipment>(),
  };
  const usedFocusByRole = {
    main_1: new Set<MovementFocus>(),
    main_2: new Set<MovementFocus>(),
    abs:    new Set<MovementFocus>(),
  };
  const carts: GeneratedCart[] = [];

  for (let cartIdx = 0; cartIdx < 3; cartIdx++) {
    const usedEqInCart = new Set<CalisthenicsEquipment>();
    const items: WorkoutItem[] = [];
    const picks: CalCandidate[] = [];

    // Slot 1 — Main
    const main1 = pickCalMain(pool, usedNames, usedEqInCart, null, usedEqByRole.main_1, usedFocusByRole.main_1);
    if (!main1) continue;
    picks.push(main1);
    usedNames.add(main1.workout.name);
    usedEqInCart.add(main1.equipment);
    usedEqByRole.main_1.add(main1.equipment);
    if (main1.movement_focus) usedFocusByRole.main_1.add(main1.movement_focus);

    // Slot 2 — Main 2 (int/adv only)
    if (cartSize === 3) {
      const main2 = pickCalMain(
        pool,
        usedNames,
        usedEqInCart,
        main1.movement_focus || null,
        usedEqByRole.main_2,
        usedFocusByRole.main_2,
      );
      if (main2) {
        picks.push(main2);
        usedNames.add(main2.workout.name);
        usedEqInCart.add(main2.equipment);
        usedEqByRole.main_2.add(main2.equipment);
        if (main2.movement_focus) usedFocusByRole.main_2.add(main2.movement_focus);
      }
    }

    // Last slot — Abs Finisher
    const absExclude = intensity === 'beginner' ? new Set<CalisthenicsEquipment>() : new Set(usedEqInCart);
    const abs = pickCalAbs(pool, usedNames, absExclude, usedEqByRole.abs);
    if (abs) {
      picks.push(abs);
      usedNames.add(abs.workout.name);
      usedEqByRole.abs.add(abs.equipment);
    }

    if (picks.length === 0) continue;

    // Convert to WorkoutItems. Tag main slots with main_block role and abs with finisher
    // so the cart UI shows Main Set / Finisher labels (consistent with Sweat path).
    picks.forEach((p, idx) => {
      const item = workoutToItem(p.workout, p.displayEquipment, intensity, moodCard, workoutType);
      const isAbsSlot = idx === picks.length - 1 && p.abs_eligible;
      items.push({
        ...item,
        role: isAbsSlot ? 'finisher' : 'main_block',
      });
    });

    const totalDuration = picks.reduce((sum, p) => sum + parseDuration(p.workout.duration), 0);
    carts.push({
      id: `cal-cart-${cartIdx + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      workouts: items,
      totalDuration,
      intensity,
    });
  }

  return carts;
}

// ============================================================================
// OUTDOOR MOOD CARD — Combo + Solo Build Logic (v2)
// ============================================================================
// Cart contents: 1 OR 2 workouts.
//   • Cart A: combo (when eligible) — pairing of two workouts
//   • Cart B: solo high-intensity session
//   • Cart C: second combo (different pairing) when eligible & tier != beginner;
//             otherwise solo low-intensity session
//
// Rules:
//   • Same-env combos (run+run, bike+bike, ...): opener MUST be beginner-tier.
//     Beginner users never get same-env combos (would be redundant).
//   • Cross-env combos: prefer user-tier opener at intensity_cost <= 3;
//     fall back to beginner-tier opener if user tier has none (this is what
//     unblocks advanced users whose tier is all intensity 5).
//   • Combo order: lower intensity_cost first (ties broken by beginner-tier
//     for same-env).
// ============================================================================

const OUTDOOR_EQUIPMENT_TO_ENV: Record<string, OutdoorEnvironment> = {
  'Outdoor Run': 'run',
  'Bike': 'bike',
  'Swim': 'swim',
  'Hills': 'hills',
  'Park workout': 'park',
  'Track workout': 'track',
};

const ELIGIBLE_PAIRINGS: Array<[OutdoorEnvironment, OutdoorEnvironment]> = [
  // Cross-environment
  ['run', 'hills'],
  ['run', 'park'],
  ['bike', 'hills'],
  ['bike', 'park'],
  ['park', 'hills'],
  // Same-environment (opener must be beginner-tier)
  ['run', 'run'],
  ['bike', 'bike'],
  ['swim', 'swim'],
  ['hills', 'hills'],
  ['park', 'park'],
  ['track', 'track'],
];

const isSameEnvCombo = (p: [OutdoorEnvironment, OutdoorEnvironment]) => p[0] === p[1];

interface OutdoorCandidate {
  workout: Workout;
  equipment: string;
  environment: OutdoorEnvironment;
  tier: IntensityLevel;
}

function buildOutdoorPool(selectedEnvironments: OutdoorEnvironment[]): OutdoorCandidate[] {
  const out: OutdoorCandidate[] = [];
  for (const eq of outdoorRunWorkoutDatabase) {
    const env = OUTDOOR_EQUIPMENT_TO_ENV[eq.equipment];
    if (!env) continue;
    if (!selectedEnvironments.includes(env)) continue;
    for (const tier of ['beginner', 'intermediate', 'advanced'] as IntensityLevel[]) {
      for (const w of eq.workouts[tier] || []) {
        out.push({ workout: w, equipment: eq.equipment, environment: env, tier });
      }
    }
  }
  return out;
}

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickSameEnvCombo(
  env: OutdoorEnvironment,
  poolMain: OutdoorCandidate[],
  poolBeginner: OutdoorCandidate[],
  used: Set<string>,
): OutdoorCandidate[] | null {
  const openers = poolBeginner.filter(c => c.environment === env && !used.has(c.workout.name));
  const mains = poolMain.filter(c => c.environment === env && !used.has(c.workout.name));
  if (openers.length === 0 || mains.length === 0) return null;
  const opener = rand(openers);
  // Prefer different session_type for stimulus variety
  const preferred = mains.filter(c => c.workout.session_type !== opener.workout.session_type && c.workout.name !== opener.workout.name);
  const remaining = preferred.length > 0 ? preferred : mains.filter(c => c.workout.name !== opener.workout.name);
  if (remaining.length === 0) return null;
  const main = rand(remaining);
  used.add(opener.workout.name);
  used.add(main.workout.name);
  return [opener, main]; // beginner opener first
}

function pickCrossEnvCombo(
  pairing: [OutdoorEnvironment, OutdoorEnvironment],
  poolMain: OutdoorCandidate[],
  poolBeginner: OutdoorCandidate[],
  used: Set<string>,
): OutdoorCandidate[] | null {
  const [envA, envB] = pairing;
  const poolA_main = poolMain.filter(c => c.environment === envA && !used.has(c.workout.name));
  const poolB_main = poolMain.filter(c => c.environment === envB && !used.has(c.workout.name));

  const openerA_user = poolA_main.filter(c => (c.workout.intensity_cost ?? 3) <= 3);
  const openerB_user = poolB_main.filter(c => (c.workout.intensity_cost ?? 3) <= 3);

  let opener: OutdoorCandidate | null = null;
  let main: OutdoorCandidate | null = null;

  if (openerA_user.length > 0 && poolB_main.length > 0) {
    opener = rand(openerA_user);
    const remaining = poolB_main.filter(c => c.workout.name !== opener!.workout.name);
    if (remaining.length > 0) main = rand(remaining);
  } else if (openerB_user.length > 0 && poolA_main.length > 0) {
    opener = rand(openerB_user);
    const remaining = poolA_main.filter(c => c.workout.name !== opener!.workout.name);
    if (remaining.length > 0) main = rand(remaining);
  }

  // Fallback: pull beginner-tier opener (unblocks advanced)
  if (!opener || !main) {
    const poolA_beg = poolBeginner.filter(c => c.environment === envA && !used.has(c.workout.name));
    const poolB_beg = poolBeginner.filter(c => c.environment === envB && !used.has(c.workout.name));

    if (poolA_beg.length > 0 && poolB_main.length > 0) {
      opener = rand(poolA_beg);
      main = rand(poolB_main);
    } else if (poolB_beg.length > 0 && poolA_main.length > 0) {
      opener = rand(poolB_beg);
      main = rand(poolA_main);
    } else {
      return null;
    }
  }

  used.add(opener.workout.name);
  used.add(main.workout.name);
  // Order: lower intensity_cost first
  const oCost = opener.workout.intensity_cost ?? 3;
  const mCost = main.workout.intensity_cost ?? 3;
  return oCost <= mCost ? [opener, main] : [main, opener];
}

function pickCombo(
  poolMain: OutdoorCandidate[],
  poolBeginner: OutdoorCandidate[],
  validCombos: Array<[OutdoorEnvironment, OutdoorEnvironment]>,
  used: Set<string>,
  usedPairings: Set<string>,
  preferDifferent: boolean,
): OutdoorCandidate[] | null {
  let candidates = validCombos;
  if (preferDifferent && usedPairings.size > 0) {
    const novel = validCombos.filter(p => !usedPairings.has(`${p[0]}|${p[1]}`));
    if (novel.length > 0) candidates = novel;
  }
  // Shuffle candidates so we don't always pick the first
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  for (const pairing of shuffled) {
    const result = isSameEnvCombo(pairing)
      ? pickSameEnvCombo(pairing[0], poolMain, poolBeginner, used)
      : pickCrossEnvCombo(pairing, poolMain, poolBeginner, used);
    if (result) {
      usedPairings.add(`${pairing[0]}|${pairing[1]}`);
      return result;
    }
  }
  return null;
}

function pickSolo(
  poolMain: OutdoorCandidate[],
  intensityPreference: 'high' | 'low',
  used: Set<string>,
  usedSessionTypes: Set<SessionType>,
): OutdoorCandidate[] | null {
  const fresh = poolMain.filter(c => !used.has(c.workout.name));
  if (fresh.length === 0) return null;

  // Prefer novel session_type
  const novel = fresh.filter(c => c.workout.session_type && !usedSessionTypes.has(c.workout.session_type));
  let candidates = novel.length > 0 ? novel : fresh;

  candidates = [...candidates].sort((a, b) => {
    const ac = a.workout.intensity_cost ?? 3;
    const bc = b.workout.intensity_cost ?? 3;
    return intensityPreference === 'high' ? bc - ac : ac - bc;
  });
  // Pick from top 3 to allow some variety while honoring preference
  const topN = Math.min(3, candidates.length);
  const pick = candidates[Math.floor(Math.random() * topN)];
  used.add(pick.workout.name);
  if (pick.workout.session_type) usedSessionTypes.add(pick.workout.session_type);
  return [pick];
}

function candidatesToCart(
  cartIdx: number,
  picks: OutdoorCandidate[],
  intensity: IntensityLevel,
  moodCard: string,
  workoutType: string,
): GeneratedCart {
  const items: WorkoutItem[] = picks.map(p =>
    workoutToItem(p.workout, p.equipment, intensity, moodCard, workoutType)
  );
  // Combo carts: tag opener as 'primer' and main as 'main_block' so the cart UI
  // renders Warm-Up / Main Set labels (mirrors Sweat path styling).
  if (items.length === 2) {
    items[0] = { ...items[0], role: 'primer' };
    items[1] = { ...items[1], role: 'main_block' };
  }
  const totalDuration = picks.reduce((sum, p) => sum + parseDuration(p.workout.duration), 0);
  return {
    id: `outdoor-cart-${cartIdx + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    workouts: items,
    totalDuration,
    intensity,
  };
}

// New v2 Outdoor generator — combo + solo carts based on selected environments.
export function generateOutdoorCarts(
  intensity: IntensityLevel,
  moodCard: string = 'Get outside',
  workoutType: string = 'Outdoor',
  selectedEquipmentNames: string[] = [],
): GeneratedCart[] {
  // Resolve selected equipment names to environment enums.
  // If none provided (legacy callers), use ALL environments.
  let selectedEnvs: OutdoorEnvironment[];
  if (selectedEquipmentNames.length > 0) {
    selectedEnvs = selectedEquipmentNames
      .map(n => OUTDOOR_EQUIPMENT_TO_ENV[n])
      .filter((e): e is OutdoorEnvironment => !!e);
    // Dedupe
    selectedEnvs = Array.from(new Set(selectedEnvs));
  } else {
    selectedEnvs = ['run', 'bike', 'swim', 'hills', 'park', 'track'];
  }

  const pool = buildOutdoorPool(selectedEnvs);
  const poolMain = pool.filter(c => c.tier === intensity);
  const poolBeginner = pool.filter(c => c.tier === 'beginner');

  const validCombos = ELIGIBLE_PAIRINGS.filter(([a, b]) => {
    if (a !== b) return selectedEnvs.includes(a) && selectedEnvs.includes(b);
    // Same-env combos require user is intermediate or advanced
    return selectedEnvs.includes(a) && intensity !== 'beginner';
  });

  const carts: GeneratedCart[] = [];
  const used = new Set<string>();
  const usedPairings = new Set<string>();
  const usedSessionTypes = new Set<SessionType>();

  // Cart A — combo (if eligible), else solo high
  if (validCombos.length > 0) {
    const combo = pickCombo(poolMain, poolBeginner, validCombos, used, usedPairings, false);
    if (combo) {
      combo.forEach(c => c.workout.session_type && usedSessionTypes.add(c.workout.session_type));
      carts.push(candidatesToCart(0, combo, intensity, moodCard, workoutType));
    }
  }
  if (carts.length === 0) {
    const solo = pickSolo(poolMain, 'high', used, usedSessionTypes);
    if (solo) carts.push(candidatesToCart(0, solo, intensity, moodCard, workoutType));
  }

  // Cart B — solo high
  const soloB = pickSolo(poolMain, 'high', used, usedSessionTypes);
  if (soloB) carts.push(candidatesToCart(carts.length, soloB, intensity, moodCard, workoutType));

  // Cart C — second combo (different pairing) if eligible & not beginner; else solo low
  let cartCAdded = false;
  if (validCombos.length >= 2 && intensity !== 'beginner') {
    const combo = pickCombo(poolMain, poolBeginner, validCombos, used, usedPairings, true);
    if (combo) {
      combo.forEach(c => c.workout.session_type && usedSessionTypes.add(c.workout.session_type));
      carts.push(candidatesToCart(carts.length, combo, intensity, moodCard, workoutType));
      cartCAdded = true;
    }
  }
  if (!cartCAdded) {
    const soloC = pickSolo(poolMain, 'low', used, usedSessionTypes);
    if (soloC) carts.push(candidatesToCart(carts.length, soloC, intensity, moodCard, workoutType));
  }

  return carts;
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
