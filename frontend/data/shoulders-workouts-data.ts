import { EquipmentWorkouts } from '../types/workout';

export const shouldersWorkoutDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Shoulder Press Machine',
    icon: 'triangle',
    workouts: {
      beginner: [
        {
          name: 'Machine Press Builder',
          duration: '12–14 min',
          description: 'Standard machine press workout for joint-friendly delt activation.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Shoulder Press Machine — standard reps\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240966/mood_app/workout_images/4tfizieb_download_8_.jpg',
          intensityReason: 'Standard machine press workout for joint-friendly delt activation.',
          moodTips: [
            {
              icon: 'body',
              title: 'Press smoothly, no lockout',
              description: 'Keeps delts loaded throughout the movement.'
            },
            {
              icon: 'shield-checkmark',
              title: 'Control the bottom position',
              description: 'Machines punish sloppy depth.'
            },
            {
              icon: 'trending-down',
              title: 'Moderate load, full stretch',
              description: 'Let the handles come deep before driving up.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Tempo Control Press',
          duration: '12–14 min',
          description: 'Eccentric-focused machine workout emphasizing control.',
          battlePlan: 'Battle Plan — Eccentric Sets\n• 4×10 Shoulder Press — eccentric reps (3s down)\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240964/mood_app/workout_images/0sr4xno3_download_4_.jpg',
          intensityReason: 'Eccentric-focused machine workout emphasizing control.',
          moodTips: [
            {
              icon: 'timer',
              title: 'Slow negatives increase tension',
              description: 'More stimulus, less weight needed.'
            },
            {
              icon: 'body',
              title: 'Stay pressed into the seat',
              description: 'Removes momentum from the lift.'
            },
            {
              icon: 'trending-down',
              title: 'Chase depth, not numbers',
              description: 'Deeper stretch = better pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Neutral-Grip Pump Builder',
          duration: '12–14 min',
          description: 'Standard neutral-grip workout biasing delts over triceps.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×15 Neutral-Grip Press — standard reps\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240990/mood_app/workout_images/cc6w2q7t_download_3_.jpg',
          intensityReason: 'Standard neutral-grip workout biasing delts over triceps.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Elbows track slightly forward',
              description: 'Shoulder-friendly mechanics.'
            },
            {
              icon: 'refresh',
              title: 'Smooth cadence throughout',
              description: 'Machines reward rhythm.'
            },
            {
              icon: 'flame',
              title: 'Stop short of lockout',
              description: 'Constant tension = pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Press w/ Early Drop Cluster',
          duration: '12–14 min',
          description: 'Drop-set press workout using early fatigue to drive volume.',
          battlePlan: 'Battle Plan — Drop Set (mid-workout)\n• Set 1–2: 10 reps — standard\n• Set 3: triple drop set — 10 reps → drop → 8 → drop → 6 (no rest)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240996/mood_app/workout_images/dq10rl9d_download_4_.jpg',
          intensityReason: 'Drop-set press workout using early fatigue to drive volume.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Change the pin immediately',
              description: 'No more than 5–10s between drops.'
            },
            {
              icon: 'trending-down',
              title: 'First drop ~15%, second ~20%',
              description: 'Enough to keep reps clean.'
            },
            {
              icon: 'body',
              title: 'Shorten ROM slightly as needed',
              description: 'Stay in the pump zone, not joint lockout.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Single-Arm Machine Press',
          duration: '14–16 min',
          description: 'Standard unilateral press workout for balance and stability.',
          battlePlan: 'Battle Plan — Standard Sets\n• 5×10 Single-Arm Shoulder Press — standard reps\nRest 75s per side',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240966/mood_app/workout_images/4tfizieb_download_8_.jpg',
          intensityReason: 'Standard unilateral press workout for balance and stability.',
          moodTips: [
            {
              icon: 'body',
              title: 'Brace before pressing',
              description: 'Prevents torso rotation.'
            },
            {
              icon: 'hand-left',
              title: 'Press slightly inward',
              description: 'Keeps delts loaded.'
            },
            {
              icon: 'timer',
              title: 'Slow last 2 reps each set',
              description: 'Extend tension for pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Paused Depth Press',
          duration: '14–16 min',
          description: 'Paused-rep press workout emphasizing bottom-end strength.',
          battlePlan: 'Battle Plan — Pause Sets\n• 4×8 Shoulder Press — pause reps (1s bottom)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240964/mood_app/workout_images/0sr4xno3_download_4_.jpg',
          intensityReason: 'Paused-rep press workout emphasizing bottom-end strength.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause removes momentum',
              description: 'Honest shoulder output.'
            },
            {
              icon: 'shield',
              title: 'Stay tight at depth',
              description: 'Prevents joint dump.'
            },
            {
              icon: 'flame',
              title: 'Deeper pause = bigger pump',
              description: 'Stretch under tension matters.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Press Burn Builder',
          duration: '15–17 min',
          description: 'Burnout press workout emphasizing time under tension.',
          battlePlan: 'Battle Plan — Burnout Sets\n• 4×15 Shoulder Press — burnout reps\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240990/mood_app/workout_images/cc6w2q7t_download_3_.jpg',
          intensityReason: 'Burnout press workout emphasizing time under tension.',
          moodTips: [
            {
              icon: 'lock-closed',
              title: 'No locking out',
              description: 'Continuous tension.'
            },
            {
              icon: 'body',
              title: 'Steady breathing',
              description: 'Helps maintain rhythm.'
            },
            {
              icon: 'flame',
              title: 'Choose a load that never rests',
              description: 'Pump comes from nonstop work.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'pump',
          intensity_cost: 4,
        },
        {
          name: 'Press + Pushup Contrast',
          duration: '15–17 min',
          description: 'Superset workout pairing machine pressing with bodyweight fatigue.',
          battlePlan: 'Battle Plan — Superset\n• 4×10 Shoulder Press — standard reps\nsuperset with\n• 12–15 Pushups\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240996/mood_app/workout_images/dq10rl9d_download_4_.jpg',
          intensityReason: 'Superset workout pairing machine pressing with bodyweight fatigue.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Press first while fresh',
              description: 'Preserve output.'
            },
            {
              icon: 'body',
              title: 'Pushups extend fatigue safely',
              description: 'No added load.'
            },
            {
              icon: 'timer',
              title: 'Slow pushups down',
              description: 'Time under tension amplifies pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Machine Press Builder',
          duration: '18–20 min',
          description: 'Standard heavy press workout for advanced overload.',
          battlePlan: 'Battle Plan — Standard Sets\n• 6×8 Shoulder Press — standard reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240966/mood_app/workout_images/4tfizieb_download_8_.jpg',
          intensityReason: 'Standard heavy press workout for advanced overload.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Drive evenly through handles',
              description: 'Prevents dominance shift.'
            },
            {
              icon: 'lock-closed',
              title: 'Stop just shy of lockout',
              description: 'Keeps delts loaded.'
            },
            {
              icon: 'trending-down',
              title: 'Lower seat slightly',
              description: 'Deeper stretch = stronger pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Extended Drop Ladder Press',
          duration: '18–20 min',
          description: 'Multi-drop press workout pushing mechanical fatigue.',
          battlePlan: 'Battle Plan — Drop Ladder\n• 3 rounds:\n  8 reps → drop ~20% → 8 reps → drop ~15% → AMRAP\nRest 90s between rounds',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240964/mood_app/workout_images/0sr4xno3_download_4_.jpg',
          intensityReason: 'Multi-drop press workout pushing mechanical fatigue.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drops are immediate',
              description: 'No stepping away from the machine.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Final reps stay smooth',
              description: 'Grinding kills tension.'
            },
            {
              icon: 'body',
              title: 'Partial reps acceptable at end',
              description: 'Stay in the loaded range.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Partial-Range Burnout Press',
          duration: '18–20 min',
          description: 'Burnout workout using shortened range for constant tension.',
          battlePlan: 'Battle Plan — Burnout Sets\n• 4×20 Top-half presses — burnout reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240990/mood_app/workout_images/cc6w2q7t_download_3_.jpg',
          intensityReason: 'Burnout workout using shortened range for constant tension.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Top-half keeps delts loaded',
              description: 'No joint rest.'
            },
            {
              icon: 'timer',
              title: 'Controlled tempo only',
              description: 'Speed ruins the burn.'
            },
            {
              icon: 'lock-closed',
              title: 'Never relax at the top',
              description: 'Continuous squeeze = pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Paused Strength Test',
          duration: '18–20 min',
          description: 'Paused-rep machine workout exposing true strength.',
          battlePlan: 'Battle Plan — Pause Sets\n• 5×6 Shoulder Press — pause reps (2s bottom)\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240996/mood_app/workout_images/dq10rl9d_download_4_.jpg',
          intensityReason: 'Paused-rep machine workout exposing true strength.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Long pauses remove assistance',
              description: 'Honest output.'
            },
            {
              icon: 'body',
              title: 'Brace hard into the seat',
              description: 'Stability dictates success.'
            },
            {
              icon: 'trending-down',
              title: 'Use full depth',
              description: 'Stretch + pause maximizes pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Smith Machine',
    icon: 'hardware-chip',
    workouts: {
      beginner: [
        {
          name: 'Smith Shoulder Press Builder',
          duration: '12–14 min',
          description: 'Standard Smith press workout with fixed-path stability.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Smith Shoulder Press — standard reps\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240987/mood_app/workout_images/9mj7bam7_download_9_.jpg',
          intensityReason: 'Standard Smith press workout with fixed-path stability.',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Press straight up the rails',
              description: 'Keeps delts loaded.'
            },
            {
              icon: 'hand-left',
              title: 'No bouncing at bottom',
              description: 'Control beats speed.'
            },
            {
              icon: 'body',
              title: 'Lower deep, press smooth',
              description: 'Fixed path rewards ROM.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Tempo Smith Press',
          duration: '12–14 min',
          description: 'Eccentric-focused Smith workout reinforcing control.',
          battlePlan: 'Battle Plan — Eccentric Sets\n• 4×10 Smith Shoulder Press — eccentric reps (3s down)\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241010/mood_app/workout_images/hphatpce_Smith-Machine-Shoulder-Press.jpg',
          intensityReason: 'Eccentric-focused Smith workout reinforcing control.',
          moodTips: [
            {
              icon: 'timer',
              title: 'Slow negatives increase tension',
              description: 'Growth without max load.'
            },
            {
              icon: 'hand-left',
              title: 'Elbows slightly forward',
              description: 'Shoulder-friendly angle.'
            },
            {
              icon: 'trending-down',
              title: 'Deep stretch every rep',
              description: 'Stretch drives the pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Smith Upright Row Builder',
          duration: '12–14 min',
          description: 'Standard pull workout targeting delts and traps.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Smith Upright Row — standard reps\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240985/mood_app/workout_images/9btj6m9u_image.jpg',
          intensityReason: 'Standard pull workout targeting delts and traps.',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Pull elbows high and wide',
              description: 'Delt emphasis.'
            },
            {
              icon: 'refresh',
              title: 'Smooth bar path',
              description: 'Fixed rails reward control.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Stop just below chest height',
              description: 'Strong squeeze without trap takeover.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'upright_row',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Press + Iso Hold',
          duration: '12–14 min',
          description: 'Standard press workout with isometric finish.',
          battlePlan: 'Battle Plan — Standard + Isometric\n• 4×10 Smith Shoulder Press — standard reps\n• Final set: squeeze to finish — hold top 10s\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241027/mood_app/workout_images/rmh1bypt_download_6_.jpg',
          intensityReason: 'Standard press workout with isometric finish.',
          moodTips: [
            {
              icon: 'lock-closed',
              title: 'Soft lockout',
              description: "Don't rest on joints."
            },
            {
              icon: 'body',
              title: 'Stay pinned to the bench',
              description: 'Stability improves output.'
            },
            {
              icon: 'timer',
              title: 'Longer hold > heavier load',
              description: 'Better pump tradeoff.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Paused Smith Press',
          duration: '14–16 min',
          description: 'Paused-rep Smith workout removing momentum.',
          battlePlan: 'Battle Plan — Pause Sets\n• 4×8 Smith Shoulder Press — pause reps (1s bottom)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240987/mood_app/workout_images/9mj7bam7_download_9_.jpg',
          intensityReason: 'Paused-rep Smith workout removing momentum.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause kills bounce',
              description: 'Honest shoulder strength.'
            },
            {
              icon: 'shield',
              title: 'Stay tight at depth',
              description: 'Prevents collapse.'
            },
            {
              icon: 'flame',
              title: 'Deeper pause = bigger pump',
              description: 'Stretch under tension wins.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Smith Upright Row Control',
          duration: '14–16 min',
          description: 'Pause-rep pull workout emphasizing contraction.',
          battlePlan: 'Battle Plan — Pause Sets\n• 4×10 Smith Upright Row — pause reps (1s top)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240985/mood_app/workout_images/9btj6m9u_image.jpg',
          intensityReason: 'Pause-rep pull workout emphasizing contraction.',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Elbows lead the movement',
              description: 'Better delt bias.'
            },
            {
              icon: 'pause',
              title: 'Pause at peak',
              description: 'Lock in contraction.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Moderate load only',
              description: 'Smooth reps pump better.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'upright_row',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Smith Press Burn Builder',
          duration: '15–17 min',
          description: 'Burnout press workout emphasizing time under tension.',
          battlePlan: 'Battle Plan — Burnout Sets\n• 4×15 Smith Shoulder Press — burnout reps\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241010/mood_app/workout_images/hphatpce_Smith-Machine-Shoulder-Press.jpg',
          intensityReason: 'Burnout press workout emphasizing time under tension.',
          moodTips: [
            {
              icon: 'lock-closed',
              title: 'Continuous reps, no lockout',
              description: 'Keeps delts loaded.'
            },
            {
              icon: 'body',
              title: 'Stay stacked under fatigue',
              description: 'Avoid excessive lean-back.'
            },
            {
              icon: 'flame',
              title: 'Choose weight that never rests',
              description: 'Pump over numbers.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'pump',
          intensity_cost: 4,
        },
        {
          name: 'Smith Press + Pushup Contrast',
          duration: '15–17 min',
          description: 'Superset workout pairing fixed-path pressing with bodyweight fatigue.',
          battlePlan: 'Battle Plan — Superset\n• 4×10 Smith Shoulder Press — standard reps\nsuperset with\n• 12–15 Pushups\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241027/mood_app/workout_images/rmh1bypt_download_6_.jpg',
          intensityReason: 'Superset workout pairing fixed-path pressing with bodyweight fatigue.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Smith press first',
              description: 'Preserve strength.'
            },
            {
              icon: 'body',
              title: 'Pushups extend volume safely',
              description: 'Joint-friendly fatigue.'
            },
            {
              icon: 'timer',
              title: 'Slow last 5 pushups',
              description: 'Stretch + squeeze effect.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Smith Press Builder',
          duration: '18–20 min',
          description: 'Standard heavy Smith workout for controlled overload.',
          battlePlan: 'Battle Plan — Standard Sets\n• 6×8 Smith Shoulder Press — standard reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240987/mood_app/workout_images/9mj7bam7_download_9_.jpg',
          intensityReason: 'Standard heavy Smith workout for controlled overload.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Drive evenly through the bar',
              description: 'Prevents dominance.'
            },
            {
              icon: 'lock-closed',
              title: 'Stop shy of lockout',
              description: 'Keeps delts loaded.'
            },
            {
              icon: 'trending-down',
              title: 'Lower deeper each set',
              description: 'Stretch amplifies pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Smith Press Triple Drop Cluster',
          duration: '18–20 min',
          description: 'Extended drop-set workout for mechanical fatigue.',
          battlePlan: 'Battle Plan — Drop Cluster\n• 3 rounds:\n  10 reps → drop ~15% → 8 reps → drop ~15% → 6 reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241010/mood_app/workout_images/hphatpce_Smith-Machine-Shoulder-Press.jpg',
          intensityReason: 'Extended drop-set workout for mechanical fatigue.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Change plates immediately',
              description: 'No more than 10s between drops.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Smaller drops keep tension',
              description: 'Avoids form breakdown.'
            },
            {
              icon: 'body',
              title: 'Final reps stay controlled',
              description: 'Pump beats grinding.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Smith Press Burnout Hold',
          duration: '18–20 min',
          description: 'Burnout + isometric workout finishing with static tension.',
          battlePlan: 'Battle Plan — Burnout + Isometric\n• 4×15 Smith Shoulder Press — burnout reps\n• Final set: squeeze to finish — hold top 10s\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241040/mood_app/workout_images/yx8bl42q_smith_press_burnout_hold.jpg',
          intensityReason: 'Burnout + isometric workout finishing with static tension.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Burnouts exhaust remaining fibers',
              description: 'Finish strong.'
            },
            {
              icon: 'timer',
              title: 'Isometric seals fatigue',
              description: 'Extra tension without load.'
            },
            {
              icon: 'trending-down',
              title: 'Use lighter bar weight',
              description: 'Longer hold = better pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Paused Strength Test',
          duration: '18–20 min',
          description: 'Paused-rep Smith workout exposing true shoulder capacity.',
          battlePlan: 'Battle Plan — Pause Sets\n• 5×6 Smith Shoulder Press — pause reps (2s bottom)\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241027/mood_app/workout_images/rmh1bypt_download_6_.jpg',
          intensityReason: 'Paused-rep Smith workout exposing true shoulder capacity.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Long pauses remove assistance',
              description: 'Honest strength.'
            },
            {
              icon: 'body',
              title: 'Brace harder than usual',
              description: 'Stability dictates success.'
            },
            {
              icon: 'trending-down',
              title: 'Full depth every rep',
              description: 'Stretch + pause drives pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Rear Delt Fly Machine',
    icon: 'fitness',
    workouts: {
      beginner: [
        {
          name: 'Rear Delt Fly Builder',
          duration: '12–14 min',
          description: 'Standard isolation workout targeting rear delts.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×15 Rear Delt Fly — standard reps\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240989/mood_app/workout_images/bvadq5vi_download_7_.jpg',
          intensityReason: 'Standard isolation workout targeting rear delts.',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Pull wide, not back',
              description: 'Rear-delt bias.'
            },
            {
              icon: 'hand-left',
              title: 'Soft elbows',
              description: 'Constant tension.'
            },
            {
              icon: 'pause',
              title: 'Pause briefly at full spread',
              description: 'Peak squeeze = pump.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rear_delt',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Tempo Rear Delt Fly',
          duration: '12–14 min',
          description: 'Eccentric-focused isolation workout emphasizing control.',
          battlePlan: 'Battle Plan — Eccentric Sets\n• 4×12 Rear Delt Fly — eccentric reps (3s return)\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240971/mood_app/workout_images/2gc40bi1_download_5_.jpg',
          intensityReason: 'Eccentric-focused isolation workout emphasizing control.',
          moodTips: [
            {
              icon: 'timer',
              title: 'Slow return builds tension',
              description: 'More fiber recruitment.'
            },
            {
              icon: 'hand-left',
              title: 'No jerking out of bottom',
              description: 'Control matters.'
            },
            {
              icon: 'trending-down',
              title: 'Use lighter load, bigger stretch',
              description: 'Stretch drives pump.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rear_delt',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Paused Rear Delt Fly',
          duration: '12–14 min',
          description: 'Pause-rep isolation workout locking in contraction.',
          battlePlan: 'Battle Plan — Pause Sets\n• 4×12 Rear Delt Fly — pause reps (1s back)\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241016/mood_app/workout_images/kqdzk509_image.jpg',
          intensityReason: 'Pause-rep isolation workout locking in contraction.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause at max spread',
              description: 'Full rear-delt engagement.'
            },
            {
              icon: 'body',
              title: 'Stay tall',
              description: 'No cheating.'
            },
            {
              icon: 'flame',
              title: 'Squeeze harder than you think',
              description: 'Rear delts respond to contraction.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rear_delt',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Burnout Rear Delt Fly',
          duration: '12–14 min',
          description: 'Burnout isolation workout for rear-delt endurance.',
          battlePlan: 'Battle Plan — Burnout Sets\n• 4×20 Rear Delt Fly — burnout reps\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240988/mood_app/workout_images/a6216mca_image.jpg',
          intensityReason: 'Burnout isolation workout for rear-delt endurance.',
          moodTips: [
            {
              icon: 'flame',
              title: 'High reps finish fibers',
              description: 'Burnouts seal work.'
            },
            {
              icon: 'timer',
              title: 'Short rest',
              description: 'Fatigue stacks fast.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Light weight, nonstop reps',
              description: 'Rear delts pump best here.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rear_delt',
          training_style: 'pump',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Single-Arm Rear Delt Focus',
          duration: '14–16 min',
          description: 'Standard unilateral isolation workout for balance.',
          battlePlan: 'Battle Plan — Standard Sets\n• 5×12 Single-Arm Rear Delt Fly — standard reps\nRest 75s per side',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241001/mood_app/workout_images/gchfnmx0_image.jpg',
          intensityReason: 'Standard unilateral isolation workout for balance.',
          moodTips: [
            {
              icon: 'body',
              title: 'Stay square in the seat',
              description: 'Prevents twist.'
            },
            {
              icon: 'hand-left',
              title: 'Pull through pinky',
              description: 'Improves rear-delt bias.'
            },
            {
              icon: 'trending-down',
              title: 'Start from full cross',
              description: 'Stretch enhances pump.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rear_delt',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Rear Delt Pause + Burn',
          duration: '14–16 min',
          description: 'Extended pause-rep isolation workout emphasizing contraction.',
          battlePlan: 'Battle Plan — Pause Sets\n• 4×10 Rear Delt Fly — pause reps (2s back)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240971/mood_app/workout_images/2gc40bi1_download_5_.jpg',
          intensityReason: 'Extended pause-rep isolation workout emphasizing contraction.',
          moodTips: [
            {
              icon: 'timer',
              title: 'Longer pauses deepen fatigue',
              description: 'Time under tension.'
            },
            {
              icon: 'hand-left',
              title: 'No momentum allowed',
              description: 'Machines expose cheats.'
            },
            {
              icon: 'flame',
              title: 'Squeeze before lowering',
              description: 'Peak contraction drives pump.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rear_delt',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Rear Delt Density Builder',
          duration: '15–17 min',
          description: 'High-density isolation workout with moderate reps.',
          battlePlan: 'Battle Plan — Standard Sets\n• 6×10 Rear Delt Fly — standard reps\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241016/mood_app/workout_images/kqdzk509_image.jpg',
          intensityReason: 'High-density isolation workout with moderate reps.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Consistent rest builds density',
              description: 'Fatigue without slop.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Smooth reps beat heavy load',
              description: 'Isolation wins.'
            },
            {
              icon: 'trending-down',
              title: 'Stretch fully every rep',
              description: 'Deeper stretch = pump.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rear_delt',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Rear Delt Fly + Face Pull Contrast',
          duration: '15–17 min',
          description: 'Superset workout pairing machine isolation with cable stability.',
          battlePlan: 'Battle Plan — Superset\n• 4×12 Rear Delt Fly — standard reps\nsuperset with\n• 12–15 Face Pulls\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240988/mood_app/workout_images/a6216mca_image.jpg',
          intensityReason: 'Superset workout pairing machine isolation with cable stability.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Fly first while fresh',
              description: 'Preserve isolation.'
            },
            {
              icon: 'shield-checkmark',
              title: 'Face pulls rebalance shoulders',
              description: 'Health + aesthetics.'
            },
            {
              icon: 'timer',
              title: 'Slow last reps',
              description: 'Stretch + squeeze combo.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rear_delt',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Rear Delt Builder',
          duration: '18–20 min',
          description: 'Standard isolation workout using heavier loads.',
          battlePlan: 'Battle Plan — Standard Sets\n• 6×10 Rear Delt Fly — standard reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240989/mood_app/workout_images/bvadq5vi_download_7_.jpg',
          intensityReason: 'Standard isolation workout using heavier loads.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Pull with intent, not speed',
              description: 'Control beats momentum.'
            },
            {
              icon: 'body',
              title: 'Stay seated tall',
              description: 'Prevents cheating.'
            },
            {
              icon: 'timer',
              title: 'Slow stretch on return',
              description: 'Eccentric fuels pump.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rear_delt',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Rear Delt Triple Drop Cluster',
          duration: '18–20 min',
          description: 'Multi-drop isolation workout driving mechanical fatigue.',
          battlePlan: 'Battle Plan — Drop Cluster\n• 3 rounds:\n  12 reps → drop ~20% → 10 reps → drop ~15% → AMRAP\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240971/mood_app/workout_images/2gc40bi1_download_5_.jpg',
          intensityReason: 'Multi-drop isolation workout driving mechanical fatigue.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Pin changes are immediate',
              description: 'No more than 10s.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Smaller second drop keeps control',
              description: 'Avoids form breakdown.'
            },
            {
              icon: 'body',
              title: 'Partial reps allowed late',
              description: 'Stay in pump range.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rear_delt',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Rear Delt Burnout Hold',
          duration: '18–20 min',
          description: 'Burnout + isometric workout finishing with static tension.',
          battlePlan: 'Battle Plan — Burnout + Isometric\n• 4×15 Rear Delt Fly — burnout reps\n• Final set: squeeze to finish — hold back 10s\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241016/mood_app/workout_images/kqdzk509_image.jpg',
          intensityReason: 'Burnout + isometric workout finishing with static tension.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Burnouts exhaust remaining fibers',
              description: 'Finish strong.'
            },
            {
              icon: 'timer',
              title: 'Isometric seals fatigue',
              description: 'Extra tension without load.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Light weight, long hold',
              description: 'Rear delts pump fast.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rear_delt',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Paused Strength Test',
          duration: '18–20 min',
          description: 'Paused-rep isolation workout exposing true rear-delt control.',
          battlePlan: 'Battle Plan — Pause Sets\n• 5×10 Rear Delt Fly — pause reps (2s back)\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240988/mood_app/workout_images/a6216mca_image.jpg',
          intensityReason: 'Paused-rep isolation workout exposing true rear-delt control.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Long pauses remove momentum',
              description: 'Pure output.'
            },
            {
              icon: 'body',
              title: 'Control every inch',
              description: 'No slack.'
            },
            {
              icon: 'trending-down',
              title: 'Stretch fully between reps',
              description: 'Range drives pump.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rear_delt',
          training_style: 'strength',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Cable Crossover Machine',
    icon: 'git-network',
    workouts: {
      beginner: [
        {
          name: 'Low-to-High Cable Lateral Raise',
          duration: '12–14 min',
          description: 'Standard isolation workout using low-to-high cable laterals for constant delt tension.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Cable Lateral Raise (low → high) — standard reps\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241019/mood_app/workout_images/ndk3n5nw_image.jpg',
          intensityReason: 'Standard isolation workout using low-to-high cable laterals for constant delt tension.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Lead with the elbow',
              description: 'Keeps tension on the side delts.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Raise only to shoulder height',
              description: 'Higher shifts load to traps.'
            },
            {
              icon: 'trending-down',
              title: 'Chase the stretch + squeeze',
              description: 'Step slightly away from the stack for deeper bottom position.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'lateral_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Single-Arm Cable Lateral Control',
          duration: '12–14 min',
          description: 'Pause-rep single-arm isolation workout to clean up imbalances.',
          battlePlan: 'Battle Plan — Pause Sets\n• 4×12 Single-Arm Cable Lateral Raise — pause reps (1s top)\nRest 60s per side',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241004/mood_app/workout_images/gowvsmtm_image.jpg',
          intensityReason: 'Pause-rep single-arm isolation workout to clean up imbalances.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause where it\'s hardest',
              description: 'Weak ranges grow fastest.'
            },
            {
              icon: 'body',
              title: 'Stand tall, no lean',
              description: 'Prevents momentum cheats.'
            },
            {
              icon: 'trending-down',
              title: 'Maximize range, not weight',
              description: 'Lean slightly away from the stack for full stretch.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'lateral_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Cable Rear Delt Fly Builder',
          duration: '12–14 min',
          description: 'Standard rear-delt isolation workout using constant cable tension.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×15 Cable Rear Delt Fly — standard reps\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241011/mood_app/workout_images/hwr2ym9m_image.jpg',
          intensityReason: 'Standard rear-delt isolation workout using constant cable tension.',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Pull wide, not back',
              description: 'Biases rear delts over upper back.'
            },
            {
              icon: 'hand-left',
              title: 'Soft elbows throughout',
              description: 'Keeps tension continuous.'
            },
            {
              icon: 'flame',
              title: 'Squeeze, don\'t yank',
              description: 'Think "open the arms" and pause briefly at peak.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rear_delt',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Cable Front Raise Pull-Through',
          duration: '12–14 min',
          description: 'Standard anterior-delt workout using a pull-through cable path.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Cable Front Raise\n(facing away, handle pulled through legs) — standard reps\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240994/mood_app/workout_images/d3k00azw_image.jpg',
          intensityReason: 'Standard anterior-delt workout using a pull-through cable path.',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Start from behind the hips',
              description: 'Increases anterior-delt stretch.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Raise only to eye level',
              description: 'Keeps delts loaded.'
            },
            {
              icon: 'refresh',
              title: 'Smooth arc = better pump',
              description: 'Let cable pull you back at bottom, then lift through long range.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'front_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Face Pull Strength Builder',
          duration: '14–16 min',
          description: 'Pause-rep rear-delt and upper-back workout for shoulder balance.',
          battlePlan: 'Battle Plan — Pause Sets\n• 4×12 Face Pull — pause reps (1s squeeze)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241042/mood_app/workout_images/z8ycso14_face_pull.jpg',
          intensityReason: 'Pause-rep rear-delt and upper-back workout for shoulder balance.',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Pull toward eye level',
              description: 'Improves rear-delt recruitment.'
            },
            {
              icon: 'pause',
              title: 'Pause with elbows flared',
              description: 'Locks in contraction.'
            },
            {
              icon: 'flame',
              title: 'Finish every rep strong',
              description: 'Use lighter weight and squeeze hard at the back.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rear_delt',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Single-Arm Cable Press',
          duration: '14–16 min',
          description: 'Standard unilateral press workout emphasizing shoulder stability.',
          battlePlan: 'Battle Plan — Standard Sets\n• 5×10 Single-Arm Cable Shoulder Press — standard reps\nRest 75s per side',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240983/mood_app/workout_images/7pnnumeo_image.jpg',
          intensityReason: 'Standard unilateral press workout emphasizing shoulder stability.',
          moodTips: [
            {
              icon: 'body',
              title: 'Brace core before pressing',
              description: 'Prevents torso rotation.'
            },
            {
              icon: 'hand-left',
              title: 'Press slightly forward',
              description: 'Shoulder-friendly cable path.'
            },
            {
              icon: 'lock-closed',
              title: 'Control the top and bottom',
              description: 'Don\'t lock out hard—keep tension continuous.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Cable Lateral Raise Fatigue Builder',
          duration: '15–17 min',
          description: 'Pulse-rep isolation workout for extended time under tension.',
          battlePlan: 'Battle Plan — Pulse Sets\n• 4×15 Cable Lateral Raise — pulse reps (top ⅓)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241019/mood_app/workout_images/ndk3n5nw_image.jpg',
          intensityReason: 'Pulse-rep isolation workout for extended time under tension.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Short pulses keep tension constant',
              description: 'Big burn, low joint stress.'
            },
            {
              icon: 'hand-left',
              title: 'No swinging under fatigue',
              description: 'Cables expose cheats fast.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Chase burn, not numbers',
              description: 'Use a weight that never lets the delt relax.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'lateral_raise',
          training_style: 'pump',
          intensity_cost: 4,
        },
        {
          name: 'Cable Raise + Face Pull Contrast',
          duration: '15–17 min',
          description: 'Superset workout pairing lateral raises with rear-delt stability work.',
          battlePlan: 'Battle Plan — Superset\n• 4×12 Cable Lateral Raise (low → high) — standard reps\nsuperset with\n• 12–15 Face Pulls\nRest 90s between rounds',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241033/mood_app/workout_images/w8421t38_image.jpg',
          intensityReason: 'Superset workout pairing lateral raises with rear-delt stability work.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Laterals first while fresh',
              description: 'Preserves delt output.'
            },
            {
              icon: 'shield-checkmark',
              title: 'Face pulls rebalance the shoulder',
              description: 'Keeps joints happy.'
            },
            {
              icon: 'timer',
              title: 'Stretch then squeeze every round',
              description: 'Step farther from the stack on laterals.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rear_delt',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Single-Arm Delt Fly Density Builder',
          duration: '18–20 min',
          description: 'High-density unilateral isolation workout for side-delt overload.',
          battlePlan: 'Battle Plan — Standard Sets\n• 6×10 Single-Arm Cable Delt Fly — standard reps\nRest 75s per side',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241004/mood_app/workout_images/gowvsmtm_image.jpg',
          intensityReason: 'High-density unilateral isolation workout for side-delt overload.',
          moodTips: [
            {
              icon: 'body',
              title: 'Stay square to the stack',
              description: 'Prevents rotation cheats.'
            },
            {
              icon: 'refresh',
              title: 'Consistent rest keeps density high',
              description: 'Fatigue without slop.'
            },
            {
              icon: 'trending-down',
              title: 'Long range wins here',
              description: 'Start each rep from a deep stretch.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'lateral_raise',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Cable Lateral Raise Drop Assault',
          duration: '18–20 min',
          description: 'Single-exercise drop-set workout driving mechanical fatigue.',
          battlePlan: 'Battle Plan — Drop Set\n• 4×12 Cable Lateral Raise — standard reps\n• Final set: drop set — 2 drops, no rest\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241019/mood_app/workout_images/ndk3n5nw_image.jpg',
          intensityReason: 'Single-exercise drop-set workout driving mechanical fatigue.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Change weight immediately',
              description: 'No more than ~10 seconds between drops.'
            },
            {
              icon: 'trending-down',
              title: 'Drop load ~20–30% each time',
              description: 'Enough to keep reps smooth.'
            },
            {
              icon: 'body',
              title: 'Shorten range as you fatigue',
              description: 'Partial reps at the top keep the pump alive.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'lateral_raise',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Rear-Delt Burnout Fly',
          duration: '18–20 min',
          description: 'Burnout isolation workout for rear-delt hypertrophy.',
          battlePlan: 'Battle Plan — Burnout Sets\n• 4×20 Cable Rear Delt Fly — burnout reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241011/mood_app/workout_images/hwr2ym9m_image.jpg',
          intensityReason: 'Burnout isolation workout for rear-delt hypertrophy.',
          moodTips: [
            {
              icon: 'flame',
              title: 'High reps exhaust remaining fibers',
              description: 'Burnouts finish the job.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Light weight, strict form',
              description: 'Momentum kills the burn.'
            },
            {
              icon: 'pause',
              title: 'Hold the last rep',
              description: 'Pause and squeeze at peak contraction for 2–3 seconds.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rear_delt',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Front-Raise Pull-Through Burn + Hold',
          duration: '18–20 min',
          description: 'Burnout + isometric workout targeting anterior delts.',
          battlePlan: 'Battle Plan — Burnout + Isometric\n• 4×15 Cable Front Raise (pull-through) — burnout reps\n• Final set: squeeze to finish — hold at eye level 8–10s\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240994/mood_app/workout_images/d3k00azw_image.jpg',
          intensityReason: 'Burnout + isometric workout targeting anterior delts.',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Pull from behind the body',
              description: 'Maximizes delt stretch.'
            },
            {
              icon: 'timer',
              title: 'Isometric finish extends tension',
              description: 'Growth without extra reps.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Use lighter weight, longer range',
              description: 'Let the cable pull you deep at the bottom.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'front_raise',
          training_style: 'mixed',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Dumbbells',
    icon: 'barbell',
    workouts: {
      beginner: [
        {
          name: 'Seated Shoulder Press Builder',
          duration: '12–14 min',
          description: 'Standard set workout building foundational shoulder strength.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Seated Dumbbell Shoulder Press — standard reps\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241020/mood_app/workout_images/njrg622y_shoulder_press.jpg',
          intensityReason: 'Standard set workout building foundational shoulder strength.',
          moodTips: [
            {
              icon: 'body',
              title: 'Press with ribs stacked',
              description: 'Better force transfer, less shoulder strain.'
            },
            {
              icon: 'timer',
              title: 'Control the descent',
              description: 'Stability builds strength faster.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Spotter not required',
              description: 'Choose a load you fully control.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Tempo Shoulder Press',
          duration: '12–14 min',
          description: 'Eccentric-focused workout using slow negatives to build strength safely.',
          battlePlan: 'Battle Plan — Eccentric Sets\n• 4×10 Seated Dumbbell Shoulder Press — eccentric reps (3s down)\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240969/mood_app/workout_images/2f5b0c4l_db_shoulder_press.jpg',
          intensityReason: 'Eccentric-focused workout using slow negatives to build strength safely.',
          moodTips: [
            {
              icon: 'timer',
              title: 'Own the negative',
              description: 'Eccentrics increase fiber recruitment.'
            },
            {
              icon: 'hand-left',
              title: 'Elbows slightly forward at bottom',
              description: 'Shoulder-friendly pressing path.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Spotter not required',
              description: 'Tempo naturally limits overload.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Lateral Raise Control Builder',
          duration: '12–14 min',
          description: 'Pause-rep isolation workout targeting side delts.',
          battlePlan: 'Battle Plan — Pause Sets\n• 4×15 Dumbbell Lateral Raise — pause reps (1s top)\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241021/mood_app/workout_images/no2mapks_Low_incline_delt_fly.jpg',
          intensityReason: 'Pause-rep isolation workout targeting side delts.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause where it\'s hardest',
              description: 'Weak ranges grow fastest.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Stop at shoulder height',
              description: 'Avoids trap takeover.'
            },
            {
              icon: 'shield',
              title: 'Spotter not required',
              description: 'Isolation stays low risk.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'lateral_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Standing Press + Iso Finish',
          duration: '12–14 min',
          description: 'Standard press workout with squeeze-to-finish hold.',
          battlePlan: 'Battle Plan — Standard + Isometric Finish\n• 4×10 Standing Dumbbell Shoulder Press — standard reps\n• Final set: squeeze to finish — hold last rep overhead 8–10s\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241031/mood_app/workout_images/uhw14hf9_db_shoulder_press.jpg',
          intensityReason: 'Standard press workout with squeeze-to-finish hold.',
          moodTips: [
            {
              icon: 'body',
              title: 'Brace before every press',
              description: 'Stability unlocks strength.'
            },
            {
              icon: 'timer',
              title: 'Isometric hold extends tension',
              description: 'Growth without extra reps.'
            },
            {
              icon: 'people',
              title: 'Spotter optional',
              description: 'Keep overhead loads conservative.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Arnold Press Builder',
          duration: '14–16 min',
          description: 'Standard rotational press workout for full delt recruitment.',
          battlePlan: 'Battle Plan — Standard Sets\n• 5×10 Arnold Press — standard reps\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240980/mood_app/workout_images/64d4m132_arnold_press.jpg',
          intensityReason: 'Standard rotational press workout for full delt recruitment.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Rotate smoothly through the press',
              description: 'All delt heads contribute.'
            },
            {
              icon: 'trending-down',
              title: 'Control the bottom',
              description: 'Prevents shoulder dump.'
            },
            {
              icon: 'people',
              title: 'Spotter optional',
              description: 'Useful near failure.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Push Press Overload',
          duration: '14–16 min',
          description: 'Standard power-press workout increasing load tolerance.',
          battlePlan: 'Battle Plan — Standard Sets\n• 5×8 Push Press — standard reps\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240984/mood_app/workout_images/8rj9v297_db_push_press.jpg',
          intensityReason: 'Standard power-press workout increasing load tolerance.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drive through the legs',
              description: 'Heavier stimulus, same joints.'
            },
            {
              icon: 'trending-up',
              title: 'Explode then stabilize',
              description: 'Power up, control down.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Fatigue raises overhead risk.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Lateral Raise Fatigue Builder',
          duration: '15–17 min',
          description: 'Pulse-rep isolation workout for accumulated delt fatigue.',
          battlePlan: 'Battle Plan — Pulse Sets\n• 4×15 Dumbbell Lateral Raise — pulse reps (top ⅓)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241043/mood_app/workout_images/zbplnvku_db_lateral_raise.jpg',
          intensityReason: 'Pulse-rep isolation workout for accumulated delt fatigue.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Short pulses keep tension constant',
              description: 'Big burn, low joint stress.'
            },
            {
              icon: 'hand-left',
              title: 'Stay strict as fatigue builds',
              description: 'Swinging kills stimulus.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Spotter not required',
              description: 'Volume drives fatigue.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'lateral_raise',
          training_style: 'pump',
          intensity_cost: 4,
        },
        {
          name: 'Press + Pushup Contrast',
          duration: '15–17 min',
          description: 'Superset workout pairing shoulder pressing with bodyweight fatigue.',
          battlePlan: 'Battle Plan — Superset\n• 4×10 Standing Dumbbell Shoulder Press — standard reps\nsuperset with\n• 12–15 Pushups\nRest 75s between rounds',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241003/mood_app/workout_images/geafno9z_shoulder_press.jpg',
          intensityReason: 'Superset workout pairing shoulder pressing with bodyweight fatigue.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Press first while fresh',
              description: 'Preserves force output.'
            },
            {
              icon: 'body',
              title: 'Pushups extend fatigue safely',
              description: 'No extra loading needed.'
            },
            {
              icon: 'people',
              title: 'Spotter optional',
              description: 'Reduce press load if reps slow.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Push Press Builder',
          duration: '18–20 min',
          description: 'Standard heavy press workout for advanced overhead strength.',
          battlePlan: 'Battle Plan — Standard Sets\n• 6×5 Push Press — standard reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240984/mood_app/workout_images/8rj9v297_db_push_press.jpg',
          intensityReason: 'Standard heavy press workout for advanced overhead strength.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Explode on every rep',
              description: 'Fast intent recruits fast-twitch fibers.'
            },
            {
              icon: 'refresh',
              title: 'Reset between reps',
              description: 'Quality beats grind.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Heavy overhead work demands awareness.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Arnold Drop Set Assault',
          duration: '18–20 min',
          description: 'Single-exercise drop-set workout driving mechanical fatigue.',
          battlePlan: 'Battle Plan — Drop Set\n• 4×10 Arnold Press — standard reps\n• Final set: drop set — 2 drops, no rest\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240980/mood_app/workout_images/64d4m132_arnold_press.jpg',
          intensityReason: 'Single-exercise drop-set workout driving mechanical fatigue.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Change weight immediately',
              description: 'No more than 10–15 seconds between drops.'
            },
            {
              icon: 'trending-down',
              title: 'Drop load ~20–30% each time',
              description: 'Enough to keep reps clean.'
            },
            {
              icon: 'people',
              title: 'Spotter strongly recommended',
              description: 'Final drop approaches failure.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Lateral Raise Burnout',
          duration: '18–20 min',
          description: 'Burnout isolation workout finished with isometric hold.',
          battlePlan: 'Battle Plan — Burnout + Isometric\n• 4×20 Lateral Raise — burnout reps\n• Final set: squeeze to finish — hold top 10s\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241043/mood_app/workout_images/zbplnvku_db_lateral_raise.jpg',
          intensityReason: 'Burnout isolation workout finished with isometric hold.',
          moodTips: [
            {
              icon: 'flame',
              title: 'High reps exhaust remaining fibers',
              description: 'Burnouts finish the job.'
            },
            {
              icon: 'lock-closed',
              title: 'Small range, nonstop tension',
              description: 'Momentum ruins the effect.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Spotter not required',
              description: 'Light load only.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'lateral_raise',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Pause Press Strength Test',
          duration: '18–20 min',
          description: 'Paused-rep strength workout removing all momentum.',
          battlePlan: 'Battle Plan — Pause Sets\n• 5×8 Standing Dumbbell Shoulder Press — pause reps (1s bottom)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240991/mood_app/workout_images/cwihbei1_db_shoulder_press.jpg',
          intensityReason: 'Paused-rep strength workout removing all momentum.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause kills stretch reflex',
              description: 'Pure shoulder output.'
            },
            {
              icon: 'shield',
              title: 'Stay tight at the bottom',
              description: 'Prevents shoulder collapse.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Paused heavies escalate fast.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
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
          name: 'Barbell Overhead Press Builder',
          duration: '12–14 min',
          description: 'Standard set workout building foundational vertical pressing strength.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×10 Standing Barbell Overhead Press — standard reps\nRest 60–75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241017/mood_app/workout_images/kv2n6i9e_download.jpg',
          intensityReason: 'Standard set workout building foundational vertical pressing strength.',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Press in a straight bar path',
              description: 'Keeps shoulders loaded, not joints.'
            },
            {
              icon: 'body',
              title: 'Brace before unracking',
              description: 'Stability improves force output.'
            },
            {
              icon: 'people',
              title: 'Spotter optional',
              description: 'Use safeties if available.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Tempo Overhead Press',
          duration: '12–14 min',
          description: 'Eccentric-focused press workout reinforcing control.',
          battlePlan: 'Battle Plan — Eccentric Sets\n• 4×8 Overhead Press — eccentric reps (3s down)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240997/mood_app/workout_images/dz69brtd_bb_press_2.jpg',
          intensityReason: 'Eccentric-focused press workout reinforcing control.',
          moodTips: [
            {
              icon: 'timer',
              title: 'Slow negatives build control',
              description: 'Strength without heavier load.'
            },
            {
              icon: 'hand-left',
              title: 'Elbows slightly forward at bottom',
              description: 'Shoulder-friendly angle.'
            },
            {
              icon: 'people',
              title: 'Spotter optional',
              description: 'Stay conservative with tempo.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Pause Press Control',
          duration: '12–14 min',
          description: 'Paused-rep press workout eliminating momentum.',
          battlePlan: 'Battle Plan — Pause Sets\n• 4×8 Overhead Press — pause reps (1s bottom)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241026/mood_app/workout_images/q6gtwvmb_bb_shoulder_press.jpg',
          intensityReason: 'Paused-rep press workout eliminating momentum.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause removes stretch reflex',
              description: 'Honest shoulder strength.'
            },
            {
              icon: 'shield',
              title: 'Stay tight in the hole',
              description: 'Prevents collapse.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Difficulty ramps fast.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Press + Iso Finish',
          duration: '12–14 min',
          description: 'Standard press workout with squeeze-to-finish hold.',
          battlePlan: 'Battle Plan — Standard + Isometric Finish\n• 4×8 Overhead Press — standard reps\n• Final set: squeeze to finish — hold overhead 8–10s\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241018/mood_app/workout_images/l4hch2z0_bb_press_1.jpg',
          intensityReason: 'Standard press workout with squeeze-to-finish hold.',
          moodTips: [
            {
              icon: 'timer',
              title: 'Isometric holds extend tension',
              description: 'Growth without extra volume.'
            },
            {
              icon: 'body',
              title: 'Lock out stacked and tall',
              description: 'Safer overhead holds.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Especially near fatigue.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Push Press Builder',
          duration: '14–16 min',
          description: 'Standard power-press workout increasing load tolerance.',
          battlePlan: 'Battle Plan — Standard Sets\n• 5×6 Push Press — standard reps\nRest 75–90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240975/mood_app/workout_images/4n1f2oy3_bb_push_press.jpg',
          intensityReason: 'Standard power-press workout increasing load tolerance.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Leg drive creates overload',
              description: 'More stimulus with less shoulder strain.'
            },
            {
              icon: 'trending-up',
              title: 'Explode then stabilize',
              description: 'Power up, control down.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Fatigue raises risk.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Upright Row Control Builder',
          duration: '14–16 min',
          description: 'Pause-rep pull workout targeting delts and traps.',
          battlePlan: 'Battle Plan — Pause Sets\n• 4×10 Upright Row — pause reps (1s top)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240972/mood_app/workout_images/3jble54r_Upright_row.jpg',
          intensityReason: 'Pause-rep pull workout targeting delts and traps.',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Elbows higher than wrists',
              description: 'Maximizes delt involvement.'
            },
            {
              icon: 'pause',
              title: 'Pause at peak',
              description: 'Tension beats momentum.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Spotter not required',
              description: 'Keep load moderate.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'upright_row',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Overhead Density Press',
          duration: '15–17 min',
          description: 'High-density standard press workout using moderate loads.',
          battlePlan: 'Battle Plan — Standard Sets\n• 6×6 Overhead Press — standard reps\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241026/mood_app/workout_images/q6gtwvmb_bb_shoulder_press.jpg',
          intensityReason: 'High-density standard press workout using moderate loads.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Short sets preserve bar speed',
              description: 'Better volume quality.'
            },
            {
              icon: 'refresh',
              title: 'Consistent rest maintains density',
              description: 'Fatigue without form loss.'
            },
            {
              icon: 'people',
              title: 'Spotter optional',
              description: 'Helpful late.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Push Press + Pushup Contrast',
          duration: '15–17 min',
          description: 'Superset workout pairing heavy barbell presses with bodyweight fatigue.',
          battlePlan: 'Battle Plan — Superset\n• 4×6 Push Press — standard reps\nsuperset with\n• 12–15 Pushups\nRest 90s between rounds',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241025/mood_app/workout_images/q0873m98_download_8_.jpg',
          intensityReason: 'Superset workout pairing heavy barbell presses with bodyweight fatigue.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Press first while fresh',
              description: 'Preserves power output.'
            },
            {
              icon: 'body',
              title: 'Pushups extend fatigue safely',
              description: 'No added load.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Especially later rounds.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Push Jerk Builder',
          duration: '18–20 min',
          description: 'Standard heavy power workout emphasizing max overhead output.',
          battlePlan: 'Battle Plan — Standard Sets\n• 6×4 Push Jerk — standard reps\nRest 90–120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241025/mood_app/workout_images/q0873m98_download_8_.jpg',
          intensityReason: 'Standard heavy power workout emphasizing max overhead output.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Fast dip, aggressive drive',
              description: 'Clean power transfer.'
            },
            {
              icon: 'refresh',
              title: 'Reset every rep',
              description: 'Quality over grind.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Use safeties if possible.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Strict Press Drop Assault',
          duration: '18–20 min',
          description: 'Single-exercise drop-set workout using strict presses.',
          battlePlan: 'Battle Plan — Drop Set\n• 4×6 Strict Press — standard reps\n• Final set: drop set — 2 drops, no rest\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241017/mood_app/workout_images/kv2n6i9e_download.jpg',
          intensityReason: 'Single-exercise drop-set workout using strict presses.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Change plates immediately',
              description: 'No more than 15 seconds between drops.'
            },
            {
              icon: 'trending-down',
              title: 'Reduce load ~20–25% per drop',
              description: 'Keeps reps clean and safe.'
            },
            {
              icon: 'people',
              title: 'Spotter strongly recommended',
              description: 'Final drop near failure.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Barbell Press Burnout',
          duration: '18–20 min',
          description: 'Burnout press workout to exhaust remaining fibers.',
          battlePlan: 'Battle Plan — Burnout Sets\n• 4×12 Overhead Press — burnout reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241030/mood_app/workout_images/sn9rtt8c_bb_press_2.jpg',
          intensityReason: 'Burnout press workout to exhaust remaining fibers.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Lighter weight, nonstop tension',
              description: 'Burnouts finish the job.'
            },
            {
              icon: 'body',
              title: 'Stay tall under fatigue',
              description: 'Avoid excessive lean-back.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Especially late in sets.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Pause Strength Test',
          duration: '18–20 min',
          description: 'Paused-rep strength workout exposing true shoulder capacity.',
          battlePlan: 'Battle Plan — Pause Sets\n• 5×5 Overhead Press — pause reps (2s bottom)\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241026/mood_app/workout_images/q6gtwvmb_bb_shoulder_press.jpg',
          intensityReason: 'Paused-rep strength workout exposing true shoulder capacity.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Long pauses remove momentum',
              description: 'Honest strength output.'
            },
            {
              icon: 'body',
              title: 'Brace harder than usual',
              description: 'Stability dictates success.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Paused heavies escalate fast.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Landmine Attachment',
    icon: 'rocket',
    workouts: {
      beginner: [
        {
          name: 'Single-Arm Landmine Press Builder',
          duration: '12–14 min',
          description: 'Standard landmine press workout using the arc path to build shoulder strength safely.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×10 Single-Arm Landmine Press — standard reps\nRest 60s per side',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240998/mood_app/workout_images/e2d8369i_landmine_sa_press.jpg',
          intensityReason: 'Standard landmine press workout using the arc path to build shoulder strength safely.',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Press up and slightly forward',
              description: 'Matches the landmine arc and keeps shoulders happy.'
            },
            {
              icon: 'body',
              title: 'Stay tall, no back lean',
              description: 'Prevents turning it into a chest movement.'
            },
            {
              icon: 'pause',
              title: 'Finish just before lockout',
              description: 'Hold the bar where delts are fully contracted, not where tension drops.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Two-Arm Landmine Press Builder',
          duration: '12–14 min',
          description: 'Standard two-arm press workout for stable, repeatable reps.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Two-Arm Landmine Press — standard reps\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240973/mood_app/workout_images/40vv8ike_Landmine_double_arm_press.jpg',
          intensityReason: 'Standard two-arm press workout for stable, repeatable reps.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Hands stay tight to midline',
              description: 'Improves shoulder tracking.'
            },
            {
              icon: 'refresh',
              title: 'Same groove every rep',
              description: 'Consistency builds stimulus.'
            },
            {
              icon: 'pause',
              title: 'Squeeze before lockout',
              description: 'Pause briefly where shoulders are loaded, not at elbow lockout.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Tempo Landmine Press',
          duration: '12–14 min',
          description: 'Eccentric-focused landmine workout to build control and tendon tolerance.',
          battlePlan: 'Battle Plan — Eccentric Sets\n• 4×8 Single-Arm Landmine Press — eccentric reps (3s down)\nRest 60–75s per side',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240992/mood_app/workout_images/cww4hl7b_landmine_single_arm_press_2.jpg',
          intensityReason: 'Eccentric-focused landmine workout to build control and tendon tolerance.',
          moodTips: [
            {
              icon: 'timer',
              title: 'Own the negative',
              description: 'Eccentrics drive growth with less load.'
            },
            {
              icon: 'hand-left',
              title: 'Keep wrist stacked',
              description: 'Preserves force transfer.'
            },
            {
              icon: 'pause',
              title: 'Reverse under tension',
              description: 'Pause briefly at the strongest contracted position before lowering.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Landmine Press + Iso Finish',
          duration: '12–14 min',
          description: 'Standard press workout with squeeze-to-finish in the contracted range.',
          battlePlan: 'Battle Plan — Standard + Isometric Finish\n• 4×10 Single-Arm Landmine Press — standard reps\n• Final set: squeeze to finish — hold the bar just short of lockout (peak delt contraction) for 8–10s\nRest 60s per side',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241008/mood_app/workout_images/hggocyeh_landmine_rotation_press.jpg',
          intensityReason: 'Standard press workout with squeeze-to-finish in the contracted range.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Hold where delts work hardest',
              description: 'Not lockout, not rest.'
            },
            {
              icon: 'hand-left',
              title: 'Elbow stays softly bent',
              description: 'Keeps tension on the shoulder.'
            },
            {
              icon: 'timer',
              title: 'Use lighter load for the hold',
              description: 'Longer contraction = better pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Paused Landmine Press',
          duration: '14–16 min',
          description: 'Paused-rep landmine workout removing momentum for true shoulder strength.',
          battlePlan: 'Battle Plan — Pause Sets\n• 5×8 Single-Arm Landmine Press — pause reps (1s bottom)\nRest 75s per side',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240998/mood_app/workout_images/e2d8369i_landmine_sa_press.jpg',
          intensityReason: 'Paused-rep landmine workout removing momentum for true shoulder strength.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause kills bounce',
              description: 'Pure shoulder output.'
            },
            {
              icon: 'shield',
              title: 'Stay tight at the bottom',
              description: 'Prevents shoulder dump.'
            },
            {
              icon: 'flame',
              title: 'Contract hard at the top',
              description: 'Brief squeeze just before lockout reinforces the pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Landmine Pulse Press',
          duration: '14–16 min',
          description: 'Pulse-rep landmine workout keeping tension in the strongest range.',
          battlePlan: 'Battle Plan — Pulse Sets\n• 4×12 Single-Arm Landmine Press — pulse reps (top ⅓ of arc)\nRest 75s per side',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240992/mood_app/workout_images/cww4hl7b_landmine_single_arm_press_2.jpg',
          intensityReason: 'Pulse-rep landmine workout keeping tension in the strongest range.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Pulse in the loaded range',
              description: "That's where delts actually work."
            },
            {
              icon: 'body',
              title: 'Torso stays quiet',
              description: 'Pulses should be shoulder-driven.'
            },
            {
              icon: 'lock-closed',
              title: 'Never hit lockout',
              description: 'Continuous contraction = nonstop pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'pump',
          intensity_cost: 4,
        },
        {
          name: 'Landmine Push Press Builder',
          duration: '15–17 min',
          description: 'Standard power-press landmine workout allowing heavier overload.',
          battlePlan: 'Battle Plan — Standard Sets\n• 6×6 Single-Arm Landmine Push Press — standard reps\nRest 75–90s per side',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241028/mood_app/workout_images/rrxbxdk3_image.jpg',
          intensityReason: 'Standard power-press landmine workout allowing heavier overload.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Legs start the rep',
              description: 'Heavier load, same shoulders.'
            },
            {
              icon: 'body',
              title: 'Stabilize at the top',
              description: 'Control matters more than height.'
            },
            {
              icon: 'pause',
              title: 'Catch and squeeze early',
              description: 'Brief hold before lockout keeps delts loaded.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Press + Rotational Press Contrast',
          duration: '15–17 min',
          description: 'Superset workout pairing strict pressing with rotational pressing.',
          battlePlan: 'Battle Plan — Superset\n• 4×10 Single-Arm Landmine Press — standard reps\nsuperset with\n• 8 each side Landmine Rotational Press — standard reps\nRest 90s between rounds',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241008/mood_app/workout_images/hggocyeh_landmine_rotation_press.jpg',
          intensityReason: 'Superset workout pairing strict pressing with rotational pressing.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Strict press first',
              description: 'Preserves shoulder output.'
            },
            {
              icon: 'refresh',
              title: 'Rotation comes from the torso',
              description: 'Not the shoulder joint.'
            },
            {
              icon: 'pause',
              title: 'Finish each press short of lockout',
              description: 'Hold the contracted position for a stronger pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Landmine Press Builder',
          duration: '18–20 min',
          description: 'Standard heavy landmine workout for advanced overload.',
          battlePlan: 'Battle Plan — Standard Sets\n• 6×8 Single-Arm Landmine Press — standard reps\nRest 90s per side',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240998/mood_app/workout_images/e2d8369i_landmine_sa_press.jpg',
          intensityReason: 'Standard heavy landmine workout for advanced overload.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Explode up, control down',
              description: 'Power + tension.'
            },
            {
              icon: 'refresh',
              title: 'Consistent bar path',
              description: 'Prevents drift.'
            },
            {
              icon: 'pause',
              title: 'Squeeze before the elbow straightens',
              description: 'Peak delt contraction beats lockout.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Landmine Press Drop Ladder',
          duration: '18–20 min',
          description: 'Multi-drop press workout driving mechanical fatigue.',
          battlePlan: 'Battle Plan — Drop Ladder\n• 3 rounds:\n  8 reps → drop ~20% → 8 reps → drop ~15% → AMRAP\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240992/mood_app/workout_images/cww4hl7b_landmine_single_arm_press_2.jpg',
          intensityReason: 'Multi-drop press workout driving mechanical fatigue.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drops are immediate',
              description: 'No more than ~10s between changes.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Keep reps smooth',
              description: 'Grinding kills tension.'
            },
            {
              icon: 'pause',
              title: 'End every mini-set with a squeeze',
              description: 'Hold the strongest contracted point, not lockout.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Landmine Press Burnout',
          duration: '18–20 min',
          description: 'Burnout landmine workout for nonstop shoulder tension.',
          battlePlan: 'Battle Plan — Burnout Sets\n• 4×20 Two-Arm Landmine Press — burnout reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241028/mood_app/workout_images/rrxbxdk3_image.jpg',
          intensityReason: 'Burnout landmine workout for nonstop shoulder tension.',
          moodTips: [
            {
              icon: 'lock-closed',
              title: 'No lockout allowed',
              description: 'Continuous tension.'
            },
            {
              icon: 'body',
              title: 'Steady breathing rhythm',
              description: 'Maintains clean reps.'
            },
            {
              icon: 'flame',
              title: 'Live in the mid-to-top arc',
              description: "That's where delts stay pumped."
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Cluster Drop Set Press',
          duration: '18–20 min',
          description: 'Drop-set cluster workout with multiple drop-based sets.',
          battlePlan: 'Battle Plan — Drop Cluster\n• Set 1: 10 reps — standard\n• Set 2: drop set — 10 → drop ~15% → 6\n• Set 3: triple drop set — 8 → drop ~20% → 6 → drop ~15% → 6\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241008/mood_app/workout_images/hggocyeh_landmine_rotation_press.jpg',
          intensityReason: 'Drop-set cluster workout with multiple drop-based sets.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Weight changes are immediate',
              description: "Don't leave the bar."
            },
            {
              icon: 'trending-down',
              title: 'Smaller drops as fatigue rises',
              description: 'Keeps reps clean.'
            },
            {
              icon: 'pause',
              title: 'Final squeeze happens before lockout',
              description: 'Contracted delts, not resting joints.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'mixed',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Adjustable Bench',
    icon: 'square',
    workouts: {
      beginner: [
        {
          name: 'Seated Shoulder Press Builder',
          duration: '12–14 min',
          description: 'Standard seated press workout using bench support for clean shoulder loading.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Seated Dumbbell Shoulder Press (bench ~80–85°) — standard reps\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241013/mood_app/workout_images/idt8edgt_db_shoulder_press.jpg',
          intensityReason: 'Standard seated press workout using bench support for clean shoulder loading.',
          moodTips: [
            {
              icon: 'body',
              title: 'Sit tall with ribs down',
              description: 'Bench support removes momentum.'
            },
            {
              icon: 'timer',
              title: 'Lower under control',
              description: 'Stability beats heavier weight.'
            },
            {
              icon: 'pause',
              title: 'Press to contraction, not lockout',
              description: 'Stop just short of straight arms and squeeze the delts.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Incline Lateral Raise Builder',
          duration: '12–14 min',
          description: 'Standard isolation workout using bench angle to bias side delts.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×15 Incline Dumbbell Lateral Raise (bench ~30°) — standard reps\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241032/mood_app/workout_images/w1oc6g1w_incline_db_lat_raise.jpg',
          intensityReason: 'Standard isolation workout using bench angle to bias side delts.',
          moodTips: [
            {
              icon: 'body',
              title: 'Chest stays supported',
              description: 'Removes torso cheating.'
            },
            {
              icon: 'hand-left',
              title: 'Lead with elbows',
              description: 'Keeps load on delts.'
            },
            {
              icon: 'trending-down',
              title: 'Let arms hang deep',
              description: 'Longer stretch + clean raise = better pump.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'lateral_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Bench-Supported Front Raise',
          duration: '12–14 min',
          description: 'Standard anterior-delt workout with bench support to control swing.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Seated Front Raise (bench ~70°) — standard reps\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240986/mood_app/workout_images/9k5yy7z7_db_chest_supported_front_raise.jpg',
          intensityReason: 'Standard anterior-delt workout with bench support to control swing.',
          moodTips: [
            {
              icon: 'body',
              title: 'Back stays glued to bench',
              description: 'No momentum assistance.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Raise to eye level only',
              description: 'Keeps delts loaded.'
            },
            {
              icon: 'trending-down',
              title: 'Use lighter weight, longer range',
              description: 'Front delts pump fast with clean reps.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'front_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Seated Press + Iso Finish',
          duration: '12–14 min',
          description: 'Standard press workout with squeeze-to-finish in the contracted range.',
          battlePlan: 'Battle Plan — Standard + Isometric Finish\n• 4×10 Seated Shoulder Press — standard reps\n• Final set: squeeze to finish — hold just before lockout (peak delt contraction) 8–10s\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240977/mood_app/workout_images/61sfuskm_Low_incline_delt_fly.jpg',
          intensityReason: 'Standard press workout with squeeze-to-finish in the contracted range.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Elbows stay slightly bent',
              description: 'Keeps tension on delts.'
            },
            {
              icon: 'body',
              title: 'Brace into the bench',
              description: 'Stability increases output.'
            },
            {
              icon: 'flame',
              title: 'Hold where delts work hardest',
              description: 'Contracted position beats lockout.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Arnold Press Builder',
          duration: '14–16 min',
          description: 'Standard rotational press workout for full-delt recruitment.',
          battlePlan: 'Battle Plan — Standard Sets\n• 5×10 Seated Arnold Press — standard reps\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240976/mood_app/workout_images/5i0ksrbr_arnold_press.jpg',
          intensityReason: 'Standard rotational press workout for full-delt recruitment.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Rotate smoothly, no jerking',
              description: 'Shoulder fibers load evenly.'
            },
            {
              icon: 'trending-down',
              title: 'Control the bottom',
              description: 'Prevents shoulder dump.'
            },
            {
              icon: 'pause',
              title: 'Finish rotation before lockout',
              description: 'Squeeze when delts are shortened.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Low-Incline Delt Fly',
          duration: '14–16 min',
          description: 'Standard isolation workout targeting front-to-side delt fibers.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Low-Incline Dumbbell Delt Fly (bench ~20–30°) — standard reps\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240977/mood_app/workout_images/61sfuskm_Low_incline_delt_fly.jpg',
          intensityReason: 'Standard isolation workout targeting front-to-side delt fibers.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Arms slightly bent',
              description: 'Maintains tension.'
            },
            {
              icon: 'trending-up',
              title: 'Wide arc, not straight up',
              description: 'Keeps delts dominant.'
            },
            {
              icon: 'trending-down',
              title: 'Stretch deep at the bottom',
              description: 'Long range = better pump.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rear_delt',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Paused Seated Lateral Raise',
          duration: '15–17 min',
          description: 'Pause-rep isolation workout emphasizing top-end control.',
          battlePlan: 'Battle Plan — Pause Sets\n• 4×12 Seated Dumbbell Lateral Raise — pause reps (1s top)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240982/mood_app/workout_images/73grv174_db_lateral_raise.jpg',
          intensityReason: 'Pause-rep isolation workout emphasizing top-end control.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause kills momentum',
              description: 'Honest delt output.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Stop at shoulder height',
              description: 'Avoids trap takeover.'
            },
            {
              icon: 'flame',
              title: 'Squeeze before lowering',
              description: 'Contraction drives the pump.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'lateral_raise',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Press + Raise Contrast',
          duration: '15–17 min',
          description: 'Superset workout pairing heavy pressing with isolation fatigue.',
          battlePlan: 'Battle Plan — Superset\n• 4×10 Seated Dumbbell Shoulder Press — standard reps\nsuperset with\n• 12–15 Seated Lateral Raises\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241013/mood_app/workout_images/idt8edgt_db_shoulder_press.jpg',
          intensityReason: 'Superset workout pairing heavy pressing with isolation fatigue.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Press first while fresh',
              description: 'Preserves strength.'
            },
            {
              icon: 'body',
              title: 'Raises extend fatigue safely',
              description: 'No extra joint stress.'
            },
            {
              icon: 'timer',
              title: 'Slow the raises',
              description: 'Time under tension = pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Angle Progression Press',
          duration: '18–20 min',
          description: 'Standard press workout progressing through multiple bench angles.',
          battlePlan: 'Battle Plan — Standard Sets\n• 3 rounds:\n  8 reps @ 85° → 8 reps @ 70° → 8 reps @ 60°\nRest 90s between rounds',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241013/mood_app/workout_images/idt8edgt_db_shoulder_press.jpg',
          intensityReason: 'Standard press workout progressing through multiple bench angles.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Adjust bench, not stance',
              description: 'Keeps pressing consistent.'
            },
            {
              icon: 'trending-down',
              title: 'Lower angle = more delt demand',
              description: 'Fatigue stacks fast.'
            },
            {
              icon: 'pause',
              title: 'Squeeze at each angle',
              description: 'Contracted delts finish every set.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Arnold Press Drop Cluster',
          duration: '18–20 min',
          description: 'Multi-drop rotational press workout driving mechanical fatigue.',
          battlePlan: 'Battle Plan — Drop Cluster\n• Set 1: 10 reps — standard\n• Set 2: drop set — 10 → drop ~15% → 8\n• Set 3: triple drop set — 8 → drop ~20% → 6 → drop ~15% → 6\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240976/mood_app/workout_images/5i0ksrbr_arnold_press.jpg',
          intensityReason: 'Multi-drop rotational press workout driving mechanical fatigue.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Weight changes are immediate',
              description: 'No more than ~10s between drops.'
            },
            {
              icon: 'refresh',
              title: 'Rotation stays smooth',
              description: 'Sloppy turns kill tension.'
            },
            {
              icon: 'pause',
              title: 'End each drop with a squeeze',
              description: 'Contracted position, not lockout.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Seated Lateral Raise Burnout',
          duration: '18–20 min',
          description: 'Burnout isolation workout for nonstop side-delt tension.',
          battlePlan: 'Battle Plan — Burnout Sets\n• 4×20 Seated Dumbbell Lateral Raise — burnout reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240982/mood_app/workout_images/73grv174_db_lateral_raise.jpg',
          intensityReason: 'Burnout isolation workout for nonstop side-delt tension.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'No swinging allowed',
              description: 'Bench exposes cheats.'
            },
            {
              icon: 'timer',
              title: 'Short rest keeps tension high',
              description: 'Fatigue stacks quickly.'
            },
            {
              icon: 'flame',
              title: 'Live in the mid-range',
              description: "That's where delts stay pumped."
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'lateral_raise',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Incline Fly + Iso Burn',
          duration: '18–20 min',
          description: 'Burnout + isometric workout emphasizing stretched-to-contracted control.',
          battlePlan: 'Battle Plan — Burnout + Isometric\n• 4×15 Incline Dumbbell Delt Fly — burnout reps\n• Final set: squeeze to finish — hold arms wide and slightly raised (peak delt contraction) 10s\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240977/mood_app/workout_images/61sfuskm_Low_incline_delt_fly.jpg',
          intensityReason: 'Burnout + isometric workout emphasizing stretched-to-contracted control.',
          moodTips: [
            {
              icon: 'hand-left',
              title: "Open wide, don't over-bend elbows",
              description: 'Keeps tension on delts.'
            },
            {
              icon: 'timer',
              title: 'Slow last reps',
              description: 'Stretch + control amplify fatigue.'
            },
            {
              icon: 'flame',
              title: 'Hold where arms are hardest to keep up',
              description: "That's the true contracted position."
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'rear_delt',
          training_style: 'mixed',
          intensity_cost: 5,
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
          name: 'Single-Arm KB Press Builder',
          duration: '12–14 min',
          description: 'Standard unilateral press workout using kettlebell instability for delt activation.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×10 Single-Arm Kettlebell Press — standard reps\nRest 60s per side',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241038/mood_app/workout_images/y6ofpbdj_kb_sa_press_v2.jpg',
          intensityReason: 'Standard unilateral press workout using kettlebell instability for delt activation.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Stack wrist over elbow',
              description: 'Prevents energy leaks.'
            },
            {
              icon: 'trending-up',
              title: 'Press slightly forward',
              description: 'Shoulder-friendly path.'
            },
            {
              icon: 'pause',
              title: 'Lower deep, finish short of lockout',
              description: 'Squeeze where delts are shortened, not resting.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'KB Front Raise Control',
          duration: '12–14 min',
          description: 'Standard isolation workout targeting anterior delts with offset load.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Kettlebell Front Raise — standard reps\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241007/mood_app/workout_images/hd1jejdj_kb_front_raise.jpg',
          intensityReason: 'Standard isolation workout targeting anterior delts with offset load.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Handle stays vertical',
              description: 'Keeps load honest.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Raise only to eye level',
              description: 'Prevents trap dominance.'
            },
            {
              icon: 'flame',
              title: 'Light bell, long arc',
              description: 'Front delts pump fast with tension.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'front_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'KB Lateral Raise Builder',
          duration: '12–14 min',
          description: 'Standard isolation workout emphasizing side delts and grip control.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×15 Kettlebell Lateral Raise — standard reps\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241022/mood_app/workout_images/nokhthfd_kb_lat_riase.jpg',
          intensityReason: 'Standard isolation workout emphasizing side delts and grip control.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Thumb slightly down',
              description: 'Improves delt bias.'
            },
            {
              icon: 'timer',
              title: 'Slow on the way down',
              description: 'Eccentric drives fatigue.'
            },
            {
              icon: 'trending-down',
              title: 'Start from full hang',
              description: 'Longer stretch = better pump.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'lateral_raise',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Press + Iso Finish',
          duration: '12–14 min',
          description: 'Standard press workout with squeeze-to-finish in the contracted range.',
          battlePlan: 'Battle Plan — Standard + Isometric Finish\n• 4×10 Single-Arm KB Press — standard reps\n• Final set: squeeze to finish — hold just before lockout (peak delt contraction) 8–10s\nRest 60s per side',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241044/mood_app/workout_images/zr277bch_kb_press_or_offset_rack_hold.jpg',
          intensityReason: 'Standard press workout with squeeze-to-finish in the contracted range.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Elbow stays soft at the top',
              description: 'Keeps tension on delts.'
            },
            {
              icon: 'body',
              title: 'Brace through the hold',
              description: 'Stability matters.'
            },
            {
              icon: 'timer',
              title: 'Use lighter bell for the hold',
              description: 'Longer contraction = stronger pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'KB Arnold Press Builder',
          duration: '14–16 min',
          description: 'Standard rotational press workout for full-delt recruitment.',
          battlePlan: 'Battle Plan — Standard Sets\n• 5×8 Kettlebell Arnold Press — standard reps\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241044/mood_app/workout_images/zr277bch_kb_press_or_offset_rack_hold.jpg',
          intensityReason: 'Standard rotational press workout for full-delt recruitment.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Rotate smoothly, no snapping',
              description: 'Even fiber loading.'
            },
            {
              icon: 'trending-down',
              title: 'Control the bottom',
              description: 'Prevents shoulder dump.'
            },
            {
              icon: 'pause',
              title: 'Finish rotation before lockout',
              description: 'Contracted delts > joint rest.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'KB Upright Row Control',
          duration: '14–16 min',
          description: 'Standard pull-focused shoulder workout biasing delts over traps.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×12 Kettlebell Upright Row — standard reps\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241041/mood_app/workout_images/yznqwyz0_kb_upright_row.jpg',
          intensityReason: 'Standard pull-focused shoulder workout biasing delts over traps.',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Elbows high and wide',
              description: 'Delt emphasis.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Stop below chest height',
              description: 'Avoids trap takeover.'
            },
            {
              icon: 'refresh',
              title: 'Moderate bell, smooth reps',
              description: 'Upright rows pump best clean.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'upright_row',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Paused KB Press',
          duration: '14–16 min',
          description: 'Paused-rep press workout removing momentum.',
          battlePlan: 'Battle Plan — Pause Sets\n• 4×8 Single-Arm KB Press — pause reps (1s bottom)\nRest 75s per side',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241014/mood_app/workout_images/ijanvd0e_kb_shoulder_press.jpg',
          intensityReason: 'Paused-rep press workout removing momentum.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause kills bounce',
              description: 'Pure shoulder output.'
            },
            {
              icon: 'body',
              title: 'Stay tall',
              description: 'No lean-back.'
            },
            {
              icon: 'flame',
              title: 'Explode into contraction',
              description: 'Smooth squeeze builds pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Press + Halo Contrast',
          duration: '15–17 min',
          description: 'Superset workout pairing pressing with controlled shoulder mobility.',
          battlePlan: 'Battle Plan — Superset\n• 4×10 Single-Arm KB Press — standard reps\nsuperset with\n• 8–10 KB Halos (each direction)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241037/mood_app/workout_images/xcrgse2b_kb_halo.jpg',
          intensityReason: 'Superset workout pairing pressing with controlled shoulder mobility.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Press first',
              description: 'Preserve output.'
            },
            {
              icon: 'refresh',
              title: 'Halos slow and controlled',
              description: 'Mobility under load.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Smooth reps over heavy bells',
              description: 'Flow builds pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy KB Push Press',
          duration: '18–20 min',
          description: 'Standard power-press workout allowing heavier loading.',
          battlePlan: 'Battle Plan — Standard Sets\n• 6×6 Single-Arm KB Push Press — standard reps\nRest 90s per side',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240969/mood_app/workout_images/0zc5r7x4_kb_push_press.jpg',
          intensityReason: 'Standard power-press workout allowing heavier loading.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Legs initiate the rep',
              description: 'Shoulder-friendly overload.'
            },
            {
              icon: 'body',
              title: 'Stabilize early',
              description: 'Control matters.'
            },
            {
              icon: 'timer',
              title: 'Lower slow into stretch',
              description: 'Eccentric fuels pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'KB Upright Row Drop Cluster',
          duration: '18–20 min',
          description: 'Multi-drop pull workout driving shoulder fatigue safely.',
          battlePlan: 'Battle Plan — Drop Cluster\n• Set 1: 12 reps — standard\n• Set 2: drop set — 12 → drop ~20% → 8\n• Set 3: triple drop set — 10 → drop ~15% → 8 → drop ~10% → 8\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241015/mood_app/workout_images/jjgy8pfh_KB_upright_row.jpg',
          intensityReason: 'Multi-drop pull workout driving shoulder fatigue safely.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drops are immediate',
              description: 'No more than ~10s.'
            },
            {
              icon: 'trending-up',
              title: 'Elbows stay wide',
              description: 'Keeps delts loaded.'
            },
            {
              icon: 'body',
              title: 'Shorten ROM late',
              description: 'Partial reps preserve pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'upright_row',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'KB Lateral Raise Burnout',
          duration: '18–20 min',
          description: 'Burnout isolation workout for side-delt saturation.',
          battlePlan: 'Battle Plan — Burnout Sets\n• 4×20 KB Lateral Raise — burnout reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240995/mood_app/workout_images/daoo7ik5_kb_lat_riase.jpg',
          intensityReason: 'Burnout isolation workout for side-delt saturation.',
          moodTips: [
            {
              icon: 'checkmark-circle',
              title: 'Light bell, nonstop reps',
              description: 'Burnouts thrive on tension.'
            },
            {
              icon: 'hand-left',
              title: 'No swinging',
              description: 'KBs punish cheats.'
            },
            {
              icon: 'flame',
              title: 'Live in mid-range',
              description: "That's the pump zone."
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'lateral_raise',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Offset Rack Hold + Press Burn',
          duration: '18–20 min',
          description: 'Burnout + isometric workout combining instability and contraction.',
          battlePlan: 'Battle Plan — Burnout + Isometric\n• 4×12 KB Press — burnout reps\n• Final set: squeeze to finish — hold bell in front-rack, elbow forward (peak delt contraction) 10s\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241044/mood_app/workout_images/zr277bch_kb_press_or_offset_rack_hold.jpg',
          intensityReason: 'Burnout + isometric workout combining instability and contraction.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Rack stays tight',
              description: 'Wrist + shoulder integrity.'
            },
            {
              icon: 'body',
              title: 'Breathe through the hold',
              description: 'Stability under fatigue.'
            },
            {
              icon: 'flame',
              title: 'Hold where delts shake most',
              description: 'True contraction point.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'pump',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Powerlifting Platform',
    icon: 'grid',
    workouts: {
      beginner: [
        {
          name: 'Strict Overhead Press Builder',
          duration: '12–14 min',
          description: 'Standard barbell press workout building foundational shoulder strength.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×10 Standing Barbell Overhead Press — standard reps\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240968/mood_app/workout_images/0tjqvfc4_bb_press_2.jpg',
          intensityReason: 'Standard barbell press workout building foundational shoulder strength.',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Press straight up',
              description: 'Keeps shoulders loaded.'
            },
            {
              icon: 'body',
              title: 'Brace before unrack',
              description: 'Stability improves force.'
            },
            {
              icon: 'pause',
              title: 'Lower deep, squeeze before lockout',
              description: 'Contracted delts > joint rest.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Tempo OHP Control',
          duration: '12–14 min',
          description: 'Eccentric-focused press workout emphasizing bar control.',
          battlePlan: 'Battle Plan — Eccentric Sets\n• 4×8 Overhead Press — eccentric reps (3s down)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241034/mood_app/workout_images/wpyi7rra_bb_press_1.jpg',
          intensityReason: 'Eccentric-focused press workout emphasizing bar control.',
          moodTips: [
            {
              icon: 'timer',
              title: 'Slow negatives build strength',
              description: 'Less load, more stimulus.'
            },
            {
              icon: 'hand-left',
              title: 'Elbows slightly forward',
              description: 'Shoulder-friendly position.'
            },
            {
              icon: 'trending-down',
              title: 'Stretch fully every rep',
              description: 'Bottom tension drives pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Pause OHP Builder',
          duration: '12–14 min',
          description: 'Paused-rep press workout removing momentum.',
          battlePlan: 'Battle Plan — Pause Sets\n• 4×8 Overhead Press — pause reps (1s bottom)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241039/mood_app/workout_images/yi9y3sr0_push_press.jpg',
          intensityReason: 'Paused-rep press workout removing momentum.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause kills bounce',
              description: 'Honest strength.'
            },
            {
              icon: 'shield',
              title: 'Stay tight in the hole',
              description: 'Prevents collapse.'
            },
            {
              icon: 'flame',
              title: 'Explode to contraction',
              description: 'Smooth squeeze fuels pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'OHP + Iso Finish',
          duration: '12–14 min',
          description: 'Standard press workout with squeeze-to-finish in the contracted range.',
          battlePlan: 'Battle Plan — Standard + Isometric Finish\n• 4×8 Overhead Press — standard reps\n• Final set: squeeze to finish — hold bar just short of lockout (peak delt contraction) 8–10s\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240981/mood_app/workout_images/6wounjt1_bb_press_3.jpg',
          intensityReason: 'Standard press workout with squeeze-to-finish in the contracted range.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Soft elbows at the top',
              description: 'Keeps tension on delts.'
            },
            {
              icon: 'body',
              title: 'Brace through the hold',
              description: 'Stability matters.'
            },
            {
              icon: 'timer',
              title: 'Use lighter bar weight',
              description: 'Longer hold = better pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Push Press Builder',
          duration: '14–16 min',
          description: 'Standard power-press workout increasing load tolerance.',
          battlePlan: 'Battle Plan — Standard Sets\n• 5×6 Push Press — standard reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241039/mood_app/workout_images/yi9y3sr0_push_press.jpg',
          intensityReason: 'Standard power-press workout increasing load tolerance.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Legs start, shoulders finish',
              description: 'Efficient overload.'
            },
            {
              icon: 'body',
              title: 'Stabilize at the top',
              description: 'Control matters.'
            },
            {
              icon: 'timer',
              title: 'Lower slow into stretch',
              description: 'Eccentric builds pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'High Pull Control',
          duration: '14–16 min',
          description: 'Standard explosive pull workout targeting delts and traps.',
          battlePlan: 'Battle Plan — Standard Sets\n• 4×6 Barbell High Pull — standard reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240999/mood_app/workout_images/ehcn1tsd_High_pull.jpg',
          intensityReason: 'Standard explosive pull workout targeting delts and traps.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Jump, then pull',
              description: 'Power comes from legs.'
            },
            {
              icon: 'trending-up',
              title: 'Elbows high and outside',
              description: 'Shoulder bias.'
            },
            {
              icon: 'checkmark-circle',
              title: 'Pull to upper chest only',
              description: 'Clean reps = better pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'upright_row',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Density Push Press',
          duration: '15–17 min',
          description: 'High-density power press workout using moderate loads.',
          battlePlan: 'Battle Plan — Standard Sets\n• 6×5 Push Press — standard reps\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241034/mood_app/workout_images/wpyi7rra_bb_press_1.jpg',
          intensityReason: 'High-density power press workout using moderate loads.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Fast dip, fast drive',
              description: 'Elastic power.'
            },
            {
              icon: 'refresh',
              title: 'Same bar path every rep',
              description: 'Shoulder safety.'
            },
            {
              icon: 'timer',
              title: 'Lower slow into rack',
              description: 'Stretch fuels pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Push Press + Pushup Contrast',
          duration: '15–17 min',
          description: 'Superset workout pairing barbell power with bodyweight fatigue.',
          battlePlan: 'Battle Plan — Superset\n• 4×6 Push Press — standard reps\nsuperset with\n• 12–15 Pushups\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240968/mood_app/workout_images/0tjqvfc4_bb_press_2.jpg',
          intensityReason: 'Superset workout pairing barbell power with bodyweight fatigue.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Press first',
              description: 'Preserve power.'
            },
            {
              icon: 'body',
              title: 'Pushups extend fatigue',
              description: 'Safe volume.'
            },
            {
              icon: 'timer',
              title: 'Slow pushups down',
              description: 'Stretch + tension pump.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Strict Press Builder',
          duration: '18–20 min',
          description: 'Standard heavy press workout for advanced strength.',
          battlePlan: 'Battle Plan — Standard Sets\n• 6×5 Strict Overhead Press — standard reps\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241024/mood_app/workout_images/nqoj7ndk_strict_press.jpg',
          intensityReason: 'Standard heavy press workout for advanced strength.',
          moodTips: [
            {
              icon: 'body',
              title: 'Stay brutally strict',
              description: 'No leg assist.'
            },
            {
              icon: 'refresh',
              title: 'Reset every rep',
              description: 'Quality output.'
            },
            {
              icon: 'pause',
              title: 'Lower slow, squeeze early',
              description: 'Contracted delts beat lockout.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Split Jerk Builder',
          duration: '18–20 min',
          description: 'Standard Olympic power movement emphasizing speed and coordination.',
          battlePlan: 'Battle Plan — Standard Sets\n• 6×3 Split Jerk — standard reps\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241005/mood_app/workout_images/h2z9y5b7_split_jerk.jpg',
          intensityReason: 'Standard Olympic power movement emphasizing speed and coordination.',
          moodTips: [
            {
              icon: 'flash',
              title: "Punch the bar, don't press",
              description: 'Speed beats grind.'
            },
            {
              icon: 'body',
              title: 'Front knee tracks forward',
              description: 'Stable catch.'
            },
            {
              icon: 'lock-closed',
              title: 'Catch tall with locked arms',
              description: 'Overhead stability loads shoulders.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Push Jerk Drop Ladder',
          duration: '18–20 min',
          description: 'Multi-drop power workout combining speed and fatigue.',
          battlePlan: 'Battle Plan — Drop Ladder\n• 3 rounds:\n  4 reps → drop ~15% → 4 reps → drop ~10% → AMRAP\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241039/mood_app/workout_images/yi9y3sr0_push_press.jpg',
          intensityReason: 'Multi-drop power workout combining speed and fatigue.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Every rep explosive',
              description: 'If speed dies, drop weight.'
            },
            {
              icon: 'trending-down',
              title: 'Smaller drops preserve power',
              description: 'Quality reps.'
            },
            {
              icon: 'body',
              title: 'Short dip, violent drive',
              description: 'Shoulder stimulus comes from speed.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Snatch-Grip Push Press',
          duration: '18–20 min',
          description: 'Wide-grip power press workout to switch up the range and path of motion.',
          battlePlan: 'Battle Plan — Standard Sets\n• 5×5 Snatch-Grip Push Press — standard reps\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241035/mood_app/workout_images/wxlcn70h_bb_push_press.jpg',
          intensityReason: 'Wide-grip power press workout to switch up the range and path of motion.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Grip wide but controlled',
              description: 'Increased shoulder demand.'
            },
            {
              icon: 'body',
              title: 'Bar stays close to face',
              description: 'Safe path.'
            },
            {
              icon: 'pause',
              title: 'Finish with a punch',
              description: 'Contracted delts, not lockout rest.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'vertical_press',
          training_style: 'strength',
          intensity_cost: 5,
        }
      ]
    }
  }
];
