"""Sync the V3 exercise thumbnail library to Cloudinary and regenerate frontend/utils/v3ExerciseThumbs.ts.

    python3 mood_v3/qa/exercise_thumbs_sync.py <tracker.csv> <thumbnails dir>   (run from backend/; needs `pip install cloudinary pillow`)

Reads the tracker (final_#, exercise_id, exercise, athlete, image_url, file_name), resizes each PNG to 720 x 900 JPEG q90, uploads it
as mood/v3/exercises/<exercise_id> (overwrite + CDN invalidate), then rewrites the TypeScript map with the returned versions.
Credentials: CLOUDINARY_URL env (required).
"""
import csv, io, json, os, sys
import cloudinary, cloudinary.uploader
from PIL import Image

TS = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'frontend', 'utils', 'v3ExerciseThumbs.ts')


def main(tracker, folder):
    if not os.environ.get('CLOUDINARY_URL'):
        sys.exit('Set CLOUDINARY_URL (cloudinary://<key>:<secret>@<cloud>) before running.')
    rows = list(csv.DictReader(open(tracker)))
    ids = [r['exercise_id'] for r in rows]
    assert len(ids) == len(set(ids)), 'duplicate exercise_id in tracker'
    out = {}
    for r in rows:
        im = Image.open(os.path.join(folder, r['file_name'])).convert('RGB').resize((720, 900), Image.LANCZOS)
        buf = io.BytesIO(); im.save(buf, 'JPEG', quality=90, optimize=True); buf.seek(0)
        res = cloudinary.uploader.upload(buf, public_id=f"mood/v3/exercises/{r['exercise_id']}", overwrite=True, invalidate=True,
                                         context={'exercise': r['exercise'], 'final': r['final_#'], 'athlete': r['athlete']}, tags=['mood_v3_exercise_thumb'])
        out[r['exercise_id']] = res['version']
        print(r['final_#'], r['exercise_id'], res['bytes'], file=sys.stderr)
    lines = [f"  {r['exercise_id']}: 'v{out[r['exercise_id']]}', // {r['final_#']} {r['exercise']}" for r in rows]
    src = open(TS).read()
    a = src.index('export const V3_EXERCISE_THUMBS'); b = src.index('};', a) + 2
    src = src[:a] + 'export const V3_EXERCISE_THUMBS: Record<string, string> = {\n' + '\n'.join(lines) + '\n};' + src[b:]
    open(TS, 'w').write(src)
    print(f'{len(out)} thumbnails synced; {TS} rewritten')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
