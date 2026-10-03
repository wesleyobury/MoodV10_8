/**
 * Athletic cart QA (sequencing / presentation pass): runs real backend envelopes through the Cart model the app renders
 * (cartSections / cartHeader) and checks visual coherence: at most ~3 phases in demand order, no Primary / Secondary /
 * Support role sections, context tags on velocity-strength rows, no passive core filler. Prints a text rendering of each cart.
 *   node --import tsx qa/v3/athletic_cart_qa.ts <envs.json> <out.txt>
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { cartHeader, cartSections } from '../../utils/v3CartFormat';

const [, , inPath, outPath] = process.argv;
const envs: { key: string; envelope: any }[] = JSON.parse(readFileSync(inPath, 'utf8'));
const ORDER = ['PRIMER', 'POWER', 'SPEED & PLYO', 'PLYOMETRICS', 'ATHLETIC STRENGTH', 'ATHLETIC CORE', 'RESILIENCE', 'FINISHER'];
const rank = (t: string) => (t === 'PRIMER' ? 0 : ['POWER', 'SPEED & PLYO', 'PLYOMETRICS'].includes(t) ? 1 : t === 'FINISHER' ? 3 : 2);
const out: string[] = []; const fails: string[] = [];
const phaseCounts: Record<number, number> = {}; const shapes: Record<string, number> = {};
let tagged = 0, lifts = 0;
for (const { key, envelope } of envs) {
  const w = envelope.workout; const h = cartHeader(w); const secs = cartSections(w);
  const titles = secs.map((s) => s.title);
  const core = secs.filter((s) => s.title !== 'FINISHER').length;
  phaseCounts[core] = (phaseCounts[core] ?? 0) + 1; shapes[titles.join(' > ')] = (shapes[titles.join(' > ')] ?? 0) + 1;
  if (core > 3) fails.push(`${key}: ${core} phases`);
  if (new Set(titles).size !== titles.length) fails.push(`${key}: a phase appears twice (${titles.join(' > ')})`);
  if (titles.some((t) => !ORDER.includes(t))) fails.push(`${key}: unexpected section ${titles.join(' > ')}`);
  const r = titles.map(rank); if (r.join() !== [...r].sort().join()) fails.push(`${key}: phases out of order ${titles.join(' > ')}`);
  for (const s of secs) for (const b of s.blocks) for (const row of b.rows) {
    const df = row.item.prescription.direction_fields || {};
    if (df.category === 'ATHLETIC_STRENGTH' && df.performance_role !== 'Contrast Strength') { lifts++; if (row.context === 'FOR VELOCITY') tagged++; else fails.push(`${key}: lift without FOR VELOCITY (${row.name})`); }
    if (['dead_bug', 'side_plank', 'copenhagen_plank'].includes(row.item.exercise.id)) fails.push(`${key}: passive core ${row.name}`);
  }
  out.push(`### ${key}`, `${h.eyebrow} | ${h.title}`);
  for (const s of secs) {
    out.push(`  ${s.title}${s.muscles ? '  ·  ' + s.muscles : ''}   (${s.exercises} ex${s.minutes ? ', ~' + Math.round(s.minutes) + ' min' : ''})${s.emphasis === 'main' ? '  [main]' : ''}`);
    for (const b of s.blocks) {
      if (b.label) out.push(`    ${b.label}${b.sublabel ? ' ' + b.sublabel : ''}`);
      for (const row of b.rows) out.push(`    ${row.marker ? row.marker.padEnd(3) : '   '}${row.name.padEnd(38)} ${row.rx.padEnd(14)}${row.context ? '  ' + row.context : ''}`);
    }
  }
  out.push('');
}
const summary = [`carts ${envs.length}; failures ${fails.length}`, `phases per cart (excl. finisher): ${JSON.stringify(phaseCounts)}`,
  `velocity-strength rows tagged FOR VELOCITY: ${tagged}/${lifts}`, 'phase shapes:', ...Object.entries(shapes).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${v}  ${k}`), ...fails.slice(0, 40)];
writeFileSync(outPath, summary.join('\n') + '\n\n' + out.join('\n'));
console.log(summary.join('\n'));
