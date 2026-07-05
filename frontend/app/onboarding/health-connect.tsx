/**
 * Onboarding — Screen B. Permission connect / Maybe later.
 *
 *   "Connect Apple Health." — explicitly names Apple Health / HealthKit
 *   (Health Connect on Android) per App Review Guideline 2.5.1.
 *   [Connect Apple Health] → native HealthKit sheet → tabs
 *   [Maybe later]  → tabs (user can connect later from Settings)
 */
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
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
import { Analytics } from '../../utils/analytics';

// Guideline 2.5.1 — Apple requires HealthKit functionality to be clearly
// identified in the UI, so name the framework explicitly per platform.
const HEALTH_PLATFORM = Platform.OS === 'ios' ? 'Apple Health (HealthKit)' : 'Health Connect';
const HEALTH_PLATFORM_SHORT = Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect';

// Must match the native read set exactly (7 types) — see
// modules/mood-healthkit/{ios/MoodHealthKitModule.swift,android/.../MoodHealthKitModule.kt}.
// Each entry pairs the metric with where it's used in the app.
const BULLETS: { label: string; use: string }[] = [
  { label: 'Resting heart rate', use: 'daily snapshot' },
  { label: 'Heart rate variability', use: 'workout stats' },
  { label: 'Sleep (last night)', use: 'daily snapshot' },
  { label: 'Active energy', use: 'daily snapshot' },
  { label: 'Steps', use: 'daily snapshot' },
  { label: 'Heart rate (live)', use: 'workout sessions' },
  { label: 'Workout history', use: 'last-workout stats' },
];

export default function HealthConnectScreen() {
  const router = useRouter();
  const { user, token } = useAuth();
  const { requestPermissions } = useHealth();
  const [busy, setBusy] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Funnel step 8 — the wearables gate sits between the payoff paywall and
  // the first-workout handoff; without this the drop-off there is invisible.
  React.useEffect(() => {
    Analytics.onboardingStepViewed(token, { step: 8, question: 'wearables_connect' });
  }, [token]);

  // Phase 5.3 — after wearables, route to the mood interstitial (not home).
  // mood-intro then forwards to the first decision screen of the funnel mood.
  const goToMoodIntro = async () => {
    await setHealthOnboardingComplete();
    if (user?.id) await markWorkoutHandoffPending(user.id);
    router.replace('/mood-intro');
  };

  const handleMaybeLater = async () => {
    Analytics.onboardingStepCompleted(token, {
      step: 8,
      question: 'wearables_connect',
      answer: 'maybe_later',
    });
    await goToMoodIntro();
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
    Analytics.onboardingStepCompleted(token, {
      step: 8,
      question: 'wearables_connect',
      answer: granted ? 'connected' : 'denied',
    });
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
      {/* Scrollable content + fixed footer: content can never render
          behind the buttons regardless of device height. */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconRing}>
          <Ionicons name="pulse" size={28} color="#FFD700" />
        </View>

        <Text style={styles.title}>Connect{'\n'}{HEALTH_PLATFORM_SHORT}.</Text>

        <Text style={styles.body}>
          MOOD uses {HEALTH_PLATFORM} to read the health data below and
          personalize your workouts. Read-only. Never sold. Never used for
          ads.
        </Text>

        <Text style={styles.bulletsHeader}>
          MOOD reads from {HEALTH_PLATFORM_SHORT}:
        </Text>

        <View style={styles.bullets}>
          {BULLETS.map(({ label, use }) => (
            <View key={label} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletLabel}>{label}</Text>
              <Text style={styles.bulletUse}>{use}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.usageNote}>
          You&apos;ll see this data as your daily snapshot on the Home screen,
          as live heart rate during workout sessions, and as stats added to
          each completed workout.
        </Text>

        <Text style={styles.healthKitNotice}>
          {Platform.OS === 'ios'
            ? 'Powered by Apple HealthKit. View your synced data in Settings → Wearable Data. Change access anytime in the iOS Health app.'
            : 'Powered by Health Connect. View your synced data in Settings → Wearable Data. Change access anytime in Health Connect settings.'}
        </Text>
      </ScrollView>

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
              <Text style={styles.primaryButtonText}>
                Connect {HEALTH_PLATFORM_SHORT}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleMaybeLater}
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
  content: { flex: 1 },
  contentContainer: { paddingTop: 32, paddingBottom: 24 },
  iconRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,215,0,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
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
    marginBottom: 20,
  },
  bulletsHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  usageNote: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.60)',
    marginTop: 16,
  },
  healthKitNotice: {
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.45)',
    marginTop: 14,
  },
  bullets: { marginTop: 4 },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bulletUse: {
    marginLeft: 'auto',
    fontSize: 12,
    color: 'rgba(255,255,255,0.40)',
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
