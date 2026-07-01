/**
 * GradientIcon — an Ionicon filled with the brand gold→orange gradient
 * (BRAND_GRADIENT) instead of a flat yellow, matching the floating cart button.
 * Uses MaskedView so the gradient shows through the glyph shape.
 */
import React from 'react';
import { StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import { BRAND_GRADIENT } from '../constants/brand';

interface GradientIconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  colors?: readonly string[];
  // Accept icon-style props (e.g. textShadow glow) from call sites; they're
  // applied to the wrapper View and harmlessly ignored where non-View.
  style?: StyleProp<ViewStyle | TextStyle>;
}

export default function GradientIcon({
  name,
  size = 16,
  colors = BRAND_GRADIENT,
  style,
}: GradientIconProps) {
  return (
    <MaskedView
      style={[{ width: size, height: size }, style as StyleProp<ViewStyle>]}
      maskElement={
        <View style={{ backgroundColor: 'transparent' }}>
          <Ionicons name={name} size={size} color="#000" />
        </View>
      }
    >
      <LinearGradient
        colors={[...colors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: size, height: size }}
      />
    </MaskedView>
  );
}
