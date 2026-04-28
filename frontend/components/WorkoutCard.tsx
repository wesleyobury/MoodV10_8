import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  FlatList,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Workout } from '../types/workout';
import CustomWorkoutModal from './CustomWorkoutModal';
import SendWorkoutModal from './SendWorkoutModal';
import { shuffleArray } from '../utils/shuffle';

const { width } = Dimensions.get('window');

export interface WorkoutCardProps {
  equipment: string;
  icon: keyof typeof Ionicons.glyphMap;
  workouts: Workout[];
  difficulty: string;
  isInCart: (workoutId: string) => boolean;
  createWorkoutId: (workout: Workout, equipment: string, difficulty: string) => string;
  handleAddToCart: (workout: Workout, equipment: string) => void;
  onStartWorkout: (workout: Workout, equipment: string, difficulty: string) => void;
}

const WorkoutCard = React.memo(({
  equipment,
  icon,
  workouts,
  difficulty,
  isInCart,
  createWorkoutId,
  handleAddToCart,
  onStartWorkout,
}: WorkoutCardProps) => {
  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState(0);
  const [localScaleAnim] = useState(new Animated.Value(1));
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [selectedWorkoutForEdit, setSelectedWorkoutForEdit] = useState<Workout | null>(null);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [sendModalWorkout, setSendModalWorkout] = useState<Workout | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Derive parent mood-card name + sub-path from the current route, so the
  // share card title matches the mood card the cart was created from
  // (Muscle Gainer / Sweat / Explosion / I'm Feeling Lazy / Outdoors / Calisthenics).
  const pathname = usePathname() || '';
  const { moodCategory, moodSubtext } = useMemo(() => {
    const path = pathname.toLowerCase();
    const muscleGroups = [
      'chest', 'back', 'shoulders', 'biceps', 'triceps',
      'legs', 'leg', 'abs', 'arms', 'forearms', 'glutes',
      'calves', 'quads', 'hamstrings', 'traps',
    ];
    const matchedMuscle = muscleGroups.find((m) => path.includes(m));
    if (matchedMuscle) {
      const pretty = matchedMuscle.charAt(0).toUpperCase() + matchedMuscle.slice(1);
      return { moodCategory: 'Muscle Gainer', moodSubtext: pretty };
    }
    if (path.includes('cardio') || path.includes('sweat')) {
      const isLight = path.includes('light') || path.includes('weight');
      return { moodCategory: 'Sweat', moodSubtext: isLight ? 'Light Weight' : 'Cardio' };
    }
    if (path.includes('explos')) {
      const isWeighted = path.includes('weight') && !path.includes('bodyweight');
      return { moodCategory: 'Explosion', moodSubtext: isWeighted ? 'Weight Based' : 'Bodyweight' };
    }
    if (path.includes('lazy')) {
      const isWeighted = path.includes('weight') && !path.includes('bodyweight');
      return { moodCategory: "I'm Feeling Lazy", moodSubtext: isWeighted ? 'Weight Based' : 'Bodyweight' };
    }
    if (path.includes('outdoor')) return { moodCategory: 'Outdoors', moodSubtext: '' };
    if (path.includes('cali')) return { moodCategory: 'Calisthenics', moodSubtext: '' };
    return { moodCategory: '', moodSubtext: '' };
  }, [pathname]);
  
  // Shuffle workouts once when the card mounts - stays consistent during the session
  const shuffledWorkouts = useMemo(() => shuffleArray(workouts), []);
  
  // Shimmer animation for pencil icon
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Start shimmer animation loop
    const startShimmer = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.delay(2000),
        ])
      ).start();
    };
    startShimmer();
  }, []);

  const handleOpenCustomModal = (workout: Workout) => {
    setSelectedWorkoutForEdit(workout);
    setCustomModalVisible(true);
  };

  const handleAddToCartWithAnimation = (workout: Workout) => {
    // Animate locally without affecting parent
    Animated.sequence([
      Animated.timing(localScaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(localScaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(localScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Call parent handler
    handleAddToCart(workout, equipment);
  };

  const renderWorkout = ({ item, index }: { item: Workout; index: number }) => (
    <View style={[styles.workoutSlide, { width: width - 48 }]}>
      {/* Workout Image */}
      <View style={styles.workoutImageContainer}>
        <Image
          source={{ uri: item.imageUrl }}
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
        <Text style={styles.workoutName}>{item.name}</Text>

        {/* Duration and Intensity on same line */}
        <View style={styles.durationIntensityRow}>
          <Text style={styles.workoutDuration}>{item.duration}</Text>
          <View style={[styles.difficultyBadge, { backgroundColor: '#FFD700' }]}>
            <Text style={styles.difficultyBadgeText}>
              {(difficulty === 'intermediate' ? 'INTERMED.' : difficulty).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Workout Description */}
        <View style={styles.workoutDescriptionContainer}>
          <Text style={styles.workoutDescription}>{item.description}</Text>
        </View>

        {/* Add Workout Button */}
        <Animated.View style={{ transform: [{ scale: localScaleAnim }] }}>
          <TouchableOpacity
            style={styles.addWorkoutButton}
            onPress={() => handleAddToCartWithAnimation(item)}
            activeOpacity={0.8}
            disabled={isInCart(createWorkoutId(item, equipment, difficulty))}
          >
            <Ionicons
              name={isInCart(createWorkoutId(item, equipment, difficulty)) ? 'checkmark' : 'add'}
              size={18}
              color="#FFD700"
            />
            <Text style={styles.addWorkoutButtonText}>
              {isInCart(createWorkoutId(item, equipment, difficulty)) ? 'Added' : 'Add workout'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Send Workout to Friend Button */}
        <TouchableOpacity
          style={styles.sendWorkoutButton}
          onPress={() => {
            setSendModalWorkout(item);
            setSendModalVisible(true);
          }}
          activeOpacity={0.85}
          testID={`send-workout-btn-${equipment}-${item.name}`}
        >
          <Ionicons name="paper-plane-outline" size={16} color="#fff" />
          <Text style={styles.sendWorkoutButtonText}>Send Workout to Friend</Text>
        </TouchableOpacity>

        {/* Swipe for more text */}
        <Text style={styles.swipeForMoreText}>Swipe for more</Text>
      </View>
    </View>
  );

  if (shuffledWorkouts.length === 0) {
    return null;
  }

  return (
    <View style={styles.workoutCard}>
      {/* Equipment Header */}
      <View style={styles.equipmentHeader}>
        <View style={styles.equipmentIconContainer}>
          <Ionicons name={icon} size={24} color="#FFD700" />
        </View>
        <Text style={styles.equipmentName}>{equipment}</Text>
        
        {/* Preview Button */}
        <TouchableOpacity
          style={styles.previewButton}
          onPress={() => onStartWorkout(shuffledWorkouts[currentWorkoutIndex], equipment, difficulty)}
          activeOpacity={0.8}
        >
          <Ionicons name="eye" size={14} color="#FFD700" />
          <Text style={styles.previewButtonText}>Preview</Text>
        </TouchableOpacity>
      </View>

      {/* Workout List */}
      <View style={styles.workoutList}>
        <FlatList
          ref={flatListRef}
          data={shuffledWorkouts}
          renderItem={renderWorkout}
          horizontal
          pagingEnabled
          snapToInterval={width - 48}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(event) => {
            const slideSize = width - 48;
            const offset = event.nativeEvent.contentOffset.x;
            const index = Math.round(offset / slideSize);
            const boundedIndex = Math.max(0, Math.min(index, shuffledWorkouts.length - 1));
            if (boundedIndex !== currentWorkoutIndex) {
              setCurrentWorkoutIndex(boundedIndex);
            }
          }}
          onMomentumScrollEnd={(event) => {
            const slideSize = width - 48;
            const offset = event.nativeEvent.contentOffset.x;
            const index = Math.round(offset / slideSize);
            const boundedIndex = Math.max(0, Math.min(index, shuffledWorkouts.length - 1));
            setCurrentWorkoutIndex(boundedIndex);
          }}
          onScrollEndDrag={(event) => {
            const slideSize = width - 48;
            const offset = event.nativeEvent.contentOffset.x;
            const index = Math.round(offset / slideSize);
            const boundedIndex = Math.max(0, Math.min(index, shuffledWorkouts.length - 1));
            setCurrentWorkoutIndex(boundedIndex);
          }}
          initialScrollIndex={0}
          getItemLayout={(data, index) => ({
            length: width - 48,
            offset: (width - 48) * index,
            index,
          })}
          keyExtractor={(item, index) => `${equipment}-${difficulty}-${index}`}
        />
      </View>

      {/* Navigation Dots - Centered */}
      <View style={styles.dotsContainer}>
        <View style={styles.dotsRow}>
          {shuffledWorkouts.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dotTouchArea,
                currentWorkoutIndex === index && styles.activeDotTouchArea,
              ]}
              onPress={() => {
                const offset = (width - 48) * index;
                flatListRef.current?.scrollToOffset({
                  offset: offset,
                  animated: true,
                });
                setCurrentWorkoutIndex(index);
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <View
                style={[
                  styles.dot,
                  currentWorkoutIndex === index && styles.activeDot,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Edit Button with Shimmer Effect */}
        <View style={styles.editButtonWrapper}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleOpenCustomModal(shuffledWorkouts[currentWorkoutIndex])}
            activeOpacity={0.8}
          >
            {/* Shimmer overlay on the pencil icon */}
            <View style={styles.shimmerContainer}>
              <Ionicons name="pencil" size={18} color="#FFD700" />
              <Animated.View 
                style={[
                  styles.shimmerOverlay,
                  {
                    transform: [{
                      translateX: shimmerAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-40, 40],
                      })
                    }],
                    opacity: shimmerAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 0.6, 0],
                    }),
                  }
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Custom Workout Modal */}
      <CustomWorkoutModal
        visible={customModalVisible}
        onClose={() => {
          setCustomModalVisible(false);
          setSelectedWorkoutForEdit(null);
        }}
        imageUrl={selectedWorkoutForEdit?.imageUrl || shuffledWorkouts[currentWorkoutIndex]?.imageUrl || ''}
        equipment={equipment}
        difficulty={difficulty}
        defaultWorkoutName={selectedWorkoutForEdit?.name || ''}
      />

      {/* Send Workout Modal */}
      <SendWorkoutModal
        visible={sendModalVisible}
        onClose={() => {
          setSendModalVisible(false);
          setSendModalWorkout(null);
        }}
        workout={sendModalWorkout}
        equipment={equipment}
        difficulty={difficulty}
        moodCategory={moodCategory}
        subtext={moodSubtext}
      />
    </View>
  );
});

export default WorkoutCard;

const styles = StyleSheet.create({
  workoutCard: {
    marginBottom: 25,
    marginHorizontal: 24,
    backgroundColor: '#111111',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  equipmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  equipmentIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  equipmentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  previewButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  previewButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  workoutList: {
    height: 330,
  },
  workoutSlide: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  workoutImageContainer: {
    height: 120,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  workoutImage: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
  },
  editButtonWrapper: {
    position: 'absolute',
    top: -10,
    right: 21,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  shimmerContainer: {
    position: 'relative',
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: -10,
    left: -20,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    transform: [{ rotate: '25deg' }],
  },
  workoutContent: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  durationIntensityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutDuration: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
  },
  workoutDescriptionContainer: {
    height: 40,
    marginBottom: 12,
    overflow: 'hidden',
  },
  workoutDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  addWorkoutButton: {
    height: 40,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  addWorkoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  sendWorkoutButton: {
    height: 38,
    marginTop: 8,
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.32)',
  },
  sendWorkoutButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  swipeForMoreText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 12,
  },
  dotsContainer: {
    height: 40,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 25,
    backgroundColor: 'transparent',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  activeDot: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  dotTouchArea: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 32,
    minHeight: 32,
    borderRadius: 16,
  },
  activeDotTouchArea: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 32,
    minHeight: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
});
