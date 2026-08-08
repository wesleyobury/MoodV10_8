import React, { useEffect, useState } from 'react';
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
import { useOnboardingFunnel } from '../contexts/OnboardingFunnelContext';
import { recommendedIntensity } from '../utils/onboardingPersonalization';
import { usePathname } from 'expo-router';
import { useDrafts } from '../contexts/DraftsContext';

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
  // V2.1 — read the funnel answers here rather than threading a prop through
  // the six screens that open this modal (body-parts, workout-type,
  // lazy-training-type, explosiveness-type, calisthenics-equipment, ...).
  // OnboardingFunnelProvider is mounted app-wide in app/_layout.tsx, so this is
  // safe from anywhere and keeps all six call sites untouched.
  const { answers } = useOnboardingFunnel();
  const { currentDraftId, beginDraft } = useDrafts();
  const pathname = usePathname();
  const recommended = recommendedIntensity(answers.fitnessLevel, answers.workoutLength);

  const [selectedIntensity, setSelectedIntensity] = useState<IntensityLevel | null>(recommended);

  // Pre-select on every open. This modal stays mounted and toggles `visible`,
  // so a mount-time initial value alone would go stale after the first use.
  //
  // The point of this: selectedIntensity used to start at null EVERY session,
  // so Confirm was dead and the user faced a cold three-way decision before
  // every single workout. The daily choice is the product and stays fully
  // intact — this only decides where it starts, so accepting is one tap and
  // overriding is one tap.
  useEffect(() => {
    if (visible) setSelectedIntensity(recommended);
  }, [visible, recommended]);

  // Generation is fast — close immediately and let the screen take over.
  // No blocking "building your workouts" overlay.
  const handleConfirm = () => {
    if (!selectedIntensity) return;
    const intensity = selectedIntensity;

    // V2.1 — START THE SAVED BUILD HERE, not at the cart.
    //
    // Previously the draft was created in cart.tsx on first entry with items,
    // which meant everything a user did BEFORE reaching the cart — choosing a
    // mood, an intensity, body parts, equipment, a training type — was thrown
    // away if they dropped off mid-build. Anyone who bailed during selection
    // left no trace and had nothing to come back to.
    //
    // This modal is the one choke point every mood flow passes through (all six
    // selection screens open it), and by this moment we already know mood +
    // intensity — enough for a titled, resumable build. resume_route is then
    // kept current by DraftRouteTracker as they advance, and the cart patches in
    // the generated workout once it exists.
    //
    // Fire-and-forget: a failed draft write must never block the user's tap.
    if (!currentDraftId) {
      beginDraft({
        moodCategory: moodTitle || 'Workout',
        moodCard: moodTitle || null,
        preferenceInputs: { intensity },
        resumeRoute: pathname || undefined,
        resumeParams: {},
      }).catch(() => {});
    }

    setSelectedIntensity(recommended);
    onClose();
    Promise.resolve(onSelectIntensity(intensity)).catch(() => {});
  };

  const handleSelect = (intensity: IntensityLevel) => {
    setSelectedIntensity(intensity);
  };

  const handleClose = () => {
    setSelectedIntensity(recommended);
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
                      color={isSelected ? '#FFFFFF' : '#888'}
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
                    {recommended === option.id && (
                      <Text style={styles.recommendedNote}>Ideal for your fitness level</Text>
                    )}
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
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !selectedIntensity && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={!selectedIntensity}
            >
              <LinearGradient
                colors={selectedIntensity ? ['#FFD700', '#FFA500'] : ['#333', '#222']}
                style={styles.confirmGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
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
    // Gold border only — no gold fill (matches selected equipment buttons).
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
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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
    color: '#FFFFFF',
  },
  recommendedNote: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFD700',
    marginTop: 3,
    letterSpacing: 0.2,
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
