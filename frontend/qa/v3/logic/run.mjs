// Builds and runs the V3 frontend logic suites against the real utils/v3* sources (Node, no React).
import * as esbuild from 'esbuild';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const here = path.dirname(new URL(import.meta.url).pathname);
const edges = { name: 'edges', setup(b) {
  b.onResolve({ filter: /^\.\/api$/ }, () => ({ path: path.join(here, 'stubs/api.js') }));
  b.onResolve({ filter: /^@react-native-async-storage\/async-storage$/ }, () => ({ path: path.join(here, 'stubs/as.js') }));
} };
let failed = 0;
for (const s of ['phase2_logic.ts', 'phase2_6_logic.ts']) {
  const out = path.join(here, 'dist', s.replace('.ts', '.cjs'));
  await esbuild.build({ entryPoints: [path.join(here, s)], bundle: true, platform: 'node', outfile: out, plugins: [edges], logLevel: 'error' });
  const txt = execFileSync('node', [out], { encoding: 'utf8', cwd: here });
  const last = txt.trim().split('\n').pop();
  console.log(`${s}: ${last}`);
  if (!/failures 0$/.test(last)) { failed++; console.log(txt); }
}
process.exit(failed ? 1 : 0);
