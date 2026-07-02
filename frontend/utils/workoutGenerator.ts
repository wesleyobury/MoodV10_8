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
import { compoundLegsWorkoutDatabase } from '../data/compound-legs-workouts-data';
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
  TrainingStyle,
  ExerciseType,
  MovementPattern,
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
    exercise_type: workout.exercise_type,
    movement_pattern: workout.movement_pattern,
    training_style: workout.training_style,
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

// ============================================================================
// SWEAT — Build For Me v2 (coach-designed sessions, single flavor dropdown)
// ----------------------------------------------------------------------------
// Five fixed session flavors, surfaced (shuffled) via the single hero badge
// dropdown — same UX as the muscle-gainer path:
//   Cardio Only · Weights Only · Metcon · Machine Tour · Conditioning Circuit
//
// Each flavor is assembled by a COACH-STYLE session engine, not a naive slot
// fill. Real-coach guardrails:
//   • Duration budget  — total session minutes capped per tier, so we never
//     stack several long cardio pieces (advanced cardio runs up to ~35 min).
//   • Intensity budget — sum of intensity_cost capped per tier, plus a hard cap
//     on how many "peak" (max-effort) blocks a session may contain.
//   • Warm-up first    — the opener is the lowest-intensity block (prefers a
//     'primer'); intensity then ramps; an optional 'finisher' closes.
//   • Skill-appropriate — pools are tier-locked, so beginners never see
//     advanced-only work, and the budgets scale down for lower tiers.
//   • Graceful edge cases — if the pool can't fill a slot within budget the
//     session simply ends early (respecting a per-tier minimum), infeasible
//     flavors are dropped, and duplicates are never repeated within a cart.
// Selection uses weighted scoring + recent-exercise memory so re-rolls stay
// fresh, and equipment is varied within (and softly across) carts.
// ============================================================================

const SWEAT_MACHINE_CARDIO_EQUIP = new Set<string>([
  'Treadmill', 'Elliptical', 'Arm bicycle', 'Stationary bike', 'Assault bike',
  'Row machine', 'Stair master', 'Ski machine', 'Curve treadmill', 'Vertical Climber',
]);

type SweatPhase = 'warmup' | 'main' | 'finisher';
interface SweatSlot { modality: Modality; phase: SweatPhase }
type SweatPoolKind = 'cardio' | 'weights' | 'both' | 'machine_cardio';

const cSlot = (phase: SweatPhase): SweatSlot => ({ modality: 'cardio', phase });
const rSlot = (phase: SweatPhase): SweatSlot => ({ modality: 'resistance', phase });

interface SweatFlavorDef {
  id: string;
  label: string;
  badge: string;
  subtitle: string;
  poolKind: SweatPoolKind;
  requiresBoth?: boolean;             // needs both modalities present at tier
  plan: Record<IntensityLevel, SweatSlot[]>;  // ordered slot plan (engine trims to fit budgets)
}

export const SWEAT_FLAVORS: SweatFlavorDef[] = [
  {
    id: 'cardio_only', label: 'Cardio Only', badge: 'Conditioning',
    subtitle: 'Pure cardio, smartly paced', poolKind: 'cardio',
    plan: {
      beginner:     [cSlot('warmup'), cSlot('main')],
      intermediate: [cSlot('warmup'), cSlot('main'), cSlot('finisher')],
      advanced:     [cSlot('warmup'), cSlot('main'), cSlot('main'), cSlot('finisher')],
    },
  },
  {
    id: 'weights_only', label: 'Weights Only', badge: 'Resistance',
    subtitle: 'Light-weight strength circuit', poolKind: 'weights',
    plan: {
      beginner:     [rSlot('warmup'), rSlot('main')],
      intermediate: [rSlot('warmup'), rSlot('main'), rSlot('finisher')],
      advanced:     [rSlot('warmup'), rSlot('main'), rSlot('main'), rSlot('finisher')],
    },
  },
  {
    id: 'metcon', label: 'Metcon', badge: 'Mixed', requiresBoth: true,
    subtitle: 'Alternating cardio + weights', poolKind: 'both',
    plan: {
      beginner:     [cSlot('warmup'), rSlot('main'), cSlot('main')],
      intermediate: [cSlot('warmup'), rSlot('main'), cSlot('main'), rSlot('finisher')],
      advanced:     [cSlot('warmup'), rSlot('main'), cSlot('main'), rSlot('main'), cSlot('finisher')],
    },
  },
  {
    id: 'machine_tour', label: 'Machine Tour', badge: 'Machines',
    subtitle: 'A different machine each block', poolKind: 'machine_cardio',
    plan: {
      beginner:     [cSlot('warmup'), cSlot('main')],
      intermediate: [cSlot('warmup'), cSlot('main'), cSlot('main')],
      advanced:     [cSlot('warmup'), cSlot('main'), cSlot('main'), cSlot('finisher')],
    },
  },
  {
    id: 'conditioning', label: 'Conditioning Circuit', badge: 'Classic', requiresBoth: true,
    subtitle: 'Cardio, weights, cardio', poolKind: 'both',
    plan: {
      beginner:     [cSlot('warmup'), rSlot('main')],
      intermediate: [cSlot('warmup'), rSlot('main'), cSlot('finisher')],
      advanced:     [cSlot('warmup'), rSlot('main'), rSlot('main'), cSlot('finisher')],
    },
  },
];

// Coach guardrails per tier. Derived from the real pools: cardio pieces run
// ~10–20 min (beginner) up to ~15–35 min (advanced); light-weight pieces
// ~11–29 min. Budgets keep total volume and hard-effort count defensible.
interface SweatLimits {
  maxMinutes: number;   // total session duration cap
  costBudget: number;   // sum of intensity_cost cap
  maxBlocks: number;
  minBlocks: number;
  peakCost: number;     // intensity_cost at/above which a block counts as "peak"
  maxPeak: number;      // max peak blocks per session
}
const SWEAT_LIMITS: Record<IntensityLevel, SweatLimits> = {
  beginner:     { maxMinutes: 34, costBudget: 8,  maxBlocks: 3, minBlocks: 2, peakCost: 4, maxPeak: 1 },
  intermediate: { maxMinutes: 52, costBudget: 13, maxBlocks: 4, minBlocks: 2, peakCost: 4, maxPeak: 2 },
  advanced:     { maxMinutes: 70, costBudget: 17, maxBlocks: 5, minBlocks: 2, peakCost: 5, maxPeak: 3 },
};

function sweatPoolByKind(kind: SweatPoolKind, tier: IntensityLevel): TaggedCandidate[] {
  const all = buildSweatPool().filter(x => x.tier === tier && !!x.workout.modality);
  switch (kind) {
    case 'cardio':         return all.filter(x => x.workout.modality === 'cardio');
    case 'weights':        return all.filter(x => x.workout.modality === 'resistance');
    case 'machine_cardio': return all.filter(x => x.workout.modality === 'cardio' && SWEAT_MACHINE_CARDIO_EQUIP.has(x.equipment));
    case 'both':
    default:               return all;
  }
}

const sweatDur = (c: TaggedCandidate) => parseDuration(c.workout.duration);
const sweatCost = (c: TaggedCandidate) => c.workout.intensity_cost ?? 3;

// Per-phase intensity preference (soft — nudges, never hard-filters cost).
function sweatPhaseScore(cost: number, phase: SweatPhase): number {
  if (phase === 'warmup')   return (5 - cost) * 0.6;              // ease in
  if (phase === 'finisher') return (cost - 1) * 0.5;              // finish hot
  return (3.5 - Math.abs(cost - 3.5)) * 0.4;                      // main: mid–high
}

interface SweatBuildState {
  usedNames: Set<string>;
  usedEquip: Set<string>;
  minutes: number;
  cost: number;
  peaks: number;
  count: number;
}

// Pick one block for a slot, honoring duration / intensity / peak budgets.
function pickSweatBlock(
  pool: TaggedCandidate[],
  slot: SweatSlot,
  limits: SweatLimits,
  state: SweatBuildState,
  recentNames: Set<string>,
  usedXCart: Set<string>,
): TaggedCandidate | null {
  const cands = pool.filter(c =>
    c.workout.modality === slot.modality && !state.usedNames.has(c.workout.name),
  );
  if (cands.length === 0) return null;

  const belowMin = state.count < limits.minBlocks;

  // Hard fit: keep the session inside its duration + intensity + peak budgets.
  let fit = cands.filter(c =>
    state.minutes + sweatDur(c) <= limits.maxMinutes &&
    state.cost + sweatCost(c) <= limits.costBudget &&
    !(sweatCost(c) >= limits.peakCost && state.peaks >= limits.maxPeak),
  );
  if (fit.length === 0) {
    // Session is already full enough — stop adding blocks.
    if (!belowMin) return null;
    // Still under the minimum: we must place something. Take the lightest /
    // shortest options so we stay as defensible as possible.
    fit = [...cands]
      .sort((a, b) => (sweatDur(a) + sweatCost(a) * 3) - (sweatDur(b) + sweatCost(b) * 3))
      .slice(0, Math.min(4, cands.length));
  }

  const scored = fit.map(c => {
    let s = 1.0;
    s += sweatPhaseScore(sweatCost(c), slot.phase);
    if (slot.phase === 'warmup'   && c.workout.role === 'primer')     s += 1.5;
    if (slot.phase === 'main'     && c.workout.role === 'main_block') s += 0.6;
    if (slot.phase === 'finisher' && c.workout.role === 'finisher')   s += 1.5;
    s += state.usedEquip.has(c.equipment) ? -2.0 : 1.0;   // within-cart equipment variety
    if (usedXCart.has(c.equipment)) s -= 0.5;             // soft cross-cart variety
    if (recentNames.has(c.workout.name)) s -= 3.0;        // recent-exercise memory
    return { c, score: s };
  });

  const maxS = Math.max(...scored.map(x => x.score));
  const weights = scored.map(x => Math.exp((x.score - maxS) / 1.0));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < scored.length; i++) { r -= weights[i]; if (r <= 0) return scored[i].c; }
  return scored[scored.length - 1].c;
}

// Coach ordering: warm-up (easiest) first, ramp up, finisher last.
function coachOrderSweat(picks: TaggedCandidate[], flavor: SweatFlavorDef): TaggedCandidate[] {
  if (picks.length <= 1) return picks;
  if (flavor.poolKind !== 'both') {
    // Single-modality: a clean ascending ramp is the coach-sound structure.
    return [...picks].sort((a, b) => sweatCost(a) - sweatCost(b));
  }
  // Mixed flavors keep their planned cardio→weights alternation (that IS the
  // structure), but guarantee the opener is the lightest block as a warm-up.
  const out = [...picks];
  let minI = 0;
  for (let i = 1; i < out.length; i++) if (sweatCost(out[i]) < sweatCost(out[minI])) minI = i;
  if (minI !== 0) { const [b] = out.splice(minI, 1); out.unshift(b); }
  return out;
}

export interface SweatCart extends GeneratedCart {
  cartType: string;      // flavor id
  flavor: string;        // flavor label
  cartBadge: string;
  cartSubtitle: string;
}

export function generateSweatCartsV2(
  intensity: IntensityLevel,
  moodCard: string = 'Sweat / burn fat',
  recentExerciseNames: string[] = [],
): SweatCart[] {
  const limits = SWEAT_LIMITS[intensity];
  const recentNames = new Set(recentExerciseNames);
  const usedXCart = new Set<string>();

  // Feasible flavors: pool exists and (mixed flavors) both modalities present.
  const feasible = SWEAT_FLAVORS.filter(f => {
    const pool = sweatPoolByKind(f.poolKind, intensity);
    if (pool.length === 0) return false;
    if (f.requiresBoth &&
        !(pool.some(x => x.workout.modality === 'cardio') &&
          pool.some(x => x.workout.modality === 'resistance'))) return false;
    return true;
  });
  if (feasible.length === 0) return [];

  // Shuffle so the opening cart + order change each generation.
  const flavors = [...feasible];
  for (let i = flavors.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [flavors[i], flavors[j]] = [flavors[j], flavors[i]];
  }

  const carts: SweatCart[] = [];

  for (const flavor of flavors) {
    const pool = sweatPoolByKind(flavor.poolKind, intensity);
    const plan = flavor.plan[intensity];
    const state: SweatBuildState = {
      usedNames: new Set(), usedEquip: new Set(),
      minutes: 0, cost: 0, peaks: 0, count: 0,
    };
    const picks: TaggedCandidate[] = [];

    for (const slot of plan) {
      if (state.count >= limits.maxBlocks) break;
      const pick = pickSweatBlock(pool, slot, limits, state, recentNames, usedXCart);
      if (!pick) continue;
      picks.push(pick);
      state.usedNames.add(pick.workout.name);
      state.usedEquip.add(pick.equipment);
      state.minutes += sweatDur(pick);
      state.cost += sweatCost(pick);
      if (sweatCost(pick) >= limits.peakCost) state.peaks++;
      state.count++;
    }
    if (picks.length === 0) continue;

    const ordered = coachOrderSweat(picks, flavor);
    ordered.forEach(p => usedXCart.add(p.equipment));

    const items: WorkoutItem[] = ordered.map((p, i) => {
      const item = workoutToItem(p.workout, p.equipment, intensity, moodCard, flavor.label);
      // Phase role for the cart UI (Warm-Up / Main / Finisher labelling).
      item.role = i === 0 ? 'primer'
        : (i === ordered.length - 1 && ordered.length > 2 ? 'finisher' : 'main_block');
      return item;
    });
    const totalDuration = items.reduce((sum, it) => sum + parseDuration(it.duration), 0);

    carts.push({
      id: `sweat2-${flavor.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      workouts: items,
      totalDuration,
      intensity,
      cartType: flavor.id,
      flavor: flavor.label,
      cartBadge: flavor.badge,
      cartSubtitle: flavor.subtitle,
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

// Slot labels for each cart slot, in fixed slot order: BW → LW → Flex.
const EXPLOSIVE_SLOT_LABELS = ['Activation', 'Power', 'Bonus'] as const;

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

      cartsByFlavor.set(flavor, cart);
    }
    if (allFlavorsFilled && cartsByFlavor.size === 3) break;
  }

  // Reorder to canonical display: plyo → loaded → dynamic.
  // Slot order within a cart is fixed: BW (Activation) → LW (Power) → flex (Bonus).
  const carts: GeneratedCart[] = [];
  EXPLOSIVE_FLAVORS.forEach((flavor, idx) => {
    const cart = cartsByFlavor.get(flavor);
    if (!cart || cart.length === 0) return;
    const items: WorkoutItem[] = cart.map((c, slotIdx) => {
      const item = workoutToItem(c.workout, c.equipment, intensity, moodCard, workoutType);
      item.slot_label = EXPLOSIVE_SLOT_LABELS[slotIdx] || undefined;
      return item;
    });
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

// =============================================================================
// MUSCLE GAINER — generator v3 (full spec is the canonical doc the user
// provided in conversation; condensed here in inline comments + types):
//   - 8-cart library (Strength / Hypertrophy / Pump / Heavy Day / Builder Day /
//     Athletic Day / Express / Eccentric Focus) drawing 3 per generation
//   - Axis diversity (intensity / equipment / specialty) + last-2 rotation
//   - Volume floor of 2 per muscle, no total cap, 3+ trim drops to floor
//   - Ancillary cap of 2; Abs exempt and rendered last; ancillary-only / abs-only
//     edge cases promote first selection to primary treatment
//   - No cross-muscle equipment restriction
//   - Within-muscle pattern uniqueness is HARD when pool supports it
// =============================================================================

const PRIMARY_MUSCLE_GROUPS = [
  'Legs', 'Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings', 'Glutes', 'Calves'
];
const ANCILLARY_MUSCLE_GROUPS_NON_ABS = ['Biceps', 'Triceps'];
const LEG_SUB_GROUPS = ['Quads', 'Hamstrings', 'Glutes', 'Calves'];

// --- v3 cart library ---------------------------------------------------------
export type CartTypeId =
  | 'strength' | 'hypertrophy' | 'pump'
  | 'heavy_day' | 'builder_day' | 'athletic_day'
  | 'express' | 'eccentric_focus';

type CartAxis = 'intensity' | 'equipment' | 'specialty';

interface CartLibraryEntry {
  id: CartTypeId;
  axis: CartAxis;
  label: string;
}

export const MUSCLE_GAINER_CART_LIBRARY: CartLibraryEntry[] = [
  { id: 'strength',        axis: 'intensity',  label: 'Strength' },
  { id: 'hypertrophy',     axis: 'intensity',  label: 'Hypertrophy' },
  { id: 'pump',            axis: 'intensity',  label: 'Pump' },
  { id: 'heavy_day',       axis: 'equipment',  label: 'Heavy Day' },
  { id: 'builder_day',     axis: 'equipment',  label: 'Builder Day' },
  { id: 'athletic_day',    axis: 'equipment',  label: 'Athletic Day' },
  { id: 'express',         axis: 'specialty',  label: 'Express' },
  { id: 'eccentric_focus', axis: 'specialty',  label: 'Eccentric Focus' },
];

// User-facing display strings per cart type.
export const MUSCLE_GAINER_CART_DISPLAY: Record<CartTypeId, {
  title: string;
  badge: string;
  subtitle: string;
}> = {
  strength:        { title: 'Strength',        badge: 'Lift Heavy',         subtitle: 'Low reps, big compound work' },
  hypertrophy:     { title: 'Hypertrophy',     badge: 'Build Muscle',       subtitle: 'Classic muscle-building volume' },
  pump:            { title: 'Pump',            badge: 'Feel the Burn',      subtitle: 'High reps, drop sets, the squeeze' },
  heavy_day:       { title: 'Heavy Day',       badge: 'Powerlifting Style', subtitle: 'Barbell-led strength training' },
  builder_day:     { title: 'Builder Day',     badge: 'Bodybuilder Style',  subtitle: 'Machines + cables, classical hypertrophy' },
  athletic_day:    { title: 'Athletic Day',    badge: 'Athletic Style',     subtitle: 'Bodyweight + free weights, functional feel' },
  express:         { title: 'Express',         badge: 'Quick Hit',          subtitle: 'Max impact in minimum time' },
  eccentric_focus: { title: 'Eccentric Focus', badge: 'Slow & Strict',      subtitle: 'Tempo work, technique-focused' },
};

// Style preference (soft filter) per cart type.
const CART_STYLE_PREFERENCE: Record<CartTypeId, TrainingStyle[]> = {
  strength: ['strength'],
  hypertrophy: ['hypertrophy'],
  pump: ['pump'],
  heavy_day: ['strength'],
  builder_day: ['hypertrophy'],
  athletic_day: ['pump', 'mixed'],
  express: ['hypertrophy', 'strength'],
  eccentric_focus: ['strength'],
};

// Equipment bias (only for the 3 equipment-themed carts).
const CART_EQUIPMENT_BIAS: Partial<Record<CartTypeId, { primary: string[]; fallback: string[] }>> = {
  heavy_day: {
    primary: [
      'Powerlifting Platform', 'Barbell', 'Squat Rack', 'Trap Bar',
      'EZ Curl Bar', 'EZ bar', 'Hip Thruster Equipment',
      'Flat bench', 'Incline bench', 'Decline bench',
    ],
    fallback: [
      'Smith Machine', 'Smith machine', 'Hack Squat Machine',
      'Pit Shark', 'Pendulum Squat', 'Dumbbells', 'Dumbbell',
      'Kettlebells', 'Kettle bells', 'Kettle bell',
    ],
  },
  builder_day: {
    primary: [
      'Chest press machine', 'Pec dec machine', 'Cable crossover',
      'Lat pull down machine', 'T bar row machine', 'Seated cable machine',
      'Seated Chest Supported Row Machine', 'Cable Crossover Machine',
      'Cable Machine', 'Single Stack Cable Machine',
      'Single extension cable', 'Cable crossover machine',
      'Shoulder Press Machine', 'Smith Machine', 'Smith machine',
      'Rear Delt Fly Machine', 'Tricep pushdown machine',
      'Biceps Curl Machine', 'Preacher Curl Machine',
      'Leg Extension Machine', 'Leg Curl Machine',
      'Leg Press Machine', 'Hack Squat Machine', 'Pendulum Squat',
      'Pit Shark', 'Calf Raise Machine', 'Glute Kick Machine',
      'Hip Abductor Machine', 'Ab Crunch Machine',
    ],
    fallback: [
      'Adjustable Bench', 'Dumbbells', 'Dumbbell', 'Barbell',
      'Kettlebells', 'Kettle bells', 'Kettle bell',
    ],
  },
  athletic_day: {
    primary: [
      'Dumbbells', 'Dumbbell', 'Kettlebells', 'Kettle bells', 'Kettle bell',
      'Pull-Up Bar', 'Straight pull up bar', 'Grip variation pull up bar',
      'Dip station', 'Dip station / machine', 'Body Weight', "Captain's Chair",
      'Ab Roller', 'Medicine Ball', 'TRX bands', 'Roman Chair', 'Roman chair',
      'Roman Hyperextension', 'Hip Thruster Equipment', 'Landmine Attachment',
    ],
    fallback: [
      'Cable Machine', 'Cable crossover', 'Cable Crossover Machine',
      'Single Stack Cable Machine', 'Barbell', 'Single extension cable',
    ],
  },
};

const ECCENTRIC_KEYWORDS = [
  'Tempo', 'Pause', 'Paused', 'Slow', 'Eccentric',
  '1.5 Rep', '1½ Rep', 'Iso', 'Negative',
];

type FlavorWorkout = {
  workout: Workout;
  equipment: string;
  muscleGroup: string;
};

// Get all candidate workouts for a muscle group, scoped to selected tier.
function getMuscleGainerPool(muscle: string, tier: IntensityLevel): FlavorWorkout[] {
  let dbs: { db: EquipmentWorkouts[]; group: string }[] = [];

  if (muscle === 'Legs') {
    dbs.push({ db: compoundLegsWorkoutDatabase, group: 'Legs' });
    for (const sub of LEG_SUB_GROUPS) {
      const sub_db = muscleGroupDatabases[sub];
      if (sub_db) dbs.push({ db: sub_db, group: 'Legs' });
    }
  } else {
    const db = muscleGroupDatabases[muscle];
    if (db) dbs.push({ db, group: muscle });
  }

  const pool: FlavorWorkout[] = [];
  for (const { db, group } of dbs) {
    for (const eqData of db) {
      const tierWorkouts = eqData.workouts[tier] || [];
      for (const w of tierWorkouts) {
        pool.push({ workout: w, equipment: eqData.equipment, muscleGroup: group });
      }
    }
  }
  return pool;
}

// Sort selected muscles into session order: primaries (user order) → ancillaries → Abs last.
function sortMusclesForSession(selected: string[]): string[] {
  const primaries = selected.filter(m => PRIMARY_MUSCLE_GROUPS.includes(m));
  const ancillaries = selected.filter(m => ANCILLARY_MUSCLE_GROUPS_NON_ABS.includes(m));
  const abs = selected.includes('Abs') ? ['Abs'] : [];
  return [...primaries, ...ancillaries, ...abs];
}

// --- v3 role + count computation --------------------------------------------
type MuscleRole = 'primary' | 'ancillary' | 'abs';

function computeMuscleRoles(orderedMuscles: string[]): Record<string, MuscleRole> {
  const roles: Record<string, MuscleRole> = {};
  const hasPrimary = orderedMuscles.some(m => PRIMARY_MUSCLE_GROUPS.includes(m));
  const firstAncillary = orderedMuscles.find(m => ANCILLARY_MUSCLE_GROUPS_NON_ABS.includes(m));

  for (const m of orderedMuscles) {
    if (m === 'Abs') {
      // Abs-only edge case: promote to primary
      roles[m] = orderedMuscles.length === 1 ? 'primary' : 'abs';
    } else if (ANCILLARY_MUSCLE_GROUPS_NON_ABS.includes(m)) {
      // Ancillary-only edge case: first ancillary becomes primary
      roles[m] = (!hasPrimary && m === firstAncillary) ? 'primary' : 'ancillary';
    } else {
      roles[m] = 'primary';
    }
  }
  return roles;
}

// Per-cart, per-tier primary count templates (v3 spec, "Per-muscle exercise count by cart type" table).
const PRIMARY_COUNTS_V3: Record<CartTypeId, Record<IntensityLevel, number>> = {
  strength:        { beginner: 2, intermediate: 2, advanced: 2 },
  hypertrophy:     { beginner: 2, intermediate: 3, advanced: 3 },
  pump:            { beginner: 3, intermediate: 3, advanced: 4 },
  heavy_day:       { beginner: 2, intermediate: 2, advanced: 2 },
  builder_day:     { beginner: 2, intermediate: 3, advanced: 3 },
  athletic_day:    { beginner: 3, intermediate: 3, advanced: 4 },
  express:         { beginner: 2, intermediate: 2, advanced: 2 },
  eccentric_focus: { beginner: 2, intermediate: 2, advanced: 2 },
};
const ANCILLARY_COUNT_V3 = 2;
const ABS_COUNT_V3: Record<IntensityLevel, number> = { beginner: 2, intermediate: 3, advanced: 3 };
const FLOOR_V3 = 2;

// (E) Structural jitter. Primary muscle counts may bump +1 (within a tier cap)
// some of the time so the NUMBER of exercises and the slot shape visibly change
// between carts and between generations. Bumping the count auto-selects a longer
// slot plan in SLOT_PLANS_V3 (e.g. 2 → 3 adds an isolation slot), so structure
// changes for free. Jitter never applies under the 3+ muscle trim (keeps the
// volume floor intact) and never to ancillary/abs slots.
const PRIMARY_COUNT_CAP: Record<IntensityLevel, number> = { beginner: 3, intermediate: 4, advanced: 4 };
const JITTER_BUMP_CHANCE = 0.4;

function computeTargetCountsV3(
  orderedMuscles: string[],
  roles: Record<string, MuscleRole>,
  tier: IntensityLevel,
  cartType: CartTypeId
): Record<string, number> {
  const nonAbsCount = orderedMuscles.filter(m => roles[m] !== 'abs').length;
  const apply3PlusTrim = nonAbsCount >= 3;

  const counts: Record<string, number> = {};
  for (const m of orderedMuscles) {
    const role = roles[m];
    if (role === 'abs') {
      counts[m] = ABS_COUNT_V3[tier]; // exempt from 3+ trim
      continue;
    }
    if (apply3PlusTrim) {
      counts[m] = FLOOR_V3; // trim mode: hold the floor, no jitter
      continue;
    }
    if (role === 'ancillary') {
      counts[m] = ANCILLARY_COUNT_V3; // ancillaries stay fixed
      continue;
    }
    // Primary muscle: base count with occasional +1 structural jitter.
    let count = PRIMARY_COUNTS_V3[cartType][tier];
    if (Math.random() < JITTER_BUMP_CHANCE) {
      count = Math.min(count + 1, PRIMARY_COUNT_CAP[tier]);
    }
    counts[m] = count;
  }
  return counts;
}

// --- v3 cart-type selection (axis diversity + recently-seen rotation) -------
function isCartFeasible(
  cartType: CartTypeId,
  selectedMuscles: string[],
  tier: IntensityLevel
): boolean {
  // Lightweight feasibility: each non-abs selected muscle must have ≥2 workouts at tier
  // matching the cart's bias OR fallback OR pool. We only fail equipment carts when the
  // primary+fallback bias yields <2 workouts at tier for any selected muscle.
  const bias = CART_EQUIPMENT_BIAS[cartType];
  for (const muscle of selectedMuscles) {
    const pool = getMuscleGainerPool(muscle, tier);
    if (pool.length < FLOOR_V3) return false; // can't even hit floor
    if (bias) {
      const allowed = new Set([...bias.primary, ...bias.fallback]);
      const matches = pool.filter(p => allowed.has(p.equipment)).length;
      if (matches < 1) return false; // equipment cart needs at least 1 match per muscle
    }
    if (cartType === 'eccentric_focus') {
      const eccMatches = pool.filter(p =>
        ECCENTRIC_KEYWORDS.some(k => p.workout.name.includes(k)) ||
        p.workout.training_style === 'strength'
      ).length;
      if (eccMatches < 1) return false;
    }
  }
  return true;
}

// v4: surface EVERY feasible cart type, in a fresh random order each generation,
// so the user can scroll the whole library (up to all 8) instead of just 3.
// Variety between generations now comes from (a) the shuffled order and (b) the
// exercise-level scoring/memory that refills each cart differently every time.
//
// `recentlySeen` is used only as a light touch to avoid opening on the same cart
// type two generations in a row — it no longer restricts which carts appear.
export function selectCartTypes(
  selectedMuscles: string[],
  tier: IntensityLevel,
  recentlySeen: CartTypeId[]
): CartTypeId[] {
  const feasible = MUSCLE_GAINER_CART_LIBRARY.filter(c =>
    isCartFeasible(c.id, selectedMuscles, tier)
  );
  if (feasible.length === 0) return [];

  // Fisher–Yates shuffle of all feasible cart types.
  const shuffled = [...feasible];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Light anti-repeat: if we'd open on the same cart shown first last time and we
  // have an alternative, rotate the opener so the first card feels new.
  const lastOpener = recentlySeen[0];
  if (lastOpener && shuffled.length > 1 && shuffled[0].id === lastOpener) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }

  return shuffled.map(c => c.id);
}

// --- v3 slot plans + pool filtering ----------------------------------------
// SLOT_PLANS[cartType][target] = ordered list of slot specs.
// Slot specs: 'compound' | 'compound_diff' | 'isolation' | 'isolation_diff' | 'finisher'
type SlotSpec = 'compound' | 'compound_diff' | 'isolation' | 'isolation_diff' | 'finisher';

const SLOT_PLANS_V3: Record<CartTypeId, Record<number, SlotSpec[]>> = {
  strength: {
    2: ['compound', 'compound_diff'],
    3: ['compound', 'compound_diff', 'isolation'],
    4: ['compound', 'compound_diff', 'isolation', 'isolation_diff'],
  },
  heavy_day: {
    2: ['compound', 'compound_diff'],
    3: ['compound', 'compound_diff', 'isolation'],
    4: ['compound', 'compound_diff', 'isolation', 'isolation_diff'],
  },
  hypertrophy: {
    2: ['compound', 'isolation'],
    3: ['compound', 'isolation', 'isolation_diff'],
    4: ['compound', 'isolation', 'isolation_diff', 'finisher'],
  },
  builder_day: {
    2: ['compound', 'isolation'],
    3: ['compound', 'isolation', 'isolation_diff'],
    4: ['compound', 'isolation', 'isolation_diff', 'finisher'],
  },
  pump: {
    2: ['compound', 'isolation'],
    3: ['compound', 'isolation', 'finisher'],
    4: ['compound', 'isolation', 'isolation_diff', 'finisher'],
  },
  athletic_day: {
    2: ['compound', 'isolation'],
    3: ['compound', 'isolation', 'finisher'],
    4: ['compound', 'isolation', 'isolation_diff', 'finisher'],
  },
  express: {
    2: ['compound', 'compound_diff'],
    3: ['compound', 'compound_diff', 'isolation'],
    4: ['compound', 'compound_diff', 'isolation', 'isolation_diff'],
  },
  eccentric_focus: {
    2: ['compound', 'compound_diff'],
    3: ['compound', 'compound_diff', 'isolation'],
    4: ['compound', 'compound_diff', 'isolation', 'isolation_diff'],
  },
};

// ---------------------------------------------------------------------------
// v4 VARIETY ENGINE — weighted scoring instead of hard filters.
// Every candidate stays reachable; preferences become score nudges so the
// random pick samples the WHOLE pool (weighted), not a pre-collapsed survivor
// set. This is what unlocks the full ~36-exercise pool the old chain hid.
// ---------------------------------------------------------------------------

// Per-cart mutable budget for "off-theme" equipment picks (equipment-themed
// carts only). Capped at 1 so Builder/Athletic/Heavy stay recognizable while
// still occasionally reaching beyond their core gear.
interface OffThemeBudget { remaining: number }

// Tunable score weights. Positive = more likely; negative = less likely.
const SCORE = {
  styleMatch: 2.0,        // training_style matches the cart's preference
  typeMatch: 2.5,         // exercise_type matches the slot (compound/isolation)
  finisherPump: 2.0,      // pump-style workout in a finisher slot
  eqPrimary: 2.2,         // equipment in the cart theme's primary list
  eqFallback: 1.0,        // equipment in the theme's fallback list
  eccentricKw: 2.5,       // eccentric keyword for the eccentric_focus cart
  freshPattern: 1.2,      // movement_pattern not yet used in this section
  stalePattern: -1.5,     // movement_pattern already used in this section
  freshEquip: 0.8,        // equipment not yet used in this section
  staleEquip: -1.0,       // equipment already used in this section
  recentSeen: -3.0,       // exercise shown in the last N generations (memory)
};
const SOFTMAX_TEMP = 1.0; // higher = flatter (more random); lower = greedier

function isOnTheme(c: FlavorWorkout, cartType: CartTypeId): boolean {
  const bias = CART_EQUIPMENT_BIAS[cartType];
  if (!bias) return true; // non-equipment carts: everything is on-theme
  return bias.primary.includes(c.equipment) || bias.fallback.includes(c.equipment);
}

function scoreCandidate(
  c: FlavorWorkout,
  cartType: CartTypeId,
  slot: SlotSpec,
  usedEquipment: Set<string>,
  usedPatterns: Set<MovementPattern>,
  recentNames: Set<string>,
): number {
  let s = 1.0;

  // Style preference (soft, was a hard cut)
  const stylePrefs = CART_STYLE_PREFERENCE[cartType];
  if (c.workout.training_style && stylePrefs.includes(c.workout.training_style)) {
    s += SCORE.styleMatch;
  }

  // Slot exercise_type match (soft, was a hard cut)
  const wantCompound = slot === 'compound' || slot === 'compound_diff';
  const wantIso = slot === 'isolation' || slot === 'isolation_diff';
  if (wantCompound && c.workout.exercise_type === 'compound') s += SCORE.typeMatch;
  if (wantIso && c.workout.exercise_type === 'isolation') s += SCORE.typeMatch;
  if (slot === 'finisher' && c.workout.training_style === 'pump') s += SCORE.finisherPump;

  // Equipment theme (soft, was a hard gate). Off-theme gets no boost but stays in.
  const bias = CART_EQUIPMENT_BIAS[cartType];
  if (bias) {
    if (bias.primary.includes(c.equipment)) s += SCORE.eqPrimary;
    else if (bias.fallback.includes(c.equipment)) s += SCORE.eqFallback;
  }

  // Eccentric keyword nudge for the eccentric cart
  if (cartType === 'eccentric_focus' &&
      ECCENTRIC_KEYWORDS.some(k => c.workout.name.includes(k))) {
    s += SCORE.eccentricKw;
  }

  // Movement-pattern uniqueness (soft, was hard return-null). Thin pools relax
  // naturally because everything still gets a (lower) score.
  const mp = c.workout.movement_pattern as MovementPattern | undefined;
  if (mp) s += usedPatterns.has(mp) ? SCORE.stalePattern : SCORE.freshPattern;

  // Equipment uniqueness within the section (soft)
  s += usedEquipment.has(c.equipment) ? SCORE.staleEquip : SCORE.freshEquip;

  // Recent-exercise memory: strongly down-weight anything seen recently.
  if (recentNames.has(c.workout.name)) s += SCORE.recentSeen;

  return s;
}

// Weighted (softmax) sample over scored candidates — every candidate is
// reachable, higher scores just more likely.
function weightedPick(scored: { c: FlavorWorkout; score: number }[]): FlavorWorkout {
  const maxS = Math.max(...scored.map(x => x.score));
  const weights = scored.map(x => Math.exp((x.score - maxS) / SOFTMAX_TEMP));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < scored.length; i++) {
    r -= weights[i];
    if (r <= 0) return scored[i].c;
  }
  return scored[scored.length - 1].c;
}

function pickFromCandidates(
  pool: FlavorWorkout[],
  cartType: CartTypeId,
  slot: SlotSpec,
  excludeIds: Set<string>,
  usedEquipment: Set<string>,
  usedPatterns: Set<MovementPattern>,
  recentNames: Set<string>,
  offThemeBudget: OffThemeBudget,
): FlavorWorkout | null {
  // Hard constraint kept: never repeat an exercise already in this cart.
  let candidates = pool.filter(c => !excludeIds.has(c.workout.name));
  if (candidates.length === 0) return null;

  // Off-theme budget: only restrict to on-theme gear once the budget is spent,
  // and only for equipment-themed carts (and only if on-theme options exist).
  const bias = CART_EQUIPMENT_BIAS[cartType];
  if (bias && offThemeBudget.remaining <= 0) {
    const onTheme = candidates.filter(c => isOnTheme(c, cartType));
    if (onTheme.length > 0) candidates = onTheme;
  }

  const scored = candidates.map(c => ({
    c,
    score: scoreCandidate(c, cartType, slot, usedEquipment, usedPatterns, recentNames),
  }));
  const pick = weightedPick(scored);

  // Spend the off-theme budget if this pick reached outside the theme.
  if (bias && !isOnTheme(pick, cartType)) {
    offThemeBudget.remaining -= 1;
  }
  return pick;
}

// --- v3 leg-section picker (cart-type aware) -------------------------------
function getLegSubGroup(item: FlavorWorkout): string {
  const eq = item.equipment.toLowerCase();
  if (eq.includes('calf')) return 'Calves';
  if (eq.includes('hip thruster') || eq.includes('glute kick') ||
      eq.includes('hip abductor')) return 'Glutes';
  if (eq.includes('leg curl') || eq.includes('leg-curl')) return 'Hamstrings';
  if (eq.includes('leg extension')) return 'Quads';
  const mp = item.workout.movement_pattern;
  if (mp === 'calf_raise') return 'Calves';
  if (mp === 'leg_curl' || mp === 'hyperextension') return 'Hamstrings';
  if (mp === 'leg_extension') return 'Quads';
  if (mp === 'kickback' || mp === 'hip_thrust' || mp === 'hip_abduction') return 'Glutes';
  return 'Other';
}

function pickLegSection(
  tier: IntensityLevel,
  target: number,
  cartType: CartTypeId,
  excludeIds: Set<string>,
  recentNames: Set<string>,
  offThemeBudget: OffThemeBudget,
): FlavorWorkout[] {
  // Compounds come from compound-legs DB (+ sub-file compounds like barbell squats from quads)
  const compoundPool: FlavorWorkout[] = [];
  for (const eqData of compoundLegsWorkoutDatabase) {
    for (const w of (eqData.workouts[tier] || [])) {
      compoundPool.push({ workout: w, equipment: eqData.equipment, muscleGroup: 'Legs' });
    }
  }
  const isoPool: FlavorWorkout[] = [];
  for (const sub of LEG_SUB_GROUPS) {
    const subDb = muscleGroupDatabases[sub] || [];
    for (const eqData of subDb) {
      for (const w of (eqData.workouts[tier] || [])) {
        if (w.exercise_type === 'isolation') {
          isoPool.push({ workout: w, equipment: eqData.equipment, muscleGroup: 'Legs' });
        } else if (w.exercise_type === 'compound') {
          compoundPool.push({ workout: w, equipment: eqData.equipment, muscleGroup: 'Legs' });
        }
      }
    }
  }

  const slotPlan = SLOT_PLANS_V3[cartType][target] ||
                   SLOT_PLANS_V3[cartType][2];
  const section: FlavorWorkout[] = [];
  const usedEq = new Set<string>();
  const usedPat = new Set<MovementPattern>();
  const usedSubs = new Set<string>();

  for (const slot of slotPlan) {
    const isCompoundSlot = slot === 'compound' || slot === 'compound_diff';
    let pool = isCompoundSlot ? compoundPool : isoPool;
    // Prefer different sub-group when picking isolations
    if (!isCompoundSlot && pool.length > 0) {
      const fresh = pool.filter(p => !usedSubs.has(getLegSubGroup(p)));
      if (fresh.length > 0) pool = fresh;
    }
    let pick = pickFromCandidates(pool, cartType, slot, excludeIds, usedEq, usedPat, recentNames, offThemeBudget);
    // If isolation slot empty, fall back to compound-diff
    if (!pick && !isCompoundSlot) {
      pick = pickFromCandidates(compoundPool, cartType, 'compound_diff', excludeIds, usedEq, usedPat, recentNames, offThemeBudget);
    }
    if (!pick) continue;
    section.push(pick);
    excludeIds.add(pick.workout.name);
    usedEq.add(pick.equipment);
    if (pick.workout.movement_pattern)
      usedPat.add(pick.workout.movement_pattern as MovementPattern);
    usedSubs.add(getLegSubGroup(pick));
  }
  return section;
}

// --- v3 single-muscle picker (cart-type aware, slot-plan-driven) -----------
function pickMuscleSection(
  muscle: string,
  tier: IntensityLevel,
  target: number,
  cartType: CartTypeId,
  excludeIds: Set<string>,
  recentNames: Set<string>,
  offThemeBudget: OffThemeBudget,
): FlavorWorkout[] {
  if (muscle === 'Legs' && target >= 2) {
    return pickLegSection(tier, target, cartType, excludeIds, recentNames, offThemeBudget);
  }

  const pool = getMuscleGainerPool(muscle, tier);
  if (target <= 0 || pool.length === 0) return [];

  const slotPlan = SLOT_PLANS_V3[cartType][target] ||
                   SLOT_PLANS_V3[cartType][2] ||
                   ['compound', 'compound_diff'];

  const section: FlavorWorkout[] = [];
  const usedEq = new Set<string>();
  const usedPat = new Set<MovementPattern>();

  for (const slot of slotPlan) {
    // With weighted scoring the picker fills the slot from the whole pool, so a
    // single call suffices; the fallbacks below only matter if the pool is
    // exhausted by excludeIds.
    let pick = pickFromCandidates(pool, cartType, slot, excludeIds, usedEq, usedPat, recentNames, offThemeBudget);
    if (!pick && (slot === 'isolation' || slot === 'isolation_diff')) {
      pick = pickFromCandidates(pool, cartType, 'compound_diff', excludeIds, usedEq, usedPat, recentNames, offThemeBudget);
    }
    if (!pick && slot === 'compound_diff') {
      pick = pickFromCandidates(pool, cartType, 'compound', excludeIds, usedEq, usedPat, recentNames, offThemeBudget);
    }
    if (!pick) continue;

    section.push(pick);
    excludeIds.add(pick.workout.name);
    usedEq.add(pick.equipment);
    if (pick.workout.movement_pattern)
      usedPat.add(pick.workout.movement_pattern as MovementPattern);
  }

  // Reorder: compounds first, isolations last (preserve relative order otherwise).
  const compounds = section.filter(s => s.workout.exercise_type === 'compound');
  const isolations = section.filter(s => s.workout.exercise_type !== 'compound');
  return [...compounds, ...isolations];
}

// --- v3 public entry --------------------------------------------------------
export interface MuscleGainerCart {
  id: string;
  cartType: CartTypeId;
  workouts: WorkoutItem[];
  totalDuration: number;
  intensity: IntensityLevel;
  /** Display title (cart identity name). Mirrors the title in MUSCLE_GAINER_CART_DISPLAY. */
  flavor: string;
  /** 1-3 word descriptor for badge. */
  cartBadge: string;
  /** One-line subtitle below the title. */
  cartSubtitle: string;
}

export function generateMuscleGainerCarts(
  intensity: IntensityLevel,
  selectedMuscleGroups: string[] = [],
  moodCard: string = 'I want to gain muscle',
  workoutType: string = 'Muscle Building',
  recentlySeenCartTypes: CartTypeId[] = [],
  /** (B) Exercise names shown in the last N generations — strongly down-weighted
   *  so re-rolling the same selection surfaces visibly fresh exercises. Flat list
   *  across muscles; exercise names are globally unique so no per-muscle keying. */
  recentExerciseNames: string[] = [],
): MuscleGainerCart[] {
  if (selectedMuscleGroups.length === 0) return [];

  const orderedMuscles = sortMusclesForSession(selectedMuscleGroups);
  const roles = computeMuscleRoles(orderedMuscles);
  const cartTypes = selectCartTypes(orderedMuscles, intensity, recentlySeenCartTypes);
  const recentNames = new Set(recentExerciseNames);

  const carts: MuscleGainerCart[] = [];

  cartTypes.forEach((cartType, cartIdx) => {
    const targetCounts = computeTargetCountsV3(orderedMuscles, roles, intensity, cartType);
    const sections: FlavorWorkout[] = [];
    const excludeIds = new Set<string>();
    // (C) One off-theme equipment pick allowed per cart, shared across muscles.
    const offThemeBudget: OffThemeBudget = { remaining: 1 };

    for (const muscle of orderedMuscles) {
      const tgt = targetCounts[muscle];
      if (tgt <= 0) continue;
      const section = pickMuscleSection(muscle, intensity, tgt, cartType, excludeIds, recentNames, offThemeBudget);
      sections.push(...section);
    }

    if (sections.length === 0) return;

    const items = sections.map(s => {
      // Legs carry their sub-group (Quads / Hamstrings / Glutes / Calves /
      // Compound) so the cart & generated views can render sub-dividers
      // within the LEGS block.
      let groupLabel = s.muscleGroup;
      if (s.muscleGroup === 'Legs') {
        const sub = getLegSubGroup(s);
        groupLabel = `Legs - ${sub === 'Other' ? 'Compound' : sub}`;
      }
      return workoutToItem(s.workout, s.equipment, intensity, moodCard,
        `${workoutType} - ${groupLabel}`);
    });
    const totalDuration = items.reduce(
      (sum, it) => sum + parseDuration(it.duration), 0
    );
    const display = MUSCLE_GAINER_CART_DISPLAY[cartType];

    carts.push({
      id: `cart-mg-${cartIdx + 1}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      cartType,
      workouts: items,
      totalDuration,
      intensity,
      flavor: display.title,
      cartBadge: display.badge,
      cartSubtitle: display.subtitle,
    });
  });

  return carts;
}

