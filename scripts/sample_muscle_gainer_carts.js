#!/usr/bin/env node
/**
 * Print a few sample muscle gainer carts so we can eyeball that the output
 * matches expectations.
 */
const { generateMuscleGainerCarts } = require('/app/frontend/utils/workoutGenerator');

function show(label, tier, muscles) {
  console.log('\n' + '='.repeat(72));
  console.log(`${label}  •  tier=${tier}  •  muscles=[${muscles.join(', ')}]`);
  console.log('='.repeat(72));
  const carts = generateMuscleGainerCarts(tier, muscles);
  carts.forEach((c, i) => {
    console.log(`\nCart ${i + 1} — ${c.flavor}  (total ~${c.totalDuration} min, ${c.workouts.length} ex)`);
    c.workouts.forEach((w, j) => {
      const style = w.training_style || '—';
      const et = w.exercise_type || '—';
      const mp = w.movement_pattern || '—';
      const mg = (w.workoutType || '').split(' - ').pop();
      console.log(`  ${j + 1}. [${mg}] ${w.name}`);
      console.log(`         eq=${w.equipment}  type=${et}  pattern=${mp}  style=${style}`);
    });
  });
}

show('Solo Chest', 'intermediate', ['Chest']);
show('Push Day', 'advanced', ['Chest', 'Shoulders', 'Triceps']);
show('Legs Only', 'intermediate', ['Legs']);
show('Legs + Abs', 'advanced', ['Legs', 'Abs']);
show('5-muscle full upper', 'beginner', ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps']);
