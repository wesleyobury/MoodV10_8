import { EquipmentWorkouts } from '../types/workout';

export const lazyFullBodyDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Push',
    icon: 'arrow-up',
    workouts: {
      beginner: [
        {
          name: 'Push Start',
          duration: '22–28 min',
          description: 'Leg press foundation, chest press next, core crunch close.',
          battlePlan: 'Leg Press (machine)\n• 3 × 10–12 (RPE 4), 60s rest\nMachine Chest Press\n• 3 × 8–10 (RPE 4), 60s rest\nCable Crunch (kneeling)\n• 3 × 12–15 (RPE 4), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241219/mood_app/workout_images/f8k0kcti_download.jpg',
          intensityReason: 'Simple machines pair leg and press lines with minimal setup.',
          moodTips: [
            {
              icon: 'body',
              title: 'Soft lockouts; heels planted',
              description: 'Avoid locking knees completely at the top of leg press; keep your heels firmly on the platform throughout'
            },
            {
              icon: 'leaf',
              title: 'Exhale on press and crunch',
              description: 'Breathe out during the effort phase of each movement to engage your core and maintain stability'
            }
          ]
        },
        {
          name: 'Vertical Push',
          duration: '22–28 min',
          description: 'Hack squats first, shoulder press next, anti-rotation core.',
          battlePlan: 'Hack Squat (machine)\n• 3 × 8–10 (RPE 4), 60s rest\nMachine Shoulder Press\n• 3 × 8–10 (RPE 4), 60s rest\nCable Anti-Rotation Hold or Dead Bug\n• 3 × 20–30s/side (RPE 4), 45s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241252/mood_app/workout_images/uwuwsltl_download_30_.jpg',
          intensityReason: 'Guided squats and overhead press reduce bracing demand.',
          moodTips: [
            {
              icon: 'body',
              title: 'Heels down on hack squat',
              description: 'Keep your heels firmly planted on the platform throughout the movement to target quads properly'
            },
            {
              icon: 'arrow-down',
              title: 'Ribs down on overhead press',
              description: 'Draw your ribcage down to prevent excessive lower back arching during shoulder press'
            }
          ]
        },
        {
          name: 'Smith Push',
          duration: '22–28 min',
          description: 'Smith back squat, Smith bench press, plank for bracing.',
          battlePlan: 'Smith Back Squat\n• 3 × 8–10 (RPE 4), 60–75s rest\nSmith Machine Bench Press\n• 3 × 8–10 (RPE 4), 60s rest\nFront Plank\n• 3 × 20–40s (RPE 4), 45s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241198/mood_app/workout_images/5a61mmh2_sms.jpg',
          intensityReason: 'Smith paths stabilize compound lines for safer control.',
          moodTips: [
            {
              icon: 'body',
              title: 'Brace light; tall torso',
              description: 'Engage your core lightly and maintain an upright torso throughout squats for proper form'
            },
            {
              icon: 'hand-right',
              title: 'Press: bar over mid-chest',
              description: 'Position the bar path to travel directly over your mid-chest for optimal pressing mechanics'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Press Lines',
          duration: '28–35 min',
          description: 'Leg press volume, chest press sets, cable crunch closer.',
          battlePlan: 'Leg Press (machine)\n• 4 × 10 (RPE 5), 60–75s rest\nMachine Chest Press\n• 4 × 8 (RPE 5), 60–75s rest\nCable Crunch (kneeling)\n• 3 × 12–15 (RPE 5), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241202/mood_app/workout_images/85rxong7_download_29_.jpg',
          intensityReason: 'Moderate compounds pair quads, chest, and stable core.',
          moodTips: [
            {
              icon: 'body',
              title: 'Track knee and elbow lines',
              description: 'Watch your joint alignment throughout each rep—knees track over toes, elbows at consistent angles'
            },
            {
              icon: 'time',
              title: 'Control 3s lowers each set',
              description: 'Use a slow 3-second lowering phase on each exercise to maximize muscle engagement and control'
            }
          ]
        },
        {
          name: 'Vertical Stack (Full Body Push)',
          duration: '28–35 min',
          description: 'Hack squats, shoulder press sequence, Pallof press core.',
          battlePlan: 'Hack Squat (machine)\n• 4 × 8 (RPE 5–6), 75s rest\nMachine Shoulder Press\n• 4 × 8 (RPE 5), 60–75s rest\nCable Pallof Press\n• 3 × 10–12/side (RPE 5), 45–60s rest',
          imageUrl: 'https://customer-assets.emergentagent.com/job_upper-body-enhance/artifacts/e0ct7tlh_hs.avif',
          intensityReason: 'Overhead work with hack squats balances systemic load.',
          moodTips: [
            {
              icon: 'body',
              title: 'Quiet knees; heels planted',
              description: 'Keep knees stable without wobbling and maintain heel contact with the platform at all times'
            },
            {
              icon: 'remove-circle',
              title: 'Don\'t arch on overhead work',
              description: 'Avoid excessive lower back arching during shoulder press by bracing your core and keeping ribs down'
            }
          ]
        },
        {
          name: 'Smith Lines (Push)',
          duration: '28–35 min',
          description: 'Smith squat series, Smith bench sets, hanging knees finish.',
          battlePlan: 'Smith Back Squat\n• 4 × 8 (RPE 5–6), 75s rest\nSmith Machine Bench Press\n• 4 × 8 (RPE 5), 60–75s rest\nHanging Knee Raise\n• 3 × 10–15 (RPE 5), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241196/mood_app/workout_images/3wkbxmxc_download.jpg',
          intensityReason: 'Smith guidance reduces balance while loading safely heavy.',
          moodTips: [
            {
              icon: 'body',
              title: 'Brace; ribs stacked neutral',
              description: 'Engage your core lightly and stack your ribcage over your pelvis for proper spinal alignment'
            },
            {
              icon: 'time',
              title: 'Smooth 2–1–3 cadence',
              description: 'Use a tempo of 2 seconds up, 1 second pause, and 3 seconds down for optimal control'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Push Drop',
          duration: '35–42 min',
          description: 'Leg press plus chest press drops, then controlled abs.',
          battlePlan: 'Leg Press (machine)\n• 1 × 8 heavy (RPE 7) → drop 15% → 1 × 8 (RPE 6) → drop 15% → 1 × 8 (RPE 6)\n• Rest 90s; repeat for 2–3 total series\nMachine Chest Press\n• 1 × 6–8 heavy (RPE 7) → drop 15% → 1 × 6–8 (RPE 6)\nCable Crunch (kneeling)\n• 3 × 12–15 (RPE 6), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241219/mood_app/workout_images/f8k0kcti_download.jpg',
          intensityReason: 'Drop-set presses expand work capacity without complexity.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drop ~15% swiftly',
              description: 'Reduce the weight by approximately 15% quickly between drop sets to maintain intensity and momentum'
            },
            {
              icon: 'remove-circle',
              title: 'Brace hard; don\'t bounce',
              description: 'Keep your core tight throughout and avoid bouncing at the bottom of movements for safety'
            }
          ]
        },
        {
          name: 'Cluster Push',
          duration: '35–42 min',
          description: 'Hack clusters, Smith bench clusters, chops for core.',
          battlePlan: 'Hack Squat (machine)\n• 3 clusters: 3 + 3 + 3 (15s between), 90s between clusters\nSmith Machine Bench Press\n• 3 clusters: 3 + 3 + 3 (15s between), 90s between clusters\nHigh-to-Low Cable Chop\n• 3 × 8–10/side (RPE 6), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241215/mood_app/workout_images/clw7t7y4_smbp.jpg',
          intensityReason: 'Cluster sets keep power high while posture stays crisp.',
          moodTips: [
            {
              icon: 'leaf',
              title: '15s breaths inside sets',
              description: 'Use the 15-second mini-rests to take 2-3 deep breaths and reset your focus before continuing'
            },
            {
              icon: 'barbell',
              title: 'Same load within cluster',
              description: 'Keep the weight constant throughout all mini-sets within each cluster for consistent stimulus'
            }
          ]
        },
        {
          name: 'Midrange Push',
          duration: '35–42 min',
          description: 'Cable goblet 1.5s, incline fly 1.5s, anti-rotation hold.',
          battlePlan: 'Cable Goblet Squat (1.5 reps)\n• 3 × 8–10 (RPE 6), 60–75s rest\nIncline Cable Fly (1.5 reps)\n• 3 × 8–10 (RPE 6), 60–75s rest\nCable Anti-Rotation Hold\n• 3 × 25–35s/side (RPE 6), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241248/mood_app/workout_images/rvk5my8t_cgs.jpg',
          intensityReason: '1.5 reps add time under tension at manageable loads.',
          moodTips: [
            {
              icon: 'time',
              title: '1s squeeze at peak',
              description: 'Hold a 1-second squeeze at the peak contraction of each rep to maximize muscle engagement'
            },
            {
              icon: 'time',
              title: 'Control 3s returns',
              description: 'Lower the weight slowly over 3 seconds to increase time under tension and build strength'
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
          name: 'Pull Start',
          duration: '22–28 min',
          description: 'Seated curls or RDL, row machine, core with Pallof.',
          battlePlan: 'Smith RDL or Seated Leg Curl (machine)\n• 3 × 10 (RPE 4), 60s rest\nSeated Row (neutral)\n• 3 × 8–10 (RPE 4), 60s rest\nCable Pallof Press\n• 3 × 10–12/side (RPE 4), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241223/mood_app/workout_images/gs71guo5_download_5_.jpg',
          intensityReason: 'Machines pair hinge and pull lines with minimal setup.',
          moodTips: [
            {
              icon: 'body',
              title: 'Push hips back on hinge',
              description: 'Initiate the RDL movement by pushing your hips backward while keeping your spine neutral and shoulders back'
            },
            {
              icon: 'arrow-down',
              title: 'Elbows drive back on row',
              description: 'Focus on driving your elbows straight back during rows rather than shrugging or pulling upward'
            }
          ]
        },
        {
          name: 'Vertical Pull',
          duration: '22–28 min',
          description: '45° back extension, pulldown, dead bug or cable core.',
          battlePlan: '45° Back Extension (machine)\n• 3 × 10–12 (RPE 4), 60s rest\nLat Pulldown\n• 3 × 8–10 (RPE 4), 60s rest\nDead Bug or Cable Anti-Rotation Hold\n• 3 × 20–30s/side (RPE 4), 45s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241225/mood_app/workout_images/gwy2em83_download_34_.jpg',
          intensityReason: 'Supported hinge plus vertical pull reduce bracing.',
          moodTips: [
            {
              icon: 'body',
              title: 'Neutral neck on hinges',
              description: 'Keep your neck in line with your spine during back extensions—avoid looking up or tucking your chin'
            },
            {
              icon: 'body',
              title: 'Tall chest on pulldown',
              description: 'Maintain an upright chest position during pulldowns; slight lean back is okay but avoid excessive arching'
            }
          ]
        },
        {
          name: 'Cable Pull',
          duration: '22–28 min',
          description: 'Pull-throughs, high cable row, crunches to complete.',
          battlePlan: 'Cable Pull-Through\n• 3 × 10–12 (RPE 4), 60s rest\nHigh Cable Row\n• 3 × 10 (RPE 4), 60s rest\nCable Crunch (kneeling)\n• 3 × 12–15 (RPE 4), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241193/mood_app/workout_images/1tdr3nmt_download_4_.jpg',
          intensityReason: 'Cable pull-through and rows guide motion with ease.',
          moodTips: [
            {
              icon: 'body',
              title: 'Hips back; shins quiet',
              description: 'Push your hips back during pull-throughs while keeping your shins vertical—don\'t let knees drift forward'
            },
            {
              icon: 'arrow-down',
              title: 'Ribs down on crunch sets',
              description: 'Draw your ribcage down toward your pelvis during crunches to fully engage your abs'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Hinge Lines',
          duration: '28–35 min',
          description: 'Smith RDLs, seated rows, anti-rotation core to finish.',
          battlePlan: 'Smith RDL\n• 4 × 8 (RPE 5–6), 75s rest\nSeated Row (neutral)\n• 4 × 8 (RPE 5), 60–75s rest\nCable Anti-Rotation Hold\n• 3 × 25–35s/side (RPE 5), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241255/mood_app/workout_images/wayclwit_download_33_.jpg',
          intensityReason: 'Moderate hinge with rows builds pull chain efficiently.',
          moodTips: [
            {
              icon: 'body',
              title: 'Bar tracks thighs; brace',
              description: 'Keep the bar path close to your thighs throughout the RDL movement while maintaining a braced core'
            },
            {
              icon: 'time',
              title: 'Smooth 3s eccentrics',
              description: 'Control the lowering phase over 3 seconds on each exercise to maximize muscle tension and growth'
            }
          ]
        },
        {
          name: 'Vertical Lines',
          duration: '28–35 min',
          description: 'Machine back extensions, pulldowns, cable crunch sets.',
          battlePlan: 'Back Extension (machine)\n• 4 × 10 (RPE 5), 60–75s rest\nLat Pulldown\n• 4 × 8 (RPE 5), 60–75s rest\nCable Crunch (kneeling)\n• 3 × 12–15 (RPE 5), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241225/mood_app/workout_images/gwy2em83_download_34_.jpg',
          intensityReason: 'Back extension pairs with pulldown for balanced pull.',
          moodTips: [
            {
              icon: 'body',
              title: 'Extend to neutral only',
              description: 'During back extensions, raise your torso only to neutral spine alignment—don\'t hyperextend'
            },
            {
              icon: 'arrow-down',
              title: 'Drive elbows down on pulls',
              description: 'Think about driving your elbows down toward your hips during pulldowns for optimal lat engagement'
            }
          ]
        },
        {
          name: 'Cable Lines',
          duration: '28–35 min',
          description: 'Pull-through volume, high rows, chops for anti-rotation.',
          battlePlan: 'Cable Pull-Through\n• 4 × 10 (RPE 5), 60–75s rest\nHigh Cable Row\n• 4 × 8–10 (RPE 5), 60–75s rest\nLow-to-High Cable Chop\n• 3 × 8–10/side (RPE 5), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241193/mood_app/workout_images/1tdr3nmt_download_4_.jpg',
          intensityReason: 'Cable hinge and rows add control with low setup needs.',
          moodTips: [
            {
              icon: 'body',
              title: 'Hips back; neutral spine',
              description: 'Push hips back while maintaining a flat neutral spine throughout the pull-through movement'
            },
            {
              icon: 'refresh',
              title: 'Chop: rotate from ribs',
              description: 'During cable chops, initiate rotation from your ribcage while keeping your hips relatively stable'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Pull Drop',
          duration: '35–42 min',
          description: 'Curl or pulldown drops, rows next, core bracing finish.',
          battlePlan: 'Seated Leg Curl (machine) or Lat Pulldown\n• 1 × 8–10 heavy (RPE 7) → drop 15% → 1 × 8–10 (RPE 6)\n• Rest 90s; repeat for 2–3 total series\nSeated Row\n• 3 × 8–10 (RPE 6), 60–75s rest\nCable Pallof Press\n• 3 × 10–12/side (RPE 6), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241246/mood_app/workout_images/rdlmprvh_download_19_.jpg',
          intensityReason: 'Drop sets extend tension without complex technique.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Swift pin moves between',
              description: 'Change the weight pin quickly between drop sets to minimize rest and maintain muscle fatigue'
            },
            {
              icon: 'remove-circle',
              title: 'Avoid torso heave on rows',
              description: 'Keep your torso stable during rows—don\'t rock back and forth to cheat the weight up'
            }
          ]
        },
        {
          name: 'Cluster Pull',
          duration: '35–42 min',
          description: 'Smith RDL clusters, chest-supported row, cable chops.',
          battlePlan: 'Smith RDL\n• 3 clusters: 3 + 3 + 3 (15s between), 90s between clusters\nChest-Supported Row Machine\n• 3 × 8–10 (RPE 6), 60–75s rest\nHigh-to-Low Cable Chop\n• 3 × 8–10/side (RPE 6), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241191/mood_app/workout_images/0wssum58_Screenshot_2025-12-04_at_12_00_14_AM.jpg',
          intensityReason: 'Clusters preserve output while scap control stays crisp.',
          moodTips: [
            {
              icon: 'leaf',
              title: '15s breaths in clusters',
              description: 'Use the 15-second mini-rests to take deep breaths and reset your focus before the next mini-set'
            },
            {
              icon: 'body',
              title: 'Chest glued to pad on rows',
              description: 'Keep your chest firmly pressed against the pad during chest-supported rows to isolate your back muscles'
            }
          ]
        },
        {
          name: 'Midrange Pull (Full Body)',
          duration: '35–42 min',
          description: 'Back extension 1.5s, high rows, anti-rotation hold close.',
          battlePlan: 'Back Extension (1.5 reps, machine)\n• 3 × 8–10 (RPE 6), 60–75s rest\nHigh Cable Row\n• 3 × 8–10 (RPE 6), 60–75s rest\nCable Anti-Rotation Hold\n• 3 × 25–35s/side (RPE 6), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241262/mood_app/workout_images/zpva3a7u_download_1_.jpg',
          intensityReason: '1.5 reps add time under tension using controlled loads.',
          moodTips: [
            {
              icon: 'time',
              title: '1s squeeze; 3s return',
              description: 'Hold a 1-second squeeze at the top of each rep, then take 3 seconds to lower for maximum tension'
            },
            {
              icon: 'body',
              title: 'Keep hips square on holds',
              description: 'During anti-rotation holds, keep your hips facing forward and resist the cable\'s pull to rotate'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Full Body',
    icon: 'fitness',
    workouts: {
      beginner: [
        {
          name: 'Simple Body',
          duration: '25–32 min',
          description: 'Leg press, chest press, row machine, Pallof core finish.',
          battlePlan: 'Leg Press (machine)\n• 3 × 10–12 (RPE 4), 60s rest\nMachine Chest Press\n• 3 × 8–10 (RPE 4), 60s rest\nSeated Row (neutral)\n• 3 × 8–10 (RPE 4), 60s rest\nCable Pallof Press\n• 3 × 10–12/side (RPE 4), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241254/mood_app/workout_images/v9n7t5ul_download_31_.jpg',
          intensityReason: 'Machines guide compound lines with very simple setup.',
          moodTips: [
            {
              icon: 'settings',
              title: 'Note seat/bar settings',
              description: 'Record your machine settings to ensure consistent positioning and reduce setup time next session'
            },
            {
              icon: 'time',
              title: 'Smooth 2–1–3 tempo',
              description: 'Use a controlled tempo: 2 seconds lifting, 1 second pause, 3 seconds lowering for optimal muscle engagement'
            }
          ]
        },
        {
          name: 'Vertical Body',
          duration: '25–32 min',
          description: 'Hack squat, shoulder press, pulldown, anti-rotation core.',
          battlePlan: 'Hack Squat (machine)\n• 3 × 8–10 (RPE 4), 60s rest\nMachine Shoulder Press\n• 3 × 8–10 (RPE 4), 60s rest\nLat Pulldown\n• 3 × 8–10 (RPE 4), 60s rest\nCable Anti-Rotation Hold\n• 3 × 20–30s/side (RPE 4), 45s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241217/mood_app/workout_images/e65l9jkf_download_34_.jpg',
          intensityReason: 'Vertical push and pull anchor guided lower and core.',
          moodTips: [
            {
              icon: 'body',
              title: 'Heels down on hack',
              description: 'Keep your heels firmly planted on the platform throughout the hack squat to properly target your quads'
            },
            {
              icon: 'remove-circle',
              title: 'Don\'t arch on press',
              description: 'Avoid excessive lower back arching during shoulder press by engaging your core and keeping ribs down'
            }
          ]
        },
        {
          name: 'Cable Body',
          duration: '25–32 min',
          description: 'Cable goblet squat, chest press, high row, cable chops.',
          battlePlan: 'Cable Goblet Squat (low cable)\n• 3 × 10–12 (RPE 4), 60s rest\nCable Chest Press\n• 3 × 10 (RPE 4), 60s rest\nHigh Cable Row\n• 3 × 10 (RPE 4), 60s rest\nHigh-to-Low Cable Chop\n• 3 × 8–10/side (RPE 4), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241227/mood_app/workout_images/ivpc3qvz_cgs.jpg',
          intensityReason: 'Cable squat, press, and row reduce bracing demands.',
          moodTips: [
            {
              icon: 'body',
              title: 'Ribs stacked over hips',
              description: 'Maintain a neutral spine by keeping your ribcage aligned directly over your pelvis throughout each movement'
            },
            {
              icon: 'expand',
              title: 'Own small ranges calmly',
              description: 'Focus on controlling a comfortable range of motion—quality reps matter more than depth when starting out'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Balanced Body',
          duration: '32–40 min',
          description: 'Leg press, chest press, seated row, overhead Pallof.',
          battlePlan: 'Leg Press (machine)\n• 4 × 10 (RPE 5), 60–75s rest\nMachine Chest Press\n• 4 × 8 (RPE 5), 60–75s rest\nSeated Row (neutral)\n• 4 × 8 (RPE 5), 60–75s rest\nCable Overhead Pallof\n• 3 × 10–12/side (RPE 5), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241247/mood_app/workout_images/re7tjas0_download_33_.jpg',
          intensityReason: 'Moderate compound volume across legs, push, and pull.',
          moodTips: [
            {
              icon: 'body',
              title: 'Track knee and elbow lines',
              description: 'Monitor your joint alignment—knees should track over toes on leg press, elbows at consistent angles on presses'
            },
            {
              icon: 'time',
              title: 'Control eccentrics 3s',
              description: 'Use a controlled 3-second lowering phase on all exercises to maximize muscle engagement and growth'
            }
          ]
        },
        {
          name: 'Vertical Lines (Mix)',
          duration: '32–40 min',
          description: 'Hack squat, shoulder press, pulldown series, core hold.',
          battlePlan: 'Hack Squat (machine)\n• 4 × 8 (RPE 5–6), 75s rest\nMachine Shoulder Press\n• 4 × 8 (RPE 5), 60–75s rest\nLat Pulldown\n• 4 × 8 (RPE 5), 60–75s rest\nCable Anti-Rotation Hold\n• 3 × 25–35s/side (RPE 5), 45–60s rest',
          imageUrl: 'https://customer-assets.emergentagent.com/job_upper-body-enhance/artifacts/hmkic4v7_hs.avif',
          intensityReason: 'Vertical pairs build balanced output with simple cues.',
          moodTips: [
            {
              icon: 'body',
              title: 'Heels planted; quiet knees',
              description: 'Keep heels firmly on the platform and avoid any knee wobbling during hack squats for proper quad engagement'
            },
            {
              icon: 'body',
              title: 'Tall chest on pulldown',
              description: 'Maintain an upright, proud chest position during pulldowns to maximize lat activation and minimize shoulder strain'
            }
          ]
        },
        {
          name: 'Smith Lines (Mix)',
          duration: '32–40 min',
          description: 'Smith squat, Smith bench, row machine, cable chops.',
          battlePlan: 'Smith Back Squat\n• 4 × 8 (RPE 5–6), 75s rest\nSmith Machine Bench Press\n• 4 × 8 (RPE 5), 60–75s rest\nChest-Supported Row Machine\n• 3 × 8–10 (RPE 5), 60–75s rest\nLow-to-High Cable Chop\n• 3 × 8–10/side (RPE 5), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241250/mood_app/workout_images/uazsquaz_download_8_.jpg',
          intensityReason: 'Smith guidance allows heavier compounds with control.',
          moodTips: [
            {
              icon: 'body',
              title: 'Brace light; ribs stacked',
              description: 'Engage your core gently and keep your ribcage aligned over your pelvis for proper spinal positioning'
            },
            {
              icon: 'leaf',
              title: 'Exhale on effort segments',
              description: 'Breathe out during the pushing or pulling phase of each exercise to maintain core stability and control'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Drop Body',
          duration: '40–50 min',
          description: 'Leg press drop, chest press drop, rows, Pallof finish.',
          battlePlan: 'Leg Press (machine)\n• 1 × 8 heavy (RPE 7) → drop 15% → 1 × 8 (RPE 6) → drop 15% → 1 × 8 (RPE 6)\n• Rest 90s; repeat for 2–3 total series\nMachine Chest Press\n• 1 × 6–8 heavy (RPE 7) → drop 15% → 1 × 6–8 (RPE 6)\nSeated Row (neutral)\n• 3 × 8–10 (RPE 6), 60–75s rest\nCable Pallof Press\n• 3 × 10–12/side (RPE 6), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241261/mood_app/workout_images/zpkugltm_download.jpg',
          intensityReason: 'Drop sets scale volume across lifts without complexity.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Swift pin changes',
              description: 'Move quickly between drop sets by changing the weight pin efficiently to maintain muscle fatigue'
            },
            {
              icon: 'time',
              title: 'Keep tempo consistent',
              description: 'Maintain the same controlled tempo throughout all drop set portions for consistent muscle stimulus'
            }
          ]
        },
        {
          name: 'Cluster Body',
          duration: '40–50 min',
          description: 'Hack clusters, Smith bench clusters, rows, cable chops.',
          battlePlan: 'Hack Squat (machine)\n• 3 clusters: 3 + 3 + 3 (15s between), 90s between clusters\nSmith Machine Bench Press\n• 3 clusters: 3 + 3 + 3 (15s between), 90s between clusters\nHigh Cable Row\n• 3 × 8–10 (RPE 6), 60–75s rest\nHigh-to-Low Cable Chop\n• 3 × 8–10/side (RPE 6), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241260/mood_app/workout_images/zjzedsvc_download_8_.jpg',
          intensityReason: 'Clusters maintain power while form remains reliable.',
          moodTips: [
            {
              icon: 'leaf',
              title: '15s rests in clusters',
              description: 'Use the brief 15-second mini-rests to take 2-3 deep breaths and reset your focus before continuing'
            },
            {
              icon: 'barbell',
              title: 'Same load within cluster',
              description: 'Keep the weight constant throughout all mini-sets within each cluster for consistent training stimulus'
            }
          ]
        },
        {
          name: 'Midrange Body',
          duration: '40–50 min',
          description: 'Goblet 1.5s, cable fly 1.5s, high rows, overhead Pallof.',
          battlePlan: 'Cable Goblet Squat (1.5 reps)\n• 3 × 8–10 (RPE 6), 60–75s rest\nCable Fly (1.5 reps)\n• 3 × 8–10 (RPE 6), 60–75s rest\nHigh Cable Row\n• 3 × 8–10 (RPE 6), 60–75s rest\nCable Overhead Pallof\n• 3 × 10–12/side (RPE 6), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241203/mood_app/workout_images/8uykic1g_download_2_.jpg',
          intensityReason: '1.5 reps add tension at manageable loads across lifts.',
          moodTips: [
            {
              icon: 'time',
              title: '1s squeeze at peak',
              description: 'Hold a 1-second squeeze at the peak contraction of each rep to maximize muscle engagement and tension'
            },
            {
              icon: 'time',
              title: 'Control 3s returns',
              description: 'Lower the weight slowly over 3 seconds during 1.5 reps to increase time under tension and build strength'
            }
          ]
        }
      ]
    }
  }
];
