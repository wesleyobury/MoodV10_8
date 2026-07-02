import { EquipmentWorkouts } from '../types/workout';

export const backWorkoutDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Dumbbells',
    icon: 'fitness-outline',
    workouts: {
      beginner: [
        {
          name: 'DB Row + Rear Fly',
          duration: '12–14 min',
          description: 'Rows for pulling power and rear flies for stability',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 10 Single-Arm Dumbbell Row (each side, supported on bench)\nRest 60s after each side\n• 10 Prone Rear Delt Fly (lying face down)\nRest 60s after each set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Single-Arm Dumbbell Row",
                    "reps": "10",
                    "tutorialSlug": "db_single_arm_row"
                  },
                  {
                    "name": "Prone Rear Delt Fly",
                    "reps": "10",
                    "tutorialSlug": "db_fly"
                  }
                ],
                "rounds": 3,
                "rest": "60s after each side"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240554/mood_app/workout_images/q6jestgn_download.jpg',
          intensityReason: 'Targets lats + rear delts with simple supported lifts',
          moodTips: [
            {
              icon: 'construct',
              title: 'Keep bench as chest support, avoid over-arching.',
              description: 'Proper bench support isolates target muscles and protects spine.'
            },
            {
              icon: 'timer',
              title: 'Move light on rear flies; control beats swinging.',
              description: 'Controlled tempo maximizes rear delt activation over momentum.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Y-T Row Flow',
          duration: '12–14 min',
          description: 'Rows with Y + T raises for posture and shoulder health',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 10 Single-Arm Row (each side)\n• 10 Incline Prone Y-Raise\n• 10 Incline Prone T-Raise\nRest 75s after sequence',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "name": "Single-Arm Row",
                    "reps": "10",
                    "tutorialSlug": "db_single_arm_row"
                  },
                  {
                    "name": "Incline Prone Y-Raise",
                    "reps": "10"
                  },
                  {
                    "name": "Incline Prone T-Raise",
                    "reps": "10"
                  }
                ],
                "rounds": 3,
                "rest": "75s after sequence"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240869/mood_app/workout_images/928yql53_download_22_.jpg',
          intensityReason: 'Basic scapular + rear delt balance with angles',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Slow and deliberate Y/T raises, not weight-focused.',
              description: 'Movement quality over load for postural muscle activation.'
            },
            {
              icon: 'construct',
              title: 'Keep forehead against pad for no neck strain.',
              description: 'Pad contact maintains neutral neck alignment throughout movement.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'mixed',
          intensity_cost: 3,
        },
        {
          name: 'Supported One-Arm Rows',
          duration: '12–14 min',
          description: 'Bench-supported rows to learn clean pulling mechanics',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 10 Single-Arm DB Rows (each side)\nRest 60s per side',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Single-Arm DB Rows",
                    "reps": "10",
                    "tutorialSlug": "db_single_arm_row"
                  }
                ],
                "rounds": 3,
                "rest": "60s per side"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240692/mood_app/workout_images/2ctzlc7l_SA_db_row.jpg',
          intensityReason: 'Supported setup teaches proper mechanics',
          moodTips: [
            {
              icon: 'construct',
              title: 'Support removes cheating',
              description: 'Knee and hand on bench keep spine neutral.'
            },
            {
              icon: 'flash',
              title: 'Pull with the elbow',
              description: 'Elbow drives past ribs, not dumbbell toward shoulder.'
            },
            {
              icon: 'body',
              title: 'Feel the lat stretch',
              description: 'Let shoulder protract slightly at the bottom.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Chest-Supported Dumbbell Rows',
          duration: '12–14 min',
          description: 'Prone rows emphasizing mid-back control',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 12 Chest-Supported DB Rows\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Chest-Supported DB Rows",
                    "reps": "12",
                    "tutorialSlug": "chest_supported_db_row"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240748/mood_app/workout_images/rw2y880d_chest_supported_db_row.jpg',
          intensityReason: 'Chest support isolates mid-back muscles',
          moodTips: [
            {
              icon: 'construct',
              title: 'Chest stays glued',
              description: 'No torso lift or momentum.'
            },
            {
              icon: 'timer',
              title: 'Pause at the squeeze',
              description: '1–2s hold reinforces contraction.'
            },
            {
              icon: 'flash',
              title: 'Think shoulder blades first',
              description: 'Arms follow scapular movement.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Chest-Support Row',
          duration: '14–16 min',
          description: 'Supported rows and flies promote strict contraction',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 8 Chest-Supported Dumbbell Row\nRest 75–90s\n• 10 Incline Prone Reverse Fly\nRest 75–90s',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "name": "Chest-Supported Dumbbell Row",
                    "reps": "8",
                    "tutorialSlug": "chest_supported_db_row"
                  },
                  {
                    "name": "Incline Prone Reverse Fly",
                    "reps": "10",
                    "tutorialSlug": "incline_db_fly"
                  }
                ],
                "rounds": 4,
                "rest": "75–90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240554/mood_app/workout_images/q6jestgn_download.jpg',
          intensityReason: 'Neutral spine from support isolates lats + traps',
          moodTips: [
            {
              icon: 'flash',
              title: 'Don\'t yank dumbbells—steady elbows driving back.',
              description: 'Controlled elbow drive maximizes lat activation over momentum.'
            },
            {
              icon: 'timer',
              title: 'Go light on reverse fly, pause 1s at top.',
              description: 'Peak contraction pause enhances rear delt development.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'W-Rear Flow',
          duration: '14–16 min',
          description: 'Rows, W-raises, and flys refine mid-back strength',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 8 Single-Arm Row (each side)\n• 8 Incline Prone W-Raise\n• 8 Incline Prone Reverse Fly\nRest 90s after sequence',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "name": "Single-Arm Row",
                    "reps": "8",
                    "tutorialSlug": "db_single_arm_row"
                  },
                  {
                    "name": "Incline Prone W-Raise",
                    "reps": "8"
                  },
                  {
                    "name": "Incline Prone Reverse Fly",
                    "reps": "8",
                    "tutorialSlug": "incline_db_fly"
                  }
                ],
                "rounds": 3,
                "rest": "90s after sequence"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240895/mood_app/workout_images/k5agvaci_download_23_.jpg',
          intensityReason: 'W-raises + flys emphasize scapular control within a circuit',
          moodTips: [
            {
              icon: 'flash',
              title: 'In W-raise, squeeze shoulder blades hard.',
              description: 'Maximum scapular retraction activates mid-traps effectively.'
            },
            {
              icon: 'construct',
              title: 'Keep reps slow, avoid shrugging shoulders.',
              description: 'Controlled tempo with depressed shoulders isolates target muscles.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'mixed',
          intensity_cost: 4,
        },
        {
          name: 'Paused Dumbbell Rows',
          duration: '14–16 min',
          description: 'One-arm rows with extended peak contraction',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n4 rounds\n• 8 DB Rows (2s pause, each side)\nRest 75–90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "DB Rows",
                    "reps": "8",
                    "tutorialSlug": "db_single_arm_row"
                  }
                ],
                "rounds": 4,
                "rest": "75–90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240692/mood_app/workout_images/2ctzlc7l_SA_db_row.jpg',
          intensityReason: 'Paused reps maximize peak contraction time',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause every rep',
              description: 'Hold 2s at the top.'
            },
            {
              icon: 'construct',
              title: 'No torso rotation',
              description: 'Hips and shoulders stay square.'
            },
            {
              icon: 'flash',
              title: 'Peak form feels tight',
              description: 'Lat and mid-back should cramp slightly.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Dumbbell Row Drop Set',
          duration: '14–16 min',
          description: 'Heavy rows extended using fast weight drops',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 8 DB Rows\n• Row drop → 8\n• Row drop → 8\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "DB Rows",
                    "reps": "8",
                    "tutorialSlug": "db_single_arm_row",
                    "note": "Drop → 8; Drop → 8"
                  }
                ],
                "rounds": 3,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240748/mood_app/workout_images/rw2y880d_chest_supported_db_row.jpg',
          intensityReason: 'Drop sets extend time under tension beyond failure',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drops are immediate',
              description: 'Reduce weight fast, no rest.'
            },
            {
              icon: 'construct',
              title: 'Drop size stays clean',
              description: '~20–30% each drop.'
            },
            {
              icon: 'body',
              title: 'Straps are allowed',
              description: 'Grip shouldn\'t cap back overload.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'pump',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: '3-Way Pull Row',
          duration: '16–18 min',
          description: 'Supported row, reverse fly, and single-arm grind',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 8 Chest-Supported Row\nRest 90s\n• 8 Incline Prone Reverse Fly\nRest 90s\n• 8 Single-Arm Row (each side)\nRest 90s',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "name": "Chest-Supported Row",
                    "reps": "8",
                    "tutorialSlug": "t-bar_row_machine"
                  },
                  {
                    "name": "Incline Prone Reverse Fly",
                    "reps": "8",
                    "tutorialSlug": "incline_db_fly"
                  },
                  {
                    "name": "Single-Arm Row",
                    "reps": "8",
                    "tutorialSlug": "db_single_arm_row"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240554/mood_app/workout_images/q6jestgn_download.jpg',
          intensityReason: 'Multiple row/rear delt moves for depth of fatigue',
          moodTips: [
            {
              icon: 'construct',
              title: 'Stay strict: upper body still, arms pulling only.',
              description: 'Isolated arm movement maximizes target muscle activation.'
            },
            {
              icon: 'flash',
              title: 'Neutral spine always, no jerking.',
              description: 'Consistent spinal alignment prevents compensation patterns.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Y-T Row Blast',
          duration: '18–20 min',
          description: 'Rows plus Y/T raises for balanced shoulder growth',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 8 Chest-Supported Row\n• 8 Incline Prone Y-Raise\n• 8 Incline Prone T-Raise\nRest 90–120s after sequence',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "name": "Chest-Supported Row",
                    "reps": "8",
                    "tutorialSlug": "t-bar_row_machine"
                  },
                  {
                    "name": "Incline Prone Y-Raise",
                    "reps": "8"
                  },
                  {
                    "name": "Incline Prone T-Raise",
                    "reps": "8"
                  }
                ],
                "rounds": 4,
                "rest": "90–120s after sequence"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240549/mood_app/workout_images/e00z2xt6_download_1_.jpg',
          intensityReason: 'Multi-angle raises + row overload scapular support',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Limit load on Y/T—goal is posture, not strain.',
              description: 'Light loads with perfect form for postural muscle development.'
            },
            {
              icon: 'timer',
              title: 'Breathe steady during high fatigue at end.',
              description: 'Controlled breathing maintains performance through fatigue.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Heavy Dumbbell Rows',
          duration: '16–18 min',
          description: 'Heavy unilateral rows for maximal lat loading',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 6 Heavy DB Rows (each side)\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Heavy DB Rows",
                    "reps": "6",
                    "tutorialSlug": "db_single_arm_row"
                  }
                ],
                "rounds": 4,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240692/mood_app/workout_images/2ctzlc7l_SA_db_row.jpg',
          intensityReason: 'Heavy loads maximize strength development',
          moodTips: [
            {
              icon: 'construct',
              title: 'Load stays strict',
              description: 'Reduce weight if torso twists.'
            },
            {
              icon: 'flash',
              title: 'Explode then control',
              description: 'Fast pull, slow return.'
            },
            {
              icon: 'body',
              title: 'Straps encouraged',
              description: 'Let lats fail before grip.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Triple Drop Dumbbell Rows',
          duration: '18–20 min',
          description: 'Extended drop sets to fully exhaust back',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 6 Rows\n• Rows drop → 6\n• Rows drop → 6\n• Rows drop → 6\nRest 150s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Rows",
                    "reps": "6",
                    "note": "Drop → 6; Drop → 6; Drop → 6"
                  }
                ],
                "rounds": 3,
                "rest": "150s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240748/mood_app/workout_images/rw2y880d_chest_supported_db_row.jpg',
          intensityReason: 'Triple drops maximize muscle fatigue and pump',
          moodTips: [
            {
              icon: 'flash',
              title: 'Three fast drops',
              description: 'No rest between reductions.'
            },
            {
              icon: 'construct',
              title: 'Same pull pattern',
              description: 'Elbow path stays identical.'
            },
            {
              icon: 'body',
              title: 'Chase deep lat pump',
              description: 'Under-armpit burn is the goal.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'pump',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Barbell',
    icon: 'remove',
    workouts: {
      beginner: [
        {
          name: 'Row & Deadlift',
          duration: '14–16 min',
          description: 'Rows and deadlifts develop base power and muscle control.',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds:\n• 10 Barbell Bent-Over Row\nRest 60–75s after each set\n• 10 Barbell Deadlift\nRest 60–75s after each set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Barbell Bent-Over Row",
                    "reps": "10",
                    "tutorialSlug": "barbell_row"
                  },
                  {
                    "name": "Barbell Deadlift",
                    "reps": "10",
                    "tutorialSlug": "barbell_deadlift"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s after each set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240560/mood_app/workout_images/x2wxwvpl_download_2_.jpg',
          videoUrl: 'https://res.cloudinary.com/dfsygar5c/video/upload/v1770240452/mood_app/workout_videos/BB_deadlift.mov',
          intensityReason: 'Builds foundational back strength with compound lifts.',
          moodTips: [
            {
              icon: 'construct',
              title: 'Brace core, hinge hips, maintain flat back',
              description: 'Proper spine alignment protects back on all lifts.'
            },
            {
              icon: 'flash',
              title: 'Tight lats protect spine',
              description: 'Lat engagement improves pulling strength and safety.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'deadlift',
          training_style: 'mixed',
          intensity_cost: 3,
        },
        {
          name: 'Row Flow Combo',
          duration: '12–14 min',
          description: 'Combines row grips and good mornings for total back work.',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds:\n• 10 Bent-Over Row\n• 10 Underhand Grip Row\n• 10 Barbell Good Morning\nRest 60–75s after completing the full sequence',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Bent-Over Row",
                    "reps": "10",
                    "tutorialSlug": "barbell_row"
                  },
                  {
                    "name": "Underhand Grip Row",
                    "reps": "10"
                  },
                  {
                    "name": "Barbell Good Morning",
                    "reps": "10",
                    "tutorialSlug": "barbell_good_mornings"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s after completing the full sequence"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240868/mood_app/workout_images/8q41tii0_download_1_.jpg',
          intensityReason: 'Varied grip rowing boosts muscular activation volume.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Transition smoothly between grips',
              description: 'Don\'t rush form between grip changes for better activation.'
            },
            {
              icon: 'body',
              title: 'Drive hips back, spine neutral',
              description: 'Proper hip hinge pattern during good mornings.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'mixed',
          intensity_cost: 3,
        },
        {
          name: 'Tempo Bent-Over Rows',
          duration: '12–14 min',
          description: 'Controlled barbell rows emphasizing strict tempo',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n3 rounds\n• 10 Bent-Over Rows (3s eccentric)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Bent-Over Rows",
                    "reps": "10",
                    "tutorialSlug": "barbell_row"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240699/mood_app/workout_images/8imeatpq_bb_row_2.jpg',
          intensityReason: 'Tempo work builds control and strength foundation',
          moodTips: [
            {
              icon: 'construct',
              title: 'Brace before pulling',
              description: 'Lock core to protect spine.'
            },
            {
              icon: 'timer',
              title: 'Lower slow and steady',
              description: '3s eccentric each rep.'
            },
            {
              icon: 'body',
              title: 'Back stays flat',
              description: 'Think proud chest, neutral neck.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Pause Rows',
          duration: '12–14 min',
          description: 'Barbell rows with pauses at contraction',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n3 rounds\n• 8 Paused Bent-Over Rows\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Paused Bent-Over Rows",
                    "reps": "8",
                    "tutorialSlug": "barbell_row"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240714/mood_app/workout_images/eubpjqb9_bb_row.jpg',
          intensityReason: 'Paused reps reinforce form and peak contraction',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause every rep',
              description: 'Hold bar against torso for 2s.'
            },
            {
              icon: 'construct',
              title: 'Reset between reps',
              description: 'Dead stop removes momentum.'
            },
            {
              icon: 'flash',
              title: 'Feel mid-back squeeze',
              description: 'Not arms, not hips.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'strength',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Pendlay + RDL',
          duration: '16–18 min',
          description: 'Pendlay rows and RDLs balance power with hamstring load.',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds:\n• 8 Pendlay Row\nRest 75–90s after each set\n• 10 Romanian Deadlift\nRest 75–90s after each set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Pendlay Row",
                    "reps": "8",
                    "tutorialSlug": "barbell_row"
                  },
                  {
                    "name": "Romanian Deadlift",
                    "reps": "10",
                    "tutorialSlug": "smith_machine_rdl"
                  }
                ],
                "rounds": 4,
                "rest": "75–90s after each set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240743/mood_app/workout_images/rh9264vy_pendlay_row.jpg',
          intensityReason: 'Explosive pulls and slow RDLs strengthen full posterior.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Reset back tightness between Pendlay reps',
              description: 'Dead stop allows full lat engagement each rep.'
            },
            {
              icon: 'timer',
              title: 'Lower bar under control',
              description: 'Control eccentric to fully stretch hamstrings.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'deadlift',
          training_style: 'mixed',
          intensity_cost: 4,
        },
        {
          name: 'Row Shrug Flow',
          duration: '16–18 min',
          description: 'Multi-grip rows, shrugs, deads build traps and mid-back.',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds:\n• 8 Bent-Over Row\n• 8 Reverse-Grip Row\n• 8 Barbell Shrugs\n• 8 Deadlift\nRest 90s after finishing the full circuit',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Bent-Over Row",
                    "reps": "8",
                    "tutorialSlug": "barbell_row"
                  },
                  {
                    "name": "Reverse-Grip Row",
                    "reps": "8"
                  },
                  {
                    "name": "Barbell Shrugs",
                    "reps": "8"
                  },
                  {
                    "name": "Deadlift",
                    "reps": "8",
                    "tutorialSlug": "barbell_deadlift"
                  }
                ],
                "rounds": 3,
                "rest": "90s after finishing the full circuit"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240874/mood_app/workout_images/a5y4znby_download_2_.jpg',
          intensityReason: 'Combo of rows, shrugs, and deads creates dense fatigue.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Squeeze shrugs hard for one second',
              description: 'Peak contraction at top maximizes trap activation.'
            },
            {
              icon: 'construct',
              title: 'Stabilize posture before transitioning',
              description: 'Reset form between exercises for safety and effectiveness.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'mixed',
          intensity_cost: 4,
        },
        {
          name: 'Barbell Row Drop Set',
          duration: '16–18 min',
          description: 'Heavy rows extended using plate reductions',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 6 Rows\n• Row drop → 6\n• Row drop → 6\nRest 150s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Barbell Row Drop Set",
                    "reps": "6",
                    "tutorialSlug": "barbell_row",
                    "note": "Drop → 6; Drop → 6"
                  }
                ],
                "rounds": 3,
                "rest": "150s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240863/mood_app/workout_images/5s4czjs3_download_3_.jpg',
          intensityReason: 'Drop sets extend time under tension beyond failure',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drops are fast',
              description: 'Strip plates immediately.'
            },
            {
              icon: 'construct',
              title: 'Moderate drops work best',
              description: '~20% per reduction.'
            },
            {
              icon: 'body',
              title: 'Straps are allowed',
              description: 'Grip shouldn\'t limit back loading.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'pump',
          intensity_cost: 4,
        },
        {
          name: 'Iso-Finish Rows',
          duration: '16–18 min',
          description: 'Rows finished with static bar holds',
          battlePlan: 'Instructions: Holds are strict: locked position, no drifting.\n4 rounds\n• 8 Rows\n• Finish with 10s hold\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Rows",
                    "reps": "8",
                    "note": "Finish with 10s hold"
                  }
                ],
                "rounds": 4,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240714/mood_app/workout_images/eubpjqb9_bb_row.jpg',
          intensityReason: 'Isometric finisher maximizes time under tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Hold at the top',
              description: '10s contraction after last rep.'
            },
            {
              icon: 'construct',
              title: 'No torso lift',
              description: 'Stay hinged, chest stable.'
            },
            {
              icon: 'flash',
              title: 'Peak form feels crushing',
              description: 'Upper-back squeeze dominates.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Barbell',
          duration: '20–22 min',
          description: 'Rows, deads, shrugs overload traps and spinal erectors.',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds:\n• 8 Barbell Bent-Over Row\nRest 90–120s after each set\n• 8 Barbell Deadlift\nRest 90–120s after each set\n• 8 Barbell Shrug\nRest 90–120s after each set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Barbell Bent-Over Row",
                    "reps": "8",
                    "tutorialSlug": "barbell_row"
                  },
                  {
                    "name": "Barbell Deadlift",
                    "reps": "8",
                    "tutorialSlug": "barbell_deadlift"
                  },
                  {
                    "name": "Barbell Shrug",
                    "reps": "8"
                  }
                ],
                "rounds": 4,
                "rest": "90–120s after each set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240560/mood_app/workout_images/x2wxwvpl_download_2_.jpg',
          intensityReason: 'Higher volume heavy lifts establish raw size and mass.',
          moodTips: [
            {
              icon: 'timer',
              title: 'Control eccentric for time under tension',
              description: 'Slow lowering phase builds strength and muscle mass.'
            },
            {
              icon: 'trending-up',
              title: 'Drive hips and traps through lockouts',
              description: 'Complete range of motion for maximum development.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Power Complex',
          duration: '20–22 min',
          description: 'Row, high pull, and clean complex maximizes back output.',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds:\n• 8 Barbell Row\n• 8 Barbell High Pull\n• 8 Barbell Power Clean\nRest 90–120s after completing the full sequence',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Barbell Row",
                    "reps": "8",
                    "tutorialSlug": "barbell_row"
                  },
                  {
                    "name": "Barbell High Pull",
                    "reps": "8",
                    "tutorialSlug": "kb_high_pull"
                  },
                  {
                    "name": "Barbell Power Clean",
                    "reps": "8",
                    "tutorialSlug": "power_clean"
                  }
                ],
                "rounds": 4,
                "rest": "90–120s after completing the full sequence"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240892/mood_app/workout_images/hnesh89k_download.jpg',
          intensityReason: 'Explosive high pulls and cleans target power capacity.',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Keep elbows leading bar path',
              description: 'Proper elbow position in high pulls for maximum power.'
            },
            {
              icon: 'flash',
              title: 'Explode hips to drive bar fast',
              description: 'Hip drive generates power for explosive cleans.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Heavy Tempo Rows',
          duration: '18–20 min',
          description: 'Heavy barbell rows with long controlled eccentrics',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n4 rounds\n• 6 Rows (5s eccentric)\nRest 150s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Rows",
                    "reps": "6"
                  }
                ],
                "rounds": 4,
                "rest": "150s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240699/mood_app/workout_images/8imeatpq_bb_row_2.jpg',
          intensityReason: 'Extended eccentrics maximize strength and hypertrophy',
          moodTips: [
            {
              icon: 'construct',
              title: 'Weight stays clean',
              description: 'Reduce load if tempo breaks.'
            },
            {
              icon: 'timer',
              title: 'Explode up, crawl down',
              description: '4–5s eccentric.'
            },
            {
              icon: 'body',
              title: 'Straps protect output',
              description: 'Let back, not grip, fail.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Row Mechanical Drop',
          duration: '20–22 min',
          description: 'Grip-width changes to extend heavy sets',
          battlePlan: 'Instructions: Supersets are back-to-back — no rest until the pair is done.\n3 rounds\n• 6 Wide-Grip Rows\n• 6 Standard Rows — immediately, no rest\n• 6 Underhand Rows — immediately, no rest\nRest 150s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Wide-Grip Rows",
                    "reps": "6",
                    "tutorialSlug": "wide_grip_t_bar_chest_supported_row",
                    "note": "Immediately 6 Standard Rows; Immediately 6 Underhand Rows"
                  }
                ],
                "rounds": 3,
                "rest": "150s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240714/mood_app/workout_images/eubpjqb9_bb_row.jpg',
          intensityReason: 'Mechanical drops maximize volume and muscle fatigue',
          moodTips: [
            {
              icon: 'flash',
              title: 'Grip narrows as fatigue rises',
              description: 'Mechanical advantage keeps reps moving.'
            },
            {
              icon: 'construct',
              title: 'Same bar, no reset',
              description: 'Continuous tension.'
            },
            {
              icon: 'body',
              title: 'Chase lat density',
              description: 'You should feel deep thickness building.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Kettle bells',
    icon: 'cafe-outline',
    workouts: {
      beginner: [
        {
          name: 'Row & Deadlift KB',
          duration: '12–14 min',
          description: 'Rows and deadlifts with kettlebells build back base',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 10 Single-Arm KB Row (each side)\nRest 60–75s after each set\n• 10 KB Deadlift\nRest 60–75s after each set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Single-Arm KB Row",
                    "reps": "10",
                    "tutorialSlug": "db_single_arm_row"
                  },
                  {
                    "name": "KB Deadlift",
                    "reps": "10"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s after each set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240556/mood_app/workout_images/s9jbh6k2_download_6_.jpg',
          intensityReason: 'Simple pull + hinge strengthen grip and core and with modest intensity',
          moodTips: [
            {
              icon: 'construct',
              title: 'Keep bell close to shins during deadlifts.',
              description: 'Proper bell placement protects back and maximizes posterior activation.'
            },
            {
              icon: 'flash',
              title: 'Drive elbows back, not out, when rowing.',
              description: 'Proper elbow path targets lats more effectively than rear delts.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'mixed',
          intensity_cost: 3,
        },
        {
          name: 'Row Swing Flow',
          duration: '14–15 min',
          description: 'Grip and back strength with flow style movements',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 10 KB Single-Arm Row (each side)\n• 10 KB Suitcase Deadlift (each side)\n• 10 KB Swing\nRest 60–75s after sequence',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "KB Single-Arm Row",
                    "reps": "10",
                    "tutorialSlug": "db_single_arm_row"
                  },
                  {
                    "name": "KB Suitcase Deadlift",
                    "reps": "10",
                    "tutorialSlug": "kb_suitcase_deadlift"
                  },
                  {
                    "name": "KB Swing",
                    "reps": "10",
                    "tutorialSlug": "kb_single_arm_swing"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s after sequence"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240555/mood_app/workout_images/s1nbakqw_download_7_.jpg',
          intensityReason: 'Combines rows, deadlifts, swings for endurance',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Snap hips for swings, don\'t squat them.',
              description: 'Hip hinge pattern generates power and protects lower back.'
            },
            {
              icon: 'body',
              title: 'Keep chest high in suitcase deadlift.',
              description: 'Maintain proud chest to avoid rounding and target glutes properly.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'mixed',
          intensity_cost: 3,
        },
        {
          name: 'Supported Kettlebell Rows',
          duration: '12–14 min',
          description: 'Single-arm rows emphasizing control and balance',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 10 KB Rows (each side)\nRest 60s per side',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "KB Rows",
                    "reps": "10"
                  }
                ],
                "rounds": 3,
                "rest": "60s per side"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240725/mood_app/workout_images/h1hdn33y_kb_cs_row.jpg',
          intensityReason: 'Supported setup builds foundation for heavier work',
          moodTips: [
            {
              icon: 'construct',
              title: 'Brace before pulling',
              description: 'Core tight keeps spine neutral.'
            },
            {
              icon: 'flash',
              title: 'Bell stays close',
              description: 'Elbow skims ribs on each rep.'
            },
            {
              icon: 'body',
              title: 'Feel lat stretch first',
              description: 'Controlled bottom position matters.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Suitcase Kettlebell Rows',
          duration: '12–14 min',
          description: 'Offset rows building stability and back control',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 8 Suitcase KB Rows (each side)\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Suitcase KB Rows",
                    "reps": "8"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240702/mood_app/workout_images/9hjdvg6i_kb_suitcase_row.jpg',
          intensityReason: 'Offset load builds core stability alongside back strength',
          moodTips: [
            {
              icon: 'construct',
              title: 'Resist the tilt',
              description: 'Stay tall despite uneven load.'
            },
            {
              icon: 'timer',
              title: 'Slow, smooth reps',
              description: 'Stability beats speed.'
            },
            {
              icon: 'body',
              title: 'Core assists the pull',
              description: 'Obliques should help brace.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Double Row + Suitcase',
          duration: '16–18 min',
          description: 'Double rows with suitcase pulls train grip/core',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 8 Double KB Row\nRest 75–90s after each set\n• 10 KB Suitcase Deadlift\nRest 75–90s after each set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Double KB Row",
                    "reps": "8",
                    "tutorialSlug": "kb_gorilla_rows"
                  },
                  {
                    "name": "KB Suitcase Deadlift",
                    "reps": "10",
                    "tutorialSlug": "kb_suitcase_deadlift"
                  }
                ],
                "rounds": 4,
                "rest": "75–90s after each set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240882/mood_app/workout_images/e9kn8lqs_download_5_.jpg',
          intensityReason: 'Heavier bilateral pulls build lats and posture within a circuit format',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Chest parallel to floor for full activation.',
              description: 'Proper rowing angle maximizes lat stretch and contraction range.'
            },
            {
              icon: 'flash',
              title: 'Suitcase pulls = anti-tilt stability focus.',
              description: 'Resist lateral flexion to build core strength and stability.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Gorilla Row Flow',
          duration: '16–18 min',
          description: 'Renegade, gorilla, high pulls for dense volume',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 8 Renegade Row (each side)\n• 8 Gorilla Row (each side)\n• 8 KB High Pull (each side)\nRest 90s after sequence',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Renegade Row",
                    "reps": "8",
                    "tutorialSlug": "db_renegade_rows"
                  },
                  {
                    "name": "Gorilla Row",
                    "reps": "8",
                    "tutorialSlug": "kb_gorilla_rows"
                  },
                  {
                    "name": "KB High Pull",
                    "reps": "8",
                    "tutorialSlug": "kb_high_pull"
                  }
                ],
                "rounds": 3,
                "rest": "90s after sequence"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240731/mood_app/workout_images/kc1es3oi_kb_gorilla_row.jpg',
          intensityReason: 'Combo flow hits lats, core, and traps together',
          moodTips: [
            {
              icon: 'construct',
              title: 'Brace core during renegade rows to stop hip twist.',
              description: 'Maintain plank position to maximize core engagement and stability.'
            },
            {
              icon: 'trending-up',
              title: 'Pull elbows high and wide in KB high pulls.',
              description: 'High elbow position targets upper traps and rear delts effectively.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'mixed',
          intensity_cost: 4,
        },
        {
          name: 'Double Kettlebell Rows',
          duration: '14–16 min',
          description: 'Bilateral rows for increased loading',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 8 Double KB Rows\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Double KB Rows",
                    "reps": "8",
                    "tutorialSlug": "kb_gorilla_rows"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240702/mood_app/workout_images/9hjdvg6i_kb_suitcase_row.jpg',
          intensityReason: 'Double bells increase loading capacity',
          moodTips: [
            {
              icon: 'construct',
              title: 'Hinge stays fixed',
              description: 'No torso rise between reps.'
            },
            {
              icon: 'flash',
              title: 'Drive elbows back',
              description: 'Bells track tight to body.'
            },
            {
              icon: 'body',
              title: 'Mid-back should thicken',
              description: 'Strong squeeze every rep.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Gorilla Rows',
          duration: '14–16 min',
          description: 'Alternating rows with constant tension',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 10 Gorilla Rows (each side)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Gorilla Rows",
                    "reps": "10",
                    "tutorialSlug": "kb_gorilla_rows"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240731/mood_app/workout_images/kc1es3oi_kb_gorilla_row.jpg',
          intensityReason: 'Alternating pattern maintains constant tension',
          moodTips: [
            {
              icon: 'construct',
              title: 'Hips stay level',
              description: 'No rotation side to side.'
            },
            {
              icon: 'timer',
              title: 'Quick switch, slow pull',
              description: 'Control each rep.'
            },
            {
              icon: 'flash',
              title: 'Alternate lat firing',
              description: 'One side lights up at a time.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Row Swing Dead',
          duration: '18–20 min',
          description: 'Balanced rotational pulls and hip hinge strength',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 8 Single-Arm Row (each side)\nRest 90s after set\n• 8 KB Swing\nRest 90s after set\n• 8 KB Deadlift\nRest 90s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Single-Arm Row",
                    "reps": "8",
                    "tutorialSlug": "db_single_arm_row"
                  },
                  {
                    "name": "KB Swing",
                    "reps": "8",
                    "tutorialSlug": "kb_single_arm_swing"
                  },
                  {
                    "name": "KB Deadlift",
                    "reps": "8"
                  }
                ],
                "rounds": 4,
                "rest": "90s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240556/mood_app/workout_images/s9jbh6k2_download_6_.jpg',
          intensityReason: 'Loaded volume builds strength and conditioning',
          moodTips: [
            {
              icon: 'flash',
              title: 'Stay explosive in swings.',
              description: 'Maintain power output throughout sets for maximum posterior development.'
            },
            {
              icon: 'construct',
              title: 'Row with control, don\'t twist torso.',
              description: 'Keep spine stable to isolate lats and prevent compensatory movement.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Snatch Clean Flow',
          duration: '20–22 min',
          description: 'Combo snatch, renegade, clean flow builds power',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 8 Renegade Row (alternating sides)\n• 8 KB Snatch (each side)\n• 8 KB Clean and Pull\nRest 90–120s after sequence',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Renegade Row",
                    "reps": "8",
                    "tutorialSlug": "db_renegade_rows"
                  },
                  {
                    "name": "KB Snatch",
                    "reps": "8",
                    "tutorialSlug": "kettlebell_snatch"
                  },
                  {
                    "name": "KB Clean and Pull",
                    "reps": "8",
                    "tutorialSlug": "kb_clean"
                  }
                ],
                "rounds": 4,
                "rest": "90–120s after sequence"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240904/mood_app/workout_images/qcfdfm3u_download_4_.jpg',
          intensityReason: 'Explosive circuit of pulls, cleans, and snatches',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Punch bell overhead on snatch to reduce impact.',
              description: 'Active lockout reduces joint stress and improves control.'
            },
            {
              icon: 'flash',
              title: 'Keep spine solid in cleans, power from hips.',
              description: 'Hip drive generates force while spine stability protects back.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Heavy Double Kettlebell Rows',
          duration: '16–18 min',
          description: 'Heavy bilateral rows for maximal overload',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 6 Double KB Rows\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Double KB Rows",
                    "reps": "6",
                    "tutorialSlug": "kb_gorilla_rows"
                  }
                ],
                "rounds": 4,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240702/mood_app/workout_images/9hjdvg6i_kb_suitcase_row.jpg',
          intensityReason: 'Heavy loads maximize strength development',
          moodTips: [
            {
              icon: 'construct',
              title: 'Load stays honest',
              description: 'Reduce weight if hinge breaks.'
            },
            {
              icon: 'flash',
              title: 'Explode then control',
              description: 'Power up, slow down.'
            },
            {
              icon: 'body',
              title: 'Straps encouraged',
              description: 'Grip shouldn\'t limit output.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Kettlebell Row Triple Drop',
          duration: '18–20 min',
          description: 'Extended triple-drop sets for deep fatigue',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 6 Rows\n• Row drop → 6\n• Row drop → 6\n• Row drop → 6\nRest 150s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Rows",
                    "reps": "6",
                    "note": "Drop → 6; Drop → 6; Drop → 6"
                  }
                ],
                "rounds": 3,
                "rest": "150s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240725/mood_app/workout_images/h1hdn33y_kb_cs_row.jpg',
          intensityReason: 'Triple drops maximize muscle fatigue and pump',
          moodTips: [
            {
              icon: 'flash',
              title: 'Three drops, no rest',
              description: 'Bells change fast.'
            },
            {
              icon: 'construct',
              title: 'Same elbow path',
              description: 'Don\'t cheat late reps.'
            },
            {
              icon: 'body',
              title: 'Chase lat pump',
              description: 'Deep burn under armpits.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'pump',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Roman chair',
    icon: 'analytics-outline',
    workouts: {
      beginner: [
        {
          name: 'Extensions + Hold',
          duration: '10–12 min',
          description: 'Bodyweight extensions paired with short static holds',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 12 Back Extensions\nRest 45–60s\n• 2 Roman Chair Holds (20s each)\nRest 60s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Back Extensions",
                    "reps": "12",
                    "tutorialSlug": "roman_chair_back_extension"
                  },
                  {
                    "name": "Roman Chair Holds",
                    "reps": "2"
                  }
                ],
                "rounds": 3,
                "rest": "45–60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240712/mood_app/workout_images/ck79gna3_back_ext.jpg',
          intensityReason: 'Introduces endurance and stability to lower back',
          moodTips: [
            {
              icon: 'body',
              title: 'Engage glutes/hamstrings to spare low back strain.',
              description: 'Posterior chain activation protects lumbar spine during extensions.'
            },
            {
              icon: 'construct',
              title: 'Keep chin tucked to maintain neutral posture.',
              description: 'Neutral neck alignment prevents cervical hyperextension.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'mixed',
          intensity_cost: 3,
        },
        {
          name: 'Twist & Hold Flow',
          duration: '12–14 min',
          description: 'Extension, twist, and short hold combo for endurance',
          battlePlan: 'Instructions: Holds are strict: locked position, no drifting.\n3 rounds\n• 10 Back Extensions\n• 10 Side-to-Side Twists (at top of extension)\n• 1 Roman Chair Hold (30s)\nRest 60–75s after sequence',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Back Extensions",
                    "reps": "10",
                    "tutorialSlug": "roman_chair_back_extension"
                  },
                  {
                    "name": "Side-to-Side Twists",
                    "reps": "10"
                  },
                  {
                    "name": "Roman Chair Hold",
                    "reps": "1"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s after sequence"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240559/mood_app/workout_images/uud5nxsk_download_11_.jpg',
          intensityReason: 'Adds light rotation and isometrics for core demands',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Turn from ribs, not shoulders, during twists.',
              description: 'Ribcage initiation creates safer rotational movement pattern.'
            },
            {
              icon: 'timer',
              title: 'Breathe steady during holds, don\'t "crank."',
              description: 'Controlled breathing maintains position without excessive strain.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'mixed',
          intensity_cost: 3,
        },
        {
          name: 'Tempo Extensions',
          duration: '10–12 min',
          description: 'Slow tempo extensions emphasizing controlled spinal motion',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n3 rounds\n• 10 Back Extensions (3s eccentric)\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Back Extensions",
                    "reps": "10",
                    "tutorialSlug": "roman_chair_back_extension"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240723/mood_app/workout_images/gafcn4c8_rc_back_ext_3.jpg',
          intensityReason: 'Controlled tempo builds strength without excessive load',
          moodTips: [
            {
              icon: 'timer',
              title: 'Own the eccentric',
              description: 'Lower for a full 3 seconds every rep.'
            },
            {
              icon: 'construct',
              title: 'Stay in tension',
              description: 'Stop just before full lockout to keep load on the back.'
            },
            {
              icon: 'body',
              title: 'Drive with glutes',
              description: 'Feel glutes/hamstrings initiate so low back doesn\'t take over.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Partial Extension Burn',
          duration: '10–12 min',
          description: 'Short-range extensions to build endurance safely',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 20 Partial Back Extensions\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Partial Back Extensions",
                    "reps": "20",
                    "tutorialSlug": "roman_chair_back_extension"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240712/mood_app/workout_images/ck79gna3_back_ext.jpg',
          intensityReason: 'Partial range builds endurance without overextension',
          moodTips: [
            {
              icon: 'construct',
              title: 'Top-half only',
              description: 'Work the upper half where you can stay strict.'
            },
            {
              icon: 'flash',
              title: 'No momentum',
              description: 'Smooth continuous reps instead of swinging.'
            },
            {
              icon: 'body',
              title: 'Feel erectors working',
              description: 'You should feel a tight "brace" through low back, not a hinge snap.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'pump',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Weighted Ext',
          duration: '14–16 min',
          description: 'Weighted extensions and basic hyperextensions for mass',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 10 Weighted Back Extensions\nRest 75s after set\n• 10 Roman Chair Hyperextensions\nRest 75s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Weighted Back Extensions",
                    "reps": "10",
                    "tutorialSlug": "roman_chair_weighted_back_extension"
                  },
                  {
                    "name": "Roman Chair Hyperextensions",
                    "reps": "10"
                  }
                ],
                "rounds": 4,
                "rest": "75s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240546/mood_app/workout_images/8tyq8yxs_download_10_.jpg',
          intensityReason: 'External load strengthens spinal erectors safely',
          moodTips: [
            {
              icon: 'construct',
              title: 'Hug plate close to stomach/chest.',
              description: 'Keeping weight close maintains balance and control during movement.'
            },
            {
              icon: 'timer',
              title: 'Lower slowly, 2–3s, for stronger gains.',
              description: 'Controlled eccentric phase maximizes strength development.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Extension Circuit',
          duration: '14–16 min',
          description: 'Blends extension, superman, side bends for variety',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 8 Back Extensions\n• 8 Alternating Superman (1 arm + opposite leg)\n• 8 Side Bends (each side)\nRest 90s after sequence',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Back Extensions",
                    "reps": "8",
                    "tutorialSlug": "roman_chair_back_extension"
                  },
                  {
                    "name": "Alternating Superman",
                    "reps": "8"
                  },
                  {
                    "name": "Side Bends",
                    "reps": "8",
                    "tutorialSlug": "roman_chair_side_bend"
                  }
                ],
                "rounds": 3,
                "rest": "90s after sequence"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240559/mood_app/workout_images/uud5nxsk_download_11_.jpg',
          intensityReason: 'Mix of dynamic posterior moves challenges control',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Lift opposite arm/leg smoothly in superman.',
              description: 'Coordinated contralateral movement improves stability and strength.'
            },
            {
              icon: 'flash',
              title: 'Don\'t rush side bends; full ROM and squeeze.',
              description: 'Complete range of motion with peak contraction maximizes benefits.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Pause Extensions',
          duration: '14–16 min',
          description: 'Paused reps reinforce control and mid-range strength',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n4 rounds\n• 8 Back Extensions (2s pause)\nRest 75–90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Back Extensions",
                    "reps": "8",
                    "tutorialSlug": "roman_chair_back_extension"
                  }
                ],
                "rounds": 4,
                "rest": "75–90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240723/mood_app/workout_images/gafcn4c8_rc_back_ext_3.jpg',
          intensityReason: 'Paused reps eliminate momentum and build control',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause at peak',
              description: 'Hold 2 seconds at the top of every rep.'
            },
            {
              icon: 'construct',
              title: 'Brace before lowering',
              description: 'Lock ribs down so spine stays neutral.'
            },
            {
              icon: 'body',
              title: 'Peak form looks flat',
              description: 'Torso reaches parallel with glutes tight, no overextension.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Extension Drop Set',
          duration: '14–16 min',
          description: 'Mechanical fatigue using fast load reductions',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 8 Weighted Extensions\n• Drop → 8 reps\n• Drop → 8 reps\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Weighted Extensions",
                    "reps": "8",
                    "tutorialSlug": "roman_chair_weighted_back_extension",
                    "note": "Drop → 8 reps; Drop → 8 reps"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240559/mood_app/workout_images/uud5nxsk_download_11_.jpg',
          intensityReason: 'Drop sets extend time under tension past failure',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drops are immediate',
              description: 'Reduce weight fast without leaving the station.'
            },
            {
              icon: 'construct',
              title: 'Drop amount stays clean',
              description: 'Aim ~25% reduction each drop to keep reps smooth.'
            },
            {
              icon: 'timer',
              title: 'Keep ROM identical',
              description: 'Same depth and same top position through all drops.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'pump',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Weighted Twist',
          duration: '16–18 min',
          description: 'Weighted extensions with twist patterns for obliques',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 10 Weighted Back Extensions\nRest 90s after set\n• 10 Roman Chair Hyperextensions\nRest 90s after set\n• 10 Roman Chair Twists\nRest 90s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Weighted Back Extensions",
                    "reps": "10",
                    "tutorialSlug": "roman_chair_weighted_back_extension"
                  },
                  {
                    "name": "Roman Chair Hyperextensions",
                    "reps": "10"
                  },
                  {
                    "name": "Roman Chair Twists",
                    "reps": "10"
                  }
                ],
                "rounds": 4,
                "rest": "90s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240546/mood_app/workout_images/8tyq8yxs_download_10_.jpg',
          intensityReason: 'Adds load and rotation for advanced spinal strength',
          moodTips: [
            {
              icon: 'construct',
              title: 'Keep ribcage engaged, don\'t torque spine.',
              description: 'Core stability prevents excessive spinal rotation under load.'
            },
            {
              icon: 'flash',
              title: 'Brace core before rotating under load.',
              description: 'Pre-bracing creates safe foundation for rotational movements.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Superman + Iso Hold',
          duration: '18–20 min',
          description: 'Superman lifts plus holds improve stability capacity',
          battlePlan: 'Instructions: Holds are strict: locked position, no drifting.\n4 rounds\n• 8 Weighted Back Extensions\n• 8 Alternating Supermans\n• 1 Roman Chair Hold (20–30s)\nRest 90–120s after sequence',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Weighted Back Extensions",
                    "reps": "8",
                    "tutorialSlug": "roman_chair_weighted_back_extension"
                  },
                  {
                    "name": "Alternating Supermans",
                    "reps": "8"
                  },
                  {
                    "name": "Roman Chair Hold",
                    "reps": "1"
                  }
                ],
                "rounds": 4,
                "rest": "90–120s after sequence"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240559/mood_app/workout_images/uud5nxsk_download_11_.jpg',
          intensityReason: 'Extended isometrics + dynamic raises build max control',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Keep limbs only slightly above parallel, not over-extended.',
              description: 'Moderate range prevents hyperextension while maintaining effectiveness.'
            },
            {
              icon: 'timer',
              title: 'Squeeze glutes during 20s hold to protect spine.',
              description: 'Glute activation provides spinal stability during isometric holds.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Heavy Eccentric Extensions',
          duration: '18–20 min',
          description: 'Overloaded eccentrics to build posterior strength',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n4 rounds\n• 6 Weighted Extensions (4s eccentric)\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Weighted Extensions",
                    "reps": "6",
                    "tutorialSlug": "roman_chair_weighted_back_extension"
                  }
                ],
                "rounds": 4,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240695/mood_app/workout_images/3z6b1lhy_roman_chair_weighted_ext.jpg',
          intensityReason: 'Extended eccentrics maximize strength development',
          moodTips: [
            {
              icon: 'timer',
              title: 'Lower slower than you lift',
              description: 'Lift controlled, lower for 4 seconds.'
            },
            {
              icon: 'construct',
              title: 'Cut sets before breakdown',
              description: 'If tempo slips or hips snap, end the set.'
            },
            {
              icon: 'flash',
              title: 'Chase tension, not ego',
              description: 'Use straps/assistance if needed so back stays the limiter.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hyperextension',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Extension Iso Burnout',
          duration: '18–20 min',
          description: 'Dynamic reps finished with a long isometric hold',
          battlePlan: 'Instructions: Supersets are back-to-back — no rest until the pair is done. holds are strict: locked position, no drifting.\n3 rounds\n• 10 Weighted Extensions\n• Immediately 30s Roman Chair Hold\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Weighted Extensions",
                    "reps": "10",
                    "tutorialSlug": "roman_chair_weighted_back_extension",
                    "note": "Immediately 30s Roman Chair Hold"
                  }
                ],
                "rounds": 3,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240723/mood_app/workout_images/gafcn4c8_rc_back_ext_3.jpg',
          intensityReason: 'Combines dynamic movement with isometric endurance',
          moodTips: [
            {
              icon: 'construct',
              title: 'Hold in neutral',
              description: 'Lock torso near parallel without overextending.'
            },
            {
              icon: 'body',
              title: 'Squeeze glutes hard',
              description: 'Protects spine and stabilizes the hold.'
            },
            {
              icon: 'flash',
              title: 'Peak contraction is rigid',
              description: 'You should feel full-body bracing with zero swinging.'
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
    equipment: 'T bar row machine',
    icon: 'add-outline',
    workouts: {
      beginner: [
        {
          name: 'Neutral Grip Row',
          duration: '10–12 min',
          description: 'Simple neutral rowing pattern for beginners to build back thickness.',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 12 Neutral Grip T-Bar Row\nRest 60–75s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Neutral Grip T-Bar Row",
                    "reps": "12",
                    "tutorialSlug": "neutral_grip_t_bar_chest_supported_row"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240550/mood_app/workout_images/figwdo7y_download_17_.jpg',
          intensityReason: 'Neutral grip builds confidence & lat line strength',
          moodTips: [
            {
              icon: 'construct',
              title: 'Keep chest against pad, no hip driving.',
              description: 'Chest support isolates lats and prevents momentum cheating.'
            },
            {
              icon: 'flash',
              title: 'Pull elbows straight back, not out.',
              description: 'Proper elbow path targets lats more effectively than rear delts.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Wide Grip Row',
          duration: '10–12 min',
          description: 'Wide row variation for upper-back foundation',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 10 Wide Grip T-Bar Row\nRest 60–75s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Wide Grip T-Bar Row",
                    "reps": "10",
                    "tutorialSlug": "wide_grip_t_bar_chest_supported_row"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240561/mood_app/workout_images/xdrugsxs_tr.jpg',
          intensityReason: 'Wide grip shifts load to traps/rhomboids for posture',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Pull chest high into pad during contraction.',
              description: 'Active chest engagement maximizes upper back activation.'
            },
            {
              icon: 'body',
              title: 'Avoid shrugging shoulders during pull.',
              description: 'Keep shoulders down and back to isolate target muscles.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Tempo T-Bar Rows',
          duration: '10–12 min',
          description: 'Controlled T-bar rows emphasizing slow negatives',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n3 rounds\n• 12 Neutral Grip T-Bar Rows (3s eccentric)\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Neutral Grip T-Bar Rows",
                    "reps": "12",
                    "tutorialSlug": "neutral_grip_t_bar_chest_supported_row"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240755/mood_app/workout_images/zwx4bge7_t_bar_row_2.jpg',
          intensityReason: 'Tempo work builds control and mind-muscle connection',
          moodTips: [
            {
              icon: 'timer',
              title: 'Slow on the way down',
              description: 'Lower for a full 3 seconds each rep.'
            },
            {
              icon: 'construct',
              title: 'Chest stays pinned',
              description: 'No hip drive or torso lift.'
            },
            {
              icon: 'flash',
              title: 'Feel mid-back tighten',
              description: 'Think squeezing shoulder blades together.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Peak Pause Rows',
          duration: '10–12 min',
          description: 'Paused rows reinforcing contraction awareness',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n3 rounds\n• 10 Wide Grip T-Bar Rows (2s pause)\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Wide Grip T-Bar Rows",
                    "reps": "10",
                    "tutorialSlug": "wide_grip_t_bar_chest_supported_row"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240696/mood_app/workout_images/64wlxchh_t_bar_row.jpg',
          intensityReason: 'Paused reps reinforce peak contraction',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause every rep',
              description: 'Hold 1–2s at full contraction.'
            },
            {
              icon: 'construct',
              title: 'Smooth return',
              description: 'Control back to stretch, no drop.'
            },
            {
              icon: 'flash',
              title: 'Peak form feels compact',
              description: 'Elbows tight, chest tall, no shrug.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'strength',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Close Grip Row',
          duration: '12–14 min',
          description: 'Simple close grip with moderate-to-heavy focus',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 10 Close Grip T-Bar Row\nRest 75s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Close Grip T-Bar Row",
                    "reps": "10"
                  }
                ],
                "rounds": 4,
                "rest": "75s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240550/mood_app/workout_images/figwdo7y_download_17_.jpg',
          intensityReason: 'Close grip overloads lats with higher load capacity',
          moodTips: [
            {
              icon: 'construct',
              title: 'Brace core, avoid torso swing.',
              description: 'Core stability prevents momentum and isolates target muscles.'
            },
            {
              icon: 'flash',
              title: 'Drive elbows low, past hip line.',
              description: 'Deep elbow drive maximizes lat contraction and range.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Slow Neg Row',
          duration: '12–14 min',
          description: 'Time-under-tension row progression provides a challenging switchup',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n4 rounds\n• 8 Neutral Grip Row (3–4s eccentric)\nRest 90s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Neutral Grip Row",
                    "reps": "8",
                    "tutorialSlug": "neutral_grip_t_bar_chest_supported_row"
                  }
                ],
                "rounds": 4,
                "rest": "90s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240561/mood_app/workout_images/xdrugsxs_tr.jpg',
          intensityReason: '3–4s eccentric tempo increases hypertrophy effect',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Explode to chest, lower slow & steady.',
              description: 'Fast concentric, slow eccentric maximizes muscle stimulus.'
            },
            {
              icon: 'timer',
              title: 'Keep weight lighter to maintain control.',
              description: 'Reduced load allows proper tempo execution and form.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'T-Bar Drop Set',
          duration: '14–16 min',
          description: 'Heavy rows extended with rapid load reductions',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 8 T-Bar Rows\n• Drop → 8 reps\n• Drop → 8 reps\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "T-Bar Rows",
                    "reps": "8",
                    "tutorialSlug": "t-bar_row_machine",
                    "note": "Drop → 8 reps; Drop → 8 reps"
                  }
                ],
                "rounds": 3,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240755/mood_app/workout_images/zwx4bge7_t_bar_row_2.jpg',
          intensityReason: 'Drop sets extend time under tension beyond failure',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drops are immediate',
              description: 'Strip weight quickly, stay in position.'
            },
            {
              icon: 'construct',
              title: 'Drop amount stays moderate',
              description: 'Reduce ~25% to keep reps strict.'
            },
            {
              icon: 'body',
              title: 'Straps encouraged here',
              description: 'Keep lats as the limiting factor.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'pump',
          intensity_cost: 4,
        },
        {
          name: 'Iso-Finish Rows',
          duration: '14–16 min',
          description: 'Standard rows finished with long isometric holds',
          battlePlan: 'Instructions: Holds are strict: locked position, no drifting.\n4 rounds\n• 8 T-Bar Rows\n• Finish with 10s hold\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "T-Bar Rows",
                    "reps": "8",
                    "tutorialSlug": "t-bar_row_machine",
                    "note": "Finish with 10s hold"
                  }
                ],
                "rounds": 4,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240696/mood_app/workout_images/64wlxchh_t_bar_row.jpg',
          intensityReason: 'Isometric finisher maximizes time under tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Hold the last rep',
              description: 'Lock elbows back for 10 seconds.'
            },
            {
              icon: 'construct',
              title: 'No shoulder shrug',
              description: 'Keep traps quiet, squeeze mid-back.'
            },
            {
              icon: 'flash',
              title: 'Peak contraction should burn',
              description: 'That deep mid-back cramp is the goal.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Iso Wide Rows',
          duration: '14–16 min',
          description: 'Wide grip rows with static squeeze finish to bring muscles to full fatigue',
          battlePlan: 'Instructions: Holds are strict: locked position, no drifting.\n4 rounds\n• 8 Wide Grip T-Bar Row\nThen end each set with 10s static hold at full contraction\nRest 90–120s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Wide Grip T-Bar Row",
                    "reps": "8",
                    "tutorialSlug": "wide_grip_t_bar_chest_supported_row"
                  },
                  {
                    "name": "End each set with 10s static hold at full contraction"
                  }
                ],
                "rounds": 4,
                "rest": "90–120s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240550/mood_app/workout_images/figwdo7y_download_17_.jpg',
          intensityReason: 'Isometric holds create intense contraction stress',
          moodTips: [
            {
              icon: 'construct',
              title: 'Hold elbows back & chest tall in iso.',
              description: 'Maintain peak contraction position throughout hold duration.'
            },
            {
              icon: 'flash',
              title: 'Aim for smooth squeeze across mid-back.',
              description: 'Focus on scapular retraction and mid-trap engagement.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Combo Superset',
          duration: '16–18 min',
          description: 'Wide-to-underhand superset with scap squeezes',
          battlePlan: 'Instructions: Supersets are back-to-back — no rest until the pair is done.\n4 rounds\n• 8 Wide Grip Row\n• 8 Underhand Grip Row — immediately, no rest\n• Finish with 10 Back Squeezes (bodyweight, no load)\nRest 120s after full superset',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Wide Grip Row",
                    "reps": "8",
                    "tutorialSlug": "wide_grip_t_bar_chest_supported_row",
                    "note": "Immediately 8 Underhand Grip Row; Finish with 10 Back Squeezes (bodyweight, no load)"
                  }
                ],
                "rounds": 4,
                "rest": "120s after full superset"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240561/mood_app/workout_images/xdrugsxs_tr.jpg',
          intensityReason: 'Pairing grips + post-set contractions maximizes fatigue',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Moderate weight, strict form for both grips.',
              description: 'Controlled loads allow proper execution of superset protocol.'
            },
            {
              icon: 'refresh',
              title: 'Squeezes: think small, controlled scap retractions.',
              description: 'Bodyweight squeezes enhance muscle activation and recovery.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Heavy Tempo Rows',
          duration: '16–18 min',
          description: 'Heavy T-bar rows with long controlled eccentrics',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n4 rounds\n• 6 T-Bar Rows (4s eccentric)\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "T-Bar Rows",
                    "reps": "6",
                    "tutorialSlug": "t-bar_row_machine"
                  }
                ],
                "rounds": 4,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240755/mood_app/workout_images/zwx4bge7_t_bar_row_2.jpg',
          intensityReason: 'Extended eccentrics maximize strength and hypertrophy',
          moodTips: [
            {
              icon: 'construct',
              title: 'Weight stays honest',
              description: 'Reduce load if tempo breaks.'
            },
            {
              icon: 'timer',
              title: 'Explode up, slow down',
              description: '4s eccentric on every rep.'
            },
            {
              icon: 'body',
              title: 'Straps are acceptable',
              description: 'Prioritize back overload over grip.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Triple Drop Grinder',
          duration: '18–20 min',
          description: 'Extended triple-drop sets for maximal fatigue',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 6 Rows\n• Grinder drop → 6\n• Grinder drop → 6\n• Grinder drop → 6\nRest 150s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Rows",
                    "reps": "6",
                    "note": "Drop → 6; Drop → 6; Drop → 6"
                  }
                ],
                "rounds": 3,
                "rest": "150s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240696/mood_app/workout_images/64wlxchh_t_bar_row.jpg',
          intensityReason: 'Triple drops maximize muscle fatigue and pump',
          moodTips: [
            {
              icon: 'flash',
              title: 'Three drops, no rest',
              description: 'Strip plates fast and keep moving.'
            },
            {
              icon: 'construct',
              title: 'Same pull path every drop',
              description: 'Elbows drive low and back.'
            },
            {
              icon: 'body',
              title: 'Chase deep fatigue',
              description: 'You should feel lats throb, not arms.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'pump',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Powerlifting Platform',
    icon: 'barbell-outline',
    workouts: {
      beginner: [
        {
          name: 'Dead + Row',
          duration: '14–16 min',
          description: 'Deadlifts and rows for beginner back foundation',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 10 Barbell Deadlift\nRest 60–75s\n• 10 Barbell Bent-Over Row\nRest 60–75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Barbell Deadlift",
                    "reps": "10",
                    "tutorialSlug": "barbell_deadlift"
                  },
                  {
                    "name": "Barbell Bent-Over Row",
                    "reps": "10",
                    "tutorialSlug": "barbell_row"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s"
              }
            ]
          },
          imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHwxfHxlbGxpcHRpY2FsJTIwd29ya291dHxlbnwxfHx8fDE3NTY4ODMyMjN8MA&ixlib=rb-4.1.0&q=85',
          intensityReason: 'Intro hinge + pull to teach proper barbell basics',
          moodTips: [
            {
              icon: 'construct',
              title: 'Hinge, don\'t squat, on deadlifts.',
              description: 'Hip hinge pattern targets posterior chain effectively.'
            },
            {
              icon: 'flash',
              title: 'Lats tight on rows to build pulling base.',
              description: 'Lat engagement improves pulling strength and spinal stability.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'deadlift',
          training_style: 'mixed',
          intensity_cost: 3,
        },
        {
          name: 'Dead Row Shrug',
          duration: '14–16 min',
          description: 'Deads, rows, shrugs train erectors and upper traps',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 10 Barbell Deadlift\n• 10 Barbell Bent-Over Row\n• 10 Barbell Power Shrug\nRest 75s after sequence',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Barbell Deadlift",
                    "reps": "10",
                    "tutorialSlug": "barbell_deadlift"
                  },
                  {
                    "name": "Barbell Bent-Over Row",
                    "reps": "10",
                    "tutorialSlug": "barbell_row"
                  },
                  {
                    "name": "Barbell Power Shrug",
                    "reps": "10"
                  }
                ],
                "rounds": 3,
                "rest": "75s after sequence"
              }
            ]
          },
          imageUrl: 'https://images.unsplash.com/photo-1590847330116-ea94fb93eac3?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw0fHxydW5uaW5nJTIwZXhlcmNpc2V8ZW58MHx8fHwxNzU2ODgzMjMxfDA&ixlib=rb-4.1.0&q=85',
          intensityReason: 'Adds shrug finish for trap-dominant overload',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Explode hips in dead, pause with bar tight to legs.',
              description: 'Hip drive generates power while maintaining bar path control.'
            },
            {
              icon: 'timer',
              title: 'Shrugs: no bounce, pause 1 count at top.',
              description: 'Controlled shrugs with pause maximize trap activation.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'deadlift',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'RDL + Pendlay',
          duration: '16–18 min',
          description: 'Romanian deadlifts with Pendlay rows for balance',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 8 Romanian Deadlift\nRest 75–90s\n• 10 Pendlay Row\nRest 75–90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Romanian Deadlift",
                    "reps": "8",
                    "tutorialSlug": "smith_machine_rdl"
                  },
                  {
                    "name": "Pendlay Row",
                    "reps": "10",
                    "tutorialSlug": "barbell_row"
                  }
                ],
                "rounds": 4,
                "rest": "75–90s"
              }
            ]
          },
          imageUrl: 'https://images.pexels.com/photos/6551174/pexels-photo-6551174.jpeg',
          intensityReason: 'Posterior strength + explosive pull development',
          moodTips: [
            {
              icon: 'timer',
              title: 'Go slow with RDL to maximize hamstring loading.',
              description: 'Controlled tempo increases hamstring and glute activation.'
            },
            {
              icon: 'refresh',
              title: 'Reset bar dead-stop every time in Pendlay.',
              description: 'Dead stop allows full lat engagement each rep.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'deadlift',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Pull Combo',
          duration: '16–18 min',
          description: 'Deadlifts plus Olympic pulls for hybrid training',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 8 Barbell Deadlift\n• 8 Barbell High Pull\n• 8 Barbell Clean Pull\nRest 90s after sequence',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Barbell Deadlift",
                    "reps": "8",
                    "tutorialSlug": "barbell_deadlift"
                  },
                  {
                    "name": "Barbell High Pull",
                    "reps": "8",
                    "tutorialSlug": "kb_high_pull"
                  },
                  {
                    "name": "Barbell Clean Pull",
                    "reps": "8",
                    "tutorialSlug": "kb_clean"
                  }
                ],
                "rounds": 3,
                "rest": "90s after sequence"
              }
            ]
          },
          imageUrl: 'https://images.unsplash.com/photo-1599058917212-d750089bc07e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHxmaXRuZXNzJTIwdHJhaW5pbmc&ZW54MHx8fHwxNzU2ODgzMjM3fDA&ixlib=rb-4.1.0&q=85',
          intensityReason: 'Add high pulls + clean pulls to boost explosiveness',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Hips and legs drive bar, elbows guide.',
              description: 'Lower body power generation with upper body guidance.'
            },
            {
              icon: 'construct',
              title: 'Keep tight core, don\'t overextend at top.',
              description: 'Core stability prevents hyperextension during pulls.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'deadlift',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Dead Row Shrug',
          duration: '18–20 min',
          description: 'Heavy hinge, row, shrug focus for dense back work',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 8 Barbell Deadlift\nRest 90s\n• 8 Barbell Bent-Over Row\nRest 90s\n• 8 Power Shrug\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Barbell Deadlift",
                    "reps": "8",
                    "tutorialSlug": "barbell_deadlift"
                  },
                  {
                    "name": "Barbell Bent-Over Row",
                    "reps": "8",
                    "tutorialSlug": "barbell_row"
                  },
                  {
                    "name": "Power Shrug",
                    "reps": "8"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1ODF8MHwxfHNlYXJjaHw0fHxjYXJkaW8lMjB3b3Jrb3V0fGVufDF8fHx8MVc1Nijg4MzIyM3ww&ixlib=rb-4.1.0&q=85',
          intensityReason: 'Adds volume with heavy compound barbell pulls',
          moodTips: [
            {
              icon: 'construct',
              title: 'Belt useful here for safe bracing.',
              description: 'Lifting belt provides additional core support for heavy loads.'
            },
            {
              icon: 'flash',
              title: 'Pull bar into thighs at shrug peak.',
              description: 'Bar contact maximizes trap activation and stability.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'deadlift',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Dead Clean Flow',
          duration: '20–22 min',
          description: 'Heavy compound pulls with clean finish',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 8 Barbell Deadlift\n• 8 Barbell High Pull\n• 8 Barbell Power Clean\nRest 90–120s after sequence',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Barbell Deadlift",
                    "reps": "8",
                    "tutorialSlug": "barbell_deadlift"
                  },
                  {
                    "name": "Barbell High Pull",
                    "reps": "8",
                    "tutorialSlug": "kb_high_pull"
                  },
                  {
                    "name": "Barbell Power Clean",
                    "reps": "8",
                    "tutorialSlug": "power_clean"
                  }
                ],
                "rounds": 4,
                "rest": "90–120s after sequence"
              }
            ]
          },
          imageUrl: 'https://images.unsplash.com/photo-1571019613242-c5c5dee9f50b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHw5fHxyaW5nfGVufDB8fHx8TVc1MzA5MTY0M3ww&ixlib=rb-4.1.0&q=85',
          intensityReason: 'Olympic-style lifts tie power explosiveness to back',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Explode hips, bar close on clean.',
              description: 'Hip explosion with tight bar path for clean efficiency.'
            },
            {
              icon: 'refresh',
              title: 'Keep arms relaxed until pull finish.',
              description: 'Delayed arm pull maximizes lower body power contribution.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'deadlift',
          training_style: 'mixed',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Seated cable machine',
    icon: 'accessibility-outline',
    workouts: {
      beginner: [
        {
          name: 'Neutral Row Start',
          duration: '10–12 min',
          description: 'Single movement to master seated row mechanics',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 12 Neutral Grip Cable Row\nRest 60–75s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Neutral Grip Cable Row",
                    "reps": "12"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240705/mood_app/workout_images/9zff190v_scr.jpg',
          intensityReason: 'Neutral grip anchor builds confidence + control',
          moodTips: [
            {
              icon: 'construct',
              title: 'Sit tall, chest steady, no torso rocking.',
              description: 'Stable posture isolates target muscles and prevents momentum.'
            },
            {
              icon: 'timer',
              title: 'Pull elbows near ribs, pause each rep.',
              description: 'Controlled movement with pause maximizes muscle activation.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Wide Row Intro',
          duration: '10–12 min',
          description: 'Focuses on wide row control & back width for beginners',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 10 Wide Grip Cable Row\nRest 60–75s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Wide Grip Cable Row",
                    "reps": "10"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240889/mood_app/workout_images/gdb1l44p_wgr.jpg',
          intensityReason: 'Wide grip recruits upper back posture muscles',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Elbows flare naturally but keep chest upright.',
              description: 'Natural elbow path with stable torso for optimal activation.'
            },
            {
              icon: 'body',
              title: 'Pull to sternum level, no lower.',
              description: 'Proper pull height maximizes upper back engagement.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Tempo Neutral Rows',
          duration: '10–12 min',
          description: 'Neutral cable rows emphasizing smooth control',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n3 rounds\n• 12 Neutral Grip Cable Rows (3s eccentric)\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Tempo Neutral Rows",
                    "reps": "12",
                    "tutorialSlug": "neutral_grip_t_bar_chest_supported_row"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240544/mood_app/workout_images/7hcpy4r7_download_12_.jpg',
          intensityReason: 'Tempo work builds control and mind-muscle connection',
          moodTips: [
            {
              icon: 'timer',
              title: 'Slow negatives matter',
              description: 'Lower handle for 3 seconds.'
            },
            {
              icon: 'construct',
              title: 'Torso stays tall',
              description: 'No rocking or leaning back.'
            },
            {
              icon: 'flash',
              title: 'Feel lats stretch',
              description: 'Control the return fully.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Pause & Squeeze Rows',
          duration: '10–12 min',
          description: 'Paused rows to reinforce contraction',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n3 rounds\n• 10 Wide Grip Cable Rows (2s pause)\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Wide Grip Cable Rows",
                    "reps": "10"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240751/mood_app/workout_images/y3q3wbcv_seated_cable_row.jpg',
          intensityReason: 'Paused reps reinforce peak contraction awareness',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause every rep',
              description: 'Hold 2s at chest.'
            },
            {
              icon: 'construct',
              title: 'Keep stack floating',
              description: 'Don\'t let weight touch down.'
            },
            {
              icon: 'flash',
              title: 'Mid-back should light up',
              description: 'Think shoulder blades pinching.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'strength',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Underhand Row',
          duration: '12–14 min',
          description: 'Control-focused row variation with palms up to target lower lats and scaps.',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 10 Underhand Grip Cable Row\nRest 75s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Underhand Grip Cable Row",
                    "reps": "10"
                  }
                ],
                "rounds": 4,
                "rest": "75s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240860/mood_app/workout_images/4jf014no_rgr.jpg',
          intensityReason: 'Underhand row shifts focus to lower lats & biceps',
          moodTips: [
            {
              icon: 'construct',
              title: 'Keep wrists straight, elbows tight to body.',
              description: 'Proper wrist alignment and elbow path optimize muscle targeting.'
            },
            {
              icon: 'timer',
              title: 'Hold 1s at contraction for stronger squeeze.',
              description: 'Pause at peak contraction enhances muscle activation.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Slow Negatives',
          duration: '12–14 min',
          description: 'Single movement with emphasized negative control',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n4 rounds\n• 8 Neutral Grip Cable Row (3–4s eccentric each rep)\nRest 90s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Neutral Grip Cable Row",
                    "reps": "8"
                  }
                ],
                "rounds": 4,
                "rest": "90s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240545/mood_app/workout_images/83ut7zg6_download_13_.jpg',
          intensityReason: 'Extended 3–4s eccentrics boost hypertrophy',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Pull powerfully, but lower slow and steady.',
              description: 'Fast concentric with controlled eccentric maximizes stimulus.'
            },
            {
              icon: 'construct',
              title: 'Brace abs so spine stays neutral.',
              description: 'Core engagement maintains proper spinal alignment.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Cable Row Drop Set',
          duration: '14–16 min',
          description: 'Mechanical fatigue using quick pin drops',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 8 Cable Rows\n• Drop → 8 reps\n• Drop → 8 reps\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Cable Rows",
                    "reps": "8",
                    "tutorialSlug": "cable_rope_row",
                    "note": "Drop → 8 reps; Drop → 8 reps"
                  }
                ],
                "rounds": 3,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240705/mood_app/workout_images/9zff190v_scr.jpg',
          intensityReason: 'Drop sets extend time under tension beyond failure',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drops are instant',
              description: 'Change pin fast, no standing.'
            },
            {
              icon: 'construct',
              title: 'Drop size stays controlled',
              description: '~20–30% each reduction.'
            },
            {
              icon: 'body',
              title: 'Straps welcome',
              description: 'Keep grip from limiting volume.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'pump',
          intensity_cost: 4,
        },
        {
          name: 'Iso-Hold Cable Rows',
          duration: '14–16 min',
          description: 'Rows with extended static holds',
          battlePlan: 'Instructions: Holds are strict: locked position, no drifting.\n4 rounds\n• 8 Cable Rows\n• Finish with 12s hold\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Cable Rows",
                    "reps": "8",
                    "tutorialSlug": "cable_rope_row",
                    "note": "Finish with 12s hold"
                  }
                ],
                "rounds": 4,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240751/mood_app/workout_images/y3q3wbcv_seated_cable_row.jpg',
          intensityReason: 'Isometric finisher maximizes time under tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Hold after final rep',
              description: 'Lock in contraction for 12 seconds.'
            },
            {
              icon: 'construct',
              title: 'Chest stays proud',
              description: 'Avoid rounding during hold.'
            },
            {
              icon: 'flash',
              title: 'Peak form feels compressed',
              description: 'Tight squeeze between shoulder blades.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Iso Hold Rows',
          duration: '14–16 min',
          description: 'Rows with a final long hold at contraction to fully fatigue muscles.',
          battlePlan: 'Instructions: Holds are strict: locked position, no drifting.\n4 rounds\n• 8 Wide Grip Row\nThen end each set with 10s hold at contraction\nRest 90–120s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Wide Grip Row",
                    "reps": "8",
                    "tutorialSlug": "wide_grip_t_bar_chest_supported_row"
                  },
                  {
                    "name": "End each set with 10s hold at contraction"
                  }
                ],
                "rounds": 4,
                "rest": "90–120s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240544/mood_app/workout_images/7hcpy4r7_download_12_.jpg',
          intensityReason: 'Isometric finish after working sets increases time under tension',
          moodTips: [
            {
              icon: 'flash',
              title: 'Crush shoulder blades tight in hold.',
              description: 'Maximum scapular retraction during isometric phase.'
            },
            {
              icon: 'trending-up',
              title: 'Think "chest proud" during static phase.',
              description: 'Proud chest position maintains optimal muscle activation.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Superset Grind',
          duration: '16–18 min',
          description: 'Wide-to-underhand superset with post-set squeezes',
          battlePlan: 'Instructions: Supersets are back-to-back — no rest until the pair is done.\n4 rounds\n• 8 Wide Grip Row (controlled)\n• 8 Underhand Grip Row — immediately, no rest\n• Finish with 10 Standing Back Squeezes (bodyweight scapular retractions, no load)\nRest 120s after full superset',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Wide Grip Row",
                    "reps": "8",
                    "tutorialSlug": "wide_grip_t_bar_chest_supported_row",
                    "note": "Immediately 8 Underhand Grip Row; Finish with 10 Standing Back Squeezes (bodyweight scapular retractions, no load)"
                  }
                ],
                "rounds": 4,
                "rest": "120s after full superset"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240889/mood_app/workout_images/gdb1l44p_wgr.jpg',
          intensityReason: 'Combo of two grips + contractions maximizes fatigue',
          moodTips: [
            {
              icon: 'construct',
              title: 'Go moderate weight, perfect form on both grips.',
              description: 'Controlled loads ensure proper execution throughout superset.'
            },
            {
              icon: 'refresh',
              title: 'Post-set back squeezes: keep tiny ROM, lats locked.',
              description: 'Small range squeezes enhance activation and recovery.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Long Eccentric Rows',
          duration: '16–18 min',
          description: 'Cable rows using extended negative tempo',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n4 rounds\n• 6 Cable Rows (5s eccentric)\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Cable Rows",
                    "reps": "6",
                    "tutorialSlug": "cable_rope_row"
                  }
                ],
                "rounds": 4,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240751/mood_app/workout_images/y3q3wbcv_seated_cable_row.jpg',
          intensityReason: 'Extended eccentrics maximize strength and hypertrophy',
          moodTips: [
            {
              icon: 'timer',
              title: 'Lower longer than you lift',
              description: '5s eccentric each rep.'
            },
            {
              icon: 'construct',
              title: 'No stack touch allowed',
              description: 'Keep tension constant.'
            },
            {
              icon: 'body',
              title: 'Straps keep lats primary',
              description: 'Forearms shouldn\'t fail first.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Triple Drop Cable Burn',
          duration: '18–20 min',
          description: 'Extended drop sets to fully exhaust lats',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 6 Rows\n• Burn drop → 6\n• Burn drop → 6\n• Burn drop → 6\nRest 150s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Rows",
                    "reps": "6",
                    "note": "Drop → 6; Drop → 6; Drop → 6"
                  }
                ],
                "rounds": 3,
                "rest": "150s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240705/mood_app/workout_images/9zff190v_scr.jpg',
          intensityReason: 'Triple drops maximize muscle fatigue and pump',
          moodTips: [
            {
              icon: 'flash',
              title: 'Three clean drops',
              description: 'Reduce load fast, no pauses.'
            },
            {
              icon: 'construct',
              title: 'Elbow path stays identical',
              description: 'Don\'t turn drops into shrugs.'
            },
            {
              icon: 'body',
              title: 'Chase lat pump',
              description: 'Deep burn under armpits = success.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'pump',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Lat pull down machine',
    icon: 'arrow-down-circle-outline',
    workouts: {
      beginner: [
        {
          name: 'Wide Pulldown',
          duration: '10–12 min',
          description: 'Wide grip basis for learning lat engagement to build pull-up strength',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 10–12 Wide Grip Pulldown\nRest 60–75s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Wide Grip Pulldown",
                    "reps": "10–12"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240548/mood_app/workout_images/diugpoq6_download_8_.jpg',
          intensityReason: 'Wide grip teaches lat activation and form control',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Keep chest tall and lean slightly back for contraction.',
              description: 'Proper posture maximizes lat engagement and range of motion.'
            },
            {
              icon: 'timer',
              title: 'Pull bar to upper chest, pause, control the return.',
              description: 'Full range with pause enhances muscle activation and control.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Underhand Pulldown',
          duration: '10–12 min',
          description: 'Easier grip variation supports early progression',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 10–12 Underhand Pulldown\nRest 60–75s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Underhand Pulldown",
                    "reps": "10–12"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240885/mood_app/workout_images/fkpr9mxh_lprg.jpg',
          intensityReason: 'Underhand grip recruits arms to aid pulling work',
          moodTips: [
            {
              icon: 'construct',
              title: 'Elbows tucked, bar to chest line for full range.',
              description: 'Proper elbow position maximizes lat stretch and contraction.'
            },
            {
              icon: 'flash',
              title: 'Squeeze lats and biceps hard each rep.',
              description: 'Dual muscle activation enhances strength and development.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Assisted Tempo Pulldown',
          duration: '10–12 min',
          description: 'Slow pulldowns building lat control and discipline',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n3 rounds\n• 12 Pulldowns (3s eccentric)\nRest 60–75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pulldowns",
                    "reps": "12"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240739/mood_app/workout_images/puai6ytk_lat_pull.jpg',
          intensityReason: 'Controlled tempo builds lat activation and mind-muscle connection',
          moodTips: [
            {
              icon: 'timer',
              title: 'Slow on the way up',
              description: 'Lower for 3 seconds every rep.'
            },
            {
              icon: 'construct',
              title: 'Chest stays tall',
              description: 'Slight lean back, no swinging.'
            },
            {
              icon: 'flash',
              title: 'Lats pull via elbows',
              description: 'Think "elbows to pockets" to feel the lat line engage.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Bottom-Half Pulldowns',
          duration: '10–12 min',
          description: 'Short-range reps focused on peak lat contraction',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 15 Partial Pulldowns\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Partial Pulldowns",
                    "reps": "15"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240694/mood_app/workout_images/3kbrum0a_lat_pull_down.jpg',
          intensityReason: 'Partial range maximizes peak contraction time',
          moodTips: [
            {
              icon: 'construct',
              title: 'Work the squeeze zone',
              description: 'Only move from chest level to mid-range.'
            },
            {
              icon: 'timer',
              title: 'Never relax at the top',
              description: 'Keep the stack hovering for constant tension.'
            },
            {
              icon: 'flash',
              title: 'Feel lats, not biceps',
              description: 'If arms burn first, lighten load and drive elbows down.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Neutral Pulldown',
          duration: '12–14 min',
          description: 'Stronger setup for progressive overload recruiting a wider variety of muscles',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 8–10 Neutral Grip Pulldown (moderate to heavy)\nRest 75–90s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Neutral Grip Pulldown",
                    "reps": "8–10",
                    "tutorialSlug": "neutral_grip_lat_pulldown"
                  }
                ],
                "rounds": 4,
                "rest": "75–90s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240912/mood_app/workout_images/vydcatjw_nglp.jpg',
          intensityReason: 'Neutral grip enables heavier lat loading safely',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drive elbows to ribs, no shoulder shrug.',
              description: 'Proper elbow drive isolates lats and prevents compensation.'
            },
            {
              icon: 'timer',
              title: 'Lower weight slowly to maximize tension.',
              description: 'Controlled eccentric phase enhances muscle stimulus.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Pulldown + Hold',
          duration: '12–14 min',
          description: 'Controlled reps followed by static contraction',
          battlePlan: 'Instructions: Holds are strict: locked position, no drifting.\n3 rounds\n• 8–10 Pulldown (neutral or wide, consistent grip choice)\nThen end each set with 5s hold at bottom\nRest 90s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Pulldown",
                    "reps": "8–10"
                  },
                  {
                    "name": "End each set with 5s hold at bottom"
                  }
                ],
                "rounds": 3,
                "rest": "90s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240551/mood_app/workout_images/j967e9c7_download_9_.jpg',
          intensityReason: 'Isometric hold boosts tension and endurance',
          moodTips: [
            {
              icon: 'timer',
              title: 'Hold bar at chest for 5s after last rep.',
              description: 'Isometric contraction increases time under tension.'
            },
            {
              icon: 'construct',
              title: 'Keep shoulders down, blades squeezed tight.',
              description: 'Proper scapular position maintains optimal muscle activation.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'mixed',
          intensity_cost: 4,
        },
        {
          name: 'Pulldown Drop Set',
          duration: '14–16 min',
          description: 'Rapid drops to extend sets past fatigue',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 8 Pulldowns\n• Drop → 8 reps\n• Drop → 8 reps\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pulldowns",
                    "reps": "8",
                    "note": "Drop → 8 reps; Drop → 8 reps"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240739/mood_app/workout_images/puai6ytk_lat_pull.jpg',
          intensityReason: 'Drop sets extend time under tension beyond failure',
          moodTips: [
            {
              icon: 'flash',
              title: 'Pin changes are instant',
              description: 'Drop immediately with no standing around.'
            },
            {
              icon: 'construct',
              title: 'Drop size matches control',
              description: 'Use ~20–30% drops so reps stay clean.'
            },
            {
              icon: 'body',
              title: 'Straps are allowed',
              description: 'If grip limits you, strap up so lats get overloaded.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'pump',
          intensity_cost: 4,
        },
        {
          name: 'Pulse Rep Pulldowns',
          duration: '14–16 min',
          description: 'Full reps followed by pulses in the contraction zone',
          battlePlan: 'Instructions: Supersets are back-to-back — no rest until the pair is done.\n3 rounds\n• 12 Pulldowns\n• 10 Pulse Reps — immediately, no rest\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pulldowns",
                    "reps": "12",
                    "note": "Immediately 10 Pulse Reps"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240694/mood_app/workout_images/3kbrum0a_lat_pull_down.jpg',
          intensityReason: 'Pulses extend peak contraction for maximum pump',
          moodTips: [
            {
              icon: 'construct',
              title: 'Pulse at the bottom',
              description: 'Small pulses in the last third of ROM.'
            },
            {
              icon: 'body',
              title: 'Shoulders stay down',
              description: 'No shrugging into traps during fatigue.'
            },
            {
              icon: 'flash',
              title: 'Feel the lat shorten',
              description: 'You should feel a tight "cramp" under armpit at squeeze.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'pump',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Wide + Close',
          duration: '14–16 min',
          description: 'Mix of wide and close grips for full lat work and development',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 8 Wide Grip Pulldown\nRest 90s\n• 8 Close Grip Pulldown\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Wide Grip Pulldown",
                    "reps": "8"
                  },
                  {
                    "name": "Close Grip Pulldown",
                    "reps": "8"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240548/mood_app/workout_images/diugpoq6_download_8_.jpg',
          intensityReason: 'Grip pairing develops width and back thickness',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Breathe out as you pull down, in as you rise.',
              description: 'Proper breathing pattern maintains core stability and power.'
            },
            {
              icon: 'construct',
              title: 'Don\'t swing stack — keep it controlled.',
              description: 'Smooth movement prevents momentum and maintains tension.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Pulldown Superset',
          duration: '16–18 min',
          description: 'Wide-to-underhand with controlled lowering for mastery of movement.',
          battlePlan: 'Instructions: Supersets are back-to-back — no rest until the pair is done. control the lowering — the tempo is the point.\n4 rounds\n• 8 Wide Grip Pulldown\n• 8 Underhand Pulldown — 3s eccentric each — immediately, no rest\nRest 120s after superset',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Wide Grip Pulldown",
                    "reps": "8",
                    "note": "Immediately 8 Underhand Pulldown (3s eccentric each)"
                  }
                ],
                "rounds": 4,
                "rest": "120s after superset"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240551/mood_app/workout_images/j967e9c7_download_9_.jpg',
          intensityReason: 'Superset + eccentrics maximize hypertrophy stress',
          moodTips: [
            {
              icon: 'construct',
              title: 'Use moderate weight to hold perfect form.',
              description: 'Controlled loads ensure proper execution throughout superset.'
            },
            {
              icon: 'timer',
              title: 'Each rep: take 3s to lower bar slowly.',
              description: 'Extended eccentric phase maximizes muscle development.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Long Eccentric Pulldowns',
          duration: '16–18 min',
          description: 'Full ROM pulldowns with extended 5s negatives',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n4 rounds\n• 6 Pulldowns (5s eccentric)\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pulldowns",
                    "reps": "6"
                  }
                ],
                "rounds": 4,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240739/mood_app/workout_images/puai6ytk_lat_pull.jpg',
          intensityReason: 'Extended eccentrics maximize strength and hypertrophy',
          moodTips: [
            {
              icon: 'timer',
              title: 'Eccentric is the work',
              description: 'Lower for 5 seconds every rep.'
            },
            {
              icon: 'construct',
              title: 'Reduce load if tempo breaks',
              description: 'Form > weight at this difficulty.'
            },
            {
              icon: 'body',
              title: 'Straps to keep lats primary',
              description: 'If forearms fail first, straps keep tension where it belongs.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Iso-Hold Drop Burn',
          duration: '18–20 min',
          description: 'Holds plus drops to build extreme lat fatigue',
          battlePlan: 'Instructions: Holds are strict: locked position, no drifting.\n3 rounds\n• 8 Pulldowns + 10s Hold\n• Drop → 8 reps\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pulldowns + 10s Hold",
                    "reps": "8",
                    "note": "Drop → 8 reps"
                  }
                ],
                "rounds": 3,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240694/mood_app/workout_images/3kbrum0a_lat_pull_down.jpg',
          intensityReason: 'Combines isometric fatigue with mechanical drop sets',
          moodTips: [
            {
              icon: 'timer',
              title: 'Hold before you drop',
              description: '8–10s hold at chest height on final rep.'
            },
            {
              icon: 'flash',
              title: 'Drop immediately after hold',
              description: 'Strip ~20% and keep moving.'
            },
            {
              icon: 'construct',
              title: 'Peak form is zero swing',
              description: 'Chest proud, elbows drive down, stack stays controlled.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'mixed',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Straight pull up bar',
    icon: 'remove-circle-outline',
    workouts: {
      beginner: [
        {
          name: 'Assisted Pull-Ups',
          duration: '10–12 min',
          description: 'Focuses on mastering the basic pull-up movement pattern',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 5 Pull-Ups (use band or assisted machine if needed)\nRest 60–75s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pull-Ups",
                    "reps": "5",
                    "tutorialSlug": "pull_ups"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240562/mood_app/workout_images/zpcds83n_download_15_.jpg',
          intensityReason: 'Builds foundational pulling strength with necessary support',
          moodTips: [
            {
              icon: 'construct',
              title: 'Use a band or assisted machine to complete all reps with good form, focusing on lat engagement.',
              description: 'Assistance ensures proper form while building strength foundation.'
            },
            {
              icon: 'trending-up',
              title: 'Drive chin above bar every rep; control the lowering phase.',
              description: 'Full range of motion with controlled eccentric builds strength.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Pull-Up Negatives',
          duration: '10–12 min',
          description: 'Focuses on controlled lowering to build pulling power',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 5 Negative Pull-Ups (jump to top, 3-5s lower)\nRest 75s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Negative Pull-Ups",
                    "reps": "5",
                    "tutorialSlug": "pull_ups"
                  }
                ],
                "rounds": 3,
                "rest": "75s after set"
              }
            ]
          },
          imageUrl: 'https://customer-assets.emergentagent.com/job_fit-outdoor-views/artifacts/toza6up4_pu.avif',
          intensityReason: 'Eccentric training builds strength for full pull-ups',
          moodTips: [
            {
              icon: 'timer',
              title: 'Jump to the top position and take 3-5 seconds to lower yourself. This builds strength even if you can\'t pull up yet.',
              description: 'Eccentric strength training effectively builds pulling power.'
            },
            {
              icon: 'construct',
              title: 'Keep core tight throughout the lowering phase.',
              description: 'Core stability enhances control and safety during negatives.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Assisted Full-Range Pull-Ups',
          duration: '10–12 min',
          description: 'Assisted pull-ups reinforcing clean full-range mechanics',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 6 Assisted Pull-Ups\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Assisted Pull-Ups",
                    "reps": "6",
                    "tutorialSlug": "wide_grip_assisted_pull_up"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240693/mood_app/workout_images/3aciwkyi_assisted_pull_ups.jpg',
          intensityReason: 'Full-range assistance builds proper movement patterns',
          moodTips: [
            {
              icon: 'construct',
              title: 'Full stretch every rep',
              description: 'Start from a dead hang with no bounce.'
            },
            {
              icon: 'body',
              title: 'Assistance supports form',
              description: 'Use enough help to keep reps smooth.'
            },
            {
              icon: 'flash',
              title: 'Back initiates the pull',
              description: 'Drive elbows down before arms bend.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Assisted Pause Pull-Ups',
          duration: '10–12 min',
          description: 'Assisted pull-ups with controlled pauses at the top',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n3 rounds\n• 5 Assisted Pull-Ups (1–2s top pause)\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Assisted Pull-Ups",
                    "reps": "5",
                    "tutorialSlug": "wide_grip_assisted_pull_up"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240736/mood_app/workout_images/ntsbiqfh_assisted_pull_ups_1.jpg',
          intensityReason: 'Pauses at peak contraction build control and strength',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause with control',
              description: 'Hold 1–2s with chin clearly over bar.'
            },
            {
              icon: 'construct',
              title: 'Stay tight at the top',
              description: 'Shoulders down, chest tall.'
            },
            {
              icon: 'trending-up',
              title: 'Peak form is chest-led',
              description: 'Chest rises toward bar before chin.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'strength',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Chin-Up Strength',
          duration: '12–14 min',
          description: 'Builds pulling power with a slightly easier grip variation',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 6 Chin-Ups\nRest 75–90s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Chin-Ups",
                    "reps": "6",
                    "tutorialSlug": "chin_ups"
                  }
                ],
                "rounds": 4,
                "rest": "75–90s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240887/mood_app/workout_images/fox3rjq4_chu.jpg',
          intensityReason: 'Chin-ups engage biceps more, aiding overall pull strength',
          moodTips: [
            {
              icon: 'flash',
              title: 'If needed, use light assistance (thin band) to maintain strict form. Focus on squeezing your biceps and lats.',
              description: 'Minimal assistance maintains form while building strength.'
            },
            {
              icon: 'construct',
              title: 'Keep elbows tucked, pull chest to bar.',
              description: 'Proper elbow path maximizes muscle activation and range.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Pull-Up + Hold',
          duration: '12–14 min',
          description: 'Combines pull-ups with a static hold for enhanced strength',
          battlePlan: 'Instructions: Holds are strict: locked position, no drifting.\n3 rounds\n• 6 Pull-Ups\nThen end each set with a 3s hold at the top\nRest 90s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Pull-Ups",
                    "reps": "6",
                    "tutorialSlug": "pull_ups"
                  },
                  {
                    "name": "End each set with a 3s hold at the top"
                  }
                ],
                "rounds": 3,
                "rest": "90s after set"
              }
            ]
          },
          imageUrl: 'https://customer-assets.emergentagent.com/job_fit-outdoor-views/artifacts/toza6up4_pu.avif',
          intensityReason: 'Adds isometric hold to increase time under tension for growth',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Aim for unassisted reps. If form breaks, use minimal assistance. The hold should be challenging but maintainable.',
              description: 'Progressive overload with isometric challenge builds strength.'
            },
            {
              icon: 'timer',
              title: 'Hold chin above bar for 3 seconds at the top of each final rep.',
              description: 'Isometric hold maximizes time under tension and strength gains.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'mixed',
          intensity_cost: 4,
        },
        {
          name: 'Tempo Pull-Ups',
          duration: '12–14 min',
          description: 'Strict pull-ups emphasizing slow controlled eccentrics',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n4 rounds\n• 6 Pull-Ups (3s eccentric)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pull-Ups",
                    "reps": "6",
                    "tutorialSlug": "pull_ups"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://customer-assets.emergentagent.com/job_ba98ecac-d9ff-4da8-8b26-c72f04702bfb/artifacts/67090cjn_pull%20up%202.avif',
          intensityReason: 'Extended eccentrics maximize strength and control',
          moodTips: [
            {
              icon: 'flash',
              title: 'Explode up, control down',
              description: 'Pull fast, lower for 3 seconds.'
            },
            {
              icon: 'construct',
              title: 'Reset tension each rep',
              description: 'Brief dead hang before next pull.'
            },
            {
              icon: 'body',
              title: 'Feel the lat stretch',
              description: 'Eccentrics should load the lats, not arms.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Pull-Ups + Iso Finisher',
          duration: '12–14 min',
          description: 'Full pull-ups finished with a static top hold',
          battlePlan: 'Instructions: Holds are strict: locked position, no drifting.\n3 rounds\n• 6 Pull-Ups\n• Finish with 10s chin-over-bar hold\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pull-Ups",
                    "reps": "6",
                    "tutorialSlug": "pull_ups",
                    "note": "Finish with 10s chin-over-bar hold"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240736/mood_app/workout_images/ntsbiqfh_assisted_pull_ups_1.jpg',
          intensityReason: 'Isometric finisher extends time under tension',
          moodTips: [
            {
              icon: 'construct',
              title: 'Reps stay strict',
              description: 'Finish all reps before adding the hold.'
            },
            {
              icon: 'trending-up',
              title: 'Hold with intent',
              description: 'Chest high, shoulders depressed.'
            },
            {
              icon: 'timer',
              title: 'Peak contraction is motionless',
              description: 'No shaking, no bar drift.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Wide + Neutral Pull',
          duration: '14–16 min',
          description: 'Two key pull-up variations for comprehensive back development',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 8 Wide Grip Pull-Ups\nRest 90s\n• 8 Neutral Grip Pull-Ups\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Wide Grip Pull-Ups",
                    "reps": "8",
                    "tutorialSlug": "wide_grip_assisted_pull_up"
                  },
                  {
                    "name": "Neutral Grip Pull-Ups",
                    "reps": "8",
                    "tutorialSlug": "neutral_grip_assisted_pull_up"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240562/mood_app/workout_images/zpcds83n_download_15_.jpg',
          intensityReason: 'Targets outer lats and overall back width with varied grips',
          moodTips: [
            {
              icon: 'construct',
              title: 'These are unassisted. Focus on maximizing muscle activation with each grip.',
              description: 'Different grips target various muscle fibers for complete development.'
            },
            {
              icon: 'trending-up',
              title: 'Wide grip emphasizes lat stretch; neutral grip allows for more power.',
              description: 'Grip variation optimizes both width and strength development.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Chest-to-Bar Flow',
          duration: '16–18 min',
          description: 'Advanced pull-ups with deep range and controlled lowering',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 6 Chest-to-Bar Pull-Ups\n• 6 Negative Pull-Ups (3–5s lower)\nRest 90–120s after sequence',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Chest-to-Bar Pull-Ups",
                    "reps": "6",
                    "tutorialSlug": "pull_ups"
                  },
                  {
                    "name": "Negative Pull-Ups",
                    "reps": "6",
                    "tutorialSlug": "pull_ups"
                  }
                ],
                "rounds": 4,
                "rest": "90–120s after sequence"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240906/mood_app/workout_images/r3n8muv4_cbpu.jpg',
          intensityReason: 'Higher pull range and negatives build extreme strength',
          moodTips: [
            {
              icon: 'construct',
              title: 'This is for high-level strength. Ensure full control throughout.',
              description: 'Advanced technique requires complete movement mastery.'
            },
            {
              icon: 'timer',
              title: 'Drive chest to bar, then control the 3-5 second negative.',
              description: 'Extended range with controlled eccentric maximizes strength gains.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Weighted Pull-Ups',
          duration: '14–16 min',
          description: 'Loaded pull-ups to overload back strength',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 5 Weighted Pull-Ups\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Weighted Pull-Ups",
                    "reps": "5",
                    "tutorialSlug": "pull_ups"
                  }
                ],
                "rounds": 4,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240752/mood_app/workout_images/z868brwr_wighted_pull_up.jpg',
          intensityReason: 'External load maximizes strength development',
          moodTips: [
            {
              icon: 'construct',
              title: 'Load stays honest',
              description: 'Add weight only if reps stay strict.'
            },
            {
              icon: 'body',
              title: 'Dead hang matters',
              description: 'Full lockout on every rep.'
            },
            {
              icon: 'flash',
              title: 'Straps are acceptable',
              description: 'Don\'t let grip cap lat overload.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Eccentric Pull-Ups',
          duration: '14–16 min',
          description: 'Pull-ups emphasizing long controlled negatives',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n3 rounds\n• 5 Pull-Ups (5s eccentric)\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pull-Ups",
                    "reps": "5",
                    "tutorialSlug": "pull_ups"
                  }
                ],
                "rounds": 3,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://customer-assets.emergentagent.com/job_ba98ecac-d9ff-4da8-8b26-c72f04702bfb/artifacts/67090cjn_pull%20up%202.avif',
          intensityReason: 'Extended eccentrics maximize strength adaptation',
          moodTips: [
            {
              icon: 'timer',
              title: 'Eccentric is the work',
              description: 'Lower for a full 5 seconds.'
            },
            {
              icon: 'construct',
              title: 'Stop before breakdown',
              description: 'End set when tempo slips.'
            },
            {
              icon: 'body',
              title: 'Peak form stays rigid',
              description: 'Core tight, no swinging.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Burnout Pull-Up Ladder',
          duration: '16–18 min',
          description: 'Descending-rep ladder taken near strict failure',
          battlePlan: 'Instructions: Leave 1–2 clean reps in the tank on every set.\nLadder format\n• 8 Pull-Ups\n• 6 Pull-Ups\n• 4 Pull-Ups\n• 2 Pull-Ups\nRest 30–45s between rungs',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Ladder format",
                    "reps": "8"
                  },
                  {
                    "name": "Pull-Ups",
                    "reps": "6",
                    "tutorialSlug": "pull_ups"
                  },
                  {
                    "name": "Pull-Ups",
                    "reps": "4",
                    "tutorialSlug": "pull_ups"
                  },
                  {
                    "name": "Pull-Ups",
                    "reps": "2",
                    "tutorialSlug": "pull_ups"
                  }
                ],
                "rest": "30–45s between rungs"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240729/mood_app/workout_images/iyoz9m2p_pull_up.jpg',
          intensityReason: 'Ladder format maximizes volume and fatigue',
          moodTips: [
            {
              icon: 'flash',
              title: 'Chase clean fatigue',
              description: 'End sets when reps slow or kip appears.'
            },
            {
              icon: 'timer',
              title: 'Minimal rest matters',
              description: 'Short breaks keep tension high.'
            },
            {
              icon: 'body',
              title: 'Back should fail first',
              description: 'Strap up if grip limits output.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Muscle-Up Skill Sets',
          duration: '18–20 min',
          description: 'Explosive pull-to-transition muscle-up practice',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 3–5 Muscle-Ups\n(strict, band-assisted, or low-kip)\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Muscle-Ups",
                    "reps": "3–5",
                    "tutorialSlug": "muscle_ups"
                  }
                ],
                "rounds": 4,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240710/mood_app/workout_images/bcw1iy96_Muscle_ups.jpg',
          intensityReason: 'Explosive pulling develops power and skill',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Pull higher than needed',
              description: 'Chest must clear bar height.'
            },
            {
              icon: 'flash',
              title: 'Transition stays tight',
              description: 'Elbows whip fast around bar.'
            },
            {
              icon: 'construct',
              title: 'Quality beats volume',
              description: 'Stop before technique degrades.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Grip variation pull up bar',
    icon: 'git-branch-outline',
    workouts: {
      beginner: [
        {
          name: 'Assisted Neutral',
          duration: '10–12 min',
          description: 'Focuses on the neutral grip pull-up with support',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 5 Neutral Grip Pull-Ups (use band or assisted machine if needed)\nRest 60–75s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Neutral Grip Pull-Ups",
                    "reps": "5",
                    "tutorialSlug": "neutral_grip_assisted_pull_up"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240721/mood_app/workout_images/g4mpj66m_assisted_neutral_grip_pullups.jpg',
          intensityReason: 'Neutral grip is often easiest, building initial pulling strength',
          moodTips: [
            {
              icon: 'construct',
              title: 'Use a band or assisted machine to ensure you can complete all reps with good form. This helps build the mind-muscle connection.',
              description: 'Assistance allows focus on movement quality and muscle activation.'
            },
            {
              icon: 'flash',
              title: 'Keep elbows tucked, pull with your lats.',
              description: 'Proper elbow position targets lats effectively while learning.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Assisted Chin-Ups',
          duration: '10–12 min',
          description: 'Builds pulling strength using an underhand grip with assistance',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 5 Chin-Ups (use band or assisted machine if needed)\nRest 75s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Chin-Ups",
                    "reps": "5",
                    "tutorialSlug": "chin_ups"
                  }
                ],
                "rounds": 3,
                "rest": "75s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240870/mood_app/workout_images/9ie9z8cd_chu.jpg',
          intensityReason: 'Chin-ups recruit biceps, making them slightly easier to learn',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Use assistance to focus on the movement pattern. As you get stronger, reduce the assistance.',
              description: 'Progressive assistance reduction builds strength systematically.'
            },
            {
              icon: 'flash',
              title: 'Palms face you, squeeze biceps at the top.',
              description: 'Underhand grip engages biceps more for easier progression.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Neutral Grip Scap Pulls',
          duration: '10–12 min',
          description: 'Scapular pulls using neutral grip for control',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 8–10 Neutral Grip Scap Pulls\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Neutral Grip Scap Pulls",
                    "reps": "8–10",
                    "tutorialSlug": "pull_ups"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://customer-assets.emergentagent.com/job_ba98ecac-d9ff-4da8-8b26-c72f04702bfb/artifacts/tmmvwgrx_neutral%20grip%20pull%20ups.avif',
          intensityReason: 'Scap pulls teach fundamental lat activation',
          moodTips: [
            {
              icon: 'construct',
              title: 'Neutral grip = safer start',
              description: 'Reduces shoulder strain early.'
            },
            {
              icon: 'body',
              title: 'Move shoulders, not arms',
              description: 'Elbows stay mostly straight.'
            },
            {
              icon: 'flash',
              title: 'Feel mid-back engage',
              description: 'Activation should feel deep, not in biceps.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Assisted Neutral Pull-Ups (Tempo)',
          duration: '10–12 min',
          description: 'Assisted reps with slower lowering phase',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n3 rounds\n• 5 Assisted Neutral Pull-Ups (3s eccentric)\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Assisted Neutral Pull-Ups",
                    "reps": "5",
                    "tutorialSlug": "neutral_grip_assisted_pull_up"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240870/mood_app/workout_images/9ie9z8cd_chu.jpg',
          intensityReason: 'Tempo work builds control and strength',
          moodTips: [
            {
              icon: 'timer',
              title: 'Slow on the way down',
              description: 'Lower for 3 seconds each rep.'
            },
            {
              icon: 'construct',
              title: 'Minimal assistance',
              description: 'Just enough help to stay strict.'
            },
            {
              icon: 'flash',
              title: 'Peak form = elbows to ribs',
              description: 'Think pulling elbows down, not hands.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'strength',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Mixed Grip Pulls',
          duration: '12–14 min',
          description: 'Alternating grip for balanced strength development',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 6 Mixed Grip Pull-Ups (swap grip each set)\nRest 75–90s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Mixed Grip Pull-Ups",
                    "reps": "6",
                    "tutorialSlug": "pull_ups"
                  }
                ],
                "rounds": 4,
                "rest": "75–90s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240552/mood_app/workout_images/knkswnzw_download_4_.jpg',
          intensityReason: 'Mixed grip helps overcome sticking points, building unilateral strength',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Aim for unassisted reps. If needed, use a very light band. Swap your mixed grip hand position each set.',
              description: 'Alternating grip position ensures balanced development.'
            },
            {
              icon: 'trending-up',
              title: 'Focus on pulling with the supinated hand, then switch.',
              description: 'Supinated hand leads pull for optimal activation pattern.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Commando Pulls',
          duration: '12–14 min',
          description: 'Dynamic pull-up variation for core and back engagement',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 6 Commando Pull-Ups (chest to each side)\nRest 90s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Commando Pull-Ups",
                    "reps": "6",
                    "tutorialSlug": "pull_ups"
                  }
                ],
                "rounds": 3,
                "rest": "90s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240909/mood_app/workout_images/v94peb1z_Screenshot_2025-12-05_at_11_08_43_PM.jpg',
          intensityReason: 'Commando pulls challenge stability and unilateral strength',
          moodTips: [
            {
              icon: 'construct',
              title: 'This is a step up. If needed, use a light band. Focus on moving your chest to each side of your hands.',
              description: 'Dynamic movement challenges core stability and coordination.'
            },
            {
              icon: 'flash',
              title: 'Keep body tight, move chest side-to-side over hands.',
              description: 'Core tension maintains control during lateral movement.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Grip Switch Pull-Ups',
          duration: '12–14 min',
          description: 'Switching grips between sets for balanced loading',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 6 Neutral Grip Pull-Ups\n• 6 Chin-Ups — alternate sets\nThen alternate each round\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Neutral Grip Pull-Ups",
                    "reps": "6",
                    "tutorialSlug": "neutral_grip_assisted_pull_up"
                  },
                  {
                    "name": "Next set: 6 Chin-Ups",
                    "tutorialSlug": "chin_ups"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://customer-assets.emergentagent.com/job_ba98ecac-d9ff-4da8-8b26-c72f04702bfb/artifacts/tmmvwgrx_neutral%20grip%20pull%20ups.avif',
          intensityReason: 'Grip switching targets different lat fibers',
          moodTips: [
            {
              icon: 'construct',
              title: 'One grip per set',
              description: 'Don\'t change mid-set.'
            },
            {
              icon: 'refresh',
              title: 'Stay symmetrical',
              description: 'Match reps across grips.'
            },
            {
              icon: 'flash',
              title: 'Notice grip-to-lat feel',
              description: 'Different grips bias different lat fibers.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Commando Pause Pulls',
          duration: '12–14 min',
          description: 'Side-to-side pulls with controlled pauses',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n3 rounds\n• 6 Commando Pull-Ups (with 1s pause each side)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Commando Pull-Ups",
                    "reps": "6",
                    "tutorialSlug": "pull_ups"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240727/mood_app/workout_images/haxbdjj0_commando_pull.jpg',
          intensityReason: 'Pauses increase time under tension unilaterally',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause each side',
              description: '1s hold with chest to hand.'
            },
            {
              icon: 'construct',
              title: 'No torso twist',
              description: 'Keep hips square.'
            },
            {
              icon: 'flash',
              title: 'Feel unilateral lat work',
              description: 'One side should light up per rep.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'strength',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Wide + Neutral',
          duration: '14–16 min',
          description: 'Targets both back width and overall pulling power',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 8 Wide Grip Pull-Ups\nRest 90s\n• 8 Neutral Grip Pull-Ups\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Wide Grip Pull-Ups",
                    "reps": "8",
                    "tutorialSlug": "wide_grip_assisted_pull_up"
                  },
                  {
                    "name": "Neutral Grip Pull-Ups",
                    "reps": "8",
                    "tutorialSlug": "neutral_grip_assisted_pull_up"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240552/mood_app/workout_images/knkswnzw_download_4_.jpg',
          intensityReason: 'Combines two primary grips for comprehensive back development',
          moodTips: [
            {
              icon: 'construct',
              title: 'These are unassisted. Focus on perfect form and full range of motion.',
              description: 'Unassisted reps with perfect form maximize strength development.'
            },
            {
              icon: 'trending-up',
              title: 'Wide grip for lat spread, neutral for power and depth.',
              description: 'Different grips target width versus thickness development.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Archer Pulls',
          duration: '16–18 min',
          description: 'Highly challenging pull-up variation for extreme strength',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 6 Archer Pull-Ups (each side)\nRest 90–120s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Archer Pull-Ups",
                    "reps": "6",
                    "tutorialSlug": "pull_ups"
                  }
                ],
                "rounds": 4,
                "rest": "90–120s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240917/mood_app/workout_images/yk99v1xl_archpu.jpg',
          intensityReason: 'Unilateral strength builder, progressing towards one-arm pull-ups',
          moodTips: [
            {
              icon: 'construct',
              title: 'This is very advanced. Keep the non-pulling arm extended.',
              description: 'Advanced unilateral training requires exceptional control.'
            },
            {
              icon: 'trending-up',
              title: 'Focus on pulling with one arm while the other provides minimal assistance.',
              description: 'Single-arm emphasis builds towards ultimate pulling strength.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Weighted Neutral Pull-Ups',
          duration: '14–16 min',
          description: 'Heavy neutral-grip pulls for lat thickness',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 5 Weighted Neutral Pull-Ups\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Weighted Neutral Pull-Ups",
                    "reps": "5",
                    "tutorialSlug": "pull_ups"
                  }
                ],
                "rounds": 4,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240717/mood_app/workout_images/f7ym9pmr_weighted_neutral_grip_pull_ups.jpg',
          intensityReason: 'Weighted work maximizes strength development',
          moodTips: [
            {
              icon: 'construct',
              title: 'Neutral allows heavier load',
              description: 'Use this grip to push strength.'
            },
            {
              icon: 'flash',
              title: 'Stay explosive up',
              description: 'Don\'t grind slow concentrics.'
            },
            {
              icon: 'body',
              title: 'Straps allowed if needed',
              description: 'Keep lats as the limiter, not grip.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Archer Eccentrics',
          duration: '16–18 min',
          description: 'Archer pull-ups with slow unilateral negatives',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n3 rounds\n• 4 Archer Pull-Ups (slow eccentric each side)\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Archer Pull-Ups",
                    "reps": "4",
                    "tutorialSlug": "pull_ups"
                  }
                ],
                "rounds": 3,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240917/mood_app/workout_images/yk99v1xl_archpu.jpg',
          intensityReason: 'Extended eccentrics maximize unilateral strength',
          moodTips: [
            {
              icon: 'timer',
              title: 'Lower toward one arm',
              description: 'Bias load to one side.'
            },
            {
              icon: 'construct',
              title: 'Control the descent',
              description: '4–5s eccentric each rep.'
            },
            {
              icon: 'flash',
              title: 'Peak form is rigid',
              description: 'Core tight, no swinging.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_pull',
          training_style: 'strength',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Seated Chest Supported Row Machine',
    icon: 'desktop-outline',
    workouts: {
      beginner: [
        {
          name: 'Neutral Row',
          duration: '10–12 min',
          description: 'Builds pulling strength with a natural elbow path',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 10–12 Neutral Grip Row\nRest 60–75s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Neutral Grip Row",
                    "reps": "10–12",
                    "tutorialSlug": "neutral_grip_t_bar_chest_supported_row"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240896/mood_app/workout_images/lmxixaaf_scsngr.jpg',
          intensityReason: 'Neutral grip row teaches form with stable setup',
          moodTips: [
            {
              icon: 'construct',
              title: 'Keep chest pressed firmly to pad, no torso lift.',
              description: 'Stable chest position isolates back muscles effectively.'
            },
            {
              icon: 'timer',
              title: 'Pull elbows straight back, pause at squeeze.',
              description: 'Straight elbow path with pause maximizes muscle activation.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Wide Row',
          duration: '10–12 min',
          description: 'Engages rhomboids and traps with safer alignment',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 10–12 Wide Grip Row\nRest 60–75s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Wide Grip Row",
                    "reps": "10–12",
                    "tutorialSlug": "wide_grip_t_bar_chest_supported_row"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240875/mood_app/workout_images/aod60178_scswgr.jpg',
          intensityReason: 'Wide row variation builds posture and width with added support.',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Lead with elbows, not forearms.',
              description: 'Elbow-led movement optimizes lat and rhomboid activation.'
            },
            {
              icon: 'flash',
              title: 'Pull bar toward upper chest line for best squeeze.',
              description: 'Upper chest pull height maximizes upper back engagement.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Pause Rows',
          duration: '10–12 min',
          description: 'Controlled rows emphasizing peak contraction and posture',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n3 rounds\n• 12 Rows (2s pause)\nRest 60–75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Rows",
                    "reps": "12"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241290/mood_app/workout_images/m556b5a2_scsr_1.jpg',
          intensityReason: 'Paused reps reinforce form and mind-muscle connection',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause at squeeze',
              description: 'Hold 2 seconds at full contraction.'
            },
            {
              icon: 'construct',
              title: 'Chest stays glued',
              description: 'Do not lift off pad to cheat.'
            },
            {
              icon: 'flash',
              title: 'Feel mid-back tighten',
              description: 'Think "shoulder blades together" more than arms pulling.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Partial Row Burn',
          duration: '10–12 min',
          description: 'Short-range rows for endurance without form breakdown',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 20 Partial Rows\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Partial Rows",
                    "reps": "20"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241275/mood_app/workout_images/511hj5j8_scsr.jpg',
          intensityReason: 'Partial range builds endurance while maintaining strict form',
          moodTips: [
            {
              icon: 'construct',
              title: 'Mid-to-top range only',
              description: 'Work where you can stay strict.'
            },
            {
              icon: 'timer',
              title: 'Keep tension constant',
              description: 'Don\'t let stack touch between reps.'
            },
            {
              icon: 'flash',
              title: 'Feel rhomboids working',
              description: 'You should feel squeeze between shoulder blades, not low back.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'pump',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Underhand Row',
          duration: '12–14 min',
          description: 'Stronger pull variation for controlled overload',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 8–10 Underhand Grip Row (moderate to heavy)\nRest 75s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Underhand Grip Row",
                    "reps": "8–10"
                  }
                ],
                "rounds": 4,
                "rest": "75s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240901/mood_app/workout_images/pm9titrm_scsrgr.jpg',
          intensityReason: 'Underhand angle shifts load to lats and biceps',
          moodTips: [
            {
              icon: 'construct',
              title: 'Keep wrists straight, elbows close to torso.',
              description: 'Proper wrist alignment and elbow path optimize pulling mechanics.'
            },
            {
              icon: 'timer',
              title: 'Hold 1s at contraction to deepen squeeze.',
              description: 'Peak contraction pause enhances muscle activation.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Slow Negatives',
          duration: '12–14 min',
          description: 'Focuses on lat control with longer lowering phase',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n3 rounds\n• 8 Neutral Grip Row (3s eccentric each rep)\nRest 90s after set',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Neutral Grip Row",
                    "reps": "8",
                    "tutorialSlug": "neutral_grip_t_bar_chest_supported_row"
                  }
                ],
                "rounds": 3,
                "rest": "90s after set"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240542/mood_app/workout_images/1uyss7y4_csrr.jpg',
          intensityReason: '3s eccentric reps add high time under tension',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Pull explosively, lower over full 3 count.',
              description: 'Fast concentric with slow eccentric maximizes muscle stimulus.'
            },
            {
              icon: 'construct',
              title: 'Don\'t let weight touch stack between reps.',
              description: 'Constant tension maintains muscle activation throughout set.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Row Drop Set',
          duration: '14–16 min',
          description: 'Heavy rows extended using fast load reductions',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 8 Rows\n• Drop → 8 reps\n• Drop → 8 reps\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Rows",
                    "reps": "8",
                    "note": "Drop → 8 reps; Drop → 8 reps"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241290/mood_app/workout_images/m556b5a2_scsr_1.jpg',
          intensityReason: 'Drop sets extend time under tension beyond failure',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drops are immediate',
              description: 'Change weight fast while staying seated.'
            },
            {
              icon: 'construct',
              title: 'Drop size stays clean',
              description: '~25% reduction to keep path identical.'
            },
            {
              icon: 'body',
              title: 'Straps are fine here',
              description: 'If grip fails early, strap up so lats get full load.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'pump',
          intensity_cost: 4,
        },
        {
          name: 'Slow Negative Rows',
          duration: '14–16 min',
          description: 'Time-under-tension rows using long eccentrics',
          battlePlan: 'Instructions: Control the lowering — the tempo is the point.\n4 rounds\n• 8 Rows (4s eccentric)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Rows",
                    "reps": "8"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241275/mood_app/workout_images/511hj5j8_scsr.jpg',
          intensityReason: 'Extended eccentrics maximize strength development',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pull fast, lower slow',
              description: '4-second eccentric each rep.'
            },
            {
              icon: 'construct',
              title: 'No stack touch',
              description: 'Hover the weight for constant tension.'
            },
            {
              icon: 'flash',
              title: 'Peak form is elbows back',
              description: 'Elbows travel past ribs with chest still pinned to pad.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'strength',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Neutral + Wide',
          duration: '14–16 min',
          description: 'Neutral rows + wide rows maximize pulling volume',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n4 rounds\n• 8 Neutral Grip Row\nRest 90s\n• 8 Wide Grip Row\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Neutral Grip Row",
                    "reps": "8",
                    "tutorialSlug": "neutral_grip_t_bar_chest_supported_row"
                  },
                  {
                    "name": "Wide Grip Row",
                    "reps": "8",
                    "tutorialSlug": "wide_grip_t_bar_chest_supported_row"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240557/mood_app/workout_images/ty987c3z_download_14_.jpg',
          intensityReason: 'Two grips stimulate width and thickness growth',
          moodTips: [
            {
              icon: 'construct',
              title: 'Keep chest glued down on all reps.',
              description: 'Stable torso position ensures isolated back muscle targeting.'
            },
            {
              icon: 'flash',
              title: 'Squeeze each rep at peak for best activation.',
              description: 'Peak contraction squeeze maximizes muscle fiber recruitment.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Row Superset + Iso',
          duration: '16–18 min',
          description: 'Neutral-to-underhand rows plus isometric finisher',
          battlePlan: 'Instructions: Supersets are back-to-back — no rest until the pair is done. holds are strict: locked position, no drifting.\n4 rounds\n• 8 Neutral Grip Row\n• 8 Underhand Grip Row — immediately, no rest\n• Finish with 10s Hold at peak contraction\nRest 120s after full sequence',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Neutral Grip Row",
                    "reps": "8",
                    "tutorialSlug": "neutral_grip_t_bar_chest_supported_row",
                    "note": "Immediately 8 Underhand Grip Row; Finish with 10s Hold at peak contraction"
                  }
                ],
                "rounds": 4,
                "rest": "120s after full sequence"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240542/mood_app/workout_images/1uyss7y4_csrr.jpg',
          intensityReason: 'Superset adds load, holds extend time under tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Focus on slow return, don\'t drop stack.',
              description: 'Controlled eccentric maintains tension and prevents momentum.'
            },
            {
              icon: 'flash',
              title: 'Lock in hard squeeze during iso hold.',
              description: 'Maximum contraction during hold maximizes strength gains.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Iso Squeeze Rows',
          duration: '16–18 min',
          description: 'Heavy rows finished with long isometric contractions',
          battlePlan: 'Instructions: Holds are strict: locked position, no drifting.\n4 rounds\n• 8 Rows + 10s Hold\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Rows + 10s Hold",
                    "reps": "8"
                  }
                ],
                "rounds": 4,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241290/mood_app/workout_images/m556b5a2_scsr_1.jpg',
          intensityReason: 'Isometric holds build peak contraction strength',
          moodTips: [
            {
              icon: 'timer',
              title: 'Hold the last rep',
              description: '10s hold at peak contraction.'
            },
            {
              icon: 'construct',
              title: 'No shrugging',
              description: 'Keep shoulders down as elbows pull back.'
            },
            {
              icon: 'flash',
              title: 'Chase a "mid-back cramp"',
              description: 'The goal is deep squeeze, not moving more weight.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Triple Drop Row',
          duration: '18–20 min',
          description: 'Extended drop set to drive maximum pulling fatigue',
          battlePlan: 'Instructions: One round = every move in order; rest between rounds, not between moves.\n3 rounds\n• 6 Rows\n• Row drop → 6\n• Row drop → 6\n• Row drop → 6\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Rows",
                    "reps": "6",
                    "note": "Drop → 6; Drop → 6; Drop → 6"
                  }
                ],
                "rounds": 3,
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241275/mood_app/workout_images/511hj5j8_scsr.jpg',
          intensityReason: 'Triple drops maximize muscle fatigue and pump',
          moodTips: [
            {
              icon: 'flash',
              title: 'Three drops, no rest',
              description: 'Strip load quickly and keep reps moving.'
            },
            {
              icon: 'construct',
              title: 'Keep same elbow path',
              description: 'Don\'t turn it into a shrug as weight falls.'
            },
            {
              icon: 'body',
              title: 'Straps are recommended',
              description: 'Keep grip from limiting back overload.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_pull',
          training_style: 'pump',
          intensity_cost: 5,
        }
      ]
    }
  }
];
