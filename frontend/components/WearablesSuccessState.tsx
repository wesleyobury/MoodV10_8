/**
 * WearablesSuccessState — MOOD V2 (Phase 5.2).
 *
 * A brief (~2s) validating moment after a successful HealthKit / Health Connect
 * grant during onboarding. NOT a celebration (that's reserved for Pulse Sync).
 * Fades in: ✓ Connected to {device} → first data point (best-effort) → subtext,
 * then auto-advances. Tap anywhere to skip the dwell.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/brand';
import { useHealth } from '../contexts/HealthContext';

function deviceLabel(): string {
  if (Platform.OS === 'ios') return 'Apple Watch';
  if (Platform.OS === 'android') return 'Health Connect';
  return 'your device';
}

export function WearablesSuccessState({ onDone }: { onDone: () => void }) {
  const { snapshot } = useHealth();
  const check = useRef(new Animated.Value(0)).current;
  const data = useRef(new Animated.Value(0)).current;
  const sub = useRef(new Animated.Value(0)).current;
  const doneRef = useRef(false);

  // Pick the most personal-feeling available value: HR > HRV > steps.
  let dataLine: string | null = null;
  if (snapshot) {
    if (snapshot.restingHeartRate != null) dataLine = `Resting HR: ${Math.round(snapshot.restingHeartRate)} bpm`;
    else if (snapshot.heartRateVariabilitySDNN != null) dataLine = `HRV: ${Math.round(snapshot.heartRateVariabilitySDNN)} ms`;
    else if (snapshot.stepCount != null) dataLine = `Steps: ${snapshot.stepCount.toLocaleString()}`;
  }

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  useEffect(() => {
    Animated.sequence([
      Animated.timing(check, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(data, { toValue: 1, duration: 300, delay: dataLine ? 150 : 0, useNativeDriver: true }),
      Animated.timing(sub, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(finish, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable style={styles.root} onPress={finish} testID="wearables-success">
      <Animated.View style={[styles.row, { opacity: check }]}>
        <Ionicons name="checkmark-circle" size={26} color={COLORS.accent} />
        <Text style={styles.connected}>Connected to {deviceLabel()}</Text>
      </Animated.View>

      {dataLine && (
        <Animated.Text style={[styles.data, { opacity: data }]}>{dataLine}</Animated.Text>
      )}

      <Animated.Text style={[styles.sub, { opacity: sub }]}>
        We&apos;ll use this to personalize your workouts.
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  connected: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  data: { fontSize: 30, fontWeight: '800', color: COLORS.accent, marginTop: 18, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: COLORS.textSecondary, marginTop: 16, textAlign: 'center' },
});

export default WearablesSuccessState;
