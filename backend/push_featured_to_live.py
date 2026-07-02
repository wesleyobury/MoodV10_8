"""
Push the 8 v3 featured workouts straight into the LIVE Emergent database via
the deployed admin API — no code deploy required.

Why this exists
---------------
Your dev build's frontend reads featured workouts from the Emergent backend
(https://bug-busters-13.emergent.host), and that data lives in MongoDB, not in
code. The deployed backend already exposes admin CRUD endpoints, so we can
replace the featured set by writing to it directly. Emergent doesn't need to
run the new seed_data.py for this to work.

What it does (idempotent — safe to re-run)
------------------------------------------
  1. Logs in as your admin user  -> gets a bearer token.
  2. Unfeatures everything (PUT /featured/config with []) so old picks can be
     removed and re-runs don't hit the "can't delete a featured workout" lock.
  3. Deletes any existing featured workouts whose title matches our 8.
  4. Creates the 8 new workouts from seed_data.py (the source of truth).
  5. Points featured_config at the 8 new IDs in order.

Note: the deployed create endpoint stores every exercise field (battlePlan,
moodTips, workoutType, moodCard, imageUrl, ...) but drops the workout-level
'hook' and 'cartSizeOverride' (they aren't in the deployed model). Those are
non-visual; they'll fill in once Emergent runs the new code. Everything the
carousel and cart render is preserved.

Usage (run locally — your machine can reach Emergent):
    cd backend
    python3 -m pip install requests
    export MOOD_ADMIN_USER='officialmoodapp'
    export MOOD_ADMIN_PASS='your-admin-password'
    python3 push_featured_to_live.py

Or just run it and it will prompt for username/password.
"""
import os
import sys
import getpass

BASE_URL = os.environ.get("MOOD_API_URL", "https://bug-busters-13.emergent.host").rstrip("/")
API = f"{BASE_URL}/api"

try:
    import requests
except ImportError:
    sys.exit("ERROR: requests not installed.  Run:  python3 -m pip install requests")

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
try:
    from seed_data import PREVIEW_FEATURED_WORKOUTS as WORKOUTS
except Exception as e:
    sys.exit(f"ERROR: could not import PREVIEW_FEATURED_WORKOUTS from seed_data.py: {e}")

OUR_TITLES = {w["title"] for w in WORKOUTS}

# Only the fields the deployed FeaturedWorkoutCreate model accepts.
WORKOUT_FIELDS = ("title", "subtitle", "mood", "difficulty",
                  "durationMin", "duration", "badge", "heroImageUrl")
EXERCISE_FIELDS = ("exerciseId", "order", "sets", "reps", "restSec", "notes",
                   "name", "equipment", "description", "battlePlan", "duration",
                   "imageUrl", "intensityReason", "difficulty", "workoutType",
                   "moodCard", "moodTips")


def payload_for(w):
    body = {k: w.get(k) for k in WORKOUT_FIELDS if w.get(k) is not None}
    exs = []
    for e in w["exercises"]:
        ex = {k: e.get(k) for k in EXERCISE_FIELDS if e.get(k) is not None}
        ex.setdefault("exerciseId", "")   # required by the model
        exs.append(ex)
    body["exercises"] = exs
    return body


def main():
    user = os.environ.get("MOOD_ADMIN_USER") or input("Admin username: ").strip()
    pw = os.environ.get("MOOD_ADMIN_PASS") or getpass.getpass("Admin password: ")

    print(f"\nTarget: {BASE_URL}")
    print(f"Logging in as {user} ...")
    r = requests.post(f"{API}/auth/login", json={"username": user, "password": pw}, timeout=30)
    if r.status_code != 200:
        sys.exit(f"Login failed ({r.status_code}): {r.text[:300]}")
    j = r.json()
    token = j.get("access_token") or j.get("token") or j.get("session_token")
    if not token:
        sys.exit(f"Login response had no token field: {r.text[:300]}")
    H = {"Authorization": f"Bearer {token}"}
    print("  authenticated.\n")

    # 1) Unfeature everything so deletes aren't blocked.
    requests.put(f"{API}/featured/config", headers=H,
                 json={"featuredWorkoutIds": [], "ttlHours": 12}, timeout=30)

    # 2) Delete existing workouts that share our titles (clean re-run).
    r = requests.get(f"{API}/featured/workouts", headers=H, timeout=30)
    if r.status_code == 200:
        for w in r.json().get("workouts", []):
            if w.get("title") in OUR_TITLES:
                d = requests.delete(f"{API}/featured/workouts/{w['_id']}", headers=H, timeout=30)
                print(f"  removed existing '{w['title']}' ({'ok' if d.status_code == 200 else d.status_code})")

    # 3) Create the 8 new workouts, preserving order.
    new_ids = []
    for w in WORKOUTS:
        r = requests.post(f"{API}/featured/workouts", headers=H, json=payload_for(w), timeout=60)
        if r.status_code != 200:
            sys.exit(f"Create failed for '{w['title']}' ({r.status_code}): {r.text[:400]}")
        wid = r.json()["workout_id"]
        new_ids.append(wid)
        print(f"  created '{w['title']}'  ({len(w['exercises'])} exercises)  -> {wid}")

    # 4) Point the carousel at the new IDs, in order.
    r = requests.put(f"{API}/featured/config", headers=H,
                     json={"featuredWorkoutIds": new_ids, "ttlHours": 12}, timeout=30)
    if r.status_code != 200:
        sys.exit(f"Config update failed ({r.status_code}): {r.text[:400]}")

    print(f"\nDone. {len(new_ids)} featured workouts are live.")
    print("In the app: pull-to-refresh the home screen (or wait out the 12h cache) to see them.")


if __name__ == "__main__":
    main()
