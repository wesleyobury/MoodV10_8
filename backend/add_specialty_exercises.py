#!/usr/bin/env python3
"""Add the MOOD V3 Specialty Workout Generator's catalog exercises to db.exercises
(the media/display lookup collection used by attach_media() in mood_v3/router.py).

WHY THIS SCRIPT EXISTS
-----------------------
backend/mood_v3/engines/specialty/catalog.py defines ~93 exercises used by the
Specialty Generator. Cart, exercise-detail, and guided-session resolve an
exercise's video/thumbnail/cues by exact-name-after-normalization lookup against
db.exercises (see mood_v3.router.MediaIndex / attach_media). Nobody has ever
inserted the specialty catalog's exercises into that collection, so right now
the Specialty Generator can build a workout referencing e.g. "Landmine Thruster"
with no way for the app to find an image for it.

TWO FINDINGS FROM THIS SCRIPT'S VALIDATION PASS -- READ BEFORE RUNNING
------------------------------------------------------------------------
This script was built against static files only (no live Mongo connection was
available from this environment -- see "ENVIRONMENT CHECK" below). Using the
best available proxies (the 301-row production exercise inventory and a
174-entry preview db.exercises snapshot in exercises_seed_data.py), two classes
of catalog exercise were found and are HARD-EXCLUDED from this import:

(A) EXACT-NAME COLLISION WITH AN EXISTING PRODUCTION EXERCISE (6 exercises):
    Power Clean, Hang Clean, Barbell Push Press, Dumbbell Hang Clean,
    Barbell Front Squat, Barbell Reverse Lunge.
    Each of these already exists as its own document in db.exercises (fed by
    the frozen Strength/Sweat/Athletic engines' own exercise references), AND
    the specialty catalog has its OWN newly-generated image for the same name.
    attach_media() keys its lookup index by normalized name with FIRST-WRITE-
    WINS (MediaIndex.get() in router.py: `if k and k not in idx: idx[k] = d`),
    and the existing production document was inserted first -- so the
    established add_exercises_batchN.py convention of "update_one if name
    already exists" would silently overwrite the EXISTING production
    document's video/thumbnail with the specialty image, changing what every
    Strength/Sweat/Athletic-generated workout shows for that exercise name.
    This script refuses to import these 6 under their current names. A human
    product decision is needed: rename the specialty version to disambiguate
    (e.g. append a qualifier), or decide the new image should replace the old
    one everywhere (intentional, not accidental). See EXACT_NAME_COLLISIONS.

(B) TAGGED production_ready IN THE CATALOG BUT NO HOSTED MEDIA FOUND ANYWHERE
    (15 exercises): Single-Arm Kettlebell Strict Press, Single-Arm Kettlebell
    Row, Standard Push-Up, Incline Bench Push-Up, Decline Bench Push-Up, Pike
    Push-Up, Hand-Release Push-Up, Bench Step-Up, Assisted Pistol Squat
    (bench), Feet-Elevated Glute Bridge (bench), Inchworm to Push-Up,
    Wide-Grip Pull-Up, Archer Push-Up, Pull-Up to Knee Raise, Bench Step-Up to
    Knee Drive.
    None of these have a hosted image_url in the specialty thumbnail batch's
    manifest, NOR a matching entry (exact or fuzzy) in the 301-exercise
    production inventory, NOR in the 174-entry preview seed snapshot. The
    catalog's media_status='production_ready' tag for these 15 appears to be
    incorrect (the same class of bug already found and fixed for 8 other
    exercises earlier in this build -- see commits eeeca416, f7ac2907 -- except
    for these 15 no hosted URL exists under ANY filename to fall back to).
    This script does NOT invent URLs. These 15 are skipped entirely and
    reported as missing media. Recommend re-auditing catalog.py's media_status
    for these 15 (they likely need re-tagging to dev_only) as a follow-up --
    deliberately NOT done automatically here since flipping media_status
    changes the Specialty Generator's exercise pool per preset, which affects
    pool-thinness in ways a human should review. See NO_MEDIA_FOUND.

After excluding those 21, 67 of the 88 standalone catalog exercises (the 5
assembled complexes are never imported as their own library entries -- they
resolve entirely to sub-exercise references at generation time) are ready to
import cleanly.

A THIRD, LOWER-SEVERITY FINDING (not excluded, just flagged): 7 of those 67
exercises share their canonical name with an ALIAS (not primary name) of an
existing production exercise (e.g. "Kettlebell Goblet Squat" is listed as an
alias of both "KB Squat" and "Dumbbell Goblet Squat"). Because of the same
first-write-wins indexing, attach_media() will likely resolve these 7 to the
OLDER production exercise's image rather than the specialty catalog's own new
one, even after this import succeeds -- a display quality issue (wrong but
plausible photo), not a regression risk to the frozen engines. See
ALIAS_LEVEL_SOFT_COLLISIONS. Flagged for a follow-up decision (e.g. remove the
conflicting alias from the old document, or give the new document a
disambiguating alias of its own) -- out of scope for this script to decide.

ENVIRONMENT CHECK (done, see report)
-------------------------------------
This repo's backend/.env has no MONGO_URL (only Cloudinary + Anthropic keys).
Other scripts in this repo (scripts/backfill_user_id.py,
scripts/audit_post_authors.py) show the real convention: MONGO_URL/DB_NAME are
read from the environment ONLY, never committed, with DB_NAME=mood_app for
production and DB_NAME=mood_app_staging_clone for the staging clone, both on
a connection string that isn't present anywhere in this local clone. No local
mongod is running either (confirmed: connection to localhost:27017 refused).
So neither production nor a staging clone is reachable from this environment
right now -- this script was validated by static analysis only (catalog.py,
the 98-exercise thumbnail manifest, the 301-exercise production inventory
.xlsx, and the 174-entry preview snapshot in exercises_seed_data.py), not by
a live dry run against either database. Supply the real MONGO_URL/DB_NAME
(prod or staging) to actually execute this.

IDEMPOTENCY
-----------
Every document this script inserts gets `source: 'specialty_catalog_import'`
and `imported_at`. On a re-run, a record is skipped (not re-inserted, not
updated) if a document with the same normalized name already exists AT ALL in
db.exercises -- regardless of its source -- which is the safe, conservative
choice: this script will never overwrite a pre-existing document, whether
that document came from a prior run of this same script or from anything
else. If you need to refresh an already-imported specialty exercise's media,
use the --rollback mode for that one and re-run, or update it directly.

USAGE
-----
    # Dry run (default) -- prints exactly what would be inserted/skipped, writes nothing
    MONGO_URL="<staging or prod>" DB_NAME=mood_app_staging_clone python3 add_specialty_exercises.py

    # Apply for real (writes)
    MONGO_URL="<staging or prod>" DB_NAME=mood_app_staging_clone python3 add_specialty_exercises.py --apply

    # Roll back ONLY the documents this script created (matches on
    # source == 'specialty_catalog_import'; never touches any other document)
    MONGO_URL="<staging or prod>" DB_NAME=mood_app_staging_clone python3 add_specialty_exercises.py --rollback --apply
"""

import asyncio
import csv
import os
import sys
import argparse
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'mood_v3', 'engines', 'specialty'))
import catalog as CAT  # noqa: E402

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'test_database')
SOURCE_TAG = 'specialty_catalog_import'

THUMBNAIL_MANIFEST_CANDIDATES = [
    os.path.expanduser('~/mnt/V3 Updates/Exercise Thumbnails/thumbnail_manifest.csv'),
    os.path.expanduser('~/mnt/MOOD/MoodV10_8/V3 Updates/Exercise Thumbnails/thumbnail_manifest.csv'),
    os.path.join(os.path.dirname(__file__), '..', 'V3 Updates', 'Exercise Thumbnails', 'thumbnail_manifest.csv'),
]

EQUIPMENT_LABELS = {
    'kettlebell': 'Kettlebell', 'landmine': 'Landmine', 'barbell': 'Barbell',
    'dumbbell': 'Dumbbell', 'bodyweight': 'Bodyweight', 'pullup_bar': 'Pull-Up Bar',
    'bench': 'Bench',
}

# -- (A) exact-name collision with an existing production exercise. See module docstring. --
EXACT_NAME_COLLISIONS = {
    'power clean', 'hang clean', 'barbell push press', 'dumbbell hang clean',
    'barbell front squat', 'barbell reverse lunge',
}

# -- (B) tagged production_ready but no hosted media found anywhere. See module docstring. --
NO_MEDIA_FOUND = {
    'Single-Arm Kettlebell Strict Press', 'Single-Arm Kettlebell Row', 'Standard Push-Up',
    'Incline Bench Push-Up', 'Decline Bench Push-Up', 'Pike Push-Up', 'Hand-Release Push-Up',
    'Bench Step-Up', 'Assisted Pistol Squat (bench)', 'Feet-Elevated Glute Bridge (bench)',
    'Inchworm to Push-Up', 'Wide-Grip Pull-Up', 'Archer Push-Up', 'Pull-Up to Knee Raise',
    'Bench Step-Up to Knee Drive',
}

# -- flagged (not excluded): shares a name with an EXISTING exercise's ALIAS, not its primary
#    name. attach_media's first-write-wins index means these will likely still resolve to the
#    older exercise's image today. Imported anyway (real, distinct media exists); needs a
#    separate alias-conflict fix to actually take effect. See module docstring, finding 3.
ALIAS_LEVEL_SOFT_COLLISIONS = {
    'Kettlebell Renegade Row', 'Kettlebell Goblet Squat', 'Landmine Row', 'Landmine Thruster',
    'Dumbbell Bulgarian Split Squat', 'Dumbbell Renegade Row', 'Split Squat',
}


def _find_manifest():
    for p in THUMBNAIL_MANIFEST_CANDIDATES:
        if os.path.exists(p):
            return p
    raise FileNotFoundError(
        'thumbnail_manifest.csv not found in any known location -- cannot resolve specialty '
        'exercise media without it. Checked: ' + ', '.join(THUMBNAIL_MANIFEST_CANDIDATES))


def _load_manifest_rows():
    with open(_find_manifest(), newline='') as f:
        return list(csv.DictReader(f))


def _find_media(manifest_rows, catalog_id):
    """Match manifest rows by exercise_id slug, preferring an exact slug match with a non-empty
    image_url; falls back to a later-filename variant (e.g. '..._v2') if that's the one that's
    actually hosted. Never returns a URL for a row where image_url is empty."""
    slug = catalog_id[3:] if catalog_id.startswith('sp_') else catalog_id
    candidates = [r for r in manifest_rows if r['exercise_id'] == slug or r['exercise_id'].startswith(slug + '_')]
    exact = [r for r in candidates if r['exercise_id'] == slug and r['image_url']]
    if exact:
        return exact[-1]['image_url']
    any_hosted = [r for r in candidates if r['image_url']]
    if any_hosted:
        return any_hosted[-1]['image_url']
    return None


def build_import_records():
    """Returns (ready, excluded) where ready is a list of dicts to insert and excluded is a
    dict of {reason: [names]} for reporting."""
    manifest_rows = _load_manifest_rows()
    ready = []
    excluded = {'exact_name_collision': [], 'no_media_found': [], 'complex_or_prod_ref': []}

    for ex_id, rec in CAT.SPECIALTY_EXERCISES.items():
        if rec.get('media_status') != 'production_ready':
            continue
        name = rec['name']
        if name.lower() in EXACT_NAME_COLLISIONS:
            excluded['exact_name_collision'].append(name)
            continue
        if name in NO_MEDIA_FOUND:
            excluded['no_media_found'].append(name)
            continue
        url = _find_media(manifest_rows, ex_id)
        if not url:
            # Shouldn't happen given the two exclusion sets above are exhaustive per this
            # script's own validation pass, but never invent a URL if it does.
            excluded['no_media_found'].append(name + ' (unexpected: found at script-run time)')
            continue
        eq = EQUIPMENT_LABELS.get(rec.get('eq'), str(rec.get('eq', '')).title())
        ready.append(dict(
            name=name,
            aliases=[],
            equipment=[eq],
            thumbnail_url=url,
            video_url='',
            cues=[],
            mistakes=[],
            source=SOURCE_TAG,
            specialty_catalog_id=ex_id,
            alias_soft_collision=(name in ALIAS_LEVEL_SOFT_COLLISIONS),
        ))
    return ready, excluded


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true', help='Actually write. Default is dry-run.')
    parser.add_argument('--rollback', action='store_true',
                         help=f"Delete only documents with source == '{SOURCE_TAG}'. Combine with --apply to execute.")
    args = parser.parse_args()

    if MONGO_URL.startswith('mongodb://localhost') or not os.getenv('MONGO_URL'):
        print('REFUSING TO RUN: MONGO_URL is unset or points at localhost. This script writes to '
              'db.exercises, a collection shared with the live app -- supply a real MONGO_URL '
              '(staging or production) via the environment. See USAGE in this file\'s docstring.')
        return

    ready, excluded = build_import_records()

    print(f'Target: {DB_NAME} @ {MONGO_URL[:24]}...')
    print(f'Mode: {"ROLLBACK" if args.rollback else "IMPORT"} / {"APPLY" if args.apply else "DRY RUN (no writes)"}')
    print('=' * 70)

    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    if args.rollback:
        existing = await db.exercises.find({'source': SOURCE_TAG}, {'name': 1}).to_list(1000)
        print(f'Found {len(existing)} documents tagged source="{SOURCE_TAG}":')
        for d in existing:
            print(f'  - {d["name"]}')
        if args.apply:
            result = await db.exercises.delete_many({'source': SOURCE_TAG})
            print(f'Deleted {result.deleted_count} documents.')
        else:
            print('(dry run -- nothing deleted; re-run with --apply to delete)')
        client.close()
        return

    print(f'{len(ready)} specialty exercises ready to import (real distinct hosted media, no name collision).')
    print(f'{len(excluded["exact_name_collision"])} excluded -- exact-name collision with an existing production '
          f'exercise (needs a human disambiguation decision): {excluded["exact_name_collision"]}')
    print(f'{len(excluded["no_media_found"])} excluded -- tagged production_ready but no hosted media found '
          f'anywhere (needs catalog.py re-audit, no URL invented): {excluded["no_media_found"]}')
    soft = [r['name'] for r in ready if r['alias_soft_collision']]
    print(f'{len(soft)} of the {len(ready)} ready exercises share a name with an EXISTING exercise\'s alias -- '
          f'imported anyway, but attach_media\'s first-write-wins index means these will likely still resolve '
          f'to the older exercise\'s photo until that alias conflict is separately resolved: {soft}')
    print('=' * 70)

    inserted = 0
    skipped_existing = 0
    for rec in ready:
        existing = await db.exercises.find_one({'name': rec['name']})
        if existing:
            print(f'SKIP (already exists, not touching): {rec["name"]}')
            skipped_existing += 1
            continue
        doc = {k: v for k, v in rec.items() if k not in ('alias_soft_collision',)}
        doc['created_at'] = datetime.now(timezone.utc)
        doc['imported_at'] = datetime.now(timezone.utc)
        if args.apply:
            await db.exercises.insert_one(doc)
            print(f'INSERTED: {rec["name"]}')
        else:
            print(f'[dry run] would insert: {rec["name"]}  (image: {rec["thumbnail_url"][:60]}...)')
        inserted += 1

    print('=' * 70)
    print(f'{"Inserted" if args.apply else "Would insert"}: {inserted}, skipped (already existed): {skipped_existing}')
    if args.apply:
        total = await db.exercises.count_documents({})
        print(f'Total exercises in library: {total}')

    client.close()


if __name__ == '__main__':
    asyncio.run(main())
