/**
 * WearablesSnapshot: the Home wearables ribbon (calories from the last workout, steps, resting HR, sleep).
 * Moved unchanged from the V2 Home (app/(tabs)/index.tsx) so the V2 and V3 Homes share one implementation.
 * Values come from HealthKit (contexts/HealthContext) + /api/users/me/home-summary; missing values show "—".
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GradientIcon from './GradientIcon';
import { COLORS } from '../constants/brand';

// Wearables stats row — "Latest Snapshot" pulled from HealthKit + last workout calories.
export default function WearablesSnapshot({
  restingHr,
  sleepMinutes,
  steps,
  calories,
}: {
  restingHr: number | null;
  sleepMinutes: number | null;
  steps: number | null;
  calories: number | null;
}) {
  const fmtSleep = (m: number | null) => {
    if (m == null || m <= 0) return '—';
    const h = Math.floor(m / 60);
    const min = Math.round(m % 60);
    return `${h}h ${min}m`;
  };
  const fmtNum = (n: number | null, fallback = '—') => {
    if (n == null) return fallback;
    return n.toLocaleString();
  };

  // Synced when at least one metric has a real value; otherwise prompt to sync.
  const isSynced =
    restingHr != null || sleepMinutes != null || steps != null || calories != null;

  return (
    <View style={styles.wearablesSection}>
      <Text style={styles.wearablesHeader}>
        WEARABLES{!isSynced ? '  —  SYNC TO VIEW' : ''}
      </Text>
      <View style={styles.wearablesRow}>
        <View style={styles.wearableTile}>
          <View style={styles.wearableValueRow}>
            <GradientIcon name="flame-outline" size={15} style={styles.wearableIcon} />
            <Text style={styles.wearableValue}>{fmtNum(calories)}</Text>
          </View>
          <Text style={styles.wearableLabel}>CALORIES</Text>
          <Text style={styles.wearableSubLabel}>Last workout</Text>
        </View>
        <View style={styles.wearableTile}>
          <View style={styles.wearableValueRow}>
            <GradientIcon name="footsteps-outline" size={15} style={styles.wearableIcon} />
            <Text style={styles.wearableValue}>{fmtNum(steps)}</Text>
          </View>
          <Text style={styles.wearableLabel}>STEPS</Text>
          <Text style={styles.wearableSubLabel}>Yesterday</Text>
        </View>
        <View style={styles.wearableTile}>
          <View style={styles.wearableValueRow}>
            <GradientIcon name="heart-outline" size={15} style={styles.wearableIcon} />
            <Text style={styles.wearableValue}>{fmtNum(restingHr)}</Text>
          </View>
          <Text style={styles.wearableLabel}>RESTING HR</Text>
          <Text style={styles.wearableSubLabel}>BPM</Text>
        </View>
        <View style={styles.wearableTile}>
          <View style={styles.wearableValueRow}>
            <Ionicons name="moon-outline" size={15} color="#8AB4FF" style={styles.wearableIcon} />
            <Text style={styles.wearableValue}>{fmtSleep(sleepMinutes)}</Text>
          </View>
          <Text style={styles.wearableLabel}>SLEEP</Text>
          <Text style={styles.wearableSubLabel}>Last night</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wearablesSection: {
    marginTop: 2,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  wearablesHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#AAAAAA',
    letterSpacing: 1.4,
    marginBottom: 6,
    marginLeft: 2,
  },
  wearablesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 0.5,
    borderColor: 'rgba(154, 122, 53, 0.16)',
  },
  wearableTile: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  wearableValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wearableIcon: {
    marginRight: 5,
  },
  wearableValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  wearableLabel: {
    fontSize: 8.5,
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
    textAlign: 'center',
  },
  wearableSubLabel: {
    fontSize: 8,
    color: 'rgba(255, 255, 255, 0.32)',
    marginTop: 1,
    textAlign: 'center',
  },
});
