/**
 * Full Guided Session sweep: compile every envelope in a production-path dump and check the Session Plan invariants.
 *   cd backend && python3 mood_v3/qa/guided_session_fixtures.py /tmp/all_envs.jsonl --all --per=6000
 *   cd frontend && node --import tsx qa/v3/session-sweep.ts /tmp/all_envs.jsonl
 */
import { readFileSync } from 'node:fs';
import { compile } from '../../utils/v3Session/compile';
import { checkPlan } from '../../utils/v3Session/invariants';

const rows = readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const byDir: Record<string, number> = {};
const kinds: Record<string, number> = {};
let steps = 0;
const errs: string[] = [];
for (const r of rows) {
  const w = r.workout;
  byDir[w.direction] = (byDir[w.direction] ?? 0) + 1;
  for (const b of w.blocks) {
    const k = `${w.direction}/${b.structure}/${b.rest?.kind}`;
    kinds[k] = (kinds[k] ?? 0) + 1;
  }
  try {
    const p = compile(w);
    steps += p.steps.length;
    errs.push(...checkPlan(w, p));
  } catch (e: any) {
    errs.push(`${w.workout_id}: compile threw ${e?.message}`);
  }
}
console.log(`envelopes ${rows.length}`, byDir, `steps ${steps}`);
console.log(Object.entries(kinds).sort().map(([k, v]) => `  ${k} ${v}`).join('\n'));
console.log(`violations ${errs.length}`);
errs.slice(0, 30).forEach((e) => console.log('  ' + e));
process.exit(errs.length ? 1 : 0);
