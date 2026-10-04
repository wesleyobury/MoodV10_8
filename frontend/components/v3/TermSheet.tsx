/**
 * TermSheet: a short plain-English definition for a training term MOOD intentionally shows (founder edit pass).
 * Plain English first everywhere; this is the "what does that mean?" layer, one tap away and never required.
 */
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/brand';
import { TRAINING_TERMS, TermId } from '../../utils/v3PlainLanguage';

export function TermSheet({ term, onClose }: { term: TermId | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const t = term ? TRAINING_TERMS[term] : null;
  return (
    <Modal visible={!!t} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
      {t ? (
        <View style={[styles.card, { marginBottom: insets.bottom + 24 }]} testID="v3-term-sheet">
          <View style={styles.head}>
            <Ionicons name="book-outline" size={15} color={COLORS.accent} />
            <Text style={styles.label}>TRAINING TERM</Text>
          </View>
          <Text style={styles.term}>{t.term}</Text>
          <Text style={styles.def}>{t.definition}</Text>
          <Pressable onPress={onClose} style={styles.ok} testID="v3-term-ok">
            <Text style={styles.okText}>Got it</Text>
          </Pressable>
        </View>
      ) : null}
    </Modal>
  );
}

/** A row of tappable term chips ("Top set", "EMOM" ...). Renders nothing when there are no terms. */
export function TermChips({ terms, onPick, style }: { terms: TermId[]; onPick: (t: TermId) => void; style?: any }) {
  if (!terms.length) return null;
  return (
    <View style={[styles.chips, style]} testID="v3-term-chips">
      <Ionicons name="information-circle-outline" size={14} color={COLORS.textTertiary} />
      {terms.map((id) => (
        <Pressable key={id} onPress={() => onPick(id)} hitSlop={6} style={styles.chip} testID={`v3-term-${id}`}>
          <Text style={styles.chipText}>{TRAINING_TERMS[id].term}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  card: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 0,
    padding: 20,
    borderRadius: 22,
    backgroundColor: COLORS.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.6, color: COLORS.textTertiary },
  term: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginTop: 8, letterSpacing: -0.3 },
  def: { fontSize: 15, lineHeight: 22, color: COLORS.textSecondary, marginTop: 6 },
  ok: { alignSelf: 'flex-end', marginTop: 14, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)' },
  okText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  chip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.2)' },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, textDecorationLine: 'underline', textDecorationStyle: 'dotted' },
});
