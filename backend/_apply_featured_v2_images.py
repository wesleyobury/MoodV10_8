"""
One-off script: update Featured Workouts v2 with the correct per-exercise images
sourced from the existing mood-path workout image library, and swap the
Outdoor - Park to Peak hero with the new user-provided ChatGPT image.

Runs against whichever MongoDB the backend is configured to use (preview).
Idempotent: safe to re-run.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

# ── New Park to Peak hero ──
PARK_TO_PEAK_HERO = (
    "https://customer-assets.emergentagent.com/job_564800a5-3285-4d4c-9e5c-2555c39e42a1/"
    "artifacts/3ut7kmxs_ChatGPT%20Image%20May%2011%2C%202026%2C%2011_55_44%20AM.png"
)

# ── Per-workout / per-exercise image map ──
# title → ordered list of imageUrls for each exercise (by .order)
CDN = "https://res.cloudinary.com/dfsygar5c/image/upload"
IMAGE_MAP = {
    "Sweat - Engine Builder": [
        # Pyramid Ride (Stationary Bike) — actual bike workout image
        f"{CDN}/v1770240940/mood_app/workout_images/706vd22i_download_2_.jpg",
        # Tabata Swings (Kettlebells) — KB Swing Hip Snap
        f"{CDN}/v1770240602/mood_app/workout_images/hdv3g2g2_download.jpg",
        # Sprint & Recover (Row Machine) — actual Row workout image
        f"{CDN}/v1770240957/mood_app/workout_images/sfylsueu_download_copy_4.jpg",
    ],
    "Outdoor - Park to Peak": [
        # Park Strength Circuit — Park Circuit workout image
        f"{CDN}/v1770240839/mood_app/workout_images/f9t1jnvw_download_17_.jpg",
        # Hill Repeats — Hill Power Mix workout image
        f"{CDN}/v1770240859/mood_app/workout_images/zqqramht_download_13_.jpg",
    ],
    "Calisthenics - Bar to Floor": [
        # Mixed Upper Pull (Pull-up Bar) — Chin-Up Builder
        f"{CDN}/v1770240786/mood_app/workout_images/2h4qn95p_download.jpg",
        # Parallel Push (Parallel Bars) — Dip Prep
        f"{CDN}/v1770240805/mood_app/workout_images/eyqn2a9a_download_10_.jpg",
        # Hanging Core Finisher — Supported Hanging Knee Raises
        f"{CDN}/v1770240698/mood_app/workout_images/7v92z8q8_hanging_knee_1.jpg",
    ],
    "MOOD Mix - Air & Abs": [
        # Skater Bounds — actual Skater Bounds workout image
        f"{CDN}/v1770240622/mood_app/workout_images/rzd2lfq8_download_36_.jpg",
        # Jump Squats — Clean to Jump Squat workout image
        f"{CDN}/v1770240595/mood_app/workout_images/93nr796t_sbclean.jpg",
        # Hollow Body Hold — Hollow Body + Pike Jump (hollow pose)
        f"{CDN}/v1770240813/mood_app/workout_images/lel4saj0_Pike_jump.jpg",
        # Bicycle Crunches — actual Bicycle Crunch workout image
        f"{CDN}/v1770240903/mood_app/workout_images/pvvftlsu_download_16_.jpg",
    ],
    "Build Explosion - Triple Threat": [
        # Depth Jumps — Low Box Jumps image (plyo box jump pose)
        f"{CDN}/v1770241067/mood_app/workout_images/ikffehr2_download_19_.jpg",
        # Clean & Press (Kettlebells) — Clean to Press Ladder
        f"{CDN}/v1770240605/mood_app/workout_images/ic2iad2y_download_3_.jpg",
        # Slam Ball Tabata — Slam Ball Basics workout image
        f"{CDN}/v1770240620/mood_app/workout_images/rfw3jxg0_download_3_.jpg",
    ],
    "Muscle Gainer - Push Day Pump": [
        # Barbell Bench Press — Bench Fundamentals chest workout image
        f"{CDN}/v1770241308/mood_app/workout_images/hs5s9gux_download_6_.jpg",
        # Incline DB Press — Incline Control chest workout image (ibp = incline bench press)
        f"{CDN}/v1770241313/mood_app/workout_images/lnd9yph3_ibp.png",
        # Cable Fly — Fly Control chest workout image (pdm = pec deck/machine)
        f"{CDN}/v1770241303/mood_app/workout_images/5hd3my3c_pdm.jpg",
        # DB Overhead Press — Tempo Shoulder Press DB shoulder press image
        f"{CDN}/v1770240969/mood_app/workout_images/2f5b0c4l_db_shoulder_press.jpg",
        # Lateral Raise — DB Lateral Raise workout image
        f"{CDN}/v1770241043/mood_app/workout_images/zbplnvku_db_lateral_raise.jpg",
        # Cable Pushdown — Straight-Bar Cable Pushdowns triceps workout image
        f"{CDN}/v1770241091/mood_app/workout_images/lv1qz5u4_download.jpg",
    ],
}


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    total_updates = 0
    for title, urls in IMAGE_MAP.items():
        workout = await db.featured_workouts.find_one({"title": title})
        if not workout:
            print(f"  SKIP: workout not found — {title}")
            continue

        exercises = workout.get("exercises", [])
        if len(exercises) != len(urls):
            print(f"  WARN: '{title}' has {len(exercises)} exercises but map has {len(urls)}")

        for i, ex in enumerate(exercises):
            if i < len(urls):
                ex["imageUrl"] = urls[i]

        update_payload = {"exercises": exercises}

        # Park to Peak hero swap
        if title == "Outdoor - Park to Peak":
            update_payload["heroImageUrl"] = PARK_TO_PEAK_HERO

        res = await db.featured_workouts.update_one(
            {"title": title}, {"$set": update_payload}
        )
        total_updates += res.modified_count
        print(f"  OK: {title}  ({len(exercises)} exercise images set, hero={'updated' if title == 'Outdoor - Park to Peak' else 'unchanged'})")

    print(f"\nTotal documents modified: {total_updates}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
