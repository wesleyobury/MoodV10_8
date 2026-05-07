import { EquipmentWorkouts } from '../types/workout';

// Complete cardio workout database with all 12 equipment types and MOOD tips
export const cardioWorkoutsDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Treadmill',
    icon: 'walk',
    workouts: {
      beginner: [
        {
          name: 'Walk & Jog Mixer',
          duration: '20 min',
          description: 'Walk-jog intervals alternating between\n3.5-5.2 mph for beginner endurance.\n ',
          battlePlan: '• 5 min walk (3.5 mph)\n• 3 min jog (5 mph)\n• 2 min walk (3 mph)\n• 4 min jog (5.2 mph)\n• 3 min walk (3.5 mph)\n• 3 min jog (5 mph)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240938/mood_app/workout_images/6512s28r_download.jpg',
          intensityReason: 'Perfect beginner introduction with walk-jog intervals.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'body',
              title: 'Posture & Form',
              description: 'Stay tall, no rail-holding; land mid-foot to protect knees.'
            },
            {
              icon: 'refresh',
              title: 'Breathing Pattern',
              description: 'Breathe rhythmically: 3 steps inhale, 2 steps exhale.'
            }
          ]
        },
        {
          name: 'Rolling Hills',
          duration: '20 min',
          description: 'Incline walking progression from 3% to 6%\ngrade for building leg strength safely.\n ',
          battlePlan: '• 3 min walk (3.5 mph)\n• 4 min incline walk (3.8 mph, 4% incline)\n• 2 min walk (3.5 mph)\n• 5 min incline walk (4 mph, 6% incline)\n• 3 min walk (3.5 mph)\n• 3 min incline walk (3.8 mph, 3% incline)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240958/mood_app/workout_images/urpigixq_download_3_.jpg',
          intensityReason: 'Gentle incline progression builds leg strength safely.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'walk',
              title: 'Incline Technique',
              description: 'Shorten stride, drive knees on inclines; avoid leaning.'
            },
            {
              icon: 'refresh',
              title: 'Core Engagement',
              description: 'Engage core for posture; use arms for momentum.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Speed Ladder',
          duration: '25 min',
          description: 'Speed intervals from 5.5-7.5 mph with\nincline recovery walks. 3 rounds total.\n ',
          battlePlan: '• 3 min jog (5.5 mph)\n• 2 min run (6.5 mph)\n• 1 min fast run (7.5 mph)\n• 2 min walk (3.5 mph, incline 3%)\n• repeat 3x\n• finish with 3 min jog (5.5 mph)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240938/mood_app/workout_images/6512s28r_download.jpg',
          intensityReason: 'Speed increases with recovery for intermediate fitness.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Cadence Focus',
              description: 'Increase cadence, not stride length, for speed.'
            },
            {
              icon: 'eye',
              title: 'Posture & Breathing',
              description: 'Gaze forward, shoulders relaxed for open lungs.'
            }
          ]
        },
        {
          name: 'Incline Intervals',
          duration: '22 min',
          description: 'Incline running intervals at consistent\npace with varying elevation. 5 rounds total.\n ',
          battlePlan: '• 2 min run (6.0 mph, incline 1%)\n• 1 min run (6.0 mph, incline 5%)\n• 2 min walk (3.5 mph, incline 2%)\n• Repeat 5x\n• Finish with 3 min walk (3.0 mph)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240958/mood_app/workout_images/urpigixq_download_3_.jpg',
          intensityReason: 'Running pace with inclines builds cardio and muscle.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Glute Drive',
              description: 'Drive through glutes on inclines; keep upper body loose.'
            },
            {
              icon: 'refresh',
              title: 'Recovery Breathing',
              description: 'Use walk intervals for deep, belly-focused recovery breaths.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Sprint Pyramid',
          duration: '28 min',
          description: 'Pyramid sprints from 30s to 1 min\nat 9+ mph with jog recoveries.\n ',
          battlePlan: '• 2 min jog (6.0 mph)\n• 30 sec sprint (9.0 mph)\n• 1 min jog\n• 45 sec sprint\n• 1 min jog\n• 1 min sprint\n• 2 min jog\n• repeat pyramid\n• finish with 5 min incline walk (4.0 mph, incline 8%)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240938/mood_app/workout_images/6512s28r_download.jpg',
          intensityReason: 'High-intensity 9.0 mph sprints challenge max capacity.',
          role: 'main_block',
          intensity_cost: 5,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Explosive Technique',
              description: 'Explode from balls of feet; quick, short steps for sprints.'
            },
            {
              icon: 'refresh',
              title: 'Active Recovery',
              description: 'Jogs are active recovery; shake out limbs, control breathing.'
            }
          ]
        },
        {
          name: 'Tempo & Hill Challenge',
          duration: '35 min',
          description: 'Sustained tempo running with hill\nsprints and incline walks for recovery.\n ',
          battlePlan: '• 5 min warm-up (jog)\n• 10 min tempo run (7.0 mph, incline 2%)\n• 5 x 1 min hill sprints (8.0 mph, incline 6%, 1 min walk between)\n• 5 min cool-down',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240958/mood_app/workout_images/urpigixq_download_3_.jpg',
          intensityReason: 'Tempo runs plus hill sprints demand advanced fitness.',
          role: 'main_block',
          intensity_cost: 5,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Tempo Control',
              description: '"Comfortably hard" tempo; set incline changes beforehand.'
            },
            {
              icon: 'refresh',
              title: 'Breathing Technique',
              description: 'Drive through glutes on hills; maintain steady, deep breathing.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Elliptical',
    icon: 'ellipse',
    workouts: {
      beginner: [
        {
          name: 'Resistance Rounds',
          duration: '18 min',
          description: 'Resistance intervals from easy to moderate\nwith 4 rounds of progressive intensity.\n ',
          battlePlan: '• 3 min easy (resistance 3)\n• 2 min moderate (resistance 6)\n• 1 min fast (resistance 4)\n• repeat 4x\n• finish with 3 min easy (resistance 2)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240961/mood_app/workout_images/ylgyqtdj_download_2_.jpg',
          intensityReason: 'Low-impact with gentle resistance, ideal for cardio.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'body',
              title: 'Heel Engagement',
              description: 'Heels down throughout stride for glute engagement.'
            },
            {
              icon: 'fitness',
              title: 'Posture & Power',
              description: 'Upright posture; 70% power from legs, light grip on handles.'
            }
          ]
        },
        {
          name: 'Cadence Play',
          duration: '16 min',
          description: 'RPM variations from 50-70 with steady,\nfast, and moderate pace changes.\n ',
          battlePlan: '• 2 min steady (RPM 55)\n• 1 min fast (RPM 70)\n• 2 min moderate (RPM 60)\n• 1 min slow (RPM 50, resistance 5)\n• repeat 3x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240936/mood_app/workout_images/0knopdsq_download_3_.jpg',
          intensityReason: 'RPM variations teach rhythm and build endurance.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Breathing Rhythm',
              description: 'Match breathing to RPM; smooth, circular motion.'
            },
            {
              icon: 'body',
              title: 'Chest Position',
              description: 'Keep chest lifted; avoid folding forward.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Climb & Sprint',
          duration: '25 min',
          description: 'High resistance climbs alternating\nwith low resistance sprints at 80+ RPM.\n ',
          battlePlan: '• 2 min moderate (resistance 5)\n• 1 min climb (resistance 10)\n• 1 min sprint (resistance 4, RPM 80+)\n• repeat 5x\n• finish with 3 min easy',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240961/mood_app/workout_images/ylgyqtdj_download_2_.jpg',
          intensityReason: 'Alternates climbs and sprints for strength and speed.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Climb Technique',
              description: 'Push through heels on climbs; drive knees higher.'
            },
            {
              icon: 'flash',
              title: 'Sprint Focus',
              description: 'Sprints are for cadence, not just resistance; light grip.'
            }
          ]
        },
        {
          name: 'Reverse & Forward',
          duration: '18 min',
          description: 'Forward and reverse elliptical intervals\nwith sprint finishes for muscle balance.\n ',
          battlePlan: '• 3 min forward (resistance 6)\n• 2 min reverse (resistance 4)\n• 1 min sprint (forward, resistance 5)\n• repeat 4x\n• finish with 2 min easy',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240936/mood_app/workout_images/0knopdsq_download_3_.jpg',
          intensityReason: 'Direction changes engage muscles with cardio demand.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'body',
              title: 'Core Control',
              description: 'Core tight, avoid knee overextension in reverse.'
            },
            {
              icon: 'refresh',
              title: 'Direction Switch',
              description: 'Exhale fully when switching direction to reset rhythm.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Tabata Elliptical',
          duration: '24 min',
          description: 'Tabata protocol with 20s max effort\nand 10s recovery. 3 complete cycles.\n ',
          battlePlan: '• 8 rounds: 20 sec max effort (resistance 8)\n• 10 sec easy (resistance 3)\n• 2 min recovery\n• repeat for 3 cycles',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240961/mood_app/workout_images/ylgyqtdj_download_2_.jpg',
          intensityReason: 'Tabata protocol demands max effort and VO2 limits.',
          role: 'finisher',
          intensity_cost: 5,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Max Effort',
              description: 'Explode into each 20-sec effort; no pacing.'
            },
            {
              icon: 'refresh',
              title: 'Recovery Form',
              description: 'Stay loose in shoulders; use recovery for deep breaths.'
            }
          ]
        },
        {
          name: 'Endurance Builder',
          duration: '35 min',
          description: 'Long ride with varied intensities tests endurance.\n ',
          battlePlan: '• 5 min easy\n• 10 min moderate (resistance 6)\n• 5 min hard (resistance 8)\n• 5 min reverse (resistance 5)\n• 5 min fast (resistance 4, RPM 75+)\n• 5 min cool-down',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240936/mood_app/workout_images/0knopdsq_download_3_.jpg',
          intensityReason: 'Long duration with varied intensities tests endurance.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'timer',
              title: 'Energy Management',
              description: 'Conserve energy early; focus on consistent effort.'
            },
            {
              icon: 'refresh',
              title: 'Reverse Control',
              description: 'Control momentum in reverse for targeted muscle work.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Arm bicycle',
    icon: 'bicycle',
    workouts: {
      beginner: [
        {
          name: 'Speed & Resistance Mix',
          duration: '12 min',
          description: 'Upper body intervals mixing easy, moderate,\nand fast paces with resistance changes.\n ',
          battlePlan: '• 2 min easy (resistance 2)\n• 1 min moderate (resistance 4)\n• 1 min fast (resistance 2)\n• repeat 3x\n• finish with 2 min easy',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240944/mood_app/workout_images/csr8mwa9_download_1_.jpg',
          intensityReason: 'Short intervals build upper body endurance gradually.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'body',
              title: 'Wrist & Elbow',
              description: 'Keep elbows soft, wrists neutral; avoid locking out.'
            },
            {
              icon: 'fitness',
              title: 'Core Stability',
              description: 'Engage core for stability; maintain even, smooth cadence.'
            }
          ]
        },
        {
          name: 'Interval Builder',
          duration: '15 min',
          description: 'Upper body intervals with forward and\nreverse cycling patterns. 3 complete rounds.\n ',
          battlePlan: '• 1 min easy\n• 1 min moderate\n• 30 sec fast\n• 1 min easy\n• 1 min reverse\n• repeat 3x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240937/mood_app/workout_images/2szzkktw_download.jpg',
          intensityReason: 'Basic intervals with reverse motion for safe cardio.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Pull Technique',
              description: 'Pull, don\'t just push, in reverse sets.'
            },
            {
              icon: 'body',
              title: 'Breathing Control',
              description: 'Focus on controlled breathing to match effort.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Pyramid Challenge',
          duration: '18 min',
          description: 'Pyramid intensity progression from easy\nto hard and back down. 3 complete cycles.\n ',
          battlePlan: '• 1 min easy\n• 1 min moderate\n• 1 min hard\n• 1 min moderate\n• 1 min easy\n• repeat 3x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240944/mood_app/workout_images/csr8mwa9_download_1_.jpg',
          intensityReason: 'Progressive pyramid challenges intermediate strength.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Speed Efficiency',
              description: 'Shorten strokes at faster speeds for efficiency.'
            },
            {
              icon: 'body',
              title: 'Core Bracing',
              description: 'Keep core braced; avoid leaning or rocking.'
            }
          ]
        },
        {
          name: 'Reverse & Forward',
          duration: '20 min',
          description: 'Alternating forward and reverse cycling\nwith sprint intervals. 4 complete rounds.\n ',
          battlePlan: '• 2 min forward (resistance 5)\n• 1 min reverse (resistance 3)\n• 1 min sprint (forward, resistance 4)\n• repeat 4x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240937/mood_app/workout_images/2szzkktw_download.jpg',
          intensityReason: 'Alternating directions engage muscles and cardio.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Grip Variation',
              description: 'Alternate hand grip to balance muscle use.'
            },
            {
              icon: 'body',
              title: 'Smooth Transitions',
              description: 'Stay braced in core; smooth transitions between directions.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'HIIT Sprints',
          duration: '20 min',
          description: 'High-intensity arm cycling with 30s max\neffort and recovery periods. 10 rounds total.\n ',
          battlePlan: '• 30 sec max effort (resistance 8)\n• 1 min easy (resistance 3)\n• repeat 10x\n• finish with 5 min moderate',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240944/mood_app/workout_images/csr8mwa9_download_1_.jpg',
          intensityReason: 'High-intensity sprints demand max upper body power.',
          role: 'finisher',
          intensity_cost: 5,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Shoulder Power',
              description: 'Attack sprints from shoulders, not just arms.'
            },
            {
              icon: 'refresh',
              title: 'Deep Recovery',
              description: 'Use recovery for deep, diaphragmatic breathing.'
            }
          ]
        },
        {
          name: 'Endurance & Power',
          duration: '25 min',
          description: 'Extended endurance with sprint intervals\nand reverse cycling for complete training.\n ',
          battlePlan: '• 5 min moderate\n• 10 x 30 sec sprint (resistance 10) with 30 sec easy\n• 5 min reverse\n• 5 min cool-down',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240937/mood_app/workout_images/2szzkktw_download.jpg',
          intensityReason: 'Extended power intervals test advanced endurance.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Speed Focus',
              description: 'Sprints: focus on speed turnover, not just resistance.'
            },
            {
              icon: 'body',
              title: 'Posture Control',
              description: 'Reverse block improves posture; maintain control.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Stationary bike',
    icon: 'bicycle',
    workouts: {
      beginner: [
        {
          name: 'Rolling Ride',
          duration: '20 min',
          description: 'Easy to moderate resistance intervals\nwith 4 rounds of progressive intensity.\n ',
          battlePlan: '• 3 min easy (resistance 2)\n• 2 min moderate (resistance 5)\n• 1 min fast (resistance 3)\n• repeat 4x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240949/mood_app/workout_images/fbe3z3jx_download_1_.jpg',
          intensityReason: 'Gentle resistance builds leg strength and cardio base.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'bicycle',
              title: 'Seat Height',
              description: 'Adjust seat height so legs get nearly full extension'
            },
            {
              icon: 'settings',
              title: 'Glute Power',
              description: 'Drive from glutes; maintain smooth, light cadence (70+ RPM).'
            }
          ]
        },
        {
          name: 'Cadence Intervals',
          duration: '18 min',
          description: 'Cadence training from 60-90 RPM with\nsteady, fast, and moderate intervals.\n ',
          battlePlan: '• 2 min steady (70 RPM)\n• 1 min fast (90 RPM)\n• 2 min moderate (80 RPM)\n• 1 min slow (60 RPM, resistance 6)\n• repeat 3x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240940/mood_app/workout_images/706vd22i_download_2_.jpg',
          intensityReason: 'RPM variations teach pedaling rhythm and intensity.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'bicycle',
              title: 'Seat Height',
              description: 'Adjust seat height so legs get nearly full extension'
            },
            {
              icon: 'body',
              title: 'Core Stability',
              description: 'Engage core to prevent bouncing in saddle at high RPMs.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Hill & Sprint',
          duration: '25 min',
          description: 'High resistance hill climbs alternating\nwith sprint intervals at 100+ RPM.\n ',
          battlePlan: '• 2 min moderate (resistance 6)\n• 1 min hill (resistance 10)\n• 1 min sprint (resistance 4, 100+ RPM)\n• repeat 5x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240949/mood_app/workout_images/fbe3z3jx_download_1_.jpg',
          intensityReason: 'Alternates hills and sprints for balanced training.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Hip Position',
              description: 'Shift hips back on climbs, push through heels.'
            },
            {
              icon: 'flash',
              title: 'Sprint Cadence',
              description: 'Sprints: high, consistent cadence; avoid stomping.'
            }
          ]
        },
        {
          name: 'Pyramid Ride',
          duration: '30 min',
          description: 'Pyramid intensity progression from easy\nto hard and back down. 3 complete rounds.\n ',
          battlePlan: '• 3 min easy\n• 2 min moderate\n• 1 min hard\n• 2 min moderate\n• 3 min easy\n• repeat 3x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240940/mood_app/workout_images/706vd22i_download_2_.jpg',
          intensityReason: 'Progressive pyramids challenge sustained effort.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'timer',
              title: 'Active Recovery',
              description: 'Moderate phases are active recovery; track cadence.'
            },
            {
              icon: 'refresh',
              title: 'Breathing Rhythm',
              description: 'Use strong, steady breathing to maintain rhythm.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Tabata Bike',
          duration: '24 min',
          description: 'Tabata protocol with 20s max effort\nand 10s recovery. 3 complete cycles.\n ',
          battlePlan: '• 8 rounds: 20 sec max effort (resistance 8)\n• 10 sec easy (resistance 3)\n• 2 min recovery\n• repeat for 3 cycles',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240949/mood_app/workout_images/fbe3z3jx_download_1_.jpg',
          intensityReason: 'Tabata pushes advanced cyclists to max power and VO2.',
          role: 'finisher',
          intensity_cost: 5,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Power Bursts',
              description: 'Out-of-saddle sprints for power; maintain form.'
            },
            {
              icon: 'refresh',
              title: 'Recovery Control',
              description: 'Control breathing during recovery; don\'t fully relax.'
            }
          ]
        },
        {
          name: 'Endurance & Power',
          duration: '35 min',
          description: 'Long ride with challenges tests endurance and power.\n ',
          battlePlan: '• 5 min easy\n• 10 min moderate (resistance 7)\n• 5 min hard (resistance 10)\n• 5 min fast (resistance 5, RPM 80+)\n• 5 min reverse (resistance 6)\n• 5 min cool-down',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240940/mood_app/workout_images/706vd22i_download_2_.jpg',
          intensityReason: 'Extended workout with challenges tests endurance.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'trophy',
              title: 'Effort Pacing',
              description: 'Pace "hard" sections; drive through heels on standing climbs.'
            },
            {
              icon: 'refresh',
              title: 'Consistent Focus',
              description: 'Focus on consistent effort and smooth transitions.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Assault bike',
    icon: 'bicycle',
    workouts: {
      beginner: [
        {
          name: 'Intro Intervals',
          duration: '12 min',
          description: 'Easy intervals with 30s moderate\nand fast bursts. 4 complete rounds.\n ',
          battlePlan: '• 1 min easy\n• 30 sec moderate\n• 1 min easy\n• 30 sec fast\n• repeat 4x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240950/mood_app/workout_images/foko2r38_download_2_.jpg',
          intensityReason: 'Short intervals introduce assault bike intensity safely.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'sync',
              title: 'Arm-Leg Sync',
              description: 'Push and pull equally on handles; synchronize.'
            },
            {
              icon: 'settings',
              title: 'Seat Height',
              description: 'Adjust seat height so legs get nearly full extension'
            }
          ]
        },
        {
          name: 'Resistance Play',
          duration: '15 min',
          description: 'Resistance progression with easy, moderate,\nand fast intervals. 3 complete cycles.\n ',
          battlePlan: '• 2 min easy\n• 1 min moderate (increase resistance)\n• 1 min fast\n• repeat 3x\n• finish with 2 min easy',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240948/mood_app/workout_images/eusce64e_download_3_.jpg',
          intensityReason: 'Gradual resistance helps beginners adapt to assault bike.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'settings',
              title: 'Seat Height',
              description: 'Adjust seat height so legs get nearly full extension'
            },
            {
              icon: 'body',
              title: 'Leg Priority',
              description: 'Use legs as primary driver, especially when fatigued.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Sprint & Recover',
          duration: '18 min',
          description: '20s sprint intervals with 40s recovery.\n10 rounds plus 5min moderate finish.\n ',
          battlePlan: '• 20 sec sprint\n• 40 sec easy\n• repeat 10x\n• 5 min moderate',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240950/mood_app/workout_images/foko2r38_download_2_.jpg',
          intensityReason: 'Classic 1:2 ratio challenges intermediate full-body power.',
          role: 'finisher',
          intensity_cost: 4,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'All-Out Effort',
              description: 'Go all out on sprints; don\'t hold back.'
            },
            {
              icon: 'refresh',
              title: 'RPM Control',
              description: 'Steady RPM in recovery; don\'t slow too much.'
            }
          ]
        },
        {
          name: 'Ladder Intervals',
          duration: '20 min',
          description: 'Progressive sprint ladder from 30s to 1min\nwith equal recovery periods between.\n ',
          battlePlan: '• 30 sec sprint\n• 1 min easy\n• 45 sec sprint\n• 1 min easy\n• 1 min sprint\n• 1 min easy\n• repeat sequence',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240948/mood_app/workout_images/eusce64e_download_3_.jpg',
          intensityReason: 'Progressive intervals challenge intermediate athletes.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Mini-Max Effort',
              description: 'Treat each sprint as a mini-max effort.'
            },
            {
              icon: 'body',
              title: 'Core Control',
              description: 'Brace core to control upper-body movement.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Tabata Assault',
          duration: '16 min',
          description: 'Tabata protocol with 20s max effort\nand 10s rest. 2 complete cycles.\n ',
          battlePlan: '• 8 rounds: 20 sec max effort\n• 10 sec rest\n• 2 min easy\n• repeat for 2 cycles',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240950/mood_app/workout_images/foko2r38_download_2_.jpg',
          intensityReason: 'Tabata on assault bike demands max full-body power.',
          role: 'finisher',
          intensity_cost: 5,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Explosive Start',
              description: 'Explode at start of each 20-sec bout.'
            },
            {
              icon: 'refresh',
              title: 'Active Phases',
              description: 'Don\'t coast; easy phases should still move.'
            }
          ]
        },
        {
          name: 'EMOM Challenge',
          duration: '20 min',
          description: 'Every minute on the minute sprints\nwith variable recovery time.\n ',
          battlePlan: '• Every minute: 20 sec sprint\n• 40 sec moderate\n• repeat for 20 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240948/mood_app/workout_images/eusce64e_download_3_.jpg',
          intensityReason: 'Extended EMOM format tests advanced endurance.',
          role: 'main_block',
          intensity_cost: 5,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Fresh Set Approach',
              description: 'Attack each sprint as a fresh set.'
            },
            {
              icon: 'refresh',
              title: 'Breathing Window',
              description: 'Use moderate window to find breathing rhythm.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Row machine',
    icon: 'boat',
    workouts: {
      beginner: [
        {
          name: 'Row & Rest',
          duration: '12 min',
          description: 'Easy rowing intervals with 30s moderate\nand fast bursts. 4 complete rounds.\n ',
          battlePlan: '• 1 min easy\n• 30 sec moderate\n• 1 min easy\n• 30 sec fast\n• repeat 4x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240957/mood_app/workout_images/sfylsueu_download_copy_4.jpg',
          intensityReason: 'Short intervals ideal for beginners learning rowing technique.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'boat',
              title: 'Sequence Form',
              description: 'Legs, then hips, then arms; reverse for recovery.'
            },
            {
              icon: 'body',
              title: 'Chain Position',
              description: 'Keep chain at mid-chest; spine neutral, eyes forward.'
            }
          ]
        },
        {
          name: 'Stroke Play',
          duration: '15 min',
          description: 'Stroke rate variations from 20-28 SPM\nwith steady, fast, and slow phases.\n ',
          battlePlan: '• 2 min steady (22 SPM)\n• 1 min fast (28 SPM)\n• 2 min slow (20 SPM)\n• repeat 3x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240955/mood_app/workout_images/ovxl084v_download_1_copy_4.jpg',
          intensityReason: 'Varied stroke rates develop rhythm and cardio base.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Recovery Control',
              description: 'Control recovery (2x drive time); conserve energy.'
            },
            {
              icon: 'speedometer',
              title: 'Breathing Match',
              description: 'Match stroke rate with breathing; smooth transitions.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Power Intervals',
          duration: '20 min',
          description: 'Power intervals alternating hard, moderate,\nand recovery strokes. 4 complete rounds.\n ',
          battlePlan: '• 1 min hard (28 SPM)\n• 2 min moderate (24 SPM)\n• 1 min slow (20 SPM)\n• repeat 4x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240957/mood_app/workout_images/sfylsueu_download_copy_4.jpg',
          intensityReason: 'Alternates power strokes and recovery for strength.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Explosive Drive',
              description: 'Drive explosively from heels (60% legs, 30% core, 10% arms).'
            },
            {
              icon: 'settings',
              title: 'Form Drills',
              description: 'Use slower segments for perfect form drills.'
            }
          ]
        },
        {
          name: 'Pyramid Row',
          duration: '25 min',
          description: 'Progressive pyramid from 1-3 minutes\neasy/hard pairs, then descending back.\n ',
          battlePlan: '• 1 min easy\n• 1 min hard\n• 2 min easy\n• 2 min hard\n• 3 min easy\n• 3 min hard\n• then back down',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240955/mood_app/workout_images/ovxl084v_download_1_copy_4.jpg',
          intensityReason: 'Progressive intervals challenge intermediate rowers.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'speedometer',
              title: 'Stroke Control',
              description: 'Control stroke rate (20-26 SPM); avoid wild pulling.'
            },
            {
              icon: 'refresh',
              title: 'Core Breathing',
              description: 'Strong belly breathing to stabilize core on hard stretches.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Sprint & Recover',
          duration: '20 min',
          description: 'Sprint intervals at 32 SPM with moderate\nrecovery strokes. 10 complete rounds.\n ',
          battlePlan: '• 30 sec sprint (32 SPM)\n• 1 min moderate (24 SPM)\n• repeat 10x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240957/mood_app/workout_images/sfylsueu_download_copy_4.jpg',
          intensityReason: 'High-intensity 32 SPM sprints demand max power output.',
          role: 'finisher',
          intensity_cost: 5,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Grip Relaxation',
              description: 'Snap at the catch for power; relax grip.'
            },
            {
              icon: 'refresh',
              title: 'Quick Rhythm',
              description: 'Quick rhythm, but complete each stroke fully.'
            }
          ]
        },
        {
          name: 'Endurance Builder',
          duration: '30 min',
          description: 'Progressive endurance build from easy\nto fast pace with structured progression.\n ',
          battlePlan: '• 5 min easy\n• 10 min moderate\n• 5 min hard\n• 5 min fast\n• 5 min cool-down',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240955/mood_app/workout_images/ovxl084v_download_1_copy_4.jpg',
          intensityReason: 'Extended duration builds elite-level endurance.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'trophy',
              title: 'Split Consistency',
              description: 'Consistent split time across zones; focus on efficiency.'
            },
            {
              icon: 'refresh',
              title: 'Deep Breathing',
              description: 'Maintain steady, deep breathing throughout.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Stair master',
    icon: 'trending-up',
    workouts: {
      beginner: [
        {
          name: 'Step & Recover',
          duration: '12 min',
          description: 'Easy stepping intervals with 30s moderate\nand fast bursts. 4 complete rounds.\n ',
          battlePlan: '• 1 min easy\n• 30 sec moderate\n• 1 min easy\n• 30 sec fast\n• repeat 4x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240943/mood_app/workout_images/clikf991_download.jpg',
          intensityReason: 'Gentle step intervals help beginners build leg strength.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'body',
              title: 'Full Foot',
              description: 'Push through full foot, not just toes.'
            },
            {
              icon: 'trending-up',
              title: 'Upright Posture',
              description: 'Stay upright; avoid leaning heavily on rails.'
            }
          ]
        },
        {
          name: 'Pace Changer',
          duration: '15 min',
          description: 'Steady pace with double-step intervals\nfor variety and challenge. 3 rounds total.\n ',
          battlePlan: '• 2 min steady\n• 1 min double step (skip a step)\n• 2 min slow\n• repeat 3x',
          imageUrl: 'https://customer-assets.emergentagent.com/job_fitness-app-ui/artifacts/yjdyjdsw_sm.avif',
          intensityReason: 'Varied stepping patterns introduce different movements.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Glute Engagement',
              description: 'Double steps: engage glutes deliberately.'
            },
            {
              icon: 'refresh',
              title: 'Breathing Control',
              description: 'Use slow phases to regain breathing control.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Interval Climb',
          duration: '20 min',
          description: 'Fast intervals with moderate recovery\nand side step challenges. 4 rounds total.\n ',
          battlePlan: '• 1 min fast\n• 2 min moderate\n• 1 min side step (face sideways)\n• repeat 4x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240943/mood_app/workout_images/clikf991_download.jpg',
          intensityReason: 'Mixed patterns challenge intermediate speed and coordination.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'body',
              title: 'Side Step Form',
              description: 'Side steps: keep knees soft, engage outer glutes.'
            },
            {
              icon: 'flash',
              title: 'Arm Swing',
              description: 'Strong arm swing aids rhythm and balance.'
            }
          ]
        },
        {
          name: 'Hill Climb',
          duration: '25 min',
          description: 'Hill climb progression with moderate, fast,\nand double step variations. 5 rounds total.\n ',
          battlePlan: '• 2 min moderate\n• 1 min fast\n• 1 min slow\n• 1 min double step\n• repeat 5x',
          imageUrl: 'https://customer-assets.emergentagent.com/job_fitness-app-ui/artifacts/yjdyjdsw_sm.avif',
          intensityReason: 'Continuous climbing builds lower body strength and endurance.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Double Step Power',
              description: 'Treat double steps as strength work.'
            },
            {
              icon: 'trending-up',
              title: 'Pace Maintenance',
              description: 'Don\'t let steady pace drift; maintain effort.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Speed & Endurance',
          duration: '30 min',
          description: 'Advanced stepping with varied patterns. 5 rounds.\n ',
          battlePlan: '• 2 min fast\n• 1 min side step\n• 1 min double step\n• 2 min moderate\n• repeat 5x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240943/mood_app/workout_images/clikf991_download.jpg',
          intensityReason: 'High-speed stepping demands advanced coordination and power.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Rhythm Control',
              description: 'Maintain rhythm on fast sets; avoid choppy steps.'
            },
            {
              icon: 'fitness',
              title: 'Full Engagement',
              description: 'Master side/double steps for full leg engagement.'
            }
          ]
        },
        {
          name: 'HIIT Steps',
          duration: '20 min',
          description: 'HIIT intervals with sprint and skip-step\nalternating with recovery periods. 5 rounds.\n ',
          battlePlan: '• 30 sec sprint\n• 90 sec moderate\n• 30 sec skip-step\n• 90 sec easy\n• repeat 5x',
          imageUrl: 'https://customer-assets.emergentagent.com/job_fitness-app-ui/artifacts/yjdyjdsw_sm.avif',
          intensityReason: 'High-intensity intervals challenge advanced explosive power.',
          role: 'finisher',
          intensity_cost: 5,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Explosive Power',
              description: 'Explode on sprint and skip-step phases.'
            },
            {
              icon: 'body',
              title: 'Light Footwork',
              description: 'Stay light-footed to protect knees.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Ski machine',
    icon: 'snow',
    workouts: {
      beginner: [
        {
          name: 'Ski & Glide',
          duration: '12 min',
          description: 'Easy skiing intervals with 30s moderate\nand fast bursts. 4 complete rounds.\n ',
          battlePlan: '• 1 min easy\n• 30 sec moderate\n• 1 min easy\n• 30 sec fast\n• repeat 4x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240954/mood_app/workout_images/lv55gxbj_download.jpg',
          intensityReason: 'Short intervals help beginners learn ski machine technique.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'body',
              title: 'Hip Power',
              description: 'Power from hips hinging back; use primarily lats, not just arms.'
            },
            {
              icon: 'body',
              title: 'Posture Control',
              description: 'Keep knees soft, back neutral; avoid hunching.'
            }
          ]
        },
        {
          name: 'Resistance Play',
          duration: '15 min',
          description: 'Resistance variations from light to moderate\nwith steady, moderate, and slow phases.\n ',
          battlePlan: '• 2 min steady (resistance 3)\n• 1 min moderate (resistance 5)\n• 2 min slow (resistance 2)\n• repeat 3x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240946/mood_app/workout_images/dsrwf4m8_ski1.jpg',
          intensityReason: 'Varied resistance introduces beginners to ski motion gradually.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Pull Control',
              description: 'Explosive pull, smooth recovery; control downstroke.'
            },
            {
              icon: 'refresh',
              title: 'Core Breathing',
              description: 'Breathe out forcefully with each pull for core engagement.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Interval Ski',
          duration: '18 min',
          description: 'Skiing intervals alternating hard, moderate,\nand slow intensities. 4 complete rounds.\n ',
          battlePlan: '• 1 min hard\n• 2 min moderate\n• 1 min slow\n• repeat 4x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240954/mood_app/workout_images/lv55gxbj_download.jpg',
          intensityReason: 'Intervals challenge intermediate full-body coordination.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'body',
              title: 'Full Stroke',
              description: 'Hands finish low near thighs for full stroke.'
            },
            {
              icon: 'refresh',
              title: 'Recovery Patience',
              description: 'Avoid rushing recovery; allow power spikes to be effective.'
            }
          ]
        },
        {
          name: 'Pyramid Ski',
          duration: '20 min',
          description: 'Pyramid skiing building from 1-3 minutes\neasy/hard pairs with progressive intensity.\n ',
          battlePlan: '• 1 min easy\n• 1 min hard\n• 2 min easy\n• 2 min hard\n• 3 min easy\n• 3 min hard',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240946/mood_app/workout_images/dsrwf4m8_ski1.jpg',
          intensityReason: 'Progressive time increases test intermediate endurance.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Output Building',
              description: 'Build output slowly during longer "hard" sets.'
            },
            {
              icon: 'timer',
              title: 'Split Tracking',
              description: 'Track split time to ensure consistent performance.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Sprint & Recover',
          duration: '20 min',
          description: 'High-intensity ski sprints with moderate\nrecovery periods. 10 complete rounds.\n ',
          battlePlan: '• 30 sec sprint\n• 1 min moderate\n• repeat 10x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240954/mood_app/workout_images/lv55gxbj_download.jpg',
          intensityReason: 'High-intensity sprints demand max power and coordination.',
          role: 'finisher',
          intensity_cost: 5,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'body',
              title: 'Hip Power',
              description: 'Keep arms loose; power from hips.'
            },
            {
              icon: 'flash',
              title: 'Stroke Completion',
              description: 'Quick rhythm, but don\'t cut the pull short.'
            }
          ]
        },
        {
          name: 'HIIT Ski',
          duration: '16 min',
          description: 'Tabata protocol with 20s max effort\nand 10s rest. 2 complete cycles.\n ',
          battlePlan: '• 8 rounds\n• 20 sec max effort\n• 10 sec rest\n• Rest for two minutes\n• Repeat for 2 cycles',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240946/mood_app/workout_images/dsrwf4m8_ski1.jpg',
          intensityReason: 'Tabata intervals push advanced users to max anaerobic capacity.',
          role: 'finisher',
          intensity_cost: 5,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Pull Maximum',
              description: 'Max pulls per 20-sec interval; stay tall.'
            },
            {
              icon: 'refresh',
              title: 'Controlled Recovery',
              description: 'Controlled recovery; focus on deep breaths.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Curve treadmill',
    icon: 'walk',
    workouts: {
      beginner: [
        {
          name: 'Walk & Jog',
          duration: '12 min',
          description: 'Basic walk-jog intervals alternating\nbetween 2min walks and 1min jogs. 2 cycles.\n ',
          battlePlan: '• 2 min walk\n• 1 min jog\n• 2 min walk\n• 1 min jog\n• repeat 2x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240947/mood_app/workout_images/ejtlm08e_download.jpg',
          intensityReason: 'Curve treadmill moderates pace, perfect for beginners.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'walk',
              title: 'Mid-Curve Control',
              description: 'Step mid-curve for control; use natural arm swing.'
            },
            {
              icon: 'trending-up',
              title: 'Belt Position',
              description: 'Stay near front of belt to maintain speed.'
            }
          ]
        },
        {
          name: 'Speed Play',
          duration: '15 min',
          description: 'Speed variation training with walking,\njogging, and fast walking. 4 rounds total.\n ',
          battlePlan: '• 1 min walk\n• 30 sec jog\n• 1 min walk\n• 30 sec fast walk\n• repeat 4x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240962/mood_app/workout_images/z2xm78y9_download_1_.jpg',
          intensityReason: 'Variable pace helps beginners understand effort control.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'walk',
              title: 'Stride Variation',
              description: 'Short strides for jog, longer for fast walk.'
            },
            {
              icon: 'flash',
              title: 'Foot Turnover',
              description: 'Focus on light, quick foot turnover.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Interval Run',
          duration: '18 min',
          description: 'Running intervals with recovery walks. 3 cycles.\n ',
          battlePlan: '• 1 min run\n• 2 min walk\n• 1 min fast run\n• 2 min walk\n• repeat 3x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240947/mood_app/workout_images/ejtlm08e_download.jpg',
          intensityReason: 'Intervals on curve treadmill challenge intermediate runners.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Active Reset',
              description: 'Walks are for active reset, not coasting.'
            },
            {
              icon: 'body',
              title: 'Light Impact',
              description: 'Light foot placement; avoid heavy impact.'
            }
          ]
        },
        {
          name: 'Pyramid Pace',
          duration: '20 min',
          description: 'Pyramid pace progression from walk to\nrun and back down. 3 complete cycles.\n ',
          battlePlan: '• 1 min walk\n• 1 min jog\n• 1 min run\n• 1 min jog\n• 1 min walk\n• repeat 3x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240962/mood_app/workout_images/z2xm78y9_download_1_.jpg',
          intensityReason: 'Progressive pace pyramids develop intermediate pacing skills.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'sync',
              title: 'Smooth Transitions',
              description: 'Smooth transitions between paces.'
            },
            {
              icon: 'pulse',
              title: 'Heart Rate Control',
              description: 'Consciously lower heart rate during jog recovery.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Sprint Intervals',
          duration: '20 min',
          description: 'High-intensity sprint intervals with 20s\nall-out effort and 40s recovery. 15 rounds.\n ',
          battlePlan: '• 20 sec sprint\n• 40 sec walk\n• repeat 15x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240947/mood_app/workout_images/ejtlm08e_download.jpg',
          intensityReason: 'High-intensity sprints demand maximum power and mechanics.',
          role: 'finisher',
          intensity_cost: 5,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Explosive Acceleration',
              description: 'Explosive acceleration for each sprint.'
            },
            {
              icon: 'walk',
              title: 'Active Recovery',
              description: 'Active walk recovery; maintain cadence.'
            }
          ]
        },
        {
          name: 'EMOM Challenge',
          duration: '15 min',
          description: 'Every minute sprint challenge with 20s\nall-out effort and 40s jog recovery.\n ',
          battlePlan: '• Every minute: 20 sec sprint\n• 40 sec moderate jog\n• repeat for 15 min',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240962/mood_app/workout_images/z2xm78y9_download_1_.jpg',
          intensityReason: 'Sustained work tests advanced cardiovascular capacity.',
          role: 'finisher',
          intensity_cost: 5,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Fresh Sprint',
              description: 'Treat each sprint as a fresh, max effort.'
            },
            {
              icon: 'body',
              title: 'Relaxed Form',
              description: 'Relax shoulders and jaw to conserve energy.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Punching bag',
    icon: 'hand-left',
    workouts: {
      beginner: [
        {
          name: 'Combo Builder',
          duration: '10 min',
          description: 'Basic punch combinations with jab-cross\nand jab-cross-hook patterns. 5 rounds total.\n ',
          battlePlan: '• 30 sec jab-cross\n• 30 sec rest\n• 30 sec jab-cross-hook\n• 30 sec rest\n• repeat 5x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240941/mood_app/workout_images/9djyqo5n_download_copy_3.jpg',
          intensityReason: 'Basic combinations help beginners learn proper punching form.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'body',
              title: 'Hip Rotation',
              description: 'Rotate hips with punches; don\'t just arm-swing.'
            },
            {
              icon: 'shield',
              title: 'Guard Position',
              description: 'Keep guard tight between combos; protect face.'
            }
          ]
        },
        {
          name: 'Movement Mix',
          duration: '12 min',
          description: 'Light punching combined with footwork\nand movement around the bag. 4 rounds.\n ',
          battlePlan: '• 30 sec light punches\n• 30 sec footwork (move around bag)\n• 30 sec rest\n• repeat 4x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240951/mood_app/workout_images/gbeea240_download_1_copy_3.jpg',
          intensityReason: 'Punching with movement introduces beginners to boxing cardio.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'walk',
              title: 'Light Movement',
              description: 'Stay light on feet, constantly circling the bag.'
            },
            {
              icon: 'flash',
              title: 'Sharp Punches',
              description: 'Punch sharp, not pushing; snap back quickly.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Power Rounds',
          duration: '15 min',
          description: 'Complex combos with power punches. 4 rounds.\n ',
          battlePlan: '• 1 min combos (jab-cross-hook-uppercut)\n• 30 sec rest\n• 1 min power punches\n• 30 sec rest\n• repeat 4x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240941/mood_app/workout_images/9djyqo5n_download_copy_3.jpg',
          intensityReason: 'Complex combinations challenge intermediate coordination.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'body',
              title: 'Power Punches',
              description: 'Sit into punches for power; brace core.'
            },
            {
              icon: 'flash',
              title: 'Clean Returns',
              description: 'Focus on crisp, clean punch return.'
            }
          ]
        },
        {
          name: 'Speed & Defense',
          duration: '16 min',
          description: 'Speed punching combined with defensive\nslips and ducks movements. 6 rounds total.\n ',
          battlePlan: '• 30 sec fast punches\n• 30 sec slips/ducks\n• 30 sec rest\n• repeat 6x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240951/mood_app/workout_images/gbeea240_download_1_copy_3.jpg',
          intensityReason: 'Speed work with defense develops intermediate boxing skills.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Speed Focus',
              description: 'Fast punches: focus on speed, not just power.'
            },
            {
              icon: 'body',
              title: 'Minimal Movement',
              description: 'Practice smooth slips/ducks; minimal head movement.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'HIIT Boxing',
          duration: '20 min',
          description: 'High-intensity boxing with 45s max effort\ncombos and minimal rest. 15 rounds total.\n ',
          battlePlan: '• 45 sec max effort combos\n• 15 sec rest\n• repeat 15x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240941/mood_app/workout_images/9djyqo5n_download_copy_3.jpg',
          intensityReason: 'High-intensity intervals demand max power and coordination.',
          role: 'finisher',
          intensity_cost: 5,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Max Combos',
              description: 'Max effort combos every round; explosive bursts.'
            },
            {
              icon: 'walk',
              title: 'Light Recovery',
              description: 'Stay light-footed during rest periods; active recovery.'
            }
          ]
        },
        {
          name: 'Endurance Rounds',
          duration: '20 min',
          description: 'Extended rounds with all-out effort and defense. 3 cycles.\n ',
          battlePlan: '• 2 min all-out\n• 1 min rest\n• 2 min footwork & defense\n• 1 min rest\n• repeat 3x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240951/mood_app/workout_images/gbeea240_download_1_copy_3.jpg',
          intensityReason: 'Extended rounds test advanced cardiovascular endurance.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Breathing Control',
              description: 'Control breathing for sustained effort.'
            },
            {
              icon: 'body',
              title: 'Head Movement',
              description: 'Constant head movement; don\'t stay static.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Vertical Climber',
    icon: 'triangle',
    workouts: {
      beginner: [
        {
          name: 'Climb & Rest',
          duration: '10 min',
          description: 'Basic climbing intervals with equal\nwork and rest periods. 5 rounds total.\n ',
          battlePlan: '• 1 min climb\n• 1 min rest\n• repeat 5x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240939/mood_app/workout_images/6dix82sz_download.jpg',
          intensityReason: 'Work-to-rest ratio helps beginners adapt to climbing motion.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'body',
              title: 'Smooth Control',
              description: 'Smooth, controlled steps; avoid jerky movements.'
            },
            {
              icon: 'fitness',
              title: 'Leg Priority',
              description: 'Engage legs primarily; arms assist lightly.'
            }
          ]
        },
        {
          name: 'Pace Play',
          duration: '12 min',
          description: 'Progressive pace climbing from slow\nto fast with recovery periods. 3 rounds.\n ',
          battlePlan: '• 30 sec slow\n• 30 sec moderate\n• 30 sec fast\n• 30 sec rest\n• repeat 3x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240960/mood_app/workout_images/w3vrqrj0_download_1_.jpg',
          intensityReason: 'Varied pace introduces different climbing intensities.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Breathing Match',
              description: 'Match breathing rhythm to pace changes.'
            },
            {
              icon: 'fitness',
              title: 'Push-Pull Sequence',
              description: 'Push with legs, then pull with arms.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Interval Climb',
          duration: '15 min',
          description: 'Sustained intervals challenge full-body endurance. 5 rounds.\n ',
          battlePlan: '• 1 min hard\n• 1 min moderate\n• 1 min slow\n• repeat 5x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240939/mood_app/workout_images/6dix82sz_download.jpg',
          intensityReason: 'Sustained intervals challenge intermediate full-body endurance.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'High Knees',
              description: 'High knees in "hard" phase for power.'
            },
            {
              icon: 'body',
              title: 'Upright Posture',
              description: 'Maintain upright posture; avoid hunching.'
            }
          ]
        },
        {
          name: 'Ladder Climb',
          duration: '18 min',
          description: 'Mixed pace climbing with fast, moderate,\nand slow intervals. 6 complete rounds.\n ',
          battlePlan: '• 30 sec fast\n• 1 min moderate\n• 30 sec slow\n• repeat 6x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240960/mood_app/workout_images/w3vrqrj0_download_1_.jpg',
          intensityReason: 'Variable intervals develop intermediate pacing skills.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'body',
              title: 'Stride Adjustment',
              description: 'Adjust stride length for different paces.'
            },
            {
              icon: 'flash',
              title: 'Steady Tension',
              description: 'Keep tension steady; avoid wasted effort.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Sprint & Recover',
          duration: '20 min',
          description: 'High-intensity climbing sprints with 20s\nall-out effort and 40s recovery. 15 rounds.\n ',
          battlePlan: '• 20 sec sprint\n• 40 sec moderate\n• repeat 15x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240939/mood_app/workout_images/6dix82sz_download.jpg',
          intensityReason: 'High-intensity sprints demand max full-body power.',
          role: 'finisher',
          intensity_cost: 5,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Explosive Drive',
              description: 'Explosive arm-leg drive on sprints.'
            },
            {
              icon: 'body',
              title: 'Controlled Motion',
              description: 'Slow phases: focus on controlled, deliberate motion.'
            }
          ]
        },
        {
          name: 'Endurance Climb',
          duration: '20 min',
          description: 'Hard climbing efforts alternating with\nmoderate recovery periods for endurance.\n ',
          battlePlan: '• 2 min hard\n• 1 min moderate\n• repeat 6x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240960/mood_app/workout_images/w3vrqrj0_download_1_.jpg',
          intensityReason: 'Extended climbing efforts build advanced endurance capacity.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pacing Control',
              description: 'Pace yourself; don\'t peak early.'
            },
            {
              icon: 'hand-right',
              title: 'Grip Relaxation',
              description: 'Relax grip to prevent forearm burnout.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Jump rope',
    icon: 'git-compare',
    workouts: {
      beginner: [
        {
          name: 'Jump & Rest',
          duration: '10 min',
          description: 'Basic jump rope intervals with equal\nwork and rest periods. 10 rounds total.\n ',
          battlePlan: '• 30 sec jump\n• 30 sec rest\n• repeat 10x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240959/mood_app/workout_images/vj88wh1r_download.jpg',
          intensityReason: 'Work-to-rest ratio helps beginners learn jumping technique.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'body',
              title: 'Light Hops',
              description: 'Stay on balls of feet; light, small hops.'
            },
            {
              icon: 'hand-right',
              title: 'Wrist Control',
              description: 'Keep elbows tucked close; wrists turn the rope.'
            }
          ]
        },
        {
          name: 'Step Touch',
          duration: '12 min',
          description: 'Basic jumps alternating with step touch\nfootwork practice and rest periods.\n ',
          battlePlan: '• 30 sec basic jump\n• 30 sec step touch (no rope)\n• 30 sec basic jump\n• 30 sec rest\n• repeat 4x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240952/mood_app/workout_images/j2nua1fe_download_1_.jpg',
          intensityReason: 'Alternates rope work and footwork to build coordination.',
          role: 'primer',
          intensity_cost: 2,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'High Knees Form',
              description: 'Lift knees for high knees; don\'t kick heels back.'
            },
            {
              icon: 'timer',
              title: 'Speed Building',
              description: 'Start slow for coordination; build speed gradually.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Combo Jumps',
          duration: '15 min',
          description: 'Combination jumping patterns with basic,\nalternate foot, and double bounce styles.\n ',
          battlePlan: '• 1 min basic jump\n• 30 sec alternate foot\n• 30 sec double bounce\n• 1 min rest\n• repeat 4x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240959/mood_app/workout_images/vj88wh1r_download.jpg',
          intensityReason: 'Multiple jumping patterns challenge intermediate coordination.',
          role: 'main_block',
          intensity_cost: 3,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'body',
              title: 'Soft Landing',
              description: 'Land softly to protect shins and joints.'
            },
            {
              icon: 'flash',
              title: 'Efficient Turns',
              description: 'Use short, efficient rope turns; minimize arm movement.'
            }
          ]
        },
        {
          name: 'Speed Intervals',
          duration: '18 min',
          description: 'High-intensity intervals with 45s fast\njumping and 15s recovery. 12 rounds total.\n ',
          battlePlan: '• 45 sec fast jump\n• 15 sec slow jump\n• repeat 12x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240952/mood_app/workout_images/j2nua1fe_download_1_.jpg',
          intensityReason: 'Speed variations challenge intermediate jumpers.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'body',
              title: 'Shoulder Relaxation',
              description: 'Relax shoulders; prevent upper body fatigue.'
            },
            {
              icon: 'flash',
              title: 'Double-Under Technique',
              description: 'Double-unders: quick wrist snap, not higher jumps.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'HIIT Rope',
          duration: '20 min',
          description: 'Maximum speed HIIT intervals with 30s\nall-out effort and 10s rest. 20 rounds.\n ',
          battlePlan: '• 30 sec max speed\n• 10 sec rest\n• repeat 20x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240959/mood_app/workout_images/vj88wh1r_download.jpg',
          intensityReason: 'Maximum speed intervals demand elite fitness and coordination.',
          role: 'finisher',
          intensity_cost: 5,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'flash',
              title: 'Wrist Efficiency',
              description: 'Explosive wrist action for double-unders; efficiency over height.'
            },
            {
              icon: 'refresh',
              title: 'Breathing Pattern',
              description: 'Lock in a steady, deep breathing pattern.'
            }
          ]
        },
        {
          name: 'Complex Patterns',
          duration: '18 min',
          description: 'Advanced techniques including cross-over,\ndouble under, and basic patterns. 6 rounds.\n ',
          battlePlan: '• 1 min cross-over\n• 1 min double under\n• 1 min basic jump\n• repeat 6x',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240952/mood_app/workout_images/j2nua1fe_download_1_.jpg',
          intensityReason: 'Advanced jumping patterns demand elite coordination and timing.',
          role: 'main_block',
          intensity_cost: 4,
          modality: 'cardio',
          moodTips: [
            {
              icon: 'timer',
              title: 'Energy Conservation',
              description: 'Conserve energy with small, controlled jumps.'
            },
            {
              icon: 'flash',
              title: 'Crossover Technique',
              description: 'Crossovers: quick wrist snap, minimal arm swing.'
            }
          ]
        }
      ]
    }
  },
  // Weight Equipment Workouts
  {
    equipment: 'Dumbbells',
    icon: 'barbell',
    workouts: {
      beginner: [
        {
          name: 'Dumbbell Cardio Circuit',
          duration: '16 min',
          description: 'Full-body cardio circuit with squats, lunges, and presses.\n\n ',
          battlePlan: 'Perform 4 rounds:\n• 10 dumbbell squats\n• 8 alternating lunges (each leg)\n• 6 dumbbell push presses\n• 30 sec rest\nFinish with 2 min easy walking',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241263/mood_app/workout_images/0t57iowy_db_goblet_squat.jpg',
          intensityReason: 'Perfect beginner circuit with functional movements and rest.',
          moodTips: [
            {
              icon: 'body',
              title: 'Form Focus',
              description: 'Chest tall in squats/lunges; knees track toes.'
            },
            {
              icon: 'refresh',
              title: 'Core Stability',
              description: 'Exhale hard on push press to stabilize core.'
            }
          ]
        },
        {
          name: 'Dumbbell Flow',
          duration: '15 min',
          description: 'Strength flow: squat to press, snatches, and bent-over rows.\n\n ',
          battlePlan: 'Perform 3 rounds:\n• 8 squat to overhead press\n• 6 single-arm dumbbell snatches (each arm)\n• 10 bent-over rows\n• 45 sec rest\nFinish with light stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240692/mood_app/workout_images/2ctzlc7l_SA_db_row.jpg',
          intensityReason: 'Smooth flow teaches dumbbell transitions and builds coordination.',
          moodTips: [
            {
              icon: 'body',
              title: 'Spine Alignment',
              description: 'Neutral spine in rows; hinge at hips, not back.'
            },
            {
              icon: 'flash',
              title: 'Movement Flow',
              description: 'Smooth transitions—don\'t drop dumbbells between moves.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Dumbbell Complex',
          duration: '28–30 min',
          description: 'Full-body complex: deadlifts, cleans, squats, presses, lunges.\n\n ',
          battlePlan: 'Perform 5 rounds:\n• 5 dumbbell deadlifts\n• 5 dumbbell cleans\n• 5 front squats\n• 5 push presses\n• 5 reverse lunges (each leg)\nRest 90 sec\nFinish with 3 min walk',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241323/mood_app/workout_images/5v2oyit3_dbrdl.jpg',
          intensityReason: 'Complex movements for increased strength and conditioning.',
          moodTips: [
            {
              icon: 'body',
              title: 'Grip Control',
              description: 'Reset grip/stance each move; protect wrists.'
            },
            {
              icon: 'refresh',
              title: 'Power Breathing',
              description: 'Exhale forcefully on press/lunge for power.'
            }
          ]
        },
        {
          name: 'EMOM 12',
          duration: '12 min',
          description: 'EMOM: thrusters and renegade rows for strength endurance.\n\n ',
          battlePlan: 'Every minute on the minute for 12 minutes:\n• Minute 1: 8 dumbbell thrusters\n• Minute 2: 10 renegade rows\nRepeat alternating pattern\nRest remaining time in each minute',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241281/mood_app/workout_images/cnnnnm30_db_reverse_lunge.jpg',
          intensityReason: 'Time-based intervals challenge muscular endurance and cardio.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Hip Drive',
              description: 'Thrusters—hips drive press, don\'t isolate arms.'
            },
            {
              icon: 'body',
              title: 'Core Stability',
              description: 'Renegade rows—hips stable, no twisting.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Dumbbell Ladder',
          duration: '20–24 min',
          description: 'Descending rep ladder: cleans, presses, and burpees.\n\n ',
          battlePlan: 'Descending ladder (10-9-8-7-6-5-4-3-2-1):\n• Dumbbell cleans\n• Push presses\n• Burpees over dumbbells\nRest 2 min every 3 rounds\nFinish when all rounds complete',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241353/mood_app/workout_images/mxfs858v_dbbss.jpg',
          intensityReason: 'Descending ladder demands advanced strength and conditioning.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Clean Technique',
              description: 'Catch dumbbells close to shoulders, not out front.'
            },
            {
              icon: 'body',
              title: 'Landing Control',
              description: 'Controlled burpee jump—tight core, avoid sloppy landings.'
            }
          ]
        },
        {
          name: 'Dumbbell AMRAP',
          duration: '15 min',
          description: 'AMRAP: snatches, jump squats, push-up rows, and lunges.\n\n ',
          battlePlan: 'AMRAP for 15 minutes:\n• 8 single-arm dumbbell snatches (4 each)\n• 12 dumbbell jump squats\n• 8 push-up to T (4 each side)\n• 10 walking lunges with dumbbells\nScore total rounds + reps',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241344/mood_app/workout_images/hiyqkn20_db_lat_lunge.jpg',
          intensityReason: 'High-intensity AMRAP combines power movements with plyometrics.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Snatch Power',
              description: 'Snatches—hips drive, lock arms overhead.'
            },
            {
              icon: 'body',
              title: 'Joint Protection',
              description: 'Land soft in squat jumps to save knees.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Kettle bells',
    icon: 'fitness',
    workouts: {
      beginner: [
        {
          name: 'Kettlebell Swing & Carry',
          duration: '15 min',
          description: 'Cardio and strength: swings paired with farmer\'s carries.\n\n ',
          battlePlan: 'Perform 4 rounds:\n• 20 kettlebell swings\n• 30-sec farmer\'s carry (walk with 2 kettlebells)\n• Rest 60 sec\nFinish with 2 min stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241330/mood_app/workout_images/kc1es3oi_kb_gorilla_row.jpg',
          intensityReason: 'Basic kettlebell introduction with hip hinge training.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Hip Hinge Technique',
              description: 'Swings—hinge hips, power from glutes.'
            },
            {
              icon: 'body',
              title: 'Posture Control',
              description: 'Farmer\'s carry—shoulders back, core tight.'
            }
          ]
        },
        {
          name: 'Kettlebell Cardio Flow',
          duration: '12–15 min',
          description: 'Full-body flow: squats, swings, and overhead presses.\n\n ',
          battlePlan: 'Perform 3 rounds:\n• 10 goblet squats\n• 15 kettlebell swings\n• 8 overhead presses (4 each arm)\n• Rest 90 sec\nFinish with light walking',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241330/mood_app/workout_images/kc1es3oi_kb_gorilla_row.jpg',
          intensityReason: 'Progressive flow builds kettlebell familiarity with control.',
          moodTips: [
            {
              icon: 'body',
              title: 'Press Technique',
              description: 'Elbows tucked on presses.'
            },
            {
              icon: 'flash',
              title: 'Swing Control',
              description: 'Control swing arc, no forward pull.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Kettlebell Ladder',
          duration: '20–24 min',
          description: 'Descending rep ladder: swings, cleans, snatches, squats, presses.\n\n ',
          battlePlan: 'Descending ladder (10-8-6-4-2):\n• Kettlebell swings\n• Single-arm cleans (alternating)\n• Snatches (alternating)\n• Goblet squats\n• Overhead presses\nRest 90 sec between rounds',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241330/mood_app/workout_images/kc1es3oi_kb_gorilla_row.jpg',
          intensityReason: 'Complex ladder challenges coordination and strength.',
          moodTips: [
            {
              icon: 'body',
              title: 'Clean Technique',
              description: 'Rotate wrist under on cleans to protect forearm.'
            },
            {
              icon: 'refresh',
              title: 'Breathing Control',
              description: 'Exhale at top of snatch/press for core stability.'
            }
          ]
        },
        {
          name: 'Kettlebell Tabata',
          duration: '16 min',
          description: 'Tabata: swings, squats, lunges, and high pulls.\n\n ',
          battlePlan: 'Perform 4 Tabata rounds (20 sec work, 10 sec rest):\nRound 1: Kettlebell swings\nRound 2: Goblet squats\nRound 3: Reverse lunges\nRound 4: High pulls\nRest 2 min between rounds',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241330/mood_app/workout_images/kc1es3oi_kb_gorilla_row.jpg',
          intensityReason: 'High-intensity intervals push cardiovascular limits.',
          moodTips: [
            {
              icon: 'body',
              title: 'Form Under Fatigue',
              description: 'Keep spine neutral under fatigue.'
            },
            {
              icon: 'flash',
              title: 'Glute Engagement',
              description: 'Drive glutes in squats/lunges.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Kettlebell Complex',
          duration: '25–26 min',
          description: 'Full-body complex: swing, clean, squat, press, and snatch.\n\n ',
          battlePlan: 'Perform 5 rounds without putting bell down:\n• 5 swings\n• 5 cleans\n• 5 front squats\n• 5 presses\n• 5 snatches\nRest 2 min between rounds\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241330/mood_app/workout_images/kc1es3oi_kb_gorilla_row.jpg',
          intensityReason: 'Advanced complex demands mastery with minimal rest.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Flow Efficiency',
              description: 'Flow smoothly with no pauses.'
            },
            {
              icon: 'body',
              title: 'Bell Control',
              description: 'Core tight; bell stays close.'
            }
          ]
        },
        {
          name: 'Kettlebell AMRAP',
          duration: '15 min',
          description: 'AMRAP: double swings, snatches, jump squats, and Turkish get-ups.\n\n ',
          battlePlan: 'AMRAP for 15 minutes:\n• 10 double kettlebell swings\n• 8 alternating snatches (4 each)\n• 12 goblet jump squats\n• 2 Turkish get-ups (1 each side)\nScore total rounds + reps',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241330/mood_app/workout_images/kc1es3oi_kb_gorilla_row.jpg',
          intensityReason: 'Maximum intensity AMRAP combines power, agility, and movement.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Double Swing Power',
              description: 'Double swings—engage lats, neutral wrists.'
            },
            {
              icon: 'body',
              title: 'Turkish Get-up Control',
              description: 'Turkish get-up—go slow, stack joints overhead.'
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
          name: 'Barbell Metcon',
          duration: '12–15 min',
          description: 'Metabolic conditioning: deadlifts, front squats, and push presses.\n\n ',
          battlePlan: 'Perform 3 rounds:\n• 8 barbell deadlifts\n• 6 front squats\n• 4 push presses\n• Rest 90 sec\nFinish with light walking',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241246/mood_app/workout_images/eubpjqb9_bb_row.jpg',
          intensityReason: 'Light barbell introduction focuses on proper movement patterns.',
          moodTips: [
            {
              icon: 'body',
              title: 'Deadlift Form',
              description: 'Deadlift—bar close, hips hinge, not squat.'
            },
            {
              icon: 'fitness',
              title: 'Front Squat Technique',
              description: 'Front squat—elbows high, bar rests on shoulders.'
            }
          ]
        },
        {
          name: 'Barbell Cardio Flow',
          duration: '14–16 min',
          description: 'Full-body flow: cleans, presses, back squats, and rows.\n\n ',
          battlePlan: 'Perform 3 rounds:\n• 5 power cleans\n• 5 overhead presses\n• 5 back squats\n• 5 bent-over rows\n• Rest 2 min\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241246/mood_app/workout_images/eubpjqb9_bb_row.jpg',
          intensityReason: 'Smooth barbell flow teaches compound movement coordination.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Clean Technique',
              description: 'Cleans—triple extension, chest tall on catch.'
            },
            {
              icon: 'body',
              title: 'Row Form',
              description: 'Rows—flat back, elbows sweep to ribs.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Barbell Complex',
          duration: '28–30 min',
          description: 'Full-body complex: deadlifts, cleans, squats, presses, rows.\n\n ',
          battlePlan: 'Perform 5 rounds without dropping bar:\n• 5 deadlifts\n• 5 power cleans\n• 5 front squats\n• 5 push presses\n• 5 bent-over rows\nRest 2 min between rounds',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241246/mood_app/workout_images/eubpjqb9_bb_row.jpg',
          intensityReason: 'Challenging barbell complex requires strength and endurance.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Grip Efficiency',
              description: 'Hook grip saves grip fatigue.'
            },
            {
              icon: 'refresh',
              title: 'Breathing Strategy',
              description: 'Breathe out strongly on presses/squats.'
            }
          ]
        },
        {
          name: 'Barbell EMOM',
          duration: '12 min',
          description: 'EMOM: thrusters and sumo deadlift high pulls.\n\n ',
          battlePlan: 'Every minute on the minute for 12 minutes:\n• Minute 1: 8 barbell thrusters\n• Minute 2: 6 sumo deadlift high pulls\nRepeat alternating pattern\nRest remaining time in each minute',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241246/mood_app/workout_images/eubpjqb9_bb_row.jpg',
          intensityReason: 'Time-constrained intervals build power endurance.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Thruster Power',
              description: 'Thrusters—ride squat bounce into press.'
            },
            {
              icon: 'trending-up',
              title: 'High Pull Technique',
              description: 'High pulls—elbows above wrists, bar stays close.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Barbell Ladder',
          duration: '20–24 min',
          description: 'Descending rep ladder: cleans, jerks, squats, and burpees.\n\n ',
          battlePlan: 'Descending ladder (10-9-8-7-6-5-4-3-2-1):\n• Power cleans\n• Push jerks\n• Back squats\n• Barbell burpees\nRest 2 min every 3 rounds\nFinish when all rounds complete',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241246/mood_app/workout_images/eubpjqb9_bb_row.jpg',
          intensityReason: 'Advanced ladder requires explosive power and conditioning.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Power Clean Form',
              description: 'Power clean—catch low, chest tall, core braced.'
            },
            {
              icon: 'body',
              title: 'Burpee Control',
              description: 'Burpees—land flat-foot, avoid toe springing.'
            }
          ]
        },
        {
          name: 'Barbell AMRAP',
          duration: '15 min',
          description: 'AMRAP: deadlifts, cleans, presses, back squats, and burpees.\n\n ',
          battlePlan: 'AMRAP for 15 minutes:\n• 8 barbell deadlifts\n• 6 power cleans\n• 4 overhead presses\n• 6 back squats\n• 8 barbell burpees\nScore total rounds + reps',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241246/mood_app/workout_images/eubpjqb9_bb_row.jpg',
          intensityReason: 'High-intensity AMRAP tests maximum work capacity.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Barbell Efficiency',
              description: 'Cycle barbell smoothly, minimize bar resets.'
            },
            {
              icon: 'flash',
              title: 'Breathing Management',
              description: 'Burpees—steady breathing, don\'t over gas.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Med balls',
    icon: 'basketball',
    workouts: {
      beginner: [
        {
          name: 'Cardio Circuit',
          duration: '12–16 min',
          description: 'Full-body circuit: wall balls, slams, and Russian twists.\n\n ',
          battlePlan: 'Perform 4 rounds:\n• 10 wall balls (10 ft target)\n• 8 medicine ball slams\n• 16 Russian twists\n• Rest 60 sec\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241313/mood_app/workout_images/8o6c10d2_med_bal_crunch_twists.jpg',
          intensityReason: 'Perfect beginner medicine ball introduction with mechanics.',
          moodTips: [
            {
              icon: 'eye',
              title: 'Wall Ball Precision',
              description: 'Target eye-level mark on wall; catch ball in deep squat position with chest tall and arms extended.'
            },
            {
              icon: 'body',
              title: 'Slam Mechanics',
              description: 'Drive through hips on slams; keep spine neutral and engage core throughout entire movement pattern.'
            }
          ]
        },
        {
          name: 'Med Ball Flow',
          duration: '12–15 min',
          description: 'Full-body flow: chest passes, overhead throws, and squat-to-press.\n\n ',
          battlePlan: 'Perform 3 rounds:\n• 10 chest passes (against wall)\n• 8 overhead throws (against wall)\n• 6 squat-to-press\n• Rest 90 sec\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241313/mood_app/workout_images/8o6c10d2_med_bal_crunch_twists.jpg',
          intensityReason: 'Progressive flow builds upper body power and coordination.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Explosive Power Development',
              description: 'Drive chest passes with full arm extension and core engagement; focus on powerful hip drive rather than arm strength alone.'
            },
            {
              icon: 'refresh',
              title: 'Balance and Control',
              description: 'Single-leg RDL—keep standing leg strong, control the descent and maintain neutral spine throughout entire range of motion.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Medicine Ball AMRAP',
          duration: '10 min',
          description: 'AMRAP: wall balls, slams, and overhead lunges.\n\n ',
          battlePlan: 'AMRAP for 10 minutes:\n• 12 wall balls (10 ft target)\n• 10 medicine ball slams\n• 8 overhead lunges (4 each leg)\nScore total rounds + reps',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241313/mood_app/workout_images/8o6c10d2_med_bal_crunch_twists.jpg',
          intensityReason: 'Intermediate AMRAP challenges cardiovascular capacity and power.',
          moodTips: [
            {
              icon: 'body',
              title: 'Overhead Lunge Stability',
              description: 'Lock arms overhead during lunges; maintain vertical torso and control knee tracking over toes throughout entire range.'
            },
            {
              icon: 'refresh',
              title: 'Power Generation',
              description: 'Drive slam power from hip hinge, not arms; exhale forcefully on impact and maintain core tension throughout.'
            }
          ]
        },
        {
          name: 'Tabata',
          duration: '16 min',
          description: 'Tabata: wall balls, slams, rotational throws, and squat-to-press.\n\n ',
          battlePlan: 'Perform 4 Tabata rounds (20 sec work, 10 sec rest):\nRound 1: Wall balls\nRound 2: Medicine ball slams\nRound 3: Overhead lunges\nRound 4: Russian twists\nRest 2 min between rounds',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241313/mood_app/workout_images/8o6c10d2_med_bal_crunch_twists.jpg',
          intensityReason: 'Advanced Tabata maximizes anaerobic power development.',
          moodTips: [
            {
              icon: 'eye',
              title: 'Wall Ball Consistency',
              description: 'Maintain target accuracy throughout intervals; catch ball in full squat and reset posture between every repetition.'
            },
            {
              icon: 'refresh',
              title: 'Rotational Power Safety',
              description: 'Pivot from feet during rotational throws, never from knees; engage obliques and maintain strong core connection.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Medicine Ball Complex',
          duration: '16–20 min',
          description: 'Full-body complex: wall balls, slams, rotations, and burpee slams.\n\n ',
          battlePlan: 'Perform 4 rounds without dropping ball:\n• 8 wall balls\n• 8 overhead throws\n• 8 slam-to-burpee\n• 8 rotational throws (4 each side)\n• Rest 2 min\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241313/mood_app/workout_images/8o6c10d2_med_bal_crunch_twists.jpg',
          intensityReason: 'Elite complex demands maximal power and metabolic conditioning.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Rotational Power Mechanics',
              description: 'Generate rotation from hip drive and core; pivot feet fully and maintain strong oblique engagement throughout entire throwing motion.'
            },
            {
              icon: 'body',
              title: 'Burpee-Slam Integration',
              description: 'Maintain neutral spine during slam pickup; explode up from burpee position and immediately engage core for powerful slam.'
            }
          ]
        },
        {
          name: 'Med Ball Sprint Circuit',
          duration: '20–25 min',
          description: 'Sprint circuit: wall balls, slams, and sprints with the ball.\n\n ',
          battlePlan: '• 5 min dynamic warm-up\n• 3 rounds:\n  - 10 wall balls\n  - 10 slams\n  - 20m sprint with ball\n  - 30 sec rest\n• 5 min cool-down',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241313/mood_app/workout_images/8o6c10d2_med_bal_crunch_twists.jpg',
          intensityReason: 'Peak circuit integrates medicine ball power with sprints.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Sprint Stability Control',
              description: 'Maintain ball close to chest during forward sprints; keep core tight and avoid excessive vertical bounce for efficiency.'
            },
            {
              icon: 'refresh',
              title: 'Multi-Directional Transitions',
              description: 'Reset body position between movement directions; engage stabilizer muscles and maintain ball control through all planes of motion.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Slam balls',
    icon: 'basketball',
    workouts: {
      beginner: [
        {
          name: 'Slam Ball Basics',
          duration: '12–16 min',
          description: 'Foundational slams, squat-to-press, and lunges.\n\n ',
          battlePlan: 'Perform 4 rounds:\n• 10 overhead slams\n• 8 side slams (4 each side)\n• 6 squat slams\n• Rest 60 sec\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241313/mood_app/workout_images/8o6c10d2_med_bal_crunch_twists.jpg',
          intensityReason: 'Introduction to slam ball fundamentals with proper mechanics.',
          moodTips: [
            {
              icon: 'body',
              title: 'Safe Pickup',
              description: 'Pick up via squat, not back bend.'
            },
            {
              icon: 'fitness',
              title: 'Lunge Position',
              description: 'Lunges—ball close, posture upright.'
            }
          ]
        },
        {
          name: 'Slam Ball Flow',
          duration: '12–15 min',
          description: 'Full-body flow: slams, overhead throws, and Russian twists.\n\n ',
          battlePlan: 'Perform 3 rounds:\n• 8 overhead slams\n• 6 rotational slams (3 each side)\n• 4 slam-to-squat\n• Rest 90 sec\nFinish with light walking',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241313/mood_app/workout_images/8o6c10d2_med_bal_crunch_twists.jpg',
          intensityReason: 'Movement progression adds overhead power and core rotation.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Overhead Safety',
              description: 'OH throw—legs drive, avoid spine arch.'
            },
            {
              icon: 'refresh',
              title: 'Core Rotation',
              description: 'Twists—rotate torso, not just arms.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Slam Ball AMRAP',
          duration: '10 min',
          description: 'AMRAP: slams, lateral slams, and squat jumps.\n\n ',
          battlePlan: 'AMRAP for 10 minutes:\n• 12 overhead slams\n• 10 side-to-side slams\n• 8 slam-to-burpee\nScore total rounds + reps',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241313/mood_app/workout_images/8o6c10d2_med_bal_crunch_twists.jpg',
          intensityReason: 'High-intensity AMRAP with lateral movement and plyometrics.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Lateral Slam Safety',
              description: 'Lateral slams—pivot hips fully, protect knees.'
            },
            {
              icon: 'body',
              title: 'Jump Landing',
              description: 'Land squat jumps softly, chest tall.'
            }
          ]
        },
        {
          name: 'Slam Ball Tabata',
          duration: '16 min',
          description: 'Tabata: slams, squat-to-press, lateral slams, and burpee slams.\n\n ',
          battlePlan: 'Perform 4 Tabata rounds (20 sec work, 10 sec rest):\nRound 1: Overhead slams\nRound 2: Side slams\nRound 3: Squat slams\nRound 4: Slam burpees\nRest 2 min between rounds',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241313/mood_app/workout_images/8o6c10d2_med_bal_crunch_twists.jpg',
          intensityReason: 'Intense Tabata pushes anaerobic power with explosive slams.',
          moodTips: [
            {
              icon: 'body',
              title: 'Burpee Form',
              description: 'Burpee-slam—ball set dead center before drop.'
            },
            {
              icon: 'refresh',
              title: 'Control Descent',
              description: 'Exhale sharply with each overhead drive.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Slam Ball Complex',
          duration: '20–24 min',
          description: 'Full-body complex: slams, lateral slams, burpee slams, and throws.\n\n ',
          battlePlan: 'Perform 5 rounds:\n• 15 overhead slams\n• 12 rotational slams (6 each side)\n• 10 slam-to-burpee\n• 8 single-arm slams (4 each)\n• Rest 90 sec\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241313/mood_app/workout_images/8o6c10d2_med_bal_crunch_twists.jpg',
          intensityReason: 'Advanced complex demands maximum power with varied slams.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Explosive Power',
              description: 'Lateral slams—generate power from sides of core.'
            },
            {
              icon: 'body',
              title: 'Overhead Throw Power',
              description: 'OH throw—hips snap, arms guide.'
            }
          ]
        },
        {
          name: 'Slam Ball Sprint Circuit',
          duration: '20–25 min',
          description: 'Sprint circuit: slams, lateral slams, and sprints with the ball.\n\n ',
          battlePlan: 'AMRAP for 12 minutes:\n• 10 overhead slams\n• 8 side-to-side slams\n• 6 slam-to-burpee\n• 4 single-arm slams (2 each)\nScore total rounds + reps',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241313/mood_app/workout_images/8o6c10d2_med_bal_crunch_twists.jpg',
          intensityReason: 'Peak performance circuit combines slam ball power with sprints.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Sprint Control',
              description: 'Sprint holding ball high and tight to chest.'
            },
            {
              icon: 'refresh',
              title: 'Quick Resets',
              description: 'Reset stance instantly after each slam.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Battle ropes',
    icon: 'git-compare',
    workouts: {
      beginner: [
        {
          name: 'Rope Waves & Slams',
          duration: '12–14 min',
          description: 'Cardio and power: alternating waves and double slams.\n\n ',
          battlePlan: 'Perform 4 rounds:\n• 30 sec alternating waves\n• 20 sec slams\n• 30 sec side-to-side waves\n• Rest 90 sec\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241283/mood_app/workout_images/baf95b3k_ChatGPT_Image_Feb_1_2026_09_39_15_PM.jpg',
          intensityReason: 'Introduction to battle rope fundamentals with manageable ratios.',
          moodTips: [
            {
              icon: 'body',
              title: 'Athletic Stance',
              description: 'Hips and core engaged, knees bent.'
            },
            {
              icon: 'refresh',
              title: 'Power Breathing',
              description: 'Exhale with impact on each slam.'
            }
          ]
        },
        {
          name: 'Rope Circuit',
          duration: '12–15 min',
          description: 'Full-body circuit: waves, side-to-side waves, and slams.\n\n ',
          battlePlan: 'Perform 4 rounds:\n• 20s waves\n• 20s side-to-side waves\n• 20s slams\n• Rest 1 min\nFinish with light walking',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241283/mood_app/workout_images/baf95b3k_ChatGPT_Image_Feb_1_2026_09_39_15_PM.jpg',
          intensityReason: 'Varied rope movements building coordination and endurance.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Rope Control',
              description: 'Maintain steady rope slack.'
            },
            {
              icon: 'body',
              title: 'Shoulder Position',
              description: 'Relax shoulders, no trap shrugging.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Battle Rope Tabata',
          duration: '16 min',
          description: 'Tabata: waves, slams, circles, and jumping jacks.\n\n ',
          battlePlan: '20s work / 10s rest alternating:\n• Waves\n• Slams\n• Circles\n• Jumping jacks\nRepeat 4 rounds each (16 intervals)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241283/mood_app/workout_images/baf95b3k_ChatGPT_Image_Feb_1_2026_09_39_15_PM.jpg',
          intensityReason: 'High-intensity Tabata with varied rope movements for max cardio.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Core Power',
              description: 'Generate force from hips/core, not just arms.'
            },
            {
              icon: 'refresh',
              title: 'Maintain Volume',
              description: 'Keep efforts sharp—focus on short bursts.'
            }
          ]
        },
        {
          name: 'Rope & Burpee Combo',
          duration: '20–22 min',
          description: 'Cardio and power: waves, slams, and burpees.\n\n ',
          battlePlan: 'Perform 4 rounds:\n• 30s waves\n• 5 burpees\n• 30s slams\n• 5 burpees\n• Rest 1 min\nFinish when all rounds complete',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241283/mood_app/workout_images/baf95b3k_ChatGPT_Image_Feb_1_2026_09_39_15_PM.jpg',
          intensityReason: 'Combination training adds bodyweight movements to rope work.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Quick Transitions',
              description: 'Transition rope-to-burpee fluidly.'
            },
            {
              icon: 'body',
              title: 'Landing Control',
              description: 'Land gently on each burpee push.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Battle Rope Gauntlet',
          duration: '24–26 min',
          description: 'Full-body gauntlet: waves, slams, side-to-sides, jacks, circles.\n\n ',
          battlePlan: 'Perform 4 rounds:\n• 30s waves\n• 30s slams\n• 30s side-to-sides\n• 30s jacks\n• 30s circles\n• Rest 1 min\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241283/mood_app/workout_images/baf95b3k_ChatGPT_Image_Feb_1_2026_09_39_15_PM.jpg',
          intensityReason: 'Extended gauntlet tests advanced cardiovascular capacity.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Rhythm Control',
              description: 'Keep steady rhythm across all rope patterns.'
            },
            {
              icon: 'flash',
              title: 'Breathing Technique',
              description: 'Sync breathing pattern with wave count.'
            }
          ]
        },
        {
          name: 'Rope & Sprint Circuit',
          duration: '20–25 min',
          description: 'Sprint circuit: waves, slams, and sprints.\n\n ',
          battlePlan: 'Perform 5 rounds:\n• 20s waves\n• 20m sprint\n• 20s slams\n• 20m sprint\n• Rest 1 min\nFinish when all rounds complete',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241283/mood_app/workout_images/baf95b3k_ChatGPT_Image_Feb_1_2026_09_39_15_PM.jpg',
          intensityReason: 'Ultimate circuit combines rope power with sprint speed.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Sprint Form',
              description: 'Sprints—tall posture, full arm drive.'
            },
            {
              icon: 'refresh',
              title: 'Maximum Effort',
              description: 'Commit max intensity in rope bursts before each sprint.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Sled',
    icon: 'triangle',
    workouts: {
      beginner: [
        {
          name: 'Sled Push & Pull',
          duration: '12–15 min',
          description: 'Foundational sled pushes and backward pulls.\n\n ',
          battlePlan: 'Perform 5 rounds:\n• 10m push (light)\n• 10m backward pull\n• Rest 1 min\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/video/upload/so_1.0,w_720,c_fill,q_auto,f_jpg/exercise_library/sled_push.jpg',
          intensityReason: 'Introduction to sled training with proper mechanics.',
          moodTips: [
            {
              icon: 'body',
              title: 'Push Angle',
              description: 'Push at ~45° lean, arms straight.'
            },
            {
              icon: 'flash',
              title: 'Pull Technique',
              description: 'Backward pulls—fast, short steps.'
            }
          ]
        },
        {
          name: 'Sled March',
          duration: '12–16 min',
          description: 'Slow, controlled sled pushes and pulls for strength.\n\n ',
          battlePlan: 'Perform 4 rounds:\n• 15m slow push (heavy)\n• 15m backward pull (controlled)\n• Rest 90 sec\nFinish with light walking',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/video/upload/so_1.0,w_720,c_fill,q_auto,f_jpg/exercise_library/sled_pull.jpg',
          intensityReason: 'Controlled movements building strength endurance and mechanics.',
          moodTips: [
            {
              icon: 'body',
              title: 'Heel Drive',
              description: 'Heel-to-toe push, core braced.'
            },
            {
              icon: 'refresh',
              title: 'Core Stability',
              description: 'Chest upright on pulls, no leaning back.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Sled Sprint Intervals',
          duration: '20 min',
          description: 'High-intensity sled sprint pushes with active recovery.\n\n ',
          battlePlan: 'Perform 6 rounds:\n• 20m sled sprint (light load)\n• Walk back recovery\n• Rest 45 sec\nFinish with cool-down walk',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/video/upload/so_1.0,w_720,c_fill,q_auto,f_jpg/exercise_library/sled_push.jpg',
          intensityReason: 'Power sprint intervals build explosive leg drive.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Explosive Drive',
              description: 'Explode forward with leg drive.'
            },
            {
              icon: 'body',
              title: 'Sprint Mechanics',
              description: 'Keep steps short and rapid.'
            }
          ]
        },
        {
          name: 'Push & Drag Circuit',
          duration: '20–22 min',
          description: 'Full-body circuit: pushes, backward drags, and lateral pushes.\n\n ',
          battlePlan: 'Perform 4 rounds:\n• 15m forward push\n• 15m backward drag\n• 15m lateral push (each side)\n• Rest 2 min\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/video/upload/so_1.0,w_720,c_fill,q_auto,f_jpg/exercise_library/sled_drag.jpg',
          intensityReason: 'Multi-directional sled work challenges different patterns.',
          moodTips: [
            {
              icon: 'body',
              title: 'Sideways Technique',
              description: 'Sideways—hips square, shuffles controlled.'
            },
            {
              icon: 'refresh',
              title: 'Drag Position',
              description: 'Backward drag—knees bent, chest tall.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Sled Gauntlet',
          duration: '24–28 min',
          description: 'Full-body gauntlet: heavy pushes, sprints, drags, and lateral pushes.\n\n ',
          battlePlan: 'Perform 5 rounds:\n• 20m heavy push\n• 15m sprint push (light)\n• 15m backward drag\n• 10m lateral pushes (each side)\n• Rest 2 min\nFinish when complete',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/video/upload/so_1.0,w_720,c_fill,q_auto,f_jpg/exercise_library/sled_push.jpg',
          intensityReason: 'Advanced gauntlet combines max load with speed work.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Heavy Load Technique',
              description: 'Heavy pushes—glutes and hamstrings drive.'
            },
            {
              icon: 'refresh',
              title: 'Fast Transitions',
              description: 'Transition quickly for conditioning effect.'
            }
          ]
        },
        {
          name: 'Sled & Burpee Circuit',
          duration: '24–26 min',
          description: 'Strength and cardio: heavy pushes, drags, and burpees.\n\n ',
          battlePlan: 'Perform 3 rounds:\n• 10m max effort push\n• 20m sprint push\n• 15m single-arm drag (each arm)\n• 10 sled jumpovers\n• Rest 3 min\nFinish with walk',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/video/upload/so_1.0,w_720,c_fill,q_auto,f_jpg/exercise_library/sled_drag.jpg',
          intensityReason: 'Ultimate challenge combining heavy sled work with burpees.',
          moodTips: [
            {
              icon: 'body',
              title: 'Burpee Transition',
              description: 'Drop tight into burpees—no sagging hips.'
            },
            {
              icon: 'flash',
              title: 'Reset Power',
              description: 'Push explosively out of burpees.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Resistance bands',
    icon: 'remove',
    workouts: {
      beginner: [
        {
          name: 'Band Cardio Circuit',
          duration: '12–15 min',
          description: 'Full-body circuit: banded squats, rows, and chest presses.\n\n ',
          battlePlan: 'Perform 3 rounds:\n• 10 banded squats (band around lower thighs, just above knees)\n• 10 band rows (anchor band at chest height, pull toward torso)\n• 10 band chest presses (anchor band behind you at chest level, press forward)\n• Rest 1 min\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241330/mood_app/workout_images/3aciwkyi_assisted_pull_ups.jpg',
          intensityReason: 'Perfect introduction to resistance bands with simple movements.',
          moodTips: [
            {
              icon: 'body',
              title: 'Squat Form',
              description: 'Push knees outward into band for proper alignment.'
            },
            {
              icon: 'flash',
              title: 'Row Technique',
              description: 'Drive elbows to ribs for maximum back engagement.'
            }
          ]
        },
        {
          name: 'Band Walks & Presses',
          duration: '12–15 min',
          description: 'Lower body and upper body: lateral walks and overhead presses.\n\n ',
          battlePlan: 'Perform 4 rounds:\n• 10 lateral walks (each direction with band around ankles)\n• 8 overhead presses (hold band overhead, press arms apart)\n• 6 band pull-aparts (at chest level)\n• Rest 75 sec\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241330/mood_app/workout_images/3aciwkyi_assisted_pull_ups.jpg',
          intensityReason: 'Focus on glute activation and shoulder stability.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Lateral Walk Form',
              description: 'Keep knees bent with constant tension throughout movement.'
            },
            {
              icon: 'body',
              title: 'Press Stability',
              description: 'Brace abs and avoid arching back during overhead movement.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Band Tabata',
          duration: '16 min',
          description: 'Tabata: squat jumps, push-ups, rows, and mountain climbers.\n\n ',
          battlePlan: 'Perform 4 Tabata rounds (20 sec work, 10 sec rest):\nRound 1: Band squat jumps\nRound 2: Band-assisted push-ups\nRound 3: Band rows\nRound 4: Mountain climbers with band\nRest 2 min between rounds',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241330/mood_app/workout_images/3aciwkyi_assisted_pull_ups.jpg',
          intensityReason: 'High-intensity Tabata maximizes anaerobic power.',
          moodTips: [
            {
              icon: 'body',
              title: 'Jump Control',
              description: 'Stay light when jumping to maintain form under fatigue.'
            },
            {
              icon: 'flash',
              title: 'Row Focus',
              description: 'Squeeze shoulder blades every pull for maximum activation.'
            }
          ]
        },
        {
          name: 'Band Sprint Circuit',
          duration: '20–22 min',
          description: 'Sprint circuit: squat jumps, band sprints, and push-ups.\n\n ',
          battlePlan: 'Perform 5 rounds:\n• 10 band squat jumps (band around thighs)\n• 20m band sprints (attached to anchor)\n• 8 band-assisted push-ups\n• Rest 90 sec\nFinish when all rounds complete',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241330/mood_app/workout_images/3aciwkyi_assisted_pull_ups.jpg',
          intensityReason: 'Power circuit combines plyometrics with sprint mechanics.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Sprint Setup',
              description: 'Anchor bands safely to a heavy rack or fixed post.'
            },
            {
              icon: 'body',
              title: 'Sprint Mechanics',
              description: 'Sprint with forward lean and strong arm drive.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Band Complex',
          duration: '20–22 min',
          description: 'Full-body complex: squat jumps, push-ups, sprints, and burpees.\n\n ',
          battlePlan: 'Perform 4 rounds:\n• 12 band squat jumps\n• 10 band-assisted push-ups\n• 20m band sprints\n• 8 band burpees (band around ankles)\n• Rest 2 min\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241330/mood_app/workout_images/3aciwkyi_assisted_pull_ups.jpg',
          intensityReason: 'Elite complex demands maximal power through movements.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Tension Control',
              description: 'Maintain controlled band tension every move.'
            },
            {
              icon: 'body',
              title: 'Recoil Management',
              description: 'Don\'t let band snap on release to prevent injury.'
            }
          ]
        },
        {
          name: 'Band & Plyo Circuit',
          duration: '20–22 min',
          description: 'Plyometric circuit: jump lunges, mountain climbers, rows, and push-ups.\n\n ',
          battlePlan: 'AMRAP for 20 minutes:\n• 10 jump lunges with band (band around ankles)\n• 20 mountain climbers with band around feet\n• 15 band rows\n• 8 explosive push-ups with band\nScore total rounds + reps',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241330/mood_app/workout_images/3aciwkyi_assisted_pull_ups.jpg',
          intensityReason: 'Advanced plyometrics combines explosive movements.',
          moodTips: [
            {
              icon: 'body',
              title: 'Landing Mechanics',
              description: 'Land softly with knees stacked under hips.'
            },
            {
              icon: 'refresh',
              title: 'Core Stability',
              description: 'Brace core firmly during push-ups for max activation.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Sledge hammer & tire',
    icon: 'hammer',
    workouts: {
      beginner: [
        {
          name: 'Hammer Basics',
          duration: '12–15 min',
          description: 'Foundational hammer strikes and tire step-ups.\n\n ',
          battlePlan: 'Perform 3 rounds:\n• 10 hammer strikes (each side)\n• 10 tire step-ups\n• Rest 1 min\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241283/mood_app/workout_images/qzdq0zi2_ChatGPT_Image_Feb_1_2026_09_31_56_PM.jpg',
          intensityReason: 'Perfect introduction to sledgehammer training mechanics.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Strike Technique',
              description: 'Slide top hand down handle to maximize strike power.'
            },
            {
              icon: 'body',
              title: 'Step-up Form',
              description: 'Place whole foot on tire during step-ups for stability.'
            }
          ]
        },
        {
          name: 'Hammer & March',
          duration: '12–16 min',
          description: 'Hammer strikes and tire toe taps for power and agility.\n\n ',
          battlePlan: 'Perform 4 rounds:\n• 8 hammer strikes (each side)\n• 20 tire toe taps\n• 6 tire step-overs\n• Rest 75 sec\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241283/mood_app/workout_images/qzdq0zi2_ChatGPT_Image_Feb_1_2026_09_31_56_PM.jpg',
          intensityReason: 'Progressive coordination workout builds striking power.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Hip Power',
              description: 'Hip whip generates speed for more powerful strikes.'
            },
            {
              icon: 'body',
              title: 'Footwork',
              description: 'Toe taps: fast, rhythmic footwork for agility development.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Hammer & Burpee Circuit',
          duration: '18–20 min',
          description: 'Power and cardio: hammer strikes, burpees, and tire jumps.\n\n ',
          battlePlan: 'Perform 5 rounds:\n• 10 hammer strikes (alternating sides)\n• 5 burpees\n• 8 tire jumps\n• Rest 90 sec\nFinish when all rounds complete',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241283/mood_app/workout_images/qzdq0zi2_ChatGPT_Image_Feb_1_2026_09_31_56_PM.jpg',
          intensityReason: 'Intermediate circuit combines sledgehammer with plyometrics.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Strike Power',
              description: 'Rotate hips and snap wrists powerfully for maximum impact.'
            },
            {
              icon: 'body',
              title: 'Jump Landing',
              description: 'Land softly on tire jumps to reduce impact fatigue.'
            }
          ]
        },
        {
          name: 'Hammer Tabata',
          duration: '16–18 min',
          description: 'Tabata: intense hammer strikes for power endurance.\n\n ',
          battlePlan: 'Perform 4 Tabata rounds (20 sec work, 10 sec rest):\nRound 1: Right side strikes\nRound 2: Left side strikes\nRound 3: Overhead strikes\nRound 4: Alternating strikes\nRest 2 min between rounds',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241283/mood_app/workout_images/qzdq0zi2_ChatGPT_Image_Feb_1_2026_09_31_56_PM.jpg',
          intensityReason: 'High-intensity Tabata develops sledgehammer power endurance.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Hip Snap',
              description: 'Aggressive hip snap maximizes strike power under fatigue.'
            },
            {
              icon: 'refresh',
              title: 'Breathing',
              description: 'Exhale with each swing for rhythm and power.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Hammer Gauntlet',
          duration: '20–24 min',
          description: 'Full-body gauntlet: strikes, tire jumps, burpees, and tire flips.\n\n ',
          battlePlan: 'Perform 4 rounds:\n• 15 hammer strikes (alternating sides)\n• 8 tire jumps\n• 6 burpees\n• 3 tire flips (small tire)\n• Rest 2 min\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241283/mood_app/workout_images/qzdq0zi2_ChatGPT_Image_Feb_1_2026_09_31_56_PM.jpg',
          intensityReason: 'Elite complex demands maximum striking power and strength.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Core Stability',
              description: 'Brace core during flips for maximum power transfer.'
            },
            {
              icon: 'body',
              title: 'Impact Management',
              description: 'Land lightly to reduce fatigue impact throughout rounds.'
            }
          ]
        },
        {
          name: 'Hammer & Sprint Circuit',
          duration: '20–25 min',
          description: 'Sprint circuit: hammer strikes, tire jumps, and sprints.\n\n ',
          battlePlan: 'Perform 5 rounds:\n• 12 hammer strikes (6 each side)\n• 20m sprint\n• 6 tire jumps\n• 20m sprint\n• Rest 2 min\nFinish when all rounds complete',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241283/mood_app/workout_images/qzdq0zi2_ChatGPT_Image_Feb_1_2026_09_31_56_PM.jpg',
          intensityReason: 'Peak conditioning integrates sledgehammer power with sprints.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Grip Reset',
              description: 'Reset grip each strike for consistent power output.'
            },
            {
              icon: 'refresh',
              title: 'Sprint Form',
              description: 'Sprint tall with full arm pump for maximum speed.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Flipping tire',
    icon: 'ellipse',
    workouts: {
      beginner: [
        {
          name: 'Tire Flip & Step',
          duration: '12–15 min',
          description: 'Foundational tire flips and step-ups for strength.\n\n ',
          battlePlan: 'Perform 4 rounds:\n• 5 tire flips\n• 8 tire step-ups (each leg)\n• Rest 90 sec\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241283/mood_app/workout_images/qzdq0zi2_ChatGPT_Image_Feb_1_2026_09_31_56_PM.jpg',
          intensityReason: 'Perfect introduction to tire flipping with proper mechanics.',
          moodTips: [
            {
              icon: 'body',
              title: 'Flip Mechanics',
              description: 'Keep chest tight to tire, drive with hips for power.'
            },
            {
              icon: 'flash',
              title: 'Step-up Form',
              description: 'Place full foot on tire for step-ups with control.'
            }
          ]
        },
        {
          name: 'Tire Flip & Tap',
          duration: '12–16 min',
          description: 'Tire flips and toe taps for power and agility.\n\n ',
          battlePlan: 'Perform 4 rounds:\n• 6 tire flips\n• 20 tire toe taps\n• 5 tire step-overs\n• Rest 75 sec\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241283/mood_app/workout_images/qzdq0zi2_ChatGPT_Image_Feb_1_2026_09_31_56_PM.jpg',
          intensityReason: 'Progressive strength workout builds tire flipping power.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Hip Extension',
              description: 'Use full hip extension on flips for maximum power.'
            },
            {
              icon: 'body',
              title: 'Toe Tap Speed',
              description: 'Toe taps: quick and light for agility development.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Tire Flip & Jump',
          duration: '14–16 min',
          description: 'Tire flips and jumps for explosive power.\n\n ',
          battlePlan: 'Perform 5 rounds:\n• 4 tire flips\n• 6 tire jumps\n• 8 tire step-ups (alternating legs)\n• Rest 90 sec\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241283/mood_app/workout_images/qzdq0zi2_ChatGPT_Image_Feb_1_2026_09_31_56_PM.jpg',
          intensityReason: 'Intermediate circuit combines tire flipping with plyometrics.',
          moodTips: [
            {
              icon: 'body',
              title: 'Back Position',
              description: 'Keep back flat during flips for safety and power.'
            },
            {
              icon: 'flash',
              title: 'Jump Landing',
              description: 'Soft landings with bent knees to absorb impact.'
            }
          ]
        },
        {
          name: 'Tire Flip Circuit',
          duration: '14–18 min',
          description: 'Full-body circuit: tire flips, push-ups, and lateral jumps.\n\n ',
          battlePlan: 'Perform 4 rounds:\n• 6 tire flips\n• 8 tire push-ups (hands on tire)\n• 10 lateral jumps (side to side over tire)\n• Rest 2 min\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241283/mood_app/workout_images/qzdq0zi2_ChatGPT_Image_Feb_1_2026_09_31_56_PM.jpg',
          intensityReason: 'Strength circuit integrates tire manipulation with movements.',
          moodTips: [
            {
              icon: 'body',
              title: 'Push-up Stability',
              description: 'Push-ups: hands wide and stable on tire edge.'
            },
            {
              icon: 'flash',
              title: 'Lateral Movement',
              description: 'Lateral jumps: compact and quick for efficiency.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Tire Flip Gauntlet',
          duration: '20–22 min',
          description: 'Full-body gauntlet: flips, burpees, jumps, and push-ups.\n\n ',
          battlePlan: 'Perform 4 rounds:\n• 8 tire flips\n• 6 burpees\n• 10 tire jumps\n• 8 tire push-ups\n• Rest 2 min\nFinish with stretching',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241283/mood_app/workout_images/qzdq0zi2_ChatGPT_Image_Feb_1_2026_09_31_56_PM.jpg',
          intensityReason: 'Elite complex demands maximal tire flipping power.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Core Engagement',
              description: 'Core braced in flips, drive with legs for power.'
            },
            {
              icon: 'body',
              title: 'Pace Control',
              description: 'Control burpee pace to finish all rounds strong.'
            }
          ]
        },
        {
          name: 'Tire Flip & Sprint',
          duration: '20–22 min',
          description: 'Sprint circuit: tire flips and sprints for power endurance.\n\n ',
          battlePlan: 'Perform 5 rounds:\n• 6 tire flips\n• 40m sprint\n• 4 tire flips\n• 20m sprint\n• Rest 2 min\nFinish when all rounds complete',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241283/mood_app/workout_images/qzdq0zi2_ChatGPT_Image_Feb_1_2026_09_31_56_PM.jpg',
          intensityReason: 'Peak conditioning integrates tire manipulation with sprints.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Grip Position',
              description: 'Grip low under tire, chest close for optimal leverage.'
            },
            {
              icon: 'flash',
              title: 'Sprint Recovery',
              description: 'Sprint tall and relaxed after heavy tire flips.'
            }
          ]
        }
      ]
    }
  }
];
