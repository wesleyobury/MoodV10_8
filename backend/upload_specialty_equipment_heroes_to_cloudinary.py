"""
Upload the 6 EQUIPMENT-level hero photos for the Home carousel (Wes, Oct 2026 feedback #12 -- a correction of
feedback #10/#11: the earlier "Preset Heros" folder holding 18 photos (one per preset) was the wrong set for
this; these 6 true 16:9 photos, one per equipment category, are the right ones).

Source: "V3 Updates/Cart Heroes/preset heros/" (lowercase, nested inside Cart Heroes -- note this is a
DIFFERENT folder from "V3 Updates/Exercise Thumbnails/Preset Heros/", the 18-photo per-PRESET set used
elsewhere for frontend/utils/cartHero.ts's V3_SPECIALTY_HEROES, which still backs the actual Cart hero for a
generated workout and is untouched by this script). These 6 files are genuinely 2752x1536 (16:9).

Filename -> app equipment key mapping: barbell/kettlebell/landmine map 1:1; "dumbbell.png" -> dumbbells (the
app's key is plural); "park.png" -> outdoor_park. "athlete.png" has no equipment-key counterpart in the app --
there is no "athlete" equipment category, and the file set is missing a "bodyweight" shot. Assumed
athlete.png IS the bodyweight photo (the only equipment category left over once the other 5 are matched) --
flagged to Wes rather than silently assumed; swap ATHLETE_IS_BODYWEIGHT's target below if that's wrong.

Uploads to mood/v3/cart_heroes/specialty_equipment/<equipment_key> -- a new, separate Cloudinary path from
mood/v3/cart_heroes/specialty/<preset_id> (the 18-photo set), so neither migration can collide with the other.

Idempotent: re-running overwrites the same public_ids in place.

USAGE:
    cd backend && python3 upload_specialty_equipment_heroes_to_cloudinary.py
Credentials: backend/.env (CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET), already present.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

SRC_CANDIDATES = [
    os.path.expanduser('~/mnt/V3 Updates/Cart Heroes/preset heros'),
    os.path.join(HERE, '..', 'V3 Updates', 'Cart Heroes', 'preset heros'),
]
CLOUD_FOLDER = 'mood/v3/cart_heroes/specialty_equipment'
# filename stem -> app equipment key. "athlete" assumed == bodyweight (see module docstring).
FILE_TO_EQUIPMENT = {
    'barbell': 'barbell', 'kettlebell': 'kettlebell', 'dumbbell': 'dumbbells',
    'landmine': 'landmine', 'park': 'outdoor_park', 'athlete': 'bodyweight',
}


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


def find_src():
    for p in SRC_CANDIDATES:
        if os.path.isdir(p):
            return p
    sys.exit('ERROR: "V3 Updates/Cart Heroes/preset heros" folder not found in any known location.')


def main():
    try:
        import cloudinary
        import cloudinary.uploader
    except ImportError:
        sys.exit('ERROR: cloudinary not installed. Run: pip install cloudinary')

    env = load_env()
    cloudinary.config(cloud_name=env['CLOUDINARY_CLOUD_NAME'], api_key=env['CLOUDINARY_API_KEY'],
                       api_secret=env['CLOUDINARY_API_SECRET'], secure=True)

    src = find_src()
    uploaded = {}
    for fname in sorted(os.listdir(src)):
        stem = os.path.splitext(fname)[0]
        eq = FILE_TO_EQUIPMENT.get(stem)
        if not eq:
            print(f'SKIP (no equipment mapping for "{stem}"): {fname}')
            continue
        public_id = f'{CLOUD_FOLDER}/{eq}'
        res = cloudinary.uploader.upload(os.path.join(src, fname), public_id=public_id, overwrite=True,
                                          invalidate=True, resource_type='image')
        uploaded[eq] = res['secure_url']
        print(f'OK {eq:14s} (from {fname}) -> {res["secure_url"]}')

    order = ['barbell', 'kettlebell', 'dumbbells', 'landmine', 'bodyweight', 'outdoor_park']
    missing = [e for e in order if e not in uploaded]
    if missing:
        print(f'\nWARNING: no uploaded photo for: {missing}')
    print(f'\n{len(uploaded)} uploaded to {CLOUD_FOLDER}/.')
    print('\nPaste into frontend/utils/v3Specialty.ts SPECIALTY_EQUIPMENT_HERO:')
    for eq in order:
        if eq in uploaded:
            print(f"  {eq}: '{uploaded[eq]}',")


if __name__ == '__main__':
    main()
