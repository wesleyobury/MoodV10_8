/**
 * ConflictSheet — MOOD helping, not an error. Shows the API's conflict
 * message and exactly the options it returned; the caller applies the chosen
 * option's `patch` and regenerates (or opens the picker for a null patch).
 */
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeLinearGradient as LinearGradient } from '../SafeLinearGradient';
import { BRAND_GRADIENT, COLORS } from '../../constants/brand';
import type { V3Conflict, V3ConflictOption } from '../../utils/v3Api';

interface Props {
  conflict: V3Conflict | null;
  onSelect: (option: V3ConflictOption, index: number) => void;
  onClose: () => void;
}

export function ConflictSheet({ conflict, onSelect, onClose }: Props) {
  return (
    <Modal visible={!!conflict} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={styles.sheet} testID="v3-conflict">
        <View style={styles.grip} />
        <View style={styles.iconWrap}>
          <Ionicons name="compass-outline" size={20} color={COLORS.accent} />
        </View>
        <Text style={styles.title}>Let's adjust today</Text>
        <Text style={styles.message}>{conflict?.message}</Text>
        <View style={styles.options}>
          {(conflict?.options ?? []).filter((o) => o.action !== 'cancel').map((o, i) =>
            i === 0 ? (
              <Pressable key={`${o.action}-${i}`} onPress={() => onSelect(o, i)} testID={`v3-conflict-option-${i}`}>
                <LinearGradient colors={[...BRAND_GRADIENT]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primary}>
                  <Text style={styles.primaryText}>{o.label}</Text>
                </LinearGradient>
              </Pressable>
            ) : (
              <Pressable
                key={`${o.action}-${i}`}
                onPress={() => onSelect(o, i)}
                style={({ pressed }) => [styles.secondary, pressed && { opacity: 0.7 }]}
                testID={`v3-conflict-option-${i}`}
              >
                <Text style={styles.secondaryText}>{o.label}</Text>
              </Pressable>
            ),
          )}
        </View>
        {/* The API's own "Cancel" option (patch null) and our dismiss do the same thing. */}
        <Pressable onPress={onClose} style={styles.dismiss} hitSlop={8} testID="v3-conflict-dismiss">
          <Text style={styles.dismissText}>{(conflict?.options ?? []).find((o) => o.action === 'cancel')?.label ?? 'Not now'}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 34,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#141414',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  grip: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 18 },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  title: { fontSize: 21, fontWeight: '800', color: COLORS.textPrimary, marginTop: 14, letterSpacing: -0.3 },
  message: { fontSize: 15, lineHeight: 22, color: COLORS.textSecondary, marginTop: 6 },
  options: { marginTop: 20, gap: 10 },
  primary: { height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 16, fontWeight: '700', color: COLORS.accentInk },
  secondary: {
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  secondaryText: { fontSize: 15.5, fontWeight: '600', color: COLORS.textPrimary },
  dismiss: { alignSelf: 'center', marginTop: 14, padding: 6 },
  dismissText: { fontSize: 14, color: COLORS.textTertiary },
});
