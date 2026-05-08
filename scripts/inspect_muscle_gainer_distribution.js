#!/usr/bin/env node
/**
 * Inspect compound/isolation distribution per muscle in muscle gainer carts.
 * Verifies the new rotation logic: shouldn't always have isolation when not needed,
 * AND should still mix when both pools are deep.
 */
const { generateMuscleGainerCarts } = require('/app/frontend/utils/workoutGenerator');

const TIERS = ['beginner', 'intermediate', 'advanced'];
const SCENARIOS = [
  { muscles: ['Back'], label: 'Back only (shallow isolation pool)' },
  { muscles: ['Chest'], label: 'Chest only' },
  { muscles: ['Shoulders'], label: 'Shoulders only' },
  { muscles: ['Back', 'Biceps'], label: 'Back + Biceps' },
  { muscles: ['Chest', 'Triceps'], label: 'Chest + Triceps' },
  { muscles: ['Back', 'Chest', 'Biceps'], label: 'Back + Chest + Biceps' },
];

console.log('Compound/Isolation distribution per scenario × tier (50 runs each)\n');

for (const sc of SCENARIOS) {
  for (const tier of TIERS) {
    const dist = {}; // muscle -> {compound, isolation, total}
    for (let i = 0; i < 50; i++) {
      const carts = generateMuscleGainerCarts(tier, sc.muscles);
      for (const cart of carts) {
        for (const item of cart.workouts) {
          const wt = item.workoutType || '';
          const m = wt.match(/-\s*([^-]+)$/);
          const muscle = m ? m[1].trim() : 'Unknown';
          if (!dist[muscle]) dist[muscle] = { compound: 0, isolation: 0, total: 0 };
          // The exercise_type isn't stored on the cart item directly; check the workout.
          const isIso = item.exercise_type === 'isolation' || /isolation/i.test(item.exercise_type || '');
          if (isIso) dist[muscle].isolation++;
          else dist[muscle].compound++;
          dist[muscle].total++;
        }
      }
    }
    const summary = Object.entries(dist)
      .map(([muscle, c]) => {
        const pct = c.total ? `${Math.round((c.isolation/c.total)*100)}%iso` : '0';
        return `${muscle}: ${c.compound}c/${c.isolation}i (${pct})`;
      })
      .join(' | ');
    console.log(`  [${tier.padEnd(12)}] ${sc.label}\n    ${summary}\n`);
  }
}
