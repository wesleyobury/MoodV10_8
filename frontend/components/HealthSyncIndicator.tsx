/**
 * HealthSyncIndicator — quiet "Synced 2m ago" text.
 *
 * Spec:
 *   • Single line, low-contrast (opacity 0.55)
 *   • Monochrome — no green dots, badges, or emoji
 *   • SF Pro footnote, regular weight (system font default in RN on iOS)
 *   • Copy: "Synced 2m ago" — nothing else
 *   • Tap → silent refresh, 0.8s opacity dip-and-restore
 *   • Hidden until at least one successful snapshot fetch (lastSyncedAt set).
 *     Apple often keeps read authorization opaque (notDetermined) even after
 *     grant — we key off sync timestamp, not authorizationStatus.
 *   • Relative time updates every 60s
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native';
import { useHealth } from '../contexts/HealthContext';

const RELATIVE_TIME_TICK_MS = 60_000;
const FEEDBACK_DURATION_MS = 800;
const FEEDBACK_DIP_OPACITY = 0.2;
const RESTING_OPACITY = 0.55;

function formatRelative(iso: string | null): string | null {
  if (!iso) return null;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return null;
  const deltaSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (deltaSec < 30) return 'Synced just now';
  if (deltaSec < 60) return 'Synced 1m ago';
  const minutes = Math.floor(deltaSec / 60);
  if (minutes < 60) return `Synced ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Synced ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Synced ${days}d ago`;
}

export function HealthSyncIndicator() {
  const { lastSyncedAt, refresh } = useHealth();
  const opacity = useRef(new Animated.Value(RESTING_OPACITY)).current;
  const [, forceTick] = useState(0);

  // Re-render every 60s so the relative time stays current.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), RELATIVE_TIME_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const label = formatRelative(lastSyncedAt);
  if (!label) return null;

  const handlePress = () => {
    // Opacity dip-and-restore as the only affordance.
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: FEEDBACK_DIP_OPACITY,
        duration: FEEDBACK_DURATION_MS / 2,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: RESTING_OPACITY,
        duration: FEEDBACK_DURATION_MS / 2,
        useNativeDriver: true,
      }),
    ]).start();
    refresh({ silent: true });
  };

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <TouchableOpacity
        activeOpacity={1}
        onPress={handlePress}
        hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
        data-testid="health-sync-indicator"
      >
        <Animated.Text style={[styles.label, { opacity }]}>{label}</Animated.Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
});

export default HealthSyncIndicator;
