/**
 * PickRotator: on Build's MOOD's Pick card, cycles the session types MOOD's Pick can choose for this athlete
 * (utils/v3HomeModel moodsPickRotation), so the variety is visible before they build. One name at a time, a soft
 * vertical slide; a single possible type (1–2 day Strength = Full Body) just sits still.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/brand';

const HOLD_MS = 1500;

export function PickRotator({ names, testID }: { names: string[]; testID?: string }) {
  const [i, setI] = useState(0);
  const v = useRef(new Animated.Value(1)).current;
  const key = names.join('|');
  useEffect(() => { setI(0); v.setValue(1); }, [key, v]);
  useEffect(() => {
    if (names.length < 2) return;
    const t = setTimeout(() => {
      Animated.timing(v, { toValue: 0, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
        setI((x) => (x + 1) % names.length);
        Animated.timing(v, { toValue: 1, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      });
    }, HOLD_MS);
    return () => clearTimeout(t);
  }, [i, key, names.length, v]);
  if (!names.length) return null;
  return (
    <View style={styles.row} testID={testID}>
      <View style={styles.dot} />
      <Text style={styles.lead}>{names.length > 1 ? 'Could be' : 'Every session'}</Text>
      <View style={styles.window}>
        <Animated.Text
          style={[styles.name, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }] }]}
          numberOfLines={1}
        >
          {names[i % names.length]}
        </Animated.Text>
      </View>
      {names.length > 1 ? <Text style={styles.count}>{`${(i % names.length) + 1}/${names.length}`}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.accent, marginRight: 8 },
  lead: { fontSize: 12.5, color: COLORS.textTertiary, marginRight: 6 },
  window: { flex: 1, height: 20, justifyContent: 'center', overflow: 'hidden' },
  name: { fontSize: 13.5, fontWeight: '700', color: COLORS.textPrimary },
  count: { fontSize: 11, color: COLORS.textTertiary, marginLeft: 8, fontVariant: ['tabular-nums'] },
});
