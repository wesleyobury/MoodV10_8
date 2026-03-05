import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import HomeButton from '../components/HomeButton';
import BackButton from '../components/BackButton';
import AddCustomExerciseModal from '../components/AddCustomExerciseModal';
import { useCart, WorkoutItem } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Analytics } from '../utils/analytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { API_URL } from '../utils/apiConfig';

// Dynamic workout title pools by intensity category
const WORKOUT_TITLES = {
  foundation: [
    'Controlled Burn', 'Steady Pressure', 'Base Builder', 'Engine Warmup', 'Clean Effort',
    'Foundational Fire', 'Pulse Builder', 'Momentum', 'Rhythm & Repeat', 'Break a Sweat',
    'Light the Fuse', 'Aerobic Armor', 'Starter Surge', 'Move With Purpose', 'Core Temperature',
    'Built to Begin', 'Fresh Legs', 'Cardio Craft', 'Daily Driver', 'Solid State'
  ],
  performance: [
    'Afterburn', 'Blacktop Conditioning', 'Velocity Circuit', 'Grind Mode', 'Oxygen Debt',
    'Relentless Tempo', 'Redline Ready', 'Shock the System', 'Burn Protocol', 'High Output',
    'Power Pulse', 'Engine Room', 'Dark Cardio', 'Heat Index', 'Gas Tank Builder',
    'Iron Tempo', 'Accelerate', 'The Climb', 'Threshold Work', 'Push Past'
  ],
  intensity: [
    'Blackout Intervals', 'Engine Collapse', 'Zero Comfort', 'Blood & Breath', 'Conditioned to Break',
    'Redline Ritual', 'No Oxygen Left', 'Brutal Efficiency', 'System Override', 'Total Output',
    'Failure to Quit', 'Relentless Intervals', 'Dead Air', 'Heart Rate Hostile', 'Aftershock',
    'Chaos Conditioning', 'Burn the Clock', 'Max Effort Only', 'The Last Round', 'Full Send'
  ],
  athletic: [
    'Fight Shape', '12th Round', 'Roadwork Ritual', 'Championship Rounds', 'Overtime Engine',
    'Cut Weight Circuit', 'Ringside Ready', 'Combat Conditioning', 'Final Bell', 'Warrior Wind'
  ],
  hybrid: [
    'Iron & Intervals', 'Load & Go', 'Heavy Breath', 'Carry the Chaos', 'Strength Under Fire',
    'Weighted Velocity', 'Power Endurance', 'Force x Speed', 'Barbell Burn', 'Grind & Go'
  ],
  dark: [
    'Midnight Conditioning', 'Smoke & Sweat', 'Shadow Sprints', 'Neon Burn', 'Darkroom Intervals',
    'Ashes & Air', 'Night Shift', 'Silent Grind', 'The Long Night', 'Iron Pulse'
  ],
  elite: [
    'Surge', 'Override', 'Threshold', 'Impact', 'Ignite',
    'Unbroken', 'Endure', 'Elevate', 'Relentless', 'Ascend'
  ]
};

// Get a random workout title based on intensity level
function getRandomWorkoutTitle(intensity: string, moodTitle: string): string {
  let availablePools: string[][] = [];
  
  const intensityLower = (intensity || 'intermediate').toLowerCase();
  const moodLower = (moodTitle || '').toLowerCase();
  
  if (intensityLower === 'beginner') {
    availablePools = [WORKOUT_TITLES.foundation];
  } else if (intensityLower === 'intermediate') {
    availablePools = [WORKOUT_TITLES.performance, WORKOUT_TITLES.hybrid];
  } else if (intensityLower === 'advanced') {
    availablePools = [WORKOUT_TITLES.intensity, WORKOUT_TITLES.dark, WORKOUT_TITLES.elite];
  } else {
    availablePools = [WORKOUT_TITLES.performance];
  }
  
  if (moodLower.includes('muscle') || moodLower.includes('gain') || moodLower.includes('strength')) {
    availablePools.push(WORKOUT_TITLES.hybrid);
  }
  if (moodLower.includes('explosion') || moodLower.includes('explosive') || moodLower.includes('power')) {
    availablePools.push(WORKOUT_TITLES.athletic);
  }
  if (moodLower.includes('sweat') || moodLower.includes('burn') || moodLower.includes('cardio')) {
    if (intensityLower === 'advanced') {
      availablePools.push(WORKOUT_TITLES.elite);
    }
  }
  
  const allTitles = availablePools.flat();
  return allTitles[Math.floor(Math.random() * allTitles.length)];
}

const CartItemComponent: React.FC<{
  item: WorkoutItem;
  index: number;
  onRemove: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
}> = ({ item, index, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) => {
  // Default placeholder image for workouts without images
  const placeholderImage = 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=200&fit=crop';
  const imageSource = item.imageUrl && item.imageUrl.length > 0 ? item.imageUrl : placeholderImage;
  
  // Check if it's a custom workout
  const isCustomWorkout = item.workoutType === 'Custom' || item.id?.startsWith('custom-');
  
  return (
    <View style={styles.exerciseCard}>
      <Image 
        source={{ uri: imageSource }}
        style={styles.exerciseImage}
        resizeMode="cover"
      />
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseEquipment}>{item.equipment}</Text>
        <View style={styles.exerciseNameRow}>
          <Text style={styles.exerciseName} numberOfLines={1}>{item.name}</Text>
          {isCustomWorkout && (
            <View style={styles.customBadge}>
              <Text style={styles.customBadgeText}>Custom</Text>
            </View>
          )}
        </View>
        <Text style={styles.exerciseDuration}>{item.duration}</Text>
      </View>
      <View style={styles.exerciseActions}>
        <View style={styles.reorderButtons}>
          <TouchableOpacity
            style={[styles.reorderButton, isFirst && styles.reorderButtonDisabled]}
            onPress={() => !isFirst && onMoveUp(index)}
            disabled={isFirst}
            activeOpacity={0.8}
          >
            <Ionicons 
              name='chevron-up' 
              size={18} 
              color={isFirst ? 'rgba(255, 255, 255, 0.3)' : '#fff'} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reorderButton, isLast && styles.reorderButtonDisabled]}
            onPress={() => !isLast && onMoveDown(index)}
            disabled={isLast}
            activeOpacity={0.8}
          >
            <Ionicons 
              name='chevron-down' 
              size={18} 
              color={isLast ? 'rgba(255, 255, 255, 0.3)' : '#fff'} 
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemove(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="remove-circle" size={28} color='#FF4444' />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function CartScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { cartItems, removeFromCart, clearCart, reorderCart, addToCart, replaceCart } = useCart();
  const { token } = useAuth();
  const [isStarting, setIsStarting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  
  // Generated carts state for skip functionality
  const [generatedCarts, setGeneratedCarts] = useState<any[]>([]);
  const [currentCartIndex, setCurrentCartIndex] = useState(0);
  const [isGeneratedWorkout, setIsGeneratedWorkout] = useState(false);
  const [moodCard, setMoodCard] = useState('');
  const [dynamicTitle, setDynamicTitle] = useState('');

  // Parse generated carts from params on mount
  useEffect(() => {
    if (params.generatedCarts) {
      try {
        const carts = JSON.parse(params.generatedCarts as string);
        setGeneratedCarts(carts);
        setCurrentCartIndex(0);
        setIsGeneratedWorkout(true);
        if (params.moodCard) {
          setMoodCard(params.moodCard as string);
        }
        // Generate initial dynamic title based on first cart's intensity
        const firstCart = carts[0];
        const intensity = firstCart?.intensity || 'intermediate';
        setDynamicTitle(getRandomWorkoutTitle(intensity, params.moodCard as string || ''));
      } catch (e) {
        console.error('Error parsing generated carts:', e);
      }
    }
  }, [params.generatedCarts]);

  // ────────────────────────────────────────────────────────
  // A2 — Hydrate cart from push notification params (cold start fix)
  // If the cart is empty AND the route was opened from a featured workout push,
  // populate the cart from: (1) inline pushCartItems param, or (2) fetch by featuredId.
  // This guarantees the cart renders correctly on cold start, background resume,
  // and when replaceCart state is lost during navigation.
  // ────────────────────────────────────────────────────────
  const [hydrating, setHydrating] = useState(false);

  useEffect(() => {
    if (cartItems.length > 0) return;  // already populated
    if (!params.featuredId && !params.pushCartItems) return;  // not from push

    let cancelled = false;

    const hydrate = async () => {
      setHydrating(true);

      // Path 1: use serialized cart items from the push payload
      if (params.pushCartItems) {
        try {
          const items = JSON.parse(params.pushCartItems as string);
          if (Array.isArray(items) && items.length > 0 && !cancelled) {
            console.log(`🛒 Cart hydrated from pushCartItems (${items.length} items)`);
            replaceCart(items);
            setHydrating(false);
            return;
          }
        } catch (e) {
          console.warn('🛒 Failed to parse pushCartItems:', e);
        }
      }

      // Path 2: fetch by featuredId from backend
      if (params.featuredId) {
        try {
          const resp = await fetch(`${API_URL}/api/featured/workouts/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([params.featuredId]),
          });
          if (resp.ok && !cancelled) {
            const result = await resp.json();
            const workout = result.workouts?.[0];
            if (workout?.exercises?.length) {
              const items: WorkoutItem[] = workout.exercises.map((ex: any) => ({
                id: ex.exerciseId || ex.id || ex.name || `hydrate-${Date.now()}`,
                name: ex.name || '',
                duration: ex.duration || '',
                description: ex.description || '',
                battlePlan: ex.battlePlan || '',
                imageUrl: ex.imageUrl || ex.image_url || '',
                intensityReason: ex.intensityReason || '',
                equipment: ex.equipment || 'None',
                difficulty: ex.difficulty || '',
                workoutType: ex.workoutType || '',
                moodCard: ex.moodCard || workout.title || (params.workoutTitle as string) || 'Featured Workout',
                moodTips: ex.moodTips || [],
                source: 'build_for_me' as const,
              }));
              console.log(`🛒 Cart hydrated from featuredId fetch (${items.length} exercises)`);
              replaceCart(items);
            }
          }
        } catch (e) {
          console.warn('🛒 Failed to fetch featured workout for cart hydration:', e);
        }
      }

      if (!cancelled) setHydrating(false);
    };

    hydrate();
    return () => { cancelled = true; };
  }, [params.featuredId, params.pushCartItems, cartItems.length]);

  // Handle skip to next generated cart
  const handleSkip = async () => {
    if (currentCartIndex < generatedCarts.length - 1) {
      // Record skip usage
      if (token) {
        try {
          await fetch(`${API_URL}/api/choose-for-me/generate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ carts: [], moodCard: moodCard, intensity: 'skip' }),
          });
        } catch (error) {
          console.error('Error recording skip:', error);
        }
      }
      
      // Load next cart
      const nextIndex = currentCartIndex + 1;
      const nextCart = generatedCarts[nextIndex];
      setCurrentCartIndex(nextIndex);
      
      // Generate new dynamic title for the new cart
      const intensity = nextCart?.intensity || 'intermediate';
      setDynamicTitle(getRandomWorkoutTitle(intensity, moodCard));
      
      // Update cart with next workout
      clearCart();
      nextCart.workouts.forEach((workout: WorkoutItem) => {
        addToCart(workout);
      });
    } else {
      Alert.alert('No More Workouts', 'You have seen all generated workouts.');
    }
  };

  // Check if skip is available
  const canSkip = isGeneratedWorkout && currentCartIndex < generatedCarts.length - 1;

  const handleGoBack = () => {
    router.back();
  };

  const handleRemoveItem = (workoutId: string) => {
    // Find the workout name before removing
    const workout = cartItems.find(item => item.id === workoutId);
    if (workout && token) {
      Analytics.workoutRemovedFromCart(token, {
        workout_name: workout.name,
      });
    }
    removeFromCart(workoutId);
  };

  const handleClearCart = () => {
    clearCart();
    router.push('/(tabs)');
  };

  const handleSaveWorkout = async () => {
    if (!token) {
      Alert.alert('Login Required', 'Please login to save workouts');
      return;
    }
    
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Add some exercises to save a workout');
      return;
    }
    
    // Set default workout name and show modal
    setWorkoutName('Custom');
    setSaveModalVisible(true);
  };

  const handleConfirmSave = async () => {
    if (!workoutName || workoutName.trim() === '') {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }
    
    setIsSaving(true);
    try {
      const totalDuration = cartItems.reduce((total, item) => {
        const mins = parseInt(item.duration.split(' ')[0]) || 0;
        return total + mins;
      }, 0);
      
      const response = await fetch(`${API_URL}/api/saved-workouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: workoutName.trim(),
          workouts: cartItems.map(item => ({
            name: item.name,
            equipment: item.equipment,
            duration: item.duration,
            difficulty: item.difficulty,
            description: item.description,
            battlePlan: item.battlePlan,
            imageUrl: item.imageUrl,
            intensityReason: item.intensityReason,
            workoutType: item.workoutType,
            moodCard: item.moodCard,
            moodTips: item.moodTips,
          })),
          total_duration: totalDuration,
          source: 'custom',
        }),
      });
      
      setSaveModalVisible(false);
      
      if (response.ok) {
        Alert.alert('Saved!', 'Workout saved to your profile');
      } else if (response.status === 400) {
        Alert.alert('Already Exists', 'A workout with this name already exists');
      } else {
        Alert.alert('Error', 'Failed to save workout');
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert('Error', 'Failed to save workout');
    } finally {
      setIsSaving(false);
    }
  };

  // Track cart view on mount
  React.useEffect(() => {
    if (token && cartItems.length > 0) {
      Analytics.cartViewed(token, {
        item_count: cartItems.length,
      });
    }
  }, [token]);

  const handleStartWorkoutSession = () => {
    if (cartItems.length === 0) return;
    
    setIsStarting(true);
    
    if (token) {
      const firstWorkout = cartItems[0];
      Analytics.workoutStarted(token, {
        mood_category: firstWorkout.moodCard || firstWorkout.workoutType,
        difficulty: firstWorkout.difficulty,
        equipment: firstWorkout.equipment,
      });
    }
    
    const firstWorkout = cartItems[0];
    router.push({
      pathname: '/workout-guidance',
      params: {
        workoutName: firstWorkout.name,
        equipment: firstWorkout.equipment,
        description: firstWorkout.description,
        battlePlan: firstWorkout.battlePlan,
        duration: firstWorkout.duration,
        difficulty: firstWorkout.difficulty,
        workoutType: firstWorkout.workoutType,
        moodCard: firstWorkout.moodCard,
        sessionWorkouts: JSON.stringify(cartItems.map(item => ({
          workoutName: item.name, // Use workoutName for consistency with SessionWorkout interface
          equipment: item.equipment,
          description: item.description,
          battlePlan: item.battlePlan,
          duration: item.duration,
          difficulty: item.difficulty,
          workoutType: item.workoutType,
          moodCard: item.moodCard,
          moodTips: item.moodTips || [], // Keep as array - will be stringified by JSON.stringify
          imageUrl: item.imageUrl || '',
          intensityReason: item.intensityReason || '',
        }))),
        currentSessionIndex: '0',
        isSession: 'true',
        moodTips: encodeURIComponent(JSON.stringify(firstWorkout.moodTips || []))
      }
    });
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderCart(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < cartItems.length - 1) {
      reorderCart(index, index + 1);
    }
  };

  const getTotalDuration = () => {
    return cartItems.reduce((total, item) => {
      const duration = parseInt(item.duration.split(' ')[0]) || 0;
      return total + duration;
    }, 0);
  };

  // Extract the main mood card name from workoutType
  const extractMoodCardName = (category: string): string => {
    if (!category || category.toLowerCase() === 'workout' || category.toLowerCase() === 'unknown' || category.toLowerCase() === 'custom') {
      return 'Custom';
    }
    
    // If it contains ' - ', extract the first part (mood card name)
    if (category.includes(' - ')) {
      const moodCardPart = category.split(' - ')[0].trim();
      return moodCardPart
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    // Known mood card titles
    const moodCardTitles: { [key: string]: string } = {
      'i want to sweat': 'Sweat / Burn Fat',
      'sweat / burn fat': 'Sweat / Burn Fat',
      "i'm feeling lazy": "I'm Feeling Lazy",
      'muscle gainer': 'Muscle Gainer',
      'outdoor': 'Outdoor',
      'lift weights': 'Lift Weights',
      'calisthenics': 'Calisthenics',
      'bodyweight': 'Calisthenics',
    };
    
    const lowerCategory = category.toLowerCase();
    for (const [key, value] of Object.entries(moodCardTitles)) {
      if (lowerCategory.includes(key)) return value;
    }
    
    return category
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Get the first workout's mood card for display
  const getMoodInfo = () => {
    if (cartItems.length === 0) return { mood: 'Workout', type: 'Cart' };
    const firstItem = cartItems[0];
    
    // Use moodCard if available, otherwise extract from workoutType
    let mood = firstItem.moodCard || 'Custom';
    
    // If moodCard looks like a sub-path or equipment, try extracting from workoutType
    if (mood.toLowerCase() === 'custom' || mood.toLowerCase() === 'workout') {
      mood = extractMoodCardName(firstItem.workoutType || '');
    } else {
      // Verify moodCard is a proper mood card name, not equipment
      mood = extractMoodCardName(mood) || extractMoodCardName(firstItem.workoutType || '') || 'Custom';
    }
    
    // Determine sub-path based on mood card type
    let subPath = 'Workout';
    const moodLower = mood.toLowerCase();
    const workoutType = firstItem.workoutType || '';
    const workoutTypeLower = workoutType.toLowerCase();
    
    // Calisthenics & Outdoor always show 'Workout'
    if (moodLower.includes('calisthenics') || moodLower.includes('outdoor') || moodLower.includes('get outside')) {
      subPath = 'Workout';
    }
    // Sweat / Burn Fat - show 'Cardio Based" or 'Light Weights'
    else if (moodLower.includes('sweat') || moodLower.includes('burn fat')) {
      if (workoutTypeLower.includes('cardio')) {
        subPath = 'Cardio Based';
      } else if (workoutTypeLower.includes('light weight')) {
        subPath = 'Light Weights';
      } else if (workoutType.includes(' - ')) {
        subPath = workoutType.split(' - ')[1] || 'Workout';
      }
    }
    // Muscle Gainer - show selected muscle group
    else if (moodLower.includes('muscle')) {
      if (workoutType.includes(' - ')) {
        subPath = workoutType.split(' - ')[1] || 'Workout';
      } else if (firstItem.equipment) {
        subPath = firstItem.equipment;
      }
    }
    // Build Explosion - show "Bodyweight" or 'Weight Based'
    else if (moodLower.includes('explosion') || moodLower.includes('explosive')) {
      if (workoutTypeLower.includes('bodyweight') || workoutTypeLower.includes('body weight')) {
        subPath = 'Bodyweight';
      } else if (workoutTypeLower.includes('weight')) {
        subPath = 'Weight Based';
      } else if (workoutType.includes(' - ')) {
        subPath = workoutType.split(' - ')[1] || 'Workout';
      }
    }
    // I'm Feeling Lazy - show 'Move Your Body" or 'Lift Weights'
    else if (moodLower.includes('lazy')) {
      if (workoutTypeLower.includes('move') || workoutTypeLower.includes('bodyweight')) {
        subPath = 'Move Your Body';
      } else if (workoutTypeLower.includes('lift') || workoutTypeLower.includes('weight')) {
        subPath = 'Lift Weights';
      } else if (workoutType.includes(' - ')) {
        subPath = workoutType.split(' - ')[1] || 'Workout';
      }
    }
    // Default: try to extract from workoutType
    else if (workoutType.includes(' - ')) {
      subPath = workoutType.split(' - ')[1] || 'Workout';
    } else if (firstItem.equipment) {
      subPath = firstItem.equipment;
    }
    
    return {
      mood: mood,
      type: subPath
    };
  };

  const moodInfo = getMoodInfo();

  // Empty state (but not if we're hydrating from a push notification)
  if (cartItems.length === 0 && !hydrating) {
    return (
      <View style={styles.container}>
        <View style={[styles.emptyHeader, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity 
            style={styles.headerBackButton}
            onPress={handleGoBack}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="fitness-outline" size={64} color="rgba(255, 255, 255, 0.3)" />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add workouts to your cart to create custom workout sessions
          </Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={handleGoBack}
            activeOpacity={0.8}
          >
            <Text style={styles.exploreButtonText}>Explore Workouts</Text>
            <Ionicons name="chevron-forward" size={16} color="#000000" />
          </TouchableOpacity>
        </View>
        <HomeButton />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hero Image Section */}
      <View style={styles.heroContainer}>
        <Image
          source={{ uri: cartItems[0]?.imageUrl }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroOverlay} />
        
        {/* Back Button */}
        <View style={[styles.backButtonWrapper, { top: insets.top + 10 }]}>
          <BackButton onPress={handleGoBack} />
        </View>

        {/* Clear Button */}
        <TouchableOpacity 
          style={[styles.headerClearButton, { top: insets.top + 10 }]}
          onPress={handleClearCart}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
        
        {/* Hero Content */}
        <View style={styles.heroContent}>
          <Text style={styles.moodLabel}>{moodInfo.mood}</Text>
          <Text style={styles.workoutTitle}>
            {isGeneratedWorkout && dynamicTitle ? dynamicTitle : moodInfo.type}
          </Text>
          <View style={styles.durationBadge}>
            <Ionicons name="time-outline" size={14} color="#FFD700" />
            <Text style={styles.durationText}>~{getTotalDuration()} min</Text>
          </View>
        </View>
      </View>

      {/* Exercise List */}
      <View style={styles.contentContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Exercises ({cartItems.length})</Text>
        </View>

        <ScrollView 
          style={styles.exerciseList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {cartItems.map((item, index) => (
            <CartItemComponent
              key={item.id}
              item={item}
              index={index}
              onRemove={handleRemoveItem}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              isFirst={index === 0}
              isLast={index === cartItems.length - 1}
            />
          ))}
          
          {/* Add Custom Exercise Button - appears below last exercise */}
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
      />

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* Workout indicator for generated workouts */}
        {isGeneratedWorkout && (
          <View style={styles.workoutIndicator}>
            <Text style={styles.workoutIndicatorText}>
              Workout {currentCartIndex + 1} of {generatedCarts.length}
            </Text>
          </View>
        )}
        <View style={styles.bottomActions}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSaveWorkout}
            disabled={isSaving}
          >
            <Ionicons name="bookmark-outline" size={20} color='#FFD700' />
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.startButton,
              isStarting && styles.startButtonDisabled,
            ]}
            disabled={isStarting}
            onPress={handleStartWorkoutSession}
          >
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.startButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.startButtonText}>
                {isStarting ? '...' : 'Start'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {canSkip && (
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
              <Ionicons name="chevron-forward" size={18} color='#FFD700' />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Save Workout Modal */}
      <Modal
        visible={saveModalVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setSaveModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.saveModalContent}>
            <Text style={styles.saveModalTitle}>Save Workout</Text>
            <Text style={styles.saveModalSubtitle}>
              Enter a name for this workout to save it to your profile
            </Text>
            
            <TextInput
              style={styles.saveModalInput}
              value={workoutName}
              onChangeText={setWorkoutName}
              placeholder="Workout name"
              placeholderTextColor="#666"
              autoFocus
            />
            
            <View style={styles.saveModalButtons}>
              <TouchableOpacity 
                style={styles.saveModalCancelButton}
                onPress={() => setSaveModalVisible(false)}
              >
                <Text style={styles.saveModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveModalSaveButton}
                onPress={handleConfirmSave}
                disabled={isSaving}
              >
                <Ionicons name="bookmark" size={18} color='#000' />
                <Text style={styles.saveModalSaveText}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  // Hero Section Styles
  heroContainer: {
    height: 240,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  backButtonWrapper: {
    position: 'absolute',
    left: 16,
    zIndex: 10,
  },
  headerClearButton: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Content Section Styles
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
  // Exercise Card Styles
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
    flex: 1,
  },
  exerciseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  customBadge: {
    backgroundColor: '#4a4a4a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  customBadgeText: {
    fontSize: 9,
    color: '#ffffff',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  // Bottom Bar Styles
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  saveButton: {
    flex: 0.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    gap: 6,
  },
  saveButtonText: {
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
    flex: 1.2,
    borderRadius: 30,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c0c0c',
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    gap: 4,
    minWidth: 80,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  workoutIndicator: {
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutIndicatorText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  // Empty State Styles
  emptyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  exploreButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exploreButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  // Save Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  saveModalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#333',
  },
  saveModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  saveModalSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  saveModalInput: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 20,
  },
  saveModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveModalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  saveModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  saveModalSaveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  saveModalSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
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
