/**
 * ConnectionBanner — Phase 2 reliability.
 *
 * Slim top banner shown when the app appears to be offline, so connection
 * problems are VISIBLE instead of masquerading as freezes or mystery errors.
 * Driven by real request outcomes via subscribeNetworkStatus (no NetInfo —
 * that native module isn't in the shipped binary, so it can't ship OTA).
 * Appears after 2+ consecutive network failures; clears on first success.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { subscribeNetworkStatus } from '../utils/api';

export function ConnectionBanner() {
  const insets = useSafeAreaInsets();
  const [offline, setOffline] = useState(false);

  useEffect(() => subscribeNetworkStatus(setOffline), []);

  if (!offline) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 6 }]} pointerEvents="none">
      <View style={styles.row}>
        <Ionicons name="cloud-offline-outline" size={14} color="#FFD700" />
        <Text style={styles.text}>No connection — some things may not load</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(20, 20, 20, 0.96)',
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
    zIndex: 9000,
    elevation: 9000,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  text: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ConnectionBanner;
