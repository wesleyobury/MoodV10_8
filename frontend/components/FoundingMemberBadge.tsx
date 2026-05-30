/**
 * FoundingMemberBadge — MOOD V2 founding identity marker.
 *
 * LOCKED visual (spec 2.3): lightning bolt on a gold→orange gradient circle.
 * Permanent identity — renders for any user with `founding_member = true`,
 * regardless of whether they claimed the founding pricing.
 *
 * Backwards-compatible props (`size`, `testID`); added 'lg' for profile header.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from './SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../constants/brand';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  testID?: string;
}

const DIMS = { sm: 14, md: 20, lg: 32 } as const;
const ICON = { sm: 8, md: 12, lg: 19 } as const;

export function FoundingMemberBadge({ size = 'md', testID }: Props) {
  const dim = DIMS[size];
  const icon = ICON[size];
  return (
    <View style={styles.wrap} testID={testID} data-testid={testID}>
      <LinearGradient
        colors={[...BRAND_GRADIENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.circle, { width: dim, height: dim, borderRadius: dim / 2 }]}
      >
        <Ionicons name="flash" size={icon} color={COLORS.accentInk} />
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FoundingMemberBadge;
