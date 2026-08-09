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
 * react-native-svg is used for the glow. It is loaded defensively because this
 * renders on the boot path - if the native module ever fails to link we drop
 * the glow rather than crashing the app on launch.
 */
let Svg: any = null;
let Defs: any = null;
let RadialGradient: any = null;
let Stop: any = null;
let Circle: any = null;
let svgAvailable = false;
try {
  const rnsvg = require('react-native-svg');
  Svg = rnsvg.default;
  Defs = rnsvg.Defs;
  RadialGradient = rnsvg.RadialGradient;
  Stop = rnsvg.Stop;
  Circle = rnsvg.Circle;
  svgAvailable = Boolean(Svg && Defs && RadialGradient && Stop && Circle);
} catch (e) {
  svgAvailable = false;
}

const AnimatedSvgView = Animated.createAnimatedComponent(View);

/**
 * Matches the native splash config in app.json:
 *   expo-splash-screen -> { image: splash-icon.png, imageWidth: 400, resizeMode: 'contain' }
 *
 * Rendering at the same size on the same black background means the handoff
 * from the native splash to this screen is invisible - the logo simply starts
 * pulsing instead of popping or jumping.
 */
const NATIVE_SPLASH_IMAGE_WIDTH = 400;

// One full pulse = 2 x HALF_CYCLE. Kept under the boot window so at least one
// complete breath is always seen.
const HALF_CYCLE = 720;

const BREATH_SCALE = 1.055;   // logo swell at the peak of the pulse
const GLOW_SPREAD = 1.7;      // glow canvas size relative to the logo
const GLOW_SCALE_MIN = 0.9;
const GLOW_SCALE_MAX = 1.08;
const GLOW_OPACITY_MIN = 0.15;
const GLOW_OPACITY_MAX = 0.62;

const GLOW_ID = 'moodSplashGlow';

interface AnimatedSplashLogoProps {
  /** Override the rendered logo width. Defaults to the native splash width. */
  size?: number;
  /** Disable the pulse (used for the static recovery screen). */
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
  const glowSize = logoSize * GLOW_SPREAD;

  const [reduceMotion, setReduceMotion] = useState(false);

  // Starts at the exact resting state so frame 1 matches the native splash.
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) setReduceMotion(enabled);
      })
      .catch(() => {
        // Not fatal - just animate normally.
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!animated || reduceMotion) {
      pulse.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: HALF_CYCLE,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: HALF_CYCLE,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [animated, reduceMotion, pulse]);

  // Glow and scale move together, so the logo reads as pulsing with light
  // rather than two effects drifting past each other.
  const logoScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, BREATH_SCALE],
  });
  const glowScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [GLOW_SCALE_MIN, GLOW_SCALE_MAX],
  });
  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [GLOW_OPACITY_MIN, GLOW_OPACITY_MAX],
  });

  return (
    <View
      style={[
        styles.container,
        { width: glowSize, height: glowSize },
        style,
      ]}
      pointerEvents="none"
    >
      {/* Soft radial bloom behind the mark - a real gradient, not a second ring. */}
      {svgAvailable && (
        <AnimatedSvgView
          style={[
            styles.layer,
            {
              width: glowSize,
              height: glowSize,
              opacity: glowOpacity,
              transform: [{ scale: glowScale }],
            },
          ]}
        >
          <Svg width={glowSize} height={glowSize} viewBox="0 0 100 100">
            <Defs>
              <RadialGradient
                id={GLOW_ID}
                cx="50"
                cy="50"
                r="50"
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0" stopColor="#FFD700" stopOpacity="0.5" />
                <Stop offset="0.32" stopColor="#FFA500" stopOpacity="0.32" />
                <Stop offset="0.62" stopColor="#FF8A00" stopOpacity="0.1" />
                <Stop offset="1" stopColor="#FF8A00" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx="50" cy="50" r="50" fill={`url(#${GLOW_ID})`} />
          </Svg>
        </AnimatedSvgView>
      )}

      {/* The logo itself. */}
      <Animated.Image
        source={LOGO}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="MOOD"
        style={[
          styles.layer,
          { width: logoSize, height: logoSize, transform: [{ scale: logoScale }] },
        ]}
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

export { LOGO as SPLASH_LOGO_SOURCE };
export default AnimatedSplashLogo;
