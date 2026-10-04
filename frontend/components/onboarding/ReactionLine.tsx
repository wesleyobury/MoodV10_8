/**
 * ReactionLine — a single answer-specific one-liner shown beneath the
 * options once a selection exists (Goal / Level / Barrier steps).
 *
 * Gold bullet + italic-weight text. Purely presentational.
 */

import React from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeLinearGradient as LinearGradient } from '../SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';

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

/* ------------------------------------------------------------------ V3: ReactionCard */


interface ReactionCardProps {
  /** What changed, e.g. "Default set · Strength". */
  tag: string;
  /** How, in one line. */
  text: string;
  /** Re-animates whenever this changes (the selected option). */
  selectionKey: string;
  testID?: string;
}

/**
 * The consequence of an answer, written as MOOD's reply: a gold tag naming the setting that changed and one line on
 * what it means. Slides in on every new selection so each tap reads as MOOD reacting.
 */
export function ReactionCard({ tag, text, selectionKey, testID }: ReactionCardProps) {
  const v = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [selectionKey, v]);
  return (
    <Animated.View
      style={[cardStyles.row, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}
      testID={testID}
      data-testid={testID}
    >
      <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={cardStyles.bar} />
      <View style={cardStyles.body}>
        <Text style={cardStyles.tag}>{tag}</Text>
        <Text style={cardStyles.text}>{text}</Text>
      </View>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch' },
  bar: { width: 2, borderRadius: 1, marginRight: 14 },
  body: { flex: 1, paddingVertical: 2 },
  tag: { fontSize: 10.5, letterSpacing: 1.6, fontWeight: '700', color: COLORS.accent, textTransform: 'uppercase' },
  text: { marginTop: 6, fontSize: 14.5, lineHeight: 21, color: 'rgba(255,255,255,0.86)', letterSpacing: -0.1 },
});
