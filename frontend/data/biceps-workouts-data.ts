import { EquipmentWorkouts } from '../types/workout';

export const bicepsWorkoutDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Dumbbells',
    icon: 'barbell',
    workouts: {
      beginner: [
        {
          name: 'Alternating DB Curl Builder',
          duration: '12–14 min',
          description: 'Standard curl workout building foundational elbow-flexion strength.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Alternating Dumbbell Curl — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Alternating Dumbbell Curl",
                    "sets": 4,
                    "reps": "12",
                    "note": "standard reps",
                    "tutorialSlug": "dumbbell_curl"
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240792/mood_app/workout_images/azkbdoo3_download_2_.jpg',
          intensityReason: 'Builds curl discipline with stable elbow position',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Elbows stay pinned',
              description: 'Keeps tension on biceps'
            },
            {
              icon: 'refresh',
              title: 'Rotate smoothly into supination',
              description: 'Improves peak contraction'
            },
            {
              icon: 'trending-down',
              title: 'Lower fully, squeeze hard at the top',
              description: 'Full stretch + tight flex = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Seated DB Curl Control',
          duration: '12–14 min',
          description: 'Standard seated curl workout removing momentum.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Seated Dumbbell Curl — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Seated Dumbbell Curl",
                    "sets": 4,
                    "reps": "12",
                    "note": "standard reps",
                    "tutorialSlug": "dumbbell_curl"
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240792/mood_app/workout_images/azkbdoo3_download_2_.jpg',
          intensityReason: 'Seated position removes momentum for better isolation',
          moodTips: [
            {
              icon: 'body',
              title: 'Sit tall, no lean',
              description: 'Zero cheating'
            },
            {
              icon: 'trending-down',
              title: 'Slow the negative',
              description: 'Eccentric builds fatigue'
            },
            {
              icon: 'hand-left',
              title: 'Let arms hang fully',
              description: 'Deeper stretch = better pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Hammer Curl Builder',
          duration: '12–14 min',
          description: 'Standard neutral-grip curl workout targeting brachialis.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Hammer Curl — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Hammer Curl",
                    "sets": 4,
                    "reps": "12",
                    "note": "standard reps",
                    "tutorialSlug": "dumbbell_hammer_curl"
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240788/mood_app/workout_images/2j38bvu7_download_1_.jpg',
          intensityReason: 'Neutral grip activates forearms and brachialis',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Wrists stay neutral',
              description: 'Transfers load correctly'
            },
            {
              icon: 'trending-up',
              title: 'Curl straight up, not across',
              description: 'Cleaner elbow path'
            },
            {
              icon: 'flash',
              title: 'Control the top squeeze',
              description: 'Brachialis pumps fast when shortened'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hammer_curl',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Curl + Iso Finish',
          duration: '12–14 min',
          description: 'Standard curl workout with squeeze-to-finish at peak flexion.',
          battlePlan: 'Battle Plan — Standard + Isometric Finish\n• 4×10 Dumbbell Curl — standard reps\n• Final set: squeeze to finish — hold at top (elbow fully flexed) 8–10s\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Dumbbell Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "standard reps; Final set: squeeze to finish — hold at top (elbow fully flexed) 8–10s",
                    "tutorialSlug": "dumbbell_curl"
                  }
                ],
                "label": "Standard + Isometric Finish",
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240792/mood_app/workout_images/azkbdoo3_download_2_.jpg',
          intensityReason: 'Isometric finish maximizes muscle recruitment',
          moodTips: [
            {
              icon: 'flash',
              title: 'Flex as hard as possible',
              description: 'Biceps respond to contraction'
            },
            {
              icon: 'body',
              title: 'Elbows stay still during hold',
              description: 'Prevents shoulder takeover'
            },
            {
              icon: 'fitness',
              title: 'Use lighter weight for the hold',
              description: 'Longer squeeze = better pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Incline DB Curl',
          duration: '14–16 min',
          description: 'Standard long-head curl workout using shoulder extension.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×10 Incline Dumbbell Curl — standard reps\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Incline Dumbbell Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "standard reps",
                    "tutorialSlug": "incline_db_curl"
                  }
                ],
                "label": "Standard Sets",
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240792/mood_app/workout_images/azkbdoo3_download_2_.jpg',
          intensityReason: 'Incline position maximizes long-head stretch',
          moodTips: [
            {
              icon: 'body',
              title: 'Shoulders stay back',
              description: 'Maximizes long-head stretch'
            },
            {
              icon: 'timer',
              title: 'Don\'t rush the bottom',
              description: 'Stretch drives growth'
            },
            {
              icon: 'trending-up',
              title: 'Curl through full arc',
              description: 'Long stretch → hard squeeze = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Paused DB Curl',
          duration: '14–16 min',
          description: 'Pause-rep curl workout removing momentum.',
          battlePlan: 'Battle Plan — Pause Sets\n• 4×10 Dumbbell Curl — pause reps (1s halfway up)\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Dumbbell Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "pause reps (1s halfway up)",
                    "tutorialSlug": "dumbbell_curl"
                  }
                ],
                "label": "Pause Sets",
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240788/mood_app/workout_images/2j38bvu7_download_1_.jpg',
          intensityReason: 'Pauses eliminate momentum for honest tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause kills bounce',
              description: 'Honest tension'
            },
            {
              icon: 'hand-left',
              title: 'Grip tight throughout',
              description: 'Improves neural drive'
            },
            {
              icon: 'flash',
              title: 'Finish with a hard top squeeze',
              description: 'Shortened biceps pump best'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Alternating Curl Burn Builder',
          duration: '15–17 min',
          description: 'Burnout-style curl workout extending time under tension.',
          battlePlan: 'Battle Plan — Burnout Sets\n• 4×16 Alternating DB Curls — burnout reps\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Alternating DB Curls",
                    "sets": 4,
                    "reps": "16",
                    "note": "burnout reps",
                    "tutorialSlug": "dumbbell_curl"
                  }
                ],
                "label": "Burnout Sets",
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240792/mood_app/workout_images/azkbdoo3_download_2_.jpg',
          intensityReason: 'Extended time under tension builds endurance and pump',
          moodTips: [
            {
              icon: 'shield',
              title: 'No swinging allowed',
              description: 'Fatigue should stay local'
            },
            {
              icon: 'body',
              title: 'Steady breathing',
              description: 'Keeps rhythm clean'
            },
            {
              icon: 'flash',
              title: 'Light weight, nonstop reps',
              description: 'Continuous tension = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'pump',
          intensity_cost: 4,
        },
        {
          name: 'Curl + Hammer Contrast',
          duration: '15–17 min',
          description: 'Superset workout pairing supinated and neutral curls.',
          battlePlan: 'Battle Plan — Superset\n• 4×10 Dumbbell Curl — standard reps\nsuperset with\n• 10 Hammer Curls\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Dumbbell Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "standard reps",
                    "tutorialSlug": "dumbbell_curl"
                  },
                  {
                    "name": "Hammer Curls",
                    "reps": "10",
                    "tutorialSlug": "dumbbell_hammer_curl",
                    "note": "superset with"
                  }
                ],
                "label": "Superset",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240788/mood_app/workout_images/2j38bvu7_download_1_.jpg',
          intensityReason: 'Two grip styles maximize total arm development',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Supinated curl first',
              description: 'Peak biceps output'
            },
            {
              icon: 'fitness',
              title: 'Hammers finish the arm',
              description: 'Brachialis assists growth'
            },
            {
              icon: 'flash',
              title: 'Control both tops',
              description: 'Two contractions = massive pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hammer_curl',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy DB Curl Builder',
          duration: '18–20 min',
          description: 'Standard heavy curl workout emphasizing load control.',
          battlePlan: 'Battle Plan — Standard Sets\n• 6×8 Dumbbell Curl — standard reps\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Dumbbell Curl",
                    "sets": 6,
                    "reps": "8",
                    "note": "standard reps",
                    "tutorialSlug": "dumbbell_curl"
                  }
                ],
                "label": "Standard Sets",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240792/mood_app/workout_images/azkbdoo3_download_2_.jpg',
          intensityReason: 'Heavy loads with strict form build maximum strength',
          moodTips: [
            {
              icon: 'body',
              title: 'No torso movement',
              description: 'Load stays honest'
            },
            {
              icon: 'trending-down',
              title: 'Lower slower than you lift',
              description: 'Eccentric overload'
            },
            {
              icon: 'flash',
              title: 'Squeeze before elbow lockout',
              description: 'Peak flexion is the goal'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'DB Curl Drop Ladder',
          duration: '18–20 min',
          description: 'Multi-drop curl workout driving mechanical fatigue.',
          battlePlan: 'Battle Plan — Drop Ladder\n• 3 rounds:\n  10 reps → drop ~20% → 8 reps → drop ~15% → AMRAP\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "reps → drop ~20% → 8 reps → drop ~15% → AMRAP",
                    "reps": "10"
                  }
                ],
                "rounds": 3,
                "label": "Drop Ladder",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240788/mood_app/workout_images/2j38bvu7_download_1_.jpg',
          intensityReason: 'Drop sets extend time under tension past failure',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drops are immediate',
              description: 'No rest between changes'
            },
            {
              icon: 'shield',
              title: 'Smaller drops preserve form',
              description: 'Keep elbows pinned'
            },
            {
              icon: 'timer',
              title: 'End each mini-set with a squeeze',
              description: 'Contracted biceps, not momentum'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Incline Curl Burnout',
          duration: '18–20 min',
          description: 'Burnout long-head curl workout using stretch-bias.',
          battlePlan: 'Battle Plan — Burnout Sets\n• 4×15 Incline DB Curl — burnout reps\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Incline DB Curl",
                    "sets": 4,
                    "reps": "15",
                    "note": "burnout reps",
                    "tutorialSlug": "incline_db_curl"
                  }
                ],
                "label": "Burnout Sets",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240792/mood_app/workout_images/azkbdoo3_download_2_.jpg',
          intensityReason: 'Stretch-biased burnout maximizes long-head hypertrophy',
          moodTips: [
            {
              icon: 'body',
              title: 'Arms stay behind torso',
              description: 'Stretch bias maintained'
            },
            {
              icon: 'shield',
              title: 'No half reps',
              description: 'Full ROM matters'
            },
            {
              icon: 'flash',
              title: 'Stretch deep, squeeze hard',
              description: 'Long-to-short tension = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: '21s + Iso Finish',
          duration: '18–20 min',
          description: 'Partial-range burnout workout finishing with peak contraction hold.',
          battlePlan: 'Battle Plan — Burnout + Isometric\n• 3 rounds of 21s\n• Final set: squeeze to finish — hold top flex 10s\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [],
                "rounds": 3,
                "label": "Burnout + Isometric",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240788/mood_app/workout_images/2j38bvu7_download_1_.jpg',
          intensityReason: '21s with iso hold completely exhausts biceps fibers',
          moodTips: [
            {
              icon: 'timer',
              title: 'Partials stay controlled',
              description: 'No bouncing'
            },
            {
              icon: 'trending-up',
              title: 'Top-range reps dominate',
              description: 'Peak biceps tension'
            },
            {
              icon: 'flash',
              title: 'Hold the flex hard',
              description: 'Shortened position seals the pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'mixed',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'EZ Curl Bar',
    icon: 'remove',
    workouts: {
      beginner: [
        {
          name: 'EZ Bar Curl Builder',
          duration: '12–14 min',
          description: 'Standard barbell curl workout for joint-friendly loading.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 EZ Bar Curl — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "EZ Bar Curl",
                    "sets": 4,
                    "reps": "12",
                    "note": "standard reps",
                    "tutorialSlug": "ez_bar_curl"
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240795/mood_app/workout_images/iskvqgub_download_4_.jpg',
          intensityReason: 'EZ bar reduces wrist stress for comfortable curling',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Wrists stay neutral',
              description: 'Elbow comfort'
            },
            {
              icon: 'trending-up',
              title: 'Bar path straight up',
              description: 'Prevents shoulder drift'
            },
            {
              icon: 'flash',
              title: 'Lower fully, squeeze hard at top',
              description: 'Stretch + flex = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Tempo EZ Curl',
          duration: '12–14 min',
          description: 'Eccentric-focused curl workout emphasizing control.',
          battlePlan: 'Battle Plan — Eccentric Sets\n• 4×10 EZ Curl — eccentric reps (3s down)\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "EZ Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "eccentric reps (3s down)",
                    "tutorialSlug": "ez_bar_curl"
                  }
                ],
                "label": "Eccentric Sets",
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240795/mood_app/workout_images/iskvqgub_download_4_.jpg',
          intensityReason: 'Slow eccentrics build strength through control',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Slow negatives matter',
              description: 'Biceps respond well to eccentrics'
            },
            {
              icon: 'body',
              title: 'Elbows don\'t drift forward',
              description: 'Keeps tension local'
            },
            {
              icon: 'flash',
              title: 'Stretch at bottom, flex fully',
              description: 'Controlled range drives pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Close-Grip EZ Curl',
          duration: '12–14 min',
          description: 'Standard close-grip curl workout biasing long head.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Close-Grip EZ Curl — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Close-Grip EZ Curl",
                    "sets": 4,
                    "reps": "12",
                    "note": "standard reps"
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240570/mood_app/workout_images/annq3ae8_download_3_.jpg',
          intensityReason: 'Close grip emphasizes long head development',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Hands inside shoulder width',
              description: 'Long-head bias'
            },
            {
              icon: 'refresh',
              title: 'Smooth tempo',
              description: 'No jerking'
            },
            {
              icon: 'flash',
              title: 'Full ROM every rep',
              description: 'Better pump than heavier load'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Curl + Iso Finish',
          duration: '12–14 min',
          description: 'Standard curl workout with squeeze-to-finish at peak flexion.',
          battlePlan: 'Battle Plan — Standard + Isometric Finish\n• 4×10 EZ Curl — standard reps\n• Final set: squeeze to finish — hold bar at top 8–10s\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "EZ Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "standard reps; Final set: squeeze to finish — hold bar at top 8–10s",
                    "tutorialSlug": "ez_bar_curl"
                  }
                ],
                "label": "Standard + Isometric Finish",
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240571/mood_app/workout_images/b35vwad0_download_4_.jpg',
          intensityReason: 'Isometric finish maximizes muscle engagement',
          moodTips: [
            {
              icon: 'body',
              title: 'Elbows stay locked in place',
              description: 'No shoulder help'
            },
            {
              icon: 'flash',
              title: 'Flex hard during the hold',
              description: 'Neural drive matters'
            },
            {
              icon: 'fitness',
              title: 'Use lighter bar for the hold',
              description: 'Longer contraction = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Wide-Grip EZ Curl',
          duration: '14–16 min',
          description: 'Standard curl workout biasing short head.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×10 Wide-Grip EZ Curl — standard reps\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Wide-Grip EZ Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "standard reps"
                  }
                ],
                "label": "Standard Sets",
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240795/mood_app/workout_images/iskvqgub_download_4_.jpg',
          intensityReason: 'Wide grip targets short head for peak development',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Grip wider than shoulders',
              description: 'Short-head emphasis'
            },
            {
              icon: 'body',
              title: 'No torso swing',
              description: 'Keeps tension pure'
            },
            {
              icon: 'flash',
              title: 'Squeeze hard at top',
              description: 'Short head pumps fast'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Paused EZ Curl',
          duration: '14–16 min',
          description: 'Pause-rep curl workout eliminating momentum.',
          battlePlan: 'Battle Plan — Pause Sets\n• 4×10 EZ Curl — pause reps (1s halfway)\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "EZ Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "pause reps (1s halfway)",
                    "tutorialSlug": "ez_bar_curl"
                  }
                ],
                "label": "Pause Sets",
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240795/mood_app/workout_images/iskvqgub_download_4_.jpg',
          intensityReason: 'Pauses eliminate momentum for honest loading',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause kills stretch reflex',
              description: 'Honest loading'
            },
            {
              icon: 'hand-left',
              title: 'Grip tight',
              description: 'Improves force output'
            },
            {
              icon: 'flash',
              title: 'Finish each rep with intent',
              description: 'Strong contraction = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'EZ Curl Burn Builder',
          duration: '15–17 min',
          description: 'Burnout curl workout emphasizing time under tension.',
          battlePlan: 'Battle Plan — Burnout Sets\n• 4×15 EZ Curl — burnout reps\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "EZ Curl",
                    "sets": 4,
                    "reps": "15",
                    "note": "burnout reps",
                    "tutorialSlug": "ez_bar_curl"
                  }
                ],
                "label": "Burnout Sets",
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240570/mood_app/workout_images/annq3ae8_download_3_.jpg',
          intensityReason: 'Extended reps build endurance and pump',
          moodTips: [
            {
              icon: 'shield',
              title: 'No lockout at bottom',
              description: 'Constant tension'
            },
            {
              icon: 'refresh',
              title: 'Smooth cadence',
              description: 'Keeps elbows happy'
            },
            {
              icon: 'flash',
              title: 'Moderate weight, nonstop reps',
              description: 'Burnout = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'pump',
          intensity_cost: 4,
        },
        {
          name: 'Curl + Reverse Curl Contrast',
          duration: '15–17 min',
          description: 'Superset workout pairing supinated and pronated grips.',
          battlePlan: 'Battle Plan — Superset\n• 4×10 EZ Curl — standard reps\nsuperset with\n• 10 Reverse EZ Curls\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "EZ Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "standard reps",
                    "tutorialSlug": "ez_bar_curl"
                  },
                  {
                    "name": "Reverse EZ Curls",
                    "reps": "10",
                    "note": "superset with"
                  }
                ],
                "label": "Superset",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240571/mood_app/workout_images/b35vwad0_download_4_.jpg',
          intensityReason: 'Two grip styles maximize forearm and bicep development',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Supinated first',
              description: 'Max biceps output'
            },
            {
              icon: 'fitness',
              title: 'Reverse curls finish forearms',
              description: 'Support elbow health'
            },
            {
              icon: 'flash',
              title: 'Control both tops',
              description: 'Two squeezes = bigger pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy EZ Curl Builder',
          duration: '18–20 min',
          description: 'Standard heavy curl workout emphasizing control.',
          battlePlan: 'Battle Plan — Standard Sets\n• 6×6 EZ Curl — standard reps\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "EZ Curl",
                    "sets": 6,
                    "reps": "6",
                    "note": "standard reps",
                    "tutorialSlug": "ez_bar_curl"
                  }
                ],
                "label": "Standard Sets",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240795/mood_app/workout_images/iskvqgub_download_4_.jpg',
          intensityReason: 'Heavy loads with strict form build maximum strength',
          moodTips: [
            {
              icon: 'body',
              title: 'No torso movement',
              description: 'Load stays honest'
            },
            {
              icon: 'trending-down',
              title: 'Lower slower than you lift',
              description: 'Eccentric overload'
            },
            {
              icon: 'flash',
              title: 'Finish reps with a squeeze',
              description: 'Contracted biceps matter'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'EZ Curl Drop Cluster',
          duration: '18–20 min',
          description: 'Multi-drop curl workout driving fatigue safely.',
          battlePlan: 'Battle Plan — Drop Cluster\n• Set 1: 10 reps\n• Set 2: drop set — 10 → drop ~20% → 8\n• Set 3: triple drop — 8 → drop ~15% → 6 → drop ~10% → 6\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [],
                "label": "Drop Cluster",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240795/mood_app/workout_images/iskvqgub_download_4_.jpg',
          intensityReason: 'Drop clusters extend time under tension past failure',
          moodTips: [
            {
              icon: 'flash',
              title: 'Plate changes are immediate',
              description: 'No walking away'
            },
            {
              icon: 'shield',
              title: 'Smaller drops preserve elbow comfort',
              description: 'Keep reps clean'
            },
            {
              icon: 'timer',
              title: 'End each set with a flex',
              description: 'Peak contraction seals pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'EZ Curl Burnout Hold',
          duration: '18–20 min',
          description: 'Burnout + isometric curl workout.',
          battlePlan: 'Battle Plan — Burnout + Isometric\n• 4×12 EZ Curl — burnout reps\n• Final set: squeeze to finish — hold top 10s\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "EZ Curl",
                    "sets": 4,
                    "reps": "12",
                    "note": "burnout reps; Final set: squeeze to finish — hold top 10s",
                    "tutorialSlug": "ez_bar_curl"
                  }
                ],
                "label": "Burnout + Isometric",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240570/mood_app/workout_images/annq3ae8_download_3_.jpg',
          intensityReason: 'Burnout with iso hold completely exhausts biceps',
          moodTips: [
            {
              icon: 'shield',
              title: 'No cheating allowed',
              description: 'Fatigue should be local'
            },
            {
              icon: 'flash',
              title: 'Flex hard during hold',
              description: 'Neuromuscular demand'
            },
            {
              icon: 'fitness',
              title: 'Lighter bar, longer hold',
              description: 'Pump > ego'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: '1.5-Rep EZ Curl',
          duration: '18–20 min',
          description: 'Partial-range curl workout extending time under tension.',
          battlePlan: 'Battle Plan — Standard Sets\n• 5×8 EZ Curl — 1.5 reps\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "EZ Curl",
                    "sets": 5,
                    "reps": "8",
                    "note": "1.5 reps",
                    "tutorialSlug": "ez_bar_curl"
                  }
                ],
                "label": "Standard Sets",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240571/mood_app/workout_images/b35vwad0_download_4_.jpg',
          intensityReason: '1.5 reps double time under tension per rep',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Half rep stays near top',
              description: 'Contracted range emphasized'
            },
            {
              icon: 'timer',
              title: 'Smooth transitions',
              description: 'No bouncing'
            },
            {
              icon: 'flash',
              title: 'Top-range tension dominates',
              description: 'Biceps stay pumped'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'strength',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Cable Machine',
    icon: 'swap-vertical',
    workouts: {
      beginner: [
        {
          name: 'Standing Cable Curl Builder',
          duration: '12–14 min',
          description: 'Standard cable curl workout emphasizing constant tension.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Standing Cable Curl — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Standing Cable Curl",
                    "sets": 4,
                    "reps": "12",
                    "note": "standard reps"
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240587/mood_app/workout_images/yv5l5jby_cable_curl.jpg',
          intensityReason: 'Cables provide constant tension throughout the movement',
          moodTips: [
            {
              icon: 'body',
              title: 'Elbows stay pinned',
              description: 'Prevents shoulder takeover'
            },
            {
              icon: 'refresh',
              title: 'Smooth pull, smooth return',
              description: 'Cables reward control'
            },
            {
              icon: 'trending-up',
              title: 'Step back slightly for stretch',
              description: 'Longer starting position = better pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Rope Cable Curl',
          duration: '12–14 min',
          description: 'Standard neutral-grip curl workout for elbow-friendly loading.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Rope Cable Curl — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Rope Cable Curl",
                    "sets": 4,
                    "reps": "12",
                    "note": "standard reps",
                    "tutorialSlug": "cable_rope_curl"
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240797/mood_app/workout_images/jzrqwni6_download.jpg',
          intensityReason: 'Neutral grip with constant cable tension hits brachialis',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Split the rope at the top',
              description: 'Improves peak contraction'
            },
            {
              icon: 'fitness',
              title: 'Wrists stay neutral',
              description: 'Brachialis engagement'
            },
            {
              icon: 'flash',
              title: 'Light load, full ROM',
              description: 'Continuous tension = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'hammer_curl',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Seated Low Cable Curl',
          duration: '12–14 min',
          description: 'Standard seated curl workout removing momentum.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Seated Low Cable Curl — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Seated Low Cable Curl",
                    "sets": 4,
                    "reps": "12",
                    "note": "standard reps"
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240575/mood_app/workout_images/lz1p2boy_seated_low_cable_curl.jpg',
          intensityReason: 'Seated position removes momentum for pure biceps isolation',
          moodTips: [
            {
              icon: 'body',
              title: 'Sit tall, don\'t lean',
              description: 'Zero cheating'
            },
            {
              icon: 'trending-down',
              title: 'Let arms fully extend',
              description: 'Cable stretch hits hard'
            },
            {
              icon: 'flash',
              title: 'Stretch deep, squeeze tight',
              description: 'Long-to-short tension fuels pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Curl + Iso Finish',
          duration: '12–14 min',
          description: 'Standard cable curl workout with squeeze-to-finish at peak flexion.',
          battlePlan: 'Battle Plan — Standard + Isometric Finish\n• 4×10 Cable Curl — standard reps\n• Final set: squeeze to finish — hold handle at full elbow flexion 8–10s\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Cable Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "standard reps; Final set: squeeze to finish — hold handle at full elbow flexion 8–10s",
                    "tutorialSlug": "cable_straight_bar_curl"
                  }
                ],
                "label": "Standard + Isometric Finish",
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240573/mood_app/workout_images/f0ehglmc_cable_curl_2.jpg',
          intensityReason: 'Isometric finish with cable tension maximizes pump',
          moodTips: [
            {
              icon: 'flash',
              title: 'Flex as hard as possible',
              description: 'Biceps respond to intent'
            },
            {
              icon: 'body',
              title: 'Elbows frozen during hold',
              description: 'Keeps tension local'
            },
            {
              icon: 'fitness',
              title: 'Reduce load for the hold',
              description: 'Longer squeeze = bigger pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Incline Cable Curl',
          duration: '14–16 min',
          description: 'Standard long-head curl workout using shoulder extension.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×10 Incline Cable Curl — standard reps\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Incline Cable Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "standard reps",
                    "tutorialSlug": "incline_db_curl"
                  }
                ],
                "label": "Standard Sets",
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240905/mood_app/workout_images/qi05o2xg_download_19_.jpg',
          intensityReason: 'Incline position with cable creates extreme long-head stretch',
          moodTips: [
            {
              icon: 'body',
              title: 'Bench low, arms back',
              description: 'Long-head bias'
            },
            {
              icon: 'timer',
              title: 'Don\'t rush the bottom',
              description: 'Stretch drives growth'
            },
            {
              icon: 'trending-up',
              title: 'Lean back slightly',
              description: 'Cable stretch amplifies pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Paused Cable Curl',
          duration: '14–16 min',
          description: 'Pause-rep cable curl workout eliminating momentum.',
          battlePlan: 'Battle Plan — Pause Sets\n• 4×10 Cable Curl — pause reps (1s halfway)\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Cable Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "pause reps (1s halfway)",
                    "tutorialSlug": "cable_straight_bar_curl"
                  }
                ],
                "label": "Pause Sets",
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240911/mood_app/workout_images/vqw55nvb_download_18_.jpg',
          intensityReason: 'Pauses eliminate cable rebound for honest tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause kills cable rebound',
              description: 'Honest tension'
            },
            {
              icon: 'hand-left',
              title: 'Grip stays tight',
              description: 'Improves neural drive'
            },
            {
              icon: 'flash',
              title: 'Finish with a hard squeeze',
              description: 'Shortened biceps pump best'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Single-Arm Cable Curl Burn',
          duration: '15–17 min',
          description: 'Burnout-style unilateral curl workout for extended tension.',
          battlePlan: 'Battle Plan — Burnout Sets\n• 4×14 Single-Arm Cable Curls — burnout reps\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Single-Arm Cable Curls",
                    "sets": 4,
                    "reps": "14",
                    "note": "burnout reps"
                  }
                ],
                "label": "Burnout Sets",
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240905/mood_app/workout_images/qi05o2xg_download_19_.jpg',
          intensityReason: 'Unilateral work with continuous cable tension builds endurance',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Alternate sides without rest',
              description: 'Density increases fatigue'
            },
            {
              icon: 'body',
              title: 'No torso twist',
              description: 'Isolates biceps'
            },
            {
              icon: 'trending-up',
              title: 'Step further back as fatigue rises',
              description: 'Stretch keeps pump alive'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'pump',
          intensity_cost: 4,
        },
        {
          name: 'Curl + Face-Away Curl Contrast',
          duration: '15–17 min',
          description: 'Superset workout pairing front-facing and face-away curls.',
          battlePlan: 'Battle Plan — Superset\n• 4×10 Cable Curl (facing stack) — standard reps\nsuperset with\n• 10 Face-Away Cable Curls\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Cable Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "standard reps",
                    "tutorialSlug": "cable_straight_bar_curl"
                  },
                  {
                    "name": "Face-Away Cable Curls",
                    "reps": "10",
                    "note": "superset with"
                  }
                ],
                "label": "Superset",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240911/mood_app/workout_images/vqw55nvb_download_18_.jpg',
          intensityReason: 'Two angles maximize stretch and contraction phases',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Face-away curls stretch hardest',
              description: 'Long-head emphasis'
            },
            {
              icon: 'body',
              title: 'Keep shoulders fixed',
              description: 'Prevents cheating'
            },
            {
              icon: 'flash',
              title: 'Long stretch, hard squeeze',
              description: 'Two angles = massive pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Cable Curl Builder',
          duration: '18–20 min',
          description: 'Standard heavy cable curl workout emphasizing control.',
          battlePlan: 'Battle Plan — Standard Sets\n• 6×8 Cable Curl — standard reps\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Cable Curl",
                    "sets": 6,
                    "reps": "8",
                    "note": "standard reps",
                    "tutorialSlug": "cable_straight_bar_curl"
                  }
                ],
                "label": "Standard Sets",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240913/mood_app/workout_images/waan6rau_download_20_.jpg',
          intensityReason: 'Heavy cable loads with constant tension build strength',
          moodTips: [
            {
              icon: 'body',
              title: 'No body sway',
              description: 'Load stays honest'
            },
            {
              icon: 'trending-down',
              title: 'Slow negatives',
              description: 'Cable eccentrics hit hard'
            },
            {
              icon: 'flash',
              title: 'Finish every rep with intent',
              description: 'Peak flexion matters'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Cable Curl Drop Ladder',
          duration: '18–20 min',
          description: 'Multi-drop cable curl workout driving mechanical fatigue.',
          battlePlan: 'Battle Plan — Drop Ladder\n• 3 rounds:\n  10 reps → drop ~15% → 8 reps → drop ~10% → AMRAP\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "reps → drop ~15% → 8 reps → drop ~10% → AMRAP",
                    "reps": "10"
                  }
                ],
                "rounds": 3,
                "label": "Drop Ladder",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240913/mood_app/workout_images/waan6rau_download_20_.jpg',
          intensityReason: 'Cable drop sets maintain tension without momentum',
          moodTips: [
            {
              icon: 'flash',
              title: 'Pin changes immediately',
              description: 'No stepping away'
            },
            {
              icon: 'shield',
              title: 'Smaller drops keep tension high',
              description: 'Cables don\'t need big drops'
            },
            {
              icon: 'timer',
              title: 'End ladders with a squeeze',
              description: 'Contracted biceps seal the pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Cable Curl Burnout Hold',
          duration: '18–20 min',
          description: 'Burnout + isometric cable curl workout.',
          battlePlan: 'Battle Plan — Burnout + Isometric\n• 4×15 Cable Curl — burnout reps\n• Final set: squeeze to finish — hold at peak flexion 10s\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Cable Curl",
                    "sets": 4,
                    "reps": "15",
                    "note": "burnout reps; Final set: squeeze to finish — hold at peak flexion 10s",
                    "tutorialSlug": "cable_straight_bar_curl"
                  }
                ],
                "label": "Burnout + Isometric",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240797/mood_app/workout_images/jzrqwni6_download.jpg',
          intensityReason: 'Burnout with iso hold under cable tension exhausts biceps',
          moodTips: [
            {
              icon: 'shield',
              title: 'Nonstop tension',
              description: 'No resting on the stack'
            },
            {
              icon: 'flash',
              title: 'Flex aggressively',
              description: 'Neural drive counts'
            },
            {
              icon: 'trending-up',
              title: 'Step back slightly',
              description: 'Stretch + hold = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: '1.5-Rep Cable Curl',
          duration: '18–20 min',
          description: 'Partial-range curl workout emphasizing the strongest range.',
          battlePlan: 'Battle Plan — Standard Sets\n• 5×8 Cable Curl — 1.5 reps\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Cable Curl",
                    "sets": 5,
                    "reps": "8",
                    "note": "1.5 reps",
                    "tutorialSlug": "cable_straight_bar_curl"
                  }
                ],
                "label": "Standard Sets",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240790/mood_app/workout_images/3z2y67t7_cc.jpg',
          intensityReason: '1.5 reps with cable tension double time under tension',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Half rep stays near top',
              description: 'Contracted bias'
            },
            {
              icon: 'timer',
              title: 'Smooth transitions',
              description: 'No jerking'
            },
            {
              icon: 'flash',
              title: 'Top-range dominance',
              description: 'Cables keep delts out, biceps pumped'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'strength',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Preacher Curl Machine',
    icon: 'desktop',
    workouts: {
      beginner: [
        {
          name: 'Preacher Curl Builder',
          duration: '12–14 min',
          description: 'Standard preacher curl workout emphasizing strict elbow flexion.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Preacher Machine Curl — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Preacher Machine Curl",
                    "sets": 4,
                    "reps": "12",
                    "note": "standard reps"
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240798/mood_app/workout_images/rmfkhn59_download_6_.jpg',
          intensityReason: 'Preacher pad eliminates cheating for pure biceps isolation',
          moodTips: [
            {
              icon: 'body',
              title: 'Upper arms glued to pad',
              description: 'Zero momentum'
            },
            {
              icon: 'trending-down',
              title: 'Control the bottom',
              description: 'Protects elbows'
            },
            {
              icon: 'flash',
              title: 'Stretch deep, squeeze hard',
              description: 'Preacher pumps brutally'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'preacher_curl',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Tempo Preacher Curl',
          duration: '12–14 min',
          description: 'Eccentric-focused preacher curl workout emphasizing control.',
          battlePlan: 'Battle Plan — Eccentric Sets\n• 4×10 Preacher Curl — eccentric reps (3s down)\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Preacher Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "eccentric reps (3s down)"
                  }
                ],
                "label": "Eccentric Sets",
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240787/mood_app/workout_images/2h81ucwk_download_5_.jpg',
          intensityReason: 'Slow eccentrics on preacher pad hit hard',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Slow negatives matter',
              description: 'Preacher eccentrics hit hard'
            },
            {
              icon: 'shield',
              title: 'No lockout',
              description: 'Keeps tension'
            },
            {
              icon: 'flash',
              title: 'Bottom stretch fuels pump',
              description: 'Long range dominates'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'preacher_curl',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Close-Grip Preacher Curl',
          duration: '12–14 min',
          description: 'Standard narrow-grip preacher curl biasing long head.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Close-Grip Preacher Curl — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Close-Grip Preacher Curl",
                    "sets": 4,
                    "reps": "12",
                    "note": "standard reps"
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240578/mood_app/workout_images/otlde2yi_preacher_curl_3.jpg',
          intensityReason: 'Close grip on preacher targets long head effectively',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Hands narrow',
              description: 'Long-head emphasis'
            },
            {
              icon: 'fitness',
              title: 'Wrists neutral',
              description: 'Elbow comfort'
            },
            {
              icon: 'flash',
              title: 'Full ROM every rep',
              description: 'Better pump than load'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'preacher_curl',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Curl + Iso Finish',
          duration: '12–14 min',
          description: 'Standard preacher curl workout with squeeze-to-finish at peak flexion.',
          battlePlan: 'Battle Plan — Standard + Isometric Finish\n• 4×10 Preacher Curl — standard reps\n• Final set: squeeze to finish — hold top 8–10s\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Preacher Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "standard reps; Final set: squeeze to finish — hold top 8–10s"
                  }
                ],
                "label": "Standard + Isometric Finish",
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240574/mood_app/workout_images/g54uz2wp_preacher_curl.jpg',
          intensityReason: 'Isometric finish on preacher maximizes contraction',
          moodTips: [
            {
              icon: 'flash',
              title: 'Flex hard',
              description: 'Preacher removes cheating'
            },
            {
              icon: 'body',
              title: 'Elbows stay pressed into pad',
              description: 'Keeps tension pure'
            },
            {
              icon: 'fitness',
              title: 'Use lighter load for hold',
              description: 'Longer squeeze = better pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'preacher_curl',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Paused Preacher Curl',
          duration: '14–16 min',
          description: 'Pause-rep preacher curl workout removing momentum.',
          battlePlan: 'Battle Plan — Pause Sets\n• 4×10 Preacher Curl — pause reps (1s bottom)\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Preacher Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "pause reps (1s bottom)"
                  }
                ],
                "label": "Pause Sets",
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240798/mood_app/workout_images/rmfkhn59_download_6_.jpg',
          intensityReason: 'Bottom pauses on preacher eliminate all momentum',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause kills bounce',
              description: 'Honest tension'
            },
            {
              icon: 'body',
              title: 'Brace into pad',
              description: 'Stability matters'
            },
            {
              icon: 'flash',
              title: 'Explode into contraction',
              description: 'Smooth squeeze fuels pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'preacher_curl',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Wide-Grip Preacher Curl',
          duration: '14–16 min',
          description: 'Standard preacher curl workout biasing short head.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×10 Wide-Grip Preacher Curl — standard reps\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Wide-Grip Preacher Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "standard reps"
                  }
                ],
                "label": "Standard Sets",
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240787/mood_app/workout_images/2h81ucwk_download_5_.jpg',
          intensityReason: 'Wide grip on preacher targets short head for peak development',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Grip wide',
              description: 'Short-head focus'
            },
            {
              icon: 'body',
              title: 'No shoulder lift',
              description: 'Isolation preserved'
            },
            {
              icon: 'flash',
              title: 'Short-head pumps fast',
              description: 'Lean into the burn'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'preacher_curl',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Preacher Burn Builder',
          duration: '15–17 min',
          description: 'Burnout preacher curl workout emphasizing time under tension.',
          battlePlan: 'Battle Plan — Burnout Sets\n• 4×15 Preacher Curl — burnout reps\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Preacher Curl",
                    "sets": 4,
                    "reps": "15",
                    "note": "burnout reps"
                  }
                ],
                "label": "Burnout Sets",
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240578/mood_app/workout_images/otlde2yi_preacher_curl_3.jpg',
          intensityReason: 'Extended reps on preacher build endurance and pump',
          moodTips: [
            {
              icon: 'shield',
              title: 'No lockout allowed',
              description: 'Constant tension'
            },
            {
              icon: 'refresh',
              title: 'Smooth cadence',
              description: 'Elbow-friendly'
            },
            {
              icon: 'flash',
              title: 'Moderate load, nonstop reps',
              description: 'Burnout = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'preacher_curl',
          training_style: 'pump',
          intensity_cost: 4,
        },
        {
          name: 'Full + Partial Contrast',
          duration: '15–17 min',
          description: 'Superset workout pairing full ROM with top-range preacher reps.',
          battlePlan: 'Battle Plan — Superset\n• 4×10 Preacher Curl — standard reps\nsuperset with\n• 10 Top-Range Partial Preacher Curls\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Preacher Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "standard reps"
                  },
                  {
                    "name": "Top-Range Partial Preacher Curls",
                    "reps": "10",
                    "note": "superset with"
                  }
                ],
                "label": "Superset",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240574/mood_app/workout_images/g54uz2wp_preacher_curl.jpg',
          intensityReason: 'Full and partial reps maximize fiber recruitment',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Full reps first',
              description: 'Fiber recruitment'
            },
            {
              icon: 'timer',
              title: 'Partials stay high',
              description: 'Peak tension'
            },
            {
              icon: 'flash',
              title: 'Short-range burn seals pump',
              description: 'Preacher excels here'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'preacher_curl',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Preacher Curl Builder',
          duration: '18–20 min',
          description: 'Standard heavy preacher curl workout emphasizing control.',
          battlePlan: 'Battle Plan — Standard Sets\n• 6×8 Preacher Curl — standard reps\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Preacher Curl",
                    "sets": 6,
                    "reps": "8",
                    "note": "standard reps"
                  }
                ],
                "label": "Standard Sets",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240798/mood_app/workout_images/rmfkhn59_download_6_.jpg',
          intensityReason: 'Heavy loads on preacher build strength without cheating',
          moodTips: [
            {
              icon: 'shield',
              title: 'No ego loading',
              description: 'Preacher punishes cheating'
            },
            {
              icon: 'trending-down',
              title: 'Control negatives',
              description: 'Elbow safety'
            },
            {
              icon: 'flash',
              title: 'Finish reps with intent',
              description: 'Contracted biceps matter'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'preacher_curl',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Preacher Drop Cluster',
          duration: '18–20 min',
          description: 'Multi-drop preacher curl workout driving fatigue.',
          battlePlan: 'Battle Plan — Drop Cluster\n• Set 1: 10 reps\n• Set 2: drop set — 10 → drop ~20% → 8\n• Set 3: triple drop — 8 → drop ~15% → 6 → drop ~10% → 6\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [],
                "label": "Drop Cluster",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240798/mood_app/workout_images/rmfkhn59_download_6_.jpg',
          intensityReason: 'Drop clusters on preacher extend time under tension',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drops are immediate',
              description: 'Stay on the pad'
            },
            {
              icon: 'shield',
              title: 'Smaller drops protect elbows',
              description: 'Keep reps clean'
            },
            {
              icon: 'timer',
              title: 'End with a hard squeeze',
              description: 'Peak contraction seals pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'preacher_curl',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Preacher Burnout Hold',
          duration: '18–20 min',
          description: 'Burnout + isometric preacher curl workout.',
          battlePlan: 'Battle Plan — Burnout + Isometric\n• 4×12 Preacher Curl — burnout reps\n• Final set: squeeze to finish — hold top 10s\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Preacher Curl",
                    "sets": 4,
                    "reps": "12",
                    "note": "burnout reps; Final set: squeeze to finish — hold top 10s"
                  }
                ],
                "label": "Burnout + Isometric",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240578/mood_app/workout_images/otlde2yi_preacher_curl_3.jpg',
          intensityReason: 'Burnout with iso hold on preacher exhausts biceps completely',
          moodTips: [
            {
              icon: 'flash',
              title: 'Flex aggressively',
              description: 'Preacher isolates brutally'
            },
            {
              icon: 'shield',
              title: 'No resting on pad',
              description: 'Tension stays high'
            },
            {
              icon: 'fitness',
              title: 'Lighter load, longer hold',
              description: 'Pump > ego'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'preacher_curl',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: '1.5-Rep Preacher Curl',
          duration: '18–20 min',
          description: 'Partial-range preacher curl workout increasing time under tension.',
          battlePlan: 'Battle Plan — Standard Sets\n• 5×8 Preacher Curl — 1.5 reps\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Preacher Curl",
                    "sets": 5,
                    "reps": "8",
                    "note": "1.5 reps"
                  }
                ],
                "label": "Standard Sets",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240574/mood_app/workout_images/g54uz2wp_preacher_curl.jpg',
          intensityReason: '1.5 reps on preacher double time under tension per rep',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Half rep near top',
              description: 'Contracted emphasis'
            },
            {
              icon: 'timer',
              title: 'Smooth transitions',
              description: 'No bouncing'
            },
            {
              icon: 'flash',
              title: 'Preacher tension stays constant',
              description: 'Biceps stay pumped'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'preacher_curl',
          training_style: 'strength',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Biceps Curl Machine',
    icon: 'fitness',
    workouts: {
      beginner: [
        {
          name: 'Machine Curl Builder',
          duration: '12–14 min',
          description: 'Standard machine curl workout for clean biceps isolation.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Machine Biceps Curl — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Machine Biceps Curl",
                    "sets": 4,
                    "reps": "12",
                    "note": "standard reps"
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240799/mood_app/workout_images/um46qpzr_download_3_.jpg',
          intensityReason: 'Fixed path machine provides perfect biceps isolation',
          moodTips: [
            {
              icon: 'body',
              title: 'Seat height correct',
              description: 'Elbows line up with pivot'
            },
            {
              icon: 'refresh',
              title: 'Smooth cadence',
              description: 'Machines reward control'
            },
            {
              icon: 'flash',
              title: 'Lower fully, squeeze hard',
              description: 'Full ROM drives pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Tempo Machine Curl',
          duration: '12–14 min',
          description: 'Eccentric-focused machine curl workout emphasizing control.',
          battlePlan: 'Battle Plan — Eccentric Sets\n• 4×10 Machine Curl — eccentric reps (3s down)\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Machine Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "eccentric reps (3s down)"
                  }
                ],
                "label": "Eccentric Sets",
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240793/mood_app/workout_images/h9obln9e_download_2_.jpg',
          intensityReason: 'Slow eccentrics on machine hit brutally hard',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Slow negatives',
              description: 'Machine eccentrics are brutal'
            },
            {
              icon: 'shield',
              title: 'Don\'t lock out',
              description: 'Keeps tension constant'
            },
            {
              icon: 'flash',
              title: 'Stretch deep, squeeze tight',
              description: 'Machine pumps fast'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Close-Grip Machine Curl',
          duration: '12–14 min',
          description: 'Standard narrow-grip curl workout biasing long head.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Close-Grip Machine Curl — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Close-Grip Machine Curl",
                    "sets": 4,
                    "reps": "12",
                    "note": "standard reps"
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240586/mood_app/workout_images/tqfomss4_Screenshot_2026-02-02_at_11_52_43_PM.jpg',
          intensityReason: 'Narrow grip on machine targets long head',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Hands narrow',
              description: 'Long-head emphasis'
            },
            {
              icon: 'fitness',
              title: 'Wrists neutral',
              description: 'Elbow comfort'
            },
            {
              icon: 'flash',
              title: 'Full extension each rep',
              description: 'Better pump than heavier load'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Curl + Iso Finish',
          duration: '12–14 min',
          description: 'Standard machine curl workout with squeeze-to-finish at peak flexion.',
          battlePlan: 'Battle Plan — Standard + Isometric Finish\n• 4×10 Machine Curl — standard reps\n• Final set: squeeze to finish — hold handles at top 8–10s\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Machine Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "standard reps; Final set: squeeze to finish — hold handles at top 8–10s"
                  }
                ],
                "label": "Standard + Isometric Finish",
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240582/mood_app/workout_images/qfupz5zv_bicep_curl_machine.jpg',
          intensityReason: 'Isometric finish on machine maximizes contraction',
          moodTips: [
            {
              icon: 'flash',
              title: 'Flex hard during hold',
              description: 'Neural drive matters'
            },
            {
              icon: 'body',
              title: 'Elbows stay planted',
              description: 'Machine advantage'
            },
            {
              icon: 'fitness',
              title: 'Use lighter pin for hold',
              description: 'Longer squeeze = better pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Paused Machine Curl',
          duration: '14–16 min',
          description: 'Pause-rep machine curl workout eliminating momentum.',
          battlePlan: 'Battle Plan — Pause Sets\n• 4×10 Machine Curl — pause reps (1s halfway)\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Machine Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "pause reps (1s halfway)"
                  }
                ],
                "label": "Pause Sets",
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240799/mood_app/workout_images/um46qpzr_download_3_.jpg',
          intensityReason: 'Pauses eliminate machine assist for pure biceps work',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause kills assist',
              description: 'Pure biceps'
            },
            {
              icon: 'hand-left',
              title: 'Grip stays tight',
              description: 'Improves output'
            },
            {
              icon: 'flash',
              title: 'Finish each rep strong',
              description: 'Contracted biceps dominate'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Wide-Grip Machine Curl',
          duration: '14–16 min',
          description: 'Standard curl workout biasing short head.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×10 Wide-Grip Machine Curl — standard reps\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Wide-Grip Machine Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "standard reps"
                  }
                ],
                "label": "Standard Sets",
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240793/mood_app/workout_images/h9obln9e_download_2_.jpg',
          intensityReason: 'Wide grip on machine targets inner biceps',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Grip wide',
              description: 'Inner biceps focus'
            },
            {
              icon: 'body',
              title: 'No torso movement',
              description: 'Isolation preserved'
            },
            {
              icon: 'flash',
              title: 'Short-head squeeze hits fast',
              description: 'Pump builds quickly'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Machine Curl Burn Builder',
          duration: '15–17 min',
          description: 'Burnout-style machine curl workout extending time under tension.',
          battlePlan: 'Battle Plan — Burnout Sets\n• 4×15 Machine Curl — burnout reps\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Machine Curl",
                    "sets": 4,
                    "reps": "15",
                    "note": "burnout reps"
                  }
                ],
                "label": "Burnout Sets",
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240586/mood_app/workout_images/tqfomss4_Screenshot_2026-02-02_at_11_52_43_PM.jpg',
          intensityReason: 'Extended reps on machine build endurance and pump',
          moodTips: [
            {
              icon: 'shield',
              title: 'No lockout allowed',
              description: 'Constant tension'
            },
            {
              icon: 'refresh',
              title: 'Steady cadence',
              description: 'Prevents joint stress'
            },
            {
              icon: 'flash',
              title: 'Moderate weight, nonstop reps',
              description: 'Burnout = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'pump',
          intensity_cost: 4,
        },
        {
          name: 'Curl + Partial Contrast',
          duration: '15–17 min',
          description: 'Superset workout pairing full ROM with top-range partials.',
          battlePlan: 'Battle Plan — Superset\n• 4×10 Machine Curl — standard reps\nsuperset with\n• 10 Top-Range Partial Curls\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Machine Curl",
                    "sets": 4,
                    "reps": "10",
                    "note": "standard reps"
                  },
                  {
                    "name": "Top-Range Partial Curls",
                    "reps": "10",
                    "note": "superset with"
                  }
                ],
                "label": "Superset",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240582/mood_app/workout_images/qfupz5zv_bicep_curl_machine.jpg',
          intensityReason: 'Full and partial reps maximize fiber recruitment',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Full reps first',
              description: 'Max fiber recruitment'
            },
            {
              icon: 'timer',
              title: 'Partials stay high',
              description: 'Peak tension'
            },
            {
              icon: 'flash',
              title: 'Short-range burn seals pump',
              description: 'Machine excels here'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Machine Curl Builder',
          duration: '18–20 min',
          description: 'Standard heavy machine curl workout emphasizing strict form.',
          battlePlan: 'Battle Plan — Standard Sets\n• 6×8 Machine Curl — standard reps\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Machine Curl",
                    "sets": 6,
                    "reps": "8",
                    "note": "standard reps"
                  }
                ],
                "label": "Standard Sets",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240799/mood_app/workout_images/um46qpzr_download_3_.jpg',
          intensityReason: 'Heavy loads on machine build strength without cheating',
          moodTips: [
            {
              icon: 'shield',
              title: 'No cheating possible',
              description: 'Embrace the grind'
            },
            {
              icon: 'trending-down',
              title: 'Control the negative',
              description: 'Eccentric overload'
            },
            {
              icon: 'flash',
              title: 'Finish reps with intent',
              description: 'Contracted biceps matter'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Machine Curl Drop Cluster',
          duration: '18–20 min',
          description: 'Multi-drop machine curl workout driving fatigue.',
          battlePlan: 'Battle Plan — Drop Cluster\n• Set 1: 10 reps\n• Set 2: drop set — 10 → drop ~20% → 8\n• Set 3: triple drop — 8 → drop ~15% → 6 → drop ~10% → 6\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [],
                "label": "Drop Cluster",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240799/mood_app/workout_images/um46qpzr_download_3_.jpg',
          intensityReason: 'Drop clusters on machine extend time under tension',
          moodTips: [
            {
              icon: 'flash',
              title: 'Pin changes immediately',
              description: 'Don\'t stand up'
            },
            {
              icon: 'shield',
              title: 'Smaller drops keep tension',
              description: 'Machines don\'t need big jumps'
            },
            {
              icon: 'timer',
              title: 'End sets with a squeeze',
              description: 'Peak contraction seals pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Machine Curl Burnout Hold',
          duration: '18–20 min',
          description: 'Burnout + isometric machine curl workout.',
          battlePlan: 'Battle Plan — Burnout + Isometric\n• 4×12 Machine Curl — burnout reps\n• Final set: squeeze to finish — hold top 10s\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Machine Curl",
                    "sets": 4,
                    "reps": "12",
                    "note": "burnout reps; Final set: squeeze to finish — hold top 10s"
                  }
                ],
                "label": "Burnout + Isometric",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240586/mood_app/workout_images/tqfomss4_Screenshot_2026-02-02_at_11_52_43_PM.jpg',
          intensityReason: 'Burnout with iso hold on machine exhausts biceps completely',
          moodTips: [
            {
              icon: 'flash',
              title: 'Flex aggressively',
              description: 'Neural drive matters'
            },
            {
              icon: 'shield',
              title: 'No resting on stack',
              description: 'Continuous tension'
            },
            {
              icon: 'fitness',
              title: 'Lighter pin, longer hold',
              description: 'Pump > ego'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: '1.5-Rep Machine Curl',
          duration: '18–20 min',
          description: 'Partial-range machine curl workout increasing time under tension.',
          battlePlan: 'Battle Plan — Standard Sets\n• 5×8 Machine Curl — 1.5 reps\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Machine Curl",
                    "sets": 5,
                    "reps": "8",
                    "note": "1.5 reps"
                  }
                ],
                "label": "Standard Sets",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240582/mood_app/workout_images/qfupz5zv_bicep_curl_machine.jpg',
          intensityReason: '1.5 reps on machine double time under tension per rep',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Half rep near top',
              description: 'Contracted emphasis'
            },
            {
              icon: 'timer',
              title: 'Smooth transitions',
              description: 'No bouncing'
            },
            {
              icon: 'flash',
              title: 'Machine tension stays high',
              description: 'Biceps stay pumped'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'curl',
          training_style: 'strength',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Pull-Up Bar',
    icon: 'remove-outline',
    workouts: {
      beginner: [
        {
          name: 'Chin-Up Builder',
          duration: '12–14 min',
          description: 'Standard chin-up workout emphasizing elbow flexion under bodyweight.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×AMRAP Chin-Ups — standard reps\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "4×AMRAP Chin-Ups",
                    "reps": "standard reps",
                    "tutorialSlug": "chin_ups"
                  }
                ],
                "label": "Standard Sets",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240786/mood_app/workout_images/2h4qn95p_download.jpg',
          intensityReason: 'Bodyweight chin-ups build functional pulling strength',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Supinated grip',
              description: 'Biceps bias'
            },
            {
              icon: 'trending-up',
              title: 'Pull chest to bar',
              description: 'Full elbow flexion'
            },
            {
              icon: 'trending-down',
              title: 'Control the bottom hang',
              description: 'Stretch loads the biceps'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'chin_up',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Band-Assisted Chin-Ups',
          duration: '12–14 min',
          description: 'Assisted bodyweight curl workout reducing load for clean reps.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×8–10 Assisted Chin-Ups — standard reps\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Assisted Chin-Ups",
                    "sets": 4,
                    "reps": "8–10",
                    "note": "standard reps",
                    "tutorialSlug": "chin_ups"
                  }
                ],
                "label": "Standard Sets",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240786/mood_app/workout_images/2h4qn95p_download.jpg',
          intensityReason: 'Band assistance allows proper form development',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Use minimal assistance',
              description: 'Biceps still work'
            },
            {
              icon: 'shield',
              title: 'No kipping',
              description: 'Pure pull'
            },
            {
              icon: 'flash',
              title: 'Hang fully each rep',
              description: 'Stretch builds pump'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'chin_up',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Negative Chin-Ups',
          duration: '12–14 min',
          description: 'Eccentric-focused bodyweight curl workout emphasizing control.',
          battlePlan: 'Battle Plan — Eccentric Sets\n• 4×5 Chin-Ups — eccentric reps (5s down)\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Chin-Ups",
                    "sets": 4,
                    "reps": "5",
                    "note": "eccentric reps (5s down)",
                    "tutorialSlug": "chin_ups"
                  }
                ],
                "label": "Eccentric Sets",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240795/mood_app/workout_images/iac5dn06_cups.jpg',
          intensityReason: 'Slow negatives build eccentric strength for full reps',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Jump or step to top',
              description: 'Save strength for negatives'
            },
            {
              icon: 'trending-down',
              title: 'Slow descent',
              description: 'Eccentric overload'
            },
            {
              icon: 'flash',
              title: 'Full hang between reps',
              description: 'Stretch intensifies pump'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'chin_up',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Chin-Up Hold Finish',
          duration: '12–14 min',
          description: 'Standard chin-up workout with squeeze-to-finish at peak flexion.',
          battlePlan: 'Battle Plan — Standard + Isometric Finish\n• 4×6 Chin-Ups — standard reps\n• Final set: squeeze to finish — hold chin over bar 10s\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Chin-Ups",
                    "sets": 4,
                    "reps": "6",
                    "note": "standard reps; Final set: squeeze to finish — hold chin over bar 10s",
                    "tutorialSlug": "chin_ups"
                  }
                ],
                "label": "Standard + Isometric Finish",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240795/mood_app/workout_images/iac5dn06_cups.jpg',
          intensityReason: 'Isometric hold at top maximizes biceps contraction',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Chest close to bar',
              description: 'Max elbow flexion'
            },
            {
              icon: 'body',
              title: 'Elbows tight',
              description: 'Biceps dominate'
            },
            {
              icon: 'flash',
              title: 'Hold at hardest point',
              description: 'Shortened biceps pump hardest'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'chin_up',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Tempo Chin-Ups',
          duration: '14–16 min',
          description: 'Tempo-controlled chin-up workout increasing time under tension.',
          battlePlan: 'Battle Plan — Eccentric Sets\n• 4×6 Chin-Ups — eccentric reps (3s down)\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Chin-Ups",
                    "sets": 4,
                    "reps": "6",
                    "note": "eccentric reps (3s down)",
                    "tutorialSlug": "chin_ups"
                  }
                ],
                "label": "Eccentric Sets",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240786/mood_app/workout_images/2h4qn95p_download.jpg',
          intensityReason: 'Controlled tempo maximizes time under tension',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Smooth cadence',
              description: 'No bouncing'
            },
            {
              icon: 'trending-down',
              title: 'Full extension each rep',
              description: 'Stretch matters'
            },
            {
              icon: 'flash',
              title: 'Slow lowers build pump',
              description: 'Bodyweight tension adds up'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'chin_up',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Close-Grip Chin-Ups',
          duration: '14–16 min',
          description: 'Grip-biased chin-up workout increasing elbow flexion demand.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×AMRAP Close-Grip Chin-Ups — standard reps\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "4×AMRAP Close-Grip Chin-Ups",
                    "reps": "standard reps",
                    "tutorialSlug": "chin_ups"
                  }
                ],
                "label": "Standard Sets",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240786/mood_app/workout_images/2h4qn95p_download.jpg',
          intensityReason: 'Close grip increases biceps demand',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Hands shoulder-width or closer',
              description: 'Biceps bias'
            },
            {
              icon: 'shield',
              title: 'No swinging',
              description: 'Clean pulls'
            },
            {
              icon: 'flash',
              title: 'Control top and bottom',
              description: 'Stretch + squeeze = pump'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'chin_up',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Chin-Up Burn Builder',
          duration: '15–17 min',
          description: 'Burnout-style chin-up workout extending fatigue.',
          battlePlan: 'Battle Plan — Burnout Sets\n• 5×AMRAP Chin-Ups — burnout reps\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "5×AMRAP Chin-Ups",
                    "reps": "burnout reps",
                    "tutorialSlug": "chin_ups"
                  }
                ],
                "label": "Burnout Sets",
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240795/mood_app/workout_images/iac5dn06_cups.jpg',
          intensityReason: 'Short rest burnout builds endurance and pump',
          moodTips: [
            {
              icon: 'timer',
              title: 'Shorter rest each set',
              description: 'Fatigue stacks'
            },
            {
              icon: 'shield',
              title: 'Partial reps allowed late',
              description: 'Stay in tension'
            },
            {
              icon: 'flash',
              title: 'Top-range focus',
              description: 'Biceps stay loaded'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'chin_up',
          training_style: 'pump',
          intensity_cost: 4,
        },
        {
          name: 'Chin-Up + Iso Hang Contrast',
          duration: '15–17 min',
          description: 'Superset workout pairing reps with isometric holds.',
          battlePlan: 'Battle Plan — Superset\n• 4×6 Chin-Ups — standard reps\nsuperset with\n• 20s Flexed-Arm Hang\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Chin-Ups",
                    "sets": 4,
                    "reps": "6",
                    "note": "standard reps",
                    "tutorialSlug": "chin_ups"
                  },
                  {
                    "name": "Flexed-Arm Hang",
                    "reps": "20s",
                    "note": "superset with"
                  }
                ],
                "label": "Superset",
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240795/mood_app/workout_images/iac5dn06_cups.jpg',
          intensityReason: 'Reps plus iso hang maximize biceps fatigue',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Chins first',
              description: 'Preserve strength'
            },
            {
              icon: 'body',
              title: 'Hang with elbows bent',
              description: 'Peak biceps tension'
            },
            {
              icon: 'flash',
              title: 'Hold where shaking starts',
              description: 'That\'s the pump zone'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'chin_up',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Weighted Chin-Up Builder',
          duration: '18–20 min',
          description: 'Standard weighted chin-up workout for advanced biceps loading.',
          battlePlan: 'Battle Plan — Standard Sets\n• 6×5 Weighted Chin-Ups — standard reps\nRest 120s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Weighted Chin-Ups",
                    "sets": 6,
                    "reps": "5",
                    "note": "standard reps",
                    "tutorialSlug": "chin_ups"
                  }
                ],
                "label": "Standard Sets",
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240786/mood_app/workout_images/2h4qn95p_download.jpg',
          intensityReason: 'Added weight builds serious pulling strength',
          moodTips: [
            {
              icon: 'construct',
              title: 'Add weight conservatively',
              description: 'Form over ego'
            },
            {
              icon: 'trending-down',
              title: 'Full ROM always',
              description: 'Stretch protects elbows'
            },
            {
              icon: 'flash',
              title: 'Explode up, control down',
              description: 'Tension builds pump'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'chin_up',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Weighted Chin-Up Drop Ladder',
          duration: '18–20 min',
          description: 'Multi-drop bodyweight workout driving fatigue.',
          battlePlan: 'Battle Plan — Drop Ladder\n• 3 rounds:\n  5 weighted reps → remove weight → AMRAP bodyweight → band-assist AMRAP\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Weighted Chin-Up Drop Ladder",
                    "reps": "5",
                    "tutorialSlug": "chin_ups"
                  }
                ],
                "rounds": 3,
                "label": "Drop Ladder",
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240786/mood_app/workout_images/2h4qn95p_download.jpg',
          intensityReason: 'Progressive drops extend set past failure',
          moodTips: [
            {
              icon: 'flash',
              title: 'Weight changes immediate',
              description: 'Stay on bar'
            },
            {
              icon: 'shield',
              title: 'Clean reps over grinding',
              description: 'Elbow safety'
            },
            {
              icon: 'timer',
              title: 'Finish each ladder with a flex',
              description: 'Contracted biceps seal pump'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'chin_up',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Chin-Up Burnout Hold',
          duration: '18–20 min',
          description: 'Burnout + isometric chin-up workout.',
          battlePlan: 'Battle Plan — Burnout + Isometric\n• 4×AMRAP Chin-Ups — burnout reps\n• Final set: squeeze to finish — hold top 10–15s\nRest 120s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "4×AMRAP Chin-Ups",
                    "reps": "burnout reps",
                    "tutorialSlug": "chin_ups",
                    "note": "Final set: squeeze to finish — hold top 10–15s"
                  }
                ],
                "label": "Burnout + Isometric",
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240795/mood_app/workout_images/iac5dn06_cups.jpg',
          intensityReason: 'Burnout with iso hold exhausts biceps completely',
          moodTips: [
            {
              icon: 'shield',
              title: 'No half-ass reps',
              description: 'Commit to each pull'
            },
            {
              icon: 'flash',
              title: 'Flex hard at the top',
              description: 'Peak contraction'
            },
            {
              icon: 'timer',
              title: 'Hold where elbows are tightest',
              description: 'True shortened position'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'chin_up',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: '1.5-Rep Chin-Ups',
          duration: '18–20 min',
          description: 'Partial-range chin-up workout increasing time under tension.',
          battlePlan: 'Battle Plan — Standard Sets\n• 5×4 Chin-Ups — 1.5 reps\nRest 120s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Chin-Ups",
                    "sets": 5,
                    "reps": "4",
                    "note": "1.5 reps",
                    "tutorialSlug": "chin_ups"
                  }
                ],
                "label": "Standard Sets",
                "rest": "120s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240795/mood_app/workout_images/iac5dn06_cups.jpg',
          intensityReason: '1.5 reps double time under tension per rep',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Half rep stays near top',
              description: 'Contracted emphasis'
            },
            {
              icon: 'timer',
              title: 'Smooth transitions',
              description: 'No jerking'
            },
            {
              icon: 'flash',
              title: 'Top-range dominance',
              description: 'Biceps stay pumped'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'chin_up',
          training_style: 'strength',
          intensity_cost: 5,
        }
      ]
    }
  }
];
