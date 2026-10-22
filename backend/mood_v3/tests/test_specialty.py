"""Tests for the MOOD V3 Specialty Workout Generator (engines/specialty). Scoped entirely to the new, independent
module -- does not touch tests/frozen/ and exercises no frozen Direction code. Run with:
    cd backend && python -m pytest -c mood_v3/pytest.ini mood_v3/tests/test_specialty.py -q
"""
from __future__ import annotations
import pytest

from mood_v3.engines.specialty import adapter as SPA, blueprints as BP, catalog as CAT, render as SR

PRESETS = list(BP.PRESETS)
EXPERIENCES = ('beginner', 'intermediate', 'advanced')


def _nctx(preset_id, flavor, experience, duration=60, swap_count=0, user='qa_user', date='2026-10-22'):
    return dict(preset_id=preset_id, flavor=flavor, experience=experience, duration=duration, user=user, date=date,
                swap_count=swap_count, production_only=True)


# ------------------------------------------------------------------ 1. all 18 presets x 3 experience levels
@pytest.mark.parametrize('preset_id', PRESETS)
@pytest.mark.parametrize('experience', EXPERIENCES)
def test_all_presets_all_experience_levels_build(preset_id, experience):
    res = SPA.build(_nctx(preset_id, None, experience))
    assert res['blocks_raw'], f'{preset_id}/{experience} produced an empty workout'
    env = SR.format_envelope(res, _nctx(preset_id, res['flavor'], experience))
    assert env['status'] == 'ok'
    assert env['workout']['blocks']


# ------------------------------------------------------------------ 2. every eligible flavor per preset, all levels
@pytest.mark.parametrize('preset_id', PRESETS)
def test_every_eligible_flavor_builds(preset_id):
    for flavor in BP.eligible_flavors(preset_id):
        for experience in EXPERIENCES:
            res = SPA.build(_nctx(preset_id, flavor, experience))
            assert res['flavor'] == flavor
            assert res['blocks_raw']


# ------------------------------------------------------------------ 3. repeated-generation stress test (20x, scope doc QA)
@pytest.mark.parametrize('preset_id', PRESETS)
def test_repeated_generation_20x_no_crash_no_empty(preset_id):
    seen_exercise_sets = []
    for i in range(20):
        res = SPA.build(_nctx(preset_id, None, 'intermediate', swap_count=i))
        assert res['blocks_raw'], f'{preset_id} run {i}: empty workout'
        ids = frozenset(it['exercise_id'] for b in res['blocks_raw'] for it in b['items_raw'])
        assert ids, f'{preset_id} run {i}: no exercises selected'
        seen_exercise_sets.append(ids)
    # meaningful variety: not every one of the 20 runs is byte-identical (scope doc: "meaningful variety... not a
    # hard exercise-repeat count" -- this only checks degenerate always-same-output, not novelty quotas)
    distinct = len(set(seen_exercise_sets))
    assert distinct > 1, f'{preset_id}: all 20 runs produced the identical exercise set (degenerate output)'


# ------------------------------------------------------------------ 4. one dominant flavor; cohesion within a block
@pytest.mark.parametrize('preset_id', PRESETS)
def test_one_dominant_flavor_and_single_equipment(preset_id):
    p = BP.PRESETS[preset_id]
    allowed_eq = BP.EQUIPMENT_PROFILES[p['equipment']]['eq']
    for flavor in BP.eligible_flavors(preset_id):
        res = SPA.build(_nctx(preset_id, flavor, 'intermediate'))
        assert res['flavor'] == flavor, 'exactly one flavor per generation'
        for b in res['blocks_raw']:
            for it in b['items_raw']:
                assert it['exercise']['eq'] in allowed_eq, (
                    f'{preset_id}/{flavor}: {it["exercise"]["name"]} uses {it["exercise"]["eq"]}, '
                    f'outside the preset\'s equipment set {allowed_eq}')


# ------------------------------------------------------------------ 5. Full Body gives real upper AND lower training
@pytest.mark.parametrize('preset_id', [p for p in PRESETS if BP.PRESETS[p]['target'] == 'full'])
def test_full_body_presets_cover_upper_and_lower(preset_id):
    hit_upper = hit_lower = False
    for flavor in BP.eligible_flavors(preset_id):
        for _ in range(5):
            res = SPA.build(_nctx(preset_id, flavor, 'intermediate'))
            for b in res['blocks_raw']:
                for it in b['items_raw']:
                    tc = it['exercise'].get('target_class')
                    pm = set(it['exercise'].get('prim') or [])
                    if tc == 'upper' or pm & SPA.UPPER: hit_upper = True
                    if tc == 'lower' or pm & SPA.LOWER: hit_lower = True
    assert hit_upper, f'{preset_id}: never produced upper-body work across sampled generations'
    assert hit_lower, f'{preset_id}: never produced lower-body work across sampled generations'


# ------------------------------------------------------------------ 6. media readiness gate
def test_dev_only_exercises_never_appear_in_production_mode():
    dev_only_ids = {r['id'] for r in CAT.SPECIALTY_EXERCISES.values() if r['media_status'] == 'dev_only'}
    if not dev_only_ids:
        pytest.skip('no dev_only exercises in the catalog right now (all media gaps resolved) -- '
                     'nothing to gate; re-enable this check automatically if one is ever added')
    for preset_id in PRESETS:
        for flavor in BP.eligible_flavors(preset_id):
            for experience in EXPERIENCES:
                for i in range(5):
                    res = SPA.build(_nctx(preset_id, flavor, experience, swap_count=i))
                    used = {it['exercise_id'] for b in res['blocks_raw'] for it in b['items_raw']}
                    leaked = used & dev_only_ids
                    assert not leaked, f'{preset_id}/{flavor}/{experience}: dev_only exercises leaked into production mode: {leaked}'


def test_production_only_false_can_surface_dev_only_for_qa():
    """The opposite case: with production_only=False (dev/QA mode), dev_only items ARE reachable -- confirms the
    gate is a real filter, not an exercise that simply never gets selected for other reasons."""
    dev_only_ids = {r['id'] for r in CAT.SPECIALTY_EXERCISES.values() if r['media_status'] == 'dev_only'}
    if not dev_only_ids:
        pytest.skip('no dev_only exercises in the catalog right now (all media gaps resolved) -- '
                     'nothing to gate; re-enable this check automatically if one is ever added')
    nctx = dict(preset_id='landmine_full', flavor='complex_flow', experience='advanced', duration=60,
                user='qa', date='2026-10-22', swap_count=0, production_only=False)
    found = False
    for i in range(30):
        nctx = dict(nctx, swap_count=i)
        res = SPA.build(nctx)
        used = {it['exercise_id'] for b in res['blocks_raw'] for it in b['items_raw']}
        dev_only_ids = {r['id'] for r in CAT.SPECIALTY_EXERCISES.values() if r['media_status'] == 'dev_only'}
        if used & dev_only_ids: found = True; break
    assert found, 'dev_only items never surfaced even with the media gate disabled -- gate may be masking a different bug'


# ------------------------------------------------------------------ 7. structure-aware substitution (swap)
def test_swap_preserves_equipment_role_and_flavor():
    res = SPA.build(_nctx('dumbbells_upper', 'strength', 'intermediate'))
    item = res['blocks_raw'][0]['items_raw'][0]
    cands = SPA.swap_candidates(_nctx('dumbbells_upper', 'strength', 'intermediate'), res, item['exercise_id'])
    assert cands, 'no swap candidates found for a plain standalone item'
    for c in cands:
        assert c['eq'] == item['exercise']['eq']
        assert c['role'] == item['exercise']['role']
        assert c['id'] != item['exercise_id']


def test_complex_slot_items_are_not_individually_swappable():
    found_complex_block = None
    for i in range(10):
        res = SPA.build(_nctx('kettlebell_full', 'complex_flow', 'intermediate', swap_count=i))
        for b in res['blocks_raw']:
            if b.get('used_complex'):
                found_complex_block = (res, b); break
        if found_complex_block: break
    assert found_complex_block, 'no assembled complex appeared in 10 kettlebell_full complex_flow generations'
    res, block = found_complex_block
    chain_item = block['items_raw'][0]
    cands = SPA.swap_candidates(_nctx('kettlebell_full', 'complex_flow', 'intermediate'), res, chain_item['exercise_id'])
    assert cands == [], 'a complex-slot item must not offer individual swap candidates'
    with pytest.raises(SPA.Conflict):
        SPA.swap_exercise(_nctx('kettlebell_full', 'complex_flow', 'intermediate'), res, chain_item['exercise_id'])


def test_swap_complex_for_equivalent_complex():
    for i in range(10):
        res = SPA.build(_nctx('kettlebell_full', 'complex_flow', 'intermediate', swap_count=i))
        bi = next((j for j, b in enumerate(res['blocks_raw']) if b.get('used_complex')), None)
        if bi is not None: break
    assert bi is not None
    nctx = _nctx('kettlebell_full', 'complex_flow', 'intermediate')
    res2 = SPA.swap_complex(nctx, res, bi)
    assert res2['blocks_raw'][bi]['used_complex'] != res['blocks_raw'][bi]['used_complex']
    old_eq = CAT.COMPLEXES[res['blocks_raw'][bi]['used_complex']]['eq']
    new_eq = CAT.COMPLEXES[res2['blocks_raw'][bi]['used_complex']]['eq']
    assert old_eq == new_eq


# ------------------------------------------------------------------ 8. Man Maker anchor-exclusivity
def test_man_maker_never_paired_with_another_heavy_compound_in_its_block():
    hit = 0
    for i in range(60):
        res = SPA.build(_nctx('dumbbells_full', None, 'advanced', swap_count=i))
        for b in res['blocks_raw']:
            ids = [it['exercise_id'] for it in b['items_raw']]
            if 'sp_dumbbell_man_maker' in ids:
                hit += 1
                others = [it for it in b['items_raw'] if it['exercise_id'] != 'sp_dumbbell_man_maker']
                for o in others:
                    assert o['exercise']['role'] not in ('anchor', 'primary'), (
                        f"Man Maker paired with heavy compound {o['exercise']['name']} in the same block")
    assert hit > 0, 'Dumbbell Man Maker never appeared in 60 dumbbells_full advanced generations -- cannot verify the anchor constraint'


# ------------------------------------------------------------------ 9. output schema matches the shared envelope contract
def test_envelope_schema_matches_shared_contract():
    res = SPA.build(_nctx('park_upper', None, 'intermediate'))
    env = SR.format_envelope(res, _nctx('park_upper', res['flavor'], 'intermediate'))
    wk = env['workout']
    for key in ('workout_id', 'version', 'created_at', 'direction', 'direction_name', 'archetype', 'target',
                'duration', 'experience', 'states', 'soreness', 'equipment', 'swap_count', 'built_for_today',
                'today', 'warmup', 'blocks', 'cooldown', 'relaxations', 'adjustments'):
        assert key in wk, f'missing envelope key: {key}'
    for b in wk['blocks']:
        for key in ('block_id', 'sequence', 'type', 'structure', 'title', 'items', 'rest'):
            assert key in b, f'missing block key: {key}'
        for it in b['items']:
            for key in ('item_id', 'slot_id', 'role', 'exercise', 'prescription', 'cues', 'swap', 'progression'):
                assert key in it, f'missing item key: {key}'
            for key in ('id', 'name', 'equipment', 'equipment_label', 'primary_muscles', 'media'):
                assert key in it['exercise'], f'missing exercise key: {key}'
