import { EquipmentWorkouts } from '../types/workout';

// Comprehensive outdoor workout data with detailed specifications
export const outdoorRunWorkoutDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Outdoor Run',
    icon: 'walk',
    workouts: {
      beginner: [
        {
          name: 'Easy Interval Run',
          duration: '22–25 min',
          description: 'Walk–jog intervals build aerobic base and reinforce clean form.',
          battlePlan: 'Instructions: 6 rounds — follow the 2 timed segments in order, no skipping.\n• 5 min brisk walk\n• 6 rounds: 1 min easy jog + 1 min walk\n• 5 min easy walk',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "duration": "5 min",
                    "name": "brisk walk"
                  },
                  {
                    "duration": "5 min",
                    "name": "easy walk"
                  }
                ],
                "rounds": 6
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240858/mood_app/workout_images/z01f1fdc_download_4_.jpg',
          intensityReason: 'Short jog bouts lift heart rate gently while protecting joints.',
          session_type: 'interval',
          intensity_cost: 2,
          moodTips: [
            {
              icon: 'body',
              title: 'Keep tall posture; slight lean from ankles; eyes on horizon',
              description: 'Maintain upright form with forward lean originating from feet, not waist'
            },
            {
              icon: 'walk',
              title: 'Land under hips with quiet steps to reduce impact and strain',
              description: 'Position foot strike beneath your center of mass for efficient running'
            }
          ]
        },
        {
          name: 'Progressive Easy Run',
          duration: '25–30 min',
          description: 'Start relaxed and finish quicker while preserving smooth form.',
          battlePlan: 'Instructions: Follow the 3 timed segments in order, no skipping.\n• 5 min easy jog\n• 15–20 min continuous easy→steady\n• 3–5 min walk',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "duration": "5 min",
                    "name": "easy jog"
                  },
                  {
                    "duration": "15–20 min",
                    "name": "continuous easy→steady"
                  },
                  {
                    "duration": "3–5 min",
                    "name": "walk"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240841/mood_app/workout_images/hi2nsiep_download_5_.jpg',
          intensityReason: 'Gradual pace rise improves aerobic economy with low stress.',
          session_type: 'continuous',
          intensity_cost: 2,
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Relax shoulders; light hands "hold chips"; steady arm swing',
              description: 'Keep upper body loose with hands gently cupped and arms moving naturally'
            },
            {
              icon: 'leaf',
              title: 'Use 3-3 breathing; if form slips, slow to reset smooth rhythm',
              description: 'Breathe in for 3 steps, out for 3 steps; reduce pace if technique degrades'
            }
          ]
        },
        {
          name: 'Run-Walk Loop',
          duration: '24–28 min',
          description: 'Two-minute run/walk blocks add safe volume with tight control.',
          battlePlan: 'Instructions: 6 rounds — follow the 2 timed segments in order, no skipping.\n• 4 min brisk walk\n• 6 rounds: 2 min run + 2 min walk\n• 2–4 min walk',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "duration": "4 min",
                    "name": "brisk walk"
                  },
                  {
                    "duration": "2–4 min",
                    "name": "walk"
                  }
                ],
                "rounds": 6
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240824/mood_app/workout_images/4842p5as_download_6_.jpg',
          intensityReason: 'Alternating run and walk develops endurance and steady rhythm.',
          session_type: 'interval',
          intensity_cost: 2,
          moodTips: [
            {
              icon: 'walk',
              title: 'Maintain light cadence; avoid overstriding to protect knees',
              description: 'Keep steps quick and short rather than reaching out with each stride'
            },
            {
              icon: 'body',
              title: 'Keep chin level; engage core gently to stabilize torso posture',
              description: 'Look straight ahead with light abdominal bracing for stability'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Tempo Finish Run',
          duration: '30–35 min',
          description: 'Easy running flows into short tempo to train pace discipline.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. follow the 4 timed segments in order, no skipping.\n• 8 min easy\n• 10–12 min easy\n• 8–10 min tempo (RPE 7–8)\n• 4–5 min easy',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "duration": "8 min",
                    "name": "easy"
                  },
                  {
                    "duration": "10–12 min",
                    "name": "easy"
                  },
                  {
                    "duration": "8–10 min",
                    "intensity": "RPE 7–8",
                    "name": "Tempo Finish Run"
                  },
                  {
                    "duration": "4–5 min",
                    "name": "easy"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240858/mood_app/workout_images/z01f1fdc_download_4_.jpg',
          intensityReason: 'Late controlled tempo adds stress while preserving technique.',
          session_type: 'tempo',
          intensity_cost: 4,
          moodTips: [
            {
              icon: 'walk',
              title: 'Midfoot land; elbows drive back; keep hands relaxed and quiet',
              description: 'Strike with midfoot, pump elbows rearward, and maintain loose fists'
            },
            {
              icon: 'body',
              title: 'Torso stays stacked; limit side sway for better energy transfer',
              description: 'Keep shoulders over hips with minimal lateral movement for efficiency'
            }
          ]
        },
        {
          name: 'Fartlek Pyramid',
          duration: '30–34 min',
          description: '1-2-3-2-1 hard with equal easy jogs refines rhythm, recovery.',
          battlePlan: 'Instructions: Pyramid: climb the effort/reps up then back down — the middle is the peak, pace for it. follow the 7 timed segments in order, no skipping.\n• 8 min easy\n• 1 hard/1 easy\n• 2 hard/2 easy\n• 3 hard/3 easy\n• 2 hard/2 easy\n• 1 hard/1 easy\n• 5 min easy',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "duration": "8 min",
                    "name": "easy"
                  },
                  {
                    "name": "hard/1 easy",
                    "reps": "1"
                  },
                  {
                    "name": "hard/2 easy",
                    "reps": "2"
                  },
                  {
                    "name": "hard/3 easy",
                    "reps": "3"
                  },
                  {
                    "name": "hard/2 easy",
                    "reps": "2"
                  },
                  {
                    "name": "hard/1 easy",
                    "reps": "1"
                  },
                  {
                    "duration": "5 min",
                    "name": "easy"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240841/mood_app/workout_images/hi2nsiep_download_5_.jpg',
          intensityReason: 'Variable surges elevate output and sharpen pacing control.',
          session_type: 'fartlek',
          intensity_cost: 4,
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Pace the effort, not speed; adjust smoothly for terrain changes',
              description: 'Focus on consistent exertion level rather than watching pace numbers'
            },
            {
              icon: 'cloud',
              title: 'Float recoveries; reset posture and breathing every easy rep',
              description: 'Use recovery intervals to restore form and catch breath fully'
            }
          ]
        },
        {
          name: 'Steady State Run',
          duration: '32–36 min',
          description: 'Hold conversational pace steadily, then finish with cooldown.',
          battlePlan: 'Instructions: Follow the 3 timed segments in order, no skipping.\n• 8–10 min easy\n• 20 min steady (talk in phrases)\n• 4–6 min easy',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "duration": "8–10 min",
                    "name": "easy"
                  },
                  {
                    "duration": "20 min",
                    "intensity": "talk in phrases",
                    "name": "steady"
                  },
                  {
                    "duration": "4–6 min",
                    "name": "easy"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240824/mood_app/workout_images/4842p5as_download_6_.jpg',
          intensityReason: 'Continuous sub-tempo builds durability and running economy.',
          session_type: 'continuous',
          intensity_cost: 3,
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Keep effort even; relax on mild inclines; avoid unnecessary surges',
              description: 'Maintain consistent work output by adjusting pace to terrain'
            },
            {
              icon: 'body',
              title: 'Shoulders down; check form every five minutes to stay efficient',
              description: 'Periodically scan body for tension and reset relaxed posture'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Threshold Repeats',
          duration: '36–42 min',
          description: 'Three threshold blocks with short floats refine pacing control.',
          battlePlan: 'Instructions: Work top to bottom.\n• 10 min easy + 3x20s strides (40s easy)\n• 3x · 8 min threshold + 2 min easy\n• 6–8 min easy',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "min easy + 3x20s strides",
                    "reps": "10"
                  },
                  {
                    "name": "3x: 8 min threshold + 2 min easy"
                  },
                  {
                    "name": "min easy",
                    "reps": "6–8"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240858/mood_app/workout_images/z01f1fdc_download_4_.jpg',
          intensityReason: 'Repeated threshold bouts raise LT while preserving form quality.',
          session_type: 'threshold',
          intensity_cost: 5,
          moodTips: [
            {
              icon: 'walk',
              title: 'Keep cadence quick; avoid overstriding as fatigue accumulates',
              description: 'Maintain turnover rate even when tired to prevent injury'
            },
            {
              icon: 'leaf',
              title: 'Breathe rhythmically; relax jaw and hands to save upper body',
              description: 'Sync breath to stride and release tension in face and grip'
            }
          ]
        },
        {
          name: 'Long Fartlek',
          duration: '38–44 min',
          description: 'Alternate 1 hard/1 easy to train smooth accelerations and rhythm.',
          battlePlan: 'Instructions: Follow the 3 timed segments in order, no skipping.\n• 10 min easy\n• 10x · 1 min hard + 1 min easy\n• 8–10 min easy',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "duration": "10 min",
                    "name": "easy"
                  },
                  {
                    "name": "10x: 1 min hard + 1 min easy"
                  },
                  {
                    "duration": "8–10 min",
                    "name": "easy"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240841/mood_app/workout_images/hi2nsiep_download_5_.jpg',
          intensityReason: 'One-minute surges build power and aerobic sharpness efficiently.',
          session_type: 'fartlek',
          intensity_cost: 5,
          moodTips: [
            {
              icon: 'body',
              title: 'Drive arms during surges; keep chest tall and hips forward',
              description: 'Power arm swing and maintain proud posture through hard efforts'
            },
            {
              icon: 'walk',
              title: 'Make easy minutes truly easy to protect form and quality',
              description: 'Genuinely recover during rest intervals for better next effort'
            }
          ]
        },
        {
          name: 'Tempo Progression',
          duration: '40–45 min',
          description: 'Move from easy to steady to tempo, reinforcing smooth changes.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. follow the 4 timed segments in order, no skipping.\n• 10 min easy\n• 10 min steady\n• 10 min tempo\n• 8–10 min easy',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "duration": "10 min",
                    "name": "easy"
                  },
                  {
                    "duration": "10 min",
                    "name": "steady"
                  },
                  {
                    "duration": "10 min",
                    "name": "Tempo Progression"
                  },
                  {
                    "duration": "8–10 min",
                    "name": "easy"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240824/mood_app/workout_images/4842p5as_download_6_.jpg',
          intensityReason: 'Stepwise intensity rise builds resilience and precise pacing.',
          session_type: 'tempo',
          intensity_cost: 5,
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Increase effort smoothly; avoid abrupt pace jumps or surging',
              description: 'Transition between intensities gradually without sudden changes'
            },
            {
              icon: 'body',
              title: 'Maintain midline stability; minimize torso twist as speed rises',
              description: 'Keep core engaged to prevent excessive rotation at faster paces'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Bike',
    icon: 'bicycle',
    workouts: {
      beginner: [
        {
          name: 'Cadence Builder',
          duration: '25–30 min',
          description: 'Easy ride plus brief fast legs improves timing and smoothness.',
          battlePlan: 'Instructions: Follow the 3 timed segments in order, no skipping.\n• 8 min easy\n• 6x · 30s 90–110 RPM + 90s easy\n• 6–8 min easy',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "duration": "8 min",
                    "name": "easy"
                  },
                  {
                    "name": "6x: 30s 90–110 RPM + 90s easy"
                  },
                  {
                    "duration": "6–8 min",
                    "name": "easy"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240827/mood_app/workout_images/69v88tej_download_1_.jpg',
          intensityReason: 'Short spin-ups add leg speed with minimal joint loading.',
          session_type: 'technique',
          intensity_cost: 2,
          moodTips: [
            {
              icon: 'bicycle',
              title: 'Knees track straight; light grip; relax shoulders and neck',
              description: 'Align knees over pedals with loose hands and dropped shoulders'
            },
            {
              icon: 'leaf',
              title: 'Maintain neutral spine; breathe deep to reduce tension',
              description: 'Keep back in natural curve and use full breaths for relaxation'
            }
          ]
        },
        {
          name: 'Intro Intervals',
          duration: '24–28 min',
          description: 'Alternate moderate and easy minutes to build base steadily.',
          battlePlan: 'Instructions: Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. follow the 3 timed segments in order, no skipping.\n• 6–8 min easy\n• 6x · 1 min RPE 6 + 1 min easy\n• 5–6 min easy',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "duration": "6–8 min",
                    "name": "easy"
                  },
                  {
                    "name": "6x: 1 min RPE 6 + 1 min easy"
                  },
                  {
                    "duration": "5–6 min",
                    "name": "easy"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240842/mood_app/workout_images/i40y65gs_download_2_.jpg',
          intensityReason: 'One-minute efforts lift heart rate safely and smoothly.',
          session_type: 'interval',
          intensity_cost: 2,
          moodTips: [
            {
              icon: 'bicycle',
              title: 'Smooth pedal circles; avoid mashing low cadence under load',
              description: 'Spin evenly through full rotation instead of stomping down'
            },
            {
              icon: 'body',
              title: 'Breathe deep; keep hips steady to protect lower back',
              description: 'Use diaphragm breathing while keeping pelvis stable on saddle'
            }
          ]
        },
        {
          name: 'Rolling Ride',
          duration: '30–35 min',
          description: 'Sprinkle moderates to learn effort control and posture skills.',
          battlePlan: 'Instructions: Follow the 3 timed segments in order, no skipping.\n• 10 min easy\n• Min moderate + 2 min easy — 3 × (3)\n• 5–8 min easy',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "min easy",
                    "reps": "10"
                  },
                  {
                    "name": "min moderate + 2 min easy",
                    "sets": 3,
                    "reps": "3"
                  },
                  {
                    "name": "min easy",
                    "reps": "5–8"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240848/mood_app/workout_images/o68zu5hu_download_3_.jpg',
          intensityReason: 'Mostly easy riding with pick-ups enhances aerobic base.',
          session_type: 'continuous',
          intensity_cost: 2,
          moodTips: [
            {
              icon: 'body',
              title: 'Hips stable; gently brace core to limit side rocking',
              description: 'Engage abs lightly to prevent hip swaying side to side'
            },
            {
              icon: 'leaf',
              title: 'Relax neck and drop shoulders to reduce fatigue',
              description: 'Release upper body tension to conserve energy over distance'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Sweet Spot Blocks',
          duration: '40–45 min',
          description: 'Three sweet-spot segments build sustained output and control.',
          battlePlan: 'Instructions: Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\n• 10 min easy + 3x20s spin-ups\n• 3x · 8 min RPE 7–8 + 3 min easy\n• 6–8 min easy',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "min easy + 3x20s spin-ups",
                    "reps": "10"
                  },
                  {
                    "name": "3x: 8 min RPE 7–8 + 3 min easy"
                  },
                  {
                    "name": "min easy",
                    "reps": "6–8"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240827/mood_app/workout_images/69v88tej_download_1_.jpg',
          intensityReason: 'Near-threshold work boosts power and repeatable endurance.',
          session_type: 'threshold',
          intensity_cost: 4,
          moodTips: [
            {
              icon: 'bicycle',
              title: 'Keep cadence steady; avoid mashing big gears that stress knees',
              description: 'Maintain consistent RPM and select appropriate gear ratios'
            },
            {
              icon: 'body',
              title: 'Soft elbows; quiet torso to improve power transfer and comfort',
              description: 'Bend arms slightly and minimize upper body movement for efficiency'
            }
          ]
        },
        {
          name: 'Over-Unders',
          duration: '38–42 min',
          description: 'Alternate under/over efforts to refine pacing transitions.',
          battlePlan: 'Instructions: Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\n• 10 min easy\n• 3x · (1 min RPE 7, 1 min RPE 8) x4 + 3 min easy\n• 6–8 min easy',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "min easy",
                    "reps": "10"
                  },
                  {
                    "name": "3x: x4 + 3 min easy"
                  },
                  {
                    "name": "min easy",
                    "reps": "6–8"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240842/mood_app/workout_images/i40y65gs_download_2_.jpg',
          intensityReason: 'Fluctuating around threshold trains breath and control.',
          session_type: 'threshold',
          intensity_cost: 4,
          moodTips: [
            {
              icon: 'leaf',
              title: 'Breathe through surges; brace core to stabilize pelvis',
              description: 'Maintain breathing rhythm and engage abs during harder segments'
            },
            {
              icon: 'bicycle',
              title: 'Avoid power spikes when exiting hard segments; stay smooth',
              description: 'Transition gradually between effort levels without jerky changes'
            }
          ]
        },
        {
          name: 'Hill Simulation',
          duration: '35–40 min',
          description: 'Short climbs with easy spins improve torque and posture.',
          battlePlan: 'Instructions: Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. follow the 3 timed segments in order, no skipping.\n• 10 min easy\n• 5x · 2 min 60–70 RPM RPE 7 + 2 min easy\n• 6–8 min easy',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "duration": "10 min",
                    "name": "easy"
                  },
                  {
                    "name": "5x: 2 min 60–70 RPM RPE 7 + 2 min easy"
                  },
                  {
                    "duration": "6–8 min",
                    "name": "easy"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240848/mood_app/workout_images/o68zu5hu_download_3_.jpg',
          intensityReason: 'Low-cadence seated grinds build strength with safety.',
          session_type: 'interval',
          intensity_cost: 4,
          moodTips: [
            {
              icon: 'body',
              title: 'Drive through heels; keep hips steady; avoid side rocking',
              description: 'Press down through back of foot and stabilize pelvis'
            },
            {
              icon: 'bicycle',
              title: 'Knees track forward; no collapse inward under higher torque',
              description: 'Maintain knee alignment over pedals during low-cadence efforts'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'VO2 Max Repeats',
          duration: '40–46 min',
          description: '6x2 minutes hard with equal easy sharpens sustainable power.',
          battlePlan: 'Instructions: Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. Work top to bottom.\n• 12 min easy + 3x15s high cadence\n• 6x · 2 min RPE 9 + 2 min easy\n• 8–10 min easy',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "min easy + 3x15s high cadence",
                    "reps": "12"
                  },
                  {
                    "name": "6x: 2 min RPE 9 + 2 min easy"
                  },
                  {
                    "name": "min easy",
                    "reps": "8–10"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240827/mood_app/workout_images/69v88tej_download_1_.jpg',
          intensityReason: 'Short hard reps raise aerobic ceiling with quality rest.',
          session_type: 'interval',
          intensity_cost: 5,
          moodTips: [
            {
              icon: 'body',
              title: 'Chest proud; brace core; avoid excessive handlebar tension',
              description: 'Keep chest open with engaged abs and light grip on bars'
            },
            {
              icon: 'bicycle',
              title: 'Ease into first 10 seconds; prevent spiky torque surges',
              description: 'Build into hard efforts gradually to avoid wasted energy'
            }
          ]
        },
        {
          name: 'Threshold Pyramid',
          duration: '42–48 min',
          description: '4-6-8-6-4 hard with equal easy improves sustained power.',
          battlePlan: 'Instructions: Pyramid: climb the effort/reps up then back down — the middle is the peak, pace for it. follow the 7 timed segments in order, no skipping.\n• 12 min easy\n• 4 hard + 4 easy\n• 6 hard + 6 easy\n• 8 hard + 8 easy\n• 6 hard + 6 easy\n• 4 hard + 4 easy\n• 6–8 min easy',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "duration": "12 min",
                    "name": "easy"
                  },
                  {
                    "name": "hard + 4 easy",
                    "reps": "4"
                  },
                  {
                    "name": "hard + 6 easy",
                    "reps": "6"
                  },
                  {
                    "name": "hard + 8 easy",
                    "reps": "8"
                  },
                  {
                    "name": "hard + 6 easy",
                    "reps": "6"
                  },
                  {
                    "name": "hard + 4 easy",
                    "reps": "4"
                  },
                  {
                    "duration": "6–8 min",
                    "name": "easy"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240842/mood_app/workout_images/i40y65gs_download_2_.jpg',
          intensityReason: 'Stepwise threshold sets build durable pacing control.',
          session_type: 'threshold',
          intensity_cost: 5,
          moodTips: [
            {
              icon: 'bicycle',
              title: 'If safe, hold aero; relax hands and jaw to save energy',
              description: 'Maintain aerodynamic position with released tension in extremities'
            },
            {
              icon: 'leaf',
              title: 'Pace by effort; exit reps smoothly without surging',
              description: 'Focus on internal sensation and transition cleanly between intervals'
            }
          ]
        },
        {
          name: 'Big Gear Bursts',
          duration: '38–44 min',
          description: 'Short surges then relaxed spin reinforce cadence economy.',
          battlePlan: 'Instructions: Match the RPE, not a number on the bar — RPE 7 means 3 clean reps left in the tank. follow the 3 timed segments in order, no skipping.\n• 12 min easy\n• 10x · 30s RPE 9 + 90s easy\n• 8–10 min easy',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "duration": "12 min",
                    "name": "easy"
                  },
                  {
                    "name": "10x: 30s RPE 9 + 90s easy"
                  },
                  {
                    "duration": "8–10 min",
                    "name": "easy"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240848/mood_app/workout_images/o68zu5hu_download_3_.jpg',
          intensityReason: 'High-torque sprints train snap and smooth transitions.',
          session_type: 'sprint',
          intensity_cost: 5,
          moodTips: [
            {
              icon: 'body',
              title: 'Slight chest forward; stable hips; avoid heavy front load',
              description: 'Lean forward slightly while keeping pelvis anchored to saddle'
            },
            {
              icon: 'bicycle',
              title: 'Explode then settle cadence to reduce wasted movement',
              description: 'Burst hard then quickly return to smooth, efficient spinning'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Swim',
    icon: 'water',
    workouts: {
      beginner: [
        {
          name: 'Freestyle 25s Easy Pace',
          duration: '18–24 min',
          description: 'Easy 25s with generous rest emphasize comfort and clean form.',
          battlePlan: 'Instructions: Freestyle, 30–45s rest: own pace if needed.\n• Freestyle, 30–45s rest — 10 × (25)\n• Backstroke easy, 30–45s rest — 4 × (25)\n• 50 easy Freestyle',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Freestyle, 30–45s rest",
                    "sets": 10,
                    "reps": "25"
                  },
                  {
                    "name": "Backstroke easy, 30–45s rest",
                    "sets": 4,
                    "reps": "25"
                  },
                  {
                    "name": "easy Freestyle",
                    "reps": "50"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240834/mood_app/workout_images/aj6v6kqd_fss.jpg',
          intensityReason: 'Very short repeats reduce fatigue and shoulder strain safely.',
          session_type: 'interval',
          intensity_cost: 1,
          moodTips: [
            {
              icon: 'leaf',
              title: 'Exhale fully underwater; avoid breath holding to relax stroke',
              description: 'Release air steadily through nose/mouth to stay calm and efficient'
            },
            {
              icon: 'water',
              title: 'Eyes down; hips high; gentle kick to spare lower back strain',
              description: 'Look at pool bottom, keep hips near surface with light flutter kick'
            }
          ]
        },
        {
          name: 'Mixed 25s Own Pace',
          duration: '18–24 min',
          description: 'Simple free, back, breast 25s with long rest encourage skill.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom. Freestyle, 30–45s rest: own pace.\n• Freestyle, 30–45s rest — 6 × (25)\n• Backstroke, 30–45s rest — 4 × (25)\n• Breaststroke, 40–60s rest — 4 × (25)\n• 50 easy choice',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Freestyle, 30–45s rest",
                    "sets": 6,
                    "reps": "25"
                  },
                  {
                    "name": "Backstroke, 30–45s rest",
                    "sets": 4,
                    "reps": "25"
                  },
                  {
                    "name": "Breaststroke, 40–60s rest",
                    "sets": 4,
                    "reps": "25"
                  },
                  {
                    "name": "easy choice",
                    "reps": "50"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240838/mood_app/workout_images/ctmkdqkg_backs.jpg',
          intensityReason: 'Variety at self-selected pace builds comfort and confidence.',
          session_type: 'technique',
          intensity_cost: 1,
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Gentle hand entry; avoid crossing midline to protect shoulders',
              description: 'Enter water in line with shoulder, not across body centerline'
            },
            {
              icon: 'water',
              title: 'Soft kick; toes pointed; relaxed ankles for efficient propulsion',
              description: 'Flutter with loose ankles and extended toes for smooth propulsion'
            }
          ]
        },
        {
          name: 'Freestyle 50s Light',
          duration: '20–26 min',
          description: 'Easy-moderate 50s refine breathing rhythm and streamline feel.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\n• Freestyle easy-moderate, 40–60s rest — 6 × (50)\n• Kick easy (choice), 30–45s rest — 4 × (25)\n• 50 easy Freestyle',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Freestyle easy-moderate, 40–60s rest",
                    "sets": 6,
                    "reps": "50"
                  },
                  {
                    "name": "Kick easy , 30–45s rest",
                    "sets": 4,
                    "reps": "25"
                  },
                  {
                    "name": "easy Freestyle",
                    "reps": "50"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240851/mood_app/workout_images/u6pkmpnl_fss2.jpg',
          intensityReason: 'Short 50s with rest build pacing awareness and ease strain.',
          session_type: 'interval',
          intensity_cost: 2,
          moodTips: [
            {
              icon: 'water',
              title: 'Count strokes per length; keep it steady to gauge efficiency',
              description: 'Track stroke count each lap to monitor technique consistency'
            },
            {
              icon: 'body',
              title: 'Head still; rotate from torso; avoid lifting face to breathe',
              description: 'Turn body as unit for breath instead of craning neck upward'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Free 50s Steady',
          duration: '24–32 min',
          description: 'Twelve 50s at relaxed pace build efficiency and control.',
          battlePlan: 'Instructions: Freestyle steady, 25–45s rest: own pace ok.\n• Freestyle steady, 25–45s rest — 12 × (50)\n• 100 easy Freestyle',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Freestyle steady, 25–45s rest",
                    "sets": 12,
                    "reps": "50"
                  },
                  {
                    "name": "easy Freestyle",
                    "reps": "100"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240853/mood_app/workout_images/w5dwgsls_download_23_.jpg',
          intensityReason: 'Steady 50s improve rhythm and base with flexible rests.',
          session_type: 'interval',
          intensity_cost: 3,
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Early vertical forearm; patient catch to protect shoulders',
              description: 'Set forearm perpendicular early in pull with controlled timing'
            },
            {
              icon: 'body',
              title: 'Streamline off walls; brace core lightly to keep hips afloat',
              description: 'Push off tight and use gentle ab tension for body position'
            }
          ]
        },
        {
          name: 'Stroke Mix 50s Steady',
          duration: '26–34 min',
          description: 'Free, back, breast 50s improve posture and comfort evenly.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\n• Freestyle steady, 25–40s rest — 6 × (50)\n• Backstroke steady, 30–45s rest — 4 × (50)\n• Breaststroke steady, 35–60s rest — 4 × (50)\n• 100 easy Freestyle',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Freestyle steady, 25–40s rest",
                    "sets": 6,
                    "reps": "50"
                  },
                  {
                    "name": "Backstroke steady, 30–45s rest",
                    "sets": 4,
                    "reps": "50"
                  },
                  {
                    "name": "Breaststroke steady, 35–60s rest",
                    "sets": 4,
                    "reps": "50"
                  },
                  {
                    "name": "easy Freestyle",
                    "reps": "100"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240835/mood_app/workout_images/bh9k9ord_bs.jpg',
          intensityReason: 'Balanced stroke work builds coordination under control.',
          session_type: 'technique',
          intensity_cost: 3,
          moodTips: [
            {
              icon: 'body',
              title: 'Backstroke: neutral head, steady hip-driven roll for alignment',
              description: 'Keep head still and initiate rotation from hips, not shoulders'
            },
            {
              icon: 'water',
              title: 'Breaststroke: glide briefly; gentle knee flex to spare joints',
              description: 'Hold streamline momentarily and avoid pulling knees too wide'
            }
          ]
        },
        {
          name: 'Freestyle 100s Easy-Moderate',
          duration: '26–36 min',
          description: 'Six easy-moderate 100s train breathing and steady rhythm.',
          battlePlan: 'Instructions: Freestyle easy-moderate, 45–75s rest: own pace.\n• Freestyle easy-moderate, 45–75s rest — 6 × (100)\n• 100 easy Freestyle',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Freestyle easy-moderate, 45–75s rest",
                    "sets": 6,
                    "reps": "100"
                  },
                  {
                    "name": "easy Freestyle",
                    "reps": "100"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240851/mood_app/workout_images/u6pkmpnl_fss2.jpg',
          intensityReason: 'Longer 100s build pacing control without heavy fatigue.',
          session_type: 'continuous',
          intensity_cost: 3,
          moodTips: [
            {
              icon: 'leaf',
              title: 'Breathe bilaterally only if comfortable; prioritize relaxed rhythm',
              description: 'Alternate breathing sides only when it feels natural and easy'
            },
            {
              icon: 'water',
              title: 'Keep kick light; save shoulders by avoiding overreaching pulls',
              description: 'Use gentle flutter and moderate arm extension to preserve energy'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Free 100s Strong-Relaxed',
          duration: '30–40 min',
          description: 'Eight strong 100s emphasize clean catch and even pacing.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\n• Freestyle strong, 45–75s rest — 8 × (100)\n• 200 easy Freestyle',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Freestyle strong, 45–75s rest",
                    "sets": 8,
                    "reps": "100"
                  },
                  {
                    "name": "easy Freestyle",
                    "reps": "200"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240834/mood_app/workout_images/aj6v6kqd_fss.jpg',
          intensityReason: 'Firm 100s with rest sustain speed and technique quality.',
          session_type: 'interval',
          intensity_cost: 4,
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Fast hand exit; avoid crossing centerline to protect shoulders',
              description: 'Clear hand from water quickly along shoulder line for safety'
            },
            {
              icon: 'body',
              title: 'Neutral neck; minimal lifting; sight only as needed for comfort',
              description: 'Keep head aligned with spine and look forward only when necessary'
            }
          ]
        },
        {
          name: 'Mixed Strokes 100s',
          duration: '32–40 min',
          description: 'Free, back, breast 100s with rest enhance technical stability.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\n• Freestyle, 40–60s — 4 × (100)\n• Backstroke, 45–75s — 3 × (100)\n• Breaststroke, 60–90s — 3 × (100)\n• 200 easy Freestyle',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Freestyle, 40–60s",
                    "sets": 4,
                    "reps": "100"
                  },
                  {
                    "name": "Backstroke, 45–75s",
                    "sets": 3,
                    "reps": "100"
                  },
                  {
                    "name": "Breaststroke, 60–90s",
                    "sets": 3,
                    "reps": "100"
                  },
                  {
                    "name": "easy Freestyle",
                    "reps": "200"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240835/mood_app/workout_images/bh9k9ord_bs.jpg',
          intensityReason: 'Longer mixed repeats build resilience and balance safely.',
          session_type: 'technique',
          intensity_cost: 4,
          moodTips: [
            {
              icon: 'body',
              title: 'Backstroke: hip-driven roll, straight entry line to reduce drag',
              description: 'Rotate from hips and enter hand directly above shoulder'
            },
            {
              icon: 'water',
              title: 'Breaststroke: controlled kick; avoid knee overflex to save joints',
              description: 'Keep knees within hip width and limit excessive bending'
            }
          ]
        },
        {
          name: 'Free Ladder Own Pace',
          duration: '32–42 min',
          description: '50-100-150-100-50 builds rhythm with own-pace recovery.',
          battlePlan: 'Instructions: Ladder: work down the rungs — the reps drop as fatigue climbs. Rest only between rungs. Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\n• 50 Freestyle, 30–45s\n• 100 Freestyle, 45–75s\n• 150 Freestyle, 60–90s\n• 100 Freestyle, 45–75s\n• 50 Freestyle, 30–45s\n• 100 easy Freestyle',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Freestyle, 30–45s",
                    "reps": "50"
                  },
                  {
                    "name": "Freestyle, 45–75s",
                    "reps": "100"
                  },
                  {
                    "name": "Freestyle, 60–90s",
                    "reps": "150"
                  },
                  {
                    "name": "Freestyle, 45–75s",
                    "reps": "100"
                  },
                  {
                    "name": "Freestyle, 30–45s",
                    "reps": "50"
                  },
                  {
                    "name": "easy Freestyle",
                    "reps": "100"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240853/mood_app/workout_images/w5dwgsls_download_23_.jpg',
          intensityReason: 'Progressing distances train pacing and efficiency steadily.',
          session_type: 'interval',
          intensity_cost: 4,
          moodTips: [
            {
              icon: 'leaf',
              title: 'Hold steady stroke counts; adjust breath timing as distance grows',
              description: 'Maintain technique consistency and modify breathing for longer swims'
            },
            {
              icon: 'body',
              title: 'Maintain long body line; minimize sway for better propulsion',
              description: 'Stay streamlined from fingertips to toes with minimal wiggle'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Hills',
    icon: 'trending-up',
    workouts: {
      beginner: [
        {
          name: 'Hill Intro Mix',
          duration: '16–22 min',
          description: 'High knees, shuffles, jogs with walkbacks refine uphill form.',
          battlePlan: 'Instructions: Uphill high knees: walk down. Uphill side shuffle L/R (alt): walk down. Uphill easy jog: walk down. Work top to bottom.\n• Uphill high knees — 4 × (~25yd)\n• Uphill side shuffle L/R (alt) — 4 × (~25yd)\n• Uphill easy jog — 4 × (~30yd)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "yd uphill high knees",
                    "sets": 4,
                    "reps": "25"
                  },
                  {
                    "name": "yd uphill side shuffle L/R",
                    "sets": 4,
                    "reps": "25"
                  },
                  {
                    "name": "yd uphill easy jog",
                    "sets": 4,
                    "reps": "30"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240833/mood_app/workout_images/904pke23_download_9_.jpg',
          intensityReason: 'Short uphill drills build coordination and confidence safely.',
          session_type: 'drill',
          intensity_cost: 2,
          moodTips: [
            {
              icon: 'body',
              title: 'Short steps; land under hips; keep chest tall to protect knees',
              description: 'Use compact strides with upright posture to reduce joint stress'
            },
            {
              icon: 'trending-up',
              title: 'Side shuffle with toes forward; soft knees to avoid valgus',
              description: 'Point feet uphill and maintain slight knee bend to prevent collapse'
            }
          ]
        },
        {
          name: 'Hill Form Trio',
          duration: '16–22 min',
          description: 'Three drills uphill with walkbacks develop cadence control.',
          battlePlan: 'Instructions: Uphill skips: walk down. Uphill marching high knees: walk down. Uphill backpedal: walk down. Work top to bottom.\n• Uphill skips — 4 × (~20yd)\n• Uphill marching high knees — 4 × (~20yd)\n• Uphill backpedal — 4 × (~20yd)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "yd uphill skips",
                    "sets": 4,
                    "reps": "20"
                  },
                  {
                    "name": "yd uphill marching high knees",
                    "sets": 4,
                    "reps": "20"
                  },
                  {
                    "name": "yd uphill backpedal",
                    "sets": 4,
                    "reps": "20"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240840/mood_app/workout_images/fuxu9rk0_download_8_.jpg',
          intensityReason: 'Marching, skipping, backpedal build timing and balance.',
          session_type: 'drill',
          intensity_cost: 2,
          moodTips: [
            {
              icon: 'body',
              title: 'March tall; ribs over hips; drive knee straight ahead',
              description: 'Stand upright with stacked torso and forward knee drive'
            },
            {
              icon: 'walk',
              title: 'Backpedal small steps; eyes forward to protect balance',
              description: 'Take short steps backward while looking ahead for safety'
            }
          ]
        },
        {
          name: 'Hill Stability Mix',
          duration: '18–24 min',
          description: 'Shuffle, karaoke, jog sequence improves control transitions.',
          battlePlan: 'Instructions: 3 rounds — all 5 moves in order.\n• 3 rounds:\n\n• uphill side shuffle L — ~25yd\n• uphill side shuffle R — ~25yd\n• uphill karaoke — ~25yd, lead L\n• uphill karaoke — ~25yd, lead R\n• uphill easy jog — ~30yd\nWalk down between each',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "yd uphill side shuffle L",
                    "reps": "25"
                  },
                  {
                    "name": "yd uphill side shuffle R",
                    "reps": "25"
                  },
                  {
                    "name": "yd uphill karaoke",
                    "reps": "25"
                  },
                  {
                    "name": "yd uphill karaoke",
                    "reps": "25"
                  },
                  {
                    "name": "yd uphill easy jog",
                    "reps": "30"
                  }
                ],
                "rounds": 3
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240850/mood_app/workout_images/ts9r3lf1_download_15_.jpg',
          intensityReason: 'Lateral and rotational steps enhance hip strength safely.',
          session_type: 'drill',
          intensity_cost: 2,
          moodTips: [
            {
              icon: 'body',
              title: 'Karaoke: rotate from hips, not knees; torso tall and relaxed',
              description: 'Initiate crossover movement from hip rotation with upright stance'
            },
            {
              icon: 'walk',
              title: 'Jog upright; stable ankles; avoid rolling outward on contact',
              description: 'Run tall with secure foot placement to prevent ankle rolls'
            }
          ]
        },
        {
          name: 'Sprint-Only Intro',
          duration: '16–22 min',
          description: 'Repeat brief sprints with walkbacks to engrain mechanics.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 8 sets of ~20–25yd — rest between sets. Uphill sprints: full walk down.\n• Uphill sprints — 8 × (~20–25yd)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "yd uphill sprints, full walk down",
                    "sets": 8,
                    "reps": "20–25"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240831/mood_app/workout_images/8d9vosf3_download_12_.jpg',
          intensityReason: 'Very short incline sprints teach speed with low impact.',
          session_type: 'sprint',
          intensity_cost: 3,
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Explode then relax; quick steps; posture tall; arms drive back',
              description: 'Burst powerfully then settle into smooth form with arm drive'
            },
            {
              icon: 'body',
              title: 'Stop early if technique fades; protect calves and hamstrings',
              description: 'End rep if form degrades to prevent muscle strain injuries'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Hill Power Mix',
          duration: '18–24 min',
          description: 'Powerful jumps plus sprints develop rhythm and drive uphill.',
          battlePlan: 'Instructions: Uphill bounds: walk down. Uphill skips for height: walk down. Uphill sprints: walk down. Work top to bottom.\n• Uphill bounds — 6 × (12–15)\n• Uphill skips for height — 6 × (~25–30yd)\n• Uphill sprints — 6 × (~25–30yd)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "uphill bounds",
                    "sets": 6,
                    "reps": "12–15"
                  },
                  {
                    "name": "yd uphill skips for height",
                    "sets": 6,
                    "reps": "25–30"
                  },
                  {
                    "name": "yd uphill sprints",
                    "sets": 6,
                    "reps": "25–30"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240859/mood_app/workout_images/zqqramht_download_13_.jpg',
          intensityReason: 'Bounds, skips, sprints build elastic strength safely.',
          session_type: 'plyo',
          intensity_cost: 4,
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Bounds: knee drive then hip extend; stick landings under control',
              description: 'Drive knee high, extend hip fully, and land with stability'
            },
            {
              icon: 'walk',
              title: 'Avoid heel striking uphill; keep cadence snappy and forward',
              description: 'Land on midfoot with quick turnover for uphill efficiency'
            }
          ]
        },
        {
          name: 'Agility Hill Circuit',
          duration: '20–26 min',
          description: 'Karaoke, shuffles, backpedal, sprints build coordination.',
          battlePlan: 'Instructions: Sprint at max effort, then walk the FULL recovery — showing up fresh for every rep is the whole workout. 4 rounds — all 6 moves in order.\n• 4 rounds:\n\n• uphill karaoke — ~30yd, lead L\n• uphill karaoke — ~30yd, lead R\n• uphill side shuffle L — ~25yd\n• uphill side shuffle R — ~25yd\n• uphill backpedal — ~25yd\n• uphill sprint — ~25yd\nWalk down between reps',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "yd uphill karaoke",
                    "reps": "30"
                  },
                  {
                    "name": "yd uphill karaoke",
                    "reps": "30"
                  },
                  {
                    "name": "yd uphill side shuffle L",
                    "reps": "25"
                  },
                  {
                    "name": "yd uphill side shuffle R",
                    "reps": "25"
                  },
                  {
                    "name": "yd uphill backpedal",
                    "reps": "25"
                  },
                  {
                    "name": "yd uphill sprint",
                    "reps": "25"
                  }
                ],
                "rounds": 4
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240850/mood_app/workout_images/ts9r3lf1_download_15_.jpg',
          intensityReason: 'Lateral and rotational moves challenge balance safely.',
          session_type: 'drill',
          intensity_cost: 3,
          moodTips: [
            {
              icon: 'body',
              title: 'Torso tall; no side lean; keep steps quick to reduce slip risk',
              description: 'Stay upright with rapid footwork to maintain traction'
            },
            {
              icon: 'walk',
              title: 'Backpedal toes up; short steps; maintain center over feet',
              description: 'Lift toes slightly and keep weight balanced during backward movement'
            }
          ]
        },
        {
          name: 'Strength Endurance Mix',
          duration: '20–26 min',
          description: 'Lunges, broad jumps, sprints reinforce controlled power.',
          battlePlan: 'Instructions: Sprint at max effort, then walk the FULL recovery — showing up fresh for every rep is the whole workout. Every rep at full intent — reset your stance between reps; speed beats load. 6 rounds — all 3 moves in order.\n• 6 rounds:\n\n• uphill walking lunges — ~20yd\n6–8 uphill broad jumps (~20 yd)\n• uphill sprint — ~20yd\nWalk down recovery',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Strength Endurance Mix",
                    "reps": "6"
                  },
                  {
                    "name": "yd uphill walking lunges",
                    "reps": "20",
                    "tutorialSlug": "walking_lunges"
                  },
                  {
                    "name": "uphill broad jumps",
                    "reps": "6–8"
                  },
                  {
                    "name": "yd uphill sprint",
                    "reps": "20"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240856/mood_app/workout_images/xyu6atdo_download_10_.jpg',
          intensityReason: 'Lunges and jumps pre-fatigue, then sprints build posture.',
          session_type: 'strength_circuit',
          intensity_cost: 4,
          moodTips: [
            {
              icon: 'body',
              title: 'Lunges: knee over mid-foot; upright torso; no inward collapse',
              description: 'Align knee with foot center while staying tall without knee cave'
            },
            {
              icon: 'trending-up',
              title: 'Broad jumps: swing arms; land softly; stabilize before sprint',
              description: 'Use arm momentum, absorb landing, then set before running'
            }
          ]
        },
        {
          name: 'Sprint-Only 30s',
          duration: '18–24 min',
          description: 'Ten uphill sprints at 30–40 yd build acceleration safely.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 10 sets of ~30–40yd — rest between sets. Uphill sprints: full walk down.\n• Uphill sprints — 10 × (~30–40yd)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "yd uphill sprints, full walk down",
                    "sets": 10,
                    "reps": "30–40"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240831/mood_app/workout_images/8d9vosf3_download_12_.jpg',
          intensityReason: 'Short fast sprints improve power with full recovery.',
          session_type: 'sprint',
          intensity_cost: 4,
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Drive arms; chin level; tall posture; quick ground contacts',
              description: 'Pump arms powerfully with head neutral and fast foot turnover'
            },
            {
              icon: 'body',
              title: 'If hamstrings tighten, reduce volume to protect from strain',
              description: 'Cut reps short if back of legs feel tight to prevent injury'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Mixed Hill Gauntlet',
          duration: '24–30 min',
          description: 'Sprints, knees, bounds, karaoke, shuffles train versatility.',
          battlePlan: 'Instructions: Sprint at max effort, then walk the FULL recovery — showing up fresh for every rep is the whole workout. Every rep at full intent — reset your stance between reps; speed beats load. 3 rounds — all 5 moves in order.\n• 3 rounds:\n\n• uphill sprint — ~40yd\n• uphill high knees — ~30yd\n12–15 uphill bounds\n• uphill karaoke — ~30yd, each lead\n• uphill side shuffle — ~30yd, each\nWalk down between all',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "yd uphill sprint",
                    "reps": "40"
                  },
                  {
                    "name": "yd uphill high knees",
                    "reps": "30"
                  },
                  {
                    "name": "uphill bounds",
                    "reps": "12–15"
                  },
                  {
                    "name": "yd uphill karaoke",
                    "reps": "30"
                  },
                  {
                    "name": "yd uphill side shuffle",
                    "reps": "30"
                  }
                ],
                "rounds": 3
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240821/mood_app/workout_images/0c0jva1u_download_11_.jpg',
          intensityReason: 'Varied drills challenge stiffness, power, and precision.',
          session_type: 'hybrid',
          intensity_cost: 5,
          moodTips: [
            {
              icon: 'body',
              title: 'Crisp contacts; avoid overreaching; keep hips tall and aligned',
              description: 'Land quick and precise without overstretching stride length'
            },
            {
              icon: 'trending-up',
              title: 'Take full walkbacks; quality first to protect tendons and calves',
              description: 'Allow complete recovery between reps to maintain form quality'
            }
          ]
        },
        {
          name: 'Bear Crawl + Sprint',
          duration: '22–28 min',
          description: 'Crawl, backpedal, sprint rotations build control, quickness.',
          battlePlan: 'Instructions: Sprint at max effort, then walk the FULL recovery — showing up fresh for every rep is the whole workout. Every rep at full intent — reset your stance between reps; speed beats load. 8 rounds — all 3 moves in order.\n• 8 rounds:\n\n• uphill bear crawl — ~15–20yd\n• uphill backpedal — ~20yd\n• uphill sprint — ~20–25yd\nWalk down recovery',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Bear Crawl + Sprint",
                    "reps": "8"
                  },
                  {
                    "name": "yd uphill bear crawl",
                    "reps": "15–20"
                  },
                  {
                    "name": "yd uphill backpedal",
                    "reps": "20"
                  },
                  {
                    "name": "yd uphill sprint",
                    "reps": "20–25"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240837/mood_app/workout_images/cno97kue_download_14_.jpg',
          intensityReason: 'Crawling loads core; sprints add speed under fatigue.',
          session_type: 'strength_circuit',
          intensity_cost: 5,
          moodTips: [
            {
              icon: 'body',
              title: 'Bear crawl: hips low; knees under hips; keep spine neutral',
              description: 'Stay low with knees close to ground and flat back'
            },
            {
              icon: 'walk',
              title: 'Backpedal: short steps; eyes forward to maintain safe balance',
              description: 'Take compact steps backward while looking ahead'
            }
          ]
        },
        {
          name: 'Jump + Sprint Mix',
          duration: '22–28 min',
          description: 'Skips, broad jumps, sprints build explosive rhythm safely.',
          battlePlan: 'Instructions: Sprint at max effort, then walk the FULL recovery — showing up fresh for every rep is the whole workout. Every rep at full intent — reset your stance between reps; speed beats load. 6 rounds — all 3 moves in order.\n• 6 rounds:\n\n• uphill skips for distance — ~25yd\n6–8 uphill broad jumps (~20–25 yd)\n• uphill sprint — ~30yd\nWalk down',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Jump + Sprint Mix",
                    "reps": "6"
                  },
                  {
                    "name": "yd uphill skips for distance",
                    "reps": "25"
                  },
                  {
                    "name": "uphill broad jumps",
                    "reps": "6–8"
                  },
                  {
                    "name": "yd uphill sprint",
                    "reps": "30"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240859/mood_app/workout_images/zqqramht_download_13_.jpg',
          intensityReason: 'Jumps prime tissues; sprints reinforce fast mechanics.',
          session_type: 'plyo',
          intensity_cost: 5,
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Use strong arm swing; knees track; stick landings before moving',
              description: 'Drive arms powerfully, align knees, and stabilize on landing'
            },
            {
              icon: 'body',
              title: 'Keep volume crisp; if landings get loud, cut reps to protect joints',
              description: 'Reduce sets if impact noise increases to prevent joint stress'
            }
          ]
        },
        {
          name: 'Sprint-Only 20s',
          duration: '18–24 min',
          description: 'Twelve 20–25 yd sprints prioritize high-quality starts.',
          battlePlan: 'Instructions: 12 sets of ~20–25yd — rest between sets. Uphill sprints: full walk down.\n• Uphill sprints — 12 × (~20–25yd)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "yd uphill sprints, full walk down",
                    "sets": 12,
                    "reps": "20–25"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240831/mood_app/workout_images/8d9vosf3_download_12_.jpg',
          intensityReason: 'Very short sprints train quickness with low cumulative load.',
          session_type: 'sprint',
          intensity_cost: 5,
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Explode then relax; quick turnover; hips tall; arms powerful',
              description: 'Burst from start then settle into efficient form with arm drive'
            },
            {
              icon: 'body',
              title: 'End early if form fades; prioritize tendon and calf protection',
              description: 'Stop the set if technique breaks down to prevent strain'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Park workout',
    icon: 'leaf',
    workouts: {
      beginner: [
        {
          name: 'Bench And Path',
          duration: '18–22 min',
          description: 'Squats, push-ups, dips plus walking maintain clean form.',
          battlePlan: 'Instructions: 3 rounds — follow the 4 timed segments in order, no skipping.\n• 3 rounds:\n\n12 bench squats\n10 incline push-ups (bench)\n8 bench dips\n60s easy walk',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "name": "bench squats",
                    "reps": "12",
                    "tutorialSlug": "kb_squat"
                  },
                  {
                    "name": "incline push-ups",
                    "reps": "10"
                  },
                  {
                    "name": "bench dips",
                    "reps": "8",
                    "tutorialSlug": "bench_dips"
                  },
                  {
                    "duration": "60s",
                    "name": "easy walk"
                  }
                ],
                "rounds": 3
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240819/mood_app/workout_images/0aaca0zk_download_16_.jpg',
          intensityReason: 'Simple bodyweight moves build strength with joint safety.',
          session_type: 'strength_circuit',
          intensity_cost: 2,
          moodTips: [
            {
              icon: 'body',
              title: 'Squats: sit back; knees track over mid-foot; even foot pressure',
              description: 'Hinge at hips with knees aligned and weight distributed evenly'
            },
            {
              icon: 'leaf',
              title: 'Dips: shoulders down; slight forward lean; avoid shrugging',
              description: 'Depress shoulders and tilt slightly forward to protect joints'
            }
          ]
        },
        {
          name: 'Park Circuit',
          duration: '18–22 min',
          description: 'Step-ups, rows, dips with light run build posture control.',
          battlePlan: 'Instructions: Drive through the heel of the TOP foot — the bottom leg is along for the ride. Control the step down. Complete ALL reps on one side before switching — no alternating unless written. 3 rounds — all 4 moves in order.\n• 3 rounds:\n\n10 step-ups/side (bench)\n8 bench rows (underhand)\n8–10 bench dips\n• easy jog — ~150–200m\n• 60–90s rest',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "step-ups/side",
                    "reps": "10"
                  },
                  {
                    "name": "bench rows",
                    "reps": "8"
                  },
                  {
                    "name": "bench dips",
                    "reps": "8–10",
                    "tutorialSlug": "bench_dips"
                  },
                  {
                    "name": "m easy jog",
                    "reps": "150–200"
                  }
                ],
                "rounds": 3
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240839/mood_app/workout_images/f9t1jnvw_download_17_.jpg',
          intensityReason: 'Alternating strength and jog sustains HR without spikes.',
          session_type: 'strength_circuit',
          intensity_cost: 3,
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Step-ups: full foot on bench; control descent to protect knees',
              description: 'Place entire foot on surface and lower with control'
            },
            {
              icon: 'body',
              title: 'Rows: pull shoulder blades first; keep neck long and relaxed',
              description: 'Initiate pull with scapular retraction while keeping neck neutral'
            }
          ]
        },
        {
          name: 'Mobility And Strength',
          duration: '16–20 min',
          description: 'Lunges, elevated push-ups, dips with walks build control.',
          battlePlan: 'Instructions: Complete ALL reps on one side before switching — no alternating unless written. 3 rounds — follow the 4 timed segments in order, no skipping.\n• 3 rounds:\n\n8 walking lunges/side\n8–10 incline push-ups\n8 bench dips\n60s easy walk',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "name": "walking lunges/side",
                    "reps": "8",
                    "tutorialSlug": "walking_lunges"
                  },
                  {
                    "name": "incline push-ups",
                    "reps": "8–10"
                  },
                  {
                    "name": "bench dips",
                    "reps": "8",
                    "tutorialSlug": "bench_dips"
                  },
                  {
                    "duration": "60s",
                    "name": "easy walk"
                  }
                ],
                "rounds": 3
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240845/mood_app/workout_images/jzueym21_download_18_.jpg',
          intensityReason: 'Gentle pairing improves movement quality and stability.',
          session_type: 'strength_circuit',
          intensity_cost: 2,
          moodTips: [
            {
              icon: 'body',
              title: 'Lunges: upright torso; knee follows toes; avoid inward collapse',
              description: 'Stay tall with knee tracking in line with foot, not caving in'
            },
            {
              icon: 'leaf',
              title: 'Push-ups: straight line ears-to-ankles; no low-back sagging',
              description: 'Maintain plank alignment from head to heels throughout'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Park Push-Pull-Run',
          duration: '22–26 min',
          description: 'Rows, push-ups, dips, step-ups, runs build endurance.',
          battlePlan: 'Instructions: Drive through the heel of the TOP foot — the bottom leg is along for the ride. Control the step down. Complete ALL reps on one side before switching — no alternating unless written. 4 rounds — all 5 moves in order, then rest 60–90s.\n• 4 rounds:\n\n10 bench rows\n10 push-ups\n10–12 dips\n10 step-ups/side\n• run — ~200m\n• Rest 60–90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "bench rows",
                    "reps": "10"
                  },
                  {
                    "name": "push-ups",
                    "reps": "10"
                  },
                  {
                    "name": "dips",
                    "reps": "10–12",
                    "tutorialSlug": "dips"
                  },
                  {
                    "name": "step-ups/side",
                    "reps": "10"
                  },
                  {
                    "name": "m run",
                    "reps": "200"
                  }
                ],
                "rounds": 4,
                "rest": "60–90s"
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240854/mood_app/workout_images/xmpcsqgf_download_22_.jpg',
          intensityReason: 'Balanced upper/lower work with runs sustains output.',
          session_type: 'strength_circuit',
          intensity_cost: 4,
          moodTips: [
            {
              icon: 'body',
              title: 'Rows: ribs down; avoid flaring; elbows track for shoulder safety',
              description: 'Keep ribs pulled in with elbows moving along your sides'
            },
            {
              icon: 'leaf',
              title: 'Dips: slight forward lean; keep elbows near body; full control',
              description: 'Tilt forward slightly with elbows close and smooth movement'
            }
          ]
        },
        {
          name: 'EMOM Park Strength',
          duration: '20–24 min',
          description: 'Dips, jumps, push-ups, short runs cycle with planned rest.',
          battlePlan: 'Instructions: Start the work at the top of every minute — whatever\'s left of the minute is your rest. Falling behind? Trim reps, don\'t skip minutes. Drive through the heel of the TOP foot — the bottom leg is along for the ride. Control the step down. Work top to bottom. EMOM for 20 minutes.\n\n• 10–12 dips\n• 10 bench jumps or step-ups/side\n• 10–12 push-ups\n• Run — ~200m',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "duration": "20 min",
                    "name": "EMOM:"
                  },
                  {
                    "name": "Min 1: 10–12 dips",
                    "tutorialSlug": "dips"
                  },
                  {
                    "name": "Min 2: 10 bench jumps or step-ups/side"
                  },
                  {
                    "name": "Min 3: 10–12 push-ups"
                  },
                  {
                    "name": "Min 4: 200 m run"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240844/mood_app/workout_images/ixf6e9ex_download_20_.jpg',
          intensityReason: 'EMOM timing preserves quality while managing fatigue.',
          session_type: 'hybrid',
          intensity_cost: 4,
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Bench jumps: land softly; knees stacked; absorb through hips',
              description: 'Touch down gently with aligned knees and hip absorption'
            },
            {
              icon: 'body',
              title: 'Push-ups: elbows ~45°; shoulder blades glide; avoid flares',
              description: 'Keep elbows at moderate angle with smooth scapular movement'
            }
          ]
        },
        {
          name: 'Circuit With Runs',
          duration: '22–26 min',
          description: 'Dips, squats, rows, runs create balanced stress safely.',
          battlePlan: 'Instructions: 4 rounds — all 4 moves in order.\n• 4 rounds:\n\n12 bench dips\n15 air squats\n10 bench rows\n• run — ~200m\n• 60–90s rest',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "bench dips",
                    "reps": "12",
                    "tutorialSlug": "bench_dips"
                  },
                  {
                    "name": "air squats",
                    "reps": "15",
                    "tutorialSlug": "kb_squat"
                  },
                  {
                    "name": "bench rows",
                    "reps": "10"
                  },
                  {
                    "name": "m run",
                    "reps": "200"
                  }
                ],
                "rounds": 4
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240819/mood_app/workout_images/0aaca0zk_download_16_.jpg',
          intensityReason: 'Mixed calisthenics and light runs train steady output.',
          session_type: 'strength_circuit',
          intensity_cost: 4,
          moodTips: [
            {
              icon: 'body',
              title: 'Squats: tripod foot; knees track; maintain even depth each rep',
              description: 'Distribute weight across foot with consistent squat depth'
            },
            {
              icon: 'leaf',
              title: 'Rows: neutral neck; engage lats first; avoid shrugging tension',
              description: 'Keep head aligned and initiate pull with back muscles'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Park Gauntlet Strength',
          duration: '26–32 min',
          description: 'Dips, decline push-ups, jumps, runs challenge stamina.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 3 rounds — all 4 moves in order. Rest 90s between moves.\n• 3 rounds:\n\n15 dips\n12 decline push-ups (feet on bench)\n12 bench jumps\n• run — ~300m',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "dips",
                    "reps": "15",
                    "tutorialSlug": "dips"
                  },
                  {
                    "name": "decline push-ups",
                    "reps": "12"
                  },
                  {
                    "name": "bench jumps",
                    "reps": "12"
                  },
                  {
                    "name": "m run",
                    "reps": "300"
                  }
                ],
                "rounds": 3
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240844/mood_app/workout_images/ixf6e9ex_download_20_.jpg',
          intensityReason: 'Higher volumes with runs test posture and breathing.',
          session_type: 'strength_circuit',
          intensity_cost: 5,
          moodTips: [
            {
              icon: 'body',
              title: 'Decline push-ups: brace core; avoid lumbar sway; even tempo',
              description: 'Engage abs to prevent back arching and use steady pace'
            },
            {
              icon: 'trending-up',
              title: 'Bench jumps: toe-ball landings; soft knees; stabilize before move',
              description: 'Land on forefoot with bent knees and pause before next rep'
            }
          ]
        },
        {
          name: 'EMOM Sprints And Dips',
          duration: '24–28 min',
          description: 'Alternate dips, push-ups with sprints and walkbacks.',
          battlePlan: 'Instructions: Start the work at the top of every minute — whatever\'s left of the minute is your rest. Falling behind? Trim reps, don\'t skip minutes. Sprint at max effort, then walk the FULL recovery — showing up fresh for every rep is the whole workout. Work top to bottom. Alternating EMOM for 24 minutes.\n\n• Odd minutes, 12 dips + 10 push-ups\n• Even minutes, 2x 50 m sprint (walk back)',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "duration": "24 min",
                    "name": "alternating EMOM:"
                  },
                  {
                    "name": "Odd: 12 dips + 10 push-ups",
                    "tutorialSlug": "dips"
                  },
                  {
                    "name": "Even: 2x 50 m sprint"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240854/mood_app/workout_images/xmpcsqgf_download_22_.jpg',
          intensityReason: 'Short sprints add intensity while EMOM preserves form.',
          session_type: 'hybrid',
          intensity_cost: 5,
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Sprint tall; quick contacts; relax jaw; shorten steps slightly',
              description: 'Run upright with fast turnover, loose face, and compact stride'
            },
            {
              icon: 'body',
              title: 'Dips: stop before shoulder pinch; keep scapulae moving freely',
              description: 'Limit depth to prevent impingement and allow natural blade movement'
            }
          ]
        },
        {
          name: 'Bars And Burpees',
          duration: '24–30 min',
          description: 'Dips, push-ups, burpees, runs test control and pacing.',
          battlePlan: 'Instructions: 4 rounds — all 4 moves in order.\n• 4 rounds:\n\n15 dips\n12 push-ups\n12 burpees\n• run — ~200m\n• 60–90s rest',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "dips",
                    "reps": "15",
                    "tutorialSlug": "dips"
                  },
                  {
                    "name": "push-ups",
                    "reps": "12"
                  },
                  {
                    "name": "burpees",
                    "reps": "12"
                  },
                  {
                    "name": "m run",
                    "reps": "200"
                  }
                ],
                "rounds": 4
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240823/mood_app/workout_images/2o1s2i0l_download_19_.jpg',
          intensityReason: 'Pairing push patterns and runs increases sustained load.',
          session_type: 'strength_circuit',
          intensity_cost: 5,
          moodTips: [
            {
              icon: 'body',
              title: 'Burpees: solid plank line; step out if low back feels stressed',
              description: 'Maintain plank alignment and modify to step-downs if needed'
            },
            {
              icon: 'leaf',
              title: 'Dips: elbows track; avoid bouncing; prioritize full, stable range',
              description: 'Keep elbows aligned with controlled movement through full range'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Track workout',
    icon: 'ellipse-outline',
    workouts: {
      beginner: [
        {
          name: 'Drills And 40s',
          duration: '22–26 min',
          description: 'High knees, skips, strides refine cadence and alignment.',
          battlePlan: 'Instructions: High knees: walk back. A-skips: walk back. Relaxed strides: walk back. Work top to bottom.\n• 2 laps easy jog\n• High knees — 2 × (~40m)\n• A-skips — 2 × (~40m)\n• Relaxed strides — 4 × (~40m)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "laps easy jog",
                    "reps": "2"
                  },
                  {
                    "name": "m high knees",
                    "sets": 2,
                    "reps": "40"
                  },
                  {
                    "name": "m A-skips",
                    "sets": 2,
                    "reps": "40"
                  },
                  {
                    "name": "m relaxed strides",
                    "sets": 4,
                    "reps": "40"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240857/mood_app/workout_images/y6eufem1_download_28_.jpg',
          intensityReason: 'Short drills improve rhythm and posture with low impact.',
          session_type: 'drill',
          intensity_cost: 2,
          moodTips: [
            {
              icon: 'body',
              title: 'Stay tall; lean from ankles; hips stacked under ribcage alignment',
              description: 'Maintain upright posture with forward lean originating from feet'
            },
            {
              icon: 'walk',
              title: 'Land under hips; quick off ground to reduce braking and impact',
              description: 'Place feet beneath body and lift quickly to minimize ground time'
            }
          ]
        },
        {
          name: 'Bounds And Straights',
          duration: '22–26 min',
          description: 'Bounds, skips, then 60 m straights at moderate pace.',
          battlePlan: 'Instructions: Bounds: walk back. Skips for height: walk back. Straights moderate: walk back. Work top to bottom.\n• 2 laps easy jog\n• Bounds — 2 × (~40m)\n• Skips for height — 2 × (~40m)\n• Straights moderate — 4 × (~60m)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "laps easy jog",
                    "reps": "2"
                  },
                  {
                    "name": "m bounds",
                    "sets": 2,
                    "reps": "40"
                  },
                  {
                    "name": "m skips for height",
                    "sets": 2,
                    "reps": "40"
                  },
                  {
                    "name": "m straights moderate",
                    "sets": 4,
                    "reps": "60"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240849/mood_app/workout_images/osnepsje_download_25_.jpg',
          intensityReason: 'Low-volume plyos enhance elasticity with control.',
          session_type: 'plyo',
          intensity_cost: 3,
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Bounds: soft land; knee tracks forward; avoid excessive reach',
              description: 'Touch down gently with aligned knee and moderate stride length'
            },
            {
              icon: 'body',
              title: 'Skips: coordinated arm drive; tall posture for smooth rhythm',
              description: 'Sync arm swing with leg action while staying upright'
            }
          ]
        },
        {
          name: 'Short Sprint Intro',
          duration: '22–26 min',
          description: 'Multiple 30 m sprints with walkbacks build speed safely.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom. Sprints: ~30m each, full walk back.\n• 2 laps easy jog\n• Sprints — 8–10 reps',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "laps easy jog",
                    "reps": "2"
                  },
                  {
                    "name": "8–10x30 m sprints, full walk back"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240830/mood_app/workout_images/8chb1prv_download_29_.jpg',
          intensityReason: 'Very short sprints teach acceleration without overload.',
          session_type: 'sprint',
          intensity_cost: 3,
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Build first 10 m; avoid lunging; keep chin level and relaxed',
              description: 'Accelerate gradually without overreaching and stay loose'
            },
            {
              icon: 'walk',
              title: 'Short, fast steps under hips; arms punch back, not across body',
              description: 'Take quick compact strides with arm drive straight back'
            }
          ]
        },
        {
          name: 'Curves And Drills',
          duration: '24–28 min',
          description: 'Easy curves, drills, and 40 m sprints refine cadence.',
          battlePlan: 'Instructions: Curves easy: straights walk. High knees: walk back. Sprints: walk back. Work top to bottom.\n• 2 laps easy jog\n• Curves easy — 2 × (~100m)\n• High knees — 2 × (~30m)\n• Sprints — 4 × (~40m)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "laps easy jog",
                    "reps": "2"
                  },
                  {
                    "name": "m curves easy",
                    "sets": 2,
                    "reps": "100"
                  },
                  {
                    "name": "m high knees",
                    "sets": 2,
                    "reps": "30"
                  },
                  {
                    "name": "m sprints",
                    "sets": 4,
                    "reps": "40"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240847/mood_app/workout_images/kb9dg83f_download_30_.jpg',
          intensityReason: 'Curved running practice improves balance and control.',
          session_type: 'drill',
          intensity_cost: 3,
          moodTips: [
            {
              icon: 'ellipse-outline',
              title: 'Lean subtly through turns from ankles; keep posture upright',
              description: 'Tilt into curves from feet while maintaining tall stance'
            },
            {
              icon: 'body',
              title: 'Knees lift; feet recover quickly under body; avoid overstride',
              description: 'Drive knees up and place feet beneath you without reaching out'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: '150s With Drills',
          duration: '26–32 min',
          description: 'A-skips, bounds into controlled 150s with walkbacks.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom. @ 3–5k effort, walk 150 m.\n• 1 lap easy jog\n• A-skips — 2 × (~40m)\n• Bounds — 2 × (~40m)\n• Track 150s — 4 × (~150m)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "lap easy jog",
                    "reps": "1"
                  },
                  {
                    "name": "m A-skips",
                    "sets": 2,
                    "reps": "40"
                  },
                  {
                    "name": "m bounds",
                    "sets": 2,
                    "reps": "40"
                  },
                  {
                    "name": "m @ 3–5k effort, walk 150 m",
                    "sets": 4,
                    "reps": "150"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240832/mood_app/workout_images/8s808afw_download_24_.jpg',
          intensityReason: 'Drills then 150s build speed endurance with form.',
          session_type: 'interval',
          intensity_cost: 4,
          moodTips: [
            {
              icon: 'body',
              title: 'Keep torso quiet; elbows drive straight; avoid crossing midline',
              description: 'Minimize upper body movement with arms swinging forward-back'
            },
            {
              icon: 'ellipse-outline',
              title: 'On 150s, relax face and jaw; hold tall hips as pace increases',
              description: 'Release facial tension and maintain hip height through faster running'
            }
          ]
        },
        {
          name: 'Sprint 40s And 30s',
          duration: '26–32 min',
          description: 'Six 40s and six 30s build acceleration and posture.',
          battlePlan: 'Instructions: Sprint at max effort, then walk the FULL recovery — showing up fresh for every rep is the whole workout. Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom. Fast: walk back. Fast: walk back.\n• 1 lap easy jog\n• Fast — 6 × (~40m)\n• Fast — 6 × (~30m)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "lap easy jog",
                    "reps": "1"
                  },
                  {
                    "name": "m fast, walk back",
                    "sets": 6,
                    "reps": "40"
                  },
                  {
                    "name": "m fast, walk back",
                    "sets": 6,
                    "reps": "30"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240830/mood_app/workout_images/8chb1prv_download_29_.jpg',
          intensityReason: 'Short sprints sharpen turnover with full recovery.',
          session_type: 'sprint',
          intensity_cost: 4,
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Smooth acceleration; avoid sudden lean; keep hips stacked tall',
              description: 'Build speed gradually without jerky forward tilt'
            },
            {
              icon: 'walk',
              title: 'Quick steps; no braking; land under center to save joints',
              description: 'Turnover fast with foot placement beneath body'
            }
          ]
        },
        {
          name: 'Form Circuit',
          duration: '28–34 min',
          description: 'High knees, skips, bounds precede 60 m quality strides.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 3 rounds — all 4 moves in order.\n• 3 rounds:\n\n• high knees — ~30m, walk back\n• A-skips — ~30m, walk back\n• bounds — ~30m, walk back\n• stride — ~60m',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "m high knees",
                    "reps": "30"
                  },
                  {
                    "name": "m A-skips",
                    "reps": "30"
                  },
                  {
                    "name": "m bounds",
                    "reps": "30"
                  },
                  {
                    "name": "m stride",
                    "reps": "60"
                  }
                ],
                "rounds": 3
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240857/mood_app/workout_images/y6eufem1_download_28_.jpg',
          intensityReason: 'Drills with strides build posture and elasticity safely.',
          session_type: 'drill',
          intensity_cost: 3,
          moodTips: [
            {
              icon: 'body',
              title: 'Stack ribs over pelvis; reduce overreach for safer ground contact',
              description: 'Align torso over hips with compact strides for protection'
            },
            {
              icon: 'trending-up',
              title: 'Light, springy contacts; push back, not up; keep cadence smooth',
              description: 'Land softly and drive backward with consistent rhythm'
            }
          ]
        },
        {
          name: 'Straights And Turns',
          duration: '28–34 min',
          description: 'Faster straights, easy curves reinforce pacing transitions.',
          battlePlan: 'Instructions: 8 laps: straights moderate-fast + curves easy jog.\n• Track laps — ~8 laps',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "laps: straights moderate-fast + curves easy jog",
                    "reps": "8"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240847/mood_app/workout_images/kb9dg83f_download_30_.jpg',
          intensityReason: 'Alternating straights and curves teaches rhythm control.',
          session_type: 'fartlek',
          intensity_cost: 4,
          moodTips: [
            {
              icon: 'ellipse-outline',
              title: 'Float curves with relaxed cadence; avoid over-leaning torso',
              description: 'Ease through turns with loose stride and upright body'
            },
            {
              icon: 'body',
              title: 'Toe-off under center mass; arms drive straight back consistently',
              description: 'Push from beneath you with arm movement parallel to track'
            }
          ]
        }
      ],
      advanced: [
        {
          name: '40s And 60s Speed',
          duration: '28–34 min',
          description: 'Eight 40s plus six 60s maintain crisp mechanics safely.',
          battlePlan: 'Instructions: Fast: full walk back. Relaxed fast: walk back. Work top to bottom.\n• Fast — 8 × (~40m)\n• Relaxed fast — 6 × (~60m)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "m fast, full walk back",
                    "sets": 8,
                    "reps": "40"
                  },
                  {
                    "name": "m relaxed fast, walk back",
                    "sets": 6,
                    "reps": "60"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240830/mood_app/workout_images/8chb1prv_download_29_.jpg',
          intensityReason: 'Short sprints and relaxed strides refine max velocity.',
          session_type: 'sprint',
          intensity_cost: 5,
          moodTips: [
            {
              icon: 'body',
              title: 'Relax jaw and hands; tall hips; avoid collapsing into steps',
              description: 'Release facial and hand tension while maintaining hip height'
            },
            {
              icon: 'trending-up',
              title: 'Drive elbows back; keep contacts quick and under the body',
              description: 'Pump arms rearward with fast, centered foot placement'
            }
          ]
        },
        {
          name: 'Drill-Sprint Matrix',
          duration: '30–36 min',
          description: 'Knees, skips, bounds before 50s reinforce timing, rhythm.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 3 rounds — all 4 moves in order. Sprints: walk back.\n• 3 rounds:\n\n• high knees — ~30m, walk back\n• A-skips — ~30m, walk back\n• bounds — ~30m, walk back\n• Sprints — 2 × (~50m)',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "m high knees",
                    "reps": "30"
                  },
                  {
                    "name": "m A-skips",
                    "reps": "30"
                  },
                  {
                    "name": "m bounds",
                    "reps": "30"
                  },
                  {
                    "name": "m sprints, walk back",
                    "sets": 2,
                    "reps": "50"
                  }
                ],
                "rounds": 3
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240832/mood_app/workout_images/8s808afw_download_24_.jpg',
          intensityReason: 'Pairing drills and sprints engrains efficient patterns.',
          session_type: 'hybrid',
          intensity_cost: 4,
          moodTips: [
            {
              icon: 'body',
              title: 'Knees punch up; feet recover under hips; avoid casting forward',
              description: 'Drive knees high and place feet beneath you without reaching'
            },
            {
              icon: 'trending-up',
              title: 'Strong posture with slight ankle lean; no waist bend at speed',
              description: 'Stay tall with forward tilt from ankles, not hip hinge'
            }
          ]
        },
        {
          name: 'Curve Flys + 30s',
          duration: '30–36 min',
          description: 'Fly-in curves into 50s, then 30s sharpen coordination.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom. Sprints: full walk back.\n• 4x curve fly-in + 50 m fast, walk 200 m\n• Sprints — 8 × (~30m)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "4x curve fly-in + 50 m fast, walk 200 m",
                    "tutorialSlug": "db_fly"
                  },
                  {
                    "name": "m sprints, full walk back",
                    "sets": 8,
                    "reps": "30"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240847/mood_app/workout_images/kb9dg83f_download_30_.jpg',
          intensityReason: 'Curve entries and short sprints develop balanced speed.',
          session_type: 'sprint',
          intensity_cost: 5,
          moodTips: [
            {
              icon: 'ellipse-outline',
              title: 'Smooth lean through curve from ankles; avoid inside foot collapse',
              description: 'Tilt into turn from feet and keep inside foot stable'
            },
            {
              icon: 'walk',
              title: 'Quick contacts; no overstride; maintain tall posture throughout',
              description: 'Land fast with compact stride and upright body position'
            }
          ]
        },
        {
          name: 'Mixed Accels',
          duration: '30–36 min',
          description: 'Repeating 20-30-40 m efforts builds skill and control.',
          battlePlan: 'Instructions: 3 rounds — follow the 4 timed segments in order, no skipping.\n• 3 rounds:\n\n• fast, walk back — ~20m\n• fast, walk back — ~30m\n• fast, walk back — ~40m\n• 2–3 min walk between sets',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "name": "Mixed Accels",
                    "reps": "3"
                  },
                  {
                    "duration": "20 m",
                    "name": "fast, walk back"
                  },
                  {
                    "duration": "30 m",
                    "name": "fast, walk back"
                  },
                  {
                    "duration": "40 m",
                    "name": "fast, walk back"
                  },
                  {
                    "duration": "2–3 min",
                    "name": "walk between sets"
                  }
                ]
              }
            ]
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240825/mood_app/workout_images/4l6rndq8_download_26_.jpg',
          intensityReason: 'Progressing distances train precise force application.',
          session_type: 'sprint',
          intensity_cost: 4,
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Build each rep smoothly; avoid blasting first step or overreach',
              description: 'Accelerate gradually without explosive start or long stride'
            },
            {
              icon: 'body',
              title: 'Hips tall; midfoot contacts; prevent heel striking under fatigue',
              description: 'Keep pelvis high with forefoot landing especially when tired'
            }
          ]
        }
      ]
    }
  }
];
