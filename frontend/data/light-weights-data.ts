import { EquipmentWorkouts } from '../types/workout';

// Light weights workout database for "Sweat / burn fat > Light weights" path
export const lightWeightsDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Dumbbells',
    icon: 'fitness',
    workouts: {
      beginner: [
        {
          name: 'Cardio Circuit',
          duration: '16–18 min',
          description: 'Four 4‑min rounds: squats, lunges, push press, programmed rest.',
          battlePlan: 'Perform 4 rounds (4 min each):\n• 30s Goblet Squat\n• 30s Alternating Reverse Lunge\n• 30s Push Press\n• 30s Rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240916/mood_app/workout_images/xgk4blng_download_2_.jpg',
          intensityReason: 'Intervals raise HR while preserving form and control.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Chest tall; knees track toes',
              description: 'Maintain upright posture and proper knee alignment over feet'
            },
            {
              icon: 'fitness',
              title: 'Exhale hard on push press',
              description: 'Use a forceful exhale to brace core during the pressing motion'
            }
          ]
        },
        {
          name: 'Flow',
          duration: '15–18 min',
          description: 'Three rounds: squat‑to‑press, light snatch, rows, steady rest.',
          battlePlan: 'Perform 3 rounds:\n• 8 Squat to Press\n• 8 Alternating Snatch (light)\n• 8 Bent-Over Row\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240860/mood_app/workout_images/0x3bwc7i_download_1_.jpg',
          intensityReason: 'Continuous flow maintains pace with minimal setup time.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Neutral spine on rows',
              description: 'Keep back flat and hinge from hips during rowing movements'
            },
            {
              icon: 'refresh',
              title: 'Keep transitions smooth',
              description: 'Flow between exercises without rushing or losing control'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Complex',
          duration: '28–30 min',
          description: 'Four rounds of sixes: hinge, clean, squat, press, lunge, rest.',
          battlePlan: 'Perform 4 rounds (no rest between moves):\n• 6 Deadlifts\n• 6 Hang Cleans\n• 6 Front Squats\n• 6 Push Presses\n• 6 Reverse Lunges\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240890/mood_app/workout_images/guxsbtyu_download_3_.jpg',
          intensityReason: 'Full‑body complex sustains output with limited resting.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Reset stance and grip each move',
              description: 'Take a brief moment to set proper position between exercises'
            },
            {
              icon: 'flash',
              title: 'Exhale sharply on push press',
              description: 'Power the press with an explosive breath to drive the weight'
            }
          ]
        },
        {
          name: 'EMOM 12',
          duration: '12 min',
          description: 'Odd: thrusters; Even: renegade rows; sustain steady pace.',
          battlePlan: 'For 12 minutes (alternating each minute):\n• Odd min: 10 Dumbbell Thrusters\n• Even min: 12 Alternating Renegade Rows',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240865/mood_app/workout_images/7dkvjash_download_6_.jpg',
          intensityReason: 'Alternating minutes build cadence, repeatable intensity.',
          role: 'finisher',
          intensity_cost: 4,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'flash',
              title: 'Thrusters: drive with hips',
              description: 'Use explosive hip extension to power the weight overhead'
            },
            {
              icon: 'body',
              title: 'Rows: keep hips square',
              description: 'Prevent rotation by bracing core and keeping hips level'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Ladder',
          duration: '20–24 min',
          description: 'Five sets 10–2: squat clean, push press, burpee over DB.',
          battlePlan: 'Perform ladder 10–8–6–4–2 reps:\n• Squat Clean\n• Push Press\n• Burpee Over Dumbbell\n• Rest as needed to finish',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241081/mood_app/workout_images/uz466s67_download_5_.jpg',
          intensityReason: 'Descending reps sustain power under mounting fatigue.',
          role: 'main_block',
          intensity_cost: 5,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Catch DBs close to shoulders',
              description: 'Receive dumbbells in rack position against your shoulders'
            },
            {
              icon: 'fitness',
              title: 'Land burpees soft and stacked',
              description: 'Absorb landing with bent knees and aligned body'
            }
          ]
        },
        {
          name: 'AMRAP 15',
          duration: '15 min',
          description: 'Loop snatches, jump squats, push‑up rows, reverse lunges.',
          battlePlan: 'As many rounds as possible in 15 min:\n• 10 Alternating Snatches\n• 10 Goblet Jump Squats\n• 10 Push-Up to Row (5/side)\n• 10 Alternating Reverse Lunges (holding DBs)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240909/mood_app/workout_images/u48z26jq_download_8_.jpg',
          intensityReason: 'Fixed clock drives density while encouraging smooth flow.',
          role: 'finisher',
          intensity_cost: 5,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'flash',
              title: 'Snatch from hips, lockout clean',
              description: 'Drive power from hips and finish with full arm extension'
            },
            {
              icon: 'fitness',
              title: 'Land jump squats softly',
              description: 'Absorb impact through bent knees to protect joints'
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
          name: 'Swing And Carry',
          duration: '15–18 min',
          description: 'Five rounds: short swings, longer carries, planned recovery.',
          battlePlan: 'Perform 5 rounds:\n• 20s Kettlebell Swings\n• 40s Farmer\'s Carry\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241381/mood_app/workout_images/sn9i3ng0_download_1_.jpg',
          intensityReason: 'Hinge bursts plus carries elevate HR with safe loading.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Hinge; snap hips on swings',
              description: 'Power the movement from hip thrust, not arms'
            },
            {
              icon: 'walk',
              title: 'Shoulders back on carries',
              description: 'Keep shoulder blades retracted during farmer walks'
            }
          ]
        },
        {
          name: 'Cardio Flow',
          duration: '12–15 min',
          description: 'Three rounds: goblet squats, swings, presses, one‑minute rest.',
          battlePlan: 'Perform 3 rounds:\n• 8 Goblet Squats\n• 8 Single-Arm Swings (each side)\n• 8 Overhead Presses (each side)\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240864/mood_app/workout_images/6gvgn2e8_download.jpg',
          intensityReason: 'Simple sequence builds rhythm and steady conditioning.',
          role: 'main_block',
          intensity_cost: 2,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Elbows tucked on presses',
              description: 'Keep elbows at 45 degrees to protect shoulders'
            },
            {
              icon: 'flash',
              title: 'Control swing arc; no yank',
              description: 'Let the bell float at top without jerky motions'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Ladder (KB)',
          duration: '20–24 min',
          description: 'Four rounds: swings, cleans, snatches, squats, push presses.',
          battlePlan: 'Perform 4 rounds:\n• 10 Swings\n• 8 Cleans (4/side)\n• 6 Snatches (3/side)\n• 4 Goblet Squats\n• 2 Push Presses (each side)\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240914/mood_app/workout_images/x797b7x6_download_7_.jpg',
          intensityReason: 'Mixed rep ladder balances power, skill, and position.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Rotate wrist under on cleans',
              description: 'Turn wrist under the bell as you catch it'
            },
            {
              icon: 'flash',
              title: 'Exhale at top of snatch/press',
              description: 'Breathe out forcefully at lockout for core stability'
            }
          ]
        },
        {
          name: 'Tabata',
          duration: '16 min',
          description: 'Four moves cycled Tabata‑style for sixteen total intervals.',
          battlePlan: '20s work / 10s rest, cycle through:\n• Swings\n• Goblet Squats\n• Alternating Lunges\n• High Pulls\nRepeat 4 rounds (16 intervals total).',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241371/mood_app/workout_images/9cotsg82_download.jpg',
          intensityReason: 'Timed sprints maximize output with controlled recovery.',
          role: 'finisher',
          intensity_cost: 4,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Neutral spine when fatigued',
              description: 'Prioritize back position over speed when tired'
            },
            {
              icon: 'fitness',
              title: 'Drive legs on squats/lunges',
              description: 'Push through floor with leg power, not momentum'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Complex (KB)',
          duration: '25–26 min',
          description: 'Five rounds, six per side: swing, clean, squat, press, snatch.',
          battlePlan: 'Perform 5 rounds (6 reps each, per side, no rest between moves):\n• Swing\n• Clean\n• Front Squat\n• Push Press\n• Snatch\n• Rest 1 min between rounds',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240914/mood_app/workout_images/x797b7x6_download_7_.jpg',
          intensityReason: 'Continuous complex taxes full chain with minimal rest.',
          role: 'main_block',
          intensity_cost: 5,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Flow positions smoothly',
              description: 'Transition between movements with control and rhythm'
            },
            {
              icon: 'body',
              title: 'Keep bell close; core on',
              description: 'Hold the kettlebell tight to your body with engaged core'
            }
          ]
        },
        {
          name: 'AMRAP 15 (KB)',
          duration: '15 min',
          description: 'Double swings, alternating snatches, jump squats, TGUs.',
          battlePlan: 'As many rounds as possible in 15 min:\n• 10 Double Swings\n• 8 Alternating Snatches\n• 6 Goblet Squat Jumps\n• 4 Turkish Get-Ups (2/side)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240877/mood_app/workout_images/c1v64uta_download_9_.jpg',
          intensityReason: 'Timed density pushes pace while preserving crisp form.',
          role: 'finisher',
          intensity_cost: 5,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'flash',
              title: 'Double swings: engage lats',
              description: 'Pull shoulders back to protect spine during swings'
            },
            {
              icon: 'walk',
              title: 'TGU: stack joints; move slow',
              description: 'Align joints vertically and move through each phase deliberately'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Barbells',
    icon: 'barbell',
    workouts: {
      beginner: [
        {
          name: 'Metcon',
          duration: '12–15 min',
          description: 'Three rounds: deadlifts, front squats, push press, rest.',
          battlePlan: 'Perform 3 rounds (light weight):\n• 8 Deadlifts\n• 8 Front Squats\n• 8 Push Presses\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240866/mood_app/workout_images/7trsgls6_download_4_.jpg',
          intensityReason: 'Light loads cycle quickly for safe cardio emphasis.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Deadlift: bar close, hinge hips',
              description: 'Keep bar against shins and drive from hip hinge'
            },
            {
              icon: 'fitness',
              title: 'Front squat: elbows tall',
              description: 'Keep elbows high to maintain rack position'
            }
          ]
        },
        {
          name: 'Cardio Flow (BB)',
          duration: '14–16 min',
          description: 'Three rounds: cleans, presses, back squats, rows, rest.',
          battlePlan: 'Perform 3 rounds:\n• 6 Hang Cleans\n• 6 Push Presses\n• 6 Back Squats\n• 6 Bent-Over Rows\n• Rest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241370/mood_app/workout_images/2tl6mdrg_download.jpg',
          intensityReason: 'Linked barbell lifts maintain tempo and breathing.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Clean: tall chest on catch',
              description: 'Stay upright when receiving the bar in front rack'
            },
            {
              icon: 'hand-right',
              title: 'Row: flat back; elbows to ribs',
              description: 'Maintain neutral spine and pull elbows toward body'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Complex (BB)',
          duration: '28–30 min',
          description: 'Four rounds of fives across six classic barbell patterns.',
          battlePlan: 'Perform 4 rounds (no rest between moves):\n• 5 Deadlifts\n• 5 Hang Power Cleans\n• 5 Front Squats\n• 5 Push Presses\n• 5 Back Squats\n• 5 Bent-Over Rows\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241372/mood_app/workout_images/aw3s2ke8_download_1_.jpg',
          intensityReason: 'Full‑chain complex sustains output with minimal rest.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Use hook grip to reduce fatigue',
              description: 'Wrap thumb under fingers for secure barbell grip'
            },
            {
              icon: 'flash',
              title: 'Exhale hard on presses, squats',
              description: 'Use forceful exhale to brace core during effort'
            }
          ]
        },
        {
          name: 'EMOM 12 (BB)',
          duration: '12 min',
          description: 'Odd minutes thrusters; even minutes sumo high pulls.',
          battlePlan: 'For 12 minutes (alternating each minute):\n• Odd min: 8 Thrusters\n• Even min: 10 Sumo Deadlift High Pulls',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241370/mood_app/workout_images/2tl6mdrg_download.jpg',
          intensityReason: 'Alternating minutes sharpen cadence and repeatability.',
          role: 'finisher',
          intensity_cost: 4,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Thrusters: rebound into press',
              description: 'Use squat momentum to power the overhead press'
            },
            {
              icon: 'trending-up',
              title: 'High pulls: elbows high, bar close',
              description: 'Lead with elbows and keep bar traveling close to body'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Ladder (BB)',
          duration: '20–24 min',
          description: '10–2 reps: power clean, push jerk, front squat, burpees.',
          battlePlan: 'Perform 10–8–6–4–2 reps:\n• Power Clean\n• Push Jerk\n• Front Squat\n• Burpee Over Bar\n• Rest as needed to finish',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240893/mood_app/workout_images/k0r2xgj4_download_10_.jpg',
          intensityReason: 'Descending ladder sustains power as fatigue rises.',
          role: 'main_block',
          intensity_cost: 5,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Clean: catch low, chest tall',
              description: 'Receive the bar in a deep position with upright torso'
            },
            {
              icon: 'fitness',
              title: 'Burpees: efficient footwork',
              description: 'Minimize steps and jump directly over the bar'
            }
          ]
        },
        {
          name: 'AMRAP 15 (BB)',
          duration: '15 min',
          description: 'Continuous sixes of deads, cleans, presses, squats, burpees.',
          battlePlan: 'As many rounds as possible in 15 min:\n• 6 Deadlifts\n• 6 Hang Cleans\n• 6 Push Presses\n• 6 Back Squats\n• 6 Bar-Facing Burpees',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241370/mood_app/workout_images/2tl6mdrg_download.jpg',
          intensityReason: 'Fixed window promotes smooth cycling and steady pace.',
          role: 'finisher',
          intensity_cost: 5,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Keep bar path consistent',
              description: 'Maintain straight vertical bar path for efficiency'
            },
            {
              icon: 'fitness',
              title: 'Breathe steady on burpees',
              description: 'Establish breathing rhythm to manage heart rate'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Medicine Balls',
    icon: 'basketball',
    workouts: {
      beginner: [
        {
          name: 'Cardio Circuit (Med Ball)',
          duration: '12–16 min',
          description: 'Three rounds: wall balls, slams, twists, one‑minute rest.',
          battlePlan: 'Perform 3 rounds:\n• 10 Wall Balls\n• 10 Slams\n• 10 Russian Twists (each side)\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241373/mood_app/workout_images/cu85n2we_download_1_.jpg',
          intensityReason: 'Short sets build rhythm and raise HR with control.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Wall balls: chest tall',
              description: 'Keep torso upright throughout squat and throw phases'
            },
            {
              icon: 'flash',
              title: 'Slams: hinge; hips drive',
              description: 'Generate power from hip snap, not just arms'
            }
          ]
        },
        {
          name: 'Flow (Med Ball)',
          duration: '12–15 min',
          description: 'Three rounds: chest pass, overhead throw, squat press.',
          battlePlan: 'Perform 3 rounds:\n• 8 Chest Passes (against wall)\n• 8 Overhead Throws\n• 8 Squat-to-Press\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241384/mood_app/workout_images/vv8j4fll_download.jpg',
          intensityReason: 'Linked throws and presses train drive and timing.',
          role: 'main_block',
          intensity_cost: 2,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Chest pass: engage pecs',
              description: 'Drive force from chest muscles for powerful throws'
            },
            {
              icon: 'trending-up',
              title: 'Overhead: legs drive up',
              description: 'Use leg power to launch ball overhead explosively'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'AMRAP 10',
          duration: '10–12 min',
          description: 'Ten‑minute loop: wall balls, slams, overhead lunges.',
          battlePlan: 'As many rounds as possible in 10 min:\n• 10 Wall Balls\n• 10 Ball Slams\n• 10 Lunges (ball overhead)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241373/mood_app/workout_images/cu85n2we_download_1_.jpg',
          intensityReason: 'Short AMRAP encourages pace and crisp technique.',
          role: 'finisher',
          intensity_cost: 4,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Lock elbows on overhead lunges',
              description: 'Keep arms fully extended to stabilize ball overhead'
            },
            {
              icon: 'flash',
              title: 'Exhale sharply on slams',
              description: 'Use explosive breath to power ball into ground'
            }
          ]
        },
        {
          name: 'Tabata (Med Ball)',
          duration: '16 min',
          description: 'Four‑movement Tabata repeated for sixteen total intervals.',
          battlePlan: '20s work / 10s rest:\n• Wall Balls\n• Slams\n• Rotational Throws\n• Squat-to-Press\nRepeat 4 rounds (16 intervals total).',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241384/mood_app/workout_images/vv8j4fll_download.jpg',
          intensityReason: 'Work‑rest cycles maximize output with quick resets.',
          role: 'finisher',
          intensity_cost: 4,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'checkmark',
              title: 'Reset chest up each catch',
              description: 'Return to upright position after catching ball'
            },
            {
              icon: 'body',
              title: 'Pivot hips on rotations',
              description: 'Rotate through hips for full rotational power'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Complex (Med Ball)',
          duration: '16–20 min',
          description: 'Four rounds 12‑10‑8‑6 with one‑minute rests between sets.',
          battlePlan: 'Perform 4 rounds:\n• 12 Wall Balls\n• 10 Slams\n• 8 Rotations (per side)\n• 6 Burpee Slams\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241373/mood_app/workout_images/cu85n2we_download_1_.jpg',
          intensityReason: 'Sequenced lifts elevate cardio under moderate load.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Rotate from hips, not knees',
              description: 'Drive rotation through hip pivot to protect knees'
            },
            {
              icon: 'hand-right',
              title: 'Neutral spine on pickups',
              description: 'Keep back flat when retrieving ball from ground'
            }
          ]
        },
        {
          name: 'Sprint Circuit',
          duration: '20–25 min',
          description: 'Five rounds: wall balls, sprint, slams, sprint, recover.',
          battlePlan: 'Perform 5 rounds:\n• 10 Wall Balls\n• 20 m Sprint (with ball)\n• 10 Slams\n• 20 m Sprint (with ball)\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241384/mood_app/workout_images/vv8j4fll_download.jpg',
          intensityReason: 'Throws plus sprints tax power and quick recovery.',
          role: 'main_block',
          intensity_cost: 5,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Hug ball tight while sprinting',
              description: 'Secure ball against chest for stability during runs'
            },
            {
              icon: 'body',
              title: 'Reset stance before throws',
              description: 'Set feet in proper position before each throw'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Slam Balls',
    icon: 'baseball',
    workouts: {
      beginner: [
        {
          name: 'Basics',
          duration: '12–16 min',
          description: 'Three rounds: slams, squat‑to‑press, lunges, one‑minute rest.',
          battlePlan: 'Perform 3 rounds:\n• 10 Slams\n• 10 Squat-to-Press\n• 10 Reverse Lunges (ball at chest)\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241380/mood_app/workout_images/rfw3jxg0_download_3_.jpg',
          intensityReason: 'Repeated slams and squats build pace with control.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Squat to pick ball up',
              description: 'Use proper squat form when retrieving ball'
            },
            {
              icon: 'fitness',
              title: 'Keep ball close on lunges',
              description: 'Hold ball tight to chest for stability'
            }
          ]
        },
        {
          name: 'Flow (Slam Ball)',
          duration: '12–15 min',
          description: 'Three rounds: slams, overhead throws, twists, recover.',
          battlePlan: 'Perform 3 rounds:\n• 8 Slams\n• 8 Overhead Throws\n• 8 Russian Twists (per side)\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241382/mood_app/workout_images/twsti3d5_download_2_.jpg',
          intensityReason: 'Linked throws maintain rhythm and moderate heart rate.',
          role: 'main_block',
          intensity_cost: 2,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Overhead: no back arch',
              description: 'Keep core braced to prevent lower back hyperextension'
            },
            {
              icon: 'body',
              title: 'Twist from torso, not arms',
              description: 'Rotate through core muscles, not shoulder joints'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'AMRAP 10 (Slam Ball)',
          duration: '10–12 min',
          description: 'Ten‑minute loop: slams, lateral slams, squat jumps.',
          battlePlan: 'As many rounds as possible in 10 min:\n• 10 Slams\n• 10 Lateral Slams (5/side)\n• 10 Squat Jumps (ball at chest)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241380/mood_app/workout_images/rfw3jxg0_download_3_.jpg',
          intensityReason: 'Short AMRAP drives pace while keeping form tidy.',
          role: 'finisher',
          intensity_cost: 4,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Pivot hips on lateral slams',
              description: 'Rotate through hips for side-to-side power'
            },
            {
              icon: 'fitness',
              title: 'Land jumps softly, stacked',
              description: 'Absorb landing with bent knees and aligned spine'
            }
          ]
        },
        {
          name: 'Tabata (Slam Ball)',
          duration: '16 min',
          description: 'Four‑move Tabata repeated to total sixteen intervals.',
          battlePlan: '20s work / 10s rest with:\n• Slams\n• Squat-to-Press\n• Lateral Slams\n• Burpee Slams\nRepeat 4 rounds (16 intervals total).',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241382/mood_app/workout_images/twsti3d5_download_2_.jpg',
          intensityReason: 'Fast intervals spur output with quick station shifts.',
          role: 'finisher',
          intensity_cost: 4,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Place ball centered for burpee',
              description: 'Position ball between feet before dropping down'
            },
            {
              icon: 'trending-up',
              title: 'Exhale on overhead drive',
              description: 'Use sharp breath to power ball overhead'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Complex (Slam Ball)',
          duration: '20–24 min',
          description: 'Four rounds 12‑10‑8‑6 with one‑minute rests between sets.',
          battlePlan: 'Perform 4 rounds:\n• 12 Slams\n• 10 Lateral Slams\n• 8 Burpee Slams\n• 6 Overhead Throws\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241380/mood_app/workout_images/rfw3jxg0_download_3_.jpg',
          intensityReason: 'Linked series challenges power across repeated efforts.',
          role: 'main_block',
          intensity_cost: 5,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Lateral: target obliques',
              description: 'Focus on engaging side core muscles during throws'
            },
            {
              icon: 'trending-up',
              title: 'Overhead: hips drive first',
              description: 'Initiate throw with hip extension before arms'
            }
          ]
        },
        {
          name: 'Sprint Circuit (Slam Ball)',
          duration: '20–25 min',
          description: 'Five rounds: slams, sprint, lateral slams, sprint, rest.',
          battlePlan: 'Perform 5 rounds:\n• 10 Slams\n• 20 m Sprint (with ball)\n• 10 Lateral Slams\n• 20 m Sprint (with ball)\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241382/mood_app/workout_images/twsti3d5_download_2_.jpg',
          intensityReason: 'Alternating slams and sprints elevate output safely.',
          role: 'main_block',
          intensity_cost: 5,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Hug ball during sprints',
              description: 'Hold ball securely against body while running'
            },
            {
              icon: 'body',
              title: 'Reset stance after slams',
              description: 'Establish proper footing before starting sprint'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Battle Ropes',
    icon: 'git-branch',
    workouts: {
      beginner: [
        {
          name: 'Waves And Slams',
          duration: '12–14 min',
          description: 'Five rounds alternating waves and double slams with rest.',
          battlePlan: 'Perform 5 rounds:\n• 20s Alternating Waves\n• 20s Rest\n• 20s Double Slams\n• 20s Rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241369/mood_app/workout_images/264ds1si_download.jpg',
          intensityReason: 'Short bouts build rhythm without technique overload.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Brace core; knees bent',
              description: 'Maintain athletic stance with engaged midsection'
            },
            {
              icon: 'flash',
              title: 'Exhale on each slam',
              description: 'Use sharp breath to power each downward throw'
            }
          ]
        },
        {
          name: 'Rope Circuit',
          duration: '12–15 min',
          description: 'Four rounds: waves, side‑to‑side waves, slams, programmed rest.',
          battlePlan: 'Perform 4 rounds:\n• 20s Waves\n• 20s Side-to-Side Waves\n• 20s Slams\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240867/mood_app/workout_images/7urm2u9b_download_5_.jpg',
          intensityReason: 'Cycling patterns sustains output and coordination.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'git-branch',
              title: 'Keep steady rope slack',
              description: 'Maintain consistent tension in ropes throughout'
            },
            {
              icon: 'body',
              title: 'Relax shoulders; no shrug',
              description: 'Keep shoulders down and away from ears'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Tabata (Ropes)',
          duration: '16 min',
          description: 'Waves, slams, circles, jacks rotated for sixteen intervals.',
          battlePlan: '20s work / 10s rest alternating:\n• Waves\n• Slams\n• Circles\n• Jumping Jacks\nRepeat 4 rounds (16 intervals).',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241369/mood_app/workout_images/264ds1si_download.jpg',
          intensityReason: 'Tabata sprints maximize power with managed fatigue.',
          role: 'finisher',
          intensity_cost: 4,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Drive force from hips and core',
              description: 'Generate rope power from lower body, not just arms'
            },
            {
              icon: 'flash',
              title: 'Short, powerful bursts',
              description: 'Focus on intensity over duration for each interval'
            }
          ]
        },
        {
          name: 'Rope And Burpee Combo',
          duration: '20–22 min',
          description: 'Four rounds: waves, burpees, slams, burpees, timed rest.',
          battlePlan: 'Perform 4 rounds:\n• 30s Waves\n• 5 Burpees\n• 30s Slams\n• 5 Burpees\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240867/mood_app/workout_images/7urm2u9b_download_5_.jpg',
          intensityReason: 'Ropes plus burpees challenge power and recovery speed.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Transition rope to burpee fluidly',
              description: 'Move smoothly between exercises without hesitation'
            },
            {
              icon: 'fitness',
              title: 'Land burpees softly, absorb impact',
              description: 'Use bent knees to cushion landing and protect joints'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Gauntlet',
          duration: '24–26 min',
          description: 'Four rounds: waves, slams, sides, jacks, circles, rest.',
          battlePlan: 'Perform 4 rounds:\n• 30s Waves\n• 30s Slams\n• 30s Side-to-Sides\n• 30s Jacks\n• 30s Circles\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241369/mood_app/workout_images/264ds1si_download.jpg',
          intensityReason: 'Extended sequence sustains output across patterns.',
          role: 'main_block',
          intensity_cost: 5,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'speedometer',
              title: 'Keep rhythm constant throughout',
              description: 'Maintain steady pace across all rope movements'
            },
            {
              icon: 'leaf',
              title: 'Sync breathing with wave rhythm',
              description: 'Match inhale/exhale pattern to rope oscillations'
            }
          ]
        },
        {
          name: 'Rope And Sprint Circuit',
          duration: '20–25 min',
          description: 'Five rounds: waves, sprint, slams, sprint, planned rest.',
          battlePlan: 'Perform 5 rounds:\n• 20s Waves\n• 20 m Sprint\n• 20s Slams\n• 20 m Sprint\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241376/mood_app/workout_images/eezapz0l_download_2_.jpg',
          intensityReason: 'High‑output rope bouts paired with short sprints.',
          role: 'main_block',
          intensity_cost: 5,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'walk',
              title: 'Sprint upright, strong arm drive',
              description: 'Run tall with powerful arm pumping motion'
            },
            {
              icon: 'flash',
              title: 'Max rope effort before running',
              description: 'Give full intensity on ropes before transitioning'
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
          name: 'Push And Pull',
          duration: '12–15 min',
          description: 'Five rounds: 10 m push, 10 m backward pull, one‑minute rest.',
          battlePlan: 'Perform 5 rounds:\n• 10 m Push (light)\n• 10 m Backward Pull\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241377/mood_app/workout_images/k6ha38p9_download_1_.jpg',
          intensityReason: 'Light pushes and pulls build pace with safe control.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Push with 45° lean, arms straight',
              description: 'Angle body forward and extend arms for power transfer'
            },
            {
              icon: 'walk',
              title: 'Pull with short, fast steps',
              description: 'Use quick choppy strides when moving backward'
            }
          ]
        },
        {
          name: 'Sled March',
          duration: '12–16 min',
          description: 'Four rounds: 15 m slow push, 15 m slow pull, timed rest.',
          battlePlan: 'Perform 4 rounds:\n• 15 m Slow Push\n• 15 m Slow Pull\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241378/mood_app/workout_images/k8lo936w_download.jpg',
          intensityReason: 'Slow pushes and pulls reinforce position and tempo.',
          role: 'main_block',
          intensity_cost: 2,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'walk',
              title: 'Heel‑to‑toe push, core braced',
              description: 'Roll through foot while keeping midsection tight'
            },
            {
              icon: 'body',
              title: 'Upright chest while pulling',
              description: 'Stay tall and avoid hunching during backward pulls'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Sprint Intervals',
          duration: '20 min',
          description: 'Ten rounds: 10 m sprint push, walk back recovery pacing.',
          battlePlan: 'Perform 10 rounds:\n• 10 m Sprint Push\n• Walk back slow (rest)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241377/mood_app/workout_images/k6ha38p9_download_1_.jpg',
          intensityReason: 'Short sprint pushes spike power with full walkback rest.',
          role: 'finisher',
          intensity_cost: 5,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'flash',
              title: 'Explode with leg drive',
              description: 'Push forcefully through ground with each step'
            },
            {
              icon: 'walk',
              title: 'Keep stride short and quick',
              description: 'Use rapid choppy steps for maximum power output'
            }
          ]
        },
        {
          name: 'Push And Drag Circuit',
          duration: '20–22 min',
          description: 'Four rounds: push, backward drag, lateral push, rest.',
          battlePlan: 'Perform 4 rounds:\n• 10 m Push (moderate)\n• 10 m Backward Drag\n• 10 m Lateral Push (sideways)\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241378/mood_app/workout_images/k8lo936w_download.jpg',
          intensityReason: 'Mixed directions tax mechanics and aerobic capacity.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'walk',
              title: 'Lateral: hips square, steps controlled',
              description: 'Keep hips facing forward during sideways movement'
            },
            {
              icon: 'body',
              title: 'Drag: knees bent, chest tall',
              description: 'Maintain athletic posture while pulling backward'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Gauntlet (Sled)',
          duration: '24–28 min',
          description: 'Five rounds: heavy push, sprint push, drag, lateral, rest.',
          battlePlan: 'Perform 5 rounds:\n• 10 m Heavy Push\n• 10 m Sprint Push (light)\n• 10 m Backward Drag\n• 10 m Lateral Push\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241377/mood_app/workout_images/k6ha38p9_download_1_.jpg',
          intensityReason: 'Heavy plus fast bouts sustain output under fatigue.',
          role: 'main_block',
          intensity_cost: 5,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Heavy pushes: glute/ham drive',
              description: 'Power heavy loads through posterior chain muscles'
            },
            {
              icon: 'flash',
              title: 'Move fast between transitions',
              description: 'Minimize rest time when switching directions'
            }
          ]
        },
        {
          name: 'Sled And Burpee Circuit',
          duration: '24–26 min',
          description: 'Four rounds: heavy push, burpees, drag, burpees, rest.',
          battlePlan: 'Perform 4 rounds:\n• 10 m Heavy Push\n• 10 Burpees\n• 10 m Backward Drag\n• 10 Burpees\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241378/mood_app/workout_images/k8lo936w_download.jpg',
          intensityReason: 'Heavy sled plus burpees challenge power and recovery.',
          role: 'main_block',
          intensity_cost: 5,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Burpees: core tight, hips level',
              description: 'Keep body aligned during the plank portion'
            },
            {
              icon: 'flash',
              title: 'Push explosively after burpees',
              description: 'Channel elevated heart rate into powerful sled push'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Sledgehammer + Tire',
    icon: 'hammer',
    workouts: {
      beginner: [
        {
          name: 'Hammer Basics',
          duration: '12–15 min',
          description: 'Three rounds: strikes each side, tire step‑ups, rest block.',
          battlePlan: 'Perform 3 rounds:\n• 10 Hammer Strikes (each side)\n• 10 Tire Step-Ups\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241374/mood_app/workout_images/dehw59za_download_3_.jpg',
          intensityReason: 'Simple strikes and steps elevate HR with safe skill.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Slide top hand down handle',
              description: 'Let top hand travel down shaft for maximum power'
            },
            {
              icon: 'walk',
              title: 'Place whole foot on tire',
              description: 'Step fully onto tire surface for stability'
            }
          ]
        },
        {
          name: 'Hammer And March',
          duration: '12–16 min',
          description: 'Four rounds: strikes each side, toe taps on tire, recover.',
          battlePlan: 'Perform 4 rounds:\n• 8 Strikes (each side)\n• 8 Tire Toe Taps\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241383/mood_app/workout_images/v5drjc07_download_2_.jpg',
          intensityReason: 'Moderate strikes with light footwork build steady pace.',
          role: 'main_block',
          intensity_cost: 2,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Hips whip to generate speed',
              description: 'Rotate hips explosively to power hammer swing'
            },
            {
              icon: 'walk',
              title: 'Toe taps: fast, rhythmic',
              description: 'Alternate feet quickly with light touches'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Hammer And Burpee Circuit',
          duration: '18–20 min',
          description: 'Four rounds: strikes, burpees, tire jumps, one‑minute rest.',
          battlePlan: 'Perform 4 rounds:\n• 10 Strikes (each side)\n• 8 Burpees\n• 10 Tire Jumps\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241374/mood_app/workout_images/dehw59za_download_3_.jpg',
          intensityReason: 'Strikes, burpees, and jumps stress power and recovery.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Rotate hips; snap wrists',
              description: 'Combine hip rotation with wrist snap for power'
            },
            {
              icon: 'fitness',
              title: 'Land softly on tire',
              description: 'Absorb landing through bent knees on jumps'
            }
          ]
        },
        {
          name: 'Hammer Tabata',
          duration: '16–18 min',
          description: 'Repeated sprints of strikes build power under fatigue.',
          battlePlan: '20s strikes (switch side halfway) / 10s rest\n8 rounds = 4 min\nRest 1 min\nRepeat for 3 cycles (~16–18 min)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241383/mood_app/workout_images/v5drjc07_download_2_.jpg',
          intensityReason: 'Repeated sprints of strikes build power under fatigue.',
          role: 'finisher',
          intensity_cost: 5,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Aggressive hip snap on strikes',
              description: 'Drive power from explosive hip rotation each rep'
            },
            {
              icon: 'flash',
              title: 'Exhale sharply each swing',
              description: 'Use forceful breath to add power to strikes'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Hammer Gauntlet',
          duration: '20–24 min',
          description: 'Four rounds: strikes, jumps, burpees, tire flips, recover.',
          battlePlan: 'Perform 4 rounds:\n• 12 Strikes (each side)\n• 10 Tire Jumps\n• 8 Burpees\n• 6 Tire Flips\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241374/mood_app/workout_images/dehw59za_download_3_.jpg',
          intensityReason: 'Mixed tasks tax strength, power, and aerobic recovery.',
          role: 'main_block',
          intensity_cost: 5,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Brace core during flips',
              description: 'Engage midsection to protect spine on heavy lifts'
            },
            {
              icon: 'fitness',
              title: 'Land lightly on jumps',
              description: 'Use soft landings to protect knees and ankles'
            }
          ]
        },
        {
          name: 'Hammer And Sprint Circuit',
          duration: '20–25 min',
          description: 'Five rounds: strikes, sprint, jumps, sprint, planned rest.',
          battlePlan: 'Perform 5 rounds:\n• 10 Strikes (each side)\n• 20 m Sprint\n• 10 Tire Jumps\n• 20 m Sprint\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241383/mood_app/workout_images/v5drjc07_download_2_.jpg',
          intensityReason: 'Strikes plus sprints challenge output and quick reset.',
          role: 'main_block',
          intensity_cost: 5,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Reset grip each strike',
              description: 'Reposition hands properly before each swing'
            },
            {
              icon: 'walk',
              title: 'Sprint tall; full arm drive',
              description: 'Run upright with powerful arm pumping'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Flipping Tire',
    icon: 'ellipse',
    workouts: {
      beginner: [
        {
          name: 'Tire Flip And Step',
          duration: '12–15 min',
          description: 'Three rounds: flips, step‑ups to tire, consistent recovery.',
          battlePlan: 'Perform 3 rounds:\n• 5 Flips\n• 10 Tire Step-Ups\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241385/mood_app/workout_images/vyfyeozq_download_2_.jpg',
          intensityReason: 'Light flip volume with steps raises HR without overload.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Chest tight to tire; drive hips',
              description: 'Keep body close and use hip power to flip'
            },
            {
              icon: 'walk',
              title: 'Full foot on tire for steps',
              description: 'Place entire foot on tire surface for stability'
            }
          ]
        },
        {
          name: 'Tire Flip And Tap',
          duration: '12–16 min',
          description: 'Four rounds: flips, fast toe taps on tire, minute rest.',
          battlePlan: 'Perform 4 rounds:\n• 4 Flips\n• 20 Toe Taps on Tire\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241379/mood_app/workout_images/q5iv9oux_download_1_.jpg',
          intensityReason: 'Short flip sets plus quick feet build cardio safely.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Full hip extension on flips',
              description: 'Drive hips fully forward to complete each flip'
            },
            {
              icon: 'walk',
              title: 'Toe taps: quick and light',
              description: 'Alternate feet rapidly with minimal contact time'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Tire Flip And Jump',
          duration: '14–16 min',
          description: 'Four rounds: flips, tire jumps, one‑minute recoveries.',
          battlePlan: 'Perform 4 rounds:\n• 6 Flips\n• 8 Tire Jumps\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241385/mood_app/workout_images/vyfyeozq_download_2_.jpg',
          intensityReason: 'Moderate flips plus jumps increase demand and pacing.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Keep back flat on flips',
              description: 'Maintain neutral spine throughout lifting motion'
            },
            {
              icon: 'fitness',
              title: 'Land softly, knees bent',
              description: 'Absorb jump landings through flexed knees'
            }
          ]
        },
        {
          name: 'Tire Flip Circuit',
          duration: '14–18 min',
          description: 'Three rounds: flips, tire push‑ups, lateral jumps, rest.',
          battlePlan: 'Perform 3 rounds:\n• 5 Flips\n• 10 Tire Push-Ups\n• 10 Lateral Jumps\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241379/mood_app/workout_images/q5iv9oux_download_1_.jpg',
          intensityReason: 'Mixed push, press, and jump patterns raise capacity.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Push‑ups: hands wide, stable',
              description: 'Place hands on tire edges for solid base'
            },
            {
              icon: 'fitness',
              title: 'Lateral jumps: compact, quick',
              description: 'Keep jumps controlled with rapid side-to-side motion'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Tire Flip Gauntlet',
          duration: '20–22 min',
          description: 'Four rounds: flips, burpees, jumps, push‑ups, programmed rest.',
          battlePlan: 'Perform 4 rounds:\n• 8 Flips\n• 8 Burpees\n• 8 Tire Jumps\n• 8 Tire Push-Ups\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241385/mood_app/workout_images/vyfyeozq_download_2_.jpg',
          intensityReason: 'Repeated flips and plyos sustain power under fatigue.',
          role: 'main_block',
          intensity_cost: 5,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Core braced; drive with legs',
              description: 'Use leg power with tight core for safe flipping'
            },
            {
              icon: 'fitness',
              title: 'Control burpee pace',
              description: 'Maintain steady rhythm to manage fatigue'
            }
          ]
        },
        {
          name: 'Tire Flip And Sprint',
          duration: '20–22 min',
          description: 'Four rounds: flips, sprint, flips, sprint, one‑minute rest.',
          battlePlan: 'Perform 4 rounds:\n• 6 Flips\n• 20 m Sprint\n• 6 Flips\n• 20 m Sprint\n• Rest 1 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241379/mood_app/workout_images/q5iv9oux_download_1_.jpg',
          intensityReason: 'Heavy flips plus short sprints challenge recovery.',
          role: 'main_block',
          intensity_cost: 5,
          modality: 'resistance',
          moodTips: [
            {
              icon: 'body',
              title: 'Grip low under tire; chest close',
              description: 'Position hands low and stay tight to tire'
            },
            {
              icon: 'walk',
              title: 'Sprint tall, relaxed after flips',
              description: 'Run upright and loose following heavy lifts'
            }
          ]
        }
      ]
    }
  }
];
