"""
One-time migration: move featured-workout HERO images off the raw Emergent CDN
(full-size PNGs) onto Cloudinary, so they can be delivered resized + auto-format.

What it does:
  1. Reads the 6 hero URLs from seed_data.py (PREVIEW_FEATURED_WORKOUTS).
  2. Uploads each to your Cloudinary account via remote fetch (Cloudinary pulls
     the image server-side — no large local downloads), using a stable public_id
     so re-running overwrites in place instead of creating duplicates.
  3. Rewrites the old URL -> new Cloudinary URL in:
       - backend/seed_data.py        (runtime source of truth; backend syncs to DB on startup)
       - frontend/hooks/useFeaturedWorkouts.ts  (offline fallback defaults)
  4. Writes backend/featured_hero_map.json with the before/after mapping.

The stored URLs are bare Cloudinary delivery URLs (.../image/upload/...); the app's
optimizedImageUrl() helper injects f_auto,q_auto,c_limit,w_ at render time.

Run from the backend/ folder:
    pip install cloudinary
    python3 migrate_featured_heroes_to_cloudinary.py

Credentials are read from backend/.env (CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET).
Idempotent and safe to re-run.
"""

import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(HERE)
SEED_PATH = os.path.join(HERE, "seed_data.py")
FRONTEND_HOOK = os.path.join(REPO_ROOT, "frontend", "hooks", "useFeaturedWorkouts.ts")
MAP_OUT = os.path.join(HERE, "featured_hero_map.json")


def load_env():
    env = {}
    env_path = os.path.join(HERE, ".env")
    if not os.path.exists(env_path):
        sys.exit("ERROR: backend/.env not found — run this from the backend/ folder.")
    for line in open(env_path):
        line = line.strip()
        if "=" in line and not line.startswith("#"):
            k, v = line.split("=", 1)
            env[k] = v.strip().strip('"')
    for key in ("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"):
        if not env.get(key):
            sys.exit(f"ERROR: {key} missing from backend/.env")
    return env


def slug(text):
    return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")


def main():
    try:
        import cloudinary
        import cloudinary.uploader
    except ImportError:
        sys.exit("ERROR: cloudinary not installed. Run:  pip install cloudinary")

    env = load_env()
    cloudinary.config(
        cloud_name=env["CLOUDINARY_CLOUD_NAME"],
        api_key=env["CLOUDINARY_API_KEY"],
        api_secret=env["CLOUDINARY_API_SECRET"],
        secure=True,
    )

    sys.path.insert(0, HERE)
    from seed_data import PREVIEW_FEATURED_WORKOUTS as workouts

    mapping = {}
    for w in workouts:
        title = w.get("title")
        old_url = w.get("heroImageUrl")
        if not title or not old_url:
            continue
        if "res.cloudinary.com" in old_url:
            print(f"SKIP (already Cloudinary): {title}")
            mapping[old_url] = old_url
            continue
        public_id = f"mood_app/featured_heroes/{slug(title)}"
        print(f"Uploading: {title} ...")
        res = cloudinary.uploader.upload(
            old_url,
            public_id=public_id,
            overwrite=True,
            invalidate=True,
            resource_type="image",
        )
        # Bare delivery URL (no transforms) — the app adds transforms at render.
        new_url = res["secure_url"]
        mapping[old_url] = new_url
        print(f"   -> {new_url}")

    # Rewrite source files: literal old->new replacement (URLs are unique).
    for path in (SEED_PATH, FRONTEND_HOOK):
        if not os.path.exists(path):
            print(f"WARN: {path} not found, skipping")
            continue
        text = open(path, encoding="utf-8").read()
        changed = 0
        for old_url, new_url in mapping.items():
            if old_url != new_url and old_url in text:
                text = text.replace(old_url, new_url)
                changed += 1
        open(path, "w", encoding="utf-8").write(text)
        print(f"Patched {changed} URL(s) in {os.path.relpath(path, REPO_ROOT)}")

    json.dump(mapping, open(MAP_OUT, "w"), indent=2)
    print(f"\nDone. {len(mapping)} hero(es) processed. Mapping saved to featured_hero_map.json")
    print("Next: the backend syncs these into the DB on startup (sync_featured_hero_images).")


if __name__ == "__main__":
    main()
