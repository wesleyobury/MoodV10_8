/**
 * GlossyEmblem — convex "glass bubble" emblem used by the mood cards, the
 * social pucks, and the website puck on the Workouts tab.
 *
 * Space Black design language (Apple Wallet / TV+ / Leica): a matte-black
 * convex disc lit with a soft top specular highlight, a faint reflected
 * bounce-light along the lower rim, a subtle outer rim stroke, and a soft
 * ambient-gold glyph. Built with react-native-svg radial gradients so it stays
 * crisp at any size and fully themeable — no bitmap assets.
 */
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle, Ellipse, Defs, RadialGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

const GOLD = '#F4C316';

interface GlossyEmblemProps {
  icon: keyof typeof Ionicons.glyphMap;
  size?: number;
  glyphSize?: number;
  glyphColor?: string;
  style?: ViewStyle;
}

export default function GlossyEmblem({
  icon,
  size = 56,
  glyphSize,
  glyphColor = GOLD,
  style,
}: GlossyEmblemProps) {
  const gSize = glyphSize ?? Math.round(size * 0.46);
  // Unique gradient ids per instance so multiple emblems don't collide.
  const uid = `${icon}-${size}`;
  const baseId = `emb-base-${uid}`;
  const specId = `emb-spec-${uid}`;
  const bounceId = `emb-bounce-${uid}`;

  return (
    <View style={[{ width: size, height: size }, styles.shadow, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          {/* Convex base — light near the top, falling off to near-black. */}
          <RadialGradient id={baseId} cx="50" cy="32" r="62" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#45454B" />
            <Stop offset="0.36" stopColor="#26262B" />
            <Stop offset="0.68" stopColor="#141417" />
            <Stop offset="1" stopColor="#0A0A0B" />
          </RadialGradient>
          {/* Top specular highlight. */}
          <RadialGradient id={specId} cx="50" cy="24" r="30" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.42" />
            <Stop offset="0.58" stopColor="#FFFFFF" stopOpacity="0.06" />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </RadialGradient>
          {/* Reflected bounce-light along the lower rim. */}
          <RadialGradient id={bounceId} cx="50" cy="80" r="26" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#9AA0B0" stopOpacity="0.16" />
            <Stop offset="1" stopColor="#9AA0B0" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Circle cx="50" cy="50" r="49" fill={`url(#${baseId})`} />
        <Ellipse cx="50" cy="78" rx="26" ry="11" fill={`url(#${bounceId})`} />
        <Ellipse cx="50" cy="24" rx="30" ry="16" fill={`url(#${specId})`} />
        <Circle
          cx="50"
          cy="50"
          r="49"
          fill="none"
          stroke="#FFFFFF"
          strokeOpacity={0.06}
          strokeWidth={1}
        />
      </Svg>

      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.center}>
          <Ionicons name={icon} size={gSize} color={glyphColor} style={styles.glyph} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: {
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
