# Auto-generated seed data — Featured Workouts v3 (8 picks)
# Regenerated 2026-07-01. Replaces the v2 6-pick set.
# Each featured workout's exercises are pulled from a SINGLE mood-card path in
# the app's real exercise library (frontend/data/*-workouts-data.ts), so tapping
# a carousel slide loads a legit cart built from that path.
# Schema notes:
#   - workoutType per exercise drives the cart sub-path dividers.
#   - cartSizeOverride (optional) lets a featured workout exceed the default
#     mood cart size (e.g. Back & Bis = 5-piece Muscle cart).
#   - hook is the one-liner shown in carousel/admin.
# Hero images: user-provided v3 (2026-07-01), delivered from Cloudinary
#   mood_app/featured_heroes/. optimizedImageUrl() injects f_auto,q_auto,c_limit
#   at render time.

PREVIEW_FEATURED_WORKOUTS = [
  {
    "_id": "6a7c70ea6a76d293b68a1701",
    "title": "Sweat - HIIT Circuit",
    "mood": "Sweat / Burn Fat",
    "duration": "~30 min",
    "badge": "Trending",
    "heroImageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/mood_app/featured_heroes/sweat_hiit_circuit.jpg",
    "difficulty": "Intermediate",
    "hook": "Four stations. Full send. No place to hide.",
    "exercises": [
      {
        "exerciseId": "",
        "order": 0,
        "name": "Tabata (Ropes)",
        "equipment": "Battle Ropes",
        "description": "Waves, slams, circles, jacks rotated for sixteen intervals.",
        "battlePlan": "20s work / 10s rest alternating:\n• Waves\n• Slams\n• Circles\n• Jumping Jacks\nRepeat 4 rounds (16 intervals).",
        "duration": "16 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770241369/mood_app/workout_images/264ds1si_download.jpg",
        "intensityReason": "Tabata sprints maximize power with managed fatigue.",
        "difficulty": "intermediate",
        "workoutType": "Sweat - Light Weights",
        "moodCard": "Sweat / Burn Fat",
        "moodTips": [
          {
            "icon": "body",
            "title": "Drive force from hips and core",
            "description": "Generate rope power from lower body, not just arms"
          },
          {
            "icon": "flash",
            "title": "Short, powerful bursts",
            "description": "Focus on intensity over duration for each interval"
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 1,
        "name": "AMRAP 10 (Slam Ball)",
        "equipment": "Slam Balls",
        "description": "Ten‑minute loop: slams, lateral slams, squat jumps.",
        "battlePlan": "As many rounds as possible in 10 min:\n• 10 Slams\n• 10 Lateral Slams (5/side)\n• 10 Squat Jumps (ball at chest)",
        "duration": "10–12 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770241380/mood_app/workout_images/rfw3jxg0_download_3_.jpg",
        "intensityReason": "Short AMRAP drives pace while keeping form tidy.",
        "difficulty": "intermediate",
        "workoutType": "Sweat - Light Weights",
        "moodCard": "Sweat / Burn Fat",
        "moodTips": [
          {
            "icon": "body",
            "title": "Pivot hips on lateral slams",
            "description": "Rotate through hips for side-to-side power"
          },
          {
            "icon": "fitness",
            "title": "Land jumps softly, stacked",
            "description": "Absorb landing with bent knees and aligned spine"
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 2,
        "name": "Tabata",
        "equipment": "Kettlebells",
        "description": "Four moves cycled Tabata‑style for sixteen total intervals.",
        "battlePlan": "20s work / 10s rest, cycle through:\n• Swings\n• Goblet Squats\n• Alternating Lunges\n• High Pulls\nRepeat 4 rounds (16 intervals total).",
        "duration": "16 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770241371/mood_app/workout_images/9cotsg82_download.jpg",
        "intensityReason": "Timed sprints maximize output with controlled recovery.",
        "difficulty": "intermediate",
        "workoutType": "Sweat - Light Weights",
        "moodCard": "Sweat / Burn Fat",
        "moodTips": [
          {
            "icon": "body",
            "title": "Neutral spine when fatigued",
            "description": "Prioritize back position over speed when tired"
          },
          {
            "icon": "fitness",
            "title": "Drive legs on squats/lunges",
            "description": "Push through floor with leg power, not momentum"
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 3,
        "name": "Push And Drag Circuit",
        "equipment": "Sled",
        "description": "Four rounds: push, backward drag, lateral push, rest.",
        "battlePlan": "Perform 4 rounds:\n• 10 m Push (moderate)\n• 10 m Backward Drag\n• 10 m Lateral Push (sideways)\n• Rest 1 min",
        "duration": "20–22 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770241378/mood_app/workout_images/k8lo936w_download.jpg",
        "intensityReason": "Mixed directions tax mechanics and aerobic capacity.",
        "difficulty": "intermediate",
        "workoutType": "Sweat - Light Weights",
        "moodCard": "Sweat / Burn Fat",
        "moodTips": [
          {
            "icon": "walk",
            "title": "Lateral: hips square, steps controlled",
            "description": "Keep hips facing forward during sideways movement"
          },
          {
            "icon": "body",
            "title": "Drag: knees bent, chest tall",
            "description": "Maintain athletic posture while pulling backward"
          }
        ]
      }
    ]
  },
  {
    "_id": "6a7c70ea6a76d293b68a1702",
    "title": "Muscle Gainer - Back & Bis Volume",
    "mood": "Muscle gainer",
    "duration": "~50 min",
    "badge": "Top pick",
    "heroImageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/mood_app/featured_heroes/muscle_gainer_back_and_bis_volume.jpg",
    "difficulty": "Intermediate",
    "hook": "Pull heavy, curl to failure. Build the taper.",
    "cartSizeOverride": 5,
    "exercises": [
      {
        "exerciseId": "",
        "order": 0,
        "name": "Pull-Ups + Iso Finisher",
        "equipment": "Straight pull up bar",
        "description": "Full pull-ups finished with a static top hold",
        "battlePlan": "3 rounds\n• 6 Pull-Ups\n• Finish with 10s chin-over-bar hold\nRest 90s",
        "duration": "12–14 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240736/mood_app/workout_images/ntsbiqfh_assisted_pull_ups_1.jpg",
        "intensityReason": "Isometric finisher extends time under tension",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Back",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {
            "icon": "construct",
            "title": "Reps stay strict",
            "description": "Finish all reps before adding the hold."
          },
          {
            "icon": "trending-up",
            "title": "Hold with intent",
            "description": "Chest high, shoulders depressed."
          },
          {
            "icon": "timer",
            "title": "Peak contraction is motionless",
            "description": "No shaking, no bar drift."
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 1,
        "name": "Slow Neg Row",
        "equipment": "T bar row machine",
        "description": "Time-under-tension row progression provides a challenging switchup",
        "battlePlan": "4 rounds\n• 8 Neutral Grip Row (3–4s eccentric)\nRest 90s after set",
        "duration": "12–14 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240561/mood_app/workout_images/xdrugsxs_tr.jpg",
        "intensityReason": "3–4s eccentric tempo increases hypertrophy effect",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Back",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {
            "icon": "trending-up",
            "title": "Explode to chest, lower slow & steady.",
            "description": "Fast concentric, slow eccentric maximizes muscle stimulus."
          },
          {
            "icon": "timer",
            "title": "Keep weight lighter to maintain control.",
            "description": "Reduced load allows proper tempo execution and form."
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 2,
        "name": "Underhand Row",
        "equipment": "Seated Chest Supported Row Machine",
        "description": "Stronger pull variation for controlled overload",
        "battlePlan": "4 rounds\n• 8–10 Underhand Grip Row (moderate to heavy)\nRest 75s after set",
        "duration": "12–14 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240901/mood_app/workout_images/pm9titrm_scsrgr.jpg",
        "intensityReason": "Underhand angle shifts load to lats and biceps",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Back",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {
            "icon": "construct",
            "title": "Keep wrists straight, elbows close to torso.",
            "description": "Proper wrist alignment and elbow path optimize pulling mechanics."
          },
          {
            "icon": "timer",
            "title": "Hold 1s at contraction to deepen squeeze.",
            "description": "Peak contraction pause enhances muscle activation."
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 3,
        "name": "Wide-Grip EZ Curl",
        "equipment": "EZ Curl Bar",
        "description": "Standard curl workout biasing short head.",
        "battlePlan": "Battle Plan — Standard Sets\n• 4×10 Wide-Grip EZ Curl — standard reps\nRest 75s",
        "duration": "14–16 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240795/mood_app/workout_images/iskvqgub_download_4_.jpg",
        "intensityReason": "Wide grip targets short head for peak development",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Biceps",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {
            "icon": "hand-left",
            "title": "Grip wider than shoulders",
            "description": "Short-head emphasis"
          },
          {
            "icon": "body",
            "title": "No torso swing",
            "description": "Keeps tension pure"
          },
          {
            "icon": "flash",
            "title": "Squeeze hard at top",
            "description": "Short head pumps fast"
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 4,
        "name": "Incline Cable Curl",
        "equipment": "Cable Machine",
        "description": "Standard long-head curl workout using shoulder extension.",
        "battlePlan": "Battle Plan — Standard Sets\n• 4×10 Incline Cable Curl — standard reps\nRest 75s",
        "duration": "14–16 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240905/mood_app/workout_images/qi05o2xg_download_19_.jpg",
        "intensityReason": "Incline position with cable creates extreme long-head stretch",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Biceps",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {
            "icon": "body",
            "title": "Bench low, arms back",
            "description": "Long-head bias"
          },
          {
            "icon": "timer",
            "title": "Don't rush the bottom",
            "description": "Stretch drives growth"
          },
          {
            "icon": "trending-up",
            "title": "Lean back slightly",
            "description": "Cable stretch amplifies pump"
          }
        ]
      }
    ]
  },
  {
    "_id": "6a7c70ea6a76d293b68a1703",
    "title": "Sweat - Cardio Engine",
    "mood": "Sweat / Burn Fat",
    "duration": "~35 min",
    "badge": "Popular",
    "heroImageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/mood_app/featured_heroes/sweat_cardio_engine.jpg",
    "difficulty": "Intermediate",
    "hook": "Bike, row, climb. Build the engine, torch the tank.",
    "exercises": [
      {
        "exerciseId": "",
        "order": 0,
        "name": "Pyramid Ride",
        "equipment": "Stationary bike",
        "description": "Pyramid intensity progression from easy\nto hard and back down. 3 complete rounds.\n ",
        "battlePlan": "• 3 min easy\n• 2 min moderate\n• 1 min hard\n• 2 min moderate\n• 3 min easy\n• repeat 3x",
        "duration": "30 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240940/mood_app/workout_images/706vd22i_download_2_.jpg",
        "intensityReason": "Progressive pyramids challenge sustained effort.",
        "difficulty": "intermediate",
        "workoutType": "Sweat - Cardio Based",
        "moodCard": "Sweat / Burn Fat",
        "moodTips": [
          {
            "icon": "timer",
            "title": "Active Recovery",
            "description": "Moderate phases are active recovery; track cadence."
          },
          {
            "icon": "refresh",
            "title": "Breathing Rhythm",
            "description": "Use strong, steady breathing to maintain rhythm."
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 1,
        "name": "Power Intervals",
        "equipment": "Row machine",
        "description": "Power intervals alternating hard, moderate,\nand recovery strokes. 4 complete rounds.\n ",
        "battlePlan": "• 1 min hard (28 SPM)\n• 2 min moderate (24 SPM)\n• 1 min slow (20 SPM)\n• repeat 4x",
        "duration": "20 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240957/mood_app/workout_images/sfylsueu_download_copy_4.jpg",
        "intensityReason": "Alternates power strokes and recovery for strength.",
        "difficulty": "intermediate",
        "workoutType": "Sweat - Cardio Based",
        "moodCard": "Sweat / Burn Fat",
        "moodTips": [
          {
            "icon": "barbell",
            "title": "Explosive Drive",
            "description": "Drive explosively from heels (60% legs, 30% core, 10% arms)."
          },
          {
            "icon": "settings",
            "title": "Form Drills",
            "description": "Use slower segments for perfect form drills."
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 2,
        "name": "Interval Climb",
        "equipment": "Stair master",
        "description": "Fast intervals with moderate recovery\nand side step challenges. 4 rounds total.\n ",
        "battlePlan": "• 1 min fast\n• 2 min moderate\n• 1 min side step (face sideways)\n• repeat 4x",
        "duration": "20 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240943/mood_app/workout_images/clikf991_download.jpg",
        "intensityReason": "Mixed patterns challenge intermediate speed and coordination.",
        "difficulty": "intermediate",
        "workoutType": "Sweat - Cardio Based",
        "moodCard": "Sweat / Burn Fat",
        "moodTips": [
          {
            "icon": "body",
            "title": "Side Step Form",
            "description": "Side steps: keep knees soft, engage outer glutes."
          },
          {
            "icon": "flash",
            "title": "Arm Swing",
            "description": "Strong arm swing aids rhythm and balance."
          }
        ]
      }
    ]
  },
  {
    "_id": "6a7c70ea6a76d293b68a1704",
    "title": "Muscle Gainer - Chest & Shoulders",
    "mood": "Muscle gainer",
    "duration": "~50 min",
    "badge": "Trending",
    "heroImageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/mood_app/featured_heroes/muscle_gainer_chest_and_shoulders.jpg",
    "difficulty": "Intermediate",
    "hook": "Push day done right. Press, fly, and cap the delts.",
    "cartSizeOverride": 5,
    "exercises": [
      {
        "exerciseId": "",
        "order": 0,
        "name": "Working Incline",
        "equipment": "Incline bench",
        "description": "Traditional incline benching with meaningful working weight.",
        "battlePlan": "Instructions: Increase load only if all reps stay clean.\nSets: 5\nRest: 90s\n\n• Incline Press — 5 × 6",
        "duration": "14–18 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770241313/mood_app/workout_images/lnd9yph3_ibp.png",
        "intensityReason": "Traditional incline benching with meaningful working weight.",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Chest",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {
            "icon": "barbell",
            "title": "Reps should challenge control",
            "description": "Bar speed slows slightly, form doesn't."
          },
          {
            "icon": "construct",
            "title": "Same angle every set",
            "description": "Consistency drives progress."
          },
          {
            "icon": "people",
            "title": "Spotter optional",
            "description": "Useful on later sets."
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 1,
        "name": "Working Dumbbells",
        "equipment": "Dumbbells",
        "description": "Traditional dumbbell pressing with meaningful load.",
        "battlePlan": "Instructions: Increase weight only if reps stay clean.\nSets: 5\nRest: 90s\n\n• DB Flat Press — 3 × 8\n• DB Incline Press — 2 × 8",
        "duration": "14–18 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240773/mood_app/workout_images/msod5irt_download_19_.jpg",
        "intensityReason": "Traditional dumbbell pressing with meaningful load.",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Chest",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {
            "icon": "barbell",
            "title": "Reps should challenge control",
            "description": "Slight slowdown is fine."
          },
          {
            "icon": "arrow-forward",
            "title": "Press inward at the top",
            "description": "Finish with chest intent."
          },
          {
            "icon": "people",
            "title": "Spotter optional",
            "description": "Useful for heavier sets."
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 2,
        "name": "Working Cables",
        "equipment": "Cable crossover",
        "description": "Traditional cable flyes with meaningful load.",
        "battlePlan": "Instructions: Increase load only if reps stay clean.\nSets: 5\n\n• Mid Cable Fly — 3 × 12\n• Low-to-High Cable Fly — 2 × 12",
        "duration": "14–18 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240780/mood_app/workout_images/vlu2ckag_download_11_.jpg",
        "intensityReason": "Traditional cable flyes with meaningful load.",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Chest",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {
            "icon": "flame",
            "title": "Reps should burn",
            "description": "Chest stays engaged."
          },
          {
            "icon": "construct",
            "title": "Same pulley height",
            "description": "Consistency matters."
          },
          {
            "icon": "shield",
            "title": "Push safely",
            "description": "Cables are forgiving."
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 3,
        "name": "Arnold Press Builder",
        "equipment": "Dumbbells",
        "description": "Standard rotational press workout for full delt recruitment.",
        "battlePlan": "Battle Plan — Standard Sets\n• 5×10 Arnold Press — standard reps\nRest 75s",
        "duration": "14–16 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240980/mood_app/workout_images/64d4m132_arnold_press.jpg",
        "intensityReason": "Standard rotational press workout for full delt recruitment.",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Shoulders",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {
            "icon": "refresh",
            "title": "Rotate smoothly through the press",
            "description": "All delt heads contribute."
          },
          {
            "icon": "trending-down",
            "title": "Control the bottom",
            "description": "Prevents shoulder dump."
          },
          {
            "icon": "people",
            "title": "Spotter optional",
            "description": "Useful near failure."
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 4,
        "name": "Cable Lateral Raise Fatigue Builder",
        "equipment": "Cable Crossover Machine",
        "description": "Pulse-rep isolation workout for extended time under tension.",
        "battlePlan": "Battle Plan — Pulse Sets\n• 4×15 Cable Lateral Raise — pulse reps (top ⅓)\nRest 75s",
        "duration": "15–17 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770241019/mood_app/workout_images/ndk3n5nw_image.jpg",
        "intensityReason": "Pulse-rep isolation workout for extended time under tension.",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Shoulders",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {
            "icon": "flame",
            "title": "Short pulses keep tension constant",
            "description": "Big burn, low joint stress."
          },
          {
            "icon": "hand-left",
            "title": "No swinging under fatigue",
            "description": "Cables expose cheats fast."
          },
          {
            "icon": "checkmark-circle",
            "title": "Chase burn, not numbers",
            "description": "Use a weight that never lets the delt relax."
          }
        ]
      }
    ]
  },
  {
    "_id": "6a7c70ea6a76d293b68a1705",
    "title": "Build Explosion - Power Complex",
    "mood": "Build Explosion",
    "duration": "~30 min",
    "badge": "New",
    "heroImageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/mood_app/featured_heroes/build_explosion_power_complex.jpg",
    "difficulty": "Intermediate",
    "hook": "Load it, launch it, land it. Train like an athlete.",
    "cartSizeOverride": 4,
    "exercises": [
      {
        "exerciseId": "",
        "order": 0,
        "name": "Trap Bar Jump",
        "equipment": "Trap Hex Bar",
        "description": "Small jump with load; soft stick; deliberate stance reset.",
        "battlePlan": "4 rounds\n• 5 × 3 Trap Bar Jumps\nRest 90s",
        "duration": "10–12 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770241140/mood_app/workout_images/dpe352d2_tbj.jpg",
        "intensityReason": "Loaded jumps build speed-strength with aligned mechanics.",
        "difficulty": "intermediate",
        "workoutType": "Build Explosion - Dynamic",
        "moodCard": "Build Explosion",
        "moodTips": [
          {
            "icon": "body",
            "title": "Load",
            "description": "Light load; ribs stacked; avoid deep dip on countermovement"
          },
          {
            "icon": "footsteps",
            "title": "Landing",
            "description": "Land mid-foot; absorb softly; match jump height across sets"
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 1,
        "name": "Clean to Jerk",
        "equipment": "Kettlebells",
        "description": "Pop to rack; dip-drive; punch under; stable overhead stick.",
        "battlePlan": "4 rounds\n• 4 per side Clean → Jerk\nRest 90s",
        "duration": "10–12 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770241149/mood_app/workout_images/gxkmxo9y_download_6_.jpg",
        "intensityReason": "Clean primes rack; jerk expresses rapid vertical force.",
        "difficulty": "intermediate",
        "workoutType": "Build Explosion - Dynamic",
        "moodCard": "Build Explosion",
        "moodTips": [
          {
            "icon": "fitness",
            "title": "Rack",
            "description": "Rack thumb in; elbow down/in; wrist neutral"
          },
          {
            "icon": "arrow-up",
            "title": "Jerk",
            "description": "Dip shallow; soft land; lock elbows solid"
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 2,
        "name": "Box Jump Repeats",
        "equipment": "Plyo Box",
        "description": "Crisp consecutive jumps with short resets to preserve power output",
        "battlePlan": "4 rounds\n• 6–8 Box Jumps\nRest 75s",
        "duration": "10–12 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240628/mood_app/workout_images/wok1mz8a_rbj.jpg",
        "intensityReason": "Repeated jump efforts build sustainable explosive power capacity",
        "difficulty": "intermediate",
        "workoutType": "Build Explosion - Body Weight",
        "moodCard": "Build Explosion",
        "moodTips": [
          {
            "icon": "refresh",
            "title": "Reset",
            "description": "Reset stance and breath each rep"
          },
          {
            "icon": "speedometer",
            "title": "Consistency",
            "description": "Match height and landing each time"
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 3,
        "name": "Slam + Quick Pick",
        "equipment": "Med Ball",
        "description": "Hard slam down, instant scoop up, repeat at consistent steady height",
        "battlePlan": "4 rounds\n• 8–10 Overhead Slams\n• 8–10 Fast Scoop Resets\nRest 90s",
        "duration": "10–12 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240600/mood_app/workout_images/dkiyafwm_download_1_.jpg",
        "intensityReason": "Rapid reset pattern trains repeatable explosive power output",
        "difficulty": "intermediate",
        "workoutType": "Build Explosion - Body Weight",
        "moodCard": "Build Explosion",
        "moodTips": [
          {
            "icon": "body",
            "title": "Spine Position",
            "description": "Keep spine neutral; hinge; reload fast"
          },
          {
            "icon": "speedometer",
            "title": "Consistency",
            "description": "Same slam height every rep"
          }
        ]
      }
    ]
  },
  {
    "_id": "6a7c70ea6a76d293b68a1706",
    "title": "Muscle Gainer - Glute Day",
    "mood": "Muscle gainer",
    "duration": "~45 min",
    "badge": "Popular",
    "heroImageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/mood_app/featured_heroes/muscle_gainer_glute_day.jpg",
    "difficulty": "Intermediate",
    "hook": "Thrust, squat, kick, abduct. Build the shelf.",
    "cartSizeOverride": 4,
    "exercises": [
      {
        "exerciseId": "",
        "order": 0,
        "name": "Glute-Biased Back Squat",
        "equipment": "Barbell",
        "description": "Wider stance squats emphasizing glute engagement and strength",
        "battlePlan": "4 rounds\n• 8–10 reps\nRest 120s",
        "duration": "14–16 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770241394/mood_app/workout_images/gxoxkpbs_download_5_.jpg",
        "intensityReason": "Wider stance emphasizes hip drive and glute recruitment",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Compound",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {
            "icon": "expand",
            "title": "Push knees outward hard",
            "description": "Creates better glute recruitment and hip stability."
          },
          {
            "icon": "footsteps",
            "title": "Drive through your heels",
            "description": "You should feel glutes working before quads dominate."
          },
          {
            "icon": "flame",
            "title": "Tension should build each round",
            "description": "If reps still feel easy late, increase load."
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 1,
        "name": "Tempo Hip Thrust",
        "equipment": "Hip Thruster Equipment",
        "description": "Slow eccentrics increasing glute time under tension",
        "battlePlan": "4 rounds\n• 8–10 Thrusts (3s eccentric)\nRest 90s",
        "duration": "14–16 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240679/mood_app/workout_images/mr69uwpz_bb_hip_thrust.jpg",
        "intensityReason": "Extended eccentric phase maximizes muscle fiber recruitment",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Glutes",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {
            "icon": "timer",
            "title": "Three-second lower",
            "description": "Slower descent intensifies loading."
          },
          {
            "icon": "pause",
            "title": "Pause at lockout",
            "description": "One-second squeeze reinforces contraction."
          },
          {
            "icon": "shield",
            "title": "Core braced",
            "description": "Prevents lower-back takeover."
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 2,
        "name": "Heavy Kickback",
        "equipment": "Glute Kick Machine",
        "description": "Progressive overload builds strength at extension",
        "battlePlan": "4 rounds\n• 8–10 Heavy Kickbacks per leg\nRest 90s",
        "duration": "14–16 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770241405/mood_app/workout_images/u602jvhu_download_9_.jpg",
        "intensityReason": "Increased load pushes hypertrophy for glutes",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Glutes",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {
            "icon": "construct",
            "title": "Keep back steady, hips square to pad",
            "description": "Hip stability prevents compensations under heavier loads."
          },
          {
            "icon": "shield",
            "title": "Push controlled, bar no sudden drops",
            "description": "Controlled movement maintains form and prevents injury."
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 3,
        "name": "Cable High Kickback",
        "equipment": "Single Stack Cable Machine",
        "description": "Top‑end contraction isolates and strengthens glutes",
        "battlePlan": "3 rounds\n• 8–10 per leg Kickbacks (2s pause top)\nRest 75–90s",
        "duration": "14–16 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770241390/mood_app/workout_images/coxrp5yp_gk.jpg",
        "intensityReason": "Kickbacks with higher angle add peak glute tension",
        "difficulty": "intermediate",
        "workoutType": "Muscle Gainer - Glutes",
        "moodCard": "Muscle gainer",
        "moodTips": [
          {
            "icon": "construct",
            "title": "Ankle cuff, pulley low, hinge slightly forward",
            "description": "Low pulley position creates optimal resistance curve for glutes."
          },
          {
            "icon": "timer",
            "title": "Kick upward + back, pause two seconds top",
            "description": "Pause at peak contraction maximizes muscle activation and control."
          }
        ]
      }
    ]
  },
  {
    "_id": "6a7c70ea6a76d293b68a1707",
    "title": "Outdoor - Hill Repeats",
    "mood": "Get Outside",
    "duration": "~25 min",
    "badge": "New",
    "heroImageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/mood_app/featured_heroes/outdoor_hill_repeats.jpg",
    "difficulty": "Intermediate",
    "hook": "Find a hill. Make it hate you back.",
    "exercises": [
      {
        "exerciseId": "",
        "order": 0,
        "name": "Hill Power Mix",
        "equipment": "Hills",
        "description": "Powerful jumps plus sprints develop rhythm and drive uphill.",
        "battlePlan": "• 6x 12–15 uphill bounds (walk down)\n• 6x 25–30 yd uphill skips for height (walk down)\n• 6x 25–30 yd uphill sprints (walk down)",
        "duration": "18–24 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240859/mood_app/workout_images/zqqramht_download_13_.jpg",
        "intensityReason": "Bounds, skips, sprints build elastic strength safely.",
        "difficulty": "intermediate",
        "workoutType": "Outdoor - Hills",
        "moodCard": "Get Outside",
        "moodTips": [
          {
            "icon": "trending-up",
            "title": "Bounds: knee drive then hip extend; stick landings under control",
            "description": "Drive knee high, extend hip fully, and land with stability"
          },
          {
            "icon": "walk",
            "title": "Avoid heel striking uphill; keep cadence snappy and forward",
            "description": "Land on midfoot with quick turnover for uphill efficiency"
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 1,
        "name": "Strength Endurance Mix",
        "equipment": "Hills",
        "description": "Lunges, broad jumps, sprints reinforce controlled power.",
        "battlePlan": "• 6 sets:\n\n20 yd uphill walking lunges\n6–8 uphill broad jumps (~20 yd)\n20 yd uphill sprint\nWalk down recovery",
        "duration": "20–26 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240856/mood_app/workout_images/xyu6atdo_download_10_.jpg",
        "intensityReason": "Lunges and jumps pre-fatigue, then sprints build posture.",
        "difficulty": "intermediate",
        "workoutType": "Outdoor - Hills",
        "moodCard": "Get Outside",
        "moodTips": [
          {
            "icon": "body",
            "title": "Lunges: knee over mid-foot; upright torso; no inward collapse",
            "description": "Align knee with foot center while staying tall without knee cave"
          },
          {
            "icon": "trending-up",
            "title": "Broad jumps: swing arms; land softly; stabilize before sprint",
            "description": "Use arm momentum, absorb landing, then set before running"
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 2,
        "name": "Sprint-Only 30s",
        "equipment": "Hills",
        "description": "Ten uphill sprints at 30–40 yd build acceleration safely.",
        "battlePlan": "• 10x 30–40 yd uphill sprints, full walk down",
        "duration": "18–24 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240831/mood_app/workout_images/8d9vosf3_download_12_.jpg",
        "intensityReason": "Short fast sprints improve power with full recovery.",
        "difficulty": "intermediate",
        "workoutType": "Outdoor - Hills",
        "moodCard": "Get Outside",
        "moodTips": [
          {
            "icon": "trending-up",
            "title": "Drive arms; chin level; tall posture; quick ground contacts",
            "description": "Pump arms powerfully with head neutral and fast foot turnover"
          },
          {
            "icon": "body",
            "title": "If hamstrings tighten, reduce volume to protect from strain",
            "description": "Cut reps short if back of legs feel tight to prevent injury"
          }
        ]
      }
    ]
  },
  {
    "_id": "6a7c70ea6a76d293b68a1708",
    "title": "Outdoor - Park Circuit",
    "mood": "Get Outside",
    "duration": "~25 min",
    "badge": "Classic",
    "heroImageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/mood_app/featured_heroes/outdoor_park_circuit.jpg",
    "difficulty": "Intermediate",
    "hook": "A bench, a bar, and a lap. That's the whole gym.",
    "exercises": [
      {
        "exerciseId": "",
        "order": 0,
        "name": "Park Push-Pull-Run",
        "equipment": "Park workout",
        "description": "Rows, push-ups, dips, step-ups, runs build endurance.",
        "battlePlan": "• 4 rounds:\n\n10 bench rows\n10 push-ups\n10–12 dips\n10 step-ups/side\n200 m run\n• Rest 60–90s",
        "duration": "22–26 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240854/mood_app/workout_images/xmpcsqgf_download_22_.jpg",
        "intensityReason": "Balanced upper/lower work with runs sustains output.",
        "difficulty": "intermediate",
        "workoutType": "Outdoor - Park",
        "moodCard": "Get Outside",
        "moodTips": [
          {
            "icon": "body",
            "title": "Rows: ribs down; avoid flaring; elbows track for shoulder safety",
            "description": "Keep ribs pulled in with elbows moving along your sides"
          },
          {
            "icon": "leaf",
            "title": "Dips: slight forward lean; keep elbows near body; full control",
            "description": "Tilt forward slightly with elbows close and smooth movement"
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 1,
        "name": "EMOM Park Strength",
        "equipment": "Park workout",
        "description": "Dips, jumps, push-ups, short runs cycle with planned rest.",
        "battlePlan": "• 20 min EMOM:\n\nMin 1: 10–12 dips\nMin 2: 10 bench jumps or step-ups/side\nMin 3: 10–12 push-ups\nMin 4: 200 m run",
        "duration": "20–24 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240844/mood_app/workout_images/ixf6e9ex_download_20_.jpg",
        "intensityReason": "EMOM timing preserves quality while managing fatigue.",
        "difficulty": "intermediate",
        "workoutType": "Outdoor - Park",
        "moodCard": "Get Outside",
        "moodTips": [
          {
            "icon": "trending-up",
            "title": "Bench jumps: land softly; knees stacked; absorb through hips",
            "description": "Touch down gently with aligned knees and hip absorption"
          },
          {
            "icon": "body",
            "title": "Push-ups: elbows ~45°; shoulder blades glide; avoid flares",
            "description": "Keep elbows at moderate angle with smooth scapular movement"
          }
        ]
      },
      {
        "exerciseId": "",
        "order": 2,
        "name": "Circuit With Runs",
        "equipment": "Park workout",
        "description": "Dips, squats, rows, runs create balanced stress safely.",
        "battlePlan": "• 4 rounds:\n\n12 bench dips\n15 air squats\n10 bench rows\n200 m run\n• 60–90s rest",
        "duration": "22–26 min",
        "imageUrl": "https://res.cloudinary.com/dfsygar5c/image/upload/v1770240819/mood_app/workout_images/0aaca0zk_download_16_.jpg",
        "intensityReason": "Mixed calisthenics and light runs train steady output.",
        "difficulty": "intermediate",
        "workoutType": "Outdoor - Park",
        "moodCard": "Get Outside",
        "moodTips": [
          {
            "icon": "body",
            "title": "Squats: tripod foot; knees track; maintain even depth each rep",
            "description": "Distribute weight across foot with consistent squat depth"
          },
          {
            "icon": "leaf",
            "title": "Rows: neutral neck; engage lats first; avoid shrugging tension",
            "description": "Keep head aligned and initiate pull with back muscles"
          }
        ]
      }
    ]
  }
]

# The exact order of featured workout IDs for the carousel
# (seed-time stable _ids; auto-seed regenerates real ObjectIds at startup.)
FEATURED_WORKOUT_IDS = [
    "6a7c70ea6a76d293b68a1701",  # Sweat - HIIT Circuit
    "6a7c70ea6a76d293b68a1702",  # Muscle Gainer - Back & Bis Volume
    "6a7c70ea6a76d293b68a1703",  # Sweat - Cardio Engine
    "6a7c70ea6a76d293b68a1704",  # Muscle Gainer - Chest & Shoulders
    "6a7c70ea6a76d293b68a1705",  # Build Explosion - Power Complex
    "6a7c70ea6a76d293b68a1706",  # Muscle Gainer - Glute Day
    "6a7c70ea6a76d293b68a1707",  # Outdoor - Hill Repeats
    "6a7c70ea6a76d293b68a1708",  # Outdoor - Park Circuit
]
