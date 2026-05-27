/**
 * Onboarding — Medical Disclaimer.
 *
 * Shown once after a user's first authenticated session, BEFORE the HealthKit
 * value-prop / connect flow. User must tap "I Understand" to proceed. The
 * acknowledgement is persisted locally via healthStorage and the same text is
 * mirrored in the Terms of Service.
 */
import React from 'react';
import { useRouter } from 'expo-router';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { setMedicalDisclaimerAcknowledged } from '../../utils/healthStorage';

export const MEDICAL_DISCLAIMER_TEXT =
  'MOOD is not a medical device. Workouts are suggestions, not medical advice. Consult a physician before starting any exercise program.';

export default function MedicalDisclaimerScreen() {
  const router = useRouter();

  const handleAccept = async () => {
    await setMedicalDisclaimerAcknowledged();
    // Spec §1 — `/onboarding/health-intro` was killed; skip directly to connect.
    router.replace('/onboarding/health-connect');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.spacer} />

      <View style={styles.content}>
        <Text style={styles.label}>Before we begin</Text>
        <Text style={styles.title}>A quick note.</Text>

        <Text style={styles.body}>{MEDICAL_DISCLAIMER_TEXT}</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleAccept}
          data-testid="medical-disclaimer-accept"
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.primaryButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.primaryButtonText}>I Understand</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 28,
  },
  spacer: {
    flex: 0.25,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: '#FFD700',
    letterSpacing: 1.6,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 28,
    letterSpacing: -0.5,
  },
  body: {
    fontSize: 18,
    lineHeight: 28,
    color: 'rgba(255,255,255,0.78)',
  },
  footer: {
    paddingBottom: 8,
  },
  primaryButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c0c0c',
    letterSpacing: 0.3,
  },
});
