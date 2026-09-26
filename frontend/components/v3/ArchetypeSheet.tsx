/**
 * ArchetypeSheet: the lightweight session-type picker (Phase 2.5). MOOD's Pick is always first and is the default.
 * Options come from the backend registry mirror in v3HomeModel.ARCHETYPES. Used on Home and on the Workout Preview.
 */
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/brand';
import type { V3Direction } from '../../utils/v3Api';
import { ARCHETYPES, DIRECTION_NAME } from '../../utils/v3HomeModel';

interface Props {
  visible: boolean;
  direction: V3Direction;
  /** null = MOOD's Pick. */
  selected: string | null;
  /** Shown under the title, e.g. why picking a type clears a Target. */
  note?: string | null;
  onSelect: (archetype: string | null) => void;
  onClose: () => void;
}

export function ArchetypeSheet({ visible, direction, selected, note, onSelect, onClose }: Props) {
  const options: { id: string | null; name: string }[] = [{ id: null, name: "MOOD's Pick" }, ...ARCHETYPES[direction]];
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <View style={styles.sheet} testID="v3-archetype-sheet">
        <View style={styles.grip} />
        <Text style={styles.title}>{DIRECTION_NAME[direction]} type</Text>
        {note ? <Text style={styles.note}>{note}</Text> : null}
        <View style={styles.list}>
          {options.map((o) => {
            const on = o.id === selected;
            return (
              <Pressable
                key={o.id ?? 'moods_pick'}
                onPress={() => onSelect(o.id)}
                style={({ pressed }) => [styles.row, on && styles.rowOn, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                testID={`v3-archetype-${o.id ?? 'moods_pick'}`}
              >
                {o.id === null ? <Ionicons name="sparkles" size={15} color={COLORS.accent} /> : null}
                <Text style={[styles.rowText, on && styles.rowTextOn]}>{o.name}</Text>
                {on ? <Ionicons name="checkmark" size={18} color={COLORS.accent} /> : null}
              </Pressable>
            );
          })}
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 34,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: '#141414',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  grip: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 16 },
  title: { fontSize: 19, fontWeight: '800', color: COLORS.textPrimary, letterSpacing: -0.2 },
  note: { fontSize: 13, lineHeight: 19, color: COLORS.textTertiary, marginTop: 4 },
  list: { marginTop: 14, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, paddingHorizontal: 12, borderRadius: 12 },
  rowOn: { backgroundColor: 'rgba(255,215,0,0.08)' },
  rowText: { flex: 1, fontSize: 15.5, fontWeight: '600', color: COLORS.textPrimary },
  rowTextOn: { color: COLORS.accent },
});
