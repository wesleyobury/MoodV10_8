"""Production adapter for the Specialty Workout Generator.

Independent of the frozen Strength/Sweat/Athletic engines: this module never imports engines/strength/core.py,
engines/strength/structure.py or any other frozen generation file. It reads the frozen production exercise library
read-only (engines.strength.audit_engine.EX, engines.strength.audit_engine.UPPER/LOWER -- data, not generation logic)
to extend each preset's pool beyond the curated catalog, exactly as engines/strength/adapter.py already reads it.

Structure first, exercises second (locked programming principle): build() resolves a preset + flavor to a filled
blueprint (blocks, each with a role-tagged slot list) from blueprints.py, THEN fills each slot by role/equipment/
target/skill/media match. Exercise selection never drives the structure.
"""
from __future__ import annotations
import hashlib, random

from ...engines.strength import audit_engine as AE  # read-only: EX (exercise data), UPPER/LOWER (muscle-group sets)
from . import catalog as CAT
from . import blueprints as BP

UPPER = AE.UPPER
LOWER = AE.LOWER
SKILL_RANK = {'beginner': 0, 'intermediate': 1, 'advanced': 2}


class Conflict(Exception):
    """Mirrors the frozen engines' Conflict contract (CONTRACT.md section 4): never a degraded workout."""
    def __init__(self, code, message, options=(), detail=None):
        super().__init__(message)
        self.code = code; self.message = message; self.options = list(options); self.detail = detail


# ------------------------------------------------------------------ pool: catalog + production, equipment + target filtered
def _target_class_of(prim):
    pm = set(prim)
    if pm & UPPER and pm & LOWER: return 'full'
    if pm & LOWER: return 'lower'
    if pm & UPPER: return 'upper'
    return 'full'


def _as_pool_record(ae_rec):
    role = 'anchor' if ae_rec.get('cx', 0) >= 5 else ('primary' if ae_rec.get('cls') == 'compound' else 'secondary')
    return dict(id=ae_rec['id'], name=ae_rec['name'], eq=ae_rec['eq'], prim=list(ae_rec.get('prim') or []),
                sec=list(ae_rec.get('sec') or []), skill=ae_rec.get('skill', 'beginner'), cx=ae_rec.get('cx', 1),
                role=role, target_class=_target_class_of(ae_rec.get('prim') or []), media_status='production_ready',
                anchor_exclusive=False, source='production')


def _as_pool_record_specialty(rec):
    return dict(rec, source='specialty')


def _production_pool(equipment_set):
    out = []
    for ae_rec in AE.EX.values():
        if not ae_rec.get('active', True): continue
        if ae_rec.get('eq') not in equipment_set: continue
        out.append(_as_pool_record(ae_rec))
    return out


def _catalog_pool(equipment_set):
    return [_as_pool_record_specialty(r) for r in CAT.SPECIALTY_EXERCISES.values() if r['eq'] in equipment_set]


def full_pool(preset_id):
    """Every exercise (production + specialty-catalog) eligible for this preset's equipment, unfiltered by media/skill."""
    p = BP.PRESETS[preset_id]
    eq_set = BP.EQUIPMENT_PROFILES[p['equipment']]['eq']
    return _production_pool(eq_set) + _catalog_pool(eq_set)


def eligible_pool(preset_id, experience, *, production_only=True):
    """The generation-time pool: equipment-eligible, target-eligible, skill-eligible, and (if production_only)
    media-ready. Full Body additionally includes upper- and lower-tagged items (scope doc: a traditional strength
    session built from separate upper/lower compounds is a fully valid Full Body workout)."""
    p = BP.PRESETS[preset_id]; target = p['target']; rank = SKILL_RANK[experience]
    pool = full_pool(preset_id)
    if target == 'full':
        pool = [e for e in pool if e['target_class'] in ('full', 'upper', 'lower')]
    else:
        pool = [e for e in pool if e['target_class'] == target]
    pool = [e for e in pool if SKILL_RANK.get(e['skill'], 0) <= rank]
    if production_only:
        pool = [e for e in pool if e['source'] != 'specialty' or CAT.production_ready(e['id'])]
    return pool


def eligible_complexes(preset_id, *, production_only=True):
    p = BP.PRESETS[preset_id]
    eq_set = BP.EQUIPMENT_PROFILES[p['equipment']]['eq']
    out = []
    for c in CAT.COMPLEXES.values():
        if c['eq'] not in eq_set: continue
        if p['target'] != 'full' and c['target_class'] == 'full': continue
        if production_only:
            ok = True
            for s in c['steps']:
                ref = s['ref']
                if ref.startswith('_prod:'): continue   # resolved with a fallback at build time; never media-gated
                rec = CAT.SPECIALTY_EXERCISES.get(ref)
                if rec and not CAT.production_ready(rec): ok = False; break
            if not ok: continue
        out.append(c)
    return out


# ------------------------------------------------------------------ determinism
def _seed(nctx):
    key = f"{nctx.get('user')}|{nctx.get('date')}|{nctx.get('preset_id')}|{nctx.get('flavor')}|{nctx.get('experience')}|{nctx.get('swap_count', 0)}|{nctx.get('salt', '')}"
    return int(hashlib.sha256(key.encode()).hexdigest()[:12], 16)


def fingerprint(res):
    return tuple(sorted(it['exercise_id'] for b in res['blocks_raw'] for it in b['items_raw']))


# ------------------------------------------------------------------ block filling (structure first, exercises second)
def _resolve_production_fallback(ref, rng, pool_by_id):
    """`_prod:X` steps in a complex reference a frozen production exercise that may not exist (burpee, high_knees are
    not in the current library -- a real content gap, not a swap-logic bug). Falls back to repeating an earlier step
    of the same complex rather than silently inventing an exercise; the caller logs this."""
    name = ref.split(':', 1)[1]
    for rec in AE.EX.values():
        if rec['id'] == name or rec['id'].replace('_', '') == name.replace('_', ''):
            return _as_pool_record(rec), False
    return None, True   # not found -> caller supplies the documented fallback


def _pick(pool, used_ids, role_pref, rng, *, exclude_anchor_exclusive_conflict=False, block_has_anchor_exclusive=False):
    cands = [e for e in pool if e['id'] not in used_ids]
    if block_has_anchor_exclusive:
        # Man Maker (or any anchor_exclusive item) owns its block: no other anchor/primary heavy compound beside it.
        cands = [e for e in cands if e['role'] not in ('anchor', 'primary')]
    if not cands: return None
    by_role = [e for e in cands if e['role'] == role_pref]
    weighted = by_role or cands
    # weight toward curated/equipment-identity (specialty) items when available, per "equipment identity, not just
    # equipment compatibility" -- a 60/40 lean rather than an exclusive rule, so the production pool stays reachable.
    weights = [3 if e['source'] == 'specialty' else 1 for e in weighted]
    return rng.choices(weighted, weights=weights, k=1)[0]


def _item_raw(exercise, *, sets=None, reps=None, seconds=None, rest_sec=None, swappable=True, chain_pos=None):
    return dict(exercise_id=exercise['id'], exercise=exercise, sets=sets, reps=reps, seconds=seconds,
                rest_sec=rest_sec, swappable=swappable, chain_pos=chain_pos)


def _build_block(bspec, pool, used_ids, rng, *, complexes=(), block_index=0, dosing_scale=1.0):
    structure = bspec['structure']; items = []
    log = []
    has_anchor_exclusive_in_block = False

    # Complex/Flow chain blocks: try an assembled complex first (equipment identity anchor for that flavor).
    if bspec.get('chain') and complexes:
        c = rng.choice(complexes)
        for i, step in enumerate(c['steps']):
            ref = step['ref']
            if ref.startswith('_prod:'):
                rec, missing = _resolve_production_fallback(ref, rng, None)
                if missing:
                    log.append(dict(reason_code='complex_step_fallback', complex=c['id'], missing_ref=ref))
                    # documented fallback: repeat the complex's first real step instead of inventing an exercise
                    first_real = next((s for s in c['steps'] if not s['ref'].startswith('_prod:')), None)
                    if first_real is None: continue
                    rec = CAT.SPECIALTY_EXERCISES[first_real['ref']]
                    rec = _as_pool_record_specialty(rec)
            else:
                rec = CAT.SPECIALTY_EXERCISES.get(ref)
                rec = _as_pool_record_specialty(rec) if rec else _as_pool_record(AE.EX[ref.replace('sp_', '')])
            used_ids.add(rec['id'])
            items.append(_item_raw(rec, reps=step['reps'], rest_sec=0, swappable=False, chain_pos=i))
        return dict(items_raw=items, structure='circuit', log=log, used_complex=c['id'])

    n = len(bspec['slots'])
    for i, role_pref in enumerate(bspec['slots']):
        ex = _pick(pool, used_ids, role_pref, rng, block_has_anchor_exclusive=has_anchor_exclusive_in_block)
        if ex is None: continue
        if ex.get('anchor_exclusive'): has_anchor_exclusive_in_block = True
        used_ids.add(ex['id'])
        sets = bspec.get('sets'); reps = bspec.get('reps')
        if reps is None:
            reps = '3' if bspec.get('low_rep') else ('6' if ex['role'] in ('anchor', 'primary') else '10')
        if sets:
            sets = max(1, round(sets * dosing_scale))
        rest = bspec.get('rest_between_items_sec')
        items.append(_item_raw(ex, sets=sets, reps=reps, rest_sec=rest if structure == 'straight' else None))
    return dict(items_raw=items, structure=structure, log=log, used_complex=None)


# ------------------------------------------------------------------ warm-up (general movement prep -> equipment-specific activation)
# Wes (Oct 2026, feedback #4): the warm-up shipped as a bare guidance string with zero items -- nothing to check off
# in Guided Session. Specialty has no warmup.raise/prep/primer library (that pool belongs to engines/athletic/
# athletic_gen.py, and is athletic-specific); this builds from the same equipment pool the rest of the generator
# already draws from instead: general, equipment-agnostic movement prep first, then 1-2 light-load reps of the
# session's own equipment at the lowest skill/complexity available, across distinct movement patterns -- a real
# activation set, never a repeat of the working session.
GENERAL_WARMUP = [
    dict(name='Jumping Jacks', note='30 s, easy pace'),
    dict(name='Arm Circles', note='30 s each direction'),
    dict(name='Bodyweight Squat', note='10 reps, easy pace'),
    dict(name='Walking Lunge', note='8 / side'),
]


def _general_warmup(target):
    """Always a heart-rate raiser, then one mobility move matched to where the session will load: a squat-pattern
    opener for Lower/Full Body targets, a shoulder opener for Upper Body."""
    return [GENERAL_WARMUP[0], GENERAL_WARMUP[2] if target in ('lower', 'full') else GENERAL_WARMUP[1]]


def _activation_warmup(blocks_raw, exclude_names=()):
    """1-2 light reps of movements the session is ABOUT to use -- the earliest-appearing exercises in build order,
    by distinct movement pattern, so the warm-up rehearses what's coming next instead of a random equipment-matched
    pick from exercises the session never touches. `exclude_names` keeps it from repeating a general-prep pick
    (e.g. Bodyweight Squat chosen as both the general mobility move and the session's own main lift)."""
    seen_pat = set(); picks = []
    for b in blocks_raw:
        for it in b['items_raw']:
            e = it['exercise']
            if e['name'] in exclude_names: continue
            pat = e.get('pat')   # only specialty-catalog records carry 'pat'; a production record is never skipped for a dupe pattern
            if pat and pat in seen_pat: continue
            if pat: seen_pat.add(pat)
            picks.append(e)
            if len(picks) == 2: return picks
    return picks


def build(nctx, history_records=(), swap_count=0):
    preset_id = nctx['preset_id']; flavor = nctx.get('flavor')
    if preset_id not in BP.PRESETS:
        raise Conflict('cannot_build', f'Unknown specialty preset "{preset_id}".')
    eligible = BP.eligible_flavors(preset_id)
    if flavor is None:
        rng0 = random.Random(_seed(dict(nctx, flavor='_pick')))
        flavor = rng0.choice(eligible)
    elif flavor not in eligible:
        raise Conflict('cannot_build', f'Flavor "{flavor}" is not eligible for preset "{preset_id}".',
                        detail=dict(eligible=eligible))
    nctx = dict(nctx, flavor=flavor)
    rng = random.Random(_seed(nctx))
    pool = eligible_pool(preset_id, nctx['experience'], production_only=nctx.get('production_only', True))
    if len(pool) < 3:
        raise Conflict('cannot_build', f'Preset "{preset_id}" has too few production-ready exercises to build a workout.',
                        detail=dict(pool_size=len(pool)))
    complexes = eligible_complexes(preset_id, production_only=nctx.get('production_only', True))
    fspec = BP.FLAVORS[flavor]
    dosing_scale = BP.flavors_for_duration(nctx.get('duration', 60))
    used_ids = set()
    blocks_raw = []; log = []
    for bi, bspec in enumerate(fspec['blocks']):
        if bspec.get('anchor_only'):
            has_anchor = any(e.get('anchor_exclusive') for e in pool if e['id'] not in used_ids)
            if not (has_anchor and rng.random() < 0.5):
                continue
        b = _build_block(bspec, pool, used_ids, rng, complexes=complexes, block_index=bi, dosing_scale=dosing_scale)
        if not b['items_raw']: continue
        blocks_raw.append(dict(b, type=bspec['type'], rounds=bspec.get('rounds'),
                                rest_between_items_sec=bspec.get('rest_between_items_sec'),
                                rest_between_rounds_sec=bspec.get('rest_between_rounds_sec')))
        log.extend(b['log'])
    if not blocks_raw:
        raise Conflict('generation_failed', f'Specialty generator produced no blocks for "{preset_id}" / "{flavor}".')
    est = sum(_estimate_block_minutes(b) for b in blocks_raw)
    eq_label = BP.EQUIPMENT_PROFILES[BP.PRESETS[preset_id]['equipment']]['label']
    general_raw = _general_warmup(BP.PRESETS[preset_id]['target'])
    warmup = dict(minutes=6, general_raw=general_raw,
                  activation_raw=_activation_warmup(blocks_raw, exclude_names={g['name'] for g in general_raw}),
                  guidance=f'5-6 min: general movement prep, then light {eq_label.lower()} activation before working weight.')
    return dict(preset_id=preset_id, flavor=flavor, blocks_raw=blocks_raw, estimated_minutes=est, log=log,
                archetype=f'specialty_{preset_id}', target_muscles=[], warmup=warmup,
                history_record=dict(direction='specialty', archetype=f'specialty_{preset_id}',
                                     exercise_ids=sorted(used_ids), preset_id=preset_id, flavor=flavor))


def _estimate_block_minutes(b):
    n = len(b['items_raw'])
    per_item = 1.2
    rounds = b.get('rounds') or 1
    rest = (b.get('rest_between_items_sec') or 30) / 60.0
    rest_rounds = (b.get('rest_between_rounds_sec') or 0) / 60.0
    if b['structure'] == 'straight':
        sets = max((it.get('sets') or 1) for it in b['items_raw']) if b['items_raw'] else 1
        return round(n * sets * (per_item * 0.6 + rest), 1)
    return round(n * rounds * (per_item + rest) + max(0, rounds - 1) * rest_rounds, 1)


# ------------------------------------------------------------------ structure-aware substitution
def swap_candidates(nctx, res, exercise_id):
    """Alternatives for exercise_id that preserve equipment compatibility, movement role, flavor context and block
    cohesion (Wes's requirement #3). A complex-slot item (chain_pos is not None) is never individually swappable --
    see swap_exercise below; the whole complex swaps for an equivalent one instead."""
    preset_id = nctx['preset_id']
    loc = _find_item(res, exercise_id)
    if loc is None: return []
    bi, item = loc
    if item.get('chain_pos') is not None:
        return []   # complex-slot items are not individually swappable
    pool = eligible_pool(preset_id, nctx['experience'], production_only=nctx.get('production_only', True))
    used = {it['exercise_id'] for b in res['blocks_raw'] for it in b['items_raw']}
    role_pref = item['exercise']['role']
    cands = [e for e in pool if e['id'] not in used and e['id'] != exercise_id and e['role'] == role_pref
             and e['eq'] == item['exercise']['eq']]
    return cands


def _find_item(res, exercise_id):
    for bi, b in enumerate(res['blocks_raw']):
        for it in b['items_raw']:
            if it['exercise_id'] == exercise_id: return bi, it
    return None


def swap_exercise(nctx, res, exercise_id, excluded=frozenset()):
    loc = _find_item(res, exercise_id)
    if loc is None:
        raise Conflict('no_alternative', 'Exercise not found in this workout.')
    bi, item = loc
    if item.get('chain_pos') is not None:
        raise Conflict('no_alternative', 'This exercise is part of an assembled complex and cannot be swapped on its own; swap the whole complex block instead.')
    cands = [c for c in swap_candidates(nctx, res, exercise_id) if c['id'] not in excluded]
    if not cands:
        raise Conflict('no_alternative', f'No equipment/role/flavor-compatible alternative for "{item["exercise"]["name"]}".')
    rng = random.Random(_seed(dict(nctx, salt=f'swap:{exercise_id}:{len(excluded)}')))
    weights = [3 if c['source'] == 'specialty' else 1 for c in cands]
    new_ex = rng.choices(cands, weights=weights, k=1)[0]
    res2 = _deepcopy_res(res)
    bi2, item2 = _find_item(res2, exercise_id)
    item2['exercise_id'] = new_ex['id']; item2['exercise'] = new_ex
    res2['log'] = list(res.get('log', [])) + [dict(reason_code='exercise_swapped', from_=exercise_id, to=new_ex['id'])]
    # the state layer reads 'from'/'to' (reserved word) off the log entry by key lookup, not attribute
    res2['log'][-1]['from'] = exercise_id
    res2['history_record'] = dict(res['history_record'], exercise_ids=sorted(
        {it['exercise_id'] for b in res2['blocks_raw'] for it in b['items_raw']}))
    return res2


def swap_complex(nctx, res, complex_block_index, excluded=frozenset()):
    """Swap an entire assembled-complex block for another complex of equivalent role/intensity (same equipment,
    same or adjacent complexity tier). This is the sanctioned swap path for complex items (see swap_exercise)."""
    preset_id = nctx['preset_id']
    block = res['blocks_raw'][complex_block_index]
    cur_id = block.get('used_complex')
    if not cur_id:
        raise Conflict('no_alternative', 'This block is not an assembled complex.')
    cur = CAT.COMPLEXES[cur_id]
    cands = [c for c in eligible_complexes(preset_id, production_only=nctx.get('production_only', True))
             if c['id'] != cur_id and c['id'] not in excluded and c['eq'] == cur['eq']
             and abs(c['cx'] - cur['cx']) <= 1]
    if not cands:
        raise Conflict('no_alternative', 'No equivalent complex available to swap to.')
    rng = random.Random(_seed(dict(nctx, salt=f'swapcx:{cur_id}:{len(excluded)}')))
    new_c = rng.choice(cands)
    res2 = _deepcopy_res(res)
    used_ids = set()
    items = []
    for i, step in enumerate(new_c['steps']):
        ref = step['ref']
        if ref.startswith('_prod:'):
            rec, missing = _resolve_production_fallback(ref, rng, None)
            if missing:
                first_real = next((s for s in new_c['steps'] if not s['ref'].startswith('_prod:')), None)
                rec = _as_pool_record_specialty(CAT.SPECIALTY_EXERCISES[first_real['ref']])
        else:
            rec = _as_pool_record_specialty(CAT.SPECIALTY_EXERCISES[ref])
        used_ids.add(rec['id'])
        items.append(_item_raw(rec, reps=step['reps'], rest_sec=0, swappable=False, chain_pos=i))
    res2['blocks_raw'][complex_block_index] = dict(block, items_raw=items, used_complex=new_c['id'])
    res2['log'] = list(res.get('log', [])) + [dict(reason_code='complex_swapped', from_=cur_id, to=new_c['id'])]
    return res2


def _deepcopy_res(res):
    return dict(res, blocks_raw=[dict(b, items_raw=[dict(it) for it in b['items_raw']]) for b in res['blocks_raw']])
