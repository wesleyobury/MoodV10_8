import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeButton from '../components/HomeButton';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import Toast from '../components/Toast';

const { width, height } = Dimensions.get('window');

// Daily challenges data - users see one per day
const DAILY_CHALLENGES = [
  {
    id: 'four-corners-of-regret',
    name: 'Four Corners of Regret',
    duration: '60 min',
    description: 'Light weight. Long grind. No place to hide.',
    battlePlan: `4 Stations — 15 min each
Rotate in order. No preset rest.

Station 1
• Freestyle Boxing
Shadowbox or bag — constant movement

Station 2
• Sled Push
Light–moderate load; steady turns

Station 3
• Hang Clean to Press
Light weight; smooth, repeatable reps

Station 4
• Burpee Box Jumps
Step down; rhythm over height`,
    moodTips: [
      {
        icon: 'barbell',
        title: 'Keep loads light and cycleable',
        description: 'You should move continuously for 3–5 minutes without redlining',
      },
      {
        icon: 'flame',
        title: 'Work at a sustainable burn',
        description: '~70% effort beats sprint–crash–recover',
      },
    ],
    imageUrl: 'https://res.cloudinary.com/dmeolrzzm/image/upload/v1738012917/HIIT1_xnvxl5.png',
    equipment: 'Gym Equipment',
    difficulty: 'advanced',
    intensityReason: 'This is a grueling 60-minute endurance challenge that tests mental fortitude as much as physical capacity.',
  },
];

// Get today's challenge based on date
const getTodaysChallenge = () => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const challengeIndex = dayOfYear % DAILY_CHALLENGES.length;
  return DAILY_CHALLENGES[challengeIndex];
};

export default function RingerChallenge() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { addToCart, cartItems, isInCart } = useCart();
  const { token } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Animations
  const loadingOpacity = useRef(new Animated.Value(1)).current;
  const loadingScale = useRef(new Animated.Value(1)).current;
  const skullRotate = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(100)).current;
  const cardScale = useRef(new Animated.Value(0.8)).current;
  const [addButtonScaleAnim] = useState(new Animated.Value(1));
  
  const todaysChallenge = getTodaysChallenge();
  
  // Generate workout ID for cart checking
  const workoutId = `ringer-${todaysChallenge.id}`;
  const isWorkoutInCart = isInCart(workoutId);
  
  // Skull rotation animation during loading
  useEffect(() => {
    const rotateAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(skullRotate, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(skullRotate, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    rotateAnimation.start();
    
    // Loading duration - 3 seconds
    const loadingTimer = setTimeout(() => {
      // Fade out loading screen
      Animated.parallel([
        Animated.timing(loadingOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(loadingScale, {
          toValue: 0.8,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsLoading(false);
        rotateAnimation.stop();
        
        // Animate card into view
        Animated.parallel([
          Animated.timing(cardOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(cardTranslateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.spring(cardScale, {
            toValue: 1,
            friction: 6,
            tension: 50,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 3000);
    
    return () => {
      clearTimeout(loadingTimer);
      rotateAnimation.stop();
    };
  }, []);
  
  const skullRotateInterpolate = skullRotate.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-15deg', '15deg', '-15deg'],
  });
  
  const handleAddToCart = () => {
    if (isWorkoutInCart) {
      setToastMessage('Already in cart');
      setShowToast(true);
      return;
    }
    
    // Animate the button
    Animated.sequence([
      Animated.timing(addButtonScaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(addButtonScaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(addButtonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    addToCart({
      id: workoutId,
      workoutTitle: todaysChallenge.name,
      workoutName: todaysChallenge.name,
      name: todaysChallenge.name,
      equipment: todaysChallenge.equipment,
      duration: todaysChallenge.duration,
      difficulty: todaysChallenge.difficulty,
      moodCategory: 'ringer',
      description: todaysChallenge.description,
      battlePlan: todaysChallenge.battlePlan,
      moodTips: todaysChallenge.moodTips,
      imageUrl: todaysChallenge.imageUrl,
      intensityReason: todaysChallenge.intensityReason,
      workoutType: 'Ringer Challenge',
    });
    
    setToastMessage('Workout added');
    setShowToast(true);
  };
  
  const handleStartWorkout = () => {
    router.push({
      pathname: '/workout-guidance',
      params: {
        workoutName: todaysChallenge.name,
        equipment: todaysChallenge.equipment,
        description: todaysChallenge.description,
        battlePlan: todaysChallenge.battlePlan,
        duration: todaysChallenge.duration,
        difficulty: todaysChallenge.difficulty,
        workoutType: 'Ringer Challenge',
        imageUrl: todaysChallenge.imageUrl,
        intensityReason: todaysChallenge.intensityReason,
        moodCard: 'ringer',
        moodTips: encodeURIComponent(JSON.stringify(todaysChallenge.moodTips)),
      },
    });
  };
  
  // Loading Screen
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Animated.View 
          style={[
            styles.loadingContainer,
            {
              opacity: loadingOpacity,
              transform: [{ scale: loadingScale }],
            }
          ]}
        >
          {/* Back button */}
          <TouchableOpacity 
            style={styles.backButtonLoading}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={28} color="#FFD700" />
          </TouchableOpacity>
          
          {/* Skull with X */}
          <Animated.View 
            style={[
              styles.skullContainer,
              { transform: [{ rotate: skullRotateInterpolate }] }
            ]}
          >
            <View style={styles.xBackground}>
              <Ionicons name="close" size={120} color="rgba(255, 215, 0, 0.3)" />
            </View>
            <Ionicons name="skull" size={80} color="#FFD700" style={styles.skullIcon} />
          </Animated.View>
          
          {/* Loading Text */}
          <Text style={styles.loadingTitle}>Loading Challenge</Text>
          
          {/* Info message */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle" size={20} color="rgba(255, 215, 0, 0.7)" />
            <Text style={styles.infoText}>
              New challenge unlocks daily.{'\n'}One brutal workout per day.
            </Text>
          </View>
          
          {/* Pulsing dots */}
          <View style={styles.dotsContainer}>
            {[0, 1, 2].map((i) => (
              <Animated.View 
                key={i}
                style={[
                  styles.dot,
                  {
                    opacity: skullRotate.interpolate({
                      inputRange: [0, 0.33, 0.66, 1],
                      outputRange: i === 0 ? [1, 0.3, 0.3, 1] : i === 1 ? [0.3, 1, 0.3, 0.3] : [0.3, 0.3, 1, 0.3],
                    }),
                  }
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    );
  }
  
  // Challenge Card Screen - using WorkoutCard style
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={28} color="#FFD700" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="skull" size={24} color="#FFD700" />
          <Text style={styles.headerTitle}>Daily Challenge</Text>
        </View>
        <HomeButton />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Workout Card - Matching WorkoutCard component style */}
        <Animated.View 
          style={[
            styles.workoutCardContainer,
            {
              opacity: cardOpacity,
              transform: [
                { translateY: cardTranslateY },
                { scale: cardScale },
              ],
            }
          ]}
        >
          <View style={styles.workoutCard}>
            {/* Equipment Header - Matching WorkoutCard */}
            <View style={styles.equipmentHeader}>
              <View style={styles.equipmentIconContainer}>
                <Ionicons name="skull" size={24} color="#FFD700" />
              </View>
              <Text style={styles.equipmentName}>Daily Ringer</Text>
              <TouchableOpacity
                style={styles.previewButton}
                onPress={handleStartWorkout}
                activeOpacity={0.8}
              >
                <Ionicons name="eye" size={14} color="#FFD700" />
                <Text style={styles.previewButtonText}>Preview</Text>
              </TouchableOpacity>
            </View>

            {/* Workout Slide - Matching WorkoutCard */}
            <View style={styles.workoutSlide}>
              {/* Workout Image */}
              <View style={styles.workoutImageContainer}>
                <Image
                  source={{ uri: todaysChallenge.imageUrl }}
                  style={styles.workoutImage}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.8)']}
                  style={styles.imageGradient}
                />
              </View>

              {/* Workout Content */}
              <View style={styles.workoutContent}>
                {/* Workout Name */}
                <Text style={styles.workoutName}>{todaysChallenge.name}</Text>

                {/* Duration and Intensity on same line */}
                <View style={styles.durationIntensityRow}>
                  <Text style={styles.workoutDuration}>{todaysChallenge.duration}</Text>
                  <View style={[styles.difficultyBadge, { backgroundColor: '#FFD700' }]}>
                    <Text style={styles.difficultyBadgeText}>
                      {todaysChallenge.difficulty.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Workout Description */}
                <View style={styles.workoutDescriptionContainer}>
                  <Text style={styles.workoutDescription}>{todaysChallenge.description}</Text>
                </View>

                {/* Add Workout Button */}
                <Animated.View style={{ transform: [{ scale: addButtonScaleAnim }] }}>
                  <TouchableOpacity
                    style={styles.addWorkoutButton}
                    onPress={handleAddToCart}
                    activeOpacity={0.8}
                    disabled={isWorkoutInCart}
                  >
                    <Ionicons
                      name={isWorkoutInCart ? 'checkmark' : 'add'}
                      size={18}
                      color="#FFD700"
                    />
                    <Text style={styles.addWorkoutButtonText}>
                      {isWorkoutInCart ? 'Added' : 'Add workout'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* Start Workout Button */}
                <TouchableOpacity
                  style={styles.startWorkoutButton}
                  onPress={handleStartWorkout}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#FF8C00', '#FF6B00']}
                    style={styles.startWorkoutGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="play" size={18} color="#fff" />
                    <Text style={styles.startWorkoutText}>Start Workout</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
        
        {/* Daily Reset Info */}
        <Animated.View 
          style={[
            styles.resetInfo,
            {
              opacity: cardOpacity,
            }
          ]}
        >
          <Ionicons name="refresh-circle" size={18} color="rgba(255, 215, 0, 0.5)" />
          <Text style={styles.resetText}>New challenge unlocks at midnight</Text>
        </Animated.View>
      </ScrollView>
      
      {/* Toast */}
      <Toast
        message={toastMessage}
        visible={showToast}
        onHide={() => setShowToast(false)}
        type="success"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  backButtonLoading: {
    position: 'absolute',
    top: 10,
    left: 16,
    zIndex: 10,
    padding: 8,
  },
  skullContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  xBackground: {
    position: 'absolute',
  },
  skullIcon: {
    position: 'absolute',
  },
  loadingTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 20,
    textAlign: 'center',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  workoutCardContainer: {
    marginTop: 8,
  },
  // WorkoutCard matching styles
  workoutCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.15)',
  },
  equipmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  equipmentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  equipmentName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  previewButtonText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '500',
  },
  workoutSlide: {
    width: '100%',
  },
  workoutImageContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  workoutImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  workoutContent: {
    padding: 16,
  },
  workoutName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  durationIntensityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  workoutDuration: {
    fontSize: 14,
    color: '#888',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  difficultyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
  workoutDescriptionContainer: {
    marginBottom: 16,
  },
  workoutDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  addWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginBottom: 10,
  },
  addWorkoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  startWorkoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  startWorkoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  resetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  resetText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
  },
});
