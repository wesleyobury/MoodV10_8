/**
 * FoundingMemberBadge — small gold pill displayed next to the username on
 * the profile screen for accounts created before the Phase D cutoff.
 *
 * Visually quiet by design: gold ring, transparent fill, tiny lock-open
 * icon. Pairs with the subhead caption "Day-one MOOD." per the v1.0 spec.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/brand';

interface Props {
  size?: 'sm' | 'md';
  caption?: boolean;
  testID?: string;
}

export function FoundingMemberBadge({ size = 'md', caption = false, testID }: Props) {
  const compact = size === 'sm';
  return (
    <View style={styles.wrap} testID={testID} data-testid={testID}>
      <View style={[styles.pill, compact && styles.pillSm]}>
        <Ionicons
          name="star"
          size={compact ? 11 : 13}
          color={COLORS.accent}
          style={styles.icon}
        />
        <Text style={[styles.label, compact && styles.labelSm]}>FOUNDING MEMBER</Text>
      </View>
      {caption ? <Text style={styles.caption}>Day-one MOOD.</Text> : null}
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
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.55)',
    backgroundColor: 'rgba(255,215,0,0.08)',
  },
  pillSm: {
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 10,
    letterSpacing: 1.4,
    color: COLORS.accent,
    fontWeight: '700',
  },
  labelSm: {
    fontSize: 9,
    letterSpacing: 1.2,
  },
  caption: {
    marginTop: 4,
    fontSize: 11,
    color: 'rgba(255,255,255,0.42)',
    fontStyle: 'italic',
  },
});
