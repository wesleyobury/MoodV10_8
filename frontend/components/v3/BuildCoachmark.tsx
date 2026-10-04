/**
 * BuildCoachmark: first Build after onboarding. A transparent overlay over the form (the Build Workout button stays
 * above it, bright and tappable) with one message pointing down at the button: the answers are already in, just build.
 * Tap anywhere to dismiss. Shown once per onboarding run (Build decides when).
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/brand';

interface Props {
  title: string;
  body: string;
  /** distance from the screen bottom to the top of the Build footer (the arrow points at it) */
  footerHeight: number;
  onDismiss: () => void;
}

export function BuildCoachmark({ title, body, footerHeight, onDismiss }: Props) {
  const fade = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 360, delay: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [fade, bob]);

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, styles.scrim, { opacity: fade }]} testID="v3-build-coachmark">
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onDismiss} accessibilityLabel="Dismiss" />
      <View style={[styles.wrap, { bottom: footerHeight + 4 }]} pointerEvents="box-none">
        <Pressable onPress={onDismiss} style={styles.bubble}>
          <Text style={styles.eyebrow}>SET FROM YOUR PROFILE</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <Text style={styles.hint}>Tap anywhere to look around first</Text>
        </Pressable>
        <Animated.View style={{ transform: [{ translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, 7] }) }] }}>
          <Ionicons name="arrow-down" size={26} color={COLORS.accent} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: 'rgba(0,0,0,0.62)' },
  wrap: { position: 'absolute', left: 20, right: 20, alignItems: 'center' },
  bubble: {
    alignSelf: 'stretch',
    padding: 16,
    borderRadius: 16,
    backgroundColor: COLORS.sheet,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.45)',
    marginBottom: 6,
  },
  eyebrow: { fontSize: 10, letterSpacing: 1.6, fontWeight: '800', color: COLORS.accent },
  title: { marginTop: 6, fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.2 },
  body: { marginTop: 4, fontSize: 14, lineHeight: 20, color: COLORS.textSecondary },
  hint: { marginTop: 10, fontSize: 11.5, color: COLORS.textTertiary },
});
