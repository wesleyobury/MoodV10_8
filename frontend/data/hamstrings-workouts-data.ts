import { EquipmentWorkouts } from '../types/workout';

export const hamstringsWorkoutDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Dumbbells',
    icon: 'barbell',
    workouts: {
      beginner: [
        {
          name: 'Dumbbell RDL',
          duration: '10–12 min',
          description: 'Teaches safe mechanics and stretch for hypertrophy',
          battlePlan: '3 rounds\n• 10–12 Dumbbell RDLs\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Dumbbell RDLs",
                    "reps": "10–12",
                    "tutorialSlug": "db_rdl"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241342/mood_app/workout_images/d1gxk1c1_download_18_.jpg',
          intensityReason: 'Starter hinge builds hamstring stretch and control',
          moodTips: [
            {
              icon: 'construct',
              title: 'Keep dumbbells close to legs during hinge',
              description: 'Proper path ensures maximum hamstring activation and safety.'
            },
            {
              icon: 'body',
              title: 'Slight knee bend, spine neutral throughout',
              description: 'Maintain neutral spine to protect back while targeting hamstrings.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Dumbbell Good Morning (Chest Hold)',
          duration: '10–12 min',
          description: 'Difficult lift, always start light and progress slowly',
          battlePlan: '3 rounds\n• 8–10 DB Good Mornings\nRest 75–90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "DB Good Mornings",
                    "reps": "8–10",
                    "tutorialSlug": "barbell_good_mornings"
                  }
                ],
                "rounds": 3,
                "rest": "75–90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241363/mood_app/workout_images/vgioydhr_dbgm.jpg',
          intensityReason: 'Upright hinge challenges hamstrings + posture',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Hold DB tight to chest, elbows in',
              description: 'Secure grip maintains stability during hinge movement.'
            },
            {
              icon: 'trending-down',
              title: 'Push hips back, don\'t let chest drop',
              description: 'Hip hinge pattern protects spine while loading hamstrings.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Dumbbell Suitcase RDL',
          duration: '10–12 min',
          description: 'Single-side RDLs reinforcing hamstring control',
          battlePlan: '3 rounds\n• 10 RDLs per side\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "RDLs per side",
                    "reps": "10",
                    "tutorialSlug": "smith_machine_rdl"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240669/mood_app/workout_images/e4tblt9j_download_18_.jpg',
          intensityReason: 'Unilateral loading builds balanced hamstring strength',
          moodTips: [
            {
              icon: 'body',
              title: 'Bell tracks leg',
              description: 'Keeps hinge symmetrical.'
            },
            {
              icon: 'construct',
              title: 'Hips square',
              description: 'No rotation toward weight.'
            },
            {
              icon: 'resize',
              title: 'Stretch then stand',
              description: 'Hamstrings load before glutes.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Dumbbell Hamstring Walkouts',
          duration: '10–12 min',
          description: 'Floor walkouts emphasizing eccentric hamstring control',
          battlePlan: '3 rounds\n• 6–8 Walkouts\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Walkouts",
                    "reps": "6–8"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240690/mood_app/workout_images/wd5yzviz_db_hamstring_walkout.jpg',
          intensityReason: 'Walkouts challenge hamstring control through full range',
          moodTips: [
            {
              icon: 'body',
              title: 'Hips stay lifted',
              description: 'Bridge position stays locked.'
            },
            {
              icon: 'footsteps',
              title: 'Small heel steps',
              description: 'Slower equals harder.'
            },
            {
              icon: 'alert',
              title: 'Stop before drop',
              description: 'End set when hips fall.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Staggered‑Stance DB RDL',
          duration: '14–16 min',
          description: 'Single‑leg hinge balances strength across sides',
          battlePlan: '4 rounds\n• 8 per side Staggered RDLs\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "per side Staggered RDLs",
                    "reps": "8",
                    "tutorialSlug": "db_rdl"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241360/mood_app/workout_images/skovrpoc_image.jpg',
          intensityReason: 'Split stance emphasizes deeper hamstring load',
          moodTips: [
            {
              icon: 'construct',
              title: 'Stagger feet, 80% load on front leg',
              description: 'Uneven weight distribution targets working side hamstrings.'
            },
            {
              icon: 'trending-down',
              title: 'Control descent for full hamstring stretch',
              description: 'Slow eccentric maximizes muscle lengthening and development.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'DB Deficit RDL',
          duration: '14–16 min',
          description: 'Elevation increases hypertrophy by extended ROM',
          battlePlan: '3 rounds\n• 8–10 Deficit DB RDLs\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Deficit DB RDLs",
                    "reps": "8–10",
                    "tutorialSlug": "db_rdl"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241322/mood_app/workout_images/4qp237ff_download_3_.jpg',
          intensityReason: 'Deficit stance adds longer hamstring stretch load',
          moodTips: [
            {
              icon: 'construct',
              title: 'Stand on plate, keep DBs close to thighs',
              description: 'Elevated position increases range of motion for deeper stretch.'
            },
            {
              icon: 'flash',
              title: 'Lower under strict control, drive up steady',
              description: 'Controlled movement prevents injury while maximizing benefit.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Dumbbell Staggered-Stance RDL',
          duration: '14–16 min',
          description: 'Rear-foot-light RDL emphasizing lead hamstring',
          battlePlan: '4 rounds\n• 8 RDLs per leg\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "RDLs per leg",
                    "reps": "8",
                    "tutorialSlug": "smith_machine_rdl"
                  }
                ],
                "rounds": 4,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240668/mood_app/workout_images/djo9uunp_db_rdl_2.jpg',
          intensityReason: 'Staggered stance isolates front leg hamstring',
          moodTips: [
            {
              icon: 'body',
              title: 'Front leg loads',
              description: 'Back foot assists balance only.'
            },
            {
              icon: 'trending-down',
              title: 'Hinge over front hip',
              description: 'Hamstring stretch should be unilateral.'
            },
            {
              icon: 'timer',
              title: 'Slow descent',
              description: 'Control lengthened phase.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Paused DB RDL',
          duration: '16–18 min',
          description: 'Burns hamstrings with static stress and strict tempo',
          battlePlan: '4 rounds\n• 6–8 Paused DB RDLs\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Paused DB RDLs",
                    "reps": "6–8",
                    "tutorialSlug": "db_rdl"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241323/mood_app/workout_images/5v2oyit3_dbrdl.jpg',
          intensityReason: 'Pausing mid‑shin removes momentum, builds control',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause 2s at mid‑shin, don\'t lose brace',
              description: 'Isometric hold increases time under tension and control.'
            },
            {
              icon: 'flash',
              title: 'Explode up smooth, no jerking bar path',
              description: 'Controlled concentric prevents injury and maximizes power.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: '1½ Rep DB RDL Combo',
          duration: '16–18 min',
          description: 'Complex set multiplies time under hamstring tension',
          battlePlan: '3 rounds\n• 8 Combo Reps (full + half = 1 rep)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "1½ Rep DB RDL Combo",
                    "reps": "8",
                    "tutorialSlug": "db_rdl"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240651/mood_app/workout_images/vj5eokcy_download_17_.jpg',
          intensityReason: 'Adds half reps between full reps for constant stress',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Perform one full + one half as one rep',
              description: 'Complex rep pattern extends time under tension significantly.'
            },
            {
              icon: 'construct',
              title: 'Keep tempo smooth, no bouncing at knees',
              description: 'Smooth rhythm prevents momentum and maintains muscle tension.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Dumbbell RDL Triple Drop',
          duration: '18–20 min',
          description: 'Extended RDL sets using three rapid drops',
          battlePlan: '3 rounds\n• 8 RDLs\n• Drop → 6\n• Drop → 6\n• Drop → 6\nRest 150s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "RDLs",
                    "reps": "8",
                    "tutorialSlug": "smith_machine_rdl",
                    "note": "Drop → 6; Drop → 6; Drop → 6"
                  }
                ],
                "rounds": 3,
                "rest": "150s"
              }
            ]
          },
          imageUrl: '',
          intensityReason: 'Triple drops maximize hamstring fatigue and hypertrophy',
          moodTips: [
            {
              icon: 'flash',
              title: 'Three drops straight',
              description: 'Strip weight quickly.'
            },
            {
              icon: 'resize',
              title: 'Depth never shortens',
              description: 'Same hinge every drop.'
            },
            {
              icon: 'hand-left',
              title: 'Grip straps allowed',
              description: 'Hamstrings dictate failure.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Dumbbell Long-Pause RDL',
          duration: '18–20 min',
          description: 'Paused RDLs strengthening stretched hamstrings',
          battlePlan: '4 rounds\n• 6 RDLs (3s pause)\nRest 150s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "RDLs",
                    "reps": "6",
                    "tutorialSlug": "smith_machine_rdl"
                  }
                ],
                "rounds": 4,
                "rest": "150s"
              }
            ]
          },
          imageUrl: '',
          intensityReason: 'Long pauses build strength in lengthened position',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause below knees',
              description: 'Hold longest hamstring length.'
            },
            {
              icon: 'shield',
              title: 'Brace hard',
              description: 'Prevents spinal drift.'
            },
            {
              icon: 'flame',
              title: 'Expect deep fatigue',
              description: 'Hamstrings fail first.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'mixed',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Barbell',
    icon: 'barbell',
    workouts: {
      beginner: [
        {
          name: 'Barbell RDL',
          duration: '10–12 min',
          description: 'Fundamental builder, strengthen hinge with light loads',
          battlePlan: '3 rounds\n• 10 Barbell RDLs\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Barbell RDLs",
                    "reps": "10",
                    "tutorialSlug": "barbell_rdl"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240638/mood_app/workout_images/46ki5rsl_download_15_.jpg',
          intensityReason: 'Basic hinge develops hamstrings under straight bar',
          moodTips: [
            {
              icon: 'construct',
              title: 'Bar slides on thighs down shin',
              description: 'Close bar path maximizes hamstring engagement throughout range.'
            },
            {
              icon: 'body',
              title: 'Keep knees soft, brace abs fully',
              description: 'Slight knee bend with core stability protects spine.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Barbell Good Morning (Light!)',
          duration: '10–12 min',
          description: 'Hard lift, best done light for controlled practice',
          battlePlan: '3 rounds\n• 8 Good Mornings\nRest 75–90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Good Mornings",
                    "reps": "8",
                    "tutorialSlug": "barbell_good_mornings"
                  }
                ],
                "rounds": 3,
                "rest": "75–90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240653/mood_app/workout_images/vysbxwqg_download_16_.jpg',
          intensityReason: 'Bar on back hinge is effective but very demanding',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Barbell resting high traps, chest open',
              description: 'Proper bar position distributes load safely across shoulders.'
            },
            {
              icon: 'trending-down',
              title: 'Shift hips back, spine locked neutral',
              description: 'Hip hinge movement protects spine while loading hamstrings.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'pump',
          intensity_cost: 2,
        },
        {
          name: 'Barbell Hip Hinge Good Morning',
          duration: '10–12 min',
          description: 'Light bar good mornings emphasizing hamstring stretch',
          battlePlan: '3 rounds\n• 12 Good Mornings\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Good Mornings",
                    "reps": "12",
                    "tutorialSlug": "barbell_good_mornings"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240665/mood_app/workout_images/9wufahvm_bb_goodmorning.jpg',
          intensityReason: 'Good mornings teach proper hip hinge mechanics',
          moodTips: [
            {
              icon: 'body',
              title: 'Soft knees always',
              description: 'Slight bend protects joints and loads hamstrings.'
            },
            {
              icon: 'arrow-back',
              title: 'Hips move first',
              description: 'Bar lowers as hips push straight back.'
            },
            {
              icon: 'resize',
              title: 'Stop at stretch',
              description: 'Depth ends when hamstrings fully lengthen.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Barbell Stiff-Leg Iso Hold',
          duration: '10–12 min',
          description: 'Isometric hinge holds reinforcing hamstring tension',
          battlePlan: '3 rounds\n• 20–30s Stiff-Leg Hold\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Stiff-Leg Hold",
                    "reps": "20–30s"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240685/mood_app/workout_images/ry5w35jl_image.jpg',
          intensityReason: 'Isometric holds build hamstring endurance and control',
          moodTips: [
            {
              icon: 'timer',
              title: 'Hold mid-hinge',
              description: 'Pause just past knee level.'
            },
            {
              icon: 'shield',
              title: 'Brace core tight',
              description: 'Prevents lumbar takeover.'
            },
            {
              icon: 'pulse',
              title: 'Feel hamstrings shake',
              description: 'Tension should live behind knees.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'pump',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Barbell Sumo Deadlift',
          duration: '14–16 min',
          description: 'Wide stance deadlift emphasizes inner hamstrings and glutes',
          battlePlan: '4 rounds\n• 8–10 Sumo Deadlifts\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Sumo Deadlifts",
                    "reps": "8–10",
                    "tutorialSlug": "barbell_sumo_deadlift"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240638/mood_app/workout_images/46ki5rsl_download_15_.jpg',
          videoUrl: 'https://res.cloudinary.com/dfsygar5c/video/upload/v1770240483/mood_app/workout_videos/BB_sumo_deadlift.mov',
          intensityReason: 'Sumo stance recruits more inner thigh and glute drive',
          moodTips: [
            {
              icon: 'resize',
              title: 'Wide stance, toes out 45°, grip inside knees',
              description: 'Proper sumo setup engages glutes and inner thighs optimally.'
            },
            {
              icon: 'flash',
              title: 'Drive hips forward, squeeze glutes at lockout',
              description: 'Full hip extension with glute squeeze completes the movement.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'deadlift',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Barbell Pause RDL',
          duration: '14–16 min',
          description: 'Strict hold eliminates momentum, builds hamstring size',
          battlePlan: '4 rounds\n• 8 RDLs (2s pause at shin)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "RDLs",
                    "reps": "8",
                    "tutorialSlug": "smith_machine_rdl"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240638/mood_app/workout_images/46ki5rsl_download_15_.jpg',
          intensityReason: 'Mid‑hinge pause increases hamstring strength time',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause 2s across shin level',
              description: 'Isometric hold at stretched position builds strength.'
            },
            {
              icon: 'construct',
              title: 'Keep bar tight against body always',
              description: 'Close bar path maintains hamstring tension throughout.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Barbell Deficit RDL',
          duration: '14–16 min',
          description: 'Creates extra tension through hamstring length ROM',
          battlePlan: '3 rounds\n• 6–8 Deficit Barbell RDLs\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Deficit Barbell RDLs",
                    "reps": "6–8",
                    "tutorialSlug": "barbell_rdl"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241340/mood_app/workout_images/chdxu3vk_deficit_rdl.jpg',
          intensityReason: 'Standing elevated extends hinge stretch fully',
          moodTips: [
            {
              icon: 'construct',
              title: 'Stand on 2‑inch plates, core tight',
              description: 'Elevated position increases range for deeper hamstring stretch.'
            },
            {
              icon: 'flash',
              title: 'Drive hips through, don\'t round spine',
              description: 'Hip drive with spine neutral maximizes safety and power.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Barbell Tempo Good Morning',
          duration: '14–16 min',
          description: 'Slow-eccentric good mornings for time under tension',
          battlePlan: '4 rounds\n• 8 Good Mornings (3s eccentric)\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Good Mornings",
                    "reps": "8",
                    "tutorialSlug": "barbell_good_mornings"
                  }
                ],
                "rounds": 4,
                "rest": "120s"
              }
            ]
          },
          imageUrl: '',
          intensityReason: 'Tempo work maximizes hamstring time under tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Three-second descent',
              description: 'Lengthens hamstrings under load.'
            },
            {
              icon: 'body',
              title: 'Neutral spine priority',
              description: 'Back angle stays constant.'
            },
            {
              icon: 'flash',
              title: 'Drive hips through',
              description: 'Glutes assist but hamstrings initiate.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'strength',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Barbell Tempo RDL',
          duration: '16–18 min',
          description: 'Strict controlled pace maximizes hypertrophy stimulus',
          battlePlan: '4 rounds\n• 6 Tempo RDLs (3s eccentric)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Tempo RDLs",
                    "reps": "6",
                    "tutorialSlug": "smith_machine_rdl"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240638/mood_app/workout_images/46ki5rsl_download_15_.jpg',
          intensityReason: '3s eccentric raises time under tension dramatically',
          moodTips: [
            {
              icon: 'timer',
              title: '3s lowering, 1s up, stay locked core',
              description: 'Extended eccentric with fast concentric maximizes hypertrophy.'
            },
            {
              icon: 'construct',
              title: 'Don\'t rush, hold bar close body',
              description: 'Tempo control with proper bar path ensures safety and effectiveness.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Barbell RDL + Rack Pull Combo',
          duration: '16–18 min',
          description: 'Hamstring fatigue plus power finish explosively',
          battlePlan: '3 rounds\n• 6 RDLs\n• 4 Rack Pulls heavy\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "RDLs",
                    "reps": "6",
                    "tutorialSlug": "smith_machine_rdl"
                  },
                  {
                    "name": "Rack Pulls heavy",
                    "reps": "4",
                    "tutorialSlug": "rack_pull"
                  }
                ],
                "rounds": 3,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240642/mood_app/workout_images/joz0sngb_download_14_.jpg',
          intensityReason: 'Heavy rack pulls pair with RDL for full overload',
          moodTips: [
            {
              icon: 'construct',
              title: 'Start with RDLs strict tempo',
              description: 'Begin with controlled movement to pre-fatigue hamstrings.'
            },
            {
              icon: 'flash',
              title: 'Finish with heavy rack pulls top half',
              description: 'Heavy partial range builds strength at strongest position.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'deadlift',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Barbell RDL Drop Series',
          duration: '18–20 min',
          description: 'Extended RDL sets using multiple rapid drops',
          battlePlan: '3 rounds\n• 6 RDLs\n• Drop → 6\n• Drop → 6\nRest 150s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "RDLs",
                    "reps": "6",
                    "tutorialSlug": "smith_machine_rdl",
                    "note": "Drop → 6; Drop → 6"
                  }
                ],
                "rounds": 3,
                "rest": "150s"
              }
            ]
          },
          imageUrl: '',
          intensityReason: 'Drop series extends hamstring fatigue for hypertrophy',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drops are immediate',
              description: 'Reduce load ~20–25% without rest.'
            },
            {
              icon: 'construct',
              title: 'Hinge mechanics unchanged',
              description: 'Same depth on all drops.'
            },
            {
              icon: 'hand-left',
              title: 'Straps allowed',
              description: 'Hamstrings, not grip, should fail.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Barbell Lengthened-Pause RDL',
          duration: '18–20 min',
          description: 'Paused RDLs emphasizing stretched hamstring strength',
          battlePlan: '4 rounds\n• 5–6 RDLs (2s pause)\nRest 150s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "RDLs",
                    "reps": "5–6",
                    "tutorialSlug": "smith_machine_rdl"
                  }
                ],
                "rounds": 4,
                "rest": "150s"
              }
            ]
          },
          imageUrl: '',
          intensityReason: 'Paused stretches build strength in lengthened position',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause below knees',
              description: 'Hold where hamstrings feel longest.'
            },
            {
              icon: 'shield',
              title: 'Stay tight in pause',
              description: 'No relaxing into joints.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Heavy pauses fatigue quickly.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'hinge',
          training_style: 'strength',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Roman Chair',
    icon: 'square-outline',
    workouts: {
      beginner: [
        {
          name: 'Roman Chair Back Extension',
          duration: '10–12 min',
          description: 'Establish hinge mechanics for beginner lifters',
          battlePlan: '3 rounds\n• 12–15 Back Extensions\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Back Extensions",
                    "reps": "12–15",
                    "tutorialSlug": "roman_chair_back_extension"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240648/mood_app/workout_images/srezw23f_rc.jpg',
          intensityReason: 'Bodyweight hinge builds hamstring control safely',
          moodTips: [
            {
              icon: 'body',
              title: 'Cross arms chest, move spine locked',
              description: 'Arm position and spine stability ensure proper movement pattern.'
            },
            {
              icon: 'trending-down',
              title: 'Stop when hamstring stretch felt',
              description: 'Range of motion should be dictated by hamstring flexibility.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Roman Chair Good Morning',
          duration: '10–12 min',
          description: 'Strengthens core as hamstrings extend repeatedly',
          battlePlan: '3 rounds\n• 12 Good Morning Reps (bodyweight)\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Good Morning Reps",
                    "reps": "12",
                    "tutorialSlug": "barbell_good_mornings"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240647/mood_app/workout_images/p2gogdp0_download_20_.jpg',
          intensityReason: 'Torso hinge without load builds basic stability',
          moodTips: [
            {
              icon: 'construct',
              title: 'Keep hips anchored, hinge down slow',
              description: 'Hip stability with controlled descent builds foundational strength.'
            },
            {
              icon: 'shield',
              title: 'Avoid jerking torso quickly upward',
              description: 'Smooth movement prevents injury and maintains muscle tension.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Hamstring-Bias Extension',
          duration: '10–12 min',
          description: 'Short-range extensions emphasizing hamstring stretch',
          battlePlan: '3 rounds\n• 12 Extensions\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Extensions",
                    "reps": "12"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240684/mood_app/workout_images/qscgkw62_back_ext.jpg',
          intensityReason: 'Hamstring-focused movement builds posterior chain control',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Hinge not lift',
              description: 'Movement comes from hips.'
            },
            {
              icon: 'construct',
              title: 'Stop before lockout',
              description: 'Keeps tension posterior.'
            },
            {
              icon: 'timer',
              title: 'Slow tempo',
              description: 'Control every rep.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Iso Hinge Hold',
          duration: '10–12 min',
          description: 'Static hinge holds reinforcing hamstring endurance',
          battlePlan: '3 rounds\n• 20–30s Hold\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Iso Hinge Hold",
                    "reps": "20–30s"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240682/mood_app/workout_images/oixv12p3_rc_back_ext_3.jpg',
          intensityReason: 'Isometric holds build hamstring endurance',
          moodTips: [
            {
              icon: 'timer',
              title: 'Hold mid-range',
              description: 'Maximum hamstring tension.'
            },
            {
              icon: 'shield',
              title: 'Brace core tight',
              description: 'Prevents back strain.'
            },
            {
              icon: 'pulse',
              title: 'Breathe steadily',
              description: 'Avoid shaking out early.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Weighted Back Extension',
          duration: '14–16 min',
          description: 'Resistance progression builds hypertrophy effectively',
          battlePlan: '4 rounds\n• 10 Weighted Back Extensions\nRest 75–90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Weighted Back Extensions",
                    "reps": "10",
                    "tutorialSlug": "roman_chair_weighted_back_extension"
                  }
                ],
                "rounds": 4,
                "rest": "75–90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240648/mood_app/workout_images/srezw23f_rc.jpg',
          intensityReason: 'Hug plate to overload hamstring hinge movement',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Hug plate chest tight secure',
              description: 'Secure grip and body position maintain safety under load.'
            },
            {
              icon: 'shield',
              title: 'Don\'t hyperextend spine upwards',
              description: 'Controlled range prevents back hyperextension injury.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Single‑Leg Extension',
          duration: '14–16 min',
          description: 'Forces balance and greater range for each limb',
          battlePlan: '3 rounds\n• 8–10 per side\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Single‑Leg Extension",
                    "reps": "8–10"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241362/mood_app/workout_images/v9w417gg_slrcext.jpg',
          intensityReason: 'Single leg increases unilateral hamstring stress',
          moodTips: [
            {
              icon: 'construct',
              title: 'One leg braced, hinge slow',
              description: 'Single leg work challenges balance and unilateral strength.'
            },
            {
              icon: 'body',
              title: 'Keep hips square to bench pad',
              description: 'Hip stability prevents compensation and ensures proper targeting.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Extension + Pause',
          duration: '14–16 min',
          description: 'Extensions with pauses at stretched position',
          battlePlan: '4 rounds\n• 8 Extensions (2s pause)\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Extensions",
                    "reps": "8"
                  }
                ],
                "rounds": 4,
                "rest": "120s"
              }
            ]
          },
          imageUrl: '',
          intensityReason: 'Paused stretches strengthen hamstrings in lengthened position',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause near bottom',
              description: 'Strengthens hamstrings long.'
            },
            {
              icon: 'shield',
              title: 'Stay braced',
              description: 'No spinal collapse.'
            },
            {
              icon: 'construct',
              title: 'Controlled ascent',
              description: 'Smooth return.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Pause Back Extension',
          duration: '16–18 min',
          description: 'Eliminates swing, prolongs posterior chain tension',
          battlePlan: '3 rounds\n• 8 Paused Extensions\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pause Back Extension",
                    "reps": "8",
                    "tutorialSlug": "roman_chair_back_extension"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240648/mood_app/workout_images/srezw23f_rc.jpg',
          intensityReason: 'Static hold at hinge builds hamstring isometric work',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause 2s at mid‑hinge low',
              description: 'Isometric hold at stretched position builds control and strength.'
            },
            {
              icon: 'flash',
              title: 'Drive back up locked glutes strong',
              description: 'Explosive concentric with glute finish maximizes power development.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Alternating Half + Full Extensions',
          duration: '16–18 min',
          description: 'Alternating range burns hamstrings under long tension',
          battlePlan: '3 rounds\n• 8 Alternating Half + Full Extensions\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Alternating Half + Full Extensions",
                    "reps": "8"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240647/mood_app/workout_images/p2gogdp0_download_20_.jpg',
          intensityReason: 'Half + full reps cycle extend muscle set time fully',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Perform half rep then follow with full',
              description: 'Alternating range pattern extends time under tension significantly.'
            },
            {
              icon: 'construct',
              title: 'Smooth alternating rhythm each rep',
              description: 'Consistent rhythm maintains muscle tension throughout set.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Heavy Extension Drop Set',
          duration: '18–20 min',
          description: 'Extended posterior work using rapid drops',
          battlePlan: '3 rounds\n• 8 Extensions\n• Drop → 8\n• Drop → 8\nRest 150s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Extensions",
                    "reps": "8",
                    "note": "Drop → 8; Drop → 8"
                  }
                ],
                "rounds": 3,
                "rest": "150s"
              }
            ]
          },
          imageUrl: '',
          intensityReason: 'Drop sets maximize hamstring and posterior chain fatigue',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drop load fast',
              description: 'Reduce ~20–25%.'
            },
            {
              icon: 'resize',
              title: 'Same hinge depth',
              description: 'No cheating range.'
            },
            {
              icon: 'flame',
              title: 'Posterior burn expected',
              description: 'Stop before form breaks.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Long-Hold Extension Finisher',
          duration: '18–20 min',
          description: 'Isometric holds under heavy fatigue',
          battlePlan: '3 rounds\n• 30–40s Hold\nRest 150s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Long-Hold Extension Finisher",
                    "reps": "30–40s"
                  }
                ],
                "rounds": 3,
                "rest": "150s"
              }
            ]
          },
          imageUrl: '',
          intensityReason: 'Extended isometric holds maximize hamstring endurance',
          moodTips: [
            {
              icon: 'timer',
              title: 'Hold mid-range',
              description: 'Peak hamstring tension.'
            },
            {
              icon: 'shield',
              title: 'Brace hard',
              description: 'Protects spine.'
            },
            {
              icon: 'alert',
              title: 'End when shaking starts',
              description: 'True failure point.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'mixed',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Leg Curl Machine',
    icon: 'hardware-chip',
    workouts: {
      beginner: [
        {
          name: 'Seated Leg Curl',
          duration: '10–12 min',
          description: 'Best beginner machine for full hamstring engagement',
          battlePlan: '3 rounds\n• 12–15 Seated Leg Curls\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Seated Leg Curls",
                    "reps": "12–15"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240637/mood_app/workout_images/3vkyuj1o_download_19_.jpg',
          intensityReason: 'Isolated seat curl strengthens flexion carefully',
          moodTips: [
            {
              icon: 'body',
              title: 'Sit back flat, grip seat firmly',
              description: 'Stable position allows focused hamstring isolation.'
            },
            {
              icon: 'construct',
              title: 'Curl steady, avoid pad slam return',
              description: 'Controlled movement prevents machine stress and maintains tension.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_curl',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Lying Leg Curl',
          duration: '10–12 min',
          description: 'Fixed setup ensures strict hypertrophy contraction',
          battlePlan: '3 rounds\n• 12–15 Lying Curls\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Lying Curls",
                    "reps": "12–15"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240645/mood_app/workout_images/o9f5gltv_Screenshot_2025-12-02_at_10_29_39_PM.jpg',
          intensityReason: 'Lying pad curl isolates hamstring contraction',
          moodTips: [
            {
              icon: 'construct',
              title: 'Keep hips glued to pad tight',
              description: 'Hip stability ensures proper hamstring isolation throughout range.'
            },
            {
              icon: 'flash',
              title: 'Raise slow, hold, lower controlled',
              description: 'Tempo control maximizes muscle activation and development.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_curl',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Seated Curl Slow Return',
          duration: '10–12 min',
          description: 'Controlled curls emphasizing eccentric tension',
          battlePlan: '3 rounds\n• 12–15 Curls\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Curls",
                    "reps": "12–15"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240683/mood_app/workout_images/pokwsf2m_leg_curl.jpg',
          intensityReason: 'Slow eccentrics build hamstring strength and control',
          moodTips: [
            {
              icon: 'construct',
              title: 'Pull smooth',
              description: 'No jerking weight stack.'
            },
            {
              icon: 'timer',
              title: 'Three-second return',
              description: 'Eccentric builds strength.'
            },
            {
              icon: 'body',
              title: 'Seat adjusted tight',
              description: 'Hips stay locked.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_curl',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Curl + Iso Hold',
          duration: '10–12 min',
          description: 'Standard curls finished with static contraction',
          battlePlan: '3 rounds\n• 10 Curls + 10s Hold\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Curls + 10s Hold",
                    "reps": "10"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240677/mood_app/workout_images/jhs811y7_leg_curl.jpg',
          intensityReason: 'Isometric holds maximize hamstring activation',
          moodTips: [
            {
              icon: 'timer',
              title: 'Hold halfway up',
              description: 'Mid-range maximizes tension.'
            },
            {
              icon: 'construct',
              title: 'Don\'t kick stack',
              description: 'Keep reps strict.'
            },
            {
              icon: 'pulse',
              title: 'Feel behind knees',
              description: 'Hamstrings should dominate.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_curl',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Heavy Leg Curl',
          duration: '14–16 min',
          description: 'Increased weight overload boosts hypertrophy',
          battlePlan: '4 rounds\n• 8–10 Heavy Curls\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Heavy Curls",
                    "reps": "8–10"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240637/mood_app/workout_images/3vkyuj1o_download_19_.jpg',
          intensityReason: 'Progressive loading builds hamstrings thickness',
          moodTips: [
            {
              icon: 'shield',
              title: 'Brace core firm, pad curl explosive',
              description: 'Core stability allows maximum force transfer to hamstrings.'
            },
            {
              icon: 'flash',
              title: 'Finish with hard squeeze up top',
              description: 'Peak contraction at top maximizes muscle activation.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_curl',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Pause Leg Curl',
          duration: '14–16 min',
          description: 'Pausing at top peaks hamstring contraction force',
          battlePlan: '3 rounds\n• 8–10 Pause Reps\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pause Reps",
                    "reps": "8–10"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240645/mood_app/workout_images/o9f5gltv_Screenshot_2025-12-02_at_10_29_39_PM.jpg',
          intensityReason: 'Isometric hold raises muscular control demand',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause 2s at top under max flexion',
              description: 'Isometric hold at peak contraction builds strength and control.'
            },
            {
              icon: 'construct',
              title: 'Resist pad lowering too fast',
              description: 'Controlled eccentric maintains tension and prevents momentum.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_curl',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: '1½ Rep Leg Curl',
          duration: '14–16 min',
          description: 'Partial-plus-full reps extending hamstring time',
          battlePlan: '4 rounds\n• 10 (1½-rep) Curls\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "10 Curls"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: '',
          intensityReason: 'Extra half rep increases time under tension',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Half rep at top',
              description: 'Extra squeeze per rep.'
            },
            {
              icon: 'construct',
              title: 'Control descent',
              description: 'No stack slam.'
            },
            {
              icon: 'flash',
              title: 'Hamstrings stay loaded',
              description: 'Constant tension focus.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_curl',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Leg Curl Drop Set',
          duration: '14–16 min',
          description: 'Extended curl sets using rapid load reductions',
          battlePlan: '3 rounds\n• 10 Curls\n• Drop → 8\n• Drop → 8\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Curls",
                    "reps": "10",
                    "note": "Drop → 8; Drop → 8"
                  }
                ],
                "rounds": 3,
                "rest": "120s"
              }
            ]
          },
          imageUrl: '',
          intensityReason: 'Drop sets extend fatigue for hypertrophy',
          moodTips: [
            {
              icon: 'flash',
              title: 'Immediate drops',
              description: 'Reduce load ~25% quickly.'
            },
            {
              icon: 'resize',
              title: 'Same range',
              description: 'No shortening reps.'
            },
            {
              icon: 'flame',
              title: 'Burn builds fast',
              description: 'Fatigue is expected.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_curl',
          training_style: 'pump',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Drop‑Set Curl',
          duration: '16–18 min',
          description: 'Hamstrings stay under work far beyond normal set',
          battlePlan: '3 rounds\n• 8 Heavy Curls\n• Drop 15–20% → 8 reps\n• Drop 15–20% → 8 reps\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Heavy Curls",
                    "reps": "8",
                    "note": "Drop 15–20% → 8 reps; Drop 15–20% → 8 reps"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240637/mood_app/workout_images/3vkyuj1o_download_19_.jpg',
          intensityReason: 'Drop weights prolong contraction by overload reps',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drop 15–20% weight quickly',
              description: 'Fast transitions maintain fatigue and extend training stimulus.'
            },
            {
              icon: 'construct',
              title: 'Keep tempo matched across drops',
              description: 'Consistent movement quality throughout all drop sets.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_curl',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Curl + Iso Hold',
          duration: '16–18 min',
          description: 'Endurance builder combining iso with normal reps',
          battlePlan: '3 rounds\n• 8–10 Leg Curls\nFinish 10s Iso Hold @ top\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Leg Curls",
                    "reps": "8–10",
                    "note": "Finish 10s Iso Hold @ top"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240645/mood_app/workout_images/o9f5gltv_Screenshot_2025-12-02_at_10_29_39_PM.jpg',
          intensityReason: 'Finish set with hold for longer contraction stress',
          moodTips: [
            {
              icon: 'timer',
              title: 'Final rep hold 10s curl peak',
              description: 'Extended isometric hold maximizes metabolic stress on hamstrings.'
            },
            {
              icon: 'construct',
              title: 'Stay tight as pad pulls downward',
              description: 'Maintain contraction against resistance throughout hold period.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_curl',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Long-Eccentric Leg Curl',
          duration: '18–20 min',
          description: 'Slow eccentrics overloading hamstring length',
          battlePlan: '4 rounds\n• 8 Curls (5s eccentric)\nRest 150s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Curls",
                    "reps": "8"
                  }
                ],
                "rounds": 4,
                "rest": "150s"
              }
            ]
          },
          imageUrl: '',
          intensityReason: 'Extended eccentrics maximize muscle damage and growth',
          moodTips: [
            {
              icon: 'timer',
              title: 'Five-second return',
              description: 'Maximal tension.'
            },
            {
              icon: 'construct',
              title: 'Explode up gently',
              description: 'Control stack.'
            },
            {
              icon: 'alert',
              title: 'Expect early fatigue',
              description: 'Hamstrings fail fast here.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_curl',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Triple Drop Curl Burnout',
          duration: '18–20 min',
          description: 'High-fatigue curls using three fast drops',
          battlePlan: '3 rounds\n• 10 → 8 → 8 → 8\nRest 150s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "10 → 8 → 8 → 8"
                  }
                ],
                "rounds": 3,
                "rest": "150s"
              }
            ]
          },
          imageUrl: '',
          intensityReason: 'Triple drops exhaust all muscle fibers',
          moodTips: [
            {
              icon: 'flash',
              title: 'Three drops no rest',
              description: 'Strip weight rapidly.'
            },
            {
              icon: 'construct',
              title: 'Same tempo',
              description: 'Light weight ≠ fast reps.'
            },
            {
              icon: 'checkmark',
              title: 'Stop at form loss',
              description: 'Quality over numbers.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_curl',
          training_style: 'pump',
          intensity_cost: 5,
        }
      ]
    }
  }
];
