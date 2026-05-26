import { EquipmentWorkouts } from '../types/workout';

export const quadsWorkoutDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Barbell',
    icon: 'barbell',
    workouts: {
      beginner: [
        {
          name: 'Barbell Sissy Squat',
          duration: '10–12 min',
          description: 'Front held bar guides posture as quads take full load',
          battlePlan: '3 rounds\n• 10–12 Light Barbell Sissy Squats\nRest 75s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/z4gtn2yh_bb%20sissy%20squat.png',
          intensityReason: 'Teaches quad isolation through knee forward motion',
          moodTips: [
            {
              icon: 'construct',
              title: 'Hold bar against hips, elbows tucked in',
              description: 'Proper bar position maintains stability during quad isolation.'
            },
            {
              icon: 'trending-down',
              title: 'Lean back, knees push forward smoothly',
              description: 'Knee-forward motion maximizes quad activation while maintaining control.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'squat',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Assisted Sissy Squat Hold',
          duration: '10–12 min',
          description: 'Static hold reinforces posture and leg strength',
          battlePlan: '3 rounds\n• 6–8 Sissy Squats\n• Add 10s Hold each set\nRest 75s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/fwtkmsgm_bb%20sissy%20squat%202.png',
          intensityReason: 'Iso hold at squat bottom builds quad endurance',
          moodTips: [
            {
              icon: 'timer',
              title: 'At bottom hold position for 10s',
              description: 'Extended hold at bottom position builds isometric quad strength.'
            },
            {
              icon: 'flash',
              title: 'Drive knees forward, chest upright',
              description: 'Proper positioning ensures maximum quad engagement during hold.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'squat',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Controlled Barbell Reverse Lunge',
          duration: '12–14 min',
          description: 'Reverse lunges building quad strength with stable controlled reps',
          battlePlan: '3 rounds\n• 8 per leg\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/i4zgpwgm_bb%20lunge.png',
          intensityReason: 'Reverse lunges teach quad loading with stable balance',
          moodTips: [
            { icon: 'arrow-back', title: 'Step back slower than you want to', description: 'Control creates better quad loading and balance.' },
            { icon: 'footsteps', title: 'Keep your front foot planted fully', description: 'Pressure through toes usually means instability.' },
            { icon: 'checkmark-circle', title: 'Finish feeling confident', description: 'You should still feel smooth on your last reps.' }
          ],
          exercise_type: 'compound',
          movement_pattern: 'lunge',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Supported Barbell Step-Up',
          duration: '12–14 min',
          description: 'Step-ups building quad strength while improving balance control',
          battlePlan: '3 rounds\n• 8 per leg\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/cut2mtn3_bb%20step%20up.png',
          intensityReason: 'Lower box height builds quad strength with controlled balance',
          moodTips: [
            { icon: 'resize', title: 'Use a box height you can fully control', description: 'Too much height changes the movement completely.' },
            { icon: 'flash', title: 'Drive through the lead leg only', description: 'Your back foot should barely assist the rep.' },
            { icon: 'shield', title: 'Every rep should feel stable', description: 'Confidence matters more than fatigue here.' }
          ],
          exercise_type: 'compound',
          movement_pattern: 'lunge',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Tempo Front Squat',
          duration: '12–14 min',
          description: 'Slow eccentric front squats building quad control and posture',
          battlePlan: '3 rounds\n• 8 reps (3s eccentric)\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/moogyxzc_bb%20front%20squat.png',
          intensityReason: 'Slow eccentric amplifies quad tension under controlled posture',
          moodTips: [
            { icon: 'arrow-down', title: 'Lower slower than feels natural', description: 'Most of the challenge happens on the way down.' },
            { icon: 'arrow-up', title: 'Keep elbows high through every rep', description: 'Posture determines where tension goes.' },
            { icon: 'checkmark-circle', title: 'Finish with clean movement left', description: 'You should feel practiced, not destroyed.' }
          ],
          exercise_type: 'compound',
          movement_pattern: 'squat',
          training_style: 'strength',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Weighted Sissy Squat',
          duration: '14–16 min',
          description: 'Adds weight to sissy squat for deeper hypertrophy',
          battlePlan: '4 rounds\n• 8–10 Weighted Sissy Squats\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/z4gtn2yh_bb%20sissy%20squat.png',
          intensityReason: 'Front bar load progression maximizes quad stress',
          moodTips: [
            {
              icon: 'construct',
              title: 'Hold bar firm at hip hinge crease',
              description: 'Secure bar position allows for controlled weighted movement.'
            },
            {
              icon: 'trending-down',
              title: 'Control descent, heels flat anchored',
              description: 'Controlled movement with stable base maximizes quad activation.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'squat',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Sissy Squat 1½ Reps',
          duration: '14–16 min',
          description: 'High tension squatting style grows endurance fast',
          battlePlan: '3 rounds\n• 8 Combo Reps (half + full = 1)\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/fwtkmsgm_bb%20sissy%20squat%202.png',
          intensityReason: 'Half+full rep sequence lengthens quad activation',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Perform half rep, then full as one',
              description: 'Complex rep pattern extends time under tension for quads.'
            },
            {
              icon: 'construct',
              title: 'Keep bar tight, don\'t roll forward',
              description: 'Maintain bar position and posture throughout complex movement.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'squat',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Front Foot Elevated Barbell Lunge',
          duration: '14–16 min',
          description: 'Elevated lunges increasing quad tension and range of motion',
          battlePlan: '4 rounds\n• 8 per leg (3s eccentric)\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/i4zgpwgm_bb%20lunge.png',
          intensityReason: 'Front-foot elevation deepens range and quad loading',
          moodTips: [
            { icon: 'arrow-forward', title: 'Let the knee travel forward naturally', description: 'That deeper bend is what loads the quads hardest.' },
            { icon: 'arrow-down', title: 'Lower under full control', description: 'The eccentric should feel harder than the ascent.' },
            { icon: 'flame', title: 'The burn should build steadily', description: 'Especially by rounds 3 and 4.' }
          ],
          exercise_type: 'compound',
          movement_pattern: 'lunge',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Front Rack Knee Drive Step-Up',
          duration: '14–16 min',
          description: 'Front-loaded step-ups increasing quad tension and balance demand',
          battlePlan: '4 rounds\n• 8 per leg\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/cut2mtn3_bb%20step%20up.png',
          intensityReason: 'Front-rack load adds balance demand and full quad recruitment',
          moodTips: [
            { icon: 'flash', title: 'Drive the knee aggressively at the top', description: 'That added force increases quad recruitment.' },
            { icon: 'pause', title: 'Pause before stepping down', description: 'Stability is part of the challenge here.' },
            { icon: 'shield', title: 'Your quads should stay loaded continuously', description: 'Avoid bouncing between reps.' }
          ],
          exercise_type: 'compound',
          movement_pattern: 'lunge',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Heel-Elevated Front Squat Pause',
          duration: '14–16 min',
          description: 'Paused front squats increasing quad loading and tension buildup',
          battlePlan: '4 rounds\n• 6–8 reps (2s pause)\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/moogyxzc_bb%20front%20squat.png',
          intensityReason: 'Heel elevation + pause biases load directly into the quads',
          moodTips: [
            { icon: 'arrow-forward', title: 'Let your knees travel forward confidently', description: 'That forward travel is what biases the quads.' },
            { icon: 'pause', title: 'Pause without relaxing at depth', description: 'Stay fully braced the entire hold.' },
            { icon: 'flame', title: 'The quad pump should become obvious', description: 'Especially during later rounds.' }
          ],
          exercise_type: 'compound',
          movement_pattern: 'squat',
          training_style: 'strength',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Barbell Hack Squat',
          duration: '16–18 min',
          description: 'Upright torso hack squat builds quads with tension',
          battlePlan: '4 rounds\n• 8–10 Hack Squats\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240636/mood_app/workout_images/3hob85xt_download_22_.jpg',
          intensityReason: 'Behind back hold redirects load heavily to quads',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Bar low behind legs, shoulders tall',
              description: 'Proper bar positioning ensures maximum quad emphasis.'
            },
            {
              icon: 'flash',
              title: 'Drive knees forward over toes steady',
              description: 'Forward knee drive maintains quad focus throughout movement.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'squat',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Sissy + Hack Squat Combo',
          duration: '16–18 min',
          description: 'Dual movement combo overloads quads with fatigue',
          battlePlan: '3 rounds\n• 6 Front Hold Sissy Squats\n• 6 Barbell Hack Squats\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/z4gtn2yh_bb%20sissy%20squat.png',
          intensityReason: 'Pairing front and back styles crushes quad fibers',
          moodTips: [
            {
              icon: 'construct',
              title: 'Do sissy squats first to pre fatigue',
              description: 'Pre-fatigue strategy maximizes quad overload in combination.'
            },
            {
              icon: 'flash',
              title: 'Transition fast to hack squats next',
              description: 'Quick transition maintains fatigue for maximum quad stress.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'squat',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Barbell Walking Lunge Drop Set',
          duration: '16–18 min',
          description: 'Walking lunges extended with drops pushing quads near failure',
          battlePlan: '3 rounds\n• 10 per leg\n• Drop → 10\n• Drop → BW walking lunges\nRest 150s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/i4zgpwgm_bb%20lunge.png',
          intensityReason: 'Drop sets sustain quad effort past traditional failure',
          moodTips: [
            { icon: 'walk', title: 'Don’t stop walking once the burn starts', description: 'Fatigue is where this variation becomes effective.' },
            { icon: 'arrow-down', title: 'Drop weight before form breaks', description: 'Intensity stays high without sacrificing mechanics.' },
            { icon: 'flame', title: 'Final steps should feel brutal', description: 'You should barely finish the last stretch.' }
          ],
          exercise_type: 'compound',
          movement_pattern: 'lunge',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Deficit Barbell Step-Up',
          duration: '16–18 min',
          description: 'Deficit step-ups increasing range, tension, and quad fatigue',
          battlePlan: '4 rounds\n• 6–8 per leg\nRest 150s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/cut2mtn3_bb%20step%20up.png',
          intensityReason: 'Increased deficit deepens range and quad loading',
          moodTips: [
            { icon: 'arrow-down', title: 'Own the deepest part of the movement', description: 'More range creates more quad tension.' },
            { icon: 'shield', title: 'Stay balanced while fatigued', description: 'Control separates strong reps from sloppy ones.' },
            { icon: 'flame', title: 'Final rounds should slow down hard', description: 'Near failure is the goal here.' }
          ],
          exercise_type: 'compound',
          movement_pattern: 'lunge',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Front Squat 1.5 Reps',
          duration: '16–18 min',
          description: 'Extended-rep front squats driving relentless quad tension',
          battlePlan: '4 rounds\n• 6–8 reps (1.5 reps)\nRest 150s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/moogyxzc_bb%20front%20squat.png',
          intensityReason: '1.5 reps double time spent in the deepest quad-loading range',
          moodTips: [
            { icon: 'arrow-down', title: 'Own the bottom half of every rep', description: 'That’s where the quads work hardest.' },
            { icon: 'timer', title: 'Stay patient once fatigue hits', description: 'Rushing instantly removes tension.' },
            { icon: 'flame', title: 'The last rounds should feel relentless', description: 'You should question the final reps.' }
          ],
          exercise_type: 'compound',
          movement_pattern: 'squat',
          training_style: 'strength',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Leg Extension Machine',
    icon: 'hardware-chip',
    workouts: {
      beginner: [
        {
          name: 'Standard Leg Extension',
          duration: '10–12 min',
          description: 'Perfect intro for building controlled quad strength',
          battlePlan: '3 rounds\n• 12–15 Leg Extensions\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240641/mood_app/workout_images/er89oli2_download_23_.jpg',
          intensityReason: 'Isolates quads through safe guided flexion path',
          moodTips: [
            {
              icon: 'body',
              title: 'Sit upright with back pressed tight',
              description: 'Proper seating position ensures isolated quad activation.'
            },
            {
              icon: 'construct',
              title: 'Kick straight, avoid locking knees',
              description: 'Controlled extension prevents joint stress while targeting quads.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_extension',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Iso Extension Hold',
          duration: '10–12 min',
          description: 'Builds mind muscle connection through iso tension',
          battlePlan: '3 rounds\n• 8–10 Iso Hold Extensions (3s hold)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240639/mood_app/workout_images/6hwlna7o_quad_ext.jpg',
          intensityReason: 'Holding peak strengthens quads safely under load',
          moodTips: [
            {
              icon: 'timer',
              title: 'Extend, hold 3s peak contraction',
              description: 'Isometric hold at peak builds strength and muscle control.'
            },
            {
              icon: 'construct',
              title: 'Lower pad smooth each rep',
              description: 'Controlled eccentric maximizes quad development.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_extension',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Controlled Leg Extension',
          duration: '10–12 min',
          description: 'Smooth extensions building basic quad control',
          battlePlan: '3 rounds\n• 12–15 Leg Extensions\nRest 60–75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240672/mood_app/workout_images/fnft7ru4_download_6_.jpg',
          intensityReason: 'Controlled movement builds foundational quad strength',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Light load first',
              description: 'Prioritize control before increasing weight.'
            },
            {
              icon: 'resize',
              title: 'Full knee extension',
              description: 'Lock out gently to fully shorten quads.'
            },
            {
              icon: 'timer',
              title: 'Slow return down',
              description: 'Control keeps tension on the muscle.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_extension',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Heavy Extensions',
          duration: '14–16 min',
          description: 'Machine allows safe overload using strict form',
          battlePlan: '4 rounds\n• 8–10 Heavy Extensions\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240641/mood_app/workout_images/er89oli2_download_23_.jpg',
          intensityReason: 'Progressive heavy loading maximizes quad growth',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Grip handles tight to stabilize',
              description: 'Secure grip maintains stability for heavy quad extensions.'
            },
            {
              icon: 'flash',
              title: 'Drive pad up forceful, control back',
              description: 'Explosive concentric with controlled eccentric builds strength.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_extension',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: '1½ Rep Leg Extensions',
          duration: '14–16 min',
          description: 'Longer muscle strain increases hypertrophy response',
          battlePlan: '3 rounds\n• 8–10 Total Combo Reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240639/mood_app/workout_images/6hwlna7o_quad_ext.jpg',
          intensityReason: 'Half+full rep cycle expands quad time under load',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Perform one half + one full rep',
              description: 'Complex rep pattern extends time under tension significantly.'
            },
            {
              icon: 'construct',
              title: 'Keep tempo smooth, don\'t drop pad',
              description: 'Controlled movement maintains tension throughout range.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_extension',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Pause Leg Extension',
          duration: '12–14 min',
          description: 'Paused reps reinforcing peak quad contraction',
          battlePlan: '4 rounds\n• 10 Extensions (2s pause at top)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240672/mood_app/workout_images/fnft7ru4_download_6_.jpg',
          intensityReason: 'Paused contractions maximize quad activation',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause at lockout',
              description: 'Two-second hold intensifies quad activation.'
            },
            {
              icon: 'footsteps',
              title: 'Toes slightly up',
              description: 'Encourages quad dominance.'
            },
            {
              icon: 'construct',
              title: 'Controlled eccentric',
              description: 'No dropping the weight stack.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_extension',
          training_style: 'strength',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Drop Set Leg Extensions',
          duration: '16–18 min',
          description: 'Stripping load forces fibers to contract under fatigue',
          battlePlan: '3 rounds\n• 10 Heavy Extensions\n• Drop 15–20% → 8 reps\n• Drop 15–20% → 8 reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240641/mood_app/workout_images/er89oli2_download_23_.jpg',
          intensityReason: 'Dropsets extend effort for intense quad overload',
          moodTips: [
            {
              icon: 'flash',
              title: 'Strip 15–20% weight fast',
              description: 'Quick weight reduction maintains fatigue for maximum benefit.'
            },
            {
              icon: 'construct',
              title: 'Don\'t rush, keep controlled tempo',
              description: 'Maintain movement quality throughout all drop sets.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_extension',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Leg Extension Iso Burnout',
          duration: '16–18 min',
          description: 'Pairing holds with reps completely crushes quads',
          battlePlan: '3 rounds\n• 10s Iso Hold at Extension\n• Immediately 10–12 Full Reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240639/mood_app/workout_images/6hwlna7o_quad_ext.jpg',
          intensityReason: 'Static hold plus reps maximizes quad endurance',
          moodTips: [
            {
              icon: 'timer',
              title: 'Hold pad high for 10s, then rep out',
              description: 'Isometric hold followed by reps creates maximum quad fatigue.'
            },
            {
              icon: 'shield',
              title: 'No bouncing pad into stack',
              description: 'Controlled movement prevents equipment damage and injury.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_extension',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Drop Set Leg Extension',
          duration: '16–18 min',
          description: 'Extended quad isolation using fast weight drops',
          battlePlan: '3 rounds\n• 8 Heavy Extensions\n• Drop → 10\n• Drop → 10\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240672/mood_app/workout_images/fnft7ru4_download_6_.jpg',
          intensityReason: 'Drop sets maximize quad fatigue and hypertrophy',
          moodTips: [
            {
              icon: 'flash',
              title: 'Immediate weight drops',
              description: 'Reduce load 20–30% without resting.'
            },
            {
              icon: 'timer',
              title: 'Same rep tempo',
              description: 'Lighter weight does not mean faster reps.'
            },
            {
              icon: 'flame',
              title: 'Chase quad pump',
              description: 'Burn should peak above the knee.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'leg_extension',
          training_style: 'pump',
          intensity_cost: 5,
        }
      ]
    }
  }
];
