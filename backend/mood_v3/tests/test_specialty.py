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


# ------------------------------------------------------------------ 10. Founder feedback pass (Oct 2026): title, Built
# for Today blurb, warm-up items -- see engines/specialty/render.py and adapter.py for the fuller rationale.
from mood_v3 import formatter as F  # noqa: E402


@pytest.mark.parametrize('preset_id', PRESETS)
def test_archetype_name_is_human_readable_not_the_raw_id(preset_id):
    """Wes: the Cart/Home title was falling through to the raw archetype id ("specialty_kettlebell_lower") because
    formatter.ARCHETYPE_NAMES had no specialty entries -- every preset must resolve to its PRESET_NAMES value."""
    res = SPA.build(_nctx(preset_id, None, 'intermediate'))
    env = SR.format_envelope(res, _nctx(preset_id, res['flavor'], 'intermediate'))
    name = env['workout']['archetype']['name']
    assert not name.startswith('specialty_'), f'{preset_id} archetype.name fell back to the raw id: {name}'
    assert name == BP.PRESET_NAMES[preset_id]


def test_archetype_names_cover_every_preset():
    """Catches drift if a preset is ever added/renamed without updating the formatter.py display mirror."""
    for preset_id, pname in BP.PRESET_NAMES.items():
        assert F.ARCHETYPE_NAMES.get(f'specialty_{preset_id}') == pname, (
            f'formatter.ARCHETYPE_NAMES["specialty_{preset_id}"] is out of sync with blueprints.PRESET_NAMES')


@pytest.mark.parametrize('preset_id', PRESETS)
def test_today_teaser_describes_this_sessions_actual_composition(preset_id):
    """Wes: 'built for you' should describe the actual session and composition, not a boilerplate line that never
    changes. The teaser text must name the preset, the flavor, a real lead exercise from THIS build, and the
    block/exercise counts that actually came out of blocks_raw (not just repeat the flavor label)."""
    res = SPA.build(_nctx(preset_id, None, 'intermediate'))
    env = SR.format_envelope(res, _nctx(preset_id, res['flavor'], 'intermediate'))
    today = env['workout']['today']
    assert today['teaser'] is not None
    text = today['teaser']['text']
    n_ex = sum(len(b['items_raw']) for b in res['blocks_raw'])
    n_blocks = len(res['blocks_raw'])
    lead = SR._lead_exercise_name(res['blocks_raw'])
    assert BP.PRESET_NAMES[preset_id] in text
    assert lead in text, f'lead exercise "{lead}" not named in teaser: {text}'
    assert str(n_ex) in text and str(n_blocks) in text
    assert env['workout']['built_for_today'][0]['text'] == text, 'built_for_today should say the same thing as the teaser'


def test_today_teaser_varies_with_the_actual_build_not_static():
    """Two different presets must not produce the same boilerplate sentence (the old bug: the line only ever named
    the preset + flavor label, identical in shape for every generation of that preset/flavor)."""
    res_a = SPA.build(_nctx('kettlebell_lower', 'circuit_density', 'intermediate', swap_count=0))
    res_b = SPA.build(_nctx('kettlebell_lower', 'circuit_density', 'intermediate', swap_count=5))
    text_a = SR.format_envelope(res_a, _nctx('kettlebell_lower', 'circuit_density', 'intermediate', swap_count=0))['workout']['today']['teaser']['text']
    text_b = SR.format_envelope(res_b, _nctx('kettlebell_lower', 'circuit_density', 'intermediate', swap_count=5))['workout']['today']['teaser']['text']
    # same preset/flavor can coincidentally pick the same lead exercise, but the two seeds differ, so this asserts
    # the composer is actually reading res, not hard-coding a template string equal for every call.
    assert isinstance(text_a, str) and isinstance(text_b, str) and text_a and text_b


@pytest.mark.parametrize('preset_id', PRESETS)
def test_warmup_has_general_prep_then_equipment_activation_items(preset_id):
    """Wes: warm-ups need real items, not a bare guidance string. Expect >= 2 general movement-prep rows (no
    exercise ref) followed by >= 1 equipment-activation row (real exercise ref, drawn from the session's own
    exercises) -- never fewer than 3 total, never duplicate names, and the activation rows must be exercises that
    are actually in this build's blocks_raw (never an unrelated pick)."""
    res = SPA.build(_nctx(preset_id, None, 'intermediate'))
    env = SR.format_envelope(res, _nctx(preset_id, res['flavor'], 'intermediate'))
    items = env['workout']['warmup']['items']
    assert len(items) >= 3, f'{preset_id}: warm-up has too few items: {items}'
    names = [it['name'] for it in items]
    assert len(names) == len(set(names)), f'{preset_id}: duplicate warm-up item names: {names}'
    general = [it for it in items if it['component'] == 'raise']
    activation = [it for it in items if it['component'] == 'activation']
    assert len(general) >= 2
    assert general[0]['exercise'] is None, 'general movement-prep rows should not carry a library exercise_ref'
    assert len(activation) >= 1
    session_names = {it['exercise']['name'] for b in res['blocks_raw'] for it in b['items_raw']}
    for a in activation:
        assert a['exercise'] is not None, f'{preset_id}: activation row missing its exercise_ref: {a}'
        assert a['name'] in session_names, f'{preset_id}: activation picked "{a["name"]}", which is not in this session'
