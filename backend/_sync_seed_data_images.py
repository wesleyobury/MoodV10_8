"""
Sync seed_data.py exercise imageUrls with the corrected image map from
_apply_featured_v2_images.py. Run once after applying DB updates so future
fresh deploys / prod re-seed pick up the correct visuals.
"""

import re
from pathlib import Path

SEED_PATH = Path(__file__).parent / "seed_data.py"

# (workout title, exercise name, new imageUrl)
CDN = "https://res.cloudinary.com/dfsygar5c/image/upload"
UPDATES = [
    ("Sweat - Engine Builder", "Tabata Swings",
     f"{CDN}/v1770240602/mood_app/workout_images/hdv3g2g2_download.jpg"),
    ("Sweat - Engine Builder", "Sprint & Recover",
     f"{CDN}/v1770240957/mood_app/workout_images/sfylsueu_download_copy_4.jpg"),
    ("Outdoor - Park to Peak", "Park Strength Circuit",
     f"{CDN}/v1770240839/mood_app/workout_images/f9t1jnvw_download_17_.jpg"),
    ("Outdoor - Park to Peak", "Hill Repeats",
     f"{CDN}/v1770240859/mood_app/workout_images/zqqramht_download_13_.jpg"),
    ("Calisthenics - Bar to Floor", "Mixed Upper Pull",
     f"{CDN}/v1770240786/mood_app/workout_images/2h4qn95p_download.jpg"),
    ("Calisthenics - Bar to Floor", "Parallel Push",
     f"{CDN}/v1770240805/mood_app/workout_images/eyqn2a9a_download_10_.jpg"),
    ("Calisthenics - Bar to Floor", "Hanging Core Finisher",
     f"{CDN}/v1770240698/mood_app/workout_images/7v92z8q8_hanging_knee_1.jpg"),
    ("MOOD Mix - Air & Abs", "Skater Bounds",
     f"{CDN}/v1770240622/mood_app/workout_images/rzd2lfq8_download_36_.jpg"),
    ("MOOD Mix - Air & Abs", "Jump Squats",
     f"{CDN}/v1770240595/mood_app/workout_images/93nr796t_sbclean.jpg"),
    ("MOOD Mix - Air & Abs", "Hollow Body Hold",
     f"{CDN}/v1770240813/mood_app/workout_images/lel4saj0_Pike_jump.jpg"),
    ("MOOD Mix - Air & Abs", "Bicycle Crunches",
     f"{CDN}/v1770240903/mood_app/workout_images/pvvftlsu_download_16_.jpg"),
    ("Build Explosion - Triple Threat", "Depth Jumps",
     f"{CDN}/v1770241067/mood_app/workout_images/ikffehr2_download_19_.jpg"),
    ("Build Explosion - Triple Threat", "Clean & Press",
     f"{CDN}/v1770240605/mood_app/workout_images/ic2iad2y_download_3_.jpg"),
    ("Build Explosion - Triple Threat", "Slam Ball Tabata",
     f"{CDN}/v1770240620/mood_app/workout_images/rfw3jxg0_download_3_.jpg"),
    ("Muscle Gainer - Push Day Pump", "Barbell Bench Press",
     f"{CDN}/v1770241308/mood_app/workout_images/hs5s9gux_download_6_.jpg"),
    ("Muscle Gainer - Push Day Pump", "Incline DB Press",
     f"{CDN}/v1770241313/mood_app/workout_images/lnd9yph3_ibp.png"),
    ("Muscle Gainer - Push Day Pump", "Cable Fly",
     f"{CDN}/v1770241303/mood_app/workout_images/5hd3my3c_pdm.jpg"),
    ("Muscle Gainer - Push Day Pump", "DB Overhead Press",
     f"{CDN}/v1770240969/mood_app/workout_images/2f5b0c4l_db_shoulder_press.jpg"),
    ("Muscle Gainer - Push Day Pump", "Lateral Raise",
     f"{CDN}/v1770241043/mood_app/workout_images/zbplnvku_db_lateral_raise.jpg"),
    ("Muscle Gainer - Push Day Pump", "Cable Pushdown",
     f"{CDN}/v1770241091/mood_app/workout_images/lv1qz5u4_download.jpg"),
]


def patch_exercise_imageUrl(text: str, exercise_name: str, new_url: str) -> tuple[str, bool]:
    # Match: "name": "<exercise_name>" ... "imageUrl": <anything up to ,\n>
    # The value can be a string literal OR a Python variable reference (like _HERO_X).
    pattern = re.compile(
        r'("name":\s*"' + re.escape(exercise_name) + r'",[\s\S]*?"imageUrl":\s*)[^\n,]+,',
        re.DOTALL,
    )
    new_text, n = pattern.subn(lambda m: f'{m.group(1)}"{new_url}",', text, count=1)
    return new_text, n > 0


def main():
    text = SEED_PATH.read_text()
    changed = 0
    for title, name, url in UPDATES:
        text, ok = patch_exercise_imageUrl(text, name, url)
        if ok:
            changed += 1
            print(f"  OK: {title} / {name}")
        else:
            print(f"  SKIP: {title} / {name} — not found or already up to date")
    SEED_PATH.write_text(text)
    print(f"\nPatched {changed}/{len(UPDATES)} exercise imageUrls in seed_data.py")


if __name__ == "__main__":
    main()
