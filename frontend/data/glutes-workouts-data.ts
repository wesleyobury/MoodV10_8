import { EquipmentWorkouts } from '../types/workout';

export const glutesWorkoutDatabase: EquipmentWorkouts[] = [
  {
    equipment: 'Barbell',
    icon: 'barbell',
    workouts: {
      beginner: [
        {
          name: 'Controlled Back Squat',
          duration: '12–14 min',
          description: 'Back squats building glute strength through controlled movement',
          battlePlan: '3 rounds\n• 8–10 reps\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/lbu1kh3e_back%20squat.png',
          intensityReason: 'Controlled tempo teaches glute loading and squat positioning',
          moodTips: [
            { icon: 'arrow-back', title: 'Sit back before you descend', description: 'Hips should load before knees drive forward.' },
            { icon: 'footsteps', title: 'Push evenly through your feet', description: 'Mid-foot pressure keeps glutes engaged throughout.' },
            { icon: 'checkmark-circle', title: 'Leave reps in the tank', description: 'You should finish feeling confident, not drained.' }
          ]
        },
        {
          name: 'Box Back Squat',
          duration: '12–14 min',
          description: 'Box-guided squats reinforcing glute loading and depth control',
          battlePlan: '3 rounds\n• 8 reps\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/kwxoaq36_back%20squat%202.png',
          intensityReason: 'Box reference reinforces depth and consistent glute loading',
          moodTips: [
            { icon: 'remove', title: 'Lightly touch the box only', description: 'Don’t fully sit and lose tension.' },
            { icon: 'flash', title: 'Drive hips through at the top', description: 'Finish every rep with glute contraction.' },
            { icon: 'shield', title: 'Control the entire rep', description: 'Smooth movement matters more than weight.' }
          ]
        },
        {
          name: 'Tempo Back Squat',
          duration: '12–14 min',
          description: 'Slow eccentric squats increasing glute tension and positioning',
          battlePlan: '3 rounds\n• 8 reps (3s eccentric)\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/axy2u246_back%20squat%203.png',
          intensityReason: 'Slow eccentric amplifies glute tension under controlled load',
          moodTips: [
            { icon: 'arrow-down', title: 'Lower slower than you want to', description: 'The eccentric is where most tension builds.' },
            { icon: 'shield', title: 'Stay braced the whole descent', description: 'Losing tension shifts stress away from glutes.' },
            { icon: 'timer', title: 'Move with patience', description: 'Don’t rush to stand up.' }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Glute-Biased Back Squat',
          duration: '14–16 min',
          description: 'Wider stance squats emphasizing glute engagement and strength',
          battlePlan: '4 rounds\n• 8–10 reps\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/kwxoaq36_back%20squat%202.png',
          intensityReason: 'Wider stance emphasizes hip drive and glute recruitment',
          moodTips: [
            { icon: 'expand', title: 'Push knees outward hard', description: 'Creates better glute recruitment and hip stability.' },
            { icon: 'footsteps', title: 'Drive through your heels', description: 'You should feel glutes working before quads dominate.' },
            { icon: 'flame', title: 'Tension should build each round', description: 'If reps still feel easy late, increase load.' }
          ]
        },
        {
          name: 'Back Squat Pulses',
          duration: '14–16 min',
          description: 'Squats extended with bottom pulses increasing glute tension',
          battlePlan: '4 rounds\n• 8 reps + 4 pulses\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/axy2u246_back%20squat%203.png',
          intensityReason: 'Bottom pulses sustain glute tension in the deepest range',
          moodTips: [
            { icon: 'arrow-down', title: 'Stay close to the bottom', description: 'Pulses keep you in the hardest range longer.' },
            { icon: 'pulse', title: 'Keep pulses controlled and short', description: 'Big bounces remove the benefit.' },
            { icon: 'flame', title: 'Expect a deep glute burn early', description: 'That’s the purpose of this variation.' }
          ]
        },
        {
          name: 'Back Squat Pause Reps',
          duration: '14–16 min',
          description: 'Paused squats building glute strength from the bottom position',
          battlePlan: '4 rounds\n• 6–8 reps (2s pause)\nRest 120s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/lbu1kh3e_back%20squat.png',
          intensityReason: 'Paused bottom develops strength out of the hardest position',
          moodTips: [
            { icon: 'pause', title: 'Pause without relaxing', description: 'Stay tight at full depth.' },
            { icon: 'flash', title: 'Drive explosively out of the hole', description: 'Power should come from hips and glutes.' },
            { icon: 'flame', title: 'Last reps should slow slightly', description: 'That’s how you know intensity is right.' }
          ]
        }
      ],
      advanced: [
        {
          name: 'Heavy Glute Back Squat',
          duration: '16–18 min',
          description: 'Heavy squats emphasizing maximal glute strength and output',
          battlePlan: '5 rounds\n• 5–6 reps\nRest 150s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/axy2u246_back%20squat%203.png',
          intensityReason: 'Heavy load drives maximal glute strength adaptations',
          moodTips: [
            { icon: 'shield', title: 'Treat every rep like a single', description: 'Full brace and focus before unracking.' },
            { icon: 'flash', title: 'Drive hips through aggressively', description: 'Finish every rep with intent, not survival.' },
            { icon: 'flame', title: 'Final sets should challenge you hard', description: 'You should question the last 1–2 reps.' }
          ]
        },
        {
          name: 'Back Squat 1.5 Reps',
          duration: '16–18 min',
          description: 'Extended-rep squats increasing glute tension and fatigue output',
          battlePlan: '4 rounds\n• 6–8 reps (1.5 reps)\nRest 150s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/lbu1kh3e_back%20squat.png',
          intensityReason: '1.5 reps double time spent in the deepest glute-loading range',
          moodTips: [
            { icon: 'arrow-down', title: 'Own the bottom half of the squat', description: 'That’s where glutes work hardest.' },
            { icon: 'shield', title: 'Stay controlled through transitions', description: 'Rushing removes tension immediately.' },
            { icon: 'flame', title: 'Burn should become unavoidable', description: 'Especially by the final round.' }
          ]
        },
        {
          name: 'Back Squat Burnout',
          duration: '18–20 min',
          description: 'High-rep squats driving deep glute fatigue and endurance',
          battlePlan: '3 rounds\n• 15–20 reps\nRest 150s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_ac961e42-7fcc-4980-8c0c-d7055d6cef31/artifacts/kwxoaq36_back%20squat%202.png',
          intensityReason: 'High-rep volume drives deep glute fatigue and endurance',
          moodTips: [
            { icon: 'repeat', title: 'Stay in constant motion', description: 'Locking out fully gives your muscles a break.' },
            { icon: 'pulse', title: 'Control breathing under fatigue', description: 'One breath per rep keeps rhythm steady.' },
            { icon: 'flame', title: 'Final reps should feel brutal', description: 'The set should end near failure, not comfort.' }
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
          name: 'Cable Ankle Kickback',
          duration: '10–12 min',
          description: 'Ankle‑strapped motion builds activation through glutes',
          battlePlan: '3 rounds\n• 10–12 per leg Kickbacks\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241386/mood_app/workout_images/2ambyktp_gk2.jpg',
          intensityReason: 'Cable adds constant tension for strict hip extension',
          moodTips: [
            {
              icon: 'body',
              title: 'Strap cuff to ankle, hinge slightly, torso tall',
              description: 'Proper positioning ensures target muscle isolation and safety.'
            },
            {
              icon: 'construct',
              title: 'Kick leg smoothly back, no hip or torso twist',
              description: 'Controlled movement prevents compensation and maximizes glute activation.'
            }
          ]
        },
        {
          name: 'Cable Pull‑Through',
          duration: '10–12 min',
          description: 'Great hip hinge builder for posterior chain activation',
          battlePlan: '3 rounds\n• 10–12 Pull‑Throughs\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241343/mood_app/workout_images/hgi9y71r_cpt.jpg',
          intensityReason: 'Rope hinge motion loads glutes with safe posture path',
          moodTips: [
            {
              icon: 'walk',
              title: 'Hold rope, step forward, hinge hips deep',
              description: 'Proper setup creates the foundation for effective hip hinge movement.'
            },
            {
              icon: 'flash',
              title: 'Drive hips through, squeeze glutes at end',
              description: 'Hip drive ensures complete glute activation and power development.'
            }
          ]
        },
        {
          name: 'Cable Hip Extension',
          duration: '10–12 min',
          description: 'Standing extensions reinforcing glute firing',
          battlePlan: '3 rounds\n• 12–15 Extensions per leg\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240658/mood_app/workout_images/7v4ve2vi_cable_hip_ext.jpg',
          intensityReason: 'Cable resistance teaches proper hip extension pattern',
          moodTips: [
            {
              icon: 'construct',
              title: 'Cable set low',
              description: 'Resistance aligns with hip drive.'
            },
            {
              icon: 'body',
              title: 'Hips square',
              description: 'No torso rotation.'
            },
            {
              icon: 'refresh',
              title: 'Smooth return',
              description: 'Control both directions.'
            }
          ]
        },
        {
          name: 'Cable Assisted Squat Hold',
          duration: '10–12 min',
          description: 'Static squat holds emphasizing glute tension',
          battlePlan: '3 rounds\n• 20–30s Holds\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240676/mood_app/workout_images/j9bwfr8q_Cable_squat_1.jpg',
          intensityReason: 'Isometric holds build glute endurance and stability',
          moodTips: [
            {
              icon: 'resize',
              title: 'Mid-depth hold',
              description: 'Glutes stay loaded.'
            },
            {
              icon: 'hand-left',
              title: 'Cable assists balance',
              description: 'Legs still do work.'
            },
            {
              icon: 'pulse',
              title: 'Steady breathing',
              description: 'Avoid bracing fatigue.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Cable Step‑Back Lunge',
          duration: '14–16 min',
          description: 'Cable anchor increases balance and constant tension',
          battlePlan: '4 rounds\n• 8–10 per leg Step‑Back Lunges\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241349/mood_app/workout_images/kbqqdimd_download_2_.jpg',
          intensityReason: 'Rear lunges with cable build unilateral glute force',
          moodTips: [
            {
              icon: 'construct',
              title: 'Cable set low, hold handle at chest height',
              description: 'Proper cable position maintains balance and core engagement.'
            },
            {
              icon: 'trending-down',
              title: 'Step back steady, push from heel upright',
              description: 'Controlled descent with heel drive maximizes glute loading.'
            }
          ]
        },
        {
          name: 'Cable High Kickback',
          duration: '14–16 min',
          description: 'Top‑end contraction isolates and strengthens glutes',
          battlePlan: '3 rounds\n• 8–10 per leg Kickbacks (2s pause top)\nRest 75–90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241390/mood_app/workout_images/coxrp5yp_gk.jpg',
          intensityReason: 'Kickbacks with higher angle add peak glute tension',
          moodTips: [
            {
              icon: 'construct',
              title: 'Ankle cuff, pulley low, hinge slightly forward',
              description: 'Low pulley position creates optimal resistance curve for glutes.'
            },
            {
              icon: 'timer',
              title: 'Kick upward + back, pause two seconds top',
              description: 'Pause at peak contraction maximizes muscle activation and control.'
            }
          ]
        },
        {
          name: 'Cable Step-Up Drive',
          duration: '14–16 min',
          description: 'Elevated step-ups emphasizing glute drive',
          battlePlan: '4 rounds\n• 8 Step-Ups per leg\nRest 90s',
          imageUrl: '',
          intensityReason: 'Step-ups with cable resistance build unilateral power',
          moodTips: [
            {
              icon: 'trending-up',
              title: 'High step height',
              description: 'Knee starts above hip.'
            },
            {
              icon: 'footsteps',
              title: 'Back foot disengaged',
              description: 'Front leg performs all work.'
            },
            {
              icon: 'construct',
              title: 'Cable close to body',
              description: 'Prevents forward pull.'
            }
          ]
        },
        {
          name: 'Cable Reverse Lunge Pause',
          duration: '14–16 min',
          description: 'Reverse lunges with bottom-position pauses',
          battlePlan: '4 rounds\n• 8 Lunges per leg (2s pause)\nRest 90s',
          imageUrl: '',
          intensityReason: 'Paused lunges strengthen glutes in stretched position',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause low',
              description: 'Strengthens glutes in stretch.'
            },
            {
              icon: 'footsteps',
              title: 'Front heel drives',
              description: 'Glute initiates ascent.'
            },
            {
              icon: 'body',
              title: 'Torso upright',
              description: 'Prevents hip shift.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Pull‑Through + Squat Combo',
          duration: '16–18 min',
          description: 'Constant tension pairing ensures strong hypertrophy',
          battlePlan: '4 rounds\n• 8 Pull‑Throughs\n• 8 Cable Squats\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241343/mood_app/workout_images/hgi9y71r_cpt.jpg',
          intensityReason: 'Pair hinge and squat hits glutes from dual angles',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Perform pull‑through hinge, then squat upright',
              description: 'Continuous movement maintains muscle tension and metabolic stress.'
            },
            {
              icon: 'construct',
              title: 'Stay tight near stack, no resting mid‑set',
              description: 'Proper positioning ensures consistent resistance throughout range.'
            }
          ]
        },
        {
          name: 'Cable Kickback Burnout',
          duration: '16–18 min',
          description: 'Ankle‑cuff movement torches glutes with total volume',
          battlePlan: '3 rounds\n• 15–20 per leg Kickbacks\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241390/mood_app/workout_images/coxrp5yp_gk.jpg',
          intensityReason: 'High rep burnout floods glutes with strict tension',
          moodTips: [
            {
              icon: 'construct',
              title: 'Keep hips square, no torso leaning back',
              description: 'Maintain proper alignment to isolate glutes and prevent compensation.'
            },
            {
              icon: 'shield',
              title: 'Small but controlled, avoid swinging reps',
              description: 'Quality over quantity - maintain form even during high-rep burnout.'
            }
          ]
        },
        {
          name: 'Cable Squat Burnout',
          duration: '18–20 min',
          description: 'High-rep squats under constant glute tension',
          battlePlan: '3 rounds\n• 20 Squats\nRest 150s',
          imageUrl: '',
          intensityReason: 'High-rep cable squats maximize metabolic stress',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Moderate load only',
              description: 'Enables uninterrupted reps.'
            },
            {
              icon: 'flash',
              title: 'No lockout',
              description: 'Glutes stay under tension.'
            },
            {
              icon: 'pulse',
              title: 'One breath per rep',
              description: 'Controls pacing.'
            }
          ]
        },
        {
          name: 'Cable RDL Drop Series',
          duration: '18–20 min',
          description: 'Hinges extended with multiple fast drops',
          battlePlan: '3 rounds\n• 8 RDLs\n• Drop → 6\n• Drop → 6\nRest 150s',
          imageUrl: '',
          intensityReason: 'Drop series extends glute and hamstring fatigue',
          moodTips: [
            {
              icon: 'flash',
              title: 'Immediate drops',
              description: 'Reduce load 20–25% quickly.'
            },
            {
              icon: 'body',
              title: 'Neutral spine',
              description: 'No rounding under fatigue.'
            },
            {
              icon: 'checkmark',
              title: 'Glutes finish reps',
              description: 'Strong squeeze every lockout.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Hip Thruster Equipment',
    icon: 'fitness',
    workouts: {
      beginner: [
        {
          name: 'Bodyweight Hip Thrust',
          duration: '10–12 min',
          description: 'Teaches thrust basics before loading with bar weight',
          battlePlan: '3 rounds\n• 12–15 Bodyweight Hip Thrusts\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241401/mood_app/workout_images/odvl0o6h_ht.jpg',
          intensityReason: 'Entry thrust builds safe mechanics for hip extension',
          moodTips: [
            {
              icon: 'construct',
              title: 'Upper back on bench, chin down, core tight',
              description: 'Proper positioning creates stable base for hip thrust movement.'
            },
            {
              icon: 'trending-up',
              title: 'Drive hips up, squeeze glutes firmly top',
              description: 'Complete hip extension with glute squeeze maximizes muscle activation.'
            }
          ]
        },
        {
          name: 'Light Bar Hip Thrust',
          duration: '10–12 min',
          description: 'Adds external weight to strengthen glute hip drive',
          battlePlan: '3 rounds\n• 10–12 Light Bar Hip Thrusts\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241402/mood_app/workout_images/roi44n5q_download_10_.jpg',
          intensityReason: 'Light load introduces controlled thrust progression',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Rest padded bar across hips locked in',
              description: 'Proper bar positioning and core bracing ensure safe load transfer.'
            },
            {
              icon: 'fitness',
              title: 'Thrust upward hard, pause at top',
              description: 'Balanced heel drive prevents compensations and maximizes power.'
            }
          ]
        },
        {
          name: 'Elevated Hip Thrust',
          duration: '10–12 min',
          description: 'Bench-elevated thrusts emphasizing full glute lockout',
          battlePlan: '3 rounds\n• 12 Hip Thrusts\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240679/mood_app/workout_images/mr69uwpz_bb_hip_thrust.jpg',
          intensityReason: 'Elevated position teaches proper hip extension mechanics',
          moodTips: [
            {
              icon: 'body',
              title: 'Shoulders anchored',
              description: 'Upper back fixed to isolate hips.'
            },
            {
              icon: 'trending-up',
              title: 'Finish tall',
              description: 'Full hip extension with glute squeeze.'
            },
            {
              icon: 'arrow-down',
              title: 'Controlled descent',
              description: 'Slow lowering keeps tension on glutes.'
            }
          ]
        },
        {
          name: 'Hip Thrust Pulse Reps',
          duration: '10–12 min',
          description: 'Short-range pulses maintaining constant glute tension',
          battlePlan: '3 rounds\n• 15 Pulse Thrusts\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240654/mood_app/workout_images/60kuhstx_hip_thrust.jpg',
          intensityReason: 'Continuous tension builds glute endurance and activation',
          moodTips: [
            {
              icon: 'resize',
              title: 'Top-half motion only',
              description: 'Pulses stay near full extension.'
            },
            {
              icon: 'construct',
              title: 'Small controlled range',
              description: 'Avoid bouncing or momentum.'
            },
            {
              icon: 'flash',
              title: 'Continuous tension',
              description: 'Glutes never fully relax.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Banded Hip Thrust',
          duration: '14–16 min',
          description: 'Builds glute lockout with band top range tension',
          battlePlan: '4 rounds\n• 10 Banded Hip Thrusts\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241401/mood_app/workout_images/odvl0o6h_ht.jpg',
          intensityReason: 'Band drives abduction for long range contraction',
          moodTips: [
            {
              icon: 'resize',
              title: 'Keep band above knees, press outward',
              description: 'Band resistance challenges glutes in multiple planes of movement.'
            },
            {
              icon: 'flash',
              title: 'Brace abs, extend hips forcefully each rep',
              description: 'Complete hip extension against band resistance maximizes glute activation.'
            }
          ]
        },
        {
          name: 'Single‑Leg Hip Thrust',
          duration: '14–16 min',
          description: 'Unilateral load prevents imbalance and aids stability',
          battlePlan: '3 rounds\n• 8–10 per leg Single‑Leg Hip Thrusts\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241361/mood_app/workout_images/sq01qvar_image.jpg',
          intensityReason: 'One‑leg thrust isolates glutes for stronger balance',
          moodTips: [
            {
              icon: 'construct',
              title: 'Keep pelvis level, don\'t rotate hips down',
              description: 'Pelvic stability ensures proper muscle activation and prevents injury.'
            },
            {
              icon: 'fitness',
              title: 'Drive heel firmly, feel isolated squeeze',
              description: 'Focused single-leg drive develops unilateral strength and power.'
            }
          ]
        },
        {
          name: 'Tempo Hip Thrust',
          duration: '14–16 min',
          description: 'Slow eccentrics increasing glute time under tension',
          battlePlan: '4 rounds\n• 8–10 Thrusts (3s eccentric)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240679/mood_app/workout_images/mr69uwpz_bb_hip_thrust.jpg',
          intensityReason: 'Extended eccentric phase maximizes muscle fiber recruitment',
          moodTips: [
            {
              icon: 'timer',
              title: 'Three-second lower',
              description: 'Slower descent intensifies loading.'
            },
            {
              icon: 'pause',
              title: 'Pause at lockout',
              description: 'One-second squeeze reinforces contraction.'
            },
            {
              icon: 'shield',
              title: 'Core braced',
              description: 'Prevents lower-back takeover.'
            }
          ]
        },
        {
          name: 'Hip Thrust Drop Set',
          duration: '14–16 min',
          description: 'Extended thrust sets using fast load reductions',
          battlePlan: '3 rounds\n• 8 Thrusts\n• Drop → 8\n• Drop → 8\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240654/mood_app/workout_images/60kuhstx_hip_thrust.jpg',
          intensityReason: 'Drop sets extend time under tension for hypertrophy',
          moodTips: [
            {
              icon: 'flash',
              title: 'Immediate drops',
              description: 'Reduce load ~25% without resting.'
            },
            {
              icon: 'construct',
              title: 'Same mechanics',
              description: 'Range and tempo stay identical.'
            },
            {
              icon: 'flame',
              title: 'Chase deep burn',
              description: 'Continuous tension is goal.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Heavy Bar Hip Thrust',
          duration: '16–18 min',
          description: 'Barbell lift grows strength and posterior hip power',
          battlePlan: '4 rounds\n• 6–8 Heavy Hip Thrusts\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241401/mood_app/workout_images/odvl0o6h_ht.jpg',
          videoUrl: 'https://res.cloudinary.com/dfsygar5c/video/upload/v1770240480/mood_app/workout_videos/BB_hip_thrust.mov',
          intensityReason: 'Heavy thrust progression maximizes glute overload',
          moodTips: [
            {
              icon: 'shield',
              title: 'Bar over hips, brace abs to stabilize',
              description: 'Core stability prevents compensations under heavy load.'
            },
            {
              icon: 'construct',
              title: 'Thrust up sharply, lock out glutes',
              description: 'Controlled movement pattern maintains safety and effectiveness.'
            }
          ]
        },
        {
          name: 'Hip Thrust + Iso Hold',
          duration: '16–18 min',
          description: 'Finisher combo challenges endurance and contraction',
          battlePlan: '3 rounds\n• 8–10 Hip Thrusts\nFinish with 10s Iso Hold at top\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241402/mood_app/workout_images/roi44n5q_download_10_.jpg',
          intensityReason: 'Iso hold extending reps prolongs glute time under load',
          moodTips: [
            {
              icon: 'timer',
              title: '10s hold in full extension each set',
              description: 'Sustained contraction maximizes metabolic stress and muscle activation.'
            },
            {
              icon: 'construct',
              title: 'Push knees out to hold band tension',
              description: 'Maintain position throughout hold for maximum effectiveness.'
            }
          ]
        },
        {
          name: 'Heavy Hip Thrust Pause',
          duration: '18–20 min',
          description: 'Heavy thrusts with long lockout pauses',
          battlePlan: '4 rounds\n• 5–6 Thrusts (2s pause)\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241401/mood_app/workout_images/odvl0o6h_ht.jpg',
          intensityReason: 'Paused heavy thrusts build peak glute strength',
          moodTips: [
            {
              icon: 'timer',
              title: 'Two-second hold',
              description: 'Eliminates momentum completely.'
            },
            {
              icon: 'body',
              title: 'Ribs down',
              description: 'Keeps extension in glutes, not spine.'
            },
            {
              icon: 'people',
              title: 'Spotter recommended',
              description: 'Heavy pauses can stall suddenly.'
            }
          ]
        },
        {
          name: 'Hip Thrust Burnout Ladder',
          duration: '18–20 min',
          description: 'Descending ladder maximizing glute fatigue',
          battlePlan: '2–3 ladders\n• 12 → 10 → 8 → 6 Thrusts\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241402/mood_app/workout_images/roi44n5q_download_10_.jpg',
          intensityReason: 'Ladder format accumulates massive training volume',
          moodTips: [
            {
              icon: 'flash',
              title: 'No rest between rungs',
              description: 'Ladder maintains nonstop tension.'
            },
            {
              icon: 'barbell',
              title: 'Weight stays fixed',
              description: 'Only reps decrease.'
            },
            {
              icon: 'checkmark',
              title: 'Finish with squeeze',
              description: 'Last rep ends with long hold.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Glute Kick Machine',
    icon: 'ellipse',
    workouts: {
      beginner: [
        {
          name: 'Machine Kickback',
          duration: '10–12 min',
          description: 'Pad press hip drive builds foundation safely first',
          battlePlan: '3 rounds\n• 10–12 per leg Kickbacks\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241405/mood_app/workout_images/u602jvhu_download_9_.jpg',
          intensityReason: 'Guided extension path isolates glutes effectively',
          moodTips: [
            {
              icon: 'construct',
              title: 'Push with heel, torso braced on pad',
              description: 'Controlled movement ensures proper muscle activation and safety.'
            },
            {
              icon: 'shield',
              title: 'Contract glute without arching spine',
              description: 'Torso stability prevents compensations and maximizes glute isolation.'
            }
          ]
        },
        {
          name: 'Seated Kickback',
          duration: '10–12 min',
          description: 'Seated pad drive provides beginner stability focus',
          battlePlan: '3 rounds\n• 12 per leg Seated Kickbacks\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241397/mood_app/workout_images/k5zii6kf_download_8_.jpg',
          intensityReason: 'Torso support stabilizes movement for beginners',
          moodTips: [
            {
              icon: 'construct',
              title: 'Sit braced, core upright on machine seat',
              description: 'Seated position provides stability for focused glute activation.'
            },
            {
              icon: 'timer',
              title: 'Press pad back steadily with glute drive',
              description: 'Pause at peak contraction enhances muscle activation.'
            }
          ]
        },
        {
          name: 'Single-Leg Kickback',
          duration: '10–12 min',
          description: 'Straight-path kickbacks building glute control',
          battlePlan: '3 rounds\n• 12 Kickbacks per leg\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240675/mood_app/workout_images/haz45wxi_glute_kickback_2.jpg',
          intensityReason: 'Machine-guided movement teaches proper kickback form',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Drive heel back',
              description: 'Think "push wall behind you".'
            },
            {
              icon: 'body',
              title: 'Hips stay square',
              description: 'No rotation or sway.'
            },
            {
              icon: 'timer',
              title: 'Pause at extension',
              description: 'One-second squeeze.'
            }
          ]
        },
        {
          name: 'Kickback Pulse Reps',
          duration: '10–12 min',
          description: 'Short-range pulses keeping glutes loaded',
          battlePlan: '3 rounds\n• 15 Pulses per leg\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240680/mood_app/workout_images/nyipzbcv_glute_kickback.jpg',
          intensityReason: 'Continuous tension builds glute endurance',
          moodTips: [
            {
              icon: 'resize',
              title: 'Top-third only',
              description: 'Pulses stay near lockout.'
            },
            {
              icon: 'construct',
              title: 'Small motion',
              description: 'Avoid swinging.'
            },
            {
              icon: 'flash',
              title: 'Constant tension',
              description: 'Glutes never relax.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Heavy Kickback',
          duration: '14–16 min',
          description: 'Progressive overload builds strength at extension',
          battlePlan: '4 rounds\n• 8–10 Heavy Kickbacks per leg\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241405/mood_app/workout_images/u602jvhu_download_9_.jpg',
          intensityReason: 'Increased load pushes hypertrophy for glutes',
          moodTips: [
            {
              icon: 'construct',
              title: 'Keep back steady, hips square to pad',
              description: 'Hip stability prevents compensations under heavier loads.'
            },
            {
              icon: 'shield',
              title: 'Push controlled, bar no sudden drops',
              description: 'Controlled movement maintains form and prevents injury.'
            }
          ]
        },
        {
          name: 'Pause Kickback',
          duration: '14–16 min',
          description: 'Strict tempo isolates stronger contraction at end',
          battlePlan: '3 rounds\n• 8 per leg Pause Kickbacks\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241397/mood_app/workout_images/k5zii6kf_download_8_.jpg',
          intensityReason: 'Added pause loads glute contraction maximally',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause 2s with knee extended back',
              description: 'Extended pause maximizes peak contraction and muscle activation.'
            },
            {
              icon: 'construct',
              title: 'Slow return; avoid pad snapping',
              description: 'Controlled eccentric enhances muscle development and joint safety.'
            }
          ]
        },
        {
          name: 'Tempo Kickback',
          duration: '14–16 min',
          description: 'Slow eccentrics extending glute fatigue',
          battlePlan: '4 rounds\n• 10 Reps per leg (3s eccentric)\nRest 90s',
          imageUrl: '',
          intensityReason: 'Tempo work increases time under tension dramatically',
          moodTips: [
            {
              icon: 'flash',
              title: 'Drive back hard',
              description: 'Explosive extension.'
            },
            {
              icon: 'timer',
              title: 'Three-second return',
              description: 'Increases time under tension.'
            },
            {
              icon: 'body',
              title: 'Torso locked',
              description: 'Upper body stays still.'
            }
          ]
        },
        {
          name: 'Kickback Drop Set',
          duration: '14–16 min',
          description: 'Extended kickbacks with rapid load reductions',
          battlePlan: '3 rounds\n• 10 Reps\n• Drop → 8\n• Drop → 8\nRest 120s',
          imageUrl: '',
          intensityReason: 'Drop sets extend fatigue without rest',
          moodTips: [
            {
              icon: 'flash',
              title: 'Immediate drops',
              description: 'Reduce 20–30% fast.'
            },
            {
              icon: 'construct',
              title: 'Same path',
              description: 'Range never shortens.'
            },
            {
              icon: 'flame',
              title: 'Burn over load',
              description: 'Stop when extension weakens.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Drop‑Set Kickback',
          duration: '16–18 min',
          description: 'Sequential weight drops demand non‑stop contraction',
          battlePlan: '3 rounds\n• 8 Heavy Kickbacks per leg\n• Drop 15% weight → 6–8 reps\n• Drop 15% again → 6–8 reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241405/mood_app/workout_images/u602jvhu_download_9_.jpg',
          intensityReason: 'Drop loading pattern extends tension for hypertrophy',
          moodTips: [
            {
              icon: 'flash',
              title: 'Reduce weight 15% instantly, keep going',
              description: 'Quick weight changes maintain fatigue and extend training stimulus.'
            },
            {
              icon: 'construct',
              title: 'One fluid motion across all drops',
              description: 'Maintain full range of motion even as fatigue increases.'
            }
          ]
        },
        {
          name: 'Kickback Hold Burner',
          duration: '16–18 min',
          description: 'Static‑dynamic combo adds brutal finishing stimulus',
          battlePlan: '4 rounds\n• 8 Kickbacks each leg\nFinish with 10s Iso Hold on last rep\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241397/mood_app/workout_images/k5zii6kf_download_8_.jpg',
          intensityReason: 'Iso hold after reps enhances glute activation burn',
          moodTips: [
            {
              icon: 'timer',
              title: 'Hold final rep 10s contraction tight',
              description: 'Isometric hold at peak contraction maximizes metabolic stress.'
            },
            {
              icon: 'construct',
              title: 'Keep body square, hips strong inline',
              description: 'Proper position prevents compensations during extended hold.'
            }
          ]
        },
        {
          name: 'Heavy Kickback Pause',
          duration: '18–20 min',
          description: 'Loaded kickbacks with long peak holds',
          battlePlan: '4 rounds\n• 8 Reps per leg (2s hold)\nRest 150s',
          imageUrl: '',
          intensityReason: 'Heavy paused kickbacks build peak glute strength',
          moodTips: [
            {
              icon: 'timer',
              title: 'Two-second squeeze',
              description: 'Hold full extension deliberately.'
            },
            {
              icon: 'shield',
              title: 'Core braced',
              description: 'Prevents lumbar takeover.'
            },
            {
              icon: 'alert',
              title: 'Unilateral fatigue expected',
              description: 'One side may fail first.'
            }
          ]
        },
        {
          name: 'Kickback Burnout Ladder',
          duration: '18–20 min',
          description: 'Descending ladder maximizing glute exhaustion',
          battlePlan: '2–3 ladders\n• 15 → 12 → 10 Reps\nRest 150s',
          imageUrl: '',
          intensityReason: 'Ladder format accumulates maximum training volume',
          moodTips: [
            {
              icon: 'flash',
              title: 'No rest between rungs',
              description: 'Ladder keeps tension continuous.'
            },
            {
              icon: 'resize',
              title: 'Extension stays strong',
              description: 'End set when range shortens.'
            },
            {
              icon: 'timer',
              title: 'Finish with long hold',
              description: 'Final rep ends with 10s squeeze.'
            }
          ]
        }
      ]
    }
  },
  {
    equipment: 'Hip Abductor Machine',
    icon: 'resize',
    workouts: {
      beginner: [
        {
          name: 'Standard Abduction',
          duration: '10–12 min',
          description: 'Intro machine work builds stability in outer hips',
          battlePlan: '3 rounds\n• 12–15 Abductions\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241400/mood_app/workout_images/o6mep0pr_ha.jpg',
          intensityReason: 'Basic seated movement strengthens glute medius',
          moodTips: [
            {
              icon: 'construct',
              title: 'Stay upright; push knees outward slow',
              description: 'Upright posture ensures proper glute medius activation.'
            },
            {
              icon: 'shield',
              title: 'Don\'t slam pads together when resting',
              description: 'Controlled return prevents momentum and maintains muscle tension.'
            }
          ]
        },
        {
          name: 'Lean Forward Abduction',
          duration: '10–12 min',
          description: 'Shifts emphasis effectively into upper glute tissues',
          battlePlan: '3 rounds\n• 12–15 Lean Abductions\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241329/mood_app/workout_images/ca2oebzr_lfha.jpg',
          intensityReason: 'Lean angle biases deeper glute muscle activity',
          moodTips: [
            {
              icon: 'construct',
              title: 'Lean 20–30° forward with chest down',
              description: 'Forward lean changes muscle fiber recruitment for enhanced activation.'
            },
            {
              icon: 'fitness',
              title: 'Control knees in and out steady',
              description: 'Controlled movement ensures quality muscle activation.'
            }
          ]
        },
        {
          name: 'Seated Abduction',
          duration: '10–12 min',
          description: 'Controlled abductions targeting outer glutes',
          battlePlan: '3 rounds\n• 15 Abductions\nRest 60s',
          imageUrl: '',
          intensityReason: 'Seated position isolates glute medius effectively',
          moodTips: [
            {
              icon: 'body',
              title: 'Sit tall',
              description: 'Upright posture improves targeting.'
            },
            {
              icon: 'resize',
              title: 'Even knee drive',
              description: 'Both glutes fire equally.'
            },
            {
              icon: 'arrow-back',
              title: 'Slow return',
              description: 'Maintains constant tension.'
            }
          ]
        },
        {
          name: 'Abduction Hold Reps',
          duration: '10–12 min',
          description: 'Abductions with extended peak contractions',
          battlePlan: '3 rounds\n• 12 Reps (2s hold)\nRest 75s',
          imageUrl: '',
          intensityReason: 'Isometric holds enhance mind-muscle connection',
          moodTips: [
            {
              icon: 'timer',
              title: 'Pause wide',
              description: 'Hold end range deliberately.'
            },
            {
              icon: 'construct',
              title: 'Controlled closure',
              description: 'Avoid snapping legs together.'
            },
            {
              icon: 'pulse',
              title: 'Steady breathing',
              description: 'Keeps reps clean.'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Banded Abduction',
          duration: '14–16 min',
          description: 'Combo band+machine emphasizes hypertrophy work',
          battlePlan: '4 rounds\n• 12 Banded Abductions\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241400/mood_app/workout_images/o6mep0pr_ha.jpg',
          intensityReason: 'Band tension increases abductor contraction top end',
          moodTips: [
            {
              icon: 'resize',
              title: 'Strap band above knees, press outward',
              description: 'Band creates additional resistance throughout the range of motion.'
            },
            {
              icon: 'construct',
              title: 'Keep knees wide, resist on way in',
              description: 'Controlled return prevents band snap-back and maintains tension.'
            }
          ]
        },
        {
          name: 'Unilateral Abduction',
          duration: '14–16 min',
          description: 'Asymmetry training balances strength between hips',
          battlePlan: '4 rounds\n• 8–10 per side Abductions\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241392/mood_app/workout_images/eqwbozow_Screenshot_2025-12-02_at_4_48_10_PM.jpg',
          intensityReason: 'One‑sided work isolates weaker glute completely',
          moodTips: [
            {
              icon: 'construct',
              title: 'Work one leg at a time deliberately',
              description: 'Unilateral work highlights and addresses strength imbalances.'
            },
            {
              icon: 'shield',
              title: 'Keep torso tall, avoid rocking body',
              description: 'Torso stability ensures isolated glute medius activation.'
            }
          ]
        },
        {
          name: 'Tempo Abduction',
          duration: '14–16 min',
          description: 'Slower eccentrics increasing glute med load',
          battlePlan: '4 rounds\n• 12 Reps (3s eccentric)\nRest 90s',
          imageUrl: '',
          intensityReason: 'Tempo work maximizes time under tension',
          moodTips: [
            {
              icon: 'flash',
              title: 'Explode outward',
              description: 'Maximize activation.'
            },
            {
              icon: 'timer',
              title: 'Three-second return',
              description: 'Intensifies tension.'
            },
            {
              icon: 'body',
              title: 'No torso rocking',
              description: 'Isolation stays clean.'
            }
          ]
        },
        {
          name: 'Abduction Drop Set',
          duration: '14–16 min',
          description: 'Extended sets using rapid load reductions',
          battlePlan: '3 rounds\n• 12 Reps\n• Drop → 10\n• Drop → 10\nRest 120s',
          imageUrl: '',
          intensityReason: 'Drop sets extend fatigue for enhanced hypertrophy',
          moodTips: [
            {
              icon: 'flash',
              title: 'Immediate drops',
              description: 'Reduce ~25% without rest.'
            },
            {
              icon: 'resize',
              title: 'Consistent range',
              description: 'Same spread every rep.'
            },
            {
              icon: 'flame',
              title: 'Burn should peak',
              description: 'Fatigue accumulation is goal.'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Drop‑Set Abduction',
          duration: '16–18 min',
          description: 'Stacked reps crush glute medius with high overload',
          battlePlan: '3 rounds\n• 12 Heavy Abductions\n• Drop 20% → 10 reps\n• Drop 20% again → 10 reps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241400/mood_app/workout_images/o6mep0pr_ha.jpg',
          intensityReason: 'Drop set prolongs effort rising metabolic fatigue',
          moodTips: [
            {
              icon: 'flash',
              title: 'Strip plates fast, no mid‑set rest',
              description: 'Quick transitions maintain fatigue and extend training stimulus.'
            },
            {
              icon: 'construct',
              title: 'Keep every rep smooth and steady',
              description: 'Maintain full range of motion throughout all drop sets.'
            }
          ]
        },
        {
          name: 'Hold + Rep Abduction',
          duration: '16–18 min',
          description: 'Brutal pairing fully activates and fatigues hips',
          battlePlan: '3 rounds\n• 10s Iso Hold wide\n• 10–12 Full Reps immediately after\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241392/mood_app/workout_images/eqwbozow_Screenshot_2025-12-02_at_4_48_10_PM.jpg',
          intensityReason: 'Iso hold primes glutes then high‑rep sets extend',
          moodTips: [
            {
              icon: 'timer',
              title: 'Brace pad wide for 10s then repeat',
              description: 'Sustained contraction pre-fatigues muscles for enhanced training effect.'
            },
            {
              icon: 'construct',
              title: 'Don\'t lean, keep torso locked tall',
              description: 'Immediate transition maintains fatigue and training intensity.'
            }
          ]
        },
        {
          name: 'Abduction Burnout Holds',
          duration: '18–20 min',
          description: 'High-tension abductions finished with long holds',
          battlePlan: '3 rounds\n• 15 Reps + 20s Hold\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240656/mood_app/workout_images/746w3mny_hip_abductor.jpg',
          intensityReason: 'Combined reps and holds maximize glute medius fatigue',
          moodTips: [
            {
              icon: 'resize',
              title: 'Max spread hold',
              description: 'Knees pushed wide under fatigue.'
            },
            {
              icon: 'pulse',
              title: 'Micro pulses only',
              description: 'Tiny movements maintain tension.'
            },
            {
              icon: 'flame',
              title: 'Expect deep burn',
              description: 'Glute med failure is goal.'
            }
          ]
        },
        {
          name: 'Triple Drop Abduction',
          duration: '18–20 min',
          description: 'Multi-drop abductions for full exhaustion',
          battlePlan: '2–3 rounds\n• 12 → 10 → 8 → 8\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770240686/mood_app/workout_images/swjfi31g_hip_abductor_2.jpg',
          intensityReason: 'Triple drops ensure complete muscle fiber recruitment',
          moodTips: [
            {
              icon: 'flash',
              title: 'Three drops straight',
              description: 'Strip load without rest.'
            },
            {
              icon: 'body',
              title: 'Posture unchanged',
              description: 'Upright torso always.'
            },
            {
              icon: 'checkmark',
              title: 'End when range shortens',
              description: 'Quality over force.'
            }
          ]
        }
      ]
    }
  }
];
