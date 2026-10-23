"""
Migrate the MOOD V3 Specialty Workout Generator's catalog thumbnails from CloudFront
(d8j0ntlcm91z4.cloudfront.net -- the raw AI-photoshoot host) to Cloudinary, so they get
the same f_auto/q_auto/w_<n> on-the-fly resize/recompress treatment every other image in
the app already gets (utils/cloudinaryImage.ts's optimizedImageUrl only transforms
Cloudinary delivery URLs; CloudFront URLs pass through unchanged at full original
resolution -- the root cause of "hero loads slowly" for Specialty, Oct 2026).

What this does:
  1. Reads the 86 ready specialty catalog exercises (add_specialty_exercises.build_import_records()).
  2. For each, uploads its current CloudFront thumbnail_url to Cloudinary via a remote-fetch
     upload (Cloudinary downloads it server-side -- no local file needed), public_id =
     "mood/v3/exercises_specialty/<specialty_catalog_id>", same "mood/v3/..." convention as
     the rest of the app's V3 imagery (cart_heroes/, exercises/).
  3. Rewrites V3 Updates/Exercise Thumbnails/thumbnail_manifest.csv in place: every row whose
     image_url exactly matches a migrated CloudFront URL gets the new Cloudinary secure_url.
     This keeps the manifest as the single source of truth build_import_records() reads, so a
     fresh/rolled-back-and-redone import picks up Cloudinary URLs automatically.
  4. Writes specialty_thumbnail_migration_map.json (old_url -> new_url, keyed by
     specialty_catalog_id too) for the next step: a live-database `thumbnail_url` update for
     the 86 documents already imported into db.exercises (separate, since this script never
     touches a live database -- see USAGE below).

Idempotent: re-running with --apply overwrites the same public_ids in place (overwrite=True),
so interrupting and re-running is safe.

USAGE:
    cd backend && pip install cloudinary  (already installed if you're reading this after a run)
    python3 migrate_specialty_thumbnails_to_cloudinary.py            # dry run, no uploads, no file writes
    python3 migrate_specialty_thumbnails_to_cloudinary.py --apply    # uploads + rewrites the manifest CSV

Credentials: backend/.env (CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET), already present.
"""
import argparse
import csv
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

MANIFEST_CANDIDATES = [
    os.path.expanduser('~/mnt/V3 Updates/Exercise Thumbnails/thumbnail_manifest.csv'),
    os.path.join(HERE, '..', 'V3 Updates', 'Exercise Thumbnails', 'thumbnail_manifest.csv'),
]
MAP_OUT = os.path.join(HERE, 'specialty_thumbnail_migration_map.json')
CLOUD_FOLDER = 'mood/v3/exercises_specialty'


def load_env():
    env = {}
    env_path = os.path.join(HERE, '.env')
    if not os.path.exists(env_path):
        sys.exit('ERROR: backend/.env not found -- run this from the backend/ folder.')
    for line in open(env_path):
        line = line.strip()
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            env[k] = v.strip().strip('"')
    for key in ('CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'):
        if not env.get(key):
            sys.exit(f'ERROR: {key} missing from backend/.env')
    return env


def find_manifest():
    for p in MANIFEST_CANDIDATES:
        if os.path.exists(p):
            return p
    sys.exit('ERROR: thumbnail_manifest.csv not found in any known location.')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--apply', action='store_true', help='Actually upload + rewrite the manifest. Default is dry-run.')
    args = parser.parse_args()

    from add_specialty_exercises import build_import_records
    ready, excluded = build_import_records()
    cloudfront_items = [r for r in ready if 'cloudfront.net' in r['thumbnail_url']]
    already_cloudinary = [r for r in ready if 'cloudinary.com' in r['thumbnail_url']]

    print(f'{len(ready)} ready specialty exercises total.')
    print(f'{len(cloudfront_items)} on CloudFront (need migration).')
    print(f'{len(already_cloudinary)} already on Cloudinary (skipped).')
    if excluded['no_media_found'] or excluded['exact_name_collision']:
        print(f"NOTE: {len(excluded['no_media_found'])} no_media_found, {len(excluded['exact_name_collision'])} exact_name_collision excluded (unrelated to this migration).")

    if not args.apply:
        print('\nDRY RUN -- no uploads, no file writes. Re-run with --apply to migrate.')
        for r in cloudfront_items[:5]:
            print(f"  would upload: {r['name']:45s} {r['thumbnail_url'][:70]}...")
        if len(cloudfront_items) > 5:
            print(f'  ... and {len(cloudfront_items) - 5} more')
        return

    try:
        import cloudinary
        import cloudinary.uploader
    except ImportError:
        sys.exit('ERROR: cloudinary not installed. Run: pip install cloudinary')

    env = load_env()
    cloudinary.config(
        cloud_name=env['CLOUDINARY_CLOUD_NAME'],
        api_key=env['CLOUDINARY_API_KEY'],
        api_secret=env['CLOUDINARY_API_SECRET'],
        secure=True,
    )

    # Resumable: load any mapping already written (by a prior, possibly-timed-out run) and skip those ids.
    existing = dict(mapping={}, failures=[])
    if os.path.exists(MAP_OUT):
        with open(MAP_OUT) as f:
            existing = json.load(f)
    mapping = existing.get('mapping', {})
    done_ids = set(mapping)
    todo = [r for r in cloudfront_items if r['specialty_catalog_id'] not in done_ids]
    print(f'{len(done_ids)} already migrated in a prior run; {len(todo)} remaining.')

    failures = []
    max_this_run = int(os.environ.get('MIGRATE_BATCH_SIZE', '0')) or len(todo)
    batch = todo[:max_this_run]
    print(f'\nUploading {len(batch)} image(s) this run to {CLOUD_FOLDER}/ ...\n')
    for i, r in enumerate(batch, 1):
        cat_id = r['specialty_catalog_id']
        public_id = f"{CLOUD_FOLDER}/{cat_id}"
        try:
            res = cloudinary.uploader.upload(
                r['thumbnail_url'],
                public_id=public_id,
                overwrite=True,
                invalidate=True,
                resource_type='image',
            )
            new_url = res['secure_url']
            mapping[cat_id] = dict(old_url=r['thumbnail_url'], new_url=new_url, name=r['name'])
            print(f'  [{i}/{len(batch)}] OK   {r["name"]:45s} -> {new_url}')
        except Exception as e:
            failures.append(dict(specialty_catalog_id=cat_id, name=r['name'], error=str(e)))
            print(f'  [{i}/{len(batch)}] FAIL {r["name"]:45s} {e}')
        # Write after EVERY upload, not just at the end, so a timeout never loses progress.
        with open(MAP_OUT, 'w') as f:
            json.dump(dict(mapping=mapping, failures=failures), f, indent=2)

    remaining = len(cloudfront_items) - len(mapping)
    print(f'\n{len(mapping)}/{len(cloudfront_items)} migrated total ({remaining} remaining). Mapping at {MAP_OUT}')
    if remaining > 0:
        print('Re-run this script (same --apply command) to continue -- already-done ids are skipped automatically.')
        return

    if not mapping:
        print('Nothing uploaded successfully -- leaving the manifest untouched.')
        return

    manifest_path = find_manifest()
    old_to_new = {v['old_url']: v['new_url'] for v in mapping.values()}
    with open(manifest_path, newline='') as f:
        rows = list(csv.DictReader(f))
        fieldnames = rows[0].keys() if rows else None
    changed = 0
    for row in rows:
        if row.get('image_url') in old_to_new:
            row['image_url'] = old_to_new[row['image_url']]
            changed += 1
    if fieldnames:
        with open(manifest_path, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
    print(f'Updated {changed} row(s) in {manifest_path}')

    if failures:
        print(f'\n{len(failures)} upload(s) failed -- their manifest rows and db.exercises records still point at CloudFront. Re-run this script to retry just those (idempotent).')


if __name__ == '__main__':
    main()
