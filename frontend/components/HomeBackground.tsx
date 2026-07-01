/**
 * HomeBackground — premium dark backdrop for the Workouts tab.
 *
 * A near-black base with an off-center charcoal radial "lift" (uneven,
 * dimensional depth) plus a very faint blueprint-style grid. Black + charcoal
 * only — no color cast. Fixed behind the scroll content.
 */
import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Line, Pattern } from 'react-native-svg';

const CELL = 46; // grid spacing

export default function HomeBackground() {
  const { width, height } = useWindowDimensions();
  return (
    <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none">
      <Defs>
        {/* Very subtle charcoal lift, centered low so the TOP stays darkest.
            Barely perceptible against the black. */}
        <RadialGradient id="hb-glow" cx="50%" cy="68%" r="80%" gradientUnits="objectBoundingBox">
          <Stop offset="0" stopColor="#121214" />
          <Stop offset="0.55" stopColor="#0A0A0B" />
          <Stop offset="1" stopColor="#040405" />
        </RadialGradient>
        {/* Barely-visible blueprint grid. */}
        <Pattern id="hb-grid" width={CELL} height={CELL} patternUnits="userSpaceOnUse">
          <Line x1="0" y1="0" x2={CELL} y2="0" stroke="#FFFFFF" strokeOpacity={0.016} strokeWidth={1} />
          <Line x1="0" y1="0" x2="0" y2={CELL} stroke="#FFFFFF" strokeOpacity={0.016} strokeWidth={1} />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill="url(#hb-glow)" />
      <Rect x="0" y="0" width={width} height={height} fill="url(#hb-grid)" />
    </Svg>
  );
}
