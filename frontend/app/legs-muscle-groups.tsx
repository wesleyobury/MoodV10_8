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

interface MuscleGroupOption {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const muscleGroupOptions: MuscleGroupOption[] = [
  { 
    id: 'compound', 
    name: 'Compound', 
    icon: 'layers',
    description: 'Multiple leg muscles'
  },
  { 
    id: 'glutes', 
    name: 'Glutes', 
    icon: 'fitness',
    description: 'Buttocks & hip muscles'
  },
  { 
    id: 'hammies', 
    name: 'Hammies', 
    icon: 'barbell',
    description: 'Back of thigh muscles'
  },
  { 
    id: 'quads', 
    name: 'Quads', 
    icon: 'triangle',
    description: 'Front of thigh muscles'
  },
  { 
    id: 'calfs', 
    name: 'Calfs', 
    icon: 'diamond',
    description: 'Lower leg muscles'
  },
];

const MuscleGroupCard = ({ 
  muscleGroup, 
  isSelected, 
  onPress 
}: { 
  muscleGroup: MuscleGroupOption; 
  isSelected: boolean;
  onPress: (muscleGroup: MuscleGroupOption) => void;
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.muscleGroupCard,
        isSelected && styles.muscleGroupCardSelected
      ]}
      onPress={() => onPress(muscleGroup)}
      activeOpacity={0.8}
    >
      <View style={[
        styles.muscleGroupIconContainer,
        isSelected && styles.muscleGroupIconContainerSelected
      ]}>
        <Ionicons 
          name={muscleGroup.icon} 
          size={16} 
          color="#FFD700" 
        />
      </View>
      <View style={styles.muscleGroupTextContainer}>
        <Text style={[
          styles.muscleGroupName,
          isSelected && styles.muscleGroupNameSelected
        ]}>
          {muscleGroup.name}
        </Text>
      </View>
      {isSelected && (
        <View style={styles.muscleGroupIndicator}>
          <Ionicons name="checkmark" size={14} color='#FFD700' />
        </View>
      )}
    </TouchableOpacity>
  );
};

export default function LegsMuscleGroupsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<MuscleGroupOption[]>([]);
  
  const moodTitle = params.mood as string || 'Muscle gainer';
  const workoutType = 'Legs';
  
  // Multi-muscle group queue support
  const muscleQueue = params.muscleQueue ? JSON.parse(params.muscleQueue as string) : [];
  const currentMuscleIndex = parseInt(params.currentMuscleIndex as string || '0');
  const totalMuscles = parseInt(params.totalMuscles as string || '1');

  const handleMuscleGroupSelect = (muscleGroup: MuscleGroupOption) => {
    setSelectedMuscleGroups(prev => {
      const isAlreadySelected = prev.some(item => item.id === muscleGroup.id);
      
      if (isAlreadySelected) {
        // Remove from selection
        return prev.filter(item => item.id !== muscleGroup.id);
      } else {
        // Add to selection - no exclusivity rules
        return [...prev, muscleGroup];
      }
    });
  };

  const handleContinue = () => {
    if (selectedMuscleGroups.length > 0) {
      const isCompoundSelected = selectedMuscleGroups.some(mg => mg.id === 'compound');
      const individualMuscleGroups = selectedMuscleGroups.filter(mg => mg.id !== 'compound');
      
      console.log('Selected muscle groups:', selectedMuscleGroups.map(mg => mg.name));
      console.log('Has compound:', isCompoundSelected, 'Individual groups:', individualMuscleGroups.map(mg => mg.name));
      
      // Always navigate to unified legs equipment screen
      const muscleGroupNames = selectedMuscleGroups.map(mg => mg.name);
      const muscleGroupNamesString = muscleGroupNames.join(',');
      
      router.push({
        pathname: '/legs-equipment',
        params: { 
          mood: moodTitle,
          workoutType: workoutType,
          muscleGroups: encodeURIComponent(muscleGroupNamesString),
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

  const canContinue = selectedMuscleGroups.length > 0;

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
          <Text style={styles.headerTitle}>Legs Muscle Groups</Text>
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
                <Ionicons name="walk" size={14} color='#0c0c0c' />
              </LinearGradient>
            </View>
            <Text style={styles.progressStepText}>{workoutType}</Text>
          </View>
          
          <View style={styles.progressConnector} />
          
          <View style={styles.progressStep}>
            <View style={[
              styles.progressStepCircle,
              selectedMuscleGroups.length > 0 && styles.progressStepActive
            ]}>
              {selectedMuscleGroups.length > 0 ? (
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.progressStepGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.progressStepNumberActive}>
                    {selectedMuscleGroups.length}
                  </Text>
                </LinearGradient>
              ) : (
                <Text style={styles.progressStepNumber}>
                  {selectedMuscleGroups.length}
                </Text>
              )}
            </View>
            <Text style={styles.progressStepText}>
              Muscle Groups {selectedMuscleGroups.length > 0 && `(${selectedMuscleGroups.length})`}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Muscle Group Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Muscle Groups</Text>
          <Text style={styles.sectionSubtitle}>Choose individual muscle groups or select Compound for a full leg workout</Text>
          
          <View style={styles.muscleGroupContainer}>
            {muscleGroupOptions.map((muscleGroup) => (
              <MuscleGroupCard
                key={muscleGroup.id}
                muscleGroup={muscleGroup}
                isSelected={selectedMuscleGroups.some(item => item.id === muscleGroup.id)}
                onPress={handleMuscleGroupSelect}
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
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  progressStep: {
    alignItems: 'center',
    minWidth: 100,
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
    color: '#888888',
  },
  progressStepNumberActive: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0c0c0c',
  },
  progressStepText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '500',
    maxWidth: 100,
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
  muscleGroupContainer: {
    gap: 12,
  },
  muscleGroupCard: {
    height: 56,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  muscleGroupCardSelected: {
    backgroundColor: '#1a1a1a',
    borderColor: '#FFD700',
    borderWidth: 1,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  muscleGroupIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  muscleGroupIconContainerSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
  },
  muscleGroupTextContainer: {
    flex: 1,
  },
  muscleGroupName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  muscleGroupNameSelected: {
    color: '#ffffff',
  },
  muscleGroupIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
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