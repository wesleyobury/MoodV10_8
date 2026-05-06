import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import HomeButton from '../components/HomeButton';
import BackButton from '../components/BackButton';
import ChooseForMeButton from '../components/ChooseForMeButton';
import IntensitySelectionModal, { IntensityLevel } from '../components/IntensitySelectionModal';
import GuestPromptModal from '../components/GuestPromptModal';
import { generateMuscleGainerCarts } from '../utils/workoutGenerator';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

import { API_URL } from '../utils/apiConfig';

const { width } = Dimensions.get('window');

interface BodyPart {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  subOptions?: SubOption[];
}

interface SubOption {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const bodyParts: BodyPart[] = [
  {
    name: 'Abs',
    icon: 'fitness',
    description: 'Core strength & stability'
  },
  {
    name: 'Arms',
    icon: 'barbell',
    description: 'Biceps, triceps & forearms',
    subOptions: [
      {
        name: "Bi's",
        icon: 'fitness',
        description: 'Front arm muscles'
      },
      {
        name: "Tri's",
        icon: 'magnet',
        description: 'Back arm muscles'
      }
    ]
  },
  {
    name: 'Back',
    icon: 'person-outline',
    description: 'Lats, rhomboids & traps'
  },
  {
    name: 'Chest',
    icon: 'shield',
    description: 'Pectorals & upper body'
  },
  {
    name: 'Legs',
    icon: 'walk',
    description: 'Quads, hamstrings & glutes'
  },
  {
    name: 'Shoulders',
    icon: 'diamond-outline',
    description: 'Deltoids & rotator cuffs'
  }
];

// Selection type to track both body part and sub-option
interface Selection {
  bodyPart: string;
  subOption?: string;
}

export default function BodyPartsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const [selectedBodyParts, setSelectedBodyParts] = useState<Selection[]>([]);
  // Ref to the main content ScrollView so we can scroll Continue / Build For Me into view
  const contentScrollRef = useRef<ScrollView>(null);
  const [expandedBodyPart, setExpandedBodyPart] = useState<string>('');
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;
  const [showIntensityModal, setShowIntensityModal] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [remainingUses, setRemainingUses] = useState(3);
  const { addToCart, clearCart } = useCart();
  const { isGuest, token } = useAuth();

  const { mood } = params;
  const moodTitle = mood as string || 'I want to gain muscle';
  const workoutType = 'Muscle Building';

  // Fetch usage on mount
  useEffect(() => {
    const fetchUsage = async () => {
      if (!isGuest && token) {
        try {
          const response = await fetch(`${API_URL}/api/choose-for-me/usage`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setRemainingUses(data.remaining_uses);
          }
        } catch (error) {
          console.error('Error fetching usage:', error);
        }
      }
    };
    fetchUsage();
  }, [isGuest, token]);

  // Helper function to get selected muscle group names for the generator
  const getSelectedMuscleGroupNames = (): string[] => {
    const names: string[] = [];
    for (const selection of selectedBodyParts) {
      if (selection.bodyPart === 'Arms' && selection.subOption) {
        // Convert Bi's/Tri's to Biceps/Triceps
        names.push(selection.subOption === "Bi's" ? 'Biceps' : 'Triceps');
      } else if (selection.bodyPart !== 'Arms') {
        names.push(selection.bodyPart);
      }
    }
    return names;
  };

  // Handle Build for me button press
  const handleBuildForMePress = () => {
    if (isGuest) {
      setShowGuestPrompt(true);
      return;
    }
    setShowIntensityModal(true);
  };

  // Handle intensity selection and generate workout
  const handleIntensitySelect = async (intensity: IntensityLevel) => {
    setShowIntensityModal(false);
    
    // Get selected muscle group names
    const selectedMuscleNames = getSelectedMuscleGroupNames();
    const carts = generateMuscleGainerCarts(intensity, selectedMuscleNames, moodTitle, workoutType);
    
    if (carts.length > 0) {
      if (!isGuest && token) {
        try {
          const response = await fetch(`${API_URL}/api/choose-for-me/generate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              carts: carts.map(cart => ({
                id: cart.id,
                workouts: cart.workouts.map(w => ({ name: w.name, duration: w.duration, equipment: w.equipment, description: w.description, imageUrl: w.imageUrl })),
                totalDuration: cart.totalDuration, intensity: cart.intensity, moodCard: moodTitle, workoutType,
              })),
              moodCard: moodTitle, intensity, selectedMuscleGroups: selectedMuscleNames,
            }),
          });
          if (response.ok) {
            const data = await response.json();
            setRemainingUses(data.remaining_uses);
          } else if (response.status === 429) {
            Alert.alert('Daily Limit Reached', 'You can only use Build for Me 3 times per day.', [{ text: 'OK' }]);
            return;
          }
        } catch (error) { console.error('Error saving generated workout:', error); }
      }
      
      // Go directly to cart with generated carts for skip functionality
      const selectedCart = carts[0];
      clearCart();
      selectedCart.workouts.forEach(workout => addToCart(workout, { source: 'build_for_me', token }));
      router.push({
        pathname: '/cart',
        params: { generatedCarts: JSON.stringify(carts), moodCard: moodTitle }
      });
    }
  };

  // Check if a body part is selected
  const isBodyPartSelected = (bodyPartName: string) => {
    return selectedBodyParts.some(s => s.bodyPart === bodyPartName);
  };

  // Check if a sub-option is selected
  const isSubOptionSelected = (bodyPartName: string, subOptionName: string) => {
    return selectedBodyParts.some(s => s.bodyPart === bodyPartName && s.subOption === subOptionName);
  };

  // Get sub-option for a body part if selected
  const getSelectedSubOption = (bodyPartName: string) => {
    const selection = selectedBodyParts.find(s => s.bodyPart === bodyPartName);
    return selection?.subOption;
  };

  const handleBodyPartSelect = (bodyPartName: string) => {
    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Special handling for Arms with sub-options
    if (bodyPartName === 'Arms') {
      if (expandedBodyPart === 'Arms') {
        // Collapse Arms if already expanded
        setExpandedBodyPart('');
        Animated.timing(expandAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start();
      } else {
        // Expand Arms to show Biceps and Triceps
        setExpandedBodyPart('Arms');
        Animated.timing(expandAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    } else {
      // Handle regular body parts - toggle selection
      if (isBodyPartSelected(bodyPartName)) {
        // Deselect
        setSelectedBodyParts(prev => prev.filter(s => s.bodyPart !== bodyPartName));
      } else {
        // Add to selection
        setSelectedBodyParts(prev => [...prev, { bodyPart: bodyPartName }]);
        // Scroll the bottom CTAs (Build For Me + Continue) into view
        requestAnimationFrame(() => {
          contentScrollRef.current?.scrollToEnd({ animated: true });
        });
      }
    }
  };

  const handleSubOptionSelect = (subOptionName: string) => {
    const fullName = subOptionName === "Bi's" ? 'Biceps' : 'Triceps';
    
    if (isSubOptionSelected('Arms', subOptionName)) {
      // Deselect this sub-option
      setSelectedBodyParts(prev => prev.filter(s => !(s.bodyPart === 'Arms' && s.subOption === subOptionName)));
    } else {
      // Add this sub-option (allow multiple arm selections)
      setSelectedBodyParts(prev => [...prev, { bodyPart: 'Arms', subOption: subOptionName }]);
      // Scroll the bottom CTAs into view
      requestAnimationFrame(() => {
        contentScrollRef.current?.scrollToEnd({ animated: true });
      });
    }
  };

  const handleContinue = () => {
    if (selectedBodyParts.length > 0) {
      console.log('Selected body parts:', selectedBodyParts);
      
      // Convert selections to a queue format for navigation
      const muscleQueue = selectedBodyParts.map(selection => {
        if (selection.bodyPart === 'Arms' && selection.subOption) {
          return {
            name: selection.subOption === "Bi's" ? 'Biceps' : 'Triceps',
            displayName: selection.subOption === "Bi's" ? 'Biceps' : 'Triceps',
            equipment: selection.subOption === "Bi's" ? 'biceps-equipment' : 'triceps-equipment'
          };
        }
        return {
          name: selection.bodyPart,
          displayName: selection.bodyPart,
          equipment: `${selection.bodyPart.toLowerCase()}-equipment`
        };
      });

      // Navigate to first muscle group's equipment screen with the full queue
      const firstMuscle = muscleQueue[0];
      const remainingQueue = muscleQueue.slice(1);
      
      let pathname = '';
      switch (firstMuscle.name) {
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
          console.log(`Navigation for ${firstMuscle.name} not implemented`);
          return;
      }

      router.push({
        pathname: pathname as any,
        params: {
          mood: mood,
          bodyPart: firstMuscle.name,
          muscleQueue: JSON.stringify(remainingQueue),
          currentMuscleIndex: '0',
          totalMuscles: muscleQueue.length.toString(),
        }
      });
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={handleBack} />
        <Text style={styles.headerTitle}>Select Muscle Groups</Text>
        <HomeButton />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.progressContent}
        >
          <View style={styles.progressStep}>
            <View style={styles.progressStepActive}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.progressStepGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="barbell" size={14} color='#0c0c0c' />
              </LinearGradient>
            </View>
            <Text style={styles.progressStepText}>{mood}</Text>
          </View>
          
          <View style={styles.progressConnector} />
          
          <View style={styles.progressStep}>
            <View style={[
              styles.progressStepCircle,
              selectedBodyParts.length > 0 && styles.progressStepActive
            ]}>
              {selectedBodyParts.length > 0 ? (
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.progressStepGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.progressStepNumberActive}>{selectedBodyParts.length}</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.progressStepNumber}>2</Text>
              )}
            </View>
            <Text style={styles.progressStepText}>
              {selectedBodyParts.length > 0 ? `${selectedBodyParts.length} Selected` : 'Muscle Groups'}
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Body Parts Grid */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} ref={contentScrollRef}>
        <View style={styles.bodyPartsGrid}>
          {bodyParts.map((bodyPart) => {
            const isSelected = isBodyPartSelected(bodyPart.name);
            const isExpanded = expandedBodyPart === bodyPart.name;
            
            return (
              <Animated.View
                key={bodyPart.name}
                style={[
                  styles.bodyPartCard,
                  isSelected && styles.selectedBodyPartCard,
                  isExpanded && styles.expandedBodyPartCard,
                  { transform: [{ scale: scaleAnim }] }
                ]}
              >
                {/* Regular body part content */}
                {bodyPart.name !== 'Arms' || !isExpanded ? (
                  <TouchableOpacity
                    style={styles.bodyPartContent}
                    onPress={() => handleBodyPartSelect(bodyPart.name)}
                  >
                    <View style={[
                      styles.iconContainer,
                      isSelected && styles.selectedIconContainer
                    ]}>
                      <Ionicons 
                        name={bodyPart.icon} 
                        size={32} 
                        color={isSelected ? '#FFD700' : '#FFD700'} 
                      />
                    </View>
                    <Text style={[
                      styles.bodyPartName,
                      isSelected && styles.selectedBodyPartName
                    ]}>
                      {bodyPart.name}
                    </Text>
                    <Text style={[
                      styles.bodyPartDescription,
                      isSelected && styles.selectedBodyPartDescription
                    ]}>
                      {bodyPart.description}
                    </Text>
                    {isSelected && !isExpanded && (
                      <View style={styles.checkmark}>
                        <Ionicons name="checkmark-circle" size={24} color='#FFD700' />
                      </View>
                    )}
                    {bodyPart.name === 'Arms' && (
                      <View style={styles.expandIndicator}>
                        <Ionicons 
                          name="chevron-down" 
                          size={16} 
                          color='#999' 
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                ) : (
                  /* Arms expanded content - centered sub-options */
                  <Animated.View
                    style={[
                      styles.expandedContent,
                      {
                        opacity: expandAnim,
                      }
                    ]}
                  >
                    {/* Centered Sub-options within the same card */}
                    <View style={styles.centeredSubOptions}>
                      {bodyPart.subOptions?.map((subOption) => {
                        const isSubSelected = isSubOptionSelected('Arms', subOption.name);
                        return (
                          <TouchableOpacity
                            key={subOption.name}
                            style={[
                              styles.centeredSubOptionButton,
                              isSubSelected && styles.selectedCenteredSubOption
                            ]}
                            onPress={() => handleSubOptionSelect(subOption.name)}
                          >
                            <View style={[
                              styles.centeredSubIcon,
                              isSubSelected && styles.selectedCenteredSubIcon
                            ]}>
                              <Ionicons 
                                name={subOption.icon} 
                                size={16} 
                                color={isSubSelected ? '#FFD700' : '#888'} 
                              />
                            </View>
                            <View style={styles.buttonContent}>
                              <Text style={[
                                styles.centeredSubName,
                                isSubSelected && styles.selectedCenteredSubName
                              ]}>
                                {subOption.name}
                              </Text>
                            </View>
                            {isSubSelected && (
                              <View style={styles.centeredCheckmark}>
                                <Ionicons name="checkmark-circle" size={20} color='#FFD700' />
                              </View>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Small back arrow in corner */}
                    <TouchableOpacity 
                      style={styles.cornerBackButton}
                      onPress={() => handleBodyPartSelect('Arms')}
                    >
                      <Ionicons name="chevron-back" size={14} color='#888' />
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </Animated.View>
            );
          })}
        </View>

        {/* Build for me button - always visible, dormant when no selection */}
        <ChooseForMeButton 
          onPress={handleBuildForMePress}
          disabled={selectedBodyParts.length === 0 || (remainingUses <= 0 && !isGuest)}
          variant="muscleGroup"
          hideOrText={true}
        />

        {/* Continue Button - below Build for Me, users scroll to see it */}
        {selectedBodyParts.length > 0 && (
          <View style={styles.inlineBottomContainer}>
            {/* "or" divider between Build for Me and Continue */}
            <View style={styles.orDividerContainer}>
              <View style={styles.orDividerLine} />
              <Text style={styles.orDividerText}>or</Text>
              <View style={styles.orDividerLine} />
            </View>
            
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.continueButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.continueButtonText}>
                  Continue
                </Text>
                <Ionicons name="arrow-forward" size={20} color='#0c0c0c' style={styles.buttonIcon} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Bottom padding for scroll */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Intensity Selection Modal */}
      <IntensitySelectionModal
        visible={showIntensityModal}
        onClose={() => setShowIntensityModal(false)}
        onSelectIntensity={handleIntensitySelect}
        remainingUses={remainingUses}
      />

      {/* Guest Prompt Modal */}
      <GuestPromptModal
        visible={showGuestPrompt}
        onClose={() => setShowGuestPrompt(false)}
        action="use Build for Me and get personalized workouts"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    backgroundColor: '#111111',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  progressContent: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  progressStep: {
    alignItems: 'center',
    minWidth: 80,
  },
  progressStepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333333',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    overflow: 'hidden',
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
  progressStepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  progressStepNumberActive: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000000',
  },
  progressStepText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 80,
  },
  progressConnector: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
    marginHorizontal: 8,
    marginTop: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  bodyPartsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  bodyPartCard: {
    width: (width - 60) / 2,
    height: 150,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  bodyPartContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBodyPartCard: {
    backgroundColor: '#1a1a1a',
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  expandedBodyPartCard: {
    backgroundColor: '#2a2a2a',
    borderColor: '#FFD700',
  },
  expandedContent: {
    flex: 1,
    padding: 20,
    paddingTop: 24,
    paddingBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centeredSubOptions: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  centeredSubOptionButton: {
    width: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(136, 136, 136, 0.3)',
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedCenteredSubOption: {
    backgroundColor: '#333333',
    borderColor: '#FFD700',
  },
  centeredSubIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(136, 136, 136, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  selectedCenteredSubIcon: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  centeredSubName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  selectedCenteredSubName: {
    color: '#FFD700',
  },
  centeredSubDesc: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    lineHeight: 14,
  },
  selectedCenteredSubDesc: {
    color: '#ccc',
  },
  centeredCheckmark: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  buttonContent: {
    flex: 1,
    marginLeft: 4,
    marginRight: 24,
  },
  cornerBackButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(136, 136, 136, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  selectedIconContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  bodyPartName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  selectedBodyPartName: {
    color: '#FFD700',
  },
  bodyPartDescription: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedBodyPartDescription: {
    color: '#ccc',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0c0c0c',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  inlineBottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 0,
    marginTop: 0,
  },
  orDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  orDividerLine: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(100, 100, 100, 0.4)',
  },
  orDividerText: {
    color: 'rgba(150, 150, 150, 0.8)',
    fontSize: 13,
    fontWeight: '400',
    paddingHorizontal: 16,
    textTransform: 'lowercase',
  },
});
