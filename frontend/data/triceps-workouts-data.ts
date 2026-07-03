import { EquipmentWorkouts } from '../types/workout';

export const tricepsWorkoutDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Dumbbell',
    icon: 'barbell',
    workouts: {
      beginner: [
        {
          name: 'Seated DB Overhead Extension',
          duration: '12–14 min',
          description: 'Standard overhead extension workout emphasizing long-head triceps stretch.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 60s between sets.\nBattle Plan — Standard Sets\n• 4×12 Seated DB Overhead Extensions — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Seated DB Overhead Extensions",
                    "note": "standard reps",
                    "reps": "12",
                    "sets": 4
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240802/mood_app/workout_images/4553zhn5_db_overhead_sc.jpg',
          intensityReason: 'Overhead position maximizes long-head triceps stretch',
          moodTips: [
            {
              icon: 'body',
              title: 'Elbows point slightly in',
              description: 'Keeps tension on triceps'
            },
            {
              icon: 'trending-down',
              title: 'Lower slow and deep',
              description: 'Stretch drives activation'
            },
            {
              icon: 'flash',
              title: 'Lock out just before elbows stack',
              description: 'Peak extension creates the pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Lying DB Skullcrushers',
          duration: '12–14 min',
          description: 'Standard horizontal extension workout with stable positioning.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 60s between sets.\nBattle Plan — Standard Sets\n• 4×12 DB Skullcrushers — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "DB Skullcrushers",
                    "note": "standard reps",
                    "reps": "12",
                    "sets": 4,
                    "tutorialSlug": "db_skull_crusher"
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240804/mood_app/workout_images/4yj3bfg1_lying_db_sc.jpg',
          intensityReason: 'Horizontal position provides stable triceps isolation',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Lower DBs beside temples',
              description: 'Shoulder-friendly path'
            },
            {
              icon: 'body',
              title: 'Upper arms stay vertical',
              description: 'Prevents shoulder drift'
            },
            {
              icon: 'flash',
              title: 'Extend fully, squeeze hard',
              description: 'Shortened triceps pump best'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'skullcrusher',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'DB Kickback Builder',
          duration: '12–14 min',
          description: 'Beginner-only isolation workout emphasizing peak contraction.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 15 — rest 60s between sets.\nBattle Plan — Standard Sets\n• 4×15 DB Kickbacks — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "DB Kickbacks",
                    "note": "standard reps",
                    "reps": "15",
                    "sets": 4
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 15 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240814/mood_app/workout_images/lj8oy8ts_dumbell_kickback.jpg',
          intensityReason: 'Kickbacks emphasize peak triceps contraction',
          moodTips: [
            {
              icon: 'body',
              title: 'Upper arm stays fixed',
              description: 'Pure elbow extension'
            },
            {
              icon: 'trending-up',
              title: 'Extend back, not up',
              description: 'Keeps tension on triceps'
            },
            {
              icon: 'flash',
              title: 'Light weight, hard lockout',
              description: 'Kickbacks pump from contraction'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Paused Overhead DB Extension',
          duration: '14–16 min',
          description: 'Pause-rep overhead extension workout removing momentum.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 10 — rest 75s between sets.\nBattle Plan — Pause Sets\n• 4×10 Overhead DB Extensions — pause reps (1s bottom)\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Overhead DB Extensions",
                    "note": "pause reps (1s bottom)",
                    "reps": "10",
                    "sets": 4,
                    "tutorialSlug": "cable_overhead_tricep_extension"
                  }
                ],
                "label": "Pause Sets",
                "rest": "75s"
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 10 — rest 75s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241099/mood_app/workout_images/yyzj0dlo_download_1_.jpg',
          intensityReason: 'Pauses in the stretch emphasize long-head load',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause in the stretch',
              description: 'Long-head emphasis'
            },
            {
              icon: 'body',
              title: 'Core tight',
              description: 'Prevents rib flare'
            },
            {
              icon: 'flash',
              title: 'Drive to full extension',
              description: 'Stretch + lockout = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'DB Skullcrusher Burn Builder',
          duration: '15–17 min',
          description: 'Burnout-style skullcrusher workout extending time under tension.',
          battlePlan: 'Instructions: 4 sets of 15 — rest 75s between sets.\nBattle Plan — Burnout Sets\n• 4×15 Skullcrushers — burnout reps\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Skullcrushers",
                    "note": "burnout reps",
                    "reps": "15",
                    "sets": 4
                  }
                ],
                "label": "Burnout Sets",
                "rest": "75s"
              }
            ],
            "instructions": "4 sets of 15 — rest 75s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241082/mood_app/workout_images/5cjqt0fg_download.jpg',
          intensityReason: 'Extended reps build endurance and pump',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Smooth cadence',
              description: 'Protects elbows'
            },
            {
              icon: 'shield',
              title: 'No lockout rest',
              description: 'Continuous tension'
            },
            {
              icon: 'flash',
              title: 'Moderate load, nonstop reps',
              description: 'Burnout = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'skullcrusher',
          training_style: 'pump',
          intensity_cost: 4,
        },
        {
          name: 'Overhead Extension + Skullcrusher Contrast',
          duration: '15–17 min',
          description: 'Superset workout pairing long-head stretch with horizontal extension.',
          battlePlan: 'Instructions: Superset: the paired moves run back-to-back with zero rest — rest only after the pair. Work top to bottom — rest 90s between exercises.\nBattle Plan — Superset\n• 4×10 DB Overhead Extensions — standard reps\nsuperset with\n• 10 DB Skullcrushers\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "DB Overhead Extensions",
                    "note": "standard reps",
                    "reps": "10",
                    "sets": 4,
                    "tutorialSlug": "cable_overhead_tricep_extension"
                  },
                  {
                    "name": "DB Skullcrushers",
                    "note": "superset with",
                    "reps": "10",
                    "tutorialSlug": "db_skull_crusher"
                  }
                ],
                "label": "Superset",
                "rest": "90s"
              }
            ],
            "instructions": "Superset: the paired moves run back-to-back with zero rest — rest only after the pair. Work top to bottom — rest 90s between exercises."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240802/mood_app/workout_images/4553zhn5_db_overhead_sc.jpg',
          intensityReason: 'Two angles maximize triceps fiber recruitment',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Overhead work first',
              description: 'Loads long head fully'
            },
            {
              icon: 'fitness',
              title: 'Skullcrushers finish fibers',
              description: 'Cleaner elbow extension'
            },
            {
              icon: 'flash',
              title: 'Control both lockouts',
              description: 'Two contractions = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'skullcrusher',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy DB Overhead Extension',
          duration: '18–20 min',
          description: 'Standard heavy overhead extension workout for advanced loading.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 6 sets of 8 — rest 90s between sets.\nBattle Plan — Standard Sets\n• 6×8 DB Overhead Extensions — standard reps\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "DB Overhead Extensions",
                    "note": "standard reps",
                    "reps": "8",
                    "sets": 6,
                    "tutorialSlug": "cable_overhead_tricep_extension"
                  }
                ],
                "label": "Standard Sets",
                "rest": "90s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 6 sets of 8 — rest 90s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241099/mood_app/workout_images/yyzj0dlo_download_1_.jpg',
          intensityReason: 'Heavy loads with strict form build maximum strength',
          moodTips: [
            {
              icon: 'body',
              title: 'Elbows tight',
              description: 'Shoulder safety'
            },
            {
              icon: 'trending-down',
              title: 'Slow negatives',
              description: 'Triceps love eccentrics'
            },
            {
              icon: 'flash',
              title: 'Finish each rep fully extended',
              description: 'Lockout drives pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'DB Extension Drop Cluster',
          duration: '18–20 min',
          description: 'Multi-drop overhead extension workout driving mechanical fatigue.',
          battlePlan: 'Instructions: Drop cluster — hit the reps, then strip ~15–20% and keep going with no rest; every drop is part of the same set. 3 working sets.\nBattle Plan — Drop Cluster\n• DB Overhead Extension\n• Set 1: 10 reps\n• Set 2: drop set — 10 → drop ~20% → 8\n• Set 3: triple drop — 8 → drop ~15% → 6 → drop ~10% → 6\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "DB Overhead Extension",
                    "note": "Set 1: 10 reps; Set 2: drop set — 10 → drop ~20% → 8; Set 3: triple drop — 8 → drop ~15% → 6 → drop ~10% → 6"
                  }
                ],
                "label": "Drop Cluster",
                "rest": "90s"
              }
            ],
            "instructions": "Drop cluster — hit the reps, then strip ~15–20% and keep going with no rest; every drop is part of the same set. 3 working sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241082/mood_app/workout_images/5cjqt0fg_download.jpg',
          intensityReason: 'Drop clusters extend time under tension past failure',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drops are immediate',
              description: 'No standing around'
            },
            {
              icon: 'shield',
              title: 'Smaller drops preserve elbow health',
              description: 'Clean reps matter'
            },
            {
              icon: 'timer',
              title: 'End every mini-set locked out',
              description: 'Peak extension seals pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Skullcrusher Burnout Hold',
          duration: '18–20 min',
          description: 'Burnout + isometric skullcrusher workout emphasizing peak extension.',
          battlePlan: 'Instructions: The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 12 — rest 90s between sets.\nBattle Plan — Burnout + Isometric\n• 4×12 DB Skullcrushers — burnout reps\n• Final set, squeeze to finish, hold full elbow extension 12–15s\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "DB Skullcrushers",
                    "note": "burnout reps; Final set, squeeze to finish, hold full elbow extension 12–15s",
                    "reps": "12",
                    "sets": 4,
                    "tutorialSlug": "db_skull_crusher"
                  }
                ],
                "label": "Burnout + Isometric",
                "rest": "90s"
              }
            ],
            "instructions": "The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 12 — rest 90s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240801/mood_app/workout_images/18sc3txx_flat_db_sc.jpg',
          intensityReason: 'Burnout with iso hold completely exhausts triceps',
          moodTips: [
            {
              icon: 'body',
              title: 'Upper arms fixed',
              description: 'Isolation preserved'
            },
            {
              icon: 'flash',
              title: 'Flex aggressively',
              description: 'Neural drive matters'
            },
            {
              icon: 'fitness',
              title: 'Moderate load, long hold',
              description: 'Pump > ego'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'skullcrusher',
          training_style: 'pump',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Kettle bell',
    icon: 'diamond',
    workouts: {
      beginner: [
        {
          name: 'Seated KB Overhead Extension (90°)',
          duration: '12–14 min',
          description: 'Foundational overhead KB workout introducing long-head loading.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 60s between sets.\nBattle Plan — Standard Sets\n• 4×12 Seated KB Overhead Extensions — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Seated KB Overhead Extensions",
                    "note": "standard reps",
                    "reps": "12",
                    "sets": 4
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241093/mood_app/workout_images/oei647bg_download_5_.jpg',
          intensityReason: 'Seated position isolates triceps for clean overhead extension',
          moodTips: [
            {
              icon: 'body',
              title: 'Elbows slightly in',
              description: 'Shoulder-friendly'
            },
            {
              icon: 'trending-down',
              title: 'Lower slow and deep',
              description: 'Stretch matters'
            },
            {
              icon: 'flash',
              title: 'Lock out under control',
              description: 'KBs pump at extension'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Flat KB Floor Skullcrushers',
          duration: '12–14 min',
          description: 'Flat-angle triceps extension workout using floor support.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 60s between sets.\nBattle Plan — Standard Sets\n• 4×12 KB Floor Skullcrushers — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "KB Floor Skullcrushers",
                    "note": "standard reps",
                    "reps": "12",
                    "sets": 4
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240811/mood_app/workout_images/knclvtk4_Flat_kb_sc.jpg',
          intensityReason: 'Floor provides consistent depth control',
          moodTips: [
            {
              icon: 'body',
              title: 'Upper arms vertical',
              description: 'Prevents shoulder drift'
            },
            {
              icon: 'trending-down',
              title: 'Touch bells lightly to floor',
              description: 'Consistent depth'
            },
            {
              icon: 'flash',
              title: 'Extend fully each rep',
              description: 'Peak contraction = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'skullcrusher',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'KB Extension + Iso Finish (45°)',
          duration: '12–14 min',
          description: 'Inclined KB extension workout with squeeze-to-finish.',
          battlePlan: 'Instructions: The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 10 — rest 60s between sets.\nBattle Plan — Standard + Isometric Finish\n• 4×10 Incline KB Tricep Extensions — standard reps\n• Final set, squeeze to finish, hold lockout 10s\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Incline KB Tricep Extensions",
                    "note": "standard reps; Final set, squeeze to finish, hold lockout 10s",
                    "reps": "10",
                    "sets": 4
                  }
                ],
                "label": "Standard + Isometric Finish",
                "rest": "60s"
              }
            ],
            "instructions": "The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 10 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240805/mood_app/workout_images/8346vntm_oh_kb_sc.jpg',
          intensityReason: 'Incline angle with iso hold maximizes triceps contraction',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Crush handles lightly',
              description: 'Improves control'
            },
            {
              icon: 'body',
              title: 'Elbows fixed',
              description: 'Pure extension'
            },
            {
              icon: 'flash',
              title: 'Lighter bell for hold',
              description: 'Longer squeeze = better pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Paused KB Overhead Extensions (90°)',
          duration: '14–16 min',
          description: 'Pause-rep overhead KB workout removing momentum.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 10 — rest 75s between sets.\nBattle Plan — Pause Sets\n• 4×10 KB Overhead Extensions — pause reps (1s bottom)\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "KB Overhead Extensions",
                    "note": "pause reps (1s bottom)",
                    "reps": "10",
                    "sets": 4,
                    "tutorialSlug": "cable_overhead_tricep_extension"
                  }
                ],
                "label": "Pause Sets",
                "rest": "75s"
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 10 — rest 75s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240805/mood_app/workout_images/8346vntm_oh_kb_sc.jpg',
          intensityReason: 'Pauses in the stretch maximize long-head load',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause in the stretch',
              description: 'Long-head bias'
            },
            {
              icon: 'body',
              title: 'Brace core',
              description: 'Prevents rib flare'
            },
            {
              icon: 'flash',
              title: 'Drive to full extension',
              description: 'Stretch + lockout = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Incline KB Skullcrushers (45°)',
          duration: '15–17 min',
          description: 'Angle-shifted skullcrusher workout altering resistance curve.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 75s between sets.\nBattle Plan — Standard Sets\n• 4×12 Incline KB Skullcrushers — standard reps\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Incline KB Skullcrushers",
                    "note": "standard reps",
                    "reps": "12",
                    "sets": 4
                  }
                ],
                "label": "Standard Sets",
                "rest": "75s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 75s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240815/mood_app/workout_images/pyyiholy_incline_kb_sc.jpg',
          intensityReason: 'Incline angle changes resistance curve for varied stimulus',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Lower bells just outside temples',
              description: 'Shoulder safety'
            },
            {
              icon: 'refresh',
              title: 'Smooth cadence',
              description: 'Elbow-friendly'
            },
            {
              icon: 'flash',
              title: 'Finish each rep locked out',
              description: 'End-range pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'skullcrusher',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'KB Burn Builder (Flat)',
          duration: '15–17 min',
          description: 'Burnout-style flat KB workout extending time under tension.',
          battlePlan: 'Instructions: 4 sets of 15 — rest 75s between sets.\nBattle Plan — Burnout Sets\n• 4×15 KB Floor Extensions — burnout reps\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "KB Floor Extensions",
                    "note": "burnout reps",
                    "reps": "15",
                    "sets": 4
                  }
                ],
                "label": "Burnout Sets",
                "rest": "75s"
              }
            ],
            "instructions": "4 sets of 15 — rest 75s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241097/mood_app/workout_images/uwwxoov7_download_4_.jpg',
          intensityReason: 'Extended reps build endurance and pump',
          moodTips: [
            {
              icon: 'shield',
              title: 'No lockout rest',
              description: 'Constant tension'
            },
            {
              icon: 'fitness',
              title: 'Moderate bell',
              description: 'Fatigue not form failure'
            },
            {
              icon: 'flash',
              title: 'Nonstop reps',
              description: 'Burnout = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy KB Overhead Extension (90°)',
          duration: '18–20 min',
          description: 'Heavy overhead KB workout emphasizing strict extension.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 6 sets of 8 — rest 90s between sets.\nBattle Plan — Standard Sets\n• 6×8 KB Overhead Extensions — standard reps\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "KB Overhead Extensions",
                    "note": "standard reps",
                    "reps": "8",
                    "sets": 6,
                    "tutorialSlug": "cable_overhead_tricep_extension"
                  }
                ],
                "label": "Standard Sets",
                "rest": "90s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 6 sets of 8 — rest 90s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241093/mood_app/workout_images/oei647bg_download_5_.jpg',
          intensityReason: 'Heavy loads with strict form build maximum strength',
          moodTips: [
            {
              icon: 'body',
              title: 'Elbows tight',
              description: 'Shoulder safety'
            },
            {
              icon: 'trending-down',
              title: 'Slow negatives',
              description: 'Triceps respond well'
            },
            {
              icon: 'flash',
              title: 'Finish reps fully extended',
              description: 'Lockout matters'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'KB Extension Drop Cluster (45°)',
          duration: '18–20 min',
          description: 'Multi-drop incline KB workout driving mechanical fatigue.',
          battlePlan: 'Instructions: Drop cluster — hit the reps, then strip ~15–20% and keep going with no rest; every drop is part of the same set. 3 working sets.\nBattle Plan — Drop Cluster\n• KB Overhead Extension (45°)\n• Set 1: 10 reps\n• Set 2: drop — 10 → lighter bell → 8\n• Set 3: triple drop — 8 → lighter → 6 → lighter → 6\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "KB Overhead Extension",
                    "note": "Set 1: 10 reps; Set 2: drop — 10 → lighter bell → 8; Set 3: triple drop — 8 → lighter → 6 → lighter → 6"
                  }
                ],
                "label": "Drop Cluster",
                "rest": "90s"
              }
            ],
            "instructions": "Drop cluster — hit the reps, then strip ~15–20% and keep going with no rest; every drop is part of the same set. 3 working sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240805/mood_app/workout_images/8346vntm_oh_kb_sc.jpg',
          intensityReason: 'KB drops extend time under tension past failure',
          moodTips: [
            {
              icon: 'flash',
              title: 'Bell changes immediate',
              description: 'Stay set'
            },
            {
              icon: 'shield',
              title: 'Smaller jumps protect elbows',
              description: 'Clean reps'
            },
            {
              icon: 'timer',
              title: 'End sets locked out',
              description: 'Contraction seals pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'KB Burnout Hold (Flat)',
          duration: '18–20 min',
          description: 'Burnout + isometric KB workout emphasizing peak extension.',
          battlePlan: 'Instructions: The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 12 — rest 90s between sets.\nBattle Plan — Burnout + Isometric\n• 4×12 KB Extensions — burnout reps\n• Final set, squeeze to finish, hold full extension 12–15s\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "KB Extensions",
                    "note": "burnout reps; Final set, squeeze to finish, hold full extension 12–15s",
                    "reps": "12",
                    "sets": 4
                  }
                ],
                "label": "Burnout + Isometric",
                "rest": "90s"
              }
            ],
            "instructions": "The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 12 — rest 90s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240811/mood_app/workout_images/knclvtk4_Flat_kb_sc.jpg',
          intensityReason: 'Burnout with iso hold completely exhausts triceps',
          moodTips: [
            {
              icon: 'flash',
              title: 'Flex aggressively',
              description: 'Neural drive matters'
            },
            {
              icon: 'fitness',
              title: 'Stabilize bells',
              description: 'Offset load increases fatigue'
            },
            {
              icon: 'timer',
              title: 'Lighter bell, longer hold',
              description: 'Pump > ego'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'mixed',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'EZ bar',
    icon: 'remove',
    workouts: {
      beginner: [
        {
          name: 'EZ Skullcrusher Builder',
          duration: '12–14 min',
          description: 'Standard EZ-bar skullcrusher workout for joint-friendly loading.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 60s between sets.\nBattle Plan — Standard Sets\n• 4×12 EZ Skullcrushers — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "EZ Skullcrushers",
                    "note": "standard reps",
                    "reps": "12",
                    "sets": 4,
                    "tutorialSlug": "ez_bar_skull_crusher"
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 60s between sets."
          },
          imageUrl: 'https://customer-assets.emergentagent.com/job_1e4509cd-7b58-4b0c-b78f-c8a74434260e/artifacts/4hcxd7ex_ez%20bar%20sc%202.avif',
          intensityReason: 'EZ bar angle reduces wrist strain for comfortable loading',
          moodTips: [
            {
              icon: 'trending-down',
              title: 'Lower bar behind forehead',
              description: 'Shoulder-friendly'
            },
            {
              icon: 'body',
              title: 'Upper arms fixed',
              description: 'Prevents cheating'
            },
            {
              icon: 'flash',
              title: 'Extend fully each rep',
              description: 'Lockout fuels pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'skullcrusher',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Close-Grip EZ Press',
          duration: '12–14 min',
          description: 'Standard compound triceps press using elbow-dominant grip.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 10 — rest 60s between sets.\nBattle Plan — Standard Sets\n• 4×10 Close-Grip EZ Press — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Close-Grip EZ Press",
                    "note": "standard reps",
                    "reps": "10",
                    "sets": 4,
                    "tutorialSlug": "close_grip_bench_press"
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 10 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240567/mood_app/workout_images/5hyynoy0_cg_ez_bar_press.jpg',
          intensityReason: 'Close grip transfers load to triceps for compound pressing',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Grip inside shoulder width',
              description: 'Triceps bias'
            },
            {
              icon: 'body',
              title: 'Elbows track in',
              description: 'Joint safety'
            },
            {
              icon: 'flash',
              title: 'Press to full extension',
              description: 'Compound lockout pumps hard'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'close_grip_press',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'EZ Extension + Iso Finish',
          duration: '12–14 min',
          description: 'Standard EZ extension workout with squeeze-to-finish.',
          battlePlan: 'Instructions: The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 10 — rest 60s between sets.\nBattle Plan — Standard + Isometric Finish\n• 4×10 EZ Extensions — standard reps\n• Final set, squeeze to finish, hold lockout 10s\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "EZ Extensions",
                    "note": "standard reps; Final set, squeeze to finish, hold lockout 10s",
                    "reps": "10",
                    "sets": 4
                  }
                ],
                "label": "Standard + Isometric Finish",
                "rest": "60s"
              }
            ],
            "instructions": "The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 10 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240585/mood_app/workout_images/sbl2u1ih_ez_bar_sc.jpg',
          intensityReason: 'Isometric finish maximizes triceps contraction',
          moodTips: [
            {
              icon: 'flash',
              title: 'Flex triceps hard',
              description: 'Neural drive'
            },
            {
              icon: 'shield',
              title: 'No elbow flare',
              description: 'Keeps load honest'
            },
            {
              icon: 'fitness',
              title: 'Use lighter bar for hold',
              description: 'Longer squeeze = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Paused EZ Skullcrushers',
          duration: '14–16 min',
          description: 'Pause-rep EZ skullcrusher workout removing momentum.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 10 — rest 75s between sets.\nBattle Plan — Pause Sets\n• 4×10 Skullcrushers — pause reps (1s bottom)\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Skullcrushers",
                    "note": "pause reps (1s bottom)",
                    "reps": "10",
                    "sets": 4
                  }
                ],
                "label": "Pause Sets",
                "rest": "75s"
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 10 — rest 75s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241095/mood_app/workout_images/pa8x192c_download_2_.jpg',
          intensityReason: 'Pauses in the stretch maximize long-head load',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause in the stretch',
              description: 'Long-head load'
            },
            {
              icon: 'body',
              title: 'Brace through torso',
              description: 'Stability matters'
            },
            {
              icon: 'flash',
              title: 'Drive to full extension',
              description: 'Stretch + squeeze = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'skullcrusher',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'EZ Burn Builder',
          duration: '15–17 min',
          description: 'Burnout-style EZ extension workout extending time under tension.',
          battlePlan: 'Instructions: 4 sets of 15 — rest 75s between sets.\nBattle Plan — Burnout Sets\n• 4×15 EZ Extensions — burnout reps\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "EZ Extensions",
                    "note": "burnout reps",
                    "reps": "15",
                    "sets": 4
                  }
                ],
                "label": "Burnout Sets",
                "rest": "75s"
              }
            ],
            "instructions": "4 sets of 15 — rest 75s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241096/mood_app/workout_images/ri9qkrqs_download_3_.jpg',
          intensityReason: 'Extended reps build endurance and pump',
          moodTips: [
            {
              icon: 'shield',
              title: 'No lockout rest',
              description: 'Constant tension'
            },
            {
              icon: 'refresh',
              title: 'Smooth cadence',
              description: 'Elbow friendly'
            },
            {
              icon: 'flash',
              title: 'Moderate weight, nonstop reps',
              description: 'Burnout = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'pump',
          intensity_cost: 4,
        },
        {
          name: 'Skullcrusher + Close-Grip Contrast',
          duration: '15–17 min',
          description: 'Superset workout pairing isolation and compound extension.',
          battlePlan: 'Instructions: Superset: the paired moves run back-to-back with zero rest — rest only after the pair. Work top to bottom — rest 90s between exercises.\nBattle Plan — Superset\n• 4×10 EZ Skullcrushers\nsuperset with\n• 8 Close-Grip EZ Press\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "superset",
                "movements": [
                  {
                    "name": "EZ Skullcrushers",
                    "reps": "10",
                    "sets": 4,
                    "tutorialSlug": "ez_bar_skull_crusher"
                  },
                  {
                    "name": "Close-Grip EZ Press",
                    "note": "superset with",
                    "reps": "8",
                    "tutorialSlug": "close_grip_bench_press"
                  }
                ],
                "label": "Superset",
                "rest": "90s"
              }
            ],
            "instructions": "Superset: the paired moves run back-to-back with zero rest — rest only after the pair. Work top to bottom — rest 90s between exercises."
          },
          imageUrl: 'https://customer-assets.emergentagent.com/job_1e4509cd-7b58-4b0c-b78f-c8a74434260e/artifacts/4hcxd7ex_ez%20bar%20sc%202.avif',
          intensityReason: 'Isolation + compound maximizes triceps fatigue',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Isolation first',
              description: 'Fatigue fibers'
            },
            {
              icon: 'fitness',
              title: 'Compound finishes strong',
              description: 'Load through lockout'
            },
            {
              icon: 'flash',
              title: 'Control both endings',
              description: 'Two contractions = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'skullcrusher',
          training_style: 'mixed',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy EZ Skullcrusher',
          duration: '18–20 min',
          description: 'Standard heavy EZ skullcrusher workout emphasizing strict form.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 6 sets of 8 — rest 90s between sets.\nBattle Plan — Standard Sets\n• 6×8 EZ Skullcrushers\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "EZ Skullcrushers",
                    "reps": "8",
                    "sets": 6,
                    "tutorialSlug": "ez_bar_skull_crusher"
                  }
                ],
                "label": "Standard Sets",
                "rest": "90s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 6 sets of 8 — rest 90s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240585/mood_app/workout_images/sbl2u1ih_ez_bar_sc.jpg',
          intensityReason: 'Heavy loads with strict form build maximum strength',
          moodTips: [
            {
              icon: 'shield',
              title: 'No ego loading',
              description: 'Elbow safety'
            },
            {
              icon: 'trending-down',
              title: 'Control negatives',
              description: 'Triceps respond well'
            },
            {
              icon: 'flash',
              title: 'Finish reps locked out',
              description: 'Peak extension matters'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'skullcrusher',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'EZ Extension Drop Cluster',
          duration: '18–20 min',
          description: 'Multi-drop EZ extension workout driving fatigue.',
          battlePlan: 'Instructions: Drop cluster — hit the reps, then strip ~15–20% and keep going with no rest; every drop is part of the same set. 3 working sets.\nBattle Plan — Drop Cluster\n• EZ-Bar Overhead Extension\n• Set 1: 10 reps\n• Set 2: drop — 10 → drop ~20% → 8\n• Set 3: triple drop — 8 → drop ~15% → 6 → drop ~10% → 6\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "EZ-Bar Overhead Extension",
                    "note": "Set 1: 10 reps; Set 2: drop — 10 → drop ~20% → 8; Set 3: triple drop — 8 → drop ~15% → 6 → drop ~10% → 6"
                  }
                ],
                "label": "Drop Cluster",
                "rest": "90s"
              }
            ],
            "instructions": "Drop cluster — hit the reps, then strip ~15–20% and keep going with no rest; every drop is part of the same set. 3 working sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240583/mood_app/workout_images/rqvfpdvu_ez_bar_sc_3.jpg',
          intensityReason: 'Drop clusters extend time under tension past failure',
          moodTips: [
            {
              icon: 'flash',
              title: 'Plate changes immediate',
              description: 'Stay on bench'
            },
            {
              icon: 'shield',
              title: 'Smaller drops protect elbows',
              description: 'Clean reps'
            },
            {
              icon: 'timer',
              title: 'End sets fully extended',
              description: 'Pump is in the lockout'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'EZ Burnout Hold',
          duration: '18–20 min',
          description: 'Burnout + isometric EZ extension workout.',
          battlePlan: 'Instructions: The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 12 — rest 90s between sets.\nBattle Plan — Burnout + Isometric\n• 4×12 EZ Extensions\n• Final set, squeeze to finish, hold lockout 12–15s\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "EZ Extensions",
                    "note": "Final set, squeeze to finish, hold lockout 12–15s",
                    "reps": "12",
                    "sets": 4
                  }
                ],
                "label": "Burnout + Isometric",
                "rest": "90s"
              }
            ],
            "instructions": "The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 12 — rest 90s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241095/mood_app/workout_images/pa8x192c_download_2_.jpg',
          intensityReason: 'Burnout with iso hold completely exhausts triceps',
          moodTips: [
            {
              icon: 'flash',
              title: 'Flex aggressively',
              description: 'Neural drive'
            },
            {
              icon: 'shield',
              title: 'No resting at top',
              description: 'Tension stays high'
            },
            {
              icon: 'fitness',
              title: 'Lighter bar, longer hold',
              description: 'Pump > ego'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'pump',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Single extension cable',
    icon: 'swap-vertical',
    workouts: {
      beginner: [
        {
          name: 'Overhead Rope Tricep Extension',
          duration: '12–14 min',
          description: 'Foundational overhead cable workout emphasizing long-head stretch.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 60s between sets.\nBattle Plan — Standard Sets\n• 4×12 Overhead Rope Extensions — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Overhead Rope Extensions",
                    "note": "standard reps",
                    "reps": "12",
                    "sets": 4
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240894/mood_app/workout_images/k3gdq2dy_download_1_.jpg',
          intensityReason: 'Overhead cable position maximizes long-head stretch',
          moodTips: [
            {
              icon: 'body',
              title: 'Elbows point slightly forward and stay fixed',
              description: 'Long head stays loaded'
            },
            {
              icon: 'hand-left',
              title: 'Allow rope to separate naturally',
              description: 'Increases end-range contraction'
            },
            {
              icon: 'flash',
              title: 'Lock out overhead deliberately',
              description: 'Shortened triceps pump fast'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Straight-Bar Cable Pushdowns',
          duration: '12–14 min',
          description: 'Standard cable pushdown workout introducing fixed-path elbow extension.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 60s between sets.\nBattle Plan — Standard Sets\n• 4×12 Straight-Bar Pushdowns — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Straight-Bar Pushdowns",
                    "note": "standard reps",
                    "reps": "12",
                    "sets": 4
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241091/mood_app/workout_images/lv1qz5u4_download.jpg',
          intensityReason: 'Straight bar teaches strict downward extension',
          moodTips: [
            {
              icon: 'body',
              title: 'Elbows pinned slightly in front of ribs',
              description: 'Prevents shoulder takeover'
            },
            {
              icon: 'trending-down',
              title: 'Press straight down, not forward',
              description: 'Keeps path clean'
            },
            {
              icon: 'flash',
              title: 'Finish each rep fully extended',
              description: 'Cable tension rewards lockout'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'pushdown',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Overhead Cable Extension + Iso Finish',
          duration: '12–14 min',
          description: 'Overhead cable workout with squeeze-to-finish at peak extension.',
          battlePlan: 'Instructions: The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 10 — rest 60s between sets.\nBattle Plan — Standard + Isometric Finish\n• 4×10 Overhead Cable Extensions (short bar) — standard reps\n• Final set, squeeze to finish, hold full extension overhead 10s\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Overhead Cable Extensions",
                    "note": "standard reps; Final set, squeeze to finish, hold full extension overhead 10s",
                    "reps": "10",
                    "sets": 4,
                    "tutorialSlug": "cable_overhead_tricep_extension"
                  }
                ],
                "label": "Standard + Isometric Finish",
                "rest": "60s"
              }
            ],
            "instructions": "The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 10 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240563/mood_app/workout_images/44n90zpn_OH_tri_ext.jpg',
          intensityReason: 'Isometric finish maximizes triceps contraction',
          moodTips: [
            {
              icon: 'flash',
              title: 'Flex triceps hard during hold',
              description: 'Neural drive matters'
            },
            {
              icon: 'hand-left',
              title: 'Wrists neutral',
              description: 'Elbow comfort'
            },
            {
              icon: 'fitness',
              title: 'Lighter pin for the hold',
              description: 'Longer squeeze = deeper pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Paused Overhead Rope Extensions',
          duration: '14–16 min',
          description: 'Pause-rep overhead cable workout removing momentum.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 10 — rest 75s between sets.\nBattle Plan — Pause Sets\n• 4×10 Overhead Rope Extensions — pause reps (1s in stretch)\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Overhead Rope Extensions",
                    "note": "pause reps (1s in stretch)",
                    "reps": "10",
                    "sets": 4
                  }
                ],
                "label": "Pause Sets",
                "rest": "75s"
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 10 — rest 75s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240894/mood_app/workout_images/k3gdq2dy_download_1_.jpg',
          intensityReason: 'Pauses in the stretch maximize long-head load',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause where elbows are bent',
              description: 'Long-head emphasis'
            },
            {
              icon: 'body',
              title: 'Core lightly braced',
              description: 'Prevents rib flare'
            },
            {
              icon: 'flash',
              title: 'Drive to full extension',
              description: 'Stretch + lockout = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'High-to-Low Rope Extensions',
          duration: '15–17 min',
          description: 'Angle-adjusted cable workout changing resistance through ROM.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 75s between sets.\nBattle Plan — Standard Sets\n• 4×12 High-to-Low Rope Extensions — standard reps\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "High-to-Low Rope Extensions",
                    "note": "standard reps",
                    "reps": "12",
                    "sets": 4
                  }
                ],
                "label": "Standard Sets",
                "rest": "75s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 75s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241089/mood_app/workout_images/lruescv6_download_1_.jpg',
          intensityReason: 'High pulley angle alters loading curve',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Start elbows high',
              description: 'Alters loading curve'
            },
            {
              icon: 'trending-down',
              title: 'Pull down and slightly out',
              description: 'Matches rope mechanics'
            },
            {
              icon: 'flash',
              title: 'Finish strong at lockout',
              description: 'End-range contraction drives pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'hypertrophy',
          intensity_cost: 4,
        },
        {
          name: 'Cable Burn Builder',
          duration: '15–17 min',
          description: 'Burnout-style cable workout maximizing time under tension.',
          battlePlan: 'Instructions: 4 sets of 15–20 — rest 75s between sets.\nBattle Plan — Burnout Sets\n• 4×15–20 Cable Extensions (straight bar) — burnout reps\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Cable Extensions",
                    "note": "burnout reps",
                    "reps": "15–20",
                    "sets": 4,
                    "tutorialSlug": "cable_overhead_tricep_extension"
                  }
                ],
                "label": "Burnout Sets",
                "rest": "75s"
              }
            ],
            "instructions": "4 sets of 15–20 — rest 75s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241091/mood_app/workout_images/lv1qz5u4_download.jpg',
          intensityReason: 'Cables provide constant tension for pump work',
          moodTips: [
            {
              icon: 'shield',
              title: 'No rest at the top',
              description: 'Continuous tension'
            },
            {
              icon: 'refresh',
              title: 'Smooth cadence',
              description: 'Elbow-friendly'
            },
            {
              icon: 'flash',
              title: 'Moderate load, nonstop reps',
              description: 'Cables shine for pump work'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'pump',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Overhead Cable Extension Builder',
          duration: '18–20 min',
          description: 'Heavy overhead cable workout emphasizing strict long-head loading.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 6 sets of 8 — rest 90s between sets.\nBattle Plan — Standard Sets\n• 6×8 Overhead Cable Extensions (short bar) — standard reps\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Overhead Cable Extensions",
                    "note": "standard reps",
                    "reps": "8",
                    "sets": 6,
                    "tutorialSlug": "cable_overhead_tricep_extension"
                  }
                ],
                "label": "Standard Sets",
                "rest": "90s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 6 sets of 8 — rest 90s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240894/mood_app/workout_images/k3gdq2dy_download_1_.jpg',
          intensityReason: 'Heavy loads with strict form build maximum strength',
          moodTips: [
            {
              icon: 'body',
              title: 'No torso lean',
              description: 'Load stays honest'
            },
            {
              icon: 'trending-down',
              title: 'Control negatives',
              description: 'Cable eccentrics hit hard'
            },
            {
              icon: 'flash',
              title: 'Finish every rep locked out overhead',
              description: 'Extension quality drives growth'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Overhead Cable Drop Cluster',
          duration: '18–20 min',
          description: 'Multi-drop overhead cable workout driving mechanical fatigue.',
          battlePlan: 'Instructions: Drop cluster — hit the reps, then strip ~15–20% and keep going with no rest; every drop is part of the same set. 3 working sets.\nBattle Plan — Drop Cluster\n• Overhead Cable Extension\n• Set 1: 10 reps\n• Set 2: drop — 10 → drop ~20% → 8\n• Set 3: triple drop — 8 → drop ~15% → 6 → drop ~10% → 6\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Overhead Cable Extension",
                    "note": "Set 1: 10 reps; Set 2: drop — 10 → drop ~20% → 8; Set 3: triple drop — 8 → drop ~15% → 6 → drop ~10% → 6"
                  }
                ],
                "label": "Drop Cluster",
                "rest": "90s"
              }
            ],
            "instructions": "Drop cluster — hit the reps, then strip ~15–20% and keep going with no rest; every drop is part of the same set. 3 working sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240563/mood_app/workout_images/44n90zpn_OH_tri_ext.jpg',
          intensityReason: 'Cable drops extend time under tension past failure',
          moodTips: [
            {
              icon: 'flash',
              title: 'Pin changes immediate',
              description: 'Stay under the cable'
            },
            {
              icon: 'shield',
              title: 'Smaller drops protect elbows',
              description: 'Clean reps matter'
            },
            {
              icon: 'timer',
              title: 'End each mini-set fully extended',
              description: 'Lockout seals the pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Rope Pushdown Burnout Hold',
          duration: '18–20 min',
          description: 'Burnout + isometric cable workout finishing in a shortened position.',
          battlePlan: 'Instructions: The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 12 — rest 90s between sets.\nBattle Plan — Burnout + Isometric\n• 4×12 Rope Pushdowns — burnout reps\n• Final set, squeeze to finish, hold full extension 12–15s\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Rope Pushdowns",
                    "note": "burnout reps; Final set, squeeze to finish, hold full extension 12–15s",
                    "reps": "12",
                    "sets": 4,
                    "tutorialSlug": "cable_rope_tricep_pushdown"
                  }
                ],
                "label": "Burnout + Isometric",
                "rest": "90s"
              }
            ],
            "instructions": "The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 12 — rest 90s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241091/mood_app/workout_images/lv1qz5u4_download.jpg',
          intensityReason: 'Burnout with iso hold completely exhausts triceps',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Split rope and flex hard',
              description: 'Peak contraction'
            },
            {
              icon: 'shield',
              title: 'No resting on stack',
              description: 'Tension stays high'
            },
            {
              icon: 'fitness',
              title: 'Lighter pin, longer hold',
              description: 'Pump > ego'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'pushdown',
          training_style: 'pump',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Cable crossover machine',
    icon: 'reorder-three',
    workouts: {
      beginner: [
        {
          name: 'Rope Pushdown',
          duration: '10–12 min',
          description: 'Rope attachment builds triceps with simple tension',
          battlePlan: 'Instructions: 3 sets of 10–12 — rest 60–75s between sets, take all of it.\n3 sets\n• 10–12 Rope Pushdowns\nRest 60–75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Rope Pushdowns",
                    "reps": "10–12",
                    "tutorialSlug": "cable_rope_tricep_pushdown"
                  }
                ],
                "rounds": 3,
                "rest": "60–75s"
              }
            ],
            "instructions": "3 sets of 10–12 — rest 60–75s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241088/mood_app/workout_images/kn9gulrn_download_2_.jpg',
          intensityReason: 'Pushdowns teach elbow lockout form safely with traditional movements.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Spread rope ends apart at bottom lockout',
              description: 'Keep elbows locked by torso, no flaring.'
            },
            {
              icon: 'body',
              title: 'Step forward, lean slightly for rope clearance',
              description: 'Keep elbows fixed toward ceiling, extend fully.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'pushdown',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Overhead Rope Ext',
          duration: '10–12 min',
          description: 'Cable overhead isolates stretch for stronger arms',
          battlePlan: 'Instructions: 3 sets of 10–12 — rest 75s between sets, take all of it.\n3 sets\n• 10–12 Overhead Rope Extensions\nRest 75s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Overhead Rope Extensions",
                    "reps": "10–12"
                  }
                ],
                "rounds": 3,
                "rest": "75s"
              }
            ],
            "instructions": "3 sets of 10–12 — rest 75s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240894/mood_app/workout_images/k3gdq2dy_download_1_.jpg',
          intensityReason: 'Overhead cable path increases long head tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Step forward, lean slightly for rope clearance',
              description: 'Keep elbows fixed toward ceiling, extend fully.'
            },
            {
              icon: 'fitness',
              title: 'Brace forward lean to prevent back strain',
              description: 'Full body tension supports arm position.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Overhead Bar Ext',
          duration: '12–14 min',
          description: 'Straight bar hits triceps with longer stretch angle',
          battlePlan: 'Instructions: 4 sets of 8–10 — rest 75–90s between sets, take all of it.\n4 sets\n• 8–10 Overhead Bar Extensions\nRest 75–90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Overhead Bar Extensions",
                    "reps": "8–10"
                  }
                ],
                "rounds": 4,
                "rest": "75–90s"
              }
            ],
            "instructions": "4 sets of 8–10 — rest 75–90s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240887/mood_app/workout_images/fo2f287e_download_21_.jpg',
          intensityReason: 'Bar overhead creates continuous long head stress',
          moodTips: [
            {
              icon: 'body',
              title: 'Position hands shoulder width on bar',
              description: 'Brace forward lean to prevent back strain.'
            },
            {
              icon: 'trending-up',
              title: 'Extend quickly, return rope over 3s',
              description: 'Keep constant rope tension, no slack.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'mixed',
          intensity_cost: 4,
        },
        {
          name: 'Negative Rope Ext',
          duration: '12–14 min',
          description: 'Slow eccentric rope reps increase hypertrophy load',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 8 — rest 75–90s between sets, take all of it.\n3 sets\n• 8 Rope Overhead Extensions (3s eccentric)\nRest 75–90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Rope Overhead Extensions",
                    "reps": "8",
                    "tutorialSlug": "cable_overhead_tricep_extension"
                  }
                ],
                "rounds": 3,
                "rest": "75–90s"
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. 3 sets of 8 — rest 75–90s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240880/mood_app/workout_images/d111pjm2_download_2_.jpg',
          intensityReason: 'Three second lowers extend constant cable time',
          moodTips: [
            {
              icon: 'timer',
              title: 'Extend quickly, return rope over 3s',
              description: 'Keep constant rope tension, no slack.'
            },
            {
              icon: 'fitness',
              title: 'Keep constant rope tension, no slack',
              description: 'Stable elbow position ensures tricep isolation.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'pushdown',
          training_style: 'strength',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Rope + Bar Combo',
          duration: '14–16 min',
          description: 'Superset strategy hits triceps with extra volume',
          battlePlan: 'Instructions: Superset: the paired moves run back-to-back with zero rest — rest only after the pair. 4 rounds — all 2 moves in order, then rest 90s.\n4 rounds\n• 8 Rope Overhead Extensions\n• 8 Bar Overhead Extensions\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Rope Overhead Extensions",
                    "reps": "8",
                    "tutorialSlug": "cable_overhead_tricep_extension"
                  },
                  {
                    "name": "Bar Overhead Extensions",
                    "reps": "8"
                  }
                ],
                "rounds": 4,
                "rest": "90s"
              }
            ],
            "instructions": "Superset: the paired moves run back-to-back with zero rest — rest only after the pair. 4 rounds — all 2 moves in order, then rest 90s."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241088/mood_app/workout_images/kn9gulrn_download_2_.jpg',
          intensityReason: 'Two grips build variety across pushdown fibers',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Rope fully flared, bar strict and straight',
              description: 'Minimal rest between switches.'
            },
            {
              icon: 'fitness',
              title: 'Focus on form as fatigue builds',
              description: 'Each angle hits triceps differently.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'pushdown',
          training_style: 'mixed',
          intensity_cost: 5,
        },
        {
          name: 'Overhead 21s',
          duration: '16–18 min',
          description: 'Overhead 21 style burns fibers through completion',
          battlePlan: 'Instructions: 21s: 7 reps in the bottom half, 7 in the top half, then 7 full reps — no rest inside the 21. 3 rounds — all 3 moves in order, then rest 90s.\n3 rounds\n• 7 Bottom Half Reps\n• 7 Top Half Reps\n• 7 Full Range Reps\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "circuit",
                "movements": [
                  {
                    "name": "Bottom Half Reps",
                    "reps": "7"
                  },
                  {
                    "name": "Top Half Reps",
                    "reps": "7"
                  },
                  {
                    "name": "Full Range Reps",
                    "reps": "7"
                  }
                ],
                "rounds": 3,
                "rest": "90s"
              }
            ],
            "instructions": "21s: 7 reps in the bottom half, 7 in the top half, then 7 full reps — no rest inside the 21. 3 rounds — all 3 moves in order, then rest 90s."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240572/mood_app/workout_images/b4577jzi_cable_oh_ext.jpg',
          intensityReason: 'Seven seven seven partials overload triceps range',
          moodTips: [
            {
              icon: 'timer',
              title: 'Control half reps, don\'t rush transitions',
              description: 'Keep elbows high, upper arms locked in.'
            },
            {
              icon: 'trending-up',
              title: 'Keep elbows high, upper arms locked in',
              description: 'Control movement through each range.'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'mixed',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Tricep pushdown machine',
    icon: 'fitness',
    workouts: {
      beginner: [
        {
          name: 'Pushdown Builder',
          duration: '12–14 min',
          description: 'Standard pushdown workout building foundational triceps strength using a fixed handle.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 60s between sets.\nBattle Plan — Standard Sets\n• 4×12 Tricep Pushdowns — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Tricep Pushdowns",
                    "note": "standard reps",
                    "reps": "12",
                    "sets": 4,
                    "tutorialSlug": "cable_rope_tricep_pushdown"
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241086/mood_app/workout_images/ccill0t9_download_3_.jpg',
          intensityReason: 'Fixed path helps build strict elbow extension form',
          moodTips: [
            {
              icon: 'body',
              title: 'Elbows stay pinned slightly in front of ribs',
              description: 'Keeps long head loaded, not shoulders'
            },
            {
              icon: 'trending-down',
              title: 'Push straight down and slightly out',
              description: 'Matches machine path and improves extension'
            },
            {
              icon: 'flash',
              title: 'Lock out under control',
              description: 'Peak triceps contraction happens just before joints stack'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'pushdown',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Tempo Pushdown Control',
          duration: '12–14 min',
          description: 'Eccentric-focused pushdown workout emphasizing control on a fixed path.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. 4 sets of 10 — rest 60s between sets.\nBattle Plan — Eccentric Sets\n• 4×10 Pushdowns — eccentric reps (3s return)\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pushdowns",
                    "note": "eccentric reps (3s return)",
                    "reps": "10",
                    "sets": 4,
                    "tutorialSlug": "cable_rope_tricep_pushdown"
                  }
                ],
                "label": "Eccentric Sets",
                "rest": "60s"
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. 4 sets of 10 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241098/mood_app/workout_images/yfoavc6k_download_2_.jpg',
          intensityReason: 'Slow eccentrics maximize triceps time under tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Slow return, smooth press',
              description: 'Tension stays on triceps'
            },
            {
              icon: 'body',
              title: 'Elbows never drift',
              description: 'Static grip rewards precision'
            },
            {
              icon: 'flash',
              title: 'Fully extend every rep',
              description: 'Shortened triceps = better pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'pushdown',
          training_style: 'strength',
          intensity_cost: 3,
        },
        {
          name: 'Pushdown + Iso Finish',
          duration: '12–14 min',
          description: 'Standard pushdown workout with squeeze-to-finish at peak elbow extension.',
          battlePlan: 'Instructions: The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 10 — rest 60s between sets.\nBattle Plan — Standard + Isometric Finish\n• 4×10 Pushdowns — standard reps\n• Final set, squeeze to finish, hold full extension 10s\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pushdowns",
                    "note": "standard reps; Final set, squeeze to finish, hold full extension 10s",
                    "reps": "10",
                    "sets": 4,
                    "tutorialSlug": "cable_rope_tricep_pushdown"
                  }
                ],
                "label": "Standard + Isometric Finish",
                "rest": "60s"
              }
            ],
            "instructions": "The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 10 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240568/mood_app/workout_images/7nj0ytab_tricep_push_down.jpg',
          intensityReason: 'Isometric finish maximizes triceps contraction',
          moodTips: [
            {
              icon: 'flash',
              title: 'Flex triceps hard during hold',
              description: 'Neural drive matters'
            },
            {
              icon: 'hand-left',
              title: 'Wrists neutral, shoulders quiet',
              description: 'Fixed handle means elbows do the work'
            },
            {
              icon: 'fitness',
              title: 'Use lighter pin for the hold',
              description: 'Longer contraction = deeper pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'pushdown',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Paused Pushdowns',
          duration: '14–16 min',
          description: 'Pause-rep pushdown workout removing momentum on a fixed track.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 10 — rest 75s between sets.\nBattle Plan — Pause Sets\n• 4×10 Pushdowns — pause reps (1s at full extension)\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pushdowns",
                    "note": "pause reps (1s at full extension)",
                    "reps": "10",
                    "sets": 4,
                    "tutorialSlug": "cable_rope_tricep_pushdown"
                  }
                ],
                "label": "Pause Sets",
                "rest": "75s"
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 10 — rest 75s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241098/mood_app/workout_images/yfoavc6k_download_2_.jpg',
          intensityReason: 'Pauses eliminate rebound for pure elbow extension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause kills rebound',
              description: 'Pure elbow extension'
            },
            {
              icon: 'body',
              title: 'Brace lightly through torso',
              description: 'Prevents shoulder compensation'
            },
            {
              icon: 'flash',
              title: 'Pause at full lockout',
              description: 'Shortened triceps pump hardest'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'pushdown',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Pushdown Burn Builder',
          duration: '15–17 min',
          description: 'Burnout-style pushdown workout extending time under tension.',
          battlePlan: 'Instructions: 4 sets of 15–20 — rest 75s between sets.\nBattle Plan — Burnout Sets\n• 4×15–20 Pushdowns — burnout reps\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pushdowns",
                    "note": "burnout reps",
                    "reps": "15–20",
                    "sets": 4,
                    "tutorialSlug": "cable_rope_tricep_pushdown"
                  }
                ],
                "label": "Burnout Sets",
                "rest": "75s"
              }
            ],
            "instructions": "4 sets of 15–20 — rest 75s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241086/mood_app/workout_images/ccill0t9_download_3_.jpg',
          intensityReason: 'Extended reps build endurance and pump',
          moodTips: [
            {
              icon: 'shield',
              title: 'No resting at the top',
              description: 'Continuous tension'
            },
            {
              icon: 'refresh',
              title: 'Smooth, repeatable cadence',
              description: 'Keeps elbows healthy'
            },
            {
              icon: 'flash',
              title: 'Moderate load, nonstop reps',
              description: 'Burnout = pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'pushdown',
          training_style: 'pump',
          intensity_cost: 4,
        },
        {
          name: 'Density Pushdowns',
          duration: '15–17 min',
          description: 'High-density pushdown workout with shortened rest.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 6 sets of 10 — rest 45–60s between sets.\nBattle Plan — Standard Sets\n• 6×10 Pushdowns — standard reps\nRest 45–60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pushdowns",
                    "note": "standard reps",
                    "reps": "10",
                    "sets": 6,
                    "tutorialSlug": "cable_rope_tricep_pushdown"
                  }
                ],
                "label": "Standard Sets",
                "rest": "45–60s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 6 sets of 10 — rest 45–60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240568/mood_app/workout_images/7nj0ytab_tricep_push_down.jpg',
          intensityReason: 'Short rest forces efficiency and stacks fatigue',
          moodTips: [
            {
              icon: 'timer',
              title: 'Short rest forces efficiency',
              description: 'Fatigue stacks quickly'
            },
            {
              icon: 'body',
              title: 'Elbows stay fixed even when tired',
              description: 'Prevents form breakdown'
            },
            {
              icon: 'flash',
              title: 'Finish reps clean',
              description: 'Lockout quality drives pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'pushdown',
          training_style: 'strength',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Heavy Pushdown Builder',
          duration: '18–20 min',
          description: 'Standard heavy pushdown workout emphasizing strict elbow control.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 6 sets of 8 — rest 90s between sets.\nBattle Plan — Standard Sets\n• 6×8 Pushdowns — standard reps\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pushdowns",
                    "note": "standard reps",
                    "reps": "8",
                    "sets": 6,
                    "tutorialSlug": "cable_rope_tricep_pushdown"
                  }
                ],
                "label": "Standard Sets",
                "rest": "90s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 6 sets of 8 — rest 90s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241086/mood_app/workout_images/ccill0t9_download_3_.jpg',
          intensityReason: 'Heavy loads with strict form build maximum strength',
          moodTips: [
            {
              icon: 'body',
              title: 'No torso lean',
              description: 'Load stays honest'
            },
            {
              icon: 'trending-down',
              title: 'Control negatives',
              description: 'Triceps love eccentrics'
            },
            {
              icon: 'flash',
              title: 'Finish every rep deliberately',
              description: 'Extension, not momentum'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'pushdown',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Pushdown Drop Cluster',
          duration: '18–20 min',
          description: 'Multi-drop pushdown workout driving mechanical fatigue on a fixed handle.',
          battlePlan: 'Instructions: Drop cluster — hit the reps, then strip ~15–20% and keep going with no rest; every drop is part of the same set. 3 working sets.\nBattle Plan — Drop Cluster\n• Triceps Pushdown\n• Set 1: 10 reps\n• Set 2: drop set — 10 → drop ~20% → 8\n• Set 3: triple drop — 8 → drop ~15% → 6 → drop ~10% → 6\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Triceps Pushdown",
                    "note": "Set 1: 10 reps; Set 2: drop set — 10 → drop ~20% → 8; Set 3: triple drop — 8 → drop ~15% → 6 → drop ~10% → 6"
                  }
                ],
                "label": "Drop Cluster",
                "rest": "90s"
              }
            ],
            "instructions": "Drop cluster — hit the reps, then strip ~15–20% and keep going with no rest; every drop is part of the same set. 3 working sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240568/mood_app/workout_images/7nj0ytab_tricep_push_down.jpg',
          intensityReason: 'Drop clusters extend time under tension past failure',
          moodTips: [
            {
              icon: 'flash',
              title: 'Pin changes are immediate',
              description: 'Stay locked into position'
            },
            {
              icon: 'shield',
              title: 'Smaller drops preserve form',
              description: 'Fixed path punishes slop'
            },
            {
              icon: 'timer',
              title: 'End each mini-set fully extended',
              description: 'Peak contraction seals the pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'pushdown',
          training_style: 'strength',
          intensity_cost: 5,
        },
        {
          name: 'Pushdown Burnout Hold',
          duration: '18–20 min',
          description: 'Burnout + isometric pushdown workout for maximal triceps fatigue.',
          battlePlan: 'Instructions: The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 12 — rest 90s between sets.\nBattle Plan — Burnout + Isometric\n• 4×12 Pushdowns — burnout reps\n• Final set, squeeze to finish, hold full extension 12–15s\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Pushdowns",
                    "note": "burnout reps; Final set, squeeze to finish, hold full extension 12–15s",
                    "reps": "12",
                    "sets": 4,
                    "tutorialSlug": "cable_rope_tricep_pushdown"
                  }
                ],
                "label": "Burnout + Isometric",
                "rest": "90s"
              }
            ],
            "instructions": "The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 12 — rest 90s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241098/mood_app/workout_images/yfoavc6k_download_2_.jpg',
          intensityReason: 'Burnout with iso hold completely exhausts triceps',
          moodTips: [
            {
              icon: 'flash',
              title: 'Flex triceps aggressively',
              description: 'Neural drive matters'
            },
            {
              icon: 'shield',
              title: 'No resting on the stack',
              description: 'Tension stays high'
            },
            {
              icon: 'fitness',
              title: 'Lighter pin, longer hold',
              description: 'Pump > ego'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'pushdown',
          training_style: 'pump',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'Dip station / machine',
    icon: 'remove',
    workouts: {
      beginner: [
        {
          name: 'Assisted Dip Builder',
          duration: '12–14 min',
          description: 'Standard assisted dip workout emphasizing elbow extension.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 8–10 — rest 75s between sets.\nBattle Plan — Standard Sets\n• 4×8–10 Assisted Dips\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Assisted Dips",
                    "reps": "8–10",
                    "sets": 4,
                    "tutorialSlug": "assisted_dips"
                  }
                ],
                "label": "Standard Sets",
                "rest": "75s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 8–10 — rest 75s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240800/mood_app/workout_images/0i8kr3ow_assisted_dips.jpg',
          intensityReason: 'Assistance allows proper form development',
          moodTips: [
            {
              icon: 'body',
              title: 'Stay upright',
              description: 'Triceps over chest'
            },
            {
              icon: 'trending-up',
              title: 'Elbows track back',
              description: 'Shoulder safety'
            },
            {
              icon: 'flash',
              title: 'Lock out at the top',
              description: 'Bodyweight pump hits fast'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'dip',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Bench Dip Control',
          duration: '12–14 min',
          description: 'Regression-based dip workout for controlled loading.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 60s between sets.\nBattle Plan — Standard Sets\n• 4×12 Bench Dips\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Bench Dips",
                    "reps": "12",
                    "sets": 4,
                    "tutorialSlug": "bench_dips"
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240900/mood_app/workout_images/pkwqrz0u_bdips.jpg',
          intensityReason: 'Bench position provides controlled bodyweight loading',
          moodTips: [
            {
              icon: 'body',
              title: 'Shoulders down and back',
              description: 'Joint safety'
            },
            {
              icon: 'shield',
              title: 'Depth controlled',
              description: 'Avoids shoulder stress'
            },
            {
              icon: 'flash',
              title: 'Full extension every rep',
              description: 'Shortened triceps pump best'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'dip',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Dip + Iso Finish',
          duration: '12–14 min',
          description: 'Standard dip workout with squeeze-to-finish.',
          battlePlan: 'Instructions: The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 8 — rest 75s between sets.\nBattle Plan — Standard + Isometric Finish\n• 4×8 Dips\n• Final set, squeeze to finish, hold top support 10s\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Dips",
                    "note": "Final set, squeeze to finish, hold top support 10s",
                    "reps": "8",
                    "sets": 4,
                    "tutorialSlug": "dips"
                  }
                ],
                "label": "Standard + Isometric Finish",
                "rest": "75s"
              }
            ],
            "instructions": "The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 8 — rest 75s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241092/mood_app/workout_images/o9irqfer_download_4_.jpg',
          intensityReason: 'Isometric hold maximizes triceps contraction',
          moodTips: [
            {
              icon: 'flash',
              title: 'Arms fully straight',
              description: 'Peak contraction'
            },
            {
              icon: 'body',
              title: 'Shoulders stable',
              description: 'No shrugging'
            },
            {
              icon: 'timer',
              title: 'Hold tall, not relaxed',
              description: 'Isometric pump'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'dip',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Tempo Dips',
          duration: '14–16 min',
          description: 'Eccentric-focused dip workout increasing time under tension.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. 4 sets of 8 — rest 90s between sets.\nBattle Plan — Eccentric Sets\n• 4×8 Dips — 3s down\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Dips",
                    "note": "3s down",
                    "reps": "8",
                    "sets": 4,
                    "tutorialSlug": "dips"
                  }
                ],
                "label": "Eccentric Sets",
                "rest": "90s"
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. 4 sets of 8 — rest 90s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241083/mood_app/workout_images/74stkm4f_download_3_.jpg',
          intensityReason: 'Slow eccentrics maximize triceps loading',
          moodTips: [
            {
              icon: 'timer',
              title: 'Slow descent',
              description: 'Triceps load increases'
            },
            {
              icon: 'shield',
              title: 'No bounce at bottom',
              description: 'Joint safety'
            },
            {
              icon: 'flash',
              title: 'Drive to full extension',
              description: 'Lockout builds pump'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'dip',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Dip Burn Builder',
          duration: '15–17 min',
          description: 'Burnout-style dip workout extending fatigue.',
          battlePlan: 'Instructions: AMRAP: keep moving through the reps with clean form — rest only when form would break, and log your total. 4 sets of AMRAP — rest 75s between sets.\nBattle Plan — Burnout Sets\n• Dips — 4 × (AMRAP)\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Dips",
                    "reps": "AMRAP",
                    "sets": 4,
                    "tutorialSlug": "dips"
                  }
                ],
                "label": "Burnout Sets",
                "rest": "75s"
              }
            ],
            "instructions": "AMRAP: keep moving through the reps with clean form — rest only when form would break, and log your total. 4 sets of AMRAP — rest 75s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241092/mood_app/workout_images/o9irqfer_download_4_.jpg',
          intensityReason: 'Extended reps build endurance and pump',
          moodTips: [
            {
              icon: 'timer',
              title: 'Shorter rest each round',
              description: 'Fatigue stacks'
            },
            {
              icon: 'shield',
              title: 'Partial reps allowed late',
              description: 'Stay in tension'
            },
            {
              icon: 'flash',
              title: 'Top-range focus',
              description: 'Triceps stay shortened'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'dip',
          training_style: 'pump',
          intensity_cost: 4,
        },
        {
          name: 'Dip + Pushdown Contrast',
          duration: '15–17 min',
          description: 'Superset workout pairing bodyweight and machine isolation.',
          battlePlan: 'Instructions: Superset: the paired moves run back-to-back with zero rest — rest only after the pair. Work top to bottom — rest 90s between exercises.\nBattle Plan — Superset\n• 4×8 Dips\nsuperset with\n• 12 Pushdowns\nRest 90s',
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
                    "name": "Pushdowns",
                    "note": "superset with",
                    "reps": "12",
                    "tutorialSlug": "cable_rope_tricep_pushdown"
                  }
                ],
                "label": "Superset",
                "rest": "90s"
              }
            ],
            "instructions": "Superset: the paired moves run back-to-back with zero rest — rest only after the pair. Work top to bottom — rest 90s between exercises."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240809/mood_app/workout_images/d13967iu_reg_dips.jpg',
          intensityReason: 'Compound + isolation maximizes triceps fatigue',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Dips first',
              description: 'Compound load'
            },
            {
              icon: 'fitness',
              title: 'Pushdowns finish fibers',
              description: 'Isolation pump'
            },
            {
              icon: 'flash',
              title: 'Control both lockouts',
              description: 'Double contraction'
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
          name: 'Weighted Dip Builder',
          duration: '18–20 min',
          description: 'Standard weighted dip workout for advanced loading.',
          battlePlan: 'Instructions: 6 sets of 6 — rest 120s between sets.\nBattle Plan — Standard Sets\n• 6×6 Weighted Dips\nRest 120s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Weighted Dips",
                    "reps": "6",
                    "sets": 6,
                    "tutorialSlug": "dips"
                  }
                ],
                "label": "Standard Sets",
                "rest": "120s"
              }
            ],
            "instructions": "6 sets of 6 — rest 120s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240816/mood_app/workout_images/qfzwrr6j_weighted_dips.jpg',
          intensityReason: 'Added weight builds serious pressing strength',
          moodTips: [
            {
              icon: 'construct',
              title: 'Add weight conservatively',
              description: 'Elbow safety'
            },
            {
              icon: 'body',
              title: 'Stay upright',
              description: 'Triceps bias'
            },
            {
              icon: 'flash',
              title: 'Finish reps locked out',
              description: 'Bodyweight pump hits hard'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'dip',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'Dip Drop Ladder',
          duration: '18–20 min',
          description: 'Bodyweight drop workout using assistance changes.',
          battlePlan: 'Instructions: AMRAP: keep moving through the reps with clean form — rest only when form would break, and log your total. 3 sets of 6 — rest 120s between sets, take all of it.\nBattle Plan — Drop Ladder\n• 3 sets:\n• Dip — 6 weighted → bodyweight AMRAP → assisted AMRAP\nRest 120s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Dip",
                    "reps": "6"
                  }
                ],
                "rounds": 3,
                "label": "Drop Ladder",
                "rest": "120s"
              }
            ],
            "instructions": "AMRAP: keep moving through the reps with clean form — rest only when form would break, and log your total. 3 sets of 6 — rest 120s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241083/mood_app/workout_images/74stkm4f_download_3_.jpg',
          intensityReason: 'Progressive drops extend set past failure',
          moodTips: [
            {
              icon: 'flash',
              title: 'Transitions immediate',
              description: 'Stay on bars'
            },
            {
              icon: 'shield',
              title: 'Clean reps first',
              description: 'Joint safety'
            },
            {
              icon: 'timer',
              title: 'Finish ladders locked out',
              description: 'Pump seals the set'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'dip',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'Dip Burnout Hold',
          duration: '18–20 min',
          description: 'Burnout + isometric dip workout.',
          battlePlan: 'Instructions: AMRAP: keep moving through the reps with clean form — rest only when form would break, and log your total. The hold is strict: locked position, squeezing hard, no drifting. 4 sets of AMRAP — rest 120s between sets.\nBattle Plan — Burnout + Isometric\n• Dips — 4 × (AMRAP)\n• Final set, squeeze to finish, hold top 15s\nRest 120s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "Dips",
                    "note": "Final set, squeeze to finish, hold top 15s",
                    "reps": "AMRAP",
                    "sets": 4,
                    "tutorialSlug": "dips"
                  }
                ],
                "label": "Burnout + Isometric",
                "rest": "120s"
              }
            ],
            "instructions": "AMRAP: keep moving through the reps with clean form — rest only when form would break, and log your total. The hold is strict: locked position, squeezing hard, no drifting. 4 sets of AMRAP — rest 120s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241092/mood_app/workout_images/o9irqfer_download_4_.jpg',
          intensityReason: 'Burnout with iso hold completely exhausts triceps',
          moodTips: [
            {
              icon: 'flash',
              title: 'Arms fully straight',
              description: 'Peak extension'
            },
            {
              icon: 'body',
              title: 'Shoulders quiet',
              description: 'Stability matters'
            },
            {
              icon: 'timer',
              title: 'Hold tall under fatigue',
              description: 'True contraction'
            }
          ],
          exercise_type: 'compound',
          movement_pattern: 'dip',
          training_style: 'pump',
          intensity_cost: 5,
        }
      ]
    }
  },
  {
    equipment: 'TRX bands',
    icon: 'link',
    workouts: {
      beginner: [
        {
          name: 'TRX Tricep Extension Builder',
          duration: '12–14 min',
          description: 'Standard TRX extension workout introducing bodyweight triceps loading.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 10 — rest 60s between sets.\nBattle Plan — Standard Sets\n• 4×10 TRX Tricep Extensions — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "TRX Tricep Extensions",
                    "note": "standard reps",
                    "reps": "10",
                    "sets": 4
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 10 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241084/mood_app/workout_images/8ci4ug40_trx_kneeling_tricep_extensions.jpg',
          intensityReason: 'Body angle controls resistance for progressive loading',
          moodTips: [
            {
              icon: 'body',
              title: 'Elbows stay high and fixed in space',
              description: 'Think "hinge at the elbows," not "push hands"'
            },
            {
              icon: 'trending-down',
              title: 'Lower your head forward between hands',
              description: 'Body moves, straps stay still'
            },
            {
              icon: 'flash',
              title: 'Choose an angle you can fully lock out',
              description: 'Clean extension creates the pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'Incline TRX Extensions',
          duration: '12–14 min',
          description: 'Regression-based TRX workout using a more upright body angle.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 60s between sets.\nBattle Plan — Standard Sets\n• 4×12 TRX Extensions (more upright) — standard reps\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "TRX Extensions",
                    "note": "standard reps",
                    "reps": "12",
                    "sets": 4
                  }
                ],
                "label": "Standard Sets",
                "rest": "60s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 4 sets of 12 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241087/mood_app/workout_images/e9mzj704_download_4_.jpg',
          intensityReason: 'Upright angle reduces load for form development',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Step closer to reduce load',
              description: 'Angle controls difficulty'
            },
            {
              icon: 'body',
              title: 'Body stays rigid like a plank',
              description: 'Prevents shoulder takeover'
            },
            {
              icon: 'flash',
              title: 'Lock out arms hard every rep',
              description: 'Shortened triceps pump fast'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'hypertrophy',
          intensity_cost: 3,
        },
        {
          name: 'TRX Extension + Iso Finish',
          duration: '12–14 min',
          description: 'Standard TRX workout with squeeze-to-finish at full elbow extension.',
          battlePlan: 'Instructions: The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 8 — rest 60s between sets.\nBattle Plan — Standard + Isometric Finish\n• 4×8 TRX Extensions — standard reps\n• Final set, squeeze to finish, hold arms fully straight 10s\nRest 60s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "TRX Extensions",
                    "note": "standard reps; Final set, squeeze to finish, hold arms fully straight 10s",
                    "reps": "8",
                    "sets": 4
                  }
                ],
                "label": "Standard + Isometric Finish",
                "rest": "60s"
              }
            ],
            "instructions": "The hold is strict: locked position, squeezing hard, no drifting. 4 sets of 8 — rest 60s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240565/mood_app/workout_images/4d87b909_trx_ext.jpg',
          intensityReason: 'Isometric finish maximizes triceps contraction',
          moodTips: [
            {
              icon: 'body',
              title: 'Brace core during the hold',
              description: 'Stability keeps load on triceps'
            },
            {
              icon: 'shield',
              title: 'Elbows don\'t drift outward',
              description: 'Shoulder motion = lost tension'
            },
            {
              icon: 'flash',
              title: 'Hold where arms are fully straight',
              description: 'That\'s peak contraction'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'mixed',
          intensity_cost: 3,
        }
      ],
      intermediate: [
        {
          name: 'Tempo TRX Extensions',
          duration: '14–16 min',
          description: 'Eccentric-focused TRX workout increasing time under tension.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. 4 sets of 8 — rest 75s between sets.\nBattle Plan — Eccentric Sets\n• 4×8 TRX Extensions — eccentric reps (4s lower)\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "TRX Extensions",
                    "note": "eccentric reps (4s lower)",
                    "reps": "8",
                    "sets": 4
                  }
                ],
                "label": "Eccentric Sets",
                "rest": "75s"
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. 4 sets of 8 — rest 75s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241087/mood_app/workout_images/e9mzj704_download_4_.jpg',
          intensityReason: 'Slow eccentrics maximize muscle fiber recruitment',
          moodTips: [
            {
              icon: 'timer',
              title: 'Lower body slowly as one unit',
              description: 'Arms don\'t move, body does'
            },
            {
              icon: 'body',
              title: 'Elbows bend under control',
              description: 'Keeps shoulders out'
            },
            {
              icon: 'flash',
              title: 'Extend hard at the top',
              description: 'Full lockout builds pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'Paused TRX Extensions',
          duration: '14–16 min',
          description: 'Pause-rep TRX workout eliminating momentum.',
          battlePlan: 'Instructions: Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 8 — rest 75s between sets.\nBattle Plan — Pause Sets\n• 4×8 TRX Extensions — pause reps (1s bottom)\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "TRX Extensions",
                    "note": "pause reps (1s bottom)",
                    "reps": "8",
                    "sets": 4
                  }
                ],
                "label": "Pause Sets",
                "rest": "75s"
              }
            ],
            "instructions": "Own the lowering — count the seconds down, then move normally on the way up. Dead-stop pause — kill all momentum at the pause point before finishing the rep. 4 sets of 8 — rest 75s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241084/mood_app/workout_images/8ci4ug40_trx_kneeling_tricep_extensions.jpg',
          intensityReason: 'Pauses eliminate momentum for honest tension',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause with elbows bent, body frozen',
              description: 'Don\'t sink into shoulders'
            },
            {
              icon: 'trending-up',
              title: 'Press body away by straightening arms',
              description: 'Hands stay fixed'
            },
            {
              icon: 'flash',
              title: 'Pause + full lockout = pump',
              description: 'Stretch then contraction wins'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'strength',
          intensity_cost: 4,
        },
        {
          name: 'TRX Burn Builder',
          duration: '15–17 min',
          description: 'Burnout-style TRX workout extending fatigue through volume.',
          battlePlan: 'Instructions: AMRAP: keep moving through the reps with clean form — rest only when form would break, and log your total. 4 sets of AMRAP — rest 75s between sets.\nBattle Plan — Burnout Sets\n• TRX Extensions — 4 × (AMRAP)\nRest 75s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "TRX Extensions",
                    "reps": "AMRAP",
                    "sets": 4
                  }
                ],
                "label": "Burnout Sets",
                "rest": "75s"
              }
            ],
            "instructions": "AMRAP: keep moving through the reps with clean form — rest only when form would break, and log your total. 4 sets of AMRAP — rest 75s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240565/mood_app/workout_images/4d87b909_trx_ext.jpg',
          intensityReason: 'Extended reps build endurance and pump',
          moodTips: [
            {
              icon: 'timer',
              title: 'Shorten rest each round',
              description: 'Fatigue stacks fast'
            },
            {
              icon: 'shield',
              title: 'Partial reps allowed late',
              description: 'Stay in the tension zone'
            },
            {
              icon: 'flash',
              title: 'Top-range dominance',
              description: 'Triceps stay shortened and pumped'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'pump',
          intensity_cost: 4,
        }
      ],
      advanced: [
        {
          name: 'Decline TRX Extensions',
          duration: '18–20 min',
          description: 'Advanced TRX extension workout using feet elevation to increase load.',
          battlePlan: 'Instructions: Every rep at full intent — reset your stance between reps; speed beats load. 6 sets of 6 — rest 90s between sets.\nBattle Plan — Standard Sets\n• 6×6 TRX Extensions (feet elevated) — standard reps\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "TRX Extensions",
                    "note": "standard reps",
                    "reps": "6",
                    "sets": 6
                  }
                ],
                "label": "Standard Sets",
                "rest": "90s"
              }
            ],
            "instructions": "Every rep at full intent — reset your stance between reps; speed beats load. 6 sets of 6 — rest 90s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240566/mood_app/workout_images/4x3zx4pl_trx_ext_2.jpg',
          intensityReason: 'Feet elevation dramatically increases bodyweight load',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Steeper body angle = heavier load',
              description: 'Progress carefully'
            },
            {
              icon: 'body',
              title: 'Descend by bending elbows only',
              description: 'Shoulder movement is cheating'
            },
            {
              icon: 'flash',
              title: 'Lock out arms before feet touch down',
              description: 'Peak extension under fatigue drives pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'hypertrophy',
          intensity_cost: 5,
        },
        {
          name: 'TRX Extension Drop-Angle Ladder',
          duration: '18–20 min',
          description: 'Angle-based drop workout using body position instead of weight.',
          battlePlan: 'Instructions: AMRAP: keep moving through the reps with clean form — rest only when form would break, and log your total. 3 sets of 8 — rest 90s between sets, take all of it.\nBattle Plan — Drop Ladder\n• 3 sets:\n• TRX Extension — 8 reps (feet elevated) → step forward → 8 reps → step forward → AMRAP\nRest 90s',
          plan: {
            "format": "circuit",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "TRX Extension",
                    "reps": "8"
                  }
                ],
                "rounds": 3,
                "label": "Drop Ladder",
                "rest": "90s"
              }
            ],
            "instructions": "AMRAP: keep moving through the reps with clean form — rest only when form would break, and log your total. 3 sets of 8 — rest 90s between sets, take all of it."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241087/mood_app/workout_images/e9mzj704_download_4_.jpg',
          intensityReason: 'Angle changes extend set past failure without weight changes',
          moodTips: [
            {
              icon: 'flash',
              title: 'Angle changes are immediate',
              description: 'No standing around'
            },
            {
              icon: 'body',
              title: 'Maintain elbow height throughout',
              description: 'Keeps tension on triceps'
            },
            {
              icon: 'timer',
              title: 'Finish ladders fully extended',
              description: 'Contraction seals the pump'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'pump',
          intensity_cost: 5,
        },
        {
          name: 'TRX Burnout Hold',
          duration: '18–20 min',
          description: 'Burnout + isometric TRX workout for maximal triceps fatigue.',
          battlePlan: 'Instructions: AMRAP: keep moving through the reps with clean form — rest only when form would break, and log your total. The hold is strict: locked position, squeezing hard, no drifting. 4 sets of AMRAP — rest 90s between sets.\nBattle Plan — Burnout + Isometric\n• TRX Extensions — 4 × (AMRAP)\n• Final set, squeeze to finish, hold full extension 15s\nRest 90s',
          plan: {
            "format": "strength",
            "blocks": [
              {
                "type": "straight",
                "movements": [
                  {
                    "name": "TRX Extensions",
                    "note": "Final set, squeeze to finish, hold full extension 15s",
                    "reps": "AMRAP",
                    "sets": 4
                  }
                ],
                "label": "Burnout + Isometric",
                "rest": "90s"
              }
            ],
            "instructions": "AMRAP: keep moving through the reps with clean form — rest only when form would break, and log your total. The hold is strict: locked position, squeezing hard, no drifting. 4 sets of AMRAP — rest 90s between sets."
          },
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241084/mood_app/workout_images/8ci4ug40_trx_kneeling_tricep_extensions.jpg',
          intensityReason: 'Burnout with iso hold completely exhausts triceps',
          moodTips: [
            {
              icon: 'flash',
              title: 'Flex triceps hard during hold',
              description: 'Neural drive matters'
            },
            {
              icon: 'body',
              title: 'Body stays rigid',
              description: 'Prevents shoulder dump'
            },
            {
              icon: 'timer',
              title: 'Hold where arms are straight',
              description: 'True shortened position'
            }
          ],
          exercise_type: 'isolation',
          movement_pattern: 'overhead_extension',
          training_style: 'pump',
          intensity_cost: 5,
        }
      ]
    }
  }
];
