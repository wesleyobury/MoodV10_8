import { EquipmentWorkouts } from '../types/workout';

export const lazyBodyweightDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Treadmill',
    icon: 'walk',
    workouts: {
      beginner: [
        {
          name: 'Easy Walk Intervals',
          duration: '8–10 min',
          description: 'Easy base with brief brisk pops; smooth steps and breaths.',
          battlePlan: '3 rounds\n• 2 min Easy Walk (RPE 3)\n• 1 min Brisk Walk (RPE 4)\nNo extra rest; repeat sequence continuously',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241046/mood_app/workout_images/0jyalb2d_download_26_.jpg',
          intensityReason: 'Gentle surges raise HR without impact or joint strain.',
          moodTips: [
            {
              icon: 'body',
              title: 'Light form',
              description: 'Keep shoulders relaxed and down, swing arms lightly, and use short quick strides to maintain momentum without overexertion'
            },
            {
              icon: 'leaf',
              title: 'Calm breathing',
              description: 'At RPE 3 breathe through your nose; at RPE 4 add mouth breathing while staying calm and controlled throughout'
            }
          ]
        },
        {
          name: 'Incline Cruise',
          duration: '8–10 min',
          description: 'Steady incline walk; relaxed shoulders; even cadence.',
          battlePlan: '1 set\n• 8–10 min Walk @ 3–5% incline (RPE 3–4)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241072/mood_app/workout_images/lcrp3pfp_download_27_.jpg',
          intensityReason: 'Mild grade adds work quietly with stable mechanics.',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Proper incline',
              description: 'Set treadmill to 3–5% grade, maintain upright posture, and avoid grabbing rails which reduces workout effectiveness'
            },
            {
              icon: 'footsteps',
              title: 'Quiet steps',
              description: 'Take shorter strides on the incline to keep footfalls quiet and even, reducing impact on joints'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Brisk Walk Pops',
          duration: '10–12 min',
          description: 'Easy base with 30s surges; smooth recoveries between.',
          battlePlan: '4 rounds\n• 2 min Easy (RPE 3)\n• 30s Brisk (RPE 5)\n• 30s Easy (RPE 3) to reset, then repeat',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241046/mood_app/workout_images/0jyalb2d_download_26_.jpg',
          intensityReason: 'Short brisk segments raise cadence and HR safely.',
          moodTips: [
            {
              icon: 'eye',
              title: 'Form focus',
              description: 'Keep your gaze forward at horizon level, hands relaxed not clenched, and focus on quick foot turnover during surges'
            },
            {
              icon: 'volume-low',
              title: 'Quiet contacts',
              description: 'During RPE 5 surges, aim to keep your footsteps quiet on the belt; recover fully at RPE 3 before the next burst'
            }
          ]
        },
        {
          name: 'Incline Switch-Ups',
          duration: '10–12 min',
          description: 'Change incline each minute; maintain easy comfortable pace.',
          battlePlan: '10–12 min continuous\n• Alternate each minute: 2% → 5% → 3% → 6% … (RPE 4–5)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241072/mood_app/workout_images/lcrp3pfp_download_27_.jpg',
          intensityReason: 'Alternating grades keep interest without impact load.',
          moodTips: [
            {
              icon: 'body',
              title: 'Stay tall',
              description: 'Maintain an upright torso throughout and shorten your stride length when the incline increases'
            },
            {
              icon: 'hand-right',
              title: 'No rails',
              description: 'Keep breathing calm and rhythmic; avoid holding the rails as this reduces calorie burn and core engagement'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Walk–Jog Sprinkle',
          duration: '12–14 min',
          description: 'Easy walk base with tiny jog sprinkles and soft landings.',
          battlePlan: '4 rounds\n• 2 min Easy Walk (RPE 3)\n• 30–45s Easy Jog (RPE 5–6)\nRepeat back-to-back; no extra rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241046/mood_app/workout_images/0jyalb2d_download_26_.jpg',
          intensityReason: 'Short jogs elevate HR while total fatigue stays low.',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Soft landings',
              description: 'Focus on landing softly with quiet steps during jog intervals; maintain a pace where you could still hold a conversation'
            },
            {
              icon: 'refresh',
              title: 'Stay flexible',
              description: 'Listen to your body—if needed, extend the walk portion or shorten the jog; the goal is to stay relaxed throughout'
            }
          ]
        },
        {
          name: 'Hill Breeze',
          duration: '12–14 min',
          description: 'One-minute hill efforts with flat recoveries; breathe calm.',
          battlePlan: '6 cycles continuous\n• 1 min @ 5–6% (RPE 5)\n• 1 min flat (RPE 3–4)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241072/mood_app/workout_images/lcrp3pfp_download_27_.jpg',
          intensityReason: 'Short hill rises engage legs gently without heavy load.',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Uphill technique',
              description: 'When climbing, shorten your stride and keep cadence steady; lean slightly forward from the ankles, not the waist'
            },
            {
              icon: 'leaf',
              title: 'Relax and breathe',
              description: 'Exhale fully during hill efforts, relax your jaw and facial muscles, and shake out your arms on flat sections'
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
          name: 'Cruise Spin',
          duration: '8–10 min',
          description: 'Light resistance 80–90 rpm; shoulders relaxed and tall.',
          battlePlan: '1 set\n• 8–10 min Easy Spin (RPE 3)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241059/mood_app/workout_images/8k8d6fo4_download_24_.jpg',
          intensityReason: 'Easy spin boosts circulation with very low muscular load.',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Soft hands',
              description: 'Keep a relaxed grip on the handlebars, pedal in smooth circles, and sit tall with shoulders away from ears'
            },
            {
              icon: 'leaf',
              title: 'Easy breathing',
              description: 'Maintain RPE around 3—you should be able to breathe steadily and smoothly through your nose'
            }
          ]
        },
        {
          name: 'Cadence Teasers',
          duration: '8–10 min',
          description: 'Easy spin punctuated by quick fast-leg bursts; reset easy.',
          battlePlan: '3 rounds\n• 2 min Easy (RPE 3)\n• 20s Fast Legs / 40s Easy (repeat 1× = 1 block)\nComplete both intervals back-to-back to finish each round',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241071/mood_app/workout_images/jx5sn8pf_download_25_.jpg',
          intensityReason: 'Short fast legs nudge HR without accumulating fatigue.',
          moodTips: [
            {
              icon: 'speedometer',
              title: 'Light resistance',
              description: 'Keep resistance low during fast-leg bursts to focus on speed rather than power; avoid bouncing in the saddle'
            },
            {
              icon: 'refresh',
              title: 'Fast legs',
              description: 'Aim for 95–105 rpm during fast portions while keeping your shoulders relaxed and upper body still'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Gear Nudge',
          duration: '10–12 min',
          description: 'Alternate light and moderate minutes at steady cadence.',
          battlePlan: '10–12 min continuous\n• 1 min Light (RPE 3)\n• 1 min Moderate (RPE 5)\nRepeat sequence',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241059/mood_app/workout_images/8k8d6fo4_download_24_.jpg',
          intensityReason: 'Slight resistance bumps engage muscles yet stay comfy.',
          moodTips: [
            {
              icon: 'speedometer',
              title: 'Keep RPM up',
              description: 'Maintain at least 80 rpm even during the moderate-resistance minute; adjust gear rather than slowing cadence'
            },
            {
              icon: 'leaf',
              title: 'Rhythmic breath',
              description: 'Keep your hands relaxed on the bars and sync breathing with pedal strokes for a rhythmic, meditative feel'
            }
          ]
        },
        {
          name: 'Mini Surges',
          duration: '10–12 min',
          description: 'Thirty-second surge, ninety seconds easy; smooth cycles.',
          battlePlan: '6 cycles continuous\n• 30s Surge (RPE 6)\n• 90s Easy (RPE 3)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241071/mood_app/workout_images/jx5sn8pf_download_25_.jpg',
          intensityReason: 'Short controlled pushes lift HR then settle cleanly.',
          moodTips: [
            {
              icon: 'settings',
              title: 'Stay seated',
              description: 'Remain seated during surges; avoid grinding a heavy gear—instead increase cadence to raise intensity'
            },
            {
              icon: 'leaf',
              title: 'Belly breathing',
              description: 'Breathe deep into your belly and use a long exhale during surges to help manage effort and stay relaxed'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Pyramid Spin',
          duration: '12–14 min',
          description: '1–2–3–2–1 @ RPE 5 with 1-min easy recoveries between.',
          battlePlan: '1 set\n• 2 min Easy\n• 1 min @ RPE 5 → 1 min Easy\n• 2 min @ RPE 5 → 1 min Easy\n• 3 min @ RPE 5 → 1 min Easy\n• 2 min @ RPE 5 → 1 min Easy\n• 1 min @ RPE 5 → 2 min Easy finish',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241059/mood_app/workout_images/8k8d6fo4_download_24_.jpg',
          intensityReason: 'Build and drop ladder sustains focus without strain.',
          moodTips: [
            {
              icon: 'speedometer',
              title: 'Moderate pace',
              description: 'Keep work intervals at a steady RPE 5—a sustainable effort, not an all-out sprint; consistency is key'
            },
            {
              icon: 'refresh',
              title: 'Reset between',
              description: 'Use each 1-minute easy period to fully reset your breathing and shake out any tension before the next effort'
            }
          ]
        },
        {
          name: 'Stand Sprinkles',
          duration: '12–14 min',
          description: 'Seated easy with short stands; return to seat smoothly.',
          battlePlan: '5 rounds\n• 2 min Easy (RPE 3)\n• 15–20s Standing (RPE 6)\nRepeat; no extra rest between rounds',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241071/mood_app/workout_images/jx5sn8pf_download_25_.jpg',
          intensityReason: 'Brief standing bouts add variety with mild leg load.',
          moodTips: [
            {
              icon: 'body',
              title: 'Core engaged',
              description: 'When standing, engage your core, keep hands light on the bars, and maintain steady rpm without swaying'
            },
            {
              icon: 'settings',
              title: 'Smooth transitions',
              description: 'Return to seated position softly; avoid using too heavy a gear during standing portions to protect your knees'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Elliptical',
    icon: 'infinite',
    workouts: {
      beginner: [
        {
          name: 'Glide Easy',
          duration: '8–10 min',
          description: 'Light resistance; smooth strides; relaxed upright posture.',
          battlePlan: '1 set\n• 8–10 min Easy Glide (RPE 3)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241047/mood_app/workout_images/1b8gmmf3_download_11_.jpg',
          intensityReason: 'Low-impact glide increases flow with minimal stress.',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Light touch',
              description: 'Keep your heels light on the pedals and use a gentle push-pull motion with the arm handles'
            },
            {
              icon: 'leaf',
              title: 'Steady breathing',
              description: 'Maintain RPE around 3 with slow, even breathing; this should feel like a comfortable warm-up pace'
            }
          ]
        },
        {
          name: 'Stride Pops',
          duration: '8–10 min',
          description: '20s quicker strides with 40s easy glides; repeat calm.',
          battlePlan: '3 rounds\n• 2 min Easy\n• 3 × (20s Quick, 40s Easy) done back-to-back\nRecovery is the 40s Easy within each trio',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241061/mood_app/workout_images/c5a1o86a_download_12_.jpg',
          intensityReason: 'Short tempo lifts add spark while effort stays easy.',
          moodTips: [
            {
              icon: 'settings',
              title: 'Light resistance',
              description: 'Keep resistance low during quick bursts—focus on speed and smooth motion rather than power output'
            },
            {
              icon: 'eye',
              title: 'Stay relaxed',
              description: 'Keep your eyes forward at horizon level and shoulders relaxed throughout both quick and easy segments'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Ramp Waves',
          duration: '10–12 min',
          description: 'Alternate low and high ramp minutes; steady cadence.',
          battlePlan: '10–12 min continuous\n• 1 min Low Ramp (RPE 3–4)\n• 1 min High Ramp (RPE 5)\nRepeat sequence',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241047/mood_app/workout_images/1b8gmmf3_download_11_.jpg',
          intensityReason: 'Mild ramp changes add novelty without taxing joints.',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Adapt stride',
              description: 'As the ramp increases, naturally shorten your stride length to maintain smooth and controlled motion'
            },
            {
              icon: 'leaf',
              title: 'Calm breathing',
              description: 'Focus on keeping your breathing calm and rhythmic even as the incline changes; avoid holding your breath'
            }
          ]
        },
        {
          name: 'Push–Pull Focus',
          duration: '10–12 min',
          description: '30s arm focus paired with 60s easy stride; smooth flow.',
          battlePlan: '6 cycles continuous\n• 30s Arm Focus (RPE 5)\n• 60s Easy (RPE 3)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241061/mood_app/workout_images/c5a1o86a_download_12_.jpg',
          intensityReason: 'Upper-body emphasis spreads load while staying light.',
          moodTips: [
            {
              icon: 'body',
              title: 'Core engaged',
              description: 'Brace your core lightly, keep elbows soft, and avoid gripping the handles too tightly during arm focus'
            },
            {
              icon: 'refresh',
              title: 'Keep flowing',
              description: 'Maintain continuous leg movement during arm-focus bursts; let upper and lower body work together smoothly'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Tempo Sprinkle',
          duration: '12–14 min',
          description: 'Two minutes easy then one-minute tempo; repeat smooth.',
          battlePlan: '5 cycles continuous\n• 2 min Easy (RPE 3)\n• 1 min Tempo (RPE 6)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241047/mood_app/workout_images/1b8gmmf3_download_11_.jpg',
          intensityReason: 'Short tempo bouts lift HR gently without impact.',
          moodTips: [
            {
              icon: 'body',
              title: 'Good form',
              description: 'Keep posture tall throughout, feet quiet on the pedals, and avoid overstriding which wastes energy'
            },
            {
              icon: 'refresh',
              title: 'Easy return',
              description: 'Push to RPE 6 during tempo then drop back to a comfortable RPE 3 easy pace for full recovery'
            }
          ]
        },
        {
          name: 'Ramp Pyramid',
          duration: '12–14 min',
          description: 'Climb every two minutes; descend smoothly to finish.',
          battlePlan: '1 set\n• 2 min Easy\n• 2 min Ramp 3 → 2 min Ramp 6 → 2 min Ramp 9\n• 2 min Ramp 6 → 2 min Ramp 3\n• 2 min Easy',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241061/mood_app/workout_images/c5a1o86a_download_12_.jpg',
          intensityReason: 'Gradual ramp build challenges, then eases smoothly.',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Adapt stride',
              description: 'Naturally shorten your stride length as the elevation increases to maintain efficient movement'
            },
            {
              icon: 'speedometer',
              title: 'Steady cadence',
              description: 'Keep your cadence consistent throughout; adjust resistance modestly rather than dramatically changing speed'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Stair stepper',
    icon: 'walk',
    workouts: {
      beginner: [
        {
          name: 'Easy Steps',
          duration: '8–10 min',
          description: 'Low level, smooth steps, light hands, steady breathing.',
          battlePlan: '1 set\n• 8–10 min Level 1–3 (RPE 3)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241058/mood_app/workout_images/891czvrs_download_22_.jpg',
          intensityReason: 'Gentle stepping raises HR with clean, safe mechanics.',
          moodTips: [
            {
              icon: 'body',
              title: 'Good posture',
              description: 'Stand tall with your spine neutral; avoid leaning heavily on the rails which reduces the workout effectiveness'
            },
            {
              icon: 'footsteps',
              title: 'Quiet steps',
              description: 'Use short controlled steps and land quietly; maintain RPE around 3 for a comfortable sustainable pace'
            }
          ]
        },
        {
          name: 'Step and Pause',
          duration: '8–10 min',
          description: 'Two minutes steady work with 30s very easy reset bouts.',
          battlePlan: '3 rounds\n• 2 min Steady (RPE 4)\n• 30s Very Easy (RPE 2–3)\nRepeat continuous; no extra rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241051/mood_app/workout_images/4vr4kipb_download_23_.jpg',
          intensityReason: 'Cadence dips ensure control while preventing fatigue.',
          moodTips: [
            {
              icon: 'speedometer',
              title: 'Even cadence',
              description: 'Keep your stepping cadence even throughout, maintain soft knees, and breathe calmly and steadily'
            },
            {
              icon: 'refresh',
              title: 'Reset breaks',
              description: 'Use the 30-second slow-step periods to relax your breath, reset your posture, and prepare for the next round'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Alternating Cadence',
          duration: '10–12 min',
          description: 'One minute brisk stepping, one minute easy; repeat flow.',
          battlePlan: '10–12 min continuous\n• 1 min Brisk (RPE 5)\n• 1 min Easy (RPE 3)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241058/mood_app/workout_images/891czvrs_download_22_.jpg',
          intensityReason: 'Cadence shifts add variety without heavy muscular load.',
          moodTips: [
            {
              icon: 'body',
              title: 'Tall posture',
              description: 'Maintain tall posture throughout; avoid letting the steps bottom out by using controlled, complete motions'
            },
            {
              icon: 'leaf',
              title: 'Even breathing',
              description: 'At brisk RPE 5, breathing should be elevated but controlled; drop to easy RPE 3 with relaxed even breaths'
            }
          ]
        },
        {
          name: 'Two-Step Rhythm',
          duration: '10–12 min',
          description: 'Insert five double-steps at 30s mark each minute set.',
          battlePlan: '6 cycles\n• 1 min Normal Steps (RPE 4)\n• At 30s within each minute: perform 5 double-steps',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241051/mood_app/workout_images/4vr4kipb_download_23_.jpg',
          intensityReason: 'Occasional double-steps wake hips and balance safely.',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Double-step',
              description: 'For double-steps, skip one step and plant your foot two steps higher—this activates glutes and hip flexors'
            },
            {
              icon: 'hand-right',
              title: 'Use rails lightly',
              description: 'Keep movements smooth and controlled; lightly touch rails for balance only if needed during double-steps'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Side-Step Sprinkle',
          duration: '12–14 min',
          description: 'Mostly forward steps with 30s lateral work each minute.',
          battlePlan: '6 cycles\n• 90s Forward (RPE 4)\n• 30s Side-Steps L/R (RPE 5)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241058/mood_app/workout_images/891czvrs_download_22_.jpg',
          intensityReason: 'Light lateral steps add variety with modest intensity.',
          moodTips: [
            {
              icon: 'resize',
              title: 'Small side steps',
              description: 'Use small controlled side steps with hips level; hold the rails lightly for balance during lateral movement'
            },
            {
              icon: 'refresh',
              title: 'Smooth movement',
              description: 'Lateral portions at RPE 5 should feel engaging; forward steps at RPE 4 are recovery—move smoothly between both'
            }
          ]
        },
        {
          name: 'Mini Climb Waves',
          duration: '12–14 min',
          description: 'Two minutes level 3–4, one minute level 5–6; repeat flow.',
          battlePlan: '4 rounds\n• 2 min Level 3–4 (RPE 4)\n• 1 min Level 5–6 (RPE 6)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241051/mood_app/workout_images/4vr4kipb_download_23_.jpg',
          intensityReason: 'Slight level waves lift HR then settle it smoothly again.',
          moodTips: [
            {
              icon: 'body',
              title: 'Stay tall',
              description: 'Maintain tall posture even during harder minutes; use even steps and soft landings throughout'
            },
            {
              icon: 'leaf',
              title: 'Exhale effort',
              description: 'Exhale fully during the higher-intensity minute, relax your shoulders, and keep your jaw unclenched'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Rowing machine',
    icon: 'boat',
    workouts: {
      beginner: [
        {
          name: 'Easy Row Flow',
          duration: '8–10 min',
          description: 'Smooth 18–20 spm, gentle pressure, relaxed breathing.',
          battlePlan: '1 set\n• 8–10 min @ 18–20 spm, RPE 3',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241053/mood_app/workout_images/6b87wtzw_download_20_.jpg',
          intensityReason: 'Light strokes increase flow with minimal joint loading.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Proper sequence',
              description: 'Follow the sequence: legs push first, then body swings back, finally arms pull; reverse this on the return'
            },
            {
              icon: 'hand-right',
              title: 'Light grip',
              description: 'Keep a light relaxed grip on the handle, shoulders down away from ears, and breathe with long exhales'
            }
          ]
        },
        {
          name: 'Pick Drill Lite',
          duration: '8–10 min',
          description: 'Arms-only, arms+body, then full strokes; crisp sequence.',
          battlePlan: '1 set\n• 2 min Arms-only (RPE 2–3)\n• 3 min Arms+Body (RPE 3)\n• 3–5 min Full Stroke (RPE 3–4)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241079/mood_app/workout_images/zxa3naw1_download_21_.jpg',
          intensityReason: 'Technique segments build rhythm at very easy effort.',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Arms-only',
              description: 'During arms-only, keep legs straight and just pull the handle in and out using arm movement only'
            },
            {
              icon: 'body',
              title: 'Add body',
              description: 'For arms+body, add a gentle torso swing forward and back while keeping legs quiet and extended'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Rate Pops',
          duration: '10–12 min',
          description: 'One minute 18 spm, 30s 24 spm; smooth easy pressure.',
          battlePlan: '6 cycles continuous\n• 1 min @ 18 spm (RPE 3–4)\n• 30s @ 24 spm (RPE 5)\n• 30s @ 18 spm reset',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241053/mood_app/workout_images/6b87wtzw_download_20_.jpg',
          intensityReason: 'Short rate lifts nudge HR while technique stays clean.',
          moodTips: [
            {
              icon: 'speedometer',
              title: 'Focus rhythm',
              description: 'Keep your split time modest during rate increases; focus on rhythm and stroke length rather than power'
            },
            {
              icon: 'hand-right',
              title: 'Smooth recovery',
              description: 'Relax your grip on the recovery and slide smoothly back to the catch position with control'
            }
          ]
        },
        {
          name: 'Technique Tempo',
          duration: '10–12 min',
          description: 'Two minutes easy, one-minute tempo; controlled repeats.',
          battlePlan: '4 rounds\n• 2 min Easy (RPE 3)\n• 1 min Tempo (RPE 5)\nNo extra rest; continuous flow',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241079/mood_app/workout_images/zxa3naw1_download_21_.jpg',
          intensityReason: 'Slight tempo raises HR while mechanics remain crisp.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Clean sequence',
              description: 'Maintain proper sequence: legs push, body swings, arms finish—even when picking up the tempo'
            },
            {
              icon: 'speedometer',
              title: 'Light pressure',
              description: 'Keep pressure light and consistent; the tempo increase comes from quicker turnover, not harder pulling'
            }
          ]
        }
      ],
      advanced: [
        {
          name: '500m Sprinkle',
          duration: '12–14 min',
          description: 'Easy row blocks surrounding one controlled 500m piece.',
          battlePlan: '1 set\n• 4 min Easy (RPE 3)\n• 500m Steady (RPE 6)\n• 4–6 min Easy (RPE 3)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241053/mood_app/workout_images/6b87wtzw_download_20_.jpg',
          intensityReason: 'Short 500m adds spice while total load remains easy.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Keep form crisp',
              description: 'Maintain crisp technique during the 500m piece; this is steady effort, not a personal record attempt'
            },
            {
              icon: 'leaf',
              title: 'Recover easy',
              description: 'After the 500m, drop back to easy pace and focus on long slow breaths to recover fully'
            }
          ]
        },
        {
          name: 'Ladder Rate',
          duration: '12–14 min',
          description: '2 min each at 18, 20, 22 spm, then descend back down.',
          battlePlan: '1 set\n• 2 min @ 18 spm → 2 @ 20 → 2 @ 22\n• 2 @ 20 → 2 @ 18\nAll at RPE 4–5 max',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241079/mood_app/workout_images/zxa3naw1_download_21_.jpg',
          intensityReason: 'Rate ladder entertains without adding heavy intensity.',
          moodTips: [
            {
              icon: 'speedometer',
              title: 'Rate only',
              description: 'Keep pressure easy throughout; only the stroke rate changes—not the power or effort level'
            },
            {
              icon: 'body',
              title: 'Good posture',
              description: 'Sit tall with strong posture, achieve a long finish position, and maintain a smooth controlled slide'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'SkiErg',
    icon: 'snow',
    workouts: {
      beginner: [
        {
          name: 'Easy Glide Pulls',
          duration: '8–10 min',
          description: 'Smooth hinge and arm drive; stable cadence; calm breath.',
          battlePlan: '1 set\n• 8–10 min Easy (RPE 3)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241048/mood_app/workout_images/1zo355rz_skiierg.jpg',
          intensityReason: 'Gentle pulls engage lats/core with low joint loading.',
          moodTips: [
            {
              icon: 'body',
              title: 'Hinge pattern',
              description: 'Initiate each pull with a hip hinge, then drive with arms; stand tall on the return to reset position'
            },
            {
              icon: 'hand-right',
              title: 'Light grip',
              description: 'Keep a relaxed grip on the handles and exhale fully on each pull to engage your core naturally'
            }
          ]
        },
        {
          name: 'Pull Pops',
          duration: '8–10 min',
          description: '15s quicker pulls with 45s easy glides; repeat smooth.',
          battlePlan: '3 rounds\n• 2 min Easy\n• 3 × (15s Quick, 45s Easy) back-to-back\nThe 45s Easy is the rest; no extra pause',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241056/mood_app/workout_images/7ynxfrel_ski1.jpg',
          intensityReason: 'Short pick-ups wake rhythm while keeping effort light.',
          moodTips: [
            {
              icon: 'body',
              title: 'No yanking',
              description: 'Keep shoulders down throughout; use a small controlled hinge and avoid yanking or jerking the handles'
            },
            {
              icon: 'refresh',
              title: 'Smooth recovery',
              description: 'Accelerate smoothly during quick bursts and return with relaxed controlled recovery'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Rate Waves',
          duration: '10–12 min',
          description: 'Alternate 1 min @ 20 spm and 1 min @ 24 spm; easy power.',
          battlePlan: '10–12 min continuous\n• 1 min @ 20 spm (RPE 3–4)\n• 1 min @ 24 spm (RPE 5)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241048/mood_app/workout_images/1zo355rz_skiierg.jpg',
          intensityReason: 'Small rate changes add interest without added strain.',
          moodTips: [
            {
              icon: 'speedometer',
              title: 'Power modest',
              description: 'Keep power output modest throughout; focus on timing and rhythm rather than maximum effort'
            },
            {
              icon: 'leaf',
              title: 'Long exhales',
              description: 'Use long exhales during the higher-rate minutes to stay relaxed and maintain smooth movement'
            }
          ]
        },
        {
          name: 'Hinge Focus',
          duration: '10–12 min',
          description: '30s hinge-led pulls with 60s easy glide; repeat calm.',
          battlePlan: '6 cycles continuous\n• 30s Focus (RPE 5)\n• 60s Easy (RPE 3)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241056/mood_app/workout_images/7ynxfrel_ski1.jpg',
          intensityReason: 'Technique emphasis spreads work while staying easy.',
          moodTips: [
            {
              icon: 'body',
              title: 'Hinge leads',
              description: 'Keep core braced throughout; let the hip hinge drive the movement first, then arms follow and finish'
            },
            {
              icon: 'hand-right',
              title: 'Stay tall',
              description: 'Return to tall standing position, keep elbows in close, and maintain a soft relaxed grip'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Short Effort Ladder',
          duration: '12–14 min',
          description: '20–30–40s pulls with equal easy; keep stroke smooth.',
          battlePlan: '3 cycles continuous\n• 20s Pull / 20s Easy\n• 30s Pull / 30s Easy\n• 40s Pull / 40s Easy',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241048/mood_app/workout_images/1zo355rz_skiierg.jpg',
          intensityReason: 'Small builds keep fun up without heavy fatigue buildup.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Clean stroke',
              description: 'Keep each stroke clean and controlled; avoid rushing the recovery portion between pulls'
            },
            {
              icon: 'leaf',
              title: 'Rhythmic breath',
              description: 'Breathe rhythmically throughout each effort interval; exhale on the pull, inhale on recovery'
            }
          ]
        },
        {
          name: 'Technique Tempo (SkiErg)',
          duration: '12–14 min',
          description: '2 min easy then 1 min tempo pulls; repeat smoothly.',
          battlePlan: '5 cycles continuous\n• 2 min Easy (RPE 3)\n• 1 min Tempo (RPE 6)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241056/mood_app/workout_images/7ynxfrel_ski1.jpg',
          intensityReason: 'Slight tempo keeps interest while mechanics stay crisp.',
          moodTips: [
            {
              icon: 'body',
              title: 'Tall posture',
              description: 'Maintain tall posture, use a small controlled hinge, and keep your ribs stacked over your hips'
            },
            {
              icon: 'hand-right',
              title: 'Smooth return',
              description: 'Relax your grip, keep elbows in close to your body, and return smoothly to the start position'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Jump rope',
    icon: 'remove',
    workouts: {
      beginner: [
        {
          name: 'Easy Singles',
          duration: '6–8 min',
          description: 'Simple singles; short contacts; relaxed quiet shoulders.',
          battlePlan: '3 rounds\n• 40s Jump / 20s Rest (RPE 3–4)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241067/mood_app/workout_images/hx5xzvml_download_14_.jpg',
          intensityReason: 'Light rhythm warms calves and lungs with minimal stress.',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Wrist turns',
              description: 'Turn the rope from your wrists not shoulders, keep elbows close to your sides, and use tiny jumps'
            },
            {
              icon: 'footsteps',
              title: 'Quiet feet',
              description: 'Land softly with quiet feet and maintain a steady breathing cadence throughout each interval'
            }
          ]
        },
        {
          name: 'Box Step Rope',
          duration: '6–8 min',
          description: 'Alternating steps under rope; easy beat; relaxed flow.',
          battlePlan: '3 rounds\n• 45s Step Rope / 15s Rest (RPE 3–4)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241078/mood_app/workout_images/vjbmjg1y_jr_singles.jpg',
          intensityReason: 'Step pattern lowers impact and keeps rhythm friendly.',
          moodTips: [
            {
              icon: 'body',
              title: 'Stay tall',
              description: 'Maintain tall posture with soft knees on each landing, keeping your gaze forward at eye level'
            },
            {
              icon: 'refresh',
              title: 'Even rope',
              description: 'Keep the rope path low and even; breathe calmly and let the rhythm become almost meditative'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Tempo Singles',
          duration: '8–10 min',
          description: '50s steady singles and 10s rest; repeat calm rhythm.',
          battlePlan: '8–10 min\n• 50s Jump / 10s Rest (RPE 5)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241067/mood_app/workout_images/hx5xzvml_download_14_.jpg',
          intensityReason: 'Slight tempo raises HR while remaining comfortable.',
          moodTips: [
            {
              icon: 'eye',
              title: 'Eyes forward',
              description: 'Keep your gaze forward at horizon level, wrists relaxed, and use tiny efficient jumps'
            },
            {
              icon: 'leaf',
              title: 'Conserve energy',
              description: 'Conserve energy by minimizing jump height; maintain a steady exhale rhythm throughout'
            }
          ]
        },
        {
          name: 'Side-to-Side Steps',
          duration: '8–10 min',
          description: 'Small side shuffles under rope; smooth even rhythm.',
          battlePlan: '5 rounds\n• 40s Lateral Steps / 20s Rest (RPE 4–5)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241078/mood_app/workout_images/vjbmjg1y_jr_singles.jpg',
          intensityReason: 'Mild lateral steps add variety and light coordination.',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Keep feet low',
              description: 'Keep feet close to the ground with quick light taps; relax your jaw and facial muscles'
            },
            {
              icon: 'leaf',
              title: 'Breathing cadence',
              description: 'Maintain a steady breathing cadence and stay light on your feet throughout the lateral movement'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Mixed Rhythm',
          duration: '10–12 min',
          description: '40s singles plus 20s fast singles; high cadence for appropriate challenge',
          battlePlan: '6 cycles\n• 40s Singles (RPE 4)\n• 20s Fast Singles (RPE 6)\n• 30s Easy Rest between cycles',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241055/mood_app/workout_images/7xdwafzn_download_15_.jpg',
          intensityReason: 'Short rhythm changes stimulate without heavy strain.',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Stay relaxed',
              description: 'Stay relaxed even during fast bursts; use tiny jumps and quick wrist rotation for speed'
            },
            {
              icon: 'leaf',
              title: 'Quiet shoulders',
              description: 'Keep shoulders quiet and stable; maintain steady breathing between intensity bursts'
            }
          ]
        },
        {
          name: 'Sprinkle Doubles',
          duration: '10–12 min',
          description: 'Singles base with 5–10 double-unders sprinkled in calmly.',
          battlePlan: '5 rounds\n• 60s Singles; add 5–10 DU anywhere (RPE 5–6)\n• 30–45s Rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241075/mood_app/workout_images/nj4p5yh5_download_16_.jpg',
          intensityReason: 'Occasional doubles add challenge while volume stays low.',
          moodTips: [
            {
              icon: 'body',
              title: 'Keep doubles sparse',
              description: 'Sprinkle in just 5–10 double-unders per round; stay relaxed and tall throughout'
            },
            {
              icon: 'refresh',
              title: 'Reset timing',
              description: 'Land softly after each double-under and reset your timing before continuing with singles'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Plyo box',
    icon: 'cube',
    workouts: {
      beginner: [
        {
          name: 'Step-Ups Easy',
          duration: '8–10 min',
          description: 'Steady step-ups; alternate leads; smooth controlled pace.',
          battlePlan: '1 set\n• 8–10 min Continuous Step-Ups (RPE 3–4)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241050/mood_app/workout_images/43a622qp_download_17_.jpg',
          intensityReason: 'Low step work moves legs with minimal joint impact.',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Whole foot',
              description: 'Place your whole foot on the box, stand tall at the top, and control the step down'
            },
            {
              icon: 'refresh',
              title: 'Alternate legs',
              description: 'Switch your lead leg every 5–10 reps to keep the workout balanced and prevent fatigue'
            }
          ]
        },
        {
          name: 'Low Box Squat-to-Stand',
          duration: '8–10 min',
          description: 'Light tap to box; stand tall; relaxed smooth rhythm.',
          battlePlan: '3 rounds\n• 60s Squat-to-Stand\n• 30s Easy Step-Ups\nNo extra rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241062/mood_app/workout_images/dgbd4a69_download_18_.jpg',
          intensityReason: 'Box target keeps depth safe with comfortable cadence.',
          moodTips: [
            {
              icon: 'body',
              title: 'Good position',
              description: 'Keep shins fairly upright, chest tall, and gently tap the box without plopping down'
            },
            {
              icon: 'leaf',
              title: 'Breath control',
              description: 'Breathe out as you stand up from the box; inhale as you lower back down to seated'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Step-Up + Knee',
          duration: '10–12 min',
          description: 'Step-up with gentle knee lift; alternate legs; control.',
          battlePlan: '4 rounds\n• 60s Step-Up + Knee (RPE 5)\n• 60s Easy Step-Ups (RPE 3–4)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241050/mood_app/workout_images/43a622qp_download_17_.jpg',
          intensityReason: 'Small knee drive lifts HR without jumping impact.',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'No pulling',
              description: 'Avoid pulling yourself up using a rail; drive through your lead leg and use a soft lockout at the top'
            },
            {
              icon: 'settings',
              title: 'Choose height',
              description: 'Select a box height that you can own smoothly with good form throughout the entire round'
            }
          ]
        },
        {
          name: 'Box Squat Pulses',
          duration: '10–12 min',
          description: 'Tap box, two pulses, stand tall; repeat with control.',
          battlePlan: '4 rounds\n• 45s Squat 2-Pulse + Stand\n• 45s Step-Ups Easy\nRepeat flow',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241067/mood_app/workout_images/ikffehr2_download_19_.jpg',
          intensityReason: 'Light pulses increase time under tension comfortably.',
          moodTips: [
            {
              icon: 'speedometer',
              title: 'Consistent depth',
              description: 'Maintain consistent squat depth on each rep with small controlled pulses at the bottom'
            },
            {
              icon: 'leaf',
              title: 'Steady breath',
              description: 'Keep breathing steady throughout; avoid holding your breath and prevent knee caving inward'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Low Box Jumps',
          duration: '12–14 min',
          description: 'Small jumps; quiet sticks; step down; reset each rep.',
          battlePlan: '5 rounds\n• 30s Box Jumps (low)\n• 60s Step-Ups Easy\n• 30s Rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241067/mood_app/workout_images/ikffehr2_download_19_.jpg',
          intensityReason: 'Low jumps keep playful intent with soft controlled landings.',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'Good jump form',
              description: 'Use a big arm swing to generate momentum, land on mid-foot, and hold your stick for 1–2 seconds'
            },
            {
              icon: 'refresh',
              title: 'Substitute if needed',
              description: 'If your joints complain, substitute with Step-Up + Knee instead to reduce impact'
            }
          ]
        },
        {
          name: 'Box Jump Clusters',
          duration: '12–14 min',
          description: 'Two jumps, 10s rest, two jumps; step down always.',
          battlePlan: '5 rounds\n• Cluster: 2 Jumps → 10s rest → 2 Jumps\n• Then 60s Easy Step-Ups\nRepeat; total RPE 5–6',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241076/mood_app/workout_images/qj1k6asd_bj.jpg',
          intensityReason: 'Clusters sustain jump quality with brief micro-rests.',
          moodTips: [
            {
              icon: 'eye',
              title: 'Consistent form',
              description: 'Use the same dip depth each time, keep eyes forward, and land with quiet feet'
            },
            {
              icon: 'speedometer',
              title: 'Use timer',
              description: 'Use a timer to track your 10s rest; keep jump height consistent rather than increasing'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Body weight only',
    icon: 'body',
    workouts: {
      beginner: [
        {
          name: 'Easy Body Circuit A',
          duration: '10–12 min',
          description: 'Squats, wall pushups, glute bridges, dead bugs; steady.',
          battlePlan: '3 rounds\n• 30s Squats\n• 30s Wall Pushups\n• 30s Glute Bridges\n• 30s Dead Bug\n• 30s Rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241066/mood_app/workout_images/gwmz0zxk_download_3_.jpg',
          intensityReason: 'Simple moves elevate flow with low joint and back stress.',
          moodTips: [
            {
              icon: 'speedometer',
              title: 'Smooth movement',
              description: 'Move smoothly through each exercise; keep reps sub-maximal to maintain good form throughout'
            },
            {
              icon: 'leaf',
              title: 'Stop if needed',
              description: 'Breathe steadily and stop immediately if anything pinches or causes discomfort'
            }
          ]
        },
        {
          name: 'Easy Body Circuit B',
          duration: '10–12 min',
          description: 'Reverse lunges, plank, hip hinges, calf raises; calm.',
          battlePlan: '3 rounds\n• 30s Reverse Lunges (alt)\n• 30s Forearm Plank\n• 30s Hip Hinge Good Mornings\n• 30s Calf Raises\n• 30s Rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241073/mood_app/workout_images/lz6xvlc5_download_4_.jpg',
          intensityReason: 'Gentle full-body mix builds heat without large fatigue.',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Use support',
              description: 'Use a chair or wall for balance during lunges and calf raises if needed'
            },
            {
              icon: 'leaf',
              title: 'Light core',
              description: 'Keep your core lightly engaged throughout with steady controlled breathing'
            }
          ]
        },
        {
          name: 'Core + Hips Flow',
          duration: '10–13 min',
          description: 'Bird dogs, side planks, clamshells, hollow holds; smooth.',
          battlePlan: '2 rounds\n• 30s Bird Dogs (alt)\n• 30s Side Plank L\n• 30s Side Plank R\n• 30s Clamshells L\n• 30s Clamshells R\n• 30s Hollow Hold\n• 60s Rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241045/mood_app/workout_images/04x6jgb3_download_5_.jpg',
          intensityReason: 'Light core and hip work supports posture and ease.',
          moodTips: [
            {
              icon: 'speedometer',
              title: 'Precise reps',
              description: 'Perform slow precise reps with long exhales; quality of movement matters more than quantity'
            },
            {
              icon: 'body',
              title: 'Ribs down',
              description: 'Keep ribs drawn down toward hips and neck relaxed throughout all core exercises'
            }
          ]
        },
        {
          name: 'Low-Bounce Burner',
          duration: '10–12 min',
          description: 'Step-back lunges, knee pushups, squat holds, core.',
          battlePlan: '3 rounds\n• 30s Step-Back Lunges (alt)\n• 30s Incline or Knee Pushups\n• 30s Squat Hold (comfortable depth)\n• 30s Dead Bug\n• 30s Rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241063/mood_app/workout_images/e0xo73cq_download_6_.jpg',
          intensityReason: 'Low-impact pace warms body without jumping stress.',
          moodTips: [
            {
              icon: 'speedometer',
              title: 'Control depth',
              description: 'Control your depth on lunges and squats; maintain a smooth cadence throughout'
            },
            {
              icon: 'refresh',
              title: 'Shake out',
              description: 'Use rest periods to shake out arms and legs to release any built-up tension'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Lazy Sweat A',
          duration: '12–15 min',
          description: 'Squats, pushups, alternating lunges, plank; steady flow.',
          battlePlan: '3 rounds\n• 40s Squats\n• 30s Pushups (incline if needed)\n• 40s Alternating Lunges\n• 30s Forearm Plank\n• 30s Rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241066/mood_app/workout_images/gwmz0zxk_download_3_.jpg',
          intensityReason: 'Short sets raise HR while pace stays conversational.',
          moodTips: [
            {
              icon: 'speedometer',
              title: 'Quality over speed',
              description: 'Prioritize quality over speed; perform smooth controlled reps rather than rushing through'
            },
            {
              icon: 'body',
              title: 'Plank form',
              description: 'During plank, keep ribs drawn down and glutes lightly engaged to protect your lower back'
            }
          ]
        },
        {
          name: 'Lazy Sweat B',
          duration: '12–15 min',
          description: 'Good mornings, reverse lunges, dead bugs, side planks.',
          battlePlan: '3 rounds\n• 40s Hip Hinge Good Mornings\n• 40s Reverse Lunges (alt)\n• 30s Dead Bug\n• 30s Side Plank (switch at 15s)\n• 30s Rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241073/mood_app/workout_images/lz6xvlc5_download_4_.jpg',
          intensityReason: 'Hinge, core, balance blend with easy controlled pacing.',
          moodTips: [
            {
              icon: 'body',
              title: 'Hinge from hips',
              description: 'Hinge from your hips with a soft knee bend; maintain a long neutral spine throughout'
            },
            {
              icon: 'leaf',
              title: 'Stay relaxed',
              description: 'Breathe out on the effort portion of each exercise; stay relaxed between movements'
            }
          ]
        },
        {
          name: 'Low Hop Mix',
          duration: '12–15 min',
          description: 'Small squat hops, step-back lunges, pushups, hollow.',
          battlePlan: '3 rounds\n• 30s Small Squat Hops (or Squats)\n• 40s Step-Back Lunges (alt)\n• 30s Pushups\n• 30s Hollow Hold\n• 30s Rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241045/mood_app/workout_images/04x6jgb3_download_5_.jpg',
          intensityReason: 'Tiny hops add pop while impact stays manageable.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Substitute if needed',
              description: 'If your joints disagree with hops, substitute regular body squats to stay low-impact'
            },
            {
              icon: 'footsteps',
              title: 'Quiet hops',
              description: 'Land with quiet feet during hops, use tiny controlled jumps, and maintain tall posture'
            }
          ]
        },
        {
          name: 'Core + Shoulders',
          duration: '12–15 min',
          description: 'Plank taps, pike holds, dead bugs, scapular pushups.',
          battlePlan: '3 rounds\n• 30s High Plank Shoulder Taps\n• 20–30s Pike Hold (hips high)\n• 30s Dead Bug\n• 30s Scapular Pushups\n• 30s Rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241063/mood_app/workout_images/e0xo73cq_download_6_.jpg',
          intensityReason: 'Gentle core and shoulder work adds tone without strain.',
          moodTips: [
            {
              icon: 'body',
              title: 'Ribs down',
              description: 'Keep ribs drawn down toward hips in all plank positions to protect your spine'
            },
            {
              icon: 'hand-right',
              title: 'Small movements',
              description: 'Use small controlled scapular movements; keep elbows locked during shoulder taps'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Jump Flow A',
          duration: '15–18 min',
          description: 'Jump squats, alternating lunges, pushups, plank; flow.',
          battlePlan: '4 rounds\n• 20s Jump Squats → 40s Squats\n• 40s Alternating Lunges\n• 30s Pushups\n• 30s Plank\n• 30s Rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241070/mood_app/workout_images/jurt20jc_download_7_.jpg',
          intensityReason: 'Short jump sets lift HR; total impact stays moderate.',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Soft landings',
              description: 'Focus on landing softly on mid-foot with quiet feet to protect your joints'
            },
            {
              icon: 'refresh',
              title: 'Substitute if needed',
              description: 'Swap to regular body squats if your knees complain during jump squats'
            }
          ]
        },
        {
          name: 'Burpee Sprinkle',
          duration: '15–18 min',
          description: 'Few burpees per minute; squats and core fill remaining.',
          battlePlan: 'EMOM 12 min\nOdd: 4–6 Burpees, then Squats till minute\nEven: 20s Hollow Hold, then Lunges till minute',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241052/mood_app/workout_images/560zzeug_download_8_.jpg',
          intensityReason: 'Sparse burpees add spice while rest moves stay easy.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Smooth burpees',
              description: 'Keep burpees smooth and controlled; step back instead of jumping back if needed'
            },
            {
              icon: 'leaf',
              title: 'Control breathing',
              description: 'Stay relaxed and control your breathing throughout; avoid holding your breath'
            }
          ]
        },
        {
          name: 'Push–Core Ladder',
          duration: '15–18 min',
          description: 'Pushups and V-ups ladder; lunges fill rest time segments.',
          battlePlan: '1 set flow\n• 6 Pushups → 10 V-ups\n• 8 Pushups → 12 V-ups\n• 10 Pushups → 14 V-ups\n• Between rungs: 20s Alternating Lunges',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241077/mood_app/workout_images/r5b5c9ea_download_9_.jpg',
          intensityReason: 'Short ladders challenge without heavy fatigue buildup.',
          moodTips: [
            {
              icon: 'speedometer',
              title: 'Quality reps',
              description: 'Focus on quality reps; break early if your form starts to deteriorate'
            },
            {
              icon: 'refresh',
              title: 'Crisp V-ups',
              description: 'Keep V-ups crisp and controlled; substitute with controlled tuck-ups if needed'
            }
          ]
        },
        {
          name: 'Jump Flow B',
          duration: '15–18 min',
          description: 'Split jumps, squat jumps, pike shoulder taps, planks.',
          battlePlan: '4 rounds\n• 20s Split Jumps → 40s Reverse Lunges\n• 20s Squat Jumps → 40s Squats\n• 30s Pike Shoulder Taps\n• 30s Side Plank (switch at 15s)\n• 30s Rest',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241064/mood_app/workout_images/fx9b15hc_download_10_.jpg',
          intensityReason: 'Mixed jumps challenge safely with soft controlled landings.',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Low amplitude',
              description: 'Use low amplitude jumps with quiet controlled landings to protect your joints'
            },
            {
              icon: 'body',
              title: 'Ribs down taps',
              description: 'Keep ribs drawn down during shoulder taps and maintain steady breathing throughout'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Assault Bike',
    icon: 'bicycle',
    workouts: {
      beginner: [
        {
          name: 'Breeze Pedal',
          duration: '8–10 min',
          description: 'Light pace, gentle arm swing, calm nasal–mouth breathing.',
          battlePlan: '1 set\n• 8–10 min Easy (RPE 3)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241069/mood_app/workout_images/j0sczg6l_download_2_.jpg',
          intensityReason: 'Easy spin moves blood with very low systemic stress.',
          moodTips: [
            {
              icon: 'hand-right',
              title: 'Soft grip',
              description: 'Keep a soft relaxed grip on the handles, shoulders down, and use even arm and leg strokes'
            },
            {
              icon: 'chatbubble',
              title: 'Stay conversational',
              description: 'Maintain RPE around 3; you should be able to hold a conversation comfortably'
            }
          ]
        },
        {
          name: 'Short Spins',
          duration: '8–10 min',
          description: '20s quick spin with 40s easy reset; repeat smoothly.',
          battlePlan: '3 rounds\n• 2 min Easy\n• 3 × (20s Quick, 40s Easy) back-to-back\nThe 40s Easy is the rest; no extra pause',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241074/mood_app/workout_images/m4tsgs02_download_1_.jpg',
          intensityReason: 'Brief pickups add spark without accumulating fatigue.',
          moodTips: [
            {
              icon: 'body',
              title: 'Stay seated',
              description: 'Stay seated throughout, focus on quick turnover, and keep arms and hands relaxed'
            },
            {
              icon: 'speedometer',
              title: 'Fluid cadence',
              description: 'Keep cadence fluid and avoid heavy mashing; speed comes from rpm not resistance'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Cadence Waves',
          duration: '10–12 min',
          description: 'One minute brisk, one minute easy; repeat balanced.',
          battlePlan: '10–12 min continuous\n• 1 min Brisk (RPE 5)\n• 1 min Easy (RPE 3)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241069/mood_app/workout_images/j0sczg6l_download_2_.jpg',
          intensityReason: 'Oscillations lift HR while the ride stays comfortable.',
          moodTips: [
            {
              icon: 'body',
              title: 'Match arms/legs',
              description: 'Coordinate your arms and legs in rhythm, sit tall, and keep a light grip on the handles'
            },
            {
              icon: 'leaf',
              title: 'Control breath',
              description: 'At brisk RPE 5, breathing should be elevated; at easy RPE 3, focus on controlled recovery breaths'
            }
          ]
        },
        {
          name: 'Gear Nudge (Assault)',
          duration: '10–12 min',
          description: '90s easy then 30s firmer push; repeat controlled cycles.',
          battlePlan: '6 cycles continuous\n• 90s Easy (RPE 3)\n• 30s Push (RPE 6)',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241074/mood_app/workout_images/m4tsgs02_download_1_.jpg',
          intensityReason: 'Resistance shifts add variety under steady cadence.',
          moodTips: [
            {
              icon: 'speedometer',
              title: 'Steady RPM',
              description: 'Keep RPM steady throughout; increase pressure and arm effort during push intervals'
            },
            {
              icon: 'leaf',
              title: 'Relax shoulders',
              description: 'Relax your shoulders away from ears and use long exhales during push efforts'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Mini-Tabata Lite',
          duration: '12–14 min',
          description: '6 rounds 10s hard/20s easy with long easy bookends.',
          battlePlan: '1 set\n• 4 min Easy\n• 6 rounds: 10s Hard (RPE 7) / 20s Easy\n• 4–6 min Easy finish',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241069/mood_app/workout_images/j0sczg6l_download_2_.jpg',
          intensityReason: 'Very short efforts spice an otherwise easy ride safely.',
          moodTips: [
            {
              icon: 'pulse',
              title: 'Comfortably hard',
              description: 'Comfortably hard means RPE 7—challenging but sustainable; keep form smooth not frantic'
            },
            {
              icon: 'leaf',
              title: 'Deep nasal exhales',
              description: 'During recovery segments, use deep nasal exhales to lower heart rate and reset'
            }
          ]
        },
        {
          name: 'Pyramid Sprinkle',
          duration: '12–14 min',
          description: '20–30–40s push with equal easy; relaxed steady cadence.',
          battlePlan: '3 cycles continuous\n• 20s Push / 20s Easy\n• 30s Push / 30s Easy\n• 40s Push / 40s Easy',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241074/mood_app/workout_images/m4tsgs02_download_1_.jpg',
          intensityReason: 'Short building pushes lift HR without overreaching.',
          moodTips: [
            {
              icon: 'speedometer',
              title: 'Fluid cadence',
              description: 'Keep cadence fluid throughout; avoid wild spikes in power that waste energy'
            },
            {
              icon: 'body',
              title: 'Sit tall',
              description: 'Sit tall with soft hands on the handles and use long controlled exhales during efforts'
            }
          ]
        }
      ]
    }
  }
];
