import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';

const LOGO = require('../assets/images/splash-icon.png');

/**
 * Matches the native splash config in app.json:
 *   expo-splash-screen -> { image: splash-icon.png, imageWidth: 400, resizeMode: 'contain' }
 *
 * Rendering at the same size on the same black background means the handoff
 * from the native splash to this JS splash is visually invisible - the logo
 * simply starts breathing instead of popping/jumping.
 */
const NATIVE_SPLASH_IMAGE_WIDTH = 400;

// Timings (ms)
const BREATH_DURATION = 1700;   // one direction of the scale breath
const GLOW_DURATION = 1900;     // one direction of the halo bloom
const GLOW_DELAY = 180;         // offset so glow and breath don't lock in step

// Amplitudes
const BREATH_SCALE = 1.045;
const GLOW_SCALE_FROM = 1.1;
const GLOW_SCALE_TO = 1.26;
const GLOW_OPACITY_FROM = 0.0;
const GLOW_OPACITY_TO = 0.38;

interface AnimatedSplashLogoProps {
  /** Override the rendered logo width. Defaults to the native splash width. */
  size?: number;
  /** Disable the looping animation (used for the static recovery screen). */
  animated?: boolean;
  style?: ViewStyle;
}

const AnimatedSplashLogo: React.FC<AnimatedSplashLogoProps> = ({
  size,
  animated = true,
  style,
}) => {
  const { width } = useWindowDimensions();

  // Never let the logo overflow narrow devices - mirrors `resizeMode: 'contain'`.
  const logoSize = size ?? Math.min(NATIVE_SPLASH_IMAGE_WIDTH, width * 0.86);

  const [reduceMotion, setReduceMotion] = useState(false);

  // Start at the exact resting state so frame 1 matches the native splash.
  const breathAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch(() => {
        // Not fatal - just animate normally.
      });

    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        if (mounted) setReduceMotion(enabled);
      }
    );

    return () => {
      mounted = false;
      // @ts-ignore - RN <0.71 returns void, newer returns a subscription
      sub?.remove?.();
    };
  }, []);

  useEffect(() => {
    if (!animated || reduceMotion) {
      breathAnim.setValue(0);
      glowAnim.setValue(0);
      return;
    }

    const breath = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: BREATH_DURATION,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathAnim, {
          toValue: 0,
          duration: BREATH_DURATION,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const glow = Animated.loop(
      Animated.sequence([
        Animated.delay(GLOW_DELAY),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: GLOW_DURATION,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: GLOW_DURATION,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    breath.start();
    glow.start();

    return () => {
      breath.stop();
      glow.stop();
    };
  }, [animated, reduceMotion, breathAnim, glowAnim]);

  const logoScale = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, BREATH_SCALE],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [GLOW_SCALE_FROM, GLOW_SCALE_TO],
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [GLOW_OPACITY_FROM, GLOW_OPACITY_TO],
  });

  const boxStyle = { width: logoSize, height: logoSize };

  return (
    <View style={[styles.container, boxStyle, style]} pointerEvents="none">
      {/*
        Halo: a scaled-up copy of the same artwork. The source PNG is pure
        black outside the glow, so layering it at partial opacity over the
        black background reads as an additive bloom around the ring rather
        than a visible second logo.
      */}
      <Animated.Image
        source={LOGO}
        resizeMode="contain"
        accessible={false}
        style={[
          styles.layer,
          boxStyle,
          { opacity: glowOpacity, transform: [{ scale: glowScale }] },
        ]}
      />

      {/* The logo itself. */}
      <Animated.Image
        source={LOGO}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="MOOD"
        style={[styles.layer, boxStyle, { transform: [{ scale: logoScale }] }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  layer: {
    position: 'absolute',
  },
});

// Keep a plain reference around for anything that wants the raw asset.
export { LOGO as SPLASH_LOGO_SOURCE };
export default AnimatedSplashLogo;
