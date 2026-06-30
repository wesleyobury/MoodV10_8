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
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext';
import { Analytics } from '../utils/analytics';

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

const equipmentOptions: EquipmentOption[] = [
  { id: 'dumbbells', name: 'Dumbbells', icon: 'barbell' },
  { id: 'cable-crossover', name: 'Cable crossover', icon: 'reorder-three' },
  { id: 'chest-press-machine', name: 'Chest press machine', icon: 'hardware-chip' },
  { id: 'decline-bench', name: 'Decline bench', icon: 'trending-down' },
  { id: 'dip-station', name: 'Dip station', icon: 'remove' },
  { id: 'flat-bench', name: 'Flat bench', icon: 'square' },
  { id: 'incline-bench', name: 'Incline bench', icon: 'trending-up' },
  { id: 'pec-dec-machine', name: 'Pec dec machine', icon: 'contract' },
  { id: 'smith-machine', name: 'Smith machine', icon: 'barbell' },
];

const difficultyLevels: DifficultyLevel[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    subtitle: 'New to chest workouts',
    color: '#FFD700',    // Same neon gold for all
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    subtitle: 'Some chest training experience',
    color: '#FFD700',    // Same neon gold for all
  },
  {
    id: 'advanced',
    title: 'Advanced',
    subtitle: 'Regular chest training enthusiast',
    color: '#FFD700',    // Same neon gold for all
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
          <Ionicons name="checkmark" size={16} color="#000000" />
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
          <Ionicons name="checkmark" size={20} color='#000000' />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function ChestEquipmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentOption[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);
  
  const moodTitle = params.mood as string || 'Muscle gainer';
  const workoutType = params.workoutType as string || 'Chest';
  
  // Multi-muscle group queue support
  const muscleQueue = params.muscleQueue ? JSON.parse(params.muscleQueue as string) : [];
  const currentMuscleIndex = parseInt(params.currentMuscleIndex as string || '0');
  const totalMuscles = parseInt(params.totalMuscles as string || '1');

  const handleEquipmentSelect = (equipment: EquipmentOption) => {
    setSelectedEquipment(prev => {
      const isAlreadySelected = prev.some(item => item.id === equipment.id);
      if (isAlreadySelected) {
        // Remove from selection
        return prev.filter(item => item.id !== equipment.id);
      } else {
        // Add to selection - track equipment selected
        if (token) {
          Analytics.equipmentSelected(token, { 
            equipment: equipment.name, 
            mood_category: moodTitle 
          });
        }
        return [...prev, equipment];
      }
    });
  };

  const handleDifficultySelect = (level: DifficultyLevel) => {
    setSelectedDifficulty(level);
    
    // Track difficulty selected
    if (token) {
      Analytics.difficultySelected(token, { 
        difficulty: level.id, 
        mood_category: moodTitle 
      });
    }
  };

  const handleContinue = () => {
    if (selectedEquipment.length > 0 && selectedDifficulty) {
      console.log('Selected equipment:', selectedEquipment.map(eq => eq.name));
      console.log('Selected difficulty:', selectedDifficulty.title);
      
      // Navigate to unified chest workout display for all equipment selections
      const equipmentNames = selectedEquipment.map(eq => eq.name);
      const equipmentNamesString = equipmentNames.join(',');
      
      router.push({
        pathname: '/chest-workout-display',
        params: { 
          mood: moodTitle,
          workoutType: workoutType,
          equipment: encodeURIComponent(equipmentNamesString),
          difficulty: selectedDifficulty.id,
          // Pass muscle queue for multi-muscle workflows
          muscleQueue: JSON.stringify(muscleQueue),
          currentMuscleIndex: currentMuscleIndex.toString(),
          totalMuscles: totalMuscles.toString(),
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
        <BackButton onPress={handleGoBack} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Chest Equipment</Text>
          <Text style={styles.headerSubtitle}>{moodTitle}</Text>
        </View>
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
                <Ionicons name="flame" size={14} color='#0c0c0c' />
              </LinearGradient>
            </View>
            <Text style={styles.progressStepText}>{moodTitle}</Text>
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
                <Ionicons name="fitness" size={14} color='#0c0c0c' />
              </LinearGradient>
            </View>
            <Text style={styles.progressStepText}>{workoutType}</Text>
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
            <Text style={styles.progressStepText}>
              Equipment {selectedEquipment.length > 0 && `(${selectedEquipment.length})`}
            </Text>
          </View>
          
          <View style={styles.progressConnector} />
          
          <View style={styles.progressStep}>
            <View style={[
              styles.progressStepCircle,
              selectedDifficulty && styles.progressStepActive
            ]}>
              {selectedDifficulty ? (
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.progressStepGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="checkmark" size={14} color='#0c0c0c' />
                </LinearGradient>
              ) : (
                <Text style={styles.progressStepNumber}>4</Text>
              )}
            </View>
            <Text style={styles.progressStepText}>
              {selectedDifficulty ? selectedDifficulty.title : 'Difficulty'}
            </Text>
          </View>
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 22,
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
    marginBottom: 24,
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
    borderWidth: 2,
    borderColor: 'transparent',
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
    marginLeft: 12,
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
    marginLeft: 8,
  },
  difficultyContainer: {
    gap: 16,
  },
  difficultyCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  difficultyCardSelected: {
    borderWidth: 3,
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
    color: 'rgba(255, 255, 255, 0.5)',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  continueButtonTextActive: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0c0c0c',
  },
});