/**
 * ReactionLine — a single answer-specific one-liner shown beneath the
 * options once a selection exists (Goal / Level / Barrier steps).
 *
 * Gold bullet + italic-weight text. Purely presentational.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/brand';

interface ReactionLineProps {
  text?: string;
  testID?: string;
}

export function ReactionLine({ text, testID }: ReactionLineProps) {
  if (!text) return null;
  return (
    <View style={styles.row} testID={testID} data-testid={testID}>
      <View style={styles.bullet} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
    marginTop: 7,
    marginRight: 10,
  },
  text: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    letterSpacing: -0.1,
  },
});
