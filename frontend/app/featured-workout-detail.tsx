import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';
import { useCart, WorkoutItem } from '../contexts/CartContext';
import { Analytics, GuestAnalytics } from '../utils/analytics';
import AddCustomExerciseModal from '../components/AddCustomExerciseModal';

import { API_URL } from '../utils/apiConfig';

// Define workout exercise type matching the cart/guidance structure
interface WorkoutExercise {
  name: string;
  equipment: string;
  description: string;
  battlePlan: string;
  duration: string;
  imageUrl: string;
  intensityReason: string;
  difficulty: string;
  workoutType: string;
  moodCard: string;
  moodTips: { icon: keyof typeof Ionicons.glyphMap; title: string; description: string }[];
}

// Sub-path divider — normalises each exercise's workoutType into the
// canonical taxonomy used in cart.tsx:
//   • Sweat          → CARDIO | WEIGHTS
//   • Muscle Gainer  → <muscle group>
//   • Build Explosion→ BODY WEIGHT | WEIGHT BASED
//   • Lazy           → BODY WEIGHT | WEIGHT BASED
//   • Outdoor        → OUTDOOR
//   • Calisthenics   → CALISTHENICS
const _MUSCLE_GROUP_NAMES = new Set([
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Abs',
  'Quads', 'Hamstrings', 'Glutes', 'Calves', 'Legs',
]);
const _BODYWEIGHT_EQUIPMENT = new Set([
  'Bodyweight', 'No Equipment', 'Pull-up Bar', 'Parallel Bars', 'Bar',
]);
function getExerciseSubPathLabel(ex: WorkoutExercise): string | null {
  const wt = (ex?.workoutType || '').trim();
  if (!wt) return null;
  const wtLower = wt.toLowerCase();

  if (wt.startsWith('Muscle Building')) {
    const parts = wt.split(' - ');
    const muscle = parts.length > 1 ? parts[parts.length - 1].trim() : '';
    return muscle || null;
  }
  if (_MUSCLE_GROUP_NAMES.has(wt)) return wt;
  if (wtLower.startsWith('muscle gainer')) {
    const parts = wt.split(' - ');
    return parts.length > 1 ? parts[parts.length - 1].trim() : 'Muscle Gainer';
  }

  if (wtLower.startsWith('sweat')) {
    if (wtLower.includes('cardio')) return 'Cardio';
    if (wtLower.includes('weight') || wtLower.includes('resistance')) return 'Weights';
    return 'Cardio';
  }

  if (wtLower.startsWith('build explosion') || wtLower.startsWith('explosion')) {
    if (wtLower.includes('body weight') || wtLower.includes('bodyweight') || wtLower.includes('plyo')) {
      return 'Body Weight';
    }
    return 'Weight Based';
  }

  if (wtLower.startsWith('lazy')) {
    const equip = (ex?.equipment || '').trim();
    if (wtLower.includes('body weight') || wtLower.includes('bodyweight') || _BODYWEIGHT_EQUIPMENT.has(equip)) {
      return 'Body Weight';
    }
    return 'Weight Based';
  }

  if (wtLower.startsWith('outdoor') || wtLower.startsWith('get outside')) {
    return 'Outdoor';
  }

  if (wtLower.startsWith('calisthenics') || wtLower.startsWith('bodyweight only')) {
    return 'Calisthenics';
  }

  if (wt === 'Custom' || wt === 'Workout' || wt === 'Unknown') return null;
  if (wt.includes(' - ')) {
    const parts = wt.split(' - ');
    return parts[parts.length - 1].trim();
  }
  return wt;
}

// Define the workout data for each featured workout - using REAL workout data from the database
const featuredWorkoutData: Record<string, {
  mood: string;
  title: string;
  duration: string;
  image: string;
  exercises: WorkoutExercise[];
}> = {
  '1': {
    mood: 'Sweat / Burn Fat',
    title: 'Cardio Based',
    duration: '25-35 min',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
    exercises: [
      { 
        name: 'Hill & Sprint',
        equipment: 'Stationary bike',
        description: 'Alternating seated climbs and standing sprints build explosive cardio power.',
        battlePlan: '5 min warm-up at moderate resistance\n• 2 min seated climb (high resistance)\n• 1 min standing sprint (moderate resistance)\n• 2 min recovery spin\n• Repeat climb-sprint-recovery 3x\n• 5 min cool down',
        duration: '20 min',
        imageUrl: 'https://customer-assets.emergentagent.com/job_fitness-app-ui/artifacts/fbe3z3jx_download%20%281%29.png',
        intensityReason: 'Hill climbs build leg strength while sprints maximize calorie burn',
        difficulty: 'intermediate',
        workoutType: 'Sweat / Burn Fat - Cardio Based',
        moodCard: 'Sweat / Burn Fat',
        moodTips: [
          { icon: 'speedometer', title: 'Maintain Cadence', description: 'Keep your pedaling cadence consistent during climbs for better muscle engagement.' },
          { icon: 'heart', title: 'Heart Rate Zone', description: 'Aim for 70-85% max heart rate during sprints, recover at 60% between intervals.' }
        ]
      },
      { 
        name: 'Hill Climb',
        equipment: 'Stair master',
        description: 'Progressive stair climbing builds cardiovascular endurance and leg strength.',
        battlePlan: '3 min warm-up at level 4\n• 2 min at level 7\n• 1 min at level 10 (power steps)\n• 2 min at level 5 (recovery)\n• Repeat high-power-recovery 4x\n• 3 min cool down at level 3',
        duration: '18 min',
        imageUrl: 'https://customer-assets.emergentagent.com/job_fitness-app-ui/artifacts/yjdyjdsw_sm.avif',
        intensityReason: 'Variable intensity stair climbing maximizes cardio adaptation',
        difficulty: 'intermediate',
        workoutType: 'Sweat / Burn Fat - Cardio Based',
        moodCard: 'Sweat / Burn Fat',
        moodTips: [
          { icon: 'body', title: 'Posture Check', description: 'Stand tall with slight forward lean. Avoid hunching over the machine.' },
          { icon: 'flame', title: 'Glute Activation', description: 'Press through your heels to maximize glute engagement on each step.' }
        ]
      },
    ],
  },
  '2': {
    mood: 'Muscle Gainer',
    title: 'Back & Bis Volume',
    duration: '45-60 min',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=600&fit=crop',
    exercises: [
      // Back - Adjustable Bench - Chest Support Row (Intermediate)
      { 
        name: 'Chest-Support Row',
        equipment: 'Adjustable bench',
        description: 'Supported rows and flies promote strict contraction',
        battlePlan: '4 rounds\n• 8 Chest-Supported Dumbbell Row\nRest 75-90s\n• 10 Incline Prone Reverse Fly\nRest 75-90s',
        duration: '14-16 min',
        imageUrl: 'https://customer-assets.emergentagent.com/job_0b65e409-b210-4730-af62-16b022c37685/artifacts/q6jestgn_download.png',
        intensityReason: 'Neutral spine from support isolates lats + traps',
        difficulty: 'intermediate',
        workoutType: 'Muscle Gainer - Back & Bis Volume',
        moodCard: 'Muscle Gainer',
        moodTips: [
          { icon: 'flash', title: "Don't yank dumbbells-steady elbows driving back.", description: 'Controlled elbow drive maximizes lat activation over momentum.' },
          { icon: 'timer', title: 'Go light on reverse fly, pause 1s at top.', description: 'Peak contraction pause enhances rear delt development.' }
        ]
      },
      // Back - T-Bar Row Machine - Slow Neg Row (Intermediate)
      { 
        name: 'Slow Neg Row',
        equipment: 'T bar row machine',
        description: 'Time-under-tension row progression provides a challenging switchup',
        battlePlan: '4 rounds\n• 8 Neutral Grip Row (3-4s eccentric)\nRest 90s after set',
        duration: '12-14 min',
        imageUrl: 'https://customer-assets.emergentagent.com/job_0b65e409-b210-4730-af62-16b022c37685/artifacts/xdrugsxs_tr.jpg',
        intensityReason: '3-4s eccentric tempo increases hypertrophy effect',
        difficulty: 'intermediate',
        workoutType: 'Muscle Gainer - Back & Bis Volume',
        moodCard: 'Muscle Gainer',
        moodTips: [
          { icon: 'trending-up', title: 'Explode to chest, lower slow & steady.', description: 'Fast concentric, slow eccentric maximizes muscle stimulus.' },
          { icon: 'timer', title: 'Keep weight lighter to maintain control.', description: 'Reduced load allows proper tempo execution and form.' }
        ]
      },
      // Back - Straight Pull Up Bar - Pull Up + Hold (Intermediate)
      { 
        name: 'Pull-Up + Hold',
        equipment: 'Straight pull up bar',
        description: 'Combines pull-ups with a static hold for enhanced strength',
        battlePlan: '3 rounds\n• 6 Pull-Ups\nEnd each set with a 3s hold at the top\nRest 90s after set',
        duration: '12-14 min',
        imageUrl: 'https://customer-assets.emergentagent.com/job_fit-outdoor-views/artifacts/toza6up4_pu.avif',
        intensityReason: 'Adds isometric hold to increase time under tension for growth',
        difficulty: 'intermediate',
        workoutType: 'Muscle Gainer - Back & Bis Volume',
        moodCard: 'Muscle Gainer',
        moodTips: [
          { icon: 'trending-up', title: 'Aim for unassisted reps. If form breaks, use minimal assistance.', description: 'Progressive overload with isometric challenge builds strength.' },
          { icon: 'timer', title: 'Hold chin above bar for 3 seconds at the top of each final rep.', description: 'Isometric hold maximizes time under tension and strength gains.' }
        ]
      },
      // Biceps - Cable Machine - Cable Negatives (Intermediate)
      { 
        name: 'Cable Negatives',
        equipment: 'Cable Machine',
        description: 'Negative bar curls grow size and total integrity',
        battlePlan: '3 rounds\n• 8 Cable Bar Curls (3s eccentric)\nRest 75-90s',
        duration: '12-14 min',
        imageUrl: 'https://customer-assets.emergentagent.com/job_fit-outdoor-views/artifacts/vqw55nvb_download%20%2818%29.png',
        intensityReason: 'Slow eccentrics amplify hypertrophy adaptation',
        difficulty: 'intermediate',
        workoutType: 'Muscle Gainer - Back & Bis Volume',
        moodCard: 'Muscle Gainer',
        moodTips: [
          { icon: 'flash', title: 'Drive up powerfully, lower 3s', description: 'Explosive concentric, controlled eccentric.' },
          { icon: 'fitness', title: 'Elbows fixed at torso sides', description: 'Locked elbows ensure bicep isolation.' }
        ]
      },
      // Biceps - EZ Curl Bar - Narrow Curl (Intermediate)
      { 
        name: 'Narrow Curl',
        equipment: 'EZ Curl Bar',
        description: 'Close grip curls build stronger arm inner heads',
        battlePlan: '4 rounds\n• 8-10 Narrow Grip EZ Curls\nRest 75-90s',
        duration: '12-14 min',
        imageUrl: 'https://customer-assets.emergentagent.com/job_de06d55d-ac38-4152-bbf5-479c53d1fb22/artifacts/iskvqgub_download%20%284%29.png',
        intensityReason: 'Narrow grip overloads the biceps inner portion',
        difficulty: 'intermediate',
        workoutType: 'Muscle Gainer - Back & Bis Volume',
        moodCard: 'Muscle Gainer',
        moodTips: [
          { icon: 'hand-left', title: 'Keep palms inward, elbows close', description: 'Narrow grip targets inner biceps.' },
          { icon: 'trending-up', title: 'Pull bar to upper chest line', description: 'Full range maximizes muscle fiber recruitment.' }
        ]
      },
    ],
  },
  '3': {
    mood: 'Build Explosion',
    title: 'Power Lifting',
    duration: '30-40 min',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=600&fit=crop',
    exercises: [
      { 
        name: 'Hang Clean Pull to Tall Shrug',
        equipment: 'Power Lifting Platform',
        description: 'Explosive hip extension with powerful shrug develops total body power.',
        battlePlan: '5 sets\n• 5 Hang Clean Pulls with Tall Shrug\n• Focus on explosive hip drive\n• Arms stay straight until shrug\nRest 90-120s between sets',
        duration: '12 min',
        imageUrl: 'https://customer-assets.emergentagent.com/job_muscle-mapper-2/artifacts/9kehs3fb_Screenshot%202025-12-03%20at%204.15.03%E2%80%AFPM.png',
        intensityReason: 'Olympic lift derivative builds explosive power through triple extension',
        difficulty: 'intermediate',
        workoutType: 'Build Explosion - Power Lifting',
        moodCard: 'Build Explosion',
        moodTips: [
          { icon: 'flash', title: 'Hip Drive First', description: 'The power comes from snapping your hips forward, not pulling with arms.' },
          { icon: 'body', title: 'Triple Extension', description: 'Extend ankles, knees, and hips simultaneously for maximum power.' }
        ]
      },
      { 
        name: 'Push Press Launch',
        equipment: 'Power Lifting Platform',
        description: 'Explosive overhead press using leg drive for maximum power output.',
        battlePlan: '5 sets\n• 5 Push Press\n• Quick dip, explosive drive\n• Lock out arms overhead\nRest 90-120s between sets',
        duration: '10 min',
        imageUrl: 'https://customer-assets.emergentagent.com/job_muscle-mapper-2/artifacts/1n6uft3o_pp.jpg',
        intensityReason: 'Leg-driven overhead press allows heavier loads than strict press',
        difficulty: 'intermediate',
        workoutType: 'Build Explosion - Power Lifting',
        moodCard: 'Build Explosion',
        moodTips: [
          { icon: 'trending-up', title: 'Vertical Path', description: 'Push your head through once the bar passes your face for proper lockout.' },
          { icon: 'flash', title: 'Speed Matters', description: 'The faster the dip-drive, the more weight you can move.' }
        ]
      },
      { 
        name: 'Trap Bar Jump',
        equipment: 'Trap Hex Bar',
        description: 'Loaded jumps develop explosive lower body power.',
        battlePlan: '4 sets\n• 6 Trap Bar Jumps\n• Use 50% deadlift max\n• Land softly, reset fully\nRest 90s between sets',
        duration: '10 min',
        imageUrl: 'https://customer-assets.emergentagent.com/job_muscle-mapper-2/artifacts/dpe352d2_tbj.webp',
        intensityReason: 'Loaded jumps bridge strength and explosive power development',
        difficulty: 'intermediate',
        workoutType: 'Build Explosion - Power Lifting',
        moodCard: 'Build Explosion',
        moodTips: [
          { icon: 'body', title: 'Soft Landing', description: 'Land with bent knees to absorb impact. Reset fully before each jump.' },
          { icon: 'flash', title: 'Max Intent', description: 'Jump as high as possible on every rep. Submaximal effort = submaximal results.' }
        ]
      },
      { 
        name: 'Landmine Split Jerk Pop',
        equipment: 'Landmine Attachment',
        description: 'Landmine-loaded split jerk pops build single-leg explosive power.',
        battlePlan: '4 sets\n• 4 per side Split Jerk Pops\n• Bar on shoulder, dip and explode\n• Land softly in split stance\nRest 90s between sets',
        duration: '10 min',
        imageUrl: 'https://customer-assets.emergentagent.com/job_muscle-mapper-2/artifacts/40bblhga_lmspj.jpg',
        intensityReason: 'Angled path teaches leg drive and stable split catch safely',
        difficulty: 'intermediate',
        workoutType: 'Build Explosion - Power Lifting',
        moodCard: 'Build Explosion',
        moodTips: [
          { icon: 'body', title: 'Core Stability', description: 'Brace your core to prevent rotation. The landmine wants to twist you.' },
          { icon: 'flash', title: 'Reactive Power', description: 'Minimize time on the ground between reps for plyometric benefits.' }
        ]
      },
    ],
  },
  '4': {
    mood: 'Calisthenics',
    title: 'Pulls & Dips',
    duration: '25-35 min',
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
    exercises: [
      { 
        name: 'Eccentric Lines',
        equipment: 'Pull up bar',
        description: 'Slow negative pull-ups build strength through controlled lowering.',
        battlePlan: '5 sets\n• 3 Eccentric Pull-Ups\n• Jump to top position\n• Hold chin over bar 2 sec\n• Lower for 8 seconds\nRest 60-90s between sets',
        duration: '10 min',
        imageUrl: 'https://customer-assets.emergentagent.com/job_upper-body-enhance/artifacts/7475d60t_chin%20ups.png',
        intensityReason: 'Eccentric training builds pulling strength even without full pull-up ability',
        difficulty: 'intermediate',
        workoutType: 'Calisthenics - Pulls & Dips',
        moodCard: 'Calisthenics',
        moodTips: [
          { icon: 'timer', title: 'Consistency', description: 'Each rep should take the same time. Dont speed up as you fatigue.' },
          { icon: 'fitness', title: 'Shoulder Engagement', description: 'Keep shoulders engaged even at the bottom. Dont just hang on joints.' }
        ]
      },
      { 
        name: 'Strict Pull',
        equipment: 'Pull up bar',
        description: 'Perfect form pull-ups with no kipping or swinging.',
        battlePlan: '5 sets\n• Max Strict Pull-Ups\n• Dead hang start\n• No kipping or swinging\n• Lower with control (3 sec)\nRest 90s between sets',
        duration: '12 min',
        imageUrl: 'https://customer-assets.emergentagent.com/job_upper-body-enhance/artifacts/kzuswott_download%20%2815%29.png',
        intensityReason: 'Strict form maximizes muscle activation and strength development',
        difficulty: 'advanced',
        workoutType: 'Calisthenics - Pulls & Dips',
        moodCard: 'Calisthenics',
        moodTips: [
          { icon: 'body', title: 'Dead Stop', description: 'Come to complete stop at bottom. No bouncing out of the hang.' },
          { icon: 'fitness', title: 'Elbow Path', description: 'Pull elbows down and back, not out to the sides.' }
        ]
      },
      { 
        name: 'Eccentric Power',
        equipment: 'Parallel bars dip station',
        description: 'Slow descent dips with explosive push build upper body power.',
        battlePlan: '4 sets\n• 6 Eccentric Power Dips\n• Lower for 5 seconds\n• Go below 90° elbow angle\n• Push back up explosively\nRest 60-90s between sets',
        duration: '10 min',
        imageUrl: 'https://customer-assets.emergentagent.com/job_upper-body-enhance/artifacts/bhu7tjin_download%20%2814%29.png',
        intensityReason: 'Slow eccentric with explosive concentric builds strength and power',
        difficulty: 'intermediate',
        workoutType: 'Calisthenics - Pulls & Dips',
        moodCard: 'Calisthenics',
        moodTips: [
          { icon: 'body', title: 'Depth', description: 'Lower until shoulders are below elbows for full range of motion.' },
          { icon: 'flash', title: 'Explosive Push', description: 'Drive hard out of the bottom. Speed on the way up builds power.' }
        ]
      },
    ],
  },
  '5': {
    mood: 'Get Outside',
    title: 'Hill Workout',
    duration: '30-40 min',
    image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=600&fit=crop',
    exercises: [
      { 
        name: 'Hill Power Mix',
        equipment: 'Hills',
        description: 'Hill sprint intervals build explosive leg power and cardio endurance.',
        battlePlan: '10 min easy jog warm-up\n• Find a steep hill (30-60 sec climb)\n• Sprint up at 85% effort\n• Walk down for recovery\n• Repeat 6 times\n• 10 min easy jog cool-down',
        duration: '25 min',
        imageUrl: 'https://customer-assets.emergentagent.com/job_exercise-library-12/artifacts/zqqramht_download%20%2813%29.png',
        intensityReason: 'Hill sprints combine strength and cardio for complete conditioning',
        difficulty: 'intermediate',
        workoutType: 'Get Outside - Hill Workout',
        moodCard: 'Get Outside',
        moodTips: [
          { icon: 'body', title: 'Knee Drive', description: 'Lift knees high to engage hip flexors and glutes on the climb.' },
          { icon: 'heart', title: 'Recovery', description: 'Walk all the way down. Jogging down adds fatigue without building power.' }
        ]
      },
      { 
        name: 'Sprint Only 30s',
        equipment: 'Hills',
        description: 'Short all-out sprints with full recovery maximize power output.',
        battlePlan: '8 min easy jog warm-up\n• Find moderate incline\n• 30 sec all-out sprint\n• 90 sec walk recovery\n• Repeat 8 times\n• 5 min walk cool-down',
        duration: '22 min',
        imageUrl: 'https://customer-assets.emergentagent.com/job_exercise-library-12/artifacts/8d9vosf3_download%20%2812%29.png',
        intensityReason: 'True max effort sprints with full recovery build explosive speed',
        difficulty: 'intermediate',
        workoutType: 'Get Outside - Hill Workout',
        moodCard: 'Get Outside',
        moodTips: [
          { icon: 'flash', title: 'Max Effort', description: '30 seconds is short. Give it everything you have, every rep.' },
          { icon: 'timer', title: 'Full Recovery', description: 'Take the full 90 seconds. Partial recovery = partial effort on the next sprint.' }
        ]
      },
    ],
  },
  '6': {
    mood: 'Sweat / Burn Fat',
    title: 'HIIT - Intense Full Body',
    duration: '45-55 min',
    image: 'https://customer-assets.emergentagent.com/job_3f3e12c6-013b-4158-b2e9-29980fb2b4f9/artifacts/p7pyg0r0_download%20%289%29.png',
    exercises: [
      { 
        name: 'Kettlebell AMRAP 15',
        equipment: 'Kettlebells',
        description: 'Complete as many rounds as possible in 15 minutes. This high-intensity kettlebell workout combines explosive power, agility, and complex movement patterns for maximum conditioning.',
        battlePlan: 'AMRAP 15 minutes:\n• 10 double kettlebell swings\n• 8 alternating snatches (4 each side)\n• 6 goblet squat jumps\n• 4 Turkish get-ups (2 each side)\nNo scheduled rest-move continuously',
        duration: '15 min',
        imageUrl: 'https://customer-assets.emergentagent.com/job_3f3e12c6-013b-4158-b2e9-29980fb2b4f9/artifacts/p7pyg0r0_download%20%289%29.png',
        intensityReason: 'Maximum intensity AMRAP combining power, agility, and complex movement patterns.',
        difficulty: 'advanced',
        workoutType: 'HIIT - Intense Full Body',
        moodCard: 'Sweat / Burn Fat',
        moodTips: [
          { icon: 'flash', title: 'Double Swing Power', description: 'Double swings-engage lats, keep wrists neutral throughout the movement.' },
          { icon: 'body', title: 'Turkish Get-up Control', description: 'Go slow on get-ups, stack joints overhead at each position.' }
        ]
      },
      { 
        name: 'Battle Rope Gauntlet',
        equipment: 'Battle Ropes',
        description: 'Extended high-intensity gauntlet testing advanced cardiovascular capacity and rope mastery. Four rounds of continuous rope work with minimal rest.',
        battlePlan: 'Perform 4 rounds:\n• 30s alternating waves\n• 30s power slams\n• 30s side-to-side waves\n• 30s jumping jacks with ropes\n• 30s circles (15s each direction)\nRest 1 min between rounds',
        duration: '24 min',
        imageUrl: 'https://customer-assets.emergentagent.com/job_3f3e12c6-013b-4158-b2e9-29980fb2b4f9/artifacts/eiulsyjf_download%20%285%29.png',
        intensityReason: 'Extended high-intensity gauntlet testing advanced cardiovascular capacity and rope mastery.',
        difficulty: 'advanced',
        workoutType: 'HIIT - Intense Full Body',
        moodCard: 'Sweat / Burn Fat',
        moodTips: [
          { icon: 'refresh', title: 'Rhythm Control', description: 'Keep steady rhythm across all rope patterns, even when fatigued.' },
          { icon: 'flash', title: 'Breathing Technique', description: 'Sync breathing pattern with wave count-exhale on each wave peak.' }
        ]
      },
      { 
        name: 'Sled & Burpee Circuit',
        equipment: 'Sled',
        description: 'Ultimate challenge combining heavy sled work with burpees for maximum conditioning stress. This brutal circuit builds mental and physical toughness.',
        battlePlan: 'Perform 4 rounds:\n• 10m heavy sled push\n• 10 burpees\n• 10m backward sled drag\n• 10 burpees\nRest 1 min between rounds',
        duration: '24 min',
        imageUrl: 'https://customer-assets.emergentagent.com/job_3f3e12c6-013b-4158-b2e9-29980fb2b4f9/artifacts/x5whpyy7_download%20copy.png',
        intensityReason: 'Ultimate challenge combining heavy sled work with burpees for maximum conditioning stress.',
        difficulty: 'advanced',
        workoutType: 'HIIT - Intense Full Body',
        moodCard: 'Sweat / Burn Fat',
        moodTips: [
          { icon: 'body', title: 'Burpee Transition', description: 'Drop tight into burpees-no sagging hips. Keep core braced.' },
          { icon: 'flash', title: 'Reset Power', description: 'Push explosively out of burpees and into the sled immediately.' }
        ]
      },
    ],
  },
};

// Convert API workout format to local exercise format
const convertApiExerciseToLocal = (ex: any): WorkoutExercise => ({
  name: ex.name || '',
  equipment: ex.equipment || '',
  description: ex.description || '',
  battlePlan: ex.battlePlan || '',
  duration: ex.duration || '',
  imageUrl: ex.imageUrl || '',
  intensityReason: ex.intensityReason || '',
  difficulty: ex.difficulty || 'intermediate',
  workoutType: ex.workoutType || '',
  moodCard: ex.moodCard || '',
  moodTips: ex.moodTips || [],
});

export default function FeaturedWorkoutDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  
  const workoutId = params.id as string;
  
  // Cart context for adding exercises
  const { addToCart, cartItems } = useCart();
  
  // State for workout data
  const [workoutData, setWorkoutData] = useState<{
    mood: string;
    title: string;
    duration: string;
    image: string;
    exercises: WorkoutExercise[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize exercises state
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  
  // Handle adding custom exercise to the featured workout
  const handleAddCustomExercise = (workout: WorkoutItem) => {
    const newExercise: WorkoutExercise = {
      name: workout.name,
      equipment: workout.equipment || 'Custom',
      description: workout.description || '',
      battlePlan: workout.battlePlan || '',
      duration: workout.duration,
      imageUrl: workout.imageUrl || '',
      intensityReason: workout.intensityReason || '',
      difficulty: workout.difficulty || 'Custom',
      workoutType: workout.workoutType || 'Custom',
      moodCard: workout.moodCard || 'Custom Exercise',
      moodTips: [],
    };
    setExercises([...exercises, newExercise]);
  };
  
  // Fetch workout data - first try API, fallback to hardcoded
  useEffect(() => {
    const fetchWorkout = async () => {
      setLoading(true);
      console.log('Fetching workout with ID:', workoutId);
      
      // First try to fetch from API (for new MongoDB IDs)
      try {
        console.log('Attempting API fetch for workout ID:', workoutId);
        const response = await fetch(`${API_URL}/api/featured/workouts/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify([workoutId]),
        });
        
        console.log('API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('API response data:', JSON.stringify(data, null, 2).slice(0, 500));
          
          if (data.workouts && data.workouts.length > 0) {
            const apiWorkout = data.workouts[0];
            console.log('API workout found:', apiWorkout.title, 'exercises:', apiWorkout.exercises?.length);
            const convertedWorkout = {
              mood: apiWorkout.mood,
              title: apiWorkout.title,
              duration: apiWorkout.duration || `${apiWorkout.durationMin || 30} min`,
              image: apiWorkout.heroImageUrl || apiWorkout.exercises?.[0]?.imageUrl || '',
              exercises: (apiWorkout.exercises || []).map(convertApiExerciseToLocal),
            };
            console.log('Converted workout:', convertedWorkout.title, 'exercises:', convertedWorkout.exercises.length);
            setWorkoutData(convertedWorkout);
            setExercises(convertedWorkout.exercises);
            setLoading(false);
            return;
          } else {
            console.log('No workouts returned from API for ID:', workoutId);
          }
        } else {
          console.log('API returned non-OK status:', response.status);
        }
      } catch (error) {
        console.log('API fetch failed, trying hardcoded data:', error);
      }
      
      // Fallback to hardcoded data for old IDs (backward compatibility)
      const hardcodedWorkout = featuredWorkoutData[workoutId];
      if (hardcodedWorkout) {
        console.log('Using hardcoded workout data');
        setWorkoutData(hardcodedWorkout);
        setExercises([...hardcodedWorkout.exercises]);
      } else {
        console.log('No hardcoded workout found for ID:', workoutId);
      }
      
      setLoading(false);
    };
    
    fetchWorkout();
  }, [workoutId]);
  
  // Alias for backward compatibility
  const workout = workoutData;
  
  // Check if workout is already saved
  useEffect(() => {
    if (token && workout) {
      checkIfSaved();
    }
  }, [token, workout]);
  
  const checkIfSaved = async () => {
    try {
      const workoutName = `${workout.mood} - ${workout.title}`;
      const response = await fetch(`${API_URL}/api/saved-workouts/check/${encodeURIComponent(workoutName)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setIsSaved(data.is_saved);
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };
  
  const handleSaveWorkout = async () => {
    if (!token) {
      Alert.alert('Login Required', 'Please login to save workouts');
      return;
    }
    
    if (isSaved) {
      return; // Already saved, don't save again
    }
    
    setIsSaving(true);
    try {
      const totalDuration = exercises.reduce((total, ex) => {
        const mins = parseInt(ex.duration.split(' ')[0]) || 0;
        return total + mins;
      }, 0);
      
      console.log('Saving workout to:', `${API_URL}/api/saved-workouts`);
      console.log('Workout name:', `${workout.mood} - ${workout.title}`);
      
      const response = await fetch(`${API_URL}/api/saved-workouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${workout.mood} - ${workout.title}`,
          workouts: exercises.map(ex => ({
            name: ex.name,
            equipment: ex.equipment,
            duration: ex.duration,
            difficulty: ex.difficulty,
            description: ex.description,
            battlePlan: ex.battlePlan,
            imageUrl: ex.imageUrl,
            intensityReason: ex.intensityReason,
            workoutType: ex.workoutType,
            moodCard: ex.moodCard,
            moodTips: ex.moodTips,
          })),
          total_duration: totalDuration,
          source: 'featured',
          featured_workout_id: workoutId,
          mood: workout.mood,
          title: workout.title,
        }),
      });
      
      console.log('Save response status:', response.status);
      
      if (response.ok) {
        setIsSaved(true);
      } else if (response.status === 400) {
        setIsSaved(true);
      } else {
        const errorText = await response.text();
        console.error('Save error:', errorText);
        Alert.alert('Error', 'Failed to save workout');
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Loading workout...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!workout) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Workout not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const removeExercise = (index: number) => {
    if (exercises.length <= 1) {
      Alert.alert(
        'Cannot Remove',
        'You need at least one exercise to start a workout.',
        [{ text: 'OK' }]
      );
      return;
    }
    const newExercises = exercises.filter((_, i) => i !== index);
    setExercises(newExercises);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newExercises = [...exercises];
      [newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]];
      setExercises(newExercises);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < exercises.length - 1) {
      const newExercises = [...exercises];
      [newExercises[index], newExercises[index + 1]] = [newExercises[index + 1], newExercises[index]];
      setExercises(newExercises);
    }
  };

  const handleStartWorkout = () => {
    if (exercises.length === 0) return;
    
    // Track "try workout clicked" event
    if (token) {
      Analytics.tryWorkoutClicked(token, {
        workout_name: workout.title,
        equipment: exercises[0]?.equipment || '',
        difficulty: exercises[0]?.difficulty || '',
        mood_category: workout.mood,
        source: 'featured',
      });
      
      Analytics.featuredWorkoutStarted(token, {
        workout_id: workoutId,
        workout_title: workout.title,
        mood_category: workout.mood,
        exercise_count: exercises.length,
      });
    } else {
      // Track for guest users
      GuestAnalytics.tryWorkoutClicked({
        workout_name: workout.title,
        equipment: exercises[0]?.equipment || '',
        difficulty: exercises[0]?.difficulty || '',
        mood_category: workout.mood,
        source: 'featured',
      });
    }
    
    // Format exercises for the workout guidance session - matching cart format exactly
    const sessionWorkouts = exercises.map(exercise => ({
      workoutName: exercise.name, // Use workoutName for consistency
      name: exercise.name,
      equipment: exercise.equipment,
      description: exercise.description,
      battlePlan: exercise.battlePlan,
      duration: exercise.duration,
      difficulty: exercise.difficulty,
      workoutType: exercise.workoutType,
      moodCard: exercise.moodCard,
      moodTips: exercise.moodTips,
      imageUrl: exercise.imageUrl || '', // Include image URL for replication
      intensityReason: exercise.intensityReason || '',
    }));
    
    // Navigate to workout guidance with the first exercise - same as cart.tsx
    const firstExercise = sessionWorkouts[0];
    router.push({
      pathname: '/workout-guidance',
      params: {
        workoutName: firstExercise.name,
        equipment: firstExercise.equipment,
        description: firstExercise.description,
        battlePlan: firstExercise.battlePlan,
        duration: firstExercise.duration,
        difficulty: firstExercise.difficulty,
        workoutType: firstExercise.workoutType,
        moodCard: firstExercise.moodCard,
        sessionWorkouts: JSON.stringify(sessionWorkouts),
        currentSessionIndex: '0',
        isSession: 'true',
        moodTips: encodeURIComponent(JSON.stringify(firstExercise.moodTips)),
        featuredWorkoutId: workoutId,
        featuredWorkoutTitle: workout.title,
      }
    });
  };

  // Add all exercises to cart
  const handleAddAllToCart = () => {
    let addedCount = 0;
    exercises.forEach((exercise, index) => {
      const cartItem: WorkoutItem = {
        id: `featured-${workoutId}-${index}-${Date.now()}`,
        name: exercise.name,
        duration: exercise.duration,
        description: exercise.description,
        battlePlan: exercise.battlePlan,
        imageUrl: exercise.imageUrl,
        intensityReason: exercise.intensityReason,
        equipment: exercise.equipment,
        difficulty: exercise.difficulty,
        workoutType: exercise.workoutType,
        moodCard: exercise.moodCard,
        moodTips: exercise.moodTips,
      };
      addToCart(cartItem);
      addedCount++;
    });
    
    Alert.alert(
      'Added to Cart',
      `${addedCount} exercise${addedCount !== 1 ? 's' : ''} added to your cart. You can now customize your workout.`,
      [
        { text: 'View Cart', onPress: () => router.push('/cart') },
        { text: 'Continue', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Hero Image - Uses first exercise's image */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: exercises[0]?.imageUrl || workout.image }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroOverlay} />
        
        {/* Back Button */}
        <TouchableOpacity 
          style={[styles.headerBackButton, { top: insets.top + 10 }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        {/* Save Button */}
        <TouchableOpacity 
          style={[
            styles.headerSaveButton, 
            { top: insets.top + 10 },
            isSaved && styles.headerSaveButtonSaved
          ]}
          onPress={handleSaveWorkout}
          disabled={isSaving || isSaved}
        >
          {isSaving ? (
            <Text style={styles.savingText}>...</Text>
          ) : isSaved ? (
            <>
              <Ionicons name="checkmark" size={18} color="#000" />
              <Text style={styles.savedText}>Saved</Text>
            </>
          ) : (
            <Ionicons name="bookmark-outline" size={22} color="#fff" />
          )}
        </TouchableOpacity>
        
        {/* Hero Content */}
        <View style={styles.heroContent}>
          <Text style={styles.moodLabel}>{workout.mood}</Text>
          <Text style={styles.workoutTitle}>{workout.title}</Text>
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={14} color="#FFD700" />
            <Text style={styles.durationText}>{workout.duration}</Text>
          </View>
        </View>
      </View>

      {/* Exercise List */}
      <View style={styles.contentContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Exercises ({exercises.length})</Text>
        </View>

        <ScrollView 
          style={styles.exerciseList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {exercises.map((exercise, index) => {
            const subPath = getExerciseSubPathLabel(exercise);
            const prevSubPath = index > 0 ? getExerciseSubPathLabel(exercises[index - 1]) : null;
            const showDivider = subPath && subPath !== prevSubPath;
            return (
              <React.Fragment key={index}>
                {showDivider && (
                  <View
                    style={styles.subPathDivider}
                    testID={`featured-subpath-divider-${subPath!.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                  >
                    <View style={styles.subPathDividerLine} />
                    <Text style={styles.subPathDividerLabel}>{subPath!.toUpperCase()}</Text>
                    <View style={styles.subPathDividerLine} />
                  </View>
                )}
                <View style={styles.exerciseCard}>
              <Image 
                source={{ uri: exercise.imageUrl }}
                style={styles.exerciseImage}
                resizeMode="cover"
              />
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseEquipment}>{exercise.equipment}</Text>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDuration}>{exercise.duration}</Text>
              </View>
              <View style={styles.exerciseActions}>
                <View style={styles.reorderButtons}>
                  <TouchableOpacity
                    style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
                    onPress={() => handleMoveUp(index)}
                    disabled={index === 0}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name='chevron-up' 
                      size={18} 
                      color={index === 0 ? 'rgba(255, 255, 255, 0.3)' : '#fff'} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reorderButton, index === exercises.length - 1 && styles.reorderButtonDisabled]}
                    onPress={() => handleMoveDown(index)}
                    disabled={index === exercises.length - 1}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name='chevron-down' 
                      size={18} 
                      color={index === exercises.length - 1 ? 'rgba(255, 255, 255, 0.3)' : '#fff'} 
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeExercise(index)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="remove-circle" size={28} color='#FF4444' />
                </TouchableOpacity>
              </View>
            </View>
              </React.Fragment>
            );
          })}
          
          {/* Add Custom Exercise Button */}
          <TouchableOpacity 
            style={styles.addExerciseButton}
            onPress={() => setShowAddExerciseModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.addExerciseIconContainer}>
              <Ionicons name="add" size={24} color="#FFD700" />
            </View>
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Add Custom Exercise Modal */}
      <AddCustomExerciseModal
        visible={showAddExerciseModal}
        onClose={() => setShowAddExerciseModal(false)}
        onAdd={handleAddCustomExercise}
      />

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity 
          style={styles.addToCartButton}
          onPress={handleAddAllToCart}
          disabled={exercises.length === 0}
        >
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.startButton,
            exercises.length === 0 && styles.startButtonDisabled,
          ]}
          disabled={exercises.length === 0}
          onPress={handleStartWorkout}
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.startButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.startButtonText}>Start Workout</Text>
            <Ionicons name="arrow-forward" size={20} color='#0c0c0c' />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFD700',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  heroContainer: {
    height: 240,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerBackButton: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerSaveButton: {
    position: 'absolute',
    right: 16,
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    flexDirection: 'row',
    paddingHorizontal: 10,
    gap: 4,
  },
  headerSaveButtonSaved: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
  },
  savingText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  savedText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '700',
  },
  heroContent: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  moodLabel: {
    fontSize: 13,
    color: '#FFD700',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  workoutTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  durationText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  exerciseList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    marginTop: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  exerciseImage: {
    width: 80,
    height: 80,
  },
  subPathDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
    marginTop: 16,
    marginBottom: 4,
  },
  subPathDividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  subPathDividerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 1.4,
  },
  exerciseInfo: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  exerciseEquipment: {
    fontSize: 11,
    color: '#FFD700',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  exerciseDuration: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  exerciseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
    gap: 4,
  },
  reorderButtons: {
    flexDirection: 'column',
    gap: 2,
  },
  reorderButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reorderButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  removeButton: {
    padding: 4,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    gap: 12,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 14,
    borderRadius: 30,
    gap: 6,
  },
  addToCartText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  exerciseCount: {
    flex: 1,
  },
  exerciseCountText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  startButton: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c0c0c',
  },
  // Add Exercise Button Styles
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 8,
    paddingVertical: 12,
    gap: 8,
  },
  addExerciseIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addExerciseText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 215, 0, 0.8)',
  },
});
