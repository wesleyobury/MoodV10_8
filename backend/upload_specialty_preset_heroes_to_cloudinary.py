"""
Upload MOOD V3 Specialty's curated preset hero photos to Cloudinary (one-time, run once per new/changed shoot).

Wes (Oct 2026 feedback #10): "im seeing heros of exercise demonstration videos. use this defined set for each
preset (theres a new folder in v3 called preset heros)." Specialty previously had no photo shoot covering all 18
equipment x target presets, so its Cart/Home hero fell back to the cart's own first exercise thumbnail (see
firstExerciseThumb in frontend/utils/cartHero.ts) -- a video-demo still, not a curated photo. There is now a real
shoot, one photo per preset.

Source: "V3 Updates/Exercise Thumbnails/Preset Heros/p<NN>_<equipment>_<target>_body_<athlete>.jpg" (18 files,
1080 x 1350), filename equipment/target tokens mapped to the real preset id (EQ_MAP below handles the two tokens
that don't match 1:1: "kettlebells" -> "kettlebell", "outdoor" -> "park", per blueprints.PRESETS' own ids).

Uploads each to Cloudinary as mood/v3/cart_heroes/specialty/<preset_id>, same "mood/v3/..." convention as the
rest of the app's V3 imagery (cart_heroes/<archetype>.jpg for Strength/Sweat/Athletic, exercises_specialty/ for
the exercise thumbnails). Prints the frontend/utils/cartHero.ts V3_SPECIALTY_HEROES object literal (18 lines) to
paste in by hand -- this script never edits frontend code itself.

Idempotent: re-running overwrites the same public_ids in place (overwrite=True), so a reshoot of one or more
presets is just "drop the new file(s) in with the same pNN_ numbering and re-run."

USAGE:
    cd backend && python3 upload_specialty_preset_heroes_to_cloudinary.py
Credentials: backend/.env (CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET), already present.
"""
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

SRC_CANDIDATES = [
    os.path.expanduser('~/mnt/V3 Updates/Exercise Thumbnails/Preset Heros'),
    os.path.join(HERE, '..', 'V3 Updates', 'Exercise Thumbnails', 'Preset Heros'),
]
CLOUD_FOLDER = 'mood/v3/cart_heroes/specialty'
# Filename equipment token -> blueprints.PRESETS' equipment prefix (the two that don't match verbatim).
EQ_MAP = {'dumbbells': 'dumbbells', 'kettlebells': 'kettlebell', 'landmine': 'landmine', 'barbell': 'barbell',
          'bodyweight': 'bodyweight', 'outdoor': 'park'}
FILENAME_RE = re.compile(r'p\d\d_(\w+)_(full|upper|lower)_body_(\w+)\.jpg')


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
    sys.exit('ERROR: "Preset Heros" folder not found in any known location.')


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
        m = FILENAME_RE.match(fname)
        if not m:
            print(f'SKIP (filename does not match p<NN>_<equipment>_<full|upper|lower>_body_<athlete>.jpg): {fname}')
            continue
        eq, target, athlete = m.groups()
        if eq not in EQ_MAP:
            print(f'SKIP (unknown equipment token "{eq}"): {fname}')
            continue
        preset_id = f'{EQ_MAP[eq]}_{target}'
        public_id = f'{CLOUD_FOLDER}/{preset_id}'
        res = cloudinary.uploader.upload(os.path.join(src, fname), public_id=public_id, overwrite=True,
                                          invalidate=True, resource_type='image')
        uploaded[preset_id] = res['secure_url']
        print(f'OK {preset_id:20s} ({athlete:8s}) -> {res["secure_url"]}')

    print(f'\n{len(uploaded)} uploaded to {CLOUD_FOLDER}/.')
    order = ['barbell_full', 'barbell_upper', 'barbell_lower', 'kettlebell_full', 'kettlebell_upper',
             'kettlebell_lower', 'dumbbells_full', 'dumbbells_upper', 'dumbbells_lower', 'landmine_full',
             'landmine_upper', 'landmine_lower', 'bodyweight_full', 'bodyweight_upper', 'bodyweight_lower',
             'park_full', 'park_upper', 'park_lower']
    missing = [p for p in order if p not in uploaded]
    if missing:
        print(f'\nWARNING: no uploaded photo for: {missing} -- those presets keep their prior hero fallback.')
    print('\nPaste into frontend/utils/cartHero.ts V3_SPECIALTY_HEROES (only the ids that changed need updating):')
    for pid in order:
        if pid in uploaded:
            print(f"  {pid}: '{uploaded[pid]}',")


if __name__ == '__main__':
    main()
