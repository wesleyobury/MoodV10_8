import React, { useState } from 'react';
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
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import { useCart, WorkoutItem } from '../contexts/CartContext';

const { width, height } = Dimensions.get('window');

interface CustomWorkoutModalProps {
  visible: boolean;
  onClose: () => void;
  imageUrl: string;
  equipment: string;
  difficulty: string;
  defaultWorkoutName?: string;
}

const CustomWorkoutModal: React.FC<CustomWorkoutModalProps> = ({
  visible,
  onClose,
  imageUrl,
  equipment,
  difficulty,
  defaultWorkoutName = '',
}) => {
  const { addToCart } = useCart();
  
  const [workoutTitle, setWorkoutTitle] = useState(defaultWorkoutName);
  const [movement, setMovement] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [rest, setRest] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const resetForm = () => {
    setWorkoutTitle(defaultWorkoutName);
    setMovement('');
    setSets('');
    setReps('');
    setRest('');
  };

  const handleSave = () => {
    if (!workoutTitle.trim() || !movement.trim() || !sets.trim() || !reps.trim()) {
      return;
    }

    // Generate battle plan from user input
    const battlePlan = rest.trim() 
      ? `${sets} sets × ${reps} reps\n• ${movement}\n• Rest: ${rest} between sets`
      : `${sets} sets × ${reps} reps\n• ${movement}`;

    // Create workout item for cart
    const customWorkout: WorkoutItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: workoutTitle.trim(),
      duration: `${parseInt(sets) * 2}-${parseInt(sets) * 3} min`,
      description: `Custom workout: ${movement}`,
      battlePlan: battlePlan,
      imageUrl: imageUrl,
      intensityReason: `Custom ${difficulty} workout targeting specific movements.`,
      equipment: equipment,
      difficulty: difficulty,
      workoutType: 'Custom',
      moodCard: 'Custom Workout',
      moodTips: [], // No mood tips for custom workouts
    };

    addToCart(customWorkout);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      resetForm();
      onClose();
    }, 1500);
  };

  const isFormValid = workoutTitle.trim() && movement.trim() && sets.trim() && reps.trim();

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
              <Text style={styles.successText}>Added</Text>
            </View>
          ) : (
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="create-outline" size={22} color="#FFD700" />
                  </View>
                  <Text style={styles.headerTitle}>Create Custom Workout</Text>
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
                {/* Workout Title */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Workout Title</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., Morning Power Set"
                    placeholderTextColor="#666"
                    value={workoutTitle}
                    onChangeText={setWorkoutTitle}
                    maxLength={40}
                  />
                </View>

                {/* Movement */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Movement</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g., Push-ups, Squats, Lunges"
                    placeholderTextColor="#666"
                    value={movement}
                    onChangeText={setMovement}
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

                {/* Equipment & Difficulty Info */}
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Ionicons name="fitness" size={16} color="#FFD700" />
                    <Text style={styles.infoText}>{equipment}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="speedometer" size={16} color="#FFD700" />
                    <Text style={styles.infoText}>{difficulty}</Text>
                  </View>
                </View>
              </ScrollView>

              {/* Save Button with Orange Gradient */}
              <TouchableOpacity
                style={styles.saveButtonWrapper}
                onPress={handleSave}
                disabled={!isFormValid}
                activeOpacity={0.8}
              >
                {isFormValid ? (
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.saveButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="add-circle" size={20} color="#000" />
                    <Text style={styles.saveButtonText}>Add to Cart</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.saveButton, styles.saveButtonDisabled]}>
                    <Ionicons name="add-circle" size={20} color="#666" />
                    <Text style={[styles.saveButtonText, styles.saveButtonTextDisabled]}>
                      Add to Cart
                    </Text>
                  </View>
                )}
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
    maxHeight: height * 0.75,
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
    paddingTop: 20,
    maxHeight: height * 0.45,
  },
  inputGroup: {
    marginBottom: 18,
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
  infoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
    paddingTop: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#ccc',
    fontWeight: '500',
  },
  saveButtonWrapper: {
    marginHorizontal: 20,
    marginVertical: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#2a2a2a',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
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

export default CustomWorkoutModal;
