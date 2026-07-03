import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ConfettiToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

// On-brand gold-family palette (a couple of light accents keep it lively
// without going off-brand).
const CONFETTI_COLORS = ['#FFD700', '#F4C316', '#FFA500', '#FFE44D', '#FFFFFF', '#C9A227'];
const PIECE_COUNT = 16;

type Piece = {
  leftPct: number;
  color: string;
  dx: number;
  rise: number;
  spins: number;
  size: number;
  round: boolean;
};

/**
 * Lightweight celebratory toast: a small confetti burst pops up from a dark
 * gold-edged card. Pure Animated (no dependency). Used for workout completion.
 */
export default function ConfettiToast({
  message,
  visible,
  onHide,
  duration = 2600,
}: ConfettiToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const burst = useRef(new Animated.Value(0)).current;

  // Precompute per-piece params once so the burst is stable across renders.
  const pieces = useRef<Piece[]>(
    Array.from({ length: PIECE_COUNT }).map((_, i) => ({
      leftPct: 6 + Math.random() * 88,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      dx: (Math.random() * 2 - 1) * 70,
      rise: 34 + Math.random() * 46,
      spins: (Math.random() * 2 - 1) * 1.5,
      size: 5 + Math.random() * 5,
      round: Math.random() > 0.5,
    })),
  ).current;

  useEffect(() => {
    if (!visible) return;
    burst.setValue(0);
    opacity.setValue(0);
    translateY.setValue(50);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.timing(burst, {
        toValue: 1,
        duration: 1150,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 50, duration: 300, useNativeDriver: true }),
      ]).start(() => onHide());
    }, duration);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.container, { opacity, transform: [{ translateY }] }]}
      pointerEvents="none"
      data-testid="confetti-toast"
    >
      {/* Confetti bursts upward from the top edge of the card */}
      <View style={styles.confettiLayer} pointerEvents="none">
        {pieces.map((p, i) => {
          const ty = burst.interpolate({ inputRange: [0, 1], outputRange: [0, -p.rise] });
          const tx = burst.interpolate({ inputRange: [0, 1], outputRange: [0, p.dx] });
          const rotate = burst.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', `${p.spins * 360}deg`],
          });
          const pieceOpacity = burst.interpolate({
            inputRange: [0, 0.12, 0.75, 1],
            outputRange: [0, 1, 1, 0],
          });
          return (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                left: `${p.leftPct}%`,
                top: 6,
                width: p.size,
                height: p.round ? p.size : p.size * 0.5,
                borderRadius: p.round ? p.size / 2 : 1,
                backgroundColor: p.color,
                opacity: pieceOpacity,
                transform: [{ translateY: ty }, { translateX: tx }, { rotate }],
              }}
            />
          );
        })}
      </View>

      <View style={styles.content}>
        <Ionicons name="trophy" size={22} color="#FFD700" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  confettiLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  content: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  message: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
