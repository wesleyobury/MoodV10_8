import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Workout } from '../types/workout';
import CustomWorkoutModal from './CustomWorkoutModal';
import { shuffleArray } from '../utils/shuffle';
import { useAddWorkoutCoachmark } from './AddWorkoutCoachmark';

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
  const flatListRef = useRef<FlatList>(null);

  // First-time "Add workout" coachmark: report this card's Add button position
  // (window coords) so the overlay can anchor to it wherever it lands.
  const coach = useAddWorkoutCoachmark();
  const addBtnRef = useRef<any>(null);

  useEffect(() => {
    coach?.cardMounted();
    return () => coach?.cardUnmounted();
  }, [coach]);

  const reportAddButton = useCallback(() => {
    if (!coach || !addBtnRef.current?.measureInWindow) return;
    requestAnimationFrame(() => {
      addBtnRef.current?.measureInWindow((x: number, y: number, w: number, h: number) => {
        if (w > 0 && h > 0) coach.reportFirstAddButton({ x, y, w, h });
      });
    });
  }, [coach]);

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
            ref={index === 0 ? addBtnRef : undefined}
            onLayout={index === 0 ? reportAddButton : undefined}
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
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 16,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1.5,
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
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 22,
    minHeight: 22,
    borderRadius: 11,
  },
  activeDotTouchArea: {
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 22,
    minHeight: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
});
