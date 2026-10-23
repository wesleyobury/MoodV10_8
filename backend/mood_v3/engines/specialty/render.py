"""Specialty -> shared app-facing envelope (schema v3.0). Uses the SAME builder functions formatter.py already
shares across format_strength/format_sweat/format_athletic (item(), block(), exercise_ref(), prescription(),
envelope_ok(), attach_rest_contract()) -- zero new schema, zero edits to those builders. The only shared-file change
anywhere in this feature is one additive dict entry in formatter.DIRECTION_NAMES (Specialty wasn't a known Direction
name before); no existing Direction's formatting changed.

This module intentionally does NOT reuse service.py's N.Context / N.normalize() (those validate direction against
the frozen 3-tuple ('strength','sweat','athletic') and would reject 'specialty'). It builds its own lightweight
Context instance directly -- the dataclass itself has no such restriction; only normalize()'s input validation does,
and this module never calls normalize(). Built for Today (bft/*) and exact-exercise progression are intentionally
NOT wired in for this first cut (see the final report) -- the envelope they'd enrich is already complete and valid
without them; `today` ships a minimal, honest line instead of the LLM-composed blurb.
"""
from __future__ import annotations
import datetime as _dt, uuid as _uuid

from ... import formatter as F, exercise_meta
from ...normalize import Context
from . import blueprints as BP, catalog as CAT


def _slot_label(exercise):
    return {'anchor': 'Anchor', 'primary': 'Primary', 'secondary': 'Accessory'}.get(exercise.get('role'), 'Exercise')


def _exercise_ref(ex):
    ref = F.exercise_ref(ex['id'], ex['name'], ex['eq'], ex['prim'])
    return ref


def _format_warmup(res):
    """Raw adapter.build() warmup (general_raw / activation_raw name+note pairs) -> the app-facing V3WarmupItem[]
    shape (component / component_label / exercise / name / prescription_text), matching exactly what the frozen
    Athletic/Strength/Sweat formatter already emits in the top-level render.py (format_athletic / format_athletic_legacy)
    -- same schema, this engine's own content. Activation items get a real exercise_ref (thumbnail, equipment label)
    since they're drawn from the real pool; general movement-prep items (jumping jacks, arm circles) aren't library
    exercises, so they ship name/note only, same as the frozen engines' own non-library warmup rows."""
    wu = res['warmup']
    items = []
    for g in wu.get('general_raw', []):
        items.append(dict(component='raise', component_label='General', exercise=None, name=g['name'], prescription_text=g['note']))
    for a in wu.get('activation_raw', []):
        note = '2 x 8, controlled, focus on the movement' if a['eq'] == 'bodyweight' else '2 x 8, light load, focus on the movement'
        items.append(dict(component='activation', component_label='Activation', exercise=_exercise_ref(a), name=a['name'],
                           prescription_text=note))
    return dict(minutes=wu['minutes'], items=items, guidance=wu.get('guidance'))


def _format_block(b, bi):
    items = []
    for ii, it in enumerate(b['items_raw']):
        ex = it['exercise']
        kind = 'time' if it.get('seconds') else 'reps'
        rx = F.prescription(kind, sets=it.get('sets'), reps=it.get('reps'), seconds=it.get('seconds'),
                             rest_sec=it.get('rest_sec'), rir=None,
                             load_guidance=('Bodyweight: work within the rep range.' if ex['eq'] == 'bodyweight' else None),
                             display=(f"{it['sets']} x {it['reps']}" if it.get('sets') else (it.get('reps') or '')),
                             direction_fields=dict(slot_class=ex.get('role'), protected=False,
                                                    movement_role=ex.get('role'), flavor=None))
        item_id = f"b{bi}_{ii}_{ex['id']}"
        items.append(F.item(item_id, ex['id'], _exercise_ref(ex), rx, role=_slot_label(ex),
                             swappable=(it.get('chain_pos') is None)))
    structure = b['structure']
    btitle = {'main': 'Main Block', 'secondary': 'Secondary Block', 'accessory': 'Accessory', 'finisher': 'Finisher'}.get(b['type'], 'Block')
    if b.get('used_complex'):
        btitle = CAT.COMPLEXES[b['used_complex']]['name']
    return F.block(f'B{bi + 1}', bi + 1, b['type'], structure, btitle, items, rounds=b.get('rounds'),
                   rest_between_items_sec=b.get('rest_between_items_sec'), rest_between_rounds_sec=b.get('rest_between_rounds_sec'),
                   instructions=('Chain with no rest between moves; rest after each full round.' if structure == 'circuit' and b.get('used_complex') else None))


# ------------------------------------------------------------------ Built for Today (template, no LLM)
# Specialty has no personalization contract (no States, no soreness routing -- the user picked the preset and flavor
# directly), so why_today.py / athletic_why.py / sweat_why.py's mood-driven fragment synthesis doesn't apply here;
# there is nothing to explain about an adaptation that never happened. What's actually true and worth saying is the
# session's own COMPOSITION: what leads it, how it's structured, how many moves. This replaces the old one-line
# boilerplate ("Kettlebell Leg Day: a Complex/Flow session (chained movements, continuous within a round).") that
# Wes flagged as generic regardless of what the generator actually built (item #3, Oct 2026 feedback pass).


def _lead_exercise_name(blocks_raw):
    """The exercise that anchors the session: the first anchor-role item anywhere, else the first item of the first
    (non-empty) block. Mirrors what the adapter itself treats as the session's lead (adapter.py:_pick / anchor_exclusive)."""
    for b in blocks_raw:
        for it in b['items_raw']:
            if it['exercise'].get('role') == 'anchor':
                return it['exercise']['name']
    for b in blocks_raw:
        if b['items_raw']:
            return b['items_raw'][0]['exercise']['name']
    return None


def _complex_names(blocks_raw):
    return [CAT.COMPLEXES[b['used_complex']]['name'] for b in blocks_raw if b.get('used_complex')]


def _structure_sentence(blocks_raw):
    """One sentence naming how the session is actually put together -- chained complex, circuit, supersets, or
    straight sets -- never a generic 'session' placeholder. Block/exercise counts come straight from blocks_raw,
    so this always matches what got built, not what the flavor template merely allows for."""
    n_blocks = len(blocks_raw)
    n_ex = sum(len(b['items_raw']) for b in blocks_raw)
    structures = [b['structure'] for b in blocks_raw]
    complexes = _complex_names(blocks_raw)
    ex_word = f"{n_ex} exercise{'s' if n_ex != 1 else ''}"
    block_word = f"{n_blocks} block{'s' if n_blocks != 1 else ''}"
    if complexes:
        cname = complexes[0]
        tail = f", plus {len(complexes) - 1} more chained round{'s' if len(complexes) > 2 else ''}" if len(complexes) > 1 else ''
        return f"It opens with the {cname}, chaining those moves with no rest between them before resting between rounds{tail}, across {ex_word} in {block_word}."
    if 'circuit' in structures:
        rounds = next((b.get('rounds') for b in blocks_raw if b['structure'] == 'circuit'), None)
        rr = f" for {rounds} rounds" if rounds else ''
        return f"It runs as a circuit{rr}, cycling through {ex_word} across {block_word}."
    if 'superset' in structures:
        return f"It pairs moves as supersets alongside straight sets, {ex_word} across {block_word}."
    return f"It runs as straight sets, {ex_word} across {block_word}."


def _compose_today_text(preset_id, flavor, res, equipment_label):
    pname = BP.PRESET_NAMES[preset_id]
    fspec = BP.FLAVORS[flavor]
    blocks_raw = res['blocks_raw']
    lead = _lead_exercise_name(blocks_raw)
    opener = f"{pname}, {fspec['label'].lower()}"
    if lead:
        opener += f", led by {lead}"
    opener += '.'
    return f"{opener} {_structure_sentence(blocks_raw)}"


def _today_block(preset_id, flavor, res, equipment_label):
    pname = BP.PRESET_NAMES[preset_id]
    fname = BP.FLAVORS[flavor]['name']
    text = _compose_today_text(preset_id, flavor, res, equipment_label)
    return dict(told=[pname], chose=f"Specialty \u00b7 {pname}", chosen_by='user_selected',
                teaser=dict(code='specialty_preset', title=f"Built for {fname}", text=text))


def generate(*, preset_id, flavor, experience, duration, user_key, date, equipment_label, swap_count=0,
             production_only=True, workout_id=None, adapter_module):
    """-> (envelope_dict, res) using the given adapter module's build(). res is the raw internal result, kept by the
    caller (router) for swap / rebuild -- this module never persists anything itself."""
    nctx = dict(preset_id=preset_id, flavor=flavor, experience=experience, duration=duration, user=user_key,
                date=date, swap_count=swap_count, production_only=production_only)
    res = adapter_module.build(nctx, swap_count=swap_count)
    return format_envelope(res, nctx, workout_id=workout_id), res


def format_envelope(res, nctx, *, workout_id=None):
    preset_id = res['preset_id']; flavor = res['flavor']
    ctx = Context(direction='specialty', states=[], duration=nctx.get('duration', 60), experience=nctx['experience'],
                   goal='stay_consistent', preset='commercial_gym', sore_regions=[], sore_muscles=frozenset(),
                   target_mode='explicit', target_muscles=(), archetype=res['archetype'], frequency='3-4',
                   user_key=nctx.get('user', ''), date=nctx.get('date', ''), swap_count=nctx.get('swap_count', 0))
    blocks = [_format_block(b, bi) for bi, b in enumerate(res['blocks_raw'])]
    exercise_meta.apply_scaling(blocks, 'specialty')   # no-op for unknown directions; call kept for parity / future-proofing
    F.attach_rest_contract(blocks, 'specialty')
    res_for_envelope = dict(res, blocks=blocks, warmup=_format_warmup(res), cooldown=None, relaxations=[], adjustments=res.get('log', []),
                             selection_source='user_selected')
    equipment_label = BP.EQUIPMENT_PROFILES[BP.PRESETS[preset_id]['equipment']]['label']
    today = _today_block(preset_id, flavor, res, equipment_label)
    env = F.envelope_ok(workout_id=workout_id or _uuid.uuid4().hex, version=1, ctx=ctx, res=res_for_envelope,
                         built_for_today=[dict(code='specialty_preset', text=today['teaser']['text'])],
                         created_at=_dt.datetime.now(_dt.timezone.utc).isoformat(), today=today)
    env['workout']['specialty'] = dict(preset_id=preset_id, preset_name=BP.PRESET_NAMES[preset_id], flavor=flavor,
                                        flavor_name=BP.FLAVORS[flavor]['name'], media_gaps=list(CAT.MEDIA_GAPS) if not nctx.get('production_only', True) else [])
    return env
