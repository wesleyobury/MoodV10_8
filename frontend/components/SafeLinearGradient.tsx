/**
 * SafeLinearGradient - A production-safe wrapper for expo-linear-gradient
 * 
 * This component handles cases where expo-linear-gradient fails to load
 * in production iOS builds by falling back to a solid color View.
 * 
 * Usage: Replace `import { LinearGradient } from 'expo-linear-gradient'`
 * with `import { SafeLinearGradient as LinearGradient } from '../components/SafeLinearGradient'`
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';

// Safely import expo-linear-gradient
let ExpoLinearGradient: any = null;
let linearGradientAvailable = false;

try {
  ExpoLinearGradient = require('expo-linear-gradient').LinearGradient;
  linearGradientAvailable = true;
} catch (error) {
  console.warn('expo-linear-gradient not available, using fallback:', error);
  linearGradientAvailable = false;
}

interface LinearGradientProps {
  colors: string[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  locations?: number[];
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
}

/**
 * SafeLinearGradient component
 * Falls back to a solid color View using the first color if LinearGradient fails
 */
export function SafeLinearGradient({
  colors,
  start,
  end,
  locations,
  style,
  children,
}: LinearGradientProps) {
  // If LinearGradient is available, use it
  if (linearGradientAvailable && ExpoLinearGradient) {
    return (
      <ExpoLinearGradient
        colors={colors}
        start={start}
        end={end}
        locations={locations}
        style={style}
      >
        {children}
      </ExpoLinearGradient>
    );
  }

  // Fallback: Use a View with the first gradient color as background
  const fallbackColor = colors?.[0] || '#FFD700';
  
  return (
    <View style={[style, { backgroundColor: fallbackColor }]}>
      {children}
    </View>
  );
}

// Default export for convenience
export default SafeLinearGradient;

// Re-export for drop-in replacement
export { SafeLinearGradient as LinearGradient };
