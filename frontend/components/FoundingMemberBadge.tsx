/**
 * FoundingMemberBadge — small gold pill displayed next to the username on
 * the profile screen for accounts created before the Phase D cutoff.
 *
 * Visually quiet by design: gold ring, transparent fill, tiny star icon.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/brand';

interface Props {
  size?: 'sm' | 'md';
  testID?: string;
}

export function FoundingMemberBadge({ size = 'md', testID }: Props) {
  const compact = size === 'sm';
  return (
    <View style={styles.wrap} testID={testID} data-testid={testID}>
      <View style={[styles.pill, compact && styles.pillSm]}>
        <Ionicons
          name="star"
          size={compact ? 9 : 10}
          color={COLORS.accent}
          style={styles.icon}
        />
        <Text style={[styles.label, compact && styles.labelSm]}>FOUNDING MEMBER</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-start',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,215,0,0.35)',
    backgroundColor: 'transparent',
  },
  pillSm: {
    paddingVertical: 1,
    paddingHorizontal: 6,
  },
  icon: {
    marginRight: 4,
    opacity: 0.85,
  },
  label: {
    fontSize: 8.5,
    letterSpacing: 1.0,
    color: 'rgba(255,215,0,0.85)',
    fontWeight: '600',
  },
  labelSm: {
    fontSize: 7.5,
    letterSpacing: 0.9,
  },
  caption: {
    marginTop: 3,
    fontSize: 10,
    color: 'rgba(255,255,255,0.38)',
    fontStyle: 'italic',
  },
});
