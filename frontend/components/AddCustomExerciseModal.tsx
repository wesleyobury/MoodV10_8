import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCart, WorkoutItem } from '../contexts/CartContext';

const { width, height } = Dimensions.get('window');

// 5 custom workout images - cycle through without duplicating
const CUSTOM_WORKOUT_IMAGES = [
  'https://customer-assets.emergentagent.com/job_973f98f7-793a-4a48-9ca9-9ee71c7f4aec/artifacts/0u0g3ynz_download%20%286%29.png',
  'https://customer-assets.emergentagent.com/job_973f98f7-793a-4a48-9ca9-9ee71c7f4aec/artifacts/q99uhxb8_download%20%287%29.png',
  'https://customer-assets.emergentagent.com/job_973f98f7-793a-4a48-9ca9-9ee71c7f4aec/artifacts/fu7i3it5_download%20%288%29.png',
  'https://customer-assets.emergentagent.com/job_973f98f7-793a-4a48-9ca9-9ee71c7f4aec/artifacts/5fn316jf_download%20%289%29.png',
  'https://customer-assets.emergentagent.com/job_973f98f7-793a-4a48-9ca9-9ee71c7f4aec/artifacts/6c0f7bcq_download%20%2810%29.png',
];

interface AddCustomExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd?: (workout: WorkoutItem) => void;
  existingCustomWorkouts?: WorkoutItem[]; // Pass existing custom workouts to track used images
}

const AddCustomExerciseModal: React.FC<AddCustomExerciseModalProps> = ({
  visible,
  onClose,
  onAdd,
  existingCustomWorkouts = [],
}) => {
  const { addToCart, cartItems } = useCart();
  
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [equipment, setEquipment] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [rest, setRest] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Track images assigned this session to prevent duplicates even before cart state updates
  const assignedImagesRef = useRef<string[]>([]);

  // Get next available image that hasn't been used yet
  const getNextAvailableImage = (): string => {
    // Combine cart items, existing custom workouts, and images assigned this session
    const allItems = [...cartItems, ...existingCustomWorkouts];
    
    // Get all images currently used by custom workouts + assigned this session
    const usedImages = new Set([
      ...assignedImagesRef.current,
      ...allItems
        .filter(item => item.id?.startsWith('custom-') || item.workoutType === 'Custom')
        .map(item => item.imageUrl)
        .filter(Boolean),
    ]);
    
    // Find first unused image from our 5 images
    for (const img of CUSTOM_WORKOUT_IMAGES) {
      if (!usedImages.has(img)) {
        assignedImagesRef.current.push(img);
        return img;
      }
    }
    
    // All 5 used — cycle using total count to avoid same image twice in a row
    const idx = usedImages.size % CUSTOM_WORKOUT_IMAGES.length;
    const chosen = CUSTOM_WORKOUT_IMAGES[idx];
    assignedImagesRef.current.push(chosen);
    return chosen;
  };

  const resetForm = () => {
    setWorkoutTitle('');
    setEquipment('');
    setSets('');
    setReps('');
    setRest('');
  };

  const handleSave = () => {
    if (!workoutTitle.trim() || !equipment.trim() || !sets.trim() || !reps.trim()) {
      return;
    }

    // Get next available image (no duplicates for first 5 custom exercises)
    const thumbnailUrl = getNextAvailableImage();

    // Generate battle plan from user input
    const battlePlan = rest.trim() 
      ? `${sets} sets × ${reps} reps\n• ${workoutTitle}\n• Equipment: ${equipment}\n• Rest: ${rest} between sets`
      : `${sets} sets × ${reps} reps\n• ${workoutTitle}\n• Equipment: ${equipment}`;

    // Create workout item for cart
    const customWorkout: WorkoutItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: workoutTitle.trim(),
      duration: `${parseInt(sets) * 2}-${parseInt(sets) * 3} min`,
      description: `Custom exercise using ${equipment}`,
      battlePlan: battlePlan,
      imageUrl: thumbnailUrl,
      intensityReason: `Custom exercise targeting specific muscle groups.`,
      equipment: equipment.trim(),
      difficulty: 'Custom',
      workoutType: 'Custom',
      moodCard: 'Custom Exercise',
      moodTips: [],
    };

    // Use callback if provided, otherwise add directly to cart
    if (onAdd) {
      onAdd(customWorkout);
    } else {
      addToCart(customWorkout);
    }
    
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      resetForm();
      onClose();
    }, 1200);
  };

  const isFormValid = workoutTitle.trim() && equipment.trim() && sets.trim() && reps.trim();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={styles.modalContent}>
          {showSuccess ? (
            <View style={styles.successContainer}>
              <Ionicons name="checkmark-circle" size={32} color="#FFD700" />
              <Text style={styles.successText}>Exercise Added!</Text>
            </View>
          ) : (
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="add-circle-outline" size={22} color="#FFD700" />
                  </View>
                  <Text style={styles.headerTitle}>Add Custom Exercise</Text>
                </View>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={onClose}
                >
                  <Ionicons name="close" size={22} color="#999" />
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Form */}
              <ScrollView 
                style={styles.formContainer}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Exercise Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Exercise Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., Goblet Squats, Bicep Curls"
                    placeholderTextColor="#666"
                    value={workoutTitle}
                    onChangeText={setWorkoutTitle}
                    maxLength={40}
                  />
                </View>

                {/* Equipment */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Equipment</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., Dumbbells, Barbell, Kettlebell"
                    placeholderTextColor="#666"
                    value={equipment}
                    onChangeText={setEquipment}
                    maxLength={50}
                  />
                </View>

                {/* Sets and Reps Row */}
                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, styles.halfInput]}>
                    <Text style={styles.inputLabel}>Sets</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="3"
                      placeholderTextColor="#666"
                      value={sets}
                      onChangeText={(text) => setSets(text.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                  <View style={[styles.inputGroup, styles.halfInput]}>
                    <Text style={styles.inputLabel}>Reps</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="12"
                      placeholderTextColor="#666"
                      value={reps}
                      onChangeText={(text) => setReps(text.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                  </View>
                </View>

                {/* Rest (Optional) */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.inputLabel}>Rest</Text>
                    <Text style={styles.optionalLabel}>Optional</Text>
                  </View>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., 60 sec, 2 min"
                    placeholderTextColor="#666"
                    value={rest}
                    onChangeText={setRest}
                    maxLength={20}
                  />
                </View>
              </ScrollView>

              {/* Save Button - Gray background, gold icon, white text */}
              <TouchableOpacity
                style={styles.saveButtonWrapper}
                onPress={handleSave}
                disabled={!isFormValid}
                activeOpacity={0.8}
              >
                <View style={[styles.saveButton, !isFormValid && styles.saveButtonDisabled]}>
                  <Ionicons name="add-circle" size={20} color={isFormValid ? "#FFD700" : "#666"} />
                  <Text style={[styles.saveButtonText, !isFormValid && styles.saveButtonTextDisabled]}>
                    Add to Workout
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    width: width - 40,
    maxWidth: 400,
    maxHeight: height * 0.70,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 20,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: height * 0.45,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionalLabel: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  textInput: {
    backgroundColor: '#0d0d0d',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  saveButtonWrapper: {
    marginHorizontal: 20,
    marginVertical: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#333',
  },
  saveButtonDisabled: {
    backgroundColor: '#222',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  saveButtonTextDisabled: {
    color: '#666',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default AddCustomExerciseModal;
