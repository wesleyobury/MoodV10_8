import { EquipmentWorkouts } from '../types/workout';

export const compoundLegsWorkoutDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Dumbbells',
    icon: 'barbell',
    workouts: {
      beginner: [
        {
          name: 'Goblet Squat',
          duration: '10–12 min',
          description: 'Simple squat variation teaches control and balance with front load support.',
          battlePlan: '3 rounds\n• 10-12 goblet squats\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241347/mood_app/workout_images/iq16b1nm_download.jpg',
          intensityReason: 'Front load squat builds posture and safe depth.',
          moodTips: [
            {
              icon: 'body',
              title: 'Hold dumbbell at chest to keep torso upright',
              description: 'Chest up, core tight for proper spinal alignment during movement.'
            },
            {
              icon: 'trending-down',
              title: 'Push knees out, sit hips down under control',
              description: 'Slow descent builds strength and prevents knee valgus collapse.'
            }
          ]
        },
        {
          name: 'DB RDL',
          duration: '10–12 min',
          description: 'Dumbbell hinge builds strength safely for beginners with proper form.',
          battlePlan: '3 rounds\n• 8-10 dumbbell RDLs\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241323/mood_app/workout_images/5v2oyit3_dbrdl.jpg',
          intensityReason: 'Hip hinge pattern develops hamstrings + glutes.',
          moodTips: [
            {
              icon: 'construct',
              title: 'Keep back flat, hinge hips not spine',
              description: 'Neutral spine protects back while maximizing hamstring engagement.'
            },
            {
              icon: 'flash',
              title: 'Glide DBs down thighs until hamstring stretch',
              description: 'Feel the stretch in hamstrings before driving hips forward to stand.'
            }
          ]
        },
        {
          name: 'Box Goblet Squat',
          duration: '10–12 min',
          description: 'Box-guided goblet squats reinforce depth and control',
          battlePlan: '3 rounds\n• 10–12 Box Goblet Squats\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241263/mood_app/workout_images/0t57iowy_db_goblet_squat.jpg',
          intensityReason: 'Box squat builds confidence and consistent depth',
          moodTips: [
            {
              icon: 'construct',
              title: 'Use the box as a guide',
              description: 'Lightly tap the box to confirm depth, then stand immediately.'
            },
            {
              icon: 'body',
              title: 'Chest stays tall',
              description: 'Let the dumbbell counterbalance so the torso stays upright.'
            },
            {
              icon: 'timer',
              title: 'Move slow and steady',
              description: 'Smooth tempo builds confidence and joint control.'
            }
          ]
        },
        {
          name: 'Supported Reverse Lunge',
          duration: '10–12 min',
          description: 'Assisted lunges reduce balance demand for beginners',
          battlePlan: '3 rounds\n• 8 per leg Reverse Lunges\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241281/mood_app/workout_images/cnnnnm30_db_reverse_lunge.jpg',
          intensityReason: 'Support reduces balance stress while building strength',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Hold support lightly',
              description: 'Use it for balance, not to pull yourself up.'
            },
            {
              icon: 'resize',
              title: 'Step back long',
              description: 'Longer step reduces knee stress and improves glute engagement.'
            },
            {
              icon: 'flash',
              title: 'Drive through front heel',
              description: 'Feel quad and glute push you up together.'
            }
          ]
        },
        {
          name: 'Supported Step-Ups',
          duration: '10–12 min',
          description: 'Step-ups with light support to build balance, control, and rhythm.',
          battlePlan: '3 rounds\n• 8 per leg\nRest 75s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_b7d575ca-4d26-45c9-b472-973ba87a5be6/artifacts/7tvi5pvu_db%20step%20up.png',
          intensityReason: 'Support + light load builds confidence in the step pattern.',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Use support if needed',
              description: 'Build confidence while learning movement.'
            },
            {
              icon: 'footsteps',
              title: 'Step fully onto box',
              description: 'Whole foot drives upward.'
            },
            {
              icon: 'time',
              title: 'Move at your pace',
              description: 'Control over speed.'
            }
          ]
        },
        {
          name: 'Controlled Walking Lunge',
          duration: '10–12 min',
          description: 'Forward lunges focusing on balance, rhythm, and controlled reps.',
          battlePlan: '3 rounds\n• 8–10 per leg\nRest 75s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_b7d575ca-4d26-45c9-b472-973ba87a5be6/artifacts/rurzgx9a_db%20walking%20lunge.png',
          intensityReason: 'Light load + steady cadence locks in the lunge pattern before adding intensity.',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Take comfortable steps',
              description: 'Build confidence in balance.'
            },
            {
              icon: 'body',
              title: 'Stay upright',
              description: 'Maintain positioning.'
            },
            {
              icon: 'pulse',
              title: 'Move smoothly',
              description: 'No rushing.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Bulgarian Split Squat',
          duration: '14–16 min',
          description: 'Advanced split squat builds quads and glute drive with elevated rear foot.',
          battlePlan: '4 rounds\n• 8-10 bulgarian split squats per leg\nRest 75-90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241353/mood_app/workout_images/mxfs858v_dbbss.jpg',
          intensityReason: 'Rear foot elevated squat raises ROM + intensity.',
          moodTips: [
            {
              icon: 'construct',
              title: 'Front shin vertical, stay upright',
              description: 'Avoid leaning forward; keep torso tall for proper quad loading.'
            },
            {
              icon: 'timer',
              title: 'Descend slow, avoid bouncing knee',
              description: 'Control prevents injury and maximizes muscle activation.'
            }
          ]
        },
        {
          name: 'Lateral Lunge',
          duration: '14–16 min',
          description: 'Trains quads, glutes, and groin through lateral range of motion.',
          battlePlan: '3 rounds\n• 8 per side Lateral Lunges\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241344/mood_app/workout_images/hiyqkn20_db_lat_lunge.jpg',
          intensityReason: 'Side lunge develops stability and hip strength.',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Step wide, sit hips over working leg',
              description: 'Load the working side while keeping opposite leg straight.'
            },
            {
              icon: 'body',
              title: 'Keep chest tall, toes forward entire set',
              description: 'Maintain posture to prevent compensations and maximize effectiveness.'
            }
          ]
        },
        {
          name: 'Front-Foot Elevated Split Squat',
          duration: '14–16 min',
          description: 'Elevated front foot increases quad loading and depth',
          battlePlan: '4 rounds\n• 8 per leg Split Squats\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241295/mood_app/workout_images/rvwet9i1_db_elevated_split_squat.jpg',
          intensityReason: 'Front elevation deepens range of motion for quads',
          moodTips: [
            {
              icon: 'arrow-up',
              title: 'Front heel elevated',
              description: 'Allows deeper knee bend without heel lift.'
            },
            {
              icon: 'body',
              title: 'Torso stays vertical',
              description: 'Keeps emphasis on quads instead of glutes.'
            },
            {
              icon: 'timer',
              title: 'Slow descent',
              description: 'Take a controlled 3 seconds down to build tension.'
            }
          ]
        },
        {
          name: 'Dumbbell Squat Drop Set',
          duration: '14–16 min',
          description: 'Squats extended using fast dumbbell weight drops',
          battlePlan: '3 rounds\n• 8 DB Squats\n• Drop → 8\n• Drop → 8\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241293/mood_app/workout_images/p55uxvw3_db_squat.jpg',
          intensityReason: 'Drop sets extend time under tension for maximum pump',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drops are immediate',
              description: 'Change dumbbells quickly to maintain fatigue.'
            },
            {
              icon: 'trending-down',
              title: 'Reduce 20–30% per drop',
              description: 'Enough to keep reps clean, not sloppy.'
            },
            {
              icon: 'body',
              title: 'Posture stays locked',
              description: 'Chest tall and knees tracking forward throughout.'
            }
          ]
        },
        {
          name: 'Tempo Step-Ups',
          duration: '14–16 min',
          description: 'Step-ups using slow eccentrics to increase tension and control.',
          battlePlan: '4 rounds\n• 8 per leg (3s down)\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_b7d575ca-4d26-45c9-b472-973ba87a5be6/artifacts/7tvi5pvu_db%20step%20up.png',
          intensityReason: 'Tempo eccentric stresses single-leg quads + glutes for hypertrophy.',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Control the descent',
              description: '3-second eccentric builds stability.'
            },
            {
              icon: 'body',
              title: 'Stay tall at top',
              description: 'Full extension each rep.'
            },
            {
              icon: 'pulse',
              title: 'Keep rhythm steady',
              description: 'No rushing.'
            }
          ]
        },
        {
          name: 'Walking Lunge Pulses',
          duration: '14–16 min',
          description: 'Walking lunges extended with pulses for added tension and burn.',
          battlePlan: '3 rounds\n• 8 per leg + 3 pulses\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_b7d575ca-4d26-45c9-b472-973ba87a5be6/artifacts/rurzgx9a_db%20walking%20lunge.png',
          intensityReason: 'Pulses extend time under tension, hammering quads and glutes mid-step.',
          moodTips: [
            {
              icon: 'pulse',
              title: 'Pulse at bottom',
              description: 'Increase time under tension.'
            },
            {
              icon: 'trending-down',
              title: 'Stay low between steps',
              description: 'Constant load.'
            },
            {
              icon: 'flame',
              title: 'Control fatigue',
              description: 'Keep reps clean.'
            }
          ]
        },
        {
          name: 'Goblet Squat Tempo',
          duration: '14–16 min',
          description: 'Goblet squats using slow eccentrics to build quad control.',
          battlePlan: '4 rounds\n• 10–12 reps\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_b7d575ca-4d26-45c9-b472-973ba87a5be6/artifacts/tsuxq68j_db%20goblet%20squat.png',
          intensityReason: 'Tempo eccentric maximizes quad tension without heavier loading.',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Slow descent',
              description: '3-second eccentric.'
            },
            {
              icon: 'body',
              title: 'Stay upright',
              description: 'DB helps balance.'
            },
            {
              icon: 'flag',
              title: 'Keep depth consistent',
              description: 'Don’t shorten reps.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Squat + RDL Superset',
          duration: '16–18 min',
          description: 'Superset floods quads + hamstrings with volume for complete development.',
          battlePlan: '4 rounds\n• 8 DB Squats\n• 8 DB RDLs\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241391/mood_app/workout_images/elc9qz74_download_13_.jpg',
          intensityReason: 'Push pull pairing overloads full lower body range.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Perform squats fast, RDLs slow and strict',
              description: 'Different tempos maximize both power and muscle tension.'
            },
            {
              icon: 'timer',
              title: 'Transition quickly to maintain time under tension',
              description: 'Minimal rest between exercises keeps muscles working continuously.'
            }
          ]
        },
        {
          name: 'Squat Iso Hold + Pulses',
          duration: '16–18 min',
          description: 'Brutal high tension squat burns and builds depth strength.',
          battlePlan: '3 rounds\n• 10 Squats + 10s Hold + 6 Pulses\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241368/mood_app/workout_images/zkmq6vqh_download_1_.jpg',
          intensityReason: 'Long isos with pulses maximize quad fatigue.',
          moodTips: [
            {
              icon: 'timer',
              title: 'Hold bottom squat 10s, then pulse small reps',
              description: 'Isometric hold followed by mini-reps creates intense muscle burn.'
            },
            {
              icon: 'construct',
              title: 'Keep heels planted, chest upright whole time',
              description: 'Maintain proper position throughout hold and pulses for safety.'
            }
          ]
        },
        {
          name: 'Double Dumbbell Front Squat',
          duration: '16–18 min',
          description: 'Front-loaded squats demanding core and quad strength',
          battlePlan: '4 rounds\n• 6–8 Front Squats\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241297/mood_app/workout_images/x54zcr7d_db_front_squat.jpg',
          intensityReason: 'Front load challenges core stability under heavy load',
          moodTips: [
            {
              icon: 'barbell',
              title: 'DBs racked at shoulders',
              description: 'Elbows slightly forward to support upright posture.'
            },
            {
              icon: 'shield',
              title: 'Brace hard before descent',
              description: 'Core pressure protects spine under heavy load.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Fatigue can hit suddenly in front-loaded positions.'
            }
          ]
        },
        {
          name: 'Bulgarian Split Squat Burnout',
          duration: '16–18 min',
          description: 'High-fatigue unilateral squat finisher for quads',
          battlePlan: '3 rounds\n• 12–15 Bulgarian Split Squats per leg\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241353/mood_app/workout_images/mxfs858v_dbbss.jpg',
          intensityReason: 'High-rep unilateral work pushes quads to failure',
          moodTips: [
            {
              icon: 'body',
              title: 'Stay tall through torso',
              description: 'Shifts stress toward quads instead of hips.'
            },
            {
              icon: 'flame',
              title: 'Continuous reps to failure',
              description: 'No pausing at the top during the set.'
            },
            {
              icon: 'alert',
              title: 'Drop dumbbells if needed',
              description: 'Finish set safely with bodyweight if balance fades.'
            }
          ]
        },
        {
          name: 'Explosive Step-Up + Eccentric Return',
          duration: '16–18 min',
          description: 'Explosive step-ups paired with slow controlled eccentric returns.',
          battlePlan: '4 rounds\n• 6 per leg\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_b7d575ca-4d26-45c9-b472-973ba87a5be6/artifacts/7tvi5pvu_db%20step%20up.png',
          intensityReason: 'Power on the way up + slow return delivers maximum single-leg load.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Explode up hard',
              description: 'Max power each rep.'
            },
            {
              icon: 'flame',
              title: 'Push near failure',
              description: 'Final sets should challenge limit.'
            },
            {
              icon: 'trending-down',
              title: 'Own the descent',
              description: 'Build serious tension.'
            }
          ]
        },
        {
          name: 'Walking Lunge Drop Set',
          duration: '16–18 min',
          description: 'Continuous lunges extended with weight drops to near failure.',
          battlePlan: '3 rounds\n• 10 per leg\n• Drop → 10\n• Drop → BW to failure\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_b7d575ca-4d26-45c9-b472-973ba87a5be6/artifacts/rurzgx9a_db%20walking%20lunge.png',
          intensityReason: 'Continuous load reductions push past traditional failure for maximum burn.',
          moodTips: [
            {
              icon: 'arrow-forward',
              title: 'Keep moving forward',
              description: 'No stopping.'
            },
            {
              icon: 'flame',
              title: 'Push near failure',
              description: 'Last sets should burn.'
            },
            {
              icon: 'body',
              title: 'Finish bodyweight',
              description: 'Full burnout.'
            }
          ]
        },
        {
          name: 'Goblet Squat 1.5 Reps',
          duration: '16–18 min',
          description: 'Goblet squats using 1.5 reps to increase time under tension.',
          battlePlan: '4 rounds\n• 8–10 reps\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_b7d575ca-4d26-45c9-b472-973ba87a5be6/artifacts/tsuxq68j_db%20goblet%20squat.png',
          intensityReason: '1.5 reps double the bottom-half stress, maxing out quad time under tension.',
          moodTips: [
            {
              icon: 'repeat',
              title: 'Half + full rep',
              description: 'One cycle = one rep.'
            },
            {
              icon: 'flame',
              title: 'Push near failure',
              description: 'Final rounds should hit limit.'
            },
            {
              icon: 'trending-down',
              title: 'Stay controlled',
              description: 'No bouncing.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Squat Rack',
    icon: 'square-outline',
    workouts: {
      beginner: [
        {
          name: 'Back Squat',
          duration: '10–12 min',
          description: 'Classic barbell squat lays foundation for leg strength and control.',
          battlePlan: '3 rounds\n• 8-10 back squats\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241394/mood_app/workout_images/gxoxkpbs_download_5_.jpg',
          intensityReason: 'Foundational squat builds strength + control.',
          moodTips: [
            {
              icon: 'shield',
              title: 'Brace core, grip bar tight, chest lifted',
              description: 'Create full-body tension before descending for stability and power.'
            },
            {
              icon: 'trending-down',
              title: 'Sit hips back, knees out, heels planted',
              description: 'Proper movement pattern prevents knee stress and maximizes power.'
            }
          ]
        },
        {
          name: 'Reverse Lunge',
          duration: '10–12 min',
          description: 'Reverse lunge reduces strain while building single leg strength.',
          battlePlan: '3 rounds\n• 8 per leg Reverse Lunges\nRest 75-90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241388/mood_app/workout_images/a96gl1sh_download_7_.jpg',
          videoUrl: 'https://res.cloudinary.com/dfsygar5c/video/upload/v1770240475/mood_app/workout_videos/BB_lunge.mov',
          intensityReason: 'Teaches single leg balance with less knee stress.',
          moodTips: [
            {
              icon: 'construct',
              title: 'Step backward, front shin vertical',
              description: 'Reverse pattern is easier on knees than forward lunges.'
            },
            {
              icon: 'fitness',
              title: 'Keep torso upright, drive through front heel',
              description: 'Front leg does the work while maintaining proper posture.'
            }
          ]
        },
        {
          name: 'Rack RDL',
          duration: '10–12 min',
          description: 'Beginner hinge teaches depth and hamstring control with barbell.',
          battlePlan: '3 rounds\n• 8-10 rack rdls\nRest 75-90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241277/mood_app/workout_images/5q9lqk7k_bb_rdl.jpg',
          intensityReason: 'Barbell hinge pattern develops glutes + hams.',
          moodTips: [
            {
              icon: 'construct',
              title: 'Bar close to legs, hinge hips not spine',
              description: 'Keep barbell path straight and spine neutral throughout.'
            },
            {
              icon: 'shield',
              title: 'Stop at stretch, don\'t let back round',
              description: 'Maintain back position - flexibility comes with time and practice.'
            }
          ]
        },
        {
          name: 'Box Back Squat',
          duration: '12–14 min',
          description: 'Box-guided squats reinforcing depth and control',
          battlePlan: '3 rounds\n• 8–10 Box Back Squats\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241296/mood_app/workout_images/wwl8m04q_back_squat.jpg',
          intensityReason: 'Box squat builds consistent depth and confidence',
          moodTips: [
            {
              icon: 'cube',
              title: 'Box sets consistent depth',
              description: 'Light touch confirms depth without sitting fully.'
            },
            {
              icon: 'shield',
              title: 'Brace before every rep',
              description: 'Core tension protects spine and improves force.'
            },
            {
              icon: 'arrow-up',
              title: 'Drive straight up',
              description: 'Knees and hips rise together for clean mechanics.'
            }
          ]
        },
        {
          name: 'Tempo Back Squat',
          duration: '12–14 min',
          description: 'Slow eccentric squats building confidence and control',
          battlePlan: '3 rounds\n• 8 Back Squats (3s eccentric)\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241299/mood_app/workout_images/xfs748m6_bb_back_squat_2.jpg',
          intensityReason: 'Tempo work increases time under tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Slow descent builds stability',
              description: 'Three-second lowering keeps tension on legs.'
            },
            {
              icon: 'footsteps',
              title: 'Balance through mid-foot',
              description: 'Prevents tipping forward or backward.'
            },
            {
              icon: 'body',
              title: 'Smooth ascent only',
              description: 'No bouncing out of the bottom.'
            }
          ]
        },
        {
          name: 'Zercher Box Squat',
          duration: '12–14 min',
          description: 'Zercher squats using box support to reinforce depth and control',
          battlePlan: '3 rounds\n• 8–10 reps\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/5n35ypfy_zercher%20squat.png',
          intensityReason: 'Box guidance teaches safe Zercher depth and bracing',
          moodTips: [
            {
              icon: 'square-outline',
              title: 'Use box for guidance',
              description: 'Build confidence in depth.'
            },
            {
              icon: 'shield',
              title: 'Keep elbows tight',
              description: 'Secure bar position.'
            },
            {
              icon: 'timer',
              title: 'Move controlled',
              description: 'Focus on form.'
            }
          ]
        },
        {
          name: 'Barbell Static Lunge',
          duration: '12–14 min',
          description: 'Stationary lunges focusing on balance, control, and positioning',
          battlePlan: '3 rounds\n• 8 per leg\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/phvexum7_bb%20lunge.png',
          intensityReason: 'Stationary stance lets beginners groove the lunge pattern',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Stay planted',
              description: 'Build stability.'
            },
            {
              icon: 'body',
              title: 'Keep torso tall',
              description: 'Proper posture.'
            },
            {
              icon: 'timer',
              title: 'Move controlled',
              description: 'Build confidence.'
            }
          ]
        },
        {
          name: 'Bodyweight Jump Squat',
          duration: '10–12 min',
          description: 'Jump squats introducing explosive movement with safe mechanics',
          battlePlan: '3 rounds\n• 8–10 reps\nRest 75s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/hkwmfgkl_jump%20squat.png',
          intensityReason: 'Bodyweight jumps teach soft landings before adding load',
          moodTips: [
            {
              icon: 'arrow-down',
              title: 'Land softly',
              description: 'Protect joints.'
            },
            {
              icon: 'flash',
              title: 'Jump controlled',
              description: 'Not max effort yet.'
            },
            {
              icon: 'body',
              title: 'Build comfort',
              description: 'Focus on form.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Front Squat',
          duration: '14–16 min',
          description: 'Front squat builds quads while demanding upright posture.',
          battlePlan: '4 rounds\n• 6-8 front squats\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241365/mood_app/workout_images/wag3ztrn_bbfs.jpg',
          videoUrl: 'https://res.cloudinary.com/dfsygar5c/video/upload/v1770240478/mood_app/workout_videos/BB_front_squat.mov',
          intensityReason: 'Upright bar placement drives quad and core load.',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Elbows high, bar on shoulders not wrists',
              description: 'Proper rack position distributes load safely across shoulders.'
            },
            {
              icon: 'construct',
              title: 'Stay upright, descend slow, drive up',
              description: 'Front load forces good posture - lean forward and you\'ll drop the bar.'
            }
          ]
        },
        {
          name: 'Bulgarian Split Squat',
          duration: '14–16 min',
          description: 'Advanced unilateral builder with deeper range and balance challenge.',
          battlePlan: '4 rounds\n• 8-10 bulgarians per side\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241324/mood_app/workout_images/8m6t0a7f_Screenshot_2025-12-06_at_7_08_54_PM.jpg',
          intensityReason: 'Rear foot squat overloads quads and balance.',
          moodTips: [
            {
              icon: 'construct',
              title: 'Rear foot on bench, front shin vertical',
              description: 'Setup position determines effectiveness - get positioning right first.'
            },
            {
              icon: 'fitness',
              title: 'Lower straight down — avoid hip shift',
              description: 'Keep hips square and descend vertically for maximum quad activation.'
            }
          ]
        },
        {
          name: 'Rack Deficit RDL',
          duration: '14–16 min',
          description: 'Longer range hinge boosts hamstring hypertrophy with elevated position.',
          battlePlan: '3 rounds\n• 8-10 deficit rdls\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241277/mood_app/workout_images/5q9lqk7k_bb_rdl.jpg',
          intensityReason: 'Standing on plates increases hamstring stretch.',
          moodTips: [
            {
              icon: 'construct',
              title: 'Hinge hips back, spine neutral',
              description: 'Longer range requires even more attention to back position.'
            },
            {
              icon: 'timer',
              title: 'Slow 2–3s lower, drive up fast',
              description: 'Eccentric control with explosive concentric maximizes development.'
            }
          ]
        },
        {
          name: 'Front Squat',
          duration: '14–16 min',
          description: 'Front-loaded squats increasing quad and core demand',
          battlePlan: '4 rounds\n• 6–8 Front Squats\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241365/mood_app/workout_images/wag3ztrn_bbfs.jpg',
          intensityReason: 'Front load challenges core stability under load',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Elbows stay high',
              description: 'Prevents torso collapse under load.'
            },
            {
              icon: 'shield',
              title: 'Brace hard before descent',
              description: 'Core pressure supports upright posture.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Front rack fatigue can end sets suddenly.'
            }
          ]
        },
        {
          name: 'Back Squat Drop Set',
          duration: '16–18 min',
          description: 'Squats extended with rapid plate reductions',
          battlePlan: '3 rounds\n• 6 Back Squats\n• Drop → 6\n• Drop → 6\nRest 180s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241394/mood_app/workout_images/gxoxkpbs_download_5_.jpg',
          intensityReason: 'Drop sets extend time under tension for maximum pump',
          moodTips: [
            {
              icon: 'flash',
              title: 'Strip plates immediately',
              description: 'Drops should happen without resting.'
            },
            {
              icon: 'trending-down',
              title: 'Reduce load intelligently',
              description: 'About 20–30% maintains rep quality.'
            },
            {
              icon: 'alert',
              title: 'Rack before form fails',
              description: 'Safety always overrides completion.'
            }
          ]
        },
        {
          name: 'Tempo Zercher Squat',
          duration: '14–16 min',
          description: 'Zercher squats with slow eccentrics increasing tension and control',
          battlePlan: '4 rounds\n• 6–8 reps\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/5n35ypfy_zercher%20squat.png',
          intensityReason: 'Slow eccentric Zercher hammers the core and quads',
          moodTips: [
            {
              icon: 'timer',
              title: '3-second descent',
              description: 'Build strength and stability.'
            },
            {
              icon: 'shield',
              title: 'Brace hard',
              description: 'Core demand is high.'
            },
            {
              icon: 'body',
              title: 'Stay upright',
              description: 'Avoid folding.'
            }
          ]
        },
        {
          name: 'Barbell Walking Lunge',
          duration: '14–16 min',
          description: 'Loaded walking lunges building unilateral strength and control',
          battlePlan: '4 rounds\n• 8 per leg\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/phvexum7_bb%20lunge.png',
          intensityReason: 'Walking pattern adds balance demand to loaded lunge',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Step consistent',
              description: 'Maintain rhythm.'
            },
            {
              icon: 'timer',
              title: 'Stay controlled',
              description: 'Avoid rushing.'
            },
            {
              icon: 'flash',
              title: 'Manage fatigue',
              description: 'Keep reps clean.'
            }
          ]
        },
        {
          name: 'Jump Squat Repeats',
          duration: '14–16 min',
          description: 'Repeated jump squats improving power output and endurance',
          battlePlan: '4 rounds\n• 10 reps\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/hkwmfgkl_jump%20squat.png',
          intensityReason: 'Repeated jumps build explosive endurance',
          moodTips: [
            {
              icon: 'flash',
              title: 'Explode each rep',
              description: 'Max intent upward.'
            },
            {
              icon: 'refresh',
              title: 'Reset quickly',
              description: 'Maintain rhythm.'
            },
            {
              icon: 'body',
              title: 'Stay controlled',
              description: 'Clean landings.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Pause Back Squat',
          duration: '16–18 min',
          description: 'Keeps muscles under control in deepest range with bottom pause.',
          battlePlan: '4 rounds\n• 6 Pause Back Squats\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241394/mood_app/workout_images/gxoxkpbs_download_5_.jpg',
          intensityReason: 'Bottom pause builds strength and eliminates bounce.',
          moodTips: [
            {
              icon: 'timer',
              title: 'Sit into depth, 2s pause, don\'t relax core',
              description: 'Maintain tension throughout pause - don\'t let core go soft.'
            },
            {
              icon: 'flash',
              title: 'Explode upward with controlled breath',
              description: 'Drive up fast after pause while maintaining breathing pattern.'
            }
          ]
        },
        {
          name: 'Walking Lunges',
          duration: '16–18 min',
          description: 'Combination of strength, balance, and conditioning challenge.',
          battlePlan: '3 rounds\n• 20 steps total Walking Lunges\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241388/mood_app/workout_images/a96gl1sh_download_7_.jpg',
          intensityReason: 'Continuous walking pattern overloads endurance.',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Long deliberate steps, plant heel fully',
              description: 'Quality steps with full foot contact for stability and power.'
            },
            {
              icon: 'construct',
              title: 'Keep torso tall, slow controlled descent',
              description: 'Don\'t rush - control each step for maximum effectiveness.'
            }
          ]
        },
        {
          name: 'Squat + RDL Superset',
          duration: '16–18 min',
          description: 'Hybrid superset crushes quads, glutes, and hamstrings together.',
          battlePlan: '4 rounds\n• 6 Back Squats\n• 6 Rack RDLs\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241389/mood_app/workout_images/cj6gx8ak_download_6_.jpg',
          intensityReason: 'Pair squat + hinge for full lower body overload.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Transition quickly; squats upright, RDLs hinging',
              description: 'Opposite movement patterns work complementary muscle groups.'
            },
            {
              icon: 'construct',
              title: 'Breathe steady; stay tight on both',
              description: 'Maintain core bracing throughout both exercises for safety.'
            }
          ]
        },
        {
          name: 'Heavy Back Squat',
          duration: '18–20 min',
          description: 'Low-rep squats emphasizing maximal strength',
          battlePlan: '5 rounds\n• 3–5 Back Squats\nRest 180s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241299/mood_app/workout_images/xfs748m6_bb_back_squat_2.jpg',
          intensityReason: 'Heavy load builds maximal leg strength',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Treat each rep as a single',
              description: 'Full setup and brace every time.'
            },
            {
              icon: 'trending-down',
              title: 'Depth never shortens',
              description: 'Consistent range ensures strength transfer.'
            },
            {
              icon: 'people',
              title: 'Spotter or safety bars required',
              description: 'Mandatory for heavy loading.'
            }
          ]
        },
        {
          name: 'Back Squat Burnout',
          duration: '18–20 min',
          description: 'High-rep finisher driving full leg fatigue',
          battlePlan: '2–3 rounds\n• 15–20 Back Squats\nRest 180s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241296/mood_app/workout_images/wwl8m04q_back_squat.jpg',
          intensityReason: 'High reps push legs to complete fatigue',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Moderate load only',
              description: 'Weight must allow continuous reps.'
            },
            {
              icon: 'body',
              title: 'Controlled breathing',
              description: 'One breath per rep maintains rhythm.'
            },
            {
              icon: 'alert',
              title: 'End set before breakdown',
              description: 'Stop when posture degrades.'
            }
          ]
        },
        {
          name: 'Zercher Pause Squat',
          duration: '16–18 min',
          description: 'Paused Zercher squats building strength in the bottom position',
          battlePlan: '4 rounds\n• 5–6 reps\nRest 150s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/5n35ypfy_zercher%20squat.png',
          intensityReason: 'Bottom pauses develop raw strength out of the hole',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause at depth',
              description: 'Remove all momentum.'
            },
            {
              icon: 'flame',
              title: 'Push near failure',
              description: 'Final rounds should challenge limit.'
            },
            {
              icon: 'shield',
              title: 'Stay tight',
              description: 'No relaxation.'
            }
          ]
        },
        {
          name: 'Barbell Lunge Burnout',
          duration: '16–18 min',
          description: 'High-rep lunges pushing full leg fatigue and endurance output',
          battlePlan: '3 rounds\n• 12 per leg\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/phvexum7_bb%20lunge.png',
          intensityReason: 'Volume lunges drive deep posterior + quad fatigue',
          moodTips: [
            {
              icon: 'flame',
              title: 'Push near failure',
              description: 'Last sets should burn.'
            },
            {
              icon: 'body',
              title: 'Stay upright',
              description: 'Avoid breakdown.'
            },
            {
              icon: 'flash',
              title: 'Finish strong',
              description: 'Don’t quit early.'
            }
          ]
        },
        {
          name: 'Jump Squat Clusters',
          duration: '16–18 min',
          description: 'Clustered jump squats maintaining power output under fatigue',
          battlePlan: '4 rounds\n• 5 + 5 + 5\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/hkwmfgkl_jump%20squat.png',
          intensityReason: 'Cluster sets preserve max power output across reps',
          moodTips: [
            {
              icon: 'flash',
              title: 'Max effort jumps',
              description: 'Every rep explosive.'
            },
            {
              icon: 'flame',
              title: 'Push near failure',
              description: 'Final clusters should hit limit.'
            },
            {
              icon: 'alert',
              title: 'Stay sharp',
              description: 'Quality reps only.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Leg Press Machine',
    icon: 'hardware-chip',
    workouts: {
      beginner: [
        {
          name: 'Neutral Leg Press',
          duration: '10–12 min',
          description: 'Basic press builds safety, posture, and control with machine support.',
          battlePlan: '3 rounds\n• 10-12 neutral leg press\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241398/mood_app/workout_images/l1ouzm6t_download_1_.jpg',
          intensityReason: 'Teaches full ROM with stable machine support.',
          moodTips: [
            {
              icon: 'construct',
              title: 'Feet shoulder width, push through heels',
              description: 'Proper foot placement distributes force evenly across legs.'
            },
            {
              icon: 'shield',
              title: 'Avoid locking knees, control descent',
              description: 'Soft lockout protects joints while maintaining muscle tension.'
            }
          ]
        },
        {
          name: 'Narrow Stance Press',
          duration: '10–12 min',
          description: 'Targets quads more directly in safe range of motion.',
          battlePlan: '3 rounds\n• 10-12 narrow stance press\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241399/mood_app/workout_images/nbzhkmy8_download_2_.jpg',
          intensityReason: 'Close foot stance emphasizes quad activation.',
          moodTips: [
            {
              icon: 'construct',
              title: 'Feet hip width, press knees in line with toes',
              description: 'Narrower stance shifts emphasis to quadriceps muscles.'
            },
            {
              icon: 'timer',
              title: 'Keep reps slow; don\'t bounce at bottom',
              description: 'Control prevents momentum and maximizes muscle tension.'
            }
          ]
        },
        {
          name: 'Paused Leg Press + Iso Hold',
          duration: '10–12 min',
          description: 'Controlled leg press reps with pauses and static finish',
          battlePlan: '3 rounds\n• 10 Leg Press Reps (2s pause at bottom)\n• Immediately 20–30s Iso Hold (halfway up sled)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241279/mood_app/workout_images/8gup9yxv_leg_press.jpg',
          intensityReason: 'Pauses remove momentum and protect knees while iso holds extend time under tension',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause just above depth',
              description: 'Two-second stop removes momentum and protects knees.'
            },
            {
              icon: 'footsteps',
              title: 'Feet mid-platform',
              description: 'Balanced quad and glute engagement.'
            },
            {
              icon: 'timer',
              title: 'Iso hold to finish',
              description: 'Hold keeps legs under tension without heavy load.'
            }
          ]
        },
        {
          name: 'Tempo Leg Press',
          duration: '10–12 min',
          description: 'Controlled leg press emphasizing slow negatives',
          battlePlan: '3 rounds\n• 12 Leg Press (3s eccentric)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241269/mood_app/workout_images/2wjzuq6x_leg_press_2.jpg',
          intensityReason: 'Tempo work increases time under tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Slow descent builds tension',
              description: 'Three-second lowering keeps quads loaded.'
            },
            {
              icon: 'construct',
              title: 'Knees track over toes',
              description: 'Alignment protects joints and improves force transfer.'
            },
            {
              icon: 'arrow-up',
              title: 'Smooth press upward',
              description: 'Avoid jerking the sled off the bottom.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Wide Glute Press',
          duration: '14–16 min',
          description: 'Outside placement recruits posterior chain harder than narrow stance.',
          battlePlan: '4 rounds\n• 8-10 wide stance press\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241398/mood_app/workout_images/l1ouzm6t_download_1_.jpg',
          intensityReason: 'Wider stance shifts target to glutes + hamstrings.',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Feet wide, press outward through heels',
              description: 'Drive knees out in line with toes for glute activation.'
            },
            {
              icon: 'construct',
              title: 'Keep knees tracking over mid foot',
              description: 'Proper alignment prevents knee stress and maximizes power.'
            }
          ]
        },
        {
          name: 'Single Leg Press',
          duration: '14–16 min',
          description: 'One leg at a time reduces imbalances in strength development.',
          battlePlan: '4 rounds\n• 8 per leg Single Leg Press\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241354/mood_app/workout_images/pfq28xzl_Screenshot_2025-12-06_at_7_18_57_PM.jpg',
          intensityReason: 'Unilateral training balances quads + hamstrings.',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Work one leg, keep other foot relaxed',
              description: 'Let non-working leg rest while focusing on working side.'
            },
            {
              icon: 'construct',
              title: 'Don\'t let hips lift off pad',
              description: 'Keep hips square and pressed into back pad throughout.'
            }
          ]
        },
        {
          name: 'Leg Press Pause Reps',
          duration: '14–16 min',
          description: 'Paused reps strengthening bottom-range leg drive',
          battlePlan: '4 rounds\n• 8–10 Leg Press (2s pause)\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241399/mood_app/workout_images/nbzhkmy8_download_2_.jpg',
          intensityReason: 'Pauses eliminate momentum for greater muscle activation',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause near deepest position',
              description: 'Two-second hold removes momentum completely.'
            },
            {
              icon: 'shield',
              title: 'Stay tight in hips',
              description: 'Prevents butt lift and spinal stress.'
            },
            {
              icon: 'flash',
              title: 'Explode out of pause',
              description: 'Builds power from the weakest range.'
            }
          ]
        },
        {
          name: 'Leg Press Drop Ladder',
          duration: '14–16 min',
          description: 'Progressive drops extending quad fatigue',
          battlePlan: '3 rounds\n• 10 reps\n• Drop → 10\n• Drop → 10\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241269/mood_app/workout_images/2wjzuq6x_leg_press_2.jpg',
          intensityReason: 'Drop sets extend time under tension for maximum pump',
          moodTips: [
            {
              icon: 'flash',
              title: 'Strip plates immediately',
              description: 'Drops should happen without rest.'
            },
            {
              icon: 'trending-down',
              title: 'Reduce weight intentionally',
              description: 'Roughly 25% per drop maintains rep quality.'
            },
            {
              icon: 'body',
              title: 'Breathing controls fatigue',
              description: 'Strong exhales help push through later reps.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Drop Set Press',
          duration: '16–18 min',
          description: 'Extends time under tension with progressive load reduction.',
          battlePlan: '3 rounds\n• 8 Heavy Press → Drop x2 (6–8 reps each)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241269/mood_app/workout_images/2wjzuq6x_leg_press_2.jpg',
          intensityReason: 'Strip weight quickly to overload muscle fatigue.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Start heavy, drop 20% to continue without rest',
              description: 'Quick weight changes maximize fatigue and muscle recruitment.'
            },
            {
              icon: 'construct',
              title: 'Keep range consistent all drops',
              description: 'Don\'t shorten range as you fatigue - maintain quality reps.'
            }
          ]
        },
        {
          name: 'Pause Press',
          duration: '16–18 min',
          description: 'Pausing forces muscles to do all the hard work without momentum.',
          battlePlan: '4 rounds\n• 8 Leg Press Reps (2s pause at bottom)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241279/mood_app/workout_images/8gup9yxv_leg_press.jpg',
          intensityReason: 'Mid rep pause kills momentum and builds tension.',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause 2s at bottom, don\'t bounce knees',
              description: 'Hold depth position while maintaining muscle tension throughout.'
            },
            {
              icon: 'construct',
              title: 'Push out smooth, no jerking stack',
              description: 'Controlled movement from pause prevents joint stress.'
            }
          ]
        },
        {
          name: 'Heavy Low-Rep Leg Press',
          duration: '16–18 min',
          description: 'Max-strength leg pressing with heavy loads',
          battlePlan: '5 rounds\n• 5–6 Leg Press\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241269/mood_app/workout_images/2wjzuq6x_leg_press_2.jpg',
          intensityReason: 'Heavy load builds maximal leg strength',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Foot placement stays consistent',
              description: 'Mid-platform stance balances power and safety.'
            },
            {
              icon: 'shield',
              title: 'Brace core before descent',
              description: 'Prevents hip shift under heavy sled loads.'
            },
            {
              icon: 'people',
              title: 'Spotter strongly recommended',
              description: 'Heavy failures occur quickly on leg press.'
            }
          ]
        },
        {
          name: 'Leg Press Burnout',
          duration: '18–20 min',
          description: 'High-rep finisher driving complete quad exhaustion',
          battlePlan: '3 rounds\n• 20–25 Leg Press\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241279/mood_app/workout_images/8gup9yxv_leg_press.jpg',
          intensityReason: 'High reps push quads to complete fatigue',
          moodTips: [
            {
              icon: 'repeat',
              title: 'No lockout at top',
              description: 'Continuous tension maximizes metabolic stress.'
            },
            {
              icon: 'barbell',
              title: 'Moderate load only',
              description: 'Weight must allow uninterrupted high reps.'
            },
            {
              icon: 'flame',
              title: 'Expect extreme quad pump',
              description: 'Swelling and burn signal effective fatigue.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Hack Squat Machine',
    icon: 'triangle',
    workouts: {
      beginner: [
        {
          name: 'Neutral Hack Squat',
          duration: '10–12 min',
          description: 'Basic hack squat introduces form and confidence with machine guidance.',
          battlePlan: '3 rounds\n• 10-12 hack squats\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241396/mood_app/workout_images/k4t4lzbt_download.jpg',
          intensityReason: 'Machine guidance builds squat mechanics safely.',
          moodTips: [
            {
              icon: 'construct',
              title: 'Stand tall, feet shoulder width, spine braced',
              description: 'Proper setup position ensures safe and effective movement.'
            },
            {
              icon: 'trending-down',
              title: 'Lower until thighs parallel, push through heels',
              description: 'Good depth with heel drive maximizes leg muscle activation.'
            }
          ]
        },
        {
          name: 'Narrow Hack Squat',
          duration: '10–12 min',
          description: 'Builds quad dominant strength with stable machine support.',
          battlePlan: '3 rounds\n• 8-10 narrow hack squats\nRest 75s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_workout-visuals-1/artifacts/ffi2msmn_hs.avif',
          intensityReason: 'Narrow stance emphasizes quads more directly.',
          moodTips: [
            {
              icon: 'construct',
              title: 'Feet close, knees track forward with toes',
              description: 'Narrow stance shifts load to quadriceps muscles.'
            },
            {
              icon: 'shield',
              title: 'Maintain upright back pressing into pad',
              description: 'Use back pad for support while maintaining spine position.'
            }
          ]
        },
        {
          name: 'Controlled Hack Squat',
          duration: '10–12 min',
          description: 'Machine-guided squat emphasizing depth and quad control',
          battlePlan: '3 rounds\n• 10–12 Hack Squats\nRest 75s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_workout-content/artifacts/8g0a1brc_hack%20squat%202.avif',
          intensityReason: 'Controlled tempo builds strength and joint awareness',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Foot placement sets the stimulus',
              description: 'Lower, shoulder-width feet bias quads without overloading knees.'
            },
            {
              icon: 'timer',
              title: 'Own the descent',
              description: 'Slow 3-second lowering keeps constant tension on quads.'
            },
            {
              icon: 'body',
              title: 'Press through mid-foot',
              description: 'Even pressure prevents knee drift and loss of balance.'
            }
          ]
        },
        {
          name: 'Hack Squat Pause Reps',
          duration: '10–12 min',
          description: 'Paused squats building strength out of the bottom',
          battlePlan: '3 rounds\n• 8–10 Hack Squats (2s pause)\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_workout-content/artifacts/t0da41os_hack%20squat.avif',
          intensityReason: 'Pauses eliminate momentum for greater muscle activation',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause removes momentum',
              description: 'Brief hold above depth forces quads to work harder.'
            },
            {
              icon: 'shield',
              title: 'Stay glued to the pad',
              description: 'Full back contact maintains safe mechanics under load.'
            },
            {
              icon: 'arrow-up',
              title: 'Smooth drive upward',
              description: 'Controlled ascent prevents joint stress and bouncing.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Wide Hack Squat',
          duration: '14–16 min',
          description: 'Trains posterior chain through deeper ROM with wide stance.',
          battlePlan: '4 rounds\n• 8-10 wide hack squats\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241396/mood_app/workout_images/k4t4lzbt_download.jpg',
          intensityReason: 'Wide stance targets glute and hamstring drive.',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Feet wider set, push knees outward',
              description: 'Wide stance with knee tracking engages glutes more.'
            },
            {
              icon: 'construct',
              title: 'Sink into hips, don\'t lift heels',
              description: 'Heel contact maintains stability and power transfer.'
            }
          ]
        },
        {
          name: 'Hack Squat Calf Raise',
          duration: '14–16 min',
          description: 'Doubles lower leg work without switching machines for efficiency.',
          battlePlan: '4 rounds\n• 8 Hack Squats\n• Immediately 12 Hack Calf Raises\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241345/mood_app/workout_images/igmrt7qu_hscr.jpg',
          intensityReason: 'Add calf emphasis within heavy squat structure.',
          moodTips: [
            {
              icon: 'fitness',
              title: 'After squats, push only with calves in ROM',
              description: 'Transition to calf-only movement using balls of feet.'
            },
            {
              icon: 'shield',
              title: 'Keep shoulders pinned hard to pad',
              description: 'Maintain shoulder contact for stability during calf raises.'
            }
          ]
        },
        {
          name: 'Hack Squat Drop Set',
          duration: '14–16 min',
          description: 'Extended squat sets using rapid weight reductions',
          battlePlan: '3 rounds\n• 8 Hack Squats\n• Drop → 8\n• Drop → 8\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_workout-content/artifacts/8g0a1brc_hack%20squat%202.avif',
          intensityReason: 'Drop sets extend time under tension for maximum pump',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drops must be immediate',
              description: 'Strip roughly 20–30% without resting between sets.'
            },
            {
              icon: 'timer',
              title: 'Keep rep tempo consistent',
              description: 'Same speed on lighter weight maintains quad tension.'
            },
            {
              icon: 'flame',
              title: 'Expect deep quad burn',
              description: 'Intense pump signals effective fatigue.'
            }
          ]
        },
        {
          name: 'Heel-Elevated Hack Squat',
          duration: '14–16 min',
          description: 'Quad-biased squats using heel elevation',
          battlePlan: '4 rounds\n• 8–10 Hack Squats\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_workout-content/artifacts/t0da41os_hack%20squat.avif',
          intensityReason: 'Heel elevation shifts emphasis to quads',
          moodTips: [
            {
              icon: 'arrow-up',
              title: 'Heel lift increases knee travel',
              description: 'More forward motion shifts load into quads.'
            },
            {
              icon: 'shield',
              title: 'Torso stays pinned',
              description: 'Machine support maintains upright posture.'
            },
            {
              icon: 'body',
              title: 'Feel stretch before drive',
              description: 'Bottom position primes quad contraction.'
            }
          ]
        },
        {
          name: 'Reverse Hack Squat',
          duration: '14–16 min',
          description: 'Reverse-facing hack squat emphasizing glutes and quads',
          battlePlan: '4 rounds\n• 8–10 Reverse Hack Squats\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241327/mood_app/workout_images/a9f6gtvn_rhs.jpg',
          intensityReason: 'Reverse position increases glute and quad emphasis',
          moodTips: [
            {
              icon: 'body',
              title: 'Face the pad with chest forward',
              description: 'Allows more natural hip hinge while keeping spine supported.'
            },
            {
              icon: 'footsteps',
              title: 'Push through full foot',
              description: 'Mid-foot pressure balances quad and glute contribution.'
            },
            {
              icon: 'timer',
              title: 'Control the descent',
              description: 'Slower lowering keeps hips and knees tracking clean.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: '1½ Rep Hack Squat',
          duration: '16–18 min',
          description: 'Blends controlled pulses with full ROM squatting for hypertrophy.',
          battlePlan: '3 rounds\n• 6-8 hack squats (1 full + ½ rep = 1 rep)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241396/mood_app/workout_images/k4t4lzbt_download.jpg',
          intensityReason: 'Partial + full reps increase hypertrophy tension.',
          moodTips: [
            {
              icon: 'construct',
              title: 'Lower fully, rise halfway, drop, then stand',
              description: 'Complex rep pattern maximizes time under tension.'
            },
            {
              icon: 'timer',
              title: 'Move smoothly, no bouncing at bottom',
              description: 'Control throughout entire rep sequence for safety and effectiveness.'
            }
          ]
        },
        {
          name: 'Reverse Hack Squat',
          duration: '16–18 min',
          description: 'Reverse stance hack builds posterior chain strength and development.',
          battlePlan: '4 rounds\n• 8-10 reverse hack squats\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241327/mood_app/workout_images/a9f6gtvn_rhs.jpg',
          intensityReason: 'Facing pad emphasizes glutes and hamstrings.',
          moodTips: [
            {
              icon: 'construct',
              title: 'Face pad chest, hinge slightly forward',
              description: 'Reverse position changes muscle emphasis to posterior chain.'
            },
            {
              icon: 'fitness',
              title: 'Push heels downward, squeeze glutes at top',
              description: 'Focus on glute contraction for maximum muscle activation.'
            }
          ]
        },
        {
          name: 'Heavy Hack Squat',
          duration: '16–18 min',
          description: 'Low-rep squats emphasizing maximal quad strength',
          battlePlan: '4 rounds\n• 5–6 Hack Squats\nRest 150s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_workout-content/artifacts/t0da41os_hack%20squat.avif',
          intensityReason: 'Heavy load builds maximal strength',
          moodTips: [
            {
              icon: 'shield',
              title: 'Brace before unrack',
              description: 'Heavy loads demand full core engagement.'
            },
            {
              icon: 'timer',
              title: 'Controlled eccentric matters',
              description: 'Slow lowering improves strength and joint safety.'
            },
            {
              icon: 'people',
              title: 'Spotter strongly recommended',
              description: 'Heavy hack squats can stall abruptly.'
            }
          ]
        },
        {
          name: 'Hack Squat Burnout',
          duration: '18–20 min',
          description: 'High-rep finisher for complete quad exhaustion',
          battlePlan: '3 rounds\n• 15–20 Hack Squats\nRest 150s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_workout-content/artifacts/t0da41os_hack%20squat.avif',
          intensityReason: 'High reps push quads to complete fatigue',
          moodTips: [
            {
              icon: 'repeat',
              title: 'Constant motion required',
              description: 'Avoid locking out to keep tension continuous.'
            },
            {
              icon: 'barbell',
              title: 'Moderate load only',
              description: 'Weight should allow clean high-rep movement.'
            },
            {
              icon: 'flame',
              title: 'Quad shake is expected',
              description: 'Fatigue confirms effective burnout.'
            }
          ]
        },
        {
          name: 'Heavy Reverse Hack Squat',
          duration: '16–18 min',
          description: 'Heavy reverse hack squats for maximal leg loading',
          battlePlan: '4 rounds\n• 5–6 Reverse Hack Squats\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241327/mood_app/workout_images/a9f6gtvn_rhs.jpg',
          intensityReason: 'Heavy reverse loading maximizes leg strength',
          moodTips: [
            {
              icon: 'shield',
              title: 'Brace hard before unrack',
              description: 'Reverse position still demands full core tension.'
            },
            {
              icon: 'body',
              title: 'Drive hips and knees together',
              description: 'Smooth ascent prevents hip shoot-back.'
            },
            {
              icon: 'people',
              title: 'Spotter strongly recommended',
              description: 'Heavy reverse hacks can stall without warning.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Single Stack Cable Machine',
    icon: 'reorder-three',
    workouts: {
      beginner: [
        {
          name: 'Cable Squat',
          duration: '10–12 min',
          description: 'Cable tension mimics goblet squat with safety and control.',
          battlePlan: '3 rounds\n• 10-12 cable squats\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241357/mood_app/workout_images/s4c1d5ao_download_3_.jpg',
          intensityReason: 'Front loaded setup controls posture + squat form.',
          moodTips: [
            {
              icon: 'construct',
              title: 'Hold bar/rope close, chest tall, brace core',
              description: 'Front load helps maintain upright posture throughout movement.'
            },
            {
              icon: 'trending-down',
              title: 'Hips down, knees out, control down + up',
              description: 'Proper squat mechanics with cable assistance for learning.'
            }
          ]
        },
        {
          name: 'Cable Step Through',
          duration: '10–12 min',
          description: 'Crossover cable step engages quads + glutes together with unilateral work.',
          battlePlan: '3 rounds\n• 8 per side Step Throughs\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241366/mood_app/workout_images/yt6adjli_image.jpg',
          intensityReason: 'Split stance improves single leg drive and balance.',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Step forward strongly, keep torso upright',
              description: 'Drive through front leg while maintaining posture against cable.'
            },
            {
              icon: 'construct',
              title: 'Push front heel, let cable guide back',
              description: 'Cable provides assistance returning to start position.'
            }
          ]
        },
        {
          name: 'Cable Goblet Squat',
          duration: '10–12 min',
          description: 'Front-loaded squats using cable tension for stability',
          battlePlan: '3 rounds\n• 12 Cable Goblet Squats\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241291/mood_app/workout_images/p1po1v7d_cable_goblet_squat.jpg',
          intensityReason: 'Cable tension provides constant load for control',
          moodTips: [
            {
              icon: 'body',
              title: 'Hold handle close to chest',
              description: 'Front load helps maintain upright torso.'
            },
            {
              icon: 'arrow-down',
              title: 'Sit straight down',
              description: 'Vertical descent keeps knees tracking clean.'
            },
            {
              icon: 'timer',
              title: 'Smooth controlled reps',
              description: 'Cable tension rewards steady movement.'
            }
          ]
        },
        {
          name: 'Cable Reverse Lunge',
          duration: '10–12 min',
          description: 'Assisted reverse lunges reducing balance demands',
          battlePlan: '3 rounds\n• 8 Reverse Lunges per leg\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241285/mood_app/workout_images/gqxv7zxa_cable_reverse_lunge.jpg',
          intensityReason: 'Cable assists balance while building leg strength',
          moodTips: [
            {
              icon: 'arrow-back',
              title: 'Step back deliberately',
              description: 'Reverse motion protects knees.'
            },
            {
              icon: 'link',
              title: 'Cable assists balance only',
              description: 'Legs should still drive the movement.'
            },
            {
              icon: 'footsteps',
              title: 'Front heel pushes floor',
              description: 'Ensures quad and glute engagement.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Cable RDL',
          duration: '14–16 min',
          description: 'Cable variation keeps constant load on posterior chain throughout ROM.',
          battlePlan: '4 rounds\n• 8-10 cable rdls\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241286/mood_app/workout_images/h8lj3keb_cable_rdl2.jpg',
          intensityReason: 'Hip hinge move teaches tension through hamstrings.',
          moodTips: [
            {
              icon: 'construct',
              title: 'Step a foot back from weight stack for tension',
              description: 'Distance from stack creates pre-tension for better muscle activation.'
            },
            {
              icon: 'fitness',
              title: 'Hinge hips back, pull cable tight each rep',
              description: 'Maintain cable tension while performing hip hinge pattern.'
            }
          ]
        },
        {
          name: 'Cable Split Squat',
          duration: '14–16 min',
          description: 'Great hypertrophy builder with guided constant tension throughout movement.',
          battlePlan: '4 rounds\n• 8-10 cable split squats per leg\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241355/mood_app/workout_images/rnzpjsna_Screenshot_2025-12-06_at_7_23_45_PM.jpg',
          intensityReason: 'Unilateral squat keeps quads under stable load.',
          moodTips: [
            {
              icon: 'construct',
              title: 'Hold handle chest height tight, stand tall',
              description: 'Cable helps maintain upright posture during split squat.'
            },
            {
              icon: 'fitness',
              title: 'Drop rear knee close, drive evenly upward',
              description: 'Controlled descent with powerful drive through front leg.'
            }
          ]
        },
        {
          name: 'Cable Squat to Row',
          duration: '14–16 min',
          description: 'Squat-to-row pattern integrating legs and upper back',
          battlePlan: '4 rounds\n• 8 Squat to Rows\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241291/mood_app/workout_images/p1po1v7d_cable_goblet_squat.jpg',
          intensityReason: 'Compound movement trains legs and back together',
          moodTips: [
            {
              icon: 'layers',
              title: 'Squat first, then row',
              description: 'Legs initiate movement before pull.'
            },
            {
              icon: 'body',
              title: 'Stay tall at the bottom',
              description: 'Prevents torso collapse.'
            },
            {
              icon: 'timer',
              title: 'Control cable return',
              description: 'Slow return maintains tension.'
            }
          ]
        },
        {
          name: 'Cable Romanian Deadlift',
          duration: '14–16 min',
          description: 'Hip hinge emphasizing hamstrings under constant tension',
          battlePlan: '4 rounds\n• 10 Cable RDLs\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241286/mood_app/workout_images/h8lj3keb_cable_rdl2.jpg',
          intensityReason: 'Constant cable tension maximizes hamstring engagement',
          moodTips: [
            {
              icon: 'arrow-back',
              title: 'Hips push back first',
              description: 'Cable tracks close to legs.'
            },
            {
              icon: 'body',
              title: 'Feel hamstring stretch',
              description: 'Depth stops before back rounds.'
            },
            {
              icon: 'flash',
              title: 'Squeeze glutes to stand',
              description: 'Hips finish the rep.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Cable Front Squat',
          duration: '16–18 min',
          description: 'Replicates barbell front squat with cable constant tension loading.',
          battlePlan: '4 rounds\n• 6-8 heavy cable front squats\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241291/mood_app/workout_images/p1po1v7d_cable_goblet_squat.jpg',
          intensityReason: 'Heavy stack front squat overloads safe quads.',
          moodTips: [
            {
              icon: 'construct',
              title: 'Stand tall, hands under bar attachment',
              description: 'Proper grip and posture essential for heavy cable front squats.'
            },
            {
              icon: 'shield',
              title: 'Keep upright torso even under heavier load',
              description: 'Cable front load helps maintain position but requires core strength.'
            }
          ]
        },
        {
          name: 'Cable Squat to RDL',
          duration: '16–18 min',
          description: 'Superset blend targets both push + hinge chains with constant tension.',
          battlePlan: '4 rounds\n• 8 Cable Squats\n• 8 Cable RDLs\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241286/mood_app/workout_images/h8lj3keb_cable_rdl2.jpg',
          intensityReason: 'Combo pairing keeps full leg tension loading.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Keep squats smooth; hinge immediately after',
              description: 'Quick transition maintains muscle tension throughout superset.'
            },
            {
              icon: 'construct',
              title: 'Stay close to stack for strong pull angle',
              description: 'Positioning relative to cable stack affects resistance curve.'
            }
          ]
        },
        {
          name: 'Cable Squat Drop Set',
          duration: '18–20 min',
          description: 'Extended squats using rapid cable weight reductions',
          battlePlan: '3 rounds\n• 10 Cable Squats\n• Drop → 8\n• Drop → 8\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241291/mood_app/workout_images/p1po1v7d_cable_goblet_squat.jpg',
          intensityReason: 'Drop sets extend time under constant cable tension',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drop weight immediately',
              description: 'Reduce load ~25% without resting.'
            },
            {
              icon: 'body',
              title: 'Same squat mechanics',
              description: 'Tempo stays consistent as weight drops.'
            },
            {
              icon: 'link',
              title: 'Chase continuous tension',
              description: 'Cable keeps legs loaded throughout.'
            }
          ]
        },
        {
          name: 'Cable Split Squat Advanced',
          duration: '18–20 min',
          description: 'Front-loaded split squats emphasizing unilateral strength',
          battlePlan: '4 rounds\n• 8 Split Squats per leg\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241355/mood_app/workout_images/rnzpjsna_Screenshot_2025-12-06_at_7_23_45_PM.jpg',
          intensityReason: 'Heavy unilateral work builds balanced leg strength',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Front foot does the work',
              description: 'Rear leg provides balance only.'
            },
            {
              icon: 'link',
              title: 'Cable stays close to body',
              description: 'Prevents forward pulling.'
            },
            {
              icon: 'shield',
              title: 'Brace core throughout',
              description: 'Single-leg work demands stability.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Trap Bar',
    icon: 'remove',
    workouts: {
      beginner: [
        {
          name: 'Trap Bar Deadlift Squat',
          duration: '10–12 min',
          description: 'Full‑body squat/deadlift hybrid builds foundation',
          battlePlan: '3 rounds\n• 8–10 Deadlift‑Style Trap Bar Squats\nRest 75–90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241387/mood_app/workout_images/3cnpyyx1_tbss.jpg',
          intensityReason: 'Safest trap bar squat teaches form and posture',
          moodTips: [
            {
              icon: 'body',
              title: 'Stand tall inside bar, chest up',
              description: 'Maintain upright posture throughout the movement for proper form.'
            },
            {
              icon: 'arrow-down',
              title: 'Push floor evenly, lock out fully',
              description: 'Drive through both feet equally and complete full extension at top.'
            }
          ]
        },
        {
          name: 'Neutral Grip Trap Bar Squat',
          duration: '10–12 min',
          description: 'Neutral foot placement encourages steady control',
          battlePlan: '3 rounds\n• 8–10 Neutral Squats\nRest 75–90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241403/mood_app/workout_images/sbumk4mn_tbs.jpg',
          intensityReason: 'Balanced stance builds quads and glutes evenly',
          moodTips: [
            {
              icon: 'resize-outline',
              title: 'Feet shoulder width, toes slightly out',
              description: 'Proper foot positioning ensures balanced muscle activation.'
            },
            {
              icon: 'trending-down',
              title: 'Keep spine tall, descend under control',
              description: 'Controlled descent maximizes muscle engagement and safety.'
            }
          ]
        },
        {
          name: 'Trap Bar Deadlift',
          duration: '12–14 min',
          description: 'Neutral-grip deadlifts reducing spinal stress',
          battlePlan: '3 rounds\n• 8–10 Trap Bar Deadlifts\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241270/mood_app/workout_images/4iszp6ah_trap_bar_dl_2.jpg',
          intensityReason: 'Neutral grip reduces spinal loading',
          moodTips: [
            {
              icon: 'body',
              title: 'Chest tall at setup',
              description: 'Balanced squat–hinge position.'
            },
            {
              icon: 'arrow-down',
              title: 'Push floor away',
              description: 'Legs initiate the pull, not the back.'
            },
            {
              icon: 'checkmark',
              title: 'Lock out smoothly',
              description: 'No jerking or hitching at the top.'
            }
          ]
        },
        {
          name: 'Tempo Trap Bar Deadlift',
          duration: '12–14 min',
          description: 'Controlled deadlifts emphasizing slow eccentrics',
          battlePlan: '3 rounds\n• 8 Trap Bar Deadlifts (3s eccentric)\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241273/mood_app/workout_images/4pazduz4_trab_bar_dl.jpg',
          intensityReason: 'Tempo work increases time under tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Lower under control',
              description: 'Three-second descent builds hinge strength.'
            },
            {
              icon: 'shield',
              title: 'Stay braced throughout',
              description: 'Core tension prevents spinal flexion.'
            },
            {
              icon: 'body',
              title: 'Feel hamstrings load',
              description: 'Stretch signals correct positioning.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Wide Stance Trap Bar Squat',
          duration: '14–16 min',
          description: 'Builds hip strength and glute drive through stance',
          battlePlan: '4 rounds\n• 6–8 Wide Stance Squats\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241270/mood_app/workout_images/4iszp6ah_trap_bar_dl_2.jpg',
          intensityReason: 'wider base targets hips and glutes with a stronger emphasis',
          moodTips: [
            {
              icon: 'resize',
              title: 'Feet wider, push knees out strongly',
              description: 'Wide stance activates glutes more effectively than narrow stance.'
            },
            {
              icon: 'arrow-forward',
              title: 'Drive hips forward to finish rep',
              description: 'Hip drive ensures complete glute activation at top of movement.'
            }
          ]
        },
        {
          name: 'Tempo Trap Bar Squat',
          duration: '14–16 min',
          description: 'Slow descent builds control and hypertrophy for greater muscle growth',
          battlePlan: '4 rounds\n• 6–8 Squats (3–4s eccentric)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241403/mood_app/workout_images/sbumk4mn_tbs.jpg',
          intensityReason: 'Extended eccentrics increase muscle time under tension',
          moodTips: [
            {
              icon: 'time',
              title: 'Lower in 3–4s, keep chest upright',
              description: 'Slow tempo increases time under tension for muscle growth.'
            },
            {
              icon: 'construct',
              title: 'Controlled pace — no collapse at depth',
              description: 'Maintain tension throughout range of motion for safety.'
            }
          ]
        },
        {
          name: 'Trap Bar Drop Set',
          duration: '14–16 min',
          description: 'Deadlifts extended using fast weight reductions',
          battlePlan: '3 rounds\n• 6 Deadlifts\n• Drop → 6\n• Drop → 6\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241270/mood_app/workout_images/4iszp6ah_trap_bar_dl_2.jpg',
          intensityReason: 'Drop sets extend time under tension for maximum pump',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drops are immediate',
              description: 'Reduce roughly 25% without resting.'
            },
            {
              icon: 'shield',
              title: 'Re-brace every rep',
              description: 'Reset posture before pulling again.'
            },
            {
              icon: 'hand-right',
              title: 'Grip can assist',
              description: 'Legs and hips remain priority movers.'
            }
          ]
        },
        {
          name: 'Trap Bar Pause Deadlift',
          duration: '14–16 min',
          description: 'Paused deadlifts strengthening bottom position',
          battlePlan: '4 rounds\n• 5–6 Deadlifts (2s pause)\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241273/mood_app/workout_images/4pazduz4_trab_bar_dl.jpg',
          intensityReason: 'Pauses eliminate momentum for greater muscle activation',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause just off floor',
              description: 'Two-second hold removes momentum.'
            },
            {
              icon: 'shield',
              title: 'Stay tight during pause',
              description: 'No hip rise or slack loss.'
            },
            {
              icon: 'flash',
              title: 'Explode to lockout',
              description: 'Power finishes the rep.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Pause Trap Bar Squat',
          duration: '16–18 min',
          description: 'Builds stability and power out of squat bottom',
          battlePlan: '4 rounds\n• 6 Paused Squats (2s)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241270/mood_app/workout_images/4iszp6ah_trap_bar_dl_2.jpg',
          intensityReason: '2s pause eliminates momentum, loads glutes/quads',
          moodTips: [
            {
              icon: 'pause',
              title: 'Hold depth 2s, keep core braced',
              description: 'Pause eliminates stretch reflex, requiring pure strength to ascend.'
            },
            {
              icon: 'rocket',
              title: 'Explode upward from pause each rep',
              description: 'Rapid acceleration from pause develops explosive power.'
            }
          ]
        },
        {
          name: '1½ Rep Trap Bar Squat',
          duration: '16–18 min',
          description: 'Doubles workload while keeping constant tension',
          battlePlan: '3 rounds\n• 6–8 1½ Rep Trap Bar Squats\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241273/mood_app/workout_images/4pazduz4_trab_bar_dl.jpg',
          intensityReason: 'Half + full rep combo extends quad fatigue for greater challenge',
          moodTips: [
            {
              icon: 'repeat',
              title: 'Lower full, rise half, drop, then stand',
              description: 'Complete sequence: full down, half up, full down, full up.'
            },
            {
              icon: 'trending-up',
              title: 'Stay smooth — no bouncing between halves',
              description: 'Controlled movement pattern prevents momentum and maintains tension.'
            }
          ]
        },
        {
          name: 'Heavy Trap Bar Deadlift',
          duration: '18–20 min',
          description: 'Max-load deadlifts emphasizing total leg power',
          battlePlan: '5 rounds\n• 3–5 Deadlifts\nRest 180s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241270/mood_app/workout_images/4iszp6ah_trap_bar_dl_2.jpg',
          intensityReason: 'Heavy load builds maximal leg power',
          moodTips: [
            {
              icon: 'shield',
              title: 'Brace like a squat',
              description: 'Neutral grip still demands full tension.'
            },
            {
              icon: 'body',
              title: 'Smooth pull only',
              description: 'No hitching or grinding.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Fatigue can accumulate quickly.'
            }
          ]
        },
        {
          name: 'Trap Bar Burnout Pulls',
          duration: '18–20 min',
          description: 'High-rep finisher driving leg exhaustion',
          battlePlan: '3 rounds\n• 15 Deadlifts\nRest 180s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241273/mood_app/workout_images/4pazduz4_trab_bar_dl.jpg',
          intensityReason: 'High reps push legs to complete fatigue',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Moderate load only',
              description: 'Weight must allow safe high reps.'
            },
            {
              icon: 'body',
              title: 'Short reset breaths',
              description: 'Stay composed under fatigue.'
            },
            {
              icon: 'alert',
              title: 'Stop before form breaks',
              description: 'Technique always comes first.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Pit Shark',
    icon: 'triangle-outline',
    workouts: {
      beginner: [
        {
          name: 'Pit Shark Standard Squat',
          duration: '10–12 min',
          description: 'Controlled full-range squats building leg foundation',
          battlePlan: '3 rounds\n• 10–12 Squats\nRest 75s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_workout-content/artifacts/9whvfgtz_pit%20shark%20squat.avif',
          intensityReason: 'Pit shark builds strength with natural squat mechanics',
          moodTips: [
            {
              icon: 'arrow-down',
              title: 'Sit straight down',
              description: 'Vertical descent keeps knees and hips aligned.'
            },
            {
              icon: 'body',
              title: 'Stay tall under pads',
              description: 'Upright torso shifts work into legs.'
            },
            {
              icon: 'timer',
              title: 'Smooth reps only',
              description: 'Avoid bouncing or rushing transitions.'
            }
          ]
        },
        {
          name: 'Tempo Pit Shark Squat',
          duration: '10–12 min',
          description: 'Slow eccentrics reinforcing squat control',
          battlePlan: '3 rounds\n• 10 Squats (3s eccentric)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241301/mood_app/workout_images/zbfap5ab_pit_shark_squat_3.jpg',
          intensityReason: 'Tempo work builds control and muscle engagement',
          moodTips: [
            {
              icon: 'timer',
              title: 'Slow the descent',
              description: 'Three-second lowering keeps quads engaged.'
            },
            {
              icon: 'shield',
              title: 'Brace before every rep',
              description: 'Core stability improves balance.'
            },
            {
              icon: 'arrow-up',
              title: 'Controlled ascent',
              description: 'Stand smoothly without jerking.'
            }
          ]
        },
        {
          name: 'Pit Shark Pause Squat',
          duration: '10–12 min',
          description: 'Paused squats strengthening bottom position',
          battlePlan: '3 rounds\n• 8–10 Squats (2s pause)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241266/mood_app/workout_images/27jkyx8o_pit_shark_squat_2.jpg',
          intensityReason: 'Pauses eliminate momentum for greater activation',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause above depth',
              description: 'Removes momentum without joint stress.'
            },
            {
              icon: 'shield',
              title: 'Stay tight in pause',
              description: 'No relaxing at the bottom.'
            },
            {
              icon: 'body',
              title: 'Drive evenly upward',
              description: 'Knees and hips rise together.'
            }
          ]
        },
        {
          name: 'Pit Shark Step-Ups',
          duration: '10–12 min',
          description: 'Elevated step-ups emphasizing unilateral leg drive',
          battlePlan: '3 rounds\n• 8 Step-Ups per leg\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241287/mood_app/workout_images/hm30g4dw_pit_shark_step_up.jpg',
          intensityReason: 'Unilateral work builds balanced leg strength',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Increase step height intentionally',
              description: 'Plates or box should place knee above hip.'
            },
            {
              icon: 'footsteps',
              title: 'Back leg fully disengaged',
              description: 'Front leg performs all the work.'
            },
            {
              icon: 'flash',
              title: 'Drive through lead heel',
              description: 'Improves quad and glute activation.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Heavy Pit Shark Squat',
          duration: '14–16 min',
          description: 'Lower-rep squats emphasizing leg strength',
          battlePlan: '4 rounds\n• 6–8 Squats\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_workout-content/artifacts/9whvfgtz_pit%20shark%20squat.avif',
          intensityReason: 'Heavier loads build raw strength',
          moodTips: [
            {
              icon: 'shield',
              title: 'Brace before unrack',
              description: 'Treat each rep as heavy.'
            },
            {
              icon: 'timer',
              title: 'Control the eccentric',
              description: 'Stability before power.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Fatigue can stall reps unexpectedly.'
            }
          ]
        },
        {
          name: 'Pit Shark Romanian Deadlift',
          duration: '14–16 min',
          description: 'Hip hinge emphasizing hamstrings and glutes',
          battlePlan: '4 rounds\n• 8–10 RDLs\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241280/mood_app/workout_images/bom80199_pit_shark_rdl.jpg',
          intensityReason: 'RDL pattern develops posterior chain',
          moodTips: [
            {
              icon: 'arrow-back',
              title: 'Hips push straight back',
              description: 'Minimal knee bend keeps hamstrings loaded.'
            },
            {
              icon: 'body',
              title: 'Lower until stretch is felt',
              description: 'Stop before back rounds.'
            },
            {
              icon: 'flash',
              title: 'Glutes finish the lift',
              description: 'Squeeze hips through at top.'
            }
          ]
        },
        {
          name: 'Pit Shark Drop Set Squat',
          duration: '14–16 min',
          description: 'Extended squat sets using fast load reductions',
          battlePlan: '3 rounds\n• 8 Squats\n• Drop → 8\n• Drop → 8\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241301/mood_app/workout_images/zbfap5ab_pit_shark_squat_3.jpg',
          intensityReason: 'Drop sets extend time under tension',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drops are immediate',
              description: 'Reduce load 20–30% without rest.'
            },
            {
              icon: 'timer',
              title: 'Rep tempo unchanged',
              description: 'Lighter weight does not mean faster reps.'
            },
            {
              icon: 'flame',
              title: 'Chase quad pump',
              description: 'Continuous tension is the goal.'
            }
          ]
        },
        {
          name: 'Pit Shark Jump Squat',
          duration: '14–16 min',
          description: 'Light explosive squats developing leg power',
          battlePlan: '3 rounds\n• 6–8 Jump Squats\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240688/mood_app/workout_images/ucxnrjme_pit_shark_jump_squat.jpg',
          intensityReason: 'Explosive work builds power output',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Use very light load',
              description: 'Power output matters more than resistance.'
            },
            {
              icon: 'arrow-up',
              title: 'Jump vertically, land softly',
              description: 'Absorb force quietly through mid-foot.'
            },
            {
              icon: 'refresh',
              title: 'Reset fully each rep',
              description: 'Every jump should be explosive.'
            }
          ]
        },
        {
          name: 'Pit Shark Step-Ups',
          duration: '14–16 min',
          description: 'Belt-loaded step-ups reducing spinal load while training legs',
          battlePlan: '4 rounds\n• 8 per leg\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/mt2elt9e_pit%20shark%20step%20up.png',
          intensityReason: 'Belt-loaded step-ups train legs without compressing the spine',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drive through front leg',
              description: 'Let belt load legs.'
            },
            {
              icon: 'body',
              title: 'Stay balanced',
              description: 'Control hips.'
            },
            {
              icon: 'timer',
              title: 'Keep reps clean',
              description: 'Don’t rush.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Max-Load Pit Shark Squat',
          duration: '18–20 min',
          description: 'Heavy squats for maximal leg strength',
          battlePlan: '5 rounds\n• 3–5 Squats\nRest 180s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_workout-content/artifacts/9whvfgtz_pit%20shark%20squat.avif',
          intensityReason: 'Heavy loads build maximal strength',
          moodTips: [
            {
              icon: 'shield',
              title: 'Brace aggressively',
              description: 'Full-body tension before each rep.'
            },
            {
              icon: 'trending-down',
              title: 'Depth stays consistent',
              description: 'No shortening range under load.'
            },
            {
              icon: 'people',
              title: 'Spotter required',
              description: 'Heavy failures can occur suddenly.'
            }
          ]
        },
        {
          name: 'Heavy Pit Shark RDL',
          duration: '18–20 min',
          description: 'Loaded hinges emphasizing posterior chain strength',
          battlePlan: '4 rounds\n• 6–8 RDLs\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241280/mood_app/workout_images/bom80199_pit_shark_rdl.jpg',
          intensityReason: 'Heavy RDLs maximize hamstring development',
          moodTips: [
            {
              icon: 'shield',
              title: 'Brace before lowering',
              description: 'Heavy hinges demand core stiffness.'
            },
            {
              icon: 'arrow-down',
              title: 'Bar path stays close',
              description: 'Load should track straight down.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Fatigue can compromise hinge mechanics.'
            }
          ]
        },
        {
          name: 'Pit Shark Triple Drop Squat',
          duration: '18–20 min',
          description: 'Extended triple-drop squats for total exhaustion',
          battlePlan: '3 rounds\n• 6 Squats\n• Drop → 6\n• Drop → 6\n• Drop → 6\nRest 180s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241266/mood_app/workout_images/27jkyx8o_pit_shark_squat_2.jpg',
          intensityReason: 'Triple drops maximize muscle fatigue',
          moodTips: [
            {
              icon: 'flash',
              title: 'Three drops without rest',
              description: 'Strip load rapidly.'
            },
            {
              icon: 'body',
              title: 'Same squat mechanics',
              description: 'No shortcuts under fatigue.'
            },
            {
              icon: 'flame',
              title: 'Quad pump should peak',
              description: 'Exhaustion is intentional.'
            }
          ]
        },
        {
          name: 'Pit Shark Jump Squat Burnout',
          duration: '18–20 min',
          description: 'Explosive jump squats performed under fatigue',
          battlePlan: '3 rounds\n• 8–10 Jump Squats\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240688/mood_app/workout_images/ucxnrjme_pit_shark_jump_squat.jpg',
          intensityReason: 'Explosive burnout builds power endurance',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Light load only',
              description: 'Jump height matters more than weight.'
            },
            {
              icon: 'flash',
              title: 'Short ground contact',
              description: 'Quick rebounds maintain power.'
            },
            {
              icon: 'alert',
              title: 'Stop when jumps slow',
              description: 'End set once explosiveness fades.'
            }
          ]
        },
        {
          name: 'Pit Shark Step-Up Pulses',
          duration: '16–18 min',
          description: 'Step-ups extended with pulses to increase tension and fatigue',
          battlePlan: '4 rounds\n• 6 per leg + 3 pulses\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/mt2elt9e_pit%20shark%20step%20up.png',
          intensityReason: 'Top pulses extend time under tension for max quad/glute fatigue',
          moodTips: [
            {
              icon: 'flash',
              title: 'Pulse at top',
              description: 'Extra contraction.'
            },
            {
              icon: 'flame',
              title: 'Push near failure',
              description: 'Final sets should burn.'
            },
            {
              icon: 'shield',
              title: 'Stay stable',
              description: 'No wobble.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Smith Machine',
    icon: 'grid-outline',
    workouts: {
      beginner: [
        {
          name: 'Smith Standard Squat',
          duration: '10–12 min',
          description: 'Guided squats reinforcing consistent movement path',
          battlePlan: '3 rounds\n• 10–12 Squats\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241289/mood_app/workout_images/le4l1rje_smith_squat_2.jpg',
          intensityReason: 'Smith machine builds strength with guided bar path',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Feet slightly forward',
              description: 'Keeps bar over mid-foot.'
            },
            {
              icon: 'body',
              title: 'Sit between hips',
              description: 'Avoid excessive knee drift.'
            },
            {
              icon: 'timer',
              title: 'Controlled cadence',
              description: 'Precision over speed.'
            }
          ]
        },
        {
          name: 'Tempo Smith Squat',
          duration: '10–12 min',
          description: 'Slow eccentrics building leg control',
          battlePlan: '3 rounds\n• 10 Squats (3s eccentric)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241300/mood_app/workout_images/ynnuugau_smith_squat.jpg',
          intensityReason: 'Tempo work increases muscle engagement',
          moodTips: [
            {
              icon: 'timer',
              title: 'Three-second descent',
              description: 'Maintains quad tension.'
            },
            {
              icon: 'construct',
              title: 'Knees track with toes',
              description: 'Protects joints.'
            },
            {
              icon: 'arrow-up',
              title: 'Smooth ascent',
              description: 'No bouncing.'
            }
          ]
        },
        {
          name: 'Smith Reverse Lunge',
          duration: '10–12 min',
          description: 'Guided lunges reducing balance demand',
          battlePlan: '3 rounds\n• 8 Lunges per leg\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241264/mood_app/workout_images/15roxyzj_smith_reverse_lunge.jpg',
          intensityReason: 'Guided path allows focus on leg drive',
          moodTips: [
            {
              icon: 'arrow-back',
              title: 'Step back deliberately',
              description: 'Reverse motion protects knees.'
            },
            {
              icon: 'body',
              title: 'Torso stays upright',
              description: 'Smith supports posture.'
            },
            {
              icon: 'footsteps',
              title: 'Front leg dominates',
              description: 'Rear leg assists balance only.'
            }
          ]
        },
        {
          name: 'Smith Romanian Deadlift',
          duration: '10–12 min',
          description: 'Guided hip hinge emphasizing hamstring stretch',
          battlePlan: '3 rounds\n• 10 RDLs\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241278/mood_app/workout_images/6vr69tt8_smith_rdl.jpg',
          intensityReason: 'Guided RDL teaches hinge mechanics safely',
          moodTips: [
            {
              icon: 'body',
              title: 'Soft knees throughout',
              description: 'Avoid joint lockout.'
            },
            {
              icon: 'arrow-back',
              title: 'Hips initiate movement',
              description: 'Bar lowers as hips travel back.'
            },
            {
              icon: 'alert',
              title: 'Stretch without rounding',
              description: 'Depth stops before spine flexes.'
            }
          ]
        },
        {
          name: 'Smith Supported Step-Ups',
          duration: '10–12 min',
          description: 'Guided step-ups using bar support to assist balance and control',
          battlePlan: '3 rounds\n• 8 per leg\nRest 75s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/sijsojfi_smith%20machine%20step%20up.png',
          intensityReason: 'Smith bar path stabilizes the step-up while you build leg strength',
          moodTips: [
            {
              icon: 'shield',
              title: 'Use bar for balance',
              description: 'Build confidence.'
            },
            {
              icon: 'footsteps',
              title: 'Step fully up',
              description: 'Full foot contact.'
            },
            {
              icon: 'timer',
              title: 'Move controlled',
              description: 'No rushing.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Smith Front Squat',
          duration: '14–16 min',
          description: 'Front-loaded squats emphasizing quads and core',
          battlePlan: '4 rounds\n• 6–8 Front Squats\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241282/mood_app/workout_images/e8vt7ayl_smith_front_squat.jpg',
          intensityReason: 'Front load challenges core stability',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Feet slightly forward',
              description: 'Keeps torso upright.'
            },
            {
              icon: 'trending-up',
              title: 'Elbows stay high',
              description: 'Prevents bar roll.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Front loading increases fatigue.'
            }
          ]
        },
        {
          name: 'Smith Split Squat',
          duration: '14–16 min',
          description: 'Stationary split squats with guided bar path',
          battlePlan: '4 rounds\n• 8 Split Squats per leg\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241268/mood_app/workout_images/28os8gvb_smith_split.jpg',
          intensityReason: 'Unilateral work builds balanced strength',
          moodTips: [
            {
              icon: 'resize',
              title: 'Long stance setup',
              description: 'Improves hip and knee alignment.'
            },
            {
              icon: 'arrow-down',
              title: 'Back knee lowers straight down',
              description: 'Avoid forward drift.'
            },
            {
              icon: 'flash',
              title: 'Front leg drives ascent',
              description: 'Rear leg stabilizes only.'
            }
          ]
        },
        {
          name: 'Smith Squat Drop Set',
          duration: '14–16 min',
          description: 'Extended squats using fast load reductions',
          battlePlan: '3 rounds\n• 8 Squats\n• Drop → 8\n• Drop → 8\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241289/mood_app/workout_images/le4l1rje_smith_squat_2.jpg',
          intensityReason: 'Drop sets extend time under tension',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drops are immediate',
              description: 'Reduce load 20–30% quickly.'
            },
            {
              icon: 'timer',
              title: 'Rep rhythm unchanged',
              description: 'Same tempo on lighter weight.'
            },
            {
              icon: 'flame',
              title: 'Chase quad pump',
              description: 'Continuous tension focus.'
            }
          ]
        },
        {
          name: 'Smith Jump Squat',
          duration: '14–16 min',
          description: 'Explosive squats using Smith track for safety',
          battlePlan: '4 rounds\n• 5–6 Jump Squats\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241283/mood_app/workout_images/eefeuowu_smith_jump_squat.jpg',
          intensityReason: 'Guided path allows explosive focus',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Very light load only',
              description: 'Speed and height are priorities.'
            },
            {
              icon: 'arrow-up',
              title: 'Jump vertically',
              description: 'Avoid forward drift.'
            },
            {
              icon: 'refresh',
              title: 'Reset each rep',
              description: 'Explosiveness over fatigue.'
            }
          ]
        },
        {
          name: 'Smith Step-Ups Tempo',
          duration: '14–16 min',
          description: 'Step-ups using controlled tempo for increased tension',
          battlePlan: '4 rounds\n• 8 per leg\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/sijsojfi_smith%20machine%20step%20up.png',
          intensityReason: 'Tempo step-ups maximize quad/glute time under tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Slow descent',
              description: '3-second eccentric.'
            },
            {
              icon: 'body',
              title: 'Stay upright',
              description: 'Keep bar stable.'
            },
            {
              icon: 'refresh',
              title: 'Consistent rhythm',
              description: 'No bouncing.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Heavy Smith Squat',
          duration: '18–20 min',
          description: 'Heavy guided squats emphasizing maximal strength',
          battlePlan: '5 rounds\n• 3–5 Squats\nRest 180s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241300/mood_app/workout_images/ynnuugau_smith_squat.jpg',
          intensityReason: 'Heavy loads build maximal strength',
          moodTips: [
            {
              icon: 'shield',
              title: 'Brace before unrack',
              description: 'Heavy loads demand full tension.'
            },
            {
              icon: 'trending-down',
              title: 'Depth never shortens',
              description: 'Consistent range under fatigue.'
            },
            {
              icon: 'people',
              title: 'Spotter or safeties required',
              description: 'Mandatory for heavy loading.'
            }
          ]
        },
        {
          name: 'Smith Pause Squat',
          duration: '16–18 min',
          description: 'Paused squats reinforcing bottom-end strength',
          battlePlan: '4 rounds\n• 5–6 Squats (2s pause)\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241289/mood_app/workout_images/le4l1rje_smith_squat_2.jpg',
          intensityReason: 'Pauses build raw strength from weakest position',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause above parallel',
              description: 'Removes bounce assistance.'
            },
            {
              icon: 'shield',
              title: 'Stay tight in pause',
              description: 'No relaxation.'
            },
            {
              icon: 'arrow-up',
              title: 'Drive evenly upward',
              description: 'Prevents knee collapse.'
            }
          ]
        },
        {
          name: 'Smith RDL Drop Set',
          duration: '18–20 min',
          description: 'Hinges extended with rapid load reductions',
          battlePlan: '3 rounds\n• 6 RDLs\n• Drop → 6\n• Drop → 6\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241278/mood_app/workout_images/6vr69tt8_smith_rdl.jpg',
          intensityReason: 'Drop sets maximize posterior chain fatigue',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drops are immediate',
              description: 'Reduce load 20–30% per drop.'
            },
            {
              icon: 'body',
              title: 'Hinge mechanics identical',
              description: 'No rounding under fatigue.'
            },
            {
              icon: 'hand-right',
              title: 'Straps allowed',
              description: 'Posterior chain should limit set.'
            }
          ]
        },
        {
          name: 'Smith Squat Burnout',
          duration: '18–20 min',
          description: 'High-rep finisher for total leg fatigue',
          battlePlan: '3 rounds\n• 20 Squats\nRest 180s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241289/mood_app/workout_images/le4l1rje_smith_squat_2.jpg',
          intensityReason: 'High reps push legs to complete fatigue',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Moderate load only',
              description: 'Enables uninterrupted reps.'
            },
            {
              icon: 'repeat',
              title: 'No lockout at top',
              description: 'Keeps tension on legs.'
            },
            {
              icon: 'body',
              title: 'Controlled breathing',
              description: 'One breath per rep.'
            }
          ]
        },
        {
          name: 'Smith Step-Up Drive',
          duration: '16–18 min',
          description: 'Explosive step-ups focusing on power and control under load',
          battlePlan: '4 rounds\n• 6 per leg\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/sijsojfi_smith%20machine%20step%20up.png',
          intensityReason: 'Heavy explosive step-ups develop unilateral power',
          moodTips: [
            {
              icon: 'flash',
              title: 'Explode upward',
              description: 'Max intent each rep.'
            },
            {
              icon: 'flame',
              title: 'Push near failure',
              description: 'Last rounds should burn.'
            },
            {
              icon: 'shield',
              title: 'Control return',
              description: 'Stay balanced.'
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
          name: 'KB Static Lunge',
          duration: '10–12 min',
          description: 'Stationary lunges building balance, control, and movement confidence',
          battlePlan: '3 rounds\n• 8 per leg\nRest 75s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/75iax87r_kb%20lunge.png',
          intensityReason: 'Stationary lunges teach balance and bracing under kettlebell load',
          moodTips: [
            { icon: 'repeat', title: 'Make every rep identical', description: 'Same depth and stance each time builds real control.' },
            { icon: 'flash', title: 'Feel your front leg working', description: 'If back leg dominates, shorten your stance.' },
            { icon: 'shield', title: 'Finish feeling in control', description: 'You should have reps left, not be exhausted.' }
          ]
        },
        {
          name: 'KB Supported Step-Up',
          duration: '10–12 min',
          description: 'Step-ups using light support to build balance and coordination',
          battlePlan: '3 rounds\n• 8 per leg\nRest 75s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/frus5rdt_kb%20step%20up.png',
          intensityReason: 'Light support lets beginners groove balance before adding intensity',
          moodTips: [
            { icon: 'hand-right', title: 'Use support to stay steady', description: 'Balance comes first, not speed or load.' },
            { icon: 'footsteps', title: 'Plant your whole foot', description: 'Driving through toes reduces stability.' },
            { icon: 'checkmark-circle', title: 'Finish feeling confident', description: 'You should have reps left.' }
          ]
        },
        {
          name: 'KB Controlled Swing',
          duration: '10–12 min',
          description: 'Basic swings building hip hinge mechanics and coordination',
          battlePlan: '3 rounds\n• 12–15 reps\nRest 60s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/ajm4hd60_kb%20swing.png',
          intensityReason: 'Foundational hip hinge teaches power transfer through the posterior chain',
          moodTips: [
            { icon: 'flash', title: 'Hips drive the movement', description: 'Arms should feel passive, not active.' },
            { icon: 'pulse', title: 'Snap, don’t lift', description: 'If shoulders work, reset your hinge.' },
            { icon: 'checkmark-circle', title: 'Finish feeling confident', description: 'Not out of breath or overwhelmed.' }
          ]
        },
        {
          name: 'KB Deadlift',
          duration: '10–12 min',
          description: 'Basic hinge movement building posterior chain strength safely',
          battlePlan: '3 rounds\n• 10–12 reps\nRest 75s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/wt6q1tpv_kb%20deadlift.png',
          intensityReason: 'Foundational hinge pattern teaches posterior chain engagement',
          moodTips: [
            { icon: 'arrow-back', title: 'Push hips back first', description: 'Not a squat.' },
            { icon: 'body', title: 'Feel hamstrings stretch', description: 'That’s your cue.' },
            { icon: 'checkmark-circle', title: 'Finish confident', description: 'Not fatigued.' }
          ]
        }
      ],
      intermediate: [
        {
          name: 'KB Walking Lunge',
          duration: '14–16 min',
          description: 'Walking lunges building unilateral strength and continuous tension',
          battlePlan: '4 rounds\n• 8 per leg\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/3pz6hkz9_kb%20lunge%202.png',
          intensityReason: 'Walking adds balance demand on top of unilateral leg drive',
          moodTips: [
            { icon: 'footsteps', title: 'Step with intention, not momentum', description: 'Feel the front leg load before stepping through.' },
            { icon: 'arrow-down', title: 'Stay low between steps', description: 'Standing tall resets tension and makes it easier.' },
            { icon: 'flame', title: 'Burn should build each round', description: 'If legs feel fresh late, increase intensity.' }
          ]
        },
        {
          name: 'KB Step-Up Tempo',
          duration: '14–16 min',
          description: 'Step-ups with slow eccentrics increasing tension and control',
          battlePlan: '4 rounds\n• 8 per leg (3s down)\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/7j1bpxt0_kb%20step%20up%202.png',
          intensityReason: 'Slow eccentric phase amplifies time under tension on each rep',
          moodTips: [
            { icon: 'arrow-down', title: 'Own the lowering phase', description: 'If you rush down, you lose the benefit.' },
            { icon: 'arrow-up', title: 'Drive fully at the top', description: 'Complete extension builds strength.' },
            { icon: 'flame', title: 'Burn should build gradually', description: 'If not, increase load.' }
          ]
        },
        {
          name: 'KB Swing Tempo',
          duration: '14–16 min',
          description: 'Swings with controlled returns increasing time under tension',
          battlePlan: '4 rounds\n• 12 reps\nRest 75s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/pj2fe7fs_kb%20swing%202.png',
          intensityReason: 'Controlled return phase doubles posterior chain time under tension',
          moodTips: [
            { icon: 'arrow-down', title: 'Control the drop', description: 'Don’t let gravity take over.' },
            { icon: 'flash', title: 'Explode every rep', description: 'Power still matters.' },
            { icon: 'flame', title: 'Fatigue should build gradually', description: 'If not, increase load.' }
          ]
        },
        {
          name: 'KB Romanian Deadlift',
          duration: '14–16 min',
          description: 'Hinged deadlifts emphasizing hamstrings and glute stretch',
          battlePlan: '4 rounds\n• 10 reps\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/cbm9hqde_kb%20deadlift%202.png',
          intensityReason: 'RDL pattern hunts hamstring stretch and glute recruitment',
          moodTips: [
            { icon: 'resize', title: 'Chase the stretch', description: 'That’s your depth marker.' },
            { icon: 'arrow-back', title: 'Keep bar path close', description: 'Efficiency matters.' },
            { icon: 'body', title: 'Feel hamstrings working', description: 'Not your lower back.' }
          ]
        }
      ],
      advanced: [
        {
          name: 'KB Walking Lunge Drop Set',
          duration: '16–18 min',
          description: 'Continuous lunges extended with weight drops to near failure',
          battlePlan: '3 rounds\n• 10 per leg → Drop → 10 → Drop → BW\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/em1qkl0b_kb%20lunge%203.png',
          intensityReason: 'Drop sets push past comfortable rep ranges into real fatigue',
          moodTips: [
            { icon: 'arrow-forward', title: 'Don’t stop moving forward', description: 'The set ends when your legs say it does.' },
            { icon: 'flash', title: 'Drop weight, not intensity', description: 'Each drop keeps effort high, not easier.' },
            { icon: 'flame', title: 'Final set should test you', description: 'You shouldn’t be sure you’ll finish.' }
          ]
        },
        {
          name: 'KB Explosive Step-Up',
          duration: '16–18 min',
          description: 'Explosive step-ups building power and high-output strength',
          battlePlan: '4 rounds\n• 6 per leg\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/7w1rm7gq_kb%20step%20up%203.png',
          intensityReason: 'Explosive intent develops unilateral power and landing control',
          moodTips: [
            { icon: 'flash', title: 'Attack every rep upward', description: 'Power should be intentional.' },
            { icon: 'shield', title: 'Stick the landing clean', description: 'Control proves real strength.' },
            { icon: 'flame', title: 'Push near failure late', description: 'Last rounds should test you.' }
          ]
        },
        {
          name: 'KB Swing Intervals',
          duration: '16–18 min',
          description: 'High-output swings performed in timed explosive intervals',
          battlePlan: '5 rounds\n• 20s on / 20s off\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/qt6ggg2u_kb%20swing%203.png',
          intensityReason: 'Timed intervals demand max power output rep after rep',
          moodTips: [
            { icon: 'flash', title: 'Every rep is max effort', description: 'Treat it like a sprint.' },
            { icon: 'shield', title: 'Stay sharp under fatigue', description: 'Don’t lose hinge form.' },
            { icon: 'flame', title: 'Push to your limit', description: 'Final rounds should be brutal.' }
          ]
        },
        {
          name: 'KB Heavy Deadlift',
          duration: '16–18 min',
          description: 'Heavy deadlifts focusing on maximal strength and power output',
          battlePlan: '4 rounds\n• 5–6 reps\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/29ao1zhg_kb%20deadlift%203.png',
          intensityReason: 'Heavy low-rep work builds raw posterior chain strength',
          moodTips: [
            { icon: 'barbell', title: 'Treat every rep like a max', description: 'Full focus and brace.' },
            { icon: 'shield', title: 'Stay tight throughout', description: 'No slack.' },
            { icon: 'flame', title: 'Final sets near failure', description: 'Should feel demanding.' }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Pendulum Squat',
    icon: 'fitness',
    workouts: {
      beginner: [
        {
          name: 'Controlled Pendulum Squat',
          duration: '10–12 min',
          description: 'Machine-guided squats emphasizing control and depth',
          battlePlan: '3 rounds\n• 10–12 Pendulum Squats\nRest 75s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/4ei74z7h_Pendullum%20squat.png',
          intensityReason: 'Guided path lets beginners focus purely on depth and quad engagement',
          moodTips: [
            { icon: 'navigate', title: 'Let machine guide path', description: 'Focus on smooth movement.' },
            { icon: 'arrow-down', title: 'Slow descent', description: 'Build tension gradually.' },
            { icon: 'body', title: 'Push evenly', description: 'Balanced pressure prevents drift.' }
          ]
        },
        {
          name: 'Pendulum Squat Pause',
          duration: '10–12 min',
          description: 'Paused reps improving bottom control',
          battlePlan: '3 rounds\n• 8–10 Squats (2s pause)\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/6qfpin63_Pendullum%20squat%202.png',
          intensityReason: 'Paused reps remove momentum and reinforce control out of the bottom',
          moodTips: [
            { icon: 'pause', title: 'Pause just above depth', description: 'Removes momentum.' },
            { icon: 'shield', title: 'Stay tight', description: 'No relaxation at bottom.' },
            { icon: 'arrow-up', title: 'Smooth drive upward', description: 'Controlled power.' }
          ]
        },
        {
          name: 'Tempo Pendulum Squat',
          duration: '10–12 min',
          description: 'Slow eccentric squats building tension',
          battlePlan: '3 rounds\n• 10 Squats (3s eccentric)\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/uqrxzr6n_Pendullum%20squat%203.png',
          intensityReason: 'Slow eccentric maximises quad time under tension',
          moodTips: [
            { icon: 'timer', title: '3-second descent', description: 'Constant quad tension.' },
            { icon: 'body', title: 'Stay connected to pad', description: 'Keeps movement stable.' },
            { icon: 'arrow-up', title: 'Drive smoothly', description: 'No bouncing.' }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Pendulum Squat Drop Set',
          duration: '14–16 min',
          description: 'Extended squat sets using rapid weight drops',
          battlePlan: '3 rounds\n• 8 Squats\n• Drop → 8\n• Drop → 8\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/4ei74z7h_Pendullum%20squat.png',
          intensityReason: 'Back-to-back drops extend effort past traditional failure',
          moodTips: [
            { icon: 'flash', title: 'Immediate drops', description: 'No rest between sets.' },
            { icon: 'trending-down', title: 'Reduce ~25%', description: 'Maintain form.' },
            { icon: 'shield', title: 'Stay controlled', description: 'Don’t rush lighter reps.' }
          ]
        },
        {
          name: 'Heel-Elevated Pendulum Squat',
          duration: '14–16 min',
          description: 'Quad-biased squats using heel elevation',
          battlePlan: '4 rounds\n• 8–10 Squats\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/6qfpin63_Pendullum%20squat%202.png',
          intensityReason: 'Heel elevation deepens range and biases the quads',
          moodTips: [
            { icon: 'trending-up', title: 'Heels raised', description: 'Increases quad loading.' },
            { icon: 'resize', title: 'Deep range', description: 'Maximize stretch.' },
            { icon: 'body', title: 'Stay upright', description: 'Prevents hip takeover.' }
          ]
        },
        {
          name: 'Pendulum Squat Pulses',
          duration: '14–16 min',
          description: 'Squats extended with bottom pulses',
          battlePlan: '3 rounds\n• 8 Squats + 5 pulses\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/uqrxzr6n_Pendullum%20squat%203.png',
          intensityReason: 'Pulses keep tension where it counts most',
          moodTips: [
            { icon: 'pulse', title: 'Pulse at depth', description: 'Small movements increase burn.' },
            { icon: 'arrow-down', title: 'Stay low', description: 'Keep tension constant.' },
            { icon: 'flame', title: 'Expect fatigue early', description: 'That’s intentional.' }
          ]
        }
      ],
      advanced: [
        {
          name: 'Heavy Pendulum Squat',
          duration: '16–18 min',
          description: 'Low-rep squats emphasizing maximal strength',
          battlePlan: '5 rounds\n• 5–6 Squats\nRest 150s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/4ei74z7h_Pendullum%20squat.png',
          intensityReason: 'Heavy low-rep work develops raw quad strength',
          moodTips: [
            { icon: 'shield', title: 'Brace before every rep', description: 'Treat each rep as a single.' },
            { icon: 'arrow-down', title: 'Control eccentric', description: 'Don’t drop into bottom.' },
            { icon: 'people', title: 'Spotter recommended', description: 'Heavy loads demand safety.' }
          ]
        },
        {
          name: 'Pendulum Squat Burnout',
          duration: '18–20 min',
          description: 'High-rep finisher driving full quad fatigue',
          battlePlan: '3 rounds\n• 15–20 Squats\nRest 150s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/6qfpin63_Pendullum%20squat%202.png',
          intensityReason: 'High-rep volume drives quads to total fatigue',
          moodTips: [
            { icon: 'repeat', title: 'No lockout', description: 'Constant tension.' },
            { icon: 'barbell', title: 'Moderate load', description: 'Allows continuous reps.' },
            { icon: 'flame', title: 'Push through burn', description: 'That’s the goal.' }
          ]
        },
        {
          name: 'Pendulum Squat 1.5 Reps',
          duration: '18–20 min',
          description: 'Extended reps increasing time under tension',
          battlePlan: '4 rounds\n• 6–8 (1.5 reps)\nRest 150s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_9d0aea56-4cb2-4f62-99c8-0784f5144466/artifacts/uqrxzr6n_Pendullum%20squat%203.png',
          intensityReason: '1.5 reps double time spent in the deepest range',
          moodTips: [
            { icon: 'arrow-down', title: 'Half rep + full rep', description: 'One full cycle equals one rep.' },
            { icon: 'timer', title: 'Stay controlled', description: 'No rushing.' },
            { icon: 'flame', title: 'Deep burn expected', description: 'That’s intentional.' }
          ]
        }
      ]
    }
  }
];

