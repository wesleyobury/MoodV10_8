/**
 * Overview mode model: the whole workout as a scannable sheet with live progress, over the same Session Plan / SessionState
 * that Guided uses. Rows are the Cart's scan rows (utils/v3CartFormat.cartScan) joined with the plan's work steps.
 *
 * Interaction (all through the shared engine):
 *   tap a row            jump: make that exercise current (its next open set); looking around never completes anything
 *   tap its circle       complete_step: the next open set of that exercise (its rest is not started; Overview is self-paced)
 *   tap a checkmark      uncomplete_step: undo the last completed set
 *   Start guided timer   clock blocks (intervals, timed circuit, EMOM, continuous, pyramid): jump to the Ready card and
 *                        switch to Guided; Overview never runs a worse manual version of a clock block
 */
import type { V3Workout } from '../v3Api';
import { ScanBlock, ScanRow, cartScan } from '../v3CartFormat';
import { SessionState, currentStep } from './engine';
import type { SessionPlan, SessionSection, SessionStep } from './types';

export type RowState = 'done' | 'current' | 'partial' | 'pending' | 'skipped';

export interface OverviewRow extends ScanRow {
  sectionIndex: number;
  itemIndex: number;
  /** work steps of this exercise (one per set / station appearance / rung; per-side holds count once) */
  steps: SessionStep[];
  setsDone: number;
  setsSkipped: number;
  setsTotal: number;
  state: RowState;
  /** the step a tap makes current (next open set, else the first) */
  entryStep: number | null;
  /** the next open set to complete, null when the exercise is finished */
  nextOpen: number | null;
  /** the last completed set (to undo), null when none */
  lastDone: number | null;
  /** "2 / 4" for user-paced rows, null for clock rows */
  progress: string | null;
}

export interface OverviewBlock extends Omit<ScanBlock, 'rows'> {
  sectionIndex: number;
  section: SessionSection;
  clock: boolean;
  rows: OverviewRow[];
  state: 'done' | 'current' | 'partial' | 'pending';
  /** clock blocks: bouts / minutes done of total */
  clockProgress: { done: number; total: number } | null;
  readyStep: number;
}

export interface OverviewEdge {
  kind: 'warmup' | 'cooldown';
  sectionIndex: number;
  step: number;
  label: string;
  state: 'done' | 'current' | 'pending' | 'skipped';
}

export interface OverviewModel {
  warmup: OverviewEdge | null;
  blocks: OverviewBlock[];
  cooldown: OverviewEdge | null;
  finishStep: number;
}

export function overviewModel(plan: SessionPlan, s: SessionState, workout: V3Workout): OverviewModel {
  const cur = currentStep(plan, s);
  const scan = cartScan(workout);
  const blockSections = plan.sections.filter((x) => x.kind === 'block');
  const blocks: OverviewBlock[] = scan.map((sb, bi) => {
    const sec = blockSections[bi];
    const stepsIn = plan.steps.filter((x) => x.section === sec.index);
    const rows: OverviewRow[] = sb.rows.map((r) => {
      const itemIndex = sec.items.findIndex((it) => it.item_id === r.itemId);
      const steps = stepsIn.filter((x) => x.countsAsWork && x.itemIndex === itemIndex && x.side !== 'right');
      const done = steps.filter((x) => s.status[x.id] === 'done').length;
      const skipped = steps.filter((x) => s.status[x.id] === 'skipped').length;
      const open = steps.find((x) => !s.status[x.id]);
      const lastDone = [...steps].reverse().find((x) => s.status[x.id] === 'done');
      const isCurrent = cur.section === sec.index && cur.itemIndex === itemIndex;
      const state: RowState = isCurrent && cur.type !== 'finish' ? 'current' : done === steps.length && steps.length > 0 ? 'done' : done + skipped === steps.length && skipped > 0 ? 'skipped' : done > 0 ? 'partial' : 'pending';
      return {
        ...r,
        sectionIndex: sec.index,
        itemIndex,
        steps,
        setsDone: done,
        setsSkipped: skipped,
        setsTotal: steps.length,
        state,
        entryStep: open ? open.index : steps[0]?.index ?? null,
        nextOpen: open ? open.index : null,
        lastDone: lastDone ? lastDone.index : null,
        progress: sec.clock ? null : steps.length > 1 ? `${done} / ${steps.length}` : null,
      };
    });
    const work = stepsIn.filter((x) => x.countsAsWork);
    const wd = work.filter((x) => s.status[x.id] === 'done').length;
    const ws = work.filter((x) => s.status[x.id] === 'skipped').length;
    const state = cur.section === sec.index && cur.type !== 'finish' ? 'current' : wd + ws === work.length && work.length ? 'done' : wd > 0 ? 'partial' : 'pending';
    return { ...sb, rows, sectionIndex: sec.index, section: sec, clock: sec.clock, state, clockProgress: sec.clock ? { done: wd, total: work.length } : null, readyStep: sec.firstStep };
  });
  const edge = (kind: 'warmup' | 'cooldown'): OverviewEdge | null => {
    const sec = plan.sections.find((x) => x.kind === kind);
    if (!sec) return null;
    const st = plan.steps[sec.firstStep];
    const status = s.status[st.id];
    return { kind, sectionIndex: sec.index, step: st.index, label: sec.title, state: cur.index === st.index ? 'current' : status === 'done' ? 'done' : status === 'skipped' ? 'skipped' : 'pending' };
  };
  return { warmup: edge('warmup'), blocks, cooldown: edge('cooldown'), finishStep: plan.steps.length - 1 };
}
