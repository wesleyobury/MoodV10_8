import { EquipmentWorkouts } from '../types/workout';

export const explosivenessWeightsDatabase: EquipmentWorkouts[] = [
  // Power Lifting Platform - 4 workouts per intensity
  {
    equipment: 'Power Lifting Platform',
    icon: 'barbell',
    workouts: {
      beginner: [
        {
          name: 'Snap-Grip Jump Deadlift',
          duration: '8–10 min',
          description: 'Fast stand to brief float; quiet land; precise reset each rep.',
          battlePlan: '3 rounds\n• 5 × 3 Jump Deadlifts (light; floor or low blocks)\nRest 60–75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241175/mood_app/workout_images/xefmav9j_Screenshot_2025-12-03_at_4_15_36_PM.jpg',
          intensityReason: 'Light bar grooves hip snap and stacked brace for safe pop.',
          moodTips: [
            {
              icon: 'arrow-up',
              title: 'Start Position',
              description: 'Start mid-shin; brace; push floor, don\'t yank from ground'
            },
            {
              icon: 'footsteps',
              title: 'Landing',
              description: 'Heels kiss on land; reset stance fully before next pull'
            }
          ]
        },
        {
          name: 'Clean Pull Pop',
          duration: '8–10 min',
          description: 'Sweep close to thighs; pop and shrug tall with arms long.',
          battlePlan: '3 rounds\n• 6 × 2 Clean Pulls (light–moderate)\nRest 60–75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241134/mood_app/workout_images/9kehs3fb_Screenshot_2025-12-03_at_4_15_03_PM.jpg',
          intensityReason: 'Clean pull path hones triple extend and vertical bar speed.',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Bar Path',
              description: 'Shoulders over bar; lats tight; keep knuckles down'
            },
            {
              icon: 'trending-up',
              title: 'Execution',
              description: 'Drive legs then hips; shrug vertical; avoid arm curl'
            }
          ]
        },
        {
          name: 'Back Rack Jump Squat',
          duration: '8–10 min',
          description: 'Shallow dip to quick pop; soft stick; deliberate posture reset.',
          battlePlan: '3 rounds\n• 5 × 3 Jump Squats (empty bar to very light)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241171/mood_app/workout_images/uvdvgv3p_download_8_.jpg',
          intensityReason: 'Very light load builds speed-strength and landing control.',
          moodTips: [
            {
              icon: 'body',
              title: 'Setup',
              description: 'Bar high on traps; ribs down; small dip only'
            },
            {
              icon: 'footsteps',
              title: 'Landing',
              description: 'Land mid-foot; absorb quietly; match heights each set'
            }
          ]
        },
        {
          name: 'Tall Push Press',
          duration: '8–10 min',
          description: 'Quick dip then punch; crisp stack overhead; smooth return.',
          battlePlan: '3 rounds\n• 5–6 Push Press (light–moderate)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241152/mood_app/workout_images/hsftvvu7_download_9_.jpg',
          intensityReason: 'Short dip-drive teaches leg power into rapid lockout.',
          moodTips: [
            {
              icon: 'arrow-down',
              title: 'Dip',
              description: 'Dip 2–3"; torso vertical; heels down through drive'
            },
            {
              icon: 'arrow-up',
              title: 'Press',
              description: 'Punch straight; head through; lower under control each rep'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Hang Clean Pull to Tall Shrug',
          duration: '10–12 min',
          description: 'Hinge to hang, violent pop, high shrug; reset between reps.',
          battlePlan: '4 rounds\n• 4 × 2 Hang Clean Pulls (moderate)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241134/mood_app/workout_images/9kehs3fb_Screenshot_2025-12-03_at_4_15_03_PM.jpg',
          intensityReason: 'Above-knee start refines bar path, RFD, and tall finish.',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Starting Position',
              description: 'Lats packed; bar close; sweep into thighs'
            },
            {
              icon: 'flash',
              title: 'Finish',
              description: 'Triple extend; elbows high after shrug; no hitch'
            }
          ]
        },
        {
          name: 'Jump Shrug Cluster',
          duration: '10–12 min',
          description: 'Two reps, brief rest, two reps; maintain equal jump height.',
          battlePlan: '4 rounds\n• Cluster: 2 + 2 Jump Shrugs (10–12s between)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241142/mood_app/workout_images/f8plc9vh_jsc.jpg',
          intensityReason: 'Clusters keep peak speed while limiting fatigue buildup.',
          moodTips: [
            {
              icon: 'repeat',
              title: 'Consistency',
              description: 'Same stance; bar skims thighs each rep'
            },
            {
              icon: 'time',
              title: 'Rest Timing',
              description: 'Land quiet; breathe quick; time micro-rests strictly'
            }
          ]
        },
        {
          name: 'Push Press Launch',
          duration: '10–12 min',
          description: 'Short dip, violent drive, crisp lockout, smooth rack return.',
          battlePlan: '4 rounds\n• 4–5 Push Press (light–moderate)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241126/mood_app/workout_images/1n6uft3o_pp.jpg',
          intensityReason: 'Efficient dip-drive transfers leg force to fast press lock.',
          moodTips: [
            {
              icon: 'arrow-down',
              title: 'Dip Mechanics',
              description: 'Knees track; ribs down; heels stay planted on dip'
            },
            {
              icon: 'arrow-up',
              title: 'Drive',
              description: 'Punch up; finish stacked; control eccentric each time'
            }
          ]
        },
        {
          name: 'Clean High Pull from Blocks',
          duration: '10–12 min',
          description: 'Start at knee; snap tall; elbows high; bar path stays close.',
          battlePlan: '4 rounds\n• 4 × 2 High Pulls from blocks (moderate)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241144/mood_app/workout_images/g3m6pn8h_chp.jpg',
          intensityReason: 'Blocks reduce pull length to emphasize peak speed finish.',
          moodTips: [
            {
              icon: 'body',
              title: 'Position',
              description: 'Brace; sweep in; extend to toes before pull'
            },
            {
              icon: 'flash',
              title: 'Pull',
              description: 'Elbows up/back; avoid early arm bend or swing'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Clean Pull + Jump Squat Contrast',
          duration: '12–14 min',
          description: 'Drive force on pulls, then pop height with soft, crisp sticks.',
          battlePlan: '5 rounds\n• 3 Clean Pulls (moderate–heavy)\n• 3 × 2 Back Rack Jump Squats (light)\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241171/mood_app/workout_images/uvdvgv3p_download_8_.jpg',
          intensityReason: 'Heavy pulls potentiate CNS; light jumps express speed.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Pull Phase',
              description: 'Pull: bar close; violent hips; no hitching'
            },
            {
              icon: 'body',
              title: 'Jump Phase',
              description: 'Jump: same dip; relaxed grip; match landing quietly'
            }
          ]
        },
        {
          name: 'Snatch High Pull from Blocks',
          duration: '12–14 min',
          description: 'From knee blocks; snap tall; elbows high outside; bar close.',
          battlePlan: '5 rounds\n• 3–4 Snatch High Pulls (from blocks)\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241123/mood_app/workout_images/064hao7f_snatch.jpg',
          intensityReason: 'Wide grip emphasizes speed, bar height, and quick elbows.',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Setup',
              description: 'Lats set; full extend; pull elbows up and back'
            },
            {
              icon: 'flash',
              title: 'Execution',
              description: 'Keep bar near body; reset strong each repetition'
            }
          ]
        },
        {
          name: 'Push Jerk Wave Sets',
          duration: '12–16 min',
          description: 'Dip-drive, punch under, firm stick; build across wave sets.',
          battlePlan: '5 rounds\n• Wave: 2-2-1 Push Jerks (build slightly per wave)\nRest 120–150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241126/mood_app/workout_images/1n6uft3o_pp.jpg',
          intensityReason: 'Wave loading sustains velocity under rising neural demand.',
          moodTips: [
            {
              icon: 'arrow-down',
              title: 'Dip',
              description: 'Dip shallow; heels down; explode then drop'
            },
            {
              icon: 'footsteps',
              title: 'Catch',
              description: 'Land soft; lock firm; recover feet in order'
            }
          ]
        },
        {
          name: 'Clean Pull Cluster',
          duration: '12–14 min',
          description: 'Two pulls, short rest, two pulls; crisp vertical extension.',
          battlePlan: '5 rounds\n• Cluster: 2 + 2 Clean Pulls (moderate–heavy)\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241134/mood_app/workout_images/9kehs3fb_Screenshot_2025-12-03_at_4_15_03_PM.jpg',
          intensityReason: 'Cluster reps maintain bar speed at higher training loads.',
          moodTips: [
            {
              icon: 'body',
              title: 'Form',
              description: 'Wedge hard; sweep close; finish tall every rep'
            },
            {
              icon: 'time',
              title: 'Timing',
              description: 'Use timer for 10–12s rests; no grinding reps'
            }
          ]
        }
      ]
    }
  },
  // Landmine Attachment - 3 workouts per intensity
  {
    equipment: 'Landmine Attachment',
    icon: 'analytics',
    workouts: {
      beginner: [
        {
          name: 'Landmine Split Jerk Pop',
          duration: '8–10 min',
          description: 'Small dip to forceful drive; soft balanced split; one-second hold.',
          battlePlan: '3 rounds\n• 4 per side Split Jerk Pops\nRest 60–75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241128/mood_app/workout_images/40bblhga_lmspj.jpg',
          intensityReason: 'Angled path teaches leg drive and stable split catch safely.',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Stance',
              description: 'Front foot forward; rear ball; torso tall and braced'
            },
            {
              icon: 'flash',
              title: 'Execution',
              description: 'Dip vertical; punch under; freeze one second before recover'
            }
          ]
        },
        {
          name: 'Landmine Squat Jump Press',
          duration: '8–10 min',
          description: 'Shallow squat pop; guide sleeve overhead along smooth arc.',
          battlePlan: '3 rounds\n• 6 × Squat Jump → Press\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241158/mood_app/workout_images/mqbps9jp_lmsjp.jpg',
          intensityReason: 'Triple extend into press develops seamless force transfer.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Grip',
              description: 'Two hands on sleeve; elbows in; ribs down'
            },
            {
              icon: 'arrow-up',
              title: 'Movement',
              description: 'Jump small; press on rise; stick land quietly'
            }
          ]
        },
        {
          name: 'Rotational Landmine Toss',
          duration: '8–10 min',
          description: 'Pivot feet, drive hips, release forward-up with tight control.',
          battlePlan: '3 rounds\n• 6 per side Rotational Tosses\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241150/mood_app/workout_images/hdnoipr9_lmrot.jpg',
          intensityReason: 'Hip-led rotation builds lateral power with controlled arc.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Rotation',
              description: 'Back foot pivots; hips lead; arms guide the path'
            },
            {
              icon: 'body',
              title: 'Control',
              description: 'Keep arc tight; avoid trunk over-rotation; reset stance'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Landmine Push Press',
          duration: '10–12 min',
          description: 'Quick shallow dip, violent drive, clean angled lockout finish.',
          battlePlan: '4 rounds\n• 5–6 Push Press per side (alternate or sets)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241128/mood_app/workout_images/40bblhga_lmspj.jpg',
          intensityReason: 'Dip-drive timing converts leg force to fast overhead speed.',
          moodTips: [
            {
              icon: 'arrow-down',
              title: 'Dip',
              description: 'Dip 2–3"; ribs down; knees track; heels grounded'
            },
            {
              icon: 'arrow-up',
              title: 'Drive',
              description: 'Guide arc; avoid early press-out; own lockout position'
            }
          ]
        },
        {
          name: 'Split Stance Rotation Punch',
          duration: '10–12 min',
          description: 'Load back hip; rotate through; punch sleeve up powerfully.',
          battlePlan: '4 rounds\n• 5 per side Rotation Punch\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241159/mood_app/workout_images/p9g3x5md_ssrp.jpg',
          intensityReason: 'Staggered base enhances hip-to-core transfer and speed.',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Base',
              description: 'Front foot planted; rear heel high; brace ribs'
            },
            {
              icon: 'flash',
              title: 'Punch',
              description: 'Hips lead; finish stacked; reset stance between reps'
            }
          ]
        },
        {
          name: 'Hack Squat Jump (Landmine)',
          duration: '10–12 min',
          description: 'Hands low on sleeve; small pop; quiet stick; deliberate reset.',
          battlePlan: '4 rounds\n• 5 × 3 Hack Squat Jumps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241139/mood_app/workout_images/d0nqgx63_Screenshot_2025-12-03_at_3_29_11_PM.jpg',
          intensityReason: 'Supported angle reinforces vertical pop with safe landings.',
          moodTips: [
            {
              icon: 'body',
              title: 'Position',
              description: 'Torso tall; slight quad sit; heels down on dip'
            },
            {
              icon: 'footsteps',
              title: 'Landing',
              description: 'Pop straight; elbows soft; absorb softly and reset'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Triple Extension Heave',
          duration: '12–14 min',
          description: 'Dip-drive hard; guide sleeve high and far with full control.',
          battlePlan: '5 rounds\n• 4 Heaves (build load across rounds)\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241130/mood_app/workout_images/7dpyywwj_download_7_.jpg',
          intensityReason: 'Heavy leg drive expresses long-arc power safely overhead.',
          moodTips: [
            {
              icon: 'body',
              title: 'Brace',
              description: 'Brace; heels down then extend to toes'
            },
            {
              icon: 'flash',
              title: 'Follow Through',
              description: 'Hips finish before arms; follow arc; stable stance'
            }
          ]
        },
        {
          name: 'Landmine Split Jerk Ladder',
          duration: '12–16 min',
          description: 'Perform 3-2-1 per side; crisp catches and clean recoveries.',
          battlePlan: '4 rounds\n• Ladder per side: 3-2-1 Split Jerks\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241145/mood_app/workout_images/g4orfvp8_lmsjl.jpg',
          intensityReason: 'Volume ladder sustains speed-strength under fatigue safely.',
          moodTips: [
            {
              icon: 'body',
              title: 'Consistency',
              description: 'Same dip depth; balanced split; trunk stable'
            },
            {
              icon: 'footsteps',
              title: 'Recovery',
              description: 'Recover feet in order; reset grip between sets'
            }
          ]
        },
        {
          name: 'Rotational Punch + Bound',
          duration: '12–16 min',
          description: 'Hard landmine punch; then long skater bound with firm hold.',
          battlePlan: '4 rounds\n• 5 per side Rotation Punch\n• 3 per side Skater Bounds (stick 1–2s)\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241172/mood_app/workout_images/wt0jrj94_lmrot.jpg',
          intensityReason: 'Rotation power primes lateral projection and landing stick.',
          moodTips: [
            {
              icon: 'refresh',
              title: 'Punch',
              description: 'Punch: hips rotate first; ribs stacked; eyes forward'
            },
            {
              icon: 'walk',
              title: 'Bound',
              description: 'Bound: push sideways; land mid-foot; hold one to two seconds'
            }
          ]
        }
      ]
    }
  },
  // Dumbbells - 3 workouts per intensity
  {
    equipment: 'Dumbbells',
    icon: 'fitness',
    workouts: {
      beginner: [
        {
          name: 'DB Jump Squat Stick',
          duration: '8–10 min',
          description: 'Small vertical pop; soft stick; reset tall posture each rep.',
          battlePlan: '3 rounds\n• 5 × 3 Jump Squats (light)\nRest 60–75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241133/mood_app/workout_images/8ykwaghn_djs.jpg',
          intensityReason: 'Light DBs add load while protecting landing and posture.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Grip',
              description: 'DBs at sides; shoulders low; eyes forward'
            },
            {
              icon: 'footsteps',
              title: 'Landing',
              description: 'Land quiet mid-foot; reset stance before next rep'
            }
          ]
        },
        {
          name: 'DB Push Press',
          duration: '8–10 min',
          description: 'Quick dip, violent punch, smooth stacked lockout overhead.',
          battlePlan: '3 rounds\n• 5–6 Push Press\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241170/mood_app/workout_images/uezm0ryg_dpp.jpg',
          intensityReason: 'Dip-drive coordination turns leg force into press speed.',
          moodTips: [
            {
              icon: 'arrow-down',
              title: 'Dip',
              description: 'Dip vertical; heels down; elbows slightly forward'
            },
            {
              icon: 'arrow-up',
              title: 'Press',
              description: 'Drive hard; finish stacked; control descent to rack'
            }
          ]
        },
        {
          name: 'DB Split Jump Switch',
          duration: '8–10 min',
          description: 'Low-amplitude switches; aligned, quiet landings every time.',
          battlePlan: '3 rounds\n• 6 per side Split Jumps\nRest 60–75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241155/mood_app/workout_images/kkyhp422_Screenshot_2025-12-03_at_2_52_59_PM.jpg',
          intensityReason: 'Small load refines switching mechanics and stiffness safely.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Hold',
              description: 'DBs by sides; torso tall; ribs down; arms quiet'
            },
            {
              icon: 'footsteps',
              title: 'Switch',
              description: 'Switch mid-air; knees track; stick softly, then reset'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'DB Snatch Alternating',
          duration: '10–12 min',
          description: 'Zip bell close; punch through; alternate sides smoothly.',
          battlePlan: '4 rounds\n• 6 per side Alternating Snatch\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241147/mood_app/workout_images/gp7crm2s_dbsn.jpg',
          intensityReason: 'Hip snap to overhead hones turnover speed and control.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Pull',
              description: 'Hinge load; elbow high then punch; tame arc'
            },
            {
              icon: 'arrow-down',
              title: 'Return',
              description: 'Control down path; switch on floor or at rack'
            }
          ]
        },
        {
          name: 'DB Clean to Push Press',
          duration: '10–12 min',
          description: 'Fast clean to shoulders; short dip; explosive overhead finish.',
          battlePlan: '4 rounds\n• 5 Clean → Push Press\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241166/mood_app/workout_images/rpv6ft1z_dbcpp.jpg',
          intensityReason: 'Clean primes rack; push press expresses vertical power.',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Clean',
              description: 'Clean close; avoid curl; elbows slightly forward'
            },
            {
              icon: 'arrow-up',
              title: 'Press',
              description: 'Dip small; drive hard; stand tall with ribs stacked'
            }
          ]
        },
        {
          name: 'DB Broad Jump Carry',
          duration: '10–12 min',
          description: 'Two broad jumps; grab DBs; fast upright ten-meter carry.',
          battlePlan: '4 rounds\n• 2 Broad Jumps (stick) → 10m Farmer Carry\nRest 90s',
          imageUrl: 'https://customer-assets.emergentagent.com/job_muscle-mapper-2/artifacts/yclz6917_dbbjc.avif',
          intensityReason: 'Jumps then loaded carry train projection and bracing.',
          moodTips: [
            {
              icon: 'walk',
              title: 'Jumps',
              description: 'Jumps: big arms; stick one to two seconds; measure'
            },
            {
              icon: 'body',
              title: 'Carry',
              description: 'Carry: posture tall; short, fast steps; firm grip'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'DB Jump Squat Clusters',
          duration: '12–14 min',
          description: 'Three reps, quick rest, three more; match jump heights.',
          battlePlan: '5 rounds\n• Cluster: 3 + 3 Jump Squats (10–12s between)\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241136/mood_app/workout_images/9v6bw2wp_djs.jpg',
          intensityReason: 'Cluster density preserves peak speed under fatigue load.',
          moodTips: [
            {
              icon: 'body',
              title: 'Consistency',
              description: 'Same dip depth; elbows quiet; eyes forward'
            },
            {
              icon: 'time',
              title: 'Rest',
              description: 'Land soft; breathe quickly; time micro-rests precisely'
            }
          ]
        },
        {
          name: 'DB Snatch + Bound Contrast',
          duration: '12–16 min',
          description: 'Snatch sets then skater bounds with firm two-second stick.',
          battlePlan: '4 rounds\n• 6 per side DB Snatch\n• 3 per side Skater Bounds (stick 2s)\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241124/mood_app/workout_images/0tqc60nw_dbsn.jpg',
          intensityReason: 'Overhead power potentiates lateral projection capacity.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Snatch',
              description: 'Snatch: punch tall; smooth down; avoid elbow flare'
            },
            {
              icon: 'walk',
              title: 'Bound',
              description: 'Bound: push sideways; land mid-foot; hold two seconds'
            }
          ]
        },
        {
          name: 'Clean + Push Press Ladder',
          duration: '12–16 min',
          description: 'Perform 3-2-1 per side; crisp clean then vertical push press.',
          battlePlan: '4 rounds\n• Ladder per side: 3-2-1 Clean + Push Press\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241135/mood_app/workout_images/9tjq4bcw_dbcpp.jpg',
          intensityReason: 'Ladder volume sustains speed-strength with rising density.',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Clean',
              description: 'Clean close; no curl; rack quiet and tight'
            },
            {
              icon: 'arrow-up',
              title: 'Press',
              description: 'Press vertical; ribs stacked; squeeze glutes to finish'
            }
          ]
        }
      ]
    }
  },
  // Kettlebells - 3 workouts per intensity
  {
    equipment: 'Kettlebells',
    icon: 'fitness',
    workouts: {
      beginner: [
        {
          name: 'Two-Hand Swing Pop',
          duration: '8–10 min',
          description: 'Snap hips; bell floats to chest; arms act as relaxed hooks.',
          battlePlan: '4 rounds\n• 12–15 Swings\nRest 60s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241131/mood_app/workout_images/8ao6zx26_download_4_.jpg',
          intensityReason: 'Hinge rhythm trains hip extension speed and timing safely.',
          moodTips: [
            {
              icon: 'body',
              title: 'Hinge',
              description: 'Hinge; shins near vertical; lats down; neck neutral'
            },
            {
              icon: 'flash',
              title: 'Snap',
              description: 'Snap hard; plank at top; avoid lifting with arms'
            }
          ]
        },
        {
          name: 'Dead-Start Clean',
          duration: '8–10 min',
          description: 'Hike-pass; pop to rack; soft catch; alternate sides smoothly.',
          battlePlan: '3 rounds\n• 5 per side Dead-Start Cleans\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241143/mood_app/workout_images/fglieg8a_download_5_.jpg',
          intensityReason: 'Full reset engrains path, timing, and quiet turnover.',
          moodTips: [
            {
              icon: 'hand-left',
              title: 'Grip',
              description: 'Thumb back; zip close; rotate around forearm to rack'
            },
            {
              icon: 'pause',
              title: 'Reset',
              description: 'Pause fully; brace; sharp breath on each pop'
            }
          ]
        },
        {
          name: 'KB Push Press',
          duration: '8–10 min',
          description: 'Short dip; vertical punch; stacked finish; smooth controlled down.',
          battlePlan: '3 rounds\n• 6–8 per side Push Press\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241168/mood_app/workout_images/rz71s1n8_download_6_.jpg',
          intensityReason: 'Leg drive channels force into fast overhead lockout safely.',
          moodTips: [
            {
              icon: 'arrow-down',
              title: 'Dip',
              description: 'Dip vertical; heels down; wrist straight under bell'
            },
            {
              icon: 'arrow-up',
              title: 'Press',
              description: 'Punch through; biceps near ear; control to rack'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Hardstyle Swing EMOM',
          duration: '10–12 min',
          description: 'Sharp hip snaps each minute; crisp float to consistent chest.',
          battlePlan: 'EMOM 10 min\n• 12 Swings each minute',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241138/mood_app/workout_images/bg7rgit4_download_4_.jpg',
          intensityReason: 'EMOM bursts sustain repeatable high-quality power output.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Snap',
              description: 'Sharp exhales; plank at top; avoid overextension'
            },
            {
              icon: 'stop',
              title: 'Finish',
              description: 'Same height each rep; park bell cleanly each set'
            }
          ]
        },
        {
          name: 'Clean to Jerk',
          duration: '10–12 min',
          description: 'Pop to rack; dip-drive; punch under; stable overhead stick.',
          battlePlan: '4 rounds\n• 4 per side Clean → Jerk\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241149/mood_app/workout_images/gxkmxo9y_download_6_.jpg',
          intensityReason: 'Clean primes rack; jerk expresses rapid vertical force.',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Rack',
              description: 'Rack thumb in; elbow down/in; wrist neutral'
            },
            {
              icon: 'arrow-up',
              title: 'Jerk',
              description: 'Dip shallow; soft land; lock elbows solid'
            }
          ]
        },
        {
          name: 'Snatch Wave Sets',
          duration: '10–12 min',
          description: 'Execute 5-4-3 ladders per side with crisp overhead timing.',
          battlePlan: '3 waves\n• Per side: 5-4-3 Snatches (build slightly)\nRest 90s between waves',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241154/mood_app/workout_images/k2feqqcx_download_5_.jpg',
          intensityReason: 'Wave loading hones speed, turnover, and endurance quality.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Pull',
              description: 'Hike deep; high pull then punch; tame arc'
            },
            {
              icon: 'checkmark',
              title: 'Lockout',
              description: 'Own overhead; breathe sharp; park bell clean'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Heavy Swing Density',
          duration: '12–14 min',
          description: 'Sets of 10–12; float to chest; ribs stacked; avoid overpull.',
          battlePlan: '5 rounds\n• 10–12 Heavy Swings\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241138/mood_app/workout_images/bg7rgit4_download_4_.jpg',
          intensityReason: 'Heavier bell elevates output per rep with posture demand.',
          moodTips: [
            {
              icon: 'body',
              title: 'Form',
              description: 'Lats down; ribs stacked; crush handle; hinge crisp'
            },
            {
              icon: 'flash',
              title: 'Drive',
              description: 'Hips drive; bell floats; no lifting higher with arms'
            }
          ]
        },
        {
          name: 'Clean + Jerk Ladder',
          duration: '12–16 min',
          description: '3-2-1 per side; crisp rack; decisive dip-drive to lockout.',
          battlePlan: '4 rounds\n• Ladder per side: 3-2-1 Clean + Jerk\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241149/mood_app/workout_images/gxkmxo9y_download_6_.jpg',
          intensityReason: 'Ladder volume sustains speed-strength under compounding load.',
          moodTips: [
            {
              icon: 'fitness',
              title: 'Rack',
              description: 'Rack quiet; forearm vertical; no bounce on chest'
            },
            {
              icon: 'arrow-up',
              title: 'Jerk',
              description: 'Jerk tall; recover feet clean; breathe between ladders'
            }
          ]
        },
        {
          name: 'Snatch + Broad Jump Contrast',
          duration: '12–16 min',
          description: 'Snatch sets then broad jumps with firm two-second stick.',
          battlePlan: '4 rounds\n• 8 per side Snatches\n• 3 Broad Jumps (stick 2s)\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241154/mood_app/workout_images/k2feqqcx_download_5_.jpg',
          intensityReason: 'Overhead power primes horizontal projection mechanics well.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Snatch',
              description: 'Lockout stacked; quick drop; keep bell path close'
            },
            {
              icon: 'walk',
              title: 'Jump',
              description: 'Broad jump: big arms; land mid-foot; hold two seconds'
            }
          ]
        }
      ]
    }
  },
  // Chains / Bands - 3 workouts per intensity
  {
    equipment: 'Chains / Bands',
    icon: 'git-network',
    workouts: {
      beginner: [
        {
          name: 'Banded Jump Squat',
          duration: '8–10 min',
          description: 'Small vertical jumps versus band; quiet, balanced soft sticks.',
          battlePlan: '3 rounds\n• 5 × 3 Banded Jump Squats\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241141/mood_app/workout_images/e6go354m_download_2_.jpg',
          intensityReason: 'Band adds accommodating tension to sharpen peak speed top.',
          moodTips: [
            {
              icon: 'link',
              title: 'Setup',
              description: 'Anchor band low; equal tension; load centered tightly'
            },
            {
              icon: 'footsteps',
              title: 'Execution',
              description: 'Hips back then pop; knees track; land soft and stable'
            }
          ]
        },
        {
          name: 'Banded Push Press',
          duration: '8–10 min',
          description: 'Short dip, violent drive, band-accelerated overhead finish.',
          battlePlan: '3 rounds\n• 6–8 Push Press (light band)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241169/mood_app/workout_images/t37zt3nq_download.jpg',
          intensityReason: 'Band over-speed finish sharpens timing and lockout speed.',
          moodTips: [
            {
              icon: 'footsteps',
              title: 'Base',
              description: 'Band under feet; brace ribs; heels grounded'
            },
            {
              icon: 'arrow-up',
              title: 'Press',
              description: 'Punch vertical; avoid early press; control return'
            }
          ]
        },
        {
          name: 'Banded Broad Jump',
          duration: '8–10 min',
          description: 'Jump forward against band; stable stick; measured resets.',
          battlePlan: '3 rounds\n• 5–6 Banded Broad Jumps (stick 2s)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241153/mood_app/workout_images/j83mxy4p_download_1_.jpg',
          intensityReason: 'Elastic resistance builds horizontal power with control.',
          moodTips: [
            {
              icon: 'link',
              title: 'Anchor',
              description: 'Belt or waist band; anchor behind; keep line taut'
            },
            {
              icon: 'walk',
              title: 'Jump',
              description: 'Big arm swing; land mid-foot; freeze two seconds'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Chain Box Squat Speed Sets',
          duration: '10–12 min',
          description: 'Controlled sit to box; explode up; maintain crisp bar speed.',
          battlePlan: '6 rounds\n• 2 reps every 45s (speed focus)\nRest on timer',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241127/mood_app/workout_images/2ts1slh6_cbs.jpg',
          intensityReason: 'Chains deload bottom, overload top to drive fast concentric.',
          moodTips: [
            {
              icon: 'link',
              title: 'Setup',
              description: 'Chains equal both sides; box just below parallel'
            },
            {
              icon: 'flash',
              title: 'Execution',
              description: 'Control down; no relax; drive aggressively to stand'
            }
          ]
        },
        {
          name: 'Banded Deadlift Pop',
          duration: '10–12 min',
          description: 'Fast submax pulls; smooth knees; tall snap finish posture.',
          battlePlan: '4 rounds\n• 3–4 reps (submax, fast)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241162/mood_app/workout_images/qgfmm7dj_Screenshot_2025-12-03_at_2_41_04_PM.jpg',
          intensityReason: 'Band tension reinforces lockout speed and hip extension.',
          moodTips: [
            {
              icon: 'link',
              title: 'Bands',
              description: 'Mini-bands on pegs or feet; set lats; wedge hard'
            },
            {
              icon: 'flash',
              title: 'Pull',
              description: 'Push floor; hips through; avoid hitch; reset clean'
            }
          ]
        },
        {
          name: 'Banded Split Jerk',
          duration: '10–12 min',
          description: 'Quick punch under band; balanced split; one-second hold.',
          battlePlan: '4 rounds\n• 4–5 Split Jerks\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241167/mood_app/workout_images/rr22go80_download_3_.jpg',
          intensityReason: 'Elastic resistance demands rapid dip-drive and firm stick.',
          moodTips: [
            {
              icon: 'link',
              title: 'Band',
              description: 'Band anchored low; wrist neutral; ribs stacked'
            },
            {
              icon: 'arrow-up',
              title: 'Jerk',
              description: 'Dip vertical; punch; freeze one second; recover'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Banded Jump Squat Clusters',
          duration: '12–14 min',
          description: 'Three reps, brief rest, three more; match jump height.',
          battlePlan: '5 rounds\n• Cluster: 3 + 3 Banded Jump Squats\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241156/mood_app/workout_images/ltbmgctq_download_2_.jpg',
          intensityReason: 'Cluster density sustains speed under continuous tension.',
          moodTips: [
            {
              icon: 'body',
              title: 'Form',
              description: 'Same dip depth; elbows down; eyes forward'
            },
            {
              icon: 'time',
              title: 'Rest',
              description: 'Land quietly; micro-rest ten to twelve seconds'
            }
          ]
        },
        {
          name: 'Chain Deadlift Speed Waves',
          duration: '12–14 min',
          description: '5-4-3 fast pulls; submax loads; tight bar path each rep.',
          battlePlan: '3 waves\n• 5-4-3 Deadlifts (fast concentric)\nRest 150s between waves',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241132/mood_app/workout_images/8q3jz0r7_cdl.jpg',
          intensityReason: 'Wave sets maintain bar speed with rising top-end load.',
          moodTips: [
            {
              icon: 'link',
              title: 'Chains',
              description: 'Chains clear floor at top; pack lats; wedge deep'
            },
            {
              icon: 'flash',
              title: 'Pull',
              description: 'Drive legs then hips; stand tall; reset positions clean'
            }
          ]
        },
        {
          name: 'Banded Broad + Sprint Contrast',
          duration: '12–16 min',
          description: 'Three banded broads, then immediate twenty-meter sprint.',
          battlePlan: '4 rounds\n• 3 Banded Broad Jumps (stick 2s)\n• 20m Free Sprint\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241164/mood_app/workout_images/raj5xpdf_download_1_.jpg',
          intensityReason: 'Elastic priming then free sprint expresses pure speed best.',
          moodTips: [
            {
              icon: 'walk',
              title: 'Broads',
              description: 'Broads: stick two seconds; band taut; measured strides'
            },
            {
              icon: 'flash',
              title: 'Sprint',
              description: 'Sprint: tall; fast turnover; relaxed arms and jaw'
            }
          ]
        }
      ]
    }
  },
  // Trap Hex Bar - 3 workouts per intensity
  {
    equipment: 'Trap Hex Bar',
    icon: 'stop',
    workouts: {
      beginner: [
        {
          name: 'Trap Bar Jump Shrug',
          duration: '8–10 min',
          description: 'Quick knee bend to pop and shrug; quiet mid-foot landing.',
          battlePlan: '3 rounds\n• 5 × 3 Jump Shrugs (light)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241140/mood_app/workout_images/dpe352d2_tbj.jpg',
          intensityReason: 'Neutral handles support safe vertical extension mechanics.',
          moodTips: [
            {
              icon: 'body',
              title: 'Position',
              description: 'Small hinge; chest tall; lats on; ribs stacked'
            },
            {
              icon: 'footsteps',
              title: 'Landing',
              description: 'Extend hard; heels kiss; reset stance cleanly'
            }
          ]
        },
        {
          name: 'Trap Bar Deadlift Pop',
          duration: '8–10 min',
          description: 'Fast stand; smooth controlled return; reset each repetition.',
          battlePlan: '3 rounds\n• 5 × 2 Speed Deadlifts (light–moderate)\nRest 75s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241129/mood_app/workout_images/6q0q24is_tbss.jpg',
          intensityReason: 'Speed pulls teach crisp leg drive and clean hip finish.',
          moodTips: [
            {
              icon: 'body',
              title: 'Setup',
              description: 'Brace; push floor; no yank; keep lats tight'
            },
            {
              icon: 'flash',
              title: 'Execution',
              description: 'Hips through; stand tall; control eccentric down'
            }
          ]
        },
        {
          name: 'Trap Bar March to Sprint',
          duration: '8–10 min',
          description: 'Ten-meter loaded march; rack; immediate ten-meter sprint.',
          battlePlan: '3 rounds\n• 10m Trap Bar March (light)\n• 10m Free Sprint\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241161/mood_app/workout_images/pljikuu6_Screenshot_2025-12-03_at_4_35_36_PM.jpg',
          intensityReason: 'Posture and stiffness under load prepare acceleration.',
          moodTips: [
            {
              icon: 'walk',
              title: 'March',
              description: 'March tall; short steps; stiff ankles; ribs stacked'
            },
            {
              icon: 'flash',
              title: 'Sprint',
              description: 'Sprint: big knee drive; quick steps; relax arms and face'
            }
          ]
        }
      ],
      intermediate: [
        {
          name: 'Trap Bar Jump',
          duration: '10–12 min',
          description: 'Small jump with load; soft stick; deliberate stance reset.',
          battlePlan: '4 rounds\n• 5 × 3 Trap Bar Jumps\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241140/mood_app/workout_images/dpe352d2_tbj.jpg',
          intensityReason: 'Loaded jumps build speed-strength with aligned mechanics.',
          moodTips: [
            {
              icon: 'body',
              title: 'Load',
              description: 'Light load; ribs stacked; avoid deep dip on countermovement'
            },
            {
              icon: 'footsteps',
              title: 'Landing',
              description: 'Land mid-foot; absorb softly; match jump height across sets'
            }
          ]
        },
        {
          name: 'Trap Bar High Pull',
          duration: '10–12 min',
          description: 'Pop tall; elbows drive up; keep handle path tight and close.',
          battlePlan: '4 rounds\n• 4 × 2 High Pulls (moderate)\nRest 90s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241148/mood_app/workout_images/gur5s8sa_tbhp.jpg',
          intensityReason: 'Aggressive extension elevates handles with rapid speed.',
          moodTips: [
            {
              icon: 'flash',
              title: 'Pull',
              description: 'Hinge load; sweep close; full triple extension timing'
            },
            {
              icon: 'arrow-up',
              title: 'Finish',
              description: 'Elbows up/back; avoid early curl; reset between reps'
            }
          ]
        },
        {
          name: 'Deadlift + Box Jump Contrast',
          duration: '10–12 min',
          description: 'Fast deadlift; quick step to box jump; two-second stick.',
          battlePlan: '4 rounds\n• 3 Speed Deadlifts (moderate)\n• 3 Box Jumps (stick 2s)\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241174/mood_app/workout_images/wwxk13a9_tbs.jpg',
          intensityReason: 'Strength pull potentiates reactive vertical jump quality.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Deadlift',
              description: 'Deadlift: push floor; snap hips; lats packed and ribs down'
            },
            {
              icon: 'cube',
              title: 'Box Jump',
              description: 'Box: arms swing; land quiet; hold two seconds; step down controlled'
            }
          ]
        }
      ],
      advanced: [
        {
          name: 'Heavy Jump Shrug Waves',
          duration: '12–14 min',
          description: '3-2-1 across waves; crisp height; precise repeatable path.',
          battlePlan: '3 waves\n• 3-2-1 Jump Shrugs (build per wave)\nRest 150s between waves',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241367/mood_app/workout_images/z1pka0qd_tbhp.jpg',
          intensityReason: 'Wave sets preserve speed at rising relative loading.',
          moodTips: [
            {
              icon: 'body',
              title: 'Form',
              description: 'Brace hard; heels kiss; elbows quiet; breathe between reps'
            },
            {
              icon: 'flash',
              title: 'Consistency',
              description: 'Same dip depth each set; match landing quality consistently'
            }
          ]
        },
        {
          name: 'Trap Bar Jump Cluster',
          duration: '12–14 min',
          description: 'Two reps, ten seconds rest, two reps; maintain speed.',
          battlePlan: '5 rounds\n• Cluster: 2 + 2 Trap Bar Jumps\nRest 120s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241348/mood_app/workout_images/ix4wpy1u_tbj.jpg',
          intensityReason: 'Cluster density challenges elastic output and timing clean.',
          moodTips: [
            {
              icon: 'body',
              title: 'Position',
              description: 'Same depth; land quiet; ribs stacked; eyes forward'
            },
            {
              icon: 'time',
              title: 'Timing',
              description: 'Use timer; reset feet between pairs for quality consistency'
            }
          ]
        },
        {
          name: 'Deadlift + Sprint Contrast',
          duration: '12–16 min',
          description: 'Single fast pull; immediate twenty-meter relaxed sprint.',
          battlePlan: '5 rounds\n• 1 Fast Deadlift (moderate–heavy)\n• 20m Free Sprint\nRest 150s',
          imageUrl: 'https://res.cloudinary.com/dfsygar5c/image/upload/v1770241320/mood_app/workout_images/23unnykj_tbss.jpg',
          intensityReason: 'Potentiation from pull enhances next short sprint speed.',
          moodTips: [
            {
              icon: 'barbell',
              title: 'Pull',
              description: 'Pull: wedge; drive hard; clean lockout; controlled set-down'
            },
            {
              icon: 'flash',
              title: 'Sprint',
              description: 'Sprint: forward lean start; quick steps; finish tall posture'
            }
          ]
        }
      ]
    }
  }
];
