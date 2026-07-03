import { EquipmentWorkouts } from '../types/workout';

// Bodyweight explosiveness workout database with all equipment types
export const bodyweightExplosivenessDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Battle Ropes',
    icon: 'remove',
    workouts: {
      beginner: [
        {
          name: 'Explosive Rope Slams',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 3,
          description: 'Short all-out bursts build crisp explosive intent and fast resets',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 8s — rest 60s between sets, take all of it.\n3 sets\n• 3 × 8s Max Slams (15s between efforts)\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Max Slams",
                    "reps": "8s",
                    "sets": 3
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 8s — rest 60s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240593/mood_app/workout_images/6c5jmoo9_download_32_.jpg',
          intensityReason: 'Braced core and hip hinge connection builds safe full-body power',
          moodTips: [
            {
              icon: 'body',
              title: 'Core Bracing',
              description: 'Brace ribs down; hinge slightly on the slam'
            },
            {
              icon: 'trending-down',
              title: 'Handle Drive',
              description: 'Drive handles to floor; elbows track down, not wide'
            }
          ]
        },
        {
          name: 'Alternating Waves',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 3,
          description: 'Fast alternating arms with high knees build efficient elastic rhythm',
          battlePlan: 'Instructions: Waves: each round runs the rep scheme (e.g. 3-2-1) building load slightly across the wave — reset fully between waves. 4 rounds — all 2 moves in order, then rest 45–60s.\n4 rounds\n• 15s Alternating Waves\n• 10s In-place High Knees\nRest 45–60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Alternating Waves",
                    "reps": "15s",
                    "tutorialSlug": "battle_rope_alternating_waves"
                  },
                  {
                    "name": "In-place High Knees",
                    "reps": "10s"
                  }
                ],
                "rounds": 4,
                "rest": "45–60s"
              }
            ],
            "instructions": "Waves: each round runs the rep scheme (e.g. 3-2-1) building load slightly across the wave — reset fully between waves. 4 rounds — all 2 moves in order, then rest 45–60s."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240590/mood_app/workout_images/5mc5mvzc_download_33_.jpg',
          intensityReason: 'High-knee wave combo builds explosive arm speed and postural control',
          moodTips: [
            {
              icon: 'walk',
              title: 'High Knees',
              description: '"High knees" = fast in-place knee drive on balls of feet'
            },
            {
              icon: 'fitness',
              title: 'Arm Movement',
              description: 'Snap from elbows; shoulders stay low and packed'
            }
          ]
        },
        {
          name: 'Side-to-Side Waves',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 3,
          description: 'Hip shifts drive crisp lateral hits without excessive trunk twist',
          battlePlan: 'Instructions: Waves: each set runs the rep scheme (e.g. 3-2-1) building load slightly across the wave — reset fully between waves. 3 sets of 12s — rest 60s between sets, take all of it.\n3 sets\n• 12s Side-to-Side Waves\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Side-to-Side Waves",
                    "reps": "12s",
                    "tutorialSlug": "battle_rope_side_to_side_slams"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ],
            "instructions": "Waves: each set runs the rep scheme (e.g. 3-2-1) building load slightly across the wave — reset fully between waves. 3 sets of 12s — rest 60s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240589/mood_app/workout_images/4pzxeicw_download_34_.jpg',
          intensityReason: 'Lateral strikes train frontal-plane power control and stability',
          moodTips: [
            {
              icon: 'swap-horizontal',
              title: 'Hip Movement',
              description: 'Shift hips left/right; torso faces forward'
            },
            {
              icon: 'pulse',
              title: 'Rope Control',
              description: 'Keep rope slack minimal; crisp, even strikes'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Slam + Reactive Drop Squats',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 4,
          description: 'Quick catches teach fast elastic rebound control with rapid transitions',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets — all 2 moves in order, then rest 75s.\n4 sets\n• 10 Hard Slams\n• 4 Reactive Drop Squats (stick 1s, then pop)\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Hard Slams",
                    "reps": "10"
                  },
                  {
                    "name": "Reactive Drop Squats",
                    "reps": "4",
                    "tutorialSlug": "kb_squat"
                  }
                ],
                "rounds": 4,
                "rest": "75s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets — all 2 moves in order, then rest 75s."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240593/mood_app/workout_images/6c5jmoo9_download_32_.jpg',
          intensityReason: 'Slam-to-drop pairing builds reactive control and deceleration skills',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Drop Squat',
              description: '"Reactive drop squat" = 6–8" drop into instant soft catch'
            },
            {
              icon: 'checkmark',
              title: 'Landing',
              description: 'Land mid-foot; knees over toes; pop back up'
            }
          ]
        },
        {
          name: 'Alternating Waves + Bounce Steps',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 4,
          description: 'Light bounce steps maintain high cadence while keeping waves crisp',
          battlePlan: 'Instructions: Waves: each set runs the rep scheme (e.g. 3-2-1) building load slightly across the wave — reset fully between waves. 4 sets of 20s — rest 75s between sets, take all of it.\n4 sets\n• 20s Alternating Waves + Bounce Steps\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Alternating Waves + Bounce Steps",
                    "reps": "20s"
                  }
                ],
                "rounds": 4,
                "rest": "75s"
              }
            ],
            "instructions": "Waves: each set runs the rep scheme (e.g. 3-2-1) building load slightly across the wave — reset fully between waves. 4 sets of 20s — rest 75s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240590/mood_app/workout_images/5mc5mvzc_download_33_.jpg',
          intensityReason: 'Pogo foot rhythm enhances stiffness training and arm velocity',
          moodTips: [
            {
              icon: 'basketball',
              title: 'Bounce Steps',
              description: '"Bounce steps" = small ankle pogos; heels kiss ground quietly'
            },
            {
              icon: 'flash',
              title: 'Speed Focus',
              description: 'Keep cadence high; elbows whip; wrists snap'
            }
          ]
        },
        {
          name: 'Hand-Over-Hand Rope Pull',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 4,
          description: 'Low stance with quick re-grips maintaining constant sled tension',
          battlePlan: 'Instructions: Waves: each round runs the rep scheme (e.g. 3-2-1) building load slightly across the wave — reset fully between waves. 3 rounds — all 2 moves in order, then rest 90s.\n3 rounds\n• Weighted Rope Pull — ~20–25m, hand-over-hand\n• 10s Easy Waves reset\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Weighted Rope Pull",
                    "reps": "~20–25m, hand-over-hand"
                  },
                  {
                    "name": "Easy Waves reset",
                    "reps": "10s"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ],
            "instructions": "Waves: each round runs the rep scheme (e.g. 3-2-1) building load slightly across the wave — reset fully between waves. 3 rounds — all 2 moves in order, then rest 90s."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240589/mood_app/workout_images/4pzxeicw_download_34_.jpg',
          intensityReason: 'Heavy horizontal pulls develop rapid start-phase force production',
          moodTips: [
            {
              icon: 'body',
              title: 'Body Position',
              description: 'Sit low; core braced; pull to chest, re-grip fast'
            },
            {
              icon: 'barbell',
              title: 'Equipment',
              description: 'Use a sled/plate anchored to rope for load'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Max Slam Density',
          duration: '12–14 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 5,
          description: 'Repeat maximum slams while preserving consistent height and tempo',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 12s — rest 18s between sets, take all of it.\n5 sets\n• 12s Max Slams\nRest 18s\nRepeat 2 efforts per set (total 10 max efforts)',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Max Slams",
                    "note": "Repeat 2 efforts per set (total 10 max efforts)",
                    "reps": "12s"
                  }
                ],
                "rounds": 5,
                "rest": "18s"
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 12s — rest 18s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240593/mood_app/workout_images/6c5jmoo9_download_32_.jpg',
          intensityReason: 'Short bursts with tight rest intervals sustain peak power output',
          moodTips: [
            {
              icon: 'speedometer',
              title: 'Consistency',
              description: 'Each slam same height and tempo'
            },
            {
              icon: 'leaf',
              title: 'Breathing',
              description: 'Hips hinge, not spine flex; breathe sharp'
            }
          ]
        },
        {
          name: 'Side-to-Side Wave Clusters',
          duration: '12–14 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 5,
          description: 'Crisp lateral hits maintained across short cluster intervals',
          battlePlan: 'Instructions: Cluster set: 10s Side-to-Side Waves, 10s rest, 10s Waves — the built-in mini-rest keeps every rep explosive, don\'t cut it short. 4 sets — rest 90s between sets, take all of it.\n4 sets\n• Cluster: 10s Side-to-Side Waves, 10s rest, 10s Waves\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Side-to-Side Waves, 10s rest, 10s Waves",
                    "reps": "10s"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ],
            "instructions": "Cluster set: 10s Side-to-Side Waves, 10s rest, 10s Waves — the built-in mini-rest keeps every rep explosive, don't cut it short. 4 sets — rest 90s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240590/mood_app/workout_images/5mc5mvzc_download_33_.jpg',
          intensityReason: 'Cluster format sharpens lateral velocity maintenance under fatigue',
          moodTips: [
            {
              icon: 'body',
              title: 'Stance',
              description: 'Feet athletic stance; hips shift, torso square'
            },
            {
              icon: 'flash',
              title: 'Hand Movement',
              description: 'Hands travel across midline together, tight snap'
            }
          ]
        },
        {
          name: 'Heavy Rope Pull + Sprint Contrast',
          duration: '12–16 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 5,
          description: 'Load the movement pattern, then sprint tall with explosive knee drive',
          battlePlan: 'Instructions: Contrast pair: the heavy move primes your nervous system — explode through the light/fast move right after. 5 rounds — all 2 moves in order, then rest 120s.\n5 rounds\n• HEAVY Rope Pull — ~20m, hand-over-hand to sled\n• Acceleration Sprint — ~20m\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "HEAVY Rope Pull",
                    "reps": "~20m, hand-over-hand to sled"
                  },
                  {
                    "name": "Acceleration Sprint",
                    "reps": "~20m"
                  }
                ],
                "rounds": 5,
                "rest": "120s"
              }
            ],
            "instructions": "Contrast pair: the heavy move primes your nervous system — explode through the light/fast move right after. 5 rounds — all 2 moves in order, then rest 120s."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240589/mood_app/workout_images/4pzxeicw_download_34_.jpg',
          intensityReason: 'Heavy pulls potentiate and enhance sprint acceleration mechanics',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Heavy Pull',
              description: 'Heavy hand-over-hand: long pulls to chest, no shrugging'
            },
            {
              icon: 'walk',
              title: 'Sprint Form',
              description: 'Sprint tall with big knee drive'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Plyo Box',
    icon: 'cube',
    workouts: {
      beginner: [
        {
          name: 'Step-Up Pops',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'plyo',
          intensity_cost: 3,
          description: 'Fast step drive, brief float phase, and soft balanced landing',
          battlePlan: 'Instructions: Drive through the heel of the TOP foot — the bottom leg is along for the ride. Control the step down. Complete ALL reps on one side before switching — no alternating unless written. 3 sets of 6 per side — rest 60s between sets, take all of it.\n3 sets\n• 6 per leg Step-Up Pops (low box)\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Step-Up Pops",
                    "reps": "6/leg",
                    "tutorialSlug": "plyo_box_step_up_pops"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ],
            "instructions": "Drive through the heel of the TOP foot — the bottom leg is along for the ride. Control the step down. Complete ALL reps on one side before switching — no alternating unless written. 3 sets of 6 per side — rest 60s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240614/mood_app/workout_images/nro93355_slbj.jpg',
          intensityReason: 'Low-impact vertical force development with precise movement control',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Step-Up Pop',
              description: '"Step-up pop" = drive through box, brief air, soft land on box'
            },
            {
              icon: 'footsteps',
              title: 'Step Down',
              description: 'Step down quietly; switch legs each rep'
            }
          ]
        },
        {
          name: 'Low Box Jumps',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'plyo',
          intensity_cost: 3,
          description: 'Jump up confidently, hold two seconds, train calm deceleration',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 5 — rest 60s between sets, take all of it.\n3 sets\n• 5 Box Jumps (stick 2s)\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Box Jumps",
                    "reps": "5",
                    "tutorialSlug": "plyo_box_jump"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 5 — rest 60s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240628/mood_app/workout_images/wok1mz8a_rbj.jpg',
          intensityReason: 'Emphasizes safe landing quality and proper joint alignment skills',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Jump Form',
              description: 'Arms swing; jump tall; knees track over toes'
            },
            {
              icon: 'checkmark',
              title: 'Landing',
              description: 'Stick landing 2s; full foot on box'
            }
          ]
        },
        {
          name: 'Depth Step Rebound',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'plyo',
          intensity_cost: 3,
          description: 'Step off 6-8 inches, pop to box with minimal ground contact',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 3 — rest 75s between sets, take all of it.\n3 sets\n• 3 Depth Step → Rebound to Box (low)\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Depth Step → Rebound to Box",
                    "reps": "3",
                    "tutorialSlug": "depth_step_rebound"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 3 — rest 75s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240617/mood_app/workout_images/ofqstfu6_download_1_.jpg',
          intensityReason: 'Drop then quick rebound primes stretch-shortening cycle timing',
          moodTips: [
            {
              icon: 'flash',
              title: 'Contact',
              description: 'Minimal ground contact; spring from ankles'
            },
            {
              icon: 'eye',
              title: 'Posture',
              description: 'Chest tall; eyes forward'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Box Jump Repeats',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'plyo',
          intensity_cost: 4,
          description: 'Crisp consecutive jumps with short resets to preserve power output',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 6–8 — rest 75s between sets, take all of it.\n4 sets\n• 6–8 Box Jumps\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Box Jumps",
                    "reps": "6–8",
                    "tutorialSlug": "plyo_box_jump"
                  }
                ],
                "rounds": 4,
                "rest": "75s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 6–8 — rest 75s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240628/mood_app/workout_images/wok1mz8a_rbj.jpg',
          intensityReason: 'Repeated jump efforts build sustainable explosive power capacity',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Reset',
              description: 'Reset stance and breath each rep'
            },
            {
              icon: 'speedometer',
              title: 'Consistency',
              description: 'Match height and landing each time'
            }
          ]
        },
        {
          name: 'Weighted Step-Up Pops',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'plyo',
          intensity_cost: 4,
          description: 'Hold dumbbells at sides; drive up quick; land soft on box top',
          battlePlan: 'Instructions: The hold is strict: locked position, squeezing hard, no drifting. Drive through the heel of the TOP foot — the bottom leg is along for the ride. Control the step down. 4 sets of 5 per side — rest 90s between sets, take all of it.\n4 sets\n• 5 per leg Weighted Step-Up Pops\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Weighted Step-Up Pops",
                    "reps": "5/leg",
                    "tutorialSlug": "plyo_box_step_up_pops"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ],
            "instructions": "The hold is strict: locked position, squeezing hard, no drifting. Drive through the heel of the TOP foot — the bottom leg is along for the ride. Control the step down. 4 sets of 5 per side — rest 90s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240599/mood_app/workout_images/9x4an2wx_wstepups.jpg',
          intensityReason: 'Light external load raises concentric force demand safely',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Weight Selection',
              description: 'Use light DBs (5–15 lb each); no arm yank'
            },
            {
              icon: 'body',
              title: 'Control',
              description: 'Control the step-down; posture tall'
            }
          ]
        },
        {
          name: 'Depth Drop Rebound',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'plyo',
          intensity_cost: 4,
          description: 'Drop down, stick one second hold, then rebound to box immediately',
          battlePlan: 'Instructions: Superset: the paired moves run back-to-back with zero rest — rest only after the pair. Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 3 — rest 90s between sets, take all of it.\n4 sets\n• 3 Depth Drop (stick 1s) → Rebound to Box\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Depth Drop → Rebound to Box",
                    "reps": "3"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ],
            "instructions": "Superset: the paired moves run back-to-back with zero rest — rest only after the pair. Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 3 — rest 90s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240617/mood_app/workout_images/ofqstfu6_download_1_.jpg',
          intensityReason: 'Eccentric stick then rapid takeoff improves force development rate',
          moodTips: [
            {
              icon: 'body',
              title: 'Landing Position',
              description: 'Heels kiss; knees soft; hips back'
            },
            {
              icon: 'flash',
              title: 'Rebound Timing',
              description: 'Rebound immediately after stick'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Weighted Box Jumps',
          duration: '12–14 min',
          path: 'bodyweight',
          cart_flavor: 'plyo',
          intensity_cost: 5,
          description: 'Light dumbbells or vest; jump explosively to moderate-high box',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 6–8 — rest 90s between sets, take all of it.\n5 sets\n• 6–8 Weighted Box Jumps\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Weighted Box Jumps",
                    "reps": "6–8",
                    "tutorialSlug": "plyo_box_jump"
                  }
                ],
                "rounds": 5,
                "rest": "90s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 6–8 — rest 90s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240619/mood_app/workout_images/okorghxb_wbj.jpg',
          intensityReason: 'Small load increases power demands under controlled landing stress',
          moodTips: [
            {
              icon: 'flash',
              title: 'Load Priority',
              description: 'Load stays light; prioritize speed'
            },
            {
              icon: 'footsteps',
              title: 'Landing Control',
              description: 'Land quiet; step down controlled'
            }
          ]
        },
        {
          name: 'Depth Drop Triple',
          duration: '12–14 min',
          path: 'bodyweight',
          cart_flavor: 'plyo',
          intensity_cost: 5,
          description: 'Drop down, rebound on floor, then jump to box with quick rhythm',
          battlePlan: 'Instructions: Triplet — 1 Depth Drop → 1 Floor Rebound → 1 Box Jump.\n5 rounds\n• Repeat 2 triplets/round (6 jumps)\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Depth Drop Triple"
                  }
                ],
                "rounds": 5,
                "rest": "120s"
              }
            ],
            "instructions": "Triplet — 1 Depth Drop → 1 Floor Rebound → 1 Box Jump."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240617/mood_app/workout_images/ofqstfu6_download_1_.jpg',
          intensityReason: 'Multi-contact jump series develops reactive elastic stiffness',
          moodTips: [
            {
              icon: 'flash',
              title: 'Contact Speed',
              description: 'Contacts fast; torso stable'
            },
            {
              icon: 'fitness',
              title: 'Arm Drive',
              description: 'Use arms aggressively on last jump'
            }
          ]
        },
        {
          name: 'Bounds + Weighted Finish',
          duration: '12–16 min',
          path: 'bodyweight',
          cart_flavor: 'plyo',
          intensity_cost: 5,
          description: 'Continuous box bounds followed immediately by crisp weighted steps',
          battlePlan: 'Instructions: Superset: the paired moves run back-to-back with zero rest — rest only after the pair. Drive through the heel of the TOP foot — the bottom leg is along for the ride. Control the step down. 4 rounds — all 2 moves in order, then rest 120s.\n4 rounds\n• 8–10 Continuous Box Bounds (no full reset)\n• 6 Weighted Step-Up Pops — 3/leg — immediately, no rest\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Continuous Box Bounds",
                    "reps": "8–10"
                  },
                  {
                    "name": "Weighted Step-Up Pops",
                    "note": "3/leg — immediately, no rest",
                    "reps": "6",
                    "tutorialSlug": "plyo_box_step_up_pops"
                  }
                ],
                "rounds": 4,
                "rest": "120s"
              }
            ],
            "instructions": "Superset: the paired moves run back-to-back with zero rest — rest only after the pair. Drive through the heel of the TOP foot — the bottom leg is along for the ride. Control the step down. 4 rounds — all 2 moves in order, then rest 120s."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240599/mood_app/workout_images/9x4an2wx_wstepups.jpg',
          intensityReason: 'Rhythm bounds then loaded pops challenge explosive power endurance',
          moodTips: [
            {
              icon: 'basketball',
              title: 'Bounce Quality',
              description: 'Stay bouncy; mid-foot landings'
            },
            {
              icon: 'barbell',
              title: 'Finisher',
              description: 'Finisher: small DBs; crisp vertical intent'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Med Ball',
    icon: 'basketball',
    workouts: {
      beginner: [
        {
          name: 'Chest Pass to Wall',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 3,
          description: 'Step forward, snap wrists through, receive softly, repeat quickly',
          battlePlan: 'Instructions: 4 sets of 8–10 — rest 45–60s between sets, take all of it.\n4 sets\n• 8–10 Chest Passes (medium ball)\nRest 45–60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Chest Passes",
                    "reps": "8–10",
                    "tutorialSlug": "slam_ball_chest_pass"
                  }
                ],
                "rounds": 4,
                "rest": "45–60s"
              }
            ],
            "instructions": "4 sets of 8–10 — rest 45–60s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240630/mood_app/workout_images/xacltrm0_download.jpg',
          intensityReason: 'Linear throw patterns teach explosive timing and core stiffness',
          moodTips: [
            {
              icon: 'walk',
              title: 'Throwing Form',
              description: 'Step into throw; snap wrists through'
            },
            {
              icon: 'hand-right',
              title: 'Catching',
              description: 'Catch softly; reset stance'
            }
          ]
        },
        {
          name: 'Overhead Slam',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 3,
          description: 'Tall reach overhead, neutral spine, direct powerful slam motion',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 8–10 — rest 60s between sets, take all of it.\n3 sets\n• 8–10 Overhead Slams\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Overhead Slams",
                    "reps": "8–10",
                    "tutorialSlug": "slam_ball_slams"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 8–10 — rest 60s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240600/mood_app/workout_images/dkiyafwm_download_1_.jpg',
          intensityReason: 'Full-body slam movement grooves explosive hinge-to-slam linkage',
          moodTips: [
            {
              icon: 'body',
              title: 'Hip Hinge',
              description: 'Hinge hips; ribs down; slam straight'
            },
            {
              icon: 'hand-right',
              title: 'Ball Control',
              description: 'Follow ball down; re-grip quick'
            }
          ]
        },
        {
          name: 'Short Rotational Toss',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 3,
          description: 'Quick hip lead rotation into wall with controlled ball rebound',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 3 sets of 6–8 per side — rest 60s between sets, take all of it.\n3 sets\n• 6–8 per side Short Tosses\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Short Tosses",
                    "reps": "6–8/side"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ],
            "instructions": "Complete ALL reps on one side before switching — no alternating unless written. 3 sets of 6–8 per side — rest 60s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240615/mood_app/workout_images/od2vv8jo_mb.jpg',
          intensityReason: 'Compact rotational movement links hips, core, and release timing',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Foot Position',
              description: 'Rear foot pivots; hip leads torso'
            },
            {
              icon: 'swap-horizontal',
              title: 'Hip Drive',
              description: "Don't arm-throw; rotate hips first"
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Scoop Vertical Toss',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 4,
          description: 'Hinge load deep, tall finish, toss high, catch safely overhead',
          battlePlan: 'Instructions: 4 sets of 6–8 — rest 75s between sets, take all of it.\n4 sets\n• 6–8 Vertical Scoop Tosses\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Vertical Scoop Tosses",
                    "reps": "6–8"
                  }
                ],
                "rounds": 4,
                "rest": "75s"
              }
            ],
            "instructions": "4 sets of 6–8 — rest 75s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240609/mood_app/workout_images/lywbjyl3_download_2_.jpg',
          intensityReason: 'Hip triple extension movement with clean explosive release timing',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Ball Position',
              description: 'Long arms; keep ball close on load'
            },
            {
              icon: 'trending-up',
              title: 'Release',
              description: 'Finish tall; track and catch safely'
            }
          ]
        },
        {
          name: 'Full Rotational Throw',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 4,
          description: 'Load back hip deeply, rotate through core, snap into wall target',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 6–8 per side — rest 75–90s between sets, take all of it.\n4 sets\n• 6–8 per side Rotational Throws\nRest 75–90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Rotational Throws",
                    "reps": "6–8/side",
                    "tutorialSlug": "slam_ball_rotational_throw"
                  }
                ],
                "rounds": 4,
                "rest": "75–90s"
              }
            ],
            "instructions": "Complete ALL reps on one side before switching — no alternating unless written. Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 6–8 per side — rest 75–90s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240615/mood_app/workout_images/od2vv8jo_mb.jpg',
          intensityReason: 'Larger range of motion increases explosive lateral power transfer',
          moodTips: [
            {
              icon: 'swap-horizontal',
              title: 'Hip Rotation',
              description: 'Load back hip; rotate through front foot'
            },
            {
              icon: 'refresh',
              title: 'Reset',
              description: 'Catch; quick reset to stance'
            }
          ]
        },
        {
          name: 'Slam + Quick Pick',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 4,
          description: 'Hard slam down, instant scoop up, repeat at consistent steady height',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 rounds — all 2 moves in order, then rest 90s.\n4 rounds\n• 8–10 Overhead Slams\n• 8–10 Fast Scoop Resets\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Overhead Slams",
                    "reps": "8–10",
                    "tutorialSlug": "slam_ball_slams"
                  },
                  {
                    "name": "Fast Scoop Resets",
                    "reps": "8–10"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 rounds — all 2 moves in order, then rest 90s."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240600/mood_app/workout_images/dkiyafwm_download_1_.jpg',
          intensityReason: 'Rapid reset pattern trains repeatable explosive power output',
          moodTips: [
            {
              icon: 'body',
              title: 'Spine Position',
              description: 'Keep spine neutral; hinge; reload fast'
            },
            {
              icon: 'speedometer',
              title: 'Consistency',
              description: 'Same slam height every rep'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Counter-Rotation Heave',
          duration: '12–14 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 5,
          description: 'Stretch away from target, unwind explosively, heave far with stick landing',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 4 sets of 5–6 per side — rest 90–120s between sets, take all of it.\n4 sets\n• 5–6 per side Heaves (mark distance)\nRest 90–120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Heaves",
                    "reps": "5–6/side"
                  }
                ],
                "rounds": 4,
                "rest": "90–120s"
              }
            ],
            "instructions": "Complete ALL reps on one side before switching — no alternating unless written. 4 sets of 5–6 per side — rest 90–120s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240615/mood_app/workout_images/od2vv8jo_mb.jpg',
          intensityReason: 'Counter-rotation preload enables maximal explosive lateral power release',
          moodTips: [
            {
              icon: 'swap-horizontal',
              title: 'Preload',
              description: 'Preload trunk opposite direction'
            },
            {
              icon: 'body',
              title: 'Follow Through',
              description: 'Full follow-through; stick stance'
            }
          ]
        },
        {
          name: 'Slam Cluster Density',
          duration: '12–14 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 5,
          description: 'Short explosive bursts separated by micro-rests to maintain crisp quality',
          battlePlan: 'Instructions: Cluster set: 4 Slams, 12s rest, 4 Slams — the built-in mini-rest keeps every rep explosive, don\'t cut it short. 4 sets of 8 — rest 120s between sets, take all of it.\n4 sets\n• 8 Slams — cluster style\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Slams",
                    "note": "cluster style",
                    "reps": "8",
                    "tutorialSlug": "slam_ball_slams"
                  }
                ],
                "rounds": 4,
                "rest": "120s"
              }
            ],
            "instructions": "Cluster set: 4 Slams, 12s rest, 4 Slams — the built-in mini-rest keeps every rep explosive, don't cut it short. 4 sets of 8 — rest 120s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240600/mood_app/workout_images/dkiyafwm_download_1_.jpg',
          intensityReason: 'Cluster training design sustains high-quality explosive outputs',
          moodTips: [
            {
              icon: 'speedometer',
              title: 'Output Quality',
              description: 'Match slam speed/height across reps'
            },
            {
              icon: 'leaf',
              title: 'Brief Rest',
              description: 'Two deep breaths between clusters'
            }
          ]
        },
        {
          name: 'Rotational Heave + Stick',
          duration: '12–16 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 5,
          description: 'Big rotational heave for distance; freeze posture on finish position',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 5 sets of 4–5 per side — rest 120s between sets, take all of it.\n5 sets\n• 4–5 per side Heave + Stick (mark best)\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Heave + Stick",
                    "reps": "4–5/side"
                  }
                ],
                "rounds": 5,
                "rest": "120s"
              }
            ],
            "instructions": "Complete ALL reps on one side before switching — no alternating unless written. 5 sets of 4–5 per side — rest 120s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240615/mood_app/workout_images/od2vv8jo_mb.jpg',
          intensityReason: 'Maximum lateral power output combined with controlled deceleration',
          moodTips: [
            {
              icon: 'swap-horizontal',
              title: 'Movement Chain',
              description: 'Hip leads; trunk follows; arm last'
            },
            {
              icon: 'checkmark',
              title: 'Finish Position',
              description: 'Stick finish: hips square; eyes level'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Sled',
    icon: 'car-sport',
    workouts: {
      beginner: [
        {
          name: 'Push Starts',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 3,
          description: 'Short 8-10 meter drives with stacked, rigid core positioning',
          battlePlan: 'Instructions: 4 sets of ~8–10m, light — rest 60–75s between sets, take all of it.\n4 sets\n• Sled Push — ~8–10m, light\nRest 60–75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Sled Push",
                    "reps": "~8–10m, light"
                  }
                ],
                "rounds": 4,
                "rest": "60–75s"
              }
            ],
            "instructions": "4 sets of ~8–10m, light — rest 60–75s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240625/mood_app/workout_images/tpb5vjf0_download_8_.jpg',
          intensityReason: 'Training teaches forward lean mechanics, stride, and first-step power',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Body Angle',
              description: '45° lean; arms pump big'
            },
            {
              icon: 'footsteps',
              title: 'Foot Strike',
              description: 'Punch ground back under hips'
            }
          ]
        },
        {
          name: 'Backward Drags',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 3,
          description: 'Quick small backward steps maintaining tall upright posture',
          battlePlan: 'Instructions: 3 sets of ~12–15m, light — rest 60–75s between sets, take all of it.\n3 sets\n• Backward Drag — ~12–15m, light\nRest 60–75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Backward Drag",
                    "reps": "~12–15m, light"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s"
              }
            ],
            "instructions": "3 sets of ~12–15m, light — rest 60–75s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240603/mood_app/workout_images/hl5sfr6f_Screenshot_2025-12-03_at_1_34_15_PM.jpg',
          intensityReason: 'Quad-focused drag movement builds deceleration and drive strength',
          moodTips: [
            {
              icon: 'body',
              title: 'Posture',
              description: 'Chest high; small quick steps'
            },
            {
              icon: 'remove',
              title: 'Strap Tension',
              description: 'Keep straps taut; even tempo'
            }
          ]
        },
        {
          name: 'Push Turn Pull',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 3,
          description: 'Smooth 180-degree turn, re-set lean angle, continue powerful steps',
          battlePlan: 'Instructions: 3 sets of ~10m, harness or rope — rest 75s between sets, take all of it.\n3 sets\n• Push → 10m Pull — ~10m, harness or rope\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Push → 10m Pull",
                    "reps": "~10m, harness or rope"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ],
            "instructions": "3 sets of ~10m, harness or rope — rest 75s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240591/mood_app/workout_images/5naojfbu_download_7_.jpg',
          intensityReason: 'Direction changes sharpen re-acceleration and movement transition',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Turn Technique',
              description: 'Plant on balls; pivot smoothly'
            },
            {
              icon: 'eye',
              title: 'Re-acceleration',
              description: 'Re-lean instantly; eyes forward'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Sprint Push Repeats',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 4,
          description: 'High-quality explosive drives with measured recovery between efforts',
          battlePlan: 'Instructions: 5 sets of ~12–15m, light-moderate — rest 75–90s between sets, take all of it.\n5 sets\n• Sprint Push — ~12–15m, light-moderate\nRest 75–90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Sprint Push",
                    "reps": "~12–15m, light-moderate"
                  }
                ],
                "rounds": 5,
                "rest": "75–90s"
              }
            ],
            "instructions": "5 sets of ~12–15m, light-moderate — rest 75–90s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240591/mood_app/workout_images/5naojfbu_download_7_.jpg',
          intensityReason: 'Repeated 12-15 meter efforts build explosive acceleration rate capacity',
          moodTips: [
            {
              icon: 'flash',
              title: 'First Steps',
              description: 'Violent first 5 steps'
            },
            {
              icon: 'speedometer',
              title: 'Cadence',
              description: 'Low heel recovery; quick cadence'
            }
          ]
        },
        {
          name: 'Harness Pull Accels',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 4,
          description: 'Long ground pushes, steady forward lean, rope tension constant',
          battlePlan: 'Instructions: 4 sets of ~20–25m — rest 90s between sets, take all of it.\n4 sets\n• Harness Pull — ~20–25m\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Harness Pull",
                    "reps": "~20–25m"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ],
            "instructions": "4 sets of ~20–25m — rest 90s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240607/mood_app/workout_images/l5cdm1b1_download_6_.jpg',
          intensityReason: 'Horizontal pull resistance increases posterior chain force output',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Body Drive',
              description: 'Long pushes; maintain lean'
            },
            {
              icon: 'remove',
              title: 'Rope Tension',
              description: 'Keep rope taut; no stutter steps'
            }
          ]
        },
        {
          name: 'Push + Backward Drag',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 4,
          description: 'Forward explosive push then backward drag with smooth direction turn',
          battlePlan: 'Instructions: 4 rounds — all 2 moves in order, then rest 90s.\n4 rounds\n• Sprint Push — ~15m\n• Backward Drag — ~15m\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Sprint Push",
                    "reps": "~15m"
                  },
                  {
                    "name": "Backward Drag",
                    "reps": "~15m"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ],
            "instructions": "4 rounds — all 2 moves in order, then rest 90s."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240625/mood_app/workout_images/tpb5vjf0_download_8_.jpg',
          intensityReason: 'Contrast pairing effectively balances front and back chain strength',
          moodTips: [
            {
              icon: 'body',
              title: 'Core Stability',
              description: 'Brace trunk both directions'
            },
            {
              icon: 'refresh',
              title: 'Transition',
              description: 'Smooth transition at the turn'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Wave Starts Cluster',
          duration: '12–16 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 5,
          description: 'Micro-efforts with micro-rest intervals to maintain explosive quality',
          battlePlan: 'Instructions: Cluster set: 4 × 5m Sled Push, 15s between efforts — the built-in mini-rest keeps every rep explosive, don\'t cut it short. 4 sets — rest 120s between sets, take all of it.\n4 sets\n• Cluster: 4 × 5m Sled Push, 15s between efforts\nRest 120s between clusters',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "4 × 5m Sled Push, 15s between efforts",
                    "tutorialSlug": "sled_push"
                  }
                ],
                "rounds": 4,
                "rest": "120s between clusters"
              }
            ],
            "instructions": "Cluster set: 4 × 5m Sled Push, 15s between efforts — the built-in mini-rest keeps every rep explosive, don't cut it short. 4 sets — rest 120s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240591/mood_app/workout_images/5naojfbu_download_7_.jpg',
          intensityReason: 'Repeated 5-meter bursts sharpen explosive first-step power output',
          moodTips: [
            {
              icon: 'flash',
              title: 'Start Position',
              description: 'Preload; big arm punch out'
            },
            {
              icon: 'body',
              title: 'Shin Angle',
              description: 'Keep shin angle set and stiff'
            }
          ]
        },
        {
          name: 'Push Pull Shuttle',
          duration: '12–16 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 5,
          description: 'Direction shuttle changes with quick re-acceleration timing control',
          battlePlan: 'Instructions: 5 sets of ~10m — rest 120s between sets, take all of it.\n5 sets\n• Push → 10m Pull → 10m Push — ~10m\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Push → 10m Pull → 10m Push",
                    "reps": "~10m"
                  }
                ],
                "rounds": 5,
                "rest": "120s"
              }
            ],
            "instructions": "5 sets of ~10m — rest 120s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240620/mood_app/workout_images/orxi24d4_Screenshot_2025-12-03_at_1_34_50_PM.jpg',
          intensityReason: 'Fast directional transitions challenge loaded agility and control',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Direction Change',
              description: 'Plant and pivot under control'
            },
            {
              icon: 'flash',
              title: 'Re-acceleration',
              description: 'Re-lean instantly; sprint-quality steps'
            }
          ]
        },
        {
          name: 'Flying 20s Contrast',
          duration: '12–16 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 5,
          description: 'Smooth sled push followed immediately by tall, fast free sprint',
          battlePlan: 'Instructions: Superset: the paired moves run back-to-back with zero rest — rest only after the pair. 5 rounds — all 2 moves in order, then rest 150s.\n5 rounds\n• Sled Push — ~15m, light\n• Free Sprint — ~20–25m\nRest 150s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Sled Push",
                    "reps": "~15m, light"
                  },
                  {
                    "name": "Free Sprint",
                    "reps": "~20–25m"
                  }
                ],
                "rounds": 5,
                "rest": "150s"
              }
            ],
            "instructions": "Superset: the paired moves run back-to-back with zero rest — rest only after the pair. 5 rounds — all 2 moves in order, then rest 150s."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240625/mood_app/workout_images/tpb5vjf0_download_8_.jpg',
          intensityReason: 'Light sled resistance primes then free sprint expresses max speed',
          moodTips: [
            {
              icon: 'car-sport',
              title: 'Sled Phase',
              description: 'Sled: smooth, powerful steps'
            },
            {
              icon: 'walk',
              title: 'Sprint Phase',
              description: 'Sprint: tall, relaxed, fast turnover'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Kettlebells',
    icon: 'fitness',
    workouts: {
      beginner: [
        {
          name: 'KB Swing Hip Snap',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 3,
          description: 'Hips drive explosively; bell floats; arms stay relaxed as hooks',
          battlePlan: 'Instructions: 4 sets of 12–15 — rest 60s between sets, take all of it.\n4 sets\n• 12–15 Swings\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Swings",
                    "reps": "12–15"
                  }
                ],
                "rounds": 4,
                "rest": "60s"
              }
            ],
            "instructions": "4 sets of 12–15 — rest 60s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240602/mood_app/workout_images/hdv3g2g2_download.jpg',
          intensityReason: 'Hip hinge timing builds explosive hip extension velocity patterns',
          moodTips: [
            {
              icon: 'body',
              title: 'Hip Hinge',
              description: 'Hinge; shins near vertical'
            },
            {
              icon: 'flash',
              title: 'Hip Snap',
              description: 'Snap hips; bell floats to chest'
            }
          ]
        },
        {
          name: 'Dead-Start Swings',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 3,
          description: 'Deep hike pass, tall explosive stand, crisp stop at chest line',
          battlePlan: 'Instructions: 3 sets of 2 — rest 60–75s between sets, take all of it.\n3 sets\n• 6 × 2 Dead-Start Swings\nRest 60–75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Dead-Start Swings",
                    "reps": "2",
                    "sets": 6
                  }
                ],
                "rounds": 3,
                "rest": "60–75s"
              }
            ],
            "instructions": "3 sets of 2 — rest 60–75s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240602/mood_app/workout_images/hdv3g2g2_download.jpg',
          intensityReason: 'Dead start resets reinforce clean, powerful explosive reps',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Start Position',
              description: 'Hike deep; lats engaged'
            },
            {
              icon: 'trending-up',
              title: 'Hip Extension',
              description: 'Stand hard; stop at chest height'
            }
          ]
        },
        {
          name: 'KB Clean',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'loaded',
          intensity_cost: 3,
          description: 'Close zip path, explosive hip pop, quiet catch in front rack',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 6 per side — rest 75s between sets, take all of it.\n3 sets\n• 6 per side Cleans\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Cleans",
                    "reps": "6/side",
                    "tutorialSlug": "kb_clean"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ],
            "instructions": "Complete ALL reps on one side before switching — no alternating unless written. Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 6 per side — rest 75s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240626/mood_app/workout_images/ua443jp0_download_1_.jpg',
          intensityReason: 'Clean movement path teaches explosive rack timing and turnover',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Bell Path',
              description: 'Zip bell close; rotate around forearm'
            },
            {
              icon: 'flash',
              title: 'Hip Pop',
              description: "Don't curl; pop hips then rack"
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'KB Swing EMOM',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 4,
          description: 'Short consistent bursts every minute maintain explosive quality outputs',
          battlePlan: 'Instructions: Start the work at the top of every minute — whatever\'s left of the minute is your rest. Falling behind? Trim reps, don\'t skip minutes. EMOM for 10 minutes.\n• 12 Swings each minute',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Swings each minute",
                    "reps": "12"
                  }
                ]
              }
            ],
            "instructions": "Start the work at the top of every minute — whatever's left of the minute is your rest. Falling behind? Trim reps, don't skip minutes. EMOM for 10 minutes."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240602/mood_app/workout_images/hdv3g2g2_download.jpg',
          intensityReason: 'On-the-minute training sets sharpen sustainable explosive power',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Bell Path',
              description: 'Same bell path; neutral neck'
            },
            {
              icon: 'flash',
              title: 'Hip Drive',
              description: 'Grip relaxed; hips drive'
            }
          ]
        },
        {
          name: 'Clean to Squat Chain',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'loaded',
          intensity_cost: 4,
          description: 'Explosive pop to rack, fast drop squat, explosive stand tall finish',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 5 per side — rest 90s between sets, take all of it.\n4 sets\n• 5 per side Clean → Squat (alt)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Clean → Squat",
                    "reps": "5/side",
                    "tutorialSlug": "kb_squat"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ],
            "instructions": "Complete ALL reps on one side before switching — no alternating unless written. Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 5 per side — rest 90s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240594/mood_app/workout_images/87sblt74_download_2_.jpg',
          intensityReason: 'Clean-to-squat movement strengthens complete explosive power chain',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Rack Position',
              description: 'Rack tight; elbows in'
            },
            {
              icon: 'trending-up',
              title: 'Squat Drive',
              description: 'Drive hard out of bottom'
            }
          ]
        },
        {
          name: 'KB Snatch',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'loaded',
          intensity_cost: 4,
          description: 'High explosive pull, punch through fast, crisp overhead lockout',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 6 per side — rest 90s between sets, take all of it.\n4 sets\n• 6 per side Snatches\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Snatches",
                    "reps": "6/side",
                    "tutorialSlug": "kettlebell_snatch"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ],
            "instructions": "Complete ALL reps on one side before switching — no alternating unless written. Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 6 per side — rest 90s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240605/mood_app/workout_images/ic2iad2y_download_3_.jpg',
          intensityReason: 'Overhead hip power movement with smooth explosive turnover path',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Pull Path',
              description: 'High pull path; punch through'
            },
            {
              icon: 'flash',
              title: 'Hip Snap',
              description: 'Hinge load; snap tall'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Heavy Two-Hand Swings',
          duration: '12–14 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 5,
          description: 'Big explosive hip snap; stable ribs; float bell to chest height',
          battlePlan: 'Instructions: 5 sets of 12 — rest 90s between sets, take all of it.\n5 sets\n• 12 Heavy Swings\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Heavy Swings",
                    "reps": "12"
                  }
                ],
                "rounds": 5,
                "rest": "90s"
              }
            ],
            "instructions": "5 sets of 12 — rest 90s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240601/mood_app/workout_images/fetvhtg2_download_4_.jpg',
          intensityReason: 'Heavier kettlebells raise power output and demand movement control',
          moodTips: [
            {
              icon: 'body',
              title: 'Posture',
              description: 'Lats down; ribs stacked'
            },
            {
              icon: 'fitness',
              title: 'Bell Control',
              description: 'No overpull; bell floats'
            }
          ]
        },
        {
          name: 'Clean to Press Ladder',
          duration: '12–16 min',
          path: 'bodyweight',
          cart_flavor: 'loaded',
          intensity_cost: 5,
          description: 'Tight rack position, strict press up, alternate sides cleanly',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 4 sets — rest 120s between sets, take all of it. Ladder per side — 3-2-1 Clean + Press.\n4 sets\n• Ladder per side: 3-2-1 Clean + Press\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Ladder per side: 3-2-1 Clean + Press",
                    "tutorialSlug": "kb_clean"
                  }
                ],
                "rounds": 4,
                "rest": "120s"
              }
            ],
            "instructions": "Complete ALL reps on one side before switching — no alternating unless written. 4 sets — rest 120s between sets, take all of it. Ladder per side — 3-2-1 Clean + Press."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240605/mood_app/workout_images/ic2iad2y_download_3_.jpg',
          intensityReason: 'Clean-to-press movement converts explosive force to vertical work',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Rack Position',
              description: 'Rack tight; glutes squeezed'
            },
            {
              icon: 'trending-up',
              title: 'Press Path',
              description: 'Press vertical; biceps by ear'
            }
          ]
        },
        {
          name: 'Snatch + Broad Jump',
          duration: '12–16 min',
          path: 'bodyweight',
          cart_flavor: 'loaded',
          intensity_cost: 5,
          description: 'Explosive snatch reps then stick broad jumps for max distance',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. Every rep at full intent — reset your stance between reps; speed beats load. 4 rounds — all 2 moves in order, then rest 150s.\n4 rounds\n• 8 per side Snatches\n• 3 Broad Jumps (stick 2s)\nRest 150s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Snatches",
                    "reps": "8/side",
                    "tutorialSlug": "kettlebell_snatch"
                  },
                  {
                    "name": "Broad Jumps",
                    "reps": "3"
                  }
                ],
                "rounds": 4,
                "rest": "150s"
              }
            ],
            "instructions": "Complete ALL reps on one side before switching — no alternating unless written. Every rep at full intent — reset your stance between reps; speed beats load. 4 rounds — all 2 moves in order, then rest 150s."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240605/mood_app/workout_images/ic2iad2y_download_3_.jpg',
          intensityReason: 'Overhead explosive power primes horizontal jumping explosion',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Lockout',
              description: 'Lockout stacked; quick down'
            },
            {
              icon: 'walk',
              title: 'Broad Jump',
              description: 'Broad jump: big arm swing'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Sand Bag',
    icon: 'bag',
    workouts: {
      beginner: [
        {
          name: 'SB Shouldering',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'loaded',
          intensity_cost: 3,
          description: 'Scoop bag close to body, drive hips tall for controlled shoulder positioning',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 3 sets of 5 per side — rest 75s between sets, take all of it.\n3 sets\n• 5 per side Shouldering (alt)\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Shouldering",
                    "reps": "5/side"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ],
            "instructions": "Complete ALL reps on one side before switching — no alternating unless written. 3 sets of 5 per side — rest 75s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240588/mood_app/workout_images/0i6z6vvq_download_2_.jpg',
          intensityReason: 'Ground-to-shoulder movement pattern builds explosive triple extension power',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Grip Position',
              description: 'Hands under/around midline; hug bag close'
            },
            {
              icon: 'trending-up',
              title: 'Hip Pop',
              description: 'Pop hips; shrug and roll to shoulder, elbow high'
            }
          ]
        },
        {
          name: 'Sandbag Clean',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'loaded',
          intensity_cost: 3,
          description: 'Drive hips explosively to front rack position with quick high elbow turnover',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 6–8 — rest 75s between sets, take all of it.\n3 sets\n• 6–8 Cleans\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Cleans",
                    "reps": "6–8",
                    "tutorialSlug": "kb_clean"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 6–8 — rest 75s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240595/mood_app/workout_images/93nr796t_sbclean.jpg',
          intensityReason: 'Clean turnover develops fast elbow timing and explosive catch positioning',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Grip',
              description: 'Grip neutral under seams'
            },
            {
              icon: 'fitness',
              title: 'Catch Position',
              description: 'Drive hips; catch high on forearms'
            }
          ]
        },
        {
          name: 'Short Heave Toss',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 3,
          description: 'Load with deep hinge, launch bag 2-4 meters, chase and reset stance safely',
          battlePlan: 'Instructions: 4 sets of 4 — rest 60–75s between sets, take all of it.\n4 sets\n• 4 Heaves (mark distance)\nRest 60–75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Heaves",
                    "reps": "4"
                  }
                ],
                "rounds": 4,
                "rest": "60–75s"
              }
            ],
            "instructions": "4 sets of 4 — rest 60–75s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240611/mood_app/workout_images/m2c4155r_download_3_.jpg',
          intensityReason: 'Short heave distances build safe release timing and throwing form control',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Bag Position',
              description: 'Hands under edge; bag close on load'
            },
            {
              icon: 'trending-up',
              title: 'Release Timing',
              description: 'Release on rise; follow through'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Alt Shoulders Volume',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'loaded',
          intensity_cost: 4,
          description: 'Switch shoulders each rep maintaining snug, stable holds throughout movement',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 4 sets of 6 per side — rest 90s between sets, take all of it.\n4 sets\n• 6 per side Shouldering (alt)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Shouldering",
                    "reps": "6/side"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ],
            "instructions": "Complete ALL reps on one side before switching — no alternating unless written. 4 sets of 6 per side — rest 90s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240588/mood_app/workout_images/0i6z6vvq_download_2_.jpg',
          intensityReason: 'Alternating shoulder reps develop balanced symmetrical explosive power work',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Shoulder Position',
              description: 'Elbow high; forearm vertical on catch'
            },
            {
              icon: 'bag',
              title: 'Bag Control',
              description: "Keep bag snug; don't let it swing out"
            }
          ]
        },
        {
          name: 'Clean to Jump Squat',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'loaded',
          intensity_cost: 4,
          description: 'Clean bag, safely drop to ground, then perform quick soft bodyweight jumps',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 rounds — all 2 moves in order, then rest 90s.\n4 rounds\n• 5 Cleans\n• 4 Jump Squats\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Cleans",
                    "reps": "5",
                    "tutorialSlug": "kb_clean"
                  },
                  {
                    "name": "Jump Squats",
                    "reps": "4",
                    "tutorialSlug": "kb_goblet_jump_squat"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 rounds — all 2 moves in order, then rest 90s."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240595/mood_app/workout_images/93nr796t_sbclean.jpg',
          intensityReason: 'Clean primes neuromuscular system for vertical jump with better power output',
          moodTips: [
            {
              icon: 'bag',
              title: 'Bag Safety',
              description: 'Clean crisp; set bag safely before jump'
            },
            {
              icon: 'walk',
              title: 'Jump Quality',
              description: 'Jump small amplitude; land softly'
            }
          ]
        },
        {
          name: 'Lateral Toss',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 4,
          description: 'Pivot feet explosively, drive hips forcefully, release bag across the body',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 4 sets of 5 per side — rest 90s between sets, take all of it.\n4 sets\n• 5 per side Tosses (mark distance)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Tosses",
                    "reps": "5/side"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ],
            "instructions": "Complete ALL reps on one side before switching — no alternating unless written. 4 sets of 5 per side — rest 90s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240621/mood_app/workout_images/p8n74eov_download_4_.jpg',
          intensityReason: 'Hip-led rotational movement develops powerful frontal-plane explosive power',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Grip Position',
              description: 'Hands under corners; chest up'
            },
            {
              icon: 'swap-horizontal',
              title: 'Hip Drive',
              description: "Follow through; don't arm-throw"
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Clean to Thruster',
          duration: '12–16 min',
          path: 'bodyweight',
          cart_flavor: 'loaded',
          intensity_cost: 5,
          description: 'Front rack drop position, explosive leg drive, crisp overhead lockout finish',
          battlePlan: 'Instructions: 5 sets of 4 — rest 120s between sets, take all of it.\n5 sets\n• 4 Clean → Thrusters\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Clean → Thrusters",
                    "reps": "4",
                    "tutorialSlug": "kb_clean"
                  }
                ],
                "rounds": 5,
                "rest": "120s"
              }
            ],
            "instructions": "5 sets of 4 — rest 120s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240595/mood_app/workout_images/93nr796t_sbclean.jpg',
          intensityReason: 'Clean-to-press movement ties lower and upper explosive power chain together',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Front Rack',
              description: 'Elbows up; brace hard'
            },
            {
              icon: 'trending-up',
              title: 'Drive Sequence',
              description: 'Drive legs then arms; head through'
            }
          ]
        },
        {
          name: 'Bear-Hug Loaded Jumps',
          duration: '12–14 min',
          path: 'bodyweight',
          cart_flavor: 'loaded',
          intensity_cost: 5,
          description: 'Hug bag tight against torso; perform quick low-amplitude reactive jumps safely',
          battlePlan: 'Instructions: 5 sets of 6–8 — rest 120s between sets, take all of it.\n5 sets\n• 6–8 Loaded Jumps\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Loaded Jumps",
                    "reps": "6–8"
                  }
                ],
                "rounds": 5,
                "rest": "120s"
              }
            ],
            "instructions": "5 sets of 6–8 — rest 120s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240612/mood_app/workout_images/mmapy9w7_download_5_.jpg',
          intensityReason: 'Light unstable load pattern trains reactive vertical core stiffness control',
          moodTips: [
            {
              icon: 'bag',
              title: 'Bag Position',
              description: 'Squeeze bag tight to torso'
            },
            {
              icon: 'walk',
              title: 'Jump Quality',
              description: 'Quick contacts; mid-foot land'
            }
          ]
        },
        {
          name: 'Heave for Distance',
          duration: '12–16 min',
          path: 'bodyweight',
          cart_flavor: 'dynamic',
          intensity_cost: 5,
          description: 'Deep hinge preload, tall explosive snap, launch bag near optimal 45 degrees',
          battlePlan: 'Instructions: 5 sets of 3–4 — rest 150s between sets, take all of it.\n5 sets\n• 3–4 Heaves (measure best)\nRest 150s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Heaves",
                    "reps": "3–4"
                  }
                ],
                "rounds": 5,
                "rest": "150s"
              }
            ],
            "instructions": "5 sets of 3–4 — rest 150s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240611/mood_app/workout_images/m2c4155r_download_3_.jpg',
          intensityReason: 'Maximum-distance throws challenge explosive timing and power output intent',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Loading Position',
              description: 'Hands under lip; bag close on swing'
            },
            {
              icon: 'trending-up',
              title: 'Release Angle',
              description: 'Release on upward path; chase safely'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Body Weight Only',
    icon: 'body',
    workouts: {
      beginner: [
        {
          name: 'Split Squat Jumps',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'plyo',
          intensity_cost: 3,
          description: 'Small amplitude leg switches with quiet, aligned soft landings',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 6–8 per side — rest 60s between sets, take all of it.\n3 sets\n• 6–8 per side Split Jumps\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Split Jumps",
                    "reps": "6–8/side",
                    "tutorialSlug": "split_squat_jump"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ],
            "instructions": "Complete ALL reps on one side before switching — no alternating unless written. Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 6–8 per side — rest 60s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240608/mood_app/workout_images/l6tkpcq3_ssj.jpg',
          intensityReason: 'Switch jumps teach reactive stiffness with controlled low shock',
          moodTips: [
            {
              icon: 'walk',
              title: 'Switch Mechanics',
              description: 'Switch mid-air; keep torso tall'
            },
            {
              icon: 'footsteps',
              title: 'Landing',
              description: 'Knees track; land softly'
            }
          ]
        },
        {
          name: 'Squat Pop Stick',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'plyo',
          intensity_cost: 3,
          description: 'Pop jump up, two-second hold position, repeat crisp landings',
          battlePlan: 'Instructions: 3 sets of 6–8 — rest 60s between sets, take all of it.\n3 sets\n• 6–8 Squat Pops (stick 2s)\nRest 60s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Squat Pops",
                    "reps": "6–8",
                    "tutorialSlug": "squat_pop_stick"
                  }
                ],
                "rounds": 3,
                "rest": "60s"
              }
            ],
            "instructions": "3 sets of 6–8 — rest 60s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240627/mood_app/workout_images/wc6us2rn_download_35_.jpg',
          intensityReason: 'Deceleration focus improves landing control and joint stability',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Jump Height',
              description: 'Minimal air; focus on stick'
            },
            {
              icon: 'body',
              title: 'Landing Position',
              description: 'Heels kiss; hips back on land'
            }
          ]
        },
        {
          name: 'Skater Bounds',
          duration: '8–10 min',
          path: 'bodyweight',
          cart_flavor: 'plyo',
          intensity_cost: 3,
          description: 'Lateral side hops with controlled stick landing and knee tracking',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 6–8 per side — rest 60–75s between sets, take all of it.\n3 sets\n• 6–8 per side Skater Bounds (stick 1–2s)\nRest 60–75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Skater Bounds",
                    "reps": "6–8/side",
                    "tutorialSlug": "skater_bounds"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s"
              }
            ],
            "instructions": "Complete ALL reps on one side before switching — no alternating unless written. Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 6–8 per side — rest 60–75s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240622/mood_app/workout_images/rzd2lfq8_download_36_.jpg',
          intensityReason: 'Lateral bound movements build explosive frontal-plane strength',
          moodTips: [
            {
              icon: 'swap-horizontal',
              title: 'Lateral Movement',
              description: 'Push sideways; stick knee over toes'
            },
            {
              icon: 'body',
              title: 'Body Position',
              description: 'Hips low; torso quiet'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Burpees',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'plyo',
          intensity_cost: 4,
          description: 'Clean plank position, snap feet in, tall jump with soft landing',
          battlePlan: 'Instructions: 4 sets of 10–12 — rest 75–90s between sets, take all of it.\n4 sets\n• 10–12 Burpees\nRest 75–90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Burpees",
                    "reps": "10–12",
                    "tutorialSlug": "burpee_box_jump"
                  }
                ],
                "rounds": 4,
                "rest": "75–90s"
              }
            ],
            "instructions": "4 sets of 10–12 — rest 75–90s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240596/mood_app/workout_images/9hhkr62t_download_37_.jpg',
          intensityReason: 'Ground-to-air cycles train rapid full-body explosive power',
          moodTips: [
            {
              icon: 'body',
              title: 'Plank Quality',
              description: 'Solid plank; no sag'
            },
            {
              icon: 'walk',
              title: 'Jump Quality',
              description: 'Jump tall; soft land'
            }
          ]
        },
        {
          name: 'Broad Jumps',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'plyo',
          intensity_cost: 4,
          description: 'Big explosive arm swing, hinge load deep, stick stable landings',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 5–6 — rest 90s between sets, take all of it.\n4 sets\n• 5–6 Broad Jumps (stick 2s)\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Broad Jumps",
                    "reps": "5–6"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 5–6 — rest 90s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240598/mood_app/workout_images/9vb7hgg8_bj.jpg',
          intensityReason: 'Horizontal jump patterns build explosive hip drive and projection',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Loading',
              description: 'Big arm swing; hinge load'
            },
            {
              icon: 'checkmark',
              title: 'Landing Control',
              description: 'Stick 2s; measure strides'
            }
          ]
        },
        {
          name: 'Reactive Pogos',
          duration: '10–12 min',
          path: 'bodyweight',
          cart_flavor: 'plyo',
          intensity_cost: 4,
          description: 'Minimal ground contact rebounds with quiet mid-foot spring action',
          battlePlan: 'Instructions: 4 sets of 20s — rest 60–75s between sets, take all of it.\n4 sets\n• 20s Pogos\nRest 60–75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pogos",
                    "reps": "20s"
                  }
                ],
                "rounds": 4,
                "rest": "60–75s"
              }
            ],
            "instructions": "4 sets of 20s — rest 60–75s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240631/mood_app/workout_images/yfhezq7k_download_38_.jpg',
          intensityReason: 'Ankle pogo hop pattern trains reactive stiffness and rhythm',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Contact Quality',
              description: 'Mid-foot spring; quiet feet'
            },
            {
              icon: 'body',
              title: 'Body Position',
              description: 'Knees soft; ribs stacked'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Depth Jump to Broad',
          duration: '12–16 min',
          path: 'bodyweight',
          cart_flavor: 'plyo',
          intensity_cost: 5,
          description: 'Quick reactive floor contact into long, stuck broad jump distance',
          battlePlan: 'Instructions: Cluster set: 1 Depth Jump → 1 Broad Jump, 20s rest, repeat once (2 pairings) — the built-in mini-rest keeps every rep explosive, don\'t cut it short. 5 sets of 4 — rest 120s between sets, take all of it.\n5 sets\n• 4 Broad Jump — cluster style\nRest 120s between clusters',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Broad Jump",
                    "note": "cluster style",
                    "reps": "4"
                  }
                ],
                "rounds": 5,
                "rest": "120s between clusters"
              }
            ],
            "instructions": "Cluster set: 1 Depth Jump → 1 Broad Jump, 20s rest, repeat once (2 pairings) — the built-in mini-rest keeps every rep explosive, don't cut it short. 5 sets of 4 — rest 120s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240613/mood_app/workout_images/n37wkroc_dj.jpg',
          intensityReason: 'Shock absorption drop then explosive horizontal power expression',
          moodTips: [
            {
              icon: 'flash',
              title: 'Contact Speed',
              description: 'Fast contact; no pause'
            },
            {
              icon: 'walk',
              title: 'Jump Quality',
              description: 'Arms swing; land soft'
            }
          ]
        },
        {
          name: 'Split Squat Jump Repeats',
          duration: '12–14 min',
          path: 'bodyweight',
          cart_flavor: 'plyo',
          intensity_cost: 5,
          description: 'High tempo jumps with consistent height and quiet landing control',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. Complete ALL reps on one side before switching — no alternating unless written. 5 sets of 10–12 per side — rest 90s between sets, take all of it.\n5 sets\n• 10–12 per side Split Jumps\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Split Jumps",
                    "reps": "10–12/side",
                    "tutorialSlug": "split_squat_jump"
                  }
                ],
                "rounds": 5,
                "rest": "90s"
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. Complete ALL reps on one side before switching — no alternating unless written. 5 sets of 10–12 per side — rest 90s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240629/mood_app/workout_images/wpx96hu6_Screenshot_2025-12-03_at_11_25_54_AM.jpg',
          intensityReason: 'Repeated leg switches stress explosive elastic reactivity patterns',
          moodTips: [
            {
              icon: 'flash',
              title: 'Switch Speed',
              description: "Switch fast; hips don't collapse"
            },
            {
              icon: 'speedometer',
              title: 'Rhythm',
              description: 'Keep rhythm; posture tall'
            }
          ]
        },
        {
          name: 'Burpee Broad Jump',
          duration: '12–16 min',
          path: 'bodyweight',
          cart_flavor: 'plyo',
          intensity_cost: 5,
          description: 'Complete burpee into long broad jump with decisive explosive burst',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 5 — rest 150s between sets, take all of it.\n5 sets\n• 5 Burpee → Broad Jump\nRest 150s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Burpee → Broad Jump",
                    "reps": "5"
                  }
                ],
                "rounds": 5,
                "rest": "150s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 5 — rest 150s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240623/mood_app/workout_images/snvyacrk_download_40_.jpg',
          intensityReason: 'Combined movement cycles train complete full-body explosive flow',
          moodTips: [
            {
              icon: 'body',
              title: 'Plank Quality',
              description: 'Strong plank; snap in'
            },
            {
              icon: 'trending-up',
              title: 'Transition',
              description: 'Explode forward decisively'
            }
          ]
        }
      ]
    }
  }
];
