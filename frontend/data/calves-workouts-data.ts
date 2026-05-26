import { EquipmentWorkouts } from '../types/workout';

export const calvesWorkoutDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Dumbbells',
    icon: 'fitness',
    workouts: {
      beginner: [
        {
          name: 'Standing DB Calf Raise',
          duration: '10–12 min',
          description: 'Simple standing lift for foundational calf development',
          battlePlan: '3 rounds\n• 15–20 Standing Calf Raises\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240640/mood_app/workout_images/ag6d909x_download_28_.jpg',
          intensityReason: 'Basic raise builds calf strength with controlled range',
          moodTips: [
            {
              icon: 'construct',
              title: 'Hold dumbbells, stand tall, rise high',
              description: 'Proper posture and maximum range ensure effective calf activation.'
            },
            {
              icon: 'trending-down',
              title: 'Control descent, feel full stretch low',
              description: 'Controlled eccentric maximizes muscle development and safety.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Seated DB Calf Raise',
          duration: '10–12 min',
          description: 'Targets deeper calf muscle with stable seated form',
          battlePlan: '3 rounds\n• 12–15 Seated Calf Raises\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240633/mood_app/workout_images/1iqoqmt3_download_29_.jpg',
          intensityReason: 'Seated position isolates soleus muscle for growth',
          moodTips: [
            {
              icon: 'construct',
              title: 'Place DB on knee, press through ball of foot',
              description: 'Proper weight placement ensures targeted soleus activation.'
            },
            {
              icon: 'shield',
              title: 'Control stretch, avoid bouncing weight',
              description: 'Smooth movement prevents injury and maintains muscle tension.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Dumbbell Supported Calf Raise',
          duration: '8–10 min',
          description: 'Assisted calf raises improving balance and control',
          battlePlan: '3 rounds\n• 15 Raises\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240674/mood_app/workout_images/h32rmzt1_db_calf_raise.jpg',
          intensityReason: 'Supported position allows focus on calf activation',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Hold support lightly',
              description: 'Balance aid only.'
            },
            {
              icon: 'resize',
              title: 'Full heel drop',
              description: 'Stretch calves completely.'
            },
            {
              icon: 'timer',
              title: 'Slow tempo',
              description: 'Improves mind–muscle connection.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Single‑Leg DB Calf Raise',
          duration: '14–16 min',
          description: 'Isolates each calf for balanced strength and size',
          battlePlan: '4 rounds\n• 10–12 per leg Single‑Leg Raises\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241341/mood_app/workout_images/comj9q78_download_4_.jpg',
          intensityReason: 'Unilateral raise increases load and balance demand',
          moodTips: [
            {
              icon: 'construct',
              title: 'Hold DB opposite working leg, use wall for balance',
              description: 'Strategic weight placement and support optimize single-leg training.'
            },
            {
              icon: 'shield',
              title: 'Rise high, control stretch, no bouncing',
              description: 'Full range with control maximizes unilateral calf development.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'DB Calf Raise (Tempo + Bodyweight)',
          duration: '14–16 min',
          description: 'Controlled tempo builds endurance and hypertrophy',
          battlePlan: '3 rounds\n• 10–12 Tempo Calf Raises\n• • Immediately 15 Bodyweight Calf Raises\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240633/mood_app/workout_images/1iqoqmt3_download_29_.jpg',
          intensityReason: 'Slow eccentric phase maximizes calf time under tension',
          moodTips: [
            {
              icon: 'timer',
              title: '3s lowering, 1s hold top, 1s up',
              description: 'Strict tempo control maximizes muscle activation and growth.'
            },
            {
              icon: 'flash',
              title: 'Finish with quick bodyweight reps',
              description: 'High-rep finisher extends training stimulus beyond failure.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Dumbbell Single-Leg Calf Raise',
          duration: '10–12 min',
          description: 'Unilateral raises increasing calf loading',
          battlePlan: '4 rounds\n• 10 Raises per leg\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240674/mood_app/workout_images/h32rmzt1_db_calf_raise.jpg',
          intensityReason: 'Single-leg work doubles effective load per calf',
          moodTips: [
            {
              icon: 'body',
              title: 'Non-working leg off floor',
              description: 'One calf does all work.'
            },
            {
              icon: 'timer',
              title: 'Pause at lockout',
              description: 'Peak contraction emphasis.'
            },
            {
              icon: 'shield',
              title: 'Control balance first',
              description: 'Stability before weight.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'DB Calf Raise (Drop Set)',
          duration: '16–18 min',
          description: 'Stripping load forces fibers to contract under fatigue',
          battlePlan: '3 rounds\n• 12 Heavy Calf Raises\n• Drop 15–20% → 10 reps\n• Drop 15–20% → 10 reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240640/mood_app/workout_images/ag6d909x_download_28_.jpg',
          intensityReason: 'Drop sets extend effort for intense calf overload',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drop 15–20% weight fast, keep going',
              description: 'Quick weight reduction maintains fatigue for maximum benefit.'
            },
            {
              icon: 'construct',
              title: 'Maintain full range across all drops',
              description: 'Consistent form throughout drops ensures continued effectiveness.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'DB Calf Raise (Iso + Jumps)',
          duration: '16–18 min',
          description: 'Combo reps with iso hold completely crushes calves',
          battlePlan: '3 rounds\n• 12–15 Calf Raises\n• Finish with 10s Iso Hold at top\n• Immediately 10 Stiff Leg Jumps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240633/mood_app/workout_images/1iqoqmt3_download_29_.jpg',
          intensityReason: 'Static hold at peak contraction maximizes tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Hold peak contraction 10s on last rep',
              description: 'Isometric hold maximizes muscle tension and metabolic stress.'
            },
            {
              icon: 'flash',
              title: 'Explode into jumps, land soft on balls',
              description: 'Plyometric finish develops power and completes muscle fatigue.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Dumbbell Calf Raise Ladder',
          duration: '14–16 min',
          description: 'Descending ladder maximizing calf fatigue',
          battlePlan: '2–3 ladders\n• 20 → 15 → 10 Raises\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240674/mood_app/workout_images/h32rmzt1_db_calf_raise.jpg',
          intensityReason: 'Ladder format accumulates high training volume',
          moodTips: [
            {
              icon: 'flash',
              title: 'No rest between rungs',
              description: 'Ladder keeps calves loaded.'
            },
            {
              icon: 'resize',
              title: 'Range never shortens',
              description: 'Stretch and squeeze every rep.'
            },
            {
              icon: 'flame',
              title: 'Finish with burn',
              description: 'Last rung should sting.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Barbell',
    icon: 'barbell',
    workouts: {
      beginner: [
        {
          name: 'Standing Barbell Calf Raise',
          duration: '10–12 min',
          description: 'Classic standing raise for overall calf development',
          battlePlan: '3 rounds\n• 15–20 Standing Calf Raises\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240650/mood_app/workout_images/vfevelz1_download_24_.jpg',
          intensityReason: 'Barbell load builds foundational calf strength',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Bar on traps, stand tall, rise high',
              description: 'Proper bar position and posture maximize calf activation safely.'
            },
            {
              icon: 'trending-down',
              title: 'Control descent, feel full stretch low',
              description: 'Full range of motion maximizes muscle development.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Barbell Calf Raise (Elevated)',
          duration: '10–12 min',
          description: 'Plate under toes enhances calf muscle activation',
          battlePlan: '3 rounds\n• 12–15 Elevated Calf Raises\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240653/mood_app/workout_images/xf7sknhj_download_25_.jpg',
          intensityReason: 'Elevated toes increase stretch for deeper range',
          moodTips: [
            {
              icon: 'construct',
              title: 'Stand on 1–2" plate, heels off edge',
              description: 'Elevated position increases range for deeper calf stretch.'
            },
            {
              icon: 'flash',
              title: 'Control stretch, rise high on toes',
              description: 'Extended range maximizes muscle activation and development.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Barbell Standing Calf Raise',
          duration: '8–10 min',
          description: 'Standing calf raises building basic ankle strength',
          battlePlan: '3 rounds\n• 15 Standing Calf Raises\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240687/mood_app/workout_images/tzc8onjz_bb_calf_raise.jpg',
          intensityReason: 'Standing position maximizes gastrocnemius activation',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Bar balanced mid-foot',
              description: 'Even pressure prevents rocking.'
            },
            {
              icon: 'resize',
              title: 'Full stretch at bottom',
              description: 'Heels drop under control.'
            },
            {
              icon: 'timer',
              title: 'Pause at top',
              description: 'Brief squeeze improves activation.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Barbell Calf Raise',
          duration: '14–16 min',
          description: 'Builds strength and control through isometric hold',
          battlePlan: '4 rounds\n• 10–12 Pause Calf Raises\n• Immediately 15 Bodyweight Calf Raises\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240650/mood_app/workout_images/vfevelz1_download_24_.jpg',
          intensityReason: 'Pause at top maximizes peak contraction tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause 2s at peak contraction',
              description: 'Isometric hold builds strength and muscle control.'
            },
            {
              icon: 'flash',
              title: 'Finish with quick bodyweight reps',
              description: 'High-rep finisher extends stimulus beyond normal capacity.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Barbell Calf Raise (Tempo)',
          duration: '14–16 min',
          description: 'Controlled tempo builds endurance and hypertrophy',
          battlePlan: '3 rounds\n• 10–12 Tempo Calf Raises\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240653/mood_app/workout_images/xf7sknhj_download_25_.jpg',
          intensityReason: 'Slow eccentric phase maximizes calf time under tension',
          moodTips: [
            {
              icon: 'timer',
              title: '3s lowering, 1s hold top, 1s up',
              description: 'Tempo control maximizes time under tension for growth.'
            },
            {
              icon: 'construct',
              title: 'Keep full range, don\'t cut reps short',
              description: 'Complete range of motion ensures maximum muscle activation.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Barbell Tempo Calf Raise',
          duration: '10–12 min',
          description: 'Slow eccentrics increasing calf time under tension',
          battlePlan: '4 rounds\n• 12 Calf Raises (3s eccentric)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240687/mood_app/workout_images/tzc8onjz_bb_calf_raise.jpg',
          intensityReason: 'Tempo work maximizes muscle fiber recruitment',
          moodTips: [
            {
              icon: 'timer',
              title: 'Three-second lower',
              description: 'Lengthened loading drives growth.'
            },
            {
              icon: 'body',
              title: 'Knees softly extended',
              description: 'Biases gastrocnemius.'
            },
            {
              icon: 'construct',
              title: 'No bouncing reps',
              description: 'Momentum kills tension.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'strength',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Barbell Calf Raise (Drop Set)',
          duration: '16–18 min',
          description: 'Stripping load forces fibers to contract under fatigue',
          battlePlan: '3 rounds\n• 12 Heavy Calf Raises\n• Drop 15–20% → 10 reps\n• Drop 15–20% → 10 reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240650/mood_app/workout_images/vfevelz1_download_24_.jpg',
          intensityReason: 'Drop sets extend effort for intense calf overload',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drop 15–20% weight fast, keep going',
              description: 'Quick transitions maintain fatigue for maximum overload.'
            },
            {
              icon: 'construct',
              title: 'Maintain full range across all drops',
              description: 'Consistent form throughout ensures continued effectiveness.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Barbell Calf Raise (Iso + Jumps)',
          duration: '16–18 min',
          description: 'Combo reps with iso hold completely crushes calves',
          battlePlan: '3 rounds\n• 12–15 Calf Raises\n• Finish with 10s Iso Hold at top\n• Immediately 10 Stiff Leg Jumps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240653/mood_app/workout_images/xf7sknhj_download_25_.jpg',
          intensityReason: 'Static hold at peak contraction maximizes tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Hold peak contraction 10s on last rep',
              description: 'Extended isometric maximizes metabolic stress on calves.'
            },
            {
              icon: 'flash',
              title: 'Explode into jumps, land soft on balls',
              description: 'Plyometric finish develops power and completes fatigue.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Barbell Calf Raise Drop Set',
          duration: '14–16 min',
          description: 'Extended standing raises using fast load reductions',
          battlePlan: '3 rounds\n• 10 Heavy Raises\n• Drop → 12\n• Drop → 15\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240687/mood_app/workout_images/tzc8onjz_bb_calf_raise.jpg',
          intensityReason: 'Drop sets push calves to complete fatigue',
          moodTips: [
            {
              icon: 'flash',
              title: 'Immediate weight drops',
              description: 'Reduce load 20–30% without rest.'
            },
            {
              icon: 'resize',
              title: 'Same range every rep',
              description: 'Stretch and lockout unchanged.'
            },
            {
              icon: 'flame',
              title: 'Chase deep burn',
              description: 'Calves should fatigue fully.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'pump',
          intensity_cost: 5,
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
          name: 'Leg Press Calf Raise (Neutral)',
          duration: '10–12 min',
          description: 'Basic press for foundational calf development',
          battlePlan: '3 rounds\n• 15–20 Calf Raises\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240644/mood_app/workout_images/jwime8o9_download_30_.jpg',
          intensityReason: 'Machine guidance builds calf strength safely',
          moodTips: [
            {
              icon: 'construct',
              title: 'Feet shoulder width, toes on bottom edge',
              description: 'Proper foot placement ensures optimal calf activation angle.'
            },
            {
              icon: 'flash',
              title: 'Press through balls of feet, full stretch',
              description: 'Complete range maximizes calf muscle development.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Leg Press Calf Raise (Toes Out)',
          duration: '10–12 min',
          description: 'Foot angle variation for balanced calf growth and stimulation',
          battlePlan: '3 rounds\n• 12–15 Toes Out Calf Raises\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240632/mood_app/workout_images/02ysdj6y_download_31_.jpg',
          intensityReason: 'Toes out stance targets inner calf muscle fibers',
          moodTips: [
            {
              icon: 'construct',
              title: 'Toes pointed out 45°, heels off edge',
              description: 'Angled foot position targets different calf muscle fibers.'
            },
            {
              icon: 'flash',
              title: 'Control stretch, rise high on toes',
              description: 'Full range with angle variation maximizes muscle activation.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Leg Press Calf Raise',
          duration: '8–10 min',
          description: 'Supported calf raises using leg press sled',
          battlePlan: '3 rounds\n• 15 Raises\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240666/mood_app/workout_images/ccewdems_leg_press_calf_raise.jpg',
          intensityReason: 'Sled support allows focus on pure calf work',
          moodTips: [
            {
              icon: 'construct',
              title: 'Feet high on platform',
              description: 'Allows full ankle movement.'
            },
            {
              icon: 'footsteps',
              title: 'Press through toes',
              description: 'Calves initiate movement.'
            },
            {
              icon: 'timer',
              title: 'Slow controlled reps',
              description: 'No bouncing off sled.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Single‑Leg Press Calf Raise',
          duration: '14–16 min',
          description: 'Isolates each calf for balanced strength and size',
          battlePlan: '4 rounds\n• 10–12 per leg Single‑Leg Raises\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241351/mood_app/workout_images/kwq6qti7_Screenshot_2025-12-06_at_9_20_46_PM.jpg',
          intensityReason: 'Unilateral raise increases load and balance demand',
          moodTips: [
            {
              icon: 'construct',
              title: 'One foot on platform, other off',
              description: 'Single-leg setup doubles load and improves balance.'
            },
            {
              icon: 'flash',
              title: 'Press through ball of foot, full stretch',
              description: 'Complete range ensures maximum unilateral development.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Leg Press Calf Raise',
          duration: '14–16 min',
          description: 'Builds strength and control through isometric hold',
          battlePlan: '3 rounds\n• 10–12 Pause Calf Raises\n• Immediately 15 Bodyweight Calf Raises\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240632/mood_app/workout_images/02ysdj6y_download_31_.jpg',
          intensityReason: 'Pause at top maximizes peak contraction tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause 2s at peak contraction',
              description: 'Isometric hold builds strength and muscle control.'
            },
            {
              icon: 'flash',
              title: 'Finish with quick bodyweight reps',
              description: 'High-rep finisher extends training beyond machine capacity.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Leg Press Calf Pause',
          duration: '10–12 min',
          description: 'Paused calf raises emphasizing top-end contraction',
          battlePlan: '4 rounds\n• 12 Raises (2s pause)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240666/mood_app/workout_images/ccewdems_leg_press_calf_raise.jpg',
          intensityReason: 'Paused contractions strengthen shortened position',
          moodTips: [
            {
              icon: 'timer',
              title: 'Two-second pause',
              description: 'Strengthens shortened position.'
            },
            {
              icon: 'body',
              title: 'Knees slightly bent',
              description: 'Reduces joint strain.'
            },
            {
              icon: 'construct',
              title: 'Consistent tempo',
              description: 'Avoid rushing reps.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'strength',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Leg Press Calf Raise (Drop Set)',
          duration: '16–18 min',
          description: 'Stripping load forces fibers to contract under fatigue',
          battlePlan: '3 rounds\n• 12 Heavy Calf Raises\n• Drop 15–20% → 10 reps\n• Drop 15–20% → 10 reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240644/mood_app/workout_images/jwime8o9_download_30_.jpg',
          intensityReason: 'Drop sets extend effort for intense calf overload',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drop 15–20% weight fast, keep going',
              description: 'Quick weight reduction maintains fatigue for benefit.'
            },
            {
              icon: 'construct',
              title: 'Maintain full range across all drops',
              description: 'Consistent form throughout drops ensures effectiveness.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Leg Press Calf Raise (Iso + Jumps)',
          duration: '16–18 min',
          description: 'Combo reps with iso hold completely crushes calves',
          battlePlan: '3 rounds\n• 12–15 Calf Raises\n• Finish with 10s Iso Hold at top\n• Immediately 10 Stiff Leg Jumps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240632/mood_app/workout_images/02ysdj6y_download_31_.jpg',
          intensityReason: 'Static hold at peak contraction maximizes tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Hold peak contraction 10s on last rep',
              description: 'Extended hold maximizes metabolic stress on calves.'
            },
            {
              icon: 'flash',
              title: 'Explode into jumps, land soft on balls',
              description: 'Plyometric finish develops power and completes muscle fatigue.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Leg Press Calf Drop Set',
          duration: '14–16 min',
          description: 'Extended calf sets using rapid sled weight drops',
          battlePlan: '3 rounds\n• 10 Raises\n• Drop → 15\n• Drop → 20\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240666/mood_app/workout_images/ccewdems_leg_press_calf_raise.jpg',
          intensityReason: 'Drop sets push calves to complete exhaustion',
          moodTips: [
            {
              icon: 'flash',
              title: 'Immediate sled unload',
              description: 'Reduce resistance quickly.'
            },
            {
              icon: 'resize',
              title: 'Same ankle range',
              description: 'Stretch stays consistent.'
            },
            {
              icon: 'flame',
              title: 'Expect deep burn',
              description: 'Calves fatigue hard here.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'pump',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Calf Raise Machine',
    icon: 'arrow-up',
    workouts: {
      beginner: [
        {
          name: 'Standing Calf Raise Machine',
          duration: '10–12 min',
          description: 'Basic standing raise for foundational calf development',
          battlePlan: '3 rounds\n• 15–20 Standing Calf Raises\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241350/mood_app/workout_images/kh18cxcw_Screenshot_2025-12-06_at_9_24_28_PM.jpg',
          intensityReason: 'Machine guidance builds calf strength safely',
          moodTips: [
            {
              icon: 'body',
              title: 'Stand tall, rise high on toes',
              description: 'Proper posture ensures maximum calf activation with machine guidance.'
            },
            {
              icon: 'trending-down',
              title: 'Control descent, feel full stretch low',
              description: 'Full range of motion maximizes muscle development safely.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Seated Calf Raise Machine',
          duration: '10–12 min',
          description: 'Targets deeper calf muscle with stable seated form',
          battlePlan: '3 rounds\n• 12–15 Seated Calf Raises\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240649/mood_app/workout_images/tp1piceg_download_26_.jpg',
          intensityReason: 'Seated position isolates soleus muscle for growth',
          moodTips: [
            {
              icon: 'construct',
              title: 'Pad on knees, press through ball of foot',
              description: 'Proper pad placement ensures targeted soleus activation.'
            },
            {
              icon: 'shield',
              title: 'Control stretch, avoid bouncing weight',
              description: 'Smooth movement maintains tension and prevents injury.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Machine Calf Raise',
          duration: '8–10 min',
          description: 'Guided calf raises reinforcing full range control',
          battlePlan: '3 rounds\n• 15 Machine Raises\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240671/mood_app/workout_images/elld3iw7_calf_machine_calf_raise.jpg',
          intensityReason: 'Machine guidance ensures proper calf activation',
          moodTips: [
            {
              icon: 'body',
              title: 'Seat adjusted snug',
              description: 'Hips locked to isolate calves.'
            },
            {
              icon: 'footsteps',
              title: 'Drive through big toe',
              description: 'Improves calf fiber engagement.'
            },
            {
              icon: 'timer',
              title: 'Controlled stretch',
              description: 'Heels lower slowly each rep.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Single‑Leg Calf Raise Machine',
          duration: '14–16 min',
          description: 'Isolates each calf for balanced strength and size',
          battlePlan: '4 rounds\n• 10–12 per leg Single‑Leg Raises\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241326/mood_app/workout_images/97bkhdmm_Screenshot_2025-12-06_at_9_25_30_PM.jpg',
          intensityReason: 'Unilateral raise increases load and balance demand',
          moodTips: [
            {
              icon: 'construct',
              title: 'One foot on platform, other off',
              description: 'Single-leg setup doubles training load for each calf.'
            },
            {
              icon: 'flash',
              title: 'Press through ball of foot, full stretch',
              description: 'Complete range ensures maximum unilateral development.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Calf Raise Machine',
          duration: '14–16 min',
          description: 'Builds strength and control through isometric hold',
          battlePlan: '3 rounds\n• 10–12 Pause Calf Raises\n• Immediately 15 Bodyweight Calf Raises\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240649/mood_app/workout_images/tp1piceg_download_26_.jpg',
          intensityReason: 'Pause at top maximizes peak contraction tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause 2s at peak contraction',
              description: 'Isometric hold builds strength and muscle control.'
            },
            {
              icon: 'flash',
              title: 'Finish with quick bodyweight reps',
              description: 'High-rep finisher extends training beyond machine limit.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Pause Machine Calf Raise',
          duration: '10–12 min',
          description: 'Paused raises reinforcing peak calf contraction',
          battlePlan: '4 rounds\n• 12 Raises (2s pause)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240671/mood_app/workout_images/elld3iw7_calf_machine_calf_raise.jpg',
          intensityReason: 'Paused contractions maximize peak tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Two-second top hold',
              description: 'Maximizes shortened position tension.'
            },
            {
              icon: 'construct',
              title: 'No knee lockout bounce',
              description: 'Keeps calves loaded.'
            },
            {
              icon: 'pulse',
              title: 'Smooth breathing',
              description: 'Helps sustain long sets.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'strength',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Calf Raise Machine (Drop Set)',
          duration: '16–18 min',
          description: 'Stripping load forces fibers to contract under fatigue',
          battlePlan: '3 rounds\n• 12 Heavy Calf Raises\n• Drop 15–20% → 10 reps\n• Drop 15–20% → 10 reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240635/mood_app/workout_images/1jerzr2s_download_27_.jpg',
          intensityReason: 'Drop sets extend effort for intense calf overload',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drop 15–20% weight fast, keep going',
              description: 'Quick transitions maintain fatigue for maximum overload.'
            },
            {
              icon: 'construct',
              title: 'Maintain full range across all drops',
              description: 'Consistent form throughout ensures continued effectiveness.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Calf Raise Machine (Iso + Jumps)',
          duration: '16–18 min',
          description: 'Combo reps with iso hold completely crushes calves',
          battlePlan: '3 rounds\n• 12–15 Calf Raises\n• Finish with 10s Iso Hold at top\n• Immediately 10 Stiff Leg Jumps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240649/mood_app/workout_images/tp1piceg_download_26_.jpg',
          intensityReason: 'Static hold at peak contraction maximizes tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Hold peak contraction 10s on last rep',
              description: 'Extended isometric maximizes metabolic stress on calves.'
            },
            {
              icon: 'flash',
              title: 'Explode into jumps, land soft on balls',
              description: 'Plyometric finish develops power and completes muscle fatigue.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Machine Calf Burnout Set',
          duration: '14–16 min',
          description: 'High-rep calf raises pushing muscular endurance',
          battlePlan: '3 rounds\n• 25–30 Raises\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240671/mood_app/workout_images/elld3iw7_calf_machine_calf_raise.jpg',
          intensityReason: 'High-rep work maximizes calf endurance and pump',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Moderate load only',
              description: 'Enables long uninterrupted sets.'
            },
            {
              icon: 'flash',
              title: 'No rest at top',
              description: 'Continuous tension focus.'
            },
            {
              icon: 'flame',
              title: 'Burn should peak late',
              description: 'Finish set near true failure.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'calf_raise',
          training_style: 'pump',
          intensity_cost: 5,
        }
      ]
    }
  }
];
