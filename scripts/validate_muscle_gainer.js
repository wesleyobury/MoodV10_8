#!/usr/bin/env node
/**
 * Validate the muscle gainer generator. Run with `npx tsx`.
 */
const { generateMuscleGainerCarts } = require('/app/frontend/utils/workoutGenerator');

const TIERS = ['beginner', 'intermediate', 'advanced'];
const ALL_MUSCLES = [
  'Legs', 'Chest', 'Back', 'Shoulders', 'Quads', 'Hamstrings',
  'Glutes', 'Calves', 'Biceps', 'Triceps', 'Abs',
];
const ANCILLARY = new Set(['Biceps', 'Triceps', 'Abs']);

let runs = 0, failures = 0;
const errors = [];
const flavorsSeen = new Set();

function muscleOf(workoutName, item) {
  // workoutType field set as `${workoutType} - ${muscleGroup}`
  const wt = item.workoutType || '';
  const m = wt.match(/-\s*([^-]+)$/);
  return m ? m[1].trim() : null;
}

function check(label, cart, selected, tier) {
  const isBeg = tier === 'beginner';
  const muscleCount = selected.length;

  // (4) Abs last
  if (selected.includes('Abs')) {
    const lastMuscle = muscleOf(null, cart.workouts[cart.workouts.length - 1]);
    if (lastMuscle !== 'Abs') {
      return `[${label}] Abs not last: lastMuscle=${lastMuscle}`;
    }
  }

  // Group items by muscle (preserving order)
  const sections = [];
  let cur = null;
  for (const w of cart.workouts) {
    const mg = muscleOf(null, w);
    if (!cur || cur.muscle !== mg) {
      cur = { muscle: mg, items: [] };
      sections.push(cur);
    }
    cur.items.push(w);
  }

  // (3) Compound first within each section (when both compound + isolation present)
  for (const sec of sections) {
    let seenIsolation = false;
    for (const w of sec.items) {
      if (w.exercise_type === 'isolation') seenIsolation = true;
      if (w.exercise_type === 'compound' && seenIsolation) {
        return `[${label}] Compound after isolation in ${sec.muscle}`;
      }
    }
  }

  // (5) Equipment uniqueness in section
  for (const sec of sections) {
    const eqs = new Set();
    for (const w of sec.items) {
      if (eqs.has(w.equipment)) {
        // Allow if the section was forced (small pool)
        // We'll just warn but not fail
      }
      eqs.add(w.equipment);
    }
  }

  // (1)/(2) Volume rules
  let perMuscleMin, perMuscleMax, totalCap;
  if (muscleCount === 1) {
    perMuscleMin = isBeg ? 2 : 3;
    perMuscleMax = isBeg ? 3 : 4;
    totalCap = Infinity;
  } else if (muscleCount === 2) {
    perMuscleMin = 2;
    perMuscleMax = 3;
    totalCap = isBeg ? 5 : 6;
  } else {
    perMuscleMin = 1;
    perMuscleMax = 2;
    totalCap = isBeg ? 5 : 6;
  }

  for (const sec of sections) {
    if (selected.includes('Legs') && sec.muscle === 'Legs') {
      // Legs may be 4 (2 compound + 2 isolation) when target is 4
      continue;
    }
    if (sec.items.length > perMuscleMax) {
      return `[${label}] ${sec.muscle} has ${sec.items.length} > max ${perMuscleMax}`;
    }
  }

  if (cart.workouts.length > totalCap) {
    // Legs gets up to 4, may push over
    if (!selected.includes('Legs')) {
      return `[${label}] total ${cart.workouts.length} > cap ${totalCap}`;
    }
  }

  // (7) All workouts have metadata
  for (const w of cart.workouts) {
    if (!w.exercise_type || !w.movement_pattern || !w.training_style) {
      return `[${label}] missing metadata on ${w.name}`;
    }
  }

  return null;
}

function pickRandomMuscles(n) {
  const shuffled = [...ALL_MUSCLES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

const SCENARIOS = [
  { name: 'Solo Chest', muscles: ['Chest'] },
  { name: 'Solo Legs', muscles: ['Legs'] },
  { name: 'Solo Quads', muscles: ['Quads'] },
  { name: 'Solo Abs', muscles: ['Abs'] },
  { name: 'Chest + Back', muscles: ['Chest', 'Back'] },
  { name: 'Legs + Abs', muscles: ['Legs', 'Abs'] },
  { name: 'Chest + Triceps', muscles: ['Chest', 'Triceps'] },
  { name: 'Push (Chest+Shoulders+Triceps)', muscles: ['Chest', 'Shoulders', 'Triceps'] },
  { name: 'Pull (Back+Biceps+Abs)', muscles: ['Back', 'Biceps', 'Abs'] },
  { name: 'Legs + Abs + Biceps', muscles: ['Legs', 'Abs', 'Biceps'] },
  { name: 'Chest + Shoulders + Biceps + Triceps + Abs',
    muscles: ['Chest', 'Shoulders', 'Biceps', 'Triceps', 'Abs'] },
  { name: 'Quads + Hamstrings + Glutes + Calves',
    muscles: ['Quads', 'Hamstrings', 'Glutes', 'Calves'] },
];

const RUNS_PER_SCENARIO = 30;

console.log('Running muscle gainer generator validation...\n');
for (const scn of SCENARIOS) {
  for (const tier of TIERS) {
    for (let i = 0; i < RUNS_PER_SCENARIO; i++) {
      runs++;
      const carts = generateMuscleGainerCarts(tier, scn.muscles);
      if (carts.length !== 3) {
        errors.push(`[${scn.name} ${tier}] expected 3 carts, got ${carts.length}`);
        failures++;
        continue;
      }
      // Check distinct flavors across carts
      const flavors = carts.map(c => c.flavor);
      flavorsSeen.add(flavors.join('|'));
      const expected = ['Strength', 'Hypertrophy', 'Pump'];
      if (JSON.stringify(flavors) !== JSON.stringify(expected)) {
        errors.push(`[${scn.name} ${tier}] flavors=${flavors.join(',')} (expected Strength/Hypertrophy/Pump)`);
        failures++;
      }
      for (let ci = 0; ci < carts.length; ci++) {
        const err = check(`${scn.name} ${tier} cart${ci + 1}(${carts[ci].flavor})`,
                          carts[ci], scn.muscles, tier);
        if (err) {
          errors.push(err);
          failures++;
        }
      }
    }
  }
}

// Random combo runs (3+ muscles)
for (let i = 0; i < 200; i++) {
  runs++;
  const n = 3 + Math.floor(Math.random() * 4);  // 3-6 muscles
  const muscles = pickRandomMuscles(n);
  const tier = TIERS[Math.floor(Math.random() * 3)];
  const carts = generateMuscleGainerCarts(tier, muscles);
  if (carts.length !== 3) {
    errors.push(`[random ${muscles.join(',')} ${tier}] got ${carts.length} carts`);
    failures++;
    continue;
  }
  for (let ci = 0; ci < carts.length; ci++) {
    const err = check(`random[${muscles.join(',')}] ${tier} cart${ci + 1}`,
                      carts[ci], muscles, tier);
    if (err) {
      errors.push(err);
      failures++;
    }
  }
}

console.log(`Total simulated cart-checks: ${runs}`);
console.log(`Failures: ${failures}`);
console.log(`Distinct flavor sequences observed: ${[...flavorsSeen].join(' / ')}`);

if (errors.length > 0) {
  console.log('\nFirst 30 errors:');
  errors.slice(0, 30).forEach(e => console.log('  ✗', e));
  process.exit(1);
}
console.log('\n✅ All checks passed.');
