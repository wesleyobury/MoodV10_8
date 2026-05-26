import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  FlatList,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeButton from '../components/HomeButton';
import { useCart, WorkoutItem } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Analytics } from '../utils/analytics';
import WigglingAddButton from '../components/WigglingAddButton';

const { width } = Dimensions.get('window');

interface Workout {
  name: string;
  duration: string;
  intensity: string;
  description: string;
  battlePlan: string[];
  intensityReason: string;
  moodTips: string[];
}

interface MuscleGroupWorkout {
  muscleGroupName: string;
  workouts: Workout[];
}

// Placeholder workout data - in a real implementation this would be comprehensive
const legsWorkoutDatabase: MuscleGroupWorkout[] = [
  {
    muscleGroupName: 'Glutes',
    workouts: [
      {
        name: 'Glute Bridge Power',
        duration: '25 min',
        intensity: 'Intermediate',
        description: 'Hip thrust variations focusing on glute activation',
        battlePlan: [
          '3 rounds of:',
          '• 15 glute bridges',
          '• 12 single-leg bridges',
          '• 20 clamshells each side',
          'Rest 90 sec between rounds'
        ],
        intensityReason: 'Moderate glute isolation builds strength and muscle activation.',
        moodTips: [
          'Focus on squeezing glutes at the top of each bridge movement',
          'Control the eccentric (lowering) phase for maximum muscle engagement'
        ]
      },
      {
        name: 'Hip Thrust Circuit',
        duration: '30 min',
        intensity: 'Advanced',
        description: 'Advanced glute strengthening with resistance variations',
        battlePlan: [
          '4 rounds of:',
          '• 20 weighted hip thrusts',
          '• 15 Bulgarian split squats each leg',
          '• 25 lateral band walks each direction',
          'Rest 2 min between rounds'
        ],
        intensityReason: 'Heavy loading maximizes glute muscle development and power.',
        moodTips: [
          'Drive through heels to maximize glute engagement in hip thrusts',
          'Maintain tension throughout the entire range of motion'
        ]
      }
    ]
  },
  {
    muscleGroupName: 'Hammies',
    workouts: [
      {
        name: 'Hamstring Strength',
        duration: '20 min',
        intensity: 'Beginner',
        description: 'Basic hamstring strengthening movements',
        battlePlan: [
          '3 rounds of:',
          '• 12 Romanian deadlifts',
          '• 15 lying leg curls',
          '• 10 good mornings',
          'Rest 75 sec between rounds'
        ],
        intensityReason: 'Controlled movements teach proper hamstring activation patterns.',
        moodTips: [
          'Feel the stretch in your hamstrings during the eccentric phase',
          'Keep your core engaged to protect your lower back'
        ]
      },
      {
        name: 'Hamstring Power',
        duration: '35 min',
        intensity: 'Advanced',
        description: 'Explosive hamstring training with plyometric elements',
        battlePlan: [
          '5 rounds of:',
          '• 8 single-leg Romanian deadlifts each leg',
          '• 12 Nordic hamstring curls',
          '• 10 jump squats with pause',
          'Rest 2.5 min between rounds'
        ],
        intensityReason: 'Plyometric training develops explosive hamstring power and speed.',
        moodTips: [
          'Control the negative phase of Nordic curls for maximum strength gains',
          'Land softly on jump squats to protect knees and engage hamstrings'
        ]
      }
    ]
  },
  {
    muscleGroupName: 'Quads',
    workouts: [
      {
        name: 'Quad Builder',
        duration: '28 min',
        intensity: 'Intermediate',
        description: 'Comprehensive quadriceps development workout',
        battlePlan: [
          '4 rounds of:',
          '• 15 goblet squats',
          '• 12 lunges each leg',
          '• 20 leg extensions',
          'Rest 90 sec between rounds'
        ],
        intensityReason: 'Multi-angle quad training ensures complete muscle development.',
        moodTips: [
          'Drive through your heels in squats to engage quads fully',
          'Focus on the squeeze at the top of leg extensions'
        ]
      },
      {
        name: 'Quad Domination',
        duration: '40 min',
        intensity: 'Advanced',
        description: 'High-intensity quadriceps training with heavy loads',
        battlePlan: [
          '5 rounds of:',
          '• 10 front squats',
          '• 8 pistol squats each leg',
          '• 15 jump lunges each leg',
          'Rest 3 min between rounds'
        ],
        intensityReason: 'Heavy compound movements maximize quad strength and mass.',
        moodTips: [
          'Keep chest up in front squats to maintain proper quad engagement',
          'Control the descent in pistol squats for maximum strength gains'
        ]
      }
    ]
  },
  {
    muscleGroupName: 'Calfs',
    workouts: [
      {
        name: 'Calf Raises',
        duration: '15 min',
        intensity: 'Beginner',
        description: 'Basic calf muscle strengthening',
        battlePlan: [
          '3 rounds of:',
          '• 20 standing calf raises',
          '• 15 seated calf raises',
          '• 12 single-leg calf raises each leg',
          'Rest 60 sec between rounds'
        ],
        intensityReason: 'High repetitions build calf muscle endurance and definition.',
        moodTips: [
          'Rise up on your toes as high as possible for full range',
          'Control the lowering phase to maximize muscle activation'
        ]
      },
      {
        name: 'Explosive Calves',
        duration: '25 min',
        intensity: 'Advanced',
        description: 'Plyometric calf training for power and explosiveness',
        battlePlan: [
          '4 rounds of:',
          '• 15 jump calf raises',
          '• 20 pogo hops',
          '• 10 single-leg bounds each leg',
          'Rest 2 min between rounds'
        ],
        intensityReason: 'Explosive movements develop calf power and athletic performance.',
        moodTips: [
          'Land softly and immediately explode up for maximum power',
          'Focus on quick ground contact time in pogo hops'
        ]
      }
    ]
  },
  {
    muscleGroupName: 'Compound',
    workouts: [
      {
        name: 'Full Leg Power',
        duration: '45 min',
        intensity: 'Intermediate',
        description: 'Complete leg workout targeting all major muscle groups',
        battlePlan: [
          '4 rounds of:',
          '• 12 squats',
          '• 10 deadlifts',
          '• 15 lunges each leg',
          '• 20 calf raises',
          'Rest 2 min between rounds'
        ],
        intensityReason: 'Compound movements work multiple leg muscles for complete development.',
        moodTips: [
          'Focus on proper form over heavy weight for compound movements',
          'Engage your core throughout all exercises for stability'
        ]
      },
      {
        name: 'Leg Day Elite',
        duration: '60 min',
        intensity: 'Advanced',
        description: 'Advanced compound leg training for maximum strength and size',
        battlePlan: [
          '5 rounds of:',
          '• 8 back squats',
          '• 6 Romanian deadlifts',
          '• 10 Bulgarian split squats each leg',
          '• 15 jump squats',
          'Rest 3 min between rounds'
        ],
        intensityReason: 'Heavy compound loading maximizes strength and muscle growth.',
        moodTips: [
          'Breathe and brace your core before each heavy lift',
          'Focus on explosiveness in the concentric phase of movements'
        ]
      }
    ]
  }
];

const getMuscleGroupIcon = (muscleGroupName: string): keyof typeof Ionicons.glyphMap => {
  const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    'Glutes': 'fitness',
    'Hammies': 'barbell',
    'Quads': 'triangle',
    'Calfs': 'diamond',
    'Compound': 'layers',
  };
  return iconMap[muscleGroupName] || 'fitness';
};

export default function LegsWorkoutDisplayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [currentWorkoutIndex, setCurrentWorkoutIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Cart and animation hooks
  const { addToCart, isInCart } = useCart();
  const { token } = useAuth();
  const [scaleAnim] = useState(new Animated.Value(1));
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  // Parse parameters
  const mood = params.mood as string || 'Muscle gainer';
  const workoutType = params.workoutType as string || 'Legs';
  const muscleGroupsParam = params.muscleGroups as string || '';
  
  // Multi-muscle group queue support
  const muscleQueue = params.muscleQueue ? JSON.parse(params.muscleQueue as string) : [];
  const currentMuscleIndex = parseInt(params.currentMuscleIndex as string || '0');
  const totalMuscles = parseInt(params.totalMuscles as string || '1');
  const hasMoreMuscles = muscleQueue.length > 0;
  
  // Decode and parse muscle groups
  const muscleGroupNames = muscleGroupsParam ? decodeURIComponent(muscleGroupsParam).split(',') : [];
  
  // Filter workouts based on selected muscle groups
  const userWorkouts = legsWorkoutDatabase.filter(mgw => 
    muscleGroupNames.includes(mgw.muscleGroupName)
  );

  const createWorkoutId = (workout: Workout, muscleGroupName: string) => {
    return `${workout.name}-${muscleGroupName}-legs`;
  };

  const handleAddToCart = (workout: Workout, muscleGroupName: string) => {
    const workoutId = createWorkoutId(workout, muscleGroupName);
    
    if (isInCart(workoutId) || addedItems.has(workoutId)) {
      return; // Already in cart
    }

    // Create proper workout type with muscle group (e.g., 'Legs - Glutes', 'Legs - Hammies')
    const displayWorkoutType = `${workoutType} - ${muscleGroupName}`;

    // Create WorkoutItem from current workout
    const workoutItem: WorkoutItem = {
      id: workoutId,
      name: workout.name,
      duration: workout.duration,
      description: workout.description,
      battlePlan: workout.battlePlan,
      imageUrl: '', // legs workouts might not have images
      intensityReason: workout.intensity,
      equipment: muscleGroupName,
      difficulty: workout.intensity,
      workoutType: displayWorkoutType,
      moodCard: mood,
      moodTips: workout.moodTips || [],
    };

    // Animate button
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Add to cart and update local state
    if (token) {
      Analytics.workoutAddedToCart(token, {
        workout_name: workout.name,
        mood_category: mood,
        equipment: muscleGroupName,
      });
    }
    addToCart(workoutItem);
    setAddedItems(prev => new Set(prev).add(workoutId));

    // Remove from local added state after 3 seconds to allow re-adding if removed from cart
    setTimeout(() => {
      setAddedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(workoutId);
        return newSet;
      });
    }, 3000);
  };

  // Navigate to next muscle group or view cart
  const handleNextMuscleGroup = () => {
    if (hasMoreMuscles) {
      const nextMuscle = muscleQueue[0];
      const remainingQueue = muscleQueue.slice(1);
      
      let pathname = '';
      switch (nextMuscle.name) {
        case 'Chest':
          pathname = '/chest-equipment';
          break;
        case 'Shoulders':
          pathname = '/shoulders-equipment';
          break;
        case 'Back':
          pathname = '/back-equipment';
          break;
        case 'Biceps':
          pathname = '/biceps-equipment';
          break;
        case 'Triceps':
          pathname = '/triceps-equipment';
          break;
        case 'Legs':
          pathname = '/legs-muscle-groups';
          break;
        case 'Abs':
          pathname = '/abs-equipment';
          break;
        default:
          pathname = '/cart';
      }

      router.push({
        pathname: pathname as any,
        params: {
          mood: mood,
          bodyPart: nextMuscle.name,
          muscleQueue: JSON.stringify(remainingQueue),
          currentMuscleIndex: (currentMuscleIndex + 1).toString(),
          totalMuscles: totalMuscles.toString(),
        }
      });
    } else {
      router.push('/cart');
    }
  };

  const handleStartWorkout = (workout: Workout, muscleGroupName: string) => {
    console.log('🚀 Starting workout:', workout.name);
    
    // Navigate to workout guidance with full parameters
    const params = {
      workoutName: workout.name,
      muscleGroup: muscleGroupName,
      equipment: muscleGroupName,
      description: workout.description,
      duration: workout.duration,
      difficulty: workout.intensity?.toLowerCase() || 'beginner',
      intensity: workout.intensity,
      battlePlan: workout.battlePlan.join('\n'),
      workoutType: 'Strength Based',
      imageUrl: workout.imageUrl || '',
      intensityReason: workout.intensityReason || '',
      moodCard: 'Muscle Gainer',
      moodTips: encodeURIComponent(JSON.stringify(workout.moodTips || [])),
      moodTipsCount: workout.moodTips.length.toString()
    };
    
    console.log('📝 Workout data:', params);
    console.log('🔄 Navigation params:', params);
    
    try {
      router.push({
        pathname: '/workout-guidance',
        params
      });
      console.log('✅ Navigation completed - using full parameters');
    } catch (error) {
      console.error('❌ Navigation failed:', error);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index || 0;
      console.log('👁️ Viewable items changed, new index:', newIndex);
      setCurrentWorkoutIndex(newIndex);
    }
  }).current;

  const onScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset;
    const viewSize = event.nativeEvent.layoutMeasurement;
    
    // Calculate current index based on scroll position
    const currentIndex = Math.round(contentOffset.x / viewSize.width);
    console.log('📜 Scroll event, calculated index:', currentIndex, 'offset:', contentOffset.x, 'viewWidth:', viewSize.width);
    setCurrentWorkoutIndex(currentIndex);
  };

  const handleBack = () => {
    router.back();
  };

  if (userWorkouts.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={24} color="#FFD700" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>No Workouts Found</Text>
          </View>
          <HomeButton />
        </View>
        
        <View style={styles.noWorkoutsContainer}>
          <Text style={styles.noWorkoutsText}>
            No workouts available for the selected muscle groups.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="chevron-back" size={24} color='#FFD700' />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Legs Workouts</Text>
          <Text style={styles.headerSubtitle}>{mood}</Text>
        </View>
        <HomeButton />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressContent}>
          <View style={styles.progressStep}>
            <View style={styles.progressStepActive}>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.progressStepGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="flame" size={14} color='#0c0c0c' />
              </LinearGradient>
            </View>
            <Text style={styles.progressStepText}>{mood}</Text>
          </View>
          
          <View style={styles.progressConnector} />
          
          <View style={styles.progressStep}>
            <View style={styles.progressStepActive}>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.progressStepGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name="walk" size={14} color='#0c0c0c' />
              </LinearGradient>
            </View>
            <Text style={styles.progressStepText}>{workoutType}</Text>
          </View>
          
          <View style={styles.progressConnector} />
          
          <View style={styles.progressStep}>
            <View style={styles.progressStepActive}>
              <LinearGradient colors={['#FFD700', '#FFA500']} style={styles.progressStepGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.progressStepBadgeText}>{muscleGroupNames.length}</Text>
              </LinearGradient>
            </View>
            <Text style={styles.progressStepText}>Muscle Groups</Text>
          </View>
        </View>
      </View>

      {/* Workout Indicators */}
      <View style={styles.dotsContainer}>
        <Text style={styles.indicatorText}>
          {currentWorkoutIndex + 1}/{userWorkouts.length}
        </Text>
        <Text style={styles.dotsLabel}>Swipe to explore</Text>
        <View style={styles.dotsRow}>
          {userWorkouts.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dotTouchArea,
                currentWorkoutIndex === index && styles.activeDotTouchArea,
              ]}
              onPress={() => {
                console.log(`🔥 Dot clicked: index ${index}, width: ${width}`);
                const offset = width * index;
                console.log(`🔥 Scrolling to offset: ${offset}`);
                
                flatListRef.current?.scrollToOffset({
                  offset: offset,
                  animated: true
                });
                setCurrentWorkoutIndex(index);
              }}
              activeOpacity={0.7}
            />
          ))}
        </View>
      </View>

      {/* Workout Cards FlatList */}
      <FlatList
        ref={flatListRef}
        data={userWorkouts}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50
        }}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        keyExtractor={(item, index) => `${item.muscleGroupName}-${index}`}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item: muscleGroup }) => {
          const currentWorkout = muscleGroup.workouts[0]; // Show first workout for each muscle group
          
          return (
            <View style={[styles.workoutSlide, { width }]}>
              <View style={styles.workoutHeader}>
                <View style={styles.muscleGroupInfo}>
                  <View style={styles.muscleGroupIconContainer}>
                    <Ionicons 
                      name={getMuscleGroupIcon(muscleGroup.muscleGroupName)} 
                      size={24} 
                      color="#FFD700" 
                    />
                  </View>
                  <Text style={styles.muscleGroupName}>{muscleGroup.muscleGroupName}</Text>
                </View>
                <WigglingAddButton
                  isInCart={isInCart(createWorkoutId(currentWorkout, muscleGroup.muscleGroupName)) || 
                           addedItems.has(createWorkoutId(currentWorkout, muscleGroup.muscleGroupName))}
                  onPress={() => handleAddToCart(currentWorkout, muscleGroup.muscleGroupName)}
                  scaleAnim={scaleAnim}
                />
              </View>

              {currentWorkout && (
                <View style={styles.workoutCard}>
                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutName}>{currentWorkout.name}</Text>
                    <Text style={styles.workoutDescription}>{currentWorkout.description}</Text>
                    
                    <View style={styles.workoutDetails}>
                      <View style={styles.detailItem}>
                        <Ionicons name="time" size={16} color="#FFD700" />
                        <Text style={styles.detailText}>{currentWorkout.duration}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Ionicons name="speedometer" size={16} color="#FFD700" />
                        <Text style={styles.detailText}>{currentWorkout.intensity}</Text>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.startWorkoutButton}
                    onPress={() => handleStartWorkout(currentWorkout, muscleGroup.muscleGroupName)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.startWorkoutButtonText}>Start Workout</Text>
                    <Ionicons name="play" size={20} color='#0c0c0c' />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
      />

      {/* Bottom Navigation Button - Only show when there are more muscles */}
      {hasMoreMuscles && (
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity 
            style={styles.nextMuscleButton}
            onPress={handleNextMuscleGroup}
          >
            <Text style={styles.nextMuscleButtonText}>
              {`Next: ${muscleQueue[0]?.displayName || muscleQueue[0]?.name || 'Muscle Group'}`}
            </Text>
            <Ionicons 
              name="arrow-forward"
              size={20} 
              color='#000' 
            />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '100%',
    maxWidth: 350,
    alignSelf: 'center',
  },
  progressStep: {
    alignItems: 'center',
    width: 70,
    flex: 0,
  },
  progressStepActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressStepGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 999,
  },
  progressStepBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0c0c0c',
    textAlign: 'center',
  },
  progressStepText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 70,
    lineHeight: 12,
  },
  progressConnector: {
    width: 12,
    height: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    marginHorizontal: 1,
    marginTop: 14,
  },
  workoutList: {
    flex: 1,
  },
  dotsContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  indicatorText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  dotsLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
    marginBottom: 8,
    fontWeight: '500',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dotTouchArea: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    marginHorizontal: 4,
  },
  activeDotTouchArea: {
    backgroundColor: '#FFD700',
    width: 24,
    borderRadius: 4,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  workoutSlide: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 20,
  },
  workoutHeader: {
    marginBottom: 20,
  },
  muscleGroupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  muscleGroupIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  muscleGroupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  workoutCard: {
    flex: 1,
    justifyContent: 'space-between',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  workoutDescription: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  workoutDetails: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    gap: 32,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  startWorkoutButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
    gap: 8,
  },
  startWorkoutButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  noWorkoutsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noWorkoutsText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
  addButtonWrapper: {
    position: 'relative',
  },
  addToCartButton: {
    backgroundColor: 'rgba(70, 70, 70, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  addToCartButtonAdded: {
    backgroundColor: 'rgba(70, 70, 70, 0.9)',
    borderColor: '#FFD700',
  },
  addToCartButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addToCartButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFD700',
  },
  bottomButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 215, 0, 0.2)',
  },
  nextMuscleButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextMuscleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});