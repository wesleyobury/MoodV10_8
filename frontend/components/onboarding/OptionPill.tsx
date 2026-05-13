/**
 * OptionPill — a single tap target for funnel questions.
 *
 * Renders a tall pill with the option label. When selected, the border
 * adopts the brand accent and a soft glow fills the background. Used for
 * Screens 3–7 (single-select questions).
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/brand';

interface OptionPillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  description?: string;
  testID?: string;
}

export function OptionPill({ label, selected, onPress, description, testID }: OptionPillProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        selected && styles.pillSelected,
        pressed && styles.pillPressed,
      ]}
      testID={testID}
      data-testid={testID}
    >
      <View style={styles.row}>
        <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
        {selected ? <View style={styles.dot} /> : null}
      </View>
      {description ? (
        <Text style={[styles.description, selected && styles.descriptionSelected]}>{description}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  pillSelected: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(255,215,0,0.06)',
  },
  pillPressed: {
    opacity: 0.85,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.textPrimary,
    letterSpacing: -0.2,
  },
  labelSelected: {
    color: COLORS.textPrimary,
  },
  description: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textTertiary,
  },
  descriptionSelected: {
    color: COLORS.textSecondary,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
  },
});
