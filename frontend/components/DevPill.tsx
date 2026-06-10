/**
 * DevPill — a small floating "DEV" button shown ONLY in dev builds (`__DEV__`).
 * Tap → /dev/screens. Bottom-left so it never collides with the FloatingCart
 * (bottom-right). Renders nothing in production.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function DevPill() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!__DEV__) return null;

  return (
    <TouchableOpacity
      style={[styles.pill, { bottom: insets.bottom + 16 }]}
      onPress={() => router.push('/dev/screens' as any)}
      activeOpacity={0.8}
    >
      <Text style={styles.text}>DEV</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    left: 14,
    zIndex: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,215,0,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
  },
  text: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: '#0c0c0c' },
});
