import { EquipmentWorkouts } from '../types/workout';

export const chestWorkoutDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Flat bench',
    icon: 'square',
    workouts: {
      beginner: [
        {
          name: 'Bench Fundamentals',
          duration: '12–15 min',
          description: 'Foundational bench reps to build pressing confidence.',
          battlePlan: 'Instructions: Use a load you could complete for 2 more reps.\nSets: 4\nRest: 75–90s\n\n• Barbell Bench Press — 4 × 8',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Barbell Bench Press",
                    "reps": "8",
                    "sets": 4,
                    "tutorialSlug": "barbell_flat_bench_press"
                  }
                ],
                "rest": "75–90s"
              }
            ],
            "instructions": "Use a load you could complete for 2 more reps."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241308/mood_app/workout_images/hs5s9gux_download_6_.jpg',
          intensityReason: 'Foundational bench reps to build pressing confidence.',
          moodTips: [
            {
              icon: 'body',
              title: 'Same setup every set',
              description: 'Feet rooted, shoulder blades pinned before unrack.'
            },
            {
              icon: 'shield-checkmark',
              title: 'Leave reps in reserve',
              description: 'Finish each set feeling confident, not rushed.'
            },
            {
              icon: 'checkmark-circle',
              title: 'No spotter needed',
              description: 'This should feel controlled, not risky.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Pause & Control',
          duration: '12–16 min',
          description: 'Paused reps to reinforce control and chest tension.',
          battlePlan: 'Instructions: 4 sets of 5 — rest 90s between sets. Pause for a full 1 second on the chest.\nSets: 4\nRest: 90s\n\n• Paused Barbell Bench Press — 4 × 5',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Paused Barbell Bench Press",
                    "reps": "5",
                    "sets": 4,
                    "tutorialSlug": "barbell_flat_bench_press"
                  }
                ],
                "rest": "90s"
              }
            ],
            "instructions": "4 sets of 5 — rest 90s between sets. Pause for a full 1 second on the chest."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241302/mood_app/workout_images/1yb66xch_download_5_.jpg',
          intensityReason: 'Paused reps to reinforce control and chest tension.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Kill momentum completely',
              description: 'Let the bar settle softly on the chest.'
            },
            {
              icon: 'flame',
              title: 'Tension never leaves',
              description: 'Chest stays active before and after the pause.'
            },
            {
              icon: 'shield',
              title: 'Use safeties if alone',
              description: 'Pauses increase time under load.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Slow Confidence',
          duration: '12–15 min',
          description: 'Slow eccentrics reinforce form and chest awareness.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 6 — rest 90s between sets. Lower the bar for 4 seconds each rep.\nSets: 3\nRest: 90s\n\n• Barbell Bench Press — 3 × 6 (4s eccentric)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Barbell Bench Press",
                    "note": "4s eccentric",
                    "reps": "6",
                    "sets": 3,
                    "tutorialSlug": "barbell_flat_bench_press"
                  }
                ],
                "rest": "90s"
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 6 — rest 90s between sets. Lower the bar for 4 seconds each rep."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240760/mood_app/workout_images/5pvyffxc_download_6_.jpg',
          intensityReason: 'Slow eccentrics reinforce form and chest awareness.',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Own the descent',
              description: 'Resist gravity for the full negative.'
            },
            {
              icon: 'hand-left',
              title: 'Soft touch only',
              description: 'No bounce or collapse at the bottom.'
            },
            {
              icon: 'people',
              title: 'Spotter optional',
              description: 'Use one if fatigue causes loss of control.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Light Bar Burn',
          duration: '10–14 min',
          description: 'High-rep benching to build endurance and comfort.',
          battlePlan: 'Instructions: Choose a light load and move continuously. 3 sets of 15–20 — rest 60s between sets.\nSets: 3\nRest: 60s\n\n• Barbell Bench Press — 3 × 15–20',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Barbell Bench Press",
                    "reps": "15–20",
                    "sets": 3,
                    "tutorialSlug": "barbell_flat_bench_press"
                  }
                ],
                "rest": "60s"
              }
            ],
            "instructions": "Choose a light load and move continuously. 3 sets of 15–20 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240771/mood_app/workout_images/ibf4t44u_download_5_.jpg',
          intensityReason: 'High-rep benching to build endurance and comfort.',
          moodTips: [
            {
              icon: 'heart',
              title: 'Ego stays out',
              description: 'Light weight keeps chest engaged nonstop.'
            },
            {
              icon: 'repeat',
              title: 'Every rep identical',
              description: 'Bar path never changes.'
            },
            {
              icon: 'shield',
              title: 'Have safeties set',
              description: 'High-rep fatigue sneaks up fast.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'pump',
          intensity_cost: 2,
        }
      ],
      intermediate: [
        {
          name: 'Cluster Control',
          duration: '14–18 min',
          description: 'Cluster benching to maintain power and bar speed.',
          battlePlan: 'Instructions: Cluster set: split the reps with a short built-in rest so every rep stays explosive. 4 sets of 4/4/4 — rest 2:00 between sets. 15s breaths between mini-sets.\nSets: 4\nRest: 2:00 between clusters\n\n• Barbell Bench Press — 4 × (4 / 4 / 4)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Barbell Bench Press",
                    "reps": "4/4/4",
                    "sets": 4,
                    "tutorialSlug": "barbell_flat_bench_press"
                  }
                ],
                "rest": "2:00 between clusters"
              }
            ],
            "instructions": "Cluster set: split the reps with a short built-in rest so every rep stays explosive. 4 sets of 4/4/4 — rest 2:00 between sets. 15s breaths between mini-sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241308/mood_app/workout_images/hs5s9gux_download_6_.jpg',
          intensityReason: 'Cluster benching to maintain power and bar speed.',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Each rep earns focus',
              description: 'Reset your brace before every mini-set.'
            },
            {
              icon: 'pulse',
              title: 'Short breaths only',
              description: 'Stay mentally locked in.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Fatigue accumulates quickly in clusters.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Working Sets',
          duration: '14–18 min',
          description: 'Traditional working bench sets with meaningful load.',
          battlePlan: 'Instructions: Increase load only if all reps stay clean. 5 sets of 6 — rest 90s between sets.\nSets: 5\nRest: 90s\n\n• Barbell Bench Press — 5 × 6',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Barbell Bench Press",
                    "reps": "6",
                    "sets": 5,
                    "tutorialSlug": "barbell_flat_bench_press"
                  }
                ],
                "rest": "90s"
              }
            ],
            "instructions": "Increase load only if all reps stay clean. 5 sets of 6 — rest 90s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241302/mood_app/workout_images/1yb66xch_download_5_.jpg',
          intensityReason: 'Traditional working bench sets with meaningful load.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Reps should challenge control',
              description: 'Bar speed slows slightly, form doesn\'t.'
            },
            {
              icon: 'body',
              title: 'Same setup every set',
              description: 'Consistency drives progress.'
            },
            {
              icon: 'people',
              title: 'Spotter optional',
              description: 'Useful on final sets as load climbs.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Strength Pauses',
          duration: '14–18 min',
          description: 'Paused benching with a strong contraction finish.',
          battlePlan: 'Instructions: Final rep includes a 6–8s squeeze at lockout.\nSets: 4\nRest: 2:00\n\n• Paused Barbell Bench Press — 4 × 4\nFinal rep: 6–8s squeeze',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Paused Barbell Bench Press",
                    "note": "Final rep: 6–8s squeeze",
                    "reps": "4",
                    "sets": 4,
                    "tutorialSlug": "barbell_flat_bench_press"
                  }
                ],
                "rest": "2:00"
              }
            ],
            "instructions": "Final rep includes a 6–8s squeeze at lockout."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240760/mood_app/workout_images/5pvyffxc_download_6_.jpg',
          intensityReason: 'Paused benching with a strong contraction finish.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause where strength fades',
              description: 'Bottom position exposes weakness.'
            },
            {
              icon: 'flash',
              title: 'Finish with intent',
              description: 'Lockout squeeze reinforces chest dominance.'
            },
            {
              icon: 'people',
              title: 'Spotter advised',
              description: 'Long pauses increase fatigue per rep.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Press & Fire',
          duration: '15–18 min',
          description: 'Close-grip bench paired with explosive push-ups.',
          battlePlan: 'Instructions: Superset: the paired moves run back-to-back with zero rest — rest only after the pair. Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom — rest 90s between exercises. Move immediately from bar to floor.\nSets: 4\nRest: 90s after push-ups\n\n• Close-Grip Bench Press — 4 × 6\n• Explosive Push-Ups — 4 × 12–15',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Close-Grip Bench Press",
                    "reps": "6",
                    "sets": 4,
                    "tutorialSlug": "close_grip_bench_press"
                  },
                  {
                    "name": "Explosive Push-Ups",
                    "reps": "12–15",
                    "sets": 4
                  }
                ],
                "rest": "90s after push-ups"
              }
            ],
            "instructions": "Superset: the paired moves run back-to-back with zero rest — rest only after the pair. Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom — rest 90s between exercises. Move immediately from bar to floor."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240771/mood_app/workout_images/ibf4t44u_download_5_.jpg',
          intensityReason: 'Close-grip bench paired with explosive push-ups.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Grip shift changes demand',
              description: 'Close grip increases control emphasis.'
            },
            {
              icon: 'flash',
              title: 'Explode cleanly',
              description: 'Push-ups stay athletic, not sloppy.'
            },
            {
              icon: 'alert-circle',
              title: 'Clear space first',
              description: 'Fast transitions matter for safety.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Clusters',
          duration: '16–20 min',
          description: 'Heavy cluster benching to sustain power output.',
          battlePlan: 'Instructions: Short breaths, full recovery between sets. 5 sets of 3/3/3 — rest 2:00 between sets.\nSets: 5\nRest: 2:00\n\n• Barbell Bench Press — 5 × (3 / 3 / 3)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Barbell Bench Press",
                    "reps": "3/3/3",
                    "sets": 5,
                    "tutorialSlug": "barbell_flat_bench_press"
                  }
                ],
                "rest": "2:00"
              }
            ],
            "instructions": "Short breaths, full recovery between sets. 5 sets of 3/3/3 — rest 2:00 between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241308/mood_app/workout_images/hs5s9gux_download_6_.jpg',
          intensityReason: 'Heavy cluster benching to sustain power output.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Precision under load',
              description: 'Heavy reps stay calm and repeatable.'
            },
            {
              icon: 'refresh',
              title: 'Reset fully',
              description: 'Treat each mini-set as its own effort.'
            },
            {
              icon: 'people',
              title: 'Spotter strongly recommended',
              description: 'Output stays high under fatigue.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Heavy Precision',
          duration: '16–20 min',
          description: 'Heavy benching focused on precision and output.',
          battlePlan: 'Instructions: 5 sets of 4 — rest 2:00 between sets. Challenging load, zero missed reps.\nSets: 5\nRest: 2:00\n\n• Barbell Bench Press — 5 × 4',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Barbell Bench Press",
                    "reps": "4",
                    "sets": 5,
                    "tutorialSlug": "barbell_flat_bench_press"
                  }
                ],
                "rest": "2:00"
              }
            ],
            "instructions": "5 sets of 4 — rest 2:00 between sets. Challenging load, zero missed reps."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241302/mood_app/workout_images/1yb66xch_download_5_.jpg',
          intensityReason: 'Heavy benching focused on precision and output.',
          moodTips: [
            {
              icon: 'checkmark-done',
              title: 'Every rep deliberate',
              description: 'No rushed unracks or sloppy lockouts.'
            },
            {
              icon: 'timer',
              title: 'Rest with intent',
              description: 'Power lives in recovery.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Especially on final sets.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Bench Drop Authority',
          duration: '15–20 min',
          description: 'Four-stage bench drop set for maximal chest fatigue.',
          battlePlan: 'Instructions: Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set. Strip weight immediately between stages.\nSets: 3\nRest: 2:30\n\n• Bench Press (Heavy) — max reps\n• Drop 1 (Medium) — max reps\n• Drop 2 (Light) — 12–15 reps\n• Drop 3 (Very Light) — burnout',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Bench Press",
                    "note": "Drop 1 (Medium) — max reps; Drop 2 (Light) — 12–15 reps; Drop 3 (Very Light) — burnout",
                    "reps": "max reps",
                    "tutorialSlug": "barbell_flat_bench_press"
                  }
                ],
                "rest": "2:30"
              }
            ],
            "instructions": "Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set. Strip weight immediately between stages."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240760/mood_app/workout_images/5pvyffxc_download_6_.jpg',
          intensityReason: 'Four-stage bench drop set for maximal chest fatigue.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Heavy earns the drop',
              description: 'First weight should reach true fatigue.'
            },
            {
              icon: 'flash',
              title: 'No rest between stages',
              description: 'Weight moves fast, tension stays on.'
            },
            {
              icon: 'alert',
              title: 'Spotter required',
              description: 'This set pushes close to failure.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Press & Explode',
          duration: '15–20 min',
          description: 'Heavy benching paired with explosive plyo push-ups.',
          battlePlan: 'Instructions: Work top to bottom — rest 2:00 between exercises. Move quickly but under control.\nSets: 4\nRest: 2:00 after push-ups\n\n• Bench Press — 4 × 4\n• Clap Push-Ups — 4 × 6–10',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Bench Press",
                    "reps": "4",
                    "sets": 4,
                    "tutorialSlug": "barbell_flat_bench_press"
                  },
                  {
                    "name": "Clap Push-Ups",
                    "reps": "6–10",
                    "sets": 4
                  }
                ],
                "rest": "2:00 after push-ups"
              }
            ],
            "instructions": "Work top to bottom — rest 2:00 between exercises. Move quickly but under control."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240771/mood_app/workout_images/ibf4t44u_download_5_.jpg',
          intensityReason: 'Heavy benching paired with explosive plyo push-ups.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Heavy then fast',
              description: 'Contrast preserves power under fatigue.'
            },
            {
              icon: 'flash',
              title: 'Claps stay crisp',
              description: 'Quality beats height.'
            },
            {
              icon: 'alert-circle',
              title: 'Clear the area',
              description: 'Plyos demand space and focus.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'mixed',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Incline bench',
    icon: 'trending-up',
    workouts: {
      beginner: [
        {
          name: 'Upper Chest Foundations',
          duration: '12–15 min',
          description: 'Foundational incline pressing to build upper chest confidence.',
          battlePlan: 'Instructions: Use a load you could complete for 2 more reps.\nSets: 4\nRest: 75–90s\n\n• Incline Barbell Press — 4 × 8',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Incline Barbell Press",
                    "reps": "8",
                    "sets": 4,
                    "tutorialSlug": "barbell_incline_bench_press"
                  }
                ],
                "rest": "75–90s"
              }
            ],
            "instructions": "Use a load you could complete for 2 more reps."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241310/mood_app/workout_images/jz7j4fdt_download_7_.jpg',
          intensityReason: 'Foundational incline pressing to build upper chest confidence.',
          moodTips: [
            {
              icon: 'construct',
              title: 'Set the angle first',
              description: 'Moderate incline keeps work in the chest, not shoulders.'
            },
            {
              icon: 'refresh',
              title: 'Move smoothly',
              description: 'Each rep should feel controlled and repeatable.'
            },
            {
              icon: 'checkmark-circle',
              title: 'No spotter needed',
              description: 'This should feel confident, not risky.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'incline_press',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Incline Control',
          duration: '12–16 min',
          description: 'Paused incline reps to reinforce upper chest control.',
          battlePlan: 'Instructions: 4 sets of 5 — rest 90s between sets. Pause softly for 1 second on the chest.\nSets: 4\nRest: 90s\n\n• Paused Incline Press — 4 × 5',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Paused Incline Press",
                    "reps": "5",
                    "sets": 4,
                    "tutorialSlug": "barbell_incline_bench_press"
                  }
                ],
                "rest": "90s"
              }
            ],
            "instructions": "4 sets of 5 — rest 90s between sets. Pause softly for 1 second on the chest."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241313/mood_app/workout_images/lnd9yph3_ibp.png',
          intensityReason: 'Paused incline reps to reinforce upper chest control.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause where tension peaks',
              description: 'Upper chest stays loaded at the bottom.'
            },
            {
              icon: 'body',
              title: 'Stay stacked',
              description: 'Wrists over elbows, elbows under the bar.'
            },
            {
              icon: 'shield',
              title: 'Use safeties if solo',
              description: 'Pauses increase time under load.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'incline_press',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Slow Incline',
          duration: '12–15 min',
          description: 'Slow eccentrics increase upper chest awareness and tension.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 6 — rest 90s between sets. Lower the bar for 4 seconds each rep.\nSets: 3\nRest: 90s\n\n• Incline Press — 3 × 6 (4s eccentric)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Incline Press",
                    "note": "4s eccentric",
                    "reps": "6",
                    "sets": 3,
                    "tutorialSlug": "barbell_incline_bench_press"
                  }
                ],
                "rest": "90s"
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 6 — rest 90s between sets. Lower the bar for 4 seconds each rep."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240761/mood_app/workout_images/6ssiv94d_download_4_.jpg',
          intensityReason: 'Slow eccentrics increase upper chest awareness and tension.',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Own the descent',
              description: 'Resist gravity for the full negative.'
            },
            {
              icon: 'hand-left',
              title: 'Soft touch only',
              description: 'No collapse into the bottom position.'
            },
            {
              icon: 'people',
              title: 'Spotter optional',
              description: 'Helpful if control fades late.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'incline_press',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Incline Burn',
          duration: '10–14 min',
          description: 'High-rep incline pressing to build upper chest endurance.',
          battlePlan: 'Instructions: Choose a light load and move continuously. 3 sets of 15–20 — rest 60s between sets.\nSets: 3\nRest: 60s\n\n• Incline Press — 3 × 15–20',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Incline Press",
                    "reps": "15–20",
                    "sets": 3,
                    "tutorialSlug": "barbell_incline_bench_press"
                  }
                ],
                "rest": "60s"
              }
            ],
            "instructions": "Choose a light load and move continuously. 3 sets of 15–20 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240767/mood_app/workout_images/fs4ku905_download_3_.jpg',
          intensityReason: 'High-rep incline pressing to build upper chest endurance.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Light and relentless',
              description: 'Chest stays active nonstop.'
            },
            {
              icon: 'lock-closed',
              title: 'No lockout rest',
              description: 'Tension stays on the pecs.'
            },
            {
              icon: 'shield',
              title: 'Set safeties',
              description: 'Fatigue builds fast at high reps.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'incline_press',
          training_style: 'pump',
          intensity_cost: 2,
        }
      ],
      intermediate: [
        {
          name: 'Incline Clusters',
          duration: '14–18 min',
          description: 'Cluster incline pressing to maintain power and bar speed.',
          battlePlan: 'Instructions: Cluster set: split the reps with a short built-in rest so every rep stays explosive. follow the 1 timed segment in order, no skipping. 15s breaths between mini-sets.\nSets: 4\nRest: 2:00 between clusters\n\n• Incline Press — 4 × (4 / 4 / 4)',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "name": "Incline Press",
                    "reps": "4/4/4",
                    "sets": 4,
                    "tutorialSlug": "barbell_incline_bench_press"
                  }
                ],
                "rest": "2:00 between clusters"
              }
            ],
            "instructions": "Cluster set: split the reps with a short built-in rest so every rep stays explosive. follow the 1 timed segment in order, no skipping. 15s breaths between mini-sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241310/mood_app/workout_images/jz7j4fdt_download_7_.jpg',
          intensityReason: 'Cluster incline pressing to maintain power and bar speed.',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Each rep deserves focus',
              description: 'Reset your brace before every mini-set.'
            },
            {
              icon: 'pulse',
              title: 'Short breaths only',
              description: 'Stay tight and present.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Fatigue accumulates quickly.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'incline_press',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Working Incline',
          duration: '14–18 min',
          description: 'Traditional incline benching with meaningful working weight.',
          battlePlan: 'Instructions: Increase load only if all reps stay clean. 5 sets of 6 — rest 90s between sets.\nSets: 5\nRest: 90s\n\n• Incline Press — 5 × 6',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Incline Press",
                    "reps": "6",
                    "sets": 5,
                    "tutorialSlug": "barbell_incline_bench_press"
                  }
                ],
                "rest": "90s"
              }
            ],
            "instructions": "Increase load only if all reps stay clean. 5 sets of 6 — rest 90s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241313/mood_app/workout_images/lnd9yph3_ibp.png',
          intensityReason: 'Traditional incline benching with meaningful working weight.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Reps should challenge control',
              description: 'Bar speed slows slightly, form doesn\'t.'
            },
            {
              icon: 'construct',
              title: 'Same angle every set',
              description: 'Consistency drives progress.'
            },
            {
              icon: 'people',
              title: 'Spotter optional',
              description: 'Useful on later sets.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'incline_press',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Upper Chest Holds',
          duration: '14–18 min',
          description: 'Paused incline pressing with a strong contraction finish.',
          battlePlan: 'Instructions: Final rep includes a 6–8s squeeze at lockout.\nSets: 4\nRest: 2:00\n\n• Paused Incline Press — 4 × 4\nFinal rep: 6–8s squeeze',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Paused Incline Press",
                    "note": "Final rep: 6–8s squeeze",
                    "reps": "4",
                    "sets": 4,
                    "tutorialSlug": "barbell_incline_bench_press"
                  }
                ],
                "rest": "2:00"
              }
            ],
            "instructions": "Final rep includes a 6–8s squeeze at lockout."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240761/mood_app/workout_images/6ssiv94d_download_4_.jpg',
          intensityReason: 'Paused incline pressing with a strong contraction finish.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause where strength fades',
              description: 'Bottom position exposes weakness.'
            },
            {
              icon: 'flash',
              title: 'Finish with intent',
              description: 'Lockout squeeze reinforces chest dominance.'
            },
            {
              icon: 'people',
              title: 'Spotter advised',
              description: 'Long pauses increase fatigue per rep.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'incline_press',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Incline & Fire',
          duration: '15–18 min',
          description: 'Incline pressing paired with explosive push-ups.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom — rest 90s between exercises. Move directly from bar to floor.\nSets: 4\nRest: 90s after push-ups\n\n• Incline Press — 4 × 6\n• Explosive Push-Ups — 4 × 12–15',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Incline Press",
                    "reps": "6",
                    "sets": 4,
                    "tutorialSlug": "barbell_incline_bench_press"
                  },
                  {
                    "name": "Explosive Push-Ups",
                    "reps": "12–15",
                    "sets": 4
                  }
                ],
                "rest": "90s after push-ups"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom — rest 90s between exercises. Move directly from bar to floor."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240767/mood_app/workout_images/fs4ku905_download_3_.jpg',
          intensityReason: 'Incline pressing paired with explosive push-ups.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Press then explode',
              description: 'Contrast keeps intensity high.'
            },
            {
              icon: 'body',
              title: 'Chest leads the push',
              description: 'Push-ups stay chest-biased.'
            },
            {
              icon: 'alert-circle',
              title: 'Clear space first',
              description: 'Fast transitions require focus.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'incline_press',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Incline Clusters',
          duration: '16–20 min',
          description: 'Heavy incline clusters to sustain upper chest power.',
          battlePlan: 'Instructions: Short breaths, full recovery between sets. follow the 1 timed segment in order, no skipping.\nSets: 5\nRest: 2:00\n\n• Incline Press — 5 × (3 / 3 / 3)',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "name": "Incline Press",
                    "reps": "3/3/3",
                    "sets": 5,
                    "tutorialSlug": "barbell_incline_bench_press"
                  }
                ],
                "rest": "2:00"
              }
            ],
            "instructions": "Short breaths, full recovery between sets. follow the 1 timed segment in order, no skipping."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241310/mood_app/workout_images/jz7j4fdt_download_7_.jpg',
          intensityReason: 'Heavy incline clusters to sustain upper chest power.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Precision under load',
              description: 'Heavy reps stay calm and repeatable.'
            },
            {
              icon: 'refresh',
              title: 'Reset fully',
              description: 'Treat each mini-set as a first rep.'
            },
            {
              icon: 'people',
              title: 'Spotter strongly recommended',
              description: 'Output stays high under fatigue.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'incline_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Heavy Incline',
          duration: '16–20 min',
          description: 'Heavy incline pressing focused on upper chest strength.',
          battlePlan: 'Instructions: 5 sets of 4 — rest 2:00 between sets. Challenging load, zero missed reps.\nSets: 5\nRest: 2:00\n\n• Incline Press — 5 × 4',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Incline Press",
                    "reps": "4",
                    "sets": 5,
                    "tutorialSlug": "barbell_incline_bench_press"
                  }
                ],
                "rest": "2:00"
              }
            ],
            "instructions": "5 sets of 4 — rest 2:00 between sets. Challenging load, zero missed reps."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241313/mood_app/workout_images/lnd9yph3_ibp.png',
          intensityReason: 'Heavy incline pressing focused on upper chest strength.',
          moodTips: [
            {
              icon: 'checkmark-done',
              title: 'Every rep deliberate',
              description: 'No rushed unracks or loose lockouts.'
            },
            {
              icon: 'timer',
              title: 'Rest with intent',
              description: 'Power lives in recovery.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Especially on final sets.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'incline_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Incline Drop Cascade',
          duration: '15–20 min',
          description: 'Four-stage incline drop set for deep upper chest fatigue.',
          battlePlan: 'Instructions: Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set. follow the 1 timed segment in order, no skipping. Strip weight immediately between stages.\nSets: 3\nRest: 2:30\n\n• Incline Press (Heavy) — max reps\n• Drop 1 (Medium) — max reps\n• Drop 2 (Light) — 12–15 reps\n• Drop 3 (Very Light) — burnout',
          plan: {
            "format": "interval",
            "blocks": [
              {
                "type": "interval",
                "movements": [
                  {
                    "name": "Incline Press",
                    "note": "Drop 1 (Medium) — max reps; Drop 2 (Light) — 12–15 reps; Drop 3 (Very Light) — burnout",
                    "reps": "max reps",
                    "tutorialSlug": "barbell_incline_bench_press"
                  }
                ],
                "rest": "2:30"
              }
            ],
            "instructions": "Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set. follow the 1 timed segment in order, no skipping. Strip weight immediately between stages."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240761/mood_app/workout_images/6ssiv94d_download_4_.jpg',
          intensityReason: 'Four-stage incline drop set for deep upper chest fatigue.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Heavy earns fatigue',
              description: 'First stage should reach true failure.'
            },
            {
              icon: 'flash',
              title: 'No rest between drops',
              description: 'Plates move, tension stays.'
            },
            {
              icon: 'alert',
              title: 'Spotter required',
              description: 'This set pushes close to failure.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'incline_press',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Press & Explode',
          duration: '15–20 min',
          description: 'Heavy incline pressing paired with explosive plyo push-ups.',
          battlePlan: 'Instructions: Work top to bottom — rest 2:00 between exercises. Move quickly but under control.\nSets: 4\nRest: 2:00 after push-ups\n\n• Incline Press — 4 × 4\n• Clap Push-Ups — 4 × 6–10',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Incline Press",
                    "reps": "4",
                    "sets": 4,
                    "tutorialSlug": "barbell_incline_bench_press"
                  },
                  {
                    "name": "Clap Push-Ups",
                    "reps": "6–10",
                    "sets": 4
                  }
                ],
                "rest": "2:00 after push-ups"
              }
            ],
            "instructions": "Work top to bottom — rest 2:00 between exercises. Move quickly but under control."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240767/mood_app/workout_images/fs4ku905_download_3_.jpg',
          intensityReason: 'Heavy incline pressing paired with explosive plyo push-ups.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Heavy then fast',
              description: 'Contrast preserves power under fatigue.'
            },
            {
              icon: 'flash',
              title: 'Claps stay crisp',
              description: 'Quality over height.'
            },
            {
              icon: 'alert-circle',
              title: 'Clear the area',
              description: 'Plyos demand space and focus.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'incline_press',
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
          name: 'Dumbbell Foundations',
          duration: '12–15 min',
          description: 'Foundational dumbbell pressing for chest control.',
          battlePlan: 'Instructions: Work top to bottom — rest 75–90s between exercises. Use a load you could do for 2 more reps.\nSets: 4\nRest: 75–90s\n\n• DB Flat Press — 2 × 10\n• DB Incline Press — 2 × 8',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "DB Flat Press",
                    "reps": "10",
                    "sets": 2,
                    "tutorialSlug": "dumbbell_flat_bench_press"
                  },
                  {
                    "name": "DB Incline Press",
                    "reps": "8",
                    "sets": 2,
                    "tutorialSlug": "dumbbell_incline_press"
                  }
                ],
                "rest": "75–90s"
              }
            ],
            "instructions": "Work top to bottom — rest 75–90s between exercises. Use a load you could do for 2 more reps."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240779/mood_app/workout_images/th0hlzzs_download_18_.jpg',
          intensityReason: 'Foundational dumbbell pressing for chest control.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Grip hard, press slightly inward',
              description: 'Create tension through the chest.'
            },
            {
              icon: 'repeat',
              title: 'Same arc every rep',
              description: 'Bells travel together, not straight up.'
            },
            {
              icon: 'checkmark-circle',
              title: 'No spotter needed',
              description: 'Choose control over load.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Paused Dumbbell Control',
          duration: '12–16 min',
          description: 'Paused dumbbell reps to reinforce chest stability.',
          battlePlan: 'Instructions: Pause 1 second at the bottom of each rep.\nSets: 4\nRest: 90s\n\n• Paused DB Incline Press — 4 × 8',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Paused DB Incline Press",
                    "reps": "8",
                    "sets": 4,
                    "tutorialSlug": "dumbbell_incline_press"
                  }
                ],
                "rest": "90s"
              }
            ],
            "instructions": "Pause 1 second at the bottom of each rep."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240773/mood_app/workout_images/msod5irt_download_19_.jpg',
          intensityReason: 'Paused dumbbell reps to reinforce chest stability.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause deep',
              description: 'Let the chest load fully before pressing.'
            },
            {
              icon: 'body',
              title: 'Elbows stay under wrists',
              description: 'Stability over speed.'
            },
            {
              icon: 'trending-down',
              title: 'Lower bells carefully',
              description: 'Fatigue affects balance quickly.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Slow Dumbbell Press',
          duration: '12–15 min',
          description: 'Slow eccentrics to improve chest awareness.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 8 — rest 90s between sets. Lower for 4 seconds each rep.\nSets: 3\nRest: 90s\n\n• DB Flat Press — 3 × 8 (4s eccentric)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "DB Flat Press",
                    "note": "4s eccentric",
                    "reps": "8",
                    "sets": 3,
                    "tutorialSlug": "dumbbell_flat_bench_press"
                  }
                ],
                "rest": "90s"
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 8 — rest 90s between sets. Lower for 4 seconds each rep."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240760/mood_app/workout_images/5pvyffxc_download_6_.jpg',
          intensityReason: 'Slow eccentrics to improve chest awareness.',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Own the descent',
              description: 'Time under tension drives growth.'
            },
            {
              icon: 'hand-left',
              title: 'Soft bottom position',
              description: 'No bouncing or collapsing.'
            },
            {
              icon: 'people',
              title: 'Spotter optional',
              description: 'Helpful as weights increase.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Dumbbell Burn',
          duration: '10–14 min',
          description: 'High-rep dumbbell pressing for chest endurance.',
          battlePlan: 'Instructions: Choose light bells and move continuously. 3 sets of 15–20 — rest 60s between sets.\nSets: 3\nRest: 60s\n\n• DB Incline Press — 3 × 15–20',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "DB Incline Press",
                    "reps": "15–20",
                    "sets": 3,
                    "tutorialSlug": "dumbbell_incline_press"
                  }
                ],
                "rest": "60s"
              }
            ],
            "instructions": "Choose light bells and move continuously. 3 sets of 15–20 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240771/mood_app/workout_images/ibf4t44u_download_5_.jpg',
          intensityReason: 'High-rep dumbbell pressing for chest endurance.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Light and relentless',
              description: 'Chest stays active nonstop.'
            },
            {
              icon: 'repeat',
              title: 'Range stays honest',
              description: 'No half reps late.'
            },
            {
              icon: 'shield',
              title: 'Drop bells safely',
              description: 'Don\'t fight fatigue down.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'pump',
          intensity_cost: 2,
        }
      ],
      intermediate: [
        {
          name: 'Dumbbell Clusters',
          duration: '14–18 min',
          description: 'Dumbbell clusters to maintain pressing power.',
          battlePlan: 'Instructions: 4 sets of 5/5/5 — rest 2:00 between sets. 15s breaths between mini-sets.\nSets: 4\nRest: 2:00 between clusters\n\n• DB Flat Press — 4 × (5 / 5 / 5)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "DB Flat Press",
                    "reps": "5/5/5",
                    "sets": 4,
                    "tutorialSlug": "dumbbell_flat_bench_press"
                  }
                ],
                "rest": "2:00 between clusters"
              }
            ],
            "instructions": "4 sets of 5/5/5 — rest 2:00 between sets. 15s breaths between mini-sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240779/mood_app/workout_images/th0hlzzs_download_18_.jpg',
          intensityReason: 'Dumbbell clusters to maintain pressing power.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Reset before every mini-set',
              description: 'Each rep starts strong.'
            },
            {
              icon: 'pulse',
              title: 'Short breaths only',
              description: 'Stay mentally locked in.'
            },
            {
              icon: 'alert-circle',
              title: 'Clear space',
              description: 'Dumbbells demand control when tired.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Working Dumbbells',
          duration: '14–18 min',
          description: 'Traditional dumbbell pressing with meaningful load.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom — rest 90s between exercises. Increase weight only if reps stay clean.\nSets: 5\nRest: 90s\n\n• DB Flat Press — 3 × 8\n• DB Incline Press — 2 × 8',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "DB Flat Press",
                    "reps": "8",
                    "sets": 3,
                    "tutorialSlug": "dumbbell_flat_bench_press"
                  },
                  {
                    "name": "DB Incline Press",
                    "reps": "8",
                    "sets": 2,
                    "tutorialSlug": "dumbbell_incline_press"
                  }
                ],
                "rest": "90s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom — rest 90s between exercises. Increase weight only if reps stay clean."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240773/mood_app/workout_images/msod5irt_download_19_.jpg',
          intensityReason: 'Traditional dumbbell pressing with meaningful load.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Reps should challenge control',
              description: 'Slight slowdown is fine.'
            },
            {
              icon: 'arrow-forward',
              title: 'Press inward at the top',
              description: 'Finish with chest intent.'
            },
            {
              icon: 'people',
              title: 'Spotter optional',
              description: 'Useful for heavier sets.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Dumbbell Holds',
          duration: '14–18 min',
          description: 'Paused dumbbell pressing with strong squeeze finish.',
          battlePlan: 'Instructions: Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 6 — rest 2:00 between sets. Final rep includes a 6–8s squeeze.\nSets: 4\nRest: 2:00\n\n• Paused DB Incline Press — 4 × 6\nFinal rep: 6–8s squeeze',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Paused DB Incline Press",
                    "note": "Final rep: 6–8s squeeze",
                    "reps": "6",
                    "sets": 4,
                    "tutorialSlug": "dumbbell_incline_press"
                  }
                ],
                "rest": "2:00"
              }
            ],
            "instructions": "Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 6 — rest 2:00 between sets. Final rep includes a 6–8s squeeze."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240760/mood_app/workout_images/5pvyffxc_download_6_.jpg',
          intensityReason: 'Paused dumbbell pressing with strong squeeze finish.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause deep',
              description: 'Chest stretches under control.'
            },
            {
              icon: 'flash',
              title: 'Finish hard',
              description: 'Long squeeze reinforces contraction.'
            },
            {
              icon: 'trending-down',
              title: 'Lower bells carefully',
              description: 'Fatigue shifts balance fast.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Press & Drive',
          duration: '15–18 min',
          description: 'Incline dumbbell pressing paired with push-ups.',
          battlePlan: 'Instructions: Work top to bottom — rest 90s between exercises. Move directly from bench to floor.\nSets: 4\nRest: 90s after push-ups\n\n• DB Incline Press — 4 × 8\n• Chest-Biased Push-Ups — 4 × 15–20',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "DB Incline Press",
                    "reps": "8",
                    "sets": 4,
                    "tutorialSlug": "dumbbell_incline_press"
                  },
                  {
                    "name": "Chest-Biased Push-Ups",
                    "reps": "15–20",
                    "sets": 4
                  }
                ],
                "rest": "90s after push-ups"
              }
            ],
            "instructions": "Work top to bottom — rest 90s between exercises. Move directly from bench to floor."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240771/mood_app/workout_images/ibf4t44u_download_5_.jpg',
          intensityReason: 'Incline dumbbell pressing paired with push-ups.',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Incline first',
              description: 'Upper chest sets the tone.'
            },
            {
              icon: 'body',
              title: 'Chest leads both movements',
              description: 'Push-ups stay chest-biased.'
            },
            {
              icon: 'alert-circle',
              title: 'Clear floor space',
              description: 'Fast transitions matter.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Dumbbell Clusters',
          duration: '16–20 min',
          description: 'Heavy dumbbell clusters to sustain chest output.',
          battlePlan: 'Instructions: Short breaths, full recovery between sets. 5 sets of 4/4/4 — rest 2:00 between sets.\nSets: 5\nRest: 2:00\n\n• DB Flat Press — 5 × (4 / 4 / 4)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "DB Flat Press",
                    "reps": "4/4/4",
                    "sets": 5,
                    "tutorialSlug": "dumbbell_flat_bench_press"
                  }
                ],
                "rest": "2:00"
              }
            ],
            "instructions": "Short breaths, full recovery between sets. 5 sets of 4/4/4 — rest 2:00 between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240779/mood_app/workout_images/th0hlzzs_download_18_.jpg',
          intensityReason: 'Heavy dumbbell clusters to sustain chest output.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Precision under fatigue',
              description: 'Every rep mirrors the first.'
            },
            {
              icon: 'refresh',
              title: 'Reset fully',
              description: 'Don\'t rush bells into position.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Heavy dumbbells get unstable fast.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Heavy Dumbbells',
          duration: '16–20 min',
          description: 'Heavy dumbbell pressing focused on chest strength.',
          battlePlan: 'Instructions: Work top to bottom — rest 2:00 between exercises. Challenging load, zero sloppy reps.\nSets: 5\nRest: 2:00\n\n• DB Flat Press — 3 × 6\n• DB Incline Press — 2 × 6',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "DB Flat Press",
                    "reps": "6",
                    "sets": 3,
                    "tutorialSlug": "dumbbell_flat_bench_press"
                  },
                  {
                    "name": "DB Incline Press",
                    "reps": "6",
                    "sets": 2,
                    "tutorialSlug": "dumbbell_incline_press"
                  }
                ],
                "rest": "2:00"
              }
            ],
            "instructions": "Work top to bottom — rest 2:00 between exercises. Challenging load, zero sloppy reps."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240773/mood_app/workout_images/msod5irt_download_19_.jpg',
          intensityReason: 'Heavy dumbbell pressing focused on chest strength.',
          moodTips: [
            {
              icon: 'checkmark-done',
              title: 'Every rep deliberate',
              description: 'No rushed setup.'
            },
            {
              icon: 'timer',
              title: 'Rest with intent',
              description: 'Strength needs recovery.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Especially for final sets.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Dumbbell Drop Cascade',
          duration: '15–20 min',
          description: 'Multi-stage dumbbell drops for deep chest fatigue.',
          battlePlan: 'Instructions: Superset: the paired moves run back-to-back with zero rest — rest only after the pair. Drop weight immediately between stages.\nSets: 3\nRest: 2:30\n\n• DB Press (Heavy) — max reps\n• Drop 1 (Medium) — max reps\n• Drop 2 (Light) — 15–20 reps',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "DB Press",
                    "note": "Drop 1 (Medium) — max reps; Drop 2 (Light) — 15–20 reps",
                    "reps": "max reps"
                  }
                ],
                "rest": "2:30"
              }
            ],
            "instructions": "Superset: the paired moves run back-to-back with zero rest — rest only after the pair. Drop weight immediately between stages."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240760/mood_app/workout_images/5pvyffxc_download_6_.jpg',
          intensityReason: 'Multi-stage dumbbell drops for deep chest fatigue.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Heavy earns fatigue',
              description: 'First bells reach true failure.'
            },
            {
              icon: 'flash',
              title: 'No rest between drops',
              description: 'Bells change fast.'
            },
            {
              icon: 'people',
              title: 'Spotter strongly recommended',
              description: 'Fatigue rises fast.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Press & Explode',
          duration: '15–20 min',
          description: 'Heavy dumbbell pressing paired with plyometric push-ups.',
          battlePlan: 'Instructions: Work top to bottom — rest 2:00 between exercises. Move quickly but under control.\nSets: 4\nRest: 2:00 after push-ups\n\n• DB Flat Press — 4 × 6\n• Clap Push-Ups — 4 × 6–10',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "DB Flat Press",
                    "reps": "6",
                    "sets": 4,
                    "tutorialSlug": "dumbbell_flat_bench_press"
                  },
                  {
                    "name": "Clap Push-Ups",
                    "reps": "6–10",
                    "sets": 4
                  }
                ],
                "rest": "2:00 after push-ups"
              }
            ],
            "instructions": "Work top to bottom — rest 2:00 between exercises. Move quickly but under control."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240771/mood_app/workout_images/ibf4t44u_download_5_.jpg',
          intensityReason: 'Heavy dumbbell pressing paired with plyometric push-ups.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Heavy then fast',
              description: 'Contrast sharpens output.'
            },
            {
              icon: 'flash',
              title: 'Push-ups crisp',
              description: 'Power without chaos.'
            },
            {
              icon: 'alert-circle',
              title: 'Clear space first',
              description: 'Plyos need space.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'mixed',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Decline bench',
    icon: 'trending-down',
    workouts: {
      beginner: [
        {
          name: 'Decline Foundations',
          duration: '12–15 min',
          description: 'Foundational decline pressing for lower chest confidence.',
          battlePlan: 'Instructions: Use a load you could complete for 2 more reps.\nSets: 4\nRest: 75–90s\n\n• Decline Barbell Press — 4 × 8',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Decline Barbell Press",
                    "reps": "8",
                    "sets": 4,
                    "tutorialSlug": "decline_bench_press"
                  }
                ],
                "rest": "75–90s"
              }
            ],
            "instructions": "Use a load you could complete for 2 more reps."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241316/mood_app/workout_images/r1uig0ll_download_4_.jpg',
          intensityReason: 'Foundational decline pressing for lower chest confidence.',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Control the descent',
              description: 'Lower chest stays loaded the whole rep.'
            },
            {
              icon: 'body',
              title: 'Chest stays tall',
              description: 'Don\'t collapse into the bottom.'
            },
            {
              icon: 'checkmark-circle',
              title: 'No spotter needed',
              description: 'This should feel stable and repeatable.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'decline_press',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Decline Control',
          duration: '12–16 min',
          description: 'Paused decline reps to reinforce chest tension.',
          battlePlan: 'Instructions: 4 sets of 5 — rest 90s between sets. Pause for 1 second on the chest.\nSets: 4\nRest: 90s\n\n• Paused Decline Press — 4 × 5',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Paused Decline Press",
                    "reps": "5",
                    "sets": 4,
                    "tutorialSlug": "decline_bench_press"
                  }
                ],
                "rest": "90s"
              }
            ],
            "instructions": "4 sets of 5 — rest 90s between sets. Pause for 1 second on the chest."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241316/mood_app/workout_images/r1uig0ll_download_4_.jpg',
          intensityReason: 'Paused decline reps to reinforce chest tension.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause softly',
              description: 'Let tension settle in the lower chest.'
            },
            {
              icon: 'body',
              title: 'Elbows track clean',
              description: 'Avoid hard flaring.'
            },
            {
              icon: 'shield',
              title: 'Use safeties if solo',
              description: 'Pauses extend time under load.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'decline_press',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Slow Decline',
          duration: '12–15 min',
          description: 'Slow eccentrics increase lower chest time under tension.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 6 — rest 90s between sets. Lower for 4 seconds each rep.\nSets: 3\nRest: 90s\n\n• Decline Press — 3 × 6 (4s eccentric)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Decline Press",
                    "note": "4s eccentric",
                    "reps": "6",
                    "sets": 3,
                    "tutorialSlug": "decline_bench_press"
                  }
                ],
                "rest": "90s"
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 6 — rest 90s between sets. Lower for 4 seconds each rep."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240784/mood_app/workout_images/y22u5a5z_Screenshot_2026-02-01_at_10_11_43_PM.jpg',
          intensityReason: 'Slow eccentrics increase lower chest time under tension.',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Win the negative',
              description: 'Control builds thickness.'
            },
            {
              icon: 'lock-closed',
              title: 'Stay tight',
              description: 'No sinking into the bottom.'
            },
            {
              icon: 'people',
              title: 'Spotter optional',
              description: 'Helpful as fatigue builds.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'decline_press',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Decline Burn',
          duration: '10–14 min',
          description: 'High-rep decline pressing to build lower chest endurance.',
          battlePlan: 'Instructions: Choose a light load and move continuously. 3 sets of 15–20 — rest 60s between sets.\nSets: 3\nRest: 60s\n\n• Decline Press — 3 × 15–20',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Decline Press",
                    "reps": "15–20",
                    "sets": 3,
                    "tutorialSlug": "decline_bench_press"
                  }
                ],
                "rest": "60s"
              }
            ],
            "instructions": "Choose a light load and move continuously. 3 sets of 15–20 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240783/mood_app/workout_images/wu5otnku_Screenshot_2026-02-01_at_10_10_52_PM.jpg',
          intensityReason: 'High-rep decline pressing to build lower chest endurance.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Light and steady',
              description: 'No resting at lockout.'
            },
            {
              icon: 'repeat',
              title: 'Same bar path',
              description: 'Consistency through fatigue.'
            },
            {
              icon: 'shield',
              title: 'Set safeties',
              description: 'High-rep fatigue accumulates fast.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'decline_press',
          training_style: 'pump',
          intensity_cost: 2,
        }
      ],
      intermediate: [
        {
          name: 'Decline Clusters',
          duration: '14–18 min',
          description: 'Cluster decline pressing to maintain output and control.',
          battlePlan: 'Instructions: Cluster set: split the reps with a short built-in rest so every rep stays explosive. 4 sets of 4/4/4 — rest 2:00 between sets. 15s breaths between mini-sets.\nSets: 4\nRest: 2:00 between clusters\n\n• Decline Press — 4 × (4 / 4 / 4)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Decline Press",
                    "reps": "4/4/4",
                    "sets": 4,
                    "tutorialSlug": "decline_bench_press"
                  }
                ],
                "rest": "2:00 between clusters"
              }
            ],
            "instructions": "Cluster set: split the reps with a short built-in rest so every rep stays explosive. 4 sets of 4/4/4 — rest 2:00 between sets. 15s breaths between mini-sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241316/mood_app/workout_images/r1uig0ll_download_4_.jpg',
          intensityReason: 'Cluster decline pressing to maintain output and control.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Power stays high',
              description: 'Each rep stays sharp.'
            },
            {
              icon: 'pulse',
              title: 'Short breaths only',
              description: 'Stay braced throughout.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Fatigue builds quickly.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'decline_press',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Working Decline',
          duration: '14–18 min',
          description: 'Traditional decline benching with meaningful working load.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 6 — rest 90s between sets. Increase load only if reps stay clean.\nSets: 5\nRest: 90s\n\n• Decline Press — 5 × 6',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Decline Press",
                    "reps": "6",
                    "sets": 5,
                    "tutorialSlug": "decline_bench_press"
                  }
                ],
                "rest": "90s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 6 — rest 90s between sets. Increase load only if reps stay clean."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241316/mood_app/workout_images/r1uig0ll_download_4_.jpg',
          intensityReason: 'Traditional decline benching with meaningful working load.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Reps should work',
              description: 'Control never fades.'
            },
            {
              icon: 'body',
              title: 'Same touch point',
              description: 'Bar path stays consistent.'
            },
            {
              icon: 'people',
              title: 'Spotter optional',
              description: 'Useful on later sets.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'decline_press',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Lower Chest Holds',
          duration: '14–18 min',
          description: 'Paused decline pressing with strong contraction finish.',
          battlePlan: 'Instructions: Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 4 — rest 2:00 between sets. Final rep includes a 6–8s squeeze.\nSets: 4\nRest: 2:00\n\n• Paused Decline Press — 4 × 4\nFinal rep: 6–8s squeeze',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Paused Decline Press",
                    "note": "Final rep: 6–8s squeeze",
                    "reps": "4",
                    "sets": 4,
                    "tutorialSlug": "decline_bench_press"
                  }
                ],
                "rest": "2:00"
              }
            ],
            "instructions": "Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 4 — rest 2:00 between sets. Final rep includes a 6–8s squeeze."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240784/mood_app/workout_images/y22u5a5z_Screenshot_2026-02-01_at_10_11_43_PM.jpg',
          intensityReason: 'Paused decline pressing with strong contraction finish.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause where stretch peaks',
              description: 'Bottom position challenges strength.'
            },
            {
              icon: 'flash',
              title: 'Finish strong',
              description: 'Long lockout squeeze.'
            },
            {
              icon: 'people',
              title: 'Spotter advised',
              description: 'Pauses amplify fatigue.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'decline_press',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Decline & Drive',
          duration: '15–18 min',
          description: 'Decline pressing paired with chest-focused push-ups.',
          battlePlan: 'Instructions: Work top to bottom — rest 90s between exercises. Move directly from bar to floor.\nSets: 4\nRest: 90s after push-ups\n\n• Decline Press — 4 × 6\n• Chest-Biased Push-Ups — 4 × 15–20',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Decline Press",
                    "reps": "6",
                    "sets": 4,
                    "tutorialSlug": "decline_bench_press"
                  },
                  {
                    "name": "Chest-Biased Push-Ups",
                    "reps": "15–20",
                    "sets": 4
                  }
                ],
                "rest": "90s after push-ups"
              }
            ],
            "instructions": "Work top to bottom — rest 90s between exercises. Move directly from bar to floor."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240783/mood_app/workout_images/wu5otnku_Screenshot_2026-02-01_at_10_10_52_PM.jpg',
          intensityReason: 'Decline pressing paired with chest-focused push-ups.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Press then push',
              description: 'Compound into bodyweight.'
            },
            {
              icon: 'body',
              title: 'Chest-forward angle',
              description: 'Push-ups stay chest-biased.'
            },
            {
              icon: 'alert-circle',
              title: 'Clear space first',
              description: 'Fast transitions matter.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'decline_press',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Decline Clusters',
          duration: '16–20 min',
          description: 'Heavy decline clusters to sustain lower chest power.',
          battlePlan: 'Instructions: Short breaths, full recovery between sets. 5 sets of 3/3/3 — rest 2:00 between sets.\nSets: 5\nRest: 2:00\n\n• Decline Press — 5 × (3 / 3 / 3)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Decline Press",
                    "reps": "3/3/3",
                    "sets": 5,
                    "tutorialSlug": "decline_bench_press"
                  }
                ],
                "rest": "2:00"
              }
            ],
            "instructions": "Short breaths, full recovery between sets. 5 sets of 3/3/3 — rest 2:00 between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241316/mood_app/workout_images/r1uig0ll_download_4_.jpg',
          intensityReason: 'Heavy decline clusters to sustain lower chest power.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Precision under load',
              description: 'No sloppy reps.'
            },
            {
              icon: 'refresh',
              title: 'Reset fully',
              description: 'Treat each cluster clean.'
            },
            {
              icon: 'people',
              title: 'Spotter strongly recommended',
              description: 'Output stays high under fatigue.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'decline_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Heavy Decline',
          duration: '16–20 min',
          description: 'Heavy decline pressing focused on lower chest strength.',
          battlePlan: 'Instructions: 5 sets of 4 — rest 2:00 between sets. Challenging load, zero missed reps.\nSets: 5\nRest: 2:00\n\n• Decline Press — 5 × 4',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Decline Press",
                    "reps": "4",
                    "sets": 5,
                    "tutorialSlug": "decline_bench_press"
                  }
                ],
                "rest": "2:00"
              }
            ],
            "instructions": "5 sets of 4 — rest 2:00 between sets. Challenging load, zero missed reps."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241316/mood_app/workout_images/r1uig0ll_download_4_.jpg',
          intensityReason: 'Heavy decline pressing focused on lower chest strength.',
          moodTips: [
            {
              icon: 'checkmark-done',
              title: 'Every rep identical',
              description: 'Setup never rushed.'
            },
            {
              icon: 'timer',
              title: 'Recover fully',
              description: 'Strength lives in rest.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Especially on final sets.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'decline_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Decline Drop Cascade',
          duration: '15–20 min',
          description: 'Four-stage decline drop set for deep chest fatigue.',
          battlePlan: 'Instructions: Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set. Strip weight immediately between stages.\nSets: 3\nRest: 2:30\n\n• Decline Press (Heavy) — max reps\n• Drop 1 (Medium) — max reps\n• Drop 2 (Light) — 12–15 reps\n• Drop 3 (Very Light) — burnout',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Decline Press",
                    "note": "Drop 1 (Medium) — max reps; Drop 2 (Light) — 12–15 reps; Drop 3 (Very Light) — burnout",
                    "reps": "max reps",
                    "tutorialSlug": "decline_bench_press"
                  }
                ],
                "rest": "2:30"
              }
            ],
            "instructions": "Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set. Strip weight immediately between stages."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240784/mood_app/workout_images/y22u5a5z_Screenshot_2026-02-01_at_10_11_43_PM.jpg',
          intensityReason: 'Four-stage decline drop set for deep chest fatigue.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Heavy earns fatigue',
              description: 'First stage reaches true failure.'
            },
            {
              icon: 'flash',
              title: 'No rest between drops',
              description: 'Plates move, tension stays.'
            },
            {
              icon: 'alert',
              title: 'Spotter required',
              description: 'This set is pushed hard.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'decline_press',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Press & Explode',
          duration: '15–20 min',
          description: 'Heavy decline pressing paired with explosive plyo push-ups.',
          battlePlan: 'Instructions: Work top to bottom — rest 2:00 between exercises. Move quickly but under control.\nSets: 4\nRest: 2:00 after push-ups\n\n• Decline Press — 4 × 4\n• Clap Push-Ups — 4 × 6–10',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Decline Press",
                    "reps": "4",
                    "sets": 4,
                    "tutorialSlug": "decline_bench_press"
                  },
                  {
                    "name": "Clap Push-Ups",
                    "reps": "6–10",
                    "sets": 4
                  }
                ],
                "rest": "2:00 after push-ups"
              }
            ],
            "instructions": "Work top to bottom — rest 2:00 between exercises. Move quickly but under control."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240783/mood_app/workout_images/wu5otnku_Screenshot_2026-02-01_at_10_10_52_PM.jpg',
          intensityReason: 'Heavy decline pressing paired with explosive plyo push-ups.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Heavy then fast',
              description: 'Contrast keeps output high.'
            },
            {
              icon: 'flash',
              title: 'Claps stay crisp',
              description: 'Power without chaos.'
            },
            {
              icon: 'alert-circle',
              title: 'Clear the area',
              description: 'Plyos demand space.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'decline_press',
          training_style: 'mixed',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Smith machine',
    icon: 'barbell',
    workouts: {
      beginner: [
        {
          name: 'Smith Foundations',
          duration: '12–15 min',
          description: 'Stable Smith pressing to build chest confidence.',
          battlePlan: 'Instructions: Work top to bottom. Use a load you could do for 2 more reps.\nSets: 4\n\n• Smith Flat Press — 2 × 10\n• Smith Incline Press — 2 × 8',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Smith Flat Press",
                    "reps": "10",
                    "sets": 2
                  },
                  {
                    "name": "Smith Incline Press",
                    "reps": "8",
                    "sets": 2
                  }
                ]
              }
            ],
            "instructions": "Work top to bottom. Use a load you could do for 2 more reps."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241319/mood_app/workout_images/wqpgrlpk_download_9_.jpg',
          intensityReason: 'Stable Smith pressing to build chest confidence.',
          moodTips: [
            {
              icon: 'construct',
              title: 'Lock your setup first',
              description: 'Feet and shoulders fixed before unrack.'
            },
            {
              icon: 'refresh',
              title: 'Smooth reps only',
              description: 'Let the rails guide consistency.'
            },
            {
              icon: 'checkmark-circle',
              title: 'No spotter needed',
              description: 'Smith provides built-in safety.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Smith Control',
          duration: '12–16 min',
          description: 'Paused Smith reps to reinforce chest engagement.',
          battlePlan: 'Instructions: 4 sets of 8 — rest between sets. Pause 1 second on chest.\nSets: 4\n\n• Paused Smith Incline Press — 4 × 8',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Paused Smith Incline Press",
                    "reps": "8",
                    "sets": 4
                  }
                ]
              }
            ],
            "instructions": "4 sets of 8 — rest between sets. Pause 1 second on chest."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241315/mood_app/workout_images/pl1dkh7x_download_8_.jpg',
          intensityReason: 'Paused Smith reps to reinforce chest engagement.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause kills bounce',
              description: 'Let the chest hold the load.'
            },
            {
              icon: 'body',
              title: 'Stay pinned',
              description: 'Shoulder blades never drift.'
            },
            {
              icon: 'shield',
              title: 'Use safeties',
              description: 'Pauses increase fatigue.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Slow Smith Press',
          duration: '12–15 min',
          description: 'Slow negatives on Smith press for chest tension.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 8 — rest between sets. Lower for 4 seconds.\nSets: 3\n\n• Smith Flat Press — 3 × 8 (4s eccentric)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Smith Flat Press",
                    "note": "4s eccentric",
                    "reps": "8",
                    "sets": 3
                  }
                ]
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 8 — rest between sets. Lower for 4 seconds."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240758/mood_app/workout_images/4b771hh1_download_15_.jpg',
          intensityReason: 'Slow negatives on Smith press for chest tension.',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Own the rails',
              description: 'Control the descent fully.'
            },
            {
              icon: 'hand-left',
              title: 'Soft bottom touch',
              description: 'No collapse.'
            },
            {
              icon: 'people',
              title: 'Spotter optional',
              description: 'Fatigue builds subtly.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Smith Burn',
          duration: '10–14 min',
          description: 'High-rep Smith pressing for chest endurance.',
          battlePlan: 'Instructions: 3 sets of 15–20 — rest between sets. Choose light load.\nSets: 3\n\n• Smith Incline Press — 3 × 15–20',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Smith Incline Press",
                    "reps": "15–20",
                    "sets": 3
                  }
                ]
              }
            ],
            "instructions": "3 sets of 15–20 — rest between sets. Choose light load."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240770/mood_app/workout_images/hag08c16_download_14_.jpg',
          intensityReason: 'High-rep Smith pressing for chest endurance.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Light and nonstop',
              description: 'Keep tension continuous.'
            },
            {
              icon: 'lock-closed',
              title: 'No lockout rest',
              description: 'Stay in the work.'
            },
            {
              icon: 'alert-circle',
              title: 'Rack quickly',
              description: 'Fatigue builds fast.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'pump',
          intensity_cost: 2,
        }
      ],
      intermediate: [
        {
          name: 'Smith Clusters',
          duration: '14–18 min',
          description: 'Smith cluster pressing to maintain output.',
          battlePlan: 'Instructions: Cluster set: split the reps with a short built-in rest so every rep stays explosive. 4 sets of 5/5/5 — rest between sets. 15s breaths.\nSets: 4\n\n• Smith Flat Press — 4 × (5 / 5 / 5)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Smith Flat Press",
                    "reps": "5/5/5",
                    "sets": 4
                  }
                ]
              }
            ],
            "instructions": "Cluster set: split the reps with a short built-in rest so every rep stays explosive. 4 sets of 5/5/5 — rest between sets. 15s breaths."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241319/mood_app/workout_images/wqpgrlpk_download_9_.jpg',
          intensityReason: 'Smith cluster pressing to maintain output.',
          moodTips: [
            {
              icon: 'repeat',
              title: 'Rails don\'t excuse slop',
              description: 'Every rep clean.'
            },
            {
              icon: 'pulse',
              title: 'Short breaths only',
              description: 'Stay braced.'
            },
            {
              icon: 'people',
              title: 'Spotter optional',
              description: 'Helpful at higher loads.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Working Smith',
          duration: '14–18 min',
          description: 'Traditional Smith pressing with meaningful load.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom. Increase load only if reps stay clean.\nSets: 5\n\n• Smith Flat Press — 3 × 8\n• Smith Incline Press — 2 × 8',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Smith Flat Press",
                    "reps": "8",
                    "sets": 3
                  },
                  {
                    "name": "Smith Incline Press",
                    "reps": "8",
                    "sets": 2
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom. Increase load only if reps stay clean."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241315/mood_app/workout_images/pl1dkh7x_download_8_.jpg',
          intensityReason: 'Traditional Smith pressing with meaningful load.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Reps should work',
              description: 'Control never fades.'
            },
            {
              icon: 'body',
              title: 'Same foot position',
              description: 'Consistency matters.'
            },
            {
              icon: 'people',
              title: 'Spotter optional',
              description: 'Helpful on later sets.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Smith Holds',
          duration: '14–18 min',
          description: 'Paused Smith pressing with contraction finish.',
          battlePlan: 'Instructions: Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 6 — rest between sets. Final rep 6–8s squeeze.\nSets: 4\n\n• Paused Smith Incline Press — 4 × 6',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Paused Smith Incline Press",
                    "reps": "6",
                    "sets": 4
                  }
                ]
              }
            ],
            "instructions": "Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 6 — rest between sets. Final rep 6–8s squeeze."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240758/mood_app/workout_images/4b771hh1_download_15_.jpg',
          intensityReason: 'Paused Smith pressing with contraction finish.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause under control',
              description: 'Chest stays loaded.'
            },
            {
              icon: 'flash',
              title: 'Finish strong',
              description: 'Long squeeze at lockout.'
            },
            {
              icon: 'shield',
              title: 'Use safeties',
              description: 'Fatigue accumulates.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Smith & Push',
          duration: '15–18 min',
          description: 'Smith incline pressing paired with push-ups.',
          battlePlan: 'Instructions: Work top to bottom. Move quickly.\nSets: 4\n\n• Smith Incline Press — 4 × 8\n• Push-Ups — 4 × 15–20',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Smith Incline Press",
                    "reps": "8",
                    "sets": 4
                  },
                  {
                    "name": "Push-Ups",
                    "reps": "15–20",
                    "sets": 4
                  }
                ]
              }
            ],
            "instructions": "Work top to bottom. Move quickly."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240770/mood_app/workout_images/hag08c16_download_14_.jpg',
          intensityReason: 'Smith incline pressing paired with push-ups.',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Incline first',
              description: 'Upper chest priority.'
            },
            {
              icon: 'body',
              title: 'Chest leads both',
              description: 'Focus on engagement.'
            },
            {
              icon: 'alert-circle',
              title: 'Clear floor space',
              description: 'Fast transitions matter.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Smith Clusters',
          duration: '16–20 min',
          description: 'Heavy Smith clusters to sustain chest output.',
          battlePlan: 'Instructions: 5 sets of 4/4/4 — rest between sets. Short breaths.\nSets: 5\n\n• Smith Flat Press — 5 × (4 / 4 / 4)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Smith Flat Press",
                    "reps": "4/4/4",
                    "sets": 5
                  }
                ]
              }
            ],
            "instructions": "5 sets of 4/4/4 — rest between sets. Short breaths."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241319/mood_app/workout_images/wqpgrlpk_download_9_.jpg',
          intensityReason: 'Heavy Smith clusters to sustain chest output.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Precision under load',
              description: 'Rails demand discipline.'
            },
            {
              icon: 'refresh',
              title: 'Reset fully',
              description: 'Each cluster clean.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Output stays high under fatigue.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Heavy Smith',
          duration: '16–20 min',
          description: 'Heavy Smith pressing focused on chest strength.',
          battlePlan: 'Instructions: Work top to bottom. Challenging load.\nSets: 5\n\n• Smith Flat Press — 3 × 6\n• Smith Incline Press — 2 × 6',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Smith Flat Press",
                    "reps": "6",
                    "sets": 3
                  },
                  {
                    "name": "Smith Incline Press",
                    "reps": "6",
                    "sets": 2
                  }
                ]
              }
            ],
            "instructions": "Work top to bottom. Challenging load."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241315/mood_app/workout_images/pl1dkh7x_download_8_.jpg',
          intensityReason: 'Heavy Smith pressing focused on chest strength.',
          moodTips: [
            {
              icon: 'checkmark-done',
              title: 'Every rep deliberate',
              description: 'No rushed unracks.'
            },
            {
              icon: 'timer',
              title: 'Rest fully',
              description: 'Strength needs recovery.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Especially on final sets.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Smith Drop Cascade',
          duration: '15–20 min',
          description: 'Four-stage Smith drop set for deep chest fatigue.',
          battlePlan: 'Instructions: Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set. Strip plates immediately.\nSets: 3\n\n• Smith Press (Heavy) — max reps\n• Drop 1 (Medium) — max reps\n• Drop 2 (Light) — 12–15\n• Drop 3 (Very Light) — burnout',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Smith Press",
                    "note": "Drop 1 (Medium) — max reps; Drop 2 (Light) — 12–15; Drop 3 (Very Light) — burnout",
                    "reps": "max reps"
                  }
                ]
              }
            ],
            "instructions": "Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set. Strip plates immediately."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240758/mood_app/workout_images/4b771hh1_download_15_.jpg',
          intensityReason: 'Four-stage Smith drop set for deep chest fatigue.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Heavy earns fatigue',
              description: 'First stage hits failure.'
            },
            {
              icon: 'flash',
              title: 'No rest between drops',
              description: 'Weight moves fast.'
            },
            {
              icon: 'alert',
              title: 'Spotter required',
              description: 'This set pushes hard.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Smith & Explode',
          duration: '15–20 min',
          description: 'Heavy Smith pressing paired with plyometric push-ups.',
          battlePlan: 'Instructions: Work top to bottom. Fast transitions.\nSets: 4\n\n• Smith Flat Press — 4 × 6\n• Clap Push-Ups — 4 × 6–10',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Smith Flat Press",
                    "reps": "6",
                    "sets": 4
                  },
                  {
                    "name": "Clap Push-Ups",
                    "reps": "6–10",
                    "sets": 4
                  }
                ]
              }
            ],
            "instructions": "Work top to bottom. Fast transitions."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240770/mood_app/workout_images/hag08c16_download_14_.jpg',
          intensityReason: 'Heavy Smith pressing paired with plyometric push-ups.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Heavy then fast',
              description: 'Contrast preserves output.'
            },
            {
              icon: 'flash',
              title: 'Push-ups crisp',
              description: 'No sloppy reps.'
            },
            {
              icon: 'alert-circle',
              title: 'Clear space',
              description: 'Plyos demand room.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'mixed',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Chest press machine',
    icon: 'hardware-chip',
    workouts: {
      beginner: [
        {
          name: 'Machine Foundations',
          duration: '12–15 min',
          description: 'Chest press machine reps for controlled chest work.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest between sets.\nSets: 4\n\n• Chest Press Machine — 4 × 12',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Chest Press Machine",
                    "reps": "12",
                    "sets": 4
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241306/mood_app/workout_images/etmzu51q_download_3_.jpg',
          intensityReason: 'Chest press machine reps for controlled chest work.',
          moodTips: [
            {
              icon: 'construct',
              title: 'Seat height matters',
              description: 'Handles line up mid-chest.'
            },
            {
              icon: 'flash',
              title: 'Smooth squeeze',
              description: 'Control end range.'
            },
            {
              icon: 'checkmark-circle',
              title: 'No spotter needed',
              description: 'Machine provides safety.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Machine Control',
          duration: '12–16 min',
          description: 'Paused machine pressing for chest engagement.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 10 — rest between sets.\nSets: 4\n\n• Paused Chest Press — 4 × 10',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Paused Chest Press",
                    "reps": "10",
                    "sets": 4
                  }
                ]
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 10 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241305/mood_app/workout_images/67nyth7l_download_2_.jpg',
          intensityReason: 'Paused machine pressing for chest engagement.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause near full stretch',
              description: 'Chest stays loaded.'
            },
            {
              icon: 'lock-closed',
              title: 'No lockout rest',
              description: 'Keep tension.'
            },
            {
              icon: 'shield',
              title: 'Safe but focused',
              description: 'Machine allows intensity.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Slow Machine Press',
          duration: '12–15 min',
          description: 'Slow negatives on chest press machine.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 10 — rest between sets.\nSets: 3\n\n• Chest Press — 3 × 10 (4s eccentric)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Chest Press",
                    "note": "4s eccentric",
                    "reps": "10",
                    "sets": 3
                  }
                ]
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 10 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240764/mood_app/workout_images/baf95b3k_ChatGPT_Image_Feb_1_2026_09_39_15_PM.jpg',
          intensityReason: 'Slow negatives on chest press machine.',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Slow return',
              description: 'Machines reward control.'
            },
            {
              icon: 'volume-mute',
              title: 'No stack slam',
              description: 'Quiet reps only.'
            },
            {
              icon: 'body',
              title: 'Seat locked in',
              description: 'Stability first.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Machine Burn',
          duration: '10–14 min',
          description: 'High-rep machine pressing for chest endurance.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 15–20 — rest between sets.\nSets: 3\n\n• Chest Press — 3 × 15–20',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Chest Press",
                    "reps": "15–20",
                    "sets": 3
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 15–20 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240781/mood_app/workout_images/vrqnhbou_ChatGPT_Image_Feb_1_2026_09_36_59_PM.jpg',
          intensityReason: 'High-rep machine pressing for chest endurance.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Light and steady',
              description: 'Chase the pump.'
            },
            {
              icon: 'lock-closed',
              title: 'No lockout pause',
              description: 'Stay working.'
            },
            {
              icon: 'pulse',
              title: 'Breathe rhythmically',
              description: 'Steady breathing pattern.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'pump',
          intensity_cost: 2,
        }
      ],
      intermediate: [
        {
          name: 'Machine Clusters',
          duration: '14–18 min',
          description: 'Machine clusters to maintain pressing output.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 6/6/6 — rest between sets.\nSets: 4\n\n• Chest Press — 4 × (6 / 6 / 6)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Chest Press",
                    "reps": "6/6/6",
                    "sets": 4
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 6/6/6 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241306/mood_app/workout_images/etmzu51q_download_3_.jpg',
          intensityReason: 'Machine clusters to maintain pressing output.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Each rep smooth',
              description: 'Don\'t rush the handles.'
            },
            {
              icon: 'pulse',
              title: 'Short breaths only',
              description: 'Stay seated and braced.'
            },
            {
              icon: 'shield',
              title: 'Safe but demanding',
              description: 'Machine allows intensity.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Working Machine',
          duration: '14–18 min',
          description: 'Traditional machine pressing with meaningful load.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 10 — rest between sets.\nSets: 5\n\n• Chest Press — 5 × 10',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Chest Press",
                    "reps": "10",
                    "sets": 5
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 10 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241305/mood_app/workout_images/67nyth7l_download_2_.jpg',
          intensityReason: 'Traditional machine pressing with meaningful load.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Reps should work',
              description: 'Deep fatigue, clean reps.'
            },
            {
              icon: 'construct',
              title: 'Same seat height',
              description: 'Consistency matters.'
            },
            {
              icon: 'shield',
              title: 'Push hard safely',
              description: 'Machine provides safety.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Machine Holds',
          duration: '14–18 min',
          description: 'Paused machine pressing with contraction finish.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 8 — rest between sets.\nSets: 4\n\n• Paused Chest Press — 4 × 8\nFinal rep: 6–8s squeeze',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Paused Chest Press",
                    "note": "Final rep: 6–8s squeeze",
                    "reps": "8",
                    "sets": 4
                  }
                ]
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 8 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240764/mood_app/workout_images/baf95b3k_ChatGPT_Image_Feb_1_2026_09_39_15_PM.jpg',
          intensityReason: 'Paused machine pressing with contraction finish.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause deep',
              description: 'Stretch stays controlled.'
            },
            {
              icon: 'flash',
              title: 'Finish strong',
              description: 'Long squeeze at end range.'
            },
            {
              icon: 'shield',
              title: 'Safe to push hard',
              description: 'Machine provides support.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Press & Burn',
          duration: '15–18 min',
          description: 'Machine pressing paired with push-ups for volume.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\nSets: 4\n\n• Chest Press — 4 × 10\n• Push-Ups — 4 × 15–25',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Chest Press",
                    "reps": "10",
                    "sets": 4
                  },
                  {
                    "name": "Push-Ups",
                    "reps": "15–25",
                    "sets": 4
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240781/mood_app/workout_images/vrqnhbou_ChatGPT_Image_Feb_1_2026_09_36_59_PM.jpg',
          intensityReason: 'Machine pressing paired with push-ups for volume.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Machine then floor',
              description: 'Compound into bodyweight.'
            },
            {
              icon: 'body',
              title: 'Chest leads both',
              description: 'Focus on chest engagement.'
            },
            {
              icon: 'alert-circle',
              title: 'Clear floor space',
              description: 'Fast transitions matter.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'pump',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Machine Clusters',
          duration: '16–20 min',
          description: 'Heavy machine clusters to maximize chest output.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 5/5/5 — rest between sets.\nSets: 5\n\n• Chest Press — 5 × (5 / 5 / 5)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Chest Press",
                    "reps": "5/5/5",
                    "sets": 5
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 5/5/5 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241306/mood_app/workout_images/etmzu51q_download_3_.jpg',
          intensityReason: 'Heavy machine clusters to maximize chest output.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Controlled aggression',
              description: 'Drive hard, return slow.'
            },
            {
              icon: 'refresh',
              title: 'Reset posture',
              description: 'Each cluster fresh.'
            },
            {
              icon: 'shield',
              title: 'Push safely',
              description: 'Machine allows intensity.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Heavy Machine',
          duration: '16–20 min',
          description: 'Heavy machine pressing for chest strength focus.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 8 — rest between sets.\nSets: 5\n\n• Chest Press — 5 × 8',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Chest Press",
                    "reps": "8",
                    "sets": 5
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 8 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241305/mood_app/workout_images/67nyth7l_download_2_.jpg',
          intensityReason: 'Heavy machine pressing for chest strength focus.',
          moodTips: [
            {
              icon: 'checkmark-done',
              title: 'Every rep deliberate',
              description: 'No stack bounce.'
            },
            {
              icon: 'timer',
              title: 'Rest fully',
              description: 'Power still needs recovery.'
            },
            {
              icon: 'shield',
              title: 'Safe heavy work',
              description: 'Machine provides support.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Machine Drop Cascade',
          duration: '15–20 min',
          description: 'Four-stage machine drop set for chest overload.',
          battlePlan: 'Instructions: Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set.\nSets: 3\n\n• Chest Press (Heavy) — max reps\n• Drop 1 (Medium) — max reps\n• Drop 2 (Light) — 12–15\n• Drop 3 (Very Light) — burnout',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Chest Press",
                    "note": "Drop 1 (Medium) — max reps; Drop 2 (Light) — 12–15; Drop 3 (Very Light) — burnout",
                    "reps": "max reps"
                  }
                ]
              }
            ],
            "instructions": "Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240764/mood_app/workout_images/baf95b3k_ChatGPT_Image_Feb_1_2026_09_39_15_PM.jpg',
          intensityReason: 'Four-stage machine drop set for chest overload.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Heavy earns fatigue',
              description: 'Push to real failure.'
            },
            {
              icon: 'flash',
              title: 'No rest between drops',
              description: 'Pins move fast.'
            },
            {
              icon: 'shield',
              title: 'Safe to empty the tank',
              description: 'Machine provides safety.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Press & Explode',
          duration: '15–20 min',
          description: 'Heavy machine pressing paired with explosive push-ups.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\nSets: 4\n\n• Chest Press — 4 × 8\n• Clap Push-Ups — 4 × 6–10',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Chest Press",
                    "reps": "8",
                    "sets": 4
                  },
                  {
                    "name": "Clap Push-Ups",
                    "reps": "6–10",
                    "sets": 4
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240781/mood_app/workout_images/vrqnhbou_ChatGPT_Image_Feb_1_2026_09_36_59_PM.jpg',
          intensityReason: 'Heavy machine pressing paired with explosive push-ups.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Heavy then fast',
              description: 'Contrast sharpens output.'
            },
            {
              icon: 'flash',
              title: 'Push-ups stay crisp',
              description: 'Power without slop.'
            },
            {
              icon: 'alert-circle',
              title: 'Clear space',
              description: 'Plyos need room.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'horizontal_press',
          training_style: 'mixed',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Pec dec machine',
    icon: 'contract',
    workouts: {
      beginner: [
        {
          name: 'Fly Foundations',
          duration: '12–15 min',
          description: 'Pec deck flyes to build chest awareness.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest between sets.\nSets: 4\n\n• Pec Deck Fly — 4 × 12',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pec Deck Fly",
                    "reps": "12",
                    "sets": 4,
                    "tutorialSlug": "pec_deck_fly"
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241317/mood_app/workout_images/rf17lbcl_pmd2.jpg',
          intensityReason: 'Pec deck flyes to build chest awareness.',
          moodTips: [
            {
              icon: 'body',
              title: 'Move from the pec',
              description: 'Arms follow chest.'
            },
            {
              icon: 'flash',
              title: 'Smooth squeeze',
              description: 'Control the end range.'
            },
            {
              icon: 'checkmark-circle',
              title: 'No spotter needed',
              description: 'Machine provides safety.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Fly Control',
          duration: '12–16 min',
          description: 'Paused flyes to reinforce chest control.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 10 — rest between sets.\nSets: 4\n\n• Paused Pec Deck — 4 × 10',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Paused Pec Deck",
                    "reps": "10",
                    "sets": 4,
                    "tutorialSlug": "pec_deck_fly"
                  }
                ]
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 10 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241303/mood_app/workout_images/5hd3my3c_pdm.jpg',
          intensityReason: 'Paused flyes to reinforce chest control.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause in stretch',
              description: 'Let chest load fully.'
            },
            {
              icon: 'body',
              title: 'No shoulder drift',
              description: 'Stay tall.'
            },
            {
              icon: 'hand-left',
              title: 'Light weight preferred',
              description: 'Focus on feeling the stretch.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Slow Fly',
          duration: '12–15 min',
          description: 'Slow eccentrics on pec deck for chest tension.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 10 — rest between sets.\nSets: 3\n\n• Pec Deck Fly — 3 × 10 (4s eccentric)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pec Deck Fly",
                    "note": "4s eccentric",
                    "reps": "10",
                    "sets": 3,
                    "tutorialSlug": "pec_deck_fly"
                  }
                ]
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 10 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240768/mood_app/workout_images/gerfnpik_Screenshot_2026-02-01_at_10_26_17_PM.jpg',
          intensityReason: 'Slow eccentrics on pec deck for chest tension.',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Slow return',
              description: 'Stretch builds growth.'
            },
            {
              icon: 'body',
              title: 'Stay relaxed in neck',
              description: 'No tension creep.'
            },
            {
              icon: 'volume-mute',
              title: 'Quiet stack',
              description: 'Control throughout.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Fly Burn',
          duration: '10–14 min',
          description: 'High-rep pec deck flyes for chest endurance.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 15–25 — rest between sets.\nSets: 3\n\n• Pec Deck Fly — 3 × 15–25',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pec Deck Fly",
                    "reps": "15–25",
                    "sets": 3,
                    "tutorialSlug": "pec_deck_fly"
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 15–25 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240766/mood_app/workout_images/catnm0o6_download_8_.jpg',
          intensityReason: 'High-rep pec deck flyes for chest endurance.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Light and endless',
              description: 'Chase the pump.'
            },
            {
              icon: 'lock-closed',
              title: 'No resting closed',
              description: 'Keep tension.'
            },
            {
              icon: 'pulse',
              title: 'Breathe steadily',
              description: 'Rhythmic breathing.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'pump',
          intensity_cost: 2,
        }
      ],
      intermediate: [
        {
          name: 'Fly Clusters',
          duration: '14–18 min',
          description: 'Pec deck clusters to maintain chest tension.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 6/6/6 — rest between sets.\nSets: 4\n\n• Pec Deck Fly — 4 × (6 / 6 / 6)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pec Deck Fly",
                    "reps": "6/6/6",
                    "sets": 4,
                    "tutorialSlug": "pec_deck_fly"
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 6/6/6 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241317/mood_app/workout_images/rf17lbcl_pmd2.jpg',
          intensityReason: 'Pec deck clusters to maintain chest tension.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Each rep smooth',
              description: 'No jerking.'
            },
            {
              icon: 'pulse',
              title: 'Short breaths only',
              description: 'Stay focused.'
            },
            {
              icon: 'body',
              title: 'Control the stretch',
              description: 'Full range of motion.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Working Flyes',
          duration: '14–18 min',
          description: 'Traditional pec deck flyes with meaningful load.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 12 — rest between sets.\nSets: 5\n\n• Pec Deck Fly — 5 × 12',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pec Deck Fly",
                    "reps": "12",
                    "sets": 5,
                    "tutorialSlug": "pec_deck_fly"
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 12 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241303/mood_app/workout_images/5hd3my3c_pdm.jpg',
          intensityReason: 'Traditional pec deck flyes with meaningful load.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Reps should burn',
              description: 'Chest stays loaded.'
            },
            {
              icon: 'construct',
              title: 'Same seat height',
              description: 'Consistency matters.'
            },
            {
              icon: 'shield',
              title: 'Push safely',
              description: 'Machine provides support.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Fly Holds',
          duration: '14–18 min',
          description: 'Paused pec deck flyes with contraction finish.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 10 — rest between sets.\nSets: 4\n\n• Paused Pec Deck — 4 × 10\nFinal rep: 6–8s squeeze',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Paused Pec Deck",
                    "note": "Final rep: 6–8s squeeze",
                    "reps": "10",
                    "sets": 4,
                    "tutorialSlug": "pec_deck_fly"
                  }
                ]
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 10 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240768/mood_app/workout_images/gerfnpik_Screenshot_2026-02-01_at_10_26_17_PM.jpg',
          intensityReason: 'Paused pec deck flyes with contraction finish.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause open',
              description: 'Stretch under control.'
            },
            {
              icon: 'flash',
              title: 'Finish tight',
              description: 'Long squeeze.'
            },
            {
              icon: 'shield',
              title: 'Safe to push hard',
              description: 'Machine provides support.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Fly & Push',
          duration: '15–18 min',
          description: 'Pec deck flyes paired with push-ups.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\nSets: 4\n\n• Pec Deck Fly — 4 × 12\n• Push-Ups — 4 × 15–25',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Pec Deck Fly",
                    "reps": "12",
                    "sets": 4,
                    "tutorialSlug": "pec_deck_fly"
                  },
                  {
                    "name": "Push-Ups",
                    "reps": "15–25",
                    "sets": 4
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240766/mood_app/workout_images/catnm0o6_download_8_.jpg',
          intensityReason: 'Pec deck flyes paired with push-ups.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Isolate then press',
              description: 'Compound into bodyweight.'
            },
            {
              icon: 'body',
              title: 'Chest leads both',
              description: 'Focus on chest engagement.'
            },
            {
              icon: 'alert-circle',
              title: 'Quick transitions',
              description: 'Keep intensity high.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Fly Clusters',
          duration: '16–20 min',
          description: 'Heavy pec deck clusters for deep chest fatigue.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 5/5/5 — rest between sets.\nSets: 5\n\n• Pec Deck Fly — 5 × (5 / 5 / 5)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pec Deck Fly",
                    "reps": "5/5/5",
                    "sets": 5,
                    "tutorialSlug": "pec_deck_fly"
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 5/5/5 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241317/mood_app/workout_images/rf17lbcl_pmd2.jpg',
          intensityReason: 'Heavy pec deck clusters for deep chest fatigue.',
          moodTips: [
            {
              icon: 'body',
              title: 'Stretch stays controlled',
              description: 'No sudden releases.'
            },
            {
              icon: 'refresh',
              title: 'Reset posture',
              description: 'Each cluster fresh.'
            },
            {
              icon: 'shield',
              title: 'Push safely',
              description: 'Machine allows intensity.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Heavy Flyes',
          duration: '16–20 min',
          description: 'Heavy pec deck flyes for chest overload.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 10 — rest between sets.\nSets: 5\n\n• Pec Deck Fly — 5 × 10',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pec Deck Fly",
                    "reps": "10",
                    "sets": 5,
                    "tutorialSlug": "pec_deck_fly"
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 10 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241303/mood_app/workout_images/5hd3my3c_pdm.jpg',
          intensityReason: 'Heavy pec deck flyes for chest overload.',
          moodTips: [
            {
              icon: 'checkmark-done',
              title: 'Every rep deliberate',
              description: 'No momentum.'
            },
            {
              icon: 'body',
              title: 'No momentum',
              description: 'Chest does the work.'
            },
            {
              icon: 'shield',
              title: 'Safe heavy isolation',
              description: 'Machine provides support.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Fly Drop Cascade',
          duration: '15–20 min',
          description: 'Four-stage pec deck drop set for chest overload.',
          battlePlan: 'Instructions: Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set. Work top to bottom.\nSets: 3\n\n• Pec Deck (Heavy) — max reps\n• Drop 1 — max reps\n• Cascade drop 2 — 12–15\n• Drop 3 — burnout',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pec Deck",
                    "reps": "max reps",
                    "tutorialSlug": "pec_deck_fly"
                  },
                  {
                    "name": "Cascade drop 2",
                    "note": "Drop 1 — max reps; Drop 3 — burnout",
                    "reps": "12–15",
                    "tutorialSlug": "pec_deck_fly"
                  }
                ]
              }
            ],
            "instructions": "Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set. Work top to bottom."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240768/mood_app/workout_images/gerfnpik_Screenshot_2026-02-01_at_10_26_17_PM.jpg',
          intensityReason: 'Four-stage pec deck drop set for chest overload.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Heavy earns fatigue',
              description: 'Push to failure.'
            },
            {
              icon: 'flash',
              title: 'No rest between drops',
              description: 'Pins move fast.'
            },
            {
              icon: 'shield',
              title: 'Safe to empty tank',
              description: 'Machine provides safety.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Fly & Explode',
          duration: '15–20 min',
          description: 'Pec deck flyes paired with plyometric push-ups.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\nSets: 4\n\n• Pec Deck Fly — 4 × 10\n• Clap Push-Ups — 4 × 6–10',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Pec Deck Fly",
                    "reps": "10",
                    "sets": 4,
                    "tutorialSlug": "pec_deck_fly"
                  },
                  {
                    "name": "Clap Push-Ups",
                    "reps": "6–10",
                    "sets": 4
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240766/mood_app/workout_images/catnm0o6_download_8_.jpg',
          intensityReason: 'Pec deck flyes paired with plyometric push-ups.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Isolate then power',
              description: 'Contrast training.'
            },
            {
              icon: 'flash',
              title: 'Push-ups sharp',
              description: 'Quality over quantity.'
            },
            {
              icon: 'alert-circle',
              title: 'Clear space',
              description: 'Plyos need room.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'mixed',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Cable crossover',
    icon: 'git-merge',
    workouts: {
      beginner: [
        {
          name: 'Cable Foundations',
          duration: '12–15 min',
          description: 'Cable flyes to build chest tension and control.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest between sets. Moderate weight, clean reps.\nSets: 4\n\n• Mid Cable Fly — 4 × 12',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Mid Cable Fly",
                    "reps": "12",
                    "sets": 4,
                    "tutorialSlug": "cable_machine_fly"
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest between sets. Moderate weight, clean reps."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240774/mood_app/workout_images/qzdq0zi2_ChatGPT_Image_Feb_1_2026_09_31_56_PM.jpg',
          intensityReason: 'Cable flyes to build chest tension and control.',
          moodTips: [
            {
              icon: 'pulse',
              title: 'Constant tension',
              description: 'No slack at any point.'
            },
            {
              icon: 'body',
              title: 'Hug the midline',
              description: 'Hands finish together.'
            },
            {
              icon: 'checkmark-circle',
              title: 'No spotter needed',
              description: 'Cables are self-limiting.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Cable Control',
          duration: '12–16 min',
          description: 'Paused cable flyes for chest engagement.',
          battlePlan: 'Instructions: 4 sets of 10 — rest between sets. Pause 1s at peak.\nSets: 4\n\n• High-to-Low Cable Fly — 4 × 10',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "High-to-Low Cable Fly",
                    "reps": "10",
                    "sets": 4,
                    "tutorialSlug": "cable_fly_high_to_low"
                  }
                ]
              }
            ],
            "instructions": "4 sets of 10 — rest between sets. Pause 1s at peak."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240780/mood_app/workout_images/vlu2ckag_download_11_.jpg',
          intensityReason: 'Paused cable flyes for chest engagement.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause fully closed',
              description: 'Chest stays contracted.'
            },
            {
              icon: 'body',
              title: 'Stay square',
              description: 'No torso rotation.'
            },
            {
              icon: 'hand-left',
              title: 'Light weight preferred',
              description: 'Focus on the squeeze.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Slow Cables',
          duration: '12–15 min',
          description: 'Slow eccentrics on cables for chest tension.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 10 — rest between sets. 4s eccentric.\nSets: 3\n\n• Low-to-High Cable Fly — 3 × 10',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Low-to-High Cable Fly",
                    "reps": "10",
                    "sets": 3,
                    "tutorialSlug": "cable_fly_low_to_high"
                  }
                ]
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 10 — rest between sets. 4s eccentric."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240756/mood_app/workout_images/1jrl3snf_download_10_.jpg',
          intensityReason: 'Slow eccentrics on cables for chest tension.',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Slow open',
              description: 'Stretch builds growth.'
            },
            {
              icon: 'body',
              title: 'Arms move evenly',
              description: 'Symmetrical movement.'
            },
            {
              icon: 'volume-mute',
              title: 'Control the stacks',
              description: 'Quiet throughout.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Cable Burn',
          duration: '10–14 min',
          description: 'High-rep cable flyes for chest endurance.',
          battlePlan: 'Instructions: 3 sets of 15–25 — rest between sets. Light load.\nSets: 3\n\n• Mid Cable Fly — 3 × 15–25',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Mid Cable Fly",
                    "reps": "15–25",
                    "sets": 3,
                    "tutorialSlug": "cable_machine_fly"
                  }
                ]
              }
            ],
            "instructions": "3 sets of 15–25 — rest between sets. Light load."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240776/mood_app/workout_images/szkempjn_download_9_.jpg',
          intensityReason: 'High-rep cable flyes for chest endurance.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Light and continuous',
              description: 'No slack allowed.'
            },
            {
              icon: 'body',
              title: 'Shorter range ok late',
              description: 'Maintain tension.'
            },
            {
              icon: 'pulse',
              title: 'Breathe steady',
              description: 'Rhythmic breathing.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'pump',
          intensity_cost: 2,
        }
      ],
      intermediate: [
        {
          name: 'Cable Clusters',
          duration: '14–18 min',
          description: 'Cable clusters to maintain chest tension.',
          battlePlan: 'Instructions: 4 sets of 8/8/8 — rest between sets. 15s breaths.\nSets: 4\n\n• High-to-Low Cable Fly — 4 × (8 / 8 / 8)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "High-to-Low Cable Fly",
                    "reps": "8/8/8",
                    "sets": 4,
                    "tutorialSlug": "cable_fly_high_to_low"
                  }
                ]
              }
            ],
            "instructions": "4 sets of 8/8/8 — rest between sets. 15s breaths."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240774/mood_app/workout_images/qzdq0zi2_ChatGPT_Image_Feb_1_2026_09_31_56_PM.jpg',
          intensityReason: 'Cable clusters to maintain chest tension.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Each rep smooth',
              description: 'No jerking.'
            },
            {
              icon: 'pulse',
              title: 'Short breaths only',
              description: 'Stay focused.'
            },
            {
              icon: 'body',
              title: 'Control the stretch',
              description: 'Full range.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Working Cables',
          duration: '14–18 min',
          description: 'Traditional cable flyes with meaningful load.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom. Increase load only if reps stay clean.\nSets: 5\n\n• Mid Cable Fly — 3 × 12\n• Low-to-High Cable Fly — 2 × 12',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Mid Cable Fly",
                    "reps": "12",
                    "sets": 3,
                    "tutorialSlug": "cable_machine_fly"
                  },
                  {
                    "name": "Low-to-High Cable Fly",
                    "reps": "12",
                    "sets": 2,
                    "tutorialSlug": "cable_fly_low_to_high"
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom. Increase load only if reps stay clean."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240780/mood_app/workout_images/vlu2ckag_download_11_.jpg',
          intensityReason: 'Traditional cable flyes with meaningful load.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Reps should burn',
              description: 'Chest stays engaged.'
            },
            {
              icon: 'construct',
              title: 'Same pulley height',
              description: 'Consistency matters.'
            },
            {
              icon: 'shield',
              title: 'Push safely',
              description: 'Cables are forgiving.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Cable Holds',
          duration: '14–18 min',
          description: 'Paused cable flyes with contraction finish.',
          battlePlan: 'Instructions: Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 10 — rest between sets. Final rep 6–8s squeeze.\nSets: 4\n\n• High-to-Low Cable Fly — 4 × 10',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "High-to-Low Cable Fly",
                    "reps": "10",
                    "sets": 4,
                    "tutorialSlug": "cable_fly_high_to_low"
                  }
                ]
              }
            ],
            "instructions": "Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 10 — rest between sets. Final rep 6–8s squeeze."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240756/mood_app/workout_images/1jrl3snf_download_10_.jpg',
          intensityReason: 'Paused cable flyes with contraction finish.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause fully closed',
              description: 'Maximum contraction.'
            },
            {
              icon: 'flash',
              title: 'Finish tight',
              description: 'Long squeeze.'
            },
            {
              icon: 'shield',
              title: 'Safe to push',
              description: 'Cables allow intensity.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Cable & Push',
          duration: '15–18 min',
          description: 'Cable flyes paired with push-ups.',
          battlePlan: 'Instructions: Work top to bottom. Move quickly.\nSets: 4\n\n• Low-to-High Cable Fly — 4 × 12\n• Push-Ups — 4 × 15–25',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Low-to-High Cable Fly",
                    "reps": "12",
                    "sets": 4,
                    "tutorialSlug": "cable_fly_low_to_high"
                  },
                  {
                    "name": "Push-Ups",
                    "reps": "15–25",
                    "sets": 4
                  }
                ]
              }
            ],
            "instructions": "Work top to bottom. Move quickly."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240776/mood_app/workout_images/szkempjn_download_9_.jpg',
          intensityReason: 'Cable flyes paired with push-ups.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Fly then press',
              description: 'Compound into bodyweight.'
            },
            {
              icon: 'body',
              title: 'Chest leads both',
              description: 'Focus on chest.'
            },
            {
              icon: 'alert-circle',
              title: 'Fast transitions',
              description: 'Keep intensity high.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Cable Clusters',
          duration: '16–20 min',
          description: 'Heavy cable clusters for deep chest fatigue.',
          battlePlan: 'Instructions: 5 sets of 6/6/6 — rest between sets. Short breaths.\nSets: 5\n\n• Mid Cable Fly — 5 × (6 / 6 / 6)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Mid Cable Fly",
                    "reps": "6/6/6",
                    "sets": 5,
                    "tutorialSlug": "cable_machine_fly"
                  }
                ]
              }
            ],
            "instructions": "5 sets of 6/6/6 — rest between sets. Short breaths."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240774/mood_app/workout_images/qzdq0zi2_ChatGPT_Image_Feb_1_2026_09_31_56_PM.jpg',
          intensityReason: 'Heavy cable clusters for deep chest fatigue.',
          moodTips: [
            {
              icon: 'pulse',
              title: 'Constant tension',
              description: 'No slack ever.'
            },
            {
              icon: 'refresh',
              title: 'Reset posture',
              description: 'Each cluster fresh.'
            },
            {
              icon: 'shield',
              title: 'Push hard safely',
              description: 'Cables are forgiving.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Heavy Cables',
          duration: '16–20 min',
          description: 'Heavy cable flyes for chest overload.',
          battlePlan: 'Instructions: Work top to bottom. Challenging load.\nSets: 5\n\n• High-to-Low Cable Fly — 3 × 10\n• Low-to-High Cable Fly — 2 × 10',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "High-to-Low Cable Fly",
                    "reps": "10",
                    "sets": 3,
                    "tutorialSlug": "cable_fly_high_to_low"
                  },
                  {
                    "name": "Low-to-High Cable Fly",
                    "reps": "10",
                    "sets": 2,
                    "tutorialSlug": "cable_fly_low_to_high"
                  }
                ]
              }
            ],
            "instructions": "Work top to bottom. Challenging load."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240780/mood_app/workout_images/vlu2ckag_download_11_.jpg',
          intensityReason: 'Heavy cable flyes for chest overload.',
          moodTips: [
            {
              icon: 'checkmark-done',
              title: 'Every rep controlled',
              description: 'No momentum.'
            },
            {
              icon: 'pulse',
              title: 'No slack ever',
              description: 'Constant tension.'
            },
            {
              icon: 'shield',
              title: 'Safe heavy work',
              description: 'Cables provide control.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Cable Drop Cascade',
          duration: '15–20 min',
          description: 'Four-stage cable drop set for chest overload.',
          battlePlan: 'Instructions: Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set. Work top to bottom. Strip weight immediately.\nSets: 3\n\n• Cable Fly (Heavy) — max reps\n• Drop 1 — max reps\n• Cascade drop 2 — 12–15\n• Drop 3 — burnout',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Cable Fly",
                    "reps": "max reps",
                    "tutorialSlug": "cable_machine_fly"
                  },
                  {
                    "name": "Cascade drop 2",
                    "note": "Drop 1 — max reps; Drop 3 — burnout",
                    "reps": "12–15",
                    "tutorialSlug": "cable_machine_fly"
                  }
                ]
              }
            ],
            "instructions": "Hit the reps, strip weight immediately (no rest), and keep going — the drop IS the set. Work top to bottom. Strip weight immediately."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240756/mood_app/workout_images/1jrl3snf_download_10_.jpg',
          intensityReason: 'Four-stage cable drop set for chest overload.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Heavy earns fatigue',
              description: 'Push to failure.'
            },
            {
              icon: 'flash',
              title: 'No rest between drops',
              description: 'Pins move fast.'
            },
            {
              icon: 'shield',
              title: 'Safe to empty tank',
              description: 'Cables are forgiving.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Cable & Explode',
          duration: '15–20 min',
          description: 'Cable flyes paired with plyometric push-ups.',
          battlePlan: 'Instructions: Work top to bottom. Fast transitions.\nSets: 4\n\n• High-to-Low Cable Fly — 4 × 10\n• Clap Push-Ups — 4 × 6–10',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "High-to-Low Cable Fly",
                    "reps": "10",
                    "sets": 4,
                    "tutorialSlug": "cable_fly_high_to_low"
                  },
                  {
                    "name": "Clap Push-Ups",
                    "reps": "6–10",
                    "sets": 4
                  }
                ]
              }
            ],
            "instructions": "Work top to bottom. Fast transitions."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240776/mood_app/workout_images/szkempjn_download_9_.jpg',
          intensityReason: 'Cable flyes paired with plyometric push-ups.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Isolate then power',
              description: 'Contrast training.'
            },
            {
              icon: 'flash',
              title: 'Push-ups crisp',
              description: 'Quality over quantity.'
            },
            {
              icon: 'alert-circle',
              title: 'Clear space',
              description: 'Plyos need room.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'fly',
          training_style: 'mixed',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Dip station',
    icon: 'remove',
    workouts: {
      beginner: [
        {
          name: 'Dip Foundations',
          duration: '12–15 min',
          description: 'Chest-focused dips to build pressing confidence.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 6–10 — rest between sets.\nSets: 4\n\n• Assisted / Bodyweight Dips — 4 × 6–10',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Assisted / Bodyweight Dips",
                    "reps": "6–10",
                    "sets": 4,
                    "tutorialSlug": "assisted_dips"
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 6–10 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241318/mood_app/workout_images/sudzdwsx_download_3_.jpg',
          intensityReason: 'Chest-focused dips to build pressing confidence.',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Lean slightly forward',
              description: 'Chest stays involved.'
            },
            {
              icon: 'body',
              title: 'Smooth depth',
              description: 'No bouncing.'
            },
            {
              icon: 'shield',
              title: 'Use assistance freely',
              description: 'Build strength safely.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'dip',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Dip Control',
          duration: '12–16 min',
          description: 'Paused dips to reinforce chest engagement.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 6–8 — rest between sets.\nSets: 4\n\n• Paused Dips — 4 × 6–8',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Paused Dips",
                    "reps": "6–8",
                    "sets": 4,
                    "tutorialSlug": "dips"
                  }
                ]
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 6–8 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241309/mood_app/workout_images/i8tbsgyh_download_4_.jpg',
          intensityReason: 'Paused dips to reinforce chest engagement.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause at depth',
              description: 'Stretch stays controlled.'
            },
            {
              icon: 'trending-down',
              title: 'Chest stays forward',
              description: 'Maintain lean.'
            },
            {
              icon: 'shield',
              title: 'Assistance encouraged',
              description: 'Focus on form.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'dip',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Slow Dips',
          duration: '12–15 min',
          description: 'Slow eccentrics on dips for chest control.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 6 — rest between sets.\nSets: 3\n\n• Dips — 3 × 6 (4s eccentric)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Dips",
                    "note": "4s eccentric",
                    "reps": "6",
                    "sets": 3,
                    "tutorialSlug": "dips"
                  }
                ]
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 6 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240763/mood_app/workout_images/a1hm6idf_download_13_.jpg',
          intensityReason: 'Slow eccentrics on dips for chest control.',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Slow lower',
              description: 'Control the stretch.'
            },
            {
              icon: 'alert',
              title: 'No shoulder pain',
              description: 'Depth stops before strain.'
            },
            {
              icon: 'shield',
              title: 'Use assistance',
              description: 'Build control safely.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'dip',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Dip Burn',
          duration: '10–14 min',
          description: 'High-rep dips to build chest endurance.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 12–20 — rest between sets.\nSets: 3\n\n• Assisted Dips — 3 × 12–20',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Assisted Dips",
                    "reps": "12–20",
                    "sets": 3,
                    "tutorialSlug": "assisted_dips"
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 3 sets of 12–20 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240772/mood_app/workout_images/lccg7x1a_download_12_.jpg',
          intensityReason: 'High-rep dips to build chest endurance.',
          moodTips: [
            {
              icon: 'shield',
              title: 'Light assistance ok',
              description: 'Chase fatigue safely.'
            },
            {
              icon: 'repeat',
              title: 'Continuous reps',
              description: 'Keep moving.'
            },
            {
              icon: 'alert',
              title: 'Stop before form breaks',
              description: 'Quality over quantity.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'dip',
          training_style: 'pump',
          intensity_cost: 2,
        }
      ],
      intermediate: [
        {
          name: 'Dip Clusters',
          duration: '14–18 min',
          description: 'Dip clusters to maintain chest output.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 5/5/5 — rest between sets.\nSets: 4\n\n• Dips — 4 × (5 / 5 / 5)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Dips",
                    "reps": "5/5/5",
                    "sets": 4,
                    "tutorialSlug": "dips"
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 5/5/5 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241318/mood_app/workout_images/sudzdwsx_download_3_.jpg',
          intensityReason: 'Dip clusters to maintain chest output.',
          moodTips: [
            {
              icon: 'body',
              title: 'Each rep controlled',
              description: 'No kipping.'
            },
            {
              icon: 'pulse',
              title: 'Short breaths only',
              description: 'Stay focused.'
            },
            {
              icon: 'shield',
              title: 'Assistance allowed',
              description: 'If needed for quality.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'dip',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Working Dips',
          duration: '14–18 min',
          description: 'Traditional dips with meaningful volume.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 8–10 — rest between sets.\nSets: 5\n\n• Dips — 5 × 8–10',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Dips",
                    "reps": "8–10",
                    "sets": 5,
                    "tutorialSlug": "dips"
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 8–10 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241309/mood_app/workout_images/i8tbsgyh_download_4_.jpg',
          intensityReason: 'Traditional dips with meaningful volume.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Reps should work',
              description: 'Challenge yourself.'
            },
            {
              icon: 'trending-down',
              title: 'Chest-forward lean',
              description: 'Maintain form.'
            },
            {
              icon: 'shield',
              title: 'Add assistance if needed',
              description: 'Quality over ego.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'dip',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Dip Holds',
          duration: '14–18 min',
          description: 'Paused dips with contraction finish.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 6 — rest between sets.\nSets: 4\n\n• Paused Dips — 4 × 6\nFinal rep: 6–8s squeeze',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Paused Dips",
                    "note": "Final rep: 6–8s squeeze",
                    "reps": "6",
                    "sets": 4,
                    "tutorialSlug": "dips"
                  }
                ]
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 6 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240763/mood_app/workout_images/a1hm6idf_download_13_.jpg',
          intensityReason: 'Paused dips with contraction finish.',
          moodTips: [
            {
              icon: 'pause',
              title: 'Pause deep',
              description: 'Stretch under control.'
            },
            {
              icon: 'flash',
              title: 'Finish tall',
              description: 'Lockout squeeze.'
            },
            {
              icon: 'shield',
              title: 'Assistance encouraged',
              description: 'For quality reps.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'dip',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Dip & Push',
          duration: '15–18 min',
          description: 'Dips paired with push-ups for chest volume.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\nSets: 4\n\n• Dips — 4 × 8\n• Push-Ups — 4 × 15–25',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Dips",
                    "reps": "8",
                    "sets": 4,
                    "tutorialSlug": "dips"
                  },
                  {
                    "name": "Push-Ups",
                    "reps": "15–25",
                    "sets": 4
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240772/mood_app/workout_images/lccg7x1a_download_12_.jpg',
          intensityReason: 'Dips paired with push-ups for chest volume.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Compound then press',
              description: 'Stack the volume.'
            },
            {
              icon: 'body',
              title: 'Chest leads both',
              description: 'Focus on engagement.'
            },
            {
              icon: 'alert-circle',
              title: 'Clear space',
              description: 'Fast transitions.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'dip',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Dip Clusters',
          duration: '16–20 min',
          description: 'Heavy dip clusters for chest overload.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 4/4/4 — rest between sets.\nSets: 5\n\n• Weighted Dips — 5 × (4 / 4 / 4)',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Weighted Dips",
                    "reps": "4/4/4",
                    "sets": 5,
                    "tutorialSlug": "dips"
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 4/4/4 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241318/mood_app/workout_images/sudzdwsx_download_3_.jpg',
          intensityReason: 'Heavy dip clusters for chest overload.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Precision first',
              description: 'No sloppy reps.'
            },
            {
              icon: 'refresh',
              title: 'Reset between mini-sets',
              description: 'Each cluster fresh.'
            },
            {
              icon: 'shield',
              title: 'Add weight only if clean',
              description: 'Earn the load.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'dip',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Heavy Dips',
          duration: '16–20 min',
          description: 'Heavy dips focused on chest strength.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 6–8 — rest between sets.\nSets: 5\n\n• Weighted Dips — 5 × 6–8',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Weighted Dips",
                    "reps": "6–8",
                    "sets": 5,
                    "tutorialSlug": "dips"
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 5 sets of 6–8 — rest between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241309/mood_app/workout_images/i8tbsgyh_download_4_.jpg',
          intensityReason: 'Heavy dips focused on chest strength.',
          moodTips: [
            {
              icon: 'checkmark-done',
              title: 'Every rep deliberate',
              description: 'No rushing.'
            },
            {
              icon: 'trending-down',
              title: 'Chest-forward always',
              description: 'Maintain lean.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'For heavy sets.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'dip',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Dip Drop Cascade',
          duration: '15–20 min',
          description: 'Cascading dip drops for deep chest fatigue.',
          battlePlan: 'Instructions: Work top to bottom.\nSets: 3\n\n• Weighted Dips — max reps\n• Bodyweight Dips — max reps\n• Assisted Dips — burnout',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Weighted Dips",
                    "reps": "max reps",
                    "tutorialSlug": "dips"
                  },
                  {
                    "name": "Bodyweight Dips",
                    "reps": "max reps",
                    "tutorialSlug": "bench_dips"
                  },
                  {
                    "name": "Assisted Dips",
                    "reps": "burnout",
                    "tutorialSlug": "assisted_dips"
                  }
                ]
              }
            ],
            "instructions": "Work top to bottom."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240763/mood_app/workout_images/a1hm6idf_download_13_.jpg',
          intensityReason: 'Cascading dip drops for deep chest fatigue.',
          moodTips: [
            {
              icon: 'flame',
              title: 'Heavy earns fatigue',
              description: 'Push to failure.'
            },
            {
              icon: 'flash',
              title: 'Strip weight fast',
              description: 'Keep intensity high.'
            },
            {
              icon: 'shield',
              title: 'Assistance ready',
              description: 'For the burnout.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'dip',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Dip & Explode',
          duration: '15–20 min',
          description: 'Heavy dips paired with plyometric push-ups.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom.\nSets: 4\n\n• Weighted Dips — 4 × 6\n• Clap Push-Ups — 4 × 6–10',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "Weighted Dips",
                    "reps": "6",
                    "sets": 4,
                    "tutorialSlug": "dips"
                  },
                  {
                    "name": "Clap Push-Ups",
                    "reps": "6–10",
                    "sets": 4
                  }
                ]
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. Work top to bottom."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240772/mood_app/workout_images/lccg7x1a_download_12_.jpg',
          intensityReason: 'Heavy dips paired with plyometric push-ups.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Heavy then fast',
              description: 'Contrast training.'
            },
            {
              icon: 'flash',
              title: 'Push-ups crisp',
              description: 'Power without chaos.'
            },
            {
              icon: 'alert-circle',
              title: 'Clear space',
              description: 'Plyos need room.'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'dip',
          training_style: 'mixed',
          intensity_cost: 5,
        }
      ]
    }
  }
];
