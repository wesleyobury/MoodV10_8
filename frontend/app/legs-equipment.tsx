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

interface Equipment {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface MuscleGroupEquipment {
  muscleGroup: string;
  equipment: Equipment[];
}

interface IntensityLevel {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const equipmentDatabase: MuscleGroupEquipment[] = [
  {
    muscleGroup: 'Compound',
    equipment: [
      { id: 'dumbbells-compound', name: 'Dumbbells', icon: 'fitness' },
      { id: 'hack-squat-compound', name: 'Hack Squat Machine', icon: 'triangle' },
      { id: 'kettlebells-compound', name: 'Kettlebells', icon: 'fitness' },
      { id: 'leg-press-compound', name: 'Leg Press Machine', icon: 'hardware-chip' },
      { id: 'pendulum-squat-compound', name: 'Pendulum Squat', icon: 'trending-up' },
      { id: 'pit-shark', name: 'Pit Shark', icon: 'triangle-outline' },
      { id: 'cable-machine-compound', name: 'Single Stack Cable Machine', icon: 'link' },
      { id: 'smith-machine', name: 'Smith Machine', icon: 'grid-outline' },
      { id: 'squat-rack-compound', name: 'Squat Rack', icon: 'barbell' },
      { id: 'trap-bar', name: 'Trap Bar', icon: 'remove' },
    ]
  },
  {
    muscleGroup: 'Glutes',
    equipment: [
      { id: 'glute-kick-machine', name: 'Glute Kick Machine', icon: 'ellipse' },
      { id: 'hip-abductor', name: 'Hip Abductor Machine', icon: 'resize' },
      { id: 'hip-thruster', name: 'Hip Thruster Equipment', icon: 'fitness' },
      { id: 'cable-machine', name: 'Single Stack Cable Machine', icon: 'link' },
    ]
  },
  {
    muscleGroup: 'Hammies',
    equipment: [
      { id: 'barbell-ham', name: 'Barbell', icon: 'barbell' },
      { id: 'dumbbells', name: 'Dumbbells', icon: 'fitness' },
      { id: 'leg-curl', name: 'Leg Curl Machine', icon: 'return-down-forward' },
      { id: 'roman-chair', name: 'Roman Chair', icon: 'desktop' },
    ]
  },
  {
    muscleGroup: 'Quads',
    equipment: [
      { id: 'barbell-quad', name: 'Barbell', icon: 'barbell' },
      { id: 'leg-extension', name: 'Leg Extension Machine', icon: 'trending-up' },
    ]
  },
  {
    muscleGroup: 'Calfs',
    equipment: [
      { id: 'barbell-calf', name: 'Barbell', icon: 'barbell' },
      { id: 'calf-raise', name: 'Calf Raise Machine', icon: 'arrow-up' },
      { id: 'dumbbells-calf', name: 'Dumbbells', icon: 'fitness' },
      { id: 'leg-press-calf', name: 'Leg Press Machine', icon: 'hardware-chip' },
    ]
  },
];

const intensityLevels: IntensityLevel[] = [
  {
    id: 'beginner',
    title: 'Beginner',
    subtitle: 'New to leg workouts',
    icon: 'leaf'
  },
  {
    id: 'intermediate',
    title: 'Intermediate',
    subtitle: 'Some workout experience',
    icon: 'fitness'
  },
  {
    id: 'advanced',
    title: 'Advanced',
    subtitle: 'Experienced lifter',
    icon: 'flame'
  }
];

const EquipmentCard = ({ 
  equipment, 
  isSelected, 
  onPress 
}: { 
  equipment: Equipment; 
  isSelected: boolean;
  onPress: (equipment: Equipment) => void;
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

const IntensityCard = ({ 
  intensity, 
  isSelected, 
  onPress 
}: { 
  intensity: IntensityLevel; 
  isSelected: boolean;
  onPress: (intensity: IntensityLevel) => void;
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.intensityCard,
        isSelected && styles.intensityCardSelected
      ]}
      onPress={() => onPress(intensity)}
      activeOpacity={0.8}
    >
      <View style={styles.intensityTextContainer}>
        <Text style={[
          styles.intensityTitle,
          isSelected && styles.intensityTitleSelected
        ]}>
          {intensity.title}
        </Text>
        <Text style={[
          styles.intensitySubtitle,
          isSelected && styles.intensitySubtitleSelected
        ]}>
          {intensity.subtitle}
        </Text>
      </View>
      {isSelected && (
        <View style={styles.intensityIndicator}>
          <Ionicons name="checkmark" size={20} color='#0c0c0c' />
        </View>
      )}
    </TouchableOpacity>
  );
};

const MuscleGroupSection = ({ 
  muscleGroupData, 
  selectedEquipment, 
  onEquipmentSelect 
}: { 
  muscleGroupData: MuscleGroupEquipment;
  selectedEquipment: Equipment[];
  onEquipmentSelect: (equipment: Equipment) => void;
}) => {
  return (
    <View style={styles.muscleGroupSection}>
      <Text style={styles.muscleGroupTitle}>{muscleGroupData.muscleGroup}</Text>
      <View style={styles.equipmentGrid}>
        {muscleGroupData.equipment.map((equipment) => (
          <EquipmentCard
            key={equipment.id}
            equipment={equipment}
            isSelected={selectedEquipment.some(item => item.id === equipment.id)}
            onPress={onEquipmentSelect}
          />
        ))}
      </View>
    </View>
  );
};

export default function LegsEquipmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>([]);
  const [selectedIntensity, setSelectedIntensity] = useState<IntensityLevel | null>(null);
  
  const moodTitle = params.mood as string || 'Muscle gainer';
  const workoutType = params.workoutType as string || 'Legs';
  const muscleGroupsParam = params.muscleGroups as string || '';
  
  // Multi-muscle group queue support
  const muscleQueue = params.muscleQueue ? JSON.parse(params.muscleQueue as string) : [];
  const currentMuscleIndex = parseInt(params.currentMuscleIndex as string || '0');
  const totalMuscles = parseInt(params.totalMuscles as string || '1');
  
  // Parse the muscle groups from the previous screen
  const muscleGroupNames = muscleGroupsParam ? decodeURIComponent(muscleGroupsParam).split(',') : [];
  
  // Filter equipment data based on selected muscle groups
  const relevantEquipmentData = equipmentDatabase.filter(mgEquipment => 
    muscleGroupNames.includes(mgEquipment.muscleGroup)
  );

  const handleEquipmentSelect = (equipment: Equipment) => {
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

  const handleIntensitySelect = (intensity: IntensityLevel) => {
    setSelectedIntensity(intensity);
  };

  const handleContinue = () => {
    if (selectedEquipment.length > 0) {
      // Create equipment mapping per muscle group
      const equipmentPerGroup = {
        Compound: [] as string[],
        Glutes: [] as string[],
        Hammies: [] as string[],
        Quads: [] as string[],
        Calfs: [] as string[]
      };

      // Map selected equipment to their respective muscle groups
      selectedEquipment.forEach(eq => {
        if (['dumbbells-compound', 'squat-rack-compound', 'leg-press-compound', 'hack-squat-compound', 'cable-machine-compound', 'trap-bar', 'pit-shark', 'smith-machine', 'kettlebells-compound', 'pendulum-squat-compound'].includes(eq.id)) {
          equipmentPerGroup.Compound.push(eq.name);
        }
        if (['glute-kick-machine', 'hip-abductor', 'hip-thruster', 'cable-machine'].includes(eq.id)) {
          equipmentPerGroup.Glutes.push(eq.name);
        }
        if (['barbell-ham', 'dumbbells', 'leg-curl', 'roman-chair'].includes(eq.id)) {
          equipmentPerGroup.Hammies.push(eq.name);
        }
        if (['barbell-quad', 'leg-extension'].includes(eq.id)) {
          equipmentPerGroup.Quads.push(eq.name);
        }
        if (['barbell-calf', 'dumbbells-calf', 'calf-raise', 'leg-press-calf'].includes(eq.id)) {
          equipmentPerGroup.Calfs.push(eq.name);
        }
      });

      const equipmentNames = selectedEquipment.map(eq => eq.name);
      const equipmentNamesString = equipmentNames.join(',');
      const isCompoundSelected = muscleGroupNames.includes('Compound');
      const isGlutesSelected = muscleGroupNames.includes('Glutes');
      const isHamstringsSelected = muscleGroupNames.includes('Hammies');
      const isQuadsSelected = muscleGroupNames.includes('Quads');
      const isCalvesSelected = muscleGroupNames.includes('Calfs');
      const hasCompoundEquipment = equipmentPerGroup.Compound.length > 0;
      const hasGlutesEquipment = equipmentPerGroup.Glutes.length > 0;
      const hasHamstringsEquipment = equipmentPerGroup.Hammies.length > 0;
      const hasQuadsEquipment = equipmentPerGroup.Quads.length > 0;
      const hasCalvesEquipment = equipmentPerGroup.Calfs.length > 0;
      
      console.log('Equipment per group:', equipmentPerGroup);
      console.log('Selected muscle groups:', muscleGroupNames);
      console.log('Selected intensity:', selectedIntensity?.id);
      
      // For legs workouts, always navigate to compound-workout-display with intensity
      if (selectedIntensity) {
        // Navigate to compound workout display with equipment mapping
        router.push({
          pathname: '/compound-workout-display',
          params: { 
            mood: moodTitle,
            workoutType: 'Legs',
            muscleGroups: encodeURIComponent(muscleGroupNames.join(',')),
            equipment: equipmentNamesString,
            equipmentPerGroup: encodeURIComponent(JSON.stringify(equipmentPerGroup)),
            difficulty: selectedIntensity.id,
            // Pass muscle queue for multi-muscle workflows
            muscleQueue: JSON.stringify(muscleQueue),
            currentMuscleIndex: currentMuscleIndex.toString(),
            totalMuscles: totalMuscles.toString(),
          }
        });
      }
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const isCompoundSelected = muscleGroupNames.includes('Compound');
  const isGlutesSelected = muscleGroupNames.includes('Glutes');
  const isHamstringsSelected = muscleGroupNames.includes('Hammies');
  const isQuadsSelected = muscleGroupNames.includes('Quads');
  const isCalvesSelected = muscleGroupNames.includes('Calfs');
  const hasCompoundEquipment = selectedEquipment.some(eq => 
    ['dumbbells-compound', 'squat-rack-compound', 'leg-press-compound', 'hack-squat-compound', 'cable-machine-compound', 'trap-bar', 'pit-shark', 'smith-machine', 'kettlebells-compound', 'pendulum-squat-compound'].includes(eq.id)
  );
  const hasGlutesEquipment = selectedEquipment.some(eq => 
    ['glute-kick-machine', 'hip-abductor', 'hip-thruster', 'cable-machine'].includes(eq.id)
  );
  const hasHamstringsEquipment = selectedEquipment.some(eq => 
    ['barbell-ham', 'dumbbells', 'leg-curl', 'roman-chair'].includes(eq.id)
  );
  const hasQuadsEquipment = selectedEquipment.some(eq => 
    ['barbell-quad', 'leg-extension'].includes(eq.id)
  );
  const hasCalvesEquipment = selectedEquipment.some(eq => 
    ['barbell-calf', 'dumbbells-calf', 'calf-raise', 'leg-press-calf'].includes(eq.id)
  );
  
  // For legs workouts, intensity selection is ALWAYS required
  const needsIntensity = true; // Always require intensity for legs workouts
  const canContinue = selectedEquipment.length > 0 && selectedIntensity !== null;

  if (relevantEquipmentData.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="chevron-back" size={24} color="#FFD700" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>No Equipment Found</Text>
          </View>
          <HomeButton />
        </View>
        
        <View style={styles.noEquipmentContainer}>
          <Text style={styles.noEquipmentText}>
            No equipment available for the selected muscle groups.
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
          onPress={handleGoBack}
        >
          <Ionicons name="chevron-back" size={24} color='#FFD700' />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Select Equipment</Text>
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
                <Ionicons name="walk" size={14} color='#0c0c0c' />
              </LinearGradient>
            </View>
            <Text style={styles.progressStepText}>{workoutType}</Text>
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
                <Ionicons name="body" size={14} color='#0c0c0c' />
              </LinearGradient>
            </View>
            <Text style={styles.progressStepText}>
              {muscleGroupNames.length > 0 ? muscleGroupNames.join(', ') : 'Muscle Group'}
            </Text>
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
                  <Ionicons name="fitness" size={14} color='#0c0c0c' />
                </LinearGradient>
              ) : (
                <Ionicons name="fitness" size={14} color='rgba(255, 255, 255, 0.5)' />
              )}
            </View>
            <Text style={styles.progressStepText}>
              Equipment {selectedEquipment.length > 0 && `(${selectedEquipment.length})`}
            </Text>
          </View>
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Equipment Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Equipment</Text>
          <Text style={styles.sectionSubtitle}>
            Select equipment for {muscleGroupNames.join(', ')} workout
          </Text>
          
          {relevantEquipmentData.map((muscleGroupData) => (
            <MuscleGroupSection
              key={muscleGroupData.muscleGroup}
              muscleGroupData={muscleGroupData}
              selectedEquipment={selectedEquipment}
              onEquipmentSelect={handleEquipmentSelect}
            />
          ))}
          
          {/* Intensity Selection - Always required for legs workouts */}
          {selectedEquipment.length > 0 && (
            <View style={styles.intensitySection}>
              <Text style={styles.sectionTitle}>Select Intensity Level</Text>
              <Text style={styles.sectionSubtitle}>
                Choose your workout difficulty level
              </Text>
              
              <View style={styles.intensityContainer}>
                {intensityLevels.map((intensity) => (
                  <IntensityCard
                    key={intensity.id}
                    intensity={intensity}
                    isSelected={selectedIntensity?.id === intensity.id}
                    onPress={handleIntensitySelect}
                  />
                ))}
              </View>
            </View>
          )}
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
    paddingVertical: 8,
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
    color: '#000000',
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
    paddingTop: 16,
    paddingBottom: 8,
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
  muscleGroupSection: {
    marginBottom: 16,
  },
  muscleGroupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'left',
  },
  equipmentGrid: {
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
    marginLeft: 8,
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
  noEquipmentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noEquipmentText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
  intensitySection: {
    marginTop: 32,
  },
  intensityContainer: {
    gap: 12,
  },
  intensityCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  intensityCardSelected: {
    backgroundColor: '#111111',
    borderColor: '#FFD700',
    borderWidth: 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  intensityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    marginRight: 16,
  },
  intensityIconContainerSelected: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderColor: 'rgba(0, 0, 0, 0.3)',
  },
  intensityTextContainer: {
    flex: 1,
  },
  intensityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  intensityTitleSelected: {
    color: '#ffffff',
  },
  intensitySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  intensitySubtitleSelected: {
    color: '#ffffff',
  },
  intensityIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});