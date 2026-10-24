"""
Compute a fixed, representative real-exercise thumbnail per preset for the Home carousel's drill-down cards
(Wes, Oct 2026 feedback #11): tapping an equipment hero (e.g. "Dumbbell Only") animates to its 3 body-part cards
(Full/Upper/Lower), each showing "the actual exercise thumbnails" for that preset -- not the curated shoot photo,
not a live-generated preview (that would mean 3 generator calls every time an equipment card is tapped, same
performance concern the preset-cards' own header comment already rules out for the top level).

Instead: pick ONE real exercise per preset, deterministically, from that preset's own curated specialty-catalog
pool (never a production-library item, so every pick's thumbnail_url is a plain lookup, not a live-DB query) --
preferring an exercise whose target_class actually matches the preset's own target (full/upper/lower) so the
three cards under one equipment look visibly different, not three photos of the same movement. Two equipment/
target combos (bodyweight_full, park_full) have no catalog item classified target_class=='full' at all --
hardcoded to a genuinely full-body movement (Squat Thrust) instead of falling through to a duplicate of the
_lower card's squat.

This is NOT run automatically and does NOT touch the database -- it only prints the
frontend/utils/v3Specialty.ts SPECIALTY_DRILLDOWN_THUMB object literal to paste in by hand. Re-run it whenever
the specialty catalog's thumbnails change (e.g. after migrate_specialty_thumbnails_to_cloudinary.py) to pick up
new URLs, or whenever a preset's curated pool changes enough that a better representative becomes available.

USAGE:
    cd backend && python3 compute_specialty_drilldown_thumbs.py
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from mood_v3.engines.specialty import adapter as AD
from mood_v3.engines.specialty import blueprints as BP
from add_specialty_exercises import build_import_records

PRESET_ORDER = [
    'barbell_full', 'barbell_upper', 'barbell_lower',
    'kettlebell_full', 'kettlebell_upper', 'kettlebell_lower',
    'dumbbells_full', 'dumbbells_upper', 'dumbbells_lower',
    'landmine_full', 'landmine_upper', 'landmine_lower',
    'bodyweight_full', 'bodyweight_upper', 'bodyweight_lower',
    'park_full', 'park_upper', 'park_lower',
]
# No bodyweight/park catalog item is classified target_class == 'full' (push-ups and squats dominate the
# catalog, both single-plane) -- hardcode a genuinely full-body movement for these two instead of falling
# through to a duplicate of the _lower card's exercise.
FULL_OVERRIDE = {'bodyweight_full': 'sp_squat_thrust', 'park_full': 'sp_squat_thrust'}


def pick_representative(preset_id, ready_by_id):
    if preset_id in FULL_OVERRIDE:
        pick_id = FULL_OVERRIDE[preset_id]
    else:
        target = BP.PRESETS[preset_id]['target']
        pool = AD.eligible_pool(preset_id, 'intermediate', production_only=False)
        catalog_items = [r for r in pool if r['id'].startswith('sp_')]
        matching = [r for r in catalog_items if r.get('target_class') == target]
        pick_id = (matching[0] if matching else catalog_items[0])['id']
    rec = ready_by_id[pick_id]
    return pick_id, rec['name'], rec['thumbnail_url']


def main():
    ready, _ = build_import_records()
    ready_by_id = {r['specialty_catalog_id']: r for r in ready}

    print('Representative exercise per preset:\n')
    lines = []
    for preset_id in PRESET_ORDER:
        exercise_id, name, url = pick_representative(preset_id, ready_by_id)
        print(f'  {preset_id:20s} -> {exercise_id:40s} {name}')
        lines.append(f"  {preset_id}: '{url}',")

    print('\nPaste into frontend/utils/v3Specialty.ts SPECIALTY_DRILLDOWN_THUMB:')
    print('export const SPECIALTY_DRILLDOWN_THUMB: Record<string, string> = {')
    print('\n'.join(lines))
    print('};')


if __name__ == '__main__':
    main()
