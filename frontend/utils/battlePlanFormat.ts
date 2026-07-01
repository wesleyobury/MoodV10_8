import { BattlePlan, BattlePlanBlock, Movement } from '../types/workout';
import { TUTORIAL_MAP } from './tutorialMap';

const slugKey = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Runtime structuring of a legacy battlePlan string into the standardized shape.
// Mirrors the offline converter (tools/convert_all.js) minus library tagging, so
// the session screen can render structured tiles even before `plan` is threaded
// through the cart pipeline. When a workout already carries `plan`, prefer that.

const NONNAME = new Set(['the', 'and', 'with', 'a', 'to', 'x', 'per', 'each', 'side', 'leg', 'rep',
  'set', 'standard', 'hold', 'tempo', 'light', 'heavy', 'weighted', 'bodyweight', 'immediately',
  'add', 'then', 'drop', 'of', 'second', 'sec', 's', 'reps', 'max']);

const canon = (s: string): string[] =>
  s.toLowerCase().replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);

function parsePresc(str: string): Partial<Movement> {
  const out: Partial<Movement> = {};
  let p = str.trim();
  const rpe = p.match(/\(?\bRPE\s*[\d–\-]+\)?/i);
  if (rpe) { out.intensity = rpe[0].replace(/[()]/g, '').trim(); p = p.replace(rpe[0], ''); }
  const restM = p.match(/([\d]+(?:[–-][\d]+)?s(?:\/side)?)\s*rest/i);
  if (restM) { out.rest = restM[1]; p = p.replace(restM[0], ''); }
  p = p.replace(/^[\s,;]+|[\s,;]+$/g, '');
  const note = p.match(/\(([^)]*(?:eccentric|hold|tempo|squeeze)[^)]*)\)/i);
  if (note) { out.note = note[1].trim(); p = p.replace(note[0], '').trim(); }
  let m = p.match(/^(\d+)\s*[×x]\s*\(([^)]+)\)/);
  if (m) { out.sets = +m[1]; out.reps = m[2].replace(/\s*\/\s*/g, '/').trim(); return out; }
  m = p.match(/^(\d+)\s*[×x]\s*([\d]+(?:[–-][\d]+)?s?(?:\/side)?)/);
  if (m) { out.sets = +m[1]; out.reps = m[2]; return out; }
  m = p.match(/^([\d]+(?:[–-][\d]+)?s?(?:\/side)?)\b/);
  if (m) { out.reps = m[1]; return out; }
  if (p) out.reps = p.trim();
  return out;
}

function parseTime(body: string): Movement | null {
  const m = body.match(/^([\d]+(?:[–-][\d]+)?\s*(?:min|sec|miles|meters?|km|mi|m|s)\b)\s*(.*)$/i);
  if (!m) return null;
  const out: Movement = { name: '', duration: m[1].trim().replace(/\s+/g, ' ') };
  let rest = m[2].trim();
  const par = rest.match(/\(([^)]+)\)/);
  if (par) { out.intensity = par[1].trim(); rest = rest.replace(par[0], '').trim(); }
  out.name = rest || 'Interval';
  return out;
}

interface ParseCtx { instructions?: string; label?: string; rounds?: number; restHeader?: string; notes: string[]; }

// non-movement / header lines (checked after the bullet is stripped)
function skipLine(body: string, ctx: ParseCtx): boolean {
  if (/^instructions:/i.test(body)) { ctx.instructions = body.replace(/^instructions:\s*/i, ''); return true; }
  if (/^sets:/i.test(body)) return true;
  if (/^rest\b/i.test(body)) { if (!ctx.restHeader) ctx.restHeader = body.replace(/^rest[:\s]*/i, ''); return true; }
  let rm = body.match(/^battle plan\s*[—–-]\s*(.+)$/i); if (rm) { ctx.label = rm[1].trim(); return true; }
  rm = body.match(/^(?:perform\s+)?(\d+)\s*(?:[a-z]+\s+)?rounds?\b/i); if (rm) { ctx.rounds = +rm[1]; return true; }
  rm = body.match(/^(\d+)\s*cycles?\b/i); if (rm) { ctx.rounds = +rm[1]; return true; }
  if (/^(perform|repeat|then|finish|cycles?\b|superset|circuit|amrap|emom|drop\b|immediately\b|add\b|final set|final rep|set \d)/i.test(body)) { ctx.notes.push(body); return true; }
  return false;
}

export function parseBattlePlan(raw: string, workoutName = ''): BattlePlan {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const isInterval = /(mph|rpm|resistance|incline|\bmin\b|\bsec\b)/i.test(raw) && !/[×x]\s*\d/.test(raw);
  const ctx: ParseCtx = { notes: [] };
  const moves: Movement[] = []; let pendingName: string | null = null;

  for (const t of lines) {
    const bullet = /^•/.test(t);
    let body = t.replace(/^•\s*/, '').trim();
    if (!body) continue;
    if (skipLine(body, ctx)) continue;
    if (isInterval) { const seg = parseTime(body); if (seg) { moves.push(seg); continue; } }
    body = body.replace(/^clusters?\s*:\s*/i, '');
    const bare = body.replace(/\s*\(.*?\)\s*/g, ' ').trim();
    if (!bullet && !/\d/.test(bare)) { pendingName = bare; continue; }
    if (bullet && pendingName && /^\d/.test(body)) {
      moves.push({ name: pendingName, ...parsePresc(body) }); pendingName = null; continue;
    }
    const m = body.match(/^((?:\d+\s*[×x]\s*)?[\d]+(?:[–-][\d]+)?s?(?:\/side)?)\s+([A-Za-z].*)$/);
    if (m && !/\s[—–]\s/.test(m[1])) {
      let rest = m[2]; let note: string | undefined;
      const dm = rest.split(/\s+[—–]\s+/); if (dm.length > 1) { rest = dm[0]; note = dm.slice(1).join(' — '); }
      const name = rest.replace(/\s*\(.*?\)\s*/g, ' ').trim();
      if (/^(rest|amrap|emom|repeat|cycle)\b/i.test(name)) continue; // "30s Rest" etc. — not a movement
      moves.push({ name, ...parsePresc(m[1]), ...(note ? { note } : {}) }); continue;
    }
    const parts = body.split(/\s+[—–]\s+/);
    if (parts.length > 1) {
      const name = parts[0].replace(/\s*\(.*?\)\s*/g, ' ').trim();
      moves.push({ name, ...parsePresc(parts.slice(1).join(' — ')) }); continue;
    }
    const nm = body.replace(/\s*\(.*?\)\s*/g, ' ').trim();
    if (nm) moves.push({ name: nm });
  }

  for (const mv of moves) {
    const hasReal = mv.name && canon(mv.name).some(t => !NONNAME.has(t));
    if (!hasReal && workoutName) mv.name = workoutName;
    if (!mv.tutorialSlug) {
      const slug = TUTORIAL_MAP[slugKey(mv.name)];
      if (slug) mv.tutorialSlug = slug;
    }
  }
  if (ctx.notes.length && moves.length) {
    const last = moves[moves.length - 1];
    last.note = [last.note, ctx.notes.join('; ')].filter(Boolean).join('; ');
  }
  const isDrop = /drop|burnout/i.test(raw) && moves.length > 1;
  if (isDrop && moves[0] && moves[0].tutorialSlug) {
    const lead = moves[0].tutorialSlug;
    moves.forEach(mv => { if (!mv.tutorialSlug) mv.tutorialSlug = lead; });
  }
  const rounds = ctx.rounds;
  const format: BattlePlan['format'] = isInterval ? 'interval' : (rounds ? 'circuit' : 'strength');
  const type: BattlePlanBlock['type'] = isInterval ? 'interval'
    : (isDrop ? 'straight' : (moves.length > 1 ? (rounds ? 'circuit' : 'superset') : 'straight'));
  const block: BattlePlanBlock = { type, movements: moves.length ? moves : [{ name: workoutName || 'Exercise' }] };
  if (rounds) block.rounds = rounds;
  if (ctx.label) block.label = ctx.label;
  if (ctx.restHeader) block.rest = ctx.restHeader;
  const plan: BattlePlan = { format, blocks: [block] };
  if (ctx.instructions) plan.instructions = ctx.instructions;
  return plan;
}

// Cloudinary asset helpers — exercise_library assets are keyed by tutorialSlug.
const CLOUD = 'https://res.cloudinary.com/dfsygar5c/video/upload';
export const tutorialThumbUrl = (slug: string) =>
  `${CLOUD}/so_1.0,w_720,c_fill,q_auto,f_jpg/exercise_library/${slug}.jpg`;
export const tutorialVideoUrl = (slug: string) =>
  `${CLOUD}/exercise_library/${slug}.mov`;
