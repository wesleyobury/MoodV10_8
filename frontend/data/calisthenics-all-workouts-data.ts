import { EquipmentWorkouts } from '../types/workout';

// Additional equipment workout data for calisthenics - Part 2
export const additionalWorkoutDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Gymnast rings',
    icon: 'radio-button-off',
    workouts: {
      beginner: [
        {
          name: 'Ring Start',
          duration: '16–22 min',
          description: 'Support hold low, ring rows high, kneeling pushups.',
          battlePlan: 'Ring Support Lean (feet down)\n• 3 × 15–25s (RPE 4), 60s rest\nHigh Ring Row (knees bent)\n• 3 × 8–10 (RPE 4), 60s rest\nKneeling Ring Pushup\n• 3 × 8–12 (RPE 4), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241244/mood_app/workout_images/qhw328ft_download_6_.jpg',
          intensityReason: 'Stable regressions teach alignment and shoulder set.',
          movement_focus: 'mixed_upper',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Rings close to body',
              description: 'Keep rings tight to your sides for better stability and control'
            },
            {
              icon: 'hand-right',
              title: 'Keep wrists neutral',
              description: 'Avoid bending wrists to prevent strain and maintain proper alignment'
            }
          ]
        },
        {
          name: 'Scap Lines',
          duration: '16–22 min',
          description: 'Scap rows, scap pushups, dead bug for core control.',
          battlePlan: 'Ring Scap Rows\n• 3 × 10–12 (RPE 4), 60s rest\nRing Scap Pushups\n• 3 × 10–12 (RPE 4), 60s rest\nDead Bug\n• 3 × 10–12/side (RPE 4), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241236/mood_app/workout_images/n3zrasp5_download_5_.jpg',
          intensityReason: 'Scap control on rings builds robust base stability.',
          movement_focus: 'mixed_upper',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Move just shoulder blades',
              description: 'Isolate scapular movement without bending elbows or using momentum'
            },
            {
              icon: 'body',
              title: 'Ribs down and quiet',
              description: 'Maintain core engagement to prevent rib flare and spine extension'
            }
          ]
        },
        {
          name: 'Angle Mix',
          duration: '16–22 min',
          description: 'Ring rows, ring pushups, hollow hold finisher for light challenge.',
          battlePlan: 'Ring Row (medium angle)\n• 3 × 8–10 (RPE 4), 60s rest\nRing Pushup (incline)\n• 3 × 8–12 (RPE 4), 60s rest\nHollow Hold\n• 3 × 20–30s (RPE 4), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241259/mood_app/workout_images/z7qrv937_download_4_.jpg',
          intensityReason: 'Angle adjustments dial in intensity while stable.',
          movement_focus: 'mixed_upper',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Set feet to control load',
              description: 'Move feet closer to reduce difficulty or farther away to increase challenge'
            },
            {
              icon: 'body',
              title: 'Ring pushups: elbows 45°',
              description: 'Keep elbows at 45-degree angle to protect shoulders and engage chest'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Stable Lines',
          duration: '22–28 min',
          description: 'Mid-angle rows, pushups, knee tucks for core finish.',
          battlePlan: 'Ring Row (mid angle)\n• 4 × 8–10 (RPE 5), 75s rest\nRing Pushup (horizontal)\n• 4 × 8–12 (RPE 5), 75s rest\nRing Knee Tucks (support)\n• 3 × 10–12 (RPE 5), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241190/mood_app/workout_images/0ah02106_download_9_.jpg',
          intensityReason: 'Moderate ring angles challenge stabilizers with control.',
          movement_focus: 'mixed_upper',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Squeeze rings lightly',
              description: 'A light grip activates forearms without excess tension or fatigue'
            },
            {
              icon: 'body',
              title: 'Keep shoulders packed',
              description: 'Pull shoulder blades down and back to create stable pressing position'
            }
          ]
        },
        {
          name: 'Archer Starts',
          duration: '22–28 min',
          description: 'Archer rows beginners, narrow pushups, hollow rocks.',
          battlePlan: 'Ring Archer Row (assisted)\n• 4 × 6–8/side (RPE 5–6), 90s rest\nRing Pushup (narrow)\n• 4 × 8–10 (RPE 5), 75s rest\nHollow Rock\n• 3 × 10–15 (RPE 5), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241256/mood_app/workout_images/wd1l2iea_download_8_.jpg',
          intensityReason: 'Unilateral bias builds strength and positional control.',
          movement_focus: 'mixed_upper',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Press through working hand',
              description: 'Drive force through the main arm to build unilateral strength'
            },
            {
              icon: 'body',
              title: 'Assist lightly with other',
              description: 'Use the assisting arm for balance only, not primary force production'
            }
          ]
        },
        {
          name: 'Volume Build',
          duration: '22–28 min',
          description: 'Straight rows and pushups, modest volume increase for strength gains.',
          battlePlan: 'Ring Row (neutral)\n• 4 × 8–12 (RPE 5), 75s rest\nRing Pushup (horizontal)\n• 4 × 10–12 (RPE 5), 75s rest\nFront Plank\n• 3 × 30–40s (RPE 5), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241222/mood_app/workout_images/fv7h4gkz_row.jpg',
          intensityReason: 'Moderate volume builds work capacity while stable.',
          movement_focus: 'upper_push',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'leaf',
              title: 'Keep tempo smooth',
              description: 'Control the movement pace to maximize time under tension'
            },
            {
              icon: 'body',
              title: 'Avoid overflaring rings',
              description: 'Keep rings parallel to prevent excessive shoulder external rotation'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Archer Plus',
          duration: '24–32 min',
          description: 'Full archer rows and pushups, pistol assists for leg balance.',
          battlePlan: 'Ring Archer Row (full)\n• 5 × 4–6/side (RPE 6–7), 90–120s rest\nRing Archer Pushup\n• 4 × 4–6/side (RPE 6), 90s rest\nRing-Assisted Pistol\n• 3 × 6–8/side (RPE 6), 75s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241256/mood_app/workout_images/wd1l2iea_download_8_.jpg',
          intensityReason: 'Full unilateral work challenges single-arm control.',
          movement_focus: 'mixed_upper',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Straight arm stays passive',
              description: 'Let the extended arm guide balance without contributing force'
            },
            {
              icon: 'leaf',
              title: 'Breathe through tension',
              description: 'Maintain steady breathing to prevent breath-holding under load'
            }
          ]
        },
        {
          name: 'Ring Muscle-Up Prep',
          duration: '24–32 min',
          description: 'False-grip rows, explosive transition drills, ring dips.',
          battlePlan: 'False-Grip Ring Row\n• 5 × 6–8 (RPE 6), 90s rest\nRing Muscle-Up Transition Practice (assisted)\n• 4 × 3–4 (RPE 6–7), 120s rest\nRing Dip\n• 4 × 6–8 (RPE 6), 90s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240922/mood_app/workout_images/dq0uzole_download_7_.jpg',
          intensityReason: 'MU drills require powerful pull, dip, and transition.',
          movement_focus: 'mixed_upper',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Deep false grip patience',
              description: 'Master the false grip position before attempting muscle-up transitions'
            },
            {
              icon: 'flash',
              title: 'Explosive ring pull',
              description: 'Generate maximum power through hip drive and aggressive lat engagement'
            }
          ]
        },
        {
          name: 'High-Volume Endurance',
          duration: '24–32 min',
          description: 'High-rep rows and pushups, ring planks for total stability.',
          battlePlan: 'Ring Row (neutral)\n• 5 × 10–15 (RPE 6), 75s rest\nRing Pushup (horizontal)\n• 5 × 12–16 (RPE 6), 75s rest\nRing Front Plank\n• 4 × 30–50s (RPE 6), 60–75s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241235/mood_app/workout_images/n2vbefok_download_7_.jpg',
          intensityReason: 'High volume builds muscular endurance on unstable surface.',
          movement_focus: 'mixed_upper',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Maintain form all reps',
              description: 'Prioritize technique quality over rep count as fatigue increases'
            },
            {
              icon: 'leaf',
              title: 'Steady breathing rhythm',
              description: 'Sync breath with movement to optimize oxygen delivery and performance'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Ab wheel',
    icon: 'ellipse',
    workouts: {
      beginner: [
        {
          name: 'Wheel Intro',
          duration: '12–16 min',
          description: 'Kneeling short-rolls, dead bug, plank bracing closer.',
          battlePlan: 'Kneeling Ab Wheel (short ROM)\n• 3 × 6–8 (RPE 4), 75s rest\nDead Bug\n• 3 × 10–12/side (RPE 4), 45–60s rest\nFront Plank\n• 3 × 20–30s (RPE 4), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241241/mood_app/workout_images/pgkoxn00_download.jpg',
          intensityReason: 'Short ranges teach control without overloading spine.',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'body',
              title: 'Ribs down; small ranges',
              description: 'Keep core engaged and start with limited range to build safely'
            },
            {
              icon: 'body',
              title: 'Hips glide with torso',
              description: 'Move hips and torso as one unit to protect lower back'
            }
          ]
        },
        {
          name: 'Eccentric Teach',
          duration: '12–16 min',
          description: 'Eccentric kneeling rolls, hollow hold, bird dog for total ab development.',
          battlePlan: 'Kneeling Ab Wheel Eccentric (stand up after)\n• 3 × 4–6 (RPE 4), 90s rest\nHollow Hold\n• 3 × 20–30s (RPE 4), 45–60s rest\nBird Dog\n• 3 × 8–10/side (RPE 4), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241258/mood_app/workout_images/ytutfbco_download_1_.jpg',
          intensityReason: 'Controlled negatives build safe end-range capacity.',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'body',
              title: '4s lowers; 1s pause',
              description: 'Use a 4-second eccentric phase with brief pause at bottom'
            },
            {
              icon: 'body',
              title: 'Keep low back quiet',
              description: 'Avoid lumbar extension by engaging core throughout movement'
            }
          ]
        },
        {
          name: 'Range Build',
          duration: '12–16 min',
          description: 'Kneeling rolls mid-range, side planks for stability development.',
          battlePlan: 'Kneeling Ab Wheel (moderate ROM)\n• 3 × 6–8 (RPE 4), 75s rest\nSide Plank\n• 3 × 20–30s/side (RPE 4), 45–60s rest\nFront Plank\n• 3 × 20–30s (RPE 4), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241257/mood_app/workout_images/wgjgrxlk_download_2_.jpg',
          intensityReason: 'Gradual ROM progression increases tension safely.',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'body',
              title: 'Add inches slowly',
              description: 'Gradually extend range as strength and control improve'
            },
            {
              icon: 'body',
              title: 'Keep hips tucked slightly',
              description: 'Maintain posterior pelvic tilt to protect lower spine'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Wheel Lines',
          duration: '14–18 min',
          description: 'Kneeling rolls fuller range, hollow rocks to polish.',
          battlePlan: 'Kneeling Ab Wheel (fuller ROM)\n• 4 × 6–8 (RPE 5), 90s rest\nHollow Rock\n• 3 × 10–15 (RPE 5), 60s rest\nSide Plank with Hip Tap\n• 3 × 8–10/side (RPE 5), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241241/mood_app/workout_images/pgkoxn00_download.jpg',
          intensityReason: 'Moderate volume kneeling rolls challenge midline.',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'body',
              title: 'Smooth 3s lowers',
              description: 'Control the eccentric for 3 seconds to maximize tension'
            },
            {
              icon: 'leaf',
              title: 'Exhale pulling back',
              description: 'Breathe out forcefully during concentric to aid core stability'
            }
          ]
        },
        {
          name: 'Eccentric Plus',
          duration: '14–18 min',
          description: '4–5s eccentrics, pause, return; then dead bugs.',
          battlePlan: 'Kneeling Ab Wheel Eccentric (4–5s down)\n• 4 × 4–6 (RPE 5–6), 90s rest\nDead Bug\n• 3 × 12–14/side (RPE 5), 60s rest\nFront Plank\n• 3 × 25–35s (RPE 5), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241258/mood_app/workout_images/ytutfbco_download_1_.jpg',
          intensityReason: 'Longer negatives build strength in extended ranges.',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'body',
              title: 'Keep ribs stacked',
              description: 'Maintain rib-hip connection to avoid hyperextension'
            },
            {
              icon: 'body',
              title: 'Move only as range allows',
              description: 'Stop before form breaks down to prevent injury'
            }
          ]
        },
        {
          name: 'Angle Mix',
          duration: '14–18 min',
          description: 'Kneeling diagonals, side planks, hollow holds finish.',
          battlePlan: 'Kneeling Ab Wheel Diagonal Rolls\n• 4 × 5–6/side (RPE 5), 90s rest\nSide Plank\n• 3 × 25–35s/side (RPE 5), 45–60s rest\nHollow Hold\n• 3 × 25–35s (RPE 5), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241257/mood_app/workout_images/wgjgrxlk_download_2_.jpg',
          intensityReason: 'Slight angle changes load obliques and anti-rotation.',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'body',
              title: 'Small angle changes',
              description: 'Work obliques with slight diagonal movements for variety'
            },
            {
              icon: 'body',
              title: 'Keep hips square level',
              description: 'Prevent hip rotation to isolate core muscles effectively'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Long Lines',
          duration: '16–22 min',
          description: 'Full kneeling rolls, hollow rocks, side plank reach.',
          battlePlan: 'Kneeling Ab Wheel (full ROM)\n• 5 × 6–8 (RPE 6), 90s rest\nHollow Rock\n• 4 × 12–16 (RPE 6), 60s rest\nSide Plank with Reach\n• 3 × 10–12/side (RPE 6), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241241/mood_app/workout_images/pgkoxn00_download.jpg',
          intensityReason: 'Full-range kneeling rolls challenge deep core safely.',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'body',
              title: 'Control end range',
              description: 'Maintain tension at full extension without losing form'
            },
            {
              icon: 'body',
              title: 'Avoid lumbar extension',
              description: 'Keep core braced to prevent lower back arching'
            }
          ]
        },
        {
          name: 'Eccentric Heavy',
          duration: '16–22 min',
          description: '5–6s eccentrics, micro-pauses, strict plank holds.',
          battlePlan: 'Kneeling Ab Wheel Eccentric (5–6s down)\n• 5 × 3–5 (RPE 6–7), 120s rest\nFront Plank (hard)\n• 4 × 30–45s (RPE 6), 60–75s rest\nHollow Hold\n• 3 × 30–40s (RPE 6), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241258/mood_app/workout_images/ytutfbco_download_1_.jpg',
          intensityReason: 'Very slow negatives build resilience in long ranges.',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'body',
              title: 'Stay stacked, glutes on',
              description: 'Engage glutes and maintain aligned posture throughout'
            },
            {
              icon: 'leaf',
              title: 'Nose breathe; calm rhythm',
              description: 'Nasal breathing helps maintain core tension and focus'
            }
          ]
        },
        {
          name: 'Midrange Control',
          duration: '16–22 min',
          description: 'Wheel outs with 1.5 reps, diagonal rolls light, side planks for core development.',
          battlePlan: 'Kneeling Ab Wheel (1.5 reps)\n• 4 × 5–6 (RPE 6), 90s rest\nKneeling Diagonal Rolls (short)\n• 3 × 5–6/side (RPE 6), 90s rest\nSide Plank\n• 3 × 30–40s/side (RPE 6), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241257/mood_app/workout_images/wgjgrxlk_download_2_.jpg',
          intensityReason: '1.5 wheel reps add bracing time at safe midrange.',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'body',
              title: 'Pause mid, smooth return',
              description: 'Hold briefly at the halfway point before completing the rep'
            },
            {
              icon: 'body',
              title: 'Keep hips from swaying',
              description: 'Engage obliques to prevent lateral hip movement during rolls'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Pushup bars / parallettes',
    icon: 'reorder-three',
    workouts: {
      beginner: [
        {
          name: 'Bar Start',
          duration: '16–22 min',
          description: 'Incline pushups, row regressions, dead bug finish.',
          battlePlan: 'Incline Pushup on Parallettes\n• 3 × 8–12 (RPE 4), 60s rest\nTable Row or Band Row (if available)\n• 3 × 10–12 (RPE 4), 60s rest\nDead Bug\n• 3 × 10–12/side (RPE 4), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240928/mood_app/workout_images/kencpix3_incline_pushup.jpg',
          intensityReason: 'Elevated grips reduce wrist strain and aid control.',
          movement_focus: 'upper_push',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Hands stacked under shoulders',
              description: 'Position hands directly beneath shoulders for optimal pressing mechanics'
            },
            {
              icon: 'arrow-forward',
              title: 'Elbows 30–45° path',
              description: 'Track elbows at 30-45 degrees to protect shoulders and engage chest'
            }
          ]
        },
        {
          name: 'Depth Intro',
          duration: '16–22 min',
          description: 'Deficit pushups, scap pushups, side planks finish.',
          battlePlan: 'Deficit Pushup (small blocks)\n• 3 × 8–10 (RPE 4), 60s rest\nScapular Pushups on Bars\n• 3 × 10–12 (RPE 4), 60s rest\nSide Plank\n• 3 × 20–30s/side (RPE 4), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240917/mood_app/workout_images/3ltjblfg_deficit_pushup.jpg',
          intensityReason: 'Slight deficit allows safe depth and chest tension.',
          movement_focus: 'upper_push',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Ribs down; no sway',
              description: 'Keep ribs pulled down and core tight to prevent back arching'
            },
            {
              icon: 'time',
              title: 'Slow 2–1–3 tempo',
              description: 'Use 2 seconds down, 1 second pause, 3 seconds up for control'
            }
          ]
        },
        {
          name: 'Lean Prep',
          duration: '16–22 min',
          description: 'Pseudo planche lean, pushups, hollow holds finish.',
          battlePlan: 'Parallette Lean Hold (pseudo planche)\n• 3 × 15–25s (RPE 4), 60s rest\nParallette Pushup (neutral wrists)\n• 3 × 8–12 (RPE 4), 60s rest\nHollow Hold\n• 3 × 20–30s (RPE 4), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240933/mood_app/workout_images/yneg02k1_pseduo_planch_lean.jpg',
          intensityReason: 'Forward lean introduces planche-line loading gently.',
          movement_focus: 'upper_push',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'arrow-forward',
              title: 'Protract, then lean',
              description: 'Push shoulders forward first, then shift weight into lean position'
            },
            {
              icon: 'body',
              title: 'Keep elbows soft, not locked',
              description: 'Maintain slight elbow bend to protect joints under tension'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Depth Lines',
          duration: '22–28 min',
          description: 'Deep pushups, ring/table rows, knee tucks finisher.',
          battlePlan: 'Deep Parallette Pushup\n• 4 × 8–12 (RPE 5), 75s rest\nInverted Row (table/rings)\n• 4 × 8–10 (RPE 5), 75s rest\nParallette Knee Tucks (L-sit prep)\n• 3 × 10–12 (RPE 5), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240917/mood_app/workout_images/3ltjblfg_deficit_pushup.jpg',
          intensityReason: 'Deeper range increases tension at manageable load.',
          movement_focus: 'upper_push',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Touch chest between bars',
              description: 'Lower chest fully between bars to maximize range of motion'
            },
            {
              icon: 'body',
              title: 'Keep scap packed and down',
              description: 'Retract and depress shoulder blades throughout the movement'
            }
          ]
        },
        {
          name: 'Lean Lines',
          duration: '22–28 min',
          description: 'Pseudo planche pushups, dips light, hollow rocks.',
          battlePlan: 'Pseudo Planche Pushup (on bars)\n• 4 × 6–8 (RPE 5–6), 90s rest\nBox/Bench Dips (light)\n• 3 × 8–10 (RPE 5), 60–75s rest\nHollow Rock\n• 3 × 10–15 (RPE 5), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240933/mood_app/workout_images/yneg02k1_pseduo_planch_lean.jpg',
          intensityReason: 'Lean progressions build anterior shoulder integrity.',
          movement_focus: 'upper_push',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'arrow-forward',
              title: 'Protract; elbows soft',
              description: 'Push shoulders forward while maintaining slight elbow bend'
            },
            {
              icon: 'body',
              title: 'Rock smooth; ribs down',
              description: 'Keep hollow rocks controlled with ribs pulled toward hips'
            }
          ]
        },
        {
          name: 'Mixed Angle',
          duration: '22–28 min',
          description: 'Wide pushups, neutral pushups, side plank reaches.',
          battlePlan: 'Wide Parallette Pushup\n• 4 × 8–12 (RPE 5), 75s rest\nNeutral Parallette Pushup\n• 3 × 8–12 (RPE 5), 60–75s rest\nSide Plank with Reach\n• 3 × 8–10/side (RPE 5), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240921/mood_app/workout_images/9f2tiro6_download_24_.jpg',
          intensityReason: 'Hand placement changes emphasize different fibers.',
          movement_focus: 'upper_push',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Keep forearms vertical',
              description: 'Stack forearms perpendicular to floor for efficient pressing'
            },
            {
              icon: 'body',
              title: 'Reach long; hips stacked',
              description: 'Extend fully through the reach while keeping hips aligned'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'HSPU Prep',
          duration: '26–34 min',
          description: 'Pike pushups feet-high, pseudo planche holds, L-sit.',
          battlePlan: 'Feet-Elevated Pike Pushup (on bars)\n• 5 × 6–8 (RPE 6), 90s rest\nParallette Lean Hold (harder angle)\n• 4 × 20–30s (RPE 6), 75s rest\nParallette Tuck L-Sit\n• 4 × 10–15s (RPE 6), 60–75s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240934/mood_app/workout_images/yrisnwxk_pike.jpg',
          intensityReason: 'Elevated pike positions build overhead pressing lines.',
          movement_focus: 'upper_push',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Stack hips over hands',
              description: 'Align hips directly above hands for proper vertical pressing'
            },
            {
              icon: 'arrow-up',
              title: 'Press tall; no elbow flare',
              description: 'Drive straight up keeping elbows tracking forward'
            }
          ]
        },
        {
          name: 'Deficit Power',
          duration: '26–34 min',
          description: 'Deep deficit pushups, rows feet-high, hollow rocks.',
          battlePlan: 'Deep Deficit Parallette Pushup\n• 5 × 6–10 (RPE 6), 90s rest\nFeet-Elevated Inverted Row\n• 4 × 8–10 (RPE 6), 75s rest\nHollow Rock\n• 4 × 12–16 (RPE 6), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240917/mood_app/workout_images/3ltjblfg_deficit_pushup.jpg',
          intensityReason: 'Deeper deficit increases load and shoulder stability.',
          movement_focus: 'upper_push',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'time',
              title: 'Move slow; chest between bars',
              description: 'Control descent and touch chest between bars at bottom'
            },
            {
              icon: 'pause',
              title: 'Row: pause 1s at top',
              description: 'Hold peak contraction for 1 second on each row rep'
            }
          ]
        },
        {
          name: 'Midrange Control',
          duration: '26–34 min',
          description: 'Pushup 1.5s, pseudo planche pushups, L-sit holds.',
          battlePlan: 'Parallette Pushup (1.5 reps)\n• 4 × 6–8 (RPE 6), 90s rest\nPseudo Planche Pushup\n• 4 × 6–8 (RPE 6), 90s rest\nParallette L-Sit (tuck or one leg)\n• 4 × 10–15s (RPE 6), 60–75s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240927/mood_app/workout_images/hbfykdfb_download_25_.jpg',
          intensityReason: '1.5 pushups add tension without joint irritability.',
          movement_focus: 'upper_push',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause mid; smooth return',
              description: 'Hold briefly at mid-point then return with control'
            },
            {
              icon: 'body',
              title: 'Long spine, neck relaxed',
              description: 'Maintain neutral spine with relaxed neck throughout'
            }
          ]
        }
      ]
    }
  }
];

// Comprehensive calisthenics workout database with all equipment types
export const calisthenicsWorkoutsDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Pure bodyweight',
    icon: 'body',
    workouts: {
      beginner: [
        {
          name: 'Body Start',
          duration: '16–20 min',
          description: 'Squats and incline pushups, dead bugs for core stability.',
          battlePlan: 'Bodyweight Squat\n• 3 × 12–15 (RPE 4), 60s rest\nIncline Pushup (hands on bench/wall)\n• 3 × 8–12 (RPE 4), 60s rest\nDead Bug\n• 3 × 8–10/side (RPE 4), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240920/mood_app/workout_images/8pq54s9o_download_16_.jpg',
          intensityReason: 'Simple patterns build control without loading demands.',
          movement_focus: 'full_body',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'body',
              title: 'Own shallow ranges',
              description: 'Own shallow ranges'
            },
            {
              icon: 'leaf',
              title: 'Exhale on effort; slow lowers',
              description: 'Exhale on effort; slow lowers'
            }
          ]
        },
        {
          name: 'Hinge Intro',
          duration: '16–20 min',
          description: 'Hip hinge, step-back lunges, plank hold for midline.',
          battlePlan: 'Hip Hinge (bodyweight RDL pattern)\n• 3 × 12 (RPE 4), 60s rest\nReverse Lunge\n• 3 × 8/side (RPE 4), 60s rest\nFront Plank\n• 3 × 20–40s (RPE 4), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240923/mood_app/workout_images/dvx5s4v8_download_17_.jpg',
          intensityReason: 'Hip hinge and knee patterns build base body control.',
          movement_focus: 'lower',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'body',
              title: 'Hips back, shins quiet',
              description: 'Hips back, shins quiet'
            },
            {
              icon: 'leaf',
              title: 'Brace light; breathe steady',
              description: 'Brace light; breathe steady'
            }
          ]
        },
        {
          name: 'Vertical Intro',
          duration: '16–20 min',
          description: 'Doorframe rows, incline pushups, hollow holds finish.',
          battlePlan: 'Towel/Doorframe Row (light angle)\n• 3 × 10–12 (RPE 4), 60s rest\nIncline Pushup\n• 3 × 8–12 (RPE 4), 60s rest\nHollow Hold\n• 3 × 15–25s (RPE 4), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240919/mood_app/workout_images/3v9vj2rl_download_20_.jpg',
          intensityReason: 'Vertical pulls regress to build scap control safely.',
          movement_focus: 'mixed_upper',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'body',
              title: 'Shoulders down/back',
              description: 'Shoulders down/back'
            },
            {
              icon: 'body',
              title: 'Ribs down in hollow',
              description: 'Ribs down in hollow'
            }
          ]
        },
        {
          name: 'Flow Basics',
          duration: '18–22 min',
          description: 'Squats, wall sits, pushups from knees, side planks.',
          battlePlan: 'Bodyweight Squat\n• 3 × 12–15 (RPE 4), 60s rest\nWall Sit\n• 3 × 30–45s (RPE 4), 45–60s rest\nKnee Pushup\n• 3 × 8–12 (RPE 4), 60s rest\nSide Plank\n• 3 × 15–25s/side (RPE 4), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240930/mood_app/workout_images/udye11gr_download_21_.jpg',
          intensityReason: 'Controlled flow builds capacity with minimal strain.',
          movement_focus: 'full_body',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'refresh',
              title: 'Move smooth, no rush',
              description: 'Move smooth, no rush'
            },
            {
              icon: 'body',
              title: 'Keep neck long; soft lock',
              description: 'Keep neck long; soft lock'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Body Lines',
          duration: '22–28 min',
          description: 'Split squats, pushups, hip lifts, hollow rocks for bodyweight challenge.',
          battlePlan: 'Rear-Foot Flat Split Squat\n• 4 × 8/side (RPE 5), 60–75s rest\nPushup (standard)\n• 4 × 8–12 (RPE 5), 60–75s rest\nGlute Bridge\n• 3 × 12–15 (RPE 5), 60s rest\nHollow Rock\n• 3 × 10–15 (RPE 5), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240923/mood_app/workout_images/dvx5s4v8_download_17_.jpg',
          intensityReason: 'Moderate volume builds strength with steady control.',
          movement_focus: 'full_body',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'body',
              title: 'Control 3s lowers',
              description: 'Control 3s lowers'
            },
            {
              icon: 'body',
              title: 'Ribs down on pushups',
              description: 'Ribs down on pushups'
            }
          ]
        },
        {
          name: 'Single-Leg Start',
          duration: '22–28 min',
          description: 'Step-downs, skater squats, pushups, dead bugs.',
          battlePlan: 'Heel Tap Step-Down (low step)\n• 4 × 6–8/side (RPE 5), 60–75s rest\nSkater Squat (assisted)\n• 3 × 6–8/side (RPE 5), 60–75s rest\nPushup\n• 3 × 8–12 (RPE 5), 60s rest\nDead Bug\n• 3 × 10–12/side (RPE 5), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240929/mood_app/workout_images/t0xtqts3_download_19_.jpg',
          intensityReason: 'Unilateral patterns build balance and hip stability.',
          movement_focus: 'unilateral',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'body',
              title: 'Reach long; soft knee',
              description: 'Reach long; soft knee'
            },
            {
              icon: 'body',
              title: 'Quiet torso on pushes',
              description: 'Quiet torso on pushes'
            }
          ]
        },
        {
          name: 'Hinge + Pull',
          duration: '22–28 min',
          description: 'Good mornings, table rows, pushups, side planks.',
          battlePlan: 'Bodyweight Good Morning\n• 4 × 12 (RPE 5), 60s rest\nTable/Ring Row Regression (feet bent)\n• 4 × 8–10 (RPE 5), 60–75s rest\nPushup\n• 3 × 8–12 (RPE 5), 60s rest\nSide Plank\n• 3 × 25–35s/side (RPE 5), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240927/mood_app/workout_images/jb142mdj_download_22_.jpg',
          intensityReason: 'Hip hinge pairs with row regressions for posture.',
          movement_focus: 'hinge_pull',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'body',
              title: 'Hips back; neutral neck',
              description: 'Hips back; neutral neck'
            },
            {
              icon: 'body',
              title: 'Row to ribs, no shrug',
              description: 'Row to ribs, no shrug'
            }
          ]
        },
        {
          name: 'Flow Builder',
          duration: '22–28 min',
          description: 'Squat to lunge flow, pushups, hollow hold finisher.',
          battlePlan: 'Squat → Reverse Lunge (alt sides)\n• 4 × 6/side (RPE 5), 60–75s rest\nPushup\n• 4 × 8–12 (RPE 5), 60–75s rest\nHollow Hold\n• 3 × 25–35s (RPE 5), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240920/mood_app/workout_images/8pq54s9o_download_16_.jpg',
          intensityReason: 'Alternating patterns elevate capacity with control.',
          movement_focus: 'full_body',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'refresh',
              title: 'Smooth transitions',
              description: 'Smooth transitions'
            },
            {
              icon: 'leaf',
              title: 'Keep breath rhythmic',
              description: 'Keep breath rhythmic'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Power Lines',
          duration: '26–34 min',
          description: 'Pistol regressions, decline pushups, hollow rocks.',
          battlePlan: 'Pistol Box Squat (to box/bench)\n• 4 × 5–7/side (RPE 6), 75s rest\nDecline Pushup (feet elevated)\n• 4 × 8–12 (RPE 6), 60–75s rest\nHollow Rock\n• 4 × 10–15 (RPE 6), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240925/mood_app/workout_images/h7zvxkan_PS.jpg',
          intensityReason: 'Higher tension bodyweight builds strength under control.',
          movement_focus: 'full_body',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'body',
              title: 'Stay balanced, slow lowers',
              description: 'Stay balanced, slow lowers'
            },
            {
              icon: 'body',
              title: 'Pushups: ribs down, no flare',
              description: 'Pushups: ribs down, no flare'
            }
          ]
        },
        {
          name: 'Hinge Power',
          duration: '26–34 min',
          description: 'Single-leg RDL reach, hard rows, side plank holds.',
          battlePlan: 'Single-Leg RDL Reach (unloaded)\n• 4 × 6–8/side (RPE 6), 75s rest\nTable/Ring Row (feet forward)\n• 4 × 8–10 (RPE 6), 60–75s rest\nSide Plank\n• 3 × 35–45s/side (RPE 6), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240932/mood_app/workout_images/voz31xv4_download_23_.jpg',
          intensityReason: 'Single-leg hinge and rows increase posterior demand.',
          movement_focus: 'hinge_pull',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'body',
              title: 'Hips square; soft knee',
              description: 'Hips square; soft knee'
            },
            {
              icon: 'body',
              title: 'Row: pause 1s at ribs',
              description: 'Row: pause 1s at ribs'
            }
          ]
        },
        {
          name: 'Volume Push–Pull',
          duration: '26–34 min',
          description: 'Pushups, rows, squat jumps light, hollow hold closer.',
          battlePlan: 'Pushup\n• 5 × 8–12 (RPE 6), 60–75s rest\nInverted Row (low table or rail)\n• 4 × 8–10 (RPE 6), 60–75s rest\nSquat Jump (small height)\n• 3 × 8 (RPE 6), 60s rest\nHollow Hold\n• 3 × 30–40s (RPE 6), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240924/mood_app/workout_images/e6le95i4_download_18_.jpg',
          intensityReason: 'Higher push–pull volume builds endurance and control.',
          movement_focus: 'full_body',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'body',
              title: 'Keep reps smooth',
              description: 'Keep reps smooth'
            },
            {
              icon: 'walk',
              title: 'Land soft; quiet feet',
              description: 'Land soft; quiet feet'
            }
          ]
        },
        {
          name: 'Midrange Core',
          duration: '26–34 min',
          description: '1.5 tempo adds time under tension for safe progress.',
          battlePlan: 'Bodyweight Squat (1.5 reps)\n• 4 × 8–10 (RPE 6), 60–75s rest\nPushup (1.5 reps)\n• 4 × 6–8 (RPE 6), 60–75s rest\nSide Plank with Top-Arm Reach\n• 3 × 8–10/side (RPE 6), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240920/mood_app/workout_images/8pq54s9o_download_16_.jpg',
          intensityReason: '1.5 tempo adds time under tension for safe progress.',
          movement_focus: 'full_body',
          abs_slot_eligible: true,
          moodTips: [
            {
              icon: 'body',
              title: '1s pause mid; 3s return',
              description: '1s pause mid; 3s return'
            },
            {
              icon: 'leaf',
              title: 'Keep ribs stacked, nose breathe',
              description: 'Keep ribs stacked, nose breathe'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Pull up bar',
    icon: 'remove-outline',
    workouts: {
      beginner: [
        {
          name: 'Bar Start',
          duration: '16–22 min',
          description: 'Dead hangs, band-assisted pulls, incline inverted rows.',
          battlePlan: 'Dead Hang (feet supported if needed)\n• 3 × 20–30s (RPE 4), 60s rest\nBand-Assisted Pullup (light angle)\n• 3 × 4–6 (RPE 4), 75s rest\nInverted Row (high bar, feet bent)\n• 3 × 8–10 (RPE 4), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241216/mood_app/workout_images/cvdrz3i5_inverted_rows.jpg',
          intensityReason: 'Assisted hangs and rows build grip and scap control.',
          movement_focus: 'upper_pull',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Shoulders down; long neck',
              description: 'Shoulders down; long neck'
            },
            {
              icon: 'leaf',
              title: 'Smooth breath under tension',
              description: 'Smooth breath under tension'
            }
          ]
        },
        {
          name: 'Scap Basics',
          duration: '16–22 min',
          description: 'Scap pullups, eccentric lowers, hollow hold for core.',
          battlePlan: 'Scapular Pullups (top to bottom)\n• 3 × 8–10 (RPE 4), 60s rest\nEccentric Pullup (3–4s lowers, band if needed)\n• 3 × 3–5 (RPE 4), 75s rest\nHollow Hold\n• 3 × 20–30s (RPE 4), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241221/mood_app/workout_images/fh1b52aj_dead_hang.jpg',
          intensityReason: 'Scapular movement priming builds safer pull strength.',
          movement_focus: 'upper_pull',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Move only the scaps',
              description: 'Move only the scaps'
            },
            {
              icon: 'body',
              title: 'Ribs down in hollow hold',
              description: 'Ribs down in hollow hold'
            }
          ]
        },
        {
          name: 'Mixed Angle',
          duration: '16–22 min',
          description: 'Neutral band pulls, chin-up eccentrics, rows to close.',
          battlePlan: 'Neutral-Grip Band-Assisted Pullup\n• 3 × 5–7 (RPE 4), 75s rest\nEccentric Chin-Up (4s down)\n• 3 × 3–4 (RPE 4), 75s rest\nInverted Row (bar chest height)\n• 3 × 8–10 (RPE 4), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241201/mood_app/workout_images/7475d60t_chin_ups.jpg',
          intensityReason: 'Different bar grips distribute load and teach control.',
          movement_focus: 'upper_pull',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Elbows track down',
              description: 'Elbows track down'
            },
            {
              icon: 'body',
              title: 'Avoid neck craning up',
              description: 'Avoid neck craning up'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Volume Pull',
          duration: '22–28 min',
          description: 'Assisted pullups, inverted rows, hollow rocks finish.',
          battlePlan: 'Band-Assisted Pullup\n• 4 × 6–8 (RPE 5), 90s rest\nInverted Row (feet flat)\n• 4 × 8–10 (RPE 5), 75s rest\nHollow Rock\n• 3 × 10–15 (RPE 5), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241216/mood_app/workout_images/cvdrz3i5_inverted_rows.jpg',
          intensityReason: 'Moderate band assist allows higher-quality volume.',
          movement_focus: 'upper_pull',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Smooth 2–1–3 tempo',
              description: 'Smooth 2–1–3 tempo'
            },
            {
              icon: 'body',
              title: 'Keep ribs down in rocks',
              description: 'Keep ribs down in rocks'
            }
          ]
        },
        {
          name: 'Eccentric Lines',
          duration: '22–28 min',
          description: 'Chin-up eccentrics, isometric holds, knee raises.',
          battlePlan: 'Eccentric Chin-Up\n• 4 × 3–4 (RPE 5–6), 90s rest\nTop Isometric Pullup Hold (chin over bar)\n• 3 × 10–15s (RPE 5), 75s rest\nHanging Knee Raise\n• 3 × 10–12 (RPE 5), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241201/mood_app/workout_images/7475d60t_chin_ups.jpg',
          intensityReason: 'Negatives build strength through full, safe range.',
          movement_focus: 'upper_pull',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: '4–5s negatives',
              description: '4–5s negatives'
            },
            {
              icon: 'body',
              title: 'Hold chest-up position',
              description: 'Hold chest-up position'
            }
          ]
        },
        {
          name: 'Mixed Grips',
          duration: '22–28 min',
          description: 'Neutral pullups, pronated rows, dead hangs for grip.',
          battlePlan: 'Neutral-Grip Pullup (light band if needed)\n• 4 × 5–7 (RPE 5–6), 90s rest\nPronated Inverted Row (feet bent)\n• 4 × 8–10 (RPE 5), 75s rest\nDead Hang\n• 3 × 30–40s (RPE 5), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241221/mood_app/workout_images/fh1b52aj_dead_hang.jpg',
          intensityReason: 'Grip variations balance forearm and lat engagement.',
          movement_focus: 'upper_pull',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Drive elbows to ribs',
              description: 'Drive elbows to ribs'
            },
            {
              icon: 'hand-right',
              title: 'Keep hands quiet, no twist',
              description: 'Keep hands quiet, no twist'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Strict Pull',
          duration: '26–34 min',
          description: 'Pullups strict, chest-to-bar rows, hanging leg raises.',
          battlePlan: 'Strict Pullup (bodyweight)\n• 5 × 4–6 (RPE 6), 90s rest\nChest-to-Bar Inverted Row (feet extended)\n• 4 × 8–10 (RPE 6), 75s rest\nHanging Leg Raise\n• 3 × 8–12 (RPE 6), 60–75s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241230/mood_app/workout_images/kzuswott_download_15_.jpg',
          intensityReason: 'Strict sets prioritize clean strength and scap control.',
          movement_focus: 'upper_pull',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Pull chest to bar',
              description: 'Pull chest to bar'
            },
            {
              icon: 'body',
              title: 'No swing; smooth lowers',
              description: 'No swing; smooth lowers'
            }
          ]
        },
        {
          name: 'Eccentric Power',
          duration: '26–34 min',
          description: 'Eccentric pullups weighted, hollow rocks, grip holds.',
          battlePlan: 'Weighted Eccentric Pullup (dip belt/DB)\n• 5 × 2–3 (RPE 6–7), 120s rest\nHollow Rock\n• 4 × 12–16 (RPE 6), 60–75s rest\nBar Hang (thick grip/towel)\n• 3 × 30–40s (RPE 6), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241226/mood_app/workout_images/iqs19xds_weighted_pullup.jpg',
          intensityReason: 'Weighted negatives push strength beyond sticking zones.',
          movement_focus: 'upper_pull',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: '5s negatives; solid brace',
              description: '5s negatives; solid brace'
            },
            {
              icon: 'body',
              title: 'Avoid shrug; pack shoulder',
              description: 'Avoid shrug; pack shoulder'
            }
          ]
        },
        {
          name: 'Volume Mix',
          duration: '26–34 min',
          description: 'Neutral pullups, pronated pullups, chin hold finisher.',
          battlePlan: 'Neutral-Grip Pullup\n• 4 × 5–7 (RPE 6), 90s rest\nPronated Pullup\n• 3 × 4–6 (RPE 6), 90s rest\nTop Isometric Chin-Up Hold\n• 3 × 10–15s (RPE 6), 75s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241201/mood_app/workout_images/7475d60t_chin_ups.jpg',
          intensityReason: 'Higher total pulls with varied grips improve capacity.',
          movement_focus: 'upper_pull',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Full depth, calm chest',
              description: 'Full depth, calm chest'
            },
            {
              icon: 'body',
              title: '2–1–3 tempo throughout',
              description: '2–1–3 tempo throughout'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Pull-Up Bar (abs)',
    icon: 'body-outline',
    workouts: {
      beginner: [
        {
          name: 'Hanging Knee Raise',
          duration: '8–10 min',
          description: 'Hanging knee raises building core control and lower ab strength',
          battlePlan: '3 rounds\n• 10–12 reps\nRest 60s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/t73he7a9_hanging%20knee%20raise%202.png',
          intensityReason: 'Knee raises teach lower-ab control without overloading the core',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            { icon: 'body', title: 'Lift with your abs, not momentum', description: 'Swinging removes tension from the core immediately.' },
            { icon: 'arrow-up', title: 'Exhale as knees rise', description: 'Breathing helps fully contract the abs.' },
            { icon: 'arrow-down', title: 'Control the lowering phase', description: 'Don’t just drop your legs back down.' }
          ]
        },
        {
          name: 'Alternating Hanging Knee Raise',
          duration: '8–10 min',
          description: 'Alternating knee raises improving coordination and core control',
          battlePlan: '3 rounds\n• 12 total reps\nRest 60s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/50qyiwtg_alternating%20hangin%20knee%20raise.png',
          intensityReason: 'Alternating reps build coordination and unilateral core stability',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            { icon: 'shield', title: 'Keep your torso as still as possible', description: 'Stability is part of the challenge.' },
            { icon: 'arrow-up', title: 'Bring knees higher than feels comfortable', description: 'Higher range creates stronger contraction.' },
            { icon: 'checkmark-circle', title: 'Finish feeling controlled', description: 'You should own every rep.' }
          ]
        },
        {
          name: 'Hanging Knee Raise Hold',
          duration: '8–10 min',
          description: 'Knee raises with pauses increasing abdominal tension and control',
          battlePlan: '3 rounds\n• 8 reps (2s hold)\nRest 60s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/5lr2vsej_hanging%20knee%20raise%203.png',
          intensityReason: 'Top-position holds maximize ab tension and time-under-load',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            { icon: 'pause', title: 'Pause at the top deliberately', description: 'The hold is where the abs light up most.' },
            { icon: 'fitness', title: 'Keep shoulders active on the bar', description: 'Don’t hang completely loose.' },
            { icon: 'flame', title: 'Embrace the shaking', description: 'Stability improves through tension.' }
          ]
        },
        {
          name: 'Slow Hanging Knee Raise',
          duration: '8–10 min',
          description: 'Slow-tempo knee raises increasing lower ab tension and control',
          battlePlan: '3 rounds\n• 8–10 reps (3s eccentric)\nRest 60s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/cjxoatel_hanging%20knee%20raise%204.png',
          intensityReason: 'Slow tempo increases time under tension for the lower abs',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            { icon: 'timer', title: 'Move slower than feels natural', description: 'Tempo forces the abs to stay engaged longer.' },
            { icon: 'remove', title: 'Avoid swinging between reps', description: 'Reset if momentum builds.' },
            { icon: 'shield', title: 'Control matters more than reps', description: 'Quality over quantity here.' }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Hanging Leg Raise',
          duration: '10–12 min',
          description: 'Straight-leg raises increasing lower ab strength and tension',
          battlePlan: '4 rounds\n• 10–12 reps\nRest 75s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/btrm5pgt_pull%20up%20bar%20leg%20raise.png',
          intensityReason: 'Straight legs lengthen the lever and overload the lower abs',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            { icon: 'remove', title: 'Keep legs as straight as possible', description: 'Bent knees reduce the challenge significantly.' },
            { icon: 'arrow-up', title: 'Lift from your pelvis, not hips alone', description: 'Posterior tilt fully engages the abs.' },
            { icon: 'flame', title: 'The burn should build gradually', description: 'Especially in the lower abs.' }
          ]
        },
        {
          name: 'Toes-to-Bar Progression',
          duration: '10–12 min',
          description: 'Controlled toe raises improving compression and abdominal strength',
          battlePlan: '4 rounds\n• 8–10 reps\nRest 75s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/dadu4ryl_pull%20up%20bar%20toe%20to%20bar.png',
          intensityReason: 'Reaching for the bar develops abdominal compression strength',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            { icon: 'arrow-up', title: 'Bring toes higher every round', description: 'Compression strength improves through range.' },
            { icon: 'shield', title: 'Avoid turning it into a swing', description: 'Momentum steals tension from the abs.' },
            { icon: 'checkmark-circle', title: 'Stay controlled under fatigue', description: 'Clean reps matter more than height.' }
          ]
        },
        {
          name: 'Hanging Leg Raise Pulses',
          duration: '10–12 min',
          description: 'Leg raises extended with pulses increasing abdominal tension',
          battlePlan: '4 rounds\n• 8 reps + 4 pulses\nRest 75s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/8x9e66q8_hanging%20leg%20raise%202.png',
          intensityReason: 'Top-end pulses keep the abs loaded in their hardest range',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            { icon: 'pulse', title: 'Pulse near the top position', description: 'That’s where the abs are working hardest.' },
            { icon: 'remove', title: 'Keep movements short and controlled', description: 'Big swings lose the benefit.' },
            { icon: 'flame', title: 'Your abs should light up quickly', description: 'That’s intentional here.' }
          ]
        },
        {
          name: 'Windshield Wiper Intro',
          duration: '10–12 min',
          description: 'Rotational hanging raises building oblique strength and control',
          battlePlan: '4 rounds\n• 6 per side\nRest 75s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/xv28u0mp_windshield%20wipers.png',
          intensityReason: 'Rotational pattern teaches oblique control and core stability',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            { icon: 'sync', title: 'Rotate slowly through the movement', description: 'Control matters more than range.' },
            { icon: 'shield', title: 'Keep shoulders locked in', description: 'Stability protects your spine and posture.' },
            { icon: 'flame', title: 'Feel your obliques working hard', description: 'Rotation should challenge both sides evenly.' }
          ]
        }
      ],
      advanced: [
        {
          name: 'Toes-to-Bar',
          duration: '12–14 min',
          description: 'Full toes-to-bar reps demanding advanced core compression strength',
          battlePlan: '4 rounds\n• 10–12 reps\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/dadu4ryl_pull%20up%20bar%20toe%20to%20bar.png',
          intensityReason: 'Full range requires elite compression strength and grip',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            { icon: 'flash', title: 'Drive toes upward aggressively', description: 'Intent matters as much as flexibility here.' },
            { icon: 'arrow-down', title: 'Control the return every rep', description: 'Dropping fast kills tension immediately.' },
            { icon: 'flame', title: 'Final reps should feel brutal', description: 'Especially through the lower abs and grip.' }
          ]
        },
        {
          name: 'Hanging L-Sit Raise',
          duration: '12–14 min',
          description: 'L-sit raises combining compression strength with core endurance',
          battlePlan: '4 rounds\n• 8–10 reps\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/k7ylihgl_L%20sit%20pull%20up.png',
          intensityReason: 'L-sit hold demands max compression + endurance simultaneously',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            { icon: 'remove', title: 'Keep legs locked the entire set', description: 'Bent knees reduce the challenge dramatically.' },
            { icon: 'fitness', title: 'Stay active through your shoulders', description: 'Don’t collapse into the hang.' },
            { icon: 'flame', title: 'The burn should become relentless', description: 'Especially during later rounds.' }
          ]
        },
        {
          name: 'Hanging Windshield Wipers',
          duration: '12–14 min',
          description: 'Full rotational raises building advanced oblique and core strength',
          battlePlan: '4 rounds\n• 8 per side\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/xv28u0mp_windshield%20wipers.png',
          intensityReason: 'Full rotation overloads the obliques with elite control',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            { icon: 'timer', title: 'Move slower than your ego wants to', description: 'Control is what makes this exercise elite.' },
            { icon: 'arrow-up', title: 'Keep hips elevated throughout', description: 'Dropping hips removes abdominal tension.' },
            { icon: 'shield', title: 'Near failure should feel technical', description: 'Not sloppy or uncontrolled.' }
          ]
        },
        {
          name: 'Toes-to-Bar Burnout',
          duration: '12–14 min',
          description: 'High-rep toes-to-bar sets pushing abdominal endurance and grip',
          battlePlan: '3 rounds\n• 15–20 reps\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/khia1c9e_hanging%20toe%20to%20bar%202.png',
          intensityReason: 'High-rep volume drives abdominal endurance and grip stamina',
          movement_focus: 'core',
          abs_slot_eligible: true,
          moodTips: [
            { icon: 'repeat', title: 'Stay moving once the burn starts', description: 'Continuous reps create the challenge.' },
            { icon: 'pulse', title: 'Manage your breathing under fatigue', description: 'Rhythm keeps reps efficient.' },
            { icon: 'flame', title: 'Last rounds should empty you', description: 'Near failure is the target here.' }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Parallel bars / dip station',
    icon: 'remove',
    workouts: {
      beginner: [
        {
          name: 'Dip Prep',
          duration: '16–22 min',
          description: 'Support holds, band-assisted dips, knee tucks closer.',
          battlePlan: 'Parallel Bar Support Hold\n• 3 × 15–25s (RPE 4), 60s rest\nBand-Assisted Dips\n• 3 × 5–7 (RPE 4), 75s rest\nParallel Bar Knee Tucks\n• 3 × 10–12 (RPE 4), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241218/mood_app/workout_images/eyqn2a9a_download_10_.jpg',
          intensityReason: 'Support holds and assisted dips teach body alignment.',
          movement_focus: 'upper_push',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Shoulders down; long neck',
              description: 'Shoulders down; long neck'
            },
            {
              icon: 'body',
              title: 'Small depth you control',
              description: 'Small depth you control'
            }
          ]
        },
        {
          name: 'Angle Rows',
          duration: '16–22 min',
          description: 'Bar rows, band dips light, dead bug finish for light challenge.',
          battlePlan: 'Parallel Bar Inverted Row (knees bent)\n• 3 × 8–10 (RPE 4), 60s rest\nBand-Assisted Dips\n• 3 × 5–7 (RPE 4), 75s rest\nDead Bug\n• 3 × 10–12/side (RPE 4), 45–60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241212/mood_app/workout_images/bhu7tjin_download_14_.jpg',
          intensityReason: 'Bar rows build scap control with simple setup.',
          movement_focus: 'mixed_upper',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Elbows to ribs line',
              description: 'Elbows to ribs line'
            },
            {
              icon: 'body',
              title: 'Ribs down on dip reps',
              description: 'Ribs down on dip reps'
            }
          ]
        },
        {
          name: 'Support + Core',
          duration: '16–22 min',
          description: 'Support holds, assisted dip eccentrics, knee raises.',
          battlePlan: 'Parallel Bar Support Hold\n• 3 × 20–30s (RPE 4), 60s rest\nAssisted Dip Eccentric (3–4s down)\n• 3 × 3–5 (RPE 4), 75s rest\nHanging Knee Raise (on bars)\n• 3 × 8–10 (RPE 4), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241253/mood_app/workout_images/v42ceu0x_download_11_.jpg',
          intensityReason: 'Stable support positions teach shoulder packing.',
          movement_focus: 'upper_push',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Pack shoulders down',
              description: 'Pack shoulders down'
            },
            {
              icon: 'body',
              title: 'Slow 3–4s lowers',
              description: 'Slow 3–4s lowers'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Dip Lines',
          duration: '22–28 min',
          description: 'Dips banded, bar rows, knee raise strict to finish.',
          battlePlan: 'Band-Assisted Dips\n• 4 × 6–8 (RPE 5), 90s rest\nParallel Bar Inverted Row (feet flat)\n• 4 × 8–10 (RPE 5), 75s rest\nParallel Bar Knee Raise\n• 3 × 10–12 (RPE 5), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241212/mood_app/workout_images/bhu7tjin_download_14_.jpg',
          intensityReason: 'Moderate dip volume strengthens chest and triceps.',
          movement_focus: 'mixed_upper',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Slight torso forward',
              description: 'Slight torso forward'
            },
            {
              icon: 'body',
              title: 'Elbows 45–60° track',
              description: 'Elbows 45–60° track'
            }
          ]
        },
        {
          name: 'Support Strength',
          duration: '22–28 min',
          description: 'Support holds, tempo dips, dead bugs for brace.',
          battlePlan: 'Parallel Bar Support Hold\n• 4 × 25–35s (RPE 5), 60–75s rest\nTempo Dips (3s down) with Band\n• 4 × 5–7 (RPE 5–6), 90s rest\nDead Bug\n• 3 × 12–14/side (RPE 5), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241208/mood_app/workout_images/acv740pg_download_12_.jpg',
          intensityReason: 'Isometrics add control for safer pressing patterns.',
          movement_focus: 'upper_push',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Lock shoulder position',
              description: 'Lock shoulder position'
            },
            {
              icon: 'body',
              title: '2–1–3 tempo on dips',
              description: '2–1–3 tempo on dips'
            }
          ]
        },
        {
          name: 'Mixed Angle',
          duration: '22–28 min',
          description: 'Pronated bar rows, dips, knee tucks controlled.',
          battlePlan: 'Parallel Bar Row (pronated, feet bent)\n• 4 × 8–10 (RPE 5), 75s rest\nBand-Assisted Dips\n• 4 × 6–8 (RPE 5–6), 90s rest\nParallel Bar Knee Tucks\n• 3 × 10–12 (RPE 5), 60s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241253/mood_app/workout_images/v42ceu0x_download_11_.jpg',
          intensityReason: 'Pair rows with dips for balanced push–pull control.',
          movement_focus: 'mixed_upper',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Chest to bar line',
              description: 'Chest to bar line'
            },
            {
              icon: 'body',
              title: 'Keep tucks slow, no swing',
              description: 'Keep tucks slow, no swing'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Strict Dips',
          duration: '26–34 min',
          description: 'Strict dips, feet-elevated rows, L-sit tuck holds.',
          battlePlan: 'Strict Parallel Bar Dips\n• 5 × 5–7 (RPE 6), 90s rest\nFeet-Elevated Parallel Bar Row\n• 4 × 8–10 (RPE 6), 75s rest\nParallel Bar Tuck L-Sit Hold\n• 4 × 10–15s (RPE 6), 60–75s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241208/mood_app/workout_images/acv740pg_download_12_.jpg',
          intensityReason: 'Bodyweight dips build pressing power and stability.',
          movement_focus: 'mixed_upper',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Shoulders packed down',
              description: 'Shoulders packed down'
            },
            {
              icon: 'body',
              title: 'Control depth; no bounce',
              description: 'Control depth; no bounce'
            }
          ]
        },
        {
          name: 'Eccentric Power',
          duration: '26–34 min',
          description: 'Dip negatives weighted, hard rows, strict knee raises.',
          battlePlan: 'Weighted Eccentric Dip\n• 5 × 2–3 (RPE 6–7), 120s rest\nParallel Bar Row (feet extended)\n• 4 × 8–10 (RPE 6), 75s rest\nParallel Bar Knee Raise\n• 4 × 10–12 (RPE 6), 60–75s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241212/mood_app/workout_images/bhu7tjin_download_14_.jpg',
          intensityReason: 'Weighted eccentrics increase force in safe ranges.',
          movement_focus: 'mixed_upper',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: '4–5s controlled lowers',
              description: '4–5s controlled lowers'
            },
            {
              icon: 'body',
              title: 'Keep elbows 45–60°',
              description: 'Keep elbows 45–60°'
            }
          ]
        },
        {
          name: 'Midrange Control',
          duration: '26–34 min',
          description: 'Dip 1.5 reps, chest-to-bar rows, tuck L-sit holds for advanced challenge.',
          battlePlan: 'Dips (1.5 reps: half up, down, full press)\n• 4 × 4–6 (RPE 6), 120s rest\nChest-to-Bar Parallel Bar Row\n• 4 × 8–10 (RPE 6), 75s rest\nTuck L-Sit Hold\n• 4 × 12–18s (RPE 6), 60–75s rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241224/mood_app/workout_images/gua5r4vy_download_13_.jpg',
          intensityReason: '1.5 dip reps increase time under tension efficiently.',
          movement_focus: 'mixed_upper',
          abs_slot_eligible: false,
          moodTips: [
            {
              icon: 'body',
              title: 'Pause mid, then press',
              description: 'Pause mid, then press'
            },
            {
              icon: 'body',
              title: 'Keep ribs down; no sway',
              description: 'Keep ribs down; no sway'
            }
          ]
        }
      ]
    }
  },
  // Include additional equipment from additionalWorkoutDatabase
  ...additionalWorkoutDatabase
];
