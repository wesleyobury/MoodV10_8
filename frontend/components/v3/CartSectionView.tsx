/**
 * CartSectionView: one programming section of the V3 Workout Cart (founder review pass).
 *
 *   PRIMARY · Chest · Triceps                     2 exercises · ~14 min
 *   ┌───────────────────────────────────────────┐
 *   │ [thumb]  Barbell Bench Press      4 × 5–7 │   straight blocks inside a section need no label of their own
 *   │ [thumb]  Incline DB Press         3 × 8–10│
 *   │ SUPERSET · 3 ROUNDS                       │   grouped / clocked blocks keep their structure line
 *   │ A1 [thumb] Lateral Raise          12–15   │
 *   └───────────────────────────────────────────┘
 *
 * Primary work is gold and larger; Secondary / Accessories / Finisher are neutral.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../../constants/brand';
import type { ScanSection } from '../../utils/v3CartFormat';
import type { V3Item } from '../../utils/v3Api';
import type { TermId } from '../../utils/v3PlainLanguage';
import { CartBlockView } from './CartBlockView';

interface Props {
  section: ScanSection;
  onOpen: (item: V3Item) => void;
  highlightItemId?: string | null;
  onSwap?: (item: V3Item) => void;
  swappingItemId?: string | null;
  onTerm?: (t: TermId) => void;
}

export function CartSectionView({ section, ...rest }: Props) {
  const main = section.emphasis === 'main';
  const meta = [`${section.exercises} ${section.exercises === 1 ? 'exercise' : 'exercises'}`, section.minutes ? `~${Math.round(section.minutes)} min` : null].filter(Boolean).join(' · ');
  return (
    <View style={styles.section} testID={`v3-cart-section-${section.key}`}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, main && styles.titleMain]} testID="v3-cart-section-title">{section.title}</Text>
          {section.muscles ? <Text style={styles.muscles}>{section.muscles}</Text> : null}
        </View>
        <Text style={styles.meta}>{meta}</Text>
      </View>
      <View style={[styles.card, main && styles.cardMain]}>
        {section.blocks.map((b, i) => (
          <CartBlockView key={b.key} block={b} inSection first={i === 0} {...rest} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 28 },
  head: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, paddingHorizontal: 2, marginBottom: 10 },
  title: { fontSize: 13, fontWeight: '800', letterSpacing: 2, color: COLORS.textSecondary },
  titleMain: { fontSize: 15, color: COLORS.accent },
  muscles: { fontSize: 13, fontWeight: '600', color: COLORS.textTertiary, marginTop: 3 },
  meta: { fontSize: 12.5, fontWeight: '600', color: COLORS.textTertiary, fontVariant: ['tabular-nums'], paddingBottom: 1 },
  card: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.09)' },
  cardMain: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.14)' },
});
