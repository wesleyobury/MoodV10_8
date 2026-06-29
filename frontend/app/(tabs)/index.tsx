import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  Linking,
  Platform,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useAuth } from '../../contexts/AuthContext';
import { useHealth } from '../../contexts/HealthContext';
import { Analytics } from '../../utils/analytics';
import { useScreenTime } from '../../hooks/useScreenTime';
import GuestPromptModal from '../../components/GuestPromptModal';
import { useFeaturedWorkouts, FeaturedWorkout } from '../../hooks/useFeaturedWorkouts';
import { optimizedImageUrl, FEATURED_CARD_IMAGE_WIDTH } from '../../utils/cloudinaryImage';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import HealthSyncIndicator from '../../components/HealthSyncIndicator';

// Prioritize process.env for development/preview environments
import { API_URL } from '../../utils/apiConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_PADDING = 16;
const CARD_GAP = 12;
const CARD_WIDTH = SCREEN_WIDTH - (CAROUSEL_PADDING * 2);

// Helper to format minutes - converts to hours when >= 1000
const formatMinutes = (minutes: number): { value: string; label: string } => {
  if (minutes >= 1000) {
    const hours = minutes / 60;
    // Show 1 decimal place for hours
    return { 
      value: hours.toFixed(1), 
      label: 'HOURS' 
    };
  }
  return { 
    value: minutes.toString(), 
    label: 'MINUTES' 
  };
};

// Animated Counter Stat Component
const AnimatedStat = ({ 
  value, 
  label, 
  isStreak = false,
  isMinutes = false,
  delay = 0,
  icon,
}: { 
  value: number; 
  label: string; 
  isStreak?: boolean;
  isMinutes?: boolean;
  delay?: number;
  icon?: keyof typeof Ionicons.glyphMap;
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset and animate when value changes
    animatedValue.setValue(0);
    
    // Count up animation - counts every integer
    Animated.timing(animatedValue, {
      toValue: value,
      duration: Math.min(800 + (value * 2), 1500), // Scale duration slightly with value, max 1.5s
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false, // Required for non-transform animations
    }).start();

    // Listen to animated value changes - update every frame
    const listenerId = animatedValue.addListener(({ value: v }) => {
      setDisplayValue(Math.floor(v));
    });

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [value]);

  // Format the display - handle minutes to hours conversion
  const getDisplayText = () => {
    if (isMinutes && value >= 1000) {
      // For hours display, interpolate the decimal
      const targetHours = value / 60;
      const currentHours = displayValue / 60;
      return currentHours.toFixed(1);
    }
    return displayValue.toString();
  };

  const getLabel = () => {
    if (isMinutes && value >= 1000) {
      return 'HOURS';
    }
    return label;
  };

  return (
    <View style={styles.statWrapper}>
      {/* Icon above the number — flat, no capsule per design */}
      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color={isStreak ? '#FFD700' : 'rgba(255,255,255,0.85)'}
          style={styles.statIcon}
        />
      )}
      {/* Text stack */}
      <View style={styles.statContent}>
        <Text style={[
          styles.statValue,
          isStreak && styles.statValueStreak
        ]}>
          {getDisplayText()}
        </Text>
        <Text style={[
          styles.statLabel,
          isStreak && styles.statLabelStreak
        ]}>
          {getLabel()}
        </Text>
      </View>
      {/* Thin line beneath - removed per design update */}
    </View>
  );
};

// Transform FeaturedWorkout to carousel format
interface CarouselWorkout {
  id: string;
  mood: string;
  title: string;
  duration: string;
  badge: string;
  exercises: string[];
  image: string;
}

const transformWorkoutForCarousel = (workout: FeaturedWorkout): CarouselWorkout => ({
  id: workout._id,
  mood: workout.mood,
  title: workout.title,
  duration: workout.duration || `${workout.durationMin || 30} min`,
  badge: workout.badge || 'Featured',
  exercises: workout.exercises.map(ex => ex.name ? `${ex.equipment} - ${ex.name}` : ex.exerciseId),
  image: optimizedImageUrl(
    workout.heroImageUrl || workout.exercises[0]?.imageUrl || '',
    FEATURED_CARD_IMAGE_WIDTH,
  ),
});

// Workout Carousel Card Component
const WorkoutCarouselCard = ({ 
  workout, 
  onPress,
  onSave,
  onUnsave,
  isSaved,
  isSaving,
  onSendPress,
}: { 
  workout: CarouselWorkout; 
  onPress: () => void;
  onSave: () => void;
  onUnsave: () => void;
  isSaved: boolean;
  isSaving: boolean;
  onSendPress?: () => void;
}) => {
  return (
    <TouchableOpacity 
      style={styles.carouselCard}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Image
        source={{ uri: workout.image }}
        style={styles.carouselImage}
        contentFit="cover"
        cachePolicy="disk"
        transition={200}
        placeholder={require('../../assets/images/icon.png')}
      />
      <View style={styles.carouselOverlay} />
      
      {/* Badge - top left */}
      <View style={styles.carouselBadge}>
        <Text style={styles.carouselBadgeText}>{workout.badge}</Text>
      </View>
      
      {/* Bookmark/Save button - top right */}
      <TouchableOpacity 
        style={styles.bookmarkButton}
        onPress={() => {
          if (!isSaving) {
            if (isSaved) {
              onUnsave();
            } else {
              onSave();
            }
          }
        }}
      >
        <Ionicons 
          name={isSaved ? "bookmark" : "bookmark-outline"} 
          size={20} 
          color={isSaved ? "#FFD700" : "#fff"} 
        />
      </TouchableOpacity>
      
      {/* Bottom info - mood + workout format */}
      <View style={styles.carouselInfo}>
        <Text style={styles.carouselTitle}>
          {workout.title && workout.mood &&
           workout.title.toLowerCase().trim().startsWith(workout.mood.toLowerCase().trim())
            ? workout.title
            : `${workout.mood} - ${workout.title}`}
        </Text>
        <Text style={styles.carouselDuration}>{workout.duration}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Animated Carousel Pagination Dots
const CarouselDots = ({ activeIndex, total }: { activeIndex: number; total: number }) => {
  const [animatedValues, setAnimatedValues] = useState<Animated.Value[]>([]);

  // Update animated values when total changes
  useEffect(() => {
    if (total > 0) {
      setAnimatedValues(Array.from({ length: total }, () => new Animated.Value(0)));
    }
  }, [total]);

  useEffect(() => {
    // Animate all dots
    animatedValues.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: index === activeIndex ? 1 : 0,
        useNativeDriver: false,
        tension: 50,
        friction: 7,
      }).start();
    });
  }, [activeIndex, animatedValues]);

  if (total === 0 || animatedValues.length === 0) {
    return null;
  }

  return (
    <View style={styles.dotsContainer}>
      {animatedValues.map((anim, index) => {
        const width = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 24],
        });
        const backgroundColor = anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['rgba(255, 255, 255, 0.3)', '#ffffff'],
        });
        
        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width,
                backgroundColor,
              },
            ]}
          />
        );
      })}
    </View>
  );
};


interface MoodCard {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: string[];
  accent: string; // warm gold tone used for the vivid glow
  base: string[]; // charcoal/gray/black base gradient (varied per card)
}

// Convert a hex color into an rgba() string with the supplied alpha.
const hexToRgba = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// "This week" trending indicator — shows count + softly bobbing upward arrow.
// Only rendered when count > 5 (per spec).
const WeeklyTrendIndicator = ({ count }: { count: number }) => {
  const bob = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(bob, {
            toValue: -4,
            duration: 800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(fade, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(bob, {
            toValue: 0,
            duration: 800,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(fade, {
            toValue: 0.55,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(400),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bob, fade]);

  return (
    <View style={styles.trendContainer}>
      <Animated.View
        style={{ transform: [{ translateY: bob }], opacity: fade }}
      >
        <Ionicons name="trending-up" size={18} color="#FFD700" />
      </Animated.View>
      <Text style={styles.trendCount}>{count}</Text>
      <Text style={styles.trendLabel}>this week</Text>
    </View>
  );
};

// Animated Mood Card Component - MOBILE OPTIMIZED
const AnimatedMoodCard = ({ mood, index, onPress, weeklyCount }: { 
  mood: MoodCard; 
  index: number; 
  onPress: (mood: MoodCard) => void;
  weeklyCount?: number;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Stagger the animation start based on index - matching welcome page timing
    const delay = index * 1500; // 1.5 seconds between each card's animation start
    
    const timer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1.2,
              duration: 450,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 450,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 450,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 2,
              duration: 450,
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(3500), // Wait 3.5 seconds before next animation
        ])
      ).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [index]);

  // Interpolate rotation for simple Z-axis rotation
  const rotateZ = rotateAnim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['0deg', '180deg', '360deg'],
  });

  // Show the "this week" trend badge once a mood has been picked at least
  // twice in the last 7 days (was >5, which almost never triggered).
  const showTrend = (weeklyCount ?? 0) >= 2;
  const accent = mood.accent;

  return (
    <TouchableOpacity
      style={styles.moodCardContainer}
      onPress={() => onPress(mood)}
      activeOpacity={0.85}
    >
      {/* Premium layered card — charcoal/black base with a warm vivid gold glow */}
      <LinearGradient
        colors={mood.base}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.5, 1]}
        style={styles.visibleMoodCard}
      >
        {/* Warm gold glow blooming from the right — vivid yet on-brand */}
        <LinearGradient
          colors={[hexToRgba(accent, 0), hexToRgba(accent, 0.16), hexToRgba(accent, 0.42)]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Diagonal gold bloom anchored bottom-right for dimensional depth */}
        <LinearGradient
          colors={[hexToRgba(accent, 0), hexToRgba(accent, 0.10), hexToRgba(accent, 0.34)]}
          start={{ x: 0.3, y: 0 }}
          end={{ x: 1, y: 1 }}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Warm halo behind the icon (left) so the glow reads across the whole card */}
        <LinearGradient
          colors={[hexToRgba(accent, 0.22), hexToRgba(accent, 0.04), hexToRgba(accent, 0)]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0.5, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Top sheen highlight — fine texture / glassy finish */}
        <LinearGradient
          colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          locations={[0, 0.35, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.cardContent}>
          <Animated.View
            style={[
              styles.iconContainer,
              {
                backgroundColor: hexToRgba(accent, 0.20),
                borderColor: hexToRgba(accent, 0.42),
                transform: [
                  { scale: scaleAnim },
                  { rotate: rotateZ }
                ]
              }
            ]}
          >
            <Ionicons 
              name={mood.icon} 
              size={28} 
              color="#FFD700" 
              style={styles.cardIcon}
            />
          </Animated.View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>{mood.title}</Text>
            <Text style={styles.cardSubtitle}>{mood.subtitle}</Text>
          </View>
          {showTrend ? (
            <WeeklyTrendIndicator count={weeklyCount!} />
          ) : (
            <View style={styles.arrowContainer}>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color="rgba(255, 255, 255, 0.45)" 
              />
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Wearables stats row — "Latest Snapshot" pulled from HealthKit + last workout calories.
const WearablesSnapshot = ({
  restingHr,
  sleepMinutes,
  steps,
  calories,
}: {
  restingHr: number | null;
  sleepMinutes: number | null;
  steps: number | null;
  calories: number | null;
}) => {
  const fmtSleep = (m: number | null) => {
    if (m == null || m <= 0) return '—';
    const h = Math.floor(m / 60);
    const min = Math.round(m % 60);
    return `${h}h ${min}m`;
  };
  const fmtNum = (n: number | null, fallback = '—') => {
    if (n == null) return fallback;
    return n.toLocaleString();
  };

  // Synced when at least one metric has a real value; otherwise prompt to sync.
  const isSynced =
    restingHr != null || sleepMinutes != null || steps != null || calories != null;

  return (
    <View style={styles.wearablesSection}>
      <Text style={styles.wearablesHeader}>
        WEARABLES{!isSynced ? '  —  SYNC TO VIEW' : ''}
      </Text>
      <View style={styles.wearablesRow}>
        <View style={styles.wearableTile}>
          <View style={styles.wearableValueRow}>
            <Ionicons name="flame-outline" size={15} color="#FFD700" style={styles.wearableIcon} />
            <Text style={styles.wearableValue}>{fmtNum(calories)}</Text>
          </View>
          <Text style={styles.wearableLabel}>CALORIES</Text>
          <Text style={styles.wearableSubLabel}>Last workout</Text>
        </View>
        <View style={styles.wearableTile}>
          <View style={styles.wearableValueRow}>
            <Ionicons name="footsteps-outline" size={15} color="#FFD700" style={styles.wearableIcon} />
            <Text style={styles.wearableValue}>{fmtNum(steps)}</Text>
          </View>
          <Text style={styles.wearableLabel}>STEPS</Text>
          <Text style={styles.wearableSubLabel}>Yesterday</Text>
        </View>
        <View style={styles.wearableTile}>
          <View style={styles.wearableValueRow}>
            <Ionicons name="heart-outline" size={15} color="#FFD700" style={styles.wearableIcon} />
            <Text style={styles.wearableValue}>{fmtNum(restingHr)}</Text>
          </View>
          <Text style={styles.wearableLabel}>RESTING HR</Text>
          <Text style={styles.wearableSubLabel}>BPM</Text>
        </View>
        <View style={styles.wearableTile}>
          <View style={styles.wearableValueRow}>
            <Ionicons name="moon-outline" size={15} color="#8AB4FF" style={styles.wearableIcon} />
            <Text style={styles.wearableValue}>{fmtSleep(sleepMinutes)}</Text>
          </View>
          <Text style={styles.wearableLabel}>SLEEP</Text>
          <Text style={styles.wearableSubLabel}>Last night</Text>
        </View>
      </View>
    </View>
  );
};

const moodCards: MoodCard[] = [
  {
    id: 'sweat',
    title: 'Sweat / burn fat',
    subtitle: 'High intensity cardio',
    icon: 'flame',
    gradient: ['#FF6B6B', '#FF8E53'],
    accent: '#FFC93C',
    base: ['#2E2A20', '#1A1711', '#0C0A06'],
  },
  {
    id: 'muscle',
    title: 'Muscle gainer',
    subtitle: 'Strength training focus',
    icon: 'barbell',
    gradient: ['#4ECDC4', '#44A08D'],
    accent: '#E6B94C',
    base: ['#2B2B2B', '#181818', '#0A0A0A'],
  },
  {
    id: 'explosive',
    title: 'Build explosion',
    subtitle: 'Power & plyometric moves',
    icon: 'flash',
    gradient: ['#FFD93D', '#FF6B6B'],
    accent: '#FFB300',
    base: ['#302B1C', '#1B1810', '#0D0B06'],
  },
  {
    id: 'lazy',
    title: "I'm feeling lazy",
    subtitle: 'Gentle movement',
    icon: 'bed',
    gradient: ['#D299C2', '#FEF9D7'],
    accent: '#D9BA6B',
    base: ['#2A2A28', '#171614', '#0A0A09'],
  },
  {
    id: 'calisthenics',
    title: 'I want to do calisthenics',
    subtitle: 'Bodyweight exercises',
    icon: 'body',
    gradient: ['#667eea', '#764ba2'],
    accent: '#EBC76A',
    base: ['#2C2C2C', '#191919', '#0B0B0B'],
  },
  {
    id: 'outdoor',
    title: 'I want to get outside',
    subtitle: 'Fresh air workouts',
    icon: 'bicycle',
    gradient: ['#56ab2f', '#a8e6cf'],
    accent: '#C9A44C',
    base: ['#2A2B27', '#171813', '#0A0B08'],
  },
  // Hidden for now - will be enabled later
  // {
  //   id: 'ringer',
  //   title: 'Take me through the ringer',
  //   subtitle: 'Brutal fitness challenges',
  //   icon: 'skull',
  //   gradient: ['#1a1a1a', '#4a4a4a'],
  // },
];

export default function WorkoutsHome() {
  // Track screen time
  useScreenTime('Home');
  
  // Fetch remote-driven featured workouts
  const { workouts: remoteFeaturedWorkouts, loading: featuredLoading, refresh: refreshFeatured } = useFeaturedWorkouts();
  
  // Randomize workouts once per session - use ref to ensure shuffle only happens once
  const [shuffledWorkouts, setShuffledWorkouts] = useState<CarouselWorkout[]>([]);
  const hasShuffled = useRef(false);
  
  // Fisher-Yates shuffle for randomization
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  // Shuffle workouts ONLY ONCE when remote data first loads
  useEffect(() => {
    if (remoteFeaturedWorkouts.length > 0 && !hasShuffled.current) {
      hasShuffled.current = true;
      const transformed = remoteFeaturedWorkouts.map(transformWorkoutForCarousel);
      const shuffled = shuffleArray(transformed);
      setShuffledWorkouts(shuffled);
    }
  }, [remoteFeaturedWorkouts]);

  // Pulse icon heartbeat animation — soft scale loop, ~2.5s cadence
  const pulseScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.18, duration: 380, useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.delay(1700),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseScale]);
  
  // Use shuffled workouts for the carousel
  const featuredWorkouts = shuffledWorkouts;
  
  const [greeting, setGreeting] = useState('');
  const [userStats, setUserStats] = useState({ workouts: 0, minutes: 0, streak: 0 });
  const [weeklyMoodCounts, setWeeklyMoodCounts] = useState<Record<string, number>>({});
  const [lastWorkoutCalories, setLastWorkoutCalories] = useState<number | null>(null);
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const [savedWorkoutIds, setSavedWorkoutIds] = useState<Set<string>>(new Set());
  const [savingWorkoutIds, setSavingWorkoutIds] = useState<Set<string>>(new Set());
  const carouselRef = useRef<FlatList>(null);
  const autoScrollTimer = useRef<NodeJS.Timeout | null>(null);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token, isGuest } = useAuth();
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [guestAction, setGuestAction] = useState('');

  // Home scroll target — used by the tappable "Choose your MOOD" header
  const homeScrollRef = useRef<ScrollView>(null);
  const moodSectionYRef = useRef<number>(0);

  // Pulse animation for the "Choose your MOOD" header (subtle scale loop)
  const moodHeaderPulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(moodHeaderPulse, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(moodHeaderPulse, {
          toValue: 0,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [moodHeaderPulse]);
  const moodHeaderScale = moodHeaderPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.04],
  });

  const scrollToMoodSection = useCallback(() => {
    homeScrollRef.current?.scrollTo({
      y: Math.max(0, moodSectionYRef.current - 34),
      animated: true,
    });
  }, []);
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Check which featured workouts are already saved
  // This refreshes every time the screen comes into focus
  const checkSavedWorkouts = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/api/saved-workouts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const savedWorkouts = await response.json();
        const savedNames = new Set(savedWorkouts.map((w: any) => w.name));
        const savedIds = new Set<string>();
        
        // Match saved workout names to featured workout IDs
        featuredWorkouts.forEach(fw => {
          const name = `${fw.mood} - ${fw.title}`;
          if (savedNames.has(name)) {
            savedIds.add(fw.id);
          }
        });
        
        setSavedWorkoutIds(savedIds);
      }
    } catch (error) {
      console.log('Error checking saved workouts:', error);
    }
  }, [token, featuredWorkouts]);

  // Refresh saved workouts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      checkSavedWorkouts();
      // Also refresh featured workouts on focus
      refreshFeatured();
    }, [checkSavedWorkouts, refreshFeatured])
  );

  // Save a featured workout
  const handleSaveFeaturedWorkout = async (workout: typeof featuredWorkouts[0]) => {
    // Block guests from saving workouts
    if (isGuest) {
      setGuestAction('save workouts');
      setShowGuestPrompt(true);
      return;
    }
    
    if (!token) {
      Alert.alert('Login Required', 'Please login to save workouts');
      return;
    }
    
    // Add to saving state
    setSavingWorkoutIds(prev => new Set(prev).add(workout.id));
    
    try {
      // We need to get the full workout data from the detail data
      // For now, we'll save with basic info and the exercises list
      const response = await fetch(`${API_URL}/api/saved-workouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${workout.mood} - ${workout.title}`,
          workouts: workout.exercises.map(name => ({
            name: name,
            equipment: 'Various',
            duration: '5-10 min',
            difficulty: 'Intermediate',
          })),
          total_duration: parseInt(workout.duration.split('–')[0]) || 30,
          source: 'featured',
          featured_workout_id: workout.id,
          mood: workout.mood,
          title: workout.title,
        }),
      });
      
      if (response.ok || response.status === 400) {
        // Add to saved state
        setSavedWorkoutIds(prev => new Set(prev).add(workout.id));
      } else {
        Alert.alert('Error', 'Failed to save workout');
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout');
    } finally {
      // Remove from saving state
      setSavingWorkoutIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(workout.id);
        return newSet;
      });
    }
  };

  // Unsave a featured workout
  const handleUnsaveFeaturedWorkout = async (workout: typeof featuredWorkouts[0]) => {
    if (!token) return;
    
    console.log('handleUnsaveFeaturedWorkout called for:', workout.title);
    
    // Add to saving state
    setSavingWorkoutIds(prev => new Set(prev).add(workout.id));
    
    try {
      const workoutName = `${workout.mood} - ${workout.title}`;
      console.log('Looking for workout to delete:', workoutName);
      
      // First, get all saved workouts to find the one to delete
      const listResponse = await fetch(`${API_URL}/api/saved-workouts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (listResponse.ok) {
        const savedWorkouts = await listResponse.json();
        console.log('Saved workouts:', savedWorkouts.map((w: any) => w.name));
        const workoutToDelete = savedWorkouts.find((w: any) => w.name === workoutName);
        
        if (workoutToDelete) {
          console.log('Found workout to delete:', workoutToDelete._id);
          // Delete the saved workout
          const deleteResponse = await fetch(`${API_URL}/api/saved-workouts/${workoutToDelete._id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          
          console.log('Delete response status:', deleteResponse.status);
          
          if (deleteResponse.ok) {
            // Remove from saved state
            setSavedWorkoutIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(workout.id);
              console.log('Removed workout from saved state:', workout.id);
              return newSet;
            });
          }
        } else {
          console.log('Workout not found in saved list');
        }
      }
    } catch (error) {
      console.error('Error unsaving workout:', error);
    } finally {
      // Remove from saving state
      setSavingWorkoutIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(workout.id);
        return newSet;
      });
    }
  };

  // Auto-scroll carousel every 4 seconds (slower)
  // Timer resets when user manually swipes
  const startAutoScroll = useCallback(() => {
    // Clear existing timer first
    if (autoScrollTimer.current) {
      clearInterval(autoScrollTimer.current);
    }
    
    // Don't auto-scroll if no workouts
    if (featuredWorkouts.length === 0) return;
    
    autoScrollTimer.current = setInterval(() => {
      setActiveCarouselIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % featuredWorkouts.length;
        carouselRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
        return nextIndex;
      });
    }, 4000);
  }, [featuredWorkouts.length]);

  useEffect(() => {
    if (featuredWorkouts.length > 0) {
      startAutoScroll();
    }

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
      }
    };
  }, [startAutoScroll, featuredWorkouts.length]);

  // Handle carousel scroll end to update active index and reset timer
  const onCarouselScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / (CARD_WIDTH + CARD_GAP));
    if (index !== activeCarouselIndex && index >= 0 && index < featuredWorkouts.length) {
      setActiveCarouselIndex(index);
      // Reset the auto-scroll timer when user manually swipes
      startAutoScroll();
    }
  }, [activeCarouselIndex, startAutoScroll, featuredWorkouts.length]);

  // Render carousel item
  const renderCarouselItem = useCallback(({ item }: { item: CarouselWorkout }) => {
    return (
      <WorkoutCarouselCard 
        workout={item} 
        onPress={() => {
          // Track featured workout click
          if (token) {
            Analytics.featuredWorkoutClicked(token, {
              workout_id: item.id,
              workout_title: item.title,
              mood_category: item.mood,
            });
          }
          router.push({
            pathname: '/featured-workout-detail',
            params: { id: item.id },
          });
        }}
        onSave={() => handleSaveFeaturedWorkout(item)}
        onUnsave={() => handleUnsaveFeaturedWorkout(item)}
        isSaved={savedWorkoutIds.has(item.id)}
        isSaving={savingWorkoutIds.has(item.id)}
      />
    );
  }, [router, token, savedWorkoutIds, savingWorkoutIds]);

  // Fetch user workout stats on mount AND on focus
  const fetchUserStats = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${API_URL}/api/users/me/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserStats({
          workouts: data.workouts_completed || 0,
          minutes: data.total_minutes || 0,
          streak: data.current_streak || 0,
        });
      }
    } catch (error) {
      console.log('Error fetching user stats:', error);
    }
  }, [token]);

  // Fetch lightweight home summary (weekly mood selection counts + last workout calories)
  const fetchHomeSummary = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/users/me/home-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWeeklyMoodCounts(data.weekly_mood_counts || {});
        setLastWorkoutCalories(
          typeof data.last_workout_calories === 'number'
            ? data.last_workout_calories
            : null
        );
      } else {
        // Endpoint may not yet be deployed on the cutover backend; degrade silently
        // so UI still renders (trend indicator simply won't show until backend ships).
        console.log(
          `home-summary endpoint returned ${response.status} — falling back to defaults`
        );
      }
    } catch (error) {
      console.log('Error fetching home summary:', error);
    }
  }, [token]);
  
  // Fetch stats on initial mount
  useEffect(() => {
    fetchUserStats();
    fetchHomeSummary();
  }, [fetchUserStats, fetchHomeSummary]);
  
  // Refetch stats when screen comes into focus (to keep streak in sync)
  useFocusEffect(
    useCallback(() => {
      fetchUserStats();
      fetchHomeSummary();
    }, [fetchUserStats, fetchHomeSummary])
  );

  // HealthKit snapshot — silently returns nulls when permissions not granted
  // or on Android/Expo Go builds; the wearables section handles that gracefully.
  const { snapshot: healthSnapshot, refresh: refreshHealth } = useHealth();
  useFocusEffect(
    useCallback(() => {
      refreshHealth({ silent: true });
    }, [refreshHealth])
  );

  const handleMoodSelect = (mood: MoodCard) => {
    console.log('Selected mood:', mood.title);
    
    // Track mood selection
    if (token) {
      Analytics.moodSelected(token, { mood_category: mood.id });
    }
    
    if (mood.id === 'sweat') {
      // Navigate to workout type selection for "Sweat / burn fat"
      router.push({
        pathname: '/workout-type',
        params: { mood: mood.title }
      });
    } else if (mood.id === 'muscle') {
      // Navigate to body parts selection for "Muscle gainer"
      router.push({
        pathname: '/body-parts',
        params: { mood: mood.title }
      });
    } else if (mood.id === 'explosive') {
      // Navigate to explosiveness workout type selection
      router.push({
        pathname: '/explosiveness-type',
        params: { mood: mood.title }
      });
    } else if (mood.id === 'lazy') {
      // Navigate to lazy training type selection
      router.push({
        pathname: '/lazy-training-type',
        params: { mood: mood.title }
      });
    } else if (mood.id === 'calisthenics') {
      // Navigate to calisthenics equipment selection
      router.push({
        pathname: '/calisthenics-equipment',
        params: { mood: mood.title }
      });
    } else if (mood.id === 'outdoor') {
      // Navigate to outdoor equipment selection
      router.push({
        pathname: '/outdoor-equipment',
        params: { mood: mood.title }
      });
    } else if (mood.id === 'ringer') {
      // Navigate to daily challenge loading screen
      router.push({
        pathname: '/ringer-challenge',
        params: { mood: mood.title }
      });
    } else {
      // TODO: Navigate to workout selection based on other moods
      console.log('Navigation for other moods will be implemented later');
    }
  };

  const handleSocialLink = async (url: string, platform: string) => {
    try {
      // For web platform, use window.open to open in new tab
      if (Platform.OS === 'web') {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        // For mobile (iOS/Android), use Linking to open in native browser or app
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          Alert.alert('Error', `Could not open ${platform}. Please check if you have the app installed.`);
        }
      }
    } catch (error) {
      Alert.alert('Error', `Could not open ${platform}. Please try again.`);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        <ScrollView 
          ref={homeScrollRef}
          style={styles.fullScrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContentContainer, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 16) }]}
          bounces={true}
        >
        {/* Centered MOOD Branding */}
        <View style={styles.centeredBrandingHeader}>
          {/* Pulse icon flanked by hairlines (yellow EKG accent) */}
          <View style={styles.pulseRow}>
            <View style={styles.pulseFlankLine} />
            <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
              <Ionicons name="pulse" size={26} color="#FFD700" style={styles.pulseIcon} />
            </Animated.View>
            <View style={styles.pulseFlankLine} />
          </View>

          <Text style={styles.centeredBrandTitle}>MOOD</Text>
          <Text style={styles.centeredBrandSubtitle}>TRAIN HOW YOU FEEL DAILY</Text>

          {/* Quiet "Synced 2m ago" indicator — hidden if no HealthKit permission */}
          <HealthSyncIndicator />
        </View>

        {/* Progress Tracker - Animated Counting Stats */}
        <View style={styles.floatingStatsRow}>
          <AnimatedStat 
            value={userStats.workouts} 
            label="WORKOUTS" 
            icon="barbell-outline"
            delay={0}
          />
          <AnimatedStat 
            value={userStats.minutes} 
            label="MINUTES" 
            icon="time-outline"
            isMinutes={true}
            delay={150}
          />
          <AnimatedStat 
            value={userStats.streak} 
            label="STREAK" 
            icon="flame"
            isStreak={true}
            delay={300}
          />
        </View>

        {/* Wearables — Latest Snapshot (calories, steps, resting HR, sleep) */}
        <WearablesSnapshot
          restingHr={healthSnapshot?.restingHeartRate ?? null}
          sleepMinutes={healthSnapshot?.asleepDurationMinutes ?? null}
          steps={healthSnapshot?.stepCount ?? null}
          calories={lastWorkoutCalories}
        />

        {/* Featured Workouts Carousel - Condensed */}
        <View style={styles.carouselSection}>
          <Text style={styles.carouselTitle2}>Featured Workouts</Text>
          
          <FlatList
            ref={carouselRef}
            data={featuredWorkouts}
            renderItem={renderCarouselItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_WIDTH + CARD_GAP}
            decelerationRate="fast"
            contentContainerStyle={styles.carouselList}
            onScroll={onCarouselScroll}
            scrollEventThrottle={16}
            getItemLayout={(data, index) => ({
              length: CARD_WIDTH + CARD_GAP,
              offset: (CARD_WIDTH + CARD_GAP) * index,
              index,
            })}
          />
          
          <CarouselDots activeIndex={activeCarouselIndex} total={featuredWorkouts.length} />
        </View>

        {/* Mood Selection Section */}
        <View
          style={styles.moodCardsContainer}
          onLayout={(e) => {
            moodSectionYRef.current = e.nativeEvent.layout.y;
          }}
        >
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={scrollToMoodSection}
            testID="home-mood-header-cta"
          >
            <Animated.View
              style={[
                styles.sectionTitleContainer,
                { transform: [{ scale: moodHeaderScale }] },
              ]}
            >
              <View style={styles.leftAccent} />
              <Text style={styles.uniqueSectionTitle}>Choose your <Text style={styles.moodHighlight}>MOOD</Text></Text>
              <View style={styles.rightAccent} />
            </Animated.View>
          </TouchableOpacity>
          <View style={styles.moodColumn}>
            {moodCards.map((mood, index) => (
              <AnimatedMoodCard
                key={mood.id}
                mood={mood}
                index={index}
                onPress={handleMoodSelect}
                weeklyCount={weeklyMoodCounts[mood.id] ?? 0}
              />
            ))}
          </View>
        </View>

        {/* Social Icons */}
        <View style={styles.bottomSocialContainer}>
          <TouchableOpacity 
            style={styles.bottomSocialButton}
            onPress={() => handleSocialLink('https://www.instagram.com/officialmoodapp/', 'Instagram')}
          >
            <Ionicons name="logo-instagram" size={20} color="#FFD700" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.bottomSocialButton}
            onPress={() => handleSocialLink('https://www.tiktok.com/@officialmoodapp', 'TikTok')}
          >
            <Ionicons name="logo-tiktok" size={20} color="#FFD700" />
          </TouchableOpacity>
        </View>
      </ScrollView>
      </View>
      
      {/* Guest Prompt Modal */}
      <GuestPromptModal 
        visible={showGuestPrompt}
        onClose={() => setShowGuestPrompt(false)}
        action={guestAction}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#000000', // Pure black background - extends to edges
  },
  container: {
    flex: 1,
    backgroundColor: '#000000', // Pure black background
  },
  fullScrollView: {
    flex: 1,
    backgroundColor: '#000000', // Pure black background
  },
  scrollContentContainer: {
    paddingBottom: 16, // tightened — used to be 60
    backgroundColor: '#000000', // Pure black background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 15,
    paddingBottom: 25,
    marginBottom: 10,
  },
  centeredQuestionHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 15,
    paddingBottom: 25,
    marginBottom: 10,
  },
  visibleQuestionHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 30,
    marginVertical: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.05)', // Slight background to ensure visibility
  },
  headerContent: {
    flex: 1,
  },
  centeredHeaderContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
    textShadowColor: 'rgba(255, 215, 0, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  title: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: 4,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  centeredTitle: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  animatedCenteredTitle: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 215, 0, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    letterSpacing: 0.5,
    paddingHorizontal: 20,
  },
  visibleCenteredTitle: {
    fontSize: 26,
    color: '#FFD700', // Bright gold color for maximum visibility
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  ultraVisibleHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
    marginVertical: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)', // Gold background
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 15,
    marginHorizontal: 20,
  },
  ultraVisibleText: {
    fontSize: 22,
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 28,
  },
  questionSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginVertical: 20,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  questionText: {
    fontSize: 22,
    color: '#FFD700',
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 28,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  spacer: {
    height: 20,
  },
  parallaxContainer: {
    height: 280,
    marginVertical: 20,
    marginHorizontal: 0, // Edge-to-edge flow
    borderRadius: 0, // Straight edges top and bottom
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  parallaxImage: {
    width: '100%',
    height: '120%', // Slightly larger for parallax effect
    position: 'absolute',
    top: -20, // Offset for parallax movement
  },
  parallaxOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Dark overlay for text readability
    borderRadius: 0, // Straight edges to match container
  },

  // Carousel Styles - Condensed
  carouselSection: {
    marginVertical: 8,
    paddingTop: 4,
  },
  carouselTitle2: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    paddingHorizontal: 24,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  carouselList: {
    paddingHorizontal: CAROUSEL_PADDING,
  },
  carouselCard: {
    width: CARD_WIDTH,
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: CARD_GAP,
    backgroundColor: '#1a1a1a',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    zIndex: 1,
  },
  carouselOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    zIndex: 2,
  },
  carouselBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    zIndex: 10,
  },
  carouselBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.2,
  },
  bookmarkButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  bookmarkButtonSaved: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  savingText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  carouselInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingLeft: 20,
    paddingTop: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 10,
  },
  carouselTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  carouselDuration: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },

  centeredBrandingHeader: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 8,
    paddingBottom: 8, // tightened from 12 to make room for wearables row
  },
  // Pulse + flanking hairlines above MOOD wordmark
  pulseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  pulseFlankLine: {
    width: 36,
    height: 1,
    backgroundColor: '#FFD700',
    borderRadius: 1,
    marginHorizontal: 8,
    opacity: 0.85,
  },
  pulseIcon: {
    textShadowColor: 'rgba(255, 215, 0, 0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  // Yellow divider below "TRAIN HOW YOU FEEL"
  brandDivider: {
    width: 110,
    height: 1,
    backgroundColor: '#FFD700',
    borderRadius: 1,
    marginTop: 8,
    opacity: 0.85,
  },
  centeredBrandTitle: {
    fontSize: 42,
    fontWeight: '700',
    color: '#FFD700',
    letterSpacing: 8,
    textShadowColor: 'rgba(255, 215, 0, 0.15)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
    marginBottom: 2,
    textAlign: 'center',
  },
  centeredBrandSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 4,
    textAlign: 'center',
  },
  centeredSocialContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSocialContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 0,
  },
  bottomSocialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodCardsContainer: {
    marginTop: 32,
    paddingHorizontal: 28,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  leftAccent: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    marginRight: 12,
  },
  rightAccent: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    marginLeft: 12,
  },
  uniqueSectionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 3,
    textTransform: 'uppercase',
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  moodHighlight: {
    color: '#FFD700',
    fontWeight: '600',
  },
  moodColumn: {
    gap: 14,
  },
  animatedCardContainer: {
    marginBottom: 8,
  },
  moodCardContainer: {
    marginBottom: 0,
  },
  neonGlow: {
    borderRadius: 24,
    padding: 3,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  visibleMoodCard: {
    borderRadius: 16,
    padding: 0,
    minHeight: 80,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.10)',
    overflow: 'hidden',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  cardIcon: {
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#888',
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  quickStats: {
    marginTop: 48,
    marginHorizontal: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 215, 0, 0.08)',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  statsHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 10,
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
    letterSpacing: 1,
  },
  goldAccentLine: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 1,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  statValueStreak: {
    color: '#FFD700',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '500',
  },
  statLabelStreak: {
    color: 'rgba(255, 215, 0, 0.7)',
  },
  // Animated stat wrapper styles
  statWrapper: {
    width: 110,
    alignItems: 'center',
    paddingBottom: 8,
  },
  statIcon: {
    marginBottom: 6,
    opacity: 0.9,
  },
  statContent: {
    alignItems: 'center',
    marginBottom: 4,
  },
  // Thin line beneath stat
  statLine: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  statLineStreak: {
    backgroundColor: 'rgba(255, 215, 0, 0.7)',
  },
  // New top progress section styles
  // Floating Stats - NO pill, NO border, just text + spotlight glow
  floatingStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
    paddingHorizontal: 8,
    overflow: 'visible', // Critical: don't clip
  },
  floatingStatWrapper: {
    width: 110,
    alignItems: 'center',
    overflow: 'visible', // Critical: don't clip
    paddingBottom: 8,
  },
  // Outer bloom layer - larger, softer
  outerGlow: {
    position: 'absolute',
    bottom: -14,
    width: 120,
    height: 46,
    borderRadius: 999,
    transform: [{ scaleX: 1.2 }, { scaleY: 0.8 }],
  },
  // Inner spotlight glow
  innerGlow: {
    position: 'absolute',
    bottom: -10,
    width: 96,
    height: 34,
    borderRadius: 999,
    transform: [{ scaleX: 1.25 }, { scaleY: 0.85 }],
  },
  // Floating text stack - NO background, NO border
  floatingTextStack: {
    alignItems: 'center',
    paddingVertical: 8,
    // NO backgroundColor
    // NO borderRadius
    // NO border
  },
  floatingStatValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    // iOS text shadow for subtle separation
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  floatingStatValueStreak: {
    color: '#FFD700',
  },
  floatingStatLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 2.6,
    fontWeight: '500',
  },
  floatingStatLabelStreak: {
    color: 'rgba(255, 215, 0, 0.7)',
  },
  // === Wearables — Latest Snapshot (compact, single container) ===
  wearablesSection: {
    marginTop: 2,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  wearablesHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#AAAAAA',
    letterSpacing: 1.4,
    marginBottom: 6,
    marginLeft: 2,
  },
  wearablesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 215, 0, 0.08)',
  },
  wearableTile: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  wearableValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wearableIcon: {
    marginRight: 5,
  },
  wearableValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  wearableLabel: {
    fontSize: 8.5,
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
    textAlign: 'center',
  },
  wearableSubLabel: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.32)',
    marginTop: 1,
    textAlign: 'center',
  },
  // === "This week" trend indicator on mood cards ===
  trendContainer: {
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 6,
  },
  trendCount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.4,
  },
  trendLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 1,
    letterSpacing: 0.3,
  },
  // Premium gold edge accent on left side of mood card
  moodCardEdgeAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 64,
    opacity: 0.18,
  },
  // Exercise Search Section
});