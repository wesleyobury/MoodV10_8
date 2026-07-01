import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import { BlurView } from 'expo-blur';

export type IntensityLevel = 'beginner' | 'intermediate' | 'advanced';

interface IntensityOption {
  id: IntensityLevel;
  title: string;
  subtitle: string;
  duration: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const intensityOptions: IntensityOption[] = [
  {
    id: 'beginner',
    title: 'Easy',
    subtitle: 'Light & manageable',
    duration: '~30-40 min',
    icon: 'leaf',
  },
  {
    id: 'intermediate',
    title: 'Moderate',
    subtitle: 'Balanced challenge',
    duration: '~45-60 min',
    icon: 'fitness',
  },
  {
    id: 'advanced',
    title: 'Intense',
    subtitle: 'Push your limits',
    duration: '~60-80 min',
    icon: 'flame',
  },
];

interface IntensitySelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectIntensity: (intensity: IntensityLevel) => void | Promise<void>;
  moodTitle?: string;
  remainingUses?: number;
}

export default function IntensitySelectionModal({
  visible,
  onClose,
  onSelectIntensity,
  moodTitle = 'Workout',
  remainingUses = 3,
}: IntensitySelectionModalProps) {
  const [selectedIntensity, setSelectedIntensity] = useState<IntensityLevel | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSelect = (intensity: IntensityLevel) => {
    if (isGenerating) return;
    setSelectedIntensity(intensity);
  };

  const handleConfirm = async () => {
    if (!selectedIntensity || isGenerating) return;

    const result = onSelectIntensity(selectedIntensity);
    if (result && typeof (result as Promise<void>).then === 'function') {
      setIsGenerating(true);
      try {
        await result;
        setSelectedIntensity(null);
        onClose();
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    setSelectedIntensity(null);
    onClose();
  };

  const handleClose = () => {
    if (isGenerating) return;
    setSelectedIntensity(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {isGenerating && (
            <View style={styles.generatingOverlay}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.generatingText}>Building your workouts…</Text>
            </View>
          )}
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="sparkles" size={24} color="#FFD700" />
            </View>
            <Text style={styles.title}>Choose Intensity</Text>
            <Text style={styles.subtitle}>How hard do you want to work today?</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsContainer}>
            {intensityOptions.map((option) => {
              const isSelected = selectedIntensity === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                  ]}
                  onPress={() => handleSelect(option.id)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.optionIcon,
                    isSelected && styles.optionIconSelected,
                  ]}>
                    <Ionicons
                      name={option.icon}
                      size={20}
                      color={isSelected ? '#FFD700' : '#888'}
                    />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[
                      styles.optionTitle,
                      isSelected && styles.optionTitleSelected,
                    ]}>
                      {option.title}
                    </Text>
                    <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                  </View>
                  <View style={styles.optionDuration}>
                    <Text style={styles.durationText}>{option.duration}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.checkmark}>
                      <Ionicons name="checkmark-circle" size={22} color="#FFD700" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isGenerating}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!selectedIntensity || isGenerating) && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!selectedIntensity || isGenerating}
            >
              <LinearGradient
                colors={selectedIntensity && !isGenerating ? ['#FFD700', '#FFA500'] : ['#333', '#222']}
                style={styles.confirmGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Text style={[
                      styles.confirmText,
                      !selectedIntensity && styles.confirmTextDisabled,
                    ]}>
                      Generate Workouts
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={18}
                      color={selectedIntensity ? '#000' : '#666'}
                    />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    overflow: 'hidden',
  },
  generatingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    gap: 14,
  },
  generatingText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  usageLimitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    gap: 6,
  },
  usageLimitText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  usageNote: {
    fontSize: 11,
    color: '#666',
    marginTop: 6,
    fontStyle: 'italic',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderColor: '#FFD700',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionIconSelected: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  optionTitleSelected: {
    color: '#FFD700',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  optionDuration: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginRight: 8,
  },
  durationText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  checkmark: {
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#888',
  },
  confirmButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmGradient: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  confirmTextDisabled: {
    color: '#666',
  },
});
