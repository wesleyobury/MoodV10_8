import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeButton from '../components/HomeButton';

interface BodyPartOption {
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

// Lazy weight body part options
const bodyPartOptions: BodyPartOption[] = [
  { id: 'upper-body', name: 'Upper body', icon: 'body' },
  { id: 'lower-body', name: 'Lower body', icon: 'walk' },
  { id: 'full-body', name: 'Full body', icon: 'fitness' },
];

// Difficulty levels with lazy-appropriate descriptions
const difficultyLevels: DifficultyLevel[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    subtitle: 'New to gentle lifting',
    color: '#FFD700',
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    subtitle: 'Some light weight experience',
    color: '#FFD700',
  },
  {
    id: 'advanced',
    title: 'Advanced',
    subtitle: 'Regular light lifting',
    color: '#FFD700',
  },
];

const BodyPartCard = ({ 
  bodyPart, 
  isSelected, 
  onPress 
}: { 
  bodyPart: BodyPartOption; 
  isSelected: boolean;
  onPress: (bodyPart: BodyPartOption) => void;
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.bodyPartCard,
        isSelected && styles.bodyPartCardSelected
      ]}
      onPress={() => onPress(bodyPart)}
      activeOpacity={0.8}
    >
      <View style={[
        styles.bodyPartIconContainer,
        isSelected && styles.bodyPartIconContainerSelected
      ]}>
        <Ionicons 
          name={bodyPart.icon} 
          size={16} 
          color={isSelected ? '#FFD700' : "rgba(255, 255, 255, 0.7)"} 
        />
      </View>
      <Text style={[
        styles.bodyPartName,
        isSelected && styles.bodyPartNameSelected
      ]}>
        {bodyPart.name}
      </Text>
      {isSelected && (
        <View style={styles.bodyPartIndicator}>
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
        isSelected && styles.difficultyCardSelected,
        isSelected && { borderColor: level.color }
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

export default function LazyWeightSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPartOption | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);
  
  const moodTitle = "I'm feeling lazy";
  const workoutType = 'Lift weights';

  const handleBodyPartSelect = (bodyPart: BodyPartOption) => {
    setSelectedBodyPart(bodyPart);
  };

  const handleDifficultySelect = (level: DifficultyLevel) => {
    setSelectedDifficulty(level);
  };

  const handleContinue = () => {
    if (selectedBodyPart && selectedDifficulty) {
      console.log('Selected body part:', selectedBodyPart.name);
      console.log('Selected difficulty:', selectedDifficulty.title);
      
      if (selectedBodyPart.id === 'upper-body') {
        // Route to upper body workouts screen for all difficulty levels
        router.push({
          pathname: '/lazy-upper-body-workouts',
          params: { 
            mood: moodTitle,
            workoutType: workoutType,
            bodyPart: selectedBodyPart.name,
            difficulty: selectedDifficulty.id
          }
        });
      } else if (selectedBodyPart.id === 'lower-body') {
        // Route to lower body workouts screen for all difficulty levels
        router.push({
          pathname: '/lazy-lower-body-workouts',
          params: { 
            mood: moodTitle,
            workoutType: workoutType,
            bodyPart: selectedBodyPart.name,
            difficulty: selectedDifficulty.id
          }
        });
      } else if (selectedBodyPart.id === 'full-body') {
        // Route to full body workouts screen for all difficulty levels
        router.push({
          pathname: '/lazy-full-body-workouts',
          params: { 
            mood: moodTitle,
            workoutType: workoutType,
            bodyPart: selectedBodyPart.name,
            difficulty: selectedDifficulty.id
          }
        });
      } else {
        // This should not happen with current options, but keeping as safety net
        alert(`${selectedBodyPart.name} workouts at ${selectedDifficulty.title} level will be available soon!`);
      }
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const canContinue = selectedBodyPart && selectedDifficulty;

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
          <Text style={styles.headerTitle}>Weight Training</Text>
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
                <Ionicons name="bed" size={14} color='#0c0c0c' />
              </LinearGradient>
            </View>
            <Text style={styles.progressStepText}>Feeling lazy</Text>
          </View>
          
          <View style={styles.progressConnector} />
          
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
            <Text style={styles.progressStepText}>Lift weights</Text>
          </View>
          
          <View style={styles.progressConnector} />
          
          <View style={styles.progressStep}>
            <View style={[
              styles.progressStepCircle,
              selectedBodyPart && styles.progressStepActive
            ]}>
              {selectedBodyPart ? (
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.progressStepGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.progressStepNumberActive}>1</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.progressStepNumber}>0</Text>
              )}
            </View>
            <Text style={styles.progressStepText}>Body part</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Body Part Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Body Part</Text>
          <Text style={styles.sectionSubtitle}>Choose which part of your body to focus on for gentle lifting</Text>
          
          <View style={styles.bodyPartContainer}>
            {bodyPartOptions.map((bodyPart) => (
              <BodyPartCard
                key={bodyPart.id}
                bodyPart={bodyPart}
                isSelected={selectedBodyPart?.id === bodyPart.id}
                onPress={handleBodyPartSelect}
              />
            ))}
          </View>
        </View>

        {/* Difficulty Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Difficulty</Text>
          <Text style={styles.sectionSubtitle}>Choose your gentle lifting level</Text>
          
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
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
    lineHeight: 22,
  },
  bodyPartContainer: {
    gap: 12,
  },
  bodyPartCard: {
    backgroundColor: '#111111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bodyPartCardSelected: {
    backgroundColor: '#111111',
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  bodyPartIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bodyPartIconContainerSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  bodyPartName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
  },
  bodyPartNameSelected: {
    fontWeight: 'bold',
  },
  bodyPartIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  difficultyCardSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    shadowOpacity: 0.4,
    shadowRadius: 10,
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
    textShadowColor: 'rgba(255, 215, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
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
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    backgroundColor: '#333333',
  },
  continueButtonActive: {
    borderWidth: 0,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'rgba(255, 215, 0, 0.7)',
    marginRight: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  continueButtonTextActive: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c0c0c',
    marginRight: 8,
  },
});