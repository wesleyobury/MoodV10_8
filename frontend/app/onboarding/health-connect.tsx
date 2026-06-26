/**
 * Onboarding — Screen B. Permission connect / Maybe later.
 *
 *   "5 metrics. Read-only. Never sold. Never used for ads."
 *   [Connect]      → native HealthKit sheet → tabs
 *   [Maybe later]  → tabs (user can connect later from Settings)
 */
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';
import { useHealth } from '../../contexts/HealthContext';
import { setHealthOnboardingComplete } from '../../utils/healthStorage';
import { markWorkoutHandoffPending } from '../../utils/onboardingFunnelDefer';
import { WearablesSuccessState } from '../../components/WearablesSuccessState';
import { useAuth } from '../../contexts/AuthContext';

const BULLETS = [
  'Resting heart rate',
  'Heart rate variability',
  'Sleep (last night)',
  'Active energy (yesterday)',
  'Steps (yesterday)',
];

export default function HealthConnectScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { requestPermissions } = useHealth();
  const [busy, setBusy] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Phase 5.3 — after wearables, route to the mood interstitial (not home).
  // mood-intro then forwards to the first decision screen of the funnel mood.
  const goToMoodIntro = async () => {
    await setHealthOnboardingComplete();
    if (user?.id) await markWorkoutHandoffPending(user.id);
    router.replace('/mood-intro');
  };

  const handleConnect = async () => {
    if (busy) return;
    setBusy(true);
    let granted = false;
    try {
      granted = await requestPermissions();
    } finally {
      setBusy(false);
    }
    // Phase 5.2 — show the brief success state ONLY on an actual grant.
    // Denied/skipped → straight to mood-intro, no success state.
    if (granted) {
      setShowSuccess(true);
    } else {
      await goToMoodIntro();
    }
  };

  if (showSuccess) {
    return <WearablesSuccessState onDone={goToMoodIntro} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.spacer} />

      <View style={styles.content}>
        <View style={styles.iconRing}>
          <Ionicons name="pulse" size={28} color="#FFD700" />
        </View>

        <Text style={styles.title}>5 metrics.{'\n'}Read-only.</Text>

        <Text style={styles.body}>
          Never sold. Never used for ads. MOOD reads only what&apos;s needed to
          personalize your workouts.
        </Text>

        <View style={styles.bullets}>
          {BULLETS.map((label) => (
            <View key={label} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleConnect}
          disabled={busy}
          testID="health-connect-connect"
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.primaryButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {busy ? (
              <ActivityIndicator color="#0c0c0c" />
            ) : (
              <Text style={styles.primaryButtonText}>Connect</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={goToMoodIntro}
          disabled={busy}
          testID="health-connect-skip"
        >
          <Text style={styles.secondaryButtonText}>Maybe later</Text>
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
  spacer: { flex: 0.15 },
  content: { flex: 1 },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,215,0,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 38,
    marginBottom: 16,
  },
  body: {
    fontSize: 17,
    lineHeight: 26,
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 28,
  },
  bullets: { marginTop: 4 },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFD700',
    marginRight: 14,
  },
  bulletLabel: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
  },
  footer: { paddingBottom: 8 },
  primaryButton: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  primaryButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c0c0c',
    letterSpacing: 0.3,
  },
  secondaryButton: { paddingVertical: 14, alignItems: 'center' },
  secondaryButtonText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
});
