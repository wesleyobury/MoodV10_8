/**
 * Tap-burden audit: for representative workouts, how many taps each session mode asks for.
 *   cd frontend && node --import tsx qa/v3/tap-burden.ts
 * Guided: required taps = every user-advanced step (a set, a station, a rung, Start on a hold, Ready, the warm-up / cool-down
 * checklist, Finish); optional taps = "I'm ready" on a move, "Start now" on full recovery, Done on an EMOM minute, skips,
 * +time; auto-advanced = every timer step (rest, transition, recovery, clock work, EMOM minutes).
 * Overview: minimum required = 1 set + Finish; tracking = one tap per exercise (row check) or per set; timers = clock blocks
 * started from Overview (each is one tap into Guided).
 * Screens (founder review): distinct Guided screens the athlete sees. Before the review every step was a screen (a rest was a
 * screen of its own); now a rest / transition stays on the exercise screen and a clock block is one screen, so screens =
 * exercises (+ Ready per clock block, warm-up, cool-down / finish).
 */
import { readFileSync } from 'node:fs';
import { compile } from '../../utils/v3Session/compile';

const rows = readFileSync(process.argv[2] ?? '/tmp/all_envs.jsonl', 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).workout);
const pick = (dir: string, dur: number) => rows.filter((w) => w.direction === dir && w.duration.requested_minutes === dur);

function measure(w: any) {
  const p = compile(w);
  let required = 0, optional = 0, auto = 0, holds = 0;
  for (const st of p.steps) {
    if (st.type === 'work') { required += 1; if (st.durationSec && st.timerStart === 'manual') { required += 1; holds += 1; } if (st.durationSec && st.timerStart !== 'manual') auto += 1; }
    else if (st.type === 'ready' || st.type === 'finish') required += 1;
    else if (st.type === 'checklist') required += p.sections[st.section].kind === 'cooldown' ? 0 : 1; // cool-down merges into Finish
    else if (st.type === 'transition') { auto += 1; optional += 1; }
    else if (st.type === 'rest') { auto += 1; optional += 1; }
    else if (st.type === 'recovery' || st.type === 'timed_work') auto += 1;
    else if (st.type === 'emom_minute') { auto += 1; optional += 1; }
  }
  const exercises = p.sections.filter((s) => s.kind === 'block').reduce((n, s) => n + s.items.length, 0);
  // screens: one per exercise entry (a work step whose exercise differs from the previous work step), one per Ready, checklist, finish
  let screensNow = 0, screensBefore = 0, lastItem = '';
  for (const st of p.steps) {
    if (st.type === 'ready' || st.type === 'checklist' || st.type === 'finish') { screensNow += 1; screensBefore += 1; lastItem = ''; continue; }
    if (st.type === 'rest' || st.type === 'transition' || st.type === 'recovery') { screensBefore += 1; continue; }
    const key = `${st.section}:${st.itemIndex}`;
    screensBefore += 1;
    if (key !== lastItem) { screensNow += 1; lastItem = key; }
  }
  const clockBlocks = p.sections.filter((s) => s.clock).length;
  const sets = p.steps.filter((s) => s.type === 'work' && s.side !== 'right').length;
  return { required, optional, auto, holds, exercises, clockBlocks, sets, screensNow, screensBefore, blocks: p.sections.filter((s) => s.kind === 'block').length, minutes: Math.round(w.duration.estimated_minutes) };
}

const out: string[] = [];
for (const [dir, dur] of [['strength', 30], ['strength', 60], ['sweat', 30], ['sweat', 60], ['athletic', 30], ['athletic', 60]] as const) {
  const ws = pick(dir, dur);
  const ms = ws.map(measure);
  const med = (k: keyof ReturnType<typeof measure>) => { const v = ms.map((m) => m[k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; };
  out.push(`${dir} ${dur} min (n=${ws.length}, ~${med('minutes')} min, ${med('blocks')} blocks, ${med('exercises')} exercises, ${med('sets')} sets)`);
  out.push(`  Guided    required ${med('required')} · optional ${med('optional')} · auto-advanced ${med('auto')} (hold starts ${med('holds')})`);
  out.push(`  Screens   ${med('screensNow')} now (one per exercise entry) vs ${med('screensBefore')} before (one per step incl. every rest)`);
  out.push(`  Overview  minimum ${2} (one set + Finish) · per-exercise tracking ${med('exercises') + 1} · per-set tracking ${med('sets') + 1} · guided timers invoked ${med('clockBlocks')}`);
}
console.log(out.join('\n'));
