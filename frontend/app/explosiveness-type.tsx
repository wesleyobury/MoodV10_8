import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
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
import { generateExplosivenessCarts } from '../utils/workoutGenerator';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

import { API_URL } from '../utils/apiConfig';

interface ExplosivenessTypeOption {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const explosivenessTypeOptions: ExplosivenessTypeOption[] = [
  {
    id: 'bodyweight',
    title: 'Body Weight',
    subtitle: 'Explosive bodyweight movements',
    icon: 'body',
    description: 'Plyometric exercises using your own bodyweight for explosive power training',
  },
  {
    id: 'weight',
    title: 'Weight Based',
    subtitle: 'Explosive movements with weights',
    icon: 'barbell',
    description: 'Power training with weights and equipment to build explosive strength',
  },
];

const ExplosivenessTypeOption = ({ 
  option, 
  onPress,
  isSelected
}: { 
  option: ExplosivenessTypeOption; 
  onPress: (option: ExplosivenessTypeOption) => void;
  isSelected: boolean;
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
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

    onPress(option);
  };

  return (
    <Animated.View style={[styles.optionContainer, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={[styles.optionCard, isSelected && styles.selectedOptionCard]}>
        <View style={[styles.iconContainer, isSelected && styles.selectedIconContainer]}>
          <Ionicons 
            name={option.icon} 
            size={32} 
            color={isSelected ? '#FFD700' : '#FFD700'} 
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.optionTitle, isSelected && styles.selectedOptionTitle]}>{option.title}</Text>
          <Text style={[styles.optionSubtitle, isSelected && styles.selectedOptionSubtitle]}>{option.subtitle}</Text>
          <Text style={[styles.optionDescription, isSelected && styles.selectedOptionDescription]}>{option.description}</Text>
        </View>
        <View style={styles.arrowContainer}>
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={24} color="#FFD700" />
          ) : (
            <Ionicons name="chevron-forward" size={20} color='rgba(255, 255, 255, 0.3)' />
          )}
        </View>
      </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ExplosivenessTypeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [selectedOption, setSelectedOption] = useState<ExplosivenessTypeOption | null>(null);
  const [showIntensityModal, setShowIntensityModal] = useState(false);
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [remainingUses, setRemainingUses] = useState(3);
  const { addToCart, clearCart } = useCart();
  const { isGuest, token } = useAuth();
  
  const moodTitle = params.mood as string || 'Build explosion';

  // Fetch usage on mount for logged-in users
  useEffect(() => {
    const fetchUsage = async () => {
      if (isGuest || !token) return;
      
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
    };
    fetchUsage();
  }, [isGuest, token]);

  const handleExplosivenessTypeSelect = (option: ExplosivenessTypeOption) => {
    console.log('Selected explosiveness type:', option.title, 'for mood:', moodTitle);
    setSelectedOption(option);
  };

  const handleBuildForMe = () => {
    if (isGuest) {
      setShowGuestPrompt(true);
      return;
    }
    if (remainingUses <= 0) {
      Alert.alert('Daily Limit Reached', 'You can only use Build for Me 3 times per day. Try again tomorrow!', [{ text: 'OK' }]);
      return;
    }
    setShowIntensityModal(true);
  };

  const handleIntensitySelect = async (intensity: IntensityLevel) => {
    setShowIntensityModal(false);
    const carts = generateExplosivenessCarts(intensity, moodTitle, 'Mixed Explosive');
    
    if (carts.length > 0) {
      if (!isGuest && token) {
        try {
          const response = await fetch(`${API_URL}/api/choose-for-me/generate`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              carts: carts.map(cart => ({
                id: cart.id, workouts: cart.workouts.map(w => ({ name: w.name, duration: w.duration, equipment: w.equipment, description: w.description, imageUrl: w.imageUrl })),
                totalDuration: cart.totalDuration, intensity: cart.intensity, moodCard: moodTitle, workoutType: 'Mixed Explosive',
              })),
              moodCard: moodTitle, intensity: intensity,
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

  const handleContinue = () => {
    if (!selectedOption) return;
    
    if (selectedOption.id === 'bodyweight') {
      // Navigate to bodyweight equipment selection
      router.push({
        pathname: '/bodyweight-equipment',
        params: { mood: moodTitle, workoutType: selectedOption.title }
      });
    } else if (selectedOption.id === 'weight') {
      // Navigate to weight-based equipment selection
      router.push({
        pathname: '/weight-equipment',
        params: { mood: moodTitle, workoutType: selectedOption.title }
      });
    }
  };

  const handleGoBack = () => {
    router.back();
  };

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
          <Text style={styles.headerTitle}>Training Type</Text>
          <Text style={styles.headerSubtitle}>{moodTitle}</Text>
        </View>
        <HomeButton />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionTitle}>Build Your Workout</Text>
            <Text style={styles.instructionText}>
              Choose the type of explosive training that matches your goals today
            </Text>
          </View>

          <View style={styles.optionsContainer}>
            {explosivenessTypeOptions.map((option) => (
              <View key={option.id}>
                <ExplosivenessTypeOption
                  option={option}
                  onPress={handleExplosivenessTypeSelect}
                  isSelected={selectedOption?.id === option.id}
                />
              </View>
            ))}
          </View>

          {/* Build for me — textless divider above (matches Muscle Gainer path) */}
          <ChooseForMeButton onPress={handleBuildForMe} hideOrText={true} />

          {/* Build my own — inline, shown after a type is selected */}
          {selectedOption && (
            <View style={styles.inlineBottomContainer}>
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
                  <Text style={styles.continueButtonText}>Build my own</Text>
                  <Ionicons name="arrow-forward" size={20} color='#0c0c0c' style={styles.buttonIcon} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </View>
    </ScrollView>

    {/* Intensity Selection Modal */}
    <IntensitySelectionModal visible={showIntensityModal} onClose={() => setShowIntensityModal(false)} onSelectIntensity={handleIntensitySelect} moodTitle={moodTitle} remainingUses={remainingUses} />

    {/* Guest Prompt Modal */}
    <GuestPromptModal visible={showGuestPrompt} onClose={() => setShowGuestPrompt(false)} action="use Build for Me" />
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  scrollView: {
    flex: 1,
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  instructionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  instructionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 16,
  },
  chooseForMeContainer: {
    marginTop: 8,
  },
  optionContainer: {
    marginBottom: 0,
  },
  optionCard: {
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'transparent',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
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
  selectedOptionCard: {
    backgroundColor: '#1a1a1a',
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  selectedIconContainer: {
    backgroundColor: '#333333',
  },
  selectedOptionTitle: {
    color: '#FFFFFF',
  },
  selectedOptionSubtitle: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectedOptionDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  selectionSummary: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  selectionText: {
    fontSize: 14,
    color: '#FFD700',
    textAlign: 'center',
    fontWeight: '500',
  },
  inlineBottomContainer: {
    paddingHorizontal: 0,
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
});