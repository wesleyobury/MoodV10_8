import { EquipmentWorkouts } from '../types/workout';

export const absWorkoutDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Body Weight',
    icon: 'body',
    workouts: {
      beginner: [
        {
          name: 'Standard Crunch',
          duration: '8–10 min',
          description: 'Simple crunch develops mind-muscle connection safely for beginner abs.\n ',
          battlePlan: 'Instructions: 3 sets of 12–15 — rest 45s between sets, take all of it.\n3 rounds\n• 12–15 Crunches\nRest 45s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Crunches",
                    "reps": "12–15",
                    "tutorialSlug": "crunches"
                  }
                ],
                "rounds": 3,
                "rest": "45s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240871/mood_app/workout_images/9ppti423_download_11_.jpg',
          intensityReason: 'Intro movement builds baseline flexion ab strength',
          moodTips: [
            {
              icon: 'construct',
              title: 'Curl upper back, don\'t yank neck',
              description: 'Proper form protects your neck and maximizes ab engagement.'
            },
            {
              icon: 'flash',
              title: 'Exhale as you reach contraction',
              description: 'Coordinated breathing enhances muscle activation.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'crunch',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Forearm Plank Hold',
          duration: '8–10 min',
          description: 'Teaches proper core bracing and builds strong foundational abdominal stability..\n ',
          battlePlan: 'Instructions: 3 sets of 20–30s — rest 45s between sets, take all of it.\n3 rounds\n• 3 × 20–30s Plank Holds\nRest 45s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Plank Holds",
                    "sets": 3,
                    "reps": "20–30s",
                    "tutorialSlug": "plank"
                  }
                ],
                "rounds": 3,
                "rest": "45s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240908/mood_app/workout_images/rptdlvng_download_12_.jpg',
          intensityReason: 'Static hold trains core for anti extension endurance',
          moodTips: [
            {
              icon: 'construct',
              title: 'Keep hips level, don\'t sag',
              description: 'Maintain proper plank alignment for maximum effectiveness.'
            },
            {
              icon: 'shield',
              title: 'Brace abs like resisting a hit',
              description: 'Think about bracing for impact to engage deep core muscles.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'plank',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Knee Tuck Crunch Circuit',
          duration: '8–10 min',
          description: 'Fast-paced floor circuit to build beginner ab endurance.',
          battlePlan: 'Instructions: 3 rounds — all 3 moves in order, then rest 45s.\n3 rounds\n• 15 Crunches\n• 12 Knee Tucks\n• 20 Alt Toe Taps\nRest 45s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Crunches",
                    "reps": "15",
                    "tutorialSlug": "crunches"
                  },
                  {
                    "name": "Knee Tucks",
                    "reps": "12",
                    "tutorialSlug": "knee_tuck_crunches"
                  },
                  {
                    "name": "Alt Toe Taps",
                    "reps": "20"
                  }
                ],
                "rounds": 3,
                "rest": "45s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240806/mood_app/workout_images/9b9bwjx3_Knee_tuck_crunch.jpg',
          intensityReason: 'Combines flexion + knee tuck without long levers',
          moodTips: [
            {
              icon: 'construct',
              title: 'Pull knees in using abs, not momentum',
              description: 'Focus on ab contraction to initiate movement.'
            },
            {
              icon: 'shield',
              title: 'Keep lower back lightly pressed into floor',
              description: 'Proper back position protects spine and maximizes ab work.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'High-Tempo Crunch Ladder',
          duration: '8–10 min',
          description: 'Simple but spicy crunch-based density workout.',
          battlePlan: 'Instructions: Ladder: work down the rungs — the reps drop as fatigue climbs. Rest only between rungs. Own the lowering — count the seconds down, then move normally on the way up. 4 rounds — all 3 moves in order, then rest 30–45s.\n4 rounds\n• 20 Crunches\n• 15 Crunches\n• 10 Crunches\nRest 30–45s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Crunches",
                    "reps": "20",
                    "tutorialSlug": "crunches"
                  },
                  {
                    "name": "Crunches",
                    "reps": "15",
                    "tutorialSlug": "crunches"
                  },
                  {
                    "name": "Crunches",
                    "reps": "10",
                    "tutorialSlug": "crunches"
                  }
                ],
                "rounds": 4,
                "rest": "30–45s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240807/mood_app/workout_images/b2yevch7_crunch.jpg',
          intensityReason: 'Short rest + fast reps increase metabolic ab demand',
          moodTips: [
            {
              icon: 'construct',
              title: 'Small, fast crunches — don\'t yank neck',
              description: 'Quick controlled movements protect your neck.'
            },
            {
              icon: 'flash',
              title: 'Exhale sharply each rep',
              description: 'Sharp exhales enhance ab contraction.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'crunch',
          training_style: 'strength',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'V Up',
          duration: '10–12 min',
          description: 'Challenging bodyweight drill effectively targets the entire abdominal wall..\n ',
          battlePlan: 'Instructions: 4 sets of 10–12 — rest 60–75s between sets, take all of it.\n4 rounds\n• 10–12 V Ups\nRest 60–75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "V Ups",
                    "reps": "10–12",
                    "tutorialSlug": "v_ups"
                  }
                ],
                "rounds": 4,
                "rest": "60–75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240878/mood_app/workout_images/cesyx69b_download_15_.jpg',
          intensityReason: 'Combines flexion of torso + legs for full ab load',
          moodTips: [
            {
              icon: 'flash',
              title: 'Legs + arms rise together',
              description: 'Coordinate movement for maximum ab contraction.'
            },
            {
              icon: 'timer',
              title: 'Balance at top momentarily',
              description: 'Brief pause at peak increases muscle activation.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'sit_up',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Bicycle Crunch',
          duration: '10–12 min',
          description: 'Builds rotational endurance and activates entire core musculature effectively..\n ',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 3 sets of 12 per side — rest 60s between sets, take all of it.\n3 rounds\n• 12 per side Bicycle Crunches\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Bicycle Crunches",
                    "reps": "12/side",
                    "tutorialSlug": "bicycle_crunches"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240903/mood_app/workout_images/pvvftlsu_download_16_.jpg',
          intensityReason: 'Alternating twist works obliques + midline control',
          moodTips: [
            {
              icon: 'construct',
              title: 'Elbow toward opposite knee',
              description: 'Focus on rotation to engage obliques effectively.'
            },
            {
              icon: 'flash',
              title: 'Keep knees hovering off floor',
              description: 'Constant tension maintains ab engagement throughout.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rotation',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'V-Up & Oblique Crunch Circuit',
          duration: '10–12 min',
          description: 'Fast circuit hitting upper, lower, and obliques.',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 3 rounds — all 3 moves in order, then rest 60s.\n3 rounds\n• 12 V-Ups\n• 16 Oblique Crunches (8/side)\n• 30 Alt Toe Taps\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "V-Ups",
                    "reps": "12",
                    "tutorialSlug": "v_ups"
                  },
                  {
                    "name": "Oblique Crunches",
                    "reps": "16",
                    "tutorialSlug": "crunches"
                  },
                  {
                    "name": "Alt Toe Taps",
                    "reps": "30"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240808/mood_app/workout_images/cx3nv5hu_v_up.jpg',
          intensityReason: 'Adds long lever flexion + rotation under fatigue',
          moodTips: [
            {
              icon: 'construct',
              title: 'Keep legs long on V-ups',
              description: 'Extended legs maximize ab engagement.'
            },
            {
              icon: 'flash',
              title: 'Rotate shoulders, not elbows',
              description: 'Proper rotation targets obliques effectively.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rotation',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Sit-Up Density Burner',
          duration: '10–12 min',
          description: 'Minimal rest sit-up progression for ab stamina.',
          battlePlan: 'Instructions: 3 rounds — all 3 moves in order, then rest 60s.\n3 rounds\n• 15 Sit-Ups\n• 12 Sit-Ups\n• 10 Sit-Ups\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Sit-Ups",
                    "reps": "15",
                    "tutorialSlug": "sit_ups"
                  },
                  {
                    "name": "Sit-Ups",
                    "reps": "12",
                    "tutorialSlug": "sit_ups"
                  },
                  {
                    "name": "Sit-Ups",
                    "reps": "10",
                    "tutorialSlug": "sit_ups"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240810/mood_app/workout_images/fvyi5mpl_sit_up.jpg',
          intensityReason: 'High rep sit-ups push flexion endurance',
          moodTips: [
            {
              icon: 'construct',
              title: 'Use abs to rise, not hip snap',
              description: 'Core-driven movement builds true strength.'
            },
            {
              icon: 'timer',
              title: 'Control the descent every rep',
              description: 'Eccentric control maximizes muscle development.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'sit_up',
          training_style: 'strength',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Hanging Leg Raise (Bar)',
          duration: '12–14 min',
          description: 'Very challenging hanging movement requiring strength and controlled execution..\n ',
          battlePlan: 'Instructions: 3 sets of 8–10 — rest 90s between sets, take all of it.\n3 rounds\n• 8–10 Hanging Leg Raises\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Hanging Leg Raise (Bar)",
                    "reps": "8–10",
                    "tutorialSlug": "hanging_toe_touch"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240898/mood_app/workout_images/n5wg8sb5_download_17_.jpg',
          intensityReason: 'Hanging position overloads abs through hip flexion',
          moodTips: [
            {
              icon: 'construct',
              title: 'Don\'t swing torso, control legs',
              description: 'Strict form prevents momentum and maximizes ab work.'
            },
            {
              icon: 'flash',
              title: 'Bring toes high toward bar',
              description: 'Full range of motion maximizes muscle activation.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_raise',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Hollow Body + Pike Jump',
          duration: '12–14 min',
          description: 'Brutal hybrid workout testing both dynamic and static abdominal strength capacity..\n ',
          battlePlan: 'Instructions: Superset: the paired moves run back-to-back with zero rest — rest only after the pair. 3 rounds — all 2 moves in order, then rest 90s.\n3 rounds\n• 20s Hollow Hold\n• 8 Stiff Leg Pike Jumps — immediately, no rest\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Hollow Hold",
                    "reps": "20s",
                    "tutorialSlug": "hollow_holds",
                    "note": "Immediately 8 Stiff Leg Pike Jumps"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240813/mood_app/workout_images/lel4saj0_Pike_jump.jpg',
          intensityReason: 'Iso hold builds endurance, jumps build explosiveness',
          moodTips: [
            {
              icon: 'shield',
              title: 'Lower back pressed into floor',
              description: 'Maintain hollow position to protect lower back.'
            },
            {
              icon: 'flash',
              title: 'Jump quick, land on soft toes',
              description: 'Explosive movement with controlled landing.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'plank',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Hanging Leg Raise Speed Sets',
          duration: '12–14 min',
          description: 'Fast, controlled hanging reps drive intense lower-ab fatigue.',
          battlePlan: 'Instructions: 4 rounds — all 2 moves in order, then rest 75–90s.\n4 rounds\n• 10 Hanging Leg Raises\n• 8 Hanging Knee-to-Chest\nRest 75–90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Hanging Leg Raises",
                    "reps": "10"
                  },
                  {
                    "name": "Hanging Knee-to-Chest",
                    "reps": "8"
                  }
                ],
                "rounds": 4,
                "rest": "75–90s"
              }
            ]
          },
          imageUrl: 'https://customer-assets.emergentagent.com/job_e2f05db7-8caa-482a-a292-b60f552836b8/artifacts/btq4nw4n_Hanging%20leg%20raise.avif',
          intensityReason: 'High-tempo raises overload abs without long isometrics',
          moodTips: [
            {
              icon: 'construct',
              title: 'No swinging — abs initiate every rep',
              description: 'Core-driven movement maximizes ab work.'
            },
            {
              icon: 'flash',
              title: 'Toes rise higher as fatigue builds',
              description: 'Push through fatigue for maximum results.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_raise',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Dragon Flag + V-Up Finisher',
          duration: '12–14 min',
          description: 'Brutal pairing of eccentric strength and speed.',
          battlePlan: 'Instructions: Superset: the paired moves run back-to-back with zero rest — rest only after the pair. 3 rounds — all 2 moves in order, then rest 90s.\n3 rounds\n• 4–6 Dragon Flag Negatives\n• 12 V-Ups — immediately, no rest\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Dragon Flag Negatives",
                    "reps": "4–6",
                    "note": "Immediately 12 V-Ups"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240818/mood_app/workout_images/rpa4a07t_dragon_flag.jpg',
          intensityReason: 'Extreme lever length + explosive flexion',
          moodTips: [
            {
              icon: 'timer',
              title: 'Control the dragon flag descent',
              description: 'Slow eccentric builds incredible strength.'
            },
            {
              icon: 'flash',
              title: 'Snap fast into V-ups',
              description: 'Explosive V-ups after slow eccentrics torch abs.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'sit_up',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Ab Roller',
    icon: 'ellipse',
    workouts: {
      beginner: [
        {
          name: 'Wall Assisted Rollout',
          duration: '8–10 min',
          description: 'Lets true beginners practice safe core extension with wall support assistance..\n ',
          battlePlan: 'Instructions: 3 sets of 12–15 — rest 60s between sets, take all of it.\n3 rounds\n• 12–15 Wall Rollouts\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Wall Rollouts",
                    "reps": "12–15"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241186/mood_app/workout_images/gw2t6eg7_download_1_.jpg',
          intensityReason: 'Wall stop reduces risk while building bracing control',
          moodTips: [
            {
              icon: 'construct',
              title: 'Roll until wheel meets wall soft',
              description: 'Controlled movement prevents overextension.'
            },
            {
              icon: 'flash',
              title: 'Brace abs, squeeze pulling back',
              description: 'Focus on core strength to return to start position.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rollout',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Short Range Rollout',
          duration: '8–10 min',
          description: 'Builds starter strength to prepare for full extensions.\n ',
          battlePlan: 'Instructions: 3 sets of 12–15 — rest 60s between sets, take all of it.\n3 rounds\n• 12–15 Short Rollouts\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Short Rollouts",
                    "reps": "12–15"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241177/mood_app/workout_images/7i1n31ck_download.jpg',
          intensityReason: 'Controlled partial rep trains tension in safer range',
          moodTips: [
            {
              icon: 'construct',
              title: 'Extend halfway, ribs tucked',
              description: 'Maintain rib position to protect lower back.'
            },
            {
              icon: 'timer',
              title: 'Pause, squeeze contraction top',
              description: 'Brief pause builds strength and control.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rollout',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Eccentric-Only Kneeling Rollouts',
          duration: '8–10 min',
          description: 'Negative-only rollouts building anti-extension strength safely.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 8–10 — rest 60s between sets, take all of it.\n3 rounds\n• 8–10 Eccentric Rollouts\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Eccentric Rollouts",
                    "reps": "8–10"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240732/mood_app/workout_images/kega9d81_ab_wheel.jpg',
          intensityReason: 'Eccentric focus builds strength without strain',
          moodTips: [
            {
              icon: 'timer',
              title: 'Lower slowly under control',
              description: 'Slow eccentric builds strength safely.'
            },
            {
              icon: 'construct',
              title: 'Reset fully each rep',
              description: 'No rebound — clean reps only.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rollout',
          training_style: 'strength',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Full Ab Rollout',
          duration: '10–12 min',
          description: 'Long stretch motion challenges anterior abs strongly.\n ',
          battlePlan: 'Instructions: 4 sets of 8 — rest 75s between sets, take all of it.\n4 rounds\n• 8 Full Rollouts\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Full Rollouts",
                    "reps": "8"
                  }
                ],
                "rounds": 4,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241186/mood_app/workout_images/gw2t6eg7_download_1_.jpg',
          intensityReason: 'Full range engages deep abdominals with control',
          moodTips: [
            {
              icon: 'construct',
              title: 'Hips stay tucked, no sagging',
              description: 'Maintain proper hip position throughout movement.'
            },
            {
              icon: 'flash',
              title: 'Pull back squeezing abs tight',
              description: 'Active ab contraction powers the return movement.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rollout',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Rollout + Plank Hold',
          duration: '12–14 min',
          description: 'Pair movement rollout and plank for total ab burn.\n ',
          battlePlan: 'Instructions: 3 rounds — all 2 moves in order, then rest 75s.\n3 rounds\n• 8 Rollouts\n• 20s Plank Hold\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Rollouts",
                    "reps": "8"
                  },
                  {
                    "name": "Plank Hold",
                    "reps": "20s",
                    "tutorialSlug": "plank"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241177/mood_app/workout_images/7i1n31ck_download.jpg',
          intensityReason: 'Flexion with static hold strengthens ab endurance',
          moodTips: [
            {
              icon: 'construct',
              title: 'Core braced during rollout',
              description: 'Maintain constant core tension throughout.'
            },
            {
              icon: 'shield',
              title: 'Stay rigid in plank position',
              description: 'Perfect plank form after rollouts challenges endurance.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rollout',
          training_style: 'mixed',
          intensity_cost: 4,
        },
        {
          name: 'Offset-Hand Kneeling Rollouts',
          duration: '10–12 min',
          description: 'Staggered hand position increases anti-rotation demand.',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 4 sets of 8 per side — rest 75s between sets, take all of it.\n4 rounds\n• 8 per side Offset Rollouts\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Offset Rollouts",
                    "reps": "8/side"
                  }
                ],
                "rounds": 4,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240732/mood_app/workout_images/kega9d81_ab_wheel.jpg',
          intensityReason: 'Uneven hands engage obliques and challenge stability',
          moodTips: [
            {
              icon: 'construct',
              title: 'Hands uneven on handles',
              description: 'Staggered grip increases anti-rotation demand.'
            },
            {
              icon: 'shield',
              title: 'Hips stay square',
              description: 'Resist rotation throughout movement.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rollout',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Standing Rollout',
          duration: '12–14 min',
          description: 'Requires elite bracing strength and anterior stability.\n ',
          battlePlan: 'Instructions: 3 sets of 5–6 — rest 90s between sets, take all of it.\n3 rounds\n• 5–6 Standing Rollouts\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Standing Rollouts",
                    "reps": "5–6",
                    "tutorialSlug": "ab_wheel_standing_rollout"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241186/mood_app/workout_images/gw2t6eg7_download_1_.jpg',
          intensityReason: 'Max difficulty rollout challenges core extension',
          moodTips: [
            {
              icon: 'construct',
              title: 'Start near wall, progress away',
              description: 'Gradually increase difficulty as strength improves.'
            },
            {
              icon: 'shield',
              title: 'Keep ribs pulled down strict',
              description: 'Rib position is crucial for safety and effectiveness.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rollout',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Rollout with 3s Eccentric',
          duration: '12–14 min',
          description: '3s descend rollout punishes abs with strict tempo.\n ',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 6–8 — rest 90s between sets, take all of it.\n3 rounds\n• 6–8 Slow Eccentric Rollouts (3s down)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Slow Eccentric Rollouts",
                    "reps": "6–8"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241177/mood_app/workout_images/7i1n31ck_download.jpg',
          intensityReason: 'Slow lowering multiplies tension for maximal core',
          moodTips: [
            {
              icon: 'timer',
              title: 'Lower forward on 3 count',
              description: 'Controlled eccentric builds incredible strength.'
            },
            {
              icon: 'flash',
              title: 'Squeeze abs returning smooth',
              description: 'Focus on smooth, controlled return movement.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rollout',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Paused Mid-Range Rollouts',
          duration: '12–14 min',
          description: 'Rollouts paused halfway to maximize core tension.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 3 sets of 6–8 — rest 90s between sets, take all of it.\n3 rounds\n• 6–8 Paused Rollouts (2s mid-range)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Paused Rollouts",
                    "reps": "6–8"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241186/mood_app/workout_images/gw2t6eg7_download_1_.jpg',
          intensityReason: 'Mid-range pause maximizes ab tension at hardest point',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause where abs shake',
              description: 'Mid-range is the hardest position.'
            },
            {
              icon: 'construct',
              title: 'Resume smoothly',
              description: 'Control keeps tension throughout.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rollout',
          training_style: 'strength',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Ab Crunch Machine',
    icon: 'hardware-chip',
    workouts: {
      beginner: [
        {
          name: 'Machine Crunch (Light)',
          duration: '8–10 min',
          description: 'Builds abdominal control using small guided resisted spinal flexion movement..\n ',
          battlePlan: 'Instructions: 3 sets of 12–15 — rest 60s between sets, take all of it.\n3 rounds\n• 12–15 Light Crunches\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Light Crunches",
                    "reps": "12–15",
                    "tutorialSlug": "crunches"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241187/mood_app/workout_images/i706j2jh_abss.jpg',
          intensityReason: 'Entry movement teaches crunch with resistance path',
          moodTips: [
            {
              icon: 'construct',
              title: 'Curl spine, don\'t pull arms',
              description: 'Focus on spinal flexion, not arm movement.'
            },
            {
              icon: 'flash',
              title: 'Squeeze abs at top hard',
              description: 'Peak contraction maximizes muscle activation.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'crunch',
          training_style: 'pump',
          intensity_cost: 2,
        },
        {
          name: 'Machine Crunch Pause',
          duration: '8–10 min',
          description: 'Isometric crunch teaches control and endurance reps.\n ',
          battlePlan: 'Instructions: Dead-stop pause — kill all momentum at the pause point before finishing the rep. The hold is strict: locked position, squeezing hard, no drifting. 3 sets of 10 — rest 75s between sets, take all of it.\n3 rounds\n• 10 Crunches (2s hold)\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Crunches",
                    "reps": "10",
                    "tutorialSlug": "crunches"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241179/mood_app/workout_images/9jii3lwp_abs.jpg',
          intensityReason: 'Static top hold boosts power of ab contraction',
          moodTips: [
            {
              icon: 'timer',
              title: 'Hold peak 2s contraction',
              description: 'Isometric holds build strength and control.'
            },
            {
              icon: 'flash',
              title: 'Exhale and squeeze abs top',
              description: 'Breathing coordination enhances contraction.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'crunch',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Slow Eccentric Machine Crunch',
          duration: '8–10 min',
          description: 'Controlled crunch emphasizing lengthened ab tension.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 10 — rest 60s between sets, take all of it.\n3 rounds\n• 10 Slow Eccentric Crunches (4s down)\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Slow Eccentric Crunches",
                    "reps": "10",
                    "tutorialSlug": "crunches"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240722/mood_app/workout_images/g9c1g1gr_ab_crunch_machine.jpg',
          intensityReason: 'Eccentric time builds control and strength',
          moodTips: [
            {
              icon: 'timer',
              title: 'Lower weight on a slow 4-count',
              description: 'Slow eccentric builds incredible control.'
            },
            {
              icon: 'construct',
              title: 'Stop just before full stretch',
              description: 'Keeps tension on abs throughout.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'crunch',
          training_style: 'strength',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Heavy Crunch',
          duration: '10–12 min',
          description: 'Machine allows safe progressive overload to abs.\n ',
          battlePlan: 'Instructions: 4 sets of 8–10 — rest 90s between sets, take all of it.\n4 rounds\n• 8–10 Heavy Crunches\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Heavy Crunches",
                    "reps": "8–10",
                    "tutorialSlug": "crunches"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241187/mood_app/workout_images/i706j2jh_abss.jpg',
          intensityReason: 'Increased resistance thickens ab structure well',
          moodTips: [
            {
              icon: 'construct',
              title: 'Pull slow, avoid jerking pad',
              description: 'Smooth movement ensures proper muscle engagement.'
            },
            {
              icon: 'flash',
              title: 'Squeeze crunch peak contraction',
              description: 'Focus on quality contraction over speed.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'crunch',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Crunch + Leg Raise',
          duration: '12–14 min',
          description: 'Isolation combo burns abdominal wall comprehensively.\n ',
          battlePlan: 'Instructions: 3 rounds — all 2 moves in order, then rest 90s.\n3 rounds\n• 8 Crunches\n• 10 Hanging Leg Raises\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Crunches",
                    "reps": "8",
                    "tutorialSlug": "crunches"
                  },
                  {
                    "name": "Hanging Leg Raises",
                    "reps": "10"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241179/mood_app/workout_images/9jii3lwp_abs.jpg',
          intensityReason: 'Superset works upper + lower abs in one session',
          moodTips: [
            {
              icon: 'construct',
              title: 'Curl torso tight at crunch top',
              description: 'Maximize spinal flexion for upper ab engagement.'
            },
            {
              icon: 'flash',
              title: 'Lift legs smooth, no swing',
              description: 'Controlled leg raises target lower abs effectively.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_raise',
          training_style: 'mixed',
          intensity_cost: 4,
        },
        {
          name: 'Top-Half Machine Crunch Pulses',
          duration: '10–12 min',
          description: 'Partial-range crunch focused on peak contraction.',
          battlePlan: 'Instructions: 4 sets of 15 — rest 75s between sets, take all of it.\n4 rounds\n• 15 Top-Half Pulses\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Top-Half Machine Crunch Pulses",
                    "reps": "15",
                    "tutorialSlug": "crunches"
                  }
                ],
                "rounds": 4,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240722/mood_app/workout_images/g9c1g1gr_ab_crunch_machine.jpg',
          intensityReason: 'Constant tension in shortened position maximizes pump',
          moodTips: [
            {
              icon: 'construct',
              title: 'Stay in top third of motion',
              description: 'Constant tension throughout range.'
            },
            {
              icon: 'shield',
              title: 'Small, controlled pulses',
              description: 'No momentum — pure ab work.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'crunch',
          training_style: 'pump',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Drop Set Crunch',
          duration: '12–14 min',
          description: 'Extended time under tension breaks ab plateaus.\n ',
          battlePlan: 'Instructions: Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set. 3 sets of 10 — rest 90s between sets, take all of it.\n3 rounds\n• 10 Heavy Crunches\n• Drop → 8 reps\n• Drop → 8 reps\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Heavy Crunches",
                    "reps": "10",
                    "tutorialSlug": "crunches",
                    "note": "Drop → 8 reps; Drop → 8 reps"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241187/mood_app/workout_images/i706j2jh_abss.jpg',
          intensityReason: 'Drop weight pushes contraction beyond fatigue point',
          moodTips: [
            {
              icon: 'flash',
              title: 'Strip 15–20% fast, keep form',
              description: 'Quick weight changes maintain intensity.'
            },
            {
              icon: 'construct',
              title: 'Crunch, pause, squeeze at top',
              description: 'Maintain quality throughout all drop sets.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'crunch',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Iso Crunch + Flutter Kicks',
          duration: '12–14 min',
          description: 'Extended tension exercise strengthens abs endurance.\n ',
          battlePlan: 'Instructions: Superset: the paired moves run back-to-back with zero rest — rest only after the pair. The hold is strict: locked position, squeezing hard, no drifting. 3 rounds — all 2 moves in order, then rest 90s.\n3 rounds\n• 8 Crunches + 10s Hold\n• 15 Flutter Kicks — immediately, no rest\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Crunches + 10s Hold",
                    "reps": "8",
                    "tutorialSlug": "crunches",
                    "note": "Immediately 15 Flutter Kicks"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241179/mood_app/workout_images/9jii3lwp_abs.jpg',
          intensityReason: 'Holds plus kicks exhaust abs dynamically and isometric',
          moodTips: [
            {
              icon: 'timer',
              title: 'Hold contraction top 10s',
              description: 'Sustained contraction builds incredible endurance.'
            },
            {
              icon: 'flash',
              title: 'Keep abs braced with flutter',
              description: 'Maintain core tension throughout flutter kicks.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'crunch',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Iso-Hold Machine Crunch Ladder',
          duration: '12–14 min',
          description: 'Progressive isometric holds layered with reps.',
          battlePlan: 'Instructions: Ladder: work down the rungs — the reps drop as fatigue climbs. Rest only between rungs. The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 8 — rest 90s between sets, take all of it.\n4 rounds\n• 8 Crunches + Hold (5s/8s/10s/12s)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Crunches + Hold",
                    "reps": "8",
                    "tutorialSlug": "crunches"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241187/mood_app/workout_images/i706j2jh_abss.jpg',
          intensityReason: 'Increasing hold duration compounds fatigue each round',
          moodTips: [
            {
              icon: 'timer',
              title: 'Increase hold duration each round',
              description: 'Fatigue compounds throughout workout.'
            },
            {
              icon: 'shield',
              title: 'Breathe shallow under load',
              description: 'Abs stay braced throughout hold.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'crunch',
          training_style: 'mixed',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Captain\'s Chair',
    icon: 'desktop',
    workouts: {
      beginner: [
        {
          name: 'Knee Raise',
          duration: '8–10 min',
          description: 'Controlled movement isolates lower ab recruitment.\n ',
          battlePlan: 'Instructions: 3 sets of 10–12 — rest 60s between sets, take all of it.\n3 rounds\n• 10–12 Knee Raises\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Knee Raise",
                    "reps": "10–12",
                    "tutorialSlug": "hanging_knee_raise"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240876/mood_app/workout_images/bvoxdf8z_download_14_.jpg',
          intensityReason: 'Basic raise builds lower abdominal lift strength',
          moodTips: [
            {
              icon: 'construct',
              title: 'Pull knees slow to chest',
              description: 'Controlled movement maximizes muscle engagement.'
            },
            {
              icon: 'shield',
              title: 'Back pressed against pad',
              description: 'Maintain back contact for stability and safety.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Straight Leg Hold',
          duration: '8–10 min',
          description: 'Lockout position burns abs for lower focus stability.\n ',
          battlePlan: 'Instructions: 3 sets of 15s — rest 75s between sets, take all of it.\n3 rounds\n• 15s Holds\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Straight Leg Hold",
                    "reps": "15s"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240881/mood_app/workout_images/e782pm7q_download_13_.jpg',
          intensityReason: 'Isometric hold increases abs\' endurance demands',
          moodTips: [
            {
              icon: 'construct',
              title: 'Hold legs extended forward',
              description: 'Maintain straight leg position throughout hold.'
            },
            {
              icon: 'shield',
              title: 'Don\'t let hips shift around',
              description: 'Stable hip position maintains proper muscle activation.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'crunch',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Alternating Knee Raises',
          duration: '8–10 min',
          description: 'Unilateral knee lifts improving control and reducing swing.',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 3 sets of 12 per side — rest 60s between sets, take all of it.\n3 rounds\n• 12 per side Alternating Knee Raises\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Alternating Knee Raises",
                    "reps": "12/side"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240708/mood_app/workout_images/azj4v9yc_cap_chair_alt_knee_riase.jpg',
          intensityReason: 'One knee at a time reduces momentum for better activation',
          moodTips: [
            {
              icon: 'construct',
              title: 'One knee at a time',
              description: 'Momentum reduced for better control.'
            },
            {
              icon: 'timer',
              title: 'Brief pause at top',
              description: 'Better activation with each rep.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Straight Leg Raise',
          duration: '10–12 min',
          description: 'Builds strength in lower abs with stable path control.\n ',
          battlePlan: 'Instructions: 4 sets of 8–10 — rest 90s between sets, take all of it.\n4 rounds\n• 8–10 Leg Raises\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Leg Raises",
                    "reps": "8–10"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241176/mood_app/workout_images/0ga9gll0_download_5_.jpg',
          intensityReason: 'Full ROM raise loads abs through longer range',
          moodTips: [
            {
              icon: 'construct',
              title: 'Lower legs slow and steady',
              description: 'Controlled eccentric maximizes muscle development.'
            },
            {
              icon: 'flash',
              title: 'Avoid swinging up quick',
              description: 'Smooth movement prevents momentum compensation.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_raise',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Knee Raise + Twist',
          duration: '12–14 min',
          description: 'Hits lower abs and sides in one combined superset.\n ',
          battlePlan: 'Instructions: Superset: the paired moves run back-to-back with zero rest — rest only after the pair. Complete ALL reps on one side before switching — no alternating unless written. 3 sets of 8 per side — rest 90s between sets, take all of it.\n3 rounds\n• 8 per side Knee Raise Twist\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Knee Raise Twist",
                    "reps": "8/side"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241184/mood_app/workout_images/gtb4564s_download_4_.jpg',
          intensityReason: 'Twist adds oblique rotation into lower ab raises',
          moodTips: [
            {
              icon: 'construct',
              title: 'Twist knees left, right alternate',
              description: 'Alternating rotation engages obliques effectively.'
            },
            {
              icon: 'shield',
              title: 'Keep torso steady upright',
              description: 'Stable torso isolates the twisting movement.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rotation',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Extended-Knee Raises (45°)',
          duration: '10–12 min',
          description: 'Partial straight-leg raises increasing lever length.',
          battlePlan: 'Instructions: 4 sets of 10 — rest 75s between sets, take all of it.\n4 rounds\n• 10 Extended-Knee Raises\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Extended-Knee Raises",
                    "reps": "10"
                  }
                ],
                "rounds": 4,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240704/mood_app/workout_images/9wb93wi2_cap_chair_leg_raise.jpg',
          intensityReason: 'Stopping at 45° keeps abs loaded throughout',
          moodTips: [
            {
              icon: 'construct',
              title: 'Stop legs at 45°',
              description: 'Abs stay loaded in this partial range.'
            },
            {
              icon: 'timer',
              title: 'Lower slow',
              description: 'Eccentric matters for strength.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_raise',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Weighted Leg Raise',
          duration: '12–14 min',
          description: 'Dumbbell held securely between feet amplifies difficulty and muscle activation..\n ',
          battlePlan: 'Instructions: 3 sets of 8–10 — rest 90s between sets, take all of it.\n3 rounds\n• 8–10 Weighted Leg Raises\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Weighted Leg Raises",
                    "reps": "8–10"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240872/mood_app/workout_images/9xx4tww6_Screenshot_2025-12-05_at_6_17_40_PM.jpg',
          intensityReason: 'Extra load maximizes ab contraction from raises',
          moodTips: [
            {
              icon: 'construct',
              title: 'Secure weight firm at feet',
              description: 'Proper weight placement ensures safety and control.'
            },
            {
              icon: 'flash',
              title: 'Control lowering slowly',
              description: 'Resist gravity to maximize muscle engagement.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_raise',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Leg Raise + Slow Eccentric',
          duration: '12–14 min',
          description: 'Builds more strength with controlled negative reps.\n ',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 8–10 — rest 90s between sets, take all of it.\n3 rounds\n• 8–10 Leg Raises (3s eccentric)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Leg Raises",
                    "reps": "8–10"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240902/mood_app/workout_images/pow4f7e4_download_13_.jpg',
          intensityReason: 'Slow eccentric multiplies ab contraction stress',
          moodTips: [
            {
              icon: 'timer',
              title: 'Lift quick, lower 3s slow',
              description: 'Emphasis on eccentric builds exceptional strength.'
            },
            {
              icon: 'flash',
              title: 'Keep tension through descent',
              description: 'Maintain muscle engagement throughout lowering.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_raise',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'L-Sit Hold (Captain\'s Chair)',
          duration: '12–14 min',
          description: 'Static compression hold demanding full core tension.',
          battlePlan: 'Instructions: 4 sets — rest 90s between sets, take all of it.\n4 rounds\n• Max L-Sit Hold\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Max L-Sit Hold",
                    "tutorialSlug": "dip_bar_l_sit"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240872/mood_app/workout_images/9xx4tww6_Screenshot_2025-12-05_at_6_17_40_PM.jpg',
          intensityReason: 'Legs parallel to floor demands maximum engagement',
          moodTips: [
            {
              icon: 'construct',
              title: 'Legs parallel to floor',
              description: 'Maximum engagement throughout hold.'
            },
            {
              icon: 'shield',
              title: 'Shallow breathing',
              description: 'Brace maintained throughout.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_raise',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Roman Hyperextension',
    icon: 'return-down-forward',
    workouts: {
      beginner: [
        {
          name: 'Bodyweight Side Bend',
          duration: '8–10 min',
          description: 'Learns lateral bending to build oblique connection.\n ',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 3 sets of 10 per side — rest 60s between sets, take all of it.\n3 rounds\n• 10 per side Side Bends\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Side Bends",
                    "reps": "10/side",
                    "tutorialSlug": "roman_chair_side_bend"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240754/mood_app/workout_images/zqeon0lh_roman_chair_weighted_side_bend.jpg',
          intensityReason: 'Basic side crunch trains obliques with safe control',
          moodTips: [
            {
              icon: 'construct',
              title: 'Move slow, don\'t swing torso',
              description: 'Controlled movement prevents injury and maximizes engagement.'
            },
            {
              icon: 'flash',
              title: 'Focus on oblique squeeze top',
              description: 'Peak contraction builds mind-muscle connection.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'side_bend',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Supported Crunch',
          duration: '8–10 min',
          description: 'Controlled entry drill targets upper ab connection.\n ',
          battlePlan: 'Instructions: 3 sets of 10–12 — rest 60s between sets, take all of it.\n3 rounds\n• 10–12 Supported Crunches\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Supported Crunches",
                    "reps": "10–12",
                    "tutorialSlug": "crunches"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241183/mood_app/workout_images/geuifix4_download_8_.jpg',
          intensityReason: 'Small crunch on bench works abs beginner safe',
          moodTips: [
            {
              icon: 'construct',
              title: 'Curl spine slightly forward',
              description: 'Focus on spinal flexion for proper ab engagement.'
            },
            {
              icon: 'flash',
              title: 'Squeeze abs hard top rep',
              description: 'Peak contraction maximizes muscle activation.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'crunch',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Anti-Extension Neutral Hold',
          duration: '8–10 min',
          description: 'Static trunk hold resisting spinal extension.',
          battlePlan: 'Instructions: 3 sets of 20–30s — rest 60s between sets, take all of it.\n3 rounds\n• 20–30s Holds\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Anti-Extension Neutral Hold",
                    "reps": "20–30s"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241180/mood_app/workout_images/9xys14l8_download_9_.jpg',
          intensityReason: 'Core stabilizes spine in anti-extension position',
          moodTips: [
            {
              icon: 'construct',
              title: 'Brace like a plank',
              description: 'Core stabilizes spine throughout hold.'
            },
            {
              icon: 'shield',
              title: 'Neck neutral',
              description: 'Alignment matters for safety.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'plank',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Weighted Side Bend',
          duration: '10–12 min',
          description: 'Builds oblique thickness with controlled weighted reps.\n ',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 4 sets of 8–10 per side — rest 90s between sets, take all of it.\n4 rounds\n• 8–10 per side Weighted Bends\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Weighted Bends",
                    "reps": "8–10/side",
                    "tutorialSlug": "roman_chair_side_bend"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240754/mood_app/workout_images/zqeon0lh_roman_chair_weighted_side_bend.jpg',
          intensityReason: 'Progression adds resistance for lateral growth',
          moodTips: [
            {
              icon: 'construct',
              title: 'Hug plate firm to chest',
              description: 'Secure weight placement ensures proper form.'
            },
            {
              icon: 'flash',
              title: 'Move only side to side',
              description: 'Pure lateral movement isolates obliques effectively.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'side_bend',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Oblique Twist Sit Up',
          duration: '12–14 min',
          description: 'Twisting sit up enhances rotational ab engagement.\n ',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 3 sets of 8 per side — rest 90s between sets, take all of it.\n3 rounds\n• 8 per side Twisting Sit Ups\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Twisting Sit Ups",
                    "reps": "8/side",
                    "tutorialSlug": "sit_ups"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241183/mood_app/workout_images/geuifix4_download_8_.jpg',
          intensityReason: 'Rotating adds dynamic work for obliques strongly',
          moodTips: [
            {
              icon: 'construct',
              title: 'Rotate torso controlled',
              description: 'Smooth rotation prevents injury and maximizes engagement.'
            },
            {
              icon: 'flash',
              title: 'Squeeze on each twist top',
              description: 'Peak contraction at each twist builds strength.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rotation',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Alternating Reach Extensions',
          duration: '10–12 min',
          description: 'Controlled reach adding anti-rotation demand.',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 4 sets of 8 per side — rest 75s between sets, take all of it.\n4 rounds\n• 8 per side Alternating Reaches\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Alternating Reaches",
                    "reps": "8/side"
                  }
                ],
                "rounds": 4,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240738/mood_app/workout_images/o590xw8i_roman_chari_alt_reach.jpg',
          intensityReason: 'Opposite arm reach engages obliques with anti-rotation',
          moodTips: [
            {
              icon: 'construct',
              title: 'Opposite arm reach',
              description: 'Obliques engage to stabilize.'
            },
            {
              icon: 'shield',
              title: 'Minimal torso shift',
              description: 'Stability wins over movement.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'sit_up',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Weighted Sit Up',
          duration: '12–14 min',
          description: 'Progressive overload thickens abs via weighted and controlled sit ups.\n ',
          battlePlan: 'Instructions: 3 sets of 8–10 — rest 90s between sets, take all of it.\n3 rounds\n• 8–10 Weighted Sit Ups\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Weighted Sit Ups",
                    "reps": "8–10",
                    "tutorialSlug": "sit_ups"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241180/mood_app/workout_images/9xys14l8_download_9_.jpg',
          intensityReason: 'Added weight enhances muscular demand on abs',
          moodTips: [
            {
              icon: 'construct',
              title: 'Hug plate tight chest',
              description: 'Secure weight placement maintains proper form.'
            },
            {
              icon: 'timer',
              title: 'Squeeze abs at top pause',
              description: 'Brief pause maximizes muscle activation.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'sit_up',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Sit Up with 3s Hold Top',
          duration: '12–14 min',
          description: 'Hold then release makes sit up much more demanding.\n ',
          battlePlan: 'Instructions: The hold is strict: locked position, squeezing hard, no drifting. 3 sets of 8 — rest 90s between sets, take all of it.\n3 rounds\n• 8 Sit Ups (3s hold top)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Sit Ups",
                    "reps": "8",
                    "tutorialSlug": "sit_ups"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241183/mood_app/workout_images/geuifix4_download_8_.jpg',
          intensityReason: 'Iso contraction hold increases abs endurance',
          moodTips: [
            {
              icon: 'timer',
              title: 'Rise slow, pause 3s top',
              description: 'Extended hold builds incredible endurance.'
            },
            {
              icon: 'flash',
              title: 'Abs squeeze hard at hold',
              description: 'Maximum contraction during isometric phase.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'sit_up',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Weighted Anti-Rotation Hold',
          duration: '12–14 min',
          description: 'Static hold resisting rotation under load.',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 4 sets of 20–30s per side — rest 90s between sets, take all of it.\n4 rounds\n• 20–30s per side Weighted Holds\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Weighted Anti-Rotation Hold",
                    "reps": "20–30s/side"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241180/mood_app/workout_images/9xys14l8_download_9_.jpg',
          intensityReason: 'Offset load fires obliques under anti-rotation demand',
          moodTips: [
            {
              icon: 'construct',
              title: 'Weight offset to one side',
              description: 'Obliques fire to resist rotation.'
            },
            {
              icon: 'shield',
              title: 'No hip shift',
              description: 'Control the base throughout.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rotation',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Medicine Ball',
    icon: 'basketball',
    workouts: {
      beginner: [
        {
          name: 'MB Crunch',
          duration: '8–10 min',
          description: 'Beginner crunch builds control with small resistance.\n ',
          battlePlan: 'Instructions: 3 sets of 12 — rest 60s between sets, take all of it.\n3 rounds\n• 12 MB Crunches\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "MB Crunches",
                    "reps": "12",
                    "tutorialSlug": "crunches"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241373/mood_app/workout_images/cu85n2we_download_1_.jpg',
          intensityReason: 'Light ball adds gentle overload to crunch pattern',
          moodTips: [
            {
              icon: 'construct',
              title: 'Ball above chest steady',
              description: 'Stable ball position maintains proper form.'
            },
            {
              icon: 'flash',
              title: 'Squeeze contraction top hard',
              description: 'Peak contraction maximizes muscle engagement.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'crunch',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Seated MB Twist',
          duration: '8–10 min',
          description: 'Dynamic twisting strengthens side core stability.\n ',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 3 sets of 10 per side — rest 75s between sets, take all of it.\n3 rounds\n• 10 per side Twists\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Twists",
                    "reps": "10/side"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240701/mood_app/workout_images/8o6c10d2_med_bal_crunch_twists.jpg',
          intensityReason: 'Rotation works obliques with ball resistance control',
          moodTips: [
            {
              icon: 'construct',
              title: 'Torso upright, feet up off mat',
              description: 'Proper position isolates core muscles effectively.'
            },
            {
              icon: 'flash',
              title: 'Rotate shoulders, squeeze side',
              description: 'Focus on oblique contraction with each twist.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rotation',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'MB Dead Bug Press',
          duration: '8–10 min',
          description: 'Dead bug variation adding anterior load.',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 3 sets of 10 per side — rest 60s between sets, take all of it.\n3 rounds\n• 10 per side MB Dead Bugs\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "MB Dead Bugs",
                    "reps": "10/side"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240749/mood_app/workout_images/sempfdbg_dead_bug_press.jpg',
          intensityReason: 'Pressing ball upward increases core engagement',
          moodTips: [
            {
              icon: 'construct',
              title: 'Press ball upward',
              description: 'Core engagement increases with press.'
            },
            {
              icon: 'timer',
              title: 'Slow limb movement',
              description: 'Stability first, speed later.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'plank',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'MB Overhead Sit Up',
          duration: '10–12 min',
          description: 'Long lever increases core demand and stretch tension.\n ',
          battlePlan: 'Instructions: 4 sets of 8–10 — rest 90s between sets, take all of it.\n4 rounds\n• 8–10 MB Sit Ups\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "MB Sit Ups",
                    "reps": "8–10",
                    "tutorialSlug": "sit_ups"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240713/mood_app/workout_images/efsqbz6t_med_ball_overhead_sit_up.jpg',
          intensityReason: 'Lever arm extended overhead intensifies abs load',
          moodTips: [
            {
              icon: 'construct',
              title: 'Arms straight, no bending',
              description: 'Maintain extended lever throughout movement.'
            },
            {
              icon: 'flash',
              title: 'Squeeze top contraction tight',
              description: 'Peak contraction overcomes longer lever arm.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'sit_up',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'MB Slam + Plank Hold',
          duration: '12–14 min',
          description: 'Dynamic then static pairing builds full capacity.\n ',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 3 rounds — all 2 moves in order, then rest 90s.\n3 rounds\n• 8 MB Slams\n• 25s Plank Hold\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "MB Slams",
                    "reps": "8"
                  },
                  {
                    "name": "Plank Hold",
                    "reps": "25s",
                    "tutorialSlug": "plank"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241384/mood_app/workout_images/vv8j4fll_download.jpg',
          intensityReason: 'Explosive slam pairs with core static endurance',
          moodTips: [
            {
              icon: 'flash',
              title: 'Slam ball with abs not arms',
              description: 'Core-driven slam maximizes ab engagement.'
            },
            {
              icon: 'shield',
              title: 'Keep hips level plank',
              description: 'Perfect plank form after dynamic movement.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'plank',
          training_style: 'mixed',
          intensity_cost: 4,
        },
        {
          name: 'MB Sit-Up to Press-Out',
          duration: '10–12 min',
          description: 'Sit-up finishing with press to extend tension.',
          battlePlan: 'Instructions: 4 sets of 10 — rest 75s between sets, take all of it.\n4 rounds\n• 10 MB Sit-Up Press-Outs\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "MB Sit-Up Press-Outs",
                    "reps": "10",
                    "tutorialSlug": "sit_ups"
                  }
                ],
                "rounds": 4,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241373/mood_app/workout_images/cu85n2we_download_1_.jpg',
          intensityReason: 'Pressing ball at top keeps abs active longer',
          moodTips: [
            {
              icon: 'construct',
              title: 'Press ball at top',
              description: 'Abs stay active through press.'
            },
            {
              icon: 'timer',
              title: 'Control both phases',
              description: 'No momentum allowed.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'sit_up',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'MB V Sit Twist',
          duration: '12–14 min',
          description: 'Heavy core load combining balance and twist with med ball.\n ',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 3 sets of 10 per side — rest 90s between sets, take all of it.\n3 rounds\n• 10 per side V Twists\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "MB V Sit Twist",
                    "reps": "10/side",
                    "tutorialSlug": "sit_ups"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241373/mood_app/workout_images/cu85n2we_download_1_.jpg',
          intensityReason: 'Rotational V sit fires obliques under high stress',
          moodTips: [
            {
              icon: 'construct',
              title: 'Chest tall, core braced firm',
              description: 'Maintain posture throughout challenging movement.'
            },
            {
              icon: 'flash',
              title: 'Rotate slow, abs squeezed',
              description: 'Controlled rotation with constant core tension.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rotation',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'MB Slam + Toe Touch Finisher',
          duration: '12–14 min',
          description: 'Brutal pairing challenges power and contraction.\n ',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 3 rounds — all 2 moves in order, then rest 90s.\n3 rounds\n• 8 MB Slams\n• 10 MB Toe Touches\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "MB Slams",
                    "reps": "8"
                  },
                  {
                    "name": "MB Toe Touches",
                    "reps": "10",
                    "tutorialSlug": "hanging_toe_touch"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241384/mood_app/workout_images/vv8j4fll_download.jpg',
          intensityReason: 'Targets entire abs with slam then toe reach combo',
          moodTips: [
            {
              icon: 'flash',
              title: 'Slam strong with abs engaged',
              description: 'Core-driven power movement builds explosive strength.'
            },
            {
              icon: 'construct',
              title: 'Strive to touch toes top',
              description: 'Full range toe touch maximizes ab contraction.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'sit_up',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'MB Overhead Hold Flutter Kicks',
          duration: '12–14 min',
          description: 'Long-lever flutter kicks under overhead load.',
          battlePlan: 'Instructions: 4 sets of 20 — rest 90s between sets, take all of it.\n4 rounds\n• 20 Flutter Kicks (MB overhead)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Flutter Kicks",
                    "reps": "20"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241373/mood_app/workout_images/cu85n2we_download_1_.jpg',
          intensityReason: 'Arms locked overhead maximizes lever and core demand',
          moodTips: [
            {
              icon: 'construct',
              title: 'Arms locked overhead',
              description: 'Lever maximized for extreme challenge.'
            },
            {
              icon: 'flash',
              title: 'Small fast kicks',
              description: 'Abs stay braced throughout.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'sit_up',
          training_style: 'mixed',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Decline Bench',
    icon: 'trending-down',
    workouts: {
      beginner: [
        {
          name: 'Decline Sit Up (Bodyweight)',
          duration: '8–10 min',
          description: 'Bodyweight baseline drill builds control and strength.\n ',
          battlePlan: 'Instructions: 3 sets of 10–12 — rest 60s between sets, take all of it.\n3 rounds\n• 10–12 Decline Sit Ups\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Decline Sit Ups",
                    "reps": "10–12",
                    "tutorialSlug": "sit_ups"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241188/mood_app/workout_images/lwwxsgl0_download_7_.jpg',
          intensityReason: 'Decline angle increases core range and challenge',
          moodTips: [
            {
              icon: 'construct',
              title: 'Curl torso slowly up',
              description: 'Controlled movement maximizes muscle engagement.'
            },
            {
              icon: 'flash',
              title: 'Hard squeeze at top rep',
              description: 'Peak contraction maximizes ab activation.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'sit_up',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Decline Crunch',
          duration: '8–10 min',
          description: 'Works midline without excessive torso movement.\n ',
          battlePlan: 'Instructions: 3 sets of 12–15 — rest 75s between sets, take all of it.\n3 rounds\n• 12–15 Decline Crunches\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Decline Crunches",
                    "reps": "12–15",
                    "tutorialSlug": "crunches"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241181/mood_app/workout_images/azdoubte_download_6_.jpg',
          intensityReason: 'Short ROM targets abs intensely with safety and lower tension',
          moodTips: [
            {
              icon: 'construct',
              title: 'Small crunch only, spine curl',
              description: 'Focus on spinal flexion for targeted ab work.'
            },
            {
              icon: 'flash',
              title: 'Exhale squeeze contraction',
              description: 'Coordinate breathing for maximum muscle activation.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'crunch',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Flat Bench Crunch',
          duration: '8–10 min',
          description: 'Flat bench crunch focusing on controlled spinal flexion.',
          battlePlan: 'Instructions: 3 sets of 12–15 — rest 60s between sets, take all of it.\n3 rounds\n• 12–15 Flat Bench Crunches\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Flat Bench Crunches",
                    "reps": "12–15",
                    "tutorialSlug": "crunches"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240726/mood_app/workout_images/h4s4mo34_flat_bench_crunch.jpg',
          intensityReason: 'Flat bench removes decline to reduce difficulty',
          moodTips: [
            {
              icon: 'construct',
              title: 'Bench set flat',
              description: 'Removes decline to reduce difficulty.'
            },
            {
              icon: 'flash',
              title: 'Curl ribs toward pelvis',
              description: 'True ab flexion, not a sit-up.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'crunch',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Weighted Sit Up',
          duration: '10–12 min',
          description: 'Strengthens core wall with consistent loaded work.\n ',
          battlePlan: 'Instructions: 4 sets of 8 — rest 90s between sets, take all of it.\n4 rounds\n• 8 Sit Ups w/ Plate\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Sit Ups w/ Plate",
                    "reps": "8",
                    "tutorialSlug": "sit_ups"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240750/mood_app/workout_images/udgo880g_decline_bench_weighted_sit_up.jpg',
          intensityReason: 'Holding plate increases progressive overload stress',
          moodTips: [
            {
              icon: 'construct',
              title: 'Hug plate close chest',
              description: 'Secure weight placement maintains proper form.'
            },
            {
              icon: 'timer',
              title: 'Pause squeeze contraction',
              description: 'Brief hold at peak maximizes muscle activation.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'sit_up',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Twisting Sit Up',
          duration: '12–14 min',
          description: 'Full abs trained with twist motion superset strategy.\n ',
          battlePlan: 'Instructions: Superset: the paired moves run back-to-back with zero rest — rest only after the pair. Complete ALL reps on one side before switching — no alternating unless written. 3 sets of 8 per side — rest 90s between sets, take all of it.\n3 rounds\n• 8 per side Twisting Sit Ups\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Twisting Sit Ups",
                    "reps": "8/side",
                    "tutorialSlug": "sit_ups"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241181/mood_app/workout_images/azdoubte_download_6_.jpg',
          intensityReason: 'Rotational sit up engages obliques + rectus combo',
          moodTips: [
            {
              icon: 'construct',
              title: 'Rotate elbow toward knee',
              description: 'Twisting motion engages obliques effectively.'
            },
            {
              icon: 'flash',
              title: 'Core tight, control twist',
              description: 'Maintain core tension throughout rotation.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rotation',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Arms-Overhead Decline Sit-Ups',
          duration: '10–12 min',
          description: 'Long-lever sit-up increasing difficulty without weight.',
          battlePlan: 'Instructions: 4 sets of 10 — rest 75s between sets, take all of it.\n4 rounds\n• 10 Arms-Overhead Sit-Ups\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Arms-Overhead Sit-Ups",
                    "reps": "10",
                    "tutorialSlug": "sit_ups"
                  }
                ],
                "rounds": 4,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240742/mood_app/workout_images/redekabo_delcine_bench_reach_sit_up.jpg',
          intensityReason: 'Arms straight overhead increases lever and load',
          moodTips: [
            {
              icon: 'construct',
              title: 'Arms stay straight',
              description: 'Lever increases load on abs.'
            },
            {
              icon: 'timer',
              title: 'Control descent',
              description: 'Tension maintained throughout.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'sit_up',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: '1½ Rep Sit Up',
          duration: '12–14 min',
          description: 'Time under tension drill builds durability fully while adding strength.\n ',
          battlePlan: 'Instructions: Sit all the way up, lower halfway down, come back up, then lower fully — that whole sequence is ONE rep. 3 sets of 8 — rest 90s between sets, take all of it.\n3 rounds\n• 8 Combo Reps (half+full =1)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "1½ Rep Sit Up",
                    "reps": "8",
                    "tutorialSlug": "sit_ups"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241188/mood_app/workout_images/lwwxsgl0_download_7_.jpg',
          intensityReason: 'Combo half+full doubles ab contraction under load',
          moodTips: [
            {
              icon: 'construct',
              title: 'Perform half then full smoothly',
              description: 'Continuous movement maintains muscle tension.'
            },
            {
              icon: 'flash',
              title: 'Squeeze hard both times',
              description: 'Dual contractions maximize muscle engagement.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'sit_up',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Decline Sit Up + Flutter Kicks',
          duration: '12–14 min',
          description: 'Powerful finisher blends flexion and endurance set.\n ',
          battlePlan: 'Instructions: Superset: the paired moves run back-to-back with zero rest — rest only after the pair. 3 rounds — all 2 moves in order, then rest 90s.\n3 rounds\n• 8 Decline Sit Ups\n• 15 Flutter Kicks — immediately, no rest\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Decline Sit Ups",
                    "reps": "8",
                    "tutorialSlug": "sit_ups",
                    "note": "Immediately 15 Flutter Kicks"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241181/mood_app/workout_images/azdoubte_download_6_.jpg',
          intensityReason: 'Sit ups paired with flutter kicks torch abs fully',
          moodTips: [
            {
              icon: 'flash',
              title: 'Abs tight during sit ups',
              description: 'Maintain core engagement throughout movement.'
            },
            {
              icon: 'construct',
              title: 'Kick legs steady below bench',
              description: 'Controlled flutter kicks maintain constant tension.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'sit_up',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Weighted Decline Sit Up',
          duration: '12–14 min',
          description: 'Weighted movement builds advanced ab strength capacity.\n ',
          battlePlan: 'Instructions: 3 sets of 8–10 — rest 90s between sets, take all of it.\n3 rounds\n• 8–10 Weighted Sit Ups\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Weighted Sit Ups",
                    "reps": "8–10",
                    "tutorialSlug": "sit_ups"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241181/mood_app/workout_images/azdoubte_download_6_.jpg',
          intensityReason: 'Weight adds progressive ab load challenge',
          moodTips: [
            {
              icon: 'shield',
              title: 'Hug weight at chest',
              description: 'Proper weight position prevents injury.'
            },
            {
              icon: 'flash',
              title: 'Squeeze hard both times',
              description: 'Maximum contraction on way up and down.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'sit_up',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Offset Load Decline Sit-Ups',
          duration: '12–14 min',
          description: 'Anti-rotation sit-ups using unbalanced loading.',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 4 sets of 8 per side — rest 90s between sets, take all of it.\n4 rounds\n• 8 per side Offset Sit-Ups\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Offset Sit-Ups",
                    "reps": "8/side",
                    "tutorialSlug": "sit_ups"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241188/mood_app/workout_images/lwwxsgl0_download_7_.jpg',
          intensityReason: 'Weight to one side forces core to resist twist',
          moodTips: [
            {
              icon: 'construct',
              title: 'Hold weight to one side',
              description: 'Core resists twist throughout.'
            },
            {
              icon: 'flash',
              title: 'Alternate sides',
              description: 'Balanced development for both sides.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'sit_up',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Pull-Up Bar',
    icon: 'fitness',
    workouts: {
      beginner: [
        {
          name: 'Supported Hanging Knee Raises',
          duration: '8–10 min',
          description: 'Assisted knee raises to learn hanging core control.',
          battlePlan: 'Instructions: 3 sets of 8–10 — rest 60s between sets, take all of it.\n3 rounds\n• 8–10 Supported Hanging Knee Raises\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Supported Hanging Knee Raises",
                    "reps": "8–10"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240698/mood_app/workout_images/7v92z8q8_hanging_knee_1.jpg',
          intensityReason: 'Light support eliminates swing for proper form',
          moodTips: [
            {
              icon: 'shield',
              title: 'Stability first',
              description: 'Use light foot or band support to eliminate swing.'
            },
            {
              icon: 'construct',
              title: 'Small lift counts',
              description: 'Knees don\'t need to come high to work abs.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Alternating Assisted Knee Lifts',
          duration: '8–10 min',
          description: 'Single-knee lifts to reduce load and improve control.',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 3 sets of 6 per side — rest 60s between sets, take all of it.\n3 rounds\n• 6 per side Alternating Assisted Knee Lifts\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Alternating Assisted Knee Lifts",
                    "reps": "6/side"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240740/mood_app/workout_images/r3t36som_alt_knee_raise.jpg',
          intensityReason: 'Alternating knees halves the lever demand',
          moodTips: [
            {
              icon: 'construct',
              title: 'One side at a time',
              description: 'Alternating knees halves the lever demand.'
            },
            {
              icon: 'shield',
              title: 'Torso stays quiet',
              description: 'No rocking or leaning backward.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Knee Raise Holds (Short)',
          duration: '8–10 min',
          description: 'Brief knee raise holds to practice ab activation.',
          battlePlan: 'Instructions: 3 sets of 6 — rest 60s between sets, take all of it.\n3 rounds\n• 6 Knee Raises with 1s Hold\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Knee Raise Holds (Short)",
                    "reps": "6",
                    "tutorialSlug": "hanging_knee_raise"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240730/mood_app/workout_images/j8odgh5l_hanging_knee_2.jpg',
          intensityReason: 'Static top hold teaches proper contraction',
          moodTips: [
            {
              icon: 'timer',
              title: 'Hold before lowering',
              description: 'A 1s pause teaches contraction.'
            },
            {
              icon: 'flash',
              title: 'Exhale to lift',
              description: 'Breathing helps abs initiate the movement.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Straight-Leg Raises (45°)',
          duration: '10–12 min',
          description: 'Straight-leg raises stopping below parallel for control.',
          battlePlan: 'Instructions: 4 sets of 8 — rest 75–90s between sets, take all of it.\n4 rounds\n• 8 Straight-Leg Raises to ~45°\nRest 75–90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Straight-Leg Raises to ~45°",
                    "reps": "8"
                  }
                ],
                "rounds": 4,
                "rest": "75–90s"
              }
            ]
          },
          imageUrl: 'https://customer-assets.emergentagent.com/job_e2f05db7-8caa-482a-a292-b60f552836b8/artifacts/btq4nw4n_Hanging%20leg%20raise.avif',
          intensityReason: 'Controlled range prevents swing and maximizes tension',
          moodTips: [
            {
              icon: 'construct',
              title: 'Legs move together',
              description: 'Treat both legs as one long lever.'
            },
            {
              icon: 'shield',
              title: 'Range ends with control',
              description: 'Stop before any swing appears.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_raise',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Leg Raise → Knee Tuck Combo',
          duration: '10–12 min',
          description: 'Combo reps extend time under tension in one set.',
          battlePlan: 'Instructions: Superset: the paired moves run back-to-back with zero rest — rest only after the pair. 3 rounds — all 2 moves in order, then rest 75s.\n3 rounds\n• 6 Straight-Leg Raises\n• 6 Knee Tucks — immediately, no rest\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Straight-Leg Raises",
                    "reps": "6",
                    "note": "Immediately 6 Knee Tucks"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240730/mood_app/workout_images/j8odgh5l_hanging_knee_2.jpg',
          intensityReason: 'Combo extends time under tension per set',
          moodTips: [
            {
              icon: 'timer',
              title: 'Smooth transitions',
              description: 'No drop or bounce between reps.'
            },
            {
              icon: 'construct',
              title: 'Shoulders stay packed',
              description: 'Keeps abs working, not lats.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_raise',
          training_style: 'mixed',
          intensity_cost: 4,
        },
        {
          name: 'Slow Hanging Knee-to-Chest',
          duration: '10–12 min',
          description: 'Controlled knee-to-chest raises with slow negatives.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 10 — rest 75s between sets, take all of it.\n3 rounds\n• 10 Knee-to-Chest Raises (3s down)\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Knee-to-Chest Raises",
                    "reps": "10"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240698/mood_app/workout_images/7v92z8q8_hanging_knee_1.jpg',
          intensityReason: 'Slow eccentric builds strength through full range',
          moodTips: [
            {
              icon: 'timer',
              title: 'Eccentric matters',
              description: 'Lower knees for a full 3 seconds.'
            },
            {
              icon: 'construct',
              title: 'Pelvic tilt first',
              description: 'Abs initiate before legs move.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_raise',
          training_style: 'strength',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Weighted Hanging Leg Raises',
          duration: '12–14 min',
          description: 'Loaded leg raises to overload lower ab strength.',
          battlePlan: 'Instructions: 4 sets of 8 — rest 90s between sets, take all of it.\n4 rounds\n• 8 Weighted Straight-Leg Raises\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Weighted Straight-Leg Raises",
                    "reps": "8"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240697/mood_app/workout_images/6ileh57d_weighted_leg_riase.jpg',
          intensityReason: 'Added weight overloads lower ab strength',
          moodTips: [
            {
              icon: 'construct',
              title: 'Light load only',
              description: 'Ankle weights or DB held between feet.'
            },
            {
              icon: 'shield',
              title: 'No momentum allowed',
              description: 'Reduce weight if swing appears.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_raise',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Toes-to-Bar (Slow Eccentric)',
          duration: '12–14 min',
          description: 'Full-range toes-to-bar with extended eccentric.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 6–8 — rest 90s between sets, take all of it.\n3 rounds\n• 6–8 Toes-to-Bar (3–4s eccentric)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Toes-to-Bar",
                    "reps": "6–8",
                    "tutorialSlug": "hanging_toe_touch"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240734/mood_app/workout_images/m1p9379o_hanging_toe_touch.jpg',
          intensityReason: 'Extended eccentric maximizes strength gains',
          moodTips: [
            {
              icon: 'timer',
              title: 'Control the descent',
              description: '3–4s lowering is the challenge.'
            },
            {
              icon: 'construct',
              title: 'Ribs stay down',
              description: 'Prevents cheating through arching.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_raise',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Front Lever Reps',
          duration: '12–14 min',
          description: 'Dynamic front lever reps without full parallel holds.',
          battlePlan: 'Instructions: 4 sets of 4–6 — rest 90s between sets, take all of it.\n4 rounds\n• 4–6 Front Lever Reps (tuck, advanced tuck, or band-assisted)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Front Lever Reps",
                    "reps": "4–6",
                    "tutorialSlug": "8DA3DEBF-82F9-4F0B-8DA3-ED68283A1BC8"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240691/mood_app/workout_images/0y6d4cli_front_lever.jpg',
          intensityReason: 'Dynamic lever reps build incredible core strength',
          moodTips: [
            {
              icon: 'flash',
              title: 'Reps over holds',
              description: 'Move through tuck or advanced-tuck instead of freezing.'
            },
            {
              icon: 'construct',
              title: 'Hollow body first',
              description: 'Posterior pelvic tilt initiates every rep.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_raise',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        }
      ]
    }
  }
];
