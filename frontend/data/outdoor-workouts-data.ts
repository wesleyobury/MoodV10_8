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
          battlePlan: '• 5 min brisk walk\n• 6 rounds: 1 min easy jog + 1 min walk\n• 5 min easy walk',
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
          battlePlan: '• 5 min easy jog\n• 15–20 min continuous easy→steady\n• 3–5 min walk',
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
          battlePlan: '• 4 min brisk walk\n• 6 rounds: 2 min run + 2 min walk\n• 2–4 min walk',
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
          battlePlan: '• 8 min easy\n• 10–12 min easy\n• 8–10 min tempo (RPE 7–8)\n• 4–5 min easy',
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
          battlePlan: '• 8 min easy\n• 1 hard/1 easy\n• 2 hard/2 easy\n• 3 hard/3 easy\n• 2 hard/2 easy\n• 1 hard/1 easy\n• 5 min easy',
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
          battlePlan: '• 8–10 min easy\n• 20 min steady (talk in phrases)\n• 4–6 min easy',
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
          battlePlan: '• 10 min easy + 3x20s strides (40s easy)\n• 3x: 8 min threshold + 2 min easy\n• 6–8 min easy',
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
          battlePlan: '• 10 min easy\n• 10x: 1 min hard + 1 min easy\n• 8–10 min easy',
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
          battlePlan: '• 10 min easy\n• 10 min steady\n• 10 min tempo\n• 8–10 min easy',
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
          battlePlan: '• 8 min easy\n• 6x: 30s 90–110 RPM + 90s easy\n• 6–8 min easy',
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
          battlePlan: '• 6–8 min easy\n• 6x: 1 min RPE 6 + 1 min easy\n• 5–6 min easy',
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
          battlePlan: '• 10 min easy\n• 3x3 min moderate + 2 min easy\n• 5–8 min easy',
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
          battlePlan: '• 10 min easy + 3x20s spin-ups\n• 3x: 8 min RPE 7–8 + 3 min easy\n• 6–8 min easy',
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
          battlePlan: '• 10 min easy\n• 3x: (1 min RPE 7, 1 min RPE 8) x4 + 3 min easy\n• 6–8 min easy',
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
          battlePlan: '• 10 min easy\n• 5x: 2 min 60–70 RPM RPE 7 + 2 min easy\n• 6–8 min easy',
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
          battlePlan: '• 12 min easy + 3x15s high cadence\n• 6x: 2 min RPE 9 + 2 min easy\n• 8–10 min easy',
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
          battlePlan: '• 12 min easy\n• 4 hard + 4 easy\n• 6 hard + 6 easy\n• 8 hard + 8 easy\n• 6 hard + 6 easy\n• 4 hard + 4 easy\n• 6–8 min easy',
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
          battlePlan: '• 12 min easy\n• 10x: 30s RPE 9 + 90s easy\n• 8–10 min easy',
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
          battlePlan: '• 10x25 Freestyle, 30–45s rest (own pace if needed)\n• 4x25 Backstroke easy, 30–45s rest\n• 50 easy Freestyle',
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
          battlePlan: '• 6x25 Freestyle, 30–45s rest (own pace)\n• 4x25 Backstroke, 30–45s rest\n• 4x25 Breaststroke, 40–60s rest\n• 50 easy choice',
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
          battlePlan: '• 6x50 Freestyle easy-moderate, 40–60s rest\n• 4x25 Kick easy (choice), 30–45s rest\n• 50 easy Freestyle',
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
          battlePlan: '• 12x50 Freestyle steady, 25–45s rest (own pace ok)\n• 100 easy Freestyle',
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
          battlePlan: '• 6x50 Freestyle steady, 25–40s rest\n• 4x50 Backstroke steady, 30–45s rest\n• 4x50 Breaststroke steady, 35–60s rest\n• 100 easy Freestyle',
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
          battlePlan: '• 6x100 Freestyle easy-moderate, 45–75s rest (own pace)\n• 100 easy Freestyle',
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
          battlePlan: '• 8x100 Freestyle strong, 45–75s rest\n• 200 easy Freestyle',
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
          battlePlan: '• 4x100 Freestyle, 40–60s\n• 3x100 Backstroke, 45–75s\n• 3x100 Breaststroke, 60–90s\n• 200 easy Freestyle',
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
          battlePlan: '• 50 Freestyle, 30–45s\n• 100 Freestyle, 45–75s\n• 150 Freestyle, 60–90s\n• 100 Freestyle, 45–75s\n• 50 Freestyle, 30–45s\n• 100 easy Freestyle',
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
          battlePlan: '• 4x 25 yd uphill high knees (walk down)\n• 4x 25 yd uphill side shuffle L/R (alt) (walk down)\n• 4x 30 yd uphill easy jog (walk down)',
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
          battlePlan: '• 4x 20 yd uphill skips (walk down)\n• 4x 20 yd uphill marching high knees (walk down)\n• 4x 20 yd uphill backpedal (walk down)',
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
          battlePlan: '• 3 rounds:\n\n25 yd uphill side shuffle L\n25 yd uphill side shuffle R\n25 yd uphill karaoke (lead L)\n25 yd uphill karaoke (lead R)\n30 yd uphill easy jog\nWalk down between each',
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
          battlePlan: '• 8x 20–25 yd uphill sprints, full walk down',
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
          battlePlan: '• 6x 12–15 uphill bounds (walk down)\n• 6x 25–30 yd uphill skips for height (walk down)\n• 6x 25–30 yd uphill sprints (walk down)',
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
          battlePlan: '• 4 rounds:\n\n30 yd uphill karaoke (lead L)\n30 yd uphill karaoke (lead R)\n25 yd uphill side shuffle L\n25 yd uphill side shuffle R\n25 yd uphill backpedal\n25 yd uphill sprint\nWalk down between reps',
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
          battlePlan: '• 6 sets:\n\n20 yd uphill walking lunges\n6–8 uphill broad jumps (~20 yd)\n20 yd uphill sprint\nWalk down recovery',
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
          battlePlan: '• 10x 30–40 yd uphill sprints, full walk down',
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
          battlePlan: '• 3 rounds:\n\n40 yd uphill sprint\n30 yd uphill high knees\n12–15 uphill bounds\n30 yd uphill karaoke (each lead)\n30 yd uphill side shuffle (each)\nWalk down between all',
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
          battlePlan: '• 8 sets:\n\n15–20 yd uphill bear crawl\n20 yd uphill backpedal\n20–25 yd uphill sprint\nWalk down recovery',
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
          battlePlan: '• 6 sets:\n\n25 yd uphill skips for distance\n6–8 uphill broad jumps (~20–25 yd)\n30 yd uphill sprint\nWalk down',
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
          battlePlan: '• 12x 20–25 yd uphill sprints, full walk down',
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
          battlePlan: '• 3 rounds:\n\n12 bench squats\n10 incline push-ups (bench)\n8 bench dips\n60s easy walk',
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
          battlePlan: '• 3 rounds:\n\n10 step-ups/side (bench)\n8 bench rows (underhand)\n8–10 bench dips\n150–200 m easy jog\n• 60–90s rest',
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
          battlePlan: '• 3 rounds:\n\n8 walking lunges/side\n8–10 incline push-ups\n8 bench dips\n60s easy walk',
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
          battlePlan: '• 4 rounds:\n\n10 bench rows\n10 push-ups\n10–12 dips\n10 step-ups/side\n200 m run\n• Rest 60–90s',
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
          battlePlan: '• 20 min EMOM:\n\nMin 1: 10–12 dips\nMin 2: 10 bench jumps or step-ups/side\nMin 3: 10–12 push-ups\nMin 4: 200 m run',
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
          battlePlan: '• 4 rounds:\n\n12 bench dips\n15 air squats\n10 bench rows\n200 m run\n• 60–90s rest',
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
          battlePlan: '• 3 rounds:\n\n15 dips\n12 decline push-ups (feet on bench)\n12 bench jumps\n300 m run\n• 90s rest',
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
          battlePlan: '• 24 min alternating EMOM:\n\nOdd: 12 dips + 10 push-ups\nEven: 2x 50 m sprint (walk back)',
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
          battlePlan: '• 4 rounds:\n\n15 dips\n12 push-ups\n12 burpees\n200 m run\n• 60–90s rest',
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
          battlePlan: '• 2 laps easy jog\n• 2x40 m high knees (walk back)\n• 2x40 m A-skips (walk back)\n• 4x40 m relaxed strides (walk back)',
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
          battlePlan: '• 2 laps easy jog\n• 2x40 m bounds (walk back)\n• 2x40 m skips for height (walk back)\n• 4x60 m straights moderate (walk back)',
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
          battlePlan: '• 2 laps easy jog\n• 8–10x30 m sprints, full walk back',
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
          battlePlan: '• 2 laps easy jog\n• 2x100 m curves easy (straights walk)\n• 2x30 m high knees (walk back)\n• 4x40 m sprints (walk back)',
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
          battlePlan: '• 1 lap easy jog\n• 2x40 m A-skips\n• 2x40 m bounds\n• 4x150 m @ 3–5k effort, walk 150 m',
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
          battlePlan: '• 1 lap easy jog\n• 6x40 m fast, walk back\n• 6x30 m fast, walk back',
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
          battlePlan: '• 3 rounds:\n\n30 m high knees (walk back)\n30 m A-skips (walk back)\n30 m bounds (walk back)\n60 m stride',
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
          battlePlan: '• 8 laps: straights moderate-fast + curves easy jog',
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
          battlePlan: '• 8x40 m fast, full walk back\n• 6x60 m relaxed fast, walk back',
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
          battlePlan: '• 3 rounds:\n\n30 m high knees (walk back)\n30 m A-skips (walk back)\n30 m bounds (walk back)\n2x50 m sprints, walk back',
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
          battlePlan: '• 4x curve fly-in + 50 m fast, walk 200 m\n• 8x30 m sprints, full walk back',
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
          battlePlan: '• 3 sets:\n\n20 m fast, walk back\n30 m fast, walk back\n40 m fast, walk back\n• 2–3 min walk between sets',
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
