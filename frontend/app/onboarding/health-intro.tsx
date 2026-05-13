/**
 * Onboarding — Screen A. HealthKit value prop.
 *
 *   "Get workouts tuned to how your body actually feels today.
 *    Connect Apple Health so MOOD can read your recovery."
 */
import React from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeLinearGradient as LinearGradient } from '../../components/SafeLinearGradient';

export default function HealthIntroScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.spacer} />

      <View style={styles.content}>
        <View style={styles.iconRing}>
          <Ionicons name="heart" size={28} color="#FFD700" />
        </View>

        <Text style={styles.title}>Train how your body{'\n'}feels today.</Text>

        <Text style={styles.body}>
          Get workouts tuned to how your body actually feels today. Connect
          Apple Health so MOOD can read your recovery.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/onboarding/health-connect')}
          data-testid="health-intro-continue"
        >
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.primaryButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
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
  spacer: { flex: 0.2 },
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
    marginBottom: 24,
  },
  body: {
    fontSize: 17,
    lineHeight: 26,
    color: 'rgba(255,255,255,0.72)',
  },
  footer: { paddingBottom: 8 },
  primaryButton: { borderRadius: 14, overflow: 'hidden' },
  primaryButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0c0c0c',
    letterSpacing: 0.3,
  },
});
