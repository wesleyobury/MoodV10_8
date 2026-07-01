"""
Upload the 8 v3 featured-workout hero images to Cloudinary.

These images were pre-optimized (JPEG, max 1600px wide, ~90–210 KB each) and
live in backend/hero_uploads/. Each filename IS the Cloudinary public_id slug,
so the delivered URLs match exactly what's already wired into:
    - backend/seed_data.py                     (PREVIEW_FEATURED_WORKOUTS heroImageUrl)
    - frontend/hooks/useFeaturedWorkouts.ts    (HARDCODED_FALLBACK heroImageUrl)

Run once from the backend/ folder (your machine can reach Cloudinary):
    pip install cloudinary
    python3 upload_new_hero_images.py

Credentials are read from backend/.env
(CLOUDINARY_CLOUD_NAME / _API_KEY / _API_SECRET). Idempotent — re-running
overwrites in place (overwrite=True, invalidate=True).
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(HERE, "hero_uploads")
CLOUD_FOLDER = "mood_app/featured_heroes"


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

    if not os.path.isdir(IMG_DIR):
        sys.exit(f"ERROR: {IMG_DIR} not found.")

    files = sorted(f for f in os.listdir(IMG_DIR) if f.lower().endswith(".jpg"))
    if not files:
        sys.exit(f"ERROR: no .jpg files in {IMG_DIR}")

    print(f"Uploading {len(files)} hero image(s) to {CLOUD_FOLDER}/ ...\n")
    for f in files:
        slug = os.path.splitext(f)[0]
        public_id = f"{CLOUD_FOLDER}/{slug}"
        res = cloudinary.uploader.upload(
            os.path.join(IMG_DIR, f),
            public_id=public_id,
            overwrite=True,
            invalidate=True,
            resource_type="image",
        )
        print(f"  OK  {slug}")
        print(f"      {res['secure_url']}")

    print("\nDone. The backend syncs these into MongoDB on startup "
          "(sync_featured_hero_images / auto-seed).")


if __name__ == "__main__":
    main()
