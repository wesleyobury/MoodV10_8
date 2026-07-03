import { EquipmentWorkouts } from '../types/workout';

export const lazyLowerBodyDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Push',
    icon: 'arrow-up',
    workouts: {
      beginner: [
        {
          name: 'Quad Starter',
          duration: '15–18 min',
          description: 'Leg press base, knee extensions next, calves finish smoothly.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nLeg Press (machine)\n• 3 × 10–12 (RPE 4), 60s rest\nLeg Extension (machine)\n• 3 × 10–12 (RPE 4), 45–60s rest\nSeated Calf Raise (machine)\n• 3 × 12–15 (RPE 4), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Leg Press",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "leg_press"
                  },
                  {
                    "name": "Leg Extension",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "quad_extension"
                  },
                  {
                    "name": "Seated Calf Raise",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "12–15",
                    "tutorialSlug": "calf_raise"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241239/mood_app/workout_images/p3j5vmje_download.jpg',
          intensityReason: 'Guided machines load quads safely with minimal setup.',
          moodTips: [
            {
              icon: 'body',
              title: 'Seat tight; feet mid-sled; full foot contact',
              description: 'Position your seat snugly and place feet in the middle of the sled with full foot contact for optimal quad engagement'
            },
            {
              icon: 'time',
              title: 'Smooth 2–1–3 tempo; stop shy of lock',
              description: 'Use a controlled tempo of 2 seconds up, 1 second pause, 3 seconds down—avoid fully locking out your knees'
            }
          ]
        },
        {
          name: 'Chair Line',
          duration: '15–18 min',
          description: 'Extensions first, press for volume, calves for finish.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nLeg Extension (machine)\n• 3 × 10–12 (RPE 4), 45–60s rest\nLeg Press (machine)\n• 3 × 10–12 (RPE 4), 60s rest\nCalf Press (on leg press)\n• 3 × 12–15 (RPE 4), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Leg Extension",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "quad_extension"
                  },
                  {
                    "name": "Leg Press",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "leg_press"
                  },
                  {
                    "name": "Calf Press",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "12–15",
                    "tutorialSlug": "calf_raise"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241251/mood_app/workout_images/ujjqi8g2_download_1_.jpg',
          intensityReason: 'Simple seated chain builds quads with gentle guidance.',
          moodTips: [
            {
              icon: 'body',
              title: 'Knees align with machine axis',
              description: 'Adjust the machine so your knee joint lines up with the pivot point for proper biomechanics and safety'
            },
            {
              icon: 'contract',
              title: 'Full squeeze top; slow lower control',
              description: 'Squeeze your quads fully at the top of each rep, then lower slowly with control for maximum muscle engagement'
            }
          ]
        },
        {
          name: 'Hack Ease',
          duration: '15–18 min',
          description: 'Light hack squats, knee extensions, gentle calf raises.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nHack Squat (machine)\n• 3 × 8–10 (RPE 4), 60s rest\nLeg Extension (machine)\n• 3 × 10–12 (RPE 4), 60s rest\nStanding Calf Raise (machine)\n• 3 × 12–15 (RPE 4), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Hack Squat",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "8–10",
                    "tutorialSlug": "hack_squat"
                  },
                  {
                    "name": "Leg Extension",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "quad_extension"
                  },
                  {
                    "name": "Standing Calf Raise",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "12–15",
                    "tutorialSlug": "calf_raise"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://customer-assets.emergentagent.com/job_upper-body-enhance/artifacts/sb8mhy0d_hs.avif',
          intensityReason: 'Supported hack squat targets quads with easy bracing.',
          moodTips: [
            {
              icon: 'body',
              title: 'Back flat; feet shoulder-width',
              description: 'Keep your back flat against the pad and position feet shoulder-width apart for stable, effective squatting'
            },
            {
              icon: 'expand',
              title: 'Small depth you own; quiet knees',
              description: 'Work within a range of motion you can control—keep knees stable without wobbling or caving inward'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Sled Flow',
          duration: '20–25 min',
          description: 'Leg press sets, extensions next, calves polish the finish.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nLeg Press (machine)\n• 4 × 10 (RPE 5), 60–75s rest\nLeg Extension (machine)\n• 3 × 10–12 (RPE 5), 60s rest\nSeated Calf Raise (machine)\n• 3 × 12–15 (RPE 5), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Leg Press",
                    "intensity": "RPE 5",
                    "rest": "60–75s",
                    "sets": 4,
                    "reps": "10",
                    "tutorialSlug": "leg_press"
                  },
                  {
                    "name": "Leg Extension",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "quad_extension"
                  },
                  {
                    "name": "Seated Calf Raise",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "12–15",
                    "tutorialSlug": "calf_raise"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241239/mood_app/workout_images/p3j5vmje_download.jpg',
          intensityReason: 'Moderate sled volume with clean knee extension focus.',
          moodTips: [
            {
              icon: 'body',
              title: 'Mid-stance; track knees over toes',
              description: 'Use a mid-width stance and ensure your knees track directly over your toes throughout each rep'
            },
            {
              icon: 'time',
              title: 'Own the bottom; 2–1–3 tempo',
              description: 'Control the bottom position of each rep using a 2-1-3 tempo for optimal muscle tension and safety'
            }
          ]
        },
        {
          name: 'Hack Line',
          duration: '20–25 min',
          description: 'Hack squats first, extensions second, calves to close.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nHack Squat (machine)\n• 4 × 8 (RPE 5–6), 75s rest\nLeg Extension (machine)\n• 3 × 10–12 (RPE 5), 60s rest\nCalf Press (on leg press)\n• 3 × 12–15 (RPE 5), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Hack Squat",
                    "intensity": "RPE 5–6",
                    "rest": "75s",
                    "sets": 4,
                    "reps": "8",
                    "tutorialSlug": "hack_squat"
                  },
                  {
                    "name": "Leg Extension",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "quad_extension"
                  },
                  {
                    "name": "Calf Press",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "12–15",
                    "tutorialSlug": "calf_raise"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://customer-assets.emergentagent.com/job_upper-body-enhance/artifacts/sb8mhy0d_hs.avif',
          intensityReason: 'Guided squat pattern builds quads without balance load.',
          moodTips: [
            {
              icon: 'body',
              title: 'Keep heels planted; soft lockouts',
              description: 'Maintain heel contact with the platform throughout and avoid locking knees completely at the top'
            },
            {
              icon: 'time',
              title: 'Smooth descent; steady torso angle',
              description: 'Lower slowly with control while keeping your torso at a consistent angle against the pad'
            }
          ]
        },
        {
          name: 'Smith Front',
          duration: '20–25 min',
          description: 'Smith front squats, extensions next, calves to finish.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nSmith Front Squat\n• 4 × 8 (RPE 5–6), 75s rest\nLeg Extension (machine)\n• 3 × 10–12 (RPE 5), 60s rest\nStanding Calf Raise (machine)\n• 3 × 12–15 (RPE 5), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Smith Front Squat",
                    "intensity": "RPE 5–6",
                    "rest": "75s",
                    "sets": 4,
                    "reps": "8",
                    "tutorialSlug": "db_front_squat"
                  },
                  {
                    "name": "Leg Extension",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "quad_extension"
                  },
                  {
                    "name": "Standing Calf Raise",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "12–15",
                    "tutorialSlug": "calf_raise"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241199/mood_app/workout_images/6q78aa0l_smfs.jpg',
          intensityReason: 'Smith guidance reduces setup and stabilizer demands.',
          moodTips: [
            {
              icon: 'body',
              title: 'Bar high chest; small stance',
              description: 'Position the bar high on your chest/shoulders and use a narrower stance to emphasize quad recruitment'
            },
            {
              icon: 'expand',
              title: 'Knees track; ribs stacked and tall',
              description: 'Let knees travel forward over toes while keeping your ribcage stacked and torso upright throughout'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Press Drop',
          duration: '25–30 min',
          description: 'Heavy press drops, precise extensions, high-rep calves.',
          battlePlan: 'Instructions: Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom — rest 90s; repeat for 3 total series between exercises.\nLeg Press (machine)\n• 1 × 8 heavy (RPE 7) → drop 15% → 1 × 8 (RPE 6) → drop 15% → 1 × 8 (RPE 6)\n• Rest 90s; repeat for 3 total series\nLeg Extension (machine)\n• 3 × 10–12 (RPE 6), 60–75s rest\nSeated Calf Raise (machine)\n• 3 × 15–20 (RPE 6), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Leg Press",
                    "intensity": "RPE 7",
                    "sets": 1,
                    "reps": "8",
                    "tutorialSlug": "leg_press"
                  },
                  {
                    "name": "Leg Extension",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "quad_extension"
                  },
                  {
                    "name": "Seated Calf Raise",
                    "intensity": "RPE 6",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "15–20",
                    "tutorialSlug": "calf_raise"
                  }
                ],
                "rest": "90s; repeat for 3 total series"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241239/mood_app/workout_images/p3j5vmje_download.jpg',
          intensityReason: 'Drop set increases volume without complex technique.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Quick pin drops ~15%',
              description: 'Reduce the weight by approximately 15% quickly between drops to maintain intensity and muscle fatigue'
            },
            {
              icon: 'remove-circle',
              title: 'No bouncing; control bottom',
              description: 'Avoid bouncing at the bottom of the press—maintain control throughout the entire range of motion'
            }
          ]
        },
        {
          name: 'Hack Cluster',
          duration: '25–30 min',
          description: 'Hack squat clusters, extensions next, standing calves.',
          battlePlan: 'Instructions: Cluster set: split the reps with a short built-in rest so every rep stays explosive. Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\nHack Squat (machine)\n• 3 clusters: 3 + 3 + 3 (15s between), 90s between clusters\nLeg Extension (machine)\n• 3 × 10–12 (RPE 6), 60–75s rest\nStanding Calf Raise (machine)\n• 3 × 12–15 (RPE 6), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Hack Squat",
                    "reps": "3",
                    "tutorialSlug": "hack_squat"
                  },
                  {
                    "name": "Leg Extension",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "quad_extension"
                  },
                  {
                    "name": "Standing Calf Raise",
                    "intensity": "RPE 6",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "12–15",
                    "tutorialSlug": "calf_raise"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://customer-assets.emergentagent.com/job_upper-body-enhance/artifacts/sb8mhy0d_hs.avif',
          intensityReason: 'Clusters sustain output while preserving clean rep quality.',
          moodTips: [
            {
              icon: 'leaf',
              title: '15s breaths in clusters',
              description: 'Use the 15-second mini-rests to take 2-3 deep breaths and reset your focus before continuing'
            },
            {
              icon: 'barbell',
              title: 'Same load within clusters',
              description: 'Keep the weight constant throughout all mini-sets within each cluster for consistent training stimulus'
            }
          ]
        },
        {
          name: 'Smith Split',
          duration: '25–30 min',
          description: 'Smith split squats, machine extensions, calves to close.',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\nSmith Split Squat\n• 3 × 8–10/side (RPE 6), 60–75s rest\nLeg Extension (machine)\n• 3 × 10–12 (RPE 6), 60–75s rest\nCalf Press (on leg press)\n• 3 × 12–15 (RPE 6), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Smith Split Squat",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "8–10/side",
                    "tutorialSlug": "kb_squat"
                  },
                  {
                    "name": "Leg Extension",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "quad_extension"
                  },
                  {
                    "name": "Calf Press",
                    "intensity": "RPE 6",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "12–15",
                    "tutorialSlug": "calf_raise"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241207/mood_app/workout_images/a1srgmco_download_2_.jpg',
          intensityReason: 'Supported split squats bias quads with low balance load.',
          moodTips: [
            {
              icon: 'body',
              title: 'Short stance; heel down',
              description: 'Use a shorter split stance and keep your front heel firmly planted to maximize quad engagement'
            },
            {
              icon: 'expand',
              title: 'Soft knee touch; tall torso',
              description: 'Lower until your rear knee nearly touches the ground while maintaining an upright torso throughout'
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
          name: 'Hinge Starter',
          duration: '15–18 min',
          description: 'Seated curls, RDL machine or Smith, glute machine finish.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nSeated Leg Curl (machine)\n• 3 × 10–12 (RPE 4), 60s rest\nSmith RDL or Plate-Loaded RDL Machine\n• 3 × 8–10 (RPE 4), 60s rest\nGlute Drive / Hip Thrust Machine\n• 3 × 10–12 (RPE 4), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Seated Leg Curl",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  },
                  {
                    "name": "Smith RDL or Plate-Loaded RDL Machine",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "8–10",
                    "tutorialSlug": "smith_machine_rdl"
                  },
                  {
                    "name": "Glute Drive / Hip Thrust Machine",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241229/mood_app/workout_images/k4j5yazw_download_5_.jpg',
          intensityReason: 'Simple hip hinge machines train hams and glutes safely.',
          moodTips: [
            {
              icon: 'body',
              title: 'Keep hips square; soft ribs',
              description: 'Maintain level hips throughout each movement and keep your ribcage relaxed to avoid overarching'
            },
            {
              icon: 'time',
              title: 'Long hamstring stretch; calm pace',
              description: 'Focus on feeling a full hamstring stretch during the lowering phase while maintaining a controlled tempo'
            }
          ]
        },
        {
          name: 'Curl Line',
          duration: '15–18 min',
          description: 'Seated curls, hip thrusts next, ham-biased calf finish.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nSeated Leg Curl (machine)\n• 3 × 10–12 (RPE 4), 60s rest\nHip Thrust Machine\n• 3 × 10–12 (RPE 4), 60s rest\nSeated Calf Raise (toes in slightly)\n• 3 × 12–15 (RPE 4), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Seated Leg Curl",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  },
                  {
                    "name": "Hip Thrust Machine",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  },
                  {
                    "name": "Seated Calf Raise",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "12–15",
                    "tutorialSlug": "calf_raise"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241214/mood_app/workout_images/cj4dx97r_download_3_.jpg',
          intensityReason: 'Knee flexion focus with easy glute and calf support.',
          moodTips: [
            {
              icon: 'body',
              title: 'Ankles dorsiflexed on curl',
              description: 'Keep your ankles flexed (toes pulled toward shins) during leg curls to maximize hamstring engagement'
            },
            {
              icon: 'arrow-down',
              title: 'Drive through heels on thrusts',
              description: 'Push through your heels during hip thrusts to activate your glutes fully rather than your quads'
            }
          ]
        },
        {
          name: 'Back Line',
          duration: '15–18 min',
          description: '45° back extension machine, curls, cable pull-throughs.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nBack Extension (45°, machine)\n• 3 × 10–12 (RPE 4), 60s rest\nSeated Leg Curl (machine)\n• 3 × 10–12 (RPE 4), 60s rest\nCable Pull-Through\n• 3 × 10–12 (RPE 4), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "45° Back Extension",
                    "tutorialSlug": "roman_chair_weighted_back_extension"
                  },
                  {
                    "name": "3 × 10–12 , 60s rest"
                  },
                  {
                    "name": "Seated Leg Curl",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  },
                  {
                    "name": "Cable Pull-Through",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "cable_pull_through"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241192/mood_app/workout_images/149z42kp_download_19_.jpg',
          intensityReason: 'Supported hinge and curls reduce setup complexity.',
          moodTips: [
            {
              icon: 'body',
              title: 'Hinge from hips; neutral neck',
              description: 'Initiate the back extension from your hips while keeping your neck in a neutral position throughout'
            },
            {
              icon: 'contract',
              title: 'Squeeze glutes at top briefly',
              description: 'At the top of each rep, squeeze your glutes for a brief moment to maximize muscle activation'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Curl Stack',
          duration: '20–25 min',
          description: 'Seated curls, lying curls, hip thrusts for glute support.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nSeated Leg Curl (machine)\n• 4 × 8–10 (RPE 5), 60–75s rest\nLying Leg Curl (machine)\n• 3 × 10 (RPE 5), 60s rest\nHip Thrust Machine\n• 3 × 10–12 (RPE 5), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Seated Leg Curl",
                    "intensity": "RPE 5",
                    "rest": "60–75s",
                    "sets": 4,
                    "reps": "8–10"
                  },
                  {
                    "name": "Lying Leg Curl",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10"
                  },
                  {
                    "name": "Hip Thrust Machine",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241192/mood_app/workout_images/149z42kp_download_19_.jpg',
          intensityReason: 'Seated and lying curls load hams through full range.',
          moodTips: [
            {
              icon: 'body',
              title: 'Pad aligned with knee axis',
              description: 'Adjust the machine pad so it aligns with your knee joint for proper mechanics and reduced strain'
            },
            {
              icon: 'time',
              title: 'Control 3s lower on curls',
              description: 'Lower the weight over 3 seconds on each curl rep to maximize time under tension and hamstring growth'
            }
          ]
        },
        {
          name: 'Smith Hinge',
          duration: '20–25 min',
          description: 'Smith RDLs, seated curls, back extension machine.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nSmith RDL\n• 4 × 8 (RPE 5–6), 75s rest\nSeated Leg Curl (machine)\n• 3 × 10–12 (RPE 5), 60s rest\nBack Extension (machine)\n• 3 × 10–12 (RPE 5), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Smith RDL",
                    "intensity": "RPE 5–6",
                    "rest": "75s",
                    "sets": 4,
                    "reps": "8",
                    "tutorialSlug": "smith_machine_rdl"
                  },
                  {
                    "name": "Seated Leg Curl",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  },
                  {
                    "name": "Back Extension",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "roman_chair_back_extension"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241229/mood_app/workout_images/k4j5yazw_download_5_.jpg',
          intensityReason: 'Guided RDL reduces balance needs while loading safely.',
          moodTips: [
            {
              icon: 'body',
              title: 'Bar tracks thighs; soft knees',
              description: 'Keep the bar path close to your thighs throughout the RDL while maintaining a slight bend in your knees'
            },
            {
              icon: 'expand',
              title: 'Long hamstring line; neutral back',
              description: 'Feel a full stretch through your hamstrings while keeping your back flat and spine neutral'
            }
          ]
        },
        {
          name: 'Cable Hip',
          duration: '20–25 min',
          description: 'Pull-throughs first, curls next, hip abduction finisher.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\nCable Pull-Through\n• 4 × 10 (RPE 5), 60–75s rest\nSeated Leg Curl (machine)\n• 3 × 10–12 (RPE 5), 60s rest\nHip Abduction (machine)\n• 3 × 12–15 (RPE 5), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Cable Pull-Through",
                    "intensity": "RPE 5",
                    "rest": "60–75s",
                    "sets": 4,
                    "reps": "10",
                    "tutorialSlug": "cable_pull_through"
                  },
                  {
                    "name": "Seated Leg Curl",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  },
                  {
                    "name": "Hip Abduction",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "12–15",
                    "tutorialSlug": "hip_abductor"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241210/mood_app/workout_images/aggvazg1_download_4_.jpg',
          intensityReason: 'Cables guide hinge arcs with modest setup demands.',
          moodTips: [
            {
              icon: 'body',
              title: 'Hips back; shins quiet',
              description: 'Push your hips back while keeping your shins vertical—don\'t let your knees drift forward'
            },
            {
              icon: 'expand',
              title: 'Abduction: small range, steady pace',
              description: 'Use a controlled range of motion on abductions at a steady tempo for optimal glute activation'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Curl Drop',
          duration: '25–30 min',
          description: 'Heavy seated curl drops, RDLs after, thrust finish.',
          battlePlan: 'Instructions: Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom — rest 90s; repeat for 3 total series between exercises.\nSeated Leg Curl (machine)\n• 1 × 8 heavy (RPE 7) → drop 15% → 1 × 8 (RPE 6) → drop 15% → 1 × 8 (RPE 6)\n• Rest 90s; repeat for 3 total series\nSmith RDL\n• 3 × 8–10 (RPE 6), 60–75s rest\nHip Thrust Machine\n• 3 × 10–12 (RPE 6), 60–75s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Seated Leg Curl",
                    "intensity": "RPE 7",
                    "sets": 1,
                    "reps": "8"
                  },
                  {
                    "name": "Smith RDL",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "8–10",
                    "tutorialSlug": "smith_machine_rdl"
                  },
                  {
                    "name": "Hip Thrust Machine",
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
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241214/mood_app/workout_images/cj4dx97r_download_3_.jpg',
          intensityReason: 'Drop sets extend ham tension without complex skills.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Quick pin drops ~15%',
              description: 'Change the weight pin quickly between drops to minimize rest and maintain muscle fatigue throughout'
            },
            {
              icon: 'body',
              title: 'No hip hike; stay squared',
              description: 'Keep your hips level and squared throughout—avoid hiking one side up during curls'
            }
          ]
        },
        {
          name: 'Cluster Hinge',
          duration: '25–30 min',
          description: 'RDL clusters, lying curls next, abduction finisher.',
          battlePlan: 'Instructions: Cluster set: split the reps with a short built-in rest so every rep stays explosive. Work top to bottom.\nSmith RDL\n• 3 clusters: 3 + 3 + 3 (15s between), 90s between clusters\nLying Leg Curl (machine)\n• 3 × 10–12 (RPE 6), 60–75s rest\nHip Abduction (machine)\n• 3 × 12–15 (RPE 6), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Smith RDL",
                    "reps": "3",
                    "tutorialSlug": "smith_machine_rdl"
                  },
                  {
                    "name": "Lying Leg Curl",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "10–12"
                  },
                  {
                    "name": "Hip Abduction",
                    "intensity": "RPE 6",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "12–15",
                    "tutorialSlug": "hip_abductor"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241229/mood_app/workout_images/k4j5yazw_download_5_.jpg',
          intensityReason: 'Hinge clusters keep power while preserving spine control.',
          moodTips: [
            {
              icon: 'leaf',
              title: '15s breaths in clusters',
              description: 'Use the 15-second mini-rests to take deep breaths and reset your focus before the next mini-set'
            },
            {
              icon: 'body',
              title: 'Shins vertical; hinge pure',
              description: 'Keep your shins vertical throughout the RDL to ensure a pure hip hinge pattern'
            }
          ]
        },
        {
          name: 'Midrange Hinge',
          duration: '25–30 min',
          description: 'Seated curl 1.5s, pull-throughs next, back extensions.',
          battlePlan: 'Instructions: Curl to the top, lower halfway, curl back up, then lower fully — that\'s ONE rep. Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\nSeated Leg Curl (1.5 reps)\n• 3 × 8–10 (RPE 6), 60–75s rest\nCable Pull-Through\n• 3 × 10–12 (RPE 6), 60–75s rest\nBack Extension (machine)\n• 3 × 10–12 (RPE 6), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Seated Leg Curl",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "8–10"
                  },
                  {
                    "name": "Cable Pull-Through",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "cable_pull_through"
                  },
                  {
                    "name": "Back Extension",
                    "intensity": "RPE 6",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "roman_chair_back_extension"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241210/mood_app/workout_images/aggvazg1_download_4_.jpg',
          intensityReason: '1.5 curls add time under tension in safe positions.',
          moodTips: [
            {
              icon: 'time',
              title: '1s squeeze; 3s return',
              description: 'Hold a 1-second squeeze at peak contraction, then take 3 seconds to lower for maximum muscle tension'
            },
            {
              icon: 'body',
              title: 'Hips back; torso steady',
              description: 'Push your hips back during pull-throughs while keeping your torso at a consistent angle'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Full Lower Body',
    icon: 'fitness',
    workouts: {
      beginner: [
        {
          name: 'Simple Lines',
          duration: '18–22 min',
          description: 'Leg press, seated curl, extensions, seated calves finish.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nLeg Press (machine)\n• 3 × 10–12 (RPE 4), 60s rest\nSeated Leg Curl (machine)\n• 3 × 10–12 (RPE 4), 60s rest\nLeg Extension (machine)\n• 3 × 10–12 (RPE 4), 60s rest\nSeated Calf Raise (machine)\n• 3 × 12–15 (RPE 4), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Leg Press",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "leg_press"
                  },
                  {
                    "name": "Seated Leg Curl",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  },
                  {
                    "name": "Leg Extension",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "quad_extension"
                  },
                  {
                    "name": "Seated Calf Raise",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "12–15",
                    "tutorialSlug": "calf_raise"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241231/mood_app/workout_images/l69s6mlz_download.jpg',
          intensityReason: 'Balanced machines target legs with minimal coaching.',
          moodTips: [
            {
              icon: 'settings',
              title: 'Note seat settings for repeat',
              description: 'Record your machine seat positions to ensure consistent setup and save time in future sessions'
            },
            {
              icon: 'time',
              title: 'Smooth 2–1–3 tempo throughout',
              description: 'Use a controlled tempo: 2 seconds lifting, 1 second pause, 3 seconds lowering on all exercises'
            }
          ]
        },
        {
          name: 'Guided Flow',
          duration: '18–22 min',
          description: 'Hack squat, hip thrust, leg curl, standing calves lineup.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nHack Squat (machine)\n• 3 × 8–10 (RPE 4), 60s rest\nHip Thrust Machine\n• 3 × 10–12 (RPE 4), 60s rest\nSeated Leg Curl (machine)\n• 3 × 10–12 (RPE 4), 60s rest\nStanding Calf Raise (machine)\n• 3 × 12–15 (RPE 4), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Hack Squat",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "8–10",
                    "tutorialSlug": "hack_squat"
                  },
                  {
                    "name": "Hip Thrust Machine",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  },
                  {
                    "name": "Seated Leg Curl",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  },
                  {
                    "name": "Standing Calf Raise",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "12–15",
                    "tutorialSlug": "calf_raise"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://customer-assets.emergentagent.com/job_upper-body-enhance/artifacts/rchrkjlm_hs.avif',
          intensityReason: 'Guided paths reduce setup and stabilize each lift.',
          moodTips: [
            {
              icon: 'expand',
              title: 'Own range you can control',
              description: 'Work within a range of motion you can control completely—quality reps matter more than depth'
            },
            {
              icon: 'leaf',
              title: 'Breathe steady; no tempo rush',
              description: 'Maintain steady breathing throughout and avoid rushing the tempo even when fatigued'
            }
          ]
        },
        {
          name: 'Cable Mix',
          duration: '18–22 min',
          description: 'Pull-throughs, cable squats, curls, abduction closer.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nCable Pull-Through\n• 3 × 10–12 (RPE 4), 60s rest\nCable Goblet Squat (low cable)\n• 3 × 10–12 (RPE 4), 60s rest\nSeated Leg Curl (machine)\n• 3 × 10–12 (RPE 4), 60s rest\nHip Abduction (machine)\n• 3 × 12–15 (RPE 4), 45–60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Cable Pull-Through",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "cable_pull_through"
                  },
                  {
                    "name": "Cable Goblet Squat",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "cable_squat"
                  },
                  {
                    "name": "Seated Leg Curl",
                    "intensity": "RPE 4",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  },
                  {
                    "name": "Hip Abduction",
                    "intensity": "RPE 4",
                    "rest": "45–60s",
                    "sets": 3,
                    "reps": "12–15",
                    "tutorialSlug": "hip_abductor"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241206/mood_app/workout_images/9k0i6seo_download_4_.jpg',
          intensityReason: 'Cable arcs guide hips and knees with modest effort.',
          moodTips: [
            {
              icon: 'body',
              title: 'Brace light; ribs stacked',
              description: 'Engage your core gently and keep your ribcage aligned over your pelvis for proper spinal positioning'
            },
            {
              icon: 'expand',
              title: 'Small ranges are okay',
              description: 'Focus on controlling a comfortable range of motion—smaller controlled reps beat sloppy deep ones'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Balanced Load',
          duration: '22–28 min',
          description: 'Leg press, curls, extensions, calf press; steady flow.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nLeg Press (machine)\n• 4 × 10 (RPE 5), 60–75s rest\nSeated Leg Curl (machine)\n• 3 × 10–12 (RPE 5), 60s rest\nLeg Extension (machine)\n• 3 × 10–12 (RPE 5), 60s rest\nCalf Press (on leg press)\n• 3 × 12–15 (RPE 5), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Leg Press",
                    "intensity": "RPE 5",
                    "rest": "60–75s",
                    "sets": 4,
                    "reps": "10",
                    "tutorialSlug": "leg_press"
                  },
                  {
                    "name": "Seated Leg Curl",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  },
                  {
                    "name": "Leg Extension",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "quad_extension"
                  },
                  {
                    "name": "Calf Press",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "12–15",
                    "tutorialSlug": "calf_raise"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241231/mood_app/workout_images/l69s6mlz_download.jpg',
          intensityReason: 'Moderate volume across quads, hams, glutes, calves.',
          moodTips: [
            {
              icon: 'body',
              title: 'Track knee alignment',
              description: 'Monitor your knee tracking throughout—ensure knees move in line with your toes on all exercises'
            },
            {
              icon: 'time',
              title: 'Control all eccentrics',
              description: 'Focus on controlling the lowering phase of every exercise to maximize muscle engagement and growth'
            }
          ]
        },
        {
          name: 'Vertical Guide',
          duration: '22–28 min',
          description: 'Hack squats, hip thrusts, curls, standing calves finish.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nHack Squat (machine)\n• 4 × 8 (RPE 5–6), 75s rest\nHip Thrust Machine\n• 3 × 10–12 (RPE 5), 60s rest\nSeated Leg Curl (machine)\n• 3 × 10–12 (RPE 5), 60s rest\nStanding Calf Raise (machine)\n• 3 × 12–15 (RPE 5), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Hack Squat",
                    "intensity": "RPE 5–6",
                    "rest": "75s",
                    "sets": 4,
                    "reps": "8",
                    "tutorialSlug": "hack_squat"
                  },
                  {
                    "name": "Hip Thrust Machine",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  },
                  {
                    "name": "Seated Leg Curl",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  },
                  {
                    "name": "Standing Calf Raise",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "12–15",
                    "tutorialSlug": "calf_raise"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241238/mood_app/workout_images/nsyfdaao_download_3_.jpg',
          intensityReason: 'Guided squat and hinge pair simplifies workload.',
          moodTips: [
            {
              icon: 'body',
              title: 'Heels down; quiet knees',
              description: 'Keep heels planted firmly and avoid any knee wobbling or caving during hack squats'
            },
            {
              icon: 'contract',
              title: 'Squeeze glutes at top',
              description: 'At the top of each hip thrust, squeeze your glutes firmly for maximum muscle activation'
            }
          ]
        },
        {
          name: 'Smith Lines',
          duration: '22–28 min',
          description: 'Smith squats, RDLs, curls, hip abduction machine close.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nSmith Back Squat\n• 4 × 8 (RPE 5–6), 75s rest\nSmith RDL\n• 3 × 8–10 (RPE 5), 60–75s rest\nSeated Leg Curl (machine)\n• 3 × 10–12 (RPE 5), 60s rest\nHip Abduction (machine)\n• 3 × 12–15 (RPE 5), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Smith Back Squat",
                    "intensity": "RPE 5–6",
                    "rest": "75s",
                    "sets": 4,
                    "reps": "8",
                    "tutorialSlug": "smith_machine_back_squat"
                  },
                  {
                    "name": "Smith RDL",
                    "intensity": "RPE 5",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "8–10",
                    "tutorialSlug": "smith_machine_rdl"
                  },
                  {
                    "name": "Seated Leg Curl",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  },
                  {
                    "name": "Hip Abduction",
                    "intensity": "RPE 5",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "12–15",
                    "tutorialSlug": "hip_abductor"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241233/mood_app/workout_images/lzw2ud21_download.jpg',
          intensityReason: 'Smith guidance reduces balance demands and setup.',
          moodTips: [
            {
              icon: 'body',
              title: 'Bar track vertical; brace light',
              description: 'Let the Smith bar travel in its vertical path while engaging your core gently for support'
            },
            {
              icon: 'expand',
              title: 'Hips back on RDL; shins still',
              description: 'Push your hips back during the RDL while keeping your shins vertical throughout the movement'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Drop Lines',
          duration: '28–35 min',
          description: 'Press drop, curl drop, extensions, calf volume finish.',
          battlePlan: 'Instructions: Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom — rest 90s; repeat for 3 total series between exercises.\nLeg Press (machine)\n• 1 × 8 heavy (RPE 7) → drop 15% → 1 × 8 (RPE 6) → drop 15% → 1 × 8 (RPE 6)\n• Rest 90s; repeat for 3 total series\nSeated Leg Curl (machine)\n• 1 × 10 heavy (RPE 7) → drop 15% → 1 × 10 (RPE 6)\nLeg Extension (machine)\n• 3 × 10–12 (RPE 6), 60–75s rest\nSeated Calf Raise (machine)\n• 3 × 15–20 (RPE 6), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Leg Press",
                    "intensity": "RPE 7",
                    "sets": 1,
                    "reps": "8",
                    "tutorialSlug": "leg_press"
                  },
                  {
                    "name": "Seated Leg Curl",
                    "intensity": "RPE 7",
                    "sets": 1,
                    "reps": "10",
                    "tutorialSlug": "leg_press"
                  },
                  {
                    "name": "Leg Extension",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "10–12",
                    "tutorialSlug": "quad_extension"
                  },
                  {
                    "name": "Seated Calf Raise",
                    "intensity": "RPE 6",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "15–20",
                    "tutorialSlug": "calf_raise"
                  }
                ],
                "rest": "90s; repeat for 3 total series"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241231/mood_app/workout_images/l69s6mlz_download.jpg',
          intensityReason: 'Drop sets add volume without technical complexity.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Efficient pin moves',
              description: 'Change the weight pin quickly and efficiently between drops to maintain training intensity'
            },
            {
              icon: 'time',
              title: 'Keep tempo consistent',
              description: 'Maintain the same controlled tempo throughout all drop set portions for consistent muscle stimulus'
            }
          ]
        },
        {
          name: 'Cluster Lines',
          duration: '28–35 min',
          description: 'Hack clusters, RDL clusters, curls, abduction closer.',
          battlePlan: 'Instructions: Cluster set: split the reps with a short built-in rest so every rep stays explosive. Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\nHack Squat (machine)\n• 3 clusters: 3 + 3 + 3 (15s between), 90s between clusters\nSmith RDL\n• 3 clusters: 3 + 3 + 3 (15s between), 90s between clusters\nSeated Leg Curl (machine)\n• 3 × 10–12 (RPE 6), 60–75s rest\nHip Abduction (machine)\n• 3 × 12–15 (RPE 6), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Hack Squat",
                    "reps": "3",
                    "tutorialSlug": "hack_squat"
                  },
                  {
                    "name": "Smith RDL",
                    "reps": "3",
                    "tutorialSlug": "smith_machine_rdl"
                  },
                  {
                    "name": "Seated Leg Curl",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 3,
                    "reps": "10–12"
                  },
                  {
                    "name": "Hip Abduction",
                    "intensity": "RPE 6",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "12–15",
                    "tutorialSlug": "hip_abductor"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://customer-assets.emergentagent.com/job_upper-body-enhance/artifacts/0tawdmfz_hs.avif',
          intensityReason: 'Clusters preserve form while keeping output high.',
          moodTips: [
            {
              icon: 'leaf',
              title: '15s rests inside clusters',
              description: 'Use the brief 15-second mini-rests to take deep breaths and reset your focus before continuing'
            },
            {
              icon: 'barbell',
              title: 'Same load within cluster',
              description: 'Keep the weight constant throughout all mini-sets within each cluster for consistent training effect'
            }
          ]
        },
        {
          name: 'Cable Finish (Lower)',
          duration: '28–35 min',
          description: 'Pull-throughs, cable goblets, curls, standing calves.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\nCable Pull-Through\n• 4 × 10 (RPE 6), 60–75s rest\nCable Goblet Squat (low cable)\n• 4 × 8–10 (RPE 6), 60–75s rest\nSeated Leg Curl (machine)\n• 3 × 10–12 (RPE 6), 60s rest\nStanding Calf Raise (machine)\n• 3 × 12–15 (RPE 6), 60s rest',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Cable Pull-Through",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 4,
                    "reps": "10",
                    "tutorialSlug": "cable_pull_through"
                  },
                  {
                    "name": "Cable Goblet Squat",
                    "intensity": "RPE 6",
                    "rest": "60–75s",
                    "sets": 4,
                    "reps": "8–10",
                    "tutorialSlug": "cable_squat"
                  },
                  {
                    "name": "Seated Leg Curl",
                    "intensity": "RPE 6",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "10–12"
                  },
                  {
                    "name": "Standing Calf Raise",
                    "intensity": "RPE 6",
                    "rest": "60s",
                    "sets": 3,
                    "reps": "12–15",
                    "tutorialSlug": "calf_raise"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241194/mood_app/workout_images/3gaohp2y_cgs.jpg',
          intensityReason: 'Midrange cable work adds tension at modest loading.',
          moodTips: [
            {
              icon: 'body',
              title: 'Pull-through: hips back',
              description: 'Push your hips back during pull-throughs to maximize glute and hamstring engagement'
            },
            {
              icon: 'expand',
              title: 'Goblet: ribs down, tall',
              description: 'Keep your ribcage down and torso tall during goblet squats for optimal core engagement'
            }
          ]
        }
      ]
    }
  }
];
