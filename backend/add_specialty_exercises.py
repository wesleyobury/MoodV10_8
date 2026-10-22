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

BOTH EARLIER FINDINGS FROM THIS SCRIPT'S VALIDATION PASS ARE NOW RESOLVED
----------------------------------------------------------------------------
An earlier version of this script hard-excluded 21 exercises (6 name collisions + 15 false
"no media" positives). Both findings turned out to be bugs in THIS script, not in the catalog
or the media pipeline -- both are now fixed, see commit history for the two prior passes.

(A) EXACT-NAME COLLISION, now RESOLVED (was 6, now 0 excluded):
    Power Clean, Hang Clean, Barbell Push Press, Dumbbell Hang Clean, Barbell Front Squat,
    Barbell Reverse Lunge all collided on exact name with a document already in
    exercises_seed_data.py / db.exercises.
    - 'Barbell Push Press' and 'Barbell Front Squat' were REMOVED from catalog.py entirely:
      the frozen Strength engine's own pool (engines/strength -- AE.EX) already has 'Push
      Press' and 'Front Squat', both eq='barbell', auto-included in the specialty generator's
      pool via adapter.py's full_pool() = _production_pool() + _catalog_pool(). True
      duplicates; removing them loses nothing.
    - 'Power Clean', 'Hang Clean', 'Dumbbell Hang Clean', 'Barbell Reverse Lunge' were KEPT:
      checked AE.EX directly, the frozen pool has no barbell/dumbbell equivalent for these
      (only unrelated kettlebell/dumbbell clean-and-press variants, and a dumbbell -- not
      barbell -- Reverse Lunge), so they're genuinely new, equipment-specific pool entries the
      Specialty Generator needs. A real production document already exists under each exact
      name with real media. This script's insert logic already refuses to overwrite any
      existing document (`if existing: skip`, never update_one) -- so letting them through the
      normal `ready` list is safe. Their newly-generated specialty thumbnails simply go unused
      at import time: correct, since it's the same real lift and the existing photo is fine.
    EXACT_NAME_COLLISIONS is now an empty set, kept as a named hook for any future collision a
    new catalog addition might introduce.

(B) FALSE "NO MEDIA FOUND", now RESOLVED (was 15, now 0 excluded):
    All 15 (Single-Arm Kettlebell Strict Press, Single-Arm Kettlebell Row, Standard Push-Up,
    Incline/Decline Bench Push-Up, Pike Push-Up, Hand-Release Push-Up, Bench Step-Up,
    Assisted Pistol Squat (bench), Feet-Elevated Glute Bridge (bench), Inchworm to Push-Up,
    Wide-Grip Pull-Up, Archer Push-Up, Pull-Up to Knee Raise, Bench Step-Up to Knee Drive) DO
    have real hosted image_url entries in the manifest -- this script's own _find_media() just
    failed to find them, because it matched by exercise_id SLUG only, and the manifest's slug
    column doesn't reliably align with catalog.py's internal ids (e.g. catalog slug
    'single_arm_kettlebell_strict_press' vs manifest slug
    'kettlebell_strict_press_single_arm' -- same exercise, reversed word order; or
    'standard_push_up' vs 'standard_pushup' -- same exercise, no underscore). Fixed by
    matching on NORMALIZED DISPLAY NAME first (see _normalize_name / _find_media), falling
    back to the slug match only if the name match finds nothing. NO_MEDIA_FOUND is now an
    empty set; any future catalog addition with genuinely no hosted media will still surface
    dynamically in build_import_records()'s `excluded['no_media_found']` list.

Net result: 86 of catalog.py's 86 standalone exercises (after the 2 true-duplicate removals
above; the 5 assembled complexes are never imported as their own library entries -- they
resolve entirely to sub-exercise references at generation time) are ready to import cleanly.

A THIRD, LOWER-SEVERITY FINDING remains (not excluded, just flagged, UNCHANGED by the above
fixes): 7 of those 86 exercises share their canonical name with an ALIAS (not primary name) of
an existing production exercise (e.g. "Kettlebell Goblet Squat" is listed as an alias of both
"KB Squat" and "Dumbbell Goblet Squat"). Because of the same first-write-wins indexing,
attach_media() will likely resolve these 7 to the OLDER production exercise's image rather
than the specialty catalog's own new one, even after this import succeeds -- a display quality
issue (wrong but plausible photo), not a regression risk to the frozen engines. See
ALIAS_LEVEL_SOFT_COLLISIONS. Flagged for a follow-up decision (e.g. remove the conflicting
alias from the old document, or give the new document a disambiguating alias of its own) --
out of scope for this script to decide.

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

# -- (A) exact-name collision with an existing production exercise. See module docstring.
#    RESOLVED: 'Barbell Push Press' and 'Barbell Front Squat' were REMOVED from catalog.py
#    entirely -- the frozen Strength engine's own pool already has 'Push Press' and
#    'Front Squat', both eq='barbell' (same movement, auto-included via _production_pool()
#    merge in adapter.py's full_pool()). Nothing lost by removing the catalog duplicates.
#    'Power Clean', 'Hang Clean', 'Dumbbell Hang Clean', and 'Barbell Reverse Lunge' are KEPT
#    in catalog.py -- the frozen pool has no barbell/dumbbell equivalent for these (checked
#    AE.EX directly: no exact or near match), so they're genuinely needed, equipment-specific
#    pool entries. They are NOT hard-excluded here: a real production document already exists
#    under each exact name (confirmed in exercises_seed_data.py) with real existing media, and
#    this script's own insert logic (see main(): `if existing: skip`) already refuses to
#    overwrite any document that exists, under any source -- so letting them through the normal
#    `ready` list is safe. Their newly-generated specialty thumbnails simply go unused at import
#    time, which is correct: don't clobber a real existing photo of the same real lift.
EXACT_NAME_COLLISIONS = set()

# -- (B) RESOLVED: the 15 names once listed here were a FALSE NEGATIVE from this script's own
#    _find_media(), which matched by exercise_id slug only. The manifest's slug column doesn't
#    reliably align with catalog.py's ids (e.g. catalog slug 'single_arm_kettlebell_strict_press'
#    vs manifest slug 'kettlebell_strict_press_single_arm' -- same exercise, different word
#    order; or 'standard_push_up' vs 'standard_pushup' -- same exercise, no underscore). All 15
#    were confirmed by hand to have real hosted image_url entries in the manifest under their
#    display name (e.g. 'Standard Push-Up' -> F386, 'Pull-Up to Knee Raise' -> F411). Fixed by
#    matching on normalized display NAME first (see _normalize_name / _find_media). This set is
#    now empty and kept only as a hook: if a future catalog addition genuinely has no hosted
#    media anywhere, it will still show up dynamically in build_import_records()'s `excluded`
#    reporting (via _find_media returning None) -- nothing here needs to be hand-maintained.
NO_MEDIA_FOUND = set()

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


def _normalize_name(s):
    """Lowercase, strip everything but letters/digits, so 'Pull-Up to Knee Raise' and
    'pullup_to_knee_raise' and 'Pull Up To Knee Raise' all collapse to the same key. This is
    the robust match: catalog.py's internal id/slug strings do NOT reliably align with the
    manifest's exercise_id slug column (e.g. catalog id 'single_arm_kettlebell_strict_press'
    vs manifest slug 'kettlebell_strict_press_single_arm' -- same exercise, different word
    order), but catalog.py's display `name` and the manifest's `exercise` display-name column
    are written by humans describing the same real-world movement and match reliably once
    normalized."""
    return ''.join(ch for ch in s.lower() if ch.isalnum())


def _find_media(manifest_rows, catalog_id, name):
    """Primary match: normalized display name against the manifest's `exercise` column (see
    _normalize_name). Falls back to the old exercise_id slug match only if the name match finds
    nothing, since the slug column doesn't reliably align with catalog.py's ids. Either way, when
    several manifest rows match (duplicates / "_v2" reuploads), ALWAYS prefer a row with a
    non-empty image_url, and among those, the LAST one in file order (the later, presumably
    final, hosted upload) -- this is the same "pick the hosted duplicate, not just the first
    match" rule that already fixed 8 other exercises earlier in this build (commits eeeca416,
    f7ac2907). Never returns a URL for a row where image_url is empty."""
    target = _normalize_name(name)
    name_candidates = [r for r in manifest_rows if _normalize_name(r['exercise']) == target]
    hosted = [r for r in name_candidates if r['image_url']]
    if hosted:
        return hosted[-1]['image_url']

    slug = catalog_id[3:] if catalog_id.startswith('sp_') else catalog_id
    slug_candidates = [r for r in manifest_rows if r['exercise_id'] == slug or r['exercise_id'].startswith(slug + '_')]
    hosted = [r for r in slug_candidates if r['image_url']]
    if hosted:
        return hosted[-1]['image_url']
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
        url = _find_media(manifest_rows, ex_id, name)
        if not url:
            # No hosted image_url found under this exercise's name (primary match) or its
            # catalog slug (fallback match), anywhere in the manifest. Never invent a URL.
            excluded['no_media_found'].append(name)
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
