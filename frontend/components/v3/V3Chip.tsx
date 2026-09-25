/**
 * V3Chip — the one selectable pill used across V3 Home (States, soreness,
 * Target, duration). Selected = brand gradient with dark ink (never
 * gold-on-gold); unselected = quiet surface with a hairline.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: string;
  badge?: string;
  size?: 'md' | 'sm';
  muted?: boolean;
  /** Fill the grid cell and center the content. */
  block?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function V3Chip({ label, selected, onPress, icon, badge, size = 'md', muted, block, style, testID }: Props) {
  const small = size === 'sm';
  const content = (
    <View style={[styles.inner, small && styles.innerSm, block && styles.innerBlock]}>
      {icon && !block ? (
        <Ionicons name={icon as any} size={small ? 13 : 15} color={selected ? COLORS.accentInk : 'rgba(255,255,255,0.78)'} />
      ) : null}
      <Text
        numberOfLines={1}
        style={[styles.label, small && styles.labelSm, selected && styles.labelOn, muted && !selected && styles.labelMuted]}
      >
        {label}
      </Text>
      {badge ? (
        <View style={[styles.badge, selected && styles.badgeOn]}>
          <Text style={[styles.badgeText, selected && styles.badgeTextOn]}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      testID={testID}
      style={({ pressed }) => [styles.base, small && styles.baseSm, pressed && styles.pressed, style]}
    >
      {selected ? (
        <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.fill, styles.off]}>{content}</View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 22, overflow: 'hidden' },
  baseSm: { borderRadius: 18 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  fill: { borderRadius: 22 },
  off: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 15, paddingVertical: 10 },
  innerBlock: { justifyContent: 'center', paddingHorizontal: 6, paddingVertical: 12 },
  innerSm: { paddingHorizontal: 12, paddingVertical: 7, gap: 5 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, letterSpacing: 0.1 },
  labelSm: { fontSize: 13 },
  labelOn: { color: COLORS.accentInk },
  labelMuted: { color: COLORS.textSecondary },
  badge: { marginLeft: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)' },
  badgeOn: { backgroundColor: 'rgba(12,12,12,0.14)' },
  badgeText: { fontSize: 10, fontWeight: '700', color: COLORS.accent, letterSpacing: 0.4 },
  badgeTextOn: { color: COLORS.accentInk },
});
