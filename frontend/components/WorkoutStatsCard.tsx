import React, { useEffect, useRef, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import Svg, { Circle, G, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as ExpoLinearGradient } from './SafeLinearGradient';

// Safely import MaskedView - it can fail in production iOS builds
let MaskedView: any = null;
try {
  MaskedView = require('@react-native-masked-view/masked-view').default;
} catch (error) {
  console.warn('@react-native-masked-view not available:', error);
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.88;
const CARD_HEIGHT = CARD_WIDTH * 1.25;

// Ring configuration - ultra sleek
const RING_SIZE = 130;
const RING_CENTER = RING_SIZE / 2;

// Ring radii (from outer to inner)
const CALORIES_RING_RADIUS = 56;
const MINUTES_RING_RADIUS = 45;
const INTENSITY_RING_RADIUS = 34;
const RING_STROKE_WIDTH = 4; // Ultra thin sleek rings

// Default targets
const DEFAULT_CALORIE_TARGET = 500;
const DEFAULT_MINUTE_TARGET = 60;

// Three shades of gold - high contrast from dark to light
const COLORS = {
  // Calories - Dark Gold/Bronze (outer ring)
  caloriesStart: '#B8860B',    // Dark goldenrod
  caloriesEnd: '#8B6914',      // Even darker
  caloriesGlow: '#CD9B1D',     // Slight glow
  
  // Minutes - Medium Gold (middle ring)
  minutesStart: '#FFD700',     // Classic gold
  minutesEnd: '#DAA520',       // Goldenrod
  minutesGlow: '#FFE44D',      // Brighter glow
  
  // Intensity - Light Gold/Champagne (inner ring)
  intensityStart: '#FFE5A0',   // Light gold/champagne
  intensityEnd: '#FFD56B',     // Warm light gold
  intensityGlow: '#FFF3C4',    // Bright champagne glow
  
  trackBg: 'rgba(255, 255, 255, 0.06)',
  trackBgTransparent: 'rgba(255, 255, 255, 0.1)',
};

// Motivational phrases per mood category
const MOOD_PHRASES: { [key: string]: string[] } = {
  'sweat': ['Burn it down', 'Sweat it out', 'Torch calories', 'No comfort zone', 'Earn the sweat'],
  'burn': ['Burn it down', 'Sweat it out', 'Torch calories', 'No comfort zone', 'Earn the sweat'],
  'cardio': ['Burn it down', 'Sweat it out', 'Torch calories', 'No comfort zone', 'Earn the sweat'],
  'muscle': ['Build real muscle', 'Chase the pump', 'Lift with intent', 'Strength mode on', 'Gains over excuses'],
  'gainer': ['Build real muscle', 'Chase the pump', 'Lift with intent', 'Strength mode on', 'Gains over excuses'],
  'strength': ['Build real muscle', 'Chase the pump', 'Lift with intent', 'Strength mode on', 'Gains over excuses'],
  'explosion': ['Explode with power', 'Fast and forceful', 'Train explosive today', 'Power meets speed', 'Move violently fast'],
  'explosive': ['Explode with power', 'Fast and forceful', 'Train explosive today', 'Power meets speed', 'Move violently fast'],
  'power': ['Explode with power', 'Fast and forceful', 'Train explosive today', 'Power meets speed', 'Move violently fast'],
  'lazy': ['Just move today', 'Low effort wins', 'Ease into motion', 'Start where you are', 'Movement beats nothing'],
  'calisthenics': ['Control your body', 'Strength, no weights', 'Bodyweight mastery', 'Move with control', 'Own every rep'],
  'bodyweight': ['Control your body', 'Strength, no weights', 'Bodyweight mastery', 'Move with control', 'Own every rep'],
  'outdoor': ['Move in daylight', 'Fresh air reps', 'Outside hits different', 'Train beyond walls', 'Take it outside'],
  'outside': ['Move in daylight', 'Fresh air reps', 'Outside hits different', 'Train beyond walls', 'Take it outside'],
};

const FALLBACK_PHRASES = [
  'Keep moving forward',
  'One rep at a time',
  'Progress over perfection',
  'Show up for yourself',
  'Every rep counts',
];

// Intensity calculation based on workout type
const INTENSITY_PRESETS: { [key: string]: number } = {
  'lazy': 0.38,
  'recovery': 0.35,
  'stretch': 0.32,
  'mixed': 0.55,
  'moderate': 0.60,
  'muscle': 0.70,
  'gainer': 0.72,
  'strength': 0.75,
  'sweat': 0.78,
  'burn': 0.80,
  'cardio': 0.82,
  'hiit': 0.85,
  'explosion': 0.88,
  'explosive': 0.88,
  'power': 0.85,
  'intense': 0.90,
};

interface WorkoutStatsCardProps {
  workouts: {
    workoutTitle: string;
    workoutName: string;
    equipment: string;
    duration: string;
    difficulty: string;
    moodCategory?: string;
  }[];
  totalDuration: number;
  completedAt: string;
  moodCategory?: string;
  transparent?: boolean;
  editedDuration?: number;
  editedCalories?: number;
  calorieTarget?: number;
  minuteTarget?: number;
  showRingPulse?: boolean;
  showEquipment?: boolean;
  variant?: 'rings' | 'simple' | 'heartrate';
}

// Calculate intensity percentage based on workout characteristics
function calculateIntensity(workouts: any[], moodCategory: string, totalDuration: number): number {
  let baseIntensity = 0.55;
  const lowerCategory = moodCategory.toLowerCase();
  
  for (const [keyword, value] of Object.entries(INTENSITY_PRESETS)) {
    if (lowerCategory.includes(keyword)) {
      baseIntensity = value;
      break;
    }
  }
  
  const exerciseBonus = Math.min(workouts.length * 0.02, 0.10);
  const durationBonus = totalDuration > 45 ? 0.05 : totalDuration > 30 ? 0.03 : 0;
  
  const compoundKeywords = ['squat', 'deadlift', 'press', 'row', 'lunge', 'clean', 'snatch'];
  const hasCompounds = workouts.some(w => 
    compoundKeywords.some(k => 
      (w.workoutName || w.workoutTitle || '').toLowerCase().includes(k)
    )
  );
  const compoundBonus = hasCompounds ? 0.05 : 0;
  
  return Math.min(baseIntensity + exerciseBonus + durationBonus + compoundBonus, 0.95);
}

// Calculate ring stroke dasharray for counterclockwise from 12 o'clock
function getStrokeDasharray(progress: number, radius: number): { dashArray: string; dashOffset: number } {
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const progressLength = circumference * clampedProgress;
  
  return {
    dashArray: `${progressLength} ${circumference}`,
    dashOffset: 0,
  };
}

// Synthesize a plausible Apple-Watch-style heart-rate curve from intensity + duration.
// Warm-up rise, plateau with interval variation, cool-down.
// `seed` (0..1) drives a mulberry32 PRNG so each session looks unique but the
// same seed always reproduces the same curve (stable across re-renders).
function computeHeartRate(intensity: number, durationMin: number, seed: number = 0): {
  points: number[]; avg: number; peak: number;
} {
  // mulberry32 — tiny seeded PRNG
  let s = Math.floor((seed || 0.1234567) * 4294967296) | 0;
  const rnd = (): number => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const COUNT = 40;
  const base = 68 + Math.round(rnd() * 6); // resting 68–74
  const peakBpm = Math.round(base + Math.min(Math.max(intensity, 0.3), 0.95) * (95 + rnd() * 25));
  const wavePhase = rnd() * Math.PI * 2;
  const microPhase = rnd() * Math.PI * 2;
  const intervalPhase = rnd() * Math.PI * 2;
  const points: number[] = [];
  for (let i = 0; i < COUNT; i++) {
    const t = i / (COUNT - 1);
    let bpm: number;
    if (t < 0.12) {
      bpm = base + (peakBpm - base) * (t / 0.12) * (0.65 + rnd() * 0.2);
    } else if (t > 0.9) {
      bpm = base + 18 + (peakBpm - base) * ((1 - t) / 0.1) * 0.4;
    } else {
      const localWave = Math.sin(t * Math.PI * 6 + wavePhase) * (7 + rnd() * 4);
      const microWave = Math.sin(t * Math.PI * 16 + microPhase) * (3 + rnd() * 3);
      const intervalSpike = Math.sin(t * Math.PI * 3.2 + intervalPhase) * (5 + rnd() * 4);
      const jitter = (rnd() - 0.5) * 3;
      bpm = peakBpm * 0.86 + localWave + microWave + intervalSpike + jitter;
    }
    points.push(Math.max(60, Math.min(peakBpm + 4, Math.round(bpm))));
  }
  const peak = Math.max(...points);
  const avg = Math.round(points.reduce((a, b) => a + b, 0) / points.length);
  return { points, avg, peak };
}

// Build an SVG path string for the heart-rate area chart.
function buildHeartRatePath(points: number[], width: number, height: number, padding = 4): {
  line: string; area: string;
} {
  if (points.length === 0) return { line: '', area: '' };
  const min = Math.min(...points) - 5;
  const max = Math.max(...points) + 5;
  const range = Math.max(max - min, 1);
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const step = innerW / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = padding + i * step;
    const y = padding + innerH - ((p - min) / range) * innerH;
    return { x, y };
  });
  let line = `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const cur = coords[i];
    const cpx = (prev.x + cur.x) / 2;
    line += ` Q ${cpx.toFixed(1)} ${prev.y.toFixed(1)}, ${cur.x.toFixed(1)} ${cur.y.toFixed(1)}`;
  }
  const area =
    `${line} L ${coords[coords.length - 1].x.toFixed(1)} ${(padding + innerH).toFixed(1)} ` +
    `L ${coords[0].x.toFixed(1)} ${(padding + innerH).toFixed(1)} Z`;
  return { line, area };
}

export default function WorkoutStatsCard({ 
  workouts, 
  totalDuration, 
  completedAt,
  moodCategory = "Workout",
  transparent = false,
  editedDuration,
  editedCalories,
  calorieTarget = DEFAULT_CALORIE_TARGET,
  minuteTarget = DEFAULT_MINUTE_TARGET,
  showRingPulse = false,
  showEquipment = false,
  variant = 'rings',
}: WorkoutStatsCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current; // Shimmer position animation

  const displayDuration = editedDuration !== undefined ? editedDuration : totalDuration;
  const estimatedCalories = editedCalories !== undefined ? editedCalories : Math.round(totalDuration * 8);
  
  // Progress percentages - cap at 100% if goal met
  const calorieProgress = Math.min(estimatedCalories / calorieTarget, 1);
  const minuteProgress = Math.min(displayDuration / minuteTarget, 1);
  const intensityValue = calculateIntensity(workouts, moodCategory, displayDuration);

  const getDominantMoodCategory = (): string => {
    const categoryCounts: { [key: string]: number } = {};
    workouts.forEach(workout => {
      const category = workout.moodCategory || moodCategory || 'Workout';
      categoryCounts[category.toLowerCase()] = (categoryCounts[category.toLowerCase()] || 0) + 1;
    });
    
    let dominantCategory = moodCategory || 'Workout';
    let maxCount = 0;
    
    for (const [category, count] of Object.entries(categoryCounts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantCategory = category;
      }
    }
    return dominantCategory;
  };

  const getMoodPhrase = (category: string): string => {
    const lowerCategory = category.toLowerCase();
    for (const [keyword, phrases] of Object.entries(MOOD_PHRASES)) {
      if (lowerCategory.includes(keyword)) {
        return phrases[Math.floor(Math.random() * phrases.length)];
      }
    }
    return FALLBACK_PHRASES[Math.floor(Math.random() * FALLBACK_PHRASES.length)];
  };

  const extractMoodCardName = (category: string): string => {
    if (!category || category.toLowerCase() === 'workout' || category.toLowerCase() === 'unknown') {
      return "";
    }
    
    if (category.includes(' - ')) {
      return category.split(' - ')[0].trim();
    }
    
    const moodCardTitles: { [key: string]: string } = {
      "i want to sweat": "Sweat / Burn Fat",
      "sweat / burn fat": "Sweat / Burn Fat",
      "i'm feeling lazy": "I'm Feeling Lazy",
      "muscle gainer": "Muscle Gainer",
      "outdoor": "Get Outside",
      "outside": "Get Outside",
      "lift weights": "Lift Weights",
      "calisthenics": "Calisthenics",
      "bodyweight": "Calisthenics",
      "build explosion": "Build Explosion",
      "explosive": "Build Explosion",
    };
    
    const lowerCategory = category.toLowerCase();
    for (const [key, value] of Object.entries(moodCardTitles)) {
      if (lowerCategory.includes(key)) return value;
    }
    
    return category.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const dominantCategory = getDominantMoodCategory();
  const displayMoodCategory = extractMoodCardName(dominantCategory);
  const moodPhrase = useMemo(() => getMoodPhrase(dominantCategory), [dominantCategory]);
  const spacedMoodPhrase = useMemo(() => {
    return moodPhrase.toUpperCase().split(' ').map(word => word.split('').join(' ')).join('   ');
  }, [moodPhrase]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 2500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    // Shimmer animation for ring highlight effect - SLOW sweep
    if (showRingPulse) {
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 3500, // Slower - 3.5 seconds for full sweep
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        })
      ).start();
    }
  }, [showRingPulse]);

  // Render the three concentric rings with gradients and gloss
  const renderRings = (isTransparent: boolean = false) => {
    const calorieRing = getStrokeDasharray(calorieProgress, CALORIES_RING_RADIUS);
    const minuteRing = getStrokeDasharray(minuteProgress, MINUTES_RING_RADIUS);
    const intensityRing = getStrokeDasharray(intensityValue, INTENSITY_RING_RADIUS);
    const trackColor = isTransparent ? COLORS.trackBgTransparent : COLORS.trackBg;

    return (
      <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
        {/* Gradient definitions */}
        <Defs>
          {/* Calories gradient - Dark Gold/Bronze */}
          <LinearGradient id="caloriesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={COLORS.caloriesGlow} stopOpacity="1" />
            <Stop offset="30%" stopColor={COLORS.caloriesStart} stopOpacity="1" />
            <Stop offset="70%" stopColor={COLORS.caloriesEnd} stopOpacity="1" />
            <Stop offset="100%" stopColor={COLORS.caloriesGlow} stopOpacity="1" />
          </LinearGradient>
          
          {/* Minutes gradient - Medium Gold */}
          <LinearGradient id="minutesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={COLORS.minutesGlow} stopOpacity="1" />
            <Stop offset="40%" stopColor={COLORS.minutesStart} stopOpacity="1" />
            <Stop offset="80%" stopColor={COLORS.minutesEnd} stopOpacity="1" />
            <Stop offset="100%" stopColor={COLORS.minutesGlow} stopOpacity="1" />
          </LinearGradient>
          
          {/* Intensity gradient - Light Gold/Champagne */}
          <LinearGradient id="intensityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={COLORS.intensityGlow} stopOpacity="1" />
            <Stop offset="35%" stopColor={COLORS.intensityStart} stopOpacity="1" />
            <Stop offset="70%" stopColor={COLORS.intensityEnd} stopOpacity="1" />
            <Stop offset="100%" stopColor={COLORS.intensityGlow} stopOpacity="1" />
          </LinearGradient>
          
          {/* Gloss overlay gradients */}
          <LinearGradient id="glossCalories" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3" />
            <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.05" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
          </LinearGradient>
          
          <LinearGradient id="glossMinutes" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
          </LinearGradient>
          
          <LinearGradient id="glossIntensity" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.4" />
          </LinearGradient>
        </Defs>

        {/* Rotate entire group so 0 degrees is at 12 o'clock (top), flowing counterclockwise */}
        <G rotation="90" origin={`${RING_CENTER}, ${RING_CENTER}`}>
          {/* Background tracks */}
          <Circle
            cx={RING_CENTER}
            cy={RING_CENTER}
            r={CALORIES_RING_RADIUS}
            stroke={trackColor}
            strokeWidth={RING_STROKE_WIDTH}
            fill="none"
          />
          <Circle
            cx={RING_CENTER}
            cy={RING_CENTER}
            r={MINUTES_RING_RADIUS}
            stroke={trackColor}
            strokeWidth={RING_STROKE_WIDTH}
            fill="none"
          />
          <Circle
            cx={RING_CENTER}
            cy={RING_CENTER}
            r={INTENSITY_RING_RADIUS}
            stroke={trackColor}
            strokeWidth={RING_STROKE_WIDTH}
            fill="none"
          />
          
          {/* Progress rings with gradients - counterclockwise from 12 o'clock */}
          {/* Calories ring - outer - Dark Gold */}
          <Circle
            cx={RING_CENTER}
            cy={RING_CENTER}
            r={CALORIES_RING_RADIUS}
            stroke="url(#caloriesGradient)"
            strokeWidth={RING_STROKE_WIDTH}
            fill="none"
            strokeDasharray={calorieRing.dashArray}
            strokeDashoffset={calorieRing.dashOffset}
            strokeLinecap="round"
            transform={`scale(-1, 1) translate(-${RING_SIZE}, 0)`}
          />
          <Circle
            cx={RING_CENTER}
            cy={RING_CENTER}
            r={CALORIES_RING_RADIUS}
            stroke="url(#glossCalories)"
            strokeWidth={RING_STROKE_WIDTH * 0.5}
            fill="none"
            strokeDasharray={calorieRing.dashArray}
            strokeDashoffset={calorieRing.dashOffset}
            strokeLinecap="round"
            transform={`scale(-1, 1) translate(-${RING_SIZE}, 0)`}
          />
          
          {/* Minutes ring - middle - Medium Gold */}
          <Circle
            cx={RING_CENTER}
            cy={RING_CENTER}
            r={MINUTES_RING_RADIUS}
            stroke="url(#minutesGradient)"
            strokeWidth={RING_STROKE_WIDTH}
            fill="none"
            strokeDasharray={minuteRing.dashArray}
            strokeDashoffset={minuteRing.dashOffset}
            strokeLinecap="round"
            transform={`scale(-1, 1) translate(-${RING_SIZE}, 0)`}
          />
          <Circle
            cx={RING_CENTER}
            cy={RING_CENTER}
            r={MINUTES_RING_RADIUS}
            stroke="url(#glossMinutes)"
            strokeWidth={RING_STROKE_WIDTH * 0.4}
            fill="none"
            strokeDasharray={minuteRing.dashArray}
            strokeDashoffset={minuteRing.dashOffset}
            strokeLinecap="round"
            transform={`scale(-1, 1) translate(-${RING_SIZE}, 0)`}
          />
          
          {/* Intensity ring - inner - Light Gold/Champagne */}
          <Circle
            cx={RING_CENTER}
            cy={RING_CENTER}
            r={INTENSITY_RING_RADIUS}
            stroke="url(#intensityGradient)"
            strokeWidth={RING_STROKE_WIDTH}
            fill="none"
            strokeDasharray={intensityRing.dashArray}
            strokeDashoffset={intensityRing.dashOffset}
            strokeLinecap="round"
            transform={`scale(-1, 1) translate(-${RING_SIZE}, 0)`}
          />
          <Circle
            cx={RING_CENTER}
            cy={RING_CENTER}
            r={INTENSITY_RING_RADIUS}
            stroke="url(#glossIntensity)"
            strokeWidth={RING_STROKE_WIDTH * 0.4}
            fill="none"
            strokeDasharray={intensityRing.dashArray}
            strokeDashoffset={intensityRing.dashOffset}
            strokeLinecap="round"
            transform={`scale(-1, 1) translate(-${RING_SIZE}, 0)`}
          />
        </G>
      </Svg>
    );
  };

  // Per-mount random seed for heart-rate variant. Real tracking will replace this.
  const [hrSeed] = useState<number>(() => Math.random());

  // MOOD header that exactly matches the landing page (index.tsx).
  // Landing recipe: fontSize 48 / bold / letterSpacing 2 / center-mask /
  // LinearGradient #FFD700 → #FFA500 horizontal. MaskedView is loaded with a
  // safe-import fallback at module top — when unavailable, render flat gold.
  const renderMoodHeader = () => {
    const moodTextStyle = [
      styles.altMoodHeader,
      transparent && styles.altTextShadow,
    ];
    if (!MaskedView) {
      return <Text style={moodTextStyle}>MOOD</Text>;
    }
    return (
      <View style={styles.altMoodHeaderWrap}>
        <MaskedView
          maskElement={<Text style={moodTextStyle}>MOOD</Text>}
        >
          <ExpoLinearGradient
            colors={['#FFD700', '#FFA500']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.altMoodGradient}
          />
        </MaskedView>
      </View>
    );
  };

  // ============================================
  // ALT VARIANTS: SIMPLE + HEARTRATE
  // ============================================
  // Two-word split label for the bottom-right stat slot (e.g. "LEG / DAY").
  const splitLabel = useMemo(() => {
    const raw = (displayMoodCategory || 'WORKOUT').toUpperCase().trim();
    const words = raw.split(/[\s\/]+/).filter(Boolean);
    if (words.length === 0) return ['MOOD'];
    if (words.length === 1) return [words[0]];
    return [words[0], words[1]];
  }, [displayMoodCategory]);

  const heartRate = useMemo(
    () => computeHeartRate(intensityValue, displayDuration, hrSeed),
    [intensityValue, displayDuration, hrSeed]
  );

  // Shared frame: dark card when opaque, fully transparent when used as IG overlay.
  const wrapInFrame = (content: React.ReactNode) => {
    if (transparent) {
      return (
        <View style={[styles.transparentContainer, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
          {content}
        </View>
      );
    }
    return (
      <Animated.View style={[styles.container, { width: CARD_WIDTH, height: CARD_HEIGHT, opacity: fadeAnim }]}>
        <View style={styles.innerContainer}>
          <ExpoLinearGradient
            colors={['rgba(255, 215, 0, 0.05)', 'rgba(255, 215, 0, 0.01)', 'transparent']}
            style={styles.radialGradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
          />
          {content}
        </View>
      </Animated.View>
    );
  };

  // Exercise list shared by simple + heartrate variants.
  const renderExerciseList = () => (
    <View style={styles.altExercisesSection}>
      {workouts.slice(0, 5).map((workout, index) => {
        const name = workout.workoutTitle || workout.workoutName;
        const label = showEquipment && workout.equipment && workout.equipment !== 'None'
          ? `${name} \u2022 ${workout.equipment}`
          : name;
        const display = label.length > 36 ? label.slice(0, 33) + '...' : label;
        return (
          <View key={index} style={styles.altExerciseRow}>
            <View style={styles.altExerciseDot} />
            <Text style={[styles.altExerciseText, transparent && styles.altTextShadow]} numberOfLines={1}>
              {display}
            </Text>
          </View>
        );
      })}
      {workouts.length > 5 && (
        <Text style={[styles.altMoreExercises, transparent && styles.altTextShadow]}>
          +{workouts.length - 5} more
        </Text>
      )}
    </View>
  );

  // ---- Variant: SIMPLE — MOOD header + exercises + 4-stat bottom pill
  if (variant === 'simple') {
    return wrapInFrame(
      <View style={styles.altCardInner}>
        {renderMoodHeader()}
        {renderExerciseList()}
        <View style={styles.simpleStatsPill}>
          <View style={styles.simpleStatCell}>
            <Text style={[styles.simpleStatValue, styles.simpleStatValueGold]}>{estimatedCalories}</Text>
            <Text style={styles.simpleStatLabel}>CAL</Text>
          </View>
          <View style={styles.simpleStatDivider} />
          <View style={styles.simpleStatCell}>
            <Text style={styles.simpleStatValue}>{displayDuration}</Text>
            <Text style={styles.simpleStatLabel}>MIN</Text>
          </View>
          <View style={styles.simpleStatDivider} />
          <View style={styles.simpleStatCell}>
            <Text style={styles.simpleStatValue}>{Math.round(intensityValue * 100)}%</Text>
            <Text style={styles.simpleStatLabel}>INTENSITY</Text>
          </View>
          <View style={styles.simpleStatDivider} />
          <View style={styles.simpleStatCell}>
            {splitLabel.map((w, i) => (
              <Text key={i} style={[styles.simpleStatValueSplit, styles.simpleStatValueGold]}>{w}</Text>
            ))}
          </View>
        </View>
      </View>
    );
  }

  // ---- Variant: HEARTRATE — MOOD header + exercises + synthetic HR area chart
  if (variant === 'heartrate') {
    const chartW = CARD_WIDTH - 56;
    const chartH = 110;
    const { line, area } = buildHeartRatePath(heartRate.points, chartW, chartH);
    return wrapInFrame(
      <View style={styles.altCardInner}>
        {renderMoodHeader()}
        {renderExerciseList()}
        <View style={styles.hrSection}>
          <View style={styles.hrHeaderRow}>
            <View style={styles.hrHeaderLeft}>
              <Ionicons name="heart" size={11} color="#FFD700" />
              <Text style={[styles.hrLabel, transparent && styles.altTextShadow]}>HEART RATE</Text>
            </View>
            <Text style={[styles.hrStat, transparent && styles.altTextShadow]}>
              avg <Text style={styles.hrStatValue}>{heartRate.avg}</Text>  ·  peak <Text style={styles.hrStatValue}>{heartRate.peak}</Text>  bpm
            </Text>
          </View>
          <View style={styles.hrChartContainer}>
            <Svg width={chartW} height={chartH}>
              <Defs>
                <LinearGradient id="hrAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor="#FFD700" stopOpacity="0.55" />
                  <Stop offset="100%" stopColor="#FFD700" stopOpacity="0.02" />
                </LinearGradient>
              </Defs>
              <Path d={area} fill="url(#hrAreaGradient)" />
              <Path d={line} stroke="#FFD700" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </View>
        </View>
      </View>
    );
  }

  // ============================================
  // TRANSPARENT VERSION (Instagram Stories Export)
  // ============================================
  if (transparent) {
    return (
      <View style={[styles.transparentContainer, { width: CARD_WIDTH, height: CARD_HEIGHT }]}>
        {/* Header - compact */}
        <View style={styles.transparentHeader}>
          <Text style={styles.transparentMoodCategory} numberOfLines={1}>
            {displayMoodCategory ? displayMoodCategory.toUpperCase() : 'WORKOUT COMPLETE'}
          </Text>
          <Text style={styles.transparentSubtitle} numberOfLines={1}>{spacedMoodPhrase}</Text>
        </View>

        {/* Centered content area */}
        <View style={styles.transparentCenteredContent}>
          {/* Main content: Rings on left, Data on right */}
          <View style={styles.transparentMainContent}>
            {/* Left side: Rings with calorie count INSIDE */}
            <View style={styles.transparentRingSection}>
              <View style={styles.transparentRingContainer}>
                {renderRings(true)}
                {/* Calorie count centered inside rings */}
                <View style={styles.transparentRingCenterContent}>
                  <Text style={styles.transparentCenterCalorieValue}>{estimatedCalories}</Text>
                  <Text style={styles.transparentCenterCalorieLabel}>cal</Text>
                </View>
              </View>
            </View>
            
            {/* Right side: Data stacked - smaller text (without calories - now inside rings) */}
            <View style={styles.transparentDataSection}>
              <View style={styles.transparentDataRow}>
                <View style={[styles.transparentDataDot, { backgroundColor: COLORS.minutesStart }]} />
                <Text style={styles.transparentDataValue}>{displayDuration}</Text>
                <Text style={styles.transparentDataLabel}>min</Text>
              </View>
              <View style={styles.transparentDataRow}>
                <View style={[styles.transparentDataDot, { backgroundColor: COLORS.intensityStart }]} />
                <Text style={styles.transparentDataValue}>{Math.round(intensityValue * 100)}%</Text>
                <Text style={styles.transparentDataLabel}>intensity</Text>
              </View>
            </View>
          </View>

          {/* Exercises List - below rings */}
          <View style={styles.transparentExercisesSection}>
            {workouts.slice(0, 4).map((workout, index) => {
              const name = workout.workoutTitle || workout.workoutName;
              const label = showEquipment && workout.equipment && workout.equipment !== 'None'
                ? `${name} \u2022 ${workout.equipment}`
                : name;
              const display = label.length > 40 ? label.slice(0, 37) + '...' : label;
              return (
                <View key={index} style={styles.transparentExerciseRow}>
                  <View style={styles.transparentExerciseDot} />
                  <Text style={styles.transparentExerciseText} numberOfLines={1}>
                    {display}
                  </Text>
                </View>
              );
            })}
            {workouts.length > 4 && (
              <Text style={styles.transparentMoreExercises}>+{workouts.length - 4} more</Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.transparentFooter}>
          <Text style={styles.transparentBrandText}>MOOD</Text>
        </View>
      </View>
    );
  }

  // ============================================
  // STANDARD CARD VERSION
  // ============================================
  return (
    <Animated.View style={[styles.container, { width: CARD_WIDTH, height: CARD_HEIGHT, opacity: fadeAnim }]}>
      <View style={styles.innerContainer}>
        <ExpoLinearGradient
          colors={['rgba(255, 215, 0, 0.05)', 'rgba(255, 215, 0, 0.01)', 'transparent']}
          style={styles.radialGradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 0.5 }}
        />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.moodCategory} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {displayMoodCategory ? displayMoodCategory.toUpperCase() : 'WORKOUT COMPLETE'}
          </Text>
          <Text style={styles.subtitle}>{spacedMoodPhrase}</Text>
        </View>

        {/* Ring Section */}
        <View style={styles.ringSection}>
          <View style={styles.durationContainer}>
            <Text style={styles.durationValue}>{displayDuration}</Text>
            <Text style={styles.durationLabel}>min</Text>
          </View>
          
          <Animated.View style={[styles.ringContainer, { transform: [{ scale: pulseAnim }] }]}>
            {/* Use MaskedView to apply shimmer ONLY to the ring shapes */}
            {/* Falls back to simple rings if MaskedView not available */}
            {showRingPulse && MaskedView ? (
              <MaskedView
                style={styles.maskedRingContainer}
                maskElement={
                  <View style={styles.ringMask}>
                    {renderRings(false)}
                  </View>
                }
              >
                {/* Base rings layer */}
                {renderRings(false)}
                {/* Shimmer layer - only visible through the ring mask */}
                <Animated.View 
                  style={[
                    styles.ringShimmerLayer,
                    {
                      transform: [{
                        translateX: shimmerAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-RING_SIZE * 1.5, RING_SIZE * 1.5],
                        })
                      }]
                    }
                  ]}
                  pointerEvents="none"
                >
                  <ExpoLinearGradient
                    colors={[
                      'transparent',
                      'rgba(255, 255, 255, 0.2)',
                      'rgba(255, 255, 255, 0.6)',
                      'rgba(255, 255, 255, 0.2)',
                      'transparent',
                    ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.ringShimmerGradient}
                  />
                </Animated.View>
              </MaskedView>
            ) : (
              renderRings(false)
            )}
            <View style={styles.ringCenterContent}>
              <Text style={styles.centerCalorieValue}>{estimatedCalories}</Text>
              <Text style={styles.centerCalorieLabel}>cal</Text>
            </View>
          </Animated.View>
          
          <View style={styles.intensityContainer}>
            <Text style={styles.intensityValue}>{Math.round(intensityValue * 100)}%</Text>
            <Text style={styles.intensityLabel}>intensity</Text>
          </View>
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.caloriesStart }]} />
            <Text style={styles.legendText}>Cal</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.minutesStart }]} />
            <Text style={styles.legendText}>Min</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.intensityStart }]} />
            <Text style={styles.legendText}>Intensity</Text>
          </View>
        </View>

        {/* Exercises */}
        <View style={styles.exercisesSection}>
          {workouts.slice(0, 4).map((workout, index) => {
            const name = workout.workoutTitle || workout.workoutName;
            const label = showEquipment && workout.equipment && workout.equipment !== 'None'
              ? `${name} \u2022 ${workout.equipment}`
              : name;
            const display = label.length > 40 ? label.slice(0, 37) + '...' : label;
            return (
              <View key={index} style={styles.exerciseRow}>
                <View style={styles.exerciseDot} />
                <Text style={styles.exerciseText} numberOfLines={1}>
                  {display}
                </Text>
              </View>
            );
          })}
          {workouts.length > 4 && (
            <Text style={styles.moreExercises}>+{workouts.length - 4} more</Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.brandText}>MOOD</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // ============================================
  // STANDARD CARD STYLES
  // ============================================
  container: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  innerContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    overflow: 'hidden',
  },
  radialGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  header: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  moodCategory: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.5,
    marginTop: 6,
    fontWeight: '400',
  },
  
  ringSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  durationContainer: {
    alignItems: 'center',
    width: 50,
  },
  durationValue: {
    fontSize: 24,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  durationLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maskedRingContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
  },
  ringMask: {
    width: RING_SIZE,
    height: RING_SIZE,
    backgroundColor: 'transparent',
  },
  ringShimmerLayer: {
    position: 'absolute',
    width: 60,
    height: RING_SIZE,
    left: (RING_SIZE - 60) / 2,
  },
  ringShimmerGradient: {
    width: 60,
    height: '100%',
  },
  ringCenterContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCalorieValue: {
    fontSize: 24,
    fontWeight: '300',
    color: COLORS.caloriesStart,
    letterSpacing: -1,
  },
  centerCalorieLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  intensityContainer: {
    alignItems: 'center',
    width: 50,
  },
  intensityLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  intensityValue: {
    fontSize: 18,
    fontWeight: '400',
    color: COLORS.intensityStart,
  },
  
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  
  exercisesSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  exerciseDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.5)',
    marginRight: 10,
  },
  exerciseText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
  },
  moreExercises: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
  
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  brandText: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: '600',
    letterSpacing: 2,
  },

  // ============================================
  // TRANSPARENT/INSTAGRAM EXPORT STYLES
  // ============================================
  transparentContainer: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  transparentHeader: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  transparentMoodCategory: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  transparentSubtitle: {
    fontSize: 8,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginTop: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  // Centered content wrapper
  transparentCenteredContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  
  // Main content: rings left, data right
  transparentMainContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  transparentRingSection: {
    flex: 0,
  },
  transparentRingContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transparentDataSection: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  transparentDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  transparentDataDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  transparentDataValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    minWidth: 40,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  transparentDataLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    marginLeft: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  // Center content for rings (calorie inside)
  transparentRingCenterContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transparentCenterCalorieValue: {
    fontSize: 20,
    fontWeight: '500',
    color: COLORS.caloriesStart,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  transparentCenterCalorieLabel: {
    fontSize: 9,
    color: '#FFFFFF',
    marginTop: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  // Exercises below rings
  transparentExercisesSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  transparentExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  transparentExerciseDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFD700',
    marginRight: 8,
  },
  transparentExerciseText: {
    flex: 1,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '400',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  transparentMoreExercises: {
    fontSize: 9,
    color: '#FFFFFF',
    marginTop: 3,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  
  transparentFooter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  transparentBrandText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '700',
    letterSpacing: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  // ============================================
  // ALT VARIANTS — SIMPLE + HEARTRATE
  // Typography mirrors the rings variant + featured workout title:
  // - MOOD header uses the same fontWeight as workoutTitle (800), sized up + gold.
  // - Exercise rows match rings variant's exerciseText (12/400/white@60%).
  // - Gold accents come from the brand's #FFD700.
  // ============================================
  altCardInner: {
    flex: 1,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  altMoodHeader: {
    // EXACT match to landing page (index.tsx → styles.title)
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
    textAlign: 'left',
  },
  altMoodHeaderWrap: {
    height: 60,
    alignSelf: 'flex-start',
  },
  altMoodGradient: {
    width: 200,
    height: 60,
  },
  altTextShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  altExercisesSection: {
    flex: 1,
    marginTop: 12,
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
  },
  altExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  altExerciseDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.5)',
    marginRight: 10,
  },
  altExerciseText: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '400',
  },
  altMoreExercises: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },

  // SIMPLE — 4-stat bottom pill. Stat typography mirrors the rings variant's
  // durationValue/centerCalorieValue/intensityValue: thin (300/400), -1
  // letterSpacing, gold accent on CAL + SPLIT, white on MIN + INTENSITY.
  simpleStatsPill: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: 90,
    backgroundColor: 'rgba(10, 10, 10, 0.92)',
    borderRadius: 16,
    paddingVertical: 10,
    marginTop: 8,
  },
  simpleStatCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  simpleStatDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    marginVertical: 12,
  },
  simpleStatValue: {
    // matches rings variant durationValue: 24/300/-1/white
    fontSize: 24,
    fontWeight: '300',
    color: '#FFFFFF',
    letterSpacing: -1,
    lineHeight: 28,
  },
  simpleStatValueSplit: {
    // thin matches the rest of the pill; smaller because two lines stack
    fontSize: 15,
    fontWeight: '300',
    letterSpacing: 0,
    lineHeight: 18,
    textAlign: 'center',
  },
  simpleStatValueGold: {
    color: '#FFD700',
  },
  simpleStatLabel: {
    // matches rings variant centerCalorieLabel: 9/white@50%
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1.2,
    marginTop: 3,
    fontWeight: '400',
  },

  // HEARTRATE — gold theme to match brand
  hrSection: {
    marginTop: 6,
  },
  hrHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  hrHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  hrLabel: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: '600',
    letterSpacing: 2,
  },
  hrStat: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: 0.5,
  },
  hrStatValue: {
    color: '#FFD700',
    fontWeight: '700',
  },
  hrChartContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.04)',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
});
