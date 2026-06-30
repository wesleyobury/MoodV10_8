import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import HomeButton from '../components/HomeButton';
import ChooseForMeButton from '../components/ChooseForMeButton';
import IntensitySelectionModal, { IntensityLevel } from '../components/IntensitySelectionModal';
import GuestPromptModal from '../components/GuestPromptModal';
import { generateCalisthenicsCarts } from '../utils/workoutGenerator';
import { runTrackedGeneration } from '../utils/generationTracking';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { Analytics } from '../utils/analytics';

import { API_URL } from '../utils/apiConfig';

interface EquipmentOption {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface DifficultyLevel {
  id: string;
  title: string;
  subtitle: string;
  color: string;
}

// Calisthenics equipment options (alphabetically ordered)
const equipmentOptions: EquipmentOption[] = [
  { id: 'ab-wheel', name: 'Ab wheel', icon: 'ellipse' },
  { id: 'gymnast-rings', name: 'Gymnast rings', icon: 'radio-button-off' },
  { id: 'parallel-bars', name: 'Parallel bars / dip station', icon: 'remove' },
  { id: 'pull-up-bar', name: 'Pull up bar', icon: 'remove-outline' },
  { id: 'pull-up-bar-abs', name: 'Pull-Up Bar (abs)', icon: 'body-outline' },
  { id: 'pure-bodyweight', name: 'Pure bodyweight', icon: 'body' },
  { id: 'pushup-bars', name: 'Pushup bars / parallettes', icon: 'reorder-three' },
];

// Difficulty levels with calisthenics-appropriate descriptions
const difficultyLevels: DifficultyLevel[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    subtitle: 'New to calisthenics movements',
    color: '#FFD700',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    subtitle: 'Comfortable with basic calisthenics',
    color: '#FFD700',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    subtitle: 'Mastering advanced calisthenics skills',
    color: '#FFD700',
  },
];

const EquipmentCard = ({ 
  equipment, 
  isSelected, 
  onPress 
}: { 
  equipment: EquipmentOption; 
  isSelected: boolean;
  onPress: (equipment: EquipmentOption) => void;
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.equipmentCard,
        isSelected && styles.equipmentCardSelected
      ]}
      onPress={() => onPress(equipment)}
      activeOpacity={0.8}
    >
      <View style={[
        styles.equipmentIconContainer,
        isSelected && styles.equipmentIconContainerSelected
      ]}>
        <Ionicons 
          name={equipment.icon} 
          size={20} 
          color={isSelected ? '#FFD700' : '#FFFFFF'} 
        />
      </View>
      <Text style={[
        styles.equipmentName,
        isSelected && styles.equipmentNameSelected
      ]}>
        {equipment.name}
      </Text>
      {isSelected && (
        <View style={styles.equipmentIndicator}>
          <Ionicons name="checkmark" size={16} color="#0c0c0c" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const DifficultyCard = ({ 
  level, 
  isSelected, 
  onPress 
}: { 
  level: DifficultyLevel; 
  isSelected: boolean;
  onPress: (level: DifficultyLevel) => void;
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.difficultyCard,
        isSelected && styles.difficultyCardSelected
      ]}
      onPress={() => onPress(level)}
      activeOpacity={0.8}
    >
      <View style={styles.difficultyContent}>
        <Text style={[
          styles.difficultyTitle,
          
        ]}>
          {level.title}
        </Text>
        <Text style={styles.difficultySubtitle}>{level.subtitle}</Text>
      </View>
      {isSelected && (
        <View style={styles.difficultyIndicator}>
          <Ionicons name="checkmark" size={20} color="#0c0c0c" />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function CalisthenicsEquipmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentOption[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);
  const [showIntensityModal, setShowIntensityModal] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [remainingUses, setRemainingUses] = useState(3);
  const { addToCart, clearCart } = useCart();
  const { isGuest, token } = useAuth();
  
  const moodTitle = params.mood as string || 'I want to do calisthenics';
  const workoutType = params.workoutType as string || 'Calisthenics';

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
    const { carts } = runTrackedGeneration(
      token,
      { mood: moodTitle, energy_level: intensity, equipment: workoutType },
      () => generateCalisthenicsCarts(intensity, moodTitle, workoutType)
    );
    
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
              moodCard: moodTitle, intensity,
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
      selectedCart.workouts.forEach(workout => addToCart(workout));
      router.push({
        pathname: '/cart',
        params: { generatedCarts: JSON.stringify(carts), moodCard: moodTitle }
      });
    }
  };

  const handleEquipmentSelect = (equipment: EquipmentOption) => {
    setSelectedEquipment(prev => {
      const isAlreadySelected = prev.some(item => item.id === equipment.id);
      if (isAlreadySelected) {
        // Remove from selection
        return prev.filter(item => item.id !== equipment.id);
      } else {
        // Add to selection - track equipment selected
        if (token) {
          Analytics.equipmentSelected(token, { equipment: equipment.name, mood_category: moodTitle });
        }
        return [...prev, equipment];
      }
    });
  };

  const handleDifficultySelect = (level: DifficultyLevel) => {
    setSelectedDifficulty(level);
    
    // Track difficulty selected
    if (token) {
      Analytics.difficultySelected(token, { difficulty: level.id, mood_category: moodTitle });
    }
  };

  const handleContinue = () => {
    if (selectedEquipment.length > 0 && selectedDifficulty) {
      console.log('Selected equipment:', selectedEquipment.map(eq => eq.name));
      console.log('Selected difficulty:', selectedDifficulty.title);
      
      // Route to calisthenics workouts screen with all selected equipment
      const equipmentNames = selectedEquipment.map(eq => eq.name).join(',');
      
      router.push({
        pathname: '/calisthenics-workouts',
        params: { 
          mood: moodTitle,
          workoutType: workoutType,
          equipment: encodeURIComponent(equipmentNames),
          difficulty: selectedDifficulty.id
        }
      });
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const canContinue = selectedEquipment.length > 0 && selectedDifficulty;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <Ionicons name="chevron-back" size={24} color='#FFD700' />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Calisthenics Equipment</Text>
          <Text style={styles.headerSubtitle}>{moodTitle}</Text>
        </View>
        <HomeButton />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressContent}>
          <View style={styles.progressStep}>
            <View style={styles.progressStepActive}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.progressStepGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="body" size={14} color='#0c0c0c' />
              </LinearGradient>
            </View>
            <Text style={styles.progressStepText}>Calisthenics</Text>
          </View>
          
          <View style={styles.progressConnector} />
          
          <View style={styles.progressStep}>
            <View style={[
              styles.progressStepCircle,
              selectedEquipment.length > 0 && styles.progressStepActive
            ]}>
              {selectedEquipment.length > 0 ? (
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.progressStepGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.progressStepNumberActive}>
                    {selectedEquipment.length}
                  </Text>
                </LinearGradient>
              ) : (
                <Text style={styles.progressStepNumber}>
                  {selectedEquipment.length}
                </Text>
              )}
            </View>
            <Text style={styles.progressStepText}>Equipment</Text>
          </View>
          
          <View style={styles.progressConnector} />
          
          <View style={styles.progressStep}>
            <View style={[
              styles.progressStepCircle,
              selectedDifficulty && styles.progressStepActive
            ]}>
              <Ionicons 
                name={selectedDifficulty ? 'checkmark' : 'star'} 
                size={14} 
                color={selectedDifficulty ? '#000000' : 'rgba(255, 215, 0, 0.7)'} 
              />
            </View>
            <Text style={styles.progressStepText}>Difficulty</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Equipment Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Equipment</Text>
          <Text style={styles.sectionSubtitle}>Select the equipment you have or want to use — you'll see exercises on the next screen you can build from.</Text>
          
          <View style={styles.equipmentContainer}>
            {equipmentOptions.map((equipment) => (
              <EquipmentCard
                key={equipment.id}
                equipment={equipment}
                isSelected={selectedEquipment.some(item => item.id === equipment.id)}
                onPress={handleEquipmentSelect}
              />
            ))}
          </View>
        </View>

        {/* Build for me button - below equipment */}
        <ChooseForMeButton 
          onPress={handleBuildForMePress}
          disabled={remainingUses <= 0 && !isGuest}
          variant="equipment"
        />

        {/* Difficulty Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Difficulty</Text>
          <Text style={styles.sectionSubtitle}>Pick a level to match the exercises you'll see next.</Text>
          
          <View style={styles.difficultyContainer}>
            {difficultyLevels.map((level) => (
              <DifficultyCard
                key={level.id}
                level={level}
                isSelected={selectedDifficulty?.id === level.id}
                onPress={handleDifficultySelect}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            canContinue && styles.continueButtonActive
          ]}
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.8}
        >
          {canContinue ? (
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={styles.continueButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.continueButtonTextActive}>Continue</Text>
              <Ionicons name="chevron-forward" size={20} color='#0c0c0c' />
            </LinearGradient>
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </View>

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
        message="Sign up or log in to use Build for Me and get personalized workouts!"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color: '#FFFFFF',
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
    color: 'rgba(255, 215, 0, 0.7)',
  },
  progressStepNumberActive: {
    color: '#000000',
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
    lineHeight: 22,
  },
  equipmentContainer: {
    gap: 12,
  },
  equipmentCard: {
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  equipmentCardSelected: {
    backgroundColor: '#111111',
    borderColor: 'rgba(255, 215, 0, 0.3)',
    // Border stays the same - no heavy gold border on selection
  },
  equipmentIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 12,
  },
  equipmentIconContainerSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  equipmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  equipmentNameSelected: {
    fontWeight: 'bold',
  },
  equipmentIndicator: {
    backgroundColor: '#FFD700',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  difficultyContainer: {
    gap: 16,
    marginBottom: 16,
  },
  difficultyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 16,
    padding: 20,
  },
  difficultyCardSelected: {
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  difficultyContent: {
    flex: 1,
  },
  difficultyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  difficultySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  difficultyIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 215, 0, 0.2)',
  },
  continueButton: {
    backgroundColor: '#333333',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  continueButtonActive: {
    borderWidth: 0,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(255, 215, 0, 0.7)',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  continueButtonTextActive: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c0c0c',
  },
});