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
import { routeForMood, readFunnelMoodId } from '../../utils/moodRoute';

const BULLETS = [
  'Resting heart rate',
  'Heart rate variability',
  'Sleep (last night)',
  'Active energy (yesterday)',
  'Steps (yesterday)',
];

export default function HealthConnectScreen() {
  const router = useRouter();
  const { requestPermissions } = useHealth();
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    await setHealthOnboardingComplete();
    // Spec §4 — first-session users came here straight from the funnel.
    // Don't dump them on home; route to the first-decision screen of the
    // mood they picked in funnel step 1 so the journey lands on a workout.
    // Returning users (whose `@mood_funnel_answers_v1` has been cleared by
    // logout, or who never went through the funnel) fall back to home.
    const moodId = await readFunnelMoodId();
    const route = routeForMood(moodId);
    if (route) {
      router.replace({ pathname: route.pathname as any, params: route.params });
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleConnect = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await requestPermissions();
    } finally {
      setBusy(false);
      await finish();
    }
  };

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
          data-testid="health-connect-connect"
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
          onPress={finish}
          disabled={busy}
          data-testid="health-connect-skip"
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
