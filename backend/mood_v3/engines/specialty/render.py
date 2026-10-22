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


def _today_block(preset_id, flavor):
    flabel = BP.FLAVORS[flavor]['label']
    pname = BP.PRESET_NAMES[preset_id]
    text = f"{pname}: a {BP.FLAVORS[flavor]['name']} session ({flabel.lower()})."
    return dict(told=[], chose=pname, chosen_by='user_selected')


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
    res_for_envelope = dict(res, blocks=blocks, warmup=res['warmup'], cooldown=None, relaxations=[], adjustments=res.get('log', []),
                             selection_source='user_selected')
    today = _today_block(preset_id, flavor)
    env = F.envelope_ok(workout_id=workout_id or _uuid.uuid4().hex, version=1, ctx=ctx, res=res_for_envelope,
                         built_for_today=[dict(code='specialty_preset', text=f"{BP.PRESET_NAMES[preset_id]}: {BP.FLAVORS[flavor]['name']} session.")],
                         created_at=_dt.datetime.now(_dt.timezone.utc).isoformat(), today=today)
    env['workout']['specialty'] = dict(preset_id=preset_id, preset_name=BP.PRESET_NAMES[preset_id], flavor=flavor,
                                        flavor_name=BP.FLAVORS[flavor]['name'], media_gaps=list(CAT.MEDIA_GAPS) if not nctx.get('production_only', True) else [])
    return env
