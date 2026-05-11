# Auto-generated seed data — Featured Workouts v2 (6 picks)
# This file contains the canonical featured workout data that should be seeded.
# Schema notes:
#   - workoutType per exercise drives the cart sub-path dividers
#     (e.g. "Sweat - Cardio Based", "Build Explosion - Body Weight",
#     "Muscle Gainer - Chest", "Outdoor - Park", "Calisthenics")
#   - cartSizeOverride is informational; allows featured workouts to exceed
#     the default mood cart size (e.g. Triple Threat = 3-piece Build cart).
#   - hook is the TikTok-caption-style one-liner shown in carousel/admin.

# Hero images (user-provided v2)
_HERO_SWEAT_ENGINE = "https://customer-assets.emergentagent.com/job_564800a5-3285-4d4c-9e5c-2555c39e42a1/artifacts/1htdj9uf_sweat%20engine%20builder.png"
_HERO_OUTDOOR_PARK = "https://customer-assets.emergentagent.com/job_564800a5-3285-4d4c-9e5c-2555c39e42a1/artifacts/3ut7kmxs_ChatGPT%20Image%20May%2011%2C%202026%2C%2011_55_44%20AM.png"
_HERO_CALI_BAR = "https://customer-assets.emergentagent.com/job_564800a5-3285-4d4c-9e5c-2555c39e42a1/artifacts/aye1zfgm_calisthenics%20bar%20to%20floor.png"
_HERO_MOOD_MIX = "https://customer-assets.emergentagent.com/job_564800a5-3285-4d4c-9e5c-2555c39e42a1/artifacts/wlyymgaw_mood%20mix%20air%20%26%20abs.png"
_HERO_BUILD_TRIPLE = "https://customer-assets.emergentagent.com/job_564800a5-3285-4d4c-9e5c-2555c39e42a1/artifacts/ihtgdx5o_build%20explosion%20triple%20threat.png"
_HERO_MG_PUSH = "https://customer-assets.emergentagent.com/job_564800a5-3285-4d4c-9e5c-2555c39e42a1/artifacts/0u8yf2qz_muscle%20gainer%20push%20day%20pump.png"


PREVIEW_FEATURED_WORKOUTS = [
  # ============================================================
  # 1. SWEAT — ENGINE BUILDER (~50 min, Intermediate)
  # Cardio in → Lift in middle → Sprint out.
  # ============================================================
  {
    "_id": "697c70ea6a76d293b68a16b1",
    "title": "Sweat - Engine Builder",
    "mood": "Sweat / Burn Fat",
    "duration": "~50 min",
    "badge": "Top pick",
    "heroImageUrl": _HERO_SWEAT_ENGINE,
    "difficulty": "Intermediate",
    "hook": "Cardio in. Lift in the middle. Sprint out.",
    "exercises": [
      {
        "exerciseId": "",
        "order": 0,
        "name": "Pyramid Ride",
        "equipment": "Stationary Bike",
        "description": "Pyramid intervals build a deep cardio base before the resistance block.",
        "battlePlan": "5 min easy spin warm-up\n• 1 min moderate resistance\n• 2 min hard resistance\n• 3 min max resistance\n• 2 min hard resistance\n• 1 min moderate resistance\n• 5 min easy spin cool-down",
        "duration": "18 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240940/mood_app/workout_images/706vd22i_download_2_.jpg",
        "intensityReason": "Pyramid loading primes the cardio engine for a heavier middle block",
        "difficulty": "intermediate",
        "workoutType": "Sweat - Cardio Based",
        "moodCard": "Sweat / Burn Fat",
        "moodTips": [
          {"icon": "speedometer", "title": "Hold Cadence", "description": "Keep RPM steady as resistance climbs — that's where the engine builds."},
          {"icon": "heart", "title": "Heart Rate Zone", "description": "Climb to 80% max HR by the top of the pyramid, then ride it down."}
        ]
      },
      {
        "exerciseId": "",
        "order": 1,
        "name": "Tabata Swings",
        "equipment": "Kettlebells",
        "description": "8 rounds of 20s on / 10s off — the textbook Sweat resistance block.",
        "battlePlan": "Tabata x 8 rounds (4 min):\n• 20s max-effort KB swings\n• 10s rest\nThen 2 min reset.\nRepeat the Tabata block 2x total.\nUse a weight you can swing for 15+ reps fresh.",
        "duration": "14 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240602/mood_app/workout_images/hdv3g2g2_download.jpg",
        "intensityReason": "Tabata + ballistic hinge spikes HR while loading the posterior chain",
        "difficulty": "intermediate",
        "workoutType": "Sweat - Light Weights",
        "moodCard": "Sweat / Burn Fat",
        "moodTips": [
          {"icon": "flash", "title": "Hip Snap, Not Squat", "description": "The bell floats from hip drive. Quads stay quiet."},
          {"icon": "timer", "title": "20s Means Max", "description": "If you can pace it, the weight is too light. Hunt failure on the last 5s."}
        ]
      },
      {
        "exerciseId": "",
        "order": 2,
        "name": "Sprint & Recover",
        "equipment": "Row Machine",
        "description": "Sprint intervals to finish — empties the tank, locks in the cardio adaptation.",
        "battlePlan": "5 rounds:\n• 30s all-out row sprint\n• 90s easy row recovery\nFinal 3 min cool-down row at conversational pace.",
        "duration": "15 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240957/mood_app/workout_images/sfylsueu_download_copy_4.jpg",
        "intensityReason": "Sprint-recover intervals lock in the cardio gains from the warm-up pyramid",
        "difficulty": "intermediate",
        "workoutType": "Sweat - Cardio Based",
        "moodCard": "Sweat / Burn Fat",
        "moodTips": [
          {"icon": "trending-up", "title": "Drive From Legs", "description": "60% legs, 30% back, 10% arms. The arms come last."},
          {"icon": "heart", "title": "Full Recovery", "description": "90s is short — sip air, don't talk. Sprint quality > sprint count."}
        ]
      }
    ]
  },

  # ============================================================
  # 2. OUTDOOR — PARK TO PEAK (~45 min, Intermediate)
  # Park warmup → Hill repeats. The everyday runner's session.
  # ============================================================
  {
    "_id": "697c70ea6a76d293b68a16b2",
    "title": "Outdoor - Park to Peak",
    "mood": "Get Outside",
    "duration": "~45 min",
    "badge": "Trending",
    "heroImageUrl": _HERO_OUTDOOR_PARK,
    "difficulty": "Intermediate",
    "hook": "Park warmup, hill repeats. The everyday runner's session.",
    "exercises": [
      {
        "exerciseId": "",
        "order": 0,
        "name": "Park Strength Circuit",
        "equipment": "Park",
        "description": "Bodyweight circuit at the park — primes the legs and lungs for the climb.",
        "battlePlan": "3 rounds, 45s on / 15s off:\n• Walking lunges (down a path)\n• Step-ups on bench\n• Push-ups\n• Bench dips\n• Mountain climbers\nWalk 60s between rounds.",
        "duration": "18 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240839/mood_app/workout_images/f9t1jnvw_download_17_.jpg",
        "intensityReason": "Full-body bodyweight primer raises core temp and grooves movement before the hills",
        "difficulty": "beginner",
        "workoutType": "Outdoor - Park",
        "moodCard": "Get Outside",
        "moodTips": [
          {"icon": "leaf", "title": "Pick Your Bench", "description": "Find a sturdy bench at the start. You'll loop back to it for the dips and step-ups."},
          {"icon": "body", "title": "Warm Up Long", "description": "The park circuit IS the warm-up. Don't rush it — the hills want hot legs."}
        ]
      },
      {
        "exerciseId": "",
        "order": 1,
        "name": "Hill Repeats",
        "equipment": "Hills",
        "description": "Find a 30-60s hill and run it back. Classic interval shape, big aerobic payoff.",
        "battlePlan": "10 min easy jog to the hill\n• 8 hill repeats: hard up, walk down\n• Target 30-60s climbs at 85% effort\n• Walk-down is full recovery\n10 min easy jog cool-down.",
        "duration": "27 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240859/mood_app/workout_images/zqqramht_download_13_.jpg",
        "intensityReason": "Hill sprints stack strength + VO2 in one move — the highest ROI run interval",
        "difficulty": "intermediate",
        "workoutType": "Outdoor - Hills",
        "moodCard": "Get Outside",
        "moodTips": [
          {"icon": "trending-up", "title": "Knees High", "description": "Drive knees forward and up. Pumping arms keep the legs honest."},
          {"icon": "heart", "title": "Walk The Whole Way Down", "description": "Don't jog the descent. The recovery is what makes the next sprint count."}
        ]
      }
    ]
  },

  # ============================================================
  # 3. CALISTHENICS — BAR TO FLOOR (~30 min, Intermediate)
  # Pull → push → hold. No weights, no excuses.
  # ============================================================
  {
    "_id": "697c70ea6a76d293b68a16b3",
    "title": "Calisthenics - Bar to Floor",
    "mood": "Calisthenics",
    "duration": "~30 min",
    "badge": "No Equipment",
    "heroImageUrl": _HERO_CALI_BAR,
    "difficulty": "Intermediate",
    "hook": "Pull, push, hold. No weights, no excuses.",
    "exercises": [
      {
        "exerciseId": "",
        "order": 0,
        "name": "Mixed Upper Pull",
        "equipment": "Pull-up Bar",
        "description": "Mixed-grip pull-up ladder — hits lats, mid-back, and biceps in one block.",
        "battlePlan": "4 rounds:\n• 5 wide pull-ups\n• 5 chin-ups (palms in)\n• 5 neutral grip pull-ups\nRest 90s between rounds. Use a band if needed.",
        "duration": "12 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240786/mood_app/workout_images/2h4qn95p_download.jpg",
        "intensityReason": "Three pull variations in one block stress every angle of the upper back",
        "difficulty": "intermediate",
        "workoutType": "Calisthenics",
        "moodCard": "Calisthenics",
        "moodTips": [
          {"icon": "trending-up", "title": "Full Hang Bottom", "description": "Reset to a dead hang each rep. No kipping unless it's intentional."},
          {"icon": "body", "title": "Scapular Pull First", "description": "Pull shoulder blades down before the elbows bend. That's where the lats fire."}
        ]
      },
      {
        "exerciseId": "",
        "order": 1,
        "name": "Parallel Push",
        "equipment": "Parallel Bars",
        "description": "Dips + tuck levers — the upper-body push half of the calisthenics square.",
        "battlePlan": "4 rounds:\n• 8-10 parallel bar dips\n• 15s tuck L-sit hold\nRest 75s between rounds. Negatives if you can't dip yet.",
        "duration": "10 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240805/mood_app/workout_images/eyqn2a9a_download_10_.jpg",
        "intensityReason": "Vertical push on rings/bars + isometric core = max upper body density",
        "difficulty": "intermediate",
        "workoutType": "Calisthenics",
        "moodCard": "Calisthenics",
        "moodTips": [
          {"icon": "body", "title": "Chest Forward", "description": "Lean slightly forward on dips to load chest. Stay upright to load triceps."},
          {"icon": "timer", "title": "Build The Hold", "description": "Can't get 15s tuck? Hold 5s, rest, repeat 3x. Same total time under tension."}
        ]
      },
      {
        "exerciseId": "",
        "order": 2,
        "name": "Hanging Core Finisher",
        "equipment": "Pull-up Bar",
        "description": "Hanging knee raises + windshield wipers — the floor work, but on a bar.",
        "battlePlan": "3 rounds:\n• 10 hanging knee raises\n• 8 windshield wipers (4 each side)\n• 20s dead hang\nRest 60s between rounds.",
        "duration": "8 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240698/mood_app/workout_images/7v92z8q8_hanging_knee_1.jpg",
        "intensityReason": "Hanging core work loads the abs under stretch — bigger range than any floor variant",
        "difficulty": "intermediate",
        "workoutType": "Calisthenics",
        "moodCard": "Calisthenics",
        "moodTips": [
          {"icon": "shield", "title": "Engage Lats First", "description": "Pull shoulders down and away from ears before lifting legs."},
          {"icon": "flash", "title": "Control The Drop", "description": "Lower with the same tempo you lifted. Free reps in the eccentric."}
        ]
      }
    ]
  },

  # ============================================================
  # 4. MOOD MIX — AIR & ABS (~25 min, Intermediate)
  # Jump, land, lock the core. No equipment, no floor space wasted.
  # Cross-mood: Build Explosion (BW plyo) + Muscle Gainer (Abs)
  # ============================================================
  {
    "_id": "697c70ea6a76d293b68a16b4",
    "title": "MOOD Mix - Air & Abs",
    "mood": "MOOD Mix",
    "duration": "~25 min",
    "badge": "New",
    "heroImageUrl": _HERO_MOOD_MIX,
    "difficulty": "Intermediate",
    "hook": "Jump, land, lock the core. No equipment.",
    "exercises": [
      {
        "exerciseId": "",
        "order": 0,
        "name": "Skater Bounds",
        "equipment": "Bodyweight",
        "description": "Lateral plyo — trains explosive single-leg push-off and sticky landings.",
        "battlePlan": "4 rounds:\n• 30s skater bounds (side to side)\n• 30s rest\nLand on the outside leg with a soft knee. Reach the trailing leg behind for balance.",
        "duration": "6 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240622/mood_app/workout_images/rzd2lfq8_download_36_.jpg",
        "intensityReason": "Lateral plyo unlocks frontal-plane power most workouts ignore",
        "difficulty": "intermediate",
        "workoutType": "Build Explosion - Body Weight",
        "moodCard": "Build Explosion",
        "moodTips": [
          {"icon": "flash", "title": "Push, Don't Hop", "description": "Drive off the outside foot like you're skating. Hops are short, pushes are long."},
          {"icon": "body", "title": "Soft Land", "description": "Knee tracks over toe. Stick the landing 1s before the next bound."}
        ]
      },
      {
        "exerciseId": "",
        "order": 1,
        "name": "Jump Squats",
        "equipment": "Bodyweight",
        "description": "Vertical plyo — squat down, explode up, stick the landing.",
        "battlePlan": "4 rounds:\n• 10 jump squats (max height)\n• 30s rest\nReset between each rep — quality over speed.",
        "duration": "6 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240595/mood_app/workout_images/93nr796t_sbclean.jpg",
        "intensityReason": "Vertical plyo lights up Type II fibers in the quads + glutes",
        "difficulty": "intermediate",
        "workoutType": "Build Explosion - Body Weight",
        "moodCard": "Build Explosion",
        "moodTips": [
          {"icon": "trending-up", "title": "Arms Drive Height", "description": "Throw arms overhead on the jump. Big arm swing = bigger jump."},
          {"icon": "timer", "title": "Reset Between Reps", "description": "Submax effort kills the point. Pause 1s between jumps — every rep is a max."}
        ]
      },
      {
        "exerciseId": "",
        "order": 2,
        "name": "Hollow Body Hold",
        "equipment": "Bodyweight",
        "description": "The single most-transferable ab isometric. Locks the rib-to-pelvis connection.",
        "battlePlan": "3 rounds:\n• 30s hollow body hold\n• 30s rest\nLow back pressed to floor, arms and legs long.",
        "duration": "6 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240813/mood_app/workout_images/lel4saj0_Pike_jump.jpg",
        "intensityReason": "Hollow hold trains anti-extension — the foundation of every other ab move",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Abs",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {"icon": "shield", "title": "Low Back Glued", "description": "If your low back lifts, bend the knees. Position beats duration."},
          {"icon": "body", "title": "Long Arms, Long Legs", "description": "Reach in opposite directions — the longer the lever, the harder the hold."}
        ]
      },
      {
        "exerciseId": "",
        "order": 3,
        "name": "Bicycle Crunches",
        "equipment": "Bodyweight",
        "description": "Rotational ab work — finishes the obliques after the front-loaded isometric.",
        "battlePlan": "3 rounds:\n• 20 bicycle crunches (10 per side, slow)\n• 30s rest\nTouch elbow to opposite knee, full extension on the other leg.",
        "duration": "7 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240903/mood_app/workout_images/pvvftlsu_download_16_.jpg",
        "intensityReason": "Rotational crunches finish the obliques the hollow hold misses",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Abs",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {"icon": "refresh", "title": "Slow Twist", "description": "Pause at the contraction — 1s elbow-to-knee. Speed steals the work."},
          {"icon": "body", "title": "Extend Fully", "description": "Straighten the away-leg completely each rep. Half-reps = half-results."}
        ]
      }
    ]
  },

  # ============================================================
  # 5. BUILD EXPLOSION — TRIPLE THREAT (~45 min, Intermediate)
  # All three explosive flavors: plyo + loaded + dynamic slams.
  # cartSizeOverride: 3 (default Build cart is 2)
  # ============================================================
  {
    "_id": "697c70ea6a76d293b68a16b5",
    "title": "Build Explosion - Triple Threat",
    "mood": "Build Explosion",
    "duration": "~45 min",
    "badge": "Popular",
    "heroImageUrl": _HERO_BUILD_TRIPLE,
    "difficulty": "Intermediate",
    "hook": "Plyo. Power. Slams. Walk out feeling like an athlete.",
    "cartSizeOverride": 3,
    "exercises": [
      {
        "exerciseId": "",
        "order": 0,
        "name": "Depth Jumps",
        "equipment": "Bodyweight",
        "description": "Elastic plyo — step off a box, absorb, and explode straight back up.",
        "battlePlan": "5 sets:\n• 5 depth jumps from a 12-18\" box\n• Rest 90s between sets\nGround contact time should feel like a stovetop — minimal.",
        "duration": "14 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770241067/mood_app/workout_images/ikffehr2_download_19_.jpg",
        "intensityReason": "Depth jumps train reactive strength — the fastest power adaptation in plyo",
        "difficulty": "intermediate",
        "workoutType": "Build Explosion - Body Weight",
        "moodCard": "Build Explosion",
        "moodTips": [
          {"icon": "flash", "title": "Minimize Ground Time", "description": "Goal is to bounce off the floor, not absorb and reload. Stiff ankles."},
          {"icon": "body", "title": "Quality Over Quantity", "description": "5 reps. Each one a max. If form breaks, end the set early."}
        ]
      },
      {
        "exerciseId": "",
        "order": 1,
        "name": "Clean & Press",
        "equipment": "Kettlebells",
        "description": "Loaded full-body power — explosive hip drive into an overhead lockout.",
        "battlePlan": "5 sets:\n• 5 clean & press per side\n• Rest 90s between sides\nClean to rack position, dip, press overhead, control down.",
        "duration": "16 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240605/mood_app/workout_images/ic2iad2y_download_3_.jpg",
        "intensityReason": "Clean & press loads the same hip extension as the plyo — but with a barbell of resistance",
        "difficulty": "intermediate",
        "workoutType": "Build Explosion - Light Weights",
        "moodCard": "Build Explosion",
        "moodTips": [
          {"icon": "flash", "title": "Hips, Then Arms", "description": "The bell floats to the rack from hip drive. Arms are the brakes, not the engine."},
          {"icon": "body", "title": "Vertical Press Path", "description": "Push your head through under the bell at lockout. Wrists stacked over elbows."}
        ]
      },
      {
        "exerciseId": "",
        "order": 2,
        "name": "Slam Ball Tabata",
        "equipment": "Slam Balls",
        "description": "Dynamic finisher — 8 rounds of all-out slams. The walk-out money shot.",
        "battlePlan": "Tabata x 8 rounds (4 min):\n• 20s slams (max effort)\n• 10s rest\nThen 2 min easy walk reset.\nRepeat block 2x for full intensity day.",
        "duration": "15 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240620/mood_app/workout_images/rfw3jxg0_download_3_.jpg",
        "intensityReason": "Slams empty the tank fully — perfect cap to a high-power session",
        "difficulty": "intermediate",
        "workoutType": "Build Explosion - Dynamic",
        "moodCard": "Build Explosion",
        "moodTips": [
          {"icon": "flash", "title": "Slam Through The Floor", "description": "Aim 2 inches below the ground. Half-hearted slams waste the move."},
          {"icon": "heart", "title": "Breathe On The Rise", "description": "Exhale hard on the slam, inhale as you pick the ball up. Stack rhythm + power."}
        ]
      }
    ]
  },

  # ============================================================
  # 6. MUSCLE GAINER — PUSH DAY PUMP (~50 min, Intermediate)
  # Chest, shoulders, triceps. Compound first, pump finish.
  # ============================================================
  {
    "_id": "697c70ea6a76d293b68a16b6",
    "title": "Muscle Gainer - Push Day Pump",
    "mood": "Muscle gainer",
    "duration": "~50 min",
    "badge": "Classic",
    "heroImageUrl": _HERO_MG_PUSH,
    "difficulty": "Intermediate",
    "hook": "Chest, shoulders, triceps. Compound first, pump finish.",
    "exercises": [
      {
        "exerciseId": "",
        "order": 0,
        "name": "Barbell Bench Press",
        "equipment": "Barbell + Bench",
        "description": "The horizontal press king — start heavy, set the tone for the session.",
        "battlePlan": "4 rounds:\n• 6-8 Barbell Bench Press\nRest 2-3 min between sets.\nLast set: drop 20% and rep to failure.",
        "duration": "12 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770241308/mood_app/workout_images/hs5s9gux_download_6_.jpg",
        "intensityReason": "Compound horizontal press recruits the most muscle while you're freshest",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Chest",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {"icon": "body", "title": "Retract & Arch", "description": "Shoulder blades pinched, slight arch. Lats are the bench's foundation."},
          {"icon": "trending-down", "title": "Touch The Sternum", "description": "Bar touches lower chest, not the neck. Full range or full waste."}
        ]
      },
      {
        "exerciseId": "",
        "order": 1,
        "name": "Incline DB Press",
        "equipment": "Dumbbells + Incline Bench",
        "description": "Upper chest specialist — fills out the clavicle region the flat bench skips.",
        "battlePlan": "3 rounds:\n• 8-10 Incline Dumbbell Press\nRest 90s between sets.\nBench set to 30-45° incline.",
        "duration": "10 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770241313/mood_app/workout_images/lnd9yph3_ibp.png",
        "intensityReason": "Incline angle isolates upper pec fibers — the missing piece of most chest days",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Chest",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {"icon": "trending-up", "title": "30-45° Only", "description": "Steeper than 45° turns this into a shoulder press. Keep the angle moderate."},
          {"icon": "body", "title": "DBs Touch At Top", "description": "Press up and slightly in. Squeeze the chest at lockout."}
        ]
      },
      {
        "exerciseId": "",
        "order": 2,
        "name": "Cable Fly",
        "equipment": "Cable Machine",
        "description": "Isolation finisher for chest — constant tension, peak contraction.",
        "battlePlan": "3 rounds:\n• 12-15 Cable Flies\nRest 60s between sets.\nSqueeze 1s at the bottom of each rep.",
        "duration": "9 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770241303/mood_app/workout_images/5hd3my3c_pdm.jpg",
        "intensityReason": "Cables keep tension across the entire ROM — dumbbells lose tension at the top",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Chest",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {"icon": "timer", "title": "Squeeze At Bottom", "description": "1s pause when the handles meet. That's where the chest fully shortens."},
          {"icon": "body", "title": "Soft Elbows", "description": "Slight elbow bend held the whole rep. Locked elbows trash the biceps tendon."}
        ]
      },
      {
        "exerciseId": "",
        "order": 3,
        "name": "DB Overhead Press",
        "equipment": "Dumbbells",
        "description": "The shoulder anchor — vertical press hits all three delt heads.",
        "battlePlan": "4 rounds:\n• 8-10 DB Overhead Press\nRest 90s between sets.\nSeated with back support — saves the lower back for the rest of the day.",
        "duration": "10 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240969/mood_app/workout_images/2f5b0c4l_db_shoulder_press.jpg",
        "intensityReason": "Vertical pressing loads the full delt — front, side, and a little rear",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Shoulders",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {"icon": "trending-up", "title": "Press, Don't Punch", "description": "Drive straight up overhead. Wrists stacked over elbows over shoulders."},
          {"icon": "body", "title": "Core Locked", "description": "Brace abs hard — overhead press is a lower-back killer if you flare ribs."}
        ]
      },
      {
        "exerciseId": "",
        "order": 4,
        "name": "Lateral Raise",
        "equipment": "Dumbbells",
        "description": "Side delt isolator — the shape-shifter of every shoulder day.",
        "battlePlan": "3 rounds:\n• 12-15 Lateral Raises\nRest 60s between sets.\nGo light — form > weight on this one.",
        "duration": "8 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770241043/mood_app/workout_images/zbplnvku_db_lateral_raise.jpg",
        "intensityReason": "Lateral raises are the only move that truly isolates the medial delt",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Shoulders",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {"icon": "trending-up", "title": "Lead With Elbows", "description": "Elbows lift first, hands follow. Wrists stay neutral — no pouring."},
          {"icon": "timer", "title": "3s Eccentric", "description": "Slow on the way down. That's where the side delt actually grows."}
        ]
      },
      {
        "exerciseId": "",
        "order": 5,
        "name": "Cable Pushdown",
        "equipment": "Cable Machine",
        "description": "Tricep finisher — straight-bar pushdown, pump and out.",
        "battlePlan": "3 rounds:\n• 12-15 Cable Pushdowns\nRest 60s between sets.\nLast set: drop set — drop weight 25%, rep to failure.",
        "duration": "7 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770241091/mood_app/workout_images/lv1qz5u4_download.jpg",
        "intensityReason": "Cable pushdowns isolate the long head of the triceps — biggest visual payoff",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Triceps",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {"icon": "body", "title": "Elbows Glued To Ribs", "description": "If elbows drift forward, the lats take over. Pin them to your sides."},
          {"icon": "flash", "title": "Squeeze At Lockout", "description": "Full extension, 1s squeeze. The bottom of the rep is where triceps fire hardest."}
        ]
      }
    ]
  }
]

# The exact order of featured workout IDs for the carousel
# (these are the seed-time stable _ids; auto-seed will replace and regenerate
# actual ObjectIds in MongoDB at startup.)
FEATURED_WORKOUT_IDS = [
    "697c70ea6a76d293b68a16b1",  # Sweat - Engine Builder
    "697c70ea6a76d293b68a16b2",  # Outdoor - Park to Peak
    "697c70ea6a76d293b68a16b3",  # Calisthenics - Bar to Floor
    "697c70ea6a76d293b68a16b4",  # MOOD Mix - Air & Abs
    "697c70ea6a76d293b68a16b5",  # Build Explosion - Triple Threat
    "697c70ea6a76d293b68a16b6",  # Muscle Gainer - Push Day Pump
]
