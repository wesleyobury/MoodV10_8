import { EquipmentWorkouts } from '../types/workout';

export const lazyUpperBodyDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Push',
    icon: 'arrow-up',
    workouts: {
      beginner: [
        {
          name: 'Push Starter',
          duration: '15–18 min',
          description: 'Press first, laterals next, rope pressdowns finish smoothly.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nMachine Chest Press\n• 3 × 8–10 (RPE 4), 45–60s rest\nMachine Lateral Raise\n• 3 × 10–12 (RPE 4), 45–60s rest\nRope Pressdown\n• 3 × 10–12 (RPE 4), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Machine Chest Press",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "8–10"
                  },
                  {
                    "name": "Machine Lateral Raise",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "10–12"
                  },
                  {
                    "name": "Rope Pressdown",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "10–12"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241122/mood_app/workout_images/tp8hgvtb_download_28_.jpg',
          intensityReason: 'Simple machines train chest, delts, tris with minimal setup.',
          moodTips: [
            {
              icon: 'body',
              title: 'Shoulders down; soft lockouts',
              description: 'Keep your shoulders depressed throughout and avoid fully locking out your elbows at the top of presses'
            },
            {
              icon: 'leaf',
              title: 'Breathe out on effort',
              description: 'Exhale during the pushing phase of each movement, inhale on the return for proper breathing mechanics'
            }
          ]
        },
        {
          name: 'Incline Balance',
          duration: '15–18 min',
          description: 'Light incline press, reverse fly, overhead triceps closer.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nMachine Incline Chest Press\n• 3 × 8–10 (RPE 4), 60s rest\nReverse Pec Deck\n• 3 × 12 (RPE 4), 45–60s rest\nOverhead Rope Triceps\n• 3 × 10–12 (RPE 4), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Machine Incline Chest Press",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "8–10"
                  },
                  {
                    "name": "Reverse Pec Deck",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "12"
                  },
                  {
                    "name": "Overhead Rope Triceps",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "10–12"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241114/mood_app/workout_images/inhlehab_download_29_.jpg',
          intensityReason: 'Incline press pairs with rear delts and tris for balance.',
          moodTips: [
            {
              icon: 'body',
              title: 'Chest up; elbows 30–45°',
              description: 'Keep your chest proud and position your elbows at a 30-45 degree angle from your torso for shoulder safety'
            },
            {
              icon: 'arrow-down',
              title: 'Ribs down on triceps overhead',
              description: 'Draw your ribcage down during overhead triceps to prevent lower back arching and target the triceps fully'
            }
          ]
        },
        {
          name: 'Vertical Ease',
          duration: '15–18 min',
          description: 'Shoulder press, pec-deck squeeze, dip assist to finish clean.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nMachine Shoulder Press\n• 3 × 8–10 (RPE 4), 60s rest\nPec Deck\n• 3 × 10–12 (RPE 4), 60s rest\nAssisted Dips\n• 3 × 8–10 (RPE 4), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Machine Shoulder Press",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "8–10"
                  },
                  {
                    "name": "Pec Deck",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "pec_deck_fly"
                  },
                  {
                    "name": "Assisted Dips",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "8–10",
                    "tutorialSlug": "assisted_dips"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241119/mood_app/workout_images/nj4fggwr_download_30_.jpg',
          intensityReason: 'Vertical press with fly and assisted dips keeps effort light.',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Elbows under grips; no arch',
              description: 'Position your elbows directly under your hands and avoid arching your lower back during presses'
            },
            {
              icon: 'arrow-down',
              title: 'Control depth on dip assist',
              description: 'Lower yourself with control on assisted dips—don\'t drop into the bottom position'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Press Arc',
          duration: '20–25 min',
          description: 'Machine press, incline cable fly, cable Y-raise to polish.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nMachine Chest Press\n• 4 × 8 (RPE 5), 60–75s rest\nIncline Cable Fly\n• 3 × 10 (RPE 5), 60s rest\nCable Y Raise\n• 3 × 12 (RPE 5), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Machine Chest Press",
                    "intensity": "RPE 5",
                    "rest": "60–75s",
                    "sets": 4,
                    "reps": "8"
                  },
                  {
                    "name": "Incline Cable Fly",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10",
                    "tutorialSlug": "cable_fly_low_to_high"
                  },
                  {
                    "name": "Cable Y Raise",
                    "intensity": "RPE 5",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "12",
                    "tutorialSlug": "cable_lateral_raise"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241122/mood_app/workout_images/tp8hgvtb_download_28_.jpg',
          intensityReason: 'Strong press plus fly stretch and Y-raise for delt detail.',
          moodTips: [
            {
              icon: 'time',
              title: '2–1–3 tempo; soft lock',
              description: 'Use a controlled tempo of 2 seconds up, 1 second pause, 3 seconds down with soft lockouts'
            },
            {
              icon: 'pause',
              title: 'Pause mid-arc on fly',
              description: 'Hold briefly at the mid-point of the fly movement to maximize chest stretch and engagement'
            }
          ]
        },
        {
          name: 'Overhead Line',
          duration: '20–25 min',
          description: 'Press for delts, upright row adds caps, overhead tris finish.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nMachine Shoulder Press\n• 4 × 8 (RPE 5–6), 60–75s rest\nCable Upright Row (wide)\n• 3 × 10 (RPE 5), 60s rest\nOverhead Rope Triceps\n• 3 × 10–12 (RPE 5), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Machine Shoulder Press",
                    "intensity": "RPE 5–6",
                    "rest": "60–75s",
                    "sets": 4,
                    "reps": "8"
                  },
                  {
                    "name": "Cable Upright Row",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10"
                  },
                  {
                    "name": "Overhead Rope Triceps",
                    "intensity": "RPE 5",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "10–12"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241119/mood_app/workout_images/nj4fggwr_download_30_.jpg',
          intensityReason: 'Shoulder press, upright row, overhead tris build balance.',
          moodTips: [
            {
              icon: 'arrow-up',
              title: 'Upright row: lead elbows',
              description: 'Lead with your elbows during upright rows, pulling them high while keeping the bar close to your body'
            },
            {
              icon: 'contract',
              title: 'Narrow elbows on OH tris',
              description: 'Keep your elbows narrow and close to your head during overhead triceps extensions for proper isolation'
            }
          ]
        },
        {
          name: 'Lower Line',
          duration: '20–25 min',
          description: 'Decline press base, medial delts next, rope pressdowns close.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nMachine Decline Chest Press\n• 3 × 8–10 (RPE 5), 60s rest\nMachine Lateral Raise\n• 3 × 12 (RPE 5), 60s rest\nRope Pressdown\n• 3 × 10–12 (RPE 5), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Machine Decline Chest Press",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "8–10"
                  },
                  {
                    "name": "Machine Lateral Raise",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "12"
                  },
                  {
                    "name": "Rope Pressdown",
                    "intensity": "RPE 5",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "10–12"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241118/mood_app/workout_images/n6oa31c5_download_31_.jpg',
          intensityReason: 'Decline chest plus laterals and pressdowns target pressers.',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Elbows ~45° on decline',
              description: 'Keep your elbows at approximately 45 degrees from your torso during decline press for optimal chest engagement'
            },
            {
              icon: 'remove-circle',
              title: 'No shrugging on laterals',
              description: 'Avoid shrugging your shoulders during lateral raises—keep traps relaxed to target the medial deltoids'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Drop Drive',
          duration: '25–30 min',
          description: 'Heavy press drops, incline fly control, rope finishers.',
          battlePlan: 'Instructions: Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set. Work top to bottom — rest 90s; repeat for 3 total series between exercises.\nMachine Chest Press\n• 1 × 6 heavy (RPE 7) → drop 15% → 1 × 6 (RPE 6) → drop 15% → 1 × 6 (RPE 6)\n• Rest 90s; repeat for 3 total series\nIncline Cable Fly\n• 3 × 10 (RPE 6), 60s rest\nRope Pressdown\n• 3 × 10–12 (RPE 6), 60–75s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Machine Chest Press",
                    "intensity": "RPE 7",
                    "sets": 1,
                    "reps": "6"
                  },
                  {
                    "name": "Incline Cable Fly",
                    "intensity": "RPE 6",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10",
                    "tutorialSlug": "cable_fly_low_to_high"
                  },
                  {
                    "name": "Rope Pressdown",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "10–12"
                  }
                ],
                "rest": "90s; repeat for 3 total series"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241122/mood_app/workout_images/tp8hgvtb_download_28_.jpg',
          intensityReason: 'Drop-set press boosts volume; fly and pushdown refine.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drop ~15% quickly',
              description: 'Reduce the weight by approximately 15% quickly between drops to maintain intensity and muscle fatigue'
            },
            {
              icon: 'time',
              title: 'Control 3s lowers on fly',
              description: 'Lower the cables over 3 seconds during flys to maximize chest stretch and time under tension'
            }
          ]
        },
        {
          name: 'Cluster Overhead',
          duration: '25–30 min',
          description: 'Shoulder press clusters; rear delts next; overhead tris close.',
          battlePlan: 'Instructions: Cluster set: split the reps with a short built-in rest so every rep stays explosive. Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\nMachine Shoulder Press\n• 3 clusters: 3 + 3 + 3 (15s between), 90s between clusters\nReverse Pec Deck\n• 3 × 12 (RPE 6), 60–75s rest\nOverhead Rope Triceps\n• 3 × 10–12 (RPE 6), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Machine Shoulder Press",
                    "reps": "3"
                  },
                  {
                    "name": "Reverse Pec Deck",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "12"
                  },
                  {
                    "name": "Overhead Rope Triceps",
                    "intensity": "RPE 6",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241119/mood_app/workout_images/nj4fggwr_download_30_.jpg',
          intensityReason: 'Cluster presses maintain power while technique stays tidy.',
          moodTips: [
            {
              icon: 'leaf',
              title: '15s breaths in clusters',
              description: 'Use the 15-second mini-rests to take 2-3 deep breaths and reset your focus before the next mini-set'
            },
            {
              icon: 'barbell',
              title: 'Same load within cluster',
              description: 'Keep the weight constant throughout all mini-sets within each cluster for consistent training stimulus'
            }
          ]
        },
        {
          name: 'Midrange Squeeze',
          duration: '25–30 min',
          description: 'Cable fly one-and-a-halfs; laterals and rope pressdowns.',
          battlePlan: 'Instructions: Every rep = one full rep plus a half rep in the hardest range before you finish. Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\nCable Fly (1.5 reps)\n• 3 × 8–10 (RPE 6), 60–75s rest\nMachine Lateral Raise\n• 3 × 12 (RPE 6), 60s rest\nRope Pressdown\n• 3 × 10–12 (RPE 6), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Cable Fly",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "8–10",
                    "tutorialSlug": "cable_machine_fly"
                  },
                  {
                    "name": "Machine Lateral Raise",
                    "intensity": "RPE 6",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "12"
                  },
                  {
                    "name": "Rope Pressdown",
                    "intensity": "RPE 6",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241113/mood_app/workout_images/bbb40x4e_download_32_.jpg',
          intensityReason: '1.5 fly increases tension; delts and tris support work.',
          moodTips: [
            {
              icon: 'body',
              title: 'Keep chest lifted',
              description: 'Maintain a proud, lifted chest position throughout cable flys to maximize pectoral engagement'
            },
            {
              icon: 'time',
              title: '1s squeeze; 3s return',
              description: 'Hold a 1-second squeeze at peak contraction, then take 3 seconds to return for maximum tension'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Pull',
    icon: 'arrow-down',
    workouts: {
      beginner: [
        {
          name: 'Pull Primer',
          duration: '15–18 min',
          description: 'Lats first, mid-back next, rear delts and posture finish.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nLat Pulldown (wide or neutral)\n• 3 × 8–10 (RPE 4), 45–60s rest\nSeated Row (neutral)\n• 3 × 8–10 (RPE 4), 45–60s rest\nCable Face Pull\n• 3 × 12–15 (RPE 4), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Lat Pulldown",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "8–10",
                    "tutorialSlug": "neutral_grip_lat_pulldown"
                  },
                  {
                    "name": "Seated Row",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "8–10",
                    "tutorialSlug": "cable_rope_row"
                  },
                  {
                    "name": "Cable Face Pull",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "12–15",
                    "tutorialSlug": "cable_face_pull"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241101/mood_app/workout_images/224yyt9s_download_34_.jpg',
          intensityReason: 'Pulldown, row, face pull cover back and biceps simply.',
          moodTips: [
            {
              icon: 'arrow-down',
              title: 'Elbows drive down/back',
              description: 'Think about driving your elbows down and back during pulldowns and rows for optimal lat engagement'
            },
            {
              icon: 'body',
              title: 'Chin tucked on face pulls',
              description: 'Keep your chin slightly tucked during face pulls to maintain proper neck position and target rear delts'
            }
          ]
        },
        {
          name: 'Chest-Supported',
          duration: '15–18 min',
          description: 'Row machine, straight-arm pulldown, cable curls finish.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nChest-Supported Row Machine\n• 3 × 8–10 (RPE 4), 60s rest\nCable Straight-Arm Pulldown\n• 3 × 12 (RPE 4), 45–60s rest\nCable Curl (EZ or rope)\n• 3 × 10–12 (RPE 4), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Chest-Supported Row Machine",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "8–10",
                    "tutorialSlug": "chest_supported_db_row"
                  },
                  {
                    "name": "Cable Straight-Arm Pulldown",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "12"
                  },
                  {
                    "name": "Cable Curl",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "cable_straight_bar_curl"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241112/mood_app/workout_images/8wag7xpf_Screenshot_2025-12-04_at_12_00_14_AM.jpg',
          intensityReason: 'Supported rows reduce bracing and simplify posture.',
          moodTips: [
            {
              icon: 'body',
              title: 'Chest to pad; no heave',
              description: 'Keep your chest pressed against the pad throughout—avoid rocking or using momentum to cheat reps'
            },
            {
              icon: 'hand-right',
              title: 'Long arms on straight-arm',
              description: 'Maintain nearly straight arms during the pulldown, focusing on the lat stretch and contraction'
            }
          ]
        },
        {
          name: 'High Line',
          duration: '15–18 min',
          description: 'High cable row, reverse pec deck, cable curls sequence.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nHigh Cable Row\n• 3 × 8–10 (RPE 4), 60s rest\nReverse Pec Deck\n• 3 × 12 (RPE 4), 45–60s rest\nCable Curl\n• 3 × 10–12 (RPE 4), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "High Cable Row",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "8–10"
                  },
                  {
                    "name": "Reverse Pec Deck",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "12"
                  },
                  {
                    "name": "Cable Curl",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "cable_straight_bar_curl"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241106/mood_app/workout_images/4gyd3y66_download_35_.jpg',
          intensityReason: 'Upper-back bias plus curls for balanced pulling day.',
          moodTips: [
            {
              icon: 'arrow-up',
              title: 'Row to collarbone line',
              description: 'Pull the cable toward your collarbone level to target the upper back and rear deltoids effectively'
            },
            {
              icon: 'hand-right',
              title: 'Wrists quiet on curls',
              description: 'Keep your wrists in a neutral position during curls—avoid flexing or extending them during the movement'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Lat Ladder',
          duration: '20–25 min',
          description: 'Pulldown work, straight-arm sweeps, incline cable curls.',
          battlePlan: 'Instructions: Ladder: work down the rungs — the reps drop as fatigue climbs. Rest only between rungs. Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\nLat Pulldown\n• 4 × 8 (RPE 5), 60–75s rest\nCable Straight-Arm Pulldown\n• 3 × 10–12 (RPE 5), 60s rest\nIncline Cable Curl (low to high)\n• 3 × 10–12 (RPE 5), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Lat Pulldown",
                    "intensity": "RPE 5",
                    "rest": "60–75s",
                    "sets": 4,
                    "reps": "8",
                    "tutorialSlug": "neutral_grip_lat_pulldown"
                  },
                  {
                    "name": "Cable Straight-Arm Pulldown",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  },
                  {
                    "name": "Incline Cable Curl",
                    "intensity": "RPE 5",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "incline_db_curl"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241101/mood_app/workout_images/224yyt9s_download_34_.jpg',
          intensityReason: 'Vertical pull pairs with length-tension lat training.',
          moodTips: [
            {
              icon: 'body',
              title: 'Tall chest on pulldowns',
              description: 'Maintain a proud, upright chest position during pulldowns to maximize lat engagement and minimize shoulder strain'
            },
            {
              icon: 'fitness',
              title: 'Hinge slight on straight-arm',
              description: 'Allow a slight hip hinge during straight-arm pulldowns to fully stretch the lats at the top'
            }
          ]
        },
        {
          name: 'Midback Focus',
          duration: '20–25 min',
          description: 'Neutral rows, reverse fly sets, rope hammer curls finish.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nSeated Row (neutral)\n• 4 × 8 (RPE 5), 60–75s rest\nReverse Pec Deck\n• 3 × 12 (RPE 5), 60s rest\nRope Hammer Curl\n• 3 × 10–12 (RPE 5), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Seated Row",
                    "intensity": "RPE 5",
                    "rest": "60–75s",
                    "sets": 4,
                    "reps": "8",
                    "tutorialSlug": "cable_rope_row"
                  },
                  {
                    "name": "Reverse Pec Deck",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "12"
                  },
                  {
                    "name": "Rope Hammer Curl",
                    "intensity": "RPE 5",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "10–12"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241109/mood_app/workout_images/51z4cigt_download_33_.jpg',
          intensityReason: 'Rows, rear delts, and hammers build the mid-back chain.',
          moodTips: [
            {
              icon: 'contract',
              title: 'Squeeze 1–2s on row',
              description: 'Hold a 1-2 second squeeze at the peak contraction of each row to maximize mid-back engagement'
            },
            {
              icon: 'hand-right',
              title: 'Elbows soft on rear delts',
              description: 'Maintain a slight bend in your elbows during reverse flys—don\'t lock them straight'
            }
          ]
        },
        {
          name: 'High Row Line',
          duration: '20–25 min',
          description: 'High cable rows, reverse pec deck, preacher curl machine.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nHigh Cable Row\n• 4 × 8 (RPE 5–6), 60–75s rest\nReverse Pec Deck\n• 3 × 12 (RPE 5), 60s rest\nPreacher Curl Machine\n• 3 × 10–12 (RPE 5), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "High Cable Row",
                    "intensity": "RPE 5–6",
                    "rest": "60–75s",
                    "sets": 4,
                    "reps": "8"
                  },
                  {
                    "name": "Reverse Pec Deck",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "12"
                  },
                  {
                    "name": "Preacher Curl Machine",
                    "intensity": "RPE 5",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "10–12"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241111/mood_app/workout_images/5z9stzyy_Screenshot_2025-12-04_at_12_01_30_AM.jpg',
          intensityReason: 'High rows, rear delts, preacher curls cover pull angles.',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Elbows 45–60° path',
              description: 'Pull your elbows in a 45-60 degree path during high rows to target the upper back and rear deltoids'
            },
            {
              icon: 'expand',
              title: 'Full stretch on preacher',
              description: 'Allow a full stretch at the bottom of preacher curls before curling up for complete bicep engagement'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Drop Pull',
          duration: '25–30 min',
          description: 'Heavy pulldown drops, rows next, cable curls to close.',
          battlePlan: 'Instructions: Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom — rest 90s; repeat for 3 total series between exercises.\nLat Pulldown\n• 1 × 6 heavy (RPE 7) → drop 15% → 1 × 6 (RPE 6) → drop 15% → 1 × 6 (RPE 6)\n• Rest 90s; repeat for 3 total series\nSeated Row\n• 3 × 8–10 (RPE 6), 60–75s rest\nCable Curl\n• 3 × 10–12 (RPE 6), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Lat Pulldown",
                    "intensity": "RPE 7",
                    "sets": 1,
                    "reps": "6",
                    "tutorialSlug": "neutral_grip_lat_pulldown"
                  },
                  {
                    "name": "Seated Row",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "8–10",
                    "tutorialSlug": "cable_rope_row"
                  },
                  {
                    "name": "Cable Curl",
                    "intensity": "RPE 6",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "cable_straight_bar_curl"
                  }
                ],
                "rest": "90s; repeat for 3 total series"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241101/mood_app/workout_images/224yyt9s_download_34_.jpg',
          intensityReason: 'Pulldown drops extend time under tension efficiently.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Quick pin changes',
              description: 'Change the weight pin quickly between drops to minimize rest and maintain the intensity of the drop set'
            },
            {
              icon: 'remove-circle',
              title: 'Avoid torso heave',
              description: 'Keep your torso stable throughout—don\'t use momentum or body English to pull the weight down'
            }
          ]
        },
        {
          name: 'Cluster Row',
          duration: '25–30 min',
          description: 'Cluster rows, rear delts after, incline cable curls finish.',
          battlePlan: 'Instructions: Cluster set: split the reps with a short built-in rest so every rep stays explosive. Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\nChest-Supported Row Machine\n• 3 clusters: 4 + 4 + 4 (15s between), 90s between clusters\nReverse Pec Deck\n• 3 × 12 (RPE 6), 60–75s rest\nIncline Cable Curl\n• 3 × 10–12 (RPE 6), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Chest-Supported Row Machine",
                    "reps": "3",
                    "tutorialSlug": "chest_supported_db_row"
                  },
                  {
                    "name": "Reverse Pec Deck",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "12"
                  },
                  {
                    "name": "Incline Cable Curl",
                    "intensity": "RPE 6",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "incline_db_curl"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241106/mood_app/workout_images/4gyd3y66_download_35_.jpg',
          intensityReason: 'Row clusters sustain output with crisp scap control.',
          moodTips: [
            {
              icon: 'body',
              title: 'Chest glued to pad',
              description: 'Keep your chest firmly pressed against the pad throughout cluster rows to maintain proper form'
            },
            {
              icon: 'leaf',
              title: '15s breaths in clusters',
              description: 'Use the 15-second mini-rests to take deep breaths and reset your focus before the next mini-set'
            }
          ]
        },
        {
          name: 'Midrange Pull',
          duration: '25–30 min',
          description: 'Face pull 1.5 reps, high rows next, rope hammer curls.',
          battlePlan: 'Instructions: Curl to the top, lower halfway, curl back up, then lower fully — that\'s ONE rep. Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\nCable Face Pull (1.5 reps)\n• 3 × 10–12 (RPE 6), 60–75s rest\nHigh Cable Row\n• 3 × 8–10 (RPE 6), 60–75s rest\nRope Hammer Curl\n• 3 × 10–12 (RPE 6), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Cable Face Pull",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "cable_face_pull"
                  },
                  {
                    "name": "High Cable Row",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "8–10"
                  },
                  {
                    "name": "Rope Hammer Curl",
                    "intensity": "RPE 6",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241105/mood_app/workout_images/3mysq3rj_Screenshot_2025-12-04_at_12_02_09_AM.jpg',
          intensityReason: '1.5 face pulls intensify rear delts with safe load.',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Thumbs back; 1s hold',
              description: 'Rotate your thumbs back at peak contraction of face pulls and hold for 1 second to maximize rear delt engagement'
            },
            {
              icon: 'time',
              title: 'Smooth 3s returns',
              description: 'Control the return phase over 3 seconds to increase time under tension and muscle development'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Full Upper Body',
    icon: 'fitness',
    workouts: {
      beginner: [
        {
          name: 'Simple Push–Pull',
          duration: '15–18 min',
          description: 'Chest press, row, laterals, pressdowns for simple flow.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nMachine Chest Press\n• 3 × 8–10 (RPE 4), 60s rest\nSeated Row\n• 3 × 8–10 (RPE 4), 60s rest\nMachine Lateral Raise\n• 3 × 12 (RPE 4), 45–60s rest\nRope Pressdown\n• 3 × 10–12 (RPE 4), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Machine Chest Press",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "8–10"
                  },
                  {
                    "name": "Seated Row",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "8–10",
                    "tutorialSlug": "cable_rope_row"
                  },
                  {
                    "name": "Machine Lateral Raise",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "12"
                  },
                  {
                    "name": "Rope Pressdown",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "10–12"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241102/mood_app/workout_images/2idat5d8_download_29_.jpg',
          intensityReason: 'Balanced machines load push and pull with few cues.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Press/row: soft lock',
              description: 'Use soft lockouts on both presses and rows—avoid fully extending your elbows at end ranges'
            },
            {
              icon: 'body',
              title: 'Keep neck long, shoulders down',
              description: 'Maintain a long neck position and keep your shoulders depressed throughout all exercises'
            }
          ]
        },
        {
          name: 'Vertical Pair',
          duration: '15–18 min',
          description: 'Shoulder press, pulldown, pec deck, cable curls lineup.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nMachine Shoulder Press\n• 3 × 8–10 (RPE 4), 60s rest\nLat Pulldown\n• 3 × 8–10 (RPE 4), 60s rest\nPec Deck\n• 3 × 10–12 (RPE 4), 60s rest\nCable Curl\n• 3 × 10–12 (RPE 4), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Machine Shoulder Press",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "8–10"
                  },
                  {
                    "name": "Lat Pulldown",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "8–10",
                    "tutorialSlug": "neutral_grip_lat_pulldown"
                  },
                  {
                    "name": "Pec Deck",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "pec_deck_fly"
                  },
                  {
                    "name": "Cable Curl",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "cable_straight_bar_curl"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241117/mood_app/workout_images/kwgc495p_download_30_.jpg',
          intensityReason: 'Vertical press and pull with easy isolation finishers.',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Elbows under on press',
              description: 'Position your elbows directly under your hands during shoulder press for optimal mechanics'
            },
            {
              icon: 'arrow-down',
              title: 'Elbows down on pulldown',
              description: 'Drive your elbows down toward your hips during pulldowns to maximize lat engagement'
            }
          ]
        },
        {
          name: 'Cable Flow',
          duration: '15–18 min',
          description: 'Cable press, high row, Y-raises, rope triceps to finish.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nCable Chest Press\n• 3 × 10 (RPE 4), 60s rest\nHigh Cable Row\n• 3 × 10 (RPE 4), 60s rest\nCable Y Raise\n• 3 × 12 (RPE 4), 45–60s rest\nRope Pressdown\n• 3 × 10–12 (RPE 4), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Cable Chest Press",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10"
                  },
                  {
                    "name": "High Cable Row",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10"
                  },
                  {
                    "name": "Cable Y Raise",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "12",
                    "tutorialSlug": "cable_lateral_raise"
                  },
                  {
                    "name": "Rope Pressdown",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "10–12"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241108/mood_app/workout_images/4vnqx30z_download_32_.jpg',
          intensityReason: 'Cables guide paths and reduce setup, keeping it easy.',
          moodTips: [
            {
              icon: 'arrow-down',
              title: 'Ribs down on presses',
              description: 'Draw your ribcage down during cable presses to prevent lower back arching and engage your core'
            },
            {
              icon: 'contract',
              title: 'Squeeze 1s on rows',
              description: 'Hold a 1-second squeeze at peak contraction during rows to maximize mid-back engagement'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Balanced Lines',
          duration: '20–25 min',
          description: 'Chest press, row, lateral raise, curls; clean sequence.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nMachine Chest Press\n• 4 × 8 (RPE 5), 60–75s rest\nSeated Row\n• 4 × 8 (RPE 5), 60–75s rest\nMachine Lateral Raise\n• 3 × 12 (RPE 5), 60s rest\nCable Curl\n• 3 × 10–12 (RPE 5), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Machine Chest Press",
                    "intensity": "RPE 5",
                    "rest": "60–75s",
                    "sets": 4,
                    "reps": "8"
                  },
                  {
                    "name": "Seated Row",
                    "intensity": "RPE 5",
                    "rest": "60–75s",
                    "sets": 4,
                    "reps": "8",
                    "tutorialSlug": "cable_rope_row"
                  },
                  {
                    "name": "Machine Lateral Raise",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "12"
                  },
                  {
                    "name": "Cable Curl",
                    "intensity": "RPE 5",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "cable_straight_bar_curl"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241102/mood_app/workout_images/2idat5d8_download_29_.jpg',
          intensityReason: 'Machines train push, pull, and delts with control.',
          moodTips: [
            {
              icon: 'settings',
              title: 'Note seat settings',
              description: 'Record your machine seat positions to ensure consistent setup and save time in future sessions'
            },
            {
              icon: 'time',
              title: 'Keep tempos controlled',
              description: 'Maintain controlled tempos on all exercises—avoid rushing or using momentum to complete reps'
            }
          ]
        },
        {
          name: 'Vertical Stack',
          duration: '20–25 min',
          description: 'Shoulder press, pulldown, pec deck, rope tris; tidy flow.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nMachine Shoulder Press\n• 4 × 8 (RPE 5–6), 60–75s rest\nLat Pulldown\n• 4 × 8 (RPE 5), 60–75s rest\nPec Deck\n• 3 × 10–12 (RPE 5), 60s rest\nRope Pressdown\n• 3 × 10–12 (RPE 5), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Machine Shoulder Press",
                    "intensity": "RPE 5–6",
                    "rest": "60–75s",
                    "sets": 4,
                    "reps": "8"
                  },
                  {
                    "name": "Lat Pulldown",
                    "intensity": "RPE 5",
                    "rest": "60–75s",
                    "sets": 4,
                    "reps": "8",
                    "tutorialSlug": "neutral_grip_lat_pulldown"
                  },
                  {
                    "name": "Pec Deck",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "pec_deck_fly"
                  },
                  {
                    "name": "Rope Pressdown",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241117/mood_app/workout_images/kwgc495p_download_30_.jpg',
          intensityReason: 'Overhead press and pulldown anchor simple accessory.',
          moodTips: [
            {
              icon: 'remove-circle',
              title: 'Don\'t arch on press',
              description: 'Avoid excessive lower back arching during shoulder press by bracing your core and keeping ribs down'
            },
            {
              icon: 'body',
              title: 'Tall chest on pulldown',
              description: 'Maintain a proud, upright chest during pulldowns to maximize lat engagement and minimize shoulder strain'
            }
          ]
        },
        {
          name: 'Cable Circuitry',
          duration: '20–25 min',
          description: 'Cable press, high row, rear delts, overhead tris polish.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nCable Chest Press\n• 4 × 8 (RPE 5), 60–75s rest\nHigh Cable Row\n• 4 × 8 (RPE 5), 60–75s rest\nReverse Pec Deck\n• 3 × 12 (RPE 5), 60s rest\nOverhead Rope Triceps\n• 3 × 10–12 (RPE 5), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Cable Chest Press",
                    "intensity": "RPE 5",
                    "rest": "60–75s",
                    "sets": 4,
                    "reps": "8"
                  },
                  {
                    "name": "High Cable Row",
                    "intensity": "RPE 5",
                    "rest": "60–75s",
                    "sets": 4,
                    "reps": "8"
                  },
                  {
                    "name": "Reverse Pec Deck",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "12"
                  },
                  {
                    "name": "Overhead Rope Triceps",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241104/mood_app/workout_images/2skt7b9o_Screenshot_2025-12-04_at_12_01_30_AM.jpg',
          intensityReason: 'Cable paths allow smooth arcs and moderate control.',
          moodTips: [
            {
              icon: 'arrow-down',
              title: 'Press: ribs down',
              description: 'Draw your ribcage down during cable presses to maintain core engagement and prevent lower back arching'
            },
            {
              icon: 'hand-right',
              title: 'Rear delts: soft elbows',
              description: 'Maintain a slight bend in your elbows during reverse pec deck—don\'t lock them straight'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Push–Pull Drops',
          duration: '25–30 min',
          description: 'Chest and row drops, then laterals and cable curls.',
          battlePlan: 'Instructions: Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom — rest 90s; repeat for 3 total series between exercises.\nMachine Chest Press\n• 1 × 6 heavy (RPE 7) → drop 15% → 1 × 6 (RPE 6) → drop 15% → 1 × 6 (RPE 6)\n• Rest 90s; repeat for 3 total series\nSeated Row\n• 1 × 6 heavy (RPE 7) → drop 15% → 1 × 6 (RPE 6) → drop 15% → 1 × 6 (RPE 6)\n• Rest 90s; repeat for 3 total series\nMachine Lateral Raise\n• 3 × 12 (RPE 6), 60–75s rest\nCable Curl\n• 3 × 10–12 (RPE 6), 60–75s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Machine Chest Press",
                    "intensity": "RPE 7",
                    "sets": 1,
                    "reps": "6"
                  },
                  {
                    "name": "Seated Row",
                    "intensity": "RPE 7",
                    "sets": 1,
                    "reps": "6",
                    "tutorialSlug": "cable_rope_row"
                  },
                  {
                    "name": "Machine Lateral Raise",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "12"
                  },
                  {
                    "name": "Cable Curl",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "cable_straight_bar_curl"
                  }
                ],
                "rest": "90s; repeat for 3 total series"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241121/mood_app/workout_images/tbt1jia8_download_35_.jpg',
          intensityReason: 'Drop sets increase volume without extra complexity.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Swift pin changes',
              description: 'Change the weight pin quickly between drops to minimize rest and maintain the intensity throughout'
            },
            {
              icon: 'checkmark-circle',
              title: 'Keep reps smooth',
              description: 'Maintain smooth, controlled rep quality throughout all drop set portions—avoid getting sloppy as you fatigue'
            }
          ]
        },
        {
          name: 'Cluster Stack',
          duration: '25–30 min',
          description: 'Press and row clusters, then rear delts and rope tris.',
          battlePlan: 'Instructions: Cluster set: split the reps with a short built-in rest so every rep stays explosive. Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\nMachine Chest Press\n• 3 clusters: 3 + 3 + 3 (15s between), 90s between clusters\nSeated Row\n• 3 clusters: 4 + 4 + 4 (15s between), 90s between clusters\nReverse Pec Deck\n• 3 × 12 (RPE 6), 60–75s rest\nRope Pressdown\n• 3 × 10–12 (RPE 6), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Machine Chest Press",
                    "reps": "3"
                  },
                  {
                    "name": "Seated Row",
                    "reps": "3",
                    "tutorialSlug": "cable_rope_row"
                  },
                  {
                    "name": "Reverse Pec Deck",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "12"
                  },
                  {
                    "name": "Rope Pressdown",
                    "intensity": "RPE 6",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241100/mood_app/workout_images/12gt6fvb_download_2_.jpg',
          intensityReason: 'Cluster sets keep output high with preserved form.',
          moodTips: [
            {
              icon: 'time',
              title: '15s mini-rests',
              description: 'Use the 15-second mini-rests to take 2-3 deep breaths and reset your focus before continuing'
            },
            {
              icon: 'barbell',
              title: 'Same load in clusters',
              description: 'Keep the weight constant throughout all mini-sets within each cluster for consistent training stimulus'
            }
          ]
        },
        {
          name: 'Cable Finish',
          duration: '25–30 min',
          description: 'Fly 1.5s, high rows, Y raises, overhead triceps finisher.',
          battlePlan: 'Instructions: Every rep = one full rep plus a half rep in the hardest range before you finish. Work top to bottom.\nCable Fly (1.5 reps)\n• 3 × 8–10 (RPE 6), 60–75s rest\nHigh Cable Row\n• 3 × 8–10 (RPE 6), 60–75s rest\nCable Y Raise\n• 3 × 12 (RPE 6), 60s rest\nOverhead Rope Triceps\n• 3 × 10–12 (RPE 6), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Cable Fly",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "8–10",
                    "tutorialSlug": "cable_machine_fly"
                  },
                  {
                    "name": "High Cable Row",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "8–10"
                  },
                  {
                    "name": "Cable Y Raise",
                    "intensity": "RPE 6",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "12",
                    "tutorialSlug": "cable_lateral_raise"
                  },
                  {
                    "name": "Overhead Rope Triceps",
                    "intensity": "RPE 6",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241115/mood_app/workout_images/jjomvfxr_download_1_.jpg',
          intensityReason: 'Midrange focus with cables adds tension at modest load.',
          moodTips: [
            {
              icon: 'contract',
              title: '1s squeeze on peak',
              description: 'Hold a 1-second squeeze at peak contraction on all exercises to maximize muscle engagement'
            },
            {
              icon: 'time',
              title: 'Control 3s returns',
              description: 'Lower the weight slowly over 3 seconds on all movements to increase time under tension and build strength'
            }
          ]
        }
      ]
    }
  }
];
